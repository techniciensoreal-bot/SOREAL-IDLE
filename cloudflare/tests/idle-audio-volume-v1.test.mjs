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

// --- Valeurs par défaut (Norman, 2026-10-02 : trois barres, toutes à 75 % de base, cases cochées) ---
{
  const { api } = fabriquer();
  assert.equal(api.getVoix(), 0.75, "voix : 75% par défaut");
  assert.equal(api.getAmbiance(), 0.75, "ambiance : 75% par défaut");
  assert.equal(api.getInterface(), 0.75, "sons de l'interface : 75% par défaut");
  for (const t of ["voix", "ambiance", "interface"]) assert.equal(api.getActif(t), true, t + " : case cochée de base");
}

// --- Les anciens réglages (clés v1 et v2, même personnalisés) ne sont plus lus : chaque navigateur repart sur 75 % une bonne fois. ---
{
  const stock = new Map([
    ["soreal_idle_volume_voix_v1", "1"],
    ["soreal_idle_volume_ambiance_v1", "0.35"],
    ["soreal_idle_volume_voix_v2", "0.4"],
    ["soreal_idle_volume_ambiance_v2", "0.02"]
  ]);
  const localStorage = { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)) };
  const window = {};
  vm.runInNewContext(src, { window, localStorage });
  const api = window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
  assert.equal(api.getVoix(), 0.75);
  assert.equal(api.getAmbiance(), 0.75);
}
assert.match(src, /soreal_idle_volume_voix_v3/);
assert.match(src, /soreal_idle_volume_ambiance_v3/);
assert.match(src, /soreal_idle_volume_interface_v3/);
assert.ok(!/soreal_idle_volume_(voix|ambiance)_v[12]'/.test(src), "plus aucune lecture/écriture sous les anciennes clés");

// --- Case décochée : le volume effectif tombe à 0, le réglage de la barre est conservé ; recochée, il revient ---
{
  const { api, stock } = fabriquer();
  let appels = 0;
  api.onChange(() => { appels += 1; });
  api.setReglage("voix", 0.5);
  api.setActif("voix", false);
  assert.equal(api.getVoix(), 0, "voix coupée complètement");
  assert.equal(api.getReglage("voix"), 0.5, "le réglage de la barre reste");
  assert.equal(api.getAmbiance(), 0.75, "les autres options ne sont pas touchées");
  assert.equal(stock.get("soreal_idle_son_actif_v1_voix"), "0");
  api.setActif("voix", true);
  assert.equal(api.getVoix(), 0.5);
  api.setActif("interface", false);
  assert.equal(api.getInterface(), 0);
  assert.equal(appels, 4, "chaque changement notifie les modules");
  api.setActif("n'importe quoi", false);
  assert.equal(appels, 4, "type inconnu ignoré");
}

// --- Lecture/écriture, bornée à [0,1], persistée ---
{
  const { api, stock } = fabriquer();
  api.setVoix(0.6);
  assert.equal(api.getVoix(), 0.6);
  assert.equal(stock.get("soreal_idle_volume_voix_v3"), "0.6");
  api.setAmbiance(1.4);
  assert.equal(api.getAmbiance(), 1, "borné à 1 même si une valeur plus grande est passée");
  api.setAmbiance(-0.2);
  assert.equal(api.getAmbiance(), 0, "borné à 0 même si une valeur négative est passée");
}

// --- Une valeur stockée corrompue ou hors-borne ne casse jamais la lecture ---
{
  const stock = new Map([["soreal_idle_volume_voix_v3", "abc"]]);
  const localStorage = { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)) };
  const window = {};
  vm.runInNewContext(src, { window, localStorage });
  assert.equal(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.getVoix(), 0.75, "valeur stockée invalide -> repli sur le défaut");
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
