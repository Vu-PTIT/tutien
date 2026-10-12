# 04 — Vành Đai Tây | `m_vanh_dai_tay`

**Loại:** vùng chuyển tiếp **an toàn có kiểm soát → PvE cấp thấp**, ID canon · 288×224 ô (9216×7168 px).
**Bản sắc:** phía Tây Hà Nội sau Linh Chấn: đường bê tông đứt, ruộng ven đô, khu công nghiệp mái tôn, trạm biến áp, rào kiểm soát. Vẫn có tuần tra/công nghệ, không phải vùng đất hoang fantasy. **Con đường công cộng phải an toàn tương đối; quái ở vùng ngoài rào/đồng hoang.**

## A. Mặt bằng và nhịp nguy hiểm

```text
 BẮC     ▲ ln_vanh_rung (RỪNG BA VÌ)
┌────────────────────┬──────────────────────┬──────────────────────┐
│ Xưởng bỏ/ đường    │ TRẠM KIỂM LÂM        │ Ruộng & biến điện    │
│ tới MỎ ←           │ lối vào rừng         │ khu cảm biến         │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Bãi tập Lợn Gai    │ CHỐT TUẦN TRA,        │ ĐƯỜNG VÀNH ĐAI      │
│ Sơn, bãi xe hỏng   │ lán chữa trị/đồ      │ → CỔNG THĂNG LONG   │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Mương / Nhện Tơ    │ ĐƯỜNG ĐÊ LÀNG ▼       │ Ruộng xen kho/xe    │
│ Điện, bờ cây       │ ln_lang_vanh         │ tuần tra            │
└────────────────────┴──────────────────────┴──────────────────────┘
 NAM
```

| Sector (x,y ô) | Chủ đề | Gameplay | Mức rủi ro |
| --- | --- | --- | --- |
| `VD01_NHA_XUONG` 12–111,12–90 | xưởng có mái sập, container, đường mỏ | vật liệu cũ, lối `ln_vanh_mo` | trung bình, chỉ trong rào |
| `VD02_KIEM_LAM` 110–195,8–88 | cửa rừng, tháp cảnh báo | checkpoint, `ln_vanh_rung` | safe tại chốt |
| `VD03_RUONG_DIEN` 196–279,9–88 | ruộng, trạm điện, tháp cảm biến | thu thập/anomaly môi trường | thấp→trung bình |
| `VD04_TAP_SU` 12–123,88–160 | sân bê tông, bãi cỏ, xe tải rỉ | tutorial hành vi Lợn Gai Sơn | thấp ngoài đường |
| `VD05_TRANH_CHAP` 118–219,83–178 | căn cứ tuần tra, biển y tế, radio | service NPC, chỗ hồi phục | **safe** |
| `VD06_TRUC_DONG` 219–287,83–170 | đường lớn vào thành phố | portal Thăng Long | safe corridor |
| `VD07_KENH_HOANG` 10–114,162–218 | mương cũ, cây, cột điện đổ | Nhện Tơ Điện, node salvage | thấp→trung bình |
| `VD08_DUONG_DE` 118–210,173–223 | đường đê, chòi, quán cứu hộ | portal Làng, điểm tránh | safe corridor |

**Vùng an toàn mặt bằng:** hành lang đường chính rộng ≥4 ô + buffer 5–8 ô dọc `vd_r01/02/03/04`, căn cứ giữa; combat spawn tuyệt đối **không** vào buffer hay điểm đến. Cảnh báo có rào, đèn nhấp nháy, dấu cào và tiếng radio trước khi người chơi rẽ sang bãi quái.

## B. Đường và lối ra

| Route | Đường tâm (ô) | Rộng | Chức năng |
| --- | --- | --- | --- |
| `vd_r01_tay_dong` | (9,55) → (76,76) → (145,121) → (213,113) → (279,109) | 4–6 | **xương sống** mỏ ↔ chốt ↔ thành phố |
| `vd_r02_bac` | (145,121) → (153,73) → (156,8) | 3–4 | chốt ↔ rừng |
| `vd_r03_nam` | (145,121) → (144,170) → (143,215) | 3–4 | chốt ↔ làng |
| `vd_r04_vong_tram` | (140,120) → (206,138) → (191,166) → (132,159) → (140,120) | 3 | vòng tuần tra không quái |
| `vd_r05_bai_quai` | (114,133) → (83,124) → (57,108) → (112,101) | 2–3 | nhánh chiến đấu có biển |
| `vd_r06_muong` | (130,155) → (88,179) → (56,201) | 2 | lối salvage, không chặn đường làng |

| Link | Trigger | Đích | Đặc điểm |
| --- | --- | --- | --- |
| `ln_vanh_mo` | (9,55) W | Mỏ lộ thiên (215,154) | xe vận tải, vệt bánh |
| `ln_vanh_rung` | (156,8) N | Rừng (155,247) | có bảng kiểm lâm |
| `ln_vanh_thang` | (279,109) E | Thành phố (10,100) | cổng đô thị |
| `ln_lang_vanh` | (143,215) S | Làng (147,8) | đường đê trở về |

**Checkpoint/spawn:** (154,132) trạm tuần tra; (157,16) kiểm lâm; (144,204) chòi đê. Đích từ 4 portal nhận avatar ở khoảng cách 3–6 ô trong vùng walkable, ngoài aggro. Không để barrier tạo hình chữ nhật bao cả map.

## C. Các lớp

- `L00/01`: bê tông nứt/đường mốc, bãi cỏ xù, nền xưởng/ruộng, mương, gờ bê tông, rào đổ. Đường có vạch cảnh báo, đoạn xe chạy vẫn phân biệt được khỏi bãi quái.
- `L02/03`: mương cũ/cống tràn riêng, bờ lầy có collider; cầu nhỏ có lối lên rõ. Cỏ thấp che mép nước không làm mất tín hiệu nguy hiểm.
- `L04`: vật liệu salvage theo state, cảm biến bật/tắt, container mở/đóng; node tái tạo có cooldown authoritative.
- `L10`: barrier, xe tải bỏ dở, container, trạm biến áp, mái tôn, cây bàng vỡ tán, NPC tuần tra, dị thú. Collider nhà/xe đặt dưới chân, không rộng theo shadow.
- `L11`: mái trạm và tán cây fade khi người qua; dây điện có vị trí ưu tiên tránh che HUD.
- `L20/21`: bụi gió, cỏ phản ứng, đèn tháp cảm biến, màn trời linh hiếm, sương nhẹ ở mương, radio. Linh năng mức 1.

## D. NPC và luồng người

| ID | Vị trí/ca | Hành vi |
| --- | --- | --- |
| `npc_ky_su_nghiem` (canon) | trạm cảm biến (183,92), 07–17h; ngày kiểm tra ngoài trạm | nói về cảnh báo giả, thiết bị, lộ trình |
| `npc_luc_vi` (canon) | cửa rừng/trạm (153,66) luân phiên ca | hướng dẫn chặng khám phá/đọc dấu quái |
| `npc_vd_chi_huyen` (đề xuất) | chỉ huy chốt (170,127), thường trực theo ca | cứu hộ, quy tắc an toàn |
| `npc_vd_tho_dien_tuan` (đề xuất) | trạm biến áp (231,67), ngày | sửa cảm biến, thu thập dữ liệu |
| `npc_vd_y_ta_mai` (đề xuất) | y tế dã chiến (166,140), ca luân phiên | hồi phục/checkpoint |

NPC tuần tra 2–4 người đi loop `vd_r04` hoặc một đoạn đường cao tốc; có ca sáng/tối, giới hạn số NPC trong camera 5–9. Xe tuần tra là ambience hoặc transport script dọc lane riêng, không xuyên player. Khi báo động, lính đứng chốt, không auto chạy đuổi quái ra cả làng.

## E. Sinh cảnh, quái và encounter

| Spawn region | Loài | Hành vi | Cap gợi ý/sector |
| --- | --- | --- | ---: |
| `vd_spawn_boar` x=28–112,y=95–151 | **Lợn Gai Sơn** (canon) | ủi đất theo nhóm nhỏ, nhìn trước khi húc; bị đánh rút trong leash | 3–5 |
| `vd_spawn_spider` x=17–92,y=173–209 | **Nhện Tơ Điện** (canon) | giăng mạng giữa cột/cây, telegraph ngọc lam | 2–4 |
| `vd_spawn_stray` x=218–260,y=32–75 | **Chó Đê Nhiễu** (**đề xuất**) | né tuyến người, theo bầy 2–3, cảnh báo trước | 2–3 |

- Mỗi region spawn chỉ ngoài `safe_mask`, cách cổng/chốt ít nhất 8–12 ô (sẽ đo bằng AI/navigation); **leash không vượt rào/chốt**; aggro về quê/thành phố bị chặn bởi mask, không bằng điều kiện hình ảnh.
- Quái tuần tra trong lãnh địa, không respawn sát camera hoặc trước mặt người; thời gian/giới hạn respawn do hệ PvE, không đặt tỷ lệ drop tại đây.
- Loot định hướng: da/gai, tơ và linh năng vết; thực tế dùng item ID từ economy/balance hiện hữu sau khi mapping. Có chỗ lùi/né, không khóa lối lui.
- PvE là nhánh tự chọn; người đi giữa các map theo trục chính **không phải giết quái mới qua được**.

## F. Activity và triển khai

- `vd_patrol_training_01`: đứng quan sát cảm biến (không loot tự động); `vd_rest_01..03` ở lán tuần tra; `vd_salvage_01..04` ở đống vật liệu **ngoài vùng aggro thấp**, có hạn mức; `vd_scan_01..03` điểm quét linh phổ (tương tác).
- Cảnh báo trước rẽ PvE: biển tiếng Việt, cột đèn vàng, icon quái trên minimap sau khi khám phá. Mưa làm đường ướt/âm thanh thay đổi, không sinh cảm giác vùng trung tâm bị bỏ hoang hoàn toàn.
- Dựng **xương sống 4 lối** bằng đất/đường/cổng trước; đặt collision và nav đến cả 4 cổng; sau đó dựng safe chốt và **một bãi Lợn Gai Sơn** có 1 encounter test; rồi mới mở rộng Nhện, mương, ambient.
- **Pass:** đường làng → rừng/mỏ/thành phố không cắt bãi quái, đường truy đuổi không vượt safe corridor, y-sort container/cây đúng, 4 link hai chiều.

