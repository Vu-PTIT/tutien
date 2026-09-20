# Tu Tiên — Bộ thiết kế và kế hoạch triển khai v2

**Ngày biên soạn:** 16/09/2026  
**Trạng thái:** Đề xuất thiết kế để triển khai; không phải thông báo tính năng đã có.  
**Nền dự án:** Godot + GDScript / Nakama + TypeScript / PostgreSQL.  
**Định hướng người dùng:** 2D đời sống–khám phá, có cày cuốc, PvP và cộng đồng; phát triển theo tinh thần Phàm Nhân Tu Tiên.

> Một tán tu bình thường tích lũy năng lực bằng hiểu biết, chuẩn bị và lựa chọn đúng; xây được nơi an thân, rồi bước vào những cuộc tranh đoạt lớn hơn.

## 1. Phạm vi rà soát và giới hạn

Đã đọc README trên `main`, tài liệu `docs/social-backend.md` và cấu hình TypeScript trên `feat/social-backend`, đối chiếu cây thư mục của hai nhánh, cùng tài liệu công nghệ Markdown trước đây trong Library.

Ở những nguồn truy cập được, chưa tìm thấy bộ Markdown nhân vật/story/map/sức mạnh được nhắc đến trong cuộc trò chuyện ngày 16/09. Vì vậy, đây là **bộ tài liệu bổ sung dựa trên nền đã kiểm tra**, không khẳng định đã chỉnh từng dòng của những file chưa truy cập được.

Gói này không thay mã nguồn, không ghi đè tài liệu gốc, không tự merge hai nhánh. Những tên riêng, cốt truyện, vật phẩm và thông số gameplay mới đều là đề xuất cho game, không phải thông tin chính thức của phim.

> **Đối chiếu repo 20/09/2026:** các file 08–15 và design-samples/validator trong mục lục dưới đây chưa có trên Git. Xem [tiến độ mã nguồn](../implementation-status.md) và [mốc combat hiện tại](../combat-prototype.md) để phân biệt thiết kế với implementation.

## 2. Đọc theo mục tiêu

| File | Nội dung chính | Người dùng chính |
|---|---|---|
| [00-review-and-decisions.md](00-review-and-decisions.md) | Hiện trạng, khoảng trống, quyết định thiết kế, cách ghép tài liệu | Chủ dự án |
| [01-vision-and-core-loop.md](01-vision-and-core-loop.md) | Bản sắc, vòng chơi, phạm vi từng bản, phiên chơi mẫu | Toàn đội |
| [02-character-and-cultivation.md](02-character-and-cultivation.md) | Tạo nhân vật, linh căn, tu vi, cảnh giới, đột phá | Gameplay |
| [03-combat-skills-and-artifacts.md](03-combat-skills-and-artifacts.md) | Chiến đấu, kỹ năng, pháp khí, chỉ số, AI, chống gian lận | Gameplay / server |
| [04-world-and-maps.md](04-world-and-maps.md) | Bốn map MVP, tuyến đường, phân vùng rủi ro, chuyển map | Level design |
| [05-story-bible.md](05-story-bible.md) | Thế giới, xung đột, sáu NPC, chương đầu và hướng dài hạn | Narrative |
| [06-quests-and-events.md](06-quests-and-events.md) | 12 nhiệm vụ chính, 6 nhiệm vụ phụ, nhánh lựa chọn và lưu tiến độ | Content / server |
| [07-garden-crafting-and-economy.md](07-garden-crafting-and-economy.md) | Vườn linh thảo, năm công thức, nguồn–chỗ tiêu tài nguyên | Economy |
| [08-sects-social-and-pvp.md](08-sects-social-and-pvp.md) | Tông môn NPC, nhóm người chơi, tổ đội, chat, luật PvP | Social |
| [09-ui-art-and-audio.md](09-ui-art-and-audio.md) | Màn hình, luồng thao tác, đồ họa, âm thanh, Android | Client / art |
| [10-architecture-and-data.md](10-architecture-and-data.md) | Module, lưu trạng thái, mạng, giao dịch nguyên tử, mở rộng | Engineering |
| [11-content-pipeline.md](11-content-pipeline.md) | ID, dữ liệu mẫu, quy trình thêm nội dung và phiên bản | Engineering / content |
| [12-roadmap-and-backlog.md](12-roadmap-and-backlog.md) | Mốc bàn giao, thứ tự phụ thuộc, đầu việc có tiêu chí xong | Producer |
| [13-testing-and-operations.md](13-testing-and-operations.md) | Kiểm thử gameplay, mạng, tài sản, vận hành và playtest | QA / server |
| [14-vertical-slice-walkthrough.md](14-vertical-slice-walkthrough.md) | Kịch bản demo 30 phút và bộ nghiệm thu xuyên hệ thống | Toàn đội |
| [15-sources-and-change-log.md](15-sources-and-change-log.md) | Nguồn, phạm vi xác minh, nhật ký thay đổi | Toàn đội |

**Bắt đầu:** 00 → 01 → 14 → 12. Khi triển khai một hệ thống, đọc file chuyên môn tương ứng.

## 3. Những con số thống nhất trong toàn bộ gói

Các con số dưới đây là **mục tiêu prototype cần playtest**, không phải benchmark hoặc dự báo doanh thu.

| Hạng mục | MVP đề xuất |
|---|---|
| Cảnh giới có gameplay | Phàm nhân trong phần mở đầu; Luyện Khí tầng 1–4 |
| Thế giới | 4 map gameplay; vườn là giao diện ô đất riêng tại hub, không tính thành map thứ năm |
| Nội dung | 6 NPC có tên; 12 nhiệm vụ chính; 6 nhiệm vụ phụ |
| Kẻ địch | 3 loại thường + 1 loại tinh anh + 1 boss |
| Kỹ năng | 6 hành động định nghĩa: đánh thường, né, 3 kỹ năng chủ động, dò mạch |
| Trang bị chiến đấu | 1 pháp khí chính, 1 giáp, 1 hộ cụ; Mạch Bàn là công cụ riêng |
| Vườn | 6 ô đất; 3 loại cây |
| Chế tạo | 5 công thức; 24 định nghĩa vật phẩm |
| Nhóm chơi | Tối đa 2 người trong thử nghiệm online MVP |
| PvP | Đấu tập đồng thuận, không rơi đồ, không thưởng tiền; không phải PvP mở |
| Kỹ thuật | Thử tick server 20 Hz, snapshot 10 Hz; phải đo rồi mới giữ hoặc đổi |
| Thương mại | Chưa có cửa hàng tiền thật, chợ người chơi hay đấu giá |

## 4. Quy ước trạng thái

- **HIỆN CÓ:** có dấu vết trong mã/tài liệu đã đọc; mức kiểm thử được ghi riêng.
- **MVP:** phạm vi nhỏ nhất để kiểm chứng vòng chơi.
- **ALPHA:** mở rộng sau khi MVP qua cổng nghiệm thu.
- **SAU ALPHA:** chỉ định hướng; không đưa vào critical path hiện tại.
- **ĐỀ XUẤT:** lựa chọn đang dùng để cụ thể hóa kế hoạch, chưa coi là quyết định đã được chủ dự án phê duyệt.

Không đánh dấu một đầu việc hoàn tất chỉ vì đã có Markdown, dữ liệu mẫu hoặc unit test giả lập.

## 5. Dữ liệu và cách sử dụng gói

[`design-samples/mvp.catalog.json`](../../design-samples/mvp.catalog.json) mô tả danh mục mẫu và quan hệ giữa các thực thể. [`scripts/validate_design.py`](../../scripts/validate_design.py) kiểm tra cấu trúc, tham chiếu, chu trình nhiệm vụ và các giới hạn MVP. Đây là công cụ kiểm tra **thiết kế**, chưa phải trình nạp nội dung của Godot hoặc Nakama.

Từ thư mục gốc của gói:

```sh
python scripts/validate_design.py
```

Khi đưa vào repo: thêm `docs/game-design/`, `design-samples/` và script kiểm tra trên một nhánh tài liệu riêng. Giữ `README.md` gốc và `docs/social-backend.md`; chỉ thêm liên kết tới bộ thiết kế. Xem hướng dẫn chi tiết ở file 00.
