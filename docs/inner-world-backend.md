# Nội Giới — backend sức mạnh

Ngày: 13/10/2026. Runtime: Nakama TypeScript ES5, file `server/src/inner_world.ts`. Thiết kế: [07 — Hệ thống sức mạnh](game-design/07-power-system.md).

Nội Giới là thế giới nhỏ bên trong nhân vật. Server sở hữu toàn bộ: client không gửi thửa, vị, số linh năng hay hình dạng. Nội Giới nằm trong hồ sơ `characters/main` (trường `innerWorld`), nên lớn lên trong **cùng một lần ghi** với vật phẩm hay phiên hoạt động sinh ra nó.

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
  "summary": {"area": 21, "turbid": 0, "height": 0, "clean": {"an":1,"tho":10,"thuy":10,"thach":0,"moc":0}, "dominant": "tho", "lech": false},
  "formations": [{"id": "suoi", "name": "Suối", "active": true}],
  "stats": {"attackBonus": 0, "defenseBonus": 0, "maxHpBonus": 5, "linhLuc": 20, "regenPerMinute": 0, "speedPercent": 0},
  "lastLeap": {"shape": 1, "at": 1800000000000},
  "limits": {"radius": 30, "maxCells": 1600, "motesPerCell": 4, "stageCap": 3},
  "stages": [...]
}
```

Tọa độ thửa từ −30 đến 30. `kind`: `an`, `tho`, `thuy`, `thach`, `moc`; chỉ `thach` có `height` 1–4. Phong không chiếm ô mà là `sky` (mây phủ trên đất, tối đa bằng số thửa). `lastLeap` cho client biết vừa có bước nhảy để chiếu cảnh biến đổi.

## Nguồn linh năng

Mỗi **4 đơn vị linh năng** cùng vị thì mọc 1 thửa. Linh năng **đục** mọc thửa đục: vẫn tính diện tích, không tạo hình thái, không cộng chỉ số.

| Nguồn | Vị | Lượng | Đục |
| --- | --- | --- | --- |
| Hấp Linh, mỗi lượt 60 giây | Theo điểm (bảng dưới) | 3 | 0; mỗi lượt còn lọc sạch 1 thửa đục |
| Câu cá | Thủy | 1 mỗi 4 lượt | 0 |
| Đào khoáng | Thạch | 1 mỗi 3 lượt | 0 |
| Thu hoạch (trực tiếp hoặc qua phiên) | Thổ 2 + Mộc 1 | | 0 |
| Hạ Sơn Trư ngoài map | Thổ | 8 | 6 |
| Hạ Độc Chu ngoài map | Mộc | 8 | 6 |

Thạch sạch có 45% làm một ngọn núi có sẵn cao thêm thay vì mọc thửa mới. Chỗ mọc được chọn theo hash của `characterId` và bộ đếm `grown`, ưu tiên sát thửa cùng loại và gần tâm, nên retry/replay luôn ra đúng cùng một Nội Giới.

### Điểm Hấp Linh

| siteId | Map | Vị |
| --- | --- | --- |
| `lq_med_mieu` | Làng Hồ Lặng, sân miếu | Thổ |
| `lq_med_ho` | Làng Hồ Lặng, bờ hồ | Thủy |
| `mb_med_ho_tay` | Mỏ Bỏ Hoang, Hố Tây | Thạch |
| `vd_med_thap` | Bìa Rừng, chân tháp | Phong |
| `rs_med_goc_nam`, `rs_med_goc_bac` | Rừng Sâu, gốc cây Tinh Linh | Mộc |

Vị Ẩn chưa có nguồn vì map Ẩn Giới chưa có trong backend.

## Hình thái, chỉ số và bước nhảy

Hình thái được tính lại sau mỗi thay đổi: Suối (3 Thủy nối), Sông (≥ 6 Thủy chạm Núi), Hồ (Thủy giáp ≥ 3 Thổ), Biển (≥ 12 Thủy nối), Bờ biển, Núi (Thạch cao ≥ 3), Dãy núi (3 Núi nối), Rừng (6 Mộc nối), Thung lũng, Gió lộng (Núi + ≥ 3 mây), Rừng Ẩn.

| Chỉ số | Công thức |
| --- | --- |
| `attackBonus` | ⌊tổng độ cao Thạch sạch / 4⌋ + 2 nếu có Dãy núi |
| `defenseBonus` | ⌊tổng độ cao / 2⌋ + 3 nếu có Núi + 2 nếu có Thung lũng |
| `maxHpBonus` | ⌊thửa sạch / 4⌋ |
| `linhLuc` | 2 × Thủy sạch |
| `regenPerMinute` | ⌊Mộc sạch / 3⌋ |
| `speedPercent` | min(30, mây) |

**Đang áp dụng vào chiến đấu:** `attackBonus` cộng vào `world_attack`, trận Sơn Trư và săn chung khế ước; `defenseBonus` cộng vào trận Sơn Trư và săn chung. Máu, linh lực, hồi máu và tốc độ mới được tính và trả về, chưa dùng trong luật chiến đấu (máu hồ sơ vẫn trần 100).

Bước nhảy tự xảy ra khi đủ thửa và đủ chất: Hạt → Đảo (20, có Thổ và Thủy sạch) → Đảo lớn (60, có Núi hoặc Rừng, đục < 50%) → Quần đảo (150, 3 hình thái, Thủy ≥ 25%, đục < 35%). Nội Giới **lệch** (một loại > 80%, từ 10 thửa) thì không nhảy. Hình dạng chỉ tiến, không lùi. Chương 1 dừng ở Quần đảo (`stageCap: 3`); các hình dạng sau đã có điều kiện nhưng đang khóa. Trần 1.600 thửa.

## Xếp lại

`inner_world_arrange` chuyển thửa sang ô trống chạm vào phần đất còn lại, hoặc đổi chỗ hai thửa (đổi cả loại, độ cao, đục). Thao tác làm Nội Giới tách làm hai bị từ chối. Sau khi xếp, bước nhảy được kiểm tra lại.

## Tương thích

- `realm`, `cultivationXp` và XP thưởng vẫn được ghi như trước để không vỡ hồ sơ, receipt và nhiệm vụ mở đầu cũ. Chúng **không còn là nguồn sức mạnh**; sẽ gỡ khi client dùng Nội Giới.
- Hồ sơ cũ không có `innerWorld`: đọc thì suy ra (không ghi), lần ghi đầu tiên có Nội Giới mới lưu.
- `innerWorld` hỏng bị khóa thao tác để kiểm tra, không reset.
- Fingerprint receipt của phần thưởng có linh năng bao gồm `linhNang`. Một lần retry kéo dài qua lúc deploy của một lượt hạ quái cũ sẽ bị coi là operation khác.

## Chưa làm

- Vị Ẩn, map Ẩn Giới, vết nứt tím (§6 của thiết kế).
- Linh năng từ trận Sơn Trư và săn chung (hiện vẫn chỉ XP + đồ).
- Dùng máu/linh lực/hồi máu/tốc độ trong chiến đấu; dạy Hình Thái giữa người chơi.
- UI Godot và sảnh cho Nội Giới.

## Kiểm tra

```sh
node scripts/build-life-world.cjs --check
cd server && npm test
```

`server/tests/inner_world.test.cjs` gồm: Người chưa học không giữ linh năng và không Hấp Linh được; linh thú có hạt Ẩn; Bé Mơ dạy một lần; học qua khế ước linh thú (không học được từ Người); Hấp Linh mọc thửa xác định và replay không mọc thêm; bước nhảy Đảo; linh năng đục từ quái và lọc; câu cá/thu hoạch; xếp lại không làm tách; núi tăng sát thương; Nội Giới lệch không nhảy; dữ liệu hỏng được giữ, Luyện Khí cũ được chuyển. Toàn bộ 156 test đạt. Smoke live trên Nakama/PostgreSQL chưa chạy ở môi trường này.
