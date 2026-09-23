import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

/*
 * Ce test V194 est conservé comme garde de compatibilité du besoin
 * "popup mobile", mais l'implémentation réelle a été refactorée :
 * - V196 possède tap / double-tap / drag (vérifié ci-dessous) ;
 * - long-press-v200.js possède le maintien tactile WebView (vérifié par
 *   idle-inventory-gestures-v200.test.mjs, qui lit le vrai module livré) ;
 * - aucun bouton de secours n'est rendu : le maintien est l'accès direct au popup.
 *
 * Audit 2026-09-23 (second passage) : ce test lisait auparavant
 * long-press-v197.js -- un fichier mort, jamais chargé par index.html
 * (remplacé par v200, dont la gestion de touchcancel diffère réellement :
 * v197 avait un seuil elapsed>=120, v200 n'en a plus). Il validait donc
 * silencieusement une implémentation qui n'est plus celle servie aux
 * joueurs. Les assertions sur le module long-press lui-même ont été
 * retirées d'ici (redondantes avec idle-inventory-gestures-v200.test.mjs,
 * qui couvre déjà HOLD_MS, MOVE_PX, touchstart actif et touchcancel
 * immobile sur le vrai module v200) ; long-press-v197.js et
 * audio-effects-v197.js (aussi jamais chargé) ont été supprimés.
 */

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

assert.doesNotMatch(
  ui,
  /soreal-idle-item-info-v197|data-idle-item-info-v197/,
  "L'ancien bouton i doit être totalement absent du rendu et du contrôleur."
);

assert.doesNotMatch(
  ui,
  /IDLE_ADVENTURE_APPUI_LONG_MS_V194|debutAppuiLongAdventureIdleV165_|doubleTapObjetAdventureIdleV194_/,
  "Les anciennes couches V165/V194 ne doivent pas être réintroduites."
);

new Function(ui);

console.log("Inventory mobile item popup: OK — double-tap V196, sans bouton i (long-press couvert par idle-inventory-gestures-v200).");
