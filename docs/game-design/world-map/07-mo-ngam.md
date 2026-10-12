# 07 — Mỏ ngầm | `m_mo_ngam`

**Loại:** hầm khai khoáng nối Mỏ lộ thiên và một cửa hầm cũ phía Rừng Ba Vì, **mới đề xuất** · mỗi tầng 192×160 ô quy hoạch (6144×5120 px); **2 floor_id** `b1` và `b2` thuộc cùng `map_id`.
**Khác mỏ lộ thiên:** thiếu ánh sáng tự nhiên, đường hầm có nút, khu thông gió, nguy cơ môi trường rõ, độ căng tăng khi xuống sâu. Mỏ không phải mê cung tùy hứng: giao thông công nhân hợp lý, bản đồ có tên trục/tầng/điểm an toàn.
**Quy ước bắt buộc:** mọi object/portal/slot/creature trong map ngầm ghi đủ `(map_id, floor_id, x, y)`; thiếu `floor_id` là dữ liệu lỗi.

## A. Kết cấu hai tầng và bố cục

```text
B1 — KHU MỎ CÒN VẬN HÀNH
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Kho chống ẩm/giàn    │ THANG NỐI B2 ↓      │ Vỉa khoáng thấp     │
│ chống, hầm phụ       │ điểm kiểm soát      │ ít nguy hiểm        │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Hành lang máy,       │ GA XE GÒNG /         │ KHU ĐÀO CẤP PHÉP    │
│ thợ sửa điện         │ QUẠT THÔNG GIÓ       │ ore node            │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Y tế / nhà chờ       │ CỬA LÊN MỎ NGOÀI    │ Trục ray bảo trì    │
│                      │ ▲ ln_mo_ngam         │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘

B2 — KHU HẦM CŨ BỊ PHONG TỎA
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Mạch khoáng sâu,     │ Khối đá lạ/điểm     │ CỬA HẦM RA RỪNG →  │
│ Dơi Mạch             │ cảnh báo            │ ln_ngam_rung (khóa) │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Hầm sập, đường       │ TÚI KHOÁNG +         │ Ngách Nhện Tơ Điện  │
│ vòng rút lui         │ nút giao thông      │                      │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ THANG TỪ B1 ↑        │ Tuyến ray bỏ dở     │ Hồ nước ngầm nông   │
│                      │                      │ không bơi qua       │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

| Tầng/sector (x,y ô) | Mục đích | Navigation |
| --- | --- | --- |
| `b1/NG01_GA_MO` x=67–132,y=115–159 | cửa lên mỏ, nhà chờ, cứu thương | **safe arrival** |
| `b1/NG02_THONG_GIO` x=63–140,y=54–122 | trục ray, quạt thông gió, phân nhánh | 3–4 ô, vòng nhỏ |
| `b1/NG03_VIA_CAP_PHEP` x=125–185,y=46–120 | node quặng thấp | đường có đèn, chỉ khai thác có quyền |
| `b1/NG04_KHO` x=10–68,y=19–112 | kho, máy phát, hầm nhánh | không cho vào gian kỹ thuật đóng |
| `b1/NG05_THANG_B2` x=92–151,y=9–49 | trạm xuống B2 | kiểm soát/điểm chờ |
| `b2/NG06_VIA_SAU` x=9–130,y=7–101 | quặng linh biến, Dơi Mạch | PvE mức vừa |
| `b2/NG07_NHEN` x=111–188,y=61–121 | hốc ẩm, dây điện, Nhện | PvE mức vừa |
| `b2/NG08_HAM_CU` x=128–191,y=10–60 | cửa hầm ra rừng, trạm cảnh báo | **locked** giai đoạn đầu |
| `b2/NG09_THANG_B1` x=9–71,y=104–159 | lối quay về, tuyến ray | checkpoint/panic exit |
| `b2/NG10_HO_NGAM` x=95–181,y=120–158 | hố nước/hang sập | blocker, không là tuyến bắt buộc |

## B. Mạch hành lang (hạn chế dead end)

| Route | Floor/đường tâm (ô) | Rộng | Vai trò |
| --- | --- | --- | --- |
| `ng_b1_r01_main` | b1: (93,150) → (101,116) → (104,82) → (119,44) → (120,34) | 3–4 | mỏ ngoài → ga → thang B2 |
| `ng_b1_r02_work` | b1: (104,83) → (143,83) → (172,67) | 3 | nhánh quặng an toàn |
| `ng_b1_r03_loop` | b1: (103,89) → (53,82) → (47,44) → (113,38) → (103,89) | 2–3 | đường tránh hỏng quạt |
| `ng_b2_r01_trunk` | b2: (32,132) → (61,109) → (113,81) → (156,52) → (183,41) | 3 | thang B1 → ngách rừng |
| `ng_b2_r02_pve_loop` | b2: (105,82) → (64,48) → (117,24) → (153,59) → (105,82) | 2–3 | vòng thu thập có chỗ né |
| `ng_b2_r03_lake` | b2: (98,93) → (110,127) → (140,133) | 2 | nhánh hồ, kết thúc có marker rõ |

- Ở góc cua quặng dựng **vịnh tránh** cho 2 avatar. Phòng hầm không trải lan can/tường theo giả định “đây là 3D”: lối walkable và vật chắn phải rõ trên top-down 3/4.
- Đường hầm cụt có **landmark và lý do** (quặng, hỏng máy, kho), có mũi tên về trục; không đặt ngách chỉ để kéo dài thời gian.
- `b1` và `b2` là hai scene/floor, không phải hai layer chồng alpha. Có thể nạp/tắt scene theo `floor_id`.

## C. Portal ngoài map + cầu nối nội bộ

| ID | Nguồn | Đích | Điều kiện |
| --- | --- | --- | --- |
| `ln_mo_ngam` | **b1** (93,150) | Mỏ lộ thiên (85,80) | thang máy 2 chiều, thang dự phòng |
| `ln_ngam_rung` | **b2** (183,41) | Ba Vì (9,213) | khóa cho đến khi sửa cửa hầm, có check server |
| `ln_mg_b1_b2` (**nội bộ**) | **b1** (120,34) | **b2** (32,132) | cửa/tải floor hai chiều; không đổi `map_id` |

**Checkpoint:** B1 (94,140) ga an toàn; B1 (119,45) trước thang; B2 (38,123) điểm gác tạm khi xuống. Nếu mất điện, đường rút B2→B1 phải còn dùng; nếu mất kết nối server, không biến avatar thành bản sao ở hai floor. Arrival ở khoảng trống sâu ≥3 ô và có đèn.

## D. Layer & ánh sáng chuyên biệt

| Layer | Yêu cầu |
| --- | --- |
| `L00/01` | nền đá xám đất, ray xe, đường hầm, chỗ gia cố gỗ/thép, mạch khoáng; B1 sáng hơn B2; tường là prop/occluder riêng |
| `L02/03` | nước rò, hồ nhỏ B2 (mask + collider), không cho nước tràn cả sàn |
| `L04` | ore node cạn/đầy; cửa áp suất, máy phát, quạt đang chạy/hỏng, bụi đọng sau sự kiện |
| `L10` | ống thông gió, dầm, xe goòng, cáp điện, bảng an toàn, đèn, quái, NPC, quặng |
| `L11` | vòm hầm/dầm ngang che đầu thì fade cục bộ, không làm mái hang che toàn avatar |
| `L20/21` | giọt nước, bụi lơ lửng, ánh đèn mỏ vàng, chớp báo **nhẹ/giới hạn** (có accessibility toggle), ngọc lam ở vỉa biến dị; không nháy nhanh |
| `DATA` | floor_id, nav graph theo tầng, vùng thông gió/hazard, collision vách/hồ, camera bounds, portals, safe mask, quái, node tài nguyên |

**Không có “trời ban đêm” dưới hầm.** Đồng hồ thế giới vẫn chạy cho NPC/respawn, nhưng ánh sáng vùng hầm phụ thuộc đèn/phát điện/sự kiện. UI không dùng ánh sáng pixel để giấu cửa bắt buộc.

## E. NPC, hoạt động và sinh vật

| NPC/loại | Vị trí | Vai trò |
| --- | --- | --- |
| `npc_ng_to_truong_viet` (đề xuất) | B1 (96,129), ca 06–18h | an toàn mỏ, điểm dừng |
| `npc_ng_tho_dien_linh` (đề xuất) | B1 (117,91), 08–20h | quạt/cửa/tuyến đèn |
| `npc_ng_tho_mo_hieu` (đề xuất) | B1 (165,75), ca ngày | công việc khai khoáng B1 |
| 3–7 công nhân nền | **chỉ B1**, đi tuyến đèn | công việc/xe goòng ambience; B2 không phải chỗ sinh hoạt đông |

| Spawn | Quái | Cap tham khảo | Hành vi |
| --- | --- | --- | --- |
| `ng_spawn_bat_b2` b2 x=16–115,y=12–78 | **Dơi Mạch** (đề xuất) | 3–5 | bám vòm, bay vòng ngắn, báo lao xuống |
| `ng_spawn_spider_b2` b2 x=122–182,y=64–113 | **Nhện Tơ Điện** (canon) | 2–4 | mạng giữa cáp hỏng, né vùng đèn |
| `ng_spawn_lizard_b1` b1 x=135–182,y=20–51 | **Thằn Lằn Đá** (đề xuất) | 1–2 | cảnh báo ngoài hầm làm việc, không tới ga |

- Quái không bao giờ spawn trong vùng `NG01` hay ngay hai phía thang. Sau khi bị thu hút không được chạy qua guard mask, không chase xuyên floor.
- **Mining offline:** chỉ `ng_mine_safe_01..02` ở B1 sáng có giám sát và giới hạn ca; B2 **chỉ direct/manual hoặc chương trình tự động đặc biệt đã được thiết kế an toàn và chốt luật** (không có trong MVP).
- `ng_ore_b1_01..06` và `ng_ore_b2_01..08` có trạng thái server; loot thuộc encounter/node, không tự cấp từ client. Đá linh năng có VFX yếu, không dát neon cả hầm.
- **Rủi ro môi trường:** điện yếu, bụi, khí thiếu/đá lở chỉ ở zone đánh dấu và có telegraph + lối vòng; không tạo sát thương bất ngờ khiến người chơi offline mất hết tài sản.

## F. UX và test

Minimap có **tab tầng B1/B2**, dấu “bạn đang ở B2” và đường về thang gần nhất; bản đồ thế giới vẫn chỉ thấy một `m_mo_ngam`. NPC không hiện ở B2 nếu thực tế đứng B1. Âm quạt/hơi nước/kim loại/rơi sỏi; vùng không quái vẫn có tiếng công nhân. FPS/mobile điều chỉnh bóng động, không giấu vật cản.
**Pass:** vào từ mỏ ngoài→B1→B2→lại B1→ngoài; sau mở khóa B2→Ba Vì→quay về hai chiều; không spawn trong tường, không băng qua hồ; cửa/quạt đổi state với nav phù hợp; camera không lẫn hai tầng và không nhân đôi avatar.

