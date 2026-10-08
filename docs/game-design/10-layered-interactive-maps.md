# 10 — Map phân lớp và vật thể tương tác

**Quyết định thiết kế:** 08/10/2026, phiên bản 2.  
**Áp dụng:** `feat/map-ui-rebuild` và `feat/dual-experience-platform`.  
**Trạng thái:** đã chốt hướng thiết kế; tài liệu này không chứng nhận runtime, asset, hiệu ứng hay backend mới đã được triển khai.

## 1. Quyết định và phạm vi

Map dùng **2D pixel, góc nhìn top-down 3/4**, thấy mặt đất cùng mái/mặt trước vật thể. Không chuyển sang side-view, không tự đổi sang bản đồ isometric hình thoi và không dùng camera 3D để giả định rằng asset sai góc nhìn sẽ tự được sửa. Tỷ lệ nhân vật, mật độ pixel và cách vẽ phối cảnh phải thống nhất.

**Mặc định thiết kế map mới không phụ thuộc TileSet/TileMapLayer.** Ưu tiên nền vẽ phân lớp, vùng địa hình tự do và vật thể độc lập. Tileset là ngoại lệ cuối cùng có lý do kỹ thuật được kiểm chứng, không phải lựa chọn sẵn cho sàn, vườn, hàng rào hay mọi nội dung lặp. Không chuyển game sang một ảnh nền phẳng chỉ để ngắm.

Hướng chuẩn cho map mới:

- `map_mode`: `scene_mode`.
- `visual_model`: `layered_raster` — nền sạch phân lớp, chia mảng tải khi cần; có thể kết hợp vùng polygon/mesh 2D phủ texture cho nước hoặc địa hình phù hợp.
- `runtime_object_model`: `y_sorted_props + interactive_scene_objects + scene_hooks`.
- `collision_model`: hình va chạm tường minh, vùng đi lại đa giác và vùng kích hoạt; không suy ra từ màu ảnh.
- `engine_target`: scene Godot 4.6.1 và dữ liệu riêng của dự án.
- `tile_generation`: `none` cho bản thử mới; không tự sinh lại atlas địa hình hoặc ép bố cục về lưới cũ.

Tài liệu này ưu tiên cho **kiến trúc map mới** khi tài liệu cũ mặc định mọi thứ là tile. Phiên bản 2 thay quy tắc phiên bản 1 cho phép mặc định dùng tile cục bộ ở luống trồng/sàn/chi tiết lặp. Tầm nhìn, hai không gian sản phẩm và hiện diện xã hội tiếp tục theo 01/09/08. Không thay đổi combat/economy, không thêm minigame và không đưa quest/cốt truyện dài trở lại ưu tiên đầu.

### 1.1. Phân biệt tài nguyên, lưới logic và cách dựng map

TileMapLayer là một phương án dựng map theo lưới, có công cụ biên tập và tối ưu cho nhiều tile; không phải điều kiện bắt buộc để có tương tác hay hoạt ảnh. Không có thành phần nào trong phạm vi đang chốt được xác nhận là chỉ TileSet mới làm được. Không gọi một phương án là bắt buộc chỉ vì dễ làm bằng tile hoặc đã có tileset trong kho. [S4]

- **Pixel art** là quy chuẩn hình ảnh, không đồng nghĩa map phải ghép ô.
- **Atlas/sprite sheet** là cách đóng gói ảnh. Có thể lấy một cây hoặc ghế nguyên vẹn từ atlas bằng Sprite2D rồi đặt tự do; không cần TileMapLayer. Không cấm atlas khi ưu tiên không dùng tile. [S6, S9]
- **Lưới logic** có thể quản lý ô gieo hạt, vùng đặt đồ, quyền xây dựng hoặc tìm kiếm vị trí. Lưới này không bắt buộc phần hiển thị dùng tileset.
- **Chunk nền** là mảng của bố cục đã thiết kế để tải/vẽ theo khu vực, không phải một ô mẫu được lặp để quyết định hình dáng làng.
- **Lặp texture hoặc tái sử dụng prop** được phép khi hợp mỹ thuật và hiệu năng; không biến các lựa chọn đó thành yêu cầu ghép toàn bộ địa hình bằng tile.

### 1.2. Cách dựng ưu tiên cho từng thành phần

| Thành phần | Phương án không tile ưu tiên | Điều phải giữ |
| --- | --- | --- |
| Đất, sân, cỏ nền, quảng trường | Mảng nền pixel được thiết kế riêng; chia chunk từ cùng bố cục nếu cần | Nền sạch, không bake vật thể có state hoặc che nhân vật |
| Đường đất và bờ sông | Hình dạng vẽ riêng; có thể dùng dải mesh/polygon phủ texture khi cần chỉnh đường cong | Bề rộng, mép nối và chi tiết pixel không bị kéo giãn; không tạo công cụ phức tạp khi mảng vẽ đã đủ |
| Ao/sông | Vùng Polygon2D/mesh 2D hoặc lớp nước có mask, shader riêng | Nước chỉ chuyển động trong vùng nước; bờ và collider riêng |
| Nhà, cây, ghế, cửa, rương | Scene/prop độc lập; tái sử dụng sprite/atlas khi hợp phong cách | ID, anchor, chiều sâu, va chạm, action và state không phụ thuộc gid |
| Vườn trồng trọt | Lưới dữ liệu ẩn + lớp đất theo trạng thái + cây trồng riêng | Có thể thay đất/cây mà không sửa nền toàn map; không mặc định TileMapLayer |
| Sàn và đặt nội thất | Mảng sàn/texture phù hợp + dữ liệu vị trí hoặc lưới đặt đồ tùy chọn | Đồ vật độc lập; sàn không bắt buộc ghép ô |
| Hàng rào, tường, chi tiết lặp | Các đoạn scene/sprite có điểm nối hoặc dải hình phù hợp | Hình và collision khớp; không kéo giãn pixel để bù tài nguyên thiếu |
| Cỏ thấp, lá và chi tiết số lượng lớn | Nhóm sprite/mesh/particle phù hợp, chỉ tối ưu gom vẽ sau khi đo | Không gom vật thể cần Y-sort/tương tác độc lập thành một khối không kiểm soát được |

Polygon2D hỗ trợ phủ texture lên hình dạng tự do; đây là công cụ dựng hình chứ không tự làm mỹ thuật đẹp hay tạo collision. Mesh 2D có thể giảm phần trong suốt bị vẽ nhưng tăng công việc xử lý đỉnh, nên không chuyển mọi sprite thành mesh một cách máy móc. [S5, S7]

### 1.3. Điều kiện ngoại lệ dùng tileset

Trước hết thử phương án không tile đơn giản nhất đáp ứng yêu cầu. Chỉ đề xuất TileMapLayer cục bộ khi có ràng buộc bắt buộc đã xác định mà các phương án không tile phù hợp không đáp ứng hợp lý, ví dụ giới hạn tài nguyên đã đo trên thiết bị mục tiêu hoặc một hợp đồng tích hợp bắt buộc chưa thể thay thế an toàn. Không coi lợi thế biên tập theo thói quen hoặc có sẵn tài nguyên là bằng chứng bắt buộc dùng tile.

Mỗi ngoại lệ phải ghi trong thay đổi triển khai: khu vực và phạm vi, ràng buộc phải đáp ứng, các phương án không tile đã đánh giá, bằng chứng/kết quả đo, ảnh hưởng mỹ thuật và tương tác, lý do chọn tile, khả năng thay thế về sau. Nếu căn cứ chỉ là đánh đổi chi phí/chất lượng chứ không phải điều kiện bắt buộc, phải nêu rõ để chủ sản phẩm quyết định; không âm thầm diễn giải lại yêu cầu.

Không có ngoại lệ TileMapLayer mới nào được phê duyệt trong đợt tài liệu này. Không dành trước tỷ lệ tile; bản thử M1 hướng tới **không có TileMapLayer đang dùng để dựng cảnh mới**. Scene cũ vẫn được giữ làm đối chiếu trong thời gian chuyển đổi, không bị xóa chỉ để đạt mục tiêu này.

## 2. Các lớp và trách nhiệm

| Lớp | Nội dung | Không được trộn vào |
| --- | --- | --- |
| Nền sạch | Đất, đường, sân, chi tiết thấp không đổi trạng thái | Cây chặt được, nhà, rương, ghế, NPC, chữ/UI |
| Nước | Mặt nước, mask hoặc đa giác giới hạn hiệu ứng | Va chạm và luật đi được/không đi được |
| Bờ và chi tiết thấp | Mép đất, bờ ao, chi tiết nối địa hình | Sóng làm biến dạng cả bờ hoặc đường đi |
| Vật thể có chiều sâu | Cây, nhà, đá, bàn ghế, cửa, đồ đặt được | Ảnh preview toàn cảnh |
| Lớp che phía trước | Phần mái/tán cần che nhân vật, có chính sách làm mờ | Vẽ đè mọi vật thể cao lên mọi nhân vật |
| Nền thay đổi | Luống đất, vũng nước, dấu chân, cây trồng theo trạng thái | Nền tĩnh không thể thay thế |
| Logic | Va chạm, navigation, điểm tiếp cận, slot hoạt động, cửa ra vào | Pixel màu hoặc mã tile làm nguồn sự thật duy nhất |
| Không khí | Ánh sáng, gió, hạt hiệu ứng, âm thanh | Quyền nhận thưởng hay trạng thái sở hữu |

Nền dưới mỗi vật thể có thể di chuyển hoặc biến mất phải được vẽ đầy đủ. Chặt cây là đổi vật thể sang gốc cây, không phải vá lại ảnh làng. Preview ghép phẳng chỉ dùng để duyệt mỹ thuật/minimap khi phù hợp, không làm nguồn runtime duy nhất.

## 3. Hệ tọa độ và chiều sâu

Map khai báo kích thước thế giới, giới hạn camera và đơn vị tọa độ. Quy ước dữ liệu mới: gốc trên trái, X sang phải, Y xuống dưới; một đơn vị bằng một pixel tác giả ở tỷ lệ chuẩn, còn độ phóng camera là lớp trình bày riêng. Không ép mọi asset về kích thước tile cũ.

Vật thể dùng điểm tiếp đất làm anchor; mặc định là giữa đáy, nhưng mỗi asset được phép khai báo anchor riêng. Ảnh đã crop phải giữ offset gốc. Va chạm, điểm ngồi và vùng tương tác dùng tọa độ cục bộ của vật thể; dữ liệu vị trí ngoài thế giới dùng tọa độ map. Adapter dữ liệu cũ phải chuyển đổi rõ ràng, không tự cộng nửa tile cho mọi đối tượng.

Nhân vật và vật thể cần đi trước/sau nhau nằm trong cùng nhóm Y-sort và có `z_index` tương thích. Không tăng `z_index` của toàn bộ tán cây để chữa lỗi che khuất. Mái/tán được tách đúng phần cần thiết, tránh vẽ trùng với hình thân/mái đã có. Vật thể cao phải khai báo chính sách che khuất và giữ được đầu, thân, thao tác của nhân vật ở camera chơi thật. [S1]

## 4. Hợp đồng vật thể tương tác

Một vật thể không chỉ là sprite. Dữ liệu thiết kế phải mô tả tối thiểu:

| Nhóm | Trường/trách nhiệm |
| --- | --- |
| Định danh | `object_id` ổn định, `map_id`, `world_instance_id` khi có nhiều nhà/phòng; không dùng chỉ số mảng hoặc `gid` làm ID gameplay |
| Hình ảnh | Asset hoặc scene được phép, vị trí, anchor, kích thước, lớp hiển thị, hình/animation theo trạng thái |
| Va chạm | Footprint ở phần tiếp đất; không mặc định là toàn bộ khung PNG |
| Tương tác | Danh sách action được phép, vùng phát hiện, khoảng cách, điểm tiếp cận, yêu cầu dụng cụ và quyền sử dụng |
| Hoạt động | Slot, hướng đứng/ngồi, animation, sức chứa và cách kết thúc/hủy |
| Trạng thái | Trạng thái hiện tại, revision, thời điểm đổi trạng thái, chính sách lưu/hồi phục |
| Hiển thị khi bị che | `occlusion_class`, vùng cần giữ rõ nhân vật và chính sách làm mờ phù hợp |

Cấu trúc scene dự kiến, chưa phải các node đã được thêm trong đợt cập nhật thiết kế:

```text
InteractiveWorldObject (Node2D; anchor o diem tiep dat)
  VisualRoot (Sprite2D/AnimatedSprite2D va phan mai/tan neu can)
  SolidBody (StaticBody2D + CollisionShape2D/CollisionPolygon2D)
  InteractionArea (Area2D + CollisionShape2D/CollisionPolygon2D)
  ApproachPoints (Marker2D)
  ActivitySlots (Marker2D; huong va animation qua metadata)
  LocalEffects (hieu ung va am thanh)
```

`SolidBody` chỉ tồn tại khi vật thể cần cản đường. `Area2D` nhận biết vùng tương tác, không thay thế vật cản vật lý. Điểm tiếp cận nằm ở nơi nhân vật thật sự đến được, không ở giữa gốc cây/tường. [S2]

Luồng dùng chung cho bàn phím, chuột và cảm ứng: **chọn vật thể → chọn action → đến điểm tiếp cận nếu cần → kiểm tra điều kiện → thực hiện → nhận trạng thái mới → cập nhật hình và hiệu ứng**. UI đang mở không được làm thao tác click xuyên xuống map. Khi chưa đủ gần, hết chỗ hoặc thiếu quyền, hiển thị lý do thay vì im lặng hoặc tự dịch chuyển nhân vật.

## 5. Tương tác mục tiêu

Đây là phạm vi cần triển khai theo từng bước, không phải danh sách tính năng đã chạy:

| Vật thể | Action | Kết quả/state cần có |
| --- | --- | --- |
| Cây tài nguyên | Rung/hái/chặt nếu được phép | Lá rung, quả rụng hoặc chuyển gốc; cập nhật vật phẩm chỉ sau xác nhận |
| Cỏ/hoa | Đi qua, cắt/hái khi được phép | Nghiêng cục bộ; thu hoạch và hồi phục là state riêng |
| Ghế/giường/bàn học | Ngồi, nghỉ, học | Đi đến đúng slot, giữ chỗ, quay đúng hướng, hủy/rời được |
| Cửa/rương/đèn | Mở/đóng, lấy đồ, bật/tắt | Đổi hình và state; chỉ đổi collision/navigation nếu chức năng yêu cầu |
| Luống vườn | Cuốc, gieo, tưới, thu hoạch | Lưới logic cục bộ và lớp hiển thị độc lập; thời điểm tăng trưởng được lưu riêng |
| Ao/sông | Câu tại điểm cho phép | Đứng ở bờ, phao và vòng sóng ở nước; không cho đứng giữa ao |

Không phải mọi cây trang trí đều chặt được. Asset có thể dùng chung, nhưng loại tương tác, quyền sở hữu và trạng thái là dữ liệu của từng instance. Cây rung theo gió không đồng nghĩa cây đã có tính năng chặt/loot.

## 6. Hiệu ứng tạo sức sống

**Nước:** mặt nước có mask/đa giác riêng, sóng chỉ chạy trong vùng nước; giữ bờ ổn định. Vòng sóng theo sự kiện tại phao, mưa hoặc bước chân trong vùng nước nông được cho phép. Giai đoạn đầu không cần phản chiếu toàn cảnh.

**Cây/cỏ:** gió dùng chung hướng/cường độ, mỗi cụm lệch pha; gốc giữ ổn định. Cỏ phản ứng ở nơi nhân vật đi qua, không biến mọi ngọn cỏ thành một script cập nhật riêng. Chỉ làm động những cụm có giá trị thị giác.

**Ngày–đêm:** đổi ánh sáng môi trường và đèn cục bộ, không chỉ phủ một lớp đen. HUD giữ rõ. Tránh bake bóng nắng hoặc màu hoàng hôn quá mạnh vào nền; hiệu ứng cũng phải hợp mật độ pixel của cảnh.

**Mưa, lá, khói và âm thanh:** phát theo vùng và khoảng cách, tôn trọng trong/ngoài nhà, giảm chớp sáng và cấu hình chất lượng. Không phủ nhiều lớp ảnh trong suốt khổng lồ để tạo cảm giác động. Tắt hiệu ứng thì bố cục vẫn phải đẹp và dễ đọc.

Gió/sóng/hạt thường là hiệu ứng cục bộ của client. Chỉ thời tiết hoặc trạng thái gameplay cần thống nhất mới nhận dữ liệu chung; không gửi từng hạt mưa qua mạng. Mưa đang vẽ trên màn hình không tự tạo ra va chạm nước, vật liệu ướt hoặc hệ thống cây trồng.

## 7. Đi lại và vật thể thay đổi

Navigation và va chạm độc lập với lớp hình ảnh. Có thể dùng `NavigationRegion2D`/`NavigationPolygon` cho vùng đi tự do; chừa khoảng hở theo kích thước nhân vật và kiểm tra cầu, cửa, lối hẹp. Tìm được một đường đi không thay cho kiểm tra va chạm khi di chuyển. [S3]

Khi cửa đóng, cây đổi state hoặc đồ đạc được di chuyển, phải cập nhật phần va chạm/đường đi liên quan theo chức năng thực tế. Không rebuild toàn map mỗi frame. Ghế, bàn, điểm câu và cổng cần điểm tiếp cận, điểm thực hiện và hướng hoạt động; không dùng tâm ảnh làm vị trí đích một cách mặc định.

Minimap đọc cùng kích thước, vị trí và dữ liệu vật thể/vùng từ map, không có một layout thủ công khác. Tải/ẩn chunk không được xóa state gameplay hoặc làm avatar đang hoạt động mất slot.

## 8. Liên kết nền tảng và thế giới game

Theo [09 — Hai không gian sản phẩm](09-dual-experience-platform.md), học/làm/nghỉ phải trỏ tới địa điểm và slot hoạt động có dữ liệu, không chỉ đổi dòng trạng thái.

- App gửi ý định cùng `command_id`, loại hoạt động, thời hạn và phạm vi chia sẻ; server xác định danh tính từ phiên đăng nhập. Không tin `user_id`, tọa độ hoặc đường dẫn asset do client tự khai.
- Server kiểm tra địa điểm, quyền vào, đường đi và slot; chọn chỗ hợp lệ hoặc trả về hết chỗ/không tới được. Giữ chỗ có thời hạn và giải phóng khi hủy, hết hạn hoặc lỗi.
- State dự kiến: `idle → travelling → active → completed/cancelled/expired`, kèm phiên bản. Mỗi avatar chỉ có một hoạt động hiện hành; lệnh lặp phải idempotent, lệnh cũ không được ghi đè lệnh mới.
- Lưu điểm đi/đến, đoạn đường hoặc lộ trình hợp lệ, mốc thời gian server, slot, animation key và revision. Server xử lý tiến triển ngay cả khi chủ nhân không mở game; không trông chờ `NavigationAgent2D` của client đã đóng.
- Khi không có người xem, không cần render cảnh hoặc mô phỏng hiệu ứng. Khi có người xem/mở lại game, dựng một avatar từ snapshot; xử lý đường bị chặn, slot mất hoặc map đổi phiên bản trước khi tiếp tục.
- Khi chủ nhân tự điều khiển lại, hủy/chuyển quyền điều khiển hoạt động có xác nhận, không để hai luồng cùng di chuyển avatar.
- Loot, kho đồ, cây trồng, cửa/rương có quyền và đồ đặt được phải xác thực trên server. Client có thể phản hồi hình ảnh tạm thời nhưng không tự cấp tài sản; mất mạng không biến preview thành tiến trình online.
- Quyền xem áp dụng cho cả trạng thái lẫn dữ liệu avatar được gửi cho người xem. Không gửi điểm đến riêng tư rồi chỉ ẩn dòng chữ trong UI. Trạng thái đời thật chỉ do người dùng tự khai; không tự thu thập lịch hoặc vị trí ngoài sản phẩm.

Đây là hợp đồng cần hiện thực, chưa phải API/RPC đã có. Không gắn hoàn thành việc ngoài đời với sức mạnh chiến đấu.

## 9. Quy trình tài nguyên và dựng cảnh

1. Chốt camera PC/mobile, tỷ lệ nhân vật, map bounds, lối chính và điểm hoạt động trước khi tăng diện tích. Duyệt hình đúng top-down 3/4, không dùng ảnh nhìn ngang làm chuẩn phối cảnh.
2. Chuẩn bị nền sạch, tách nước và giữ nền đầy đủ dưới props. Bản vẽ làng hoàn chỉnh chỉ là tham chiếu; không dùng ảnh dính cả nhà/cây làm nền cuối.
3. Tận dụng asset người dùng đã cung cấp nếu hợp phong cách. Một prop trong bộ tileset có thể được lấy thành sprite độc lập; việc giữ nguồn atlas không buộc dùng TileMapLayer. Tạo mới phần thiếu, giữ giấy phép/nguồn gốc. Không xóa tileset chỉ vì đổi kiến trúc, không kéo giãn tile nhỏ để giả thành cảnh lớn.
4. Chuẩn bị props riêng theo cùng camera, bảng màu, tỷ lệ; lưu anchor/offset. Nếu dùng ảnh sinh, lưu prompt và nguồn tham chiếu cùng asset. Nhân vật/animation là gói riêng, không vẽ dính vào map. Code dựng polygon/mesh chỉ lo hình học và tích hợp texture, không thay tài nguyên mỹ thuật bằng mảng màu placeholder trong bản cuối.
5. Đặt props, collider, vùng nước, navigation, điểm tiếp cận và slot trong dữ liệu/cảnh có thể chỉnh sửa. Preview ghép phẳng phải được tạo lại từ đúng các thành phần này.
6. Kiểm tra nhân vật ở trước/sau vật thể, một lần đổi trạng thái có lưu và một tuyến đến điểm hoạt động; sau đó mới nhân rộng làng. Không đưa TileMapLayer vào bản thử chỉ vì có sẵn đường dựng cũ.

Nền có thể chia thành các chunk tải riêng. Điểm bắt đầu để thử là 1024 hoặc 2048 pixel, không phải giới hạn cố định; chọn lại sau khi đo thiết bị. Các mảng phải chung tọa độ và nối sạch, không thay cách lộ ô nhỏ bằng cách lộ ô lớn. Chỉ ẩn node không có nghĩa texture đã được giải phóng.

**Tối ưu là kết quả kiểm chứng, không phải tên kỹ thuật.** Không mặc định nền raster nhẹ hơn tile, nhiều sprite nhanh hơn TileMapLayer hoặc mesh luôn tốt hơn sprite. Dùng mảng vẽ riêng ở nơi cần hình dáng riêng, giữ khả năng tái sử dụng texture/prop ở nơi phù hợp; tránh một PNG khổng lồ cho toàn thế giới và tránh một node cho từng chi tiết cực nhỏ. Việc đóng gói atlas không được làm toàn bộ tài nguyên xa camera phải luôn ở trong bộ nhớ. [S4, S7, S8, S9]

Không cam kết FPS trước benchmark. So sánh ở cùng camera, số avatar, độ phức tạp hình ảnh và thiết bị; ghi thời gian frame CPU/GPU khi công cụ hỗ trợ, phân vị 95% thời gian frame, bộ nhớ texture, draw calls, thời gian tải/chuyển khu và công sức chỉnh sửa. Mức thấp giảm hiệu ứng và bóng động, không bỏ va chạm, quyền tương tác hoặc dữ liệu người chơi. Không gom cây cần Y-sort/interaction độc lập vào một khối vẽ chung chỉ để giảm draw calls. Nếu bản không tile chưa đạt, tối ưu phạm vi tải, overdraw, độ phân giải và vật thể trước khi đề xuất ngoại lệ ở mục 1.3.

## 10. Chuyển đổi trên hai nhánh

Mốc đối chiếu trước thay đổi thiết kế:

| Nhánh | Điểm xuất phát đã đọc | Hướng chuyển đổi |
| --- | --- | --- |
| `feat/map-ui-rebuild` tại `d8565ca` | `village_demo.gd` đọc JSON làng, dựng lớp tile/vật thể/collision; `village_sprite_object.gd` lấy hình qua `gid` | Giữ demo và tài nguyên tham chiếu. Tách loader/hình ảnh khỏi ID gameplay; dựng scene mới không phụ thuộc tile. Adapter chỉ phục vụ chuyển dữ liệu cũ hoặc ngoại lệ đã được duyệt, không mặc định đưa tile vào map mới |
| `feat/dual-experience-platform` tại `31080e8` | `main.gd` khai báo `MapWorldScene = null`; có điểm nối HUD, tài khoản, social và weather | Không coi bản đồ bốn vùng cũ trong README là hiện trạng. Tích hợp scene phân lớp sau khi bản thử đạt; nối activity bằng ID/slot, giữ nguyên các hệ thống ngoài phạm vi |

Hai nhánh dùng cùng bản thiết kế này nhưng **không merge toàn bộ lịch sử/code chỉ để đồng bộ tài liệu**. Khi hiện thực, port các thành phần map đã kiểm chứng bằng thay đổi có phạm vi rõ; không ghi đè UI hoặc tài sản của nhánh kia. Ghi hiện trạng mới vào nhật ký khi thực sự có code và kết quả test.

## 11. Thứ tự thực hiện và nghiệm thu

**M0 — Đã chốt thiết kế:** cập nhật tài liệu chuẩn, mục lục, hướng dẫn client và liên kết platform trên cả hai nhánh. Phiên bản 2 chốt top-down 3/4 và quy tắc tileset chỉ là ngoại lệ. Không đánh dấu M1–M4 hoàn tất trong commit tài liệu.

**M1 — Cảnh chơi được:** một góc làng top-down 3/4 có đường cong, ao, nhà/quán, cây và ghế, không dùng TileMapLayer trong cảnh mới. Nền sạch, nước/props tách riêng, collision, Y-sort, camera và minimap dùng cùng dữ liệu; giữ scene cũ để đối chiếu.

**M2 — Tương tác thật:** ghế ngồi/rời, cửa mở/đóng và một cây đổi trạng thái. Kiểm tra bàn phím/chuột/cảm ứng, khoảng cách, đường tới, phản hồi lỗi. Prototype offline phải ghi rõ không cấp tài sản online; bước lưu/đồng bộ có test riêng.

**M3 — Sức sống:** sóng, gió/cỏ phản ứng, đèn/ngày–đêm và âm thanh theo vùng. Chạy khi đang tương tác và khi camera chuyển chunk; kiểm tra giảm hiệu ứng/chớp sáng.

**M4 — Hiện diện liên thông:** app gửi học/làm/nghỉ, avatar đi đến slot, đóng game vẫn giữ tiến triển, mở lại không nhân đôi; kiểm tra hai người tranh cùng slot, hủy/lệnh lặp, quyền xem và reconnect. Chỉ sau đó mở rộng làng và vòng trồng trọt/câu cá đầy đủ.

Điều kiện nghiệm thu runtime, hiện đều chưa được xác nhận bởi bản thiết kế này:

- [ ] Đúng 2D pixel top-down 3/4, không side-view hoặc tự đổi sang isometric; mật độ pixel và phối cảnh thống nhất.
- [ ] Cảnh thử mới không dựng bằng TileMapLayer; mọi ngoại lệ về sau có ràng buộc và bằng chứng được ghi rõ, không tự coi vườn/sàn là ngoại lệ.
- [ ] Không bake vật thể có state hoặc che nhân vật vào nền; tắt hiệu ứng vẫn đọc được lối đi.
- [ ] Spawn/cầu/cửa/điểm hoạt động tới được; không xuyên gốc cây, đi vào nước cấm hoặc tương tác xuyên tường.
- [ ] Người chơi được nhận biết rõ khi đi trước/sau mái và tán; không có lớp vẽ trùng.
- [ ] Action đổi state đúng, từ chối đúng khi thiếu quyền/dụng cụ hoặc ngoài tầm; lưu/mở lại không phát thưởng lặp.
- [ ] Lệnh app hoạt động khi client đóng, slot có sức chứa đúng, hủy/hết hạn giải phóng chỗ và không lộ trạng thái riêng tư.
- [ ] Chuyển chunk không mất state, lộ mép nối hoặc làm sai minimap; so sánh scene/editor với preview từ cùng dữ liệu.
- [ ] Đo PC/mobile ở camera thực, ban ngày/đêm/mưa và nhiều avatar; ghi kết quả thay vì tự nhận đạt FPS hoặc gọi cách mới là tối ưu hơn.

## 12. Tài liệu kỹ thuật

Các nguồn sau hỗ trợ lựa chọn node; kiến trúc và tiêu chí ở trên là quyết định riêng của dự án, không phải tính năng Godot tự cung cấp trọn gói.

- [S1 — CanvasItem: thứ tự vẽ và Y-sort](https://docs.godotengine.org/en/4.6/classes/class_canvasitem.html).
- [S2 — Area2D: vùng phát hiện và hình va chạm](https://docs.godotengine.org/en/4.6/classes/class_area2d.html).
- [S3 — Điều hướng 2D](https://docs.godotengine.org/en/4.6/tutorials/navigation/navigation_introduction_2d.html).
- [S4 — TileMap: lợi ích, cách dựng theo lưới và giới hạn](https://docs.godotengine.org/en/4.6/tutorials/2d/using_tilemaps.html).
- [S5 — Polygon2D và texture](https://docs.godotengine.org/en/4.6/classes/class_polygon2d.html).
- [S6 — Sprite2D: texture, atlas và sprite sheet](https://docs.godotengine.org/en/4.6/classes/class_sprite2d.html).
- [S7 — MeshInstance2D: đánh đổi fill rate và xử lý đỉnh](https://docs.godotengine.org/en/4.6/classes/class_meshinstance2d.html).
- [S8 — Nhập ảnh, nén và bộ nhớ texture](https://docs.godotengine.org/en/4.6/tutorials/assets_pipeline/importing_images.html).
- [S9 — AtlasTexture](https://docs.godotengine.org/en/4.6/classes/class_atlastexture.html).
