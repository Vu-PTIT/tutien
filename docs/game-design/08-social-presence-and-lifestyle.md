> **Cập nhật:** tài liệu này mô tả lớp hiện diện xã hội dùng bởi cả nền tảng đời sống và thế giới game. Thiết kế tổng thể nằm ở [09 — Nền tảng đời sống và thế giới game](09-dual-experience-platform.md).

# 08 — Trạng thái sinh hoạt và hiện diện xã hội

**Trạng thái:** định hướng sản phẩm, cập nhật 09/10/2026; chưa được coi là đã triển khai đầy đủ trong client.  
Liên quan: [01 — Tầm nhìn/vòng chơi](01-vision-and-core-loop.md), [04 — Bối cảnh Việt Nam](04-world-setting-vietnam-awakening.md).

## Mục tiêu

Người dùng có thể ghi lại đời sống thật và chia sẻ trạng thái xã hội nếu muốn, trong khi nhân vật của họ có thể thực hiện một hoạt động game khác trong thế giới chung.

Hai khái niệm phải tách:
- **Trạng thái người dùng:** đang học, đang làm, đang nghỉ, bận, không muốn làm phiền.
- **Hoạt động avatar:** câu cá, chăm vườn, thiền, nghỉ ở quán, thu thập hoặc hoạt động game khác.

Ví dụ: chủ nhân đang học ngoài đời nhưng avatar đang tự câu cá ở hồ An Khê.

Game không đọc lịch, vị trí, camera hoặc hoạt động ngoài đời để tự suy ra trạng thái.

## 1. Trạng thái người dùng

Người dùng tự chọn trạng thái, thời hạn và phạm vi hiển thị.

Gợi ý ban đầu:
- Đang học
- Đang làm việc
- Đang nghỉ
- Bận / không muốn làm phiền
- Tùy chỉnh

Có thể thêm lời nhắn ngắn như “đang ôn thi” hoặc “nhắn mình sau”.

Trạng thái mặc định không được tự tạo phần thưởng game, không cấp tiền, XP, vật phẩm hoặc sức mạnh.

## 2. Hoạt động avatar

Avatar có activity riêng do người dùng giao từ sảnh hoặc từ game.

Ví dụ:
- Đi câu
- Chăm vườn
- Thiền
- Nghỉ ở quán
- Thu thập

Activity có trạng thái `queued → travelling → active → completed/cancelled/expired`.

Nếu chủ nhân đóng game, server vẫn quản lý activity đã được chấp nhận. Bạn bè vào sau có thể thấy avatar tại đúng địa điểm và trạng thái theo quyền chia sẻ.

## 3. Cách hiển thị cho bạn bè

Khi được phép xem, một hồ sơ có thể hiển thị đồng thời:

> Đang học · Avatar đang câu cá tại hồ An Khê · Chủ nhân không trực tiếp điều khiển

Không được dùng hoạt động avatar để suy đoán người dùng đang làm gì ngoài đời.

Avatar tự động cần có dấu hiệu hình ảnh/UI đủ rõ để người khác không nhầm chủ nhân đang trực tiếp online và chờ phản hồi tức thì.

## 4. Khi chủ nhân vào game

Nếu avatar đang tự hoạt động:
- game dựng đúng một avatar;
- người dùng có thể xem trạng thái hiện tại;
- bấm “Tự điều khiển” để takeover;
- server chuyển quyền điều khiển autonomous → direct;
- không tạo bản sao;
- không tính lại phần thưởng đã settlement.

Khi người dùng rời game, có thể giao lại hoạt động tự động nếu activity hỗ trợ.

## 5. Không gian giao lưu

Thị trấn nên có những nơi cả avatar trực tiếp và avatar tự động cùng tồn tại:
- quảng trường;
- quán nước;
- thư viện;
- bến sông;
- hồ câu;
- vườn;
- nhà;
- điểm thiền.

Bạn bè có thể ghé qua, ngồi cạnh, chat hoặc để lại lời nhắn. Lời mời xã hội không được tự hủy activity đang chạy của chủ nhân.

## 6. Quyền riêng tư

Quyền xem trạng thái đời thật và quyền xem hoạt động avatar là hai cài đặt độc lập.

Ví dụ người dùng có thể:
- cho bạn bè thấy “đang học” nhưng ẩn vị trí avatar;
- ẩn trạng thái đời thật nhưng vẫn cho bạn bè thấy avatar đang câu;
- ẩn cả hai.

Server không được gửi dữ liệu riêng tư xuống client rồi chỉ giấu bằng UI.

## 7. Phạm vi prototype đề xuất

1. Đặt trạng thái đời thật, thời hạn và quyền xem.
2. Tạo một avatar activity độc lập, bắt đầu bằng câu cá.
3. Hiển thị hai lớp thông tin riêng trong hồ sơ.
4. Cho avatar tự đi tới slot hợp lệ và hoạt động khi client đóng.
5. Bạn bè thấy trạng thái/avatar đúng quyền.
6. Mở game takeover và quay lại autonomous mà không nhân đôi avatar/phần thưởng.
7. Đồng bộ đúng khi hết hạn, đổi thiết bị hoặc reconnect.

## 8. Tiêu chí nghiệm thu

- Trạng thái đời thật và avatar activity có thể khác nhau.
- Thay đổi trạng thái đời thật không tự đổi activity avatar.
- Activity avatar không tự đánh dấu lịch đời thật là hoàn thành.
- Đóng client không xóa phiên activity còn hiệu lực.
- Mở lại không tạo avatar trùng.
- Takeover không settlement phần thưởng lần hai.
- Bạn bè chỉ thấy thông tin được phép xem.
- Trạng thái đời thật không tạo lợi thế sức mạnh.
- Không yêu cầu người dùng cung cấp dữ liệu đời thực để chứng minh hoạt động.
