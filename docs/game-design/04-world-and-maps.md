# 04 — Thế giới, bản đồ và tuyến tài nguyên

**Cập nhật:** 21/09/2026. **Phạm vi:** bốn map MVP, chưa là bản đồ đã triển khai.
Mỗi map có mục tiêu phát triển, nguy hiểm, nguồn tài nguyên và đường trở về.

## 1. Cấu trúc và phân tầng

```text
An Khê — hub an toàn
   └─ Trúc Âm — dược liệu, né, cày đầu
        └─ Thạch Cạn — quặng, vật cản, tinh anh
             └─ Cổ Tỉnh — bí cảnh riêng, tổng hợp cơ chế
```

Thế giới là các khu nối nhau, không phải mặt phẳng vô hạn.
Vườn 6 ô là UI cá nhân ở An Khê, không tính map thứ năm.
Mỗi khu có checkpoint, cổng, phiên bản, giới hạn người và dữ liệu spawn.

Tile hình ảnh đề xuất 32×32 px; server dùng tile và phần lẻ, không phụ thuộc zoom.
Tách nền đi được/vật cản, tương tác, trang trí cao và dữ liệu gameplay xuất riêng.
Không biến một hình trang trí thành va chạm chỉ vì nó che người chơi.

## 2. An Khê — `m_an_khe`

Kích thước thử 64×48 tile. Hub an toàn, thử tối đa 2 người.
Nhìn thấy biển đường từ spawn; dịch vụ thiết yếu không bị che hoặc chặn bởi crowd.

| Địa điểm | Nhân vật | Công dụng |
| --- | --- | --- |
| Nhà dược | Bà Sâm | Nghỉ, vườn, luyện đan, nghiên cứu |
| Trạm thủy vụ | Tạ Nghiêm | Khảo sát và chứng cứ |
| Lò rèn | Đỗ Khê | Học/chế tạo kiếm |
| Sạp chợ | Hà Tố | Mua giống/nước/hồi phục, bán vật liệu |
| Cổng làng | Lục Vi | Học quan sát, ghim tuyến đi |
| Nhà khách | Tống Đức | Quyền tiếp cận Cổ Tỉnh và thông tin tiếp |

Vườn riêng không ai khác lấy/phá. Bãi đấu tập chỉ chuyển hai người đồng thuận vào
instance, không bật PvP cho hub. Nghỉ hồi phục không mất tiền.
Bảng mục tiêu ở journal/hub có đường tới nguồn thiếu, không ép đọc mọi NPC lại.

## 3. Trúc Âm — `m_truc_am`

Kích thước thử 96×96 tile. Sơn Trư/Độc Chu, học chuẩn bị và đi săn có mục tiêu.

| Tuyến | Người chơi tìm gì? | Nguồn | Nguy hiểm và lý do quay về |
| --- | --- | --- | --- |
| Ven suối | Hồi phục, khởi đầu an toàn | Cam Lộ, nước/trúc, dấu khảo sát an toàn | Ít quái; đủ lựa chọn khi hết vật tư |
| Sườn rừng | Tu vi và nguyên liệu phù | Độc Chu/tơ nhện, Tĩnh Tâm | Đọc vùng độc; không cần thuốc giải độc độc quyền |
| Bãi Sơn Trư | Tu vi, nguồn tiền bán vật liệu | Da Sơn Trư | Né lao; không đứng giữa nhiều hướng |
| Đường tắt | Giảm công đi lại | Mở qua khảo sát/sửa cầu | Không tự cộng hệ số loot hoặc reset node |

Giữ cầu hỏng, nước đổi màu, lều bỏ, dấu niêm phong làm điểm định hướng.
Dấu khảo sát của `q_main_002` là nội dung hướng dẫn không phát XP lặp.

Lộ trình mẫu đầu cần đủ nguồn gặp 4 Sơn Trư/2 Độc Chu và 4 Cam Lộ; không bắt mọi
đối tượng nằm cạnh nhau thành một bãi đứng farm. Có Sơn Trư đơn trước, rồi nhóm nhỏ.
`poi_truc_am_route` cấp XP một lần sau dẫn khí.

Tuyến tránh đầu: sửa cầu `q_side_001`, khảo sát `poi_safe_bank` và `poi_old_camp`.
Ba nguồn đủ phần 100 XP thay thế, không đòi cây Tĩnh Tâm 45 phút. Trúc sửa cầu
lấy ở tuyến an toàn. Người bỏ qua giao tranh `q_main_006` vẫn được mở Thạch Cạn
bằng điều kiện quest đúng, không bị khóa do thiếu “kill count”.

## 4. Thạch Cạn — `m_thach_can`

Kích thước thử 80×64 tile. Vai trò: quặng làm kiếm, đối thủ tầm xa, tinh anh.
Kẻ Rình Đường giữ tuyến trên dễ định hướng; tuyến dưới có quặng/vật cản nhưng
ít khoảng thoát. Thạch Vệ có điểm quan sát an toàn để học trước khi giao tranh.

Quặng lấy từ node và loot Kẻ Rình Đường; không đặt toàn bộ nguồn làm kiếm sau
một boss vốn yêu cầu có kiếm mới qua. Cần tuyến khai thác an toàn hơn, còn người
thích combat có thể kiếm qua quái. Trúc đã có ở Trúc Âm.
`poi_thach_can_ledger_view` là mốc khám phá một lần, không thay vật phẩm quest sổ đá.

Checkpoint ở rìa, ngoài tầm đánh. Không đánh người chơi lúc chưa nhận snapshot.
Tầng 2/Hộ Thân là gợi ý chuẩn bị, không phải khóa cửa mới.
Cổng Cổ Tỉnh yêu cầu `q_main_009` đã nhận thưởng/mở quyền ở server; quyền tồn tại
bền vững, không chỉ phụ thuộc cầm một chiếc chìa có thể mất.

## 5. Cổ Tỉnh — `m_co_tinh`

Kích thước thử 64×64 tile, instance solo/party 2 người, bố cục cố định.

| Phòng | Nội dung | Điều được kiểm tra |
| --- | --- | --- |
| Cửa giếng | Checkpoint và xem vật tư/loadout | Hiểu đường về, quyền vào |
| Hành lang rễ | Hai Độc Chu trong lộ trình mẫu | Né và mặt đất nguy hiểm |
| Buồng cân mạch | Hai nguồn cấp/đường thay thế | Dò mạch; `poi_co_tinh_flow` một lần |
| Nhà trận | Một Thạch Vệ | Hướng phòng thủ và phản công |
| Tâm giếng | Mộc Tâm Thủ Trận | Tổng hợp; hạ tâm hoặc niêm phong |

Không procedural dungeon trong MVP. Người vào sau khi boss bắt đầu không tự có
công lao; party leader không quyết định thưởng hoặc lựa chọn hội thoại thay người khác.
Không dùng sát thương để mở một pha chỉ co-op mới giải được.

Mỗi lượt mới có ID riêng do server tạo; reset trong lượt không thành một lần clear.
Respawn boss cần lượt mới hợp lệ, không rời phòng 1 giây để nhận lại cùng kết quả.

## 6. Node và respawn

Node tài nguyên cá nhân trong map chung: `nodeId`, `resourceTableId`,
`respawnPolicy`, `mapVersion`, chủ thể và thời điểm tương tác.
Server kiểm khoảng cách/va chạm/trạng thái; không cho đổi giờ máy để thu sớm.
Không cần tranh click trong hướng dẫn. Cây hiếm tranh chấp để sau ở vùng tự chọn.

Spawn quái theo cụm: vị trí, số lượng, vùng notice/chase/return và generation.
Dùng timer server trong [bảng quái](03-combat-skills-and-artifacts.md).
Chỉ respawn khi cụm đã kết thúc và vị trí an toàn; trì hoãn khi chồng nhân vật.
Không spawn trên checkpoint, cổng, NPC hoặc rương/thao tác bắt buộc.

Timer/quyền thưởng không reset bởi đổi map, đổi instance hoặc reconnect.
MVP một nhân vật hoạt động ở tối đa một match, đổi vùng phải đổi epoch/quyền điều khiển.
Đổi vùng thất bại quay nguồn/checkpoint an toàn, không nhân người hoặc tiêu chìa lần hai.

## 7. Rủi ro và tài sản

| Khu | PvP | Chết/thất bại |
| --- | --- | --- |
| Hub | Chỉ đấu tập đồng thuận trong instance | Không mất tài sản |
| Hoang dã MVP | Không | Giữ XP/đồ đã commit; vật tư đã dùng vẫn tiêu |
| Bí cảnh MVP | Không | Không có thưởng của encounter thất bại |
| Vùng tranh đoạt tương lai | Tự chọn, chưa triển khai | Phải chốt và thông báo luật riêng trước vào |

Không âm thầm đổi các map MVP thành full-loot. Nguồn thưởng đã quyết toán được giữ,
không phải “mang về làng mới sở hữu” trong bản MVP này. Trở về là nhịp sử dụng thành
quả/chữa trị/đột phá, không là nút tịch thu loot nếu người chơi chết giữa đường.

## 8. Nhịp phiên và mở rộng

Đi đường có định hướng và thông tin nhưng không kéo dài vô ích. Đo riêng thời gian
di chuyển, combat, UI và chờ. Chuyến mẫu 15–20 phút là giả thuyết cần thử.
Ngày/đêm chỉ tạo không khí; không khóa quest chính vào giờ thật/nửa đêm.

Thanh Lộc Viện, Phường Bạch Sa, Đầm Vân Trạch và Cựu Đài Khuyết là hướng Alpha,
không thêm vào teleport list khi chưa có nội dung. Không tăng số map chỉ để tăng
thời gian cày; trước hết mỗi map hiện tại phải tạo quyết định tuyến đi có ý nghĩa.

## 9. Nghiệm thu

Từ tài khoản mới kiểm đủ đường ra/về, biển định hướng, camera/va chạm đúng server,
cổng theo quest, node cá nhân, quái không xuyên tường, spawn an toàn, đổi instance
không farm lại source, reconnect không kẹt. Cả tuyến chiến đấu và đường tránh phải
dẫn tới tiến trình chính. Xem [kịch bản liên kết](progression-pve-spec.md).
