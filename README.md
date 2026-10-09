# Tu Tiên

## Thiết kế map — 08/10/2026

Map mới theo hướng **nền vẽ phân lớp + nước riêng + vật thể tương tác độc lập + dữ liệu va chạm/đi lại riêng**. Giữ phong cách pixel nhưng không bắt toàn bộ làng ghép từ tileset. Tile vẫn dùng được ở luống trồng, sàn hoặc chi tiết lặp. Cây, ghế, cửa và đồ vật có ID, action và state riêng; không bake vào một ảnh nền phẳng.

Quy chuẩn áp dụng trên cả `feat/dual-experience-platform` và `feat/map-ui-rebuild`, không merge chéo toàn bộ code. Xem [10 — Thiết kế map và lộ trình nghiệm thu](docs/game-design/10-layered-interactive-maps.md) và [hướng dẫn client](client/MAP_DESIGN.md).

**Đây là cập nhật thiết kế, chưa phải bản map/hiệu ứng mới đã chạy.** Ở mốc platform `31080e8`, `client/scripts/main.gd` còn khai báo `MapWorldScene = null`. Những mô tả map bốn vùng của bản base cũ bên dưới là lịch sử/tham chiếu, không phải hiện trạng map đã nghiệm thu trên nhánh này. Scene mới, tương tác có lưu và liên thông activity cần được tích hợp và kiểm tra riêng.

## Vai trò nhánh — 09/10/2026

`feat/dual-experience-platform` là **nhánh SẢNH / PLATFORM**. Trọng tâm của nhánh là lịch, kế hoạch, nhật ký, icon hoạt động, thống kê, hồ sơ xã hội và giao activity cho avatar. Map, camera, collision, animation và gameplay trực tiếp thuộc `feat/map-ui-rebuild`.

Backend/hợp đồng `activity_session` là phần giao nhau giữa hai nhánh: platform phát lệnh và hiển thị trạng thái/kết quả; game nhận snapshot và thể hiện avatar trong thế giới.

## Hướng sản phẩm — 09/10/2026

Tu Tiên đang được định hướng cho người trẻ, đặc biệt là Gen Z, thành hai trải nghiệm song song:

- **Sảnh/platform:** lịch ngày/tuần/tháng, kế hoạch, nhật ký bằng icon/note, thống kê nhẹ, hồ sơ, bạn bè/chat và thẻ avatar để giao hoạt động.
- **Thế giới game pixel:** giao lưu kiểu game Avatar Việt Nam thời trước, kết hợp trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn kiểu Stardew Valley; người chơi có thể ngồi thiền tăng sức mạnh hoặc chủ động đánh quái PvE theo cảm hứng Ngọc Rồng Online. Không có minigame.

Hai phần dùng chung tài khoản, avatar, bạn bè, chat và activity session. Trạng thái đời thật và hoạt động avatar là hai lớp riêng. Ví dụ người dùng có thể đang học ngoài đời nhưng từ sảnh giao avatar **đi câu**; game branch sẽ thể hiện avatar tự đi tới hồ và hoạt động ngay cả khi game client đóng. Địa điểm và chỗ hoạt động theo ID/slot, do server kiểm tra quyền, đường đi và sức chứa; bạn bè xem theo phạm vi chia sẻ.

Đây là định hướng sản phẩm trên nhánh thử nghiệm; lịch/focus và việc nhân vật tự đi, tự làm khi offline chưa được triển khai. Xem [01 — Tầm nhìn](docs/game-design/01-vision-and-core-loop.md), [08 — Hiện diện xã hội](docs/game-design/08-social-presence-and-lifestyle.md) và [09 — Hai không gian sản phẩm](docs/game-design/09-dual-experience-platform.md).

## Nền kỹ thuật hiện tại

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

3. Import `client/project.godot` trong Godot, nhấn **F6/F5** chạy scene/project. Chạy với `--touch-preview` hoặc nhấn **F9** trong bản PC để thử bố cục cảm ứng màn hình ngang; trên thiết bị mobile, bố cục này tự bật.
4. Bàn phím/chuột và cảm ứng dùng lớp input chung. Luồng khám phá bốn map, tương tác **E**, tuyến map **M** và farm quái trên Trúc Âm của bản base cũ phải được kiểm tra lại sau khi nối map mới; không coi chúng đã khả dụng chỉ từ hướng dẫn lịch sử. Đấu tập/PvE có tài liệu riêng: [luật đấu tập](docs/combat-prototype.md).
5. **Nhân vật [C]** mở hồ sơ, cảnh giới, chỉ số, trang bị, kỹ năng và cài đặt thiết bị. **Mở Túi đồ để trang bị** chọn/tháo Kiếm hoặc Áo; **Túi [I]** mở kho, **Esc** đóng cửa sổ. Chế độ offline chỉ hiển thị dữ liệu mẫu, không lưu hoặc nhận thưởng. Sau khi kết nối, tài sản được đồng bộ và vật tư khởi đầu chỉ nhận một lần. Xem [hợp đồng inventory/reward](docs/inventory-and-rewards.md).
6. Kiểm tra backend: `docker compose ps`, `docker compose logs nakama`. Sau khi backend healthy: `node scripts/smoke.mjs`.

```sh
cd server
npm ci
npm test
```

Dừng backend bằng `docker compose down`. Dữ liệu PostgreSQL nằm trong named volume, vẫn còn sau khi dừng. Không dùng `down -v` nếu muốn giữ dữ liệu.

## Cấu trúc

- `client/`: HUD/túi, atlas nhân vật/icon, đăng nhập và các luồng prototype; phần map đang chờ tích hợp theo thiết kế phân lớp.
- `client/MAP_DESIGN.md`: quy chuẩn dựng map, dữ liệu vật thể và điểm chuyển đổi theo nhánh.
- `client/scripts/combat_api.gd`: adapter sparring/PvE dùng chung kết nối với `SocialApi`.
- `server/src/combat.ts`: mô phỏng authoritative 20 Hz, hai người, đánh thường/né và vòng đời trận.
- `server/src/pve_son_tru.ts`: AI và va chạm Sơn Trư authoritative 20 Hz; encounter P1 không cấp XP/loot.
- `server/`: runtime TypeScript ES5, hồ sơ và backend tài khoản/bạn bè/chat/nhóm, kiểm thử phân quyền và ghi đồng thời.
- `client/scripts/social_api.gd`: lớp HTTP/WebSocket cho các màn hình tương tác sau này.
- `docs/social-backend.md`: API, mô hình dữ liệu, quy tắc và giới hạn phiên bản.
- `compose.yaml`: build runtime, migration, Nakama và PostgreSQL.
- `scripts/smoke.mjs`: kiểm tra tích hợp tài khoản và lưu/đọc hồ sơ.
- `scripts/social-smoke.mjs`: kiểm thử nhiều tài khoản, chat WebSocket và quyền nhóm trên backend thật.
- `.github/workflows/ci.yml`: build, unit test và smoke test Docker.

## Bản base cũ — tham chiếu lịch sử

Phần này giữ lại lịch sử prototype, không xác nhận khả năng chạy map ở nhánh platform hiện tại. Quy chuẩn cho mọi map mới là tài liệu 10 ở đầu README.

Bản base trước đây dùng atlas địa hình 32 px và vật thể 128 px cho bốn map; PNG world làm ảnh ý tưởng ở panel tuyến, minimap đọc layout thật. An Khê có thử nghiệm vật thể cao mờ đi khi che người chơi, sprite cây anh đào tách nền và va chạm gốc cây, vùng cản ngăn tương tác xuyên tường. Những quy ước kích thước/atlas này không còn là yêu cầu bắt buộc cho map mới. Xem [thiết kế và kiểm chứng cũ](docs/ui-product-slice.md) và [trạng thái triển khai](docs/implementation-status.md); đối chiếu code nhánh trước khi dùng lại nội dung map.

Bản base có khung offline, backend xã hội và **prototype đấu tập hai người do server xử lý**. P1 thêm encounter Sơn Trư một người chơi: báo hướng 0,75 giây, lao 4 tile, hồi 0,8 giây, né/phản công, chết/reset và reconnect ngắn. Encounter P1 chỉ thử combat; **chưa cấp XP, linh thạch hay vật phẩm**. Inventory 24 ô, catalog, migration và gói khởi đầu là nền kỹ thuật. Mobile export và đồ họa toàn game chưa nghiệm thu.

Lịch sử P2 qua CI trên PR #8 và P3 trên `feat/p3-world-quests` không thay thế nghiệm thu nhánh hiện hành. Xem [hợp đồng combat và kiểm thử](docs/combat-prototype.md), [thiết kế sản phẩm](docs/game-design/README.md) và [nhật ký phát triển và lịch sử Git](docs/project-history.md).

## Môi trường phát triển

Cấu hình Compose chỉ dành cho localhost: khóa `local-dev-key` và mật khẩu `localdb` là giá trị mẫu công khai. Chưa có triển khai Internet. Khi vận hành cần cấu hình bí mật riêng, TLS, sao lưu và kiểm thử phục hồi. Không commit token hay `.env`.

Thiết bị được nhận dạng bằng ID ngẫu nhiên lưu tại `user://identity.cfg`; xóa file sẽ tạo tài khoản mới. Đây là đăng nhập thử, chưa có khôi phục tài khoản. Phiên chỉ giữ trong RAM; bấm Connect để đăng nhập lại.

Runtime dùng definitions chính thức `nakama-common` v1.44.2 (đúng bản Nakama 3.37.0),
lưu trong `server/vendor` kèm giấy phép. Không dùng API Node.js trong runtime Nakama.

## Tài liệu chính thức

- https://docs.godotengine.org/en/4.6/
- https://heroiclabs.com/docs/nakama/getting-started/install/docker/
- https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/
