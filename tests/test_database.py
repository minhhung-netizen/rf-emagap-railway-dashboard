import tempfile
import unittest
import sqlite3
from pathlib import Path

from app.database import SignalStore


class SignalStoreTest(unittest.TestCase):
    def test_init_migrates_existing_dividend_table_for_external_events(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "signals.db"
            conn = sqlite3.connect(database_path)
            try:
                conn.execute(
                    """
                    CREATE TABLE dividend_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ticker TEXT NOT NULL,
                        ex_date TEXT NOT NULL,
                        cash_amount REAL,
                        stock_ratio_pct REAL,
                        issue_ratio_pct REAL,
                        issue_price REAL,
                        note TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                    """
                )
                conn.commit()
            finally:
                conn.close()

            store = SignalStore(database_path)
            store.upsert_external_dividend_events(
                [
                    {
                        "ticker": "FPT",
                        "ex_date": "2026-06-20",
                        "source": "fireant",
                        "external_id": "FPT:1",
                    }
                ]
            )

            self.assertEqual(store.list_dividend_events("FPT")[0]["source"], "fireant")

    def test_delete_signal_removes_existing_row(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            signal = store.insert_signal(
                ticker="VPB",
                exchange="HOSE",
                action="buy",
                price=19.5,
                timeframe="1D",
                strategy="manual-test",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )

            self.assertTrue(store.delete_signal(signal["id"]))
            self.assertEqual(store.list_signals(), [])

    def test_delete_signal_returns_false_for_missing_row(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")

            self.assertFalse(store.delete_signal(999))

    def test_init_normalizes_existing_vnd_signal_prices(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "signals.db"
            store = SignalStore(db_path)
            signal = store.insert_signal(
                ticker="MSN",
                exchange="HOSE",
                action="sell",
                price=74400,
                timeframe="2H",
                strategy="STxanhdo",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )

            self.assertEqual(signal["price"], 74400)
            migrated = SignalStore(db_path).get_signal(signal["id"])
            self.assertEqual(migrated["price"], 74.4)

    def test_init_keeps_and_repairs_vnindex_point_prices(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "signals.db"
            store = SignalStore(db_path)
            normalized = store.insert_signal(
                ticker="VNINDEX",
                exchange="HOSE",
                action="buy",
                price=1.876,
                timeframe="60",
                strategy="Modern Stock EMA",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )
            raw = store.insert_signal(
                ticker="VNINDEX",
                exchange="HOSE",
                action="sell",
                price=1876.75,
                timeframe="60",
                strategy="Modern Stock EMA",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )

            migrated_store = SignalStore(db_path)
            self.assertEqual(migrated_store.get_signal(normalized["id"])["price"], 1876)
            self.assertEqual(migrated_store.get_signal(raw["id"])["price"], 1876.75)

    def test_init_normalizes_existing_malformed_confirm_actions(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "signals.db"
            store = SignalStore(db_path)
            buy_signal = store.insert_signal(
                ticker="FPT",
                exchange="HOSE",
                action="confi m_buy",
                price=74.8,
                timeframe="2H",
                strategy="HMA",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )
            sell_signal = store.insert_signal(
                ticker="FPT",
                exchange="HOSE",
                action="confim_sell",
                price=74.8,
                timeframe="2H",
                strategy="HMA",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )

            migrated_store = SignalStore(db_path)

            self.assertEqual(migrated_store.get_signal(buy_signal["id"])["action"], "confirm_buy")
            self.assertEqual(
                migrated_store.get_signal(sell_signal["id"])["action"],
                "confirm_sell",
            )

    def test_find_duplicate_signal_uses_source_time_when_present(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            signal = store.insert_signal(
                ticker="VPB",
                exchange="HOSE",
                action="buy",
                price=19.5,
                timeframe="1D",
                strategy="RS",
                note=None,
                source_time="2026-05-24T14:45:00Z",
                payload={},
                enrichment={},
            )

            duplicate = store.find_duplicate_signal(
                ticker="VPB",
                action="buy",
                timeframe="1D",
                strategy="RS",
                source_time="2026-05-24T14:45:00Z",
                window_minutes=5,
            )

            self.assertIsNotNone(duplicate)
            self.assertEqual(duplicate["id"], signal["id"])

    def test_find_duplicate_signal_uses_recent_window_without_source_time(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            store.insert_signal(
                ticker="TCB",
                exchange="HOSE",
                action="sell",
                price=30.5,
                timeframe="1D",
                strategy="manual-test",
                note=None,
                source_time=None,
                payload={},
                enrichment={},
            )

            duplicate = store.find_duplicate_signal(
                ticker="TCB",
                action="sell",
                timeframe="1D",
                strategy="manual-test",
                source_time=None,
                window_minutes=5,
            )

            self.assertIsNotNone(duplicate)

    def test_derivative_signal_lifecycle_and_duplicate_lookup(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            signal = store.insert_derivative_signal(
                symbol="VN30F1M",
                exchange="HNX",
                action="long_start",
                price=1300,
                quantity=2,
                contract_multiplier=100000,
                timeframe="5",
                strategy="VN30 Modern DCA",
                reason=None,
                source_time="2026-06-09T09:00:00+07:00",
                payload={"asset_type": "derivative"},
            )

            duplicate = store.find_duplicate_derivative_signal(
                symbol="VN30F1M",
                action="long_start",
                timeframe="5",
                strategy="VN30 Modern DCA",
                source_time="2026-06-09T09:00:00+07:00",
                window_minutes=5,
            )

            self.assertEqual(store.list_all_derivative_signals()[0]["id"], signal["id"])
            self.assertEqual(duplicate["id"], signal["id"])
            self.assertTrue(store.delete_derivative_signal(signal["id"]))
            self.assertEqual(store.list_all_derivative_signals(), [])

    def test_app_setting_is_persisted(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "signals.db"
            store = SignalStore(db_path)

            store.set_app_setting("derivative_initial_capital", "250000000")

            reloaded = SignalStore(db_path)
            self.assertEqual(
                reloaded.get_app_setting("derivative_initial_capital"),
                "250000000",
            )

    def test_upserts_portfolio_backtest_by_source_and_report_date(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            saved = store.upsert_portfolio_backtest(
                source="rf-emagap-combined",
                report_date="2026-08-31",
                title="RF + EMA Gap Portfolio Monitor",
                research_status="research-release-candidate",
                generated_at="2026-08-31T08:32:11Z",
                summary={"common_period": {"start_date": "2015-07-01"}},
            )
            updated = store.upsert_portfolio_backtest(
                source="rf-emagap-combined",
                report_date="2026-08-31",
                title="Updated portfolio monitor",
                research_status="paper-trading",
                generated_at="2026-08-31T10:00:00Z",
                summary={"common_period": {"end_date": "2026-07-15"}},
            )

            self.assertEqual(saved["id"], updated["id"])
            self.assertEqual(updated["title"], "Updated portfolio monitor")
            self.assertEqual(updated["summary"]["common_period"]["end_date"], "2026-07-15")
            self.assertEqual(len(store.list_portfolio_backtests()), 1)

    def test_record_and_list_invalid_signal(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            recorded = store.record_invalid_signal(
                ticker="VPB",
                action="buy",
                timeframe="1D",
                strategy="RS",
                reason="duplicate_webhook",
                source_time="2026-05-24T14:45:00Z",
                payload={"ticker": "HOSE:VPB"},
            )

            invalid_signals = store.list_invalid_signals()

            self.assertEqual(invalid_signals[0]["id"], recorded["id"])
            self.assertEqual(invalid_signals[0]["reason"], "duplicate_webhook")
            self.assertEqual(invalid_signals[0]["payload"]["ticker"], "HOSE:VPB")

    def test_manual_position_lifecycle_records_snapshots(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            position = store.insert_manual_position(
                ticker="VPB",
                weight_pct=10,
                entry_price=20,
                current_price=21,
                quantity=100,
                entry_date="2026-05-18T02:00:00+00:00",
                note="core",
            )

            updated = store.update_manual_position(position["id"], {"current_price": 22})
            closed = store.close_manual_position(
                position["id"],
                exit_price=23,
                closed_at="2026-05-24T08:00:00+00:00",
            )

            self.assertEqual(updated["current_price"], 22)
            self.assertEqual(closed["status"], "closed")
            self.assertEqual(closed["exit_price"], 23)
            self.assertGreaterEqual(len(closed["snapshots"]), 4)

    def test_update_manual_market_price_updates_only_open_positions(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            open_position = store.insert_manual_position(
                ticker="VPB",
                weight_pct=10,
                entry_price=20,
                current_price=None,
                quantity=None,
                entry_date=None,
                note=None,
            )
            closed_position = store.insert_manual_position(
                ticker="VPB",
                weight_pct=10,
                entry_price=30,
                current_price=None,
                quantity=None,
                entry_date=None,
                note=None,
            )
            store.close_manual_position(closed_position["id"], exit_price=31, closed_at=None)

            updated = store.update_manual_market_price(
                ticker="VPB",
                price=22,
                recorded_at="2026-05-24T09:30:00+00:00",
            )
            positions = {item["id"]: item for item in store.list_manual_positions()}

            self.assertEqual(updated, 1)
            self.assertEqual(positions[open_position["id"]]["current_price"], 22)
            self.assertEqual(positions[closed_position["id"]]["current_price"], 31)
            self.assertIn("VPB", store.list_open_manual_tickers())

    def test_upserts_manual_daily_performance_by_trade_date(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            first = store.upsert_manual_daily_performance(
                trade_date="2026-05-25",
                portfolio_return_pct=2,
                equity_value=102,
                total_weight_pct=50,
                open_count=1,
                closed_count=0,
                cost_value=None,
                market_value=None,
                pnl_value=None,
                recorded_at="2026-05-25T15:01:00+07:00",
            )
            second = store.upsert_manual_daily_performance(
                trade_date="2026-05-25",
                portfolio_return_pct=3,
                equity_value=103,
                total_weight_pct=60,
                open_count=2,
                closed_count=0,
                cost_value=None,
                market_value=None,
                pnl_value=None,
                recorded_at="2026-05-25T15:10:00+07:00",
            )
            rows = store.list_manual_daily_performance()

            self.assertEqual(first["trade_date"], "2026-05-25")
            self.assertEqual(len(rows), 1)
            self.assertEqual(second["id"], rows[0]["id"])
            self.assertAlmostEqual(rows[0]["portfolio_return_pct"], 3)
            self.assertAlmostEqual(rows[0]["equity_value"], 103)
            self.assertTrue(store.delete_manual_daily_performance("2026-05-25"))
            self.assertFalse(store.delete_manual_daily_performance("2026-05-25"))
            self.assertEqual(store.list_manual_daily_performance(), [])

    def test_upserts_strategy_backtest_stats_by_ticker_strategy_metric(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            first = store.upsert_strategy_backtest_stat(
                ticker="vpb",
                strategy="STxanhdo",
                metric_name="Price Drawdown % From BUY",
                closed_trades=100,
                negative_trades=40,
                max_loss_pct=-12.2,
                min_loss_pct=-0.56,
                avg_loss_pct=-4.39,
                max_gain_pct=47.59,
                avg_gain_pct=16.64,
                tp1_hits=1,
                tp1_total=7,
                tp2_hits=1,
                tp2_total=7,
                tp3_hits=1,
                tp3_total=7,
                avg_hold_bars=91.44,
                avg_hold_days=26.47,
                note="initial backtest",
            )
            second = store.upsert_strategy_backtest_stat(
                ticker="VPB",
                strategy="STxanhdo",
                metric_name="Price Drawdown % From BUY",
                closed_trades=120,
                negative_trades=45,
                max_loss_pct=-10,
                min_loss_pct=-0.5,
                avg_loss_pct=-3.9,
                max_gain_pct=50,
                avg_gain_pct=18.2,
                tp1_hits=2,
                tp1_total=8,
                tp2_hits=1,
                tp2_total=8,
                tp3_hits=1,
                tp3_total=8,
                avg_hold_bars=80,
                avg_hold_days=20,
                note="updated backtest",
            )
            rows = store.list_strategy_backtest_stats(ticker="VPB", strategy="STxanhdo")

            self.assertEqual(first["ticker"], "VPB")
            self.assertEqual(len(rows), 1)
            self.assertEqual(second["id"], rows[0]["id"])
            self.assertEqual(rows[0]["closed_trades"], 120)
            self.assertAlmostEqual(rows[0]["avg_loss_pct"], -3.9)
            self.assertAlmostEqual(rows[0]["max_gain_pct"], 50)
            self.assertEqual(rows[0]["tp1_hits"], 2)
            self.assertEqual(rows[0]["tp1_total"], 8)
            self.assertEqual(rows[0]["note"], "updated backtest")
            self.assertTrue(store.delete_strategy_backtest_stat(rows[0]["id"]))
            self.assertFalse(store.delete_strategy_backtest_stat(rows[0]["id"]))

    def test_upserts_kelly_entries_by_ticker_and_strategy(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            first = store.upsert_kelly_entry(
                ticker="vpb",
                strategy="STxanhdo",
                win_rate=40.11,
                winning_trades=73,
                total_trades=182,
                profit_factor=1.616,
                max_drawdown=5.83,
                target_drawdown=3,
                fraction=50,
                max_allocation=10,
            )
            second = store.upsert_kelly_entry(
                ticker="VPB",
                strategy="STxanhdo",
                win_rate=45,
                winning_trades=80,
                total_trades=190,
                profit_factor=1.7,
                max_drawdown=6,
                target_drawdown=3,
                fraction=40,
                max_allocation=12,
            )
            rows = store.list_kelly_entries(ticker="VPB", strategy="STxanhdo")

            self.assertEqual(first["ticker"], "VPB")
            self.assertEqual(len(rows), 1)
            self.assertEqual(second["id"], rows[0]["id"])
            self.assertAlmostEqual(rows[0]["win_rate"], 45)
            self.assertAlmostEqual(rows[0]["max_allocation"], 12)
            self.assertTrue(store.delete_kelly_entry(rows[0]["id"]))
            self.assertFalse(store.delete_kelly_entry(rows[0]["id"]))

    def test_updates_dca_plan_for_owner_only(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            owner = store.create_user(
                username="owner",
                password_hash="hash",
                role="user",
                features=["dcaSizing"],
            )
            other = store.create_user(
                username="other",
                password_hash="hash",
                role="user",
                features=["dcaSizing"],
            )
            plan = store.insert_dca_plan(
                user_id=owner["id"],
                ticker="vpb",
                strategy="STxanhdo",
                initial_capital=500000000,
                allocation_pct=10,
                entry_price=20,
                distance_mode="percent",
                max_loss_pct=12,
                lot_size=100,
                levels=[{"distancePct": 0, "multiplier": 1}],
                result={"rows": [{"index": 1, "buyPrice": 20}]},
            )

            updated = store.update_dca_plan(
                plan_id=plan["id"],
                user_id=owner["id"],
                ticker="fpt",
                strategy="Swing",
                initial_capital=600000000,
                allocation_pct=12,
                entry_price=75,
                distance_mode="priceStep",
                max_loss_pct=8,
                lot_size=100,
                levels=[{"distancePct": 2, "multiplier": 1.2}],
                result={"rows": [{"index": 1, "buyPrice": 75}], "priceStep": 100},
            )

            self.assertEqual(updated["id"], plan["id"])
            self.assertEqual(updated["ticker"], "FPT")
            self.assertEqual(updated["strategy"], "Swing")
            self.assertEqual(updated["distance_mode"], "priceStep")
            self.assertEqual(updated["levels"][0]["multiplier"], 1.2)
            self.assertEqual(updated["result"]["priceStep"], 100)
            with self.assertRaises(KeyError):
                store.update_dca_plan(
                    plan_id=plan["id"],
                    user_id=other["id"],
                    ticker="VCB",
                    strategy="Swing",
                    initial_capital=None,
                    allocation_pct=None,
                    entry_price=None,
                    distance_mode="percent",
                    max_loss_pct=None,
                    lot_size=None,
                    levels=[],
                    result={},
                )

    def test_dividend_event_lifecycle(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            event = store.insert_dividend_event(
                ticker="vpb",
                ex_date="2026-06-10",
                cash_amount=1,
                stock_ratio_pct=10,
                issue_ratio_pct=20,
                issue_price=10,
                note="cash and stock",
            )

            rows = store.list_dividend_events("VPB")

            self.assertEqual(event["ticker"], "VPB")
            self.assertEqual(rows[0]["id"], event["id"])
            self.assertEqual(rows[0]["ex_date"], "2026-06-10")
            self.assertEqual(rows[0]["issue_ratio_pct"], 20)
            self.assertEqual(rows[0]["issue_price"], 10)
            self.assertTrue(store.delete_dividend_event(event["id"]))
            self.assertFalse(store.delete_dividend_event(event["id"]))

    def test_deletes_all_dividend_events_for_ticker_only(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            for ticker, ex_date in [
                ("FPT", "2026-06-15"),
                ("FPT", "2026-07-15"),
                ("VCB", "2026-06-20"),
            ]:
                store.insert_dividend_event(
                    ticker=ticker,
                    ex_date=ex_date,
                    cash_amount=1,
                    stock_ratio_pct=None,
                    note=None,
                )

            removed = store.delete_dividend_events_for_ticker("fpt")

            self.assertEqual(removed, 2)
            self.assertEqual(store.list_dividend_events("FPT"), [])
            self.assertEqual(len(store.list_dividend_events("VCB")), 1)

    def test_external_dividend_events_are_upserted_without_duplicates(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            event = {
                "ticker": "FPT",
                "ex_date": "2026-06-20",
                "note": "FireAnt: Cổ tức",
                "source": "fireant",
                "external_id": "FPT:event-1",
            }

            store.upsert_external_dividend_events([event])
            event["note"] = "FireAnt: Cổ tức cập nhật"
            store.upsert_external_dividend_events([event])

            rows = store.list_dividend_events("FPT")
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["note"], "FireAnt: Cổ tức cập nhật")


if __name__ == "__main__":
    unittest.main()
