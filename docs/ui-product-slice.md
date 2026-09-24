# Thiết kế lại giao diện pixel — 21/09/2026

Thay bản procedural sơ sài bằng tài nguyên hình ảnh và scene Godot có thể
chỉnh trực tiếp. Định hướng từ **Tu Tiên Pixel RPG Concept Sheet**: làng An Khê,
nhà gỗ mái ngói, tre và sông; nhân vật áo xanh trắng; bảng xanh đen viền đồng,
minimap, thanh phím tắt và túi đồ dạng lưới.

## Cấu trúc hiện tại

- `client/scenes/main.tscn`: ghép làng, đấu trường và HUD. Không còn `@tool`
  vẽ một giao diện giả khác với lúc chạy game.
- `client/scenes/an_khe.tscn`: nền làng PNG, nhãn địa điểm, instance nhân vật.
- `client/scenes/player.tscn`, `client/scripts/pixel_actor.gd`: atlas nhân vật
  RGBA bốn hướng, bốn frame/hướng; bóng riêng.
- `client/scenes/ui/hud.tscn`: HP, linh lực, địa danh, minimap, lời nhắn,
  sáu ô phím tắt, bảng kết nối và instance túi đồ.
- `client/scenes/ui/inventory.tscn`: 24 ô, bốn bộ lọc và chi tiết vật phẩm.
  Test dùng chính PackedScene này; không còn ItemList ẩn để giả tương thích.
- `client/themes/tutien_theme.tres`: màu sắc, khung vuông, focus, nút và font
  chung. Font hỗ trợ tiếng Việt, không phải bộ bitmap font thiết kế riêng.
- `client/assets/pixel/`: nền, nhân vật, icon và AtlasTexture; xem `ASSETS.md`.

Khung hình gốc 640 × 360; cửa sổ mặc định 1280 × 720, nearest filtering,
integer viewport scaling và snap transform. Giữ tỷ lệ, không kéo giãn hai
chiều độc lập. Cơ sở cấu hình:
[Godot ProjectSettings 4.4](https://docs.godotengine.org/en/4.4/classes/class_projectsettings.html).

## Cách xem và thao tác

1. Import `client/project.godot`; mở `scenes/main.tscn` để chỉnh scene.
2. **F5** chạy; WASD/mũi tên di chuyển trong phần sân làng đã giới hạn.
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
- Nền An Khê là ảnh minh họa pixel, **chưa phải TileMap/tileset tách lớp**.
  Vùng đi bộ giới hạn ở sân/lối cửa, chưa có collision bám mọi chi tiết,
  đi qua cầu, che khuất nhân vật hoặc camera cuộn.
- Atlas tạo bằng AI cần nghiệm thu từng frame và chuẩn hóa lưới pixel trước
  phát hành. Nearest không thay thế việc chỉnh pixel thủ công.
- Đấu trường còn nền lưới đơn giản, chưa có đồ họa hoàn thiện.
- Không thêm PvE, dùng/trang bị đồ, trồng trọt hoặc nhiệm vụ lưu trữ.
- Không tự gán linh lực đầy/Luyện Khí khi thiếu dữ liệu. Túi thật xóa dữ liệu
  mẫu trước khi tải tài sản từ server.

## Kiểm chứng lần sửa này

- `node scripts/check-pixel-scenes.cjs`: đạt; kiểm resource, node parent,
  24 ô, hotbar, cấu hình pixel và atlas. Không phải parser GDScript.
- `npm test --prefix server`: 64/64 đạt; không thay thế test client.
- Godot runtime **chưa chạy được trong môi trường sửa hiện tại**: executable
  có sẵn segfault ngay khi hỏi version, tải bản thay thế không thành công.
  Không kế thừa kết quả Godot/CI của commit cũ cho lần viết lại này.
- Đã thêm `presentation_smoke.gd` và CI ma trận 4.4.1/4.6.1; **chưa có kết quả
  CI cho thay đổi này**. Live inventory/combat cần chạy lại.

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
