# 11 — Tỉ lệ và kích thước map chuẩn

**Trạng thái:** **Đã chốt 15/10/2026** (Chủ dự án duyệt chính thức). Tài liệu này là quy chuẩn tỉ lệ, kích thước map và tốc độ di chuyển chính thức thay thế bảng §4 của [10](10-kich-thuoc-map-online.md), làm căn cứ cập nhật [05](05-map-layouts.md), [09](09-map-hien-trang.md) và lộ trình di chuyển dữ liệu `server/data/*.json`.

**Vấn đề:** dựng Làng Hồ Lặng 160×120 trong game thì map trông quá to: nhà nhỏ xíu giữa những mảng cỏ trống, đường dài, hồ và ruộng cách nhau xa. Đo trên ảnh chụp toàn map: nhà chỉ khoảng 4–5 ô ngang, phần có nội dung (nhà, đường, nước, ruộng) chiếm khoảng một phần tư diện tích, còn lại là cỏ trống.

---

## 1. So với các game cùng thể loại

| | Pokémon (Game Boy, thế hệ 1–3) | Stardew Valley | Tu Tiên hiện tại |
| --- | --- | --- | --- |
| Ô | 16 px | 16 px (vẽ ×4 = 64 px trên màn) | 32 px |
| Nhân vật | ~1 ô ngang, ~1,3 ô cao | 16×32 px = 1×2 ô | 32×48, cao ~1,3 ô |
| Một thị trấn | Pallet Town **20×18 ô**; thành phố lớn khoảng 40×36 ô | Nông trại chuẩn **80×65 ô**; thị trấn Pelican chật kín nhà, đường, hàng rào | Làng **160×120 ô** |
| Tốc độ đi bộ | ~3,75 ô/giây (1 ô mỗi 16 khung hình) | ~4–5 ô/giây (ước tính từ mã game) | **2,25 ô/giây** |
| Cảm giác | Mọi thứ ngay cạnh nhau | Dày đồ, đi đâu cũng có thứ để nhìn | Trống, đi lâu |

Rút ra ba điều:

1. **Tốc độ đi của mình chỉ bằng khoảng một nửa** các game tham chiếu. Đây là lý do lớn nhất làm map *cảm thấy* to: cùng một quãng đường, người chơi mất gấp đôi thời gian.
2. **Nhà và vật quá nhỏ so với lưới.** Trong các game tham chiếu, một căn nhà chiếm khoảng 4–6 lần chiều cao nhân vật theo chiều ngang và có sân, hàng rào, đồ đạc xung quanh. Nhà của mình đứng trơ giữa cỏ.
3. **Mật độ thấp.** Game cozy lấp gần như mọi màn hình bằng đồ vật kể chuyện; khoảng trống chỉ có chủ đích (quảng trường, ruộng, mặt hồ).

## 2. Tỉ lệ mới

### 2.1 Giữ nguyên

- **1 ô logic = 32 px** (quy đổi đo bố cục, không ép kích thước hay vị trí asset vào ô), nhân vật cao ~1,3 ô, camera và zoom như [04](04-map-art.md) §2. Màn hình ×2 vẫn thấy ≈ 30×17 ô.

### 2.2 Tốc độ đi bộ: 2,25 → **4 ô/giây** (128 px/s)

- Đi ngang 1 màn: 13 s → **7,5 s**.
- Ngang với các game tham chiếu. Có thể thêm chạy (×1,5) sau.
- Server: `WORLD_SPEED` 72 → 128 trong `server/src/world.ts` (kiểm tra chống gian lận vị trí theo tốc độ mới).

### 2.3 Kích thước map: còn khoảng 60% mỗi chiều (≈ 36% diện tích)

| Map | Hiện tại | **Mới** | Số màn | Đi ngang (4 ô/s) | Ô / người (30) |
| --- | --- | --- | --- | --- | --- |
| Làng Hồ Lặng | 160×120 | **96×72** | 13,5 | 24 s | 230 |
| Vườn Cây Mẹ | 128×96 | **80×60** | 9,4 | 20 s | 160 |
| Bìa Rừng | 176×128 | **112×80** | 17,6 | 28 s | 300 |
| Rừng Sâu | 192×144 | **128×96** | 24 | 32 s | 410 |
| Mỏ Bỏ Hoang | 128×112 | **80×64** | 10 | 20 s | 170 |
| Hầm Mỏ (B1) | 112×80 | **72×48** | 6,8 | 18 s | 115 |
| Đài Thiên Mạch | 96×80 | **64×48** | 6 | 16 s | 100 |
| Nhà riêng | 32×24 | **28×20** | 1,1 | 7 s | 1 người |

Gộp cả tốc độ: đi ngang làng từ **71 s còn 24 s**, tức cảm giác nhỏ đi khoảng 3 lần.

Vẫn hợp với 30 người/kênh ([10](10-kich-thuoc-map-online.md)): làng đủ 30 người là ~2 người mỗi màn, chỉ 10 người online vẫn có ~0,7 người mỗi màn. Map săn đông hơn trước nên quái cần **nhóm nhỏ, nhiều nhóm** (giữ tối đa 6 quái/màn).

**Quy chuẩn theo phân loại map áp dụng cho toàn bộ 50 map lục địa** (danh sách chi tiết xem tại [12-ban-do-cac-khu.md](12-ban-do-cac-khu.md)):
- **Thị trấn lớn (Kinh thành):** **128×96** (32 s đi ngang)
- **Thị trấn chuẩn (Làng, Cảng cả lục địa):** **96×72** (24 s đi ngang)
- **Thị trấn nhỏ / Trạm dừng chân:** **80×64** (20 s đi ngang)
- **Làng Tinh Linh & Tâm Ẩn (`m_k0_01`):** **80×60** (20 s đi ngang; Tâm Ẩn là vùng cây trung tâm an toàn, không là lõi boss)
- **Đất hoang lớn (Bãi săn chính mỗi khu):** **128×96** (32 s đi ngang, sức chứa 40 quái)
- **Đất hoang vừa (Bìa rừng, sườn núi, vùng giao thoa):** **112×80** (28 s đi ngang)
- **Hầm mỏ / Dungeon tầng 1:** **80×64** (20 s đi ngang)
- **Hầm mỏ / Dungeon tầng sâu:** **72×48** (18 s đi ngang)
- **Lõi / Boss vùng:** **80×80** (riêng Đài Thiên Mạch **64×48**)
- **Nhà riêng (`m_nha`):** **28×20** (7 s đi ngang, 12 luống riêng biệt)

### 2.4 Kích thước vật (theo ô, đo trên mặt bằng)

| Vật | Mặt bằng (ô) | Ghi chú |
| --- | --- | --- |
| Nhân vật | 1 × 1 (cao 1,3) | Thước đo chung |
| Cửa | 1,5 | |
| Đường xe | 3–4 rộng | Đường làng chính |
| Ngõ, lối mòn | 1,5–2 rộng | |
| Nhà nhỏ | **6×4** + mái | Kèm sân/hàng rào ~ 9×7 |
| Nhà 2 tầng, cửa hàng | **8×5** | Mặt tiền 2 tầng, biển hiệu |
| Công trình lớn (miếu, Trạm Tháp Học, xưởng rèn) | **10–12 × 6–8** | Là vật mốc của khu |
| Cây thường | tán 3×3, gốc 1 ô | |
| Cây cổ thụ | tán 5×5 | |
| Sân Hội Khai Phá | **16×12** | Chi hội Khai Phá ~ 8 ô ngang |
| Đầm Hồ Lặng | **26×14** | 12 bến câu quanh sàn gỗ và cầu |
| Ruộng/luống | ô ruộng 6×4; luống 1×2 | |

Nhà và công trình **to hơn** trước (nhà nhỏ 4–5 ô → 6 ô), trong khi map nhỏ đi: hai thay đổi này cùng làm map bớt trống.

### 2.5 Luật mật độ

- **Mỗi màn (30×17 ô) có ít nhất 1 vật mốc hoặc 1 điểm tương tác**, và đồ vật kể chuyện theo [04](04-map-art.md) §7.
- **Không có mảng cỏ trống quá 8×8 ô** trừ khoảng trống có chủ đích (quảng trường, ruộng, mặt hồ, bãi săn).
- Phần có nội dung (nhà, sân, đường, nước, ruộng, cụm cây, đồ vật) **≥ 60% diện tích** ở map làng; ≥ 40% ở map săn.
- Các khu chạm nhau hoặc cách nhau tối đa **1 khoảng sân/đường** (≤ 6 ô); khu nối khu bằng đường có đồ vật hai bên, không đi qua bãi cỏ trống.
- Bản đồ toàn map (phím M) luôn trông thưa hơn trong game vì thu nhỏ; duyệt mật độ bằng ảnh chụp **ở zoom chơi thật**.

## 3. Làng Hồ Lặng 96×72 (phác)

```text
x→ 0        16        32        48        64        80      96
y0 ╔════════════════════ TƯỜNG CỌC ════[CHỐT]══════════════╦≈≈╗
   ║ ┌─ ĐỒI MIẾU ─┐                       │  ┌─ PHỐ CHỢ ────┐≈  ║
 8 ║ │ miếu ☯☯☯☯  │                       │  │ rèn  Tháp Học│≈  ║
   ║ │ Bé Mơ ☯☯☯☯ │                       │  │ tạp hóa  trọ │≈  ║
16 ║ └────────────┘                       │  └──────────────┘≈  ║
 ┌─╢ ┌──── XÓM NHÀ ─────┐ ┌─ SÂN HỘI ──────┐┌ CHỢ ┐             ≈  ║
 │◎║ │ ⌂ ⌂ ⌂  giếng     │ │  ⌂ CHI HỘI     ││     │═════════cầu═╪═► xe ngựa
 │RỄ │ ⌂ ⌂ ⌂  sân phơi  │ │  sân thi  ★    │└─────┘             ≈  ║
32 ║ │ ⌂ Nora ⌂ CỬA NHÀ │ └────────────────┘                    ≈  ║
   ║ └──────────────────┘ ~kênh                                 ≈  ║
40 ║ ┌─ RUỘNG VƯỜN ─┐      ~   ┌═🎣🎣 sàn gỗ 🎣🎣═┐ quán trà     ≈  ║
   ║ │ lúa, thảo dược│     ~   │   ĐẦM HỒ LẶNG    │🎣            ≈  ║
56 ║ │              │      ~   │  🎣║ cầu gỗ      │🎣            ≈  ║
   ║ └──────────────┘      ~   └──🎣╨─────────────┘             ≈  ║
68 ║ ░░ cồn cát ░ thuyền ░ lạch ~ ☯☯ ░░ ☯☯ ░░ hải đăng ░░░░░░░░░ ≈  ║
72 ╚≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ BIỂN (nền) ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈╝
```

Vẫn đủ các khu, 12 bến câu, 14 điểm thiền, chợ, Bé Mơ, cửa nhà riêng, Cổng Rễ ở mép tây và bãi biển ở mép nam. Từ điểm xuất phát (Sân Hội) đi tới khu xa nhất mất **dưới 12 s**.

## 4. Những gì phải làm nếu duyệt

1. Đặt lại tọa độ toàn bộ map trong `server/data/life_world.json` và `world_population.json` (cổng, điểm hoạt động, nước, cầu, lãnh địa quái, NPC, vùng an toàn), chạy `scripts/build-life-world.cjs` và test server.
2. Đổi `WORLD_SPEED` và các kiểm tra quãng đường theo thời gian.
3. Cập nhật [05](05-map-layouts.md), [09](09-map-hien-trang.md), §4 của [10](10-kich-thuoc-map-online.md), Figma blockout.
4. Dựng lại Làng 96×72 trong client để duyệt bằng mắt trước, rồi mới làm các map khác.

## 5. Nguồn

- Pokémon Red/Blue: kích thước map trong bản dịch ngược mã [pret/pokered](https://mintlify.com/pret/pokered/game-systems/maps) (Pallet Town 10×9 khối = 20×18 ô; các thành phố lớn 20×18 khối) và [dữ liệu map Pokémon Red](https://huggingface.co/datasets/DJ-Research/GameBoy-pokemon_red/blob/main/map_data.json).
- Stardew Valley: sprite nhân vật 16×32 px ([Modding:Farmer sprite](https://wiki.stardewvalley.net/Modding:Farmer_sprite)); nông trại chuẩn 80×65 ô ([Stardew Farm Planner](https://cmd.hexagon.com/viewer/stardew-farm-planner.html)). Tốc độ đi bộ là ước tính từ mã game, chưa có nguồn công bố.
- Tốc độ đi bộ Pokémon (1 ô / 16 khung hình) là hiểu biết chung của cộng đồng, chưa kiểm chứng bằng nguồn chính thức.
