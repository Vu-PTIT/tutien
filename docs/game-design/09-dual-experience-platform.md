# 09 — Hợp đồng giữa sảnh và thế giới game

**Cập nhật:** 09/10/2026.  
**Nhánh này:** `feat/dual-experience-platform` = sảnh/platform.  
**Nhánh game:** `feat/map-ui-rebuild` = thế giới game/map/UI/nhân vật.

## 1. Phân vai

Platform chịu trách nhiệm:
- lịch, kế hoạch, nhật ký, icon, note, thống kê;
- hồ sơ, bạn bè, chat, trạng thái đời thật;
- chọn activity cho avatar;
- hiển thị tiến trình và kết quả activity;
- quyền riêng tư.

Game chịu trách nhiệm:
- map, navigation, collision;
- avatar, animation, slot hoạt động;
- tương tác trực tiếp;
- takeover direct/autonomous;
- biểu diễn activity trong thế giới.

Backend/hợp đồng chung chịu trách nhiệm:
- `activity_session`;
- idempotency;
- settlement;
- snapshot;
- ownership/control mode;
- đồng bộ giữa hai nhánh.

## 2. Lớp dữ liệu

Không gộp:
- `real_life_entry`
- `real_life_status`
- `avatar_activity`

Ví dụ hợp lệ: người dùng đang học, avatar đang câu cá.

## 3. Activity contract

Platform gửi:
- `command_id`
- `activity_type`
- tùy chọn địa điểm/thời lượng nếu hợp lệ
- yêu cầu start/stop/change

Server trả:
- `session_id`
- `state`
- `control_mode`
- `map_id`
- `activity_slot_id`
- mốc thời gian
- snapshot tiến trình
- settlement/result summary

Platform không tự suy diễn vị trí slot hay animation từ UI.

## 4. State machine

`queued → travelling → active → completed/cancelled/expired`

`control_mode`:
- `autonomous`
- `direct`

Khi người dùng vào game và takeover, server chuyển mode sang `direct`. Khi người dùng giao lại auto, mode trở về `autonomous` nếu activity hỗ trợ.

## 5. Vertical slice đầu tiên

1. Tạo mục lịch học ở sảnh.
2. Ghi note/icon.
3. Chọn “Đi câu”.
4. Platform tạo activity command.
5. Game branch hiển thị avatar đi đến hồ và câu.
6. Đóng game vẫn còn activity.
7. Platform thấy tiến trình.
8. Mở game takeover.
9. Trả lại auto.
10. Settlement đúng một lần.

## 6. Không được làm sai ranh giới

- Platform không dựng map hoặc giả lập nhân vật.
- Game không trở thành nơi quản lý lịch đời thật.
- Trạng thái đời thật không tự kích hoạt activity game.
- Activity game không tự đánh dấu việc ngoài đời là hoàn thành.
- Client platform không tự cộng phần thưởng.

## 7. Hiện trạng

Đây là đặc tả phối hợp giữa hai nhánh, không phải bằng chứng implementation đã hoàn tất.
