# 10 — Quy mô map online

Tài liệu này giữ các nguyên tắc online và bỏ bảng kích thước/map cũ. Kích thước hiện hành ở [11](11-ti-le-map.md); cấu trúc map ở [03](03-world-and-maps.md), [05](05-map-layouts.md), [12](12-ban-do-cac-khu.md).

## 1. Mục tiêu online

- Tối đa 30 người chơi trong một kênh của một map; người tiếp theo vào kênh khác khi hệ thống kênh được triển khai.
- Làng, Thành phố và làng Tâm Ẩn là không gian gặp gỡ an toàn.
- Hai map Rìa trong mỗi vùng giữ mật độ quái thấp và có khoảng trống né đòn.
- Khu Trung và Cao tăng thử thách bằng địa hình/hành vi, không chỉ tăng số quái.
- Điểm hoạt động độc quyền cần có đủ vị trí hoặc cơ chế hàng đợi theo kênh.

## 2. Những phần chưa được xác nhận triển khai

Tại thời điểm cập nhật thiết kế, không suy ra đã có: giới hạn 30 người/kênh, đồng bộ người chơi thời gian thực, quái chung theo kênh, phân bổ slot theo kênh, hoặc geometry 27 map mới. Các phần này cần thiết kế kỹ thuật sau khi map và ID được chốt.

Backend đang dùng dữ liệu legacy; tốc độ 72 px/s chưa bằng mục tiêu thiết kế 128 px/s. Xem [09](09-map-hien-trang.md).
