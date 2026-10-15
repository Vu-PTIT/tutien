# Tu Tiên — Game Design

**Chuẩn hiện hành: 15/10/2026, nhánh feat/fantasy-world.** Tài liệu map trước đây đã được thay bằng cấu trúc mới; không dùng danh sách địa danh, layout, quái hay sơ đồ cũ làm chuẩn tiếp tục.

## Cấu trúc map đã chốt

- Khu Người có hai trung tâm chính: **Làng** và **Thành phố**.
- **Tâm Ẩn là một ngôi làng**, trung tâm an toàn và nơi Tinh Linh bắt đầu.
- **Lục Đại** gồm sáu vùng linh năng. Mỗi vùng có hai khu quái Rìa yếu, một khu Trung và một khu Cao.
- Tổng cộng **27 khu chính**: ba khu cư trú + 24 khu quái.
- Quy chuẩn art: pixel top-down 3/4, đơn vị logic 32 px, asset tự do theo pixel, năm nhóm hình ảnh G1–G5.
- Tỉ lệ map đã chốt tại [11](11-ti-le-map.md). Runtime/code vẫn legacy; xem [09](09-map-hien-trang.md).

## Tài liệu

| # | Tài liệu | Vai trò |
|---|---|---|
| 01 | [Gameplay](01-gameplay.md) | Hai role và vòng chơi |
| 02 | [Cốt truyện](02-story.md) | Tiền đề và hướng truyện |
| 03 | [Thế giới và map](03-world-and-maps.md) | Cấu trúc 27 khu |
| 04 | [Map art](04-map-art.md) | Phong cách và cách dựng |
| 05 | [Thành phần map](05-map-layouts.md) | Những gì mỗi loại map cần có |
| 06 | [Quái](06-monsters.md) | Phân tầng quái cho 24 khu |
| 07 | [Nội Giới](07-power-system.md) | Hệ thống sức mạnh |
| 08 | [Hoạt động đời sống](08-life-yields.md) | Nguyên tắc đặt hoạt động |
| 09 | [Hiện trạng](09-map-hien-trang.md) | So sánh thiết kế với code |
| 10 | [Online](10-kich-thuoc-map-online.md) | Mục tiêu kênh và mật độ |
| 11 | [Kích thước](11-ti-le-map.md) | Kích thước map chuẩn |
| 12 | [Danh mục map](12-ban-do-cac-khu.md) | 3 nơi an toàn + 24 khu quái |

## Những phần chưa chốt

Tên địa danh, vị trí sáu vùng, hình dạng lục địa, mạng đường/cổng, bố cục chi tiết 24 khu và danh sách loài quái. Thiết kế các phần này từ khung mới, không lấy tên cũ làm mặc định.
