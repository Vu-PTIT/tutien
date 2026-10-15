# Tu Tiên

Game pixel online fantasy cổ về Người, Tinh Linh và linh năng của Lục Đại.

## Chuẩn map hiện hành — 15/10/2026

- Khu Người có hai trung tâm: **Làng** và **Thành phố**, nằm giữa vùng Thủy và vùng Mộc.
- **Tâm Ẩn là một ngôi làng**, nơi Tinh Linh cư trú và bắt đầu.
- Lục Đại có sáu vùng linh năng; mỗi vùng gồm **hai khu quái Rìa yếu, một khu Trung và một khu Cao**.
- Tổng: **27 khu chính**. Khu Người nằm giữa Thủy và Mộc; tọa độ và tuyến cụ thể sẽ được thiết kế từ chuẩn này.
- Map runtime và backend hiện có là dữ liệu legacy, chưa migration; xem [hiện trạng map](docs/game-design/09-map-hien-trang.md).

## Tài liệu thiết kế

- [Mục lục và quyết định hiện hành](docs/game-design/README.md)
- [Thế giới và quy chuẩn map](docs/game-design/03-world-and-maps.md)
- [Map art](docs/game-design/04-map-art.md)
- [Thành phần mỗi map](docs/game-design/05-map-layouts.md)
- [Quái theo cấu trúc mới](docs/game-design/06-monsters.md)
- [Kích thước map](docs/game-design/11-ti-le-map.md)
- [Danh mục 27 khu](docs/game-design/12-ban-do-cac-khu.md)

## Art và tỉ lệ

Pixel art top-down 3/4; 32 px là đơn vị logic; asset đặt tự do theo pixel; hình ảnh quản lý bằng năm nhóm G1–G5. Xem [04 — Map art](docs/game-design/04-map-art.md).

## Code hiện có

Backend và client hiện có phần prototype, nhưng dữ liệu map/quái vẫn theo cấu trúc trước. Không coi chúng là bằng chứng rằng map mới đã dựng hoặc chạy. Chi tiết ở [09 — Hiện trạng](docs/game-design/09-map-hien-trang.md).
