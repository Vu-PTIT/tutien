# 09 — Hiện trạng map và khoảng cách tới thiết kế

**Kiểm tra ngày 15/10/2026**, nguồn code tại commit `35e1c9b`, nhánh `feat/fantasy-world`. Tài liệu này mô tả dữ liệu đã đọc, không coi thiết kế là tính năng đã chạy. Lần sửa này chỉ cập nhật Markdown.

## 1. Chuẩn thiết kế hiện hành

- [03](03-world-and-maps.md), [12](12-ban-do-cac-khu.md): fantasy cổ, sáu khu; Tâm Ẩn là vùng cây trung tâm an toàn, spawn Tinh Linh; Người spawn Làng Hồ Lặng.
- [11](11-ti-le-map.md): 32 px/ô logic, tốc độ mục tiêu 128 px/s, kích thước nhỏ đã duyệt.
- [04](04-map-art.md): 5 nhóm G1–G5, vật thể riêng, hiệu ứng cục bộ.
- [05](05-map-layouts.md): tọa độ blockout là thiết kế, chưa được khẳng định trùng backend.

## 2. Dữ liệu thực đọc từ repository

`server/data/life_world.json` có **10 map**. Kích thước là ô logic; spawnX/spawnY là pixel. Bảng dưới đã chia spawn cho 32 để hiển thị theo ô.

| ID | Tên theo thiết kế | Kích thước dữ liệu | Mục tiêu | Spawn dữ liệu (ô) | Số cổng |
| --- | --- | --- | --- | --- | --- |
| `m_k1_01` | Làng Hồ Lặng | 160×120 | 96×72 | (81, 69) | 4 |
| `m_nha` | Nhà riêng | 32×24 | 28×20 | (16, 19) | 1 |
| `m_k1_02` | Bìa Rừng | 176×128 | 112×80 | (88, 112) | 3 |
| `m_k1_03` | Mỏ Bỏ Hoang | 128×112 | 80×64 | (112, 96) | 3 |
| `m_k1_04` | Hầm Mỏ | 112×80 | 72×48 | (54, 74) | 2 |
| `m_k1_05` | Rừng Sâu | 192×144 | 128×96 | (93, 133) | 4 |
| `m_k1_06` | Đài Thiên Mạch | 96×80 | 64×48 | (47, 70) | 1 |
| `m_k1_08` | Kinh thành | 320×256 | 128×96 | (156, 139) | 2 |
| `m_k2_01` | Thành Cảng Lam Loan | 256×192 | 96×72 | (43, 115) | 1 |
| `m_k0_01` | Tâm Ẩn | 128×96 | 80×60 | (64, 48) | 1 |

- `WORLD_SPEED = 72` trong `server/src/world.ts`: tốc độ runtime chưa đạt mục tiêu 128 px/s.
- `client/scenes/main.tscn` là Control `SpiritGameplay` dùng `spirit_gameplay.gd`, không phải Node2D rỗng. Không coi scene gameplay này là bộ map art đã nghiệm thu.
- `m_k1_07` Vườn Cây Mẹ chưa có trong `life_world.json`.
- `server/data/world_population.json` được tài liệu/code tham chiếu nhưng **không có trong tree của commit kiểm tra**. Không xác nhận lại tổng quái/NPC hoặc kết quả build từ những con số tài liệu cũ. Cần khôi phục/đối chiếu nguồn trước khi migration.
- Chưa chạy Godot hoặc test server trong lượt sửa tài liệu này.

## 3. Kết nối đang có khác thiết kế

Dữ liệu nối trực tiếp Làng Hồ Lặng ↔ Tâm Ẩn qua `ln_k1_01_k0_01`. Tâm Ẩn có kích thước 128×96, spawn (64,48), cổng ở (64,90). Đây chưa phải bố cục 80×60 với sáu tuyến quanh Cây Trung Tâm.

Theo thiết kế, Lối Rễ của làng dẫn tới **Vườn Cây Mẹ ở Đầm Sen**, rồi mạng giao thoa dẫn vào Tâm Ẩn. Không chỉ đổi tên `m_k0_01` thành Vườn Cây Mẹ: phải giữ hai ID và vai trò riêng.

## 4. Migration cần làm sau phần tài liệu

1. Thu nhỏ các map, đặt lại nước, cầu, collision, cổng, điểm hoạt động và spawn; không scale tọa độ một cách máy móc.
2. Dựng riêng `m_k1_07`; chuyển Lối Rễ về đúng làng Đầm Sen. Thiết lập các tuyến Tâm Ẩn theo [12 §9](12-ban-do-cac-khu.md#9-tâm-ẩn-giữa--vùng-cây-trung-tâm).
3. Áp toàn vùng an toàn cho `m_k0_01`: không quái thù địch, không sát thương linh năng hay tích đục. Spawn tại Đài phải có đường an toàn ra các tuyến cư trú.
4. Đồng bộ role spawn, tốc độ 128 px/s và kiểm tra quãng đường phía server.
5. Khôi phục/đối chiếu nguồn quái, đặt lãnh địa theo [06](06-monsters.md); không dùng cấp quái hoặc khóa truyện để chặn map.
6. Kiểm tra cổng hai chiều, điểm đến trong biên, không đứng trên nước/vật cản; tuyến cư trú không cắt lãnh địa; nghiệm thu art ở zoom chơi.
7. Kênh 30 người, quái chung và khóa hoạt động theo kênh vẫn cần nghiệm thu triển khai riêng; không suy ra đã làm từ bảng kích thước.

**Phần đã hoàn thành trong lượt này: chuẩn hóa tài liệu. Phần dữ liệu, code và art chưa được migration.**
