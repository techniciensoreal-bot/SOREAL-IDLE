// Norman (2026-11-01) : « les mouvements avec le gyroscope du telephone ne semblent pas naturels » puis « la carte penche dans le mauvais sens ».
// Garde : le vrai module sur un faux navigateur, evenements deviceorientation synthetiques.
// CONVENTION : la carte garde son orientation dans le monde => relativement a l'ecran elle penche a l'OPPOSE du telephone, le reflet aussi.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const src = fs.readFileSync("cloudflare/public/modules/album-titans-v1.js", "utf8");

function banc() {
  const props = {}, file = [];
  let ecouteur = null, t = 0;
  const k = { style: { setProperty: (n, v) => { props[n] = v; }, removeProperty() {} } };
  const carte = { querySelector: (q) => (q === ".alb-titan-carte" ? k : { classList: { add() {}, remove() {} } }), closest: () => null };
  const w = { addEventListener: (n, f) => { if (n === "deviceorientation") ecouteur = f; }, removeEventListener: (n) => { if (n === "deviceorientation") ecouteur = null; }, matchMedia: (q) => ({ matches: /pointer: coarse/.test(q) }), DeviceOrientationEvent: function () {}, ontouchstart: null };
  const d = { addEventListener() {}, documentElement: { addEventListener() {} }, hidden: false, getElementById: () => ({}), querySelector: () => carte, createElement: () => ({}), querySelectorAll: () => [] };
  const f = { window: w, document: d, requestAnimationFrame: (fn) => { file.push(fn); return file.length; }, cancelAnimationFrame() {}, setTimeout, clearTimeout, Date: { now: () => t }, __SOREAL_IDLE_REG__: {} };
  vm.runInNewContext(src, f);
  const G = f.window.__SOREAL_IDLE_ALBUM_TITANS_V1__;
  G.gyroOuvrir();
  const lire = () => ({ rx: +props["--rx"] || 0, ry: +props["--ry"] || 0, lx: +props["--lx"] || 0, ly: +props["--ly"] || 0 });
  // seq(tSec) -> {b,g} ; evenements a 60 Hz, images a hz ; renvoie la trace image par image
  const run = (seq, dur, hz = 60) => {
    const out = []; let nextEv = 0;
    for (t = 0; t < dur * 1000; t += 1000 / hz) {
      while (nextEv <= t) { const a = seq(nextEv / 1000); ecouteur({ beta: a.b, gamma: a.g, timeStamp: nextEv + 1 }); nextEv += 1000 / 60; }
      file.splice(0).forEach((fn) => fn(t + 1));
      out.push({ t: t / 1000, ...lire() });
    }
    return out;
  };
  return { run, G, ecoute: () => ecouteur !== null };
}
const saut = (o) => { let m = 0; for (let i = 1; i < o.length; i++) m = Math.max(m, Math.abs(o[i].rx - o[i - 1].rx), Math.abs(o[i].ry - o[i - 1].ry)); return m; };
const ampli = (o) => Math.max(...o.map((x) => Math.max(Math.abs(x.rx), Math.abs(x.ry))));

// 1. SIGNES par axe, depuis le repos beta = 60 (gamma > 0 : bord droit vers l'arriere ; beta croissant : bord haut vers soi)
for (const [nom, b, g, attendu] of [
  ["bord droit vers l'arriere", 60, 15, { ry: -1, lx: -1 }],
  ["bord gauche vers l'arriere", 60, -15, { ry: 1, lx: 1 }],
  ["bord haut vers soi", 75, 0, { rx: 1, ly: -1 }],
  ["bord bas vers soi", 45, 0, { rx: -1, ly: 1 }],
]) {
  const B = banc();
  const o = B.run((s) => (s < 0.1 ? { b: 60, g: 0 } : { b, g }), 0.6);
  const v = o[o.length - 1];
  for (const [axe, sg] of Object.entries(attendu)) assert.ok(Math.sign(v[axe]) === sg && Math.abs(v[axe]) > 0.1, nom + " : " + axe + " de signe " + sg + " (obtenu " + v[axe] + ")");
}

// 2. Continuite : pres de beta = 90, gamma qui balaie de -60 a 60 (gimbal lock) : la carte ne bouge pas
{ const o = banc().run((s) => ({ b: 90, g: -60 + 30 * s }), 4); assert.ok(ampli(o) < 1, "beta = 90 : gamma sans effet (" + ampli(o) + ")"); }
// 3. Passage de +180 a -180 : aucun saut
{ const o = banc().run((s) => { let b = 170 + 10 * s; if (b > 180) b -= 360; return { b, g: 0 }; }, 2); assert.ok(saut(o) < 1, "saut de +/-180 : pas de saut de carte (" + saut(o) + ")"); }
// 4. Rotation autour de la verticale (alpha seul) : rien -- alpha n'est jamais lu
assert.ok(!/ev\.alpha/.test(src), "alpha ignore");
// 5. Pose de repos qui suit : telephone incline puis immobile 5 s => retour a plat ; changement de posture lent => plat
{ const o = banc().run((s) => ({ b: 60, g: s < 0.5 ? 0 : 20 }), 8); const fin = o[o.length - 1]; assert.ok(ampli(o) > 3 && Math.hypot(fin.rx, fin.ry) < 0.5, "revient a plat apres immobilite (fin " + Math.hypot(fin.rx, fin.ry).toFixed(2) + ")"); }
{ const o = banc().run((s) => ({ b: 60 - Math.min(s, 3) * 10, g: 0 }), 9); const fin = o[o.length - 1]; assert.ok(Math.hypot(fin.rx, fin.ry) < 0.8, "changement de posture : la carte revient a plat"); }
// 6. Amplitude douce, butee douce, pas de zone morte, independance de la cadence
{ const o = banc().run((s) => ({ b: 60, g: s < 0.1 ? 0 : 80 }), 1); assert.ok(ampli(o) <= 12.01, "butee douce a 12 degres"); }
{ const o = banc().run((s) => ({ b: 60, g: s < 0.1 ? 0 : 3 }), 0.8); assert.ok(ampli(o) > 0.3, "pas de zone morte : 3 degres de telephone bougent la carte"); }
{
  const pas = (hz) => banc().run((s) => ({ b: 60, g: s < 0.3 ? 0 : 15 }), 0.5, hz).find((x) => x.t >= 0.4 - 1e-9).ry;
  assert.ok(Math.abs(pas(60) - pas(120)) < 0.3, "meme reponse a 60 et a 120 Hz (" + pas(60) + " / " + pas(120) + ")");
}
// 7. Tremblement de la main : tres filtre (variation moyenne par image)
{ let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  const o = banc().run(() => ({ b: 60 + rnd(), g: rnd() }), 3); let s = 0; for (let i = 61; i < o.length; i++) s += Math.abs(o[i].ry - o[i - 1].ry) + Math.abs(o[i].rx - o[i - 1].rx);
  assert.ok(s / (o.length - 61) < 0.05, "tremblement filtre"); }
// 8. Ecouteur retire a la fermeture
{ const B = banc(); assert.ok(B.ecoute()); B.G.gyroFermer(); assert.ok(!B.ecoute(), "ecouteur retire"); }
console.log("idle-album-titans-gyro-naturel-v1 : ok");
