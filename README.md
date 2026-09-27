# RF + EMA Portfolio Gate Dashboard

Dashboard FastAPI nhận tín hiệu cổ phiếu từ TradingView, theo dõi vị thế RF/EMA, đối chiếu danh sách rebalance và hiển thị hiệu suất NAV. Ứng dụng không gửi lệnh tới công ty chứng khoán.

**Hướng dẫn sử dụng và vận hành:** [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md). Đây là tài liệu chính cho bản Railway hiện tại; mỗi thay đổi chức năng phải cập nhật hướng dẫn trong cùng commit.

Tài liệu chi tiết: [triển khai Railway](RAILWAY_PORTFOLIO_MONITOR.md), [hiệu suất NAV](FUND_ANALYTICS.md), [sổ giao dịch](TRADE_LEDGER.md).

## Chạy cục bộ

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
$env:ADMIN_PASSWORD = "<mat-khau-manh>"
$env:WEBHOOK_SECRET = "<webhook-secret>"
python -m uvicorn app.main:app --reload
```

Mở `http://127.0.0.1:8000`. Xem [hướng dẫn chính](DASHBOARD_GUIDE.md) trước khi dùng dữ liệu thật hoặc triển khai Railway.

```powershell
python -m unittest discover -s tests
```
