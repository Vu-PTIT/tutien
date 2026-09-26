# 08 — Kế hoạch cross-platform PC + Mobile

**Cập nhật:** 22/09/2026  
**Trạng thái:** kế hoạch kiến trúc và UI/UX; chưa được hiểu là đã triển khai runtime.  
**Nhánh áp dụng:** `feat/inventory-rewards`.  
**Mục tiêu:** một game 2D pixel dùng chung gameplay/backend/content, nhưng có presentation và input phù hợp riêng cho PC/laptop và mobile.

> Nguyên tắc chính: **không làm hai game**. PC và mobile dùng chung game core, data, map, combat, inventory state, quest, network và art direction. Chỉ tách những phần thực sự phụ thuộc thiết bị: input, bố cục UI, safe area, camera profile, kích thước thao tác và performance profile.

---

## 1. Quyết định sản phẩm

### 1.1 Nền tảng mục tiêu

MVP hỗ trợ:

- Windows PC/laptop bằng keyboard + mouse.
- Android mobile bằng touch.
- Mobile gameplay ưu tiên **landscape**.
- Tablet dùng layout mobile mở rộng; không tạo một nhánh gameplay riêng.
- Portrait không phải gameplay target của MVP; chỉ xem xét cho màn hình phụ sau này nếu có lý do sản phẩm.

### 1.2 Không được tạo hai nhánh gameplay

Không tạo:

- `PlayerPC.gd` và `PlayerMobile.gd`;
- `CombatPC.gd` và `CombatMobile.gd`;
- hai inventory model;
- hai bộ item/skill/quest data;
- hai backend API cho cùng một hành động.

Thay vào đó:

```text
Input device
    |
    v
InputRouter
    |
    v
Game action intent
    |
    v
Player / Combat / Interaction controller
    |
    v
Nakama authoritative rules
```

Cùng một hành động `attack`, `move`, `dodge`, `interact` hoặc `skill_1` phải có ý nghĩa gameplay giống nhau trên mọi thiết bị.

---

## 2. Ma trận dùng chung và tách riêng

| Mảng | Dùng chung | Khác theo thiết bị |
| --- | --- | --- |
| World/map/TileMap | Có | Camera profile và vùng UI che màn hình |
| Player/enemy/NPC scene | Có | Không |
| Animation/VFX asset gốc | Có | Mức hiệu ứng có thể giảm trên mobile |
| Combat rule/damage/cooldown | Có | Cách nhập lệnh |
| Inventory state 24 ô | Có | Bố cục, tooltip, drag/tap |
| Equipment/item catalog | Có | Bố cục màn hình |
| Quest/progression/cultivation | Có | Cách trình bày HUD/menu |
| Craft/shop/garden | Có | Bố cục và thao tác |
| Nakama/PostgreSQL/save | Có | Không |
| Multiplayer protocol | Có | Không được chia protocol PC/mobile |
| Pixel art/theme/font family | Có | Scale token và spacing |
| HUD | Nội dung chung | Layout PC/mobile riêng |
| Input | Action contract chung | Keyboard/mouse vs touch |
| Camera logic | Controller chung | Profile aspect/zoom |
| Graphics | Asset chung | Quality profile |
| Safe area | Logic chung | Chủ yếu ảnh hưởng mobile |

Mục tiêu là giữ phần dùng chung ở mức khoảng 80–90% và không để presentation kéo logic gameplay vào scene UI.

---

## 3. Kiến trúc client đề xuất

```text
client/
├── gameplay/
│   ├── player/
│   ├── combat/
│   ├── interaction/
│   └── world/
├── input/
│   ├── input_router.gd
│   ├── desktop_input_adapter.gd
│   └── touch_input_adapter.gd
├── platform/
│   ├── platform_manager.gd
│   ├── device_profile.gd
│   ├── safe_area.gd
│   └── performance_profile.gd
├── ui/
│   ├── shared/
│   │   ├── pixel_panel.tscn
│   │   ├── pixel_button.tscn
│   │   ├── item_slot.tscn
│   │   ├── skill_slot.tscn
│   │   └── tutien_theme.tres
│   ├── hud/
│   │   ├── hud_controller.gd
│   │   ├── desktop/hud_desktop.tscn
│   │   └── mobile/hud_mobile.tscn
│   ├── inventory/
│   │   ├── inventory_presenter.gd
│   │   ├── inventory_desktop.tscn
│   │   └── inventory_mobile.tscn
│   ├── menus/
│   └── touch/
│       ├── virtual_joystick.tscn
│       ├── action_button.tscn
│       └── skill_button.tscn
└── data/
```

Tên file là định hướng triển khai, không phải tuyên bố các file trên đã tồn tại.

### Luật phụ thuộc

- `gameplay/*` không import scene mobile/desktop.
- `input/*` chỉ chuyển thiết bị vật lý thành action intent.
- `ui/*` đọc state/presenter; không tự sửa tiền, XP, inventory hoặc damage.
- `platform/*` cung cấp profile, safe area và capability.
- Backend không cần biết người chơi bấm WASD hay joystick ảo.

---

## 4. Input contract dùng chung

Gameplay chỉ nhận các action chuẩn:

| Action | PC/laptop | Mobile |
| --- | --- | --- |
| `move_vector` | WASD / arrow | virtual joystick trái |
| `aim_vector` | mouse position | aim drag hoặc hướng mục tiêu |
| `attack` | LMB / phím bind | attack button |
| `dodge` | Space | dodge button |
| `interact` | E | interact button |
| `skill_1..n` | 1..n | skill buttons |
| `inventory` | I | bag icon |
| `map` | M | map icon |
| `menu` | Esc | menu icon |

### Yêu cầu kỹ thuật

1. `PlayerController` và `CombatController` không gọi trực tiếp `KEY_W`, `KEY_A`...  
2. Các adapter cùng phát ra action contract ở trên.  
3. Rebind PC được phép về sau mà không sửa gameplay.  
4. Touch control phải có dead-zone, cancel khi ngón rời vùng điều khiển và không phát lệnh lặp ngoài ý muốn.  
5. UI touch không được xuyên xuống world input.  
6. Server vẫn kiểm sequence/rate/cooldown/range như hiện tại; mobile không có đường đi tắt riêng.

---

## 5. Resolution, aspect ratio và pixel art

### 5.1 Logical resolution

Giữ `640×360` như mốc thiết kế pixel 16:9, nhưng không hard-code mọi Control theo tọa độ tuyệt đối.

- Gameplay/world dùng logical scale và camera.
- UI dùng anchors + containers + size token.
- Texture pixel giữ nearest filtering.
- Không kéo giãn world để lấp 18:9/19.5:9/20:9.

### 5.2 Màn hình rộng mobile

Với màn hình rộng hơn 16:9:

- HUD neo theo safe area.
- World có thể mở thêm chiều ngang trong PvE trong một giới hạn đã test.
- Không để aspect ratio tạo lợi thế PvP không kiểm soát.

**PvP/competitive:** dùng gameplay viewport/FOV chuẩn chung hoặc giới hạn tầm nhìn gameplay độc lập với kích thước màn hình. Aggro, skill range, hitbox và target validation luôn dựa trên world state/server, không dựa trên việc sprite đang nằm trong camera.

### 5.3 Safe area

Mọi mobile HUD phải đặt trong vùng an toàn:

- tránh notch/camera hole;
- tránh rounded corner;
- tránh system gesture area;
- có padding tối thiểu cho nút quan trọng.

Không đặt attack/dodge sát mép vật lý chỉ vì mockup 16:9 không có notch.

---

## 6. UI token và font

Không hard-code font size/padding lặp lại trong từng scene.

### Token semantic

```text
FONT_XS
FONT_SM
FONT_MD
FONT_LG
FONT_XL

SPACE_XS
SPACE_SM
SPACE_MD
SPACE_LG

BUTTON_H_SM
BUTTON_H_MD
ITEM_SLOT_SIZE
TOUCH_TARGET_MIN
HUD_EDGE_PADDING
```

### Profile khởi đầu để test

| Token | Desktop logical | Mobile logical |
| --- | ---: | ---: |
| FONT_XS | 8 | 10 |
| FONT_SM | 10 | 12 |
| FONT_MD | 12 | 14 |
| FONT_LG | 16 | 18 |
| FONT_XL | 24 | 24 |
| touch target tối thiểu | không áp dụng | 44–48 px logical sau scale |

Các số trên là giá trị prototype, phải chỉnh sau device test. Cùng một font family/pixel identity được dùng trên hai nền tảng.

---

## 7. HUD

### 7.1 Desktop

Ưu tiên đọc nhiều thông tin mà không che world:

- HP/MP/tu vi góc trên trái;
- minimap góc trên phải;
- quest tracker bên phải;
- hotbar dưới giữa;
- shortcut keyboard hiển thị trên slot;
- tooltip bằng hover;
- menu phụ có thể mở thành panel không toàn màn hình.

### 7.2 Mobile

Ưu tiên vùng chơi và ngón tay:

- HP/MP/tu vi gọn ở trên trái;
- minimap/menu gọn ở trên phải;
- quest tracker chỉ hiện mục tiêu ngắn;
- joystick dưới trái;
- attack/skill/dodge/interact dưới phải;
- các nút combat không chồng nhau khi màn hình 16:9 nhỏ;
- có opacity/scale setting cho touch controls sau MVP nếu cần.

Không bê nguyên hotbar desktop xuống đáy màn hình mobile.

---

## 8. Inventory và các màn hình menu

Inventory state vẫn là một model 24 ô. Chỉ presentation khác.

### Desktop

- grid rộng;
- panel detail ở cạnh;
- hover tooltip;
- drag bằng mouse;
- right click/context action nếu cần;
- keyboard shortcut.

### Mobile

- grid 4 cột hoặc số cột responsive;
- detail mở khi tap;
- long-press cho action phụ nếu thật sự cần;
- drag touch chỉ dùng khi test cho thấy không gây thao tác nhầm;
- action quan trọng có button rõ thay vì phụ thuộc gesture ẩn;
- panel gần full-screen để tránh nút quá nhỏ.

Cùng pattern này áp dụng cho:

- character/equipment;
- cultivation;
- quest log;
- crafting;
- shop;
- map;
- social/chat.

---

## 9. Camera

Dùng một `GameCamera` với profile thay vì hai hệ camera độc lập.

### Desktop profile

- khung nhìn 16:9 chuẩn;
- mouse aim dễ quan sát;
- UI ít che world.

### Mobile profile

- tính vùng world còn lại sau touch controls;
- zoom/aspect theo profile;
- clamp để nhân vật không bị nút combat che;
- không dùng camera visibility làm điều kiện gameplay.

### PvP

Trước khi mở PvP ngoài đấu tập:

- xác định một chuẩn gameplay FOV chung;
- kiểm tra 16:9 vs 20:9;
- không để người chơi nhìn/target đối thủ xa hơn chỉ do thiết bị.

---

## 10. Performance profile

2D pixel vẫn phải có profile mobile ngay từ đầu.

| Hạng mục | Desktop | Mobile |
| --- | --- | --- |
| particles | full | medium/reduced |
| weather FX | full | reduced khi cần |
| background animation | full | giảm theo profile |
| dynamic lights | full target | giới hạn số lượng |
| shadow/post effect | theo art direction | chỉ giữ hiệu ứng cần thiết |
| target FPS | 60 | 60 ưu tiên; fallback 30 chỉ nếu thiết bị yếu |

Không tạo asset gameplay khác nhau; chỉ thay số lượng/effect quality.

---

## 11. Definition of Done mới cho mọi feature

Từ khi plan này được áp dụng, một feature UI/gameplay không được ghi “Done” chỉ vì chạy trên PC.

Ví dụ inventory:

### Shared

- 24 slot đúng state;
- stack/move/use/drop/equip đúng luật;
- save/restart không mất state;
- server validation đúng.

### Desktop

- mouse/keyboard hoạt động;
- hover/tooltip không lỗi;
- 1366×768 và 1920×1080 đọc được;
- không overflow khi resize.

### Mobile

- tap/drag/action button hoạt động;
- không có control nhỏ khó bấm;
- landscape 16:9, 19.5:9, 20:9 không che nội dung;
- notch/safe area đạt;
- mở bàn phím chat không phá layout.

Combat, quest, crafting, cultivation và social phải có checklist tương tự.

---

## 12. Device/test matrix

### Desktop bắt buộc

- 1366×768 laptop;
- 1920×1080;
- 2560×1440 hoặc scale tương đương;
- resize window;
- mouse + keyboard.

### Mobile bắt buộc

- landscape 16:9;
- 18:9;
- 19.5:9;
- 20:9;
- ít nhất một profile notch/camera-hole;
- tablet 16:10;
- thiết bị tầm trung làm baseline performance.

### Test thao tác

- ngón cái trái joystick + ngón cái phải combat cùng lúc;
- giữ joystick rồi bấm skill;
- mở inventory rồi xoay/resize nếu platform cho phép;
- chat + virtual keyboard;
- disconnect/reconnect trong khi UI mobile đang mở;
- background/resume app;
- touch bị cancel khi mở system overlay.

---

## 13. G0.5 — Cross-platform Foundation

G0.5 phải được làm **trước khi mở rộng thêm nhiều HUD/menu desktop**.

### CP-0 — Khóa contract

**Mục tiêu:** quyết định nền tảng trước code.

- chốt landscape mobile;
- chốt action contract;
- chốt logical 640×360;
- chốt token font/spacing;
- chốt rule PvP FOV;
- ghi danh sách màn hình cần desktop/mobile variant.

**Done khi:** không còn scene mới cần tự đoán input hoặc resolution strategy.

### CP-1 — Input abstraction

- tạo `InputRouter`;
- chuyển WASD/mouse hiện tại vào desktop adapter;
- gameplay không gọi physical key trực tiếp;
- thêm touch adapter skeleton;
- unit/manual test action parity.

**Done khi:** cùng scene player có thể nhận input desktop hoặc touch mà không đổi gameplay script.

### CP-2 — Shared responsive UI foundation

- tạo theme/tokens;
- shared PixelPanel/PixelButton/ItemSlot;
- anchor/container rules;
- safe-area helper;
- device profile.

**Done khi:** một test scene đổi 16:9 → 20:9 mà không vỡ layout.

### CP-3 — HUD PC + Mobile

- desktop HUD giữ trải nghiệm hiện tại nhưng chuyển sang responsive;
- mobile HUD có joystick + attack/skill/dodge/interact;
- quest/minimap/status có variant phù hợp;
- world input không xuyên qua touch UI.

**Done khi:** cùng một combat sandbox chơi được bằng hai input profile.

### CP-4 — Inventory/menu PC + Mobile

- tách presenter/state khỏi layout;
- desktop inventory;
- mobile inventory;
- character/equipment;
- quest/menu cơ bản;
- tooltip vs tap-detail.

**Done khi:** cùng inventory state thao tác được trên cả hai profile và restart vẫn nhất quán.

### CP-5 — Camera, performance và export

- camera profile;
- PvP/FOV guard;
- mobile quality profile;
- Android export preset;
- test background/resume;
- device matrix smoke test.

**Done khi:** build Windows và Android cùng đi qua vertical-slice smoke test.

---

## 14. Ghép G0.5 vào P1–P5

Thứ tự mới:

```text
G0 / nền hiện có
        |
        v
G0.5 Cross-platform Foundation
        |
        v
P1 Sơn Trư combat sandbox
        |
        v
P2 Reward + inventory/equip
        |
        v
P3 Mortal -> Luyện Khí 1
        |
        v
P4 Trúc Âm / craft / garden
        |
        v
P5 Chapter 1
```

Không cần hoàn thiện toàn bộ mobile menu trước P1. Nhưng CP-1 đến CP-3 phải đủ sớm để P1 combat được test bằng touch, và CP-4 phải hoàn thành cùng P2 vì inventory là phần trọng tâm của P2.

---

## 15. Ưu tiên triển khai thực tế từ trạng thái hiện tại

1. Refactor input hiện tại khỏi `main.gd`/physical key thành action contract.
2. Tạo `PlatformManager + DeviceProfile`.
3. Tạo UI token/theme dùng chung, bao gồm font scale.
4. Làm responsive HUD root.
5. Làm mobile joystick/action buttons tối thiểu.
6. Ghép touch vào sandbox combat trước khi sản xuất thêm nhiều màn hình.
7. Khi triển khai inventory runtime, làm presenter chung rồi hai layout.
8. Khi P3 thêm quest/progression HUD, bắt buộc desktop/mobile cùng sprint.
9. Android export và smoke test chạy định kỳ, không để tới G8 mới port.
10. Chỉ polish khác biệt thiết bị sau khi shared flow ổn.

---

## 16. Các anti-pattern phải tránh

- hard-code vị trí toàn bộ UI theo 640×360;
- scale nguyên desktop HUD lên mobile;
- button chỉ 16–24 px trên touch;
- dùng hover như cách duy nhất để đọc item;
- gameplay đọc trực tiếp physical key;
- duplicated state model cho mobile;
- duplicated server RPC chỉ vì UI khác;
- camera visibility quyết định enemy aggro/range;
- làm xong toàn bộ PC rồi mới “port Android”;
- tạo art style mobile riêng làm lệch visual identity.

---

## 17. Tiêu chí hoàn thành cross-platform foundation

G0.5 chỉ được đánh dấu hoàn thành khi:

- một gameplay scene duy nhất chạy được desktop và touch;
- action contract không phụ thuộc physical key;
- HUD PC/mobile dùng cùng game state;
- UI không vỡ ở 16:9–20:9;
- mobile safe area không che control chính;
- inventory/presenter có đường triển khai chung rõ ràng;
- PvP/FOV rule được khóa;
- Windows + Android build có smoke checklist;
- mọi feature mới có DoD tách Shared / Desktop / Mobile.

Sau mốc này, PC và mobile trở thành hai presentation profile của cùng sản phẩm, không phải một bản chính và một bản port làm sau.
