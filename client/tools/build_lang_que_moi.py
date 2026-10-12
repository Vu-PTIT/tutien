#!/usr/bin/env python3
"""Author a new village from an empty layout; never load a legacy map as input.

Only reusable artwork and the two world-link endpoints are shared. Coordinates
use the established 32 px planning grid. Re-running this file is deterministic.
"""
from pathlib import Path
import json
import math
import random

CLIENT = Path(__file__).resolve().parents[1]
ART = 'res://assets/world/lang_que/'
PACK = 'res://assets/tileset/Art/'
assets = {k: ART + k + '.png' for k in (
    'house_tile', 'house_tin', 'tea_cafe', 'pump_station', 'banyan',
    'power_pole', 'market_stall', 'greenhouse', 'motorbike', 'plastic_seats',
    'produce_basket', 'bamboo', 'rice', 'vegetable', 'seedling',
    'watering_can', 'grain_sacks')}
assets.update({
    'hall': 'res://assets/world/lang_que_moi/community_hall.png',
    'well': PACK + 'Buildings/Well_Hay_1.png',
    'notice': PACK + 'Props/BulletinBoard_1.png',
    'sign': PACK + 'Props/Sign_1.png',
    'crate': PACK + 'Props/Crate_Medium_Closed.png',
    'tree_1': PACK + 'Trees and Bushes/Tree_Emerald_1.png',
    'tree_2': PACK + 'Trees and Bushes/Tree_Emerald_2.png',
    'tree_3': PACK + 'Trees and Bushes/Tree_Emerald_3.png',
    'bush': PACK + 'Trees and Bushes/Bush_Emerald_1.png',
    'rock': PACK + 'Rocks/Rock_Brown_1.png',
})

# New land, road and water geometry. No legacy map input.
terrain = dict(
    map_id='m_lang_que', name='Làng quê · Bản làng mới',
    width_cells=256, height_cells=192, cell_size_px=32, spawn_cell=[130, 111],
    palette={
        'grass': ['#78975e', '#9cb573', '#587848'],
        'field': ['#a09a50', '#c4b966', '#777d40'],
        'earth': ['#ac895b', '#cbae78', '#7d6447'],
        'packed_earth': ['#b79a6d', '#ccb486', '#8a7556'],
        'paving': ['#b68c68', '#d3ab82', '#8b705a'],
        'road': ['#a88c65', '#c0a87f', '#837257'],
        'asphalt': ['#626b65', '#828981', '#46524f'],
        'concrete': ['#9b9d8d', '#babcaa', '#777d70'],
        'shore': ['#b89f6a', '#d6bf8c', '#877851'],
        'water': ['#447e89', '#74aaa9', '#2c5c6c'],
    }, ground_regions=[], roads=[], waters=[])


def road(uid, points, width=2.8, surface='earth'):
    terrain['roads'].append(dict(id='new_' + uid, points=points,
                                width_cells=width, surface=surface))


road('east_main', [[256,105],[249,105],[238,105],[222,109],[202,112],
                  [181,113],[162,113],[149,112],[135,110],[113,111]], 4, 'road')
road('north_dyke', [[147,0],[147,8],[147,22],[154,44],[158,64],
                   [152,82],[149,97],[149,112]], 3.5)
road('west_loop', [[113,111],[105,97],[83,92],[65,94],[45,99],[28,105],
                  [23,120],[40,128],[64,133],[90,128],[113,111]], 3)
road('west_cross', [[28,105],[51,111],[72,113],[92,116],[113,111]], 2.8)
road('west_lane', [[46,99],[49,111],[44,126]], 2.5)
road('west_lane_2', [[83,92],[78,109],[79,130]], 2.5)
road('garden_approach', [[113,111],[101,118],[97,129],[95,142],[91,153],[75,156],
                        [61,155],[48,164],[42,178]], 3)
road('garden_lane', [[48,164],[66,166],[87,164],[106,159],[106,151]], 2.5)
road('lake_shortcut', [[91,153],[106,151],[120,151],[134,149],[149,145],
                      [160,143],[170,146],[177,150]], 3)
road('square_to_lake', [[149,112],[155,126],[165,135],[177,140],
                       [190,139],[202,143]], 3)
road('lake_bank_west', [[134,149],[127,158],[130,174],[147,182]], 2.5)
road('lake_bank_east', [[202,143],[211,152],[211,172],[199,183],[177,186],
                       [159,185],[147,182]], 2.5)
road('market_loop', [[149,112],[175,113],[183,124],[175,131],
                    [156,129],[149,112]], 2.5)
road('new_hamlet_link', [[158,64],[177,63],[194,65],[215,69],[224,77]], 3.2, 'concrete')
road('new_hamlet_spine', [[202,112],[204,96],[199,84],[194,65],[198,43],
                         [214,32],[224,35]], 3, 'concrete')
road('new_hamlet_north', [[198,43],[212,48],[223,51]], 2.5)
road('new_hamlet_south', [[194,65],[207,69],[220,70]], 2.5)
road('field_entrance', [[105,97],[95,83],[87,71],[77,61],[63,54],[44,51]], 2.8)
road('field_bund_north', [[14,44],[34,43],[55,43],[72,41],[96,40],
                         [116,35],[137,34],[152,36]], 2.6)
road('field_bund_south', [[15,73],[36,71],[56,73],[75,72],[87,71]], 2.6)
road('pump_approach', [[152,36],[137,34],[128,29]], 2.6)

terrain['waters'] = [
    dict(id='new_east_river', shape='ribbon', width_cells=4.0, shore_width_cells=.8,
         points=[[237,0],[232,18],[231,39],[233,56],[231,75],[235,90],
                 [238,105],[244,123],[237,140],[228,158],[233,178],[245,192]], collision=True),
    dict(id='new_irrigation', shape='ribbon', width_cells=1.6, shore_width_cells=.45,
         points=[[126,29],[109,23],[95,19],[76,15],[56,13],[34,13],[17,16]], collision=True),
    dict(id='new_garden_stream', shape='ribbon', width_cells=2.6, shore_width_cells=.5,
         points=[[106,122],[115,133],[117,144],[116,151],[120,164],[131,177],
                 [141,192]], collision=True),
    dict(id='new_fishing_lake', shape='polygon', shore_width_cells=1.0,
         points=[[151,153],[157,148],[167,147],[173,150],[181,149],[189,153],
                 [199,157],[204,164],[203,172],[198,178],[187,181],[178,183],
                 [167,180],[158,179],[150,175],[143,171],[139,164],[143,157]], collision=True),
]

objects, yards, plots, paddies, npcs = [], [], [], [], []


def prop(uid, name, en, asset, cell, kind='decoration', action='', solid=None, **extra):
    info = dict(id='new_' + uid, name=name, name_en=en, texture=assets[asset],
                cell=list(cell), kind=kind, action=action, art_scale=2,
                interaction_offset_px=[0,32], radius_px=110, solid_px=solid or [])
    info.update(extra)
    objects.append(info)
    return info


def home(uid, cell, asset='house_tile', name='Nhà xóm vườn', action='door'):
    prop(uid, name, 'Village house', asset, cell, 'house', action, [214,36,0,-18])
    yards.append(dict(id='new_'+uid+'_yard', center_cell=[cell[0],cell[1]+1.5],
                      radii_cells=[4.7,3], surface='packed_earth'))
    road(uid+'_approach', [list(cell),[cell[0],cell[1]+5]], 2.2)


prop('hall', 'Đình làng mới', 'Village communal hall', 'hall', [130,101], 'house',
     'hall', [312,38,0,-19], radius_px=145)
yards.append(dict(id='new_square', center_cell=[136,109], radii_cells=[16,10],
                  points=[[117,103],[123,98],[138,99],[151,104],[152,114],
                          [143,121],[126,120],[115,113]], surface='paving'))
yards.append(dict(id='new_market_court', center_cell=[167,115], radii_cells=[13,13],
                  points=[[154,97],[177,97],[181,107],[179,129],[158,132],
                          [151,121]], surface='packed_earth'))
prop('banyan', 'Cây đa đầu sân', 'Square banyan', 'banyan', [118,115], 'tree', '', [72,26,0,-13])
prop('well', 'Giếng làng', 'Village well', 'well', [141,118], 'well', 'well', [60,26,0,-13])
prop('notice', 'Bảng tin làng', 'Village noticeboard', 'notice', [146,107], 'sign', 'notice', [42,16,0,-8])
for i, cell in enumerate([[157,102],[169,102],[160,126],[172,126],[179,119]]):
    prop(f'stall_{i+1:02}', ['Quầy hạt giống','Sạp rau','Chợ nông sản','Sạp đồ dùng','Hàng quê'][i],
         'Village market stall', 'market_stall', cell, 'stall', 'shop', [166,26,0,-13])
for i, cell in enumerate([[125,117],[151,120],[138,101],[169,134],[192,142],[202,141]]):
    prop(f'sit_{i+1:02}', 'Ghế nghỉ', 'Resting seats', 'plastic_seats', cell, 'bench', 'sit',
         [74,24,0,-12], seat_offset_px=[-24,-18], leave_offset_px=[0,46])

# Close, irregular clusters of houses with real through lanes between them.
for i, cell in enumerate([[31,100],[48,95],[64,90],[85,93],[103,93],
                         [35,117],[60,107],[96,108],[42,123],[63,128],[89,122]]):
    home(f'west_home_{i+1:02}', cell, 'house_tin' if i in (1,5,8) else 'house_tile')
home('player_house', [62,148], name='Nhà vườn của bạn')
home('workshop', [99,142], 'house_tin', 'Kho dụng cụ')
for i, cell in enumerate([[198,37],[216,27],[210,44],[222,47],[192,59],[209,63],
                         [220,64],[201,78],[217,83]]):
    home(f'east_home_{i+1:02}', cell, 'house_tin' if i%2 else 'house_tile', 'Nhà xóm mới')
home('classroom', [190,91], 'house_tin', 'Nhà sinh hoạt', 'hall')
home('greenhouse', [218,93], 'greenhouse', 'Nhà kính', 'greenhouse')
home('pump', [128,27], 'pump_station', 'Trạm bơm', 'pump')
objects[-1]['solid_px']=[146,28,0,-14]
home('cafe', [192,137], 'tea_cafe', 'Quán nước bờ hồ', 'cafe')
objects[-1]['solid_px']=[270,26,0,-13]

for i, cell in enumerate([[127,102],[174,130],[65,150],[101,144],[201,39],
                         [211,66],[226,94],[195,138],[86,90],[37,119]]):
    prop(f'bike_{i:02}', 'Xe máy', 'Motorcycle', 'motorbike', cell, solid=[66,20,0,-10])
for i, cell in enumerate([[163,103],[174,127],[155,123],[199,140],[59,151],[97,147]]):
    prop(f'basket_{i:02}', 'Giỏ rau', 'Produce basket', 'produce_basket', cell, solid=[32,16,0,-8])
for i, cell in enumerate([[165,126],[173,101],[68,150],[105,143]]):
    prop(f'sacks_{i:02}', 'Bao thóc', 'Grain sacks', 'grain_sacks', cell, solid=[32,18,0,-9])

poles = [[153,108],[180,109],[203,107],[221,104],[247,102],
         [148,15],[152,33],[158,57],[152,81],[192,47],[194,72],[199,95],
         [110,108],[86,113],[63,112],[188,136],[204,141]]
for i, cell in enumerate(poles):
    prop(f'pole_{i:02}', 'Cột điện', 'Utility pole', 'power_pole', cell, 'pole', '', [22,18,0,-9])

bridges = [
    dict(id='new_city_bridge',center_cell=[238,105],size_cells=[11,4],kind='concrete'),
    dict(id='new_garden_bridge',center_cell=[116,151],size_cells=[9,4],kind='timber'),
    dict(id='new_fishing_deck',center_cell=[177,150],size_cells=[23,5],kind='timber',rails='south'),
]
for i, x in enumerate([169,175,181,187]):
    prop(f'fish_{i+1:02}', 'Bến câu', 'Fishing spot', 'sign', [x-1.5,150],
         'fishing','fish',[18,12,0,-6],interaction_offset_px=[48,16],
         stand_cell=[x,150], fishing_target_cell=[x,158])
prop('meditate', 'Ghế ngắm hồ', 'Lakeside rest', 'plastic_seats', [151,145],
     'bench','sit',[74,24,0,-12],seat_offset_px=[-24,-18],leave_offset_px=[0,46])

for link, cell, label, label_en, offset in [
    ('ln_lang_thang',[249,102],'Thăng Long →','Thang Long →',[0,96]),
    ('ln_lang_vanh',[150,8],'↑ Vành Đai Tây','↑ West Frontier',[-96,0])]:
    prop('portal_'+link,label,label_en,'sign',cell,'portal','portal',[18,12,0,-6],
         link_id=link,interaction_offset_px=offset,radius_px=140)

for row in range(3):
    for col in range(4):
        c=[65+col*6,164+row*5]
        plots.append(dict(id=f'new_plot_{row*4+col+1:02}',center_cell=c,size_cells=[4,2.5],
                          access_cell=[c[0],c[1]+2],initial_stage='ripe' if (col+row)%3==0 else 'seeded'))
prop('water_tap','Vòi nước vườn','Garden water point','watering_can',[56,158],
     action='well',solid=[24,14,0,-7])

# Individually authored paddy outlines, separated by shared walkable bunds.
field_shapes = [
    [[18,22],[39,19],[42,35],[34,39],[18,37]],
    [[44,20],[66,19],[71,35],[64,39],[46,38]],
    [[73,22],[88,27],[92,35],[88,37],[74,36]],
    [[19,47],[36,46],[42,50],[39,65],[20,66]],
    [[45,48],[62,47],[67,54],[64,67],[46,65]],
    [[71,47],[85,46],[92,52],[87,65],[79,62],[70,55]],
    [[22,77],[37,76],[46,78],[42,87],[29,91],[20,87]],
    [[50,78],[64,78],[71,84],[69,88],[51,89]],
    [[78,77],[89,76],[97,84],[94,89],[78,86]],
]
for i, outline in enumerate(field_shapes):
    paddies.append(dict(id=f'new_paddy_{i:02}',points=outline,solid=True))

districts = [
    ('FIELDS','Đồng ruộng','Rice fields',[12,16,88,76],[53,54]),
    ('DYKE','Đê · Trạm bơm','Dyke & pump',[104,4,76,80],[149,38]),
    ('EAST','Xóm mới','New hamlet',[181,18,49,86],[204,67]),
    ('WEST','Xóm nhà vườn','Garden hamlet',[15,87,96,52],[62,112]),
    ('SQUARE','Sân đình · Chợ','Square & market',[111,92,73,43],[138,112]),
    ('BRIDGE','Cầu phố','City bridge',[186,102,69,35],[237,105]),
    ('GARDEN','Vườn của bạn','Your garden',[29,140,84,48],[77,165]),
    ('LAKE','Hồ câu','Fishing lake',[121,136,100,53],[177,162]),
]

for uid, name, en, cell, home_cell, role, role_en, vi, english in [
    ('minh','Bác Minh','Minh',[157,105],[64,94],'Bán hạt giống','Seed seller',
     'Vườn ở tây nam, đi theo ngõ nhà rồi rẽ xuống kho dụng cụ. Cầu gỗ qua mương nối thẳng sang hồ.',
     'The garden is southwest. Follow the house lane past the tool shed; the wooden bridge leads to the lake.'),
    ('hanh','Cô Hạnh','Hanh',[190,94],[198,40],'Giáo viên','Teacher',
     'Nhà sinh hoạt của xóm mới nằm bên đường bê tông, cả làng vẫn dùng điện và trạm bơm.',
     'The community room is on the concrete lane. We still have electricity and an irrigation pump.'),
    ('tam','Chú Tâm','Tam',[173,145],[192,140],'Giữ bến câu','Dock keeper',
     'Bến ván nằm ở bờ bắc hồ. Bốn biển câu có lối đứng riêng, không cần đi xuống nước.',
     'The deck is on the north shore. Each of the four fishing signs has a safe standing place.'),
    ('bay','Ông Bảy','Bay',[134,30],[128,30],'Trông đê','Dyke keeper',
     'Đê uốn lên phía bắc, đi hết đê là Vành Đai Tây. Làng an toàn, ngoài đó mới có dị thú.',
     'The dyke bends north to the West Frontier. The village is safe; the beasts live beyond it.'),
    ('hoa','Thợ mộc Hoa','Hoa',[99,145],[63,131],'Thợ mộc','Carpenter',
     'Xóm nhà có ngõ vòng, vườn nằm phía sau. Ghé sân đình trước rồi xuống hồ nghỉ nhé.',
     'The house lanes form a loop, with gardens behind. Visit the square, then relax at the lake.'),
]:
    npcs.append(dict(id='new_npc_'+uid,name=name,name_en=en,cell=cell,home_cell=home_cell,
                     role=role,role_en=role_en,dialogue=vi,dialogue_en=english,service=True,patrol_cells=[]))
for i, loop in enumerate([
    [[127,112],[139,113]], [[160,114],[174,114]], [[183,138],[191,142]],
    [[48,112],[70,114]], [[29,121],[38,128]], [[193,66],[205,69]],
    [[202,97],[202,107]], [[148,18],[152,31]], [[94,153],[104,150]],
    [[211,158],[211,170]],
]):
    npcs.append(dict(id=f'new_npc_neighbor_{i:02}',name='Người làng',name_en='Villager',
                     cell=loop[0],home_cell=loop[0],role='Đi dạo',role_en='Walking',
                     dialogue='Chào bạn! Ra sân đình hay ghé hồ câu một lát nhé.',
                     dialogue_en='Hello! Come to the square or take a break at the lake.',
                     service=False,patrol_cells=loop))


def segment_distance(p, a, b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/max(.0001,dx*dx+dy*dy)))
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)


def inside(p, outline):
    result=False
    for a,b in zip(outline,outline[1:]+outline[:1]):
        if (a[1]>p[1]) != (b[1]>p[1]) and p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:
            result=not result
    return result


def reserved(p):
    for r in terrain['roads']:
        if any(segment_distance(p,a,b)<r['width_cells']/2+2.6 for a,b in zip(r['points'],r['points'][1:])):
            return True
    for w in terrain['waters']:
        if w['shape']=='polygon':
            if inside(p,w['points']) or any(segment_distance(p,a,b)<3 for a,b in zip(w['points'],w['points'][1:]+w['points'][:1])):
                return True
        elif any(segment_distance(p,a,b)<w['width_cells']/2+2.5 for a,b in zip(w['points'],w['points'][1:])):
            return True
    for o in objects:
        if math.hypot(p[0]-o['cell'][0],p[1]-o['cell'][1])<(7 if o['kind']=='house' else 2.5):
            return True
    for f in paddies:
        if inside(p,f['points']): return True
    for y in yards:
        c,r=y['center_cell'],y['radii_cells']
        if ((p[0]-c[0])/(r[0]+2))**2+((p[1]-c[1])/(r[1]+2))**2<1: return True
    for plot in plots:
        if math.hypot(p[0]-plot['center_cell'][0],p[1]-plot['center_cell'][1])<4: return True
    for n in npcs:
        if any(math.hypot(p[0]-c[0],p[1]-c[1])<2.5 for c in [n['cell'],n['home_cell']]+n['patrol_cells']): return True
    return False


rng=random.Random(2026101202)
for i in range(720):
    for _ in range(80):
        p=[round(rng.uniform(3,252)*2)/2,round(rng.uniform(4,188)*2)/2]
        if not reserved(p): break
    else: continue
    edge=p[0]<15 or p[0]>243 or p[1]<15 or p[1]>185
    tree=edge or i%3==0
    key=f'tree_{i%3+1}' if tree else ('bamboo' if i%4==0 else 'bush')
    prop(f'green_{i:03}','Cây ven làng','Village greenery',key,p,
         'tree' if tree else 'bush',solid=[24,16,0,-8] if tree else [])

layout=dict(schema_version=1,map_id='m_lang_que',layout_id='lang_que_moi',
            revision='new-village-from-empty-layout-v1',size_px=[8192,6144],cell_size_px=32,
            safe_zone=True,hostile_spawn_count=0,terrain=terrain,assets=assets,
            objects=objects,yards=yards,paddies=paddies,bridges=bridges,plots=plots,npcs=npcs,
            npc_texture=ART+'villager_walk.png',
            districts=[dict(id='NEW_'+d[0],name=d[1],name_en=d[2],rect_cells=d[3],center_cell=d[4]) for d in districts],
            cable_pairs=[[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],
                         [9,10],[10,11],[0,12],[12,13],[13,14],[15,16]],
            activity_slots=[dict(id=o['id'],activity='fishing',capacity=1,cell=o['stand_cell']) for o in objects if o['action']=='fish']+
                           [dict(id=p['id'],activity='gardening',capacity=1,cell=p['access_cell']) for p in plots],
            checkpoints=[dict(id='new_square',cell=[130,111]),dict(id='new_dock',cell=[177,150]),
                         dict(id='new_dyke',cell=[147,14])],
            portal_link_ids=['ln_lang_thang','ln_lang_vanh'],
            authority='offline map prototype; local state, no online reward settlement',
            source=dict(authoring='tools/build_lang_que_moi.py',legacy_layout_inputs=[],
                        shared_contracts=['32 px world planning grid','data/world/links.json'],
                        note='All terrain and placements authored anew; reusable sprite artwork is shared.'))
output=CLIENT/'data/world/lang_que_moi_layout.json'
output.write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
print(f'New village: {len(objects)} objects, {len(npcs)} NPCs, {len(terrain["roads"])} roads, {len(terrain["waters"])} water bodies')
