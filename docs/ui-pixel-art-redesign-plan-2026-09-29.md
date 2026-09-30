# Kế hoạch làm lại giao diện pixel art

Ngày rà soát: 29/09/2026
Dự án: Godot `Vu-PTIT/tutien`

## Hướng thiết kế

Giữ phong cách Tu Tiên 2D top-down: nền xanh đêm, viền đồng cũ, điểm nhấn ngọc lam, giấy ngà và gỗ sẫm. UI vẫn dùng lưới tham chiếu 640×360, scale số nguyên, cùng nét pixel với map 32 px. Cùng một bộ khung dùng cho HUD, túi đồ, nhân vật, bản đồ tuyến, bang hội/chat và nút cảm ứng; mobile thay bố cục, khoảng cách và vùng chạm.

Ảnh UI chỉ chứa khung, nền, icon và trạng thái nút. Mọi câu chữ tiếp tục là `Label`, `RichTextLabel`, `LineEdit` hoặc `Button.text` của Godot để giữ dấu tiếng Việt, đổi ngôn ngữ và co giãn theo màn hình.

## Chẩn đoán chữ biến mất

- `tutien_theme.tres` dùng `ui_font.ttf` làm font chung. File ở đầu nhánh `feat/p4-map-pixel-art` có chữ ký nhị phân không phải TTF/OTF hợp lệ, nên nội dung không thể được nạp như Handjet. Godot dùng font dự phòng khi font theme thiếu hoặc không hợp lệ; vì vậy đây là lỗi tài nguyên đã xác nhận, dù riêng nó chưa chứng minh được vì sao toàn bộ chữ biến mất.
- Đã thay file font trong working tree bằng Handjet từ kho Google Fonts chính thức. File có 1.339 glyph, kiểm tra đủ bộ chữ tiếng Việt, và khớp Git blob SHA `3d3ca23394c416119bf7cedef7fca95fac94777e`. Đã thêm kiểm tra chữ ký SFNT vào `scripts/check-pixel-scenes.cjs`.
- Các panel HUD hiện tại trong `hud.tscn` và `inventory.tscn` dùng `StyleBoxFlat`; bản đang rà chưa có lớp ảnh UI mới để xác định chính xác sự cố che chữ. Khi thêm art, cần giữ đúng thứ tự vẽ: Godot vẽ `CanvasItem` theo thứ tự scene tree nếu cùng Z-index; node ở trước có thể phủ node chữ ở sau.
- Nhiều dòng HUD hiện dùng cỡ 7–9 px trên viewport 640×360. Plan mới đặt tối thiểu 10 px cho chữ desktop và 12 px cho mobile; con số đếm phụ có thể nhỏ hơn khi vẫn đọc được ở ảnh chụp thực tế.

## Nguồn tài nguyên được chọn để thử

| Nguồn | Dùng cho | Điều khoản và nhận xét |
| --- | --- | --- |
| [Kenney UI Pack - Pixel Adventure](https://kenney.nl/assets/ui-pack-pixel-adventure) | Bộ nền thử cho panel, nút, thanh và thanh cuộn pixel | 500 tệp, CC0, phát hành 2024. Bắt đầu bằng một panel HUD để kiểm độ khớp palette. |
| [Kenney Fantasy UI Borders](https://kenney.nl/assets/fantasy-ui-borders) | Viền trang trí cho cửa sổ túi đồ, nhân vật và hội thoại | 140 tệp, CC0, phát hành 2023. Chỉ dùng làm điểm nhấn để không khiến HUD quá nhiều hoa văn. |
| [Kenney UI Pack (RPG Expansion)](https://kenney.nl/assets/ui-pack-rpg-expansion) | Phương án phụ cho thành phần RPG cổ điển | 85 tệp, CC0, phát hành 2014; cần kiểm tra phong cách trước khi trộn vào bộ chính. |
| [HollowShell 16×16 Pixel Art UI](https://hollowshell.itch.io/16-x-16-pixel-art-ui-asset-pack) | Tham khảo prompt chuột/bàn phím/gamepad và khung 9-slice nhỏ | CC0; trang hiện yêu cầu mua từ 1,25 USD. Không cần nếu bộ Kenney đã đủ. |
| [Handjet — Google Fonts / Rosetta Type](https://github.com/rosettatype/handjet) | Font pixel cho chữ UI | OFL-1.1; giữ nguyên file license trong repo. Bản đã kiểm tra có đủ glyph tiếng Việt. |

> Kenney xác nhận các asset trên trang của họ là CC0, dùng được trong dự án thương mại và không bắt buộc ghi công. Lưu bản license/provenance của từng pack vào thư mục asset khi nhập vào dự án.

## Quy tắc đưa art vào Godot

1. Tạo một bộ skin thống nhất: panel, tab, button ở trạng thái thường/hover/focus/pressed/disabled, slot đồ, thanh HP/khí, separator và icon thao tác. Giữ họa tiết phụ thưa để chữ sáng vẫn nổi trên nền tối.
2. Đưa khung co giãn vào `StyleBoxTexture` của `Theme` hoặc dùng `NinePatchRect`; 9-slice giữ nguyên góc, còn cạnh và giữa lặp/co theo panel. Ưu tiên texture-filter nearest và scale nguyên.
3. Không thêm ảnh phủ toàn panel sau các node chữ. Nếu dùng `NinePatchRect` riêng, đặt nó ở lớp nền trước phần `Content`; ảnh trang trí đặt `mouse_filter = IGNORE`. Không sửa `z_index` hàng loạt để chữa thứ tự sai.
4. Không raster hóa chữ vào ảnh nút, tab hoặc khung. Giữ Handjet cho tiêu đề/nhãn ngắn và chat; mọi câu chữ phải còn chọn được, đọc được và có đầy đủ dấu tiếng Việt.
5. Màu chữ chính dùng ngà sáng, chữ phụ xanh xám sáng, nhấn vàng đồng; không đặt chữ trực tiếp lên vùng minh họa nhiều chi tiết.

## Các bước triển khai

1. **Khóa lỗi chữ:** chạy kiểm tra font và import Godot; xác nhận font không fallback, kiểm tra các câu `Túi đồ`, `Vật liệu`, `Bang hội`, `Điều kiện`, `Tiếng Việt đủ dấu`.
2. **Thử một màn:** dùng Kenney Pixel Adventure làm nguồn chính, thử viền Fantasy UI Borders trên một cửa sổ túi đồ; kiểm palette, kích thước 9-slice, độ tương phản và thứ tự vẽ trước khi thay các màn khác.
3. **Chuẩn hóa theme:** tạo style dùng chung trong `tutien_theme.tres`; đổi HUD và túi đồ trước, sau đó nhân vật, bản đồ tuyến, bang hội/chat và touch controls. Giữ logic, node path và tín hiệu hiện có.
4. **Kiểm tra desktop/mobile:** chụp Godot thật ở cửa sổ 640×360 và các mức scale nguyên; kiểm trạng thái thường/focus/pressed/disabled, mở/đóng panel, ô đồ có số lượng, text dài và tiếng Việt.
5. **Chấp nhận:** không còn chữ nằm trong ảnh hoặc bị nền che; chữ chính đạt cỡ tối thiểu theo nền tảng; không mất nhãn khi chuyển art; font/import không báo lỗi; asset có nguồn và license ghi lại.

Godot hiện có job CI để import project, chạy presentation smoke test và chụp layout desktop/touch; dùng ảnh chụp đó làm cổng nghiệm thu sau khi skin được tích hợp.

## Tài liệu tham khảo kỹ thuật

- [Godot `NinePatchRect`](https://docs.godotengine.org/en/stable/classes/class_ninepatchrect.html): panel 9-slice giữ góc và co phần cạnh/giữa.
- [Godot `CanvasItem`](https://docs.godotengine.org/en/4.5/classes/class_canvasitem.html): thứ tự vẽ theo Z-index và scene tree.
- [Godot `Theme`](https://docs.godotengine.org/en/4.5/classes/class_theme.html): font mặc định của theme và font engine dự phòng khi resource không hợp lệ.
- [Google Fonts glyphsets](https://github.com/googlefonts/glyphsets): bộ Latin Vietnamese gồm dấu mở rộng và ký tự ghép cho tiếng Việt.
