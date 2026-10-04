import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-04) : « retire la fonction double tap / triple tap de base pour les joueurs ; dans le Shop, au rayon Aventure, un achat pour 20 EXP : Double tap pour qu'un objet absorbe tous les boosts de
 * l'inventaire, et pour 30 EXP : Triple tap pour fusionner automatiquement avec les pièces disponibles. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// 1. Serveur : deux achats (20 et 30 EXP), à vie, qui lèvent les drapeaux du bloc inventoryAuto.unlocked.
{
  const ctx = { bosses: 100 };
  const s = normalizeIdleNguState({}, ctx, 0);
  s.currencies.experience = 100;
  const avant = idleNguSnapshot(s, ctx, 0);
  assert.equal(avant.inventoryAuto.unlocked.doubleTap, false, "pas de double tap de base");
  assert.equal(avant.inventoryAuto.unlocked.tripleTap, false, "pas de triple tap de base");
  assert.deepEqual(avant.expShop.filter((x) => x.id === "doubleTap" || x.id === "tripleTap").map((x) => [x.id, x.nextCost, x.max]), [["doubleTap", 20, 1], ["tripleTap", 30, 1]]);
  let r = applyIdleNguAction(s, { action: "buyExpShop", item: "doubleTap" }, ctx, 1000);
  assert.equal(r.state.currencies.experience, 80);
  r = applyIdleNguAction(r.state, { action: "buyExpShop", item: "tripleTap" }, ctx, 2000);
  assert.equal(r.state.currencies.experience, 50);
  const apres = idleNguSnapshot(r.state, ctx, 3000);
  assert.equal(apres.inventoryAuto.unlocked.doubleTap, true);
  assert.equal(apres.inventoryAuto.unlocked.tripleTap, true);
  assert.throws(() => applyIdleNguAction(r.state, { action: "buyExpShop", item: "doubleTap" }, ctx, 4000), /ACHAT_AU_MAXIMUM/, "achat unique");
  // Pas assez d'EXP : refusé, rien n'est débloqué.
  const pauvre = normalizeIdleNguState({}, ctx, 0); pauvre.currencies.experience = 19;
  assert.throws(() => applyIdleNguAction(pauvre, { action: "buyExpShop", item: "doubleTap" }, ctx, 1000), /EXP_INSUFFISANT/);
}

// 2. Boutique EXP : les deux cartes sont dans le rayon « Aventure », nommées et expliquées, et nulle part ailleurs.
assert.ok(meta.includes("const IDLE_EXP_GESTES_V1=['doubleTap','tripleTap'];"));
assert.ok(meta.includes("IDLE_EXP_STATS_AVENTURE_V1.concat(IDLE_EXP_GESTES_V1).map(parId)"), "dans le rayon Aventure");
assert.equal(meta.split("IDLE_EXP_GESTES_V1.indexOf(it.id)===-1").length - 1, 3, "exclues du rayon « Slots & options » (page, liste des rayons, points rouges)");
assert.ok(meta.includes("doubleTap:'👆 Double tap',tripleTap:'👆 Triple tap'") && meta.includes("doubleTap:'adventure',tripleTap:'adventure'"), "noms, et visibles seulement avec l'Aventure (anti-spoil)");
assert.ok(/doubleTap:'Appuie deux fois vite sur un objet[^']*absorbe tous les boosts/.test(meta) && /tripleTap:'Appuie trois fois vite[^']*fusionne automatiquement/.test(meta), "explications courtes");

// 3. Client : sans achat chaque appui reste simple ; le double tap absorbe les boosts (équipé ou non), le triple tap fusionne ; le double tap attend le 3e appui si le triple tap est acheté.
const debut = ui.indexOf("      function gestesAchetesIdleV1_(){");
const fin = ui.indexOf("      function estDoubleTapGesteAdventureIdleV196_(id,pointerType){");
assert.ok(debut > 0 && fin > debut);
let maintenant = 1_000_000;
const messages = []; const envois = [];
let etat = { systemes: { inventoryAuto: { unlocked: { doubleTap: false, tripleTap: false } } } };
const items = [
  { id: "a", definitionId: "x:head", kind: "set", level: 3 }, { id: "b", definitionId: "x:head", kind: "set", level: 1 }, { id: "c", definitionId: "x:head", kind: "set", level: 2, locked: true },
  { id: "d", definitionId: "x:head", kind: "set", level: 100 }, { id: "f", definitionId: "x:head", kind: "set", level: 2 }, { id: "e", definitionId: "y:legs", kind: "set", level: 1 }, { id: "p", definitionId: "boost:p", kind: "boost" }
];
const fabrique = new Function("Date", "idleEtat", "IDLE_ADVENTURE_DOUBLE_TAP_MS_V196", "idleEntier_", "aventureMetaIdleV47_", "ADVENTURE_CORE_SLOTS_V138", "messageFlottantIdleV32_", "nettoyerEtatDragAdventureIdleV138_", "window",
  ui.slice(debut, fin) + "\nreturn {gestes:gestesAchetesIdleV1_,compter:compterTapsObjetIdleV1_,fusionner:fusionnerAutoObjetIdleV1_};");
const a0 = { inventory: items, equipment: { head: "a" } };
const o = fabrique({ now: () => maintenant }, null, 420, (v) => Math.max(0, Math.floor(Number(v) || 0)), () => a0, ["head", "chest", "legs", "boots", "weapon", "weapon2"], (m) => messages.push(m), () => {}, { __actionMetaV47__: (p) => envois.push(p) });
const avecEtat = (e) => fabrique({ now: () => maintenant }, e, 420, (v) => Math.max(0, Math.floor(Number(v) || 0)), () => a0, ["head", "chest", "legs", "boots", "weapon", "weapon2"], (m) => messages.push(m), () => {}, { __actionMetaV47__: (p) => envois.push(p) });

// Drapeaux lus depuis le serveur.
assert.deepEqual(avecEtat(etat).gestes(), { double: false, triple: false });
assert.deepEqual(avecEtat({ systemes: { inventoryAuto: { unlocked: { doubleTap: true, tripleTap: true } } } }).gestes(), { double: true, triple: true });
assert.deepEqual(avecEtat(null).gestes(), { double: false, triple: false }, "jamais de plantage sans état");

// Comptage des appuis rapides : même objet, moins de 420 ms entre deux ; la souris ne compte jamais.
{
  const c = avecEtat(etat).compter;
  assert.equal(c("a", "touch"), 1); maintenant += 200; assert.equal(c("a", "touch"), 2); maintenant += 200; assert.equal(c("a", "touch"), 3);
  maintenant += 100; assert.equal(c("a", "touch"), 1, "après 3 appuis le compteur repart");
  maintenant += 500; assert.equal(c("a", "touch"), 1, "trop lent : un nouvel appui simple");
  maintenant += 100; assert.equal(c("b", "touch"), 1, "autre objet : repart de 1");
  assert.equal(c("b", "mouse"), 1); assert.equal(c("b", "mouse"), 1, "la souris ne fait jamais de double tap");
}
// Triple tap : fusion avec les pièces identiques du sac (jamais verrouillées, équipées ou au niveau 100) ; prévient s'il n'y en a pas.
{
  const f = avecEtat({ systemes: { inventoryAuto: { unlocked: { tripleTap: true } } } }).fusionner;
  assert.equal(f("b"), true);
  assert.deepEqual(envois.pop(), { action: "inventoryAuto", mode: "mergeAll", itemId: "b" }, "b se fusionne avec les pièces disponibles");
  messages.length = 0;
  assert.equal(f("e"), true); assert.equal(envois.length, 0, "aucune pièce identique : rien d'envoyé");
  assert.ok(messages[0] && /Aucune pièce identique/.test(messages[0]));
  assert.equal(f("p"), false, "un boost ne se fusionne pas");
  assert.equal(f("d"), true); assert.equal(envois.length, 0, "niveau 100 : rien à fusionner");
  // Un objet ÉQUIPÉ se fusionne aussi avec les pièces du sac (ici « a » est équipé).
  assert.equal(f("a"), true);
  assert.deepEqual(envois.pop(), { action: "inventoryAuto", mode: "mergeAll", itemId: "a" }, "l'objet équipé aussi");
}

// 4. Aiguillage dans le geste : plus de double tap de base, double tap -> boosts, triple tap -> fusion, double tap différé si le triple tap est acheté.
assert.ok(ui.includes("const nTaps=compterTapsObjetIdleV1_(id,pointerType);") && ui.includes("if(nTaps>=3&&gestes.triple){") && ui.includes("fusionnerAutoObjetIdleV1_(id);"));
assert.ok(ui.includes("if(nTaps===2&&gestes.double){") && ui.includes("setTimeout(function(){boosterObjetEquipeAdventureIdleV1_(id);},IDLE_ADVENTURE_DOUBLE_TAP_MS_V196+30)"), "double tap différé quand le triple tap existe");
assert.ok(!ui.includes("actionRapideObjetAdventureIdleV209_(id)\n          ){\n            return;"), "l'ancien double tap équiper/fusionner de base est retiré");
assert.ok(ui.includes("if(!gestesAchetesIdleV1_().double){\n            afficherDetailsCubeInfiniAdventureIdleV220_();"), "le Cube : détails seuls sans l'achat");
// Le clic droit de la souris (action rapide) et « A + clic » restent.
assert.ok(ui.includes("actionRapideObjetAdventureIdleV209_(") && ui.includes("Clic droit de la souris (PC) sur un objet du sac : action rapide équiper / fusionner"));
console.log("idle-gestes-double-triple-tap-v1: OK");
