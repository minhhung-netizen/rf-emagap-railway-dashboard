import unittest
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.services.market_hours import (
    HOLIDAYS_COVERED_THROUGH,
    HOSE_HOLIDAYS,
    is_market_open,
    is_trading_day,
    parse_market_sessions,
    trading_days_between,
)


VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


class MarketHoursTest(unittest.TestCase):
    def test_market_is_open_during_configured_sessions(self):
        now = datetime(2026, 5, 25, 9, 30, tzinfo=VN_TZ)

        self.assertTrue(is_market_open(now))

    def test_market_is_closed_during_lunch_break(self):
        now = datetime(2026, 5, 25, 12, 0, tzinfo=VN_TZ)

        self.assertFalse(is_market_open(now))

    def test_market_is_closed_on_weekends(self):
        now = datetime(2026, 5, 24, 10, 0, tzinfo=VN_TZ)

        self.assertFalse(is_market_open(now))

    def test_market_is_closed_on_declared_hose_holidays(self):
        self.assertFalse(is_market_open(datetime(2026, 9, 1, 10, 0, tzinfo=VN_TZ)))
        self.assertFalse(is_market_open(datetime(2026, 2, 17, 10, 0, tzinfo=VN_TZ)))
        self.assertTrue(is_market_open(datetime(2026, 9, 3, 10, 0, tzinfo=VN_TZ)))

    def test_trading_days_skip_weekends_and_holidays(self):
        # Fri 13/02/2026 -> Mon 23/02/2026 spans the weekend and the Tết closure.
        self.assertEqual(trading_days_between(date(2026, 2, 13), date(2026, 2, 23)), 1)
        self.assertEqual(trading_days_between(date(2026, 2, 23), date(2026, 2, 27)), 4)
        self.assertFalse(is_trading_day(date(2026, 4, 27)))
        self.assertTrue(is_trading_day(date(2026, 4, 28)))

    def test_holiday_calendar_is_weekday_only_and_within_coverage(self):
        self.assertTrue(HOSE_HOLIDAYS)
        self.assertTrue(all(day.weekday() < 5 for day in HOSE_HOLIDAYS))
        self.assertTrue(all(day <= HOLIDAYS_COVERED_THROUGH for day in HOSE_HOLIDAYS))

    def test_market_sessions_are_configurable(self):
        sessions = parse_market_sessions("09:15-11:30,13:00-14:45")

        self.assertEqual(len(sessions), 2)
        self.assertEqual(sessions[0][0].hour, 9)
        self.assertEqual(sessions[0][0].minute, 15)


if __name__ == "__main__":
    unittest.main()
