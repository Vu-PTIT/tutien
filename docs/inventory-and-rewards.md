# Túi đồ, trang bị và thưởng PvE — P2

## Chơi thử

1. Chạy backend như README, mở Godot, **Kết nối** rồi nhận vật tư khởi đầu trong **Túi đồ**.
2. Trang bị Áo vải trong túi. Khi profile là Luyện Khí, nút **Săn Sơn Trư** mở bãi săn riêng; cùng nút điều khiển PC/cảm ứng dùng để đi, đánh và né.
3. Đọc hướng gầm, né cú lao, đánh khi Sơn Trư hồi thế. Chiến thắng Luyện Khí nhận 10 tu vi và 1 Da Sơn Trư. Bài luyện Phàm Nhân không phát XP/loot.
4. Hồi Nguyên Hoàn dùng trong Túi đồ, hồi tối đa 40 HP. Nếu túi đầy lúc nhận da, settlement được giữ; bỏ vật tư thường để trống một ô rồi bấm **Nhận thưởng đang chờ**.

Gói prototype `starter:v1` giữ nguyên: 12 linh thạch, 2 hạt Cam Lộ, 4 nước,
2 Hồi Nguyên Hoàn và 1 áo vải. Không cấp Mạch Bàn/đồ nhiệm vụ trước story.
Craft, mua bán, vườn, quest runtime, đột phá và mobile export vẫn ở các mốc sau.

## Hợp đồng profile

`characters/main` thuộc user đăng nhập, đọc chỉ chủ sở hữu, client không được ghi.
Tiền, túi, XP, HP và trang bị nằm trong cùng object; không dùng Nakama wallet rời.

```json
{
  "schemaVersion": 3,
  "characterId": "user UUID",
  "realm": "mortal",
  "realmStage": 0,
  "cultivationXp": 0,
  "hp": 100,
  "equipped": { "weapon": "", "armor": "" },
  "spiritStones": 0,
  "revision": 0,
  "inventory": []
}
```

- Túi 24 ô; nguyên liệu/tiêu hao stack tối đa 99; đồ nhiệm vụ tối đa 1 mỗi ô.
- Trang bị có `instanceId` UUID. Áo vải thêm 15 phòng thủ; Thanh Thiết Kiếm thêm 5 công.
- Hồi Nguyên Hoàn hồi 40 HP, tối đa 100; dùng thuốc khi HP đầy bị từ chối và không tiêu hao.
- XP săn Sơn Trư: Luyện Khí tầng 1/2/3 được cộng tối đa tương ứng 600/1200/2000 XP tích lũy; tầng 4 không nhận XP. XP và loot lưu cùng giao dịch cấp reward. Đây là giới hạn an toàn thử nghiệm, chưa qua cân bằng vòng chơi.
- Giới hạn tiền và revision: 1 tỷ, số nguyên. Đạt giới hạn thì từ chối toàn bộ.
- Schema 1 được migrate sang 3 theo luật cũ (`pham_nhan/level:1` → mortal; Luyện Khí 1–4 giữ tầng). Schema 2 giữ tiền, realm/tầng, revision, inventory và trường bổ sung; thêm XP 0, HP 100, hai ô trang bị rỗng. CAS bảo vệ migration cạnh tranh.
- Schema lạ, tầng ngoài phạm vi hoặc dữ liệu lỗi bị khóa thao tác để rà soát, không âm thầm reset/clamp. Chưa có màn hình quản trị xử lý dữ liệu cần rà soát.

## RPC

| RPC | Payload | Tác dụng |
|---|---|---|
| `get_profile` | `{}` | Đọc hoặc khởi tạo/migrate profile schema 3 |
| `inventory_get` | `{}` | Profile, catalog, trạng thái starter và settlement đang chờ |
| `inventory_claim_starter` | `{"operationId":"starter_claim_v1"}` | Nhận gói đầu đúng một lần |
| `inventory_equip` | `{"operationId":"...","instanceId":"..."}` | Trang bị/tháo đúng instance có trong túi |
| `inventory_use` | `{"operationId":"...","itemId":"it_heal_pill"}` | Dùng Hồi Nguyên Hoàn |
| `inventory_discard` | `{"operationId":"...","itemId":"it_water","quantity":4}` | Bỏ vật tư thường; không bỏ đồ bound/quest/đang trang bị |
| `pve_son_tru_create` | `{"consent":true}` | Tạo hoặc tiếp tục trận săn riêng của tài khoản |
| `pve_son_tru_claim_pending` | `{}` | Thử nhận settlement còn chờ |

Thao tác túi nhận `operationId` 8–80 chữ/số/`_`/`-`; retry cùng ID không lặp
thay đổi. Mọi RPC từ chối trường thưởng, user, source hoặc stat do client tự gửi.
Không có RPC cấp đồ/XP tùy ý.

## Trận Sơn Trư và settlement

Match `pve_son_tru` là solo, 20 tick/giây; server kiểm tra chủ match, consent,
sequence, phiên socket, biên, tốc độ, hit, HP, tell/charge/recover, cooldown và
thời điểm né. Client chỉ gửi hướng di chuyển, hướng đánh và ý định đánh/né.
Chỉ trang bị có trong profile mới đổi công/thủ. Hạ Sơn Trư ở Luyện Khí lưu outcome
theo `encounterId:generation`, source riêng và con trỏ `pending` trong cùng batch
storage trước khi báo nhận thưởng. Receipt asset giữ tính duy nhất khi retry.

Khi túi đầy, profile không bị cộng nửa phần thưởng; outcome giữ nguyên qua restart,
`inventory_get` báo rõ đồ/XP đang chờ, encounter thưởng mới bị chặn. Sau khi người
chơi dọn chỗ, cùng settlement được claim một lần rồi chuyển `settled`. Mất ACK có
thể retry vì operation/source receipt ổn định.

HP bị lưu khi người chơi rời trận, server dừng, thua/hồi phục hoặc hạ quái. Thua
hồi lại ở HP lúc bắt đầu chuyến săn; chiến thắng giữ HP còn lại. Có cooldown săn
45 giây sau khi hạ quái. Bài luyện Phàm Nhân chỉ kiểm thử combat, không ghi reward.

## Kiểm chứng

- `npm --prefix server test`: 80 unit test, gồm schema/migration, CAS/replay, trang bị/vật phẩm, admission PvE, giới hạn di chuyển, AI Sơn Trư, kill reward, full-bag outbox/restart, checkpoint HP, phục hồi khi poll settlement gặp lỗi đọc storage và quota đăng nhập dev/test.
- `node scripts/inventory-smoke.mjs`: Docker/Nakama/PostgreSQL; kiểm tra profile/schema 2 migration, starter, quyền truy cập, equip/use/discard, full bag, settlement chờ, restart rồi nhận đúng một lần.
- `client/tests/inventory_smoke.gd`: Godot 4.6.1 panel smoke, gồm nhận starter/trang bị/replay. `client/tests/combat_smoke.gd` còn mở trận PvE thật và quan sát tell/lao/hồi thế trên Nakama.
- SQL fixture chỉ dùng với account do smoke tạo; không mở admin/debug RPC trong runtime.
- Unit test cover authoritative match loop. Live Docker/Godot gate phải được xác nhận từ CI; unit test không thay cho engine, websocket hoặc thiết bị mobile.

Mất acknowledgement được fault-inject trong unit test; live smoke khởi động lại
Nakama và xác nhận settlement/receipt còn bền vững. Không giả định đã kiểm mọi
thời điểm mất điện hoặc mất mạng.
