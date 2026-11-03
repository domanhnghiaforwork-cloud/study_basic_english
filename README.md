# Mỗi ngày — Đọc hiểu tiếng Anh trên điện thoại

Web dùng **200 bài đọc**, **2.000 mục từ** và **1.472 cặp dịch Anh–Việt** từ ba stage. Mỗi bài có đúng 10 từ trọng tâm, xuất hiện trong đoạn văn và giữ nguyên nghĩa từ danh sách nguồn.

| Bộ bài | Đoạn đọc | Mục từ nguồn | Số bài trên web |
| --- | --- | --- | --- |
| [Stage 1](data/stage1/README.md) | 50 | 0001–0500 | 1–50 |
| [Stage 2](data/stage2/README.md) | 50 | 0501–1000 | 51–100 |
| [Stage 3](data/stage3/README.md) | 100 | 1001–2000 | 101–200 |

## Chạy trên máy

Cần Node.js 24 trở lên (có SQLite tích hợp, không cần cài dịch vụ database). Từ thư mục dự án:

```powershell
cd web
npm install
npm run dev
```

Mở `http://localhost:5173`. Để đọc bằng điện thoại trong cùng Wi-Fi, mở `http://<địa-chỉ-IP-LAN-của-máy>:5173` trên điện thoại. Máy chủ phát triển lắng nghe trên `0.0.0.0`; Windows Firewall cần cho phép kết nối đến cổng 5173 trên mạng riêng.

Không mở trực tiếp `index.html` bằng `file://`, vì trình duyệt cần HTTP để tải module JavaScript và dữ liệu JSON.

## Mở bằng domain ngrok

Ở terminal thứ nhất, chạy web từ thư mục `web` bằng `npm run dev`. Giữ terminal này chạy. Ở terminal thứ hai, cũng tại `web`, chạy:

```powershell
npm run tunnel
```

Lệnh này tương đương:

```powershell
ngrok http http://127.0.0.1:5173 --url https://larcher-brecken-palynologically.ngrok-free.dev
```

Máy cần cài ngrok và cấu hình tài khoản sở hữu domain trên. Sau khi ngrok báo tunnel online, mở `https://larcher-brecken-palynologically.ngrok-free.dev` bằng điện thoại. Dùng địa chỉ upstream `127.0.0.1:5173` giúp ngrok kết nối đúng máy chủ IPv4 của web.

Web dùng máy chủ Node.js, không dùng Vite và không giới hạn hostname: không cần `allowedHosts` hoặc sửa Host header. JavaScript, CSS và dữ liệu dùng đường dẫn tương đối nên cùng hoạt động qua domain HTTPS của ngrok.

Gói ngrok miễn phí có thể hiện trang cảnh báo trước khi vào web; bấm **Visit Site** để tiếp tục. Đây là trang của ngrok, không phải lỗi chặn domain trong code. Xem [tài liệu ngrok](https://ngrok.com/docs/pricing-limits/free-plan-limits#removing-the-interstitial-page). Domain chỉ truy cập được khi cả máy chủ web và tunnel ngrok đang chạy.

## Cách dùng

- **Tài khoản:** đăng nhập bằng tên đăng nhập và mật khẩu. Đăng ký chỉ thêm ô nhập lại mật khẩu. Tên dài 3–32 ký tự; mật khẩu 8–128 ký tự. Nút đăng xuất nằm cạnh tên tài khoản ở góc trên.
- **Đọc bài:** số bài hiện tại / tổng bài luôn hiển thị phía trên. Tất cả bài thuộc một danh sách liên tục, không hiển thị giai đoạn. Bài đầu mở sẵn; đọc xong mới mở được bài kế tiếp. Tên bài mới chỉ xuất hiện khi người học thực sự chuyển sang bài đó. Cỡ chữ có thể chỉnh từ 18 đến 26px.
- **Dịch:** giữ khoảng 450ms vào câu để tô sáng và xem nghĩa tiếng Việt. Cụm câu đã được biên soạn chung sẽ được tô sáng và dịch cùng nhau. Chạm ra ngoài hoặc nhấn Escape để đóng. Trên máy tính có thể nhấp đúp; bàn phím dùng Tab rồi Enter/Space. Cuộn hoặc di chuyển ngón tay sẽ hủy thao tác giữ.
- **Từ vựng & cụm câu:** bấm liên kết gạch chân phía trên đoạn đọc, cạnh nút chỉnh cỡ chữ, để xem 10 từ trọng tâm hoặc các cặp câu/cụm Anh–Việt của bài. Đoạn đọc dùng chữ thường đồng nhất, không đánh dấu riêng từ trọng tâm.
- **Đã đọc xong:** bấm để ghi vào lịch. Mở bài không tự đánh dấu. Một bài chỉ được tính một lần mỗi ngày; đọc lại vào ngày khác vẫn được ghi nhận cho ngày mới. Có thể hoàn tác đánh dấu của ngày hiện tại.
- **Lịch học:** chọn ngày để xem số bài và danh sách bài đã đọc; chuyển tháng bằng mũi tên. Ngày được tính theo múi giờ trên thiết bị đang học.
- **Đã đọc:** xem lại bài đã hoàn thành, tìm theo số bài, tên tiếng Anh hoặc tên tiếng Việt không dấu. Tab “Đã mở” chỉ liệt kê các bài đã từng mở. Danh sách chọn bài, tìm kiếm và đường dẫn trực tiếp đều tuân theo tiến độ; không hiển thị tên bài chưa đọc đến. Các bài đã mở được giữ lại ngay cả khi hoàn tác một lần đánh dấu hoàn thành.
- **Sao lưu:** biểu tượng tải xuống ở màn Đã đọc mở phần xuất/nhập tiến độ. Nhập sẽ gộp lịch sử, tránh đếm trùng cùng bài trong cùng ngày.
- **Hỏi AI:** giữ chọn câu để mở bản dịch, nhập từ/cụm từ vào ô “Hỏi AI...” rồi bấm nút gửi hoặc Enter. Hỏi tiếng Anh để hiểu nghĩa trong câu; hỏi tiếng Việt để hiểu vì sao bản dịch dùng từ đó. Khi đang xử lý sẽ hiện “AI đang suy nghĩ...”; trả lời xuất hiện dần trong box. Đổi câu hoặc đóng box sẽ hủy lượt hỏi đang chờ.

Tiến độ, lịch đọc, cỡ chữ và log AI được lưu **riêng theo tài khoản trong SQLite** trên máy chủ. Đăng nhập cùng tài khoản trên thiết bị khác để tiếp tục; trang tải dữ liệu mới khi mở hoặc quay lại tab. Các thao tác đọc được cập nhật bằng giao dịch để hai thiết bị không ghi đè toàn bộ lịch sử của nhau. Bộ nhớ trình duyệt chỉ giữ hàng đợi thử lại riêng từng tài khoản khi mất kết nối; cần mở lại trang để gửi phần chưa lưu lên máy chủ. Font tải từ Google Fonts; nếu không có mạng, trình duyệt dùng font dự phòng.

Database mặc định là **`storage/study.sqlite` ở thư mục gốc**, tự tạo lần đầu chạy. Có thể đổi bằng `STUDY_DB_PATH` trong `.env` (đường dẫn tương đối tính từ gốc dự án). Database chứa bảng tài khoản, phiên đăng nhập, tiến độ và log AI. Mật khẩu được băm bằng scrypt; phiên dùng cookie HttpOnly, SameSite=Lax, có Secure khi truy cập HTTPS qua ngrok. Database và các file SQLite đi kèm đã được `.gitignore` loại trừ. Khi cần sao lưu toàn bộ tài khoản, dừng server rồi sao chép thư mục `storage/`; bản sao lưu JSON trong giao diện chỉ chứa tiến độ đọc của tài khoản hiện tại.

Tiến độ trình duyệt cũ **không tự gán vào tài khoản mới**, tránh dùng chung máy mà nhận nhầm lịch sử người khác. Sau khi đăng nhập, mở **Đã đọc → Sao lưu → Nhập tiến độ cũ trên máy** để nhận dữ liệu cũ vào đúng tài khoản. Nút này chỉ xuất hiện khi có dữ liệu cũ; nhập không làm mất tiến độ đã có trên tài khoản. Dữ liệu cũ cần được nhập từ đúng trình duyệt và địa chỉ web trước đây.

## Cấu hình Gemini và log Hỏi AI

File `.env` nằm ở **thư mục gốc dự án**, cạnh README này. File đã được tạo sẵn với API key trống; trên bản clone mới, sao chép `.env.example` thành `.env`. Điền key của bạn:

```dotenv
GEMINI_API_KEY=key_cua_ban
GEMINI_MODEL=gemini-3.5-flash-lite
AI_MAX_RESPONSE_CHARS=400
```

Sau khi sửa `.env`, khởi động lại `npm run dev` tại `web`. Có thể dùng `npm start` để chạy cùng máy chủ. Key chỉ được đọc ở máy chủ, không đưa vào HTML/JavaScript hoặc bản build, và `.env` được Git bỏ qua. Không có key thì chức năng đọc, từ vựng và các bản dịch soạn sẵn vẫn dùng được.

Máy chủ gọi API Gemini trực tiếp. Tên model được xác nhận tại [Google AI for Developers](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). Endpoint `POST /api/ai/explain` nhận `lessonId`, `segmentId`, `question`; máy chủ tự lấy cặp câu Anh–Việt đúng từ catalog để gửi kèm câu hỏi. Không tin bản dịch hoặc câu nguồn do trình duyệt tự gửi lên. System prompt có thể chỉnh tại `web/server/prompts/explain-translation.txt`.

Mỗi câu hỏi dài tối đa 200 ký tự. AI được yêu cầu trả lời 1–3 câu tiếng Việt, mặc định **không quá 400 ký tự kể cả khoảng trắng**; máy chủ kiểm tra và cắt gọn nếu model trả dài hơn. `AI_MAX_RESPONSE_CHARS` có thể đặt từ 100 đến 800. Box có chiều cao tối đa theo màn hình và có thể cuộn khi chọn cụm câu dài hoặc bàn phím đang mở.

Log mới nằm trong bảng `ai_logs` của SQLite, gắn với tài khoản đang đăng nhập. Ở màn **Đã đọc**, nút **Nhật ký hỏi AI** mở danh sách riêng của tài khoản, gồm từ đã hỏi, câu trả lời và phần mở rộng xem câu Anh–Việt nguồn. API `GET /api/ai/logs` phân trang 20 bản ghi; máy chủ xác định tài khoản từ phiên đăng nhập, không nhận danh tính người dùng từ nội dung gửi lên. Bản ghi có `timestamp`, `requestId`, `userId`, `lessonId`, `segmentId`, `userInput`, `sourceEnglish`, `translationVietnamese`, `answer`, `model`, `status` và `durationMs`. Lỗi/hủy có `answer: null` và `errorCode`. Log JSONL cũ trong `logs/ai/` vẫn được giữ trên máy và không tự gán cho người dùng nào. Key và database không được phục vụ qua HTTP. Các yêu cầu sai định dạng, không có câu nguồn hoặc bị giới hạn tần suất được từ chối trước khi gọi model.

## Cập nhật dữ liệu

Nguồn nội dung gốc và bản dịch được giữ riêng với giao diện. Cấu trúc dịch được mô tả tại [translations/README.md](data/stage1/translations/README.md).

```powershell
python -X utf8 scripts/validate_readings.py
python -X utf8 scripts/build_lessons.py
python -X utf8 scripts/build_lessons.py --check
python -X utf8 scripts/test_build_lessons.py
```

Web đọc catalog tĩnh `web/data/lessons.json` được tạo bởi lệnh trên. Công cụ ghép lần lượt các thư mục `data/stage*` đã có đủ đoạn đọc, từ vựng và bản dịch thành một danh sách đánh số liên tục. Những thư mục chỉ có danh sách từ được bỏ qua. Khi bổ sung nội dung, thêm các bài phía sau để giữ ổn định số bài và tiến độ cũ. Giao diện tự lấy tổng số bài từ catalog.

Tiến độ từ phiên bản cũ có thể nhập vào tài khoản như hướng dẫn trên, giữ các bài đã biết và không tự làm lộ tên bài chưa từng mở nằm xen giữa. Khóa bài là quy tắc trải nghiệm, không phải cơ chế bảo vệ nội dung catalog khỏi người chủ động đọc mã nguồn.

## Kiểm tra và đóng gói

```powershell
cd web
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

`npm run build` tạo phần giao diện ở `web/dist`. **Web cần máy chủ Node.js** chạy bằng `npm run dev`/`npm start` để đăng nhập và lưu dữ liệu SQLite; chỉ đưa `dist` lên hosting tĩnh sẽ thiếu API. Tunnel ngrok chuyển tiếp giao diện và API trên cùng cổng 5173. Kiểm thử bao gồm đăng ký/đăng nhập/đăng xuất, cô lập dữ liệu nhiều tài khoản, khôi phục sau khi khởi động lại, đồng bộ thiết bị, Gemini giả lập, giao diện điện thoại và các chức năng đọc hiện có. Playwright dùng database riêng trong `outputs/`, cổng 5174 và Gemini giả lập; không tạo tài khoản thử vào database thật hoặc tốn API key.
