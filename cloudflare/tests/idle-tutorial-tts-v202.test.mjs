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

const ttsScript=/\/modules\/tutorial-tts-v202\.js\?v=\d+/.exec(index);
const uiScript=/\/soreal-idle-ui\.js\?v=\d+/.exec(index);

assert.ok(
  ttsScript&&
  uiScript&&
  ttsScript.index<uiScript.index,
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
  "decouperTexteAndroidV207_",
  "phrase.length>220",
  "synth.resume()",
  "speechGeneration",
  "u.lang=voice&&voice.lang?String(voice.lang):'fr-FR'",
  "data-soreal-tts-target",
  "readTarget:lireCible_",
  "readText:function(value,audioSrc)",
  "function stop_()",
  "⏹ Arrêter la lecture",
  "stop:stop_",
  "isSpeaking:function()",
  "speak_(text,attempt+1,force,targetId)",
  "__SOREAL_IDLE_TUTORIAL_TTS_V203__",
  "__SOREAL_IDLE_TUTORIAL_TTS_V204__",
  "__SOREAL_IDLE_TUTORIAL_TTS_V205__",
  "__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__",
  "data-soreal-tts-audio-src",
  "new Audio(src)",
  "audio.play()",
  "audio.onerror=fallback_",
  "readWithAudioFallback_",
  "Boolean(activeAudio)",
  "/api/v1/narration",
  "requestNeuralAudio_",
  "authorization:'Bearer '+session",
  "URL.createObjectURL(blob)",
  "revokeObjectUrl_"
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
  tts.includes("fetch('/api/v1/narration'")&&
  !/https?:\/\/(api\.)?(elevenlabs|openai|deepgram)\./i.test(tts),
  "Le navigateur doit appeler uniquement la route SOREAL-IDLE, jamais un fournisseur TTS externe directement."
);
assert.ok(
  tts.includes("if(src&&playAudio_(src,text,targetId))return true;")&&
  tts.includes("if(speechSupported_()){")&&
  tts.includes("speak_(text,0,true,targetId);"),
  "Un audio pré-généré doit être prioritaire avec fallback SpeechSynthesis en cas d'échec."
);

new Function("window","document","localStorage",tts);
new Function(ui);

console.log(
  "SOREAL IDLE narration V205: OK — audio pré-généré, Workers AI/R2 puis SpeechSynthesis en fallback."
);
