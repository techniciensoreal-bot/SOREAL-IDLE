import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « pour que l'achat serve aussi sur PC avec Double tap et Triple tap : un premier clic droit absorbe les items identiques, et quand aucune pièce n'est disponible, il absorbe les boosts ;
 * dans l'inventaire ou équipé ; et il faut le signaler à ceux qui achètent. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const debut = ui.indexOf("      function gestesAchetesIdleV1_(){");
const fin = ui.indexOf("      function executerTapObjetAdventureIdleV196_(element,id){");
assert.ok(debut > 0 && fin > debut);
const envois = []; const messages = [];
function monde(unlocked, items, equipment) {
  const a = { inventory: items, equipment: equipment || {} };
  const idleEtat = { systemes: { inventoryAuto: { unlocked } } };
  const f = new Function("Date", "idleEtat", "IDLE_ADVENTURE_DOUBLE_TAP_MS_V196", "idleEntier_", "aventureMetaIdleV47_", "ADVENTURE_CORE_SLOTS_V138", "messageFlottantIdleV32_", "nettoyerEtatDragAdventureIdleV138_", "deblocageParObjetIdleV1_", "window",
    ui.slice(debut, fin) + "\nreturn clicDroitGestesAchetesIdleV1_;");
  return f({ now: () => 1 }, idleEtat, 420, (v) => Math.max(0, Math.floor(Number(v) || 0)), () => a, ["head", "chest", "legs", "boots", "weapon", "weapon2"], (m) => messages.push(m), () => {}, () => null, { __actionMetaV47__: (p) => envois.push(p) });
}
const sac = [
  { id: "a", definitionId: "x:head", kind: "set", level: 3 }, { id: "b", definitionId: "x:head", kind: "set", level: 1 },
  { id: "e", definitionId: "y:legs", kind: "set", level: 1 }, { id: "p", definitionId: "boost:p", kind: "boost" }
];
const dernier = () => envois.pop();

// Rien d'acheté : le clic droit garde l'ancienne action rapide (la fonction rend false).
assert.equal(monde({ doubleTap: false, tripleTap: false }, sac)("a"), false);
assert.equal(envois.length, 0);
// Les deux achats : d'abord la fusion avec les pièces identiques (objet du sac comme équipé), puis les boosts quand il n'y en a plus.
{
  const c = monde({ doubleTap: true, tripleTap: true }, sac);
  assert.equal(c("a"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "mergeAll", itemId: "a" }, "pièces identiques disponibles : fusion");
  assert.equal(c("e"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "boostAll", targetId: "e" }, "aucune pièce identique : boosts");
  const equipe = monde({ doubleTap: true, tripleTap: true }, sac, { head: "a" });
  assert.equal(equipe("a"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "mergeAll", itemId: "a" }, "pièce ÉQUIPÉE : fusion aussi");
  assert.equal(equipe("e"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "boostAll", targetId: "e" });
  // Une pièce identique déjà équipée n'est pas une pièce « disponible ».
  const jumelleEquipee = monde({ doubleTap: true, tripleTap: true }, sac, { head: "b" });
  assert.equal(jumelleEquipee("a"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "boostAll", targetId: "a" }, "la seule jumelle est équipée : boosts");
  // Boost (Norman, 2026-10-10) : le clic droit absorbe tous les boosts de même chiffre et de même couleur (même définition), jusqu'au niveau 100 ; seul, il prévient.
  assert.equal(c("p"), true); assert.equal(messages.pop(), "Aucun boost identique à fusionner avec celui-ci."); assert.equal(envois.length, 0, "un boost seul ne part pas au serveur");
  const sacBoosts = sac.concat([{ id: "p2", definitionId: "boost:p", kind: "boost" }, { id: "q", definitionId: "boost:q", kind: "boost" }, { id: "p3", definitionId: "boost:p", kind: "boost", level: 100 }, { id: "p4", definitionId: "boost:p", kind: "boost", locked: true }]);
  const cb = monde({ doubleTap: true, tripleTap: true }, sacBoosts);
  assert.equal(cb("p"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "mergeAll", itemId: "p" }, "boosts identiques : fusion");
  assert.equal(cb("q"), true); assert.equal(messages.pop(), "Aucun boost identique à fusionner avec celui-ci.", "un autre chiffre ou une autre couleur ne compte pas");
}
// Double tap seul : toujours les boosts ; Triple tap seul : fusion, sinon l'ancienne action rapide.
assert.equal(monde({ doubleTap: true }, sac)("a"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "boostAll", targetId: "a" });
{
  const t = monde({ tripleTap: true }, sac);
  assert.equal(t("a"), true); assert.deepEqual(dernier(), { action: "inventoryAuto", mode: "mergeAll", itemId: "a" });
  assert.equal(t("e"), false, "rien à fusionner et pas de Double tap : ancienne action rapide");
}
assert.equal(envois.length, 0);

// Câblage : le clic droit passe par cette décision, y compris sur une pièce équipée (plus seulement les cartes du sac) ; l'ancienne action rapide reste le repli.
assert.ok(ui.includes("if(clicDroitGestesAchetesIdleV1_(idObjet))return;\n          if(!element.classList.contains('soreal-idle-v138-bag-card'))return;\n          actionRapideObjetAdventureIdleV209_(idObjet);"));

// Signalé à ceux qui achètent : explication des deux cartes de la boutique EXP et indice du sac.
assert.ok(/doubleTap:'[^']*Sur PC : clic droit sur l’objet \(au sac ou équipé\)[^']*fusionne d’abord les pièces identiques, puis absorbe les boosts/.test(meta), "carte Double tap");
assert.ok(/tripleTap:'[^']*Sur PC : clic droit sur l’objet \(au sac ou équipé\)[^']*absorbe les boosts/.test(meta), "carte Triple tap");
assert.ok(ui.includes("Sur PC, clic droit sur un objet du sac ou équipé : "), "indice du sac pour les acheteurs");
console.log("idle-clic-droit-gestes-achetes-v1: OK");
