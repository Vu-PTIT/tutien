# 01 — Tầm nhìn sản phẩm và vòng chơi

**Cập nhật:** 05/10/2026 cho `feat/map-ui-rebuild`.  
**Định hướng đầy đủ:** [09 — Hai không gian sản phẩm](09-dual-experience-platform.md).  
**Hiện diện xã hội:** [08 — Trạng thái sinh hoạt](08-social-presence-and-lifestyle.md).

## 1. Lời hứa với người dùng

Tu Tiên kết hợp một **nền tảng sinh hoạt xã hội** với một **thế giới game pixel**. Người dùng có thể sắp xếp việc trong ngày, tập trung học/làm và trò chuyện cùng bạn bè mà không cần vào game. Khi muốn chơi, họ bước vào một thế giới Việt Nam hiện đại pha kỳ ảo để chăm chút nhà/vườn, gặp bạn hoặc phát triển sức mạnh theo nhịp riêng.

Hai phần dùng chung tài khoản, avatar, bạn bè, tin nhắn và trạng thái. Người dùng có thể dùng từng phần độc lập; trạng thái giữa chúng được đồng bộ để bạn bè luôn biết họ đang học, làm, nghỉ hay chơi.

## 2. Hai vòng trải nghiệm

| Không gian | Vòng chơi |
| --- | --- |
| Nền tảng sinh hoạt | Xem lịch/việc trong ngày → chọn phòng tập trung hoặc tự làm → chia sẻ trạng thái với bạn → hoàn tất việc và điều chỉnh kế hoạch |
| Thế giới game | Vào thị trấn → gặp bạn/chăm nhà-vườn → trồng trọt, câu cá, thu thập hoặc chế tạo → khi muốn thì thiền hay đi đánh quái → quay lại không gian sống |

Nền tảng sinh hoạt cần có ích mà không yêu cầu mở game: danh sách việc, lịch cá nhân, hẹn giờ tập trung, phòng học/làm việc chung, hồ sơ và chat bạn bè. Bắt đầu bằng các công cụ nhẹ để hình thành thói quen; chỉ mở rộng sau khi người dùng thực sự dùng thường xuyên.

## 3. Trụ cột sản phẩm

1. **Làm việc và sinh hoạt cùng bạn bè:** xem trạng thái, hẹn giờ tập trung, vào phòng yên tĩnh chung, trò chuyện hoặc để lại lời nhắn.
2. **Hiện diện có lựa chọn:** người dùng tự đặt trạng thái như “đang đi học”, “đang làm việc”, “đang nghỉ” hoặc “đang tu luyện”. Avatar và hồ sơ phản ánh lựa chọn đó theo thời gian đã chọn.
3. **Đời sống trong thế giới game:** trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn, thăm bạn, trang phục và biểu cảm.
4. **Tu luyện tùy ý:** ngồi thiền để tăng sức mạnh hoặc chủ động đi đánh quái PvE để thử sức và kiếm chiến lợi phẩm. Combat không bắt buộc để sử dụng nền tảng hay vui chơi trong thị trấn.
5. **Chất Việt Nam hiện đại pha kỳ ảo:** không gian gần gũi, đời thường và tự nhiên; linh khí, thiền và dị thú là lớp khám phá mở rộng.

Định hướng hiện tại không có minigame. PvP không phải trọng tâm sản phẩm.

## 4. Kết nối hai không gian

- Dùng chung tài khoản, tên nhân vật, avatar, hồ sơ, bạn bè, chat và trạng thái hiện diện.
- Khi người dùng chọn “đang đi làm” hoặc “đang học” trên nền tảng, hệ thống gửi lệnh cho thế giới game: avatar tự đi theo đường trong map tới khu làm việc/lớp học và bắt đầu hoạt động tương ứng. Chủ nhân không cần mở game; bạn bè nhìn thấy nhân vật đang di chuyển hoặc đã tới nơi.
- Công cụ lịch, việc cần làm và focus là trải nghiệm của nền tảng; chúng không biến thành hệ thống chấm công hoặc yêu cầu bằng chứng về hoạt động ngoài đời.
- Có thể ghi nhận việc hoàn thành bằng phản hồi xã hội hoặc phần thưởng trang trí tùy chọn. Không tạo chênh lệch sức mạnh PvE dựa trên năng suất ngoài đời.
- Việc chia sẻ trạng thái do người dùng kiểm soát; đặt thời hạn, sửa hoặc ẩn bất cứ lúc nào.

## 5. Thứ tự sản xuất

| Giai đoạn | Trọng tâm |
| --- | --- |
| P0 | Bản sắc hình ảnh: bản đồ, UI, nhân vật, di chuyển và các khu sinh hoạt Việt Nam |
| P1 | Nền tảng sinh hoạt tối thiểu: lịch/việc, focus, phòng học/làm việc và hồ sơ xã hội |
| P2 | Đồng bộ bạn bè/chat và lệnh hoạt động; avatar tự đi đến nơi học/làm trong thế giới game dù chủ nhân không mở game |
| P3 | Vòng đời sống trong game: nhà/vườn, trồng trọt, câu cá, thu thập và chế tạo |
| P4 | Tu luyện bằng thiền và quái PvE như nhánh chơi tùy chọn |
| Sau đó | Cốt truyện dài, vùng đất mới và hệ thống nâng cao |

Bố cục sản phẩm/app cuối cùng còn mở. Trước mắt thiết kế hai trải nghiệm như hai phần riêng có thể dùng độc lập và đồng bộ qua một tài khoản; quyết định một ứng dụng hay hai ứng dụng sau khi kiểm tra luồng sử dụng.

## 6. Ranh giới tầm nhìn và hiện trạng

Tài khoản, hồ sơ, túi đồ, cộng đồng và prototype chiến đấu là nền code được mô tả trong README. Lịch/việc, focus rooms, lệnh hoạt động và di chuyển avatar trong thế giới game khi chủ nhân không mở game, nông trại/câu cá và tiến trình thiền vẫn là mục tiêu cần triển khai và kiểm chứng.
