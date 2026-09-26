# 04 — Thế giới, map và giao diện khám phá

**Cập nhật runtime:** 26/09/2026

**Trạng thái:** Runtime prototype có lớp ground dạng atlas ô 32 px, 21 điểm tương tác dùng chung và cổng vào/ra có điểm đến riêng. Nội dung và quyền mở map vẫn là cục bộ, chưa do server xác nhận.

## 1. Rà soát bản hiện tại

Prototype có bốn TileMap từ atlas địa hình tái sử dụng, một scene map dùng chung, camera theo nhân vật, minimap đọc cùng JSON layout, collision/POI độc lập với ảnh và cổng đi thử. An Khê dùng kích thước đã chốt 48×36 tile (1536×1152 world pixels). Ba map còn lại tạm dùng canvas prototype 48×36 để thử bố cục; metadata đánh dấu kích thước này chưa chốt.

Các điểm đã kiểm tra trong repo:

- `client/scenes/map_world.tscn` dùng chung cho bốn map; `client/scripts/game_map.gd` nạp nền, spawn, khu/phòng, blocker và chế độ camera từ `client/data/map_catalog.json`.
- `client/data/maps/*.json` đặt từng ô Ground 32×32 từ `TileSet` địa hình tái sử dụng; Detail có tile trang trí thưa. Foreground TileMapLayer được dành cho art sau này. Công trình/cây là prop Y-sort riêng; cây anh đào An Khê có sprite RGBA tách nền, vùng cản ở gốc và giảm opacity khi che nhân vật. PNG world sơn tay chỉ là ảnh concept trên panel tuyến.
- Catalog định nghĩa 21 POI có `entity_id` ổn định trên bốn map. Scene POI dùng chung hiển thị nhãn, biểu tượng và gợi ý tương tác; hiệu ứng môi trường đặt trên tile nước hoặc mạch sáng tương ứng. Cổng có vị trí đến ở map đích để chuyến đi/về khớp lối nối.
- Hành động NPC, dịch vụ, đọc dấu vết, dò Mạch Bàn, khảo sát node và checkpoint mới chỉ đổi thông báo/cờ trong phiên cục bộ. Chúng không mở quest thật, cấp vật phẩm, lưu tiến độ hay xác nhận quyền vào map.
- `Camera2D` theo người chơi ở map dã ngoại; Cổ Tỉnh đổi giới hạn camera theo phòng. Collision kết hợp vùng cản landmark với loại tile đặc: nước và hố không đi xuyên được; cầu Trúc Âm có vùng mặt cầu được đi qua. Điểm tương tác quan trọng đã đặt lại cạnh prop và trên ô khô.
- Route có thể tải map cục bộ. Đây là luồng test client; cổng server, checkpoint, quest, NPC, PvE, fog-of-war và lưu trạng thái chưa được nối.
- `client/scripts/ui/hud.gd` vẽ minimap từ ô địa hình, blocker và POI của runtime; `M` mở overlay tuyến, `Esc` đóng.
- Overlay đọc bốn map và ảnh preview từ `client/data/map_catalog.json`; chọn thẻ để xem, bấm **Đi thử map này** để đổi scene cục bộ. Server chưa xác nhận quyền vào.
- Tài liệu cũ ghi kích thước 64×48, 96×96, 80×64 và 64×64 tile; các số này đã lỗi thời so với quy chuẩn mới bên dưới.

Vì vậy, phần đang có là **prototype trình bày và đi thử tuyến bốn map**. Terrain vẫn là atlas 32 px cố định; foreground chỉ mới xử lý bằng Y-sort/fade cho vật thể cao và chưa được phủ art đầy đủ. Các sheet prop hiện vẫn có nền vuông dính theo ô atlas, thấy rõ thành mảng cỏ/đá quanh vật thể; cần một lượt art riêng để thay bằng prop RGBA tách nền trước khi xem là đạt chuẩn phát hành. Ba map ngoài An Khê vẫn giữ trạng thái canvas prototype 48×36, chưa chốt kích thước thiết kế.

## 2. Quy chuẩn nền tảng

| Thành phần | Chuẩn hiện tại |
|---|---|
| Phong cách | 2D pixel top-down, hơi nhìn từ trên xuống; tilemap và sprite cùng lưới, pixel FX tiết chế |
| Kích thước tile mục tiêu | 32×32 px; sprite và collision không buộc phải phủ toàn tile |
| Khung hình cơ sở | 640×360, nearest filtering, giữ tỷ lệ và scale nguyên |
| Mở rộng camera PvE | Có thể mở nhẹ theo chiều ngang đến tối đa khoảng 704–720×360; không thay tọa độ thế giới hoặc luật server |
| PvP | Khóa FOV và camera cho cả hai người chơi để không tạo lợi thế nhìn xa |
| Thế giới | Các map chia khu/zone nối nhau; tránh một hình chữ nhật open-world quá lớn |
| PC và mobile | Chung map, tile, NPC, quest, collision và tọa độ server; khác bố cục HUD, điều khiển, vùng an toàn thao tác và camera PvE |

Kích thước An Khê đã chốt là **48×36 tile**. Trúc Âm có **3 zone**, Thạch Cạn có **2 zone**, Cổ Tỉnh có **5 phòng**. Chưa ấn định kích thước map/zone/phòng còn lại; 48×36 hiện chỉ là canvas đồ họa và thử runtime, không phải quy chuẩn thiết kế mới.

## 3. Cấu trúc tuyến MVP

```text
An Khê — hub an toàn (48×36)
  └─ Trúc Âm — 3 zone, khai thác và học chiến đấu
       └─ Thạch Cạn — 2 zone, đọc địa hình và đối đầu tinh anh
            └─ Cổ Tỉnh — instance theo phòng, boss chương đầu

Đấu tập PvP — instance riêng, FOV cố định
```

Map được nối bằng cổng có tương tác và trạng thái mở khóa rõ ràng. Mỗi tuyến nguy hiểm có đường rút hoặc checkpoint phù hợp. Người chơi không bị khóa trong khu vực vì quest lỗi hoặc do mất vật phẩm nhiệm vụ.

## 4. Giao diện bản đồ trên hai nền tảng

### PC/laptop

- HUD chơi giữ gọn: sinh lực/linh lực góc trên trái; minimap và tên khu vực góc trên phải; thanh kỹ năng ở cạnh dưới; quest đang theo dõi ở cạnh trái.
- Phím `M` mở bản đồ toàn khu; `WASD`/phím mũi tên di chuyển; `E` tương tác. Minimap chỉ để định hướng, không chứa nút nhỏ bắt buộc phải bấm.
- Bản đồ toàn khu mở thành lớp phủ có tên zone, điểm đã phát hiện, cổng đã mở, checkpoint và đường nhiệm vụ hiện tại. Chưa khám phá thì dùng mảng địa hình mờ, không vẽ chính xác quái hoặc node tài nguyên.
- Bản đồ đóng bằng `M` hoặc `Esc`; không che mất trạng thái quest khi đóng.

### Mobile

- Giữ nguyên thế giới và thiết kế map. D-pad/joystick ảo đặt góc dưới trái; nút tương tác và kỹ năng nằm góc dưới phải trong vùng chạm an toàn.
- Minimap, quest và trạng thái nhân vật được xếp lại để không nằm dưới tai thỏ, bo góc hoặc vùng gesture hệ điều hành.
- Chạm minimap mở bản đồ toàn khu; các điểm bấm có vùng chạm lớn và nhãn hiện khi chọn. Không yêu cầu kéo chính xác vào icon nhỏ.
- Camera PvE có thể lộ thêm một ít không gian theo chiều ngang trên thiết bị rộng; không thu nhỏ nhân vật/UI để nhét thêm nội dung. PvP vẫn dùng cùng FOV cố định giữa các thiết bị.

### Thành phần dùng chung

Tên/ID khu vực, biểu tượng quest, trạng thái mở khóa, fog-of-war, điểm dịch chuyển, checkpoint và dữ liệu vị trí dùng chung. Tỉ lệ bố cục UI, phương thức mở bản đồ và điều khiển mới là phần riêng theo nền tảng. Bản đồ không mở menu nạp tiền hay biểu tượng sự kiện phủ lên đường đi.

## 5. Phong cách và bố cục từng map

Các mô tả dưới đây là hướng dựng art và level. PC/mobile dùng cùng địa hình; chỉ khác khung camera, cách đặt HUD và cách người chơi thao tác.

### 5.1 An Khê — `m_an_khe` — 48×36 tile

**Vai trò:** điểm trở về, nhận việc, dịch vụ và vườn cá nhân. Khu an toàn, màu xanh lá dịu, mái ngói nâu đỏ, đá xám ấm và nước xanh ngọc. Silhouette mái nhà và cầu phải đọc được ở kích thước tile; hiệu ứng lá/đom đóm chỉ làm điểm nhấn.

**Bố cục:** spawn ở sân làng trung tâm; đường chính dẫn đến nhà dược và bảng chỉ hướng. Lò rèn, sạp chợ và trạm thủy vụ nằm trên nhánh phụ dễ nhìn. Cổng Trúc Âm ở rìa có dấu hiệu thị giác riêng. Vườn sáu ô là giao diện chức năng gắn với nhà dược, không phải map thứ năm. Bãi đấu tập chỉ đưa người chơi sang instance riêng.

**PC:** dành khoảng trống quanh spawn và các cửa dịch vụ; bảng địa danh/quest tránh phủ lên NPC. Minimap làm rõ sân, bờ nước, nhà dược và cổng rừng.

**Mobile:** giữ lối đi rộng quanh nhà dược và cổng; nút tương tác không che cửa hoặc nhân vật. Khi mở map, ưu tiên tên điểm dịch vụ thay cho nhãn trang trí.

### 5.2 Trúc Âm — `m_truc_am` — 3 zone

**Vai trò:** tuyến đầu dã ngoại, dược liệu và bài học né đòn. Bảng màu xanh trúc lạnh, mặt nước xanh xám và vài điểm vàng nhạt từ dược liệu. Không phủ toàn khu bằng một màu xanh giống nhau: mỗi zone cần khác nhau về đường chân trời, mật độ cây và hình dáng lối đi.

| Zone | Nhận diện cảnh quan | Lối chơi và điểm mốc |
|---|---|---|
| Ven Suối | Nước và đá sáng, tầm nhìn thoáng | Đường an toàn, Cam Lộ; cầu là mốc dễ nhận ra |
| Rừng Trúc Sâu | Thân trúc dày, bóng đổ thành cụm | Sơn Trư; các khoảng trống báo trước vị trí né và hướng thoát |
| Bãi Sơn Trư | Bãi giao tranh cạnh sườn rừng, tương phản cao hơn | Tuyến nguy hiểm hơn; Độc Chu/Tĩnh Tâm và lối tắt sau khảo sát Mạch Bàn |

**PC:** minimap hiển thị rõ ba nhánh và hướng quay về; camera có thể rộng hơn cơ sở một chút trong PvE. Không dùng lặp nền trúc khiến người chơi mất phương hướng.

**Mobile:** đường chính rộng và dễ đọc từ camera thấp hơn; cảnh báo quái hiện gần mép màn hình trước khi bị che bởi joystick. Lối tắt và điểm rút lui dùng biểu tượng lớn, không chỉ dựa vào màu.

### 5.3 Thạch Cạn — `m_thach_can` — 2 zone

**Vai trò:** khai thác quặng, dùng địa hình che chắn và giới thiệu hệ quả của linh mạch bị khai thác. Bảng màu đất vàng xám, đá nâu lạnh, quặng lam sáng. Silhouette đá có cạnh gãy; tránh đặt hiệu ứng quặng sáng cùng màu vùng tấn công.

| Zone | Nhận diện cảnh quan | Lối chơi và điểm mốc |
|---|---|---|
| Ngoại Vi | Lối đất rộng, cọc gỗ và xe quặng | Đi vào an toàn, checkpoint ngoài tầm quái, thấy được hai hướng tiến |
| Mỏ Cũ | Vách đá, quặng lam và trụ chuyển dòng | Vật cản chia tầm nhìn; Kẻ Rình Đường/Thạch Vệ; điểm ngắm giải thích xung đột bằng cảnh vật |

Cửa Cổ Tỉnh yêu cầu `q_main_009` và quyền mở khóa được xác nhận phía server. Vật phẩm chìa có thể kể chuyện nhưng không phải trạng thái mở khóa duy nhất.

**PC:** minimap thể hiện hai zone, vùng khuất và checkpoint; địa hình che chắn phải còn đọc được khi thu nhỏ.

**Mobile:** ưu tiên tương phản cao cho vách, đòn xa và lối rút; không đặt nút tương tác lên node quặng hoặc hiệu ứng báo đòn.

### 5.4 Cổ Tỉnh — `m_co_tinh` — instance theo phòng

**Vai trò:** kiểm tra khả năng chuẩn bị, đọc dấu hiệu, né đòn và phối hợp trước boss Mộc Tâm Thủ Trận. Art chuyển từ đá khô sang rễ cổ và ánh lam lục; mỗi phòng có một silhouette riêng để người chơi nhớ thứ tự.

| Phòng | Cảnh quan và dấu hiệu | Cơ chế học |
|---|---|---|
| Cửa giếng | Bia đá, checkpoint và vùng chuẩn bị | Kiểm tra vật tư trước khi đi tiếp |
| Hành lang rễ | Rễ chắn đường, vệt độc nổi rõ | Đọc vùng nguy hiểm và né |
| Buồng cân mạch | Hai nguồn sáng với lối vòng nhìn thấy được | Quan sát, chọn nguồn/lối thay thế |
| Nhà trận | Nền gạch hình học, một Thạch Vệ | Canh nhịp đỡ và lộ sườn |
| Tâm giếng | Không gian tròn, dấu hiệu boss trước khi kích hoạt | Tổng hợp các kỹ năng đã học |

Bố cục cố định cho MVP; chưa procedural. Người chơi có thể rút khỏi encounter theo checkpoint/luật instance đã báo trước. Vào sau khi boss bắt đầu không tự nhận điều kiện quest.

**PC:** sơ đồ phòng là một chuỗi nút; phòng chưa khám phá không lộ sơ đồ chi tiết. **Mobile:** chỉ báo phòng hiện tại và phòng kế; tránh minimap nhiều chi tiết trong combat.

### 5.5 Đấu tập PvP — instance riêng

Giữ arena đơn giản, nền tối trung tính và vật cản dễ đọc. Không để khác biệt góc nhìn, zoom, minimap hoặc độ rộng màn hình thay đổi lượng thông tin chiến đấu. Map chung của An Khê vẫn an toàn; vào đấu tập luôn cần lựa chọn rõ ràng và đồng thuận.

## 6. UI bản đồ toàn khu và trạng thái khám phá

Màn hình bản đồ là lớp giao diện riêng, không phải ảnh nền của map đang chơi. Overlay prototype có bốn thẻ, ảnh preview, mô tả và nút **Đi thử map này**. Nút này nạp map local để kiểm tra tuyến; không xác nhận quest hoặc quyền vào phía server. Bản hoàn chỉnh gồm:

1. **Tên khu + mức nguy hiểm** ở đầu bảng; nguy hiểm có nhãn chữ và biểu tượng, không chỉ đổi màu.
2. **Sơ đồ tuyến** ở giữa: An Khê → Trúc Âm → Thạch Cạn → Cổ Tỉnh; cổng khóa ghi điều kiện mở.
3. **Thẻ điểm quan tâm**: NPC/dịch vụ, checkpoint, lối tắt đã mở và quest đang theo dõi.
4. **Thông tin zone** khi chọn: mục tiêu, loại đối thủ đã biết, tài nguyên liên quan và đường rút.
5. **Chỉ đường** chỉ hiển thị nơi đã phát hiện; không khẳng định vị trí quái/node theo thời gian thực nếu server không cung cấp.

Không ghi số lượng loot, giá bán, xác suất rơi hoặc thưởng quest trực tiếp vào art. Tên nguyên liệu và điểm farm phải trỏ đến catalog kinh tế hiện hành để tránh lệch nguồn và chỗ tiêu tài nguyên.

## 7. Quy tắc rủi ro, tài nguyên và chuyển map

| Khu | PvP | Mất vật phẩm khi thất bại | Thông báo bắt buộc |
|---|---|---|---|
| An Khê | Không; trừ instance đấu tập tự nguyện | Không | Khu an toàn |
| Trúc Âm/Thạch Cạn MVP | Không | Giữ đồ đã sở hữu | Quái, lối về và checkpoint |
| Cổ Tỉnh MVP | Không | Encounter thất bại không phát thưởng | Solo/co-op, điều kiện vào và cách rút |
| Tranh đoạt tương lai | Chưa khóa | Chưa khóa | Xác nhận rủi ro trước khi vào |

Node tài nguyên MVP có trạng thái thu cá nhân trong map chung; server kiểm tra khoảng cách, trạng thái node và thời gian tương tác. Mỗi node cần `nodeId`, `resourceTableId`, `respawnPolicy`, `mapVersion`. Loot, giá bán và chi phí craft/nâng cấp lấy từ catalog kinh tế đã có; không tạo bảng drop hoặc giá riêng trong tài liệu map.

Cổng kiểm tra quest, nhóm và sức chứa ở server; client không tự chọn `mapId`/spawn hợp lệ. Chuyển map tạo quyền điều khiển/`sessionEpoch` mới. Nếu chuyển thất bại, quay về trạng thái nguồn hoặc checkpoint; không tiêu vật phẩm hai lần. Mỗi nhân vật chỉ hiện diện trong một match gameplay tại một thời điểm.

## 8. Kế hoạch dựng map trong Godot

1. **Khung dùng chung — đã dựng prototype:** atlas ground runtime, scene POI, lớp vị trí cho actor/FX và quy ước dữ liệu 32×32; detail/foreground đang để trống cho art tách lớp.
2. **An Khê — lát cắt đầu — đã dựng prototype:** giữ 48×36; có NPC Bà Sâm, dịch vụ làng, vườn, cổng Trúc Âm, gợi ý tương tác và cờ hội thoại cục bộ.
3. **Trúc Âm — đã gắn dữ liệu tương tác:** giữ ba zone Ven Suối, Rừng Trúc Sâu, Bãi Sơn Trư; có Cam Lộ, dấu Sơn Trư, Mạch Bàn và lối rút/cổng đi tiếp. Đường và blocker vẫn là bản thô.
4. **Thạch Cạn — đã gắn dữ liệu tương tác:** giữ hai zone Ngoại Vi, Mỏ Cũ; có trạm nghỉ, node quặng chỉ để khảo sát, trụ chuyển dòng và cổng hai chiều. Chưa khai thác tài nguyên thật.
5. **Cổ Tỉnh — đã gắn điểm phòng:** giữ năm phòng và camera khóa theo phòng; có điểm chuẩn bị, Mạch Bàn, bảng trận, Tâm Giếng và lối rút. Chưa có encounter/boss.
6. **Kiểm thử tuyến — có smoke test cục bộ:** đi qua cổng An Khê → Trúc Âm → Thạch Cạn → Cổ Tỉnh, kiểm tra điểm đến, map/zone/phòng, tương tác và lối rút.
7. **Phần kế tiếp để đạt chất lượng production:** tách art thành ground/detail/foreground thật; nắn collision và đường đi theo ảnh; xác định kích thước ba map chưa khóa từ layout; nối quyền chuyển map, quest, checkpoint, NPC/PvE và tài nguyên với server; sau đó hoàn thiện touch HUD, safe-area và kiểm tra PC/mobile.

### Cổng nghiệm thu

- Không có node thiết yếu bị HUD hoặc safe-area che trên PC/mobile.
- Đường đi, vùng va chạm, vật cản che nhân vật và lối rút khớp với mục đích art.
- Spawn/checkpoint an toàn; người chơi không vào tầm đánh trước khi nhận trạng thái từ server.
- Minimap phản ánh đúng kích thước map, vị trí hiện tại, cổng đã biết và fog-of-war.
- Tất cả tên nguyên liệu/quest/drop tham chiếu đúng dữ liệu nguồn; không trùng hoặc phát sinh tiền/vật phẩm ngoài hệ thống kinh tế.
- PvP có FOV đồng nhất; test trên tỉ lệ PC và mobile, không chỉ editor viewport.

## 9. Rủi ro thiết kế còn mở

- Art An Khê hiện tại là PNG RGB một lớp, không thể gọi là tileset hoặc coi là nền production.
- Chưa có tileset nhất quán cho bốn map; ảnh AI cần tách và kiểm từng tile/frame trước khi dùng làm gameplay.
- Ba map ngoài An Khê tạm lấy canvas 48×36 tile để dựng art/runtime; kích thước map và từng zone/phòng chưa được chốt.
- Travel prototype chạy phía client, chưa dùng quyền vào/quest của server; chưa có touch controls hoặc fog-of-war.
- Ngưỡng độ rộng camera PvE mobile 704–720×360 cần kiểm tra trên thiết bị thật; FOV PvP vẫn khóa.
