# 02 — Nhân vật, linh căn, tu vi và cảnh giới

**Chủ hệ thống:** gameplay + server.  
**Phụ thuộc:** dữ liệu nhân vật, quest, inventory, combat; xem 03, 06, 10.  
**Lưu ý:** hệ thống và con số dưới đây là thiết kế của game, không phải bảng cảnh giới chính thức của phim.

## 1. Tạo nhân vật

Một tài khoản có một nhân vật gameplay trong MVP. Dữ liệu tài khoản Nakama, hồ sơ hiển thị và trạng thái gameplay là các lớp khác nhau.

Người chơi chọn tên hiển thị, ngoại hình cơ bản và một câu xuất thân. Ba xuất thân dự kiến: người làm vườn, học việc thợ rèn, người đưa hàng. Trong MVP, chúng thay hội thoại/mô tả; không tạo lợi thế tiền hoặc sức mạnh khác nhau.

Không quay linh căn ngẫu nhiên, không xóa nhân vật để nhận lại gói khởi đầu. Bộ vật tư khởi đầu cấp một lần theo tài khoản/nhân vật và ghi dấu đã nhận.

### Trạng thái ban đầu

`realm = mortal`, chưa có kỹ năng tu luyện. Sau nhiệm vụ `q_main_003`, server chuyển sang `luyen_khi`, tầng 1. Nhân vật ban đầu là một người làm việc ở An Khê, không được mặc định là người cứu thế.

## 2. Năm chiều phát triển

| Chiều | Đầu vào | Đầu ra | Không thay thế được |
|---|---|---|---|
| Cảnh giới | Tu vi, lĩnh ngộ, điều kiện nhiệm vụ | Giới hạn tài nguyên và khả năng mới | Kỹ năng điều khiển |
| Công pháp | Quyển pháp, thử thách, luyện tập | Kỹ năng, nhánh hiệu ứng | Tất cả loại trang bị |
| Pháp khí | Nguyên liệu, chế tạo, lựa chọn | Tầm đánh, tiết tấu, bổ trợ | Mọi build cùng lúc |
| Tri thức | Dò mạch, đọc dấu, quest | Điểm thu thập, công thức, lựa chọn | Tu vi miễn phí vô hạn |
| Quan hệ | Hành động với NPC/tổ chức | Tin tức, dịch vụ, tuyến nhiệm vụ | Quyền áp đảo người chơi khác |

Không sử dụng “lực chiến tổng” làm điều kiện duy nhất để vào map hoặc quyết định trúng đòn.

## 3. Thuộc tính chiến đấu đề xuất

| Thuộc tính | Ý nghĩa | Luyện Khí 1, chưa trang bị |
|---|---|---:|
| Sinh lực `hpMax` | Khả năng chịu đòn | 100 |
| Linh lực `qiMax` | Nhiên liệu pháp thuật | 60 |
| Công kích `attack` | Thành phần sát thương | 12 |
| Phòng ngự `defense` | Thành phần giảm sát thương | 10 |
| Tốc độ `moveSpeedTiles` | Tốc độ trên mặt phẳng | 4 tile/giây |
| Thần thức `perception` | Điều kiện dò một số dấu vết | 1 |
| Chí mạng | MVP chưa có RNG chí mạng | 0% |
| Kháng khống chế | MVP dùng miễn nhiễm theo trạng thái, chưa cộng dồn chỉ số | 0 |

Phàm nhân trong hướng dẫn dùng HP 80, linh lực 0, công kích 8, phòng ngự 5; được đánh thường và né miễn linh lực. Các kỹ năng tu luyện vẫn khóa cho đến `q_main_003`.

Tầng 2/3/4 tăng HP mỗi tầng 12, linh lực 6, công kích 2, phòng ngự 2. Tốc độ không tự tăng theo tầng. Trang bị cộng riêng và bị giới hạn bởi ngân sách thiết kế.

Mốc tầng 4 không được khiến một người có thể giết đối thủ mới bằng đòn không có cơ hội phản ứng trong đấu tập. Đấu tập dùng bộ chỉ số chuẩn riêng.

## 4. Linh căn: cá tính build, không xổ số tài khoản

### MVP

Mọi nhân vật dùng `root_profile = balanced`. Linh căn được mô tả là không nổi trội nhưng tu luyện được; chưa có chọn hệ ảnh hưởng chỉ số.

### Alpha

Mở một sở trường chính trong năm hệ Kim/Mộc/Thủy/Hỏa/Thổ bằng nhiệm vụ. Sở trường đổi cách sử dụng kỹ năng, không đổi tổng ngân sách sức mạnh.

Ví dụ đề xuất: Mộc giúp quản lý vùng khống chế; Hỏa ưu tiên gây áp lực theo thời gian; Thổ ưu tiên chống gián đoạn. Mỗi ưu thế cần một hạn chế tương ứng.

Cho đổi sở trường tại hub bằng vật liệu thông thường và xác nhận rõ. Không bán lượt quay linh căn hoặc tạo lựa chọn sai không thể cứu.

## 5. Cấu trúc cảnh giới dài hạn

| Giai đoạn | Phạm vi nội dung dự kiến | Mở thêm điều gì |
|---|---|---|
| Phàm nhân | Mở đầu chương 1 | Dẫn khí, tiếp xúc thế giới tu luyện |
| Luyện Khí 1–4 | MVP | Một bộ kỹ năng, vườn, công pháp cơ bản |
| Luyện Khí 5–9 | Alpha phần đầu | Lựa chọn build, nghề, quan hệ tông môn |
| Luyện Khí 10–13 | Alpha phần sau | Chuẩn bị Trúc Cơ và thử thách nhiều bước |
| Trúc Cơ: sơ/trung/hậu | Thử sơ kỳ sau khi Alpha có nền | Nguồn lực chiến thuật mới, phường thị và vùng xa |
| Kết Đan | Sau Alpha | Pháp bảo mang dấu ấn cá nhân, xung đột vùng |
| Nguyên Anh | Tầm nhìn dài hạn | Vai trò thế lực và chiến lược |
| Hóa Thần trở lên | Chưa lên backlog sản xuất | Chỉ giữ chỗ trong định hướng thế giới |

Không cần tạo sẵn toàn bộ enum cấp cao trong code runtime. Catalog chỉ được phát hành những định nghĩa có thể xử lý an toàn.

## 6. Tu vi và lĩnh ngộ

**Tu vi (`cultivationXp`)** là điểm tích lũy trong tầng hiện tại. Nhận từ quest lần đầu, encounter phù hợp, mốc khám phá hoặc huấn luyện có giới hạn nội dung.

**Lĩnh ngộ (`insightFlags`)** là bằng chứng đã tiếp xúc một cơ chế: hoàn thành dẫn khí, tự luyện một đan, hiểu trận bảo vệ. Đây là cờ tiến trình, không phải vật phẩm có thể bán.

MVP không cho tu vi chỉ vì online, đứng yên hoặc spam kỹ năng vào không khí. Trồng/thu cùng loại cây lặp không tự sinh tu vi chiến đấu vô hạn.

### Bảng ngưỡng MVP

| Chuyển tầng | Tu vi cần, tính trong tầng | Cờ điều kiện | Kết quả |
|---|---:|---|---|
| Phàm nhân → Luyện Khí 1 | Không cần XP | `q_main_003` hoàn tất | Mở linh lực và Phi Nhận |
| Luyện Khí 1 → 2 | 300 | `insight.breath_control` | Tăng giới hạn; mở Hộ Thân |
| Luyện Khí 2 → 3 | 600 | `insight.first_craft` | Mở Trói Mộc |
| Luyện Khí 3 → 4 | 1.000 | `story.ch1.complete` | Kết thúc mốc MVP; tăng thuộc tính |
| Tầng 4 → cao hơn | Khóa ở bản MVP | `content_not_available` | UI không tiêu vật tư |

Điểm vượt ngưỡng được giữ trong giới hạn một ngưỡng dự trữ của tầng hiện tại; không âm thầm mất XP. Tại tầng 4, MVP dừng thưởng XP và đổi phần thưởng được thiết kế trước thành vật liệu không giao dịch; UI thông báo ngay trước khi nhận nhiệm vụ lặp.

Không tự biến phần thưởng XP thành tiền theo tỷ lệ động.

## 7. Luồng đột phá MVP

`locked → eligible → preparing → committing → completed`.

1. Server kiểm tra trạng thái sống, đang ở hub, không combat, không trong đấu tập.
2. Tính lại XP và cờ lĩnh ngộ từ dữ liệu đã lưu.
3. Client hiện rõ điều kiện thiếu và phần nhận được.
4. Khi xác nhận, server thực hiện một giao dịch: trừ ngưỡng XP, tăng tầng, ghi receipt, cập nhật mở khóa.
5. Chỉ sau khi lưu thành công mới chạy hiệu ứng chúc mừng và cho dùng kỹ năng mới.

**MVP đột phá thành công 100% khi đủ điều kiện.** Sự khó đến từ hành trình chuẩn bị, không từ một nút quay xác suất.

Ngắt kết nối trước commit: không trừ gì. Ngắt kết nối sau commit: đăng nhập lại đọc kết quả đã có. Hai yêu cầu đột phá đồng thời chỉ được thực hiện một lần ở cùng tầng.

### Hướng Trúc Cơ trong Alpha

Dùng thử thách nhiều phần: lĩnh ngộ công pháp, nguyên liệu, một encounter và quyết định quan hệ. Chưa chọn cơ chế xác suất thất bại. Chỉ bổ sung rủi ro khi có lý do gameplay và phương án phục hồi rõ ràng.

## 8. Thiền định, offline và cảm giác thời gian dài

Không lấy việc treo máy nhiều giờ làm cách chơi tối ưu.

MVP không có tu vi offline. Cây vẫn trưởng thành theo thời gian server. Thiền tại hub chỉ phục hồi HP/linh lực và diễn giải tu luyện; hồi đầy miễn phí trong 10 giây khi không combat.

Alpha có thể thử “dự trữ tĩnh dưỡng” tối đa 8 giờ để tăng tốc thực hành một lượng nhỏ sau khi đăng nhập. Đây là đề xuất chưa triển khai; không được đổi thẳng thành vật phẩm hiếm, cấp bậc hoặc PvP thắng tự động.

## 9. Công pháp và đổi build

MVP có `cp_tuc_mach`, một công pháp nhập môn. Có 3 ô kỹ năng chủ động; kỹ năng chưa mở thì ô hiển thị điều kiện, không tự thay bằng nút mua.

Alpha mới thêm các công pháp thiên kiếm, phù và thủ ngự. Kỹ năng bắt buộc của tuyến chính phải có phương án nhận bảo đảm qua quest hoặc chế tạo; không khóa tiến trình sau drop cực hiếm.

Đổi kỹ năng ở hub, ngoài combat. Server lưu `loadoutVersion`; lúc vào match tạo snapshot hợp lệ. Không cho đổi bộ đồ giữa đòn đánh để hưởng hai bộ hiệu ứng.

## 10. Dữ liệu tối thiểu

```json
{
  "schemaVersion": 1,
  "characterId": "server-created-id",
  "realm": "luyen_khi",
  "realmStage": 2,
  "cultivationXp": 120,
  "rootProfile": "balanced",
  "cultivationMethodId": "cp_tuc_mach",
  "insightFlags": ["insight.breath_control"],
  "unlockedSkillIds": ["sk_basic", "sk_dodge", "sk_phi_nhan", "sk_ho_than", "sk_scan"],
  "activeSkillIds": ["sk_phi_nhan", "sk_ho_than"],
  "loadoutVersion": 3
}
```

Ví dụ hợp đồng dữ liệu; không phải dữ liệu thật của tài khoản. HP hiện tại trong trận và chỉ số suy ra không được client ghi vào đây.

## 11. Các kiểm thử bắt buộc

| ID | Tình huống | Kết quả mong đợi |
|---|---|---|
| CUL-01 | Gửi tầng đích 99 từ client | Từ chối; tầng đích do server suy ra |
| CUL-02 | Có đủ XP nhưng thiếu lĩnh ngộ | Không trừ XP, trả điều kiện thiếu |
| CUL-03 | Double-click xác nhận | Một lần tăng tầng |
| CUL-04 | Disconnect sau khi commit | Đọc đúng tầng mới, không cấp lại |
| CUL-05 | Đổi giờ máy để thiền | Không tăng tu vi |
| CUL-06 | Đang trong match gửi đột phá | Từ chối theo trạng thái |
| CUL-07 | Nhận XP khi chạm trần MVP | Thực hiện đúng chính sách cap đã hiển thị |
| CUL-08 | Đổi công pháp có skill chưa sở hữu | Không tạo loadout trái phép |
| CUL-09 | Nhận gói khởi đầu lần hai | Receipt/cờ đã nhận chặn cấp lặp |
| CUL-10 | Migration gặp tầng không hợp lệ | Cách ly dữ liệu, không tự sửa tiền/đồ |

## 12. Nghiệm thu

Người chơi giải thích được tại sao được lên tầng, thấy khác biệt khi mở kỹ năng và không phải tạo lại tài khoản để có linh căn tốt. Các bài kiểm tra đồng thời/mất kết nối phải chạy trên lưu trữ thật, không chỉ mock.
