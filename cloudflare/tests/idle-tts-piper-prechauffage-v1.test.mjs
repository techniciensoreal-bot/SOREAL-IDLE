import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-09-28), scène spéciale du boss 18, après le correctif du rythme (Beta 5.7) : « c'est vraiment
 * le début du texte qui pose problème. La lecture doit démarrer beaucoup plus vite. »
 *
 * Cause : prechauffer_ (Beta 5.4) ne vérifiait que le manifeste des fichiers de voix pré-générés (toujours
 * vide pour cette scène, faute d'accès réseau pour voice-generate.mjs) -- jamais la synthèse Piper elle-même,
 * qui repartait donc toujours de zéro au moment exact où la lecture démarrait (~10 s de synthèse à froid).
 * requestLocalNeuralAudio_ met maintenant en cache la synthèse par empreinte de texte (blocsPiperCache_),
 * et prechauffer_ la lance en arrière-plan dès qu'aucun fichier pré-généré n'existe : à la lecture réelle,
 * le blob est déjà prêt (ou en cours) au lieu d'être resynthétisé.
 */
const source = fs.readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");

// --- Structure attendue dans le code (cache partagé, jamais une resynthèse à chaque appel) ---
assert.match(source, /var blocsPiperCache_=\{\};/, "cache de synthèse Piper partagé par empreinte de texte");
assert.match(source, /if\(blocsPiperCache_\[hash\]\)\{/, "requestLocalNeuralAudio_ doit réutiliser une synthèse déjà en cours/terminée");
assert.match(source, /requestLocalNeuralAudio_\(texte,'',generation,true\)\.catch\(function\(\)\{\}\);/, "prechauffer_ doit lancer la synthèse Piper en arrière-plan, silencieusement");

// --- Comportement réel : préchauffer un texte puis le lire ne doit synthétiser qu'UNE seule fois ---
{
  const listeners = {};
  const fakeDocument = {
    readyState: "loading", // évite d'appeler init_() (MutationObserver, écouteurs globaux...), hors sujet ici
    addEventListener(name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
    getElementById() { return null; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    body: {}
  };

  let synthCalls = 0;
  const fakeWindow = {
    Audio: function () {},
    AudioContext: function () {},
    __SOREAL_IDLE_LOCAL_NEURAL_V1__: {
      synthesize(text) {
        synthCalls += 1;
        return Promise.resolve({ size: 1234, text });
      }
    }
  };

  // Aucun fichier pré-généré disponible dans ce test (comme pour la scène du boss 18, en pratique) : le repli
  // Piper est donc systématique -- exactement le cas que ce correctif doit accélérer.
  const fakeFetch = () => Promise.reject(new Error("aucun réseau dans ce bac à sable"));
  const fakeLocalStorage = { getItem() { return null; }, setItem() {} };

  new Function("window", "document", "fetch", "WebAssembly", "localStorage", source)(
    fakeWindow, fakeDocument, fakeFetch, {}, fakeLocalStorage
  );

  const api = fakeWindow.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  assert.ok(api, "l'API doit s'installer sur window");

  const texte = "Bonjour, ceci est un test de préchauffage de la synthèse Piper.";
  api.prechauffer(texte);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(synthCalls, 1, "prechauffer_ doit lancer la synthèse Piper en arrière-plan");

  await new Promise((resolve) => {
    api.readText(texte, undefined, () => resolve());
  });
  assert.equal(synthCalls, 1, "la lecture réelle du même texte doit réutiliser la synthèse déjà préchauffée, jamais resynthétiser");

  // Un texte DIFFÉRENT, jamais préchauffé, doit bien déclencher sa propre synthèse.
  await new Promise((resolve) => {
    api.readText("Un tout autre texte, jamais préchauffé.", undefined, () => resolve());
  });
  assert.equal(synthCalls, 2, "un texte différent doit être synthétisé séparément");
}

console.log("idle-tts-piper-prechauffage-v1: OK");
