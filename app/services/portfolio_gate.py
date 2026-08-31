from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any


DEFAULT_GUARDRAILS = {
    "total_exposure_cap": 0.95,
    "sector_cap": 0.35,
    "ticker_cap": 0.10,
    "rf_hard_cap": 0.75,
    "ema_hard_cap": 0.40,
    "same_symbol_policy": "confirm-topup",
    "rebalance": "RF 3 tháng; EMA 6 tháng; review danh mục hàng quý.",
}
GATE_VERSION = 1
_SECTOR_PATH = Path(__file__).resolve().parents[1] / "data" / "vn_sectors.json"


def load_sector_map() -> dict[str, str]:
    try:
        return {
            str(symbol).upper(): str(sector).strip().lower()
            for symbol, sector in json.loads(_SECTOR_PATH.read_text(encoding="utf-8")).items()
            if str(sector).strip()
        }
    except (OSError, ValueError):
        return {}


SECTOR_MAP = load_sector_map()


def guardrails_from_backtest(backtest: dict[str, Any] | None) -> dict[str, Any]:
    configured = ((backtest or {}).get("summary") or {}).get("guardrails") or {}
    guardrails = dict(DEFAULT_GUARDRAILS)
    for key in (
        "total_exposure_cap",
        "sector_cap",
        "ticker_cap",
        "rf_hard_cap",
        "ema_hard_cap",
    ):
        value = _number(configured.get(key))
        if value is not None and 0 < value <= 1:
            guardrails[key] = value
    if configured.get("same_symbol_policy"):
        guardrails["same_symbol_policy"] = str(configured["same_symbol_policy"])
    if configured.get("rebalance"):
        guardrails["rebalance"] = str(configured["rebalance"])
    return guardrails


def portfolio_gate_state(signals: list[dict[str, Any]]) -> dict[str, Any]:
    positions: dict[tuple[str, str], dict[str, Any]] = {}
    ordered = sorted(signals, key=lambda item: (str(item.get("received_at") or ""), item.get("id", 0)))
    for signal in ordered:
        payload = signal.get("payload") or {}
        gate = payload.get("portfolio_gate") if isinstance(payload, dict) else None
        if not isinstance(gate, dict) or gate.get("version") != GATE_VERSION:
            continue
        action = str(signal.get("action") or "").lower()
        ticker = str(signal.get("ticker") or "").upper()
        strategy = _strategy_key(gate.get("position_strategy") or signal.get("strategy"))
        if not ticker or not strategy:
            continue
        key = (ticker, strategy)
        if action == "buy":
            positions[key] = {
                "ticker": ticker,
                "strategy": str(gate.get("position_strategy") or signal.get("strategy") or ""),
                "sleeve": str(gate.get("sleeve") or "").upper(),
                "sector": str(gate.get("sector") or "").lower(),
                "allocation_pct": _number(gate.get("allocation_pct")) or 0,
                "entry_time": signal.get("source_time") or signal.get("received_at"),
            }
        elif action == "confirm_buy" and key in positions:
            positions[key]["allocation_pct"] += _number(gate.get("allocation_pct")) or 0
        elif action == "sell":
            positions.pop(key, None)

    rows = list(positions.values())
    by_ticker: dict[str, float] = defaultdict(float)
    by_sector: dict[str, float] = defaultdict(float)
    by_sleeve: dict[str, float] = defaultdict(float)
    for position in rows:
        weight = position["allocation_pct"]
        by_ticker[position["ticker"]] += weight
        by_sector[position["sector"]] += weight
        by_sleeve[position["sleeve"]] += weight
    return {
        "positions": sorted(rows, key=lambda row: (row["ticker"], row["strategy"])),
        "total_exposure_pct": sum(by_ticker.values()),
        "by_ticker_pct": dict(by_ticker),
        "by_sector_pct": dict(by_sector),
        "by_sleeve_pct": dict(by_sleeve),
    }


def evaluate_portfolio_signal(
    *,
    payload: dict[str, Any],
    ticker: str,
    exchange: str | None,
    action: str,
    signals: list[dict[str, Any]],
    backtest: dict[str, Any] | None,
    default_allocation_pct: float,
    base_strategy: str | None = None,
    sector_map: dict[str, str] | None = None,
) -> dict[str, Any]:
    guardrails = guardrails_from_backtest(backtest)
    state = portfolio_gate_state(signals)
    strategy = str(payload.get("strategy") or "").strip()
    strategy_key = _strategy_key(strategy)
    open_positions = {
        (row["ticker"], _strategy_key(row["strategy"])): row for row in state["positions"]
    }

    if action == "sell":
        current = open_positions.get((ticker, strategy_key))
        if current is None:
            return _rejected("portfolio_position_not_open", state, guardrails)
        return _accepted(
            state,
            guardrails,
            sleeve=current["sleeve"],
            sector=current["sector"],
            allocation_pct=0,
            position_strategy=current["strategy"],
        )

    if action == "confirm_sell":
        return _accepted(
            state,
            guardrails,
            sleeve=classify_sleeve(payload),
            sector=sector_for(ticker, exchange, payload),
            allocation_pct=0,
            position_strategy=strategy,
        )

    if action == "confirm_buy":
        target = str(base_strategy or "").strip()
        current = open_positions.get((ticker, _strategy_key(target)))
        if current is None:
            return _rejected("portfolio_base_position_not_open", state, guardrails)
        sleeve = current["sleeve"]
        sector = current["sector"]
        position_strategy = current["strategy"]
    elif action == "buy":
        sleeve = classify_sleeve(payload)
        sector = sector_for(ticker, exchange, payload, sector_map=sector_map)
        position_strategy = strategy
        if sleeve is None:
            return _rejected("unsupported_portfolio_strategy", state, guardrails)
        if sector is None:
            return _rejected("sector_not_mapped", state, guardrails)
        if state["by_ticker_pct"].get(ticker, 0) > 0:
            return _rejected("same_ticker_position_open", state, guardrails)
    else:
        return _rejected("unsupported_portfolio_action", state, guardrails)

    requested_pct = allocation_pct(payload, default_allocation_pct)
    if requested_pct is None:
        return _rejected("invalid_allocation_pct", state, guardrails)
    reason = _allocation_rejection_reason(
        state=state,
        guardrails=guardrails,
        ticker=ticker,
        sector=sector,
        sleeve=sleeve,
        requested_pct=requested_pct,
    )
    if reason:
        return _rejected(reason, state, guardrails)
    return _accepted(
        state,
        guardrails,
        sleeve=sleeve,
        sector=sector,
        allocation_pct=requested_pct,
        position_strategy=position_strategy,
    )


def classify_sleeve(payload: dict[str, Any]) -> str | None:
    explicit = str(payload.get("sleeve") or payload.get("portfolio_sleeve") or "").strip().upper()
    if explicit in {"RF", "EMA"}:
        return explicit
    strategy = str(payload.get("strategy") or "").lower()
    if "rf" in strategy:
        return "RF"
    if "ema" in strategy or "gap" in strategy:
        return "EMA"
    return None


def sector_for(
    ticker: str,
    exchange: str | None,
    payload: dict[str, Any],
    *,
    sector_map: dict[str, str] | None = None,
) -> str | None:
    explicit = str(payload.get("sector") or "").strip().lower()
    if explicit:
        return explicit
    configured = sector_map or {}
    mapped = configured.get(ticker.upper()) or configured.get(
        f"{exchange}:{ticker}".upper() if exchange else ""
    )
    if mapped:
        return str(mapped).strip().lower()
    symbol = f"{exchange}:{ticker}".upper() if exchange else ticker.upper()
    return SECTOR_MAP.get(symbol)


def allocation_pct(payload: dict[str, Any], default_allocation_pct: float) -> float | None:
    value = _number(payload.get("allocation_pct"))
    if value is None:
        value = default_allocation_pct
    return value if 0 < value <= 100 else None


def _allocation_rejection_reason(
    *,
    state: dict[str, Any],
    guardrails: dict[str, Any],
    ticker: str,
    sector: str,
    sleeve: str,
    requested_pct: float,
) -> str | None:
    epsilon = 1e-9
    if state["total_exposure_pct"] + requested_pct > guardrails["total_exposure_cap"] * 100 + epsilon:
        return "total_exposure_cap"
    if state["by_ticker_pct"].get(ticker, 0) + requested_pct > guardrails["ticker_cap"] * 100 + epsilon:
        return "ticker_cap"
    if state["by_sector_pct"].get(sector, 0) + requested_pct > guardrails["sector_cap"] * 100 + epsilon:
        return "sector_cap"
    sleeve_cap = guardrails["rf_hard_cap"] if sleeve == "RF" else guardrails["ema_hard_cap"]
    if state["by_sleeve_pct"].get(sleeve, 0) + requested_pct > sleeve_cap * 100 + epsilon:
        return f"{sleeve.lower()}_sleeve_cap"
    return None


def _accepted(
    state: dict[str, Any],
    guardrails: dict[str, Any],
    *,
    sleeve: str | None,
    sector: str | None,
    allocation_pct: float,
    position_strategy: str,
) -> dict[str, Any]:
    return {
        "allowed": True,
        "state": state,
        "guardrails": guardrails,
        "classification": {
            "version": GATE_VERSION,
            "sleeve": sleeve,
            "sector": sector,
            "allocation_pct": allocation_pct,
            "position_strategy": position_strategy,
        },
    }


def _rejected(reason: str, state: dict[str, Any], guardrails: dict[str, Any]) -> dict[str, Any]:
    return {"allowed": False, "reason": reason, "state": state, "guardrails": guardrails}


def _strategy_key(value: Any) -> str:
    return str(value or "").strip().lower()


def _number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None
