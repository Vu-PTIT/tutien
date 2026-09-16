# 00 — Rà soát hiện trạng và nhật ký quyết định

**Trạng thái:** rà soát tài liệu + đề xuất; 16/09/2026.  
**Mục tiêu:** phát triển tiếp từ dự án hiện tại, không tạo một kiến trúc mới không liên quan.

## 1. Mốc nguồn đã đọc

| Nguồn | Mốc đọc | Kết luận trong phạm vi nguồn |
|---|---|---|
| `main/README.md` | Commit `40ba769c72ea48497fcd139a822d81579c3baf98` | Base Godot, đăng nhập thiết bị, RPC hồ sơ, Compose, unit/smoke test |
| Cây thư mục `main` | Cùng commit | Không thấy bộ tài liệu gameplay riêng |
| `feat/social-backend/docs/social-backend.md` | Commit `d6f07ef6d5d08c9a877f7166df94e5d9baa87a2f` | Tài khoản, bạn bè, nhóm `sect/guild`, chat, adapter Godot, giới hạn vận hành |
| `feat/social-backend/server/tsconfig.json` | Cùng commit | ES5, `module: none`, bundle `build/index.js`, dùng definitions Nakama |
| `Pasted markdown(1).md` trong Library | Bản đọc được trong phiên này | Lựa chọn công nghệ, server-authoritative, kiểm chứng online trước mở rộng nội dung |
| Nội dung yêu cầu trong Project | Yêu cầu tổng quát hiển thị | Kết hợp đời sống kiểu Stardew Valley với cày cuốc/PvP và hướng Phàm Nhân Tu Tiên |

Không suy luận rằng các nhánh đã merge với nhau. Không coi lịch sử chat hiển thị là bằng chứng file đã được push. Không có kết quả chạy lại game, Docker, smoke hoặc CI trong lần biên soạn tài liệu này.

## 2. Đã có gì, chưa được chứng minh điều gì?

| Mảng | Tài liệu mô tả đã có | Không được hiểu nhầm là đã xong |
|---|---|---|
| Client | Nhân vật hình tạm, di chuyển, kết nối backend | Combat, map hoàn chỉnh, UI xã hội, Android |
| Hồ sơ | Server tạo/đọc hồ sơ; client không tự ghi tiền/cấp | Inventory, migration gameplay, chống dupe mọi tình huống |
| Xã hội trên nhánh feature | Auth, bạn bè, chat, nhóm và adapter | Tông môn NPC, kho bang, chuyển chủ, tổ đội chiến đấu |
| Test trong tài liệu ngày 12/09 | Có ghi build và 23 unit test đạt | Smoke HTTP/WebSocket + DB thật khi đó còn chưa chạy |
| Hạ tầng | Môi trường localhost | Internet an toàn, dự phòng, khôi phục đã kiểm chứng |
| Online | Nền kết nối | Hai người chiến đấu trên cùng mô phỏng authoritative |

Giữ nguyên sự phân biệt “có code”, “được test đơn vị”, “qua tích hợp” và “sẵn sàng vận hành”.

## 3. Khoảng trống thiết kế cần lấp

| Khoảng trống | Rủi ro nếu không bổ sung | Tài liệu giải quyết |
|---|---|---|
| Chưa có vòng chơi đo được | Có nhiều tính năng nhưng không có lý do chơi lại | 01, 14 |
| Cảnh giới chỉ là tên gọi | Tu tiên thành hệ thống tăng số tuyến tính | 02, 03 |
| Thiếu luật rủi ro và rút lui | PvP phá nhịp chơi đời sống | 04, 08 |
| Story chưa gắn với hành động | Hội thoại dài nhưng nhiệm vụ chỉ giết quái | 05, 06 |
| Vườn tách khỏi hành trình | Farm thành minigame không liên quan | 07 |
| Lẫn tông môn NPC với group | Dữ liệu và quyền hạn xung đột | 08, 10 |
| Thiếu nguyên tắc ghi tài sản | Nhận đồ lặp, mất đồ khi disconnect | 10, 13 |
| Thiếu giới hạn nội dung MVP | Làm cùng lúc MMO, farm, bang chiến, nhiều cảnh giới | 01, 12 |
| Thiếu quy trình thêm nội dung | Thêm một quest phải sửa quá nhiều file code | 11 |
| Chưa có cổng nghiệm thu | “Xong” chỉ dựa trên cảm giác | 12, 13, 14 |

## 4. Quyết định thiết kế đề xuất

### ADR-001 — Bản sắc: phàm nhân sinh tồn, không phải thiên tài được chọn

Người chơi có xuất phát điểm bình thường. Nguồn tiến bộ đến từ tri thức, công pháp, tài nguyên, quan hệ và cách chuẩn bị. Không mở đầu bằng thần khí vô hạn hoặc huyết mạch khiến mọi người khác kém vĩnh viễn.

Đổi lại: phải làm rõ các quyết định nhỏ, thay vì dựa vào hiệu ứng hoành tráng để giữ hứng thú.

### ADR-002 — Top-down 2D và từng khu vực nhỏ

Dùng góc nhìn từ trên chéo nhẹ, di chuyển trên mặt phẳng. Đây là đề xuất để nối đời sống, khám phá và chiến đấu; chưa phải góc nhìn đã được người dùng khóa trước đó.

Không làm platformer và top-down cùng lúc. Map có instance/channel, không hứa một thế giới hàng nghìn người liên tục.

### ADR-003 — Giữ Godot–Nakama, kiểm chứng chiến đấu sớm

Không chuyển Unity, Phaser hoặc Godot headless chỉ vì nội dung mới dài hơn. Dựng thử authoritative match hai người trước khi vẽ hàng loạt map. Chỉ xem lại kiến trúc nếu mô phỏng và độ trễ thực tế không đạt.

### ADR-004 — Chỉ Luyện Khí 1–4 có gameplay trong MVP

Trúc Cơ, Kết Đan, Nguyên Anh và các cấp sau là đường hướng phát triển. Không sản xuất asset hoặc bảng chỉ số hàng trăm cấp trước khi chương đầu chơi tốt.

### ADR-005 — Không RNG quyết định số phận lúc tạo nhân vật

MVP có hồ sơ linh căn nền giống nhau về ngân sách sức mạnh. Sở trường linh căn và công pháp được mở/chọn về sau, không quay tài khoản để tìm thiên linh căn.

### ADR-006 — Thất bại có giá nhưng không hủy tài khoản

MVP không mất trang bị vĩnh viễn, không tụt cảnh giới, không xóa nhân vật. Thất bại làm mất thời gian, phần thưởng chưa xác nhận hoặc cơ hội tuyến đường. Mọi vùng rủi ro cao tương lai phải có thông báo và đồng thuận.

### ADR-007 — Tông môn NPC và cộng đồng người chơi là hai lớp

Giữ `sect/guild` đang có trong backend như group người chơi. Tông môn NPC là nội dung thế giới riêng; không đổi nghĩa dữ liệu cũ âm thầm.

### ADR-008 — Bản thiết kế không phải mã triển khai

Mọi API mới, tên module mới, JSON mẫu và công thức là hợp đồng đề xuất. Chỉ khi có code, tích hợp và test tương ứng mới chuyển trạng thái thành hiện có.

## 5. Các lựa chọn chưa khóa

| Câu hỏi | Mặc định cho prototype | Điều kiện xem lại |
|---|---|---|
| Nền tảng đầu tiên | Windows; thử thao tác Android sớm | Mục tiêu phát hành được thay đổi |
| Đồ họa | Tile 32 px, nhân vật khoảng 32×48 px | Mẫu scene trên màn nhỏ không đọc được |
| Tick mô phỏng | 20 Hz | Profiling hoặc cảm giác né không đạt |
| PvP lâu dài | Đấu tập → đấu trường → vùng tranh đoạt tùy chọn | Chưa qua cân bằng và vận hành |
| Hệ nghề | Ai cũng học cơ bản, chuyên sâu về sau | Phân vai không có ích trong playtest |
| Cốt truyện | Câu chuyện gốc về linh mạch và quyền tiếp cận tài nguyên | Chủ dự án muốn một chủ đề khác |
| Kiếm tiền | Chưa triển khai | Phải có quyết định sản phẩm và đánh giá riêng |

## 6. Ghép tài liệu vào repo an toàn

1. Bắt đầu từ đúng nhánh sẽ triển khai; đối chiếu commit mới nếu repo đã thay đổi.
2. Tạo nhánh tài liệu, ví dụ `docs/detailed-cultivation-plan`.
3. Chép thư mục mới, không thay toàn bộ README hoặc social-backend.
4. Thêm liên kết `docs/game-design/README.md` vào README gốc.
5. Chạy validator, xem diff và kiểm tra file Unicode.
6. Khi sau này tìm được bộ MD từ Work/chat cũ: lập bảng mapping từng file, giữ quyết định đã xác nhận, ghi rõ điểm xung đột rồi mới hợp nhất.

Gói tài liệu này không tự thực hiện các lệnh Git trên repo từ xa.

## 7. Tiêu chí hoàn thành bước rà soát

Có nguồn gốc và mốc commit; không tuyên bố test chưa chạy; tách scope khỏi wishlist; mọi hệ thống lớn có luật, dữ liệu, phụ thuộc và kiểm thử; không ghi đè phần backend đã có.
