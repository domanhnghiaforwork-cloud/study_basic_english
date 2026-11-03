# Bản dịch đối chiếu Anh–Việt — Stage 2

Thư mục có **50 file JSON**, cùng tên với bài đọc trong `../paragraph`, gồm **349 cặp câu Anh–Việt**. Bản dịch được lưu sẵn; thao tác giữ vào câu trên web đọc dữ liệu này.

Định dạng và cách chỉnh sửa theo [hướng dẫn bản dịch](../../stage1/translations/README.md). Mã câu có tiền tố `s2-` để không trùng các stage khác. `lessonId` dùng số bài nội bộ stage; số bài trên web do công cụ build tạo khi nối các stage.

Khi sửa tiếng Anh, cập nhật câu và bản dịch tương ứng, rồi cập nhật `sourceSha256` sau khi đối chiếu. Chạy `python -X utf8 scripts/validate_readings.py` và `python -X utf8 scripts/build_lessons.py` từ gốc dự án để kiểm tra, tạo lại catalog.
