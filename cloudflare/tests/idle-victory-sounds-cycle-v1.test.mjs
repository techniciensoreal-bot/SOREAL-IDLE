import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « J'aimerai que tu crées 9 Autres sons de victoires. Quand on bat un boss de Fight Boss.
 * ils doivent tous être en rapport avec la victoire mais sans être ressemblants. Ils devront tous être joué dans
 * l'ordre avant de recommencer au premier » -- même mécanique de rotation que les 10 sons d'apparition de boss
 * (Norman, 2026-09-26, idle-boss-sounds-cycle-v1.test.mjs), appliquée cette fois au son de victoire (déclenché à
 * chaque boss vaincu en Fight Boss).
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

function nouveauMoteur(stockage) {
  const fenetre = {};
  const document = { addEventListener() {} };
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(stockage, k) ? stockage[k] : null),
    setItem: (k, v) => { stockage[k] = String(v); }
  };
  new Function("window", "document", "localStorage", audio)(fenetre, document, localStorage);
  return fenetre.__SOREAL_IDLE_AUDIO_V199__;
}
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

function contexteEspion() {
  const journal = [];
  const param = (nom) => ({
    setValueAtTime(v, t) { journal.push([nom, "set", +Number(v).toFixed(3), +Number(t).toFixed(3)]); },
    exponentialRampToValueAtTime(v, t) { journal.push([nom, "ramp", +Number(v).toFixed(3), +Number(t).toFixed(3)]); },
    linearRampToValueAtTime(v, t) { journal.push([nom, "linramp", +Number(v).toFixed(3), +Number(t).toFixed(3)]); }
  });
  const noeud = (type) => ({ connect() {}, start(t) { journal.push([type, "start", +Number(t).toFixed(3)]); }, stop() {}, type: "", gain: param(type + ".gain"), frequency: param(type + ".freq"), Q: param("q"), detune: param("detune") });
  return {
    journal,
    currentTime: 0, sampleRate: 8000, destination: {},
    createGain: () => noeud("gain"),
    createOscillator: () => noeud("osc"),
    createBiquadFilter: () => noeud("filtre"),
    createBufferSource: () => noeud("source"),
    createBuffer: (n, frames) => ({ getChannelData: () => new Float32Array(frames) })
  };
}
const moteur = nouveauMoteur({});
const sons = moteur.builders.victorySounds;

// --- dix sons, tous différents ---
assert.equal(sons.length, 10, "le son d'origine + 9 nouveaux");
assert.equal(new Set(sons.map((s) => s.nom)).size, 10, "dix noms différents");
assert.equal(sons[0].nom, "fanfare-cristal", "le premier reste l'ancien son de victoire (V206), jamais remplacé");
const signatures = new Set();
for (const son of sons) {
  const c = contexteEspion();
  son.construire(c);
  assert.ok(c.journal.length > 5, son.nom + " : produit du son");
  assert.ok(son.duree >= 700 && son.duree <= 2200, son.nom + " : durée annoncée cohérente avec la file (maxAge de \"victory\")");
  const fins = c.journal
    .filter((x) => (x[1] === "ramp" || x[1] === "linramp") && x[0] === "gain.gain")
    .map((x) => x[3]);
  if (fins.length) {
    assert.ok(Math.max(...fins) <= son.duree / 1000 + 0.2, son.nom + " : ne dépasse pas sa durée (" + Math.max(...fins) + " s)");
  }
  signatures.add(JSON.stringify(c.journal));
}
assert.equal(signatures.size, 10, "aucun son identique à un autre : tous en rapport avec la victoire, mais tous différents");

// --- durée déclarée cohérente avec le groupe/priorité "victory" (jamais interrompu avant sa fin) ---
assert.match(audio, /victory:\{group:"combat-end",priority:105,maxAgeMs:2200\}/);
for (const son of sons) assert.ok(son.duree <= 2200, son.nom + " : reste dans la fenêtre maxAgeMs de victory");

// --- l'ordre : un par boss vaincu, puis on repart au premier ---
{
  const stockage = {};
  const m = nouveauMoteur(stockage);
  const joues = [];
  for (let i = 0; i < 12; i += 1) {
    assert.equal(m.victory(), true);
    await attendre(5);
    for (let k = 0; k < 40 && m.debugState().active; k += 1) await attendre(10);
    joues.push(m.dernierSonVictoire());
  }
  assert.deepEqual(joues.slice(0, 10), sons.map((s) => s.nom), "les dix sons dans l'ordre, un par victoire");
  assert.deepEqual(joues.slice(10), [sons[0].nom, sons[1].nom], "après le dixième, retour au premier");
  assert.equal(stockage.soreal_idle_victoire_boss_index_v1, "2", "le rang suivant est mémorisé sur l'appareil");
  // nouvelle visite : la suite continue
  const m2 = nouveauMoteur(stockage);
  m2.victory();
  await attendre(20);
  assert.equal(m2.dernierSonVictoire(), sons[2].nom, "la suite continue d'une visite à l'autre");
  // stockage illisible : retombe sur le premier sans planter
  const m3 = nouveauMoteur({ soreal_idle_victoire_boss_index_v1: "n'importe quoi" });
  m3.victory();
  await attendre(20);
  assert.equal(m3.dernierSonVictoire(), sons[0].nom);
}

// --- le son de victoire reste bien joué à chaque boss vaincu (câblage inchangé côté monolithe) ---
assert.ok(ui.includes("jouerEffetAudioIdleV199_('victory')"), "toujours déclenché à la victoire, comme avant");

console.log("idle-victory-sounds-cycle-v1: OK");
