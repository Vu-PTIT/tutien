# Tài nguyên trình bày pixel

Tạo ngày 21/09/2026 bằng ImageGen, tham chiếu concept sheet Tu Tiên người dùng
cung cấp. Tài nguyên AI-generated, không phải tileset vẽ/tách thủ công.

| File | Kích thước | Dùng trong project |
| --- | --- | --- |
| `an_khe.png` | 640 × 360 RGB | Nền An Khê, TextureRect 640 × 360 |
| `cultivator.png` | 1182 × 1330 transparent PNG | 4 hướng × 4 frame, nền trong suốt |
| `icons.png` | 1254 × 1254 transparent PNG | 16 icon, nền trong suốt |
| `hero_idle.tres` | AtlasTexture | Nhân vật trong editor và chân dung HUD |
| `icon_0.tres` … `icon_15.tres` | AtlasTexture | Icon dùng lại trong HUD/túi |
| `ui_font.ttf` | DejaVu Sans | Tiếng Việt; license `FONT-LICENSE.txt` |

## Brief tạo hình (tóm tắt prompt)

1. **Làng:** theo phong cách concept sheet; nền pixel RPG top-down 3/4, làng
   tu tiên An Khê Việt/Đông Á, mái ngói/gỗ, tre, vườn, hoa, sông/cầu; sân đá
   trống ở giữa để đi; không HUD, chữ hay nhân vật chính dính trong nền.
2. **Nhân vật:** tóc đen búi cao, áo xanh trắng, viền tối, bóng pixel;
   atlas 4 × 4 trong suốt, bốn frame/hướng trước/trái/phải/sau, cùng nhân vật
   và tỷ lệ nhất quán, không chữ hay UI.
3. **Icon:** atlas pixel RPG 4 × 4 trong suốt, tách ô: bình đỏ, thảo dược,
   giọt nước, cuộn giấy, kiếm, áo giáp, quặng, tre, hạt giống, sổ, tinh thể,
   la bàn, da, nấm, chìa khóa, vệt chém xanh; viền tối, cùng bảng màu.

## Quy tắc và việc còn thiếu

- Giữ PNG gốc; dùng AtlasTexture, không xóa nền bằng script.
- Nearest filtering, viewport 640 × 360, scale nguyên.
- Icon dùng ô 313.5 px. Nhân vật bước 295.5 × 332.5 px, crop 225 × 305 px.
  Đây là số theo ảnh sinh ra, **không phải atlas native 16/32 px chuẩn
  production**. Cần kiểm animation/jitter và chuẩn hóa trước phát hành;
  chưa nghiệm thu animation bằng Godot tại đây.
- Nền làng một ảnh, không gọi là TileMap. Cần tách tiles/lớp foreground và
  collision khi mở rộng world gameplay.
- Bám phong cách concept, không coi là bản khớp từng pixel.
