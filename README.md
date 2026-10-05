# Tu Tiên

> Game pixel online dành cho Gen Z: một nơi để gặp bạn bè, chăm khu vườn của mình và cho mọi người biết hôm nay mình đang làm gì — trong một Việt Nam hiện đại nơi linh khí vừa trở lại.

Tu Tiên kết hợp nhịp sống thư giãn của một game mô phỏng đời sống với không gian giao lưu kiểu game avatar Việt Nam ngày trước. Người chơi có thể vào game để trò chuyện, thăm nhà, trồng trọt, câu cá, thu thập và chế tạo; khi muốn thử sức mạnh thì chọn ngồi thiền hoặc ra ngoài đánh quái. Chiến đấu là lựa chọn, không phải điều kiện để tận hưởng thế giới.

## Hướng sản phẩm

- **Hiện diện cùng bạn bè:** tự chọn trạng thái như “đang đi học”, “đang làm việc”, “đang nghỉ” hoặc “đang tu luyện”. Bạn bè thấy trạng thái và hình ảnh nhân vật đang học, làm việc, nghỉ ngơi hay ngồi thiền. Trạng thái do người chơi chủ động đặt; game không theo dõi hoạt động ngoài đời.
- **Sinh hoạt nhẹ nhàng:** trồng trọt, câu cá, thu thập nguyên liệu, chế tạo và chăm sóc nhà/vườn.
- **Không gian cộng đồng:** gặp nhau trong làng, trò chuyện, kết bạn, thăm nhà, thay trang phục và biểu cảm. Định hướng không có minigame.
- **Tu luyện tùy chọn:** ngồi thiền để phát triển sức mạnh hoặc chủ động đi đánh quái để kiếm kinh nghiệm, nguyên liệu và trang bị. PvE là hướng chiến đấu chính; PvP không phải vòng chơi cốt lõi.
- **Bối cảnh Việt Nam hiện đại pha kỳ ảo:** đời sống và cộng đồng là trung tâm; bí ẩn linh khí, tu luyện và vùng quái mở rộng dần khi người chơi muốn khám phá.

Trạng thái học/làm/nghỉ là cách người chơi giao tiếp với bạn bè, không phải hệ thống chấm công hay một cách nhận thưởng. Ngồi thiền là hoạt động tiến triển sức mạnh trong game. Hai loại hành động này được tách riêng.

## Tài liệu thiết kế

- [Tầm nhìn và vòng chơi](docs/game-design/01-vision-and-core-loop.md)
- [Trạng thái sinh hoạt và hiện diện xã hội](docs/game-design/08-social-presence-and-lifestyle.md)
- [Mục lục và thứ tự sản xuất](docs/game-design/README.md)
- [Bối cảnh Việt Nam hiện đại](docs/game-design/04-world-setting-vietnam-awakening.md)

## Trạng thái code hiện tại

Nhánh này đang có nền client Godot, tài khoản/hồ sơ, túi đồ, kết nối cộng đồng và prototype chiến đấu trực tuyến/PvE. Trạng thái “đang học/đang làm”, hiện diện khi rời game, trồng trọt, câu cá và vòng chơi sinh hoạt xã hội là **định hướng cần triển khai**, chưa được README này khẳng định là đã hoàn thành.

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
- Hướng hiện tại: ưu tiên bản đồ, giao diện, nhân vật và trải nghiệm xã hội; nội dung cốt truyện dài được phát triển sau.
