# Thời tiết và chu kỳ ngày đêm

## Hành vi trong bản hiện tại

- Đồng hồ thế giới dùng Unix time để mọi máy có cùng thời điểm và lịch thời tiết. Một giây thực tương ứng một phút trong game; một ngày game kéo dài 24 phút.
- Trạng thái thời tiết được giữ trong từng khối sáu giờ trong game. Lịch xác định ổn định theo thời gian: 68% trời quang, 25% mưa và 7% mưa giông. Thời tiết độc lập với giờ trong ngày, nên mưa và giông vẫn có thể xảy ra ban đêm.
- Ánh sáng bình minh, ban ngày, hoàng hôn và ban đêm nhuộm riêng map; HUD giữ độ sáng bình thường. Mưa có cường độ tăng giảm dần trong 12 giây, kèm vệt mưa, âm thanh mưa, gợn nước và chớp sét/sấm khi có giông.
- Nút `FX` ở bảng thời tiết giảm chớp và tắt tiếng sấm; lựa chọn được lưu trong `user://visual_settings.cfg`.
- Thời tiết hiện chỉ tạo không khí, không đổi sát thương, cây trồng hay luật chơi. Cổ Tỉnh được bảo vệ trong nhà; khu Mỏ Cũ có profile che mưa.

## Khai báo map

Thêm `weather_exposure` vào map trong `client/data/map_catalog.json`:

| Giá trị | Ánh sáng | Mưa và âm thanh |
| --- | --- | --- |
| `outdoor` | Theo giờ và thời tiết | Bình thường |
| `sheltered` | Chuyển nhẹ về ánh sáng trong nhà | Mưa và âm thanh giảm còn 18%; không chớp/sấm |
| `indoor` | Ánh sáng ấm, không theo chu kỳ ngoài trời | Tắt mọi hiệu ứng thời tiết |

Map có nhiều khu có thể đặt `weather_exposure` trên từng phần tử của `areas`; giá trị khu sẽ ghi đè giá trị map. `GameMap` áp dụng lại profile khi người chơi đi qua ranh giới khu.

## Kiểm tra

```sh
godot --headless --path client --script res://tests/world_weather_smoke.gd -- --no-auto-connect
```

Để xem nhanh nắng ban ngày, mưa đêm, giông đêm và bình minh, chạy game với `--weather-preview`; mỗi trạng thái kéo dài 12 giây:

```sh
godot --path client -- --weather-preview --no-auto-connect
```

## Hướng dẫn Godot

- [Custom drawing in 2D](https://docs.godotengine.org/en/4.6/tutorials/2d/custom_drawing_in_2d.html) — vẽ các vệt mưa pixel mà không cần bộ hạt GPU.
- [CanvasItem](https://docs.godotengine.org/en/4.6/classes/class_canvasitem.html) — `modulate`, thứ tự vẽ và bộ lọc texture dùng cho hiệu ứng thế giới.
- [AudioStreamWAV](https://docs.godotengine.org/en/4.6/classes/class_audiostreamwav.html) — vòng lặp âm thanh mưa và hiệu ứng sấm.

Nếu thời tiết bắt đầu ảnh hưởng đến vườn, chiến đấu hoặc tiến trình chung, hãy chuyển đồng hồ và lịch thời tiết sang dữ liệu server-authoritative trước khi thêm luật gameplay.
