# 06 — Quái (dị thú)

Dị thú là **động vật của thế giới Người bị nhiễm linh năng**. Không phải Tinh Linh, không phải quỷ. Mọi quái chỉ xuất hiện trong **Khu Rừng Quái**; Khu Người và Ẩn Giới không có quái. Vị trí từng khu ở [05](05-map-layouts.md).

Số liệu ở đây là **đơn vị thiết kế**, chưa phải chỉ số backend:
- **Máu** = số **nhát đánh thường** của người chơi mới (Nội Giới hình dạng Đảo, vũ khí đầu) để hạ.
- **Sát thương** = % máu tối đa của người chơi mới cho mỗi đòn trúng.
- **Tốc độ** = so với tốc độ đi bộ của người chơi (1,0).

Tỉ lệ rơi đồ và giá trị để sau, khi thiết kế kinh tế.

## 1. Danh sách

| # | Quái | Gốc | Khu | Cấp | Loại |
| --- | --- | --- | --- | --- | --- |
| 1 | Gà Rừng Mào Sét | Gà rừng | Bìa Rừng | 1 | Thường |
| 2 | Lợn Gai | Heo rừng | Bìa Rừng | 1 | Thường |
| 3 | Nhện Tơ Điện | Nhện | Bìa Rừng, Mỏ, Hầm | 1–2 | Thường |
| 4 | Rết Đá | Rết | Mỏ Bỏ Hoang | 2 | Thường |
| 5 | Dơi Vân Quặng | Dơi | Hầm Mỏ | 2 | Thường |
| 6 | Sói Rêu | Chó sói | Rừng Sâu | 3 | Thường |
| 7 | Rắn Sương | Rắn | Rừng Sâu | 3 | Thường |
| 8 | Khỉ Vách Đá | Khỉ | Rừng Sâu | 3 | Thường |
| 9 | Cú Đêm Linh | Cú | Rừng Sâu (đêm) | 3 | Thường |
| 10 | Chuột Tím | Chuột | Trạm Thiên Mạch | 4 | Thường |
| E1 | Lợn Gai Đầu Đàn | Heo rừng | Bìa Rừng | 1 | Đầu đàn (hồi B) |
| E2 | Nhện Mẹ | Nhện | Hầm Mỏ | 2 | Đầu đàn (hồi C) |
| E3 | Khỉ Đầu Đàn | Khỉ | Rừng Sâu | 3 | Đầu đàn (hồi D) |
| B1 | Thủ Lĩnh Mạch Gãy | Gấu núi | Trạm Thiên Mạch | 4 | Boss (hồi E) |

Mỗi quái thường **dạy đúng một điều**; quái đầu đàn kiểm tra điều đó; boss kiểm tra tất cả.

## 2. Hành vi chung

### 2.1 Vòng trạng thái

```text
Lang thang ──thấy người chơi──► Cảnh giác ──► Báo đòn ──► Ra đòn ──► Hở
    ▲                                            ▲                    │
    │                                            └────────────────────┘
    └── Về lãnh địa ◄── người chơi ra khỏi lãnh địa / quái còn ≤ 20% máu (một số loài bỏ chạy)
```

- **Lang thang:** đi chậm quanh tâm lãnh địa, ăn, ngủ (animation idle riêng).
- **Cảnh giác:** dừng, quay về phía người chơi, dấu "!" nhỏ; 0,5 giây trước khi tấn công. Người chơi lùi ra ngoài tầm phát hiện thì quái quên.
- **Báo đòn:** luôn có **ánh ngọc lam** + âm thanh riêng. Thời gian báo đòn dài hơn ở quái cấp thấp.
- **Hở:** cửa sổ người chơi đánh trả an toàn.
- **Về lãnh địa:** hồi dần máu, không đánh nữa.

### 2.2 Tầm phát hiện theo role

| Người chơi | Tầm phát hiện |
| --- | --- |
| Người | 100% |
| Tinh Linh | 60% |
| Tinh Linh đang Hóa Thú | 30%; không phát hiện được nếu đứng yên trong bụi |
| Đang dùng Máy Quét / Linh Cảm | +20% (phát sáng nhẹ) |

### 2.3 Phân cấp

| Cấp | Khu | Báo đòn | Đánh trúng mất | Máu (nhát) |
| --- | --- | --- | --- | --- |
| 1 | Bìa Rừng | 0,8–1,0 giây | 8–12% | 3–5 |
| 2 | Mỏ, Hầm | 0,6–0,8 giây | 10–15% | 5–7 |
| 3 | Rừng Sâu | 0,5–0,7 giây | 12–18% | 6–9 |
| 4 | Trạm | 0,4–0,6 giây | 15–20% | 6–10 |

Nội Giới người chơi càng lớn thì đánh càng mạnh và chịu đòn càng tốt, nên quái cấp cũ dễ dần đi; quái không tự mạnh lên theo người chơi.

Hạ dị thú cho nhiều linh năng nhưng **đục**, mang **hệ** theo loài (xem [07](07-power-system.md) §2). Hệ chính của người chơi **khắc** hệ của loài thì đòn mạnh hơn 25%, bị loài khắc thì yếu đi 15%.

| Loài | Hệ | Vì sao | Khắc được bằng |
| --- | --- | --- | --- |
| Gà Rừng Mào Sét | Hỏa + Phong | Mào phóng sét, bay lượn | Thủy (khắc Hỏa), Thổ (khắc Phong) |
| Lợn Gai | Thổ | Ủi đất, da như đá | Mộc |
| Nhện Tơ Điện | Mộc + Hỏa | Tổ trong cây, tơ có điện | Kim, Phong, Thủy |
| Rết Đá | Thổ | Vỏ đá | Mộc |
| Dơi Vân Quặng | Kim + Phong | Sống trong vỉa quặng, bay | Hỏa, Thổ |
| Nhện Mẹ | Mộc + Hỏa | Như Nhện Tơ Điện | Kim, Phong, Thủy |
| Sói Rêu | Mộc | Lông mọc rêu | Kim, Phong |
| Rắn Sương | Thủy | Thân hóa sương | Thổ |
| Khỉ Vách Đá | Thổ + Phong | Leo vách, nhảy xa | Mộc, Thổ |
| Cú Đêm Linh | Phong | Bay đêm | Thổ |
| Chuột Tím | Kim (tạm, sau là Tím) | Gặm cáp, kim loại trong Trạm | Hỏa |
| Thủ Lĩnh Mạch Gãy | Kim + Thổ (tạm, kèm Tím) | Lưng hóa tinh thể | Hỏa, Mộc | Mỗi dị thú cũng có Nội Giới riêng, mọc loạn: đầu đàn có Nội Giới to hơn, boss có vết nứt tím.

## 3. Hồ sơ từng quái

### 1. Gà Rừng Mào Sét — cấp 1

- **Hình:** gà rừng to cỡ chó nhỏ, mào và đuôi có tia sáng ngọc lam nhấp nháy.
- **Nhóm:** 4 con, ruộng hoang Bìa Rừng.
- **Hành vi:** chạy vòng quanh người chơi; **mổ lao** ngắn (lùi người, xù lông báo đòn 0,9 giây). Còn 1 con thì bỏ chạy.
- **Dạy:** quan sát nhiều mục tiêu, không bị vây.
- **Máu / sát thương / tốc độ:** 2 nhát / 6% / 1,3.
- **Rơi:** lông mào sét, trứng.

### 2. Lợn Gai — cấp 1

- **Hình:** heo rừng lưng mọc gai đá có vân sáng; to gần bằng người.
- **Nhóm:** 2 con, đồng cỏ Bìa Rừng.
- **Hành vi:** **gầm** (cúi đầu, chân cào đất, 1,0 giây) → **lao thẳng** 4 ô → **đứng thở** 1,2 giây. Lao trúng cây/xe tải thì choáng thêm 1 giây.
- **Dạy:** né ngang, đánh khi nó thở; dẫn nó lao vào vật cản.
- **Máu / sát thương / tốc độ:** 4 nhát / 12% / 0,8 (khi lao 3,0).
- **Rơi:** da gai, nanh.

### 3. Nhện Tơ Điện — cấp 1–2

- **Hình:** nhện chân dài cỡ con mèo, bụng có vạch sáng; tơ phát sáng xanh lam.
- **Nhóm:** 3 con; Bìa Rừng (giữa các xe tải), Mỏ (bãi máy), Hầm (Hầm Tây).
- **Hành vi:** giăng **lưới tơ** trên đất (vùng 2×2 ô, tồn tại 8 giây, đi vào bị chậm 50%); **cắn** khi đứng cạnh (báo đòn 0,8 giây, giơ hai chân trước). Bám tường, leo lên xe tải.
- **Dạy:** đọc mặt đất, tránh vùng tơ, đánh từ bên hông.
- **Máu / sát thương / tốc độ:** 3 nhát / 8% / 1,1.
- **Rơi:** tơ điện.

### 4. Rết Đá — cấp 2

- **Hình:** rết dài 2 ô, vỏ như đá đỏ, các đốt sáng mờ.
- **Nhóm:** 3 con, Bậc đá ở Mỏ Bỏ Hoang.
- **Hành vi:** **chui xuống đất**, đi ngầm; mặt đất **nứt và rung** ở chỗ nó sắp trồi lên (báo đòn 0,8 giây, thấy rõ hơn bằng Máy Quét/Linh Cảm) → **trồi lên cắn** → nằm trên mặt đất 2 giây (hở).
- **Dạy:** đọc dấu hiệu dưới chân, dùng công cụ cảm nhận.
- **Máu / sát thương / tốc độ:** 6 nhát / 14% / ngầm 1,4.
- **Rơi:** vỏ đá, quặng lẫn trong vỏ.

### 5. Dơi Vân Quặng — cấp 2

- **Hình:** dơi nhỏ, cánh có vân như mạch quặng, mắt sáng.
- **Nhóm:** đàn 4–6, Hang Giữa ở Hầm Mỏ; bay ngang đường ray.
- **Hành vi:** treo trên trần; khi người chơi tới gần thì **cả đàn sà xuống** theo một đường thẳng (kêu ré + đổ bóng trên đất 0,7 giây trước). **Sợ ánh sáng:** đèn mỏ và vùng sáng làm chúng bay lên.
- **Dạy:** đọc bóng đổ, dùng ánh sáng làm vùng an toàn.
- **Máu / sát thương / tốc độ:** 1 nhát mỗi con / 5% mỗi con / 1,8.
- **Rơi:** cánh vân quặng.

### 6. Sói Rêu — cấp 3

- **Hình:** sói lông dài phủ rêu, mắt ngọc lam; con đầu đàn có rêu dày hơn.
- **Nhóm:** đàn 3, Rìa rừng ẩm.
- **Hành vi:** **không lao vào cùng lúc**. Một con đối mặt, hai con **đi vòng ra sau**. Con phía trước **hú** (báo đòn 0,6 giây) là tín hiệu cả đàn vồ. Hạ một con thì hai con còn lại lùi lại, rồi tấn công lại.
- **Dạy:** giữ lưng sát vật cản, ưu tiên mục tiêu.
- **Máu / sát thương / tốc độ:** 5 nhát / 12% / 1,2.
- **Rơi:** lông rêu, nanh sói.

### 7. Rắn Sương — cấp 3

- **Hình:** rắn dài, thân mờ dần vào sương, chỉ đầu và mắt sáng rõ.
- **Nhóm:** 2–3 con, Đầm Sương.
- **Hành vi:** **vô hình trong sương** (chỉ thấy gợn sương di chuyển); Máy Quét/Linh Cảm làm nó hiện rõ. **Phóng cắn** từ 3 ô (gợn sương dừng lại 0,6 giây trước). Cắn trúng gây **độc**: mất máu chậm trong 4 giây.
- **Dạy:** dùng công cụ cảm nhận, kiên nhẫn.
- **Máu / sát thương / tốc độ:** 5 nhát / 10% + độc 6% / 1,0 (phóng 4,0).
- **Rơi:** vảy sương, nọc.

### 8. Khỉ Vách Đá — cấp 3

- **Hình:** khỉ tay rất dài, lông xám, khớp tay có tinh thể sáng.
- **Nhóm:** 3 con, Vách Đá ở Rừng Sâu.
- **Hành vi:** đứng trên gờ đá cao, **ném đá** (vòng tròn đỏ trên đất nơi đá rơi, 0,7 giây); khi người chơi tới chân vách thì **nhảy xuống đập** (vòng tròn lớn hơn) rồi ngồi thở 1,5 giây trước khi leo lại.
- **Dạy:** tìm chỗ nấp, ép quái xuống đất.
- **Máu / sát thương / tốc độ:** 6 nhát / đá 10%, đập 16% / 1,1.
- **Rơi:** lông khỉ, đá tinh thể.

### 9. Cú Đêm Linh — cấp 3, chỉ ban đêm

- **Hình:** cú lớn, lông xám bạc, khi bay để lại vệt sáng mờ.
- **Nhóm:** 2 con, Tán Cao ở Rừng Sâu; **chỉ xuất hiện từ tối tới sáng**.
- **Hành vi:** bay vòng trên cao, **không có tiếng**; trước khi bổ nhào, đôi mắt **sáng lên** trên tán cây và vang một tiếng cú duy nhất (0,6 giây). Bổ xong đậu xuống đất 2 giây.
- **Dạy:** nghe âm thanh, để ý chu kỳ ngày đêm.
- **Máu / sát thương / tốc độ:** 4 nhát / 15% / bay 2,0.
- **Rơi:** lông cú bạc.

### 10. Chuột Tím — cấp 4

- **Hình:** chuột cỡ bàn tay, lưng mọc tinh thể tím lục giác. Dị thú duy nhất có **màu tím**: chúng bị nhiễm cả linh năng lẫn vật liệu tím từ lõi máy.
- **Nhóm:** đàn 4, sáu đàn rải ở hành lang, phòng máy và kho của Trạm. Vào qua vách sập ở Phòng Máy.
- **Hành vi:** chạy thành dòng theo hành lang; **cứ 47 giây** cả đàn cùng **phát xung** (lóe tím, đẩy người chơi lùi). Từng con yếu, nhưng xung của cả đàn rất đau: đứng giữa hành lang lúc xung là mất gần một phần năm máu. Nấp vào hốc tường hoặc phòng bên cạnh để tránh.
- **Dạy:** đếm nhịp 47 giây; chuẩn bị cho boss.
- **Máu / sát thương / tốc độ:** 2 nhát mỗi con / 6% mỗi con, xung 18% / 1,5.
- **Rơi:** mảnh tinh thể tím (vật phẩm cốt truyện, rất hiếm).

## 4. Đầu đàn và boss

### E1. Lợn Gai Đầu Đàn — hồi B

- **Ở đâu:** tâm Đồng cỏ cao, Bìa Rừng (112,66). Xuất hiện cố định trong cảnh truyện; sau đó hồi sinh mỗi ngày một lần.
- **Hình:** to gấp rưỡi Lợn Gai, gai lưng sáng mạnh, một nanh gãy.
- **Khác Lợn Gai thường:** lao **hai lần liên tiếp** (lần hai đổi hướng theo người chơi); gầm gọi thêm 2 Lợn Gai khi còn 50% máu.
- **Máu:** 12 nhát.

### E2. Nhện Mẹ — hồi C

- **Ở đâu:** cuối Hầm Tây, Hầm Mỏ.
- **Hình:** nhện cỡ con bò, bụng chứa trứng sáng.
- **Khác:** giăng tơ phủ **nửa hang**, chỉ để lại lối đi hẹp; đẻ 2 nhện con mỗi 15 giây; **kéo** người chơi lại gần bằng sợi tơ (sợi tơ sáng 0,8 giây trước khi kéo, né được).
- **Máu:** 16 nhát.

### E3. Khỉ Đầu Đàn — hồi D

- **Ở đâu:** đỉnh Vách Đá, Rừng Sâu.
- **Hình:** khỉ lưng bạc, tinh thể sáng mọc trên cả hai vai.
- **Khác:** ra lệnh cho các khỉ khác ném đá cùng lúc (nhiều vòng đỏ); tự nhảy giữa các gờ đá; khi còn 30% máu thì **giật một tảng đá lớn** rồi lăn xuống theo đường thẳng.
- **Máu:** 18 nhát.

### B1. Thủ Lĩnh Mạch Gãy — boss chương 1, hồi E

- **Ở đâu:** Phòng Lõi, Trạm Thiên Mạch. Sàn tròn, 4 cột che, lõi ở giữa.
- **Hình:** gấu núi khổng lồ (≤ 128 px), lưng mọc **tinh thể tím lục giác**, các vết nứt sáng ngọc lam trên da. Lọt vào trạm qua vách sập, ngồi canh lõi suốt sáu năm.
- **Trận chung:** Trạm là map 30 người; ai đứng trong Phòng Lõi đều đánh cùng một con gấu, ai gây sát thương đều được tính hạ boss.
- **Máu:** 40 nhát cho một người, nhân theo số người trong Phòng Lõi lúc bắt đầu trận (×(1 + 0,5 × số người thêm)); chia 3 giai đoạn.

| Giai đoạn | Máu | Đòn | Dạy lại từ |
| --- | --- | --- | --- |
| 1 | 100–66% | **Lao** thẳng (như Lợn Gai), **vồ** trước mặt (báo đòn 0,6 giây) | Lợn Gai |
| 2 | 66–33% | Thêm **đập đất**: tinh thể tím trồi lên theo hàng (mặt đất nứt trước, như Rết Đá); lõi gọi một đàn Chuột Tím | Rết Đá, Chuột Tím |
| 3 | 33–0% | **Cứ 47 giây** lõi phát xung toàn phòng: người chơi phải nấp sau cột (cột sáng lên báo trước 2 giây). Gấu điên hơn, ít hở hơn | Nhịp 47, Khỉ Vách Đá |

- Sau trận: gấu không chết mà **ngã xuống, tinh thể tím vỡ ra**, rồi lủi vào hang qua vách sập. Đây là động vật bị hại, không phải kẻ ác.
- **Quay lại sau 47 phút:** lõi tự khởi động lại và ánh tím kéo gấu về (cũng là lúc nhịp 47 giây chạy lại nếu có người vừa Ngắt lõi).
- Thua: tỉnh lại ở Sảnh vào. Boss chỉ hồi đầy máu và về giai đoạn 1 khi trong Phòng Lõi không còn ai đứng.

## 5. Biến thể (mod)

Một quái thường có **tối đa một** biến thể. Biến thể đổi **hình** và **một luật**, không chỉ tăng máu.

| Biến thể | Khi nào xuất hiện | Hình | Luật thay đổi |
| --- | --- | --- | --- |
| **Đêm** | Từ tối tới sáng, mọi khu rừng | Mắt và vân sáng mạnh hơn | Tầm phát hiện +30%, báo đòn ngắn hơn 0,1 giây |
| **Trời Linh** | Khi có sự kiện thời tiết "trời linh" | Viền ngọc lam rực, hạt sáng bay quanh | Nhiều quái hơn 50%; quái rơi thêm vật liệu linh năng |
| **Đầu đàn nhỏ** | 1/10 số nhóm ở mỗi khu | To hơn 20%, có vương miện vân sáng | Máu ×2, thêm một đòn của loài (vd. Lợn Gai lao hai lần) |
| **Nhiễm Tím** | Chỉ sau hồi C, ở Hầm Mỏ và Rừng Sâu gần Trạm | Một vài tinh thể tím trên lưng | Đòn chính kèm xung nhỏ đẩy lùi; rơi mảnh tinh thể tím |
| **Bị thương** | Ngẫu nhiên khi trời mưa | Đi khập khiễng | Bỏ chạy sớm (còn 40% máu); không gọi đồng loại |

Biến thể **Nhiễm Tím** chỉ bật sau hồi C để thế giới thay đổi theo cốt truyện: càng gần sự thật, quái càng có màu tím.

## 6. Bảng xuất hiện theo khu

Số quái tính cho map đủ 30 người, khoảng 1–1,5 quái/người, tối đa 6 quái trong một màn ([10](10-kich-thuoc-map-online.md) §5.2). Tọa độ lãnh địa ở [05](05-map-layouts.md).

| Khu | Quái | Nhóm × số nhóm | Hồi sinh | Thời gian |
| --- | --- | --- | --- | --- |
| Bìa Rừng — Ruộng hoang | Gà Rừng Mào Sét | 4 × 4 | 60 giây | Ngày |
| Bìa Rừng — Đồng cỏ | Lợn Gai | 2 × 6 | 45 giây | Cả ngày |
| Bìa Rừng — Đồng cỏ (tâm) | Lợn Gai Đầu Đàn | 1 × 1 | 1 ngày | Cả ngày, sau hồi B |
| Bìa Rừng — Xe tải bỏ dở | Nhện Tơ Điện | 3 × 3 | 60 giây | Cả ngày |
| Mỏ Bỏ Hoang — Bãi máy | Nhện Tơ Điện | 3 × 3 | 60 giây | Cả ngày |
| Mỏ Bỏ Hoang — Bậc đá | Rết Đá | 3 × 4 | 75 giây | Cả ngày |
| Hầm Mỏ — Hang Giữa, đường ray | Dơi Vân Quặng | 4 × 3 | 90 giây | Cả ngày |
| Hầm Mỏ — Hầm Tây | Nhện Tơ Điện | 3 × 2 | 60 giây | Cả ngày |
| Hầm Mỏ — cuối Hầm Tây | Nhện Mẹ | 1 × 1 | 1 ngày | Sau hồi C |
| Rừng Sâu — Rìa rừng ẩm | Sói Rêu | 3 × 4 | 90 giây | Cả ngày |
| Rừng Sâu — Đầm Sương | Rắn Sương | 2–3 × 4 | 75 giây | Cả ngày; sương dày hơn sáng sớm |
| Rừng Sâu — Vách Đá | Khỉ Vách Đá | 3 × 4 | 90 giây | Ngày |
| Rừng Sâu — đỉnh Vách Đá | Khỉ Đầu Đàn | 1 × 1 | 1 ngày | Sau hồi D |
| Rừng Sâu — Tán Cao | Cú Đêm Linh | 2 × 3 | 120 giây | Chỉ đêm |
| Trạm — hành lang, phòng máy, kho | Chuột Tím | 4 × 6 | 120 giây | Cả ngày |
| Trạm — Phòng Lõi | Thủ Lĩnh Mạch Gãy | 1 × 1 | 47 phút | Từ hồi E |

Hồi sinh luôn xảy ra **ngoài tầm nhìn** của người chơi (không hiện ngay trước mặt).

## 7. Animation và âm thanh tối thiểu

Mỗi quái thường có: đứng, đi, chạy, cảnh giác, **báo đòn**, ra đòn, hở, bị đánh, ngã/tan sương. 4 hướng cho quái nhỏ/vừa; boss 2 hướng (lật trái/phải).

Mỗi quái có **một âm thanh báo đòn riêng**, nhận ra được khi không nhìn màn hình: gà xù lông, heo khịt mũi, nhện rít, đất rung, dơi ré, sói hú, sương xì, khỉ hét, cú kêu một tiếng, chuột lách tách.

## 8. Ghi chú backend

**Đã có (13/10/2026):** `server/data/world_population.json` là nguồn duy nhất cho quái và NPC trên map. File khai báo 14 loài (máu = số nhát × 16, sát thương %, hồi sinh, giờ xuất hiện, hệ linh năng), lãnh địa theo bảng §6 (tọa độ ở [05](05-map-layouts.md)), điểm an toàn và NPC. `node scripts/build-life-world.cjs` biên dịch file này vào `server/src/life_world_generated.ts` và **từ chối build** nếu một con quái đứng trên nước, trong điểm an toàn, cách điểm đến của cổng dưới 12 ô hoặc cách điểm hoạt động dưới 6 ô (§4 ở [05](05-map-layouts.md)). Có 117 quái ở 5 map rừng. Cụm map prototype cũ không còn quái.
- Gà Rừng và Khỉ chỉ hiện ban ngày, Cú chỉ hiện ban đêm (theo đồng hồ đời sống).
- Đầu đàn và boss đã khai báo nhưng **chưa xuất hiện** (`storyGate`), chờ hệ thống cốt truyện.
- Loài chưa có vật phẩm rơi trong catalog thì chỉ cho linh năng. Hệ của Chuột Tím và boss (Kim, tạm thay cho Tím) là giá trị tạm.
- `world_map_get` trả thêm `territories` và `safeZones`; NPC có tên trả lời qua `world_interact`.

**Còn thiếu:**
- Quái có vòng trạng thái và đòn đánh trả như trận Sơn Trư 20 Hz đang có, thay cho kiểu bấm-trúng.
- Quái di chuyển trong lãnh địa và bị kéo về khi ra quá bán kính; hồi sinh ngoài tầm nhìn.
- Biến thể theo thời tiết và tiến trình cốt truyện; mở khóa đầu đàn/boss.
- Map Ẩn Giới (`m_an_gioi`) và NPC của nó (Lão Hồ...).
