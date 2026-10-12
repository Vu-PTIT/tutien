# 03 — Thành phố Căn cứ Thăng Long | `m_thang_long`

**Loại:** hub đô thị chính, **an toàn** · **giữ ID canon** · 320×256 ô (10240×8192 px).
**Không khí:** “trong ngõ thì ấm”; Hà Nội hiện đại sáu năm sau Linh Chấn, không phải thành cổ hay cung điện. Thành phố **sống được**: học, làm, đi chợ, quán trà đá, gặp bạn, vườn mái nhà, câu hồ, thiền. Art test đầu tiên theo [12 — Art Bible](../12-art-bible.md) vẫn là **một ngõ + bờ hồ** ở vùng này.

## A. Bố cục và cảnh quan

```text
  BẮC
┌─────────────────────┬─────────────────────┬──────────────────────┐
│ Chung cư cũ, cổng   │ VIỆN LINH HỌC +     │ Ga xe / phố thương  │
│ VÀNH ĐAI ←          │ trường, thư viện    │ mại → tuyến CẢNG    │
├─────────────────────┼─────────────────────┼──────────────────────┤
│ Ngõ nhà ống,        │ CHỢ / QUẢNG TRƯỜNG  │ Văn phòng, xưởng,   │
│ quán trà, sân       │ hàng rong, bảng tin │ trung tâm dịch vụ   │
├─────────────────────┼─────────────────────┼──────────────────────┤
│ ← CỔNG LÀNG,        │ HỒ CÂU, công viên   │ Khu nhà/vườn mái,   │
│ nhà dân             │ ghế đá, đường dạo  │ sân sinh hoạt       │
└─────────────────────┴─────────────────────┴──────────────────────┘
  NAM
```

| Sector (x,y ô) | Landmark | Nội dung chơi | Nguy cơ |
| --- | --- | --- | --- |
| `TL01_PHO_CU` x=12–105,y=16–111 | chung cư cũ, xe máy, cổng Tây | đường vào Vành Đai, quán ăn | safe |
| `TL02_VIEN_TRUONG` x=106–230,y=12–94 | Viện Linh học, trường, thư viện | đối thoại Tống Đức, học/thiền | safe |
| `TL03_GA_DONG` x=231–319,y=18–104 | bến xe liên vùng, kho chuyển phát, biển cảng | phương tiện tới Cảng | safe |
| `TL04_NGO_NHA` x=12–107,y=113–210 | ngõ và nhà ống, cửa cuốn, quán trà đá | gặp bạn, nhà, social, lối về Làng | safe |
| `TL05_CHO_TRUNG_TAM` x=100–238,y=89–190 | chợ đầu mối, quảng trường, cây bàng, bảng cảnh báo | mua bán, hội nhóm, điểm spawn | safe |
| `TL06_DICH_VU` x=236–316,y=108–222 | xưởng Đỗ Khê, văn phòng, phòng khám, kho | chế tạo, chữa trị, trực ca | safe |
| `TL07_HO_CONG_VIEN` x=52–156,y=182–248 | bờ hồ, ghế đá, cầu thấp, sân thiền | câu cá, tản bộ, thiền | safe |
| `TL08_NHA_VUON_MAI` x=154–251,y=191–250 | nhà người chơi, mái trồng dược liệu | garden, decor, ghé thăm | safe |

**Định vị art:** đường/cây/sân/mặt nước ≥55% diện tích khung gameplay mặc định; nhà ống 2–5 tầng nhưng nhìn game chủ yếu **mái + ~một tầng mặt tiền nén** (mái có bồn inox, chậu cây, giàn phơi), không xây mặt dựng che 70% màn hình. Tán cây và mái che người phải fade.

## B. Các trục đường có điểm đích rõ

| Route | Đường tâm gợi ý (ô) | Rộng | Công năng |
| --- | --- | --- | --- |
| `tl_r01_tay_trung_tam` | (10,100) → (72,100) → (156,126) | 5–6 | cửa Vành Đai → trung tâm |
| `tl_r02_lang_ngo` | (10,176) → (76,175) → (137,156) | 4 | cổng Làng → khu nhà, chợ |
| `tl_r03_tram_xe` | (156,126) → (235,117) → (275,101) → (311,93) | 5 | trục đông đến Cảng |
| `tl_r04_vien` | (157,126) → (165,70) → (163,29) | 4 | chợ → thư viện/Viện |
| `tl_r05_ho` | (145,158) → (123,194) → (106,220) | 3 | chợ → hồ/sân thiền |
| `tl_r06_vong_dao` | (144,125) → (230,129) → (244,192) → (160,214) → (110,179) → (144,125) | 3–4 | vòng đi dạo/quảng trường |
| `tl_r07_nha` | (179,199) → (215,214) → (230,181) | 2–3 | sân nhà, mái vườn và ngõ phụ |

- Phân luồng **đường xe** và vỉa hè; xe/xe máy là ambience có hành lang riêng, không tông vào avatar. Vỉa hè ưu tiên người đi bộ; nơi sang đường có vạch qua đường và đoạn nav rộng.
- Hồ chỉ ở phần Tây Nam, không cắt trục Tây–Đông. Ngõ hẹp có sân mở để tránh nhau; chợ có quầy ở **rìa**, giữa là lối đi.
- Không để một con đường đi qua công trình chỉ vì polygon chưa có collision; cửa mở/đóng làm thay đổi walkability.

## C. Lối ra và arrival

| Link | Trigger | Điểm nhìn/biển hiệu | Đích |
| --- | --- | --- | --- |
| `ln_vanh_thang` | (10,100), W | chốt thành phố, “Vành Đai Tây” | `m_vanh_dai_tay` (279,109) |
| `ln_lang_thang` | (10,176), W | phố ven đô, “Làng quê” | `m_lang_que` (249,105) |
| `ln_thang_cang` | (311,93), E | **bến xe/tuyến đường Đông Bắc** | `m_cang_dong_bac` (9,115), **transport** |

**Spawn mặc định:** (156,139) quảng trường (ngoài luồng NPC). **Checkpoint:** phòng khám (262,170), quảng trường (155,133), nhà cá nhân (193,218); arrival từ 3 tuyến có anchor sâu trong map ≥3 ô, không ngay trong quầy bán.

## D. Layer theo đặc trưng đô thị

| Lớp | Thành phần |
| --- | --- |
| `L00/01` | nhựa đường, vỉa hè gạch, bê tông xám ấm, sân ngõ, nắp cống, vạch đường, rãnh thoát nước; nền không dính NPC/xe |
| `L02/03` | hồ câu riêng + bờ kè, gợn, rong/đá thấp, miệng cống; bảo vệ bến câu |
| `L04` | vườn dược liệu mái có state, vũng mưa/cửa cuốn đổi state (cửa thực chất prop độc lập) |
| `L10` | nhà ống, cửa hàng, xe máy/xe điện tĩnh, quầy hàng, cây bàng/sấu, cột điện, NPC |
| `L11` | mái bằng, ô văng, dây phơi, tán cây; khi avatar vào sau thì cutaway |
| `L20/21` | biển LED cảnh báo, đèn quán về đêm, điều hòa/bụi, normal map vài cảnh hub; linh năng mức 0 rất tiết chế |
| `DATA` | đường xe vs đi bộ, collision cửa/ghế/xe, POI/shops, clinic spawn, 3 portals, slot câu/vườn/ngồi/làm/học |

## E. NPC chính & hoạt động hằng ngày

| NPC | Lịch/điểm | Vai trò chơi |
| --- | --- | --- |
| `npc_bs_lan` (canon) | phòng khám (268,171), 08–20h; nghỉ nội bộ | hồi phục/hướng dẫn dược liệu |
| `npc_do_khe` (canon) | xưởng (267,143), 08–18h; tối ghé quán | craft/trang bị |
| `npc_tong_duc` (canon) | Viện (181,58), đa số ngày; ngày khảo sát chuyển lịch qua Ba Vì | thiết bị, dữ liệu linh phổ |
| `npc_ha_to` (canon) | kho giao nhận (270,76), xen ngày ở Làng/Cảng | hậu cần/thương mại |
| `npc_tl_ba_thuy` (đề xuất) | quán trà đá (79,153), 06–23h | nghỉ/ngồi/chat |
| `npc_tl_anh_duong` (đề xuất) | thư viện (157,62), 07–21h | điểm học/đọc |
| `npc_tl_chu_van` (đề xuất) | bến xe (286,83), ca sáng/chiều | tuyến Cảng/giải thích thời gian di chuyển |

**NPC nền:** 22–36 trên toàn thành phố nhưng chỉ 10–18 trong tầm quan sát (culling theo sector); học sinh, thợ giao hàng, bảo vệ, người tập thể dục bờ hồ, khách chợ, shipper. Mật độ khác theo giờ; sau 23h vắng nhưng còn người phục vụ/cảm biến. NPC đi xe chỉ trong lane, không dùng chung với collider player. Service NPC có anchor trước quầy, không đứng giữa đường chính.

## F. Chỗ người chơi thật sự sử dụng

- **Bờ hồ:** `tl_fish_01..04` (97,223),(107,225),(115,227),(124,218); slot chỉ ở bờ walkable, cần facing nước.
- **Vườn mái:** `tl_roof_plot_01..06` trên sân mái của khu nhà cá nhân (trong instance/scene có quyền), người trên đường **không tự leo lên mái**; qua cửa/cầu thang riêng.
- **Ghế/quán:** `tl_sit_01..08` gần ngõ và quảng trường; 2–4 ghế cùng nhóm chat bạn bè, avatar tự hoạt động có nhãn trạng thái.
- **Học/làm:** `tl_read_01..06` tại thư viện, `tl_work_01..04` trong xưởng/văn phòng; **avatar activity** có thể độc lập với lịch học/làm thật.
- **Thiền:** `tl_meditate_01..02` tại sân chùa/phòng yên tĩnh (hiện đại, nhỏ), không bắt nhân vật đổi sang cổ phục.
- **Shop/thiết bị:** quầy hạt/cá/vật liệu, tủ cứu thương, máy quét linh phổ, bảng tin; chỗ nào chưa có backend phải đánh nhãn prototype, không UI giả rơi thưởng.
- **Interiors:** nhà cá nhân, phòng khám, cửa hàng, thư viện, xưởng; cửa có sprite open/closed, collision, interior entrance ID. Scene riêng để không phóng to map exterior vô hạn.
- **Social:** avatar bạn bè có thể hiện ở vị trí tương ứng nếu cho phép chia sẻ; không suy luận từ thẻ “đang học ngoài đời” ra vị trí bắt buộc.

## G. Quái, âm thanh, ngày đêm và art pass

**Không quái thù địch.** Chỉ hình nhân tập đánh ở trường huấn luyện (không drop/HP thật của cư dân) và chim/cá ambience. Giữ “khoảng bình yên” rõ trước khi ra Vành Đai.
Âm: còi xe xa, loa phường dự báo linh năng, trà đá, rao hàng, gió cây, tiếng mái mưa. Đêm: ánh đèn ấm + vài điểm linh phổ; UI chữ Be Vietnam Pro, biển hiệu pixel Việt có dấu. Không dùng lantern Trung Hoa/cổng tông môn fantasy.
**Ưu tiên sản xuất:** trước hết làm 20×12 ô **ngõ + bờ hồ** với hai nhà ống, quán, cây, bến câu, garden mái, avatar và ánh sáng ngày–đêm; duyệt nghệ thuật rồi mới mở 8 sector. Dựng các trục portal/nước/camera/nav trước khi thêm số lượng lớn props. **QA:** vòng `tl_r06` liền; đến 3 exits; cửa nhà/tán cây occlusion chuẩn; khi tắt FX vẫn thấy nav.

