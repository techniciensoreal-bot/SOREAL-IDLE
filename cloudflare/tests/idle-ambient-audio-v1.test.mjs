import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Dès qu'on déverrouille le mode aventure, les sons placés dans [R2 idle/ambient/]
 * doivent être joués presque tout le temps. Il peut arriver qu'aucun ne soit joué mais ça doit être rare. Le
 * niveau sonore ne doit pas être trop fort de base. »
 *
 * Revirement le même jour : « Je ne veux plus que 2 sons soient joués en même temps... 1 seul à la fois. » -- un
 * seul créneau désormais (l'ancien créneau secondaire, qui permettait un second fichier simultané, est retiré).
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
  const fakeDocument = { addEventListener() {} };
  vm.runInNewContext(src, {
    window, document: fakeDocument, fetch: fakeFetch, Audio: FakeAudio,
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

// --- verifier(true) : un seul créneau, jamais deux fichiers en même temps ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99; // > la probabilité de silence : le créneau joue
  try {
    const { api, timers, appelsFetch, instances } = fabriquer(volumeApiFactice(0.35));
    api.verifier(true);
    assert.equal(timers.length, 1, "un seul créneau, jamais un second (plus de « jusqu'à 2 en même temps »)");
    timers.slice().forEach((t) => t.fn());
    await attendre();
    assert.equal(appelsFetch.length >= 1, true);
    assert.ok(appelsFetch.every((u) => u === "/api/idle/media/ambient-list"));
    assert.equal(instances.length, 1, "un seul fichier démarré à la fois");
    assert.match(instances[0].src, /^\/api\/idle\/media\/ambient\?key=idle%2Fambient%2F/);
    assert.equal(instances[0].paused, false, "lecture lancée");
  } finally {
    Math.random = originalRandom;
  }
}

// --- verifier(true) : silence probable -> aucun fichier ne démarre tout de suite, un minuteur de reprise est posé ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.01; // < la probabilité de silence
  try {
    const { api, timers, instances } = fabriquer(volumeApiFactice(0.35));
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    assert.equal(instances.length, 0, "silence : rien ne joue");
    assert.ok(timers.length >= 1, "un minuteur de reprise est reposé pour le créneau resté silencieux");
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
    assert.equal(instances.length, 1);
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
    assert.equal(instances.length, 1);
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

/*
 * Norman (2026-09-27, même jour) : « Comment je peux faire pour que mes sons soient tous au même volume. Pour pas
 * devoir augmenter, baisser le son suivant le son d'ambiance en cours ? » Chaque fichier est analysé une fois
 * (RMS via Web Audio decodeAudioData) et son volume compensé par un gain individuel, mémorisé en localStorage
 * (clé R2 -> gain) pour ne jamais recalculer le même fichier deux fois sur ce navigateur.
 */
function fabriquerAvecAnalyse(volumeApi, cles, options) {
  options = options || {};
  FakeAudio.instances = [];
  const timers = [];
  let prochainId = 1;
  const fakeSetTimeout = (fn, delai) => {
    const id = prochainId++;
    const entree = { id, delai };
    entree.fn = () => { const i = timers.indexOf(entree); if (i >= 0) timers.splice(i, 1); fn(); };
    timers.push(entree);
    return id;
  };
  const fakeClearTimeout = (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); };
  const appelsFetch = [];
  const fakeFetch = async (url) => {
    appelsFetch.push(url);
    if (url === "/api/idle/media/ambient-list") return { ok: true, json: async () => ({ ok: true, cles: cles || ["idle/ambient/faible.mp3"] }) };
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  };
  // RMS factice contrôlé par le test : simule un fichier trop faible (rms < cible) -> gain > 1 attendu.
  const rms = options.rms == null ? 0.01 : options.rms;
  const channel = new Float32Array(1000).fill(rms);
  const fakeAudioBuffer = { numberOfChannels: 1, getChannelData: () => channel };

  /*
   * GainNode/MediaElementAudioSourceNode factices (2026-09-27, correctif « les sons trop faibles doivent être
   * augmentés ») : un vrai GainNode peut porter un gain > 1 (amplification réelle), contrairement à `.volume`
   * (0 à 1 seulement) -- ces classes tracent les gains appliqués/ramper pour que le test puisse vérifier une
   * vraie amplification, pas seulement une atténuation moins sévère.
   */
  class FakeGainNode {
    constructor(ctx) {
      this.context = ctx;
      const self = this;
      this.gain = {
        value: 1,
        setValueAtTime(v) { self.gain.value = v; },
        linearRampToValueAtTime(v) { self.gain.value = v; },
        cancelScheduledValues() {}
      };
      this.connections = [];
    }
    connect(dest) { this.connections.push(dest); }
    disconnect() { this.connections = []; }
  }
  class FakeMediaElementSource {
    constructor(audio) { this.audio = audio; this.connections = []; }
    connect(dest) { this.connections.push(dest); }
  }
  const gainNodesCrees = [];
  const fakeCtx = {
    currentTime: 0,
    state: options.suspenduSansGeste ? "suspended" : "running",
    resume() { fakeCtx.state = "running"; return Promise.resolve(); },
    destination: {},
    decodeAudioData: async () => fakeAudioBuffer,
    createMediaElementSource: (audio) => new FakeMediaElementSource(audio),
    createGain() { const g = new FakeGainNode(fakeCtx); gainNodesCrees.push(g); return g; }
  };
  const FakeAudioContext = function () { return fakeCtx; };
  const stockLocal = new Map();
  const fakeLocalStorage = {
    getItem: (k) => (stockLocal.has(k) ? stockLocal.get(k) : null),
    setItem: (k, v) => stockLocal.set(k, String(v))
  };
  let horloge = 0;
  const FakeDate = { now: () => horloge };
  const filesRaf = [];
  const fakeRaf = (fn) => { filesRaf.push(fn); return filesRaf.length; };
  const fakeDocument = { addEventListener() {} };
  const window = { __SOREAL_IDLE_AUDIO_VOLUME_V1__: volumeApi, AudioContext: options.sansAudioContext ? undefined : FakeAudioContext };
  vm.runInNewContext(src, {
    window, document: fakeDocument, fetch: fakeFetch, Audio: FakeAudio, localStorage: fakeLocalStorage,
    setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
    requestAnimationFrame: fakeRaf, Date: FakeDate, Math, Promise, Array, Boolean, Object, Float32Array, encodeURIComponent
  });
  function terminerFondus() {
    horloge += 5000;
    const file = filesRaf.splice(0, filesRaf.length);
    file.forEach((fn) => fn());
  }
  return { api: window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__, timers, appelsFetch, instances: FakeAudio.instances, terminerFondus, stockLocal, gainNodesCrees, fakeCtx };
}

/*
 * Norman (2026-09-27, correctif) : « il faut que les sons trop faibles soient augmentés et que les sons trop
 * forts soient diminués. Je veux vraiment qu'on ne remarque pas de différence de son. » `.volume` ne peut
 * qu'atténuer (0 à 1) -- un fichier réellement faible doit être VRAIMENT amplifié (gain > 1) via un GainNode Web
 * Audio, jamais seulement "moins coupé" en plafonnant `.volume` à 1.
 */
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { api, timers, instances, terminerFondus, gainNodesCrees } = fabriquerAvecAnalyse(volumeApiFactice(0.9), undefined, { rms: 0.01 });
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    terminerFondus();
    await attendre();
    terminerFondus();
    assert.equal(instances.length, 1);
    assert.equal(instances[0].volume, 0.9, "`.volume` ne porte plus que le curseur Ambiance, jamais la compensation");
    assert.equal(gainNodesCrees.length, 1, "un GainNode Web Audio doit être créé pour la piste");
    assert.ok(gainNodesCrees[0].gain.value > 1, "fichier faible -> vraiment amplifié (gain > 1 sur le GainNode, pas juste moins atténué)");
    assert.ok(gainNodesCrees[0].connections.length >= 1, "le GainNode doit être connecté à la destination audio");
  } finally {
    Math.random = originalRandom;
  }
}

// --- Un fichier trop fort (RMS très supérieur à la cible) est réduit (gain < 1 sur le GainNode). ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { api, timers, terminerFondus, gainNodesCrees } = fabriquerAvecAnalyse(volumeApiFactice(0.5), undefined, { rms: 0.9 });
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    terminerFondus();
    await attendre();
    terminerFondus();
    assert.equal(gainNodesCrees.length, 1);
    assert.ok(gainNodesCrees[0].gain.value < 1, "fichier trop fort -> réduit (gain < 1)");
  } finally {
    Math.random = originalRandom;
  }
}

// --- Le gain calculé est mémorisé en localStorage (clé R2 -> gain) : jamais recalculé au fichier suivant. ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { api, timers, appelsFetch, terminerFondus, stockLocal } = fabriquerAvecAnalyse(volumeApiFactice(0.5), ["idle/ambient/x.mp3"], { rms: 0.03 });
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    terminerFondus();
    assert.ok(stockLocal.has("soreal_idle_ambient_gain_v1:idle/ambient/x.mp3"), "gain mémorisé sous la clé R2 du fichier");
    const appelsAnalyseAvant = appelsFetch.filter((u) => u.includes("/api/idle/media/ambient?key=")).length;
    assert.ok(appelsAnalyseAvant >= 1, "le fichier a bien été récupéré pour analyse la première fois");

    // Relance verifier(false) puis verifier(true) : le MÊME localStorage (stockLocal) simule un navigateur qui a déjà vu ce fichier.
    api.verifier(false);
    api.verifier(true);
    timers.slice().forEach((t) => t.fn());
    await attendre();
    const appelsAnalyseApres = appelsFetch.filter((u) => u.includes("/api/idle/media/ambient?key=")).length;
    assert.equal(appelsAnalyseApres, appelsAnalyseAvant, "aucun nouveau fetch d'analyse : le gain connu est relu directement du localStorage");
  } finally {
    Math.random = originalRandom;
  }
}

// --- Sans AudioContext disponible (vieux navigateur) : jamais d'erreur, gain neutre (1), le son joue quand même. ---
{
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { api, timers, instances, terminerFondus } = fabriquerAvecAnalyse(volumeApiFactice(0.4), undefined, { sansAudioContext: true });
    assert.doesNotThrow(() => {
      api.verifier(true);
      timers.slice().forEach((t) => t.fn());
    });
    await attendre();
    terminerFondus();
    assert.equal(instances.length, 1);
    assert.ok(instances[0].volume > 0, "le son joue quand même, sans normalisation possible");
  } finally {
    Math.random = originalRandom;
  }
}

console.log("idle-ambient-audio-v1: OK");
