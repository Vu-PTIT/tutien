# 09 — Nền tảng sinh hoạt và thế giới game

**Cập nhật:** 08/10/2026.  
**Trạng thái:** định hướng sản phẩm; chưa phải mô tả code hiện có.

## Mục tiêu

Tu Tiên hướng tới người trẻ, đặc biệt là Gen Z, với hai trải nghiệm song song để người dùng không cần mở game mỗi khi muốn ở trong cộng đồng. Nền tảng hỗ trợ việc hằng ngày, học/làm cùng bạn và trò chuyện; game là một không gian riêng để sinh hoạt, khám phá và tu luyện. Phần game ghép vòng sống thư thái kiểu Stardew Valley với không khí giao lưu, kết bạn của game Avatar Việt Nam thời trước.

Hai phần có thể mở riêng, dùng chung tài khoản, avatar, hồ sơ, bạn bè, chat và trạng thái. Chưa khóa cách phát hành thành một ứng dụng có hai chế độ hay hai ứng dụng liên kết; trước tiên cần kiểm chứng cả hai luồng sử dụng.

## A. Nền tảng sinh hoạt

Phần này giúp người dùng thực hiện các hoạt động thường ngày ngay trong sản phẩm:

- Bảng hôm nay với lịch cá nhân và danh sách việc cần làm.
- Hẹn giờ tập trung cho học/làm, có thể vào phòng chung với bạn bè.
- Trạng thái ngắn như “đang học”, “đang đi làm”, “đang nghỉ”, cùng lời nhắn tùy chọn; trạng thái có thể gửi lệnh cho avatar trong game.
- Hồ sơ, danh sách bạn, chat và lời nhắn để duy trì kết nối.
- Lịch sử focus đơn giản để người dùng tự xem thời gian mình đã tập trung.

Tính năng đầu tiên nên gọn: người dùng tự nhập việc, chọn thời lượng, bắt đầu một phiên tập trung, mời bạn hoặc vào phòng chung, rồi tự kết thúc/đánh dấu việc. Mở rộng thêm công cụ sau khi luồng hằng ngày này có người dùng quay lại thường xuyên.

Khi người dùng bấm “đang đi làm”, nền tảng gửi một activity command tới thế giới game. Avatar tự đi từ tọa độ đã lưu tới khu làm việc trong thị trấn rồi thực hiện hoạt động ở đó, kể cả khi game client đã đóng. Mỗi trạng thái có điểm đến và hành động tương ứng, ví dụ học → thư viện/lớp học, làm → khu làm việc, nghỉ → nhà/quán nước.

## B. Thế giới game

Game là thế giới pixel online mang chất Việt Nam, nơi bạn bè gặp nhau, kết bạn, trò chuyện và ghé thăm nhà như tinh thần của game Avatar Việt Nam thời trước. Vòng sống thư thái gồm trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn và thay trang phục, lấy cảm hứng từ Stardew Valley.

Tu luyện chia thành hai lựa chọn:

- **Thiền:** nhân vật ngồi thiền và tăng sức mạnh theo thời gian.
- **PvE:** người chơi chủ động ra ngoài đánh quái để nhận kinh nghiệm, nguyên liệu và trang bị, theo hướng chiến đấu của Ngọc Rồng Online. Không có minigame; PvE là lựa chọn.

Người chơi có thể vào game chỉ để gặp bạn hoặc chăm chút nơi ở. Không có minigame trong hướng hiện tại; combat không bắt buộc.

Map theo [10 — Map phân lớp và vật thể tương tác](10-layered-interactive-maps.md): nền vẽ tự do, nước và props riêng; không bắt toàn bộ cảnh dùng tileset. Cây, cửa, ghế, giường và bàn học có dữ liệu tương tác/trạng thái độc lập. Đây là yêu cầu thiết kế, không phải tính năng đã nghiệm thu.

## C. Lớp kết nối

| Dữ liệu/hoạt động | Nền tảng sinh hoạt | Thế giới game |
| --- | --- | --- |
| Tài khoản và hồ sơ | Đăng nhập, ảnh đại diện, trạng thái | Nhân vật và hồ sơ trong game |
| Bạn bè và chat | Tìm bạn, nhắn tin, phòng tập trung | Gặp nhau, chat và ghé thăm |
| Trạng thái và lệnh | Người dùng chọn học/làm/nghỉ/focus trong app | Avatar tự đi tới địa điểm tương ứng và thực hiện hoạt động trong thế giới game |
| Việc hoàn thành | Danh sách việc, phiên tập trung | Có thể nhận phản hồi hoặc trang trí tùy chọn |
| Tiến trình game | Hiển thị nhân vật, không bắt buộc chơi | Nông trại/nhà, thiền và PvE |

Người dùng tự kiểm soát trạng thái, thời hạn và người xem. Thế giới lưu lệnh, điểm đi, điểm đến, thời gian và animation để giữ trạng thái nhất quán mà không cần chủ nhân mở game. Hệ thống không tự thu thập lịch, vị trí hoặc hành vi ngoài sản phẩm. Ghi nhận hoạt động thật không nên quyết định sức mạnh chiến đấu.

## D. Trải nghiệm mẫu

1. Người chơi mở nền tảng, thêm “ôn môn Kinh tế đô thị” vào danh sách hôm nay và chọn focus 40 phút.
2. Họ vào phòng thư viện với bạn bè. Hồ sơ hiện “đang học”; lệnh được gửi sang game và avatar tự đi tới thư viện rồi ngồi đọc sách, dù chủ nhân không mở game.
3. Khi kết thúc, người chơi tự đánh dấu việc hoàn thành và trò chuyện hoặc để lại lời nhắn.
4. Tối họ mở thế giới game, tưới vườn, thăm nhà bạn; nếu thích thì ngồi thiền hoặc đi đánh quái.

## E. Nguyên tắc trải nghiệm

- Hai phần cùng nhận diện và cộng đồng nhưng mỗi phần vẫn có giá trị riêng.
- Mọi trạng thái đời thường đều do người dùng khởi tạo, kết thúc hoặc ẩn.
- Focus hỗ trợ thói quen cá nhân và học/làm cùng bạn; không biến thành chấm điểm năng suất.
- Phần thưởng nối việc đời thường với game nên thiên về biểu cảm/trang trí. Sức mạnh chiến đấu phát triển qua lựa chọn trong game như thiền và PvE.
- Người dùng có thể mở game mà không cần dùng lịch/focus; họ cũng có thể dùng nền tảng mà không cần vào game.

## F. Lát cắt thử nghiệm

1. Tạo hồ sơ và thêm bạn.
2. Tạo việc trong ngày và bắt đầu/kết thúc focus timer.
3. Vào phòng tập trung chung và thấy trạng thái bạn bè.
4. Gửi lệnh hoạt động từ app; avatar trong game tự đi tới địa điểm tương ứng và bắt đầu animation.
5. Mở game riêng, gặp bạn và thử một hoạt động đời sống hoặc thiền.
6. Kiểm tra avatar vẫn hoàn tất đường đi và giữ hoạt động khi chủ nhân đóng game; trạng thái hết hạn/ẩn đúng và không tạo avatar trùng khi mở lại.

Chỉ sau khi lát cắt này dễ hiểu và ổn định mới mở rộng lịch, ghi chú, tính năng cộng đồng hoặc nội dung PvE.

## G. Hợp đồng hoạt động trên map phân lớp

Địa điểm khai báo `map_id`, ID vật thể/slot, điểm tiếp cận, vị trí thực hiện, hướng và animation. App gửi loại hoạt động và `command_id`; server chọn địa điểm/slot hợp lệ theo quyền, đường đi và sức chứa. Không lấy vị trí ngồi từ tâm ảnh hoặc mã tile.

Server quản lý lộ trình/mốc thời gian và trạng thái `idle → travelling → active → completed/cancelled/expired`; xử lý lệnh lặp, lệnh cũ, hủy, hết hạn, hết chỗ và reconnect. Đóng game không dừng logic hoạt động; mở lại dựng một avatar từ snapshot. Khi người chơi tự điều khiển, phải chuyển quyền điều khiển khỏi hoạt động tự động.

Dữ liệu hoạt động gửi cho bạn bè phải tuân thủ quyền xem; không chỉ giấu nhãn trong UI trong khi vẫn gửi đích riêng tư. Sóng nước, lá và khói chạy cục bộ; cây trồng/loot/sở hữu và slot dùng chung có xác nhận server. Trạng thái học/làm ngoài đời không tự sinh tài sản hay sức mạnh chiến đấu.

M4 của tài liệu 10 là bước kiểm chứng liên thông; chưa có API mới hoặc hoạt động offline được triển khai chỉ bởi cập nhật tài liệu này.
