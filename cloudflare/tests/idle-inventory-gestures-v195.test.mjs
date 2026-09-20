import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
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
  "L'inventaire doit utiliser le contrôleur unique V196."
);

assert.ok(
  source.includes("const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;")&&
  source.includes("const IDLE_ADVENTURE_APPUI_LONG_MS_V196=600;")&&
  source.includes("const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;"),
  "Les seuils du geste doivent rester centralisés dans V196."
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
    "Pointer Event manquant: "+eventName
  );
}

assert.ok(
  controller.includes("setPointerCapture(event.pointerId)"),
  "Le geste doit capturer explicitement le pointeur."
);

assert.ok(
  controller.includes("document.addEventListener('touchstart'")&&
  controller.includes("{capture:true,passive:false}")&&
  controller.includes("if(event.cancelable)event.preventDefault();"),
  "WKWebView doit avoir un touchstart actif servant uniquement de garde native."
);

assert.ok(
  controller.includes("document.addEventListener('contextmenu'")&&
  controller.includes("document.addEventListener('click'"),
  "Les menus/clics synthétiques natifs doivent être neutralisés."
);

assert.ok(
  controller.includes("ouvrirDetailsObjetParGesteAdventureIdleV196_")&&
  controller.includes("estDoubleTapGesteAdventureIdleV196_")&&
  controller.includes("executerTapObjetAdventureIdleV196_")&&
  controller.includes("appliquerDepotGesteAdventureIdleV196_"),
  "Tap, double-tap, maintien et drag doivent converger dans le même contrôleur."
);

assert.ok(
  source.includes("touch-action:none;")&&
  source.includes("-webkit-touch-callout:none;")&&
  source.includes("-webkit-user-drag:none;")&&
  source.includes("pointer-events:none;"),
  "Le CSS doit neutraliser pan/callout/drag natifs sur les items et leurs images."
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
    !rendered.includes("ondrop=")&&
    !rendered.includes('onclick="window.__clic'),
    "Le rendu "+fn[0]+" ne doit plus embarquer de moteur d'interaction concurrent."
  );
}

for(const obsolete of [
  "V195 — contrôleur UNIQUE des gestes d'inventaire",
  "idleAdventureGesteV195",
  "IDLE_ADVENTURE_APPUI_LONG_MS_V195"
]){
  assert.ok(
    !source.includes(obsolete),
    "Ancien contrôleur encore présent: "+obsolete
  );
}

new Function(source);

console.log(
  "SOREAL IDLE Inventory V196: OK — Pointer Events unique, pointer capture, garde WKWebView, aucun drag HTML natif."
);
