import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Bulles de la Machine temporelle dans UN canvas par tube (plan C9, 2026-11-06). Le rendu doit rester celui que Norman a validé : mêmes bulles, mêmes courbes que les @keyframes de référence gardés dans
 * soreal-idle-machine.css, boucles parfaites (règle n°3), aucune bulle dans un tube vide, jamais d'élément animé par bulle (une bulle = une couche de composition).
 */
const css = fs.readFileSync("cloudflare/public/soreal-idle-machine.css", "utf8");
const src = fs.readFileSync("cloudflare/public/modules/tm-bulles-canvas-v1.js", "utf8");
const augm = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const index = fs.readFileSync("cloudflare/public/index.html", "utf8");

const ctx = { window: {}, Math, Number, parseFloat, performance: { now: () => 0 } };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const B = ctx.window.__SOREAL_IDLE_TM_BULLES_V1__;
assert.ok(B && typeof B.etat === "function" && typeof B.specs === "function", "module exposé");
const proche = (a, b, e = 1e-3, m = "") => assert.ok(Math.abs(a - b) <= e, m + " : " + a + " ≠ " + b);

/* 1. les bulles : 14 minibulles + 3 grosses, formules de l'ancien balisage */
for (const gauche of [true, false]) {
  const s = B.specs(gauche);
  assert.equal(s.filter((b) => b.type === "mini").length, 14);
  assert.equal(s.filter((b) => b.type === "gde").length, 3);
  s.filter((b) => b.type === "mini").forEach((b, i) => {
    assert.equal(b.x, 8 + ((i * 41 + (gauche ? 0 : 17)) % 84));
    assert.equal(b.retard, -Number(((i * 0.173) % 0.7).toFixed(2)));
    assert.equal(b.duree, Number((0.55 + ((i * 7) % 5) * 0.07).toFixed(2)));
    assert.equal(b.taille, 2);
  });
  s.filter((b) => b.type === "gde").forEach((b, i) => {
    assert.equal(b.x, 24 + i * 26 + (gauche ? 0 : 4));
    assert.equal(b.retard, -Number((i * 0.9 + (gauche ? 0 : 0.4)).toFixed(1)));
    assert.equal(b.duree, Number((2.4 + i * 0.35).toFixed(2)));
    assert.equal(b.taille, 3);
    assert.ok(b.retard <= 0, "retard négatif : la bulle est déjà en cours");
  });
}

/* 2. les courbes reproduisent les keyframes de référence (les nombres du CSS sont ceux du module) */
const fizz = /@keyframes tmmFizz\{([^]*?)\}\}/.exec(css)[1];
const monte = /@keyframes tmmMonte\{([^]*?)\}\}/.exec(css)[1];
for (const n of ["15%{opacity:.95}", "translateY(-34px) scale(2.2)"]) assert.ok(fizz.includes(n), "tmmFizz : " + n);
for (const n of ["8%{opacity:.95}", "50%{transform:translateY(-52cqh) translateX(3px) scale(2.2)}", "92%{opacity:.85}", "translateY(-98cqh) translateX(-2px) scale(3.8)"]) assert.ok(monte.includes(n), "tmmMonte : " + n);
assert.ok(src.includes("bezier(.35,.1,.7,.9)"), "même fonction de temps que cubic-bezier(.35,.1,.7,.9)");
const mini = B.specs(true)[0], gde = B.specs(true)[14];
const aTemps = (b, p) => b.retard + p * b.duree;   /* instant où la progression vaut p (retard négatif : on ajoute un nombre entier de cycles) */
const etatP = (b, p, h = 100) => B.etat(b, aTemps(b, p) + 50 * b.duree, h);
let e = etatP(mini, 0);
proche(e.opacite, 0, 1e-6, "mini début"); proche(e.montee, 0, 1e-6); proche(e.echelle, 1);
e = etatP(mini, 0.15); proche(e.opacite, 0.95, 1e-6, "mini 15 %");
e = etatP(mini, 0.999); assert.ok(e.opacite < 0.01, "mini : fondu de sortie, invisible à la fin du cycle");
proche(etatP(mini, 0.5).montee, 17, 1e-6, "linéaire : mi-cycle = mi-hauteur"); proche(etatP(mini, 0.5).echelle, 1.6, 1e-6);
e = etatP(gde, 0.08); proche(e.opacite, 0.95, 1e-4, "gde 8 %");
e = etatP(gde, 0.5, 200); proche(e.montee, 52 * 2, 1e-3, "gde mi-cycle : 52cqh d'un liquide de 200px"); proche(e.echelle, 2.2, 1e-3); proche(e.dx, 3, 1e-3);
e = etatP(gde, 0.92); proche(e.opacite, 0.85, 1e-4, "gde 92 %");
e = etatP(gde, 0.9999, 200); assert.ok(e.opacite < 0.01, "gde : invisible à la fin"); proche(e.montee, 98 * 2, 0.2); proche(e.echelle, 3.8, 0.01); proche(e.dx, -2, 0.01);
/* la bulle ne dépasse jamais la surface : sommet de la bulle (montée + pied + diamètre) reste dans le liquide jusqu'à ce qu'elle soit invisible */
for (let p = 0; p <= 1; p += 0.01) {
  const s = etatP(gde, p, 120);
  assert.ok(s.montee <= 98 * 1.2 + 1e-6, "montée bornée par 98 % du liquide");
}
/* règle n°3 : le cycle boucle sans à-coup (état identique à p = 0 et p = 1, opacité 0 aux deux bouts, toujours montante) */
for (const b of [mini, gde]) {
  const debut = B.etat(b, b.retard + 50 * b.duree, 100), fin = B.etat(b, b.retard + 51 * b.duree - 1e-9, 100);
  proche(debut.opacite, 0, 1e-6, "opacité 0 au début"); assert.ok(fin.opacite < 1e-3, "opacité 0 à la fin");
  let avant = -1;
  for (let p = 0; p < 1; p += 0.01) { const m = etatP(b, p).montee; assert.ok(m >= avant - 1e-9, "toujours dans le même sens"); avant = m; }
}
/* périodicité */
proche(B.etat(gde, 3.1, 100).montee, B.etat(gde, 3.1 + gde.duree * 7, 100).montee, 1e-6, "périodique");

/* 3. plus aucun élément animé par bulle : un canvas par tube, protégé du redessin de la page (règle n°4) */
assert.ok(!augm.includes("tmm-bulle mini") && !augm.includes("tmm-bulle gde"), "plus d'élément animé par bulle");
assert.ok(augm.includes('<canvas class="tmm-bulles-cv" data-morph-vivant="1" data-tm-gauche="'), "un canvas par tube, le morph n'y touche pas");
assert.ok(!/\.tmm-bulle\s*\{|\.tmm-bulle\./.test(css), "plus de règle d'animation appliquée à des bulles");
assert.ok(/\.tmm-bulles-cv\{position:absolute;left:0;bottom:0;width:100%/.test(css));
assert.ok(index.indexOf("tm-bulles-canvas-v1.js") > 0 && index.indexOf("tm-bulles-canvas-v1.js") < index.indexOf("ui-machine-temporelle-v1.js"), "chargé dans index.html");
/* densité 1x : jamais plus de pixels que nécessaire (plan C9, mesure du téléphone) */
assert.ok(/var dpr=1;/.test(src), "canvas des bulles en densité 1x");
/* le dessin ne relit JAMAIS la mise en page dans la boucle d'images : taille par ResizeObserver (mesuré : une image de 14 ms à chaque relecture de clientHeight sur téléphone) */
assert.ok(/new ResizeObserver\(/.test(src), "taille du tube suivie par un ResizeObserver");
const boucle = src.slice(src.indexOf("function image(){"));
assert.ok(!/clientHeight|clientWidth|offsetHeight|offsetWidth|getBoundingClientRect|scrollWidth|scrollHeight/.test(boucle), "aucune lecture de mise en page dans la boucle d'images");
const dessin = src.slice(src.indexOf("function dessiner("), src.indexOf("function image(){"));
assert.ok(!/clientHeight|clientWidth|offsetHeight|offsetWidth|getBoundingClientRect|scrollWidth|scrollHeight/.test(dessin), "aucune lecture de mise en page dans le dessin");
assert.ok(src.includes("matchMedia('(prefers-reduced-motion: reduce)')"), "mouvement réduit : rien ne bouge");
console.log("idle-tm-bulles-canvas-v1: OK");
