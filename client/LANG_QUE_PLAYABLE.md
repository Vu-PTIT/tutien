# Map đầu tiên — Làng quê

**Nhánh:** `feat/map-ui-rebuild` · **Godot:** 4.6.1 · **12/10/2026**.

**Bản này giữ để đối chiếu/test.** F5 hiện mở [làng quê mới](LANG_QUE_MOI.md) ở `scenes/m_lang_que_moi.tscn`. Làng trong tài liệu này chỉ mở riêng `scenes/m_lang_que.tscn` bằng F6; M1 ở `scenes/layered_village_m1.tscn`. Không tiếp tục author làng mới trong dữ liệu của bản này.

## Bố cục đã dựng

Map giữ kích thước **8192×6144 px (256×192 ô quy hoạch)**, spawn `(149,111)`, portal và arrival anchor lấy từ `data/world/links.json`.

| Khu | Nội dung runtime |
| --- | --- |
| Đồng ruộng tây bắc | 9 thửa lúa, bờ đi và mương. Lúa là sprite được vẽ theo batch; ruộng chặn di chuyển, đường xuyên đồng được cắt khỏi va chạm ruộng. |
| Đê/trạm | Đường đê ra Vành Đai, trạm bơm có trạng thái chạy/dừng, kênh về đồng, Ông Bảy. |
| Xóm mới | 6 nhà mái tôn, nhà sinh hoạt, nhà kính, cột điện và xe máy; Cô Hạnh. |
| Xóm nhà vườn | 8 nhà, sân và ngõ tiếp cận, Thợ mộc Hoa; cửa có trạng thái mở/đóng. |
| Sân đình/chợ | Đình riêng, cây đa, giếng, bảng tin, 5 sạp, ghế xanh, Bác Minh và người đi dạo. |
| Cầu phố | Đường nhựa, cầu bê tông qua mương; biển ra Thăng Long. |
| Vườn | Nhà vườn, kho dụng cụ, vòi nước và 12 luống có trạng thái gieo/tưới/lớn/thu cây mẫu. |
| Hồ câu | Hồ có bờ cong, cầu gỗ nối vườn, bến ván với 4 vị trí thả câu, quán nước, ghế và Chú Tâm. |

Có **454 vật thể độc lập + 15 NPC**, trong đó 5 NPC dịch vụ có tên/vai trò. Làng không có quái thù địch. NPC dùng chung bộ walk 4 hướng; người nền đi vòng ngắn bằng đường AStar, va chạm môi trường và dừng khi avatar tới gần. Chuyển sang đêm đổi điểm đến về nhà; NPC xa camera không cập nhật bước đi liên tục.

## Điều khiển

| Phím/thao tác | Hành vi |
| --- | --- |
| WASD / mũi tên | Đi bộ |
| Shift | Chạy |
| Click đất đi được | Tìm đường tới điểm bằng AStar; bấm phím để hủy |
| F | Tương tác gần điểm tiếp cận; kiểm tra khoảng cách và vật cản |
| M / click minimap | Mở/đóng bản đồ lớn từ cùng dữ liệu địa hình |
| Con lăn | Hai mức zoom nguyên 1×/2× |
| T / R | Thử ngày–đêm / mưa |
| EN / VI | Đổi nhãn HUD, tên vật thể, NPC và đối thoại |
| Cảm ứng | Hiện các nút giữ hướng và nút tương tác |
| Esc | Đóng đối thoại hoặc rời hoạt động |

Hai cửa ra chuyển tới **preview địa hình** của Thăng Long/Vành Đai, vì hai map đó chưa có pass đồ họa/actor. Nút **← Làng quê** đưa avatar về arrival anchor phía trong cổng. Đây là chuyển scene cục bộ, chưa phải travel của server.

## Kiến trúc và file chỉnh sửa

- `data/world/lang_que_layout.json`: terrain, 36 tuyến, placement/footprint, district, slot và checkpoint. Tọa độ cell nhân 32; Sprite2D đặt theo chân, không theo PNG top-left.
- `tools/build_lang_que.py`: nguồn authoring để tái tạo JSON. **Sửa script khi cần giữ thay đổi qua lần build tiếp theo**; chạy `python client/tools/build_lang_que.py` từ root repo.
- `scripts/lang_que.gd`: dựng layer, nước/cầu, navigation, actor, state và HUD.
- `scripts/lang_que_prop.gd`, `lang_que_player.gd`, `lang_que_npc.gd`: props có footprint, avatar và NPC.
- `assets/world/lang_que/`: sprite mới; nguyên liệu magenta ở `source/`, manifest crop/kích thước/QC ở `art-manifest.json`. Raw source được `.gdignore` để không import thành texture dư.
- `previews/lang_que/`: ảnh **Godot render thật**, không phải ảnh concept.

Layer gồm `L00` nền/ruộng/sân, `L01` đường, `L02` nước, `L03` chi tiết vẽ theo chunk, `L04` luống đổi state, `L05` cầu, `L10` Y-sort props/actors, `L11` dây điện, `L20` mưa, `L21` ánh sáng và `DATA` collision/navigation. Không dùng TileMapLayer. Thân nước trừ footprint cầu/bến trước khi tạo physics; nav tính từ cùng hình học và footprint props. Tán/mái tự giảm alpha khi che avatar.

Ảnh hiện có dùng nearest và scale 2 nguyên; giữ nguyên PNG của pack cũ. Đã sửa cách cắt sheet avatar 160×192 thành **4 cột 40×48**, dựa trên khoảng lặp 40 px của từng hình, để loại bỏ các frame bị cắt đôi.

## Trạng thái hoạt động

Đây là **map có đồ họa và tương tác offline**, chưa hoàn tất các hệ thống dịch vụ/kinh tế online:

- Cửa, trạm bơm và luống lưu ở `user://lang_que_local_v1.json`; ID luống giữ qua lần mở lại. Cây mẫu lớn sau 12 giây để kiểm tra vòng state.
- Ghế khóa di chuyển khi nghỉ; rời ghế về điểm đất phía trước. Thả câu tạo dây/phao và trạng thái nghỉ ở bến; chưa có loot cá hoặc minigame.
- Quầy, đình, nhà kính, quán và NPC có thông tin/đối thoại; chưa có giao dịch, nội thất, quest hoặc RPC activity từ platform. Không cấp tài sản/XP online từ các thao tác này.
- NPC dịch vụ có role khác nhau nhưng dùng chung sprite villager v1; animation nghề/ngồi chuyên biệt, động vật nền và âm thanh môi trường còn ở pass sau.
- UI cảm ứng đã được render kiểm tra trong cửa sổ 960×540. Chưa benchmark hoặc nghiệm thu Android/iOS thật.
- Cây/giếng/biển từ pack cũ vẫn là tài nguyên prototype theo ghi chú license sẵn có của dự án. Các nhà hiện đại, cây đa và đồ sinh hoạt mới có nguồn image_gen/QC riêng.

## Kiểm tra

```sh
node scripts/check-lang-que.cjs
godot --headless --path client --script res://tests/lang_que_smoke.gd
godot --headless --path client --script res://tests/lang_que_travel_smoke.gd
xvfb-run -a godot --audio-driver Dummy --path client --script res://tests/lang_que_capture.gd
```

Smoke kiểm tra đường từ spawn tới **69 điểm tương tác**, hai cổng, ba checkpoint; lấy mẫu tuyến với CapsuleShape2D của actor để bắt lệch navigation/physics. Có kiểm tra nước/cầu, mở–đóng cửa, gieo–tưới–lớn–thu cây mẫu, từ chối ngoài tầm, ngồi/rời, thả câu/rời, weather, EN/VI và khóa di chuyển khi mở map. Travel smoke chạy scene làng → preview kế bên → làng cho cả hai cửa, kiểm tra arrival anchor. CI giữ các regression M1/blockout cũ và tải PNG review lên artifact.
