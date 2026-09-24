import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * 2026-09-24 : action rapide de l'inventaire, comme NGU Idle.
 * - PC : clic droit sur un objet du sac -> équipe ; si une pièce identique est déjà équipée -> fusion dans la pièce équipée.
 * - Téléphone : double tap rapide = même action.
 */
const ui = fs.readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
const longPress = fs.readFileSync(new URL("../public/modules/long-press-v200.js", import.meta.url), "utf8");

// --- Logique de l'action rapide, exécutée avec des doubles ---
const debut = ui.indexOf("function actionRapideObjetAdventureIdleV209_(id){");
const fin = ui.indexOf("function executerTapObjetAdventureIdleV196_(element,id){");
assert.ok(debut > 0 && fin > debut, "actionRapideObjetAdventureIdleV209_ doit exister");
const source = ui.slice(debut, fin);

function lancer(etat) {
  const appels = [];
  const contexte = {
    idleEtat: etat,
    ADVENTURE_CORE_SLOTS_V138: ["head", "chest", "legs", "boots", "weapon"],
    aventureMetaIdleV47_: e => e.aventure,
    nettoyerEtatDragAdventureIdleV138_: () => appels.push(["nettoyer"]),
    appliquerActionSlotAdventureIdleV138_: (a, b) => appels.push(["fusion-ou-slot", a, b]),
    equiperParIdAdventureIdleV138_: a => appels.push(["equiper", a]),
    String, Array
  };
  const fn = vm.runInNewContext("(function(){" + source + "; return actionRapideObjetAdventureIdleV209_;})()", contexte);
  return { fn, appels };
}
const item = (id, definitionId, extra = {}) => ({ id, definitionId, kind: "equipment", slot: "head", ...extra });

{
  // Pas de pièce identique équipée -> équipement
  const etat = { aventure: { inventory: [item("a", "hat"), item("b", "cap")], equipment: { head: "b", accessories: [] } } };
  const { fn, appels } = lancer(etat);
  assert.equal(fn("a"), true);
  assert.deepEqual(appels.filter(x => x[0] !== "nettoyer"), [["equiper", "a"]]);
}
{
  // Pièce identique équipée -> fusion dans la pièce équipée (décision de slot)
  const etat = { aventure: { inventory: [item("a", "hat"), item("b", "hat")], equipment: { head: "b", accessories: [] } } };
  const { fn, appels } = lancer(etat);
  assert.equal(fn("a"), true);
  assert.deepEqual(appels.filter(x => x[0] !== "nettoyer"), [["fusion-ou-slot", "a", "b"]]);
}
{
  // Accessoire identique déjà équipé
  const etat = { aventure: { inventory: [item("a", "ring", { slot: "accessory" }), item("b", "ring", { slot: "accessory" })], equipment: { accessories: ["b"] } } };
  const { fn, appels } = lancer(etat);
  assert.equal(fn("a"), true);
  assert.deepEqual(appels.filter(x => x[0] !== "nettoyer"), [["fusion-ou-slot", "a", "b"]]);
}
{
  // Boost : rien (l'appelant retombe sur le comportement d'avant) ; objet déjà équipé : rien ; id inconnu : rien
  const etat = { aventure: { inventory: [item("x", "boost1", { kind: "boost" }), item("b", "hat")], equipment: { head: "b", accessories: [] } } };
  const { fn, appels } = lancer(etat);
  assert.equal(fn("x"), false);
  assert.equal(fn("b"), false);
  assert.equal(fn("zzz"), false);
  assert.equal(appels.length, 0);
}

// --- Câblage : clic droit souris + double tap tactile ---
assert.match(ui, /document\.addEventListener\('contextmenu',function\(event\)\{[\s\S]*?event\.pointerType==='mouse'[\s\S]*?actionRapideObjetAdventureIdleV209_\(/, "le clic droit souris déclenche l'action rapide");
assert.match(ui, /if\(estDoubleTapGesteAdventureIdleV196_\(id,pointerType\)\)\{[\s\S]*?actionRapideObjetAdventureIdleV209_\(id\)[\s\S]*?ouvrirDetailsObjetParGesteAdventureIdleV196_\(id\)/, "double tap : action rapide, sinon détails");

// --- Le composant de maintien long ignore le clic droit de la souris (sinon il ouvrirait le popup de détails) ---
function chargerLongPress() {
  const gestionnaires = {};
  const evenements = [];
  const document = {
    addEventListener: (type, fn) => { (gestionnaires[type] ||= []).push(fn); },
    dispatchEvent: e => { evenements.push(e); return true; },
    hidden: false
  };
  const window = { addEventListener() {}, setTimeout, clearTimeout };
  const ctx = { window, document, Date, Math, setTimeout, clearTimeout, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }, console };
  vm.runInNewContext(longPress, ctx);
  return { gestionnaires, evenements, window };
}
{
  const { gestionnaires, evenements } = chargerLongPress();
  const cible = { closest: sel => (sel === "[data-soreal-longpress]" ? cible : null), dispatchEvent: e => { evenements.push(e); return true; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 }) };
  let empeche = 0;
  const contextmenu = gestionnaires.contextmenu[0];
  contextmenu({ target: cible, pointerType: "mouse", preventDefault: () => { empeche++; } });
  assert.equal(empeche, 1, "le menu natif reste bloqué");
  assert.equal(evenements.length, 0, "clic droit souris : aucun événement de maintien long");
  contextmenu({ target: cible, pointerType: "touch", preventDefault: () => { empeche++; } });
  assert.equal(evenements.filter(e => e.type === "soreal-longpress").length, 1, "contextmenu tactile : reste un signal de maintien long");
}

console.log("idle-inventory-quick-action-v209: OK");
