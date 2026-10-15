# Lưu trữ backend

Ngày: 13/10/2026. Nakama lưu mọi dữ liệu game trong bảng `storage` của PostgreSQL. Mỗi row là một cặp `collection/key` thuộc một user, hoặc thuộc `SYSTEM_ID` (`00000000-…`) nếu là dữ liệu dùng chung. Client không ghi trực tiếp được row nào: hook `BeforeWriteStorageObjects` và `BeforeDeleteStorageObjects` đều từ chối, mọi thay đổi đi qua RPC.

## Các collection

| Collection | Chủ | Nội dung | Giữ bao lâu |
| --- | --- | --- | --- |
| `characters/main` | người chơi | Hồ sơ: hình dạng, túi, trang bị, HP, kỹ năng, activity, vườn, nhiệm vụ | Mãi |
| `inner_worlds/main` | người chơi | Nội Giới (tối đa 1600 thửa) | Mãi |
| `world_sessions/main` | người chơi | Vị trí, quái ngoài map, pity | Mãi |
| `asset_receipts` | người chơi | Receipt nhận thưởng: `op:<operationId>` và `source:<sourceId>` | 7 ngày, trừ source một lần (xem dưới) |
| `asset_mutations` | người chơi | Receipt thao tác túi, Nội Giới, activity | 7 ngày |
| `pve_settlements` | người chơi | Outcome trận Lợn Gai và con trỏ `pending` | Outcome đã `settled`: 7 ngày |
| `spirit_members/main`, `spirit_hunt_rewards/pending` | người chơi | Hộp thư khế ước, thưởng săn chung đang chờ | Mãi (mỗi người một row) |
| `spirit_contracts` | dùng chung | Hợp đồng và trận săn hiện tại | Đã kết thúc/huỷ/từ chối/hết hạn: 30 ngày |
| `social_limits` | cả hai | Bộ đếm giới hạn tần suất | Bộ đếm đăng nhập theo IP: xoá khi hết cửa sổ |
| `life_slots`, `social_locks` | dùng chung | Lease slot hoạt động, khoá nhóm | Số lượng cố định / tự xoá |
| `maintenance/prune` | cả hai | Mốc lần dọn gần nhất và cursor | Mãi (mỗi chủ một row) |

## Nội dung game: bảng SQL `game_*`

Định nghĩa nội dung không còn hardcode trong TypeScript mà nằm trong các bảng PostgreSQL riêng (cùng database với Nakama):

| Bảng | Khoá | Nội dung |
| --- | --- | --- |
| `game_items` | `id` | Tên, bậc (`thuong`/`linh`/`hiem`/`la`), `stack_max`, `instance`, `bound`, trang bị (`equip_slot`, `attack_bonus`, `defense_bonus`), `heal_amount`, giá `buy_price`/`sell_price` (NULL = cửa hàng không mua/bán), Hấp (`absorb_vi`, `absorb_motes`), `sort_order` |
| `game_crops` | `id` | Hạt, sản phẩm, bản Dạ Quang, `duration_ms`, `yield_count`, `seed_back_percent`, `glow_percent`, `glow_night_percent` |
| `game_loot` | `table_id, item_id` | Bảng rơi: `weight` (tương đối, không cần cộng đủ 100), `quantity`. `table_id` là `fishing:<mapId>`, `mining:<mapId>`, `<…>:linh_trieu` (thay bảng thường trong Đêm Linh Triều), `legacy:fishing`/`legacy:mining` (phiên bắt đầu trước v2) |
| `game_recipes`, `game_recipe_ingredients` | `id` / `recipe_id, item_id` | Công thức chế tạo: sản phẩm, phí, nguyên liệu |

- **Tạo và seed:** `InitModule` chạy `CREATE TABLE IF NOT EXISTS` rồi chèn seed từ `server/data/game_content.json` bằng `INSERT … ON CONFLICT DO NOTHING`. Seed chỉ **thêm dòng còn thiếu**; sau lần khởi động đầu, **database là nguồn sự thật**: sửa trong DB không bị deploy ghi đè. Sửa JSON thì chạy `node scripts/build-game-content.cjs` (CI kiểm tra bằng `--check`); thay đổi JSON với dòng đã có trong DB phải sửa thẳng trong DB.
- **Sửa nội dung:** dùng SQL (psql, pgAdmin…), ví dụ `UPDATE game_items SET sell_price = 5 WHERE id = 'it_fish_carp';`. Mỗi VM Nakama giữ cache và nạp lại sau tối đa **30 giây**; không cần restart.
- **Kiểm tra khi nạp:** toàn bộ bảng được kiểm tra trước khi thay cache (ID, bậc, số nguyên trong khoảng, vật phẩm tham chiếu phải tồn tại, vị Hấp hợp lệ…). Một dòng sai làm cả lần nạp bị bỏ qua, server tiếp tục dùng nội dung hợp lệ gần nhất; nếu VM chưa từng nạp được thì RPC trả `UNAVAILABLE`.
- **Không xoá** vật phẩm hoặc cây mà người chơi đang giữ/đang trồng: hồ sơ chứa ID đó sẽ bị khoá để rà soát. Muốn ngừng bán thì đặt giá về NULL; muốn ngừng rơi thì xoá dòng `game_loot`.
- `inventory_get` trả `catalog` từ DB và `catalogRevision` (hash nội dung) để client biết khi nào cần làm mới.
- Quy tắc trò chơi vẫn trong code: nhịp ngày/đêm, Đêm Linh Triều, mốc bảo đảm Mảnh Tím, gói quà khởi đầu, quái và vị trí map.

## Hồ sơ và Nội Giới

Hồ sơ và Nội Giới là hai row nhưng được đọc cùng nhau (`loadCharacter`) và ghi trong cùng batch (`characterWrites`). Row hồ sơ **luôn** được ghi khi hồ sơ đổi, nên nó vẫn là điểm tuần tự hoá mọi thao tác trên nhân vật. Row Nội Giới chỉ được ghi khi nội dung thật sự khác lúc đọc. Di chuyển, lưu HP, đổi túi đồ không còn ghi lại Nội Giới.

`validateCharacter` kiểm tra cả các trường tuỳ chọn: `activitySession`, `gardenPlots`. Các trường của tuyến prototype đã xóa (`worldQuests`, `insightFlags`, `learnedTechniques`, `resourceGatheredAt`) bị bỏ khi đọc hồ sơ. Dữ liệu hỏng bị khoá để rà soát (`FAILED_PRECONDITION`), không bị reset. Key lạ không thuộc schema vẫn được giữ, vì các migration đã phát hành cam kết giữ chúng.

Muốn xem hình dạng của người khác (khế ước) thì dùng `peekCharacterForm`: chỉ đọc, không tạo hay migrate hồ sơ của họ.

## Dọn dữ liệu

Nakama storage không có TTL. Receipt chống trùng chỉ cần sống lâu hơn thời gian client retry, nên server dọn khi người chơi mở hồ sơ (`get_profile`):

- Mỗi người chơi được dọn tối đa một lần mỗi 6 giờ. Row dùng chung được dọn tối đa một lần mỗi giờ, mỗi lần vài trang, tiếp tục từ cursor đã lưu.
- Receipt `op:` cũ hơn 7 ngày bị xoá. Replay của lần nhận thưởng vẫn được trả lời nhờ receipt `source:` cùng `operationId`.
- Receipt `source:` chỉ bị xoá với nguồn theo từng lượt: `world:` (một thế hệ quái), `pve:` (một encounter), `contract_hunt:` (một trận săn). Trạng thái của chính nguồn đó đã tiến qua lượt cũ nên không thể nhận lại. Mọi nguồn khác, ví dụ `starter:v1`, `life:starter:v1`, được giữ mãi.
- Xoá theo version: row vừa bị ghi lại trong lúc dọn sẽ được giữ. Lỗi khi dọn chỉ ghi log và không bao giờ làm hỏng `get_profile`.
- Thưởng săn chung đã `settled` mà receipt đã bị dọn thì `contract_hunt_claim` trả `NOT_FOUND`. `contract_get` bỏ qua hợp đồng đã bị dọn.

## Kiểm tra

`server/tests/storage.test.cjs` kiểm tra: Nội Giới ở row riêng và không bị ghi khi lưu HP, chuyển Nội Giới nhúng cũ, khoá Nội Giới hỏng, khoá trường tuỳ chọn hỏng, dọn receipt (giữ starter, giới hạn tần suất), dọn outcome nhưng giữ thưởng đang chờ, dọn row dùng chung, lỗi dọn không làm hỏng request, đòn săn chung không ghi hồ sơ bạn đồng hành, giới hạn lịch sử replay và `contract_get` với hợp đồng đã dọn.
