# Tu Tiên — Thiết kế sản phẩm và tiến trình PvE

**Bản cập nhật:** 23/09/2026, bổ sung layout map prototype dùng chung cho PC + mobile.
**Mốc đối chiếu:** `feat/inventory-rewards` tại `05f5dd0eb9df36d5790e268879b8fbe3699994ea`.
**Trạng thái:** tài liệu triển khai + số liệu thử, không phải PvE/tu luyện đã chạy.
**Nền dự án:** Godot/GDScript, Nakama/TypeScript, PostgreSQL.

> Một người bình thường tiến thân bằng hiểu biết, chuẩn bị và lựa chọn:
> biết cần gì, đi đâu để kiếm, dùng thành quả vào đâu và mở được khả năng gì mới.

## 1. Đọc theo thứ tự mới

Bắt đầu từ [đặc tả tiến trình/PvE](progression-pve-spec.md), rồi
[tiến độ và mốc triển khai](../implementation-status.md). Sau đó đọc phần chuyên môn.
Không bắt đầu bằng file 12/14 chưa có trên Git.

| Tài liệu đang dùng | Vai trò |
| --- | --- |
| [00 — review/quyết định](00-review-and-decisions.md) | Quyết định v2 và ghi chú cập nhật; giữ lịch sử |
| [01 — tầm nhìn/vòng chơi](01-vision-and-core-loop.md) | Lời hứa sản phẩm, nhịp phiên và giới hạn |
| [02 — nhân vật/tu luyện](02-character-and-cultivation.md) | Nguồn tu vi, điều kiện, dư XP và đột phá |
| [03 — chiến đấu](03-combat-skills-and-artifacts.md) | Kỹ năng, AI, quái/loot, dùng đồ, settlement |
| [04 — bản đồ](04-world-and-maps.md) | World topology, nguồn tài nguyên, tuyến tránh và respawn |
| [Map layout spec](map-layout-spec.md) | Kích thước tile, POI, spawn, camera, mobile-safe layout và thứ tự dựng prototype |
| [05 — truyện](05-story-bible.md) | Thế giới/NPC/xung đột; không viết lại trong cập nhật này |
| [06 — nhiệm vụ](06-quests-and-events.md) | Chuỗi 12 + 6 quest, ngân sách XP/tiền, nhánh và chống kẹt |
| [07 — kinh tế/chế tạo](07-garden-crafting-and-economy.md) | Đầu ra loot, 24 ID, vườn, 5 công thức và giá thử |
| [08 — PC + mobile](08-cross-platform-pc-mobile.md) | Kiến trúc dùng chung, input, responsive UI, safe area, camera, DoD và G0.5 |
| [Đặc tả tiến trình/PvE](progression-pve-spec.md) | Nối mọi mảng thành hành trình và mốc P1–P5 |
| [Nguồn tham khảo](progression-references.md) | Cơ chế game tham khảo, phạm vi nguồn và diễn giải riêng |
| [Nhật ký](../project-history.md) | Mốc code/CI đã ghi và lần sửa thiết kế hiện tại |

## 2. Phân biệt code với thiết kế

Mốc nguồn có backend xã hội, prototype đấu tập hai người và nền inventory/reward.
Chưa có PvE, consume/equip/craft, vườn, quest runtime hoặc tu luyện. Xem
[tiến độ](../implementation-status.md), [combat](../combat-prototype.md) và
[tài sản](../inventory-and-rewards.md).

Một bảng JSON/Markdown hoặc unit test số học **không** làm tính năng gameplay trở
thành đã triển khai. Không coi code trên nhánh feature là đã merge vào `main`.

Các phần 08–15, `design-samples/mvp.catalog.json` và `scripts/validate_design.py`
được nhắc ở gói v2 cũ chưa có tại mốc nguồn. Không dùng chúng làm liên kết đọc bắt
buộc hoặc ghi nhận đã có công cụ. Bản cập nhật này bổ sung các file **tên mới** bên
dưới, không giả vờ khôi phục nguyên gói còn thiếu.

## 3. Phạm vi giữ nguyên

Phàm nhân → Luyện Khí 1–4; bốn nhóm khu vực chính (hub/PvE/dungeon/instance) được chia thành các zone phù hợp; 12 quest chính + 6 phụ;
3 loại quái thường + tinh anh + boss; 6 hành động; 3 ô trang bị chiến đấu;
6 ô vườn, 3 cây, 5 công thức và 24 ID item. Co-op mục tiêu 2 người.
PvP là đấu tập đồng thuận, không XP/tiền/loot; không chợ người chơi hoặc cửa hàng thật.

Không mở rộng số lượng hệ thống để che vòng chơi chưa rõ.
Mọi con số mới là giá trị khởi đầu cho test, không benchmark.

## 4. Nguồn số và kiểm tra

[JSON tiến trình](../../design-samples/progression-pve.v1.json) là nguồn số duy nhất
của cập nhật này. Nó **không** được import trực tiếp vào runtime.
Các bảng MD có marker `generated` được đồng bộ từ JSON.

```sh
python scripts/validate_progression_design.py
python scripts/test_progression_design.py
```

Sau khi chủ đích đổi JSON:

```sh
python scripts/validate_progression_design.py --write-tables
python scripts/test_progression_design.py
```

Validator kiểm ID/tham chiếu, quest không vòng lặp, XP ba chặng, nguồn thay thế,
loot/công thức/shop, số học chuyến đi và đồng bộ bảng. Không kiểm gameplay/network
thật hoặc hiệu suất. Chạy lại unit/integration runtime khi bắt đầu triển khai P1–P5.

## 5. Thứ tự sản xuất mới

P1: một Sơn Trư đọc đòn được → P2: chuyến săn có XP/loot lưu được và dùng/equip
có tác dụng → P3: tài khoản mới từ phàm nhân tới Phi Nhận → P4: chuẩn bị/Trúc Âm/
trở về/Hộ Thân → P5: chương Thạch Cạn/Cổ Tỉnh và tầng 3–4.

Giữ các gate nghiệm thu combat/tài sản đã làm. Không thêm tông môn, cảnh giới hoặc
map trước khi đi hết vòng chơi bằng tài khoản mới, không cấp tay đồ/XP.
