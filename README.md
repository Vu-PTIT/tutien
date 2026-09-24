# Tu Tiên

Base game 2D: Godot + GDScript, Nakama + TypeScript, PostgreSQL.

**Backend tương tác người chơi:** đăng ký email, đăng nhập email/tên + mật khẩu,
refresh/logout, kết bạn/chặn, chat thế giới/riêng/nhóm, tạo và quản lý tông môn/bang
phái. Có phân quyền, giới hạn gửi và lưu dữ liệu PostgreSQL.
Xem [hướng dẫn API và kết nối Godot](docs/social-backend.md).

## Chạy nhanh trên Windows

1. Cài **Godot 4.6.1 Standard**, **Docker Desktop** (Linux containers). Node.js **22.14.0** chỉ cần khi sửa/test server ngoài Docker.
2. Clone repo và khởi động backend:

```sh
git clone https://github.com/Vu-PTIT/tutien.git
cd tutien
docker compose up --build -d
```

3. Import `client/project.godot` trong Godot, nhấn **F6/F5** chạy scene/project.
4. Di chuyển bằng **WASD / phím mũi tên**. Mở **Đấu tập → Kết nối**, tạo hoặc vào phòng đấu tập, cả hai bấm **Sẵn sàng**. **Q/J/chuột trái** đánh, **Space** né theo hướng chuột. Backend chưa bật thì vẫn di chuyển offline trong sân An Khê được.
   Xem [cách mở hai tài khoản/cửa sổ và luật đấu tập](docs/combat-prototype.md).
5. Ngoài trận, bấm **Túi [I]**; **Esc** đóng. Chưa kết nối chỉ hiển thị mẫu có nhãn, không lưu và không nhận thưởng. Sau kết nối mới xem tài sản và nhận vật tư khởi đầu một lần. Xem [hợp đồng inventory/reward](docs/inventory-and-rewards.md).
6. Kiểm tra backend: `docker compose ps`, `docker compose logs nakama`. Sau khi backend healthy: `node scripts/smoke.mjs`.

```sh
cd server
npm ci
npm test
```

Dừng backend bằng `docker compose down`. Dữ liệu PostgreSQL nằm trong named volume, vẫn còn sau khi dừng. Không dùng `down -v` nếu muốn giữ dữ liệu.

## Cấu trúc

- `client/`: scene làng/HUD/túi chỉnh được trong editor, atlas nhân vật/icon, đăng nhập, đấu tập, snapshot và HP.
- `client/scripts/combat_api.gd`: adapter trận đấu dùng chung kết nối với `SocialApi`.
- `server/src/combat.ts`: mô phỏng authoritative 20 Hz, hai người, đánh thường/né và vòng đời trận.
- `server/`: runtime TypeScript ES5, hồ sơ và backend tài khoản/bạn bè/chat/nhóm, kiểm thử phân quyền và ghi đồng thời.
- `client/scripts/social_api.gd`: lớp HTTP/WebSocket cho các màn hình tương tác sau này.
- `docs/social-backend.md`: API, mô hình dữ liệu, quy tắc và giới hạn phiên bản.
- `compose.yaml`: build runtime, migration, Nakama và PostgreSQL.
- `scripts/smoke.mjs`: kiểm tra tích hợp tài khoản và lưu/đọc hồ sơ.
- `scripts/social-smoke.mjs`: kiểm thử nhiều tài khoản, chat WebSocket và quyền nhóm trên backend thật.
- `.github/workflows/ci.yml`: build, unit test và smoke test Docker.

## Phạm vi bản base

Giao diện được thiết kế lại với nền làng, atlas pixel, theme xanh đen/đồng,
HUD và túi dùng chung scene editor/runtime. Nền làng là ảnh minh họa, chưa
phải TileMap hoàn chỉnh. Xem [thiết kế và kiểm chứng](docs/ui-product-slice.md)
và [bố cục tĩnh](docs/ui-previews/README.md). Lần viết lại UI này chưa được
xác nhận chạy qua Godot/CI; không dùng kết quả commit cũ thay thế.

Đã có khung offline, backend xã hội và **prototype đấu tập hai người do server xử lý**: di chuyển, vật cản, đánh thường, né, HP, kết thúc và reconnect ngắn. Đấu tập không tác động tài sản/hồ sơ. Đã có inventory 24 ô, catalog vật phẩm, migration hồ sơ và gói khởi đầu chống nhận trùng. **Chưa có quái, dùng/trang bị vật phẩm, trồng trọt, giao dịch, PvP mở, đồ họa hoàn chỉnh hoặc bản xuất Android/Windows.**

Xem [tiến độ và thứ tự triển khai](docs/implementation-status.md), [hợp đồng combat và kiểm thử](docs/combat-prototype.md), [thiết kế sản phẩm](docs/game-design/README.md). Bước kế tiếp sau nghiệm thu tài sản: encounter PvE Sơn Trư và cấp loot qua giao dịch đã kiểm chứng, rồi vòng chơi tài nguyên.
Xem [nhật ký phát triển và lịch sử Git](docs/project-history.md) để biết các mốc đã commit, trạng thái sản phẩm và thứ tự làm tiếp theo.

## Môi trường phát triển

Cấu hình Compose chỉ dành cho localhost: khóa `local-dev-key` và mật khẩu `localdb` là giá trị mẫu công khai. Chưa có triển khai Internet. Khi vận hành cần cấu hình bí mật riêng, TLS, sao lưu và kiểm thử phục hồi. Không commit token hay `.env`.

Thiết bị được nhận dạng bằng ID ngẫu nhiên lưu tại `user://identity.cfg`; xóa file sẽ tạo tài khoản mới. Đây là đăng nhập thử, chưa có khôi phục tài khoản. Phiên chỉ giữ trong RAM; bấm Connect để đăng nhập lại.

Runtime dùng definitions chính thức `nakama-common` v1.44.2 (đúng bản Nakama 3.37.0),
lưu trong `server/vendor` kèm giấy phép. Không dùng API Node.js trong runtime Nakama.

## Tài liệu chính thức

- https://docs.godotengine.org/en/4.6/
- https://heroiclabs.com/docs/nakama/getting-started/install/docker/
- https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/
