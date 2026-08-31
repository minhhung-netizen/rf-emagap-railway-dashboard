from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    database_path: Path
    webhook_secret: str | None = None
    backtest_ingest_token: str | None = None
    price_refresh_minutes: int = 120
    market_sessions: str = "09:00-11:30,13:00-15:00"
    duplicate_window_minutes: int = 5
    vnstock_cache_ttl_minutes: int = 240
    vnstock_min_request_interval_seconds: float = 4.0
    vnstock_lookback_days: int = 90
    vnstock_include_metrics: bool = False
    dnse_api_key: str | None = None
    dnse_api_secret: str | None = None
    dnse_base_url: str = "https://openapi.dnse.com.vn"
    dnse_api_version: str = "2026-05-07"
    fireant_access_token: str | None = None
    fireant_base_url: str = "https://api.fireant.vn"
    fireant_cache_ttl_minutes: int = 240
    fireant_min_request_interval_seconds: float = 1.0
    default_signal_weight_pct: float = 5.0
    derivative_contract_multiplier: float = 100000.0
    derivative_initial_capital: float = 100000000.0
    admin_username: str = "admin"
    admin_password: str = "change-me"
    admin_password_managed: bool = False
    session_days: int = 30


def _resolve_path(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    return path


def get_settings() -> Settings:
    _load_env_file()
    database_path = _resolve_path(os.getenv("DATABASE_PATH", "data/signals.db"))
    secret = os.getenv("WEBHOOK_SECRET") or None
    backtest_ingest_token = os.getenv("BACKTEST_INGEST_TOKEN") or None
    refresh_minutes = int(os.getenv("PRICE_REFRESH_MINUTES", "120"))
    market_sessions = os.getenv("MARKET_SESSIONS", "09:00-11:30,13:00-15:00")
    duplicate_window_minutes = int(os.getenv("DUPLICATE_WINDOW_MINUTES", "5"))
    vnstock_cache_ttl_minutes = int(os.getenv("VNSTOCK_CACHE_TTL_MINUTES", "240"))
    vnstock_min_request_interval_seconds = float(
        os.getenv("VNSTOCK_MIN_REQUEST_INTERVAL_SECONDS", "4")
    )
    vnstock_lookback_days = int(os.getenv("VNSTOCK_LOOKBACK_DAYS", "90"))
    vnstock_include_metrics = _env_bool("VNSTOCK_INCLUDE_METRICS", default=False)
    dnse_api_key = os.getenv("DNSE_API_KEY") or None
    dnse_api_secret = os.getenv("DNSE_API_SECRET") or None
    dnse_base_url = os.getenv("DNSE_BASE_URL", "https://openapi.dnse.com.vn")
    dnse_api_version = os.getenv("DNSE_API_VERSION", "2026-05-07")
    fireant_access_token = os.getenv("FIREANT_ACCESS_TOKEN") or None
    fireant_base_url = os.getenv("FIREANT_BASE_URL", "https://api.fireant.vn")
    fireant_cache_ttl_minutes = int(os.getenv("FIREANT_CACHE_TTL_MINUTES", "240"))
    fireant_min_request_interval_seconds = float(
        os.getenv("FIREANT_MIN_REQUEST_INTERVAL_SECONDS", "1")
    )
    default_signal_weight_pct = float(os.getenv("DEFAULT_SIGNAL_WEIGHT_PCT", "5"))
    derivative_contract_multiplier = float(
        os.getenv("DERIVATIVE_CONTRACT_MULTIPLIER", "100000")
    )
    derivative_initial_capital = float(
        os.getenv("DERIVATIVE_INITIAL_CAPITAL", "100000000")
    )
    admin_username = os.getenv("ADMIN_USERNAME", "admin").strip() or "admin"
    admin_password = os.getenv("ADMIN_PASSWORD", "change-me")
    admin_password_managed = "ADMIN_PASSWORD" in os.environ
    session_days = int(os.getenv("SESSION_DAYS", "30"))
    return Settings(
        database_path=database_path,
        webhook_secret=secret,
        backtest_ingest_token=backtest_ingest_token,
        price_refresh_minutes=max(1, refresh_minutes),
        market_sessions=market_sessions,
        duplicate_window_minutes=max(1, duplicate_window_minutes),
        vnstock_cache_ttl_minutes=max(1, vnstock_cache_ttl_minutes),
        vnstock_min_request_interval_seconds=max(0.0, vnstock_min_request_interval_seconds),
        vnstock_lookback_days=max(30, vnstock_lookback_days),
        vnstock_include_metrics=vnstock_include_metrics,
        dnse_api_key=dnse_api_key,
        dnse_api_secret=dnse_api_secret,
        dnse_base_url=dnse_base_url,
        dnse_api_version=dnse_api_version,
        fireant_access_token=fireant_access_token,
        fireant_base_url=fireant_base_url,
        fireant_cache_ttl_minutes=max(1, fireant_cache_ttl_minutes),
        fireant_min_request_interval_seconds=max(0.0, fireant_min_request_interval_seconds),
        default_signal_weight_pct=max(0.01, default_signal_weight_pct),
        derivative_contract_multiplier=max(0.01, derivative_contract_multiplier),
        derivative_initial_capital=max(0.01, derivative_initial_capital),
        admin_username=admin_username,
        admin_password=admin_password,
        admin_password_managed=admin_password_managed,
        session_days=max(1, session_days),
    )


def _load_env_file() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(PROJECT_ROOT / ".env")


def _env_bool(name: str, *, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}
