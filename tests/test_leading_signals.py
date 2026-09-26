from datetime import datetime, timezone
import unittest

from app.services.leading_signals import attach_leading_signals, build_leading_signal_feed


def signal(signal_id, ticker, action, time, *, strategy="Inertial RSI", payload=None):
    return {
        "id": signal_id,
        "ticker": ticker,
        "action": action,
        "strategy": strategy,
        "timeframe": "D",
        "price": 20 + signal_id,
        "source_time": time,
        "received_at": time,
        "payload": payload or {},
    }


class LeadingSignalsTest(unittest.TestCase):
    def test_leading_signal_matches_the_next_gated_buy(self):
        rows = [
            signal(
                1,
                "SSI",
                "setup_bull",
                "2026-09-01T09:00:00+07:00",
                payload={"event": "bull_divergence", "valid_for_days": 30},
            ),
            signal(
                2,
                "SSI",
                "buy",
                "2026-09-08T09:00:00+07:00",
                strategy="RF Stock MTF",
                payload={
                    "portfolio_gate": {
                        "version": 1,
                        "sleeve": "RF",
                        "sector": "financials",
                        "allocation_pct": 5,
                    }
                },
            ),
        ]

        result = build_leading_signal_feed(
            rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc)
        )

        event = result["leading_signals"][0]
        self.assertEqual(event["status"], "matched_rf")
        self.assertEqual(event["matched_signal_id"], 2)
        self.assertEqual(event["lead_days"], 7)

    def test_expired_signal_does_not_match_a_late_buy(self):
        rows = [
            signal(
                1,
                "SSI",
                "setup_bull",
                "2026-07-01T09:00:00+07:00",
                payload={"valid_for_days": 10},
            ),
            signal(
                2,
                "SSI",
                "buy",
                "2026-08-01T09:00:00+07:00",
                strategy="EMA Gap",
                payload={"portfolio_gate": {"version": 1, "sleeve": "EMA"}},
            ),
        ]

        result = build_leading_signal_feed(
            rows, now=datetime(2026, 8, 2, tzinfo=timezone.utc)
        )

        event = result["leading_signals"][0]
        self.assertEqual(event["status"], "expired")
        self.assertIsNone(event["matched_signal_id"])

    def test_performance_trade_receives_active_leading_context(self):
        performance = {
            "open_trades": [
                {
                    "ticker": "SSI",
                    "entry_time": "2026-09-08T09:00:00+07:00",
                    "entry_signal_id": 3,
                }
            ],
            "closed_trades": [],
        }
        rows = [
            signal(
                1,
                "SSI",
                "setup_bull",
                "2026-09-01T09:00:00+07:00",
                payload={"event": "bull_divergence", "valid_for_days": 30},
            ),
            signal(
                2,
                "SSI",
                "setup_bear",
                "2026-06-01T09:00:00+07:00",
                payload={"valid_for_days": 10},
            ),
            signal(
                3,
                "SSI",
                "buy",
                "2026-09-08T09:00:00+07:00",
                strategy="RF Stock MTF",
                payload={"portfolio_gate": {"version": 1, "sleeve": "RF"}},
            ),
        ]

        result = attach_leading_signals(performance, rows)

        trade = result["open_trades"][0]
        self.assertTrue(trade["has_leading_bull"])
        self.assertEqual(len(trade["leading_signals"]), 1)
        self.assertEqual(trade["leading_signals"][0]["lead_days"], 7)


if __name__ == "__main__":
    unittest.main()
