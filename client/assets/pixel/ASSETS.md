# Tài nguyên trình bày pixel

Ảnh An Khê gốc, nhân vật và icon được tạo ngày 21/09/2026 theo concept sheet
Tu Tiên người dùng cung cấp. Bốn nền world được tạo ngày 23/09/2026; các map
mới dùng nền An Khê làm tham chiếu phong cách. Đây là tài nguyên AI-generated,
không phải tileset vẽ/tách thủ công.

| File | Kích thước | Dùng trong project |
| --- | --- | --- |
| `an_khe.png` | 640 × 360 RGB | Nền An Khê, TextureRect 640 × 360 |
| `an_khe_world_v1.png` | 1448 × 1086 RGB | Nền world An Khê 48 × 36 tile; Sprite2D scale 1.0608 đến 1536 × 1152 |
| `truc_am_world_v1.png` | 1448 × 1086 RGB | Ven Suối, Rừng Trúc Sâu, Bãi Sơn Trư; nền prototype ba khu |
| `thach_can_world_v1.png` | 1448 × 1086 RGB | Ngoại Vi và Mỏ Cũ; nền prototype hai khu |
| `co_tinh_world_v1.png` | 1448 × 1086 RGB | Năm phòng nối tiếp; nền prototype dungeon Cổ Tỉnh |
| `cultivator.png` | 1182 × 1330 transparent PNG | 4 hướng × 4 frame, nền trong suốt |
| `icons.png` | 1254 × 1254 transparent PNG | 16 icon, nền trong suốt |
| `hero_idle.tres` | AtlasTexture | Nhân vật trong editor và chân dung HUD |
| `icon_0.tres` … `icon_15.tres` | AtlasTexture | Icon dùng lại trong HUD/túi |
| `ui_font.ttf` | DejaVu Sans | Tiếng Việt; license `FONT-LICENSE.txt` |

## Brief tạo hình (tóm tắt prompt)

1. **Làng preview:** theo phong cách concept sheet; nền pixel RPG top-down 3/4, làng
   tu tiên An Khê Việt/Đông Á, mái ngói/gỗ, tre, vườn, hoa, sông/cầu; sân đá
   trống ở giữa để đi; không HUD, chữ hay nhân vật chính dính trong nền.
2. **Làng world:** dùng `an_khe.png` làm style reference; bố cục mới tỉ lệ 4:3
   với sân giữa rộng, lối liên thông, nhà dược, lò rèn, chợ, vườn sáu ô, cổng
   làng, tre và sông có cầu; không HUD, nhãn, chữ hoặc nhân vật. Asset tạo bằng
   ImageGen ngày 23/09/2026; xem như nền prototype, chưa phải tileset.
3. **Trúc Âm:** tham chiếu phong cách nền An Khê; 4:3 top-down pixel, ba vùng
   Ven Suối/Rừng Trúc Sâu/Bãi Sơn Trư, đường đất liền mạch; không chữ, UI,
   nhân vật hoặc icon.
4. **Thạch Cạn:** tham chiếu nền An Khê; 4:3 top-down pixel, Ngoại Vi sáng và
   Mỏ Cũ tối hơn, đường quặng và trụ chuyển dòng; không chữ/UI/nhân vật.
5. **Cổ Tỉnh:** tham chiếu nền An Khê; dungeon pixel năm phòng nối tiếp từ Cửa
   Giếng đến Tâm Giếng, có rễ độc, buồng cân mạch và nhà trận; không chữ/UI/
   nhân vật.
6. **Nhân vật:** tóc đen búi cao, áo xanh trắng, viền tối, bóng pixel;
   atlas 4 × 4 trong suốt, bốn frame/hướng trước/trái/phải/sau, cùng nhân vật
   và tỷ lệ nhất quán, không chữ hay UI.
7. **Icon:** atlas pixel RPG 4 × 4 trong suốt, tách ô: bình đỏ, thảo dược,
   giọt nước, cuộn giấy, kiếm, áo giáp, quặng, tre, hạt giống, sổ, tinh thể,
   la bàn, da, nấm, chìa khóa, vệt chém xanh; viền tối, cùng bảng màu.

## Quy tắc và việc còn thiếu

- Giữ PNG gốc; dùng AtlasTexture, không xóa nền bằng script.
- Nearest filtering, viewport 640 × 360, integer window scaling.
- Icon dùng ô 313.5 px. Nhân vật bước 295.5 × 332.5 px, crop 225 × 305 px.
  Đây là số theo ảnh sinh ra, **không phải atlas native 16/32 px chuẩn
  production**. Cần kiểm animation/jitter và chuẩn hóa trước phát hành;
  chưa nghiệm thu animation bằng Godot tại đây.
- Nền làng là một ảnh, không gọi là TileMap; chưa tách tiles/lớp foreground.
- `an_khe_world_v1.png` được thu phóng nearest lên kích thước world 1536×1152;
  va chạm prototype là các blocker chữ nhật, chưa khớp từng bụi cây/hàng rào.
- Ba map mới tạm dùng canvas 48×36 tile để thử route/runtime; kích thước này
  chưa khóa trong quy chuẩn. Collider, TileMap, foreground và gameplay encounter
  còn thiếu.
- Bám phong cách concept, không coi là bản khớp từng pixel.
