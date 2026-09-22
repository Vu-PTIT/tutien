# Content Pack V1.1 — tích hợp Economy v1

**Ngày:** 22/09/2026  
**Trạng thái:** design/data + validator; **không auto-import runtime**.  
**Nguồn economy:** `design-samples/progression-pve.v1.json` / `economy-v1`.

## Phạm vi

- 50 trang bị, 40 kỹ năng, 100 vật phẩm.
- Giữ nguyên hợp đồng Economy v1 cho 24 item MVP; catalog mở rộng không thay đổi giá/faucet của chúng.
- `1U = 60 Linh Thạch`, chuyến Trúc Âm chuẩn net 60 / 15–20 phút.
- Linh Thạch là số dư `spiritStones`, **không phải inventory item**.
- Quái thường và PvP không rơi Linh Thạch trực tiếp.

## Các quyết định tích hợp

1. **ID canonical:** các item trùng chức năng với MVP dùng lại `it_heal_pill`, `it_qi_pill`, `it_iron`, `it_bamboo`, `it_spirit_dust`, `it_spider_silk`, `it_boar_hide`, ba linh thảo/ba hạt giống, quest item và hai gear hiện có. Không tạo bản sao cùng chức năng.
2. **Không có giá 0:** không bán/mua được biểu diễn bằng `null` + `marketPolicy`, tránh vòng mua miễn phí → bán NPC.
3. **NPC faucet allowlist:** content tương lai mặc định `npcBuy=null`. Muốn thêm NPC buy phải review economy và validator.
4. **Gear sink:** gear thường `bind_on_equip`; starter/quest gear `character_bound`. Không có NPC buy cho gear.
5. **Knowledge sink:** bí tịch `bind_on_use`, bị tiêu hủy khi học; market cho phép trước khi dùng.
6. **Consumable sink:** đan/phù bị tiêu khi dùng; đan combat dùng shared cooldown 25 giây.
7. **Market:** toàn server, listing 1%, sales tax 4%, direct trade 1%, escrow, 8 lệnh bán.
8. **Enhancement:** giữ +1→+5 của Economy v1. Không hoàn Linh Thạch khi đổi gear; hướng tương lai chỉ hoàn một phần vật liệu dưới dạng `Tinh Luyện Sa` sau playtest.
9. **24 slot:** 150 definition không được activate cùng lúc. MVP tiếp tục catalog 24 ID, content mở theo cảnh giới/patch.

## Giá và tiến triển

Giá item tương lai là **target market**, không phải NPC price. NPC không tự tạo trần/sàn cho mọi item. Mức thu nhập các cảnh giới sau chỉ là target playtest; Economy v1 hiện khóa mốc 180–240 Linh Thạch/h.

| Nấc | Net/h target | Trạng thái |
| --- | ---: | --- |
| Luyện Khí sơ | 180–240 | Economy v1 reference |
| Luyện Khí trung | 300–420 | Playtest target |
| Luyện Khí hậu | 480–660 | Playtest target |
| Trúc Cơ sơ | 780–1.020 | Playtest target |
| Trúc Cơ trung | 1.140–1.500 | Playtest target |

Không dùng các target sau Luyện Khí sơ để auto-scale economy; chỉ đổi sau telemetry.

## Craft

Bộ CSV/meta giữ nguyên 5 recipe MVP và thêm recipe tương lai cho đan/phù. Recipe tương lai là `future_design`; chưa đưa vào runtime trước P1–P5. Mọi phí là sink Linh Thạch, material là opportunity cost; NPC buy không được tạo craft/sell loop.

## Validator

`scripts/validate_content_pack_economy.py` kiểm:

- đúng 50/40/100 và ID duy nhất;
- không có `it_cur_*` hoặc item nhóm tiền tệ;
- đúng contract 1U/market fee/currency;
- giá `null` hoặc số nguyên dương, không có 0;
- chính xác price/policy MVP hiện tại;
- gear market phải bind-on-equip, gear bound không có market target;
- skill book bind-on-use + destroy-on-use;
- NPC buy ngoài allowlist bị từ chối;
- recipe chỉ tham chiếu item/equipment hợp lệ;
- PvP scalar hợp lệ và cảnh báo kỹ năng damage lớn + hard CC có CD quá ngắn.

## Runtime

Đây vẫn là **data thiết kế**. Không đổi `server/src/catalog.ts` từ 24 ID thành 150 ID ở mốc này. Khi P2/P4 đã có equip/consume/craft/shop runtime, migrate từng nhóm definition theo content gate thay vì import toàn bộ file một lần.
