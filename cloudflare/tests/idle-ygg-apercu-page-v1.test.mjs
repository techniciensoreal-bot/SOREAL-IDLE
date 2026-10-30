import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : l'aperçu des graines (Récolter) et des bonus (Manger) s'affiche sur la carte d'un fruit PRÊT seulement. */
const src = readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const a = src.indexOf("  function decimal_(x,max){");
const b = src.indexOf("  etat.echelles={};");
assert.ok(a > 0 && b > a);
const f = new Function("nb_", "grand_", "html_", src.slice(a, b) + "\nreturn {apercuHtml_,texteEffet_};");
const T = f((v) => Number(v) || 0, (v) => String(Math.round(Number(v) || 0)), (t) => String(t));
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
assert.ok(src.includes("apercuHtml_(d,v,c)+\n      auto+"), "affiché sur la carte, avant l'Auto-Activate");
console.log("idle-ygg-apercu-page-v1: OK");
