# Đọc hiểu tiếng Anh — Stage 2

Bộ bài dùng toàn bộ **500 mục từ** trong `vocab_stage2.txt`: **50 đoạn văn**, mỗi bài có **đúng 10 từ trọng tâm** lấy từ danh sách của stage này. Mỗi mục nguồn được phân vào đúng một file từ vựng. Từ đã học có thể xuất hiện lại ở những bài khác.

Các đoạn dài **82–88 từ**, với nhiều chủ đề: sinh hoạt, học tập, truyện ngắn, cộng đồng, thiên nhiên, gia đình và công việc. Mỗi bài có thể đọc độc lập. Ngoài 10 từ trọng tâm, đoạn văn sử dụng thêm từ nối và từ theo ngữ cảnh để câu chuyện tự nhiên.

## Cách học

1. Đọc bài trong `paragraph` để hiểu ý chính.
2. Mở file cùng tên trong `vocabulary` để xem 10 từ trọng tâm, nghĩa tiếng Việt và số mục nguồn.
3. Đọc lại các từ **in đậm**, rồi thử kể nội dung bằng vài câu tiếng Anh.
4. Trên web, giữ vào câu để xem bản dịch tiếng Việt tương ứng.

Từ trọng tâm xuất hiện đúng dạng nguồn, không phân biệt chữ hoa/thường; tên ngôn ngữ như English và Vietnamese được viết hoa theo tiếng Anh. Nghĩa tiếng Việt được giữ nguyên từ file nguồn. Một đoạn chỉ cần minh họa một nghĩa phù hợp nếu từ có nhiều nghĩa.

## Dữ liệu cho web

- `paragraph/`: 50 file Markdown tiếng Anh, có liên kết sang từ vựng.
- `vocabulary/`: 50 file Markdown cùng tên với bài đọc.
- `translations/`: 50 file JSON, gồm 349 bản dịch theo câu.
- Trên web, các bài của stage này nối tiếp thành **bài 51–100**. Số trong tên file và `lessonId` của bản dịch là số nội bộ stage; công cụ build tạo số liên tục cho web.

Các file dùng UTF-8. Chạy từ thư mục gốc dự án:

```powershell
python -X utf8 scripts/validate_readings.py
python -X utf8 scripts/build_lessons.py
python -X utf8 scripts/build_lessons.py --check
```

## Mục lục

| Bài | Chủ đề | Đoạn văn | 10 từ trọng tâm | Mục từ nguồn |
| --- | --- | --- | --- | --- |
| 01 | Tuần làm việc đầu tiên của tôi | [Đọc](paragraph/01_my_first_week_at_work.md) | [Từ vựng](vocabulary/01_my_first_week_at_work.md) | 0501–0510 |
| 02 | Kế hoạch cho tiệm bánh | [Đọc](paragraph/02_a_plan_for_the_bakery.md) | [Từ vựng](vocabulary/02_a_plan_for_the_bakery.md) | 0511–0520 |
| 03 | Cây cầu bị đổ | [Đọc](paragraph/03_the_bridge_that_fell.md) | [Từ vựng](vocabulary/03_the_bridge_that_fell.md) | 0521–0530 |
| 04 | Email từ thư viện | [Đọc](paragraph/04_an_email_from_the_library.md) | [Từ vựng](vocabulary/04_an_email_from_the_library.md) | 0531–0540 |
| 05 | Trang giấy bị thiếu | [Đọc](paragraph/05_the_missing_page.md) | [Từ vựng](vocabulary/05_the_missing_page.md) | 0541–0550 |
| 06 | Một bộ phim cho bà | [Đọc](paragraph/06_a_film_for_grandma.md) | [Từ vựng](vocabulary/06_a_film_for_grandma.md) | 0551–0560 |
| 07 | Một trang viết về ong | [Đọc](paragraph/07_a_page_about_bees.md) | [Từ vựng](vocabulary/07_a_page_about_bees.md) | 0561–0570 |
| 08 | Không chỉ là điểm kiểm tra | [Đọc](paragraph/08_more_than_a_test_score.md) | [Từ vựng](vocabulary/08_more_than_a_test_score.md) | 0571–0580 |
| 09 | Hai người bạn cùng học | [Đọc](paragraph/09_two_friends_learning_together.md) | [Từ vựng](vocabulary/09_two_friends_learning_together.md) | 0581–0590 |
| 10 | Sinh viên mới ở tuổi sáu mươi | [Đọc](paragraph/10_a_new_student_at_sixty.md) | [Từ vựng](vocabulary/10_a_new_student_at_sixty.md) | 0591–0600 |
| 11 | Tấm bản đồ từ những kỷ niệm | [Đọc](paragraph/11_a_map_made_of_memories.md) | [Từ vựng](vocabulary/11_a_map_made_of_memories.md) | 0601–0610 |
| 12 | Đường đi đến cối xay cũ | [Đọc](paragraph/12_the_walk_to_the_old_mill.md) | [Từ vựng](vocabulary/12_the_walk_to_the_old_mill.md) | 0611–0620 |
| 13 | Tìm phòng đọc sách | [Đọc](paragraph/13_finding_the_reading_room.md) | [Từ vựng](vocabulary/13_finding_the_reading_room.md) | 0621–0630 |
| 14 | Cách đến trường thuận tiện hơn | [Đọc](paragraph/14_a_better_way_to_school.md) | [Từ vựng](vocabulary/14_a_better_way_to_school.md) | 0631–0640 |
| 15 | Một nhà ga, nhiều hành trình | [Đọc](paragraph/15_one_station_many_journeys.md) | [Từ vựng](vocabulary/15_one_station_many_journeys.md) | 0641–0650 |
| 16 | Chiếc vali có dải ruy băng vàng | [Đọc](paragraph/16_the_suitcase_with_a_yellow_ribbon.md) | [Từ vựng](vocabulary/16_the_suitcase_with_a_yellow_ribbon.md) | 0651–0660 |
| 17 | Một nơi yên tĩnh để nghỉ | [Đọc](paragraph/17_a_quiet_place_to_stay.md) | [Từ vựng](vocabulary/17_a_quiet_place_to_stay.md) | 0661–0670 |
| 18 | Quang cảnh từ ngôi nhà mới | [Đọc](paragraph/18_the_view_from_our_new_home.md) | [Từ vựng](vocabulary/18_the_view_from_our_new_home.md) | 0671–0680 |
| 19 | Bưu thiếp gửi em họ | [Đọc](paragraph/19_a_postcard_for_my_cousin.md) | [Từ vựng](vocabulary/19_a_postcard_for_my_cousin.md) | 0681–0690 |
| 20 | Hòn đảo trong sổ tay | [Đọc](paragraph/20_the_island_in_my_notebook.md) | [Từ vựng](vocabulary/20_the_island_in_my_notebook.md) | 0691–0700 |
| 21 | Dụng cụ cho vườn trường | [Đọc](paragraph/21_a_tool_for_our_school_garden.md) | [Từ vựng](vocabulary/21_a_tool_for_our_school_garden.md) | 0701–0710 |
| 22 | Chiếc bàn bên cửa sổ | [Đọc](paragraph/22_the_table_by_the_window.md) | [Từ vựng](vocabulary/22_the_table_by_the_window.md) | 0711–0720 |
| 23 | Chiếc ví dưới ghế dài | [Đọc](paragraph/23_the_wallet_under_the_bench.md) | [Từ vựng](vocabulary/23_the_wallet_under_the_bench.md) | 0721–0730 |
| 24 | Xếp đồ cho nhiều kiểu thời tiết | [Đọc](paragraph/24_packing_for_different_weather.md) | [Từ vựng](vocabulary/24_packing_for_different_weather.md) | 0731–0740 |
| 25 | Chiếc hộp trang phục | [Đọc](paragraph/25_the_costume_box.md) | [Từ vựng](vocabulary/25_the_costume_box.md) | 0741–0750 |
| 26 | Món quà từ vật liệu thừa | [Đọc](paragraph/26_the_gift_made_from_scraps.md) | [Từ vựng](vocabulary/26_the_gift_made_from_scraps.md) | 0751–0760 |
| 27 | Phiên chợ đồ cũ và mới | [Đọc](paragraph/27_a_market_for_old_and_new_things.md) | [Từ vựng](vocabulary/27_a_market_for_old_and_new_things.md) | 0761–0770 |
| 28 | Chọn ghế cho ông | [Đọc](paragraph/28_choosing_a_chair_for_grandpa.md) | [Từ vựng](vocabulary/28_choosing_a_chair_for_grandpa.md) | 0771–0780 |
| 29 | Cây cầu nhỏ trong bức tranh | [Đọc](paragraph/29_the_little_bridge_in_the_picture.md) | [Từ vựng](vocabulary/29_the_little_bridge_in_the_picture.md) | 0781–0790 |
| 30 | Bữa trưa sau cơn mưa | [Đọc](paragraph/30_lunch_after_the_rain.md) | [Từ vựng](vocabulary/30_lunch_after_the_rain.md) | 0791–0800 |
| 31 | Quán cà phê có hai gian bếp | [Đọc](paragraph/31_the_cafe_with_two_kitchens.md) | [Từ vựng](vocabulary/31_the_cafe_with_two_kitchens.md) | 0801–0810 |
| 32 | Bữa tối từ phiên chợ | [Đọc](paragraph/32_dinner_from_the_market.md) | [Từ vựng](vocabulary/32_dinner_from_the_market.md) | 0811–0820 |
| 33 | Giỏ trái cây cuối cùng | [Đọc](paragraph/33_the_last_basket_of_fruit.md) | [Từ vựng](vocabulary/33_the_last_basket_of_fruit.md) | 0821–0830 |
| 34 | Buổi dã ngoại trong sân | [Đọc](paragraph/34_a_picnic_in_the_courtyard.md) | [Từ vựng](vocabulary/34_a_picnic_in_the_courtyard.md) | 0831–0840 |
| 35 | Bữa tiệc sinh nhật nhỏ nhất | [Đọc](paragraph/35_the_smallest_birthday_party.md) | [Từ vựng](vocabulary/35_the_smallest_birthday_party.md) | 0841–0850 |
| 36 | Thử vị cùng ông | [Đọc](paragraph/36_grandpa_s_taste_test.md) | [Từ vựng](vocabulary/36_grandpa_s_taste_test.md) | 0851–0860 |
| 37 | Bữa trưa ở quán cà phê sân vườn | [Đọc](paragraph/37_lunch_at_the_garden_cafe.md) | [Từ vựng](vocabulary/37_lunch_at_the_garden_cafe.md) | 0861–0870 |
| 38 | Khuôn mặt trong gương | [Đọc](paragraph/38_the_face_in_the_mirror.md) | [Từ vựng](vocabulary/38_the_face_in_the_mirror.md) | 0871–0880 |
| 39 | Vẽ người đang chuyển động | [Đọc](paragraph/39_drawing_a_moving_person.md) | [Từ vựng](vocabulary/39_drawing_a_moving_person.md) | 0881–0890 |
| 40 | Dấu chân trên sàn | [Đọc](paragraph/40_the_footprint_on_the_floor.md) | [Từ vựng](vocabulary/40_the_footprint_on_the_floor.md) | 0891–0900 |
| 41 | Buổi sáng yên tĩnh ở phòng khám | [Đọc](paragraph/41_a_quiet_morning_at_the_clinic.md) | [Từ vựng](vocabulary/41_a_quiet_morning_at_the_clinic.md) | 0901–0910 |
| 42 | Nghỉ chân bên dòng sông | [Đọc](paragraph/42_a_rest_beside_the_river.md) | [Từ vựng](vocabulary/42_a_rest_beside_the_river.md) | 0911–0920 |
| 43 | Thử thách ở sân chơi | [Đọc](paragraph/43_the_playground_challenge.md) | [Từ vựng](vocabulary/43_the_playground_challenge.md) | 0921–0930 |
| 44 | Lời mời tham gia câu lạc bộ sách | [Đọc](paragraph/44_the_book_club_invitation.md) | [Từ vựng](vocabulary/44_the_book_club_invitation.md) | 0931–0940 |
| 45 | Luyện bài nói ở trường | [Đọc](paragraph/45_practicing_the_school_talk.md) | [Từ vựng](vocabulary/45_practicing_the_school_talk.md) | 0941–0950 |
| 46 | Lớp tôi làm tạp chí | [Đọc](paragraph/46_our_class_makes_a_magazine.md) | [Từ vựng](vocabulary/46_our_class_makes_a_magazine.md) | 0951–0960 |
| 47 | Chuẩn bị bữa trưa cho hội chợ trường | [Đọc](paragraph/47_saving_the_school_fair_lunch.md) | [Từ vựng](vocabulary/47_saving_the_school_fair_lunch.md) | 0961–0970 |
| 48 | Buổi học nấu ăn cho mọi người | [Đọc](paragraph/48_a_cooking_lesson_for_everyone.md) | [Từ vựng](vocabulary/48_a_cooking_lesson_for_everyone.md) | 0971–0980 |
| 49 | Chiếc máy in không chịu hoạt động | [Đọc](paragraph/49_the_printer_that_would_not_work.md) | [Từ vựng](vocabulary/49_the_printer_that_would_not_work.md) | 0981–0990 |
| 50 | Học cách chia sẻ ảnh | [Đọc](paragraph/50_learning_to_share_a_photo.md) | [Từ vựng](vocabulary/50_learning_to_share_a_photo.md) | 0991–1000 |
