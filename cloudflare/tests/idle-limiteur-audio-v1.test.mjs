import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-27) : « les sons du jeu saturent par moment ; le même son peut saturer ou ne pas saturer ; est-ce qu'on peut régler ça ? »
 * Cause : somme de sons simultanés et ambiances amplifiées (jusqu'à ×5) envoyées sans protection à la sortie : écrêtage dès que la somme dépasse 1,0, selon ce qui joue en même temps.
 * Remède : un limiteur (compresseur rapide + écrêtage doux) devant la sortie de chaque contexte audio du jeu.
 */
const src = readFileSync("cloudflare/public/modules/limiteur-audio-v1.js", "utf8");
const noeuds = [];
const fabrique = (type) => () => { const n = { type, connexions: [], connect(x) { n.connexions.push(x); return x; }, gain: { value: 1 }, threshold: {}, knee: {}, ratio: {}, attack: {}, release: {} }; noeuds.push(n); return n; };
const ctx = { destination: { type: "destination" }, createGain: fabrique("gain"), createDynamicsCompressor: fabrique("comp"), createWaveShaper: fabrique("shaper") };
const sandbox = { window: {}, Math, Float32Array, WeakMap };
vm.runInNewContext(src, sandbox);
const L = sandbox.window.__SOREAL_IDLE_LIMITEUR_V1__;
const source = fabrique("source")();
assert.equal(L.brancher(ctx, source), true);
const comp = noeuds.find((n) => n.type === "comp"), forme = noeuds.find((n) => n.type === "shaper");
assert.ok(comp.threshold.value === -3 && comp.ratio.value === 20 && comp.attack.value === 0.002, "limiteur rapide, seuil -3 dB");
assert.equal(source.connexions[0].type, "gain", "la source entre dans le limiteur");
assert.ok(forme.connexions[0] === ctx.destination, "le limiteur sort vers la destination");
assert.ok(forme.curve instanceof Float32Array && Math.max(...forme.curve) <= 0.98 + 1e-6 && Math.min(...forme.curve) >= -0.98 - 1e-6, "rien au-dessus de 0,98");
const i = (x) => Math.round((x + 1) * (forme.curve.length - 1) / 2);
assert.ok(Math.abs(forme.curve[i(0.5)] - 0.5) < 2e-3 && Math.abs(forme.curve[i(-0.3)] + 0.3) < 2e-3, "identité sous 0,8 : le volume habituel ne change pas");
const rattrapage = noeuds.find((n) => n.type === "gain" && n.gain.value === 0.871);
assert.ok(rattrapage, "le gain de rattrapage du compresseur Web Audio est retiré");
// un seul limiteur par contexte
const avant = noeuds.length;
L.brancher(ctx, fabrique("source")());
assert.equal(noeuds.filter((n) => n.type === "comp").length, 1, "un seul limiteur par contexte");
assert.ok(noeuds.length === avant + 1);

// tout ce qui sort du jeu passe par lui
const lit = (f) => readFileSync("cloudflare/public/modules/" + f, "utf8");
for (const f of ["audio-effects-v199.js", "ambient-audio-v1.js", "yggdrasil-sons-v1.js", "wandoos-retro-v1.js", "orage-v1.js", "bt-neon-v1.js", "bt-lumieres-v1.js"]) {
  const code = lit(f);
  assert.ok(code.includes("__SOREAL_IDLE_LIMITEUR_V1__"), f + " : sortie limitée");
  assert.ok(!/(maitre|master|gainNode)\.connect\((c|ctx)\.destination\);(?!\s*$)/m.test(code.replace(/\|\|(maitre|master|gainNode)\.connect\((c|ctx)\.destination\);/g, "")), f + " : aucune connexion directe à la destination");
}
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/limiteur-audio-v1.js"), "le limiteur est chargé");
console.log("idle-limiteur-audio-v1: OK");
