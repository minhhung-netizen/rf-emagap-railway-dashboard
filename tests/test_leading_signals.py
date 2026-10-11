from datetime import datetime, timezone
import unittest

from app.services.leading_signals import attach_leading_signals, build_leading_signal_feed


def signal(signal_id, ticker, action, time, *, strategy="Inertial RSI", timeframe="D", payload=None):
    return {
        "id": signal_id,
        "ticker": ticker,
        "action": action,
        "strategy": strategy,
        "timeframe": timeframe,
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
        self.assertTrue(event["is_active"])
        self.assertEqual(event["matched_signal_id"], 2)
        self.assertEqual(event["lead_days"], 7)
        self.assertEqual(result["summary"]["active"], 1)
        self.assertEqual(result["summary"]["matched"], 1)

    def test_position_signals_do_not_end_or_extend_a_leading_signal(self):
        rows = [signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00")]
        for signal_id, action in enumerate(("buy", "confirm_buy", "sell"), start=2):
            rows.append(signal(
                signal_id, "SSI", action, f"2026-09-0{signal_id}T09:00:00+07:00",
                strategy="RF Stock MTF",
                payload={"portfolio_gate": {"version": 1, "sleeve": "RF"}},
            ))

        result = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))

        event = result["leading_signals"][0]
        self.assertTrue(event["is_active"])
        self.assertEqual(event["status"], "matched_rf")
        self.assertIsNone(event["reversed_at"])
        self.assertEqual(event["expires_at"], "2026-10-01T02:00:00+00:00")

    def test_each_direction_change_ends_old_signals_without_reactivating_them(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00"),
            signal(2, "SSI", "setup_bear", "2026-09-05T09:00:00+07:00"),
            signal(3, "SSI", "momentum_bull", "2026-09-08T09:00:00+07:00"),
        ]

        for input_rows in (rows, list(reversed(rows))):
            with self.subTest(order=[row["id"] for row in input_rows]):
                result = build_leading_signal_feed(
                    input_rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc)
                )
                events = {row["id"]: row for row in result["leading_signals"]}
                self.assertEqual(events[1]["status"], "reversed")
                self.assertEqual(events[1]["reversed_by_signal_id"], 2)
                self.assertEqual(events[2]["status"], "reversed")
                self.assertEqual(events[2]["reversed_by_signal_id"], 3)
                self.assertEqual(events[3]["status"], "active")
                self.assertEqual(result["summary"]["active"], 1)
                self.assertEqual(result["summary"]["reversed"], 2)

    def test_reversal_only_affects_the_same_ticker_strategy_and_timeframe(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00"),
            signal(2, "FPT", "setup_bear", "2026-09-02T09:00:00+07:00"),
            signal(3, "SSI", "setup_bear", "2026-09-03T09:00:00+07:00", timeframe="60"),
            signal(4, "SSI", "setup_bear", "2026-09-04T09:00:00+07:00", strategy="Other RSI"),
        ]

        result = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))

        self.assertEqual(result["summary"]["active"], 4)
        self.assertTrue(all(row["is_active"] for row in result["leading_signals"]))

    def test_same_direction_events_keep_their_own_expiry(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00", payload={"valid_for_days": 5}),
            signal(2, "SSI", "momentum_bull", "2026-09-03T09:00:00+07:00"),
        ]

        before_expiry = build_leading_signal_feed(rows, now=datetime(2026, 9, 4, tzinfo=timezone.utc))
        after_expiry = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))

        self.assertEqual(before_expiry["summary"]["active"], 2)
        events = {row["id"]: row for row in after_expiry["leading_signals"]}
        self.assertEqual(events[1]["status"], "expired")
        self.assertIsNone(events[1]["reversed_at"])
        self.assertEqual(events[2]["status"], "active")

    def test_matching_buy_does_not_prevent_expiry(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00", payload={"valid_for_days": 5}),
            signal(2, "SSI", "buy", "2026-09-02T09:00:00+07:00", strategy="EMA Gap",
                   payload={"portfolio_gate": {"version": 1, "sleeve": "EMA"}}),
        ]

        result = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))

        event = result["leading_signals"][0]
        self.assertEqual(event["status"], "expired")
        self.assertFalse(event["is_active"])
        self.assertEqual(event["matched_signal_id"], 2)
        self.assertEqual(result["summary"]["active"], 0)
        self.assertEqual(result["summary"]["matched"], 0)

    def test_buy_at_or_after_reversal_does_not_match_old_signal(self):
        for buy_day in (5, 6):
            with self.subTest(buy_day=buy_day):
                rows = [
                    signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00"),
                    signal(2, "SSI", "setup_bear", "2026-09-05T09:00:00+07:00"),
                    signal(3, "SSI", "buy", f"2026-09-0{buy_day}T09:00:00+07:00", strategy="RF Stock MTF",
                           payload={"portfolio_gate": {"version": 1, "sleeve": "RF"}}),
                ]

                result = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))

                old_event = next(row for row in result["leading_signals"] if row["id"] == 1)
                self.assertEqual(old_event["status"], "reversed")
                self.assertIsNone(old_event["matched_signal_id"])

    def test_signal_expires_at_the_exact_deadline(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00", payload={"valid_for_days": 5}),
            signal(2, "SSI", "buy", "2026-09-06T09:00:00+07:00", strategy="RF Stock MTF",
                   payload={"portfolio_gate": {"version": 1, "sleeve": "RF"}}),
            signal(3, "SSI", "setup_bear", "2026-09-06T09:00:00+07:00"),
        ]

        result = build_leading_signal_feed(rows, now=datetime(2026, 9, 6, 2, tzinfo=timezone.utc))

        old_event = next(row for row in result["leading_signals"] if row["id"] == 1)
        self.assertEqual(old_event["status"], "expired")
        self.assertFalse(old_event["is_active"])
        self.assertIsNone(old_event["matched_signal_id"])
        self.assertIsNone(old_event["reversed_at"])

    def test_future_reversal_does_not_end_the_current_signal(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00"),
            signal(2, "SSI", "setup_bear", "2026-09-15T09:00:00+07:00"),
        ]

        result = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))

        self.assertEqual(len(result["leading_signals"]), 1)
        self.assertTrue(result["leading_signals"][0]["is_active"])

    def test_reversal_is_ordered_by_time_not_timestamp_text(self):
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00"),
            signal(2, "SSI", "setup_bear", "2026-09-01T03:00:00+00:00"),
        ]

        result = build_leading_signal_feed(rows, now=datetime(2026, 9, 2, tzinfo=timezone.utc))

        self.assertEqual([row["id"] for row in result["leading_signals"]], [2, 1])
        self.assertEqual(result["leading_signals"][1]["reversed_by_signal_id"], 2)

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

    def test_reversal_keeps_historical_context_for_buy_before_it(self):
        performance = {
            "open_trades": [{"ticker": "SSI", "entry_signal_id": 2}],
            "closed_trades": [{"ticker": "SSI", "entry_signal_id": 2}],
        }
        rows = [
            signal(1, "SSI", "setup_bull", "2026-09-01T09:00:00+07:00"),
            signal(2, "SSI", "buy", "2026-09-02T09:00:00+07:00", strategy="RF Stock MTF",
                   payload={"portfolio_gate": {"version": 1, "sleeve": "RF"}}),
            signal(3, "SSI", "setup_bear", "2026-09-05T09:00:00+07:00"),
        ]

        feed = build_leading_signal_feed(rows, now=datetime(2026, 9, 10, tzinfo=timezone.utc))
        result = attach_leading_signals(performance, rows)

        old_event = next(row for row in feed["leading_signals"] if row["id"] == 1)
        self.assertFalse(old_event["is_active"])
        self.assertEqual(old_event["matched_signal_id"], 2)
        for collection in ("open_trades", "closed_trades"):
            self.assertTrue(result[collection][0]["has_leading_bull"])
            self.assertEqual(result[collection][0]["leading_signals"][0]["signal_id"], 1)
        self.assertNotIn("leading_signals", performance["open_trades"][0])


if __name__ == "__main__":
    unittest.main()
