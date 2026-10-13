# Tu Tiên — Game Design

**Bắt đầu lại:** 13/10/2026, nhánh `feat/map-ui-rebuild`. Bộ tài liệu cũ đã bị xóa; bản cũ còn trong lịch sử git.
**Sửa lần 2 (13/10/2026):** bỏ bối cảnh Việt Nam, chuyển sang thế giới hiện đại hư cấu; thêm hai role chơi được là **Người** và **Tinh Linh**.

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
| 06 | [Quái](06-monsters.md) | Có những quái nào, đánh thế nào, ở đâu? |
| 07 | [Sức mạnh: Nội Giới](07-power-system.md) | Nhân vật mạnh lên bằng cách nào? |
| 08 | [Sản lượng đời sống](08-life-yields.md) | Trồng, câu, đào được gì, ở đâu? |

## Quyết định đã chốt

- **Bối cảnh:** thế giới hiện đại hư cấu, không gắn quốc gia thật. Linh năng xuất hiện sau một biến cố gọi là Linh Chấn. Không cổ trang, không tông môn.
- **Hai role:** **Người** và **Tinh Linh** (cư dân của Ẩn Giới, thế giới bị ẩn giấu hiện ra cùng linh năng; mang nét thú nhưng không phải thú). Quái/dị thú là động vật bị nhiễm linh năng. Hai tộc dùng chung khoảng 70% lối chơi; phần còn lại khác nhau.
- **Quan hệ:** hai tộc sống chung một thế giới và còn căng thẳng. Người chơi hai tộc vẫn chơi cùng nhau.
- **Hình ảnh:** pixel 32 px, top-down 3/4 kiểu Stardew/Eastward, ánh sáng động; "một phần Eastward" về hình, không về lối chơi.
- **Map:** thế giới chia **3 khu**: Khu Người (Làng Hồ Lặng), Khu Rừng Quái (Bìa Rừng, Rừng Sâu, mỏ, Trạm) nằm cạnh nhau qua một tường rào; Khu Tinh Linh (Ẩn Giới) vào qua **Cổng Ẩn Giới đặt giữa làng**. Giữ các ID đã có trong `server/data/life_world.json`, đổi tên hiển thị; xem [03](03-world-and-maps.md).
- **Sức mạnh:** không có cấp độ hay cảnh giới. Linh năng hấp thụ vào người hình thành **Nội Giới** (đất, sông, núi, rừng, đảo, biển... rồi thành hành tinh); lượng và chất của Nội Giới quyết định sức mạnh.
- Nhân vật có thể tự hoạt động khi người chơi vắng mặt (đã có backend).


## Việc backend phát sinh (ghi lại, chưa làm)

- Thêm trường `race` (`human` / `spirit`) vào hồ sơ nhân vật, chọn một lần lúc tạo.
- Thêm map mới `m_an_gioi` (Ẩn Giới) và cổng nối với `m_lang_que`; Tinh Linh xuất phát ở `m_an_gioi`. Hiện `world_get` chỉ cho xuất phát ở `m_lang_que` hoặc `m_an_khe`.
- Đổi Chốt Tường Rào (`ln_lang_vanh`) thành lối duy nhất từ làng ra rừng; bỏ `ln_lang_thang` khỏi chương 1.
- Kỹ năng Hóa Thú và cách hấp thụ riêng của Tinh Linh (xem [01](01-gameplay.md) §3).
- Thay cảnh giới/tu vi bằng dữ liệu Nội Giới (xem [07](07-power-system.md) §13).

## Thứ tự làm

1. Duyệt 8 tài liệu này.
2. **Art test**: một góc Làng Hồ Lặng có Cổng Ẩn Giới + một avatar Người + một avatar Tinh Linh, theo [04](04-map-art.md) §10.
3. **Lát chơi đầu**: Làng Hồ Lặng đi được, tương tác được, câu/trồng nối với backend.
4. **Chương 1 hồi A–B** cho cả hai role.
5. Sau khi 1–4 đạt: thiết kế lại kinh tế, nhiệm vụ, xã hội.
