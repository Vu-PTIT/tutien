# Đặc tả tiến trình và vòng PvE — bản cập nhật 21/09/2026

**Phạm vi:** sửa thiết kế trên nền `feat/inventory-rewards` tại `05f5dd0eb9df36d5790e268879b8fbe3699994ea`.
**Trạng thái:** thiết kế để triển khai, chưa phải tính năng runtime hoặc kết quả playtest.
**Bản dữ liệu:** `progression-pve-prototype-2-economy-v1`.

## 1. Quyết định sản phẩm

Người chơi phải trả lời được: **mình thiếu gì → đến đâu → làm gì → nhận gì → dùng
để mạnh lên thế nào → việc mới nào sẽ làm được**. Một chuyến đi nên phục vụ ít nhất
hai mục tiêu: tu vi, nguyên liệu/vật tư hoặc mở tri thức/đường đi.

Vòng chính: nhận mục tiêu ở An Khê → chuẩn bị → chọn tuyến Trúc Âm/Thạch Cạn →
đọc đòn và giao tranh hoặc dùng đường tránh → nhận thành quả hợp lệ → về làng →
chế tạo/đột phá → thử tình huống khó hơn. Nhịp chuyến đi cần thử ở 15–20 phút,
có thể kéo đến 30 phút; không suy số phút từ tổng XP.

Giữ ba lớp phát triển dễ hiểu: tu vi; lĩnh ngộ/nhiệm vụ; trang bị/vật tư.
Công pháp, tri thức và quan hệ vẫn là chiều phát triển của thế giới, nhưng MVP
không thêm ba thanh XP mới. Không có “cấp nhân vật” trùng chức năng với cảnh giới.

## 2. Phân biệt hiện có và sẽ làm

Mốc nguồn đã có backend xã hội, đấu tập authoritative và nền inventory/reward.
PvE, dùng/trang bị đồ, quest và tu luyện chưa được triển khai ở mốc này.
Xem [tiến độ](../implementation-status.md) và [hợp đồng tài sản](../inventory-and-rewards.md).

Không đổi combat đấu tập hiện hành chỉ vì bảng thiết kế này có thêm chỉ số quái.
Không thay `server/src/catalog.ts`, schema hồ sơ hoặc gói khởi đầu bằng JSON mẫu.
Bản mẫu là đầu vào cho thảo luận và kiểm tra số học, không phải catalog runtime.

## 3. Nguồn số liệu duy nhất

[`progression-pve.v1.json`](../../design-samples/progression-pve.v1.json) quản lý
ngưỡng, XP quest/quái, loot, công thức, bảng giá thử và ba lộ trình mẫu.
Các bảng có dấu `generated` trong MD được tạo từ file này. Khi đổi số:
sửa JSON → chạy validator với `--write-tables` → kiểm tra phần diễn giải → chơi thử.

Các tài liệu 01–07 mô tả ý nghĩa và luật chuyên môn; đặc tả này nối chúng lại.
Không duy trì một bộ số khác trong backlog hoặc nhật ký.

## 4. Các chặng phát triển

| Chặng | Việc người chơi cần hiểu | Kết quả |
| --- | --- | --- |
| Phàm nhân, An Khê/rìa Trúc Âm | Tương tác, dò dấu, đánh gần và né trong tình huống an toàn | `q_main_003` mở Luyện Khí 1, Phi Nhận và dẫn khí |
| Luyện Khí 1, Trúc Âm | Tự chuẩn bị hồi phục, kiếm tu vi và vật liệu có đầu ra | Đủ điều kiện mở Hộ Thân ở tầng 2 |
| Luyện Khí 2, Thạch Cạn | Che chắn trước địch xa, quan sát mặt trước/sườn quái, tìm quặng | Hướng tới kiếm và Trói Mộc ở tầng 3 |
| Luyện Khí 3, Cổ Tỉnh | Kết hợp né, phòng vệ, khống chế và dò mạch | Hoàn thành chương bằng hạ boss hoặc niêm phong |
| Luyện Khí 4 | Biết giới hạn bản thử và mục tiêu đã đạt | Dừng tiến trình cảnh giới, không hứa nội dung chưa có |

Ngưỡng dưới đây là XP **tiêu tại từng lần đột phá**, không phải XP tích lũy tuyệt đối.

<!-- generated:thresholds -->
| Chuyển tầng | Tu vi cần | Cờ bắt buộc | Khả năng mở |
| --- | --- | --- | --- |
| 1 → 2 | 300 | `insight.breath_control` | `sk_ho_than` |
| 2 → 3 | 600 | `insight.first_craft` | `sk_troi_moc` |
| 3 → 4 | 1000 | `story.ch1.complete` | Kết thúc phạm vi MVP |
<!-- /generated:thresholds -->

Cửa bản đồ vẫn theo quest, không thêm khóa lực chiến/tầng ngoài những điều kiện
đã ghi. Đi sang Thạch Cạn không buộc phải đạt tầng 2; đó là mức chuẩn bị gợi ý.
Một người cày sớm có thể mở kỹ năng trước tuyến truyện, nhưng không bỏ qua quyền
vào Cổ Tỉnh hoặc điều kiện kết chương.

## 5. Ngân sách XP kiểm chứng

<!-- generated:milestones -->
| Mốc | Quest XP | XP ngoài quest | Dư trước | Tiêu đột phá | Dư sau |
| --- | --- | --- | --- | --- | --- |
| to_stage_2 | 200 | 100 | 0 | 300 | 0 |
| to_stage_3 | 600 | 150 | 0 | 600 | 150 |
| to_stage_4 | 650 | 200 | 150 | 1000 | 0 |
<!-- /generated:milestones -->

<!-- generated:route-details -->
| Chặng | Encounter tham chiếu | Khám phá một lần | XP ngoài quest |
| --- | --- | --- | --- |
| to_stage_2 | Sơn Trư ×4, Độc Chu ×2 | `poi_truc_am_route` | 100 |
| to_stage_3 | Kẻ Rình Đường ×4, Thạch Vệ ×1 | `poi_thach_can_ledger_view` | 150 |
| to_stage_4 | Độc Chu ×2, Thạch Vệ ×1, Mộc Tâm Thủ Trận ×1 | `poi_co_tinh_flow` | 200 |
<!-- /generated:route-details -->

Tổng quest chính là 1.450; lộ trình mẫu bổ sung 450; chi phí đột phá là 1.900.
Đây không phải toàn bộ XP có thể nhận trong chương, không phải nhiệm vụ
“phải giết đúng từng ấy con”. Quest phụ, khám phá khác và farm lặp hợp lệ có thể
làm người chơi lên tầng sớm hơn. Không cố ép mọi người khớp bảng.

**Đường thay thế đầu chương:** `q_side_001` cho 50, `poi_safe_bank` và
`poi_old_camp` cho 25 mỗi điểm, tổng 100. Các điểm này ở tuyến an toàn, mở sau
`q_main_003`, khác hai điểm dò của `q_main_002`. Sửa cầu dùng 3 trúc có thể thu an toàn.
Tuyến này thay phần 100 XP ngoài quest của lộ trình mẫu, không cần chờ cây thứ hai.
Người làm cả hai tuyến nhận đúng thưởng riêng của từng nguồn, không coi đó là exploit.

`q_main_006` có đường tránh; hoàn thành bằng đường tránh vẫn nhận đủ phần thưởng
quest. Điều này không có nghĩa toàn chương là chế độ không chiến đấu: Cổ Tỉnh
vẫn kiểm tra xử lý nguy hiểm và thao tác cơ chế.

Boss có **100 XP encounter** và `q_main_011` có **250 XP quest một lần**.
Hai nguồn tách biệt có chủ đích, không trả thêm lần thứ hai khi cùng boss chuyển
từ trạng thái hạ sang niêm phong. `destroy_core` và `seal_flow` dùng chung quyền thưởng.

## 6. Quái phải dạy kỹ năng và có đầu ra

<!-- generated:enemies -->
| ID / tên | HP solo | XP / lần hợp lệ | Loot bảo đảm / người | Hồi sinh thử |
| --- | --- | --- | --- | --- |
| `en_boar` — Sơn Trư | 60 | 10 | `it_boar_hide` ×1 | 45 giây |
| `en_spider` — Độc Chu | 45 | 15 | `it_spider_silk` ×1 | 60 giây |
| `en_scout` — Kẻ Rình Đường | 80 | 20 | `it_iron` ×1 | 60 giây |
| `en_guard` — Thạch Vệ | 180 | 50 | `it_spirit_dust` ×1 | 180 giây |
| `en_boss` — Mộc Tâm Thủ Trận | 700 | 100 | `it_spirit_dust` ×2 | Lượt bí cảnh mới |
<!-- /generated:enemies -->

Sơn Trư dạy né ngang và phản công sau cú lao; Độc Chu dạy tránh vùng độc;
Kẻ Rình Đường dạy vật cản; Thạch Vệ dạy quan sát hướng phòng thủ; boss tổng hợp.

Các lượng loot trên bảo đảm cho người đủ điều kiện tham gia, không chia đôi trong
co-op. MVP chưa có roll đồ hiếm cho tiến trình chính. `it_venom` vẫn là ID catalog
dự trữ, **chưa được đưa vào bảng rơi** khi chưa có công dụng. Không thêm công thức
hoặc tiền tệ chỉ để lấp một chỗ trống trong túi.

Da Sơn Trư có thể bán; tơ nhện + linh sa phục vụ phù; quặng + trúc phục vụ kiếm.
Cam Lộ lấy từ điểm thu thập/vườn, không bắt mọi vật liệu đều rơi từ quái.

## 7. Một chuyến Trúc Âm mẫu

Mục tiêu: tiến gần Hộ Thân, mang về vật tư cho chuyến sau.
Bốn Sơn Trư + hai Độc Chu + mốc khám phá đầu tiên cho 100 XP.
Loot bảo đảm là 4 da và 2 tơ. Thu thêm 4 Cam Lộ ở node riêng.

Bài tính ví biên, không cộng gói khởi đầu hoặc tiền quest:
bán 4 da × 30 = 120 Linh Thạch; mua 2 nước = 20; phí luyện 2 viên hồi phục = 40;
còn 60 Linh Thạch, 2 tơ nhện và 2 Hồi Nguyên Hoàn mới chế tạo.

**Đây là sản lượng gộp, không phải lợi nhuận chắc chắn của mọi chuyến.**
Chưa trừ vật tư đã dùng trong rừng. Nếu đã dùng 1 viên, mức tăng ròng là 1 viên;
dùng 2 thì chỉ hòa vốn số viên; dùng 3 thì thiếu 1 viên để trở lại mức đầu chuyến.
Mua bù viên thứ ba với giá thử 80 khiến dòng tiền 60 thành -20. Cần ghi nhận phân bố
tiêu hao thực tế, giảm độ khó/tăng nguồn hoặc đổi tuyến; không khẳng định economy
đã cân bằng từ một phép tính thuận lợi.

Vườn tạo khả năng tự chủ; người không thích trồng có thể mua hồi phục cơ bản từ
NPC bằng tiền chơi. Nghỉ tại hub miễn phí và tuyến thu thập không cần vật tư luôn còn.

## 8. Luật XP, trần và chống farm sai

Nguồn XP lặp chỉ đến từ encounter hợp lệ khi đã ở Luyện Khí. Bài hướng dẫn
Sơn Trư của phàm nhân không cho XP/loot lặp; hướng dẫn dẫn khí cấp XP quest sau khi
đã chuyển trạng thái trong cùng giao dịch. PvP, online đứng yên, spam kỹ năng và
trồng/thu lặp không phát tu vi.

Giữ một ngưỡng dự trữ đối với nguồn lặp: trước trần nội dung,
`repeatableCapacity = 2 × nextThreshold`. Phần cấp thực tế là
`min(offeredXp, max(0, repeatableCapacity - currentXp))`. Hiện thông báo sắp chạm trần.
Quest/khám phá một lần không bị cắt bởi giới hạn này; tiến trình truyện không bị
kẹt vì phải từ chối toàn bộ reward khi dư XP. Giao dịch đột phá chỉ trừ ngưỡng,
giữ XP đã nhận còn lại. Không có phí đột phá hoặc xác suất thất bại trong MVP.

Ở tầng 4, XP mới bằng 0; loot cơ bản vẫn theo bảng công bố. Không tự đổi XP thành
tiền hay vật liệu thưởng thêm. Đây là làm rõ/thay thế ý “đổi XP thành vật liệu”
chưa có bảng định lượng ở v2. XP dư đã có giữ trong dữ liệu, không hứa tự chuyển
thành cấp ở bản sau; UI hiển thị đã đạt giới hạn nội dung thay vì thanh cày vô hạn.

## 9. Respawn, nhận thưởng và mất mạng

Respawn quái thường theo thời gian server, sau khi cả cụm kết thúc; không sinh
chồng lên nhân vật/checkpoint. Có thể trì hoãn spawn đến lúc vùng an toàn.
Thời gian trong bảng là mốc bắt đầu kiểm thử, không phải hạn giờ để giành quái.
Boss chỉ xuất hiện trong lượt bí cảnh hợp lệ mới; reset/thua không cấp thưởng.

Mỗi cá thể/cụm có `spawnGroupId`, `spawnGeneration`, `encounterId` do server tạo.
Source thưởng gắn encounter + người nhận. Chuyển map/reconnect không làm mới
quyền đã nhận hoặc đồng hồ; mở lại cùng kết quả không sinh source mới.
Nếu có nhiều instance, quyền tái tham gia/nhận thưởng phải chống đổi instance
để bỏ qua cooldown. Không cho cùng nhân vật hoạt động ở hai match.

Ghi kết quả encounter và danh sách người đủ điều kiện vào lưu trữ bền vững trước
khi báo hoàn thành. Receipt chống nhận trùng không tự cứu được kết quả chưa lưu.
Settlement XP, tiền, loot và event tiến trình phải atomic trong phạm vi có thể,
hoặc dùng outbox bền vững cùng cơ chế retry/reconcile có test.

Túi đầy: giữ settlement ở trạng thái chờ, không lặng lẽ bỏ vật phẩm hoặc chỉ cấp
một nửa. MVP chặn bắt đầu encounter thưởng mới khi còn settlement chờ để tránh
biến hàng chờ thành kho vô hạn. Cho về hub bán vật liệu rồi nhận lại; kết quả và
quest liên quan không mất khi khởi động lại server. Không cần mail quà MVP.

Thua: về checkpoint, giữ XP/đồ đã commit; vật tư đã dùng vẫn tiêu; không giảm tầng.
Không dùng đòn cuối làm tiêu chuẩn duy nhất; có đóng góp hỗ trợ hợp lệ cũng tính.
Người AFK ngoài phòng không tự được thưởng. Chính sách reconnect phải kiểm chứng.

### Dọn túi luôn có đường thực hiện

Ngoài bán NPC, inventory phải có thao tác hủy vật phẩm thông thường sau xác nhận,
server kiểm ID/số lượng và receipt. Cấm hủy Mạch Bàn, vật phẩm quest và món đang
trang bị; có thể tháo món thường trước khi hủy. Không phụ thuộc mọi loại vật phẩm
đều có giá bán. Tính năng này nằm trong P2 cùng equip/consume, tránh kẹt thưởng khi
túi chỉ chứa kiếm, hạt hoặc nước mà shop chưa mua. Hủy không phát XP/tiền, không thể
hoàn tác; UI phải hiển thị rõ món và số lượng. Kiểm thử đầy cả 24 ô bằng món không
bán được, dọn một ô rồi nhận settlement đúng một lần.

## 10. Giao diện dẫn dắt

Bảng mục tiêu ghim một bước gần, ví dụ: **Luyện Khí 2 — mở Hộ Thân**;
hiện XP còn thiếu, điều kiện dẫn khí đã/chưa đạt, địa điểm gợi ý và nút đánh dấu.
Đủ XP nhưng thiếu lĩnh ngộ phải nói rõ cần làm quest nào, không chỉ đổi màu thanh.

Bảng vật phẩm có “dùng để làm gì” và “nguồn ở đâu”. Theo dõi kiếm hiển thị quặng
4/6, trúc 2/2, phí 80, quyền công thức đã mở hay chưa; không chỉ hiện icon khóa.
Sau chuyến đi, tổng kết riêng XP quest, XP encounter, khám phá, tiền bán, phí,
vật tư đã dùng và vật tư mang về. Hiển thị trạng thái thưởng đang chờ lưu/nhận.

## 11. Thứ tự triển khai và điều kiện xong

| Mốc | Triển khai trong cùng một đoạn trải nghiệm | Điều kiện nghiệm thu |
| --- | --- | --- |
| P1 — một Sơn Trư | AI, windup, lao, hồi thế, chết/reset, một khu QA | Đọc được đòn; server xác nhận; không nhận thưởng ở bản chỉ kiểm combat |
| P2 — một chuyến săn có thành quả | Settlement bền vững, XP tối thiểu, loot, equip/consume/dọn túi, checkpoint/hồi phục | Nhận đúng một lần; log lại còn tài sản; đồ có tác dụng; chờ thưởng khi túi đầy |
| P3 — trở thành người tu luyện | Quest runtime nhỏ, 001–003, mortal → LK1, Phi Nhận, UI mục tiêu | Tài khoản mới làm được không nhờ lệnh cấp XP/đồ tay |
| P4 — chuẩn bị/đi rừng/trở về | Node, vườn, công thức hồi phục, shop nhỏ, 004–006, Độc Chu, đột phá 1→2 | Chuyến Trúc Âm và tuyến tránh đều không kẹt; mở Hộ Thân đúng nguồn |
| P5 — chương đầu | 007–012, Thạch Cạn/Cổ Tỉnh, công thức còn lại, đột phá 2→3→4 | Solo/co-op và hai cách giải boss đều đi hết; không cấp tay, không mất tiến độ |

P2 có thể dùng hồ sơ Luyện Khí cố định trong fixture kiểm thử, **không** nâng tài
khoản người chơi thật hoặc mở debug RPC công khai để bỏ qua P3. P4 phải có shop
bán da/mua nước/mua hồi phục và craft; không nghiệm thu “loot có giá trị” khi chỉ
nhặt được đồ nhưng chưa làm gì với nó.

Giữ gate CI/tài sản của các mốc đã có. Không thêm map, tông môn, linh thú hoặc cảnh giới mới trước khi P1–P5 có kết quả chơi thử.
Economy v1 đã đặc tả cường hóa như một sink tương lai, nhưng **không triển khai runtime cường hóa** trước khi vòng P1–P5 có số liệu chơi thử.

## 12. Các bài nghiệm thu xuyên hệ thống

| ID | Bài thử | Kết quả bắt buộc |
| --- | --- | --- |
| PROG-01 | Lộ trình mẫu với đúng nguồn XP | Dư sau ba lần đột phá là 0 / 150 / 0 |
| PROG-02 | Không đánh quái phần XP đầu, dùng tuyến an toàn | Đủ 100 XP thay thế; không cần chờ cây 45 phút |
| PROG-03 | Hạ/niêm phong cùng boss, retry nhiều lần | Một encounter reward + một quest reward, không cộng lại |
| PROG-04 | Farm dư, quest một lần, rồi đột phá | Nguồn lặp bị giới hạn rõ; XP một lần không bị cắt âm thầm |
| PROG-05 | Túi đầy, nhận thưởng, reconnect/restart | Kết quả chờ còn nguyên, nhận lại đúng một lần |
| PROG-06 | Mạng rớt trước/sau commit | Không mất hoặc nhân XP, loot, tiền, vật tư |
| PROG-07 | Chuyển map/instance để reset quái | Không bỏ qua quyền thưởng/cooldown đã ghi |
| PROG-08 | Dùng hết thuốc và tiền | Còn nghỉ miễn phí và tuyến thu thập an toàn |
| PROG-09 | Bỏ side quest kiếm | Có học công thức bằng phí thường, không khóa tuyến chính |
| PROG-10 | Co-op khác tiến độ, có người hỗ trợ | Quyền nhận riêng; không ép cùng lựa chọn hội thoại |
| PROG-11 | Tầng 4 tiếp tục làm nội dung | XP mới 0, không đổi XP thành tiền; thông báo trước |
| PROG-12 | Tiêu 0/1/2/3 viên mỗi chuyến mẫu | Báo rõ vật tư ròng và khả năng duy trì; không che kịch bản lỗ |

Ghi thời gian theo hành động: đi đường, giao tranh, tương tác, thao tác UI và chờ.
Theo dõi tử vong/nguồn sát thương, tỷ lệ né, tiêu hao, nguồn XP, ví trước/sau,
thời điểm mở kỹ năng và câu trả lời “tiếp theo bạn sẽ làm gì?”. Chưa có telemetry
hoặc số liệu playtest thật trong bản cập nhật này.

## 13. Nguồn và phạm vi

Nguồn repo là mốc Git ở đầu tài liệu, không phải mô tả “đã làm” trong hội thoại.
[Xem ghi chú tham khảo game](progression-references.md) để phân biệt cơ chế tham
khảo với quyết định sáng tạo của dự án. Mọi giá, XP và lịch spawn mới là cấu hình
thử do dự án đề xuất, không lấy từ game tham khảo.
