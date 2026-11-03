# Mỗi ngày

Website tĩnh học tiếng Anh, ưu tiên điện thoại. Catalog `data/lessons.json` gồm 50 bài, mỗi bài 10 từ trọng tâm và bản dịch từng câu hoặc cụm câu theo ngữ cảnh.

```sh
npm install
npm run dev
```

Mở http://localhost:5173. Trên điện thoại cùng Wi-Fi, dùng địa chỉ IP LAN của máy và cổng 5173. Máy chủ phát triển lắng nghe trên 0.0.0.0.

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Thư mục `dist/` là bản web tĩnh để đưa lên hosting. Không có máy chủ ứng dụng, API key hoặc dịch vụ dịch cần cấu hình.

Giữ vào câu khoảng 450ms để dịch; di chuyển ngón tay để cuộn sẽ hủy thao tác giữ. Nhấp đúp hoặc Tab + Enter/Space cũng mở được bản dịch. Chạm ra ngoài hoặc Escape để đóng. Bảng từ vựng có hai tab: 10 từ trọng tâm và các cặp câu/cụm Anh–Việt.

Tất cả bài tạo thành một danh sách liên tục, không có nhãn hoặc bộ lọc giai đoạn. Tổng số bài tự lấy từ catalog. Bài đầu mở sẵn; hoàn thành bài trước mới được mở bài kế tiếp. Danh sách chọn bài và tab “Đã mở” chỉ hiển thị tên bài đã từng mở; tìm kiếm không làm lộ tên bài phía sau. Đường dẫn trực tiếp không cho nhảy qua bài chưa đủ điều kiện. Tên bài tiếp theo chỉ xuất hiện khi chuyển sang đọc bài đó.

Tiến độ chỉ ghi nhận khi bấm “Đã đọc xong”, lưu tại trình duyệt bằng localStorage. Mỗi bài được tính một lần trong ngày theo ngày địa phương trên thiết bị. Đọc lại ngày khác được ghi cho ngày mới; tổng bài đã đọc là số bài khác nhau. Lịch sử và lịch dùng chung nguồn dữ liệu. Bài đã mở vẫn có thể đọc lại sau khi hoàn tác hoàn thành. Màn Đã đọc có nút xuất/nhập sao lưu để chuyển thiết bị, chưa đồng bộ qua tài khoản. Dữ liệu cũ tự chuyển đổi và giữ lại các bài đã biết, kể cả những bài từng được mở không theo thứ tự.

Đây là khóa theo tiến độ trong giao diện để giữ sự mới lạ; bản web tĩnh vẫn chứa catalog đầy đủ. Không dùng cơ chế này như bảo mật chống người cố tình mở catalog hoặc sửa dữ liệu trình duyệt.

Trong workspace gốc, mỗi thư mục `../data/stage*` chứa `paragraph`, `vocabulary` và `translations`. Từ thư mục gốc chạy `python -X utf8 scripts/build_lessons.py` để ghép thành catalog chung, hoặc thêm `--check` để kiểm tra không ghi file. Các thư mục chưa có đoạn đọc không được đưa vào catalog. Nội dung mới cần nối tiếp sau các bài hiện có để giữ ổn định tiến độ. Bản catalog đi cùng mã web để bản dựng trên hosting không cần truy cập thư mục cha.
