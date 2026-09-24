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
  '"onnxruntime-web": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.mjs"',
  '<script src="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js" integrity="sha384-PMufGRTCTqKC0tPjOTp2UFXycN+yWWjDareOeoy106zJZAHPijaeHDAX/4Pi0I5S" crossorigin="anonymous"></script>',
  '<script type="module" src="/modules/local-neural-piper-v1.js?v=7"></script>',
  '/modules/tutorial-tts-v202.js?v=230'
]){
  assert.ok(index.includes(token),"Piper local index manquant: "+token);
}

for(const forbidden of [
  "piper-plus",
  "@piper-plus/g2p"
]){
  assert.ok(!index.includes(forbidden),"Import map ne doit plus référencer piper-plus: "+forbidden);
}

assert.ok(
  index.indexOf('piper_phonemize.js')<
  index.indexOf('/modules/local-neural-piper-v1.js?v=7'),
  "Le phonémiseur espeak-ng doit être chargé avant le module Piper local."
);
assert.ok(
  index.indexOf('/modules/local-neural-piper-v1.js?v=7')<
  index.indexOf('/modules/tutorial-tts-v202.js?v=230'),
  "Le module Piper local doit être déclaré avant le contrôleur de narration."
);

/*
 * Demande utilisateur (2026-09-22) : voix unique (Tom, fr_FR-tom-medium)
 * synthétisée avec le vrai espeak-ng (@diffusionstudio/piper-wasm) au lieu
 * du phonémiseur maison de piper-plus, root-causé comme incompatible avec
 * les modèles Piper officiels (accent étranger, mauvaise prononciation) —
 * cf. docs/WORKLOG.md.
 */
for(const token of [
  'import * as ort from "onnxruntime-web"',
  'MODEL_URL_V1=new URL("/api/idle/media/piper-model.onnx"',
  'window.createPiperPhonemize',
  'espeak_data',
  'ort.InferenceSession.create(modelBuffer)',
  'ort.Tensor("int64"',
  'ort.Tensor("float32"',
  'pcm2wav_',
  'normalizeEllipsis_',
  '__SOREAL_IDLE_LOCAL_NEURAL_V1__'
]){
  assert.ok(local.includes(token),"Piper local (espeak-ng réel) manquant: "+token);
}

/*
 * Demande utilisateur (2026-09-22) : "il ne s'arrête pas aux points de
 * suspension". Confirmé en comparant les flux de phonèmes bruts en
 * conditions réelles : espeak-ng (via piper_phonemize) abandonne
 * silencieusement "..."/"…" sans générer de phonème de pause, alors que
 * "." fonctionne. On normalise donc vers "." avant phonémisation.
 */
{
  const normalizeEllipsis_=new Function(
    "text",
    "return (" + local.match(/function normalizeEllipsis_\(text\)\{[\s\S]*?\n\}/)[0].replace(/^function normalizeEllipsis_\(text\)/,"function(text)") + ")(text);"
  );
  assert.equal(normalizeEllipsis_("Bonjour... Ca va ?"),"Bonjour. Ca va ?","Trois points ASCII doivent devenir un point simple");
  assert.equal(normalizeEllipsis_("Bonjour… Ca va ?"),"Bonjour. Ca va ?","Le caractère unicode … doit devenir un point simple");
  assert.equal(normalizeEllipsis_("Attends.... vraiment ?"),"Attends. vraiment ?","Une suite de 4 points doit devenir un point simple");
  assert.equal(normalizeEllipsis_("Bonjour. Ca va ?"),"Bonjour. Ca va ?","Un point simple ne doit pas être altéré");
}

/*
 * Norman (2026-09-24) : « Voix ia - 1060760 ». Reproduit en direct : espeak-ng (WASM) lève une exception C++ vue comme un nombre
 * quand le texte contient un demi-caractère UTF-16 isolé ; l'affichage montrait ce nombre brut.
 */
{
  const sanitizeText_=new Function(
    "text",
    "return (" + local.match(/function sanitizeText_\(text\)\{[\s\S]*?\n\}/)[0].replace(/^function sanitizeText_\(text\)/,"function(text)") + ")(text);"
  );
  const wasmError_=new Function(
    "error","label",
    "return (" + local.match(/function wasmError_\(error,label\)\{[\s\S]*?\n\}/)[0].replace(/^function wasmError_\(error,label\)/,"function(error,label)") + ")(error,label);"
  );
  const haut=String.fromCharCode(0xd83d);
  const bas=String.fromCharCode(0xde00);
  assert.equal(sanitizeText_("un "+haut+" deux"),"un deux","demi-caractère haut isolé");
  assert.equal(sanitizeText_("x"+bas+"y"),"x y","demi-caractère bas isolé");
  assert.equal(sanitizeText_("fin"+haut),"fin","demi-caractère coupé en fin de texte");
  assert.equal(sanitizeText_("ok "+haut+bas+" !"),"ok "+haut+bas+" !","un emoji complet est conservé");
  assert.equal(sanitizeText_("a"+String.fromCharCode(0)+"b"+String.fromCharCode(7)+"c"),"a b c","caractères de contrôle remplacés");
  assert.equal(sanitizeText_(null),"");
  assert.equal(sanitizeText_("  Bonjour   le   monde  "),"Bonjour le monde");
  assert.equal(wasmError_(1060760,"PIPER_LOCAL_PHONEMIZE").message,"PIPER_LOCAL_PHONEMIZE_EXCEPTION_WASM_1060760","un nombre lancé par le WASM devient une erreur lisible");
  const vraie=new Error("déjà lisible");
  assert.equal(wasmError_(vraie,"X"),vraie);
  assert.ok(local.includes("JSON.stringify([{text:sanitizeText_(text)}])"),"le texte envoyé à espeak-ng est nettoyé");
  assert.ok(local.includes("normalizeEllipsis_(sanitizeText_(text))"),"la synthèse nettoie aussi le texte");
}

for(const forbidden of [
  "PiperPlus",
  "@piper-plus/g2p",
  "soreal_monolingual_g2p_compat",
  "language_id_map",
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
  assert.ok(!local.includes(forbidden),"Piper local (espeak-ng réel, voix unique) ne doit plus contenir: "+forbidden);
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

console.log("idle local Piper: OK — espeak-ng réel, voix unique (Tom), aucun sélecteur, aucun TTS cloud/système.");
