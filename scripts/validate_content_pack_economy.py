#!/usr/bin/env python3
from __future__ import annotations
import csv, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'design-samples'/'content-pack-economy'/'v1'

def fail(msg): raise SystemExit('CONTENT PACK INVALID: '+msg)
def load_csv(name):
    names = name if isinstance(name, list) else [name]
    rows=[]
    for part in names:
        with (BASE/part).open(encoding='utf-8',newline='') as f:
            rows.extend(csv.DictReader(f))
    return rows
def intval(v): return None if v=='' else int(v)
def floatval(v): return None if v=='' else float(v)
def boolval(v): return str(v).lower()=='true'
def pos_or_none(v,label):
    if v is not None and v<=0: fail(f'{label} must be null or positive')

def main():
    d=json.loads((BASE/'meta.json').read_text(encoding='utf-8'))
    if d.get('schemaVersion')!=1 or d.get('version')!='content-pack-economy-v1.1': fail('schema/version')
    if d.get('status')!='design_only_unimplemented' or d.get('runtimeCatalogImportAllowed') is not False: fail('runtime status')
    if d['economyRef']!={'version':'economy-v1','unitSpiritStones':60,'referenceRunNet':60,'referenceRunMinutes':[15,20]}: fail('economy reference drift')
    if d['currencyContract']['walletCurrencies']!=['spirit_stones'] or not d['currencyContract']['inventoryCurrencyForbidden']: fail('currency contract')
    m=d['marketContract']
    if (m['listingFeeBps'],m['salesTaxBps'],m['directTradeFeeBps'],m['maxActiveSellOrders'])!=(100,400,100,8): fail('market contract')
    eq,sk,it,recipes=(load_csv(d['dataFiles'][k]) for k in ('equipment','skills','items','recipes'))
    if (len(eq),len(sk),len(it))!=(50,40,100): fail('expected 50 equipment / 40 skills / 100 items')
    for label,rows in [('equipment',eq),('skills',sk),('items',it)]:
        ids=[x['id'] for x in rows]
        if len(ids)!=len(set(ids)): fail(f'duplicate {label} id')
    item_ids={x['id'] for x in it}; equip_item_ids={x['itemId'] for x in eq}; all_items=item_ids|equip_item_ids
    if any(x.startswith('it_cur_') for x in item_ids): fail('inventory currency id present')
    if any(x['group']=='Tiền tệ' or x['kind']=='Tiền tệ' for x in it): fail('inventory currency category present')
    if any(x.get('effect') and any(k in x['effect'] for k in ('Tiền chính','Đổi vật phẩm tông môn','Đổi vật phẩm PvP')) for x in it): fail('stale currency metadata present')
    required={'it_heal_pill','it_qi_pill','it_ward_talisman','it_escape_talisman','it_iron','it_bamboo','it_spirit_dust','it_spider_silk','it_boar_hide','it_herb_cam_lo','it_herb_tinh_tam','it_herb_ich_khi','it_water','it_seed_cam_lo','it_seed_tinh_tam','it_seed_ich_khi','it_venom','it_mach_ban','it_water_sample','it_ledger','it_array_shard','it_well_key','it_iron_sword','it_cloth_armor'}
    if not required <= all_items: fail('missing canonical Economy v1 IDs')
    by={x['id']:x for x in it}
    exact={
      'it_boar_hide':(None,30,30,50,'market'),'it_herb_cam_lo':(None,10,12,18,'market'),'it_herb_tinh_tam':(None,10,12,18,'market'),'it_herb_ich_khi':(None,10,12,18,'market'),
      'it_bamboo':(None,10,12,20,'market'),'it_iron':(None,10,12,22,'market'),'it_spider_silk':(None,10,15,25,'market'),'it_spirit_dust':(None,10,20,35,'market'),
      'it_water':(10,None,8,9,'market'),'it_seed_cam_lo':(30,None,24,29,'market'),'it_seed_tinh_tam':(30,None,24,29,'market'),'it_seed_ich_khi':(30,None,24,29,'market'),
      'it_heal_pill':(80,20,60,70,'market'),'it_qi_pill':(None,20,70,90,'market'),'it_ward_talisman':(None,20,85,105,'market'),'it_escape_talisman':(None,20,85,105,'market'),
    }
    for iid,exp in exact.items():
        x=by[iid]; got=(intval(x['npcSell']),intval(x['npcBuy']),intval(x['marketMin']),intval(x['marketMax']),x['marketPolicy'])
        if got!=exp: fail(f'{iid} economy drift: {got} != {exp}')
    for iid in ('it_mach_ban','it_water_sample','it_ledger','it_array_shard','it_well_key'):
        x=by[iid]
        if (x['marketPolicy'],x['bindPolicy'],x['npcSell'],x['npcBuy'])!=('bound','character_bound','',''): fail(f'{iid} quest policy')
        if intval(x['stack'])!=1: fail(f'{iid} quest stack must be 1')
    if by['it_venom']['marketPolicy']!='disabled': fail('it_venom must remain disabled in current MVP')
    npc_buy_allow=set(exact)
    for x in it:
        for k in ('npcSell','npcBuy','marketMin','marketMax'): pos_or_none(intval(x[k]),x['id']+'.'+k)
        if intval(x['npcBuy']) is not None and x['id'] not in npc_buy_allow: fail('future content added NPC faucet: '+x['id'])
        if x['marketPolicy'] in ('bound','disabled','hold') and (x['marketMin'] or x['marketMax']): fail('non-market item has market target: '+x['id'])
        if x['group']=='Bí tịch/Công thức' and (x['bindPolicy']!='bind_on_use' or not boolval(x['destroyOnUse']) or x['npcBuy']): fail('skill book sink policy: '+x['id'])
    eq_by={x['itemId']:x for x in eq}
    sword=eq_by['it_iron_sword']
    if (intval(sword['marketMin']),intval(sword['marketMax']),sword['bindPolicy'])!=(190,220,'bind_on_equip'): fail('iron sword contract')
    armor=eq_by['it_cloth_armor']
    if armor['marketPolicy']!='bound' or armor['bindPolicy']!='character_bound': fail('starter armor contract')
    for x in eq:
        if x['marketPolicy']=='market' and x['bindPolicy']!='bind_on_equip': fail('market gear must bind on equip: '+x['id'])
        if x['marketPolicy']!='market' and (x['marketMin'] or x['marketMax']): fail('bound gear has market target: '+x['id'])
    for x in sk:
        scalar=floatval(x['pvpScalar'])
        if scalar is None or not (0 < scalar <= 1): fail('invalid PvP scalar: '+x['id'])
        hard_cc=bool(x.get('cc')) and any(k in x['cc'].lower() for k in ('stun','root','knock','hất','choáng'))
        if intval(x['damagePctAtk'])>=180 and hard_cc and floatval(x['cooldownSec'])<10: fail('burst+hardCC cooldown too short: '+x['id'])
        if x.get('unlockItemId') and x['unlockItemId'] not in item_ids: fail('skill unlock item missing: '+x['id'])
    for r in recipes:
        fee=intval(r['fee'])
        if fee is None or fee<=0: fail('recipe fee: '+r['id'])
        ing=json.loads(r['ingredients_json']); out=json.loads(r['output_json'])
        if not set(ing)<=all_items or not set(out)<=all_items: fail('recipe unknown item: '+r['id'])
        if any(type(v) is not int or v<=0 for v in list(ing.values())+list(out.values())): fail('recipe quantity: '+r['id'])
    rules=d['supplyRules']
    if rules['normalMobsDropCurrency'] or rules['pvpKillsDropCurrency'] or rules['futureItemsMayAddNpcBuyWithoutEconomyReview']: fail('currency faucet rule')
    print(f'OK: {len(eq)} equipment, {len(sk)} skills, {len(it)} items, {len(recipes)} recipes; Economy v1 contracts preserved.')

if __name__=='__main__': main()
