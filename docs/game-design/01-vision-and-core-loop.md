# 01 — Tầm nhìn sản phẩm và vòng chơi

**Mốc áp dụng:** MVP trước, mở rộng theo cổng nghiệm thu.  
**Thông số trong file:** giả thuyết thiết kế, cần chơi thử.

## 1. Lời hứa với người chơi

Bạn không phải người mạnh nhất khi bước vào thế giới này. Bạn có thể trở thành người sống sót và tiến xa nhờ biết chuẩn bị: trồng đúng dược liệu, tìm hiểu đối thủ, giữ quan hệ, chọn pháp khí phù hợp và biết lúc nào cần rút.

Game cần cho cảm giác “mình đã khôn hơn, vững hơn” trước cảm giác “chỉ số của mình to hơn”.

## 2. Chuyển cảm hứng Phàm Nhân Tu Tiên thành cơ chế

Mô tả chính thức của BiliBili nhấn mạnh nhân vật xuất thân bình thường, tư chất không nổi bật và con đường tu luyện nguy hiểm. Đó là nền cảm hứng; bảng dưới là **diễn giải thiết kế cho game**, không phải bản mô phỏng từng tập phim. Nguồn: S01 trong [15](15-sources-and-change-log.md).

| Tinh thần muốn giữ | Người chơi làm gì | Hệ thống thể hiện |
|---|---|---|
| Người bình thường tìm đường tiến thân | Hoàn thành việc nhỏ, tích lũy tri thức và tài nguyên | Quest, công pháp, vườn |
| Thận trọng có giá trị | Đọc dấu vết, quan sát đòn, chuẩn bị hồi phục | Dò mạch, telegraph, vật phẩm |
| Cơ duyên phải được tận dụng | Tìm một lối vào hoặc công thức rồi hoàn thành thử thách | Khám phá, bí cảnh, tri thức |
| Mạnh hơn không đồng nghĩa bất cẩn được | Quản lý linh lực, vị trí và thời gian hồi chiêu | Combat, tinh anh, boss |
| Người và tổ chức có lợi ích riêng | Chọn cách xử lý chứng cứ và quan hệ | Story flags, tín nhiệm |
| Tu luyện là hành trình dài | Mỗi mốc mở khả năng mới, không chỉ cộng chỉ số | Cảnh giới, công pháp, map |

Không dùng nhân vật, biểu tượng, nhạc, trích đoạn, thoại hay chuỗi sự kiện của phim làm asset có sẵn. Thế giới và tuyến truyện trong bộ tài liệu là sáng tác riêng cho dự án.

## 3. Năm trụ cột thiết kế

### 3.1. Chuẩn bị trước giao tranh

Biết quái gây độc thì có thể mang hồi phục, né tuyến nguy hiểm hoặc xử lý quái từ xa. Không bắt buộc mua đúng một vật phẩm mới được chơi. Có ít nhất hai cách giải quyết mỗi tình huống quan trọng.

### 3.2. Nơi an thân có công dụng

Làng và vườn cho nhịp nghỉ: chữa trị, thu hoạch, chế tạo, đọc manh mối, đổi bộ kỹ năng. Vườn tạo vật tư cho chuyến đi; chuyến đi mang giống và tri thức về vườn.

### 3.3. Tiến bộ theo nhiều chiều

Tu vi mở điều kiện; công pháp mở cách chơi; trang bị điều chỉnh chiến thuật; tri thức mở lựa chọn; quan hệ mở nguồn thông tin. Không gom cả năm thành một “lực chiến” quyết định thắng thua.

### 3.4. Nguy hiểm đọc được

Quái mạnh phải có âm thanh, dáng, đòn báo trước hoặc lời cảnh báo. Chết vì quyết định sai có thể học được; chết vì thông tin không hiển thị cần sửa thiết kế.

### 3.5. Online không phá vòng chơi cá nhân

Không ép PvP, gia nhập bang hay canh boss theo giờ để hoàn thành cốt truyện MVP. Chơi cùng người khác giúp phong phú hơn, không phải điều kiện để không bị kẹt.

## 4. Vòng chơi theo ba thang thời gian

### Vòng ngắn: 10–60 giây

Quan sát → chọn vị trí → ra đòn hoặc tương tác → tiêu tài nguyên → nhận phản hồi → thay đổi quyết định.

Phải đọc được HP, linh lực, cooldown và hướng nguy hiểm. Không cần mở bảng chỉ số để hiểu vì sao một đòn không đánh được.

### Vòng phiên chơi: 15–30 phút

Chọn mục tiêu ở làng → kiểm tra đồ mang theo → đi rừng/khe đá → thu thập và xử lý một tình huống → quyết định đi sâu hay về → xác nhận tài nguyên → chế tạo/tu luyện → mở mục tiêu sau.

Không ép chuyến nào cũng làm đủ các bước. Người chơi thích trồng trọt có thể chủ yếu chuẩn bị; người thích chiến đấu dùng thành quả chuẩn bị của phiên trước.

### Vòng dài: nhiều phiên

Thiếu tài nguyên/tri thức → tìm nguồn → tự cải thiện → giải quyết thử thách → mở tầng tu luyện hoặc lựa chọn mới → khám phá xung đột lớn hơn.

Mỗi mốc phải có cả “mình làm được điều gì mới” và “mình đang tò mò điều gì”.

## 5. Phiên đầu 30 phút — mục tiêu kiểm chứng

| Khoảng thời gian mục tiêu | Trải nghiệm | Bằng chứng cần quan sát |
|---|---|---|
| 0–5 phút | Tạo nhân vật, nhận việc tại An Khê | Người mới biết đường đi và nút tương tác |
| 5–10 phút | Thấy dấu linh mạch, tránh một đòn quái | Hiểu dò mạch và né, không chỉ bấm liên tục |
| 10–15 phút | Hoàn thành mốc dẫn khí đầu | Hiểu tại sao tu vi tăng |
| 15–20 phút | Trồng và thu cây hướng dẫn, luyện hồi phục | Hiểu vườn phục vụ chuyến đi |
| 20–25 phút | Mang vật tư vào tuyến rừng khó hơn | Chủ động chọn vật phẩm hoặc đường đi |
| 25–30 phút | Quay về, nhận manh mối mới và lưu tiến độ | Muốn tiếp tục; đăng nhập lại không mất tài sản |

Đây là mục tiêu phân bổ nội dung, không phải thời gian cam kết cho mọi người chơi. Không bắt người mới hoàn thành cả 12 quest và boss trong 30 phút.

## 6. Khóa phạm vi theo bản

| Mảng | MVP | Alpha | Sau Alpha |
|---|---|---|---|
| Tu luyện | Luyện Khí 1–4 | Luyện Khí 5–13, thử Trúc Cơ sơ kỳ | Kết Đan, Nguyên Anh, các cấp sau |
| Chiến đấu | Một bộ pháp khí cơ bản | Ba hướng build | Khôi lỗi, linh thú, đội hình phức tạp |
| Map | 4 map chương đầu | Tông môn, phường thị, một bí cảnh mới | Khu vực xa và tranh đoạt |
| Đời sống | 6 ô vườn, 3 cây, 5 công thức | Chuyên nghề, nâng tiện ích | Động phủ có trang trí sâu |
| Cộng đồng | UI tối thiểu trên backend có sẵn; co-op 2 người | Tổ đội 4 người, cộng tác nhóm | Liên minh, sự kiện bang |
| PvP | Đấu tập đồng thuận, không kinh tế | Đấu trường cân bằng | Vùng tranh đoạt tự chọn |
| Kinh tế | NPC và tài sản cá nhân | Giao dịch trực tiếp sau audit | Chợ/đấu giá nếu cần |
| Story | Một chương khép được xung đột nhỏ | Hai chương tiếp theo | Mạch truyện vùng lớn |

## 7. Những gì chủ động không làm trong MVP

Không bay xuyên bản đồ, phi thăng, bang chiến, công thành, full-loot, nhân giống linh thú, hệ tình duyên, hàng chục tông môn, nhà đấu giá, auto farm, trợ lý AI hội thoại hoặc cửa hàng tiền thật. Không cài tất cả công nghệ được nhắc trong tài liệu cũ.

Không biến “tu tiên dài lâu” thành chờ thật nhiều ngày mới được thử cơ chế đầu tiên.

## 8. Các đối tượng chơi thử

Mời người thích khám phá/story, người thích cày cuốc/build, người chơi online có PvP và người chưa quen game tu tiên. Đây là phân nhóm kiểm thử, chưa phải phân khúc thị trường được nghiên cứu.

Mỗi nhóm trả lời một câu: “Trong phiên vừa rồi, quyết định nào của bạn tạo ra khác biệt?” Nếu câu trả lời chỉ là “đeo đồ cao hơn”, vòng chơi chưa đạt mục tiêu.

## 9. Nghiệm thu bản sắc

Bản demo phải có một lần chuẩn bị hữu ích, một nguy hiểm có thể nhận ra, một quyết định rút/tiến, một phần thưởng mở lựa chọn mới và một lần trở về nơi an toàn. Thiếu một trong các điểm này thì ưu tiên sửa vòng chơi trước thêm cảnh giới.
