import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { preparerVdom } from "./_ygg-vdom.mjs";

/* Norman (2026-10-22) : l'aperçu des graines (Récolter) et des bonus (Manger) s'affiche sur la carte d'un fruit PRÊT seulement. */
const src = readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const a = src.indexOf("  function decimal_(x,max){");
const b = src.indexOf("  etat.echelles={};");
assert.ok(a > 0 && b > a);
const iFus = src.indexOf("  function fus_(a){");
assert.ok(iFus > 0 && src.indexOf("  /* Image R2 d'un fruit") > iFus);
const ctx = {};
const doc = preparerVdom(ctx);
const { h: hp } = ctx.window.preact;
const f = new Function("nb_", "grand_", "h", src.slice(iFus, src.indexOf("  /* Image R2 d'un fruit")) + src.slice(a, b) + "\nreturn {apercuVm_,Apercu_,texteEffet_};");
const T0 = f((v) => Number(v) || 0, (v) => String(Math.round(Number(v) || 0)), hp);
/* L'aperçu est maintenant un composant : on le RENDRE (vrai Preact, faux DOM) et on lit le HTML obtenu ; modèle vide = rien à dessiner. */
const T = { texteEffet_: T0.texteEffet_, apercuHtml_: (d, v, c) => { const m = T0.apercuVm_(d, v, c); if (!m) return ""; const el = doc.createElement("div"); ctx.window.preact.render(hp(T0.Apercu_, m), el); return el.innerHTML; } };
const ap = { sans: { harvest: { seeds: 40 }, eat: { seeds: 20, effets: [["gold", 1234]] } }, avec: { harvest: { seeds: 60 }, eat: { seeds: 30, effets: [["gold", 1850]] } } };
const txt = (h) => h.replace(/<[^>]+>/g, "");
const v = (pret, apercu) => ({ pret, e: { apercu } });
assert.equal(T.apercuHtml_({ poop: 0 }, v(false, ap), {}), "", "fruit qui pousse : rien");
assert.equal(T.apercuHtml_({ poop: 0 }, v(true, null), {}), "", "pas d'aperçu : rien");
let h = T.apercuHtml_({ poop: 0 }, v(true, ap), { poop: true });
assert.ok(txt(h).includes("+20 graines · +1234 Or") && txt(h).includes("Récolter : +40 graines") && !h.includes("(avec la Poop)"), "sans poop en stock : valeurs sans poop");
h = T.apercuHtml_({ poop: 2 }, v(true, ap), { poop: true });
assert.ok(txt(h).includes("+30 graines · +1850 Or") && txt(h).includes("+60 graines") && h.includes("(avec la Poop)"), "poop cochée et en stock : valeurs avec poop");
h = T.apercuHtml_({ poop: 2 }, v(true, ap), { poop: false });
assert.ok(txt(h).includes("+40 graines"), "poop non cochée : sans poop");
assert.ok(h.includes('+<span class="ygg-n">1850</span> Or') || T.apercuHtml_({ poop: 0 }, v(true, ap), {}).includes('+<span class="ygg-n">1234</span> Or'), "chaque nombre dans son propre élément : le code couleur des unités (Qa…) s'applique");
assert.equal(T.texteEffet_("luck", 1.25), "+1,25 % de chance de drop");
assert.equal(T.texteEffet_("pp", 0.5), "+0,5 PP");
const vitre = src.slice(src.indexOf("function Vitre_(c){"), src.indexOf("function Carte_(c){")), carte = src.slice(src.indexOf("function Carte_(c){"), src.indexOf("/* Modèle de vue de la page entière"));
assert.ok(vitre.includes("c.apercu?h(Apercu_,c.apercu):null") && !carte.includes("Apercu_"), "aperçu posé sur le portrait (dans la vitre), hors flux (aucun saut de la page)");
assert.ok(src.includes(".ygg-vitre .ygg-apercu{position:absolute;"), "hors flux : ne change jamais la hauteur de la carte");
console.log("idle-ygg-apercu-page-v1: OK");
