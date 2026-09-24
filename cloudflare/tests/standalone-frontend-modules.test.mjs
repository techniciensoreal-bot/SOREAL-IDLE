import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root=new URL("../public/",import.meta.url);
const index=readFileSync(new URL("index.html",root),"utf8");

const modules=[
  "runtime.js",
  "ui.js",
  "adventure-scene-v79.js",
  "interaction-repair-v79.js",
  "basic-training-stability-v121.js",
  "item-images-r2-v74.js",
  "item-specials-early-v75.js",
  "item-infinity-cubes-r2-v78.js",
  "item-extra-r2-v77.js"
];

let previous=index.indexOf('/standalone-bridge.js');
assert.ok(previous>=0,"Le bridge standalone doit être chargé.");
assert.ok(index.includes("/modules/ui.js?v=50"),"Le module UI extrait doit être chargé.");
const extractedUi=index.indexOf("/modules/ui.js?v=50");
assert.ok(extractedUi>index.indexOf("/modules/runtime.js"),"Le module UI extrait doit être chargé après runtime.");

for(const name of modules){
  const file=new URL("modules/"+name,root);
  assert.ok(existsSync(file),"Module standalone manquant: "+name);
  const marker='/modules/'+name;
  const pos=index.indexOf(marker);
  assert.ok(pos>previous,"Ordre de chargement invalide pour "+name);
  previous=pos;
}

const mainUi=index.indexOf('/soreal-idle-ui.js');
assert.ok(mainUi>previous,"Les modules auxiliaires doivent être chargés avant l'UI principale.");

const runtime=readFileSync(new URL("modules/runtime.js",root),"utf8");
const adventure=readFileSync(new URL("modules/adventure-scene-v79.js",root),"utf8");
const itemImages=readFileSync(new URL("modules/item-images-r2-v74.js",root),"utf8");

assert.match(runtime,/window\.__SOREAL_IDLE_RUNTIME_V1__/);
assert.match(adventure,/window\.__SOREAL_IDLE_ADVENTURE_SCENE_V79__/);
assert.match(adventure,/\/api\/idle\/media\/mob\?/);
assert.match(adventure,/\/api\/idle\/media\/safe-zone\?/);
assert.match(adventure,/sorealIdleAdventureSceneMobV1/);
assert.match(itemImages,/\/api\/idle\/media\/item\?/);

assert.doesNotMatch(index,/tv-staging-session-bridge/i);

console.log("standalone frontend modules: ok");
