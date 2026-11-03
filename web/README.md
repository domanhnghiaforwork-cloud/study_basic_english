# Mỗi ngày

Web học tiếng Anh, ưu tiên điện thoại, dùng Node.js 24 trở lên. Catalog `data/lessons.json` gồm 200 bài từ stage 1–3, mỗi bài 10 từ trọng tâm và bản dịch từng câu hoặc cụm câu theo ngữ cảnh. Stage 2 là bài 51–100, stage 3 là bài 101–200; các bài tiếp tục dùng cùng danh sách và tiến độ học. Máy chủ Node cung cấp thêm chức năng Hỏi AI trong box dịch.

```sh
npm install
npm run dev
```

Mở http://localhost:5173. Trên điện thoại cùng Wi-Fi, dùng địa chỉ IP LAN của máy và cổng 5173. Máy chủ phát triển lắng nghe trên 0.0.0.0.

Để dùng domain ngrok, giữ `npm run dev` chạy và mở terminal thứ hai tại thư mục này:

```sh
npm run tunnel
```

Lệnh trên chuyển `https://larcher-brecken-palynologically.ngrok-free.dev` đến `http://127.0.0.1:5173`. Cần ngrok đã được cài và cấu hình tài khoản sở hữu domain. Máy chủ không chặn hostname; các file và dữ liệu được tải bằng đường dẫn tương đối, không cần cấu hình `allowedHosts` hoặc `--host-header`.

Nếu ngrok miễn phí hiện trang cảnh báo, bấm **Visit Site**; xem [tài liệu ngrok](https://ngrok.com/docs/pricing-limits/free-plan-limits#removing-the-interstitial-page). Cả terminal web và tunnel phải tiếp tục chạy trong lúc sử dụng.

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Thư mục `dist/` là phần giao diện. Web cần máy chủ Node.js 24 trở lên cho đăng nhập, SQLite và Hỏi AI; chỉ đưa `dist/` lên hosting tĩnh sẽ thiếu API. Playwright chạy cổng 5174, dùng database riêng trong `../outputs/` và Gemini giả lập để không tác động database/API key thật.

## Hỏi AI với Gemini

Điền `GEMINI_API_KEY` trong `../.env` ở thư mục gốc dự án, rồi khởi động lại `npm run dev`. Trên bản clone mới, sao chép `../.env.example` thành `../.env`. Model mặc định: `gemini-3.5-flash-lite`; đổi bằng `GEMINI_MODEL` nếu cần. Key được giữ ở máy chủ, không gửi xuống trình duyệt.

Giữ một câu để mở bản dịch. Ô bo góc “Hỏi AI...” nằm ngay dưới nghĩa tiếng Việt. Nhập từ/cụm Anh để hỏi nghĩa trong câu; nhập từ/cụm Việt để hỏi lý do dịch. Khi gửi, dòng nhỏ báo “AI đang suy nghĩ...”; nội dung trả lời hiện dần và box tự cao lên. Đổi câu/đóng box hủy lượt hỏi cũ. Box tự điều chỉnh để nằm trên bàn phím điện thoại.

Câu hỏi tối đa 200 ký tự; trả lời mặc định 400 ký tự, có thể đổi `AI_MAX_RESPONSE_CHARS` từ 100–800 trong `.env`. Máy chủ tự lấy câu nguồn và bản dịch theo ID từ catalog, dùng system prompt tại `server/prompts/explain-translation.txt`, gọi Gemini và ghi log vào bảng `ai_logs` của SQLite theo tài khoản đang đăng nhập. Nút Nhật ký hỏi AI trong màn Đã đọc cho xem lại từ đã hỏi, câu nguồn và trả lời.

Log gồm input người học, câu tiếng Anh, bản dịch Việt, câu trả lời được hiển thị, model, thời gian và trạng thái. Lỗi/hủy được ghi bằng `errorCode`; không ghi key hoặc nội dung lỗi thô của provider. Key, log và mã server không được phục vụ như tài nguyên web. Xem thêm [hướng dẫn dự án](../README.md).

Giữ vào câu khoảng 450ms để dịch; di chuyển ngón tay để cuộn sẽ hủy thao tác giữ. Nhấp đúp hoặc Tab + Enter/Space cũng mở được bản dịch. Chạm ra ngoài hoặc Escape để đóng. Bảng từ vựng có hai tab: 10 từ trọng tâm và các cặp câu/cụm Anh–Việt.

Tất cả bài tạo thành một danh sách liên tục, không có nhãn hoặc bộ lọc giai đoạn. Tổng số bài tự lấy từ catalog. Bài đầu mở sẵn; hoàn thành bài trước mới được mở bài kế tiếp. Danh sách chọn bài và tab “Đã mở” chỉ hiển thị tên bài đã từng mở; tìm kiếm không làm lộ tên bài phía sau. Đường dẫn trực tiếp không cho nhảy qua bài chưa đủ điều kiện. Tên bài tiếp theo chỉ xuất hiện khi chuyển sang đọc bài đó.

Đăng nhập bằng username và password; đăng ký chỉ cần nhập lại password. Tên dài 3–32 ký tự; mật khẩu 8–128 ký tự, được băm bằng scrypt. Tiến độ, lịch đọc và log AI lưu riêng theo tài khoản trong `../storage/study.sqlite`, tự tạo khi chạy server. Đăng nhập cùng tài khoản trên máy khác để tiếp tục. Đổi đường dẫn database bằng `STUDY_DB_PATH` trong `.env`; đường dẫn tương đối tính từ thư mục gốc. SQLite và các file đi kèm được Git bỏ qua. Muốn sao lưu toàn bộ tài khoản, dừng server rồi sao chép thư mục `storage/`.

Tiến độ chỉ ghi nhận khi bấm “Đã đọc xong”. Mỗi bài được tính một lần trong ngày theo ngày địa phương trên thiết bị. Đọc lại ngày khác được ghi cho ngày mới; tổng bài đã đọc là số bài khác nhau. Lịch sử và lịch dùng chung dữ liệu tài khoản. Bài đã mở vẫn có thể đọc lại sau khi hoàn tác. Màn Đã đọc có nút xuất/nhập JSON tiến độ; các bản nhập được gộp mà không đếm trùng. Tiến độ localStorage cũ không tự nhập vào bất kỳ tài khoản nào: đăng nhập đúng người, vào Đã đọc → Sao lưu → Nhập tiến độ cũ trên máy. Hàng đợi mất kết nối được lưu riêng theo tài khoản và thử lại khi mở trang/có mạng. Log JSONL cũ được giữ tại máy, không tự gán cho tài khoản.

Đây là khóa theo tiến độ trong giao diện để giữ sự mới lạ; bản web tĩnh vẫn chứa catalog đầy đủ. Không dùng cơ chế này như bảo mật chống người cố tình mở catalog hoặc sửa dữ liệu trình duyệt.

Trong workspace gốc, mỗi thư mục `../data/stage*` chứa `paragraph`, `vocabulary` và `translations`. Từ thư mục gốc chạy `python -X utf8 scripts/build_lessons.py` để ghép thành catalog chung, hoặc thêm `--check` để kiểm tra không ghi file. Các thư mục chưa có đoạn đọc không được đưa vào catalog. Nội dung mới cần nối tiếp sau các bài hiện có để giữ ổn định tiến độ. Bản catalog đi cùng mã web để bản dựng trên hosting không cần truy cập thư mục cha.
