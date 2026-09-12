# Backend tương tác người chơi — v0.2

Nền tảng hiện có: Godot 4.4.1 / GDScript, Nakama 3.37.0 / TypeScript,
PostgreSQL 16.8. Các API này hoạt động độc lập với di chuyển, chiến đấu và bản đồ.

## Chạy và kiểm tra

```sh
docker compose up --build -d
docker compose ps
node scripts/smoke.mjs
node scripts/social-smoke.mjs
```

Đợi Nakama `healthy` trước khi chạy smoke. Node.js 22.14+ dùng cho các script.
Smoke tương tác tạo ba tài khoản tạm, kiểm tra HTTP và WebSocket thật, rồi xóa
tài khoản trong `finally`. Chỉ chạy trên môi trường phát triển hoặc kiểm thử.

```sh
cd server
npm ci
npm test
```

Các nhóm, quan hệ bạn bè, tin nhắn và hồ sơ được lưu trong PostgreSQL. Khởi động
lại bằng `docker compose restart` giữ dữ liệu; `docker compose down -v` sẽ xóa
volume dữ liệu. Không cần tạo bảng riêng ngoài migration có sẵn của Nakama.

### Kết quả kiểm tra ngày 12/09/2026

- Build TypeScript và 23 unit test: đạt.
- `nakama check --runtime.path server/build` bằng Nakama 3.37.0: đạt.
- Godot 4.4.1: kiểm tra cú pháp adapter/bộ smoke và chạy scene gốc headless: đạt.
- Smoke HTTP/WebSocket với PostgreSQL thật và smoke adapter Godot: **chưa chạy**.
  Workspace không có Docker và không cho chạy PostgreSQL dưới tài khoản không
  phải root. Workflow đã có các bước chạy hai bộ smoke này khi code được đẩy lên.

Kết quả trên xác nhận build, nạp runtime và các quy tắc trong unit test; chưa xác
nhận toàn bộ luồng kết nối cơ sở dữ liệu hay hiệu năng nhiều người chơi.

## Tài khoản và phiên

| Thao tác | HTTP |
|---|---|
| Đăng ký email + mật khẩu + tên đăng nhập | `POST /v2/account/authenticate/email?create=true&username=dao_huu` |
| Đăng nhập email | `POST /v2/account/authenticate/email?create=false` |
| Đăng nhập tên + mật khẩu | `POST /v2/account/authenticate/email?create=false&username=dao_huu`, bỏ trường email |
| Lấy tài khoản của mình | `GET /v2/account` |
| Lấy/khởi tạo nhân vật | RPC `get_profile`, `{}` |
| Liên kết email cho tài khoản khách đang đăng nhập | `POST /v2/account/link/email` |
| Làm mới phiên | `POST /v2/account/session/refresh`, `{"token":"<refresh_token>"}` |
| Đăng xuất phiên | `POST /v2/session/logout`, `{"token":"<token>","refresh_token":"<refresh_token>"}` |

Đăng ký, đăng nhập và refresh dùng HTTP Basic `server_key:`. Các API còn lại
dùng `Authorization: Bearer <token>`. Body đăng ký/đăng nhập email:

```json
{"email":"dao_huu@example.com","password":"a-long-personal-password"}
```

Tên đăng nhập 3–20 ký tự ASCII: chữ, số, `_`; phân biệt hoa/thường. Tên hiển thị
có thể dùng tiếng Việt qua `PUT /v2/account` với `display_name` (1–30 ký tự).
Email chuẩn hóa chữ thường, 10–254 byte theo giới hạn Nakama. Mật khẩu tạo mới
ít nhất 10 ký tự, tối đa 72 byte UTF-8; không cắt khoảng trắng. Nakama băm mật khẩu
bằng bcrypt và phát access/refresh token; không lưu mật khẩu trong Storage.

`create=true` có tính lặp lại: nếu email đã tồn tại và mật khẩu đúng, Nakama trả
phiên của tài khoản đó với `created=false`. `create=false` không tự tạo tài khoản.
Email chưa được xác minh quyền sở hữu. Chưa có gửi email xác minh/khôi phục mật khẩu.

Compose đặt access token 15 phút, refresh token 7 ngày. Adapter giữ token trong RAM,
không ghi mật khẩu/token ra file. Khi hết access token, gọi `refresh_session()` rồi
thử lại thao tác phù hợp; không tự lặp thao tác gửi tin hay tạo nhóm sau lỗi mạng vì
server có thể đã hoàn thành thao tác đó. Logout đóng socket của adapter và thu hồi
token qua API Nakama. Thu hồi token của bản Nakama một node này dùng bộ nhớ server;
không coi đây là cơ chế thu hồi bền vững qua restart hoặc thu hồi mọi socket thiết bị.

Đăng nhập thiết bị của scene cũ chỉ được phép khi runtime env
`ALLOW_DEVICE_AUTH=true` (Compose local đã bật). Custom-ID authentication bị tắt.

## Bạn bè

| Thao tác | API |
|---|---|
| Tìm đúng tên đăng nhập | RPC `social_find_player`, `{"username":"dao_huu"}` |
| Gửi lời mời / chấp nhận lời mời nhận được | `POST /v2/friend?ids=<userId>` |
| Danh sách bạn / lời mời | `GET /v2/friend?state=0&limit=30&cursor=...` |
| Hủy kết bạn / hủy lời mời / từ chối / bỏ chặn | `DELETE /v2/friend?ids=<userId>` |
| Chặn người chơi | `POST /v2/friend/block?ids=<userId>` |

Trạng thái bạn bè: `0` đã kết bạn, `1` lời mời đã gửi, `2` lời mời nhận được,
`3` đã chặn. Bỏ `state` để lấy mọi trạng thái. Trả `cursor` để lấy trang tiếp.
Mỗi lần thay đổi tối đa 10 người; không được tự kết bạn. Bỏ chặn không khôi phục
quan hệ bạn bè. Thông báo kết bạn dùng hệ thống notifications gốc của Nakama.

## Tông môn và bang phái

Ở bản này, cả hai đều là tổ chức do người chơi tạo: `sect` = tông môn,
`guild` = bang phái. Hai loại dùng chung cơ chế phân quyền và có metadata khác nhau.
Chưa áp đặt luật mỗi người chỉ được tham gia một nhóm; có thể thuộc nhiều nhóm,
kể cả nhiều nhóm cùng loại. Tông môn NPC và liên minh liên bang sẽ là hệ thống khác.

| Vai trò | State | Quyền |
|---|---|---|
| Tông chủ / bang chủ | `0` | Duyệt/từ chối, cập nhật giới thiệu, đuổi cấp dưới, bổ nhiệm/hạ chức trưởng lão, giải tán |
| Trưởng lão / quản lý | `1` | Duyệt/từ chối đơn, cập nhật giới thiệu, đuổi thành viên |
| Thành viên | `2` | Xem thành viên, chat nội bộ, rời nhóm |
| Đang xin gia nhập | `3` | Hủy đơn bằng `leave`; chưa có quyền chat hoặc xem danh sách thành viên |

Tối đa **50 thành viên** gồm người tạo. Nhóm luôn phải duyệt đơn. Tên nhóm duy nhất
trên toàn server, 3–32 ký tự; giới thiệu tối đa 300 ký tự. Mỗi nhóm có một người
lãnh đạo ở phiên bản này. Chưa có chuyển quyền lãnh đạo: người lãnh đạo chỉ có thể
giải tán, không dùng `leave` để xóa nhầm nhóm. Giải tán phải gửi lại đúng tên nhóm.

| RPC | Payload mẫu |
|---|---|
| `social_group_create` | `{"kind":"sect","name":"Thanh Vân Môn","description":"Cùng nhau tu luyện"}` |
| `social_groups` | `{"kind":"sect","query":"Thanh","limit":30,"cursor":""}` |
| `social_groups` (nhóm của mình, gồm cả đơn đang chờ) | `{"mine":true,"limit":30,"cursor":""}` |
| `social_group_members` | `{"groupId":"<id>","limit":30,"cursor":""}` |
| `social_group_members` (đơn xin vào, chỉ quản lý) | `{"groupId":"<id>","state":3}` |
| `social_group_action` — xin vào | `{"groupId":"<id>","action":"join"}` |
| `social_group_action` — duyệt/từ chối | `{"groupId":"<id>","action":"approve","userId":"<id>"}` hoặc `reject` |
| `social_group_action` — chức vụ/thành viên | `{"groupId":"<id>","action":"promote","userId":"<id>"}` hoặc `demote`, `kick` |
| `social_group_action` — rời / hủy đơn | `{"groupId":"<id>","action":"leave"}` |
| `social_group_action` — sửa giới thiệu | `{"groupId":"<id>","action":"update","description":"Giới thiệu mới"}` |
| `social_group_action` — giải tán | `{"groupId":"<id>","action":"disband","confirmName":"Thanh Vân Môn"}` |

`promote` chỉ đổi thành viên → quản lý; `demote` đổi quản lý → thành viên.
Không tự phong chức, không quản lý người ngang/cao hơn, không duyệt người chưa xin vào.
Các thay đổi nhóm có khóa Storage CAS để tránh hai yêu cầu kiểm tra cùng trạng thái
rồi thăng chức hai lần. Khóa có lease 120 giây và xóa theo version; nếu server chết
giữa thao tác, đợi lease hết rồi tải lại trạng thái. Đây không phải giao dịch đa hệ
thống hay cơ chế chống thao tác lặp hoàn chỉnh. Không thêm external I/O vào vùng khóa.

Danh sách trả `groups` hoặc `userGroups`, danh sách thành viên trả `groupUsers`;
đều có `cursor`. Lọc loại nhóm/ẩn đơn chờ thực hiện trên trang gốc, nên trang có thể
ít kết quả hoặc rỗng nhưng vẫn có cursor: tiếp tục tới khi cursor rỗng. Giữ nguyên
bộ lọc khi dùng cursor. Tìm nhóm theo tiền tố, không nhận wildcard từ client.

## Trò chuyện

| Kênh | RPC `type` | `targetId` | Socket join |
|---|---|---|---|
| Thế giới | `world` | Bỏ trống | type `1`, target `world:vi:1` |
| Riêng giữa bạn bè | `direct` | ID người kia | type `2`, target ID người kia |
| Tông môn / bang | `group` | ID nhóm | type `3`, target ID nhóm |

- Gửi: RPC `social_chat_send`, `{"type":"direct","targetId":"<id>","text":"Chào đạo hữu"}`.
- Lịch sử: RPC `social_chat_history`, `{"type":"group","targetId":"<id>","limit":30,"cursor":""}`.
- Lịch sử mới nhất trước, dùng `nextCursor` để lấy cũ hơn; `messages[].content`
  là chuỗi JSON chứa `text`. Client đảo thứ tự khi hiển thị từ cũ đến mới.
- Subscribe WebSocket `/ws?format=json&status=true&token=<token>`; gửi
  `{"cid":"1","channel_join":{"type":3,"target":"<groupId>","persistence":true}}`.
  Tin đến có `channel_message` theo tên trường snake_case. RPC trả camelCase.
- Khi kết nối lại: refresh nếu cần → mở socket → join lại từng kênh → tải lịch sử.
  Ghép tin theo `message_id`/`messageId` để loại trùng giữa live và lịch sử.
- Chỉ plain text 1–500 ký tự, không chứa ký tự điều khiển. Hiển thị bằng `Label`
  hoặc tắt BBCode ở `RichTextLabel`. Không dùng nội dung chat như lệnh hay mã HTML.
- Người gửi được lấy từ phiên/tài khoản thật. Chỉ lưu `{text}`; bỏ qua sender,
  chức vụ và các trường client cố thêm. Tin luôn được lưu.
- Mỗi lần gửi/đọc kiểm tra lại bạn bè hoặc tư cách thành viên. Sau chặn/hủy kết bạn,
  cả gửi và lịch sử DM bị từ chối. Người rời/bị đuổi mất quyền gửi/đọc chat nhóm.
  Chặn không lọc người đó khỏi kênh thế giới/nhóm chung ở phiên bản này.

Socket chỉ subscribe/nhận; gửi và đọc lịch sử qua RPC. Native chat send/edit/delete,
native history, native thay đổi nhóm và native ghi/xóa Storage đã bị chặn. Dùng đúng
API trong tài liệu này khi nối SDK khác để tránh lỗi `403`.

## Dùng trong Godot

`client/scripts/social_api.gd` là node tái sử dụng; thêm vào scene hoặc Autoload.
Scene di chuyển cũ giữ nguyên. Ví dụ handler trong UI sau khi đã nhập tài khoản:

```gdscript
var api := SocialApi.new()

func _ready() -> void:
    add_child(api)
    api.chat_message_received.connect(_on_chat)

func submit_login(identifier: String, password: String) -> void:
    var result := await api.login(identifier, password)
    if result.has("error"):
        return # Hiển thị result.error trong UI.
    await api.connect_chat()
    await api.join_chat("world")

func _on_chat(message: Dictionary) -> void:
    var content: Dictionary = JSON.parse_string(message.get("content", "{}"))
    # Đưa content.get("text", "") vào Label; không in token/session.
```

Đăng ký: `api.register_account(email, password, username)`.
Tìm/kết bạn: `api.call_rpc("social_find_player", {"username": name})` rồi
`api.add_friend(result.userId)`. Tạo nhóm: `api.call_rpc("social_group_create", payload)`.
Các hàm trả Dictionary; lỗi có `error` và `status`. Tắt nút khi đang gửi thao tác.
UI cần cung cấp nhập email/mật khẩu, danh sách bạn, danh sách nhóm và cửa sổ chat;
các màn hình đó chưa được dựng trong thay đổi backend này.

## Giới hạn vận hành của bản đầu

Giới hạn: email/guest auth 30 lần/phút/IP, thay đổi bạn bè 30 lần/phút/người,
tạo nhóm 2 lần/phút/người, thay đổi nhóm 30 lần/phút/người, gửi chat 5 lần/5 giây
và 60 lần/phút/người. Bộ đếm dùng Storage CAS, không phụ thuộc một JS VM. Đây là
giới hạn cửa sổ cố định, có thể có burst ở ranh giới; không thay thế chống DDoS.
Các bản ghi IP hết hạn cần chính sách dọn khi triển khai lâu dài.

Đây là backend phát triển chạy một Nakama node trên localhost. Trước khi đưa lên
Internet cần cấu hình TLS/WSS, khóa ký phiên/server và mật khẩu DB riêng, tắt guest,
xác minh/khôi phục email, chính sách lưu/xóa chat, công cụ báo cáo/quản trị và
kiểm thử tải. Chưa tích hợp chiến đấu, PvP, liên server, tài sản bang, đóng góp,
chuyển bang chủ hay triển khai công khai.

## Nguồn đối chiếu

- [Heroic Labs — Authentication](https://heroiclabs.com/docs/nakama/concepts/authentication/)
- [Heroic Labs — Friends](https://heroiclabs.com/docs/nakama/concepts/friends/)
- [Heroic Labs — Groups](https://heroiclabs.com/docs/nakama/concepts/groups/)
- [Heroic Labs — Realtime chat](https://heroiclabs.com/docs/nakama/concepts/chat/)
- [Runtime TypeScript](https://heroiclabs.com/docs/nakama/server-framework/typescript-runtime/function-reference/)
- [Nakama v3.37.0 source](https://github.com/heroiclabs/nakama/tree/v3.37.0)
- [Runtime definitions v1.44.2](https://github.com/heroiclabs/nakama-common/tree/v1.44.2)
