# Rà soát chất lượng map — 26/09/2026

Repo: `Vu-PTIT/tutien`, đánh giá trên `main` sau merge PR #6 (`5d45df9`).

## Đánh giá pipeline

Giữ map runtime dạng Godot `TileMapLayer` 32 px, props Y-sort riêng, POI/gate/zone trong dữ liệu và collision trong scene. Đây là pipeline phù hợp với RPG top-down hiện có; không chuyển bốn map thành ảnh nền phẳng. An Khê đã chốt 48×36 tile. Trúc Âm, Thạch Cạn và Cổ Tỉnh vẫn được ghi đúng là canvas prototype, chưa phải kích thước thiết kế đã duyệt.

## Lỗi đã sửa

- Collision giờ đọc `solid_tile_ids` từ layout và kết hợp terrain với blocker hình chữ nhật. Nước An Khê/Cổ Tỉnh, hố Thạch Cạn và lòng suối Trúc Âm chặn di chuyển. Mặt cầu Trúc Âm có vùng đi qua riêng; các vùng ngoại lệ phải cắt qua terrain bị chặn.
- Trúc Âm có dòng suối rộng hai tile chạy ngang dưới cầu hiện có. Ba shimmer được chuyển lên ô nước.
- Điểm tương tác bàn cân và bảng trận Cổ Tỉnh được dời khỏi nước tới lối khô; các điểm tương tác chính được căn lại gần prop nhìn thấy.
- FX ở Thạch Cạn và Cổ Tỉnh được đặt lại trên tile nước hoặc mạch sáng.
- Rà từng ô atlas đã phát hiện một số tile ID không khớp tên prop ở Trúc Âm và Thạch Cạn; đã đổi sang ô tre, suối, vách đá, chống hầm, xe quặng và mạch tinh thạch tương ứng. Lò rèn An Khê, cửa mỏ và trụ Mạch Bàn Thạch Cạn có cutout RGBA riêng kèm prompt nguồn. Trụ được đặt tách khỏi cửa mỏ để hai landmark không che lẫn nhau.
- Kiểm tra tĩnh duyệt đường 4 hướng từ spawn tới mọi POI và điểm đến của gate, đồng thời kiểm tra vùng trống quanh spawn/điểm đến cho collider người chơi, collision terrain, vùng cầu, FX và liên kết POI–prop.

## Còn phải làm trước khi gọi là map hoàn thiện

Phần lớn prop vẫn lấy từ atlas có nền cảnh 128×128 quanh vật thể nên tạo mảng ô vuông cỏ/đá khi đặt vào map. Hai prop cutout mới xử lý lò rèn và trụ chuyển dòng trước; cần tiếp tục tách hoặc thay các cây lớn, cổng và landmark tương tác còn lại, rồi rà ảnh ở khung 640×360 cùng layout mobile. Terrain cũng lặp họa tiết khá dày, nhất là Thạch Cạn.

## Kiểm tra

- `node scripts/check-pixel-scenes.cjs` — đạt; kiểm tra đủ tile, terrain collision, khoảng trống collider ở spawn/gate, POI walkable và reachable, FX và prop links.
- `git diff --check` — đạt.
- Chưa chạy `presentation_smoke.gd` tại máy làm việc vì không có binary Godot; CI của repo dùng Godot 4.6.1 để kiểm tra runtime và xuất ảnh desktop/touch.
