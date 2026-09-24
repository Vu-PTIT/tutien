# Thiết kế lại giao diện pixel — 21/09/2026

**Cập nhật map:** 23/09/2026

Thay bản procedural sơ sài bằng tài nguyên hình ảnh và scene Godot có thể
chỉnh trực tiếp. Định hướng từ **Tu Tiên Pixel RPG Concept Sheet**: làng An Khê,
nhà gỗ mái ngói, tre và sông; nhân vật áo xanh trắng; bảng xanh đen viền đồng,
minimap, thanh phím tắt và túi đồ dạng lưới.

## Cấu trúc hiện tại

- `client/scenes/main.tscn`: ghép làng, đấu trường và HUD. Không còn `@tool`
  vẽ một giao diện giả khác với lúc chạy game.
- `client/scenes/map_world.tscn`, `client/scripts/game_map.gd`: scene dùng chung;
  đọc nền, spawn, zone/phòng, blocker và giới hạn camera từ catalog map.
- `client/scenes/player.tscn`, `client/scripts/pixel_actor.gd`: atlas nhân vật
  RGBA bốn hướng, bốn frame/hướng; bóng riêng.
- `client/scenes/ui/hud.tscn`: HP, linh lực, địa danh, minimap, lời nhắn,
  sáu ô phím tắt, bảng kết nối, túi đồ và sơ đồ tuyến map.
- `client/data/map_catalog.json`, `client/scripts/ui/world_map_panel.gd`:
  bốn map, ảnh preview và overlay chọn tuyến; nút **Đi thử map này** tải scene
  cục bộ để kiểm tra, chưa kiểm tra quyền vào phía server.
- `client/scenes/ui/inventory.tscn`: 24 ô, bốn bộ lọc và chi tiết vật phẩm.
  Test dùng chính PackedScene này; không còn ItemList ẩn để giả tương thích.
- `client/themes/tutien_theme.tres`: màu sắc, khung vuông, focus, nút và font
  chung. Font hỗ trợ tiếng Việt, không phải bộ bitmap font thiết kế riêng.
- `client/assets/pixel/`: nền, nhân vật, icon và AtlasTexture; xem `ASSETS.md`.

Khung hình gốc 640 × 360; cửa sổ mặc định 1280 × 720, nearest filtering,
integer viewport scaling và snap transform. Giữ tỷ lệ, không kéo giãn hai
chiều độc lập. Cơ sở cấu hình:
[Godot ProjectSettings 4.6](https://docs.godotengine.org/en/4.6/classes/class_projectsettings.html).

## Cách xem và thao tác

1. Import `client/project.godot`; mở `scenes/main.tscn` để chỉnh scene.
2. **F5** chạy; WASD/mũi tên di chuyển ở map hiện tại. Bấm **M** xem tuyến
   An Khê → Trúc Âm → Thạch Cạn → Cổ Tỉnh; chọn thẻ, rồi bấm **Đi thử map này**
   để chuyển map cục bộ. **Esc** đóng. Ba canvas sau An Khê tạm là 48×36 tile,
   chưa phải kích thước thiết kế đã chốt.
3. **I** mở túi, chọn ô/bộ lọc; **Esc** đóng. Khi offline, túi ghi rõ là mẫu,
   không lưu vào tài khoản, không được nhận vật tư.
4. Đến cửa hiệu thuốc bên trái, **E** xem lời nhắn mẫu. Chưa có NPC tương tác
   hoàn chỉnh hay quest lưu vào server.
5. **Đấu tập → Kết nối** với backend đang chạy. Tạo/vào phòng, hai người sẵn
   sàng; **Q/J/chuột trái** đánh, **Space** né. Combat dùng vị trí, HP và vật cản
   từ server, không dựa vào ảnh nền làng.

Lỗi Antigravity `.lnk` trong log là lỗi cấu hình trình soạn thảo ngoài, không
chứng minh lỗi render. Trong Editor Settings, tìm `text_editor/external`:
tắt Use External Editor hoặc chọn executable thật thay vì shortcut `.lnk`.
Đây là thiết lập máy người dùng, không phải sửa bằng commit project.

## Giới hạn

- Đây là thiết kế lại phần trình bày, chưa phải game hoàn chỉnh.
- Bốn map dùng ảnh nền pixel, **chưa phải TileMap/tileset tách lớp**. Blocker
  là hình chữ nhật thô, chưa khớp từng bụi cây/hàng rào hoặc xử lý che khuất.
- Atlas tạo bằng AI cần nghiệm thu từng frame và chuẩn hóa lưới pixel trước
  phát hành. Nearest không thay thế việc chỉnh pixel thủ công.
- Đấu trường còn nền lưới đơn giản, chưa có đồ họa hoàn thiện.
- Route map có bốn preview và chuyển scene cục bộ; HUD/minimap theo map, tọa độ tile và tên zone/phòng. Cổ Tỉnh đổi giới hạn camera khi vào phòng khác.
- Quy chuẩn chi tiết và phần chưa triển khai ở [04-world-and-maps.md](game-design/04-world-and-maps.md). Server unlock, quest, NPC/PvE, TileMap, va chạm chi tiết, fog-of-war và HUD mobile chưa được nối.
- Không thêm PvE, dùng/trang bị đồ, trồng trọt hoặc nhiệm vụ lưu trữ.
- Không tự gán linh lực đầy/Luyện Khí khi thiếu dữ liệu. Túi thật xóa dữ liệu
  mẫu trước khi tải tài sản từ server.

## Kiểm chứng lần sửa này

- `node scripts/check-pixel-scenes.cjs`: đạt; kiểm resource, node parent,
  catalog/preview bốn map, spawn không nằm trong blocker, 24 ô, hotbar,
  cấu hình pixel và atlas. Đây không phải parser GDScript.
- `npm test --prefix server`: 64/64 đạt; không thay thế test client.
- Godot executable **không có trong môi trường sửa hiện tại**, nên smoke runtime
  chưa chạy. Không kế thừa kết quả Godot/CI của commit cũ cho lần viết lại này.
- `presentation_smoke.gd` bao phủ chuyển bốn map, số zone/phòng, spawn,
	  minimap, blocker và camera khóa phòng; cần chạy bằng Godot để xác nhận.

Chạy trên máy có Godot:

```sh
godot --headless --path client --editor --quit
godot --headless --path client --script res://tests/presentation_smoke.gd
# Có rendering driver: chụp viewport thật, không dùng --headless.
godot --path client --script res://tests/presentation_smoke.gd -- --capture-dir=/absolute/path/captures
```

Ảnh trong `docs/ui-previews/` dựng bố cục tĩnh từ `.tscn` bằng Sharp,
**không phải screenshot engine**. Không chạy script; font/layout/trạng thái
nút có thể khác Godot. Không dùng các ảnh đó để khẳng định runtime đã đạt.
