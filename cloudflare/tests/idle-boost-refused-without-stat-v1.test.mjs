import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-24) : « Mon épée qui n'a pas de stats Toughness accepte les boosts. Ils me sont ensuite rendus. Il ne doit les accepter
 * QUE s'il a des stats Toughness non remplies. » Le serveur refusait déjà, mais le client consommait le boost avant la réponse.
 */
// --- Serveur : une épée d'égouts (Power 20, Toughness 0) refuse un boost de Toughness, le boost reste dans le sac ---
{
  let s = normalizeIdleAdventureStateV47({});
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "sewers:weapon", level: 0 }, { bosses: 100 }, 1).state;
  const epee = s.inventory.find((x) => x.definitionId === "sewers:weapon");
  s.inventory.push({ id: "bt", definitionId: "boost:toughness:10", name: "Boost toughness", kind: "boost", boostType: "toughness", strength: 10, level: 0 });
  s.inventory.push({ id: "bp", definitionId: "boost:power:1", name: "Boost power", kind: "boost", boostType: "power", strength: 1, level: 0 });
  assert.throws(() => applyIdleAdventureActionV47(s, { action: "boost", boostId: "bt", targetId: epee.id }, { bosses: 100 }, 1), /BOOST_STAT_DEJA_MAX/);
  assert.ok(s.inventory.some((x) => x.id === "bt"), "le boost n'est pas consommé");
  const ok = applyIdleAdventureActionV47(s, { action: "boost", boostId: "bp", targetId: epee.id }, { bosses: 100 }, 1).state;
  assert.ok(!ok.inventory.some((x) => x.id === "bp"), "le boost de Power (stat non remplie) est accepté");
}

// --- Client : refus AVANT d'envoyer quoi que ce soit ---
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function boosterObjetParIdAdventureIdleV47_(boostId,cibleId){");
const fin = ui.indexOf("function deposerSurCubeAdventureIdleV138_(event){");
const src = ui.slice(debut, fin);
const nombre = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
function essayer(cible, typeBoost) {
  const envoyes = [];
  const toasts = [];
  const items = [{ id: "b", kind: "boost", boostType: typeBoost }, Object.assign({ id: "c" }, cible)];
  const f = new Function("aventureMetaIdleV47_", "idleEtat", "idleNombre_", "toastIdleV5_", "actionAdventureIdleV47_",
    src + "\nreturn boosterObjetParIdAdventureIdleV47_;")(() => ({ inventory: items }), {}, nombre, (t) => toasts.push(t), (p) => envoyes.push(p));
  f("b", "c");
  return { envoyes, toasts };
}
{
  const epee = { kind: "equipment", level: 0, basePower: 20, baseToughness: 0, baseSpecial: 0, power: 2, toughness: 0, special: 0 };
  let r = essayer(epee, "toughness");
  assert.equal(r.envoyes.length, 0, "aucune action envoyée : le boost n'est pas consommé");
  assert.match(r.toasts[0], /pas de statistique Toughness/);
  r = essayer(epee, "power");
  assert.equal(r.envoyes.length, 1, "Power non rempli : accepté");
  r = essayer(Object.assign({}, epee, { power: 20 }), "power");
  assert.equal(r.envoyes.length, 0);
  assert.match(r.toasts[0], /déjà au maximum/);
  r = essayer(Object.assign({}, epee, { baseToughness: 80 }), "toughness");
  assert.equal(r.envoyes.length, 1, "Toughness présente et non remplie : accepté");
}
assert.match(ui, /if\(target\.fullyMaxed\|\|cap<=1e-9\|\|\(specialsRestants===null\?actuel>=cap-1e-9:!specialsRestants\)\)return false;/, "pas d'application optimiste sans statistique (ni quand tous les Specials sont pleins)");

console.log("idle-boost-refused-without-stat-v1: OK");
