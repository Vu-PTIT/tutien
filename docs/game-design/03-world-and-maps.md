# 03 — Cấu trúc thế giới và hệ thống map (chuẩn hiện hành)

**Ngày chốt: 15/10/2026 — nhánh feat/fantasy-world.** Tài liệu này thay sơ đồ phân khu/map cũ. Chỉ dùng cấu trúc bên dưới làm chuẩn thiết kế mới. Map cũ trong code và tài liệu không phải canon mới.

## 1. Cấu trúc lớn

Thế giới có **khu Người** với hai trung tâm: **Làng** và **Thành phố**. Ở trung tâm lục địa là **Tâm Ẩn — một ngôi làng**. Bao quanh và nối với các trung tâm là **Lục Đại**, sáu vùng linh năng. Mỗi vùng có bốn khu quái theo cùng một mẫu: hai khu rìa quái yếu, một khu trung và một khu cao.

Lục Đại có **24 khu quái**. Cộng Làng, Thành phố và làng Tâm Ẩn là **27 khu chính**. Nhà cá nhân, phòng trong nhà, dungeon tầng phụ và đấu trường riêng chỉ thêm khi thiết kế; không đổi số khu chính.

## 2. Ba nơi an toàn

| Nơi | Vai trò | Nội dung chính |
|---|---|---|
| **Làng Người** | Điểm bắt đầu và trung tâm đời sống của Người | Nhà dân, sinh hoạt chung, dịch vụ cơ bản, hoạt động đời sống, lối ra khám phá |
| **Thành phố Người** | Trung tâm dân cư/dịch vụ lớn | Khu dân cư, quảng trường, chợ/dịch vụ, tổ chức và đầu mối tới Lục Đại |
| **Làng Tâm Ẩn** | Ngôi làng ở vùng trung tâm linh năng; nơi Tinh Linh bắt đầu/cư trú | Nhà và sân làng, cây trung tâm, suối/điểm Hấp Linh, nơi gặp gỡ, sáu lối ra |

Cả ba là nơi cư trú an toàn, không có quái thù địch. **Tâm Ẩn không phải đấu trường, lõi boss hay vùng nguy hiểm bậc cao.** Linh năng nơi đây đậm nhưng hài hòa.

Làng và Thành phố là hai khu chính của Người. Không thêm các map Người trung gian cho tới khi cần blockout tuyến nối.

## 3. Quy chuẩn chung cho mỗi vùng Lục Đại

| Khu | Độ nguy hiểm | Vai trò |
|---|---|---|
| **Rìa A** | Thấp | Bãi khám phá đầu tiên, dạy đọc địa hình và hành vi quái cơ bản |
| **Rìa B** | Thấp | Môi trường rìa thứ hai, độ khó ngang A nhưng địa hình, nhịp chơi và tài nguyên khác |
| **Trung** | Trung bình | Địa hình phức tạp hơn; quái tương tác với môi trường |
| **Cao** | Cao | Môi trường khắc nghiệt nhất vùng; quái mạnh/đầu đàn, boss nếu được duyệt |

Rìa A và Rìa B là hai map riêng, không gộp. Mỗi map có đường chính, nhánh khám phá, lối rút lui, điểm hoạt động phù hợp và dấu hiệu độ nguy hiểm.

Quái chỉ ở các khu quái. Làng, Thành phố và Tâm Ẩn không có quái thù địch. Không khóa cổng bằng cấp nhân vật hoặc tiến độ truyện; địa hình và dấu hiệu môi trường giúp người chơi chọn thử thách.

## 4. Khung danh mục

| Vùng | Khu 1 | Khu 2 | Khu 3 | Khu 4 |
|---|---|---|---|---|
| Mộc | Rìa A | Rìa B | Trung | Cao |
| Thủy | Rìa A | Rìa B | Trung | Cao |
| Kim | Rìa A | Rìa B | Trung | Cao |
| Phong | Rìa A | Rìa B | Trung | Cao |
| Thổ | Rìa A | Rìa B | Trung | Cao |
| Hỏa | Rìa A | Rìa B | Trung | Cao |

Tên trên là nhãn làm việc. Địa danh, vị trí, đường nối, loài quái và tọa độ cần thiết kế mới theo khung này.

## 5. Kích thước và art

Giữ quy chuẩn art [04](04-map-art.md): pixel art top-down 3/4, lưới logic vuông, 32 px là đơn vị quy đổi; asset đặt tự do theo pixel; hình ảnh quản lý bằng 5 nhóm G1–G5.

Kích thước thiết kế: Làng 96×72; Thành phố 128×96; Tâm Ẩn 80×60; mỗi map Rìa 112×80; Trung 128×96; Cao 80×80. Đây là chuẩn thiết kế, chưa phải dữ liệu backend đã migration. Chi tiết tại [05](05-map-layouts.md), quái tại [06](06-monsters.md), hiện trạng code tại [09](09-map-hien-trang.md).
