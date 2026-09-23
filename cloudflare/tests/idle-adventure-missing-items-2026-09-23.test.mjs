import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_SETS,
  IDLE_ADVENTURE_SPECIALS,
  IDLE_ADVENTURE_WIKI_ITEM_IDS_V1,
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2,
  IDLE_ADVENTURE_ZONES,
  idleAdventureItemStatsMaxV1,
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";
import { SET_ITEM_SPECIALS_V1 } from "../src/idle-adventure-set-specials-v1.js";

/*
 * Audit 2026-09-23 : objets du wiki NGU absents du moteur (fiches "item-full"
 * du miroir local NGU-Wiki, recoupées avec les gabarits "Item data <objet>") et
 * lignes manquantes des sections Loot des zones et des titans. Chaque valeur
 * ci-dessous a été relue sur la fiche/page wiki citée.
 */

// ---------- IDs wiki (champ "Id" de chaque fiche) ----------
for (const [defId, id] of Object.entries({
  lootyMcLootFace: 67, ascendedForestPendant: 76, ascendedAscendedForestPendant: 94, dragonWings: 110,
  stapler: 118, aBeanie: 127, sirLooty: 128, ascendedX3Pendant: 142, uugSpecialRing: 149,
  candyCaneDestiny: 159, fannyPack: 160, dorkyGlasses: 161, kingLooty: 169, ascendedX4Pendant: 170,
  stealthiestArmour: 178, powerPill: 194, energyBarBarAccessory: 226, emperorLooty: 230,
  ascendedX6Pendant: 295, galacticHeraldLooty: 296, beretta9mm: 366, supremeIntelligenceLooty: 389,
  brokenScissors: 427, edgyMagicite: 445, radMixtape: 452, titanEffigy: 479,
  "greasynerd:weapon": 241, "mobster:garrote": 270, "exile:head": 322, "space:redShirt": 379,
  "rock:weapon": 423, "rock:rocket": 420, "amalgamate:weapon": 476, "amalgamate:deathstick": 473
})) assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[defId], id, `${defId} : Id wiki ${id}`);

// ---------- Accessoires / objets (p/t = "Max stat at lvl 0", Specials = Base / lvl 0 / max lvl) ----------
const S = IDLE_ADVENTURE_SPECIALS;
{
  // "Looty McLootFace" : Power 2/2/4, Toughness 2/2/4, Drop Chance 5% / 10% / 20%
  assert.deepEqual([S.lootyMcLootFace.p, S.lootyMcLootFace.t, S.lootyMcLootFace.sType, S.lootyMcLootFace.sBase, S.lootyMcLootFace.sMax], [2, 2, "dropChancePct", 5, 10]);
  assert.equal(S.lootyMcLootFace.slot, "accessory");
  // "Stapler" : Power 0/500/1000, pas de Toughness ; Energy Cap 22.33/30/60, Respawn 3/6/12
  assert.deepEqual([S.stapler.p, S.stapler.t, S.stapler.sType, S.stapler.sBase, S.stapler.sMax], [500, 0, "energyCapPct", 22.33, 30]);
  assert.deepEqual(S.stapler.sExtra, [{ type: "respawnReductionPct", base: 3, max0: 6, max100: 12 }]);
  // "A Beanie" : Type Head ; Power 0/2000/4000, Toughness 1600/3000/6000 ; Magic Cap 20/53/106, Magic Power 70/184.9/369.8
  assert.equal(S.aBeanie.slot, "head");
  assert.deepEqual([S.aBeanie.p, S.aBeanie.t, S.aBeanie.sBase, S.aBeanie.sMax], [2000, 3000, 20, 53]);
  assert.deepEqual(S.aBeanie.sExtra, [{ type: "magicPowerPct", base: 70, max0: 184.9, max100: 369.8 }]);
  // "The Candy Cane of Destiny" : Type Weapon ; Power 170000, Toughness 12000 ; 6 Specials
  assert.equal(S.candyCaneDestiny.slot, "weapon");
  assert.deepEqual([S.candyCaneDestiny.p, S.candyCaneDestiny.t, S.candyCaneDestiny.sType, S.candyCaneDestiny.sBase], [170000, 12000, "energyBarsPct", 1000]);
  assert.equal(S.candyCaneDestiny.sExtra.length, 5);
  // "Ascended x4 Pendant" : Power 10000/100000/200000 ; Drop Chance 250, Quest Drops 5/5/10 en dernier
  assert.deepEqual([S.ascendedX4Pendant.p, S.ascendedX4Pendant.t, S.ascendedX4Pendant.sBase, S.ascendedX4Pendant.sMax], [100000, 100000, 250, 250]);
  assert.deepEqual(S.ascendedX4Pendant.sExtra.at(-1), { type: "questDropsPct", base: 5, max0: 5, max100: 10 });
  // "The Stealthiest Armour" : Type Chest ; Power 8000, Toughness 150000 ; Energy Bars 2000
  assert.deepEqual([S.stealthiestArmour.slot, S.stealthiestArmour.p, S.stealthiestArmour.t, S.stealthiestArmour.sBase], ["chest", 8000, 150000, 2000]);
  // "Right Fairy Wing" : aucune section Stats ; Energy Bars 90000/90000/180000 en premier
  assert.deepEqual([S.rightFairyWing.p, S.rightFairyWing.t, S.rightFairyWing.sType, S.rightFairyWing.sMax], [0, 0, "energyBarsPct", 90000]);
  // "A Broken Pair Of Scissors" (gabarit Item data, page écrasée dans le miroir) : Power/Toughness 2.7e9 ; NGU Speed 4000
  assert.deepEqual([S.brokenScissors.p, S.brokenScissors.t, S.brokenScissors.sType, S.brokenScissors.sBase], [2700000000, 2700000000, "energyPowerPct", 1320000]);
  assert.deepEqual(S.brokenScissors.sExtra.map((e) => [e.type, e.max100]), [["magicPowerPct", 2640000], ["nguSpeedPct", 8000], ["r3CapPct", 264]]);
  // "Edgy Magicite Crystal" : Power/Toughness 666000 ; Energy Power 6000, Magic Cap 600, NGU Speed 250
  assert.deepEqual([S.edgyMagicite.zone, S.edgyMagicite.p, S.edgyMagicite.sType, S.edgyMagicite.sBase], ["evilverse", 666000, "energyPowerPct", 6000]);
  // "SUPREME INTELLIGENCE LOOTY" : Power 5e8, Drop Chance 3000/3000/6000
  assert.deepEqual([S.supremeIntelligenceLooty.p, S.supremeIntelligenceLooty.sType, S.supremeIntelligenceLooty.sMax], [500000000, "dropChancePct", 3000]);
}

// ---------- Sets des titans Evil/Sadistic ----------
{
  const attendus = {
    greasynerd: { p: 22580000, t: 10440000, n: 5 },   // "Greasy Nerd (set)" Total Stats Max
    mobster: { p: 218200000, t: 103000000, n: 7 },
    exile: { p: 1257800000, t: 518000000, n: 5 },
    space: { p: 4952400000, t: 2240000002, n: 7 },
    rock: { p: 45340800000, t: 13328000000, n: 8 },
    amalgamate: { p: 229820000000, t: 55600000000, n: 8 }
  };
  for (const [id, a] of Object.entries(attendus)) {
    const set = IDLE_ADVENTURE_SETS[id];
    assert.ok(set, id);
    assert.equal(set.slots.length, a.n, `${id} : ${a.n} pièces`);
    assert.equal(set.p, a.p, `${id} : Total Power`);
    assert.equal(set.t, a.t, `${id} : Total Toughness`);
    const somme = set.slots.reduce((acc, slot) => { const x = idleAdventureItemStatsMaxV1(id, slot); return [acc[0] + x.p, acc[1] + x.t]; }, [0, 0]);
    assert.deepEqual(somme, [a.p, a.t], `${id} : somme des pièces = total de la page du set`);
    assert.deepEqual(set.reward, {}, `${id} : bonus de complétion non exprimable, jamais approximé`);
    for (const slot of set.slots) assert.ok(SET_ITEM_SPECIALS_V1[`${id}:${slot}`]?.length, `${id}:${slot} : Specials`);
  }
  // "Superior Japanese Katana" : Power 22 000 000 / Toughness 1 200 000 au max lvl
  assert.deepEqual(idleAdventureItemStatsMaxV1("greasynerd", "weapon"), { p: 22000000, t: 1200000 });
  // "A Red Shirt" : Toughness 1/1/2
  assert.deepEqual(idleAdventureItemStatsMaxV1("space", "redShirt"), { p: 600000000, t: 2 });
  // Rock : "weapon" = Giant Drumsticks (plus grosse Power), "rocket" = A Rocket
  assert.deepEqual(idleAdventureItemStatsMaxV1("rock", "weapon"), { p: 21020000000, t: 600000000 });
  assert.deepEqual(idleAdventureItemStatsMaxV1("rock", "rocket"), { p: 20300000000, t: 400000000 });
  // "Tommy Gun" : Energy Bars 14000/14000/28000 en premier
  assert.deepEqual(SET_ITEM_SPECIALS_V1["mobster:weapon"][0], ["energyBarsPct", 14000, 14000, 28000]);
  // "A Shoe." : Resource 3 Cap 154/154/308, Resource 3 Bars 1590, Resource 3 Power 1570
  assert.deepEqual(SET_ITEM_SPECIALS_V1["amalgamate:boots"], [["r3CapPct", 154, 154, 308], ["r3BarsPct", 1590, 1590, 3180], ["r3PowerPct", 1570, 1570, 3140]]);

  // complétion réelle : 5 pièces Greasy Nerd niveau 100 -> set complété, aucun bonus
  let st = normalizeIdleAdventureStateV47({});
  const avant = JSON.stringify(st.setRewards);
  for (const slot of IDLE_ADVENTURE_SETS.greasynerd.slots) {
    st = applyIdleAdventureActionV47(st, { action: "addItem", definitionId: "greasynerd:" + slot, level: 100 }, { bosses: 300 }, 1).state;
  }
  assert.equal(st.completedSets.greasynerd, true);
  assert.equal(JSON.stringify(st.setRewards), avant);
}

// ---------- Lignes de butin des zones (section Loot, "x% base chance, up to y% max") ----------
const P = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2;
const ligne = (zone, pool, id) => (P[zone][pool].specials || []).find((d) => d.id === id || (d.ids || []).includes(id));
assert.deepEqual(ligne("sky", "boss", "lootyMcLootFace"), { id: "lootyMcLootFace", chance: 0.01, level: 0 });
assert.deepEqual(ligne("ancient", "boss", "dragonWings"), { id: "dragonWings", chance: 0.0015, level: 4, mobName: "Mysterious Figure" });
assert.deepEqual(ligne("mega", "boss", "ascendedForestPendant"), { id: "ascendedForestPendant", chance: 0.01, level: 0 });
assert.deepEqual(ligne("badly", "boss", "sirLooty"), { id: "sirLooty", chance: 0.00001, cap: 0.01, level: 5 });
assert.deepEqual(ligne("boring", "boss", "stealthiestArmour"), { id: "stealthiestArmour", chance: 0.000001, cap: 0.005, level: 5, requiresCompletedSet: "stealth" });
assert.deepEqual(ligne("chocolate", "boss", "magicBarBarAccessory"), { ids: ["energyBarBarAccessory", "magicBarBarAccessory"], chance: 0.00018, cap: 0.12, level: 1, requiresCompletedSet: "choco" });
assert.deepEqual(ligne("pinkprincess", "normal", "creepyDoll"), { id: "creepyDoll", chance: 0.000012, cap: 0.013, level: 1 });
assert.deepEqual(ligne("fadlands", "boss", "ascendedX3Pendant"), { id: "ascendedX3Pendant", chance: 0.000021, cap: 0.08, level: 10 });
assert.deepEqual(ligne("jrpgville", "boss", "sirLooty"), { id: "sirLooty", chance: 0.0000055, cap: 0.12, level: 68 });
assert.deepEqual(ligne("radlands", "boss", "kingLooty"), { id: "kingLooty", chance: 4e-7, cap: 0.12, level: 1 });
assert.deepEqual(ligne("westworld", "normal", "beretta9mm"), { id: "beretta9mm", chance: 2e-8, cap: 0.12, level: 1, requiresCompletedSet: "western" });
assert.deepEqual(ligne("halloweenies", "boss", "emperorLooty"), { id: "emperorLooty", chance: 6e-8, cap: 0.12, level: 40 });
assert.deepEqual(ligne("netherregions", "boss", "galacticHeraldLooty"), { id: "galacticHeraldLooty", chance: 2.4e-8, cap: 0.12, level: 8 });
// lignes au taux non publié / inexpliqué : jamais tirées
assert.equal(ligne("chocolate", "boss", "ascendedX3Pendant"), undefined, "\"0.1% + 0.0000001% base chance\" : notation inexpliquée");
assert.equal(P.aethereansea.boss.specials, undefined, "\"chance ?\" en Aethereal Sea");
for (const [zone, profil] of Object.entries(P)) for (const pool of ["normal", "boss"]) for (const d of profil[pool]?.specials || []) {
  for (const id of d.ids || [d.id]) assert.ok(S[id], `${zone}.${pool} : ${id} défini`);
}

// ---------- Comportement : kills de boss de zone ----------
function tuer(zoneId, aleatoire, extra = {}, mutate) {
  const z = IDLE_ADVENTURE_ZONES.find((x) => x.id === zoneId);
  const ctx = { bosses: 300, difficulty: z.requiredDifficulty, difficultyPeaks: {}, forceBoss: true, ...extra };
  const original = Math.random;
  Math.random = () => aleatoire;
  try {
    let etat = applyIdleAdventureActionV47(createIdleAdventureStateV47(), { action: "selectZone", zone: zoneId }, ctx).state;
    if (mutate) mutate(etat);
    return applyIdleAdventureActionV47(etat, { action: "zoneKill", forceBoss: true }, ctx).result.drops.map((d) => d.definitionId);
  } finally {
    Math.random = original;
  }
}
assert.ok(!tuer("ancient", 0).includes("dragonWings"), "Dragon Wings : seulement sur MYSTERIOUS FIGURE");
assert.ok(tuer("ancient", 0, { forceMobName: "Mysterious Figure" }).includes("dragonWings"));
assert.ok(tuer("sky", 0).includes("lootyMcLootFace"));
assert.ok(!tuer("boring", 0).includes("stealthiestArmour"), "The Stealthiest Armour : seulement si Stealth (set) complet");
assert.ok(tuer("boring", 0, {}, (s) => { s.completedSets.stealth = true; }).includes("stealthiestArmour"));
{
  const drops = tuer("chocolate", 0, {}, (s) => { s.completedSets.choco = true; });
  assert.equal(drops.filter((d) => /BarBarAccessory$/.test(d)).length, 1, "un seul jet pour \"one of\" Energy/Magic Bar Bar");
}
assert.ok(!tuer("chocolate", 0).some((d) => /BarBarAccessory$/.test(d)), "Bar Bar (Accessory) : seulement si Choco (set) complet");

// ---------- Comportement : titans ----------
function titan(id, aleatoire, difficulty, mutate) {
  const s = normalizeIdleAdventureStateV47({});
  s.bonusSlots = { inventory: 100 };
  s.titans[id] = id === "t5" ? { kills: 4, nextAt: 0, hiddenPanel: "" } : { kills: 1, nextAt: 0 };
  s.unlockFlags.ringOfApathyMaxed = true;
  if (mutate) mutate(s);
  const original = Math.random;
  Math.random = () => aleatoire;
  try {
    return applyIdleAdventureActionV47(s, { action: "titan", titan: id, difficulty }, { bosses: 400, difficulty: "extreme", stats: { power: 1e60, toughness: 1e60 } }, 1000).result.drops;
  } finally {
    Math.random = original;
  }
}
{
  // Greasy Nerd : "Guaranteed one of" (5 pièces + Calculator + Figurine) lvl 4, rien d'autre sans jet réussi
  const rien = titan("nerd", 0.999999, "brutal").filter((d) => d.kind !== "boost");
  assert.equal(rien.length, 1);
  const sept = ["head", "chest", "legs", "boots", "weapon"].map((slot) => "greasynerd:" + slot).concat(["ordinaryCalculator", "animeFigurine"]);
  assert.ok(sept.includes(rien[0].definitionId), rien[0].definitionId);
  assert.equal(rien[0].level, 4);
  const tout = titan("nerd", 0, "easy").map((d) => d.definitionId);
  assert.ok(tout.includes("ascendedX4Pendant") && !tout.includes("theD20"), "The D20 : Normal+ seulement");
  assert.ok(titan("nerd", 0, "brutal").some((d) => d.definitionId === "heartShapedPanties"));
}
{
  const godmother = titan("godmother", 0, "hard").map((d) => d.definitionId + "@" + d.level);
  assert.ok(godmother.includes("kingLooty@8") && godmother.includes("godmothersWand@4") && !godmother.includes("leftFairyWing@4"));
  const amalgamate = titan("amalgamate", 0, "easy").map((d) => d.definitionId + "@" + d.level);
  assert.ok(amalgamate.includes("supremeIntelligenceLooty@50") && amalgamate.includes("amalgamate:deathstick@4"));
}
{
  // Walderp : Wanderer's Cane lvl 10 garanti, remplacé 1 fois sur 100 (fixe) par The Candy Cane of Destiny lvl 0
  const normal = titan("t5", 0.5, undefined).map((d) => d.definitionId + "@" + d.level);
  assert.ok(normal.includes("wanderersCane@10") && !normal.includes("candyCaneDestiny@0"));
  const rare = titan("t5", 0, undefined).map((d) => d.definitionId + "@" + d.level);
  assert.ok(rare.includes("candyCaneDestiny@0"));
  assert.ok(!rare.includes("fannyPack@10"), "Fanny Pack : seulement si Wanderer's (set) complet");
  assert.ok(titan("t5", 0, undefined, (s) => { s.completedSets.wanderer = true; }).some((d) => d.definitionId === "fannyPack"));
  // UUG's 'Special' Ring : seulement si UUG's rings (set) complet
  assert.ok(!titan("t4", 0, undefined).some((d) => d.definitionId === "uugSpecialRing"));
  assert.ok(titan("t4", 0, undefined, (s) => { s.completedSets.uug = true; }).some((d) => d.definitionId === "uugSpecialRing" && d.level === 4));
  // Jake : Stapler lvl 4, Ascended Forest Pendant lvl 1
  const jake = titan("t3", 0, undefined).map((d) => d.definitionId + "@" + d.level);
  assert.ok(jake.includes("stapler@4") && jake.includes("ascendedForestPendant@1"));
}

console.log("idle-adventure-missing-items-2026-09-23: OK");
