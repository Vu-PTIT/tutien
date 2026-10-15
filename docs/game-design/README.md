# Tu Tiên — Game Design

**Nhánh làm việc:** `feat/fantasy-world` (14/10/2026). Thế giới **fantasy cổ**: một lục địa liền mạch chia **sáu khu vực theo hệ** linh năng, Người ở dải ven biển, Tinh Linh ở vùng giao thoa trong đất liền, Tâm Ẩn ở giữa; mạch truyện kiểu **shounen**.

## Trọng tâm hiện tại

Chỉ thiết kế ba thứ, theo thứ tự:

1. **Map art**: thế giới nhìn ra sao, từng vùng có cảm giác gì.
2. **Gameplay**: người chơi điều khiển gì, hai role khác nhau thế nào.
3. **Cốt truyện**: vì sao thế giới như vậy, hai tộc đứng ở đâu.

## Để sau

Có code backend nhưng chưa thiết kế lại: **kinh tế**, **nhiệm vụ** dạng danh sách, **túi đồ/trang bị**, **xã hội** (bạn bè, chat, nhóm), **sảnh/platform**. Tài liệu dưới đây chỉ ghi chỗ chúng sẽ gắn vào.

## Tài liệu

| # | Tài liệu | Trả lời câu hỏi |
| --- | --- | --- |
| 01 | [Gameplay](01-gameplay.md) | Chơi thế nào, Người và Tinh Linh khác nhau ra sao? |
| 02 | [Cốt truyện](02-story.md) | Chuyện gì đang xảy ra? |
| 03 | [Thế giới và map](03-world-and-maps.md) | Đi đâu, mỗi nơi có gì? |
| 04 | [Map art](04-map-art.md) | Trông ra sao, vẽ thế nào? |
| 05 | [Bố cục chi tiết từng map](05-map-layouts.md) | Mỗi map chia khu ra sao, cái gì nằm ở đâu? |
| 06 | [Quái](06-monsters.md) | Mỗi khu vực có những quái nào, đánh thế nào, ở đâu? |
| 07 | [Sức mạnh: Nội Giới](07-power-system.md) | Nhân vật mạnh lên bằng cách nào? |
| 08 | [Sản lượng đời sống](08-life-yields.md) | Trồng, câu, đào được gì, ở đâu? |
| 09 | [Hiện trạng các map](09-map-hien-trang.md) | Dữ liệu map hiện có gì, lệch thiết kế chỗ nào? |
| 10 | [Kích thước map cho online](10-kich-thuoc-map-online.md) | Map bao to để chứa tối đa 30 người một kênh? |
| 11 | [Tỉ lệ map mới](11-ti-le-map.md) | *(đề xuất)* Map nhỏ lại, đi nhanh hơn, nhà to hơn, mật độ dày hơn |
| 12 | [Bản đồ từng khu vực](12-ban-do-cac-khu.md) | Mỗi khu có những map nào, nối với nhau ra sao, nguy hiểm tới đâu? |

## Quyết định đã chốt

- **Bối cảnh:** fantasy cổ/trung cổ, không gắn quốc gia thật, không máy móc. Linh năng có từ thuở khai thiên, chảy ra từ **Tâm Ẩn** ở giữa và tách thành sáu hệ. Thế giới là **một lục địa liền mạch** chia **sáu khu vực**, mỗi khu một hệ trội: Rừng Thiên Mộc (Mộc), Đất Xích Nham (Hỏa), Cao Nguyên Hoàng Thổ (Thổ), Dãy Ngân Sơn (Kim), Vùng Ngàn Hồ (Thủy), Cao Nguyên Vân Phong (Phong). Ba lớp từ ngoài vào trong: **Người ở Vành Biển** (dải ven biển ngoài cùng, linh năng loãng); **dị thú ở đất hoang** của mỗi khu; **Tinh Linh ở vùng giao thoa** nội địa nơi hai khu gặp nhau (tương khắc thì là hiểm địa, không ai ở). Người đi lại vòng ngoài bằng thuyền, Tinh Linh đi vòng giao thoa bên trong; Tâm Ẩn chưa ai tới mà quay về. Không tông môn cổ trang; tổ chức là Hội Khai Phá, Tháp Học, làng, vương quốc. Xem [02](02-story.md), [03](03-world-and-maps.md).
- **Mạch truyện:** shounen. Mục tiêu lớn: thành Khai Phá Giả và đi qua các vùng giao thoa và sáu khu tới Tâm Ẩn; có thầy, đối thủ (Jin), kỳ thi, mỗi khu một mạch truyện (chuỗi nhiệm vụ, thứ tự gợi ý) với boss và một bước nhảy Nội Giới. Bí ẩn lớn: đá tím từ nơi thứ ba đang hút linh mạch (nhịp 47 giây).
- **Hai role:** **Người** và **Tinh Linh** (sinh ra ở vùng giao thoa, mang hai hệ của nơi sinh; mang nét thú nhưng không phải thú). Quái/dị thú là động vật bị nhiễm linh năng. Hai tộc dùng chung khoảng 70% lối chơi; phần còn lại khác nhau.
- **Quan hệ:** Người học Hấp Linh từ Tinh Linh ở Thời Khai Phá; **Giao Ước Rễ** vạch ranh đất. Hai tộc còn căng thẳng vì Người lấn đất, đào linh mạch. Người chơi hai tộc vẫn chơi cùng nhau.
- **Hình ảnh:** pixel 32 px, người chơi nhìn qua camera 3/4 kiểu Stardew/Eastward (3/4 là góc nhìn, còn map thiết kế trên lưới vuông mặt bằng; xem [04 §2](04-map-art.md#2-góc-nhìn-và-tỉ-lệ)), ánh sáng động; "một phần Eastward" về hình, không về lối chơi.
- **Thế giới mở:** cả lục địa vào được từ đầu, không chơi theo màn. Không có khu vực nào bị khóa cứng, **kể cả Tâm Ẩn**. Rào cản duy nhất là độ nguy hiểm tự nhiên (tăng theo độ sâu vào đất hoang và áp lực linh năng cực hạn ở Tâm Ẩn; quanh thị trấn ven biển và khu khởi sinh của Tinh Linh thì yên bình). Người chơi Người bắt đầu từ Làng Hồ Lặng ven biển đi vào trong, Tinh Linh bắt đầu từ Tâm Ẩn ở trung tâm cội nguồn đi ra ngoài; hai hướng gặp nhau tại các vùng giao thoa. Mạch truyện là chuỗi nhiệm vụ có thứ tự gợi ý, bỏ ngang và quay lại được. Xem [12](12-ban-do-cac-khu.md) §1.
- **Bản dựng đầu (rìa khu Mộc):** bờ nam khu Mộc. Làng Hồ Lặng là làng chài ven biển; ngoài tường cọc là đất hoang Bìa Rừng, Rừng Sâu, Mỏ, Hầm Mỏ, Đài Thiên Mạch; **Vườn Cây Mẹ** (nhà Tinh Linh Mộc) ở giao thoa Đầm Sen sâu trong đất liền, nối với làng bằng **Lối Rễ** (miệng là Cổng Rễ ở mép tây làng). Tâm Ẩn nằm ở trung tâm vòng giao thoa cội nguồn, mở tự do. Mạch truyện gợi ý đi vòng quanh lục địa Mộc → Thủy → Kim → Phong → Thổ → Hỏa → Tâm Ẩn ([12](12-ban-do-cac-khu.md)). ID map đánh số theo khu (`m_k1_01`…); xem [03](03-world-and-maps.md), [12](12-ban-do-cac-khu.md) §1.3.
- **Sức mạnh:** không có cấp độ. Linh năng hấp thụ vào người hình thành **Nội Giới** (đất, sông, núi, rừng, đảo, biển... rồi thành hành tinh); lượng và chất của Nội Giới quyết định sức mạnh.
- Nhân vật có thể tự hoạt động khi người chơi vắng mặt (đã có backend).


## Việc backend phát sinh (ghi lại, chưa làm)

- Thêm trường `race` (`human` / `spirit`) vào hồ sơ nhân vật, chọn một lần lúc tạo.
- Điểm xuất phát theo role: Người xuất phát ở `m_k1_01` (Làng Hồ Lặng); Tinh Linh xuất phát ở `m_k0_01` (Tâm Ẩn — Khu Giao Thoa Trung Tâm).
- Thẻ Khai Phá chỉ đổi cách NPC đối xử (nhận hợp đồng, thưởng của Hội), không chặn cổng nào. Mọi cổng đều mở tự do; không có cổng nào bị khóa (kể cả Tâm Ẩn).
- Thêm tên hiển thị cho từng map trong `life_world.json` theo [03](03-world-and-maps.md) §3 (vd. `m_k1_06` Đài Thiên Mạch); ID map đánh số theo khu, xem [12](12-ban-do-cac-khu.md) §1.3.
- Thẻ Khai Phá (tập sự → Đồng → ...) gắn vào hồ sơ nhân vật.
- Kỹ năng Hóa Thú và cách hấp thụ riêng của Tinh Linh (xem [01](01-gameplay.md) §3).

## Thứ tự làm

1. Duyệt bộ tài liệu này (01–12).
2. **Art test**: một góc Làng Hồ Lặng có Cổng Rễ + một avatar Người + một avatar Tinh Linh Mộc, theo [04](04-map-art.md) §10.
3. **Lát chơi đầu**: Làng Hồ Lặng đi được, tương tác được, câu/trồng nối với backend.
4. **Mạch truyện 1, hồi A–B** cho cả hai role.
5. Sau khi 1–4 đạt: thiết kế lại kinh tế, nhiệm vụ, xã hội.
