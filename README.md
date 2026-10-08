# Tu Tiên

> Game pixel online dành cho Gen Z, đồng thời là một không gian số để học/làm việc và gặp gỡ bạn bè trong một Việt Nam hiện đại nơi linh khí vừa trở lại.

Tu Tiên có **hai không gian song song, dùng chung tài khoản, avatar, bạn bè và trạng thái**. Người dùng có thể vào phần nền tảng để sắp xếp việc trong ngày, học/làm cùng bạn và trò chuyện; khi muốn chơi, họ mở thế giới pixel để chăm nhà/vườn, khám phá và tu luyện. Mỗi không gian có ích ngay cả khi người dùng không mở phần còn lại.

## Thiết kế map — 08/10/2026

Map mới theo hướng **nền vẽ phân lớp + nước riêng + vật thể tương tác độc lập + dữ liệu va chạm/đi lại riêng**. Giữ phong cách pixel nhưng không bắt toàn bộ làng ghép từ tileset. Tile vẫn dùng được ở luống trồng, sàn hoặc chi tiết lặp. Cây, ghế, cửa và đồ vật có ID, action và state riêng; không bake vào một ảnh nền phẳng.

Quy chuẩn áp dụng trên cả `feat/map-ui-rebuild` và `feat/dual-experience-platform`, không merge chéo toàn bộ code. Xem [10 — Thiết kế map và lộ trình nghiệm thu](docs/game-design/10-layered-interactive-maps.md) và [hướng dẫn client](client/MAP_DESIGN.md).

**Đây là cập nhật thiết kế, chưa phải bản map/hiệu ứng mới đã chạy.** Ở mốc rebuild `d8565ca`, demo làng còn dựng từ dữ liệu tile và vật thể qua `village_demo.gd`/`village_sprite_object.gd`. Giữ tài nguyên hiện có để chuyển đổi từng phần; không xóa bản đang dùng trước khi scene phân lớp được kiểm tra.

## Hai không gian

- **Nền tảng sinh hoạt:** bảng việc trong ngày, lịch cá nhân, hẹn giờ tập trung, phòng học/làm việc chung và trò chuyện với bạn bè. Người chơi tự chọn chia sẻ hoạt động như “đang học”, “đang làm” hoặc “đang nghỉ”.
- **Thế giới game:** gặp bạn trong thị trấn, trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn và thay trang phục. Khi muốn phát triển sức mạnh, người chơi chọn ngồi thiền hoặc chủ động đi đánh quái PvE.
- **Kết nối giữa hai phần:** một tài khoản, hồ sơ, danh sách bạn và trạng thái hoạt động. Khi bấm “đang đi làm” trong app, thế giới game nhận lệnh để avatar tự đi từ vị trí hiện tại tới khu làm việc rồi bắt đầu hoạt động ở đó. Bạn không cần mở game; bạn bè có thể thấy hành trình và nhân vật đang làm việc theo quyền chia sẻ.

Định hướng hiện tại không có minigame. Hoàn thành việc đời thường có thể được ghi nhận bằng phản hồi nhẹ hoặc vật trang trí; không tạo áp lực phải khai việc thật để cạnh tranh sức mạnh.

## Tài liệu thiết kế

- [Tầm nhìn và vòng chơi](docs/game-design/01-vision-and-core-loop.md)
- [Hai không gian: nền tảng sinh hoạt và thế giới game](docs/game-design/09-dual-experience-platform.md)
- [Trạng thái sinh hoạt và hiện diện xã hội](docs/game-design/08-social-presence-and-lifestyle.md)
- [Map phân lớp và vật thể tương tác](docs/game-design/10-layered-interactive-maps.md)
- [Mục lục và thứ tự sản xuất](docs/game-design/README.md)
- [Bối cảnh Việt Nam hiện đại](docs/game-design/04-world-setting-vietnam-awakening.md)

## Trạng thái code hiện tại

Client trên nhánh này tập trung demo làng. Các nền tài khoản/hồ sơ, túi đồ, cộng đồng và prototype chiến đấu trực tuyến/PvE trong lịch sử dự án cần được đối chiếu khi tích hợp lại, không mặc định đã nằm trong scene làng hiện tại. Lịch/việc cần làm/phòng tập trung, trạng thái đồng bộ giữa hai không gian, trồng trọt/câu cá và vòng chơi sinh hoạt xã hội là **định hướng cần triển khai**, chưa được mô tả như tính năng đã hoàn thành.

## Chạy thử trên Windows

1. Cài **Godot 4.6.1 Standard**, **Docker Desktop** (Linux containers) và Node.js **22.14.0**.
2. Khởi động backend khi kiểm tra tính năng có dùng server:

   ```sh
   docker compose up --build -d
   ```

3. Mở `client/project.godot` trong Godot và chạy project. Đối chiếu scene khởi động của nhánh; cập nhật thiết kế này không thay scene hoặc tự bật luồng tích hợp platform.
4. Demo làng hiển thị hướng dẫn di chuyển/phóng to trên HUD. Các phím hồ sơ/túi/cộng đồng/đấu tập của client tích hợp trước đây không phải bằng chứng các màn hình đó đang có trong demo làng.

Kiểm tra server:

```sh
cd server
npm ci
npm test
node ../scripts/smoke.mjs
```

Dừng dịch vụ bằng `docker compose down`. PostgreSQL dùng named volume và giữ dữ liệu sau khi dừng. Không dùng `down -v` nếu muốn giữ dữ liệu.

## Công nghệ

- Client: Godot 4.6.1, GDScript.
- Backend: Nakama, TypeScript runtime và PostgreSQL.
- Thứ tự sản xuất: map/UI/nhân vật → nền tảng sinh hoạt và cộng đồng → vòng chơi đời sống → tu luyện/PvE; cốt truyện dài phát triển sau.
