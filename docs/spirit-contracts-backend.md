# API hình dạng nhân vật và khế ước

Ngày: 13/10/2026. Runtime: Nakama 3.37.0, TypeScript ES5. Mọi RPC yêu cầu tài khoản đã xác thực. Client không được ghi storage trực tiếp.

## Hồ sơ

Hồ sơ schema 4 được bổ sung `form`. Thiếu trường ở dữ liệu đã phát hành sẽ được bổ sung qua CAS; form hỏng bị giữ lại để kiểm tra, không reset tiền/đồ. Ví dụ:

```json
{"kind":"spirit_beast","speciesId":"cat","selected":true}
```

| RPC | Payload | Kết quả chính |
| --- | --- | --- |
| `character_forms` | `{}` | `forms`, `profile` |
| `character_select_form` | `{operationId,kind,speciesId}` | `profile`, `receipt`, `replayed` |
| `world_map_get` | `{}` | Geometry map hiện tại: width/height theo px, solids theo ô 32 px, footprints theo px, waters/bridges theo ô, points, speed/radius |

Hai lựa chọn hợp lệ là `human/human` và `spirit_beast/cat`. Chọn hình dạng cấp Linh Trảm hoặc Linh Trảo. `operationId` dài 8–80 ký tự thuộc `[a-zA-Z0-9_-]`; retry cùng payload dùng lại cùng ID. Chọn lần thứ hai bằng operation khác bị từ chối.

## Khế ước

| RPC | Payload | Kết quả chính |
| --- | --- | --- |
| `contract_get` | `{}` | `active`, `incoming`, `outgoing`, `pendingReward`, `serverNow` |
| `contract_invite` | `{operationId,userId}` | `contract`, `replayed` |
| `contract_respond` | `{contractId,accept}` | `contract`, `replayed` |
| `contract_release` | `{contractId}` | `contract`, `replayed` |

Tra người chơi bằng `social_find_player({username})` trước khi gửi UUID. Contract ID có dạng `ct_` + 32 ký tự hex, được suy ra từ người gửi và operation ID. Chỉ hai thành viên được đọc/hành động trên contract đó. Một người khác bị từ chối ngay cả khi biết ID.

`contract.other` chỉ có userId, username và form; không trả túi đồ, tiền hoặc dữ liệu activity của người kia. Hai bên có tối đa một contract active. Lời mời pending không chiếm slot active và không tự điều khiển avatar.

Inviter chỉ được rút lời mời; recipient tự đồng ý/từ chối. Contract active được mỗi bên tự kết thúc. Lời mời hết hạn sau 15 phút giờ server. Có giới hạn inbox/outbox và quota chống spam.

## Trận săn và thưởng

| RPC | Payload | Kết quả chính |
| --- | --- | --- |
| `contract_hunt_start` | `{contractId}` | `contract.hunt`, `replayed` |
| `contract_hunt_attack` | `{contractId,huntId,operationId,skill}` | `contract`, `damage`, `combo`, `replayed` |
| `contract_hunt_leave` | `{contractId,huntId}` | `contract`, `replayed` |
| `contract_hunt_claim` | `{}` | `profile`, `receipt`, `replayed` |

Mỗi người tự tham gia; hai người cùng joined mới được tấn công. `skill` là boolean chọn dùng active skill đã học/trang bị; client không gửi damage, HP, reward, bond hoặc tiến trình. `huntId` bắt buộc khớp trận hiện tại để một lệnh trễ không chạm trận mới. Cùng operation ID với skill khác bị từ chối.

Trận dùng HP riêng, vị trí trình diễn cố định và hành động RPC. Đi lại trong đấu trường chưa là authoritative real-time co-op; chuyển sang match là milestone sau. `world_attack` ngoài rừng vẫn xác minh vị trí/đường đi server và dùng kill receipts hiện có.

Hạ quái ghi thắng, gắn kết và pending reward của người có đóng góp vào cùng transaction. Claim dùng source `contract_hunt:<huntId>:<userId>` và operation ID do server tạo. Tiền thưởng luôn 0, XP tối đa 10 theo progression cap hiện có, vật liệu một Da Sơn Trư. Không mở hộp thưởng cho người chưa đóng góp.

Túi đầy không mất thưởng. Pending reward là dữ liệu của tài khoản, tiếp tục claim được khi đã kết thúc khế ước. Mỗi người có một pending reward slot; phải giải quyết thưởng trước khi mở trận săn mới. Mất phản hồi hoặc retry không tăng bond/XP/đồ thêm lần nữa.

## Lưu trữ và đồng thời

| Collection | Chủ sở hữu / key | Vai trò |
| --- | --- | --- |
| `characters` | User / `main` | Form, kỹ năng và tiến trình hiện có |
| `spirit_members` | User / `main` | Active ID và tối đa tám lời mời |
| `spirit_contracts` | System / contract ID | Trạng thái cặp, gắn kết, trận săn chung |
| `spirit_hunt_rewards` | User / `pending` | Thưởng chờ riêng, tiếp tục nhận sau khi chia tay |
| `asset_mutations` / `asset_receipts` | User / operation/source | Chọn hình dạng và claim chống trùng |

Mọi storage khế ước/thưởng có read/write permission 0. Các cập nhật nhiều tài khoản dùng một `storageWrite` với phiên bản CAS: chấp nhận một lời mời ghi contract cùng cả hai member; kết thúc giải phóng cả hai slot; hạ quái ghi trận và các pending reward cùng nhau. Giới hạn retry năm lần, lỗi cuối trả UNAVAILABLE. Không dùng lock chỉ nằm trong một JS VM.

Hành động săn dùng hồ sơ làm CAS witness và kiểm tra activity chưa kết thúc. Nếu `activity_start` thay đổi hồ sơ trong lúc ra đòn, transaction săn thất bại rồi kiểm tra lại; không cấp thưởng cho hành động xung đột.

## Tích hợp client và kiểm tra

Client M1 dùng `client/scripts/nakama_api.gd`, `spirit_gameplay.gd`, `spirit_playfield.gd`. Adapter REST gửi payload RPC dưới dạng JSON string đúng envelope của Nakama, tách HTTPRequest theo request, timeout tám giây, không lưu password/token xuống disk. Login email hoặc username dùng authenticate/email; tạo tài khoản cần username, email và password hợp lệ. Default localhost sử dụng server key dev của compose. Server thật dùng endpoint HTTPS và key cấu hình phù hợp.

UI polling khế ước mỗi hai giây để xem lời mời/HP quái chung. Đây là cơ chế của lát cắt thử; presence và combat realtime sản phẩm tiếp tục dùng Nakama match/socket ở milestone sau. Contract get không thay đổi trạng thái và không tự cấp XP.

Tests unit gồm migration/form, ủy quyền, blocked/self target, hạn lời mời, hai acceptance đồng thời, mất ACK, cooldown, contribution, full bag và claim sau khi kết thúc. `scripts/spirit-contract-smoke.mjs` chạy tài khoản mới trên Nakama/PostgreSQL; `client/tests/spirit_api_live_smoke.gd` kiểm tra adapter Godot với backend thật.

Nguồn kỹ thuật: [Nakama authoritative storage](https://heroiclabs.com/docs/nakama/client-libraries/snippets/authoritative-write/) và [Godot 4.6 HTTPRequest](https://docs.godotengine.org/en/4.6/classes/class_httprequest.html).
