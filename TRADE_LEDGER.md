# Sổ giao dịch, NAV và kiểm chứng dữ liệu

Mở **Quản trị → Sổ giao dịch + NAV + đối soát dữ liệu**. Chỉ quản trị viên
được đọc/ghi sổ chi tiết. NAV đã chốt được dùng trong **Hiệu suất NAV** và
**Rủi ro theo giá thị trường**, theo quyền xem toàn danh mục hiện có.

## Ba lớp dữ liệu độc lập

- Webhook: tín hiệu của chiến lược, không phải xác nhận khớp lệnh.
- Sổ giao dịch: giao dịch thực khớp và dòng tiền do quản trị viên nhập theo sao kê.
- NAV: định giá cuối ngày từ sổ và giá được quản trị viên kiểm chứng.

Không tự tạo khớp lệnh từ webhook, không đặt lệnh tại công ty chứng khoán.
Exposure khuyến nghị theo rebalance và thống kê tín hiệu vẫn giữ nguyên ý nghĩa;
NAV bao gồm **mọi cổ phiếu thực giữ**, kể cả mã ngoài rebalance.

## Quy trình sử dụng

1. Nhập nạp tiền, rồi giao dịch theo ngày/thứ tự khớp trên sao kê. Cùng ngày
   được xử lý theo thứ tự nhập (ID), không theo mã đối chiếu. Có thể nhập JSON
   tối đa 2.000 dòng/lô, 5 MB từ giao diện. Toàn lô thành công hoặc hoàn tác.
2. Với mỗi lần khớp, ghi mã đối chiếu riêng, ticker, RF/EMA/OTHER, ngành, số lượng,
   giá **VND**, tổng phí + thuế. Hai lần khớp có thể cùng ID webhook.
   ID liên kết phải tồn tại, cùng mã/chiều mua bán và không được nhận sau ngày khớp.
3. Nhập cổ tức tiền thực nhận sau thuế và chi phí khác; cổ tức không phải nạp vốn.
   Không nhập thêm chi phí đã nằm trong fees của lệnh để tránh tính hai lần.
4. Kiểm chứng giá **đóng cửa chưa điều chỉnh**, đúng mã/ngày và đơn vị VND.
   Ghi nguồn và tham chiếu sao kê/tài liệu. Mỗi mã đang giữ cần giá đúng ngày
   định giá; giá cũ hoặc tương lai không được thay thế. Không cần giá cho mã đã bán hết.
5. Chọn ngày định giá, đối chiếu lượng giữ, tiền mặt, NAV với sao kê. Xem mục
   chất lượng giá và các webhook chưa liên kết. Liên kết webhook là tùy chọn;
   có thể ghi giao dịch chủ động không xuất phát từ TradingView.
6. Chốt NAV sau khi xác nhận. Ghi snapshot, phiên bản NAV và khóa sổ là một giao
   dịch SQLite nguyên tử. Ngày mới phải sau NAV mới nhất; không ghi đè NAV đã có.
   Làm mới dashboard để thấy số liệu trên trang Hiệu suất/Tổng quan.

Mẫu JSON có trong giao diện. File xuất sổ là bản lưu phục vụ đối soát, chứa cả
audit metadata và giá, **không phải** tệp nhập lại trực tiếp. Khi nhập giao dịch
dùng đúng cấu trúc của mẫu, không thêm các trường ID/người nhập/trạng thái hủy.

## Công thức và quy ước

- Tiền mặt: nạp − rút − tiền mua − phí mua + tiền bán − phí/thuế bán
  + cổ tức ròng − chi phí khác.
- Giá vốn bình quân: tổng giá vốn còn lại / lượng còn lại, tách theo mã và nhóm.
  Phí mua cộng vào giá vốn; bán từng phần giải phóng giá vốn theo bình quân.
- Lãi/lỗ đã chốt: tiền bán − phí/thuế bán − giá vốn phần bán.
- Lãi/lỗ chưa chốt: giá trị cổ phiếu theo giá kiểm chứng − giá vốn còn lại.
- NAV: tiền mặt kế toán + tổng lượng giữ × giá kiểm chứng cùng ngày.
- Tổng P/L từ đầu sổ: NAV − tổng nạp/rút ròng. Bằng P/L đã chốt + P/L chưa chốt
  + cổ tức ròng − chi phí khác.

Sổ dùng số học Decimal cho tiền/gía vốn trong quá trình cộng trừ; API và các
snapshot hiện hữu xuất số JSON. Số tiền hiển thị làm tròn, số lưu không bị làm
tròn theo cách trình bày giao diện.

Snapshot NAV đầu tiên là mốc bắt đầu hiệu suất, không phải lợi nhuận từ trước
ngày đó. Nếu muốn đo chi phí/lợi nhuận ngày mua đầu tiên, chốt một mốc tiền mặt
trước ngày mua. Không tự dựng giao dịch lịch sử từ các tín hiệu cũ.

Dòng tiền của snapshot là tổng nạp/rút sau mốc NAV trước đến ngày chốt, quy ước
**cuối kỳ**. Có ngày bỏ trống thì gom dòng tiền của cả khoảng. Vì chưa có định
giá tại từng thời điểm nạp/rút, đây không phải TWR intraday chính xác khi dòng
tiền lớn phát sinh trong kỳ. Nên chốt NAV đều mỗi ngày và xem quy ước chi tiết
trong [FUND_ANALYTICS.md](FUND_ANALYTICS.md).

## Khóa kỳ và sửa sai

Mã đối chiếu là duy nhất. Gửi lại cùng mã/nội dung không tạo bản trùng; cùng mã
khác nội dung báo xung đột. Không thể tái sử dụng mã của dòng đã hủy.

Trước khi khóa, hủy theo ID và lý do; giữ người nhập, thời gian, người hủy và
lý do. Hệ thống chạy lại toàn sổ để ngăn hủy nạp tiền/lệnh mua khiến giao dịch
sau thiếu tiền hoặc bán vượt lượng. Nhập lại bản đúng với mã đối chiếu mới.
Giá mới cùng mã/ngày được ưu tiên, mọi phiên bản giá vẫn được lưu.

Sau khi khóa, không thêm/hủy giao dịch hay thay giá ở ngày khóa hoặc trước đó.
Biểu mẫu NAV thủ công cũng không thay được snapshot do sổ chốt. Chưa có chức
năng mở lại kỳ đã khóa: phải kiểm tra trước khi chốt. Đây là khóa ứng dụng,
không phải sổ bất biến chống người có quyền sửa trực tiếp SQLite.

Nếu đã có chuỗi NAV thủ công, trước lần chốt đầu tiên từ sổ, số dư sổ tại ngày
NAV cũ phải khớp tiền mặt, lượng theo mã/nhóm và NAV trong dung sai 1 VND; cần
giá kiểm chứng tại ngày đó. Không tự nối hai nguồn không khớp số dư đầu kỳ.

## Kiểm chứng webhook và giá

- 500 tín hiệu lưu gần nhất: ID, lúc nhận, mã, chiến lược, chiều, số lần/lượng
  khớp liên kết; chưa liên kết không có nghĩa webhook thất bại.
- 100 bản ghi phân lỗi gần nhất kèm lý do; tổng số hiển thị đếm toàn lịch sử.
  Đây là các log ứng dụng hiện có, không chứng minh TradingView đã gửi đủ mọi alert.
- Giá webhook cổ phiếu đang lưu theo nghìn VND được đổi ×1.000 để so sánh với
  giá kiểm chứng đúng ngày nhận tại Việt Nam. Lệch tuyệt đối từ 5% được đánh dấu;
  giá tín hiệu intraday có thể khác giá đóng cửa một cách hợp lệ.
- Chất lượng bộ nhớ giá nhà cung cấp lấy enrichment của tín hiệu mới nhất mỗi mã:
  trạng thái, ngày giá, tuổi theo ngày lịch, giá đóng cửa, số nến có ngày/giá lỗi
  và chênh lệch với giá đã kiểm chứng cùng ngày. Trên 4 ngày, có nến lỗi, trạng
  thái khác ok hoặc lệch từ 5% cần rà soát. Ngưỡng này không phải lịch nghỉ sàn.
- Không gọi lại nguồn giá từ màn hình đối soát; không tự duyệt cache là giá NAV.
  Giá lịch sử đã điều chỉnh quyền có thể khác giá đóng cửa chưa điều chỉnh.
  Mã chỉ nằm trong sổ mà chưa có webhook cần nhập giá đối chiếu riêng.

## Phạm vi hiện tại

Sổ long-only, tiền theo ngày giao dịch; tiền mặt kế toán không phải tiền có thể
rút hay sức mua T+2. Chưa tự động hạch toán margin, settlement, cổ tức cổ phiếu,
chia tách, quyền mua, phải thu/phải trả hoặc đồng bộ sao kê broker. Danh mục có
các nghiệp vụ đó cần được hỗ trợ bổ sung trước khi dùng sổ làm nguồn NAV chuẩn.
Không giả lập cổ tức cổ phiếu bằng một lệnh mua có dòng tiền.

Các snapshot từ sổ chưa tự điền daily_pnl/total_return_pct theo mã. Phần phân bổ
P/L và tương quan của module NAV vẫn cần dữ liệu riêng; chênh lệch không được
ngầm phân bổ. Không tự suy ra target/stop/ngân sách rủi ro từ lệnh khớp.

## Lưu trữ và API

SQLite tự tạo ba bảng mới: ledger_entries, ledger_prices, ledger_closes.
Không chuyển đổi hay xóa các signal/snapshot cũ. Dữ liệu nằm cùng volume
DATABASE_PATH đang dùng; sao lưu database trước khi triển khai.

- GET /api/admin/ledger?trade_date=YYYY-MM-DD: sổ, dự thảo NAV, kiểm chứng.
- POST /api/admin/ledger/entries: {"entries": [...]}.
- POST /api/admin/ledger/entries/{id}/void: {"reason": "..."}.
- POST /api/admin/ledger/prices: ngày, mã, price VND, source, evidence, confirmed=true.
- POST /api/admin/ledger/close: trade_date, benchmark_name, benchmark_value tùy chọn.

Kiểm tra: `.venv/Scripts/python.exe -m unittest discover -s tests` và
`node --check app/static/trade-ledger.js`.
