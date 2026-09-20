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
  source.includes("V195 — contrôleur UNIQUE des gestes d'inventaire"),
  "L'inventaire doit utiliser un contrôleur de gestes unique."
);

assert.ok(
  source.includes("const IDLE_ADVENTURE_GESTE_SEUIL_PX_V195=32;")&&
  source.includes("const IDLE_ADVENTURE_APPUI_LONG_MS_V195=600;")&&
  source.includes("const IDLE_ADVENTURE_DOUBLE_TAP_MS_V195=420;"),
  "Les seuils mobile doivent rester centralisés dans V195."
);

const controller=block(
  "      const IDLE_ADVENTURE_GESTE_SEUIL_PX_V195=32;",
  "      function idSourceAdventureIdleV138_(event){"
);

for(const eventName of ["touchstart","touchmove","touchend","touchcancel"]){
  assert.ok(
    controller.includes("document.addEventListener('"+eventName+"'"),
    "Gestion tactile manquante: "+eventName
  );
}

assert.ok(
  controller.includes("{capture:true,passive:false}"),
  "Les Touch Events doivent être interceptés en capture et non-passifs dans la WebView."
);

assert.ok(
  controller.includes("if(event.cancelable)event.preventDefault();")&&
  controller.includes("executerTapSimpleGesteAdventureIdleV195_"),
  "Le tactile doit gérer son tap lui-même au lieu de dépendre d'un clic synthétique WebView."
);

assert.ok(
  controller.includes("ouvrirDetailsObjetParGesteAdventureIdleV195_")&&
  controller.includes("estDoubleTapGesteAdventureIdleV195_"),
  "Maintien et double-tap doivent converger vers la même ouverture de détails."
);

for(const obsolete of [
  "attributsAppuiLongAdventureIdleV165_",
  "doubleTapObjetAdventureIdleV194_",
  "ouvrirDetailsObjetTactileAdventureIdleV194_",
  "interactionTactileRecenteAdventureIdleV165_",
  "idleAdventurePointerDragV180"
]){
  assert.ok(
    !source.includes(obsolete),
    "Ancienne couche de geste encore présente: "+obsolete
  );
}

const bagClick=block(
  "      function clicCarteAdventureIdleV138_(event,itemId){",
  "      window.__debutDragAdventureIdleV138__="
);
assert.ok(
  !bagClick.includes("afficherDetailsObjetAdventureIdleV138_("),
  "Un clic simple sur un item du sac ne doit jamais ouvrir le popup."
);

const equipmentClick=block(
  "      function clicCibleAdventureIdleV138_(slotName,occupantId){",
  "      function clicTrashAdventureIdleV138_(){"
);
assert.ok(
  !equipmentClick.includes("afficherDetailsObjetAdventureIdleV138_("),
  "Un clic simple sur un item équipé ne doit jamais ouvrir le popup."
);

assert.ok(
  source.includes("touch-action:none;")&&
  source.includes("-webkit-touch-callout:none;"),
  "Les items tactiles doivent rester protégés du callout/drag natif de la WebView."
);

new Function(source);

console.log(
  "SOREAL IDLE Inventory V195: OK — contrôleur unique WebView, maintien 600 ms, double-tap, drag tactile et aucun popup au clic simple."
);
