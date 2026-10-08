# Tu Tiên — Thiết kế sản phẩm

**Cập nhật:** 08/10/2026.  
**Nhánh định hình:** `feat/map-ui-rebuild`; quy chuẩn map được đồng bộ với `feat/dual-experience-platform`.  
**Nền kỹ thuật:** Godot/GDScript, Nakama/TypeScript, PostgreSQL.

> Một sản phẩm có hai không gian liên kết: nền tảng sinh hoạt/học/làm và thế giới game pixel Việt Nam pha kỳ ảo. Người dùng có thể tham gia cộng đồng, sắp xếp việc trong ngày hoặc chơi game theo ý mình.

## 1. Canon sản phẩm

1. [01 — Tầm nhìn và vòng trải nghiệm](01-vision-and-core-loop.md)
2. [09 — Hai không gian sản phẩm](09-dual-experience-platform.md)
3. [08 — Trạng thái sinh hoạt và hiện diện xã hội](08-social-presence-and-lifestyle.md)
4. [04 — Bối cảnh Việt Nam hiện đại pha kỳ ảo](04-world-setting-vietnam-awakening.md)
5. [10 — Map phân lớp và vật thể tương tác](10-layered-interactive-maps.md)

Các tài liệu 01, 09 và 08 mô tả hướng sản phẩm hiện hành. **Tài liệu 10 là nguồn chuẩn cho kiến trúc map mới:** nền vẽ phân lớp, vật thể và tương tác độc lập; tileset chỉ dùng nơi thích hợp, không bắt buộc toàn map. Nếu tài liệu cũ yêu cầu map thuần tile, ưu tiên 10 cho phần dựng map. Những phần cũ về săn quái, quest, economy hoặc cốt truyện được giữ làm tham chiếu kỹ thuật/lịch sử, không còn quyết định vòng chơi ưu tiên.

## 2. Hai không gian

- **Nền tảng sinh hoạt:** lịch/việc trong ngày, hẹn giờ tập trung, phòng học/làm việc chung, trạng thái, bạn bè và chat.
- **Thế giới game:** giao lưu ở thị trấn, trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn, tu luyện bằng thiền và đánh quái PvE.
- **Lớp dùng chung:** một danh tính, avatar, hồ sơ, bạn bè, chat và trạng thái hiện diện. Mỗi không gian vẫn dùng được riêng.

Học/làm/nghỉ từ app ánh xạ tới địa điểm, đường đi và slot hoạt động trong map. Trạng thái được server quản lý; hiệu ứng môi trường không phải gameplay và không cần đồng bộ từng hạt.

## 3. Tài liệu hệ thống

- [00 — Rà soát và quyết định](00-review-and-decisions.md): quyết định mới ở đầu; nội dung lịch sử bên dưới.
- [02 — Nhân vật và tu luyện](02-character-and-cultivation.md)
- [03 — Chiến đấu, kỹ năng và vật phẩm](03-combat-skills-and-artifacts.md)
- [05 — Story bible](05-story-bible.md): tham khảo cho giai đoạn sau.
- [06 — Nhiệm vụ và sự kiện](06-quests-and-events.md): không phải ưu tiên của lát cắt đầu.
- [07 — Vườn, chế tạo và kinh tế](07-garden-crafting-and-economy.md): prototype cũ cần cân chỉnh theo hướng đời sống.
- [Đặc tả tiến trình/PvE](progression-pve-spec.md): giữ cho nhánh combat tùy chọn.
- [Quy chuẩn sửa map trong client](../../client/MAP_DESIGN.md)

## 4. Thứ tự sản xuất

**P0 — Map/UI/nhân vật:** thực hiện M1–M3 của tài liệu 10 trên một góc làng trước: nền sạch + nước/props + collision/Y-sort/camera, sau đó tương tác thật, cuối cùng hiệu ứng và kiểm tra hiệu năng. Không mở rộng diện tích hoặc sinh lại toàn map khi cảnh mẫu chưa đạt.

**P1 — Nền tảng sinh hoạt:** lịch/việc, focus, phòng học/làm việc, hồ sơ và trạng thái.

**P2 — Cộng đồng đồng bộ:** bạn bè/chat/hiện diện dùng chung với thế giới game; M4 kiểm tra avatar đi đến điểm học/làm/nghỉ ngay cả khi client của chủ nhân đóng.

**P3 — Vòng đời sống trong game:** nhà/vườn, cây trồng, câu cá, thu thập, chế tạo và thăm nhà.

**P4 — Tu luyện:** thiền và đánh quái PvE cho người muốn phát triển sức mạnh.

**Sau đó — Mở rộng:** cốt truyện dài, vùng đất và hệ thống nâng cao.

## 5. Tách mục tiêu khỏi hiện trạng

Ở mốc `d8565ca`, client tập trung demo làng bằng `village_demo.gd`, `village_tile_layer.gd` và `village_sprite_object.gd`; việc props đã riêng không chứng minh có đầy đủ tương tác có lưu. Backend xã hội, inventory/reward và prototype chiến đấu là nền kỹ thuật cần đánh giá tái sử dụng, không suy ra rằng chúng đã tích hợp vào scene làng hiện tại.

Cập nhật 08/10 chốt thiết kế, chưa thay renderer, tạo asset hay chạy test Godot. Công cụ học/làm, hiện diện đồng bộ hai phần, farming/fishing và tiến trình thiền vẫn phải được kiểm chứng bằng code và test riêng. Không dùng tài liệu thiết kế như báo cáo tính năng đã hoàn tất.
