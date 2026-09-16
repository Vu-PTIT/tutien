# 05 — Story bible: một người bình thường giữa cuộc tranh linh mạch

**Trạng thái:** cốt truyện gốc đề xuất cho dự án.  
**Phạm vi:** chương 1 đủ cụ thể để viết quest; chương sau chỉ dựng hướng.  
**Không phải:** bản chuyển thể diễn biến hoặc nhân vật Phàm Nhân Tu Tiên.

## 1. Tiền đề

An Khê sống nhờ một dòng nước được dẫn qua trận dẫn linh cũ. Vài mùa gần đây, dược thảo chết bất thường và người làm nghề phải mua nguyên liệu từ xa. Các đơn vị quản lý đổ lỗi cho nhau: trận xuống cấp, người khai thác quá mức, hoặc nguồn linh khí vốn đang cạn.

Nhân vật người chơi là một người làm việc thời vụ được thuê hỗ trợ khảo sát. Khi học cách cảm nhận linh mạch để hoàn thành công việc, họ nhận ra dòng linh khí đang bị chuyển hướng có chủ đích.

Vấn đề không phải “ai là ma đầu cần giết”, mà là **ai có quyền tiếp cận tài nguyên để sống và tu luyện**.

## 2. Chủ đề

Tự lập mà không phải cắt đứt mọi quan hệ. Thận trọng mà không biến thành nghi ngờ tất cả. Tiến lên nhưng phải nhận ra chi phí của tài nguyên mình sử dụng.

Người mạnh có thể có lý do hợp lý nhưng cách hành xử gây tổn hại. Người yếu có thể nói dối để tồn tại. Mỗi chương cần ít nhất một lựa chọn không thể giải bằng lực chiến.

## 3. Quy tắc thế giới

Linh khí không phân bố đều. Cơ sở hạ tầng tu luyện—giếng, trận dẫn, đất dược, đường vận chuyển—quyết định ai được tiến bộ. Công pháp là tri thức có thể học, không phải mọi người sinh ra đều có quyền tiếp cận.

Tông môn cung cấp bảo hộ và tri thức nhưng yêu cầu nghĩa vụ. Tán tu tự do hơn nhưng phải tự tìm nguồn lực và chấp nhận bất ổn. Không gán mọi tổ chức một nhãn thiện/ác vĩnh viễn.

Cảnh giới cao phải có dấu hiệu trong môi trường và cách NPC ứng xử. Chưa cần tạo NPC Nguyên Anh có thể đánh người mới để thể hiện điều đó.

## 4. Cơ duyên riêng: Mạch Bàn

Mạch Bàn là công cụ khảo sát hỏng một phần được giao cho người chơi sửa và sử dụng. Nó đọc dấu lưu chuyển gần đó, không sinh vật phẩm hoặc đẩy cây trưởng thành vô hạn.

Mỗi người chơi có công cụ của mình và lịch sử phát hiện cá nhân. Nó không phải bảo vật duy nhất mà hàng nghìn người cùng được story khẳng định sở hữu.

Nâng Mạch Bàn trong Alpha mở cách đọc dấu mới, không tăng tỷ lệ rơi đồ toàn server. Cơ duyên nằm ở thông tin và lựa chọn khai thác thông tin.

## 5. Sáu NPC chương đầu

| ID / tên | Vai trò công khai | Mong muốn riêng | Điều người chơi có thể tác động |
|---|---|---|---|
| `npc_ba_sam` — Bà Sâm | Dược sư, hướng dẫn vườn | Giữ nguồn thuốc ổn định cho làng | Cung cấp dược liệu và bằng chứng nguồn nước |
| `npc_ta_nghiem` — Tạ Nghiêm | Thư lại trạm thủy vụ | Ngăn khủng hoảng, cũng sợ mất chức | Nộp chứng cứ riêng hay công khai |
| `npc_luc_vi` — Lục Vi | Người dẫn đường | Tìm nguyên nhân một tuyến rừng bị cấm | Tin tưởng và phối hợp khảo sát |
| `npc_do_khe` — Đỗ Khê | Thợ rèn | Có nguồn quặng không phụ thuộc độc quyền | Mở tuyến cung ứng an toàn |
| `npc_tong_duc` — Tống Đức | Đệ tử Thanh Lộc Viện | Chứng minh viện vẫn có thể xử lý công bằng | Cùng niêm phong trận hoặc buộc công bố sai sót |
| `npc_ha_to` — Hà Tố | Người buôn giống/vật tư | Giữ việc làm ăn và mạng lưới tin tức | Chọn mua thông tin, đổi công hoặc tự khảo sát |

Không thiết kế sáu NPC thành sáu bảng shop. Mỗi người có một điều không thể đáp ứng ngay, một giới hạn hiểu biết và một phản ứng sau chương 1.

### Tín nhiệm

MVP dùng ba cờ thái độ có ý nghĩa theo từng NPC: chưa biết / đã hợp tác / có bất đồng. Không làm thang “hảo cảm 100 cấp”. Bất đồng không được khóa điều kiện tu luyện chính hoặc tất cả cửa hàng hồi phục.

## 6. Ba tổ chức trong bối cảnh

**Thanh Lộc Viện (`fac_thanh_loc`)** vận hành tri thức và trận dẫn linh. Viện không thống nhất nội bộ: có người muốn minh bạch, có người muốn giữ độc quyền.

**Huyền Sa Hội (`fac_huyen_sa`)** vận chuyển và khai thác nguyên liệu. Hội vừa mở đường cung ứng vừa hưởng lợi từ thiếu hụt; chương 1 chỉ xuất hiện qua dấu vết và NPC liên quan.

**Tán Tu Phường (`fac_tan_tu`)** là mạng lưới thợ nghề và người tu độc lập, hữu ích nhưng thiếu khả năng bảo hộ tập trung.

MVP chỉ có nội dung liên hệ, chưa có ba tuyến gia nhập đầy đủ. Đây là faction NPC, không phải `sect/guild` do người chơi tạo.

## 7. Chương 1 — Dòng nước không còn trong

### Hồi A: Kiếm chỗ đứng

Người chơi nhận công việc khảo sát, học cách đi rừng, tiếp xúc với Mạch Bàn và thực hành dẫn khí. Mục tiêu nhỏ nhưng có ích: đưa về mẫu nước và nguyên liệu cứu vườn.

Đoạn chơi này dạy điều khiển, né, dò thông tin, tu luyện và vòng vườn–đan.

### Hồi B: Có người hưởng lợi

Tại Thạch Cạn, dấu vận chuyển và sổ ghi cho thấy một phần nguồn linh khí đang bị điều chỉnh. Tạ Nghiêm muốn hoãn công bố để xác minh; Hà Tố lo tin đồn làm giá tăng; Lục Vi muốn mở lại tuyến rừng.

Người chơi chọn cách chia sẻ bằng chứng. Không lựa chọn nào được coi là “đáp án đạo đức đúng” bằng một nhãn xanh/đỏ.

### Hồi C: Chặn dòng sai, giữ đường sống

Cổ Tỉnh là nơi cơ chế bảo vệ cũ bị ép vận hành sai. Mộc Tâm Thủ Trận tấn công vì lệnh bảo vệ xung đột, không phải vì một con quái tự nhiên xuất hiện để làm boss.

Người chơi có thể phá tâm trận hoặc đọc các điểm ngắt để niêm phong. Cả hai giải quyết chương đầu; khác mức hư hại và phản ứng NPC.

### Kết chương

Dòng nước được ổn định một phần, không hồi phục toàn bộ thế giới ngay lập tức. Người chơi nhận chỗ đứng, mở Luyện Khí 4 và thư mời đến tìm hiểu hệ thống linh mạch lớn hơn.

Câu hỏi còn lại: ai đã ra quyết định chuyển dòng, và vì sao nguồn phía trên cũng đang suy yếu?

## 8. Hai lựa chọn chính và hệ quả

| Lựa chọn | Hệ quả tức thời | Hệ quả về sau | Điều không được làm |
|---|---|---|---|
| Chia chứng cứ kín với trạm hoặc công khai với người dân | Hội thoại và tín nhiệm đổi | Tuyến người cung cấp thông tin chương 2 đổi | Khóa lớp nhân vật hoặc mất quest chính |
| Phá tâm trận hoặc niêm phong | Hình kết encounter khác | Một nhiệm vụ sửa chữa hoặc nghiên cứu khác | Cho một nhánh độc quyền vật phẩm mạnh hơn vĩnh viễn |

Người chơi phải được biết lý do và mức rủi ro trước lựa chọn. Chỉ lưu một kết quả đã xác nhận; không cho nhận thưởng cả hai nhánh bằng reconnect.

## 9. Cách kể chuyện trong game online

Mỗi người có journal và story flags riêng. Thế giới chung giữ những thay đổi nhỏ không xung đột; cảnh kết chương và đối thoại nhánh nằm ở instance hoặc hiển thị cá nhân.

Một người trong party đã hoàn thành chương vẫn giúp người khác được, nhưng không được nhận lại phần thưởng một lần. Cả nhóm không bị buộc xem cutscene dài nếu có người đang replay.

Quest choice không phải quyết định của party leader thay cả nhóm. Phần giải quyết encounter có thể chung; phần nhận định và quan hệ được xác nhận cá nhân ở hub.

## 10. Khung dài hạn

| Chương | Cảnh giới mục tiêu trong thiết kế | Xung đột | Hệ thống mới |
|---|---|---|---|
| 1. Dòng nước không còn trong | Luyện Khí 1–4 | Một cộng đồng bị mất nguồn lực | Vườn, combat, dò mạch |
| 2. Một chỗ dưới mái viện | Luyện Khí 5–9 | Gia nhập bảo hộ hay giữ độc lập | Faction NPC, nghề chuyên sâu |
| 3. Giá của một nền móng | Luyện Khí 10–13 / thử Trúc Cơ | Nguồn nguyên liệu đột phá bị tranh chấp | Build, tổ đội, chuẩn bị nhiều bước |
| 4. Người giữ một vùng đất | Sau Alpha | Trách nhiệm khi đã có quyền lực | Nội dung cộng đồng và vùng tranh đoạt |
| 5. Bên ngoài bản đồ cũ | Chưa định lịch | Một hệ sinh thái tu luyện lớn hơn | Đánh giá sau dữ liệu vận hành |

Không phải mọi chương tương ứng với một lần tăng cảnh giới bắt buộc. Chưa viết twist chi tiết cho chương 5 khi chương 1 chưa qua playtest.

## 11. Quy chuẩn thoại

Thoại thường 1–3 câu/lượt, có nút xem thêm/journal. Mỗi lượt chỉ nên giao một ý quan trọng. Thuật ngữ mới xuất hiện cùng hành động giải thích; không mở đầu bằng một bài giảng lịch sử dài.

Ví dụ thoại gốc:
> Bà Sâm: “Cây không chết vì thiếu nước. Nó chết vì thứ nước này không còn nuôi được nó.”

Không đưa thoại phim vào catalog. Không sao chép tên nhân vật rồi chỉ sửa một âm để giả thành nhân vật mới.

## 12. Nghiệm thu story

Người thử hiểu việc đang làm, biết ít nhất một người được lợi hoặc bị hại, nhớ một NPC và nhận ra một lựa chọn của mình. Không bị kẹt tiến trình vì lựa chọn đạo đức, chơi solo hoặc đồng đội đã làm quest trước.
