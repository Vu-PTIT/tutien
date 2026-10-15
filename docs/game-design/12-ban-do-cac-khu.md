# 12 — Bản đồ từng khu vực

> Danh sách map của cả lục địa theo sáu khu vực ([03](03-world-and-maps.md) §1). **Người sống ở Vành Biển ngoài cùng; Tinh Linh sống ở vùng giao thoa trong đất liền; ở giữa là đất hoang của dị thú.** Cả lục địa mở từ đầu (§1.1). Rìa khu Mộc đã có dữ liệu và bố cục chi tiết ([03](03-world-and-maps.md) §3–6, [05](05-map-layouts.md)); các khu khác mới ở mức **danh sách map + vai trò + nối nhau**, chưa có tọa độ. Quái từng map ở [06](06-monsters.md).

## 1. Nguyên tắc chung

### 1.1 Thế giới mở: mỗi khu là một lát cắt từ biển vào trong

```text
  BIỂN ≈≈≈ │ VÀNH BIỂN │  ĐẤT HOANG         │ LÕI KHU  │ GIAO THOA        │ TÂM ẨN
           │ (Người)   │  (dị thú, 1 hệ)    │ (boss)   │ (Tinh Linh, 2 hệ)│
  linh năng:   mức 0       mức 1 → 2            mức 3      mức 2–3
  nguy hiểm:  yên        bậc 1 → 2            bậc 3      yên quanh làng; bậc 4 ở hiểm địa
```

**Cả lục địa mở từ đầu, kể cả Tâm Ẩn.** Không có màn, không có khu nào bị khóa theo cấp hay theo truyện; **Tâm Ẩn không bị khóa**. Cái giữ người chơi lại là **độ nguy hiểm**: đất hoang dữ dần khi đi sâu, lõi khu có boss, hiểm địa có thời tiết dữ và quái rối, và Tâm Ẩn có áp lực Căn Nguyên bậc 5 ([06](06-monsters.md) §2.3). Người chơi Người thường đi từ thị trấn ven biển vào, Tinh Linh xuất phát từ Tâm Ẩn (khu giao thoa trung tâm) tỏa ra các vùng giao thoa, nhưng ai cũng có thể đi bất cứ đâu nếu dám.

### 1.2 Các loại map

| Loại | Lớp | Là gì | Có quái |
| --- | --- | --- | --- |
| **Thị trấn** | Vành Biển | Cảng, làng chài, thành của Người; an toàn; hồi sức, mua bán, nhận hợp đồng; có bến thuyền | Không |
| **Hoang** | Đất hoang | Đất mang hệ trội của khu | Có, quái một hệ |
| **Hầm** | Đất hoang | Dungeon trong hang/núi/thân cây; có đầu đàn | Có |
| **Lõi** | Giữa khu | Linh năng thuần và đặc nhất của khu; boss vùng | Có, boss |
| **Giao thoa** | Giao thoa | Đất hai hệ quanh làng Tinh Linh; đường nội địa sang khu bên cạnh | Có, quái hai hệ, ít và hiền hơn |
| **Làng Tinh Linh** | Giao thoa | Nơi Tinh Linh ở | Không |
| **Hiểm địa** | Giao thoa tương khắc | Thời tiết dữ, quái "rối", không ai ở | Có, bậc nguy hiểm 4 |

Mỗi khu có **ít nhất**: 1 thị trấn ven biển, 2 hoang, 1 hầm, 1 lõi, 1 giao thoa. Làng Tinh Linh nằm ở giao thoa **tương sinh**, nên một khu có thể có 0–2 làng tùy giao thoa của nó.

### 1.3 Kích thước và ID

- Kích thước theo chuẩn mới [11](11-ti-le-map.md) (tối đa 30 người/kênh, tốc độ 4 ô/giây):
  - **Thị trấn:** lớn (Kinh thành) **128×96**, chuẩn (Làng, Cảng) **96×72**, nhỏ (Trạm dừng) **80×64**.
  - **Làng Tinh Linh & Tâm Ẩn:** **80×60** (gọn gàng, ấm cúng).
  - **Đất hoang (bãi săn):** lớn **128×96**, vừa (bìa rừng, sườn núi, giao thoa) **112×80**.
  - **Hầm mỏ / Dungeon:** vừa **80×64**, nhỏ / tầng sâu **72×48**.
  - **Lõi boss:** **80×80** (riêng Đài Thiên Mạch **64×48**).
  - **Nhà riêng:** **28×20** (1 người, 12 luống riêng).
- **ID map đánh số, không mang tên nơi:** `m_k<khu>_<số>`, vd. `m_k3_04`. Khu đánh số theo thứ tự mạch truyện gợi ý: **k1 Mộc, k2 Thủy, k3 Kim, k4 Phong, k5 Thổ, k6 Hỏa**, Tâm Ẩn là k0. Map trong một khu đánh số 01, 02... theo thứ tự thêm vào. Tên nơi chỉ nằm ở tên hiển thị, nên đổi tên nơi không phải đổi ID.
- Cổng: `ln_<map A>_<map B>` bỏ tiền tố `m_`, vd. `ln_k1_01_k1_02`. Điểm hoạt động: `<map>_<loại>_<số>`, vd. `k1_01_fish_03`, `k1_03_ore_05`, `k1_02_med_06`. Luống nhà riêng: `nha_plot_<số>`.
- Mỗi map ghi **hệ linh năng** và **mức** (0 Vành Biển → 3 lõi) để vẽ lớp linh năng ([04](04-map-art.md) §6).

### 1.4 Bậc nguy hiểm và mạch truyện gợi ý

Mỗi khu có đủ bậc nguy hiểm, từ dễ ở ven tới khó ở lõi ([06](06-monsters.md) §2.3):

| Bậc | Ở đâu trong mỗi khu | Cấp quái |
| --- | --- | --- |
| Yên | Thị trấn ven biển, làng Tinh Linh | Không có quái |
| 1 — Ven | Đất hoang sát Vành Biển; giao thoa tương sinh quanh làng Tinh Linh | 1–4 |
| 2 — Sâu | Đất hoang sâu, hầm, dungeon gần bờ | 4–8 |
| 3 — Lõi | Lõi khu, boss vùng | 9–12 |
| 4 — Hiểm | Hiểm địa (Đồng Bão Cát, Bờ Hơi Sôi) | 13–15 |
| 5 | Tâm Ẩn | 16+ |

Mạch truyện chính ([02](02-story.md) §9) là **chuỗi nhiệm vụ có thứ tự gợi ý**, đi vòng quanh lục địa theo các khu nằm cạnh nhau. Người chơi có thể bỏ ngang, sang khu khác, làm nhiệm vụ phụ, rồi quay lại sau:

| Mạch | Khu | Thị trấn ven biển | Làng Tinh Linh (giao thoa) |
| --- | --- | --- | --- |
| 1 | Mộc (nam) | Làng Hồ Lặng | Vườn Cây Mẹ (Đầm Sen) |
| 2 | Thủy (tây) | Thành Cảng Lam Loan | (Vườn Cây Mẹ, từ phía Thủy) |
| 3 | Kim (tây bắc) | Ngân Thành | Làng Sếu Bạc (Suối Bạc) |
| 4 | Phong (bắc) | Trạm Chim | Tổ Vách (Đèo Gió Bạc) |
| 5 | Thổ (đông bắc) | Làng Ruộng Bậc | Mỏm Ngân (Núi Vân Vàng) |
| 6 | Hỏa (đông) | Thị trấn Lò Rèn | Lò Tro (Đất Tro), Tổ Lửa (Rừng Lửa) |
| Cuối | Tâm Ẩn | — | — |

Mạch 6 kết thúc ở Rừng Lửa (Hỏa – Mộc), đưa người chơi **vòng về khu Mộc**. Mỗi mạch khuyên đi từ ngoài vào trong (thị trấn → đất hoang → lõi → làng Tinh Linh), nhưng boss lõi và hầm đều có mặt sẵn; ai đủ sức thì hạ trước cũng được, truyện sẽ nhận ra.

## 2. Đường đi trên lục địa

```text
 ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ đường biển ven bờ (Người) ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
   ⚓ Ngân Thành ─────────────── ⚓ Trạm Chim ─────────────── ⚓ Làng Ruộng Bậc
   │ Sườn Quặng, Vách Bạc       │ Thảo Nguyên Gió            │ Đồng Cỏ, Hẻm Vực
   │ Hang Tinh Thể, Tháp Cổ     │ Vách Mây                   │ Tổ Kiến Đá
   │ HANG KIM SỐNG (lõi)        │ ĐỈNH MÂY (lõi)             │ VỰC ĐÁ SỐNG (lõi)
   │        ╲                   │        ╱      ╲            │        ╱
   │   ◆ Suối Bạc ───────── ◇ Đèo Gió Bạc ──── ✖ Đồng Bão Cát ── ◆ Núi Vân Vàng
   │   (Làng Sếu Bạc)          (Tổ Vách)                          (Mỏm Ngân)
   │        │                                                        │
   │        │              ( T Â M   Ẩ N )   vòng giao thoa            │
   │        │                (Tinh Linh)                             │
   │   ◆ Đầm Sen ─────────────────── ◆ Rừng Lửa ─────────────── ◆ Đất Tro
   │   (Vườn Cây Mẹ)                 (Tổ Lửa)                    (Lò Tro)
   │        ╱       ╲                    ╲                          ╲
   │ Ngàn Hồ  HỒ XOÁY (lõi)   RỪNG SÂU · Đài     LÕI RỪNG    Sa Mạc Đỏ, Đồng Sét
   │ Hang Triều               Mỏ, Hầm Mỏ          (bậc 3)      Hầm Nham
   │ Quần Đảo Ngàn Đảo        Bìa Rừng │                       MIỆNG NÚI LỬA (lõi)
   ⚓ Thành Cảng Lam Loan ──── ⚓ Làng Hồ Lặng ★ ── ⚓ Kinh thành ── ⚓ Lò Rèn ── ✖ Bờ Hơi Sôi
 ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈

   Ngoài: vòng thị trấn ven biển (Người, đi thuyền / đường cái ven bờ)
   Trong: vòng giao thoa quanh Tâm Ẩn (đất Tinh Linh, đi bộ)
   Giữa:  đất hoang mỗi khu (dị thú), nối thị trấn với giao thoa
   Tâm Ẩn: khu giao thoa trung tâm cội nguồn, mở tự do từ đầu, nơi spawn của role Tinh Linh
```

Quy tắc nối:
- **Vòng ngoài (biển):** mọi thị trấn ven biển nối với hai thị trấn bên cạnh bằng thuyền hoặc đường cái ven bờ. Tuyến thuyền chạy sẵn; đi thuyền tới đâu cũng được.
- **Vòng trong (giao thoa):** mỗi giao thoa nối với hai giao thoa bên cạnh. Ai cũng đi được. Người không có Tinh Linh trong đội và chưa có dấu Giao Ước của làng vùng đó thì bị Tinh Linh dè chừng: không được nghỉ trong làng, giá cao, ít nhiệm vụ.
- **Nan hoa (đất hoang):** trong mỗi khu, đường đi từ thị trấn ven biển qua hoang, hầm, lõi rồi tới giao thoa. Đây là nơi phần lớn hoạt động diễn ra.
- **Lối riêng của Tinh Linh** (như Lối Rễ ở khu Mộc) nối thẳng làng Tinh Linh với thị trấn ven biển, bỏ qua đất hoang. Hiếm, mỗi khu tối đa một, và là đặc ân chứ không phải đường chính.

## 3. Khu Mộc — Rừng Thiên Mộc (nam) — mạch 1

**Vành Biển:** làng chài và kinh thành; cát trắng, rừng dừa nước, đầm lợ.
**Đất hoang:** rừng cổ nhiều tầng, càng vào trong cây càng to, tới mức thân cây là vách núi và tán cây là trời.
**Giao thoa:** Đầm Sen (với Thủy) ở phía tây bắc; Rừng Lửa (với Hỏa) ở phía đông bắc.

| ID | Tên | Loại | Hệ (mức) | Kích thước | Bậc | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `m_k1_01` | Làng Hồ Lặng | Thị trấn | Mộc (0) | 96×72 | Yên | Làng chài ven biển; nhà người chơi Người |
| `m_nha` | Nhà riêng | Nhà | — | 28×20 | Yên | Mỗi người một bản |
| `m_k1_08` | Kinh thành | Thị trấn | Mộc (0) | 128×96 | Yên | Kinh đô ven biển phía đông làng; trụ sở Hội Khai Phá, Tháp Học |
| `m_k1_02` | Bìa Rừng | Hoang | Mộc (1) | 112×80 | 1 | Ngay sau tường làng; bãi thi tập sự |
| `m_k1_03` | Mỏ Bỏ Hoang | Hoang | Mộc, vỉa Kim (1) | 80×64 | 2 | Mỏ trên nhánh linh mạch |
| `m_k1_04` | Hầm Mỏ | Hầm | Kim (2) | 72×48 | 2 | Nhện Mẹ |
| `m_k1_05` | Rừng Sâu | Hoang | Mộc (2) | 128×96 | 2 | Qua ranh Giao Ước |
| `m_k1_06` | Đài Thiên Mạch | Hầm | Mộc + Tím (3) | 64×48 | 2 | Dungeon gần bờ, boss Thủ Lĩnh Mạch Gãy |
| `m_k1_07` | Vườn Cây Mẹ | Làng Tinh Linh | Mộc + Thủy (2) | 80×60 | Yên | Giao thoa Đầm Sen; nhà người chơi Tinh Linh; nối làng bằng Lối Rễ |
| `m_k1_09` | Rừng Tầng Cao | Hoang | Mộc (3) | 128×96 | 3 | Đi trên cành và rễ, hai tầng (mặt đất / tán) |
| `m_k1_10` | Gốc Cổ Thụ | Hầm | Mộc (3) | 80×64 | 3 | Dungeon bên trong thân một cây rỗng, đi vòng lên |
| `m_k1_11` | Lõi Rừng | Lõi | Mộc (3) | 80×80 | 3 | Boss vùng Mộc |

Mạch 1 chỉ dẫn người chơi qua rìa đất hoang Mộc. Lõi Mộc nằm ngay sau Rừng Sâu và vào được từ đầu, nhưng là bậc 3: người mới nhìn thấy cây cao như núi từ xa, như một lời hứa ("có ngày sẽ vào được trong kia").

## 4. Khu Thủy — Vùng Ngàn Hồ (tây) — mạch 2

**Vành Biển:** thành cảng lớn nhất lục địa trên vịnh nước ngọc, nhà sàn, cầu tre; nơi giải đấu Khai Phá Giả.
**Đất hoang:** quần đảo đá vôi sát bờ, rồi vào trong là hàng trăm hồ lớn nối nhau bằng sông và đầm, sương sớm dày; giữa khu là Hồ Xoáy.
**Giao thoa:** Đầm Sen (với Mộc) ở phía đông nam; Suối Bạc (với Kim) ở phía bắc.

| ID | Tên | Loại | Hệ (mức) | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `m_k2_01` | Thành Cảng Lam Loan | Thị trấn | Thủy (0) | 96×72 | Bến tàu, chợ cá, chi hội Khai Phá lớn. Đi thuyền từ Làng Hồ Lặng |
| `m_k2_02` | Đấu Trường Cảng | Thị trấn (sự kiện) | Thủy (0) | 64×48 | Giải đấu của mạch 2, tổ chức định kỳ; bản riêng theo trận |
| `m_k2_03` | Quần Đảo Ngàn Đảo | Hoang | Thủy (1) | 128×96 | Đảo sát bờ; triều lên thì mất lối, triều xuống thì lộ bãi |
| `m_k2_04` | Ngàn Hồ | Hoang | Thủy (2) | 128×96 | Hồ nối hồ; đi bằng thuyền nhỏ và cầu ván |
| `m_k2_05` | Hang Triều | Hầm | Thủy (2) | 72×48 | Nước trong hang lên xuống theo giờ thật, mở/đóng đường |
| `m_k2_06` | Hồ Xoáy | Lõi | Thủy (3) | 80×80 | Hồ lớn giữa khu, xoáy nước ở tâm; đứng trên đảo cỏ nổi và xác thuyền; boss vùng Thủy |
| `m_k2_07` | Đầm Sen Ngập | Giao thoa Thủy – Mộc | Thủy + Mộc (2) | 112×80 | Rừng ngập quanh Vườn Cây Mẹ; người chơi tới Vườn Cây Mẹ **bằng đường bộ** lần đầu, từ phía Thủy |

**Đặc trưng chơi:** thủy triều theo đồng hồ đời sống; thuyền nhỏ giữa các hồ, đảo; câu cá biển và cá hồ.

## 5. Khu Kim — Dãy Ngân Sơn (tây bắc) — mạch 3

**Vành Biển:** thị trấn mỏ giàu nhất lục địa trên vách biển, cảng chở quặng, lò đúc, chi nhánh lớn của Tháp Học.
**Đất hoang:** sườn quặng lộ thiên, vách bạc, hang tinh thể phản chiếu ánh sáng. Lạnh, sắc; tiếng kim loại ngân khi gió qua. Một tháp cổ bỏ hoang từ Thời Khai Phá.
**Giao thoa:** Suối Bạc (với Thủy) ở phía nam; Đèo Gió Bạc (với Phong) ở phía đông.

| ID | Tên | Loại | Hệ (mức) | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `m_k3_01` | Ngân Thành | Thị trấn | Kim (0) | 96×72 | Cảng quặng, lò đúc, Tháp Học chi nhánh |
| `m_k3_02` | Sườn Quặng | Hoang | Kim (1) | 112×80 | Mỏ lộ thiên của Người ngay sau thành, lấn dần vào trong |
| `m_k3_03` | Vách Bạc | Hoang | Kim (2) | 112×80 | Leo núi theo gờ; vách phản chiếu làm lộ vị trí |
| `m_k3_04` | Hang Tinh Thể | Hầm | Kim (2) | 80×64 | Ánh sáng bẻ qua tinh thể mở lối; tối thì mất đường |
| `m_k3_05` | Tháp Học Cổ | Hầm (cốt truyện) | Kim + Ẩn (2) | 64×64 | Tháp từ Thời Khai Phá; manh mối đầu về bí mật của Tháp Học |
| `m_k3_06` | Hang Kim Loại Sống | Lõi | Kim (3) | 80×80 | Kim loại mọc như cây; boss vùng Kim |
| `m_k3_07` | Suối Bạc | Giao thoa Thủy – Kim | Thủy + Kim (2) | 112×80 | Suối nước bạc; nối vòng trong sang Đầm Sen |
| `m_k3_08` | Làng Sếu Bạc | Làng Tinh Linh | Thủy + Kim (2) | 80×60 | Nhà vỏ ốc bạc trên suối; Tinh Linh sếu, rùa, cá chép |

## 6. Khu Phong — Cao Nguyên Vân Phong (bắc) — mạch 4

**Vành Biển:** vách biển dựng đứng; Trạm Chim treo trên vách, cối gió đá, chuồng chim đưa thư, đường dốc xuống bến nhỏ.
**Đất hoang:** cao nguyên trên mây, gió không ngừng, cỏ rạp một chiều, vách núi cắm vào mây; càng vào trong càng cao.
**Giao thoa:** Đèo Gió Bạc (với Kim) ở phía tây, trung tính; Đồng Bão Cát (với Thổ) ở phía đông, tương khắc.

| ID | Tên | Loại | Hệ (mức) | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `m_k4_01` | Trạm Chim | Thị trấn | Phong (0) | 80×64 | Cối gió, chim đưa thư, quán cho Khai Phá Giả |
| `m_k4_02` | Thảo Nguyên Gió | Hoang | Phong (1) | 128×96 | Luồng gió đẩy người chơi; xuôi gió nhanh, ngược gió chậm |
| `m_k4_03` | Vách Mây | Hầm (ngoài trời) | Phong (2) | 80×112 | Leo dọc vách, cầu dây, luồng gió nâng |
| `m_k4_04` | Đỉnh Mây | Lõi | Phong (3) | 80×80 | Hố đá tím cổ; boss vùng Phong; nhìn thấy Tâm Ẩn từ trên cao |
| `m_k4_05` | Đèo Gió Bạc | Giao thoa Kim – Phong (◇) | Kim + Phong (2) | 112×80 | Vách kim loại "hát" khi gió qua |
| `m_k4_06` | Tổ Vách | Làng Tinh Linh (du mục) | Kim + Phong (2) | 80×60 | Làng treo trên vách đèo, dời chỗ theo mùa gió |
| `m_k4_07` | Đồng Bão Cát ✖ | Hiểm địa Phong – Thổ | Phong ⊣ Thổ (3) | 128×96 | Đường nội địa sang khu Thổ; bão cát che tầm nhìn theo đợt |

## 7. Khu Thổ — Cao Nguyên Hoàng Thổ (đông bắc) — mạch 5

**Vành Biển:** làng ruộng bậc thang đổ xuống biển, đông dân; Người ở đây đói đất, đang lấn vào trong.
**Đất hoang:** cao nguyên cỏ vàng bất tận, hẻm vực nhiều tầng đá, đá đứng như người. Gió khô, trời cao.
**Giao thoa:** Đồng Bão Cát (với Phong) ở phía tây; Núi Vân Vàng (với Kim, sát Tâm Ẩn) ở sâu bên trong; Đất Tro (với Hỏa) ở phía nam.

Mạch 5 kể **xung đột Người – Tinh Linh**: Người ven biển khai hoang ngược vào trong, tới tận Núi Vân Vàng để đào vàng, qua ranh Giao Ước.

| ID | Tên | Loại | Hệ (mức) | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `m_k5_01` | Làng Ruộng Bậc | Thị trấn | Thổ (0) | 96×72 | Ruộng bậc xuống biển; cột mốc Giao Ước bị nhổ |
| `m_k5_02` | Đồng Cỏ Cao Nguyên | Hoang | Thổ (1) | 128×96 | Đàn thú lớn di cư qua map theo giờ |
| `m_k5_03` | Hẻm Vực | Hoang | Thổ (2) | 112×80 | Ba tầng đá, cầu treo, lở đá |
| `m_k5_04` | Tổ Kiến Đá | Hầm | Thổ (2) | 72×48 | Mê cung đường hầm do kiến đào |
| `m_k5_05` | Vực Đá Sống | Lõi | Thổ (3) | 80×80 | Đá tự dịch chuyển; boss vùng Thổ |
| `m_k5_06` | Núi Vân Vàng | Giao thoa Thổ – Kim | Thổ + Kim (3) | 112×80 | Núi quặng vàng sát Tâm Ẩn; trại đào vàng lậu của Người |
| `m_k5_07` | Mỏm Ngân | Làng Tinh Linh | Thổ + Kim (3) | 80×60 | Làng gần Tâm Ẩn nhất; Tinh Linh gấu, tê tê; bị trại đào vàng uy hiếp |

## 8. Khu Hỏa — Đất Xích Nham (đông) — mạch 6

**Vành Biển:** thị trấn lò rèn nổi tiếng trên bờ đá đen, suối nóng đổ ra biển. Xa hơn về phía bắc là Bờ Hơi Sôi, nơi nham chảy xuống biển; không ai ở.
**Đất hoang:** sa mạc đá đỏ, đồng trống có sét đánh, rồi núi lửa ở giữa khu. Trời đỏ cam, đêm thấy sông nham sáng.
**Giao thoa:** Đất Tro (với Thổ) ở phía bắc; Rừng Lửa (với Mộc) ở phía tây.

| ID | Tên | Loại | Hệ (mức) | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `m_k6_01` | Thị trấn Lò Rèn | Thị trấn | Hỏa (0) | 80×64 | Lò rèn lớn, suối nóng, chi hội Khai Phá |
| `m_k6_02` | Sa Mạc Đỏ | Hoang | Hỏa (1) | 128×96 | Đá đỏ, cồn cát, ảo ảnh; nắng trưa mất máu chậm nếu không có bóng mát |
| `m_k6_03` | Đồng Sét | Hoang | Hỏa (2) | 112×80 | Sét đánh theo điểm báo trước trên mặt đất |
| `m_k6_04` | Hầm Nham Thạch | Hầm | Hỏa (2) | 72×48 | Sông nham dâng hạ theo nhịp, đá nổi làm cầu |
| `m_k6_05` | Miệng Núi Lửa | Lõi | Hỏa (3) | 80×80 | Boss vùng Hỏa |
| `m_k6_06` | Bờ Hơi Sôi ✖ | Hiểm địa Hỏa – Thủy | Hỏa ⊣ Thủy (3) | 112×80 | Trên bờ biển; tới bằng thuyền từ Lò Rèn; tùy chọn |
| `m_k6_07` | Đất Tro | Giao thoa Thổ – Hỏa | Thổ + Hỏa (2) | 112×80 | Ruộng hoang trên tro núi lửa, suối nóng; nối vòng trong sang Núi Vân Vàng |
| `m_k6_08` | Lò Tro | Làng Tinh Linh | Thổ + Hỏa (2) | 80×60 | Nhà đá nung giữa suối nóng; Tinh Linh kỳ đà, lửng, trâu |
| `m_k6_09` | Rừng Lửa | Giao thoa Hỏa – Mộc | Hỏa + Mộc (2) | 112×80 | Cây lá đỏ cháy âm ỉ; nối vòng trong về Đầm Sen, **khép vòng lục địa** |
| `m_k6_10` | Tổ Lửa | Làng Tinh Linh | Hỏa + Mộc (2) | 80×60 | Nhà trong thân cây cháy không tàn; Tinh Linh chim lửa, sói đỏ |

## 9. Tâm Ẩn (giữa) — Khu Giao Thoa Trung Tâm

| ID map | Tên nơi | Loại | Hệ linh năng | Kích thước | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `m_k0_01` | Tâm Ẩn | Giao thoa trung tâm | Ẩn (cả sáu hệ hòa hợp) | 80×60 | Nơi khởi sinh/spawn của role Tinh Linh; Đài Khởi Sinh (safe zone); mở tự do từ đầu |

Đặc điểm và thiết kế đã chốt:
- **Khu giao thoa cội nguồn:** Nơi sáu dòng linh năng Kim, Mộc, Thủy, Hỏa, Thổ, Phong gặp nhau ở trung tâm lục địa và hòa lại thành linh năng Ẩn nguyên thủy phát sáng ngọc lam.
- **Điểm spawn của Tinh Linh:** Khi người chơi chọn role Tinh Linh, họ sẽ spawn tại **Đài Khởi Sinh** (`k0_01.safe.dai_khoi_sinh`) ở trung tâm bản đồ. Đây là khu vực an toàn (safe zone) không có quái vật.
- **KHÔNG BỊ KHÓA:** Tâm Ẩn **mở hoàn toàn từ đầu**, không có cổng khóa, không yêu cầu xong mạch chính. Người chơi Người có thể tìm đường vào sâu, Tinh Linh có thể đi từ tâm tỏa ra ngoài theo các nhánh giao thoa.
- **Độ nguy hiểm:** Bậc 5 (khu vực ngoài Đài Khởi Sinh). Dị thú mang thuộc tính Căn Nguyên cổ xưa rất mạnh.
- **Kết nối:** Nối trực tiếp với vòng giao thoa nội địa (Đầm Sen, Suối Bạc, Đèo Gió Bạc, Núi Vân Vàng, Đất Tro, Rừng Lửa) và có lối thông/quan sát từ lõi các khu (như từ Đài Thiên Mạch `m_k1_06`).
- **Ngoại cảnh:** Suối linh năng lơ lửng, hoa văn sáu hệ hòa quyện thành ngọc lam trôi chậm, không khí ấm áp và tràn ngập sinh khí cội nguồn.

## 10. Tổng số map

| Khu | Thị trấn | Hoang | Hầm | Lõi | Giao thoa / hiểm địa | Làng Tinh Linh | Tổng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mộc | 2 (+ nhà) | 4 | 3 | 1 | — | 1 | 11 + nhà |
| Thủy | 2 | 2 | 1 | 1 | 1 | — | 7 |
| Kim | 1 | 2 | 2 | 1 | 1 | 1 | 8 |
| Phong | 1 | 1 | 1 | 1 | 2 | 1 | 7 |
| Thổ | 1 | 2 | 1 | 1 | 1 | 1 | 7 |
| Hỏa | 1 | 2 | 1 | 1 | 3 | 2 | 10 |
| **Tổng** | 8 | 13 | 9 | 6 | 8 | 6 | **50 + nhà** |

Thứ tự **dựng** (không phải thứ tự chơi): rìa khu Mộc (8 map + nhà) trước, các khu khác sau.

## 11. Việc backend phát sinh (ghi lại, chưa làm)

- Thêm trường `region` (`k1`…`k6`, `k0`), `layer` (`vanh_bien`/`hoang`/`loi`/`giao_thoa`) và `kind` (thi_tran/hoang/ham/loi/giao_thoa/lang_tinh_linh/hiem_dia) cho mỗi map trong `life_world.json`.
- Thêm tên hiển thị cho từng map trong `life_world.json` (hiện map chỉ có ID): `m_k1_01` Làng Hồ Lặng, `m_k1_08` Kinh thành, `m_k2_01` Thành Cảng Lam Loan...
- Đi thuyền giữa thị trấn ven biển: một loại cổng mới (bến thuyền) có màn chuyển cảnh.
- Thái độ làng Tinh Linh với Người (dè chừng hoặc tin) theo dấu Giao Ước và việc có Tinh Linh trong đội; không chặn cổng.
- Thủy triều (Thủy), nắng nóng và sét (Hỏa), gió đẩy (Phong): cần hệ thống thời tiết theo map, chung với biến thể quái ở [06](06-monsters.md) §6.
