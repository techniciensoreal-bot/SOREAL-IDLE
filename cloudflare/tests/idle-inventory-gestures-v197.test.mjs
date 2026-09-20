import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

const longPress=fs.readFileSync(
  new URL("../public/modules/long-press-v197.js",import.meta.url),
  "utf8"
).replace(/\r\n/g,"\n");

function block(start,end){
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,"Bloc introuvable: "+start);
  return source.slice(a,b);
}

assert.ok(
  source.includes("V196 — contrôleur UNIQUE d'interaction inventaire"),
  "L'inventaire doit conserver V196 pour tap/drag."
);

assert.ok(
  source.includes("const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;")&&
  source.includes("const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;")&&
  !source.includes("IDLE_ADVENTURE_APPUI_LONG_MS_V196"),
  "V196 ne doit plus posséder le timer d'appui long."
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
  "Le drag/tap doit capturer explicitement le pointeur."
);

assert.ok(
  !controller.includes("document.addEventListener('touchstart'"),
  "V196 ne doit plus concurrencer le composant long-press sur touchstart."
);

assert.ok(
  controller.includes("document.addEventListener('soreal-longpress'")&&
  controller.includes("ouvrirDetailsObjetParGesteAdventureIdleV196_(id)"),
  "L'inventaire doit consommer l'événement long-press générique."
);

assert.ok(
  source.includes('data-soreal-longpress="idle-item"')&&
  source.includes("data-idle-item-info-v197")&&
  source.includes("soreal-idle-item-info-v197"),
  "Sac et équipement doivent exposer long-press + bouton info."
);

assert.ok(
  controller.includes("closest('[data-idle-item-info-v197]')")&&
  controller.includes("terminerEtatGesteAdventureIdleV196_();")&&
  controller.includes("ouvrirDetailsObjetParGesteAdventureIdleV196_(id);"),
  "Le bouton info doit ouvrir directement le même popup sans déclencher drag/tap."
);

assert.ok(
  source.includes("touch-action:none;")&&
  source.includes("-webkit-touch-callout:none;")&&
  source.includes("-webkit-user-drag:none;")&&
  source.includes("pointer-events:none;"),
  "Le CSS doit neutraliser les comportements natifs concurrents."
);

const iconBlock=block(
  "      function iconeObjetAdventureIdleV138_(item){",
  "      /*\n       * Norman (2026-09-14) : \"tu dois copier la couleur"
);
assert.ok(
  (iconBlock.match(/draggable="false"/g)||[]).length>=3,
  "Toutes les images d'items doivent être explicitement non-draggables."
);

for(const fn of [
  ["function rendreSlotPaperdollAdventureIdleV138_","function rendreEmplacementAccessoireAdventureIdleV138_"],
  ["function rendreEmplacementAccessoireAdventureIdleV138_","function rendreAccessoiresAdventureIdleV138_"],
  ["function rendreCarteSacAdventureIdleV138_","function rendreGrilleSacAdventureIdleV1_"]
]){
  const rendered=block("      "+fn[0],"      "+fn[1]);
  assert.ok(
    !rendered.includes('draggable="true"')&&
    !rendered.includes("ondragstart=")&&
    !rendered.includes("ondragend=")&&
    !rendered.includes('onclick="window.__clic'),
    "Le rendu "+fn[0]+" ne doit plus embarquer de moteur concurrent."
  );
}

assert.ok(
  longPress.includes("var HOLD_MS=600;")&&
  longPress.includes("var MOVE_PX=32;")&&
  longPress.includes("document.addEventListener('touchstart'")&&
  longPress.includes("{capture:true,passive:false}")&&
  longPress.includes("new CustomEvent('soreal-longpress'"),
  "Le composant V197 doit posséder le vrai timer WebView et émettre soreal-longpress."
);

assert.ok(
  longPress.includes("document.addEventListener('touchcancel'")&&
  longPress.includes("elapsed>=120")&&
  longPress.includes("s.cancelledByBrowser=true"),
  "Un touchcancel WebView sur maintien immobile ne doit plus tuer le timer."
);

assert.ok(
  longPress.includes("data-soreal-longpress-ignore"),
  "Les contrôles explicites comme le bouton info doivent être exclus du maintien."
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
  "SOREAL IDLE Inventory V197: OK — tap/drag V196 séparé, long-press WebView réutilisable, bouton info direct."
);
