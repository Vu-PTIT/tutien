# Làng quê mới

**Nhánh:** `feat/map-ui-rebuild` · **Engine kiểm tra:** Godot 4.6.1 · **12/10/2026**.

Mở `project.godot`, bấm **F5** để vào `scenes/m_lang_que_moi.tscn`. Mở trực tiếp scene này bằng F6 cũng được. Map chạy offline.

## Đây là một bản đồ mới

`tools/build_lang_que_moi.py` bắt đầu bằng dữ liệu rỗng. Script không đọc làng Linh Khê, M1, `lang_que_layout.json` hoặc JSON blockout cũ. Địa hình, tuyến đường, vị trí nhà, sân, ruộng, hồ và các ID đều được đặt mới. `scripts/lang_que_moi.gd` kế thừa trực tiếp `Node2D`, không kế thừa script của làng test hay scene preview.

Các sprite nhà/cây/đồ dùng và thành phần điều khiển, NPC, tương tác được dùng lại như tài nguyên chung. Đình làng có PNG mới ở `assets/world/lang_que_moi/community_hall.png`, tạo bằng built-in image_gen và xử lý alpha/nearest bằng Generate 2D Sprite. Làng mới không sử dụng đình Linh Khê của bản test.

Làng cũ vẫn có thể mở riêng để đối chiếu. `main.tscn` đã chuyển sang làng mới. Khi qua cổng rồi quay về, game nhớ scene xuất phát và quay đúng làng mới.

## Mặt bằng và các khu

Map rộng **8192×6144 px**, tương đương **256×192 ô quy hoạch**. Spawn ở `(130,111)`. Các cổng giữ hợp đồng thế giới: Thăng Long `(249,105)`, Vành Đai Tây `(147,8)`; điểm vào lần lượt `(245,105)` và `(147,12)`.

| Khu | Bố cục mới |
| --- | --- |
| Đồng ruộng tây bắc | 9 thửa có viền riêng, mương tưới chạy phía bắc, đường bờ nối ngõ làng và trạm bơm. |
| Đê/trạm | Đường đê uốn từ sân chợ lên cửa bắc; trạm bơm và Ông Bảy nằm phía tây đường đê. |
| Xóm mới đông bắc | 9 nhà, nhà sinh hoạt, nhà kính, ngõ bê tông, xe máy và dây điện. |
| Xóm nhà vườn phía tây | 11 nhà thành các cụm, ngõ vòng và hai ngõ xuyên; không xếp lại nhà trên nền làng test. |
| Sân đình/chợ | Đình mới phía bắc sân gạch bất quy tắc; cây đa bên tây, giếng/bảng tin, chợ 5 sạp tách về phía đông. |
| Cầu phố | Đường chính nối sân chợ tới cầu bê tông qua sông nhỏ phía đông rồi ra Thăng Long. |
| Vườn người chơi | Nhà vườn, kho dụng cụ, vòi nước và 12 luống; đường vườn ở bờ tây mương. |
| Hồ câu phía nam | Bờ hồ bằng spline khép kín, đường dạo vòng hồ, quán nước, bến 4 slot và cầu gỗ nối vườn qua mương. |

Có **806 vật thể độc lập, 15 NPC, 47 tuyến/nhánh tiếp cận**, 4 vùng nước, cầu bê tông, cầu gỗ và bến ván. Làng là vùng an toàn, không spawn quái thù địch.

## File để tiếp tục làm làng mới

- `tools/build_lang_que_moi.py`: nguồn authoring duy nhất cho bố cục mới; chạy `python client/tools/build_lang_que_moi.py` từ root repo.
- `data/world/lang_que_moi_layout.json`: địa hình, placement, footprint, district, plot, checkpoint và slot. `layout_id=lang_que_moi`; `map_id=m_lang_que` giữ kết nối với tám khu của thế giới.
- `scenes/m_lang_que_moi.tscn`, `scripts/lang_que_moi.gd`: scene và runtime riêng.
- `user://lang_que_moi_local_v1.json`: trạng thái cửa/luống/trạm bơm riêng; không nhập save của làng test.
- `previews/lang_que_moi/`: ảnh từ Godot render thật.

Ảnh desktop và bản đồ chi tiết nằm trong bản Git. Công cụ capture tạo lại đầy đủ ảnh toàn map, hồ, vườn, ruộng, ngày/đêm và cảm ứng từ chính scene; CI lưu các PNG vào artifact review. PNG nguồn đình độ phân giải lớn chưa được xuất bản lên GitHub; PNG runtime và prompt đã có trong repo.

Các lớp tách nền, đường, nước/bờ, chi tiết thấp, luống đổi trạng thái, cầu, props/actor Y-sort, foreground, thời tiết/ánh sáng và DATA va chạm/navigation. Đường chính và đường vườn chỉ qua nước tại cầu. Minimap dùng chính geometry runtime. Va chạm giữ ở chân vật thể; mái/tán giảm alpha khi che avatar.

## Điều khiển và phạm vi

WASD/mũi tên để đi, Shift để chạy, click đất để tìm đường, F để tương tác, M/click minimap để mở bản đồ lớn; T/R thử ngày–đêm/mưa. Có EN/VI và nút cảm ứng.

Cửa, luống mẫu, trạm bơm, ghế nghỉ, thả câu và đối thoại chạy cục bộ. Cây mẫu lớn sau 12 giây để thử state. Giao dịch, nội thất, loot cá, thưởng online và activity từ platform chưa được nối vào map. Hai map bên cạnh vẫn là preview địa hình.

## Kiểm tra

```sh
node scripts/check-lang-que-moi.cjs
godot --headless --path client --script res://tests/lang_que_moi_smoke.gd
godot --headless --path client --script res://tests/lang_que_moi_travel_smoke.gd
xvfb-run -a -s '-screen 0 4096x3072x24' godot --audio-driver Dummy --path client --script res://tests/lang_que_moi_capture.gd
```

Đã kiểm tra bằng Godot **4.6.1**: 75 điểm tương tác có đường đi và không vướng footprint actor; hai cổng/arrival anchor, ba checkpoint, nước/cầu, cửa, luống, ghế/câu, thời tiết và EN/VI. Travel smoke kiểm tra cả hai lần đi–về và xác nhận không quay vào làng cũ. Static audit kiểm tra làng mới có geometry/placement riêng và F5 mở đúng scene. CI bổ sung các kiểm tra này và lưu ảnh review; mobile thật chưa được benchmark.
