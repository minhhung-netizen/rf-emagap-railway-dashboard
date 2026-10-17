from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo


MARKET_TZ = ZoneInfo("Asia/Ho_Chi_Minh")
_HOLIDAY_PATH = Path(__file__).resolve().parents[1] / "data" / "hose_holidays.json"


def _load_holiday_calendar() -> tuple[frozenset[date], date | None]:
    try:
        data = json.loads(_HOLIDAY_PATH.read_text(encoding="utf-8"))
        holidays = frozenset(date.fromisoformat(day) for day in data.get("holidays") or {})
        covered = data.get("covered_through")
        return holidays, date.fromisoformat(covered) if covered else None
    except (OSError, ValueError, TypeError):
        return frozenset(), None


HOSE_HOLIDAYS, HOLIDAYS_COVERED_THROUGH = _load_holiday_calendar()


def is_trading_day(day: date) -> bool:
    """Weekday that is not a declared HOSE holiday (undeclared years count every weekday)."""
    return day.weekday() < 5 and day not in HOSE_HOLIDAYS


def trading_days_between(start: date, end: date) -> int:
    """Trading days after ``start`` up to and including ``end``."""
    return sum(is_trading_day(start + timedelta(days=i)) for i in range(1, (end - start).days + 1))


def is_market_open(
    now: datetime | None = None,
    sessions: str = "09:00-11:30,13:00-15:00",
) -> bool:
    current = now or datetime.now(MARKET_TZ)
    if current.tzinfo is None:
        current = current.replace(tzinfo=MARKET_TZ)
    else:
        current = current.astimezone(MARKET_TZ)

    if not is_trading_day(current.date()):
        return False

    current_time = current.time()
    return any(
        start <= current_time <= end for start, end in parse_market_sessions(sessions)
    )


def parse_market_sessions(sessions: str) -> list[tuple[time, time]]:
    parsed = []
    for raw_session in sessions.split(","):
        raw_session = raw_session.strip()
        if not raw_session:
            continue
        start_raw, end_raw = raw_session.split("-", 1)
        parsed.append((_parse_time(start_raw), _parse_time(end_raw)))
    return parsed


def _parse_time(value: str) -> time:
    hour, minute = value.strip().split(":", 1)
    return time(hour=int(hour), minute=int(minute))
