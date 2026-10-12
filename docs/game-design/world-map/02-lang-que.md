# 02 — Map Làng quê | `m_lang_que`

**Loại:** làng ngoại ô miền Bắc, vùng **an toàn** · **mới đề xuất** · 256×192 ô quy hoạch (8192×6144 px).
**Vai trò trải nghiệm:** nhà, vườn, ruộng lúa, hồ câu, chợ quê và cộng đồng; nơi người chơi thấy avatar bạn bè đang làm việc đời thường. **Không** phải làng cổ tông môn; có nhà mái ngói lẫn mái tôn, xe máy, cột điện và trạm bơm hiện đại. Việt Nam sau Linh Chấn vẫn có công nghệ.
**Xem:** [00 — portal chuẩn](00-world-topology-and-routes.md), [01 — layer](01-layer-contract-and-runtime.md), [10 — NPC/AI](10-npc-ai-monsters-and-activities.md).

**Runtime v1 — 12/10/2026:** map ngoại thất đầu tiên đã được dựng tại `client/scenes/m_lang_que.tscn` và là scene mặc định F5. Có tám khu theo hồ sơ, art nhà/vật thể riêng, NPC, 12 luống, 4 slot thả câu, va chạm/navigation và hai cổng tới preview khu kế bên. [Hướng dẫn và phạm vi thực tế](../../../client/LANG_QUE_PLAYABLE.md); phần dịch vụ/kinh tế online, nội thất và AI đầy đủ bên dưới vẫn là thiết kế cho các pass sau.

## A. Lược đồ bố cục (Bắc ở trên)

```text
  TÂY                         BẮC                            ĐÔNG
┌─────────────────┬─────────────────────┬─────────────────────┐
│ Ruộng/bờ cỏ     │ ĐÊ / CỔNG VÀNH ĐAI  │ Xóm mới, nhà kính   │
│ kênh thủy lợi   │ ▲ ln_lang_vanh      │ trạm bơm            │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Nhà vườn, sân   │ SÂN ĐÌNH / CHỢ QUÊ  │ Phố nhỏ, CẦU ĐƯỜNG  │
│ phơi, lối xóm   │ cây đa, quầy hàng   │ → ln_lang_thang     │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Vườn người chơi │ Bến hồ câu + hàng  │ Ruộng bãi ven sông  │
│ ruộng sau nhà   │ liễu + cầu gỗ       │ công viên nhỏ       │
└─────────────────┴─────────────────────┴─────────────────────┘
  NAM
```

| Sector (mặt bằng ô x,y) | Địa hình và dấu mốc | Hoạt động | Ràng buộc |
| --- | --- | --- | --- |
| `LQ01_DONG_RUONG` x=12–95,y=18–83 | ruộng bậc thấp, đường bờ, mương nhỏ, bù nhìn, trạm bơm | ngắm, thu cây hoang hợp lệ | ruộng lúa nền **không** phải ô sở hữu người chơi |
| `LQ02_DE_TRAM` x=105–183,y=6–73 | đê đất nén, hàng tre, trạm gác, cống nước | đi sang Vành Đai, ngắm cảnh | cổng bắc phải có đường rộng và cảnh báo |
| `LQ03_XOM_MOI` x=186–245,y=13–86 | nhà mái tôn, khu nhà kính, xe máy, cột cảm biến | NPC làm việc, nghề thủ công | không biến thành phố cổ |
| `LQ04_NHA_VUON` x=12–99,y=90–174 | nhà vườn, giếng, sân gạch, khu phơi | nhà cá nhân/thăm bạn | lối vào nhà tách exterior/interior |
| `LQ05_CHINH` x=99–191,y=74–141 | sân đình cộng đồng, gốc bàng, chợ, ghế nhựa | chat, chợ, điểm hẹn | không chặn trục đi lại |
| `LQ06_CAU_PHO` x=191–255,y=86–138 | lối cầu bê tông nhỏ/đường nhựa ven làng | sang Thăng Long | đường nối ra map, không cắt bởi mặt nước |
| `LQ07_VUON` x=25–111,y=137–186 | luống vườn/đất trồng, nhà kho, vòi nước | trồng và thu hoạch | lưới canh tác **logic ẩn**, sprite cây riêng |
| `LQ08_HO_CAU` x=118–216,y=138–188 | hồ tự nhiên + bến câu + quán nước mái tôn | câu cá, ngồi, thiền | nước collider riêng, hai mép cầu an toàn |

**Tỷ lệ mặt bằng mục tiêu:** 60–70% đất/sân/đường/hồ đọc được tại camera ×2; mật độ props dày nhất quanh chợ, thấp ở đồng và hồ. Bờ ruộng, ao, mương có hình dạng cong tự nhiên; không tạo hồ hình chữ nhật/ô vuông.

## B. Lối chính, đường vòng và cầu

| Route | Tọa độ đường tâm đề xuất (ô) | Rộng | Dẫn tới |
| --- | --- | --- | --- |
| `lq_r01_pho_cho` | (249,105) → (211,104) → (176,108) → (148,108) → (103,111) | 4 ô | thành phố → chợ → xóm |
| `lq_r02_de` | (148,108) → (147,71) → (147,38) → (147,8) | 3 ô | chợ → đê → Vành Đai |
| `lq_r03_vuon` | (145,116) → (107,135) → (72,157) → (51,168) | 2–3 ô | chợ → vườn/nhà |
| `lq_r04_ben_ho` | (158,118) → (175,142) → (177,158) | 2–3 ô | chợ → câu cá |
| `lq_r05_vong_nho` | (152,109) → (206,119) → (210,144) → (177,154) → (131,129) → (152,109) | 2–3 ô | vòng đi bộ qua chợ–hồ |
| `lq_r06_dong` | (119,104) → (76,78) → (49,55) | 2 ô | nhánh ruộng, không ảnh hưởng cổng |

- Mương chạy ven rìa ruộng; sông nhỏ uốn ở **phía nam** hồ, không chắn đường cấp A. Có **một cầu gỗ** gần (112,153) cho tuyến vườn–hồ và **cầu bê tông** ở phía Đông cho xe máy; từng cầu có lối lên, nav passable, rào chống rơi, ảnh phản chiếu/occlusion riêng.
- Ngã ba cần mở rộng 1–2 ô để NPC và avatar không nghẽn. Bậc đê có đường dốc thay vì bắt người chơi nhảy qua collider.

## C. Cửa ra, điểm vào và checkpoint

| Link (tọa độ trigger) | Đường dẫn trong cảnh | Đích | Hành vi |
| --- | --- | --- | --- |
| `ln_lang_thang` (249,105), hướng E | trục phố làng `lq_r01`, có biển “Thăng Long” | Thăng Long (10,176) | mở sẵn, hai chiều |
| `ln_lang_vanh` (147,8), hướng N | đường đê `lq_r02`, chốt cảnh báo | Vành Đai (143,215) | mở sẵn, cảnh báo dị thú |

**Spawn bắt đầu làng:** (149,111) sân chợ, không trùng NPC. **Checkpoint:** (143,119) đình/chợ; (174,156) bến câu cho activity; (147,14) đê cho chuyến đi rừng. Arrival anchor cách trigger ≥3 ô. Người đến từ Vành Đai phải có hướng đi rõ về chợ và về thành phố, không bị respawn sát bờ nước.

## D. Layer-by-layer: cụ thể phải vẽ gì?

| Lớp | Tài nguyên/tình trạng |
| --- | --- |
| `L00_ground` | đồng lúa không ô vuông, đất ẩm, sân nhà, bờ ruộng, sân đình; không có cây trồng sở hữu dính nền |
| `L01_landforms_roads` | đường đất lớn/nhỏ, dốc đê, bờ hồ, mép mương; texture lặp kín không kéo giãn |
| `L02_water` | hồ câu hình cong, rãnh mương, đoạn sông nam, shader gợn/bọt theo vùng |
| `L03_shore_low` | cỏ lau thấp, bùn/sỏi, vỏ trấu, vệt bánh xe; không che chân avatar |
| `L04_dynamic_ground` | luống trồng cá nhân, đất mới tưới, dấu chân mưa, cống đóng/mở có state |
| `L10_ysort_world` | cây đa/bàng, bụi tre, nhà mái tôn/mái ngói, cột điện, trạm bơm, xe đạp, ghế, bàn, NPC/avatars |
| `L11_foreground_cutaway` | tán đa/tre, mái hiên và dây điện; fade nếu che người |
| `L20–21_fx_light` | lúa/tre rung lệch pha, đom đóm ban tối, khói bếp, nắng chiều vàng, mưa phùn |
| `DATA` | collider hồ/mương/nhà, 2 portals, nav ruộng (chỉ bờ đi), ownership plots, slot câu/ngồi/thiền, vùng safe |

## E. NPC và nhịp sống (NPC mới **đề xuất**)

| ID | Vai trò/điểm gốc | Lịch giờ game gợi ý | Tương tác |
| --- | --- | --- | --- |
| `npc_lq_bac_minh` | bán hạt ở chợ (153,104) | 06:00–17:00 chợ, 17:00–21:00 nhà | shop hạt giống, lời nhắc mùa |
| `npc_lq_co_hanh` | giáo viên, nhà sinh hoạt (208,69) | 07:00–16:00 lớp cộng đồng, tối ở quán | đối thoại, lore đời thường |
| `npc_lq_chu_tam` | giữ bến (174,156) | 05:00–10:00 chuẩn bị bến, 15:00–20:00 giúp câu | hướng dẫn slot câu |
| `npc_lq_ong_bay` | trông trạm bơm/đê (145,37) | ngày: trạm, tối: gác đê | cảnh báo vành đai/mưa |
| `npc_lq_tho_moc_hoa` | thợ sửa/nhà kho (73,125) | 08:00–17:00 xưởng; tối: chợ | sửa dụng cụ/đồ trang trí (phần sau) |
| `npc_ha_to` (canon) | thương lái ghé chợ phiên | lịch liên map do server quản lý, **không xuất hiện đồng thời ở thành phố/cảng** | mua/bán, logistics |

**NPC nền:** thử 10–18 người trong toàn map, chỉ 6–10 hiện quanh camera; người tưới cây, đi chợ, câu, đạp xe, trẻ đi học. AI chạy vòng ngắn; không đi xuyên vườn cá nhân hay ngồi đè slot avatar. Ban đêm giảm người nhưng vẫn có đèn quán. Mỗi NPC gồm idle, đi 4 hướng, hoạt động nghề, nhìn người/chào; service NPC có fallback điểm đứng khi quầy tạm đóng.

## F. Sinh hoạt và vật thể tương tác

- **Câu nước ngọt:** `lq_fish_01..04` dọc mép hồ (172,158),(179,159),(184,153),(165,150); đứng ở bến/đất hợp lệ, hướng mặt nước, phao nằm trong mask nước.
- **Vườn:** `lq_plot_01..12` gần (61–87,154–177); plot có owner/lease và cây riêng; 6 ô MVP cho 1 người có thể là một instance sân vườn hoặc luống phân quyền, không tranh slot vô hạn trên world chung.
- **Nghỉ/ngồi:** `lq_sit_01..06` ở đình/chợ, `lq_meditate_01..02` ven hồ sáng sớm. Trò chuyện/biểu cảm không cấp XP đánh quái.
- **Tương tác:** cổng nhà mở/đóng, quầy shop theo giờ, trạm bơm, ghế ngồi/đứng, biển chỉ đường, bảng tin dự báo “trời linh”, vòi nước, thu hoạch server-authoritative.
- **Interior:** nhà người chơi và một phòng sinh hoạt là scene/instance riêng; từ cửa có `entry_anchor`, nhấn F/touch, không vẽ toàn nội thất vào ground ngoài trời.
- Vùng canh tác cần phân quyền server; di chuyển avatar tự động tới plot/slot an toàn không yêu cầu chủ nhân online.

## G. Quái và ranh giới an toàn

**Không spawn quái thù địch trong map này.** Có gà, trâu, cá thường, chim làm ambience; không drop PvE, không gây sát thương. Linh năng mức 0 ở dược liệu/trạm cảm biến, không biến mọi con gà thành dị thú. Đi Vành Đai mới gặp quái có cảnh báo, bảo đảm người chơi thích sinh hoạt không bị ép đánh.

## H. Art, âm thanh, thời tiết, ưu tiên dựng

- Palette vàng lúa, xanh non, đất ẩm, mái tôn hơi gỉ; 3 dấu hiệu Việt Nam bắt buộc: cột điện/xe máy, trạm bơm, biển chữ Việt có dấu. Pixel 32, nhà mặt đứng nén, mái nhìn thấy từ trên.
- Âm: chim/gà, tiếng bơm nước, tiếng người bán, tiếng nước hồ. Gió tác động luống lúa theo vùng, không script trên từng cây.
- **Làm theo thứ tự:** địa hình sạch → đường A/B + nước/cầu → portal A↔B + nav → nhà/cây/prop riêng → bến/vườn/slots → NPC → thời tiết/FX → kiểm tra mobile.
- **Pass riêng:** từ (249,105) sang (147,8) mà không xuống nước; một vòng `lq_r05` đủ rộng; ngồi/câu/thu hoạch không xuyên collider; người mới nhìn ảnh nhận ra làng Việt **hiện đại**.

