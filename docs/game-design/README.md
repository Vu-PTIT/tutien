# Tu Tiên — Thiết kế sản phẩm

**Cập nhật:** 08/10/2026. Nhánh này thử nghiệm hướng hai không gian sản phẩm. Quy chuẩn map được đồng bộ với `feat/map-ui-rebuild`; không merge chéo toàn bộ code và không thay đổi `main`.

## Định hướng hiện hành

Tu Tiên có hai trải nghiệm song song, dùng chung tài khoản, avatar, bạn bè, chat và trạng thái:

- **Nền tảng sinh hoạt:** việc/lịch cá nhân, focus, phòng học/làm việc, hồ sơ và kết nối bạn bè; sử dụng được mà không cần vào game.
- **Thế giới game:** không gian pixel giao lưu, kết bạn, thăm nhà; vòng chơi sống gồm trồng trọt, câu cá, thu thập, chế tạo và chăm sóc nhà/vườn.
- **Tiến triển tùy chọn:** ngồi thiền để tăng sức mạnh hoặc chủ động đánh quái PvE. Không có minigame; học/làm ngoài đời không quyết định sức mạnh chiến đấu.
- **Đồng bộ hành động:** chọn “đang đi làm” trong app gửi lệnh để nhân vật tự đi đến khu làm việc trong game và làm việc, kể cả khi chủ nhân không mở game.
- **Map phân lớp:** nền vẽ tự do, nước/props và logic tương tác riêng; tileset được tái sử dụng cục bộ, không bắt toàn thế giới theo ô.

Đây là đặc tả định hướng, không phải danh sách tính năng đã triển khai. Ở mốc `31080e8`, `client/scripts/main.gd` vẫn có `MapWorldScene = null`; không dùng mô tả bốn map trong tài liệu bản base cũ làm bằng chứng map đã chạy trên nhánh này.

## Tài liệu chuẩn cho hướng sản phẩm mới

1. [01 — Tầm nhìn và vòng trải nghiệm](01-vision-and-core-loop.md)
2. [09 — Nền tảng sinh hoạt và thế giới game](09-dual-experience-platform.md)
3. [08 — Trạng thái sinh hoạt và hiện diện xã hội](08-social-presence-and-lifestyle.md)
4. [10 — Map phân lớp và vật thể tương tác](10-layered-interactive-maps.md)
5. [Quy chuẩn sửa map trong client](../../client/MAP_DESIGN.md)

Nếu tài liệu cũ bên dưới khác với hướng hiện hành, ưu tiên 01/09/08 cho sản phẩm và **10 cho kiến trúc map mới**. Không tiếp tục yêu cầu toàn bộ map là tileset, cũng không thay map bằng một ảnh phẳng có mọi vật thể dính vào nền. Các tài liệu cũ vẫn có giá trị tham khảo cho hệ thống/prototype; cần rà soát trước khi biến chúng thành yêu cầu mới.

## Tài liệu hệ thống và prototype tham khảo

- [00 — Rà soát và quyết định thiết kế](00-review-and-decisions.md)
- [02 — Nhân vật và tu luyện](02-character-and-cultivation.md)
- [03 — Chiến đấu, kỹ năng và pháp khí](03-combat-skills-and-artifacts.md)
- [04 — Thế giới và bản đồ](04-world-and-maps.md)
- [05 — Sổ tay cốt truyện](05-story-bible.md)
- [06 — Nhiệm vụ và sự kiện](06-quests-and-events.md)
- [07 — Vườn, chế tạo và kinh tế](07-garden-crafting-and-economy.md)
- [08 — PC và mobile](08-cross-platform-pc-mobile.md)
- [Bố cục map cũ](map-layout-spec.md)
- [Đặc tả PvE prototype](progression-pve-spec.md)
- [Tham chiếu tiến trình](progression-references.md)

## Thứ tự chuyển đổi map và liên thông

**M0 — Thiết kế:** tài liệu 10 và hướng dẫn client dùng chung trên hai nhánh; cập nhật 08/10 chỉ hoàn tất bước này, không tạo renderer, asset hoặc RPC mới.

**M1–M3 — Một góc làng:** nền sạch + nước/props + collision/Y-sort/camera; tiếp đến ghế/cửa/cây có tương tác; sau đó nước/gió/đèn/âm thanh và kiểm tra PC/mobile. Giữ scene và tài nguyên hiện có để đối chiếu. Chỉ port các thành phần đã được kiểm chứng, không ghi đè toàn bộ client bằng nhánh rebuild.

**M4 — Hoạt động từ app:** map có điểm tiếp cận, slot, hướng và animation; server giữ lộ trình/mốc thời gian, quyền xem và sức chứa. Kiểm tra client đóng/mở lại, lệnh lặp, hủy, hết chỗ và reconnect. Chưa chứng minh bằng việc chỉ hiển thị dòng “đang học”.

Sau khi các bước này đạt mới mở rộng làng, vòng nhà/vườn/câu cá và nội dung tu luyện. Cốt truyện dài/quest không phải điều kiện để kiểm chứng hướng map mới.
