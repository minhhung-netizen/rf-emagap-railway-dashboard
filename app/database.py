from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator


SCHEMA = """
CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    exchange TEXT,
    action TEXT NOT NULL,
    price REAL,
    timeframe TEXT,
    strategy TEXT,
    note TEXT,
    source_time TEXT,
    received_at TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    enrichment_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_ticker_received_at
ON signals (ticker, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_action_received_at
ON signals (action, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_duplicate_lookup
ON signals (ticker, action, timeframe, strategy, source_time, received_at DESC);

CREATE TABLE IF NOT EXISTS invalid_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT,
    action TEXT,
    timeframe TEXT,
    strategy TEXT,
    reason TEXT NOT NULL,
    source_time TEXT,
    received_at TEXT NOT NULL,
    payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invalid_signals_received_at
ON invalid_signals (received_at DESC);

CREATE TABLE IF NOT EXISTS derivative_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    exchange TEXT,
    action TEXT NOT NULL,
    price REAL NOT NULL,
    quantity REAL NOT NULL,
    contract_multiplier REAL NOT NULL,
    timeframe TEXT,
    strategy TEXT,
    reason TEXT,
    source_time TEXT,
    received_at TEXT NOT NULL,
    payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_derivative_signals_symbol_received_at
ON derivative_signals (symbol, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_derivative_signals_duplicate_lookup
ON derivative_signals (
    symbol, action, timeframe, strategy, source_time, received_at DESC
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manual_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    weight_pct REAL NOT NULL,
    entry_price REAL NOT NULL,
    current_price REAL NOT NULL,
    quantity REAL,
    entry_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    exit_price REAL,
    closed_at TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manual_positions_status_ticker
ON manual_positions (status, ticker);

CREATE TABLE IF NOT EXISTS manual_price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    price REAL NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (position_id) REFERENCES manual_positions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_manual_price_snapshots_position_time
ON manual_price_snapshots (position_id, recorded_at);

CREATE TABLE IF NOT EXISTS manual_daily_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_date TEXT NOT NULL UNIQUE,
    portfolio_return_pct REAL,
    equity_value REAL NOT NULL,
    total_weight_pct REAL NOT NULL,
    open_count INTEGER NOT NULL,
    closed_count INTEGER NOT NULL,
    cost_value REAL,
    market_value REAL,
    pnl_value REAL,
    recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manual_daily_performance_date
ON manual_daily_performance (trade_date ASC);

CREATE TABLE IF NOT EXISTS dividend_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    ex_date TEXT NOT NULL,
    cash_amount REAL,
    stock_ratio_pct REAL,
    issue_ratio_pct REAL,
    issue_price REAL,
    note TEXT,
    source TEXT,
    external_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dividend_events_ticker_date
ON dividend_events (ticker, ex_date ASC);

CREATE TABLE IF NOT EXISTS strategy_backtest_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    strategy TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    closed_trades INTEGER,
    negative_trades INTEGER,
    max_loss_pct REAL,
    min_loss_pct REAL,
    avg_loss_pct REAL,
    max_gain_pct REAL,
    avg_gain_pct REAL,
    tp1_hits INTEGER,
    tp1_total INTEGER,
    tp2_hits INTEGER,
    tp2_total INTEGER,
    tp3_hits INTEGER,
    tp3_total INTEGER,
    avg_hold_bars REAL,
    avg_hold_days REAL,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(ticker, strategy, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_strategy_backtest_stats_lookup
ON strategy_backtest_stats (strategy, ticker);

CREATE TABLE IF NOT EXISTS kelly_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    strategy TEXT NOT NULL,
    win_rate REAL,
    winning_trades REAL,
    total_trades REAL,
    profit_factor REAL,
    max_drawdown REAL,
    target_drawdown REAL,
    fraction REAL,
    max_allocation REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(ticker, strategy)
);

CREATE INDEX IF NOT EXISTS idx_kelly_entries_lookup
ON kelly_entries (strategy, ticker);

CREATE TABLE IF NOT EXISTS dca_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticker TEXT NOT NULL,
    strategy TEXT NOT NULL,
    initial_capital REAL,
    allocation_pct REAL,
    entry_price REAL,
    distance_mode TEXT NOT NULL DEFAULT 'percent',
    max_loss_pct REAL,
    lot_size REAL,
    levels_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dca_plans_user_lookup
ON dca_plans (user_id, strategy, ticker, updated_at DESC);

CREATE TABLE IF NOT EXISTS dca_user_settings (
    user_id INTEGER PRIMARY KEY,
    initial_capital REAL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    features_json TEXT NOT NULL DEFAULT '[]',
    strategies_json TEXT NOT NULL DEFAULT '[]',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry
ON user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS portfolio_backtests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    report_date TEXT NOT NULL,
    title TEXT NOT NULL,
    research_status TEXT NOT NULL,
    generated_at TEXT,
    received_at TEXT NOT NULL,
    summary_json TEXT NOT NULL,
    UNIQUE(source, report_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_backtests_received_at
ON portfolio_backtests (received_at DESC);
"""


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SignalStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.database_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_db(self) -> None:
        with self.connect() as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            conn.executescript(SCHEMA)
            self._ensure_dividend_event_columns(conn)
            self._ensure_strategy_backtest_stat_columns(conn)
            self._ensure_user_columns(conn)
            conn.execute(
                """
                UPDATE signals
                SET price = price * 1000
                WHERE UPPER(ticker) = 'VNINDEX'
                  AND price > 0
                  AND price < 10
                """
            )
            conn.execute(
                """
                UPDATE signals
                SET price = price / 1000
                WHERE price >= 1000
                  AND UPPER(ticker) != 'VNINDEX'
                """
            )
            self._normalize_signal_actions(conn)

    def _ensure_dividend_event_columns(self, conn: sqlite3.Connection) -> None:
        columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(dividend_events)").fetchall()
        }
        if "issue_ratio_pct" not in columns:
            conn.execute("ALTER TABLE dividend_events ADD COLUMN issue_ratio_pct REAL")
        if "issue_price" not in columns:
            conn.execute("ALTER TABLE dividend_events ADD COLUMN issue_price REAL")
        if "source" not in columns:
            conn.execute("ALTER TABLE dividend_events ADD COLUMN source TEXT")
        if "external_id" not in columns:
            conn.execute("ALTER TABLE dividend_events ADD COLUMN external_id TEXT")
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_dividend_events_external
            ON dividend_events (source, external_id)
            WHERE source IS NOT NULL AND external_id IS NOT NULL
            """
        )

    def _ensure_strategy_backtest_stat_columns(self, conn: sqlite3.Connection) -> None:
        columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(strategy_backtest_stats)").fetchall()
        }
        for column_name, column_type in {
            "max_gain_pct": "REAL",
            "avg_gain_pct": "REAL",
            "tp1_hits": "INTEGER",
            "tp1_total": "INTEGER",
            "tp2_hits": "INTEGER",
            "tp2_total": "INTEGER",
            "tp3_hits": "INTEGER",
            "tp3_total": "INTEGER",
        }.items():
            if column_name not in columns:
                conn.execute(
                    f"ALTER TABLE strategy_backtest_stats ADD COLUMN {column_name} {column_type}"
                )

    def _ensure_user_columns(self, conn: sqlite3.Connection) -> None:
        columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(users)").fetchall()
        }
        if "strategies_json" not in columns:
            conn.execute("ALTER TABLE users ADD COLUMN strategies_json TEXT NOT NULL DEFAULT '[]'")

    def _normalize_signal_actions(self, conn: sqlite3.Connection) -> None:
        action_expr = """
            lower(
                replace(
                    replace(
                        replace(
                            replace(
                                replace(action, ' ', ''),
                                char(9),
                                ''
                            ),
                            char(10),
                            ''
                        ),
                        '-',
                        ''
                    ),
                    '_',
                    ''
                )
            )
        """
        conn.execute(
            f"""
            UPDATE signals
            SET action = 'confirm_buy'
            WHERE {action_expr} IN (
                'confirmbuy',
                'confirmationbuy',
                'confimbuy',
                'confibuy'
            )
            """
        )
        conn.execute(
            f"""
            UPDATE signals
            SET action = 'confirm_sell'
            WHERE {action_expr} IN (
                'confirmsell',
                'confirmationsell',
                'confimsell',
                'confisell'
            )
            """
        )

    def create_user(
        self,
        *,
        username: str,
        password_hash: str,
        role: str,
        features: list[str],
        strategies: list[str] | None = None,
        active: bool = True,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (
                    username, password_hash, role, features_json, strategies_json, active,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    username.strip(),
                    password_hash,
                    role,
                    json.dumps(features),
                    json.dumps(strategies or []),
                    1 if active else 0,
                    now,
                    now,
                ),
            )
            user_id = cursor.lastrowid
        return self.get_user(user_id)

    def ensure_admin_user(self, *, username: str, password_hash: str) -> dict[str, Any]:
        existing = self.get_user_by_username(username)
        if existing:
            return existing
        return self.create_user(
            username=username,
            password_hash=password_hash,
            role="admin",
            features=[],
            active=True,
        )

    def get_user(self, user_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if row is None:
            raise KeyError(f"User {user_id} was not found")
        return self._user_row(row)

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
                (username.strip(),),
            ).fetchone()
        return self._user_row(row) if row else None

    def get_user_credentials(self, username: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
                (username.strip(),),
            ).fetchone()
        if row is None:
            return None
        user = dict(row)
        user["features"] = json.loads(user.pop("features_json") or "[]")
        user["strategies"] = json.loads(user.pop("strategies_json", "[]") or "[]")
        user["active"] = bool(user["active"])
        return user

    def list_users(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                "SELECT * FROM users ORDER BY role ASC, username ASC"
            ).fetchall()
        return [self._user_row(row) for row in rows]

    def update_user(
        self,
        user_id: int,
        *,
        role: str | None = None,
        features: list[str] | None = None,
        strategies: list[str] | None = None,
        active: bool | None = None,
        password_hash: str | None = None,
    ) -> dict[str, Any]:
        updates = ["updated_at = ?"]
        params: list[Any] = [utc_now_iso()]
        if role is not None:
            updates.append("role = ?")
            params.append(role)
        if features is not None:
            updates.append("features_json = ?")
            params.append(json.dumps(features))
        if strategies is not None:
            updates.append("strategies_json = ?")
            params.append(json.dumps(strategies))
        if active is not None:
            updates.append("active = ?")
            params.append(1 if active else 0)
        if password_hash is not None:
            updates.append("password_hash = ?")
            params.append(password_hash)
        params.append(user_id)
        with self.connect() as conn:
            cursor = conn.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                params,
            )
            if cursor.rowcount == 0:
                raise KeyError(f"User {user_id} was not found")
            if active is False or password_hash is not None:
                conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
        return self.get_user(user_id)

    def delete_user(self, user_id: int) -> bool:
        with self.connect() as conn:
            conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
            cursor = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            return cursor.rowcount > 0

    def create_session(self, *, token_hash: str, user_id: int, expires_at: str) -> None:
        now = utc_now_iso()
        with self.connect() as conn:
            conn.execute("DELETE FROM user_sessions WHERE expires_at <= ?", (now,))
            conn.execute(
                """
                INSERT INTO user_sessions (token_hash, user_id, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (token_hash, user_id, expires_at, now),
            )

    def get_session_user(self, token_hash: str) -> dict[str, Any] | None:
        now = utc_now_iso()
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT users.*
                FROM user_sessions
                JOIN users ON users.id = user_sessions.user_id
                WHERE user_sessions.token_hash = ?
                  AND user_sessions.expires_at > ?
                  AND users.active = 1
                """,
                (token_hash, now),
            ).fetchone()
        return self._user_row(row) if row else None

    def delete_session(self, token_hash: str) -> None:
        with self.connect() as conn:
            conn.execute("DELETE FROM user_sessions WHERE token_hash = ?", (token_hash,))

    @staticmethod
    def _user_row(row: sqlite3.Row) -> dict[str, Any]:
        user = dict(row)
        user["features"] = json.loads(user.pop("features_json") or "[]")
        user["strategies"] = json.loads(user.pop("strategies_json", "[]") or "[]")
        user["active"] = bool(user["active"])
        user.pop("password_hash", None)
        return user

    def insert_signal(
        self,
        *,
        ticker: str,
        exchange: str | None,
        action: str,
        price: float | None,
        timeframe: str | None,
        strategy: str | None,
        note: str | None,
        source_time: str | None,
        payload: dict[str, Any],
        enrichment: dict[str, Any],
    ) -> dict[str, Any]:
        received_at = utc_now_iso()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO signals (
                    ticker, exchange, action, price, timeframe, strategy, note,
                    source_time, received_at, payload_json, enrichment_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    exchange,
                    action,
                    price,
                    timeframe,
                    strategy,
                    note,
                    source_time,
                    received_at,
                    json.dumps(payload, ensure_ascii=True),
                    json.dumps(enrichment, ensure_ascii=True),
                ),
            )
            signal_id = cursor.lastrowid
        return self.get_signal(signal_id)

    def get_signal(self, signal_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM signals WHERE id = ?", (signal_id,)).fetchone()
        if row is None:
            raise KeyError(f"Signal {signal_id} was not found")
        return row_to_signal(row)

    def update_signal_enrichment(self, signal_id: int, enrichment: dict[str, Any]) -> None:
        with self.connect() as conn:
            conn.execute(
                "UPDATE signals SET enrichment_json = ? WHERE id = ?",
                (json.dumps(enrichment, ensure_ascii=True), signal_id),
            )

    def delete_signal(self, signal_id: int) -> bool:
        with self.connect() as conn:
            cursor = conn.execute("DELETE FROM signals WHERE id = ?", (signal_id,))
            return cursor.rowcount > 0

    def insert_derivative_signal(
        self,
        *,
        symbol: str,
        exchange: str | None,
        action: str,
        price: float,
        quantity: float,
        contract_multiplier: float,
        timeframe: str | None,
        strategy: str | None,
        reason: str | None,
        source_time: str | None,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        received_at = utc_now_iso()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO derivative_signals (
                    symbol, exchange, action, price, quantity,
                    contract_multiplier, timeframe, strategy, reason,
                    source_time, received_at, payload_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    symbol.upper(),
                    exchange,
                    action,
                    price,
                    quantity,
                    contract_multiplier,
                    timeframe,
                    strategy,
                    reason,
                    source_time,
                    received_at,
                    json.dumps(payload, ensure_ascii=True),
                ),
            )
            signal_id = cursor.lastrowid
        return self.get_derivative_signal(signal_id)

    def get_derivative_signal(self, signal_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM derivative_signals WHERE id = ?",
                (signal_id,),
            ).fetchone()
        if row is None:
            raise KeyError(f"Derivative signal {signal_id} was not found")
        return row_to_derivative_signal(row)

    def list_all_derivative_signals(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM derivative_signals
                ORDER BY received_at ASC, id ASC
                """
            ).fetchall()
        return [row_to_derivative_signal(row) for row in rows]

    def delete_derivative_signal(self, signal_id: int) -> bool:
        with self.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM derivative_signals WHERE id = ?",
                (signal_id,),
            )
            return cursor.rowcount > 0

    def find_duplicate_derivative_signal(
        self,
        *,
        symbol: str,
        action: str,
        timeframe: str | None,
        strategy: str | None,
        source_time: str | None,
        window_minutes: int,
    ) -> dict[str, Any] | None:
        params: list[Any] = [symbol.upper(), action, timeframe or "", strategy or ""]
        if source_time:
            source_clause = "AND source_time = ?"
            params.append(source_time)
        else:
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
            source_clause = "AND source_time IS NULL AND received_at >= ?"
            params.append(cutoff.isoformat())
        with self.connect() as conn:
            row = conn.execute(
                f"""
                SELECT *
                FROM derivative_signals
                WHERE symbol = ?
                  AND action = ?
                  AND COALESCE(timeframe, '') = ?
                  AND COALESCE(strategy, '') = ?
                  {source_clause}
                ORDER BY received_at DESC
                LIMIT 1
                """,
                params,
            ).fetchone()
        return row_to_derivative_signal(row) if row else None

    def get_app_setting(self, key: str, default: str | None = None) -> str | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT value FROM app_settings WHERE key = ?",
                (key,),
            ).fetchone()
        return row["value"] if row else default

    def set_app_setting(self, key: str, value: str) -> str:
        now = utc_now_iso()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO app_settings (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                """,
                (key, value, now),
            )
        return value

    def insert_manual_position(
        self,
        *,
        ticker: str,
        weight_pct: float,
        entry_price: float,
        current_price: float | None,
        quantity: float | None,
        entry_date: str | None,
        note: str | None,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        mark_price = current_price if current_price is not None else entry_price
        with self.connect() as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            cursor = conn.execute(
                """
                INSERT INTO manual_positions (
                    ticker, weight_pct, entry_price, current_price, quantity,
                    entry_date, status, note, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
                """,
                (
                    ticker.upper(),
                    weight_pct,
                    entry_price,
                    mark_price,
                    quantity,
                    entry_date or now,
                    note,
                    now,
                    now,
                ),
            )
            position_id = cursor.lastrowid
            self._insert_manual_snapshot(conn, position_id, entry_price, entry_date or now)
            if mark_price != entry_price:
                self._insert_manual_snapshot(conn, position_id, mark_price, now)
        return self.get_manual_position(position_id)

    def get_manual_position(self, position_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM manual_positions WHERE id = ?", (position_id,)
            ).fetchone()
            snapshots = conn.execute(
                """
                SELECT price, recorded_at
                FROM manual_price_snapshots
                WHERE position_id = ?
                ORDER BY recorded_at ASC, id ASC
                """,
                (position_id,),
            ).fetchall()
        if row is None:
            raise KeyError(f"Manual position {position_id} was not found")
        return row_to_manual_position(row, snapshots)

    def list_manual_positions(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM manual_positions
                ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, ticker ASC, entry_date ASC, id ASC
                """
            ).fetchall()
            snapshots_by_position: dict[int, list[sqlite3.Row]] = {}
            if rows:
                position_ids = [row["id"] for row in rows]
                placeholders = ",".join("?" for _ in position_ids)
                snapshot_rows = conn.execute(
                    f"""
                    SELECT position_id, price, recorded_at
                    FROM manual_price_snapshots
                    WHERE position_id IN ({placeholders})
                    ORDER BY recorded_at ASC, id ASC
                    """,
                    position_ids,
                ).fetchall()
                for snapshot in snapshot_rows:
                    snapshots_by_position.setdefault(snapshot["position_id"], []).append(snapshot)
        return [
            row_to_manual_position(row, snapshots_by_position.get(row["id"], []))
            for row in rows
        ]

    def list_open_manual_tickers(self) -> list[str]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT DISTINCT ticker
                FROM manual_positions
                WHERE status = 'open'
                ORDER BY ticker ASC
                """
            ).fetchall()
        return [row["ticker"] for row in rows]

    def update_manual_market_price(
        self, *, ticker: str, price: float, recorded_at: str
    ) -> int:
        ticker = ticker.upper()
        with self.connect() as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            rows = conn.execute(
                """
                SELECT id
                FROM manual_positions
                WHERE ticker = ? AND status = 'open'
                """,
                (ticker,),
            ).fetchall()
            if not rows:
                return 0
            conn.execute(
                """
                UPDATE manual_positions
                SET current_price = ?, updated_at = ?
                WHERE ticker = ? AND status = 'open'
                """,
                (price, recorded_at, ticker),
            )
            for row in rows:
                self._insert_manual_snapshot(conn, row["id"], price, recorded_at)
        return len(rows)

    def update_manual_position(
        self, position_id: int, updates: dict[str, Any]
    ) -> dict[str, Any]:
        allowed = {
            "ticker",
            "weight_pct",
            "entry_price",
            "current_price",
            "quantity",
            "entry_date",
            "note",
        }
        fields = {key: value for key, value in updates.items() if key in allowed}
        if not fields:
            return self.get_manual_position(position_id)

        if "ticker" in fields and fields["ticker"] is not None:
            fields["ticker"] = str(fields["ticker"]).upper()
        now = utc_now_iso()
        fields["updated_at"] = now
        assignments = ", ".join(f"{key} = ?" for key in fields)
        params = [*fields.values(), position_id]

        with self.connect() as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            cursor = conn.execute(
                f"UPDATE manual_positions SET {assignments} WHERE id = ?",
                params,
            )
            if cursor.rowcount == 0:
                raise KeyError(f"Manual position {position_id} was not found")
            if "entry_price" in updates and updates["entry_price"] is not None:
                position = conn.execute(
                    "SELECT entry_date FROM manual_positions WHERE id = ?",
                    (position_id,),
                ).fetchone()
                self._insert_manual_snapshot(
                    conn, position_id, float(updates["entry_price"]), position["entry_date"]
                )
            if "current_price" in updates and updates["current_price"] is not None:
                self._insert_manual_snapshot(
                    conn, position_id, float(updates["current_price"]), now
                )
        return self.get_manual_position(position_id)

    def close_manual_position(
        self, position_id: int, *, exit_price: float, closed_at: str | None
    ) -> dict[str, Any]:
        now = utc_now_iso()
        close_time = closed_at or now
        with self.connect() as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            cursor = conn.execute(
                """
                UPDATE manual_positions
                SET status = 'closed',
                    exit_price = ?,
                    current_price = ?,
                    closed_at = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (exit_price, exit_price, close_time, now, position_id),
            )
            if cursor.rowcount == 0:
                raise KeyError(f"Manual position {position_id} was not found")
            self._insert_manual_snapshot(conn, position_id, exit_price, close_time)
        return self.get_manual_position(position_id)

    def delete_manual_position(self, position_id: int) -> bool:
        with self.connect() as conn:
            conn.execute("PRAGMA foreign_keys = ON")
            cursor = conn.execute("DELETE FROM manual_positions WHERE id = ?", (position_id,))
            return cursor.rowcount > 0

    def upsert_manual_daily_performance(
        self,
        *,
        trade_date: str,
        portfolio_return_pct: float | None,
        equity_value: float,
        total_weight_pct: float,
        open_count: int,
        closed_count: int,
        cost_value: float | None,
        market_value: float | None,
        pnl_value: float | None,
        recorded_at: str,
    ) -> dict[str, Any]:
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO manual_daily_performance (
                    trade_date, portfolio_return_pct, equity_value,
                    total_weight_pct, open_count, closed_count,
                    cost_value, market_value, pnl_value, recorded_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(trade_date) DO UPDATE SET
                    portfolio_return_pct = excluded.portfolio_return_pct,
                    equity_value = excluded.equity_value,
                    total_weight_pct = excluded.total_weight_pct,
                    open_count = excluded.open_count,
                    closed_count = excluded.closed_count,
                    cost_value = excluded.cost_value,
                    market_value = excluded.market_value,
                    pnl_value = excluded.pnl_value,
                    recorded_at = excluded.recorded_at
                """,
                (
                    trade_date,
                    portfolio_return_pct,
                    equity_value,
                    total_weight_pct,
                    open_count,
                    closed_count,
                    cost_value,
                    market_value,
                    pnl_value,
                    recorded_at,
                ),
            )
        return self.get_manual_daily_performance(trade_date)

    def get_manual_daily_performance(self, trade_date: str) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM manual_daily_performance WHERE trade_date = ?",
                (trade_date,),
            ).fetchone()
        if row is None:
            raise KeyError(f"Manual daily performance {trade_date} was not found")
        return dict(row)

    def list_manual_daily_performance(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM manual_daily_performance
                ORDER BY trade_date ASC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def delete_manual_daily_performance(self, trade_date: str) -> bool:
        with self.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM manual_daily_performance WHERE trade_date = ?",
                (trade_date,),
            )
            return cursor.rowcount > 0

    def upsert_strategy_backtest_stat(
        self,
        *,
        ticker: str,
        strategy: str,
        metric_name: str,
        closed_trades: int | None,
        negative_trades: int | None,
        max_loss_pct: float | None,
        min_loss_pct: float | None,
        avg_loss_pct: float | None,
        max_gain_pct: float | None,
        avg_gain_pct: float | None,
        tp1_hits: int | None,
        tp1_total: int | None,
        tp2_hits: int | None,
        tp2_total: int | None,
        tp3_hits: int | None,
        tp3_total: int | None,
        avg_hold_bars: float | None,
        avg_hold_days: float | None,
        note: str | None,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        normalized_ticker = ticker.strip().upper()
        normalized_strategy = strategy.strip()
        normalized_metric = metric_name.strip()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO strategy_backtest_stats (
                    ticker, strategy, metric_name, closed_trades, negative_trades,
                    max_loss_pct, min_loss_pct, avg_loss_pct, max_gain_pct,
                    avg_gain_pct, tp1_hits, tp1_total, tp2_hits, tp2_total,
                    tp3_hits, tp3_total, avg_hold_bars, avg_hold_days, note,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ticker, strategy, metric_name) DO UPDATE SET
                    closed_trades = excluded.closed_trades,
                    negative_trades = excluded.negative_trades,
                    max_loss_pct = excluded.max_loss_pct,
                    min_loss_pct = excluded.min_loss_pct,
                    avg_loss_pct = excluded.avg_loss_pct,
                    max_gain_pct = excluded.max_gain_pct,
                    avg_gain_pct = excluded.avg_gain_pct,
                    tp1_hits = excluded.tp1_hits,
                    tp1_total = excluded.tp1_total,
                    tp2_hits = excluded.tp2_hits,
                    tp2_total = excluded.tp2_total,
                    tp3_hits = excluded.tp3_hits,
                    tp3_total = excluded.tp3_total,
                    avg_hold_bars = excluded.avg_hold_bars,
                    avg_hold_days = excluded.avg_hold_days,
                    note = excluded.note,
                    updated_at = excluded.updated_at
                """,
                (
                    normalized_ticker,
                    normalized_strategy,
                    normalized_metric,
                    closed_trades,
                    negative_trades,
                    max_loss_pct,
                    min_loss_pct,
                    avg_loss_pct,
                    max_gain_pct,
                    avg_gain_pct,
                    tp1_hits,
                    tp1_total,
                    tp2_hits,
                    tp2_total,
                    tp3_hits,
                    tp3_total,
                    avg_hold_bars,
                    avg_hold_days,
                    note,
                    now,
                    now,
                ),
            )
        return self.get_strategy_backtest_stat(
            ticker=normalized_ticker,
            strategy=normalized_strategy,
            metric_name=normalized_metric,
        )

    def get_strategy_backtest_stat(
        self, *, ticker: str, strategy: str, metric_name: str
    ) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM strategy_backtest_stats
                WHERE ticker = ? AND strategy = ? AND metric_name = ?
                """,
                (ticker.strip().upper(), strategy.strip(), metric_name.strip()),
            ).fetchone()
        if row is None:
            raise KeyError("Strategy backtest stat was not found")
        return dict(row)

    def list_strategy_backtest_stats(
        self, *, ticker: str | None = None, strategy: str | None = None
    ) -> list[dict[str, Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.strip().upper())
        if strategy:
            clauses.append("strategy = ?")
            params.append(strategy.strip())
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM strategy_backtest_stats
                {where}
                ORDER BY strategy ASC, ticker ASC, metric_name ASC
                """,
                params,
            ).fetchall()
        return [dict(row) for row in rows]

    def delete_strategy_backtest_stat(self, stat_id: int) -> bool:
        with self.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM strategy_backtest_stats WHERE id = ?",
                (stat_id,),
            )
            return cursor.rowcount > 0

    def upsert_kelly_entry(
        self,
        *,
        ticker: str,
        strategy: str,
        win_rate: float | None,
        winning_trades: float | None,
        total_trades: float | None,
        profit_factor: float | None,
        max_drawdown: float | None,
        target_drawdown: float | None,
        fraction: float | None,
        max_allocation: float | None,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        normalized_ticker = ticker.strip().upper()
        normalized_strategy = strategy.strip()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO kelly_entries (
                    ticker, strategy, win_rate, winning_trades, total_trades,
                    profit_factor, max_drawdown, target_drawdown, fraction,
                    max_allocation, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ticker, strategy) DO UPDATE SET
                    win_rate = excluded.win_rate,
                    winning_trades = excluded.winning_trades,
                    total_trades = excluded.total_trades,
                    profit_factor = excluded.profit_factor,
                    max_drawdown = excluded.max_drawdown,
                    target_drawdown = excluded.target_drawdown,
                    fraction = excluded.fraction,
                    max_allocation = excluded.max_allocation,
                    updated_at = excluded.updated_at
                """,
                (
                    normalized_ticker,
                    normalized_strategy,
                    win_rate,
                    winning_trades,
                    total_trades,
                    profit_factor,
                    max_drawdown,
                    target_drawdown,
                    fraction,
                    max_allocation,
                    now,
                    now,
                ),
            )
        return self.get_kelly_entry(ticker=normalized_ticker, strategy=normalized_strategy)

    def get_kelly_entry(self, *, ticker: str, strategy: str) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM kelly_entries
                WHERE ticker = ? AND strategy = ?
                """,
                (ticker.strip().upper(), strategy.strip()),
            ).fetchone()
        if row is None:
            raise KeyError("Kelly entry was not found")
        return dict(row)

    def list_kelly_entries(
        self, *, ticker: str | None = None, strategy: str | None = None
    ) -> list[dict[str, Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.strip().upper())
        if strategy:
            clauses.append("strategy = ?")
            params.append(strategy.strip())
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM kelly_entries
                {where}
                ORDER BY strategy ASC, ticker ASC
                """,
                params,
            ).fetchall()
        return [dict(row) for row in rows]

    def delete_kelly_entry(self, entry_id: int) -> bool:
        with self.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM kelly_entries WHERE id = ?",
                (entry_id,),
            )
            return cursor.rowcount > 0

    def insert_dca_plan(
        self,
        *,
        user_id: int,
        ticker: str,
        strategy: str,
        initial_capital: float | None,
        allocation_pct: float | None,
        entry_price: float | None,
        distance_mode: str,
        max_loss_pct: float | None,
        lot_size: float | None,
        levels: list[dict[str, Any]],
        result: dict[str, Any],
    ) -> dict[str, Any]:
        now = utc_now_iso()
        normalized_ticker = ticker.strip().upper()
        normalized_strategy = strategy.strip()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO dca_plans (
                    user_id, ticker, strategy, initial_capital, allocation_pct,
                    entry_price, distance_mode, max_loss_pct, lot_size,
                    levels_json, result_json, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    normalized_ticker,
                    normalized_strategy,
                    initial_capital,
                    allocation_pct,
                    entry_price,
                    distance_mode,
                    max_loss_pct,
                    lot_size,
                    json.dumps(levels),
                    json.dumps(result),
                    now,
                    now,
                ),
            )
            plan_id = cursor.lastrowid
        return self.get_dca_plan(plan_id=plan_id, user_id=user_id)

    def update_dca_plan(
        self,
        *,
        plan_id: int,
        user_id: int,
        ticker: str,
        strategy: str,
        initial_capital: float | None,
        allocation_pct: float | None,
        entry_price: float | None,
        distance_mode: str,
        max_loss_pct: float | None,
        lot_size: float | None,
        levels: list[dict[str, Any]],
        result: dict[str, Any],
    ) -> dict[str, Any]:
        now = utc_now_iso()
        normalized_ticker = ticker.strip().upper()
        normalized_strategy = strategy.strip()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                UPDATE dca_plans
                SET ticker = ?,
                    strategy = ?,
                    initial_capital = ?,
                    allocation_pct = ?,
                    entry_price = ?,
                    distance_mode = ?,
                    max_loss_pct = ?,
                    lot_size = ?,
                    levels_json = ?,
                    result_json = ?,
                    updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    normalized_ticker,
                    normalized_strategy,
                    initial_capital,
                    allocation_pct,
                    entry_price,
                    distance_mode,
                    max_loss_pct,
                    lot_size,
                    json.dumps(levels),
                    json.dumps(result),
                    now,
                    plan_id,
                    user_id,
                ),
            )
            if cursor.rowcount == 0:
                raise KeyError("DCA plan was not found")
        return self.get_dca_plan(plan_id=plan_id, user_id=user_id)

    def get_dca_plan(self, *, plan_id: int, user_id: int | None = None) -> dict[str, Any]:
        clauses = ["id = ?"]
        params: list[Any] = [plan_id]
        if user_id is not None:
            clauses.append("user_id = ?")
            params.append(user_id)
        with self.connect() as conn:
            row = conn.execute(
                f"""
                SELECT *
                FROM dca_plans
                WHERE {' AND '.join(clauses)}
                """,
                params,
            ).fetchone()
        if row is None:
            raise KeyError("DCA plan was not found")
        return row_to_dca_plan(row)

    def list_dca_plans(self, *, user_id: int | None = None) -> list[dict[str, Any]]:
        params: list[Any] = []
        where = ""
        if user_id is not None:
            where = "WHERE user_id = ?"
            params.append(user_id)
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT *
                FROM dca_plans
                {where}
                ORDER BY updated_at DESC, id DESC
                """,
                params,
            ).fetchall()
        return [row_to_dca_plan(row) for row in rows]

    def delete_dca_plan(self, *, plan_id: int, user_id: int | None = None) -> bool:
        clauses = ["id = ?"]
        params: list[Any] = [plan_id]
        if user_id is not None:
            clauses.append("user_id = ?")
            params.append(user_id)
        with self.connect() as conn:
            cursor = conn.execute(
                f"DELETE FROM dca_plans WHERE {' AND '.join(clauses)}",
                params,
            )
            return cursor.rowcount > 0

    def get_dca_user_settings(self, *, user_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT user_id, initial_capital, updated_at
                FROM dca_user_settings
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()
        if row is None:
            return {"user_id": user_id, "initial_capital": None, "updated_at": None}
        return dict(row)

    def upsert_dca_user_settings(
        self,
        *,
        user_id: int,
        initial_capital: float | None,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO dca_user_settings (user_id, initial_capital, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    initial_capital = excluded.initial_capital,
                    updated_at = excluded.updated_at
                """,
                (user_id, initial_capital, now),
            )
        return self.get_dca_user_settings(user_id=user_id)

    def insert_dividend_event(
        self,
        *,
        ticker: str,
        ex_date: str,
        cash_amount: float | None,
        stock_ratio_pct: float | None,
        issue_ratio_pct: float | None = None,
        issue_price: float | None = None,
        note: str | None = None,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO dividend_events (
                    ticker, ex_date, cash_amount, stock_ratio_pct,
                    issue_ratio_pct, issue_price, note,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker.upper(),
                    ex_date,
                    cash_amount,
                    stock_ratio_pct,
                    issue_ratio_pct,
                    issue_price,
                    note,
                    now,
                    now,
                ),
            )
            event_id = cursor.lastrowid
        return self.get_dividend_event(event_id)

    def upsert_external_dividend_events(
        self, events: list[dict[str, Any]]
    ) -> int:
        now = utc_now_iso()
        updated = 0
        with self.connect() as conn:
            for event in events:
                source = str(event.get("source") or "").strip().lower()
                external_id = str(event.get("external_id") or "").strip()
                ticker = str(event.get("ticker") or "").strip().upper()
                ex_date = str(event.get("ex_date") or "").strip()
                if not source or not external_id or not ticker or not ex_date:
                    continue
                existing = conn.execute(
                    """
                    SELECT id
                    FROM dividend_events
                    WHERE source = ? AND external_id = ?
                    """,
                    (source, external_id),
                ).fetchone()
                if existing:
                    conn.execute(
                        """
                        UPDATE dividend_events
                        SET ticker = ?, ex_date = ?, note = ?, updated_at = ?
                        WHERE id = ?
                        """,
                        (ticker, ex_date, event.get("note"), now, existing["id"]),
                    )
                    updated += 1
                    continue
                conn.execute(
                    """
                    INSERT INTO dividend_events (
                        ticker, ex_date, cash_amount, stock_ratio_pct,
                        issue_ratio_pct, issue_price, note, source, external_id,
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ticker,
                        ex_date,
                        event.get("cash_amount"),
                        event.get("stock_ratio_pct"),
                        event.get("issue_ratio_pct"),
                        event.get("issue_price"),
                        event.get("note"),
                        source,
                        external_id,
                        now,
                        now,
                    ),
                )
                updated += 1
        return updated

    def get_dividend_event(self, event_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM dividend_events WHERE id = ?",
                (event_id,),
            ).fetchone()
        if row is None:
            raise KeyError(f"Dividend event {event_id} was not found")
        return dict(row)

    def list_dividend_events(self, ticker: str | None = None) -> list[dict[str, Any]]:
        params: list[Any] = []
        where = ""
        if ticker:
            where = "WHERE ticker = ?"
            params.append(ticker.upper())
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT *
                FROM dividend_events
                {where}
                ORDER BY ex_date ASC, ticker ASC, id ASC
                """,
                params,
            ).fetchall()
        return [dict(row) for row in rows]

    def delete_dividend_event(self, event_id: int) -> bool:
        with self.connect() as conn:
            cursor = conn.execute("DELETE FROM dividend_events WHERE id = ?", (event_id,))
            return cursor.rowcount > 0

    def delete_dividend_events_for_ticker(self, ticker: str) -> int:
        with self.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM dividend_events WHERE ticker = ?",
                (ticker.strip().upper(),),
            )
            return cursor.rowcount

    def _insert_manual_snapshot(
        self,
        conn: sqlite3.Connection,
        position_id: int,
        price: float,
        recorded_at: str,
    ) -> None:
        conn.execute(
            """
            INSERT INTO manual_price_snapshots (position_id, price, recorded_at)
            VALUES (?, ?, ?)
            """,
            (position_id, price, recorded_at),
        )

    def find_duplicate_signal(
        self,
        *,
        ticker: str,
        action: str,
        timeframe: str | None,
        strategy: str | None,
        source_time: str | None,
        window_minutes: int,
    ) -> dict[str, Any] | None:
        params: list[Any] = [ticker, action, timeframe or "", strategy or ""]
        source_clause = ""
        if source_time:
            source_clause = "AND source_time = ?"
            params.append(source_time)
        else:
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
            source_clause = "AND source_time IS NULL AND received_at >= ?"
            params.append(cutoff.isoformat())

        with self.connect() as conn:
            row = conn.execute(
                f"""
                SELECT * FROM signals
                WHERE ticker = ?
                  AND action = ?
                  AND COALESCE(timeframe, '') = ?
                  AND COALESCE(strategy, '') = ?
                  {source_clause}
                ORDER BY received_at DESC
                LIMIT 1
                """,
                params,
            ).fetchone()
        return row_to_signal(row) if row else None

    def record_invalid_signal(
        self,
        *,
        ticker: str | None,
        action: str | None,
        timeframe: str | None,
        strategy: str | None,
        reason: str,
        source_time: str | None,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        received_at = utc_now_iso()
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO invalid_signals (
                    ticker, action, timeframe, strategy, reason,
                    source_time, received_at, payload_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    action,
                    timeframe,
                    strategy,
                    reason,
                    source_time,
                    received_at,
                    json.dumps(payload, ensure_ascii=True),
                ),
            )
            invalid_id = cursor.lastrowid
        return self.get_invalid_signal(invalid_id)

    def get_invalid_signal(self, invalid_id: int) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM invalid_signals WHERE id = ?", (invalid_id,)
            ).fetchone()
        if row is None:
            raise KeyError(f"Invalid signal {invalid_id} was not found")
        return row_to_invalid_signal(row)

    def list_invalid_signals(self, *, limit: int = 100) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 500))
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM invalid_signals
                ORDER BY received_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [row_to_invalid_signal(row) for row in rows]

    def list_signals(
        self, *, ticker: str | None = None, limit: int = 100
    ) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 500))
        params: list[Any] = []
        where = ""
        if ticker:
            where = "WHERE ticker = ?"
            params.append(ticker.upper())
        params.append(limit)
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM signals
                {where}
                ORDER BY received_at DESC
                LIMIT ?
                """,
                params,
            ).fetchall()
        return [row_to_signal(row) for row in rows]

    def list_all_signals(self, *, ticker: str | None = None) -> list[dict[str, Any]]:
        params: list[Any] = []
        where = ""
        if ticker:
            where = "WHERE ticker = ?"
            params.append(ticker.upper())
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM signals
                {where}
                ORDER BY received_at ASC, id ASC
                """,
                params,
            ).fetchall()
        return [row_to_signal(row) for row in rows]

    def summary(self) -> dict[str, Any]:
        with self.connect() as conn:
            totals = conn.execute(
                """
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN lower(action) = 'buy' THEN 1 ELSE 0 END) AS buy_count,
                    SUM(CASE WHEN lower(action) = 'sell' THEN 1 ELSE 0 END) AS sell_count,
                    COUNT(DISTINCT ticker) AS tickers
                FROM signals
                """
            ).fetchone()
            latest = conn.execute(
                """
                SELECT received_at
                FROM signals
                ORDER BY received_at DESC
                LIMIT 1
                """
            ).fetchone()
        return {
            "total": totals["total"] or 0,
            "buy_count": totals["buy_count"] or 0,
            "sell_count": totals["sell_count"] or 0,
            "tickers": totals["tickers"] or 0,
            "latest_received_at": latest["received_at"] if latest else None,
        }

    def upsert_portfolio_backtest(
        self,
        *,
        source: str,
        report_date: str,
        title: str,
        research_status: str,
        generated_at: str | None,
        summary: dict[str, Any],
    ) -> dict[str, Any]:
        received_at = utc_now_iso()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO portfolio_backtests (
                    source, report_date, title, research_status, generated_at,
                    received_at, summary_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(source, report_date) DO UPDATE SET
                    title = excluded.title,
                    research_status = excluded.research_status,
                    generated_at = excluded.generated_at,
                    received_at = excluded.received_at,
                    summary_json = excluded.summary_json
                """,
                (
                    source.strip(),
                    report_date.strip(),
                    title.strip(),
                    research_status.strip(),
                    generated_at,
                    received_at,
                    json.dumps(summary, ensure_ascii=True),
                ),
            )
        return self.get_portfolio_backtest(source=source, report_date=report_date)

    def get_portfolio_backtest(
        self, *, source: str, report_date: str
    ) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM portfolio_backtests
                WHERE source = ? AND report_date = ?
                """,
                (source.strip(), report_date.strip()),
            ).fetchone()
        if row is None:
            raise KeyError(f"Portfolio backtest {source}:{report_date} was not found")
        return row_to_portfolio_backtest(row)

    def latest_portfolio_backtest(self) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM portfolio_backtests
                ORDER BY report_date DESC, received_at DESC, id DESC
                LIMIT 1
                """
            ).fetchone()
        return row_to_portfolio_backtest(row) if row else None

    def list_portfolio_backtests(self, *, limit: int = 12) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 50))
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM portfolio_backtests
                ORDER BY report_date DESC, received_at DESC, id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [row_to_portfolio_backtest(row) for row in rows]


def row_to_signal(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["payload"] = json.loads(data.pop("payload_json") or "{}")
    data["enrichment"] = json.loads(data.pop("enrichment_json") or "{}")
    return data


def row_to_invalid_signal(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["payload"] = json.loads(data.pop("payload_json") or "{}")
    return data


def row_to_portfolio_backtest(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["summary"] = json.loads(data.pop("summary_json") or "{}")
    return data


def row_to_derivative_signal(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["payload"] = json.loads(data.pop("payload_json") or "{}")
    return data


def row_to_dca_plan(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["levels"] = json.loads(data.pop("levels_json") or "[]")
    data["result"] = json.loads(data.pop("result_json") or "{}")
    return data


def row_to_manual_position(
    row: sqlite3.Row, snapshots: list[sqlite3.Row]
) -> dict[str, Any]:
    data = dict(row)
    data["snapshots"] = [
        {"price": snapshot["price"], "recorded_at": snapshot["recorded_at"]}
        for snapshot in snapshots
    ]
    return data
