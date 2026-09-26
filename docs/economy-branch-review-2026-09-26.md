# Đối chiếu nhánh kinh tế trước khi nhập dữ liệu — 26/09/2026

Nguồn so sánh: `feat/inventory-rewards` tại `4ff2486` và `feat/economy-balance-v1` (merge base `e258028`). Nhánh kinh tế đi trước 19 commit riêng, thiếu 30 commit của nhánh tích hợp map/UI. Chỉ đối chiếu nội dung; không nhập toàn nhánh vào runtime.

| Hợp đồng | Runtime hiện tại | Nhánh kinh tế | Quyết định |
| --- | --- | --- | --- |
| Gói đầu `starter:v1` | `server/src/catalog.ts`: 12 Linh Thạch + item, có receipt theo source | Tài liệu đề xuất `starter:v2` 120 Linh Thạch; JSON thiết kế vẫn giữ starter 12 | Giữ `v1` bất biến; `v2` cần RPC/source và kiểm thử migration riêng, không sửa số trên source cũ. |
| Danh mục vật phẩm | 24 ID trong Nakama, túi 24 ô | 100 item, 50 trang bị, 40 kỹ năng trong CSV/meta | `meta.json` đặt `runtimeCatalogImportAllowed=false`; không đưa 150 definition vào 24 ô cùng lúc. |
| Tiền | `spiritStones` là số dư profile, không nằm ở slot túi | Cùng định hướng, thêm shop/market fee và mục tiêu 1U = 60 | Chỉ dùng làm giả thiết cân bằng; không bật giao dịch khi server chưa có settlement. |
| Tiến trình/PvE | Chưa có XP/loot encounter runtime | Thay `progression-pve.v1.json` bằng quest/reward, sink/faucet mới | Không sao chép JSON sang server; kiểm nguồn thưởng, capacity, idempotency và tuyến chơi ở P1–P4. |
| Kiểm tra | CI client/server đang kiểm prototype chơi | Thêm validator content pack và progression | Có thể lấy validator cùng data thiết kế qua PR riêng sau khi rà ID, schema và khớp starter; không coi validator là bài test gameplay. |

Chi tiết thiết kế ở nhánh kinh tế: `docs/game-design/economy-balance-v1.md`, `docs/game-design/content-pack-economy-v1.md`, `design-samples/content-pack-economy/v1/`. Mốc P0 chỉ tích hợp nền đang chạy từ `feat/inventory-rewards`; dữ liệu kinh tế vẫn ở nhánh riêng để xử lý bằng PR kế tiếp.
