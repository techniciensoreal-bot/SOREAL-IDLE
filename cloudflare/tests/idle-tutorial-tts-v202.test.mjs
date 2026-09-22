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
  "VOICE_SELECT_CLASS='soreal-idle-tts-voice-v209'",
  "Choisir la voix IA",
  "updateVoiceSelector_",
  "changeVoice_",
  "api.setVoice",
  "voices:function()",
  "voice:function()",
  "setVoice:function(value)",
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
  "⚠️ Voix IA · ",
  "function ensureVoiceSelectAfter_(anchor)",
  "ensureVoiceSelectAfter_(button)"
]){
  assert.ok(narration.includes(token),"Narration V209 manquante: "+token);
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
 * Retour utilisateur : le sélecteur de voix n'apparaissait que dans les
 * 3 popups ponctuels (tutoriel début de jeu, tutoriel premier boss,
 * nouveauté), jamais à côté des boutons de lecture permanents (chroniques
 * de boss, Settings > Info) — d'où "je n'ai qu'une seule voix, pas
 * d'option pour changer". Le sélecteur doit désormais être attaché à
 * chaque bouton de lecture, pas seulement aux popups.
 */
{
  const start=narration.indexOf("function updateReadButtons_(){");
  const end=narration.indexOf("function afficherErreur_(",start);
  assert.ok(start>=0&&end>start,"updateReadButtons_ introuvable.");
  const body=narration.slice(start,end);
  assert.match(
    body,
    /ensureVoiceSelectAfter_\(button\)/,
    "Chaque bouton de lecture doit recevoir son propre sélecteur de voix, pas seulement les popups ponctuels."
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
  index.includes('"piper-plus": "https://cdn.jsdelivr.net/npm/piper-plus@0.7.0/src/index.js"')&&
  index.includes('"@piper-plus/g2p": "https://cdn.jsdelivr.net/npm/@piper-plus/g2p@0.4.2/src/index.js"')&&
  index.includes('"onnxruntime-web": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.mjs"')&&
  index.includes('/modules/local-neural-piper-v1.js?v=4')&&
  index.includes('/modules/tutorial-tts-v202.js?v=228'),
  "Piper Plus et le contrôleur multi-voix doivent être épinglés et cache-bustés."
);

new Function("window","document","localStorage",narration);
new Function(ui);

console.log(
  "SOREAL IDLE narration V209: OK — sélecteur de modèles Piper locaux, Web Audio, aucun SpeechSynthesis/TTS cloud."
);
