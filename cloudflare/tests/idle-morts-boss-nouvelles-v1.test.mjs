import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-28) : « maintenant il en faut des nouvelles dans ce style, mais pour les boss ». Cinq morts de boss (éboulement, poussière, fonte, foudre, enfoncement), chacune avec son son synthétisé.
 * Module prêt mais PAS encore chargé par le jeu : page d'aperçu cloudflare/tools/apercu-morts/ (validation avant intégration). Ce test garde : cinq variantes, chaque image se dessine sans erreur de bout en bout, un son par variante.
 */
const src = readFileSync("cloudflare/public/modules/morts-boss-nouvelles-v1.js", "utf8");
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
const idx = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(idx.includes("/modules/morts-boss-nouvelles-v1.js?v="), "module chargé par le jeu (validé par Norman le 2026-10-28)");
const combat = readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
assert.ok(combat.includes("nouvelle.jouerSurHote(host,image,idMortV1)") && combat.includes("arcade.doitJouer(REG.idleEtat,Date.now()-debutCombatV1)"), "branché sur la mort du boss, mêmes conditions que l'écran de victoire (combat d'au moins 5 s, pas de NUKE)");
assert.ok(combat.indexOf("nouvelle.jouerSurHote") < combat.indexOf("arcade.jouer(host,image"), "tirage avant l'éclatement en pixels : s'il retombe dessus, l'ancien comportement joue");
assert.ok(src.includes("jouerSurHote") && src.includes("app.jouerApres(hote,idMort,true)") && src.includes("data-morph-garder") && src.includes("derniere"), "calque gardé par le redessin, passage de main à l'apparition, jamais deux fois la même");
console.log("idle-morts-boss-nouvelles-v1: OK");
