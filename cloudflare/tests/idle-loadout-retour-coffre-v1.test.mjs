import assert from "node:assert/strict";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { applyIdleInventoryAutoActionV1, normalizeIdleInventoryAutoV1 } from "../src/idle-inventory-auto-v1.js";
import { idleAdventureObjetPleinementMaxeV1, idleAdventureBaseStatsV1 } from "../src/idle-adventure-objets.js";

/*
 * Norman (2026-11-14) : « quand on équipe un set, les pièces qui venaient de l'inventaire doivent y retourner quand on change de set, mais celles qui venaient du COFFRE doivent retourner dans le coffre et ne pas se retrouver dans l'inventaire ».
 */
const adv = () => { const s = createIdleAdventureStateV47(); s.inventoryAuto = normalizeIdleInventoryAutoV1(null); return s; };
const addItem = (s, definitionId, level = 0) => { const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {}); Object.assign(s, r.state); return s.inventory.find((x) => x.id === r.result.id); };
const equip = (s, id, slot) => Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id, slot }, {}).state);
const unequip = (s, id) => Object.assign(s, applyIdleAdventureActionV47(s, { action: "unequip", id }, {}).state);
const env = { loadoutSlots: 3 };
const dansSac = (s, id) => s.inventory.some((o) => o.id === id);
const auCoffre = (s, id) => Object.values(s.coffre || {}).some((o) => o && o.id === id);

const s = adv();
// Set A : une arme du sac + un casque MAXÉ (qui ira au coffre). Set B : une autre arme et un autre casque, tous deux du sac.
const armeA = addItem(s, "sewers:weapon"), casqueA = addItem(s, "sewers:head", 100);
const base = idleAdventureBaseStatsV1("sewers", "head");
casqueA.power = base.baseP * 2; casqueA.toughness = base.baseT * 2; casqueA.special = base.baseS * 2;
assert.ok(idleAdventureObjetPleinementMaxeV1(casqueA), "le casque du set A est pleinement maxé (éligible au coffre)");
const armeB = addItem(s, "forest:weapon"), casqueB = addItem(s, "forest:head");
const st = { adventure: s };
equip(st.adventure, armeA.id, "weapon"); equip(st.adventure, casqueA.id, "head");
applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
equip(st.adventure, armeB.id, "weapon"); equip(st.adventure, casqueB.id, "head");
applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 1 }, env);
// Le joueur range le casque maxé du set A au coffre.
unequip(st.adventure, armeB.id); unequip(st.adventure, casqueB.id);   // (les pièces du set A ont été remplacées par celles du set B : elles sont dans le sac)
{
  const o = st.adventure.inventory.find((x) => x.id === casqueA.id);
  st.adventure.inventory = st.adventure.inventory.filter((x) => x.id !== casqueA.id);
  st.adventure.coffre = st.adventure.coffre || {}; st.adventure.coffre[o.definitionId] = o;
}
assert.ok(auCoffre(st.adventure, casqueA.id) && !dansSac(st.adventure, casqueA.id), "départ : le casque A est au coffre");

// 1. Équiper le set A : le casque vient du coffre, l'arme du sac.
let r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 0 }, env);
assert.equal(r.fromCoffre, 1);
assert.equal(st.adventure.equipment.head, casqueA.id); assert.equal(st.adventure.equipment.weapon, armeA.id);
assert.deepEqual(st.adventure.inventoryAuto.coffreEquipes, [casqueA.id], "la pièce venue du coffre est marquée");

// 2. Équiper le set A une seconde fois : rien ne bouge, la marque reste.
r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 0 }, env);
assert.equal(r.toCoffre, 0); assert.equal(st.adventure.equipment.head, casqueA.id);
assert.deepEqual(st.adventure.inventoryAuto.coffreEquipes, [casqueA.id]);

// 3. Changer pour le set B : le casque A RETOURNE AU COFFRE (pas dans le sac) ; l'arme A, venue du sac, reste dans le sac.
r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 1 }, env);
assert.equal(r.toCoffre, 1, "une pièce renvoyée au coffre");
assert.ok(auCoffre(st.adventure, casqueA.id) && !dansSac(st.adventure, casqueA.id), "le casque A est revenu au coffre, pas dans le sac");
assert.ok(dansSac(st.adventure, armeA.id), "l'arme A, venue du sac, retourne dans le sac");
assert.equal(st.adventure.equipment.head, casqueB.id); assert.equal(st.adventure.equipment.weapon, armeB.id);
assert.deepEqual(st.adventure.inventoryAuto.coffreEquipes || [], [], "plus aucune pièce marquée");

// 4. Re-équiper le set A : le casque est repris au coffre ; puis le set B le renvoie encore (cycle répétable).
r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 0 }, env);
assert.equal(r.fromCoffre, 1); assert.ok(!auCoffre(st.adventure, casqueA.id));
r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 1 }, env);
assert.equal(r.toCoffre, 1); assert.ok(auCoffre(st.adventure, casqueA.id) && !dansSac(st.adventure, casqueA.id));

// 5. Une pièce du coffre dont la place est reprise entre-temps ne se perd pas : elle reste dans le sac.
r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 0 }, env);
const autre = st.adventure.coffre; 
const casqueC = addItem(st.adventure, "sewers:head", 100); casqueC.power = base.baseP * 2; casqueC.toughness = base.baseT * 2; casqueC.special = base.baseS * 2;
assert.ok(!auCoffre(st.adventure, casqueC.id));
st.adventure.coffre["sewers:head"] = casqueC;   // la case « sewers:head » du coffre est prise par une autre pièce
st.adventure.inventory = st.adventure.inventory.filter((o) => o.id !== casqueC.id);
r = applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 1 }, env);
assert.equal(r.toCoffre, 0, "case prise : rien n'est renvoyé");
assert.ok(dansSac(st.adventure, casqueA.id), "la pièce reste dans le sac plutôt que d'être perdue");
console.log("idle-loadout-retour-coffre-v1 : OK");
