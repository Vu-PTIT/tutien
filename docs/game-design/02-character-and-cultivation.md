# 02 — Nhân vật, tu vi và cảnh giới

**Cập nhật:** 21/09/2026. **Chủ hệ thống:** gameplay + server.
**Phụ thuộc:** inventory, quest, encounter và UI tiến trình.
Các số trong tài liệu là cấu hình thử; runtime ở mốc nguồn chưa có tu luyện.

## 1. Tạo nhân vật và trạng thái ban đầu

Một tài khoản có một nhân vật gameplay MVP. Tài khoản Nakama, hồ sơ hiển thị và
trạng thái gameplay là các lớp khác nhau. Chọn ngoại hình, tên và xuất thân
người làm vườn/học việc thợ rèn/người đưa hàng; xuất thân chỉ đổi mô tả/hội thoại,
không tạo lợi thế tiền hoặc sức mạnh.

Bắt đầu `realm=mortal`, `realmStage=0`. Gói `starter:v1` cấp một lần theo tài khoản,
không cấp lại khi thử đổi tên hoặc tạo lại đường nhận thưởng.
Không quay linh căn, không yêu cầu bỏ tài khoản để có chỉ số tốt.

`q_main_003` là mốc chuyển sang `luyen_khi`, tầng 1: cấp công pháp `cp_tuc_mach`,
mở Phi Nhận, ghi `insight.breath_control` và XP quest trong cùng giao dịch.
Không mở phép ngay lúc login chỉ để khớp một kịch bản QA.

## 2. Các chiều phát triển

| Chiều | Đầu vào | Giá trị |
| --- | --- | --- |
| Cảnh giới | Tu vi + cờ điều kiện | Thuộc tính và khả năng mới |
| Công pháp | Học qua nội dung, thực hành | Cách sử dụng bộ kỹ năng |
| Pháp khí/vật tư | Nguyên liệu, chế tạo, lựa chọn | Tầm đánh, khả năng chuẩn bị |
| Tri thức | Dò mạch, khảo sát, quest | Nguồn tài nguyên và phương án giải quyết |
| Quan hệ | Quyết định và hỗ trợ NPC/tổ chức | Tin tức, dịch vụ, tuyến nhiệm vụ |

Trong UI MVP chỉ cần làm rõ tu vi, điều kiện lĩnh ngộ và trang bị/vật tư.
Không thêm “level nhân vật” trùng cảnh giới hoặc XP nghề chưa có vòng chơi.
Không dùng lực chiến tổng để quyết định trúng đòn hoặc khóa mọi cổng.

## 3. Thuộc tính cơ bản

| Thuộc tính | Phàm nhân | Luyện Khí 1 | Tăng mỗi tầng 2/3/4 |
| --- | --- | --- | --- |
| HP tối đa | 80 | 100 | +12 |
| Linh lực tối đa | 0 | 60 | +6 |
| Công kích | 8 | 12 | +2 |
| Phòng ngự | 5 | 10 | +2 |
| Tốc độ | 4 tile/giây | 4 tile/giây | Không tự tăng |

Thần thức nhập môn là 1; MVP chưa có chí mạng ngẫu nhiên, xuyên giáp hoặc nhiều
hệ kháng cộng dồn. Trang bị cộng riêng. Né không tốn linh lực để phàm nhân và
người cạn linh lực vẫn có cách phòng vệ. Tham số chiến đấu chi tiết ở [03](03-combat-skills-and-artifacts.md).

Đấu tập giữ chỉ số chuẩn riêng, không nhập sức mạnh PvE vào trận cân bằng.
Đột phá/trang bị không được làm biến đổi snapshot giữa một trận đang chạy.

## 4. Linh căn và công pháp

MVP dùng `rootProfile=balanced`, tư chất bình thường nhưng tu luyện được.
Không có xổ số tài khoản. Alpha mới thử sở trường Kim/Mộc/Thủy/Hỏa/Thổ với ngân
sách sức mạnh ngang nhau và cách đổi bằng nguyên liệu thường tại hub.

Tức Mạch Quyết là công pháp MVP. Đánh thường/né không chiếm ô; Phi Nhận, Hộ Thân,
Trói Mộc dùng 3 ô chủ động; Mạch Bàn là công cụ khám phá riêng.
Kỹ năng bắt buộc phải có nguồn bảo đảm, không khóa sau drop hiếm.

Đổi loadout ở hub, ngoài combat. Server xác nhận quyền sở hữu và lưu
`loadoutVersion`; vào match tạo snapshot hợp lệ. Không thay đồ giữa đòn để cộng
hiệu ứng hai bộ.

## 5. Cảnh giới và điều kiện đột phá

Phàm nhân → Luyện Khí 1 không yêu cầu XP, chỉ hoàn thành `q_main_003`.
Các ngưỡng sau tính trong tầng hiện tại:

<!-- generated:thresholds -->
| Chuyển tầng | Tu vi cần | Cờ bắt buộc | Khả năng mở |
| --- | --- | --- | --- |
| 1 → 2 | 300 | `insight.breath_control` | `sk_ho_than` |
| 2 → 3 | 600 | `insight.first_craft` | `sk_troi_moc` |
| 3 → 4 | 1000 | `story.ch1.complete` | Kết thúc phạm vi MVP |
<!-- /generated:thresholds -->

Luyện Khí 5–13/Trúc Cơ là Alpha, Kết Đan/Nguyên Anh là định hướng sau đó.
Hóa Thần trở lên không ở backlog sản xuất. Không thêm enum/cổng cấp cao vào runtime
khi chưa có luật xử lý. MVP không có phí hoặc nguyên liệu tiêu ở nút đột phá.

## 6. Tu vi đến từ đâu?

`cultivationXp` là điểm dùng để đột phá. `insightFlags` là bằng chứng trải nghiệm
cơ chế, không phải món có thể bán. Nguồn hợp lệ: quest một lần, khám phá một lần
và encounter đã được server quyết toán. Bảng XP chi tiết dùng chung [đặc tả](progression-pve-spec.md).

Không thưởng XP vì đứng online, spam vào không khí, PvP, trồng/thu lặp hoặc uống
thuốc hồi phục. Hồi Nguyên Hoàn giúp sống sót để vượt thử thách; nó không tăng tu vi.
Bài luyện né của phàm nhân không cho XP/loot lặp. XP một lần nhận trước Luyện Khí
được giữ dự trữ, nhưng quest chính 001–002 vẫn có XP bằng 0.

Tổng hành trình mẫu:

<!-- generated:milestones -->
| Mốc | Quest XP | XP ngoài quest | Dư trước | Tiêu đột phá | Dư sau |
| --- | --- | --- | --- | --- |
| to_stage_2 | 200 | 100 | 0 | 300 | 0 |
| to_stage_3 | 600 | 150 | 0 | 600 | 150 |
| to_stage_4 | 650 | 200 | 150 | 1000 | 0 |
<!-- /generated:milestones -->

Không ép giết đúng số quái trong mẫu; quest phụ/khám phá tạo lựa chọn thay thế.
Lên tầng sớm không bỏ qua điều kiện truyện, cổng map hoặc quyền nhận quest.

## 7. Giới hạn XP và xử lý dư

Nguồn encounter lặp được nhận đến mức `2 × ngưỡng kế tiếp` trong thanh tầng hiện
tại: một ngưỡng đủ lên và một ngưỡng dự trữ. Phần cấp lặp là:
`min(xpNguon, max(0, 2*nguong - xpHienTai))`. UI báo trước khi sắp chạm giới hạn.

Quest/khám phá **một lần** trước tầng 4 không bị cắt bởi giới hạn nguồn lặp;
reward truyện không thất bại chỉ vì đang dư XP. Chỉ trừ đúng ngưỡng khi đột phá;
phần đã được cấp còn lại được giữ. Cần giới hạn số nguyên an toàn và kiểm tra lỗi dữ liệu.

Tại tầng 4, XP mới bằng 0, loot cơ bản vẫn giữ theo nguồn công bố. Không có chuyển
XP thành tiền/vật liệu thưởng thêm. Đây là thay thế quy định v2 chưa định lượng
“đổi XP thành vật liệu”. Không xóa XP dư đã lưu; không hứa tự mở tầng mới bằng số đó.
UI hiện trần nội dung, không mời tiếp tục cày một thanh không có mốc mở.

## 8. Luồng đột phá

`locked → eligible → preparing → committing → completed`.

Server kiểm tra đang sống, ở hub, không combat/đấu tập, đúng tầng, đủ XP và cờ.
Client hiển thị điều kiện thiếu và quyền sẽ mở; không tự quyết định `eligible`.
Khi xác nhận: CAS profile, trừ XP, tăng tầng, mở kỹ năng và ghi receipt cùng giao dịch.
Hiệu ứng chỉ chạy sau thành công bền vững.

Đột phá thành công 100% khi đủ điều kiện. Hai yêu cầu cùng tầng chỉ thành công một lần,
kể cả operation ID khác nhau; source có tầng đích. Retry trả kết quả cũ, không trừ lại.
Mất mạng trước commit không mất gì; sau commit login đọc kết quả đã lưu.

## 9. Thiền và offline

Thiền ở hub phục hồi HP/linh lực miễn phí trong 10 giây khi không combat.
Không tăng tu vi theo thời gian online/offline. Cây vẫn trưởng thành bằng giờ server.
Alpha có thể thử dự trữ tĩnh dưỡng, nhưng chưa là cơ chế hoặc quyền lợi MVP.

## 10. Dữ liệu đề xuất, không thay schema đang chạy

Runtime tại mốc nguồn dùng schema hồ sơ 2 cho inventory. Đoạn dưới chỉ minh họa
**trường bổ sung tương lai**, không gán ngược `schemaVersion=1` và không coi schema 3 đã có.

```json
{
  "realm": "luyen_khi",
  "realmStage": 2,
  "cultivationXp": 150,
  "rootProfile": "balanced",
  "cultivationMethodId": "cp_tuc_mach",
  "insightFlags": ["insight.breath_control", "insight.first_craft"],
  "unlockedSkillIds": ["sk_basic", "sk_dodge", "sk_scan", "sk_phi_nhan", "sk_ho_than"],
  "activeSkillIds": ["sk_phi_nhan", "sk_ho_than"],
  "loadoutVersion": 1
}
```

Trước runtime phải thiết kế migration riêng từ schema 2, giữ tiền/túi/revision và
trường hợp dữ liệu lỗi. HP trong trận và chỉ số suy ra không do client ghi.
Nguồn và receipt XP dùng cùng tầng giao dịch với tài sản hoặc outbox đã kiểm chứng.

## 11. Giao diện và nghiệm thu

Bảng mục tiêu hiện tầng đích, kỹ năng mở, XP còn thiếu, cờ còn thiếu và địa điểm gợi ý.
Đủ XP mà chưa đủ truyện thì hiện tên nhiệm vụ, không chỉ một ổ khóa vô nghĩa.

| ID | Bài kiểm tra | Kết quả |
| --- | --- | --- |
| CUL-01 | Client tự gửi tầng/XP/skill | Bị từ chối |
| CUL-02 | Hai yêu cầu đột phá, cùng/khác ID | Chỉ trừ XP và mở tầng một lần |
| CUL-03 | Reconnect trước/sau commit | Khôi phục đúng trạng thái |
| CUL-04 | Thiếu cờ nhưng đủ XP | Không tiêu; UI chỉ rõ điều kiện |
| CUL-05 | XP lặp vượt dự trữ | Cấp phần hợp lệ, thông báo rõ; không âm |
| CUL-06 | Quest một lần khi đã đầy dự trữ | Giữ đủ XP đã hứa trước trần MVP |
| CUL-07 | Tầng 4 hoặc yêu cầu tầng 5 | Không thưởng XP mới/không tiêu để mở nội dung chưa có |
| CUL-08 | Trang bị/kỹ năng không sở hữu | Không tạo loadout trái phép |
| CUL-09 | Nhận starter lần nữa | Chặn bằng source receipt |
| CUL-10 | Migration gặp tầng/schema lỗi | Giữ bản gốc để rà soát, không reset tài sản |

Người chơi cần giải thích được tại sao lên tầng và mình làm được gì mới.
Kiểm thử lưu trữ thật bắt buộc; validator thiết kế không thay thế runtime test.
