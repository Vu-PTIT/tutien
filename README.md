# Tu Tiên

Base game 2D: Godot + GDScript, Nakama + TypeScript, PostgreSQL.

**Backend tương tác người chơi:** đăng ký email, đăng nhập email/tên + mật khẩu,
refresh/logout, kết bạn/chặn, chat thế giới/riêng/nhóm, tạo và quản lý tông môn/bang
phái. Có phân quyền, giới hạn gửi và lưu dữ liệu PostgreSQL.
Xem [hướng dẫn API và kết nối Godot](docs/social-backend.md).

## Chạy nhanh trên Windows

1. Cài **Godot 4.4.1 Standard**, **Docker Desktop** (Linux containers). Node.js **22.14.0** chỉ cần khi sửa/test server ngoài Docker.
2. Clone repo và khởi động backend:

```sh
git clone https://github.com/Vu-PTIT/tutien.git
cd tutien
docker compose up --build -d
```

3. Import `client/project.godot` trong Godot, nhấn **F6/F5** chạy scene/project.
4. Di chuyển bằng **WASD / phím mũi tên**. Nhấn **Connect local backend** để đăng nhập thiết bị và tạo/đọc hồ sơ từ server. Backend chưa bật thì vẫn di chuyển offline được.
5. Kiểm tra backend: `docker compose ps`, `docker compose logs nakama`. Sau khi backend healthy: `node scripts/smoke.mjs`.

```sh
cd server
npm ci
npm test
```

Dừng backend bằng `docker compose down`. Dữ liệu PostgreSQL nằm trong named volume, vẫn còn sau khi dừng. Không dùng `down -v` nếu muốn giữ dữ liệu.

## Cấu trúc

- `client/`: scene Godot, nhân vật hình tạm, di chuyển, đăng nhập HTTP và đọc hồ sơ.
- `server/`: runtime TypeScript ES5, hồ sơ và backend tài khoản/bạn bè/chat/nhóm, kiểm thử phân quyền và ghi đồng thời.
- `client/scripts/social_api.gd`: lớp HTTP/WebSocket cho các màn hình tương tác sau này.
- `docs/social-backend.md`: API, mô hình dữ liệu, quy tắc và giới hạn phiên bản.
- `compose.yaml`: build runtime, migration, Nakama và PostgreSQL.
- `scripts/smoke.mjs`: kiểm tra tích hợp tài khoản và lưu/đọc hồ sơ.
- `scripts/social-smoke.mjs`: kiểm thử nhiều tài khoản, chat WebSocket và quyền nhóm trên backend thật.
- `.github/workflows/ci.yml`: build, unit test và smoke test Docker.

## Phạm vi bản base

Đã có khung chạy offline và kết nối backend local. **Chưa có đồng bộ nhiều người, PvP, quái, trồng trọt, giao dịch, đồ họa hoàn chỉnh hoặc bản xuất Android/Windows.** Di chuyển hiện ở client và không lưu; hồ sơ do server tạo, client không được ghi trực tiếp. API không nhận tiền/cấp độ từ client.

Bước tiếp theo: authoritative match hai người, kiểm tra tốc độ di chuyển, một kỹ năng do server tính sát thương; sau đó mới làm tài sản và vòng chơi.

## Môi trường phát triển

Cấu hình Compose chỉ dành cho localhost: khóa `local-dev-key` và mật khẩu `localdb` là giá trị mẫu công khai. Chưa có triển khai Internet. Khi vận hành cần cấu hình bí mật riêng, TLS, sao lưu và kiểm thử phục hồi. Không commit token hay `.env`.

Thiết bị được nhận dạng bằng ID ngẫu nhiên lưu tại `user://identity.cfg`; xóa file sẽ tạo tài khoản mới. Đây là đăng nhập thử, chưa có khôi phục tài khoản. Phiên chỉ giữ trong RAM; bấm Connect để đăng nhập lại.

Runtime dùng definitions chính thức `nakama-common` v1.44.2 (đúng bản Nakama 3.37.0),
lưu trong `server/vendor` kèm giấy phép. Không dùng API Node.js trong runtime Nakama.

## Tài liệu chính thức

- https://docs.godotengine.org/en/4.4/
- https://heroiclabs.com/docs/nakama/getting-started/install/docker/
- https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/
