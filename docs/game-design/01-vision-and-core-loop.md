# 01 — Tầm nhìn sản phẩm và vòng chơi

**Cập nhật:** 09/10/2026 cho `feat/dual-experience-platform`.  
**Vai trò nhánh:** **SẢNH / PLATFORM** — lịch, kế hoạch, nhật ký, thống kê, hồ sơ xã hội và điều khiển activity.  
**Nhánh game tương ứng:** `feat/map-ui-rebuild` — map, UI trong game, nhân vật, animation và thực thi activity trong thế giới.

## 1. Lời hứa với người dùng

Tu Tiên kết hợp một **nền tảng đời sống cá nhân** với một **thế giới game pixel xã hội**.

Trên nhánh platform, trọng tâm là giao diện sảnh: người dùng lên lịch học/làm, ghi lại việc đã làm bằng icon/note, xem thống kê nhẹ, kết nối bạn bè và giao một hoạt động cho nhân vật khi đang bận ngoài đời.

Thế giới game được phát triển ở `feat/map-ui-rebuild`. Platform không tự dựng map hay mô phỏng animation; nó gửi activity command và đọc trạng thái/kết quả do backend đồng bộ.

## 2. Ba lớp dữ liệu

| Lớp | Ví dụ | Chủ sở hữu chính |
| --- | --- | --- |
| `real_life_entry` | Học 8–11h, đi làm, đi cà phê | Platform |
| `real_life_status` | Đang học, đang làm, đang nghỉ | Platform/social |
| `avatar_activity` | Đi câu, chăm vườn, thiền | Hợp đồng chung; platform tạo lệnh, game thực thi/hiển thị |

Người dùng có thể đang học ngoài đời trong khi avatar đang câu cá. Không tự ánh xạ “đang học” → “avatar phải vào thư viện”.

## 3. Vòng trải nghiệm của platform

**Lên kế hoạch → thực hiện ngoài đời → ghi nhận/note → xem lại lịch/thống kê → tùy chọn giao activity cho avatar.**

Platform cần:
- lịch ngày/tuần/tháng;
- lịch lặp;
- trạng thái planned/done/skipped/cancelled;
- icon hoạt động và note;
- thống kê nhẹ;
- thẻ avatar hiển thị activity hiện tại;
- gửi lệnh bắt đầu/dừng/đổi activity;
- nút chuyển sang thế giới game.

## 4. Giao activity cho nhân vật

Ví dụ:
1. Người dùng có lịch “Học 08:00–11:00”.
2. Trong thẻ nhân vật chọn “Đi câu tại hồ An Khê 2 giờ”.
3. Platform gửi `activity_command` lên backend.
4. Backend xác nhận phiên.
5. Nhánh game `feat/map-ui-rebuild` chịu trách nhiệm cho avatar đi đến slot câu và hiển thị đúng animation/trạng thái.
6. Platform chỉ hiển thị tiến trình, kết quả và cho phép dừng/đổi activity.

Platform không tính thưởng bằng logic client và không giả lập đường đi của avatar.

## 5. Phần thưởng

Hoạt động đời thật không tự sinh tài sản game.

Kết quả câu cá/làm vườn/thiền thuộc `avatar_activity` và phải do server settlement idempotent. Platform có thể hiển thị kết quả, nhưng không được tự cộng vật phẩm.

## 6. Thứ tự sản xuất của nhánh platform

| Giai đoạn | Trọng tâm |
| --- | --- |
| PLAT-P0 | Khung sảnh, điều hướng và hồ sơ |
| PLAT-P1 | Lịch ngày/tuần/tháng, lịch lặp, icon, note |
| PLAT-P2 | Nhật ký đã làm + thống kê cơ bản |
| PLAT-P3 | Thẻ avatar + gửi lệnh “Đi câu” |
| PLAT-P4 | Theo dõi activity session, dừng/đổi hoạt động, hiển thị kết quả |
| PLAT-P5 | Bạn bè, chat, quyền chia sẻ trạng thái/hoạt động |
| Sau đó | Focus room, tích hợp lịch nâng cao và activity khác |

## 7. Ranh giới nhánh

**Được làm ở platform**
- lịch, note, icon, thống kê;
- social/profile/chat;
- activity command UI;
- xem trạng thái/kết quả activity;
- quyền riêng tư và cài đặt.

**Không làm ở platform**
- dựng map;
- collision/navigation;
- slot câu/vườn trong scene;
- animation câu cá/trồng cây;
- camera/game HUD;
- logic điều khiển nhân vật trực tiếp.

Các phần đó thuộc `feat/map-ui-rebuild`.

## 8. Hiện trạng

Đây là quyết định phạm vi nhánh. Tài liệu không có nghĩa lịch, activity offline hay câu cá tự động đã chạy. Mỗi tính năng phải có runtime test riêng trước khi đánh dấu hoàn thành.
