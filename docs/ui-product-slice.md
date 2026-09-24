# Godot UI product slice

Ngày 21/09/2026, bản thảo visual mockup được chuyển thành vertical slice chạy được trong Godot 4.4.1.

## Đã chuyển hóa

- **Khung hình:** viewport 640×360, scale integer 2×, lọc nearest.
- **Chủ đề:** 2D pixel top-down/3-4; vật liệu gỗ, tre, vải, đồng, đá và nước dùng chung cho toàn giao diện.
- **An Khê:** sông, đường đá, nhà, ruộng linh thảo, cây, đèn và NPC Bà Sâm được dựng procedural để chạy ngay cả khi chưa có sprite sheet.
- **HUD:** cảnh giới Luyện Khí tầng 1, HP/Qi, địa danh hiện tại, nhiệm vụ đang làm và minimap.
- **Túi đồ:** panel 24 ô, linh thạch, trạng thái gói khởi đầu, xem chi tiết vật phẩm; vẫn giữ `ItemList` ẩn để tương thích smoke test cũ.
- **Đấu tập:** dock tạo/vào/sẵn sàng/rời phòng; khi match chạy, HUD đổi sang Trúc Âm và giữ combat server-authoritative, HP, né, reconnect.

## Cấu trúc mở rộng

`client/scripts/main.gd` hiện là shell UI + world renderer. Phần vẽ procedural chỉ là lớp thay thế tạm thời: sprite sheet nhân vật, tileset An Khê/Trúc Âm và icon vật phẩm có thể được thêm vào mà không đổi adapter Nakama hoặc hợp đồng inventory.

Các mốc kế tiếp nên giữ nguyên thứ tự thiết kế: encounter PvE Sơn Trư → loot qua giao dịch đã kiểm chứng → vòng vườn/luyện đan → journal và hội thoại NPC.
