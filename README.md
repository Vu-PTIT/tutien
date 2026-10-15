# Tu Tiên

> Game pixel online dành cho Gen Z, đồng thời là một không gian số để học/làm việc và gặp gỡ bạn bè, đặt trong một lục địa fantasy cổ nơi linh năng có từ thuở khai thiên: Người sống ở dải ven biển, Tinh Linh sống ở vùng giao thoa trong đất liền.

Tu Tiên có **hai không gian song song, dùng chung tài khoản, avatar, bạn bè và trạng thái**. Người dùng có thể vào phần nền tảng để sắp xếp việc trong ngày, học/làm cùng bạn và trò chuyện; khi muốn chơi, họ mở thế giới pixel để chăm nhà/vườn, khám phá và tu luyện. Mỗi không gian có ích ngay cả khi người dùng không mở phần còn lại.

## Cách dựng map

Map theo hướng **nền vẽ phân lớp + nước riêng + vật thể tương tác độc lập + dữ liệu va chạm/đi lại riêng**. Giữ phong cách pixel nhưng không bắt toàn bộ map ghép từ tileset. Tile vẫn dùng được ở luống trồng, sàn hoặc chi tiết lặp. Cây, ghế, cửa và đồ vật có ID, action và state riêng; không bake vào một ảnh nền phẳng. Xem [04 — Map art](docs/game-design/04-map-art.md) §11.

Client hiện chưa có map; vị trí hoạt động, cổng và quái của arc 1 nằm ở `server/data/life_world.json` và `server/data/world_population.json`.

## Vai trò nhánh

`feat/fantasy-world` là **nhánh GAME / MAP UI** hiện tại. Trọng tâm là map, camera, nhân vật, animation, tương tác trực tiếp và biểu diễn các activity trong thế giới game. Lịch, kế hoạch, nhật ký, icon và thống kê đời sống thuộc `feat/dual-experience-platform`.

Backend/hợp đồng `activity_session` là phần giao nhau: platform gửi lệnh; game nhận trạng thái/snapshot để avatar tự đi, hoạt động và cho phép takeover trực tiếp.

## Hai không gian

- **Sảnh/platform:** lịch, kế hoạch, nhật ký icon/note, thống kê và quản lý activity; được phát triển ở `feat/dual-experience-platform`.
- **Thế giới game:** gặp bạn ở làng ven biển hoặc làng Tinh Linh, trồng trọt, câu cá, thu thập, chế tạo, chăm nhà/vườn và thay trang phục. Khi muốn phát triển sức mạnh, người chơi chọn ngồi thiền hoặc chủ động đi đánh quái PvE.
- **Kết nối giữa hai phần:** một tài khoản và hợp đồng activity chung. Trạng thái đời thật không bắt buộc quyết định hoạt động avatar. Ví dụ người dùng đang học ngoài đời nhưng giao **Đi câu** từ platform; nhánh game phải đưa đúng avatar tới slot câu, duy trì trạng thái autonomous và cho phép takeover khi người dùng vào game.

Định hướng hiện tại không có minigame. Hoàn thành việc đời thường có thể được ghi nhận bằng phản hồi nhẹ hoặc vật trang trí; không tạo áp lực phải khai việc thật để cạnh tranh sức mạnh.

## Tài liệu thiết kế

Bối cảnh fantasy cổ, nhánh `feat/fantasy-world`; tập trung map art, gameplay và cốt truyện; kinh tế, nhiệm vụ, xã hội để sau.

- [Mục lục và thứ tự làm](docs/game-design/README.md)
- [01 — Gameplay](docs/game-design/01-gameplay.md)
- [02 — Cốt truyện](docs/game-design/02-story.md)
- [03 — Thế giới và map](docs/game-design/03-world-and-maps.md)
- [04 — Map art](docs/game-design/04-map-art.md)
- [05 — Bố cục chi tiết arc 1](docs/game-design/05-map-layouts.md)
- [06 — Quái](docs/game-design/06-monsters.md)
- [07 — Sức mạnh: Nội Giới](docs/game-design/07-power-system.md)
- [12 — Bản đồ từng khu vực](docs/game-design/12-ban-do-cac-khu.md)

## Trạng thái code hiện tại — 13/10/2026

**13/10/2026 — Người/Tinh Linh và khế ước M1:** F5 mở cảnh chơi thử mới: chọn người hoặc Tinh Linh Mèo, đi lại và đánh quái. Có đăng ký/đăng nhập, khế ước hai người xác nhận, săn Lợn Gai chung và phần thưởng riêng có lưu. Đây là cảnh gameplay với art placeholder; chưa khôi phục bản làng cũ. Xem [API](docs/spirit-contracts-backend.md).

**13/10/2026 — Rà soát DB và sức mạnh:** bỏ hẳn đường lên cảnh giới cũ, nên Người không còn tự biết Hấp Linh khi đánh quái hoặc làm xong nhiệm vụ mở đầu. Mọi lần hạ quái cho linh năng thay vì XP. Nội Giới tách sang row `inner_worlds` riêng. Receipt cũ được tự dọn. Xem [Lưu trữ backend](docs/storage-backend.md).

**13/10/2026 — Sức mạnh Nội Giới (backend):** không còn cấp độ. Linh năng hấp thụ lắng thành một thế giới nhỏ bên trong nhân vật; Tinh Linh dạy Người cách Hấp Linh. Có 3 RPC mới, hoạt động Hấp Linh ở 6 điểm, linh năng từ câu/đào/trồng/đánh quái và bước nhảy Hạt → Quần đảo. Chưa có giao diện. Xem [thiết kế](docs/game-design/07-power-system.md) và [API](docs/inner-world-backend.md).

Backend đã có tài khoản/hồ sơ, túi đồ, cộng đồng, prototype combat/PvE và **trồng cây, câu cá, đào khoáng**. Hoạt động có direct/autonomous, giờ server, phiên lưu bền, slot độc quyền, phần thưởng/refund chống trùng và xử lý túi đầy. Có 12 luống, 4 bến câu của làng mới và 4 điểm đào ở mỏ lộ thiên/B1. Xem [API và hướng dẫn nối client](docs/life-activities-backend.md).

Trước lát cắt người/Tinh Linh, các commit ngày 12/10 đã gỡ runtime/asset/layout client. Những demo làng ở phần lịch sử phía trên chưa có trong checkout hiện tại; cảnh F5 mới phục vụ gameplay khế ước. Tiến trình activity offline được suy ra theo thời gian server; vật phẩm vào túi khi gọi claim.

## Chạy backend

```sh
docker compose up --build --wait --wait-timeout 180
node scripts/smoke.mjs
node scripts/life-smoke.mjs
node scripts/spirit-contract-smoke.mjs
```

Kiểm tra code:

```sh
node scripts/build-life-world.cjs --check
cd server
npm ci
npm test
```

Để đồng bộ geometry sau khi sửa `server/data/life_world.json` (hoặc quái/NPC trong `server/data/world_population.json`), chạy `node scripts/build-life-world.cjs` tại gốc repo. Dừng dịch vụ bằng `docker compose down`; dữ liệu PostgreSQL được giữ trong named volume.

## Công nghệ

- Client: Godot 4.6.1, GDScript.
- Backend: Nakama, TypeScript runtime và PostgreSQL.
- Thứ tự sản xuất: map/UI/nhân vật → nền tảng sinh hoạt và cộng đồng → vòng chơi đời sống → tu luyện/PvE; cốt truyện dài phát triển sau.
