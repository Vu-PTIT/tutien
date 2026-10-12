# World Map Blueprint — hệ thống 8 vùng liên kết

**Dự án:** Tu Tiên · nhánh thiết kế `feat/map-ui-rebuild` · **12/10/2026**.
**Trạng thái:** **đặc tả sản xuất đề xuất, chưa phải bản đồ / NPC / quái đã chạy trong Godot**. Việc triển khai cần scene, asset, navigation, network và QA riêng.
**Canon giữ nguyên:** `../04-world-setting-vietnam-awakening.md` (Việt Nam hiện đại sáu năm sau Linh Chấn); `../11-world-bible.md` (tông hình ảnh); `../12-art-bible.md` (HD pixel 32 px, top-down 3/4); `../10-layered-interactive-maps.md` (layered raster, props riêng, tương tác).
**Thay đổi theo yêu cầu 12/10/2026:** mở rộng quy hoạch từ **4 vùng MVP canon** thành **8 vùng vật lý**, trong đó **làng quê, cảng, mỏ lộ thiên, mỏ ngầm là 4 vùng mới đề xuất**. Không đổi ID của 4 vùng đã có, không đổi 4 vùng này thành một MVP bắt buộc phải làm cùng lúc.

## Cách đọc và triển khai (đọc theo thứ tự)

| Tài liệu | Nội dung |
| --- | --- |
| [00 — Thế giới, tuyến đi, portal](00-world-topology-and-routes.md) | Sơ đồ 8 vùng, kích thước, cặp cổng hai chiều, tuyến đường, kết nối dài, checkpoint, quy tắc bản đồ lớn. **Nguồn chuẩn duy nhất cho tọa độ portal liên vùng.** |
| [01 — Layer, runtime và hợp đồng map](01-layer-contract-and-runtime.md) | Cấu trúc node/layer, terrain/water, Y-sort, collision, navigation, streaming, NPC/enemy spawn, activity slot, đồng bộ sảnh↔game. |
| [02 — Làng quê](02-lang-que.md) | Ruộng, nhà vườn, chợ quê, đê, hồ câu; hai lối ra, vòng đi bộ, NPC và sinh hoạt. |
| [03 — Thành phố Thăng Long](03-thang-long.md) | Ngõ phố, hồ, chợ, trường, Viện Linh học, trạm xe, hai cổng tây + tuyến cảng. |
| [04 — Vành Đai Tây](04-vanh-dai-tay.md) | Vùng chuyển tiếp, trạm gác, ruộng/xưởng bỏ hoang, chốt an toàn và bãi quái. |
| [05 — Cảng Đông Bắc](05-cang-dong-bac.md) | Cảng hoạt động, phố dịch vụ, bến cá, kho hàng, bãi neo, bến hoang có dị thú. |
| [06 — Mỏ lộ thiên](06-mo-lo-thien.md) | Đường xe tải, moong khai thác, khu phân loại, lối sườn núi, giếng xuống mỏ ngầm. |
| [07 — Mỏ ngầm](07-mo-ngam.md) | Hầm nhiều nhánh, thông gió, đường ray, nguy cơ môi trường, hang nối Ba Vì. |
| [08 — Rừng Ba Vì](08-rung-ba-vi.md) | Đường mòn, trạm kiểm lâm, suối/cầu, sinh cảnh dị thú, trục tới Thiên Mạch. |
| [09 — Trạm Thiên Mạch](09-tram-thien-mach.md) | Khu nghiên cứu ngầm, 3 vòng an ninh, encounter boss, lối rút. |
| [10 — NPC, quái và hoạt động](10-npc-ai-monsters-and-activities.md) | Lịch NPC, AI thường/dịch vụ, bảng hệ sinh thái/spawn, tương tác, avatar tự hành từ platform. |
| [11 — Asset và lộ trình thi công](11-assets-and-production-plan.md) | Gói nền/prop/animation/FX theo vùng, thứ tự xây từ vertical slice đến 8 vùng. |
| [12 — Test/tiêu chí nghiệm thu](12-qa-and-acceptance.md) | Checklist từng map, portal A↔B, va chạm, NPC, quái, gameplay trực tiếp/tự động, mobile. |

## Quy ước toàn bộ tài liệu

- `m_thang_long`, `m_vanh_dai_tay`, `m_ba_vi`, `m_tram_thien_mach`: ID **đã có trong canon thiết kế**, việc migrate backend vẫn cần kiểm tra. ID mới **đề xuất**: `m_lang_que`, `m_cang_dong_bac`, `m_mo_lo_thien`, `m_mo_ngam`.
- Một **vùng/map** là khu có bản sắc và luật riêng; một vùng có thể có nhiều **sector/chunk/scene** mà vẫn thuộc cùng một `map_id`. **Layer là lớp hiển thị/logic, không phải map con.**
- Toàn bộ tọa độ trong hồ sơ là **ô quy hoạch 32 px** (x sang phải, y xuống dưới; Bắc ở trên), không bắt engine dùng TileMap hay dựng tranh theo ô. Chuyển sang pixel: nhân 32. Chúng là **tọa độ đích cho bản vẽ mới**, không phải tọa độ map cũ 1120×800.
- Kích thước, ngân sách NPC/quái, giờ hoạt động và bề rộng lối là **mốc thử thiết kế**; đo cảm giác và hiệu năng trước khi khóa. Portal ID/cặp nối phải thống nhất nếu đổi tọa độ.
- Khu an toàn **không spawn quái thù địch**. PvE là hoạt động tùy chọn. Kinh tế thưởng, XP, drop dùng server cân bằng riêng; không chốt tỷ lệ rơi bằng tài liệu mỹ thuật.
- Các NPC mới trong những tài liệu này là **đề xuất**, không thay 6 NPC đã canon trong `../05-story-bible.md`.
- Không dán mọi nhà/cây/NPC vào một ảnh map; không làm toàn map bằng tileset. **Nền/đường/bờ nước sạch + vật thể độc lập + dữ liệu gameplay độc lập**.

## Mẫu nghiệm thu trải nghiệm tổng thể

Người mới xuất hiện ở Thăng Long; đi bộ ra làng trồng cây/câu cá, đi ngược về thành phố thăm bạn; có thể qua Vành Đai tới mỏ, lên rừng, xuống mỏ ngầm, tiếp cận Trạm Thiên Mạch khi đủ điều kiện; chọn xe tuyến Đông Bắc để tới cảng. Đường trên bản đồ và cổng ra trong cảnh phải chỉ cùng hướng, không có lối cụt vô cớ. Khi giao “đi câu/chăm vườn” từ sảnh, server có thể định tuyến tới slot hợp lệ, giữ kết quả khi người dùng đóng game và dựng **một avatar** khi quay lại.

**Không cam kết đã có chức năng trên chỉ vì tài liệu tồn tại.** Bản thử `layered_village_m1` vẫn là mẫu kỹ thuật non-canon (xem `../../../client/M1_LAYERED_IMPLEMENTATION.md`).

