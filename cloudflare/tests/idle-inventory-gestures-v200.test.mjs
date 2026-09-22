import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const css=fs.readFileSync(
  new URL("../public/soreal-idle-ui.css",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const longPress=fs.readFileSync(
  new URL("../public/modules/long-press-v200.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

function block(start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,"Bloc introuvable: "+start);
  return source.slice(a,b);
}

assert.ok(
  index.includes('/modules/long-press-v200.js?v=200')&&
  index.includes('/soreal-idle-ui.js?v=221'),
  "Le standalone doit conserver le module de maintien V200 et charger l'UI cache-bustée."
);



assert.ok(
  source.includes("const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;")&&
  source.includes("const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;")&&
  !source.includes("IDLE_ADVENTURE_APPUI_LONG_MS_V196"),
  "V196 ne doit pas recréer un deuxième timer d'appui long."
);

const controller=block(
  "      const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;",
  "      function idSourceAdventureIdleV138_(event){"
);

for(const eventName of [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "lostpointercapture"
]){
  assert.ok(
    controller.includes("document.addEventListener('"+eventName+"'"),
    "Pointer Event tap/drag manquant: "+eventName
  );
}

assert.ok(
  controller.includes("setPointerCapture(event.pointerId)"),
  "Le tap/drag doit capturer explicitement le pointeur."
);

assert.ok(
  controller.includes("document.addEventListener('soreal-longpress'")&&
  controller.includes("ouvrirDetailsObjetParGesteAdventureIdleV196_(id)"),
  "L'inventaire doit consommer l'événement long-press générique."
);

assert.ok(
  source.includes('data-soreal-longpress="idle-item"')&&
  !source.includes("data-idle-item-info-v197")&&
  !source.includes("soreal-idle-item-info-v197"),
  "Sac et équipement doivent exposer uniquement le maintien long, sans ancien bouton info."
);

assert.ok(
  css.includes("touch-action:none;")&&
  css.includes("-webkit-touch-callout:none;")&&
  css.includes("-webkit-user-drag:none;")&&
  css.includes("pointer-events:none;"),
  "Le CSS doit neutraliser les comportements natifs concurrents."
);

assert.ok(
  longPress.includes("var HOLD_MS=600;")&&
  longPress.includes("var MOVE_PX=32;")&&
  longPress.includes("document.addEventListener('touchstart'")&&
  longPress.includes("{capture:true,passive:false}")&&
  longPress.includes("new CustomEvent('soreal-longpress'"),
  "V200 doit posséder un vrai timer tactile WebView de 600 ms."
);

assert.ok(
  longPress.includes("document.addEventListener('pointerdown'")&&
  longPress.includes("type==='touch'?'pointer-touch':'pointer'"),
  "Pointer Events doivent servir de fallback tactile si touchstart n'est pas livré."
);

assert.ok(
  longPress.includes("document.addEventListener('touchcancel'")&&
  longPress.includes("if(!s.moved&&!s.fired){")&&
  longPress.includes("s.cancelledByBrowser=true;")&&
  !longPress.includes("elapsed>=120"),
  "Un touchcancel immobile, même précoce, ne doit plus tuer le maintien."
);

assert.ok(
  longPress.includes("document.addEventListener('pointercancel'")&&
  longPress.includes("s.pointerType==='touch'&&!s.moved&&!s.fired"),
  "Le fallback Pointer tactile doit survivre lui aussi à pointercancel."
);

assert.ok(
  longPress.includes("document.addEventListener('contextmenu'")&&
  longPress.includes("fire_(s,'contextmenu')")&&
  longPress.includes("emit_(target,'contextmenu','touch',HOLD_MS)"),
  "contextmenu mobile doit devenir un troisième signal de maintien au lieu d'être seulement bloqué."
);

assert.ok(
  longPress.includes("data-soreal-longpress-ignore"),
  "Les contrôles explicites comme le bouton info doivent rester exclus."
);

for(const obsolete of [
  "V195 — contrôleur UNIQUE des gestes d'inventaire",
  "idleAdventureGesteV195",
  "terminerEtatGesteAdventureIdleV195_"
]){
  assert.ok(
    !source.includes(obsolete),
    "Ancienne couche encore présente: "+obsolete
  );
}

new Function(source);
new Function(longPress);

console.log(
  "SOREAL IDLE Inventory V200: OK — i visible, Touch+Pointer+contextmenu, cancel WebView résilient."
);
