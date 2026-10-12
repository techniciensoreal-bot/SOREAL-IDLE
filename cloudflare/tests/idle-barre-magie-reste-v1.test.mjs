import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-12) : la barre de Magie ne disparaît pas (puis ne réapparaît pas) tant qu'il reste de la Magie à générer, même si tout est alloué (MAX) ; après un achat de plafond, elle est visible tout de suite. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
assert.ok(ui.includes("function magieEncoreAGenererIdleV1_(){") && ui.includes("return !!(m&&m.parSeconde>0&&m.cap-m.generee>=1);"), "il reste de la Magie à générer : production > 0 et plafond pas atteint");
assert.ok(ui.includes("magieEnCours:magieEncoreAGenererIdleV1_()") && ui.includes("magicDisponible<1&&!magieEncoreAGenererIdleV1_()?' soreal-idle-vide-v2':''"), "le bandeau n'est rendu « vide » que s'il n'y a plus rien à générer");
assert.ok(hud.includes("vM=d.magie<1&&!d.magieEnCours"), "le fondu de sortie n'est lancé que si plus rien n'arrive");
// l'énergie garde son comportement (elle s'efface quand tout est dépensé)
assert.ok(hud.includes("var vE=d.energie<1,") && hud.includes("basculerVide('sorealIdleDepenseEnergieV2','energie',vE)"), "barre d'énergie inchangée");
{ // logique pure
  const vide = (dispo, enCours) => dispo < 1 && !enCours;
  assert.equal(vide(0, true), false, "tout alloué mais 2 minutes de Magie à générer : la barre reste");
  assert.equal(vide(0, false), true, "plus rien à générer : elle s'efface");
  assert.equal(vide(5, false), false, "de la Magie disponible : elle reste");
}
console.log("idle-barre-magie-reste-v1: OK");
