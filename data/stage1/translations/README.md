# Bản dịch đối chiếu Anh–Việt

Mỗi file JSON cùng tên với một bài trong `../paragraph`. Đây là nguồn bản dịch mà web sử dụng; không gọi dịch tự động hoặc dịch vụ bên ngoài khi người học giữ vào câu.

```json
{
  "schemaVersion": 1,
  "lessonId": 1,
  "sourceFile": "paragraph/01_a_new_friend.md",
  "sourceSha256": "mã SHA-256 của phần tiếng Anh, bỏ dấu in đậm Markdown",
  "language": "vi",
  "segments": [
    {
      "id": "s1-01-01",
      "kind": "sentence",
      "en": "I meet a new family at the house next to mine.",
      "vi": "Tôi làm quen với một gia đình mới ở ngôi nhà bên cạnh nhà mình."
    }
  ]
}
```

- `id`: mã ổn định để web biết phần tiếng Anh nào ứng với bản dịch nào.
- `kind`: `sentence` cho một câu; `group` cho nhóm câu cần đọc/dịch cùng nhau, chẳng hạn hỏi–đáp, câu có đại từ nối tiếp hoặc một lời nhắn.
- `en`: giữ nguyên nội dung tiếng Anh gốc, kể cả dấu câu. Ghép các `en` bằng một dấu cách phải khôi phục đúng toàn bộ đoạn văn.
- `vi`: bản dịch theo ngữ cảnh; giữ nhất quán cách xưng hô trong từng câu chuyện.
- `sourceSha256`: phát hiện đoạn gốc thay đổi để người biên soạn cập nhật bản dịch, tránh hiển thị bản dịch cũ cho nội dung mới.

Khi sửa bản dịch, chỉnh file JSON ở thư mục này rồi chạy từ thư mục gốc:

```powershell
python -X utf8 scripts/build_lessons.py
python -X utf8 scripts/build_lessons.py --check
```

Lệnh đầu tạo lại `web/data/lessons.json`; lệnh thứ hai chỉ kiểm tra. Công cụ nối các stage có bài đọc thành danh sách liên tục, kiểm tra toàn bộ đoạn gốc được map đầy đủ, không thiếu bản dịch, mỗi bài có 10 từ trọng tâm và phủ đủ mục từ nguồn của các stage. Hiện có 200 bài với 2.000 mục từ; riêng stage 1 có 50 bài với 500 mục từ.

Nếu sửa đoạn tiếng Anh, cần sửa `segments.en`, bản dịch liên quan và cập nhật `sourceSha256` sau khi đối chiếu. Không bỏ qua kiểm tra mã nguồn để giữ bản dịch cũ.

`scripts/author_translations.py` là công cụ biên soạn ban đầu, từ chối ghi đè lên các bản dịch đã có. Các file JSON là nguồn chỉnh sửa chính thức sau lần tạo đầu tiên.
