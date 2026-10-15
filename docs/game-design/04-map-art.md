# 04 — Map art

**Cập nhật quy chuẩn 15/10/2026:** dùng 5 nhóm hình ảnh; 32 px là đơn vị logic; ưu tiên độ nét và khả năng đọc cảnh. Quy chuẩn này thay cách bắt buộc tách L0–L9 trước đây. Không thay kích thước map hay tốc độ server; đề xuất [11](11-ti-le-map.md) vẫn chờ duyệt.

## 1. Một câu định hướng

> **Pixel art, đơn vị logic 32 px, người chơi nhìn từ góc camera 3/4; nơi Người ấm như một buổi chiều ngoại ô, nơi Tinh Linh dịu như nắng xuyên tán lá; linh năng là ánh sáng của chính đất, nước, lửa, cây, quặng và gió, thể hiện tập trung ở các điểm đặc trưng của từng map.**

Map dựng bằng PNG vẽ tay theo **5 nhóm: nền, nước, vật thể/nhân vật, phần che phía trên, hiệu ứng/ánh sáng** (§11). Đây là nhóm quản lý, không phải 5 ảnh phủ toàn map; mỗi vật tương tác vẫn riêng.

Tham chiếu tinh thần, không sao chép: **Eastward** (ánh sáng động, đồ vật kể chuyện, thiên nhiên đan vào đô thị), **Stardew Valley** (đời sống cozy, góc nhìn), **Sea of Stars** (pixel + ánh sáng), phim **Ghibli** (thiên nhiên trùm lên công nghệ, tinh linh rừng).

Mượn từ Eastward **phần hình ảnh**, không mượn lối chơi phiêu lưu cutscene. Không gắn với kiến trúc hay biểu tượng của một quốc gia thật.

## 2. Góc nhìn và tỉ lệ

> **"3/4" là góc nhìn của người chơi (camera), không phải hình dạng hay cách thiết kế map.**
>
> - **Map** được thiết kế như một **bản đồ mặt bằng trên lưới vuông**: ô nào là đất, nước, nhà, đường, va chạm ở đâu. Bố cục, kích thước, vị trí trong [05](05-map-layouts.md) và `server/data/` đều tính theo lưới phẳng này; không có trục chéo, không có "hướng 3/4" trong dữ liệu map.
> - **Góc nhìn 3/4** chỉ là cách **vẽ sprite và đặt camera** để người chơi nhìn vào map đó: camera chếch từ trên xuống nên thấy được mặt tiền ngắn của nhà, thân cây, nhân vật đứng.
> - Vì vậy: người thiết kế map nghĩ bằng mặt bằng; họa sĩ vẽ asset theo góc 3/4; code giữ logic trên lưới vuông và chỉ xử lý 3/4 ở phần hiển thị (thứ tự vẽ theo trục Y, che khuất).

- **Camera 3/4 thẳng:** chiếu lên lưới vuông, camera chếch từ trên, không xoay. Người chơi thấy mái nhà từ trên xuống, mặt tiền ngắn, mặt đất chiếm phần lớn khung hình. Không isometric hình thoi, không side-view.
- **1 ô logic = 32 px**; quy đổi khoảng 1 m chỉ để ước lượng thế giới, không ép kiến trúc theo tỉ lệ thực. Đây là đơn vị đo bố cục, khoảng cách, tốc độ và tọa độ server, không phải kích thước tile/asset bắt buộc.
- **Asset đặt tự do theo pixel nguyên**, không bắt buộc snap vào ô 32 px hoặc có kích thước là bội số của 32. Lưới phụ 16 px chỉ gợi ý căn bố cục. Cây rộng 85 px vẫn hợp lệ; collision theo gốc/footprint, không theo toàn khung ảnh.
- Tọa độ ô đổi sang pixel bằng `px = ô × 32`; cho phép tọa độ ô phân số. Nhân vật di chuyển liên tục; chỉ làm tròn vị trí hiển thị khi cần pixel snap, không làm tròn trạng thái mô phỏng/server.
- Ví dụ quy đổi: 6 ô = 192 px; 4 ô/giây = 128 px/giây. Đây là ví dụ đơn vị, không tự áp dụng tốc độ đề xuất ở [11](11-ti-le-map.md). Thay đơn vị logic không làm tăng độ chi tiết của ảnh.
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

## 3. Thống nhất giữa các map, khác biệt theo vùng

Mọi map phải trông như **cùng một thế giới, cùng một tay vẽ**. Vùng nào cũng chỉ được khác nhau ở **hình khối, màu và đồ vật**. Góc nhìn, tỉ lệ, ánh sáng và cách vẽ thì giống nhau ở mọi map.

### 3.1 Luật chung cho mọi map

- **Cùng góc camera, cùng tỉ lệ.** Một cái cây ở Ẩn Giới và một cái cây ở Làng Hồ Lặng phải vẽ cùng độ chếch: tỉ lệ thân/tán như nhau, gốc cây chạm đất ở cùng cách. Không map nào được "phẳng" hơn hay "nghiêng" hơn map khác.
- **Nhân vật là thước đo.** Mọi vật đều đo theo chiều cao nhân vật (~42 px):

| Vật | Cao (px) | So với nhân vật |
| --- | --- | --- |
| Cỏ, hoa, đá nhỏ | 8–16 | Tới mắt cá / gối |
| Bụi cây, hàng rào | 24–32 | Tới hông / ngực |
| Cây thường | 64–96 | 1,5–2,5 người |
| Cây lớn, cây cổ thụ | 128–160 | 3–4 người |
| Cột điện | 128 | 3 người |
| Cây Mẹ | Ngoại lệ duy nhất; không bao giờ thấy trọn trong một khung hình | — |

- **Cùng mật độ chi tiết.** Cùng độ phân giải pixel, cùng số mảng sáng–tối trên một vật (3–4 mảng), cùng kiểu outline 1 px màu theo chất liệu. Không map nào vẽ mịn hơn hay thô hơn hẳn.
- **Cùng ánh sáng.** Sáng từ trên-trái, bóng ngả phải-dưới, bóng màu tím mờ, có thể đi cùng asset nếu tĩnh, ở mọi map. Ánh sáng riêng của từng vùng (tia nắng xiên ở Ẩn Giới, đèn mỏ...) chỉ **cộng thêm** vào, không đổi hướng sáng chính.
- **Chung lõi màu.** Mỗi vùng có palette riêng nhưng bắt buộc dùng chung: màu bóng `#2E2A4A`, linh năng, tím vật thể lạ, màu UI, bộ màu da/tóc nhân vật.
- **Nhân vật nổi trên mọi nền.** Nhân vật, NPC, Tinh Linh, dị thú phải tách khỏi mặt đất ở mọi map và mọi giờ (đặc biệt ở Rừng Sâu và ban đêm). Nếu không tách được thì chỉnh màu nền chứ không vẽ lại nhân vật cho riêng map đó.

### 3.2 Đồ vật và cây theo họ

- **Một loại vật = một họ asset.** Cây, đá, hàng rào, đèn, ghế... vẽ một **mẫu gốc** rồi tạo biến thể theo vùng (đổi màu, thêm rêu/gỉ/dây leo/hoa văn), không vẽ lại từ đầu. Ví dụ: cột điện ở làng → bản gỉ có dây leo ở Bìa Rừng; cây sồi ở làng → bản tán dày, tối hơn ở Rừng Sâu → bản có lá phát sáng ở Ẩn Giới.
- Tên file thể hiện họ: `hl_flora_cay_soi_a` → `rs_flora_cay_soi_toi` → `ag_flora_cay_soi_linh`.
- **Người và Tinh Linh khác nhau theo quy tắc hai tộc** (mục 3.4), nhưng vẫn cùng góc nhìn, tỉ lệ và cách tô bóng. Nhìn ghế gỗ sống của Tinh Linh cạnh ghế nhựa của Người phải thấy đó là hai món đồ trong cùng một game.

### 3.3 Chỗ nối giữa các map

- **Mép map nối liền.** Hai map cạnh nhau dùng chung bản vẽ dải mép (khoảng 3–4 ô), xuất cắt cho hai phía: đường, cỏ, tường rào nhìn từ hai phía phải khớp nhau.
- **Chuyển dần, không cắt cụt.** Càng gần ranh giới, đồ của vùng bên kia càng xuất hiện nhiều hơn: gần tường rào thì cỏ cao và gỉ sét lấn vào làng; quanh Cổng Ẩn Giới thì lồng đèn lá, dây leo lẫn vào Quảng trường; phía Ẩn Giới gần Cổng có vài món đồ của Người (biển báo, ghế nhựa).
- Một vật mốc lớn nên **thấy được từ map bên cạnh** (ví dụ ngọn Cây Mẹ ló sau Cổng, tháp Trạm nhô sau rừng) để người chơi cảm thấy các map là một thế giới liền mạch.

### 3.4 Hình khối theo vùng

| Vùng | Hình khối chủ đạo |
| --- | --- |
| Làng Hồ Lặng | Ngang, thấp, mềm: mái dốc, ruộng, hàng rào, bờ hồ cong |
| Thị trấn trong làng | Khối cao hơn xóm nhà, cửa kính, biển hiệu, dây điện chéo |
| Tường rào, Bìa Rừng | Khối dài thấp: tường bê tông, trạm gác, cỏ cao; khoảng trống lớn |
| Mỏ | Bậc thang đá, đường chéo của băng chuyền, hố sâu |
| Ẩn Giới (Vườn Cây Mẹ) | Tròn, cong, mọc lên từ rễ; nhà là hốc cây, cành, tổ lớn; không có góc vuông |
| Rừng Sâu | Tròn hữu cơ nhưng rối, tán chồng tầng, tối |
| Trạm Thiên Mạch | Vuông lạnh; vật thể lạ là lục giác, đường thẳng tuyệt đối |

**Quy tắc hai tộc** (vẫn theo luật chung ở 3.1)**:** đồ của Người có **góc vuông, kim loại, nhựa, chữ in**. Đồ của Tinh Linh có **đường cong, gỗ sống, lá, dây leo, ký hiệu vẽ tay**. Ở vùng giữa, hai kiểu này đặt cạnh nhau để kể chuyện.

## 4. Màu

### 4.1 Quy tắc

- Mỗi vùng 24–32 màu; toàn game ≤ 96 màu. Lưu palette `.gpl` trong repo khi bắt đầu vẽ.
- **Bóng không đen/xám:** bóng ngả tím-xanh mát, chỗ sáng ngả vàng ấm.
- **Ánh sáng linh năng dùng màu của sáu hệ** (§6.1), chỉ ở dạng phát sáng, không làm màu vật liệu. **Ngọc lam chỉ dành cho Ẩn** (linh năng thuần của Ẩn Giới). **Tím chỉ dành cho vật thể ngoài thế giới.** Nước, đèn, UI không dùng ngọc lam và tím.
- Tinh Linh có hoa văn ngọc lam trên người (vì là cư dân Ẩn Giới); Người thì không, trừ aura lúc thiền (màu và dáng theo hệ chính trong Nội Giới).
- UI tương tác dùng vàng kem.

### 4.2 Palette khởi điểm

| Nhóm | Hex |
| --- | --- |
| Ẩn (ngọc lam / lõi sáng) | `#3FD6B8` `#B8FFF0` |
| Sáu hệ, lõi sáng: Kim, Mộc, Thủy, Hỏa, Thổ, Phong | `#E8EDF2` `#B8F08E` `#8FD8F0` `#FFC27A` `#F2DC8A` `#EEF9FF` |
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

Độ rõ của nhân vật, đường đi và vật tương tác là ưu tiên số 1. Ánh sáng bổ sung không khí nhưng không được làm nhòe hoặc phủ mất chi tiết pixel.

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
- Hướng sáng chính: trên-trái; bóng ngả phải-dưới, màu tím mờ; bóng tĩnh đơn giản có thể đi cùng asset, bóng cần thay đổi/che khuất mới tách riêng.

## 6. Linh năng trên map

> **Linh năng là chính các yếu tố tạo nên thế giới**: Kim, Mộc, Thủy, Hỏa, Thổ, Phong ([07](07-power-system.md) §2). Trên map, **mỗi hệ hiện ra qua vật chất của nó**: nước có Thủy thì nước sáng, lửa có Hỏa thì lửa bốc đốm, cây có Mộc thì lá sáng và mọc dày, quặng có Kim thì vân kim lóe, đất đá có Thổ thì bụi vàng ửng, gió có Phong thì thành vệt gió. Nhìn ánh sáng là biết chỗ đó có hệ gì, và biết thiền ở đó sẽ mọc ra gì trong Nội Giới.
>
> Sáu năm sau Linh Chấn, linh năng đã dày lên trong mọi vật, nên map nào cũng phải thấy nó **cả ban ngày**, không chỉ lúc tối hay lúc "trời linh".

### 6.1 Màu và dáng của từng hệ

| Hệ | Lõi / viền | Hiện qua | Dáng chuyển động |
| --- | --- | --- | --- |
| **Kim** | `#E8EDF2` / `#A9B6C4` | Vân quặng, kim loại, đồ thép cũ, mũi đá vỡ | Tia lóe hình sao 4 cánh, sắc, gần như đứng yên |
| **Mộc** | `#B8F08E` / `#5FA36A` | Lá, rễ, rêu, nấm, cỏ | Phấn sáng xoắn bay lên; cây quanh điểm tụ mọc dày, xanh hơn |
| **Thủy** | `#8FD8F0` / `#3F86B8` | Mặt hồ, suối, sương, mưa, cá | Gợn sáng chạy trên mặt nước; giọt bay lên rồi rơi |
| **Hỏa** | `#FFC27A` / `#E0503A` | Lửa trại, lò rèn, than, sét, máy nóng | Đốm lửa bay lên; không khí gợn nóng; than ửng theo nhịp |
| **Thổ** | `#F2DC8A` / `#B08A3A` | Đất ruộng, đá, vách núi, bậc miếu | Bụi vàng lắng thấp; đá ửng ấm; mặt đất rung nhẹ theo nhịp 47 |
| **Phong** | `#EEF9FF` / `#9CCFE6` | Gió, mây, đỉnh cao, tháp | Vệt sáng dài theo gió; cỏ rạp theo vệt |
| **Ẩn** | `#B8FFF0` / `#3FD6B8` | Cổng Ẩn Giới, vết Linh Chấn, Ẩn Giới, hoa văn Tinh Linh | Trôi chậm, ấm; **sáu hệ hòa làm một** |
| **Tím** | `#8F6BFF` | Lõi máy Trạm, vật thể lạ | Lục giác đứng yên, cạnh cứng, không bóng; nhấp nháy theo nhịp 47 |

- **Màu hệ chỉ dùng cho ánh sáng linh năng** (hiệu ứng phát sáng trong nhóm G5), không dùng làm màu vật liệu. Nước hồ vẫn là `#5C8FA0` của palette làng; chỉ chỗ có Thủy mới có gợn sáng `#8FD8F0` chạy trên đó.
- **Ngọc lam là Ẩn**: linh năng thuần của Ẩn Giới, chưa tách hệ. Ở thế giới Người, ngọc lam chỉ thấy ở Cổng, ở vết Linh Chấn (chỗ màn che rách) và trên người Tinh Linh.
- **Ẩn tách thành sáu hệ khi chạm vào thế giới Người.** Quanh Cổng Ẩn Giới, ánh ngọc lam tràn ra rồi tách dần thành sáu màu: chảy vào hồ thì thành Thủy, chạm ruộng thành Thổ, chạm thép cổng thành Kim. Đây là hình ảnh then chốt nối linh năng với thế giới.
- Hỏa phân biệt với đèn thường bằng dáng: đèn là điểm sáng đứng yên; Hỏa có đốm bay lên và nhịp 47.

### 6.2 Năm thành phần (dùng ở mọi map)

| Thành phần | Là gì | Vẽ thế nào | Lớp (§11) |
| --- | --- | --- | --- |
| **Mạch linh** | Đường linh năng chảy trong đất, đá, rễ, lòng sông | Vệt sáng mảnh, đứt quãng, nằm **dưới** mặt đất; mang **hệ của nơi nó chảy qua** (qua lòng sông là Thủy, qua rễ là Mộc, qua vỉa quặng là Kim) và đổi màu dần ở chỗ chuyển | G1 dấu tĩnh + G5 ánh sáng |
| **Điểm tụ** | Chỗ nhiều mạch gặp nhau. **Mọi điểm thiền ở [05](05-map-layouts.md) nằm trên điểm tụ, màu đúng hệ của điểm thiền đó** | Vũng sáng tròn; vật chất quanh đó biểu hiện hệ rõ nhất (đá ửng, nước gợn, lửa bốc...) | G5 ánh sáng + hạt |
| **Hạt linh** | Hạt sáng trôi trong không khí | 1–2 px, dáng theo hệ (§6.1); mật độ theo mức (§6.4) | G5 hạt |
| **Linh vật** | Vật đã thấm linh năng: bậc **Linh** ở [08](08-life-yields.md) §2 | Viền sáng **màu hệ của nó**: cá lấp lánh Thủy, thảo dược Mộc, Đá Vân Sáng Kim | Sprite G3 + phát sáng G5 |
| **Vết Linh Chấn** | Dấu tích đêm màn che rách | Đường nứt như kính vỡ trên đường, tường, mặt hồ; Người trám xi măng nhưng vẫn rỉ **ngọc lam** (Ẩn) | G1 dấu tĩnh + G5 ánh sáng |

Thêm **nhịp 47 giây** ([02](02-story.md) hồi B): mọi linh năng trên map **sáng lên cùng lúc** khoảng 1 giây rồi dịu lại, như nhịp tim. Ở làng chỉ thấy rõ quanh Cổng và trên mạch; càng gần Trạm nhịp càng mạnh và gắt.

### 6.3 Sinh khắc thấy được trên map

Tương sinh, tương khắc ([07](07-power-system.md) §2.1) không chỉ là số trong Nội Giới; người chơi **thấy** nó ngoài thế giới:

- **Sinh:** chỗ mạch Thủy chảy qua rễ cây, cây xanh và dày hơn hẳn; than trong lò rèn ửng thêm khi có gió (Phong sinh Hỏa); quanh vỉa quặng trên vách đá, vân Kim sáng hơn (Thổ sinh Kim).
- **Khắc:** mạch Hỏa đi tới bờ hồ thì tắt thành hơi nước (Thủy khắc Hỏa); cỏ không mọc trên mạch Kim (Kim khắc Mộc); vệt gió dừng lại ở chân vách đá (Thổ khắc Phong).
- Bố cục map nên đặt ít nhất một chỗ sinh và một chỗ khắc gần đường đi, để người chơi tự nhận ra quy luật trước khi game giải thích.

### 6.4 Hệ và mức theo map

| Mức | Map | Hệ chính | Ban ngày | Ban đêm / trời linh | Người và Tinh Linh làm gì với nó |
| --- | --- | --- | --- | --- | --- |
| **0 — sống chung** | Làng Hồ Lặng | Thủy (hồ), Thổ (miếu, ruộng), Hỏa (lò rèn), Mộc (vườn) | Gợn Thủy trên mặt hồ; bụi Thổ ở sân miếu; đốm Hỏa ở lò rèn; thảo dược viền Mộc; 1–2 vết Linh Chấn trám xi măng; hạt linh thưa quanh điểm tụ (có thể không có ở màn hình thường) | Mạch dưới Đồi Miếu và bờ hồ hiện rõ; cá sáng | Cảm biến trên cột điện, **màn LED chỉ số linh năng** theo từng hệ ở thị trấn, rào quanh vết nứt; Tinh Linh treo lồng đèn lá trên điểm tụ |
| **0+ — tràn** | Quảng trường Cổng | Ẩn, tách dần thành sáu hệ | Ngọc lam tỏa ra từ Cổng như rễ cây rồi đổi màu theo thứ nó chạm vào; cỏ trong dần về phía Cổng | Cổng chớp theo nhịp 47, mạch sáu màu chạy ra mọi hướng | Khung thép, chốt gác, máy đo của Viện đặt sát mạch; chợ Tinh Linh bày trên rễ sáng |
| **1 — hiện tượng** | Bìa Rừng | Phong (tháp gió, đồng trống), Hỏa (lửa trại), Mộc | Vệt gió sáng trên đồng cỏ; đốm lửa ở trại thợ săn; mạch lộ ở vết sạt bờ sông | Dải sáng trên trời; sương sáng thành dải | Trạm gác có cột đo; cờ đánh dấu vùng dày; thợ săn đi theo mạch để tìm dị thú |
| **1 — hiện tượng** | Mỏ Bỏ Hoang | Kim (vỉa sắt), Thổ (bậc đá) | Vân Kim lóe trên vách; nhát đào bật tia sao; bụi Thổ ở bậc khai thác | Vỉa sáng như chòm sao trên vách | Máy xúc gỉ đứng ngay trên mạch Kim |
| **2 — dày, dịu** | Ẩn Giới | Ẩn + đủ sáu hệ, dịu và cân bằng | Rễ Cây Mẹ là sông ngọc lam; suối Thủy, vườn Mộc, đá Thổ sống chung hài hòa | Đom đóm, cả vườn phát sáng dịu | Nhà, đường, cầu của Tinh Linh **mọc dọc theo mạch**, đặt các hệ tương sinh cạnh nhau |
| **2 — dày, hoang** | Rừng Sâu | Mộc, Thủy (suối, thác), Phong (đỉnh) | Nấm, rêu sáng Mộc; mạch rối và đứt; thác có gợn Thủy | Rừng tối, chỉ còn mạch và mắt dị thú sáng | — |
| **2 — dày, hoang** | Hầm Mỏ | Kim, Thổ | Vân sáng trên đá; **vân Kim chạy thẳng như kẻ thước** về hướng bắc, dấu hiệu có thứ đang hút | — | — |
| **3 — cộng hưởng** | Trạm Thiên Mạch | Mạch của mọi hệ bị kéo về lõi máy | Càng gần lõi, sáu màu càng **bị kéo lệch về tím**; vật nhỏ lơ lửng | Nhịp 47 gắt, cả trạm chớp theo | Ống, cáp của Viện cắm thẳng vào mạch |
| **X — ngoài chuẩn** | Hiếm | Tím | Lục giác tím, không bóng, nhấp nháy đều 47 giây | — | — |

### 6.5 Luật để linh năng "là ánh sáng, không phải sơn"

- **Không bắt buộc mọi khung hình có linh năng.** Tập trung ở Cổng, điểm thiền/điểm tụ, cây lạ, vỉa khoáng và một số mạch dẫn có chủ đích; giữ khoảng nghỉ ở đường và khu sinh hoạt.
- Nhưng ban ngày phần pixel phát sáng linh năng **≤ 8% khung hình ở làng, ≤ 15% ở rừng và mỏ, ≤ 25% ở Ẩn Giới và Trạm**. Đây là trần, không phải chỉ tiêu phải lấp đầy. Ban đêm chỉ tăng sáng cục bộ khi vẫn đọc rõ cảnh, không tự tăng gấp đôi diện tích phủ.
- Một khung hình thường chỉ có **1–3 hệ**, theo đúng vật chất đang thấy; không rải đủ sáu màu cho đẹp. Chỗ có đủ sáu hệ là chỗ đặc biệt (quanh Cổng, Ẩn Giới).
- Linh năng không có viền tối: **lõi pixel sắc nét, quầng sáng nhỏ và nhẹ**; chỉ phần phát sáng dùng additive. Không bloom/blur toàn cảnh hoặc phủ glow lên toàn bộ nhà, cây, mặt đất. Vật thể lạ (tím) giữ cạnh cứng, không quầng.
- Sương, hạt và màu phủ không làm mất đường viền nhân vật, đường đi, cửa và dấu tương tác. Hiệu ứng nước giới hạn trong mặt nước, không làm méo sprite bờ hoặc nhân vật.
- Linh năng đi theo địa hình thật: chảy theo dốc, gom ở nước và rễ, bị đường nhựa và bê tông chặn (chỉ rỉ sáng qua kẽ). Không rải ngẫu nhiên.
- Mạch và điểm tụ là **một lớp dữ liệu riêng** của map (§11.3), cùng nguồn với điểm thiền và hệ trong `server/data/`, để hình ảnh khớp với lối chơi (Máy Quét / Linh Cảm, sản lượng theo mức).

Linh năng: mềm, trôi, hữu cơ. Vật thể lạ: cứng, hình học, đứng yên.

## 7. Đồ vật kể chuyện

Mỗi map dùng ít nhất 3 mục trong nhóm phù hợp:

- **Làng:** giếng, đống rơm, bù nhìn, xe đạp dựng cổng, thùng tưới, gà vịt, trạm xe buýt, cửa hàng tiện lợi, máy bán hàng tự động.
- **Thị trấn:** xe máy, xe buýt, quán cà phê vỉa hè, cột điện bó dây, cửa cuốn, bồn nước trên mái, cục nóng điều hòa, màn LED.
- **Ven đô, mỏ:** đê, cống, trạm bơm, container, barrier bê tông, xe tải bỏ dở có dây leo, máy xúc.
- **Tinh Linh:** nhà trong hốc cây, cầu thang rễ, lồng đèn lá, bùa vẽ tay, tổ chim lớn làm ghế, chuông gió bằng vỏ ốc, vườn nấm, vòng đá.
- **Lớp hậu Linh Chấn:** vết nứt Linh Chấn trám xi măng còn rỉ sáng, cột đo linh năng của Viện, rào quanh điểm tụ, cảm biến trên cột điện, biển "CẢNH BÁO LINH NĂNG", nhà kính dược liệu, drone giao hàng, chốt kiểm soát, biển "Không săn".

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

Một góc **Làng Hồ Lặng** khoảng 30×17 ô (1 khối nền 1024×1024 px là đủ), chạy trong Godot, **dựng 5 nhóm G1–G5, chỉ tạo thành phần cần thiết** (§11):

1. Nhà người chơi (cửa đóng/mở), vườn 4 luống ở 3 trạng thái, bờ hồ có 1 bến câu, **Quảng trường Cổng với Cổng Ẩn Giới** (vòng sáng xoay, khung thép, chốt gác, lồng đèn lá, góc chợ Tinh Linh), một đoạn tường rào có chốt, cột điện + dây, một xe máy.
2. **Một avatar Người** và **một avatar Tinh Linh Cáo**, dùng chung 2 bộ quần áo; đi/đứng/ngồi/câu 4 hướng; Tinh Linh có thêm dạng thú.
3. Chu kỳ sáng → chiều → tối với 3–4 đèn điểm và normal map cho nhà.
4. Linh năng đủ năm thành phần (§6.2), ít nhất 3 hệ (Thủy ở hồ, Thổ ở sân, Hỏa hoặc Mộc) và Ẩn ở Cổng tách dần thành các hệ: mạch tỏa ra từ Cổng, 1 điểm tụ có điểm thiền, hạt linh, 1 linh vật (thảo dược hoặc cá), 1 vết Linh Chấn trám xi măng; nhịp 47 giây; ban ngày và ban đêm; hoa văn Tinh Linh sáng lên.
5. Một Lợn Gai đứng ở mép đê để thấy tương phản làng ↔ ngoài.

**Đạt khi:**
- 5 người chưa biết dự án nhìn ảnh chụp nói được "Người" và "Tinh Linh" là ai trong ≤ 3 giây.
- Phân biệt được Tinh Linh với dị thú ngay lần đầu nhìn.
- Avatar đọc rõ ở ×2 trên điện thoại 6".
- **Linh năng:** người xem chỉ ảnh chụp ban ngày nói được "chỗ này có năng lượng lạ" và đoán đúng hệ của ít nhất 2 chỗ (nước, lửa, đất...) mà không cần giải thích, nhưng không thấy map bị phủ màu (§6.4). Tắt hiệu ứng linh năng trong G5 phải thấy nền và vật thể còn nguyên nét, không có quầng bị vẽ chết vào nền.
- **Độ nét:** kiểm tra ở ×1 và zoom chơi ×2/×3; pixel không bị nhòe hoặc dày mỏng thất thường khi camera di chuyển. So sánh bật/tắt G5 vào ban ngày và ban đêm; nhân vật, cửa và đường đi đều phải rõ.
- **Theo lớp:** bật/tắt từng lớp không làm lộ đường ráp ô ở nền; dời một cái cây hay ngôi nhà chỉ cần sửa `layout.json`, không vẽ lại nền.
- **Ghép thử:** đặt cạnh nhau trên một ảnh 1 cây, 1 đồ vật, 1 nhân vật của làng và bản biến thể Ẩn Giới / Rừng Sâu (vẽ phác). Người xem phải thấy chúng thuộc cùng một game, khác vùng chứ không khác tay vẽ.
- Ảnh chụp buổi tối đặt cạnh ảnh Eastward: thấy "cùng họ ánh sáng" nhưng là một thế giới riêng.
- Ghi lại thời gian vẽ 1 nhà + normal map, 1 bộ quần áo, 1 bộ tai/đuôi/dạng thú để ước tính chi phí cả game.

## 11. Dựng map theo lớp và quy ước file

> **Map không ghép toàn bộ từ tileset.** Mỗi map là một chồng **lớp PNG** đặt tự do lên lưới logic vuông (§2). Tile chỉ dùng ở chỗ thật sự lặp: mặt đường dài, sàn nhà, luống vườn. Còn lại (mặt đất, bờ hồ, vách đá, nhà, cây, đồ vật, linh năng) là **PNG vẽ tay**, đặt theo pixel.

### 11.1 Năm nhóm quản lý hình ảnh

| Nhóm | Nội dung | Cách dựng |
| --- | --- | --- |
| G1 — Nền | Đất, cỏ, đường, bờ hồ, decal tĩnh | Vẽ gộp theo khối 1024×1024 px; giữ đường ráp liền mạch |
| G2 — Nước | Mặt hồ, sông, gợn và phản chiếu | PNG/mask + animation hoặc shader; khớp vùng nước server |
| G3 — Vật thể và nhân vật | Nhà, cây, đồ vật, NPC, người chơi, dị thú | Đối tượng riêng, neo ở chân, Y-sort; bóng tĩnh đơn giản đi cùng asset |
| G4 — Phần che phía trên | Mái, tán cần xử lý che người | Chỉ tách phần cần mờ/ẩn; không bắt mọi vật có ảnh mái/tán riêng |
| G5 — Hiệu ứng và ánh sáng | Linh năng, đèn, hạt, sương, ngày–đêm | Các thành phần độc lập, bật/tắt riêng; không xuất một ảnh phủ kín toàn map |

**G1–G5 là nhóm chức năng, không phải thứ tự z cố định.** Hiệu ứng G5 trên mặt đất vẽ dưới G3; hạt tiền cảnh có thể trên G4. Bóng đi cùng đối tượng vẫn phải vẽ dưới phần thân và các vật cần che nó; tách node bóng khi cần để tránh lỗi Y-sort. Phân lớp không tự làm mờ ảnh.

Giữ riêng dữ liệu va chạm, đường đi, điểm tương tác, vùng an toàn, mạch và điểm tụ. Không gộp vật có tương tác, trạng thái, chuyển động hoặc cần di dời vào nền.

Quy đổi từ quy chuẩn cũ: nền và decal tĩnh → G1; nước → G2; vật thể và bóng gắn vật → G3; mái/tán → G4; linh năng, hạt, ánh sáng và không khí → G5. Dấu nứt tĩnh có thể ở G1 nhưng ánh sáng của nó ở G5.

### 11.2 Pixel và cách xuất ảnh

- **Một pixel PNG = một pixel game** ở zoom ×1. Asset vẽ đúng kích thước mục tiêu, không kéo giãn/thu nhỏ tùy ý hoặc xoay làm lệch pixel. Kích thước ảnh không cần là bội số của 32.
- Lọc Nearest, không mipmap cho sprite/nền trong chế độ chơi; camera và phép phóng hiển thị theo pixel, zoom nguyên. Giữ chuyển động logic liên tục, không ép đi theo ô.
- Cùng góc nhìn, palette, ánh sáng và mật độ pixel (§3). 32 px là đơn vị logic, không phải tuyên bố độ phân giải của mọi sprite.
- Nền G1 theo khối 1024×1024 px (32×32 ô logic); chỉ nạp khối quanh camera, mục tiêu 3×3 khối ở zoom chơi mặc định. Map 160×120 ô cần 5×4 khối, phần thừa ở mép được cắt.
- Đồ vật dùng chung họ asset; có trạng thái thì dùng sprite sheet. Nước, cờ, lá động và hiệu ứng không vẽ chết vào nền.
- Dải 3–4 ô nối map vẽ trên một nguồn chung rồi cắt cho hai phía; tile chỉ dùng khi phần đó thực sự lặp.
- Họa sĩ được dùng nhiều layer làm việc trong Aseprite; khi xuất gộp phần tĩnh phù hợp. Không bắt mỗi layer làm việc thành một PNG, không xuất ảnh trong suốt toàn khối cho một vật nhỏ.
- Chi tiết đời sống tập trung quanh nhà, chợ, điểm hoạt động; đường đi có khoảng nghỉ thị giác. Duyệt bằng zoom chơi thật, không chỉ ảnh toàn map thu nhỏ.

### 11.3 File nguồn và dữ liệu

- Nguồn nền: `client/art/<vùng>/map/<map_id>/khoi_<x>_<y>.aseprite`; xuất nền thành `client/assets/<vùng>/map/<map_id>/khoi_<x>_<y>_ground.png`. Chỉ xuất thêm nước/mask nếu cần.
- Asset rời: `client/art/<vùng>/<loại>/<tên>.aseprite` → `client/assets/<vùng>/<loại>/<tên>.png`; mái/tán và bóng riêng chỉ khi chức năng yêu cầu.
- Đối tượng trong `client/data/maps/<map_id>/layout.json`: `id`, `png`, `x`, `y` (pixel), `group` (G1–G5), `anchor`, `state`, `collision`; khai báo thêm thứ tự vẽ khi cần. Đây là quy chuẩn dữ liệu khi triển khai, chưa phải schema runtime đã chuyển đổi.
- Điểm tương tác dùng ID của `server/data/life_world.json`. Tọa độ server theo ô phải đổi sang pixel đúng một lần bằng hệ số 32; footprint và điểm đứng phải khớp ảnh.
- `client/data/maps/<map_id>/linh_nang.json` chứa mạch (đường + hệ + độ sáng), điểm tụ (tâm, bán kính, hệ); ghi rõ đơn vị tọa độ pixel. Điểm tụ phải khớp điểm thiền server sau quy đổi.
- Godot: thế giới trong `SubViewport` phóng nguyên, UI ở độ phân giải gốc. G3 dùng Y-sort; G4 xử lý che khuất. G5 quản lý node hiệu ứng theo độ sâu cần thiết; chỉ glow/hạt phát sáng dùng blend Add, không áp blend Add cho sương, khói hay toàn nhóm.
- Ánh sáng có thể dùng `PointLight2D`, `DirectionalLight2D`, `LightOccluder2D`, `CanvasModulate`; normal map qua `CanvasTexture`. Không tăng độ mềm ánh sáng tới mức mất biên pixel.
- Tiền tố vùng: `hl`, `ag`, `br`, `rs`, `mb`, `hm`, `tm`; dùng chung `char`, `spirit`, `beast`, `ln`.
- Tên asset: `vung_loai_ten_bienthe`, chữ thường không dấu; mỗi vật có điểm neo chân, footprint và điểm đứng nếu tương tác được.
- Font: Be Vietnam Pro cho UI có dấu tiếng Việt; font pixel cho biển hiệu.

## 12. Nguồn asset và AI

- Chỉ dùng asset có license thương mại; lưu license ở `client/assets/LICENSES/`.
- AI tạo ảnh: chỉ dùng cho moodboard nội bộ. Asset đưa vào game phải do người vẽ hoặc chỉnh sửa đáng kể, có ghi chú.
- Không dùng logo, thương hiệu thật.

## 13. Bộ mô tả phong cách (concept AI và brief họa sĩ)

Dùng chung cho mọi ảnh concept tạo bằng AI (§12: chỉ làm moodboard nội bộ) và để giao việc cho họa sĩ. **Không ghi tên game hay tên studio vào lệnh tạo ảnh**; chỉ tả đặc điểm muốn mượn từ các tham chiếu ở §1. Lệnh viết bằng tiếng Anh vì model hiểu tốt hơn. Ảnh lưu ở `docs/game-design/concept/` và trang "Concept AI" trong Figma.

**Đã chốt (14/10/2026):** chủ dự án chọn hướng nhìn của ảnh [`concept/lang-ho-lang-toan-canh-v2.png`](concept/lang-ho-lang-toan-canh-v2.png) (tạo bằng bộ mô tả này) làm mốc cho mọi map: chi tiết dày, dây điện chằng chịt, cửa sổ sáng đèn, màu dịu và đều. Bản v1 chỉ để tham khảo.

### 13.1 Khối chung (đặt đầu mọi lệnh)

```text
Detailed hand-painted layered pixel art game map using 32px as a logical scale unit, with free pixel-aligned object placement, ground painted as one continuous image, not repeating tiles. Straight top-down 3/4 camera:
rooftops seen from above with a short front facade, square-grid world coordinates without visible tile seams or forced tile-sized objects,
no isometric diamond, no side view. Light from the top-left, soft cool purple shadows
falling to the bottom-right, 1px dark outlines tinted by material (never pure black),
3-4 tone shading per object, lived-in detail clustered around buildings and activity hubs,
clear readable paths, harmonious limited palette, crisp pixel edges.
Spirit energy is the elements of the land glowing from within, in the color of
each element: blue ripples on water, orange embers rising from fires, green motes
from plants, white-silver star glints on ore, golden dust over earth and stone,
pale streaks in the wind. Turquoise only for pure otherworld energy (the gate, old
glass-like cracks patched with cement still leaking light); purple hexagons only for
the unknown material. Localized spirit-energy accents, crisp luminous pixel cores,
small faint halos, subtle in daylight, no full-scene bloom or blur.
No text, no UI, no logos, no real-country architecture, no palace roofs.
```

### 13.2 Khối theo vùng

| Vùng | Mượn tinh thần từ (§1) | Khối mô tả |
| --- | --- | --- |
| Làng Hồ Lặng | đời sống ấm cúng; đồ vật kể chuyện | `golden afternoon, warm cozy rural-suburban life, orange and red tiled roofs, fenced yards with vegetable patches, laundry lines, scooters, bundled power lines on utility poles, vending machines, soft warm point lights, turquoise light spreading like roots from a glowing gate in the plaza and changing color as it touches water, soil and steel, blue ripples on the lake, embers over a forge, cement-patched turquoise cracks in the road, a spirit-energy LED index board` |
| Thị trấn trong làng | phố chật, đồ đời sống, đèn điểm | `dense small-town streets, 2-3 storey flat-roof buildings with water tanks and AC units, striped awnings, shop signs as colored blocks, tangled overhead wires, warm window glow, sensor boxes on poles, a faint vein leaking light through cracks in the pavement` |
| Bìa Rừng | thiên nhiên nuốt công nghệ | `wild windy buffer zone beyond a concrete wall, tall grass, abandoned rice fields, rusted trucks and containers swallowed by vines, broken highway, a hunters' camp, pale glowing wind streaks over the grass, orange embers over a hunters' campfire, exposed spirit veins in eroded riverbanks, cooler palette than the village` |
| Rừng Sâu | thiên nhiên nuốt công nghệ, tinh linh rừng | `ancient layered forest, giant ferns, mossy boulders, dense fog in hollows, faintly glowing mushrooms, cliffs and waterfalls, tangled broken green root-veins, glowing moss and mushrooms, blue glow along streams, dark greens with cold highlights` |
| Mỏ, Hầm Mỏ | — | `terraced red-rock open pit, rusted excavators and conveyor belts, miners' shack with warm lamps; underground: dark tunnels, yellow mine lamps, silver star glints on ore veins, golden dust on the terraces; underground: silver ore-light veins running unnaturally straight like ruled lines` |
| Ẩn Giới | thiên nhiên trùm công nghệ; pixel + ánh sáng | `dreamlike spirit garden around a colossal mother tree, translucent leaves, slanted god rays through the canopy, fireflies, homes inside tree hollows and on branches, rope bridges, no straight lines or right angles, giant glowing roots of the mother tree as rivers of light across the ground, motes rising from streams, soft jade sky` |
| Trạm Thiên Mạch | pixel + ánh sáng | `sealed underground research station, cold concrete corridors, flickering emergency lights, empty cages, a humming machine core, veins of every element color converging into the core and bending toward purple, small objects floating, hexagonal purple crystals casting no shadow` |

### 13.3 Cách viết một lệnh

1. Khối chung (13.1).
2. Khối vùng (13.2).
3. Bố cục lấy từ [05](05-map-layouts.md), tả theo hướng bắc–nam–đông–tây, kèm những gì phải khớp qua mép map ([03](03-world-and-maps.md) §3: sông, tường, đường).
4. Giờ và thời tiết theo §5 nếu cần.
