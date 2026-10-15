# 09 — Hiện trạng các map

Tài liệu này ghi **những gì đang thật sự có** trong dữ liệu map ở thời điểm 13/10/2026 (dữ liệu backend của rìa khu Mộc), **theo đợt thu nhỏ thứ nhất cho 30 người/kênh** ([10](10-kich-thuoc-map-online.md)). 

> [!NOTE]
> Ngày 15/10/2026, dự án đã **chính thức chốt quy chuẩn tỉ lệ mới tại [11](11-ti-le-map.md)** (Làng 96×72, tốc độ di chuyển 4 ô/s). Dữ liệu backend `server/data/*.json` hiện tại trong file này vẫn đang ở mốc 13/10 (Làng 160×120) và sẽ được chuyển dịch (migration) theo lộ trình. Bố cục từng map, sơ đồ và tọa độ chi tiết ở [05](05-map-layouts.md); mọi thứ đánh dấu **[BE]** ở đó khớp với dữ liệu mốc 13/10.

**Nguồn dữ liệu:**

| File | Chứa gì |
| --- | --- |
| `server/data/life_world.json` | Kích thước map, điểm xuất phát, cổng, điểm hoạt động (câu, trồng, đào, thiền), nước, cầu |
| `server/data/world_population.json` | Loài quái, lãnh địa quái, vùng an toàn, NPC |
| `scripts/build-life-world.cjs` | Kiểm tra và biên dịch hai file trên thành `server/src/life_world_generated.ts` |

Tọa độ theo **ô 32 px**, gốc (0,0) ở góc trên-trái.

---

## 0. Tình trạng chung

- **Client (Godot): chưa có map nào.** Scene, art, tileset map cũ đã xóa ngày 12/10/2026; `client/scenes/main.tscn` là một `Node2D` rỗng.
- **Backend: 9 map** dạng khung dữ liệu (cổng, điểm hoạt động, nước, quái, NPC). Không có art.
- **Chưa có collision bên trong map.** Footprint cũ của làng đã bỏ khi thu nhỏ; mọi map chỉ có tường viền, nước và cầu. Collision nhà, cây, vách thêm lại khi dựng art.
- **Vườn Cây Mẹ (`m_k1_07`) chưa có trong dữ liệu** (thiết kế ở [05 §3](05-map-layouts.md)).
- Quái có `storyGate` (đầu đàn, boss) đã khai báo nhưng **không spawn** cho tới khi có hệ thống cốt truyện.
- Server **chưa có kênh** và **quái chưa dùng chung**: hiện mỗi người chơi có bộ quái riêng, chưa thấy người khác theo thời gian thực. Xem việc backend ở [10 §6](10-kich-thuoc-map-online.md).

### Tổng quan 9 map

| ID | Tên | Kích thước BE (13/10) | Chuẩn mới [11] | Xuất phát | Cổng | Điểm hoạt động | Quái thường | NPC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `m_k1_01` | Làng Hồ Lặng | 160×120 | **96×72** | (81,69) | 3 | 12 câu, 14 thiền, 1 chợ, 1 dạy | 0 | 6 + Bé Mơ |
| `m_nha` | Nhà riêng (mỗi người một bản) | 32×24 | **28×20** | (16,19) | 1 | 12 luống | 0 | 0 |
| `m_k1_02` | Bìa Rừng | 176×128 | **112×80** | (88,112) | 3 | 8 thiền | 37 | 2 |
| `m_k1_03` | Mỏ Bỏ Hoang | 128×112 | **80×64** | (112,96) | 3 | 8 vỉa, 4 thiền | 21 | 1 |
| `m_k1_04` | Hầm Mỏ (B1) | 112×80 | **72×48** | (54,74) | 2 | 6 vỉa | 18 | 0 |
| `m_k1_05` | Rừng Sâu | 192×144 | **128×96** | (93,133) | 4 | 6 thiền | 40 | 0 |
| `m_k1_06` | Đài Thiên Mạch | 96×80 | **64×48** | (47,70) | 1 | 0 | 24 | 0 |
| `m_k1_08` | *(Kinh thành — mới có khung)* | 320×256 | **128×96** | (156,139) | 2 | 0 | 0 | 0 |
| `m_k2_01` | *(Thành Cảng Lam Loan — mới có khung)* | 256×192 | **96×72** | (43,115) | 1 | 0 | 0 | 0 |

*(Lưu ý: Map `m_k1_07` Vườn Cây Mẹ chưa có trong dữ liệu backend, chuẩn thiết kế mới là **80×60**)*

Tổng: **70 điểm hoạt động** (12 câu, 12 luống, 14 vỉa, 32 thiền theo 6 hệ), **14 loài quái**, **140 quái thường** + 4 đầu đàn/boss, **9 NPC**.

### Sơ đồ nối cổng

```text
                         ┌─────────────────┐
                         │ Đài Thiên Mạch │
                         └────────▲────────┘
                                  │ ln_k1_05_k1_06
┌─────────────┐  ln_k1_03_k1_05  ┌────┴─────┐  ln_k1_04_k1_05  ┌─────────┐
│ Mỏ Bỏ Hoang │◄────────────►│ Rừng Sâu │◄─────────────────►│ Hầm Mỏ  │
└──▲───────┬──┘              └────▲─────┘                   └────▲────┘
   │       │ ln_k1_03_k1_04 (giếng tời)                         │
   │       └──────────────────────┼────────────────────────────────┘
   │ ln_k1_02_k1_03                   │ ln_k1_02_k1_05
   │                         ┌────┴─────┐
   └────────────────────────►│ Bìa Rừng │   (đông: cầu đá cổ gãy, chỉ là cảnh nền)
                             └────▲─────┘
                                  │ ln_k1_01_k1_02 (Chốt tường cọc)
┌───────────┐ ln_k1_01_nha    ┌────┴─────────┐
│ Nhà riêng │◄──────────────►│ Làng Hồ Lặng │── ln_k1_01_k1_08 ──► Kinh thành ──► Thành Cảng
└───────────┘                └──────────────┘
```

### Bảng cổng

Mỗi cổng có một điểm ở **cả hai map** cùng ID. Bán kính kích hoạt 2 ô. Mọi cổng đều mở tự do, thế giới hoàn toàn mở từ đầu không có cơ chế khóa cổng (kể cả Tâm Ẩn).

| Cổng | Đầu A (map, ô) → điểm đến | Đầu B (map, ô) → điểm đến | Trạng thái |
| --- | --- | --- | --- |
| `ln_k1_01_k1_02` — Chốt tường cọc | Làng (92,5) → Bìa Rừng (87,119) | Bìa Rừng (87,123) → Làng (92,8) | mở |
| `ln_k1_01_nha` — Cửa nhà | Làng (47,78) → Nhà (16,19) | Nhà (16,22) → Làng (47,81) | mở |
| `ln_k1_02_k1_05` | Bìa Rừng (95,5) → Rừng Sâu (93,136) | Rừng Sâu (93,139) → Bìa Rừng (95,8) | mở |
| `ln_k1_02_k1_03` | Bìa Rừng (5,31) → Mỏ (120,90) | Mỏ (123,90) → Bìa Rừng (8,31) | mở |
| `ln_k1_03_k1_05` | Mỏ (123,25) → Rừng Sâu (8,110) | Rừng Sâu (5,110) → Mỏ (120,25) | mở |
| `ln_k1_03_k1_04` — Giếng tời | Mỏ (49,47) → Hầm (54,72) | Hầm (54,76) → Mỏ (49,50) | mở |
| `ln_k1_04_k1_05` — Hầm cũ | Hầm (107,20) → Rừng Sâu (8,120) | Rừng Sâu (5,120) → Hầm (104,21) | mở |
| `ln_k1_05_k1_06` — Cửa đá | Rừng Sâu (101,5) → Đài (47,71) | Đài (47,75) → Rừng Sâu (101,8) | mở |
| `ln_k1_01_k1_08` — Trạm xe ngựa | Làng (156,66) → Kinh thành (14,60) | Kinh thành (10,60) → Làng (153,66) | mở |
| `ln_k1_08_k2_01` | Kinh thành (311,93) → Cảng (13,93) | Cảng (9,93) → Kinh thành (307,93) | mở (không tới được) |

---

## 1. Điểm hoạt động

| Hoạt động | Map | ID | Số điểm | Ghi chú |
| --- | --- | --- | --- | --- |
| Câu cá | Làng | `k1_01_fish_01…12` | 12 | 6 trên sàn gỗ bờ bắc, 3 trên cầu gỗ, 3 bờ đông |
| Trồng | Nhà riêng | `nha_plot_01…12` | 12 | `plotId` 0–11; **khóa theo từng người chơi** |
| Đào | Mỏ | `k1_03_ore_01…08` | 8 | Hố Tây |
| Đào | Hầm Mỏ | `k1_04_ore_01…06` | 6 | Vỉa Đông, `floorId: b1` |
| Thiền Thổ | Làng | `k1_01_med_01…08` | 8 | Sân miếu |
| Thiền Thủy | Làng | `k1_01_med_09…12` | 4 | Bờ nam đầm Hồ Lặng |
| Thiền Phong | Bìa Rừng | `k1_02_med_01…04` | 4 | Chân tháp canh |
| Thiền Kim | Mỏ | `k1_03_med_01…04` | 4 | Mỏm đá Hố Tây |
| Thiền Hỏa | Bìa Rừng | `k1_02_med_05…08` | 4 | Bên đống lửa trại thợ săn |
| Thiền Hỏa | Làng | `k1_01_med_13`, `k1_01_med_14` | 2 | Sân lò rèn Doran |
| Thiền Mộc | Rừng Sâu | `k1_05_med_01…06` | 6 | Hai gốc cây Tinh Linh |
| Cửa hàng | Làng | `k1_01.shop.market` | 1 | Chợ phiên |
| Dạy học | Làng | `k1_01.npc.be_mo` | 1 | Bé Mơ cạnh sân miếu |

Ngoài luống, mỗi điểm chỉ cho **1 người dùng một lúc trên toàn server** (avatar offline cũng giữ chỗ). Khi có kênh, chuyển sang khóa theo kênh. Sản lượng: [08](08-life-yields.md).

## 2. Quái

| Map | Loài × số con | Tổng | Đang khóa |
| --- | --- | --- | --- |
| Bìa Rừng | Gà Rừng 16 (ngày), Lợn Gai 12, Nhện Tơ Điện 9 | 37 | Lợn Gai Đầu Đàn |
| Mỏ Bỏ Hoang | Nhện Tơ Điện 9, Rết Đá 12 | 21 | — |
| Hầm Mỏ | Dơi Vân Quặng 12, Nhện Tơ Điện 6 | 18 | Nhện Mẹ |
| Rừng Sâu | Sói Rêu 12, Rắn Sương 10, Khỉ Vách Đá 12 (ngày), Cú Đêm Linh 6 (đêm) | 40 | Khỉ Đầu Đàn |
| Đài Thiên Mạch | Chuột Tím 24 | 24 | Thủ Lĩnh Mạch Gãy (quay lại sau 47 phút) |

Chỉ số từng loài: [06](06-monsters.md). Vị trí từng lãnh địa: [05 §4](05-map-layouts.md).

## 3. NPC

| Map | NPC | Vị trí (ô) |
| --- | --- | --- |
| Làng | Bà Nora (37,70) · Rin (103,88) · Doran (110,33) · Học giả Theo (123,33) · Đội Tuần Rừng Chốt (95,10) · Đội Tuần Rừng Cổng Rễ (8,48) · Bé Mơ (33,24, điểm dạy) | |
| Bìa Rừng | Thợ săn (81,113) · Đội Tuần Rừng (95,113) | |
| Mỏ Bỏ Hoang | Chú Bram (110,91) | |

---

## 4. Chỗ dữ liệu còn lệch thiết kế

| # | Thiết kế | Dữ liệu hiện tại | Cần làm |
| --- | --- | --- | --- |
| 1 | Map `m_k1_07` (Vườn Cây Mẹ, 128×96) | Không có | Thêm map, 8 điểm Hấp Linh, 6 bến câu linh, 6 luống nấm riêng |
| 2 | Cổng Rễ làng (4,50) ↔ Vườn Cây Mẹ (64,86), ID `ln_k1_01_k1_07` | Không có | Thêm cặp cổng |
| 3 | Collision theo nhà, cây, vách | Chỉ có tường viền, nước, cầu | Thêm footprint khi có art |
| 4 | Lối mòn ẩn Rừng Sâu (chỉ đi khi Hóa Thú) | Không có | Lớp collision riêng |
| 5 | Kênh 30 người, quái dùng chung, khóa điểm theo kênh | Chưa có | Backend, xem [10 §6](10-kich-thuoc-map-online.md) |
| 6 | Mỗi người một bản `m_nha` | Server chưa có đồng bộ người chơi nên `m_nha` đã riêng sẵn; luống khóa theo người | Khi có kênh: `m_nha` không bao giờ ghép người lạ |
| 7 | Bé Mơ là Tinh Linh ở Vườn Cây Mẹ | Đứng ở làng (33,24) làm điểm dạy Hấp Linh | **Đã quyết:** giữ ở làng — Bé Mơ là Tinh Linh hay sang làng chơi; khi có Vườn Cây Mẹ thì thêm một điểm dạy thứ hai ở đó |
| 8 | Làng ~10 NPC Người + ~3 Tinh Linh; Vườn Cây Mẹ ~8 Tinh Linh | Làng có 6 NPC + Bé Mơ | Bổ sung khi dựng map |
| 9 | Đài: máu boss theo số người, lõi chung cả kênh, lưu lựa chọn hồi E | Chưa có | Backend, xem [10 §6](10-kich-thuoc-map-online.md) |
| 10 | Di chuyển kích thước & tọa độ toàn bộ sang chuẩn mới [11](11-ti-le-map.md) (Làng 96×72, v.v., `WORLD_SPEED = 128`) | Đang ở mốc 13/10 (Làng 160×120, tốc độ 72) | Chuyển dịch dữ liệu `life_world.json`, `world_population.json`, cập nhật kiểm tra server |
