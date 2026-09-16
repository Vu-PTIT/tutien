# 03 — Chiến đấu, công pháp, pháp khí và kẻ địch

**Phạm vi:** top-down 2D, PvE và đấu tập; mọi số là giá trị khởi đầu cho playtest.  
**Nguyên tắc:** server xác định kết quả, client hiển thị và dự đoán có kiểm soát.

## 1. Cảm giác chiến đấu

Trận đánh tốt là một chuỗi quyết định: nhìn đòn → giữ vị trí → dùng tài nguyên → tận dụng khoảng trống → cân nhắc tiếp tục. Người chơi không cần bấm 10 kỹ năng, nhưng phải có lý do dùng từng kỹ năng.

MVP ưu tiên ít mục tiêu, đòn báo rõ và lối thoát. Không đặt hiệu ứng che toàn bộ mặt đất. Kỹ năng mạnh có nhịp chuẩn bị hoặc đánh đổi linh lực.

## 2. Điều khiển và trạng thái

Windows: WASD/phím mũi tên di chuyển; chuột trái đánh thường; Space né; Q/E/R dùng ba kỹ năng; F tương tác; 1/2 dùng vật phẩm; Tab mở Mạch Bàn.

Các phím phải có thể đổi trong cài đặt. Android dùng joystick trái, cụm hành động phải; xem 09. Lệnh gameplay là action ID, không gắn logic trực tiếp vào tên phím.

### Máy trạng thái nhân vật

`idle / moving / windup / active / recovery / dodging / incapacitated / dead`.

- Đánh thường cho hủy windup trước thời điểm active; chưa active thì chưa tiêu linh lực.
- Kỹ năng tiêu linh lực khi server chấp nhận chuyển sang active; thông báo rõ nếu bị ngắt trước đó.
- Không bắt đầu né khi đang dead, bị khóa điều khiển hoặc chưa hồi chiêu.
- Không chồng hai active để nhân đôi sát thương.
- Đổi map, đổi loadout và bắt đầu đấu tập bị khóa khi đang có tác động chiến đấu.

## 3. Bộ sáu hành động MVP

`sk_basic` và `sk_dodge` không chiếm ô kỹ năng chủ động. Ba ô chủ động dành cho Phi Nhận, Hộ Thân, Trói Mộc. `sk_scan` là hành động khám phá.

| ID | Mở khóa | Linh lực | Hồi chiêu | Tác dụng cơ bản |
|---|---|---:|---:|---|
| `sk_basic` | Đầu game | 0 | 0,7 s | Chém cung phía trước, tầm 1,3 tile |
| `sk_dodge` | Hướng dẫn | 0 | 2,4 s | Lướt 2,2 tile trong 0,25 s, không xuyên tường |
| `sk_phi_nhan` | Luyện Khí 1 | 10 | 3 s | Đạn thẳng, tầm 6 tile, tốc độ 10 tile/s |
| `sk_ho_than` | Luyện Khí 2 | 14 | 10 s | Khiên hấp thụ 35 sát thương, tối đa 5 s |
| `sk_troi_moc` | Luyện Khí 3 | 12 | 8 s | Vùng nhỏ tầm 4 tile, giảm tốc 50% trong 1,5 s, tối đa 2 mục tiêu |
| `sk_scan` | Nhận Mạch Bàn | 0 | 5 s | Dò dấu vết trong 6 tile, cần đứng yên 1 s |

Né không tiêu linh lực để phàm nhân và người cạn linh lực vẫn có phương án phòng vệ; giới hạn bởi cooldown và vị trí.

Né có cửa sổ miễn sát thương từ 50 đến trước 200 ms sau khi bắt đầu, do server quyết định. Với tick 50 ms phải kiểm tra biên từng tick. Đòn không thể né, nếu có, phải có ký hiệu riêng; MVP chưa cần loại đòn này.

Hồi linh lực khi không có hành động active: 3 điểm/s trong chiến đấu, 6 điểm/s ngoài chiến đấu. Sau lần gây/nhận sát thương cuối 5 giây mới được coi là ngoài chiến đấu. Không hồi HP tự động giữa trận.

## 4. Công thức sát thương mẫu

```text
raw = attack * coefficient + flatBonus
mitigated = raw * 100 / (100 + max(0, defense))
damage = max(1, floor(mitigated))
```

Các hệ số: đánh thường 1,0; Phi Nhận 1,6 với `flatBonus = 4`; Trói Mộc 0,6. Khiên nhận sát thương trước HP. MVP không có chí mạng ngẫu nhiên, xuyên giáp, hơn mười hệ kháng hoặc nhân sát thương theo chênh cảnh giới.

Ví dụ: công kích 16, Phi Nhận, đối thủ phòng ngự 20 → `floor((16×1,6+4)×100/120) = 24`.

Khi trúng nhiều mục tiêu, server tính riêng phòng ngự mỗi mục tiêu. Sát thương không được client truyền lên. Kiểm tra số hữu hạn, giới hạn giá trị và catalog đúng phiên bản.

### Luật hiệu ứng

Trói Mộc không cộng dồn phần trăm. Hiệu ứng mới không kéo dài quá 1,5 giây kể từ lần áp dụng mới; mục tiêu được miễn tái áp dụng làm chậm trong 2 giây sau khi hết hiệu ứng. Hộ Thân dùng giá trị lớn nhất, không cộng các khiên cùng loại.

## 5. Công pháp và hướng build

### MVP: Tức Mạch Quyết — `cp_tuc_mach`

Một công pháp cơ bản giúp cảm nhận dòng linh khí và duy trì linh lực. Nó cung cấp bộ kỹ năng trên; không có đặc quyền sao chép hoặc nhân tài nguyên.

### Alpha: ba hướng, cùng ngân sách sức mạnh

| Hướng | Điểm mạnh | Đánh đổi | Vai trò khi co-op |
|---|---|---|---|
| Kiếm/pháp khí cơ động | Đổi vị trí, đánh điểm yếu | Phòng ngự thấp hơn, cần canh nhịp | Gây áp lực |
| Phù thuật | Chuẩn bị vùng và thời điểm | Tiêu vật tư hoặc có thời gian đặt | Khống chế |
| Thủ ngự/trận pháp | Bảo vệ và kiểm soát khu vực | Cơ động kém hơn | Tạo khoảng an toàn |

Đây là ba cách chơi, không phải class cố định. Khôi lỗi và linh thú để sau vì tăng độ phức tạp AI, đồng bộ và UI.

## 6. Trang bị và pháp khí

MVP có ba ô chiến đấu: pháp khí chính, giáp và hộ cụ. Mạch Bàn là công cụ riêng, không chiếm ô pháp khí.

`Thanh Thiết Kiếm` cộng 4 công kích. `Áo Vải Bền` cộng 5 phòng ngự. Ô hộ cụ ban đầu để trống hoặc dùng hiệu ứng từ vật phẩm; không cần tạo hàng chục đồ để lấp UI.

Pháp khí có định nghĩa chung và instance sở hữu riêng. Dù cùng loại kiếm, mỗi instance phải có ID duy nhất nếu về sau có nâng cấp/độ bền.

### Tiến bộ trang bị

MVP chỉ chế tạo đồ chỉ số cố định. Không cường hóa có xác suất, không phá hủy đồ, không reroll thuộc tính. Alpha có thể nâng bậc bằng nguyên liệu và lựa chọn một hiệu ứng; chi phí, lợi ích và hoàn nguyên phải hiển thị trước khi xác nhận.

Đồ hiếm nên thay quyết định, ví dụ giảm tầm nhưng tăng độ rộng Phi Nhận, thay vì chỉ tăng 50% mọi chỉ số.

## 7. Vật phẩm chiến đấu

Hai ô nhanh, dùng chung cooldown vật phẩm 8 giây. Hồi Nguyên Hoàn hồi 30 HP; Ích Khí Tán hồi 25 linh lực. Không tiêu vật phẩm khi HP/linh lực đã đầy và UI phải nói rõ lý do.

Hộ Thân Phù tạo khiên 25 trong 4 giây; không cộng với Hộ Thân, dùng mức cao hơn. Thoát Thân Phù channel 3 giây về checkpoint an toàn, ngắt khi nhận sát thương, chỉ dùng PvE và mất vật phẩm khi teleport được commit.

Đấu tập dùng vật tư mô phỏng hoặc vô hiệu hóa đồ tiêu hao thật; không rút đồ khỏi inventory persistent.

## 8. Năm mẫu kẻ địch

| ID | Loại | HP solo | Cơ chế dạy người chơi | Nơi gặp |
|---|---|---:|---|---|
| `en_boar` Sơn Trư | Thường | 60 | Gầm báo trước rồi lao thẳng | Trúc Âm |
| `en_spider` Độc Chu | Thường | 45 | Vệt độc dễ thấy, tránh đứng lâu | Trúc Âm / Cổ Tỉnh |
| `en_scout` Kẻ Rình Đường | Thường | 80 | Bắn từ xa, né sau vật cản | Thạch Cạn |
| `en_guard` Thạch Vệ | Tinh anh | 180 | Đỡ mặt trước, lộ sườn sau đòn | Thạch Cạn / Cổ Tỉnh |
| `en_boss` Mộc Tâm Thủ Trận | Boss | 700 | Đọc hai dạng báo đòn và phá nguồn cấp | Cổ Tỉnh |

MVP co-op hai người: HP quái thường ×1,4, tinh anh/boss ×1,6; sát thương không tăng. Loot cấp cá nhân theo thiết kế, không chia đôi vật phẩm nhiệm vụ. Hệ số là điểm bắt đầu cần test.

### AI tối thiểu

`patrol → notice → chase → windup → attack → recover → return`.

Có bán kính truy đuổi và đường về, nhưng không reset HP/loot một cách có thể khai thác. Boss bắt đầu encounter riêng; reset không phát phần thưởng. Quái không được chọn mục tiêu xuyên vách hoặc xuyên map.

## 9. Boss chương đầu

**Pha 1, HP 100–60%:** đòn quét có vùng báo 0,7 giây và rễ thẳng báo 0,9 giây. Đường tránh phải đủ rộng cho nhân vật không có tăng tốc.

**Pha 2, HP 60–25%:** hai trụ linh mạch lần lượt hoạt động. Phá trụ hoặc dùng Mạch Bàn đọc điểm ngắt sẽ làm giảm áp lực. Người chơi không bắt buộc có vật phẩm hiếm.

**Pha 3, HP dưới 25%:** boss yếu đi, mở cơ hội niêm phong. Có thể hạ hoàn toàn hoặc hoàn thành thao tác ngắt trận theo quest. Hai cách cùng mở tiến trình; khác hội thoại và một phần tín nhiệm.

Không có “pha hai chỉ tồn tại khi đủ hai người”. Solo và co-op đều giải được.

## 10. Server-authoritative và phản hồi client

Mô hình authoritative được Nakama hỗ trợ, nhưng hitbox, AI và luật chiến đấu vẫn phải tự viết. Nguồn S02/S03 trong [15](15-sources-and-change-log.md).

Server kiểm tra danh tính phiên, match/epoch, thứ tự input, số lần gửi, trạng thái sống, skill sở hữu, cooldown, linh lực, vị trí và va chạm. Client chỉ gửi ý định và hướng ngắm.

Client có thể phát hoạt ảnh dự đoán, nhưng HP, đồ, chết và thưởng chờ kết quả server. Không sử dụng vật lý Godot client làm bằng chứng đánh trúng.

Không rewind theo timestamp tùy ý do client gửi trong MVP. Độ trễ cao cần được hiển thị; thiết kế telegraph và nội suy được thử dưới mạng giả lập, không cam kết “không lag”.

## 11. Chết, reset và rút lui

PvE MVP: về checkpoint, không mất đồ đang sở hữu, không tụt tầng. Vật phẩm đã dùng hợp lệ vẫn bị tiêu. Encounter thất bại không cấp thưởng; loot đã commit ở encounter trước vẫn giữ.

Đấu tập: kết thúc trận, phục hồi trạng thái trước trận; không ghi HP mô phỏng hay vật tư dùng thử vào trạng thái PvE.

Disconnect không cho bất tử: nhân vật giữ trạng thái trong thời gian reconnect ngắn; chính sách cụ thể ở 10. Không làm trừng phạt mất tài sản khi mạng kém.

## 12. Nghiệm thu chiến đấu

Phải kiểm tra: đạn không xuyên tường; né không xuyên vật cản; một cast chỉ gây hit đúng số lần; spam input không tăng tốc; làm chậm không khóa vô hạn; chết đồng thời chỉ có một kết quả; boss solo/co-op đều giải được; hai client thống nhất HP và kết quả; reset không phát thưởng lặp.
