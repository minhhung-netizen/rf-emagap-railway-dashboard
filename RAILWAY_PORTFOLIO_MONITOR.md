# Railway: TradingView signals + RF/EMA portfolio benchmark

This branch is designed for one Railway service running the existing FastAPI
dashboard. The service receives TradingView alerts through an RF + EMA
portfolio gate, then shows the most recently published RF Stock MTF + EMA Gap
backtest snapshot as its paper-trading benchmark.

It does not place broker orders. A signal appearing in the dashboard is not a
recommendation or an automated order.

## Architecture

```text
TradingView alert -- WEBHOOK_SECRET --> /webhook --> RF + EMA portfolio gate --> signal monitor

Local RF + EMA backtest -- BACKTEST_INGEST_TOKEN --> /api/portfolio-backtests/import
                                                  --> portfolio monitor baseline
```

The Portfolio Gate monitor distinguishes **rebalance-managed exposure** from
all tracked positions. Only open positions whose ticker appears in the latest
list for their own RF or EMA sleeve count toward the total, ticker, sector and
sleeve caps. Signals outside the matching list are still accepted and tracked
in Positions, even when the total tracked allocation exceeds a gate cap. If
there is no valid rebalance list, the gate tracks positions without applying
rebalance caps. Validation, duplicate detection and position matching still
apply to every signal. See [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md).

In **Performance**, the signal report can be switched between all gate signals
and matching ticker/strategy pairs in the latest rebalance. The switch changes its metrics, equity
curve, strategy rows, and closed-trade history together. The rebalance scope is
intentionally labelled as current-snapshot membership; it is not a historical
reconstruction of which list contained a ticker on the original entry date.

The two credentials must be different. The importer accepts the token only in
the `X-Backtest-Ingest-Token` header so it cannot be exposed in a Pine alert
body.

## Railway configuration

`railway.json` already starts Uvicorn on Railway's injected `$PORT`. Create a
Railway project from this repository/branch, generate a public domain, attach a
Volume at `/data`, then set these service variables:

```text
DATABASE_PATH=/data/signals.db
WEBHOOK_SECRET=<a-long-random-value>
BACKTEST_INGEST_TOKEN=<a-second-long-random-value>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<a-strong-password>
SESSION_DAYS=30
```

Keep this deployment to one application replica while it uses SQLite. The
mounted Volume preserves `/data/signals.db` across deployments. Move to a
server database such as PostgreSQL before enabling multiple replicas.

After deploy, test:

```text
https://<your-domain>/health
```

## TradingView alert setup

Use the existing signal/Pine alert body and change only the webhook URL to:

```text
https://<your-domain>/webhook
```

Include `WEBHOOK_SECRET` as the existing `secret` property or `?secret=` query
parameter. This edition accepts stock `buy`, `sell`, `confirm_buy`, and
`confirm_sell` signals only. Derivatives, DCA plans, Kelly allocation, and
manual positions are deliberately retired from its live operation.

The **Performance** tab reports only signals accepted by this portfolio gate;
historical `Legacy` signals are excluded. The **Dividends** tab remains
available for event entry and calendar monitoring, but ex-date alerts are
limited to tickers with a gate-approved open position.

The gate classifies a new `buy` as `RF` when the strategy name contains `rf`,
or `EMA` when it contains `ema` or `gap`. You can override this with `sleeve`.
It obtains the sector from the bundled VN alert-universe map or an explicit
`sector` property. A signal may include `allocation_pct`; absent that field,
the dashboard uses `DEFAULT_SIGNAL_WEIGHT_PCT` (5 by default).

```json
{
  "ticker": "HOSE:VPB",
  "action": "buy",
  "price": "19.50",
  "timeframe": "D",
  "strategy": "RF Stock MTF",
  "allocation_pct": 5,
  "secret": "<WEBHOOK_SECRET>"
}
```

For a confirmation, provide the base position strategy. The confirmation can
only top up a base position previously accepted by the portfolio gate:

```json
{
  "ticker": "HOSE:VPB",
  "action": "confirm_buy",
  "strategy": "EMA confirmation",
  "base_strategy": "RF Stock MTF",
  "allocation_pct": 5,
  "secret": "<WEBHOOK_SECRET>"
}
```

New allocations in the matching rebalance list are rejected when they would
exceed the latest snapshot's total-exposure, ticker, sector, RF-sleeve, or
EMA-sleeve limit. Duplicate signals are also detected. The webhook response returns the accepted
classification or rejection reason; the **RF + EMA Monitor** and **Logs** tabs
show the same result. Signals from before this gate version are marked
`Legacy` and do not consume the new gate's exposure.

## Publish a local RF + EMA snapshot

From the `Tradingview backtest` project, launch TradingView through the repository launcher before refreshing EMA Gap. Do not open it from the Start Menu or use port `9222` on this machine.

```powershell
npm.cmd run tv -- launch --port 9223
$env:TV_CDP_PORT = "9223"
npm.cmd run tv -- status
npm.cmd run tv -- layout switch "EMAgap Stock"
npm.cmd run tv -- state
```

Continue only when `status` reports `cdp_connected: true` and the `studies` list includes `EMA Gap`. If the loaded study is `RF Stock Rebalance`, switch the layout again. Do not close TradingView or change its chart/layout while a scan is running. The complete recovery and refresh procedure is in [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md#lam-moi-ema-gap-qua-tradingview-cdp).

Then run:

```powershell
npm.cmd run emagap:refresh
npm.cmd run rf:emagap:combined
npm.cmd run rf:dashboard:export

$env:DASHBOARD_URL = "https://<your-domain>"
$env:BACKTEST_INGEST_TOKEN = "<the Railway BACKTEST_INGEST_TOKEN value>"
npm.cmd run rf:dashboard:publish
```

Sign in as an administrator, then open **RF + EMA Monitor**. For read-only
accounts, enable the **RF + EMA Monitor** feature in the existing admin user
permissions screen.

## Operating rule

Treat the production candidate as a benchmark for monitoring, not as a static
promise of returns. Publish a fresh snapshot after an approved walk-forward
rerun, compare it with the prior report and live-paper outcomes, and record
why any portfolio constraints changed before allowing a new candidate to become
the paper-trading baseline.
