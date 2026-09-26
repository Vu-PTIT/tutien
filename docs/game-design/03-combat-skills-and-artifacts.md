# 03 — Chiến đấu, kỹ năng, pháp khí và quái PvE

**Cập nhật:** 21/09/2026. Top-down 2D, solo hoặc co-op 2 người.
**Trạng thái:** đặc tả, không phải PvE đã triển khai.
Dùng [nguồn số liệu chung](progression-pve-spec.md), không tự đặt XP/loot khác ở module combat.

## 1. Cảm giác cần đạt

Nhìn đòn → chọn vị trí → ra đòn hoặc né → quản lý linh lực → phản công → cân nhắc rút.
Ít nút nhưng từng nút có công dụng. Có chỗ tránh, góc phản công và đường quay về.
Không dùng hiệu ứng che kín mặt đất hoặc thêm HP thay cho thiết kế tình huống.

Phi Nhận cho cách đánh giữ khoảng cách; Hộ Thân giải quyết một thời điểm nguy hiểm;
Trói Mộc giúp quản lý vị trí. Người cạn linh lực vẫn đánh thường và né được.

## 2. Điều khiển và trạng thái

Windows dự kiến: WASD/mũi tên di chuyển, chuột trái/J đánh, Space né, Q/E/R ba kỹ
năng, F tương tác, 1/2 vật phẩm, Tab Mạch Bàn. Cho đổi phím; lệnh server là action ID.
Android dự kiến joystick trái + nút hành động; chưa là bản client đã xuất.

`idle / moving / windup / active / recovery / dodging / incapacitated / dead`.
Cho hủy windup trước active; kỹ năng tiêu linh lực khi server chấp nhận active.
Không chồng hai active để nhân sát thương; không đổi map/loadout khi đang có tác động combat.
Client có thể dự đoán animation nhưng không tự quyết định HP, hit, loot hoặc chết.

## 3. Sáu hành động MVP

| ID | Mở khóa | Linh lực | Hồi chiêu | Hiệu ứng |
| --- | --- | --- | --- | --- |
| `sk_basic` | Đầu game | 0 | 0,7 giây | Chém cung trước, tầm 1,3 tile |
| `sk_dodge` | Hướng dẫn | 0 | 2,4 giây | Lướt 2,2 tile trong 0,25 giây, không xuyên tường |
| `sk_phi_nhan` | Luyện Khí 1 | 10 | 3 giây | Đạn thẳng, tầm 6 tile, tốc độ 10 tile/giây |
| `sk_ho_than` | Luyện Khí 2 | 14 | 10 giây | Khiên 35 sát thương, tối đa 5 giây |
| `sk_troi_moc` | Luyện Khí 3 | 12 | 8 giây | Vùng tầm 4 tile, chậm 50% trong 1,5 giây, tối đa 2 mục tiêu |
| `sk_scan` | Nhận Mạch Bàn | 0 | 5 giây | Dò 6 tile, đứng yên 1 giây |

Đánh thường/né không chiếm ô chủ động. Né miễn sát thương từ 50 đến trước 200 ms
sau bắt đầu, do server quyết định; cần kiểm thử biên tick 50 ms. MVP chưa cần đòn
không thể né. Không dùng timestamp client tùy ý để rewind.

Hồi linh lực khi không active: 3/giây trong combat, 6/giây ngoài combat.
Sau 5 giây không gây/nhận sát thương mới coi là ngoài combat; không tự hồi HP giữa trận.
Ở hub có nghỉ miễn phí như [02](02-character-and-cultivation.md).

Trói Mộc không cộng dồn phần trăm; một lần áp dụng không dài hơn 1,5 giây và có
miễn tái làm chậm 2 giây sau khi hết. Hộ Thân không cộng khiên cùng loại, dùng mức lớn hơn.

## 4. Công thức sát thương

```text
raw = attack * coefficient + flatBonus
mitigated = raw * 100 / (100 + max(0, defense))
damage = max(1, floor(mitigated))
```

Đánh thường hệ số 1; Phi Nhận hệ số 1,6 cộng 4; Trói Mộc hệ số 0,6.
Khiên chịu trước HP. Không có chí mạng RNG, xuyên giáp hoặc nhân sát thương theo
chênh cảnh giới trong MVP. Ví dụ attack 16, Phi Nhận, defense 20 gây 24 sát thương.

Server tính từng mục tiêu, kiểm tra giá trị hữu hạn và catalog đúng phiên bản.
Không nhận damage, số quái chết hoặc phần thưởng từ client.

## 5. Quái: chiến lợi phẩm và hành vi

<!-- generated:enemies -->
| ID / tên | HP solo | XP / lần hợp lệ | Loot bảo đảm / người | Hồi sinh thử |
| --- | --- | --- | --- | --- |
| `en_boar` — Sơn Trư | 60 | 10 | `it_boar_hide` ×1 | 45 giây |
| `en_spider` — Độc Chu | 45 | 15 | `it_spider_silk` ×1 | 60 giây |
| `en_scout` — Kẻ Rình Đường | 80 | 20 | `it_iron` ×1 | 60 giây |
| `en_guard` — Thạch Vệ | 180 | 50 | `it_spirit_dust` ×1 | 180 giây |
| `en_boss` — Mộc Tâm Thủ Trận | 700 | 100 | `it_spirit_dust` ×2 | Lượt bí cảnh mới |
<!-- /generated:enemies -->

HP giữ theo v2; attack/defense, các nhịp AI và loot mới là điểm khởi đầu cần thử.
Quái thường không rơi thẳng linh thạch; tiền đến từ bán vật liệu và quest.

| Quái | Attack / defense thử | Nhịp và bài học |
| --- | --- | --- |
| Sơn Trư | 10 / 5 | Gầm, khóa hướng 0,75 giây → lao 4 tile/0,4 giây → hồi thế 0,8 giây; né ngang và phản công |
| Độc Chu | 8 / 0 | Báo vùng 0,8 giây → phun độc → hồi thế 0,7 giây; rời mặt đất nguy hiểm |
| Kẻ Rình Đường | 12 / 8 | Báo ngắm 0,8 giây → bắn đường thẳng tầm 6 tile → hồi 0,9 giây; dùng vật cản |
| Thạch Vệ | 18 / 20 | Phòng thủ phía trước → báo vung 1 giây → đánh → hồi 1,2 giây; chờ/lách sườn |
| Mộc Tâm | 16 / 12 | Quét, rễ, trụ cấp, cơ hội niêm phong; tổng hợp những gì đã học |

Đòn cơ bản của quái dùng hệ số 1, không bonus. P1 khóa hitbox, active/recovery và
sát thương Sơn Trư trong `server/src/pve_son_tru.ts`; các quái P2/P5 cần catalog
và kiểm thử riêng trước khi mở runtime.
Đề xuất vùng độc: bán kính 1,3 tile, tồn tại 3 giây, tick mỗi giây với hệ số 0,4;
cùng nguồn không cộng dồn nhiều vùng sát thương lên một mục tiêu trong cùng tick.
Thạch Vệ giảm 70% sát thương từ cung trước khi đang phòng thủ, không bất tử mọi hướng.

AI Sơn Trư P1 chạy theo `idle → notice → chase → windup → charge → recover` ở 20 Hz.
Bán kính phát hiện 5 tile, truy đuổi tối đa 10 tile; khóa hướng 0,75 giây, lao
4 tile trong 0,4 giây, hồi 0,8 giây. Vị trí, va chạm, né, sát thương và HP do
server tính; tảng gỗ chắn đường đi và đường đánh. Chết hồi sinh sau 3 giây, Sơn Trư
tái xuất sau 45 giây. Bản P1 chỉ thử combat nên không cấp XP, linh thạch hay loot.

## 6. Encounter hướng dẫn và cày lặp

Lần đầu gặp Sơn Trư có một con riêng, nền thoáng và đường rút. Hướng dẫn nhìn
báo đòn → né ngang → đánh lúc hồi thế. Sau đó mới ghép hai hướng tấn công,
Độc Chu và vật cản. Không đặt nhóm quái đông ngay chỗ spawn.

Encounter hướng dẫn phàm nhân không cho XP/loot lặp. Quái ngoài đồng sau khi đã
Luyện Khí có bảng thưởng chuẩn. Tutorial flag và quyền thưởng do server tạo,
không chấp nhận `tutorial=true` hoặc `reward=true` từ client.

Cụm quái có mã spawn, generation và encounter duy nhất. Reset HP/thua không thưởng.
Hồi sinh theo [04](04-world-and-maps.md); rời/vào lại không làm mới quyền thưởng.
Không để boss sinh thêm quái vô hạn để farm XP phụ.

## 7. Boss chương đầu

**100–60% HP:** quét có báo 0,7 giây; rễ thẳng báo 0,9 giây. Có đường né đủ rộng
cho tốc độ cơ bản, không đòi vật phẩm tăng tốc.

**60–25%:** hai trụ linh mạch lần lượt hoạt động; phá trụ hoặc đọc điểm ngắt bằng
Mạch Bàn làm giảm áp lực. Phá trụ không tự cấp thêm reward lặp ngoài encounter.

**Dưới 25%:** có khoảng để hoàn thành niêm phong hoặc hạ tâm trận. Hai cách đều
mở tiến trình và cùng ngân sách thưởng; khác cờ/hội thoại. Không bắt người niêm
phong giết lại để đủ XP. Boss chỉ chốt kết quả một lần.

Solo giải được mọi cơ chế. Co-op thử HP thường ×1,4; tinh anh/boss ×1,6,
sát thương không tăng. Loot/XP cá nhân theo bảng, không chia đôi hoặc nhân theo
damage dealt. Chưa coi hệ số là kết quả cân bằng.

## 8. Trang bị và hướng build

MVP có pháp khí chính, giáp, hộ cụ; Mạch Bàn là công cụ riêng.
Thanh Thiết Kiếm +4 attack; Áo Vải Bền +5 defense. Ô hộ cụ không cần lấp bằng
một món mới chỉ để đẹp UI. Trang bị có instance ID, không chỉ là item ID.

MVP chế tạo chỉ số cố định, không cường hóa xác suất/phá hủy/reroll.
Alpha mới thử ba hướng kiếm cơ động, phù thuật và thủ ngự với đánh đổi rõ ràng;
không phải class khóa vĩnh viễn. Khôi lỗi/linh thú để sau.

Kiếm phải có nguồn quặng/trúc/công thức/phí đọc được trong UI.
Bỏ nhiệm vụ phụ kiếm vẫn có học bằng phí thường; chưa bắt buộc kiếm cho tuyến chính.

## 9. Vật phẩm tiêu hao

Hai ô nhanh, cooldown chung 8 giây:
Hồi Nguyên Hoàn hồi 30 HP; Ích Khí Tán hồi 25 linh lực.
Đầy HP/linh lực thì không tiêu món hồi tương ứng.
Hộ Thân Phù khiên 25 trong 4 giây, không cộng với Hộ Thân.
Thoát Thân Phù channel 3 giây về checkpoint; nhận sát thương thì ngắt, chỉ PvE,
chỉ tiêu khi teleport được commit.

Hồi Nguyên Hoàn **không tăng tu vi**. Consumable không sửa trực tiếp XP/cảnh giới.
Mỗi lần dùng thật phải trừ đúng một lần; kết quả và inventory cần hòa giải được
khi disconnect. Đấu tập dùng vật tư mô phỏng hoặc tắt, không tiêu đồ persistent.

## 10. Kết quả encounter và tài sản

Server kiểm tra danh tính, epoch, thứ tự/rate input, trạng thái sống, vị trí,
va chạm, kỹ năng sở hữu, cooldown và linh lực. Snapshot client không là bằng chứng.

Lưu outcome + người đủ điều kiện + reward bất biến, rồi settlement qua lớp tài
sản chung. Receipt đơn lẻ không thay thế lưu outcome bền vững. Retry cùng encounter
kể cả operation khác không trả thêm. XP, loot, tiền và event quest dùng giao dịch
nhất quán hoặc outbox có reconcile, xem [đặc tả](progression-pve-spec.md).

Túi đầy giữ thưởng chờ, không vứt đồ/cho một nửa; chặn khởi tạo encounter thưởng
mới đến khi giải quyết. Cho về hub dọn túi rồi nhận đúng một lần.
Đóng góp hỗ trợ được tính; last-hit không là tiêu chuẩn duy nhất, AFK ngoài cửa
không nhận. Mất mạng phải có chính sách reconnect rõ và bài kiểm tra thật.

### Dọn túi luôn có đường thực hiện

Ngoài bán NPC, inventory phải có thao tác hủy vật phẩm thông thường sau xác nhận,
server kiểm ID/số lượng và receipt. Cấm hủy Mạch Bàn, vật phẩm quest và món đang
trang bị; có thể tháo món thường trước khi hủy. Không phụ thuộc mọi loại vật phẩm
đều có giá bán. Tính năng này nằm trong P2 cùng equip/consume, tránh kẹt thưởng khi
túi chỉ chứa kiếm, hạt hoặc nước mà shop chưa mua. Hủy không phát XP/tiền, không thể
hoàn tác; UI phải hiển thị rõ món và số lượng. Kiểm thử đầy cả 24 ô bằng món không
bán được, dọn một ô rồi nhận settlement đúng một lần.

## 11. Chết và rút lui

PvE: về checkpoint; giữ đồ/XP đã commit, không tụt tầng. Vật tư đã dùng vẫn tiêu,
encounter thất bại không có thưởng. Rút trước settlement không tự hưởng công lao.
Disconnect không được tạo bất tử, cũng không biến thành lý do tịch thu tài sản.

Đấu tập: kết thúc và phục hồi trạng thái ngoài trận; không ghi HP/vật tư mô phỏng
vào tiến trình PvE. Giữ quy tắc hiện có của prototype.

## 12. Nghiệm thu

Kiểm tra hitbox/tường, né không xuyên vật cản, một cast đúng số hit, tick độc
không nhân đôi, slow không khóa vô hạn, hai client cùng kết quả, chết đồng thời,
boss hai cách giải, reset không thưởng, respawn không chồng checkpoint, retry/túi
đầy/restart không mất hoặc nhân XP/loot. Đo thời gian giết và tiêu hao thực tế;
không dùng bảng HP để khẳng định combat đã vui hoặc economy đã bền vững.
