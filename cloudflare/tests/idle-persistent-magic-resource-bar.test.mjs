import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui=readFileSync("cloudflare/public/soreal-idle-ui.js","utf8");
const css=readFileSync("cloudflare/public/soreal-idle-ui.css","utf8");

assert.ok(
  ui.includes("function rendreBarreEnergiePersistanteIdleV1_(j){"),
  "le shell persistant des ressources doit exister"
);
assert.ok(
  ui.includes("systemes.resourceInfo&&systemes.resourceInfo.magic"),
  "la barre Magic doit être conditionnée par la ressource Magic réellement débloquée"
);
assert.ok(
  ui.includes('id="sorealIdleMagicBarV1"') &&
  ui.includes('id="sorealIdleMagicOverlayV1"') &&
  ui.includes("🔮 Magie"),
  "la barre bleue Magic doit être rendue dans le shell persistant"
);
assert.ok(
  ui.includes("${rendreBarreEnergiePersistanteIdleV1_(j)}"),
  "le shell Energy/Magic doit rester rendu avant le contenu de chaque menu"
);
assert.ok(
  ui.includes("function assurerBarreMagicPersistanteIdleV1_()") &&
  ui.includes("if(!document.getElementById('sorealIdleMagicBarV1'))"),
  "le déblocage live de Magic doit reconstruire le shell si la barre manque"
);
assert.ok(
  ui.includes("assurerBarreMagicPersistanteIdleV1_();"),
  "la garde Magic globale doit être exécutée par le ticker"
);
assert.ok(
  css.includes(".soreal-idle-energybar-v11.soreal-idle-magicbar-v1{") &&
  css.includes("linear-gradient(90deg,#2f8cff,#73c7ff)"),
  "la ressource Magic doit utiliser un sélecteur plus spécifique que la barre Energy verte"
);

console.log("idle-persistent-magic-resource-bar: OK");
