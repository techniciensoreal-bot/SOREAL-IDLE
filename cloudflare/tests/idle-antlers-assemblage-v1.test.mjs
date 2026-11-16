import assert from "node:assert/strict";
import { neuf, agir, ajouter } from "./_antlers-aide.mjs";
import { inventoryCapacityAdventureV1 } from "../src/idle-adventure-inventaire.js";

/*
 * Assemblage de l'Exilé : ItemController::consumeItem (méthode 3794, objets 336 à 341) + InventoryController::exileAssembled / exileSpecialAssembled
 * (méthodes 3770 et 3771, build 1260) : zone « 1 » du jeu = Égouts, sac d'au moins 24 cases, cases 0 = Antennes (340), 1 = Visage (336), 2 = Bois (338),
 * 12 = Buster (339), 14 = Tentacule (337) ; la case 13 = Sac (341) pour la version spéciale. Rien n'est consommé.
 */
const PLACES = { exileClueAntennae: 0, faceExile: 1, exileClueAntlers: 2, exileClueBuster: 12, exileClueTentacle: 14 };

function placer(s, definitionId, index) {
  const a = ajouter(s, definitionId);
  s = agir(a.s, { action: "reorderInventory", sourceId: a.o.id, targetIndex: index }).state;
  return { s, id: a.o.id };
}
function monter({ sauf, sac = false, zone = "sewers", flags = {} } = {}) {
  let s = neuf();
  s.selectedZone = zone;
  Object.assign(s.unlockFlags, flags);
  const ids = {};
  for (const [def, i] of Object.entries(PLACES)) {
    if (def === sauf) continue;
    const r = placer(s, def, i);
    s = r.s;
    ids[def] = r.id;
  }
  if (sac) { const r = placer(s, "sackExile", 13); s = r.s; ids.sackExile = r.id; }
  return { s, ids };
}
const utiliser = (s, id) => agir(s, { action: "assembleExile", itemId: id }).result;

assert.ok(inventoryCapacityAdventureV1(neuf()) >= 24, "le sac de départ a au moins 24 cases");

/* Première assemblée : l'Exilé est débloqué, aucune pièce n'est consommée. */
{
  const { s, ids } = monter();
  assert.equal(s.unlockFlags.titan9Unlocked, undefined);
  const avant = s.inventory.length;
  const r = agir(s, { action: "assembleExile", itemId: ids.faceExile });
  assert.deepEqual(r.result, { assemble: true, special: false, debloque: true, recompenseSpeciale: false });
  assert.equal(r.state.unlockFlags.titan9Unlocked, true);
  assert.equal(r.state.inventory.length, avant, "rien n'est consommé");
  /* Deuxième utilisation : simple message, rien ne change. */
  const r2 = agir(r.state, { action: "assembleExile", itemId: ids.faceExile });
  assert.deepEqual(r2.result, { assemble: true, special: false, debloque: false, recompenseSpeciale: false });
  assert.equal(r2.state.unlockFlags.titan9SpecialReward, undefined);
}
/* Chaque pièce manquante, une mauvaise case, une autre zone : rien. */
for (const def of Object.keys(PLACES)) {
  const { s, ids } = monter({ sauf: def });
  const piece = Object.entries(ids)[0][1];
  const r = agir(s, { action: "assembleExile", itemId: piece });
  assert.equal(r.result.assemble, false, "sans " + def);
  assert.equal(r.state.unlockFlags.titan9Unlocked, undefined);
}
{
  const { s, ids } = monter({ zone: "tutorial" });
  assert.equal(utiliser(s, ids.faceExile).assemble, false, "mauvaise zone (Tutoriel)");
  const m = monter({ zone: "mega" });
  assert.equal(utiliser(m.s, m.ids.faceExile).assemble, false, "mauvaise zone (Mégaterres)");
}
{
  /* pièces dans de mauvaises cases : Visage échangé avec Bois */
  let { s, ids } = monter();
  s = agir(s, { action: "reorderInventory", sourceId: ids.faceExile, targetIndex: 2 }).state;
  assert.equal(utiliser(s, ids.faceExile).assemble, false);
}
/* Un objet qui n'est pas une pièce ne s'assemble pas. */
{
  const { s } = monter();
  const a = ajouter(s, "sealExile");
  assert.throws(() => utiliser(a.s, a.o.id), /OBJET_NON_ASSEMBLABLE/);
  assert.throws(() => utiliser(s, "inconnu"), /OBJET_INTROUVABLE/);
}
/* Version spéciale : avec le Sac à la case 13. Exilé pas encore débloqué : rien ; débloqué : titan9SpecialReward. */
{
  const m = monter({ sac: true });
  const r = agir(m.s, { action: "assembleExile", itemId: m.ids.sackExile });
  assert.deepEqual(r.result, { assemble: true, special: true, debloque: false, recompenseSpeciale: false });
  assert.equal(r.state.unlockFlags.titan9Unlocked, undefined, "avec le Sac et sans déblocage : rien");
  assert.equal(r.state.unlockFlags.titan9SpecialReward, undefined);
  const n = monter({ sac: true, flags: { titan9Unlocked: true } });
  const r2 = agir(n.s, { action: "assembleExile", itemId: n.ids.sackExile });
  assert.deepEqual(r2.result, { assemble: true, special: true, debloque: false, recompenseSpeciale: true });
  assert.equal(r2.state.unlockFlags.titan9SpecialReward, true);
  assert.equal(r2.state.inventory.length, n.s.inventory.length);
}
console.log("ok");
