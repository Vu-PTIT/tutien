# 03 — Thế giới và map

## 1. Ba khu

Thế giới chương 1 chia làm **ba khu**:

```text
                         ┌───────────────────────────┐
                         │  RỪNG SÂU (núi, nguồn sông) │──► Trạm Thiên Mạch (dưới núi)
                         └─────────────┬─────────────┘
 ┌──────────────┐  đường núi           │ lối mòn kiểm lâm
 │ MỎ BỎ HOANG  │◄──────────────►──────┘
 │ (+ Hầm Mỏ)   │                ┌─────────────┴─────────────┐
 │              │◄── đường xe ──►│  BÌA RỪNG          ≈ sông │   KHU RỪNG QUÁI
 └──────────────┘                └─────────────┬─────────────┘
 ═══════════════════════ TƯỜNG RÀO ════ [Chốt] ═╪═══════ ≈ ════════════════
                                 ┌─────────────┴─────────────┐   KHU NGƯỜI
           ┌──────────┐          │  LÀNG HỒ LẶNG       ≈ sông│──► trạm buýt → Thăng Long
           │ Nhà riêng│◄─ cửa ──►│  (Cổng Ẩn Giới ở giữa)    │     (sau chương 1)
           └──────────┘          └─────────────┬─────────────┘
                                               │ Cổng Ẩn Giới (không nằm trên mặt đất)
                                 ┌─────────────┴─────────────┐
                                 │  ẨN GIỚI — Vườn Cây Mẹ    │   KHU TINH LINH
                                 └───────────────────────────┘
```

| Khu | Là gì | Cảm giác | Ai sống | Có quái |
| --- | --- | --- | --- | --- |
| **Khu Người** | Làng ven hồ và thị trấn nhỏ, nơi người dân sinh sống | Ấm, đông, đời thường | Người, một ít Tinh Linh xuống buôn bán | Không |
| **Khu Rừng Quái** | Khu rừng và núi phía bên kia tường rào, nơi động vật bị nhiễm linh năng | Hoang, gió, linh năng rõ | Không ai; chỉ thợ săn và đội tuần tra ghé qua | Có |
| **Khu Tinh Linh** | Một mảnh **Ẩn Giới**, vào qua cổng ở giữa khu Người | Dịu, sáng, lạ, như trong mơ | Tinh Linh | Không |

Ý tưởng chính:
- **Khu Rừng Quái nằm phía bắc Khu Người**, ngăn bằng một **tường rào có chốt gác** chạy ngang mép bắc làng. Đi bộ qua chốt là sang Bìa Rừng; càng lên bắc càng sâu vào núi.
- **Một con sông** chảy từ núi Rừng Sâu xuống qua Bìa Rừng, chui qua cống dưới tường rào rồi chảy dọc mép đông làng. Đây là sợi chỉ nối các map với nhau.
- **Khu Tinh Linh** không nằm trên cùng mặt đất. Đêm Linh Chấn, một vết rách của màn che mở ra **ngay trong làng**; người ta dựng quanh nó một cái cổng có canh gác, gọi là **Cổng Ẩn Giới**. Bước qua cổng là sang thế giới của Tinh Linh.
- Vì cổng nằm giữa làng, Người và Tinh Linh **buộc phải sống cạnh nhau**. Đây là nguồn của mọi căng thẳng và mọi tình bạn trong chương 1.

## 2. Quy luật hình ảnh

- **Khu Người:** ấm, nhiều chi tiết đời sống hiện đại. Càng gần tường rào, càng nhiều rào chắn, biển cảnh báo, đèn pha.
- **Khu Rừng Quái:** càng vào sâu, màu càng nhạt, tối và lạnh; tương phản mạnh; linh năng rối. Gần tường còn dấu vết Người (đường mòn, trạm cũ), sâu bên trong thì không.
- **Khu Tinh Linh:** màu trong, sáng dịu, đường cong; không có máy móc. Linh năng mềm, ấm, trôi chậm.
- **Quanh Cổng Ẩn Giới** (trong khu Người): hai thế giới trộn vào nhau. Cỏ quanh cổng có lá trong như ở Ẩn Giới, đèn đường bị dây leo phát sáng quấn lên, chốt gác của Người đặt cạnh lồng đèn lá của Tinh Linh.

## 3. Map và ID kỹ thuật

Chương 1 chỉ dùng các map dưới đây. Giữ ID đã có trong `server/data/life_world.json`; thêm một map mới cho Ẩn Giới.

**Game online: mỗi map tối đa 30 người chơi một kênh**; đầy thì mở kênh mới (bản sao map). Kích thước từng map tính theo con số này, xem [10](10-kich-thuoc-map-online.md).

| Khu | ID | Tên hiển thị | Kích thước (ô) | Vai trò |
| --- | --- | --- | --- | --- |
| Người | `m_lang_que` | **Làng Hồ Lặng** | 160×120 | Toàn bộ khu Người: làng, hồ, thị trấn, Cổng Ẩn Giới |
| Người | `m_nha` | **Nhà riêng** | 32×24 | Nhà + vườn 12 luống của từng người chơi, mỗi người một bản |
| Rừng Quái | `m_vanh_dai_tay` | **Bìa Rừng** | 176×128 | Dải đệm ngay sau tường rào: trạm gác, bãi săn đầu tiên |
| Rừng Quái | `m_ba_vi` | **Rừng Sâu** | 192×144 | Rừng chính, quái mạnh hơn |
| Rừng Quái | `m_mo_lo_thien` | **Mỏ Bỏ Hoang** | 128×112 | Mỏ lộ thiên cũ trong rừng |
| Rừng Quái | `m_mo_ngam` | **Hầm Mỏ** | 112×80 | Hầm dưới mỏ, B1 mở, B2 đóng |
| Rừng Quái | `m_tram_thien_mach` | **Trạm Thiên Mạch** | 96×80 | Trạm nghiên cứu dưới núi, boss chương 1 |
| Tinh Linh | `m_an_gioi` *(mới)* | **Ẩn Giới — Vườn Cây Mẹ** | 128×96 | Nhà và điểm bắt đầu của Tinh Linh |

Để sau chương 1: `m_thang_long` (thành phố lớn) và `m_cang_dong_bac` (cảng). Không dựng trong chương 1.

### Cổng nối

| Cổng | Nối | Trạng thái |
| --- | --- | --- |
| **Cổng Ẩn Giới** *(mới)* | Làng Hồ Lặng ↔ Ẩn Giới | Mở. Tinh Linh qua tự do; Người qua được sau hồi A |
| `ln_lang_vanh` — **Chốt Tường Rào** | Làng Hồ Lặng ↔ Bìa Rừng | Mở |
| `ln_lang_nha` — **Cửa nhà** | Làng Hồ Lặng ↔ Nhà riêng | Mở; mỗi người vào bản nhà của mình |
| `ln_vanh_rung` | Bìa Rừng ↔ Rừng Sâu | Mở |
| `ln_vanh_mo` | Bìa Rừng ↔ Mỏ Bỏ Hoang | Mở |
| `ln_mo_rung` | Mỏ Bỏ Hoang ↔ Rừng Sâu | Mở |
| `ln_mo_ngam` | Mỏ Bỏ Hoang ↔ Hầm Mỏ | Mở |
| `ln_ngam_rung` | Hầm Mỏ ↔ Rừng Sâu | 🔒 Hồi D |
| `ln_rung_tram` | Rừng Sâu ↔ Trạm Thiên Mạch | 🔒 Hồi E |

Không dùng trong chương 1: `ln_lang_thang` (khóa), `ln_thang_cang`. Cao tốc gãy ở mép đông Bìa Rừng chỉ là cảnh nền, không có cổng.

### Ghép map thành một thế giới

Các map ngoài trời là những mảnh **nằm cạnh nhau trên cùng một mặt đất**. Đi ra mép nào của map này thì vào đúng mép đối diện của map bên cạnh, ở cùng vị trí ngang hoặc dọc. Tọa độ thế giới (ô) của góc trên-trái mỗi map, lấy Bìa Rừng làm gốc:

| Map | Góc trên-trái | Giáp với |
| --- | --- | --- |
| Bìa Rừng | (0, 0) | bắc: Rừng Sâu · nam: Làng (qua tường) · tây: Mỏ |
| Làng Hồ Lặng | (−5, 128) | bắc: Bìa Rừng · đông: Thăng Long (sau chương 1) |
| Rừng Sâu | (2, −144) | nam: Bìa Rừng · tây: Mỏ (phần trên) |
| Mỏ Bỏ Hoang | (−128, −59) | đông: Bìa Rừng (phần dưới) và Rừng Sâu (phần trên) |
| Thăng Long | (155, 134) | tây: Làng |

Hầm Mỏ nằm **dưới** Mỏ, Trạm nằm **dưới** núi Rừng Sâu, Ẩn Giới và Nhà riêng **không nằm trên mặt đất**; các map này không cần khớp mép.

**Những thứ phải khớp qua mép map:**

| Chỗ nối | Bên này | Bên kia |
| --- | --- | --- |
| Sông | Rừng Sâu ra mép nam ở x 148 | Bìa Rừng vào mép bắc ở x 150 (cùng một điểm trên thế giới) |
| Sông | Bìa Rừng ra mép nam ở x 143 | Làng vào mép bắc ở x 148 |
| Tường rào | Làng: dải y 0–4, Chốt ở x 92 | Bìa Rừng: dải y 124–128 (mặt ngoài), Chốt ở x 87 |
| Lối mòn | Bìa Rừng mép bắc x 95 | Rừng Sâu mép nam x 93 |
| Đường xe cũ | Bìa Rừng mép tây y 31 | Mỏ mép đông y 90 |
| Đường núi | Mỏ mép đông y 25 | Rừng Sâu mép tây y 110 |
| Đường nhựa | Làng mép đông y 66 (trạm buýt) | Thăng Long mép tây y 60 |

## 4. Khu Người — Làng Hồ Lặng (`m_lang_que`)

- **Vai trò:** nhà của Người; nơi trồng, câu, thiền, mua bán, gặp người chơi khác. Cả hai role đều quay về đây.
- **Cảm giác:** chiều vàng ở một làng ven hồ đã lớn thành thị trấn nhỏ. Yên, ấm, có tiếng xe máy xa.
- **Các phần trong map:**

| Phần | Có gì |
| --- | --- |
| **Xóm nhà** | **Cửa nhà** dẫn vào nhà riêng của người chơi, nhà bà Nora, ngõ nhỏ, sân phơi |
| **Hồ Lặng** | 12 bến câu (sàn gỗ bờ bắc, cầu gỗ chìa ra hồ, bờ đông), quán nước dưới gốc cây lớn |
| **Ruộng vườn** | Ruộng, nhà kính nhỏ (trang trí, NPC làm đồng); luống của người chơi ở nhà riêng |
| **Thị trấn** | Chợ phiên, cửa hàng tiện lợi, xưởng rèn của Doran, trạm xe buýt, **Trạm Viện** (văn phòng của Viện Linh học, nơi Tiến sĩ Theo làm việc) |
| **Đồi miếu** | Miếu cổ, sân thiền 8 chỗ ngồi |
| **Quảng trường Cổng** | **Cổng Ẩn Giới** ở giữa, chốt gác của Người, góc chợ Tinh Linh (nấm, mật, bùa lá) |
| **Tường rào** | Tường bê tông + lưới, **Chốt Tường Rào** có đèn pha, biển "Phía sau là khu nguy hiểm" |

- **Hiện đại:** nhà mái bằng xen nhà mái ngói, xe máy và xe đạp, cột điện, trạm xe buýt, máy bán hàng tự động, màn LED báo linh năng.
- **Linh năng (mức 0):** thảo dược phát sáng ban đêm, cá lấp lánh khi "trời linh"; quanh Cổng Ẩn Giới có hạt sáng trôi.
- **Hoạt động:** trồng, câu, thiền/Hấp Linh, mua bán.
- **Quái:** không có.
- **Truyện:** hồi A (cả hai role), hồi B, kết chương.

### Cổng Ẩn Giới

- Một vòng sáng ngọc lam lơ lửng giữa quảng trường, cao gấp đôi nhà, lặng lẽ xoay. Người dựng quanh nó khung thép, rào và chốt gác; Tinh Linh treo lồng đèn lá lên chính khung thép đó.
- Ban ngày: chợ họp quanh cổng, trẻ con đứng xem Tinh Linh đi ra.
- Ban đêm: cổng sáng hơn, chiếu bóng lên các mái nhà xung quanh.
- Theo nhịp 47 giây, cổng **chớp nhẹ một lần**. Đây là manh mối đầu tiên của cốt truyện, người chơi thấy được ngay từ phút đầu.

## 5. Khu Rừng Quái

Đi qua Chốt Tường Rào là sang. Rừng là thế giới của động vật đã bị linh năng làm biến dị; không ai sống ở đây.

### 5.1 Bìa Rừng — `m_vanh_dai_tay`

- **Vai trò:** dải đệm ngay sau tường rào; bãi săn đầu tiên.
- **Cảm giác:** cỏ cao, gió, cây thưa, nắng gắt.
- **Có gì:** trạm gác của Đội Tuần Tra, tháp cảm biến, lều thợ săn (điểm dừng an toàn), đường mòn cũ, xe tải bỏ dở có dây leo, ruộng hoang.
- **Linh năng (mức 1):** sương có ánh, vết cày của Lợn Gai.
- **Quái:** Gà Rừng Mào Sét, Lợn Gai, Nhện Tơ Điện; Lợn Gai Đầu Đàn.
- **Truyện:** hồi B.

### 5.2 Mỏ Bỏ Hoang và Hầm Mỏ — `m_mo_lo_thien`, `m_mo_ngam`

- **Vai trò:** mỏ cũ bị bỏ sau Linh Chấn; chú Bram vẫn quay lại khai thác các vỉa nông. Đào khoáng ở 8 vỉa trên và 6 vỉa B1.
- **Cảm giác:** bậc đá đỏ, máy xúc gỉ, lán thợ cũ; dưới hầm tối, ẩm, đèn mỏ vàng, tiếng "ù" xa.
- **Có gì:** lán thợ (điểm dừng an toàn), giếng thang máy, đường ray goòng, cửa sắt B2 bị hàn, hầm cũ nối Rừng Sâu (khóa).
- **Linh năng:** mức 1 ở mỏ trên; mức 2 dưới hầm, vân linh mạch chạy thẳng tắp về phía bắc (hướng Trạm); mảnh vật liệu tím đầu tiên.
- **Quái:** Nhện Tơ Điện, Rết Đá (mỏ trên); Dơi Vân Quặng, Nhện Mẹ (hầm).
- **Truyện:** hồi C.

### 5.3 Rừng Sâu — `m_ba_vi`

- **Vai trò:** rừng chính, quái mạnh hơn, đường tới Trạm.
- **Cảm giác:** rừng ẩm nhiều tầng, sương dày, suối đá, rất ít ánh sáng.
- **Có gì:** trạm cứu hộ bỏ hoang của bố Rin, bậc leo núi, thác, gốc cây lớn có dấu Tinh Linh để lại (điểm dừng an toàn), cửa kín dẫn xuống Trạm.
- **Linh năng (mức 2, hoang):** dương xỉ khổng lồ, nấm phát quang, đá có vân sáng.
- **Quái:** Sói Rêu, Rắn Sương, Khỉ Vách Đá, Cú Đêm Linh (đêm); Khỉ Đầu Đàn.
- **Lối mòn ẩn:** đường tắt qua bụi rậm và rễ cây, chỉ đi được khi Tinh Linh Hóa Thú.
- **Truyện:** hồi D.

### 5.4 Trạm Thiên Mạch — `m_tram_thien_mach`

- **Vai trò:** trạm nghiên cứu dưới núi của dự án **Thiên Mạch** (Viện Linh học), boss chương 1. **Map chung 30 người** như các map khác: đánh boss là trận đông người.
- **Cảm giác:** im lặng, đèn chập chờn, nhịp xung đều. Bị niêm phong từ sáng sau Linh Chấn: cửa hàn, giấy niêm phong, bàn ghế còn nguyên như người ta bỏ đi vội.
- **Có gì:** hành lang bê tông, phòng máy có **vách sập** thông ra hang núi (lối dị thú vào), kho bị chuột gặm, phòng lưu trữ có logo cũ của Viện và hồ sơ "rơi từ trời", phòng lồng giam trống (từ **trước** Linh Chấn), Phòng Lõi với cỗ máy đã xé màn che, lõi vẫn chạy.
- **Lõi trong thế giới chung:** luôn chạy. Khi một người chơi chọn **Ngắt lõi**, cả kênh thấy lõi tắt và nhịp 47 giây ngừng trong **47 phút**; sau đó lõi tự khởi động lại và gấu quay về. Lựa chọn Ngắt/Sao dữ liệu chỉ ghi vào câu chuyện của riêng người đó ([02](02-story.md) hồi E).
- **Linh năng (mức 3 + X):** vật liệu tím hình lục giác, không có bóng, nhấp nháy theo nhịp 47 giây.
- **Quái:** Chuột Tím (đàn đông, xung 47 giây); boss Thủ Lĩnh Mạch Gãy (gấu núi nhiễm linh năng nặng).
- **Truyện:** hồi E.

## 6. Khu Tinh Linh — Ẩn Giới (`m_an_gioi`, map mới)

- **Vai trò:** nhà và điểm bắt đầu của Tinh Linh; Người vào thăm được sau hồi A.
- **Cảm giác:** như bước vào một bức tranh: trời màu ngọc nhạt, mây trôi thấp, nắng xiên qua tán lá trong suốt, tiếng chuông gió. Không có máy móc, không có góc vuông.
- **Các phần trong map:**

| Phần | Có gì |
| --- | --- |
| **Bến Cổng** | Phía Ẩn Giới của Cổng: vòng sáng đứng trên mặt hồ phẳng; nhìn qua thấy mờ mờ mái nhà của làng |
| **Vườn Cây Mẹ** | Cây Mẹ khổng lồ ở giữa, nhà Tinh Linh trong hốc cây, trên cành, dưới rễ |
| **Suối Hấp Linh** | Suối có hạt sáng trôi lên; điểm Hấp Linh chính của Tinh Linh, bến câu cá linh |
| **Vườn nấm** | Luống nấm và cây Ẩn Giới; Tinh Linh trồng ở đây |
| **Vòng Đá** | Nơi Hội Rễ họp |
| **Rìa Phai** | Mép của mảnh Ẩn Giới: cảnh vật mờ dần thành sương trắng, lá héo theo nhịp. Cho thấy Ẩn Giới đang co lại |

- **Linh năng (mức 2, dịu):** đom đóm, lá phát sáng, hạt sáng trôi; ấm và chậm.
- **Dấu vết thế giới Người:** vài món đồ rơi qua cổng (xe đạp, biển báo, máy bán hàng) mà Tinh Linh nhặt về làm đồ trang trí.
- **Hoạt động:** Hấp Linh, trồng nấm, câu cá linh.
- **Quái:** không có.
- **Truyện:** hồi A (Tinh Linh), các cảnh với Lão Hồ và Hội Rễ.

## 7. Đường đi của mỗi role trong chương 1

| Role | Bắt đầu | Đi đâu tiếp |
| --- | --- | --- |
| Người | Nhà trong Làng Hồ Lặng | Làng → (Cổng Ẩn Giới, thăm) → Chốt Tường Rào → Bìa Rừng → Mỏ → Rừng Sâu → Trạm |
| Tinh Linh | Vườn Cây Mẹ, Ẩn Giới | Ẩn Giới → Cổng → Làng Hồ Lặng → Chốt Tường Rào → Bìa Rừng → Mỏ → Rừng Sâu → Trạm |

Làng Hồ Lặng là trung tâm: mọi chuyến đi xuất phát và quay về đây.

Bố cục chi tiết từng map (tọa độ, khu, đường đi): [05](05-map-layouts.md). Quái: [06](06-monsters.md).

## 8. Quy tắc dựng map

- **Mép map phải khớp** với map bên cạnh theo bảng "Ghép map thành một thế giới" ở §3: sông, đường, tường, rừng chảy liền qua mép; dải 3–4 ô sát mép dùng chung bản vẽ rồi cắt cho hai phía ([04](04-map-art.md) §3.3). Kiểm tra bằng cách ghép các map theo tọa độ thế giới.

- **Nền vẽ theo lớp, không ghép toàn bộ từ tile.** Mỗi map quản lý bằng 5 nhóm: nền, nước, vật thể/nhân vật, phần che phía trên, hiệu ứng/ánh sáng; tile chỉ dùng cho mặt đường, sàn, luống lặp. Chi tiết ở [04](04-map-art.md) §11.
- **Mỗi map có các điểm nhấn linh năng, không bắt mọi khung hình có hiệu ứng.** Dữ liệu linh năng (mạch, điểm tụ, hạt, linh vật, vết Linh Chấn) theo [04](04-map-art.md) §6; điểm tụ trùng điểm thiền.
- Mỗi vật tương tác (cây, ghế, cửa, bến câu, luống, cổng) là **đối tượng riêng** có ID, trạng thái và điểm đứng.
- Collision và đường đi lưu thành dữ liệu riêng, đồng bộ với `server/data/life_world.json`.
- **Lối mòn ẩn** trong Rừng Sâu là lớp collision riêng: chặn khi đi bộ, mở khi Hóa Thú.
- Y-sort theo chân vật thể; đi sau nhà hoặc tán cây thì phần che mờ đi.
- Map lớn chia phần; làm xong và duyệt một phần rồi mới mở rộng.
- Mỗi cổng có biển báo và điểm đến an toàn ở phía bên kia.

## 9. Thứ tự dựng

| Bước | Map | Phạm vi |
| --- | --- | --- |
| 1 | Làng Hồ Lặng | Một góc: nhà, vườn, hồ, Quảng trường Cổng (art test) |
| 2 | Ẩn Giới | Bến Cổng + Vườn Cây Mẹ |
| 3 | Làng Hồ Lặng | Toàn làng, gồm thị trấn và tường rào |
| 4 | Bìa Rừng | Từ chốt tới trạm gác và bãi Lợn Gai |
| 5 | Mỏ Bỏ Hoang, Hầm Mỏ B1 | |
| 6 | Rừng Sâu | |
| 7 | Trạm Thiên Mạch | |
| 8 | Ẩn Giới | Phần còn lại |

## 10. Bảng kiểm khi duyệt một map

- [ ] Biết map thuộc khu nào (Người / Rừng Quái / Tinh Linh) và dùng đúng palette.
- [ ] Khu Người: có ít nhất 3 chi tiết đời sống hiện đại. Khu Tinh Linh: không có máy móc trừ đồ rơi qua cổng.
- [ ] Khu Rừng Quái: thấy rõ vì sao không ai sống ở đây.
- [ ] Quanh Cổng Ẩn Giới có dấu vết của cả hai thế giới.
- [ ] Linh năng đúng mức, không lạm dụng ngọc lam/tím.
- [ ] Mọi cổng đi được hai chiều.
- [ ] Mọi điểm hoạt động có chỗ đứng hợp lệ, không bị che.
- [ ] Nội dung chính đi tới được bằng cả hai role.
- [ ] Ảnh chụp ở zoom mặc định nhìn thấy mặt đất ≥ 55% khung hình.
