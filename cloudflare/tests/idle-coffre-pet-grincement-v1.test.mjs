import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-16) : « le bruit que tu as fait pour la porte, mets-le quand le coffre pète de temps en temps, mais pas le ding de fin ; et fais-moi un bruit de porte plus grave et lourde. »
 * Le Coffre a un pet « grincement de porte » (sans aucun tintement), tiré de temps en temps, jamais deux fois de suite ; la porte d'Yggdrasil a un bruit plus grave et plus lourd.
 */
const coffre = readFileSync("cloudflare/public/modules/audio-coffre-v1.js", "utf8");
const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");

function contexte() {
  const oscillateurs = []; let sorties = 0; const etat = { fin: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const ctx = {
    sampleRate: 8000, currentTime: 0, destination: {},
    createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
    createBufferSource: () => ({ connect() {}, start() {}, stop() {}, buffer: null }),
    createBiquadFilter: () => ({ type: "", frequency: param(), Q: { value: 0 }, connect() {} }),
    createGain: () => ({ gain: param(), connect() { sorties += 1; } }),
    createOscillator: () => {
      const o = { type: "", freqs: [], frequency: { value: 0, setValueAtTime(v) { o.freqs.push(v); }, exponentialRampToValueAtTime(v) { o.freqs.push(v); } }, connect() {}, start() {}, stop(t) { etat.fin = Math.max(etat.fin, t); } };
      oscillateurs.push(o); return o;
    }
  };
  return { ctx, oscillateurs, etat, sorties: () => sorties };
}
function moduleCoffre(alea = Math.random) {
  const fen = { Math: Object.assign(Object.create(Math), { random: alea }), window: {} };
  fen.window = fen;
  vm.runInNewContext(coffre, fen, { filename: "audio-coffre-v1.js" });
  return fen;
}

// 1. Quatre pets grinçants dérivés du grincement de la porte : graves, sans tintement (aucun oscillateur au-dessus de 300 Hz : un « ding » serait à 440 Hz ou plus), de durées bien différentes.
{
  const attendu = { "grincement-prt": [0.15, 0.5], "grincement-prrt-x3": [0.7, 1.1], "grincement-prrrrrt": [1.2, 1.7], "grincement-porte": [0.95, 1.4] };
  const fen = moduleCoffre();
  for (const [id, [min, max]] of Object.entries(attendu)) {
    const { ctx, oscillateurs, etat } = contexte();
    fen.__coffrePetForceIdleV1__ = id;
    const son = fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("pet", ctx, {});
    assert.equal(son.id, id, "pet forcé : " + id);
    const maxHz = Math.max(...oscillateurs.flatMap((o) => o.freqs));
    assert.ok(oscillateurs.length >= 2 && maxHz <= 300, id + " : grave, aucun tintement aigu (" + maxHz + " Hz)");
    assert.ok(etat.fin >= min && etat.fin <= max, id + " : durée " + etat.fin.toFixed(2) + " s attendue entre " + min + " et " + max);
    assert.equal(fen.__coffrePetForceIdleV1__, false, "forçage utilisé une seule fois");
  }
  // « prrt prrt prrt » = trois grincements successifs ; « prt » un seul.
  const compte = (id) => { const { ctx, oscillateurs } = contexte(); fen.__coffrePetForceIdleV1__ = id; fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("pet", ctx, {}); return oscillateurs.filter((o) => o.type === "sawtooth").length; };
  assert.equal(compte("grincement-prt"), 1); assert.equal(compte("grincement-prrt-x3"), 3, "trois bouffées"); assert.equal(compte("grincement-prrrrrt"), 1);
  assert.ok(!/ping\(/.test(coffre.slice(coffre.indexOf("function grincement("), coffre.indexOf("var P_PET_RARE"))), "aucun tintement (ping) dans les grincements");
  assert.equal(fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.petRare.length, 4, "quatre variantes");
  // Forçage simple (true) : une variante tirée au hasard.
  const { ctx: c2 } = contexte(); fen.__coffrePetForceIdleV1__ = true;
  assert.ok(fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("pet", c2, {}).id.startsWith("grincement-"));
}
// 2. De temps en temps : environ un pet sur six, jamais deux fois de suite ; les six pets d'origine restent.
{
  let graine = 7; const alea = () => { graine = (graine * 1664525 + 1013904223) >>> 0; return graine / 4294967296; };
  const fen = moduleCoffre(alea);
  const { ctx } = contexte();
  const ids = []; for (let i = 0; i < 3000; i += 1) ids.push(fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("pet", ctx, {}).id);
  const rares = ids.filter((x) => x.startsWith("grincement-"));
  const part = rares.length / ids.length;
  assert.equal(new Set(rares).size, 4, "les quatre variantes sortent");
  assert.ok(rares.every((x, i) => i === 0 || x !== rares[i - 1]), "jamais la même variante deux fois de suite");
  assert.ok(part > 0.12 && part < 0.22, "de temps en temps : " + part.toFixed(3));
  assert.ok(ids.every((x, i) => i === 0 || !(x.startsWith("grincement-") && ids[i - 1].startsWith("grincement-"))), "jamais deux pets grinçants de suite");
  assert.equal(new Set(ids.filter((x) => !x.startsWith("grincement-"))).size, 6, "les six pets d'origine sont toujours joués");
  // Les rots ne sont pas concernés.
  assert.ok(Array.from({ length: 200 }, () => fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("rot", ctx, {}).id).every((x) => x.startsWith("rot-")));
}
// 3. La porte d'Yggdrasil (pierre ou bois) ne ressemble plus à un pet : aucune dent de scie qui vibre, que du bruit filtré et des chocs. La pierre : aucun coup au début, final doux et mélodieux (nature, relaxation).
{
  const rendu = (nom) => {
    const { ctx, oscillateurs } = contexte();
    const fen = { AudioContext: function () { return ctx; }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 1 } };
    fen.window = fen;
    vm.runInNewContext(sons, fen);
    fen.__SOREAL_IDLE_YGG_SONS_V1__.construire(nom, ctx, {}, 0, Math.random, 1);
    return oscillateurs;
  };
  for (const nom of ["porte", "porteBois"]) assert.equal(rendu(nom).filter((o) => o.type === "sawtooth").length, 0, nom + " : aucune dent de scie grave qui vibre (c'était le pet)");
  assert.ok(rendu("porteBois").every((o) => Math.max(...o.freqs) <= 400), "bois : aucun tintement aigu");
  const pierre = sons.slice(sons.indexOf("    porte:function"), sons.indexOf("    porteBois:function"));
  const departs = [...pierre.matchAll(/glisse\(c,out,t(?:\+([0-9.]+)\*k)?,/g)].map((m) => Number(m[1] || 0));
  assert.ok(departs.every((d) => d >= 1), "aucun coup grave au début : " + departs.join(", "));
  assert.ok(!/highpass',2600/.test(pierre) && !/glisse\(c,out,t\+1\.07\*k,78,28/.test(pierre) && !/lowpass',380,120/.test(pierre), "ni verrou au début, ni coup de butée à la fin");
  // Final : petite harpe pentatonique (cinq notes de triangle), accord tenu (trois sinus), brise et trois chants d'oiseau.
  const o = rendu("porte");
  assert.ok(o.filter((x) => x.type === "triangle").length >= 5, "petite harpe : cinq notes");
  const notes = o.filter((x) => x.type === "triangle").map((x) => Math.round(x.freqs[0])).sort((x, y) => x - y);
  assert.deepEqual(notes.slice(0, 5), [784, 880, 1047, 1175, 1319], "gamme pentatonique sol la do ré mi");
  assert.ok(o.filter((x) => x.type === "sine" && x.freqs[0] > 500 && x.freqs[0] < 1000).length >= 3, "accord tenu très doux");
  assert.ok(/souffle\(c,out,t\+0\.85\*k,1\.5\*k,'bandpass',650,1500/.test(pierre) && (pierre.match(/glisse\(c,out,t\+1\.[5-9]/g) || []).length === 3, "brise légère et trois chants d'oiseau");
}
// 4. Le banc d'essai (administrateur) a le bouton qui fait péter le Coffre avec ce son.
const page = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(page.includes("bancPetCoffre(") && page.includes("__coffrePetForceIdleV1__=typeof id==='string'?id:true") && page.includes("A.play('coffrePet')"), "boutons du banc : pets grinçants du Coffre");
for (const id of ["grincement-prt", "grincement-prrt-x3", "grincement-prrrrrt", "grincement-porte"]) assert.ok(page.includes("bancPetCoffre(\\'" + id + "\\')"), "bouton du banc pour " + id);
console.log("idle-coffre-pet-grincement-v1: OK");
