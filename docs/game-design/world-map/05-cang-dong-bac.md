# 05 — Cảng Đông Bắc | `m_cang_dong_bac`

**Loại:** cảng biển Việt Nam phía Đông Bắc, vùng **an toàn + khu cầu cảng bỏ hoang có PvE tùy chọn** · **mới đề xuất** · 256×192 ô (8192×6144 px).
**Bản sắc:** hậu cần, đánh cá, logistics và biển đảo thời Linh Chấn; tham chiếu không gian Hải Phòng/Quảng Ninh, **không đặt sát Thăng Long về địa lý**. Cảng cần hoạt động thực sự: có tàu, cẩu, kho, bến người, khu dân cư và vùng rủi ro riêng.

## A. Sơ đồ và sector

```text
 BẮC
┌───────────────────┬────────────────────────┬────────────────────────┐
│ Bến xe/đường      │ KHO CONTAINER          │ CẦU CẢNG BỎ / BÃI     │
│ liên tỉnh         │ hậu cần an toàn        │ quái (rào kiểm soát)   │
├───────────────────┼────────────────────────┼────────────────────────┤
│ Phố dịch vụ,      │ CHỢ CÁ + QUẢNG TRƯỜNG  │ CẦU CẢNG ĐANG DÙNG    │
│ quán cà phê       │ trạm y tế, xưởng máy   │ cẩu / tàu hàng        │
├───────────────────┼────────────────────────┼────────────────────────┤
│ Nhà dân/xe tải    │ BẾN THUYỀN/QUÁN ĂN    │ BẾN CÂU BIỂN /        │
│                  │ đường dạo ven nước     │ BIỂN / ĐÊ CHẮN SÓNG   │
└───────────────────┴────────────────────────┴────────────────────────┘
  NAM
```

| Sector (x,y ô) | Nội dung | Gameplay | Zone |
| --- | --- | --- | --- |
| `CG01_BEN_XE` 9–72,74–132 | trạm xe, vé, biển “Thăng Long”, trạm nghỉ | điểm đến/đi liên tỉnh | safe |
| `CG02_PHO_CANG` 9–87,130–184 | nhà thấp, hàng quán, xe đạp/xe máy | social/ăn nghỉ | safe |
| `CG03_KHO` 74–194,8–81 | kho container, xe nâng, cân hàng, chốt Hải quan hậu Linh Chấn | delivery/workshop, thương mại | safe |
| `CG04_CHO_CA` 75–176,76–141 | chợ cá, cầu nội bộ, kho đá, bệnh xá | mua cá, chữa trị, cộng đồng | safe |
| `CG05_CAU_CANG` 168–243,80–150 | cẩu, dây neo, tàu và cầu gỗ/bê tông | hoạt động giao hàng/sửa tàu | safe fenced |
| `CG06_BEN_CAU` 122–224,137–186 | bến thuyền nhỏ, hàng rào/chỗ câu, kè biển | câu cá biển có slot | safe |
| `CG07_CANG_BO` 197–252,12–76 | cầu cảng nứt, container sóng đánh, bãi bùn | **Cua Giáp Bùn**, PvE optional | danger |
| `CG08_MAT_BIEN` biển dọc E/S tới mép map | nước sâu, sóng, xa đảo (parallax) | không đi bộ/không spawn | blocked |

**Phối địa hình:** đường bê tông, bãi container rộng và kè biển có bờ cong. Không để mặt nước cắt hành lang từ bến xe tới chợ. Cảng không phải một bức ảnh biển tĩnh: cầu tàu phải có footprint/collider, điểm neo tàu và animation độc lập. Nhà kho có cửa cuốn đổi state.

## B. Trục đường, luồng hàng, cầu tàu

| Route | Đường tâm (ô) | Rộng | Công năng |
| --- | --- | --- | --- |
| `cg_r01_chinh` | (9,115) → (67,115) → (119,110) → (173,112) → (204,116) | 5 | terminal → chợ → cầu cảng hoạt động |
| `cg_r02_kho` | (118,110) → (127,64) → (138,28) | 4–5 | đường logistics; xe không chắn người |
| `cg_r03_ben_ca` | (146,118) → (166,157) → (181,170) | 3 | đi tới bến câu |
| `cg_r04_vong_pho` | (86,116) → (55,158) → (120,177) → (162,139) → (86,116) | 3 | vòng đi bộ safe |
| `cg_r05_cang_bo` | (176,95) → (206,66) → (225,41) | 2–3 | **nhánh PvE có cổng đóng/biển báo** |

- **Cầu cảng an toàn** rộng 3–4 ô, có lan can/chặn nước và lane công nhân; tàu neo là scene tương tác, phần thân tàu không coi là đất đi bộ.
- Thuyền có thể tạo hoạt ảnh nhẹ tại chỗ; nếu tương lai thêm ferry tới đảo, phải có destination thực và giấy phép đi biển, không tạo cửa ra trống.
- Cầu cảng bỏ hoang ở góc Đông Bắc có lối quay lại và warning trước 2 đoạn, không rải quái lên chợ cá.

## C. Cửa ra và điểm vào

| Link | Trigger | Mode | Đích |
| --- | --- | --- | --- |
| `ln_thang_cang` | (9,115) hướng W, trong bến xe | `route_transit` đường Đông Bắc/xe tuyến | Thăng Long (311,93) |

- **Checkpoint** (72,117) bến xe, (119,121) bệnh xá, (175,151) bến cá. Arrival safe ở bến xe, không đặt player trong dãy xe/hàng hóa.
- Tàu đi đảo hoặc đường sang vùng mới chỉ là **thông tin bối cảnh** và icon “chưa mở”, chưa phải portal hoạt động. Không có “rìa nước đưa sang map Hà Nội”.
- Nếu chọn “về Thăng Long”, UI hiển thị lộ trình liên tỉnh; quyền di chuyển xác nhận server, không cắt ngang mô phỏng thành cổng đi bộ.

## D. Layer

| Layer | Cấu phần |
| --- | --- |
| `L00/01` | bê tông cảng có khe thoát, phố ven cảng, bãi container, kè đá, bùn nông, cầu tàu nền riêng |
| `L02` | biển sâu/ven bờ 2–3 vùng mask, nước đục nhạt dưới khu tàu, sóng có shader riêng; tàu không làm collider nước |
| `L03` | sóng mép bờ, bọt, vệt nước, dây neo/đá thấp; không bao phủ chân người |
| `L04` | cửa kho mở/đóng, thùng hàng giao nhận đổi state, lưới phơi thay trạng thái, vũng nước mưa |
| `L10` | xe tải/xe nâng tĩnh hoặc scripted lane, container, nhà kho, cẩu, quầy cá, NPC, tàu neo, ghế đá |
| `L11` | mái quầy/cẩu, dây neo cao và phần thùng che người (fade phần occluder) |
| `L20/21` | gió biển mạnh, cờ phấp phới, chim hải âu, hơi nước, ánh đèn vàng bến, sương “trời linh” xa xa |
| `DATA` | land/water collision, cầu cảng walkable, safety fence, loot nodes, quái chỉ góc bãi hoang, slot câu/workshop, port travel link |

## E. NPC và xã hội

| ID | Điểm/lịch gợi ý | Chức năng |
| --- | --- | --- |
| `npc_cg_ba_kim` (đề xuất) | quầy cá (119,122), 05–14h | shop hải sản; thông tin thủy triều |
| `npc_cg_anh_quan` (đề xuất) | quản đốc (188,103), 07–19h | hoạt động hậu cần theo ca |
| `npc_cg_tho_hien` (đề xuất) | xưởng máy (151,77), 08–18h | sửa đồ câu/tàu |
| `npc_cg_chu_tau_yen` (đề xuất) | bến thuyền (181,159), sáng/chiều | hướng dẫn câu biển/vận tải |
| `npc_cg_y_ta_phuong` (đề xuất) | y tế (129,132), trực ca | hồi phục/checkpoint |
| `npc_ha_to` (canon) | một số ngày ở kho (132,65) | thương mại liên vùng, **chỉ một hiện thân trong world** |

NPC nền 14–24 theo ca bốc dỡ/chợ; nhóm ngư dân ngồi gỡ lưới, người đẩy hàng, lái xe nâng script, khách dạo bờ biển. Đêm giảm chợ cá, tăng ánh đèn kho; xe nâng không chạy xuyên người. NPC không bước ra bến nước sâu vì pathfinding chọn nhầm mặt cầu.

## F. Sinh hoạt, quái và vật thể

- **Câu cá biển:** `cg_seafish_01..06` ở (164,168),(173,173),(182,174),(194,167),(207,167),(218,161); đứng phía **trên bến/kè**, phao trong biển; phân loại cá khác hồ theo biome.
- **Làm việc/đóng gói:** `cg_cargo_01..04` tại kho an toàn; `cg_repair_01..02` tại xưởng máy; cấp thưởng kinh tế khi có contract cân bằng, không biến trạng thái “đang làm việc ngoài đời” thành nguồn tiền.
- **Nghỉ/ngồi:** `cg_rest_01..06` ven phố và mái hiên; có điểm dành cho bạn bè cùng ngồi.
- **Quái** chỉ tại `cg_spawn_crab` x=214–248,y=20–63: **Cua Giáp Bùn** (đề xuất, 2–4 con, bò ngang, thu mình báo đòn trước); `cg_spawn_fish` mép nước cạnh bến bỏ x=237–253,y=47–72: **Cá Răng Đồng** (đề xuất, cảnh báo mặt nước, đánh vùng mép, **không** lên chợ hay lao vào cầu an toàn). Spawn bị chặn bởi hàng rào/guard mask. Không spawn dị thú nước dưới slot câu an toàn.
- **Item/loot:** cá biển/vật liệu từ lưới/nhặt phế liệu; chốt ID/sản lượng sau khi hệ economy thống nhất. Không đặt quặng kiểu mỏ trên nền cảng.
- **Pass:** từ bến xe tới kho/chợ/bến câu không cần chiến đấu; vòng phố không cụt; quay về Thăng Long hai chiều; nước và cầu tàu collision không hở; quái chỉ ngoài chốt; PC/mobile thấy cảng Việt Nam ngay trong 3 giây.

