"""Confirmed executions, independent of alerts. All monetary inputs are VND."""
from __future__ import annotations

import json
import math
from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import Field, field_validator, model_validator

from app.database import utc_now_iso
from app.services.fund_analytics import AnalyticsModel, NavSnapshot


def today() -> date:
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()


class Dated(AnalyticsModel):
    trade_date: date

    @field_validator("trade_date")
    @classmethod
    def not_future(cls, value):
        if value > today():
            raise ValueError("Không ghi nhận ngày tương lai")
        return value


class Entry(Dated):
    reference: str = Field(min_length=1, max_length=100)
    kind: Literal["deposit", "withdraw", "buy", "sell", "dividend", "expense"]
    ticker: str = Field(default="", max_length=20, pattern=r"^[A-Za-z0-9._-]*$")
    sleeve: Literal["RF", "EMA", "OTHER"] = "OTHER"
    sector: str = Field(default="unknown", min_length=1, max_length=100)
    quantity: float = Field(default=0, ge=0, le=1e12)
    price: float = Field(default=0, ge=0, le=1e12)
    amount: float = Field(default=0, ge=0, le=1e18)
    fees: float = Field(default=0, ge=0, le=1e15)
    signal_id: int | None = Field(default=None, ge=1)
    note: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def shape(self):
        self.ticker = self.ticker.upper()
        self.sector = self.sector.casefold()
        if self.kind in {"buy", "sell"}:
            if not self.ticker or not self.quantity or not self.price or self.amount:
                raise ValueError("Mua/bán cần mã, số lượng, giá VND; amount phải bằng 0")
        elif not self.amount or self.quantity or self.price or self.fees or self.signal_id:
            raise ValueError("Dòng tiền cần amount > 0; quantity, price, fees bằng 0 và không gắn webhook")
        if self.kind == "dividend" and not self.ticker:
            raise ValueError("Cổ tức cần mã cổ phiếu; nhập số tiền thực nhận sau thuế")
        return self


class EntryBatch(AnalyticsModel):
    entries: list[Entry] = Field(min_length=1, max_length=2000)


class VerifiedPrice(Dated):
    ticker: str = Field(min_length=1, max_length=20, pattern=r"^[A-Za-z0-9._-]+$")
    price: float = Field(gt=0, le=1e12)
    source: str = Field(min_length=3, max_length=200)
    evidence: str = Field(min_length=3, max_length=1000)
    confirmed: Literal[True]

    @field_validator("ticker")
    @classmethod
    def uppercase(cls, value):
        return value.upper()


class VoidEntry(AnalyticsModel):
    reason: str = Field(min_length=5, max_length=1000)


class CloseRequest(Dated):
    benchmark_name: str = Field(default="VNINDEX (price)", min_length=1, max_length=100)
    benchmark_value: float | None = Field(default=None, gt=0, le=1e12)


def entries(conn):
    return [{**json.loads(r["entry_json"]), **{k: r[k] for k in (
        "id", "created_by", "created_at", "void_reason", "voided_by", "voided_at")}}
        for r in conn.execute("SELECT * FROM ledger_entries ORDER BY id")]


def prices(conn):
    return [{**json.loads(r["price_json"]), "id": r["id"], "created_by": r["created_by"],
             "created_at": r["created_at"]} for r in conn.execute("SELECT * FROM ledger_prices ORDER BY id")]


def locked(conn, day):
    last = conn.execute("SELECT MAX(trade_date) FROM ledger_closes").fetchone()[0]
    if last and day <= last:
        raise ValueError(f"Sổ đã khóa đến {last}; không sửa dữ liệu lịch sử đã chốt NAV")


def replay(rows, day):
    """Weighted average cost includes buy fees; sell fees reduce realized P/L."""
    cash = realized = flows = income = expenses = Decimal(0)
    holdings = {}
    D = lambda x: Decimal(str(x))
    for row in sorted(rows, key=lambda r: (r["trade_date"], r.get("id", 0))):
        if row.get("void_reason") or row["trade_date"] > day:
            continue
        kind = row["kind"]
        amount, qty, price, fees = (D(row[k]) for k in ("amount", "quantity", "price", "fees"))
        if kind == "deposit":
            cash += amount
            flows += amount
        elif kind == "withdraw":
            cash -= amount
            flows -= amount
        elif kind == "dividend":
            cash += amount
            income += amount
        elif kind == "expense":
            cash -= amount
            expenses += amount
        else:
            key = (row["ticker"], row["sleeve"])
            h = holdings.setdefault(key, dict(ticker=key[0], sleeve=key[1], sector=row["sector"],
                                              quantity=Decimal(0), cost=Decimal(0)))
            if h["quantity"] and h["sector"] != row["sector"]:
                raise ValueError(f"Ngành không nhất quán: {row['ticker']}")
            h["sector"] = row["sector"]
            if kind == "buy":
                cash -= qty * price + fees
                h["quantity"] += qty
                h["cost"] += qty * price + fees
            else:
                if qty > h["quantity"]:
                    raise ValueError(f"Bán vượt số lượng: {row['reference']}")
                cost = h["cost"] * qty / h["quantity"]
                h["quantity"] -= qty
                h["cost"] -= cost
                cash += qty * price - fees
                realized += qty * price - fees - cost
        if cash < 0:
            raise ValueError(f"Tiền mặt âm sau {row['reference']}; kiểm tra thứ tự giao dịch/nạp tiền")
    sectors = {}
    for h in holdings.values():
        if h["quantity"]:
            if h["ticker"] in sectors and sectors[h["ticker"]] != h["sector"]:
                raise ValueError(f"Một mã phải cùng ngành ở các nhóm: {h['ticker']}")
            sectors[h["ticker"]] = h["sector"]
    return dict(cash=float(cash), realized_pnl=float(realized), external_flows=float(flows),
                dividend_income=float(income), expenses=float(expenses), holdings=[
                    {**h, "quantity": float(h["quantity"]), "cost": float(h["cost"])}
                    for h in holdings.values() if h["quantity"]])


def add_entries(store, batch, user_id):
    with store.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        count = 0
        for item in batch.entries:
            row = item.model_dump(mode="json")
            encoded = json.dumps(row, ensure_ascii=False, sort_keys=True)
            existing = conn.execute("SELECT entry_json, void_reason FROM ledger_entries WHERE reference=?", (item.reference,)).fetchone()
            if existing:
                if existing["entry_json"] == encoded and not existing["void_reason"]:
                    continue
                raise ValueError(f"Mã đối chiếu đã tồn tại: {item.reference}")
            locked(conn, row["trade_date"])
            if item.signal_id:
                signal = conn.execute("SELECT * FROM signals WHERE id=?", (item.signal_id,)).fetchone()
                expected = {"buy": {"buy", "confirm_buy"}, "sell": {"sell", "confirm_sell"}}[item.kind]
                if not signal or signal["ticker"] != item.ticker or signal["action"] not in expected:
                    raise ValueError("Webhook liên kết không tồn tại hoặc sai mã/chiều giao dịch")
                received_day = datetime.fromisoformat(signal["received_at"]).astimezone(ZoneInfo("Asia/Ho_Chi_Minh")).date()
                if item.trade_date < received_day:
                    raise ValueError("Ngày khớp không được trước ngày nhận webhook liên kết")
            conn.execute("INSERT INTO ledger_entries(reference,entry_json,created_by,created_at) VALUES(?,?,?,?)",
                         (item.reference, encoded, user_id, utc_now_iso()))
            count += 1
        replay(entries(conn), today().isoformat())
    return {"inserted": count}


def void_entry(store, entry_id, reason, user_id):
    with store.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT * FROM ledger_entries WHERE id=?", (entry_id,)).fetchone()
        if not row or row["void_reason"]:
            raise ValueError("Giao dịch không tồn tại hoặc đã hủy")
        locked(conn, json.loads(row["entry_json"])["trade_date"])
        conn.execute("UPDATE ledger_entries SET void_reason=?,voided_by=?,voided_at=? WHERE id=?",
                     (reason, user_id, utc_now_iso(), entry_id))
        replay(entries(conn), today().isoformat())
    return {"status": "voided"}


def add_price(store, item, user_id):
    with store.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        locked(conn, item.trade_date.isoformat())
        conn.execute("INSERT INTO ledger_prices(price_json,created_by,created_at) VALUES(?,?,?)",
                     (item.model_dump_json(), user_id, utc_now_iso()))
    return {"status": "verified"}


def valuation(conn, day):
    rows = entries(conn)
    result = replay(rows, day)
    quotes = {p["ticker"]: p for p in prices(conn) if p["trade_date"] == day}
    missing = []
    market = unrealized = 0
    for h in result["holdings"]:
        p = quotes.get(h["ticker"])
        h.update(price=p["price"] if p else None, price_source=p["source"] if p else None)
        h["market_value"] = h["quantity"] * h["price"] if p else None
        h["unrealized_pnl"] = h["market_value"] - h["cost"] if p else None
        if p:
            market += h["market_value"]
            unrealized += h["unrealized_pnl"]
        else:
            missing.append(h["ticker"])
    result.update(trade_date=day, missing_prices=sorted(set(missing)),
                  nav=None if missing else result["cash"] + market,
                  unrealized_pnl=None if missing else unrealized,
                  external_flow=sum((r["amount"] if r["kind"] == "deposit" else -r["amount"])
                      for r in rows if not r["void_reason"] and r["trade_date"] == day and r["kind"] in {"deposit", "withdraw"}))
    result["total_pnl"] = None if missing else result["nav"] - result["external_flows"]
    return result


def close_nav(store, item, user_id):
    day = item.trade_date.isoformat()
    with store.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        locked(conn, day)
        v = valuation(conn, day)
        if v["missing_prices"]:
            raise ValueError("Thiếu giá cùng ngày đã kiểm chứng: " + ", ".join(v["missing_prices"]))
        if conn.execute("SELECT 1 FROM nav_snapshots WHERE trade_date>=?", (day,)).fetchone():
            raise ValueError("Chỉ nối NAV mới sau ngày NAV cuối cùng; không ghi đè lịch sử")
        previous = conn.execute("SELECT MAX(trade_date) FROM nav_snapshots").fetchone()[0]
        if previous and not conn.execute("SELECT 1 FROM ledger_closes LIMIT 1").fetchone():
            baseline = valuation(conn, previous)
            old = json.loads(conn.execute("SELECT snapshot_json FROM nav_snapshots WHERE trade_date=?", (previous,)).fetchone()[0])
            old_qty = {(h["ticker"], h["sleeve"]): h["quantity"] for h in old["holdings"] if h["quantity"]}
            new_qty = {(h["ticker"], h["sleeve"]): h["quantity"] for h in baseline["holdings"]}
            if (baseline["nav"] is None or abs(baseline["nav"] - old["nav"]) > 1
                    or abs(baseline["cash"] - old["cash"]) > 1 or old_qty != new_qty
                    or old.get("receivables", 0) or old.get("liabilities", 0)):
                raise ValueError("Sổ và giá tại ngày NAV cũ chưa khớp số dư ban đầu; đối chiếu trước khi nối chuỗi NAV")
        # Aggregate all flows since previous observation, including missing NAV days.
        flow = sum((r["amount"] if r["kind"] == "deposit" else -r["amount"])
                   for r in entries(conn) if not r["void_reason"] and r["kind"] in {"deposit", "withdraw"}
                   and (not previous or previous < r["trade_date"]) and r["trade_date"] <= day)
        snapshot = NavSnapshot(trade_date=day, nav=v["nav"], cash=v["cash"], external_flow=flow if previous else 0,
            holdings=[{k: h[k] for k in ("ticker", "sleeve", "sector", "quantity", "price")} for h in v["holdings"]],
            benchmark_name=item.benchmark_name, benchmark_value=item.benchmark_value,
            note="Sổ giao dịch đã chốt; giá VND được quản trị viên kiểm chứng. Dòng tiền quy ước cuối kỳ.").model_dump(mode="json")
        encoded, now = json.dumps(snapshot, ensure_ascii=False), utc_now_iso()
        conn.execute("INSERT INTO nav_snapshots VALUES(?,?,?,?)", (day, encoded, user_id, now))
        conn.execute("INSERT INTO nav_snapshot_revisions(trade_date,snapshot_json,updated_by,updated_at) VALUES(?,?,?,?)", (day, encoded, user_id, now))
        conn.execute("INSERT INTO ledger_closes VALUES(?,?,?,?)", (day, encoded, user_id, now))
    return {"snapshot": snapshot}


def report(store, day):
    with store.connect() as conn:
        result = valuation(conn, day)
        result["entries"] = entries(conn)
        result["prices"] = prices(conn)
        result["locked_through"] = conn.execute("SELECT MAX(trade_date) FROM ledger_closes").fetchone()[0]
        signals = conn.execute("SELECT id,ticker,action,strategy,price,received_at FROM signals ORDER BY id DESC LIMIT 500").fetchall()
        result["signal_count"] = conn.execute("SELECT COUNT(*) FROM signals").fetchone()[0]
        result["invalid_count"] = conn.execute("SELECT COUNT(*) FROM invalid_signals").fetchone()[0]
        result["invalid"] = [dict(r) for r in conn.execute("SELECT id,ticker,action,reason,received_at FROM invalid_signals ORDER BY id DESC LIMIT 100")]
        cached = conn.execute("SELECT ticker,enrichment_json FROM signals WHERE id IN (SELECT MAX(id) FROM signals GROUP BY ticker)").fetchall()
    active = [e for e in result["entries"] if not e["void_reason"]]
    quotes = {(p["ticker"], p["trade_date"]): p for p in result["prices"]}
    audit = []
    for signal in signals:
        r = dict(signal)
        fills = [e for e in active if e["signal_id"] == r["id"]]
        stamp = datetime.fromisoformat(r["received_at"]).astimezone(ZoneInfo("Asia/Ho_Chi_Minh")).date().isoformat()
        p = quotes.get((r["ticker"], stamp))
        # Existing signal.price is normalized to thousands of VND for Vietnamese equities.
        r["signal_price_vnd"] = r.pop("price") * 1000 if r["price"] else None
        r["reference_price"] = p["price"] if p else None
        r["deviation_pct"] = (r["signal_price_vnd"] / p["price"] - 1) * 100 if p and r["signal_price_vnd"] else None
        r["fill_count"] = len(fills)
        r["filled_quantity"] = sum(e["quantity"] for e in fills)
        r["status"] = "Đã liên kết khớp lệnh" if fills else "Chưa liên kết khớp lệnh"
        audit.append(r)
    result["webhooks"] = audit
    health = []
    for row in cached:
        enrichment = json.loads(row["enrichment_json"])
        history = enrichment.get("history") or []
        if not isinstance(history, list):
            history = [None]
        usable = []
        invalid_bars = 0
        for bar in history:
            try:
                raw_date = str(bar.get("time", ""))
                bar_day = date.fromisoformat(raw_date[:10]).isoformat()
                close = float(bar["close"])
                if not math.isfinite(close) or not 0 < close <= 1e9 or bar_day > today().isoformat():
                    raise ValueError("invalid bar")
                usable.append((bar_day, close))
            except (ValueError, TypeError, KeyError, AttributeError):
                invalid_bars += 1
        last = max(usable, default=None)
        quote = quotes.get((row["ticker"], last[0])) if last else None
        price_vnd = last[1] * 1000 if last else None
        health.append(dict(ticker=row["ticker"], status=enrichment.get("status", "unknown"),
                           refreshed_at=enrichment.get("refreshed_at"), latest_date=last[0] if last else None,
                           cached_price_vnd=price_vnd, age_days=(today()-date.fromisoformat(last[0])).days if last else None,
                           invalid_bars=invalid_bars,
                           deviation_pct=(price_vnd/quote["price"]-1)*100 if quote else None))
    result["price_health"] = health
    result["unlinked_trades"] = sum(e["kind"] in {"buy", "sell"} and not e["signal_id"] for e in active)
    return result
