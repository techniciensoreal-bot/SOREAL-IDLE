import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const longPress=readFileSync(
  new URL("../public/modules/long-press-v197.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

/*
 * Ce test V194 est conservé comme garde de compatibilité du besoin
 * "popup mobile", mais l'implémentation réelle a été refactorée :
 * - V196 possède tap / double-tap / drag ;
 * - long-press-v197.js possède le maintien tactile WebView ;
 * - un bouton "i" fournit un accès direct au même popup.
 */

assert.match(
  longPress,
  /var HOLD_MS=600;/,
  "L'appui long mobile doit se déclencher après 600 ms."
);

assert.match(
  longPress,
  /var MOVE_PX=32;/,
  "L'appui long doit tolérer les micro-mouvements naturels du doigt."
);

assert.match(
  longPress,
  /document\.addEventListener\('touchstart',[\s\S]*?\{capture:true,passive:false\}\)/,
  "Le maintien mobile doit utiliser un touchstart actif en capture pour les WebView."
);

assert.match(
  longPress,
  /new CustomEvent\('soreal-longpress'/,
  "Le composant de maintien doit émettre l'événement soreal-longpress."
);

assert.match(
  longPress,
  /document\.addEventListener\('touchcancel',[\s\S]*?elapsed>=120[\s\S]*?cancelledByBrowser=true/,
  "Un touchcancel WebView pendant un maintien immobile ne doit pas tuer immédiatement le timer."
);

assert.match(
  ui,
  /data-soreal-longpress="idle-item"/,
  "Les items du sac et de l'équipement doivent être enregistrés auprès du composant long-press."
);

assert.match(
  ui,
  /document\.addEventListener\('soreal-longpress',[\s\S]*?ouvrirDetailsObjetParGesteAdventureIdleV196_\(id\)/,
  "Un maintien réussi doit ouvrir le popup de statistiques via le contrôleur d'inventaire."
);

assert.match(
  ui,
  /const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;/,
  "Le fallback double-tap mobile doit rester présent."
);

assert.match(
  ui,
  /function estDoubleTapGesteAdventureIdleV196_\(id,pointerType\)/,
  "Le détecteur de double-tap V196 doit exister."
);

assert.match(
  ui,
  /if\(estDoubleTapGesteAdventureIdleV196_\(id,pointerType\)\)\{[\s\S]*?ouvrirDetailsObjetParGesteAdventureIdleV196_\(id\)/,
  "Le double-tap doit ouvrir le même popup de statistiques."
);

assert.match(
  ui,
  /class="soreal-idle-item-info-v197"[^>]*data-idle-item-info-v197=/,
  "Chaque item rendu doit proposer le bouton de secours i."
);

assert.match(
  ui,
  /closest\('\[data-idle-item-info-v197\]'\)[\s\S]*?ouvrirDetailsObjetParGesteAdventureIdleV196_\(id\)/,
  "Le bouton i doit ouvrir directement le même popup."
);

assert.doesNotMatch(
  ui,
  /IDLE_ADVENTURE_APPUI_LONG_MS_V194|debutAppuiLongAdventureIdleV165_|doubleTapObjetAdventureIdleV194_/,
  "Les anciennes couches V165/V194 ne doivent pas être réintroduites."
);

new Function(ui);
new Function(longPress);

console.log("Inventory mobile item popup: OK — long-press V197, double-tap V196, bouton i.");
