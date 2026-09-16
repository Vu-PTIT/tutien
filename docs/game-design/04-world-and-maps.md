# 04 — Thế giới, bản đồ và nhịp khám phá

**Mục tiêu:** mỗi map có lý do tồn tại, nguy hiểm đọc được và liên hệ với story/kinh tế.

## 1. Cấu trúc thế giới

Thế giới mở theo khu vực nối nhau, không phải một mặt phẳng liên tục vô hạn. Mỗi khu có cổng vào, checkpoint, giới hạn người chơi và phiên bản dữ liệu.

MVP gồm đúng bốn map gameplay. Vườn sáu ô là giao diện quản lý đất riêng tại An Khê; không cần một map thứ năm hoặc nhà xây dựng tự do.

```text
An Khê [hub an toàn]
    |
    +-- Trúc Âm [khai thác / học chiến đấu]
             |
             +-- Thạch Cạn [đọc địa hình / tinh anh]
                      |
                      +-- Cổ Tỉnh [bí cảnh riêng / boss chương đầu]
```

Mỗi nhánh có đường quay về. Không khóa người chơi vào tuyến nguy hiểm bằng một nhiệm vụ chưa đủ sức làm.

## 2. Đơn vị và lớp map

Đề xuất tile hình ảnh 32×32 px; gameplay dùng tile và phần lẻ của tile. Hệ tọa độ server không phụ thuộc kích thước cửa sổ hay zoom.

Các lớp nội dung:
- Nền đi được, vật cản, trang trí dưới chân.
- Đối tượng tương tác: NPC, node tài nguyên, trụ trận, cổng.
- Trang trí cao và hiệu ứng; không tự tạo va chạm chỉ vì che nhân vật.
- Dữ liệu gameplay xuất riêng: vùng cấm, hình va chạm, spawn, trigger, checkpoint.

Godot có TileMapLayer phục vụ cấu trúc tile; cách phân lớp và xuất dữ liệu phía server ở đây là đề xuất cho dự án, không phải tính năng tự có của Nakama. Nguồn S04 trong 15.

## 3. Map 1 — An Khê, `m_an_khe`

**Kích thước prototype:** 64×48 tile.  
**Vai trò:** an toàn, giao việc, dịch vụ, nơi trở về.  
**Người chơi:** tối đa 2 cho bản thử đầu; chưa suy rộng thành giới hạn sản phẩm.

### Các điểm chức năng

| Điểm | NPC/chức năng | Mục đích |
|---|---|---|
| Nhà dược | Bà Sâm | Vườn, hồi phục, luyện đan |
| Trạm thủy vụ | Tạ Nghiêm | Việc khảo sát, chứng cứ linh mạch |
| Lò rèn | Đỗ Khê | Chế tạo kiếm |
| Sạp chợ | Hà Tố | Mua giống, bán nguyên liệu, tin đồn |
| Cổng làng | Lục Vi | Học quan sát và tuyến rừng |
| Nhà khách | Tống Đức | Đại diện Thanh Lộc Viện và mạch truyện kế tiếp |

Vườn cá nhân chỉ chủ sở hữu được trồng/thu. Người khác không lấy cây hoặc phá đất. UI truy cập từ tương tác bàn làm vườn ở nhà dược.

Có bãi đấu tập giới hạn trong hub; chỉ chuyển hai người đồng thuận vào một instance đấu tập, không bật PvP cho cả map.

### Bố cục nghiệm thu

Từ điểm spawn thấy ít nhất một biển chỉ hướng. Đi đến ba dịch vụ đầu tiên không cần mở bản đồ lớn. Không đặt NPC thiết yếu sau một vùng crowd khiến khó tương tác.

## 4. Map 2 — Trúc Âm, `m_truc_am`

**Kích thước:** 96×96 tile.  
**Vai trò:** dược liệu, dấu nước lạ, học quái có báo đòn.  
**Địch:** Sơn Trư và Độc Chu.

### Ba tuyến

Tuyến ven suối an toàn hơn, nhiều Cam Lộ, ít vật liệu đặc biệt. Tuyến sườn rừng có Độc Chu và Tĩnh Tâm, buộc đọc vệt độc. Tuyến đường tắt mở sau khảo sát Mạch Bàn; giúp về làng nhanh chứ không tăng loot vô hạn.

### Điểm quan tâm

Một cầu hỏng có thể sửa bằng nhiệm vụ phụ; một bãi nước đổi màu; một lều bỏ; một dấu niêm phong. Dấu niêm phong là tương tác thông tin, không mặc định là rương ngẫu nhiên.

Các tuyến phải nhìn thấy điểm tương đồng cảnh quan để định hướng. Không tái sử dụng cùng một góc rừng đến mức người chơi không phân biệt lối đi.

## 5. Map 3 — Thạch Cạn, `m_thach_can`

**Kích thước:** 80×64 tile.  
**Vai trò:** quặng, địa hình che chắn, hậu quả khai thác linh mạch.  
**Địch:** Kẻ Rình Đường và Thạch Vệ.

Tuyến trên dễ định hướng nhưng nhiều đòn xa. Tuyến dưới có vật cản và điểm khoáng; ít đường thoát hơn. Một điểm ngắm cho thấy trụ chuyển dòng, giúp người chơi hiểu xung đột bằng môi trường.

Checkpoint ở rìa, không nằm trong tầm đánh của quái. Nhân vật mới vào map không bị đánh ngay trước khi nhận snapshot.

Cửa Cổ Tỉnh yêu cầu `q_main_009` hoàn tất và có quyền vào được ghi ở server. Vật phẩm chìa là công cụ kể chuyện; quyền mở khóa bền vững không chỉ phụ thuộc giữ một item có thể lỡ xóa.

## 6. Map 4 — Cổ Tỉnh, `m_co_tinh`

**Kích thước:** 64×64 tile, chia năm phòng nhỏ.  
**Loại:** instance PvE riêng cho một người hoặc tổ đội hai người.

| Phòng | Nội dung | Kiến thức kiểm tra |
|---|---|---|
| 1. Cửa giếng | Checkpoint và biển dấu | Đã chuẩn bị vật tư chưa |
| 2. Hành lang rễ | Độc Chu, vùng báo nguy hiểm | Né và vị trí |
| 3. Buồng cân mạch | Hai nguồn cấp, đường thay thế | Dò thông tin |
| 4. Nhà trận | Một Thạch Vệ | Nhịp đỡ và lộ sườn |
| 5. Tâm giếng | Mộc Tâm Thủ Trận | Tổng hợp cơ chế |

Phiên bản MVP dùng bố cục cố định. Không cần procedural dungeon hoặc hàng trăm seed. Chỉ thêm biến thể khi bản cố định đã đủ thú vị.

Người vào sau lúc boss bắt đầu không tự nhận điều kiện quest. Party leader không quyết định phần thưởng của người khác.

## 7. Luật rủi ro

| Loại khu | PvP | Tài sản khi chết | Thông báo |
|---|---|---|---|
| Hub | Không, trừ instance đấu tập | Không mất | Biểu tượng an toàn |
| Hoang dã MVP | Không | Giữ đồ đã sở hữu | Cảnh báo quái và checkpoint |
| Bí cảnh MVP | Không | Không thưởng encounter thất bại | Thông tin solo/co-op và cách rút |
| Tranh đoạt tương lai | Chỉ theo luật tự nguyện | Chưa khóa thiết kế | Bắt buộc xác nhận rủi ro trước vào |

Không gọi map “nguy hiểm” rồi âm thầm bật full-loot ở bản sau. Thay đổi loại rủi ro cần migration thiết kế, truyền thông và kiểm thử riêng.

## 8. Node tài nguyên và công bằng online

MVP dùng node tài nguyên cá nhân trong map chung: mỗi người có trạng thái lần thu riêng. Tránh cuộc đua click gây phá trải nghiệm học.

Server xác nhận khoảng cách, trạng thái node và thời gian tương tác. Mỗi node có `nodeId`, `resourceTableId`, `respawnPolicy` và `mapVersion`.

Cây hiếm Alpha có thể dùng tranh chấp riêng trong vùng tự nguyện. Không đổi mọi node thành “ai click trước thắng” chỉ vì thêm online.

## 9. Luật cửa, checkpoint và teleport

Cổng kiểm tra nhiệm vụ, nhóm và server capacity; không tin `mapId` client tự đặt. Lưu vị trí hợp lệ cuối cùng tại checkpoint, không cho client chọn tọa độ spawn.

MVP có một nhân vật hiện diện tại tối đa một match gameplay. Chuyển map phải có chuyển quyền điều khiển và `sessionEpoch` mới, tránh cùng tài khoản farm hai map.

Thất bại khi chuyển map phải về trạng thái nguồn hoặc checkpoint có ghi nhận, không tiêu chìa/đồ hai lần. Chi tiết giao dịch ở 10.

## 10. Ngày đêm và thời tiết

MVP dùng thay đổi hình ảnh nhẹ để tạo không khí; không khóa quest chính vào giờ thật. Thời gian cây tách khỏi hiệu ứng ngày đêm.

Alpha có thể thêm mưa làm thay đổi tuyến tài nguyên, nhưng phải giữ đường tiến trình thay thế. Không yêu cầu online lúc nửa đêm để nhận nguyên liệu đột phá bắt buộc.

## 11. Hướng mở rộng sau MVP

Thanh Lộc Viện làm rõ đời sống tông môn; Phường Bạch Sa là không gian giao lưu và nghề; Đầm Vân Trạch mở tuyến sinh tồn tài nguyên; Cựu Đài Khuyết mở xung đột thế lực.

Đây là tên ý tưởng, chưa phải map đã định nghĩa trong catalog MVP. Không thêm chúng vào loading screen hoặc teleport list trước khi có nội dung.

## 12. Nghiệm thu map

Mỗi map có mục tiêu, đường đi, đường về, ít nhất một quyết định tuyến đường và một phần kể chuyện bằng môi trường. QA kiểm tra spawn an toàn, va chạm khớp client/server, tương tác không xuyên tường, rút lui hợp lệ, chuyển map không tạo hai bản nhân vật và quest không bị kẹt sau reconnect.
