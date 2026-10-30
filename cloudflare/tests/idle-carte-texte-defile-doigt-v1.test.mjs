// Norman (2026-10-30) : « sur téléphone, on ne peut pas faire glisser le texte d'une carte de chronique : ça fait glisser le fond du jeu » :
// le texte de la carte (fiche et chronique de la page) défile au doigt par script (touch-action:none), ce que le texte ne peut plus absorber passe à la page (jamais dans une fiche), un glissement horizontal reste la rotation.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/carte-boss-magic-v1.js"), c = lire("cloudflare/public/soreal-idle-carte-boss.css");
assert.ok(c.includes(".mtg-modal-v1 .mtg-texte,.soreal-idle-boss-lore-v142.ouverte .mtg-texte{touch-action:none;overscroll-behavior:contain}"), "le texte reçoit tout le geste tactile");
assert.ok(m.includes("function texteDefilant(e)") && m.includes("d.mode=(d.fiche&&Math.abs(dx)>Math.abs(dy))?'rotation':'defile';") && m.includes("t.scrollTop+=delta;") && m.includes("window.scrollBy(0,reste)"), "défilement du texte au doigt, la page suit seulement hors fiche");
assert.ok(m.includes("if(e.pointerType==='mouse')return;"), "la souris garde le défilement natif");
console.log("idle-carte-texte-defile-doigt-v1 : OK");
