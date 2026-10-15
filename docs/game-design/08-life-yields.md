# 08 — Sản lượng hoạt động đời sống

Trồng, câu, đào được **gì**, ở **đâu**, và dùng vào việc gì. Cách thao tác và cảm giác ở [01](01-gameplay.md) §5.2; vị linh năng ở [07](07-power-system.md) §2; vị trí điểm ở [05](05-map-layouts.md).

Số liệu ở đây là **đơn vị thiết kế** để chơi thử, chưa cân bằng. **Giá bán để trống**, chờ thiết kế kinh tế.

## 1. Nguyên tắc

- **Nơi chốn quyết định sản lượng.** Mỗi bến, vỉa, luống có bảng riêng theo map và mức linh năng ([04](04-map-art.md) §6). Đi xa hơn, vào chỗ linh năng dày hơn thì gặp thứ mới; không cần nâng cấp dụng cụ.
- **Hiếm là biến thể, không phải thứ phải cày.** Không món nào chặn tiến trình chính, trừ một mốc truyện (Mảnh Tím, §4.2) có bảo đảm.
- **Trực tiếp và tự động cho cùng bảng, cùng tỉ lệ.** Thao tác trực tiếp chỉ khác cảm giác. Không minigame bắt buộc.
- **Mỗi lượt vẫn cho hạt linh tinh của đúng vị:** câu cho Thủy, đào cho Kim, thu hoạch cho Thổ + Mộc. Lượng ít, như backend hiện có.
- **Cùng một bảng cho Người và Tinh Linh** ở cùng một điểm. Khác nhau ở chỗ mỗi role vào được điểm nào trước.

## 2. Bậc độ hiếm

| Bậc | Nhận biết trên map / trong túi | Ý nghĩa |
| --- | --- | --- |
| **Thường** | Màu tự nhiên, không phát sáng | Nguyên liệu hằng ngày: chế tạo, bán, nấu |
| **Linh** | Viền sáng mờ **màu hệ** của nó, ban đêm phát sáng nhẹ | Có linh năng bên trong; **Hấp** được (§6) để lấy hạt linh tinh |
| **Hiếm** | Màu hệ sáng rõ, có hạt trôi quanh icon | Rất ít; dành cho chế tạo đặc biệt về sau |
| **Lạ** | **Tím** lục giác, không bóng, nhấp nháy 47 giây | Đá lạ từ nơi thứ ba. Ở rìa khu Mộc chỉ có một món (Mảnh Tím) |

Theo luật màu của [04](04-map-art.md) §4: màu sáu hệ cho linh năng, ngọc lam chỉ cho Ẩn, tím chỉ cho đá lạ.

## 3. Câu cá

Mỗi lượt 30 giây, tốn 1 mồi, ra **1 thứ**. Mồi không dùng hết được trả lại (đã có backend).

### 3.1 Đầm Hồ Lặng — `m_k1_01`, 12 bến `k1_01_fish_01…12` (linh năng mức 0)

| Thứ câu được | Bậc | Trời thường | Đêm Linh Triều |
| --- | --- | --- | --- |
| Cá chép | Thường | 40% | 35% |
| Cá rô | Thường | 45% | 37% |
| Rong đầm | Thường | 8% | 8% |
| Đồ rơi (chai gốm, ủng cũ, chìa khóa) | Thường | 5% | 5% |
| **Cá Lấp Lánh** | Linh | 2% | 15% |

- Đêm Linh Triều là thời tiết ở [04](04-map-art.md) §5; cá lấp lánh khớp mô tả linh năng của làng ở [03](03-world-and-maps.md) §4.
- Đồ rơi chủ yếu để có chuyện cười. Một vài món (chìa khóa) là móc nối nhiệm vụ làng về sau.

### 3.2 Suối Hấp Linh — `m_k1_07`, 6 bến câu linh (mức 2, map mới)

| Thứ câu được | Bậc | Tỉ lệ |
| --- | --- | --- |
| Cá Ánh (cá trong suốt, thấy xương sáng) | Linh | 50% |
| Cá Lá (thân dẹt như chiếc lá) | Linh | 35% |
| Hạt Sương Đọng | Linh | 12% |
| **Vảy Ngọc** | Hiếm | 3% |

- Tinh Linh câu được ngay. Người cũng tới được từ đầu; lời mời hồi B là dẫn truyện, không khóa map. Quyền dùng dịch vụ có thể theo quan hệ với NPC như thiết kế gameplay.

## 4. Đào khoáng

Mỗi lượt 45 giây, cần cuốc chim. Quặng ra **2 đơn vị**/lượt; vật phẩm Linh trở lên ra **1**.

### 4.1 Mỏ Bỏ Hoang — `m_k1_03`, 8 vỉa `k1_03_ore_01…08` ở Hố Tây (mức 1)

| Thứ đào được | Bậc | Tỉ lệ | Số lượng |
| --- | --- | --- | --- |
| Quặng sắt | Thường | 70% | 2 |
| Quặng đồng | Thường | 25% | 2 |
| Đá Vân Sáng | Linh | 5% | 1 |

### 4.2 Hầm Mỏ B1 — `m_k1_04`, 6 vỉa `k1_04_ore_01…06` ở Vỉa Đông (mức 2)

| Thứ đào được | Bậc | Tỉ lệ | Số lượng |
| --- | --- | --- | --- |
| Quặng sắt | Thường | 50% | 2 |
| Quặng đồng | Thường | 30% | 2 |
| Đá Vân Sáng | Linh | 15% | 1 |
| **Tinh Thể Linh Mạch** | Hiếm | 4% | 1 |
| **Mảnh Tím** | Lạ | 1% | 1 |

- **Mảnh Tím là mốc truyện hồi C** ("mảnh đá tím đầu tiên", [03](03-world-and-maps.md) §5.2). Mảnh đầu tiên được **bảo đảm** trong 40 lượt đào đầu ở B1 của mỗi tài khoản. Sau đó vẫn rơi 1%, dùng cho truyện/chế tạo về sau.
- Tầng B2 chưa dựng; chưa có bảng.

## 5. Trồng cây

Mỗi luống trồng 1 hạt + 1 nước, thu 1 lần. Thu hoạch cho Thổ 2 + Mộc 1 hạt linh tinh (đã có backend).

Mỗi lần thu hoạch còn có:
- **25%** ra thêm 1 hạt cùng loại.
- **15%** một cây trong số thu được là bản **"Dạ Quang"** (bậc Linh). Thu hoạch ban đêm thì tỉ lệ này thành 30%, khớp "thảo dược phát sáng ban đêm" ở [03](03-world-and-maps.md) §4.

### 5.1 Vườn nhà riêng — `m_nha`, 12 luống riêng từng tài khoản

Mỗi người chơi có một bản map nhà riêng, vào qua cửa ở Xóm nhà của làng ([10](10-kich-thuoc-map-online.md) §5.4). Ruộng ở làng chỉ để trang trí.

| Cây | Thời gian | Thu được | Bản Linh |
| --- | --- | --- | --- |
| Cam Lộ | 20 phút | 4 Cam Lộ | Cam Lộ Dạ Quang |
| Tĩnh Tâm | 45 phút | 4 Tĩnh Tâm | Tĩnh Tâm Dạ Quang |
| Ích Khí | 60 phút | 4 Ích Khí | Ích Khí Dạ Quang |

Giữ nguyên 3 cây, thời gian và sản lượng như backend hiện có.

### 5.2 Vườn nấm — `m_k1_07` (map mới), đề xuất 6 luống riêng từng tài khoản

| Cây | Thời gian | Thu được | Bậc |
| --- | --- | --- | --- |
| Nấm Đèn | 30 phút | 3 | Linh |
| Nấm Mật | 90 phút | 3 | Linh |
| Lá Trong (cây giao thoa) | 4 giờ | 2 | Linh; 5% ra thêm 1 **Hạt Cây Mẹ** (Hiếm) |

- Mọi thứ ở Vườn Cây Mẹ đã là bậc Linh, nên không có bản "Dạ Quang".
- Hạt nấm mua ở góc chợ Tinh Linh (Sân Hội Khai Phá) hoặc tự ra lại khi thu hoạch.

## 6. Công dụng

Thứ **Linh** trở lên đều **Hấp** được: ngồi thiền với món đó trong túi, nhân vật hút linh năng của nó vào Nội Giới. Món đó mất đi, đổi lại một ít hạt linh **tinh** đúng vị. Đây là cách cho đời sống "góp thẳng vào sức mạnh" ([07](07-power-system.md) §10) mà vẫn chậm.

| Vật phẩm | Vị khi Hấp | Công dụng khác |
| --- | --- | --- |
| Cá chép, Cá rô | — | Bán; nấu ăn (để sau) |
| Rong đầm, Đồ rơi | — | Bán rẻ; đồ rơi mở chuyện làng |
| Cá Lấp Lánh | Thủy | Bán; thứ trẻ con trong làng xin |
| Cá Ánh, Cá Lá | Thủy | Món ăn Tinh Linh; quà cho NPC Vườn Cây Mẹ |
| Hạt Sương Đọng | Thủy | Thay nước tưới, rút 25% thời gian một luống |
| Vảy Ngọc | Thủy | Chế tạo đặc biệt (để sau) |
| Quặng sắt | — | Rèn Kiếm Sắt (đã có: 6 quặng sắt + 2 trúc) |
| Quặng đồng | — | Chế tạo sau (dây, đèn mỏ) |
| Đá Vân Sáng | Kim | Bùa Hộ Thân; Hấp |
| Tinh Thể Linh Mạch | Kim | Chế tạo đặc biệt (để sau) |
| Mảnh Tím | — (không Hấp được) | Đưa Học giả Theo ở Trạm Tháp Học: mở truyện hồi C |
| Cam Lộ / Tĩnh Tâm / Ích Khí | — | Dược: Thuốc Hồi Sức, Bùa Thoát Thân (đã có: 2 Tĩnh Tâm + 1 trúc), Bột Ích Khí |
| Thảo dược Dạ Quang | Thổ / Mộc | Dược mạnh hơn (để sau); Hấp |
| Nấm Đèn, Nấm Mật | Mộc | Món ăn, chợ Tinh Linh; Hấp |
| Lá Trong | Mộc | Bùa lá của Tinh Linh (để sau) |
| Hạt Cây Mẹ | Mộc | Câu chuyện Hội Rễ (để sau) |

**Lượng Hấp cụ thể** cân bằng cùng [07](07-power-system.md). Đề xuất ban đầu: Linh = 1 hạt tinh, Hiếm = 4 hạt tinh.

## 7. Để sau / câu hỏi mở

- **Tên vật phẩm:** backend đang có "Cá rô", "Quặng sắt", "Quặng đồng". Đề xuất đổi tên hiển thị thành **Cá rô**, **Quặng sắt**, **Quặng đồng** cho dễ hiểu; ID giữ nguyên.
- **Người có trồng được ở Vườn nấm không?** Đề xuất: được, sau khi một Tinh Linh (người chơi hoặc NPC) cho mượn luống. Thuộc phần xã hội.
- Cấp dụng cụ, nghề, mùa vụ: **chưa làm**.
- Thời tiết ngoài Đêm Linh Triều (mưa làm cá ăn nhiều hơn…): để sau.
- Giá mua/bán và giới hạn túi: chờ kinh tế.

## 8. Đối chiếu với backend hiện tại

| Mục | Đã có trong code | Cần làm khi code |
| --- | --- | --- |
| 3 cây làng, 25% ra hạt, bản Dạ Quang, đêm 30% | ✅ `life_garden.ts`, `life_loot.ts` | — |
| Câu đầm Hồ Lặng theo bảng, Linh Triều | ✅ `life_loot.ts` | — |
| Đào Mỏ Bỏ Hoang + Hầm B1 theo bảng, bảo đảm Mảnh Tím | ✅ `life_loot.ts` | — |
| Đồng hồ ngày/đêm + Linh Triều phía server | ✅ `lifeClockView` (ngày game 2 giờ, Linh Triều ~1/8 cửa sổ 30 phút) | Chỉnh nhịp khi dựng client |
| Hạt linh tinh mỗi hoạt động | ✅ Thủy 1/4 lượt câu, Kim 1/3 lượt đào, thu hoạch Thổ 2 + Mộc 1 | Giữ nguyên |
| Suối Hấp Linh, Vườn nấm | ❌ Map `m_k1_07` chưa có | Thêm map, 6 bến, 6 luống nấm riêng, 3 nấm/cây mới |
| Hấp vật phẩm Linh | ✅ RPC `inner_world_absorb_item` | — |
| Vật phẩm mới | ✅ 9 ID, catalog v4 | 7 ID của Vườn Cây Mẹ làm cùng map `m_k1_07`; Hạt Sương Đọng tưới nhanh làm sau |
