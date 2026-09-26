# 07 — Vườn, chế tạo và đầu ra của chiến lợi phẩm

**Cập nhật:** 21/09/2026. **Trạng thái:** thiết kế kinh tế prototype.
Giá, loot và công thức lấy từ [JSON chung](../../design-samples/progression-pve.v1.json).
Không coi kết quả tính một chuyến là bằng chứng economy đã cân bằng.

## 1. Vòng tài nguyên

Mục tiêu → chọn nơi tìm → đánh/thu thập → sở hữu thành quả qua settlement →
về làng bán/chế tạo/đổi trang bị → chuẩn bị chuyến sau → vượt thử thách mới.

Vườn giảm phụ thuộc và tạo nhịp nghỉ. Người không thích trồng có thể mua lượng
hồi phục cơ bản từ NPC bằng tiền chơi. Nghỉ tại hub miễn phí; luôn có tuyến thu thập
không đòi thuốc. Không tạo vòng “thua mất hết nên không còn khả năng chơi”.

Hồi Nguyên Hoàn chỉ hồi HP, không tăng tu vi. Vườn hỗ trợ survival; XP đến từ quest,
khám phá và encounter, không từ vòng trồng/craft/uống lặp.

## 2. Vườn MVP

Sáu ô cá nhân tại An Khê, mỗi lượt dùng một hạt và một nước.
Không mùa làm chết cây, tưới bắt buộc nhiều lần, trộm cây hoặc phá vườn.

<!-- generated:crops -->
| Cây | Thời gian thường | Sản lượng | Sản phẩm |
| --- | --- | --- | --- |
| `crop_cam_lo` | 20 phút | 4 | `it_herb_cam_lo` |
| `crop_tinh_tam` | 45 phút | 4 | `it_herb_tinh_tam` |
| `crop_ich_khi` | 60 phút | 4 | `it_herb_ich_khi` |
<!-- /generated:crops -->

Mẻ hướng dẫn quest 004 chín sau 60 giây; boost do server gắn một lần với
quest/ô/planting ID. Không nhận flag tutorial do client tự gửi.
Cây chín chờ thu, không hỏng vì người chơi nghỉ. Thời gian do server:
`remaining = max(0, readyAt - serverNow)`; client chỉ vẽ bộ đếm.

`empty → growing → ready → harvested → empty`.
Lưu `plotId`, `cropId`, `plantedAt`, `readyAt`, `plantingId`, `boostSource`,
`stateVersion`. Thu hoạch kiểm thời gian/chủ/quyền/túi, thêm sản phẩm và đổi trạng
thái ô cùng giao dịch. Túi đầy không mất cây; click lại không thu hai lần.

## 3. Danh mục 24 ID — nguồn và mục đích

| Nhóm | ID | Nguồn / đầu ra MVP |
| --- | --- | --- |
| Hạt Cam Lộ | `it_seed_cam_lo` | Starter/NPC → trồng |
| Cam Lộ | `it_herb_cam_lo` | Node/vườn → hồi phục hoặc bán |
| Hạt Tĩnh Tâm | `it_seed_tinh_tam` | NPC → trồng |
| Tĩnh Tâm | `it_herb_tinh_tam` | Node/vườn → đan linh lực/phù thoát hoặc bán |
| Hạt Ích Khí | `it_seed_ich_khi` | NPC → trồng |
| Ích Khí | `it_herb_ich_khi` | Node/vườn → đan linh lực hoặc bán |
| Nước | `it_water` | NPC/node → trồng/luyện hồi phục |
| Trúc | `it_bamboo` | Tuyến an toàn → cầu/kiếm/phù thoát hoặc bán |
| Quặng | `it_iron` | Thạch Cạn/node/Kẻ Rình Đường → kiếm hoặc bán |
| Linh sa | `it_spirit_dust` | Thạch Vệ/boss → phù hộ thân hoặc bán |
| Tơ nhện | `it_spider_silk` | Độc Chu → phù hộ thân hoặc bán |
| Da Sơn Trư | `it_boar_hide` | Sơn Trư → bán NPC, tạo tiền chuẩn bị |
| Độc tố | `it_venom` | ID dự trữ, **không phát loot** khi chưa có công dụng |
| Hồi phục | `it_heal_pill` | Starter/craft/NPC → hồi HP; không XP |
| Đan linh lực | `it_qi_pill` | Craft → hồi linh lực |
| Phù hộ thân | `it_ward_talisman` | Craft → khiên |
| Phù thoát | `it_escape_talisman` | Craft → về checkpoint hợp lệ |
| Kiếm | `it_iron_sword` | Craft → +4 attack |
| Áo | `it_cloth_armor` | Starter → +5 defense |
| Mạch Bàn | `it_mach_ban` | Quest 002 → công cụ dò; không bán |
| Mẫu nước | `it_water_sample` | Quest 002 → tiến trình |
| Sổ ghi | `it_ledger` | Quest 007 → chứng cứ |
| Mảnh trận | `it_array_shard` | Quest 007 → dấu/sơ đồ |
| Chìa | `it_well_key` | Quest 009 → công cụ kể chuyện/quyền vào |

Không tạo ID thứ 25 chỉ để có “token đột phá”. Linh thạch là số dư nguyên, không là
item. Túi 24 ô, stack nguyên liệu/tiêu hao 99; gear/tool có instance ID.
Vật tư quest và Mạch Bàn gắn nhân vật, không bán/tặng. Các món chưa có giá không
được RPC tự suy ra giá hoặc cho bán mặc định.

## 4. Năm công thức

<!-- generated:recipes -->
| Công thức | Nguyên liệu | Phí linh thạch | Thành phẩm |
| --- | --- | --- | --- |
| `rc_heal` | `it_herb_cam_lo` ×2, `it_water` ×1 | 2 | `it_heal_pill` ×1 |
| `rc_qi` | `it_herb_ich_khi` ×2, `it_herb_tinh_tam` ×1 | 3 | `it_qi_pill` ×1 |
| `rc_ward` | `it_spider_silk` ×2, `it_spirit_dust` ×1 | 4 | `it_ward_talisman` ×1 |
| `rc_sword` | `it_iron` ×6, `it_bamboo` ×2 | 8 | `it_iron_sword` ×1 |
| `rc_escape` | `it_herb_tinh_tam` ×2, `it_bamboo` ×1 | 4 | `it_escape_talisman` ×1 |
<!-- /generated:recipes -->

MVP chế tạo tại trạm, kết quả bảo đảm. Animation 2–3 giây không quyết định thành
công; không hàng chờ nhiều giờ. Lượng mẻ là số nguyên 1–10; kiểm toàn bộ nguyên
liệu, phí và túi trước khi commit, không làm một nửa.

`rc_heal` mở để thực hiện quest 005; cờ lĩnh ngộ được cấp khi nhận thưởng quest.
`rc_qi`/`rc_ward` nghiên cứu ở Bà Sâm sau tầng 2, giá thử 8 linh thạch mỗi công thức.
`rc_sword` mở miễn phí qua side 004 hoặc nghiên cứu 12 ở Đỗ Khê sau main 007.
`rc_escape` mở trong chuẩn bị Cổ Tỉnh tại main 010.
Linh sa cho phù đến từ Thạch Vệ/boss; Hộ Thân kỹ năng đã là lựa chọn phòng vệ trước
đó, không khóa người chơi vì chưa có phù.

## 5. Bảng giá NPC thử nghiệm

“NPC bán” là người chơi trả tiền; “NPC mua” là người chơi nhận tiền.
Đây là tập shop tối thiểu phục vụ vòng chơi mới, không phải thị trường người chơi.

<!-- generated:shop -->
| Vật phẩm | NPC bán cho người chơi | NPC mua từ người chơi |
| --- | --- | --- |
| `it_bamboo` | Không bán | 1 |
| `it_boar_hide` | Không bán | 3 |
| `it_escape_talisman` | Không bán | 2 |
| `it_heal_pill` | 8 | 2 |
| `it_herb_cam_lo` | Không bán | 1 |
| `it_herb_ich_khi` | Không bán | 1 |
| `it_herb_tinh_tam` | Không bán | 1 |
| `it_iron` | Không bán | 1 |
| `it_qi_pill` | Không bán | 2 |
| `it_seed_cam_lo` | 3 | Không mua |
| `it_seed_ich_khi` | 3 | Không mua |
| `it_seed_tinh_tam` | 3 | Không mua |
| `it_spider_silk` | Không bán | 1 |
| `it_spirit_dust` | Không bán | 1 |
| `it_ward_talisman` | Không bán | 2 |
| `it_water` | 1 | Không mua |
<!-- /generated:shop -->

Các giá mới như da 3, mua hồi phục 8 và phí nghiên cứu là giả thuyết cần playtest.
Vật phẩm không trong bảng: chưa cho mua/bán. Không nhận `price` từ client.

Hạt 3 + nước 1 cho 4 cây; bán thô 4 cây × 1 = 4, không lời tiền trước các chi phí
khác. NPC mua chế phẩm thấp hơn giá trị đầu vào/phí; không có vòng mua–chế–bán
sinh tiền vô hạn. Nguyên liệu khai thác rồi bán là đổi thời gian thành tiền.
Không được từ đây suy ra mọi tuyến đều đáng chơi hoặc economy tự cân bằng.

## 6. Gói khởi đầu — giữ nguyên implementation

`starter:v1`: 12 linh thạch, 2 hạt Cam Lộ, 4 nước, 2 Hồi Nguyên Hoàn, 1 áo vải.
Không đổi source/version để cấp lại đồ; không tặng Mạch Bàn trước quest.
Đây là gói đã định nghĩa ở mốc nguồn, còn consume/equip/garden chưa có runtime.

Mẻ hướng dẫn dùng một hạt/nước, thu 4 Cam Lộ; một viên hồi phục dùng 2 Cam Lộ,
1 nước, phí 2. Dù vẫn còn thuốc starter, quest 005 dạy tự luyện một viên;
không buộc uống khi đầy HP hoặc vứt viên cũ.

## 7. Một chuyến Trúc Âm và kiểm tra tiêu hao

Mẫu gộp: 4 Sơn Trư + 2 Độc Chu; thu 4 Cam Lộ. Có 4 da + 2 tơ.
Bán da được 12; mua 2 nước hết 2; phí luyện hai viên hết 4; tiền ròng +6.
Sau bán/mua/craft có 2 tơ và 2 viên **mới tạo**.

Không cộng tiền quest hoặc starter vào dòng thu lặp. Bảng kiểm tiêu hao:

| Viên đã dùng trong chuyến | Viên mới tạo | Chênh số viên so với đầu chuyến | Tiền ròng trước mua bù |
| --- | --- | --- | --- |
| 0 | 2 | +2 | +6 |
| 1 | 2 | +1 | +6 |
| 2 | 2 | 0 | +6 |
| 3 | 2 | -1 | +6 |

Ở dòng cuối, mua bù 1 viên giá 8 làm dòng tiền thành -2.
Đây là tình huống cần xử lý bằng độ khó, nguồn, cách chơi hoặc giá; không giấu nó
bằng cách tính gói một lần thành thu nhập mỗi chuyến. Nhiều tử vong/dùng thuốc hơn
càng cần ghi nhận; không khẳng định tự duy trì cho mọi người.

Mua sẵn hai viên bằng tiền bán 4 da tốn 16 trong khi thu 12; tuyến không làm vườn
không nhất thiết mua nổi hai viên mỗi chuyến. Viên mua sẵn là tùy chọn, còn nghỉ
miễn phí/thu Cam Lộ an toàn vẫn phải đủ để phục hồi khả năng chơi. Playtest riêng
người dùng 0–3 viên và người bỏ garden trước khi chốt shop.

## 8. Nguồn và chỗ tiêu tiền

Nguồn một lần: quest chính (bảng ở 06). Nguồn lặp: bán nguyên liệu thật.
Hợp đồng lặp chỉ cân nhắc sau chương; chưa định nghĩa một máy sinh tiền bằng click UI.

Chỗ tiêu: nước/hạt/thuốc mua sẵn, nghiên cứu, craft. Không phí hồi sinh thiết yếu,
thuế người nghỉ chơi, sửa đồ bắt buộc, lãi/kho bang hoặc premium currency.
Quest phụ/cơ duyên mở thông tin hoặc cách chơi; không bắt rơi cực hiếm để lên tầng.

## 9. Giao dịch và nguồn thưởng

Dùng một lớp kinh tế chung cho nhận thưởng, mua/bán, craft, dùng đồ, thu hoạch,
equip và tiến trình. Tiền/túi/profile cần cùng giao dịch nhất quán; không sửa wallet
và inventory ở hai RPC rồi gọi đó là atomic.

Operation ID + fingerprint + revision kiểm replay; source receipt chặn đổi ID để
nhận lại cùng nguồn. Không xóa receipt một lần bằng TTL tùy tiện.
Encounter outcome và reward snapshot phải bền vững; xem [đặc tả](progression-pve-spec.md).
Túi đầy giữ settlement chờ, không mất loot; chặn tạo thêm encounter thưởng mới đến
khi xử lý để không biến pending rewards thành kho vô hạn.

### Dọn túi luôn có đường thực hiện

Ngoài bán NPC, inventory phải có thao tác hủy vật phẩm thông thường sau xác nhận,
server kiểm ID/số lượng và receipt. Cấm hủy Mạch Bàn, vật phẩm quest và món đang
trang bị; có thể tháo món thường trước khi hủy. Không phụ thuộc mọi loại vật phẩm
đều có giá bán. Tính năng này nằm trong P2 cùng equip/consume, tránh kẹt thưởng khi
túi chỉ chứa kiếm, hạt hoặc nước mà shop chưa mua. Hủy không phát XP/tiền, không thể
hoàn tác; UI phải hiển thị rõ món và số lượng. Kiểm thử đầy cả 24 ô bằng món không
bán được, dọn một ô rồi nhận settlement đúng một lần.

## 10. Giao dịch người chơi chưa bật

Chỉ triển khai sau audit escrow, khóa món, xác nhận lại khi thay đổi, timeout,
mất mạng và audit hai phía. Không chuyển tiền/đồ bằng “trừ A rồi cộng B” qua hai
RPC không nhất quán. Metadata `bound` chưa phải hệ thống giao dịch đã hoàn chỉnh.

## 11. Nghiệm thu

Kiểm thu/craft/mua/bán/dùng không nhân đôi hoặc âm số; không bán đồ quest; không
giả giá/đổi giờ để thu sớm; chặn integer overflow; túi đầy không mất nguyên liệu;
reconnect/restart phục hồi đúng. Chạy từ lúc hết tiền/thuốc để chứng minh còn đường
chơi. Validator số học không thay kiểm thử cạnh tranh PostgreSQL hoặc playtest economy.
