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
  halloweenies: [6, 2], construction: [6, 2], duckduck: [6, 2]
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

// 3. The Rad-Lands : "attack_rate=?" sur 7 fiches -> null, jamais 0 inventé.
{
  const rl = B.radlands.normal;
  const inconnus = rl.filter((m) => m.attackRate === null).map((m) => m.name).sort();
  assert.deepEqual(inconnus, [
    "A Giant Vat of Plutonium-238", "A Massive Sealed Vault", "Lame Security Guard",
    "Mutant Zombie Marie Curie", "Nuclear Power Pants", "Pair of Shades Wearing Shades", "Small Bart"
  ]);
  assert.equal(rl.some((m) => m.attackRate === 0), false, "aucun attackRate 0 inventé");
  // Fiche "Small Bart" : power=2E+24, toughness=2E+24, hp_regen=2E+23, hp=2.1E+26
  assert.deepEqual(byName(rl, "Small Bart"), { name: "Small Bart", type: "normal", attackRate: null, power: 2e24, toughness: 2e24, hpRegen: 2e23, maxHp: 2.1e26 });
  // Fiche "A Wandering Gamma Ray" : attack_rate=1 (seule valeur publiée de la zone)
  assert.equal(byName(rl, "A Wandering Gamma Ray").attackRate, 1);
  // La moyenne ignore les null (sinon 1/8 = 0.125).
  assert.equal(idleAdventureBestiaryAverageV1(rl, "attackRate"), 1);
  assert.equal(idleAdventureBestiaryAverageV1([{ x: null }, { x: undefined }], "x"), 0);
  // attackRate inconnu -> facteur neutre 1.
  const idxBart = rl.findIndex((m) => m.name === "Small Bart");
  assert.equal(idleAdventureMobAttackFactorV1(zone("radlands"), false, idxBart), 1);
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
  // "BELDING" (Back To School) : type=grower, hp=6.25E+28
  assert.equal(byName(B.backtoschool.boss, "BELDING").type, "grower");
  assert.equal(byName(B.backtoschool.boss, "BELDING").maxHp, 6.25e28);
}

// 5. Zones sans stats publiées : jamais de mob inventé.
{
  // The Nether Regions : fiches {{Enemy}} sans aucune stat Adventure (miroir + live).
  assert.deepEqual(B.netherregions, { normal: [], boss: [] });
  // The Aethereal Sea : aucune page pour ses 21 ennemis (miroir + live).
  assert.equal(B.aethereansea, undefined);
  // Repli zone-plat (oneHitP) plutôt qu'un PV inventé.
  assert.equal(monsterHpMaxForZoneV1WithMob(zone("aethereansea"), false, 0), Math.floor(5.75e35));
}

// 6. Catalogue d'images R2 : seulement des zones existantes, jamais une zone inventée.
for (const id of Object.keys(IDLE_ADVENTURE_MOB_CATALOG_V1)) {
  assert.ok(zone(id), `catalogue R2 : zone ${id} inconnue`);
  assert.ok(B[id], `catalogue R2 : ${id} doit avoir un bestiaire`);
}

console.log("idle-zones-audit-bestiary: OK");
