import asyncio
import json
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from starlette.requests import Request

import app.main as dashboard_main
from app.database import SignalStore
from app.services.portfolio_gate import (
    evaluate_portfolio_signal,
    guardrails_from_backtest,
    portfolio_gate_state,
    rebalance_recommended_state,
)


def stored_signal(*, signal_id, ticker, strategy, action, classification):
    return {
        "id": signal_id,
        "ticker": ticker,
        "strategy": strategy,
        "action": action,
        "received_at": f"2026-08-31T00:00:0{signal_id}+00:00",
        "payload": {"portfolio_gate": classification},
    }


def webhook_request(payload):
    body = json.dumps(payload).encode("utf-8")
    delivered = False

    async def receive():
        nonlocal delivered
        if delivered:
            return {"type": "http.disconnect"}
        delivered = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/webhook",
            "headers": [(b"content-type", b"application/json")],
        },
        receive,
    )


def raw_webhook_request(body_text):
    body = body_text.encode("utf-8")
    delivered = False

    async def receive():
        nonlocal delivered
        if delivered:
            return {"type": "http.disconnect"}
        delivered = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/webhook",
            "headers": [(b"content-type", b"text/plain")],
        },
        receive,
    )


class PortfolioGateTest(unittest.TestCase):

    def test_rebalance_card_excludes_open_positions_outside_recommendation_but_gate_keeps_them(self):
        classification = {
            "version": 1, "sleeve": "RF", "sector": "real_estate",
            "allocation_pct": 5, "position_strategy": "RF Stock MTF",
        }
        signals = [
            stored_signal(signal_id=index, ticker=ticker, strategy="RF Stock MTF", action="buy", classification=classification)
            for index, ticker in enumerate(("SZC", "DCM", "CSV"), start=1)
        ]
        all_open = portfolio_gate_state(signals)
        recommended = rebalance_recommended_state(all_open, {
            "summary": {"attention_lists": {"ema": {"rows": [{"ticker": "DCM", "rank": 4}]}}}
        })

        self.assertEqual(all_open["total_exposure_pct"], 15)
        self.assertEqual(len(all_open["positions"]), 3)
        self.assertTrue(recommended["available"])
        self.assertEqual(recommended["total_exposure_pct"], 5)
        self.assertEqual([row["ticker"] for row in recommended["positions"]], ["DCM"])
        self.assertEqual({row["ticker"] for row in recommended["excluded_positions"]}, {"SZC", "CSV"})

    def test_unparseable_authenticated_webhook_is_logged_without_http_422(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            settings = replace(dashboard_main.settings, webhook_secret="gate-test-secret")
            with patch.object(dashboard_main, "store", store), patch.object(
                dashboard_main, "settings", settings
            ):
                result = asyncio.run(
                    dashboard_main.receive_webhook(
                        raw_webhook_request("an alert with no usable fields"),
                        secret="gate-test-secret",
                    )
                )

            self.assertEqual(result["status"], "invalid")
            self.assertEqual(result["reason"], "unparseable_webhook")
            self.assertEqual(
                store.list_invalid_signals()[0]["payload"]["raw_body"],
                "an alert with no usable fields",
            )

    def test_plaintext_order_fill_reaches_portfolio_gate(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            settings = replace(dashboard_main.settings, webhook_secret="gate-test-secret")
            text = (
                '"RF Stock Rebalance (HL2, 100, 5): '
                'lệnh buy @6900 được thực hiện MBB. Vị thế mới là 1"\n'
                "HOSE:MBB, 1h • Hoạt động"
            )
            with patch.object(dashboard_main, "store", store), patch.object(
                dashboard_main, "settings", settings
            ), patch.object(dashboard_main, "enqueue_signal_enrichment"):
                result = asyncio.run(
                    dashboard_main.receive_webhook(
                        raw_webhook_request(text),
                        secret="gate-test-secret",
                    )
                )

            self.assertEqual(result["status"], "accepted")
            self.assertEqual(result["signal"]["ticker"], "MBB")
            self.assertEqual(result["signal"]["price"], 6.9)
            self.assertEqual(result["classification"]["sleeve"], "RF")

    def test_snapshot_guardrails_override_the_defaults(self):
        guardrails = guardrails_from_backtest(
            {
                "summary": {
                    "guardrails": {
                        "total_exposure_cap": 0.9,
                        "sector_cap": 0.4,
                        "ticker_cap": 0.08,
                        "rf_hard_cap": 0.7,
                        "ema_hard_cap": 0.3,
                    }
                }
            }
        )

        self.assertEqual(guardrails["total_exposure_cap"], 0.9)
        self.assertEqual(guardrails["sector_cap"], 0.4)
        self.assertEqual(guardrails["ticker_cap"], 0.08)
        self.assertEqual(guardrails["rf_hard_cap"], 0.7)
        self.assertEqual(guardrails["ema_hard_cap"], 0.3)

    def test_confirm_buy_is_a_constrained_top_up_of_a_gated_base_position(self):
        first = evaluate_portfolio_signal(
            payload={"strategy": "RF Stock MTF"},
            ticker="VPB",
            exchange="HOSE",
            action="buy",
            signals=[],
            backtest=None,
            default_allocation_pct=5,
        )
        self.assertTrue(first["allowed"])
        signals = [
            stored_signal(
                signal_id=1,
                ticker="VPB",
                strategy="RF Stock MTF",
                action="buy",
                classification=first["classification"],
            )
        ]

        second = evaluate_portfolio_signal(
            payload={"strategy": "EMA confirmation"},
            ticker="VPB",
            exchange="HOSE",
            action="confirm_buy",
            signals=signals,
            backtest=None,
            default_allocation_pct=5,
            base_strategy="RF Stock MTF",
        )
        self.assertTrue(second["allowed"])
        self.assertEqual(second["classification"]["position_strategy"], "RF Stock MTF")
        signals.append(
            stored_signal(
                signal_id=2,
                ticker="VPB",
                strategy="EMA confirmation",
                action="confirm_buy",
                classification=second["classification"],
            )
        )

        rejected = evaluate_portfolio_signal(
            payload={"strategy": "EMA confirmation"},
            ticker="VPB",
            exchange="HOSE",
            action="confirm_buy",
            signals=signals,
            backtest=None,
            default_allocation_pct=5,
            base_strategy="RF Stock MTF",
        )
        self.assertFalse(rejected["allowed"])
        self.assertEqual(rejected["reason"], "ticker_cap")
        self.assertEqual(portfolio_gate_state(signals)["total_exposure_pct"], 10)

    def test_sector_cap_rejects_a_new_bank_position(self):
        classifications = []
        for ticker, allocation in (("VPB", 10), ("ACB", 10), ("MBB", 10), ("TCB", 5)):
            classifications.append(
                {
                    "version": 1,
                    "sleeve": "RF",
                    "sector": "banking",
                    "allocation_pct": allocation,
                    "position_strategy": "RF Stock MTF",
                }
            )
        signals = [
            stored_signal(
                signal_id=index,
                ticker=ticker,
                strategy="RF Stock MTF",
                action="buy",
                classification=classification,
            )
            for index, ((ticker, _), classification) in enumerate(
                zip((("VPB", 10), ("ACB", 10), ("MBB", 10), ("TCB", 5)), classifications),
                start=1,
            )
        ]

        rejected = evaluate_portfolio_signal(
            payload={"strategy": "RF Stock MTF", "allocation_pct": 5},
            ticker="HDB",
            exchange="HOSE",
            action="buy",
            signals=signals,
            backtest=None,
            default_allocation_pct=5,
        )

        self.assertFalse(rejected["allowed"])
        self.assertEqual(rejected["reason"], "sector_cap")

    def test_signals_from_before_the_gate_do_not_consume_new_gate_exposure(self):
        accepted = evaluate_portfolio_signal(
            payload={"strategy": "EMA Gap Stock"},
            ticker="FPT",
            exchange="HOSE",
            action="buy",
            signals=[
                {
                    "id": 1,
                    "ticker": "FPT",
                    "strategy": "Legacy DCA",
                    "action": "buy",
                    "received_at": "2026-08-01T00:00:00+00:00",
                    "payload": {},
                }
            ],
            backtest=None,
            default_allocation_pct=5,
        )

        self.assertTrue(accepted["allowed"])
        self.assertEqual(accepted["classification"]["sleeve"], "EMA")
        self.assertEqual(accepted["classification"]["sector"], "technology")

    def test_configured_sector_map_overrides_the_bundled_map(self):
        accepted = evaluate_portfolio_signal(
            payload={"strategy": "RF Stock MTF"},
            ticker="VPB",
            exchange="HOSE",
            action="buy",
            signals=[],
            backtest=None,
            default_allocation_pct=5,
            sector_map={"VPB": "Tài chính tùy chỉnh"},
        )

        self.assertTrue(accepted["allowed"])
        self.assertEqual(accepted["classification"]["sector"], "tài chính tùy chỉnh")

    def test_webhook_saves_the_gate_classification_and_rejects_excess_top_up(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            settings = replace(
                dashboard_main.settings,
                webhook_secret="gate-test-secret",
                default_signal_weight_pct=5,
            )
            base = {
                "ticker": "HOSE:VPB",
                "price": 20000,
                "timeframe": "D",
                "secret": "gate-test-secret",
            }
            with patch.object(dashboard_main, "store", store), patch.object(
                dashboard_main, "settings", settings
            ), patch.object(dashboard_main, "enqueue_signal_enrichment"):
                first = asyncio.run(
                    dashboard_main.receive_webhook(
                        webhook_request(
                            {**base, "action": "buy", "strategy": "RF Stock MTF"}
                        )
                    )
                )
                top_up = asyncio.run(
                    dashboard_main.receive_webhook(
                        webhook_request(
                            {
                                **base,
                                "action": "confirm_buy",
                                "strategy": "EMA confirmation",
                                "base_strategy": "RF Stock MTF",
                            }
                        )
                    )
                )
                rejected = asyncio.run(
                    dashboard_main.receive_webhook(
                        webhook_request(
                            {
                                **base,
                                "action": "confirm_buy",
                                "strategy": "EMA confirmation 2",
                                "base_strategy": "RF Stock MTF",
                            }
                        )
                    )
                )

            self.assertEqual(first["status"], "accepted")
            self.assertEqual(first["classification"]["sleeve"], "RF")
            self.assertEqual(first["classification"]["sector"], "banking")
            self.assertEqual(top_up["status"], "accepted")
            self.assertEqual(rejected["status"], "rejected")
            self.assertEqual(rejected["reason"], "ticker_cap")

    def test_performance_source_excludes_legacy_signals(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            legacy = store.insert_signal(
                ticker="FPT",
                exchange="HOSE",
                action="buy",
                price=100,
                timeframe="D",
                strategy="Legacy DCA",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )
            gated = store.insert_signal(
                ticker="VPB",
                exchange="HOSE",
                action="buy",
                price=20,
                timeframe="D",
                strategy="RF Stock MTF",
                note=None,
                source_time=None,
                payload={
                    "portfolio_gate": {
                        "version": 1,
                        "sleeve": "RF",
                        "sector": "banking",
                        "allocation_pct": 5,
                        "position_strategy": "RF Stock MTF",
                    }
                },
                enrichment={},
            )

            with patch.object(dashboard_main, "store", store):
                source = dashboard_main.filtered_performance_signals()

            self.assertEqual([signal["id"] for signal in source], [gated["id"]])
            self.assertNotIn(legacy["id"], [signal["id"] for signal in source])


if __name__ == "__main__":
    unittest.main()
