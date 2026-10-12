import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-11) : image de Wandoos recadrée (plus de vide en bas), l'écran ne remonte pas quand on place une ressource, plus de cadre rouge clignotant sur Aventure, cadre lumineux de NGU fixe. */
const wd = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
assert.ok(wd.includes("border-image:url(\"'+BANNIERE+'\") 195 162 363 162 fill / 15.55cqw 12.92cqw 28.95cqw 12.92cqw / 3.67cqw 1.36cqw 2.23cqw 1.36cqw stretch"), "image rognée par border-image-outset (marges transparentes hors cadre)");
assert.ok(wd.includes("var ecranVu=poste.querySelector&&poste.querySelector('.wd-ecran'),haut=ecranVu?ecranVu.scrollTop:0;") && wd.includes("ecranNeuf.scrollTop=haut"), "défilement interne de l'écran conservé au redessin");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("window.__SOREAL_IDLE_WANDOOS_V1__.rafraichir();\n                else rafraichirMenuRacineIdleV28_();") || ui.includes("window.__SOREAL_IDLE_WANDOOS_V1__.rafraichir();\r\n                else rafraichirMenuRacineIdleV28_();"), "la synchro de Wandoos ne redessine que le poste");
for (const f of ["soreal-idle-themes.css", "soreal-idle-ui.css"]) {
  const css = readFileSync("cloudflare/public/" + f, "utf8");
  assert.ok(!/adventure-ko-v1[^{]*\{[^}]*(animation:(?!none)|box-shadow:inset)/.test(css), f + " : aucun cadre rouge clignotant sur Aventure");
  assert.ok(!css.includes("sorealNavKoV2") && !css.includes("sorealIdleNavKoV1"), f + " : keyframes rouges supprimés");
}
const ngu = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
assert.ok(!ngu.includes("nlPouls"), "le halo du tuyau ne pulse plus");
assert.ok(ngu.includes(".nl-barre.actif{box-shadow:none!important}") && ngu.includes(".nl-barre.actif .nl-tube{box-shadow:inset 0 0 16px 2px"), "aura NGU posée par la classe actif, dans le tuyau");
console.log("idle-wandoos-recadre-ko-ngu-v1: OK");
