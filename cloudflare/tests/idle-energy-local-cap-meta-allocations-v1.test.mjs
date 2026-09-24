import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : « Quand tous mes points sont générés et que j'en place dans Augmentation, le compteur continue à générer des
 * points et retombe à 0 quand il arrive aux alentours de 17-20. Il recommence sans arrêt. »
 * Le serveur ne laisse à l'énergie libre que Cap - (Basic Training + tous les systèmes qui en retiennent) ; le client ne retirait que
 * Basic Training : il « générait » localement jusqu'à la synchronisation suivante, qui ramenait la valeur du serveur.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- La somme des allocations d'énergie de tous les systèmes (comme totalAllocated du moteur) ---
const debut = ui.indexOf("function allocationMetaEnergieIdleV1_(){");
const fin = ui.indexOf("function capBasicTrainingLocalIdleV120_(skill){");
assert.ok(debut > 0 && fin > debut);
const fabrique = new Function("idleEtat", "idleNombre_", ui.slice(debut, fin) + "\nreturn allocationMetaEnergieIdleV1_;");
const nombre = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const somme = (etat) => fabrique(etat, nombre)();
assert.equal(somme(null), 0);
assert.equal(somme({}), 0);
assert.equal(somme({ systemes: { systems: [] } }), 0);
assert.equal(somme({ systemes: { systems: [
  { id: "augmentations", state: { allocation: { energy: 300, magic: 0 } } },
  { id: "ngu", state: { allocation: { energy: 120 } } },
  { id: "bloodMagic", state: { allocation: { magic: 50 } } },
  { id: "timeMachine", state: {} },
  { id: "x", state: { allocation: { energy: -5 } } }
] } }), 420, "somme des allocations d'énergie, négatives ignorées");

// --- Les trois endroits qui bornent l'énergie libre côté client la retirent du Cap ---
const local = ui.slice(ui.indexOf("function mettreAJourJeuIdleLocalV7_(){"), ui.indexOf("const metaTickEnergie=", ui.indexOf("function mettreAJourJeuIdleLocalV7_(){")));
assert.match(local, /maxTotal-\s*totalAllocationBasicTrainingIdleV120_\(\)-\s*allocationMetaEnergieIdleV1_\(\)/, "génération locale d'énergie");
const ajuster = ui.slice(ui.indexOf("function ajusterBasicTrainingIdleV120_("), ui.indexOf("function ", ui.indexOf("function ajusterBasicTrainingIdleV120_(") + 10));
assert.match(ajuster, /totalAllocationBasicTrainingIdleV120_\(\)-\s*allocationMetaEnergieIdleV1_\(\)/, "placement d'énergie dans Basic Training");
assert.match(ui, /idleEntier_\(\s*idleEtat\.energieMax\s*\)-\s*allocationMetaEnergieIdleV1_\(\)\s*\),\s*idleEntier_\(\s*idleEtat\.energie\s*\)\+\s*rendu/, "« Tout retirer » de Basic Training");

// --- Comportement : Cap 500, 200 chez Basic Training, 300 chez Augmentations -> plus aucune énergie libre générée ---
{
  const etat = { energieMax: 500, systemes: { systems: [{ id: "augmentations", state: { allocation: { energy: 300 } } }] } };
  const bt = 200;
  const max = Math.max(0, etat.energieMax - bt - fabrique(etat, nombre)());
  assert.equal(max, 0, "plafond local de l'énergie libre = 0 (comme le serveur), le compteur ne remonte plus");
}

console.log("idle-energy-local-cap-meta-allocations-v1: OK");
