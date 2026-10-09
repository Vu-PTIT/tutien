# 09 — Nền tảng đời sống và thế giới game

**Cập nhật:** 09/10/2026.  
**Trạng thái:** định hướng sản phẩm; chưa phải mô tả code hiện có.

## Mục tiêu

Tu Tiên có hai trải nghiệm song song:

1. **Nền tảng đời sống:** lịch, kế hoạch, nhật ký, ghi chú, biểu tượng hoạt động, thống kê nhẹ và kết nối bạn bè.
2. **Thế giới game:** một thị trấn pixel Việt Nam hiện đại pha kỳ ảo, nơi cùng một nhân vật có thể được người dùng trực tiếp điều khiển hoặc tự sinh hoạt khi chủ nhân bận.

Hai phần dùng chung tài khoản, nhân vật, hồ sơ, bạn bè, chat, tài sản và các phiên hoạt động game. Người dùng không cần mở game để giao một hoạt động cho nhân vật, nhưng khi muốn chơi có thể vào thế giới và tiếp quản chính nhân vật đó.

## A. Sảnh / nền tảng đời sống

Sảnh không phải menu game đơn thuần. Nó là một trang đời sống cá nhân có giá trị độc lập.

### 1. Lịch và kế hoạch

- Xem theo ngày, tuần và tháng.
- Tạo lịch học, lịch làm, cuộc hẹn hoặc việc cá nhân.
- Hỗ trợ lịch lặp theo thứ và khoảng ngày áp dụng.
- Phân biệt rõ `planned`, `done`, `skipped`, `cancelled`; thời gian trôi qua không tự biến việc thành `done`.
- Có thể nhập thời lượng hoặc chỉ ghi nhận một hoạt động không có giờ.

### 2. Nhật ký và icon hoạt động

Người dùng có thể:
- ghi một việc vừa làm mà trước đó không có trong lịch;
- gắn icon như học, đi làm, đi cà phê, tập thể dục, đọc sách hoặc hoạt động tùy chỉnh;
- thêm note ngắn và dữ liệu tùy chọn;
- nhìn vào lịch tháng để biết mỗi ngày đã ghi nhận những gì.

Ngày không ghi nhận gì được phép để trống; không coi đó là thất bại hoặc mất streak.

### 3. Thống kê

Thống kê phản ánh dữ liệu người dùng đã nhập hoặc xác nhận:
- số lần ghi nhận theo nhóm hoạt động;
- số kế hoạch đã đánh dấu hoàn thành;
- tổng thời lượng nếu người dùng có nhập hoặc dùng bộ đếm;
- xu hướng theo tuần/tháng.

Không dùng thống kê để chấm điểm giá trị người dùng hoặc tạo lợi thế chiến đấu.

### 4. Quản lý nhân vật ngay trong sảnh

Sảnh có một thẻ nhân vật gọn:
- hoạt động game hiện tại;
- địa điểm;
- trạng thái `travelling / active / completed`;
- kết quả tạm thời hoặc đã settlement;
- nút dừng/đổi hoạt động;
- nút vào thế giới game.

Ví dụ: người dùng đang học ngoài đời nhưng trong thẻ nhân vật chọn **Đi câu tại hồ An Khê trong 2 giờ**.

## B. Tách đời thật khỏi hoạt động nhân vật

Ba lớp dữ liệu không được gộp:

| Lớp | Ví dụ | Tác dụng |
| --- | --- | --- |
| `real_life_entry` | Học 8–11h, đi cà phê, tập thể dục | Lịch/nhật ký |
| `real_life_status` | Đang học, đang làm, đang nghỉ | Hiện diện xã hội |
| `avatar_activity` | Câu cá, chăm vườn, thiền | Tiến trình trong game |

Người dùng có thể:
- đang học ngoài đời;
- đặt trạng thái “Đang học” cho bạn bè thấy;
- đồng thời giao avatar đi câu cá.

Không dùng `real_life_status` làm nguồn sự thật cho hoạt động game.

## C. Thế giới game

Game là thế giới pixel top-down 3/4, Việt Nam hiện đại hồi phục linh khí.

Các khu sinh hoạt như hồ câu, vườn, quán nước, thư viện, nhà ở và điểm thiền phải dùng được bởi:
- người chơi đang điều khiển trực tiếp;
- avatar đang chạy hoạt động tự động;
- bạn bè tới xem, ngồi cạnh hoặc tương tác xã hội.

Câu cá, làm vườn và các hoạt động đời sống không nên buộc người dùng phải online lâu. Khi rảnh, họ vẫn có thể tự chơi trực tiếp để tận hưởng thế giới, chọn vị trí, thay đổi kế hoạch và giao lưu.

PvE và tu luyện là nhánh chơi tự chọn; không phải yêu cầu để sử dụng nền tảng đời sống.

## D. Một hoạt động, hai chế độ

Mỗi hoạt động hỗ trợ cùng một state machine và cùng luật phần thưởng cho hai chế độ:

### Direct control
Người dùng tự điều khiển avatar, tự đi đến địa điểm và thực hiện hoạt động.

### Autonomous control
Người dùng giao hoạt động từ sảnh hoặc trong game. Server:
1. kiểm tra điều kiện;
2. tạo `activity_session`;
3. chọn địa điểm/slot hợp lệ;
4. quản lý trạng thái di chuyển và hoạt động;
5. settlement kết quả;
6. lưu snapshot để người khác thấy trạng thái nhất quán.

Đóng client không dừng phiên đã được server chấp nhận.

## E. Tiếp quản nhân vật

Khi mở game trong lúc avatar đang tự hoạt động:

- game dựng đúng **một** avatar từ snapshot;
- người dùng có thể chỉ xem hoặc bấm **Tự điều khiển**;
- server chuyển quyền từ autonomous → direct;
- tiến trình và kết quả đã hoàn tất được giữ nguyên;
- không tạo avatar trùng;
- không settlement lại cùng một kết quả.

Khi người dùng muốn rời game, có thể giao lại hoạt động tự động nếu hoạt động hỗ trợ.

## F. Phần thưởng

Phần thưởng game xuất phát từ `avatar_activity`, không phải từ việc người dùng tự khai đã học/làm.

Ví dụ phiên câu cá có thể lưu:
- `session_id`;
- thời gian bắt đầu/kết thúc;
- địa điểm và slot;
- dụng cụ/điều kiện;
- các lần kết quả đã settlement;
- phần thưởng còn chờ hiển thị;
- trạng thái điều khiển direct/autonomous.

Khi người dùng vào game, màn hình có thể tóm tắt “nhân vật đã làm gì”, nhưng việc mở màn hình không phải điều kiện để server ghi nhận thành quả.

## G. Trải nghiệm mẫu

1. Người dùng mở sảnh sáng thứ Hai và thấy lịch học 08:00–11:00.
2. Họ bắt đầu buổi học hoặc chỉ để lịch ở trạng thái planned.
3. Trong thẻ nhân vật, họ chọn **Đi câu tại hồ An Khê trong 2 giờ**.
4. Server tạo phiên; avatar tự đi tới hồ và bắt đầu câu. Người dùng đóng ứng dụng.
5. Một người bạn đang ở trong thế giới game có thể thấy avatar đang câu với nhãn cho biết chủ nhân không trực tiếp điều khiển.
6. Sau giờ học, người dùng đánh dấu buổi học là done và ghi note nếu muốn.
7. Họ mở game; avatar vẫn ở hồ. Có thể xem kết quả hoặc tiếp quản để tự câu tiếp.
8. Khi rời game, có thể giao avatar tiếp tục tự động.

## H. Hợp đồng kỹ thuật cấp sản phẩm

`activity_session` tối thiểu cần:
- `session_id`, `user_id`, `avatar_id`;
- `activity_type`;
- `map_id`, `activity_slot_id`;
- `control_mode`: `autonomous | direct`;
- `state`: `queued | travelling | active | completed | cancelled | expired`;
- `started_at`, `expected_end_at`, `completed_at`;
- `state_version` để chống ghi cũ;
- dữ liệu settlement và idempotency để chống nhận trùng.

Lệnh mới cần `command_id`; server xử lý lệnh lặp, lệnh cũ, slot hết chỗ, reconnect và takeover.

Map khai báo điểm tiếp cận, vị trí hoạt động, hướng, animation và quyền dùng slot; không lấy các thông tin này từ tâm sprite hoặc mã tile.

## I. Lát cắt thử nghiệm ưu tiên

Vertical slice đầu tiên phải chạy end-to-end:

1. Sảnh có lịch ngày/tuần/tháng.
2. Tạo một mục lịch học và đánh dấu done sau đó.
3. Có icon/note cho nhật ký.
4. Từ sảnh chọn **Đi câu**.
5. Avatar tự tới một hồ có slot hoạt động.
6. Đóng game mà phiên vẫn tiến triển.
7. Mở game thấy đúng avatar và trạng thái.
8. Tiếp quản trực tiếp.
9. Trả lại autonomous.
10. Kết quả chỉ settlement một lần.
11. Người khác thấy avatar theo đúng quyền chia sẻ.

Sau khi lát cắt này ổn định mới nhân rộng sang chăm vườn, thiền, thu thập và các hoạt động khác.

## J. Nguyên tắc trải nghiệm

- Nền tảng đời sống phải hữu ích nếu không chơi game.
- Game phải vui nếu người dùng không dùng lịch.
- Không ép duy trì streak.
- Không phạt vì vài ngày không mở sản phẩm.
- Không yêu cầu treo máy thật.
- Không lấy năng suất ngoài đời để quyết định lực chiến.
- Không tự thu thập GPS, camera hoặc dữ liệu đời thật để “chứng minh” hoạt động.
- Hoạt động tự động giúp người bận tiếp tục có mặt trong thế giới, không thay thế hoàn toàn phần chơi trực tiếp.

## K. Hiện trạng

Đây là hướng sản phẩm đã chốt ngày 09/10/2026. Lịch/nhật ký, activity session offline, câu cá/làm vườn tự động và takeover chưa được coi là đã triển khai chỉ vì tài liệu này tồn tại. Mỗi mốc phải có runtime test và bằng chứng riêng trước khi đổi trạng thái implementation.
