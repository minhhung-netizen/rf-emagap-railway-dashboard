# Hướng dẫn RF + EMA Portfolio Gate Dashboard

Cập nhật: 13/10/2026. Tài liệu này mô tả bản Railway hiện tại. Khi chức năng thay đổi, cập nhật phần liên quan và [lịch sử hướng dẫn](#lich-su-huong-dan) trong cùng commit.

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

**Tín hiệu sớm** Inertial RSI dùng `setup_bull`, `setup_bear`, `momentum_bull`, `momentum_bear`. Chúng nằm ở tab **Tín hiệu sớm**, không mở vị thế và không dùng exposure. Hiệu lực mặc định 30 ngày; `valid_for_days` hợp lệ từ 1 đến 180, tính từ thời điểm phát hiện (`time`, hoặc thời điểm nhận nếu thiếu `time`), không phải ngày pivot. Pine hiện có ở `pinescript/inertial_rsi_leading_dashboard.pine`.

- Tab chỉ hiển thị tín hiệu còn hiệu lực, kể cả khi đã có `buy`, `confirm_buy` hoặc `sell` RF/EMA trong **Vị thế**. Các lệnh này không xóa hay gia hạn tín hiệu sớm.
- Tín hiệu chỉ rời tab khi đến thời điểm hết hạn hoặc xuất hiện tín hiệu sớm ngược chiều **cùng mã, chỉ báo (`strategy`) và khung thời gian**. Ví dụ `setup_bear` thay cho `setup_bull`; `momentum_bear` cũng kết thúc tín hiệu tăng trong cùng phạm vi. Tín hiệu cùng chiều không kết thúc tín hiệu cũ và mỗi tín hiệu giữ thời hạn riêng. Tín hiệu đã đổi chiều không tự xuất hiện lại nếu chiều cũ quay lại; chỉ tín hiệu mới được hiển thị.
- `buy` RF/EMA được nhận cùng mã trước khi hết hạn/đổi chiều sẽ được ghi **Đã khớp RF/EMA**, nhưng tín hiệu sớm vẫn còn trên tab. Liên hệ với lệnh mua này được giữ trong lịch sử hiệu suất, kể cả sau khi tín hiệu sớm hết hiệu lực.
- Chọn **Ngành** để lọc theo ánh xạ hiện tại trong **Quản trị → Nhóm ngành**, hoặc chọn **Chưa phân ngành**. Cột ngành và bộ lọc vẫn hoạt động với tài khoản chỉ có quyền xem Tổng quan/Tín hiệu sớm; không cần quyền Quản trị hay Vị thế. Bộ lọc ngành kết hợp với watchlist và chỉ áp dụng cho tín hiệu còn hiệu lực.
- Chọn **Tín hiệu** cạnh ô Ngành để lọc theo loại sự kiện đang có trong các tín hiệu còn hiệu lực của watchlist, ví dụ **Phân kỳ tăng**, **Phân kỳ giảm**, **RSI cắt lên 40** hoặc **RSI cắt xuống 60**. Danh sách loại không bị thu hẹp khi chọn ngành; kết quả phải đồng thời phù hợp cả ngành và loại tín hiệu. Chọn **Tất cả tín hiệu** để bỏ lọc loại. Lựa chọn giữ nguyên khi làm mới hoặc sắp xếp; nếu loại đã chọn không còn tín hiệu, bảng báo không có kết quả thay vì tự chuyển về tất cả.
- Nút mũi tên ở tiêu đề cột đổi sắp xếp tăng/giảm dần theo mã, ngành, sự kiện, khung, giá, ngày phát hiện/pivot, hiệu lực, trạng thái hoặc số ngày dẫn trước. Mặc định là ngày phát hiện mới nhất; ô thiếu dữ liệu luôn ở cuối. Bộ lọc và thứ tự đã chọn giữ nguyên khi dữ liệu tự làm mới. Bảng sử dụng toàn bộ chiều ngang và vùng xem lớn hơn, có cuộn ngang/dọc cùng cột mã cố định.
- Quản trị viên có nút thùng rác **Xóa** ghim ở cuối mỗi dòng. Nút yêu cầu xác nhận rồi xóa chính webhook tín hiệu sớm qua `DELETE /api/signals/{id}`; không xóa lệnh mua/bán RF/EMA. Xóa làm tính lại vòng hiệu lực và liên hệ lịch sử; xóa tín hiệu ngược chiều có thể khiến tín hiệu cũ chưa hết hạn xuất hiện lại. Không có khôi phục qua giao diện, nên sao lưu trước khi xóa dữ liệu cần giữ. Tài khoản chỉ xem không có nút xóa và API từ chối thao tác này.
- `/api/leading-signals` vẫn trả lịch sử đầy đủ: `is_active` cho biết còn hiển thị trên tab; `status` là `active`, `matched_rf`, `matched_ema`, `matched`, `expired` hoặc `reversed`. `sector` là ngành theo ánh xạ hiện tại, chuỗi rỗng nếu chưa có ngành. `reversed_at` và `reversed_by_signal_id` chỉ ra lần đổi chiều đầu tiên trong thời hạn; `matched_signal_id`, `matched_at` và `lead_days` giữ liên hệ lịch sử. `summary.active` đếm mọi tín hiệu còn hiệu lực, bao gồm đã khớp; `summary.matched` đếm nhóm đã khớp còn hiệu lực. Bộ đếm trên giao diện tính theo danh sách đang xem, có áp dụng bộ lọc watchlist, ngành và loại tín hiệu; khi đang lọc ngành hoặc loại, hiển thị số kết quả/tổng tín hiệu còn hiệu lực trong watchlist.

Bản Railway này chỉ vận hành cổ phiếu RF/EMA và tín hiệu sớm. API DCA, Kelly, phân bổ thủ công, thống kê backtest nhập tay và phái sinh trả `410 Gone`. Mã frontend cũ còn trong repository không thuộc luồng vận hành hiện hành.

## 7. Rebalance và Portfolio Gate

### Làm mới EMA Gap qua TradingView CDP

Mọi lần quét/làm mới EMA Gap phải mở TradingView bằng launcher của dự án `C:\Users\Minh Hung\Documents\Tradingview backtest`. Không mở TradingView từ Start Menu trước, không tự gọi `TradingView.exe --remote-debugging-port=...`, và không dùng cổng `9222` vì máy này dành cổng đó cho Lenovo Vantage.

Mở PowerShell mới và chạy lần lượt:

```powershell
cd "C:\Users\Minh Hung\Documents\Tradingview backtest"
npm.cmd run tv -- launch --port 9223

$env:TV_CDP_PORT = "9223"
npm.cmd run tv -- status
```

Launcher tự đóng phiên TradingView cũ, tìm ứng dụng TradingView Windows Store, khởi động với CDP tại cổng `9223` và chờ kết nối sẵn sàng. Chỉ tiếp tục khi kết quả `status` có `"success": true`, `"cdp_connected": true` và `target_url` là chart `https://vn.tradingview.com/chart/...`.

Sau khi TradingView hiện chart, nạp layout rồi kiểm tra chiến lược:

```powershell
npm.cmd run tv -- layout switch "EMAgap Stock"
npm.cmd run tv -- state
```

Trong `studies` phải có tên chứa `EMA Gap`. Nếu chỉ có `RF Stock Rebalance`, layout đang nạp sai; chưa chạy refresh vì chương trình sẽ báo `Loaded strategy mismatch`. Khi kiểm tra đúng, mới chạy:

```powershell
npm.cmd run emagap:refresh
```

Không đóng TradingView, đổi chart/layout hoặc chạy thêm một refresh trong lúc quét 89 mã. Nếu TradingView đã được mở sai cách hay CDP mất kết nối, chạy lại `npm.cmd run tv -- launch --port 9223`; launcher sẽ thay phiên cũ bằng phiên đúng.

### Chu kỳ RF và EMA không trùng nhau

RF Stock MTF chạy theo quý, EMA Gap chạy theo chu kỳ sáu tháng. Không chờ hai chiến lược chạy cùng lúc. Sau khi hoàn tất `rf:run` và `rf:research`, chạy lệnh sau để cập nhật riêng RF lên Railway:

```powershell
npm.cmd run rf:dashboard:publish-quarterly
```

Lệnh này thay danh sách rebalance RF trong snapshot local, giữ nguyên danh sách EMA gần nhất, rồi publish với `source` là `rf-stock-mtf-quarterly`. Nó dừng với lỗi nếu chưa có snapshot đầy đủ trước đó hoặc snapshot đó không có danh sách EMA, nhằm tránh làm trống Gate EMA. Đến kỳ EMA, chạy luồng đầy đủ: `emagap:refresh`, `emagap:cycle`, `rf:emagap:combined`, `rf:dashboard:export`, rồi `rf:dashboard:publish`.

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
| **Tín hiệu sớm** | Inertial RSI còn hiệu lực, lọc ngành và loại tín hiệu, sắp xếp theo cột, xóa từng tín hiệu (admin); giữ tín hiệu đã khớp `buy` RF/EMA, ẩn khi đổi chiều hoặc hết hạn |
| **Vị thế** | Vị thế Gate mở/đóng, giá, lợi nhuận ước tính, bộ lọc, đối chiếu rebalance |
| **Hiệu suất** | NAV/TWR/XIRR nếu có NAV; thống kê tín hiệu riêng với phạm vi toàn Gate hoặc rebalance mới nhất |
| **RF + EMA Monitor** | Snapshot backtest, exposure trong danh sách, số vị thế theo dõi, danh sách RF Stock MTF hiển thị trước EMA Gap Daily và trần |
| **Quy trình vận hành** | Lịch rebalance và chuỗi thao tác theo thứ tự CDP TradingView → RF → EMA Gap → publish snapshot → chốt rebalance → theo dõi; lệnh npm thuộc dự án backtest riêng |
| **Đối chiếu khớp lệnh** | Nhập Excel TCBS, giữ riêng cơ sở, theo dõi phần mua thêm và giá vốn gồm phí mua; cấu hình phí theo tài khoản và tính dải giá bán chia đều theo mục tiêu lợi nhuận ròng |
| **Cổ tức** | Lịch quyền/cổ tức, nhập thủ công và kiểm tra mã đang mở |
| **Nhật ký** | Webhook trùng/bị từ chối cùng lý do |
| **Quản trị** | Sổ giao dịch, NAV, chính sách rủi ro, dữ liệu/sao lưu, tài khoản, nhóm ngành |

Tab **Quản trị** có 6 tab con, ghi nhớ tab đã chọn và hỗ trợ URL `#admin/ledger`, `#admin/nav`, `#admin/risk`, `#admin/data`, `#admin/users`, `#admin/sectors`. Có thể dùng phím mũi tên trái/phải và Home/End để chuyển tab con.

### Đối chiếu khớp lệnh từ Excel

Admin mở **Đối chiếu khớp lệnh**, chọn báo cáo `.xlsx` theo mẫu **BÁO CÁO KẾT QUẢ KHỚP LỆNH** của TCBS, bấm xem trước rồi lưu. File tối đa 10 MB; ngày lấy từ dòng **Ngày giao dịch** trong báo cáo, không lấy ngày upload. Cần các cột **Giao dịch**, **Mã**, **Khối lượng khớp**, **Giá khớp bình quân**, **Giá trị khớp**. Các dòng cùng mã/chiều được cộng lại. File sai định dạng, thiếu ngày/tài khoản hoặc số liệu không hợp lệ bị từ chối trước khi lưu.

Đối ứng trong từng ngày: `đối ứng = min(SL mua, SL bán)`; `mua thêm ngày = max(SL mua - SL bán, 0)`. Phần mua thêm này được cộng vào tồn mua từ các phiên trước. Nếu bán lớn hơn mua trong ngày, phần chênh lệch bán được trừ vào tồn mua trước đó; chỉ phần bán vượt toàn bộ tồn mua được bỏ qua. Tồn mua không âm và phần bán vượt không đối trừ giao dịch mua của các ngày sau. Lịch sử hiển thị cả ngày mua và ngày bán để kiểm tra số dư cuối từng ngày. Các báo cáo đã nhập tự được tính lại theo quy tắc này, không cần upload lại.

**Cổ phiếu cơ sở:** sau khi nhập ít nhất một báo cáo để có tài khoản, chọn tài khoản rồi nhập **Mã** và **SL cơ sở (CP)**, bấm lưu. Cơ sở mặc định là 0 và được lưu riêng cho từng tài khoản/tiểu khoản, từng mã. Đây là lượng đã có sẵn từ trước ngày báo cáo đầu tiên, không phải ngưỡng cần tích lũy từ các giao dịch mới. Cơ sở được giữ riêng; chỉ phần mua thêm vượt cơ sở được tính giá vốn. Tổng SL theo dõi = **SL cơ sở + SL mua thêm còn lại**. Ví dụ CII cơ sở 10.000 CP: mua thêm 2.000 thì tổng theo dõi 12.000 và dư mua 2.000; bán 500 thì còn tổng 11.500 và dư mua 1.500; bán vượt 1.500 còn dư thì chỉ giảm dư mua về 0, giữ cơ sở 10.000. Phần bán vượt dư mua được ghi rõ là bỏ qua, không trừ cơ sở.

Thiết lập cơ sở áp dụng từ đầu lịch sử báo cáo của mã; đổi cơ sở chỉ thay đổi phần lượng cơ sở/tổng theo dõi, không biến các giao dịch mua đã nhập thành cơ sở và không tạo giá vốn cho cơ sở. Có thể thiết lập mã chưa có giao dịch trong tài khoản đã nhập; đặt 0 để bỏ phần cơ sở. Số lượng phải là số nguyên từ 0 đến 1.000.000.000.000. Giao diện hiển thị lượng cơ sở, mua thêm còn lại và tổng theo dõi riêng; giá vốn chỉ thuộc phần mua thêm còn lại.

Giá mua bình quân ngày = **tổng giá trị mua / tổng SL mua** (VND/cổ phiếu), ưu tiên giá trị khớp để tránh sai số do cột giá bình quân đã làm tròn. Giá mua gồm phí = `giá mua bình quân ngày × (1 + phí mua % / 100)`. Giá vốn mới của phần mua thêm = `(SL dư trước × giá vốn trước + mua thêm ngày × giá mua gồm phí) / (SL dư trước + mua thêm ngày)`. Khi phí mua bằng 0, ví dụ dư 100 cổ phiếu giá 10.000 VND; ngày sau mua 200 giá bình quân 12.000 VND và bán 50: cộng 150, dư 250 và giá vốn mới 11.200 VND. Ngày tiếp theo chỉ bán 80: dư còn 170, giá vốn bình quân vẫn 11.200 VND. Khi bán hết, giá vốn còn lại bằng 0 và giá bình quân để trống; lần mua tiếp theo bắt đầu giá vốn mới. Lượng cơ sở không tham gia phép tính bình quân này; phí bán không cộng vào giá vốn tồn mua.

**Phí theo tài khoản:** chọn đúng tài khoản/tiểu khoản rồi thiết lập **Phí mua (%)**, **Phí bán (%)** và khoản **Thuế/chi phí bán khác (%)** nếu cần. Các tỷ lệ tính trên giá trị khớp, nhận tối đa 6 chữ số thập phân, mỗi khoản từ 0 đến dưới 100%; tổng phí bán và khoản thuế/chi phí bán phải dưới 100%. Mặc định các khoản là 0 và có nhãn chưa cấu hình; hệ thống không tự suy mức phí/thuế từ mẫu Excel hoặc loại tài khoản. Admin lưu phí, tài khoản chỉ xem được đọc phí và tính gợi ý. Lưu hoặc đổi phí áp dụng cho toàn bộ lịch sử của tài khoản, tính lại tồn mua/giá vốn và làm hết hiệu lực gợi ý bán cũ. Phí mua chỉ phân bổ vào phần dư mua sau đối ứng cùng ngày; giá trị khớp và giá mua BQ gốc trong Excel giữ nguyên. Ví dụ giá mua 10.000 VND, phí mua tự nhập 0,15% thì giá vốn là 10.015 VND/CP. Đây là cấu hình tỷ lệ; cần nhập đủ các khoản thực tế để phép tính lợi nhuận phản ánh chi phí của tài khoản.

**Gợi ý giá bán chia nhỏ:** chọn mã còn dư mua vượt cơ sở, nhập số phần bán và **Lợi nhuận mục tiêu (%)** trên giá vốn đã gồm phí mua. Có thể nhập mức lợi nhuận cao hơn để tạo dải giá; để trống thì mọi phần dùng cùng mục tiêu tối thiểu. Lượng dư mua được chia đều theo cổ phiếu nguyên, chênh lệch giữa các phần tối đa 1 CP; số phần từ 1 đến 100 và không vượt lượng dư. Gợi ý dùng toàn bộ dư mua của mã trong tài khoản, không tính lượng cơ sở và không phụ thuộc bộ lọc ngày. Các phần đi từ mục tiêu thấp đến cao; nếu chỉ có một phần thì dùng mục tiêu tối thiểu. Mục tiêu cho phép từ 0 đến 10.000% để tính kịch bản, không phải dự báo thị trường.

Công thức giá bán tối thiểu cho mỗi mức lợi nhuận `r`: `giá vốn BQ × (1 + r/100) / (1 - (phí bán % + thuế/chi phí bán khác %)/100)`. Làm tròn **lên** theo **Bước làm tròn giá (VND)** đã nhập (mặc định 100), rồi tính lại tiền bán gộp, phí bán, khoản thuế/chi phí bán, tiền thu ròng và lợi nhuận ròng cho từng phần và toàn bộ kế hoạch. Ví dụ các tỷ lệ giả định tự nhập: giá vốn 10.015 VND/CP, phí bán 0,15%, chi phí bán khác 0,10%, mục tiêu 5% thì giá tối thiểu trước làm tròn là 10.542,105263…; bước làm tròn 50 VND cho giá 10.550 VND. Bán 100 CP ở giá này thu ròng 1.052.362,50 VND, lãi 50.862,50 VND sau các khoản đã cấu hình.

Kết quả là phép tính kịch bản theo giá khớp giả định, không gửi lệnh và không đảm bảo giá được khớp. Excel không có sàn giao dịch hay dữ liệu giá hiện tại để tự kiểm tra bước giá, giá trần/sàn và khả năng bán; các phần chia có thể gồm lô lẻ. Người dùng chọn bước làm tròn phù hợp và kiểm tra điều kiện giao dịch khi sử dụng. Lãi trong gợi ý chỉ là lãi dự kiến, không thay đổi tồn mua, ghi chú hoặc ghi nhận giao dịch thực. Dữ liệu thay đổi do nhập/thay thế/xóa báo cáo hoặc đổi phí/cơ sở sẽ yêu cầu tính lại gợi ý.

Tồn mua, cơ sở và lịch sử được tách theo tài khoản/tiểu khoản; giao diện chỉ hiển thị tài khoản đã che bớt số. Chọn phạm vi trước khi đọc giá vốn. Nhập báo cáo ngày cũ sẽ tính lại các ngày tiếp theo theo thứ tự ngày giao dịch; bộ lọc ngày/mã chỉ đổi phần hiển thị. Có thể lưu ghi chú cho từng ngày/mã có trong báo cáo, kể cả ngày bán. Ghi chú không làm thay đổi số lượng hoặc giá vốn.

Một tài khoản/tiểu khoản chỉ có một báo cáo cho mỗi ngày: upload lại dữ liệu giống nhau không cộng hai lần. Nếu báo cáo cùng ngày thay đổi, xem trước và chọn **thay thế** để xác nhận thay toàn bộ báo cáo ngày đó, rồi tính lại lũy kế; giữ ghi chú của các ngày/mã còn tồn tại. Vì vậy hãy dùng báo cáo đầy đủ của phiên, không nhập từng phần của cùng ngày. Dữ liệu lưu trong SQLite/Volume hiện có; Excel gốc không được lưu.

**Xóa dữ liệu:** admin chọn đúng tài khoản, mở **Lịch sử báo cáo đã nhập** và bấm xóa trên báo cáo cần bỏ. Màn hình xác nhận nêu tài khoản, ngày và tên tệp; chỉ xóa khi bấm xác nhận. Xóa một báo cáo sẽ xóa cả ghi chú của ngày đó, giữ lượng cổ phiếu cơ sở và cấu hình phí, tính lại tồn mua/giá vốn từ các báo cáo còn lại theo thứ tự ngày. Vì vậy xóa ngày mua có thể giảm tồn, còn xóa ngày bán có thể tăng tồn được theo dõi. Nếu xóa báo cáo cuối cùng nhưng tài khoản vẫn có cấu hình cơ sở hoặc phí, tài khoản tiếp tục xuất hiện với nhãn mã định danh rút gọn; vẫn có thể sửa cấu hình hoặc nhập báo cáo trở lại.

Nút **xóa toàn bộ dữ liệu tài khoản** xóa tất cả báo cáo, ghi chú, cấu hình cơ sở và phí của tài khoản/tiểu khoản đang chọn trong tab này, kể cả dữ liệu ngoài bộ lọc ngày/mã. Cần xác nhận riêng trước khi xóa. Các tài khoản khác giữ nguyên. Muốn lấy lại giao dịch đã xóa phải nhập lại Excel; ghi chú đã xóa cần nhập lại, và sau khi xóa toàn bộ cần thiết lập lại cơ sở và phí. Việc xóa trong tab này không xóa tài khoản đăng nhập, Sổ giao dịch, NAV hoặc dữ liệu TradingView. Mẫu Excel và dữ liệu cũ không cần đổi cột. Khi khởi động, SQLite tự thêm bảng cấu hình phí; dữ liệu khớp lệnh cũ được giữ nguyên và tiếp tục tính với phí 0 cho đến khi admin cấu hình.

Tài khoản `user` chỉ được xem và tính gợi ý khi admin cấp tính năng `tradeReconciliation` và không giới hạn chiến lược; chỉ admin được upload, thay thế, ghi chú, thiết lập cơ sở/phí và xóa dữ liệu. API đọc `GET /api/trade-reconciliation?scope=...` trả `fees`, `bases`, `positions`, `rows`, `totals` và phương pháp `daily_net_inventory_with_base`. Trường `quantity` của vị thế là lượng mua thêm còn lại; `base_quantity` là cơ sở; `total_quantity` là tổng hai phần. Giá vốn vị thế đã gồm phí mua cấu hình; giá khớp gốc vẫn là giá chưa cộng phí. Xem trước/lưu dùng `POST /api/trade-reconciliation/preview` và `/import?replace_existing=true|false`, body là file nhị phân, header `X-Filename` chứa tên file đã URL-encode. Ghi chú dùng `PUT /api/trade-reconciliation/notes` với `{scope, trade_date, ticker, note}` (ngày ISO, ghi chú tối đa 2.000 ký tự); cơ sở dùng `PUT /api/trade-reconciliation/bases` với `{scope, ticker, base_quantity}` (số nguyên JSON).

Lưu phí dùng `PUT /api/trade-reconciliation/fees` với `{scope, buy_fee_percent, sell_fee_percent, sell_tax_percent}`; đơn vị là phần trăm, ví dụ `0.15` nghĩa là 0,15%, không phải 15%. `sell_tax_percent` có thể bỏ qua để dùng 0. Tính gợi ý dùng `GET /api/trade-reconciliation/sell-plan?scope=...&ticker=...&parts=3&target_profit_percent=5&upper_profit_percent=7&price_step=100`. `upper_profit_percent` có thể bỏ qua để dùng cùng mục tiêu; bước làm tròn là số nguyên 1–1.000.000 VND. API trả dải `price_min`/`price_max`, các phần `orders`, tổng `totals`, cấu hình `fees` và `revision` của dữ liệu đã dùng; phép tính không lưu kế hoạch hay tạo giao dịch. Không có dư mua hoặc số phần vượt dư mua trả `422`. Đổi phí cũng đổi revision tài khoản và làm xác nhận xóa toàn bộ cũ không còn hợp lệ.

Xóa một báo cáo dùng `DELETE /api/trade-reconciliation/imports/{id}?scope=...&expected_revision=...`, lấy `id` và `revision` của báo cáo trong `imports` từ API đọc. Xóa toàn bộ dùng `DELETE /api/trade-reconciliation/accounts/{scope}?expected_revision=...`, lấy `revision` cấp cao nhất của tài khoản từ cùng API. Revision là chuỗi SHA-256 64 ký tự; phải dùng phiên bản vừa đọc. Nếu dữ liệu cần xóa đã thay đổi trong lúc xác nhận, API trả `409` và giữ dữ liệu để admin tải lại, kiểm tra rồi xác nhận lại. Các API cần session đăng nhập; tài khoản chỉ xem không được xóa (`403`), đối tượng xóa không còn tồn tại trả `404`, dữ liệu lỗi trả `422`, quá dung lượng `413`, báo cáo trùng ngày khác dữ liệu chưa chọn thay thế trả `409`.

Module này lưu thống kê riêng, không tự tạo bút toán Sổ giao dịch, sửa NAV hoặc mở/đóng vị thế Gate từ TradingView.

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
| 13/10/2026 | Thêm phí mua/bán và khoản chi phí bán khác theo tài khoản, tự cộng phí mua vào giá vốn lịch sử; tính dải giá bán chia đều dư mua theo lợi nhuận mục tiêu sau phí. Thêm xóa từng báo cáo/xóa toàn bộ tài khoản cho admin, có xác nhận và kiểm tra phiên bản; xóa từng ngày giữ cơ sở/phí, xóa ghi chú ngày đó và tính lại lũy kế; xóa toàn bộ gồm cả cơ sở/phí. |
| 12/10/2026 | Thêm Đối chiếu khớp lệnh: xem trước/import Excel TCBS theo tài khoản và ngày, chống cộng trùng, thay thế báo cáo, ghi chú; trừ lượng bán chênh lệch vào tồn mua trước đó, giữ giá vốn bình quân khi bán một phần. Thiết lập cổ phiếu cơ sở đã có sẵn theo tài khoản/mã, giữ riêng cơ sở và chỉ tính giá vốn cho phần mua thêm; báo cáo cũ tự được tính lại. |
| 11/10/2026 | Tín hiệu sớm giữ nguyên khi RF/EMA mở, xác nhận hoặc đóng vị thế; chỉ ẩn khi hết hạn/đổi chiều cùng mã, chỉ báo và khung. Tách hiệu lực khỏi liên hệ lịch sử với lệnh mua; thêm ngành trong API, lọc ngành và loại tín hiệu hiện có, sắp xếp theo cột, mở rộng vùng bảng và nút xóa từng tín hiệu cho admin. |
| 03/10/2026 | Đưa toàn bộ chỉ số và bảng rebalance RF Stock MTF lên trên EMA Gap Daily trong tab RF + EMA Monitor. |
| 27/09/2026 | Tạo hướng dẫn chính cho bản Railway; làm rõ Gate quản lý rebalance đúng sleeve, vị thế ngoài danh sách vẫn được theo dõi, quy trình CDP bắt buộc trước khi refresh EMA Gap, checklist theo thứ tự thực thi và publish RF quý giữ EMA gần nhất. |
