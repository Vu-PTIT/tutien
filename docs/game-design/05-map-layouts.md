# 05 — Thành phần bên trong map (chuẩn mới)

**Phạm vi:** khung nội dung và tiêu chí dựng 27 khu chính. Nội dung này thay toàn bộ layout map cũ trong tài liệu. Tọa độ cũ không phải dữ liệu triển khai.

## 1. Làng Người — 96×72 ô logic

Điểm bắt đầu, nơi ở và sinh hoạt của Người. Làng thuộc khu Người nằm giữa vùng Thủy và vùng Mộc.

- Lối vào và vật mốc làng dễ thấy.
- Cụm nhà, ngõ ngắn và sân chung.
- Quảng trường/sân sinh hoạt để gặp NPC, người chơi và nhận thông tin.
- Cụm chợ và dịch vụ cơ bản.
- Một khu hoạt động đời sống phù hợp địa lý đã duyệt.
- Một lối ra khám phá có chỉ dẫn.
- Đường chính thông thoáng, không nhồi props vào lối đi.

Không có quái thù địch. Cửa, dịch vụ, NPC và hoạt động là đối tượng tương tác riêng.

## 2. Thành phố Người — 128×96

Trung tâm dân cư, dịch vụ và tổ chức quy mô lớn. Trong sơ đồ tổng thể, khu Người (gồm Làng và Thành phố) nằm giữa vùng Thủy và vùng Mộc; hai khu này chưa có tọa độ hay hướng cụ thể.

- Cổng vào, quảng trường định hướng và trục đường chính.
- Khu dân cư và các cụm dịch vụ dễ tìm.
- Chợ, khu hội/đào tạo/thông tin nếu phù hợp cốt truyện.
- Đầu mối kết nối tới sáu vùng Lục Đại; có tên vùng và dấu hệ dễ đọc.
- Một vài sân/ngõ làm nơi gặp gỡ; tránh kéo dài phố thành mê cung.

Không có quái thù địch. Quy mô lớn hơn Làng nhờ nhiều cụm chức năng.

## 3. Làng Tâm Ẩn — 80×60

Ngôi làng trung tâm và nơi Tinh Linh bắt đầu/cư trú.

- Cây trung tâm làm vật mốc, cạnh khu sinh hoạt.
- Sân khởi sinh an toàn, có đường rõ tới nhà, suối và cổng.
- Cụm nhà Tinh Linh gắn với rễ/cành/địa hình tự nhiên.
- Suối hoặc điểm Hấp Linh với bờ đi được.
- Không gian cộng đồng cho gặp gỡ, học tập và trao đổi.
- Sáu lối ra tới sáu vùng linh năng, phân biệt bằng địa hình/vật thể.
- Đường vòng trong làng nối các lối ra mà không xuyên qua nhà.

Toàn map an toàn, không có boss/quái thù địch hay áp lực linh năng gây đục. Cây trung tâm là địa danh của làng, không phải boss.

## 4. Mẫu chung cho 24 map quái

Mỗi vùng Lục Đại có hai map Rìa, một Trung, một Cao. Mỗi map cần điểm vào/ra, đường chính, ít nhất một nhánh khám phá, lãnh địa quái, tài nguyên theo hệ, dấu hiệu nguy hiểm và đường rút lui.

| Vai trò | Thành phần và trải nghiệm |
|---|---|
| **Rìa A — yếu** | Địa hình mở, vật che, tài nguyên đầu tiên, quái nhóm nhỏ dạy hành vi cơ bản |
| **Rìa B — yếu** | Độ khó ngang A nhưng địa hình, quái/hành vi và tài nguyên khác |
| **Trung — trung bình** | Địa hình nhiều lớp/chướng ngại có lối vòng, quái phối hợp hoặc tương tác môi trường |
| **Cao — mạnh** | Vật mốc lớn, đường tiến có cảnh báo, khu chiến đấu đủ chỗ né; quái mạnh/đầu đàn, boss nếu cốt truyện vùng xác định |

Với mỗi vùng Mộc, Thủy, Kim, Phong, Thổ, Hỏa, ghi: địa hình; lối vào/ra; điểm tài nguyên; loài và hành vi quái; cơ chế môi trường; đầu đàn/boss nếu có; kích thước; spawn; collision; điểm tương tác; đường rút lui.

Tên 24 map và địa hình cụ thể chưa chốt. Không chép tên/nội dung map cũ vào đây.

## 5. Kích thước mục tiêu

| Loại | Kích thước |
|---|---:|
| Làng Người | 96×72 |
| Thành phố Người | 128×96 |
| Làng Tâm Ẩn | 80×60 |
| Mỗi map Rìa A/B | 112×80 |
| Mỗi map Trung | 128×96 |
| Mỗi map Cao | 80×80 |

Đơn vị là ô logic 32 px; asset không cần snap vào ô hoặc có kích thước bội 32.

Thiết kế bố cục cụ thể cho 27 khu và bảng màu từng khu nằm tại [13 — Bố cục 27 khu](13-bo-cuc-27-khu.md).\n\n## 6. Nghiệm thu

- [ ] Vai trò map đúng trong 27 khu chính.
- [ ] Lối vào/ra, điểm đến và đường rút lui xác định rõ.
- [ ] Địa hình tạo lối chơi riêng, không chỉ đổi màu.
- [ ] Quái đúng khu và độ khó; khu cư trú an toàn.
- [ ] Tài nguyên hợp hệ, không chắn đường.
- [ ] Áp dụng 5 nhóm hình ảnh G1–G5; hiệu ứng không phủ mờ cảnh.
- [ ] Kiểm tra bản đồ toàn cảnh và góc camera chơi thật.
