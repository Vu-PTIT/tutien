# Quy chuẩn thiết kế map cho client

**Cập nhật:** 08/10/2026, phiên bản 2. Áp dụng trên `feat/map-ui-rebuild` và `feat/dual-experience-platform`.

Nguồn thiết kế chuẩn: [10 — Map phân lớp và vật thể tương tác](../docs/game-design/10-layered-interactive-maps.md), đặc biệt mục 1.1–1.3 về lựa chọn cách dựng và ngoại lệ tile. Hợp đồng hoạt động từ app: [09 — Hai không gian sản phẩm](../docs/game-design/09-dual-experience-platform.md).

## Nguyên tắc bắt buộc

**2D pixel top-down 3/4; mặc định không dùng TileSet/TileMapLayer cho map mới.** Không chuyển sang side-view hoặc tự đổi sang isometric hình thoi. Không coi luống trồng, sàn, hàng rào hay chi tiết lặp là nơi bắt buộc dùng tileset.

Chọn phương án không tile đơn giản nhất đáp ứng mỹ thuật, tương tác, khả năng chỉnh sửa và ngân sách thiết bị. Chỉ đề xuất ngoại lệ tile cục bộ khi phương án không tile phù hợp không đáp ứng một ràng buộc bắt buộc đã xác định. Phải ghi phương án đã xét, bằng chứng, phạm vi và lý do; đánh đổi chỉ về chi phí/thuận tiện cần được nêu rõ để chủ sản phẩm quyết định. Chưa có ngoại lệ mới được phê duyệt trong đợt tài liệu này.

**Atlas không đồng nghĩa TileMap.** Có thể lấy một prop nguyên vẹn từ sprite sheet/atlas và đặt bằng tọa độ tự do. Lưới logic quản lý trồng trọt/đặt đồ không ép lớp hình ảnh dùng tileset. Chunk là mảng tải của một bố cục chung, không phải ô mẫu lặp lại quyết định hình dáng làng.

## Khi sửa hoặc tạo map

- Chọn `scene_mode + layered_raster`, `tile_generation = none`: nền sạch, nước riêng, vật thể độc lập và dữ liệu gameplay riêng. Nước/địa hình phù hợp có thể dùng polygon/mesh phủ texture; không xây công cụ phức tạp nếu mảng vẽ đã đủ.
- Nền đất, đường và sân ưu tiên bố cục vẽ riêng; nhà/cây/ghế là scene/sprite độc lập; vườn là lưới dữ liệu + lớp đất đổi trạng thái + cây riêng. Mã tile/`gid` cũ chỉ là tham chiếu hình ảnh qua adapter, không phải ID gameplay.
- Không dùng ảnh toàn cảnh có cây/nhà/đồ tương tác dính sẵn làm runtime cuối. Không lấy PNG bounds làm collider mặc định; không suy navigation từ màu nền.
- Dùng cùng hệ tọa độ cho hình ảnh, collision, minimap, điểm tiếp cận và slot. Dữ liệu cũ phải có adapter anchor/offset rõ ràng. Mật độ pixel, tỷ lệ và góc vẽ phải thống nhất, không kéo giãn tile/sprite để bù phần thiếu.
- Object có ID ổn định, visual theo state, collider phần tiếp đất, action/điều kiện, điểm tiếp cận và chính sách che nhân vật. Tách phần mái/tán cần thiết, tránh vẽ trùng.
- Input PC/mobile đi qua cùng luồng action. Đặt vùng phát hiện, vật cản và điểm ngồi ở ba vai trò riêng; không dùng vùng tương tác thay collider.
- Hiệu ứng nước/gió/lá là lớp trình bày. Loot, sở hữu, slot dùng chung và hành động từ app cần state có xác nhận; không biến demo offline thành dữ liệu online.
- Không cho một tiến trình client đã đóng làm nguồn sự thật của đường đi/hoạt động. Server lưu hoạt động và mốc thời gian; client mở lại dựng từ snapshot.
- Giữ asset/scene đang dùng làm mốc cho tới khi bản thay thế được kiểm tra. Không chạy script tái sinh toàn map hoặc xóa tileset chỉ để áp dụng tài liệu này; việc giữ asset nguồn không phải ngoại lệ cho renderer mới.

## Đánh giá tối ưu

Không mặc định thay TileMap bằng một PNG khổng lồ, nhiều Sprite2D hoặc mesh sẽ nhanh hơn. Chia phạm vi tải, tái sử dụng texture/prop hợp lý, giới hạn vùng trong suốt bị vẽ chồng và cập nhật hiệu ứng theo phạm vi cần thiết. Không gom vật thể cần Y-sort/tương tác độc lập vào một khối chỉ để giảm draw calls.

Đo trên cùng camera, độ phức tạp cảnh, số avatar và thiết bị: thời gian frame CPU/GPU khi hỗ trợ, phân vị 95% thời gian frame, bộ nhớ texture, draw calls, tải/chuyển khu và công sức chỉnh sửa. Không suy bộ nhớ runtime từ dung lượng PNG; ẩn node không đồng nghĩa giải phóng texture. Bản không tile chưa đạt phải được tối ưu và đánh giá trước khi đề xuất ngoại lệ tile.

## Điểm chuyển đổi theo nhánh

Trên rebuild, `scripts/village_demo.gd` và `scripts/village_sprite_object.gd` là điểm xuất phát cần tách loader/render khỏi logic vật thể. Cảnh thử mới phải dựng không phụ thuộc TileMapLayer; scene tile hiện tại được giữ riêng để đối chiếu. Chưa coi chuyển đổi đã hoàn thành chỉ vì đã có props riêng.

Trên platform, `scripts/main.gd` có `MapWorldScene = null` ở mốc `31080e8`. Scene mới và liên kết activity phải được tích hợp/kiểm tra riêng; không khôi phục toàn bộ map cũ bằng cách merge chéo cả nhánh.

## Bằng chứng trước khi báo hoàn tất

Một góc làng top-down 3/4 không dựng bằng TileMapLayer phải đi được, có thao tác đổi state, hình/va chạm đúng, nhân vật đọc được, preview và minimap cùng dữ liệu. Mọi ngoại lệ tile về sau có bản giải trình theo mục 1.3 của tài liệu 10. Test online kiểm tra quyền, lệnh lặp, tranh slot và reconnect. Đo hiệu năng trên thiết bị mục tiêu, không gọi phương án mới là tối ưu hơn khi chưa có số liệu.

Đợt cập nhật hiện tại chỉ chốt **thiết kế và quy chuẩn**. Không có loader mới, asset mới, hiệu ứng mới, RPC mới hay kết quả chạy Godot được tạo bởi tài liệu này.

## Runtime M1 — cập nhật 09/10/2026

Mốc triển khai đầu tiên nằm ở `res://scenes/layered_village_m1.tscn`, khác với scene Tiled được lưu thành `legacy_linh_khe.tscn`. Bộ sinh hình học tự do, shader pixel theo tọa độ thế giới, vật thể sprite có anchor/collider riêng, nước có polygon collision và minimap dùng chung hình học. Đây **mới là bản thử M1**, chưa phải bản chuyển đổi toàn bộ làng hay nghiệm thu trên thiết bị. Xem `client/M1_LAYERED_IMPLEMENTATION.md` để biết giới hạn và cách test.
