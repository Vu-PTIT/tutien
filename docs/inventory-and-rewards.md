# Túi đồ và cấp thưởng — mốc tài sản 21/09/2026

## Chơi thử

Khởi động backend như README, mở Godot, **Kết nối → Túi đồ → Nhận vật tư khởi đầu**.
Túi hiện số linh thạch, số ô, tên/số lượng và ID riêng của trang bị (tooltip).
Tải lại túi sau lỗi mạng; đóng/mở game vẫn dùng cùng ID nhận gói khởi đầu.
Nút túi tạm khóa trong trận. Đấu tập vẫn không phát loot hoặc sửa tài sản.

Gói prototype `starter:v1`: 12 linh thạch, 2 hạt Cam Lộ, 4 nước,
2 Hồi Nguyên Hoàn và 1 áo vải. Ngân sách này là lựa chọn triển khai ban đầu,
chưa qua cân bằng vòng chơi. Không cấp Mạch Bàn/đồ nhiệm vụ trước story.
Hiện chỉ xem và nhận vật tư; chưa trang bị, dùng đan, craft, mua bán hoặc trồng cây.

## Hợp đồng dữ liệu

`characters/main` thuộc user đăng nhập, đọc chỉ chủ sở hữu, client không được ghi.
Tiền và túi nằm trong **cùng object**, không dùng Nakama wallet rời.

```json
{
  "schemaVersion": 2,
  "characterId": "user UUID",
  "realm": "mortal",
  "realmStage": 0,
  "spiritStones": 0,
  "revision": 0,
  "inventory": []
}
```

- 24 ô; nguyên liệu/tiêu hao stack tối đa 99; vật phẩm tiến trình tối đa 1 mỗi ô.
- Trang bị/công cụ có `instanceId` UUID, mỗi instance chiếm 1 ô.
- Catalog 24 ID tại `server/src/catalog.ts`, theo thiết kế 07; `bound` là metadata
  dành cho hệ thống giao dịch tương lai, chưa có API giao dịch.
- Giới hạn số dư và revision: 1 tỷ, số nguyên. Đạt giới hạn thì từ chối toàn bộ.
- Schema 1 thực tế: `pham_nhan/level:1` → `mortal/realmStage:0`;
  `luyen_khi/level:1..4` → `luyen_khi/realmStage:1..4`. Giữ số dư và trường bổ sung.
- Chuyển schema bằng CAS, không reset khi có người ghi trước. Schema lạ, tầng
  ngoài phạm vi hoặc dữ liệu lỗi bị khóa thao tác để rà soát; giữ nguyên bản gốc.
  Chưa có màn hình quản trị xử lý dữ liệu cần rà soát.
- `get_profile` trả schema 2; đây là thay đổi hợp đồng, cần cập nhật client cũ
  đang phụ thuộc `pham_nhan` hoặc `level`. Combat chỉ đọc profile để xác nhận tồn tại.

## RPC

| RPC | Payload | Kết quả |
|---|---|---|
| `get_profile` | `{}` | Profile schema 2, tự tạo/migrate nếu hợp lệ |
| `inventory_get` | `{}` | `profile`, `capacity`, `catalogVersion`, `catalog`, `starterClaimed` |
| `inventory_claim_starter` | `{"operationId":"starter_claim_v1"}` | `receipt`, `replayed`, `profile` |

Chỉ nhận `operationId` gồm 8–80 chữ/số/`_`/`-`. Mọi trường thêm bị từ chối;
user, source, vật phẩm và số tiền đều do server chọn. Không có RPC cấp đồ tùy ý.

## Giao dịch và retry

1. Đọc receipt `asset_receipts/op:<operationId>` của user. Nếu fingerprint trùng,
   trả receipt gốc cùng profile mới đọc; khác thì `ALREADY_EXISTS`.
2. Chặn source đã nhận qua `asset_receipts/source:starter:v1`, dù dùng ID khác.
3. Đọc profile/version; tính toàn bộ tiền/túi trên bản sao, kiểm tra capacity.
4. Một batch `storageWrite`: profile dùng CAS, hai receipt dùng create-only `*`.
   Tất cả cùng commit hoặc rollback. Receipt chỉ server được đọc/ghi.
5. Xung đột/thiếu acknowledgement: đọc lại và thử tối đa 5 lần. Nếu vẫn lỗi,
   trả `UNAVAILABLE`; client giữ operation ID khi retry.

Fingerprint SHA-256 gồm source, số tiền và danh sách item sắp theo ID/số lượng.
Receipt lưu operation/source, fingerprint, phần thưởng, revision và thời điểm.
Không xóa receipt một lần theo TTL; đổi version catalog không được làm source
khởi đầu thành nguồn có thể nhận lại. Đổi nội dung gói cần chính sách migration.

Tài liệu Nakama: [storageWrite](https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/function-reference/#storagewrite),
[concurrency control](https://heroiclabs.com/docs/nakama/concepts/storage/concurrency-control/).

## Điểm nối PvE tiếp theo

`grantReward` là hàm nội bộ dùng chung. Module encounter phải xác minh kill/tham gia,
chốt reward bất biến và tạo source duy nhất từ encounter + người nhận trước khi gọi.
Không lấy reward hoặc source hợp lệ chỉ vì client gửi lên. Nếu cần lưu thêm trạng
thái quest/encounter, thiết kế cùng giao dịch hoặc outbox bền vững; receipt đơn lẻ
không giải quyết việc kết quả encounter biến mất trước lần phát thưởng đầu tiên.
Mốc này chưa triển khai encounter/loot.

## Kiểm chứng

- `npm --prefix server test`: 64 unit test, gồm migration, invalid schema, CAS cạnh
  tranh, replay/reconnect, giả payload, đầy túi, tràn số dư và lỗi trước/sau commit.
- Godot 4.4.1: import và chạy scene; live panel test tại `client/tests/inventory_smoke.gd`.
- `node scripts/inventory-smoke.mjs`: Docker local, tài khoản riêng cho từng ca;
  concurrent init/claim cùng ID/khác ID, SQL kiểm receipt, migration, túi đầy,
  quyền đọc/ghi và restart Nakama rồi xác thực/replay.
- SQL fixture chỉ dùng trong smoke, không tạo admin/debug RPC trên runtime.
- CI kết hợp smoke mới với profile/social/combat để phát hiện hồi quy.
- Mất acknowledgement được fault-inject trong unit test; live smoke bỏ kết quả
  rồi restart/replay, không giả định đã kiểm tra mọi thời điểm mất điện/mất mạng.
