# 05 — Bố cục chi tiết từng map

Tọa độ tính theo **ô 32 px**, gốc (0,0) ở góc **trên-trái**, x sang phải, y xuống dưới. Hướng bắc là phía trên.

**Giữ nguyên với backend** (`server/data/life_world.json`): kích thước map, vị trí cổng, 4 bến câu, 12 luống, 4 vỉa, sông hồ. Những thứ này đánh dấu **[BE]**. Phần còn lại (nhà, khu, đường, quái) là thiết kế mới; khi dựng client cần cập nhật footprint và collision trong cùng file đó.

Xem quái ở [06](06-monsters.md). Khu và tên gọi theo [03](03-world-and-maps.md).

---

## 1. Khu Người — Làng Hồ Lặng (`m_lang_que`, 256×192)

### 1.1 Sơ đồ

```text
x→ 0        40        80        120       160       200       240  256
y0 ╔══════════════════ TƯỜNG RÀO ═══[CHỐT]══════════════════╗≈≈≈≈╗
   ║ ~~~~~~~ suối bắc ~~~~~~~~~~        ▲ ln_lang_vanh (147,8)║≈≈≈≈║
20 ║  ┌─ĐỒI MIẾU─┐                       │ đường Chốt          ║≈ s ║
   ║  │ miếu     │                       │                     ║≈ ô ║
40 ║  │ sân thiền│     ┌───────────── THỊ TRẤN ─────────────┐ ║≈ n ║
   ║  └──────────┘     │                │  xưởng rèn  Trạm Viện│ ║≈ g ║
60 ║ ┌──── XÓM NHÀ ──┐ │                │  tiện lợi   quán cf  │ ║≈   ║
   ║ │ ngõ, sân phơi │ │   ┌─QUẢNG TRƯỜNG CỔNG─┐ CHỢ PHIÊN      │ ║≈ đ ║
80 ║ │ nhà dân       │ │   │     ◎ CỔNG        │ ●(157,103)[BE] │ ║≈ ô ║
   ║ │               │ │   │   ẨN GIỚI (128,92)│ trạm buýt ─────┼─╫─► ln_lang_thang
100║ │ nhà Nora      │ │   │  chốt gác, chợ TL │ (249,105) đóng  │ ║≈   ║
   ║ │ nhà người chơi│ │   └────★ spawn(130,111)┘                │ ║≈   ║
120║ └───────────────┘ │  ~~ kênh ~~                             │ ║≈   ║
   ║                   └─────────│──────────────────────────────┘ ║≈   ║
140║  ┌── VƯỜN ──┐    ┌─RUỘNG─┐  ~~    ┌──── HỒ LẶNG ────┐         ║≈   ║
   ║  │12 luống  │    │ lúa   │   ~~   │ ▼▼▼▼ 4 bến (169–187,150)[BE]║≈   ║
160║  │(65–83,   │    │ nhà   │    ~~  │      mặt hồ         │      ║≈   ║
   ║  │166–176)  │    │ kính  │     ~~ │  cầu gỗ, quán nước  │      ║≈   ║
180║  └──[BE]────┘    └───────┘      ~~└─────────────────────┘      ║≈   ║
192╚════════════════════════════════════════════════════════════════╩════╝
```

### 1.2 Các khu

| Khu | Phạm vi ô (x, y) | Có gì | Ghi chú |
| --- | --- | --- | --- |
| **Tường rào** | toàn chiều ngang, y 0–6 | Tường bê tông + lưới, đèn pha mỗi 16 ô, biển cảnh báo | Chặn đi lại, trừ Chốt |
| **Chốt Tường Rào** | x 140–154, y 4–14 | Cổng sắt, trạm gác, Đội Tuần Tra, bảng thông báo | **[BE]** `ln_lang_vanh` tại (147,8) → Bìa Rừng |
| **Suối bắc** | dọc y 13–29, x 17–126 | Suối nhỏ, 2 cầu đá | **[BE]** nước |
| **Đồi Miếu** | x 18–60, y 16–50 | Miếu cổ, sân thiền, bậc đá, cây cổ thụ | Điểm Thiền/Hấp Linh |
| **Xóm nhà** | x 12–100, y 55–135 | ~18 nhà, ngõ, sân phơi, giếng; **nhà người chơi** (x 70–80, y 118–128), **nhà bà Nora** (x 55–64, y 104–112) | Khu sống chính |
| **Quảng trường Cổng** | x 108–150, y 78–116 | **Cổng Ẩn Giới** tâm (128,92), khung thép, chốt gác, lồng đèn lá, góc chợ Tinh Linh (x 110–122, y 100–112), ghế đá | Điểm vào mặc định ★ (130,111) **[BE]** spawn |
| **Chợ phiên** | x 150–170, y 92–116 | Sạp rau, cá, đồ khô | **[BE]** `ak.market.village` (157,103) |
| **Thị trấn** | x 150–226, y 36–132 | Xưởng rèn Doran (x 170–182, y 48–58), Trạm Viện (x 190–204, y 46–60), cửa hàng tiện lợi, quán cà phê, nhà 2–3 tầng | Phía đông làng |
| **Trạm buýt** | x 238–248, y 100–110 | Trạm chờ, biển "Tuyến về thành phố — tạm ngưng" | **[BE]** `ln_lang_thang` (249,105): **đóng** ở chương 1 |
| **Sông đông** | x 228–246, toàn chiều dọc | Sông rộng 4 ô, bờ kè | **[BE]** nước; ranh giới tự nhiên phía đông |
| **Kênh** | từ (106,122) xuống (141,192) | Kênh tưới, 2 cầu | **[BE]** nước; chia vườn/ruộng với hồ |
| **Vườn** | x 58–92, y 160–184 | 12 luống, nhà kho nhỏ, thùng tưới | **[BE]** luống tại x 65–83, y 166–176 |
| **Ruộng** | x 95–135, y 138–186 | Lúa, bù nhìn, nhà kính nhỏ | Trang trí, NPC làm đồng |
| **Hồ Lặng** | x 151–204, y 147–183 | Mặt hồ, 4 bến bờ bắc, cầu gỗ, quán nước dưới gốc cây (x 205–215, y 150–160) | **[BE]** hồ + bến (169/175/181/187, 150) |

### 1.3 Đường chính

- **Trục Bắc–Nam:** Chốt (147,8) → Quảng trường (128,92) → bờ hồ (170,146). Rộng 3 ô, nhựa.
- **Trục Tây–Đông:** Xóm nhà (60,100) → Quảng trường → Chợ → Thị trấn → Trạm buýt (240,105). Rộng 3 ô.
- **Ngõ:** rộng 1–2 ô, lát gạch, nối các nhà trong xóm và lên Đồi Miếu.
- Từ nhà người chơi đi bộ tới: vườn ≈ 40 ô, hồ ≈ 100 ô, Cổng ≈ 60 ô, Chốt ≈ 130 ô.

### 1.4 Ánh sáng và nhịp sống

- Đèn đường dọc 2 trục chính; Cổng tự phát sáng, chiếu ngọc lam lên mái nhà trong bán kính ~12 ô.
- Đèn pha trên tường rào quét chậm ban đêm.
- NPC: ~15 Người (nông dân, chủ quán, Đội Tuần Tra, trẻ con), ~4 Tinh Linh (người bán ở góc chợ, một Tinh Linh ngủ trên mái miếu).
- Thú vô hại: gà, vịt ở hồ, mèo nhà, chim sẻ. **Không có quái.**

---

## 2. Khu Tinh Linh — Ẩn Giới (`m_an_gioi`, map mới, 160×128 đề xuất)

### 2.1 Sơ đồ

```text
x→ 0         40          80          120        160
y0 ░░░░░░░░░░░░░░ RÌA PHAI (sương trắng) ░░░░░░░░░░░░
   ░ ┌VÒNG ĐÁ┐                                     ░
20 ░ │Hội Rễ │        ✿✿✿✿✿✿✿✿✿                   ░
   ░ └───────┘      ✿  CÂY MẸ  ✿                  ░
40 ░                ✿  (80,45) ✿     ┌─SUỐI HẤP LINH─┐
   ░ ┌VƯỜN NẤM┐     ✿ nhà hốc cây ✿  │ ≈≈≈≈≈≈≈≈≈≈≈≈  │
60 ░ │ luống  │      ✿✿✿✿✿✿✿✿✿✿✿    │ 3 điểm hấp linh│
   ░ │ nấm    │     nhà trên cành    │ 2 bến câu linh │
80 ░ └────────┘     đường rễ cây     └───────────────┘
   ░        đồ "rơi qua cổng": xe đạp, máy bán hàng
100░            ~~~~ HỒ GƯƠNG ~~~~
   ░            ~~  ◎ BẾN CỔNG  ~~
120░            ~~    (80,114)  ~~   ★ đến từ làng
128░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### 2.2 Các khu

| Khu | Phạm vi ô | Có gì |
| --- | --- | --- |
| **Rìa Phai** | viền ngoài 0–6 ô | Cảnh vật mờ dần thành sương; đi vào thì bị đẩy nhẹ lại. Lá héo theo nhịp 47 giây |
| **Bến Cổng** | x 66–94, y 104–124 | Phía Ẩn Giới của Cổng (80,114) đứng trên **Hồ Gương** phẳng; nhìn qua thấy mờ mái nhà làng. Điểm đến ★ cách cổng 4 ô về phía bắc |
| **Vườn Cây Mẹ** | x 50–110, y 18–80 | Cây Mẹ tâm (80,45), rễ cao như tường; nhà hốc cây, nhà trên cành (có cầu thang rễ), cầu treo bằng dây leo; nhà người chơi Tinh Linh ở một hốc rễ phía nam |
| **Suối Hấp Linh** | x 112–148, y 36–82 | Suối có hạt sáng trôi lên, 3 điểm Hấp Linh, 2 bến câu cá linh |
| **Vườn nấm** | x 12–46, y 50–84 | Luống nấm và cây Ẩn Giới (trồng của Tinh Linh) |
| **Vòng Đá** | x 10–34, y 10–32 | 9 tảng đá xếp vòng, nơi Hội Rễ họp |
| **Bãi đồ rơi** | x 40–70, y 86–100 | Xe đạp, biển báo, máy bán hàng rơi qua cổng; Tinh Linh dùng làm đồ trang trí |

- Không có tường, không có góc vuông; đường đi là rễ cây và đá lát tròn.
- NPC: ~12 Tinh Linh (Lão Hồ ở gốc Cây Mẹ, Bé Mơ chạy khắp nơi). Sinh vật vô hại: **linh trùng** (đốm sáng bay), cá linh, chim lông trong. **Không có quái.**
- Backend cần thêm: điểm Hấp Linh, luống nấm, 2 bến câu, cặp cổng `ln_lang_angioi` (làng (128,92) ↔ Ẩn Giới (80,114)).

---

## 3. Khu Rừng Quái

### 3.1 Bìa Rừng (`m_vanh_dai_tay`, 288×224)

```text
x→ 0        60        120       180       240       288
y0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓[ĐƯỜNG MÒN]▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   ▓▓▓ hàng cây rừng ▓▓▓▓ ▲ ln_vanh_rung (156,8) ▓▓▓▓▓▓
40 ◄ ln_vanh_mo   ┌─────────────── ĐỒNG CỎ CAO ──────────┐  ║ĐƯỜNG
 (9,55)│ XE TẢI   │  ⓝ Nhện rìa      ⓛⓛ Lợn Gai        │  ║ CAO
80     │ BỎ DỞ    │                 ⓛ   ⓛⓛ             │  ║ TỐC
       │ ⓝⓝ Nhện  │      ⓁĐầu Đàn (hồi B)              │  ║ GÃY
120    │ (đường   │   ruộng hoang      tháp cảm biến   │  ║ (279,109)
       │  xe cũ)  │     ⓖⓖ Gà Rừng      (200,140)      │  ║ chặn
160    └──────────┘   ⓖⓖ                   ⓖⓖ          │  ║
   ~~~ suối nhỏ ~~~  └───────────────────────────────────┘
200        ┌──── TRẠM GÁC + LỀU THỢ SĂN (an toàn) ────┐
224 ═══════╧══════════ ▼ ln_lang_vanh (143,215) về làng ╧══════
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Trạm gác + lều thợ săn** | x 110–180, y 188–224 | Trạm gác bê tông, lều thợ săn, đống lửa, bảng hợp đồng săn. **An toàn**: quái không vào trong bán kính 14 ô | Không |
| **Ruộng hoang** | x 90–200, y 120–188 | Ruộng bỏ, bù nhìn đổ, hàng rào gãy | Gà Rừng Mào Sét |
| **Đồng cỏ cao** | x 90–260, y 40–130 | Cỏ cao che nửa người, vết cày, cây đơn lẻ | Lợn Gai; Lợn Gai Đầu Đàn ở tâm (150,90) |
| **Tháp cảm biến** | x 196–206, y 134–146 | Tháp có đèn trạng thái; nhấp nháy theo nhịp 47 | Không |
| **Xe tải bỏ dở** | x 15–80, y 35–170 | Đoạn đường cũ, xe tải và container phủ dây leo, dẫn ra Mỏ | Nhện Tơ Điện (giăng tơ giữa các xe) |
| **Đường cao tốc gãy** | x 262–288, toàn dọc | Cầu cao tốc sập làm tường phía đông | **[BE]** `ln_vanh_thang` (279,109): **đóng** |
| **Hàng cây rừng** | y 0–30 | Bức tường cây; một lối mòn kiểm lâm ở giữa | **[BE]** `ln_vanh_rung` (156,8) → Rừng Sâu |
| **Suối nhỏ** | (17,191)→(72,212) | **[BE]** nước | Không |

Đường đi: về làng ở nam (143,215); lên Rừng Sâu ở bắc (156,8); sang Mỏ ở tây (9,55).

### 3.2 Mỏ Bỏ Hoang (`m_mo_lo_thien`, 224×192)

```text
x→ 0         60          120         180        224
y0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓[ĐƯỜNG NÚI ▲ ln_mo_rung (110,9)]▓▓▓▓▓
   ▓ vách đá đỏ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
40 ▓  ┌──── HỐ TÂY ────┐      ┌── BÃI MÁY HỎNG ──┐
   ▓  │  bậc khai thác │      │ máy xúc, băng    │
80 ▓  │ ⛏(44,83) ⛏(61,88)[BE] │ chuyền ⓝⓝ Nhện   │
   ▓  │   ◎ GIẾNG (85,80)[BE]│        ⓝ         │
120▓  └────────────────┘      └──────────────────┘
   ▓   ⓡ   BẬC ĐÁ   ⓡ   (Rết Đá dưới đất)
160▓      ⓡ          ⓡ            ┌LÁN THỢ (an toàn)┐ ◄ ln_vanh_mo
   ▓                     ~ao~(198,174)[BE]          │   (215,154)
192▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Lán thợ** | x 180–215, y 140–175 | Lán chú Bram, đèn mỏ, ao nhỏ. **An toàn**, bán kính 12 ô | Không |
| **Hố Tây** | x 28–92, y 62–110 | Bậc khai thác hình bậc thang, 2 vỉa sắt, giếng thang máy | **[BE]** vỉa (44,83), (61,88); giếng `ln_mo_ngam` (85,80). Quái không vào trong 6 ô quanh vỉa |
| **Bãi máy hỏng** | x 110–180, y 45–120 | Máy xúc gỉ, băng chuyền đứt, kho sập | Nhện Tơ Điện |
| **Bậc đá** | x 20–150, y 120–185 | Bậc đá đỏ rộng, đá vụn | Rết Đá |
| **Đường núi** | x 95–125, y 0–40 | Dốc lên rừng | **[BE]** `ln_mo_rung` (110,9) → Rừng Sâu |

### 3.3 Hầm Mỏ (`m_mo_ngam`, 192×160)

```text
x→ 0         50         100        150       192
y0 ████████████[ CỬA B2 BỊ HÀN (95,15) ]████████████
   █ ┌─ HẦM TÂY ─┐   ┌─HANG GIỮA─┐               █
40 █ │ TỔ NHỆN   │   │ trần cao  │  ┌ VỈA ĐÔNG ┐ ═► ln_ngam_rung (183,41) 🔒
   █ │ ⓃNhện Mẹ  │   │ ⓓⓓⓓ Dơi  │  │⛏(161,73) │ █
80 █ │ ⓝ ⓝ trứng │   │ ⓓⓓ       │  │⛏(146,81) │ █ [BE]
   █ └───────────┘   └───────────┘  └──────────┘ █
120█    ══════ đường ray goòng ══════  ~(158,128)~█
   █              ┌ SÂN GIẾNG (an toàn) ┐        █
160████████████████████ ▼ (93,150) ███████████████
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Sân giếng** | x 75–115, y 130–160 | Thang máy, đèn, thùng đồ. **An toàn**, bán kính 10 ô | **[BE]** `ln_mo_ngam` (93,150) |
| **Đường ray** | y 112–128, x 15–175 | Ray goòng nối các nhánh hầm, vài xe goòng đổ | Dơi bay ngang theo đàn |
| **Vỉa Đông** | x 135–175, y 55–95 | 2 vỉa, vân linh mạch chạy thẳng tắp về phía đông | **[BE]** vỉa (146,81), (161,73). Quái không vào trong 6 ô |
| **Hang Giữa** | x 75–125, y 30–100 | Hang trần cao, nhũ đá, ít ánh sáng | Dơi Vân Quặng |
| **Hầm Tây** | x 12–65, y 30–100 | Tơ phủ kín vách, trứng nhện phát sáng; mảnh vật liệu tím đầu tiên ở góc trong cùng | Nhện Tơ Điện; **Nhện Mẹ** (hồi C) |
| **Cửa B2** | x 85–105, y 5–25 | Cửa sắt hàn kín, tiếng "ù" sau cửa | Không; mở ở chương sau |
| **Hầm cũ** | x 175–192, y 30–50 | Đường hầm nối Rừng Sâu | **[BE]** `ln_ngam_rung` (183,41) 🔒 hồi D |

### 3.4 Rừng Sâu (`m_ba_vi`, 320×256)

```text
x→ 0        80        160       240       320
y0 ▓▓▓▓▓ SƯỜN NÚI ▓▓▓▓[CỬA KÍN 🔒 (168,9)]▓▓▓▓≈≈≈≈≈▓
   ▓ ⓒ TÁN CAO ⓒ(đêm)     thác  bậc leo      ≈ sông▓
40 ▓  ⓒ   ⓒ        ✦gốc TL(120,70)       ┌VÁCH ĐÁ┐≈ ▓
   ▓                                       │ⓚ Khỉ  │≈ ▓
80 ▓        ───── lối mòn ẩn ─────         │ⓚⓚ  ⓚ │ ◎hồ(278,119)
mỏ►(9,136)     ┌─THUNG SUỐI─┐              │ ⓀĐầu Đàn│≈ ▓
120▓           │ trạm cứu hộ│ (200,150)     └───────┘≈ ▓
   ▓ ┌─ ĐẦM SƯƠNG ─┐  bố Rin │                   ≈ ▓
160▓ │ ⓢ Rắn Sương │──────────┘    ⓦⓦ Sói Rêu      ≈ ▓
   ▓ │  ⓢ   ⓢ      │          ⓦ      ⓦ           ≈ ▓
200hầm►(9,213)🔒 ⓢ │   ✦gốc TL(150,200)   ⓦⓦ       ≈ ▓
   ▓ └──────────────┘   RÌA RỪNG ẨM               ≈ ▓
256▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▼ (155,247) về Bìa Rừng ▓▓▓▓▓▓▓▓
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Rìa rừng ẩm** | x 120–240, y 180–256 | Cây cao lần đầu che trời, dương xỉ, đường mòn | Sói Rêu (đàn 3) |
| **Gốc cây Tinh Linh** | (150,200) và (120,70) | Cây có dấu lá, lồng đèn; **an toàn**, bán kính 10 ô; điểm hồi sinh khi thua | Không |
| **Đầm Sương** | x 15–110, y 130–235 | Đầm lầy, sương dày dưới thấp, gỗ mục | Rắn Sương |
| **Thung Suối** | x 140–230, y 110–180 | Suối đá, **trạm cứu hộ bỏ hoang của bố Rin** (200,150) | Thưa; vài Sói Rêu lạc |
| **Vách Đá** | x 230–300, y 40–150 | Vách cao, gờ đá; sông và hồ **[BE]** ở chân vách | Khỉ Vách Đá; **Khỉ Đầu Đàn** (hồi D) |
| **Tán Cao** | x 20–130, y 10–100 | Cây cổ thụ, rất tối | Cú Đêm Linh (chỉ ban đêm) |
| **Sườn núi** | x 130–230, y 0–50 | Thác, bậc leo núi cũ, **cửa kín** dẫn xuống Trạm | **[BE]** `ln_rung_tram` (168,9) 🔒 hồi E |
| **Lối mòn ẩn** | (150,200)→(200,150) và (40,130)→(120,70) | Đường tắt qua bụi rễ; **chỉ đi được khi Hóa Thú** | Không |

Cửa vào: từ Bìa Rừng ở nam (155,247); từ Mỏ ở tây (9,136); từ Hầm cũ ở tây nam (9,213) 🔒.

### 3.5 Trạm Thiên Mạch (`m_tram_thien_mach`, 160×128)

```text
x→ 0         40          80          120       160
y0 ████████████████████████████████████████████████
   █              ┌── PHÒNG LÕI ──┐              █
20 █              │   ◉ LÕI (80,25)│              █
   █              │ Thủ Lĩnh Mạch Gãy             █
40 █              └───────┬───────┘              █
   █ ┌PHÒNG MÁY┐  ═══ hành lang trên ═══  ┌LỒNG GIAM┐█
60 █ │ ⓜⓜ      │          │               │ lồng trống█
   █ └─────────┘          │               └────────┘█
80 █ ┌LƯU TRỮ─┐  ═══ hành lang dưới ═══  ┌KHO┐     █
   █ │ hồ sơ  │  ⓜⓜⓜ Chuột Tím ⓜⓜ      │   │     █
100█ └────────┘          │                └───┘     █
   █           ┌── SẢNH VÀO (an toàn) ──┐           █
128█████████████████ ▼ (78,119) █████████████████████
```

| Khu | Phạm vi ô | Có gì | Quái |
| --- | --- | --- | --- |
| **Sảnh vào** | x 55–105, y 100–128 | Cửa chống cháy, đèn khẩn cấp, ghế chờ. **An toàn**; điểm hồi sinh | **[BE]** `ln_rung_tram` (78,119) |
| **Hành lang dưới / trên** | y 75–90 và y 45–58 | Hành lang bê tông, đèn chập chờn theo nhịp 47 | Chuột Tím (đàn) |
| **Lưu trữ** | x 8–45, y 75–102 | Hồ sơ cho thấy Viện tìm vật liệu tím trước Linh Chấn | Không |
| **Phòng máy** | x 8–45, y 45–68 | Máy móc cũ, tinh thể tím mọc trên vỏ máy | Chuột Tím |
| **Lồng giam** | x 115–152, y 45–68 | Dãy lồng trống, vết cào bên trong | Không (cảnh truyện) |
| **Kho** | x 115–140, y 75–100 | Đồ tiếp tế cũ | Không |
| **Phòng Lõi** | x 55–105, y 8–42 | Lõi cộng hưởng (80,25); sàn tròn rộng làm đấu trường boss; 4 cột che | **Thủ Lĩnh Mạch Gãy** |

---

## 4. Quy tắc chung khi đặt quái

- **Điểm an toàn** (trạm gác, lán thợ, sân giếng, gốc cây Tinh Linh, sảnh Trạm): quái không đi vào trong bán kính ghi ở từng map. Thua thì tỉnh lại ở điểm an toàn gần nhất.
- **Đầu cổng:** không đặt quái trong 12 ô quanh điểm đến của mọi cổng.
- **Điểm hoạt động** (vỉa, bến câu): quái không vào trong 6 ô; avatar tự hoạt động không bị tấn công.
- **Mật độ:** tối đa 6 quái trong một màn hình ở zoom mặc định (≈ 30×17 ô).
- **Lãnh địa:** mỗi nhóm quái có tâm và bán kính; đuổi ra quá bán kính thì quay về (xem [06](06-monsters.md) §2).
