# 12 — Khung danh mục map Lục Đại

**Chuẩn hiện hành 15/10/2026.** Nội dung này thay danh sách map và sơ đồ địa lý cũ. Địa danh, tọa độ và vị trí vùng chưa chốt.

## 1. Ba khu cư trú

| Khu | Vai trò | Kích thước mục tiêu |
|---|---|---:|
| **Làng Người** | Sinh hoạt và xuất phát của Người | 96×72 |
| **Thành phố Người** | Dịch vụ, tổ chức, kết nối của Người | 128×96 |
| **Làng Tâm Ẩn** | Làng trung tâm an toàn; nơi Tinh Linh bắt đầu/cư trú | 80×60 |

Không có quái thù địch tại các khu này.

## 2. Bốn khu cho mỗi vùng

Mỗi vùng linh năng có đúng bốn khu:

| Vùng | Rìa A — yếu | Rìa B — yếu | Trung | Cao |
|---|---|---|---|---|
| **Mộc** | Mộc-Rìa-A | Mộc-Rìa-B | Mộc-Trung | Mộc-Cao |
| **Thủy** | Thủy-Rìa-A | Thủy-Rìa-B | Thủy-Trung | Thủy-Cao |
| **Kim** | Kim-Rìa-A | Kim-Rìa-B | Kim-Trung | Kim-Cao |
| **Phong** | Phong-Rìa-A | Phong-Rìa-B | Phong-Trung | Phong-Cao |
| **Thổ** | Thổ-Rìa-A | Thổ-Rìa-B | Thổ-Trung | Thổ-Cao |
| **Hỏa** | Hỏa-Rìa-A | Hỏa-Rìa-B | Hỏa-Trung | Hỏa-Cao |

Các nhãn là tên làm việc, không phải địa danh hay ID cuối. Tổng: **24 khu quái**, cộng ba khu cư trú là **27 khu chính**.

## 3. Nguyên tắc nối map

- Làng và Thành phố là hai trung tâm khu Người, nối bằng tuyến được ghi rõ.
- Làng Tâm Ẩn là trung tâm cư trú của Tinh Linh, có lối tới sáu vùng.
- Trong mỗi vùng, người chơi có thể chọn Rìa A hoặc Rìa B trước; hai tuyến hội về Khu Trung rồi dẫn tới Khu Cao.
- Sáu vùng nối nhau theo hình dạng lục địa sẽ được thiết kế riêng. Chưa mặc định vòng đồng tâm, vòng biển/vòng trong hay sáu nan hoa.
- Cổng hai chiều có điểm đến an toàn. Đường cư trú không đi xuyên lãnh địa quái.
- Ghi tọa độ, hướng, vật mốc qua mép và tuyến rút lui trong layout trước khi cập nhật server.

## 4. Thứ tự thiết kế

1. Chốt hình dạng lục địa và vị trí ba khu cư trú.
2. Đặt sáu vùng linh năng lên bản đồ tổng thể.
3. Dựng hai khu Rìa, một Trung, một Cao cho từng vùng.
4. Thiết kế địa hình, quái, tài nguyên, tên và ID.
5. Duyệt blockout liên kết rồi mới migration backend.
