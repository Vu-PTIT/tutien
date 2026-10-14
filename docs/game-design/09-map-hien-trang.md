# 09 — Hiện trạng các map

Tài liệu này ghi **những gì đang thật sự có** trong dữ liệu map ở thời điểm 13/10/2026 (nhánh `feat/map-ui-rebuild`), **sau khi thu nhỏ map cho 30 người/kênh** ([10](10-kich-thuoc-map-online.md)). Bố cục từng map, sơ đồ và tọa độ chi tiết ở [05](05-map-layouts.md); mọi thứ đánh dấu **[BE]** ở đó khớp với dữ liệu.

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
- **Ẩn Giới (`m_an_gioi`) chưa có trong dữ liệu** (thiết kế ở [05 §3](05-map-layouts.md)).
- Quái có `storyGate` (đầu đàn, boss) đã khai báo nhưng **không spawn** cho tới khi có hệ thống cốt truyện.
- Server **chưa có kênh** và **quái chưa dùng chung**: hiện mỗi người chơi có bộ quái riêng, chưa thấy người khác theo thời gian thực. Xem việc backend ở [10 §6](10-kich-thuoc-map-online.md).

### Tổng quan 9 map

| ID | Tên | Kích thước (ô) | Xuất phát | Cổng | Điểm hoạt động | Quái thường | NPC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `m_lang_que` | Làng Hồ Lặng | 160×120 | (81,69) | 3 (1 khóa) | 12 câu, 14 thiền, 1 chợ, 1 dạy | 0 | 6 + Bé Mơ |
| `m_nha` | Nhà riêng (mỗi người một bản) | 32×24 | (16,19) | 1 | 12 luống | 0 | 0 |
| `m_vanh_dai_tay` | Bìa Rừng | 176×128 | (88,112) | 3 | 8 thiền | 37 | 2 |
| `m_mo_lo_thien` | Mỏ Bỏ Hoang | 128×112 | (112,96) | 3 | 8 vỉa, 4 thiền | 21 | 1 |
| `m_mo_ngam` | Hầm Mỏ (B1) | 112×80 | (54,74) | 2 (1 khóa) | 6 vỉa | 18 | 0 |
| `m_ba_vi` | Rừng Sâu | 192×144 | (93,133) | 4 (2 khóa) | 6 thiền | 40 | 0 |
| `m_tram_thien_mach` | Trạm Thiên Mạch | 96×80 | (47,70) | 1 (khóa) | 0 | 24 | 0 |
| `m_thang_long` | *(thành phố — sau chương 1)* | 320×256 | (156,139) | 2 (1 khóa) | 0 | 0 | 0 |
| `m_cang_dong_bac` | *(cảng — sau chương 1)* | 256×192 | (43,115) | 1 | 0 | 0 | 0 |

Tổng: **70 điểm hoạt động** (12 câu, 12 luống, 14 vỉa, 32 thiền theo 6 hệ), **14 loài quái**, **140 quái thường** + 4 đầu đàn/boss đang khóa, **9 NPC**.

### Sơ đồ nối cổng

```text
                         ┌─────────────────┐
                         │ Trạm Thiên Mạch │
                         └────────▲────────┘
                                  │ ln_rung_tram 🔒
┌─────────────┐  ln_mo_rung  ┌────┴─────┐  ln_ngam_rung 🔒  ┌─────────┐
│ Mỏ Bỏ Hoang │◄────────────►│ Rừng Sâu │◄─────────────────►│ Hầm Mỏ  │
└──▲───────┬──┘              └────▲─────┘                   └────▲────┘
   │       │ ln_mo_ngam (giếng thang máy)                         │
   │       └──────────────────────┼────────────────────────────────┘
   │ ln_vanh_mo                   │ ln_vanh_rung
   │                         ┌────┴─────┐
   └────────────────────────►│ Bìa Rừng │   (đông: cao tốc gãy, chỉ là cảnh nền)
                             └────▲─────┘
                                  │ ln_lang_vanh (Chốt Tường Rào)
┌───────────┐ ln_lang_nha    ┌────┴─────────┐
│ Nhà riêng │◄──────────────►│ Làng Hồ Lặng │── ln_lang_thang 🔒 ──► Thăng Long ──► Cảng
└───────────┘                └──────────────┘
```

### Bảng cổng

Mỗi cổng có một điểm ở **cả hai map** cùng ID. Bán kính kích hoạt 2 ô. Cổng khóa trả lỗi *"Lối này chưa mở trong phần chơi hiện tại."*

| Cổng | Đầu A (map, ô) → điểm đến | Đầu B (map, ô) → điểm đến | Trạng thái |
| --- | --- | --- | --- |
| `ln_lang_vanh` — Chốt Tường Rào | Làng (92,5) → Bìa Rừng (87,119) | Bìa Rừng (87,123) → Làng (92,8) | mở |
| `ln_lang_nha` — Cửa nhà | Làng (47,78) → Nhà (16,19) | Nhà (16,22) → Làng (47,81) | mở |
| `ln_vanh_rung` | Bìa Rừng (95,5) → Rừng Sâu (93,136) | Rừng Sâu (93,139) → Bìa Rừng (95,8) | mở |
| `ln_vanh_mo` | Bìa Rừng (5,31) → Mỏ (120,90) | Mỏ (123,90) → Bìa Rừng (8,31) | mở |
| `ln_mo_rung` | Mỏ (123,25) → Rừng Sâu (8,110) | Rừng Sâu (5,110) → Mỏ (120,25) | mở |
| `ln_mo_ngam` — Giếng thang máy | Mỏ (49,47) → Hầm (54,72) | Hầm (54,76) → Mỏ (49,50) | mở |
| `ln_ngam_rung` — Hầm cũ | Hầm (107,20) → Rừng Sâu (8,120) | Rừng Sâu (5,120) → Hầm (104,21) | 🔒 hồi D |
| `ln_rung_tram` — Cửa kín | Rừng Sâu (101,5) → Trạm (47,71) | Trạm (47,75) → Rừng Sâu (101,8) | 🔒 hồi E |
| `ln_lang_thang` — Trạm buýt | Làng (156,66) → Thăng Long (14,60) | Thăng Long (10,60) → Làng (153,66) | 🔒 sau chương 1 |
| `ln_thang_cang` | Thăng Long (311,93) → Cảng (13,93) | Cảng (9,93) → Thăng Long (307,93) | mở (không tới được) |

---

## 1. Điểm hoạt động

| Hoạt động | Map | ID | Số điểm | Ghi chú |
| --- | --- | --- | --- | --- |
| Câu cá | Làng | `new_fish_01…12` | 12 | 6 trên sàn gỗ bờ bắc, 3 trên cầu gỗ, 3 bờ đông |
| Trồng | Nhà riêng | `new_plot_01…12` | 12 | `plotId` 0–11; **khóa theo từng người chơi** |
| Đào | Mỏ | `ml_iron_01…08` | 8 | Hố Tây |
| Đào | Hầm Mỏ | `ng_iron_b1_01…06` | 6 | Vỉa Đông, `floorId: b1` |
| Thiền Thổ | Làng | `lq_med_mieu`, `lq_med_mieu_02…08` | 8 | Sân miếu |
| Thiền Thủy | Làng | `lq_med_ho`, `lq_med_ho_02…04` | 4 | Bờ nam Hồ Lặng |
| Thiền Phong | Bìa Rừng | `vd_med_thap`, `vd_med_thap_02…04` | 4 | Chân tháp cảm biến |
| Thiền Kim | Mỏ | `mb_med_ho_tay`, `mb_med_ho_tay_02…04` | 4 | Mỏm đá Hố Tây |
| Thiền Hỏa | Bìa Rừng | `vd_med_lua`, `vd_med_lua_02…04` | 4 | Bên đống lửa trại thợ săn |
| Thiền Hỏa | Làng | `lq_med_lo_ren`, `lq_med_lo_ren_02` | 2 | Sân lò rèn Doran |
| Thiền Mộc | Rừng Sâu | `rs_med_goc_nam…_03`, `rs_med_goc_bac…_03` | 6 | Hai gốc cây Tinh Linh |
| Cửa hàng | Làng | `lq.shop.market` | 1 | Chợ phiên |
| Dạy học | Làng | `lq.npc.be_mo` | 1 | Bé Mơ cạnh sân miếu |

Ngoài luống, mỗi điểm chỉ cho **1 người dùng một lúc trên toàn server** (avatar offline cũng giữ chỗ). Khi có kênh, chuyển sang khóa theo kênh. Sản lượng: [08](08-life-yields.md).

## 2. Quái

| Map | Loài × số con | Tổng | Đang khóa |
| --- | --- | --- | --- |
| Bìa Rừng | Gà Rừng 16 (ngày), Lợn Gai 12, Nhện Tơ Điện 9 | 37 | Lợn Gai Đầu Đàn |
| Mỏ Bỏ Hoang | Nhện Tơ Điện 9, Rết Đá 12 | 21 | — |
| Hầm Mỏ | Dơi Vân Quặng 12, Nhện Tơ Điện 6 | 18 | Nhện Mẹ |
| Rừng Sâu | Sói Rêu 12, Rắn Sương 10, Khỉ Vách Đá 12 (ngày), Cú Đêm Linh 6 (đêm) | 40 | Khỉ Đầu Đàn |
| Trạm Thiên Mạch | Chuột Tím 24 | 24 | Thủ Lĩnh Mạch Gãy (quay lại sau 47 phút) |

Chỉ số từng loài: [06](06-monsters.md). Vị trí từng lãnh địa: [05 §4](05-map-layouts.md).

## 3. NPC

| Map | NPC | Vị trí (ô) |
| --- | --- | --- |
| Làng | Bà Nora (37,70) · Rin (103,88) · Doran (110,33) · Tiến sĩ Theo (123,33) · Đội Tuần Tra Chốt (95,10) · Đội Tuần Tra Cổng (75,60) · Bé Mơ (33,24, điểm dạy) | |
| Bìa Rừng | Thợ săn Liên hiệp (81,113) · Đội Tuần Tra (95,113) | |
| Mỏ Bỏ Hoang | Chú Bram (110,91) | |

---

## 4. Chỗ dữ liệu còn lệch thiết kế

| # | Thiết kế | Dữ liệu hiện tại | Cần làm |
| --- | --- | --- | --- |
| 1 | Map `m_an_gioi` (Ẩn Giới, 128×96) | Không có | Thêm map, 8 điểm Hấp Linh, 6 bến câu linh, 6 luống nấm riêng |
| 2 | Cổng Ẩn Giới làng (80,57) ↔ Ẩn Giới (64,86), ID `ln_lang_angioi` | Không có | Thêm cặp cổng |
| 3 | Collision theo nhà, cây, vách | Chỉ có tường viền, nước, cầu | Thêm footprint khi có art |
| 4 | Lối mòn ẩn Rừng Sâu (chỉ đi khi Hóa Thú) | Không có | Lớp collision riêng |
| 5 | Kênh 30 người, quái dùng chung, khóa điểm theo kênh | Chưa có | Backend, xem [10 §6](10-kich-thuoc-map-online.md) |
| 6 | Mỗi người một bản `m_nha` | Server chưa có đồng bộ người chơi nên `m_nha` đã riêng sẵn; luống khóa theo người | Khi có kênh: `m_nha` không bao giờ ghép người lạ |
| 7 | Bé Mơ là Tinh Linh ở Ẩn Giới | Đứng ở làng (33,24) làm điểm dạy Hấp Linh | **Đã quyết:** giữ ở làng — Bé Mơ là Tinh Linh hay sang làng chơi; khi có Ẩn Giới thì thêm một điểm dạy thứ hai ở đó |
| 8 | Làng ~10 NPC Người + ~3 Tinh Linh; Ẩn Giới ~8 Tinh Linh | Làng có 6 NPC + Bé Mơ | Bổ sung khi dựng map |
| 9 | Trạm: máu boss theo số người, lõi chung cả kênh, lưu lựa chọn hồi E | Chưa có | Backend, xem [10 §6](10-kich-thuoc-map-online.md) |
