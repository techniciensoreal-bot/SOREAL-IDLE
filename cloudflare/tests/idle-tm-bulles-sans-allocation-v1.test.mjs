import assert from "node:assert/strict";
import fs from "node:fs";
/* Norman (2026-11-08) : « il ne faut plus de bulles dans les barres énergie et magie de la machine temporelle quand aucune énergie n'est assignée ». Le canvas des bulles lit l'allocation de la tour (data-tm-alloc, tenue à jour par la page) : 0 = rien dessiné, même si le liquide n'est pas à zéro. */
const s = fs.readFileSync("cloudflare/public/modules/tm-bulles-canvas-v1.js", "utf8");
const i = s.indexOf("function dessiner(cv,t){"), j = s.indexOf("var dpr=cv.__tmD", i);
const corps = s.slice(i, j);
assert.ok(corps.indexOf("if(!(pct>0))return;") !== -1 && corps.indexOf("data-tm-alloc") > corps.indexOf("if(!(pct>0))return;"), "après le test du tube vide, l'allocation de la tour est lue");
assert.ok(/closest\('\.tmm-tour'\)/.test(corps) && /!\(Number\(tour\.getAttribute\('data-tm-alloc'\)\)>0\)\)return;/.test(corps), "allocation nulle : on sort sans dessiner");
console.log("idle-tm-bulles-sans-allocation-v1: OK");
