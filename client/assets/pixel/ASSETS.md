# Tài nguyên pixel đang dùng trong client

| File | Kích thước | Dùng trong project |
| --- | --- | --- |
| `cultivator.png` | 256 × 256 RGBA | Atlas nhân vật 4 × 4; frame 64 × 64 |
| `hero_idle.tres` | AtlasTexture | Chân dung trong HUD |
| `enemies/son_tru/clean.png` | 64 × 64 RGBA | Sprite Sơn Trư trong encounter |
| `icons.png` | 1254 × 1254 PNG | Atlas 16 icon |
| `icon_0.tres` … `icon_15.tres` | AtlasTexture | Icon dùng trong HUD và túi đồ |
| `../fonts/BeVietnamPro-Regular.ttf` | Be Vietnam Pro Regular | Font nội dung, hỗ trợ tiếng Việt; license tại `../fonts/OFL-BeVietnamPro.txt` |
| `../fonts/BeVietnamPro-SemiBold.ttf` | Be Vietnam Pro SemiBold | Font tiêu đề và nút; license SIL OFL 1.1 |

Theme `client/themes/tutien_theme.tres` khai báo font, cỡ chữ và biến thể dùng chung. Scene và script chọn token từ theme.

Be Vietnam Pro lấy từ [Google Fonts](https://github.com/google/fonts/tree/main/ofl/bevietnampro), phát hành theo SIL Open Font License 1.1. Các font pixel cũ được giữ làm tài nguyên legacy và không được theme sử dụng.

Sprite runtime dùng PNG RGBA với alpha nhị phân và `TEXTURE_FILTER_NEAREST`. Character và Sơn Trư dùng frame 64 × 64 ở scale nguyên.
