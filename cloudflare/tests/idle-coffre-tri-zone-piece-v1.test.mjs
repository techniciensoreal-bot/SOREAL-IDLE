import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, idleAdventureSnapshotV47, IDLE_ADVENTURE_ZONES, IDLE_ADVENTURE_ITEM_CATALOG_V1 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-27) : « J'aimerai qu'on puisse trier le coffre par ordre de Zone, pièce
 * (tete, bijoux, ...) ». Le Coffre n'accepte que l'équipement (idle-coffre-tutorial-cube-v1) :
 * chaque case connaît déjà son set (donc sa zone via IDLE_ADVENTURE_ZONES) et son slot. Rien
 * de nouveau n'est révélé : seul l'ORDRE des cases change, `decouvert` reste inchangé par case.
 */
const ctx = { bosses: 300 };
const s = normalizeIdleAdventureStateV47({});
// Toutes les pièces "découvertes" pour voir l'ordre complet des cases connues du Coffre (coffreSlots ne renvoie que
// celles-ci -- voir idleAdventureCoffreSlotsV1(s).filter(x=>x.decouvert) au site d'appel du snapshot).
for (const [definitionId, def] of Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)) {
  if (def.kind === "equipment") s.itemList[definitionId] = { seen: true };
}
const slots = idleAdventureSnapshotV47(s, ctx, 1000).coffreSlots;

// Rang de zone attendu, tel que publié par IDLE_ADVENTURE_ZONES (ordre de progression, boss croissant).
const rangZone = {};
IDLE_ADVENTURE_ZONES.forEach((z, i) => {
  if (z && z.set && !(z.set in rangZone)) rangZone[z.set] = i;
});
const rangSlot = { weapon: 0, head: 1, chest: 2, legs: 3, boots: 4 };
const rangSlotDe = (slot) => (rangSlot[slot] != null ? rangSlot[slot] : 5);

// L'ordre reçu doit être trié par zone (les sets sans zone connue, ex. "amalgamate", passent en dernier) puis par
// pièce, jamais mélangé.
const MAX = Number.MAX_SAFE_INTEGER;
let dernierZone = -1, dernierSlotDansZone = -1;
/*
 * 2026-10-01 : les pièces des sets de titans (GRB, Jake...) ne sont plus mêlées aux sets sans zone : elles forment le groupe « titan »
 * (voir idle-coffre-specials-v1). Cette vérification de l'ordre zone puis pièce ne porte donc que sur le groupe « zone ».
 */
for (const slot of slots.filter((x) => x.groupe === "zone")) {
  const z = rangZone[slot.set] != null ? rangZone[slot.set] : MAX;
  if (z !== dernierZone) {
    assert.ok(z > dernierZone, "les zones ne reculent jamais : " + slot.definitionId);
    dernierZone = z;
    dernierSlotDansZone = -1;
  }
  const r = rangSlotDe(slot.slot);
  assert.ok(r >= dernierSlotDansZone, "dans une même zone, les pièces suivent weapon/head/chest/legs/boots puis accessoires : " + slot.definitionId);
  dernierSlotDansZone = r;
}

// Concrètement : la première zone équipée (Zone Tutoriel, set "training") arrive avant les Égouts (set "sewers").
const training = slots.filter((x) => x.set === "training").map((x) => x.definitionId);
const sewers = slots.filter((x) => x.set === "sewers").map((x) => x.definitionId);
assert.ok(training.length > 0 && sewers.length > 0, "les deux sets attendus sont bien présents");
assert.ok(slots.indexOf(slots.find((x) => x.definitionId === training[training.length - 1])) < slots.indexOf(slots.find((x) => x.definitionId === sewers[0])), "Zone Tutoriel avant Égouts");

// À l'intérieur d'un même set, l'arme précède la tête (rang de pièce), et rien n'est jamais dupliqué.
const weaponTraining = slots.findIndex((x) => x.set === "training" && x.slot === "weapon");
const headTraining = slots.findIndex((x) => x.set === "training" && x.slot === "head");
assert.ok(weaponTraining >= 0 && headTraining >= 0 && weaponTraining < headTraining, "arme avant tête, même set");
assert.equal(new Set(slots.map((x) => x.definitionId)).size, slots.length, "aucune case en double");

console.log("idle-coffre-tri-zone-piece-v1: OK");
