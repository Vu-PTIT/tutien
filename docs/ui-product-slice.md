# Nền để thiết kế lại giao diện bản đồ — 30/09/2026

Nhánh `feat/map-ui-rebuild` bắt đầu từ `feat/p4-map-pixel-art` và đã gỡ phần trình bày bản đồ cũ để chuẩn bị dựng giao diện mới.

## Đã gỡ

- Minimap, sơ đồ tuyến, bảng xem chi tiết bản đồ và nút mở các bảng đó.
- Thẻ tên khu vực, hướng dẫn vùng và lời nhắc điểm tương tác trong HUD.
- Nhãn địa danh nổi trên thế giới, ảnh preview tuyến và ảnh thu nhỏ từng map.
- Các script và scene chỉ phục vụ những giao diện bản đồ cũ.

## Còn dùng trong runtime

- `client/scripts/map_catalog.gd` đọc catalog dữ liệu mà không phụ thuộc vào giao diện.
- `client/scenes/map_world.tscn` và `client/scripts/game_map.gd` dựng TileMapLayer, va chạm, props, hiệu ứng thời tiết, NPC, điểm tương tác và quái.
- Dữ liệu map, cổng qua lại, điểm đến, camera theo phòng và logic di chuyển vẫn được giữ.
- Các giao diện túi đồ, nhân vật, bạn bè/chat/bang hội, thời tiết và điều khiển vẫn hoạt động.

Phím **M** tạm hiện thông báo giao diện đang được làm lại. Người chơi vẫn có thể đi giữa các vùng qua cổng trong thế giới. Nhánh này chưa chứa thiết kế map/UI mới vì ý tưởng mới chưa được triển khai.

## Kiểm tra

```sh
node scripts/check-pixel-scenes.cjs
godot --headless --path client --editor --quit
godot --headless --path client --script res://tests/presentation_smoke.gd
godot --headless --path client --script res://tests/localization_smoke.gd
```

Static audit kiểm tra đường dẫn tài nguyên, scene và các điều kiện cơ bản; hai lệnh Godot kiểm tra runtime. Godot chưa có trong môi trường thao tác này, nên smoke test Godot cần được chạy trong Godot 4.6.1.
