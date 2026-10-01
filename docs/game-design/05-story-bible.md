# 05 — Story bible: Việt Nam sau Linh Chấn

**Trạng thái:** canon mới cho `feat/map-ui-rebuild`.  
**Phạm vi:** chương 1 đủ cụ thể để viết quest/map; tuyến vũ trụ chỉ gieo mầm.  
**Đọc cùng:** [04 — Bối cảnh Việt Nam thời Linh Chấn](04-world-setting-vietnam-awakening.md).

## 1. Tiền đề

Sáu năm sau **Đêm Linh Chấn**, Hà Nội và vùng lân cận đã ổn định trong các vành đai an toàn.
Ngoài các chốt kiểm soát, hệ sinh thái biến dị, dị thú và các điểm cộng hưởng linh năng
khiến nhiều tuyến đường cũ không còn thuộc về con người.

Nhân vật người chơi là một người trẻ vừa đủ điều kiện tham gia chương trình thực địa của
**Căn cứ Thăng Long**. Ban đầu mục tiêu rất đơn giản: sống sót ngoài vành đai, học chiến đấu,
thu tài nguyên và kiếm vị trí của mình trong xã hội mới.

Trong một chuyến khảo sát ở Ba Vì, người chơi phát hiện dữ liệu cho thấy một điểm cộng hưởng
đang bị kích hoạt theo chu kỳ nhân tạo. Vấn đề không chỉ là dị thú mạnh hơn — có thứ gì đó
đang tác động lên linh năng theo một quy luật không giống công nghệ Trái Đất.

## 2. Chủ đề

Con người thích nghi bằng kiến thức, cộng đồng và sức mạnh chứ không phải bằng việc quay về
thời cổ đại. Công nghệ và tu luyện cùng tồn tại; người mạnh vẫn phụ thuộc vào hậu cần,
bản đồ, thông tin, vật tư và đồng đội.

Chương đầu xoay quanh ba câu hỏi:
- ai được quyền đi vào vùng nguy hiểm và khai thác tài nguyên;
- nên công khai hay kiểm soát thông tin có thể gây hoảng loạn;
- con người đang khai thác linh năng, hay chỉ mới chạm vào thứ lớn hơn mình rất nhiều.

## 3. Quy tắc thế giới

Linh năng không phân bố đều. Hạ tầng hiện đại — cảm biến, đường vận tải, trạm điện, kho vật tư,
nhà kính, bệnh xá — quyết định một căn cứ có thể tồn tại đến đâu.

Dị thú không chỉ là "quái để farm". Mỗi loài phải có lãnh địa, hành vi và lý do sinh thái.
Vùng hoang dã phải cho cảm giác nguy hiểm hơn vì thông tin kém, cứu viện xa và môi trường biến đổi.

Không viết tổ chức nào thiện/ác tuyệt đối. Mỗi bên có mục tiêu hợp lý và giới hạn riêng.

## 4. Công cụ riêng: Máy Quét Linh Phổ

Vai trò cũ của Mạch Bàn được thay bằng **Máy Quét Linh Phổ** — thiết bị cầm tay do Viện Linh học
hiệu chỉnh cho người đi thực địa. Nó đọc mật độ linh năng, dấu chuyển động và nhiễu bất thường.

Thiết bị không tạo vật phẩm và không tự giải bí ẩn. Giá trị của nó nằm ở dữ liệu:
người chơi biết nơi nào nên vào, nơi nào nên tránh và dấu nào không khớp quy luật tự nhiên.

## 5. Sáu NPC chương đầu

| ID / tên | Vai trò | Mục tiêu riêng |
| --- | --- | --- |
| `npc_bs_lan` — Bác sĩ Lan | trạm y tế Căn cứ Thăng Long | giữ nguồn dược liệu ổn định |
| `npc_ky_su_nghiem` — Kỹ sư Nghiêm | vận hành cảm biến vành đai | tránh báo động giả nhưng không bỏ sót sự cố |
| `npc_luc_vi` — Lục Vi | hướng dẫn viên thực địa | mở lại một tuyến cứu hộ cũ |
| `npc_do_khe` — Đỗ Khê | kỹ thuật viên vũ khí | tìm hợp kim linh biến thay nguồn nhập khan hiếm |
| `npc_tong_duc` — Tống Đức | nghiên cứu viên Viện Linh học | chứng minh dữ liệu Ba Vì không phải nhiễu ngẫu nhiên |
| `npc_ha_to` — Hà Tố | thương lái vật tư | giữ mạng lưới cung ứng giữa căn cứ và các đội săn |

## 6. Các tổ chức

**Viện Linh học Thăng Long** — nghiên cứu linh năng, cấp thiết bị và quyền tiếp cận dữ liệu.

**Đội Vành Đai Tây** — tuần tra, cứu hộ, bảo vệ tuyến vận tải và các trạm cảm biến.

**Liên hiệp Thợ Săn** — nhận hợp đồng săn, khai thác, hộ tống và khảo sát.

**Doanh nghiệp Huyền Sa** — logistics và vật liệu linh biến; có lợi ích kinh tế riêng nhưng
không mặc định là phản diện.

Backend `sect/guild` vẫn là cộng đồng người chơi và không được đồng nhất với bốn tổ chức NPC này.

## 7. Chương 1 — Tín hiệu dưới Ba Vì

### Hồi A — Ra khỏi vành đai

Người chơi hoàn tất huấn luyện, học né/đánh/quét linh phổ và tham gia chuyến tuần tra ở
**Vành Đai Tây**. Một đàn Lợn Gai Sơn xuất hiện lệch khỏi vùng hoạt động thường lệ.

### Hồi B — Dấu bất thường

Tại **Rừng Ba Vì Dị Biến**, người chơi thu được dữ liệu từ cảm biến hỏng, mẫu vật và một
chuỗi xung linh năng lặp theo khoảng thời gian quá đều để là hiện tượng tự nhiên.

Kỹ sư Nghiêm muốn giữ kín để xác minh. Tống Đức muốn mở dữ liệu cho Viện. Hà Tố lo việc
phong tỏa sẽ cắt đứt tuyến cung ứng. Người chơi quyết định chia sẻ dữ liệu theo hướng nào.

### Hồi C — Trạm Thiên Mạch

Một cơ sở nghiên cứu cũ nằm sâu dưới Ba Vì được phát hiện. Phần lớn là công nghệ Trái Đất,
nhưng lõi cộng hưởng trong phòng sâu nhất chứa vật liệu không khớp hồ sơ chế tạo.

Một dị thú đầu đàn bị kích thích bởi xung cộng hưởng trở thành boss chương 1. Người chơi có thể
ngắt nguồn cưỡng bức hoặc giữ hệ thống hoạt động đủ lâu để sao chép dữ liệu.

### Kết chương

Căn cứ an toàn hơn nhưng câu hỏi lớn hơn xuất hiện: các điểm cộng hưởng ở những vùng khác
trên Trái Đất có cùng nhịp xung. Trong dữ liệu cuối cùng có một tín hiệu hướng lên quỹ đạo.

## 8. Hệ quả lựa chọn

| Lựa chọn | Hệ quả gần | Hệ quả sau |
| --- | --- | --- |
| chia dữ liệu kín / công khai | thay phản ứng NPC và quyền xem một số log | thay nguồn thông tin chương 2 |
| tắt lõi / giữ lõi để sao chép dữ liệu | thay kết encounter và mức hư hại | mở nhiệm vụ sửa chữa hoặc nghiên cứu khác |

Không nhánh nào được gắn nhãn "đúng". Không khóa tiến trình chính vì một lựa chọn đạo đức.

## 9. Hướng dài hạn

| Giai đoạn | Không gian | Câu hỏi trung tâm |
| --- | --- | --- |
| MVP | Thăng Long – Vành Đai Tây – Ba Vì | con người sống thế nào sau Linh Chấn? |
| Alpha | nhiều vùng Việt Nam | vì sao các điểm cộng hưởng có cùng cấu trúc? |
| Giai đoạn 2 | Đông Nam Á / Trái Đất | ai kiểm soát dữ liệu và tài nguyên linh năng? |
| Giai đoạn 3 | quỹ đạo / Mặt Trăng | tín hiệu ngoài hành tinh đến từ đâu? |
| Giai đoạn 4 | hệ Mặt Trời / tinh không | Trái Đất đứng ở đâu trong văn minh lớn hơn? |

## 10. Quy chuẩn thoại

Thoại hiện đại, ngắn, tự nhiên. Người dân nói về ca trực, tuyến đường, vật tư, cảnh báo,
giá nguyên liệu, thiết bị lỗi và người thân; không phải NPC nào cũng nói kiểu cổ phong.

Thuật ngữ tu luyện được dùng khi thực sự liên quan đến cơ thể/linh năng. Các hệ thống kỹ thuật
dùng ngôn ngữ kỹ thuật hiện đại.

## 11. Nghiệm thu story

Người thử phải hiểu:
- mình đang ở một Việt Nam hiện đại hậu Linh Chấn;
- khu an toàn và vùng hoang dã khác nhau thế nào;
- vì sao phải ra ngoài săn/khảo sát;
- ít nhất một NPC có lợi ích riêng;
- bí ẩn cuối chương lớn hơn một con boss địa phương.
