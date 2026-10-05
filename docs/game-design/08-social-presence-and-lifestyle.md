> **Cập nhật:** tài liệu này mô tả lớp hiện diện xã hội được dùng bởi cả nền tảng sinh hoạt và thế giới game. Thiết kế tổng thể hai phần nằm ở [09 — Hai không gian sản phẩm](09-dual-experience-platform.md).

# 08 — Trạng thái sinh hoạt và hiện diện xã hội

**Trạng thái:** định hướng sản phẩm, 05/10/2026; chưa được triển khai trong client.  
Liên quan: [01 — Tầm nhìn/vòng chơi](01-vision-and-core-loop.md), [04 — Bối cảnh Việt Nam](04-world-setting-vietnam-awakening.md).

## Mục tiêu

Khi người chơi bận đi học, đi làm hoặc nghỉ ngơi, họ vẫn có thể để bạn bè biết mình đang làm gì trong thế giới game. Tính năng này tạo cảm giác “mỗi người có một góc nhỏ trong cùng thị trấn”, kể cả khi không thể cùng online để chơi.

Đây là lựa chọn tự khai báo của người chơi. Game không đọc lịch, vị trí, camera hay hoạt động ngoài đời để suy ra trạng thái.

## Chọn trạng thái

Người chơi chọn một hoạt động có sẵn, đặt thời hạn và chọn mức hiển thị. Gợi ý ban đầu:

| Trạng thái | Cách thể hiện nhân vật |
| --- | --- |
| Đang đi học / học bài | Ngồi đọc sách ở bàn học, thư viện hoặc lớp học |
| Đang đi làm | Ngồi làm việc tại bàn hoặc không gian làm việc |
| Đang nghỉ | Ngồi thư giãn ở nhà, quán nước hoặc bờ sông |
| Đang tu luyện | Ngồi thiền tại nhà hoặc một nơi yên tĩnh |

Có thể bổ sung lời nhắn ngắn tùy chọn như “đang ôn thi” hoặc “nhắn mình sau”. Trạng thái mặc định chỉ hiển thị cho bạn bè; người chơi có thể ẩn hoặc xóa trạng thái bất kỳ lúc nào. Khi hết thời hạn, game tự gỡ trạng thái cũ.

## Khi chủ nhân rời game

Mục tiêu là trạng thái đã chọn tiếp tục hiển thị trong khoảng thời gian người chơi đặt, kể cả khi họ đóng client. Bạn bè nhìn thấy hoạt động trong danh sách bạn bè/hồ sơ; khi cùng vào một khu sinh hoạt, họ có thể thấy avatar đang làm hoạt động đó. Khi chủ nhân quay lại, trạng thái có thể kết thúc hoặc chuyển về hoạt động trực tiếp của nhân vật.

Bạn bè có thể ghé qua, ngồi cạnh, trò chuyện hoặc để lại lời nhắn. Hoạt động của chủ nhân không bị gián đoạn bởi lời mời, và game không bắt họ phải online để duy trì hình ảnh hiện diện.

## Trạng thái đời thường và tiến trình tu luyện

“Đang đi học”, “đang đi làm” và “đang nghỉ” là thông tin giao tiếp. Chúng không tự cấp kinh nghiệm, tiền hay sức mạnh và không dùng để chấm công.

“Ngồi thiền” là hành động trong game có thể phát triển tu vi theo thời gian. Người chơi cũng có thể bỏ thiền để đi đánh quái PvE, nhận chiến lợi phẩm và tiến bộ theo cách chủ động. Cân bằng thiền, giới hạn thời gian và phần thưởng combat cần được thiết kế riêng; trạng thái ngoài đời không được dùng để tạo lợi thế.

## Không gian giao lưu

Thị trấn nên có những nơi bạn bè muốn gặp nhau mà không cần nhiệm vụ: quảng trường, quán nước, thư viện, bến sông, nhà và vườn. Các hành động xã hội ban đầu gồm trò chuyện, biểu cảm, ngồi cạnh, thăm nhà và xem trang phục. Định hướng hiện tại không có minigame.

Cảnh quan giữ chất pixel và lấy Việt Nam hiện đại làm cảm hứng. Khu sinh hoạt cần nối tự nhiên với đường, cây xanh và mặt nước; không đặt làng như một cụm bị đóng khung giữa bản đồ.

## Phạm vi prototype đề xuất

1. Chọn trạng thái, thời hạn và quyền hiển thị.
2. Hiện trạng thái trong hồ sơ/danh sách bạn bè.
3. Thể hiện avatar cùng tư thế hoạt động tại một điểm sinh hoạt.
4. Cho bạn bè ghé thăm, chat hoặc để lại lời nhắn mà không làm gián đoạn chủ nhân.
5. Đồng bộ trạng thái khi client đóng, hết hạn, đổi thiết bị hoặc mất kết nối.

## Tiêu chí nghiệm thu

- Người chơi tự đặt, sửa, ẩn và xóa được trạng thái.
- Bạn bè thấy trạng thái đúng; người không được phép xem thì không thấy.
- Trạng thái hết hạn đúng giờ và không để lại avatar treo cũ.
- Đóng client không xóa trạng thái đang còn hạn; mở lại không nhân đôi trạng thái.
- Tư thế nhân vật thể hiện rõ hoạt động và dùng cùng phong cách pixel của game.
- Không có thưởng sức mạnh cho trạng thái học/làm/nghỉ; không yêu cầu người chơi cung cấp dữ liệu đời thực.
