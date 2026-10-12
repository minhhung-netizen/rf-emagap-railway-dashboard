import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from app.database import SignalStore
from app.services import trade_reconciliation


class DatabaseMigrationTest(unittest.TestCase):
    def test_adds_bases_to_legacy_reconciliation_and_replays_existing_sales(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "signals.db"
            original_rows = [
                json.dumps([dict(ticker="ABC", buy_quantity=100, sell_quantity=0,
                                 buy_amount="1000000", sell_amount="0")]),
                json.dumps([dict(ticker="ABC", buy_quantity=0, sell_quantity=25,
                                 buy_amount="0", sell_amount="300000")]),
            ]
            with sqlite3.connect(database_path) as connection:
                connection.executescript("""
                    CREATE TABLE reconciliation_imports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL,
                        account_label TEXT NOT NULL, trade_date TEXT NOT NULL,
                        filename TEXT NOT NULL, digest TEXT NOT NULL, rows_json TEXT NOT NULL,
                        created_by TEXT NOT NULL, created_at TEXT NOT NULL,
                        UNIQUE(scope, trade_date)
                    );
                    CREATE TABLE reconciliation_notes (
                        scope TEXT NOT NULL, trade_date TEXT NOT NULL, ticker TEXT NOT NULL,
                        note TEXT NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
                        PRIMARY KEY(scope, trade_date, ticker)
                    );
                """)
                for day, rows_json in zip(("2026-01-05", "2026-01-06"), original_rows):
                    connection.execute(
                        "INSERT INTO reconciliation_imports(scope,account_label,trade_date,filename,digest,rows_json,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)",
                        ("synthetic-scope", "••••0001 · Thường", day, "synthetic.xlsx",
                         "synthetic-digest", rows_json, "tester", "2026-01-06T00:00:00+00:00"),
                    )
                connection.execute(
                    "INSERT INTO reconciliation_notes VALUES(?,?,?,?,?,?)",
                    ("synthetic-scope", "2026-01-05", "ABC", "Keep note", "tester", "2026-01-06T00:00:00+00:00"),
                )
            connection.close()

            store = SignalStore(database_path)
            upgraded = trade_reconciliation.build_report(store, "synthetic-scope")
            self.assertEqual(upgraded["bases"], [])
            self.assertEqual(upgraded["positions"][0]["quantity"], 75)
            self.assertEqual(upgraded["positions"][0]["average_cost"], 10000)
            self.assertEqual(upgraded["rows"][1]["note"], "Keep note")
            trade_reconciliation.save_base(store, "synthetic-scope", "ABC", 10000, "tester")
            position = trade_reconciliation.build_report(store, "synthetic-scope")["positions"][0]
            self.assertEqual(position["quantity"], 75)
            self.assertEqual(position["total_quantity"], 10075)
            with store.connect() as connection:
                self.assertEqual(
                    [row[0] for row in connection.execute("SELECT rows_json FROM reconciliation_imports ORDER BY trade_date")],
                    original_rows,
                )

    def test_adds_price_to_legacy_signal_ledger_without_losing_rows(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "signals.db"
            conn = sqlite3.connect(database_path)
            try:
                conn.executescript(
                    """
                    CREATE TABLE signals (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ticker TEXT NOT NULL,
                        exchange TEXT,
                        action TEXT NOT NULL,
                        timeframe TEXT,
                        strategy TEXT,
                        note TEXT,
                        source_time TEXT,
                        received_at TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        enrichment_json TEXT NOT NULL
                    );
                    CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                        password_hash TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                    INSERT INTO signals (
                        ticker, exchange, action, timeframe, strategy, note,
                        source_time, received_at, payload_json, enrichment_json
                    ) VALUES (
                        'FPT', 'HOSE', 'buy', 'D', 'Legacy', NULL,
                        NULL, '2026-09-01T00:00:00+00:00', '{}', '{}'
                    );
                    INSERT INTO users (username, password_hash, created_at, updated_at)
                    VALUES ('admin', 'legacy-hash', '2026-09-01T00:00:00+00:00', '2026-09-01T00:00:00+00:00');
                    """
                )
            finally:
                conn.close()

            store = SignalStore(database_path)

            conn = sqlite3.connect(database_path)
            try:
                signal_columns = {row[1] for row in conn.execute("PRAGMA table_info(signals)")}
                user_columns = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
                rows = conn.execute("SELECT ticker, price FROM signals").fetchall()
            finally:
                conn.close()

            self.assertIn("price", signal_columns)
            self.assertEqual(rows, [("FPT", None)])
            self.assertTrue({"role", "features_json", "strategies_json", "active"}.issubset(user_columns))
            self.assertEqual(store.get_user_credentials("admin")["features"], [])


if __name__ == "__main__":
    unittest.main()
