# Trạng thái triển khai — 12/10/2026

## Backend

- Tài khoản, phiên, bạn bè/chat/nhóm và hồ sơ/túi đồ dùng Nakama + PostgreSQL.
- Prototype đấu tập/PvE và quyền nhận thưởng giữ nền hiện có.
- Trồng cây: 12 luống, ba loại cây, hạt/nước, giờ sinh trưởng server, thu hoạch và migration từ save sáu luống.
- Câu cá/đào khoáng: dụng cụ, mồi câu, lượt có thời lượng, direct/autonomous, tuyến qua cổng mở, session lưu bền, đổi mode tại slot, hủy, nhận thưởng/refund.
- Lease slot server, version và receipt giao dịch ngăn lệnh đồng thời/nhận trùng; túi đầy giữ kết quả chờ.
- **Nội Giới (13/10/2026):** sức mạnh không theo cấp. Linh thú biết Hấp Linh bẩm sinh, Người học từ Bé Mơ hoặc bạn khế ước linh thú; Hấp Linh ở 6 điểm, hoạt động đời sống và hạ quái làm Nội Giới lớn lên; hình thái, chỉ số, bước nhảy Hạt → Quần đảo, xếp lại thửa. Xem [inner-world-backend.md](inner-world-backend.md).
- Manifest vị trí dùng geometry làng mới và các blockout; mỏ ngầm mới hỗ trợ B1, các cổng khóa vẫn khóa.

## Client

Các commit mới nhất đã gỡ scripts, scene map và asset runtime. `main.tscn` hiện là Node2D trống. Layout map cũng bị gỡ ở `b9c0009`; còn font và localization. Hợp đồng hoạt động/geometry được lưu riêng trong `server/data/life_world.json`. Chưa có giao diện gọi các API hoạt động mới trong Godot hoặc sảnh. `activity_control` đổi mode tại điểm hoạt động; đi tự do cần hủy/nhận trước.

## Kiểm tra

- Unit/transaction/time/reconnect: `npm test` trong `server/`.
- Manifest: `node scripts/build-life-world.cjs --check`.
- Live backend: `node scripts/life-smoke.mjs` sau khi bật Docker; đã gắn CI.
- Godot smoke tạm bỏ qua khi runtime không có trong checkout; tự chạy lại khi runtime làng được khôi phục.

Môi trường chỉnh sửa không có Docker/Godot, nên kết quả local không thay thế nghiệm thu live/mobile. Progress offline dùng timestamp đã lưu; settlement vào túi vẫn qua claim, chưa có worker hoặc push trạng thái cho người đứng xem.

Chi tiết payload, timer, vị trí, lưu dữ liệu và giới hạn: [life-activities-backend.md](life-activities-backend.md).
