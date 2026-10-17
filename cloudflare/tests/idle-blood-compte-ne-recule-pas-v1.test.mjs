import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-12) : le compteur « N complété(s) » d'un rituel ne recule pas quand on ajoute de la Magie (rejeu local en avance sur le serveur) ; il reste bon après un rafraîchissement. */
const bm = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8");
const ui = lireUiComplet();
assert.ok(bm.includes("function compteAfficheBloodIdleV1_(id,n){") && bm.includes('data-n="\'+H.idleEntier_(compteAfficheBloodIdleV1_(def.id,r.completions||0))') && bm.includes("if(n>=e.n){e.n=n;return n;}") && bm.includes("const borne=n+avanceMaxBloodIdleV1_(e);"), "le rendu garde le plus grand chiffre déjà affiché, mais son avance sur le serveur est bornée");
assert.ok(ui.includes("__bloodCompteTickV1__(bloodVisual.ritual,faits)") && ui.includes("__bloodCompteTickV1__(bloodVisual.ritual,0)") && !ui.includes("compte.getAttribute('data-n'))+(function(){const f=window.__bloodAvanceBorneeV1__"), "le tick relit le chiffre du serveur à jour (plus data-n figé au dessin de la page) : le compteur ne reste plus bloqué à serveur + 2");
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
{ // Norman (2026-10-13) : l'avance affichée ne dépasse pas ce que le rythme validé par le serveur justifie (règle pure, miroir de compteAfficheBloodIdleV1_)
  const m = {};
  let t = 0;
  const aff = (id, n, rb = 0) => {
    let e = m[id]; n = Number(n) || 0;
    if (e === undefined || e.rb !== rb) { m[id] = { n, rb, ns: n, ts: t, taux: 0 }; return n; }
    if (n !== e.ns) { if (n > e.ns && t > e.ts) e.taux = (n - e.ns) / ((t - e.ts) / 1000); else if (n < e.ns) e.taux = 0; e.ns = n; e.ts = t; }
    else if (t - e.ts > 20000) e.taux = 0;
    if (n >= e.n) { e.n = n; return n; }
    e.n = Math.min(e.n, n + Math.max(2, Math.ceil((e.taux || 0) * 12)));
    return e.n;
  };
  assert.equal(aff("banque", 21224), 21224);
  m.banque.n = 13363863;                               // le navigateur avait rejoué 13 millions de niveaux
  t += 2000; assert.ok(aff("banque", 21224) <= 21226, "rituel que le serveur ne valide pas : retour au chiffre du serveur (+2 au plus)");
  m.tack = { n: 3, rb: 0, ns: 1, ts: t, taux: 0.5 };   // rituel lent mais réel : l'avance de quelques secondes reste permise
  t += 1000; assert.equal(aff("tack", 1), 3, "pas de recul de 3 à 1 pour une avance plausible (cas de Norman du 12/10)");
  m.punaise = { n: 1091000000, rb: 0, ns: 179000000, ts: t, taux: 3_000_000 };
  t += 1000; assert.ok(aff("punaise", 179000000) <= 179000000 + 36_000_000, "avance bornée à 12 s de production validée");
}
console.log("idle-blood-compte-ne-recule-pas-v1: OK");

{ // Norman (2026-10-17) : « je suis monté à 2 avec la punaise et j'ai dû rafraîchir » : le compteur suit le chiffre du serveur à chaque tick (miroir de __bloodCompteTickV1__ + compteAfficheBloodIdleV1_)
  assert.ok(bm.includes("window.__bloodCompteTickV1__=function(id,faits){") && bm.includes("srv=Math.max(0,H.idleNombre_(r&&r.completions))") && bm.includes("Math.min(n+faits,srv+avanceMaxBloodIdleV1_(e))"), "fonction du tick présente");
  const m = {}; let t = 0, serveur = 0;
  const aff = (id, n) => {
    let e = m[id]; n = Number(n) || 0;
    if (e === undefined) { m[id] = { n, rb: 0, ns: n, ts: t, taux: 0 }; return n; }
    if (n !== e.ns) { if (n > e.ns && t > e.ts) e.taux = (n - e.ns) / ((t - e.ts) / 1000); else if (n < e.ns) e.taux = 0; e.ns = n; e.ts = t; }
    else if (t - e.ts > 20000) e.taux = 0;
    if (n >= e.n) { e.n = n; return n; }
    e.n = Math.min(e.n, n + Math.max(2, Math.ceil((e.taux || 0) * 12))); return e.n;
  };
  const tick = (id, faits) => { let n = aff(id, serveur); faits = Number(faits) || 0; if (faits > 0) { const e = m[id]; n = Math.max(n, Math.min(n + faits, serveur + Math.max(2, Math.ceil((e.taux || 0) * 12)))); e.n = n; } return n; };
  assert.equal(tick("tack", 0), 0);
  t += 1000; assert.equal(tick("tack", 1), 1, "1er rituel rejoué"); t += 1000; assert.equal(tick("tack", 1), 2, "2e");
  t += 1000; assert.equal(tick("tack", 1), 2, "3e : plafonné à serveur + 2 tant que le serveur n'a rien validé");
  serveur = 3; t += 1000;                      // la synchro valide 3 : le compteur suit SANS redessin de la page
  assert.equal(tick("tack", 0), 3, "le serveur dit 3 : affiché 3 (avant : bloqué à 2 jusqu'au rafraîchissement)");
  t += 1000; assert.ok(tick("tack", 1) >= 4, "et l'avance repart du nouveau chiffre");
  serveur = 6; t += 1000; assert.equal(tick("tack", 0), 6, "le serveur rattrape : 6");
}
console.log("idle-blood-compte-ne-recule-pas-v1 (suivi du serveur): OK");
