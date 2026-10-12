# 06 — Mỏ lộ thiên | `m_mo_lo_thien`

**Loại:** khai khoáng ngoài trời giữa Vành Đai Tây và chân núi Ba Vì, **mới đề xuất** · 224×192 ô (7168×6144 px).
**Cảm giác:** mỏ Việt Nam thời Linh Chấn: tầng khai thác lộ thiên, máy xúc, bãi đá, kho vật tư, tuyến xe tải, trạm an toàn và đá linh biến phát sáng tiết chế. **Khác mỏ ngầm:** ban ngày, không gian mở, đường rộng, hoạt động lao động có tổ chức; bãi quái nằm ở vành moong/khai thác bỏ dở.

## A. Sơ đồ theo chiều cao nhìn 3/4

```text
 BẮC                ▲ ln_mo_rung (đường sườn núi)
┌──────────────────────┬──────────────────────┬───────────────────────┐
│ Đồi đá, cây thưa,    │ ĐƯỜNG NÚI            │ Bãi thử quặng/biển    │
│ bãi quái đá          │ trạm quan sát        │ cảnh báo linh mạch    │
├──────────────────────┼──────────────────────┼───────────────────────┤
│ LÁN MỎ, giếng xuống  │ MOONG KHAI THÁC     │ máy xúc, băng tải,    │
│ MỎ NGẦM ▼            │ nhiều tầng có dốc   │ khu phân loại         │
├──────────────────────┼──────────────────────┼───────────────────────┤
│ bãi đất đá,          │ KHO / CHẠM SỬA      │ ĐƯỜNG VẬN TẢI →      │
│ đường phụ PvE        │ checkpoint          │ ln_vanh_mo           │
└──────────────────────┴──────────────────────┴───────────────────────┘
 NAM
```

| Sector (x,y ô) | Điểm nổi bật | Hoạt động | Nguy cơ |
| --- | --- | --- | --- |
| `ML01_DUONG_NUI` 78–149,8–64 | chòi quan sát, cua tay áo sườn núi | ra Rừng Ba Vì | safe corridor gần cổng |
| `ML02_VACH_DA` 10–83,15–103 | vách tầng, đá lớn, vệt khoáng | mỏ đá phụ/điều tra | PvE thấp–vừa |
| `ML03_LAN_GIENG` 61–116,55–112 | lán mỏ, thang/giếng số 1, máy nâng | xuống Mỏ ngầm | safe ngay miệng giếng |
| `ML04_MOONG` 102–194,61–148 | lòng chảo khai thác, tầng bench, dốc xe | node quặng và tương tác máy | safe ở vòng được cấp phép; rìa nguy hiểm |
| `ML05_XUONG` 125–211,18–95 | băng tải, cân đá, kho dầu | phân loại/chế tạo sau này | safe/workshop |
| `ML06_KHO_CHOT` 108–192,146–187 | kho, lán cứu thương, bãi xe đỗ | checkpoint, NPC | safe |
| `ML07_CUA_DONG` 189–223,137–185 | đường bê tông về Vành Đai | portal liên vùng | safe |
| `ML08_BAI_PVE` 10–75,109–183 | bãi đất đá cũ, vách đá lở | dị thú/thu nhặt mảnh khoáng | PvE tùy chọn |

**Địa hình đứng:** moong có 2–3 **cao trình logic**; mỗi cao trình là vùng đi bộ riêng, kết nối bằng **dốc cua tay áo** đã khai báo. Vách đứng chỉ render + collision che lối, không coi đường nhìn đè lên nhau là một lối đi. Camera 3/4 thẳng, không đổi sang phối cảnh isometric/3D.

## B. Đường và vòng tuần hoàn

| Route | Centerline (ô) | Rộng | Đặc điểm |
| --- | --- | --- | --- |
| `ml_r01_van_tai` | (215,154) → (180,153) → (159,126) → (147,111) → (138,90) | 5–6 | đường chính xe/vật tư |
| `ml_r02_len_nui` | (138,90) → (143,62) → (121,36) → (110,9) | 3 | lên trạm quan sát và rừng |
| `ml_r03_gieng` | (150,117) → (123,101) → (85,80) | 3 | đường an toàn tới thang mỏ |
| `ml_r04_moong_loop` | (139,92) → (175,102) → (173,139) → (122,141) → (104,107) → (139,92) | 3–5 | vòng moong, tránh góc chết |
| `ml_r05_mo_phu` | (105,123) → (71,138) → (45,159) | 2–3 | lối đá cũ, vào PvE |
| `ml_r06_kho` | (177,153) → (156,173) → (123,174) | 3–4 | đến kho/lán y tế |

- Xe tải chạy trong lane riêng chỉ là ambience/proc job, **không đè hitbox avatar**. Trên dốc đặt taluy, lan can và vệt bánh rõ.
- Đường `ml_r04` có ít nhất 2 lối rẽ quay về `ml_r01`; **không để người chơi rơi vào hố không quay lại**.
- Vệt đá đổ do gameplay biến trạng thái chỉ trên đường phụ; không phá tuyến bắt buộc giữa các portal.

## C. Cửa ra và checkpoint

| Link | Trigger | Đích |
| --- | --- | --- |
| `ln_vanh_mo` | (215,154) E | Vành Đai (9,55) |
| `ln_mo_rung` | (110,9) N | Rừng Ba Vì (9,136) |
| `ln_mo_ngam` | (85,80) nội bộ công trường | Mỏ ngầm **tầng B1** (93,150), thang máy/thang bộ |

**Spawn:** (166,157) kho/điểm giao hàng; **checkpoint:** (155,170) lán cứu thương, (104,21) trạm sườn núi, (88,89) trạm giếng. Thang xuống mỏ có sàn chờ, không xuất hiện trực tiếp dưới ray/ổ quái. Nếu máy nâng mất điện, cần đường thang bộ dự phòng hoặc cơ chế hồi checkpoint — không cắt kết nối thế giới.

## D. Layers và asset độc lập

| Layer | Phần cần vẽ |
| --- | --- |
| `L00` | đá xám vàng, đất đỏ, lớp đá phong hóa, bề mặt moong, sân kho; **không** bake máy xúc/cột điện/ore node |
| `L01` | địa hình 3 cao trình, dốc ngoằn, đường xe, rãnh nước mưa, taluy; vị trí cua phù hợp xe/người |
| `L02/03` | vũng nước khai thác/mương thoát nhỏ, shader nhẹ, đá/sỏi mép rãnh |
| `L04` | quặng chưa khai thác → cạn → tái tạo (state server), xe nâng đang hoạt động, đống đá đổi trạng thái |
| `L10` | máy xúc, xe tải, băng tải, container, cột đèn, bảng “NGUY HIỂM”, quặng scene riêng, NPC, dị thú |
| `L11` | mái lán, gầu máy xúc, cầu băng tải phía trước; fade phần che avatar |
| `L20/21` | bụi khi máy làm việc, sương mỏng ở moong thấp, đèn vàng công trường ban đêm; ánh ngọc lam chỉ ở quặng dị biến |
| `DATA` | nhiều cao trình walkable, cliff collision, nav qua dốc, xe lane, ore ownership/cooldown, portals, safe-vs-PvE mask, alarm |

## E. NPC và công việc

| ID | Điểm + ca | Hành vi |
| --- | --- | --- |
| `npc_ml_chi_hai` (đề xuất) | quản đốc (153,157), 06–18h | giấy phép khai thác/an toàn |
| `npc_ml_anh_thanh` (đề xuất) | lái xe (186,150), giờ làm ngày | giao vật tư, trông tuyến xe |
| `npc_ml_co_mai` (đề xuất) | phân tích mẫu (173,74), 08–18h | phân loại quặng, giải thích linh khoáng |
| `npc_ml_tho_may_binh` (đề xuất) | khu sửa máy (169,169), 07–20h | sửa dụng cụ/điều kiện máy nâng |
| `npc_ml_y_ta_ngoc` (đề xuất) | lán y tế (141,174), trực theo ca | hồi phục/checkpoint |

NPC nền 8–14 trên toàn mỏ, tối đa 5–8 thấy cùng camera; ca đêm ít người, đèn vẫn hoạt động. Không ai đi ra vùng nổ mìn/lở đá hoặc làm vật cản trên dốc cấp A. Mô phỏng công nhân đào/bốc hàng là animation tại job slot, không server cần chạy từng nhát cuốc.

## F. Quái, resource và rủi ro

| Spawn zone | Dị thú | Lý do sinh thái | Mức/cap thử |
| --- | --- | --- | --- |
| `ml_spawn_lizard` x=18–76,y=113–180 | **Thằn Lằn Đá** (**đề xuất**) | phơi nắng trên đá ấm, dễ bị kích thích bởi khai thác | 3–4 con / thấp–vừa |
| `ml_spawn_spider` x=23–68,y=26–83 | **Nhện Tơ Điện** (canon) | mạng gần điện/giàn thép cũ | 2–3 / vừa |
| `ml_spawn_bat` x=157–209,y=37–78 | **Dơi Mạch** (**đề xuất**) | quần thể bay khỏi hốc đá lúc tối | 2–3 / vừa |

- Không spawn trong lán/kho/giếng/thang hoặc đường cấp A. Quái có cảnh báo chuyển động, telegraph ngọc lam, dây leash/retreat, đánh solo có chỗ né; không cản `ln_mo_rung` hoặc `ln_vanh_mo`.
- **Node quặng**: `ml_ore_safe_01..08` dọc tuyến moong cấp phép, `ml_ore_risk_01..06` tại bãi đá cũ; mọi kết quả mine/server có giới hạn thời gian và chống nhân đôi. Chưa khóa tỷ lệ rơi quặng/XP.
- **Hoạt động tự động** chỉ được chọn `ml_mine_safe_01..04` gần kho/moong an toàn; **không tự đưa avatar offline vào bãi PvE/nổ mìn**. Direct control có thể chọn khu khó hơn.
- Hazards: đá lở nhỏ báo trước bằng âm thanh/bụi/mặt đất, không tấn công “vô hình”; tai nạn không dùng để phạt người bận đóng app.

## G. Art, âm thanh, test

Sắc đất bụi/đá vàng–xám, áo phản quang, xe cơ giới/đèn cảnh báo; cây mọc tự nhiên ở rìa, không phủ kín moong. Âm máy xúc xa, đá va, còi xe, gió hẻm. Chỉ dùng ánh tím cho dấu “ngoài chuẩn” **nếu có cốt truyện**, không sơn cả quặng tím.
**Triển khai:** ground cao trình → ramp/đường xe → 3 portal/arrival → cliff collision + y-sort → ore node → NPC → quái 1 loài → hiệu ứng.
**Pass:** đi được Vành Đai→Rừng→về mà không phải đánh; sử dụng giếng xuống–lên; không shortcut đi xuyên vách cao trình; node quặng change state/persist; luồng xe không cản trục người đi.

