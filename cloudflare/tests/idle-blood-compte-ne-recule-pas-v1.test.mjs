import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-12) : le compteur « N complété(s) » d'un rituel ne recule pas quand on ajoute de la Magie (rejeu local en avance sur le serveur) ; il reste bon après un rafraîchissement. */
const bm = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(bm.includes("function compteAfficheBloodIdleV1_(id,n){") && bm.includes('data-n="\'+H.idleEntier_(compteAfficheBloodIdleV1_(def.id,r.completions||0))') && bm.includes("e.rb!==rb||n>=e.n"), "le rendu garde le plus grand chiffre déjà affiché (sauf après une Renaissance)");
assert.ok(ui.includes("[bloodVisual.ritual]={n:idleNombre_(compte.getAttribute('data-n'))+bloodVisual.ajoutLocal,rb:") && ui.includes("[bloodVisual.ritual]={n:idleNombre_(compte2.getAttribute('data-n'))+bloodVisual.ajoutLocal,rb:"), "le tick met à jour le chiffre affiché");
{ // même logique, en pur
  const m = {};
  const aff = (id, n, rb = 0) => { const e = m[id]; n = Number(n) || 0; if (e === undefined || e.rb !== rb || n >= e.n) { m[id] = { n, rb }; return n; } return e.n; };
  assert.equal(aff("tack", 1), 1);
  m.tack = { n: 3, rb: 0 };                     // le tick a affiché 3 (2 rituels rejoués en avance)
  assert.equal(aff("tack", 1), 3, "le serveur en est à 1 : on garde 3, pas de recul (le cas de Norman : 3 puis 1)");
  assert.equal(aff("tack", 2), 3);
  assert.equal(aff("tack", 3), 3); assert.equal(aff("tack", 5), 5, "le serveur rattrape puis dépasse");
  assert.equal(aff("tack", 1, 1), 1, "une Renaissance remet le compteur à zéro : on suit");
}
console.log("idle-blood-compte-ne-recule-pas-v1: OK");
