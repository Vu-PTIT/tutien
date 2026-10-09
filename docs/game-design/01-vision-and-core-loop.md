# 01 — Tầm nhìn sản phẩm và vòng chơi

**Cập nhật:** 09/10/2026 cho `feat/map-ui-rebuild`.  
**Định hướng đầy đủ:** [09 — Hai không gian sản phẩm](09-dual-experience-platform.md).  
**Hiện diện xã hội:** [08 — Trạng thái sinh hoạt](08-social-presence-and-lifestyle.md).

## 1. Lời hứa với người dùng

Tu Tiên kết hợp một **nền tảng đời sống cá nhân** với một **thế giới game pixel xã hội**.

Nền tảng đời sống là nơi người dùng lên lịch, ghi kế hoạch, ghi nhận những gì đã làm, thêm note, xem biểu tượng hoạt động và thống kê nhẹ theo ngày/tuần/tháng. Phần này phải có ích ngay cả khi người dùng không vào game.

Thế giới game là một thị trấn Việt Nam hiện đại pha kỳ ảo, nơi cùng một nhân vật có thể sinh hoạt, gặp bạn, câu cá, làm vườn, thiền, khám phá hoặc PvE. Khi người dùng bận ngoài đời, họ có thể giao một hoạt động cho nhân vật từ nền tảng; server tiếp tục quản lý phiên hoạt động ngay cả khi game client đóng. Khi rảnh, người dùng có thể vào game và tiếp quản chính nhân vật đó.

Hai phần dùng chung tài khoản, nhân vật, hồ sơ, bạn bè, chat, tài sản và trạng thái. Mục tiêu là **người dùng sống cuộc sống thật; nhân vật có một cuộc sống song hành trong thế giới game**.

## 2. Hai lớp dữ liệu phải tách biệt

Không đồng nhất việc người dùng đang làm ngoài đời với việc nhân vật đang làm trong game.

| Lớp | Ví dụ | Mục đích |
| --- | --- | --- |
| `real_life_entry` | Học 08:00–11:00, đi làm, đi cà phê, tập thể dục | Lịch, kế hoạch, nhật ký, icon và thống kê đời sống |
| `real_life_status` | Đang học, đang làm, đang nghỉ, không muốn chia sẻ | Hiện diện xã hội tùy chọn |
| `avatar_activity` | Đi câu, chăm vườn, thiền, nghỉ ở quán, thu thập | Hoạt động của nhân vật trong thế giới game |

Ví dụ hợp lệ: người dùng đang học ngoài đời nhưng nhân vật đang tự câu cá ở hồ An Khê. Không được tự suy ra “đang học” thì nhân vật bắt buộc phải tới thư viện.

## 3. Vòng trải nghiệm chính

### Nền tảng đời sống

**Lên kế hoạch → thực hiện ngoài đời → ghi nhận/note → xem lại lịch và thống kê → tùy chọn giao hoạt động cho nhân vật.**

- Lịch ngày/tuần/tháng.
- Việc có thể tạo trước hoặc ghi lại sau khi đã làm.
- Hoạt động có icon để nhìn nhanh một ngày đã diễn ra thế nào.
- Note ngắn, thời lượng tùy chọn và trạng thái dự kiến/đã làm/bỏ.
- Lịch học/làm lặp lại theo quy tắc, không bắt nhập từng buổi.
- Thống kê mang tính phản ánh, không chấm điểm năng suất và không phạt ngày trống.

### Thế giới game

**Chọn hoạt động → nhân vật tự tới địa điểm → hoạt động trực tiếp hoặc tự động → kết quả được server lưu → người dùng có thể vào tiếp quản bất kỳ lúc nào.**

Cùng một hoạt động hỗ trợ hai cách chơi:
- **Trực tiếp:** người dùng tự điều khiển nhân vật, ví dụ tự tới hồ và câu cá.
- **Tự động:** từ nền tảng hoặc trong game, người dùng giao “Đi câu”; nhân vật tự đi tới slot hợp lệ và thực hiện hoạt động khi chủ nhân vắng mặt.

Tự động không phải một bản game giả tách biệt. Nó dùng cùng nhân vật, vị trí, kho đồ, điều kiện và kết quả với chơi trực tiếp.

## 4. Trụ cột sản phẩm

1. **Lịch và nhật ký đời sống:** kế hoạch, icon hoạt động, note và thống kê nhẹ là giao diện chính của nền tảng.
2. **Nhân vật song hành:** cùng một nhân vật tiếp tục sinh hoạt trong thế giới game khi chủ nhân bận.
3. **Chuyển trực tiếp ↔ tự động:** người dùng có thể vào game tiếp quản nhân vật rồi trả lại chế độ tự động mà không tạo bản sao hoặc nhân đôi phần thưởng.
4. **Đời sống trong game:** câu cá, làm vườn, chăm nhà, thu thập, chế tạo, trang phục, biểu cảm và thăm bạn; không bắt người chơi dành nhiều giờ mỗi ngày.
5. **Hiện diện xã hội có kiểm soát:** bạn bè có thể thấy nhân vật đang ở đâu/làm gì theo quyền chia sẻ; trạng thái ngoài đời là dữ liệu riêng biệt.
6. **Tu tiên là bản sắc, không phải nghĩa vụ:** thiền và PvE là nhánh chơi tự chọn trong bối cảnh Việt Nam hiện đại hồi phục linh khí.

Định hướng hiện tại không có minigame bắt buộc. PvP không phải trọng tâm.

## 5. Nguyên tắc hoạt động tự động

- Đóng game không dừng phiên đã được server chấp nhận.
- Không yêu cầu treo máy thật.
- Chỉ có một quyền điều khiển nhân vật tại một thời điểm.
- Chuyển sang điều khiển trực tiếp không tạo nhân vật thứ hai.
- Kết quả đã settlement không được nhận hai lần.
- Hoạt động tự động vẫn tuân thủ điều kiện game: địa điểm, slot, vật tư, thời gian, quyền sở hữu và giới hạn.
- Nếu người dùng đang câu tự động rồi giao “chăm vườn”, hệ thống phải kết thúc/hủy bước đang dở theo quy tắc trước khi chuyển hoạt động.
- Người khác nhìn thấy nhân vật tự động phải có dấu hiệu phân biệt với chủ nhân đang trực tiếp online.

## 6. Phần thưởng và đời sống thật

Hoạt động game như câu cá, làm vườn hoặc thiền có thể tạo kết quả game theo luật riêng.

Việc người dùng ghi “đã học”, “đã đi làm” hoặc hoàn thành một mục lịch **không tự sinh cá, vật phẩm, kinh nghiệm chiến đấu hay sức mạnh**. Nếu có phần thưởng nối đời thật với game, ưu tiên biểu cảm, kỷ niệm hoặc trang trí và phải là lớp tùy chọn.

Không yêu cầu GPS, camera, ảnh bằng chứng hoặc dữ liệu ngoài sản phẩm để chứng minh người dùng đã làm một việc.

## 7. Thứ tự sản xuất mới

| Giai đoạn | Trọng tâm |
| --- | --- |
| P0 | Bản sắc hình ảnh: map, UI, nhân vật, camera, di chuyển và các khu sinh hoạt Việt Nam |
| P1 | **Sảnh đời sống:** lịch ngày/tuần/tháng, lịch lặp, icon hoạt động, note, đánh dấu đã làm và thống kê cơ bản |
| P2 | **Một luồng tự động hoàn chỉnh:** từ sảnh chọn “Đi câu” → server tạo phiên → avatar tự tới hồ → đóng game vẫn tiếp tục → lưu kết quả |
| P3 | **Tiếp quản trực tiếp:** mở game thấy đúng avatar đang câu → nhận quyền điều khiển → tự chơi → có thể trả lại chế độ tự động, không trùng thưởng |
| P4 | Mở rộng cùng hợp đồng sang chăm vườn, thiền, thu thập và các hoạt động đời sống khác |
| P5 | Bạn bè/chat, ghé thăm, lời nhắn, quyền xem trạng thái/hoạt động và các không gian xã hội |
| Sau đó | PvE mở rộng, cốt truyện dài, vùng đất mới, kinh tế nâng cao |

Ưu tiên chứng minh một vertical slice câu cá đầy đủ trước khi xây nhiều hoạt động tự động khác.

## 8. Ranh giới tầm nhìn và hiện trạng

Tài khoản, hồ sơ, túi đồ, cộng đồng và prototype chiến đấu là nền code đã có ở các mức khác nhau. Lịch–nhật ký đời sống, giao hoạt động từ sảnh, hoạt động offline do server quản lý, câu cá/làm vườn tự động và chuyển quyền điều khiển vẫn là mục tiêu cần triển khai và kiểm chứng.

Tài liệu này là quyết định sản phẩm; không được dùng để tuyên bố các tính năng trên đã chạy nếu chưa có test runtime tương ứng.
