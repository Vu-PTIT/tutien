# 06 — Nhiệm vụ, phần thưởng và tiến trình chương đầu

**Cập nhật:** 22/09/2026. **Phạm vi:** 12 quest chính + 6 quest phụ.
Nhiệm vụ dạy cơ chế và mở mục tiêu, không chỉ yêu cầu tăng số quái phải giết.
Các bảng XP/tiền bên dưới lấy từ [JSON chung](../../design-samples/progression-pve.v1.json).

## 1. Máy trạng thái

`locked → available → accepted → objectives_complete → reward_committed`.

Hoàn thành mục tiêu chưa đồng nghĩa nhận thưởng. Mỗi objective có ID, event tin cậy
và điều kiện. Quest chính không xóa lựa chọn khi bỏ theo dõi; đó chỉ là UI.
`abandoned` dùng cho quest phụ nhận lại được, không xóa source đã claim.

## 2. Mười hai nhiệm vụ chính

| ID | Hành động | Mở khóa / cờ / lưu ý |
| --- | --- | --- |
| `q_main_001` | Nhận việc ở An Khê, gặp Bà Sâm/trạm | Journal và mục tiêu khảo sát |
| `q_main_002` | Theo Lục Vi, nhận Mạch Bàn, dò hai dấu nước | `sk_scan`, mẫu nước; dạy né an toàn; chưa farm XP |
| `q_main_003` | Thực hành dẫn khí tại hub | Luyện Khí 1, `cp_tuc_mach`, Phi Nhận, `insight.breath_control` |
| `q_main_004` | Trồng/thu mẻ Cam Lộ hướng dẫn | Vườn; boost một mẻ 60 giây, không thể lặp bằng client flag |
| `q_main_005` | Luyện một Hồi Nguyên Hoàn và mang theo | `rc_heal`, `insight.first_craft`; không buộc uống khi đầy HP |
| `q_main_006` | Vượt Sơn Trư hoặc tuyến tránh đã dò | Mở Thạch Cạn; hai cách cùng XP/tiền quest |
| `q_main_007` | Tìm sổ ghi và mảnh dấu ở Thạch Cạn | Thông tin chuyển dòng, vật tư quest |
| `q_main_008` | Trình kín hoặc công khai chứng cứ | `choice.evidence`, phản ứng NPC, cùng ngân sách thưởng |
| `q_main_009` | Đối chiếu sơ đồ với Tống Đức | Quyền Cổ Tỉnh bền vững, chìa không là khóa duy nhất |
| `q_main_010` | Xem loadout/checkpoint, chọn solo hoặc co-op | Công thức phù thoát; không buộc dùng/tiêu phù |
| `q_main_011` | Hạ tâm trận hoặc niêm phong | Nhận kết quả boss hợp lệ, lưu phương án giải quyết |
| `q_main_012` | Về hub xác nhận kết quả với NPC | `story.ch1.complete`, cho phép đột phá tầng 4 |

001–012 là chuỗi chính: mỗi quest cần quest trước đã `reward_committed`.
Lựa chọn ở 006/008/011 nằm trong flags/objectives, không tạo chuỗi quest loại trừ
khiến kiểm tra phụ thuộc khó hơn. Không gắn thêm yêu cầu “phải ở tầng X” cho toàn
bộ chuỗi; mức tầng trên bản đồ là khuyến nghị ngoài các cổng đã định nghĩa.

`q_main_003`: chuyển realm, cấp XP/kỹ năng/cờ cùng giao dịch.
`q_main_005`: mở công thức đủ sớm để làm objective; nhận cờ lĩnh ngộ khi reward
được commit, không yêu cầu đã có cờ đó mới được học/luyện công thức.
Không dùng quest unlock làm vòng phụ thuộc tự khóa.

## 3. Phần thưởng chính

<!-- generated:quests -->
| ID | Nhiệm vụ | XP một lần | Linh thạch một lần |
| --- | --- | --- | --- |
| `q_main_001` | Việc ở An Khê | 0 | 0 |
| `q_main_002` | Dấu nước lạ | 0 | 0 |
| `q_main_003` | Hơi thở đầu tiên | 40 | 0 |
| `q_main_004` | Một khoảnh đất nhỏ | 60 | 0 |
| `q_main_005` | Không đi tay không | 100 | 120 |
| `q_main_006` | Lối rừng bị cấm | 120 | 80 |
| `q_main_007` | Chữ trong sổ đá | 180 | 100 |
| `q_main_008` | Nói với ai | 120 | 0 |
| `q_main_009` | Chìa của người giữ giếng | 180 | 100 |
| `q_main_010` | Chuẩn bị một đường về | 100 | 0 |
| `q_main_011` | Mộc Tâm Thủ Trận | 250 | 140 |
| `q_main_012` | Dòng nước trở lại | 300 | 160 |
<!-- /generated:quests -->

Tổng XP chính 1.450. Economy Balance v1 chuẩn hóa ngân sách tiền quest lên tổng
**700 Linh Thạch** để đồng bộ thang giá ×10; đây vẫn là nguồn một lần và chưa phải
kết quả economy đã đo. Công pháp/Mạch Bàn/quyền vào map luôn bảo đảm, không random.

Quyền học công thức/skill cấp một lần và có nguồn riêng. Đủ mục tiêu nhưng túi
đầy thì không tiêu vật tư nhiệm vụ/claim trước; giữ ở `objectives_complete`.
Vật phẩm quest không bán/tặng/rơi khi chết; tái cấp cần bảo đảm không nhân bản.

## 4. Phân bổ XP theo chặng

<!-- generated:milestones -->
| Mốc | Quest XP | XP ngoài quest | Dư trước | Tiêu đột phá | Dư sau |
| --- | --- | --- | --- | --- | --- |
| to_stage_2 | 200 | 100 | 0 | 300 | 0 |
| to_stage_3 | 600 | 150 | 0 | 600 | 150 |
| to_stage_4 | 650 | 200 | 150 | 1000 | 0 |
<!-- /generated:milestones -->

003–005 cấp 200, thêm 100 từ hoạt động để thử mở tầng 2.
006–009 cấp 600, lộ trình mẫu có thêm 150 và giữ làm dự trữ sau tầng 3.
010–012 cấp 650, thêm 200 và dùng 150 dự trữ để đủ tầng 4.
Người làm thêm quest phụ hoặc farm lặp có thể lên sớm; đây là tuyến kiểm chứng,
không một bộ điều kiện cứng bắt người chơi phải nhận đúng thứ tự XP ngoài quest.

Encounter boss và reward quest là hai nguồn có chủ đích: 100 và 250 XP.
Không thưởng hai encounter khi vừa hạ vừa kích hoạt niêm phong cùng lượt.
Tầng 4 dừng XP mới; báo trước, vẫn có phần thưởng vật liệu/tiền được định nghĩa
riêng của nội dung, không đổi XP thành tiền theo tỷ lệ.

## 5. Sáu nhiệm vụ phụ

| ID | Mở sau | Hành động / giá trị ngoài XP |
| --- | --- | --- |
| `q_side_001` Cầu qua suối | 002 | Góp 3 trúc từ tuyến an toàn, mở đường về ngắn hơn |
| `q_side_002` Đất chưa hiểu cây | 004 | Trồng cây thứ hai, hiểu thời gian; không là điều kiện chính |
| `q_side_003` Tiếng động trong khe | 006 | Quan sát Thạch Vệ từ điểm an toàn, học hướng phòng thủ |
| `q_side_004` Lời hẹn của người thợ | 007 | Mang ít nhất 3 quặng chứng thực nguồn, không tiêu quặng; mở `rc_sword` |
| `q_side_005` Giá một lời đồn | 008 | Kiểm chứng hai lời kể, ghi nguồn tin trong journal |
| `q_side_006` Sau trận nước đục | 012 | Sửa chữa/khảo sát theo kết cục, cho thấy thế giới phản hồi |

Bỏ side quest kiếm có thể trả phí nghiên cứu công thức cho Đỗ Khê bằng tiền thường.
Không bắt tiêu vật liệu chế tạo hai lần để vừa mở công thức vừa làm đồ.
Side quest sau chương không có XP nhưng vẫn có tác dụng kể chuyện.
Chưa cấp tiền lặp riêng cho các side quest trong bảng dữ liệu thử này.

## 6. Khám phá và phương án ít giao tranh

<!-- generated:sources -->
| Nguồn | XP mẫu | Ghi nhận |
| --- | --- | --- |
| `poi_truc_am_route` | 30 | Một lần / nhân vật |
| `poi_thach_can_ledger_view` | 20 | Một lần / nhân vật |
| `poi_co_tinh_flow` | 20 | Một lần / nhân vật |
| `poi_safe_bank` | 25 | Một lần / nhân vật |
| `poi_old_camp` | 25 | Một lần / nhân vật |
| `q_side_001` | 50 | Một lần / nhiệm vụ |
| `q_side_002` | 50 | Một lần / nhiệm vụ |
| `q_side_003` | 40 | Một lần / nhiệm vụ |
| `q_side_004` | 50 | Một lần / nhiệm vụ |
| `q_side_005` | 40 | Một lần / nhiệm vụ |
| `q_side_006` | 0 | Một lần / nhiệm vụ |
<!-- /generated:sources -->

Các POI chỉ thưởng lần đầu/nhân vật; scan lại hoặc reconnect không đặt lại cờ.
`poi_safe_bank`/`poi_old_camp` khác hai điểm hướng dẫn quest 002; mở sau dẫn khí.
`q_side_001` + hai POI an toàn cho 100 XP thay thế chặng đầu mà không cần đợi cây
Tĩnh Tâm. Thu trước khi nhận quest phụ được kiểm bằng inventory và quyền nộp hợp lệ.

Đường tránh `q_main_006` không cần giết con Sơn Trư đang chặn tuyến thẳng.
Không vì thiếu encounter XP mà lén giảm phần thưởng quest đường tránh.
Toàn chương vẫn có thử thách Cổ Tỉnh, không hứa một tuyến hoàn toàn phi chiến đấu.

## 7. Event và ghi tiến độ

| Objective | Event đáng tin | Điều bị từ chối |
| --- | --- | --- |
| `talk_to_npc` | Đúng NPC/map/khoảng cách | Client tự khai đã nói |
| `inspect_poi` | Server xác nhận scan điểm | Client gửi vị trí/kết quả giả |
| `collect_item` | Inventory có tài sản hợp lệ | Tự gửi số lượng |
| `craft_recipe` | Craft đã commit | Click nút nhưng giao dịch thất bại |
| `complete_encounter` | Outcome/settlement bền vững | Client báo quái/boss chết |
| `choose_branch` | Quest có lựa chọn hợp lệ | Sửa nhánh sau claim |
| `enter_area` | Map/trigger authoritative | Teleport cục bộ |
| `cultivation_milestone` | Giao dịch tu luyện thành công | Client sửa tầng |

Event gồm `eventId`, `characterId`, `eventType`, `sourceId`, `occurredAt`,
`contentVersion`. Không tạo RPC công khai nhận event đáng tin tùy ý từ client.
Tách objective-complete và reward-committed, nhưng cả hai có khả năng phục hồi
sau restart. Outcome chưa lưu không được dùng để hứa chắc phần thưởng.

## 8. Các nhánh

`choice.evidence`: `private_review` trình riêng Tạ Nghiêm hoặc `public_notice`
công khai chứng cứ. Cùng ngân sách chính, khác nguồn gợi ý/tín nhiệm; không thưởng
tối đa với tất cả bên cùng lúc.

`choice.array`: `destroy_core` hoặc `seal_flow`. Encounter là thực tế chung;
journal cá nhân lưu lựa chọn tương thích, không cho người về làng đổi boss đã xảy ra.
Không chọn hộ đồng đội hoặc chuyển nhánh để claim lần nữa.

## 9. Co-op, reconnect, túi đầy

Có mặt trong instance, đóng góp hành động hợp lệ và không bỏ trước settlement,
trừ reconnect grace được server xác nhận. Hỗ trợ/khiên tính, không chỉ last-hit.
Người AFK ngoài cửa không nhận công lao. XP, túi, cờ lựa chọn là của từng nhân vật.

Rời party không mất quest cá nhân. Boss đã xong nhưng mất mạng trước nộp:
đọc lại outcome/cờ và nhận đúng một lần. Túi đầy giữ kết quả và quyền claim,
không tiêu vật tư/cho reward nửa chừng. Dọn túi rồi retry bằng receipt/source cũ.

## 10. Nhịp nội dung và sự kiện

001–005 hướng tới phần đầu khoảng 30 phút; chương đầu thử 2–4 giờ chơi chủ động.
Đo thời gian tìm đường, đọc UI, chuẩn bị, combat và chờ; không ép bằng lịch cây.
Khi thiếu XP ở một điểm, sửa nguồn hoặc mục tiêu trước khi thêm daily.

MVP không có event theo giờ thật. Alpha có thể thêm đoàn hàng/mạch khí bất ổn,
nhưng nguyên liệu tiến trình chính luôn có nguồn thay thế, không phải canh nửa đêm.

## 11. Nghiệm thu

Chạy từ tài khoản mới cả tuyến thẳng/tránh, kín/công khai, phá/niêm phong;
bỏ side quest kiếm; co-op khác tiến độ; đầy túi; chết; reconnect; retry cùng/khác
operation ID; migration đổi text không đổi ID tiến trình; không có chu trình
quest/công thức/đột phá. Validator chỉ kiểm thiết kế; các ca runtime phải chạy thật.
