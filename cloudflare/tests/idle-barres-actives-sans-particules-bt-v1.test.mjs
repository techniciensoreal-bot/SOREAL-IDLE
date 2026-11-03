import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « enlève les particules dans basic training pour les barres actives » : la ligne active garde son cadre lumineux mais ne reçoit aucune couche .part-v1. */
const s = fs.readFileSync(new URL("../public/modules/barres-actives-v1.js", import.meta.url), "utf8");
assert.ok(/entrainement:\{[^}]*sansParticules:true\}/.test(s), "Basic Training : sansParticules");
assert.ok(/augmentations:\{[^}]*sansParticules:true\}/.test(s), "Augmentations : toujours sansParticules");
assert.ok(s.includes("if(!cfg.sansParticules&&!ligne.querySelector(':scope>.part-v1'))ligne.insertAdjacentHTML('beforeend',COUCHE);"), "aucune couche de particules pour ces menus");
assert.ok(/machine:\{[^}]*style:'piece'\}/.test(s) && !/machine:\{[^}]*sansParticules/.test(s), "les autres menus gardent leurs particules");
console.log("idle-barres-actives-sans-particules-bt-v1: OK");
