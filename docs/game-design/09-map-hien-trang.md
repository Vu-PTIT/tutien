# 09 — Hiện trạng map so với chuẩn mới

**Đối chiếu ngày 15/10/2026 — nhánh feat/fantasy-world.** Chuẩn mới gồm Làng Người, Thành phố Người, làng Tâm Ẩn và 24 khu quái theo sáu vùng × bốn khu.

## 1. Dữ liệu trong repository

Repository còn dữ liệu map/code thuộc cấu trúc cũ. Chúng không phải thiết kế hiện hành.

- server/data/life_world.json còn ID và kích thước cũ; chưa có 24 map quái theo mẫu mới.
- Dữ liệu cũ nối một map của Người trực tiếp với ID Tâm Ẩn; tuyến này không đại diện sơ đồ mới.
- server/src/world.ts khai báo tốc độ runtime 72 px/s; chuẩn thiết kế dùng mục tiêu 128 px/s.
- Scene Godot hiện có là gameplay prototype, chưa phải implementation đủ 27 map mới.
- Danh mục quái legacy không được dùng để suy ra tên, loài, số lượng hoặc tọa độ map mới.
- Tên cuối, vị trí sáu vùng, cổng, spawn và tọa độ mới chưa chốt.

## 2. Kích thước mục tiêu

| Loại | Số khu | Kích thước |
|---|---:|---:|
| Làng Người | 1 | 96×72 |
| Thành phố Người | 1 | 128×96 |
| Làng Tâm Ẩn | 1 | 80×60 |
| Rìa A/B | 12 | 112×80 mỗi khu |
| Trung | 6 | 128×96 mỗi khu |
| Cao | 6 | 80×80 mỗi khu |

Tổng 27 khu chính. Nhà riêng/instance nếu giữ là phần phụ.

## 3. Việc cần migration

1. Chốt hình dạng lục địa, vị trí hai khu Người, làng Tâm Ẩn và sáu vùng.
2. Đặt tên/ID 24 map quái và xác định tuyến nối.
3. Thay dữ liệu map/quái legacy; cập nhật kích thước, spawn, cổng, hoạt động, collision, nước/cầu và safe zone.
4. Đặt spawn Người tại Làng, Tinh Linh tại làng Tâm Ẩn.
5. Đổi tốc độ server thành 128 px/s sau khi kiểm tra toàn bộ xác thực khoảng cách.
6. Chạy kiểm tra backend/Godot sau khi schema/layout mới có mặt.

**Lần sửa này chỉ cập nhật tài liệu; backend và art chưa migration.**
