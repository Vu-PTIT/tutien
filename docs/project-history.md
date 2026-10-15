# Lịch sử triển khai

## 12/10/2026 — Dựng làng mới, tách khỏi làng test

- Thêm `m_lang_que_moi.tscn`, runtime kế thừa trực tiếp Node2D và builder từ dữ liệu trống; không nhập layout/blockout/đình Linh Khê cũ.
- Dựng lại tám khu, 47 tuyến/ngõ, hồ spline, sông/mương, 806 props, 15 NPC và đình mới; giữ hai endpoint thế giới.
- F5 và lượt quay về qua cổng vào làng mới. Save làng mới có namespace/layout ID riêng.
- Godot 4.6.1 kiểm tra 75 điểm tương tác, navigation/physics, ba checkpoint và cả hai lượt đi–về. Bổ sung audit/CI/ảnh render; phạm vi hoạt động vẫn offline.

## Tài khoản và cộng đồng

- Tích hợp đăng nhập thiết bị và email qua Nakama.
- Thêm kết bạn, chặn, chat riêng/nhóm/thế giới và quản lý nhóm.
- Lưu hồ sơ người chơi trong PostgreSQL; thêm smoke test HTTP và WebSocket.

## Hồ sơ, túi đồ và phần thưởng

- Thêm inventory 24 ô, catalog vật phẩm, dữ liệu trang bị và migration.
- Quyền nhận phần thưởng và các giao dịch inventory được xử lý phía server.
- Bổ sung panel nhân vật, cài đặt ngôn ngữ, âm lượng và toàn màn hình.

## Chiến đấu trực tuyến

- Thêm đấu tập hai người với mô phỏng authoritative 20 Hz, reconnect và xử lý rời trận.
- Thêm encounter Lợn Gai với snapshot server, animation báo đòn và xử lý kết quả.
- CI chạy unit test server, smoke backend và kiểm tra scene/resource Godot.

## Lát cắt client hiện tại

Client Godot giữ đăng nhập, hồ sơ, túi đồ, cộng đồng và đấu trường trực tuyến. Các thao tác gameplay ngoài trận chưa được nối vào giao diện client hiện tại. Dùng [trạng thái triển khai](implementation-status.md), [luật đấu tập](combat-prototype.md) và [hợp đồng inventory/reward](inventory-and-rewards.md) để xem phạm vi đang hỗ trợ.

## 12/10/2026 — Backend hoạt động đời sống trên nhánh map UI

- Thêm API trồng cây/câu cá/đào khoáng, direct/autonomous, session timestamp, lease slot, command receipt, hủy/claim/refund và giữ thưởng khi túi đầy.
- Lưu hợp đồng backend geometry/slot lấy từ mốc làng mới và blockout vào `server/data/life_world.json` khi client/layout bị gỡ; giữ migration sáu luống và 25 item ID cũ, thêm catalog v3.
- Thêm unit tests và live Nakama smoke vào CI. Client runtime đang bị gỡ ở các commit trước; lần này chỉ dựng backend/hợp đồng map và điều chỉnh CI theo hiện trạng đó.
- Tài liệu thao tác: `docs/life-activities-backend.md`.
