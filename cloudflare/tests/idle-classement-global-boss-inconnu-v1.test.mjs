import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-11) : dans l'onglet Global, un joueur qui n'a pas battu autant de boss qu'un autre voit « Boss ??? » pour cet autre joueur (règle n°2). */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const monBoss=(function(){const m=entrees.find(function(x){return x&&x.moi;});return m?idleEntier_(m.valeurs&&m.valeurs.boss):0;})();"), "mon boss = celui de ma ligne du classement");
assert.ok(ui.includes("(idleEntier_(e.valeurs&&e.valeurs.boss)>monBoss?'Boss ???':valeurClassementIdleV1_('boss',e.valeurs&&e.valeurs.boss))"), "plus avancé que moi : « Boss ??? »");
// logique isolée
const aff = (mien, autre) => (autre > mien ? "Boss ???" : "Boss " + autre);
assert.equal(aff(50, 80), "Boss ???");
assert.equal(aff(50, 50), "Boss 50");
assert.equal(aff(50, 12), "Boss 12");
console.log("idle-classement-global-boss-inconnu-v1: OK");
