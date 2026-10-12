# 11 — World Bible: thế giới nhìn thấy được

**Trạng thái:** canon hình ảnh/không gian, 12/10/2026, nhánh `feat/map-ui-rebuild`.
**Giữ nguyên:** lore, mốc thời gian, tổ chức, NPC và dị thú trong [04](04-world-setting-vietnam-awakening.md) và [05](05-story-bible.md).
**Thay thế:** mọi giả định hình ảnh rút ra từ demo làng (`layered_village_m1`, `legacy_linh_khe`). Hai scene đó là **tech demo, không phải canon thế giới**.
**Đọc cùng:** [12 — Art Bible](12-art-bible.md) cho thông số vẽ; [01](01-vision-and-core-loop.md)/[09](09-dual-experience-platform.md) cho vòng sản phẩm.

## 1. Vấn đề cần thống nhất

Các tài liệu hiện có kéo về hai hướng:

| Nguồn | Lời hứa | Cảm giác |
| --- | --- | --- |
| 04/05 (lore) | ra khỏi vùng an toàn, săn, sống sót, bí ẩn vũ trụ | căng, hậu biến cố |
| 01/08/09 (sản phẩm) | thị trấn sinh hoạt, câu cá, làm vườn, gặp bạn, avatar tự hoạt động | ấm, thư giãn, Gen Z |
| Demo làng | làng quê, asset fantasy chung chung | trung tính, không giống Việt Nam hiện đại |

Demo làng còn vi phạm 04 §12.1 ("không dựng lại làng cổ làm hub"). Tài liệu này chọn một khung duy nhất để mọi map, prop, nhân vật và UI cùng kể một thế giới.

## 2. Khung thống nhất: "Trong ngõ thì ấm, ngoài vành đai thì lạ"

Sáu năm sau Linh Chấn, với thế hệ người chơi, linh năng giống **thời tiết**: có ngày đẹp, có ngày báo động, nhưng cuộc sống vẫn tiếp tục. Đây là "bình thường mới", không phải tận thế.

- **Tiền cảnh (nơi người chơi sống, 70% thời gian):** một khu phố trong Căn cứ Thăng Long. Nhà ống, mái bằng trồng dược liệu, quán trà đá, chợ, hồ để câu, bạn bè đi ngang. Cozy, đông người, nhiều chi tiết đời thường.
- **Hậu cảnh (nơi người chơi chọn đi, phiêu lưu):** Vành Đai Tây, Rừng Ba Vì. Thưa người, gió, âm thanh môi trường mạnh, linh năng rõ hơn. Không bắt buộc.
- **Điểm mờ (bí ẩn):** Trạm Thiên Mạch và "tàn tích ngoài chuẩn". Hiếm, lạnh, khác hẳn hai lớp trên.

Quy luật hình ảnh tương ứng: **càng xa nhà → bão hòa giảm, tương phản tăng, linh năng mạnh hơn, con người ít hơn.**

Cách lore khớp vòng sản phẩm:
- Làm vườn mái nhà / trồng dược liệu = hậu cần căn cứ (05 §3: nhà kính, dược liệu quyết định căn cứ sống được tới đâu).
- Câu cá ở hồ trong căn cứ = hồ Hà Nội, cá biến dị nhẹ, an toàn.
- Thiền = hấp thụ linh năng ở điểm yên tĩnh (sân thượng, chùa trong phố, bờ hồ sáng sớm).
- Avatar tự hoạt động = người dân ai cũng có "ca" của mình: trực vườn, đi câu, ngồi quán.
- PvE = nhận hợp đồng Liên hiệp Thợ Săn, đi ra vành đai rồi **về nhà**.

## 3. Trụ cột cảm xúc (dùng để duyệt mọi màn)

1. **Nhận ra Việt Nam ngay** — trong 3 giây nhìn screenshot phải thấy Việt Nam hiện đại (biển hiệu, xe máy, dây điện, mái tôn, ghế nhựa).
2. **Sống được ở đây** — khu hub phải có chỗ ngồi, chỗ làm, chỗ gặp bạn; không phải sân khấu trống.
3. **Linh năng đẹp và lạ, không xấu xí** — giống cực quang, đom đóm, sương phát sáng; không phải bùn độc hay neon cyberpunk.
4. **Đi xa thì đáng sợ vừa đủ** — rủi ro đọc được từ môi trường (cảnh báo, rào, xác xe, dấu cào), không gore.
5. **Bí ẩn nằm ở chi tiết** — vật thể "không khớp" xuất hiện rất ít, luôn có cùng một ngôn ngữ hình (xem §6).

## 4. Bốn vùng MVP — bản sắc hình ảnh

ID backend giữ theo 04 §4.

### 4.1. Căn cứ Thăng Long (hub) — `m_thang_long`
- **Lát cắt đầu tiên:** một **ngõ + bờ hồ** (thay thế demo làng). Có nhà người chơi, quán trà đá, sạp chợ, bến câu, sân thượng vườn, trạm Viện Linh học nhỏ, chốt điện tử của khu.
- **Kiến trúc:** nhà ống 3–4 m mặt tiền, 2–5 tầng, cửa cuốn tầng trệt, ban công sắt, mái bằng có bồn nước inox, giàn phơi, chậu cây; vài nhà vàng kiểu Pháp; chung cư cũ có lồng sắt ban công; một mái chùa/đình nhỏ trong phố.
- **Lớp Linh Chấn:** dải cảm biến linh phổ trên cột điện, màn LED cảnh báo dạng biển giao thông, mái nhà kính dược liệu, dây điện có hộp lọc linh năng, cây đường phố hơi to bất thường.
- **Thực vật:** bàng, sấu, hoa sữa, bằng lăng; dây trầu bà, hoa giấy trên ban công; dược liệu linh biến lá phát sáng nhẹ ban đêm.
- **Người:** đông. Bán hàng, shipper, học sinh, bác bảo vệ, đội tuần tra nghỉ ca. Ban đêm vẫn có quán.
- **Âm thanh:** xe máy xa, rao hàng, tiếng chim, chuông chùa, loa phường phát cảnh báo linh năng như dự báo thời tiết.
- **Màu chủ:** vàng đất ấm, đỏ ngói/biển hiệu, xanh lá cây đường phố; bóng tím mát.

### 4.2. Vành Đai Tây — `m_vanh_dai_tay`
- **Kiến trúc/hạ tầng:** đoạn đường vành đai cao tốc đứt, barrier bê tông, container làm trạm gác, khu công nghiệp mái tôn dài, trạm biến áp, đê, mương thủy lợi, ruộng lúa xen nhà xưởng.
- **Lớp Linh Chấn:** tháp cảm biến có đèn trạng thái, lưới chắn dị thú, vết cày của Lợn Gai Sơn, xe tải bỏ dở có dây leo.
- **Người:** thưa; Đội Vành Đai Tây, xe tuần tra, thợ săn đi theo nhóm.
- **Âm thanh:** gió đồng, côn trùng, máy phát điện, radio tuần tra.
- **Màu chủ:** be bụi, xám bê tông, gỉ sét, xanh lúa; vàng cảnh báo là màu nhấn duy nhất bão hòa.

### 4.3. Rừng Ba Vì Dị Biến — `m_ba_vi`
- **Địa hình:** rừng ẩm nhiều tầng, suối đá, bậc thang leo núi cũ, trạm kiểm lâm bỏ hoang, đền/miếu cũ trên sườn, sương sớm.
- **Lớp Linh Chấn:** dương xỉ khổng lồ, nấm phát quang, rễ quấn cột điện, đá có vân linh mạch, đom đóm linh năng. Rắn Sương ẩn trong sương thấp.
- **Người:** gần như không; trạm dừng chân tạm của Liên hiệp Thợ Săn.
- **Âm thanh:** nước, côn trùng rừng, tiếng gọi của Khỉ Vách Đá.
- **Màu chủ:** xanh rêu sâu, xanh lục tối, đá ướt; điểm sáng xanh ngọc của linh năng.

### 4.4. Trạm Thiên Mạch Ba Vì — `m_tram_thien_mach`
- **Kiến trúc:** công trình ngầm tiền Linh Chấn: hành lang bê tông, cửa chống cháy, phòng máy, biển chỉ dẫn tiếng Việt đã cũ. Càng sâu càng xuất hiện **vật liệu ngoài chuẩn**.
- **Màu chủ:** trắng lạnh, xám thép, đỏ khẩn cấp; tím dị thường chỉ ở lõi cộng hưởng.
- **Cảm giác:** im lặng, đèn chập chờn, nhịp xung đều đặn (lore 05 §7).

## 5. Từ vựng "Việt Nam hiện đại" (kho prop chung)

Mỗi map phải dùng ít nhất 3 mục (04 §12.3):

- **Đường phố:** xe máy, xe đạp điện, ghế nhựa đỏ/xanh, bàn inox thấp, xe đẩy hàng rong, biển hiệu chữ Việt có dấu, cột điện bó dây, hộp công tơ, vỉa hè lát gạch, cây có vòng sơn trắng gốc.
- **Nhà:** cửa cuốn, ban công sắt hoa văn, bồn nước inox, giàn phơi, bàn thờ ông địa đỏ, chậu cây xốp trên mái, điều hòa cục nóng.
- **Đồng quê/ven đô:** đê, cống thủy lợi, cót phơi thóc, rơm, bù nhìn, mộ đồng, trạm bơm.
- **Thiết chế:** loa phường, bảng tin tổ dân phố, trạm y tế, cổng trường, trạm xăng.
- **Lớp hậu Linh Chấn:** máy quét linh phổ, cảm biến cột điện, biển "CẢNH BÁO LINH NĂNG", nhà kính dược liệu, drone giao hàng, chốt kiểm soát Vành Đai.

Không dùng: lồng đèn đỏ kiểu Trung Hoa làm trang trí chủ đạo, mái cong cung điện, trang phục cổ trang cho dân thường, tông môn núi tiên.

## 6. Ngôn ngữ thị giác của linh năng

| Mức | Nơi gặp | Biểu hiện | Màu |
| --- | --- | --- | --- |
| 0 — vết | hub | hạt sáng li ti quanh dược liệu, lá cây đêm | ngọc lam nhạt, alpha thấp |
| 1 — hiện tượng | vành đai | dải sáng như cực quang trên trời đêm, sương có ánh | ngọc lam |
| 2 — dày đặc | Ba Vì | đom đóm, vân sáng trên đá, cây phát quang, gợn khí | ngọc lam + vàng nhạt |
| 3 — cộng hưởng | điểm cộng hưởng | xoáy, vật thể lơ lửng, quy luật lạ | ngọc lam bão hòa cao |
| X — ngoài chuẩn | Thiên Mạch, tàn tích | hình học quá hoàn hảo (lục giác, đường thẳng tuyệt đối), tím, không có bóng | tím dị thường |

Quy tắc:
- **Ngọc lam chỉ dành cho linh năng.** UI tương tác, nước thường, đèn đường không được dùng cùng sắc độ.
- **Tím dị thường chỉ dành cho "ngoài chuẩn".** Xuất hiện rất ít; mỗi lần xuất hiện là một manh mối.
- Linh năng là hiệu ứng lớp trên, không tô lại mọi vật thể.
- Hình dạng: mềm, trôi, hữu cơ. "Ngoài chuẩn": cứng, hình học, tĩnh.

## 7. Dị thú — quy tắc hình

- Bắt đầu từ loài Việt Nam quen thuộc; khuếch đại 1 đặc điểm thành silhouette (Lợn Gai Sơn = gai lưng, Nhện Tơ Điện = chân dài + mạng sáng, Khỉ Vách Đá = tay dài, Rắn Sương = thân mờ dần vào sương).
- Đường nét tròn, khối to, mắt đọc được — dị thú là động vật, không phải quỷ.
- Bộ phận bị linh năng tác động có màu ngọc lam; dị thú bị cộng hưởng nhân tạo (boss Thủ Lĩnh Mạch Gãy) có thêm vết tím.
- Không máu đỏ tươi; hạ gục = ngã, tan sương hoặc chạy đi.

## 8. Thời gian, thời tiết, mùa

- **Giờ trong ngày:** sáng sớm (sương, tập thể dục bờ hồ) → trưa (nắng gắt, bóng ngắn) → chiều vàng (giờ đẹp nhất của hub) → tối (đèn quán, linh năng mức 0 hiện rõ) → khuya (ít người, avatar tự động đi ngủ/thiền).
- **Thời tiết:** nắng, mưa phùn, mưa rào, nồm (sương mờ trong nhà), **"trời linh"** — dải sáng linh năng trên trời, tương đương báo động nhẹ, thêm tài nguyên ở vành đai.
- **Mùa miền Bắc:** xuân (mưa phùn, hoa đào/ban), hạ (phượng, bằng lăng, nắng), thu (hoa sữa, lá vàng), đông (sương, áo phao). Mùa đổi palette và trang phục NPC.

## 9. Con người và trang phục

- Dân thường: áo phông, sơ mi, áo chống nắng, mũ bảo hiểm, dép tổ ong, áo phao mùa đông.
- Thợ săn/tuần tra: áo khoác kỹ thuật, giáp nhẹ ghép vật liệu dị thú, túi đeo, máy quét linh phổ ở hông. Hiện đại, thực dụng; không áo choàng tu tiên.
- Tu luyện thể hiện qua tư thế, aura và phụ kiện (vòng tay tinh khoáng, đai lưng), không qua cổ phục.
- Người chơi Gen Z: trang phục streetwear Việt là nhóm cosmetic chính.

## 10. Bảng kiểm khi duyệt một map

- [ ] Có ≥ 3 dấu hiệu Việt Nam hiện đại (§5).
- [ ] Biết map ở lớp nào (tiền cảnh / hậu cảnh / điểm mờ) và palette tương ứng.
- [ ] Linh năng đúng mức (§6); không lạm dụng ngọc lam/tím.
- [ ] Vùng nguy hiểm giải thích được vì sao dân không sống ở đó (04 §12.4).
- [ ] Công nghệ còn giá trị (04 §12.5): có ít nhất một thiết bị/hạ tầng hoạt động.
- [ ] Hub có chỗ để avatar làm hoạt động tự động (slot ngồi, câu, vườn, thiền).
