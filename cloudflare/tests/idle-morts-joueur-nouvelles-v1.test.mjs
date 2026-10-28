import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-28) : « 5 animations de mort supplémentaires, totalement différentes de ce qu'on a déjà, avec de nouveaux sons ; je veux les voir en local pour valider avant intégration. »
 * Module prêt mais PAS encore chargé par le jeu (index.html) : page d'aperçu cloudflare/tools/apercu-morts/. Ce test garde : cinq variantes distinctes des trois existantes, chaque image se dessine sans erreur du début à la fin, chaque variante a son son.
 */
const src = readFileSync("cloudflare/public/modules/morts-joueur-nouvelles-v1.js", "utf8");
const existantes = readFileSync("cloudflare/public/modules/mort-joueur-v1.js", "utf8");

const ctxFaux = () => new Proxy({ _d: 0 }, {
  get(cible, nom) {
    if (nom in cible) return cible[nom];
    if (nom === "createRadialGradient" || nom === "createLinearGradient") return () => ({ addColorStop() {} });
    if (nom === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(128) });
    if (nom === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
    return () => {};
  },
  set(cible, nom, v) { cible[nom] = v; return true; }
});
const canvasFaux = (w, h) => ({ width: w, height: h, getContext: () => ctxFaux() });
const bac = {
  window: {}, performance: { now: () => 0 }, requestAnimationFrame() {},
  document: { createElement: () => canvasFaux(300, 300) },
  Math, Date, Promise, Uint8ClampedArray, console
};
bac.window = bac;
vm.createContext(bac);
vm.runInContext(src, bac);
const M = bac.__SOREAL_IDLE_MORTS_NOUVELLES_V1__;
assert.ok(M, "module exposé");

const ids = Array.from(M.variantes, (v) => v.id);
assert.deepEqual(ids, ["cendres", "trounoir", "vitre", "tranche", "ame"], "cinq nouvelles morts");
for (const v of M.variantes) assert.ok(v.nom && v.aide && v.duree > 2.5, "nom, aide et durée de " + v.id);
for (const ancienne of ["fondu", "rewind", "clignote"]) assert.ok(!ids.includes(ancienne), ancienne + " reste dans mort-joueur-v1.js");
assert.ok(existantes.includes("variantes:['fondu','rewind','clignote']"), "les trois morts existantes sont inchangées");

const img = { naturalWidth: 300, naturalHeight: 300, width: 300, height: 300 };
for (const v of M.variantes) {
  const k = M.preparer(v.id, img, 300, 300);
  const c = ctxFaux();
  for (let t = 0; t <= v.duree + 0.2; t += 0.05) M.dessiner(v.id, c, t, k, 300, 300);   /* aucune exception, sur toute la durée */
}

// Un son synthétisé par variante, aucun fichier audio.
assert.ok(!/\.(mp3|ogg|wav|m4a)/.test(src), "aucun fichier audio : sons synthétisés");
for (const id of ids) assert.ok(src.includes("id==='" + id + "'"), "son de " + id);
assert.ok(!readFileSync("cloudflare/public/index.html", "utf8").includes("morts-joueur-nouvelles-v1"), "pas encore branché sur le jeu (validation avant intégration)");
console.log("idle-morts-joueur-nouvelles-v1: OK");
