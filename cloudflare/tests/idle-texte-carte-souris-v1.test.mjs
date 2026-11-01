// Norman (2026-11-01) : « on doit pouvoir faire défiler le texte d'une carte de chronique de boss avec la souris ou en maintenant le clic gauche et en bougeant la souris. »
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const js = lire("cloudflare/public/modules/carte-boss-magic-v1.js");
const css = lire("cloudflare/public/soreal-idle-carte-boss.css");
// glisser à la souris : bouton gauche seulement, pas sur un bouton/lien, même mécanique que le doigt
assert.ok(js.includes("if(e.pointerType==='mouse'&&e.button!==0)return;"), "clic gauche seulement");
assert.ok(!js.includes("  if(e.pointerType==='mouse')return;\n  var t=texteDefilant(e);"), "la souris n'est plus exclue du défilement par glissement");
assert.ok(js.includes("e.target.closest('button,a,input,textarea,select,.mtg-fleche')"), "boutons et flèches gardent leur clic");
// molette : défile le texte, la page ne bouge pas derrière une fiche
const w = js.indexOf("document.addEventListener('wheel'");
assert.ok(w > 0 && js.slice(w, w + 600).includes("t.scrollTop+=") && js.slice(w, w + 700).includes("passive:false"), "molette sur le texte");
// le texte ne se sélectionne pas pendant le glissement, curseur « main »
assert.ok(/\.mtg-texte\{touch-action:none;overscroll-behavior:contain;-webkit-user-select:none;user-select:none;cursor:grab\}/.test(css), "texte non sélectionnable, curseur main");
console.log("idle-texte-carte-souris-v1 : OK");
