import assert from "node:assert/strict";
import fs from "node:fs";
/* Norman (2026-11-07) : « uniquement pour le boss 106 : derrière son animation de mort, la photo du boss suivant (le même boss transformé) ». */
const c1 = fs.readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
assert.ok(/if\(idMortV1===106\)\{[\s\S]*?id=107[\s\S]*?__SOREAL_IDLE_MORT_DERRIERE_V1__=adr;/.test(c1), "seul le boss 106 pose l'image du boss 107");
assert.ok(c1.includes("window.__SOREAL_IDLE_MORT_DERRIERE_V1__='';"), "remis à zéro à chaque mort : aucun autre boss n'en hérite");
for (const f of ["morts-boss-nouvelles-v1.js", "victoire-boss-arcade-v1.js"]) {
  const s = fs.readFileSync("cloudflare/public/modules/" + f, "utf8");
  assert.ok(s.includes("mort-derriere-v1") && s.includes("calque.style.background='transparent'") && s.includes("__SOREAL_IDLE_MORT_DERRIERE_ACTIF__=true") && s.includes("clearRect(0,0,LW,LH)"), f + " : image derrière, animation sur fond transparent");
  assert.ok((s.match(/__SOREAL_IDLE_MORT_DERRIERE_ACTIF__=false/g) || []).length >= 2, f + " : remis à zéro à la fin");
}
console.log("idle-boss-106-suivant-derriere-v1: OK");
