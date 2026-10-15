# Túi đồ, trang bị và thưởng PvE — P2

## Chơi thử

1. Chạy backend như README, mở Godot, **Kết nối** rồi nhận vật tư khởi đầu trong **Túi đồ**.
2. Trang bị Áo vải trong túi. Nút **Săn Lợn Gai** mở bãi săn riêng; cùng nút điều khiển PC/cảm ứng dùng để đi, đánh và né.
3. Đọc hướng gầm, né cú lao, đánh khi Lợn Gai hồi thế. Người chơi đã chọn hình dạng thắng thì nhận 1 Da Lợn Gai và linh năng Thổ cho Nội Giới. Hồ sơ chưa chọn hình dạng chỉ luyện tập, không nhận thưởng.
4. Thuốc Hồi Sức dùng trong Túi đồ, hồi tối đa 40 HP. Nếu túi đầy lúc nhận da, settlement được giữ; bỏ vật tư thường để trống một ô rồi bấm **Nhận thưởng đang chờ**.

Gói prototype `starter:v1` giữ nguyên: 12 linh thạch, 2 hạt Cam Lộ, 4 nước,
2 Thuốc Hồi Sức và 1 áo vải. Không cấp La Bàn Linh/đồ nhiệm vụ trước story.
Craft, mua bán, vườn, quest runtime, đột phá và mobile export vẫn ở các mốc sau.

## Hợp đồng profile

`characters/main` thuộc user đăng nhập, đọc chỉ chủ sở hữu, client không được ghi.
Tiền, túi, HP, hình dạng và trang bị nằm trong cùng object; không dùng Nakama wallet rời. Nội Giới nằm ở row `inner_worlds/main` riêng.

```json
{
  "schemaVersion": 5,
  "characterId": "user UUID",
  "form": { "kind": "human", "speciesId": "human", "selected": false },
  "hp": 100,
  "equipped": { "weapon": "", "armor": "" },
  "equippedSkills": { "active_1": "" },
  "learnedSkills": [],
  "spiritStones": 0,
  "revision": 0,
  "inventory": []
}
```

- Túi 24 ô; nguyên liệu/tiêu hao stack tối đa 99; đồ nhiệm vụ tối đa 1 mỗi ô.
- Trang bị có `instanceId` UUID. Áo vải thêm 15 phòng thủ; Kiếm Sắt thêm 5 công.
- Thuốc Hồi Sức hồi 40 HP, tối đa 100; dùng thuốc khi HP đầy bị từ chối và không tiêu hao.
- Không có cấp độ hay XP. Sức mạnh đến từ [Nội Giới](inner-world-backend.md).
- Giới hạn tiền và revision: 1 tỷ, số nguyên. Đạt giới hạn thì từ chối toàn bộ.
- Hồ sơ schema 1–4 được nâng lên 5 khi đọc: giữ tiền, revision, túi đồ và trường bổ sung; thêm HP 100, ô trang bị, ô kỹ năng và hình dạng nếu thiếu. Các trường cấp độ cũ (`realm`, `realmStage`, `cultivationXp`) bị bỏ; nhân vật cũ đã lên tầng 1–4 nhận một lần linh năng Thổ (20 mỗi tầng) vào Nội Giới. Hình dạng `spirit_beast` đổi thành `spirit`; vật phẩm nhiệm vụ đã bỏ bị xóa khỏi túi. CAS bảo vệ migration cạnh tranh. Bảng ID cũ → mới ở `server/src/legacy_ids.ts`.
- Schema lạ, tầng ngoài phạm vi hoặc dữ liệu lỗi bị khóa thao tác để rà soát, không âm thầm reset/clamp. Chưa có màn hình quản trị xử lý dữ liệu cần rà soát.

## RPC

| RPC | Payload | Tác dụng |
|---|---|---|
| `get_profile` | `{}` | Đọc hoặc khởi tạo/migrate profile schema 3 |
| `inventory_get` | `{}` | Profile, catalog, trạng thái starter và settlement đang chờ |
| `inventory_claim_starter` | `{"operationId":"starter_claim_v1"}` | Nhận gói đầu đúng một lần |
| `inventory_equip` | `{"operationId":"...","instanceId":"..."}` | Trang bị/tháo đúng instance có trong túi |
| `inventory_use` | `{"operationId":"...","itemId":"it_heal_pill"}` | Dùng Thuốc Hồi Sức |
| `inventory_discard` | `{"operationId":"...","itemId":"it_water","quantity":4}` | Bỏ vật tư thường; không bỏ đồ bound/quest/đang trang bị |
| `pve_lon_gai_create` | `{"consent":true}` | Tạo hoặc tiếp tục trận săn riêng của tài khoản |
| `pve_lon_gai_claim_pending` | `{}` | Thử nhận settlement còn chờ |

Thao tác túi nhận `operationId` 8–80 chữ/số/`_`/`-`; retry cùng ID không lặp
thay đổi. Mọi RPC từ chối trường thưởng, user, source hoặc stat do client tự gửi.
Không có RPC cấp đồ/XP tùy ý.

## Trận Lợn Gai và settlement

Match `pve_lon_gai` là solo, 20 tick/giây; server kiểm tra chủ match, consent,
sequence, phiên socket, biên, tốc độ, hit, HP, tell/charge/recover, cooldown và
thời điểm né. Client chỉ gửi hướng di chuyển, hướng đánh và ý định đánh/né.
Chỉ trang bị có trong profile mới đổi công/thủ. Hạ Lợn Gai (đã chọn hình dạng) lưu outcome
theo `encounterId:generation`, source riêng và con trỏ `pending` trong cùng batch
storage trước khi báo nhận thưởng. Receipt asset giữ tính duy nhất khi retry.

Khi túi đầy, profile không bị cộng nửa phần thưởng; outcome giữ nguyên qua restart,
`inventory_get` báo rõ đồ/linh năng đang chờ, encounter thưởng mới bị chặn. Sau khi người
chơi dọn chỗ, cùng settlement được claim một lần rồi chuyển `settled`. Mất ACK có
thể retry vì operation/source receipt ổn định.

HP bị lưu khi người chơi rời trận, server dừng, thua/hồi phục hoặc hạ quái. Thua
hồi lại ở HP lúc bắt đầu chuyến săn; chiến thắng giữ HP còn lại. Có cooldown săn
45 giây sau khi hạ quái. Bài luyện Phàm Nhân chỉ kiểm thử combat, không ghi reward.

## P3 — Trang bị rơi từ quái trên map — 28/09/2026

- Hai Lợn Gai ở Bìa Rừng đều luôn rơi Da Lợn Gai và có 20% cơ hội rơi Kiếm Sắt (+5 công); nếu chưa rơi, món kiếm được bảo đảm ở lần hạ Lợn Gai đủ thứ 8.
- Hai Nhện Tơ Điện đều luôn rơi Tơ nhện và có 10% cơ hội rơi Áo Tơ Nhện (+20 thủ), là nâng cấp so với Áo vải khởi đầu (+15 thủ); món giáp được bảo đảm ở lần hạ Nhện Tơ Điện đủ thứ 12.
- Bộ đếm pity theo tài khoản và item, dùng chung giữa các spawn cùng loài, lưu trong world session. Mỗi lần hạ gộp XP, vật liệu, trang bị (nếu có), pity và receipt vào cùng giao dịch CAS của Nakama; retry/reconnect không cấp trùng. Khi túi đầy, transaction không tiêu thụ quái hay pity nên có thể dọn túi rồi đánh lại.
- Túi vẫn có 24 ô; runtime catalog lên v2 với 25 ID. Vật phẩm trang bị tạo instance riêng, có thể trang bị trong Túi đồ; kiếm tăng sát thương field và giáp dùng chỉ số phòng thủ trong combat hiện có. Quái và vật phẩm vẫn do server xác nhận.

## Kiểm chứng

- `npm --prefix server test`: 80 unit test, gồm schema/migration, CAS/replay, trang bị/vật phẩm, admission PvE, giới hạn di chuyển, AI Lợn Gai, kill reward, full-bag outbox/restart, checkpoint HP, phục hồi khi poll settlement gặp lỗi đọc storage và quota đăng nhập dev/test.
- `node scripts/inventory-smoke.mjs`: Docker/Nakama/PostgreSQL; kiểm tra profile/schema 2 migration, starter, quyền truy cập, equip/use/discard, full bag, settlement chờ, restart rồi nhận đúng một lần.
- `client/tests/inventory_smoke.gd`: Godot 4.6.1 panel smoke, gồm nhận starter/trang bị/replay. `client/tests/combat_smoke.gd` còn mở trận PvE thật và quan sát tell/lao/hồi thế trên Nakama.
- SQL fixture chỉ dùng với account do smoke tạo; không mở admin/debug RPC trong runtime.
- Unit test cover authoritative match loop. Live Docker/Godot gate phải được xác nhận từ CI; unit test không thay cho engine, websocket hoặc thiết bị mobile.

Mất acknowledgement được fault-inject trong unit test; live smoke khởi động lại
Nakama và xác nhận settlement/receipt còn bền vững. Không giả định đã kiểm mọi
thời điểm mất điện hoặc mất mạng.
