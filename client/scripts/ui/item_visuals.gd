extends RefCounted
## Presentation metadata only: does not grant items or define gameplay rewards.
const DATA := {
	"it_seed_cam_lo": ["Hạt Cam Lộ", 8, "material", "Hạt giống linh thảo.", "Vật tư khởi đầu"],
	"it_herb_cam_lo": ["Cam Lộ", 1, "material", "Linh thảo dùng trong luyện đan.", "Trúc Âm • chưa mở"],
	"it_seed_tinh_tam": ["Hạt Tĩnh Tâm", 8, "material", "Hạt giống Tĩnh Tâm.", "Linh điền • chưa mở"],
	"it_herb_tinh_tam": ["Tĩnh Tâm", 1, "material", "Dược liệu thanh tâm.", "Linh điền • chưa mở"],
	"it_seed_ich_khi": ["Hạt Ích Khí", 8, "material", "Hạt giống Ích Khí.", "Linh điền • chưa mở"],
	"it_herb_ich_khi": ["Ích Khí", 1, "material", "Dược liệu bồi bổ linh khí.", "Linh điền • chưa mở"],
	"it_water": ["Nước", 2, "material", "Nước tưới linh thảo.", "Vật tư khởi đầu"],
	"it_bamboo": ["Trúc", 7, "material", "Thân trúc dùng chế tác.", "Trúc Âm • chưa mở"],
	"it_iron": ["Thiết quặng", 6, "material", "Nguyên liệu rèn trang bị.", "Thạch Cạn • chưa mở"],
	"it_spirit_dust": ["Linh sa", 10, "material", "Bụi linh lực kết tinh.", "Khám phá • chưa mở"],
	"it_spider_silk": ["Tơ nhện", 12, "material", "Nguyên liệu chế tác.", "Độc Chu • chưa mở"],
	"it_boar_hide": ["Da Sơn Trư", 12, "material", "Da thú dùng chế tác.", "Sơn Trư • chưa mở"],
	"it_venom": ["Độc dịch", 2, "material", "Nguyên liệu luyện chế.", "Độc Chu • chưa mở"],
	"it_heal_pill": ["Hồi Nguyên Hoàn", 0, "consumable", "Đan dược hồi phục. Chưa hỗ trợ sử dụng.", "Vật tư khởi đầu"],
	"it_qi_pill": ["Ích Khí Tán", 10, "consumable", "Đan dược linh lực. Chưa hỗ trợ sử dụng.", "Luyện đan • chưa mở"],
	"it_ward_talisman": ["Hộ Thân Phù", 3, "consumable", "Phù hộ thân. Chưa hỗ trợ sử dụng.", "Chế tác • chưa mở"],
	"it_escape_talisman": ["Thoát Thân Phù", 3, "consumable", "Phù thoát thân. Chưa hỗ trợ sử dụng.", "Chế tác • chưa mở"],
	"it_iron_sword": ["Thanh Thiết Kiếm", 4, "equipment", "Kiếm sắt của người mới nhập đạo. Chưa hỗ trợ trang bị.", "Lò rèn • chưa mở"],
	"it_cloth_armor": ["Áo vải", 5, "equipment", "Áo vải giản dị. Chưa hỗ trợ trang bị.", "Vật tư khởi đầu"],
	"it_mach_ban": ["Mạch Bàn", 11, "quest", "Dụng cụ dò linh mạch.", "Nhiệm vụ • chưa mở"],
	"it_water_sample": ["Mẫu nước", 2, "quest", "Mẫu nước cần khảo sát.", "Nhiệm vụ • chưa mở"],
	"it_ledger": ["Sổ ghi chép", 9, "quest", "Ghi chép của người trong làng.", "Nhiệm vụ • chưa mở"],
	"it_array_shard": ["Mảnh trận", 10, "quest", "Mảnh vỡ trận pháp.", "Nhiệm vụ • chưa mở"],
	"it_well_key": ["Chìa khóa Cổ Tỉnh", 14, "quest", "Vật phẩm mở lối.", "Nhiệm vụ • chưa mở"]
}

static func definition(id: String) -> Array:
	return DATA.get(id, [id, 9, "material", "Chưa có mô tả.", "Chưa rõ"])

static func icon(id: String) -> Texture2D:
	var entry := definition(id)
	return load("res://assets/pixel/icon_%d.tres" % int(entry[1])) as Texture2D
