#!/usr/bin/env python3
"""Self-tests for the design validator; do not exercise game runtime."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from validate_progression_design import (
    DesignError, award_xp, load_design, render_blocks, sync_tables, validate_data
)

ROOT = Path(__file__).resolve().parents[1]

class DesignTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = load_design(ROOT / "design-samples/progression-pve.v1.json")

    def changed(self):
        return copy.deepcopy(self.base)

    def bad(self, d):
        with self.assertRaises((DesignError, KeyError, TypeError)):
            validate_data(d)

    def test_valid_design(self):
        report = validate_data(self.base)
        self.assertEqual(report["sampleCarries"], [0,150,0])
        self.assertEqual(report["requiredXp"], 1900)

    def test_duplicate_item(self):
        d=self.changed(); d["items"].append(d["items"][0]); self.bad(d)

    def test_duplicate_quest(self):
        d=self.changed(); d["mainQuests"][1]["id"]=d["mainQuests"][0]["id"]; self.bad(d)

    def test_negative_xp(self):
        d=self.changed(); d["enemies"][0]["xp"]=-1; self.bad(d)

    def test_boolean_not_integer(self):
        d=self.changed(); d["enemies"][0]["xp"]=True; self.bad(d)

    def test_zero_quantity(self):
        d=self.changed(); d["enemies"][0]["loot"]["it_boar_hide"]=0; self.bad(d)

    def test_unknown_loot(self):
        d=self.changed(); d["enemies"][0]["loot"]={"it_fake":1}; self.bad(d)

    def test_dormant_venom_not_dropped(self):
        d=self.changed(); d["enemies"][1]["loot"]["it_venom"]=1; self.bad(d)

    def test_quest_cycle(self):
        d=self.changed(); d["mainQuests"][0]["requires"]=["q_main_012"]; self.bad(d)

    def test_unknown_quest_dependency(self):
        d=self.changed(); d["mainQuests"][2]["requires"]=["q_fake"]; self.bad(d)

    def test_quest_xp_total(self):
        d=self.changed(); d["mainQuests"][2]["xp"]+=1; self.bad(d)

    def test_carry_chain(self):
        d=self.changed(); d["milestones"][2]["carryBefore"]=0; self.bad(d)

    def test_duplicate_discovery(self):
        d=self.changed(); d["milestones"][1]["discoveries"]=["poi_truc_am_route"]; self.bad(d)

    def test_safe_route_gap(self):
        d=self.changed(); d["sideQuests"][0]["xp"]=40; self.bad(d)

    def test_safe_route_late_lock(self):
        d=self.changed()
        for p in d["discoveries"]:
            if p["id"]=="poi_safe_bank": p["requires"]=["q_main_012"]
        self.bad(d)

    def test_recipe_unknown_item(self):
        d=self.changed(); d["recipes"][0]["ingredients"]["it_missing"]=1; self.bad(d)

    def test_starter_unchanged(self):
        d=self.changed(); d["starter"]["coins"]=100; self.bad(d)

    def test_shop_arbitrage(self):
        d=self.changed(); d["shop"]["npcBuys"]["it_heal_pill"]=100; self.bad(d)

    def test_grow_sell_loop(self):
        d=self.changed(); d["shop"]["npcBuys"]["it_herb_cam_lo"]=2; self.bad(d)

    def test_wallet_solvency(self):
        d=self.changed(); d["returnBudget"]["initialCoins"]=-1; self.bad(d)

    def test_budget_oversell(self):
        d=self.changed(); d["returnBudget"]["sell"]["it_boar_hide"]=5; self.bad(d)

    def test_budget_final_inventory(self):
        d=self.changed(); d["returnBudget"]["expectedInventory"]["it_heal_pill"]=3; self.bad(d)

    def test_boss_respawn_policy(self):
        d=self.changed(); d["enemies"][-1]["respawnSeconds"]=1; self.bad(d)

    def test_runtime_import_disallowed(self):
        d=self.changed(); d["runtimeCatalogImportAllowed"]=True; self.bad(d)

    def test_repeatable_cap_partial(self):
        self.assertEqual(award_xp(1,590,15,True,self.base),10)
        self.assertEqual(award_xp(1,600,15,True,self.base),0)

    def test_one_time_overflow_retained(self):
        self.assertEqual(award_xp(1,600,100,False,self.base),100)

    def test_mortal_and_max_stage(self):
        self.assertEqual(award_xp(0,0,10,True,self.base),0)
        self.assertEqual(award_xp(4,0,100,False,self.base),0)
        self.assertEqual(award_xp(4,100,10,True,self.base),0)

    def test_three_pill_consumption_deficit_visible(self):
        report=validate_data(self.base)
        self.assertEqual(report["consumptionSensitivity"][-1]["pillNet"],-1)
        self.assertEqual(report["consumptionSensitivity"][-1]["netCoinsAfterReplacingDeficit"],-2)

    def test_duplicate_json_keys_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            p=Path(directory)/"x.json"; p.write_text('{"a":1,"a":2}',encoding="utf-8")
            with self.assertRaises(DesignError): load_design(p)

    def test_real_generated_tables(self):
        self.assertGreater(sync_tables(ROOT,self.base),0)

    def test_stale_table_detected_and_repaired(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); folder=root/"docs/game-design"; folder.mkdir(parents=True)
            p=folder/"test.md"
            text="\n\n".join(f"<!-- generated:{key} -->\n{value}\n<!-- /generated:{key} -->"
                              for key,value in render_blocks(self.base).items())
            p.write_text(text.replace("300","301",1),encoding="utf-8")
            with self.assertRaises(DesignError): sync_tables(root,self.base)
            sync_tables(root,self.base,write=True)
            self.assertEqual(sync_tables(root,self.base),len(render_blocks(self.base)))

    def test_unknown_generated_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); folder=root/"docs/game-design"; folder.mkdir(parents=True)
            (folder/"test.md").write_text(
                "<!-- generated:unknown -->\nx\n<!-- /generated:unknown -->",encoding="utf-8")
            with self.assertRaises(DesignError): sync_tables(root,self.base)

if __name__ == "__main__":
    unittest.main(verbosity=2)
