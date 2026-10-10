# Sảnh: giao diện thiết bị, ngôn ngữ và lịch xã hội

## Quyết định triển khai

`platform/` là frontend React + TypeScript + Vite. Sảnh là nền tảng cuộc sống ngoài đời: lịch học/làm/nghỉ, kế hoạch, nhật ký, thống kê và lịch bạn bè. Nhân vật chỉ là đại diện hồ sơ với trạng thái đời thật tự khai báo; không dựng cảnh game ở sảnh. Việt–Anh được làm ngay trong bản đầu. Web và app PWA dùng một frontend với shell thích ứng, không tạo bốn bản sao mã nguồn.

| Surface | Điều hướng | Lịch | Chi tiết hoạt động |
|---|---|---|---|
| PC web | Thanh bên | Ngày/tuần/tháng | Dialog giữa màn hình |
| Mobile web | Thanh dưới + cài đặt trên đầu | Danh sách ngày + chọn ngày | Bảng trượt dưới |
| PC PWA | Như PC, cửa sổ app riêng | Như PC | Dialog |
| Mobile PWA | Safe area trên/dưới, shell app | Như mobile | Bảng trượt dưới |

Mốc chuyển mobile 768px. 768–1230px gộp rail tóm tắt sinh hoạt/bạn bè xuống dưới. Ngôn ngữ là một trục độc lập với thiết bị/surface. Màn Hôm nay, Lịch, Nhật ký, Bạn bè và Cài đặt đều có nhãn Việt–Anh. Native app cần một giai đoạn đóng gói và kiểm thử riêng, chưa triển khai.

## Luồng lịch xã hội

1. Chọn lịch của mình hoặc cùng bạn bè.
2. Từ danh sách bạn bè, xem lịch đã chia sẻ của một người.
3. Bấm hoạt động để xem kế hoạch/trạng thái đời thật và ghi chú được phép xem.
4. Gửi động viên hoặc lời mời. Trong bản đầu đây chỉ là phản hồi mẫu trên thiết bị; chưa gửi server.
5. Lời mời cùng hoạt động ngoài đời phải qua server và người nhận chấp thuận. Nó không phải lệnh tham gia game và không thay đổi avatar.

`planned`, `active`, `completed`, `cancelled` là state của mục lịch. Bắt đầu một mục lịch chỉ đổi state của mục đó, không tự bật activity game hoặc cấp thưởng. Trạng thái đời thật do người dùng tự chọn. Thẻ Linh “Đi học” chỉ thể hiện trạng thái đời thật do Linh chọn, không phải hành động game.

## Hợp đồng backend tiếp theo (đề xuất, chưa tồn tại)

- Calendar list/create/update/delete qua RPC có xác thực; owner, thời gian UTC, IANA timezone, visibility, trạng thái và ghi chú.
- Shared calendar query chỉ trả các mục người xem được phép thấy; chặn bạn bè có hiệu lực ngay trên server.
- Real-life status có thời hạn và audience riêng.
- Avatar snapshot dùng hợp đồng `activity_session` ở `game-design/09-dual-experience-platform.md`; vị trí/slot/control mode/state lấy từ server.
- Encouragement và invite dùng command ID, rate limit, audience và trạng thái accepted/declined/expired. Lời mời không tự động đánh dấu việc đời thật hoàn thành.
- Nakama websocket có thể báo thay đổi; reconnect phải lấy snapshot. Presence chỉ biểu thị kết nối, không phải dữ liệu activity bền vững.

## Tiêu chí nghiệm thu giao diện

- 320, 390, 768, 1024, 1440px: không tràn ngang; điều hướng đúng bố cục.
- Lịch chia sẻ không lộ mục private trong dữ liệu mẫu; server phải có kiểm thử quyền riêng.
- Thêm/đổi trạng thái mục lịch của mình, xem nhật ký, reload giữ dữ liệu local.
- Việt/Anh có đủ khóa + interpolation; input tự nhập không bị dịch; lịch và ngày/giờ đổi locale.
- Dialog hỗ trợ keyboard/focus/escape; mobile dùng cùng dialog accessible ở vị trí bottom sheet.
- PWA manifest/icons/service worker được build; kiểm thử offline/install ở production HTTPS, Android/iOS/PC riêng.
- Bản mẫu có thông báo rõ: dữ liệu local, bạn bè minh họa, chưa kết nối server, chưa có thưởng thật.

## Kiểm chứng mốc này

Build TypeScript/Vite/PWA và unit tests là bắt buộc. Bộ Playwright có các ca PC/mobile cho đổi ngôn ngữ, lưu kế hoạch/nhật ký, tương tác mẫu và kiểm tra tràn ngang. Cần browser có thể chạy trong môi trường; không coi browser test chưa khởi động được là đã đạt. PWA thực tế trên iPhone/Android chưa nghiệm thu chỉ bằng manifest build.

## Kết quả kiểm tra tại mốc bàn giao

- Build TypeScript/Vite/PWA đạt.
- 12 kiểm thử trình duyệt đạt trên hai cấu hình PC/mobile (Chromium).
- 6 unit test đạt: quyền lọc mẫu, ownership, thời gian, dữ liệu lưu lỗi và bản dịch.
- Các luồng trình duyệt PC/mobile đã kiểm tra: đổi ngôn ngữ, tương tác bạn bè mẫu, thêm/hoàn thành/khôi phục nhật ký, bố cục 320–1440px, nhận diện standalone và tải lại/ghi kế hoạch ngoại tuyến.
- Chưa kiểm thử cài đặt trên thiết bị iPhone/Android thật; chưa kết nối backend sảnh hoặc nhận thưởng thật.

## Sửa ranh giới sản phẩm — 10/10/2026

Đối chiếu tài liệu 01, 08 và 09: **platform = cuộc sống người dùng; game = cuộc sống nhân vật; backend = cầu nối**. Tài liệu 08 ngày 05/10 còn đề xuất ánh xạ học/làm vào vị trí game; tài liệu 01/09 cập nhật 09/10 xác định trạng thái đời thật và activity game độc lập. Không dùng mô tả cũ để tự ánh xạ hoặc giả lập game trong sảnh.

- Gỡ cảnh sông/nhà/vườn và nút câu cá/chăm vườn; không có map minh họa hoặc mô phỏng hoạt động trong platform.
- Nhân vật trong thẻ hồ sơ là hình đại diện tĩnh kèm icon trạng thái học/làm/nghỉ. Đổi trạng thái không giả vờ có animation tương ứng.
- Lịch và nhật ký chỉ chứa `real_life_entry`; chi tiết lịch không chèn `avatar_activity`.
- Tóm tắt ngày đếm mục lịch, mục đã ghi nhận và phút của các mục đã ghi nhận bắt đầu hôm nay theo múi giờ thiết bị. Không đo hoặc xác minh hành vi thực tế, không tính phần thưởng game.
- Bạn bè có trạng thái mẫu tự khai báo và lịch đã chia sẻ; động viên/lời mời dành cho hoạt động ngoài đời.
- Game bridge là phần tùy chọn riêng, được nêu trong Cài đặt. UI gửi activity command và chuyển sang game thuộc giai đoạn tiếp theo; không dựng runtime game trong sảnh.
- Sảnh dùng độc lập; chưa có tài khoản xã hội thật, chat, lịch lặp hoặc đồng bộ backend. Các mục này vẫn là kế hoạch sản phẩm.

Kiểm tra bổ sung PC/mobile: thẻ đại diện thể hiện trạng thái học, mở lịch Linh đúng; sảnh và chi tiết lịch không có cảnh map hoặc nút câu cá. Bộ kiểm tra hiện có 12 ca trình duyệt và 6 unit test.
