import assert from "node:assert/strict";
import fs from "node:fs";

const tts=fs.readFileSync(
  new URL("../public/modules/tutorial-tts-v202.js",import.meta.url),
  "utf8"
);
const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

assert.ok(
  index.includes('/modules/tutorial-tts-v202.js?v=202')&&
  index.indexOf('/modules/tutorial-tts-v202.js?v=202')<
    index.indexOf('/soreal-idle-ui.js?v=200'),
  "Le TTS doit être chargé avant l'UI principale."
);

for(const token of [
  "window.speechSynthesis",
  "SpeechSynthesisUtterance",
  ".soreal-idle-tuto-flottant-drag-v1",
  "MutationObserver",
  "soreal_idle_tutorial_tts_auto_v202",
  "Lecture auto ON",
  "Lecture auto OFF",
  "u.lang='fr-BE'",
  "localStorage.setItem(KEY,auto?'1':'0')"
]){
  assert.ok(tts.includes(token),"TTS V202 manquant: "+token);
}

assert.ok(
  !/fetch\s*\(/.test(tts)&&
  !/new\s+Audio\s*\(/.test(tts)&&
  !/\.mp3|\.wav|\.ogg/i.test(tts),
  "Le TTS doit rester natif et léger : aucun téléchargement de voix/fichier audio."
);

new Function("window","document","localStorage",tts);

console.log(
  "SOREAL IDLE Tutorial TTS V202: OK — SpeechSynthesis natif, toggle persistant, lecture auto des panneaux."
);
