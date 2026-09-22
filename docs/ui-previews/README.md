# Xem trước bố cục — không phải screenshot Godot

- `village-layout-preview.png`: nền, nhân vật, HUD và hotbar.
- `inventory-layout-preview.png`: túi mở với dữ liệu mẫu.

Ảnh dựng từ `.tscn` và PNG thật bằng `scripts/preview-pixel-ui.cjs`, ở
640 × 360 rồi nhân đôi nearest. Renderer **không chạy GDScript/Godot**:
font, layout, disabled state, nội dung runtime và animation cần kiểm lại
trong engine. Nút nhận vật tư offline bị khóa trong script thực tế.

Tạo lại với Node và package `sharp` có sẵn:

```sh
node scripts/preview-pixel-ui.cjs docs/ui-previews
```

Chụp viewport thật bằng `presentation_smoke.gd --capture-dir` theo
`../ui-product-slice.md`, trên máy có Godot và rendering driver.
