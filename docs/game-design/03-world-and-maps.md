# 03 — Thế giới và map

## 1. Ba khu

Thế giới chương 1 chia làm **ba khu**:

```text
                     ┌──────────────────────────┐
                     │   KHU TINH LINH          │
                     │   (Ẩn Giới, Cây Mẹ ★)     │
                     └────────────▲─────────────┘
                                  │  Cổng Ẩn Giới
                                  │  (đặt trong khu Người)
┌─────────────────────────────────┴──────┐  tường  ┌──────────────────────────────┐
│   KHU NGƯỜI                            │  rào /  │   KHU RỪNG QUÁI              │
│   Làng Hồ Lặng + thị trấn              │ ◄─cổng─►│   bìa rừng → rừng sâu         │
│   (nhà, vườn, hồ, chợ, Trạm Viện)       │  chốt   │   mỏ bỏ hoang, Trạm Thiên Mạch │
└────────────────────────────────────────┘         └──────────────────────────────┘
```

| Khu | Là gì | Cảm giác | Ai sống | Có quái |
| --- | --- | --- | --- | --- |
| **Khu Người** | Làng ven hồ và thị trấn nhỏ, nơi người dân sinh sống | Ấm, đông, đời thường | Người, một ít Tinh Linh xuống buôn bán | Không |
| **Khu Rừng Quái** | Khu rừng và núi phía bên kia tường rào, nơi động vật bị nhiễm linh năng | Hoang, gió, linh năng rõ | Không ai; chỉ thợ săn và đội tuần tra ghé qua | Có |
| **Khu Tinh Linh** | Một mảnh **Ẩn Giới**, vào qua cổng ở giữa khu Người | Dịu, sáng, lạ, như trong mơ | Tinh Linh | Không |

Ý tưởng chính:
- **Khu Người** và **Khu Rừng Quái** nằm cạnh nhau, ngăn bằng một **tường rào có chốt gác**. Đi bộ qua chốt là sang rừng.
- **Khu Tinh Linh** không nằm trên cùng mặt đất. Đêm Linh Chấn, một vết rách của màn che mở ra **ngay trong làng**; người ta dựng quanh nó một cái cổng có canh gác, gọi là **Cổng Ẩn Giới**. Bước qua cổng là sang thế giới của Tinh Linh.
- Vì cổng nằm giữa làng, Người và Tinh Linh **buộc phải sống cạnh nhau**. Đây là nguồn của mọi căng thẳng và mọi tình bạn trong chương 1.

## 2. Quy luật hình ảnh

- **Khu Người:** ấm, nhiều chi tiết đời sống hiện đại. Càng gần tường rào, càng nhiều rào chắn, biển cảnh báo, đèn pha.
- **Khu Rừng Quái:** càng vào sâu, màu càng nhạt, tối và lạnh; tương phản mạnh; linh năng rối. Gần tường còn dấu vết Người (đường mòn, trạm cũ), sâu bên trong thì không.
- **Khu Tinh Linh:** màu trong, sáng dịu, đường cong; không có máy móc. Linh năng mềm, ấm, trôi chậm.
- **Quanh Cổng Ẩn Giới** (trong khu Người): hai thế giới trộn vào nhau. Cỏ quanh cổng có lá trong như ở Ẩn Giới, đèn đường bị dây leo phát sáng quấn lên, chốt gác của Người đặt cạnh lồng đèn lá của Tinh Linh.

## 3. Map và ID kỹ thuật

Chương 1 chỉ dùng các map dưới đây. Giữ ID đã có trong `server/data/life_world.json`; thêm một map mới cho Ẩn Giới.

| Khu | ID | Tên hiển thị | Vai trò |
| --- | --- | --- | --- |
| Người | `m_lang_que` | **Làng Hồ Lặng** | Toàn bộ khu Người: làng, hồ, thị trấn, Cổng Ẩn Giới |
| Rừng Quái | `m_vanh_dai_tay` | **Bìa Rừng** | Dải đệm ngay sau tường rào: trạm gác, bãi săn đầu tiên |
| Rừng Quái | `m_ba_vi` | **Rừng Sâu** | Rừng chính, quái mạnh hơn |
| Rừng Quái | `m_mo_lo_thien` | **Mỏ Bỏ Hoang** | Mỏ lộ thiên cũ trong rừng |
| Rừng Quái | `m_mo_ngam` | **Hầm Mỏ** | Hầm dưới mỏ, B1 mở, B2 đóng |
| Rừng Quái | `m_tram_thien_mach` | **Trạm Thiên Mạch** | Trạm nghiên cứu dưới núi, boss chương 1 |
| Tinh Linh | `m_an_gioi` *(mới)* | **Ẩn Giới — Vườn Cây Mẹ** | Nhà và điểm bắt đầu của Tinh Linh |

Để sau chương 1: `m_thang_long` (thành phố lớn) và `m_cang_dong_bac` (cảng). Không dựng trong chương 1.

### Cổng nối

| Cổng | Nối | Trạng thái |
| --- | --- | --- |
| **Cổng Ẩn Giới** *(mới)* | Làng Hồ Lặng ↔ Ẩn Giới | Mở. Tinh Linh qua tự do; Người qua được sau hồi A |
| `ln_lang_vanh` — **Chốt Tường Rào** | Làng Hồ Lặng ↔ Bìa Rừng | Mở |
| `ln_vanh_rung` | Bìa Rừng ↔ Rừng Sâu | Mở |
| `ln_vanh_mo` | Bìa Rừng ↔ Mỏ Bỏ Hoang | Mở |
| `ln_mo_rung` | Mỏ Bỏ Hoang ↔ Rừng Sâu | Mở |
| `ln_mo_ngam` | Mỏ Bỏ Hoang ↔ Hầm Mỏ | Mở |
| `ln_ngam_rung` | Hầm Mỏ ↔ Rừng Sâu | 🔒 Hồi D |
| `ln_rung_tram` | Rừng Sâu ↔ Trạm Thiên Mạch | 🔒 Hồi E |

Không dùng trong chương 1: `ln_lang_thang`, `ln_vanh_thang`, `ln_thang_cang`.

## 4. Khu Người — Làng Hồ Lặng (`m_lang_que`)

- **Vai trò:** nhà của Người; nơi trồng, câu, thiền, mua bán, gặp người chơi khác. Cả hai role đều quay về đây.
- **Cảm giác:** chiều vàng ở một làng ven hồ đã lớn thành thị trấn nhỏ. Yên, ấm, có tiếng xe máy xa.
- **Các phần trong map:**

| Phần | Có gì |
| --- | --- |
| **Xóm nhà** | Nhà người chơi + vườn, nhà bà Nora, ngõ nhỏ, sân phơi |
| **Hồ Lặng** | 4 bến câu, cầu gỗ, quán nước dưới gốc cây lớn |
| **Ruộng vườn** | 12 luống thảo dược, ruộng, nhà kính nhỏ |
| **Thị trấn** | Chợ phiên, cửa hàng tiện lợi, xưởng rèn của Doran, trạm xe buýt, **Trạm Viện** (văn phòng của Viện Linh học, nơi Tiến sĩ Theo làm việc) |
| **Đồi miếu** | Miếu cổ, sân thiền |
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
- **Quái:** Lợn Gai, Nhện Tơ Điện ở rìa.
- **Truyện:** hồi B.

### 5.2 Mỏ Bỏ Hoang và Hầm Mỏ — `m_mo_lo_thien`, `m_mo_ngam`

- **Vai trò:** mỏ cũ bị bỏ sau Linh Chấn; chú Bram vẫn quay lại khai thác các vỉa nông. Đào khoáng ở 2 vỉa trên và 2 vỉa B1.
- **Cảm giác:** bậc đá đỏ, máy xúc gỉ, lán thợ cũ; dưới hầm tối, ẩm, đèn mỏ vàng, tiếng "ù" xa.
- **Có gì:** lán thợ (điểm dừng an toàn), giếng thang máy, đường ray goòng, cửa sắt B2 bị hàn, hầm cũ nối Rừng Sâu (khóa).
- **Linh năng:** mức 1 ở mỏ trên; mức 2 dưới hầm, vân linh mạch chạy thẳng tắp; mảnh vật liệu tím đầu tiên.
- **Quái:** Nhện Tơ Điện.
- **Truyện:** hồi C.

### 5.3 Rừng Sâu — `m_ba_vi`

- **Vai trò:** rừng chính, quái mạnh hơn, đường tới Trạm.
- **Cảm giác:** rừng ẩm nhiều tầng, sương dày, suối đá, rất ít ánh sáng.
- **Có gì:** trạm cứu hộ bỏ hoang của bố Rin, bậc leo núi, thác, gốc cây lớn có dấu Tinh Linh để lại (điểm dừng an toàn), cửa kín dẫn xuống Trạm.
- **Linh năng (mức 2, hoang):** dương xỉ khổng lồ, nấm phát quang, đá có vân sáng.
- **Quái:** Khỉ Vách Đá, Rắn Sương.
- **Lối mòn ẩn:** đường tắt qua bụi rậm và rễ cây, chỉ đi được khi Tinh Linh Hóa Thú.
- **Truyện:** hồi D.

### 5.4 Trạm Thiên Mạch — `m_tram_thien_mach`

- **Vai trò:** trạm nghiên cứu dưới núi, boss chương 1.
- **Cảm giác:** im lặng, đèn chập chờn, nhịp xung đều.
- **Có gì:** hành lang bê tông, phòng máy, phòng lưu trữ có logo cũ của Viện, phòng có lồng giam trống, cỗ máy đã xé màn che với lõi vẫn chạy.
- **Linh năng (mức 3 + X):** vật liệu tím hình lục giác, không có bóng, nhấp nháy theo nhịp 47 giây.
- **Quái:** Thủ Lĩnh Mạch Gãy (gấu núi nhiễm linh năng nặng).
- **Truyện:** hồi E.

## 6. Khu Tinh Linh — Ẩn Giới (`m_an_gioi`, map mới)

- **Vai trò:** nhà và điểm bắt đầu của Tinh Linh; Người vào thăm được sau hồi A.
- **Cảm giác:** như bước vào một bức tranh: trời màu ngọc nhạt, mây trôi thấp, nắng xiên qua tán lá trong suốt, tiếng chuông gió. Không có máy móc, không có góc vuông.
- **Các phần trong map:**

| Phần | Có gì |
| --- | --- |
| **Bến Cổng** | Phía Ẩn Giới của Cổng: vòng sáng đứng trên mặt hồ phẳng; nhìn qua thấy mờ mờ mái nhà của làng |
| **Vườn Cây Mẹ** | Cây Mẹ khổng lồ ở giữa, nhà Tinh Linh trong hốc cây, trên cành, dưới rễ |
| **Suối Hấp Linh** | Suối có hạt sáng trôi lên; điểm tu luyện chính của Tinh Linh, bến câu cá linh |
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

## 8. Quy tắc dựng map

- **Nền vẽ theo lớp, không ghép toàn bộ từ tile.** Tile chỉ dùng cho mặt đường, sàn, luống lặp.
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
