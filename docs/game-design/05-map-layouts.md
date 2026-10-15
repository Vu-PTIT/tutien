# Bố cục bản đồ chi tiết — Vùng 1 (Làng Hồ Lặng và phụ cận)

> **Tình trạng:** Đã cập nhật theo Chuẩn kích thước mới [11-ti-le-map.md](11-ti-le-map.md) ngày 15/10/2026.
> **Tỷ lệ chuẩn:** 1 ô = 32×32 px. Tốc độ đi bộ = 4 ô/s (128 px/s).
> **Sức chứa:** Thiết kế tối ưu cho 30 người chơi/kênh.
> **Tài liệu đối chiếu:** [03-world-and-maps.md](03-world-and-maps.md), [09-map-hien-trang.md](09-map-hien-trang.md), [10-kich-thuoc-map-online.md](10-kich-thuoc-map-online.md), [11-ti-le-map.md](11-ti-le-map.md), [12-ban-do-cac-khu.md](12-ban-do-cac-khu.md).

---

### Bảng tổng hợp kích thước & thời gian di chuyển (Vùng 1)

| Map | Mã map | Kích thước mới [11] | Thời gian chạy ngang (4 ô/s) | Đặc điểm & Kết nối |
| :--- | :--- | :--- | :--- | :--- |
| **Làng Hồ Lặng** | `m_k1_01` | **96×72** (giảm từ 160×120) | ~24 giây | Trung tâm Vùng 1; nối Bìa Rừng (bắc), Vườn Cây Mẹ (tây), Nhà riêng, Kinh thành |
| **Nhà riêng** | `m_nha` | **28×20** (giữ nguyên) | ~7 giây | Instance cá nhân của người chơi; 12 luống đất `nha_plot_01…12` |
| **Vườn Cây Mẹ** | `m_k1_07` | **80×60** (giảm từ 128×96) | ~20 giây | Cội nguồn Tinh Linh; 8 điểm Hấp Linh, 6 bến câu, thu hái nấm & hoa thảo dược |
| **Bìa Rừng** | `m_k1_02` | **112×80** (giảm từ 176×128) | ~28 giây | Quái Lv 1–3; nối Làng (nam), Mỏ (tây), Rừng Sâu (bắc); 8 điểm thiền |
| **Mỏ Bỏ Hoang** | `m_k1_03` | **80×64** (giảm từ 128×112) | ~20 giây | Quái Lv 3–5; 8 vỉa quặng sắt; giếng xuống Hầm Mỏ; đường núi lên Rừng Sâu |
| **Hầm Mỏ B1** | `m_k1_04` | **72×48** (giảm từ 112×80) | ~18 giây | Quái Lv 5–7 + Nhện Mẹ; 6 vỉa quặng quý; giếng lên Mỏ; hầm cổ sang Rừng Sâu |
| **Rừng Sâu** | `m_k1_05` | **128×96** (giảm từ 192×144) | ~32 giây | Quái Lv 7–9 + Khỉ Đầu Đàn; nối Bìa Rừng, Mỏ, Hầm Mỏ, Đài Thiên Mạch; 6 điểm thiền |
| **Đài Thiên Mạch** | `m_k1_06` | **64×48** (giảm từ 96×80) | ~16 giây | Quái Lv 9–10 + Boss Thủ Lĩnh Mạch Gãy; sàn boss đấu trường 30 người |

---

## 1. Làng Hồ Lặng (`m_k1_01`, 96×72)

```text
x→ 0        16        32        48        64        80      96
y0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ TƯỜNG CỌC ▓▓▓▓[CHỐT ▲(56,2)]▓▓▓▓▓▓▓ ≈≈ ──
   │ ┌── ĐỒI MIẾU ──┐                       │  ┌── PHỐ CHỢ ─────┐≈≈  │
 8 │ │ miếu ~~~~    │                       │  │ rèn  Tháp Học  │≈≈  │
   │ │ Bé Mơ ~~~~   │                       │  │ (68,8) (80,8)  │≈≈ s│
16 │ └──────────────┘                       │  │ tạp hóa  trọ   │≈≈ ô│
 ┌─┴─┐ ┌──────── XÓM NHÀ ────────┐ ┌── SÂN HỘI ──────┐ ┌─ CHỢ ─┐│≈≈ n│
 │◄──│ │ ⌂  ⌂  ⌂   giếng         │ │                 │ │       ││≈≈ g│
 │RỄ │ │ ⌂  ⌂  ⌂   sân phơi      │ │  ★ CHI HỘI      │ └───────┘│══cầu══ (94,28)
 │(2,24) Nora CỬA NHÀ           │ │  sân thi ☯(52,28)│          │≈≈ xe ngựa
32 │ │ (12,32)  (28,32)          │ └─────────────────┘          │≈≈  │
   │ └───────────────────────────┘ ~kênh   ═ cầu kênh(44,38) ───┘≈≈  │
40 │ ┌── RUỘNG VƯỜN ──┐      ~   ┌─ 🎣🎣 sàn gỗ 🎣🎣 ─┐ quán trà  ≈≈  │
   │ │ lúa, thảo dược │      ~   │   ĐẦM HỒ LẶNG      │ 🎣        ≈≈  │
56 │ │ (trang trí)    │      ~   │  🎣  cầu gỗ        │ 🎣        ≈≈  │
   │ └────────────────┘      ~   └──── 🎣 ────────────┘           ≈≈  │
66 │ ── cồn cát ── thuyền ── lạch ~ ~~~~ ── ── hải đăng ───────── ≈≈  │
72 └────────────────────────── BIỂN (nền) ────────────────────────────┘
```

### 1.1 Chi tiết các khu

| Khu | Phạm vi ô (x, y) | Có gì | Ghi chú |
| --- | --- | --- | --- |
| **Tường cọc** | toàn chiều ngang, y 0–3 | Cọc gỗ nhọn trên kè đá, đuốc mỗi 10 ô, biển gỗ cảnh báo | Chặn đi lại, trừ Chốt |
| **Chốt** | x 52–60, y 1–4 | Cổng gỗ bọc sắt, chòi canh, bảng thông báo; Đội Tuần Rừng (58,4) | Cổng `ln_k1_01_k1_02` (56,2) ↔ Bìa Rừng (56,78). Luôn mở |
| **Suối bắc** | (48,8) → (8,4), rộng 1 ô | Suối nhỏ từ chân núi, 1 cầu đá | Nước tự nhiên |
| **Đồi Miếu** | x 4–24, y 4–18 | Miếu cổ thờ Giao Ước, bậc đá, cây cổ thụ; **sân thiền 8 chỗ** x 10–18, y 8–12; Bé Mơ (18,14) dạy Hấp Linh | 8 điểm thiền Thổ `k1_01_med_01…08`; `k1_01.npc.be_mo` |
| **Xóm nhà** | x 4–36, y 20–36 | ~10 nhà gỗ mái ngói/rạ, ngõ đá, sân phơi cá, giếng; **nhà bà Nora** (12,32); **Cửa nhà** (28,32): cổng ngõ dẫn vào map nhà riêng | `ln_nha_k1_01` (28,32) ↔ Nhà riêng (14,19); Nora (12,32) |
| **Cổng Rễ** | x 0–4, y 20–30 | Vòm rễ khổng lồ trồi lên ở mép tây, màn sáng xanh lam; góc chợ Tinh Linh x 4–10, y 24–30 | Cổng `ln_k1_01_k1_07` (2,24) ↔ Vườn Cây Mẹ (40,56) |
| **Sân Hội Khai Phá** | x 42–62, y 20–34 | **Chi hội Khai Phá** tâm (52,24): nhà đá hai tầng, bảng hợp đồng, sân thi tập sơ lát đá | Điểm vào mặc định ★ (52,28) |
| **Chợ phiên** | x 64–74, y 22–32 | Sạp cá, rau, đồ khô dưới mái vải | `k1_01.shop.market` (68,26) |
| **Phố chợ** | x 64–90, y 4–20 | Lò rèn Doran (68,8), 2 chỗ thiền Hỏa ở sân lò rèn (68,12); Trạm Tháp Học (80,8) với la bàn lớn; quán trọ | Doran (68,8), Học giả Theo (80,8); thiền Hỏa `k1_01_med_13, 14` |
| **Sông đông** | dọc x 90–96, rộng 2 ô | Bờ kè đá, ranh giới phía đông; cầu x 86–94, y 26–28 nối ra trạm xe ngựa | Cầu gỗ bọc sắt |
| **Trạm xe ngựa** | x 92–96, y 26–30 | Trạm chờ xe ngựa đi Kinh thành | `ln_k1_01_k1_08` (94,28) ↔ Kinh thành |
| **Kênh** | (38,32) → (48,66), rộng 1,5 ô | Kênh dẫn nước từ suối ra đầm, có cầu gỗ tại (44,38) | Nước tưới tiêu |
| **Ruộng vườn** | x 6–34, y 40–58 | Lúa, giàn thảo dược, bù nhìn | Trang trí; luống của người chơi ở Nhà riêng |
| **Đầm Hồ Lặng** | x 46–78, y 42–64 | Đầm nước lợ sau cồn cát; **sàn gỗ bờ bắc** x 52–74, y 42–45; **cầu gỗ** chìa nam x 58–60, y 52–62; quán trà (80,44); Rin (54,40) | 12 bến câu cá, Rin (54,40) |
| **Bãi biển** | x 0–96, y 66–72 | Cồn cát, thuyền đánh cá, lưới phơi, **hải đăng đá** (82,68), bến thuyền cửa lạch (48–56, y 68–72) | Cảnh quan & điểm ngắm biển |

- **12 bến câu cá:** sàn gỗ bờ bắc `k1_01_fish_01…06` tại x 54/58/62/66/70/74, y 43; cầu gỗ `k1_01_fish_07…09` tại (59,54), (59,58), (59,62); bờ đông `k1_01_fish_10…12` tại (76,46), (76,50), (76,54).
- **Thiền Thủy:** `k1_01_med_09…12` trên cồn cát bờ nam đầm (48,68), (52,68), (68,68), (72,68), nhìn ra biển.

### 1.2 Trục giao thông chính

- **Trục Bắc–Nam:** Chốt (56,2) → Sân Hội (52,28) → sàn gỗ đầm (59,42) → bãi biển (59,68). Rộng 2–3 ô.
- **Trục Tây–Đông:** Cổng Rễ (2,24) → Xóm nhà (20,28) → Sân Hội → Chợ → cầu sông → Trạm xe ngựa (94,28). Rộng 2–3 ô.
- Từ Cửa nhà đi bộ tới: Sân Hội ≈ 24 ô (6 s), Cổng Rễ ≈ 26 ô (6,5 s), đầm ≈ 32 ô (8 s), sân miếu ≈ 30 ô (7,5 s), Chốt ≈ 42 ô (10,5 s).

### 1.3 Ánh sáng và nhịp sống

- Đèn lồng dọc 2 trục chính; Cổng Rễ tự phát sáng xanh lam; hải đăng quét chậm ra biển ban đêm.
- Đuốc trên tường cọc cháy suốt đêm.
- NPC: ~10 Người, ~3 Tinh Linh. Hiện có 6 NPC + Bé Mơ.
- Thú vô hại: gà, vịt ở đầm, mèo nhà, mòng biển, cua trên bãi. **Không có quái.**
- Khi đủ 30 người: sân miếu, sàn gỗ đầm và chợ là ba chỗ đông nhất (mỗi chỗ 6–10 người).

---

## 2. Nhà riêng (`m_nha`, 28×20)

Mỗi người chơi có **một bản riêng** của map này (không tính vào 30 người của kênh làng). Vào từ **Cửa nhà** ở Xóm nhà Làng Hồ Lặng.

```text
x→ 0        7         14        21       28
y0 ┌────────────────────────────────────┐
   │   hàng rào gỗ, cây ăn quả          │
4  │    ▦     ▦     ▦     ▦             │  luống 01–04
8  │    ▦     ▦     ▦     ▦             │  luống 05–08
12 │    ▦     ▦     ▦     ▦             │  luống 09–12
   │ ┌──NHÀ──┐                 thùng    │
15 │ │       │       ★(14,16)   tưới    │
   │ └───────┘                          │
20 └───────────────▼(14,19)─────────────┘
```

| Khu | Phạm vi ô | Có gì | Ghi chú |
| --- | --- | --- | --- |
| **Vườn** | x 3–25, y 3–13 | 12 luống 4×3, lối đi giữa luống | 12 luống riêng `nha_plot_01…12` tại x 5/11/17/23 × y 4/8/12, `plotId` 0–11 |
| **Nhà** | x 3–11, y 14–19 | Nhà tranh vách đất, hòm đồ, giường | Điểm xuất phát ★ (14,16) |
| **Cổng ra** | ▼ (14,19) | Cổng hàng rào | Cổng `ln_nha_k1_01` (14,19) → Làng Hồ Lặng (28,32) |

---

## 3. Vườn Cây Mẹ (`m_k1_07`, 80×60)

Nằm ở phía tây đầm nước Làng Hồ Lặng. Nơi cội rễ tâm linh thanh tịnh của Tinh Linh, không có quái vật.

```text
x→ 0        20          40          60        80
y0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ vách đồi rễ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   ▓         ┌── GỐC CÂY MẸ ──┐               ▓
10 ▓         │  ✦ CÂY MẸ      │               ▓
   ▓ ┌VƯỜN NẤM┐  (40,16)      │ ┌── BÃI HOA ─┐▓
24 ▓ │🍄🍄🍄  │  ☯☯(40,24)    │ │ ✿ ✿ ✿      │▓
   ▓ │🍄🍄🍄  │               │ │ ✿ ✿ ✿      │▓
36 ▓ └────────┘               │ └────────────┘▓
   ▓         └────────────────┘               ▓
   ▓  ≈≈ BẾN CÂU ≈≈            ≈≈ BẾN CÂU ≈≈  ▓
48 ▓  🎣 🎣 🎣                 🎣 🎣 🎣       ▓
   ▓  ~~~~~~~~~~~~~ [BẾN RỄ ▼(40,56)] ~~~~~~~~▓
60 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

| Khu | Phạm vi ô | Có gì | Ghi chú |
| --- | --- | --- | --- |
| **Gốc Cây Mẹ** | x 26–54, y 6–36 | Cây Mẹ vĩ đại (40,16), 8 chỗ Hấp Linh quanh gốc; Đài Linh Khí (40,24) | An toàn tâm (40,20) bán kính 14; 8 chỗ hấp linh `k1_07_hl_01…08` |
| **Vườn Nấm** | x 6–22, y 18–36 | 6 luống nấm linh chi ẩm râm mát | 6 luống thu hái nấm |
| **Bãi Hoa Tâm Linh** | x 58–74, y 18–36 | Thảm hoa nở theo chu kỳ linh khí, bầy đom đóm | Thu hái thảo dược |
| **Bờ nước & Bến câu** | x 10–70, y 44–58 | 6 bến câu tĩnh lặng, nước hồ biếc rễ ngập | 6 bến câu `k1_07_fish_01…06` |
| **Bến Rễ (Cổng)** | ▼ (40,56) | Lối thuyền rễ cây huyền ảo sang làng | Cổng `ln_k1_07_k1_01` (40,56) → Cổng Rễ Làng (2,24) |

---

## 4. Các map chiến đấu (vùng 1)

### 4.1 Bìa Rừng (`m_k1_02`, 112×80)

Nằm ngay **phía bắc** Làng Hồ Lặng, bên kia tường cọc. Sông từ núi Rừng Sâu chảy qua map này rồi xuống làng và ra biển.

```text
x→ 0        28          56          84     ≈≈ 98    112
y0 ▓▓▓▓▓▓▓▓▓ hàng cây ▓▓[▲(56,2) lối mòn]▓▓▓▓▓≈≈▓▓▓▓▓▓▓  ← sông từ Rừng Sâu (x 96)
   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓≈≈▓▓▓▓▓▓▓
12 │ ┌XE BÒ───┐     ┌──────── ĐỒNG CỎ CAO ─────≈≈──┐║CẦU
   │ │BỎ DỞ   │     │ ⓛ(40,18)        ⓛ(80,16) ≈≈  │║ĐÁ
20 ◄(2,20)    │     │                          ≈≈  │║GÃY
   │ │        │     │        ⓛ(62,28) Ⓛ(72,38)═cầu═ ║(cảnh
36 │ │ⓝ(14,32)│     │                          ≈≈  │║ nền)
   │ │        │     └──────────────────────────≈≈──┘║
44 │ │        │   ┌──────── RUỘNG HOANG ───────≈≈───┐║
   │ │ⓝ(20,50)│   │ ⓖ(42,54)   tháp canh ☯☯   ≈≈ ⓖ(90,48)
56 │ │        │   │        ⓖ(66,58)   (78,50)  ≈≈   │║
   │ └────────┘   └────────────────────────────≈≈───┘║
   │ ~~ suối ~~         ┌── CHÒI CANH + LỀU ───┐≈≈  ║
66 │     ~~~~~          │ ★(56,70)   tuần rừng │≈≈  ║
76 ▒▒▒▒▒▒▒▒▒▒ TƯỜNG CỌC ▒▒▒▒[CHỐT ▼(56,78)]▒▒▒▒≈≈▒▒▒▒  ← sông qua tường (x 90)
80 └────────────────────────────────────────────────┘
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Chòi canh + lều thợ săn** | x 42–72, y 66–80 | Chòi canh gỗ, lều, đống lửa, bảng hợp đồng; Thợ săn (52,70), Đội Tuần Rừng (60,70). Điểm xuất phát ★ (56,70) | **an toàn** tâm (56,72) bán kính 6; 4 chỗ thiền Hỏa bên đống lửa `k1_02_med_05…08` |
| **Ruộng hoang** | x 36–100, y 44–66 | Ruộng bỏ, bù nhìn đổ; tháp canh cũ x 74–82, y 46–54 với 4 chỗ thiền Phong `k1_02_med_01…04` | Gà Rừng ×4 tại (42,54), (66,58), (90,48), (70,46) |
| **Đồng cỏ cao** | x 36–100, y 10–44 | Cỏ cao che nửa người, cây đơn lẻ, cột mốc Giao Ước đầu tiên | Lợn Gai ×2 tại (40,18), (80,16), (62,28), (86,30); **Lợn Gai Đầu Đàn** (72,38) |
| **Xe bò bỏ dở** | x 4–32, y 12–64 | Đường xe cũ, xe bò lật, kho gỗ đổ, dẫn sang Mỏ | Nhện Tơ Điện ×3 tại (14,32), (20,50), (10,60) |
| **Sông** | từ (96,0) xuống (90,80), rộng 2 ô | Bờ đá, khe cọc chỗ sông qua tường; cầu gỗ x 92–98, y 32–36 | Nước + cầu |
| **Cầu đá cổ gãy** | x 102–112, toàn dọc | Cầu đá Thời Khai Phá sập làm vách phía đông; **cảnh nền** | Không |
| **Tường cọc** | y 76–80, toàn chiều ngang | Mặt sau tường cọc làng; Chốt ở ▼(56,78) | Nối Làng Hồ Lặng (56,2) |
| **Hàng cây rừng** | y 0–10 | Bức tường cây; lối mòn thợ săn ở giữa ▲(56,2) | Cổng `ln_k1_02_k1_05` (56,2) → Rừng Sâu (64,94) |

Cổng: về làng ở nam (56,78); lên Rừng Sâu ở bắc (56,2); sang Mỏ ở tây (2,20). Tổng 37 quái thường.

### 4.2 Mỏ Bỏ Hoang (`m_k1_03`, 80×64)

Vách núi đá đỏ sừng sững, từng là nơi khai thác linh khoáng sầm uất nay đã hoang phế, quái vật chiếm cứ.

```text
x→ 0        20          40          60        80
y0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ vách đá đỏ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   ▓                  ┌── BÃI TỜI ──────┐ đường núi
12 ▓                  │  ⓝ(46,14)       │ ──► (78,14) Rừng Sâu
   ▓ ┌─── HỐ TÂY ───┐ │                 │     ▓
24 ▓ │⛏ ⛏ ⛏ ⛏      │ │       ⓝ(58,26)  │     ▓
   ▓ │ ◎GIẾNG(30,28)│ └─────────────────┘     ▓
36 ▓ │⛏ ⛏ ⛏ ⛏      │                         ▓
   ▓ │  ☯☯ mỏm đá   │ ┌──────── BẬC ĐÁ ─────┐ ▓
48 ▓ └──────────────┘ │ⓡ(40,50)     ⓡ(60,48)│ ┌LÁN THỢ ─┐
   ▓                  │                     │ │★(70,54) │◄(78,56) Bìa Rừng
64 ▓▓─────────────────┴─────────────────────┴─┴─────────┘
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Lán thợ** | x 64–78, y 48–62 | Lán chú Bram (70,52), đèn linh thạch, ao nhỏ (72,58). Điểm xuất phát ★ (70,54) | **an toàn** tâm (70,54) bán kính 5; cổng `ln_k1_02_k1_03` ◄(78,56) → Bìa Rừng (2,20) |
| **Hố Tây** | x 8–36, y 20–46 | Bậc khai thác, **8 vỉa sắt**, giếng tời, mỏm đá thiền Kim | 8 vỉa `k1_03_ore_01…08`; giếng `ln_k1_03_k1_04` (30,28); thiền Kim `k1_03_med_01…04` tại (26–30, y 38–42) |
| **Bãi tời** | x 40–66, y 8–34 | Tời gỗ gãy, ray goòng đứt, xe goòng lật | Nhện Tơ Điện ×3 tại (46,14), (58,26), (48,32) |
| **Bậc đá** | x 8–64, y 44–62 | Bậc đá đỏ rộng, đá vụn | Rết Đá ×3 tại (40,50), (60,48), (28,56), (50,58) |
| **Đường núi** | x 66–80, y 8–20 | Đường dốc men vách đá sang đông, lên Rừng Sâu | Cổng `ln_k1_03_k1_05` (78,14) → Rừng Sâu (2,70) |

Cổng: về Bìa Rừng ở đông nam (78,56); lên Rừng Sâu ở đông bắc (78,14); xuống Hầm qua giếng (30,28). Tổng 21 quái thường.

### 4.3 Hầm Mỏ (`m_k1_04`, 72×48)

Hầm sâu khai khoáng dưới lòng núi đá đỏ. Không gian khép kín, ẩm ướt và giăng đầy tơ nhện linh mạch.

```text
x→ 0        18          36          54        72
y0 ████████████[CỬA B2 XÍCH(36,4)]██████████████
   █ Ⓝ(12,14)       ⓓ(36,18)     ┌ VỈA ĐÔNG ┐ ═►(70,12) Rừng Sâu
12 █ ┌─ HẦM TÂY ─┐  ┌─ HANG GIỮA ─┐│ ⛏  ⛏  ⛏ │ █
   █ │           │  │             ││ ⛏  ⛏  ⛏ │ █
24 █ │  ⓝ(20,24) │  │   ⓓ(44,28)  │└──────────┘ █
   █ │           │  └─────────────┘             █
36 █ │  ⓝ(12,32) │  ══ ray goòng ══   ⓓ(56,38)  █
   █ └───────────┘       ┌SÂN GIẾNG┐            █
   █                     │★(36,44) │            █
48 ██████████████████████▼(36,46)███████████████
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Sân giếng** | x 28–44, y 38–48 | Giỏ tời treo, đèn linh thạch, hòm đồ thợ mỏ. Điểm xuất phát ★ (36,44) | **an toàn** tâm (36,44) bán kính 5; cổng giếng `ln_k1_03_k1_04` ▼(36,46) lên Mỏ Bỏ Hoang (30,28) |
| **Đường ray goòng** | y 32–38, x 8–64 | Ray goòng gỗ nối các nhánh hầm, xe lật, vũng nước ngầm | Dơi Hang ×4 tại (56,38) |
| **Vỉa Đông** | x 50–66, y 10–28 | **6 vỉa quặng sắt quý**, vân linh thạch tím phát sáng | 6 vỉa `k1_04_ore_01…06`; quái không vào trong 6 ô |
| **Hang Giữa** | x 28–46, y 10–30 | Hang trần cao, nhũ đá nhỏ giọt, âm vang gió núi | Dơi Hang ×4 tại (36,18), (44,28) |
| **Hầm Tây** | x 4–24, y 8–38 | Tơ nhện giăng kín vách, kén trứng phát quang | Nhện Tơ Điện ×3 tại (20,24), (12,32); **Nhện Mẹ** (12,14) |
| **Cửa B2** | x 30–42, y 2–6 | Cửa sắt cổ phong ấn xích huyền thiết, tiếng rung ngầm | Chưa mở (cảnh truyện / mở rộng) |
| **Hầm thoát cổ** | x 64–72, y 8–16 | Lối hầm dốc ngược xuyên qua vách đá sang Rừng Sâu | Cổng `ln_k1_04_k1_05` ═►(70,12) → Rừng Sâu (2,78) |

Tổng 18 quái thường + 1 Nhện Mẹ.

### 4.4 Rừng Sâu (`m_k1_05`, 128×96)

Khu rừng nguyên sinh rậm rạp che khuất ánh mặt trời, nơi linh khí nồng đậm nhưng đầy hiểm nguy từ dã thú và tinh linh biến chất.

```text
x→ 0        32          64          96        128
y0 ▓▓▓▓▓▓▓▓ SƯỜN NÚI ▓▓▓[CỬA ĐÁ▲(64,2)]▓▓▓▓▓▓≈▓▓▓  ← suối từ thác (x 120)
   ▓ ┌── TÁN CAO ──┐   thác  bậc leo    Ⓚ(112,16) ▓
16 ▓ │ⓒ(16,12) ⓒ(36,16)                 ┌VÁCH ĐÁ─┐≈ ▓
   ▓ │             │                    │ⓚ(94,24) │≈▓
28 ▓ │    ✦☯☯(48,26) gốc TL bắc         │ ⓚ(108,34)≈ ▓
   ▓ │ⓒ(20,36)     │                    │  ◎hồ(110,44)
42 ▓ └─────────────┘  ┌─ THUNG SUỐI ──┐ │ⓚ(92,52) │≈▓
   ▓   ··lối ẩn··     │ lán bố Rin    │ └─ⓚ(116,60)≈▓
56 ▓    ┌─ ĐẦM SƯƠNG┐ │ (80,56)       │           ≈ ▓
   ▓    │ⓢ(14,60)   │ │  ⓦ(74,60)     │           ≈ ▓
70 ◄(2,70) Mỏ       │ └───────────────┘  ⓦ(92,72)   ▓
   │    │ⓢ(30,70)   │ ✦☯☯(60,74) gốc TL nam       ▓
78 ◄(2,78) Hầm      │   ⓦ(48,86)      ⓦ(80,84)      ▓
   ▓    │ⓢ(14,84)   │     RÌA RỪNG ẨM  ★(64,90)     ▓
88 ▓    │  ⓢ(34,86) │                               ▓
96 ▓▓▓▓▓└───────────┘▓▓▓▓▼(64,94) về Bìa Rừng▓▓▓▓▓▓▓▓
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Lối vào Rìa Rừng** | x 48–80, y 82–96 | Điểm xuất phát ★ (64,90). Cổng về Bìa Rừng ▼(64,94) | **an toàn** tâm (64,90) bán kính 6; nối Bìa Rừng (56,2) |
| **Rìa rừng ẩm** | x 40–100, y 70–94 | Thảm thực vật ẩm ướt, nấm phát quang, dương xỉ khổng lồ | Sói Rêu ×3 tại (48,86), (80,84), (92,72) |
| **Gốc Cây Tinh Linh Nam** | x 52–68, y 68–80 | Đại thụ Tinh Linh, lồng đèn lá; điểm hồi sinh khi kiệt sức | **an toàn** tâm (60,74) bán kính 5; 3 chỗ thiền Mộc `k1_05_med_01…03` |
| **Đầm Sương** | x 6–46, y 52–92 | Đầm lầy mịt mù sương trắng, rễ cây đan xen; cổng sang Mỏ ◄(2,70) và Hầm ◄(2,78) | Rắn Sương ×3 tại (14,60), (30,70), (14,84), (34,86) |
| **Thung Suối & Lán thợ** | x 58–92, y 42–66 | Dòng suối trong, **lán trại của bố Rin** (80,56) | Sói Rêu ×3 tại (74,60) |
| **Gốc Cây Tinh Linh Bắc** | x 40–56, y 20–32 | Đại thụ cổ ngàn năm tỏa ánh huỳnh quang dịu nhẹ | **an toàn** tâm (48,26) bán kính 5; 3 chỗ thiền Mộc `k1_05_med_04…06` |
| **Tán Cao** | x 8–52, y 4–40 | Rừng rậm rạp vòm lá che kín bầu trời | Cú Đêm Linh ×2 tại (16,12), (36,16), (20,36) *(chỉ xuất hiện ban đêm)* |
| **Vách Đá & Suối ngọc** | x 88–122, y 14–66 | Vách đá dựng đứng, thác nước đổ xuống hồ xanh (110,44) | Khỉ Vách Đá ×3 tại (94,24), (108,34), (92,52), (116,60); **Khỉ Đầu Đàn** (112,16) |
| **Sườn núi Tháp Học** | x 48–80, y 0–14 | Bậc đá cổ rêu phong, cửa đá ấn ký dẫn xuống Đài | Cổng `ln_k1_05_k1_06` ▲(64,2) → Đài Thiên Mạch (32,46) |
| **Lối mòn ẩn (Hóa Thú)** | (60,74)→(80,56) & (20,50)→(48,26) | Đường luồn qua hốc rễ gai góc | Dành riêng cho trạng thái Hóa Thú |

Cổng: về Bìa Rừng ở nam (64,94); sang Mỏ Bỏ Hoang ở tây (2,70); sang Hầm Mỏ ở tây nam (2,78); lên Đài Thiên Mạch ở bắc (64,2). Tổng 40 quái thường (34 ban ngày, 28 ban đêm) + 1 Khỉ Đầu Đàn.

### 4.5 Đài Thiên Mạch (`m_k1_06`, 64×48)

Di tích cổ ngầm dưới chân thác Tháp Học. Nơi đặt Lõi Trận Thiên Mạch đang rạn nứt phát tỏa dị năng tím.

```text
x→ 0        16          32          48        64
y0 █████████████████████████████████████████████
   █           ┌──── PHÒNG LÕI ────┐           █
   █           │  ◉ LÕI, BOSS (32,8)           █
10 █ ┌PHÒNG TRẬN┐                  │┌── KHO ──┐█
  ▒▒╡ⓜ(10,16)   │└─────────┬─────────┘│ⓜ(54,16) │█
20 █ └──────────┘══ hành lang trên ══ └──────────┘█
   █              ⓜ(32,22)                     █
28 █ ══════ hành lang dưới ═══════════════════█
   █  ⓜ(10,30)       ⓜ(32,32)        ⓜ(54,30)  █
36 █ ┌THƯ PHÒNG┐ ┌── SẢNH VÀO ──┐  ┌LỒNG GIAM┐ █
   █ │ hồ sơ   │ │  ★(32,42)    │  │ trống   │ █
48 █████████████████▼(32,46)████████████████████
```

`▒` là vết vách đá sụp nứt ở tường tây Phòng Trận (x 0–3, y 14–18).

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Sảnh vào** | x 22–42, y 36–48 | Cửa đá phong ấn Tháp Học rạn nứt, đèn linh thạch mờ, điểm xuất phát ★ (32,42) | **an toàn** tâm (32,42) bán kính 4; cổng ra `ln_k1_05_k1_06` ▼(32,46) về Rừng Sâu (64,2) |
| **Hành lang dưới** | y 28–34, x 4–60 | Hành lang lát đá xám phủ rêu, đèn linh thạch chập chờn theo chu kỳ 47 | Chuột Tím ×4 tại (10,30), (32,32), (54,30) |
| **Hành lang trên** | y 20–26, x 4–60 | Đường dẫn thẳng vào buồng phong ấn trung tâm | Chuột Tím ×4 tại (32,22) |
| **Phòng Trận** | x 4–18, y 10–20 | Cột đá khắc trận văn cổ đại, vách tây nứt sập ra hang đá | Chuột Tím ×4 tại (10,16) |
| **Kho đồ Tháp Học** | x 46–60, y 10–20 | Hòm gỗ mục, cuộn giấy phong hóa, tàn tích thí nghiệm | Chuột Tím ×4 tại (54,16) |
| **Thư phòng di tích** | x 4–18, y 36–46 | Bàn đá, hồ sơ nghiên cứu thiên thạch tím rơi từ bầu trời | Không |
| **Lồng giam cổ** | x 46–60, y 36–46 | Dãy lồng sắt huyền thiết hoen rỉ, vết cào xé | Không (cảnh truyện) |
| **Phòng Lõi (Boss Arena)** | x 20–44, y 2–18 | Sàn đấu tròn đường kính ~24 ô chứa đủ 30 người, 4 cột đá che chắn, Lõi Trận Thiên Mạch tỏa sáng tím kỳ bí | **Thủ Lĩnh Mạch Gãy** (32,8); hồi sinh sau chu kỳ 47 phút |

Tổng 24 Chuột Tím + Boss Thủ Lĩnh Mạch Gãy.

---

## 5. Quy tắc chung khi đặt quái

Các quy tắc có dấu ✔ được `scripts/build-life-world.cjs` kiểm tra; script từ chối build nếu sai.

- ✔ **Điểm an toàn**: quái không đứng trong bán kính an toàn. Thua thì tỉnh lại ở điểm an toàn gần nhất.
- ✔ **Đầu cổng và điểm xuất phát:** không đặt quái trong 12 ô.
- ✔ **Điểm hoạt động** (vỉa, bến câu, chỗ thiền): quái không vào trong 6 ô; avatar tự hoạt động không bị tấn công.
- **Mật độ:** tối đa 6 quái trong một màn ở zoom mặc định (30×17 ô). Số quái tính cho map đủ 30 người, khoảng 1–1,5 quái/người ([10](10-kich-thuoc-map-online.md) §5.2).
- **Lãnh địa:** mỗi nhóm quái có tâm và bán kính; đuổi ra quá bán kính thì quay về (xem [06](06-monsters.md) §2).
