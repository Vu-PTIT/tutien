#!/usr/bin/env python3
"""Author the first world map from the agreed terrain and editable placements.

This writes JSON only. It does not draw or regenerate any source artwork.
All coordinates ending in _cell share the world's 32 px planning grid.
"""
from pathlib import Path
import copy
import json
import math
import random

CLIENT = Path(__file__).resolve().parents[1]
BASE = json.loads((CLIENT / 'data/world/maps/m_lang_que.json').read_text())
terrain = copy.deepcopy(BASE)
terrain['ground_regions'] = []
terrain['roads'] += [
    {'id': 'lq_lane_west', 'surface': 'earth', 'width_cells': 2.5,
     'points': [[18, 112], [44, 111], [69, 111], [87, 113], [103, 111]]},
    {'id': 'lq_lane_south', 'surface': 'earth', 'width_cells': 2.5,
     'points': [[23, 132], [46, 132], [74, 131], [96, 130], [107, 135]]},
    {'id': 'lq_lane_homes', 'surface': 'earth', 'width_cells': 2.5,
     'points': [[46, 111], [47, 131], [52, 145], [61, 151], [72, 157]]},
    {'id': 'lq_lane_new_town', 'surface': 'road', 'width_cells': 3,
     'points': [[147, 71], [177, 72], [201, 73], [220, 75], [234, 82], [211, 104]]},
    {'id': 'lq_lane_new_north', 'surface': 'concrete', 'width_cells': 2.5,
     'points': [[202, 73], [201, 55], [204, 34], [220, 34], [237, 34]]},
    {'id': 'lq_lane_new_middle', 'surface': 'concrete', 'width_cells': 2,
     'points': [[200, 56], [218, 56], [237, 57]]},
    {'id': 'lq_lane_garden_lake', 'surface': 'earth', 'width_cells': 2.5,
     'points': [[87, 157], [112, 153], [138, 155], [162, 152], [175, 151]]},
    {'id': 'lq_lane_cafe', 'surface': 'earth', 'width_cells': 2.5,
     'points': [[178, 144], [181, 138], [180, 136]]},
    {'id': 'lq_lane_pump', 'surface': 'earth', 'width_cells': 2,
     'points': [[147, 40], [141, 40], [139, 38]]},
    {'id': 'lq_lane_east', 'surface': 'asphalt', 'width_cells': 4,
     'points': [[199, 105], [218, 104], [238, 105], [256, 105]]},
]
terrain['waters'] += [
    {'id': 'lq_canal_bridge', 'shape': 'ribbon', 'width_cells': 1.8,
     'shore_width_cells': .4, 'points': [[239, 88], [238, 105], [241, 121], [235, 139]], 'collision': True},
    {'id': 'lq_lake_inlet', 'shape': 'ribbon', 'width_cells': 1.2,
     'shore_width_cells': .45, 'points': [[115, 143], [112, 153], [126, 164], [143, 168]], 'collision': True},
    {'id': 'lq_pump_canal', 'shape': 'ribbon', 'width_cells': 1.1,
     'shore_width_cells': .3, 'points': [[137, 36], [114, 42], [95, 48], [91, 65]], 'collision': True},
]

ASSET = 'res://assets/world/lang_que/'
PACK = 'res://assets/tileset/Art/'
assets = {
    **{k: ASSET + k + '.png' for k in ['house_tile', 'house_tin', 'tea_cafe', 'pump_station',
       'banyan', 'power_pole', 'market_stall', 'greenhouse', 'motorbike', 'plastic_seats',
       'produce_basket', 'bamboo', 'rice', 'vegetable', 'seedling', 'watering_can', 'grain_sacks']},
    'hall': 'res://assets/vietnam_village/dinh_linh_khe_m20.png',
    'well': PACK + 'Buildings/Well_Hay_1.png',
    'notice': PACK + 'Props/BulletinBoard_1.png',
    'sign': PACK + 'Props/Sign_1.png',
    'crate': PACK + 'Props/Crate_Medium_Closed.png',
    'tree_1': PACK + 'Trees and Bushes/Tree_Emerald_1.png',
    'tree_2': PACK + 'Trees and Bushes/Tree_Emerald_2.png',
    'tree_3': PACK + 'Trees and Bushes/Tree_Emerald_3.png',
    'bush': PACK + 'Trees and Bushes/Bush_Emerald_1.png',
    'rock': PACK + 'Rocks/Rock_Brown_1.png',
}
objects, yards, pois = [], [], []


def prop(uid, name, en, asset, cell, kind='decoration', action='', solid=None, **extra):
    obj = dict(id=uid, name=name, name_en=en, texture=assets[asset], cell=cell,
               kind=kind, action=action, art_scale=2, interaction_offset_px=[0, 32],
               radius_px=extra.pop('radius_override', 110), solid_px=solid or [])
    obj.update(extra)
    objects.append(obj)
    return obj


def house(uid, name, en, asset, cell, action='door', **extra):
    obj = prop(uid, name, en, asset, cell, 'house', action, [214, 36, 0, -18], **extra)
    yards.append(dict(id=uid + '_yard', center_cell=[cell[0], cell[1] + 1.5],
                      radii_cells=[6.3, 3.7], surface='packed_earth'))
    terrain['roads'].append(dict(id=uid + '_approach', surface='earth', width_cells=2,
                                points=[cell, [cell[0], cell[1] + 5]]))
    return obj


prop('lq_hall', 'Đình làng', 'Community hall', 'hall', [143, 103], 'house', 'hall',
     [268, 38, 0, -19], radius_override=145)
yards += [dict(id='lq_square', center_cell=[148, 110], radii_cells=[20, 10], surface='paving'),
          dict(id='lq_market_court', center_cell=[163, 102], radii_cells=[13, 6], surface='packed_earth')]
prop('lq_banyan', 'Cây đa sân đình', 'Village banyan', 'banyan', [134, 112], 'tree', '', [90, 28, 0, -14])
prop('lq_well', 'Giếng làng', 'Village well', 'well', [148, 117], 'well', 'well', [60, 26, 0, -13])
prop('lq_notice', 'Bảng tin làng', 'Village noticeboard', 'notice', [154, 111], 'sign', 'notice', [42, 16, 0, -8])
for i, (x, y) in enumerate([(153, 103), (162, 103), (171, 102), (160, 124), (169, 125)]):
    prop(f'lq_stall_{i+1:02}', ['Quầy hạt giống', 'Chợ rau', 'Hàng nông sản', 'Sạp đồ dùng', 'Góc chợ phiên'][i],
         ['Seed stall', 'Vegetable stall', 'Produce stall', 'Tool stall', 'Market stall'][i],
         'market_stall', [x, y], 'stall', 'shop', [166, 26, 0, -13])
for i, cell in enumerate([[141, 117], [157, 118], [133, 117], [176, 121], [181, 137], [186, 136]]):
    prop(f'lq_sit_{i+1:02}', 'Ghế nghỉ', 'Resting seats', 'plastic_seats', cell, 'bench', 'sit',
         [74, 24, 0, -12], seat_offset_px=[-24, -18], leave_offset_px=[0, 46])

west = [(31, 107), (47, 106), (65, 105), (83, 107), (24, 127), (44, 127), (74, 125), (92, 125)]
for i, cell in enumerate(west):
    house(f'lq_west_home_{i+1:02}', 'Nhà xóm Tây', 'West hamlet house',
          'house_tile' if i % 3 else 'house_tin', cell)
house('lq_player_house', 'Nhà vườn', 'Garden home', 'house_tile', [61, 146])
house('lq_workshop', 'Nhà kho dụng cụ', 'Tool shed', 'house_tin', [97, 148])
for i, cell in enumerate([(203, 29), (220, 29), (237, 29), (200, 51), (217, 51), (234, 52)]):
    house(f'lq_new_home_{i+1:02}', 'Nhà xóm mới', 'New hamlet house', 'house_tin', list(cell))
house('lq_classroom', 'Nhà sinh hoạt', 'Community classroom', 'house_tin', [208, 68], 'hall')
house('lq_greenhouse', 'Nhà kính', 'Greenhouse', 'greenhouse', [235, 69], 'greenhouse')
house('lq_pump', 'Trạm bơm', 'Irrigation pump', 'pump_station', [139, 36], 'pump')
objects[-1]['solid_px'] = [146, 28, 0, -14]
house('lq_cafe', 'Quán nước ven hồ', 'Lakeside tea cafe', 'tea_cafe', [180, 134], 'cafe')
objects[-1]['solid_px'] = [270, 26, 0, -13]

for i, cell in enumerate([[150, 100], [176, 126], [63, 147], [85, 108], [208, 31], [225, 53], [211, 69], [239, 70], [186, 135]]):
    prop(f'lq_motorbike_{i:02}', 'Xe máy', 'Motorcycle', 'motorbike', cell, 'decoration', '', [66, 20, 0, -10])
for i, cell in enumerate([[151, 117], [156, 124], [173, 102], [182, 137], [58, 149], [92, 151]]):
    prop(f'lq_basket_{i:02}', 'Giỏ rau', 'Produce basket', 'produce_basket', cell, 'decoration', '', [32, 16, 0, -8])
for i, cell in enumerate([[165, 102], [171, 124], [68, 147], [95, 150]]):
    prop(f'lq_sacks_{i:02}', 'Bao thóc', 'Grain sacks', 'grain_sacks', cell, 'decoration', '', [32, 18, 0, -9])

poles = [[147, 98], [177, 101], [205, 101], [225, 101], [246, 101], [201, 38], [201, 62], [174, 70], [147, 20], [151, 45], [151, 68], [107, 109]]
for i, cell in enumerate(poles):
    prop(f'lq_pole_{i:02}', 'Cột điện', 'Utility pole', 'power_pole', cell, 'pole', '', [22, 18, 0, -9])

bridges = [
    dict(id='lq_concrete_bridge', center_cell=[238, 105], size_cells=[7, 4], kind='concrete'),
    dict(id='lq_garden_bridge', center_cell=[112, 153], size_cells=[6, 3], kind='timber'),
    dict(id='lq_fishing_deck', center_cell=[177, 158], size_cells=[20, 4], kind='timber', rails='south'),
]
for i, cell in enumerate([[172, 157.6], [177, 157.6], [182, 157.6], [185, 157.6]]):
    prop(f'lq_fish_{i+1:02}', 'Bến câu', 'Fishing spot', 'sign', [cell[0] - 1.5, cell[1]],
         'fishing', 'fish', [18, 12, 0, -6], interaction_offset_px=[48, 16],
         fishing_target_cell=[cell[0], 164], stand_cell=cell)
prop('lq_meditate_01', 'Góc nghỉ ven hồ', 'Quiet lakeside corner', 'plastic_seats', [162, 155], 'bench', 'sit',
     [74, 24, 0, -12], seat_offset_px=[-24, -18], leave_offset_px=[0, 46])
for i, (link, cell, name, en) in enumerate([
    ('ln_lang_thang', [247, 105], 'Đường đi Thăng Long', 'Road to Thang Long'),
    ('ln_lang_vanh', [147, 10], 'Đường đê · Vành Đai Tây', 'Dyke road · West Frontier'),
]):
    prop('lq_portal_' + link, name, en, 'sign', [cell[0] + (2 if i else 0), cell[1] - (2 if not i else 0)],
         'portal', 'portal', [18, 12, 0, -6], link_id=link,
         interaction_offset_px=[-64, 0] if i else [0, 64], radius_override=135)

plots = []
for row in range(3):
    for col in range(4):
        cell = [68 + col * 5.5, 165 + row * 4]
        plots.append(dict(id=f'lq_plot_{row*4+col+1:02}', center_cell=cell, size_cells=[4, 2.5],
                          access_cell=[cell[0], cell[1] + 2], initial_stage='seeded' if (col + row) % 3 else 'ripe'))
prop('lq_water_tap', 'Vòi nước vườn', 'Garden water point', 'watering_can', [59, 156], 'decoration', 'well', [24, 14, 0, -7])

paddies = []
for row, bands in enumerate([(21, 38), (44, 61), (66, 79)]):
    for col, (left, right) in enumerate([(23, 44), (48, 68), (72, 88)]):
        top, bottom = bands
        paddies.append(dict(id=f'lq_paddy_{row}_{col}', points=[[left, top+1], [right-2, top],
            [right, bottom-2], [right-2, bottom], [left+1, bottom-1], [left-1, top+4]], solid=True))

districts = [
    ('LQ01_DONG_RUONG', 'Đồng ruộng', 'Rice fields', [12, 18, 84, 65], [56, 54]),
    ('LQ02_DE_TRAM', 'Đê và trạm bơm', 'Dyke & pumping station', [105, 6, 78, 67], [147, 37]),
    ('LQ03_XOM_MOI', 'Xóm mới', 'New hamlet', [186, 13, 59, 73], [215, 55]),
    ('LQ04_NHA_VUON', 'Xóm nhà vườn', 'Garden homes', [12, 90, 87, 84], [52, 119]),
    ('LQ05_CHINH', 'Sân đình · Chợ quê', 'Village square & market', [99, 74, 92, 67], [148, 110]),
    ('LQ06_CAU_PHO', 'Cầu phố', 'Road bridge', [191, 86, 64, 52], [238, 105]),
    ('LQ07_VUON', 'Vườn người chơi', 'Player garden', [25, 137, 86, 49], [73, 162]),
    ('LQ08_HO_CAU', 'Hồ câu', 'Fishing lake', [118, 138, 98, 50], [177, 158]),
]

npcs = []
for uid, name, en, cell, home, role, role_en, dialogue, english in [
    ('npc_lq_bac_minh', 'Bác Minh', 'Minh', [155, 105], [65, 110], 'Người bán hạt', 'Seed seller',
     'Vườn ở phía tây nam. Cứ gieo rồi tưới từng luống, đừng quên ghé bến hồ nghỉ nhé.',
     'The garden is to the southwest. Sow and water each plot, then take a break at the lake.'),
    ('npc_lq_co_hanh', 'Cô Hạnh', 'Hanh', [208, 71], [203, 33], 'Giáo viên', 'Teacher',
     'Xóm mới vẫn sáng đèn sau Linh Chấn. Nhà sinh hoạt là chỗ cả làng học và gặp nhau.',
     'Our new hamlet still has electricity. The community room is where the village learns and meets.'),
    ('npc_lq_chu_tam', 'Chú Tâm', 'Tam', [174, 156], [180, 137], 'Người giữ bến', 'Dock keeper',
     'Các biển nhỏ trên bến là chỗ thả câu. Nhớ đứng trên ván, nước hồ không đi bộ được đâu.',
     'The small signs mark fishing spots. Stay on the decking; the lake is not walkable.'),
    ('npc_lq_ong_bay', 'Ông Bảy', 'Bay', [145, 37], [139, 39], 'Trông đê', 'Dyke keeper',
     'Trạm bơm đưa nước về đồng. Đi lên đường đê là tới Vành Đai Tây, nhớ coi chừng dị thú.',
     'The pump irrigates our rice fields. The north dyke road leads to the frontier; watch for beasts.'),
    ('npc_lq_tho_moc_hoa', 'Thợ mộc Hoa', 'Hoa', [74, 128], [74, 128], 'Thợ mộc', 'Carpenter',
     'Ngõ nhà nối với sân đình và vườn. Cầu gỗ bên kia mương là lối tắt tới hồ câu.',
     'Our lanes connect the square and gardens. The wooden bridge is a shortcut to the fishing lake.'),
]:
    npcs.append(dict(id=uid, name=name, name_en=en, cell=cell, home_cell=home, role=role, role_en=role_en,
                     dialogue=dialogue, dialogue_en=english, service=True, patrol_cells=[]))
loops = [
    [[143, 109], [154, 109]], [[162, 110], [180, 109]], [[177, 142], [177, 154]],
    [[47, 112], [67, 112]], [[77, 131], [95, 131]], [[202, 55], [220, 56]],
    [[206, 73], [224, 76]], [[147, 58], [147, 68]], [[102, 138], [86, 149]],
    [[191, 113], [201, 117]],
]
for i, loop in enumerate(loops):
    npcs.append(dict(id=f'npc_lq_neighbor_{i:02}', name='Người làng', name_en='Villager',
                     cell=loop[0], home_cell=loop[0], role='Đi dạo', role_en='Taking a walk',
                     dialogue='Chào bạn! Hôm nay gió ngoài đồng mát lắm.',
                     dialogue_en='Hello! There is a lovely breeze in the fields today.',
                     service=False, patrol_cells=loop))


def segment_distance(p, a, b):
    dx, dy = b[0]-a[0], b[1]-a[1]
    t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/max(.0001, dx*dx+dy*dy)))
    return math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy)


def reserve(p):
    for road in terrain['roads']:
        if any(segment_distance(p, a, b) < road['width_cells']/2 + 3 for a, b in zip(road['points'], road['points'][1:])):
            return True
    for obj in objects:
        if math.hypot(p[0]-obj['cell'][0], p[1]-obj['cell'][1]) < (7 if obj['kind'] == 'house' else 4):
            return True
    for yard in yards:
        c, r = yard['center_cell'], yard['radii_cells']
        if ((p[0]-c[0])/(r[0]+2))**2+((p[1]-c[1])/(r[1]+2))**2 < 1:
            return True
    for plot in plots:
        c, s = plot['center_cell'], plot['size_cells']
        if abs(p[0]-c[0]) < s[0]/2+3 and abs(p[1]-c[1]) < s[1]/2+3:
            return True
    if 18 < p[0] < 98 and 15 < p[1] < 85:
        return True
    for water in terrain['waters']:
        if water['shape'] == 'ellipse':
            c, r = water['center_cell'], water['radii_cells']
            if ((p[0]-c[0])/(r[0]+3))**2+((p[1]-c[1])/(r[1]+3))**2 < 1:
                return True
        elif any(segment_distance(p, a, b) < water['width_cells']/2+3 for a, b in zip(water['points'], water['points'][1:])):
            return True
    return False


rng = random.Random(12102026)
for i in range(380):
    for attempt in range(40):
        p = [round(rng.uniform(3, 251), 2), round(rng.uniform(5, 188), 2)]
        if not reserve(p):
            break
    else:
        continue
    edge = p[0] < 12 or p[0] > 246 or p[1] < 17 or p[1] > 184
    is_tree = i % 3 == 0 or edge
    asset = f'tree_{i % 3 + 1}' if is_tree else ('bamboo' if i % 4 == 1 else 'bush')
    prop(f'lq_vegetation_{i:03}', 'Cây ven làng', 'Village greenery', asset, p,
         'tree' if is_tree else 'bush', '', [24, 16, 0, -8] if is_tree else [])

layout = dict(schema_version=1, map_id='m_lang_que', revision='v1-playable-village',
              size_px=[8192, 6144], cell_size_px=32, safe_zone=True, hostile_spawn_count=0,
              terrain=terrain, assets=assets, objects=objects, yards=yards, paddies=paddies,
              bridges=bridges, plots=plots, npcs=npcs, npc_texture=ASSET+'villager_walk.png',
              districts=[dict(id=x[0], name=x[1], name_en=x[2], rect_cells=x[3], center_cell=x[4]) for x in districts],
              activity_slots=[dict(id=x['id'], activity='fishing', capacity=1, cell=x['stand_cell'])
                              for x in objects if x['action']=='fish'] +
                             [dict(id=x['id'], activity='gardening', capacity=1, cell=x['access_cell']) for x in plots],
              checkpoints=[dict(id='lq_square', cell=[143,119]), dict(id='lq_dock', cell=[174,156]),
                           dict(id='lq_dyke', cell=[147,14])],
              portal_link_ids=['ln_lang_thang','ln_lang_vanh'],
              authority='offline map prototype; local state, no online reward settlement')
out = CLIENT / 'data/world/lang_que_layout.json'
out.write_text(json.dumps(layout, ensure_ascii=False, indent=2)+'\n')
print(f'Wrote {out.name}: {len(objects)} props, {len(npcs)} NPCs, {len(plots)} plots, {len(terrain["roads"])} routes')
