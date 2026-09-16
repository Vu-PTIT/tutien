# 07 — Vườn linh thảo, chế tạo và kinh tế

**Mục tiêu:** đời sống cung cấp sự chuẩn bị cho hành trình, không trở thành hệ thống chờ vô hạn hoặc nguồn nhân tiền.

## 1. Vòng tài nguyên

Khám phá → tìm giống/nguyên liệu → trồng và chế tạo → mang vật tư đi → vượt thử thách → nhận tri thức và nguồn mới → cải thiện phương án chuẩn bị.

Người không thích làm vườn có thể mua lượng vật tư cơ bản từ NPC bằng thu nhập chơi bình thường. Vườn tạo khả năng tự chủ và tối ưu chi phí, không phải nghĩa vụ đăng nhập tưới cây mỗi vài giờ.

## 2. Vườn MVP

Sáu ô đất cá nhân, hiển thị dạng UI ở An Khê. Mỗi ô có một cây; mỗi lượt trồng dùng một hạt giống và một đơn vị nước. Không có mùa vụ, thời tiết gây chết cây, sâu bệnh phá toàn bộ vườn hoặc người khác lấy trộm.

### Ba loại cây

| ID cây | Hạt / sản phẩm | Thời gian thường | Sản lượng cơ bản | Dùng vào |
|---|---|---:|---:|---|
| `crop_cam_lo` | Cam Lộ | 20 phút | 4 | Đan hồi phục |
| `crop_tinh_tam` | Tĩnh Tâm | 45 phút | 4 | Đan linh lực, phù thoát |
| `crop_ich_khi` | Ích Khí | 60 phút | 4 | Đan linh lực |

Mẻ hướng dẫn trong `q_main_004` trưởng thành 60 giây. Server cấp boost một lần, gắn với quest và ô trồng cụ thể; không có biến `tutorial=true` để client tự gửi.

Cây sẵn sàng sẽ chờ người chơi thu, không hỏng vì đăng nhập muộn. Offline vẫn tăng trưởng vì server so sánh thời gian, không vì client chạy mô phỏng.

## 3. Trạng thái cây và thời gian

`empty → growing → ready → harvested → empty`.

Dữ liệu ô gồm `plotId`, `cropId`, `plantedAt`, `readyAt`, `plantingId`, `boostSource`, `stateVersion`. Không lưu một progress phần trăm do client cập nhật.

`remaining = max(0, readyAt - serverNow)`. Client nội suy bộ đếm chỉ để hiển thị; nhận lại giờ chuẩn sau reconnect.

Thu hoạch hợp lệ phải đồng thời: xác nhận chủ sở hữu, đủ thời gian, ô chưa được thu, đủ chỗ túi; thêm sản phẩm và chuyển trạng thái ô trong cùng giao dịch. Double-click không thu hai lần.

## 4. Danh mục 24 vật phẩm MVP

| Nhóm | ID |
|---|---|
| Sáu hạt/cây | `it_seed_cam_lo`, `it_herb_cam_lo`, `it_seed_tinh_tam`, `it_herb_tinh_tam`, `it_seed_ich_khi`, `it_herb_ich_khi` |
| Nước và vật liệu | `it_water`, `it_bamboo`, `it_iron`, `it_spirit_dust`, `it_spider_silk`, `it_boar_hide`, `it_venom` |
| Bốn đồ tiêu hao | `it_heal_pill`, `it_qi_pill`, `it_ward_talisman`, `it_escape_talisman` |
| Trang bị/công cụ | `it_iron_sword`, `it_cloth_armor`, `it_mach_ban` |
| Bốn đồ tiến trình | `it_water_sample`, `it_ledger`, `it_array_shard`, `it_well_key` |

Linh thạch là số dư tiền tệ nguyên, không thêm một item vào danh mục trên. Không có kim cương hoặc tiền premium trong MVP.

Vật phẩm tiến trình và Mạch Bàn gắn nhân vật, không bán. Trang bị có instance ID; stack nguyên liệu có giới hạn 99. Túi mẫu 24 ô, nhưng số định nghĩa vật phẩm không đồng nghĩa mỗi loại chỉ dùng một ô.

## 5. Năm công thức

| ID | Nguyên liệu | Phí linh thạch | Kết quả |
|---|---|---:|---|
| `rc_heal` | 2 Cam Lộ + 1 nước | 2 | 1 Hồi Nguyên Hoàn |
| `rc_qi` | 2 Ích Khí + 1 Tĩnh Tâm | 3 | 1 Ích Khí Tán |
| `rc_ward` | 2 tơ nhện + 1 linh sa | 4 | 1 Hộ Thân Phù |
| `rc_sword` | 6 thiết quặng + 2 trúc | 8 | 1 Thanh Thiết Kiếm |
| `rc_escape` | 2 Tĩnh Tâm + 1 trúc | 4 | 1 Thoát Thân Phù |

MVP chế tạo tại trạm, kết quả bảo đảm. Giao dịch tức thời; hoạt ảnh 2–3 giây chỉ là trình bày và không được client dùng để quyết định kết quả. Không có job nền chế tạo hoặc hàng đợi nhiều giờ trong MVP.

Làm nhiều món gửi `quantity` nguyên trong khoảng 1–10; server nhân toàn bộ chi phí và kiểm tra túi trước. Không xử lý nửa mẻ mà UI báo đủ mẻ.

## 6. Mở công thức

Hồi phục mở trong nhiệm vụ 005. Đan linh lực và phù hộ thân mở qua giao dịch nghiên cứu tại Bà Sâm khi đến Luyện Khí 2. Kiếm mở qua side quest 004 hoặc học ở Đỗ Khê bằng khoản phí thường đã công bố. Phù thoát mở khi chuẩn bị vào Cổ Tỉnh.

Không để nhân vật thiếu tiền sau thất bại thì không có cách hồi phục: nghỉ tại hub miễn phí, vẫn có tuyến thu thập không cần đồ tiêu hao.

## 7. Giá và mục đích kinh tế

Giá mẫu để bắt đầu kiểm thử: hạt giống 3 linh thạch, nước 1, NPC mua linh thảo 1/đơn vị; sản lượng 4 làm trồng rồi bán thô không tự tạo lợi nhuận tiền tệ trước các chi phí khác.

NPC mua lại chế phẩm với giá thấp hơn tổng chi phí mua nguyên liệu và phí chế tạo. Với nguyên liệu tự khai thác, bán là đổi công sức thành tiền, không phải arbitrage mua–chế–bán vô hạn.

Không dùng giá này làm “giá thị trường chính thức”. Toàn bộ bảng shop cần khóa trong catalog runtime trước khi triển khai; JSON đính kèm chưa bao phủ danh sách mua/bán đầy đủ.

## 8. Nguồn và nơi tiêu

| Nguồn linh thạch | Giới hạn thiết kế |
|---|---|
| Quest một lần | Có cờ claim vĩnh viễn |
| Hợp đồng thu thập lặp sau chương đầu | Đo linh thạch/phút, không tạo bằng thao tác UI trống |
| Bán vật liệu NPC | Giá server, không nhận giá client |

| Nơi tiêu | Nguyên tắc |
|---|---|
| Hạt/nước, nghiên cứu công thức | Chi phí đoán được |
| Phí chế tạo | Đi cùng thành quả rõ ràng |
| Dịch vụ di chuyển tương lai | Không thu phí điểm hồi sinh thiết yếu |
| Tiện ích vườn Alpha | Nâng sự tiện lợi, không làm tài khoản mới hết đường chơi |

MVP chưa có thuế chợ, bảo trì công trình, trả lãi, phí kho bang hoặc cơ chế đánh vào người nghỉ chơi.

### Kịch bản budget một chuyến mẫu

Thu nhập giả lập 60 linh thạch; mua 4 hạt = 12, 4 nước để trồng = 4, 2 nước để luyện = 2, luyện hai hồi phục = 4, học/tích lũy cho mục tiêu = 20. Tổng sử dụng 42, còn 18.

Đây là một phép tính thiết kế, không phải dữ liệu chơi thực tế. Phải ghi nguồn thu cụ thể trong playtest, tránh giả định mọi người tự kiếm được 60 trong cùng thời gian.

## 9. Tài nguyên hiếm và cơ duyên

Nguyên liệu bắt buộc cho progression phải có nguồn bảo đảm hoặc tích lũy đổi. Alpha có thể thêm drop hiếm mang tính sưu tập/biến thể build, nhưng không dùng một drop quá hiếm để khóa Trúc Cơ.

Mạch Bàn giúp đọc nơi có nguồn hoặc điều kiện mở cửa; không tự tăng số tiền phát ra. “Cơ duyên” có thể là thông tin, công thức, một lựa chọn an toàn hơn hoặc quan hệ.

## 10. Chống mất và nhân đôi tài sản

Mỗi thao tác craft, mua, bán, thu hoạch, nhận thưởng và nâng tiến trình phải đi qua một dịch vụ kinh tế chung. Không để mỗi module tự sửa túi theo một quy tắc khác nhau.

Một thao tác có `operationId`, dấu vân tay payload, phiên bản trạng thái và kết quả đã commit. Cùng ID với payload khác phải báo lỗi. ID khác cũng không được nhận lại cùng một plot/quest/encounter đã hoàn thành.

MVP lưu tiền và túi trong cùng trạng thái gameplay; không trộn lệnh sửa Nakama wallet rời với sửa inventory rồi gọi đó là atomic. Thiết kế lưu cụ thể tại 10.

## 11. Giao dịch người chơi: chưa bật trong MVP

Trước khi mở cần escrow, khóa đồ được đề nghị, xác nhận lại sau mọi thay đổi, hết hạn, xử lý mất mạng và audit hai phía. Không triển khai bằng “trừ A rồi cộng B” qua hai RPC không cùng giao dịch.

Vật tư nhiệm vụ không giao dịch. Chuyển quà giữa tài khoản, kho bang và chợ phải là các hạng mục riêng có threat model.

## 12. Nghiệm thu

Không thể thu hai lần, craft âm nguyên liệu, giả giá bán, mua đồ với số âm, tràn số lượng, đổi giờ để thu sớm, mất vật tư vì túi đầy hoặc nhận lại đồ tiến trình. Chạy kiểm thử cạnh tranh và restart thật. Người chơi vẫn tiếp tục được sau khi dùng hết vật tư.
