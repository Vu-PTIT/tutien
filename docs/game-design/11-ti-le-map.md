# 11 — Kích thước và tỉ lệ chuẩn map

**Đã chốt 15/10/2026.** Áp dụng cho hai khu Người, làng Tâm Ẩn và mẫu bốn khu lặp lại của mỗi vùng Lục Đại.

## 1. Đơn vị

- 1 ô logic = 32 px, dùng ghi kích thước, tọa độ, khoảng cách và tốc độ.
- Asset đặt tự do theo pixel nguyên; không bắt buộc kích thước bội 32 hoặc snap theo ô.
- Dùng lọc Nearest và zoom nguyên để giữ pixel sắc.
- Tốc độ thiết kế: **4 ô/giây = 128 px/giây**. Runtime cần migration; xem [09](09-map-hien-trang.md).

## 2. Kích thước

| Vai trò | Kích thước ô | Pixel ở zoom ×1 |
|---|---:|---:|
| Làng Người | 96×72 | 3072×2304 |
| Thành phố Người | 128×96 | 4096×3072 |
| Làng Tâm Ẩn | 80×60 | 2560×1920 |
| Rìa A | 112×80 | 3584×2560 |
| Rìa B | 112×80 | 3584×2560 |
| Trung | 128×96 | 4096×3072 |
| Cao | 80×80 | 2560×2560 |

Cao là độ nguy hiểm, không quy định địa hình cao độ.

## 3. Quy mô

Ba khu cư trú + 24 khu quái = **27 khu chính**. Nhà riêng/instance được tính riêng nếu dự án giữ. Kích thước là chuẩn thiết kế, không khẳng định backend đã cập nhật.

## 4. Mật độ

Làng, Thành phố và Tâm Ẩn ưu tiên định hướng và các cụm chức năng. Hai map Rìa có ít quái, đủ khoảng né. Khu Trung có nhiều tuyến/chướng ngại; khu Cao có vùng chiến đấu và đường rút lui rõ. Không lấp đầy map bằng props hoặc hiệu ứng.

Thiết kế layout trong [05](05-map-layouts.md), khung danh mục trong [12](12-ban-do-cac-khu.md), hiện trạng code trong [09](09-map-hien-trang.md).
