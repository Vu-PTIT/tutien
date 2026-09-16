# 06 — Nhiệm vụ, lựa chọn và sự kiện

**Phạm vi MVP:** 12 nhiệm vụ chính + 6 nhiệm vụ phụ.  
**Mục tiêu:** nhiệm vụ dạy hệ thống, tạo quyết định và liên kết với thế giới; không chỉ tăng số quái phải giết.

## 1. Máy trạng thái nhiệm vụ

`locked → available → accepted → objectives_complete → reward_committed`.

`abandoned` chỉ dùng cho nhiệm vụ phụ có thể nhận lại. Nhiệm vụ chính không xóa cờ lựa chọn khi người chơi bấm hủy theo dõi. “Không theo dõi” là trạng thái UI, không phải hủy quest.

Mỗi objective có ID ổn định, loại event và điều kiện. Hoàn thành mục tiêu không đồng nghĩa đã nhận thưởng; giao dịch nhận thưởng là bước riêng, có receipt và cờ vĩnh viễn.

## 2. Mười hai nhiệm vụ chính

| ID / tên | Điều kiện | Hành động và cơ chế được dạy | Kết quả chính |
|---|---|---|---|
| `q_main_001` Việc ở An Khê | Nhân vật mới | Nói chuyện Bà Sâm, nhận việc tại trạm | Mở journal và mục tiêu khảo sát |
| `q_main_002` Dấu nước lạ | 001 | Theo Lục Vi tới dấu suối, nhận Mạch Bàn, dò hai điểm | Mở `sk_scan`, thu mẫu nước |
| `q_main_003` Hơi thở đầu tiên | 002 | Thực hành dẫn khí tại hub bằng tương tác hướng dẫn | Luyện Khí 1, `insight.breath_control`, Phi Nhận |
| `q_main_004` Một khoảnh đất nhỏ | 003 | Trồng mẻ hướng dẫn và thu Cam Lộ | Mở vườn; mẻ đầu trưởng thành 60 giây |
| `q_main_005` Không đi tay không | 004 | Luyện và mang một Hồi Nguyên Hoàn; không bắt buộc uống nếu chưa mất HP | `insight.first_craft`, mở công thức cơ bản |
| `q_main_006` Lối rừng bị cấm | 005 | Vượt một encounter Sơn Trư hoặc dùng tuyến tránh đã dò | Mở đường tới Thạch Cạn |
| `q_main_007` Chữ trong sổ đá | 006 | Tìm sổ ghi và mảnh dấu ở Thạch Cạn | Đủ thông tin về chuyển dòng |
| `q_main_008` Nói với ai | 007 | Chọn trình kín hoặc công khai chứng cứ | Cờ `choice.evidence`, đổi phản ứng NPC |
| `q_main_009` Chìa của người giữ giếng | 008 | Gặp Tống Đức, đối chiếu sơ đồ, nhận quyền tiếp cận | Mở cổng Cổ Tỉnh |
| `q_main_010` Chuẩn bị một đường về | 009 | Kiểm tra loadout, xem checkpoint, chọn vào solo/co-op | Hướng dẫn rút lui, không buộc tiêu phù |
| `q_main_011` Mộc Tâm Thủ Trận | 010 | Hoàn thành boss bằng hạ tâm trận hoặc niêm phong | Cờ giải quyết encounter, không chọn hộ đồng đội |
| `q_main_012` Dòng nước trở lại | 011 | Về hub, xác nhận kết quả và nói chuyện người liên quan | `story.ch1.complete`, cho phép đột phá tầng 4 |

001–012 là chuỗi khung. Những nhánh giải quyết trong 006, 008 và 011 được lưu bằng flags/objectives, không tách thành những quest chính loại trừ nhau khiến catalog khó kiểm soát.

### Mốc thời lượng cần thử

001–005 hướng tới phiên đầu khoảng 30 phút. Toàn chương dự kiến kiểm chứng ở khoảng 2–4 giờ chơi chủ động, không phải lịch chờ cây hoặc cam kết nội dung. Nếu người mới bị giữ ở một ngưỡng XP quá lâu, điều chỉnh nguồn XP trước khi thêm daily.

## 3. Sáu nhiệm vụ phụ

| ID | Tên / mở sau | Nội dung | Giá trị ngoài tiền |
|---|---|---|---|
| `q_side_001` | Cầu qua suối / 002 | Góp trúc và giúp sửa cầu | Đường về ngắn hơn |
| `q_side_002` | Đất chưa hiểu cây / 004 | Trồng loại cây thứ hai, đọc kết quả | Dạy khác biệt thời gian trồng |
| `q_side_003` | Tiếng động trong khe / 006 | Quan sát Thạch Vệ từ vị trí an toàn | Dạy nhìn đòn trước khi đánh |
| `q_side_004` | Lời hẹn của người thợ / 007 | Mang quặng cho Đỗ Khê | Mở công thức Thanh Thiết Kiếm |
| `q_side_005` | Giá một lời đồn / 008 | Kiểm chứng hai lời kể trái nhau | Journal ghi nguồn tin đáng tin hơn |
| `q_side_006` | Sau trận nước đục / 012 | Hỗ trợ sửa chữa hoặc khảo sát tùy kết cục | Thế giới phản hồi lựa chọn |

Không có nhiệm vụ phụ nào là điều kiện kín cho quest chính. Công thức kiếm có thể mở bằng trả phí nghiên cứu thông thường nếu không làm nhiệm vụ 004; không để thiếu DPS bắt buộc vì bỏ side quest.

## 4. Objective theo event, không theo lời client

| Objective type | Event đáng tin | Điều không chấp nhận |
|---|---|---|
| `talk_to_npc` | Tương tác NPC đúng map/khoảng cách đã xác nhận | Client gửi “đã nói chuyện” không có kiểm tra |
| `inspect_poi` | Server xác nhận scan đúng điểm | Sửa vị trí hoặc tự cung cấp kết quả scan |
| `collect_item` | Inventory đã có vật phẩm hợp lệ | Client khai số lượng tùy ý |
| `craft_recipe` | Giao dịch craft thành công | Bấm nút chế tạo nhưng giao dịch thất bại |
| `complete_encounter` | Encounter settlement phía server | Client báo boss chết |
| `choose_branch` | Chọn trong trạng thái quest hợp lệ | Sửa nhánh sau khi thưởng đã commit |
| `enter_area` | Authoritative map/trigger event | Teleport cục bộ client |
| `cultivation_milestone` | Giao dịch tiến trình thành công | Client sửa cảnh giới |

Event chứa `eventId`, `characterId`, `eventType`, `sourceId`, `occurredAt`, `contentVersion`. Không đưa event gameplay nguyên bản cho client gọi như RPC công khai.

## 5. Phần thưởng

Quest chính có XP, lượng linh thạch nhỏ và mở khóa. Phần thưởng dạy cơ chế phải bảo đảm nhận được: công pháp nhập môn, Mạch Bàn và quyền vào Cổ Tỉnh không phụ thuộc loot ngẫu nhiên.

Cờ lĩnh ngộ cấp tại giao dịch nhận thưởng tương ứng. Sau `q_main_005` đã có `insight.first_craft`; không đợi `q_main_007` mới cấp cờ này.

XP mẫu cho 003–012 lần lượt: 40, 60, 100, 120, 180, 120, 180, 100, 250, 300. Tổng 1.450 XP; còn phần để đạt các ngưỡng 1.900 XP đến tầng 4 đến từ encounter, khám phá và side quest. XP nhận lúc phàm nhân được giữ như dự trữ nhưng 001–002 không cần cấp XP.

Đây là cấu hình prototype. Phải đo thời gian thực tế thay vì suy luận XP tự động đồng nghĩa với số giờ chơi.

## 6. Nhánh lựa chọn cụ thể

### Chứng cứ `choice.evidence`

`private_review`: nộp riêng cho Tạ Nghiêm và yêu cầu đối chiếu.  
`public_notice`: đưa thông tin cho dân làng cùng bằng chứng đọc được.

Hai nhánh có cùng mở khóa chính và ngân sách thưởng. Khác người cung cấp gợi ý tiếp theo. Không có nhánh thưởng cả tín nhiệm của mọi bên.

### Kết trận `choice.array`

`destroy_core`: phá tâm trận sau khi boss được xử lý.  
`seal_flow`: hoàn thành thao tác niêm phong khi điều kiện encounter đủ.

Việc phối hợp chiến đấu là chung; journal cá nhân chỉ ghi lựa chọn tương thích với kết quả encounter mà nhân vật tham dự. Khi về làng, người chơi xác nhận cách trình bày, không đảo ngược thực tế boss đã xảy ra.

## 7. Chống kẹt tiến trình

Vật phẩm quest không bán, không rơi khi chết, không tặng. Nếu bắt buộc thu hồi vật phẩm, dùng trạng thái quest có thể tái cấp chính xác một bản.

Túi đầy khi thưởng: MVP hiển thị cần dọn chỗ và giữ quest ở `objectives_complete`; không trừ nguyên liệu/nộp quest trước rồi mới phát hiện hết ô. Chưa cần hệ mail quà để vá lỗi.

Rời party giữa quest không xóa tiến độ riêng. Boss đã hoàn thành nhưng mất mạng trước nói chuyện kết thúc: được về nhận thưởng qua cờ encounter đã lưu. Chết hoặc rời trước khi đủ điều kiện tham gia không tự được cấp công lao.

## 8. Co-op và credit

MVP dùng credit tham dự encounter: có mặt trong instance, đã tham gia ít nhất một hành động hợp lệ và không rời trước settlement, trừ reconnect grace được server xác nhận. Hành động hỗ trợ/khiên cũng tính, không chỉ sát thương.

Không dùng đòn cuối làm điều kiện duy nhất. Không cho nhân vật AFK ngoài cửa nhận thưởng chính.

Quest trồng/craft và lựa chọn hội thoại vẫn cá nhân. Party không dùng chung inventory hoặc XP.

## 9. Hợp đồng dữ liệu quest mẫu

```json
{
  "id": "q_main_005",
  "chapterId": "ch_01",
  "requiredQuestIds": ["q_main_004"],
  "giverNpcId": "npc_ba_sam",
  "objectives": [
    {"id": "craft_one", "type": "craft_recipe", "targetId": "rc_heal", "count": 1}
  ],
  "reward": {
    "cultivationXp": 100,
    "spiritStones": 20,
    "flags": ["insight.first_craft"]
  },
  "repeatable": false,
  "contentVersion": "mvp-design-1"
}
```

Số tiền minh họa là một đề xuất; catalog mẫu lưu cấu trúc thưởng XP chính và mở khóa. Trước khi runtime sử dụng phải bổ sung, khóa và kiểm thử toàn bộ budget kinh tế.

## 10. Sự kiện thế giới

MVP chưa có live event theo giờ. Chỉ có sự kiện nội dung kích hoạt bởi quest và encounter.

Alpha có thể thêm đoàn hàng, mạch linh khí bất ổn hoặc một yêu thú xuất hiện trên tuyến phụ. Sự kiện không giữ vật liệu duy nhất cho tiến trình chính. Người vào muộn phải biết điều kiện tham dự và phần thưởng.

## 11. Nghiệm thu

Kiểm tra toàn bộ chuỗi từ tài khoản mới; cả nhánh kín/công khai, phá/niêm phong; túi đầy; chết; reconnect; bỏ side quest; co-op khác tiến độ; hai lần claim cùng/different operation ID; migration đổi text không làm mất quest; không có chu trình điều kiện trong catalog.
