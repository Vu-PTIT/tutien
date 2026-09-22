# Map Layout Spec — PC + Mobile

**Cập nhật:** 23/09/2026  
**Nhánh:** `feat/inventory-rewards`  
**Trạng thái:** level-design spec cho prototype; số liệu phải được playtest trước khi khóa production.

## 1. Quy ước chung

### 1.1 Hệ tọa độ
- Tile gameplay chuẩn: **32x32 px**.
- Tọa độ tile bắt đầu từ `(0,0)` ở góc trên trái.
- Mỗi POI được mô tả bằng `Rect2i(x, y, w, h)` theo đơn vị tile.
- World/collision/NPC/quái/tài nguyên dùng cùng tọa độ trên PC và mobile.

### 1.2 Camera và màn hình
- Logical viewport chuẩn: **640x360**.
- PC 16:9: camera gameplay chuẩn 640x360.
- Mobile landscape: dùng cùng world/collision; PvE có thể mở ngang nhẹ theo aspect ratio, mục tiêu tối đa khoảng **704x360** trong prototype.
- PvP/competitive: khóa gameplay FOV tương đương **640x360** để tránh lợi thế thiết bị.
- Camera không được quyết định aggro, skill range, spawn hoặc server validation.
- Pixel camera nên bám vị trí nguyên pixel/tile-friendly để tránh rung/shimmer.

### 1.3 Quy tắc level design cho mobile
Các POI quan trọng không được phụ thuộc vào vùng màn hình dễ bị joystick/action button che:
- Không đặt cửa, NPC quest, rương bắt buộc hoặc prompt quan trọng sát góc dưới trái/phải của một clearing.
- Mỗi POI chính cần **clearance 4-5 tile** quanh điểm tương tác.
- Combat clearing đầu game rộng tối thiểu **8x8 tile**, tuyến di chuyển chính rộng **3-4 tile**.
- Telegraph nguy hiểm phải đọc được khi HUD touch đang hiển thị.

### 1.4 Mật độ nội dung
Mục tiêu prototype:
- 8-15 giây di chuyển có một thay đổi có ý nghĩa: landmark, rẽ đường, NPC, tài nguyên, quái, shortcut, lore hoặc vista.
- Không tăng diện tích chỉ để kéo dài thời gian đi bộ.
- Mỗi map phải có ít nhất 3 landmark hình ảnh khác nhau để định hướng không cần minimap.

---

# 2. An Khê — `m_an_khe`

## 2.1 Vai trò
Hub an toàn, nơi người chơi:
- hồi phục;
- bán/mua;
- rèn;
- luyện đan;
- nhận/trả quest;
- vào vườn;
- chuẩn bị trước khi đi Trúc Âm;
- vào đấu tập đồng thuận.

## 2.2 Kích thước
- **48x36 tile**
- **1536x1152 world px**
- Camera 640x360 chỉ thấy một phần map.

## 2.3 Sơ đồ khối

```text
y=0
┌────────────────────────────────────────────────┐
│                 CỔNG BẮC                       │
│              [21..26,0..4]                     │
│                                                │
│  nhà dân      SẠP CHỢ          NHÀ KHÁCH       │
│              [15..27,8..15]    [31..39,7..14] │
│                                                │
│ HIỆU THUỐC     QUẢNG TRƯỜNG       LÒ RÈN       │
│ [5..13]        [18..29]           [34..42]     │
│                                                │
│ VƯỜN THUỐC          GIẾNG / SINH HOẠT          │
│ [5..15,26..33]      [20..27,25..31]            │
│                                                │
│                CỔNG TRÚC ÂM                    │
│               [21..26,32..35]                  │
└────────────────────────────────────────────────┘
                                               x=47
```

## 2.4 POI và chức năng

| POI | Rect tile | Chức năng | Landmark |
| --- | --- | --- | --- |
| Cổng Bắc | `(21,0,6,5)` | route tương lai / intro | cổng gỗ + bia đá |
| Sạp chợ Hà Tố | `(15,8,13,8)` | mua/bán cơ bản | mái bạt vàng đất |
| Nhà khách Tống Đức | `(31,7,9,8)` | thông tin / quyền Cổ Tỉnh | lồng đèn đôi |
| Hiệu thuốc Bà Sâm | `(5,16,9,8)` | nghỉ, thuốc, luyện đan | biển dược + giàn phơi |
| Quảng trường | `(18,16,12,10)` | spawn, bảng mục tiêu | giếng/đá lát |
| Lò rèn Đỗ Khê | `(34,16,9,8)` | craft/rèn | lò than + khói |
| Vườn thuốc | `(5,26,11,8)` | vườn cá nhân | luống cây + hàng rào |
| Khu giếng | `(20,25,8,7)` | social ambience | giếng đá |
| Cổng Trúc Âm | `(21,32,6,4)` | chuyển zone | biển đường + trúc |

## 2.5 Tuyến đi chính
- Spawn ở quảng trường: khoảng tile **(24,23)**.
- Từ spawn tới Bà Sâm: 8-12 giây.
- Tới lò rèn: 8-12 giây.
- Tới chợ: 6-10 giây.
- Tới cổng Trúc Âm: 10-15 giây.
- Không để dịch vụ cốt lõi xa hơn ~20 giây chạy liên tục từ quảng trường trong prototype.

## 2.6 NPC đề xuất
- Bà Sâm: `(10,21)`
- Đỗ Khê: `(38,21)`
- Hà Tố: `(22,13)`
- Tống Đức: `(35,12)`
- Lục Vi / người gác cổng: `(24,31)`
- NPC ambience rải 6-10 người, tránh tụ che cửa.

## 2.7 Mobile
- Quảng trường cần khoảng trống tối thiểu 12x10 tile.
- NPC quan trọng đứng cao hơn trung tâm clearing, tránh nằm dưới vùng action buttons.
- Cổng/door trigger rộng tối thiểu 3 tile để thao tác touch không khó.
- Minimap không cần hiện mọi NPC; chỉ quest/party/gate chính.

---

# 3. Trúc Âm

Trúc Âm được chia thành nhiều zone vừa thay vì một rectangle rất lớn.

```text
An Khê
  |
  v
Ven Suối ---- Rừng Trúc Sâu
   \              |
    \             v
     ------ Bãi Sơn Trư
                |
                v
           Thạch Cạn
```

## 3.1 Ven Suối — `m_truc_am_stream`

### Kích thước
- **40x28 tile**
- **1280x896 px**

### Layout

```text
┌────────────────────────────────────────┐
│       LỐI RỪNG SÂU          EXIT       │
│          [NW]              [NE]        │
│                                        │
│  TRÚC SÉT        CẦU GỖ                │
│   landmark       =====                 │
│          \       SUỐI                  │
│           \~~~~~~~~~~~~~~~~~~~         │
│   LỀU CŨ       bờ an toàn              │
│                                        │
│       herb nodes       quái đơn        │
│                                        │
│          ENTRY TỪ AN KHÊ               │
└────────────────────────────────────────┘
```

### POI
- Entry An Khê: `(17,25,6,3)`
- Cầu gỗ: `(18,10,5,4)`
- Trúc sét landmark: `(6,7,5,6)`
- Lều cũ: `(5,15,7,5)`
- Dấu khảo sát bờ an toàn: `(27,14,5,4)`
- Exit Rừng sâu: `(4,0,5,3)`
- Exit Bãi Sơn Trư: `(34,3,6,4)`

### Spawn gameplay
- Cam Lộ: 4-6 node, ưu tiên ven suối.
- Quái tutorial: 2-3 Sơn Trư đơn, 1-2 Độc Chu ở rìa.
- Không spawn quái trong 5 tile quanh entry/checkpoint.
- Có một tuyến từ entry tới exit rừng sâu không bắt buộc đánh nhiều hơn 1 encounter.

### Mobile
- Cầu rộng 3 tile.
- Không đặt quái phục kích ngay phía dưới clearing.
- Warning vùng độc/đòn lao phải có silhouette rõ.

---

## 3.2 Rừng Trúc Sâu — `m_truc_am_deep`

### Kích thước
- **44x32 tile**
- **1408x1024 px**

### Layout

```text
          VISTA / LINH THẠCH
                 |
      ┌----------+----------┐
      |                     |
  đường cao              đường tắt
      |                     |
  spider grove          herb pocket
      |                     |
      └----------+----------┘
                 |
              ENTRY
```

### POI
- Entry: `(19,29,6,3)`
- Spider grove: `(7,14,10,8)`
- Herb pocket: `(29,15,9,7)`
- Linh thạch vista: `(18,3,8,6)`
- Shortcut gate: `(31,8,5,5)`
- Exit Bãi Sơn Trư: `(40,23,4,6)`

### Gameplay
- 2 tuyến chính gặp nhau ở vista.
- Đường trái: nguy hiểm hơn, nhiều Độc Chu, vật liệu phù/độc.
- Đường phải: ít combat hơn nhưng cần khám phá/shortcut.
- Ít nhất 1 landmark nhìn thấy từ mỗi giao lộ.
- Không làm maze; người không mở minimap vẫn quay về entry được.

---

## 3.3 Bãi Sơn Trư — `m_truc_am_boar`

### Kích thước
- **36x28 tile**
- **1152x896 px**

### Layout
Ba combat clearing nối bằng hành lang tự nhiên:

```text
ENTRY
  |
[Clearing A] -- resource pocket
  |
[Clearing B]
  |      \
  |      cave / elite
  |
[Clearing C]
  |
EXIT THẠCH CẠN
```

### Clearing
- A: `(5,18,10,8)` — 1-2 Sơn Trư.
- B: `(14,10,12,9)` — 2-3 Sơn Trư, địa hình đào bới.
- C: `(21,2,11,8)` — encounter khó hơn.
- Cave elite: `(28,11,7,6)` — optional.
- Entry: `(1,23,5,4)`.
- Exit Thạch Cạn: `(30,0,6,4)`.

### Quy tắc combat
- Mỗi clearing có ít nhất 2 hướng thoát/né.
- Không spawn nhiều quái từ ngoài camera cùng lúc ở encounter đầu.
- Cây/đá cao chỉ che một phần nhỏ nhân vật, không che telegraph.

---

# 4. Thạch Cạn

## 4.1 Ngoại Vi — `m_thach_can_outer`

### Kích thước
- **48x36 tile**
- **1536x1152 px**

### Art direction
- đất xám/nâu;
- cây chết;
- xe quặng hỏng;
- cầu đá gãy;
- tháp quan sát;
- ít màu xanh;
- ánh sáng khô, tương phản rõ với projectile.

### Layout

```text
                     MỎ CŨ
                       |
                [checkpoint]
                       |
  THÁP ---- choke ---- CẦU GÃY
    |                  |
 ranged camp        ore route
    \                  /
       ---- ENTRY ----
```

### POI
- Entry Trúc Âm: `(4,31,7,5)`
- Tháp quan sát: `(5,8,8,8)`
- Camp Kẻ Rình Đường: `(12,17,11,8)`
- Cầu đá gãy: `(28,13,10,7)`
- Ore route: `(31,23,12,8)`
- Checkpoint mỏ: `(37,6,7,6)`
- Exit Mỏ Cũ: `(42,0,6,5)`

### Gameplay
- Giới thiệu enemy tầm xa trong clearing có nhiều cover.
- Cover chính rộng 1-3 tile; không tạo hành lang bắn một chiều không có đường né.
- Quặng có cả tuyến combat và tuyến an toàn hơn.

### Mobile
- Projectile chính dày ít nhất 2-3 logical px sau scale và khác nền.
- Không đặt cover quan trọng dưới action cluster bên phải ở điểm spawn encounter.
- Enemy ranged không được bắt đầu bắn từ ngoài gameplay FOV chuẩn.

---

## 4.2 Mỏ Cũ — `m_thach_can_mine`

### Kích thước
- **40x32 tile**
- **1280x1024 px**

### Layout

```text
ENTRY
  |
rail tunnel
  |
  +------ ore branch
  |
fork
 +------- lore/shortcut
 |
elite chamber
 |
sealed descent
 |
CỔ TỈNH
```

### POI
- Entry: `(18,29,5,3)`
- Rail tunnel: `(16,20,8,9)`
- Ore branch: `(26,18,10,7)`
- Lore branch: `(4,16,10,7)`
- Elite chamber: `(13,8,14,9)`
- Sealed descent: `(17,1,7,6)`

### Gameplay
- Không corridor dài hơn ~12-15 tile mà không có thay đổi hình ảnh.
- Nhánh phụ phải cho resource/lore/shortcut, không có dead-end rỗng.
- Đèn dầu/lồng đèn chỉ dẫn tuyến an toàn.
- Linh thạch dùng làm accent, không phủ sáng toàn mỏ.

---

# 5. Cổ Tỉnh — `d_co_tinh`

Cổ Tỉnh dùng **room graph**, không phải một rectangle 64x64.

## 5.1 Sơ đồ

```text
[Entrance 20x14]
       |
[Root Hall 12x20]
       |
   +---+---+
   |       |
[Loot] [Combat]
   |       |
   +---+---+
       |
[Balance 20x16]
       |
[Guardian 24x16]
       |
[Boss 30x20]
```

## 5.2 Room specs

| Room | Kích thước tile | Vai trò |
| --- | ---: | --- |
| Entrance | 20x14 | checkpoint, loadout |
| Root Hall | 12x20 | tension / traversal |
| Loot Side | 16x12 | optional reward/lore |
| Spider Combat | 22x16 | 2 Độc Chu + hazard |
| Balance Room | 20x16 | dò mạch / lựa chọn tuyến |
| Guardian | 24x16 | Thạch Vệ |
| Boss | 30x20 | Mộc Tâm Thủ Trận |

## 5.3 Camera
- Khi cửa room đóng, camera clamp theo combat boundary.
- Camera không zoom động mạnh trong pixel combat.
- Boss room giữ đủ khoảng trống quanh player cho mobile controls.
- Không đặt mechanic bắt buộc ở góc dưới phải.

## 5.4 Boss room
- Combat boundary khoảng **26x16 tile** bên trong room 30x20.
- 2-3 lane di chuyển, không maze.
- Telegraph boss ưu tiên hình khối lớn và nhịp rõ.
- Trang trí cao nằm ngoài boundary hoặc fade khi che player.

---

# 6. Võ Đài — `i_sparring_arena`

## Kích thước
- Scene: **26x16 tile**
- Combat boundary: khoảng **22x12 tile**

## Layout

```text
 spectators / banner / drum
┌──────────────────────────┐
│                          │
│      COMBAT BOUNDARY     │
│                          │
│ P1                    P2 │
│                          │
└──────────────────────────┘
  fence / spectators
```

## Quy tắc
- FOV competitive chuẩn 640x360.
- Không có vật trang trí che fighter/projectile.
- Spawn hai bên đối xứng về gameplay, không nhất thiết đối xứng art tuyệt đối.
- Server wall/collision dùng dữ liệu riêng, không phụ thuộc background art.

---

# 7. Cấu trúc scene Godot đề xuất

Mỗi world zone:

```text
MapRoot (Node2D)
├── Ground (TileMapLayer)
├── GroundDetail (TileMapLayer)
├── Collision (TileMapLayer)
├── PropsBack (TileMapLayer)
├── Interactables (Node2D)
├── ResourceNodes (Node2D)
├── EnemySpawns (Node2D)
├── NPCs (Node2D)
├── PlayerSpawn (Marker2D)
├── Gates (Node2D)
├── CameraBounds (ReferenceRect/metadata)
├── PropsFront (TileMapLayer)
└── FX (Node2D)
```

Không dùng một `TextureRect` 640x360 làm toàn bộ world production.

## 7.1 Data cần tách khỏi art
- `map_id`
- `size_tiles`
- `spawn_points`
- `gate_targets`
- `camera_bounds`
- `collision`
- `resource_nodes`
- `enemy_spawn_groups`
- `npc_spawns`
- `safe_zones`
- `checkpoint`

---

# 8. Camera profile

## Desktop
- Base viewport: 640x360.
- Follow player, clamp map bounds.
- Không để camera lộ ngoài map.
- Ưu tiên integer pixel movement.

## Mobile PvE
- Cùng world.
- Có thể mở ngang nhẹ theo aspect ratio tới khoảng 704x360 sau test.
- HUD dùng safe-area và chừa world center cho player.
- Player có thể lệch nhẹ khỏi đúng tâm để tránh bị action cluster che.

## Competitive
- Effective gameplay FOV cố định theo profile chuẩn.
- Không target/aggro dựa vào visibility.
- Phần màn hình thừa dành cho HUD/touch presentation.

---

# 9. Playtest metrics phải đo

Mỗi map prototype phải log/đo thủ công:
- thời gian spawn -> POI đầu;
- thời gian từ hub center -> mỗi service;
- thời gian traversal entry -> exit;
- số giây không có landmark/decision;
- số encounter bắt buộc;
- số lần người test mở minimap vì lạc;
- tỷ lệ chết do enemy ngoài màn hình;
- vùng touch UI che prompt/telegraph;
- FPS desktop/mobile baseline.

## Target khởi đầu
- An Khê: dịch vụ chính <= 15 giây từ quảng trường.
- Zone PvE nhỏ: entry -> exit chính khoảng 45-90 giây nếu không dừng combat.
- Không có đoạn chạy trống > 15 giây.
- First combat clearing đọc được trên cả 16:9 và mobile landscape.

---

# 10. Thứ tự dựng prototype

1. Refactor An Khê từ background 640x360 sang map 48x36 + Camera2D.
2. Bỏ `WALK_AREAS` hard-code; chuyển collision/walkability sang layer dữ liệu.
3. Sửa minimap đọc `map_size` thay vì chia cố định cho 640x360.
4. Dựng Trúc Âm Ven Suối trước để test outdoor PvE.
5. Dựng Bãi Sơn Trư để test combat clearing.
6. Dựng Thạch Cạn Ngoại Vi cho ranged/cover.
7. Dựng một room Cổ Tỉnh để test camera lock.
8. Khóa PvP arena FOV.
9. Test cùng scene trên PC và mobile profile.
10. Chỉ sau playtest mới khóa kích thước production.
