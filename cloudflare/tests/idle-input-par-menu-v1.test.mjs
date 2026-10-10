import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : « chaque Input doit être propre au menu où il se trouve ». La valeur reste une variable unique (tout le code existant la lit) mais change avec le menu. */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const deb = meta.indexOf("const CLE_MONTANTS_MENU_IDLE_V1=");
const fin = meta.indexOf("function montantAugmentLireIdleV1_(){");
assert.ok(deb > 0 && fin > deb, "mécanisme présent");
const mem = {};
const fenetre = { __menuActifIdleV28__: () => "entrainement" };
const fabrique = new Function("localStorage", "window", "montantAugmentIdleV1", `
  let montantAugmentIdleV1_ = montantAugmentIdleV1;
  ${meta.slice(deb, fin).replace(/montantAugmentIdleV1\b/g, "montantAugmentIdleV1_")}
  return { lire: () => montantAugmentIdleV1_, ecrire: (v) => { montantAugmentIdleV1_ = v; memoriserMontantMenuIdleV1_(); } };
`);
const m = fabrique({ getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } }, fenetre, 125);
const API = fenetre.__SOREAL_IDLE_INPUT_MENU_V1__;
API.init("entrainement");
m.ecrire(777);
API.changer("augmentations");
assert.equal(m.lire(), 125, "un menu jamais réglé garde la valeur d'avant");
m.ecrire(5);
API.changer("machine");
m.ecrire(42);
API.changer("entrainement");
assert.equal(m.lire(), 777, "Entraînement retrouve SA valeur");
API.changer("augmentations");
assert.equal(m.lire(), 5, "Augmentations retrouve SA valeur");
API.changer("machine");
assert.equal(m.lire(), 42, "Machine temporelle retrouve SA valeur");
assert.deepEqual(JSON.parse(mem.soreal_idle_montants_menu_v1), { entrainement: 777, augmentations: 5, machine: 42 }, "persisté par menu");
// Le changement de menu appelle le mécanisme avant le rendu.
assert.ok(ui.includes("window.__SOREAL_IDLE_INPUT_MENU_V1__.changer(idleMenuActifV28)") && ui.includes("window.__menuActifIdleV28__=function(){return idleMenuActifV28;}"), "branché sur le changement de menu");
console.log("idle-input-par-menu-v1: OK");
