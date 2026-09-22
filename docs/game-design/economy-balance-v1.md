# Economy Balance v1 — Linh Thạch, giao dịch và cường hóa

**Ngày chốt thiết kế:** 22/09/2026  
**Trạng thái:** design/data + validator; chưa phải runtime shop/market/cường hóa.  
**Nguồn dữ liệu:** `design-samples/progression-pve.v1.json`.

## 1. Đơn vị cân bằng chuẩn

Dùng một chuyến Trúc Âm mẫu làm đơn vị thay vì đặt giá tuyệt đối:

| Chỉ số | Giá trị |
| --- | ---: |
| Thời gian mục tiêu | 15–20 phút |
| Tiền gross từ NPC | 120 |
| Chi phí bắt buộc mẫu | 60 |
| Tiền ròng | **60** |
| Chuyến/giờ | 3–4 |
| Thu nhập ròng liên tục | **180–240/giờ** |

Gọi **1U = 60 Linh Thạch = 1 chuyến chuẩn**.

Giá mới phải trả lời được “mất bao nhiêu U/chuyến chơi”, không chỉ “con số có đẹp không”.

## 2. Thang chi tiêu

| Nhóm | Mục tiêu |
| --- | --- |
| Vật tư rất nhỏ | 0,1–0,3U |
| Consumable thường | 0,5–1U |
| Consumable tiện lợi NPC | 1–1,5U |
| Mở công thức | 1–2U |
| Gear cơ bản | 3–5U |
| Gear tốt | 8–15U |
| Gear hiếm | 15–30U |
| Đầu tư dài hạn | 30–60U |

Đây là khung cân bằng, không phải cam kết mọi item ở cùng nhóm luôn phải bằng nhau.

## 3. NPC price floor / ceiling

NPC mua tạo **giá sàn**, NPC bán tạo **giá trần tiện lợi**.

| Item | NPC mua | NPC bán | Market mục tiêu |
| --- | ---: | ---: | ---: |
| Da Sơn Trư | 30 | — | 30–50 |
| Cam Lộ | 10 | — | 12–18 |
| Tĩnh Tâm | 10 | — | 12–18 |
| Ích Khí | 10 | — | 12–18 |
| Trúc | 10 | — | 12–20 |
| Thiết quặng | 10 | — | 12–22 |
| Tơ nhện | 10 | — | 15–25 |
| Linh sa | 10 | — | 20–35 |
| Nước | — | 10 | 8–9 |
| Hạt giống | — | 30 | 24–29 |
| Hồi Nguyên Hoàn | 20 | 80 | 60–70 |
| Ích Khí Tán | 20 | — | 70–90 |
| Hộ Thân Phù | 20 | — | 85–105 |
| Thoát Thân Phù | 20 | — | 85–105 |
| Thanh Thiết Kiếm | — | — | 190–220 |

Quest item/Mạch Bàn không market. Áo vải starter chưa market cho đến khi có repeatable source.

## 4. Craft và tương quan thu nhập

| Công thức | Phí | Chuyến chuẩn chỉ tính phí |
| --- | ---: | ---: |
| Hồi Nguyên Hoàn | 20 | 0,33U |
| Ích Khí Tán | 30 | 0,50U |
| Hộ Thân Phù | 40 | 0,67U |
| Thanh Thiết Kiếm | 80 | 1,33U |
| Thoát Thân Phù | 40 | 0,67U |

Ví dụ kiếm dùng 6 quặng + 2 trúc + phí 80. Với giá sàn NPC của vật liệu, chi phí kinh tế tối thiểu là 160. Market 190–220 tạo khoảng lợi nhuận đủ cho crafter mà chưa khiến gear cơ bản thành mục tiêu nhiều giờ.

## 5. Market và trade

MVP market dùng **một chợ toàn server** để giữ thanh khoản.

- Listing fee: **1%**, mất ngay khi đăng.
- Sales tax: **4%**, chỉ khi bán thành công.
- Direct trade fee: **1%**.
- Tối đa 8 sell order/account.
- Item rao bán phải nằm trong server escrow.
- Premium currency không trade.
- Thuế bị xóa khỏi supply, không chuyển vào “ví hệ thống” để chi lại.

Market tax là sink phụ. Với thu nhập ròng 60/chuyến, bán một item 200 chỉ xóa khoảng 10 qua tổng fee 5%; không thể dựa vào market tax để xử lý toàn bộ faucet.

## 6. Cường hóa +1 → +5

Cường hóa v1 là sink lớn nhưng **không dùng RNG phá đồ**.

| Mức | Linh Thạch | Vật liệu | Bonus tổng |
| --- | ---: | --- | ---: |
| +1 | 30 | Quặng ×2 | +3% |
| +2 | 60 | Quặng ×4 | +6% |
| +3 | 120 | Linh sa ×2 | +9% |
| +4 | 240 | Linh sa ×4 | +12% |
| +5 | 480 | Linh sa ×8 | +15% |

Tổng tiền: **930**. Giá trị vật liệu sàn tham chiếu: **200**. Tổng kinh tế tối thiểu: **1.130**.

930 / 60 = **15,5 chuyến chỉ tính tiền**; khi cộng vật liệu, tổng tham chiếu khoảng **18,8 chuyến**, tức khoảng 5–7 giờ tùy nhịp chơi. Đây là đầu tư build dài hạn, không phải yêu cầu để hoàn thành story.

## 7. Nguồn tiền và sink

### Faucet

- Quest chính: một lần, tổng **700**.
- NPC mua vật liệu thực tế.
- Compensation/admin chỉ khi có audit source rõ.

Không cho quái thường rơi Linh Thạch trực tiếp. PvP kill không sinh Linh Thạch.

### Sink

- Nước/hạt/consumable NPC.
- Phí craft.
- Research recipe.
- Market/direct-trade fee.
- Cường hóa.
- Về sau: kho, vận chuyển, tông môn, động phủ, cosmetic prestige.

## 8. Starter và migration

Runtime hiện có `starter:v1` = 12 Linh Thạch. Source này đã immutable và có receipt.

Economy v1 chỉ **lập kế hoạch**:

`starter:v2` = 120 Linh Thạch + cùng bộ item.

- Chỉ áp dụng cho nhân vật mới sau economy cutover.
- Không tự cho người nhận v1 claim v2.
- Nếu muốn bù người cũ, phải có migration/compensation source riêng có audit; không tái sử dụng starter source.

## 9. Mục tiêu supply dài hạn

Khi market + enhancement đã hoạt động, mục tiêu thử:

**sink / faucet = 80–90% theo tuần**.

Không cân theo từng phiên chơi. Một người có thể tích tiền nhiều giờ rồi tiêu ở cường hóa/kho/tông môn.

Nếu faucet = 400/h thì tổng sink dài hạn nên khoảng 320–360/h trên trung bình quần thể, để supply vẫn tăng chậm thay vì đứng yên hoặc lạm phát mạnh.

## 10. Telemetry bắt buộc

Theo dõi theo ngày/tuần:

- currency faucet theo source;
- currency sink theo source;
- total money supply;
- wallet P50/P90/P99 theo cảnh giới;
- market volume;
- market tax destroyed;
- item created/destroyed;
- basket price index;
- thời gian farm mỗi item;
- số consumable dùng/chuyến;
- tỷ lệ người tự craft so với mua.

Basket v1: Da Sơn Trư, Cam Lộ, Tơ Nhện, Thiết quặng, Linh sa, Hồi Nguyên Hoàn, Ích Khí Tán, Thanh Thiết Kiếm.

## 11. Điều kiện thay đổi balance

Không auto-adjust giá hằng ngày. Chỉ review khi có đủ playtest/telemetry.

Cần cảnh báo nếu:
- money supply/player tăng liên tục nhanh hơn activity;
- P90/P50 wallet ratio tăng mạnh;
- basket price index tăng/giảm >15% qua nhiều kỳ;
- một source tạo phần lớn faucet;
- một sink chiếm quá nhiều và trở thành bắt buộc;
- một nguyên liệu không còn utility và rơi về NPC floor.

Mỗi lần đổi số: sửa JSON → chạy validator → đồng bộ generated tables → playtest → ghi version.
