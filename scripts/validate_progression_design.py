#!/usr/bin/env python3
"""Validate the design sample and generated MD tables. No runtime imports/writes."""
from __future__ import annotations
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import sys
from typing import Any

class DesignError(ValueError):
    pass

def require(condition: bool, message: str) -> None:
    if not condition:
        raise DesignError(message)

def integer(value: Any, label: str, minimum: int = 0) -> int:
    require(type(value) is int and value >= minimum, f"{label}: expected integer >= {minimum}")
    return value

def indexed(rows: list[dict], label: str) -> dict[str, dict]:
    require(isinstance(rows, list), f"{label}: expected list")
    result = {}
    for row in rows:
        require(isinstance(row, dict) and isinstance(row.get("id"), str), f"{label}: missing ID")
        key = row["id"]
        require(bool(re.fullmatch(r"[a-z][a-z0-9_]*", key)), f"{label}: invalid ID {key}")
        require(key not in result, f"{label}: duplicate ID {key}")
        result[key] = row
    return result

def quantities(values: dict, allowed: set[str], label: str) -> None:
    require(isinstance(values, dict), f"{label}: expected object")
    for key, value in values.items():
        require(key in allowed, f"{label}: unknown item/source {key}")
        integer(value, f"{label}.{key}", 1)

def no_duplicate_json_keys(pairs: list[tuple[str, Any]]) -> dict:
    result = {}
    for key, value in pairs:
        require(key not in result, f"Duplicate JSON key: {key}")
        result[key] = value
    return result

def load_design(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=no_duplicate_json_keys)

def award_xp(stage: int, current: int, offered: int, repeatable: bool, d: dict) -> int:
    """Pure design model, not the production reward service."""
    integer(stage, "stage")
    integer(current, "current")
    integer(offered, "offered")
    if stage >= d["stageCap"] or (stage == 0 and repeatable):
        return 0
    if not repeatable:
        return offered
    transitions = {x["from"]: x for x in d["transitions"]}
    require(stage in transitions, "Unknown progression stage")
    capacity = d["xpPolicy"]["repeatableReserveThresholds"] * transitions[stage]["xp"]
    return min(offered, max(0, capacity - current))

def render_blocks(d: dict) -> dict[str, str]:
    enemy = {x["id"]:x for x in d["enemies"]}
    def tab(headers, rows):
        return "\n".join(["| " + " | ".join(headers) + " |",
                         "| " + " | ".join("---" for _ in headers) + " |"] +
                        ["| " + " | ".join(map(str,row)) + " |" for row in rows])
    loot = lambda values: ", ".join(f"`{k}` ×{v}" for k,v in values.items())
    return {
        "thresholds":tab(["Chuyển tầng","Tu vi cần","Cờ bắt buộc","Khả năng mở"],
            [(f"{x['from']} → {x['to']}",x["xp"],f"`{x['flag']}`",
              f"`{x['skill']}`" if x["skill"] else "Kết thúc phạm vi MVP") for x in d["transitions"]]),
        "enemies":tab(["ID / tên","HP solo","XP / lần hợp lệ","Loot bảo đảm / người","Hồi sinh thử"],
            [(f"`{x['id']}` — {x['name']}",x["hp"],x["xp"],loot(x["loot"]),
              f"{x['respawnSeconds']} giây" if x["respawnSeconds"] is not None else "Lượt bí cảnh mới") for x in d["enemies"]]),
        "milestones":tab(["Mốc","Quest XP","XP ngoài quest","Dư trước","Tiêu đột phá","Dư sau"],
            [(x["id"],x["questXp"],x["extraXp"],x["carryBefore"],x["threshold"],x["carryAfter"]) for x in d["milestones"]]),
        "quests":tab(["ID","Nhiệm vụ","XP một lần","Linh thạch một lần"],
            [(f"`{x['id']}`",x["name"],x["xp"],x["coins"]) for x in d["mainQuests"]]),
        "recipes":tab(["Công thức","Nguyên liệu","Phí linh thạch","Thành phẩm"],
            [(f"`{x['id']}`",loot(x["ingredients"]),x["fee"],loot(x["output"])) for x in d["recipes"]]),
        "crops":tab(["Cây","Thời gian thường","Sản lượng","Sản phẩm"],
            [(f"`{x['id']}`",f"{x['seconds']//60} phút",x["quantity"],f"`{x['output']}`") for x in d["crops"]]),
        "shop":tab(["Vật phẩm","NPC bán cho người chơi","NPC mua từ người chơi"],
            [(f"`{k}`",d["shop"]["npcSells"].get(k,"Không bán"),d["shop"]["npcBuys"].get(k,"Không mua"))
             for k in sorted(set(d["shop"]["npcSells"])|set(d["shop"]["npcBuys"]))]),
        "sources":tab(["Nguồn","XP mẫu","Ghi nhận"],
            [(f"`{x['id']}`",x["xp"],"Một lần / nhân vật") for x in d["discoveries"]]+
            [(f"`{x['id']}`",x["xp"],"Một lần / nhiệm vụ") for x in d["sideQuests"]]),
        "route-details":tab(["Chặng","Encounter tham chiếu","Khám phá một lần","XP ngoài quest"],
            [(x["id"],", ".join(f"{enemy[k]['name']} ×{v}" for k,v in x["kills"].items()),
              ", ".join(f"`{k}`" for k in x["discoveries"]),x["extraXp"]) for x in d["milestones"]]),
    }

def validate_data(d: dict) -> dict:
    require(d["designSchemaVersion"] == 1, "Unsupported design schema")
    require(d["status"] == "design_only_unimplemented", "Do not label design as implemented")
    require(d["runtimeCatalogImportAllowed"] is False, "Design must not auto-load into runtime")
    require(bool(re.fullmatch(r"[a-f0-9]{40}", d["sourceRef"])), "Source ref must be pinned SHA")
    require(d["stageCap"] == 4, "This MVP has stage cap 4")

    items = set(d["items"])
    require(len(items) == len(d["items"]) == 24, "Exactly 24 unique item IDs required")
    for key in items:
        require(bool(re.fullmatch(r"it_[a-z0-9_]+", key)), f"Invalid item ID: {key}")
    maps = set(d["maps"])
    require(len(maps) == len(d["maps"]) == 4, "Four unique maps required")
    inactive = set(d["inactiveLootItems"])
    require(inactive <= items, "Inactive item not in catalog")

    main = indexed(d["mainQuests"], "mainQuests")
    side = indexed(d["sideQuests"], "sideQuests")
    require(len(main) == 12 and len(side) == 6, "Quest scope must remain 12 + 6")
    require(not (set(main) & set(side)), "Quest IDs overlap")
    quests = main | side
    for key, q in quests.items():
        integer(q["xp"], f"{key}.xp")
        if key in main:
            integer(q["coins"], f"{key}.coins")
            require(q["repeatable"] is False, f"{key}: main quest must be one-time")
        for dependency in q["requires"]:
            require(dependency in quests, f"{key}: unknown quest dependency {dependency}")
    active, done = set(), set()
    def visit(key):
        require(key not in active, f"Quest dependency cycle at {key}")
        if key in done:
            return
        active.add(key)
        for dependency in quests[key]["requires"]:
            visit(dependency)
        active.remove(key)
        done.add(key)
    for key in quests:
        visit(key)
    require(main["q_main_001"]["xp"] == main["q_main_002"]["xp"] == 0,
            "Opening quests do not award XP")

    discoveries = indexed(d["discoveries"], "discoveries")
    for key, p in discoveries.items():
        integer(p["xp"], f"{key}.xp", 1)
        require(p["map"] in maps, f"{key}: unknown map")
        for dependency in p["requires"]:
            require(dependency in quests, f"{key}: unknown discovery prerequisite")

    transitions = d["transitions"]
    require([(t["from"],t["to"]) for t in transitions] == [(1,2),(2,3),(3,4)],
            "Transitions must be 1->2->3->4")
    for t in transitions:
        integer(t["xp"], "transition.xp", 1)
    require([t["flag"] for t in transitions] ==
            ["insight.breath_control","insight.first_craft","story.ch1.complete"],
            "Progression flags differ from approved quest gates")

    enemies = indexed(d["enemies"], "enemies")
    require(set(enemies) == {"en_boar","en_spider","en_scout","en_guard","en_boss"},
            "Five existing enemy IDs required")
    for key, e in enemies.items():
        integer(e["hp"], key + ".hp", 1)
        for field in ("attack","xp","windupMs","recoveryMs"):
            integer(e[field], key + "." + field, 1)
        integer(e["defense"], key + ".defense")
        quantities(e["loot"], items, key + ".loot")
        require(not (set(e["loot"]) & inactive), f"{key}: inactive item is in loot")
        if key == "en_boss":
            require(e["respawnSeconds"] is None, "Boss requires a new valid dungeon run")
        else:
            integer(e["respawnSeconds"], key + ".respawnSeconds", 1)

    recipes = indexed(d["recipes"], "recipes")
    require(len(recipes) == 5, "Five recipes required")
    for key, recipe in recipes.items():
        quantities(recipe["ingredients"], items, key + ".ingredients")
        quantities(recipe["output"], items, key + ".output")
        require(recipe["ingredients"] and recipe["output"], f"{key}: empty recipe")
        integer(recipe["fee"], key + ".fee")
    crops = indexed(d["crops"], "crops")
    require(len(crops) == 3, "Three crops required")
    for key, crop in crops.items():
        require(crop["seed"] in items and crop["output"] in items, f"{key}: invalid crop item")
        integer(crop["seconds"], key + ".seconds", 1)
        integer(crop["quantity"], key + ".quantity", 1)
    shop = d["shop"]
    for field in ("npcSells","npcBuys"):
        quantities(shop[field], items, field)
    for key, price in shop["researchFees"].items():
        require(key in recipes, f"Unknown research recipe {key}")
        integer(price, "researchFee", 1)
    for key in set(shop["npcBuys"]) & set(shop["npcSells"]):
        require(shop["npcBuys"][key] <= shop["npcSells"][key], f"Buy/sell arbitrage: {key}")

    quantities(d["starter"]["items"], items, "starter")
    integer(d["starter"]["coins"], "starter.coins")
    require(d["starter"] == {"coins":12, "items":{"it_seed_cam_lo":2,"it_water":4,
            "it_heal_pill":2,"it_cloth_armor":1}}, "Do not silently change starter:v1")

    available = set(shop["npcSells"]) | set(d["starter"]["items"])
    for map_id, gatherable in d["gatherableItems"].items():
        require(map_id in maps and set(gatherable) <= items, "Invalid gathering reference")
        available.update(gatherable)
    for enemy in enemies.values():
        available.update(enemy["loot"])
    for qid, rewards in d["questGrantedItems"].items():
        require(qid in main, "Quest item source not a main quest")
        quantities(rewards, items, "questGrantedItems")
        available.update(rewards)
    for crop in crops.values():
        require(crop["seed"] in available and "it_water" in available, "Crop input unreachable")
        available.add(crop["output"])

    pending = dict(recipes)
    while pending:
        craftable = [key for key,r in pending.items() if set(r["ingredients"]) <= available]
        require(bool(craftable), f"Unreachable recipe inputs: {list(pending)}")
        for key in craftable:
            available.update(pending.pop(key)["output"])
    require((items - inactive) <= available, "An active item has no defined source")

    # Conservative production costs for purchasable inputs and crops.
    # Gathered materials have play-time costs not evaluated by this arithmetic.
    costs = dict(shop["npcSells"])
    for crop in crops.values():
        if crop["seed"] in costs:
            grown_cost = (costs[crop["seed"]] + costs["it_water"]) / crop["quantity"]
            costs[crop["output"]] = min(costs.get(crop["output"], float("inf")), grown_cost)
            if crop["output"] in shop["npcBuys"]:
                require(shop["npcBuys"][crop["output"]] <= grown_cost,
                        "Seed/water/grow/sell money loop")
    for r in recipes.values():
        if all(key in costs for key in r["ingredients"]):
            cost = r["fee"] + sum(costs[key] * count for key,count in r["ingredients"].items())
            revenue = sum(shop["npcBuys"].get(key,0) * count for key,count in r["output"].items())
            require(revenue <= cost, f"Purchasable craft/sell money loop: {r['id']}")

    milestones = indexed(d["milestones"], "milestones")
    require(len(milestones) == 3, "Three sample milestones required")
    carry, seen_q, seen_p = 0, set(), set()
    for m,t in zip(d["milestones"],transitions):
        require((m["from"],m["to"],m["threshold"]) == (t["from"],t["to"],t["xp"]),
                "Milestone transition mismatch")
        for field in ("questXp","extraXp","carryBefore","carryAfter","threshold"):
            integer(m[field], m["id"] + "." + field)
        require(m["carryBefore"] == carry, "Carry before mismatch")
        for qid in m["quests"]:
            require(qid in main and qid not in seen_q, "Unknown/duplicate sample quest")
            seen_q.add(qid)
        for pid in m["discoveries"]:
            require(pid in discoveries and pid not in seen_p, "Unknown/duplicate sample discovery")
            seen_p.add(pid)
        quantities(m["kills"], set(enemies), "sample kills")
        qxp = sum(main[k]["xp"] for k in m["quests"])
        extra = sum(enemies[k]["xp"] * n for k,n in m["kills"].items()) + \
                sum(discoveries[k]["xp"] for k in m["discoveries"])
        require(qxp == m["questXp"] and extra == m["extraXp"], "Sample XP arithmetic mismatch")
        carry += qxp + extra - t["xp"]
        require(carry >= 0 and carry == m["carryAfter"], "Carry after mismatch")
    require(seen_q == {key for key,q in main.items() if q["xp"] > 0}, "Sample omits XP quest")
    totals = d["totals"]
    require(sum(q["xp"] for q in main.values()) == totals["mainQuestXp"], "Main XP total mismatch")
    require(sum(m["extraXp"] for m in milestones.values()) == totals["sampleExtraXp"],
            "Extra XP total mismatch")
    require(sum(t["xp"] for t in transitions) == totals["requiredXp"], "Threshold total mismatch")
    require(totals["mainQuestXp"] + totals["sampleExtraXp"] == totals["requiredXp"],
            "Total sample XP does not cover required XP")

    alt = d["alternativeEarlyRoute"]
    require(len(alt["sideQuests"]) == len(set(alt["sideQuests"])) and
            len(alt["discoveries"]) == len(set(alt["discoveries"])), "Alternative repeats one-time source")
    require(set(alt["sideQuests"]) <= set(side) and set(alt["discoveries"]) <= set(discoveries),
            "Unknown alternative route source")
    alternative_xp = sum(side[k]["xp"] for k in alt["sideQuests"]) + \
                     sum(discoveries[k]["xp"] for k in alt["discoveries"])
    require(alternative_xp == alt["expectedXp"] == d["milestones"][0]["extraXp"],
            "Safe route cannot cover early XP gap")
    require(alt["sideQuests"] == ["q_side_001"], "Safe sample must not depend on a timed second crop")
    for pid in alt["discoveries"]:
        require(discoveries[pid]["map"] == "m_truc_am", "Safe route discovery outside early map")
        require(set(discoveries[pid]["requires"]) <= {f"q_main_{i:03}" for i in range(1,6)},
                "Safe route locked behind late quest")

    b = d["returnBudget"]
    inventory = Counter()
    quantities(b["kills"], set(enemies), "budget kills")
    for key,count in b["kills"].items():
        for item,amount in enemies[key]["loot"].items():
            inventory[item] += count * amount
    quantities(b["gathered"], items, "budget gathered")
    inventory.update(b["gathered"])
    for field in ("sell","buy","consumeDuringRoute"):
        quantities(b[field], items, "budget." + field)
    integer(b["initialCoins"], "budget.initialCoins")
    wallet = b["initialCoins"]
    gross, spend = 0, 0
    for item,count in b["sell"].items():
        require(item in shop["npcBuys"] and inventory[item] >= count, "Cannot sell budget inventory")
        inventory[item] -= count
        gross += shop["npcBuys"][item] * count
    wallet += gross
    for item,count in b["buy"].items():
        require(item in shop["npcSells"], "Budget buys item not sold")
        cost = shop["npcSells"][item] * count
        wallet -= cost
        spend += cost
        require(wallet >= 0, "Budget cannot pay purchase")
        inventory[item] += count
    quantities(b["craft"], set(recipes), "budget.craft")
    for key,count in b["craft"].items():
        recipe = recipes[key]
        for item,amount in recipe["ingredients"].items():
            need = amount * count
            require(inventory[item] >= need, "Budget cannot pay ingredients")
            inventory[item] -= need
        fee = recipe["fee"] * count
        wallet -= fee
        spend += fee
        require(wallet >= 0, "Budget cannot pay craft fee")
        for item,amount in recipe["output"].items():
            inventory[item] += amount * count
    require(not b["consumeDuringRoute"], "Gross fixture excludes use; use sensitivity cases separately")
    inventory = {key:val for key,val in sorted(inventory.items()) if val}
    require(inventory == b["expectedInventory"], "Budget final inventory mismatch")
    require((gross,spend,wallet-b["initialCoins"]) ==
            (b["expectedGrossCoins"],b["expectedSpendCoins"],b["expectedNetCoins"]),
            "Budget money mismatch")

    policy = d["xpPolicy"]
    for key in ("trainingXp","pvpXp","mortalRepeatableXp","stage4Xp"):
        require(policy[key] == 0, f"Unexpected XP source: {key}")
    require(policy["repeatableReserveThresholds"] == 2, "Reserve policy mismatch")
    require(policy["oneTimeRewardsBypassRepeatableReserve"] is True, "Do not truncate one-time XP")
    require(policy["stage4BonusXpConversion"] is False, "No unspecified cap XP conversion")
    return {
        "status":"passed",
        "scope":"design arithmetic/references only; not runtime or playtest",
        "sourceRef":d["sourceRef"],
        "itemCount":len(items),"mainQuestCount":len(main),"sideQuestCount":len(side),
        "enemyCount":len(enemies),"recipeCount":len(recipes),
        "mainQuestXp":totals["mainQuestXp"],"sampleExtraXp":totals["sampleExtraXp"],
        "requiredXp":totals["requiredXp"],"sampleCarries":[m["carryAfter"] for m in d["milestones"]],
        "alternativeEarlyXp":alternative_xp,
        "sampleGrossCoins":gross,"sampleSpendCoins":spend,"sampleNetCoins":wallet-b["initialCoins"],
        "sampleInventory":inventory,
        "consumptionSensitivity":[
            {"pillsUsed":used,"pillsCreated":2,"pillNet":2-used,
             "netCoinsAfterReplacingDeficit":6-max(0,used-2)*shop["npcSells"]["it_heal_pill"]}
            for used in range(4)
        ]
    }

BLOCK_RE = re.compile(
    r"<!-- generated:([a-z-]+) -->\n(.*?)\n<!-- /generated:\1 -->", re.DOTALL)

def sync_tables(root: Path, d: dict, write: bool = False) -> int:
    expected = render_blocks(d)
    seen = set()
    count = 0
    for path in sorted((root / "docs/game-design").glob("*.md")):
        text = path.read_text(encoding="utf-8")
        matches = list(BLOCK_RE.finditer(text))
        require(text.count("<!-- generated:") == len(matches), f"Broken table marker in {path.name}")
        for match in matches:
            key = match.group(1)
            require(key in expected, f"Unknown generated table {key}")
            if not write:
                require(match.group(2) == expected[key], f"Stale table {key} in {path.name}")
            seen.add(key)
            count += 1
        if write and matches:
            text = BLOCK_RE.sub(lambda m: f"<!-- generated:{m[1]} -->\n{expected[m[1]]}\n"
                               f"<!-- /generated:{m[1]} -->", text)
            path.write_text(text, encoding="utf-8")
    require(seen == set(expected), f"Missing generated tables: {set(expected)-seen}")
    return count

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--write-tables", action="store_true", help="Update generated MD blocks only")
    parser.add_argument("--json-report", type=Path)
    args = parser.parse_args()
    try:
        data = load_design(args.root / "design-samples/progression-pve.v1.json")
        report = validate_data(data)
        report["generatedTablesChecked"] = sync_tables(args.root, data, args.write_tables)
        report["generatedTablesChecked"] = sync_tables(args.root, data)
        output = json.dumps(report, ensure_ascii=False, indent=2)
        if args.json_report:
            args.json_report.parent.mkdir(parents=True, exist_ok=True)
            args.json_report.write_text(output + "\n", encoding="utf-8")
        print(output)
        return 0
    except (DesignError, KeyError, TypeError, OSError, json.JSONDecodeError) as exc:
        print(f"DESIGN VALIDATION FAILED: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
