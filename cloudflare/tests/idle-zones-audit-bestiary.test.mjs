import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_MOB_BESTIARY_V1 as B,
  IDLE_ADVENTURE_MOB_CATALOG_V1,
  idleAdventureBestiaryAverageV1,
  idleAdventureMobAttackFactorV1,
  idleAdventureMobTypeV1,
  monsterHpMaxForZoneV1WithMob
} from "../src/idle-adventure-v47.js";

/*
 * Audit zones 2026-09-23 : verrou d'un échantillon de valeurs relues dans le
 * miroir local du wiki (C:\Users\n0rma\Documents\NGU-Wiki\pages\<Titre>.json)
 * -- section "==Enemies==" de chaque page de zone, puis fiche {{Enemy}} de
 * chaque ennemi (attack_rate/power/toughness/hp_regen/hp). Pages absentes du
 * miroir (collision de casse) relues sur le wiki live via l'API MediaWiki :
 * "The Fad-lands", "Back To School", "KING CIRCLE", "The Slammer".
 */
const zone = (id) => IDLE_ADVENTURE_ZONES.find((z) => z.id === id);
const byName = (list, name) => list.find((m) => m.name === name);

// 1. Roster normal/boss de chaque zone = liste "Enemies" de sa page (BossLink = boss).
const ROSTER = {
  tutorial: [3, 1], sewers: [3, 1], forest: [7, 2], cave: [13, 3], sky: [8, 2], hsb: [8, 2],
  clock: [7, 1], "2d": [6, 2], ancient: [6, 2], avsp: [6, 2], mega: [8, 1], beardverse: [6, 2],
  badly: [6, 2], boring: [7, 1], chocolate: [10, 3], evilverse: [7, 2], pinkprincess: [6, 2],
  metaland: [6, 2], interdimensional: [6, 2], typozone: [6, 2], fadlands: [6, 2], jrpgville: [6, 2],
  radlands: [8, 2], backtoschool: [6, 2], westworld: [6, 2], breadverse: [6, 2], seventies: [6, 2],
  halloweenies: [6, 2], construction: [6, 2], duckduck: [6, 2],
  // 2026-09-24 : stats issues de NGU-Wiki/external (les fiches du wiki sont des stubs sans stats).
  netherregions: [6, 2], aethereansea: [17, 4]
};
for (const [id, [n, b]] of Object.entries(ROSTER)) {
  assert.equal(B[id].normal.length, n, `${id} : ${n} ennemis normaux (page de zone)`);
  assert.equal(B[id].boss.length, b, `${id} : ${b} boss d'Aventure (BossLink, page de zone)`);
}

// 2. The West World : THE OUTLAW / THE SHERIFF sont des boss ({{BossLink}} sur la page
//    de zone, colonne "Bosses" du tableau "Adventure Mode Enemies").
{
  const ww = B.westworld;
  assert.deepEqual(ww.boss.map((m) => m.name), ["THE OUTLAW", "THE SHERIFF"]);
  assert.equal(ww.normal.some((m) => /OUTLAW|SHERIFF/.test(m.name)), false);
  // Fiche "THE OUTLAW" : type=normal, attack_rate=1.2, power=1.620E+27, hp=1.650E+29
  assert.deepEqual(byName(ww.boss, "THE OUTLAW"), { name: "THE OUTLAW", type: "normal", attackRate: 1.2, power: 1.62e27, toughness: 1.62e27, hpRegen: 1.62e26, maxHp: 1.65e29 });
  // Fiche "THE SHERIFF" : type=grower
  assert.equal(idleAdventureMobTypeV1(zone("westworld"), true, 1), "grower");
  // Un tirage boss a désormais un vrai mob (avant : boss:[] -> PV zone-plat).
  assert.equal(monsterHpMaxForZoneV1WithMob(zone("westworld"), true, 0), 1.65e29);
}

// 3. The Rad-Lands : "attack_rate=?" sur 7 fiches du wiki, comblé le 2026-09-24 par NGU-Wiki/external/attack-rate-gaps.json
//    (toutes les autres stats identiques à la source). Jamais de 0 inventé.
{
  const rl = B.radlands.normal;
  assert.equal(rl.some((m) => m.attackRate === null || m.attackRate === 0), false, "aucun attackRate inconnu ni 0");
  // Fiche "Small Bart" : power=2E+24, toughness=2E+24, hp_regen=2E+23, hp=2.1E+26 ; attack_rate "?" -> 1 (source externe)
  assert.deepEqual(byName(rl, "Small Bart"), { name: "Small Bart", type: "normal", attackRate: 1, power: 2e24, toughness: 2e24, hpRegen: 2e23, maxHp: 2.1e26 });
  assert.equal(byName(rl, "A Massive Sealed Vault").attackRate, 1.2);
  assert.equal(byName(rl, "A Giant Vat of Plutonium-238").attackRate, 1.1);
  // Fiche "A Wandering Gamma Ray" : attack_rate=1 (publié par le wiki)
  assert.equal(byName(rl, "A Wandering Gamma Ray").attackRate, 1);
  // La moyenne ignore toujours les valeurs inconnues.
  assert.equal(idleAdventureBestiaryAverageV1([{ x: null }, { x: undefined }], "x"), 0);
  assert.equal(idleAdventureBestiaryAverageV1([{ x: null }, { x: 3 }], "x"), 3);
}

// 4. Échantillon de fiches relues (miroir ou live) -- toutes zones confondues.
{
  // "KING CIRCLE" (live) : boss=yes, attack_rate=1.2, power=3041, toughness=3050, hp_regen=300, hp=100000
  assert.deepEqual(byName(B["2d"].boss, "KING CIRCLE"), { name: "KING CIRCLE", type: "normal", attackRate: 1.2, power: 3041, toughness: 3050, hpRegen: 300, maxHp: 100000 });
  // "The Slammer" (live) : type=charger, boss=yes, power=4.12E+20, hp=4.25E+22
  assert.deepEqual(byName(B.fadlands.boss, "THE SLAMMER"), { name: "THE SLAMMER", type: "charger", attackRate: 1.2, power: 4.12e20, toughness: 4.12e20, hpRegen: 4.12e19, maxHp: 4.25e22 });
  // "A Small Piece of Fluff" : attack_rate=1, power=7, toughness=6, hp_regen=1, hp=40
  assert.deepEqual(byName(B.tutorial.normal, "A Small Piece of Fluff"), { name: "A Small Piece of Fluff", type: "normal", attackRate: 1, power: 7, toughness: 6, hpRegen: 1, maxHp: 40 });
  // "A SINGLE GRAPE" : type=poison, power=1E+32, toughness=1.1E+32, hp=5.06E+33
  assert.deepEqual(byName(B.duckduck.boss, "A SINGLE GRAPE"), { name: "A SINGLE GRAPE", type: "poison", attackRate: 1.2, power: 1e32, toughness: 1.1e32, hpRegen: 1e30, maxHp: 5.06e33 });
  // "Evil Mouse" : attack_rate=1, power=5E+12, hp=5E+14
  assert.equal(byName(B.evilverse.normal, "Evil Mouse").maxHp, 5e14);
  // "BELDING" (Back To School) : type=grower ; le wiki publie hp=6.25E+28, la source externe 3.25E+28 (le wiki a P/T/regen/PV x2 sur cette zone,
  // ratio puissance mob / puissance Manual recommandée 1,21 contre 0,54-0,80 ailleurs) -> source appliquée le 2026-09-24.
  assert.equal(byName(B.backtoschool.boss, "BELDING").type, "grower");
  assert.equal(byName(B.backtoschool.boss, "BELDING").maxHp, 3.25e28);
  assert.equal(byName(B.backtoschool.normal, "A Different Greasy Nerd").power, 3e26);
  assert.equal(byName(B.construction.normal, "A Bulldozer").maxHp, 2.07e33);
  assert.equal(byName(B.halloweenies.normal, "A Skeleton Inside a Body").type, "paralyze");
}

// 5. Zones sans stats sur le wiki (fiches stub ou absentes) : stats de NGU-Wiki/external/late-zone-enemies.json
//    (source externe ngu-idle-calculators, contrôles de cohérence passés), jamais inventées.
{
  assert.equal(B.netherregions.normal.length + B.netherregions.boss.length, 8);
  assert.equal(B.aethereansea.normal.length + B.aethereansea.boss.length, 21);
  assert.deepEqual(byName(B.netherregions.normal, "A Patch of Tulips"), { name: "A Patch of Tulips", type: "normal", attackRate: 1, power: 2.5e32, toughness: 2.5e32, hpRegen: 2.5e30, maxHp: 1.2e34 });
  assert.deepEqual(byName(B.aethereansea.normal, "A Seagull"), { name: "A Seagull", type: "normal", attackRate: 1, power: 1.3e34, toughness: 1.3e34, hpRegen: 1.3e32, maxHp: 8.2e35 });
  assert.equal(byName(B.aethereansea.boss, "THE CAPTAIN").type, "charger");
  assert.equal(byName(B.netherregions.boss, "DAAN VAN DER VAAN JAANSEN").maxHp, 1.3e34);
  // Les PV viennent du mob réel tiré, plus du repli zone-plat (oneHitP).
  assert.equal(monsterHpMaxForZoneV1WithMob(zone("aethereansea"), false, 0), Math.floor(8.2e35));
  assert.equal(monsterHpMaxForZoneV1WithMob(zone("netherregions"), false, 0), Math.floor(1.2e34));
}

// 6. Catalogue d'images R2 : seulement des zones existantes, jamais une zone inventée.
for (const id of Object.keys(IDLE_ADVENTURE_MOB_CATALOG_V1)) {
  assert.ok(zone(id), `catalogue R2 : zone ${id} inconnue`);
  assert.ok(B[id], `catalogue R2 : ${id} doit avoir un bestiaire`);
}

console.log("idle-zones-audit-bestiary: OK");
