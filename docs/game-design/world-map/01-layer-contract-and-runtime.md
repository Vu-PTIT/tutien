# 01 — Map production contract: lớp, dữ liệu, AI, hiệu ứng

**Ưu tiên kế thừa:** [10 — Layered interactive maps](../10-layered-interactive-maps.md), [11 — World Bible](../11-world-bible.md), [12 — Art Bible](../12-art-bible.md), [00 — topology](00-world-topology-and-routes.md).
**Vai trò:** chuẩn kỹ thuật dùng chung cho 8 hồ sơ vùng, chưa khẳng định runtime đã có. Godot 4.6.1; pixel art top-down **3/4 thẳng**, không side-view, không isometric hình thoi.

## 1. Một map sản phẩm hoàn chỉnh phải có những gì?

| Hạng mục | Tối thiểu cần thiết | Bằng chứng nghiệm thu |
| --- | --- | --- |
| Địa hình | nền sạch, địa vật thấp, hình dạng bờ/đường có chủ đích, nối khớp chunk | overview gameplay và ảnh chụp camera |
| Không gian đi lại | trục chính/nhánh/vòng, điểm tránh, lối ra, cầu, địa hình chặn | chạy test từ spawn đến mọi cửa/POI |
| Vật thể | nhà, cây, cửa, máy, ghế, thùng, quầy, trạng thái mở/đóng/hỏng | nhấn tương tác đổi state, collider đúng |
| Người | avatar, NPC chức năng, NPC nền, lịch di chuyển, hoạt ảnh | NPC không đi xuyên tường, không chắn lối |
| Sinh vật | động vật nền và/hoặc dị thú có lãnh địa, spawn/aggro/retreat | quái không spawn trong safe zone |
| Gameplay | slot câu/vườn/thiền/làm; nút shop/craft/mỏ/điều tra khi có nội dung | click F/touch, direct/autonomous đúng luật |
| Dẫn đường | minimap, bản đồ lớn, biển hướng, marker cổng và POI | một nguồn tọa độ, không sai lệch |
| Môi trường | ngày/đêm, gió, nước, ánh sáng, âm thanh, thời tiết theo vùng | tắt FX vẫn đọc rõ địa hình |
| Liên vùng | portal 2 chiều, arrival/checkpoint, travel, preload, rollback | A→B→A không kẹt/nhân đôi |
| Lưu trạng thái | NPC/activity, quặng/luống/cửa có chủ, loot, reconnect | server authoritative, không nhân đôi |
| Hiệu năng | chunking, culling/LOD, giới hạn NPC/VFX, PC/mobile | đo memory/frame time/thời gian tải |

## 2. Layer stack tham khảo (KHÔNG tương ứng số thứ tự node bắt buộc)

| Layer | Nội dung / node Godot đề xuất | Nguyên tắc |
| --- | --- | --- |
| `L00_ground` | nền raster vẽ riêng theo chunk, đất/cỏ/rêu/đá nền | không bake nhà, cây chặt được, UI; tỉ lệ 1:1 |
| `L01_landforms_roads` | spline/polyline/polygon có texture cho đường, bờ, gờ, bãi cát | nối mép chunk, không giãn pixel |
| `L02_water` | Polygon2D/mesh + mask/shader nước, chiều sâu màu | vùng clip riêng; nước không “tràn” ra đường |
| `L03_shore_low` | bờ nước, sỏi, cỏ thấp, mép đường, họa tiết mặt đất | chi tiết thấp không che chân |
| `L04_dynamic_ground` | ô canh tác có state, dấu chân, vũng mưa, quặng vụn | lớp có dữ liệu thay đổi, không sửa nguyên nền |
| `L05_placed_low` | biển thấp, thùng/ghế nhỏ, props không che nhân vật | sprite độc lập nếu có interaction/state |
| `L10_ysort_world` | nhà/cây/cột/đá lớn/xe/ghế, `CharacterBody2D` NPC, player, quái | cùng quy tắc **anchor ở chân/điểm tiếp đất**; Y-sort, footprint collider |
| `L11_foreground_cutaway` | mái nhà, tán cây, biển/dây điện chắn nhìn | cutaway/fade theo avatar; không che NPC đột ngột |
| `L20_env_fx` | bụi/đom đóm/sóng/hơi nước/lá/khói | cục bộ camera, chặn FX tràn sai vùng |
| `L21_lighting` | `CanvasModulate`, `DirectionalLight2D`, `PointLight2D`, normal/occluder nơi cần | màu theo giờ; ngọc lam dành cho linh năng |
| `L30_ui` | HUD, biển báo overlay, nút touch, minimap | UI render theo native DPI, không pixel hóa font Việt |
| `DATA` (không vẽ) | navigation/obstacles, trigger/collider, links, NPC schedules, enemies, slots, zones, persistence | **không lấy màu pixel hoặc ID tile làm gameplay source of truth** |

**Một đối tượng có thể có nhiều thành phần**: cầu là sprite/foreground + collision mép + nav passable + water blocker + footstep audio, không thể “gộp hết” thành một PNG. Nhà có sprite chân nhà và mái riêng; roof cutaway chỉ khi avatar bị che, không xóa tường collider. Vùng ánh sáng phải giữ nhìn được vật thể ở zoom ×2.

## 3. Quy chuẩn vật thể tương tác (scene độc lập)

Mỗi object có tối thiểu: `object_id` ổn định trong map; `type`; `world_anchor_px` / `footprint_polygon`; `visual_states`; `collision_shapes`; `interaction_radius`; `approach_points` + hướng đứng; `actions`; `state_authority`; `occlusion_policy`; `save_scope`; `art_ref` + license. Ví dụ:

```json
{
  "object_id": "lq_fishing_pier_01",
  "map_id": "m_lang_que",
  "kind": "fishing_spot",
  "anchor_cell": [177, 160],
  "footprint_cell": [4, 2],
  "render_layer": "L10_ysort_world",
  "access_points_cell": [[176, 157], [179, 157]],
  "facing": "south",
  "collision": "pier_footprint",
  "interaction": {"action": "fish", "reach_px": 64},
  "activity_slot_ids": ["lq_fish_01", "lq_fish_02"],
  "state_authority": "server",
  "occlusion_policy": "none",
  "art_ref": "lq_prop_pier_wood_a"
}
```

**Phân biệt:** collider chắn đường, hitbox tấn công, sensor tương tác, vùng slot và navigation obstacle là các khái niệm khác nhau. Không đo collider bằng toàn khung PNG; player đi ra sau nhà/tán cây phải được Y-sort hoặc mái fade đúng.

## 4. NPC, avatar và sinh vật — 3 lớp vận hành khác nhau

- **Service/story NPC**: ID ổn định, có lịch ca và điểm làm; lời thoại ngắn phản ánh bối cảnh Việt Nam hiện đại. Mở shop/đối thoại bằng action; không thể bị tấn công trong vùng an toàn. NPC canon ở [05](../05-story-bible.md).
- **Ambient NPC**: quần thể có ngân sách theo sector và thời điểm, walk/sit/work, spawn/despawn khi không có người xem; không cần server tick mọi frame, **không đại diện người thật**.
- **Player avatar**: direct hoặc autonomous, không spawn bản sao; phục hồi từ server snapshot; avatar tự động có badge trực quan khi cho phép người khác xem.
- **Dị thú**: spawn từ vùng sinh cảnh không cắt qua trục an toàn, AI idle/patrol/notice/chase/telegraph/attack/recover/retreat, vùng leash, tử vong/loot từ authoritative encounter. Không tạo quái chỉ để lấp chỗ trống.
- Chi tiết bảng NPC, cap, beast và loot định hướng ở [10](10-npc-ai-monsters-and-activities.md).

## 5. Navigation không phụ thuộc hình nền

- Xây `NavigationRegion2D`/polygon walkable riêng theo sector; sửa được khi cửa, cầu, đống đá, quặng thay state. Static road centerline chỉ dẫn layout/đồ thị tuyến, không phải navmesh cuối.
- Đường cấp A 4–6 ô, B 3–4, C 2–3 ô. Test chỗ hẹp bằng avatar kích thước thật, đồng hành 2 người, NPC đi ngược chiều; không xem đường thẳng trên minimap là bằng chứng đi được.
- Ở nước sâu/vực/tường quây collider cấm đi; cần cầu/lan can và lối đi hợp lệ. Bến tàu/thang máy chuyển bằng tương tác, không cho player tự trượt khỏi nền.
- Server định tuyến hoạt động qua đồ thị `portal links→POI→slot` và timestamp; client nội suy/đi nav cục bộ khi được quan sát; chặn path tự động đi xuyên vùng PvE nếu hoạt động yêu cầu “safe”.
- Quái dùng navigation riêng, không qua safe border; spawn giữ khoảng cách với player/arrival anchor, aggro không vượt leash.

## 6. Tổ chức dữ liệu đề xuất

```text
client/
  art/<map_slug>/{ground,props,characters,fx}/       # nguồn Aseprite + normal/metadata
  assets/<map_slug>/...                               # PNG export + license
  data/world/links.json                               # xuất theo 00 (một nguồn dữ liệu)
  data/maps/<map_id>.json                             # sector, portal, POI, objects, spawns
  scenes/world/<map_id>.tscn
  scenes/world/props/*.tscn                           # prop tái sử dụng
  scripts/world/{world_loader,portal_controller,actor_spawner,activity_visual}.gd
```

- Mỗi map data: `map_id, map_revision, width_cells, height_cells, biome_ids, sectors, region_masks, roads, water_polygons, objects, npcs, enemy_spawn_zones, activity_slots, portals, checkpoints, environment_profiles, minimap_metadata`.
- Portal lấy **link ID và tọa độ chuẩn từ 00**; từ chối build nếu không đối xứng/cặp không tới được. Object và slot trỏ ID, không trỏ màu/tile/gid.
- Sector/chunk load quanh camera; chunk renderer không được quyết định biến mất loot/slot hoặc thay đổi authority. Object interactable có thể tái tạo từ snapshot.
- Mỗi prop xuất riêng sprite/atlas frame + anchor/footprint/collider/normal nếu cần; Aseprite importer kiểm tra sprite art 32px, nearest và không xoay/scale lẻ.

## 7. Một scene map tối thiểu (gợi ý cấu trúc)

```text
WorldMap (Node2D)
├─ GroundChunks (Node2D)
├─ LandformRoads (Node2D)
├─ WaterBodies (Node2D)
├─ ShoreDetails (Node2D)
├─ DynamicGround (Node2D)
├─ YSortRoot (Node2D, y_sort_enabled = true)
│  ├─ PropsAndBuildings (Node2D)
│  ├─ PlayerActors (Node2D)
│  ├─ NpcActors (Node2D)
│  └─ CreatureActors (Node2D)
├─ ForegroundOcclusion (Node2D)
├─ EnvironmentFx (Node2D)
├─ NavigationAndCollision (Node2D)
├─ GameplayMarkers (Node2D, invisible)
│  ├─ Portals / Checkpoints
│  ├─ ActivitySlots
│  └─ SpawnRegions / SafeZones
└─ CameraController / MapHUD (UI tách CanvasLayer)
```

Godot Y-sort yêu cầu tổ chức thực tế bảo đảm actor và các prop cạnh tranh cùng chiều sâu; đừng mặc định phân nhóm node theo nhãn là đủ nếu parent tổ chức Y-sort sai. Foreground phải xét z-index/cutaway có kiểm soát, không đưa toàn bộ tán cây z-index quá cao.

## 8. Sinh hoạt trực tiếp ↔ tự động từ platform

| Activity | Loại slot | Map hợp lệ giai đoạn đầu | Quyền/kết quả |
| --- | --- | --- | --- |
| `fish_freshwater` | bến/hồ bờ có 1–2 điểm đứng | Làng, hồ Thăng Long | server giới hạn slot và kết quả cá |
| `farm` | luống/plot thuộc người chơi/được phép | Làng, mái Thăng Long | state cây theo giờ server |
| `meditate` | ghế yên tĩnh/sân chùa/bìa rừng an toàn | Thăng Long, Làng, trạm rừng | không bắt PvE |
| `rest_social` | ghế quán, quảng trường, thư viện | thành phố/làng/cảng | xã hội, không auto farm XP |
| `work_shift` | bàn làm/hỗ trợ hậu cần mang tính avatar activity | thành phố/cảng/lán mỏ an toàn | cơ chế/thu nhập phải cân bằng riêng, không lấy việc ngoài đời làm bằng chứng |
| `gather_safe` | cụm tài nguyên không tranh chấp hoặc quyền rõ | làng, rìa mỏ an toàn | giới hạn phiên để không sinh tài nguyên vô hạn |
| `mine` | node khoáng có giấy phép | mỏ lộ thiên; ngầm trực tiếp/đủ điều kiện | không tự đi vào vùng quái mạnh khi chủ nhân vắng mặt |

Flow của một hành động: `queued → travelling → active → completed/cancelled/expired`, kèm `command_id, session_id, avatar_id, state_version, map_id, slot_id, route_revision, settlement_key`. Khi đóng client, hoạt động tiếp tục từ server; khi mở lại, user có thể **takeover**, không duplicate. Trạng thái đời thật `real_life_entry/real_life_status` vẫn độc lập với `avatar_activity`.

## 9. Âm thanh, thời gian, hiệu ứng và tối ưu

- Giờ ngày: sáng sớm/trưa/chiều/tối/khuya; NPC theo ca. VFX môi trường tự có vùng; thời tiết tác động tông ánh sáng, âm thanh và đôi khi lịch NPC, nhưng không tự sinh loot không qua server.
- Âm nền phân khu: làng có côn trùng/ao/gà; phố có xe máy/tiếng rao/đèn; cảng có còi tàu/sóng; mỏ có máy xúc/gió/giọt nước; rừng có suối/chim; trạm có quạt và xung tín hiệu. Sound loop phải crossfade theo zone.
- Pixel 1:1 authored; nearest, integer zoom ×2 khám phá, ×3 giao tiếp; trên 1080p 30×17 ô (theo Art Bible). UI native resolution và Be Vietnam Pro, icon hoạt động chung 24×24.
- Ánh sáng vàng đất/đời thường cho safe, ngọc lam chỉ linh năng, tím lạ chỉ cho “ngoài chuẩn”. Bão hòa giảm, tương phản tăng khi đi xa nhà. Normal map/đèn động ưu tiên vài góc hub, không “Eastward hóa” từng pixel của 8 map.
- Đo CPU/GPU frame time p95, draw calls, GPU texture memory, cold load/hot transition và mobile thật; chỉ định chunk size/FX budget sau benchmark. Thứ không nhìn thấy không cần cập nhật vật lý/hạt FX.
- Tắt VFX vẫn phải đi được/cảnh báo rõ; ở mobile giới hạn lights/particles; không giảm bằng cách xóa collision, state hoặc gameplay interaction.

## 10. Điều kiện “map đã hoàn thiện”

Một map chỉ chuyển từ `design` sang `playable` khi: ground/water/roads thật; ≥1 vòng đi được; mọi lối ra hai chiều qua [00]; arrival không bị aggro; tất cả POI đến được; NPC hoạt động/lịch không mắc collider; props đổi state đúng; enemy trong spawn mask; avatar direct+autonomous ở slot nếu map hỗ trợ; save/reconnect/rights; minimap khớp; ảnh gameplay Godot PC/mobile; test kết nối; và có biên bản art + performance. **Các tệp MD này không phải bằng chứng đạt bất kỳ điều kiện nào.**

