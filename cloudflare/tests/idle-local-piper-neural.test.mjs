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
  '"onnxruntime-web": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.mjs"',
  '<script type="module" src="/modules/local-neural-piper-v1.js?v=1"></script>',
  '/modules/tutorial-tts-v202.js?v=225'
]){
  assert.ok(index.includes(token),"Piper local index manquant: "+token);
}

assert.ok(
  index.indexOf('/modules/local-neural-piper-v1.js?v=1')<
  index.indexOf('/modules/tutorial-tts-v202.js?v=225'),
  "Le module Piper local doit être déclaré avant le contrôleur de narration."
);

for(const token of [
  'import { PiperPlus } from "piper-plus"',
  'import * as ort from "onnxruntime-web"',
  'MODEL_V1="ayousanz/piper-plus-css10-ja-6lang"',
  'LANGUAGE_V1="fr"',
  'PiperPlus.initialize({',
  'engine.synthesize(value,{',
  'language:LANGUAGE_V1',
  'lengthScale:LENGTH_SCALE_V1',
  'result.toBlob()',
  '__SOREAL_IDLE_LOCAL_NEURAL_V1__',
  'synthesize:synthesize_',
  'preload:engine_',
  'subscribe:subscribe_'
]){
  assert.ok(local.includes(token),"Piper local manquant: "+token);
}

for(const forbidden of [
  "SpeechSynthesisUtterance",
  "speechSynthesis",
  "/api/v1/narration",
  "xai/grok-tts",
  "@cf/myshell-ai/melotts"
]){
  assert.ok(!local.includes(forbidden),"Piper local ne doit pas contenir: "+forbidden);
}

for(const token of [
  "__SOREAL_IDLE_LOCAL_NEURAL_V1__",
  "requestLocalNeuralAudio_",
  "waitLocalNeuralApi_",
  "Chargement voix IA",
  "Génération voix IA"
]){
  assert.ok(narration.includes(token),"Contrôleur Piper local manquant: "+token);
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

console.log("idle local Piper: OK — français neural local, modèle lazy, aucun TTS cloud/système client.");
