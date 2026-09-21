import assert from "node:assert/strict";
import fs from "node:fs";

const narration=fs.readFileSync(
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

const narrationScript=/\/modules\/tutorial-tts-v202\.js\?v=\d+/.exec(index);
const uiScript=/\/soreal-idle-ui\.js\?v=\d+/.exec(index);

assert.ok(
  narrationScript&&uiScript&&narrationScript.index<uiScript.index,
  "La narration neurale doit être cache-bustée et chargée avant l'UI principale."
);

for(const token of [
  "sorealIdleTutorielFlottantV1",
  "sorealIdleTutorielPagesModalV1",
  "sorealIdleNouveauteModalV75",
  "MutationObserver",
  "soreal_idle_tutorial_tts_auto_v202",
  "Voix IA auto ON",
  "Voix IA auto OFF",
  "data-soreal-tts-target",
  "readTarget:lireCible_",
  "readText:function(value,audioSrc)",
  "function stop_()",
  "⏹ Arrêter la narration",
  "stop:stop_",
  "isSpeaking:function()",
  "__SOREAL_IDLE_TUTORIAL_TTS_V208__",
  "__SOREAL_IDLE_LOCAL_NEURAL_V1__",
  "requestLocalNeuralAudio_",
  "PIPER_LOCAL_MODULE_TIMEOUT",
  "Chargement voix IA",
  "playBlobWebAudioPromise_",
  "unlockAudio_",
  "audioState:function()",
  "WEB_AUDIO_BLOQUE_",
  "revokeObjectUrl_",
  "decouperNarration_",
  "CHUNK_MAX=2000",
  "⚠️ Voix IA · "
]){
  assert.ok(narration.includes(token),"Narration V206 manquante: "+token);
}

for(const forbidden of [
  "window.speechSynthesis",
  "SpeechSynthesisUtterance",
  "speechSupported_",
  "synth.speak(",
  "synth.resume()",
  "voiceFr_(",
  "decouperTexteAndroidV207_"
]){
  assert.ok(
    !narration.includes(forbidden),
    "Le TTS navigateur doit être totalement supprimé: "+forbidden
  );
}

assert.ok(
  ui.includes("sorealIdleInfoRecapV203_")&&
  ui.includes("sorealIdleNarrateursV203_")&&
  ui.includes("data-soreal-tts-target="),
  "Settings > Info doit conserver ses boutons de lecture."
);

for(const forbidden of [
  "/api/v1/narration",
  "authorization:'Bearer '+session",
  "requestNeuralAudio_"
]){
  assert.ok(
    !narration.includes(forbidden),
    "Le lecteur client ne doit plus dépendre du TTS cloud: "+forbidden
  );
}

assert.ok(
  index.includes('"piper-plus": "https://cdn.jsdelivr.net/npm/piper-plus@0.7.0/src/index.js"')&&
  index.includes('"@piper-plus/g2p": "https://cdn.jsdelivr.net/npm/@piper-plus/g2p@0.4.2/src/index.js"')&&
  index.includes('"onnxruntime-web": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.mjs"')&&
  index.includes('/modules/local-neural-piper-v1.js?v=2'),
  "Piper Plus, son G2P et ONNX Runtime doivent être épinglés et le module local doit être chargé."
);

new Function("window","document","localStorage",narration);
new Function(ui);

console.log(
  "SOREAL IDLE narration V208: OK — Piper local + Web Audio déverrouillé, aucun SpeechSynthesis ni TTS cloud client."
);
