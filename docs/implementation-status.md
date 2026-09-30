# Trạng thái triển khai

Tài liệu này mô tả lát cắt đang có trong client và backend tại nhánh hiện tại.

## Godot client

- Có đăng nhập và xác thực thiết bị, hồ sơ nhân vật, túi đồ, giao diện cộng đồng và kết nối trận đấu.
- Đấu tập gửi ý định đầu vào tới server; client vẽ nhân vật và trạng thái trận đã nhận.
- Giao diện offline là bản xem thử, không lưu tiến trình.
- Cài đặt hỗ trợ ngôn ngữ, âm lượng, toàn màn hình và bố cục cảm ứng.

## Backend

- Tài khoản, phiên, bạn bè/chặn, chat riêng/nhóm/thế giới và quản lý nhóm được lưu phía server.
- Hồ sơ, inventory, vật phẩm và quyền nhận thưởng được xác thực phía server.
- Đấu tập và encounter Sơn Trư chạy bằng mô phỏng authoritative; client không tự quyết định kết quả trận.

## Kiểm tra

- Unit test server: `npm test` trong `server/`.
- Godot kiểm tra resource và localization: `node scripts/check-pixel-scenes.cjs`, `node scripts/check-localization.cjs` và `node scripts/check-png-integrity.cjs`.
- Godot smoke: `client/tests/presentation_smoke.gd`, `client/tests/localization_smoke.gd`, `client/tests/social_smoke.gd`, `client/tests/inventory_smoke.gd` và `client/tests/combat_smoke.gd`.
- CI cài Godot 4.6.1, import project, chạy smoke và lưu ảnh bố cục desktop/cảm ứng.

## Chưa nghiệm thu

- Xuất bản mobile và kiểm tra trên thiết bị thật.
- Đồ họa toàn game, điều hướng nhiều màn hình và cân bằng dài hạn.
- Khôi phục tài khoản và vận hành backend trên môi trường Internet.
