# 08 — Rừng Ba Vì Dị Biến | `m_ba_vi`

**Loại:** vùng rừng/núi nguy hiểm cao dần, ID canon · 320×256 ô (10240×8192 px).
**Bản sắc:** rừng ẩm miền Bắc, suối đá, bậc leo núi cũ, trạm kiểm lâm, miếu nhỏ, đá mạch phát quang. **Sáng – ấm ở chốt**, rồi rêu tối, bão hòa giảm, âm thanh vắng người, linh năng mức 2 ở sâu. Rừng không phải tường cây bít lối; cây có silhouette rõ, khoảng trống để né/đọc quái.

## A. Tổng mặt bằng

```text
 BẮC               ▲ cửa TRẠM THIÊN MẠCH
┌──────────────────────┬────────────────────────┬────────────────────────┐
│ Sườn núi, hang đá    │ VÁCH ĐÁ / MẠCH LINH    │ Thác cao, rừng sâu     │
│ quái Khỉ             │ đường trạm bí ẩn       │ Rắn Sương, nấm sáng    │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ ← lối từ MỎ LỘ       │ NGÃ BA ĐƯỜNG MÒN      │ SUỐI / CẦU GỖ         │
│ THIÊN, lán khảo sát  │ đất đá, tán cổ thụ     │ bãi thu thập          │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ ← cửa MỎ NGẦM CŨ    │ TRẠM KIỂM LÂM          │ RỪNG THƯA, bãi đá     │
│ (giai đoạn đầu khóa) │ ▼ từ VÀNH ĐAI          │ vòng đi bộ an toàn hơn│
└──────────────────────┴────────────────────────┴────────────────────────┘
 NAM
```

| Sector (x,y ô) | Nội dung | Gameplay/độ khó |
| --- | --- | --- |
| `BV01_CONG_NAM` x=114–205,y=203–255 | trạm kiểm lâm, rào, bàn đồ, cầu cứu hộ | safe checkpoint tại nam |
| `BV02_RUNG_THUA` x=176–308,y=157–247 | rừng thưa, đồi lượn, đá, suối nhỏ | PvE thấp/vật liệu an toàn hơn |
| `BV03_DUONG_MO` x=9–114,y=92–160 | đường núi cũ, vách đá, trạm khảo sát | portal Mỏ lộ thiên |
| `BV04_HAM_CU` x=9–108,y=177–245 | khe rừng, cửa hầm khóa, bảng cảnh báo | portal Mỏ ngầm (mở sau) |
| `BV05_NGA_BA` x=100–212,y=91–198 | lối mòn, sân gốc cây, điểm nghỉ ít NPC | hub thám hiểm/đường vòng |
| `BV06_VACH_CAO` x=90–226,y=9–99 | đường lên Trạm Thiên Mạch, vách dựng | nguy cơ vừa–cao, chốt khóa |
| `BV07_SUOI_THAC` x=212–316,y=46–178 | thác, suối, cây rễ, đá linh | khám phá, cần cầu an toàn |
| `BV08_RUNG_DAY` x=20–112,y=12–91 | tán dày, rễ/cây biến dị, hang nấm | PvE cao, gần như không NPC |

**Dòng suối chính:** từ (292,13) → (257,56) → (245,111) → (266,158) → (293,207), **ở nửa phía Đông**; con đường bắc–nam giữa rừng không bị nước cắt vô cớ. Cầu ở khoảng (245,119) dẫn sang thác (nhánh khám phá), cần đủ collider/footprint và đường hai đầu. Đường mòn tự nhiên rộng 2–3 ô, tránh cây mọc giữa tâm đường.

## B. Lối đi an toàn tương đối và đường vòng PvE

| Route | Centerline (ô) | Rộng | Chức năng |
| --- | --- | --- | --- |
| `bv_r01_song_lung` | (155,247) → (156,204) → (167,166) → (166,113) → (171,69) → (168,9) | 3–4 | trục kiểm lâm→trạm; cảnh báo tăng độ nguy hiểm |
| `bv_r02_duong_mo` | (9,136) → (70,137) → (120,143) → (167,146) | 3 | kết nối Mỏ lộ thiên |
| `bv_r03_cua_ham` | (9,213) → (63,207) → (104,188) → (158,185) | 2–3 | cửa hầm từ Mỏ ngầm (khóa) |
| `bv_r04_suoi` | (165,146) → (205,132) → (245,119) → (273,93) | 2–3 | bãi thác, cầu gỗ |
| `bv_r05_vong_kham_pha` | (171,146) → (210,186) → (260,207) → (258,155) → (218,116) → (171,146) | 2–3 | vòng thưa, tránh trục chính |
| `bv_r06_vach_nui` | (160,115) → (111,87) → (86,46) → (131,38) → (170,72) | 2 | vòng khó, Khỉ Vách Đá |

- Luôn có **đường rút ngắn** từ giao tranh về trục chính; player thấy trạm Nam qua signage/marker (không cần lạc rừng 20 phút).
- Vách/nước là blocker. Các lối dốc/đá bậc thật sự có nav link, không “nhảy” đường nhìn 3/4 thành đi xuyên vực.
- Chặng sát Thiên Mạch có chốt trước ngưỡng khó, **không đặt boss trên đường trục**.

## C. Bốn đầu chuyển vùng

| Link | Trigger | Đích |
| --- | --- | --- |
| `ln_vanh_rung` | (155,247) S | Vành Đai (156,8) |
| `ln_mo_rung` | (9,136) W | Mỏ lộ thiên (110,9) |
| `ln_ngam_rung` | (9,213) W | Mỏ ngầm **B2** (183,41), khóa giai đoạn đầu |
| `ln_rung_tram` | (168,9) N | Trạm Thiên Mạch (78,119), cần điều kiện PvE |

**Spawn/checkpoint:** (155,236) kiểm lâm; (56,135) trạm khảo sát sườn mỏ; (164,68) lán tạm trước Thiên Mạch khi mở; (37,209) trước cửa hầm khi mở. Arrival cách quái/giếng/lối suối nguy hiểm đủ vùng đệm (mốc thử ≥8–12 ô). Người chơi không bị ép đi qua boss để rời Ba Vì.

## D. Layer chuyên cho rừng và đá

| Layer | Nội dung |
| --- | --- |
| `L00/01` | đất ẩm rêu, cỏ xanh sâu, đường đất/mòn, đá núi nhiều cấp, rãnh suối, bậc núi cũ |
| `L02/03` | suối nhanh, thác bọt trắng, ao trũng, bờ đá ướt, cầu gỗ riêng |
| `L04` | thảo dược, cỏ bị dẫm, nấm/đá phát sáng có state, cây rụng gãy/thân cây di chuyển được khi có gameplay |
| `L10` | cây bàng/rừng, dương xỉ khổng lồ, rễ, đá tảng, cột kiểm lâm, bảng cảnh báo, NPC và dị thú |
| `L11` | tán cây nhiều lớp **cutaway** khi che nhân vật, bụi cao che 1 phần để tạo cảm giác rừng nhưng không giấu tấn công |
| `L20/21` | gió lá, sương thấp, đom đóm/nấm sáng, vùng “trời linh”, đèn chốt vàng ấm; linh năng ngọc lam mức 2 chỉ ở điểm đáng chú ý |
| `DATA` | safe arrival/mask, wood bridge nav/collision, climbable ramp vs cliff, spawn territories, loot nodes, weather, 4 portals |

## E. NPC, sinh thái động vật và quái

| NPC | Lịch/vị trí | Vai trò |
| --- | --- | --- |
| `npc_bv_kiem_lam_trung` (đề xuất) | chốt Nam (155,231), 06–20h | kiểm lâm, cứu hộ/hồi checkpoint |
| `npc_bv_nguoi_dan_duong_van` (đề xuất) | lán ngã ba (174,151), ca ngày | hướng dẫn đường, tình hình quái |
| `npc_luc_vi` (canon) | **chỉ khi lịch di chuyển từ Vành Đai sang**, ở trạm/đường mòn | hướng dẫn khảo sát |
| `npc_tong_duc` (canon) | đợt khảo sát hiếm, ở lán (165,156) | lấy mẫu linh phổ; không nhân đôi với Viện |
| 1–3 NPC nền | chốt/lán, **không đi vào rừng sâu đơn lẻ** | ambience/tuần tra ngắn |

| Sinh cảnh spawn (ô) | Dị thú | AI/độ nguy hiểm | Cap gợi ý |
| --- | --- | --- | ---: |
| `bv_spawn_boar_edge` x=189–277,y=188–231 | **Lợn Gai Sơn** (canon) | tìm thức ăn rìa rừng, báo húc | 2–4 |
| `bv_spawn_monkey` x=55–129,y=33–115 | **Khỉ Vách Đá** (canon) | nhảy trên đá đã đánh dấu, đánh rồi rút, không xuyên vách | 3–5 |
| `bv_spawn_snake` x=219–300,y=42–137 | **Rắn Sương** (canon) | ẩn gần sương/suối, hiện telegraph rõ khi đánh | 2–4 |
| `bv_spawn_spider` x=28–94,y=161–194 | **Nhện Tơ Điện** (canon) | mạng gần cột/rễ, không sát cửa hầm | 1–2 |

Quái nhỏ/vừa cùng quần thể với hành vi ăn/ngủ/patrol, không đứng thành hàng lộ liễu. **Leash** ngăn chúng đuổi vào kiểm lâm, cổng mỏ/hầm và trạm; thảm thực vật phải có khoảng trống cho 4 hướng đánh/né. Không spawm quái trong đường vào Ba Vì rồi phục kích player ngay frame đầu.

## F. Thu thập và trải nghiệm

- `bv_herb_01..08`: dược liệu dưới tán/mép suối ngoài collider; `bv_ore_01..04`: đá linh tại vách an toàn có điểm đứng; `bv_scan_01..03`: cảm biến hỏng (lore) chỉ là tương tác/khám phá, chưa bắt làm quest.
- `bv_rest_01..03`: lán trú/ghế kiểm lâm; `bv_meditate_01`: bãi đá yên gần chốt, **không đặt avatar autonomous trong lãnh địa quái**.
- Đến điểm Rắn Sương luôn có dấu môi trường (sương đặc, tiếng rít, vệt da, đom đóm tắt bớt); không spawn quái “tàng hình hoàn toàn”.
- Khi mưa có đất ướt/âm suối lớn; khi đêm linh năng rõ hơn nhưng đường trở về vẫn có landmark/đèn. Không dùng quá nhiều bóng/cây tối để che gameplay.

## G. Checklist sản xuất/QA

Dựng đầu tiên **trục Nam–Bắc + 2 cửa Tây + một cầu suối** trên nền sạch, đo width và collision. Tiếp theo đặt trạm kiểm lâm, rừng thưa, một sinh cảnh Lợn Gai Sơn; thêm loop và loài khác theo từng sector. Chỉ sau đó hoàn thiện cửa Thiên Mạch/điều kiện vào.
**Pass:** từ 3 đường ngoài vào tới chốt được; rừng có ít nhất 2 vòng đi; cầu không rơi, NPC/monster không xuyên vách/cây; quái không tới arrival; cổng Thiên Mạch có cảnh báo/khóa thật; rời rừng về Vành Đai và Mỏ mọi lúc hợp lệ.

