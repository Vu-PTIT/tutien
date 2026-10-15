# 10 — Kích thước map cho game online (tối đa 30 người/map)

**Trạng thái:** **Đã cập nhật 15/10/2026** (Kích thước map và tốc độ di chuyển trong tài liệu này **được thay thế bằng quy chuẩn chuẩn ở [11](11-ti-le-map.md)**). Các nguyên tắc thiết kế hệ thống online ở đây (kênh tối đa 30 người, quái dùng chung, mở rộng điểm hoạt động, map nhà riêng `m_nha`) **vẫn giữ nguyên giá trị cốt lõi**.

**Yêu cầu:** mỗi map chứa **tối đa 30 người chơi online** cùng lúc. Người thứ 31 vào thì sang **kênh** khác của cùng map (bản sao map, xem §5).

---

## 1. Các con số dùng để tính

| Đại lượng | Giá trị | Nguồn |
| --- | --- | --- |
| Ô | 32 px | [04](04-map-art.md) |
| Khung nhìn ở zoom mặc định | ≈ 30×17 ô = **510 ô** ("1 màn") | [04](04-map-art.md) |
| Tốc độ đi bộ | 72 px/s = **2,25 ô/s** | `WORLD_SPEED` trong `server/src/world.ts` |
| Đi hết 1 màn theo chiều ngang | ≈ 13 s | 30 ô ÷ 2,25 |
| Phần đi được của map | ≈ 60–70% (trừ nước, nhà, vách, cây) | ước lượng |

## 2. Vấn đề với kích thước cũ

| Map | Cũ (ô) | Tổng ô | Số màn | Đi ngang hết map | Số màn / người khi đủ 30 người |
| --- | --- | --- | --- | --- | --- |
| Làng Hồ Lặng | 256×192 | 49 152 | 96 | 114 s | 3,2 |
| Vườn Cây Mẹ *(đề xuất trước)* | 160×128 | 20 480 | 40 | 71 s | 1,3 |
| Bìa Rừng | 288×224 | 64 512 | 126 | 128 s | 4,2 |
| Mỏ Bỏ Hoang | 224×192 | 43 008 | 84 | 100 s | 2,8 |
| Hầm Mỏ | 192×160 | 30 720 | 60 | 85 s | 2,0 |
| Rừng Sâu | 320×256 | 81 920 | 160 | 142 s | 5,3 |
| Đài Thiên Mạch | 160×128 | 20 480 | 40 | 71 s | 1,3 |

**Kết luận:** map hiện tại quá to cho 30 người.
- **Làng đủ 30 người** thì trung bình mỗi màn chỉ có khoảng 0,3 người. Lúc chỉ 8–10 người online, phần lớn thời gian người chơi sẽ **không thấy ai** trên màn hình, mất cảm giác online.
- Rừng Sâu đủ 30 người thì mỗi người có tới 5 màn riêng, gần như chơi một mình.
- Đi bộ từ mép này sang mép kia mất 2 phút trở lên. Riêng việc đi từ nhà ra Chốt đã mất khoảng 1 phút, chưa kể đi qua nhiều map.

## 3. Mật độ mục tiêu

Một map 30 người phải trông **đông khi đủ người**, và vẫn **có người qua lại khi chỉ 1/3 số người online**.

| Loại map | Ví dụ | Mật độ khi đủ 30 người | Diện tích cho 1 người | Tổng diện tích |
| --- | --- | --- | --- | --- |
| **Trung tâm / xã hội** | Làng, Vườn Cây Mẹ | ~0,8–1 người/màn; chỗ tụ họp (chợ, cổng) 3–6 người/màn | 400–650 ô | 12 000–20 000 ô |
| **Săn ngoài trời** | Bìa Rừng, Rừng Sâu | ~0,6–0,7 người/màn (cần chỗ kéo quái, né) | 700–950 ô | 20 000–28 000 ô |
| **Hầm / hành lang** | Mỏ, Hầm Mỏ, Đài | đông hơn vì đường hẹp | 250–500 ô | 7 500–15 000 ô |

Thời gian đi bộ hết map nên nằm trong khoảng **45–85 s**.

## 4. Kích thước map (Lưu ý: Đã được nâng cấp tại [11-ti-le-map.md](11-ti-le-map.md))

> [!IMPORTANT]
> Bảng dưới đây là kích thước ở đợt chốt 13/10/2026 (hiện tại trong dữ liệu code backend `server/data/*.json`). **Từ 15/10/2026, dự án chính thức chuyển sang kích thước và tỉ lệ mới tại [11](11-ti-le-map.md)** (Làng 96×72, tốc độ 4 ô/s). Bảng dưới đây giữ lại làm mốc tham chiếu cho dữ liệu hiện tại [09](09-map-hien-trang.md).

| Map | Cũ | Đợt 1 (13/10) | **Chuẩn mới [11]** | Tổng ô (Chuẩn [11]) | Số màn [11] | Đi ngang (4 ô/s) | Ô / người (30) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Làng Hồ Lặng | 256×192 | 160×120 | **96×72** | 6 912 | 13,5 | 24 s | 230 |
| Vườn Cây Mẹ | 160×128 | 128×96 | **80×60** | 4 800 | 9,4 | 20 s | 160 |
| Bìa Rừng | 288×224 | 176×128 | **112×80** | 8 960 | 17,6 | 28 s | 300 |
| Mỏ Bỏ Hoang | 224×192 | 128×112 | **80×64** | 5 120 | 10,0 | 20 s | 170 |
| Hầm Mỏ (B1) | 192×160 | 112×80 | **72×48** | 3 456 | 6,8 | 18 s | 115 |
| Rừng Sâu | 320×256 | 192×144 | **128×96** | 12 288 | 24,0 | 32 s | 410 |
| Đài Thiên Mạch | 160×128 | 96×80 | **64×48** | 3 072 | 6,0 | 16 s | 100 |
| Nhà riêng | — | 32×24 | **28×20** | 560 | 1,1 | 7 s | 1 người |

Ghi chú:
- **Làng 160×120**: vẫn đủ chỗ cho cả 7 khu (Đồi Miếu, Xóm nhà, Sân Hội Khai Phá, Chợ và Phố chợ, Vườn/Ruộng, Đầm Hồ Lặng; thêm Cổng Rễ và bãi biển ở viền), nhưng khu nào cũng nằm trong khoảng 1–2 màn tính từ Sân Hội Khai Phá. Từ điểm xuất phát đi tới bất kỳ khu nào mất dưới 35 s.
- **Vườn Cây Mẹ nhỏ hơn làng**: là nơi Tinh Linh xuất phát nhưng sau đó họ sẽ sang làng. Map nhỏ giúp Vườn Cây Mẹ trông không vắng. Viền giao thoa không đi qua được (rễ dày, nước sâu) cũng làm map gọn lại.
- **Đài 96×80**: map chung 30 người như các map khác. Đấu trường boss tròn khoảng 24×20 ô vừa 30 người; máu boss nhân theo số người trong phòng ([06](06-monsters.md) B1).
- **Rừng Sâu 192×144** thay vì phương án 224×160: giữ đi ngang dưới 90 s và mật độ gần Bìa Rừng.

## 5. Những thứ phải đổi theo, ngoài kích thước

### 5.1 Kênh (bản sao map)

- Hiện server **chưa có giới hạn người hay khái niệm kênh**: vị trí người chơi được lưu riêng qua RPC (`world_move`), chưa có đồng bộ thời gian thực giữa người chơi.
- Cần thêm: mỗi map chạy theo **kênh**, mỗi kênh tối đa 30 người. Khi vào map thì vào kênh còn chỗ có nhiều người nhất (để map không vắng); khi đầy thì mở kênh mới. Bạn bè và nhóm được ưu tiên vào cùng kênh.
- **Avatar tự hoạt động** (người chơi offline) **không tính** vào 30 chỗ, nhưng vẫn hiện trong kênh có ít người nhất để map có sức sống.

### 5.2 Quái phải dùng chung

- Hiện quái được tạo **riêng cho từng người chơi** (`worldEnsureFieldMobs` lưu trong phiên của mỗi người). Trong game online, quái phải **dùng chung theo kênh**: ai cũng thấy cùng một con, cùng đánh và chia phần thưởng.
- Số quái tính theo số người: khoảng **1–1,5 quái/người** đang ở map, có mức sàn để map không bao giờ trống.

| Map | Trước | **Đã áp dụng** (đủ 30 người) | Mức sàn khi chỉ còn 1–5 người (làm cùng kênh) |
| --- | --- | --- | --- |
| Bìa Rừng | 30 | **37** | 15 |
| Mỏ Bỏ Hoang | 13 | **21** | 8 |
| Hầm Mỏ | 18 | **18** | 8 |
| Rừng Sâu | 28 | **40** | 15 |
| Đài Thiên Mạch | 24 | **24** | 12 |

Mật độ vẫn giữ quy tắc tối đa 6 quái/màn ([05 §4](05-map-layouts.md)). Map nhỏ lại mà quái tăng thì lãnh địa cần **nhiều nhóm nhỏ hơn** thay vì ít nhóm lớn.

### 5.3 Điểm hoạt động quá ít

Mỗi điểm hoạt động chỉ cho **1 người dùng một lúc** trên toàn server (khóa `life_slots` theo `mapId:siteId`). Avatar offline cũng giữ chỗ. Với 30 người, số điểm hiện tại không đủ:

| Hoạt động | Trước | **Đã áp dụng** | Ghi chú |
| --- | --- | --- | --- |
| Bến câu (làng) | 4 | **12** | 6 trên sàn gỗ bờ bắc, 3 trên cầu gỗ chìa ra hồ, 3 bờ đông |
| Luống trồng | 12 dùng chung | **12 luống riêng mỗi người** trong `m_nha` | Xem §5.4 |
| Vỉa (Mỏ) | 2 | **8** | Rải theo bậc khai thác Hố Tây |
| Vỉa (Hầm B1) | 2 | **6** | Vỉa Đông |
| Điểm thiền | 6 | **26**: sân miếu 8, bờ hồ 4, tháp gió 4, Hố Tây 4, Rừng Sâu 6 | Thiền đông người là hình ảnh đẹp |
| Vườn Cây Mẹ (chưa dựng) | 0 | 8 Hấp Linh, 6 bến câu linh, 6 luống nấm riêng | Làm cùng map `m_k1_07` |

Khóa chỗ nên tính **theo kênh**, không phải toàn server. Nếu không, 30 kênh vẫn chỉ dùng chung 4 bến câu.

### 5.4 Nhà và vườn riêng

- Thiết kế hiện tại đặt "**nhà người chơi**" là một căn trong Xóm nhà (~18 nhà). Một map công khai không thể chứa nhà cho mọi người chơi.
- Đã chốt: Xóm nhà có **cửa nhà chung** (một dãy nhà hoặc một ngõ). Bước vào thì sang **map nhà riêng** (bản sao cho từng người, khoảng 32×24 ô) gồm nhà, sân và **12 luống riêng**. Tinh Linh làm tương tự với một hốc rễ ở Vườn Cây Mẹ.
- Vườn công cộng ở làng giữ lại làm khu trang trí, hoặc làm luống thuê theo giờ.

## 6. Đã làm và còn lại

**Đã làm (13/10/2026):**
1. `server/data/life_world.json`, `world_population.json`: kích thước mới, toàn bộ cổng, điểm hoạt động, lãnh địa, vùng an toàn, NPC đặt lại; thêm map `m_nha` và cổng `ln_k1_01_nha`; thêm đầu `ln_k1_04_k1_05` trong Hầm Mỏ; mở `ln_k1_01_k1_08`, `ln_vanh_thang` (Kinh thành mới có khung); bỏ 459 footprint cũ của làng.
2. Server: lease luống trồng khóa theo từng người chơi (`lifeSlotRequest` trong `server/src/life_activity.ts`).
3. Test server cập nhật theo tọa độ mới; 183/183 đạt. Không màn nào quá 6 quái.
4. Tài liệu 03, 05, 06, 08, 09 và `docs/life-activities-backend.md`.

**Còn lại (backend, làm sau):**
- Kênh tối đa 30 người mỗi map, đồng bộ người chơi theo thời gian thực.
- Quái dùng chung theo kênh, số quái co giãn theo số người (mức sàn ở §5.2).
- Khóa điểm hoạt động theo kênh thay vì toàn server.
- Map Vườn Cây Mẹ (`m_k1_07`) theo [05 §3](05-map-layouts.md).
- Đài Thiên Mạch: máu boss nhân theo số người trong Phòng Lõi; trạng thái lõi chung cho cả kênh (Phá lõi trận → tối 47 phút); lưu lựa chọn hồi E (Phá lõi trận/Chép trận văn) vào hồ sơ từng người.

## 7. Các quyết định đã chốt

| Câu hỏi | Quyết định | Lý do |
| --- | --- | --- |
| Kích thước map | Bảng §4, Rừng Sâu **192×144** | Giữ thời gian đi ngang dưới 90 s; map nào cũng đông khi đủ người |
| Avatar offline có tính vào 30 chỗ không? | **Không tính.** Avatar offline hiện ở kênh ít người nhất của map | Người online không bị chặn vì người vắng mặt; kênh vắng vẫn có sức sống |
| Nhà và vườn | **Map nhà riêng** `m_nha` 32×24, mỗi người một bản, 12 luống riêng. Ruộng làng chỉ để trang trí | Map chung không thể chứa nhà cho mọi người chơi; vườn riêng không phải tranh chỗ |
| Ghép bạn bè/nhóm vào cùng kênh? | **Có.** Vào map thì ưu tiên kênh có bạn bè/nhóm, sau đó kênh còn chỗ đông nhất | Chơi cùng nhau là lý do làm game online |
| Bé Mơ ở đâu? | Giữ ở làng (sân miếu) làm điểm dạy Hấp Linh; thêm điểm dạy thứ hai khi có Vườn Cây Mẹ | Người chơi Người học Hấp Linh ngay từ làng |
| Đường đi Kinh thành | **Mở** (thế giới mở); map mới có khung | [12](12-ban-do-cac-khu.md) §1 |
| Đài Thiên Mạch | **Map chung 30 người** (chủ dự án chọn). Lõi luôn chạy trong thế giới chung; lựa chọn hồi E là của riêng từng người; Phá lõi trận làm cả kênh thấy lõi tối 47 phút; gấu quay lại sau 47 phút | Trận boss đông người; lựa chọn cá nhân không phá thế giới chung ([02](02-story.md) hồi E) |
