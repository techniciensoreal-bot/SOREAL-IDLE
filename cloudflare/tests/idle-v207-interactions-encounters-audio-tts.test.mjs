import assert from "node:assert/strict";
import fs from "node:fs";

const ui=fs.readFileSync(new URL("../public/soreal-idle-ui.js",import.meta.url),"utf8");
const runtime=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");
const audio=fs.readFileSync(new URL("../public/modules/audio-effects-v199.js",import.meta.url),"utf8");
const tts=fs.readFileSync(new URL("../public/modules/tutorial-tts-v202.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../public/index.html",import.meta.url),"utf8");

assert.ok(index.includes("/modules/audio-effects-v199.js?v=210"));
assert.ok(index.includes("/modules/tutorial-tts-v202.js?v=210"));
assert.ok(index.includes("/soreal-idle-ui.js?v=213"));

for(const token of [
  "popupDetailsObjetAdventureIdleOuvertV207_",
  "fermerPopupDetailsSiExterieurAdventureIdleV207_",
  "idleAdventureSelectionIdV138=objet",
  "cibleDansPopupDetailsObjetAdventureIdleV207_"
]){
  assert.ok(ui.includes(token),"Popup item V207 manquant: "+token);
}

for(const token of [
  "marquerRencontreBossPrincipalUneFoisParRunV207_",
  "bestiaireBossRunVersionV207",
  "bestiaireBossRunMaxNumeroV207",
  "rencontresBossAffichageV207",
  "rencontresBossAffichageV207[i + 1]"
]){
  assert.ok(runtime.includes(token),"Rencontres Boss V207 manquantes: "+token);
}
assert.ok(runtime.includes("stats.bestiaireBossRunMaxNumeroV207=0"));

for(const token of [
  "mergeAccessory:{group:\"inventory-merge\"",
  "uiClick:{group:\"ui-click\"",
  "function fusionAccessoire_()",
  "function clicInterface_()",
  "mergeAccessory:fusionAccessoire_",
  "uiClick:clicInterface_"
]){
  assert.ok(audio.includes(token),"Audio V207 manquant: "+token);
}
assert.ok(ui.includes("return 'mergeAccessory';"));
assert.ok(ui.includes("jouerEffetAudioIdleV199_('uiClick')"));

for(const token of [
  "function decouperTexteAndroidV207_",
  "phrase.length>220",
  "speechGeneration",
  "synth.resume()",
  "setTimeout(function(){parler(index+1,false);},35)"
]){
  assert.ok(tts.includes(token),"TTS Android V207 manquant: "+token);
}

new Function(ui);
new Function("window","document",audio);
new Function("window","document","localStorage",tts);

console.log("SOREAL IDLE V207: OK — popup, rencontres, audio et TTS Android.");