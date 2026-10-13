# 05 — Bố cục chi tiết từng map

Tọa độ tính theo **ô 32 px**, gốc (0,0) ở góc **trên-trái**, x sang phải, y xuống dưới. Hướng bắc là phía trên.

**Kích thước tính cho 30 người chơi một kênh** (13/10/2026, xem [10](10-kich-thuoc-map-online.md)). Màn hình ở zoom mặc định thấy ≈ 30×17 ô; đi bộ 2,25 ô/giây.

**[BE]** = đã có trong `server/data/life_world.json` hoặc `world_population.json`, đúng tọa độ ghi ở đây: kích thước map, điểm xuất phát, cổng, điểm hoạt động, nước, cầu, vùng an toàn, lãnh địa quái, NPC. Phần còn lại (nhà, khu, đường) là thiết kế. Bên trong các map **chưa có collision** (chỉ có tường viền); khi dựng client cần thêm footprint nhà, cây, vách vào cùng file đó.

Xem quái ở [06](06-monsters.md). Khu và tên gọi theo [03](03-world-and-maps.md). Hiện trạng dữ liệu: [09](09-map-hien-trang.md).

---

## 1. Khu Người — Làng Hồ Lặng (`m_lang_que`, 160×120)

### 1.1 Sơ đồ

```text
x→ 0         20        40        60        80        100       120       140   160
y0 ╔═══════════════════ TƯỜNG RÀO ════════════[CHỐT ▲(92,5)]════════════╗≈≈≈╗
   ║  ~~~~~~~~~ suối bắc ~~~~~~~~~~~~~~                │ đường Chốt      ║≈  ║
10 ║  ┌── ĐỒI MIẾU ──┐                                 │                 ║≈ s║
   ║  │ miếu   Bé Mơ │                                 │   ┌─ THỊ TRẤN ─────┐≈ ô║
20 ║  │ ☯☯☯☯ sân     │                                 │   │                │≈ n║
   ║  │ ☯☯☯☯ thiền   │                                 │   │ rèn   Trạm Viện│≈ g║
30 ║  └──────────────┘                                 │   │ (110,33)(123,33)≈  ║
   ║ ┌───────── XÓM NHÀ ─────────┐                     │   │ tiện lợi  cà phê≈  ║
40 ║ │ ngõ, sân phơi, giếng      │                     │   │                │≈  ║
   ║ │                           │   ┌── QUẢNG TRƯỜNG CỔNG ──┐ CHỢ          │≈  ║
50 ║ │                           │   │                       │ PHIÊN        │≈  ║
   ║ │                           │   │    ◎ CỔNG ẨN GIỚI     │ ▣(98,64)     │≈  ║
60 ║ │                           │   │       (80,57)         │              │≈  ║
   ║ │  nhà Nora (37,70)         │   │ chợ TL                │      ═cầu═══╪═►(156,66)
70 ║ │                           │   │      ★ (81,69)        │              │≈ trạm
   ║ │        ⌂ CỬA NHÀ (47,78)  │   └───────────────────────┘              │≈ buýt
80 ║ └───────────────────────────┘ ~~kênh   ═cầu kênh(69,84)  └────────────┘≈  ║
   ║                                  ~~       Rin(103,88)                  ≈   ║
90 ║      ┌──── RUỘNG VƯỜN ────┐       ~~  ┌═🎣🎣🎣🎣🎣🎣 sàn gỗ═┐ quán nước  ≈   ║
   ║      │ lúa, nhà kính      │        ~~ │                    │🎣          ≈  ║
100║      │ (trang trí)        │        ~~ │     HỒ LẶNG        │🎣          ≈  ║
   ║      │                    │         ~~│        🎣║         │🎣          ≈  ║
110║      └────────────────────┘          ~│        🎣║ cầu gỗ  │            ≈  ║
   ║                                       └───────🎣╨─────────┘            ≈  ║
120╚═══════════════════════════════════════~~═══☯☯════☯☯═══════════════════╩≈≈≈╝
```

### 1.2 Các khu

| Khu | Phạm vi ô (x, y) | Có gì | Ghi chú |
| --- | --- | --- | --- |
| **Tường rào** | toàn chiều ngang, y 0–4 | Tường bê tông + lưới, đèn pha mỗi 12 ô, biển cảnh báo | Chặn đi lại, trừ Chốt |
| **Chốt Tường Rào** | x 88–96, y 2–9 | Cổng sắt, trạm gác, bảng thông báo; Đội Tuần Tra (95,10) | **[BE]** `ln_lang_vanh` (92,5) → Bìa Rừng |
| **Suối bắc** | (79,18) → (11,10), rộng 1,2 ô | Suối nhỏ, 1 cầu đá | **[BE]** nước |
| **Đồi Miếu** | x 11–38, y 10–31 | Miếu cổ, bậc đá, cây cổ thụ; **sân thiền 8 chỗ** x 20–29, y 21–24; Bé Mơ (33,24) dạy Hấp Linh | **[BE]** 8 điểm thiền Thổ `lq_med_mieu…_08`; `lq.npc.be_mo` |
| **Xóm nhà** | x 8–62, y 34–84 | ~14 nhà, ngõ, sân phơi, giếng; **nhà bà Nora** x 34–40, y 65–70; **Cửa nhà** (47,78): một dãy cổng ngõ dẫn vào nhà riêng | **[BE]** `ln_lang_nha` (47,78) → Nhà riêng; Nora (37,70) |
| **Quảng trường Cổng** | x 68–94, y 49–72 | **Cổng Ẩn Giới** tâm (80,57), khung thép, chốt gác (Đội Tuần Tra (75,60)), lồng đèn lá, góc chợ Tinh Linh x 69–76, y 62–70, ghế đá | Điểm vào mặc định ★ **[BE]** (81,69) |
| **Chợ phiên** | x 94–106, y 57–72 | Sạp rau, cá, đồ khô | **[BE]** `lq.shop.market` (98,64) |
| **Thị trấn** | x 94–141, y 22–82 | Xưởng rèn Doran x 106–114, y 29–36; Trạm Viện x 119–128, y 29–38; cửa hàng tiện lợi, quán cà phê, nhà 2–3 tầng | **[BE]** Doran (110,33), Tiến sĩ Theo (123,33) |
| **Sông đông** | dọc x ≈ 142–153, rộng 2,5 ô | Bờ kè; ranh giới phía đông. Chảy vào làng qua cống lưới dưới tường rào ở (148,0), từ Bìa Rừng | **[BE]** nước; cầu x 145–152, y 64–67 |
| **Trạm buýt** | x 152–158, y 62–69 | Trạm chờ, biển "Tuyến về thành phố — tạm ngưng" | **[BE]** `ln_lang_thang` (156,66) **khóa** ở chương 1 |
| **Kênh** | (66,76) → (88,120), rộng 1,8 ô | Kênh tưới | **[BE]** nước; cầu x 69–75, y 84–87 |
| **Ruộng vườn** | x 36–84, y 86–116 | Lúa, bù nhìn, nhà kính nhỏ, NPC làm đồng | Trang trí; luống của người chơi ở Nhà riêng |
| **Hồ Lặng** | x 87–128, y 92–114 | Mặt hồ; **sàn gỗ bờ bắc** x 96–120, y 90–95; **cầu gỗ** chìa từ bờ nam x 105–108, y 105–115; quán nước x 131–137, y 92–98; Rin (103,88) | **[BE]** 12 bến, 4 điểm thiền Thủy (xem dưới) |

**12 bến câu [BE]:** sàn gỗ bờ bắc `new_fish_01…06` tại x 98/102/106/110/114/118, y 93 (quay nam); cầu gỗ `new_fish_07…09` tại (107,106), (107,109.5), (107,113); bờ đông `new_fish_10…12` tại (129.5,100), (129.5,104), (128.5,108).
**Thiền Thủy [BE]:** `lq_med_ho…_04` bờ nam (96,116), (100,116.5), (114,116.5), (118,115.5).

### 1.3 Đường chính

- **Trục Bắc–Nam:** Chốt (92,5) → Quảng trường (80,57) → sàn gỗ hồ (100,92). Rộng 3 ô, nhựa.
- **Trục Tây–Đông:** Xóm nhà (35,60) → Quảng trường → Chợ → Thị trấn → cầu sông → Trạm buýt (156,66). Rộng 3 ô.
- **Ngõ:** rộng 1–2 ô, lát gạch, nối các nhà trong xóm và lên Đồi Miếu.
- Từ Cửa nhà đi bộ tới: Cổng ≈ 40 ô (18 s), hồ ≈ 55 ô (25 s), sân miếu ≈ 60 ô (27 s), Chốt ≈ 85 ô (38 s).

### 1.4 Ánh sáng và nhịp sống

- Đèn đường dọc 2 trục chính; Cổng tự phát sáng, chiếu ngọc lam lên mái nhà trong bán kính ~8 ô.
- Đèn pha trên tường rào quét chậm ban đêm.
- NPC: ~10 Người (nông dân, chủ quán, Đội Tuần Tra, trẻ con), ~3 Tinh Linh (người bán ở góc chợ, một Tinh Linh ngủ trên mái miếu). Hiện có 6 NPC + Bé Mơ **[BE]**.
- Thú vô hại: gà, vịt ở hồ, mèo nhà, chim sẻ. **Không có quái.**
- Khi đủ 30 người: sân miếu, sàn gỗ hồ và chợ là ba chỗ đông nhất (mỗi chỗ 6–10 người).

---

## 2. Nhà riêng (`m_nha`, 32×24)

Mỗi người chơi có **một bản riêng** của map này (không tính vào 30 người của kênh làng). Vào từ **Cửa nhà** ở Xóm nhà.

```text
x→ 0        8         16        24       32
y0 ┌────────────────────────────────────┐
   │   hàng rào gỗ, cây ăn quả          │
6  │    ▦     ▦     ▦     ▦             │  luống 01–04
10 │    ▦     ▦     ▦     ▦             │  luống 05–08
14 │    ▦     ▦     ▦     ▦             │  luống 09–12
   │ ┌──NHÀ──┐                 thùng    │
18 │ │       │       ★(16,19)   tưới    │
   │ └───────┘                          │
24 └───────────────▼(16,22)─────────────┘
```

| Khu | Phạm vi ô | Có gì | Ghi chú |
| --- | --- | --- | --- |
| **Vườn** | x 4–28, y 4–16 | 12 luống 4×3, lối đi giữa luống | **[BE]** `new_plot_01…12` tại x 7/13/19/25 × y 6/10/14, `plotId` 0–11 |
| **Nhà** | x 2–12, y 16–22 | Nhà nhỏ (sau này: giường, rương đồ, trang trí) | Trang trí |
| **Sân** | x 14–30, y 16–22 | Thùng tưới, giếng | Điểm xuất phát ★ **[BE]** (16,19) |
| **Cổng ra** | (16,22) | Cổng gỗ | **[BE]** `ln_lang_nha` → làng (47,81) |

Luống là của riêng từng người, nên server khóa luống theo từng người chơi, không dùng chung.

---

## 3. Khu Tinh Linh — Ẩn Giới (`m_an_gioi`, 128×96, chưa có trong dữ liệu)

### 3.1 Sơ đồ

```text
x→ 0         32          64          96        128
y0 ░░░░░░░░░░░░ RÌA PHAI (sương trắng) ░░░░░░░░░░░░
   ░ ┌VÒNG ĐÁ┐                                  ░
16 ░ │Hội Rễ │      ✿✿✿✿✿✿✿✿✿                   ░
   ░ └───────┘    ✿  CÂY MẸ  ✿   ┌SUỐI HẤP LINH┐ ░
32 ░              ✿  (64,34) ✿   │ ≈≈≈≈≈≈≈≈≈≈≈ │ ░
   ░ ┌VƯỜN NẤM┐   ✿ nhà hốc   ✿  │ 8 điểm      │ ░
48 ░ │ 6 luống│    ✿✿✿✿✿✿✿✿✿✿    │ hấp linh    │ ░
   ░ │ nấm    │   nhà trên cành  │ 6 bến câu   │ ░
64 ░ └────────┘   đường rễ cây   └─────────────┘ ░
   ░      đồ "rơi qua cổng"                      ░
80 ░           ~~~ HỒ GƯƠNG ◎ BẾN CỔNG (64,86) ~~~ ░
96 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### 3.2 Các khu

| Khu | Phạm vi ô | Có gì |
| --- | --- | --- |
| **Rìa Phai** | viền ngoài 0–5 ô | Cảnh vật mờ dần thành sương; đi vào thì bị đẩy nhẹ lại. Lá héo theo nhịp 47 giây |
| **Bến Cổng** | x 52–76, y 78–94 | Phía Ẩn Giới của Cổng (64,86) đứng trên **Hồ Gương** phẳng; nhìn qua thấy mờ mái nhà làng. Điểm đến ★ cách cổng 4 ô về phía bắc |
| **Vườn Cây Mẹ** | x 40–88, y 14–62 | Cây Mẹ tâm (64,34), rễ cao như tường; nhà hốc cây, nhà trên cành, cầu treo dây leo; hốc rễ phía nam là **cửa nhà riêng** của người chơi Tinh Linh |
| **Suối Hấp Linh** | x 90–120, y 26–64 | Suối có hạt sáng trôi lên, **8 điểm Hấp Linh**, **6 bến câu cá linh** |
| **Vườn nấm** | x 8–36, y 38–64 | **6 luống nấm riêng từng người** (khóa theo người như vườn nhà) |
| **Vòng Đá** | x 8–28, y 8–26 | 9 tảng đá xếp vòng, nơi Hội Rễ họp |
| **Bãi đồ rơi** | x 30–56, y 66–78 | Xe đạp, biển báo, máy bán hàng rơi qua cổng |

- Không có tường, không có góc vuông; đường đi là rễ cây và đá lát tròn.
- NPC: ~8 Tinh Linh (Lão Hồ ở gốc Cây Mẹ). Sinh vật vô hại: linh trùng, cá linh, chim lông trong. **Không có quái.**
- Backend cần thêm: map, điểm Hấp Linh, luống nấm, bến câu, cặp cổng `ln_lang_angioi` (làng (80,57) ↔ Ẩn Giới (64,86)).

---

## 4. Khu Rừng Quái

### 4.1 Bìa Rừng (`m_vanh_dai_tay`, 176×128)

Nằm ngay **phía bắc** Làng Hồ Lặng, bên kia tường rào. Sông từ núi Rừng Sâu chảy qua map này rồi chui qua tường xuống làng.

```text
x→ 0         40          80          120     ≈≈ 150  160  176
y0 ▓▓▓▓▓▓▓▓▓ hàng cây rừng ▓▓▓▓[▲(95,5) lối mòn]▓▓▓▓▓≈≈▓▓▓▓▓▓▓▓  ← sông từ Rừng Sâu (x 150)
   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓≈≈▓▓▓▓▓▓▓▓
20 │ ┌XE TẢI──┐     ┌──────── ĐỒNG CỎ CAO ──────────≈≈─┐║ĐƯỜNG
   │ │BỎ DỞ   │     │ ⓛ(62,30)        ⓛ(124,24)    ≈≈ ⓛ(158,30) CAO
◄(5,31)        │     │                             ≈≈   ║TỐC
   │ │        │     │        ⓛ(98,46)    ⓛ(140,52)═cầu═ ║GÃY
50 │ │ⓝ(22,52)│     │                            ≈≈    ║(cảnh nền)
   │ │        │     │ ⓛ(72,60)    Ⓛ(112,66)🔒   ≈≈     ║
   │ │        │     └────────────────────────────≈≈────┘║
70 │ │        │   ┌──────── RUỘNG HOANG ─────────≈≈──────┐║
   │ │ⓝ(30,80)│   │                tháp ☯☯     ≈≈ ⓖ(150,80)
   │ │        │   │ ⓖ(66,92)          (122,86) ≈≈       │║
90 │ │ⓝ(16,98)│   │            ⓖ(104,98)  ⓖ(140,104)    │║
   │ └────────┘   └─────────────────────────≈≈──────────┘║
   │ ~~ suối ~~         ┌── TRẠM GÁC + LỀU (an toàn) ──┐≈≈ ║
110│     ~~~~~          │ thợ săn ★(88,112)  tuần tra │≈≈  ║
124▒▒▒▒▒▒▒▒▒▒ TƯỜNG RÀO (mặt ngoài) ▒▒▒[CHỐT ▼(87,123)]▒▒▒▒≈≈▒▒▒▒▒  ← sông chui qua cống tường (x 143)
128└──────────────────────────────────────────────────────────┘
```

| Khu | Phạm vi ô | Có gì | Quái **[BE]** |
| --- | --- | --- | --- |
| **Trạm gác + lều thợ săn** | x 67–110, y 107–128 | Trạm gác bê tông, lều, đống lửa, bảng hợp đồng săn; Thợ săn (81,113), Đội Tuần Tra (95,113). Điểm xuất phát ★ (88,112) | Không; **an toàn** tâm (88,116) bán kính 10 |
| **Ruộng hoang** | x 55–160, y 69–107 | Ruộng bỏ, bù nhìn đổ, hàng rào gãy | Gà Rừng ×4 tại (66,92), (104,98), (140,104), (150,80) |
| **Tháp cảm biến** | x 120–126, y 77–84 | Tháp có đèn trạng thái nhấp nháy theo nhịp 47; 4 chỗ thiền dưới chân | **[BE]** thiền Phong `vd_med_thap…_04` (122–125, 86–89) |
| **Đồng cỏ cao** | x 55–160, y 18–74 | Cỏ cao che nửa người, vết cày, cây đơn lẻ | Lợn Gai ×2 tại (62,30), (98,46), (124,24), (140,52), (158,30), (72,60); **Lợn Gai Đầu Đàn** (112,66) 🔒 hồi B |
| **Xe tải bỏ dở** | x 9–49, y 20–100 | Đường cũ, xe tải, container phủ dây leo, dẫn ra Mỏ | Nhện Tơ Điện ×3 tại (22,52), (30,80), (16,98) |
| **Sông** | từ (150,0) xuống (143,128), rộng 2,5 ô | Bờ đá, cống lưới chỗ sông chui qua tường; **cầu gỗ cũ** x 142–152, y 52–56 | **[BE]** nước + cầu. Cùng một dòng với sông Rừng Sâu (phía bắc) và sông đông của Làng (phía nam) |
| **Đường cao tốc gãy** | x 160–176, toàn dọc | Cầu cao tốc sập làm tường phía đông; **chỉ là cảnh nền**, không có cổng | Không |
| **Tường rào (mặt ngoài)** | y 124–128, toàn chiều ngang | Mặt sau của tường rào làng: bê tông trần, lưới, biển "Khu vực nguy hiểm — không vào" quay về phía rừng | Khớp với dải tường y 0–4 của Làng; Chốt ở (87,123) |
| **Hàng cây rừng** | y 0–17 | Bức tường cây; lối mòn kiểm lâm ở giữa | **[BE]** `ln_vanh_rung` (95,5) → Rừng Sâu |
| **Suối nhỏ** | (10,109) → (44,121) | **[BE]** nước | Không |

Cổng: về làng ở nam (87,123); lên Rừng Sâu ở bắc (95,5); sang Mỏ ở tây (5,31). Phía đông là cao tốc gãy, không có cổng. Tổng 37 quái thường.

### 4.2 Mỏ Bỏ Hoang (`m_mo_lo_thien`, 128×112)

```text
x→ 0         32          64          96        128
y0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ vách đá đỏ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   ▓                     ┌── BÃI MÁY HỎNG ──┐ đường núi ▓
20 ▓                     │  ⓝ(72,24)        │ ──────► (123,25) Rừng Sâu
   ▓ ┌─── HỐ TÂY ───┐    │                  │      ▓
40 ▓ │⛏ ⛏ ⛏ ⛏      │    │       ⓝ(96,44)   │      ▓
   ▓ │     ◎GIẾNG(49,47)  │                  │      ▓
50 ▓ │⛏ ⛏ ⛏ ⛏      │    │ ⓝ(76,66)         │      ▓
   ▓ │    ☯☯ mỏm đá │    └──────────────────┘      ▓
64 ▓ └──────────────┘                              ▓
   ▓ ┌──────────── BẬC ĐÁ ─────────────┐           ▓
80 ▓ │ⓡ(14,84)       ⓡ(62,86)          │ ┌LÁN THỢ ─┐◄(123,90)
   ▓ │                                 │ │★(112,96)│
100▓ │      ⓡ(38,100)       ⓡ(86,102)  │ │ ~ao~    │
112▓▓└─────────────────────────────────┘▓└─────────┘
```

| Khu | Phạm vi ô | Có gì | Quái **[BE]** |
| --- | --- | --- | --- |
| **Lán thợ** | x 103–123, y 82–106 | Lán chú Bram (110,91), đèn mỏ, ao nhỏ (113,104). Điểm xuất phát ★ (112,96) | Không; **an toàn** tâm (112,94) bán kính 8 |
| **Hố Tây** | x 16–53, y 36–64 | Bậc khai thác hình bậc thang, **8 vỉa sắt**, giếng thang máy, mỏm đá thiền | **[BE]** vỉa `ml_iron_01…08` tại (18,44), (24,41), (30,43), (36,40), (20,53), (26,56), (32,53), (38,57); giếng `ln_mo_ngam` (49,47); thiền Thạch `mb_med_ho_tay…_04` (44–47, 60–63). Quái không vào trong 6 ô quanh vỉa |
| **Bãi máy hỏng** | x 63–103, y 18–70 | Máy xúc gỉ, băng chuyền đứt, kho sập | Nhện Tơ Điện ×3 tại (72,24), (96,44), (76,66) |
| **Bậc đá** | x 11–90, y 70–108 | Bậc đá đỏ rộng, đá vụn | Rết Đá ×3 tại (14,84), (38,100), (62,86), (86,102) |
| **Đường núi** | x 103–128, y 18–32 | Đường dốc men vách đá sang phía đông, lên Rừng Sâu | **[BE]** `ln_mo_rung` (123,25) → Rừng Sâu. Mép đông phần trên của Mỏ giáp mép tây Rừng Sâu |

Cổng: về Bìa Rừng ở đông (123,90). Tổng 21 quái thường.

### 4.3 Hầm Mỏ (`m_mo_ngam`, 112×80)

```text
x→ 0         28          56          84        112
y0 ████████████[CỬA B2 HÀN (55,7)]██████████████████
   █ Ⓝ(16,14)🔒       ⓓ(54,22)                    █
16 █ ┌─ HẦM TÂY ─┐  ┌─ HANG GIỮA ─┐  ┌ VỈA ĐÔNG ┐ ═► 🔒(107,20)
   █ │ⓝ(14,34)  │  │              │  │ ⛏  ⛏  ⛏ │ █
32 █ │          │  │              │  │ ⛏  ⛏  ⛏ │ █
   █ │          │  │   ⓓ(62,46)   │  └──────────┘ █
48 █ │ⓝ(28,56)  │  └──────────────┘               █
   █ └──────────┘  ════ đường ray goòng ════ ~(92,64)~
64 █                     ┌SÂN GIẾNG┐   ⓓ(82,68)    █
   █                     │★(54,74) │               █
80 ██████████████████████▼(54,76)███████████████████
```

| Khu | Phạm vi ô | Có gì | Quái **[BE]** |
| --- | --- | --- | --- |
| **Sân giếng** | x 44–67, y 65–80 | Thang máy, đèn, thùng đồ. Điểm xuất phát ★ (54,74) | Không; **an toàn** tâm (54,72) bán kính 7; **[BE]** `ln_mo_ngam` (54,76) → Mỏ |
| **Đường ray** | y 56–66, x 9–102 | Ray goòng nối các nhánh hầm, vài xe goòng đổ, vũng nước (92,64) | Dơi ×4 tại (82,68) |
| **Vỉa Đông** | x 79–102, y 27–47 | **6 vỉa**, vân linh mạch chạy thẳng về phía bắc, hướng sườn núi và Trạm | **[BE]** `ng_iron_b1_01…06` tại (82,42), (88,38), (84,32), (92,30), (96,42), (100,34). Quái không vào trong 6 ô |
| **Hang Giữa** | x 44–73, y 15–50 | Hang trần cao, nhũ đá, ít ánh sáng | Dơi ×4 tại (54,22), (62,46) |
| **Hầm Tây** | x 7–38, y 10–60 | Tơ phủ kín vách, trứng nhện phát sáng; mảnh vật liệu tím ở góc trong cùng | Nhện Tơ Điện ×3 tại (14,34), (28,56); **Nhện Mẹ** (16,14) 🔒 hồi C |
| **Cửa B2** | x 50–61, y 2–12 | Cửa sắt hàn kín, tiếng "ù" sau cửa | Không; mở ở chương sau |
| **Hầm cũ** | x 102–112, y 15–25 | Đường hầm nối Rừng Sâu | **[BE]** `ln_ngam_rung` (107,20) 🔒 hồi D |

Tổng 18 quái thường.

### 4.4 Rừng Sâu (`m_ba_vi`, 192×144)

```text
x→ 0         48          96          144       192
y0 ▓▓▓▓▓▓▓▓ SƯỜN NÚI ▓▓▓[CỬA KÍN 🔒(101,5)]▓▓▓▓▓≈▓▓▓
   ▓ ┌── TÁN CAO ──┐   thác   bậc leo     Ⓚ(168,22)🔒 ▓
16 ▓ │ⓒ(22,16) ⓒ(50,22)                  ┌VÁCH ĐÁ─┐≈ ▓
   ▓ │              │                     │ⓚ(140,34)│≈▓
32 ▓ │    ✦☯☯☯(72,39) gốc TL bắc         │  ⓚ(162,50)≈ ▓
   ▓ │ⓒ(30,52)      │                     │        ◎hồ(167,67)
48 ▓ └──────────────┘                     │ⓚ(138,76)│≈▓
   ▓   ···lối mòn ẩn···  ┌─ THUNG SUỐI ──┐│         │≈▓
64 ▓                     │ trạm cứu hộ   │└─ⓚ(178,92)≈▓
   ▓    ┌─ ĐẦM SƯƠNG ─┐  │ (120,84)      │          ≈▓
   ▓    │ⓢ(18,90)     │  │  ⓦ(112,88)    │         ≈ ▓
96 ▓    │   ⓢ(44,104) │  └───────────────┘         ≈ ▓
   ▓    │             │ ✦☯☯☯(90,112)  ⓦ(134,106)    ≈▓
112▓    │             │   gốc TL nam                 ▓
🔒◄(5,120)ⓢ(20,128)  │  ⓦ(70,128)   ⓦ(116,126)      ▓
128▓    │   ⓢ(50,128) │    RÌA RỪNG ẨM  ★(93,133)    ▓
144▓▓▓▓▓└─────────────┘▓▓▓▓▼(93,139) về Bìa Rừng▓▓▓▓▓▓
```

| Khu | Phạm vi ô | Có gì | Quái **[BE]** |
| --- | --- | --- | --- |
| **Lối vào** | quanh (93,136) | Điểm xuất phát ★ (93,133) | **an toàn** tâm (93,134) bán kính 8 |
| **Rìa rừng ẩm** | x 60–144, y 101–144 | Cây cao lần đầu che trời, dương xỉ, đường mòn | Sói Rêu ×3 tại (70,128), (116,126), (134,106) |
| **Gốc cây Tinh Linh** | nam (90,112), bắc (72,39) | Cây có dấu lá, lồng đèn; điểm hồi sinh khi thua; 3 chỗ thiền mỗi cây | **an toàn** bán kính 7; **[BE]** thiền Mộc `rs_med_goc_nam…_03` (87–93,112), `rs_med_goc_bac…_03` (69–75,39) |
| **Đầm Sương** | x 9–66, y 73–135 | Đầm lầy, sương dày, gỗ mục | Rắn Sương tại (18,90) ×3, (44,104) ×2, (20,128) ×2, (50,128) ×3 |
| **Thung Suối** | x 84–138, y 62–101 | Suối đá, **trạm cứu hộ bỏ hoang của bố Rin** (120,84) | Sói Rêu ×3 tại (112,88) |
| **Vách Đá** | x 136–180, y 22–96 | Vách cao, gờ đá; sông và hồ (167,67) ở chân vách | Khỉ Vách Đá ×3 tại (140,34), (162,50), (138,76), (178,92); **Khỉ Đầu Đàn** (168,22) 🔒 hồi D |
| **Tán Cao** | x 12–78, y 6–56 | Cây cổ thụ, rất tối | Cú Đêm Linh ×2 tại (22,16), (50,22), (30,52) — chỉ ban đêm |
| **Sườn núi** | x 78–136, y 0–28 | Thác, bậc leo núi cũ, **cửa kín** dẫn xuống Trạm | **[BE]** `ln_rung_tram` (101,5) 🔒 hồi E |
| **Lối mòn ẩn** | (90,112)→(120,84) và (24,73)→(72,39) | Đường tắt qua bụi rễ; **chỉ đi được khi Hóa Thú** | Không; chưa có trong dữ liệu |

Cổng: từ Bìa Rừng ở nam (93,139); từ Mỏ ở tây (5,110); từ Hầm cũ ở tây nam (5,120) 🔒. Sông dưới Vách Đá chảy tiếp xuống mép nam ở x 148, sang Bìa Rừng. Tổng 40 quái thường (34 ban ngày, 28 ban đêm).

### 4.5 Trạm Thiên Mạch (`m_tram_thien_mach`, 96×80)

```text
x→ 0         24          48          72        96
y0 ████████████████████████████████████████████████
   █           ┌──── PHÒNG LÕI ────┐              █
   █           │  ◉ LÕI, BOSS (47,14)🔒            █
18 █ ┌PHÒNG MÁY┐│                   │┌── KHO ──┐   █
  ▒▒╡ⓜ(14,26) │└─────────┬─────────┘│ⓜ(80,26) │   █
32 █ └─────────┘══ hành lang trên ══ └─────────┘   █
   █              ⓜ(47,36)                          █
48 █ ══════ hành lang dưới ═════════════════════   █
   █  ⓜ(14,50)       ⓜ(47,52)        ⓜ(80,50)      █
60 █ ┌LƯU TRỮ─┐  ┌── SẢNH VÀO ──┐  ┌LỒNG GIAM┐     █
   █ │ hồ sơ  │  │  ★(47,70)     │  │ trống   │     █
80 █████████████████▼(47,75)████████████████████████
```

`▒` là vách sập ở tường tây Phòng Máy, thông ra hang núi (x 0–5, y 22–28).

| Khu | Phạm vi ô | Có gì | Quái **[BE]** |
| --- | --- | --- | --- |
| **Sảnh vào** | x 33–63, y 60–80 | Cửa chống cháy còn vết hàn và giấy niêm phong của Viện, đèn khẩn cấp, ghế chờ; điểm hồi sinh. Điểm xuất phát ★ (47,70) | **an toàn** tâm (47,70) bán kính 6; **[BE]** `ln_rung_tram` (47,75) 🔒 |
| **Hành lang dưới** | y 46–56, x 5–91 | Hành lang bê tông, đèn chập chờn theo nhịp 47 | Chuột Tím ×4 tại (14,50), (47,52), (80,50) |
| **Hành lang trên** | y 32–40, x 5–91 | Nối Phòng Lõi với hai cánh | Chuột Tím ×4 tại (47,36) |
| **Phòng máy** | x 5–27, y 18–32 | Máy móc cũ, tinh thể tím mọc trên vỏ máy; **vách sập** ở tường tây (x 0–5, y 22–28) thông ra một đoạn hang cụt, có vết cào và lông gấu | Chuột Tím ×4 tại (14,26) |
| **Kho** | x 69–91, y 18–32 | Đồ tiếp tế cũ, bị chuột gặm | Chuột Tím ×4 tại (80,26) |
| **Lưu trữ** | x 5–27, y 60–76; cửa x 14–18, y 56–60 ra hành lang dưới | Hồ sơ dự án Thiên Mạch: mảnh tím đào từ hố cổ trên đỉnh núi, ghi chú "rơi từ trời"; lệnh niêm phong sáng sau Linh Chấn | Không |
| **Lồng giam** | x 69–91, y 60–76; cửa x 78–82, y 56–60 ra hành lang dưới | Dãy lồng trống, vết cào bên trong, thẻ ghi ngày **trước** Linh Chấn | Không (cảnh truyện) |
| **Phòng Lõi** | x 30–66, y 2–26 | Lõi cộng hưởng (47,14), bảng điều khiển ở mép nam; sàn tròn ~24×20 ô làm đấu trường boss, vừa 30 người; 4 cột che. Lõi luôn chạy; ai đó Ngắt lõi thì cả kênh thấy lõi tối 47 phút | **Thủ Lĩnh Mạch Gãy** (47,14) 🔒 hồi E, quay lại sau 47 phút |

Tổng 24 Chuột Tím.

---

## 5. Quy tắc chung khi đặt quái

Các quy tắc có dấu ✔ được `scripts/build-life-world.cjs` kiểm tra; script từ chối build nếu sai.

- ✔ **Điểm an toàn**: quái không đứng trong bán kính an toàn. Thua thì tỉnh lại ở điểm an toàn gần nhất.
- ✔ **Đầu cổng và điểm xuất phát:** không đặt quái trong 12 ô.
- ✔ **Điểm hoạt động** (vỉa, bến câu, chỗ thiền): quái không vào trong 6 ô; avatar tự hoạt động không bị tấn công.
- **Mật độ:** tối đa 6 quái trong một màn ở zoom mặc định (30×17 ô). Số quái tính cho map đủ 30 người, khoảng 1–1,5 quái/người ([10](10-kich-thuoc-map-online.md) §5.2).
- **Lãnh địa:** mỗi nhóm quái có tâm và bán kính; đuổi ra quá bán kính thì quay về (xem [06](06-monsters.md) §2).
