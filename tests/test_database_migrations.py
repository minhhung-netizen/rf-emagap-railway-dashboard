import sqlite3
import tempfile
import unittest
from pathlib import Path

from app.database import SignalStore


class DatabaseMigrationTest(unittest.TestCase):
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
                    INSERT INTO signals (
                        ticker, exchange, action, timeframe, strategy, note,
                        source_time, received_at, payload_json, enrichment_json
                    ) VALUES (
                        'FPT', 'HOSE', 'buy', 'D', 'Legacy', NULL,
                        NULL, '2026-09-01T00:00:00+00:00', '{}', '{}'
                    );
                    """
                )
            finally:
                conn.close()

            SignalStore(database_path)

            conn = sqlite3.connect(database_path)
            try:
                columns = {row[1] for row in conn.execute("PRAGMA table_info(signals)")}
                rows = conn.execute("SELECT ticker, price FROM signals").fetchall()
            finally:
                conn.close()

            self.assertIn("price", columns)
            self.assertEqual(rows, [("FPT", None)])


if __name__ == "__main__":
    unittest.main()
