# Tu Tiên — Thiết kế sản phẩm và tiến trình PvE

**Bản cập nhật:** 01/10/2026.  
**Nhánh canon hiện tại:** `feat/map-ui-rebuild`.  
**Nền dự án:** Godot/GDScript, Nakama/TypeScript, PostgreSQL.

> Một người bình thường tại Việt Nam hậu Linh Chấn tiến thân bằng hiểu biết, chuẩn bị,
> chiến đấu, trang bị và dữ liệu; từ một căn cứ địa phương dần chạm tới bí mật của tinh không.

## 1. Canon phải đọc trước

1. [04 — Bối cảnh Việt Nam thời Linh Chấn](04-world-setting-vietnam-awakening.md)
2. [05 — Story bible](05-story-bible.md)
3. [01 — Tầm nhìn/vòng chơi](01-vision-and-core-loop.md)

Các tên An Khê, Trúc Âm, Thạch Cạn, Cổ Tỉnh trong code/tài liệu cũ là **legacy world data**,
không còn là canon hiển thị của map/UI rebuild.

## 2. Hệ thống đang giữ

Backend xã hội, inventory/reward, combat authoritative, world movement, field mobs,
quest/progression hiện có được giữ làm nền kỹ thuật. Việc đổi bối cảnh không đồng nghĩa
viết lại toàn bộ backend.

## 3. Việc cần migrate

- tên map và point/entity;
- tên quái/vật phẩm/NPC;
- quest text và localization;
- tên cảnh giới/công pháp nếu quyết định đổi hẳn sang hệ hiện đại;
- art direction map/UI;
- mapping save cũ sang ID mới, có test.

## 4. Nguyên tắc triển khai

Không đổi ID runtime hàng loạt trong một commit. Khóa lore → dựng map/UI mới →
đổi dữ liệu hiển thị → test → sau đó mới migration ID backend nếu thật sự cần.

## 5. Tài liệu hệ thống

- [00 — review/quyết định](00-review-and-decisions.md)
- [01 — tầm nhìn/vòng chơi](01-vision-and-core-loop.md)
- [02 — nhân vật/tu luyện](02-character-and-cultivation.md)
- [03 — chiến đấu](03-combat-skills-and-artifacts.md)
- [04 — bối cảnh Việt Nam thời Linh Chấn](04-world-setting-vietnam-awakening.md)
- [05 — truyện](05-story-bible.md)
- [06 — nhiệm vụ](06-quests-and-events.md)
- [07 — kinh tế/chế tạo](07-garden-crafting-and-economy.md)
- [Đặc tả tiến trình/PvE](progression-pve-spec.md)

## 6. Thứ tự sản xuất mới

P1 — dựng Căn cứ Thăng Long đủ chạy/đọc được →  
P2 — Vành Đai Tây + dị thú đầu tiên →  
P3 — Ba Vì + Máy Quét Linh Phổ →  
P4 — Trạm Thiên Mạch + boss/chọn nhánh →  
P5 — polish PC/mobile, minimap/map detail, social UI và smoke test.

Không mở rộng ra toàn quốc/tinh không trước khi P1–P4 chạy ổn bằng tài khoản mới.
