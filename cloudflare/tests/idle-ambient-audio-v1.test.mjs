import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Dès qu'on déverrouille le mode aventure, les sons placés dans [R2 idle/ambient/]
 * doivent être joués presque tout le temps. Il peut arriver qu'aucun ne soit joué mais ça doit être rare. Tu
 * pourras jouer jusqu'à 2 sons en même temps. Le niveau sonore ne doit pas être trop fort de base. »
 */
const src = readFileSync("cloudflare/public/modules/ambient-audio-v1.js", "utf8");

class FakeAudio {
  constructor(url) {
    this.src = url;
    this.volume = 1;
    this.paused = true;
    this.preload = "";
    this.onended = null;
    this.onerror = null;
    FakeAudio.instances.push(this);
  }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
FakeAudio.instances = [];

function fabriquer(volumeApi, cles) {
  FakeAudio.instances = [];
  const timers = [];
  let prochainId = 1;
  const appelsFetch = [];
  const fakeSetTimeout = (fn, delai) => {
    const id = prochainId++;
    const entree = { id, delai };
    // Un minuteur qui se déclenche se retire lui-même de la liste (comme un vrai setTimeout : jamais besoin de clearTimeout après coup).
    entree.fn = () => { const i = timers.indexOf(entree); if (i >= 0) timers.splice(i, 1); fn(); };
    timers.push(entree);
    return id;
  };
  const fakeClearTimeout = (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); };
  const fakeFetch = async (url) => {
    appelsFetch.push(url);
    return { ok: true, json: async () => ({ ok: true, cles: cles || ["idle/ambient/foret.mp3", "idle/ambient/grotte.ogg"] }) };
  };
  // Horloge et requestAnimationFrame factices : le fondu (fondu_) se résout en avançant l'horloge nous-mêmes,
  // sans dépendre d'un vrai délai -- un test ne doit jamais attendre 1,5 s pour de vrai.
  let horloge = 0;
  const FakeDate = { now: () => horloge };
  const filesRaf = [];
  const fakeRaf = (fn) => { filesRaf.push(fn); return filesRaf.length; };
  const window = { __SOREAL_IDLE_AUDIO_VOLUME_V1__: volumeApi };
  vm.runInNewContext(src, {
    window, fetch: fakeFetch, Audio: FakeAudio,
    setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
    requestAnimationFrame: fakeRaf, Date: FakeDate, Math, Promise, Array, Boolean, encodeURIComponent
  });
  function terminerFondus() {
    horloge += 5000; // dépasse largement FADE_MS : le prochain passage de chaque fondu en cours atteint sa cible
    const file = filesRaf.splice(0, filesRaf.length);
    file.forEach((fn) => fn());
  }
  return { api: window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__, timers, appelsFetch, instances: FakeAudio.instances, terminerFondus };
}

function volumeApiFactice(ambiance) {
  const ecouteurs = [];
  return {
    getAmbiance: () => ambiance,
    getVoix: () => 1,
    onChange: (fn) => ecouteurs.push(fn),
    _declencher: () => ecouteurs.forEach((fn) => fn())
  };
}

const attendre = () => new Promise((r) => setTimeout(r, 5));

// --- Rien ne joue avant que verifier(true) soit appelé (Aventure pas encore débloqué) ---
{
  const { api, timers, appelsFetch } = fabriquer(volumeApiFactice(0.35));
  assert.ok(api, "module chargé");
  assert.equal(timers.length, 0);
  assert.equal(appelsFetch.length, 0);
}

// --- verifier(true) : jusqu'à 2 créneaux, chacun tire la liste puis démarre un fichier ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99; // > toutes les probabilités de silence : les deux créneaux jouent
  try {
    const { api, timers, appelsFetch, instances } = fabriquer(volumeApiFactice(0.35));
    api.verifier(true);
    assert.equal(timers.length, 2, "deux créneaux (principal + secondaire), jamais plus");
    timers.slice().forEach((t) => t.fn());
    await attendre();
    assert.equal(appelsFetch.length >= 1, true);
    assert.ok(appelsFetch.every((u) => u === "/api/idle/media/ambient-list"));
    assert.equal(instances.length, 2, "les deux créneaux ont chacun démarré un fichier");
    for (const audio of instances) {
      assert.match(audio.src, /^\/api\/idle\/media\/ambient\?key=idle%2Fambient%2F/);
      assert.equal(audio.paused, false, "lecture lancée");
    }
    // Jamais le même fichier joué deux fois en même temps.
    assert.notEqual(instances[0].src, instances[1].src);
  } finally {
    Math.random = originalRandom;
  }
}

// --- verifier(true) : silence probable -> aucun fichier ne démarre tout de suite, un minuteur de reprise est posé ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.01; // < toutes les probabilités de silence
  try {
    const { api, timers, instances } = fabriquer(volumeApiFactice(0.35));
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    assert.equal(instances.length, 0, "silence : rien ne joue");
    assert.ok(timers.length >= 2, "un minuteur de reprise est reposé pour chaque créneau resté silencieux");
  } finally {
    Math.random = originalRandom;
  }
}

// --- Volume : appliqué au(x) fichier(s) en cours, et mis à jour en direct quand le curseur change ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const volumeApi = volumeApiFactice(0.4);
    const { api, timers, instances } = fabriquer(volumeApi);
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    assert.equal(instances.length, 2);
    volumeApi.getAmbiance = () => 0.9;
    volumeApi._declencher();
    for (const audio of instances) assert.equal(audio.volume, 0.9, "volume ambiance ajusté en direct sur les fichiers déjà en cours");
  } finally {
    Math.random = originalRandom;
  }
}

// --- verifier(false) : tout s'arrête (mis en pause, aucun minuteur qui traîne) ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { api, timers, instances } = fabriquer(volumeApiFactice(0.35));
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    assert.equal(instances.length, 2);
    api.verifier(false);
    for (const audio of instances) assert.equal(audio.paused, true, "tout est mis en pause à la reverrouillage");
    assert.equal(timers.length, 0, "aucun minuteur ne subsiste");
  } finally {
    Math.random = originalRandom;
  }
}

// --- verifier(true) appelé plusieurs fois de suite (chaque rendu) : ne redémarre pas tout à chaque fois ---
{
  const { api, timers } = fabriquer(volumeApiFactice(0.35));
  api.verifier(true);
  const apres1 = timers.length;
  api.verifier(true);
  api.verifier(true);
  assert.equal(timers.length, apres1, "idempotent : un déblocage déjà pris en compte ne relance rien");
}

// --- Sans réglage de volume disponible : repli à une ambiance modérée, jamais plein volume ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { api, timers, instances, terminerFondus } = fabriquer(undefined);
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    terminerFondus();
    for (const audio of instances) assert.ok(audio.volume > 0 && audio.volume <= 0.5, "repli modéré, jamais fort par défaut");
  } finally {
    Math.random = originalRandom;
  }
}

console.log("idle-ambient-audio-v1: OK");
