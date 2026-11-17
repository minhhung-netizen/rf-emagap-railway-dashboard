from __future__ import annotations

import json
import threading
import time
import unicodedata
import base64
import hashlib
import hmac
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
from typing import Any
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request
from uuid import uuid4


EXCHANGE_PREFIXES = {"HOSE", "HNX", "UPCOM", "VNINDEX", "INDEX"}
INDEX_TICKERS = {"VNINDEX"}


def normalize_ticker(raw_ticker: Any) -> tuple[str, str | None]:
    if not raw_ticker:
        raise ValueError("ticker is required")

    value = _ticker_value(raw_ticker).strip().upper()
    exchange: str | None = None

    if ":" in value:
        prefix, symbol = value.split(":", 1)
        if prefix in EXCHANGE_PREFIXES and symbol:
            exchange = prefix
            value = symbol

    value = value.replace(" ", "")
    if not value:
        raise ValueError("ticker is required")
    return value, exchange


def _ticker_value(raw_ticker: Any) -> str:
    if isinstance(raw_ticker, dict):
        for key in ("symbol", "ticker", "tickerid"):
            value = raw_ticker.get(key)
            if value:
                return str(value)
        raise ValueError("ticker is required")

    value = str(raw_ticker).strip()
    if value.startswith("="):
        value = value[1:].strip()
    if value.startswith("{"):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return value
        if isinstance(parsed, dict):
            return _ticker_value(parsed)
    return value


def coerce_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", ""))
    except ValueError:
        return None


def is_index_ticker(ticker: Any = None, exchange: str | None = None) -> bool:
    symbol = str(ticker or "").strip().upper()
    market = str(exchange or "").strip().upper()
    return symbol in INDEX_TICKERS or market in {"VNINDEX", "INDEX"}


def normalize_stock_price(
    value: Any,
    *,
    ticker: Any = None,
    exchange: str | None = None,
) -> float | None:
    price = coerce_float(value)
    if price is None:
        return None
    if is_index_ticker(ticker, exchange):
        return price
    return price / 1000 if abs(price) >= 1000 else price


def normalize_action(raw_action: str | None) -> str:
    if not raw_action:
        raise ValueError("action is required")
    action = raw_action.strip().lower()
    compact_action = "".join(ch for ch in action if ch.isalnum())
    aliases = {
        "long": "buy",
        "entry": "buy",
        "open": "buy",
        "short": "sell",
        "exit": "sell",
        "close": "sell",
        "confirmbuy": "confirm_buy",
        "confirm-buy": "confirm_buy",
        "confirmation_buy": "confirm_buy",
        "confirmationbuy": "confirm_buy",
        "confimbuy": "confirm_buy",
        "confibuy": "confirm_buy",
        "confirmsell": "confirm_sell",
        "confirm-sell": "confirm_sell",
        "confirmation_sell": "confirm_sell",
        "confirmationsell": "confirm_sell",
        "confimsell": "confirm_sell",
        "confisell": "confirm_sell",
    }
    return aliases.get(action, aliases.get(compact_action, action))


class FireAntEnricher:
    """FireAnt adapter for daily OHLCV history and dated dividend-event notes."""

    def __init__(
        self,
        *,
        access_token: str,
        base_url: str = "https://api.fireant.vn",
        lookback_days: int = 90,
        cache_ttl_seconds: int = 240 * 60,
        min_request_interval_seconds: float = 1.0,
        client: Any = None,
    ) -> None:
        self.lookback_days = lookback_days
        self.cache_ttl_seconds = cache_ttl_seconds
        self.min_request_interval_seconds = min_request_interval_seconds
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._lock = threading.Lock()
        self._last_request_at = 0.0
        self.client = client or FireAntRestClient(
            access_token=access_token,
            base_url=base_url,
        )

    def enrich(self, ticker: str, *, force: bool = False) -> dict[str, Any]:
        if not force:
            cached = self._get_cached(ticker)
            if cached is not None:
                return cached
        try:
            enrichment = self._enrich_with_fireant(ticker)
        except BaseException as exc:
            enrichment = {
                "status": "unavailable",
                "source": "fireant",
                "message": str(exc),
                "ticker": ticker,
                "history": [],
                "dividend_events": [],
                "dividend_summary": [],
                "metrics": {},
            }
        self._set_cached(ticker, enrichment)
        return deepcopy(enrichment)

    def _enrich_with_fireant(self, ticker: str) -> dict[str, Any]:
        today = date.today()
        start = today - timedelta(days=self.lookback_days)
        self._wait_for_rate_limit()
        history = _normalize_fireant_history(
            self.client.get_historical_quotes(
                symbol=ticker.upper(),
                start_date=start.isoformat(),
                end_date=today.isoformat(),
                limit=max(100, self.lookback_days * 2),
            )
        )
        if not history:
            raise RuntimeError("FireAnt returned no daily OHLCV history")

        marks: Any = []
        dividend_summary: Any = []
        dividend_message = None
        try:
            self._wait_for_rate_limit()
            marks = self.client.get_timescale_marks(
                symbol=ticker.upper(),
                start_date=(today - timedelta(days=30)).isoformat(),
                end_date=(today + timedelta(days=365)).isoformat(),
            )
            self._wait_for_rate_limit()
            dividend_summary = self.client.get_dividends(symbol=ticker.upper(), count=10)
        except BaseException as exc:
            dividend_message = str(exc)
        return {
            "status": "ok",
            "source": "fireant",
            "ticker": ticker,
            "history": history[-80:],
            "dividend_events": _fireant_dividend_events(ticker, marks),
            "dividend_summary": dividend_summary if isinstance(dividend_summary, list) else [],
            "dividend_message": dividend_message,
            "metrics": {},
        }

    def _get_cached(self, ticker: str) -> dict[str, Any] | None:
        now = time.monotonic()
        with self._lock:
            cached = self._cache.get(ticker)
            if not cached:
                return None
            cached_at, enrichment = cached
            if now - cached_at > self.cache_ttl_seconds:
                self._cache.pop(ticker, None)
                return None
            return deepcopy(enrichment)

    def _set_cached(self, ticker: str, enrichment: dict[str, Any]) -> None:
        with self._lock:
            self._cache[ticker] = (time.monotonic(), deepcopy(enrichment))

    def _wait_for_rate_limit(self) -> None:
        if self.min_request_interval_seconds <= 0:
            return
        with self._lock:
            now = time.monotonic()
            wait_seconds = self.min_request_interval_seconds - (now - self._last_request_at)
            if wait_seconds > 0:
                time.sleep(wait_seconds)
                now = time.monotonic()
            self._last_request_at = now


class DnseEnricher:
    """DNSE REST market-data adapter using DNSE's documented HMAC signing."""

    def __init__(
        self,
        *,
        api_key: str,
        api_secret: str,
        base_url: str = "https://openapi.dnse.com.vn",
        api_version: str = "2026-05-07",
        lookback_days: int = 90,
        cache_ttl_seconds: int = 240 * 60,
        min_request_interval_seconds: float = 1.0,
        client: Any = None,
    ) -> None:
        self.lookback_days = lookback_days
        self.cache_ttl_seconds = cache_ttl_seconds
        self.min_request_interval_seconds = min_request_interval_seconds
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._lock = threading.Lock()
        self._last_request_at = 0.0
        self.client = client or DnseRestClient(
            api_key=api_key,
            api_secret=api_secret,
            base_url=base_url,
            api_version=api_version,
        )

    def enrich(self, ticker: str, *, force: bool = False) -> dict[str, Any]:
        if not force:
            cached = self._get_cached(ticker)
            if cached is not None:
                return cached
        try:
            enrichment = self._enrich_with_dnse(ticker)
        except BaseException as exc:
            enrichment = {
                "status": "unavailable",
                "source": "dnse",
                "message": str(exc),
                "ticker": ticker,
                "history": [],
                "metrics": {},
            }
        self._set_cached(ticker, enrichment)
        return deepcopy(enrichment)

    def _enrich_with_dnse(self, ticker: str) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        start = now - timedelta(days=self.lookback_days)
        self._wait_for_rate_limit()
        ohlc_status, ohlc_body = self.client.get_ohlc(
            bar_type="STOCK",
            query={
                "symbol": ticker.upper(),
                "resolution": "1D",
                "from": int(start.timestamp()),
                "to": int(now.timestamp()),
            },
            dry_run=False,
        )
        history = _normalize_dnse_stock_history(
            _dnse_ohlc_records(_dnse_response(ohlc_status, ohlc_body))
        )

        latest_price = self.latest_price(ticker)
        if latest_price is not None and latest_price > 0:
            if history:
                history[-1]["close"] = latest_price
            else:
                history = [{"time": now.isoformat(), "close": latest_price}]

        if not history:
            raise RuntimeError("DNSE returned no market price history")
        return {
            "status": "ok",
            "source": "dnse",
            "ticker": ticker,
            "history": history[-80:],
            "metrics": {},
        }

    def latest_price(self, ticker: str) -> float | None:
        self._wait_for_rate_limit()
        trade_status, trade_body = self.client.get_latest_trade(
            symbol=ticker.upper(),
            dry_run=False,
        )
        latest_trade = _dnse_response(trade_status, trade_body)
        return normalize_stock_price(
            _find_number(
                latest_trade,
                ("price", "matchPrice", "lastPrice", "close", "last"),
            )
        )

    def _get_cached(self, ticker: str) -> dict[str, Any] | None:
        now = time.monotonic()
        with self._lock:
            cached = self._cache.get(ticker)
            if not cached:
                return None
            cached_at, enrichment = cached
            if now - cached_at > self.cache_ttl_seconds:
                self._cache.pop(ticker, None)
                return None
            return deepcopy(enrichment)

    def _set_cached(self, ticker: str, enrichment: dict[str, Any]) -> None:
        with self._lock:
            self._cache[ticker] = (time.monotonic(), deepcopy(enrichment))

    def _wait_for_rate_limit(self) -> None:
        if self.min_request_interval_seconds <= 0:
            return
        with self._lock:
            now = time.monotonic()
            wait_seconds = self.min_request_interval_seconds - (now - self._last_request_at)
            if wait_seconds > 0:
                time.sleep(wait_seconds)
                now = time.monotonic()
            self._last_request_at = now


class MarketDataEnricher:
    """Use FireAnt first (when configured), then DNSE; report unavailable otherwise."""

    def __init__(
        self,
        *,
        fireant: FireAntEnricher | None = None,
        dnse: DnseEnricher | None = None,
    ) -> None:
        self.fireant = fireant
        self.dnse = dnse

    def enrich(self, ticker: str, *, force: bool = False) -> dict[str, Any]:
        fireant_message = None
        if self.fireant is not None:
            primary = self.fireant.enrich(ticker, force=force)
            if primary.get("status") == "ok" and primary.get("history"):
                if self.dnse is not None:
                    try:
                        latest_price = self.dnse.latest_price(ticker)
                    except BaseException as exc:
                        primary["dnse_message"] = str(exc)
                    else:
                        if latest_price is not None and latest_price > 0:
                            primary["history"][-1]["close"] = latest_price
                            primary["latest_price_source"] = "dnse"
                return primary
            fireant_message = primary.get("message")

        dnse_message = None
        if self.dnse is not None:
            primary = self.dnse.enrich(ticker, force=force)
            if primary.get("status") == "ok" and primary.get("history"):
                if fireant_message:
                    primary["fireant_message"] = fireant_message
                return primary
            dnse_message = primary.get("message")

        if self.fireant is None and self.dnse is None:
            message = "No market-data provider configured (set DNSE or FireAnt keys)"
        else:
            message = "All configured market-data providers failed"
        result: dict[str, Any] = {
            "status": "unavailable",
            "source": "none",
            "ticker": ticker,
            "history": [],
            "metrics": {},
            "message": message,
        }
        if fireant_message:
            result["fireant_message"] = fireant_message
        if dnse_message:
            result["dnse_message"] = dnse_message
        return result


class FireAntRestClient:
    def __init__(
        self,
        *,
        access_token: str,
        base_url: str = "https://api.fireant.vn",
        timeout_seconds: float = 20,
    ) -> None:
        self.access_token = access_token
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def get_historical_quotes(
        self,
        *,
        symbol: str,
        start_date: str,
        end_date: str,
        offset: int = 0,
        limit: int = 500,
    ) -> Any:
        return self._get(
            f"/symbols/{urllib_parse.quote(symbol)}/historical-quotes",
            {
                "startDate": start_date,
                "endDate": end_date,
                "offset": offset,
                "limit": limit,
            },
        )

    def get_timescale_marks(self, *, symbol: str, start_date: str, end_date: str) -> Any:
        return self._get(
            f"/symbols/{urllib_parse.quote(symbol)}/timescale-marks",
            {"startDate": start_date, "endDate": end_date},
        )

    def get_dividends(self, *, symbol: str, count: int = 10) -> Any:
        return self._get(
            f"/symbols/{urllib_parse.quote(symbol)}/dividends",
            {"count": count},
        )

    def _get(self, path: str, query: dict[str, Any] | None = None) -> Any:
        url = f"{self.base_url}{path}"
        if query:
            url += f"?{urllib_parse.urlencode(query)}"
        request = urllib_request.Request(
            url,
            method="GET",
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Accept": "application/json",
            },
        )
        try:
            with urllib_request.urlopen(request, timeout=self.timeout_seconds) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib_error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
            raise RuntimeError(f"FireAnt HTTP {exc.code}: {body[:300]}") from exc


class DnseRestClient:
    def __init__(
        self,
        *,
        api_key: str,
        api_secret: str,
        base_url: str,
        api_version: str,
        timeout_seconds: float = 20,
    ) -> None:
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url.rstrip("/")
        self.api_version = api_version
        self.timeout_seconds = timeout_seconds

    def get_ohlc(self, *, bar_type: str, query: dict[str, Any], dry_run: bool = False):
        request_query = dict(query)
        request_query["type"] = bar_type
        return self._request("GET", "/price/ohlc", query=request_query, dry_run=dry_run)

    def get_latest_trade(self, *, symbol: str, dry_run: bool = False):
        return self._request("GET", f"/price/{symbol}/trades/latest", dry_run=dry_run)

    def _request(
        self,
        method: str,
        path: str,
        *,
        query: dict[str, Any] | None = None,
        dry_run: bool = False,
    ) -> tuple[int | None, str | None]:
        url = f"{self.base_url}{path}"
        if query:
            url += f"?{urllib_parse.urlencode(query)}"
        headers = self._signed_headers(method, path)
        if dry_run:
            return None, None
        req = urllib_request.Request(url, method=method, headers=headers)
        try:
            with urllib_request.urlopen(req, timeout=self.timeout_seconds) as response:
                return response.status, response.read().decode("utf-8")
        except urllib_error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
            return exc.code, body

    def _signed_headers(self, method: str, path: str) -> dict[str, str]:
        date_value = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S %z")
        nonce = uuid4().hex
        signing_string = (
            f"(request-target): {method.lower()} {path}\n"
            f"date: {date_value}\n"
            f"nonce: {nonce}"
        )
        digest = hmac.new(
            self.api_secret.encode("utf-8"),
            signing_string.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature = urllib_parse.quote(base64.b64encode(digest).decode("utf-8"), safe="")
        signature_header = (
            f'Signature keyId="{self.api_key}",algorithm="hmac-sha256",'
            f'headers="(request-target) date",signature="{signature}",nonce="{nonce}"'
        )
        return {
            "Date": date_value,
            "X-Signature": signature_header,
            "x-api-key": self.api_key,
            "version": self.api_version,
        }


def _dnse_response(status: Any, body: Any) -> Any:
    try:
        status_code = int(status)
    except (TypeError, ValueError):
        status_code = 0
    if not 200 <= status_code < 300:
        raise RuntimeError(f"DNSE request failed with status {status}: {body}")
    if isinstance(body, (dict, list)):
        return body
    if not body:
        return {}
    try:
        return json.loads(body)
    except (TypeError, json.JSONDecodeError) as exc:
        raise RuntimeError("DNSE returned invalid JSON") from exc


def _dnse_ohlc_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict) and isinstance(payload.get("data"), (dict, list)):
        payload = payload["data"]
    if isinstance(payload, list):
        records = [_normalize_dnse_ohlc_row(row) for row in payload if isinstance(row, dict)]
        return [row for row in records if row.get("close") is not None]
    if not isinstance(payload, dict):
        return []

    times = payload.get("t") or payload.get("time") or payload.get("times") or []
    opens = payload.get("o") or payload.get("open") or []
    highs = payload.get("h") or payload.get("high") or []
    lows = payload.get("l") or payload.get("low") or []
    closes = payload.get("c") or payload.get("close") or []
    volumes = payload.get("v") or payload.get("volume") or []
    if not isinstance(closes, list):
        return [_normalize_dnse_ohlc_row(payload)]
    records = []
    for index, close in enumerate(closes):
        records.append(
            {
                "time": _sequence_value(times, index),
                "open": _sequence_value(opens, index),
                "high": _sequence_value(highs, index),
                "low": _sequence_value(lows, index),
                "close": close,
                "volume": _sequence_value(volumes, index),
            }
        )
    return records


def _normalize_dnse_stock_history(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for row in records:
        cleaned = dict(row)
        cleaned["time"] = _normalize_dnse_time(cleaned.get("time"))
        for field in ("open", "high", "low", "close"):
            cleaned[field] = normalize_stock_price(cleaned.get(field))
        normalized.append(cleaned)
    return normalized


def _normalize_fireant_history(records: Any) -> list[dict[str, Any]]:
    if not isinstance(records, list):
        return []
    normalized: list[dict[str, Any]] = []
    for row in records:
        if not isinstance(row, dict):
            continue
        item = {
            "time": row.get("date"),
            "open": normalize_stock_price(row.get("priceOpen")),
            "high": normalize_stock_price(row.get("priceHigh")),
            "low": normalize_stock_price(row.get("priceLow")),
            "close": normalize_stock_price(row.get("priceClose")),
            "volume": coerce_float(row.get("totalVolume")),
        }
        if item["time"] and all(item[field] is not None for field in ("open", "high", "low", "close")):
            normalized.append(item)
    return sorted(normalized, key=lambda row: str(row["time"]))


def _fireant_dividend_events(ticker: str, marks: Any) -> list[dict[str, Any]]:
    if not isinstance(marks, list):
        return []
    events: list[dict[str, Any]] = []
    for mark in marks:
        if not isinstance(mark, dict):
            continue
        title = str(mark.get("title") or "").strip()
        label = str(mark.get("label") or "").strip()
        searchable = _ascii_fold(f"{label} {title}")
        if "co tuc" not in searchable and "dividend" not in searchable:
            continue
        event_date = _iso_date(mark.get("date"))
        if not event_date:
            continue
        mark_id = str(mark.get("id") or f"{event_date}:{label}:{title}")
        note = f"FireAnt: {title or label}".strip()
        events.append(
            {
                "ticker": ticker.upper(),
                "ex_date": event_date,
                "cash_amount": None,
                "stock_ratio_pct": None,
                "issue_ratio_pct": None,
                "issue_price": None,
                "note": note,
                "source": "fireant",
                "external_id": f"{ticker.upper()}:{mark_id}",
            }
        )
    return events


def _ascii_fold(value: str) -> str:
    return "".join(
        character
        for character in unicodedata.normalize("NFKD", value.casefold())
        if not unicodedata.combining(character)
    )


def _iso_date(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        try:
            return date.fromisoformat(text[:10]).isoformat()
        except ValueError:
            return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def _normalize_dnse_time(value: Any) -> Any:
    numeric = coerce_float(value)
    if numeric is None:
        return value
    timestamp = numeric / 1000 if numeric >= 1_000_000_000_000 else numeric
    try:
        return datetime.fromtimestamp(timestamp, timezone.utc).isoformat()
    except (OSError, OverflowError, ValueError):
        return value


def _normalize_dnse_ohlc_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "time": row.get("time") or row.get("t") or row.get("timestamp"),
        "open": row.get("open") if row.get("open") is not None else row.get("o"),
        "high": row.get("high") if row.get("high") is not None else row.get("h"),
        "low": row.get("low") if row.get("low") is not None else row.get("l"),
        "close": row.get("close") if row.get("close") is not None else row.get("c"),
        "volume": row.get("volume") if row.get("volume") is not None else row.get("v"),
    }


def _sequence_value(value: Any, index: int) -> Any:
    return value[index] if isinstance(value, list) and index < len(value) else None


def _find_number(payload: Any, keys: tuple[str, ...]) -> float | None:
    if isinstance(payload, dict):
        for key in keys:
            value = coerce_float(payload.get(key))
            if value is not None:
                return value
        for value in payload.values():
            found = _find_number(value, keys)
            if found is not None:
                return found
    elif isinstance(payload, list):
        for value in payload:
            found = _find_number(value, keys)
            if found is not None:
                return found
    return None
