# 06 — Quái (dị thú)

> Quái chia theo **khu vực và lớp đất** của lục địa (Vành Biển của Người → đất hoang của dị thú → giao thoa của Tinh Linh) ([03](03-world-and-maps.md) §1, map từng khu ở [12](12-ban-do-cac-khu.md)). Rìa khu Mộc dùng đúng 14 loài đã có trong backend. Các khu khác mới ở mức thiết kế, chưa có dữ liệu.

Dị thú là **động vật bị linh năng thấm quá mức**. Không có cấp độ hay cảnh giới tu luyện; thay vào đó, **Nội Giới của dị thú mọc loạn, phình to toàn thửa đục rồi nuốt mất ý thức** ([07](07-power-system.md) §1). Quái sống chủ yếu ở **đất hoang** giữa Vành Biển (Người) và giao thoa (Tinh Linh); có ít hơn ở giao thoa, và dữ nhất ở hiểm địa. **Thị trấn ven biển và làng Tinh Linh không có quái** ([12](12-ban-do-cac-khu.md) §1.1).

Số liệu ở đây là **đơn vị thiết kế**, chưa phải chỉ số backend:
- **Máu** = số **nhát đánh thường** của người chơi đủ sức cho vùng đó để hạ (giai đoạn đầu: Nội Giới hình dạng Đảo, vũ khí đầu).
- **Sát thương** = % máu tối đa của người chơi đủ sức cho vùng đó, mỗi đòn trúng.
- **Tốc độ** = so với tốc độ đi bộ của người chơi (1,0).

Tỉ lệ rơi đồ và giá trị để sau, khi thiết kế kinh tế.

## 1. Quái theo khu vực

### 1.1 Hệ của quái đi theo đất

Một con thú sống ở đâu thì **hấp thụ hệ của đất đó**. Vì vậy:

| Map | Quái mang hệ gì | Hình | Cảm giác đánh |
| --- | --- | --- | --- |
| **Đất hoang / lõi** của một khu | **Một hệ** = hệ trội của khu | Vân sáng một màu, rõ | Ổn định, đọc được |
| **Giao thoa tương sinh** (quanh làng Tinh Linh) | **Hai hệ** của hai khu gặp nhau | Vân hai màu hòa vào nhau | Hai kiểu đòn nối nhau mượt; ít con, ít khi chủ động tấn công Tinh Linh |
| **Hiểm địa (giao thoa tương khắc)** | Hai hệ khắc nhau: quái **"rối"** (Nội Giới bị hai luồng khí xé rách liên tục) | Vân hai màu giành nhau, nhấp nháy | **Đổi hệ mỗi 10 giây** (màu vân báo trước 1 giây); hệ hiện tại quyết định khắc/bị khắc với người chơi |
| **Hầm** | Hệ của khu, đôi khi thêm hệ của vỉa/nguồn trong hầm | | |
| Gần **đá tím** | Thêm **Tím** (biến thể Nhiễm Tím, §6) | Tinh thể tím lục giác | Có xung 47 giây |

Quái "rối" là thứ chỉ hiểm địa có: người chơi phải đổi cách đánh theo màu, hoặc chờ đúng lúc quái mang hệ mình khắc được.

### 1.2 Mỗi khu một bộ quái

Mỗi khu có **6–10 loài thường, 2 đầu đàn, 1 boss vùng**. Đất hoang chiếm phần lớn loài; giao thoa có 2 loài hai hệ (ít và hiền hơn, vì Tinh Linh giữ linh năng ở đó cân bằng). Nguyên tắc chọn loài:
- Gốc là **động vật thật của đúng môi trường đó** (cua ở biển, bọ cạp ở sa mạc, sơn dương ở vách núi).
- Mỗi loài **dạy một điều gắn với địa hình khu**: thủy triều, nắng nóng, sét, gió, gờ núi, phản chiếu...
- Loài ở giao thoa là cầu nối: mang hệ của khu này và khu bên cạnh, hé trước cách đánh của khu bên kia.
- Boss vùng kiểm tra mọi điều của khu và **dùng chính địa hình lõi** (xoáy nước, nham thạch, đá sống...).
- Không lặp lại cơ chế giữa các khu; loài cùng gốc (rết, dơi, cua) phải khác hẳn đòn.

Thế giới mở: khu nào cũng vào được từ đầu, và **khu nào cũng có đủ vùng từ đất hoang ven rìa tới lõi sâu** (§2.3). Thứ tự khu dưới đây chỉ là thứ tự mạch truyện gợi ý.

| Khu | Mạch truyện gợi ý | Quy mô dị thú trong khu | Loài thường | Đầu đàn | Boss vùng | Chi tiết |
| --- | --- | --- | --- | --- | --- | --- |
| Mộc (rìa) | 1 | Sơ Nhiễm → Bành Trướng | 10 | 3 | Thủ Lĩnh Mạch Gãy (dungeon, Nhiễm Tím) | §3–4 |
| Thủy | 2 | Sơ Nhiễm → Chúa Đàn | 7 | 2 | Cá Sấu Xoáy (lõi, Cự Thú) | §5.1 |
| Kim | 3 | Sơ Nhiễm → Chúa Đàn | 8 | 2 | Nhím Thép (lõi, Cự Thú) | §5.2 |
| Phong | 4 | Tụ Khối → Chúa Đàn (hiểm địa: Quái Rối) | 7 | 2 | Đại Bàng Mắt Bão (lõi, Cự Thú) | §5.3 |
| Thổ | 5 | Tụ Khối → Chúa Đàn | 6 | 2 | Trùn Đá Vực Sâu (lõi, Cự Thú) | §5.4 |
| Hỏa | 6 | Tụ Khối → Chúa Đàn (hiểm địa: Quái Rối) | 10 | 2 | Tê Giác Nham (lõi, Cự Thú) | §5.5 |
| Lõi Mộc | — | Bành Trướng → Chúa Đàn | 4 | 1 | Rùa Lưng Rừng (lõi, Cự Thú) | §5.6 |
| Tâm Ẩn | Trung tâm an toàn | Không có dị thú thù địch | 0 | 0 | Không | [12 §9](12-ban-do-cac-khu.md#9-tâm-ẩn-giữa--vùng-cây-trung-tâm) |

## 2. Hành vi chung

### 2.1 Vòng trạng thái

```text
Lang thang ──thấy người chơi──► Cảnh giác ──► Báo đòn ──► Ra đòn ──► Hở
    ▲                                            ▲                    │
    │                                            └────────────────────┘
    └── Về lãnh địa ◄── người chơi ra khỏi lãnh địa / quái còn ≤ 20% máu (một số loài bỏ chạy)
```

- **Lang thang:** đi chậm quanh tâm lãnh địa, ăn, ngủ (animation idle riêng).
- **Cảnh giác:** dừng, quay về phía người chơi, dấu "!" nhỏ; 0,5 giây trước khi tấn công. Người chơi lùi ra ngoài tầm phát hiện thì quái quên.
- **Báo đòn:** luôn có **ánh sáng màu hệ của quái** + âm thanh riêng. Thời gian báo đòn dài hơn ở dị thú quy mô Nội Giới nhỏ.
- **Hở:** cửa sổ người chơi đánh trả an toàn.
- **Về lãnh địa:** hồi dần máu, không đánh nữa.

### 2.2 Tầm phát hiện theo role

| Người chơi | Tầm phát hiện |
| --- | --- |
| Người | 100% |
| Tinh Linh | 60% |
| Tinh Linh đang Hóa Thú | 30%; không phát hiện được nếu đứng yên trong bụi |
| Đang dùng La bàn linh / Linh Cảm | +20% (phát sáng nhẹ) |

Tinh Linh ở **đúng khu hệ của mình** (vd. Tinh Linh Mộc trong khu Mộc) bị phát hiện thêm chậm: tầm còn 50%.

### 2.3 Phân tầng sinh thái & Quy mô dị thú

Độ khó **tăng theo độ sâu vào đất hoang**, giống nhau ở mọi khu. Các nơi có cư dân hoặc cội nguồn sinh ra đều có vùng an toàn: Vành Biển (Người dựng tường), giao thoa tương sinh quanh làng Tinh Linh (Tinh Linh giữ linh năng cân bằng), và **toàn vùng Tâm Ẩn** an toàn, bao gồm Đài Khởi Sinh, Cây Trung Tâm, khu cư trú và lối ra. Người chơi Người đi từ biển vào, người chơi Tinh Linh đi từ Tâm Ẩn tỏa ra các vùng giao thoa; cả hai gặp vùng dữ ở giữa.

Dị thú **không có cấp độ hay cảnh giới**; sức mạnh của chúng tương ứng với **Quy mô Nội Giới loạn** (mức độ tích tụ linh năng đục và biến dị cơ thể).

| Phân tầng vùng | Ở đâu | Quy mô Nội Giới dị thú | Tương quan với người chơi | Báo đòn | Đánh trúng mất | Máu (nhát) |
| --- | --- | --- | --- | --- | --- | --- |
| **1 — Ven** | Đất hoang sát Vành Biển; giao thoa quanh làng Tinh Linh | **Sơ Nhiễm ~ Tụ Khối** (vài đốm linh năng tới ~20–40 thửa đục) | Người chơi mốc **Hạt** tới **Đảo** (~20 thửa) | 0,7–1,0 giây | 8–15% | 2–4 |
| **2 — Sâu** | Đất hoang sâu, hầm mỏ, vách đá gần bờ | **Tụ Khối cứng ~ Bành Trướng** (~40–80 thửa đục) | Người chơi mốc **Đảo** tới **Đảo Lớn** (~60 thửa) | 0,5–0,7 giây | 12–20% | 4–7 |
| **3 — Lõi** | Lõi khu, thú bành trướng già cỗi | **Bành Trướng (Hung Thú)** (~80–150 thửa đục) | Người chơi mốc **Đảo Lớn** (~60–150 thửa) | 0,4–0,6 giây | 15–25% | 5–8 |
| **Đầu đàn** | Rải rác từng vùng đất hoang | **Chúa Đàn** (~150–400 thửa đục) | Cần Nội Giới mốc **Đảo Lớn** vững hoặc tổ đội | 0,6–0,8 giây | 12–16% | 12–18 |
| **Boss vùng / Ngục** | Lõi sâu nhất của khu / Đài Thiên Mạch | **Cự Thú / Lĩnh Vực / Nhiễm Tím** (400+ thửa đục) | Cần Nội Giới **Quần Đảo** (~150+ thửa) hoặc đánh hội đồng | Đa dạng, nhịp 47s | 15–25% | 40 nhát (chuẩn 1 người) |
| **4 — Hiểm** | Hiểm địa (giao thoa tương khắc) | **Quái Rối** (Nội Giới bị hai hệ giằng xé) | Cần Nội Giới đa hệ, biết chuyển dịch khắc chế | 0,35–0,5 giây | 18–25% | 8–12 |

Không có cổng nào chặn theo cấp số. Toàn bộ lục địa kể cả Tâm Ẩn đều mở từ đầu, không có cổng khóa. Người chơi có Nội Giới nhỏ vẫn có thể liều mình bước sâu vào đất hoang hay hiểm địa; họ chỉ khó sống sót trước luồng linh năng đục và quái vật áp đảo nếu chưa đủ vững. Bản đồ (phím M) và biển báo ở rìa mỗi vùng cảnh báo độ sâu sinh thái.

Khi vào vùng đất hoang sâu và hiểm địa, dị thú không chỉ tích tụ nhiều linh năng đục hơn mà **có thêm luật** (địa hình, thời tiết, đổi hệ). Báo đòn không bao giờ ngắn hơn 0,35 giây.

Nội Giới người chơi càng lớn (diện tích rộng tăng máu, núi đá tăng thủ, rừng dày hồi máu) thì đánh càng mạnh và chịu đòn càng tốt, nên dị thú ở ven rìa dần trở nên nhỏ bé; quái không tự mạnh lên theo người chơi.

**Tâm Ẩn không thuộc thang nguy hiểm 1–4:** không có quái Căn Nguyên hay boss tại đây. Mạch linh hài hòa không gây đục Nội Giới. Không đặt lãnh địa quái chồng lên tuyến nối nơi spawn với làng giao thoa.

### 2.4 Hệ và khắc

Hạ dị thú cho nhiều linh năng nhưng **đục**, mang **hệ** theo loài ([07](07-power-system.md) §2). Hệ chính của người chơi **khắc** hệ của loài thì đòn mạnh hơn 25%, bị loài khắc thì yếu đi 15%.

Nhắc lại vòng khắc: Mộc ⊣ Thổ ⊣ Thủy ⊣ Hỏa ⊣ Kim ⊣ Mộc; Thổ ⊣ Phong ⊣ Mộc. Bảng dưới ghi "khắc được bằng" = hệ người chơi nên có.

Đi qua các khu, hệ quái đổi theo khu: người chơi có Nội Giới lệch hẳn một hệ sẽ thấy có khu dễ, có khu khó. Đó là lý do để **xây Nội Giới đa dạng** hoặc đi cùng bạn khác hệ.

## 3. Rìa khu Mộc — quanh Làng Hồ Lặng và Vườn Cây Mẹ

Đây là rìa đất hoang khu Mộc ngay sau Làng Hồ Lặng (Vành Biển), có một nhánh linh mạch Kim chạy qua mỏ và sương từ biển, đầm thổi vào. Bộ quái vì vậy pha nhiều hệ, dùng để **dạy mọi hệ một lần** trước khi vào các khu thuần.

| # | Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Loại | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Gà Rừng Mào Sét | Gà rừng | Hỏa + Phong | Bìa Rừng | Sơ Nhiễm (~10 thửa đục) | Thường | Thủy, Thổ |
| 2 | Lợn Gai | Heo rừng | Thổ | Bìa Rừng | Tụ Khối (~25 thửa đục) | Thường | Mộc |
| 3 | Nhện Tơ Điện | Nhện | Mộc + Hỏa | Bìa Rừng, Mỏ, Hầm | Tụ Khối (~30 thửa đục) | Thường | Kim, Phong, Thủy |
| 4 | Rết Đá | Rết | Thổ | Mỏ Bỏ Hoang | Tụ Khối cứng (~45 thửa đục) | Thường | Mộc |
| 5 | Dơi Vân Quặng | Dơi | Kim + Phong | Hầm Mỏ | Tụ Khối bầy (~15 thửa đục/con) | Thường | Hỏa, Thổ |
| 6 | Sói Rêu | Chó sói | Mộc | Rừng Sâu | Bành Trướng (~80 thửa đục) | Thường | Kim, Phong |
| 7 | Rắn Sương | Rắn | Thủy | Rừng Sâu | Bành Trướng (~75 thửa đục) | Thường | Thổ |
| 8 | Khỉ Vách Đá | Khỉ | Thổ + Phong | Rừng Sâu | Bành Trướng (~90 thửa đục) | Thường | Mộc, Thổ |
| 9 | Cú Đêm Linh | Cú | Phong | Rừng Sâu (đêm) | Bành Trướng (~85 thửa đục) | Thường | Thổ |
| 10 | Chuột Tím | Chuột | Kim (tạm, sau là Tím) | Đài Thiên Mạch | Nhiễm Tím (~20 thửa đục + nứt tím) | Thường | Hỏa |
| E1 | Lợn Gai Đầu Đàn | Heo rừng | Thổ | Bìa Rừng | Chúa Đàn (~160 thửa đục) | Đầu đàn | Mộc |
| E2 | Nhện Mẹ | Nhện | Mộc + Hỏa | Hầm Mỏ | Chúa Đàn (~220 thửa đục) | Đầu đàn | Kim, Phong, Thủy |
| E3 | Khỉ Đầu Đàn | Khỉ | Thổ + Phong | Rừng Sâu | Chúa Đàn (~260 thửa đục) | Đầu đàn | Mộc, Thổ |
| B1 | Thủ Lĩnh Mạch Gãy | Gấu núi | Kim + Thổ (tạm, kèm Tím) | Đài Thiên Mạch | Cự Thú Lõi / Vết nứt tím (>400 thửa) | Boss dungeon | Hỏa, Mộc |

Mỗi quái thường **dạy đúng một điều**; quái đầu đàn kiểm tra điều đó; boss kiểm tra tất cả. Đầu đàn và boss có mặt trong thế giới từ đầu; hạ chúng lần đầu thì mở cảnh truyện tương ứng ([02](02-story.md) §10), không phải ngược lại. Mỗi dị thú cũng có Nội Giới riêng, mọc loạn: đầu đàn có Nội Giới to hơn, boss có vết nứt tím.

### 3.1 Hồ sơ từng quái

#### 1. Gà Rừng Mào Sét — Sơ Nhiễm (Bìa Rừng)

- **Hình:** gà rừng to cỡ chó nhỏ, mào và đuôi có tia sáng đỏ cam nhấp nháy.
- **Nhóm:** 4 con, ruộng hoang Bìa Rừng.
- **Hành vi:** chạy vòng quanh người chơi; **mổ lao** ngắn (lùi người, xù lông báo đòn 0,9 giây). Còn 1 con thì bỏ chạy.
- **Dạy:** quan sát nhiều mục tiêu, không bị vây.
- **Máu / sát thương / tốc độ:** 2 nhát / 6% / 1,3.
- **Rơi:** lông mào sét, trứng.

#### 2. Lợn Gai — Tụ Khối (Bìa Rừng)

- **Hình:** heo rừng lưng mọc gai đá có vân sáng vàng đất; to gần bằng người.
- **Nhóm:** 2 con, đồng cỏ Bìa Rừng.
- **Hành vi:** **gầm** (cúi đầu, chân cào đất, 1,0 giây) → **lao thẳng** 4 ô → **đứng thở** 1,2 giây. Lao trúng cây/xe bò bỏ dở thì choáng thêm 1 giây.
- **Dạy:** né ngang, đánh khi nó thở; dẫn nó lao vào vật cản.
- **Máu / sát thương / tốc độ:** 4 nhát / 12% / 0,8 (khi lao 3,0).
- **Rơi:** da gai, nanh.

#### 3. Nhện Tơ Điện — Tụ Khối (Bìa Rừng, Mỏ, Hầm)

- **Hình:** nhện chân dài cỡ con mèo, bụng có vạch sáng; tơ phát sáng xanh lá ánh đỏ.
- **Nhóm:** 3 con; Bìa Rừng (quanh xe bò bỏ dở), Mỏ (bãi tời), Hầm (Hầm Tây).
- **Hành vi:** giăng **lưới tơ** trên đất (vùng 2×2 ô, tồn tại 8 giây, đi vào bị chậm 50%); **cắn** khi đứng cạnh (báo đòn 0,8 giây, giơ hai chân trước). Bám tường, leo lên xe bò.
- **Dạy:** đọc mặt đất, tránh vùng tơ, đánh từ bên hông.
- **Máu / sát thương / tốc độ:** 3 nhát / 8% / 1,1.
- **Rơi:** tơ điện.

#### 4. Rết Đá — Tụ Khối cứng (Mỏ Bỏ Hoang)

- **Hình:** rết dài 2 ô, vỏ như đá đỏ, các đốt sáng mờ.
- **Nhóm:** 3 con, Bậc đá ở Mỏ Bỏ Hoang.
- **Hành vi:** **chui xuống đất**, đi ngầm; mặt đất **nứt và rung** ở chỗ nó sắp trồi lên (báo đòn 0,8 giây, thấy rõ hơn bằng La bàn linh/Linh Cảm) → **trồi lên cắn** → nằm trên mặt đất 2 giây (hở).
- **Dạy:** đọc dấu hiệu dưới chân, dùng công cụ cảm nhận.
- **Máu / sát thương / tốc độ:** 6 nhát / 14% / ngầm 1,4.
- **Rơi:** vỏ đá, quặng lẫn trong vỏ.

#### 5. Dơi Vân Quặng — Tụ Khối bầy (Hầm Mỏ)

- **Hình:** dơi nhỏ, cánh có vân như mạch quặng bạc, mắt sáng.
- **Nhóm:** đàn 4–6, Hang Giữa ở Hầm Mỏ; bay ngang đường ray goòng.
- **Hành vi:** treo trên trần; khi người chơi tới gần thì **cả đàn sà xuống** theo một đường thẳng (kêu ré + đổ bóng trên đất 0,7 giây trước). **Sợ ánh sáng:** đèn linh thạch và vùng sáng làm chúng bay lên.
- **Dạy:** đọc bóng đổ, dùng ánh sáng làm vùng an toàn.
- **Máu / sát thương / tốc độ:** 1 nhát mỗi con / 5% mỗi con / 1,8.
- **Rơi:** cánh vân quặng.

#### 6. Sói Rêu — Bành Trướng (Rừng Sâu)

- **Hình:** sói lông dài phủ rêu, mắt xanh lá; con đầu đàn có rêu dày hơn.
- **Nhóm:** đàn 3, Rìa rừng ẩm.
- **Hành vi:** **không lao vào cùng lúc**. Một con đối mặt, hai con **đi vòng ra sau**. Con phía trước **hú** (báo đòn 0,6 giây) là tín hiệu cả đàn vồ. Hạ một con thì hai con còn lại lùi lại, rồi tấn công lại.
- **Dạy:** giữ lưng sát vật cản, ưu tiên mục tiêu.
- **Máu / sát thương / tốc độ:** 5 nhát / 12% / 1,2.
- **Rơi:** lông rêu, nanh sói.

#### 7. Rắn Sương — Bành Trướng (Đầm Sương)

- **Hình:** rắn dài, thân mờ dần vào sương, chỉ đầu và mắt sáng rõ.
- **Nhóm:** 2–3 con, Đầm Sương.
- **Hành vi:** **vô hình trong sương** (chỉ thấy gợn sương di chuyển); La bàn linh/Linh Cảm làm nó hiện rõ. **Phóng cắn** từ 3 ô (gợn sương dừng lại 0,6 giây trước). Cắn trúng gây **độc**: mất máu chậm trong 4 giây.
- **Dạy:** dùng công cụ cảm nhận, kiên nhẫn.
- **Máu / sát thương / tốc độ:** 5 nhát / 10% + độc 6% / 1,0 (phóng 4,0).
- **Rơi:** vảy sương, nọc.

#### 8. Khỉ Vách Đá — Bành Trướng (Vách Đá)

- **Hình:** khỉ tay rất dài, lông xám, khớp tay có tinh thể sáng.
- **Nhóm:** 3 con, Vách Đá ở Rừng Sâu.
- **Hành vi:** đứng trên gờ đá cao, **ném đá** (vòng tròn đỏ trên đất nơi đá rơi, 0,7 giây); khi người chơi tới chân vách thì **nhảy xuống đập** (vòng tròn lớn hơn) rồi ngồi thở 1,5 giây trước khi leo lại.
- **Dạy:** tìm chỗ nấp, ép quái xuống đất.
- **Máu / sát thương / tốc độ:** 6 nhát / đá 10%, đập 16% / 1,1.
- **Rơi:** lông khỉ, đá tinh thể.

#### 9. Cú Đêm Linh — Bành Trướng, chỉ ban đêm (Tán Cao)

- **Hình:** cú lớn, lông xám bạc, khi bay để lại vệt sáng trắng mờ.
- **Nhóm:** 2 con, Tán Cao ở Rừng Sâu; **chỉ xuất hiện từ tối tới sáng**.
- **Hành vi:** bay vòng trên cao, **không có tiếng**; trước khi bổ nhào, đôi mắt **sáng lên** trên tán cây và vang một tiếng cú duy nhất (0,6 giây). Bổ xong đậu xuống đất 2 giây.
- **Dạy:** nghe âm thanh, để ý chu kỳ ngày đêm.
- **Máu / sát thương / tốc độ:** 4 nhát / 15% / bay 2,0.
- **Rơi:** lông cú bạc.

#### 10. Chuột Tím — Nhiễm Tím (Đài Thiên Mạch)

- **Hình:** chuột cỡ bàn tay, lưng mọc tinh thể tím lục giác. Dị thú duy nhất ở rìa khu Mộc có **màu tím**: chúng bị nhiễm cả linh năng lẫn đá tím từ lõi trận.
- **Nhóm:** đàn 4, sáu đàn rải ở hành lang, phòng trận và kho của Đài. Vào qua vách sập ở Phòng Trận.
- **Hành vi:** chạy thành dòng theo hành lang; **cứ 47 giây** cả đàn cùng **phát xung** (lóe tím, đẩy người chơi lùi). Từng con yếu, nhưng xung của cả đàn rất đau: đứng giữa hành lang lúc xung là mất gần một phần năm máu. Nấp vào hốc tường hoặc phòng bên cạnh để tránh.
- **Dạy:** đếm nhịp 47 giây; chuẩn bị cho boss.
- **Máu / sát thương / tốc độ:** 2 nhát mỗi con / 6% mỗi con, xung 18% / 1,5.
- **Rơi:** mảnh tinh thể tím (vật phẩm cốt truyện, rất hiếm).

### 3.2 Đầu đàn và boss khu Mộc (rìa)

#### E1. Lợn Gai Đầu Đàn

- **Ở đâu:** tâm Đồng cỏ cao, Bìa Rừng (112,66). Luôn có mặt, hồi sinh mỗi ngày một lần. Bài thi tập sự (hồi B) giao việc hạ nó.
- **Hình:** to gấp rưỡi Lợn Gai, gai lưng sáng mạnh, một nanh gãy.
- **Khác Lợn Gai thường:** lao **hai lần liên tiếp** (lần hai đổi hướng theo người chơi); gầm gọi thêm 2 Lợn Gai khi còn 50% máu.
- **Máu:** 12 nhát.

#### E2. Nhện Mẹ

- **Ở đâu:** cuối Hầm Tây, Hầm Mỏ.
- **Hình:** nhện cỡ con bò, bụng chứa trứng sáng.
- **Khác:** giăng tơ phủ **nửa hang**, chỉ để lại lối đi hẹp; đẻ 2 nhện con mỗi 15 giây; **kéo** người chơi lại gần bằng sợi tơ (sợi tơ sáng 0,8 giây trước khi kéo, né được).
- **Máu:** 16 nhát.

#### E3. Khỉ Đầu Đàn

- **Ở đâu:** đỉnh Vách Đá, Rừng Sâu.
- **Hình:** khỉ lưng bạc, tinh thể sáng mọc trên cả hai vai.
- **Khác:** ra lệnh cho các khỉ khác ném đá cùng lúc (nhiều vòng đỏ); tự nhảy giữa các gờ đá; khi còn 30% máu thì **giật một tảng đá lớn** rồi lăn xuống theo đường thẳng.
- **Máu:** 18 nhát.

#### B1. Thủ Lĩnh Mạch Gãy — boss dungeon Đài Thiên Mạch

- **Ở đâu:** Phòng Lõi, Đài Thiên Mạch. Sàn tròn khắc trận văn, 4 cột đá che, lõi trận ở giữa.
- **Hình:** gấu núi khổng lồ (≤ 128 px), lưng mọc **tinh thể tím lục giác**, các vết nứt sáng trên da. Lọt vào đài qua vách sập, ngồi canh lõi suốt bảy năm.
- **Trận chung:** Đài là map 30 người; ai đứng trong Phòng Lõi đều đánh cùng một con gấu, ai gây sát thương đều được tính hạ boss.
- **Máu:** 40 nhát cho một người, nhân theo số người trong Phòng Lõi lúc bắt đầu trận (×(1 + 0,5 × số người thêm)); chia 3 giai đoạn.

| Giai đoạn | Máu | Đòn | Dạy lại từ |
| --- | --- | --- | --- |
| 1 | 100–66% | **Lao** thẳng (như Lợn Gai), **vồ** trước mặt (báo đòn 0,6 giây) | Lợn Gai |
| 2 | 66–33% | Thêm **đập đất**: tinh thể tím trồi lên theo hàng (mặt đất nứt trước, như Rết Đá); lõi gọi một đàn Chuột Tím | Rết Đá, Chuột Tím |
| 3 | 33–0% | **Cứ 47 giây** lõi phát xung toàn phòng: người chơi phải nấp sau cột (cột sáng lên báo trước 2 giây). Gấu điên hơn, ít hở hơn | Nhịp 47, Khỉ Vách Đá |

- Sau trận: gấu không chết mà **ngã xuống, tinh thể tím vỡ ra**, rồi lủi vào hang qua vách sập. Đây là động vật bị hại, không phải kẻ ác.
- **Quay lại sau 47 phút:** lõi tự sáng lại và ánh tím kéo gấu về (cũng là lúc nhịp 47 giây chạy lại nếu có người vừa Phá lõi trận).
- Thua: tỉnh lại ở Sảnh vào. Boss chỉ hồi đầy máu và về giai đoạn 1 khi trong Phòng Lõi không còn ai đứng.

## 4. Bảng xuất hiện khu Mộc (rìa)

Số quái tính cho map đủ 30 người, khoảng 1–1,5 quái/người, tối đa 6 quái trong một màn ([10](10-kich-thuoc-map-online.md) §5.2). Tọa độ lãnh địa ở [05](05-map-layouts.md).

| Khu | Quái | Nhóm × số nhóm | Hồi sinh | Thời gian |
| --- | --- | --- | --- | --- |
| Bìa Rừng — Ruộng hoang | Gà Rừng Mào Sét | 4 × 4 | 60 giây | Ngày |
| Bìa Rừng — Đồng cỏ | Lợn Gai | 2 × 6 | 45 giây | Cả ngày |
| Bìa Rừng — Đồng cỏ (tâm) | Lợn Gai Đầu Đàn | 1 × 1 | 1 ngày | Cả ngày |
| Bìa Rừng — Xe bò bỏ dở | Nhện Tơ Điện | 3 × 3 | 60 giây | Cả ngày |
| Mỏ Bỏ Hoang — Bãi tời | Nhện Tơ Điện | 3 × 3 | 60 giây | Cả ngày |
| Mỏ Bỏ Hoang — Bậc đá | Rết Đá | 3 × 4 | 75 giây | Cả ngày |
| Hầm Mỏ — Hang Giữa, đường ray | Dơi Vân Quặng | 4 × 3 | 90 giây | Cả ngày |
| Hầm Mỏ — Hầm Tây | Nhện Tơ Điện | 3 × 2 | 60 giây | Cả ngày |
| Hầm Mỏ — cuối Hầm Tây | Nhện Mẹ | 1 × 1 | 1 ngày | Cả ngày |
| Rừng Sâu — Rìa rừng ẩm | Sói Rêu | 3 × 4 | 90 giây | Cả ngày |
| Rừng Sâu — Đầm Sương | Rắn Sương | 2–3 × 4 | 75 giây | Cả ngày; sương dày hơn sáng sớm |
| Rừng Sâu — Vách Đá | Khỉ Vách Đá | 3 × 4 | 90 giây | Ngày |
| Rừng Sâu — đỉnh Vách Đá | Khỉ Đầu Đàn | 1 × 1 | 1 ngày | Ngày |
| Rừng Sâu — Tán Cao | Cú Đêm Linh | 2 × 3 | 120 giây | Chỉ đêm |
| Đài — hành lang, phòng trận, kho | Chuột Tím | 4 × 6 | 120 giây | Cả ngày |
| Đài — Phòng Lõi | Thủ Lĩnh Mạch Gãy | 1 × 1 | 47 phút | Cả ngày |

Hồi sinh luôn xảy ra **ngoài tầm nhìn** của người chơi (không hiện ngay trước mặt).

## 5. Các khu khác

Mức thiết kế: tên, hệ, map, quy mô Nội Giới, cơ chế chính. Hồ sơ đầy đủ (máu, sát thương, rơi đồ, nhóm) viết khi dựng khu đó. Map ở [12](12-ban-do-cac-khu.md). Xếp theo thứ tự mạch truyện gợi ý (Mộc → Thủy → Kim → Phong → Thổ → Hỏa), nhưng khu nào cũng vào được từ đầu và có quái từ quy mô nhỏ ở ven tới hung thú/cự thú ở lõi.

Trong mỗi khu: quái ở **đất hoang** mang một hệ (hệ trội của khu); quái ở **giao thoa** mang hai hệ, ít và hiền hơn vì Tinh Linh giữ linh năng ở đó cân bằng; quái ở **hiểm địa** là quái rối.

### 5.1 Khu Thủy — Vùng Ngàn Hồ (Sơ Nhiễm → Chúa Đàn, Lõi Cự Thú)

Điều khu dạy: **thủy triều, nước nông/sâu, đánh từ bên hông**.

| Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Cơ chế (dạy gì) | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- |
| Cua Vỏ Sóng | Cua | Thủy | Quần Đảo Ngàn Đảo | Sơ Nhiễm | Giơ càng chặn mọi đòn phía trước; phải vòng ra hông | Thổ |
| Sứa Đèn | Sứa | Thủy | Quần Đảo Ngàn Đảo (bãi nông) | Sơ Nhiễm | Trôi theo triều, chạm thì nổ; đọc dòng nước để biết chúng trôi về đâu | Thổ |
| Hải Âu Gió | Hải âu | Thủy | Quần Đảo Ngàn Đảo | Tụ Khối | Sà xuống cướp đồ vừa câu/nhặt rồi bay đi; đánh khi nó đáp xuống ăn | Thổ |
| Cá Lóc Nhảy | Cá lóc | Thủy | Ngàn Hồ | Tụ Khối cứng | Phóng khỏi mặt hồ quật đuôi lên cầu ván; mặt nước gợn trước 0,6 giây | Thổ |
| Chình Hang | Cá chình | Thủy | Hang Triều | Bành Trướng | Chỉ ra khi nước lên; lúc nước rút thì nằm trong hốc, đánh được mà không bị cắn | Thổ |
| Ếch Sen Độc | Ếch | Thủy + Mộc | Đầm Sen Ngập (giao thoa) | Tụ Khối | Nhảy giữa các lá sen, phun độc theo vòng cung; lá sen chìm sau khi nó nhảy đi | Thổ, Kim, Phong |
| Lươn Bùn Rễ | Lươn | Thủy + Mộc | Đầm Sen Ngập (giao thoa) | Bành Trướng | Lặn trong bùn; đứng trong vũng nước thì bị kéo chậm, ra chỗ khô thì nó không với tới | Thổ, Kim, Phong |

- **Đầu đàn:** **Cua Chúa San Hô** (Quần Đảo; vỏ san hô chặn cả hai bên, gọi sóng đẩy lùi) · **Chình Vua** (cuối Hang Triều; nước lên xuống theo trận).
- **Boss vùng — Cá Sấu Xoáy** (Hồ Xoáy, Thủy): cự thú khổng lồ sống ở tâm hồ. Giai đoạn 1 đập đuôi phá đảo cỏ nổi (đảo vỡ thành lỗ nước); giai đoạn 2 lặn, bọt nước báo chỗ trồi lên đớp; giai đoạn 3 **cuộn xoay** dưới nước tạo xoáy kéo mọi người vào giữa, chạy ngược vòng xoáy để giữ chỗ.

### 5.2 Khu Kim — Dãy Ngân Sơn (Sơ Nhiễm → Chúa Đàn, Lõi Cự Thú)

Điều khu dạy: **gờ núi hẹp, phản chiếu ánh sáng, đòn phản lại**.

| Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Cơ chế (dạy gì) | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- |
| Chuột Gặm Quặng | Chuột | Kim | Sườn Quặng | Sơ Nhiễm | Đàn chạy tới gặm vỉa người chơi đang đào; đuổi đi hoặc mất quặng | Hỏa |
| Rết Quặng | Rết | Kim | Sườn Quặng | Tụ Khối | Như Rết Đá nhưng vỏ quặng **phản đòn** lúc vừa trồi lên; chờ vỏ tối lại | Hỏa |
| Sơn Dương Sừng Thép | Sơn dương | Kim | Vách Bạc | Tụ Khối cứng | Húc đẩy người chơi rơi khỏi gờ; dụ nó ra chỗ rộng | Hỏa |
| Ưng Lưỡi Dao | Chim ưng | Kim | Vách Bạc | Bành Trướng | Bổ nhào chéo, để lại vệt sáng trên vách 0,5 giây trước | Hỏa |
| Tắc Kè Thiếc | Tắc kè | Kim | Vách Bạc, Hang Tinh Thể | Bành Trướng | Đổi màu như vách; chỉ hiện trong ánh phản chiếu | Hỏa |
| Bọ Cánh Gương | Bọ cánh cứng | Kim | Hang Tinh Thể | Bành Trướng | Bẻ tia sáng thành tia nóng qua các tinh thể; đứng ngoài đường phản xạ | Hỏa |
| Tôm Kiếm Bạc | Tôm | Thủy + Kim | Suối Bạc (giao thoa) | Bành Trướng | Bắn mình như mũi tên ngược dòng, theo đường thẳng; đứng lệch dòng chảy | Thổ, Hỏa |
| Ốc Vỏ Gương | Ốc | Thủy + Kim | Suối Bạc (giao thoa) | Bành Trướng | Co vào vỏ thì **phản đòn**; chỉ đánh lúc nó thò ra | Thổ, Hỏa |

- **Đầu đàn:** **Sơn Dương Đầu Đàn** (đỉnh Vách Bạc; húc liên tiếp trên gờ hẹp) · **Bọ Gương Chúa** (Hang Tinh Thể; xoay tinh thể đổi hướng mọi tia).
- **Boss vùng — Nhím Thép** (Hang Kim Loại Sống, Kim): cự thú quặng thép; giai đoạn 1 bắn gai thép theo vòng, gai cắm xuống thành vật cản; giai đoạn 2 cuộn tròn lăn, va gai thì bật hướng; giai đoạn 3 kim loại sống mọc theo dấu chân nó, sàn hẹp dần.

### 5.3 Khu Phong — Cao Nguyên Vân Phong (Tụ Khối → Chúa Đàn, Lõi Cự Thú; Đồng Bão Cát: Quái Rối)

Điều khu dạy: **gió đẩy, xuôi/ngược gió, độ cao, quái rối trong bão**.

| Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Cơ chế (dạy gì) | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- |
| Thỏ Gió | Thỏ rừng | Phong | Thảo Nguyên Gió | Tụ Khối | Nhảy xa xuôi gió, đá hậu; đuổi ngược gió không kịp | Thổ |
| Ngựa Hoang Gió | Ngựa | Phong | Thảo Nguyên Gió | Tụ Khối | Đàn chạy xuôi gió thành dải; đứng sau tảng đá để tránh | Thổ |
| Diều Hâu Lốc | Diều hâu | Phong | Thảo Nguyên, Vách Mây | Tụ Khối cứng | Đập cánh tạo lốc nhỏ đẩy người chơi; ở Vách Mây là đẩy khỏi vách | Thổ |
| Sóc Bay Vách | Sóc bay | Phong | Vách Mây | Bành Trướng | Lượn giữa vách, cắn đứt cầu dây; đánh khi nó bám vách | Thổ |
| Sẻ Lá Thép | Chim sẻ | Kim + Phong | Đèo Gió Bạc (giao thoa) | Tụ Khối cứng | Đàn bay theo gió; gió đổi thì cả đàn đổi hướng lao | Hỏa, Thổ |
| Bọ Cát Xoáy ✖ | Bọ hung | Phong ⊣ Thổ (rối) | Đồng Bão Cát | Quái Rối (Bão Cát) | Đổi hệ theo đợt bão: trong bão là Phong, ngoài bão là Thổ | Theo trạng thái |
| Dơi Cát ✖ | Dơi | Phong ⊣ Thổ (rối) | Đồng Bão Cát | Quái Rối (Bão Cát) | Chỉ tấn công trong bão khi không thấy gì; nghe tiếng ré để né | Theo trạng thái |

- **Đầu đàn:** **Ngựa Chúa Bờm Mây** (Thảo Nguyên; dẫn cả đàn đổi hướng gió) · **Diều Hâu Mắt Lốc** (đỉnh Vách Mây; lốc lớn kéo người lại).
- **Boss vùng — Đại Bàng Mắt Bão** (Đỉnh Mây, Phong + **Tím**): cự thú làm tổ cạnh hố đá tím cổ, nhiễm tím nặng. Giai đoạn 1 bổ nhào theo vệt; giai đoạn 2 tạo bão xoay quanh đỉnh, gió đổi chiều liên tục; giai đoạn 3 **nhịp 47 giây** trở lại: mỗi xung đá tím nổ, phải nấp. Trận nối cốt truyện tím từ Đài Thiên Mạch.

### 5.4 Khu Thổ — Cao Nguyên Hoàng Thổ (Tụ Khối → Chúa Đàn, Lõi Cự Thú)

Điều khu dạy: **đàn đông, đất dưới chân thay đổi (hố, lở, tường đá)**.

| Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Cơ chế (dạy gì) | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- |
| Bò Rừng Sừng Đá | Bò rừng | Thổ | Đồng Cỏ Cao Nguyên | Tụ Khối | Cả đàn di cư qua map theo giờ; đứng chắn đường là bị cuốn; đánh con lẻ đàn | Mộc |
| Lửng Đào Hầm | Lửng | Thổ | Đồng Cỏ, Hẻm Vực | Tụ Khối | Đào hố bẫy; mặt đất lún nhẹ trước khi sụp | Mộc |
| Kền Kền Đá | Kền kền | Thổ | Hẻm Vực | Bành Trướng | Lượn trên cao, chỉ bổ xuống người đang dưới 50% máu; thả đá từ trên vách | Mộc |
| Kiến Đá | Kiến | Thổ | Tổ Kiến Đá | Bành Trướng | Đàn đông; xây tường đá chặn lối trong vài giây, phải phá tường hoặc vòng | Mộc |
| Bọ Hung Vàng | Bọ hung | Thổ + Kim | Núi Vân Vàng (giao thoa) | Bành Trướng | Lăn viên quặng vàng to dần theo đường dốc; đứng ngang dốc để né | Mộc, Hỏa |
| Rắn Vảy Vàng | Rắn | Thổ + Kim | Núi Vân Vàng (giao thoa) | Bành Trướng | Vảy kim loại chặn đòn sắc; quấn người chơi, bạn cùng đội gỡ được | Mộc, Hỏa |

- **Đầu đàn:** **Bò Rừng Đầu Đàn** (Đồng Cỏ; dẫn đàn đổi hướng theo người chơi) · **Kiến Chúa Đá** (đáy Tổ Kiến; sinh kiến, đổi bố cục đường hầm).
- **Boss vùng — Trùn Đá Vực Sâu** (Vực Đá Sống, Thổ): cự thú giun đất khổng lồ. Giai đoạn 1 trồi lên theo đường (đất nứt trước); giai đoạn 2 nuốt cột đá rồi phun đá; giai đoạn 3 các khối đá sống tự dịch chuyển, đấu trường đổi hình liên tục.

### 5.5 Khu Hỏa — Đất Xích Nham (Tụ Khối → Chúa Đàn, Lõi Cự Thú; Bờ Hơi Sôi: Quái Rối)

Điều khu dạy: **vùng lửa trên đất, nắng nóng, sét báo trước, quái rối**. Khu đông loài nhất: kiểm tra lại mọi thứ đã học.

| Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Cơ chế (dạy gì) | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- |
| Thằn Lằn Than | Thằn lằn | Hỏa | Sa Mạc Đỏ | Tụ Khối | Vùi dưới cát nóng; đứng yên lâu trên cát thì nó tới; thở than theo hình nón | Thủy |
| Bọ Cạp Đỏ | Bọ cạp | Hỏa | Sa Mạc Đỏ, Hầm Nham | Tụ Khối cứng | Cong đuôi báo đòn; chích gây bỏng (mất máu chậm, nặng hơn khi đứng ngoài nắng) | Thủy |
| Linh Dương Sét | Linh dương | Hỏa | Đồng Sét | Bành Trướng | Cả đàn gọi sét xuống chỗ người chơi đứng (vòng sáng 1 giây trước) | Thủy |
| Dơi Nham | Dơi | Hỏa | Hầm Nham Thạch | Bành Trướng | Bay ra mỗi khi sông nham dâng; nham hạ thì về tổ | Thủy |
| Chuột Chũi Than | Chuột chũi | Thổ + Hỏa | Đất Tro (giao thoa) | Tụ Khối cứng | Đi ngầm như Rết Đá nhưng trồi lên kéo theo tro nóng thành vùng | Mộc, Thủy |
| Gà Lôi Tro | Gà lôi | Thổ + Hỏa | Đất Tro (giao thoa) | Tụ Khối cứng | Đập cánh tung tro làm mù một vùng; đánh khi tro tan | Mộc, Thủy |
| Sóc Đuôi Lửa | Sóc | Hỏa + Mộc | Rừng Lửa (giao thoa) | Tụ Khối cứng | Ném hạt cháy từ trên cành; hạt để lại vùng lửa 4 giây | Thủy, Kim, Phong |
| Bướm Tro | Bướm | Hỏa + Mộc | Rừng Lửa (giao thoa) | Tụ Khối cứng | Đàn bay rắc phấn bỏng thành dải; gió hoặc nước làm tan | Thủy, Kim, Phong |
| Cua Nham Ướt ✖ | Cua | Hỏa ⊣ Thủy (rối) | Bờ Hơi Sôi | Quái Rối (Hơi Sôi) | Vỏ đổi giữa nóng (đỏ) và ướt (xanh) mỗi 10 giây; vỏ nóng chặn đòn Kim, vỏ ướt chặn đòn Hỏa | Theo trạng thái |
| Rắn Hơi Sôi ✖ | Rắn | Thủy ⊣ Hỏa (rối) | Bờ Hơi Sôi | Quái Rối (Hơi Sôi) | Tan thành hơi nước bỏng, hiện lại ở chỗ hơi phụt lên từ khe đá | Theo trạng thái |

- **Đầu đàn:** **Bọ Cạp Chúa** (giữa Sa Mạc Đỏ; đào cát làm hố cát lún) · **Linh Dương Sừng Sét** (Đồng Sét; gọi sét theo hàng).
- **Boss vùng — Tê Giác Nham** (Miệng Núi Lửa, Hỏa): cự thú nham thạch; giai đoạn 1 lao thẳng (như Lợn Gai quy mô lớn), đâm vào vách làm rơi đá; giai đoạn 2 sừng hút nham, giẫm tạo vũng nham; giai đoạn 3 núi phun đá theo vòng đỏ khắp sàn.

### 5.6 Lõi Mộc — Rừng Tầng Cao (Bành Trướng → Chúa Đàn, Lõi Cự Thú)

Điều khu dạy: **đánh trên hai tầng (mặt đất / tán cây), bị trói, bị kéo lên**.

| Quái | Gốc | Hệ | Map | Quy mô Nội Giới | Cơ chế (dạy gì) | Khắc được bằng |
| --- | --- | --- | --- | --- | --- | --- |
| Hoẵng Sừng Rễ | Hoẵng | Mộc | Rừng Tầng Cao | Hung Thú Lõi | Sừng cắm xuống đất mọc rễ trói chân trong vùng | Kim, Phong |
| Trăn Dây Leo | Trăn | Mộc | Rừng Tầng Cao | Hung Thú Lõi | Giả làm dây leo; quấn và kéo người chơi lên tầng tán | Kim, Phong |
| Ong Phấn Ngủ | Ong | Mộc | Gốc Cổ Thụ | Hung Thú Lõi | Phấn làm chậm dần; đứng trong phấn quá 3 giây thì ngủ 1 giây | Kim, Phong |
| Bọ Vỏ Gỗ | Bọ hung | Mộc | Gốc Cổ Thụ | Hung Thú Lõi | Lăn khối gỗ xuống đường xoắn trong thân cây | Kim, Phong |

- **Đầu đàn:** **Ong Chúa Phấn** (đỉnh Gốc Cổ Thụ).
- **Boss vùng — Rùa Lưng Rừng** (Lõi Rừng, Mộc): rùa khổng lồ mang cả khu rừng nhỏ trên lưng. Người chơi leo lên lưng, phá các **điểm rễ** trong khi rùa nghiêng mình hất xuống; giai đoạn cuối rùa chìm xuống đầm, chỉ còn mai nổi.

## 6. Biến thể (mod)

Một quái thường có **tối đa một** biến thể. Biến thể đổi **hình** và **một luật**, không chỉ tăng máu.

| Biến thể | Khi nào xuất hiện | Hình | Luật thay đổi |
| --- | --- | --- | --- |
| **Đêm** | Từ tối tới sáng, mọi map có quái | Mắt và vân sáng mạnh hơn | Tầm phát hiện +30%, báo đòn ngắn hơn 0,1 giây |
| **Linh Triều** | Đêm Linh Triều (sự kiện thế giới) | Viền sáng màu hệ rực, hạt sáng bay quanh | Nhiều quái hơn 50%; quái rơi thêm vật liệu linh năng; biên giao thoa lấn vào, quái giao thoa xuất hiện ở map bên cạnh |
| **Thời tiết khu** | Thủy: triều cường · Hỏa: nắng gắt · Thổ: lở đất · Kim: sương băng · Phong: bão | Theo thời tiết | Một luật riêng theo khu (vd. triều cường: quái Thủy hồi máu khi đứng trong nước) |
| **Đầu đàn nhỏ** | 1/10 số nhóm ở mỗi map | To hơn 20%, có vương miện vân sáng | Máu ×2, thêm một đòn của loài |
| **Nhiễm Tím** | Quanh nơi có đá tím và nhịp 47 giây: Hầm Mỏ sâu, Rừng Sâu gần Đài, Đỉnh Mây; về sau lan theo sự kiện thế giới | Một vài tinh thể tím trên lưng | Đòn chính kèm xung nhỏ đẩy lùi; rơi mảnh tinh thể tím |
| **Bị thương** | Ngẫu nhiên khi trời mưa | Đi khập khiễng | Bỏ chạy sớm (còn 40% máu); không gọi đồng loại |

Biến thể **Nhiễm Tím** đi theo vị trí: càng gần nguồn đá tím, quái càng có màu tím. Vì thế giới dùng chung, nó không phụ thuộc tiến độ truyện của từng người.

## 7. Animation và âm thanh tối thiểu

Mỗi quái thường có: đứng, đi, chạy, cảnh giác, **báo đòn**, ra đòn, hở, bị đánh, ngã/tan. 4 hướng cho quái nhỏ/vừa; boss 2 hướng (lật trái/phải). Quái rối thêm animation **đổi hệ**.

Mỗi quái có **một âm thanh báo đòn riêng**, nhận ra được khi không nhìn màn hình. Rìa khu Mộc: gà xù lông, heo khịt mũi, nhện rít, đất rung, dơi ré, sói hú, sương xì, khỉ hét, cú kêu một tiếng, chuột lách tách.

## 8. Ghi chú backend

> Các số liệu triển khai bên dưới là ghi chép cũ, chưa xác nhận lại. Kiểm tra repository ngày 15/10 thấy thiếu `server/data/world_population.json`; [09](09-map-hien-trang.md) là nguồn hiện trạng ưu tiên. Danh mục loài và hành vi phía trên vẫn là thiết kế, không đồng nghĩa đã chạy trong game.

**Đã có, chỉ khu Mộc (rìa):** `server/data/world_population.json` là nguồn duy nhất cho quái và NPC trên map. File khai báo 14 loài (máu = số nhát × 16, sát thương %, hồi sinh, giờ xuất hiện, hệ linh năng), lãnh địa theo bảng §4 (tọa độ ở [05](05-map-layouts.md)), điểm an toàn và NPC. `node scripts/build-life-world.cjs` biên dịch file này vào `server/src/life_world_generated.ts` và **từ chối build** nếu một con quái đứng trên nước, trong điểm an toàn, cách điểm đến của cổng dưới 12 ô hoặc cách điểm hoạt động dưới 6 ô ([05](05-map-layouts.md) §5). Có 117 quái ở 5 map rừng.
- Gà Rừng và Khỉ chỉ hiện ban ngày, Cú chỉ hiện ban đêm (theo đồng hồ đời sống).
- Đầu đàn và boss xuất hiện như mọi loài (đã bỏ `storyGate`).
- Loài chưa có vật phẩm rơi trong catalog thì chỉ cho linh năng. Hệ của Chuột Tím và boss (Kim, tạm thay cho Tím) là giá trị tạm.
- `world_map_get` trả thêm `territories` và `safeZones`; NPC có tên trả lời qua `world_interact`.

**Còn thiếu:**
- Quái có vòng trạng thái và đòn đánh trả như trận Lợn Gai 20 Hz đang có, thay cho kiểu bấm-trúng.
- Quái di chuyển trong lãnh địa và bị kéo về khi ra quá bán kính; hồi sinh ngoài tầm nhìn.
- Biến thể theo thời tiết và theo vị trí (Nhiễm Tím).
- **Quái rối**: hệ đổi theo thời gian (trường `elements` thành danh sách luân phiên + chu kỳ).
- Các khu khác: chưa có loài nào trong dữ liệu.
- Map Vườn Cây Mẹ (`m_k1_07`) và NPC của nó (Lão Hồ...).
