import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « Quand on double tape sur le cube de l'infini il doit absorber tous les boosts. »
 * Même action que « A + clic » sur le Cube (inventory-auto-v1.js) : inventoryAuto / boostAll, cible « cube »
 * (déjà gérée côté serveur). Tactile/stylet seulement, comme les objets ; la souris garde son comportement.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("let idleCubeDernierTapMsV1=0;");
const fin = ui.indexOf("window.__clicCubeAdventureIdleV138__=clicCubeAdventureIdleV138_;");
assert.ok(debut > 0 && fin > debut, "bloc du double tap sur le Cube introuvable");
const bloc = ui.slice(debut, fin);

assert.match(ui, /onclick="window\.__clicCubeAdventureIdleV138__\(event\)"/, "le clic du Cube transmet l'évènement (type de pointeur)");
assert.match(bloc, /envoyer\(\{action:'inventoryAuto',mode:'boostAll',targetId:'cube'\}\)/, "double tap = absorber tous les boosts dans le Cube");

// Exécution réelle du bloc avec un faux environnement.
const envoyes = [];
const details = [];
let maintenant = 1000;
const timers = [];
const fabrique = new Function(
  "window", "Date", "setTimeout", "clearTimeout", "nettoyerEtatDragAdventureIdleV138_", "afficherDetailsCubeInfiniAdventureIdleV220_",
  "IDLE_ADVENTURE_DOUBLE_TAP_MS_V196", "idleAdventureSelectionIdV138", "boosterCubeAdventureIdleV47_", "toastIdleV5_", "aventureMetaIdleV47_", "idleEtat", "gestesAchetesIdleV1_",
  bloc + "\nreturn clicCubeAdventureIdleV138_;"
);
const fenetre = { __actionMetaV47__: (p) => envoyes.push(p), matchMedia: () => ({ matches: true }) };
const clic = fabrique(
  fenetre, { now: () => maintenant },
  (fn, ms) => { timers.push({ fn, ms, actif: true }); return timers.length; },
  (id) => { if (timers[id - 1]) timers[id - 1].actif = false; },
  () => {}, () => details.push(maintenant), 420, "", () => {}, () => {}, () => null, null, () => ({ double: true, triple: false })
);

// Un seul tap tactile : rien d'absorbé, détails ouverts seulement après la fenêtre de double tap.
clic({ pointerType: "touch" });
assert.equal(envoyes.length, 0, "un tap simple n'absorbe rien");
assert.equal(details.length, 0, "détails pas encore ouverts (sinon le popup recouvrirait le Cube)");
assert.equal(timers.filter((t) => t.actif).length, 1);
timers.filter((t) => t.actif).forEach((t) => t.fn());
assert.equal(details.length, 1, "détails ouverts après la fenêtre");

// Double tap rapide : absorbe tous les boosts, ne montre pas les détails.
maintenant = 5000;
clic({ pointerType: "touch" });
maintenant = 5200;
clic({ pointerType: "touch" });
assert.deepEqual(envoyes, [{ action: "inventoryAuto", mode: "boostAll", targetId: "cube" }]);
timers.filter((t) => t.actif).forEach((t) => t.fn());
assert.equal(details.length, 1, "le double tap n'ouvre pas les détails");

// Deux taps trop espacés : ce ne sont pas un double tap.
maintenant = 9000;
clic({ pointerType: "pen" });
maintenant = 9600;
clic({ pointerType: "pen" });
assert.equal(envoyes.length, 1, "taps espacés de plus de 420 ms : aucune absorption");

// Souris : comportement inchangé (détails tout de suite, jamais d'absorption).
const avant = details.length;
clic({ pointerType: "mouse" });
clic({ pointerType: "mouse" });
assert.equal(details.length, avant + 2, "souris : détails immédiats");
assert.equal(envoyes.length, 1, "souris : « A + clic » reste le raccourci PC");

console.log("idle-cube-double-tap-v1: OK");
