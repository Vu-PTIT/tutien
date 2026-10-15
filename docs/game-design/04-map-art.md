# 04 — Quy chuẩn hình ảnh map

**Chuẩn hiện hành:** fantasy cổ trên một thế giới gồm hai khu chính của Người (Làng, Thành phố), làng Tâm Ẩn và Lục Đại. Mỗi vùng Lục Đại có hai khu quái Rìa, một Trung, một Cao. Không dùng bố cục địa danh cũ.

## 1. Góc nhìn và đơn vị

- Pixel art top-down 3/4: camera nhìn chếch từ trên, thấy mặt đất và mặt tiền ngắn của công trình.
- Bố cục gameplay tính trên lưới logic vuông; không isometric hình thoi.
- **1 ô logic = 32 px.** Đây là hệ quy chiếu tọa độ/kích thước map, không phải kích thước asset bắt buộc.
- Vật thể đặt tự do theo pixel nguyên; không bắt snap ô hoặc có kích thước bội 32.
- Lọc Nearest, zoom nguyên, không scale phân số gây nhòe.

## 2. Ngôn ngữ hình ảnh theo khu

- **Làng Người:** ấm, gần gũi, đường và cụm nhà dễ đọc; đồ vật đời sống tạo dấu ấn.
- **Thành phố Người:** mật độ kiến trúc cao hơn, có trục đường/quảng trường và các cụm chức năng rõ.
- **Làng Tâm Ẩn:** tự nhiên, cân bằng, nhà gắn địa hình; cây trung tâm là vật mốc, ánh linh năng dịu và cục bộ.
- **Sáu vùng Lục Đại:** mỗi vùng có địa hình, màu và vật liệu gắn hệ trội. Hai map Rìa cần khác nhau về địa hình; Trung và Cao tăng độ phức tạp bằng hình khối/đường đi, không chỉ đổi palette.

Mọi map dùng chung góc nhìn, mật độ pixel, hướng sáng và cách tô bóng để thuộc cùng một game. Không dùng công trình/biểu tượng của quốc gia thật; không thêm máy móc hiện đại nếu không có trong bối cảnh đã duyệt.

## 3. Pixel và tỉ lệ vật thể

Nhân vật là thước đo chung, khoảng 32×48 px cho dạng người. Đồ vật có thể lớn hoặc nhỏ tùy hình dáng; neo ở chân, collision chỉ phủ phần thực sự cản đường. Cửa, ghế, cây và nhà không bị ép vào ô 32 px.

## 4. Màu và linh năng

Sáu hệ có màu lõi riêng, nhưng màu phát sáng không thay màu vật liệu. Mộc xanh, Thủy xanh nước, Kim bạc, Phong trắng xanh, Thổ vàng đất, Hỏa cam đỏ. Ẩn/ngọc lam chỉ dùng cho Tâm Ẩn và vật chất Ẩn; tím lục giác chỉ cho vật chất lạ nếu cốt truyện dùng.

Linh năng đi theo địa hình và điểm tụ; không rải đều để trang trí. Lõi pixel sắc, quầng nhỏ, không bloom toàn cảnh. Nhân vật, đường đi và vật tương tác luôn rõ.

## 5. Năm nhóm hình ảnh

| Nhóm | Nội dung |
|---|---|
| **G1 — Nền** | Đất, cỏ, đường, bờ nước và dấu tĩnh; nền có thể vẽ theo khối liền |
| **G2 — Nước** | Mặt nước, mask, gợn và phản chiếu |
| **G3 — Vật thể/nhân vật** | Công trình, cây, vật dụng, NPC, người chơi, quái; Y-sort theo chân |
| **G4 — Phần che** | Mái/tán cần mờ hoặc che nhân vật |
| **G5 — Hiệu ứng/ánh sáng** | Linh năng, đèn, hạt, sương, ngày đêm |

Đây là nhóm chức năng, không phải năm ảnh nền phủ map. Bóng tĩnh có thể đi cùng vật; chỉ tách khi cần điều khiển riêng. Dữ liệu collision, đường đi, điểm tương tác, safe zone và lãnh địa quái nằm riêng.

## 6. Quy tắc bố cục

- Mỗi màn chơi có một điểm nhìn hoặc vật mốc; giữ đường đi sạch để điều hướng.
- Làng, Thành phố và Tâm Ẩn phải đọc được lối vào, quảng trường/khu chung, dịch vụ và đường ra.
- Rìa A/B có lối khám phá dễ đọc và vùng né; Trung có tuyến/chướng ngại; Cao có vật mốc và đường rút lui.
- Vật tương tác là đối tượng riêng có ID, trạng thái, điểm đứng và footprint.
- Khi hai map nối trực tiếp, địa hình/đường/nước ở mép phải khớp. Không ghép mép cho hầm, nhà riêng hay tuyến dịch chuyển.
- Hiệu ứng không che nhân vật/quái, cửa, điểm tương tác hoặc dấu hiệu báo đòn.

## 7. Tài liệu nguồn

Ảnh concept chỉ minh họa ngôn ngữ hình ảnh, không xác định tọa độ, số lượng map hay đường nối. Nội dung chính thức lấy từ [03](03-world-and-maps.md), layout từ [05](05-map-layouts.md), danh mục từ [12](12-ban-do-cac-khu.md).