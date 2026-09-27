import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Je veux un bruit qui indique qu'on a pas assez d'argent ou d'ap ou quoi que ce soit
 * pour effectuer un achat dans le jeu. »
 *
 * Important : contrairement à ce que le module supposait jusqu'ici (« ok:false répond au success handler »),
 * le VRAI transport (standalone-bridge.js, callIdleV1/jsonFetchV1) LÈVE une Error dès que data.ok===false,
 * avec pour message exactement data.message (le code d'erreur serveur, ex. "OR_INSUFFISANT") -- donc un achat
 * refusé arrive au FAILURE handler, jamais au success handler. Ce test simule ce comportement réel (rejet),
 * pas l'ancien mock simplifié des autres tests purchase-sound.
 */
const achat = readFileSync("cloudflare/public/modules/purchase-sound-v1.js", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");

// --- Son déclaré côté audio-effects-v199.js ---
assert.ok(audio.includes('purchaseRefused:{group:"purchase-refused"'), "son « purchaseRefused » déclaré, groupe distinct de « purchase »");
assert.ok(audio.includes("purchaseRefused:achatRefuse_"), "son « purchaseRefused » joué");

// --- Transport window.__SOREAL_IDLE_CALL_V1__ (promesse qui REJETTE sur ok:false, comme en vrai) ---
{
  const joues = [];
  let rejet = null;
  const fenetre = {
    __SOREAL_IDLE_AUDIO_V199__: { play: (n) => joues.push(n) },
    __SOREAL_IDLE_CALL_V1__: async () => { if (rejet) throw rejet; return { ok: true }; }
  };
  new Function("window", "setInterval", "clearInterval", "Promise", achat)(fenetre, () => 0, () => {}, Promise);
  const attendre = () => new Promise((r) => setTimeout(r, 5));

  // Ressource insuffisante sur un achat suivi (agirProgressionSorealIdle / action trackée) : son joué.
  rejet = new Error("OR_INSUFFISANT");
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyResource" }]).catch(() => {});
  await attendre();
  assert.deepEqual(joues, ["purchaseRefused"], "OR_INSUFFISANT sur un achat suivi : son de refus");

  // Autres codes de ressource insuffisante couverts.
  for (const code of ["EXP_INSUFFISANTE", "EXP_INSUFFISANT", "SANG_INSUFFISANT", "GRAINES_INSUFFISANTES", "RESSOURCE_YGG_INSUFFISANTE", "GPS_INSUFFISANT", "MONNAIE_INSUFFISANTE"]) {
    joues.length = 0;
    rejet = new Error(code);
    await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyPerk" }]).catch(() => {});
    await attendre();
    assert.deepEqual(joues, ["purchaseRefused"], code + " : son de refus");
  }

  // Refus non lié à l'argent (déjà au maximum, palier non atteint) : jamais ce son.
  for (const code of ["ACHAT_AU_MAXIMUM", "BOSS_NIVEAU_INSUFFISANT", "réseau"]) {
    joues.length = 0;
    rejet = new Error(code);
    await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyPerk" }]).catch(() => {});
    await attendre();
    assert.deepEqual(joues, [], code + " : pas un refus pour faute de moyens, muet");
  }

  // Une action qui n'est pas suivie comme un achat : muette même en cas de rejet "OR_INSUFFISANT".
  joues.length = 0;
  rejet = new Error("OR_INSUFFISANT");
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "allocate" }]).catch(() => {});
  await attendre();
  assert.deepEqual(joues, [], "action non suivie : muette");

  // Un achat réussi ne doit jamais aussi jouer le son de refus.
  joues.length = 0;
  rejet = null;
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyPerk" }]);
  await attendre();
  assert.deepEqual(joues, ["purchase"], "achat réussi : uniquement le son de succès");
}

// --- Transport google.script.run (withFailureHandler) ---
{
  const joues = [];
  const appels = [];
  let rejet = null;
  const script = {};
  const runnerReel = () => {
    let succes = null, echec = null;
    const runner = new Proxy({}, {
      get(_c, prop) {
        if (prop === "withSuccessHandler") return (fn) => { succes = fn; return runner; };
        if (prop === "withFailureHandler") return (fn) => { echec = fn; return runner; };
        return (...args) => {
          appels.push([String(prop), args]);
          Promise.resolve().then(() => (rejet ? (echec && echec(rejet)) : (succes && succes({ ok: true }))));
          return runner;
        };
      }
    });
    return runner;
  };
  Object.defineProperty(script, "run", { configurable: true, enumerable: true, get: runnerReel });
  const window = { google: { script }, __SOREAL_IDLE_AUDIO_V199__: { play: (n) => joues.push(n) } };
  const vm = await import("node:vm");
  vm.runInNewContext(achat, { window, setInterval, clearInterval, Proxy, Promise, Object, Array, Boolean, String });
  const attendre = () => new Promise((r) => setTimeout(r, 5));

  let recu = null, echecRecu = null;
  rejet = new Error("MONNAIE_INSUFFISANTE");
  window.google.script.run
    .withSuccessHandler((r) => { recu = r; })
    .withFailureHandler((e) => { echecRecu = e; })
    .agirProgressionSorealIdle("s", { action: "buyQuirk" });
  await attendre();
  assert.deepEqual(joues, ["purchaseRefused"], "google.script.run : MONNAIE_INSUFFISANTE joue le son de refus");
  assert.equal(recu, null, "le success handler d'origine n'est pas appelé sur un échec");
  assert.equal(echecRecu, rejet, "le failure handler d'origine reçoit bien l'erreur d'origine");

  joues.length = 0;
  rejet = new Error("réseau");
  window.google.script.run.withFailureHandler(() => {}).agirProgressionSorealIdle("s", { action: "buyQuirk" });
  await attendre();
  assert.deepEqual(joues, [], "erreur réseau générique : muet");
}

console.log("idle-purchase-refused-sound-v1: OK");
