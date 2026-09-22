# Nhật ký phát triển dự án Tu Tiên

**Repository:** [`Vu-PTIT/tutien`](https://github.com/Vu-PTIT/tutien)<br>
**Ngày rà soát:** 20/09/2026<br>
**Nhánh ghi nhật ký:** `feat/authoritative-combat`
**Mục đích:** ghi lại những gì đã được commit trên Git, trạng thái sản phẩm hiện tại và thứ tự triển khai tiếp theo.

> Nhật ký này được đối chiếu từ lịch sử commit, cây thư mục, các nhánh Git và PR trên GitHub. Nội dung thiết kế chỉ được gọi là “đã làm” khi có file hoặc mã tương ứng trong repository.

## 1. Lịch sử theo thời gian

| Thời điểm | Commit | Nhánh/mốc | Nội dung đã làm |
|---|---|---|---|
| 12/09/2026 | `29f9b18` | Khởi tạo | Tạo repository và README tối thiểu. |
| 12/09/2026 | `d355c08` | Kiểm tra kết nối | Thêm `github-connection-test.md` để kiểm tra quyền ghi GitHub. |
| 12/09/2026 | `40ba769` | Nền kỹ thuật | Dựng client Godot 4, scene mẫu, di chuyển offline, Nakama, PostgreSQL, Docker Compose, RPC hồ sơ và smoke test đầu tiên. |
| 12/09/2026 | `b8eedad` | `feat/social-backend` | Thêm tài khoản email/thiết bị, đăng nhập, bạn bè, chặn, chat, nhóm, tông môn/bang phái và adapter Godot. Bổ sung test unit, smoke HTTP/WebSocket và tài liệu API. |
| 12/09/2026 | `83b0d2b` | Backend | Cập nhật Dockerfile nhiều giai đoạn để build runtime TypeScript và triển khai Nakama. |
| 12/09/2026 | `d6f07ef` | `feat/social-backend` | Sửa cách đăng ký hook Nakama bằng các hàm có tên trực tiếp trong `InitModule`, giúp runtime đăng ký ổn định. |
| 17/09/2026 | `bb645a4` | `docs/game-design-v2` | Thêm bộ thiết kế tu tiên v2: tầm nhìn, vòng chơi, nhân vật/cảnh giới, combat, bản đồ, story, quest, vườn/chế tạo/kinh tế và README thiết kế. Định hướng “phàm nhân tích lũy từng bước”, MVP chỉ có Phàm nhân và Luyện Khí 1–4. |
| 17/09/2026 | `94fca39` | `main` | Đưa bộ tài liệu game-design v2 vào `main`, giữ nền Godot–Nakama–PostgreSQL và backend xã hội. |
| 20/09/2026 | `13c125e` | `feat/authoritative-combat` | Triển khai mốc online đầu tiên: phòng đấu tập hai người, đồng ý/sẵn sàng, mô phỏng server 20 Hz, snapshot 10 Hz, di chuyển, vật cản, đánh thường, né, HP, kết thúc trận và reconnect ngắn. Thêm giao diện Godot, adapter combat, smoke hai client và test combat. |
| 20/09/2026 | `4e98962` | `feat/authoritative-combat` | Sửa việc lệnh đánh/né có thể bị mất khi nhiều gói mạng đến cùng tick; bổ sung chẩn đoán live smoke và test hồi quy. |
| 20/09/2026 | `e8b7c6d` | `feat/authoritative-combat` | Sửa lỗi trạng thái presence của người chơi mới khi Nakama export state qua Goja; bổ sung test hồi quy. Đây là commit đã được CI tích hợp kiểm tra thành công. |

## 2. Sản phẩm hiện có trên Git

### Client Godot

- Scene 2D mẫu có di chuyển WASD/phím mũi tên.
- Kết nối tài khoản thiết bị tới Nakama local.
- Tạo, vào và rời phòng đấu tập.
- Hai người cùng bấm sẵn sàng trước khi trận bắt đầu.
- Hiển thị nhân vật, HP, hướng đánh, trạng thái đánh/né và snapshot server.
- Nội suy vị trí hiển thị giữa các snapshot.

### Server Nakama/TypeScript

- Xác thực và hồ sơ nhân vật do server tạo.
- Bạn bè, chặn, chat thế giới/riêng/nhóm và group tông môn/bang phái.
- Match `sparring` tối đa hai người, xác nhận consent và version giao thức.
- Server kiểm tra epoch, sequence, phiên kết nối, giới hạn input, hướng, cooldown, tầm đánh, vật cản và sát thương.
- Đấu tập dùng trạng thái tạm thời, không cấp tiền, không rơi đồ và không ghi HP vào tiến trình PvE.
- Reconnect trong thời gian ngắn giữ HP và cooldown; disconnect hết thời gian sẽ kết thúc trận.

### Kiểm thử và vận hành

- TypeScript runtime build bằng Node/Nakama definitions chính thức.
- Docker Compose chạy PostgreSQL và Nakama local.
- CI kiểm tra unit test, Docker, smoke tài khoản, smoke xã hội, Godot adapter và smoke combat hai client.
- Commit `e8b7c6d`: `42/42` test unit đạt, gồm `23` test nền/xã hội và `19` test combat.
- CI run tích hợp đạt: [GitHub Actions run 35524043833](https://github.com/Vu-PTIT/tutien/actions/runs/35524043833).
- PR triển khai combat: [PR #2](https://github.com/Vu-PTIT/tutien/pull/2), đang mở dạng draft để xem xét, chưa merge vào `main`.

## 3. Trạng thái sản phẩm so với kế hoạch

| Mảng | Trạng thái trong Git | Nhận xét |
|---|---|---|
| Nền kỹ thuật Godot–Nakama–PostgreSQL | Đã có | Chạy local bằng Docker Compose. |
| Tài khoản và tương tác xã hội | Đã có | Auth, bạn bè, chat, group đã có test tích hợp. |
| Thiết kế tu tiên | Đã có một phần | Các file `docs/game-design/00` đến `07` đã nằm trên `main`. |
| Đấu tập online hai người | Đã có trên nhánh feature | Đã qua CI thật; chưa phải PvP mở hoặc hệ thống thi đấu dài hạn. |
| Tài sản nhân vật/inventory/reward | Chưa có | Chưa được ghi nhận là đã triển khai trong mã hiện tại. |
| Quái và PvE encounter | Chưa có | Sơn Trư và boss mới ở mức thiết kế. |
| Vườn, linh thảo, luyện đan/phù | Chưa có | Mới có định hướng trong game design. |
| Quest runtime, story playable, map chương đầu | Chưa có | Chưa có hệ thống tiến độ server và nội dung chơi hoàn chỉnh. |
| Tông môn NPC, trading, PvP mở | Chưa có | Backend group xã hội không đồng nghĩa với các hệ thống gameplay này. |
| Mobile, prediction/rollback, tối ưu RTT/tải | Chưa nghiệm thu | Chưa được đưa vào critical path của mốc hiện tại. |

## 4. Thứ tự triển khai tiếp theo

Thứ tự này nối từ mốc combat đã hoàn thành và các file thiết kế đang có:

1. **Tài sản và dữ liệu nhân vật:** catalog ID ổn định, profile migration, inventory và operation ID chống nhận thưởng trùng; kiểm thử CAS, retry và disconnect.
2. **PvE encounter:** tái sử dụng luật server, thêm AI Sơn Trư, hit/loot theo encounter và không phát thưởng lặp.
3. **Vòng chơi tài nguyên:** đi rừng → thu thập → trồng Cam Lộ → luyện Hồi Nguyên Hoàn → sử dụng vật phẩm → tu luyện.
4. **Quest và story chương đầu:** runtime tiến độ server, checkpoint, điều kiện mở khóa và nội dung map đầu tiên.
5. **Mở rộng vertical slice:** nối một phiên chơi hoàn chỉnh từ phàm nhân đến mở Luyện Khí, sau đó mới mở rộng xã hội/PvP.

## 5. Những điều cần giữ thống nhất

- Dùng server làm nguồn quyết định cho vị trí hợp lệ, HP, sát thương, vật phẩm, tiền và tiến độ.
- Giữ tách biệt `sect/guild` của người chơi với tông môn NPC trong thế giới.
- Không coi Markdown, catalog mẫu hoặc unit test giả lập là tính năng đã hoàn thành nếu chưa có code và tích hợp tương ứng.
- Giữ hướng thiết kế “phàm nhân chuẩn bị và tích lũy”, không mở rộng hàng loạt cảnh giới trước khi vòng chơi đầu tiên ổn định.
- Các phần được README thiết kế v2 dẫn tới nhưng chưa xuất hiện trong Git (`08–15`, `design-samples/mvp.catalog.json`, `scripts/validate_design.py`) cần được bổ sung hoặc cập nhật trạng thái trước khi dùng làm tiêu chí nghiệm thu.

## 6. Mốc tham chiếu Git

```text
main                         94fca39  docs: merge game design v2 documentation into main
feat/social-backend          d6f07ef  fix Nakama hook registration
origin/docs/game-design-v2   bb645a4  docs: add detailed cultivation game design plan
feat/authoritative-combat    e8b7c6d  fix presence state in authoritative match
```

Lịch sử này là trạng thái của repository tại ngày 20/09/2026. Mỗi mốc mới cần cập nhật file này cùng với test, tài liệu triển khai và trạng thái PR tương ứng.

## 7. Tiếp tục triển khai — 21/09/2026

- Đối chiếu PR #2 và lịch sử nhánh `feat/authoritative-combat` tại `ab26fb7`;
  `main` vẫn ở `94fca39`, chưa merge PR #2.
- Tạo nhánh `feat/inventory-rewards` kế thừa combat, làm ưu tiên tài sản của mục 4.
- Thêm catalog 24 vật phẩm theo thiết kế 07, schema 2 và CAS migration từ schema 1;
  dữ liệu bất hợp lệ giữ nguyên để rà soát. Tiền và túi lưu cùng profile.
- Inventory 24 ô, stack 99, instance ID trang bị; gói khởi đầu server định nghĩa.
- Giao dịch cấp thưởng ghi đồng thời profile + operation receipt + source receipt;
  chặn double-click, đổi operation để nhận lại source, giả phần thưởng và túi đầy.
- Godot có nút Túi đồ, xem tiền/vật tư, nhận gói một lần, tải lại sau mất mạng.
- Local: 64/64 unit test đạt; Godot 4.4.1 import và chạy scene đạt.
- CI thêm live inventory concurrency/migration/restart và Godot panel smoke.
  Chờ kết quả run trước khi gọi mốc này đã qua tích hợp thật.
- Phần tiếp theo: encounter PvE Sơn Trư + quyền nhận loot, rồi vòng tài nguyên.
  Chưa triển khai dùng/trang bị đồ, crafting, garden, quest hoặc progression.

Các bảng tại mục 1–6 là ảnh chụp lịch sử 20/09, không phải trạng thái thay thế
cho cập nhật mới ở mục này. Chi tiết API và kiểm thử: `inventory-and-rewards.md`.

### Kết quả bàn giao cục bộ

Commit triển khai: `135bb10` — `feat: add persistent inventory and idempotent starter rewards`.
Push nhánh bị hệ thống xét duyệt tự động từ chối vì yêu cầu hiện tại chưa xác nhận
công bố thay đổi lên repository công khai. Chưa tạo PR mới hoặc chạy CI nhánh này.
Cần người dùng xác nhận push `feat/inventory-rewards` lên `Vu-PTIT/tutien`.

Đã thử chạy Nakama 3.37.0/PostgreSQL 16.8 native để kiểm tra độc lập, nhưng môi
trường chỉ có root và không cho chuyển chủ thư mục sang tài khoản thường;
PostgreSQL từ chối chạy root. Vì vậy **live inventory smoke/restart chưa chạy**.
64/64 unit test và Godot import/chạy scene đạt; không dùng chúng thay cho kết quả
lưu trữ thật. Sau khi được phép push, chạy CI và xử lý mọi lỗi trước nghiệm thu.

### Đã công bố và qua CI — 21/09/2026

Người dùng đã xác nhận push. Toàn bộ thay đổi được đưa lên
`feat/inventory-rewards` qua kết nối GitHub, commit `60189fd`; nội dung tree
trùng bản local `135bb10` + `5dece86`. Commit `a0ad66e` sửa HTTP method trong
smoke kiểm quyền ghi (`PUT /v2/storage`) và xác nhận profile không đổi.

CI [run 35566231466](https://github.com/Vu-PTIT/tutien/actions/runs/35566231466)
đạt trên `a0ad66e`: 64 unit test, Docker/Nakama/PostgreSQL thật, profile/social,
inventory concurrent claim/migration/túi đầy/restart/replay, Godot inventory
panel và đấu tập hai client. Các giới hạn chưa push/chưa live-test ở trên là
trạng thái lịch sử trước xác nhận, đã được giải quyết ở mốc này.

Nhánh đã công bố; chưa merge `main`. Bước tiếp theo: encounter Sơn Trư và loot
server-authoritative. Dùng/trang bị đồ, garden/crafting và quest vẫn chưa có.

### Thiết kế lại phần trình bày pixel — 21/09/2026, bản local

Theo phản hồi giao diện không giống concept, thay nền procedural bằng PNG
làng An Khê, atlas nhân vật bốn hướng và icon trong suốt. Tách scene world,
player, HUD và túi 24 ô; editor/runtime dùng cùng cây node. Theme xanh đen
viền đồng, viewport 640 × 360, nearest và scale nguyên. Bỏ preview `@tool`
riêng và ItemList ẩn. Túi offline ghi rõ mẫu; túi thật xóa mẫu trước khi tải.

Static scene audit đạt; 64/64 unit test server đạt. **Chưa xác nhận Godot
runtime cho lần sửa này**: engine local lỗi khởi động, chưa có run CI mới.
Đã thêm offline presentation smoke và ma trận CI 4.4.1/4.6.1. Ảnh trong
`docs/ui-previews` là render bố cục tĩnh, không phải screenshot Godot.

Nền làng chưa phải TileMap, atlas AI chưa chuẩn hóa pixel/frame thủ công;
không thêm PvE hoặc quest lưu trữ. Xem `ui-product-slice.md`. Thay đổi hiện
chưa push; lịch sử CI đã đạt ở trên chỉ áp dụng các commit được ghi rõ.
