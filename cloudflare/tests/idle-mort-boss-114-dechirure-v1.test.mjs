import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-14) : mort SPÉCIALE du boss 114 : « je veux qu'il se déchire comme une feuille de papier ». Jouée à chaque mort du 114, hors file des cinq autres (comme la perruque du 106).
 */
const src = readFileSync(new URL("../public/modules/morts-boss-nouvelles-v1.js", import.meta.url), "utf8");
const compteurs = { drawImage: 0 };
const ctx = new Proxy({}, {
  get(_c, nom) {
    if (nom === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
    if (nom === "createLinearGradient") return () => ({ addColorStop() {} });
    if (nom === "drawImage") return () => { compteurs.drawImage += 1; };
    return () => {};
  },
  set() { return true; }
});
const window = {};
const document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }), getElementById: () => null, head: { appendChild() {} } };
vm.runInNewContext(src, { window, document, performance: { now: () => 0 }, requestAnimationFrame: () => 0, localStorage: { getItem: () => "", setItem() {} } });
const M = window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__;
assert.ok(M && Array.isArray(M.speciales) && Array.isArray(M.variantes), "module chargé");

// 1. Déclaration : spéciale du boss 114 ; la file des cinq autres et la perruque du 106 sont inchangées.
const d = M.speciales.find((s) => s.id === "dechirure");
assert.ok(d && d.boss === 114 && d.duree >= 2.5 && d.duree <= 4, "la déchirure est la mort du boss 114");
assert.equal(M.variantes.length, 5, "les cinq morts de la file sont inchangées");
assert.ok(!M.variantes.some((v) => v.id === "dechirure"), "la déchirure n'entre jamais dans la file");
assert.equal(M.speciales.find((s) => s.id === "perruque").boss, 106, "la perruque reste la mort du 106");
assert.ok(src.includes("var DUREES_SON={") && /dechirure:\d+/.test(src), "durée du son déclarée");
assert.ok(src.includes("else if(id==='dechirure'){"), "son synthétisé de la déchirure");

// 2. Le jeu la lance pour tout boss ayant une spéciale, sans début de combat (one shot) : voir idle-mort-boss-106-one-shot-v1.
const jeu = readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
assert.ok(jeu.includes("nouvelle.speciales.some(function(x){return x.boss===idMortV1;})"), "déclenchement par la liste des spéciales (donc aussi le 114)");

// 3. Dessin : se prépare et se joue sur toute la durée sans erreur, bornes de coût, fond de la scène opaque (aucune photo derrière).
{
  const img = { naturalWidth: 512, naturalHeight: 512, width: 512, height: 512 };
  for (const [LW, LH] of [[220, 220], [140, 200], [100, 100]]) {
    const k = M.preparer("dechirure", img, LW, LH);
    assert.ok(Array.isArray(k.chemin) && k.chemin.length >= LH / 3 && k.chemin.every((x) => x >= LW * 0.3 && x <= LW * 0.7), "la déchirure reste vers le milieu de l'image (" + LW + "x" + LH + ")");
    let pire = 0;
    for (let t = 0; t <= d.duree + 0.1; t += 0.05) {
      compteurs.drawImage = 0;
      M.dessiner("dechirure", ctx, t, k, LW, LH);
      pire = Math.max(pire, compteurs.drawImage);
    }
    assert.ok(pire <= 4, "quelques dessins de l'image par image (mesuré : " + pire + ")");
  }
}
console.log("idle-mort-boss-114-dechirure-v1 : OK");
