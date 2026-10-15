# 06 — Quy chuẩn quái theo cấu trúc map mới

**Chuẩn hiện hành:** mỗi vùng trong Lục Đại có bốn khu quái: hai khu Rìa yếu, một khu Trung và một khu Cao. Tổng cộng 24 khu. Tài liệu này thay danh sách quái/map cũ. Tên loài, số lượng, chỉ số, vật phẩm rơi và tọa độ chưa chốt.

## 1. Phân tầng

| Khu | Độ khó | Mục đích |
|---|---|---|
| Rìa A | Thấp | Dạy vòng chiến đấu và hệ của vùng |
| Rìa B | Thấp | Lựa chọn khám phá thứ hai, cơ chế khác Rìa A |
| Trung | Trung bình | Kết hợp chiến đấu với chướng ngại môi trường |
| Cao | Cao | Thử thách lớn của vùng, quái mạnh/đầu đàn; boss nếu cốt truyện xác định |

Đây là độ khó khu vực, không phải cấp nhân vật. Không khóa cổng bằng cấp hay nhiệm vụ. Dùng biển báo, địa hình và hành vi quái để báo nguy hiểm.

## 2. Quy tắc sinh thái

- Quái thường phản ánh hệ trội và môi trường tự nhiên của vùng.
- Hai map Rìa có độ khó ngang nhau nhưng không nhân bản cùng một nhóm quái rồi đổi màu.
- Khu Trung dùng quái phối hợp hoặc tương tác địa hình.
- Khu Cao dùng quái mạnh/đầu đàn. Boss chỉ đặt khi có vai trò trong cốt truyện vùng.
- Quái có lãnh địa rõ; không đặt tại spawn, dịch vụ, điểm hoạt động an toàn hoặc lối rút lui.
- Làng Người, Thành phố và làng Tâm Ẩn không có quái thù địch.
- Quái hai hệ chỉ dùng tại vùng giao thoa đã được xác định trên bản đồ mới.
- Nhiễm tím là biến cố/biến thể đặc biệt, không mặc định có trong mọi map Cao.

## 3. Biểu mẫu cho từng vùng

| Trường | Rìa A | Rìa B | Trung | Cao |
|---|---|---|---|---|
| Địa hình/vật mốc | Chưa chốt | Chưa chốt | Chưa chốt | Chưa chốt |
| Loài thường | Chưa thiết kế | Chưa thiết kế | Chưa thiết kế | Chưa thiết kế |
| Hành vi cần dạy | Cơ bản | Khác A | Kết hợp | Thử thách tổng hợp |
| Tài nguyên | Theo hệ | Bổ trợ | Trung cấp | Hiếm nếu được duyệt |
| Đầu đàn/boss | Không mặc định | Không mặc định | Không mặc định | Theo cốt truyện |
| Kết nối/rút lui | Ghi trong layout | Ghi trong layout | Ghi trong layout | Ghi trong layout |

Lặp bảng cho Mộc, Thủy, Kim, Phong, Thổ, Hỏa ở [12](12-ban-do-cac-khu.md). Không chép danh sách loài/map cũ vào thiết kế mới.

## 4. Quy tắc trận đánh

- Báo đòn bằng hoạt ảnh/âm thanh đọc được; hiệu ứng không che thân quái hoặc nhân vật.
- Luôn có thời gian né/đáp trả; không gây sát thương không báo trước.
- Địa hình hỗ trợ chiến thuật nhưng không tạo bẫy không lối thoát.
- Tăng thử thách bằng hành vi và địa hình, không chỉ tăng máu.
- Cân bằng theo Nội Giới sau khi có prototype; không ghi level quái nếu game không có cấp nhân vật.

## 5. Triển khai

Danh mục quái và tọa độ trong dữ liệu hiện hành là legacy, cần migration. Chưa có bộ quái mới được chốt hay triển khai.
