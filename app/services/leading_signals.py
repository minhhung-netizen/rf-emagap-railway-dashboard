from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any


LEADING_SIGNAL_ACTIONS = {
    "setup_bull",
    "setup_bear",
    "momentum_bull",
    "momentum_bear",
}
DEFAULT_VALID_FOR_DAYS = 30


def is_leading_signal_action(action: Any) -> bool:
    return str(action or "").strip().lower() in LEADING_SIGNAL_ACTIONS


def build_leading_signal_feed(
    signals: list[dict[str, Any]], *, now: datetime | None = None
) -> dict[str, Any]:
    reference_time = _as_utc(now) if now else datetime.now(timezone.utc)
    gated_buys = [
        signal
        for signal in signals
        if str(signal.get("action") or "").lower() == "buy"
        and _portfolio_gate(signal) is not None
    ]
    rows = []
    for signal in signals:
        if not is_leading_signal_action(signal.get("action")):
            continue
        detected_at = _signal_datetime(signal)
        if detected_at is None:
            continue
        expires_at = detected_at + timedelta(days=_valid_for_days(signal))
        matched_buy = _first_matching_buy(signal, gated_buys, detected_at, expires_at)
        gate = _portfolio_gate(matched_buy) if matched_buy else None
        status = "expired" if reference_time > expires_at else "active"
        if matched_buy:
            sleeve = str((gate or {}).get("sleeve") or "").strip().lower()
            status = f"matched_{sleeve}" if sleeve in {"rf", "ema"} else "matched"
        payload = signal.get("payload") or {}
        leading = payload.get("leading_signal") or {}
        rows.append(
            {
                "id": signal.get("id"),
                "ticker": signal.get("ticker"),
                "action": signal.get("action"),
                "event": payload.get("event") or leading.get("event") or signal.get("action"),
                "strategy": signal.get("strategy"),
                "timeframe": signal.get("timeframe"),
                "price": signal.get("price"),
                "detected_at": _signal_time(signal),
                "pivot_time": payload.get("pivot_time"),
                "pivot_price": _number(payload.get("pivot_price")),
                "rsi_value": _number(payload.get("rsi_value")),
                "ema_fast": _number(payload.get("ema_fast")),
                "ema_slow": _number(payload.get("ema_slow")),
                "valid_for_days": _valid_for_days(signal),
                "expires_at": expires_at.isoformat(),
                "status": status,
                "matched_signal_id": matched_buy.get("id") if matched_buy else None,
                "matched_strategy": matched_buy.get("strategy") if matched_buy else None,
                "matched_at": _signal_time(matched_buy) if matched_buy else None,
                "lead_days": _lead_days(detected_at, _signal_datetime(matched_buy))
                if matched_buy
                else None,
            }
        )
    rows.sort(key=lambda row: str(row.get("detected_at") or ""), reverse=True)
    return {
        "leading_signals": rows,
        "summary": {
            "total": len(rows),
            "active": sum(row["status"] == "active" for row in rows),
            "matched": sum(str(row["status"]).startswith("matched") for row in rows),
            "expired": sum(row["status"] == "expired" for row in rows),
        },
    }


def attach_leading_signals(
    performance: dict[str, Any], signals: list[dict[str, Any]]
) -> dict[str, Any]:
    result = deepcopy(performance)
    matched_by_entry: dict[int, list[dict[str, Any]]] = {}
    for row in build_leading_signal_feed(signals)["leading_signals"]:
        entry_signal_id = row.get("matched_signal_id")
        if entry_signal_id is None:
            continue
        matched_by_entry.setdefault(int(entry_signal_id), []).append(
            {
                "signal_id": row.get("id"),
                "action": row.get("action"),
                "event": row.get("event"),
                "strategy": row.get("strategy"),
                "timeframe": row.get("timeframe"),
                "price": row.get("price"),
                "time": row.get("detected_at"),
                "lead_days": row.get("lead_days"),
            }
        )
    for collection in ("open_trades", "closed_trades"):
        for trade in result.get(collection, []):
            entry_signal_id = trade.get("entry_signal_id")
            matches = list(matched_by_entry.get(int(entry_signal_id), [])) if entry_signal_id else []
            matches.sort(key=lambda item: str(item.get("time") or ""), reverse=True)
            trade["leading_signals"] = matches
            trade["has_leading_bull"] = any(
                str(item.get("action") or "").endswith("_bull") for item in matches
            )
    return result


def _first_matching_buy(
    leading_signal: dict[str, Any],
    buys: list[dict[str, Any]],
    detected_at: datetime,
    expires_at: datetime,
) -> dict[str, Any] | None:
    ticker = str(leading_signal.get("ticker") or "").upper()
    candidates = []
    for signal in buys:
        if str(signal.get("ticker") or "").upper() != ticker:
            continue
        signal_at = _signal_datetime(signal)
        if signal_at is not None and detected_at <= signal_at <= expires_at:
            candidates.append((signal_at, signal))
    return min(candidates, key=lambda item: item[0])[1] if candidates else None


def _portfolio_gate(signal: dict[str, Any] | None) -> dict[str, Any] | None:
    payload = (signal or {}).get("payload") or {}
    gate = payload.get("portfolio_gate") if isinstance(payload, dict) else None
    return gate if isinstance(gate, dict) and gate.get("version") == 1 else None


def _valid_for_days(signal: dict[str, Any]) -> int:
    payload = signal.get("payload") or {}
    try:
        value = int(float(payload.get("valid_for_days", DEFAULT_VALID_FOR_DAYS)))
    except (TypeError, ValueError):
        value = DEFAULT_VALID_FOR_DAYS
    return max(1, min(value, 180))


def _signal_time(signal: dict[str, Any] | None) -> str | None:
    if not signal:
        return None
    return signal.get("source_time") or signal.get("received_at")


def _signal_datetime(signal: dict[str, Any] | None) -> datetime | None:
    return _parse_datetime(_signal_time(signal))


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return _as_utc(parsed)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _lead_days(start: datetime, end: datetime | None) -> float | None:
    if end is None:
        return None
    return round(max(0.0, (end - start).total_seconds()) / 86400, 2)


def _number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None
