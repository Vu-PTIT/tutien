# Tiến độ triển khai và thứ tự mới — cập nhật 27/09/2026

> P2 nằm ở PR #8 (`feat/p2-son-tru-settlement` → `main`), head `e8348b8`, trên nền `5d45df9` (P1 đã merge qua PR #5–#6). Server build và 80/80 unit test đạt; scene audit gồm 11 scene/79 resource refs và 22 PNG qua kiểm tra tĩnh. Sơ đồ tuyến là một panorama nối bốn khu. GitHub Actions run #127 đạt các gate Docker/Nakama/PostgreSQL và Godot 4.6.1, gồm inventory/settlement, combat/PvE, presentation và ảnh desktop/touch. PR còn mở, chưa merge; playtest thiết bị thật vẫn còn.

Nền map trước đó gồm bốn layout TileMap từ atlas 32 px, prop Y-sort riêng, 21 POI cục bộ, cổng có điểm đến và smoke test tuyến. An Khê có nền/collision chỉnh theo ảnh runtime, minimap từ dữ liệu map, sprite cây tách nền, gốc cây có va chạm và bố cục touch thử nghiệm. Bàn phím/chuột và cảm ứng dùng chung `GameInput`/InputMap. Foreground toàn map, fog-of-war, quest/unlock server, lưu trạng thái map và bản xuất mobile chưa hoàn thành.

## 1. Mốc mã nguồn và phạm vi hiện tại

- `main` tại `5d45df95b278583b688f2cefa16260dbe3eae3b9` đã có P1 Sơn Trư và tài liệu nghiệm thu; P2 tiếp tục trên nhánh feature riêng.
- P2 gồm profile schema 3 và migration schema 2, equip/use/discard server-side, trận solo Sơn Trư authoritative, XP/loot, settlement outbox chờ nhận khi đầy túi, HP checkpoint và HUD dùng cùng input PC/touch.
- P2 gồm các commit trên nhánh đã push; head hiện tại là `e8348b8`, PR #8 đang mở và chưa merge. CI run #127 xác nhận integration/runtime; người chơi vẫn cần playtest trên thiết bị thật.
- Không nhập `feat/economy-balance-v1` vào runtime; xem [đối chiếu nhánh kinh tế](economy-branch-review-2026-09-26.md).

## 2. Có và chưa có

| Phần | Tình trạng ở nhánh P2 |
| --- | --- |
| Backend xã hội | Có tài khoản, bạn bè/chặn, chat/nhóm; xem `social-backend.md` |
| Đấu tập authoritative hai người | Có snapshot, đánh/né, vòng đời và reconnect; không cấp kinh tế |
| Tài sản nhân vật | Schema 3, catalog 24 ID, túi 24 ô, migration, starter và receipt chống cấp trùng |
| Dùng/trang bị/dọn túi | Equip tăng công/thủ, thuốc hồi 40 HP, bỏ vật tư thường; có validation và retry receipt |
| PvE/AI/encounter/loot | Sơn Trư solo authoritative, tell/lao/hồi thế, thắng/thua/reset, reward XP/da và cooldown |
| Settlement | Outcome/source bền vững; đầy túi giữ chờ qua restart, chặn chuyến săn mới đến khi nhận |
| Tu vi/đột phá | XP P2 giới hạn theo tầng; nhánh P3 thêm mở đầu mortal → LK1 và phần thưởng dẫn khí |
| Node, vườn, craft, shop | Chưa có runtime |
| Quest/chương/bản đồ gameplay | Nhánh P3 đang nối world session server-authoritative và quest 001–003 trên map prototype |
| Cross-platform PC + mobile | InputMap/HUD và điều khiển cảm ứng dùng cùng action; chưa có mobile export hoặc playtest thiết bị |

Chi tiết: [combat](combat-prototype.md), [tài sản/P2](inventory-and-rewards.md),
[nhật ký](project-history.md), [đặc tả](game-design/progression-pve-spec.md).

## 3. Mốc kế tiếp

| Mốc | Trạng thái | Phạm vi/điều kiện |
| --- | --- | --- |
| P1 — một Sơn Trư | Runtime đã có trong lát cắt P2 | Đọc đòn/né/phản công; server xác nhận |
| P2 — chuyến săn có thành quả | CI hoàn tất trên PR #8; PR chưa merge | Nhận đúng một lần; đầy túi giữ thưởng; restart còn; đồ và HP có tác dụng/lưu |
| P3 — mở đầu nhân vật | Đang triển khai trên `feat/p3-world-quests`; chưa qua CI Godot hoặc merge | World movement/interaction server-authoritative; quest 001–003, Mạch Bàn, `sk_scan`, dẫn khí, Phi Nhận, UI mục tiêu |
| P4 — vòng Trúc Âm | Chưa làm | Node, shop nhỏ, garden/craft, 004–006, Độc Chu và đột phá tầng 2 |
| P5 — chương đầu | Chưa làm | 007–012, Thạch Cạn/Cổ Tỉnh, quái/công thức còn lại, tầng 3–4 |

P2 dùng fixture Luyện Khí riêng trong smoke; không đổi trạng thái người chơi thật
và không thêm debug grant RPC. P3 lưu vị trí map và quest trong storage theo tài khoản;
vật phẩm, cờ, realm, skill, insight và XP được ghi cùng lần cập nhật hồ sơ. P4 cần bán da/mua nước/thuốc và craft; không nghiệm
thu economy khi loot chỉ nằm trong túi. P5 qua playtest rồi mới tăng map/kỹ năng/
tông môn/PvP/chợ; không dùng lịch chờ để kéo dài chương.

## 4. Chuỗi phụ thuộc kỹ thuật bắt buộc

P2 đã nối outcome encounter → quyền thưởng → settlement/outbox → receipt/source →
UI nhận thưởng; XP/HP cũng nằm trong profile có migration. Event quest/progression,
quest reward và transaction đột phá còn ở P3. Không cho match tự sửa XP tách khỏi
lớp tài sản.

Shop/craft/consume và đột phá phải có capacity, validation, CAS/replay và phục hồi
mất acknowledgement. Đồng bộ timer spawn/node/plot và quyền chuyển map/epoch.
Không bắt đầu encounter thưởng mới khi còn settlement chờ đầy túi.

## 5. Bằng chứng kiểm thử

Nhánh P3 hiện đạt `npm --prefix server test` 86/86; TypeScript build nằm trong
cùng lệnh. Sáu test mới kiểm tra khởi tạo vị trí, di chuyển giả mạo/stale,
tương tác gần vật thể trên đúng map, chuỗi quest/thưởng một lần và cổng vật lý.
`node scripts/check-pixel-scenes.cjs` đạt 11 scene/79 resource refs, gồm PNG Lục Vi.
Godot executable chưa có tại local nên `presentation_smoke.gd` chưa chạy; CI cần xác nhận
import Godot/runtime trước khi merge. `scripts/inventory-smoke.mjs` đã được mở rộng cho Docker/Nakama/
PostgreSQL, migration schema 2, equip/use/discard, đầy túi và settlement restart.
`client/tests/inventory_smoke.gd` kiểm tra panel nhận starter và trang bị;
`client/tests/combat_smoke.gd` còn mở trận PvE thật để kiểm tra tell/lao/hồi thế.
Môi trường local hiện không có Docker hoặc Godot executable. GitHub Actions run
[36304883102](https://github.com/Vu-PTIT/tutien/actions/runs/36304883102) (#127)
đã chạy thành công Docker/Nakama/PostgreSQL, Godot 4.6.1 import/runtime, smoke UI,
inventory settlement và trận combat/PvE. Run #125 là kết quả trước đó; các lỗi
capture, auth quota và presentation phát hiện trong những lượt CI trước đã được sửa.

Mốc combat local từng đạt 42/42 unit test; Godot 4.6.1 import/chạy scene.
Mốc tài sản đã ghi 64 unit test và CI run
[35566231466](https://github.com/Vu-PTIT/tutien/actions/runs/35566231466)
thành công trên `a0ad66e`, gồm Nakama/PostgreSQL, inventory/restart, social và Godot.
Đây là kết quả **lịch sử của mốc đó**, không phải lần chạy lại do sửa tài liệu này.

P2 trước đó đạt 80/80 server test và CI runtime/integration; bằng chứng này không
thay cho P3. P3 local hiện đạt server test 85/85, scene audit và JSON/PNG checks.
Godot/Docker không có sẵn tại local; cần CI mới xác nhận GDScript, Godot import/runtime,
và integration Nakama/PostgreSQL cho nhánh P3. Kết quả này không thay cho playtest mobile thật.

## 6. Tài liệu và việc còn thiếu

Bộ v2 tại mốc nguồn có 00–07 và README; 08–15 cùng `mvp.catalog.json`/
`validate_design.py` vẫn chưa có. Mục lục mới không dẫn người đọc bắt đầu ở file thiếu.

Bổ sung hiện tại:
`game-design/progression-pve-spec.md`, `game-design/progression-references.md`,
`design-samples/progression-pve.v1.json`, `scripts/validate_progression_design.py`
và `scripts/test_progression_design.py`.
Đây là tài liệu/công cụ thiết kế, không là content loader Godot/Nakama.

## 7. Lịch sử giới hạn xuất bản/kiểm thử

Ở lần triển khai tài sản trước, push từng cần xác nhận riêng; live PostgreSQL local
không chạy được và CI ban đầu chưa có kết quả. Sau khi người dùng xác nhận push,
nhánh đã có trên GitHub và CI được ghi ở mục 5. Không dùng cảnh báo cũ để kết luận
inventory hiện chưa từng qua integration test.

P2 đã được push lên `feat/p2-son-tru-settlement` và có PR #8 vào `main`, trên nền
`5d45df9`. Head `e8348b8` có CI run #127 xanh; PR vẫn mở và chưa merge. P2 đạt
điều kiện CI, còn playtest thiết bị là phần xác nhận tiếp theo.

P3 đã có RPC server-owned cho vị trí, va chạm, cự ly/đường nhìn, POI và cổng map;
client không gửi map hoặc đối tượng đích giả. Quest 001–003 và UI mục tiêu đã nối,
Lục Vi có sprite NPC mới theo phong cách pixel hiện có. Phần còn lại là qua Godot/CI,
soát playtest đoạn nối map và gói thay đổi trước khi coi P3 hoàn tất. Chưa tạo map mới:
Trúc Âm vẫn là prototype hiện có, được thêm hai POI dấu nước theo đặc tả.


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

### Tích hợp P2/P3 và vòng kinh tế prototype — 27/09/2026

- P2 đã được merge vào `main` tại `235ae37693a715fb987d774436b77e797bb28142` sau CI xanh. Ghi chú trạng thái PR cũ phía trên là lịch sử trước khi merge.
- Nhánh P3 hiện ghép chuỗi quest 001–003 với map quality: bốn map nối bằng cổng reciprocal, UI tuyến có tóm tắt đường đi, POI/collision khớp tọa độ server và arrival được kiểm. Đã sửa vị trí tương tác chợ/vườn để vùng va chạm không chặn lối tới điểm dịch vụ.
- Prototype kinh tế có giao dịch mua/bán theo bảng giá server, năm công thức craft, node Cam Lộ/quặng có cooldown, sáu ô vườn với hạt/nước, thời gian chín server-side và harvest bằng inventory receipt. Chợ, lò rèn, vườn và node kiểm tra vị trí server. HUD mở menu dịch vụ qua E/chạm. Hiện menu vườn chỉ thao tác ô 1; tutorial boost, ba quest kinh tế P4 và nhịp combat Độc Chu chưa nối.
- Có sprite Độc Chu 4 frame RGBA trong `client/assets/pixel/enemies/doc_chu/processed/`; chưa gắn vào trận/loot. Asset được lưu để bước encounter kế tiếp dùng được.
- Local verification: 90/90 test server; static map/scene audit và PNG integrity pass; `git diff --check` pass. Chưa có Godot executable hoặc Docker local nên GDScript parse, import/runtime, PostgreSQL integration và kiểm PC/mobile thật cần CI/playtest.
