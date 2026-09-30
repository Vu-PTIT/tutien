# Tu Tiên

Game 2D dùng Godot/GDScript, Nakama/TypeScript và PostgreSQL.

Client hiện tập trung vào đăng nhập, hồ sơ nhân vật, túi đồ, cộng đồng và đấu tập trực tuyến. Backend hỗ trợ đăng ký email, xác thực thiết bị, kết bạn/chặn, chat thế giới/riêng/nhóm và quản lý tông môn. Xem [hướng dẫn API](docs/social-backend.md).

## Chạy nhanh

1. Cài Godot 4.6.1 Standard, Docker Desktop và Node.js 22.14.0.
2. Khởi chạy dịch vụ:

   ```sh
   docker compose up --build -d
   ```

3. Mở `client/project.godot` trong Godot và chạy project. Dùng `--no-auto-connect` để mở client offline khi kiểm tra giao diện.
4. Trong client, **WASD / phím mũi tên** di chuyển trong trận; chuột định hướng, **Q/J** đánh và **Space** né. **C** mở hồ sơ, **I** mở túi đồ, **G** mở cộng đồng. Nút **Online** mở phần kết nối và đấu tập.

Để kiểm tra server:

```sh
cd server
npm ci
npm test
node ../scripts/smoke.mjs
```

Dừng dịch vụ bằng `docker compose down`. PostgreSQL dùng named volume và giữ dữ liệu sau khi dừng. Không dùng `down -v` nếu muốn giữ dữ liệu.

## Cấu trúc

- `client/`: Godot client, đăng nhập, hồ sơ, túi đồ, cộng đồng và giao diện đấu tập.
- `client/scripts/combat_api.gd`: adapter trận đấu dùng chung kết nối với `SocialApi`.
- `server/`: runtime TypeScript, hồ sơ và backend tài khoản/bạn bè/chat/nhóm, cùng kiểm thử phân quyền và ghi đồng thời.
- `server/src/combat.ts`: mô phỏng đấu tập authoritative 20 Hz.
- `server/src/pve_son_tru.ts`: encounter Sơn Trư authoritative 20 Hz.
- `docs/social-backend.md`: API, mô hình dữ liệu và giới hạn phiên bản.
- `docs/combat-prototype.md`: luật trận đấu và cách kiểm thử.
- `.github/workflows/ci.yml`: unit test, kiểm tra resource Godot và smoke test.

## Giới hạn hiện tại

Client có giao diện pixel, theme dùng chung, hồ sơ, túi đồ, đăng nhập, cộng đồng và phòng đấu tập. Dữ liệu offline chỉ là bản xem thử. Tiến trình và phần thưởng cần kết nối backend; bản mobile và đồ họa toàn game chưa được nghiệm thu.

Compose chỉ dành cho localhost và dùng thông tin mẫu công khai. Chưa có triển khai Internet. Khi vận hành cần cấu hình bí mật riêng, TLS, sao lưu và kiểm thử phục hồi. Không commit token hoặc `.env`.

Thiết bị thử nghiệm được nhận dạng bằng ID ngẫu nhiên trong `user://identity.cfg`; xóa file sẽ tạo danh tính mới. Đây là đăng nhập thử, chưa có khôi phục tài khoản.

Runtime dùng definitions `nakama-common` v1.44.2, tương ứng Nakama 3.37.0, trong `server/vendor` kèm giấy phép. Runtime Nakama không dùng API Node.js.
