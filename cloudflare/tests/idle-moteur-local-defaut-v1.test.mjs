import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Jeu local ACTIF PAR DÉFAUT pour tous les joueurs (Norman, 2026-10-19). Garde : sans aucun réglage, le moteur local est actif ; il se coupe par un choix explicite de l'appareil (?local=0),
 * par un navigateur incapable (pas de Worker, de WebAssembly ni d'IndexedDB), et jamais par l'absence d'un réglage (c'était l'inverse avant : actif seulement avec ?local=1).
 */
const code = readFileSync("cloudflare/public/modules/moteur-local-v1.js", "utf8");
function charger({ cle = null, requete = "", worker = true, wasm = true, idb = true } = {}) {
  const stockage = new Map(cle === null ? [] : [["soreal_idle_moteur_local_v1", cle]]);
  const window = { location: { search: requete }, addEventListener() {}, setInterval() {} };
  const contexte = {
    window, location: window.location, URLSearchParams,
    localStorage: { getItem: (k) => (stockage.has(k) ? stockage.get(k) : null), setItem: (k, v) => stockage.set(k, String(v)), removeItem: (k) => stockage.delete(k) },
    document: { addEventListener() {}, getElementById: () => null, visibilityState: "visible" },
    setInterval() {}, setTimeout() {}, clearTimeout() {}, Date, Math, JSON, Number, String, Promise, Map, Array, Object, Boolean, Error,
    Worker: worker ? function () {} : undefined, WebAssembly: wasm ? {} : undefined, indexedDB: idb ? {} : undefined,
  };
  vm.runInNewContext(code, contexte);
  return { ml: window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__, stockage };
}

assert.equal(charger().ml.actif(), true, "aucun réglage : ACTIF par défaut");
assert.equal(charger({ cle: "1" }).ml.actif(), true, "réglage « 1 » : actif");
{
  /* Un « 0 » enregistré (préférence liée au compte, donc copiée sur tous les appareils) ne coupe plus le jeu local : il est ignoré et effacé. */
  const { ml, stockage } = charger({ cle: "0" });
  assert.equal(ml.actif(), true, "« 0 » enregistré : ignoré, le jeu local reste actif");
  assert.equal(stockage.has("soreal_idle_moteur_local_v1"), false, "« 0 » enregistré : effacé");
}
{
  const { ml, stockage } = charger({ requete: "?local=0" });
  assert.equal(ml.actif(), false, "?local=0 coupe le jeu local sur cet appareil");
  assert.equal(stockage.has("soreal_idle_moteur_local_v1"), false, "?local=0 n'est PAS enregistré : il ne vaut que pour cette page");
}
assert.equal(charger({ requete: "?local=1", cle: "0" }).ml.actif(), true, "?local=1 le rallume");
assert.equal(charger({ worker: false }).ml.actif(), false, "pas de Worker : mode serveur");
assert.equal(charger({ wasm: false }).ml.actif(), false, "pas de WebAssembly : mode serveur");
assert.equal(charger({ idb: false }).ml.actif(), false, "pas d'IndexedDB : mode serveur");
console.log("idle-moteur-local-defaut-v1: OK");
