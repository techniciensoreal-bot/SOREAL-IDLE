import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-19) : « quand on loot un objet niveau 1, les statistiques ne sont pas à fond : on doit le booster ; quand il est au max et qu'on le fusionne, il faut de nouveau le booster. Je veux que tu compares avec le
 * vrai jeu. Tout doit être pareil à ce niveau-là aussi. » Référence : tests/references/objets-jeu-v1.json = table des 515 objets du jeu (ItemNameDesc::constructItemInfo, build 1260, extraite par tools/jeu/extraire-objets-jeu-v1.mjs).
 * Règles du jeu lues dans l'IL (Equipment::maxEquipBoost / boostEquip / mergeItem, ItemNameDesc::makeLevelledLoot) :
 *  - plafond au niveau L = floor(cap x (1 + L/100)), en float32 ; - un objet tombe avec sa stat COURANTE (« cur »), jamais remontée au plafond ; - un boost est refusé (non consommé) quand cur >= plafond ;
 *  - fusion : niveau a + b + 1 (borné à 100), cur = max des deux : il faut de nouveau booster ; - un objet n'a que TROIS lignes de Specials, remplies dans l'ordre ; les types 27/28/29 sont UNE ligne Energie ET Magie.
 */
const R = "../src/";
await import(R + "idle-sqlite-runtime.js");
const base = await import(R + "idle-adventure-base.js");
const sets = await import(R + "idle-adventure-sets.js");
const obj = await import(R + "idle-adventure-objets.js");
const inv = await import(R + "idle-adventure-inventaire.js");
const pts = await import(R + "idle-adventure-special-points-v1.js");
const ref = JSON.parse(readFileSync(new URL("./references/objets-jeu-v1.json", import.meta.url), "utf8"));
const proche = (a, b) => Math.abs(a - b) <= 2e-5 * Math.max(1, Math.abs(b));
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const parNom = new Map(); for (const o of ref.objets) if (!parNom.has(norm(o.nom))) parNom.set(norm(o.nom), o);

/* 1. le plafond du jeu (floor, float32) */
const plafond = base.idleAdventurePlafondNiveauV1;
assert.deepEqual([0, 1, 50, 100].map((l) => plafond(3, l)), [3, 3, 4, 6], "Stick (3) : 3, 3, 4, 6 comme dans le jeu (texte de la Stick : « rounded down »)");
assert.deepEqual([plafond(5, 10), plafond(5, 20), plafond(100, 7), plafond(100, 29)], [5, 6, 107, 129], "arrondi vers le bas, sans erreur de flottant (100 x 1,29 = 129)");
assert.equal(plafond(0, 50), 0); assert.equal(plafond(-5, 50), 0);

/* 2. Power/Toughness courante et plafond de TOUTES les pièces de set et de tous les accessoires, comparées à la table du jeu */
let comparees = 0;
const noms = sets.SET_ITEM_NAMES_EN_V1 || sets.SET_ITEM_NAMES_V1;
for (const [setId, s] of Object.entries(sets.SETS)) for (const slot of s.slots) {
  const def = `${setId}:${slot}`, g = parNom.get(norm(noms[def])); if (!g) continue; comparees++;
  const b = obj.idleAdventureBaseStatsV1(setId, slot), v = obj.idleAdventureItemBaseValueV1(def);
  for (const [lbl, a, c] of [["capP", b.baseP, g.capP], ["capT", b.baseT, g.capT], ["curP", v.power, g.curP], ["curT", v.toughness, g.curT]]) assert.ok(proche(a, c), `${def} (${g.nom}) ${lbl} : SOREAL ${a} / jeu ${c}`);
}
for (const [id, d] of Object.entries(sets.SPECIALS_EN_V1)) {
  const g = parNom.get(norm(d.name)); if (!g) continue; comparees++;
  const b = obj.idleAdventureSpecialBaseStatsV1(id), it = obj.idleAdventureSpecialItemV1(id, 0);
  for (const [lbl, a, c] of [["capP", b.baseP, g.capP], ["capT", b.baseT, g.capT], ["curP", it.power, g.curP], ["curT", it.toughness, g.curT]]) assert.ok(proche(a, c), `${id} (${g.nom}) ${lbl} : SOREAL ${a} / jeu ${c}`);
}
assert.ok(comparees >= 380, "au moins 380 objets comparés (pièces de set et accessoires), trouvé " + comparees);

/* 3. Specials : trois lignes du jeu, dans l'ordre, jumelles comprises (types 27 / 28 / 29 = Energie ET Magie) */
const JUMELLES = { 27: ["energyPowerPct", "magicPowerPct"], 28: ["energyBarsPct", "magicBarsPct"], 29: ["energyCapPct", "magicCapPct"] };
let specialsComparees = 0;
const listeDef = [];
for (const [setId, s] of Object.entries(sets.SETS)) for (const slot of s.slots) listeDef.push({ def: `${setId}:${slot}`, nom: noms[`${setId}:${slot}`], item: () => inv.idleAdventureItemAtLevelV47(`${setId}:${slot}`, 0) });
for (const [id, d] of Object.entries(sets.SPECIALS_EN_V1)) listeDef.push({ def: id, nom: d.name, item: () => obj.idleAdventureSpecialItemV1(id, 0) });
for (const { def, nom, item } of listeDef) {
  const g = parNom.get(norm(nom)); if (!g || !g.spec.length) continue;
  const lignes = obj.idleAdventureSpecialsListV1(item()); if (!lignes.length) continue;
  const groupes = obj.idleAdventureSpecialsGroupesV1(def, lignes.length);
  assert.equal(groupes.length, g.spec.length, `${def} (${g.nom}) : ${g.spec.length} ligne(s) de Specials dans le jeu, ${groupes.length} chez SOREAL`);
  const ex = pts.IDLE_SPECIAL_POINTS_EXP_V1[def] || [];
  groupes.forEach((grp, k) => {
    const [t, cur, cap] = g.spec[k];
    if (JUMELLES[t]) assert.deepEqual(grp.map((i) => lignes[i].type).sort(), JUMELLES[t].slice().sort(), `${def} ligne ${k + 1} (type ${t}) : Energie ET Magie`);
    else assert.equal(grp.length, 1, `${def} ligne ${k + 1} (type ${t}) : une seule ligne`);
    for (const i of grp) { const e = 10 ** (ex[i] ?? 0); assert.ok(proche(lignes[i].base * e, cur) && proche(lignes[i].max * e, cap), `${def} ligne ${k + 1} : points ${lignes[i].base * e}/${lignes[i].max * e} / jeu ${cur}/${cap}`); }
  });
  specialsComparees++;
}
assert.ok(specialsComparees >= 340, "au moins 340 objets à Specials comparés, trouvé " + specialsComparees);

/* 4. Comportements : loot, boost, fusion */
const etat = () => { const s = obj.createIdleAdventureStateV47(); s.inventory = []; return s; };
{
  /* loot niveau 50 : la stat courante reste celle de la table (3), le plafond monte à 4 : il faut booster */
  const stick = inv.idleAdventureItemAtLevelV47("training:weapon", 50);
  assert.equal(stick.power, 3, "un objet tombé au niveau 50 garde sa stat courante (jeu : cur 3 de la table)");
  assert.equal(obj.idleAdventureBoostManquantV1(stick).power, true, "il manque du boost");
  const s = etat(); obj.idleAdventureAddItemV1(s, stick);
  obj.idleAdventureAddItemV1(s, obj.idleAdventureBoostV1("power", 5));
  const apres = obj.idleAdventureApplyBoostItemV1(s, s.inventory.find((x) => x.kind === "boost").id, stick.id, {});
  assert.equal(apres.power, 4, "Power Boost 5 : borné au plafond floor(3 x 1,5) = 4, pas 4,5");
  obj.idleAdventureAddItemV1(s, obj.idleAdventureBoostV1("power", 1));
  assert.throws(() => obj.idleAdventureApplyBoostItemV1(s, s.inventory.find((x) => x.kind === "boost").id, stick.id, {}), /BOOST_STAT_DEJA_MAX/, "au plafond : boost refusé (et conservé), comme boostEquip du jeu");
  assert.equal(s.inventory.some((x) => x.kind === "boost"), true, "le boost refusé n'est pas consommé");
}
{
  /* fusion : au plafond puis fusionné, il faut de nouveau booster (cur = max des deux, plafond du nouveau niveau plus haut) */
  const A = inv.idleAdventureItemAtLevelV47("sewers:weapon", 4), B = inv.idleAdventureItemAtLevelV47("sewers:weapon", 4);
  A.power = plafond(20, 4); B.power = 4;
  assert.equal(obj.idleAdventureBoostManquantV1(A).power, false, "avant la fusion : au maximum (niveau 4 : floor(20 x 1,04) = 20)");
  const s = etat(); const a = obj.idleAdventureAddItemV1(s, A), b = obj.idleAdventureAddItemV1(s, B);
  const F = obj.idleAdventureMergeItemsV1(s, a.id, b.id);
  assert.equal(F.level, 9, "niveau a + b + 1");
  assert.equal(F.power, 20, "cur = max des deux, jamais remonté au nouveau plafond");
  assert.equal(obj.idleAdventureBoostManquantV1(F).power, true, "il faut de nouveau booster : plafond floor(20 x 1,09) = 21 > 20");
}
{
  /* Special Boost : les points remplissent les lignes DANS L'ORDRE DU JEU, les lignes jumelles ensemble (Badly Drawn Smiley Face : jeu = Bars Energie+Magie, puis Advanced Training, puis Gold) */
  const o = inv.idleAdventureItemAtLevelV47("badly:head", 100);
  const avant = obj.idleAdventureSpecialsRoomPointsV1(o);
  assert.equal(avant, 450000 + 1600000 + 1200000, "place = 3 lignes du jeu (la ligne Bars Energie+Magie n'est comptée qu'UNE fois)");
  obj.idleAdventureApplySpecialPointsV1(o, 450000);
  const l = Object.fromEntries(obj.idleAdventureSpecialsListV1(o).map((x) => [x.type, x.value]));
  assert.equal(l.energyBarsPct, 900); assert.equal(l.magicBarsPct, 900);
  assert.equal(l.advancedTrainingPct, 160, "la 2e ligne du jeu n'est pas touchée avant que la 1re soit pleine");
  assert.equal(obj.idleAdventureSpecialsRoomPointsV1(o), 1600000 + 1200000);
}
console.log("idle-objets-jeu-reference-v1: OK (" + comparees + " objets, " + specialsComparees + " avec Specials)");
