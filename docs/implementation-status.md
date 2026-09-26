# Tiến độ triển khai và thứ tự mới — cập nhật 24/09/2026

> Ghi chú runtime map 24/09: nhánh `feat/inventory-rewards` hiện có prototype map dùng chung với ground chia ô atlas 32 px lúc chạy, 21 POI cục bộ, điểm đến cổng riêng và smoke test tuyến bốn map. Ground vẫn dựa trên ảnh PNG một lớp; detail/foreground, collision chi tiết, touch HUD, fog-of-war, quest/unlock và lưu trạng thái server chưa hoàn thành. An Khê giữ 48×36; kích thước Trúc Âm, Thạch Cạn và Cổ Tỉnh vẫn chưa chốt.

Các bảng dưới đây tiếp tục ghi trạng thái tại mốc mã nguồn lịch sử được nêu; ghi chú runtime map phía trên là cập nhật mới nhất.

## 1. Mốc mã nguồn đã đối chiếu

`main` tại `94fca39c358340273d6f6de16675d93d539fdc00`.
Nhánh feature đang kế thừa combat/tài sản:
`feat/inventory-rewards` tại `05f5dd0eb9df36d5790e268879b8fbe3699994ea`.
Tại lúc kiểm tra, nhánh này chưa được merge vào `main`.

Backend xã hội và thiết kế v2 đã ở main. Combat/tài sản đang ở nhánh feature.
Không lấy mô tả trong hội thoại hoặc file thiết kế làm bằng chứng code đã triển khai.

## 2. Có và chưa có

| Phần | Tình trạng tại mốc nguồn |
| --- | --- |
| Backend xã hội | Có tài khoản, bạn bè/chặn, chat/nhóm; xem `social-backend.md` |
| Đấu tập authoritative hai người | Có prototype, snapshot, đánh/né, vòng đời và reconnect; không kinh tế |
| Tài sản nhân vật | Có schema 2, catalog 24 ID, túi 24 ô, starter và receipt chống cấp trùng |
| Dùng/trang bị đồ | Chưa có runtime |
| PvE/AI/encounter/loot | Chưa có runtime |
| Tu vi/đột phá | Chưa có runtime |
| Node, vườn, craft, shop | Chưa có runtime |
| Quest/chương/bản đồ gameplay | Có thiết kế; chưa có luồng chơi hoàn chỉnh |
| Bản cập nhật tiến trình 21/09 | Tài liệu + dữ liệu mẫu + validator, không đổi các trạng thái trên |\n| Cross-platform PC + mobile 22/09 | Có plan kiến trúc/UI/input; chưa phải runtime mobile đã hoàn thành |

Chi tiết: [combat](combat-prototype.md), [tài sản](inventory-and-rewards.md),
[nhật ký](project-history.md), [đặc tả mới](game-design/progression-pve-spec.md).

## 3. Thứ tự triển khai thay thế kế hoạch hệ thống rời rạc

Các mốc mới kế thừa nền đã có, không làm lại combat/tài sản từ đầu.

| Mốc | Phạm vi đủ để chơi thử | Phụ thuộc | Điều kiện chuyển bước |
| --- | --- | --- | --- |
| P1 — một Sơn Trư | Khu QA, AI, báo đòn/lao/hồi thế, chết/reset | Combat authoritative hiện tại | Người chơi đọc đòn/né/phản công; server xác nhận; chưa giả là có reward |
| P2 — chuyến săn có thành quả | Outcome bền vững, XP tối thiểu, loot, equip/consume/dọn túi, checkpoint/hồi phục | P1 + nền tài sản | Reward đúng một lần; túi đầy giữ chờ; restart còn dữ liệu; đồ thực sự có tác dụng |
| P3 — mở đầu nhân vật | Quest runtime tối thiểu 001–003, dẫn khí, Phi Nhận, UI mục tiêu | P2 + progression transaction | Tài khoản mới mortal → LK1, không cấp đồ/XP bằng lệnh tay |
| P4 — vòng Trúc Âm | Node, shop nhỏ, garden/craft, 004–006, Độc Chu, đột phá tầng 2 | P3 + UI/kinh tế nhất quán | Chuẩn bị → đi rừng/đường tránh → về → mở Hộ Thân, có nguồn thay thế |
| P5 — chương đầu | 007–012, Thạch Cạn/Cổ Tỉnh, quái/công thức còn lại, tầng 3–4 | P4 | Solo/co-op, hạ/niêm phong, đủ XP và không kẹt; đo nhịp/tiêu hao thật |

CP-1 đến CP-3 của G0.5 phải đủ trước khi P1 được xem là hoàn thành; CP-4 phải đi cùng P2 vì inventory cần hai layout dùng chung presenter/state.\n\nP2 có thể dùng fixture Luyện Khí trong test; không thay trạng thái người chơi thật
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

## 5. Bằng chứng kiểm thử đã ghi trước cập nhật

Mốc combat local từng đạt 42/42 unit test; Godot 4.6.1 import/chạy scene.
Mốc tài sản đã ghi 64 unit test và CI run
[35566231466](https://github.com/Vu-PTIT/tutien/actions/runs/35566231466)
thành công trên `a0ad66e`, gồm Nakama/PostgreSQL, inventory/restart, social và Godot.
Đây là kết quả **lịch sử của mốc đó**, không phải lần chạy lại do sửa tài liệu này.

Bản cập nhật hiện tại chỉ có validator thiết kế và bài tự kiểm của validator.
Kết quả đóng gói được ghi trong báo cáo bàn giao, không thay thế combat/network/
storage smoke hoặc playtest.

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

Bản sửa tiến trình lần này được chuẩn bị thành gói áp dụng vào mốc nguồn.
Việc sửa nội dung gói không tự đồng nghĩa đã commit, push, tạo PR hoặc merge Git.
Trạng thái công bố phải cập nhật theo thao tác Git thực tế, không đánh dấu trước.


### Authored TileMap recovery — 24/09/2026

The four map prototypes now use reusable biome `TileSet` atlases and authored layout JSON for Ground/Detail/Foreground layers. Painted world PNGs are preview/minimap assets only; runtime PNG slicing has been removed. Collision and interaction data remain catalog-driven while terrain presentation is editable at tile level.

### Lát cắt điều khiển và độ sâu An Khê — 26/09/2026

- PC giữ WASD/phím mũi tên và chuột; màn hình ngang mobile dùng cần trái, nút tương tác ở map và Đánh/Né trong đấu tập. `--touch-preview` hoặc F9 xem bố cục trên PC. Hướng đánh touch lấy từ hướng di chuyển gần nhất; chưa có cần ngắm độc lập.
- HUD ẩn hotbar PC khi bật touch; các nút gameplay ẩn lúc mở túi, bản đồ hoặc phòng đấu tập. Touch dùng cùng hàm action/movement, không tạo gameplay song song.
- Vật thể cao có metadata `occlusion` trong JSON map để giảm độ mờ khi che người chơi; bước đầu áp dụng cây ở An Khê. Các công trình và blocker tiếp tục là đối tượng riêng. Tương tác cục bộ kiểm tra đường thẳng không đi xuyên vùng cản.
- Ảnh runtime CI phát hiện spawn An Khê nằm trên dải nước dù collision cho đi. Ground rows đã được vẽ lại bằng tile sẵn có: quảng trường đá ở giữa, các lối đất tới hiệu thuốc/chợ/cổng, suối liên tục ở mép đông và blocker khớp vùng nước. Smoke test kiểm tra loại tile tại spawn và suối.
- Chưa có scene mobile export và playtest trên thiết bị thật. PNG world vẫn chỉ dùng preview/minimap; art props hiện còn nền cỏ/đất trong ô atlas, cần làm cutout trong lượt art tiếp theo.
- Kiểm tra tĩnh: `node scripts/check-pixel-scenes.cjs` và `node scripts/check-png-integrity.cjs`. Godot import, runtime và `client/tests/presentation_smoke.gd` phải được chạy ở CI sau khi push; không coi kiểm tra tĩnh là bằng chứng chạy engine.
