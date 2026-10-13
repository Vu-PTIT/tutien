# 04 — Map art

## 1. Một câu định hướng

> **Pixel art 32 px, nhìn top-down 3/4; nơi Người ấm như một buổi chiều ngoại ô, nơi Tinh Linh dịu như nắng xuyên tán lá; linh năng là ánh sáng, không phải sơn.**

Tham chiếu tinh thần, không sao chép: **Eastward** (ánh sáng động, đồ vật kể chuyện, thiên nhiên đan vào đô thị), **Stardew Valley** (đời sống cozy, góc nhìn), **Sea of Stars** (pixel + ánh sáng), phim **Ghibli** (thiên nhiên trùm lên công nghệ, tinh linh rừng).

Mượn từ Eastward **phần hình ảnh**, không mượn lối chơi phiêu lưu cutscene. Không gắn với kiến trúc hay biểu tượng của một quốc gia thật.

## 2. Góc nhìn và tỉ lệ

- **Góc nhìn 3/4 thẳng:** lưới vuông, camera chếch từ trên. Thấy mái nhà từ trên xuống, mặt tiền ngắn, mặt đất chiếm phần lớn khung hình. Không isometric hình thoi, không side-view.
- **1 ô = 32 px ≈ 1 m.** Lưới phụ 16 px để đặt đồ.
- **Phóng to số nguyên**, không scale lẻ, không xoay sprite.
  - Khám phá: ×2 (màn 1080p thấy ≈ 30×17 ô).
  - Sinh hoạt/tương tác: ×3.
  - Điện thoại: hệ số nguyên lớn nhất mà vẫn thấy ≥ 11 ô chiều cao.
- **Kiến trúc nén:** 1 tầng nhà = 64 px; mặt tiền chỉ thấy tầng trệt + 1 tầng; tầng cao hơn thể hiện bằng mái, bồn nước, giàn phơi nhìn từ trên.
- **Mặt đất ≥ 55% khung hình** ở zoom mặc định.
- Nhân vật đi sau nhà hoặc tán cây thì phần che mờ đi.

| Đối tượng | Kích thước |
| --- | --- |
| Người / Tinh Linh (dạng người) | Khung 32×48, cao ~42 px, ~3 đầu; tai Tinh Linh được phép vượt khung tới 8 px |
| Tinh Linh dạng thú | 32×32 |
| Cửa đi | 48 px |
| Ghế | 20 px |
| Dị thú nhỏ / vừa / boss | 32×32 / 48–64 px / ≤ 128 px |

## 3. Hình khối theo vùng

| Vùng | Hình khối chủ đạo |
| --- | --- |
| Làng Hồ Lặng | Ngang, thấp, mềm: mái dốc, ruộng, hàng rào, bờ hồ cong |
| Thị trấn trong làng | Khối cao hơn xóm nhà, cửa kính, biển hiệu, dây điện chéo |
| Tường rào, Bìa Rừng | Khối dài thấp: tường bê tông, trạm gác, cỏ cao; khoảng trống lớn |
| Mỏ | Bậc thang đá, đường chéo của băng chuyền, hố sâu |
| Ẩn Giới (Vườn Cây Mẹ) | Tròn, cong, mọc lên từ rễ; nhà là hốc cây, cành, tổ lớn; không có góc vuông |
| Rừng Sâu | Tròn hữu cơ nhưng rối, tán chồng tầng, tối |
| Trạm Thiên Mạch | Vuông lạnh; vật thể lạ là lục giác, đường thẳng tuyệt đối |

**Quy tắc hai tộc:** đồ của Người có **góc vuông, kim loại, nhựa, chữ in**. Đồ của Tinh Linh có **đường cong, gỗ sống, lá, dây leo, ký hiệu vẽ tay**. Ở vùng giữa, hai kiểu này đặt cạnh nhau để kể chuyện.

## 4. Màu

### 4.1 Quy tắc

- Mỗi vùng 24–32 màu; toàn game ≤ 96 màu. Lưu palette `.gpl` trong repo khi bắt đầu vẽ.
- **Bóng không đen/xám:** bóng ngả tím-xanh mát, chỗ sáng ngả vàng ấm.
- **Ngọc lam chỉ dành cho linh năng. Tím chỉ dành cho vật thể ngoài thế giới.** Nước, đèn, UI không dùng hai màu này.
- Tinh Linh có hoa văn ngọc lam trên người (vì là sinh vật linh năng); Người thì không, trừ aura lúc thiền (màu theo vị chiếm nhiều nhất trong Nội Giới).
- UI tương tác dùng vàng kem.

### 4.2 Palette khởi điểm

| Nhóm | Hex |
| --- | --- |
| Linh năng (ngọc lam / lõi sáng) | `#3FD6B8` `#B8FFF0` |
| Vật thể lạ (tím) | `#8F6BFF` |
| Bóng chung | `#2E2A4A` |
| Làng Hồ Lặng: lúa chín, rơm, ngói, cỏ, nước hồ, đất | `#D9B65A` `#E8D49A` `#B5573A` `#6E9A45` `#5C8FA0` `#8A6A4A` |
| Thị trấn: kính xanh, bê tông ấm, biển hiệu đỏ, thép, lá, nhựa đường | `#8FB8C8` `#C9B79C` `#D8443A` `#6F8FA8` `#5E9E4A` `#4A4E5C` |
| Tường rào, Bìa Rừng: bụi, bê tông, gỉ, cỏ, vàng cảnh báo | `#CDBB96` `#9C9A90` `#A1552F` `#93C254` `#F2C230` |
| Mỏ: đất đỏ, đá, đèn mỏ | `#A4553A` `#7A6E66` `#F0B860` |
| Ẩn Giới: lá trong, vỏ cây ấm, rêu sáng, nắng xiên, hoa, trời ngọc nhạt | `#9CCB5E` `#8C6440` `#5FA36A` `#FFE9B0` `#F2A7B8` `#CFEFEA` |
| Rừng Sâu: rêu, lục tối, đá ướt, sương | `#2F5E3B` `#3E5A2E` `#56685F` `#CFE3DD` |
| Trạm: trắng lab, thép, đỏ khẩn, nền tối | `#E6ECF0` `#58636E` `#E0484A` `#15171D` |
| UI: vàng kem, giấy, mực | `#FFE7A8` `#F7F1E3` `#2B2735` |

## 5. Ánh sáng, giờ, thời tiết

Ánh sáng là ưu tiên số 1 vì cho nhiều không khí nhất trên mỗi giờ công.

- Đèn điểm cho đèn đường, quán, đèn mỏ, lồng đèn lá của Tinh Linh, linh năng; nắng nhẹ có hướng.
- Ẩn Giới dùng **tia nắng xiên** (god rays) qua tán lá làm dấu ấn riêng.
- Normal map cho nhà, đồ lớn, Cây Mẹ và mặt đất vùng nhà; nhân vật chỉ dùng viền sáng đơn giản.
- Màu phủ theo giờ, không vẽ lại asset:

| Giờ | Màu phủ | Ghi chú |
| --- | --- | --- |
| Sáng sớm | `#E8EEF5` | Sương |
| Trưa | `#FFFFFF` | Bóng ngắn |
| Chiều vàng | `#FFD9A8` | Giờ đẹp nhất của làng |
| Tối | `#6A6FA8` | Đèn vàng bật; Cây Mẹ và hoa văn Tinh Linh sáng lên |
| Khuya | `#3C3F6E` | Ít người |

- **Thời tiết:** nắng, mưa phùn, mưa rào, sương, **"trời linh"** (dải sáng ngọc lam trên trời).
- Hướng sáng chính: trên-trái; bóng ngả phải-dưới, là sprite riêng mờ tím.

## 6. Mức linh năng

| Mức | Nơi | Biểu hiện |
| --- | --- | --- |
| 0 — vết | Làng Hồ Lặng; dày hơn quanh Cổng | Hạt sáng li ti quanh thảo dược, cá lấp lánh |
| 1 — hiện tượng | Bìa Rừng, Mỏ Bỏ Hoang | Dải sáng trên trời đêm, sương có ánh, vân đá lóe khi đào |
| 2 — dày, dịu | Ẩn Giới | Đom đóm, lá phát sáng, hạt sáng trôi lên từ suối; ấm, chậm |
| 2 — dày, hoang | Rừng Sâu, Hầm Mỏ | Nấm phát quang, vân sáng trên đá; lạnh, rối |
| 3 — cộng hưởng | Trạm | Xoáy, vật thể lơ lửng |
| X — ngoài chuẩn | Hiếm | Lục giác tím, không bóng, nhấp nháy đều 47 giây |

Linh năng: mềm, trôi, hữu cơ. Vật thể lạ: cứng, hình học, đứng yên.

## 7. Đồ vật kể chuyện

Mỗi map dùng ít nhất 3 mục trong nhóm phù hợp:

- **Làng:** giếng, đống rơm, bù nhìn, xe đạp dựng cổng, thùng tưới, gà vịt, trạm xe buýt, cửa hàng tiện lợi, máy bán hàng tự động.
- **Thị trấn:** xe máy, xe buýt, quán cà phê vỉa hè, cột điện bó dây, cửa cuốn, bồn nước trên mái, cục nóng điều hòa, màn LED.
- **Ven đô, mỏ:** đê, cống, trạm bơm, container, barrier bê tông, xe tải bỏ dở có dây leo, máy xúc.
- **Tinh Linh:** nhà trong hốc cây, cầu thang rễ, lồng đèn lá, bùa vẽ tay, tổ chim lớn làm ghế, chuông gió bằng vỏ ốc, vườn nấm, vòng đá.
- **Lớp hậu Linh Chấn:** cảm biến trên cột điện, biển "CẢNH BÁO LINH NĂNG", nhà kính dược liệu, drone giao hàng, chốt kiểm soát, biển "Không săn".

Không dùng: kiến trúc, trang phục, chữ viết hay biểu tượng nhận ra ngay là của một quốc gia thật; mái cong cung điện; cổ phục; núi tiên.

Đồ có trạng thái (cửa đóng/mở, đèn tắt/bật, luống trống/đang lớn/chín) phải vẽ đủ khung trạng thái ngay từ đầu.

## 8. Nhân vật

### 8.1 Chung

- **Một khung thân 32×48** cho cả Người và Tinh Linh dạng người, để quần áo dùng chung.
- 4 hướng. Bộ chuyển động tối thiểu: đứng, đi, ngồi, câu, làm vườn, đào, thiền, tương tác, vẫy, đánh, né.
- Màu da/tóc/áo/lông đổi bằng palette swap, không vẽ lại.
- Chân dung thoại 96×96 với 6 biểu cảm.
- Trang phục hiện đại: áo phông, áo khoác, quần jean, giày thể thao; thợ săn mặc áo khoác kỹ thuật. Sức mạnh thể hiện qua tư thế và aura, không qua cổ phục.
- Nhân vật đang tự hoạt động: viền mờ + icon nhỏ trên đầu.
- Outline 1 px tối màu theo chất liệu, không đen thuần.

### 8.2 Tinh Linh

Thứ tự lớp: bóng → thân → **đuôi sau** → quần áo → đầu → tóc → **tai** → mũ → phụ kiện → **hoa văn phát sáng** → aura.

| Loài | Tai | Đuôi | Hoa văn | Dạng thú (32×32) |
| --- | --- | --- | --- | --- |
| Cáo | Nhọn, to | Dày, chóp sáng | Vệt trên má | Cáo nhỏ |
| Mèo | Tam giác nhỏ | Dài, mảnh | Chấm trên trán | Mèo |
| Hươu | Tai dài + gạc nhỏ | Ngắn | Đốm trên vai | Hươu con |

- Tai và đuôi có animation riêng: vẫy khi vui, cụp khi buồn, dựng khi cảnh giác. Đây là chỗ thể hiện cảm xúc rẻ nhất.
- Quần áo của Người mặc được cho Tinh Linh; mũ có lỗ tai là biến thể riêng.
- **Hóa Thú:** hiệu ứng tan thành hạt ngọc lam rồi tụ lại thành dạng thú (≤ 6 khung). Dạng thú có đứng, chạy, lẩn.

### 8.3 Người và Tinh Linh phải phân biệt được ở ×2

- Tinh Linh có silhouette tai/đuôi rõ ở mọi hướng.
- Hoa văn ngọc lam của Tinh Linh luôn thấy được ban đêm.

## 9. Dị thú

- Bắt đầu từ loài quen thuộc, phóng to một đặc điểm (Lợn Gai = gai lưng; Nhện Tơ Điện = chân dài + tơ sáng; Khỉ Vách Đá = tay dài; Rắn Sương = thân mờ vào sương).
- Tròn, mắt rõ: là động vật, không phải quỷ.
- **Khác Tinh Linh:** dị thú đi bốn chân, mắt không có tròng, hoa văn linh năng rối và nhòe; Tinh Linh có hình gần người, mắt có tròng, hoa văn gọn và đối xứng.
- **Khung báo đòn luôn có ánh ngọc lam.**
- Không máu; hạ gục thì ngã và tan sương.
- Boss Thủ Lĩnh Mạch Gãy: gấu núi khổng lồ, lưng mọc tinh thể tím lục giác, là con dị thú duy nhất có cả ngọc lam lẫn tím.

## 10. Art test — làm trước khi vẽ thêm

Một góc **Làng Hồ Lặng** khoảng 30×17 ô, chạy trong Godot:

1. Nhà người chơi (cửa đóng/mở), vườn 4 luống ở 3 trạng thái, bờ hồ có 1 bến câu, **Quảng trường Cổng với Cổng Ẩn Giới** (vòng sáng xoay, khung thép, chốt gác, lồng đèn lá, góc chợ Tinh Linh), một đoạn tường rào có chốt, cột điện + dây, một xe máy.
2. **Một avatar Người** và **một avatar Tinh Linh Cáo**, dùng chung 2 bộ quần áo; đi/đứng/ngồi/câu 4 hướng; Tinh Linh có thêm dạng thú.
3. Chu kỳ sáng → chiều → tối với 3–4 đèn điểm và normal map cho nhà.
4. Linh năng mức 0 ban đêm; hoa văn Tinh Linh sáng lên.
5. Một Lợn Gai đứng ở mép đê để thấy tương phản làng ↔ ngoài.

**Đạt khi:**
- 5 người chưa biết dự án nhìn ảnh chụp nói được "Người" và "Tinh Linh" là ai trong ≤ 3 giây.
- Phân biệt được Tinh Linh với dị thú ngay lần đầu nhìn.
- Avatar đọc rõ ở ×2 trên điện thoại 6".
- Ảnh chụp buổi tối đặt cạnh ảnh Eastward: thấy "cùng họ ánh sáng" nhưng là một thế giới riêng.
- Ghi lại thời gian vẽ 1 nhà + normal map, 1 bộ quần áo, 1 bộ tai/đuôi/dạng thú để ước tính chi phí cả game.

## 11. Kỹ thuật và quy ước file

- Công cụ: **Aseprite**; nguồn `.aseprite` lưu trong repo, xuất PNG + JSON.
- Godot 4: lọc Nearest, không mipmap, snap pixel; thế giới vẽ trong `SubViewport` theo hệ số zoom nguyên; UI ngoài viewport ở độ phân giải gốc.
- Đèn: `PointLight2D`, `DirectionalLight2D`, `LightOccluder2D`, `CanvasModulate`; normal map qua `CanvasTexture`.
- Thư mục: `client/art/<vùng>/<loại>/<tên>.aseprite` → `client/assets/<vùng>/<loại>/<tên>.png`.
- Tiền tố vùng: `hl` (Làng Hồ Lặng), `ag` (Ẩn Giới), `br` (Bìa Rừng), `rs` (Rừng Sâu), `mb` (Mỏ Bỏ Hoang), `hm` (Hầm Mỏ), `tm` (Trạm Thiên Mạch), `char`, `spirit`, `beast`.
- Tên: `vung_loai_ten_bienthe`, chữ thường, không dấu. Ví dụ `hl_prop_ghe_go`, `rs_flora_nam_phat_quang_a`, `spirit_ear_cao_a`.
- Mỗi asset kèm điểm neo (chân), vùng va chạm và điểm đứng nếu tương tác được.
- Font: Be Vietnam Pro cho UI (đã có, hỗ trợ dấu tiếng Việt); font pixel cho biển hiệu.

## 12. Nguồn asset và AI

- Chỉ dùng asset có license thương mại; lưu license ở `client/assets/LICENSES/`.
- AI tạo ảnh: chỉ dùng cho moodboard nội bộ. Asset đưa vào game phải do người vẽ hoặc chỉnh sửa đáng kể, có ghi chú.
- Không dùng logo, thương hiệu thật.
