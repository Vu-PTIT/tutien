# Tu Tiên — Thiết kế sản phẩm

**Cập nhật:** 05/10/2026.  
**Nhánh định hình:** `feat/map-ui-rebuild`.  
**Nền kỹ thuật:** Godot/GDScript, Nakama/TypeScript, PostgreSQL.

> Một sản phẩm có hai không gian liên kết: nền tảng sinh hoạt/học/làm và thế giới game pixel Việt Nam pha kỳ ảo. Người dùng có thể tham gia cộng đồng, sắp xếp việc trong ngày hoặc chơi game theo ý mình.

## 1. Canon sản phẩm

1. [01 — Tầm nhìn và vòng trải nghiệm](01-vision-and-core-loop.md)
2. [09 — Hai không gian sản phẩm](09-dual-experience-platform.md)
3. [08 — Trạng thái sinh hoạt và hiện diện xã hội](08-social-presence-and-lifestyle.md)
4. [04 — Bối cảnh Việt Nam hiện đại pha kỳ ảo](04-world-setting-vietnam-awakening.md)

Các tài liệu 01, 09 và 08 mô tả hướng sản phẩm hiện hành. Những phần cũ về săn quái, quest, economy hoặc cốt truyện được giữ làm tham chiếu kỹ thuật/lịch sử, không còn quyết định vòng chơi ưu tiên.

## 2. Hai không gian

- **Nền tảng sinh hoạt:** lịch/việc trong ngày, hẹn giờ tập trung, phòng học/làm việc chung, trạng thái, bạn bè và chat.
- **Thế giới game:** giao lưu ở thị trấn, trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn, tu luyện bằng thiền và đánh quái PvE.
- **Lớp dùng chung:** một danh tính, avatar, hồ sơ, bạn bè, chat và trạng thái hiện diện. Mỗi không gian vẫn dùng được riêng.

## 3. Tài liệu hệ thống

- [00 — Rà soát và quyết định](00-review-and-decisions.md): quyết định mới ở đầu; nội dung lịch sử bên dưới.
- [02 — Nhân vật và tu luyện](02-character-and-cultivation.md)
- [03 — Chiến đấu, kỹ năng và vật phẩm](03-combat-skills-and-artifacts.md)
- [05 — Story bible](05-story-bible.md): tham khảo cho giai đoạn sau.
- [06 — Nhiệm vụ và sự kiện](06-quests-and-events.md): không phải ưu tiên của lát cắt đầu.
- [07 — Vườn, chế tạo và kinh tế](07-garden-crafting-and-economy.md): prototype cũ cần cân chỉnh theo hướng đời sống.
- [Đặc tả tiến trình/PvE](progression-pve-spec.md): giữ cho nhánh combat tùy chọn.

## 4. Thứ tự sản xuất

**P0 — Hình ảnh:** bản đồ, UI, nhân vật và di chuyển để chốt cảm giác thế giới.

**P1 — Nền tảng sinh hoạt:** lịch/việc, focus, phòng học/làm việc, hồ sơ và trạng thái.

**P2 — Cộng đồng đồng bộ:** bạn bè/chat/hiện diện dùng chung với thế giới game.

**P3 — Vòng đời sống trong game:** nhà/vườn, cây trồng, câu cá, thu thập, chế tạo và thăm nhà.

**P4 — Tu luyện:** thiền và đánh quái PvE cho người muốn phát triển sức mạnh.

**Sau đó — Mở rộng:** cốt truyện dài, vùng đất và hệ thống nâng cao.

## 5. Tách mục tiêu khỏi hiện trạng

Backend xã hội, inventory/reward, di chuyển và prototype chiến đấu là nền kỹ thuật để đánh giá tái sử dụng. Công cụ học/làm, hiện diện đồng bộ hai phần, farming/fishing và tiến trình thiền là mục tiêu thiết kế chưa được code xác nhận.
