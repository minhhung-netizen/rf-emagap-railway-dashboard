from __future__ import annotations

import json
import re
from typing import Any


def parse_forgiving_json(text: str) -> dict[str, Any]:
    attempts = []
    stripped = text.strip()
    if stripped:
        attempts.append(stripped)
    unwrapped = _unwrap_misquoted_json(stripped)
    if unwrapped != stripped:
        attempts.append(unwrapped)
    if stripped.startswith("="):
        attempts.append(stripped[1:].strip())

    for base in (stripped, unwrapped):
        repaired = re.sub(r'("[^"]+"\s*):\s*=', r"\1:", base)
        if repaired != base:
            attempts.append(repaired)
        if repaired.startswith("="):
            attempts.append(repaired[1:].strip())

    seen: set[str] = set()
    index = 0
    while index < len(attempts):
        candidate = attempts[index]
        index += 1
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, str):
            nested = data.strip()
            nested_unwrapped = _unwrap_misquoted_json(nested)
            for value in (nested, nested_unwrapped):
                if value and value not in seen:
                    attempts.append(value)
                repaired = re.sub(r'("[^"]+"\s*):\s*=', r"\1:", value)
                if repaired and repaired not in seen:
                    attempts.append(repaired)
            continue
        if not isinstance(data, dict):
            raise ValueError("Webhook body must be a JSON object")
        return data
    raise ValueError("Invalid webhook JSON")


def parse_tradingview_alert_text(text: str) -> dict[str, Any]:
    """Convert TradingView's human-readable order-fill alert into a webhook payload.

    TradingView sends this format when an alert uses its default strategy message
    instead of ``{{strategy.order.alert_message}}``.  The text is localized, may
    span several lines, and commonly repeats the strategy settings after the fill
    sentence.  Only fields that can be identified unambiguously are extracted.
    """
    value = str(text or "").strip()
    if not value:
        raise ValueError("Webhook body is required")

    order_match = re.search(
        r"(?:lệnh|order)\s+(?P<action>buy|sell|mua|b[aá]n)"
        r"\s*@\s*(?P<price>[0-9]+(?:[.,][0-9]+)?)",
        value,
        flags=re.IGNORECASE,
    )
    if order_match is None:
        raise ValueError("TradingView text does not contain an order action and price")

    action_aliases = {"mua": "buy", "ban": "sell", "bán": "sell"}
    raw_action = order_match.group("action").lower()
    action = action_aliases.get(raw_action, raw_action)

    symbol_match = re.search(
        r"\b(?P<exchange>HOSE|HNX|UPCOM):(?P<ticker>[A-Z][A-Z0-9]{1,11})\b",
        value,
        flags=re.IGNORECASE,
    )
    if symbol_match:
        ticker = f'{symbol_match.group("exchange").upper()}:{symbol_match.group("ticker").upper()}'
    else:
        filled_match = re.search(
            r"(?:được\s+thực\s+hiện|thực\s+hiện|filled(?:\s+on)?)\s+"
            r"(?P<ticker>[A-Z][A-Z0-9]{1,11})\b",
            value,
            flags=re.IGNORECASE,
        )
        if filled_match is None:
            raise ValueError("TradingView text does not contain a ticker")
        ticker = filled_match.group("ticker").upper()

    strategy_match = re.search(
        r'^\s*["“]?(?P<strategy>[^\r\n(]{1,160}?)\s*\('
        r"[\s\S]{0,3000}?\)\s*:\s*(?:lệnh|order)\b",
        value,
        flags=re.IGNORECASE,
    )
    strategy = (
        strategy_match.group("strategy").strip(' "“”')
        if strategy_match
        else "TradingView order fill"
    )

    timeframe = None
    if symbol_match:
        timeframe_match = re.search(
            re.escape(symbol_match.group(0)) + r"\s*,\s*([^\s,•]+)",
            value,
            flags=re.IGNORECASE,
        )
        if timeframe_match:
            timeframe = timeframe_match.group(1)

    price = order_match.group("price").replace(",", "")
    return {
        "ticker": ticker,
        "action": action,
        "price": price,
        "timeframe": timeframe,
        "strategy": strategy,
        "note": "Imported from TradingView order-fill text",
        "payload_format": "tradingview_order_fill_text",
        "raw_text": value,
    }


def _unwrap_misquoted_json(value: str) -> str:
    candidate = value.strip()
    if candidate.startswith('"') and candidate[1:].lstrip().startswith("{"):
        candidate = candidate[1:].lstrip()
    if candidate.endswith('"') and candidate.rstrip('"').rstrip().endswith("}"):
        candidate = candidate[:-1].rstrip()
    return candidate
