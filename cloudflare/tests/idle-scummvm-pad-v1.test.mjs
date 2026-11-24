import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Pavé tactile d'Énigmes (Norman, 2026-11-24) : sur téléphone, un carré sous le jeu sert de track pad (glisser = déplacer le curseur, appui bref = clic, appui long = clic droit).
   Le moteur lit des PointerEvent (SDL3) : les MouseEvent/TouchEvent simulés sont ignorés (mesuré). */
const src = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-scummvm-v1.css", "utf8");
assert.ok(src.includes("function htmlPad(){return appareilTactile()&&jeuCourant?"), "pavé seulement sur appareil tactile");
assert.ok(src.includes("id=\"scvPadV1\"") && src.includes("data-morph-vivant"), "nœud persistant (règle n°4)");
assert.ok(src.includes("new w.PointerEvent(type,") && src.includes("pointerType:'mouse'"), "événements de pointeur de type souris envoyés au canvas du moteur");
assert.ok(src.includes("'pointerenter'") && src.includes("'pointermove'") && src.includes("'pointerdown'") && src.includes("'pointerup'"), "entrée, déplacement, appui et relâchement");
assert.ok(/PAD\.bouge<8&&Date\.now\(\)-PAD\.t<350\)cliquerAuJeu\(0\)/.test(src), "appui bref immobile : clic gauche");
assert.ok(src.includes("cliquerAuJeu(2)") && src.includes("},450)"), "appui long immobile : clic droit");
/* Norman (2026-11-24) : « en jouant avec le track pad ça m'a fait passer sur la page Renaissance » : glisser sur le pavé ne change JAMAIS de page (la navigation par glissement ignore les éléments [data-no-swipe]). */
assert.ok(src.includes('data-no-swipe="1"'), "pavé exclu du changement de page par glissement");
const menus = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
assert.ok(menus.includes("[data-no-swipe]"), "la navigation par glissement respecte [data-no-swipe]");
assert.ok(!/setInterval\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune minuterie répétée");
assert.ok(/\.scv-pad\{display:flex;[^}]*aspect-ratio:1\/1/.test(css) && css.includes("touch-action:none"), "carré, sans défilement de page");
assert.ok(css.includes("@media (hover:none) and (pointer:coarse)") && /\.scv-pad\{display:none\}/.test(css), "caché hors appareil tactile");
assert.ok(src.includes("<div class=\"scv-ctrl\">'+htmlTouches('scv-touches')+htmlPad()+'</div>'"), "boutons à gauche, pavé à droite");
console.log("idle-scummvm-pad-v1: OK");
