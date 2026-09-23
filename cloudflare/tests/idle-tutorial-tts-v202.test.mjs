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
  "__SOREAL_IDLE_TUTORIAL_TTS_V209__",
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
  assert.ok(narration.includes(token),"Narration V210 manquante: "+token);
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

/*
 * Historique du sélecteur de voix (retiré) :
 * V9 : sélecteur seulement dans 3 popups ponctuels, jamais visible en
 *      usage réel — "je n'ai qu'une seule voix, pas d'option pour changer".
 * V9.1 : sélecteur attaché à chaque bouton "Lire", mais détruit en
 *        continu par rendreIdleEtat_ (remplace #app.innerHTML à chaque
 *        synchronisation serveur) — "ça reste sur Voix SOREAL".
 * V9.2 : sélecteur global persistant (document.body), fonctionnel.
 * 2026-09-22 : demande explicite de l'utilisateur après avoir comparé les
 * voix officielles Piper (https://rhasspy.github.io/piper-samples/) —
 * une seule voix (Tom), sans choix. Tout l'appareillage de sélection est
 * donc retiré ; ces gardes empêchent qu'il ne soit réintroduit par erreur.
 */
for(const forbidden of [
  "VOICE_SELECT_CLASS",
  "GLOBAL_VOICE_HOST_ID",
  "ensureGlobalVoiceControl_",
  "updateVoiceSelector_",
  "changeVoice_",
  "Choisir la voix IA",
  "api.setVoice",
  "voices:function()",
  "voice:function()",
  "setVoice:function(value)"
]){
  assert.ok(
    !narration.includes(forbidden),
    "Le sélecteur de voix (retiré, une seule voix désormais) est réapparu: "+forbidden
  );
}

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
  index.includes('"onnxruntime-web": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.mjs"')&&
  index.includes('<script src="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js" integrity="sha384-PMufGRTCTqKC0tPjOTp2UFXycN+yWWjDareOeoy106zJZAHPijaeHDAX/4Pi0I5S" crossorigin="anonymous"></script>')&&
  index.includes('/modules/local-neural-piper-v1.js?v=6')&&
  index.includes('/modules/tutorial-tts-v202.js?v=230'),
  "Le phonémiseur espeak-ng et le contrôleur de narration doivent être épinglés et cache-bustés."
);
assert.ok(
  !index.includes("piper-plus"),
  "Import map ne doit plus référencer piper-plus."
);

new Function("window","document","localStorage",narration);
new Function(ui);

console.log(
  "SOREAL IDLE narration V210: OK — voix unique (Tom), Web Audio, aucun SpeechSynthesis/TTS cloud."
);
