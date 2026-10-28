import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-28) : « maintenant il en faut des nouvelles dans ce style, mais pour les boss ». Cinq morts de boss (éboulement, poussière, fonte, foudre, enfoncement), chacune avec son son synthétisé.
 * Module prêt mais PAS encore chargé par le jeu : page d'aperçu cloudflare/tools/apercu-morts/ (validation avant intégration). Ce test garde : cinq variantes, chaque image se dessine sans erreur de bout en bout, un son par variante.
 */
const src = readFileSync("cloudflare/tools/apercu-morts/morts-boss-nouvelles-v1.js", "utf8");
const ctxFaux = () => new Proxy({ _d: 0 }, {
  get(cible, nom) {
    if (nom in cible) return cible[nom];
    if (nom === "createRadialGradient" || nom === "createLinearGradient") return () => ({ addColorStop() {} });
    if (nom === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(128) });
    return () => {};
  },
  set(cible, nom, v) { cible[nom] = v; return true; }
});
const canvasFaux = (w, h) => ({ width: w, height: h, getContext: () => ctxFaux() });
const bac = { performance: { now: () => 0 }, requestAnimationFrame() {}, document: { createElement: () => canvasFaux(300, 300) }, Math, Date, Promise, Uint8ClampedArray, console };
bac.window = bac;
vm.createContext(bac);
vm.runInContext(src, bac);
const M = bac.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__;
assert.ok(M, "module exposé");
const ids = Array.from(M.variantes, (v) => v.id);
assert.deepEqual(ids, ["eboulement", "poussiere", "fonte", "foudre", "enfoncement"], "cinq morts de boss");
for (const v of M.variantes) assert.ok(v.nom && v.aide && v.duree > 2.5, "nom, aide et durée de " + v.id);
const img = { naturalWidth: 300, naturalHeight: 300, width: 300, height: 300 };
for (const v of M.variantes) {
  const k = M.preparer(v.id, img, 300, 300);
  const c = ctxFaux();
  for (let t = 0; t <= v.duree + 0.2; t += 0.05) M.dessiner(v.id, c, t, k, 300, 300);
}
assert.ok(!/\.(mp3|ogg|wav|m4a)/.test(src), "aucun fichier audio : sons synthétisés");
for (const id of ids) assert.ok(src.includes("id==='" + id + "'"), "son de " + id);
assert.ok(!readFileSync("cloudflare/public/index.html", "utf8").includes("morts-boss-nouvelles-v1"), "pas encore branché sur le jeu (validation avant intégration)");
console.log("idle-morts-boss-nouvelles-v1: OK");
