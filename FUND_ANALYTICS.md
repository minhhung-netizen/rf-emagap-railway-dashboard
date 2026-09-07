# Hiệu suất NAV và quản trị rủi ro

## Bắt đầu

1. Đăng nhập quản trị → **Quản trị → NAV cuối ngày & chính sách rủi ro**.
2. Nhập ngày, NAV, tiền mặt, danh mục và giá đóng cửa từ báo cáo đã đối chiếu.
   Mọi giá và số tiền ở đây dùng **VND**, không phải nghìn đồng như webhook.
3. Lưu NAV; mở **Hiệu suất** để xem NAV/TWR, hoặc **Tổng quan** để xem rủi ro
   theo giá thị trường. Cần ít nhất hai ngày để tính lợi nhuận.
4. Để nhập lịch sử, tải mẫu JSON trong phần **Nhập/xuất nhiều ngày**, điền dữ liệu
   rồi nhập tệp. Tối đa 2.000 ngày/lần; giao diện giới hạn tệp 5 MB.

Không tự tạo số dư tài khoản từ webhook. Chưa có đồng bộ NAV với công ty chứng
khoán, sổ giao dịch đầy đủ hoặc dữ liệu benchmark tự động. Các bảng tín hiệu cũ
được gắn nhãn riêng và không phải báo cáo hiệu suất quỹ.

## Quy ước dữ liệu

- `NAV = tổng(quantity × price) + cash + receivables − liabilities`.
  Sai số cho phép tối đa `max(1 VND, NAV × 1e-8)`; NAV tối thiểu 1 VND.
- `nav` là giá trị cuối ngày **sau** dòng tiền ngoài danh mục; `external_flow`
  dương là nạp vốn, âm là rút vốn. Giả định dòng tiền xảy ra cuối ngày.
  Nếu tiền vào/ra trong phiên, cần định giá tại dòng tiền hoặc phương pháp khác;
  không xem công thức cuối ngày này là chính xác cho mọi thời điểm dòng tiền.
- Cổ tức, phí, thuế và thu nhập thuộc danh mục nằm trong NAV/lãi lỗ, **không**
  ghi thành nạp/rút vốn. Các khoản phải thu/phải trả giúp tránh bỏ sót tiền chờ
  thanh toán hoặc ghi nhận hai lần; đối chiếu quy ước tiền mặt của nhà môi giới.
- `holdings` gồm mã, ngành, nhóm `RF`/`EMA`/`OTHER`, số lượng và giá VND.
  Không hỗ trợ vị thế bán khống. Một mã có thể nằm ở nhiều nhóm nhưng chỉ một
  dòng mỗi mã/nhóm; tên ngành của cùng mã phải nhất quán.
- `target_weight_pct`, `risk_budget_pct` là phần trăm **NAV**, không phải số thập phân.
  `stop_price` là giá VND; mọi trường tùy chọn để trống khi không biết.
- `daily_pnl` là P/L kế toán trong ngày của mã/nhóm, gồm lãi đã thực hiện,
  thay đổi định giá, thu nhập và chi phí; không phải số dư lãi lũy kế.
  Với mã đã bán hết, giữ dòng số lượng 0 để ghi nhận P/L trong ngày bán.
- `total_return_pct` là lợi nhuận chứng khoán từng phiên đã điều chỉnh quyền,
  cổ tức, dùng tính tương quan. Không nhập biến động giá chưa điều chỉnh thay thế.
- Benchmark cần cùng tên và có giá trị ở **mọi** ngày NAV. `VNINDEX (price)`
  là chỉ số giá, không phải total-return index. Có thể nhập benchmark khác;
  thay đổi tên trong chuỗi làm ẩn so sánh để tránh nối hai chỉ số khác nhau.

Ví dụ NAV 100 triệu, nắm 200 MBB ở giá 25.000 VND và tiền mặt 95 triệu:

```json
{
  "snapshots": [{
    "trade_date": "2026-09-07",
    "nav": 100000000,
    "cash": 95000000,
    "receivables": 0,
    "liabilities": 0,
    "external_flow": 0,
    "benchmark_name": "VNINDEX (price)",
    "benchmark_value": null,
    "holdings": [{
      "ticker": "MBB", "sector": "banking", "sleeve": "RF",
      "quantity": 200, "price": 25000,
      "target_weight_pct": 5, "stop_price": 23000, "risk_budget_pct": 1,
      "daily_pnl": null, "total_return_pct": null
    }],
    "note": "Ví dụ minh họa; thay bằng báo cáo tài khoản thực"
  }],
  "replace_existing": false
}
```

## Cách đọc hiệu suất

- TWR liên kết các kỳ: `r_t = (NAV_t − external_flow_t) / NAV_(t−1) − 1`.
  Đường NAV TWR chuẩn hóa tại 100 để so sánh với benchmark cùng kỳ; không phải
  đường số dư tiền. Bảng ngày hiển thị NAV VND gốc. Bộ lọc tín hiệu không tác
  động tới báo cáo toàn danh mục.
- XIRR năm hóa theo ngày thực tế, vốn đầu kỳ âm, nạp vốn âm, rút vốn dương,
  NAV cuối kỳ dương. Dòng tiền ở mốc NAV đầu không được đếm hai lần.
  Thuật toán bảo thủ chỉ tính khi chuỗi dòng tiền gộp theo ngày đổi dấu một lần;
  dấu “—” nghĩa là không đủ dữ liệu hoặc không xác định được nghiệm duy nhất.
  XIRR của kỳ ngắn có thể rất lớn và không phải dự báo lợi nhuận năm.
- CAGR là TWR năm hóa, chỉ hiện từ 365 ngày. Drawdown và thời gian phục hồi
  dựa trên đường TWR; thời gian tính ngày lịch, gồm cả kỳ chưa phục hồi.
- Sharpe, Sortino, biến động năm hóa dùng 252 phiên và tối thiểu 20 khoảng
  lợi nhuận. Lịch kiểm tra là thứ Hai–thứ Sáu, chưa có lịch nghỉ lễ sở giao dịch.
  Thiếu phiên/ngày nghỉ lễ làm ẩn chỉ số năm hóa theo phiên để tránh lấp số 0.
  Sharpe dùng độ lệch chuẩn mẫu của lợi nhuận vượt lãi suất phi rủi ro;
  Sortino dùng căn trung bình bình phương phần âm của lợi nhuận vượt mức này.
- Bảng tháng/năm có thể chứa kỳ chưa trọn. Khoảng giữa hai NAV được gán cho
  tháng/năm của ngày cuối; nếu thiếu ngày ở ranh giới kỳ, cần bổ sung NAV để có
  lợi nhuận đúng kỳ. Không tự nội suy dòng tiền hoặc giá.
- Attribution là tổng P/L VND được nhập theo mã/ngành/nhóm, không phải đóng góp
  phần trăm đã liên kết. “Chênh lệch chưa phân bổ” = P/L toàn NAV trừ P/L đã nhập;
  hãy đối chiếu phần này trước khi dùng báo cáo. Dữ liệu ngày đầu không thuộc kỳ.

## Kiểm soát rủi ro

Tỷ trọng mã/ngành/RF/EMA, tiền mặt và top 5 tính từ **NAV cuối ngày mới nhất**.
Đây không phải định giá thời gian thực. Trần lấy từ portfolio-gate snapshot hiện
hành (hoặc mặc định gate), không tạo một bộ trần khác.

Rủi ro đến stop = `quantity × max(price − stop_price, 0) / NAV`; cảnh báo khi
vượt ngân sách hoặc giá đã chạm stop. Gap giá/trượt giá có thể làm tổn thất lớn
hơn mức ước tính. Hai stress test là cú sốc đồng loạt toàn bộ cổ phiếu và cú sốc
ngành lớn nhất; tiền mặt/phải thu/phải trả giữ nguyên, chưa có mô hình thanh khoản.

Tương quan Pearson dùng tối thiểu 20 quan sát chung; chỉ các mã top 10 hiện tại,
cửa sổ tối đa 120 ngày ghi nhận. Dữ liệu thiếu không được thay bằng 0.
RF/EMA dùng P/L kế toán của nhóm chia giá trị nhóm phiên trước, không dùng số
lượng tín hiệu. Cần khai báo đủ P/L, kể cả mã bán hết; luồng vốn trong phiên
có thể làm sai lệch phép xấp xỉ này.

**Chặn phân bổ mới mặc định tắt.** Khi quản trị bật, webhook `buy`/`confirm_buy`
không được duyệt nếu chưa có NAV, NAV quá tuổi, vượt trần mã/ngành/nhóm/tổng
exposure hoặc drawdown chạm ngưỡng dừng. Vẫn trả HTTP 200 và lưu nhật ký
`nav_risk_pause`; `sell`/`confirm_sell` vẫn qua quy tắc gate bình thường.
Chuỗi NAV/dòng tiền làm tràn giới hạn biểu diễn TWR cũng yêu cầu rà soát và chặn
phân bổ nếu chính sách đang bật, thay vì trả số vô hạn hoặc bỏ qua kiểm soát.
Không tự đóng vị thế, không đặt lệnh tại công ty chứng khoán, không tự hủy lệnh.
Cảnh báo stop/ngân sách không tự kích hoạt chặn. Kiểm tra NAV này dựa trên trạng
thái đã ghi nhận, không mô phỏng số lượng khớp của một lệnh sắp tới; gate cũ
tiếp tục kiểm soát riêng phân bổ tín hiệu.

## Lưu trữ, quyền và API

SQLite tự thêm `nav_snapshots` và `nav_snapshot_revisions` khi khởi động, không
xóa dữ liệu tín hiệu. Ngày đã có chỉ được thay khi bật xác nhận; mọi phiên bản
lưu kèm người sửa và thời điểm. Batch lỗi được rollback toàn bộ. Lịch sử phiên
bản hiện lưu trong DB, chưa có giao diện xem/phục hồi. Giữ bản sao DB trên
Railway volume; JSON xuất từ giao diện chỉ chứa phiên bản NAV hiện tại.

- `GET /api/fund-performance`: quyền Hiệu suất, không giới hạn chiến lược.
- `GET /api/market-risk`: quyền Tổng quan hoặc Vị thế, không giới hạn chiến lược.
- `GET/POST /api/admin/nav-snapshots`: admin; POST nhận mẫu JSON ở trên.
- `PATCH /api/admin/fund-risk-policy`: admin; lưu đầy đủ chính sách.

API dùng session đăng nhập dashboard, không dùng webhook secret để sửa NAV.
Tài khoản chỉ được xem một số chiến lược không được đọc NAV toàn danh mục.
Không đưa NAV thật, session cookie hoặc thông tin tài khoản vào Git.

Kiểm thử: cài `pip install -r requirements-dev.txt`, sau đó chạy
`python -m unittest discover -s tests`.
