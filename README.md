# Mỗi ngày — Đọc hiểu tiếng Anh trên điện thoại

Web dùng 50 đoạn đọc đã có trong `data/stage1/paragraph`, 500 mục từ trong `data/stage1/vocabulary` và 453 đơn vị dịch Anh–Việt trong `data/stage1/translations`.

## Chạy trên máy

Cần Node.js 20 trở lên. Từ thư mục dự án:

```powershell
cd web
npm install
npm run dev
```

Mở `http://localhost:5173`. Để đọc bằng điện thoại trong cùng Wi-Fi, mở `http://<địa-chỉ-IP-LAN-của-máy>:5173` trên điện thoại. Máy chủ phát triển lắng nghe trên `0.0.0.0`; Windows Firewall cần cho phép kết nối đến cổng 5173 trên mạng riêng.

Không mở trực tiếp `index.html` bằng `file://`, vì trình duyệt cần HTTP để tải module JavaScript và dữ liệu JSON.

## Cách dùng

- **Đọc bài:** số bài hiện tại / tổng bài luôn hiển thị phía trên. Tất cả bài thuộc một danh sách liên tục, không hiển thị giai đoạn. Bài đầu mở sẵn; đọc xong mới mở được bài kế tiếp. Tên bài mới chỉ xuất hiện khi người học thực sự chuyển sang bài đó. Cỡ chữ có thể chỉnh từ 18 đến 26px.
- **Dịch:** giữ khoảng 450ms vào câu để tô sáng và xem nghĩa tiếng Việt. Cụm câu đã được biên soạn chung sẽ được tô sáng và dịch cùng nhau. Chạm ra ngoài hoặc nhấn Escape để đóng. Trên máy tính có thể nhấp đúp; bàn phím dùng Tab rồi Enter/Space. Cuộn hoặc di chuyển ngón tay sẽ hủy thao tác giữ.
- **Từ vựng & cụm câu:** mở bảng dưới đoạn đọc để xem 10 từ trọng tâm hoặc tất cả cặp câu/cụm Anh–Việt của bài. Chữ đậm, gạch dưới trong đoạn đọc là từ trọng tâm.
- **Đã đọc xong:** bấm để ghi vào lịch. Mở bài không tự đánh dấu. Một bài chỉ được tính một lần mỗi ngày; đọc lại vào ngày khác vẫn được ghi nhận cho ngày mới. Có thể hoàn tác đánh dấu của ngày hiện tại.
- **Lịch học:** chọn ngày để xem số bài và danh sách bài đã đọc; chuyển tháng bằng mũi tên. Ngày được tính theo múi giờ trên thiết bị đang học.
- **Đã đọc:** xem lại bài đã hoàn thành, tìm theo số bài, tên tiếng Anh hoặc tên tiếng Việt không dấu. Tab “Đã mở” chỉ liệt kê các bài đã từng mở. Danh sách chọn bài, tìm kiếm và đường dẫn trực tiếp đều tuân theo tiến độ; không hiển thị tên bài chưa đọc đến. Các bài đã mở được giữ lại ngay cả khi hoàn tác một lần đánh dấu hoàn thành.
- **Sao lưu:** biểu tượng tải xuống ở màn Đã đọc mở phần xuất/nhập tiến độ. Nhập sẽ gộp lịch sử, tránh đếm trùng cùng bài trong cùng ngày.

Tiến độ lưu bằng `localStorage` trên từng trình duyệt/địa chỉ web, chưa có tài khoản hoặc đồng bộ tự động giữa thiết bị. Hãy xuất bản sao lưu trước khi xóa dữ liệu trình duyệt hoặc chuyển từ localhost sang một địa chỉ khác. Font tải từ Google Fonts; nếu không có mạng, trình duyệt dùng font dự phòng.

## Cập nhật dữ liệu

Nguồn nội dung gốc và bản dịch được giữ riêng với giao diện. Cấu trúc dịch được mô tả tại [translations/README.md](data/stage1/translations/README.md).

```powershell
python -X utf8 scripts/build_lessons.py
python -X utf8 scripts/build_lessons.py --check
python -X utf8 scripts/test_build_lessons.py
```

Web đọc catalog tĩnh `web/data/lessons.json` được tạo bởi lệnh trên. Công cụ ghép lần lượt các thư mục `data/stage*` đã có đủ đoạn đọc, từ vựng và bản dịch thành một danh sách đánh số liên tục. Những thư mục chỉ có danh sách từ được bỏ qua. Khi bổ sung nội dung, thêm các bài phía sau để giữ ổn định số bài và tiến độ cũ. Giao diện tự lấy tổng số bài từ catalog.

Tiến độ từ phiên bản cũ được chuyển đổi tự động: giữ bài đang đọc và các bài đã hoàn thành, không tự làm lộ tên các bài chưa từng mở nằm xen giữa. Khóa bài là quy tắc trải nghiệm trong ứng dụng tĩnh, không phải cơ chế bảo vệ dữ liệu khỏi người chủ động đọc mã nguồn/catalog hoặc sửa localStorage.

## Kiểm tra và đóng gói

```powershell
cd web
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

`npm run build` tạo website tĩnh ở `web/dist`, có thể đưa lên hosting tĩnh. Không cần API key hay máy chủ dịch. Kiểm thử bao gồm tương tác giữ để dịch, nhóm câu, từ vựng, lưu tiến độ, lịch, lịch sử, sao lưu, xử lý lỗi và bố cục ở 320/375/414/768/1365px.
