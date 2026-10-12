# 12 — Kiểm thử, nghiệm thu bản đồ liên kết & checklist đưa vào game

**Trạng thái:** test plan **dành cho triển khai tương lai**, không phải biên bản test hiện tại. Áp dụng Godot 4.6.1, server Nakama/TypeScript và PC/mobile. Tài liệu [00](00-world-topology-and-routes.md) là nguồn chuẩn các cặp portal; [01](01-layer-contract-and-runtime.md) là hợp đồng data/layer.

## 1. Test gate bắt buộc theo từng giai đoạn

| Gate | Điều kiện mở | Đầu ra minh chứng |
| --- | --- | --- |
| `G0_design` | world graph, 8 map file, 10 portal links, layer/asset/NPC/monster hợp đồng | docs + review checklist |
| `G1_terrain` | mỗi sector nền sạch, đường, nước, bờ, cầu, không lộ seam | full-map screenshot ground-only |
| `G2_navigation` | mọi gate/POI walkable, không cắt qua collider, portal 2 chiều | AStar/nav physics smoke + visual overlay |
| `G3_props` | object có anchor/footprint, Y-sort/occlusion, trạng thái riêng | screenshot trước/sau interaction |
| `G4_activity` | slot, direct action, autonomous/server, offline, takeover, replay-safe | session logs + 2 client test |
| `G5_pve` | spawn masks, leash/telegraph, authoritative loot, death/retreat | encounter test + logs |
| `G6_polish` | lighting/audio/day-night/weather, performance PC/mobile + font VN | camera shot day/night, perf sheet |

**Không ký “done” G5 nếu mới có hình con quái**, hoặc ký G4 nếu chỉ có icon câu cá chưa có server session. Một map có thể đạt G2 sớm mà chưa phải playable hoàn chỉnh.

## 2. Bộ test static data và topology (chạy không cần renderer)

| Case ID | Bước kiểm | Pass |
| --- | --- | --- |
| `WD-001` | danh sách 8 map có ID duy nhất | không thiếu/không trùng |
| `WD-002` | so mỗi `link_id` trong [00] | đúng 10 cặp duy nhất, 2 đầu hợp lệ, không self-link vô cớ |
| `WD-003` | tọa độ portal với `width_cells,height_cells` | nằm trong bounds; hướng phù hợp mép/nội bộ |
| `WD-004` | arrival anchors nằm trong walkable polygon | không chạm vật cản, sâu ít nhất 3 ô so với trigger |
| `WD-005` | portal `ln_thang_cang` | `travel_mode=route_transit`, không masquerade thành seam kề nhau |
| `WD-006` | portal `ln_mo_ngam`, `ln_ngam_rung` | dùng `floor_id=b1` cho giếng; `floor_id=b2` cho cửa rừng |
| `WD-007` | liên thông graph cho vùng mở mặc định | Làng–Thăng Long–Vành Đai–Mỏ–Ba Vì–Cảng đi được; Thiên Mạch và lối tắt khóa rõ |
| `WD-008` | điều kiện mở khóa | khóa không khiến người chơi vào vùng chết; có cạnh trả về |
| `WD-009` | mỗi `object_id`, `activity_slot_id`, `npc_id` | duy nhất trong namespace, reference hợp lệ |
| `WD-010` | ground art/reference metadata | có art/license/anchor/footprint cho props stateful |
| `WD-011` | 2 map có nhiều cổng cùng cạnh Tây (Thăng Long, Ba Vì) | cặp không bị nhập nhầm vào nhau |
| `WD-012` | source-of-truth | nav/loot/slot **không suy từ màu raster hoặc gid tile** |

### Test đồ thị điều hướng ví dụ

- Làng → Thành phố → Cảng → Thành phố → Làng; trên tuyến Cảng xác minh trạng thái phương tiện/travel.
- Làng → Vành Đai → Mỏ lộ thiên → Rừng → Vành Đai → Thăng Long → Làng (**vòng chính**).
- Mỏ lộ thiên → Mỏ ngầm B1 → B2 → B1 → Mỏ lộ thiên (**vòng hầm**).
- Sau khi mở khóa `ln_ngam_rung`: Mỏ ngầm B2 → Ba Vì → Mỏ lộ thiên → Mỏ ngầm B1; cần floor local link đúng.
- Sau khi mở khóa `ln_rung_tram`: Ba Vì → Thiên Mạch → Ba Vì; khi boss chưa hoàn tất vẫn có đường rút.
- Nếu portal đích bị blocker/revision đổi: travel báo lỗi có thể khôi phục về **checkpoint hợp lệ**, không xuất hiện ở tọa độ (0,0) hoặc rơi ngoài map.

## 3. Gameplay trên một map — check cụ thể

| Case | Thao tác | Kết quả |
| --- | --- | --- |
| `MP-001` | đi theo mọi centerline cấp A | không vướng props/đầu cầu/nút cổ chai |
| `MP-002` | 2 avatar đi ngược ở cầu/đê/lối xóm | tránh nhau hoặc chờ rõ; không khóa cả tuyến |
| `MP-003` | đứng trước/sau nhà/cây/xe/container | Y-sort và mái/tán cutaway đúng; đầu/hoạt động không bị che |
| `MP-004` | chặt/đổi trạng thái một prop | nền sạch ở dưới còn nguyên, footprint/collision/state cập nhật |
| `MP-005` | đứng cạnh nước/cầu tàu | không đi xuống nước sâu/vực; bóng/gợn chỉ trong water mask |
| `MP-006` | bấm F hoặc touch cùng một interaction | action id giống nhau, một state change |
| `MP-007` | mở cửa/lối lên mái/thang B2 | đúng interior/floor, không teleport vào collider |
| `MP-008` | đóng cửa/giàn chắn trên nav | cập nhật path hoặc route thay thế, không đi xuyên |
| `MP-009` | mở minimap, worldmap, marker POI | khớp cùng world coordinates, hướng Bắc nhất quán |
| `MP-010` | tắt FX/chỉnh low quality | vẫn đọc được vật cản, đường, boss telegraph, bảng chỉ hướng |
| `MP-011` | quay lại checkpoint sau gục/reload | vị trí hợp lệ, không mất túi hoặc nhân bản avatar |
| `MP-012` | nạp/unload chunk khi đi | không nháy mép nền/water, không mất object state |

## 4. NPC và quái, server/session

| Case | Bước | Pass |
| --- | --- | --- |
| `NPC-001` | giờ sáng/trưa/tối/khuya | NPC đổi vị trí/hành vi hợp lịch; quán đêm còn người |
| `NPC-002` | follow Lục Vi/Tống Đức/Hà Tố sang vùng khác | **chỉ một NPC canon xuất hiện trong world** |
| `NPC-003` | NPC đi qua 2–3 props/cầu/hàng rào | không xuyên vật thể; có local avoidance |
| `NPC-004` | player dùng ghế đang có NPC/slot | queue/alternate/reject, không chồng actor |
| `NPC-005` | 2 client cùng xem NPC và avatar tự hành | state nhìn thấy nhất quán theo quyền |
| `PVE-001` | vào safe vùng chốt/cổng | 0 quái hostile spawn, leash đứt ngoài ranh giới |
| `PVE-002` | tới bãi quái | quái có notice/telegraph/attack/retreat, đánh được 4 hướng |
| `PVE-003` | quái chạy đuổi tới cổng | dừng/retreat trước safe, không spawn camp |
| `PVE-004` | chiến thắng + nhấn nhận nhiều lần/reconnect | loot/XP settlement đúng 1 lần |
| `PVE-005` | boss tắt nguồn/rút lui/mạng rớt | state recover, checkpoint, reward không nhân đôi |
| `ACT-001` | từ sảnh chọn câu ở hồ Làng, đóng game | server `travelling→active→completed`, không cần client mở |
| `ACT-002` | mở game khi avatar đang câu | thấy **một avatar** ở đúng slot, nút takeover |
| `ACT-003` | takeover rồi giao autonomous lại | không mất điểm câu hoặc tạo extra settlement |
| `ACT-004` | 2 user đặt cùng 1 slot | server xử lý tranh chấp idempotent, trả lời rõ |
| `ACT-005` | hoàn thành mục “đi học” đời thật | **không** tự tặng quặng, cá, XP/linh lực |
| `ACT-006` | ẩn quyền xem activity/avatar | server không gửi vị trí riêng tư cho bạn bè |
| `ACT-007` | mất mạng trên đường map | snapshot revision khôi phục, không xuất hiện hai avatar |
| `ACT-008` | client gửi vị trí giả/loot giả/spoof map_id | server từ chối, không ghi tiền/đồ |

## 5. Checklist riêng cho từng map

| Vùng | Bắt buộc để đạt G2–G3 | Bắt buộc tương tác (G4/G5 nếu có) |
| --- | --- | --- |
| Làng | cả hai cổng, đê, sông/hồ, cầu, vòng `lq_r05` | bến câu + plot riêng, NPC chợ/đê, **0 quái** |
| Thăng Long | hai cổng Tây + bến xe Đông Bắc, vòng `tl_r06`, hồ, ngõ mái che | 1 quán/ghế, 1 bến câu, 1 vườn mái, 3 service NPC canon, **0 quái** |
| Vành Đai | **4 cổng**, safe corridor, rào, mương, vòng tuần tra | NPC trạm/cảm biến, 1 bãi Lợn Gai, quái không chặn đường |
| Cảng | xe tuyến 2 chiều, kho/chợ, cầu tàu, water collider | câu biển + NPC kho, quái **chỉ bến hoang** |
| Mỏ lộ thiên | **3 lối**, 3 cao trình qua dốc, đường xe, vòng moong | node quặng, giếng B1, quái ngoài đường |
| Mỏ ngầm | giếng B1, cầu nối B1↔B2, cửa B2 ra Ba Vì, lối về | node quặng state, NPC B1, PvE B2 |
| Ba Vì | **4 cổng**, cầu suối, trục Nam–Bắc, 2 vòng | đúng lãnh địa/AI của 3 quái canon, checkpoint |
| Thiên Mạch | cửa từ Rừng 2 chiều, hành lang/cửa đổi state, đường rút | instance boss, warning và reward idempotent |

## 6. Kiểm thử thị giác đúng như game chứ không như ảnh minh họa

**Bằng chứng cần lưu theo map**:
1. ảnh **ground-only** toàn sector, không cây/NPC/quái, để so nối đất–đường–nước (đặc biệt bờ không bị hộp);
2. ảnh **full-map overlay** có tuyến A/B/C, POI, portal/collision, spawn masks, safe buffer — overlay là debug, không ship;
3. ảnh **gameplay camera** ở zoom ×2 và ×3, sáng/chiều/tối; avatar đứng trước/sau ít nhất 3 loại props;
4. ảnh **mobile** ở màn nhỏ, check hiển thị nhân vật, minimap, nút tương tác, chữ Việt dấu nặng/tilde;
5. video hoặc log thao tác đi A→B→A, trực tiếp + tự hành và bản ghi server;
6. bảng đo performance theo sector/chunk và cấu hình hiệu ứng.

Không phê duyệt ảnh art đẹp nếu thực tế Godot chỉ dựng được mảng nền phẳng, prop khác phối cảnh, lối đi đâm vào nước hoặc không có collision.

## 7. Ma trận thiết bị, chất lượng và kỹ thuật đo

| Mục | Desktop | Android/mobile | Cách đánh giá |
| --- | --- | --- | --- |
| Camera | zoom ×2 khám phá; ×3 tương tác | integer scale lớn nhất vẫn thấy chiều cao ≥11 ô | screenshot, so footprint/person |
| Điều khiển | WASD/mouse/F & cấu hình phím | joystick/touch target, safe edges | test tất cả portal/POI |
| Render | nearest pixel; normal map hub | quality toggle light/particle | không mờ, không scale lẻ |
| Asset loading | preload entry/chunk | budget RAM/GPU texture theo thiết bị | log cold start/chuyển map |
| Vật lý/nav | collider/actor avoidance | giống desktop | không bỏ collision ở low |
| Online | 2 clients + server session | đổi mạng, reconnect | idempotency/visibility test |

Đo tối thiểu FPS, **p95 frame time**, bộ nhớ texture/GPU khi có công cụ, draw calls, cold-load/hot-transition, số NPC visible, số đèn/particles, ảnh trước/sau. Chưa đặt ngưỡng FPS tuyệt đối chưa có thiết bị tham chiếu. Chỉ giảm light/FX và visual clutter sau benchmark, không cắt logic/spawn safety.

## 8. Checklist phát hành nội dung

- [ ] Canon Việt Nam hiện đại, ít nhất 3 dấu hiệu Việt Nam dễ nhận, không fantasy Trung Hoa trộn nhầm.
- [ ] Địa hình và đường sông **liên mạch tự nhiên**, không nhét cả vùng trong khung vuông lộ mép.
- [ ] Cặp cổng đọc từ **một nguồn data**; mọi link A↔B/arrival/map/floor đã qua test.
- [ ] Đi bộ tới ít nhất một vòng/POI, không chỉ “ảnh nhìn được”.
- [ ] Nhà/cây/ghế/xe/ore không bake hết thành background; object ID/anchor/collider đúng.
- [ ] Quái chỉ ở ecology zone, không sát safe/cổng; warning nhìn được kể cả ít FX.
- [ ] NPC và service có lịch, điểm làm/cư trú và đường đi thật.
- [ ] Autonomous activity có slot thật và authority server, không suy người thật làm gì.
- [ ] Minimap/map lớn đúng vị trí và quyền riêng tư.
- [ ] Có screenshot Godot, log test, benchmark trên PC/mobile; asset nguồn & license hợp lệ.

**Bản đồ chỉ “hoàn thành” khi đạt các gate tương ứng có bằng chứng, không chỉ đủ tài liệu thiết kế.**

