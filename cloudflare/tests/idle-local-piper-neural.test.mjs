import assert from "node:assert/strict";
import fs from "node:fs";

const index=fs.readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);
const local=fs.readFileSync(
  new URL("../public/modules/local-neural-piper-v1.js",import.meta.url),
  "utf8"
);
const narration=fs.readFileSync(
  new URL("../public/modules/tutorial-tts-v202.js",import.meta.url),
  "utf8"
);

for(const token of [
  '"piper-plus": "https://cdn.jsdelivr.net/npm/piper-plus@0.7.0/src/index.js"',
  '"@piper-plus/g2p": "https://cdn.jsdelivr.net/npm/@piper-plus/g2p@0.4.2/src/index.js"',
  '"onnxruntime-web": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.mjs"',
  '<script type="module" src="/modules/local-neural-piper-v1.js?v=5"></script>',
  '/modules/tutorial-tts-v202.js?v=230'
]){
  assert.ok(index.includes(token),"Piper local index manquant: "+token);
}

assert.ok(
  index.indexOf('/modules/local-neural-piper-v1.js?v=5')<
  index.indexOf('/modules/tutorial-tts-v202.js?v=230'),
  "Le module Piper local doit être déclaré avant le contrôleur de narration."
);

/*
 * Demande utilisateur (2026-09-22) : une seule voix (Tom, fr_FR-tom-medium),
 * choisie après écoute comparative des voix officielles Piper via
 * https://rhasspy.github.io/piper-samples/. Le multi-voix (V9) et son
 * correctif de persistance (V9.1) sont retirés — cf. docs/WORKLOG.md.
 */
for(const token of [
  'import { PiperPlus } from "piper-plus"',
  'import * as ort from "onnxruntime-web"',
  'MODEL_URL_V1=new URL("/api/idle/media/piper-model.onnx"',
  'PiperPlus.initialize({',
  'config.soreal_monolingual_g2p_compat',
  'delete config.language_id_map',
  'delete config.num_languages',
  'engine.synthesize(value,{',
  'language:LANGUAGE_V1',
  'lengthScale:LENGTH_SCALE_V1',
  'result.toBlob()',
  '__SOREAL_IDLE_LOCAL_NEURAL_V1__'
]){
  assert.ok(local.includes(token),"Piper local (voix unique) manquant: "+token);
}

for(const forbidden of [
  "SpeechSynthesisUtterance",
  "speechSynthesis",
  "/api/v1/narration",
  "xai/grok-tts",
  "@cf/myshell-ai/melotts",
  "huggingface.co/",
  "VOICES_V2",
  "selectedVoiceId",
  "setVoice_",
  "voices_",
  "voicePublic_",
  "savedVoiceId_",
  "label:\"SOREAL\"",
  "label:\"Siwis\"",
  "label:\"Gilles\""
]){
  assert.ok(!local.includes(forbidden),"Piper local ne doit plus contenir (multi-voix retiré): "+forbidden);
}

for(const token of [
  "__SOREAL_IDLE_LOCAL_NEURAL_V1__",
  "requestLocalNeuralAudio_",
  "waitLocalNeuralApi_",
  "playBlobWebAudioPromise_",
  "unlockAudio_"
]){
  assert.ok(narration.includes(token),"Contrôleur narration manquant: "+token);
}

for(const forbidden of [
  "/api/v1/narration",
  "requestNeuralAudio_",
  "authorization:'Bearer '+session",
  "SpeechSynthesisUtterance",
  "speechSynthesis",
  "VOICE_SELECT_CLASS",
  "GLOBAL_VOICE_HOST_ID",
  "ensureGlobalVoiceControl_",
  "updateVoiceSelector_",
  "changeVoice_",
  "Choisir la voix IA",
  "api.setVoice"
]){
  assert.ok(!narration.includes(forbidden),"Sélecteur de voix ou ancien chemin TTS encore présent: "+forbidden);
}

new Function(
  local
    .replace(/^import[^\n]+\n/gm,"")
    .replace(/window\.__SOREAL_IDLE_LOCAL_NEURAL_V1__=api;/,"")
);
new Function("window","document","localStorage",narration);

console.log("idle local Piper: OK — voix unique (Tom), aucun sélecteur, aucun TTS cloud/système.");
