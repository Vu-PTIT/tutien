# 01 — Tầm nhìn sản phẩm và vòng chơi

**Cập nhật:** 21/09/2026, theo đặc tả tiến trình/PvE mới.
**Trạng thái:** thiết kế, chưa phải thông báo tính năng đã triển khai.
**Nguồn số liệu:** [đặc tả liên kết](progression-pve-spec.md) và JSON thiết kế đi kèm.

## 1. Lời hứa với người chơi

Bạn bắt đầu là một người bình thường ở An Khê. Bạn tiến xa bằng cách học quan sát,
chuẩn bị vật tư, tìm đúng nguồn tài nguyên, mở công pháp và biết lúc nào nên rút.
Game cần tạo cảm giác “mình đã biết cách xử lý tốt hơn”, không chỉ “chỉ số lớn hơn”.

Mỗi bước phát triển phải trả lời:
**mình thiếu gì → đi đâu → làm gì → nhận gì → dùng vào đâu → mở khả năng gì**.

Cảm hứng tu tiên được chuyển thành thế giới và nhân vật riêng của dự án.
Không sao chép nhân vật, lời thoại, chuỗi sự kiện, nhạc hoặc hình ảnh của phim.
Phạm vi cảnh giới trong tài liệu là thiết kế game, không phải bảng mô phỏng phim.

## 2. Năm trụ cột

**Chuẩn bị có ích.** Dược liệu và chế tạo cải thiện khả năng sống sót trong chuyến đi.
Không có một vật phẩm hiếm duy nhất bắt buộc mua mới qua được tuyến chính.

**Nơi an thân có công dụng.** An Khê cho nghỉ, thu hoạch, luyện đan, đổi trang bị,
nhận mục tiêu và đột phá. Chuyến đi mang tài nguyên/tri thức về; nơi ở biến chúng
thành phương án chuẩn bị mới. Vườn không là một minigame tách rời chiến đấu.

**Tiến bộ nhiều chiều, giao diện đơn giản.** Tu vi, lĩnh ngộ và trang bị/vật tư tạo
ba lớp dễ hiểu trong MVP. Công pháp, tri thức, quan hệ phát triển theo nội dung;
chưa thêm một thanh XP cho mọi hoạt động hoặc chỉ số “lực chiến” quyết định tất cả.

**Nguy hiểm đọc được.** Quái có vai trò dạy cơ chế, báo đòn và khoảng phản công.
Tăng khó bằng tình huống, góc tiếp cận và kết hợp quái; không chỉ tăng máu.
Chết phải hiểu được nguyên nhân và còn cách thử lại.

**Online không phá tiến trình cá nhân.** Chơi solo được, co-op có phần thưởng cá nhân.
Không ép PvP, bang, săn boss theo giờ thật hoặc online hằng ngày để hoàn thành MVP.

## 3. Ba nhịp vòng chơi

| Nhịp | Chuỗi hành động | Phản hồi cần có |
| --- | --- | --- |
| 10–60 giây | Nhìn đòn → giữ vị trí → đánh/né → quản lý linh lực → phản công/rút | Thấy lý do trúng, hụt hoặc không dùng được kỹ năng |
| Chuyến 15–20 phút, có thể đến 30 | Ghim mục tiêu → chuẩn bị → chọn tuyến → giao tranh/thu thập → về làng → chế tạo/đột phá | Biết tu vi và vật liệu kiếm được phục vụ mục tiêu nào |
| Nhiều phiên | Thiếu nguồn/tri thức → tìm cách tiếp cận → mở khả năng → giải thử thách → mở vùng mới | Mỗi mốc có việc mới làm được, không chỉ một con số |

Đây là nhịp cần kiểm chứng, không cam kết thời lượng hoặc suy phút từ số quái.
Một chuyến có thể không làm đủ mọi bước; người thích combat dùng đồ đã chuẩn bị
trước hoặc mua NPC, không bị buộc trồng cây mỗi lần.

## 4. Hành trình cần chứng minh trước khi mở rộng

Phàm nhân học tương tác/dò mạch/né → `q_main_003` dẫn khí và mở Phi Nhận →
trồng mẻ Cam Lộ hướng dẫn và luyện hồi phục → đi Trúc Âm tìm XP + nguyên liệu →
về làng mở Hộ Thân → xử lý địa hình/quái khó hơn ở Thạch Cạn →
chuẩn bị và hoàn thành Cổ Tỉnh → kết chương, tới giới hạn Luyện Khí 4.

Sơn Trư gặp trước khi có phép chỉ là bài học an toàn, không bãi farm miễn phí.
Sau Phi Nhận, cùng mẫu quái cho thấy lợi ích của tầm đánh. Hộ Thân giúp chịu áp lực
ở thời điểm quan trọng; Trói Mộc giúp kiểm soát vị trí. Không đặt kỹ năng thành
ba nút gây sát thương gần giống nhau.

Một chuyến săn cần phục vụ ít nhất hai trong ba mục tiêu: XP; vật tư/trang bị;
tri thức/đường đi. Ví dụ, săn nhện để tiến tới Hộ Thân và tích tơ làm phù.
Các bảng quái/loot/công thức phải nối được với mục tiêu này.

## 5. Phiên đầu khoảng 30 phút — mục tiêu thử

| Khoảng mục tiêu | Trải nghiệm | Điều cần quan sát |
| --- | --- | --- |
| 0–5 phút | Tạo nhân vật, nhận việc, biết NPC và đường ra | Không cần người phát triển chỉ từng nút |
| 5–10 phút | Dò dấu, nhận biết một cú lao và né | Không chỉ đứng yên bấm đánh |
| 10–15 phút | Dẫn khí, dùng Phi Nhận | Hiểu quyền mới đến từ đâu |
| 15–20 phút | Trồng mẻ hướng dẫn, thu và luyện hồi phục | Hiểu vườn phục vụ chuyến đi |
| 20–25 phút | Chọn tuyến đi với mục tiêu cụ thể | Biết cần nguyên liệu/tu vi nào |
| 25–30 phút | Mang thành quả về, xem mục tiêu kế tiếp | Tài sản lưu được; biết sẽ làm gì tiếp |

Không ép hoàn thành 12 quest, cả boss hoặc chắc chắn lên tầng 2 trong 30 phút.
Đo nút thắt ở giao diện/đường đi trước khi cắt nội dung hoặc tăng tốc XP.

## 6. Phạm vi các bản

| Mảng | MVP | Alpha | Sau Alpha |
| --- | --- | --- | --- |
| Cảnh giới | Phàm nhân → Luyện Khí 1–4 | Luyện Khí 5–13, thử Trúc Cơ sơ kỳ | Kết Đan/Nguyên Anh khi có nội dung |
| Công pháp | Tức Mạch Quyết, một bộ cơ bản | Ba hướng build kiếm/phù/thủ ngự | Khôi lỗi/linh thú nếu thực sự cần |
| Thế giới | An Khê, Trúc Âm, Thạch Cạn, Cổ Tỉnh | Tông môn, phường thị, bí cảnh mới | Vùng xa và tranh đoạt |
| Đời sống | 6 ô vườn, 3 cây, 5 công thức | Chuyên nghề và tiện ích | Động phủ/trang trí sâu |
| Cộng đồng | Backend đã có; trải nghiệm co-op tối đa 2 là mục tiêu | Nhóm 4 và hợp tác nhiều hơn | Liên minh/sự kiện bang |
| PvP | Đấu tập đồng thuận, chỉ số chuẩn, không kinh tế | Đấu trường cân bằng | Tranh đoạt tự chọn |
| Kinh tế | NPC, tài sản cá nhân, không chợ người chơi | Giao dịch sau kiểm thử tài sản | Chợ/đấu giá nếu có nhu cầu |
| Truyện | Một chương, 12 quest chính, 6 quest phụ | Hai chương tiếp | Xung đột vùng dài hạn |

Chương đầu dự kiến thử trong 2–4 giờ chơi chủ động. Không kéo dài thành nhiều ngày
bằng quái nhiều máu, daily bắt buộc hoặc chờ cây. Cày dài hạn chỉ mở khi có mục tiêu
công pháp/trang bị/nội dung tương ứng; tầng 4 phải báo rõ trần MVP.

## 7. Không làm trong phạm vi hiện tại

Không full-loot, PvP ép buộc, nhà đấu giá, auto farm, linh căn quay may rủi, cường hóa
phá đồ, premium currency, cửa hàng tiền thật, bay xuyên thế giới, hàng chục tông môn,
tình duyên hoặc AI hội thoại. Không xây cả hệ thống lớn trước rồi mới thử nối vòng chơi.

## 8. Nghiệm thu bản sắc

Người mới phải trải nghiệm được: chuẩn bị hữu ích; nguy hiểm đọc được; quyết định
đi tiếp/rút; phần thưởng có đầu ra; một khả năng mới; trở lại nơi an toàn.
Hỏi “bạn đang cần gì và sẽ đi đâu tiếp?”. Nếu không trả lời được, sửa mục tiêu/UI
và nguồn tài nguyên trước khi thêm cảnh giới.

[Xem các mốc P1–P5 và kịch bản nghiệm thu](progression-pve-spec.md).
