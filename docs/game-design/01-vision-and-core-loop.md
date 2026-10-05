# 01 — Tầm nhìn sản phẩm và vòng chơi

**Cập nhật:** 05/10/2026 cho `feat/map-ui-rebuild`.  
**Canon sản phẩm:** tài liệu này cùng [08 — Trạng thái sinh hoạt và hiện diện xã hội](08-social-presence-and-lifestyle.md).  
**Bối cảnh:** Việt Nam hiện đại khi linh khí vừa trở lại; xem [04 — Bối cảnh Việt Nam](04-world-setting-vietnam-awakening.md).

## 1. Lời hứa với người chơi

Tu Tiên là một game pixel online dành cho Gen Z, nơi bạn có thể ghé vào một thị trấn Việt Nam để gặp bạn bè, chăm nhà/vườn, hoặc chọn một hoạt động để nhân vật đại diện cho mình trong lúc bạn bận học hay đi làm. Bạn có thể chơi vài phút để chào bạn bè, ở lại lâu hơn để câu cá và thu thập, hoặc chủ động tu luyện và đi đánh quái.

Trải nghiệm hướng tới sự thư giãn, thân thuộc và có cộng đồng. Người chơi được tự chọn nhịp chơi, không phải liên tục cày cấp hay tham gia chiến đấu để theo kịp người khác.

## 2. Trụ cột trải nghiệm

1. **Hiện diện có ý nghĩa:** người chơi tự đặt trạng thái đời thường; bạn bè có thể biết họ đang học, làm việc, nghỉ ngơi hay tu luyện và thấy nhân vật thể hiện hoạt động đó.
2. **Một nơi muốn quay lại:** thị trấn, nhà riêng và khu sinh hoạt chung tạo cơ hội trò chuyện, thăm bạn, khoe trang phục và cùng thư giãn.
3. **Niềm vui chăm chút:** trồng trọt, câu cá, thu thập, chế tạo và chăm nhà/vườn là các hoạt động có giá trị riêng, không chỉ để chuẩn bị đánh quái.
4. **Sức mạnh theo lựa chọn:** ai muốn phát triển nhân vật có thể ngồi thiền hoặc chủ động đi đánh quái. Người chơi có thể bỏ qua combat mà vẫn tận hưởng cộng đồng và đời sống.
5. **Chất Việt Nam hiện đại pha kỳ ảo:** cảnh quan, kiến trúc và sinh hoạt gợi Việt Nam; linh khí, tu luyện và dị thú làm lớp phiêu lưu mở rộng dần.

## 3. Vòng chơi

| Nhịp | Trải nghiệm |
| --- | --- |
| Vài phút | Chọn trạng thái, vào làng, xem bạn bè, trò chuyện hoặc để lại lời nhắn |
| Một phiên thư giãn | Chăm vườn, câu cá, thu thập, chế tạo, trang trí nhà hoặc thăm bạn |
| Khi muốn tiến bộ | Chọn ngồi thiền để tu luyện hoặc đi ra ngoài đánh quái, nhận vật phẩm và trang bị |
| Qua nhiều phiên | Hoàn thiện góc sống, mở thêm hoạt động/địa điểm, phát triển sức mạnh theo nhịp riêng |

Người chơi có thể chọn trạng thái trước khi rời máy. Mục tiêu là trạng thái đó tiếp tục hiện cho bạn bè trong thời gian đã chọn, cùng hình ảnh nhân vật ở hoạt động phù hợp. Đây là thông tin do người chơi tự đặt, không phải theo dõi lịch, vị trí hay hành vi ngoài đời.

## 4. Hai kiểu hoạt động cần tách biệt

- **Trạng thái xã hội:** “đang đi học”, “đang học bài”, “đang đi làm”, “đang nghỉ”. Chúng giúp bạn bè hiểu mình đang bận hay muốn được ghé thăm; không tự cấp sức mạnh, tiền hoặc lợi thế.
- **Hành động trong game:** trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn, ngồi thiền hoặc đánh quái. Thiền có thể tăng sức mạnh theo thời gian; đánh quái là cách chơi chủ động để thử sức và kiếm chiến lợi phẩm.

Cách chia này giữ cho trạng thái đời thường chân thật, đồng thời để tiến trình tu luyện có lựa chọn và giới hạn cân bằng riêng.

## 5. Phạm vi và thứ tự sản xuất

| Giai đoạn | Trọng tâm |
| --- | --- |
| P0 | Chốt hình ảnh sản phẩm qua bản đồ, UI, nhân vật, di chuyển và các khu sinh hoạt Việt Nam |
| P1 | Không gian làng online, bạn bè/chat và trạng thái hoạt động có thể xem khi chủ nhân bận |
| P2 | Vòng sinh hoạt cơ bản: nhà/vườn, trồng trọt, câu cá, thu thập và chế tạo |
| P3 | Tu luyện bằng thiền, quái PvE và phần thưởng để người chơi chủ động lựa chọn |
| Sau đó | Mở rộng câu chuyện, vùng đất và hệ thống nâng cao sau khi vòng chơi nhỏ đã rõ |

Không có minigame trong định hướng hiện tại. PvP không phải trọng tâm. Cốt truyện dài, hành trình tinh không và nội dung cấp cao không được phép lấn át thị trấn, nhân vật và giao lưu trong các bước đầu.

## 6. Ranh giới giữa tầm nhìn và code

Các trạng thái học/làm/nghỉ, hiện diện khi client đóng, hoạt động nông trại/câu cá và tiến trình thiền là **đề xuất sản phẩm**, chưa đồng nghĩa với code đã có. Tính năng chỉ chuyển thành “đã triển khai” sau khi có code, kiểm thử và xác nhận chạy trong game.
