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
| `cultivator.png` | 256 × 256 RGBA, 18 màu | Atlas 4 × 4, frame native 64 × 64; 4 hướng × 4 bước đi |
| `icons.png` | 1254 × 1254 transparent PNG | 16 icon, nền trong suốt |
| `maps/bai_son_tru.png` | 1586 × 992 RGB | Nền bãi săn cố định; chỉ là phông chiến đấu, bounds do server điều khiển |
| `maps/world_route_overview.png` | 768 × 256 RGB | Sơ đồ tổng quan UI: một đường liên tục An Khê → Trúc Âm → Thạch Cạn → Cổ Tỉnh; không dùng làm map runtime |
| `enemies/son_tru.png` | 192 × 128 RGBA, 13 màu + alpha trong suốt | Sơn Trư combat atlas 3 × 2, ô 64 × 64; dùng chung cho encounter và overworld |
| `enemies/son_tru/clean.png` | 64 × 64 RGBA | Frame Sơn Trư idle để dùng độc lập |
| `enemies/doc_chu/processed/sheet-transparent.png` | 128 × 128 RGBA | Độc Chu atlas 2 × 2, bốn frame 64 × 64; dùng trong mob overworld |
| `enemies/doc_chu/processed/combat-1.png` … `combat-4.png` | 64 × 64 RGBA each | Bốn frame tách riêng cùng thứ tự với atlas |
| `hero_idle.tres` | AtlasTexture | Nhân vật trong editor và chân dung HUD |
| `icon_0.tres` … `icon_15.tres` | AtlasTexture | Icon dùng lại trong HUD/túi |
| `../fonts/BeVietnamPro-Regular.ttf` | Be Vietnam Pro Regular | Font nội dung UI dùng chung; hỗ trợ đầy đủ dấu tiếng Việt; license `../fonts/OFL-BeVietnamPro.txt` |
| `../fonts/BeVietnamPro-SemiBold.ttf` | Be Vietnam Pro SemiBold | Font tiêu đề và nút UI dùng chung; cùng hệ chữ và license OFL 1.1 |

Theme `client/themes/tutien_theme.tres` là nơi khai báo toàn bộ font, độ đậm và cỡ chữ theo token (`UIHeading`, `UIBody`, `UISmall`, `UIMicro`, các kiểu nút và biến thể mobile). Scene và script chỉ chọn token, không ghi cỡ chữ riêng.
Be Vietnam Pro được lấy từ [Google Fonts](https://github.com/google/fonts/tree/main/ofl/bevietnampro), phát hành theo SIL Open Font License 1.1. Hai font pixel cũ (`tiny5_pixel_ui.ttf` và `ui_font.ttf`) được giữ làm tài nguyên legacy, không còn được theme UI sử dụng.

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
6. **Nhân vật:** giữ tóc đen búi cao, dây buộc xanh nhạt, áo trắng-cổ xanh
   đậm, đai nâu và kiếm ngắn. Atlas 4 × 4 có bốn frame đi bộ cho từng hướng;
   cụm pixel vuông, viền tối, palette giới hạn, ô 64 × 64 và chân cùng baseline.
7. **Icon:** atlas pixel RPG 4 × 4 trong suốt, tách ô: bình đỏ, thảo dược,
   giọt nước, cuộn giấy, kiếm, áo giáp, quặng, tre, hạt giống, sổ, tinh thể,
   la bàn, da, nấm, chìa khóa, vệt chém xanh; viền tối, cùng bảng màu.
8. **Bãi Sơn Trư:** `maps/bai_son_tru.prompt.txt`; nền chiến đấu pixel 16-bit,
   khoảng đất thoáng cạnh rừng trúc và suối, không có vật thể cần va chạm hay
   nhân vật. Đây là phông cho encounter cố định, không thay TileMap thế giới.
9. **Sơn Trư:** `enemies/son_tru.prompt.txt`; atlas 3 × 2 gồm idle, báo động,
   lấy đà, giậm chân, lao ngắn và hồi sức; giữ màu nâu hạt dẻ, mõm ấm, ngà
   ngắn và bờm đỏ nâu. Frame 64 × 64, nền magenta đã được tách.
10. **Sơ đồ tuyến:** `maps/world_route_overview.prompt.txt`; panorama pixel RPG
    liền mạch bốn vùng. Đây là nền UI; tên và điểm chọn được vẽ riêng trong Godot.
11. **Độc Chu:** `enemies/doc_chu/prompt-used.txt`; sheet 2 × 2 gồm idle, dịch
    chân, báo trước đòn và co người khi trúng đòn; giữ tám chân, túi độc tím,
    mắt hổ phách và palette xanh ngọc/than. PNG RGBA và GIF preview.

## Quy tắc và việc còn thiếu

- Sprite runtime dùng PNG RGBA với alpha nhị phân, palette giới hạn và
  `TEXTURE_FILTER_NEAREST`; không co giãn AtlasTexture bằng số thực.
- Character và quái dùng frame 64 × 64 ở scale nguyên. Atlas nhân vật xếp hàng
  down/left/right/up; Sơn Trư 3 × 2; Độc Chu 2 × 2. Cả ba sheet qua strict QC:
  không frame rỗng, không chạm mép đầu ra, baseline ổn định.
- Icon hiện vẫn dùng ô 313.5 px; chuẩn hóa icon sang grid pixel-native là việc
  riêng, không nằm trong lần thay sprite nhân vật/quái này.
- Nền làng là một ảnh, không gọi là TileMap; chưa tách tiles/lớp foreground.
- `an_khe_world_v1.png` được thu phóng nearest lên kích thước world 1536×1152;
  va chạm prototype là các blocker chữ nhật, chưa khớp từng bụi cây/hàng rào.
- Ba map mới tạm dùng canvas 48×36 tile để thử route/runtime; kích thước này
  chưa khóa trong quy chuẩn. TileMap/foreground của các zone Trúc Âm, Thạch Cạn,
  Cổ Tỉnh và collision theo terrain vẫn còn thiếu. P2 có phông chiến đấu riêng
  cùng encounter Sơn Trư server-authoritative; đây không phải phần hoàn thiện
  overworld Bãi Sơn Trư.
- Bám phong cách concept, không coi là bản khớp từng pixel.
