import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « Remplace les boutons TOUT RETIRER par TOUT REPRENDRE », puis « dans la Machine temporelle il est coupé, et je veux un fond de bouton plus sombre pour que ce soit plus lisible ».
 */
const lire = (f) => fs.readFileSync(f, "utf8");
for (const f of ["augmentations-page-v1", "barre-allocation-v1", "blood-magic-v1", "ngu-labo-v1", "ui-entrainement-v1"]) {
  const s = lire("cloudflare/public/modules/" + f + ".js");
  assert.ok(s.includes(">Tout reprendre<") && !s.includes(">Tout retirer<"), "bouton renommé : " + f);
}
assert.equal(JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"))["Tout reprendre"], "Take all back", "traduction anglaise");
// Machine temporelle : trois colonnes pour le bouton, fond turquoise foncé
const m = lire("cloudflare/public/soreal-idle-machine.css");
assert.ok(/\[data-menu="machine"\] \.soreal-idle-bt-toolbar-v120 \.soreal-idle-bt-presets-v120\{--i-a:#0d6070;--i-b:#052b34;--bt-clear-col:span 3\}/.test(m), "Machine temporelle : « Tout reprendre » sur trois colonnes, fond plus sombre");
// ailleurs : un bouton dont le texte dépasse prend toute la ligne (jamais coupé)
const p = lire("cloudflare/public/modules/perso-boutons-v1.js");
assert.ok(p.includes("function ajusterToutReprendre_()") && p.includes("b.scrollWidth>b.clientWidth+1") && p.includes("setProperty('grid-column','1 / -1','important')") && p.includes("try{ajusterToutReprendre_();}catch(_e){}"), "bouton coupé : toute la ligne, revu après chaque redessin");
console.log("idle-tout-reprendre-v1: OK");
