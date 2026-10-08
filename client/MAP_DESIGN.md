# Quy chuẩn thiết kế map cho client

**Cập nhật:** 08/10/2026. Áp dụng trên `feat/map-ui-rebuild` và `feat/dual-experience-platform`.

Nguồn thiết kế chuẩn: [10 — Map phân lớp và vật thể tương tác](../docs/game-design/10-layered-interactive-maps.md). Hợp đồng hoạt động từ app: [09 — Hai không gian sản phẩm](../docs/game-design/09-dual-experience-platform.md).

## Khi sửa hoặc tạo map

- Chọn `scene_mode + layered_raster`: nền sạch, nước riêng, vật thể độc lập và dữ liệu gameplay riêng. Giữ chất pixel của sản phẩm; không bắt mọi phần quay về tileset.
- TileMap/atlas còn dùng được ở luống trồng, sàn và chi tiết lặp. Mã tile/`gid` là tham chiếu hình ảnh, không phải ID của vật thể có trạng thái.
- Không dùng ảnh toàn cảnh có cây/nhà/đồ tương tác dính sẵn làm runtime cuối. Không lấy PNG bounds làm collider mặc định; không suy navigation từ màu nền.
- Dùng cùng hệ tọa độ cho hình ảnh, collision, minimap, điểm tiếp cận và slot. Dữ liệu cũ phải có adapter anchor/offset rõ ràng.
- Object có ID ổn định, visual theo state, collider phần tiếp đất, action/điều kiện, điểm tiếp cận và chính sách che nhân vật. Tách phần mái/tán cần thiết, tránh vẽ trùng.
- Input PC/mobile đi qua cùng luồng action. Đặt vùng phát hiện, vật cản và điểm ngồi ở ba vai trò riêng; không dùng vùng tương tác thay collider.
- Hiệu ứng nước/gió/lá là lớp trình bày. Loot, sở hữu, slot dùng chung và hành động từ app cần state có xác nhận; không biến demo offline thành dữ liệu online.
- Không cho một tiến trình client đã đóng làm nguồn sự thật của đường đi/hoạt động. Server lưu hoạt động và mốc thời gian; client mở lại dựng từ snapshot.
- Giữ asset/scene đang dùng làm mốc cho tới khi bản thay thế được kiểm tra. Không chạy script tái sinh toàn map hoặc xóa tileset chỉ để áp dụng tài liệu này.

## Điểm chuyển đổi theo nhánh

Trên rebuild, `scripts/village_demo.gd` và `scripts/village_sprite_object.gd` là điểm xuất phát cần tách loader/render khỏi logic vật thể. Chưa coi chuyển đổi đã hoàn thành chỉ vì đã có props riêng.

Trên platform, `scripts/main.gd` đang có `MapWorldScene = null` ở mốc `31080e8`. Scene mới và liên kết activity phải được tích hợp/kiểm tra riêng; không khôi phục toàn bộ map cũ bằng cách merge chéo cả nhánh.

## Bằng chứng trước khi báo hoàn tất

Một góc làng phải đi được, có thao tác đổi state, hình/va chạm đúng, nhân vật đọc được, preview và minimap cùng dữ liệu. Test online kiểm tra quyền, lệnh lặp, tranh slot và reconnect. Đo hiệu năng trên thiết bị mục tiêu; không suy từ dung lượng PNG.

Đợt cập nhật hiện tại chỉ chốt **thiết kế và quy chuẩn**. Không có loader mới, asset mới, hiệu ứng mới, RPC mới hay kết quả chạy Godot được tạo bởi tài liệu này.
