# Hướng dẫn RF + EMA Portfolio Gate Dashboard

Cập nhật: 27/09/2026. Tài liệu này mô tả bản Railway hiện tại. Khi chức năng thay đổi, cập nhật phần liên quan và [lịch sử hướng dẫn](#lich-su-huong-dan) trong cùng commit.

## 1. Phạm vi và nguồn dữ liệu

Dashboard nhận webhook TradingView, lưu tín hiệu cổ phiếu RF/EMA, theo dõi vị thế mở/đóng, hiển thị tín hiệu sớm, danh sách rebalance và thống kê hiệu suất. Quản trị viên có thể nhập giao dịch thực, NAV cuối ngày, chính sách rủi ro và phân ngành. Dữ liệu nằm trong SQLite; FastAPI phục vụ web và API. Dashboard không đặt lệnh tại công ty chứng khoán.

| Nguồn | Ý nghĩa | Nơi xem |
| --- | --- | --- |
| Webhook TradingView | Tín hiệu chiến lược, chưa phải lệnh đã khớp | Tổng quan, Vị thế, Hiệu suất tín hiệu, Nhật ký |
| Snapshot backtest/rebalance | Danh sách RF/EMA hiện hành và các ngưỡng Gate | RF + EMA Monitor, Quy trình vận hành |
| Sổ giao dịch và NAV | Giao dịch thực/giá trị tài khoản đã đối chiếu do admin nhập | Quản trị, Hiệu suất NAV, rủi ro ở Tổng quan |

Tín hiệu sớm không tự xác nhận lệnh mua. Thống kê tín hiệu và hiệu suất NAV dùng nguồn số liệu khác nhau.

## 2. Bắt đầu nhanh

1. Đặt `ADMIN_PASSWORD`, `WEBHOOK_SECRET`, `BACKTEST_INGEST_TOKEN` bằng ba giá trị riêng và cấu hình `DATABASE_PATH` ở nơi lưu bền vững.
2. Khởi động ứng dụng, kiểm tra `/health`, đăng nhập tài khoản admin.
3. Trỏ alert TradingView tới `https://<domain>/webhook`; gửi `WEBHOOK_SECRET` trong body hoặc query `secret`.
4. Công bố snapshot RF + EMA tới `/api/portfolio-backtests/import` bằng header `X-Backtest-Ingest-Token`.
5. Kiểm tra ngày snapshot, danh sách RF/EMA ở **RF + EMA Monitor**; xem **Vị thế** và **Nhật ký** sau mỗi phiên.
6. Nếu dùng NAV thực, nhập giao dịch/giá kiểm chứng qua **Quản trị → Sổ giao dịch**, hoặc nhập NAV đã đối chiếu qua **Quản trị → NAV cuối ngày**.

Thiếu snapshot rebalance thì vị thế vẫn được theo dõi, nhưng Gate chưa áp trần theo danh sách. Danh sách chỉ có RF sẽ chỉ quản lý RF; EMA vẫn được theo dõi cho tới khi có danh sách EMA hợp lệ.

## 3. Cài đặt cục bộ

Tại thư mục dự án trên Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
$env:DATABASE_PATH = "data/signals.db"
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "<mat-khau-manh>"
$env:WEBHOOK_SECRET = "<webhook-secret>"
$env:BACKTEST_INGEST_TOKEN = "<ingest-token-rieng>"
python -m uvicorn app.main:app --reload
```

Mở `http://127.0.0.1:8000` và kiểm tra `http://127.0.0.1:8000/health`. `.env.example` liệt kê biến mẫu. Muốn ứng dụng tự đọc file `.env` cần cài thêm `python-dotenv`; bản cài mặc định đọc biến môi trường của tiến trình. Không đưa `.env`, cookie hay mật khẩu thật vào Git.

```powershell
python -m unittest discover -s tests
node --check app/static/app.js
node --check app/static/fund-analytics.js
node --check app/static/trade-ledger.js
```

## 4. Railway và Git

`railway.json` chạy Uvicorn qua `$PORT`. Tạo service từ repository triển khai `minhhung-netizen/rf-emagap-railway-dashboard`, gắn Railway Volume tại `/data`, dùng một replica khi còn SQLite. Biến tối thiểu:

```text
DATABASE_PATH=/data/signals.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<mat-khau-manh>
WEBHOOK_SECRET=<webhook-secret>
BACKTEST_INGEST_TOKEN=<ingest-token-rieng>
SESSION_DAYS=30
```

Hai token không dùng chung. `ADMIN_PASSWORD` được đồng bộ với admin khi biến này được khai báo và service khởi động lại. Sau deploy, kiểm tra `/health`, đăng nhập, ngày snapshot, vị thế và giá. GitHub nối Railway kích hoạt build khi `main` của repository triển khai có commit mới; cần xem trạng thái deploy và kiểm tra dữ liệu SQLite sau build.

Trong checkout hiện tại, remote triển khai là `railway-dashboard`; `origin` trỏ tới repository `Dashboard` khác. Sau khi sửa và kiểm tra:

```powershell
git status
git add DASHBOARD_GUIDE.md
git commit -m "Update dashboard guide"
git push railway-dashboard HEAD:main
```

Ví dụ trên dành cho lần chỉ sửa hướng dẫn. Khi sửa chức năng, thêm cả file code đã đổi vào lệnh `git add`, rồi commit cùng `DASHBOARD_GUIDE.md`. Xem thêm [RAILWAY_PORTFOLIO_MONITOR.md](RAILWAY_PORTFOLIO_MONITOR.md).

## 5. Biến cấu hình và dữ liệu thị trường

| Biến | Mặc định | Tác dụng |
| --- | --- | --- |
| `DATABASE_PATH` | `data/signals.db` | Đường dẫn SQLite; Railway dùng `/data/signals.db` |
| `WEBHOOK_SECRET` | không bắt buộc | Xác thực webhook; phải đặt khi public |
| `BACKTEST_INGEST_TOKEN` | không bắt buộc | Xác thực API nhập snapshot; phải đặt nếu dùng rebalance |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | `admin`, `change-me` | Tài khoản admin ban đầu; đổi trước khi public |
| `PRICE_REFRESH_MINUTES` | `120` | Chu kỳ làm mới giá trong giờ thị trường |
| `MARKET_SESSIONS` | `09:00-11:30,13:00-15:00` | Phiên theo giờ Việt Nam |
| `VNSTOCK_MAX_REQUESTS_PER_MINUTE` | `19` | Giới hạn cứng tối đa 19 yêu cầu/phút |
| `VNSTOCK_MIN_REQUEST_INTERVAL_SECONDS` | `4` | Khoảng cách tối thiểu giữa các yêu cầu |
| `VNSTOCK_CACHE_TTL_MINUTES` | `240` | Cache theo mã |
| `VNSTOCK_LOOKBACK_DAYS` | `90` | Độ dài lịch sử giá |
| `VNSTOCK_INCLUDE_METRICS` | `false` | Chỉ số cơ bản bổ sung |
| `DUPLICATE_WINDOW_MINUTES` | `5` | Cửa sổ phát hiện trùng khi thiếu `time` |
| `DEFAULT_SIGNAL_WEIGHT_PCT` | `5` | Tỷ trọng mặc định khi thiếu `allocation_pct` |

VNStock là nguồn giá ưu tiên; nếu không có lịch sử hợp lệ, ứng dụng thử FireAnt rồi DNSE khi đã cấu hình `FIREANT_ACCESS_TOKEN`, `DNSE_API_KEY`, `DNSE_API_SECRET`. Các yêu cầu VNStock về giá, ngành và cổ tức dùng chung bộ giới hạn trong một tiến trình. Giá có thể cũ ngoài giờ thị trường, khi cache còn hiệu lực hoặc nhà cung cấp lỗi; kiểm tra nguồn và thời điểm cập nhật trước khi dùng.

## 6. TradingView và webhook

TradingView gửi `POST /webhook` với JSON. Giữ tên chiến lược gốc ở `strategy` để ghép vị thế; tên viết tắt trên giao diện chỉ để hiển thị. Ví dụ:

```json
{
  "ticker": "HOSE:VPB",
  "action": "buy",
  "price": 25000,
  "timeframe": "60",
  "strategy": "RF Stock MTF",
  "time": "2026-09-27T09:30:00+07:00",
  "allocation_pct": 5,
  "secret": "<WEBHOOK_SECRET>"
}
```

`HOSE:VPB` được chuẩn hóa thành `VPB`. Giá cổ phiếu `25000` VND được lưu dưới dạng `25` nghìn VND; `25` cũng được hiểu là 25 nghìn VND. Biểu mẫu NAV/sổ giao dịch nhập VND, ví dụ `25000`.

- `buy` mở vị thế; `sell` đóng vị thế cùng mã và chiến lược.
- `confirm_buy` cần `base_strategy` hoặc `confirm_for` trỏ tới vị thế base đang mở; `confirm_sell` là tín hiệu xác nhận thoát.
- `allocation_pct` là phần trăm, không phải tỷ lệ 0-1; thiếu trường này thì dùng mặc định.
- RF/EMA cần sleeve hợp lệ và ngành được ánh xạ. Nếu tên chiến lược không chứa `rf`, `ema` hay `gap`, truyền `sleeve` là `RF` hoặc `EMA`.
- `buy` cho mã đã có vị thế Gate bị từ chối để tránh trùng. Tín hiệu trùng mã/action/timeframe/strategy và cùng `time` bị bỏ qua; thiếu `time` dùng `DUPLICATE_WINDOW_MINUTES`.

Phản hồi có `status` như `accepted`, `rejected`, `duplicate`; lý do từ chối nằm ở **Nhật ký**. Webhook có thể trả HTTP 200 dù tín hiệu bị từ chối, nên cần đọc trường `status`.

**Tín hiệu sớm** Inertial RSI dùng `setup_bull`, `setup_bear`, `momentum_bull`, `momentum_bear`. Chúng nằm ở tab **Tín hiệu sớm**, không mở vị thế và không dùng exposure. Hiệu lực mặc định 30 ngày; `valid_for_days` hợp lệ từ 1 đến 180. Chỉ khi có `buy` RF/EMA được nhận cho cùng mã trong thời gian hiệu lực, tín hiệu sớm mới được đánh dấu khớp. Pine hiện có ở `pinescript/inertial_rsi_leading_dashboard.pine`.

Bản Railway này chỉ vận hành cổ phiếu RF/EMA và tín hiệu sớm. API DCA, Kelly, phân bổ thủ công, thống kê backtest nhập tay và phái sinh trả `410 Gone`. Mã frontend cũ còn trong repository không thuộc luồng vận hành hiện hành.

## 7. Rebalance và Portfolio Gate

Snapshot mới nhất nhập qua `POST /api/portfolio-backtests/import` với header `X-Backtest-Ingest-Token`. Payload gồm `source`, `report_date`, `title`, `research_status` (có mặc định), `generated_at` (tùy chọn) và `summary`. Danh sách ở `summary.attention_lists.rf.rows` và `summary.attention_lists.ema.rows`; mỗi dòng cần `ticker`. Báo cáo RF cũ có thể dùng `summary.attention_list.rows`. Cấu trúc tối thiểu:

```json
{
  "source": "rf-emagap-combined",
  "report_date": "2026-09-27",
  "title": "RF + EMA Gap Portfolio Monitor",
  "summary": {
    "attention_lists": {
      "rf": {"rows": [{"ticker": "VPB"}]},
      "ema": {"rows": [{"ticker": "FPT"}]}
    }
  }
}
```

Snapshot sản xuất cần thêm chỉ số backtest và guardrails do bộ xuất dữ liệu tạo. Quy trình publish từ dự án `Tradingview backtest` ở [hướng dẫn Railway](RAILWAY_PORTFOLIO_MONITOR.md).

**Phạm vi Gate:** chỉ vị thế có mã trong danh sách rebalance đúng RF/EMA sleeve được tính vào Exposure Gate, RF Gate hoặc EMA Gate. `buy`/`confirm_buy` của nhóm này phải tuân thủ trần tổng, mã, ngành và sleeve của snapshot, hoặc trần mặc định nếu thiếu guardrails. Mã ngoài danh sách vẫn được nhận và hiển thị trong **Vị thế theo dõi**, kể cả khi tổng tỷ trọng theo dõi vượt trần; chúng không tiêu hao trần Gate. Mã nằm trong EMA list nhưng vị thế thuộc RF vẫn là ngoài RF list. Không có danh sách hợp lệ thì Gate chỉ theo dõi, chưa áp trần theo rebalance.

Kiểm tra đầu vào vẫn áp dụng cho mọi webhook: secret, action/sleeve, ngành của `buy`, tỷ trọng, tránh vị thế trùng và điều kiện base cho confirmation. `sell` vị thế đang mở không bị chặn bởi trần mua. Ô **Vị thế theo dõi** đếm mọi vị thế Gate đang mở; ô **Exposure Gate (trong danh sách)** chỉ tính vị thế được rebalance chấp nhận. Snapshot mới có thể đưa vị thế cũ vào hoặc ra khỏi nhóm được quản lý.

## 8. Các tab

| Tab | Công việc chính |
| --- | --- |
| **Tổng quan** | Đếm tín hiệu, cảnh báo, biểu đồ giá, timeline theo mã; rủi ro NAV khi có NAV |
| **Tín hiệu sớm** | Inertial RSI, thời gian hiệu lực, trạng thái khớp `buy` RF/EMA |
| **Vị thế** | Vị thế Gate mở/đóng, giá, lợi nhuận ước tính, bộ lọc, đối chiếu rebalance |
| **Hiệu suất** | NAV/TWR/XIRR nếu có NAV; thống kê tín hiệu riêng với phạm vi toàn Gate hoặc rebalance mới nhất |
| **RF + EMA Monitor** | Snapshot backtest, exposure trong danh sách, số vị thế theo dõi, danh sách RF/EMA và trần |
| **Quy trình vận hành** | Lịch rebalance và các bước cập nhật snapshot; lệnh npm thuộc dự án backtest riêng |
| **Cổ tức** | Lịch quyền/cổ tức, nhập thủ công và kiểm tra mã đang mở |
| **Nhật ký** | Webhook trùng/bị từ chối cùng lý do |
| **Quản trị** | Sổ giao dịch, NAV, chính sách rủi ro, dữ liệu/sao lưu, tài khoản, nhóm ngành |

Tab **Quản trị** có 6 tab con, ghi nhớ tab đã chọn và hỗ trợ URL `#admin/ledger`, `#admin/nav`, `#admin/risk`, `#admin/data`, `#admin/users`, `#admin/sectors`. Có thể dùng phím mũi tên trái/phải và Home/End để chuyển tab con.

## 9. Quản trị dữ liệu thực

**Sổ giao dịch:** nhập nạp/rút, mua/bán thực khớp, cổ tức và phí theo sao kê; nhập giá đóng cửa kiểm chứng; đối chiếu rồi chốt NAV. Có thể liên kết với webhook nhưng webhook không tự thành giao dịch thật. Kỳ đã khóa không sửa trực tiếp qua giao diện. Xem [TRADE_LEDGER.md](TRADE_LEDGER.md).

**NAV cuối ngày:** nhập ngày, NAV, tiền mặt, phải thu/phải trả, dòng tiền ngoài danh mục, benchmark và holdings theo giá VND. NAV phải khớp `sum(quantity × price) + cash + receivables - liabilities`. Có thể thay snapshot cùng ngày khi đủ điều kiện; phiên bản cũ được lưu. Cần ít nhất hai ngày NAV để vẽ diễn biến. Xem [FUND_ANALYTICS.md](FUND_ANALYTICS.md).

**Chính sách rủi ro:** chỉnh ngưỡng drawdown, tuổi NAV, cú sốc giả định và công tắc tạm dừng phân bổ mới. Công tắc mặc định tắt. Khi bật và rủi ro NAV yêu cầu dừng, chỉ `buy`/`confirm_buy` thuộc rebalance đúng sleeve bị ghi `nav_risk_pause`; mã ngoài danh sách vẫn được theo dõi. `sell` vẫn được xử lý. NAV là giá trị cuối ngày, không phải realtime.

**Dữ liệu & sao lưu:** tải mẫu JSON NAV, nhập/xuất nhiều ngày và tải CSV/backup SQLite. File DB chứa dữ liệu nhạy cảm; lưu ở nơi bảo mật. Các nút CSV của module đã ngừng dùng có thể chỉ phản ánh dữ liệu lịch sử.

**Người dùng:** admin tạo tài khoản, cấp vai trò `admin`/`user`, chọn tab và chiến lược được xem, đổi mật khẩu, vô hiệu hóa tài khoản. `user` chỉ xem. Báo cáo NAV toàn danh mục không cấp cho tài khoản bị giới hạn chiến lược.

**Nhóm ngành:** cập nhật ngành thủ công hoặc tự điền từ VNStock. Ánh xạ thủ công được ưu tiên. Kiểm tra ngành trước khi nhận mã mới vì Gate dùng ngành cho trần của mã trong danh sách.

## 10. Kiểm tra sau phiên và xử lý lỗi

1. Kiểm tra **Tổng quan**, **Vị thế**, giá và tín hiệu đóng/mở.
2. Kiểm tra ngày snapshot cùng danh sách RF/EMA trong **RF + EMA Monitor**; nếu cũ, công bố lại từ dự án backtest.
3. Nếu TradingView gửi alert nhưng không có vị thế, xem **Nhật ký** và đối chiếu `ticker`, `time`, `strategy`, `base_strategy`, sleeve, ngành, lý do `duplicate_webhook`, `sector_not_mapped`, `ticker_cap`, `nav_risk_pause`...
4. Nếu giá cũ, kiểm tra nguồn, giờ giao dịch, cache và dùng nút cập nhật giá. VNStock được giới hạn dưới 20 yêu cầu/phút nên đồng bộ nhiều mã cần thời gian.
5. Nếu Railway chưa cập nhật, xem commit trên `main` của remote `railway-dashboard`, build/deploy log, biến môi trường, Volume và `/health`. Sao lưu DB trước khi đổi đường dẫn lưu trữ.

`/api/portfolio-gate` trả `state` của mọi vị thế Gate và `rebalance_recommended` của nhóm được quản lý; `/api/portfolio-backtests/latest` trả snapshot mới nhất; `/api/invalid-signals` trả log từ chối. API dashboard cần session đăng nhập. Webhook và importer dùng token riêng; không đưa token importer vào TradingView. `401` thường là thiếu/sai xác thực, `403` là thiếu quyền, `410` là API đã ngừng dùng.

## 11. Cập nhật hướng dẫn khi sửa chức năng

1. Sửa phần liên quan ở file này **trong cùng commit** với code. Mô tả thao tác người dùng thấy và điều kiện dữ liệu cần có.
2. Sửa ví dụ JSON, lệnh chạy, README và tài liệu chuyên đề khi hành vi cũ không còn đúng. Không giữ các khẳng định mâu thuẫn.
3. Ghi thay đổi vào lịch sử dưới đây; kiểm tra liên kết, lệnh minh họa và test phù hợp rồi commit/push đúng remote.

Quy ước này cũng nằm trong [AGENTS.md](AGENTS.md) để các lần làm việc bằng Codex tiếp theo tự cập nhật hướng dẫn.

## Lịch sử hướng dẫn

| Ngày | Thay đổi |
| --- | --- |
| 27/09/2026 | Tạo hướng dẫn chính cho bản Railway; làm rõ Gate quản lý rebalance đúng sleeve và vị thế ngoài danh sách vẫn được theo dõi. |
