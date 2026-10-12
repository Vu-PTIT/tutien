# 12 — Art Bible: chuẩn mỹ thuật duy nhất

**Trạng thái:** đề xuất chuẩn, 12/10/2026, chờ nghiệm thu bằng art test (§13).
**Phạm vi:** mọi hình ảnh của thế giới game và phần UI dùng chung với platform.
**Không kế thừa:** asset pack 16×16 hiện tại, demo làng M1 và palette của chúng. Đó là tech demo.
**Thế giới cần vẽ:** [11 — World Bible](11-world-bible.md). Kiến trúc kỹ thuật map (layered, Y-sort, object contract) vẫn theo [10](10-layered-interactive-maps.md).

## 1. Một câu định hướng

> **HD pixel art, top-down 3/4, ấm như một buổi chiều Hà Nội; linh năng là ánh sáng, không phải sơn.**

Tham chiếu tinh thần (không sao chép): Eastward (đô thị châu Á bị thiên nhiên chiếm lại, ánh sáng động trên pixel), Sea of Stars (pixel + ánh sáng/bóng động), Stardew Valley / Fields of Mistria (đời sống cozy, chân dung nhân vật chi tiết hơn sprite), phim Ghibli (thiên nhiên trùm lên công nghệ).

## 2. Chọn phong cách — ma trận so sánh

Điểm 1–5, cao là tốt. Trọng số theo ưu tiên sản phẩm (01/09).

| Tiêu chí (trọng số) | A. Pixel thấp 16 px | **B. HD pixel 32 px** | C. Vẽ tay 2D | D. 2.5D (3D + shader) |
| --- | --- | --- | --- | --- |
| Nhận ra Việt Nam hiện đại: chữ, dây điện, xe máy (×3) | 2 | **4** | 5 | 4 |
| Đọc rõ avatar tự hoạt động ở zoom xa / mobile (×3) | 3 | **4** | 4 | 4 |
| Chi phí trang phục / cosmetic (×3) | 4 | **3** | 3 | 5 |
| Tốc độ sản xuất với team nhỏ (×2) | 5 | **3** | 2 | 2 |
| Khớp Godot 2D + kiến trúc map 10 hiện có (×2) | 5 | **5** | 4 | 1 |
| Đồng nhất hình ảnh khi nhiều người vẽ (×2) | 4 | **4** | 2 | 4 |
| Khác biệt trên thị trường cozy (×1) | 1 | **3** | 4 | 3 |
| Hiệu năng mobile (×1) | 5 | **5** | 3 | 2 |
| **Tổng (tối đa 85)** | 61 | **65** | 59 | 58 |

**Chọn B — HD pixel 32 px.** Lý do:
- 16 px không đủ chỗ cho chữ Việt có dấu trên biển hiệu, dây điện, chi tiết xe máy và trang phục streetwear — đúng những thứ làm nên bản sắc (11 §5). Đây cũng là lý do demo hiện tại trông "làng fantasy chung chung".
- Vẽ tay 2D đẹp nhưng khó giữ đồng nhất khi thuê nhiều người, môi trường tốn công và lệch với quy chuẩn pixel/Y-sort của 10.
- 2.5D giải bài toán trang phục tốt nhất (một rig, nhiều đồ, 8 hướng miễn phí) nhưng phải đổi pipeline sang 3D, trái 10 §1 và nặng cho mobile. Ghi lại làm phương án dự phòng nếu chi phí cosmetic 2D vượt ngân sách sau art test.
- Rủi ro của B (chi phí trang phục) được giảm bằng hệ paper-doll cố định một body template (§6).

### 2.1. Mục tiêu "một phần Eastward" (chốt 12/10/2026)

Chủ sản phẩm muốn hình ảnh **gần Eastward ở một phần**, chỉ về hình ảnh; lối chơi giữ theo 01/09 (sinh hoạt, avatar tự động, PvE tùy chọn), không chuyển sang phiêu lưu cốt truyện/cutscene.

| Mượn từ Eastward | Mức áp dụng |
| --- | --- |
| **Ánh sáng 2D động** — đèn điểm, bóng mềm, tông màu theo khu vực, giờ trong ngày | Toàn game. Đây là ưu tiên số 1 vì cho nhiều "không khí" nhất trên mỗi giờ công. |
| **Đồ vật kể chuyện** — mỗi góc có vài chi tiết đời sống (chậu cây, dây phơi, thùng xốp, xe đạp cũ, rêu, vết nước) | Đầy đủ ở hub; vừa phải ở vành đai/Ba Vì. |
| **Thiên nhiên đan vào đô thị** — cây mọc qua tường, dây leo trên dây điện, rêu ở chân nhà | Mạnh dần theo khoảng cách từ hub (11 §2). |
| **Palette có kỷ luật** — nhiều chi tiết nhưng ít màu, bóng tím mát, sáng vàng ấm | Toàn game (§5). |
| **Nhân vật biểu cảm** — đầu to, mắt rõ, animation idle có "nhịp thở" | Sprite giữ ngân sách §6; biểu cảm dồn vào chân dung 96×96. |

**Không mượn:** vẽ tay riêng từng màn hình cho toàn bộ thế giới, cutscene dàn dựng, mức chi tiết cực cao ở mọi vùng. Eastward mất ~6 năm với đội 3→~10 người; dự án này chỉ đầu tư mức đó cho **vài cảnh hub** người chơi nhìn hằng ngày.

Kỹ thuật tương ứng trong Godot 4 (không cần engine riêng):
- `PointLight2D` cho đèn quán, đèn đường, linh năng; `DirectionalLight2D` nhẹ cho nắng.
- Normal map qua `CanvasTexture` cho **nhà, prop lớn và mặt đất hub**; nhân vật dùng rim light đơn giản thay vì normal map để giữ chi phí trang phục (§6).
- `LightOccluder2D` cho bóng của nhà/cột/cây khi có nguồn sáng thấp (tối).
- `CanvasModulate` + bảng màu theo giờ (§5.3).
- Mỗi asset hub giao kèm: `*.png` màu, `*_n.png` normal map (vẽ tay hoặc sinh từ heightmap rồi chỉnh), anchor/collider.

## 3. Phối cảnh, độ phân giải, tỉ lệ

- **Góc nhìn:** **3/4 thẳng** (top-down oblique, kiểu Stardew Valley / Eastward) — lưới vuông thẳng hàng, camera chếch từ trên: thấy **mái nhà từ trên xuống**, **mặt tiền ngắn** và **mặt đất chiếm phần lớn khung hình**. Không isometric hình thoi, không side-view (giữ 10 §1). Chốt với chủ sản phẩm 12/10/2026.
- **Quy tắc để map trông rộng:**
  - Mặt tiền nén: mỗi nhà chỉ cho thấy ~1 tầng + tầng trệt (≈ 64–80 px); tầng cao hơn thể hiện qua mái/bồn nước/vườn mái nhìn từ trên, không vẽ chồng tầng.
  - Mái là mặt phẳng nhìn từ trên (sâu ≈ 1–1,5 ô), luôn có chi tiết đời sống: bồn inox, giàn phơi, chậu dược liệu.
  - Khi nhân vật đi sau nhà/tán cây, phần che được làm mờ (cutaway) thay vì thu nhỏ công trình.
  - Mặt đất (vỉa hè, đường, sân, hồ) phải chiếm **≥ 55% khung hình** ở zoom mặc định.
- **Độ phân giải và camera:** pixel phóng **số nguyên**, không scale lẻ. Hai mức zoom:
  - **Khám phá (mặc định):** ×2 — trên màn 1920×1080 thấy **960×540 px ≈ 30×17 ô**; trên 1280×720 thấy 640×360 ≈ 20×11 ô.
  - **Sinh hoạt / tương tác:** ×3 trên 1080p (640×360 ≈ 20×11 ô) để thấy rõ nhân vật và trang phục.
  - Mobile: chọn hệ số nguyên lớn nhất sao cho chiều cao khung thấy ≥ 11 ô.
  - UI render ở độ phân giải gốc của màn hình để chữ sắc (§10).
- **Đơn vị:** 1 ô = **32 px ≈ 1 m**. Lưới phụ 16 px để đặt prop. Mọi asset vẽ ở 1 px tác giả = 1 đơn vị thế giới; **không scale lẻ**, không xoay sprite pixel.
- **Mặt đứng:** vẽ 1:1 với mặt đất, nhưng nén kiến trúc cho dễ chơi: 1 tầng nhà = **64 px**, cửa đi = 48 px, ghế nhựa = 20 px.
- **Nhân vật người:** khung **32×48**, thân hình cao **~42 px**, tỉ lệ **~3 đầu** (đầu 14–16 px) — đủ thấy mặt và trang phục, vẫn cozy.
- **Dị thú:** nhỏ 32×32, vừa 48–64 px, boss ≤ 128 px; silhouette phải đọc được ở ×1.
- **Mép dưới = chân/anchor**, theo hợp đồng Y-sort của 10.

## 4. Ngôn ngữ hình khối

- Hub: khối chữ nhật hẹp cao (nhà ống), nhiều chi tiết nhỏ chồng lớp, đường dây điện chéo phá nhịp — **đông nhưng có trật tự**.
- Vành đai: khối ngang dài thấp (nhà xưởng, đê, ruộng), khoảng trống lớn.
- Ba Vì: khối tròn hữu cơ, tầng tán chồng nhau, đường cong.
- Thiên Mạch: khối vuông lạnh; vật thể ngoài chuẩn là **lục giác / đường thẳng tuyệt đối**.
- Nhân vật & dị thú: hình tròn và hình thang mềm; tránh góc nhọn trừ phần biến dị.

## 5. Màu sắc

### 5.1. Quy tắc chung
- Mỗi vùng một **palette 24–32 màu**; toàn game một master palette ≤ 96 màu (lưu `.gpl`/`.ase` trong repo khi bắt đầu sản xuất).
- **Bóng không dùng đen/xám:** bóng ngả **tím–xanh mát**, vùng sáng ngả **vàng ấm**.
- Độ bão hòa: hub cao vừa, vành đai thấp, Ba Vì trung bình nhưng tối; Thiên Mạch gần đơn sắc.
- **Màu dành riêng:** ngọc lam = linh năng, tím = ngoài chuẩn (11 §6). Đỏ biển hiệu/ghế nhựa là màu nhấn của đời thường.
- UI tương tác dùng **vàng kem**, không dùng ngọc lam.

### 5.2. Palette khởi điểm (key colors, mở rộng thành ramp 4–6 bậc)

| Nhóm | Màu chủ | Hex |
| --- | --- | --- |
| Linh năng | ngọc lam / sáng lõi | `#3FD6B8` / `#B8FFF0` |
| Ngoài chuẩn | tím dị thường | `#8F6BFF` |
| Bóng chung | tím mát | `#2E2A4A` |
| Thăng Long | vàng tường Pháp, đỏ ngói, đỏ biển hiệu, xanh tôn, xanh lá phố, nhựa đường | `#E6B85C` `#C2603E` `#D8443A` `#6F8FA8` `#5E9E4A` `#4A4E5C` |
| Vành Đai Tây | be bụi, bê tông, gỉ sét, xanh lúa, vàng cảnh báo | `#CDBB96` `#9C9A90` `#A1552F` `#93C254` `#F2C230` |
| Ba Vì | rêu sâu, lục tối, đá ướt, sương | `#2F5E3B` `#6E8F3E` `#56685F` `#CFE3DD` |
| Thiên Mạch | trắng lab, thép, đỏ khẩn cấp, nền tối | `#E6ECF0` `#58636E` `#E0484A` `#15171D` |
| UI | vàng kem tương tác, nền giấy, mực | `#FFE7A8` `#F7F1E3` `#2B2735` |

### 5.3. Giờ trong ngày & thời tiết
Dùng `CanvasModulate` + đèn 2D, không vẽ lại asset:
- Sáng sớm: `#E8EEF5` (lạnh nhẹ, sương overlay).
- Trưa: `#FFFFFF`.
- Chiều vàng: `#FFD9A8`.
- Tối: `#6A6FA8` + đèn điểm vàng (quán, đèn đường) + linh năng mức 0 bật.
- Khuya: `#3C3F6E`.
- Mưa/nồm: giảm bão hòa 15%, overlay hạt mưa/sương, phản chiếu trên mặt đường.

## 6. Nhân vật

- **Body template cố định:** một khung xương pixel 32×48 cho mọi avatar (nam/nữ/không xác định chỉ khác lớp tóc/quần áo, không khác body) để trang phục dùng chung.
- **Hướng:** 4 hướng (xuống, lên, trái, phải; phải = lật trái nếu trang phục đối xứng).
- **Bộ animation tối thiểu cho mọi layer:** idle 4, đi 6, ngồi 2, câu cá 4, làm vườn 4, thiền 4 (vòng thở), tương tác 3, vẫy 3. ≈ 30 frame/hướng.
- **Thứ tự layer (paper-doll):** bóng → body/da → quần → giày → áo → áo khoác → tóc sau → đầu/mặt → tóc trước → mũ → phụ kiện → aura.
- **Giảm chi phí:** màu da/tóc/áo bằng **palette swap** (shader thay ramp), không vẽ lại. Mỗi item mới chỉ vẽ dạng hình, màu là biến thể.
- **Chân dung thoại/hồ sơ:** 96×96 pixel, biểu cảm 6 loại (thường, vui, ngạc nhiên, buồn, giận, nghĩ). Chi tiết dồn vào chân dung, sprite giữ đơn giản.
- **Chỉ báo "đang tự động"** (01 §5): avatar autonomous có viền mờ nhạt + icon hoạt động nhỏ trên đầu (cần câu, lá, hoa sen thiền); chủ nhân online thì có tên sáng và không viền.
- Outline: **outline tối màu theo vật liệu** (selout), không outline đen thuần, dày 1 px.

## 7. Môi trường

- Outline 1 px tối màu ở viền ngoài vật thể đứng; mặt đất không outline.
- Ánh sáng chính từ **trên-trái**; bóng đổ ngắn về phải-dưới, bóng là sprite riêng mờ tím (để đổi theo giờ).
- Dithering hạn chế: chỉ cho chuyển tiếp lớn (bầu trời, sương); không dither trên nhân vật.
- Nước: lớp riêng, gợn bằng shader, phản chiếu đơn giản; hồ trong hub trong và tĩnh, suối Ba Vì nhanh và trắng bọt.
- Chữ trên biển hiệu: font pixel tiếng Việt có dấu (5×7 hoặc 6×9) vẽ tay hoặc bitmap, tên hư cấu, không dùng logo thương hiệu thật.
- Prop có trạng thái (cửa cuốn đóng/mở, đèn tắt/bật, luống trống/có cây) vẽ đủ frame trạng thái ngay từ đầu.

## 8. Dị thú

Theo 11 §7. Thêm: 4 hướng cho thú nhỏ/vừa (boss có thể 2 hướng), bộ animation idle/di chuyển/báo hiệu tấn công/tấn công/bị đánh/rút lui. **Khung "báo hiệu" (telegraph) luôn có ánh ngọc lam** để người chơi đọc được đòn.

## 9. VFX linh năng

- Particle pixel (1–3 px), ít khung, màu ngọc lam; dùng additive blend nhẹ, không bloom toàn màn.
- Cực quang trời: lớp parallax riêng, chỉ khi "trời linh" hoặc ở vành đai/Ba Vì.
- Thiền: vòng thở aura quanh avatar, mạnh dần theo cảnh giới (không đổi trang phục).
- Ngoài chuẩn: không particle trôi — dùng **hình học tĩnh, nhấp nháy theo nhịp đều** (gợi xung nhân tạo của 05 §7).

## 10. UI — thống nhất game ↔ platform

- **Một hệ thiết kế** cho cả platform (lịch, nhật ký) và HUD game: nền giấy kem `#F7F1E3`, mực `#2B2735`, nhấn vàng kem `#FFE7A8`, bo góc nhỏ, bóng mềm.
- Font chữ thân: **Be Vietnam Pro** (đã có, OFL) ở độ phân giải gốc; font pixel chỉ cho tiêu đề ngắn, số liệu nhỏ trong thế giới và biển hiệu.
- Phong cách: **"điện thoại của người dân hậu Linh Chấn"** — thẻ, tab, icon tròn; máy quét linh phổ là widget đặc biệt có viền ngọc lam. Không khung gỗ/cuộn giấy cổ phong (04 §11).
- Icon hoạt động dùng chung giữa platform và game (đi câu, làm vườn, thiền, học, làm, nghỉ): **24×24 pixel**, 2 tông + outline, cùng một bộ.
- Text có dấu tiếng Việt phải test ở mọi cỡ, đặc biệt chữ ghép dấu (ễ, ặ, ữ).

## 11. Pipeline & quy ước file

- Công cụ chuẩn: **Aseprite** (nguồn `.aseprite` lưu trong repo/LFS), xuất PNG + JSON spritesheet; nhập Godot bằng Aseprite importer hoặc script xuất có kiểm soát.
- Godot: texture filter Nearest toàn dự án, không mipmap, bật snap 2D transform/vertex to pixel; thế giới trong `SubViewport` có kích thước = màn hình chia hệ số zoom nguyên (§3); UI ngoài viewport.
- Thư mục đề xuất: `client/art/<region>/<category>/<asset>.aseprite` → xuất `client/assets/<region>/<category>/<asset>.png`.
- Tên: `region_category_name_variant` chữ thường, gạch dưới, không dấu. Ví dụ `tl_prop_ghe_nhua_do`, `bv_flora_nam_phat_quang_a`, `char_top_ao_khoac_tham_hiem`.
- Mỗi asset có anchor/footprint/collider metadata theo 10 §4.

## 12. Nguồn asset, license, AI

- **Asset pack 16×16 hiện tại không có file license trong repo** → coi là placeholder, **không dùng cho bản phát hành**; thay toàn bộ khi sản xuất.
- Asset mua/miễn phí: chỉ nhận khi có license cho phép thương mại; lưu file license + nguồn trong `client/assets/LICENSES/`.
- **AI tạo ảnh:** cho phép ở khâu ý tưởng/moodboard nội bộ. Asset ship trong game phải do người vẽ hoặc chỉnh sửa đáng kể và ghi rõ. Lý do: theo báo cáo Cục Bản quyền Hoa Kỳ 01/2025, nội dung do AI tạo hoàn toàn không được bảo hộ bản quyền; Steam yêu cầu khai báo nội dung AI có trong game. Mọi asset có AI phải lưu prompt/nguồn (đã yêu cầu ở 10 §9) và đánh dấu trong metadata.
- Không dùng logo, nhãn hiệu, biển hiệu thương hiệu thật.

## 13. Art test — nghiệm thu style trước khi sản xuất

Không vẽ thêm vùng nào trước khi lát cắt này được duyệt:

1. **Một góc ngõ Thăng Long + bờ hồ** (khoảng 20×12 ô): 2 nhà ống có cửa cuốn đổi trạng thái, quán trà đá với ghế nhựa, cột điện + dây, cây bàng, 1 bến câu, 1 sân thượng vườn nhìn thấy được.
2. **Một avatar** với **2 bộ trang phục** + 2 màu tóc bằng palette swap, đủ idle/đi/ngồi/câu 4 hướng.
3. **Một dị thú** (Lợn Gai Sơn) đặt trong một mảnh Vành Đai Tây nhỏ để thấy tương phản tiền cảnh/hậu cảnh.
4. **Một VFX linh năng** mức 0 (dược liệu ban đêm) và mức 2 (đom đóm).
5. **Chu kỳ ngày** sáng → chiều → tối trên lát cắt 1, dùng **normal map + 3–4 `PointLight2D`** (đèn quán, đèn đường, linh năng) để kiểm chứng mục tiêu §2.1.
6. **Một màn HUD + một thẻ platform** dùng cùng hệ UI.

Tiêu chí duyệt:
- 5 người chưa biết dự án nhìn screenshot nói được "Việt Nam" trong ≤ 3 giây.
- Avatar đọc được ở ×2 trên màn hình điện thoại 6".
- Đo thời gian vẽ 1 bộ trang phục → ước tính chi phí cosmetic; nếu vượt ngân sách, xem lại phương án D (§2).
- Đo thời gian vẽ 1 nhà ống kèm normal map → ước tính chi phí một cảnh hub ở mức §2.1.
- Ảnh chụp buổi tối của lát cắt đứng cạnh ảnh tham chiếu Eastward: người xem thấy "cùng họ ánh sáng" nhưng nhận ra ngay là Việt Nam.
- Không vi phạm bảng kiểm §14.

## 14. Bảng kiểm chéo với canon

| Yêu cầu | Đáp ứng ở |
| --- | --- |
| 04 §12.1 Không làng cổ làm hub | 11 §4.1: hub là ngõ + bờ hồ đô thị |
| 04 §12.2 Không tông môn cổ trang | 11 §5, §9: trang phục/thiết chế hiện đại |
| 04 §12.3 Dấu hiệu Việt Nam hiện đại mỗi map | 11 §5, §10 |
| 04 §12.4 Vùng nguy hiểm có lý do | 11 §4.2–4.4, §10 |
| 04 §12.5 Công nghệ còn giá trị | 11 §4 lớp Linh Chấn, §10 |
| 04 §12.6–7 Bí ẩn hé dần, vũ trụ mở chậm | 11 §6 mức X hiếm |
| 01 trụ cột 2 & 5: avatar tự động, hiện diện | §6 chỉ báo tự động |
| 01 trụ cột 4: đời sống trong game | 11 §2, §13 art test |
| 09 hai không gian dùng chung | §10 một hệ UI, icon chung |
| 10 top-down 3/4, layered, Y-sort | §3, §7, §11 |

## 15. Nguồn tham khảo

- Game Developer — Road to the IGF: Pixpil's Eastward: https://www.gamedeveloper.com/disciplines/road-to-the-igf-pixpil-s-i-eastward-i-
- Red Bull — phỏng vấn Eastward (2D + ánh sáng deferred): https://www.redbull.com/my-en/eastward-interview
- Eastward (Wikipedia) — thời gian và quy mô đội: https://en.wikipedia.org/wiki/Eastward_(video_game)
- Sabotage Studio — Sea of Stars press (ánh sáng động trên sprite): https://sabotagestudio.com/press-release/sea-of-stars-the-highly-anticipated-turn-based-rpg-from-sabotage-studio-primed-for-playstation-consoles-in-2023/
- Fields of Mistria (Wikipedia): https://en.wikipedia.org/wiki/Fields_of_Mistria
- GameDev.net — chi phí paper-doll sprite: https://gamedev.net/forums/topic/622607-2d-action-game-sprites-paper-doll-equipment-or-custom-characters-with-unchanging-appearance/
- GDQuest — Pixel art setup Godot 4: https://www.gdquest.com/library/pixel_art_setup_godot4/
- Tube house (Wikipedia): https://en.wikipedia.org/wiki/Tube_house
- Skadden — báo cáo Copyright Office về AI (01/2025): https://www.skadden.com/insights/publications/2025/02/copyright-office-publishes-report
- PCGamesN — form khai báo AI của Steam: https://www.pcgamesn.com/steam/new-gen-ai-disclosure-form
