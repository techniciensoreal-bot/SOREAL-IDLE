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
  "__SOREAL_IDLE_TUTORIAL_TTS_V206__",
  "/api/v1/narration",
  "authorization:'Bearer '+session",
  "URL.createObjectURL(blob)",
  "revokeObjectUrl_",
  "decouperNarration_",
  "CHUNK_MAX=2000",
  "⚠️ Voix IA indisponible"
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

assert.ok(
  narration.includes("fetch('/api/v1/narration'")&&
  !/https?:\/\/(api\.)?(elevenlabs|openai|deepgram)\./i.test(narration),
  "Le navigateur doit appeler uniquement la route SOREAL-IDLE."
);

new Function("window","document","localStorage",narration);
new Function(ui);

console.log(
  "SOREAL IDLE narration V206: OK — neural only, aucun SpeechSynthesis."
);
