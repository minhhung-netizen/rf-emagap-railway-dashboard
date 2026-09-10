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

The Portfolio Gate monitor distinguishes two exposures: **rebalance-recommended
exposure** counts only open positions whose ticker appears in the latest list
for that position's own RF or EMA strategy; **active gate exposure** counts every open gate
position for hard caps. A holding outside the latest recommendation is therefore
not presented as currently recommended, but it still consumes the gate's ticker,
sector, sleeve, and total-exposure limits until its sell signal is received.

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

Every new allocation is rejected when it would exceed the latest snapshot's
total-exposure, ticker, sector, RF-sleeve, or EMA-sleeve limit. Duplicate
signals are also rejected. The webhook response returns the accepted
classification or rejection reason; the **RF + EMA Monitor** and **Logs** tabs
show the same result. Signals from before this gate version are marked
`Legacy` and do not consume the new gate's exposure.

## Publish a local RF + EMA snapshot

From the `Tradingview backtest` project, run:

```powershell
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
