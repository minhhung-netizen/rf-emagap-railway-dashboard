from __future__ import annotations

import asyncio
import csv
import hmac
import io
import logging
import sqlite3
from contextlib import asynccontextmanager
from datetime import date
from typing import Any

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.config import PROJECT_ROOT, get_settings
from app.database import SignalStore, utc_now_iso
from app.services.enrichment import (
    DnseEnricher,
    FireAntEnricher,
    MarketDataEnricher,
    VnstockEnricher,
    coerce_float,
    fetch_dividend_events,
    fetch_industry_map,
    normalize_stock_price,
    normalize_action,
    normalize_ticker,
)
from app.services.derivatives import (
    build_derivative_performance,
    normalize_derivative_action,
)
from app.services.dividends import (
    relevant_dividend_events_for_positions,
    upcoming_dividend_events_for_positions,
)
from app.services.market_hours import is_market_open
from app.services.manual_portfolio import (
    build_daily_performance_record,
    build_manual_portfolio,
    is_after_daily_cutoff,
    is_after_manual_price_refresh_time,
    market_date_iso,
)
from app.services.performance import DEFAULT_STRATEGY, build_performance
from app.services.portfolio_gate import (
    evaluate_portfolio_signal,
    guardrails_from_backtest,
    portfolio_gate_state,
)
from app.services.webhook_payload import parse_forgiving_json
from app.services.auth import (
    ALL_FEATURES,
    SESSION_COOKIE,
    hash_password,
    hash_session_token,
    new_session,
    public_user,
    verify_password,
)


settings = get_settings()
store = SignalStore(settings.database_path)
configured_admin = store.get_user_credentials(settings.admin_username)
if configured_admin is None:
    store.ensure_admin_user(
        username=settings.admin_username,
        password_hash=hash_password(settings.admin_password),
    )
else:
    password_changed = settings.admin_password_managed and not verify_password(
        settings.admin_password,
        configured_admin["password_hash"],
    )
    if (
        configured_admin["role"] != "admin"
        or not configured_admin["active"]
        or password_changed
    ):
        store.update_user(
            configured_admin["id"],
            role="admin",
            active=True,
            password_hash=hash_password(settings.admin_password)
            if password_changed
            else None,
        )
logger = logging.getLogger(__name__)
vnstock_enricher = VnstockEnricher(
    lookback_days=settings.vnstock_lookback_days,
    cache_ttl_seconds=settings.vnstock_cache_ttl_minutes * 60,
    min_request_interval_seconds=settings.vnstock_min_request_interval_seconds,
    include_metrics=settings.vnstock_include_metrics,
)
dnse_enricher = None
if settings.dnse_api_key and settings.dnse_api_secret:
    try:
        dnse_enricher = DnseEnricher(
            api_key=settings.dnse_api_key,
            api_secret=settings.dnse_api_secret,
            base_url=settings.dnse_base_url,
            api_version=settings.dnse_api_version,
            lookback_days=settings.vnstock_lookback_days,
            cache_ttl_seconds=settings.vnstock_cache_ttl_minutes * 60,
            min_request_interval_seconds=settings.vnstock_min_request_interval_seconds,
        )
    except BaseException:
        logger.exception("Could not initialize DNSE market-data provider; using VNStock")
fireant_enricher = None
if settings.fireant_access_token:
    try:
        fireant_enricher = FireAntEnricher(
            access_token=settings.fireant_access_token,
            base_url=settings.fireant_base_url,
            lookback_days=settings.vnstock_lookback_days,
            cache_ttl_seconds=settings.fireant_cache_ttl_minutes * 60,
            min_request_interval_seconds=settings.fireant_min_request_interval_seconds,
        )
    except BaseException:
        logger.exception("Could not initialize FireAnt market-data provider")
enricher = MarketDataEnricher(
    fireant=fireant_enricher,
    dnse=dnse_enricher,
    vnstock=vnstock_enricher,
)
last_auto_manual_price_refresh_date: str | None = None
enrichment_queue: asyncio.Queue[tuple[int, str]] | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global enrichment_queue
    enrichment_queue = asyncio.Queue(maxsize=1000)
    tasks = [
        asyncio.create_task(signal_enrichment_worker()),
        asyncio.create_task(price_refresh_loop()),
        asyncio.create_task(sector_autofill_loop()),
        asyncio.create_task(dividend_autofetch_loop()),
    ]
    try:
        yield
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        enrichment_queue = None


app = FastAPI(title="RF + EMA Portfolio Gate", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=PROJECT_ROOT / "app" / "static"), name="static")

FEATURE_PATHS = {
    "overview": ("/api/summary", "/api/signals", "/api/chart/"),
    "positions": ("/api/performance", "/api/sectors"),
    "performance": ("/api/performance",),
    "portfolioMonitor": ("/api/portfolio-backtests", "/api/portfolio-gate"),
    "dividends": ("/api/dividend-events",),
    "logs": ("/api/invalid-signals", "/api/export/"),
}
RETIRED_API_PREFIXES = (
    "/api/derivatives",
    "/api/manual-portfolio",
    "/api/dca-",
    "/api/kelly-entries",
    "/api/backtest-stats",
    "/api/settings/derivative-capital",
)


@app.middleware("http")
async def authorize_dashboard_request(request: Request, call_next):
    path = request.url.path
    if path.startswith(RETIRED_API_PREFIXES):
        return JSONResponse(
            {"detail": "This Railway portfolio-gate edition does not include this feature"},
            status_code=410,
        )
    if (
        path == "/"
        or path == "/health"
        or path == "/webhook"
        or path == "/api/portfolio-backtests/import"
        or path == "/api/auth/login"
        or path == "/api/auth/me"
        or path.startswith("/static/")
    ):
        return await call_next(request)

    if not path.startswith("/api/"):
        return await call_next(request)

    token = request.cookies.get(SESSION_COOKIE)
    user = store.get_session_user(hash_session_token(token)) if token else None
    if user is None:
        return JSONResponse({"detail": "Authentication required"}, status_code=401)
    request.state.user = user

    if path.startswith("/api/admin/") and user["role"] != "admin":
        return JSONResponse({"detail": "Admin access required"}, status_code=403)

    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if path == "/api/auth/logout":
            return await call_next(request)
        if (
            (path.startswith("/api/dca-plans") or path.startswith("/api/dca-settings"))
            and "dcaSizing" in set(user.get("features") or [])
        ):
            return await call_next(request)
        if user["role"] != "admin":
            return JSONResponse({"detail": "Read-only account"}, status_code=403)

    if user["role"] != "admin" and request.method in {"GET", "HEAD"}:
        allowed = set(user.get("features") or [])
        if path == "/api/export/database":
            return JSONResponse({"detail": "Admin access required"}, status_code=403)
        required = {
            feature
            for feature, prefixes in FEATURE_PATHS.items()
            if any(path == prefix or path.startswith(prefix) for prefix in prefixes)
        }
        if required and not required.intersection(allowed):
            return JSONResponse({"detail": "Feature is not enabled"}, status_code=403)

    return await call_next(request)


class WebhookPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    ticker: str | dict[str, Any] = Field(..., examples=["HOSE:VPB"])
    action: str = Field(..., examples=["buy"])
    price: str | float | int | None = None
    timeframe: str | None = None
    strategy: str | None = None
    note: str | None = None
    time: str | None = None
    secret: str | None = None
    base_strategy: str | None = None
    confirm_for: str | None = None
    requires_open_strategy: str | None = None
    signal_type: str | None = None
    asset_type: str | None = None
    market: str | None = None
    quantity: str | float | int | None = None
    contract_multiplier: str | float | int | None = None
    reason: str | None = None
    take_profit: str | float | int | None = None
    stop_loss: str | float | int | None = None
    allocation_pct: str | float | int | None = None
    sleeve: str | None = None
    portfolio_sleeve: str | None = None
    sector: str | None = None


class ManualPositionPayload(BaseModel):
    ticker: str = Field(..., examples=["VPB"])
    weight_pct: float = Field(..., gt=0, examples=[10])
    entry_price: float = Field(..., gt=0, examples=[19.5])
    current_price: float | None = Field(default=None, gt=0, examples=[20.2])
    quantity: float | None = Field(default=None, gt=0, examples=[1000])
    entry_date: str | None = None
    note: str | None = None


class ManualPositionUpdatePayload(BaseModel):
    ticker: str | None = None
    weight_pct: float | None = Field(default=None, gt=0)
    entry_price: float | None = Field(default=None, gt=0)
    current_price: float | None = Field(default=None, gt=0)
    quantity: float | None = Field(default=None, gt=0)
    entry_date: str | None = None
    note: str | None = None


class ManualClosePayload(BaseModel):
    exit_price: float = Field(..., gt=0)
    closed_at: str | None = None


class DividendEventPayload(BaseModel):
    ticker: str = Field(..., examples=["VPB"])
    ex_date: str = Field(..., examples=["2026-06-10"])
    cash_amount: float | None = Field(default=None, ge=0, examples=[1000])
    stock_ratio_pct: float | None = Field(default=None, ge=0, examples=[10])
    issue_ratio_pct: float | None = Field(default=None, ge=0, examples=[20])
    issue_price: float | None = Field(default=None, ge=0, examples=[10000])
    note: str | None = None


class SectorMappingPayload(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20, examples=["VPB"])
    sector: str = Field(..., min_length=1, max_length=120, examples=["Ngân hàng"])


class DerivativeCapitalPayload(BaseModel):
    initial_capital: float = Field(..., gt=0, examples=[100000000])


class StrategyBacktestStatsPayload(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20, examples=["VPB"])
    strategy: str = Field(..., min_length=1, max_length=120, examples=["STxanhdo"])
    metric_name: str = Field(
        default="Price Drawdown % From BUY",
        min_length=1,
        max_length=160,
    )
    closed_trades: int | None = Field(default=None, ge=0)
    negative_trades: int | None = Field(default=None, ge=0)
    max_loss_pct: float | None = None
    min_loss_pct: float | None = None
    avg_loss_pct: float | None = None
    max_gain_pct: float | None = None
    avg_gain_pct: float | None = None
    tp1_hits: int | None = Field(default=None, ge=0)
    tp1_total: int | None = Field(default=None, ge=0)
    tp2_hits: int | None = Field(default=None, ge=0)
    tp2_total: int | None = Field(default=None, ge=0)
    tp3_hits: int | None = Field(default=None, ge=0)
    tp3_total: int | None = Field(default=None, ge=0)
    avg_hold_bars: float | None = Field(default=None, ge=0)
    avg_hold_days: float | None = Field(default=None, ge=0)
    note: str | None = None


class KellyEntryPayload(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20, examples=["VPB"])
    strategy: str = Field(default="", max_length=120, examples=["STxanhdo"])
    winRate: float | None = Field(default=None, ge=0, le=100)
    winningTrades: float | None = Field(default=None, ge=0)
    totalTrades: float | None = Field(default=None, ge=0)
    profitFactor: float | None = Field(default=None, ge=0)
    maxDrawdown: float | None = Field(default=None, ge=0)
    targetDrawdown: float | None = Field(default=None, ge=0)
    fraction: float | None = Field(default=None, ge=0, le=100)
    maxAllocation: float | None = Field(default=None, ge=0, le=100)


class DcaPlanPayload(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20, examples=["VPB"])
    strategy: str = Field(default="", max_length=120, examples=["STxanhdo"])
    initialCapital: float | None = Field(default=None, ge=0)
    allocationPct: float | None = Field(default=None, ge=0, le=100)
    entryPrice: float | None = Field(default=None, ge=0)
    distanceMode: str = Field(default="percent", max_length=20)
    maxLossPct: float | None = Field(default=None, ge=0)
    lotSize: float | None = Field(default=None, ge=1)
    levels: list[dict[str, Any]] = Field(default_factory=list)
    result: dict[str, Any] = Field(default_factory=dict)


class DcaSettingsPayload(BaseModel):
    initialCapital: float | None = Field(default=None, ge=0)


class PortfolioBacktestImportPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str = Field(..., min_length=1, max_length=100)
    report_date: str = Field(..., min_length=1, max_length=40)
    title: str = Field(..., min_length=1, max_length=160)
    research_status: str = Field(default="research-release-candidate", max_length=80)
    generated_at: str | None = Field(default=None, max_length=64)
    summary: dict[str, Any] = Field(default_factory=dict)


class LoginPayload(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    password: str = Field(..., min_length=1, max_length=256)


class UserCreatePayload(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=8, max_length=256)
    role: str = "user"
    features: list[str] = Field(default_factory=list)
    strategies: list[str] = Field(default_factory=list)


class UserUpdatePayload(BaseModel):
    role: str | None = None
    features: list[str] | None = None
    strategies: list[str] | None = None
    active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=256)


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(
        PROJECT_ROOT / "app" / "static" / "index.html",
        headers={"Cache-Control": "no-cache"},
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginPayload, request: Request) -> Response:
    user = store.get_user_credentials(payload.username)
    if (
        user is None
        or not user.get("active")
        or not verify_password(payload.password, user["password_hash"])
    ):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token, token_hash, expires_at = new_session(settings.session_days)
    store.create_session(token_hash=token_hash, user_id=user["id"], expires_at=expires_at)
    response = JSONResponse({"user": public_user(user)})
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.session_days * 24 * 60 * 60,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
    )
    return response


@app.post("/api/auth/logout")
def logout(request: Request) -> Response:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        store.delete_session(hash_session_token(token))
    response = JSONResponse({"status": "logged_out"})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response


@app.get("/api/auth/me")
def auth_me(request: Request) -> dict[str, Any]:
    token = request.cookies.get(SESSION_COOKIE)
    user = store.get_session_user(hash_session_token(token)) if token else None
    return {
        "user": public_user(user) if user else None,
        "available_features": ALL_FEATURES,
        "available_strategies": available_signal_strategies(),
    }


@app.get("/api/admin/users")
def admin_users() -> dict[str, Any]:
    return {
        "users": [public_user(user) for user in store.list_users()],
        "available_features": ALL_FEATURES,
        "available_strategies": available_signal_strategies(),
    }


@app.post("/api/admin/users")
def create_dashboard_user(payload: UserCreatePayload) -> dict[str, Any]:
    role = validate_role(payload.role)
    features = validate_features(payload.features)
    strategies = validate_strategies(payload.strategies)
    username = payload.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=422, detail="Username must have at least 3 characters")
    try:
        user = store.create_user(
            username=username,
            password_hash=hash_password(payload.password),
            role=role,
            features=features,
            strategies=strategies,
        )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Username already exists") from exc
    return {"user": public_user(user)}


@app.patch("/api/admin/users/{user_id}")
def update_dashboard_user(
    user_id: int, payload: UserUpdatePayload, request: Request
) -> dict[str, Any]:
    if user_id == request.state.user["id"] and payload.active is False:
        raise HTTPException(status_code=422, detail="Cannot disable your own account")
    role = validate_role(payload.role) if payload.role is not None else None
    if user_id == request.state.user["id"] and role == "user":
        raise HTTPException(status_code=422, detail="Cannot remove your own admin role")
    features = validate_features(payload.features) if payload.features is not None else None
    strategies = validate_strategies(payload.strategies) if payload.strategies is not None else None
    try:
        user = store.update_user(
            user_id,
            role=role,
            features=features,
            strategies=strategies,
            active=payload.active,
            password_hash=hash_password(payload.password) if payload.password else None,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="User not found") from exc
    return {"user": public_user(user)}


@app.delete("/api/admin/users/{user_id}")
def delete_dashboard_user(user_id: int, request: Request) -> dict[str, Any]:
    if user_id == request.state.user["id"]:
        raise HTTPException(status_code=422, detail="Cannot delete your own account")
    if not store.delete_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted", "user_id": user_id}


def validate_role(role: str) -> str:
    normalized = role.strip().lower()
    if normalized not in {"admin", "user"}:
        raise HTTPException(status_code=422, detail="Role must be admin or user")
    return normalized


def validate_features(features: list[str]) -> list[str]:
    invalid = set(features) - set(ALL_FEATURES)
    if invalid:
        raise HTTPException(status_code=422, detail=f"Invalid features: {sorted(invalid)}")
    return [feature for feature in ALL_FEATURES if feature in set(features)]


def validate_strategies(strategies: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for strategy in strategies:
        value = str(strategy or "").strip()
        key = value.lower()
        if not value or key in seen:
            continue
        seen.add(key)
        normalized.append(value)
    return normalized


def available_signal_strategies() -> list[str]:
    strategies = {
        (signal.get("strategy") or DEFAULT_STRATEGY).strip()
        for signal in store.list_all_signals()
    }
    for stat in store.list_strategy_backtest_stats():
        strategies.add((stat.get("strategy") or "").strip())
    for entry in store.list_kelly_entries():
        strategies.add((entry.get("strategy") or "").strip())
    return sorted((strategy for strategy in strategies if strategy), key=str.lower)


@app.get("/api/settings")
def dashboard_settings() -> dict[str, Any]:
    return {
        "default_signal_weight_pct": settings.default_signal_weight_pct,
        "market_data_provider": (
            "fireant+dnse"
            if fireant_enricher is not None and dnse_enricher is not None
            else "fireant"
            if fireant_enricher is not None
            else "dnse"
            if dnse_enricher is not None
            else "vnstock"
        ),
    }


@app.patch("/api/settings/derivative-capital")
def update_derivative_capital(payload: DerivativeCapitalPayload) -> dict[str, float]:
    store.set_app_setting("derivative_initial_capital", str(payload.initial_capital))
    return {"derivative_initial_capital": payload.initial_capital}


@app.post("/webhook")
async def receive_webhook(
    request: Request,
    secret: str | None = Query(default=None),
) -> dict[str, Any]:
    payload = await parse_webhook_payload(request)
    if settings.webhook_secret and settings.webhook_secret not in {secret, payload.secret}:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    if is_derivative_payload(payload):
        raise HTTPException(
            status_code=422,
            detail="This Railway portfolio-gate edition accepts RF/EMA stock signals only",
        )

    try:
        ticker, exchange = normalize_ticker(payload.ticker)
        action = normalize_action(payload.action)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    is_confirmation = is_confirmation_signal(payload, action)
    payload_data = payload.model_dump()
    required_open_strategy = required_open_strategy_for_signal(payload, action)
    if is_confirmation and not required_open_strategy:
        raise HTTPException(
            status_code=422,
            detail="Confirmation signals require base_strategy or confirm_for",
        )
    duplicate = store.find_duplicate_signal(
        ticker=ticker,
        action=action,
        timeframe=payload.timeframe,
        strategy=payload.strategy,
        source_time=payload.time,
        window_minutes=settings.duplicate_window_minutes,
    )
    if duplicate:
        store.record_invalid_signal(
            ticker=ticker,
            action=action,
            timeframe=payload.timeframe,
            strategy=payload.strategy,
            reason="duplicate_webhook",
            source_time=payload.time,
            payload=payload_data,
        )
        return {"status": "duplicate", "signal": duplicate}

    gate = evaluate_portfolio_signal(
        payload=payload_data,
        ticker=ticker,
        exchange=exchange,
        action=action,
        signals=store.list_all_signals(),
        backtest=store.latest_portfolio_backtest(),
        default_allocation_pct=settings.default_signal_weight_pct,
        base_strategy=required_open_strategy,
        sector_map=store.sector_map(),
    )
    if not gate["allowed"]:
        invalid_signal = store.record_invalid_signal(
            ticker=ticker,
            action=action,
            timeframe=payload.timeframe,
            strategy=payload.strategy,
            reason=gate["reason"],
            source_time=payload.time,
            payload=payload_data,
        )
        return {
            "status": "rejected",
            "reason": gate["reason"],
            "guardrails": gate["guardrails"],
            "invalid_signal": invalid_signal,
        }
    payload_data["portfolio_gate"] = gate["classification"]

    ticker_was_open = action == "sell" and ticker in open_position_tickers()
    signal = store.insert_signal(
        ticker=ticker,
        exchange=exchange,
        action=action,
        price=normalize_stock_price(payload.price, ticker=ticker, exchange=exchange),
        timeframe=payload.timeframe,
        strategy=payload.strategy,
        note=payload.note,
        source_time=payload.time,
        payload=payload_data,
        enrichment={"status": "pending", "ticker": ticker, "history": [], "metrics": {}},
    )
    removed_dividend_events = cleanup_dividend_events_after_close(
        ticker,
        position_was_open=ticker_was_open,
    )
    enqueue_signal_enrichment(signal["id"], ticker)
    return {
        "status": "accepted",
        "signal": signal,
        "classification": gate["classification"],
        "removed_dividend_events": removed_dividend_events,
    }


def is_derivative_payload(payload: WebhookPayload) -> bool:
    asset_type = (payload.asset_type or payload.market or "").strip().lower()
    return asset_type in {"derivative", "derivatives", "future", "futures", "vn30f"}


def receive_derivative_webhook(payload: WebhookPayload) -> dict[str, Any]:
    try:
        symbol, exchange = normalize_ticker(payload.ticker)
        action = normalize_derivative_action(payload.action)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    price = coerce_float(payload.price)
    quantity = coerce_float(payload.quantity) or 1
    contract_multiplier = (
        coerce_float(payload.contract_multiplier)
        or settings.derivative_contract_multiplier
    )
    if price is None or price <= 0:
        raise HTTPException(status_code=422, detail="Derivative price must be greater than 0")
    if quantity <= 0:
        raise HTTPException(status_code=422, detail="Derivative quantity must be greater than 0")

    duplicate = store.find_duplicate_derivative_signal(
        symbol=symbol,
        action=action,
        timeframe=payload.timeframe,
        strategy=payload.strategy,
        source_time=payload.time,
        window_minutes=settings.duplicate_window_minutes,
    )
    if duplicate:
        return {"status": "duplicate", "derivative_signal": duplicate}

    signal = store.insert_derivative_signal(
        symbol=symbol,
        exchange=exchange,
        action=action,
        price=price,
        quantity=quantity,
        contract_multiplier=contract_multiplier,
        timeframe=payload.timeframe,
        strategy=payload.strategy,
        reason=payload.reason or payload.note,
        source_time=payload.time,
        payload=payload.model_dump(),
    )
    return {"status": "accepted", "derivative_signal": signal}


async def parse_webhook_payload(request: Request) -> WebhookPayload:
    body = await request.body()
    if not body:
        raise HTTPException(status_code=422, detail="Webhook body is required")
    text = body.decode("utf-8", errors="replace").strip()
    try:
        data = parse_forgiving_json(text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    try:
        return WebhookPayload.model_validate(data)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc


def confirmation_base_strategy(payload: WebhookPayload) -> str | None:
    explicit_strategy = (
        payload.requires_open_strategy or payload.base_strategy or payload.confirm_for
    )
    return explicit_strategy.strip() if explicit_strategy and explicit_strategy.strip() else None


def required_open_strategy_for_signal(payload: WebhookPayload, action: str) -> str | None:
    if not is_confirmation_signal(payload, action):
        return None
    return confirmation_base_strategy(payload)


def is_confirmation_signal(payload: WebhookPayload, action: str) -> bool:
    signal_type = (payload.signal_type or "").strip().lower()
    return signal_type in {"confirm", "confirmation"} or action.startswith("confirm")


@app.get("/api/signals")
def list_signals(request: Request, ticker: str | None = None, limit: int = 100) -> dict[str, Any]:
    normalized_ticker = normalize_ticker(ticker)[0] if ticker else None
    if strategy_restricted(request.state.user):
        signals = visible_signals_for_user(
            store.list_all_signals(ticker=normalized_ticker),
            request.state.user,
        )
        signals = sorted(signals, key=lambda row: str(row.get("received_at") or ""), reverse=True)
        return {"signals": signals[: max(1, min(limit, 500))]}
    return {"signals": store.list_signals(ticker=normalized_ticker, limit=limit)}


@app.delete("/api/signals/{signal_id}")
def delete_signal(signal_id: int) -> dict[str, Any]:
    if not store.delete_signal(signal_id):
        raise HTTPException(status_code=404, detail="Signal not found")
    return {"status": "deleted", "signal_id": signal_id}


@app.get("/api/summary")
def summary(request: Request) -> dict[str, Any]:
    if strategy_restricted(request.state.user):
        return summarize_signal_rows(visible_signals_for_user(store.list_all_signals(), request.state.user))
    return store.summary()


@app.get("/api/export/signals.csv")
def export_signals_csv(request: Request) -> Response:
    signals = visible_signals_for_user(store.list_all_signals(), request.state.user)
    return csv_response(
        "signals.csv",
        [
            "id",
            "ticker",
            "exchange",
            "action",
            "price",
            "timeframe",
            "strategy",
            "note",
            "source_time",
            "received_at",
        ],
        signals,
    )


@app.get("/api/export/manual-portfolio.csv")
def export_manual_portfolio_csv() -> Response:
    positions = store.list_manual_positions()
    return csv_response(
        "manual-portfolio.csv",
        [
            "id",
            "ticker",
            "weight_pct",
            "entry_price",
            "current_price",
            "quantity",
            "entry_date",
            "status",
            "exit_price",
            "closed_at",
            "note",
            "created_at",
            "updated_at",
        ],
        positions,
    )


@app.get("/api/export/manual-daily-performance.csv")
def export_manual_daily_performance_csv() -> Response:
    rows = store.list_manual_daily_performance()
    return csv_response(
        "manual-daily-performance.csv",
        [
            "trade_date",
            "portfolio_return_pct",
            "equity_value",
            "total_weight_pct",
            "open_count",
            "closed_count",
            "cost_value",
            "market_value",
            "pnl_value",
            "recorded_at",
        ],
        rows,
    )


@app.get("/api/export/dividend-events.csv")
def export_dividend_events_csv() -> Response:
    rows = store.list_dividend_events()
    return csv_response(
        "dividend-events.csv",
        [
            "id",
            "ticker",
            "ex_date",
            "cash_amount",
            "stock_ratio_pct",
            "issue_ratio_pct",
            "issue_price",
            "note",
            "created_at",
            "updated_at",
        ],
        rows,
    )


@app.get("/api/export/derivative-signals.csv")
def export_derivative_signals_csv() -> Response:
    rows = store.list_all_derivative_signals()
    return csv_response(
        "derivative-signals.csv",
        [
            "id",
            "symbol",
            "exchange",
            "action",
            "price",
            "quantity",
            "contract_multiplier",
            "timeframe",
            "strategy",
            "reason",
            "source_time",
            "received_at",
        ],
        rows,
    )


@app.get("/api/export/database")
def export_database() -> FileResponse:
    if not settings.database_path.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(settings.database_path, filename="signals.db")


@app.get("/api/performance")
def performance(request: Request, ticker: str | None = None, strategy: str | None = None) -> dict[str, Any]:
    signals = filtered_performance_signals(
        ticker=ticker,
        strategy=strategy,
        user=request.state.user,
    )
    return build_performance(signals, store.list_dividend_events())


@app.get("/api/backtest-stats")
def backtest_stats(
    request: Request,
    ticker: str | None = None,
    strategy: str | None = None,
) -> dict[str, Any]:
    normalized_ticker = normalize_ticker(ticker)[0] if ticker else None
    rows = store.list_strategy_backtest_stats(
        ticker=normalized_ticker,
        strategy=strategy,
    )
    if strategy_restricted(request.state.user):
        allowed = {
            str(item or "").strip().lower()
            for item in request.state.user.get("strategies", [])
            if str(item or "").strip()
        }
        rows = [
            row
            for row in rows
            if (row.get("strategy") or "").strip().lower() in allowed
        ]
    return {"backtest_stats": rows}


@app.post("/api/backtest-stats")
def upsert_backtest_stat(payload: StrategyBacktestStatsPayload) -> dict[str, Any]:
    ticker = normalize_ticker(payload.ticker)[0]
    tp_total = payload.closed_trades
    stat = store.upsert_strategy_backtest_stat(
        ticker=ticker,
        strategy=payload.strategy,
        metric_name=payload.metric_name,
        closed_trades=payload.closed_trades,
        negative_trades=payload.negative_trades,
        max_loss_pct=payload.max_loss_pct,
        min_loss_pct=payload.min_loss_pct,
        avg_loss_pct=payload.avg_loss_pct,
        max_gain_pct=payload.max_gain_pct,
        avg_gain_pct=payload.avg_gain_pct,
        tp1_hits=payload.tp1_hits,
        tp1_total=payload.tp1_total if payload.tp1_total is not None else tp_total,
        tp2_hits=payload.tp2_hits,
        tp2_total=payload.tp2_total if payload.tp2_total is not None else tp_total,
        tp3_hits=payload.tp3_hits,
        tp3_total=payload.tp3_total if payload.tp3_total is not None else tp_total,
        avg_hold_bars=payload.avg_hold_bars,
        avg_hold_days=payload.avg_hold_days,
        note=payload.note,
    )
    return {"status": "saved", "backtest_stat": stat}


@app.delete("/api/backtest-stats/{stat_id}")
def delete_backtest_stat(stat_id: int) -> dict[str, Any]:
    if not store.delete_strategy_backtest_stat(stat_id):
        raise HTTPException(status_code=404, detail="Backtest stats not found")
    return {"status": "deleted", "stat_id": stat_id}


@app.get("/api/kelly-entries")
def kelly_entries(
    request: Request,
    ticker: str | None = None,
    strategy: str | None = None,
) -> dict[str, Any]:
    normalized_ticker = normalize_ticker(ticker)[0] if ticker else None
    rows = store.list_kelly_entries(ticker=normalized_ticker, strategy=strategy)
    if strategy_restricted(request.state.user):
        allowed = {
            str(item or "").strip().lower()
            for item in request.state.user.get("strategies", [])
            if str(item or "").strip()
        }
        rows = [
            row
            for row in rows
            if not (row.get("strategy") or "").strip()
            or (row.get("strategy") or "").strip().lower() in allowed
        ]
    return {"kelly_entries": rows}


@app.post("/api/kelly-entries")
def upsert_kelly_entry(payload: KellyEntryPayload) -> dict[str, Any]:
    ticker = normalize_ticker(payload.ticker)[0]
    entry = store.upsert_kelly_entry(
        ticker=ticker,
        strategy=payload.strategy or "",
        win_rate=payload.winRate,
        winning_trades=payload.winningTrades,
        total_trades=payload.totalTrades,
        profit_factor=payload.profitFactor,
        max_drawdown=payload.maxDrawdown,
        target_drawdown=payload.targetDrawdown,
        fraction=payload.fraction,
        max_allocation=payload.maxAllocation,
    )
    return {"status": "saved", "kelly_entry": entry}


@app.delete("/api/kelly-entries/{entry_id}")
def delete_kelly_entry(entry_id: int) -> dict[str, Any]:
    if not store.delete_kelly_entry(entry_id):
        raise HTTPException(status_code=404, detail="Kelly entry not found")
    return {"status": "deleted", "entry_id": entry_id}


@app.get("/api/dca-settings")
def dca_settings(request: Request) -> dict[str, Any]:
    return {
        "dca_settings": store.get_dca_user_settings(
            user_id=request.state.user["id"],
        )
    }


@app.patch("/api/dca-settings")
def update_dca_settings(payload: DcaSettingsPayload, request: Request) -> dict[str, Any]:
    settings_payload = store.upsert_dca_user_settings(
        user_id=request.state.user["id"],
        initial_capital=payload.initialCapital,
    )
    return {"status": "saved", "dca_settings": settings_payload}


@app.get("/api/dca-plans")
def dca_plans(request: Request) -> dict[str, Any]:
    return {"dca_plans": store.list_dca_plans(user_id=request.state.user["id"])}


@app.post("/api/dca-plans")
def create_dca_plan(payload: DcaPlanPayload, request: Request) -> dict[str, Any]:
    values = dca_plan_values(payload, request)
    plan = store.insert_dca_plan(
        user_id=request.state.user["id"],
        **values,
    )
    return {"status": "saved", "dca_plan": plan}


@app.patch("/api/dca-plans/{plan_id}")
def update_dca_plan(
    plan_id: int, payload: DcaPlanPayload, request: Request
) -> dict[str, Any]:
    values = dca_plan_values(payload, request)
    try:
        plan = store.update_dca_plan(
            plan_id=plan_id,
            user_id=request.state.user["id"],
            **values,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="DCA plan not found") from exc
    return {"status": "saved", "dca_plan": plan}


def dca_plan_values(payload: DcaPlanPayload, request: Request) -> dict[str, Any]:
    ticker = normalize_ticker(payload.ticker)[0]
    strategy = payload.strategy.strip()
    if strategy_restricted(request.state.user):
        allowed = {
            str(item or "").strip().lower()
            for item in request.state.user.get("strategies", [])
            if str(item or "").strip()
        }
        if strategy.strip().lower() not in allowed:
            raise HTTPException(status_code=403, detail="Strategy is not enabled")
    distance_mode = payload.distanceMode if payload.distanceMode in {"percent", "priceStep"} else "percent"
    return {
        "ticker": ticker,
        "strategy": strategy,
        "initial_capital": payload.initialCapital,
        "allocation_pct": payload.allocationPct,
        "entry_price": payload.entryPrice,
        "distance_mode": distance_mode,
        "max_loss_pct": payload.maxLossPct,
        "lot_size": payload.lotSize,
        "levels": payload.levels,
        "result": payload.result,
    }


@app.get("/api/portfolio-gate")
def portfolio_gate() -> dict[str, Any]:
    backtest = store.latest_portfolio_backtest()
    return {
        "guardrails": guardrails_from_backtest(backtest),
        "state": portfolio_gate_state(store.list_all_signals()),
        "source_report_date": backtest.get("report_date") if backtest else None,
        "source_title": backtest.get("title") if backtest else None,
    }


@app.get("/api/portfolio-backtests/latest")
def latest_portfolio_backtest() -> dict[str, Any]:
    return {"backtest": store.latest_portfolio_backtest()}


@app.get("/api/portfolio-backtests")
def list_portfolio_backtests(limit: int = 12) -> dict[str, Any]:
    return {"backtests": store.list_portfolio_backtests(limit=limit)}


@app.post("/api/portfolio-backtests/import")
def import_portfolio_backtest(
    payload: PortfolioBacktestImportPayload, request: Request
) -> dict[str, Any]:
    expected_token = settings.backtest_ingest_token
    provided_token = request.headers.get("x-backtest-ingest-token")
    if not expected_token:
        raise HTTPException(status_code=503, detail="Backtest import is not configured")
    if not provided_token or not hmac.compare_digest(expected_token, provided_token):
        raise HTTPException(status_code=401, detail="Invalid backtest ingest token")
    backtest = store.upsert_portfolio_backtest(
        source=payload.source,
        report_date=payload.report_date,
        title=payload.title,
        research_status=payload.research_status,
        generated_at=payload.generated_at,
        summary=payload.summary,
    )
    return {"status": "saved", "backtest": backtest}


@app.delete("/api/dca-plans/{plan_id}")
def delete_dca_plan(plan_id: int, request: Request) -> dict[str, Any]:
    if not store.delete_dca_plan(plan_id=plan_id, user_id=request.state.user["id"]):
        raise HTTPException(status_code=404, detail="DCA plan not found")
    return {"status": "deleted", "plan_id": plan_id}


@app.get("/api/derivatives")
def derivatives() -> dict[str, Any]:
    return build_derivative_performance(
        store.list_all_derivative_signals(),
        initial_capital=derivative_initial_capital(),
    )


def derivative_initial_capital() -> float:
    stored = store.get_app_setting(
        "derivative_initial_capital",
        str(settings.derivative_initial_capital),
    )
    try:
        capital = float(stored or settings.derivative_initial_capital)
    except (TypeError, ValueError):
        capital = settings.derivative_initial_capital
    return max(0.01, capital)


@app.delete("/api/derivatives/signals/{signal_id}")
def delete_derivative_signal(signal_id: int) -> dict[str, Any]:
    if not store.delete_derivative_signal(signal_id):
        raise HTTPException(status_code=404, detail="Derivative signal not found")
    return {"status": "deleted", "signal_id": signal_id}


def confirmation_payload_strategy(signal: dict[str, Any]) -> str:
    payload = signal.get("payload") or {}
    values = [
        payload.get("base_strategy"),
        payload.get("confirm_for"),
        payload.get("requires_open_strategy"),
    ]
    return " ".join(str(value).strip().lower() for value in values if value)


def filtered_performance_signals(
    *, ticker: str | None = None, strategy: str | None = None, user: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    normalized_ticker = normalize_ticker(ticker)[0] if ticker else None
    signals = store.list_all_signals(ticker=normalized_ticker)
    signals = [
        signal
        for signal in visible_signals_for_user(signals, user)
        if is_portfolio_gate_signal(signal)
    ]
    if not strategy:
        return signals
    strategy_filter = strategy.strip().lower()
    return [
        signal
        for signal in signals
        if signal_matches_strategy_filter(signal, strategy_filter)
    ]


def is_portfolio_gate_signal(signal: dict[str, Any]) -> bool:
    payload = signal.get("payload") or {}
    gate = payload.get("portfolio_gate") if isinstance(payload, dict) else None
    return isinstance(gate, dict) and gate.get("version") == 1


def signal_matches_strategy_filter(signal: dict[str, Any], strategy_filter: str) -> bool:
    normalized_filter = strategy_filter.strip().lower()
    if not normalized_filter:
        return True
    signal_strategy = (signal.get("strategy") or DEFAULT_STRATEGY).strip().lower()
    if signal_strategy == normalized_filter:
        return True
    payload = signal.get("payload") or {}
    return any(
        str(payload.get(key) or "").strip().lower() == normalized_filter
        for key in ("base_strategy", "confirm_for", "requires_open_strategy")
    )


def strategy_restricted(user: dict[str, Any] | None) -> bool:
    if not user or user.get("role") == "admin":
        return False
    return bool(user.get("strategies"))


def visible_signals_for_user(
    signals: list[dict[str, Any]],
    user: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    if not strategy_restricted(user):
        return signals
    allowed = [
        str(strategy or "").strip().lower()
        for strategy in user.get("strategies", [])
        if str(strategy or "").strip()
    ]
    if not allowed:
        return signals
    return [
        signal
        for signal in signals
        if any(signal_matches_strategy_filter(signal, strategy) for strategy in allowed)
    ]


def summarize_signal_rows(signals: list[dict[str, Any]]) -> dict[str, Any]:
    latest = max((str(signal.get("received_at") or "") for signal in signals), default=None)
    return {
        "total": len(signals),
        "buy_count": sum(1 for signal in signals if str(signal.get("action") or "").lower() == "buy"),
        "sell_count": sum(1 for signal in signals if str(signal.get("action") or "").lower() == "sell"),
        "tickers": len({signal.get("ticker") for signal in signals if signal.get("ticker")}),
        "latest_received_at": latest,
    }


@app.get("/api/invalid-signals")
def invalid_signals(request: Request, limit: int = 100) -> dict[str, Any]:
    signals = store.list_invalid_signals(limit=limit)
    if strategy_restricted(request.state.user):
        signals = visible_signals_for_user(signals, request.state.user)
    return {"invalid_signals": signals}


@app.get("/api/manual-portfolio")
def manual_portfolio() -> dict[str, Any]:
    return build_manual_portfolio(
        store.list_manual_positions(),
        store.list_manual_daily_performance(),
        store.list_dividend_events(),
    )


@app.get("/api/dividend-events")
def dividend_events(ticker: str | None = None) -> dict[str, Any]:
    normalized_ticker = normalize_ticker(ticker)[0] if ticker else None
    all_events = store.list_dividend_events(normalized_ticker)
    positions = open_stock_positions_for_dividends()
    if normalized_ticker:
        positions = [
            position
            for position in positions
            if str(position.get("ticker") or "").upper() == normalized_ticker
        ]
    events = relevant_dividend_events_for_positions(all_events, positions)
    open_tickers = {str(event.get("ticker") or "").upper() for event in events}
    alerts = upcoming_dividend_events_for_positions(events, open_tickers)
    alerts_by_id = {
        alert["id"]: alert
        for alert in alerts
        if alert.get("id") is not None
    }
    return {
        "dividend_events": [
            {**event, **alerts_by_id.get(event.get("id"), {})}
            for event in events
        ],
        "dividend_alerts": alerts,
    }


@app.post("/api/dividend-events/prune")
def prune_dividend_events() -> dict[str, Any]:
    relevant_events = relevant_dividend_events_for_positions(
        store.list_dividend_events(), open_stock_positions_for_dividends()
    )
    keep_ids = {int(event["id"]) for event in relevant_events if event.get("id") is not None}
    removed = store.delete_dividend_events_except_ids(keep_ids)
    return {"status": "pruned", "removed": removed, "kept": len(keep_ids)}


@app.post("/api/dividend-events/refresh")
async def refresh_dividend_events() -> dict[str, Any]:
    return {"status": "ok", **(await refresh_dividend_events_for_open_positions())}


@app.post("/api/dividend-events")
def create_dividend_event(payload: DividendEventPayload) -> dict[str, Any]:
    ticker, _ = normalize_ticker(payload.ticker)
    try:
        ex_date = date.fromisoformat(payload.ex_date).isoformat()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid ex_date") from exc
    cash_amount = normalize_money_unit(payload.cash_amount)
    stock_ratio_pct = (
        payload.stock_ratio_pct if payload.stock_ratio_pct is not None else None
    )
    issue_ratio_pct = (
        payload.issue_ratio_pct if payload.issue_ratio_pct is not None else None
    )
    issue_price = normalize_money_unit(payload.issue_price)
    if issue_ratio_pct and issue_ratio_pct > 0 and (issue_price or 0) <= 0:
        raise HTTPException(
            status_code=422,
            detail="Additional issuance requires issue_price",
        )
    if (
        (cash_amount or 0) <= 0
        and (stock_ratio_pct or 0) <= 0
        and (issue_ratio_pct or 0) <= 0
    ):
        raise HTTPException(
            status_code=422,
            detail="Event requires cash_amount, stock_ratio_pct or issue_ratio_pct",
        )
    try:
        event = store.insert_dividend_event(
            ticker=ticker,
            ex_date=ex_date,
            cash_amount=cash_amount,
            stock_ratio_pct=stock_ratio_pct,
            issue_ratio_pct=issue_ratio_pct,
            issue_price=issue_price,
            note=payload.note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"status": "created", "dividend_event": event}


@app.get("/api/sectors")
def sector_mappings() -> dict[str, Any]:
    mappings = store.list_sector_mappings()
    return {"sectors": mappings, "sector_names": sorted({row["sector"] for row in mappings})}


@app.post("/api/sectors")
def upsert_sector_mapping(payload: SectorMappingPayload) -> dict[str, Any]:
    ticker = normalize_ticker(payload.ticker)[0]
    try:
        mapping = store.upsert_sector_mapping(ticker=ticker, sector=payload.sector)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"status": "saved", "sector": mapping}


@app.post("/api/sectors/refresh")
async def refresh_sectors() -> dict[str, Any]:
    return {"status": "ok", **(await asyncio.to_thread(populate_sectors_from_listing))}


@app.delete("/api/sectors/{ticker}")
def delete_sector_mapping(ticker: str) -> dict[str, Any]:
    normalized = normalize_ticker(ticker)[0]
    if not store.delete_sector_mapping(normalized):
        raise HTTPException(status_code=404, detail="Sector mapping not found")
    return {"status": "deleted", "ticker": normalized}


@app.delete("/api/dividend-events/{event_id}")
def delete_dividend_event(event_id: int) -> dict[str, Any]:
    if not store.delete_dividend_event(event_id):
        raise HTTPException(status_code=404, detail="Dividend event not found")
    return {"status": "deleted", "event_id": event_id}


def normalize_money_unit(value: float | None) -> float | None:
    if value is None:
        return None
    return value / 1000


@app.post("/api/manual-portfolio")
def create_manual_position(
    payload: ManualPositionPayload, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    ticker, _ = normalize_ticker(payload.ticker)
    position = store.insert_manual_position(
        ticker=ticker,
        weight_pct=payload.weight_pct,
        entry_price=payload.entry_price,
        current_price=payload.current_price,
        quantity=payload.quantity,
        entry_date=payload.entry_date,
        note=payload.note,
    )
    background_tasks.add_task(refresh_manual_ticker_price, ticker)
    return {"status": "created", "position": position}


@app.patch("/api/manual-portfolio/{position_id}")
def update_manual_position(
    position_id: int, payload: ManualPositionUpdatePayload
) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if "ticker" in updates and updates["ticker"]:
        updates["ticker"] = normalize_ticker(updates["ticker"])[0]
    try:
        position = store.update_manual_position(position_id, updates)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Manual position not found") from exc
    return {"status": "updated", "position": position}


@app.post("/api/manual-portfolio/refresh-prices")
async def refresh_manual_portfolio_prices_endpoint() -> dict[str, Any]:
    updated = await refresh_manual_portfolio_prices()
    daily_performance = record_manual_daily_performance_if_due()
    return {
        "status": "refreshed",
        "updated_positions": updated,
        "daily_performance": daily_performance,
    }


@app.post("/api/manual-portfolio/record-daily-performance")
def record_manual_daily_performance_endpoint() -> dict[str, Any]:
    daily_performance = record_manual_daily_performance()
    return {"status": "recorded", "daily_performance": daily_performance}


@app.delete("/api/manual-portfolio/daily-performance/{trade_date}")
def delete_manual_daily_performance(trade_date: str) -> dict[str, Any]:
    if not store.delete_manual_daily_performance(trade_date):
        raise HTTPException(status_code=404, detail="Manual daily performance not found")
    return {"status": "deleted", "trade_date": trade_date}


@app.post("/api/open-positions/refresh-prices")
async def refresh_open_position_prices_endpoint() -> dict[str, Any]:
    updated = await refresh_open_position_prices(include_manual=False)
    return {"status": "refreshed", "updated_positions": updated}


@app.post("/api/manual-portfolio/{position_id}/close")
def close_manual_position(position_id: int, payload: ManualClosePayload) -> dict[str, Any]:
    try:
        existing_position = store.get_manual_position(position_id)
        position = store.close_manual_position(
            position_id, exit_price=payload.exit_price, closed_at=payload.closed_at
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Manual position not found") from exc
    removed_dividend_events = cleanup_dividend_events_after_close(
        position["ticker"],
        position_was_open=existing_position["status"] == "open",
    )
    return {
        "status": "closed",
        "position": position,
        "removed_dividend_events": removed_dividend_events,
    }


@app.delete("/api/manual-portfolio/{position_id}")
def delete_manual_position(position_id: int) -> dict[str, Any]:
    if not store.delete_manual_position(position_id):
        raise HTTPException(status_code=404, detail="Manual position not found")
    return {"status": "deleted", "position_id": position_id}


@app.get("/api/chart/{ticker}")
def chart(ticker: str) -> dict[str, Any]:
    normalized_ticker, _ = normalize_ticker(ticker)
    ticker_signals = store.list_all_signals(ticker=normalized_ticker)
    history = []
    for signal in reversed(ticker_signals):
        if signal["enrichment"].get("history"):
            history = signal["enrichment"]["history"]
            break
    markers = [
        {
            "id": signal["id"],
            "action": signal["action"],
            "price": signal["price"],
            "strategy": signal["strategy"],
            "source_time": signal["source_time"],
            "received_at": signal["received_at"],
        }
        for signal in ticker_signals
        if (signal["action"] or "").lower() in {"buy", "sell"}
    ]
    return {"ticker": normalized_ticker, "history": history, "markers": markers}


def enrich_signal(signal_id: int, ticker: str) -> None:
    enrichment = enricher.enrich(ticker)
    sync_enrichment_dividends(enrichment)
    enrichment["refreshed_at"] = utc_now_iso()
    store.update_signal_enrichment(signal_id, enrichment)


def enqueue_signal_enrichment(signal_id: int, ticker: str) -> None:
    if enrichment_queue is None:
        asyncio.create_task(enrich_signal_async(signal_id, ticker))
        return
    try:
        enrichment_queue.put_nowait((signal_id, ticker))
    except asyncio.QueueFull:
        logger.warning("Skipping signal enrichment because queue is full: %s", ticker)


async def enrich_signal_async(signal_id: int, ticker: str) -> None:
    try:
        await asyncio.to_thread(enrich_signal, signal_id, ticker)
    except asyncio.CancelledError:
        raise
    except BaseException:
        logger.exception("Signal enrichment failed for %s", ticker)


async def signal_enrichment_worker() -> None:
    while True:
        if enrichment_queue is None:
            await asyncio.sleep(1)
            continue
        signal_id, ticker = await enrichment_queue.get()
        try:
            await enrich_signal_async(signal_id, ticker)
        finally:
            enrichment_queue.task_done()


async def price_refresh_loop() -> None:
    interval_seconds = settings.price_refresh_minutes * 60
    while True:
        try:
            if is_market_open(sessions=settings.market_sessions):
                await refresh_open_position_prices(include_manual=False)
        except asyncio.CancelledError:
            raise
        except BaseException:
            logger.exception("Scheduled price refresh failed")
        await asyncio.sleep(interval_seconds)


def populate_sectors_from_listing() -> dict[str, Any]:
    """Refresh provider classifications without overwriting administrator choices."""
    mapping = fetch_industry_map()
    result = store.apply_auto_sector_mappings(mapping) if mapping else {"added": 0, "updated": 0}
    store.set_app_setting("sectors_refreshed_at", utc_now_iso())
    store.set_app_setting("sectors_source_count", str(len(mapping)))
    logger.info("Sector refresh: %s source symbols, %s", len(mapping), result)
    return {"fetched": len(mapping), **result}


async def sector_autofill_loop() -> None:
    await asyncio.sleep(5)
    while True:
        try:
            await asyncio.to_thread(populate_sectors_from_listing)
        except asyncio.CancelledError:
            raise
        except BaseException:
            logger.exception("Scheduled sector auto-fill failed")
        await asyncio.sleep(24 * 3600)


async def refresh_dividend_events_for_open_positions() -> dict[str, Any]:
    positions = open_stock_positions_for_dividends()
    tickers = sorted({str(position.get("ticker") or "").upper() for position in positions if position.get("ticker")})
    collected: list[dict[str, Any]] = []
    for ticker in tickers:
        collected.extend(
            relevant_dividend_events_for_positions(
                await collect_dividend_events_for_ticker(ticker), positions
            )
        )
        await asyncio.sleep(1)
    upserted = store.upsert_external_dividend_events(collected) if collected else 0
    store.set_app_setting("dividends_refreshed_at", utc_now_iso())
    logger.info("Dividend refresh: %s tickers, %s events, %s upserted", len(tickers), len(collected), upserted)
    return {"tickers": len(tickers), "events": len(collected), "upserted": upserted}


async def collect_dividend_events_for_ticker(ticker: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    try:
        events.extend(await asyncio.to_thread(fetch_dividend_events, ticker))
    except asyncio.CancelledError:
        raise
    except BaseException:
        logger.exception("VNStock dividend fetch failed for %s", ticker)
    try:
        enrichment = await asyncio.to_thread(enricher.enrich, ticker)
    except asyncio.CancelledError:
        raise
    except BaseException:
        logger.exception("Market-data dividend fetch failed for %s", ticker)
    else:
        if isinstance(enrichment.get("dividend_events"), list):
            events.extend(enrichment["dividend_events"])
    return events


async def dividend_autofetch_loop() -> None:
    await asyncio.sleep(8)
    while True:
        try:
            await refresh_dividend_events_for_open_positions()
        except asyncio.CancelledError:
            raise
        except BaseException:
            logger.exception("Scheduled dividend update failed")
        await asyncio.sleep(12 * 3600)


async def manual_portfolio_automation_loop() -> None:
    while True:
        try:
            await refresh_manual_portfolio_prices_if_due(force=True)
            record_manual_daily_performance_if_due()
        except asyncio.CancelledError:
            raise
        except BaseException:
            logger.exception("Manual portfolio automation failed")
        await asyncio.sleep(60)


async def refresh_open_position_prices(*, include_manual: bool = True) -> int:
    performance_data = build_performance(
        filtered_performance_signals(),
        store.list_dividend_events(),
    )
    open_trades = performance_data["open_trades"]
    signal_ids_by_ticker: dict[str, list[int]] = {}
    for trade in open_trades:
        signal_ids_by_ticker.setdefault(trade["ticker"], []).append(trade["entry_signal_id"])

    manual_tickers = set(store.list_open_manual_tickers()) if include_manual else set()
    refresh_tickers = sorted(set(signal_ids_by_ticker) | manual_tickers)
    updated_signals = 0

    for ticker in refresh_tickers:
        try:
            enrichment = await asyncio.to_thread(enricher.enrich, ticker)
        except asyncio.CancelledError:
            raise
        except BaseException:
            logger.exception("Skipping scheduled price refresh for %s", ticker)
            continue
        enrichment["refreshed_by"] = "scheduled_price_refresh"
        enrichment["refreshed_at"] = utc_now_iso()
        sync_enrichment_dividends(enrichment)
        for signal_id in signal_ids_by_ticker.get(ticker, []):
            store.update_signal_enrichment(signal_id, enrichment)
            updated_signals += 1
        if ticker in manual_tickers:
            price = latest_history_close(enrichment)
            if price is not None and price > 0:
                store.update_manual_market_price(
                    ticker=ticker,
                    price=price,
                    recorded_at=enrichment["refreshed_at"],
                )
    if manual_tickers:
        record_manual_daily_performance_if_due()
    return updated_signals


async def refresh_manual_portfolio_prices(*, force: bool = True) -> int:
    updated = 0
    for ticker in store.list_open_manual_tickers():
        updated += await asyncio.to_thread(refresh_manual_ticker_price, ticker, force=force)
    record_manual_daily_performance_if_due()
    return updated


async def refresh_manual_portfolio_prices_if_due(
    recorded_at: str | None = None,
    *,
    force: bool = True,
) -> int | None:
    global last_auto_manual_price_refresh_date
    if not is_after_manual_price_refresh_time(recorded_at):
        return None
    trade_date = market_date_iso(recorded_at)
    if last_auto_manual_price_refresh_date == trade_date:
        return None
    if not store.list_open_manual_tickers():
        return None
    updated = await refresh_manual_portfolio_prices(force=force)
    if updated > 0:
        last_auto_manual_price_refresh_date = trade_date
    return updated


def refresh_manual_ticker_price(ticker: str, *, force: bool = True) -> int:
    enrichment = enricher.enrich(ticker, force=force)
    sync_enrichment_dividends(enrichment)
    price = latest_history_close(enrichment)
    if price is None or price <= 0:
        return 0
    return store.update_manual_market_price(
        ticker=ticker,
        price=price,
        recorded_at=utc_now_iso(),
    )


def sync_enrichment_dividends(enrichment: dict[str, Any]) -> int:
    events = enrichment.get("dividend_events") or []
    if not isinstance(events, list) or not events:
        return 0
    relevant_events = relevant_dividend_events_for_positions(
        events, open_stock_positions_for_dividends()
    )
    if not relevant_events:
        return 0
    return store.upsert_external_dividend_events(relevant_events)


def open_stock_positions_for_dividends() -> list[dict[str, Any]]:
    return [
        {
            "ticker": position.get("ticker"),
            "entry_time": position.get("entry_time"),
        }
        for position in portfolio_gate_state(store.list_all_signals())["positions"]
        if position.get("ticker") and position.get("entry_time")
    ]


def open_position_tickers() -> set[str]:
    return {
        str(position.get("ticker") or "").upper()
        for position in portfolio_gate_state(store.list_all_signals())["positions"]
        if position.get("ticker")
    }


def cleanup_dividend_events_after_close(
    ticker: str, *, position_was_open: bool
) -> int:
    return 0


def record_manual_daily_performance_if_due(recorded_at: str | None = None) -> dict[str, Any] | None:
    if not is_after_daily_cutoff(recorded_at):
        return None
    if not store.list_manual_positions():
        return None
    return record_manual_daily_performance(recorded_at=recorded_at)


def record_manual_daily_performance(recorded_at: str | None = None) -> dict[str, Any]:
    record = build_daily_performance_record(
        store.list_manual_positions(),
        recorded_at,
        store.list_dividend_events(),
    )
    return store.upsert_manual_daily_performance(**record)


def latest_history_close(enrichment: dict[str, Any]) -> float | None:
    history = enrichment.get("history") or []
    if not history:
        return None
    latest_row = history[-1]
    value = (
        latest_row.get("close")
        or latest_row.get("Close")
        or latest_row.get("closePrice")
        or latest_row.get("c")
    )
    return coerce_float(value)


def csv_response(filename: str, fields: list[str], rows: list[dict[str, Any]]) -> Response:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({field: row.get(field) for field in fields})
    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
