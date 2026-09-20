# Đấu tập hai người — mốc online đầu tiên

Mốc này thực hiện bước kế tiếp của README và ADR-003: kiểm chứng Godot–Nakama
bằng một trận authoritative trước khi làm tài sản và nội dung lớn.

## Chạy và chơi

```sh
docker compose up --build -d
```

Mở `client/project.godot` bằng Godot 4.4.1. Chạy hai cửa sổ với **hai tài khoản
thiết bị khác nhau**. Từ terminal có `godot` trong PATH, tại thư mục repo:

```sh
godot --path client -- --guest=player1
godot --path client -- --guest=player2
```

1. Cả hai bấm **Kết nối**. Tài khoản thiết bị là chế độ thử localhost đã có.
2. Người thứ nhất bấm **Tạo đấu tập**, sao chép mã trong ô phòng.
3. Người thứ hai dán mã, bấm **Vào phòng**. Biết mã phòng là đủ để vào vị trí khách;
   đây chưa phải lời mời riêng có danh sách người được phép.
4. Cả hai bấm **Sẵn sàng**. Trận bắt đầu sau ba giây.
5. WASD/mũi tên di chuyển; chuột định hướng; **J hoặc chuột trái** đánh thường;
   **Space** né theo hướng chuột. Ô nhập mã đang có focus sẽ chặn điều khiển.
6. HP về 0 thì kết thúc; hai người cùng về 0 được xử hòa. Bấm **Rời trận** rồi
   tạo phòng mới để chơi tiếp. Không thưởng tiền, không rơi đồ, không ghi HP vào hồ sơ.

Vật cản ở giữa phòng chặn đi/né/đánh. Hình nhân vật và sân là đồ họa tạm.
Client nội suy vị trí giữa snapshot, chưa có prediction/rollback hoặc đo ping.

## Luật server hiện tại

- Tối đa hai tài khoản, một phiên mỗi tài khoản; giữ một vị trí cho chủ phòng.
  Các lượt join đang chờ cũng chiếm chỗ để chống cuộc đua vượt sức chứa.
- Mô phỏng 20 Hz, snapshot 10 Hz. Mỗi tick nhận tối đa một input hợp lệ/người;
  chỉ phân tích tối đa bốn gói/người/tick. Nhiều input không làm tăng tốc mô phỏng.
- Tốc độ 180 px/s; chuẩn hóa hướng chéo; dừng hướng cũ sau 200 ms thiếu input.
- Đánh thường: windup 150 ms, active 100 ms, recovery 250 ms; cooldown 700 ms;
  cung 120 độ, tầm 41,6 px cộng bán kính mục tiêu 12 px. Một cast chỉ hit mỗi người
  một lần. Chỉ số đấu tập cố định ATK 16/DEF 5, sát thương 15, HP 100.
- Né 70,4 px trong năm bước 50 ms, cooldown 2,4 s. Miễn sát thương tại tuổi né
  50/100/150 ms; tuổi 0 và 200 ms không miễn. Né được hủy windup, không hủy recovery.
- Client chỉ gửi hướng/hành động. Vị trí, HP, sát thương, cooldown, danh tính mục tiêu
  không lấy từ dữ liệu client. Server kiểm tra epoch, sequence, phiên và số hữu hạn.
- Mất kết nối: dừng input, nhân vật vẫn chịu đòn; được trở lại trong 10 giây với HP
  và cooldown cũ. **Kết nối** đăng nhập lại và vào trận đang giữ trên cùng cửa sổ.
  Hết thời gian thì đối thủ đang kết nối thắng. Rời trận chủ động cũng theo cửa sổ
  này; chưa có lệnh đầu hàng riêng.
- Chờ phòng tối đa hai phút; đấu tối đa năm phút; lưu kết quả trong bộ nhớ 30 giây.
  Trận và kết quả không khôi phục sau khi Nakama restart. Đây là giới hạn có chủ đích
  của đấu tập không tài sản; không dùng cho boss/loot persistent.
- `combat_create` giới hạn ba lần/phút/tài khoản bằng quota CAS có sẵn.

## Hợp đồng mạng v1

RPC `combat_create` nhận `{"consent":true}`, trả `{matchId, version:1}`.
WebSocket `match_join` dùng `match_id` và metadata `{"consent":"true","version":"1"}`.
Client lấy epoch từ snapshot đầu, sau đó gửi `match_data_send` opcode **1**,
`data` là JSON UTF-8 được base64 hóa theo giao thức JSON của Nakama:

```json
{"epoch":"server-generated","seq":1,"moveX":0,"moveY":0,"aimX":1,"aimY":0,"action":"sk_basic"}
```

`action`: chuỗi rỗng, `ready`, `sk_basic`, `sk_dodge`. Hướng trong [-1,1], seq là
số nguyên tăng dần trong [0,2147483647], gói tối đa 512 byte. Sequence reset khi
server chấp nhận một phiên reconnect mới. Input sai bị bỏ qua.

Server gửi opcode **2**: `version`, `epoch`, `tick`, `phase`, `phaseAt`, `winner`,
`reason`, `rules`, `players`. Các pha: waiting → countdown → active → finished;
countdown quay lại waiting nếu có người rời. Snapshot chỉ có trạng thái công khai,
không gửi session ID, token hoặc dữ liệu tài sản. `winner` rỗng khi hòa/hủy.

## Kiểm thử

```sh
npm --prefix server ci
npm --prefix server test
godot --headless --path client --editor --quit
godot --headless --path client --quit-after 60
# Cần backend thật đã healthy:
godot --headless --path client --script res://tests/combat_smoke.gd
```

Unit test bao phủ phiên giả, replay/epoch, JSON lỗi/số vô hạn, spam tốc độ,
windup/cooldown, một hit/cast, hướng/tầm/vật cản, biên miễn sát thương, né không
xuyên tường, đồng thời knockout, reconnect và timeout. Smoke dùng ba tài khoản tạm
và hai client Godot thật để kiểm tra giới hạn phòng, di chuyển, sát thương, đồng
nhất HP, reconnect, kết thúc và hồ sơ không đổi; tự xóa các tài khoản đã tạo.
GitHub Actions chạy cả kiểm thử xã hội cũ và smoke chiến đấu với Nakama/PostgreSQL.

Chưa nghiệm thu cảm giác điều khiển ở RTT cao, tải nhiều phòng, mobile, kỹ năng
đạn/khiên, AI/quái, inventory hay kinh tế. Không suy rộng unit test thành các kết
luận này.
