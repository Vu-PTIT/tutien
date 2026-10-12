# 11 — Asset matrix, gói scene và kế hoạch sản xuất 8 map

**Mục tiêu:** chuyển [00](00-world-topology-and-routes.md) và [02–09](README.md) thành từng lát cắt chơi được mà **không quay lại map chỉ là một ảnh minh họa**. Art direction theo [12 — Art Bible](../12-art-bible.md), pipeline map theo [10 — layered](../10-layered-interactive-maps.md).
**Hiện trạng:** nhánh map hiện có `layered_village_m1` là tech demo không canon; không coi hệ 8 map/portal/NPC bên dưới đã cài đặt.

## 1. Gói nội dung đầy đủ cho một map “sẵn sản xuất”

| Gói | Tài nguyên phải có | Ai tiêu thụ |
| --- | --- | --- |
| `terrain_clean` | ground raster/chunk; mask địa hình, dốc/vách/đường/bờ/suối | map loader/renderer |
| `water` | polygon/mask nước, shader, shore sprites, water collision | renderer/physics |
| `static_props` | nhà/cây/đá/xe/cột điện/cầu/gờ với PNG/atlas, anchor, footprint, collider | Y-sort/collision |
| `stateful_props` | cửa, quầy, máy, quặng, luống, đèn, tủ; frame state + ID | state replicator/server |
| `characters` | avatar/NPC/monsters, bộ 4 hướng và nghề | actors/animation |
| `navigation` | walkable polygon, blockers, đường tâm, portal/arrival, checkpoints | player/NPC/autonomous |
| `activities` | slot đứng, góc quay, priority, ownership, duration validation | activity client/server |
| `encounters` | spawn masks, territory, animation attack/warn/hit, loot mapping | PvE/server |
| `environment` | palette per hour/season, normal map chỗ cần, pointlights, audio, VFX volumes | atmosphere |
| `ui_map` | marker/minimap/worldgraph, signage có chữ Việt, icon và alert | HUD/platform |
| `test_evidence` | screenshot full map + camera + mobile, nav smoke, portal round-trip, interaction/FX test | CI/QA |

Một tài nguyên có **hai phần:** ảnh đẹp và dữ liệu để chơi. Ảnh độc lập phải lưu reference + license, ảnh AI chỉ làm concept nội bộ trừ khi được chỉnh sửa đáng kể/xử lý theo policy art; không ship bộ tileset 16×16 thiếu license hiện tại. Dùng atlas khi đóng gói **không đồng nghĩa dựng TileMapLayer**.

## 2. Asset matrix theo 8 vùng

Các số bên dưới là **danh mục sản xuất thử**, không phải số lượng art đã có hay ngân sách chốt.

| Map | Ground/đường/nước | Props đặc trưng ưu tiên (biến thể) | Actors | FX/sound | Ưu tiên |
| --- | --- | --- | --- | --- | --- |
| Làng | đất/ruộng/đê, hồ/mương, sân đình, 2 loại cầu | 2 nhà vườn, chợ, nhà kính, trạm bơm, ghế, lưới cá, 3 cây Việt, luống canh tác, cột điện | người dân 5 archetypes, cá/gà/chim nền | gió lúa, phao, tiếng ao, mưa phùn | P1 sau art test |
| Thăng Long | nhựa/vỉa hè/ngõ/sân, hồ kè, mái sân | 2 nhà ống (cửa state), quán trà, biển chữ Việt, cột điện/bồn inox, bảng cảnh báo, thư viện, cửa hàng, cổng xe | avatar + 3 archetypes NPC, 4 service canon | 2–4 light hub, đèn đường, xe máy xa | **P0 art test** |
| Vành Đai | đường nứt, bãi xưởng, ruộng, mương, rào | container, trạm kiểm lâm, trạm điện, xe tải, barrier, thiết bị quét | lính/nhân viên + **Lợn Gai Sơn** đầu tiên | bụi, đèn vàng, radio | P2 |
| Cảng | bê tông/kè/biển/mũi cầu, bãi container | tàu, cẩu, cầu tàu, thùng/xe nâng, kho, lưới cá, quán | công nhân/ngư dân + Cua Giáp Bùn mới | sóng/kêu tàu/gió biển | P4 |
| Mỏ lộ thiên | 3 cao trình/ramps, đá, mương nhỏ | máy xúc, goòng, băng tải, kho, thang mỏ, quặng có state | thợ mỏ + Thằn Lằn Đá | bụi/xe/tiếng đá | P3 |
| Mỏ ngầm | b1/b2 tầng, vách/hồ, ray hầm | ống quạt, đèn, xe goòng, cửa, cáp, 2 loại quặng | công nhân B1 + Dơi Mạch/Nhện | hơi nước, tiếng vang, đèn khoanh | P5 |
| Ba Vì | rừng/suối/thác/vách/bậc núi, cầu | 4 cây, 3 bụi, 3 đá, kiểm lâm, cảm biến, nấm/đá linh | 3 quái canon + ranger | sương, đom đóm, thác/gió | P3/P4 |
| Thiên Mạch | bê tông, hành lang, core arena | 2 cửa state, trụ, tủ, máy, điều khiển, kho hồ sơ | **Thủ Lĩnh Mạch Gãy**, 1 kỹ thuật viên | xung ngọc, tím hiếm, quạt | P6 |

**Dùng chung** (không copy vào 8 thư mục): ghế nhựa, cây bàng/sấu phù hợp vùng, đèn/vòng tròn hoạt động, mô hình an ninh công nghệ, bảng chỉ đường, avatar 4 hướng, NPC dịch vụ generic. Chỉ đổi bảng màu/tình trạng, không phá tỉ lệ asset khi tái sử dụng.

## 3. Chuẩn mỹ thuật kiểm soát hình

- **Pixel authoring:** 1 ô quy hoạch = 32 px; 1 pixel art = 1 px thế giới; player 32×48 px, cao khoảng 42 px; prop có kích thước/anchor do art metadata, không ép về 32×32.
- **Góc:** top-down 3/4 thẳng, thấy mái/sàn nhiều, mặt đứng nén. Camera zoom integer ×2 khám phá, ×3 tương tác; UI full native res.
- **Ánh sáng:** tia sáng trên-trái, bóng ngắn phải-dưới; normal map cho nhà/prop lớn **ưu tiên hub**, không bắt normal map mọi lá cây/quặng. Ngọc lam cho linh năng, tím cực hiếm cho ngoài chuẩn.
- **Tài nguyên gốc:** `client/art/<map_slug>/<category>/<name>.aseprite` + file `<name>_n.png` khi cần, xuất PNG/JSON atlas về `client/assets/<map_slug>/...`; metadata anchor/footprint/collider/action. Đặt license trong `client/assets/LICENSES/`.
- **Không làm:** map là ảnh toàn cảnh chứa mọi nhà/cây; kéo giãn tile 16px thành cảnh to; dùng thuật toán noise tạo toàn bộ địa hình thay thiết kế bố cục; dùng ảnh generated moodboard như final without conversion; phối cảnh nghiêng/xoay sprite pixel.
- **Preview art chỉ duyệt bố cục**; khi vào Godot phải lắp từ cùng ground chunks + props + logic, tránh kết quả runtime khác ảnh quảng bá.

## 4. Quy trình tạo một sector thật sự chơi được

1. **Layout blockout**: xác định rectangle sector, tâm POI, roads/entry/choke/chunk boundaries trên lưới thiết kế; duyệt lối ra liên vùng theo [00], mức nguy hiểm và ít nhất một vòng.
2. **Ground & water pass**: nền sạch, đường spline/texture, landform, water mask/bank. **Chỉ làm đất/đường/nước trước** theo yêu cầu hiện hành; chụp full map không có cây/nhà/NPC để kiểm tra liên mạch.
3. **Nav/collision pass**: walkable polygon, chỗ cấm, cầu, vách; chạy test từ entry tới tất cả exit/POI, 2 avatar đi ngược, minimap cùng dữ liệu.
4. **Prop pass**: cây/nhà/xe/đèn độc lập, occlusion policy, state, anchors; kiểm tra Y-sort đứng trước/sau.
5. **Interaction pass**: một nút bấm F/touch thật, slot câu/vườn/đào/shop; feedback và state change, persist khi khả thi. Không giả đã có server.
6. **People pass**: avatar, service NPC, background NPC, schedules, avoidance; chất lượng cao ở các góc hub, những sector vắng giảm density.
7. **PvE pass** (nếu combat): một loài có telegraph/aggro/leash/loot an toàn; sau kiểm tra mới thêm loài thứ 2–3.
8. **Polish/performance**: hiệu ứng nước/gió/đèn, weather/day-night, audio zoned, platform activity, PC/mobile, memory p95. Nếu visual pass đầu không đạt, **không nới map**.

## 5. Kế hoạch milestone phụ thuộc lẫn nhau

| Mốc | Sản phẩm hoàn thành | Không mở rộng khi |
| --- | --- | --- |
| `P0A` | World graph 8 vùng + 10 link ID + data schema + test portal pairing, stub minimap thế giới | links chưa đối xứng |
| `P0B` | **Art test Thăng Long 20×12 ô** (2 nhà có cửa state, quán, cột, cây, bến câu, 1 vườn mái, avatar, ánh sáng ngày/đêm) | ảnh ở camera thật vẫn không nhận ra Việt Nam |
| `P0C` | một sector Thăng Long có ground/đường/nước, Y-sort, nav, **1 hoạt động câu cá** gắn slot | chưa đi được/collider sai |
| `P1` | liên kết **Thăng Long↔Làng**, hoàn thành làng sinh hoạt + garden/câu; portal hai chiều | activity chưa pass |
| `P2` | thêm **Vành Đai** với hai cổng city/làng + một bãi Lợn Gai Sơn | tuyến safe bị quái chặn |
| `P3` | **Mỏ lộ thiên + Rừng Ba Vì**; nối Vành Đai↔Mỏ↔Rừng↔Vành Đai; 1 loại khoáng và quái ở mỗi | nav 3 chiều cao không chuẩn |
| `P4` | **Cảng Đông Bắc** qua transit Thăng Long; hoạt động bến/đánh cá biển; một vùng quái bến bỏ | xuất hiện dịch chuyển vô lý về địa lý |
| `P5` | **Mỏ ngầm** B1/B2, giếng nối Mỏ; cửa hầm tới Rừng mở điều kiện | trùng floor, không có đường về |
| `P6` | **Trạm Thiên Mạch** và boss test, cửa Rừng↔Trạm, rollback/checkpoint | chưa có encounter authority/reconnect |

**Lưu ý:** thứ tự là **đề xuất** để giảm rủi ro, không khẳng định 8 vùng phải có đủ trong MVP. MVP gameplay ưu tiên art test và vòng câu cá/sảnh; hành động offline+takeover tích hợp sau khi đủ server, không che giấu thiếu tính năng bằng render đẹp.

## 6. Scene/chunk/atlas: phân chia và hiệu năng

- Map lớn dùng các chunk **cùng world coordinate**, đọc ground raster theo phạm vi camera; object interactable có thể thuộc một sector server nhưng vẽ trên camera vùng giáp ranh bằng culling phù hợp.
- Chunk size ban đầu **1024 hoặc 2048 px để benchmark**; không tuyên bố 1 phương án tốt hơn TileMap trước đo. Có thể nạp thêm 1 màn trước hướng di chuyển và prefetch portal destination.
- Ground chunks không nên có độ phân giải texture vượt nhu cầu. VFX ngoài camera tắt, NPC crowd có đại diện nhẹ khi xa. Unload renderer không unload game state.
- Shared spritesheet/atlas giúp tái dùng nhưng không biến layout thành lưới tile. Không dùng 1 node cho mỗi hạt bụi/cỏ nhỏ; dùng batch/particle theo cụm; vật thể đổi state vẫn độc lập.
- Lưu cả **ảnh nền sạch** và **preview map** sinh tự động từ đúng dữ liệu props/render; preview không được trở thành nguồn collision.

## 7. Quy tắc tích hợp Git/Godot

- Tài liệu thiết kế dưới `docs/game-design/world-map/`. Mỗi map data/scene mới cần `map_id`, `map_revision`, asset license/source, người duyệt, ảnh test, test Godot 4.6.1.
- Không xóa `layered_village_m1.tscn` / `legacy_linh_khe.tscn` hay scene cũ khi chưa có bản thay thế chạy được. Chúng là mẫu kỹ thuật, không phải art canon.
- Không đổi tên legacy/backend ID “bằng find-replace”; migration alias rõ ràng và test dữ liệu người chơi trước.
- Tạo log thay đổi từng sector: tọa độ POI/road/portal sửa gì, ảnh trước sau, đường đi test ra sao; phối hợp platform qua hợp đồng `activity_session` thay vì merge toàn bộ nhánh.
- Nếu nguồn hình mới từ AI: ghi tool/prompt/nguồn, kiểm license/trạng thái trước ship, chỉnh sửa art đáng kể theo art Bible; asset gốc của người dùng có bản quyền hoặc license phải được kiểm tra.

## 8. Tiêu chí để gọi một map là “xong”

**Không chốt bằng số cây hoặc độ sắc ảnh minh họa.** Cần: người mới hiểu hướng đi/độ nguy hiểm; có ít nhất một tuyến A và một vòng hợp lệ; POI/cửa ra chạy thật; sprite/nền tách đúng; các item/slot có state; NPC có giờ làm; quái đúng hệ sinh thái và không chặn safe; portal A↔B; Godot screenshot khớp bản thiết kế; PC/mobile không vỡ font; tải lại không tạo bản sao/loot trùng; có kết quả QA đo hiệu năng. Xem [12](12-qa-and-acceptance.md).

