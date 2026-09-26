# Tham khảo thiết kế tiến trình — 21/09/2026

Các nguồn dưới dùng để học quan hệ giữa hoạt động và mở khả năng.
Không sao chép số liệu, asset hoặc coi trải nghiệm thành công của game khác là
bằng chứng thiết kế này đã cân bằng.

| Game / nguồn sơ cấp | Nội dung nguồn hỗ trợ | Cách diễn giải cho Tu Tiên |
| --- | --- | --- |
| [Stardew Valley — About](https://www.stardewvalley.net/about/) | Kỹ năng mở công thức/khu vực; hang có quái, vật liệu và vũ khí | Cho vườn/chế tạo phục vụ chuyến đi, chuyến đi mang nguồn mới về |
| [Ngọc Rồng Online — hướng dẫn tân thủ](https://www.ngocrongonline.com/?c=skill) | Điểm tiềm năng gắn với học kỹ năng; đánh quái là một nguồn tiến bộ | Hiện mục tiêu gần “còn thiếu gì để mở kỹ năng”, không chỉ thanh XP |
| [V Rising — mô tả của Stunlock trên Steam](https://store.steampowered.com/app/1604030/V_Rising/) | Ngắm/né chủ động; phép thuật gắn với đánh bại đối thủ mạnh | Dùng tinh anh/boss kiểm tra cơ chế và mở tiến trình có ý nghĩa |

Ba hàng trên đã đọc được nguồn sơ cấp trong lần rà soát này.
Albion Online/Destiny Board là hướng tham khảo được nêu trong thảo luận trước;
[trang hướng dẫn chính thức](https://albiononline.com/guides/article/The-Destiny-Board%2B96)
không trả được nội dung đầy đủ trong lần kiểm tra này (403), nên không dùng nó
để khẳng định chi tiết cơ chế mới. Giao diện “làm gì → mở gì” trong bản cập nhật
được ghi là quyết định thiết kế của dự án, không là bản tái tạo Destiny Board.

## Nguồn dự án

Đã đọc nhánh `feat/inventory-rewards` tại
`05f5dd0eb9df36d5790e268879b8fbe3699994ea` qua kết nối GitHub; đối chiếu README,
implementation-status, history và bộ thiết kế 01–07. Mốc main còn ở `94fca39`.

[Trạng thái tại mốc nguồn](https://github.com/Vu-PTIT/tutien/blob/05f5dd0eb9df36d5790e268879b8fbe3699994ea/docs/implementation-status.md)
và [hợp đồng tài sản](https://github.com/Vu-PTIT/tutien/blob/05f5dd0eb9df36d5790e268879b8fbe3699994ea/docs/inventory-and-rewards.md)
là căn cứ phân biệt code đã có với đề xuất.

Tất cả XP quái, giá bán da, tiền quest, lịch respawn, research fee và bài tính
chuyến đi mới trong bản cập nhật là thông số thử do dự án đề xuất. Chưa có dữ liệu
chơi thử để khẳng định tối ưu thời lượng, giữ chân người chơi hoặc lợi nhuận.
