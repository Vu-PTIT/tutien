# Lịch sử triển khai

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
- Thêm encounter Sơn Trư với snapshot server, animation báo đòn và xử lý kết quả.
- CI chạy unit test server, smoke backend và kiểm tra scene/resource Godot.

## Lát cắt client hiện tại

Client Godot giữ đăng nhập, hồ sơ, túi đồ, cộng đồng và đấu trường trực tuyến. Các thao tác gameplay ngoài trận chưa được nối vào giao diện client hiện tại. Dùng [trạng thái triển khai](implementation-status.md), [luật đấu tập](combat-prototype.md) và [hợp đồng inventory/reward](inventory-and-rewards.md) để xem phạm vi đang hỗ trợ.
