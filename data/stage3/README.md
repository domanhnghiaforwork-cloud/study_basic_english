# Đọc hiểu tiếng Anh — Stage 3

Bộ bài dùng toàn bộ **1000 mục từ** trong `vocab_stage3.txt`: **100 đoạn văn**, mỗi bài có **đúng 10 từ trọng tâm** lấy từ danh sách của stage này. Mỗi mục nguồn được phân vào đúng một file từ vựng. Từ đã học có thể xuất hiện lại ở những bài khác.

Các đoạn dài **82–100 từ**, với nhiều chủ đề: sinh hoạt, học tập, truyện ngắn, cộng đồng, thiên nhiên, gia đình và công việc. Mỗi bài có thể đọc độc lập. Ngoài 10 từ trọng tâm, đoạn văn sử dụng thêm từ nối và từ theo ngữ cảnh để câu chuyện tự nhiên.

## Cách học

1. Đọc bài trong `paragraph` để hiểu ý chính.
2. Mở file cùng tên trong `vocabulary` để xem 10 từ trọng tâm, nghĩa tiếng Việt và số mục nguồn.
3. Đọc lại các từ **in đậm**, rồi thử kể nội dung bằng vài câu tiếng Anh.
4. Trên web, giữ vào câu để xem bản dịch tiếng Việt tương ứng.

Từ trọng tâm xuất hiện đúng dạng nguồn, không phân biệt chữ hoa/thường; tên ngôn ngữ như English và Vietnamese được viết hoa theo tiếng Anh. Nghĩa tiếng Việt được giữ nguyên từ file nguồn. Một đoạn chỉ cần minh họa một nghĩa phù hợp nếu từ có nhiều nghĩa.

## Dữ liệu cho web

- `paragraph/`: 100 file Markdown tiếng Anh, có liên kết sang từ vựng.
- `vocabulary/`: 100 file Markdown cùng tên với bài đọc.
- `translations/`: 100 file JSON, gồm 670 bản dịch theo câu.
- Trên web, các bài của stage này nối tiếp thành **bài 101–200**. Số trong tên file và `lessonId` của bản dịch là số nội bộ stage; công cụ build tạo số liên tục cho web.

Các file dùng UTF-8. Chạy từ thư mục gốc dự án:

```powershell
python -X utf8 scripts/validate_readings.py
python -X utf8 scripts/build_lessons.py
python -X utf8 scripts/build_lessons.py --check
```

## Mục lục

| Bài | Chủ đề | Đoạn văn | 10 từ trọng tâm | Mục từ nguồn |
| --- | --- | --- | --- | --- |
| 01 | Mở cửa xưởng học tập | [Đọc](paragraph/01_opening_the_workshop_doors.md) | [Từ vựng](vocabulary/01_opening_the_workshop_doors.md) | 1001–1010 |
| 02 | Tin nhắn thiếu ngữ cảnh | [Đọc](paragraph/02_a_message_without_its_context.md) | [Từ vựng](vocabulary/02_a_message_without_its_context.md) | 1011–1020 |
| 03 | Khu vườn mà mọi người mong muốn | [Đọc](paragraph/03_the_garden_everyone_wanted.md) | [Từ vựng](vocabulary/03_the_garden_everyone_wanted.md) | 1021–1030 |
| 04 | Quãng đường dài đến buổi hòa nhạc | [Đọc](paragraph/04_the_long_walk_to_the_concert.md) | [Từ vựng](vocabulary/04_the_long_walk_to_the_concert.md) | 1031–1040 |
| 05 | Mỗi sáng một trang viết | [Đọc](paragraph/05_one_page_every_morning.md) | [Từ vựng](vocabulary/05_one_page_every_morning.md) | 1041–1050 |
| 06 | Câu chuyện đằng sau một cái tên | [Đọc](paragraph/06_the_story_beneath_a_name.md) | [Từ vựng](vocabulary/06_the_story_beneath_a_name.md) | 1051–1060 |
| 07 | Một buổi thử vai khác | [Đọc](paragraph/07_a_different_kind_of_audition.md) | [Từ vựng](vocabulary/07_a_different_kind_of_audition.md) | 1061–1070 |
| 08 | Bí mật căn phòng đồng hồ | [Đọc](paragraph/08_the_secret_of_the_clock_room.md) | [Từ vựng](vocabulary/08_the_secret_of_the_clock_room.md) | 1071–1080 |
| 09 | Khi đội mất đội trưởng | [Đọc](paragraph/09_when_the_team_lost_its_captain.md) | [Từ vựng](vocabulary/09_when_the_team_lost_its_captain.md) | 1081–1090 |
| 10 | Cuộc bàn bạc về chiếc ghế hỏng | [Đọc](paragraph/10_the_broken_bench_debate.md) | [Từ vựng](vocabulary/10_the_broken_bench_debate.md) | 1091–1100 |
| 11 | Dự án đất nước tưởng tượng | [Đọc](paragraph/11_the_imaginary_country_project.md) | [Từ vựng](vocabulary/11_the_imaginary_country_project.md) | 1101–1110 |
| 12 | Phiên tòa trên sân khấu lớp học | [Đọc](paragraph/12_the_trial_on_the_classroom_stage.md) | [Từ vựng](vocabulary/12_the_trial_on_the_classroom_stage.md) | 1111–1120 |
| 13 | Lá thư trong bộ quân phục | [Đọc](paragraph/13_the_letter_inside_the_uniform.md) | [Từ vựng](vocabulary/13_the_letter_inside_the_uniform.md) | 1121–1130 |
| 14 | Hội đồng trong hội trường trường học | [Đọc](paragraph/14_a_council_in_the_school_hall.md) | [Từ vựng](vocabulary/14_a_council_in_the_school_hall.md) | 1131–1140 |
| 15 | Cuộc bầu chọn để cải thiện căng tin | [Đọc](paragraph/15_the_election_for_a_better_canteen.md) | [Từ vựng](vocabulary/15_the_election_for_a_better_canteen.md) | 1141–1150 |
| 16 | Xin phép tổ chức hội chợ đường phố | [Đọc](paragraph/16_permission_for_the_street_fair.md) | [Từ vựng](vocabulary/16_permission_for_the_street_fair.md) | 1151–1160 |
| 17 | Tờ thông báo không ai đọc | [Đọc](paragraph/17_the_notice_nobody_read.md) | [Từ vựng](vocabulary/17_the_notice_nobody_read.md) | 1161–1170 |
| 18 | Một câu chuyện đáng lắng nghe | [Đọc](paragraph/18_a_story_worth_listening_to.md) | [Từ vựng](vocabulary/18_a_story_worth_listening_to.md) | 1171–1180 |
| 19 | Nhiều bàn ăn, một lễ hội | [Đọc](paragraph/19_different_tables_one_festival.md) | [Từ vựng](vocabulary/19_different_tables_one_festival.md) | 1181–1190 |
| 20 | Mùa xuân bên cửa sổ lớp học | [Đọc](paragraph/20_spring_beside_the_classroom_window.md) | [Từ vựng](vocabulary/20_spring_beside_the_classroom_window.md) | 1191–1200 |
| 21 | Bốn lá thư từ cùng một ô cửa | [Đọc](paragraph/21_four_letters_from_the_same_window.md) | [Từ vựng](vocabulary/21_four_letters_from_the_same_window.md) | 1201–1210 |
| 22 | Đêm thời tiết thay đổi | [Đọc](paragraph/22_the_night_the_weather_changed.md) | [Từ vựng](vocabulary/22_the_night_the_weather_changed.md) | 1211–1220 |
| 23 | Tên lửa phía trên những mái nhà | [Đọc](paragraph/23_a_rocket_above_the_rooftops.md) | [Từ vựng](vocabulary/23_a_rocket_above_the_rooftops.md) | 1221–1230 |
| 24 | Phong cảnh trong chiếc hộp | [Đọc](paragraph/24_the_landscape_inside_a_box.md) | [Từ vựng](vocabulary/24_the_landscape_inside_a_box.md) | 1231–1240 |
| 25 | Lớp bụi trên cửa sổ | [Đọc](paragraph/25_the_dust_on_the_window.md) | [Từ vựng](vocabulary/25_the_dust_on_the_window.md) | 1241–1250 |
| 26 | Dòng sông sau xưởng | [Đọc](paragraph/26_the_river_behind_the_workshop.md) | [Từ vựng](vocabulary/26_the_river_behind_the_workshop.md) | 1251–1260 |
| 27 | Nguồn điện cho ngọn hải đăng nhỏ | [Đọc](paragraph/27_power_for_the_little_lighthouse.md) | [Từ vựng](vocabulary/27_power_for_the_little_lighthouse.md) | 1261–1270 |
| 28 | Khu rừng lưu giữ những câu chuyện | [Đọc](paragraph/28_the_forest_that_kept_its_stories.md) | [Từ vựng](vocabulary/28_the_forest_that_kept_its_stories.md) | 1271–1280 |
| 29 | Hạt giống trong phong bì | [Đọc](paragraph/29_the_seed_in_the_envelope.md) | [Từ vựng](vocabulary/29_the_seed_in_the_envelope.md) | 1281–1290 |
| 30 | Làm nông dân trong một buổi sáng | [Đọc](paragraph/30_a_farmer_for_one_morning.md) | [Từ vựng](vocabulary/30_a_farmer_for_one_morning.md) | 1291–1300 |
| 31 | Chuyện nhầm cổng buổi sáng | [Đọc](paragraph/31_the_morning_gate_mix_up.md) | [Từ vựng](vocabulary/31_the_morning_gate_mix_up.md) | 1301–1310 |
| 32 | Những con vật trong cuốn sách trên gác mái | [Đọc](paragraph/32_the_animals_in_the_attic_book.md) | [Từ vựng](vocabulary/32_the_animals_in_the_attic_book.md) | 1311–1320 |
| 33 | Những tấm nhãn bị thiếu ở sở thú | [Đọc](paragraph/33_the_missing_zoo_labels.md) | [Từ vựng](vocabulary/33_the_missing_zoo_labels.md) | 1321–1330 |
| 34 | Trò chơi bàn giải cứu động vật | [Đọc](paragraph/34_the_animal_rescue_board_game.md) | [Từ vựng](vocabulary/34_the_animal_rescue_board_game.md) | 1331–1340 |
| 35 | Bảo tàng tí hon trong vườn | [Đọc](paragraph/35_the_tiny_museum_in_our_garden.md) | [Từ vựng](vocabulary/35_the_tiny_museum_in_our_garden.md) | 1341–1350 |
| 36 | Sinh vật có đôi cánh giấy | [Đọc](paragraph/36_the_creature_with_the_paper_wings.md) | [Từ vựng](vocabulary/36_the_creature_with_the_paper_wings.md) | 1351–1360 |
| 37 | Mùa hè cuối cùng của chú chó già | [Đọc](paragraph/37_the_old_dog_s_last_summer.md) | [Từ vựng](vocabulary/37_the_old_dog_s_last_summer.md) | 1361–1370 |
| 38 | Làm mô hình cho giờ khoa học | [Đọc](paragraph/38_building_a_model_for_science_class.md) | [Từ vựng](vocabulary/38_building_a_model_for_science_class.md) | 1371–1380 |
| 39 | Hành trình của chiếc bánh mì kẹp | [Đọc](paragraph/39_the_journey_of_a_sandwich.md) | [Từ vựng](vocabulary/39_the_journey_of_a_sandwich.md) | 1381–1390 |
| 40 | Những từ ngữ trong phòng chờ | [Đọc](paragraph/40_words_for_the_waiting_room.md) | [Từ vựng](vocabulary/40_words_for_the_waiting_room.md) | 1391–1400 |
| 41 | Những câu hỏi trong sổ xanh | [Đọc](paragraph/41_the_questions_in_the_blue_notebook.md) | [Từ vựng](vocabulary/41_the_questions_in_the_blue_notebook.md) | 1401–1410 |
| 42 | Các nhân vật trong vở kịch phòng khám | [Đọc](paragraph/42_the_characters_in_the_clinic_play.md) | [Từ vựng](vocabulary/42_the_characters_in_the_clinic_play.md) | 1411–1420 |
| 43 | Những người sau cánh cửa bệnh viện | [Đọc](paragraph/43_the_people_behind_the_hospital_doors.md) | [Từ vựng](vocabulary/43_the_people_behind_the_hospital_doors.md) | 1421–1430 |
| 44 | Cuốn sổ cho những ngày khó khăn | [Đọc](paragraph/44_a_notebook_for_difficult_days.md) | [Từ vựng](vocabulary/44_a_notebook_for_difficult_days.md) | 1431–1440 |
| 45 | Bức tường trở thành tranh | [Đọc](paragraph/45_the_wall_that_became_a_mural.md) | [Từ vựng](vocabulary/45_the_wall_that_became_a_mural.md) | 1441–1450 |
| 46 | Người bạn tôi suýt đánh mất | [Đọc](paragraph/46_the_friend_i_almost_lost.md) | [Từ vựng](vocabulary/46_the_friend_i_almost_lost.md) | 1451–1460 |
| 47 | Bức ảnh cưới | [Đọc](paragraph/47_the_wedding_photograph.md) | [Từ vựng](vocabulary/47_the_wedding_photograph.md) | 1461–1470 |
| 48 | Những nhánh trong gia phả | [Đọc](paragraph/48_branches_of_our_family_tree.md) | [Từ vựng](vocabulary/48_branches_of_our_family_tree.md) | 1471–1480 |
| 49 | Tấm thiệp mời trong ngăn kéo | [Đọc](paragraph/49_the_invitation_in_the_drawer.md) | [Từ vựng](vocabulary/49_the_invitation_in_the_drawer.md) | 1481–1490 |
| 50 | Bất ngờ ở ngày hội nghề nghiệp | [Đọc](paragraph/50_the_career_fair_surprise.md) | [Từ vựng](vocabulary/50_the_career_fair_surprise.md) | 1491–1500 |
| 51 | Cửa hàng trống ở góc phố | [Đọc](paragraph/51_the_empty_shop_on_the_corner.md) | [Từ vựng](vocabulary/51_the_empty_shop_on_the_corner.md) | 1501–1510 |
| 52 | Bữa sáng trước hội chợ | [Đọc](paragraph/52_breakfast_before_the_street_fair.md) | [Từ vựng](vocabulary/52_breakfast_before_the_street_fair.md) | 1511–1520 |
| 53 | Đêm sân khấu tắt đèn | [Đọc](paragraph/53_the_night_the_stage_went_dark.md) | [Từ vựng](vocabulary/53_the_night_the_stage_went_dark.md) | 1521–1530 |
| 54 | Tấm áp phích có quá nhiều tên | [Đọc](paragraph/54_the_poster_with_too_many_names.md) | [Từ vựng](vocabulary/54_the_poster_with_too_many_names.md) | 1531–1540 |
| 55 | Chuyến phà trở thành sân khấu | [Đọc](paragraph/55_the_ferry_that_became_a_stage.md) | [Từ vựng](vocabulary/55_the_ferry_that_became_a_stage.md) | 1541–1550 |
| 56 | Ngày bận rộn ở tòa thị chính | [Đọc](paragraph/56_a_busy_day_at_the_town_hall.md) | [Từ vựng](vocabulary/56_a_busy_day_at_the_town_hall.md) | 1551–1560 |
| 57 | Xưởng dưới sự quản lý mới | [Đọc](paragraph/57_the_workshop_under_new_management.md) | [Từ vựng](vocabulary/57_the_workshop_under_new_management.md) | 1561–1570 |
| 58 | Thông báo cạnh máy chấm công | [Đọc](paragraph/58_the_notice_beside_the_time_clock.md) | [Từ vựng](vocabulary/58_the_notice_beside_the_time_clock.md) | 1571–1580 |
| 59 | Buổi phỏng vấn ở bảo tàng tài chính | [Đọc](paragraph/59_the_interview_at_the_finance_museum.md) | [Từ vựng](vocabulary/59_the_interview_at_the_finance_museum.md) | 1581–1590 |
| 60 | Hành trình dài của một bưu kiện | [Đọc](paragraph/60_a_long_journey_for_one_parcel.md) | [Từ vựng](vocabulary/60_a_long_journey_for_one_parcel.md) | 1591–1600 |
| 61 | Chiếc hộp cuối nhà kho | [Đọc](paragraph/61_the_box_at_the_back_of_the_warehouse.md) | [Từ vựng](vocabulary/61_the_box_at_the_back_of_the_warehouse.md) | 1601–1610 |
| 62 | Ngân hàng trong trò chơi bàn | [Đọc](paragraph/62_the_bank_in_our_board_game.md) | [Từ vựng](vocabulary/62_the_bank_in_our_board_game.md) | 1611–1620 |
| 63 | Ngôi nhà trong bài học kinh tế | [Đọc](paragraph/63_the_house_in_the_economics_lesson.md) | [Từ vựng](vocabulary/63_the_house_in_the_economics_lesson.md) | 1621–1630 |
| 64 | Cửa hàng đồ chơi bên kia biên giới | [Đọc](paragraph/64_the_toy_shop_across_the_border.md) | [Từ vựng](vocabulary/64_the_toy_shop_across_the_border.md) | 1631–1640 |
| 65 | Tấm áp phích không bán được gì | [Đọc](paragraph/65_the_poster_that_sold_nothing.md) | [Từ vựng](vocabulary/65_the_poster_that_sold_nothing.md) | 1641–1650 |
| 66 | Hóa đơn đầu tiên của câu lạc bộ sửa chữa | [Đọc](paragraph/66_the_repair_club_s_first_invoice.md) | [Từ vựng](vocabulary/66_the_repair_club_s_first_invoice.md) | 1651–1660 |
| 67 | Cửa hàng có hai nhãn giá | [Đọc](paragraph/67_the_shop_with_two_price_tags.md) | [Từ vựng](vocabulary/67_the_shop_with_two_price_tags.md) | 1661–1670 |
| 68 | Nông trại học cách lắng nghe | [Đọc](paragraph/68_a_farm_that_learned_to_listen.md) | [Từ vựng](vocabulary/68_a_farm_that_learned_to_listen.md) | 1671–1680 |
| 69 | Cánh cửa cổ trong bảo tàng mới | [Đọc](paragraph/69_the_ancient_door_in_the_new_museum.md) | [Từ vựng](vocabulary/69_the_ancient_door_in_the_new_museum.md) | 1681–1690 |
| 70 | Cẩn thận tìm chiếc chìa khóa thất lạc | [Đọc](paragraph/70_the_careful_search_for_a_lost_key.md) | [Từ vựng](vocabulary/70_the_careful_search_for_a_lost_key.md) | 1691–1700 |
| 71 | Chú robot hay đặt câu hỏi | [Đọc](paragraph/71_the_robot_that_asked_questions.md) | [Từ vựng](vocabulary/71_the_robot_that_asked_questions.md) | 1701–1710 |
| 72 | Đường dốc ở nhà ga xa xôi | [Đọc](paragraph/72_the_ramp_at_the_distant_station.md) | [Từ vựng](vocabulary/72_the_ramp_at_the_distant_station.md) | 1711–1720 |
| 73 | Điều thú vị trong câu chuyện quen thuộc | [Đọc](paragraph/73_the_exciting_part_of_a_familiar_story.md) | [Từ vựng](vocabulary/73_the_exciting_part_of_a_familiar_story.md) | 1721–1730 |
| 74 | Bữa tối trang trọng với những bài phát biểu vui | [Đọc](paragraph/74_a_formal_dinner_with_funny_speeches.md) | [Từ vựng](vocabulary/74_a_formal_dinner_with_funny_speeches.md) | 1731–1740 |
| 75 | Bài nhận xét trung thực về vở kịch trường | [Đọc](paragraph/75_the_honest_review_of_the_school_play.md) | [Từ vựng](vocabulary/75_the_honest_review_of_the_school_play.md) | 1741–1750 |
| 76 | Chú chó ồn ào nhất phố | [Đọc](paragraph/76_the_loudest_dog_in_the_street.md) | [Từ vựng](vocabulary/76_the_loudest_dog_in_the_street.md) | 1751–1760 |
| 77 | Chiếc hộp bình thường chứa những điều quý giá | [Đọc](paragraph/77_the_ordinary_box_with_precious_things.md) | [Từ vựng](vocabulary/77_the_ordinary_box_with_precious_things.md) | 1761–1770 |
| 78 | Học thích nghi ở tiệm sửa chữa | [Đọc](paragraph/78_learning_to_adapt_at_the_repair_shop.md) | [Từ vựng](vocabulary/78_learning_to_adapt_at_the_repair_shop.md) | 1771–1780 |
| 79 | Xin tham gia triển lãm | [Đọc](paragraph/79_asking_to_join_the_exhibition.md) | [Từ vựng](vocabulary/79_asking_to_join_the_exhibition.md) | 1781–1790 |
| 80 | Cuộc tranh luận trước buổi dã ngoại | [Đọc](paragraph/80_the_debate_before_the_picnic.md) | [Từ vựng](vocabulary/80_the_debate_before_the_picnic.md) | 1791–1800 |
| 81 | Nhóm lễ hội học cách trao đổi | [Đọc](paragraph/81_the_festival_team_learns_to_talk.md) | [Từ vựng](vocabulary/81_the_festival_team_learns_to_talk.md) | 1801–1810 |
| 82 | Câu lạc bộ suýt đóng cửa | [Đọc](paragraph/82_the_club_that_almost_closed.md) | [Từ vựng](vocabulary/82_the_club_that_almost_closed.md) | 1811–1820 |
| 83 | Những lá thư sau trận lũ | [Đọc](paragraph/83_the_letters_after_the_flood.md) | [Từ vựng](vocabulary/83_the_letters_after_the_flood.md) | 1821–1830 |
| 84 | Một chỗ công bằng trong khu vườn | [Đọc](paragraph/84_a_fair_place_in_the_garden.md) | [Từ vựng](vocabulary/84_a_fair_place_in_the_garden.md) | 1831–1840 |
| 85 | Chú mèo hoang sau quán cà phê | [Đọc](paragraph/85_the_stray_cat_behind_the_cafe.md) | [Từ vựng](vocabulary/85_the_stray_cat_behind_the_cafe.md) | 1841–1850 |
| 86 | Triển lãm chúng tôi chưa từng hình dung | [Đọc](paragraph/86_the_exhibition_we_could_not_imagine.md) | [Từ vựng](vocabulary/86_the_exhibition_we_could_not_imagine.md) | 1851–1860 |
| 87 | Thí nghiệm phải làm lại | [Đọc](paragraph/87_the_experiment_we_had_to_repeat.md) | [Từ vựng](vocabulary/87_the_experiment_we_had_to_repeat.md) | 1861–1870 |
| 88 | Bức ảnh chúng tôi quyết định chưa công bố | [Đọc](paragraph/88_the_photo_we_chose_not_to_release.md) | [Từ vựng](vocabulary/88_the_photo_we_chose_not_to_release.md) | 1871–1880 |
| 89 | Phần thưởng sau tấm màn | [Đọc](paragraph/89_the_prize_behind_the_curtain.md) | [Từ vựng](vocabulary/89_the_prize_behind_the_curtain.md) | 1881–1890 |
| 90 | Bí ẩn những chiếc bánh mì biến mất | [Đọc](paragraph/90_the_mystery_of_the_vanishing_bread.md) | [Từ vựng](vocabulary/90_the_mystery_of_the_vanishing_bread.md) | 1891–1900 |
| 91 | Ứng dụng nói quá lớn | [Đọc](paragraph/91_the_app_that_spoke_too_loudly.md) | [Từ vựng](vocabulary/91_the_app_that_spoke_too_loudly.md) | 1901–1910 |
| 92 | Trò chơi chúng tôi quyết định thay đổi | [Đọc](paragraph/92_the_game_we_decided_to_change.md) | [Từ vựng](vocabulary/92_the_game_we_decided_to_change.md) | 1911–1920 |
| 93 | Con rối không chịu chớp mắt | [Đọc](paragraph/93_the_puppet_that_would_not_blink.md) | [Từ vựng](vocabulary/93_the_puppet_that_would_not_blink.md) | 1921–1930 |
| 94 | Cuộc thi áp phích hội chợ | [Đọc](paragraph/94_the_fairground_poster_contest.md) | [Từ vựng](vocabulary/94_the_fairground_poster_contest.md) | 1931–1940 |
| 95 | Cây cầu trong trò chơi đạp xe | [Đọc](paragraph/95_a_bridge_in_the_bicycle_game.md) | [Từ vựng](vocabulary/95_a_bridge_in_the_bicycle_game.md) | 1941–1950 |
| 96 | Đường hầm dưới sân chơi | [Đọc](paragraph/96_the_tunnel_beneath_the_playground.md) | [Từ vựng](vocabulary/96_the_tunnel_beneath_the_playground.md) | 1951–1960 |
| 97 | Ngày cuối trước lễ tốt nghiệp | [Đọc](paragraph/97_the_last_day_before_graduation.md) | [Từ vựng](vocabulary/97_the_last_day_before_graduation.md) | 1961–1970 |
| 98 | Tác phẩm băng bắt đầu tan | [Đọc](paragraph/98_the_ice_sculpture_that_began_to_melt.md) | [Từ vựng](vocabulary/98_the_ice_sculpture_that_began_to_melt.md) | 1971–1980 |
| 99 | Mùa hè cuối của tiệm sửa chữa | [Đọc](paragraph/99_the_repair_shop_s_last_summer.md) | [Từ vựng](vocabulary/99_the_repair_shop_s_last_summer.md) | 1981–1990 |
| 100 | Buổi diễn mùa đông trên bánh xe | [Đọc](paragraph/100_the_winter_show_on_wheels.md) | [Từ vựng](vocabulary/100_the_winter_show_on_wheels.md) | 1991–2000 |
