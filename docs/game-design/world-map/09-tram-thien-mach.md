# 09 — Trạm Thiên Mạch Ba Vì | `m_tram_thien_mach`

**Loại:** cơ sở nghiên cứu ngầm tiền Linh Chấn, vùng **đặc biệt/boss tùy chọn** · ID canon · 160×128 ô (5120×4096 px).
**Bản sắc:** bê tông, cửa chống cháy, biển chỉ dẫn Việt Nam, máy chủ/đường cáp, phần sâu xuất hiện **vật liệu ngoài chuẩn** tím hiếm và hình lục giác quá hoàn hảo. Không phải động phủ cổ trang. Đường vào dựa vào điều kiện PvE, không làm cửa bắt người chỉ thích đời sống phải đi qua.

## A. Bố cục — đọc đúng như công trình có công năng

```text
 BẮC
┌────────────────────┬──────────────────────┬──────────────────────┐
│ KHO LƯU TRỮ       │ BUỒNG CỘNG HƯỞNG     │ XƯỞNG NĂNG LƯỢNG     │
│ tài liệu/thiết bị │ BOSS: THỦ LĨNH       │ trạm ngắt nguồn      │
│                   │ MẠCH GÃY             │                      │
├────────────────────┼──────────────────────┼──────────────────────┤
│ PHÒNG NGHIÊN CỨU  │ HÀNH LANG AN NINH    │ PHÒNG ĐIỆN/CONTROL   │
│ cửa kính cũ       │ cửa khoá 2 lớp       │ cáp và cầu dao        │
├────────────────────┼──────────────────────┼──────────────────────┤
│ phòng thay đồ /   │ SẢNH / CHECKPOINT   │ máy quét/nhật ký      │
│ kho cứu hộ        │ ▼ về RỪNG BA VÌ      │ bảo trì              │
└────────────────────┴──────────────────────┴──────────────────────┘
 NAM
```

| Sector (x,y ô) | Mục đích | Phạm vi |
| --- | --- | --- |
| `TM01_ENTRY` x=53–108,y=95–127 | cửa kín + bàn kiểm tra + trạm hồi | **safe** |
| `TM02_RESEARCH` x=9–68,y=52–100 | bàn nghiên cứu, kho mẫu, màn hình | tương tác đọc thông tin (quest sau) |
| `TM03_CONTROL` x=103–150,y=49–103 | điện, phòng máy, chu kỳ cộng hưởng | công tắc an toàn / mechanic boss |
| `TM04_SECURITY` x=65–111,y=55–97 | hành lang chữ T, cửa an ninh | cảnh báo trước khu boss |
| `TM05_ARCHIVE` x=10–69,y=9–52 | kho hồ sơ, bảo quản mẫu | phụ trợ/lore |
| `TM06_CORE` x=57–118,y=10–56 | buồng lõi có vòng sàn trống, vật liệu lạ | **encounter boss** |
| `TM07_AUX_POWER` x=118–155,y=9–55 | phòng nguồn phụ/lối vòng kiểm tra | điều khiển nguồn (cơ chế sau) |

**Sàn arena:** vòng chạy tối thiểu 3–4 ô quanh boss, không đặt quá nhiều máy trang trí vào lối né. Cửa đóng khi encounter chỉ sau khi đã có **lựa chọn rút lui/cơ chế thất bại rõ**; không ép người chơi kẹt phòng khi mạng lỗi.

## B. Luồng đường và phòng

| Route | Centerline (ô) | Rộng | Logic |
| --- | --- | --- | --- |
| `tm_r01_main` | (78,119) → (78,101) → (78,82) → (81,59) → (84,39) | 3–4 | cửa vào → checkpoint → an ninh → boss |
| `tm_r02_lab` | (78,84) → (43,84) → (35,64) → (42,40) | 2–3 | phòng nghiên cứu/kho |
| `tm_r03_control` | (83,78) → (123,76) → (135,43) | 2–3 | công tắc/phòng điện |
| `tm_r04_safety_loop` | (67,81) → (39,92) → (118,96) → (128,79) → (67,81) | 2–3 | vòng kiểm tra sảnh (không phải PvE) |
| `tm_r05_core_loop` | (84,36) → (107,31) → (105,15) → (68,15) → (63,38) → (84,36) | 3–4 | vòng né/đọc boss, không vật thể chắn |

Trạm có ít nhất 2 cách từ sảnh tới khu phụ trợ, đường boss rõ nhưng không bị khoá bằng việc mở quest dài khi art test. **Hành lang trực chính** không có cửa mù; bảng tên phòng bằng tiếng Việt. Cửa chống cháy độc lập state/collision/nav, không chỉ animation.

## C. Cửa vào–ra và checkpoint

| Link | Trigger | Đích | Mode |
| --- | --- | --- | --- |
| `ln_rung_tram` | (78,119) S | Ba Vì (168,9) | thang/cửa núi, hai chiều khi được phép |

- **Checkpoint an toàn:** (78,103) sảnh; (81,67) tiền phòng boss chỉ khi mở checkpoint; kết thúc encounter có lối rút về (78,119), không teleported sang bản đồ không liên quan.
- **Spawn** khi vào: (78,112) cách trigger về phía bắc, ánh đèn đủ nhìn, không quái. Encounter boss chỉ kích hoạt sau cửa/sự kiện khu CORE do server xác minh, không tự reset khi scene reload.
- Nếu server từ chối vào (chưa đủ điều kiện) thì người chơi **ở nguyên rừng**, được giải thích lý do; không load vào phòng khóa.

## D. Layer và trạng thái công trình

| Layer | Asset/chức năng |
| --- | --- |
| `L00/01` | sàn bê tông nứt, sàn chống trượt, đường cáp, vệt sơn chỉ hướng; không bake cửa/máy |
| `L02/03` | có thể chỉ có vũng nước rò/cống nước kỹ thuật cục bộ; **không cần “nước” để đủ layer** |
| `L04` | đèn mất điện, cửa chống cháy đóng/mở, cầu dao, panel scan, máy chủ hoạt động/hỏng, nền arena thay pha |
| `L10` | tủ điện, bàn, trụ cộng hưởng, máy chủ, cửa, NPC kỹ thuật hiếm, boss |
| `L11` | vòm cáp, tủ/ống cao che player thì fade; tránh hình học khiến cảm giác isometric |
| `L20/21` | đèn trắng lạnh, đèn khẩn đỏ, nhịp âm thấp, xung **ngọc lam** khi cộng hưởng; **tím hiếm** tại lõi/hình học ngoài chuẩn |
| `DATA` | room bounds, locked doors, boss arena, arena telegraph masks, checkpoint, portal, instance authority, reset/reconnect |

**Lighting accessibility:** không chớp nháy liên tục; người chơi có thể tắt flash/camera shake. Boss telegraph phải đọc được ngay cả khi chất lượng FX thấp; màu không là tín hiệu duy nhất (thêm shape/animation).

## E. NPC và quái/encounter

| Nhân vật | Vai trò |
| --- | --- |
| `npc_tm_ky_thuat_an` (**đề xuất**) | NPC cứu hộ ở tiền sảnh, **chỉ xuất hiện khi trạm đã mở an toàn**; không bán thuốc vô hạn làm mất cân bằng |
| `npc_tong_duc` (canon) | có thể xuất hiện trong tuyến truyện sau khi boss xử lý, **không đồng thời ở Viện** |
| Máy giám sát môi trường | **prop/hazard**, không mặc định là enemy biết thả loot |

**Quái chính:** **Thủ Lĩnh Mạch Gãy** (canon; mô tả ngoại hình cuối cùng cần chốt cùng lore/Art Bible). **1 boss/encounter instance**, không spawn như đàn quái trong hallway. Telegraph ngọc lam theo chuẩn dị thú; vệt tím chỉ khi pha lõi nhân tạo, tránh lạm dụng. Boss có pha chuẩn bị/đọc đòn/ra đòn/hồi phục/đổi vị trí, arena cho solo, co-op xét sau theo combat spec.
Các hazard môi trường (xung điện, nền đóng/mở) phải báo trước và không tự cấp drop. Mỗi kết quả boss dùng server encounter ID + settlement key/idempotency; chạy lại scene hoặc reconnect **không nhân đôi phần thưởng**.

**Cơ chế gợi ý, không ép làm quest ngay:** phân biệt 2 panel nguồn; tắt lõi để giảm nguy hiểm hoặc sao chép dữ liệu, cả hai đều cho đường rời trạm. Không khóa tiến trình vì lựa chọn đạo đức; lore dài để sau P0.

## F. Tương tác/đường lui, âm thanh, QA

- `tm_panel_01..03` cầu dao; `tm_log_01..04` terminal đọc nội dung; `tm_med_01` hỗ trợ checkpoint; `tm_door_01..05` cửa độc lập có state và trigger; `tm_arena_entry_01`; `tm_exit_01`.
- Các bàn/terminal phải đứng tương tác được từ hành lang, không đi vào collider bàn. Cửa tự động có thời gian giữ an toàn, không nghiền avatar; khi cửa đóng nav được cập nhật.
- Âm tiếng quạt, bước chân kim loại, thiết bị cảnh báo, nhịp xung; khu CORE yên tĩnh bất thường. Công nghệ Việt hiện đại dễ nhận bằng thiết bị, mũ bảo hộ, chữ Việt và cấu trúc cứu hộ.
- **Thứ tự thi công:** tiền sảnh/cửa về Rừng → phòng lab/control → door state/nav → arena boss có chỗ né → checkpoint/tải lại → boss logic authoritative → ánh sáng/lore.
- **Pass:** vào–ra hai chiều, tắt điện không khóa đường bắt buộc, rút lui được; đánh boss không xuyên collider, không che telegraph; gục/reconnect về checkpoint không nhân vật trùng/loot trùng; ngoại hình “tàn tích ngoài chuẩn” hiếm và đúng màu canon.

