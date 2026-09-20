import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.match(
  ui,
  /const IDLE_ADVENTURE_APPUI_LONG_MS_V194=600/,
  "L'appui long mobile doit ouvrir le popup rapidement, sans attendre une seconde."
);

assert.match(
  ui,
  /const IDLE_ADVENTURE_GESTE_SEUIL_PX_V182=32/,
  "L'appui long doit tolérer les micro-mouvements naturels du doigt."
);

const longStart=ui.indexOf("function debutAppuiLongAdventureIdleV165_");
const longEnd=ui.indexOf("function bougerAppuiLongAdventureIdleV165_",longStart);
assert.ok(longStart>=0&&longEnd>longStart,"Gestionnaire d'appui long introuvable.");
const longBlock=ui.slice(longStart,longEnd);

assert.match(
  longBlock,
  /restaurerDraggablePointerAdventureIdleV182_\(drag\)/,
  "Un appui long réussi doit restaurer l'état draggable de l'item."
);

assert.match(
  longBlock,
  /afficherDetailsObjetAdventureIdleV138_\(id\)/,
  "Un appui long réussi doit ouvrir directement le popup de l'item."
);

assert.match(
  ui,
  /const IDLE_ADVENTURE_DOUBLE_TAP_MS_V194=420/,
  "Le fallback double-tap mobile doit rester présent."
);

assert.match(
  ui,
  /function doubleTapObjetAdventureIdleV194_\(id\)/,
  "Le détecteur de double-tap doit exister."
);

const cardStart=ui.indexOf("function clicCarteAdventureIdleV138_");
const cardEnd=ui.indexOf("window.__debutDragAdventureIdleV138__",cardStart);
assert.ok(cardStart>=0&&cardEnd>cardStart,"Gestionnaire de tap du sac introuvable.");
const cardBlock=ui.slice(cardStart,cardEnd);

assert.match(
  cardBlock,
  /doubleTapObjetAdventureIdleV194_\(id\)[\s\S]*?ouvrirDetailsObjetTactileAdventureIdleV194_\(id\)/,
  "Un double-tap sur un item du sac doit ouvrir son popup."
);

const slotStart=ui.indexOf("function clicCibleAdventureIdleV138_");
const slotEnd=ui.indexOf("function clicTrashAdventureIdleV138_",slotStart);
assert.ok(slotStart>=0&&slotEnd>slotStart,"Gestionnaire de tap d'équipement introuvable.");
const slotBlock=ui.slice(slotStart,slotEnd);

assert.match(
  slotBlock,
  /doubleTapObjetAdventureIdleV194_\(occupant\)[\s\S]*?ouvrirDetailsObjetTactileAdventureIdleV194_\(occupant\)/,
  "Un double-tap sur un item équipé doit ouvrir son popup."
);

console.log("Inventory mobile item popup gestures: OK");
