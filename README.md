# TradingView VN Signals Dashboard

RF + EMA portfolio gate for receiving TradingView webhook alerts, storing
approved stock signals in SQLite, enriching Vietnamese tickers with `vnstock`
in the background, and showing a local monitoring dashboard.

For the Railway-ready RF Stock MTF + EMA Gap monitoring flow, see
[RAILWAY_PORTFOLIO_MONITOR.md](RAILWAY_PORTFOLIO_MONITOR.md). It keeps live
TradingView alerts and locally computed portfolio backtest snapshots separated
by different credentials. This Railway edition retires live DCA/Kelly/manual
allocation and derivatives features so that one controlled portfolio-gate
policy decides whether an alert is accepted.

## Stack

- Backend: FastAPI
- Database: SQLite
- Data enrichment: `vnstock` when available, graceful fallback when unavailable
- Frontend: Static HTML, CSS, and JavaScript served by FastAPI

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Open the dashboard at:

```text
http://127.0.0.1:8000
```

Webhook requests return quickly. Price-history enrichment runs as a FastAPI background task and appears on the dashboard after the next refresh. When configured, FireAnt supplies daily OHLCV history and dividend-event notes, DNSE supplies the latest matched price, and VNStock remains the automatic fallback.

## FireAnt daily OHLCV and dividend events

Create a FireAnt OAuth access token with the `symbols-read` scope, then add these
Railway service variables:

```text
FIREANT_ACCESS_TOKEN=your-oauth-access-token
FIREANT_BASE_URL=https://api.fireant.vn
FIREANT_CACHE_TTL_MINUTES=240
FIREANT_MIN_REQUEST_INTERVAL_SECONDS=1
```

FireAnt daily OHLCV comes from `/symbols/{symbol}/historical-quotes`. Dated
dividend notes come from `/symbols/{symbol}/timescale-marks` and are synchronized
into the dashboard dividend calendar without creating duplicates. FireAnt's
dated marks do not contain structured cash amounts or stock ratios, so imported
events are informational only. Add a complete dividend event manually when
automatic entry-price adjustment is required.

## DNSE market data

Create these Railway service variables using the API Key and API Secret issued
for your DNSE LightSpeed API registration:

```text
DNSE_API_KEY=your-api-key
DNSE_API_SECRET=your-api-secret
DNSE_BASE_URL=https://openapi.dnse.com.vn
DNSE_API_VERSION=2026-05-07
```

Do not place real credentials in `.env.example` or commit them to Git. After
Railway redeploys, `/api/settings` reports
`"market_data_provider":"fireant+dnse"` when both clients initialized
successfully. If FireAnt history is unavailable, the dashboard falls back to
DNSE history and then VNStock.

Open-position prices refresh every 120 minutes during configured market sessions.
By default this uses Vietnam time with `09:00-11:30,13:00-15:00`.
Change these values in `.env` if needed:

```powershell
PRICE_REFRESH_MINUTES=120
MARKET_SESSIONS=09:00-11:30,13:00-15:00
VNSTOCK_CACHE_TTL_MINUTES=240
VNSTOCK_MIN_REQUEST_INTERVAL_SECONDS=4
VNSTOCK_LOOKBACK_DAYS=90
VNSTOCK_INCLUDE_METRICS=false
```

The default `vnstock` settings are intentionally conservative for the free tier:
each ticker is cached for 4 hours, calls are spaced by at least 4 seconds, and
fundamental metrics are skipped unless explicitly enabled.

## Performance Tracking

The dashboard pairs and reports signals separately by `ticker` and `strategy`:

- `buy` opens one long position.
- The next `sell` for the same ticker and strategy closes that position.
- Extra `buy` signals while a position is already open are ignored for performance math.
- Open positions use the latest enriched close price when available, otherwise the latest signal price.

Use this API to inspect strategy performance:

```text
http://127.0.0.1:8000/api/performance
```

Filter by ticker:

```text
http://127.0.0.1:8000/api/performance?ticker=VPB
```

Filter by strategy:

```text
http://127.0.0.1:8000/api/performance?strategy=manual-test
```

The dashboard also includes ticker and strategy filters plus sort controls in the Strategy Performance panel.

## VN30 Derivatives Tracking

VN30 futures events are stored and calculated separately from stock signals. The
dashboard supports:

- `long_start` and `short_start` to open a position.
- `dca_long` and `dca_short` to add contracts and recalculate average price.
- `close_long` and `close_short` to close the full position.
- Enter and persist derivative initial capital from the VN30 derivatives tab.
- Track current equity and maximum drawdown from closed trades and hidden price marks.
- Derivative performance includes total P/L, total return, winning-trade rate,
  profit factor, and an equity/drawdown chart. Hidden `mark` events contribute
  to historical equity drawdown without appearing in the event table.
- P/L in VN30 points and VND using `DERIVATIVE_CONTRACT_MULTIPLIER`.

Derivative payloads must include `"asset_type":"derivative"` so they are routed
away from the stock performance engine.

The integrated Pine Script is available at:

```text
pinescript/vn30_modern_dca_dashboard.pine
```

In TradingView, create one strategy alert:

- Condition: the VN30 Modern DCA strategy.
- Trigger: Order fills only. Select "Order fills and alert() function calls"
  when the optional open-position price updates are enabled.
- Webhook URL: `https://your-dashboard-domain/webhook`
- Message: `{{strategy.order.alert_message}}`

Example derivative webhook:

```json
{
  "asset_type": "derivative",
  "market": "VN30F",
  "ticker": "HNX:VN30F1M",
  "action": "long_start",
  "price": "1320.5",
  "quantity": "1",
  "contract_multiplier": "100000",
  "timeframe": "5",
  "strategy": "VN30 Modern DCA",
  "time": "2026-06-09T09:00:00+07:00",
  "reason": "Long Start",
  "secret": "change-me"
}
```

Inspect the separated derivative data at:

```text
http://127.0.0.1:8000/api/derivatives
```

## Open Positions And Chart Markers

The dashboard includes an Open Positions table for active `buy` signals that have not yet received a matching `sell`.
Candlestick charts show Buy/Sell markers from stored webhook signals.

## Closed Trades, Equity Curve, And Invalid Signal Log

- Closed Trades lists completed `buy -> sell` trades with entry, exit, return, and exit time.
- Equity Curve compounds closed-trade returns from a starting value of 100.
- Invalid Signal Log shows ignored webhook duplicates and derived invalid signals, such as a `sell` without an open `buy`.

Inspect duplicate webhook logs directly:

```text
http://127.0.0.1:8000/api/invalid-signals
```

## Duplicate Signals

Duplicate webhook alerts are ignored. A signal is considered duplicate when it has the same ticker, action, timeframe, strategy, and:

- the same TradingView `time` value, when present; or
- no `time` value and it arrives within `DUPLICATE_WINDOW_MINUTES`.

Configure the fallback window in `.env`:

```powershell
DUPLICATE_WINDOW_MINUTES=5
```

## TradingView Alert Body

Use this JSON body in the TradingView alert message. If `WEBHOOK_SECRET` is set, keep the same `secret` value here.

```json
{
  "ticker": "{{ticker}}",
  "action": "buy",
  "price": "{{close}}",
  "timeframe": "{{interval}}",
  "strategy": "RS Volume Breakout",
  "time": "{{time}}",
  "secret": "change-me"
}
```

TradingView may send symbols such as `HOSE:VPB`. The backend normalizes this to `VPB` before calling `vnstock`.

## Local Test Webhook

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/webhook" `
  -ContentType "application/json" `
  -Body '{"ticker":"HOSE:VPB","action":"buy","price":"19.5","timeframe":"1D","strategy":"manual-test","secret":"change-me"}'
```

## Public Webhook URL

For local testing with TradingView, expose the FastAPI server through ngrok:

```powershell
ngrok http 8000
```

Then put this URL into TradingView Webhook URL:

```text
https://your-ngrok-url/webhook
```

For a permanent setup, deploy the same FastAPI app to a small Ubuntu VPS and run it behind Nginx with HTTPS.

## Admin And Read-Only Users

The dashboard has two account roles:

- `admin`: can edit data, manage users, and choose which dashboard sections each user can view.
- `user`: read-only and can only view the sections assigned by an admin.

Set the initial admin account through environment variables before the first deployment:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
SESSION_DAYS=30
```

On Railway, add these values under the service's **Variables** tab, then redeploy. Sign in with the admin account and open the **Quản trị** tab to create users and configure their visible features.
When `ADMIN_PASSWORD` is explicitly set, redeploying also synchronizes the stored admin password with that variable.
