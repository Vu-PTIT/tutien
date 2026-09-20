# Tiến độ triển khai — 20/09/2026

Mốc nguồn: `main` tại `94fca39`. Backend xã hội và bộ thiết kế v2 đã nằm chung
trên `main`. Mã nguồn thực tế tại mốc này chưa có catalog gameplay, migration
schema 3, combat hoặc hệ nhiệm vụ; không dùng các mô tả trong hội thoại thay cho
mã nguồn đã kiểm tra.

## Thứ tự thực hiện

| Thứ tự | Phần | Trạng thái và điều kiện chuyển bước |
|---|---|---|
| 1 | Authoritative match hai người | Có implementation và unit test trong nhánh này; xem `combat-prototype.md`. Live smoke nằm trong CI. Cần qua CI và chơi thử mạng trước mở rộng. |
| 2 | Tài sản và dữ liệu nhân vật | Chưa làm. Catalog ID ổn định, profile migration, inventory; server cấp thưởng bằng operation ID chống lặp, CAS/atomic write, test disconnect/retry. |
| 3 | Combat PvE + encounter | Chưa làm. Tái sử dụng luật server; thêm AI Sơn Trư, kết quả encounter duy nhất và đường cấp loot qua lớp tài sản đã kiểm chứng. |
| 4 | Vòng chơi tài nguyên | Chưa làm. Thu thập → trồng linh thảo → công thức luyện đan → dùng vật phẩm → tu luyện/mở Luyện Khí. |
| 5 | Quest, story và bản đồ chương đầu | Chưa làm. Runtime tiến độ server, điều kiện mở khóa, checkpoint; đưa nội dung 02/04/05/06/07 vào catalog. |
| 6 | Vertical slice và mở rộng | Chưa làm. Playtest một phiên chơi xuyên hệ thống; đo mạng, tải, lỗi lưu tiến độ; sau đó mới tăng map/kỹ năng/tông môn/PvP. |

## Kết quả kiểm tra local của mốc 1

- `npm --prefix server test`: 40/40 test đạt, gồm 17 test chiến đấu mới và 23 test cũ.
- Godot 4.4.1 headless: import và chạy scene thành công.
- Không có Docker daemon trong môi trường sửa mã này. Live integration được cấu
  hình chạy trên GitHub Actions; xem kết quả run gắn với commit/PR, không coi việc
  thêm script là đã qua kiểm thử backend thật.

## Khoảng trống tài liệu đã phát hiện

`docs/game-design/README.md` là mục lục của gói đầy đủ nhưng repo hiện chỉ chứa
README và các phần 00–07. Các phần 08–15, `design-samples/mvp.catalog.json` và
`scripts/validate_design.py` được dẫn chiếu nhưng chưa có trong Git tại mốc nguồn.
Giữ các tham chiếu đó để truy vết; chưa đánh dấu chúng là đã triển khai. Ưu tiên của
lần này được lấy từ README gốc, ADR-003 và tài liệu chiến đấu 03 đang có.
