// Dents dorées de barrette de RAM sur l'arête du circuit de chaque paire d'Augmentations (Norman, 2026-11-02).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8").replace(/\r/g, "");
const sel = '[data-menu="augmentations"] .aug-paire-v2::before{';
const premier = css.lastIndexOf("/* Dents dorées de barrette de RAM");
assert.ok(premier > 0, "bloc des dents présent");
const bloc = css.slice(premier);
const iMedia = bloc.indexOf("@media (max-width:700px)");
assert.ok(iMedia > 0, "règle téléphone présente");
const pc = bloc.slice(bloc.indexOf(sel), iMedia);
const tel = bloc.slice(iMedia);
const corps = (s) => s.slice(s.indexOf(sel) + sel.length, s.indexOf("}", s.indexOf(sel)));
const cPc = corps(pc), cTel = corps(tel);
for (const c of [cPc, cTel]) {
  assert.match(c, /repeating-linear-gradient/, "dents = dégradé répété");
  assert.match(c, /#f7e08e/, "or");
  assert.ok(!/animation:s*(?!none)/.test(c), "aucune animation");
  assert.ok(!/filter|box-shadow|transition/.test(c), "ni filtre, ni ombre, ni transition");
}
assert.match(cPc, /pointer-events:none/);
assert.match(cPc, /z-index:1/, "au-dessus du fond de la carte");
assert.match(cPc, /left:0;top:0;bottom:0/, "PC : arête gauche, toute la hauteur");
assert.match(cPc, /width:13px/);
assert.match(cPc, /repeating-linear-gradient\(180deg/);
assert.match(cTel, /left:0;right:0;top:0;bottom:auto/, "téléphone : arête supérieure (celle du circuit, empilé au-dessus du processeur)");
assert.match(cTel, /height:13px/);
assert.match(cTel, /repeating-linear-gradient\(90deg/);
// la carte empile bien circuit puis processeur sous 700 px
assert.ok(/@media \(min-width:701px\)\{\s*html body[^{]*aug-pistes-v2:has\(\.aug-lien-v2\)\{grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/.test(css));
console.log("ok idle-augmentations-dents-ram-v1");
