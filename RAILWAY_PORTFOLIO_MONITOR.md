# Railway: TradingView signals + RF/EMA portfolio benchmark

This branch is designed for one Railway service running the existing FastAPI
dashboard. The service receives TradingView alerts, applies the dashboard's
existing duplicate/confirmation filters, and shows the most recently published
RF Stock MTF + EMA Gap backtest snapshot as a paper-trading benchmark.

It does not place broker orders. A signal appearing in the dashboard is not a
recommendation or an automated order.

## Architecture

```text
TradingView alert -- WEBHOOK_SECRET --> /webhook --> dashboard filters --> signal monitor

Local RF + EMA backtest -- BACKTEST_INGEST_TOKEN --> /api/portfolio-backtests/import
                                                  --> portfolio monitor baseline
```

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
parameter. The dashboard continues to classify signals, reject duplicates, and
reject confirmation signals that do not have the required base position.

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
