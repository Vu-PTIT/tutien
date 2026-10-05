# Tu Tiên — Thiết kế sản phẩm

**Cập nhật:** 05/10/2026.  
**Nhánh định hình sản phẩm:** `feat/map-ui-rebuild`.  
**Công nghệ hiện tại:** Godot/GDScript, Nakama/TypeScript, PostgreSQL.

> Game pixel online dành cho Gen Z: một thế giới sinh hoạt và giao lưu lấy Việt Nam hiện đại làm cảm hứng, nơi người chơi có thể báo bạn bè mình đang làm gì, chăm nhà/vườn và tự chọn lúc tu luyện hoặc đánh quái.

## 1. Canon sản phẩm

1. [01 — Tầm nhìn và vòng chơi](01-vision-and-core-loop.md)
2. [08 — Trạng thái sinh hoạt và hiện diện xã hội](08-social-presence-and-lifestyle.md)
3. [04 — Bối cảnh Việt Nam hiện đại pha kỳ ảo](04-world-setting-vietnam-awakening.md)

Lời hứa sản phẩm trong 01 và đặc tả hiện diện xã hội trong 08 là nguồn ưu tiên khi các tài liệu gameplay cũ còn mô tả săn quái/cốt truyện như mục tiêu chính. Cốt truyện dài được để sau khi map, UI, nhân vật và vòng chơi xã hội đã có hình hài.

## 2. Hướng chơi

- Đời sống thư giãn: trồng trọt, câu cá, thu thập, chế tạo, chăm nhà và vườn.
- Cộng đồng: làng chung, trò chuyện, kết bạn, thăm nhà, trang phục và biểu cảm; không có minigame.
- Hiện diện: trạng thái ngoài đời do người chơi chọn, chẳng hạn học/làm/nghỉ; bạn bè thấy nhân vật đang thực hiện hoạt động tương ứng.
- Tu luyện: ngồi thiền để tăng sức mạnh; khi muốn thì đi đánh quái PvE và lấy chiến lợi phẩm.
- Bối cảnh: Việt Nam hiện đại khi linh khí vừa trở lại; đời sống cộng đồng là trung tâm, phiêu lưu là lựa chọn.

## 3. Đọc các tài liệu hệ thống

- [00 — Rà soát và quyết định](00-review-and-decisions.md): nhật ký quyết định; phần cũ được giữ để truy nguyên lịch sử.
- [02 — Nhân vật và tu luyện](02-character-and-cultivation.md)
- [03 — Chiến đấu, kỹ năng và vật phẩm](03-combat-skills-and-artifacts.md)
- [05 — Story bible](05-story-bible.md): tham khảo cho giai đoạn sau.
- [06 — Nhiệm vụ và sự kiện](06-quests-and-events.md): không phải ưu tiên của lát cắt đầu.
- [07 — Vườn, chế tạo và kinh tế](07-garden-crafting-and-economy.md): các con số hiện có là prototype cũ, cần cân chỉnh lại theo hướng đời sống.
- [Đặc tả tiến trình/PvE](progression-pve-spec.md): tham chiếu hệ thống, không định nghĩa trọng tâm sản phẩm mới.

## 4. Thứ tự sản xuất

**P0 — Map, UI và nhân vật.** Dựng một thị trấn/làng Việt Nam có không gian sinh hoạt tự nhiên, map dễ đọc, nhân vật biểu cảm và di chuyển tốt.

**P1 — Bạn bè và hiện diện.** Cho người chơi gặp nhau, chat, đặt trạng thái hoạt động và nhìn thấy avatar đang học/làm/nghỉ trong thời gian đã chọn.

**P2 — Đời sống.** Hoàn thiện nhà/vườn, trồng trọt, câu cá, thu thập và chế tạo thành vòng chơi ngắn có thể tự tận hưởng.

**P3 — Tu luyện và PvE.** Thiền tăng sức mạnh theo thời gian; đánh quái là hoạt động chủ động để thử sức và kiếm đồ. Không khóa hoạt động xã hội hoặc đời sống sau sức mạnh.

**Sau P3 — Cốt truyện và mở rộng.** Phát triển nhiệm vụ dài, bí ẩn linh khí và vùng đất mới sau khi lát cắt chơi chính đã thú vị.

## 5. Tách thiết kế khỏi hiện trạng

Backend xã hội, inventory/reward, di chuyển và prototype chiến đấu là nền kỹ thuật được giữ lại. Trạng thái sinh hoạt, hiện diện khi offline, farm/fishing và tiến trình thiền là mục tiêu cần làm, không được mô tả là tính năng đã xong nếu chưa có kiểm thử trong client.
