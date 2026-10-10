# Sảnh Tu Tiên

Ứng dụng React/TypeScript trên `feat/dual-experience-platform`. Game Godot vẫn ở `client/` và nhánh `feat/map-ui-rebuild`.

Ảnh giao diện đã chạy: [PC](../docs/platform-previews/desktop.png) · [Mobile](../docs/platform-previews/mobile.png).

## Chạy

Cần Node.js >=22.14.0.

```sh
cd platform
npm ci
npm run dev -- --host 127.0.0.1
```

Mở địa chỉ Vite in ra. Test trên điện thoại cùng mạng: dùng `npm run dev -- --host 0.0.0.0` trên máy của bạn và mở IP LAN của máy. Cài PWA/service worker cần HTTPS hoặc localhost; IP LAN HTTP thường không đủ.

```sh
npm test
npm run build
npm run preview -- --host 127.0.0.1
npx playwright install chromium
npm run test:e2e
```

HashRouter cho phép đặt app ở thư mục con của static host mà không cần rewrite route. `dist/` là đầu ra build, không commit. Khi deploy, phục vụ toàn bộ thư mục, không chỉ index.html.

## Bốn môi trường

| Môi trường          | Hiện có                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| PC web              | Thanh bên, lịch ngày/tuần/tháng, tóm tắt sinh hoạt và danh sách bạn bè            |
| Mobile web (<768px) | Thanh dưới, lịch danh sách theo ngày, bộ chọn ngày, chi tiết dạng bảng trượt |
| PC app              | Cùng app được cài dạng PWA, chạy cửa sổ riêng; giao diện PC                  |
| Mobile app          | PWA trên màn hình chính, safe area và thanh dưới; giao diện mobile           |

768–1230px dùng bố cục PC gọn: tóm tắt sinh hoạt/bạn bè xuống dưới lịch. Đây chưa phải bản native Android/iOS/Windows. PWA không cần tải Godot để xem lịch. App và web cùng origin dùng chung localStorage; khác origin hoặc thiết bị chưa đồng bộ. Sau khi cài và cache thành công, shell và dữ liệu mẫu sử dụng được offline; mạng không đồng nghĩa với đã kết nối backend.

## Ngôn ngữ

Việt/Anh dùng i18next + react-i18next, lưu lựa chọn trên thiết bị. Ngày/giờ, lịch, nút, thông báo, biểu mẫu và nhãn trợ năng cùng đổi ngôn ngữ. Dữ liệu người dùng tự nhập và tên riêng giữ nguyên. Font Be Vietnam Pro hỗ trợ tiếng Việt, kèm OFL. Ngày mẫu và kế hoạch local hiện dùng múi giờ thiết bị. Hợp đồng server sau này phải lưu timestamp UTC cùng IANA timezone cho lịch người dùng.

Thêm ngôn ngữ: thêm file JSON, khai báo resources/selector và mở rộng kiểm tra khóa + biến nội suy. Nhãn cài đặt PWA có thể giữ metadata từ thời điểm cài; đổi ngôn ngữ giao diện không bảo đảm hệ điều hành đổi tên app.

## Phạm vi bản đầu

- Lịch của mình và lịch chia sẻ của bạn bè; xem lịch một người từ thẻ bạn bè.
- Thêm kế hoạch/ghi nhận, ghi chú, quyền riêng tư mặc định riêng; bắt đầu, hoàn thành, dừng hoặc xóa hoạt động của mình.
- Đổi trạng thái ngoài đời tự khai báo; nhân vật đại diện hồ sơ hiển thị icon trạng thái.
- Tóm tắt các mục lịch hôm nay: số mục, số đã ghi nhận và phút ghi nhận; không đo hoạt động thực tế.
- Gửi động viên/lời mời trong bản mẫu, có thông báo rõ chưa gửi tới người thật.
- Nhật ký, cài đặt, chọn ngôn ngữ, trạng thái mạng, cài/cập nhật PWA.
- Dùng lại sprite `client/assets/pixel/cultivator.png` làm hình đại diện tĩnh; không dựng map hoặc mô phỏng hoạt động game.

Chưa có đăng nhập sảnh, API lịch, dữ liệu bạn bè thật, bot chạy offline, tiến trình hoạt động, phần thưởng hoặc thông báo đẩy. Không tự cấp thưởng và không điều khiển nhân vật bạn bè. Kết nối activity game ở giai đoạn sau, tách khỏi mục lịch đời thật. Bộ lọc riêng tư client chỉ phục vụ bản mẫu; server phải thực thi quyền khi kết nối thật.

## Công nghệ

React, TypeScript, Vite, React Router, Tailwind v4, Button theo cấu trúc shadcn/ui (CVA/Slot), Radix Dialog, Motion, FullCalendar standard, i18next và vite-plugin-pwa. `package-lock.json` khóa phiên bản. Backend hiện có Nakama/TypeScript ES5 không dùng chung tsconfig frontend.

## Bước nối server

Xem `../docs/platform-lobby.md`. Thay adapter local bằng RPC có xác thực, dùng cùng tài khoản Nakama với Godot. Lịch, trạng thái đời thật và activity avatar phải là ba lớp dữ liệu riêng. Quyền, idempotency, thời hạn và settlement do server xử lý. Online presence không thay cho phiên activity được lưu bền vững.
