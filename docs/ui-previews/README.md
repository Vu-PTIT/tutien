# Xem trước giao diện

Ảnh trong thư mục này là bản dựng tĩnh từ scene Godot và tài nguyên pixel. Renderer Node.js không chạy GDScript; cần kiểm tra nội dung runtime, trạng thái nút và animation trong engine.

Tạo lại ảnh xem trước túi đồ bằng Node.js và package `sharp`:

```sh
node scripts/preview-pixel-ui.cjs docs/ui-previews
```

Để chụp giao diện đang chạy trong Godot, dùng `client/tests/presentation_smoke.gd --capture-dir` trên máy có rendering driver.
