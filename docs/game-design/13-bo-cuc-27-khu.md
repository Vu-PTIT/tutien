# 13 — Thiết kế bố cục và phong cách cho 27 khu

**Trạng thái:** bản thiết kế bố cục đề xuất cho nhánh `feat/fantasy-world`, ngày 15/10/2026.  
**Phạm vi:** thành phần, vị trí tương đối, mật độ vật thể, màu sắc và cách dùng quái cho toàn bộ 27 khu chính. Đây là thiết kế nền để dựng blockout; không xác nhận tọa độ thế giới, tên địa danh hay loài quái mới.

## 1. Ngôn ngữ hình ảnh

Tham khảo cách *Stardew Valley* làm môi trường có cảm giác được sống trong đó: bảng màu dịu và ấm, cụm nhà/vật thể có chức năng, đường đi dễ đọc, chi tiết đời thường nhỏ nhưng có chủ đích, và mỗi khu có một vật mốc dễ nhớ. Chỉ lấy nguyên tắc thị giác; không sao chép bản đồ, nhân vật, tài sản hay bố cục cụ thể của game đó.

- **Pixel art top-down 3/4**, nền trên mặt phẳng lưới vuông; không dùng phối cảnh isometric hình thoi.
- **32 px là ô logic**, dùng đo khoảng cách, đường đi và vùng va chạm. Vật thể được vẽ theo kích thước tự nhiên, neo ở chân; không ép nhà/cây/quái vào ô 32 px.
- Vẽ nền liền theo khối lớn; chỉ dùng tile cho phần lặp như cỏ, đất, sàn và chuyển tiếp. Giữ một lối đi chính rộng, các nhánh phụ ngắn; nền không tranh tương phản với vật thể.
- Bố cục đọc thành ba lớp bằng mắt: **nền địa hình → cụm vật thể → điểm mốc**. Chi tiết nhỏ gom theo cụm đời sống/tài nguyên, không rải kín mọi khoảng trống.
- Mỗi khu có một điểm mốc chính, hai hoặc ba cụm phụ. Chừa khoảng trống quanh điểm mốc và lối thoát để người chơi nhận biết đường, quái và tương tác.
- Nhà, cây, đá, NPC và quái là đối tượng riêng, xếp trước–sau theo chân. Mái/tán chỉ che hoặc mờ khi thực sự phủ lên nhân vật.
- Ánh sáng linh năng tập trung quanh nguồn và men theo địa hình. Hạt/ánh sáng không phủ lên lối đi, vùng báo đòn hoặc thân quái.
- Màu trong bảng dưới là **màu nền gợi ý**, không phải mã palette bắt buộc. Giữ linh năng đúng quy ước hệ: Mộc xanh lá, Thủy xanh lam, Kim trắng bạc, Phong trắng xanh, Thổ vàng, Hỏa cam; ngọc lam chỉ cho năng lượng thuần Ẩn Giới; tím lục giác chỉ xuất hiện khi có vật chất bí ẩn đã được duyệt.

## 2. Quy tắc bố trí dùng chung

Quy ước mô tả “trên/dưới/trái/phải” trong từng layout chỉ hướng đọc của ảnh map: trên là phía xa camera, dưới là phía gần camera. Đây **không** phải hướng địa lý toàn lục địa. Cửa vào/ra phải khớp tuyến khi chốt bản đồ tổng.

| Loại khu | Thành phần bắt buộc | Mật độ |
|---|---|---|
| Làng/Thành phố/Tâm Ẩn | Cửa vào, trục đi, điểm sinh hoạt trung tâm, cụm chức năng, lối ra dễ đọc | Chi tiết đời sống dày theo cụm; không chặn đường |
| Rìa A/B | Cửa vào, đường chính, nhánh khám phá, vật mốc, tài nguyên cơ bản, lãnh địa quái yếu, lối rút | Thưa đến vừa; tầm nhìn rộng và có chỗ né |
| Trung | Hai tuyến đi vòng/chuyển hướng, chướng ngại môi trường, tài nguyên trung cấp, cụm quái phối hợp | Vừa; không biến thành mê cung |
| Cao | Vật mốc lớn, dấu báo nguy hiểm, vùng giao chiến đủ rộng, tài nguyên hiếm nếu được duyệt, lối rút rõ | Cụm địa hình dày ở rìa; khoảng chiến đấu thoáng |

**Quái:** dùng roster đã được duyệt của từng hệ. Bản này chỉ định vị trí và chức năng: Rìa A/B dùng quái yếu và nhóm nhỏ; Trung dùng phối hợp hoặc tương tác địa hình; Cao dùng quái mạnh/đầu đàn. Không tự thêm loài, chỉ số, boss hay biến thể. Không đặt quái sát spawn, lối thoát, dịch vụ hoặc tương tác đời sống.

**Đọc ảnh hưởng Stardew Valley:** vật dụng đời sống có thể làm dày bản sắc ở khu cư trú; map quái vẫn cần khoảng trống và tương phản để chiến đấu rõ. Tránh phủ vụn cỏ/hoa/đá đều khắp map. Dùng cụm lớn–nhỏ xen kẽ: điểm mốc lớn, cụm vừa định hướng, chi tiết nhỏ để kể chuyện.

## 3. Ba khu cư trú

### 3.1 Làng Người — 96×72 ô

- **Bố cục:** cổng/lối vào ở cạnh dưới; đường đất chính đi chéo nhẹ vào sân chung gần giữa, rồi chia ba nhánh ngắn tới khu nhà, chợ và lối ra ngoài. Không đặt đường thẳng cứng xuyên toàn map.
- **Cụm nhà:** 5–7 mái nhà nhỏ/vừa thành hai cụm không đối xứng hai bên đường. Mặt tiền và cửa quay ra ngõ; sau nhà có vườn rau, giếng, chuồng nhỏ hoặc đống củi. Chừa khoảng trống quanh từng cửa.
- **Sân chung:** giếng hoặc cây bóng mát làm mốc; ghế, bảng tin, đèn lồng thành cụm quanh mép sân. Giữ vùng giữa sân đủ rộng để gặp gỡ.
- **Chợ/dịch vụ:** một cụm quầy mái bạt gần đường chính, không chắn cổng. Thùng hàng, cân, rổ rau xếp sau quầy; biển hiệu và NPC nhận diện từ xa.
- **Chi tiết sống:** dây phơi, chum nước, hàng rào thấp, luống cây, mèo/chó nếu có asset; mỗi chi tiết có vị trí gắn với nhà hoặc hoạt động, không đặt ngẫu nhiên.
- **Màu:** cỏ sage/olive, đất nâu ấm, mái ngói đất nung và gỗ mật ong; cửa sổ ánh vàng. Điểm linh năng rất nhẹ để đây vẫn là nơi đời thường.
- **Quái:** không có quái thù địch.

### 3.2 Thành phố Người — 128×96 ô

- **Bố cục:** cổng chính ở cạnh dưới dẫn vào trục lát đá rộng, kết thúc ở quảng trường trung tâm. Từ quảng trường chia ba tuyến tới khu chợ, khu dịch vụ/tổ chức và khu nhà. Một cổng phụ hoặc đường xe hàng đặt ở cạnh bên.
- **Quảng trường:** bia/đài nước thấp ở giữa; bảng tin, ghế dài và đèn ở rìa. Để trống vùng đi vòng; không dựng tượng quá lớn che tầm nhìn.
- **Chợ:** các quầy chia thành hai dải ngắn ven phố, có mái che màu khác nhau, thùng hàng và biển dọc; giữ một lối xuyên chợ thông tới quảng trường.
- **Khu tổ chức:** một công trình lớn làm điểm mốc ở cuối nhánh đường, có sân trước, cột cờ/biển hiệu và bậc thềm. Không gán chức năng cốt truyện cụ thể ngoài dịch vụ/tổ chức đã xác nhận.
- **Khu dân cư:** nhà 2–3 kích thước lặp lại theo cụm phố ngắn; ngõ hẹp chỉ ở nhánh, không phải đường chính. Thêm ban công, đèn cửa, chậu cây, mái hiên để phố không thành khối đồng dạng.
- **Màu:** nền đá xám ấm và kem, mái xanh xám/đỏ gạch xen kẽ, gỗ nâu; ánh đèn vàng tạo điểm ấm. Dùng xanh lam nhạt ở đài nước nhưng không khiến thành phố thành vùng Thủy.
- **Quái:** không có quái thù địch.

### 3.3 Làng Tâm Ẩn — 80×60 ô

- **Bố cục:** lối vào an toàn ở cạnh dưới; đường vòng ôm quanh sân trung tâm. Cây trung tâm là điểm mốc, đặt hơi lệch tâm để không biến map thành vòng tròn đối xứng. Sáu lối ra phân bố quanh rìa, đánh dấu bằng cổng/cảnh quan riêng nhưng chưa gán hướng địa lý.
- **Cây trung tâm:** thân/rễ nhìn rõ từ xa, rễ tạo bồn và ghế tự nhiên; tán là lớp che riêng, có thể mờ khi nhân vật đi dưới. Không đặt vật thể che gốc.
- **Cụm nhà Tinh Linh:** 4–6 nhà nhỏ gắn vào rễ, sườn đất hoặc thân cây; cửa hướng ra đường vòng. Thêm cầu gỗ ngắn, đèn và bậc đá.
- **Suối/điểm Hấp Linh:** suối nông uốn một đoạn bên sân, có bờ đi được và một cầu nhỏ; điểm Hấp Linh đặt cạnh bờ trong một khoảng mở, không nằm giữa tuyến giao thông.
- **Cộng đồng:** sân gặp gỡ, nơi học/tập trung và một góc nghỉ; sáu lối ra có dấu hệ bằng thực vật/đá/ánh sáng khác nhau, không cần sáu cổng kiến trúc giống nhau.
- **Màu:** xanh lá dịu, gỗ sáng, đá ngà và ánh ngọc lam cục bộ cho năng lượng thuần Ẩn Giới. Ngọc lam không thay màu linh năng của sáu hệ.
- **Quái:** không có quái thù địch; cây trung tâm không phải boss hoặc nguồn nguy hiểm.

## 4. Vùng Mộc

Ngôn ngữ chung: thân cây nâu ấm, tán nhiều sắc xanh nhưng giữ khoảng trống nhìn; linh năng xanh lá tập trung ở rễ, nụ và điểm tụ.

### 4.1 Mộc — Rìa A (yếu)

- **Địa hình/bố cục:** rìa rừng thưa, cửa vào ở dưới, đường đất cong qua một bãi cỏ mở rồi hướng tới cụm cây cổ làm mốc ở trên. Một nhánh vòng qua vạt cây non về điểm tài nguyên.
- **Vật thể:** gốc cây, bụi quả, khúc gỗ và đá phủ rêu gom thành cụm ở hai bên đường; một khoảng đất trống đủ để thấy và né quái.
- **Quái:** các nhóm quái Mộc yếu tuần tra ở bìa bụi/cây, không đứng ngay đường giữa.
- **Màu:** xanh non, vàng nắng nhạt, nâu gỗ; ánh xanh lá chỉ chấm tại rễ hoặc quả linh năng.

### 4.2 Mộc — Rìa B (yếu)

- **Địa hình/bố cục:** thung lũng rễ và lùm tre/gỗ thấp thay cho rừng thưa; đường đi zíc-zắc nhẹ theo bờ rễ, có hai khoảng mở nối bằng cầu gỗ hoặc lối đất.
- **Vật thể:** rễ nổi làm mép địa hình, bụi tre, nấm và tổ rỗng. Một chòi/giàn thu hái cũ có thể làm điểm mốc phụ, không biến thành công trình lớn.
- **Quái:** quái Mộc yếu phục kích ở sau rễ hoặc quanh tổ; vùng cảnh báo có lối tránh rõ.
- **Màu:** xanh ngọc trầm, xanh rêu, gỗ nâu sẫm; điểm sáng vàng lục rất nhỏ. Khác Rìa A ở cảm giác râm và kín hơn, không chỉ đổi hue.

### 4.3 Mộc — Khu Trung

- **Địa hình/bố cục:** rừng rậm chia thành ba khoang nối bằng đường vòng: lối vào có tầm nhìn, vùng rễ đan giữa map, bãi chiến đấu mở gần lối ra.
- **Vật thể:** cây lớn lệch tâm, rễ chắn một phần đường, dây leo tạo cổng tự nhiên, đá phủ rêu và hai điểm tài nguyên ở nhánh cụt.
- **Quái:** nhóm quái Mộc trung phối hợp quanh rễ/dây leo; để một hướng vòng tránh chướng ngại và một lối rút.
- **Màu:** xanh lá đậm, lục lam bóng râm, nâu đất; vùng linh năng sáng tạo đường dẫn nhỏ, không thành lớp phủ toàn map.

### 4.4 Mộc — Khu Cao

- **Địa hình/bố cục:** lõi rừng cổ có một cây khổng lồ hoặc cụm thân cây xoắn làm mốc cuối. Đường tiến vòng cung quanh gốc, bãi chiến đấu rộng ở phía trước và đường rút chạy dọc mép map.
- **Vật thể:** thân cây rỗng, rễ dựng thành vách thấp, tán dày viền ngoài; không đặt tán tối che bãi giao chiến.
- **Quái:** quái Mộc mạnh/đầu đàn chiếm lãnh địa quanh gốc; báo vùng bằng rễ phát sáng, cành gãy hoặc dấu chân, không tự xác nhận boss.
- **Màu:** xanh rừng sâu, nâu gỗ đỏ, điểm xanh lá sáng ở gốc và mạch rễ; giữ nền bãi chiến đấu sáng hơn viền.

## 5. Vùng Thủy

Ngôn ngữ chung: xanh lam dịu, xanh ngọc nước, đá xám ướt; bờ nước phải đọc được và có lối đi liên tục. Nước xanh lam là linh năng Thủy.

### 5.1 Thủy — Rìa A (yếu)

- **Địa hình/bố cục:** bờ suối rộng, lối vào men một bờ; đường đất có một cầu thấp dẫn tới bãi cỏ/bãi sỏi đối diện. Dòng nước chạy chéo để tạo chiều sâu nhưng không cắt đôi lối chơi.
- **Vật thể:** lau sậy theo cụm, đá cuội ở khúc cong, cầu gỗ, cọc câu/lưới hoặc giỏ đặt cạnh bờ làm dấu đời sống.
- **Quái:** quái Thủy yếu ở bãi nông và sau lau; bãi giữa giữ thoáng.
- **Màu:** xanh lam trong, xanh lục nhạt, cát kem và gỗ sáng; phản chiếu ít, không làm lóa.

### 5.2 Thủy — Rìa B (yếu)

- **Địa hình/bố cục:** đầm cạn nhiều đảo đất nhỏ nối bằng lối gỗ/đá; đường chính uốn theo mép đầm, có nhánh tới một ao kín.
- **Vật thể:** bèo, lau cao, gốc cây ngập, ụ bùn và cọc chỉ luồng nước. Không đặt lau dày chắn hoàn toàn tầm nhìn.
- **Quái:** quái Thủy yếu theo cụm quanh ao và đảo xa đường; giữ đường vòng khô để rút.
- **Màu:** xanh lam xám, xanh lục đầm, nâu bùn; điểm xanh nước sáng ở mặt nước nhỏ.

### 5.3 Thủy — Khu Trung

- **Địa hình/bố cục:** hợp lưu hai nhánh nước quanh một doi đất trung tâm; hai cầu/đường vòng cho phép đổi bờ. Có vùng chiến đấu trên doi đất và bậc đá.
- **Vật thể:** cọc bờ, cầu gỗ, mảng đá trơn, thác thấp ở mép nền, bè hàng bỏ trống như dấu hoạt động trước đó.
- **Quái:** quái Thủy trung bố trí ở hai bờ và điểm hợp lưu, phối hợp ép vị trí; không đặt trên cầu hẹp nơi người chơi không né được.
- **Màu:** xanh lam vừa, ngọc lục bảo nhạt, đá slate; phản sáng theo dòng và điểm tụ.

### 5.4 Thủy — Khu Cao

- **Địa hình/bố cục:** lòng hồ sâu/ghềnh lớn, bãi đá lớn ở giữa làm vùng giao chiến. Lối vào trên một bờ cao, lối rút theo cầu/đường men bờ ở phía khác.
- **Vật thể:** vách đá, thác ở hậu cảnh, cọc neo, đá dựng và xoáy nước ở vùng không đi được; không phủ nước lên toàn bộ mặt sàn.
- **Quái:** quái Thủy mạnh/đầu đàn ở vùng nước sâu, bãi chiến đấu có đường đất/đá khô quanh mép.
- **Màu:** xanh lam sâu, xanh thép, bọt trắng; điểm phát sáng xanh lam tập trung quanh xoáy hoặc vách nước.

## 6. Vùng Kim

Ngôn ngữ chung: khoáng vật và kim loại phong hóa, ánh trắng bạc; nền vẫn có màu đất tự nhiên để bạc không làm map phẳng/lạnh.

### 6.1 Kim — Rìa A (yếu)

- **Địa hình/bố cục:** mỏ lộ thiên nhỏ ở sườn đồi, đường đất vòng qua một vết cắt đá và tới bãi quặng nông.
- **Vật thể:** xe goòng ngắn, cọc gỗ chống, cuốc/chậu quặng, mảnh tinh thể nhỏ; một lối hầm bị sập chỉ làm nền cảnh, không giả vờ là cửa vào.
- **Quái:** quái Kim yếu quanh bãi quặng và xe hàng; lối giữa để thoáng.
- **Màu:** đất nâu đỏ, đá xám ấm, khoáng bạc nhạt; linh năng trắng bạc chỉ lóe ở quặng.

### 6.2 Kim — Rìa B (yếu)

- **Địa hình/bố cục:** bãi đá lộ thiên với các phiến đá dựng thành những khe rộng; đường chính uốn quanh khe, có lối phụ lên mỏm quan sát.
- **Vật thể:** cột khoáng, tinh thể thấp, giàn sàng quặng và biển gỗ cũ; giữ khe đủ rộng để nhân vật đi qua.
- **Quái:** quái Kim yếu ở sau phiến đá hoặc mỏm; tránh phục kích ngay lối hẹp.
- **Màu:** xám tím đất, nâu khô, bạc xỉn; khác Rìa A bằng hình khối dựng và nền khô hơn.

### 6.3 Kim — Khu Trung

- **Địa hình/bố cục:** mỏ bỏ dở dạng tầng thấp, đường dốc/ram đi vòng qua sân trung tâm; hai nhánh gặp ở cầu sàn gỗ chắc.
- **Vật thể:** khung chống, ray goòng, cẩu nhỏ, đá vụn đặt ở mép; một vỉa khoáng sáng làm mốc.
- **Quái:** quái Kim trung kiểm soát các tầng và tương tác với chướng ngại; giữ đường vòng bên ngoài ray để người chơi thoát.
- **Màu:** đá than, nâu gỗ, bạc sáng; vùng sáng khoáng tập trung, bóng đổ mát xanh xám.

### 6.4 Kim — Khu Cao

- **Địa hình/bố cục:** hẻm núi khoáng với một khối tinh thể/đá kim loại lớn làm mốc. Đường tiến qua sân mở, hai bên là vách và mỏm; đường rút không bị cụt.
- **Vật thể:** trụ khoáng cao viền ngoài, vết nứt sáng trên nền, cột chống đổ; tránh đặt tinh thể nhọn trong vùng né đòn.
- **Quái:** quái Kim mạnh/đầu đàn canh quanh khối trung tâm; cảnh báo bằng vệt khoáng sáng và đá rung.
- **Màu:** xám than và xanh đá, trắng bạc sắc ở điểm tụ; hạn chế màu tím trừ khi có vật chất bí ẩn được xác nhận.

## 7. Vùng Phong

Ngôn ngữ chung: bầu trời và khoảng trống được cảm nhận qua cỏ nghiêng, cờ, chong chóng và bụi lá; xanh trời nhạt, cỏ vàng xanh, bóng xanh lạnh.

### 7.1 Phong — Rìa A (yếu)

- **Địa hình/bố cục:** đồng cỏ thoáng, đường đất cong nối hai gò thấp; có bụi cây chắn gió tạo một khoảng nghỉ.
- **Vật thể:** cỏ cao thành dải, hoa dại thành cụm nhỏ, cọc buộc dải vải và chong chóng gỗ làm mốc xa.
- **Quái:** quái Phong yếu xuất hiện ở rìa cỏ cao, không che mất khả năng quan sát đường.
- **Màu:** xanh trời nhạt, vàng cỏ, xanh lá sáng, nâu đất; hạt lá bay rất ít.

### 7.2 Phong — Rìa B (yếu)

- **Địa hình/bố cục:** sườn gió và ruộng bậc thấp; đường đi dọc sườn, qua một cầu gỗ ngắn trên khe cạn rồi vòng về bãi phẳng.
- **Vật thể:** cối xay gió nhỏ/giàn phơi, đá đánh dấu hướng gió, hàng cây thấp nghiêng cùng một chiều; không dựng vật thể dày cản tầm nhìn.
- **Quái:** quái Phong yếu ở mỏm hoặc bụi cỏ, có khoảng trống trước khi chạm người chơi.
- **Màu:** xanh lam nhạt, vàng rơm, xanh xám; hướng gió thể hiện bằng cỏ/cờ thay vì phủ màn sương.

### 7.3 Phong — Khu Trung

- **Địa hình/bố cục:** cao nguyên có hai sống gió giao nhau; đường chính đi vòng qua một tháp/cột đá thấp, nhánh phụ dẫn tới mỏm nhìn xuống.
- **Vật thể:** cột chuông gió, cờ rách, đá cân bằng, bụi cây thấp; tạo bãi giao chiến rộng ở giữa các sống.
- **Quái:** quái Phong trung tận dụng các khoảng mở và chướng ngại thấp; không dùng hiệu ứng gió che báo đòn.
- **Màu:** xanh trời bạc, cỏ olive vàng, đá xám lạnh; ánh Phong trắng xanh ở cột/tụ điểm.

### 7.4 Phong — Khu Cao

- **Địa hình/bố cục:** đỉnh gió/hẻm vực rộng, một cột đá hoặc vòng đá trên cao làm điểm mốc. Đường tiến men vách an toàn rồi mở ra bãi chiến đấu, đường rút nối trực tiếp về cạnh vào.
- **Vật thể:** cờ lớn, đá mòn, cỏ thấp và các khe vực không đi được phân định rõ bằng màu/lan can tự nhiên.
- **Quái:** quái Phong mạnh/đầu đàn giữ vùng trung tâm; tránh đặt sát mép rơi hoặc yêu cầu né vào góc chết.
- **Màu:** xanh thép, trắng mây, cỏ vàng nhạt; tương phản cao vừa đủ giữa lối đi và vực.

## 8. Vùng Thổ

Ngôn ngữ chung: đất vàng, nâu đất, đá sa thạch, ruộng/bậc địa hình; linh năng vàng nằm ở mạch đất và hạt bụi sáng.

### 8.1 Thổ — Rìa A (yếu)

- **Địa hình/bố cục:** bãi đất canh tác/đồi thấp ở rìa, đường đất chạy giữa hai thửa và tới một gò đá.
- **Vật thể:** luống cây/đám cỏ khô thành hàng, hàng rào thấp, cọc tưới, xe kéo và ụ đá; có thể tạo dấu sinh hoạt nhưng không biến thành một làng mới.
- **Quái:** quái Thổ yếu ở bờ luống và sau ụ đất; khu giữa thông thoáng.
- **Màu:** vàng rơm, nâu đất, xanh cây bụi; điểm vàng linh năng nằm gần gò đá.

### 8.2 Thổ — Rìa B (yếu)

- **Địa hình/bố cục:** khe đất sét và bờ đất nứt; đường chính men theo lòng khe rộng rồi leo lên một khoảng cao.
- **Vật thể:** đá tròn, vách đất phân tầng, bình gốm vỡ, bụi gai thấp; lối leo thể hiện bằng bậc/độ dốc nhìn rõ.
- **Quái:** quái Thổ yếu quanh hốc và bờ khe; không đặt ở lối leo đơn độc.
- **Màu:** đất son, nâu khô, kem bụi; khác Rìa A bằng chất đất trần và vách rõ.

### 8.3 Thổ — Khu Trung

- **Địa hình/bố cục:** thung lũng ruộng bậc/đá tầng, đường zíc-zắc quanh các bậc, có hai đường vòng để xuống sân trung tâm.
- **Vật thể:** bờ ruộng đá, cột mốc, guồng nước khô hoặc kho chứa nhỏ nếu phù hợp địa hình; các vật thể phụ xếp dọc rìa.
- **Quái:** quái Thổ trung dùng bờ đất/đá làm chỗ chắn; không biến mọi tuyến thành đường hẹp.
- **Màu:** vàng đất trung tính, xanh rêu khô, đá nâu; điểm linh năng vàng theo mạch trên nền.

### 8.4 Thổ — Khu Cao

- **Địa hình/bố cục:** lòng chảo đá/đồi sụt với một cột đá hoặc mạch đất vàng lớn ở giữa. Đường vào cao hơn sân đánh, nhưng có hai lối xuống và một đường rút vòng.
- **Vật thể:** đá tảng viền ngoài, cột đá nứt, bụi cát sát nền; giữ bãi trung tâm không bị đá nhỏ lấp kín.
- **Quái:** quái Thổ mạnh/đầu đàn quanh mạch hoặc cột; cảnh báo bằng rung đất, vết nứt và bụi tụ.
- **Màu:** nâu đất sâu, vàng hổ phách, đá xám ấm; điểm vàng sáng tập trung tại mạch năng lượng.

## 9. Vùng Hỏa

Ngôn ngữ chung: đất đỏ, đá núi lửa, gỗ sẫm; vùng nóng có màu cam nhưng không phủ filter đỏ lên toàn màn. Hỏa phát sáng cam.

### 9.1 Hỏa — Rìa A (yếu)

- **Địa hình/bố cục:** bãi đá ấm và bụi cây chịu nhiệt ở rìa; đường đi quanh các khe đất khô, kết thúc tại một bãi tro cũ.
- **Vật thể:** đá đen nhỏ, cành khô, bếp lửa tắt/giàn than cũ làm dấu hoạt động, bụi cây đỏ cam; chừa khoảng né.
- **Quái:** quái Hỏa yếu ở gần đá ấm hoặc bụi cây, tránh đặt trên vệt nóng gây sát thương không báo.
- **Màu:** đất nâu đỏ, xám tro, cam nhạt; vùng phát sáng chỉ ở khe nhiệt nhỏ.

### 9.2 Hỏa — Rìa B (yếu)

- **Địa hình/bố cục:** rừng cây chịu nhiệt thưa hơn, đường đất vòng qua thân cây cháy sém và một mạch đá nóng; có nhánh tránh mạch.
- **Vật thể:** thân cây sẫm, lá đỏ cam, đá nóng viền rõ, vũng tro và cọc cảnh báo.
- **Quái:** quái Hỏa yếu phân bố giữa các khoảng cây, không dồn vào mạch nhiệt khiến người chơi bị kẹp.
- **Màu:** đỏ gạch, nâu gỗ cháy, cam hổ phách; khác Rìa A ở nhiều thân cây và mảng tán đỏ.

### 9.3 Hỏa — Khu Trung

- **Địa hình/bố cục:** sườn núi lửa có hai bậc đất và dòng dung nham nhỏ làm ranh nền nguy hiểm; đường đi qua cầu đá rộng/đường vòng, sân chiến đấu ở bậc giữa.
- **Vật thể:** khe dung nham, đá đen, cột khói thấp ở hậu cảnh, cầu đá và cọc cảnh báo; ranh dung nham tách rõ khỏi sàn đi được.
- **Quái:** quái Hỏa trung tương tác với các vùng nóng nhưng luôn có khoảng an toàn để né; không đặt quái dọc cầu hẹp.
- **Màu:** đen than, nâu đỏ, cam nóng, ánh vàng ở mép dung nham; hiệu ứng khói thưa, không che nhân vật.

### 9.4 Hỏa — Khu Cao

- **Địa hình/bố cục:** miệng núi lửa/đài đá nóng làm điểm mốc lớn. Lối tiến vòng ngoài dẫn vào sân chiến đấu rộng; lối rút nối về đường vào, không yêu cầu vượt qua nguồn nóng.
- **Vật thể:** cột đá núi lửa, vết nứt cam, đá vụn viền, luồng hơi ở mép; tâm nóng làm nền cảnh/điểm tụ chứ không lấp hết sàn.
- **Quái:** quái Hỏa mạnh/đầu đàn chiếm sân trung tâm hoặc vành ngoài; báo nguy bằng nứt sáng, khói và âm thanh/hoạt ảnh.
- **Màu:** than đen, đỏ gạch, cam hổ phách và vàng nóng; giữ đường đi có sắc đất trung tính để phân biệt với dung nham.

## 10. Nguyên tắc đặt đối tượng và mật độ

1. Đặt địa hình và đường chính trước; chạy thử camera để bảo đảm lối đi đọc rõ ở kích thước game.
2. Đặt vật mốc lớn, tiếp đến là cụm nhà/cây/đá, sau cùng mới thêm props nhỏ. Mỗi cụm phải có lý do: sinh hoạt, khai thác, định hướng hoặc kể chuyện.
3. Chừa lối đi chính liên tục; vật trang trí không lấn vùng va chạm. Props cao dùng footprint ở chân/gốc, không lấy toàn bóng sprite làm vật cản.
4. Map quái cần ít nhất một bãi né/đánh rõ ràng; quái không che mất nhau và không chồng lên điểm tài nguyên.
5. Dùng ba cỡ tương phản: vật mốc lớn (1), cụm vừa (2–4), chi tiết nhỏ (rải thưa quanh cụm). Tránh mật độ đồng đều như họa tiết.
6. Ánh sáng/linh năng theo nguồn và địa hình; palette nền vẫn đủ trung tính để vật thể, quái và kỹ năng nổi lên.
7. Đặt NPC, vật tương tác, spawn, lối ra, safe zone, lãnh địa quái và collision trong dữ liệu gameplay riêng; tranh nền không thay thế dữ liệu đó.

## 11. Mẫu checklist khi dựng từng map

- [ ] Đúng kích thước mục tiêu tại [11](11-ti-le-map.md) và đúng vai trò trong [12](12-ban-do-cac-khu.md).
- [ ] Có cổng vào/ra, đường chính, nhánh khám phá và lối rút phù hợp.
- [ ] Một vật mốc chính, hai hoặc ba cụm phụ; có khoảng trống đọc đường và nhân vật.
- [ ] Bảng màu phân biệt được với các khu cùng hệ khác; linh năng dùng đúng màu hệ.
- [ ] Quái dùng roster hiện có theo bậc; không tự phát sinh loài hoặc chỉ số chưa duyệt.
- [ ] Các điểm tương tác, collision, spawn và Y-sort tách khỏi hình nền.
- [ ] Preview ở camera gameplay vẫn rõ, dễ tìm lối, không bị hiệu ứng che.

## 12. Liên kết chuẩn

- Cấu trúc thế giới: [03](03-world-and-maps.md)
- Art và cách dựng: [04](04-map-art.md)
- Thành phần map: [05](05-map-layouts.md)
- Quy chuẩn quái: [06](06-monsters.md)
- Kích thước mục tiêu: [11](11-ti-le-map.md)
- Danh mục 27 khu: [12](12-ban-do-cac-khu.md)
