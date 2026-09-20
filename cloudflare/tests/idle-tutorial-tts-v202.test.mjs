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
const ui=fs.readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.ok(
  index.includes('/modules/tutorial-tts-v202.js?v=206')&&
  index.includes('/soreal-idle-ui.js?v=206')&&
  index.indexOf('/modules/tutorial-tts-v202.js?v=206')<
    index.indexOf('/soreal-idle-ui.js?v=206'),
  "Le TTS V203 doit être cache-busté et chargé avant l'UI principale."
);

for(const token of [
  "window.speechSynthesis",
  "SpeechSynthesisUtterance",
  "sorealIdleTutorielFlottantV1",
  "sorealIdleTutorielPagesModalV1",
  "sorealIdleNouveauteModalV75",
  "MutationObserver",
  "soreal_idle_tutorial_tts_auto_v202",
  "Lecture auto ON",
  "Lecture auto OFF",
  "u.lang='fr-BE'",
  "data-soreal-tts-target",
  "readTarget:lireCible_",
  "readText:function(value)",
  "__SOREAL_IDLE_TUTORIAL_TTS_V203__"
]){
  assert.ok(tts.includes(token),"TTS V203 manquant: "+token);
}

// Les cartes Settings doivent fournir des cibles TTS manuelles.
assert.ok(
  ui.includes("sorealIdleInfoRecapV203_")&&
  ui.includes("sorealIdleNarrateursV203_")&&
  ui.includes("data-soreal-tts-target="),
  "Settings > Info doit exposer des boutons de lecture TTS sur les explications et les textes Norman/Sébastien."
);

assert.ok(
  !/fetch\s*\(/.test(tts)&&
  !/new\s+Audio\s*\(/.test(tts)&&
  !/\.mp3|\.wav|\.ogg/i.test(tts),
  "Le TTS doit rester natif et léger : aucun téléchargement de voix/fichier audio."
);

new Function("window","document","localStorage",tts);
new Function(ui);

console.log(
  "SOREAL IDLE Tutorial TTS V203: OK — tutoriels, modales et relecture Settings utilisent SpeechSynthesis natif."
);
