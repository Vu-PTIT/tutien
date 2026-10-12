# 10 — Quy chuẩn NPC, dị thú, quần thể và avatar tự hoạt động

**Áp dụng chung 8 map.** Hệ sinh thái/lịch/độ khó dưới đây là **đặc tả đề xuất**, không xác nhận implementation hiện tại hoặc chốt cân bằng. NPC canon dựa vào [05 — Story Bible](../05-story-bible.md). Gameplay xã hội và avatar tự hoạt động dựa vào [08](../08-social-presence-and-lifestyle.md), [09](../09-dual-experience-platform.md). Map/portal xem [00](00-world-topology-and-routes.md).

## 1. Bốn loại thực thể tuyệt đối không gộp

| Loại | Dữ liệu chính | Sinh/huỷ | Authority/ý nghĩa |
| --- | --- | --- | --- |
| `player_avatar` | user/character ID, mode, map/floor, position, activity session, permissions | **một avatar duy nhất**/character, có snapshot | backend quyết định hoạt động/địa điểm/quyền xem |
| `npc_service` | npc_id canon, nơi làm, schedule, action/shop/craft, dialogue tags | ổn định theo vùng, có thể dịch chuyển vùng | giao dịch/quest/server; không đánh trong safe |
| `npc_ambient` | archetype, spawn sector, schedule seed, route, pose | mô phỏng theo sector có người xem; có thể cull | không phải người chơi và không mang tài sản thật |
| `wildlife_or_hostile` | species, territory, spawn_id, aggro/leash, combat state | spawn theo server/encounter cho quái, ambience cho thú hiền | không tự cấp loot từ client |

Nhân vật “đi làm” trong map có thể là một NPC nền hoặc **avatar người thật đang chạy session**, nhưng UI không được đánh tráo hai đối tượng. Người chơi không online có thể đang có activity, còn NPC nền chỉ đại diện cư dân hư cấu.

## 2. NPC cần những thành phần gì để trông như game thật?

- **Ngoại hình:** pixel 32×48 người, 4 hướng idle/walk; hành động nghề (câu, xếp hàng, sửa máy, gỡ lưới, tưới, ngồi); áo đời thường Việt hiện đại, thay áo mưa/áo khoác theo mùa. Không cần mỗi NPC là một asset độc nhất: dùng palette/áo tóc phối, giữ silhouette nghề.
- **Vai trò xã hội:** chủ quán/người khám bệnh/trạm kiểm lâm/người dẫn đường/chợ bán hàng/giao vật liệu; thông tin bảng hiệu, lời thoại, ca làm, người đợi, vị trí chờ hợp lý.
- **Lịch:** `home → commute → work → break → social → home`, giờ game; có `schedule_revision`. NPC canon đi liên map phải có travel segment, một vị trí authoritative tại mỗi thời điểm.
- **Đường đi:** anchor đứng, điểm đến, đường hợp lệ, điểm tránh người, state cửa/ngõ; không bước vào collider hay luống người khác. Nếu đường tắc: chờ, đi vòng, đổi điểm, không teleport ngay trước camera.
- **Phản ứng:** chào ngắn nếu gặp, quay đầu, nhường lối, né khi quái quá gần; trong safe zone cư dân không hoảng loạn liên tục. NPC dịch vụ giữ người tương tác ngay cả lúc animation giao ca (có backup).
- **UI:** icon nghề và tên ngắn khi tiến lại, phím F/touch; thoại ngắn 1–3 câu, tùy giờ và bối cảnh. Không dùng tiếng thoại cổ phong cho người bình thường.
- **Audio:** nhịp bước theo nền, tiếng dụng cụ khi làm việc, hít thở/động tác nghỉ, hiệu ứng ít loop tránh spam.

### Lịch mẫu service NPC — giờ game, điều chỉnh sau khi playtest

| NPC canon | Khu thường trực | Hoạt động chính | Liên map |
| --- | --- | --- | --- |
| `npc_bs_lan` | Thăng Long | 08–20h phòng khám; ngoài giờ để hướng dẫn y tế tại bảng tin | không nhân đôi |
| `npc_ky_su_nghiem` | Vành Đai Tây | 07–17h trạm cảm biến; các ca kiểm tra tháp | thỉnh thoảng về Thăng Long theo schedule |
| `npc_luc_vi` | Vành Đai/Rừng | ngày ở trạm; lịch khảo sát có thời gian đến/đi và route | **chỉ một map tại một thời điểm** |
| `npc_do_khe` | Thăng Long | 08–18h xưởng; tối quán | có thể đi mỏ để khảo sát vật liệu nhưng chưa cần trong P0 |
| `npc_tong_duc` | Viện Thăng Long | nghiên cứu; một số ngày thực địa Ba Vì/Thiên Mạch | update world presence atomic |
| `npc_ha_to` | Thăng Long/Làng/Cảng | logistics/phiên chợ định kỳ | travel liên vùng có timestamp & icon “đang vận chuyển” |

**NPC được thêm** trong từng hồ sơ vùng là tên/ID **đề xuất**, chờ chốt lore; không sửa/làm mất sáu ID trên. Số NPC background tham chiếu: thành phố nhiều nhất, rừng ít nhất; trong 1 viewport PC thường không quá 18–20 NPC ambient cùng lúc trước khi benchmark.

## 3. State machine cho NPC thường/ambient

```text
spawn_or_resume
  -> idle -> find_job/POI -> path_to_activity -> wait_slot
                                       |            |
                                       +----- active_animation
                                       |            |
                                       -> break/social -> return_home
  -> flee_to_safe (nếu sự kiện hợp lệ) -> resume_schedule
  -> stream_out (chỉ cull trình bày; giữ trạng thái cần lưu)
```

- **Điểm chuyển:** trước chợ phải có chỗ đỗ xe, gần cổng phải có waiting area; NPC route phải đi bằng sidewalk/footpath, không lấy thẳng tọa độ x,y qua tường.
- **Slot nghề:** một NPC một slot cùng lúc; số slot ít vẫn có queue, không chồng 3 sprite vào một ghế. Khi player dùng slot, NPC nhường hoặc đổi slot theo luật ưu tiên.
- **Đường phố có đông người:** nửa ngoài là crowd decorative, không phải tất cả NPC cần server tick vị trí từng frame. Chỉ NPC tương tác/được chú ý mới có snapshot chi tiết.
- **Vùng rừng/bãi quái:** không bày NPC đi chơi giữa aggro zone; đoàn khảo sát phải có tuyến bảo vệ và lý do hiện diện.

## 4. Dị thú canon và đề xuất: phân bổ rõ vùng

| Loài | Canon hay đề xuất | Nơi gặp chính | Telegraph và đòn | Nguyên liệu dự kiến (cần economy duyệt) |
| --- | --- | --- | --- | --- |
| **Lợn Gai Sơn** | canon | Vành Đai, rìa Ba Vì | húc theo đường thẳng, dậm đất trước khi lao | da/gai |
| **Nhện Tơ Điện** | canon | Vành Đai, mỏ, rừng, hầm | đặt lưới có dấu nền/ngọc lam, giật ngắn | tơ |
| **Khỉ Vách Đá** | canon | rừng/vách Ba Vì | di chuyển quanh vách, giơ tay báo đánh rồi lùi | bộ phận/nhặt theo balance |
| **Rắn Sương** | canon | suối/sương Ba Vì | lộ thân/đầu trong sương trước khi cắn | vật liệu/mẫu nghiên cứu |
| **Thủ Lĩnh Mạch Gãy** | boss canon | Trạm Thiên Mạch | pha telegraph rộng, xung cộng hưởng; 1 encounter | theo boss contract |
| **Chó Đê Nhiễu** | đề xuất | ngoài hàng rào Vành Đai | gầm, đứng nhìn rồi áp sát; ưu tiên rút | chưa chốt |
| **Thằn Lằn Đá** | đề xuất | mỏ lộ thiên và ít ở B1 hầm | nấp đá → báo đuôi → lao ngang | chưa chốt |
| **Dơi Mạch** | đề xuất | mỏ lộ thiên lúc tối, B2 hầm | hạ độ cao, phát tiếng báo, lao xuống | chưa chốt |
| **Cua Giáp Bùn** | đề xuất | bến cảng bỏ hoang | bò ngang, cụp càng cảnh báo, đánh tầm gần | chưa chốt |
| **Cá Răng Đồng** | đề xuất | mép nước cảng cũ | vòng sóng, mắt nổi, táp từ nước | chưa chốt |

Động vật thuần ambience: chim, cá thường, gà, trâu, chó nhà, côn trùng **không mặc định biến thành quái và không drop loot**. Dị thú phải có lý do xuất hiện (đường điện/hang đá/nước lợ/mạch linh), không thả bừa để trông map đông.

## 5. Bảng danger-tier và spawn budget **đề xuất để test**

| Khu vực | Tier | Số nhóm active quanh 1 camera (ước lượng) | Chỗ không bao giờ spawn |
| --- | --- | --- | --- |
| Làng | `SAFE` | 0 | toàn map |
| Thăng Long | `SAFE` | 0 | toàn map; hình nhân tập không phải loot PvE |
| Vành Đai | `T1` | 1–2 nhóm nhỏ ngoài đường | chốt/đê/4 portal/hành lang công cộng |
| Cảng | `SAFE+T1` | 0 trong cảng, 1 ngoài bến bỏ hoang | chợ, bến câu, bến xe, cầu cảng hoạt động |
| Mỏ lộ thiên | `T1–T2` | 1–2 nhóm ở bãi đá bỏ dở | kho, miệng giếng, đường xe, lối rừng |
| Mỏ ngầm | `T2` | B1 0–1 ở xa trạm, B2 1–2 | hai thang, ga, đường cứu hộ, arrival |
| Ba Vì | `T2–T3` | 2–3 nhóm theo sector khám phá | trạm kiểm lâm, 4 portal, nơi nghỉ |
| Thiên Mạch | `BOSS` | 1 boss instance, không farm quái nền bừa | sảnh, đoạn hồi, cửa về |

**Đây là ngân sách thiết kế, không phải cap cuối trên server.** Solo phải có đường chạy/né; co-op nhỏ không spawn gấp đôi theo camera. Enemy streaming không “reset cả đàn” khi camera rời 1 pixel. Loài nào không có art, animation, attack telegraph, AI và loot contract thì chưa đưa vào bản chơi.

## 6. FSM quái và luật lãnh địa (anti-frustration)

```text
spawn -> idle/forage -> patrol -> notice (tín hiệu)
                                | mất dấu -> idle
                                v
                             approach -> telegraph -> attack -> recover -> pursue
                                |                            |
                                +------ exhausted/overleash -> retreat -> home -> idle
on_defeat -> server encounter settlement -> despawn -> respawn cooldown (not in view)
```

- **Aggro/notice radius** khác nhau theo loài, nhưng mọi loài phải có tín hiệu **trước khi gây sát thương**. Không bắn xuyên bụi/cây, không dựa vào “người chơi không nhìn thấy” để bất ngờ giết.
- **Territory polygon + leash:** quái bị giới hạn khu, không vượt cổng/đê/trạm cứu hộ; flee NPC vào safe checkpoint; spawn tối thiểu cách cổng và activity slot theo điều kiện trong mỗi map.
- **Line of sight:** vách/công trình che tầm nhìn; cây rậm có mức che tầm nhìn thiết kế, không dùng mỗi alpha hình ảnh để quyết định collision/hit.
- **Encounter ownership:** server nhận input, quyết định HP/damage/loot, kiểm tra hành động lặp; client render telegraph/animation và dự đoán chuyển động có sửa sai, không tự kết quả thắng.
- **Respawn:** chỉ khi spawn polygon walkable, không ngay vùng camera nhìn, không sát player/arrival, không trong vòng hoạt động auto. Nếu lỗi dữ liệu spawn, bỏ đợt spawn thay vì nhét quái vào safe area.
- **Boss:** instance, ngưỡng pha/phòng thoát, thưởng idempotent; kể cả disconnect/party wipe cũng không nhân bản instance.
- **Thời tiết:** mưa/sương đổi hiệu ứng nhận diện và có thể thay tập spawn nếu server phê duyệt; FX client không tự tạo quái/tài nguyên.

## 7. NPC không cản đường, quái không khóa cổng — luật hình học

1. Mỗi cửa/portal có **vùng đệm đi được** sâu ≥3 ô; vùng an toàn combat kiểm tra thêm khoảng tới enemy ≥8–12 ô lúc arrival.
2. Đặt NPC trước quầy ở điểm lệch khỏi centerline đường; cấm đứng/đỗ ngay `portal_trigger`, thang, cầu, cầu thang hẹp.
3. Thực thể lớn có footprint/collider ở **chân**; Y-sort dựa anchor; tán/mái fade có giới hạn. Không lấy full sprite collider.
4. Navmesh map tĩnh không giải quyết chen chúc; actor có local avoidance/fallback chờ. Hai người đi ngược nhau không được kẹt ở cầu bắt buộc.
5. Enemies có spawn mask và path mask riêng; road safe buffer kiểm bằng dữ liệu, không phải màu vẽ.

## 8. Hoạt động tự động phải nhìn và vận hành giống game thật

| Trạng thái server | Hiển thị trong map | Hiển thị trên sảnh |
| --- | --- | --- |
| `queued` | avatar ở chỗ trước; UI “đang xếp lịch” nếu có quyền xem | chưa có slot hoặc đang chờ |
| `travelling` | avatar đi qua route hợp lệ, đổi map theo link; khi không ai nhìn chỉ snapshot/ETA | đang tới [địa điểm], ước tính thời gian |
| `active` | avatar chiếm slot thật, animation câu/trồng/thiền/làm; có badge tự hành | hoạt động, kết quả tạm |
| `completed` | avatar hoàn tất, có thể ở vị trí kết thúc hoặc chọn lệnh mới | kết quả đã settlement |
| `cancelled/expired` | nhả slot, quay idle hoặc điểm an toàn | lý do rõ ràng, không sinh reward lần hai |
| **takeover** | **cùng avatar** chuyển sang direct, dừng auto control | chuyển quyền sở hữu điều khiển |

- Người dùng tự khai “đang học/làm” ở platform **không** cấp tiền/XP và không ép avatar tới công việc có cùng tên.
- Quyền chia sẻ trạng thái ngoài đời ≠ quyền chia sẻ vị trí/activity avatar; kiểm quyền **trên server**.
- Khi chuyển map trong khi chủ nhân offline: lưu route segment + `eta_server` + `map_revision`; game của người đứng xem dựng **một NPC-like avatar** đi vào vùng load, rồi update thành direct khi người chủ vào.
- Nếu slot bị người khác chiếm: có policy queue/alternate/reject; không đặt hai người đứng đè cùng tọa độ. Nếu đường bị chặn: server đổi tuyến/điểm, báo state mới.
- Reward chỉ từ `avatar_activity` theo luật độc lập, settlement key/idempotency, không tin ảnh/chỉ số thời gian của client.

## 9. Bộ animation và asset cần để vận hành

| Loại | Animation tối thiểu | Hiệu ứng/quy tắc |
| --- | --- | --- |
| NPC thường | idle/walk 4 hướng, sit, work, greet, react | sprite 32×48, camera ×2/×3 |
| Avatar | idle/walk/run/sit/fish/farm/meditate 4 hướng (mở dần theo tính năng) | phân biệt direct/autonomous |
| Dị thú nhỏ/vừa | idle/move/warn/attack/hit/retreat 4 hướng | đòn báo ngọc lam, không blood/gore |
| Boss | ít nhất 2 hướng theo Art Bible, warn/phase/recover/death | hitbox rõ, không chồng camera |
| Object nghề | trạng thái idle/active/completed, âm thanh hoạt động | stop khi slot được nhả |

**QA của hệ sinh vật:** một sinh vật nhìn vào thấy đúng môi trường sống, animation và collider nhất quán; quái có đường rút và cảnh báo; NPC đi làm/nghỉ có nghề thật; avatar tự động có đường đi/slot và không tự tạo loot ngoài server.

