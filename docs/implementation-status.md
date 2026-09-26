# Tiến độ triển khai và thứ tự mới — cập nhật 26/09/2026

> P0 và P0.5 đã được tích hợp vào `main` qua PR #3–#4. Mốc code nền đang dùng là `674f52bcfe1936643f1efd83e03453554167b2bc`; bốn map, HUD và điều khiển keyboard/touch dùng chung đã có. Nhánh P1 hiện triển khai encounter Sơn Trư authoritative trong một match PvE riêng.

## 1. Mốc mã nguồn đã đối chiếu

`main` bắt đầu từ commit `674f52bcfe1936643f1efd83e03453554167b2bc`. P0 đã gom nền `feat/inventory-rewards` và đối chiếu riêng nhánh economy; P0.5 đã sửa tuyến map, occlusion cây/cầu, HUD và input mobile tối thiểu. Nhật ký nguồn và giới hạn còn lại: [đối chiếu nhánh kinh tế](economy-branch-review-2026-09-26.md), [lịch sử dự án](project-history.md).

Không coi ảnh PNG world là runtime TileMap; bốn map đang dựng từ tile atlas/layout JSON. Mobile export, safe-area và playtest thiết bị thật vẫn chưa nghiệm thu.

## 2. Có và chưa có

| Phần | Tình trạng tại mốc nguồn |
| --- | --- |
| Backend xã hội | Có tài khoản, bạn bè/chặn, chat/nhóm; xem `social-backend.md` |
| Đấu tập authoritative hai người | Có prototype, snapshot, đánh/né, vòng đời và reconnect; không kinh tế |
| Tài sản nhân vật | Có schema 2, catalog 24 ID, túi 24 ô, starter và receipt chống cấp trùng |
| Dùng/trang bị đồ | Chưa có runtime |
| PvE Sơn Trư P1 | Match riêng authoritative: notice/chase, telegraph 0,75 s, lao 4 tile, hồi 0,8 s, né/phản công, chết/reset, reconnect 10 s; không ghi XP/loot |
| Tu vi/đột phá | Chưa có runtime |
| Node, vườn, craft, shop | Chưa có runtime |
| Quest/chương/bản đồ gameplay | Có bốn map runtime; quest/unlock/server save chưa có |
| Cross-platform PC + mobile | Cùng action/movement trên keyboard/mouse và touch ngang; chưa có mobile export hoặc thiết bị thật |

Chi tiết: [combat](combat-prototype.md), [tài sản](inventory-and-rewards.md),
[nhật ký](project-history.md), [đặc tả mới](game-design/progression-pve-spec.md).

## 3. Thứ tự triển khai thay thế kế hoạch hệ thống rời rạc

Các mốc mới kế thừa nền đã có, không làm lại combat/tài sản từ đầu.

| Mốc | Phạm vi đủ để chơi thử | Phụ thuộc | Điều kiện chuyển bước |
| --- | --- | --- | --- |
| P1 — một Sơn Trư | Bãi QA tại dấu vết Trúc Âm; AI, báo đòn/lao/hồi thế, chết/reset, sprite/map và touch | Combat authoritative hiện tại | Unit + Godot/Nakama smoke đạt; người chơi đọc đòn/né/phản công; không cấp XP/loot |
| P2 — chuyến săn có thành quả | Outcome bền vững, XP tối thiểu, loot, equip/consume/dọn túi, checkpoint/hồi phục | P1 + nền tài sản | Reward đúng một lần; túi đầy giữ chờ; restart còn dữ liệu; đồ thực sự có tác dụng |
| P3 — mở đầu nhân vật | Quest runtime tối thiểu 001–003, dẫn khí, Phi Nhận, UI mục tiêu | P2 + progression transaction | Tài khoản mới mortal → LK1, không cấp đồ/XP bằng lệnh tay |
| P4 — vòng Trúc Âm | Node, shop nhỏ, garden/craft, 004–006, Độc Chu, đột phá tầng 2 | P3 + UI/kinh tế nhất quán | Chuẩn bị → đi rừng/đường tránh → về → mở Hộ Thân, có nguồn thay thế |
| P5 — chương đầu | 007–012, Thạch Cạn/Cổ Tỉnh, quái/công thức còn lại, tầng 3–4 | P4 | Solo/co-op, hạ/niêm phong, đủ XP và không kẹt; đo nhịp/tiêu hao thật |

P0.5 đã cung cấp input, HUD và map để gắn encounter. P2 vẫn cần CP-4 vì inventory/reward cần layout chờ, receipt và settlement.

P2 có thể dùng fixture Luyện Khí trong test; không thay trạng thái người chơi thật
hoặc thêm debug grant RPC vào production. P4 phải có bán da/mua nước/thuốc và craft,
không nghiệm thu economy khi loot chỉ nằm trong túi.

P5 qua chơi thử rồi mới tăng map/kỹ năng/tông môn/PvP/chợ.
Không kéo chương 2–4 giờ thành nhiều ngày bằng lịch chờ hoặc tăng số quái.

## 4. Chuỗi phụ thuộc kỹ thuật bắt buộc

Outcome encounter bền vững → xác định quyền thưởng → settlement nhất quán →
receipt/source → event quest/progression → UI xác nhận. `grantReward` hiện có
không tự triển khai tất cả mắt xích này. Khi thêm XP phải mở rộng lớp tài sản/
profile và migration có test, không cho module combat tự sửa XP rời.

Shop/craft/consume và đột phá phải có capacity, validation, CAS/replay và phục hồi
mất acknowledgement. Đồng bộ timer spawn/node/plot và quyền chuyển map/epoch.
Không bắt đầu encounter thưởng mới khi còn settlement chờ đầy túi.

## 5. Bằng chứng kiểm thử

Các dòng sau là kết quả lịch sử của những mốc đã merge, không phải kết quả chạy cho P1.
Mốc combat trước đó đạt 42/42 unit test; Godot 4.6.1 import/chạy scene.
Mốc tài sản có 64 unit test và CI run
[35566231466](https://github.com/Vu-PTIT/tutien/actions/runs/35566231466)
thành công trên `a0ad66e`, gồm Nakama/PostgreSQL, inventory/restart, social và Godot.

P1 hiện thêm unit test cho encounter và cấu hình Godot/Nakama smoke cùng capture desktop/touch trong CI; chỉ đánh dấu đạt sau khi workflow chạy thành công.

## 6. Tài liệu sản phẩm

Các số kinh tế và tiến trình lấy từ [đặc tả PvE](game-design/progression-pve-spec.md) và JSON thiết kế. P1 chỉ triển khai giao chiến Sơn Trư; settlement thưởng, quest và lưu world vẫn thuộc P2 trở đi.

## 7. Giới hạn hiện tại

P2 phải nối `encounterId/outcome` → settlement bền vững → receipt/inventory. Không cho combat tự ghi XP, linh thạch hoặc item rời khỏi transaction.


### Authored TileMap recovery — 24/09/2026

The four map prototypes use reusable biome `TileSet` atlases and authored layout JSON for Ground and sparse Detail layers; the Foreground TileMapLayer is reserved for later authored art. Tall props are separate Y-sorted scenes. Painted world PNGs are route concept previews only; runtime PNG slicing has been removed. Collision and interaction data remain catalog-driven while terrain presentation is editable at tile level.

### Lát cắt điều khiển và độ sâu An Khê — 26/09/2026

- PC giữ WASD/phím mũi tên và chuột; màn hình ngang mobile dùng cần trái, nút tương tác ở map và Đánh/Né trong đấu tập. `--touch-preview` hoặc F9 xem bố cục trên PC. Hướng đánh touch lấy từ hướng di chuyển gần nhất; chưa có cần ngắm độc lập.
- HUD ẩn hotbar PC khi bật touch; các nút gameplay ẩn lúc mở túi, bản đồ hoặc phòng đấu tập. Touch dùng cùng hàm action/movement, không tạo gameplay song song.
- Vật thể cao có metadata `occlusion` trong JSON map để giảm độ mờ khi che người chơi; bước đầu áp dụng cây ở An Khê. Các công trình và blocker tiếp tục là đối tượng riêng. Tương tác cục bộ kiểm tra đường thẳng không đi xuyên vùng cản.
- Ảnh runtime CI phát hiện spawn An Khê nằm trên dải nước dù collision cho đi. Ground rows đã được vẽ lại bằng tile sẵn có: quảng trường đá ở giữa, các lối đất tới hiệu thuốc/chợ/cổng, suối liên tục ở mép đông và blocker khớp vùng nước. Blocker của công trình được thu về gần chân vật thể, bỏ tường vô hình ở góc tây nam và thêm chân sạp chợ. Smoke test kiểm tra loại tile tại spawn, suối và các vùng cản.
- Minimap HUD lấy màu nền, đường, nước, vật cản và điểm tương tác từ cùng JSON layout/catalog với runtime. Ảnh world cũ chỉ còn dùng để xem ý tưởng tuyến trên panel, tránh hiển thị một địa hình khác dưới marker vị trí.
- Nhãn địa danh chỉ hiện khi đến gần (5 tile); mục tiêu khởi đầu đọc từ catalog thay vì text tĩnh trong scene, nên PC và touch có cùng lời hướng dẫn đúng.
- Cầu đầu Trúc Âm là prop thấp vẽ dưới nhân vật để điểm vào không che sprite; metadata `depth_policy` giữ luật độ sâu trong JSON map.
- Chưa có scene mobile export, safe-area theo notch và playtest trên thiết bị thật. PNG world chỉ dùng preview tuyến; minimap lấy ô runtime. Phần lớn art props vẫn còn nền cỏ/đất trong ô atlas; cây anh đào An Khê là cutout đầu tiên.
- `client/scripts/game_input.gd` gom bind phím trong InputMap và đổi keyboard/mouse/touch thành action, movement, aim chung. `main.gd` chỉ xử lý lệnh semantic; phím có thể đổi ở InputMap mà không sửa gameplay.
- Kiểm tra tĩnh: `node scripts/check-pixel-scenes.cjs` và `node scripts/check-png-integrity.cjs`. Godot import, runtime và `client/tests/presentation_smoke.gd` phải được chạy ở CI sau khi push; không coi kiểm tra tĩnh là bằng chứng chạy engine.
