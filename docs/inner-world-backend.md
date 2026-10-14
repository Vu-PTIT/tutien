# Nội Giới — backend sức mạnh

Ngày: 13/10/2026. Runtime: Nakama TypeScript ES5, file `server/src/inner_world.ts`. Thiết kế: [07 — Hệ thống sức mạnh](game-design/07-power-system.md).

Nội Giới là thế giới nhỏ bên trong nhân vật. Server sở hữu toàn bộ: client không gửi thửa, vị, số linh năng hay hình dạng. Nội Giới lưu ở row riêng `inner_worlds/main` (chủ sở hữu đọc được, client không ghi). Server ghép nó vào hồ sơ thành trường `innerWorld` khi đọc, nên API không đổi. Nội Giới lớn lên trong **cùng một batch CAS** với hồ sơ và vật phẩm hay phiên hoạt động sinh ra nó. Row này chỉ được ghi khi Nội Giới thực sự thay đổi, nên di chuyển, lưu HP hay đổi túi đồ không ghi lại tới 1600 thửa. Xem [Lưu trữ backend](storage-backend.md).

## Ai dùng được

| Hình dạng | Trạng thái ban đầu | Cách học |
| --- | --- | --- |
| `spirit_beast` | Biết Hấp Linh (`teacher: "native"`), một thửa Ẩn ở (0,0) | Bẩm sinh, có ngay khi chọn hình dạng |
| `human` | Chưa biết, Nội Giới trống | Tinh Linh dạy: NPC Bé Mơ ở sân miếu, hoặc bạn khế ước là linh thú |
| Hồ sơ Luyện Khí cũ | Biết (`teacher: "legacy"`), một thửa Ẩn + `20 × tầng` linh năng Thổ chờ mọc | Giữ tiến trình đã phát hành |

Người chưa học thì mọi linh năng đi qua mà không đọng lại (`inner.ignored: true`), và không bắt đầu được Hấp Linh.

## RPC

| RPC | Payload | Kết quả |
| --- | --- | --- |
| `inner_world_get` | `{}` | `innerWorld` (xem dưới), `serverNow` |
| `inner_world_learn` | `{operationId, contractId}` | Người học từ bạn khế ước đang hoạt động là linh thú; `profile`, `receipt`, `replayed`, `innerWorld` |
| `inner_world_arrange` | `{operationId, from:{x,y}, to:{x,y}}` | Đổi chỗ hai thửa, hoặc chuyển một thửa sang ô trống giáp đất; `innerWorld` |
| `world_interact` | `{entityId:"lq.npc.be_mo"}` | Đứng cạnh Bé Mơ ở sân miếu Làng Hồ Lặng: Người học Hấp Linh; Tinh Linh chỉ được chào |
| `activity_start` | `{operationId, siteId, controlMode, cycles}` với `siteId` là điểm Hấp Linh | Phiên Hấp Linh trực tiếp (1 lượt) hoặc tự động (1–120 lượt) |
| `activity_claim` | như các hoạt động khác | `granted.linhNang`, `granted.inner`, `granted.purified` |

`operationId` theo quy ước chung: 8–80 ký tự `[a-zA-Z0-9_-]`; gửi lại đúng payload thì trả `replayed: true` và không mọc thêm thửa. `inner_world_arrange` giới hạn 60 lần/phút.

`inner_world_learn` từ chối khi: người gọi không phải Người, bạn khế ước không phải linh thú, khế ước không hoạt động, hoặc đã học rồi.

### `innerWorld`

```json
{
  "learned": true, "teacher": "npc:lq.npc.be_mo",
  "shape": {"index": 1, "id": "dao", "name": "Đảo"},
  "next": {"id": "dao_lon", "name": "Đảo lớn", "cells": 60, "need": "Có Núi hoặc Rừng; đục dưới 50%", "locked": false, "met": false},
  "cells": [{"x": 0, "y": 0, "kind": "an", "height": 1, "turbid": false}],
  "sky": 0, "pending": {"thuy": 2, "tho_d": 3},
  "summary": {"area": 21, "turbid": 0, "height": 0, "clean": {"an":1,"tho":10,"thuy":10,"kim":0,"moc":0,"hoa":0}, "dominant": "tho", "lech": false,
    "element": "tho", "sinh": 0, "khac": 9},
  "elements": {"list": ["kim","moc","thuy","hoa","tho","phong"], "sinh": {"moc":["hoa"], "...": []}, "khac": {"moc":["tho"], "...": []}},
  "formations": [{"id": "suoi", "name": "Suối", "active": true}],
  "stats": {"attackBonus": 0, "defenseBonus": 0, "maxHpBonus": 5, "linhLuc": 10, "regenPerMinute": 0, "speedPercent": 0, "critPercent": 0},
  "lastLeap": {"shape": 1, "at": 1800000000000},
  "limits": {"radius": 30, "maxCells": 1600, "motesPerCell": 4, "stageCap": 3},
  "stages": [...]
}
```

Tọa độ thửa từ −30 đến 30. `kind`: `an`, `tho`, `thuy`, `kim`, `moc`, `hoa`; chỉ `tho` có `height` 1–4 (cao ≥ 3 là núi). Phong không chiếm ô mà là `sky` (mây phủ trên đất, tối đa bằng số thửa). `lastLeap` cho client biết vừa có bước nhảy để chiếu cảnh biến đổi.

## Nguồn linh năng

Linh năng có **sáu hệ** `kim`, `moc`, `thuy`, `hoa`, `tho`, `phong` (trường `vi` trong API). Mỗi **4 đơn vị linh năng** cùng hệ thì mọc 1 thửa. Linh năng **đục** mọc thửa đục: vẫn tính diện tích, không tạo hình thái, không cộng chỉ số.

| Nguồn | Hệ | Lượng | Đục |
| --- | --- | --- | --- |
| Hấp Linh, mỗi lượt 60 giây | Theo điểm (bảng dưới) | 3 | 0; mỗi lượt còn lọc sạch 1 thửa đục |
| Câu cá | Thủy | 1 mỗi 4 lượt | 0 |
| Đào khoáng | Kim | 1 mỗi 3 lượt | 0 |
| Thu hoạch (trực tiếp hoặc qua phiên) | Thổ 2 + Mộc 1 | | 0 |
| Hạ Sơn Trư ngoài map | Thổ | 8 | 6 |
| Hạ quái khác ngoài map | Theo loài; loài hai hệ chia đôi (4 + 4, đục 3 + 3) | 8 | 6 |

Thổ sạch có 30% làm một thửa Thổ **sâu trong đất liền** (bốn phía đều có thửa) cao thêm thay vì mọc thửa mới. Chỗ mọc được chọn theo hash của `characterId` và bộ đếm `grown`, ưu tiên sát thửa cùng loại và gần tâm, nên retry/replay luôn ra đúng cùng một Nội Giới.

### Điểm Hấp Linh

| siteId | Map | Hệ |
| --- | --- | --- |
| `lq_med_mieu` | Làng Hồ Lặng, sân miếu | Thổ |
| `lq_med_ho` | Làng Hồ Lặng, bờ hồ | Thủy |
| `lq_med_lo_ren` | Làng Hồ Lặng, sân lò rèn | Hỏa |
| `mb_med_ho_tay` | Mỏ Bỏ Hoang, Hố Tây | Kim |
| `vd_med_lua` | Bìa Rừng, đống lửa trại | Hỏa |
| `vd_med_thap` | Bìa Rừng, chân tháp | Phong |
| `rs_med_goc_nam`, `rs_med_goc_bac` | Rừng Sâu, gốc cây Tinh Linh | Mộc |

Ẩn chưa có nguồn vì map Ẩn Giới chưa có trong backend.

## Hình thái, chỉ số và bước nhảy

Hình thái được tính lại sau mỗi thay đổi: Suối (3 Thủy nối), Sông (≥ 6 Thủy chạm Núi), Hồ (Thủy giáp ≥ 3 Thổ), Biển (≥ 12 Thủy nối), Bờ biển, Núi (Thổ cao ≥ 3), Dãy núi (3 Núi nối), Rừng (6 Mộc nối), Thung lũng (Thổ thấp kẹp giữa hai Núi), Gió lộng (Núi + ≥ 3 mây), Rừng Ẩn, Mạch Kim (≥ 3 Kim nối chạm Núi), Núi Lửa (Hỏa chạm Núi).

**Sinh khắc giữa thửa:** với mỗi thửa sạch, nếu chạm thửa sạch của hệ sinh ra nó thì tính 1,5; chạm hệ khắc nó thì 0,5; cả hai thì 1. Tổng theo hệ là `eff` (dùng cho chỉ số). `summary.sinh`/`summary.khac` đếm số cặp thửa chạm nhau có quan hệ sinh/khắc. Bảng quan hệ trả trong `elements`:

- Sinh: Mộc→Hỏa→Thổ→Kim→Thủy→Mộc; Thủy→Phong→Hỏa.
- Khắc: Mộc⊣Thổ⊣Thủy⊣Hỏa⊣Kim⊣Mộc; Thổ⊣Phong⊣Mộc.

**Hệ chính** (`summary.element`): hệ có nhiều thửa sạch nhất (Phong tính bằng `sky`), cần ít nhất 3; không đủ thì rỗng.

| Chỉ số | Công thức |
| --- | --- |
| `attackBonus` | ⌊tổng độ cao Thổ sạch / 4⌋ + ⌊eff Kim / 3⌋ + 2 mỗi hình thái Dãy núi, Mạch Kim, Núi Lửa |
| `defenseBonus` | ⌊tổng độ cao / 2⌋ + 3 nếu có Núi + 2 nếu có Thung lũng |
| `maxHpBonus` | ⌊thửa sạch / 4⌋ |
| `linhLuc` | ⌊2 × eff Thủy⌋ |
| `regenPerMinute` | ⌊eff Mộc / 3⌋ |
| `speedPercent` | min(30, mây) |
| `critPercent` | min(25, ⌊eff Hỏa⌋) |

**Đang áp dụng vào chiến đấu:** `attackBonus` cộng vào `world_attack`, trận Sơn Trư và săn chung khế ước; `defenseBonus` cộng vào trận Sơn Trư và săn chung. **Sinh khắc trong trận:** hệ chính khắc một hệ của quái thì sức đánh × 1,25; một hệ của quái khắc hệ chính thì × 0,85 (áp dụng ở `world_attack`, trận Sơn Trư và săn chung; Lợn Gai là Thổ). Máu, linh lực, hồi máu, tốc độ và chí mạng mới được tính và trả về, chưa dùng trong luật chiến đấu (máu hồ sơ vẫn trần 100).

Bước nhảy tự xảy ra khi đủ thửa và đủ chất: Hạt → Đảo (20, có Thổ và Thủy sạch) → Đảo lớn (60, có Núi hoặc Rừng, đục < 50%) → Quần đảo (150, 3 hình thái, Thủy ≥ 25%, đục < 35%, số cặp sinh ≥ số cặp khắc). Nội Giới **lệch** (một loại > 80%, từ 10 thửa) thì không nhảy. Hình dạng chỉ tiến, không lùi. Chương 1 dừng ở Quần đảo (`stageCap: 3`); các hình dạng sau đã có điều kiện nhưng đang khóa. Trần 1.600 thửa.

## Xếp lại

`inner_world_arrange` chuyển thửa sang ô trống chạm vào phần đất còn lại, hoặc đổi chỗ hai thửa (đổi cả loại, độ cao, đục). Thao tác làm Nội Giới tách làm hai bị từ chối. Sau khi xếp, bước nhảy được kiểm tra lại.

## Tương thích

- **Nội Giới phiên bản 1** (có hệ Thạch) tự nâng lên phiên bản 2 khi đọc: thửa Thạch thành thửa Thổ giữ nguyên độ cao, linh năng Thạch đang chờ thành Thổ. Vật phẩm quặng trong bảng `game_items` đổi `absorb_vi` từ `thach` sang `kim` khi server khởi động.
- Cảnh giới đã bỏ. `realm`, `realmStage`, `cultivationXp` chỉ còn là trường cũ bị đóng băng: không nguồn thưởng nào cộng XP hay nâng cảnh giới (kể cả nhiệm vụ mở đầu). Phần thưởng cũ đang chờ còn ghi XP vẫn nhận được, nhưng XP thực nhận là 0.
- Vì vậy chỉ hồ sơ **đã phát hành** ở Luyện Khí mới được chuyển thành `teacher: "legacy"`. Trước 13/10/2026, Người chưa học có thể tự biết Hấp Linh khi đánh quái đủ 100 XP hoặc làm xong nhiệm vụ mở đầu; lỗi này đã được chặn và có test.
- Hồ sơ cũ không có `innerWorld`: đọc thì suy ra (không ghi), lần ghi đầu tiên có Nội Giới mới lưu.
- `innerWorld` còn nhúng trong `characters/main` (bản trước khi tách) được chuyển sang `inner_worlds/main` ở lần đọc kế tiếp; bản nhúng thắng nếu cả hai cùng tồn tại.
- `innerWorld` hỏng bị khóa thao tác để kiểm tra, không reset.
- Fingerprint receipt của phần thưởng có linh năng bao gồm `linhNang`. Một lần retry kéo dài qua lúc deploy của một lượt hạ quái cũ sẽ bị coi là operation khác.

Mọi lần hạ quái (ngoài map, trận Sơn Trư riêng, săn chung khế ước) đều cho `innerMobEssence`: 8 linh năng theo vị của loài, trong đó 6 đục.

## Chưa làm

- Vị Ẩn, map Ẩn Giới, vết nứt tím (§6 của thiết kế).
- Dùng máu/linh lực/hồi máu/tốc độ trong chiến đấu; dạy Hình Thái giữa người chơi.
- UI Godot và sảnh cho Nội Giới.

## Kiểm tra

```sh
node scripts/build-life-world.cjs --check
cd server && npm test
```

`server/tests/inner_world.test.cjs` gồm: Người chưa học không giữ linh năng và không Hấp Linh được; linh thú có hạt Ẩn; Bé Mơ dạy một lần; học qua khế ước linh thú (không học được từ Người); Hấp Linh mọc thửa xác định và replay không mọc thêm; bước nhảy Đảo; linh năng đục từ quái và lọc; câu cá/thu hoạch; xếp lại không làm tách; núi tăng sát thương; Nội Giới lệch không nhảy; dữ liệu hỏng được giữ, Luyện Khí cũ được chuyển. Toàn bộ test server đạt (168 test ngày 13/10/2026).

`scripts/inner-world-smoke.mjs` chạy trên Nakama/PostgreSQL thật (đã thêm vào CI): Người học Hấp Linh qua khế ước linh thú, linh thú Hấp Linh tự động 2 lượt ở bờ hồ theo giờ server, nhận kết quả mọc 1 thửa Thủy, replay không mọc thêm, xếp lại thửa. Ngày 13/10/2026 cả 6 smoke backend đều đạt trên image mới.

Bộ giả lập storage trong unit test (`tests/helpers/assets.cjs`) mô phỏng cách Nakama sao chép giá trị khi gán vào dữ liệu đọc từ storage, để bắt lỗi "sửa sau khi gán" từng làm mất lượt tham gia săn chung đầu tiên.
