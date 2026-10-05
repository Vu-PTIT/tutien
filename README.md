# Tu Tiên

> Game pixel online dành cho Gen Z, đồng thời là một không gian số để học/làm việc và gặp gỡ bạn bè trong một Việt Nam hiện đại nơi linh khí vừa trở lại.

Tu Tiên có **hai không gian song song, dùng chung tài khoản, avatar, bạn bè và trạng thái**. Người dùng có thể vào phần nền tảng để sắp xếp việc trong ngày, học/làm cùng bạn và trò chuyện; khi muốn chơi, họ mở thế giới pixel để chăm nhà/vườn, khám phá và tu luyện. Mỗi không gian có ích ngay cả khi người dùng không mở phần còn lại.

## Hai không gian

- **Nền tảng sinh hoạt:** bảng việc trong ngày, lịch cá nhân, hẹn giờ tập trung, phòng học/làm việc chung và trò chuyện với bạn bè. Người chơi tự chọn chia sẻ hoạt động như “đang học”, “đang làm” hoặc “đang nghỉ”.
- **Thế giới game:** gặp bạn trong thị trấn, trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn và thay trang phục. Khi muốn phát triển sức mạnh, người chơi chọn ngồi thiền hoặc chủ động đi đánh quái PvE.
- **Kết nối giữa hai phần:** một tài khoản, hồ sơ, danh sách bạn và trạng thái hoạt động. Khi bấm “đang đi làm” trong app, thế giới game nhận lệnh để avatar tự đi từ vị trí hiện tại tới khu làm việc rồi bắt đầu hoạt động ở đó. Bạn không cần mở game; bạn bè có thể thấy hành trình và nhân vật đang làm việc.

Định hướng hiện tại không có minigame. Hoàn thành việc đời thường có thể được ghi nhận bằng phản hồi nhẹ hoặc vật trang trí; không tạo áp lực phải khai việc thật để cạnh tranh sức mạnh.

## Tài liệu thiết kế

- [Tầm nhìn và vòng chơi](docs/game-design/01-vision-and-core-loop.md)
- [Hai không gian: nền tảng sinh hoạt và thế giới game](docs/game-design/09-dual-experience-platform.md)
- [Trạng thái sinh hoạt và hiện diện xã hội](docs/game-design/08-social-presence-and-lifestyle.md)
- [Mục lục và thứ tự sản xuất](docs/game-design/README.md)
- [Bối cảnh Việt Nam hiện đại](docs/game-design/04-world-setting-vietnam-awakening.md)

## Trạng thái code hiện tại

Nhánh này đang có nền client Godot, tài khoản/hồ sơ, túi đồ, kết nối cộng đồng và prototype chiến đấu trực tuyến/PvE. Lịch/việc cần làm/phòng tập trung, trạng thái đồng bộ giữa hai không gian, trồng trọt/câu cá và vòng chơi sinh hoạt xã hội là **định hướng cần triển khai**, chưa được mô tả như tính năng đã hoàn thành.

## Chạy thử trên Windows

1. Cài **Godot 4.6.1 Standard**, **Docker Desktop** (Linux containers) và Node.js **22.14.0**.
2. Khởi động backend:

   ```sh
   docker compose up --build -d
   ```

3. Mở `client/project.godot` trong Godot và chạy project. Dùng `--no-auto-connect` để mở client offline khi kiểm tra giao diện.
4. Trong client, **WASD / phím mũi tên** di chuyển trong trận; chuột định hướng, **Q/J** đánh và **Space** né. **C** mở hồ sơ, **I** mở túi đồ, **G** mở cộng đồng. Nút **Online** mở phần kết nối và đấu tập.

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
