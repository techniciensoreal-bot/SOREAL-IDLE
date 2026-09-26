import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-26) : « pour le son du boss, fais-en 9 autres, tous différents, un différent à chaque boss ; quand ils ont tous été joués, on repart au premier »
 * et « quand on rebirth, un bruit comme une machine à voyage dans le temps ».
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

// --- dix sons, tous différents ---
function contexteEspion() {
  const journal = [];
  const param = (nom) => ({
    setValueAtTime(v, t) { journal.push([nom, "set", +Number(v).toFixed(3), +Number(t).toFixed(3)]); },
    exponentialRampToValueAtTime(v, t) { journal.push([nom, "ramp", +Number(v).toFixed(3), +Number(t).toFixed(3)]); }
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
const sons = moteur.builders.bossSounds;
assert.equal(sons.length, 10, "le son d'origine + 9 nouveaux");
assert.equal(new Set(sons.map((s) => s.nom)).size, 10, "dix noms différents");
assert.equal(sons[0].nom, "psycho", "le premier est le film d'horreur (les quatre coups d'archet seuls)");
assert.equal(sons[9].nom, "boite-a-musique", "le dixième : bourdon + comptine (l'accompagnement du psycho)");
assert.ok(!sons.some((s) => s.nom === "portail"), "plus de portail");
const signatures = new Set();
for (const son of sons) {
  const c = contexteEspion();
  son.construire(c);
  assert.ok(c.journal.length > 10, son.nom + " : produit du son");
  assert.ok(son.duree >= 800 && son.duree <= 2400, son.nom + " : durée annoncée cohérente avec la file (maxAge 2,4 s)");
  const fins = c.journal.filter((x) => x[1] === "ramp" && x[0] === "gain.gain").map((x) => x[3]);
  assert.ok(Math.max(...fins) <= son.duree / 1000 + 0.15, son.nom + " : ne dépasse pas sa durée (" + Math.max(...fins) + " s)");
  signatures.add(JSON.stringify(c.journal));
}
assert.equal(signatures.size, 10, "aucun son identique à un autre");

// --- l'ordre : un par boss, puis on repart au premier ---
{
  const stockage = {};
  const m = nouveauMoteur(stockage);
  const joues = [];
  for (let i = 0; i < 12; i += 1) {
    assert.equal(m.bossAppear(), true);
    await attendre(5);
    // laisser la file avancer : chaque son attend la fin du précédent (~30 ms sans périphérique audio)
    for (let k = 0; k < 40 && m.debugState().active; k += 1) await attendre(10);
    joues.push(m.dernierSonBoss());
  }
  assert.deepEqual(joues.slice(0, 10), sons.map((s) => s.nom), "les dix sons dans l'ordre, un par boss");
  assert.deepEqual(joues.slice(10), [sons[0].nom, sons[1].nom], "après le dixième, retour au premier");
  assert.equal(stockage.soreal_idle_boss_gong_index_v1, "2", "le rang suivant est mémorisé sur l'appareil");
  // nouvelle visite : la suite continue
  const m2 = nouveauMoteur(stockage);
  m2.bossAppear();
  await attendre(20);
  assert.equal(m2.dernierSonBoss(), sons[2].nom, "la suite continue d'une visite à l'autre");
  // stockage illisible : retombe sur le premier sans planter
  const m3 = nouveauMoteur({ soreal_idle_boss_gong_index_v1: "n'importe quoi" });
  m3.bossAppear();
  await attendre(20);
  assert.equal(m3.dernierSonBoss(), sons[0].nom);
}

// --- machine à voyager dans le temps (Rebirth) ---
{
  const tm = moteur.builders.timeMachine;
  assert.equal(tm.duree, 3000);
  const c = contexteEspion();
  tm.construire(c);
  assert.ok(c.journal.length > 60, "un son riche (mécanisme, aspiration, saut, arrivée)");
  const departs = c.journal.filter((x) => x[1] === "start").map((x) => x[2]);
  assert.ok(Math.max(...departs) >= 2.1, "l'arrivée (carillon) vient après le saut");
  assert.ok(!signatures.has(JSON.stringify(c.journal)), "distinct des sons de boss");
  assert.equal(typeof moteur.timeMachine, "function");
  assert.ok(audio.includes('timeMachine:{group:"rebirth",priority:100,maxAgeMs:3500}'));
  const executer = ui.slice(ui.indexOf("function executerRenaissanceIdleV63_(){"), ui.indexOf("google.script.run", ui.indexOf("function executerRenaissanceIdleV63_(){")));
  assert.ok(executer.includes("jouerEffetAudioIdleV199_('timeMachine');"), "joué quand on confirme la renaissance");
}

// --- défaite (Norman, 2026-09-26 : « un son plus adapté à une perte de combat ») : un K.O. puis une élégie mineure qui redescend ---
{
  const d = moteur.builders.defeat;
  assert.equal(d.duree, 1900);
  const c = contexteEspion();
  d.construire(c);
  const debuts = c.journal.filter((x) => x[1] === "start").map((x) => x[2]);
  assert.ok(debuts.length >= 12, "le coup, le souffle, quatre notes en deux timbres et le bourdon");
  assert.ok(Math.max(...debuts) >= 1.3, "la dernière note grave arrive à la fin");
  const fins = c.journal.filter((x) => x[1] === "ramp" && x[0] === "gain.gain").map((x) => x[3]);
  assert.ok(Math.max(...fins) <= 1.9 + 0.2, "ne dépasse pas sa durée");
  assert.ok(!signatures.has(JSON.stringify(c.journal)), "distinct des sons de boss");
  // les quatre notes de l'élégie descendent : la (440), fa (349), ré (294), la grave (220)
  const notes = c.journal.filter((x) => x[0] === "osc.freq" && x[1] === "set").map((x) => x[2]);
  for (const f of [440, 349, 294, 220]) assert.ok(notes.includes(f), "note " + f);
  const source = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
  assert.ok(source.includes("function defaiteConstruire_(c){") && source.includes("return jouerWebAudio_(1900,defaiteConstruire_);"));
  assert.ok(!source.includes("frequency:600,frequencyEnd:85,decay:2.2,delay:.10"), "l'ancien son (simple descente grave) est remplacé");
}

console.log("idle-boss-sounds-cycle-v1: OK");
