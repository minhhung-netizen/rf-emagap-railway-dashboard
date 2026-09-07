"""Portfolio-wide analytics from reconciled, end-of-day VND valuations.

External flows occur at end of day. Holdings prices are VND, not webhook kVND.
Missing observations never become zero returns or fabricated cash balances.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from math import exp, isfinite, log, sqrt
from statistics import mean, stdev
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalyticsModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, str_strip_whitespace=True)


class Holding(AnalyticsModel):
    ticker: str = Field(min_length=1, max_length=20, pattern=r"^[A-Za-z0-9:._-]+$")
    sector: str = Field(min_length=1, max_length=120)
    sleeve: Literal["RF", "EMA", "OTHER"]
    quantity: float = Field(ge=0, le=1e15)
    price: float = Field(gt=0, le=1e12)
    target_weight_pct: float | None = Field(default=None, ge=0, le=100)
    stop_price: float | None = Field(default=None, gt=0, le=1e12)
    risk_budget_pct: float | None = Field(default=None, ge=0, le=100)
    # Supplied accounting P/L includes trades, income and costs for this day.
    daily_pnl: float | None = Field(default=None, ge=-1e18, le=1e18)
    # Total security return (corporate-action adjusted), used for correlation.
    total_return_pct: float | None = Field(default=None, ge=-100, le=10000)

    @model_validator(mode="after")
    def normalize(self):
        self.ticker = self.ticker.upper().split(":")[-1]
        self.sector = self.sector.casefold()
        if not self.ticker:
            raise ValueError("Ticker is required")
        return self


class NavSnapshot(AnalyticsModel):
    trade_date: date
    nav: float = Field(ge=1, le=1e18)
    cash: float = Field(ge=0, le=1e18)
    receivables: float = Field(default=0, ge=0, le=1e18)
    liabilities: float = Field(default=0, ge=0, le=1e18)
    external_flow: float = Field(default=0, ge=-1e18, le=1e18)
    benchmark_name: str = Field(default="VNINDEX (price)", min_length=1, max_length=100)
    benchmark_value: float | None = Field(default=None, ge=1e-6, le=1e12)
    holdings: list[Holding] = Field(default_factory=list, max_length=1000)
    note: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def reconcile(self):
        if self.trade_date > datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date():
            raise ValueError("Future NAV dates are not allowed")
        keys = [(h.ticker, h.sleeve) for h in self.holdings]
        if len(keys) != len(set(keys)):
            raise ValueError("Duplicate ticker/sleeve: consolidate the holding first")
        sectors = defaultdict(set)
        for h in self.holdings:
            sectors[h.ticker].add(h.sector)
        if any(len(values) > 1 for values in sectors.values()):
            raise ValueError("The same ticker must have the same sector")
        assets = self.cash + self.receivables - self.liabilities
        assets += sum(h.quantity * h.price for h in self.holdings)
        if abs(assets - self.nav) > max(1, self.nav * 1e-8):
            raise ValueError("NAV must equal holdings + cash + receivables - liabilities (VND)")
        if self.nav - self.external_flow <= 0:
            raise ValueError("NAV before the end-of-day external flow must be positive")
        return self


class NavImport(AnalyticsModel):
    snapshots: list[NavSnapshot] = Field(min_length=1, max_length=2000)
    replace_existing: bool = False


class RiskPolicy(AnalyticsModel):
    annual_risk_free_pct: float = Field(default=0, ge=0, le=100)
    warning_drawdown_pct: float = Field(default=10, gt=0, le=100)
    pause_drawdown_pct: float = Field(default=15, gt=0, le=100)
    pause_new_allocations: bool = False
    max_nav_age_days: int = Field(default=4, ge=1, le=30)
    market_shock_pct: float = Field(default=-10, ge=-100, le=0)
    sector_shock_pct: float = Field(default=-20, ge=-100, le=0)

    @model_validator(mode="after")
    def thresholds(self):
        if self.warning_drawdown_pct > self.pause_drawdown_pct:
            raise ValueError("Warning drawdown must not exceed pause drawdown")
        return self


def xirr(flows: list[tuple[date, float]]) -> float | None:
    """Conservative unique-root XIRR; ambiguous cash-flow sequences return None."""
    grouped = defaultdict(float)
    for day, amount in flows:
        grouped[day] += amount
    values = [(day, amount) for day, amount in sorted(grouped.items()) if amount]
    if len(values) < 2 or values[0][0] == values[-1][0]:
        return None
    signs = [amount > 0 for _, amount in values]
    if sum(a != b for a, b in zip(signs, signs[1:])) != 1:
        return None
    start = values[0][0]
    scale = max(abs(amount) for _, amount in values)
    def npv(rate_log):
        return sum(amount / scale * exp(max(-700, min(700, -rate_log * (day - start).days / 365)))
                   for day, amount in values)
    lo, hi = -13.8, 13.8
    lo_value = npv(lo)
    if lo_value * npv(hi) > 0:
        return None
    for _ in range(150):
        mid = (lo + hi) / 2
        mid_value = npv(mid)
        if lo_value * mid_value <= 0:
            hi = mid
        else:
            lo = mid
            lo_value = mid_value
    result = (exp((lo + hi) / 2) - 1) * 100
    return result if isfinite(result) else None


def _business_gap(start: date, end: date) -> int:
    """Weekdays only; exchange holidays are conservatively flagged for review."""
    return sum((start + timedelta(days=i)).weekday() < 5 for i in range(1, (end-start).days + 1))


def _growth_index(log_growth: float) -> float | None:
    """Never emit Infinity/NaN into JSON, even for erroneous extreme valuations."""
    try:
        value = exp(log_growth) * 100
    except OverflowError:
        return None
    return value if isfinite(value) else None


def build_fund_performance(snapshots: list[dict], policy: dict | None = None) -> dict:
    policy = RiskPolicy.model_validate(policy or {}).model_dump()
    ordered = sorted(snapshots, key=lambda s: s["trade_date"])
    if not ordered:
        return {"status": "empty", "curve": [], "periods": {}, "metrics": {}, "attribution": {},
                "warnings": ["Chưa có NAV. Nhập dữ liệu cuối ngày trong Quản trị."]}
    curve, warnings, drawdowns = [], [], []
    groups = {key: defaultdict(float) for key in ("ticker", "sector", "sleeve")}
    index, log_growth, log_peak = 100.0, 0.0, 0.0
    start = date.fromisoformat(ordered[0]["trade_date"])
    end = date.fromisoformat(ordered[-1]["trade_date"])
    peak_date, max_duration = start, 0
    flows = [(start, -ordered[0]["nav"])]
    daily, excess = [], []
    regular = True
    periods = {"monthly": defaultdict(float), "yearly": defaultdict(float)}
    benchmark_ok = all(s.get("benchmark_value") for s in ordered) and len({s["benchmark_name"] for s in ordered}) == 1
    if not benchmark_ok:
        warnings.append("Benchmark thiếu ngày hoặc khác tên; chưa thể so sánh cùng kỳ.")
    for i, snapshot in enumerate(ordered):
        day = date.fromisoformat(snapshot["trade_date"])
        period_return = None
        if i:
            previous = ordered[i-1]
            previous_day = date.fromisoformat(previous["trade_date"])
            gap = _business_gap(previous_day, day)
            if gap != 1 or day.weekday() >= 5:
                regular = False
            factor = (snapshot["nav"] - snapshot["external_flow"]) / previous["nav"]
            period_return = (factor - 1) * 100
            log_growth += log(factor)
            index = _growth_index(log_growth)
            daily.append(factor - 1)
            risk_free = (1 + policy["annual_risk_free_pct"] / 100) ** ((day-previous_day).days/365) - 1
            excess.append(factor - 1 - risk_free)
            periods["monthly"][snapshot["trade_date"][:7]] += log(factor)
            periods["yearly"][snapshot["trade_date"][:4]] += log(factor)
            flows.append((day, -snapshot["external_flow"]))
            # Arithmetic P/L attribution in VND; no misleading compounded contributions.
            for holding in snapshot["holdings"]:
                pnl = holding.get("daily_pnl")
                if pnl is not None:
                    for key in groups:
                        groups[key][holding[key]] += pnl
        duration = (day-peak_date).days
        if log_growth >= log_peak - 1e-12:
            max_duration = max(max_duration, duration if drawdowns and drawdowns[-1] < -1e-10 else 0)
            log_peak, peak_date = max(log_growth, log_peak), day
        else:
            max_duration = max(max_duration, duration)
        drawdown = (exp(min(0, log_growth-log_peak))-1)*100
        drawdowns.append(drawdown)
        curve.append({"date": snapshot["trade_date"], "nav": snapshot["nav"], "index": index,
                      "return_pct": period_return, "drawdown_pct": drawdown,
                      "benchmark_index": snapshot["benchmark_value"]/ordered[0]["benchmark_value"]*100 if benchmark_ok else None})
    flows.append((end, ordered[-1]["nav"]))
    if not regular:
        warnings.append("NAV không đủ chuỗi phiên ngày (lịch thứ Hai–thứ Sáu). Ẩn Sharpe/Sortino; bảng tháng/năm phân bổ theo ngày ghi nhận cuối kỳ, cần kiểm tra ngày thiếu/nghỉ lễ và dòng tiền.")
    if ordered[0]["external_flow"]:
        warnings.append("NAV đầu tiên là mốc vốn đầu kỳ; dòng tiền tại mốc đầu không được tính lần nữa.")
    days = (end-start).days
    annual_index = _growth_index(log_growth*365/days) if days >= 365 else None
    if any(p["index"] is None for p in curve):
        warnings.append("TWR vượt giới hạn biểu diễn số; ẩn giá trị không hợp lệ. Kiểm tra NAV và dòng tiền đã nhập.")
    metrics = {
        "nav": ordered[-1]["nav"], "twr_pct": index-100 if daily and index is not None else None,
        "xirr_pct": xirr(flows),
        "cagr_pct": annual_index-100 if annual_index is not None else None,
        "current_drawdown_pct": drawdowns[-1], "max_drawdown_pct": min(drawdowns),
        "underwater_days": (end-peak_date).days if drawdowns[-1] < -1e-10 else 0,
        "longest_drawdown_days": max_duration,
        "benchmark_return_pct": curve[-1]["benchmark_index"]-100 if benchmark_ok and daily else None,
        "active_return_pp": index-curve[-1]["benchmark_index"] if benchmark_ok and daily and index is not None else None,
        "sharpe": None, "sortino": None, "volatility_pct": None,
        "observations": len(ordered), "daily_series_complete": regular,
        "net_pnl_vnd": ordered[-1]["nav"]-ordered[0]["nav"]-sum(s["external_flow"] for s in ordered[1:]),
    }
    if regular and len(daily) >= 20:
        sigma, downside = stdev(excess), sqrt(mean(min(0, r)**2 for r in excess))
        metrics.update(sharpe=mean(excess)/sigma*sqrt(252) if sigma > 1e-12 else None,
                       sortino=mean(excess)/downside*sqrt(252) if downside > 1e-12 else None,
                       volatility_pct=stdev(daily)*sqrt(252)*100)
    else:
        warnings.append("Sharpe/Sortino năm hóa cần tối thiểu 20 khoảng lợi nhuận phiên ngày đầy đủ; CAGR cần tối thiểu 365 ngày.")
    attributed = sum(groups["ticker"].values())
    return {"status": "ok", "as_of": ordered[-1]["trade_date"], "start_date": ordered[0]["trade_date"],
            "benchmark_name": ordered[-1]["benchmark_name"], "curve": curve, "metrics": metrics,
            "periods": {key: [{"period": period, "return_pct": value-100 if (value := _growth_index(growth)) is not None else None} for period, growth in values.items()] for key, values in periods.items()},
            "attribution": {key: [{"name": name, "pnl_vnd": value} for name, value in sorted(values.items(), key=lambda x: -x[1])] for key, values in groups.items()},
            "unattributed_pnl_vnd": metrics["net_pnl_vnd"]-attributed,
            "warnings": warnings,
            "methodology": "NAV sau phí/thuế và cổ tức; dòng tiền ngoài danh mục cuối ngày. TWR liên kết các kỳ NAV; XIRR năm hóa theo ngày thực tế. Giá và tiền: VND. Hiệu suất toàn danh mục không chịu bộ lọc tín hiệu."}


def _correlation(x, y):
    if len(x) < 20:
        return None
    mx, my = mean(x), mean(y)
    numerator = sum((a-mx)*(b-my) for a,b in zip(x,y))
    denominator = sqrt(sum((a-mx)**2 for a in x)*sum((b-my)**2 for b in y))
    return max(-1, min(1, numerator/denominator)) if denominator > 1e-12 else None


def build_market_risk(snapshots: list[dict], guardrails: dict, policy: dict | None = None, *, today: date | None = None) -> dict:
    policy = RiskPolicy.model_validate(policy or {}).model_dump()
    performance = build_fund_performance(snapshots, policy)
    if not snapshots:
        return {"status": "empty", "positions": [], "policy": policy, "alerts": [], "pause_recommended": True}
    ordered = sorted(snapshots, key=lambda s: s["trade_date"])
    latest = ordered[-1]
    today = today or datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()
    age = (today-date.fromisoformat(latest["trade_date"])).days
    by = {key: defaultdict(float) for key in ("ticker", "sector", "sleeve")}
    targets = {key: defaultdict(float) for key in by}
    unknown_targets = {key: set() for key in by}
    rows, alerts = [], []
    invalid_growth = any(point["index"] is None for point in performance["curve"])
    if invalid_growth:
        alerts.append("Chuỗi NAV/dòng tiền tạo TWR vượt giới hạn số; cần đối chiếu trước khi duyệt phân bổ.")
    nav = latest["nav"]
    for h in latest["holdings"]:
        if h["quantity"] <= 0:
            continue
        value = h["quantity"]*h["price"]
        weight = value/nav*100
        target = h.get("target_weight_pct")
        stop_risk = h["quantity"]*max(0, h["price"]-h["stop_price"])/nav*100 if h.get("stop_price") else None
        row = {**h, "market_value": value, "weight_pct": weight,
               "deviation_pp": weight-target if target is not None else None,
               "stop_risk_pct": stop_risk,
               "risk_budget_exceeded": stop_risk is not None and h.get("risk_budget_pct") is not None and stop_risk > h["risk_budget_pct"]}
        rows.append(row)
        if row["risk_budget_exceeded"]:
            alerts.append(f'{h["ticker"]}: rủi ro đến stop vượt ngân sách vị thế.')
        if h.get("stop_price") and h["price"] <= h["stop_price"]:
            alerts.append(f'{h["ticker"]}: giá đã chạm hoặc thấp hơn stop.')
        for key in by:
            by[key][h[key]] += weight
            if target is None:
                unknown_targets[key].add(h[key])
            else:
                targets[key][h[key]] += target
    breakdown = {}
    breach = False
    for key, values in by.items():
        breakdown[key] = []
        for name, weight in sorted(values.items(), key=lambda item: -item[1]):
            cap = guardrails.get(f'{name.lower()}_hard_cap') if key == "sleeve" else guardrails.get(f'{key}_cap')
            cap = cap*100 if cap is not None else None
            above = cap is not None and weight > cap+1e-9
            breach |= above
            target = None if name in unknown_targets[key] else targets[key][name]
            breakdown[key].append({"name": name, "weight_pct": weight, "target_weight_pct": target,
                                   "cap_pct": cap, "excess_pp": max(0,weight-cap) if cap is not None else None,
                                   "deviation_pp": weight-target if target is not None else None})
            if above:
                alerts.append(f'{name}: tỷ trọng {weight:.2f}% vượt trần {cap:.2f}%.')
    exposure = sum(by["ticker"].values())
    if exposure > guardrails["total_exposure_cap"]*100+1e-9:
        breach = True
        alerts.append("Exposure thị trường vượt trần tổng.")
    dd = abs(performance["metrics"]["current_drawdown_pct"])
    if dd >= policy["warning_drawdown_pct"]:
        alerts.append(f'Drawdown hiện tại {dd:.2f}% đã chạm ngưỡng cảnh báo.')
    stale = age > policy["max_nav_age_days"]
    if stale:
        alerts.append(f'NAV đã cũ {age} ngày; cập nhật trước khi duyệt phân bổ mới.')
    biggest_sector = max(by["sector"], key=by["sector"].get, default=None)
    scenarios = []
    for label, affected, shock in [("Toàn thị trường", exposure, policy["market_shock_pct"]),
                                   (f'Ngành lớn nhất: {biggest_sector or "—"}', by["sector"].get(biggest_sector,0), policy["sector_shock_pct"])]:
        loss_pct = affected*shock/100
        scenarios.append({"name": label, "shock_pct": shock, "nav_impact_pct": loss_pct,
                          "pnl_vnd": nav*loss_pct/100, "stressed_nav": nav*(1+loss_pct/100)})
    # Pairwise actual total-return observations, never synthetic zeros for missing data.
    histories = defaultdict(dict)
    for s in ordered[-120:]:
        ticker_returns = defaultdict(list)
        for h in s["holdings"]:
            if h.get("total_return_pct") is not None:
                ticker_returns[h["ticker"]].append(h["total_return_pct"])
        for ticker, values in ticker_returns.items():
            if max(values)-min(values) < 1e-9:
                histories[ticker][s["trade_date"]] = values[0]
        # RF/EMA correlations use accounting P/L / prior sleeve value, excluding changes in capital.
    sleeve_histories = defaultdict(dict)
    window = ordered[-121:]
    for prev, current in zip(window, window[1:]):
        if prev["trade_date"] >= current["trade_date"] or _business_gap(date.fromisoformat(prev["trade_date"]), date.fromisoformat(current["trade_date"])) != 1:
            continue
        for sleeve in ("RF", "EMA"):
            holdings = [h for h in current["holdings"] if h["sleeve"] == sleeve]
            prior_value = sum(h["quantity"]*h["price"] for h in prev["holdings"] if h["sleeve"] == sleeve)
            if holdings and prior_value > 0 and all(h.get("daily_pnl") is not None for h in holdings):
                sleeve_histories[sleeve][current["trade_date"]] = sum(h["daily_pnl"] for h in holdings)/prior_value
    pairs = []
    symbols = sorted(by["ticker"], key=by["ticker"].get, reverse=True)[:10]
    for i, first in enumerate(symbols):
        for second in symbols[i+1:]:
            dates = sorted(set(histories[first]) & set(histories[second]))
            pairs.append({"pair": f'{first} / {second}', "observations": len(dates),
                          "correlation": _correlation([histories[first][d] for d in dates], [histories[second][d] for d in dates])})
    common = sorted(set(sleeve_histories["RF"]) & set(sleeve_histories["EMA"]))
    pairs.append({"pair": "RF / EMA (P&L)", "observations": len(common),
                  "correlation": _correlation([sleeve_histories["RF"][d] for d in common], [sleeve_histories["EMA"][d] for d in common])})
    return {"status": "ok", "as_of": latest["trade_date"], "age_days": age, "stale": stale,
            "nav": nav, "cash_pct": latest["cash"]/nav*100, "exposure_pct": exposure,
            "top5_weight_pct": sum(sorted(by["ticker"].values(), reverse=True)[:5]),
            "current_drawdown_pct": -dd, "positions": rows, "breakdown": breakdown,
            "scenarios": scenarios, "correlations": pairs, "alerts": alerts, "policy": policy,
            "pause_recommended": invalid_growth or stale or breach or dd >= policy["pause_drawdown_pct"],
            "methodology": "Tỷ trọng theo NAV cuối ngày đã nhập. Stress là cú sốc giá tức thời, chưa gồm trượt giá. Rủi ro stop không bảo đảm mức lỗ tối đa. Tương quan cần ≥20 quan sát chung; tối đa 120 phiên và 10 mã lớn nhất."}
