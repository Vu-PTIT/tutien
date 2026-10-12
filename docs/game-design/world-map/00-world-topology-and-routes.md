# 00 — World layout, giao thông, kết nối map

**Trạng thái:** bản quy hoạch đề xuất. **Nguồn chuẩn tọa độ portal:** file này. Mọi tài liệu vùng chỉ tham chiếu các cặp ID dưới đây.
**Địa lý:** vùng lõi hư cấu hóa Hà Nội–Ba Vì; cảng lấy cảm hứng Hải Phòng/Quảng Ninh và **cách xa** lõi Hà Nội. Sơ đồ là **đồ thị kết nối gameplay**, KHÔNG phải bản đồ theo tỉ lệ ngoài đời.

## 1. Sơ đồ liên thông tổng thể

```text
                  [MỎ LỘ THIÊN] ── đường sườn ── [RỪNG BA VÌ] ── [TRẠM THIÊN MẠCH]
                     │    │                         ▲
                     │   giếng                      │ lối hầm cũ (khóa giai đoạn đầu)
                     │    ▼                         │
                     │ [MỎ NGẦM] ────────────────────┘
                     │
                [VÀNH ĐAI TÂY] ── cổng Tây ── [THÀNH PHỐ THĂNG LONG] == tuyến đường Đông Bắc == [CẢNG]
                      │                          │
                      └──────── [LÀNG QUÊ] ──────┘
```

- **Vòng an toàn:** Làng ↔ Thành phố ↔ Vành Đai ↔ Làng. Người chơi luôn có đường quay về, không cần qua bãi quái để đi sinh hoạt.
- **Vòng thám hiểm:** Vành Đai ↔ Mỏ lộ thiên ↔ Rừng Ba Vì ↔ Vành Đai; đường phụ Mỏ lộ thiên ↔ Mỏ ngầm ↔ Rừng mở sau, không thành đường tắt bỏ qua cảnh báo.
- **Tuyến đường dài:** Thành phố ↔ Cảng qua xe tuyến/đường liên tỉnh có thời gian hành trình hợp lý, **không giả rằng bờ biển nằm sát Hà Nội**. Giai đoạn sau có thể làm tuyến đường liên vùng chơi được từ các chặng chunk nhỏ.
- **Trạm Thiên Mạch:** cửa kiểm soát ở sâu trong Ba Vì. Có đường trở lại checkpoint sau encounter, không “kẹt tầng”.

## 2. Kích thước vùng mục tiêu

| Map ID | Kích thước ô quy hoạch W×H | Kích thước pixel nếu 32 px/ô | Vùng chính | Vai trò |
| --- | ---: | ---: | --- | --- |
| `m_lang_que` | 256×192 | 8192×6144 | 6–7 xóm/đồng nhỏ | nông thôn sống động, an toàn |
| `m_thang_long` | 320×256 | 10240×8192 | 7–9 phố/khu chức năng | hub lớn, sinh hoạt/xã hội |
| `m_vanh_dai_tay` | 288×224 | 9216×7168 | 5–6 sector | đệm an toàn→PvE |
| `m_cang_dong_bac` | 256×192 | 8192×6144 | 5–6 sector | hậu cần, nghề biển |
| `m_mo_lo_thien` | 224×192 | 7168×6144 | 5 sector | khai khoáng ngoài trời |
| `m_mo_ngam` | 192×160 | 6144×5120 | 2 tầng logic/5 khu | khai khoáng hầm, nguy cơ |
| `m_ba_vi` | 320×256 | 10240×8192 | 6–8 sector | PvE rừng/núi |
| `m_tram_thien_mach` | 160×128 | 5120×4096 | 4–5 sector | bí cảnh/boss |

**Lưu ý:** “ô” chỉ để định vị; đường/rừng/nước thiết kế bằng spline/polygon/raster riêng. Nền nạp **theo chunk** (thử 1024 hoặc 2048 px sau benchmark), KHÔNG xuất thành một PNG 10240×8192 duy nhất. Những map lớn được dựng theo từng sector và mở rộng khi một sector đã đạt QA.

## 3. Hợp đồng cặp cổng A↔B (đi bộ, thang máy hoặc phương tiện)

Các tọa độ dưới là **tọa độ tâm trigger theo đơn vị 32 px**, không phải spawn của người chơi ngay trên mép. Mỗi đầu phải có `entry_anchor` cách trigger ít nhất 3 ô về phía vùng đi được, không đè collider; A→B và B→A dùng **cùng một link ID**.

| Link ID | Đầu A (map, tọa độ x,y) | Đầu B (map, tọa độ x,y) | Hình thức / điều kiện |
| --- | --- | --- | --- |
| `ln_lang_thang` | `m_lang_que` (249,105) | `m_thang_long` (10,176) | cổng làng–phố; đi bộ hai chiều; mở sẵn |
| `ln_lang_vanh` | `m_lang_que` (147,8) | `m_vanh_dai_tay` (143,215) | đường đê/trạm gác; mở sẵn; cảnh báo nguy hiểm |
| `ln_vanh_thang` | `m_vanh_dai_tay` (279,109) | `m_thang_long` (10,100) | cổng vành đai đô thị; mở sẵn |
| `ln_vanh_mo` | `m_vanh_dai_tay` (9,55) | `m_mo_lo_thien` (215,154) | đường xe vận tải; an toàn theo khung giờ, quái ngoài khu làm việc |
| `ln_vanh_rung` | `m_vanh_dai_tay` (156,8) | `m_ba_vi` (155,247) | chốt kiểm lâm/trạm cứu hộ; biển cảnh báo; PvE tùy chọn |
| `ln_mo_rung` | `m_mo_lo_thien` (110,9) | `m_ba_vi` (9,136) | đường núi; có checkpoint trước khi vào |
| `ln_mo_ngam` | `m_mo_lo_thien` (85,80) | `m_mo_ngam` (93,150) | giếng thang máy / thang bộ dự phòng; 2 chiều, kiểm tra an toàn |
| `ln_ngam_rung` | `m_mo_ngam` (183,41) | `m_ba_vi` (9,213) | cửa hầm cũ; **đóng giai đoạn đầu**, mở theo giấy phép/sửa công trình (không lệ thuộc cốt truyện dài) |
| `ln_rung_tram` | `m_ba_vi` (168,9) | `m_tram_thien_mach` (78,119) | cửa kín/trạm nâng; khóa cho đến khi đạt điều kiện PvE |
| `ln_thang_cang` | `m_thang_long` (311,93) | `m_cang_dong_bac` (9,115) | **tuyến liên vùng có phương tiện**, không phải seam kề nhau; hai chiều |

**Quy tắc phát hiện lỗi:** nếu một ID thiếu đầu B, hướng đường, arrival anchor hoặc đường lui thì chưa hoàn thành liên kết map. Đầu B luôn kiểm tra trống trước khi đặt avatar; nếu bị chặn thì chọn checkpoint dự phòng an toàn.

## 4. Lộ trình chính và các vòng đi bộ

| Mục tiêu người chơi | Lộ trình & loại đường | Cảm giác mong muốn |
| --- | --- | --- |
| Gặp bạn, mua hàng, đi học/làm (avatar) | phố chính Thăng Long → ngõ → công trình có `activity_slot` | an toàn, nhiều vòng nhỏ, có biển đường |
| Về nhà/vườn, câu cá | Thăng Long → `ln_lang_thang` → đường làng → vườn/hồ | đi được liên tục, không phải né quái |
| Bắt đầu PvE | Thăng Long → `ln_vanh_thang` → chốt → bãi quái có biển báo | khoảng đệm rõ giữa safe và combat |
| Khai thác | Vành Đai → `ln_vanh_mo` → moong/mỏ → kho vật tư | đường đủ rộng, NPC có ca làm |
| Vào rừng | Vành Đai → `ln_vanh_rung` → lối kiểm lâm → suối/vùng sâu | tăng nguy hiểm từ từ, có đường lui |
| Cảng, câu cá biển | trạm xe Thăng Long → `ln_thang_cang` → bến xe cảng → bến cá | là di chuyển giữa tỉnh, không gian cảng độc lập |
| Mỏ ngầm / bí cảnh | mỏ lộ thiên→giếng mỏ; rừng→trạm | điểm xuống/tới có checkpoint và cảnh báo |

- **Đường cấp A:** trục giao thông chính, bề rộng tham khảo **4–6 ô (128–192 px)**; không đặt cột điện, xe, bụi chắn giữa luồng.
- **Đường cấp B:** đường xóm, đê, lối vào điểm sinh hoạt **3–4 ô (96–128 px)**, đủ hai avatar tránh nhau.
- **Đường cấp C:** lối rừng, nhánh khám phá **2–3 ô (64–96 px)**; chỗ hẹp có khoảng chờ và tránh, không đặt portal ở góc khuất.
- Ít nhất **một vòng đi không cần quay đầu** trong mỗi map ngoài hầm; các nhánh hầm cụt phải có mục tiêu, phản hồi và đường rút rõ.
- Nước, vách đá, cổng, hàng rào chỉ đặt vào sau khi **kiểm tra đường vòng**. Cầu qua nước phải có mố, lối lên xuống và collider độc lập, không vẽ cầu “cho đẹp” trên nước chặn đường.

## 5. Không gian – thời gian khi đổi map

1. Người chơi/AI đứng trong vùng tiếp cận; UI hiển thị tên nơi đến, mức nguy hiểm và loại di chuyển.
2. Client phát yêu cầu `travel(link_id, direction, command_id)`; server xác minh danh tính, mở khóa, vị trí/khoảng cách hợp lý, điều kiện vùng và state mới.
3. Server lưu trạng thái `travelling`, map đích, entry anchor, revision; thông báo cho người theo dõi avatar theo quyền riêng tư.
4. Client preload chunk + asset quanh entry anchor; chuyển màn (không dùng ảnh “loading” vĩnh viễn); đặt nhân vật trong vùng an toàn rồi bật điều khiển.
5. Nếu tải lỗi/reconnect: từ snapshot server dựng lại **đúng một avatar**, không nhân đôi phiên hay loot, quay về checkpoint hợp lệ nếu spawn đích bị chặn.
6. Di chuyển từ sảnh khi không mở game chỉ cần đồ thị link + chặng và mốc thời gian server, **không mô phỏng Godot từng frame trên server**. Khi có người chơi đứng xem, NPC/avatar được dựng từ snapshot và tuyến hợp lệ.
7. Với `ln_thang_cang` có `travel_mode=transit` và hành trình qua tuyến Đông Bắc; có bến đón/trả, UI thời gian hành trình và phông cảnh lướt nếu phù hợp. **Không gắn hai cổng như cửa cạnh nhau**, cũng không dịch chuyển tức thì mà không giải thích.

## 6. Quy tắc mở khóa, hồi sinh, checkpoint

- Mỗi map có **safe arrival**, không spawn người từ cổng vào ngay aggro của quái. Checkpoint chính: bờ hồ/điểm sinh hoạt Thăng Long, đình/chợ làng, chốt Vành Đai, trạm y tế cảng, lán mỏ, trạm kiểm lâm Ba Vì, phòng tiền sảnh Thiên Mạch.
- Chết/gục ở vùng nguy hiểm đưa tới checkpoint gần nhất hợp lệ, không khóa inventory/người chơi ở map không thoát được. Không có quái “canh spawn”.
- Mở khóa lối rừng/mỏ ngầm/Thiên Mạch dựa vào **điều kiện gameplay công khai** (dụng cụ, giấy phép, cảnh báo), không buộc người thích đời sống phải hoàn tất tuyến PvE.
- Spawn NPC xã hội không nằm trong vùng chuyển cảnh. Không chặn cổng bằng quầy hàng, xe trang trí, NPC đứng bán.
- Nơi chưa sản xuất chỉ vẽ **biển chỉ hướng/công trình đang sửa**, nhưng tuyệt đối không để portal trông mở mà không có đích.
- Cảng là lá nối qua trạm xe giai đoạn đầu; các tuyến đảo/biển và địa phương khác là **future expansion**, không tạo portal chết trong MVP.

## 7. Minimap và bản đồ lớn

- Minimap cục bộ đọc cùng spline đường, polygon nước/vách và tọa độ POI đã xuất vào runtime; player marker cập nhật theo world position; có hướng Bắc rõ.
- Bản đồ thế giới hiển thị 8 vùng như **đồ thị tỉnh/khu vực**, tuyến xe Đông Bắc là đường đứt hoặc icon phương tiện; không vẽ sai khoảng cách địa lý.
- Marker phân biệt nhà, câu cá, vườn, shop, việc avatar, cửa ra, trạm cứu hộ, quái, linh khoáng; chỉ hiện quái/điểm chưa khám phá nếu đã phát hiện.
- Click địa điểm được chọn → hiện **đường đi qua các link** (BFS/A* theo điều kiện mở khóa), ước tính chặng; không hứa avatar sẽ tới nếu slot kín.
- Giao diện chỉ đường giữ tương phản, icon đủ lớn trên mobile, không ghi chữ lên nền pixel rối.

