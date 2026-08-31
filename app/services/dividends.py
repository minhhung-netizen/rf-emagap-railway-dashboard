from __future__ import annotations

from datetime import date, datetime
from typing import Any
from zoneinfo import ZoneInfo


UPCOMING_WINDOW_DAYS = 14
MARKET_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def upcoming_dividend_events_for_positions(
    events: list[dict[str, Any]] | None,
    open_tickers: set[str] | list[str] | tuple[str, ...],
    *,
    as_of_date: date | None = None,
    upcoming_window_days: int = UPCOMING_WINDOW_DAYS,
) -> list[dict[str, Any]]:
    today = as_of_date or datetime.now(MARKET_TZ).date()
    allowed = {_normalize_ticker(ticker) for ticker in open_tickers}
    upcoming: list[dict[str, Any]] = []
    for event in events or []:
        ticker = _normalize_ticker(event.get("ticker"))
        ex_date = _parse_date(event.get("ex_date"))
        if ticker not in allowed or ex_date is None:
            continue
        days_until = (ex_date - today).days
        if 0 <= days_until <= upcoming_window_days:
            row = dict(event)
            row["days_until"] = days_until
            row["alert_status"] = "ex_date_today" if days_until == 0 else "upcoming"
            upcoming.append(row)
    return sorted(
        upcoming,
        key=lambda event: (str(event.get("ex_date") or ""), str(event.get("ticker") or "")),
    )


def relevant_dividend_events_for_positions(
    events: list[dict[str, Any]] | None,
    positions: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Return events only for holdings opened strictly before their ex-date."""
    eligible = []
    for position in positions or []:
        ticker = _normalize_ticker(position.get("ticker"))
        entry_date = _parse_date(
            position.get("entry_time") or position.get("entry_date") or position.get("created_at")
        )
        if ticker and entry_date is not None:
            eligible.append((ticker, entry_date))
    if not eligible:
        return []

    result: list[dict[str, Any]] = []
    seen_ids: set[Any] = set()
    for event in events or []:
        ticker = _normalize_ticker(event.get("ticker"))
        ex_date = _parse_date(event.get("ex_date"))
        if not ticker or ex_date is None:
            continue
        if not any(position_ticker == ticker and entry_date < ex_date for position_ticker, entry_date in eligible):
            continue
        event_id = event.get("id")
        if event_id is not None:
            if event_id in seen_ids:
                continue
            seen_ids.add(event_id)
        result.append(dict(event))
    return sorted(result, key=lambda event: (str(event.get("ex_date") or ""), str(event.get("ticker") or "")))


def dividend_adjustment(
    *,
    ticker: str,
    entry_price: float,
    entry_time: str | None,
    valuation_time: str | None,
    dividend_events: list[dict[str, Any]] | None,
    as_of_date: date | None = None,
    include_upcoming: bool = True,
    upcoming_window_days: int = UPCOMING_WINDOW_DAYS,
) -> dict[str, Any]:
    entry_date = _parse_date(entry_time)
    valuation_date = (
        _parse_date(valuation_time) or as_of_date or datetime.now(MARKET_TZ).date()
    )
    today = as_of_date or datetime.now(MARKET_TZ).date()
    adjusted_entry = entry_price
    notes: list[dict[str, Any]] = []

    if entry_price <= 0:
        return _result(entry_price, adjusted_entry, notes)

    matching_events = sorted(
        [
            event
            for event in dividend_events or []
            if _normalize_ticker(event.get("ticker")) == _normalize_ticker(ticker)
        ],
        key=lambda event: str(event.get("ex_date") or ""),
    )

    for event in matching_events:
        ex_date = _parse_date(event.get("ex_date"))
        if ex_date is None:
            continue
        # Buying on the ex-rights date itself is already ex-price and does not
        # entitle the position to that corporate action.
        if entry_date is not None and ex_date <= entry_date:
            continue

        cash_amount = _safe_float(event.get("cash_amount")) or 0.0
        stock_ratio_pct = _safe_float(event.get("stock_ratio_pct")) or 0.0
        issue_ratio_pct = _safe_float(event.get("issue_ratio_pct")) or 0.0
        issue_price = _safe_float(event.get("issue_price")) or 0.0
        has_adjustment = cash_amount > 0 or stock_ratio_pct > 0 or issue_ratio_pct > 0

        if has_adjustment and ex_date <= valuation_date:
            before = adjusted_entry
            denominator = 1 + stock_ratio_pct / 100 + issue_ratio_pct / 100
            adjusted_entry = max(
                0.000001,
                (
                    adjusted_entry
                    - cash_amount
                    + issue_price * issue_ratio_pct / 100
                )
                / denominator,
            )
            notes.append(
                {
                    "status": "applied",
                    "ticker": _normalize_ticker(ticker),
                    "ex_date": ex_date.isoformat(),
                    "cash_amount": cash_amount or None,
                    "stock_ratio_pct": stock_ratio_pct or None,
                    "issue_ratio_pct": issue_ratio_pct or None,
                    "issue_price": issue_price or None,
                    "entry_price_before": before,
                    "entry_price_after": adjusted_entry,
                    "note": event.get("note"),
                }
            )
            continue

        days_until = (ex_date - today).days
        if include_upcoming and 0 <= days_until <= upcoming_window_days:
            notes.append(
                {
                    "status": "upcoming",
                    "ticker": _normalize_ticker(ticker),
                    "ex_date": ex_date.isoformat(),
                    "days_until": days_until,
                    "cash_amount": cash_amount or None,
                    "stock_ratio_pct": stock_ratio_pct or None,
                    "issue_ratio_pct": issue_ratio_pct or None,
                    "issue_price": issue_price or None,
                    "note": event.get("note"),
                }
            )

    return _result(entry_price, adjusted_entry, notes)


def _result(
    original_entry_price: float, adjusted_entry_price: float, notes: list[dict[str, Any]]
) -> dict[str, Any]:
    return {
        "entry_price_original": original_entry_price,
        "entry_price_adjusted": adjusted_entry_price,
        "dividend_adjusted": abs(adjusted_entry_price - original_entry_price) > 0.0000001,
        "dividend_notes": notes,
    }


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    if len(raw) >= 10 and raw[4] == "-" and raw[7] == "-":
        try:
            return date.fromisoformat(raw[:10])
        except ValueError:
            return None
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.date()
    except ValueError:
        return None


def _safe_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_ticker(value: Any) -> str:
    raw = str(value or "").strip().upper()
    return raw.split(":", 1)[1] if ":" in raw else raw
