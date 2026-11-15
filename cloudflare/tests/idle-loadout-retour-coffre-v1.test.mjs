import assert from "node:assert/strict";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { applyIdleInventoryAutoActionV1, normalizeIdleInventoryAutoV1 } from "../src/idle-inventory-auto-v1.js";
import { idleAdventureObjetPleinementMaxeV1, idleAdventureBaseStatsV1 } from "../src/idle-adventure-objets.js";

/*
 * Sets ACTIVABLES (Norman, 2026-11-15) :
 *  - activer un set remplace chaque case du set ; une case VIDE du set ne change rien (l'équipement d'avant reste) ;
 *  - désactiver le set (même bouton) rééquipe l'équipement d'avant et renvoie les pièces du set d'où elles venaient (le coffre ou le sac) ;
 *  - activer un autre set désactive d'abord le premier.
 * (Remplace le test du 2026-11-14 : « les pièces du coffre retournent au coffre » reste vrai, à la désactivation.)
 */
const adv = () => { const s = createIdleAdventureStateV47(); s.inventoryAuto = normalizeIdleInventoryAutoV1(null); return s; };
const addItem = (s, definitionId, level = 0) => { const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {}); Object.assign(s, r.state); return s.inventory.find((x) => x.definitionId === definitionId && !x.__vu && (x.__vu = true)); };
const equip = (s, id, slot) => Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id, slot }, {}).state);
const env = { loadoutSlots: 3 };
const dansSac = (s, id) => s.inventory.some((o) => o.id === id);
const auCoffre = (s, id) => Object.values(s.coffre || {}).some((o) => o && o.id === id);
const maxer = (o) => { const b = idleAdventureBaseStatsV1("sewers", "head"); o.power = b.baseP * 2; o.toughness = b.baseT * 2; o.special = b.baseS * 2; };
const agir = (st, mode, index) => applyIdleInventoryAutoActionV1(st, { mode, index }, env);

const s = adv();
const st = { adventure: s };
// Équipement porté au départ : une arme W0 et des bottes B0.
const armeW0 = addItem(s, "forest:weapon"), bottesB0 = addItem(s, "sewers:boots");
equip(s, armeW0.id, "weapon"); equip(s, bottesB0.id, "boots");
// Set 0 (« gold drop ») : un casque maxé (qui ira au coffre) + une arme ; PAS de bottes (case vide). Set 1 : un autre casque.
const casqueA = addItem(s, "sewers:head", 100); maxer(casqueA);
assert.ok(idleAdventureObjetPleinementMaxeV1(casqueA), "le casque du set 0 est pleinement maxé (éligible au coffre)");
const armeA = addItem(s, "sewers:weapon");
const casqueB = addItem(s, "forest:head");
// On enregistre les sets en équipant temporairement.
equip(s, casqueA.id, "head"); equip(s, armeA.id, "weapon");
agir(st, "loadoutSave", 0);
// Le set 0 contient aussi les bottes B0 portées à l'enregistrement : on les retire de la configuration pour avoir une case VIDE.
st.adventure.inventoryAuto.loadouts[0].boots = "";
equip(s, casqueB.id, "head");
agir(st, "loadoutSave", 1);
st.adventure.inventoryAuto.loadouts[1].weapon = ""; st.adventure.inventoryAuto.loadouts[1].boots = "";
// Retour à l'équipement de départ : arme W0 + bottes B0, tête vide.
equip(s, armeW0.id, "weapon");
Object.assign(s, applyIdleAdventureActionV47(s, { action: "unequip", id: casqueB.id }, {}).state);
st.adventure.equipment.head = "";
// Le casque A (maxé) est rangé au coffre par le joueur.
{
  const o = st.adventure.inventory.find((x) => x.id === casqueA.id);
  st.adventure.inventory = st.adventure.inventory.filter((x) => x.id !== casqueA.id);
  st.adventure.coffre = st.adventure.coffre || {}; st.adventure.coffre[o.definitionId] = o;
}
assert.ok(auCoffre(st.adventure, casqueA.id) && !dansSac(st.adventure, casqueA.id), "départ : le casque A est au coffre");
assert.equal(st.adventure.equipment.weapon, armeW0.id); assert.equal(st.adventure.equipment.boots, bottesB0.id); assert.equal(st.adventure.equipment.head, "");

// 1. ACTIVER le set 0 : le casque vient du coffre, l'arme du set remplace W0, les bottes (case vide du set) ne changent PAS.
let r = agir(st, "loadoutApply", 0);
assert.equal(st.adventure.equipment.head, casqueA.id, "casque du set équipé (repris au coffre)");
assert.equal(st.adventure.equipment.weapon, armeA.id, "arme du set équipée");
assert.equal(st.adventure.equipment.boots, bottesB0.id, "case vide du set : les bottes d'avant restent équipées");
assert.equal(st.adventure.inventoryAuto.loadoutActif.index, 0, "le set 0 est actif");
assert.ok(!auCoffre(st.adventure, casqueA.id), "le casque n'est plus au coffre");

// 2. DÉSACTIVER (même bouton) : l'équipement d'avant revient, le casque retourne AU COFFRE, l'arme du set retourne dans le sac.
r = agir(st, "loadoutApply", 0);
assert.equal(st.adventure.inventoryAuto.loadoutActif, undefined, "plus aucun set actif");
assert.equal(st.adventure.equipment.weapon, armeW0.id, "l'arme d'avant est rééquipée");
assert.equal(st.adventure.equipment.boots, bottesB0.id, "les bottes d'avant sont toujours là");
assert.equal(st.adventure.equipment.head, "", "la case tête d'avant était vide : elle l'est de nouveau");
assert.ok(auCoffre(st.adventure, casqueA.id) && !dansSac(st.adventure, casqueA.id), "le casque A est revenu au coffre, pas dans le sac");
assert.ok(dansSac(st.adventure, armeA.id) && st.adventure.equipment.weapon !== armeA.id, "l'arme du set, venue du sac, retourne dans le sac");

// 3. Cycle répétable : activer, puis activer un AUTRE set (désactive le premier d'abord), puis le désactiver.
agir(st, "loadoutApply", 0);
assert.equal(st.adventure.equipment.head, casqueA.id);
agir(st, "loadoutApply", 1);
assert.equal(st.adventure.inventoryAuto.loadoutActif.index, 1, "le set 1 est actif");
assert.ok(auCoffre(st.adventure, casqueA.id), "le casque du set 0 est retourné au coffre au changement de set");
assert.equal(st.adventure.equipment.head, casqueB.id, "casque du set 1 équipé");
assert.equal(st.adventure.equipment.weapon, armeW0.id, "case vide du set 1 : l'arme d'AVANT l'activation (pas celle du set 0)");
agir(st, "loadoutApply", 1);
assert.equal(st.adventure.equipment.head, "", "tout est revenu");
assert.equal(st.adventure.equipment.weapon, armeW0.id);
assert.ok(dansSac(st.adventure, casqueB.id));

// 4. Un set vide ne s'active pas.
assert.throws(() => agir(st, "loadoutApply", 2), /LOADOUT_VIDE/);
console.log("idle-loadout-retour-coffre-v1 : OK");
