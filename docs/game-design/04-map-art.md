# 04 — Map art

**Quy chuẩn 15/10/2026 — feat/fantasy-world:** 5 nhóm hình ảnh; 32 px là đơn vị logic, asset đặt tự do theo pixel. Giữ bối cảnh fantasy cổ và tỉ lệ đã duyệt ở [11](11-ti-le-map.md).

## 1. Một câu định hướng

> **Pixel art, đơn vị logic 32 px, người chơi nhìn từ góc camera 3/4; nơi Người ấm như một buổi chiều ở làng chài ven biển, nơi Tinh Linh dịu như nắng xuyên tán lá trên mặt đầm; linh năng là ánh sáng của chính đất, nước, lửa, cây, quặng và gió, và map nào cũng thấy nó chảy.**

Map dựng **theo lớp PNG vẽ tay** (nền, decal, bóng, linh năng, đối tượng, tán, hạt, ánh sáng, không khí), không ghép toàn bộ từ tileset (§11).

Tham chiếu tinh thần, không sao chép: **Eastward** (ánh sáng động, đồ vật kể chuyện), **Stardew Valley** (đời sống cozy, góc nhìn), **Sea of Stars** (pixel + ánh sáng, biển và đảo), phim **Ghibli** (thiên nhiên sống, tinh linh rừng).

Mượn từ Eastward **phần hình ảnh**, không mượn lối chơi phiêu lưu cutscene. Thế giới là **fantasy cổ**: không máy móc, không điện, không nhựa, không bê tông. Không gắn với kiến trúc hay biểu tượng của một quốc gia thật.

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
- Quy đổi: 6 ô = 192 px; tốc độ 4 ô/giây = 128 px/giây theo [11](11-ti-le-map.md).

- **Phóng to số nguyên**, không scale lẻ, không xoay sprite.
  - Khám phá: ×2 (màn 1080p thấy ≈ 30×17 ô).
  - Sinh hoạt/tương tác: ×3.
  - Màn hình điện thoại: hệ số nguyên lớn nhất mà vẫn thấy ≥ 11 ô chiều cao.
- **Kiến trúc nén:** 1 tầng nhà = 64 px; mặt tiền chỉ thấy tầng trệt + 1 tầng; tầng cao hơn thể hiện bằng mái, gác, giàn phơi lưới nhìn từ trên.
- **Mặt đất ≥ 55% khung hình** ở zoom mặc định.
- Nhân vật đi sau nhà hoặc tán cây thì phần che mờ đi.

| Đối tượng | Kích thước |
| --- | --- |
| Người / Tinh Linh (dạng người) | Khung 32×48, cao ~42 px, ~3 đầu; tai Tinh Linh được phép vượt khung tới 8 px |
| Tinh Linh dạng thú | 32×32 |
| Cửa đi | 48 px |
| Ghế | 20 px |
| Dị thú nhỏ / vừa / boss | 32×32 / 48–64 px / ≤ 128 px |

## 3. Thống nhất giữa các map, khác biệt theo khu

Mọi map phải trông như **cùng một thế giới, cùng một tay vẽ**. Các khu chỉ được khác nhau ở **hình khối, màu và đồ vật**. Góc nhìn, tỉ lệ, ánh sáng và cách vẽ thì giống nhau ở mọi map.

### 3.1 Luật chung cho mọi map

- **Cùng góc camera, cùng tỉ lệ.** Một cái cây ở Vườn Cây Mẹ và một cái cây ở Làng Hồ Lặng phải vẽ cùng độ chếch: tỉ lệ thân/tán như nhau, gốc cây chạm đất ở cùng cách. Không map nào được "phẳng" hơn hay "nghiêng" hơn map khác.
- **Nhân vật là thước đo.** Mọi vật đều đo theo chiều cao nhân vật (~42 px):

| Vật | Cao (px) | So với nhân vật |
| --- | --- | --- |
| Cỏ, hoa, đá nhỏ | 8–16 | Tới mắt cá / gối |
| Bụi cây, hàng rào | 24–32 | Tới hông / ngực |
| Cây thường | 64–96 | 1,5–2,5 người |
| Cây lớn, cây cổ thụ | 128–160 | 3–4 người |
| Cột đèn lồng, cột buồm thuyền nhỏ | 96–128 | 2,5–3 người |
| Cây Mẹ | Ngoại lệ duy nhất; không bao giờ thấy trọn trong một khung hình | — |

- **Cùng mật độ chi tiết.** Cùng độ phân giải pixel, cùng số mảng sáng–tối trên một vật (3–4 mảng), cùng kiểu outline 1 px màu theo chất liệu. Không map nào vẽ mịn hơn hay thô hơn hẳn.
- **Cùng ánh sáng.** Sáng từ trên-trái, bóng ngả phải-dưới, bóng màu tím mờ, chỉ tách riêng nếu cần thay đổi hoặc xử lý che khuất, ở mọi map. Ánh sáng riêng của từng khu (tia nắng xiên ở Vườn Cây Mẹ, đèn linh thạch dưới hầm...) chỉ **cộng thêm** vào, không đổi hướng sáng chính.
- **Chung lõi màu.** Mỗi khu có palette riêng nhưng bắt buộc dùng chung: màu bóng `#2E2A4A`, màu sáu hệ linh năng, tím đá lạ, màu UI, bộ màu da/tóc nhân vật.
- **Nhân vật nổi trên mọi nền.** Nhân vật, NPC, Tinh Linh, dị thú phải tách khỏi mặt đất ở mọi map và mọi giờ (đặc biệt ở Rừng Sâu và ban đêm). Nếu không tách được thì chỉnh màu nền chứ không vẽ lại nhân vật cho riêng map đó.

### 3.2 Đồ vật và cây theo họ

- **Một loại vật = một họ asset.** Cây, đá, hàng rào, đèn, ghế... vẽ một **mẫu gốc** rồi tạo biến thể theo khu (đổi màu, thêm rêu/muối/dây leo/hoa văn), không vẽ lại từ đầu. Ví dụ: cột đèn lồng ở làng → bản mục có dây leo ở Bìa Rừng; cây sồi ở làng → bản tán dày, tối hơn ở Rừng Sâu → bản đứng giữa nước, lá phát sáng ở Vườn Cây Mẹ.
- Tên file thể hiện họ: `k1_01_flora_cay_soi_a` → `k1_05_flora_cay_soi_toi` → `k1_07_flora_cay_soi_dam`.
- **Người và Tinh Linh khác nhau theo quy tắc hai tộc** (mục 3.4), nhưng vẫn cùng góc nhìn, tỉ lệ và cách tô bóng. Nhìn ghế gỗ sống của Tinh Linh cạnh ghế gỗ đóng đinh của Người phải thấy đó là hai món đồ trong cùng một game.

### 3.3 Chỗ nối giữa các map

- **Mép map nối liền.** Hai map cạnh nhau dùng chung bản vẽ cắt cho hai phía ở dải mép (khoảng 3–4 ô): đường, cỏ, tường cọc nhìn từ hai phía phải khớp nhau.
- **Chuyển dần, không cắt cụt.** Càng gần ranh giới, đồ của bên kia càng xuất hiện nhiều hơn: gần tường cọc thì cỏ cao và rễ lấn vào làng; quanh Cổng Rễ thì lồng đèn lá, dây leo lẫn vào chợ làng; ở Vườn Cây Mẹ có vài món đồ của Người mà Bé Mơ lượm về.
- **Giao thoa chuyển theo dải:** map giao thoa luôn có một phía đậm hệ A, phía kia đậm hệ B, giữa là vật pha cả hai (cây mọc giữa nước, đá vân lửa, suối chảy qua quặng).
- Một vật mốc lớn nên **thấy được từ map bên cạnh** (ví dụ ngọn núi trên Đài Thiên Mạch nhô sau Rừng Sâu, hải đăng làng thấy từ Bìa Rừng) để người chơi cảm thấy các map là một thế giới liền mạch.

### 3.4 Hình khối theo nơi

| Nơi | Hình khối chủ đạo |
| --- | --- |
| Làng Hồ Lặng (Vành Biển) | Ngang, thấp, mềm: mái ngói/mái rạ dốc, bến gỗ, cồn cát, bờ đầm cong, thuyền nằm nghiêng trên bãi |
| Chợ làng, chi hội | Khối cao hơn xóm nhà, mái vải căng, biển gỗ treo, sân đá |
| Tường cọc, Bìa Rừng | Khối dài thấp: hàng cọc gỗ trên kè đá, chòi canh, cỏ cao; khoảng trống lớn |
| Mỏ | Bậc thang đá, đường chéo của ray goòng và tời gỗ, hố sâu |
| Vườn Cây Mẹ (giao thoa) | Tròn, cong, mọc lên từ rễ và nước; nhà là hốc cây, cành, tổ lớn; không có góc vuông |
| Rừng Sâu | Tròn hữu cơ nhưng rối, tán chồng tầng, tối |
| Đài Thiên Mạch | Đá đẽo vuông lạnh, trận văn khắc thẳng; đá lạ là lục giác, đường thẳng tuyệt đối |

**Quy tắc hai tộc** (vẫn theo luật chung ở 3.1)**:** đồ của Người có **góc vuông, gỗ xẻ, đá đẽo, sắt rèn, chữ khắc**. Đồ của Tinh Linh có **đường cong, gỗ sống, lá, dây leo, vỏ ốc, ký hiệu vẽ tay**. Ở chỗ hai tộc gặp nhau (Cổng Rễ, chợ), hai kiểu đặt cạnh nhau để kể chuyện.

## 4. Màu

### 4.1 Quy tắc

- Mỗi khu 24–32 màu; toàn game ≤ 96 màu. Lưu palette `.gpl` trong repo khi bắt đầu vẽ.
- **Bóng không đen/xám:** bóng ngả tím-xanh mát, chỗ sáng ngả vàng ấm.
- **Ánh sáng linh năng dùng màu của sáu hệ** (§6.1), chỉ ở dạng phát sáng, không làm màu vật liệu. **Ngọc lam chỉ dành cho Ẩn** (linh năng của Tâm Ẩn, gần như không thấy ở rìa các khu). **Tím chỉ dành cho đá lạ.** Nước, đèn, UI không dùng ngọc lam và tím.
- Tinh Linh có hoa văn sáng **hai màu** của hai hệ nơi sinh (Tinh Linh Đầm Sen: xanh lá Mộc + lam Thủy); Người thì không, trừ aura lúc thiền (màu và dáng theo hệ chính trong Nội Giới).
- UI tương tác dùng vàng kem.

### 4.2 Palette khởi điểm

| Nhóm | Hex |
| --- | --- |
| Ẩn (ngọc lam / lõi sáng) | `#3FD6B8` `#B8FFF0` |
| Sáu hệ, lõi sáng: Kim, Mộc, Thủy, Hỏa, Thổ, Phong | `#E8EDF2` `#B8F08E` `#8FD8F0` `#FFC27A` `#F2DC8A` `#EEF9FF` |
| Đá lạ (tím) | `#8F6BFF` |
| Bóng chung | `#2E2A4A` |
| Làng Hồ Lặng: cát, biển, nước đầm, ngói, gỗ thuyền, cỏ, rơm | `#E8D9A8` `#3F7FA0` `#5C8FA0` `#B5573A` `#7A5A3E` `#6E9A45` `#E8D49A` |
| Chợ làng: vải mái đỏ, vải mái chàm, đá sân, gỗ quầy, sắt rèn | `#C8483A` `#3E5A8A` `#B9AE98` `#9A7048` `#4E5560` |
| Tường cọc, Bìa Rừng: gỗ cọc, kè đá, cỏ, đất, lửa đuốc | `#8A6440` `#8E8A80` `#93C254` `#A08058` `#F2A040` |
| Mỏ: đất đỏ, đá, đèn linh thạch | `#A4553A` `#7A6E66` `#F0B860` |
| Vườn Cây Mẹ: lá trong, vỏ cây ấm, mặt đầm, sen, nắng xiên, hoa | `#9CCB5E` `#8C6440` `#6FAEB8` `#F2A7B8` `#FFE9B0` `#CFEFEA` |
| Rừng Sâu: rêu, lục tối, đá ướt, sương | `#2F5E3B` `#3E5A2E` `#56685F` `#CFE3DD` |
| Đài Thiên Mạch: đá xám lạnh, trận văn, đèn linh thạch, nền tối | `#7C8088` `#C8C0A8` `#E8C878` `#15171D` |
| UI: vàng kem, giấy, mực | `#FFE7A8` `#F7F1E3` `#2B2735` |

Các khu khác ([12](12-ban-do-cac-khu.md)) lấy màu chủ đạo theo hệ trội của khu ([03](03-world-and-maps.md) §1.1) và thêm palette riêng khi dựng khu đó.

### Tâm Ẩn và cây trung tâm

Tâm Ẩn là vùng cây trung tâm an toàn, có chỗ ở, Đài Khởi Sinh, suối và đường giao thoa. Cây Trung Tâm là vật mốc toàn lục địa; Cây Mẹ ở Đầm Sen là vật mốc làng địa phương. Thể hiện khác nhau bằng quy mô, bố cục và màu linh năng; không dùng chung một layout rồi đổi tên.

Ánh Ẩn ngọc lam tập trung ở gốc, rễ và suối; tán giữ mảng sáng–tối rõ. Không biến cả màn thành lớp glow, không dùng hình ảnh hiểm địa hoặc boss để mô tả vùng khởi sinh. Thân cây thuộc G3, phần tán cần che người thuộc G4, ánh/hạt thuộc G5.

## 5. Ánh sáng, giờ, thời tiết

Ưu tiên đọc rõ nhân vật, đường đi và vật tương tác; ánh sáng bổ sung không khí, không làm mất nét pixel.

- Đèn điểm cho đèn lồng, đuốc, quán, đèn linh thạch, lồng đèn lá của Tinh Linh, hải đăng, linh năng; nắng nhẹ có hướng.
- Vườn Cây Mẹ dùng **tia nắng xiên** (god rays) qua tán lá xuống mặt đầm làm dấu ấn riêng.
- Normal map cho nhà, đồ lớn, Cây Mẹ và mặt đất vùng nhà; nhân vật chỉ dùng viền sáng đơn giản.
- Màu phủ theo giờ, không vẽ lại asset:

| Giờ | Màu phủ | Ghi chú |
| --- | --- | --- |
| Sáng sớm | `#E8EEF5` | Sương trên đầm, thuyền ra khơi |
| Trưa | `#FFFFFF` | Bóng ngắn |
| Chiều vàng | `#FFD9A8` | Giờ đẹp nhất của làng; biển sáng vàng |
| Tối | `#6A6FA8` | Đèn lồng bật; hải đăng quét; Cây Mẹ và hoa văn Tinh Linh sáng lên |
| Khuya | `#3C3F6E` | Ít người |

- **Thời tiết:** nắng, mưa phùn, mưa rào, sương, gió biển, **Đêm Linh Triều** (linh năng dâng, cả map sáng theo màu hệ).
- Hướng sáng chính: trên-trái; bóng ngả phải-dưới, màu tím mờ, có thể đi cùng vật khi tĩnh.

## 6. Linh năng trên map

> **Linh năng là chính các yếu tố tạo nên thế giới**: Kim, Mộc, Thủy, Hỏa, Thổ, Phong ([07](07-power-system.md) §2). Trên map, **mỗi hệ hiện ra qua vật chất của nó**: nước có Thủy thì nước sáng, lửa có Hỏa thì lửa bốc đốm, cây có Mộc thì lá sáng và mọc dày, quặng có Kim thì vân kim lóe, đất đá có Thổ thì bụi vàng ửng, gió có Phong thì thành vệt gió. Nhìn ánh sáng là biết chỗ đó có hệ gì, và biết thiền ở đó sẽ mọc ra gì trong Nội Giới.
>
> Linh năng có từ thuở khai thiên trong mọi vật, nên map nào cũng phải thấy nó **cả ban ngày**. Nó loãng nhất ở Vành Biển (biển làm tan), đặc dần vào đất hoang, và đậm nhất ở lõi khu và vùng giao thoa ([03](03-world-and-maps.md) §1).

### 6.1 Màu và dáng của từng hệ

| Hệ | Lõi / viền | Hiện qua | Dáng chuyển động |
| --- | --- | --- | --- |
| **Kim** | `#E8EDF2` / `#A9B6C4` | Vân quặng, sắt rèn, mũi đá vỡ | Tia lóe hình sao 4 cánh, sắc, gần như đứng yên |
| **Mộc** | `#B8F08E` / `#5FA36A` | Lá, rễ, rêu, nấm, cỏ | Phấn sáng xoắn bay lên; cây quanh điểm tụ mọc dày, xanh hơn |
| **Thủy** | `#8FD8F0` / `#3F86B8` | Biển, đầm, suối, sương, mưa, cá | Gợn sáng chạy trên mặt nước; giọt bay lên rồi rơi |
| **Hỏa** | `#FFC27A` / `#E0503A` | Lửa trại, lò rèn, than, sét | Đốm lửa bay lên; không khí gợn nóng; than ửng theo nhịp |
| **Thổ** | `#F2DC8A` / `#B08A3A` | Đất ruộng, đá, vách núi, bậc miếu | Bụi vàng lắng thấp; đá ửng ấm; mặt đất rung nhẹ theo nhịp 47 |
| **Phong** | `#EEF9FF` / `#9CCFE6` | Gió, mây, đỉnh cao, cánh buồm | Vệt sáng dài theo gió; cỏ rạp theo vệt |
| **Ẩn** | `#B8FFF0` / `#3FD6B8` | Gần Tâm Ẩn, di vật Thời Khai Phá, hạt Ẩn trong Nội Giới | Trôi chậm, ấm; **sáu hệ hòa làm một** |
| **Tím** | `#8F6BFF` | Đá lạ, lõi trận ở Đài | Lục giác đứng yên, cạnh cứng, không bóng; nhấp nháy theo nhịp 47 |

- **Màu hệ chỉ dùng cho ánh sáng linh năng** (lớp hòa trộn cộng, G5), không dùng làm màu vật liệu. Nước đầm vẫn là `#5C8FA0` của palette làng; chỉ chỗ có Thủy mới có gợn sáng `#8FD8F0` chạy trên đó.
- **Ngọc lam là Ẩn**, hiếm: ở rìa các khu gần như không thấy, trừ hạt khởi đầu trong Nội Giới và vài di vật cổ. Càng gần Tâm Ẩn càng nhiều.
- **Giao thoa = hai màu đan vào nhau.** Ở vùng giao thoa, hai màu hệ xen nhau theo dải và xoắn vào nhau ở điểm tụ; đây là dấu nhận ra đất Tinh Linh từ xa.
- Hỏa phân biệt với đèn thường bằng dáng: đèn là điểm sáng đứng yên; Hỏa có đốm bay lên và nhịp 47.

### 6.2 Năm thành phần (dùng ở mọi map)

| Thành phần | Là gì | Vẽ thế nào | Lớp (§11) |
| --- | --- | --- | --- |
| **Mạch linh** | Đường linh năng chảy trong đất, đá, rễ, lòng sông | Vệt sáng mảnh, đứt quãng, nằm **dưới** mặt đất; mang **hệ của nơi nó chảy qua** (qua lòng sông là Thủy, qua rễ là Mộc, qua vỉa quặng là Kim) và đổi màu dần ở chỗ chuyển | G1 dấu tĩnh + G5 ánh sáng |
| **Điểm tụ** | Chỗ nhiều mạch gặp nhau. **Mọi điểm thiền ở [05](05-map-layouts.md) nằm trên điểm tụ, màu đúng hệ của điểm thiền đó** | Vũng sáng tròn; vật chất quanh đó biểu hiện hệ rõ nhất (đá ửng, nước gợn, lửa bốc...) | G5 ánh sáng + hạt |
| **Hạt linh** | Hạt sáng trôi trong không khí | 1–2 px, dáng theo hệ (§6.1); mật độ theo mức (§6.4) | G5 hạt |
| **Linh vật** | Vật đã thấm linh năng: bậc **Linh** ở [08](08-life-yields.md) §2 | Viền sáng **màu hệ của nó**: cá lấp lánh Thủy, thảo dược Mộc, Đá Vân Sáng Kim | Sprite G3 + ánh sáng G5 |
| **Vết sẹo mạch** | Chỗ Người đào, đốn, đắp đè lên linh mạch | Mạch bị cắt ngang, đầu mạch rỉ sáng yếu và nhòe; quanh đó cây cỏ héo. Ở làng ít, ở mỏ và chỗ qua ranh Giao Ước nhiều | G1 dấu tĩnh + G5 ánh sáng |

Thêm **nhịp 47 giây** ([02](02-story.md) hồi B): mọi linh năng trên map **sáng lên cùng lúc** khoảng 1 giây rồi dịu lại, như nhịp tim. Ở làng chỉ thấy rõ quanh Cổng Rễ và trên mạch; càng gần Đài Thiên Mạch nhịp càng mạnh và gắt.

### 6.3 Sinh khắc thấy được trên map

Tương sinh, tương khắc ([07](07-power-system.md) §2.1) không chỉ là số trong Nội Giới; người chơi **thấy** nó ngoài thế giới:

- **Sinh:** chỗ mạch Thủy chảy qua rễ cây, cây xanh và dày hơn hẳn (cả Vườn Cây Mẹ là một chỗ như vậy); than trong lò rèn ửng thêm khi có gió biển (Phong sinh Hỏa); quanh vỉa quặng trên vách đá, vân Kim sáng hơn (Thổ sinh Kim).
- **Khắc:** mạch Hỏa đi tới mép nước thì tắt thành hơi (Thủy khắc Hỏa); cỏ không mọc trên mạch Kim (Kim khắc Mộc); vệt gió dừng lại ở chân vách đá (Thổ khắc Phong).
- Bố cục map nên đặt ít nhất một chỗ sinh và một chỗ khắc gần đường đi, để người chơi tự nhận ra quy luật trước khi game giải thích.

### 6.4 Hệ và mức theo map (rìa khu Mộc)

| Mức | Map | Hệ chính | Ban ngày | Ban đêm / Linh Triều | Người và Tinh Linh làm gì với nó |
| --- | --- | --- | --- | --- | --- |
| **0 — loãng** | Làng Hồ Lặng | Thủy (biển, đầm), Thổ (miếu, ruộng), Hỏa (lò rèn), Mộc (vườn) | Gợn Thủy trên mặt đầm, rất nhạt ngoài biển; bụi Thổ ở sân miếu; đốm Hỏa ở lò rèn; thảo dược viền Mộc; hạt linh thưa (3–5 hạt mỗi màn hình) | Mạch dưới Đồi Miếu và bờ đầm hiện rõ; cá sáng | Trạm Tháp Học có la bàn linh lớn đo mạch; Tinh Linh treo lồng đèn lá trên điểm tụ |
| **0+ — chạm giao thoa** | Quanh Cổng Rễ | Mộc + Thủy (từ Đầm Sen theo Lối Rễ ra) | Hai màu xanh lá và lam tỏa ra từ vòm rễ như rễ cây, nhạt dần vào làng | Cổng chớp theo nhịp 47 | Chòi gác của Người đặt sát mạch; chợ Tinh Linh bày trên rễ sáng |
| **1 — đất hoang rìa** | Bìa Rừng | Mộc, Phong (đồng trống), Hỏa (lửa trại) | Vệt gió sáng trên đồng cỏ; đốm lửa ở trại thợ săn; mạch lộ ở vết sạt bờ sông | Dải sáng trên trời; sương sáng thành dải | Chòi canh có cờ đánh dấu vùng dày; thợ săn đi theo mạch để tìm dị thú |
| **1 — đất hoang rìa** | Mỏ Bỏ Hoang | Kim (vỉa sắt), Thổ (bậc đá) | Vân Kim lóe trên vách; nhát đào bật tia sao; nhiều vết sẹo mạch | Vỉa sáng như chòm sao trên vách | Tời gỗ đứng ngay trên mạch Kim |
| **2 — giao thoa, dịu** | Vườn Cây Mẹ | Mộc + Thủy, cân bằng | Rễ Cây Mẹ dưới mặt đầm là sông sáng hai màu; suối Thủy, vườn Mộc hòa vào nhau | Đom đóm, cả vườn phát sáng dịu | Nhà, đường, cầu của Tinh Linh **mọc dọc theo mạch**, đặt các hệ tương sinh cạnh nhau |
| **2 — đất hoang sâu** | Rừng Sâu | Mộc, Thủy (suối, thác), Phong (đỉnh) | Nấm, rêu sáng Mộc; mạch rối và đứt; thác có gợn Thủy | Rừng tối, chỉ còn mạch và mắt dị thú sáng | — |
| **2 — đất hoang sâu** | Hầm Mỏ | Kim, Thổ | Vân sáng trên đá; **vân Kim chạy thẳng như kẻ thước** về hướng bắc, dấu hiệu có thứ đang hút | — | — |
| **3 — cộng hưởng** | Đài Thiên Mạch | Mạch của mọi hệ bị kéo về lõi trận | Càng gần lõi, các màu càng **bị kéo lệch về tím**; vật nhỏ lơ lửng | Nhịp 47 gắt, cả đài chớp theo | Trận văn của Tháp Học khắc thẳng lên mạch |
| **X — ngoài chuẩn** | Hiếm | Tím | Lục giác tím, không bóng, nhấp nháy đều 47 giây | — | — |

### 6.5 Luật để linh năng "là ánh sáng, không phải sơn"

- **Không bắt buộc mọi khung hình có linh năng.** Tập trung ở điểm tụ, linh vật, mạch đặc trưng và dấu nhiễm tím; đường đi và khu sinh hoạt có khoảng nghỉ thị giác.
- Nhưng ban ngày phần pixel phát sáng linh năng **≤ 8% khung hình ở thị trấn ven biển, ≤ 15% ở đất hoang, ≤ 25% ở giao thoa và lõi**. Đây là trần, không phải chỉ tiêu. Ban đêm chỉ tăng sáng cục bộ nếu vẫn đọc rõ cảnh.
- Một khung hình thường chỉ có **1–3 hệ**, theo đúng vật chất đang thấy; không rải đủ sáu màu cho đẹp.
- Linh năng không có viền tối: lõi pixel sắc nét, quầng nhỏ và nhẹ. Chỉ phần phát sáng dùng additive; không blur/bloom toàn cảnh. Đá tím giữ cạnh cứng, không quầng.
- Sương, hạt, ánh sáng không được che dấu tương tác, đường đi và biên nhân vật; shader nước không làm méo bờ và sprite.
- Chi tiết dày quanh nhà, chợ, điểm hoạt động; không rải đều gây nhiễu toàn map.
- Linh năng đi theo địa hình thật: chảy theo dốc, gom ở nước và rễ, bị nền đá lát và tường chặn (chỉ rỉ sáng qua kẽ). Không rải ngẫu nhiên.
- Mạch và điểm tụ là **một lớp dữ liệu riêng** của map (§11.3), cùng nguồn với điểm thiền và hệ trong `server/data/`, để hình ảnh khớp với lối chơi (La bàn linh / Linh Cảm, sản lượng theo mức).

Linh năng: mềm, trôi, hữu cơ. Đá lạ: cứng, hình học, đứng yên.

## 7. Đồ vật kể chuyện

Mỗi map dùng ít nhất 3 mục trong nhóm phù hợp:

- **Làng chài:** thuyền nằm trên bãi, lưới phơi, giỏ cá, hải đăng đá, giếng, đống rơm, bù nhìn, xe bò, chuồng gà vịt, giàn phơi cá.
- **Chợ, chi hội:** quầy gỗ mái vải, biển gỗ khắc, xe kéo tay, đèn lồng giấy, lò rèn, bảng hợp đồng Hội Khai Phá, trạm Tháp Học với la bàn linh lớn.
- **Đất hoang, mỏ:** cột mốc Giao Ước phủ rêu (có cái bị nhổ), lán thợ săn, xe bò bỏ dở có dây leo, tời gỗ, ray goòng gỗ, cờ đánh dấu, gốc cây bị đốn ngay sau cột mốc.
- **Tinh Linh:** nhà trong hốc cây, cầu thang rễ, lồng đèn lá, bùa vẽ tay, tổ chim lớn làm ghế, chuông gió bằng vỏ ốc, vườn nấm, vòng đá, đồ Người lượm về treo làm trang trí.

Không dùng: máy móc, điện, nhựa, bê tông, kính lớn; kiến trúc, trang phục, chữ viết hay biểu tượng nhận ra ngay là của một quốc gia thật; mái cong cung điện; núi tiên.

Đồ có trạng thái (cửa đóng/mở, đèn tắt/bật, luống trống/đang lớn/chín) phải vẽ đủ khung trạng thái ngay từ đầu.

## 8. Nhân vật

### 8.1 Chung

- **Một khung thân 32×48** cho cả Người và Tinh Linh dạng người, để quần áo dùng chung.
- 4 hướng. Bộ chuyển động tối thiểu: đứng, đi, ngồi, câu, làm vườn, đào, thiền, tương tác, vẫy, đánh, né.
- Màu da/tóc/áo/lông đổi bằng palette swap, không vẽ lại.
- Chân dung thoại 96×96 với 6 biểu cảm.
- Trang phục fantasy cổ, gọn: áo vải, áo len thô, áo da, áo choàng, ủng, khăn quấn; Khai Phá Giả mặc giáp da nhẹ, túi đeo chéo, la bàn ở thắt lưng. Sức mạnh thể hiện qua tư thế và aura, không qua giáp to.
- Nhân vật đang tự hoạt động: viền mờ + icon nhỏ trên đầu.
- Outline 1 px tối màu theo chất liệu, không đen thuần.

### 8.2 Tinh Linh

Thứ tự lớp: bóng → thân → **đuôi sau** → quần áo → đầu → tóc → **tai** → mũ → phụ kiện → **hoa văn phát sáng** → aura.

| Loài | Tai | Đuôi | Hoa văn | Dạng thú (32×32) |
| --- | --- | --- | --- | --- |
| Cáo | Nhọn, to | Dày, chóp sáng | Vệt trên má | Cáo nhỏ |
| Mèo | Tam giác nhỏ | Dài, mảnh | Chấm trên trán | Mèo |
| Hươu | Tai dài + gạc nhỏ | Ngắn | Đốm trên vai | Hươu con |

- Hoa văn sáng **hai màu** theo hai hệ nơi sinh (Tinh Linh Đầm Sen: xanh lá + lam).
- Tai và đuôi có animation riêng: vẫy khi vui, cụp khi buồn, dựng khi cảnh giác. Đây là chỗ thể hiện cảm xúc rẻ nhất.
- Quần áo của Người mặc được cho Tinh Linh; mũ có lỗ tai là biến thể riêng.
- **Hóa Thú:** hiệu ứng tan thành hạt sáng hai màu rồi tụ lại thành dạng thú (≤ 6 khung). Dạng thú có đứng, chạy, lẩn.

### 8.3 Người và Tinh Linh phải phân biệt được ở ×2

- Tinh Linh có silhouette tai/đuôi rõ ở mọi hướng.
- Hoa văn của Tinh Linh luôn thấy được ban đêm.

## 9. Dị thú

- Bắt đầu từ loài quen thuộc, phóng to một đặc điểm (Lợn Gai = gai lưng; Nhện Tơ Điện = chân dài + tơ sáng; Khỉ Vách Đá = tay dài; Rắn Sương = thân mờ vào sương).
- Tròn, mắt rõ: là động vật, không phải quỷ.
- **Khác Tinh Linh:** dị thú đi bốn chân, mắt không có tròng, hoa văn linh năng rối và nhòe; Tinh Linh có hình gần người, mắt có tròng, hoa văn gọn, đối xứng, hai màu.
- **Khung báo đòn luôn có ánh sáng màu hệ của loài** ([06](06-monsters.md) §2.1).
- Không máu; hạ gục thì ngã và tan sương.
- Boss Thủ Lĩnh Mạch Gãy: gấu núi khổng lồ, lưng mọc tinh thể tím lục giác.

## 10. Art test — làm trước khi vẽ thêm

Một góc **Làng Hồ Lặng** khoảng 30×17 ô (1 khối nền 1024×1024 px là đủ), chạy trong Godot, **dựng 5 nhóm G1–G5, chỉ tạo thành phần cần thiết** (§11):

1. Nhà người chơi (cửa đóng/mở), vườn 4 luống ở 3 trạng thái, bờ đầm có 1 bến câu, một dải bãi biển với thuyền và lưới phơi, **Cổng Rễ** (vòm rễ, màn sáng xanh, chòi gác, lồng đèn lá, góc chợ Tinh Linh), một đoạn tường cọc có chốt, cột đèn lồng, một xe bò.
2. **Một avatar Người** và **một avatar Tinh Linh Cáo**, dùng chung 2 bộ quần áo; đi/đứng/ngồi/câu 4 hướng; Tinh Linh có thêm dạng thú.
3. Chu kỳ sáng → chiều → tối với 3–4 đèn điểm (đèn lồng, đuốc, hải đăng) và normal map cho nhà.
4. Linh năng đủ năm thành phần (§6.2), ít nhất 3 hệ (Thủy ở đầm, Thổ ở sân, Hỏa hoặc Mộc) và dải Mộc + Thủy hai màu tỏa ra từ Cổng Rễ: 1 điểm tụ có điểm thiền, hạt linh, 1 linh vật (thảo dược hoặc cá), 1 vết sẹo mạch; nhịp 47 giây; ban ngày và ban đêm; hoa văn Tinh Linh sáng lên.
5. Một Lợn Gai đứng ngoài tường cọc để thấy tương phản làng ↔ đất hoang.

**Đạt khi:**
- 5 người chưa biết dự án nhìn ảnh chụp nói được "Người" và "Tinh Linh" là ai trong ≤ 3 giây.
- Phân biệt được Tinh Linh với dị thú ngay lần đầu nhìn.
- Avatar đọc rõ ở ×2 trên điện thoại 6".
- **Linh năng:** người xem chỉ ảnh chụp ban ngày nói được "chỗ này có năng lượng lạ" và đoán đúng hệ của ít nhất 2 chỗ (nước, lửa, đất...) mà không cần giải thích, nhưng không thấy map bị phủ màu (§6.4). Tắt lớp hiệu ứng linh năng G5 thì làng trông như làng chài bình thường.
- **Độ nét:** kiểm tra ở ×1, ×2, ×3 khi camera đứng và di chuyển; so sánh bật/tắt G5 ngày–đêm. Pixel không nhòe, biên nhân vật/cửa/đường rõ.
- **Theo lớp:** bật/tắt từng lớp không làm lộ đường ráp ô ở nền; dời một cái cây hay ngôi nhà chỉ cần sửa `layout.json`, không vẽ lại nền.
- **Ghép thử:** đặt cạnh nhau trên một ảnh 1 cây, 1 đồ vật, 1 nhân vật của làng và bản biến thể Vườn Cây Mẹ / Rừng Sâu (vẽ phác). Người xem phải thấy chúng thuộc cùng một game, khác nơi chứ không khác tay vẽ.
- Ảnh chụp buổi tối đặt cạnh ảnh Eastward: thấy "cùng họ ánh sáng" nhưng là một thế giới riêng.
- Ghi lại thời gian vẽ 1 nhà + normal map, 1 bộ quần áo, 1 bộ tai/đuôi/dạng thú để ước tính chi phí cả game.

## 11. Dựng map theo lớp và quy ước file

> **Map không ghép toàn bộ từ tileset.** Mỗi map là một chồng **lớp PNG** đặt tự do lên lưới logic vuông (§2). Tile chỉ dùng ở chỗ thật sự lặp: mặt đường lát dài, sàn nhà, luống vườn. Còn lại (mặt đất, bờ đầm, bãi biển, vách đá, nhà, cây, đồ vật, linh năng) là **PNG vẽ tay**, đặt theo pixel.

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
- Nền G1 theo khối 1024×1024 px (32×32 ô logic); chỉ nạp khối quanh camera, mục tiêu 3×3 khối ở zoom chơi mặc định. Map 96×72 ô cần 3×3 khối, phần thừa ở mép được cắt.
- Đồ vật dùng chung họ asset; có trạng thái thì dùng sprite sheet. Nước, cờ, lá động và hiệu ứng không vẽ chết vào nền.
- Dải 3–4 ô nối map vẽ trên một nguồn chung rồi cắt cho hai phía; tile chỉ dùng khi phần đó thực sự lặp.
- Họa sĩ được dùng nhiều layer làm việc trong Aseprite; khi xuất gộp phần tĩnh phù hợp. Không bắt mỗi layer làm việc thành một PNG, không xuất ảnh trong suốt toàn khối cho một vật nhỏ.
- Chi tiết đời sống tập trung quanh nhà, chợ, điểm hoạt động; đường đi có khoảng nghỉ thị giác. Duyệt bằng zoom chơi thật, không chỉ ảnh toàn map thu nhỏ.

### 11.3 File nguồn và dữ liệu

- Nguồn nền: `client/art/<khu>/map/<map_id>/khoi_<x>_<y>.aseprite`; xuất nền thành `client/assets/<khu>/map/<map_id>/khoi_<x>_<y>_ground.png`. Chỉ xuất thêm nước/mask nếu cần.
- Asset rời: `client/art/<khu>/<loại>/<tên>.aseprite` → `client/assets/<khu>/<loại>/<tên>.png`; mái/tán và bóng riêng chỉ khi chức năng yêu cầu.
- Đối tượng trong `client/data/maps/<map_id>/layout.json`: `id`, `png`, `x`, `y` (pixel), `group` (G1–G5), `anchor`, `state`, `collision`; khai báo thêm thứ tự vẽ khi cần. Đây là quy chuẩn dữ liệu khi triển khai, chưa phải schema runtime đã chuyển đổi.
- Điểm tương tác dùng ID của `server/data/life_world.json`. Tọa độ server theo ô phải đổi sang pixel đúng một lần bằng hệ số 32; footprint và điểm đứng phải khớp ảnh.
- `client/data/maps/<map_id>/linh_nang.json` chứa mạch (đường + hệ + độ sáng), điểm tụ (tâm, bán kính, hệ); ghi rõ đơn vị tọa độ pixel. Điểm tụ phải khớp điểm thiền server sau quy đổi.
- Godot: thế giới trong `SubViewport` phóng nguyên, UI ở độ phân giải gốc. G3 dùng Y-sort; G4 xử lý che khuất. G5 quản lý node hiệu ứng theo độ sâu cần thiết; chỉ glow/hạt phát sáng dùng blend Add, không áp blend Add cho sương, khói hay toàn nhóm.
- Ánh sáng có thể dùng `PointLight2D`, `DirectionalLight2D`, `LightOccluder2D`, `CanvasModulate`; normal map qua `CanvasTexture`. Không tăng độ mềm ánh sáng tới mức mất biên pixel.
- Tiền tố là ID map bỏ `m_` (vd. `k1_01` Làng Hồ Lặng, `k1_05` Rừng Sâu, `k1_07` Vườn Cây Mẹ); asset dùng chung cả một khu dùng số khu (`k1`); dùng chung toàn game: `char`, `spirit`, `beast`, `ln` (linh năng). Đổi tên nơi không phải đổi tên file.
- Tên asset: `vung_loai_ten_bienthe`, chữ thường không dấu; mỗi vật có điểm neo chân, footprint và điểm đứng nếu tương tác được.
- Font: Be Vietnam Pro cho UI có dấu tiếng Việt; font pixel cho biển hiệu.

## 12. Nguồn asset và AI

- Chỉ dùng asset có license thương mại; lưu license ở `client/assets/LICENSES/`.
- AI tạo ảnh: chỉ dùng cho moodboard nội bộ. Asset đưa vào game phải do người vẽ hoặc chỉnh sửa đáng kể, có ghi chú.
- Không dùng logo, thương hiệu thật.

## 13. Bộ mô tả phong cách (concept AI và brief họa sĩ)

Dùng chung cho mọi ảnh concept tạo bằng AI (§12: chỉ làm moodboard nội bộ) và để giao việc cho họa sĩ. **Không ghi tên game hay tên studio vào lệnh tạo ảnh**; chỉ tả đặc điểm muốn mượn từ các tham chiếu ở §1. Lệnh viết bằng tiếng Anh vì model hiểu tốt hơn. Ảnh lưu ở `docs/game-design/concept/`.

Chưa có ảnh mốc cho bối cảnh fantasy; ảnh đầu tiên cần tạo là toàn cảnh Làng Hồ Lặng theo khối dưới đây.

### 13.1 Khối chung (đặt đầu mọi lệnh)

```text
Detailed hand-painted layered pixel art game map using 32px as a logical scale unit, with free pixel-aligned object placement, ground painted as one
continuous image, not repeating tiles. Straight top-down 3/4 camera: rooftops seen from
above with a short front facade, square-grid world coordinates without forced tile-sized objects, no isometric diamond, no
side view. Light from the top-left, soft cool purple shadows falling to the bottom-right,
1px dark outlines tinted by material (never pure black), 3-4 tone shading per object,
dense lived-in detail, harmonious limited palette. Ancient fantasy world: wood, stone,
thatch, tile, wrought iron, cloth; no machines, no electricity, no plastic, no concrete.
Spirit energy is the elements of the land glowing from within, in the color of each
element: blue ripples on water, orange embers rising from fires, green motes from plants,
white-silver star glints on ore, golden dust over earth and stone, pale streaks in the
wind. Where two elements meet, their two colors braid together. Purple hexagons only for
the unknown stone. Additive glow, no outlines, subtle in daylight.
No text, no UI, no logos, no real-country architecture, no palace roofs.
```

### 13.2 Khối theo nơi (rìa khu Mộc)

| Nơi | Mượn tinh thần từ (§1) | Khối mô tả |
| --- | --- | --- |
| Làng Hồ Lặng | đời sống ấm cúng; đồ vật kể chuyện | `golden afternoon in a cozy seaside fishing village, beach and sea along the south edge, fishing boats pulled up on the sand, drying nets and fish racks, a small stone lighthouse, a brackish lagoon behind dunes with wooden fishing piers, orange tiled and thatched roofs, fenced yards with herb patches, paper lanterns, a wooden stake wall with a watchtower on the north side facing a dark ancient forest, blue ripples on the lagoon, embers over a forge, a giant arch of living roots on the west edge glowing green and blue` |
| Chợ làng | chợ đông, đồ đời sống, đèn điểm | `busy village market square, cloth-roofed wooden stalls in red and indigo, carved wooden signs, a blacksmith forge, a stone guild hall with a contract board, a scholars' outpost with a large brass spirit compass, lantern glow, spirit stalls of mushrooms and leaf charms laid on glowing roots` |
| Bìa Rừng | thiên nhiên lấn đất người | `wild windy borderland just beyond a wooden stake wall, tall grass, abandoned fields, an old ox cart swallowed by vines, mossy boundary stones, a hunters' camp with a campfire, pale glowing wind streaks over the grass, exposed green spirit veins in eroded riverbanks, cooler palette than the village` |
| Rừng Sâu | thiên nhiên hoang, rừng cổ | `ancient layered forest, giant ferns, mossy boulders, dense fog in hollows, faintly glowing mushrooms, cliffs and waterfalls, tangled broken green root-veins, blue glow along streams, dark greens with cold highlights` |
| Mỏ, Hầm Mỏ | — | `terraced red-rock open pit, wooden winches and mine cart rails, miners' shack with warm lamps; underground: dark tunnels, warm spirit-stone lamps, silver star glints on ore veins running unnaturally straight like ruled lines` |
| Vườn Cây Mẹ | thiên nhiên sống; pixel + ánh sáng | `dreamlike spirit village in a flooded forest around a colossal mother tree standing in a mirror-still lagoon, lotus pads, translucent leaves, slanted god rays onto the water, fireflies, homes inside tree hollows and on branches, rope bridges, no straight lines or right angles, giant roots under the water glowing in braided green and blue, soft jade sky` |
| Đài Thiên Mạch | pixel + ánh sáng | `sealed underground stone observatory of a scholars' order, cold carved corridors etched with straight glyph lines, flickering spirit-stone lamps, empty cages, a ritual circle around a humming core of purple hexagonal crystals casting no shadow, spirit veins of every color bending toward purple, small objects floating` |

### 13.3 Cách viết một lệnh

1. Khối chung (13.1).
2. Khối nơi (13.2).
3. Bố cục lấy từ [05](05-map-layouts.md), tả theo hướng bắc–nam–đông–tây, kèm những gì phải khớp qua mép map ([03](03-world-and-maps.md) §3: sông, tường, đường).
4. Giờ và thời tiết theo §5 nếu cần.
