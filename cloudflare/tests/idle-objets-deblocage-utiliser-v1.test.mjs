import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSpecialItemV1, idleAdventureAddItemV1, idleAdventureItemAtLevelV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-04) : « dans le jeu de base, c'est en utilisant un objet, pas avec un menu du genre (Objets de déblocage → Utiliser) ». Wiki « A Number » : « consume it by CTRL + Left Click on it to permanently
 * unlock NGU » ; « A Scrap of Paper » : « First time you Ctrl + Click it to unlock Gold Diggers » ; « A busted copy of Wandoos 98 » : « CTRL + Click to permanently unlock Wandoos 98 ».
 */
const ctx = { bosses: 300, stats: { power: 10, toughness: 10, hp: 500 } };
const agir = (s, p) => applyIdleAdventureActionV47(s, p, ctx, 1_000_000);
const avecObjet = (fabrique) => { const s = normalizeIdleAdventureStateV47({}); const o = fabrique(); idleAdventureAddItemV1(s, o); return { s, id: o.id }; };

const cas = [
  ["aNumber", "ngu", () => idleAdventureSpecialItemV1("aNumber", 0), "aNumber"],
  ["giantSeed", "yggdrasil", () => idleAdventureSpecialItemV1("giantSeed", 0), "giantSeed"],
  ["uugHair", "beards", () => idleAdventureSpecialItemV1("uugHair", 0), "uugHair"],
  ["wandoos98", "wandoos", () => idleAdventureSpecialItemV1("wandoos98", 0), "wandoos98"],
  ["scrap:paper", "diggers", () => idleAdventureItemAtLevelV47("scrap:paper", 0, "papier"), "scrapPaper"]
];
for (const [definitionId, flag, fabrique, cle] of cas) {
  const { s, id } = avecObjet(fabrique);
  assert.equal(s.unlockFlags[flag] === true, false, flag + " verrouillé au départ");
  s.unlockItems[cle] = true; // le premier kill pose aussi l'ancien drapeau
  const r = agir(s, { action: "useUnlockItem", itemId: id });
  assert.equal(r.state.unlockFlags[flag], true, flag + " débloqué par l'objet");
  assert.equal(r.state.inventory.some((o) => o.id === id), false, "l'objet est consommé : il quitte le sac");
  assert.equal(r.state.unlockItems[cle], false, "l'ancien drapeau ne laisse pas un 2e déblocage");
  assert.equal(r.result.flag, flag);
  assert.throws(() => agir(r.state, { action: "useUnlockItem", itemId: id }), /OBJET_INTROUVABLE/, "un objet n'est utilisable qu'une fois");
}
// Système déjà débloqué : une 2e copie n'est pas consommée par ce chemin (Wandoos : niveaux d'OS ; Giant Seed : graines).
{
  const { s, id } = avecObjet(() => idleAdventureSpecialItemV1("aNumber", 0));
  s.unlockFlags.ngu = true;
  assert.throws(() => agir(s, { action: "useUnlockItem", itemId: id }), /SYSTEME_DEJA_DEBLOQUE/);
  assert.ok(s.inventory.some((o) => o.id === id), "l'objet reste dans le sac");
}
// Un objet qui n'est pas un objet de déblocage est refusé.
{
  const { s, id } = avecObjet(() => idleAdventureItemAtLevelV47("sewers:head", 0, "casque"));
  assert.throws(() => agir(s, { action: "useUnlockItem", itemId: id }), /OBJET_NON_DEBLOCAGE/);
  assert.throws(() => agir(s, { action: "useUnlockItem", itemId: "inconnu" }), /OBJET_INTROUVABLE/);
}

// Client : bouton « Utiliser » sur la fiche (système verrouillé), clic droit, et plus de menu « Objets de déblocage » sauf secours.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const IDLE_UNLOCK_PAR_OBJET_V1={aNumber:{cle:'aNumber',flag:'ngu'") && ui.includes("'scrap:paper':{cle:'scrapPaper',flag:'diggers'"), "mêmes correspondances que le serveur");
assert.ok(ui.includes("🔓 Utiliser</button>") && ui.includes("window.__utiliserObjetDeblocageIdleV1__(") && ui.includes("action:'useUnlockItem',itemId:String(id||'')"));
assert.ok(ui.includes("            boutonVerrouiller+\n            boutonDebloquer+\n            boutonConsommer+"), "le bouton est sur la fiche de l'objet");
assert.ok(ui.includes("if(deblocageParObjetIdleV1_(a,item)){\n          nettoyerEtatDragAdventureIdleV138_();\n          utiliserObjetDeblocageIdleV1_(objet);"), "clic droit : utilise l'objet");
assert.ok(ui.includes("(item.definitionId==='wandoos98'&&!deblocageObjet)") && ui.includes("item.definitionId==='giantSeed'&&!item.locked&&!deblocageObjet"), "Wandoos / Graine : usages d'après-déblocage seulement une fois le système débloqué");
// Menu de secours : seulement pour un déblocage dont l'objet réel n'est plus dans le sac.
{
  const debut = ui.indexOf("      const IDLE_UNLOCK_PAR_OBJET_V1=");
  const fin = ui.indexOf("      function utiliserObjetDeblocageIdleV1_(id){");
  const o = new Function("IDLE_ADVENTURE_UNLOCK_ITEMS_V1", ui.slice(debut, fin) + "\nreturn {dispo:objetsDeblocageDisponiblesAdventureIdleV1_,deblocage:deblocageParObjetIdleV1_};")({ aNumber: {}, wandoos98: {}, uugHair: {} });
  const a = { unlockItems: { aNumber: true, wandoos98: true, uugHair: false }, inventory: [{ id: "x", definitionId: "aNumber" }], unlockFlags: {} };
  assert.deepEqual(o.dispo(a), ["wandoos98"], "A Number est dans le sac : pas de menu ; Wandoos 98 manque au sac : secours");
  assert.equal(o.deblocage(a, a.inventory[0]).flag, "ngu");
  assert.equal(o.deblocage({ unlockFlags: { ngu: true } }, a.inventory[0]), null, "système débloqué : plus de bouton « Utiliser »");
}
console.log("idle-objets-deblocage-utiliser-v1: OK");
