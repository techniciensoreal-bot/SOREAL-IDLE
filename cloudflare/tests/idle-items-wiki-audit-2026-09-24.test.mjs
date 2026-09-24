import assert from "node:assert/strict";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  idleAdventureItemBaseValueV1,
  IDLE_ADVENTURE_ITEM_CATALOG_V1,
  IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1,
  IDLE_ADVENTURE_SPECIALS,
  IDLE_ADVENTURE_ITEM_SETS_V1
} from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * Audit des objets du 2026-09-24 (script : 431 modèles "Template:Item data" du
 * miroir NGU-Wiki comparés au catalogue). Valeurs recopiées des modèles.
 */

// --- 1. "Base value" Power/Toughness : départ d'un objet neuf ---
{
  // Kokiri Blade : powervalbase 20 ; The Tuba of Time : 2/2 ; THE EXPONENTIAL : 2 800 000 (= plafond niveau 0) ;
  // The Titan Effigy : 13 000 000 000 ; Tutorial Cube : 0 ; My Red Heart : 69/69 (pBase de la définition).
  assert.deepEqual(idleAdventureItemBaseValueV1("forest:weapon"), { power: 20, toughness: 0 });
  assert.deepEqual(idleAdventureItemBaseValueV1("tubaTime"), { power: 2, toughness: 2 });
  assert.deepEqual(idleAdventureItemBaseValueV1("theExponential"), { power: 2800000, toughness: 2800000 });
  assert.deepEqual(idleAdventureItemBaseValueV1("titanEffigy"), { power: 13000000000, toughness: 13000000000 });
  assert.deepEqual(idleAdventureItemBaseValueV1("tutorialCube"), { power: 0, toughness: 0 });
  assert.deepEqual(idleAdventureItemBaseValueV1("heartRed"), { power: 69, toughness: 69 });
  // Cloth Hat : toughnessvalbase 1 ; A Beanie : 0/1 600.
  assert.deepEqual(idleAdventureItemBaseValueV1("training:head"), { power: 0, toughness: 1 });
  assert.deepEqual(idleAdventureItemBaseValueV1("aBeanie"), { power: 0, toughness: 1600 });

  const s = createIdleAdventureStateV47();
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "theExponential", level: 0 }, {}, 1);
  const expo = r.state.inventory.find((o) => o.definitionId === "theExponential");
  assert.equal(expo.power, 2800000, "un accessoire Evil tombe déjà à son plafond du niveau 0 (Base value = Max stat at lvl 0)");
  assert.equal(expo.toughness, 2800000);
  r = applyIdleAdventureActionV47(r.state, { action: "addItem", definitionId: "cave:weapon", level: 7 }, {}, 1);
  const mole = r.state.inventory.find((o) => o.definitionId === "cave:weapon");
  assert.equal(mole.power, 120, "Mole Hammer : Base value 120, jamais un tirage aléatoire");
  // "A Regular Tie" publie une Base value (82) au-dessus de son plafond du niveau 0 (81.5) : ramenée au plafond.
  r = applyIdleAdventureActionV47(r.state, { action: "addItem", definitionId: "jake:tie", level: 0 }, {}, 1);
  assert.equal(r.state.inventory.find((o) => o.definitionId === "jake:tie").toughness, 81.5);
}

// Objet déjà possédé, créé à 0 avant le correctif : remonte à sa Base value au chargement.
{
  const s = createIdleAdventureStateV47();
  const brut = JSON.parse(JSON.stringify(s));
  brut.inventory.push({ id: "vieux", definitionId: "forest:weapon", kind: "equipment", set: "forest", slot: "weapon", level: 3, power: 0, toughness: 0, special: 0 });
  brut.inventory.push({ id: "boosté", definitionId: "forest:weapon", kind: "equipment", set: "forest", slot: "weapon", level: 3, power: 50, toughness: 0, special: 0 });
  const n = normalizeIdleAdventureStateV47(brut);
  assert.equal(n.inventory.find((o) => o.id === "vieux").power, 20);
  assert.equal(n.inventory.find((o) => o.id === "boosté").power, 50, "une valeur déjà boostée n'est jamais réduite");
}

// Aucune Base value ne dépasse le plafond du niveau 0 hors du cas "A Regular Tie".
{
  for (const [id, d] of Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)) {
    const b = idleAdventureItemBaseValueV1(id);
    if (id === "jake:tie") continue;
    assert.ok(b.power <= d.basePower + 1e-6 && b.toughness <= d.baseToughness + 1e-6, `${id} : Base value > plafond niveau 0`);
  }
}

// --- 2. Ascensions (champs evolutionto des modèles, page Inventory : "ascends into a 0 lvl") ---
{
  const evo = IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1;
  const chaine = (depart) => { const out = [depart]; while (evo[out[out.length - 1]]) out.push(evo[out[out.length - 1]]); return out; };
  assert.deepEqual(chaine("forest:pendant"), ["forest:pendant", "ascendedForestPendant", "ascendedAscendedForestPendant", "ascendedX3Pendant", "ascendedX4Pendant", "ascendedX5Pendant", "ascendedX6Pendant", "ascendedX7Pendant", "ascendedX8Pendant", "ascendedX9Pendant"], "Forest Pendant : neuf ascensions");
  assert.deepEqual(chaine("lootyMcLootFace"), ["lootyMcLootFace", "sirLooty", "kingLooty", "emperorLooty", "galacticHeraldLooty", "supremeIntelligenceLooty", "grandDemonLootzifer", "glitchyLooty"], "Looty : sept ascensions");
  assert.equal(evo.wanderersCane, "candyCaneDestiny");
  assert.equal(IDLE_ADVENTURE_ITEM_CATALOG_V1.ascendedX7Pendant.evolutionTo, "ascendedX8Pendant");
  assert.equal(IDLE_ADVENTURE_ITEM_CATALOG_V1["forest:pendant"].evolutionTo, "ascendedForestPendant");
  // Nouveaux objets : Id et stats des modèles.
  const c = IDLE_ADVENTURE_ITEM_CATALOG_V1;
  assert.deepEqual([c.ascendedX8Pendant.wikiItemId, c.grandDemonLootzifer.wikiItemId, c.ascendedX9Pendant.wikiItemId, c.glitchyLooty.wikiItemId], [430, 431, 504, 505]);
  assert.deepEqual([c.ascendedX8Pendant.basePower, c.ascendedX9Pendant.basePower, c.grandDemonLootzifer.basePower, c.glitchyLooty.basePower], [1500000000, 3000000000, 1000000000, 3000000000]);
  assert.equal(IDLE_ADVENTURE_SPECIALS.glitchyLooty.sMax, 26660, "LootzL : Drop Chance 26 660 % au niveau 0");
  assert.equal(IDLE_ADVENTURE_SPECIALS.ascendedX9Pendant.sType, "hackSpeedPct");

  let s = createIdleAdventureStateV47();
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "ascendedX7Pendant", level: 99 }, {}, 1).state;
  const x7 = s.inventory.find((o) => o.definitionId === "ascendedX7Pendant");
  assert.throws(() => applyIdleAdventureActionV47(s, { action: "transformAdventureItem", id: x7.id }, {}, 1), /OBJET_NON_MAXE/);
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "ascendedX7Pendant", level: 100 }, {}, 1).state;
  const x7max = s.inventory.find((o) => o.definitionId === "ascendedX7Pendant" && o.level === 100);
  const r = applyIdleAdventureActionV47(s, { action: "transformAdventureItem", id: x7max.id }, {}, 1);
  assert.equal(r.result.definitionId, "ascendedX8Pendant");
  assert.equal(r.result.level, 0, "l'objet ascensionné arrive au niveau 0");
  assert.equal(r.result.power, 1500000000, "et à sa Base value");
  assert.ok(!r.state.inventory.some((o) => o.id === x7max.id), "l'objet d'origine est consommé");
  // Pièce de set : le Forest Pendant niveau 100 devient un Ascended Forest Pendant niveau 0.
  let t = createIdleAdventureStateV47();
  t = applyIdleAdventureActionV47(t, { action: "addItem", definitionId: "forest:pendant", level: 100 }, {}, 1).state;
  const fp = t.inventory.find((o) => o.definitionId === "forest:pendant");
  const r2 = applyIdleAdventureActionV47(t, { action: "transformAdventureItem", id: fp.id }, {}, 1);
  assert.equal(r2.result.definitionId, "ascendedForestPendant");
  assert.equal(r2.state.itemList["forest:pendant"].maxLevel, 100, "le Forest Pendant reste compté niveau 100 pour le set Forest");
  // Fin de lignée : THE END non modélisé -> aucune transformation.
  t = applyIdleAdventureActionV47(t, { action: "addItem", definitionId: "glitchyLooty", level: 100 }, {}, 1).state;
  const gl = t.inventory.find((o) => o.definitionId === "glitchyLooty");
  assert.throws(() => applyIdleAdventureActionV47(t, { action: "transformAdventureItem", id: gl.id }, {}, 1), /TRANSFORMATION_INVALIDE/);
}
// --- 3. Evil Bonus Accs (Set) : +20 % Adventure stats (page "Evil Bonus Accs (Set)") ---
{
  const set = IDLE_ADVENTURE_ITEM_SETS_V1.evilBonusAccs;
  assert.ok(set, "le set Evil Bonus Accs existe");
  assert.deepEqual(set.items.map((d) => IDLE_ADVENTURE_ITEM_CATALOG_V1[d].wikiItemId), [445, 446, 447, 448, 449, 450, 451, 452]);
  // "Total Power 378 792 000 / Total Toughness 378 792 000" = 2 x la somme des maxima du niveau 0.
  const somme = (k) => set.items.reduce((a, d) => a + IDLE_ADVENTURE_ITEM_CATALOG_V1[d][k], 0);
  assert.equal(somme("basePower") * 2, 378792000);
  assert.equal(somme("baseToughness") * 2, 378792000);
  assert.deepEqual(set.reward, { adventureStatsPct: 0.2 });
  // Complétion : les 8 accessoires au niveau 100.
  let s = createIdleAdventureStateV47();
  for (const d of set.items.slice(0, 7)) s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: d, level: 100 }, {}, 1).state;
  assert.ok(!s.completedSets.evilBonusAccs && !s.setRewards.adventureStatsPct, "7 sur 8 : pas de bonus");
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: set.items[7], level: 100 }, {}, 1).state;
  assert.ok(s.completedSets.evilBonusAccs, "8 sur 8 : set complété");
  assert.equal(s.setRewards.adventureStatsPct, 0.2);
  // Effet : facteur d'Adventure stats du moteur de progression.
  const avant = normalizeIdleNguState({}, { bosses: 100 }, 0);
  const apres = normalizeIdleNguState({}, { bosses: 100 }, 0);
  apres.adventure = { ...(apres.adventure || {}), setRewards: { adventureStatsPct: 0.2 } };
  const b0 = idleNguBonuses(avant), b1 = idleNguBonuses(apres);
  assert.ok(Math.abs(b1.adventurePowerMultiplier / b0.adventurePowerMultiplier - 1.2) < 1e-9, "x1,2 sur la Power d'aventure");
  assert.ok(Math.abs(b1.adventureToughnessMultiplier / b0.adventureToughnessMultiplier - 1.2) < 1e-9, "x1,2 sur la Toughness d'aventure");
}

console.log("idle-items-wiki-audit-2026-09-24: OK");
