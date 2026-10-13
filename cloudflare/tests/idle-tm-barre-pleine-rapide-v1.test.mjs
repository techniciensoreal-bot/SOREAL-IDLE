import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : à 50 niveaux par seconde dans la Machine temporelle, la barre doit rester pleine. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const SEUIL_NIVEAU_RAPIDE_TM_V1=0.25;") && ui.includes("else if(palier>0&&palier<=SEUIL_NIVEAU_RAPIDE_TM_V1)fill=1;"), "tick : un niveau de 0,25 s ou moins laisse la barre pleine");
assert.ok(ui.includes("if(palierPatch>0&&palierPatch<=SEUIL_NIVEAU_RAPIDE_TM_V1)pct=100;"), "après synchro : même règle");
{ // règle pure : durée d'un niveau = ETA / (1 - remplissage)
  const pleine = (eta, remplissage) => { const reste = 1 - remplissage; const p = reste > 1e-9 ? eta / reste : 0; return p > 0 && p <= 0.25; };
  assert.equal(pleine(0.01, 0.5), true, "50 niveaux par seconde (0,02 s) : barre pleine");
  assert.equal(pleine(0.1, 0.5), true, "5 niveaux par seconde : pleine");
  assert.equal(pleine(1, 0.5), false, "1 niveau toutes les 2 s : la barre avance normalement");
  assert.equal(pleine(30, 0.2), false);
}
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("if(n>=50)return {classe:'rapide',style:''};"), "barre d'Or : pleine à 50 remplissages par seconde");
console.log("idle-tm-barre-pleine-rapide-v1: OK");
