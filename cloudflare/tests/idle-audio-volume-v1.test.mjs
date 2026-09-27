import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Tu dois ajouter dans paramètres, des barres de son pour régler le volume des voix et
 * le volume d'ambiance. » Module partagé (audio-volume-v1.js) : stocke/lit deux volumes 0-1 en localStorage,
 * notifie les modules abonnés (voix, ambiance) quand ils changent.
 */
const src = readFileSync("cloudflare/public/modules/audio-volume-v1.js", "utf8");

function fabriquer() {
  const stock = new Map();
  const localStorage = {
    getItem: (k) => (stock.has(k) ? stock.get(k) : null),
    setItem: (k, v) => stock.set(k, String(v))
  };
  const window = {};
  vm.runInNewContext(src, { window, localStorage });
  return { api: window.__SOREAL_IDLE_AUDIO_VOLUME_V1__, stock };
}

// --- Valeurs par défaut : ambiance modérée d'entrée de jeu, voix inchangée (100%) ---
{
  const { api } = fabriquer();
  assert.equal(api.getVoix(), 1, "voix : 100% par défaut, jamais touchée tant que Norman ne règle rien");
  assert.equal(api.getAmbiance(), 0.35, "ambiance : modérée par défaut (« pas trop fort de base »)");
}

// --- Lecture/écriture, bornée à [0,1], persistée ---
{
  const { api, stock } = fabriquer();
  api.setVoix(0.6);
  assert.equal(api.getVoix(), 0.6);
  assert.equal(stock.get("soreal_idle_volume_voix_v1"), "0.6");
  api.setAmbiance(1.4);
  assert.equal(api.getAmbiance(), 1, "borné à 1 même si une valeur plus grande est passée");
  api.setAmbiance(-0.2);
  assert.equal(api.getAmbiance(), 0, "borné à 0 même si une valeur négative est passée");
}

// --- Une valeur stockée corrompue ou hors-borne ne casse jamais la lecture ---
{
  const stock = new Map([["soreal_idle_volume_voix_v1", "abc"]]);
  const localStorage = { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)) };
  const window = {};
  vm.runInNewContext(src, { window, localStorage });
  assert.equal(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.getVoix(), 1, "valeur stockée invalide -> repli sur le défaut");
}

// --- Écouteurs notifiés à chaque changement (voix et ambiance) ---
{
  const { api } = fabriquer();
  let appels = 0;
  api.onChange(() => { appels += 1; });
  api.setVoix(0.5);
  assert.equal(appels, 1);
  api.setAmbiance(0.2);
  assert.equal(appels, 2);
}

// --- Un écouteur qui lève une erreur ne bloque jamais les autres ---
{
  const { api } = fabriquer();
  let second = false;
  api.onChange(() => { throw new Error("boom"); });
  api.onChange(() => { second = true; });
  assert.doesNotThrow(() => api.setVoix(0.5));
  assert.equal(second, true);
}

// --- Chargé une seule fois (garde répétée comme les autres modules du jeu) ---
assert.match(src, /if\(window\.__SOREAL_IDLE_AUDIO_VOLUME_V1__\)return;/);

console.log("idle-audio-volume-v1: OK");
