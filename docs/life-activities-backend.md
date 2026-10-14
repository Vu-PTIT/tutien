# Trồng cây, câu cá và đào khoáng — backend map UI

Triển khai ngày 12/10/2026 trên `feat/map-ui-rebuild`. Dùng Nakama TypeScript và PostgreSQL hiện có; game và sảnh có thể gọi cùng API bằng cùng tài khoản. Đây là phần backend và hợp đồng tương tác. Các commit `c5e0271`, `df20e0f`, `d40ae4d` đã gỡ runtime/asset client và để `main.tscn` trống; `b9c0009` gỡ tiếp các layout. Bản này chưa dựng lại giao diện Godot hoặc sảnh; cấu hình backend nằm riêng trong `server/data/life_world.json`.

## Hoạt động đã có

| Hoạt động | Điều kiện | Thời gian server | Kết quả |
| --- | --- | --- | --- |
| Trồng Cam Lộ | 1 hạt Cam Lộ + 1 nước, luống trống | 20 phút | 4 Cam Lộ (có thể 1 là Dạ Quang), 25% thêm 1 hạt |
| Trồng Tĩnh Tâm | 1 hạt Tĩnh Tâm + 1 nước, luống trống | 45 phút | như trên |
| Trồng Ích Khí | 1 hạt Ích Khí + 1 nước, luống trống | 60 phút | như trên |
| Câu cá | Cần câu + 1 mồi/lượt | 30 giây/lượt, sau khi tới bến | 1 thứ/lượt theo bảng của bến |
| Đào khoáng | Cuốc chim | 45 giây/lượt, sau khi tới vỉa | 2 quặng hoặc 1 vật phẩm Linh/Hiếm/lượt theo bảng của vỉa |

### Bảng sản lượng v2 (bảng `game_loot`, `game_crops`)

Theo [game-design/08](game-design/08-life-yields.md). Tỉ lệ dưới đây là seed ban đầu; giá trị đang chạy nằm trong database, xem [storage-backend.md](storage-backend.md). Mỗi lượt được tung bằng seed server của phiên, nên retry/replay không đổi kết quả. Phiên bắt đầu trước v2 (không có `lootVersion`) giữ bảng cũ: cá chép 35% / cá rô phi 65%, đồng 20% / sắt 80%.

| Điểm | Bảng (trọng số %) |
| --- | --- |
| Hồ Lặng (`new_fish_*`) | Cá chép 40, Cá rô phi 45, Rong hồ 8, Đồ rơi 5, Cá Lấp Lánh 2. Khi trời linh: 35 / 37 / 8 / 5 / 15 |
| Mỏ Lộ Thiên (`ml_iron_*`) | Sắt 70 (×2), Đồng 25 (×2), Đá Vân Sáng 5 |
| Hầm B1 (`ng_iron_b1_*`) | Sắt 50 (×2), Đồng 30 (×2), Đá Vân Sáng 15, Tinh Thể Linh Mạch 4, Mảnh Tím 1 |
| Luống làng | 15% một cây là bản Dạ Quang (30% nếu thu ban đêm); 25% thêm 1 hạt. Seed lưu ở `plot.lootSeed` lúc gieo |

- **Mảnh Tím:** `profile.lifeLoot = {b1Cycles, shardFound}` đếm lượt đào B1; mảnh đầu tiên bảo đảm ở lượt thứ 40.
- **Đồng hồ server:** một ngày game = 2 giờ thật, chia 5 pha bằng nhau (`sang_som`, `trua`, `chieu_vang`, `toi`, `khuya`); `toi`/`khuya` là đêm. Trời linh xét theo cửa sổ 30 phút bằng hash, khoảng 1/8 số cửa sổ; mỗi lượt câu được xét theo thời điểm lượt đó kết thúc. `life_get` trả `clock`.
- **Hấp:** `inner_world_absorb_item {operationId,itemId,quantity?}` (1–20) đổi vật phẩm Linh thành hạt linh tinh: Cá Lấp Lánh → Thủy 1, Đá Vân Sáng → Kim 1, Tinh Thể Linh Mạch → Kim 4, Cam Lộ/Ích Khí Dạ Quang → Thổ 1, Tĩnh Tâm Dạ Quang → Mộc 1. Cần đã học Hấp Linh và không có phiên hoạt động chưa nhận.
- Giá bán prototype cho vật phẩm mới; Mảnh Tím không bán được.

Không có minigame, không cấp XP tu luyện hoặc thưởng từ việc người dùng tự khai hoạt động ngoài đời. Một lệnh trực tiếp chạy 1 lượt; tự động chạy 1–120 lượt. Trồng cây chạy 1 chu kỳ sinh trưởng. Các con số là cân bằng prototype để chạy thử.

`life_claim_starter` cấp **một lần/tài khoản**, tách khỏi gói combat cũ: 1 cần câu, 1 cuốc chim, 30 mồi, 3 hạt mỗi loại và 12 nước. Có thể mua thêm dụng cụ/mồi/hạt/nước và bán cá/quặng qua `economy_action` tại chợ. Item catalog v4 có 40 ID (thêm 9 ID của bảng sản lượng v2), giữ nguyên các ID cũ và schema nhân vật v4.

## Vị trí trên map

| Map | Slot | Số lượng | Nguồn |
| --- | --- | --- | --- |
| `m_nha` (nhà riêng) | `new_plot_01`…`new_plot_12` | 12 luống cá nhân | `server/data/life_world.json` |
| `m_lang_que` | `new_fish_01`…`new_fish_12` | 12 bến câu | `server/data/life_world.json` |
| `m_mo_lo_thien` | `ml_iron_01`…`ml_iron_08` | 8 vỉa | `server/data/life_world.json` |
| `m_mo_ngam`, B1 | `ng_iron_b1_01`…`ng_iron_b1_06` | 6 vỉa | `server/data/life_world.json` |
| 5 map | `*_med_*` | 26 điểm thiền | `server/data/life_world.json` |

Kích thước map và số điểm theo [10 — kích thước map cho online](game-design/10-kich-thuoc-map-online.md); tọa độ ở [05](game-design/05-map-layouts.md).

Các điểm đào trong blockout là điểm làm việc an toàn để nối scene quặng khi dựng client. B2 và Trạm Thiên Mạch vẫn khóa theo topology hiện tại. Luống là tiến trình riêng của từng tài khoản và nằm trong nhà riêng `m_nha`, nên lease luống khóa theo từng người chơi (`m_nha:new_plot_NN:<userId>`); mọi slot khác có capacity 1 dùng chung server. Cây mẫu `initial_stage` trong layout không tạo vật phẩm hoặc tiến trình thật.

`server/data/life_world.json` lưu hợp đồng backend tối thiểu: điểm đứng, mặt nước, cầu và cổng. Ngày 13/10/2026 toàn bộ map được thu nhỏ cho 30 người/map và bỏ footprint cũ của làng; collision bên trong map sẽ thêm lại khi có art. Không chứa hình ảnh, cây mẫu hay runtime client. `scripts/build-life-world.cjs` biên dịch cấu hình này thành `server/src/life_world_generated.ts`. Chạy lại generator khi sửa JSON; CI kiểm tra manifest khớp nguồn. Khi map mới có geometry khác, cần cập nhật cùng hợp đồng này trước khi bật tương tác online. Làng (`m_lang_que`) là gốc thế giới và điểm xuất phát mặc định; tuyến An Khê prototype cũ đã bị xóa, người chơi còn đứng ở đó được đưa về điểm vào của làng. Quái và NPC khai báo riêng trong `server/data/world_population.json`. `world_get({preferredMapId})` chọn map cho phiên đầu tiên; tài khoản đã có vị trí dùng `world_travel`.

Đường đi tự động được tìm qua cổng mở và các cạnh đi được, không xuyên nước/chân nhà. Mask các cạnh đi được được biên dịch trước và nén theo hàng; RPC chỉ tìm trên mask, không quét hàng nghìn footprint khi nhận lệnh. Dữ liệu tĩnh được nạp khi bundle chạy trong từng VM của Nakama. Điểm đứng cuối, hướng và ID slot do server sở hữu. Thời gian đi dựa trên tốc độ server, không tính vào số lượt hoạt động.

## API

Mọi RPC cần session token. `operationId` dài 8–80 ký tự, dùng chữ/số/`_`/`-`. Tạo ID mới cho mỗi ý định mới, giữ ID khi gửi lại do mất mạng. Client không gửi thời gian hoàn thành, phần thưởng, giá hoặc user ID.

| RPC | Payload | Kết quả chính |
| --- | --- | --- |
| `life_get` | `{}` | catalog hoạt động/slot, cây, vườn, phiên hiện tại, `serverNow`, revision map |
| `life_claim_starter` | `{operationId}` | profile + receipt cấp đồ một lần |
| `garden_get` | `{}` | 12 luống, `empty/growing/ready`, thời gian còn lại |
| `garden_action` | `{operationId,action:"plant",plotId,cropId}` hoặc `{operationId,action:"harvest",plotId}` | thao tác trực tiếp, profile/vườn + receipt |
| `activity_start` | `{operationId,siteId,controlMode,cycles?,cropId?}` | phiên direct/autonomous; `cropId` bắt buộc với luống |
| `activity_get` | `{}` | phiên + tiến trình suy ra từ giờ server |
| `activity_control` | `{operationId,sessionId,stateVersion,controlMode}` | đổi direct/autonomous tại slot, giữ ID và tiến trình |
| `activity_cancel` | `{operationId,sessionId,stateVersion}` | dừng ở vị trí hiện tại, giữ kết quả các lượt đã xong |
| `activity_claim` | `{operationId,sessionId,stateVersion}` | nhận kết quả/refund và kết thúc settlement |

`plotId` là số 0–11 tương ứng 12 luống. Save vườn cũ 6 luống được nối thêm 6 luống trống, giữ nguyên cây/version cũ. `garden_action` cũ tại `ak.garden.home` vẫn hỗ trợ 6 luống đầu.

`world_interact` ở một điểm hoạt động trả `site` và action phù hợp để client mở bảng thao tác. `world_get` trả `activity` cùng tọa độ avatar hiện tại trên hành trình; `avatarId` luôn là cùng nhân vật. Khi phiên chưa được nhận/hủy rồi nhận, avatar chưa nhận lệnh di chuyển/chuyển map/đánh quái khác. Đổi sang direct chuyển mode hoạt động tại slot; muốn đi tự do cần hủy và nhận kết quả trước. Chưa có takeover điều hướng tự do trong lúc vẫn giữ một activity đang chạy.

### Luồng nối client

1. Đăng nhập, gọi `world_get({preferredMapId:"m_lang_que"})` cho tài khoản mới và `life_get`; nếu chưa nhận đồ, mở action gọi `life_claim_starter`.
2. Direct: đi đến điểm đứng, gửi `world_move`; bấm F/nút cảm ứng mở `world_interact`, rồi gọi garden/`activity_start`.
3. Auto: gọi `activity_start` với `controlMode:"autonomous"`, slot hợp lệ và số lượt. Game/sảnh hiển thị `travelling` rồi `active` từ `activity_get`/`world_get`.
4. Đóng ứng dụng không xóa phiên. Khi mở lại, dựng cùng avatar từ snapshot và hiển thị `completedCycles`/`remainingMs`.
5. Khi `completed`, gọi `activity_claim` một lần và cập nhật túi đồ theo `profile`. Nếu hủy giữa chừng, gọi cancel rồi claim bằng version vừa trả về.
6. Nếu lỗi `ABORTED`, đọc phiên mới và tạo lệnh mới theo version hiện tại. Nếu timeout, gửi lại đúng payload/ID cũ.

Ví dụ giao 10 lượt câu:

```json
{"operationId":"fish_command_20261012_001","siteId":"new_fish_01","controlMode":"autonomous","cycles":10}
```

## Lưu tiến trình và nhận thưởng

- Profile, vị trí world, lease slot và receipt lệnh ghi cùng transaction/CAS. Một nhân vật chỉ có một phiên chưa settle; lệnh đồng thời không nhân đôi avatar hoặc trừ mồi hai lần.
- Phiên lưu hành trình, giờ bắt đầu/tới điểm, số lượt, version và seed kết quả phía server. Kết quả các lượt không bị quay lại khi retry.
- Mồi được giữ trước đủ số lượt. Hủy trả mồi chưa dùng cùng phần thưởng đã hoàn thành khi claim; lượt dở không cấp cá/quặng.
- Hủy trồng trước khi tới luống hoàn lại hạt/nước khi claim. Hủy sau khi đã trồng giữ cây lớn bình thường, có thể thu hoạch trực tiếp sau khi nhận xong phiên hủy.
- Túi đầy giữ phiên/phần thưởng ở `pending`. Client dọn túi rồi gửi lại claim; không mất cây, phần thưởng hoặc refund, không ghi receipt thành công một phần.
- Lease slot tự hết hiệu lực theo giờ server sau khi phiên hết thời lượng, kể cả chủ nhân chưa claim. Claim cũ không giải phóng lease của người vừa tới sau.

Trong lát cắt này, thời gian/progress vẫn tiến triển khi không có client, nhưng **vật phẩm chỉ được ghi vào túi khi gọi claim**. Chưa có worker tự settlement, push realtime cho người đứng xem, hoặc giao diện tổng kết trong Godot/sảnh. Không cần cron/timer trong RAM để bảo toàn tiến trình sau restart.

## Kiểm tra và chạy

```sh
node scripts/build-life-world.cjs --check
cd server
npm ci
npm test
cd ..
docker compose up --build --wait --wait-timeout 180
node scripts/life-smoke.mjs
```

Unit tests dùng đồng hồ server có kiểm soát để kiểm tra sinh trưởng 20–60 phút, mining/fishing, reconnect, quyền sở hữu, retry/version, full bag, tranh slot và transaction lỗi/đồng thời. Live smoke dùng thời gian thật trên Nakama/PostgreSQL, không giả tọa độ hoặc rút ngắn timer: đi câu, reconnect, đổi mode, hủy/nhận/replay, rồi kiểm tra reservation/refund trồng và đào. Live smoke cần khoảng 1–2 phút.

Môi trường chỉnh code không có Docker/Godot. Kết quả unit/manifest được kiểm tra tại đây; live smoke được gắn vào CI. Godot smoke chỉ chạy khi runtime client được khôi phục; dữ liệu map luôn được audit.
