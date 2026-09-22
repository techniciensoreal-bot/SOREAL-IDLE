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
  '<script type="module" src="/modules/local-neural-piper-v1.js?v=4"></script>',
  '/modules/tutorial-tts-v202.js?v=229'
]){
  assert.ok(index.includes(token),"Piper local index manquant: "+token);
}

assert.ok(
  index.indexOf('/modules/local-neural-piper-v1.js?v=4')<
  index.indexOf('/modules/tutorial-tts-v202.js?v=229'),
  "Le module Piper local doit être déclaré avant le contrôleur de narration."
);

for(const token of [
  'import { PiperPlus } from "piper-plus"',
  'import * as ort from "onnxruntime-web"',
  'VOICE_STORAGE_KEY_V2="soreal_idle_piper_voice_v2"',
  'DEFAULT_VOICE_ID_V2="soreal"',
  '/api/idle/media/piper-voice-soreal.onnx',
  '/api/idle/media/piper-voice-siwis.onnx',
  '/api/idle/media/piper-voice-gilles.onnx',
  'label:"SOREAL"',
  'label:"Siwis"',
  'label:"Gilles"',
  'function setVoice_(voiceId)',
  'localStorage.setItem(VOICE_STORAGE_KEY_V2,id)',
  'disposeEngine_()',
  'engineGeneration+=1',
  'PiperPlus.initialize({',
  'config.soreal_monolingual_g2p_compat',
  'delete config.language_id_map',
  'delete config.num_languages',
  'engine.synthesize(value,{',
  'language:LANGUAGE_V1',
  'lengthScale:LENGTH_SCALE_V1',
  'result.toBlob()',
  '__SOREAL_IDLE_LOCAL_NEURAL_V1__',
  'voices:voices_',
  'setVoice:setVoice_'
]){
  assert.ok(local.includes(token),"Piper local multi-voix manquant: "+token);
}

for(const forbidden of [
  "SpeechSynthesisUtterance",
  "speechSynthesis",
  "/api/v1/narration",
  "xai/grok-tts",
  "@cf/myshell-ai/melotts",
  "huggingface.co/"
]){
  assert.ok(!local.includes(forbidden),"Piper local ne doit pas contenir: "+forbidden);
}

for(const token of [
  "__SOREAL_IDLE_LOCAL_NEURAL_V1__",
  "requestLocalNeuralAudio_",
  "waitLocalNeuralApi_",
  "VOICE_SELECT_CLASS='soreal-idle-tts-voice-v209'",
  "Choisir la voix IA",
  "changeVoice_",
  "api.setVoice",
  "Voix · ",
  "playBlobWebAudioPromise_",
  "unlockAudio_"
]){
  assert.ok(narration.includes(token),"Contrôleur Piper multi-voix manquant: "+token);
}

for(const forbidden of [
  "/api/v1/narration",
  "requestNeuralAudio_",
  "authorization:'Bearer '+session",
  "SpeechSynthesisUtterance",
  "speechSynthesis"
]){
  assert.ok(!narration.includes(forbidden),"Ancien chemin TTS encore actif: "+forbidden);
}

new Function(
  local
    .replace(/^import[^\n]+\n/gm,"")
    .replace(/window\.__SOREAL_IDLE_LOCAL_NEURAL_V1__=api;/,"")
);
new Function("window","document","localStorage",narration);

console.log("idle local Piper V9: OK — 3 modèles vocaux sélectionnables, persistants, aucun TTS cloud/système.");
