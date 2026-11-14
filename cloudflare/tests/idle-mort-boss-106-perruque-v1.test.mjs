import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-12) : mort SPÉCIALE du boss 106 : « toute l'image tombe comme des cheveux » ; la photo du 107 est derrière (voir idle-boss-106-suivant-derriere-v1). Elle est jouée à chaque mort du 106, hors file des cinq autres.
 */
const src = readFileSync(new URL("../public/modules/morts-boss-nouvelles-v1.js", import.meta.url), "utf8");

// 1. Déclaration : une spéciale pour le boss 106, jamais dans la file des cinq autres.
const compteurs = { drawImage: 0, appels: 0 };
const ctx = new Proxy({}, {
  get(_c, nom) {
    if (nom === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
    if (nom === "createLinearGradient") return () => ({ addColorStop() {} });
    if (nom === "drawImage") return () => { compteurs.drawImage += 1; };
    return () => { compteurs.appels += 1; };
  },
  set() { return true; }
});
const fabrique = () => ({ width: 0, height: 0, getContext: () => ctx });
const window = { __SOREAL_IDLE_MORT_DERRIERE_ACTIF__: true };
const document = { createElement: () => fabrique(), getElementById: () => null, head: { appendChild() {} } };
vm.runInNewContext(src, { window, document, performance: { now: () => 0 }, requestAnimationFrame: () => 0, localStorage: { getItem: () => "", setItem() {} } });
const M = window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__;
assert.ok(M && Array.isArray(M.speciales) && Array.isArray(M.variantes), "module chargé");
const perruque = M.speciales.find((s) => s.id === "perruque");
assert.ok(perruque && perruque.boss === 106 && perruque.duree > 3, "la perruque est la mort du boss 106");
assert.equal(M.variantes.length, 5, "les cinq morts de la file sont inchangées");
assert.ok(!M.variantes.some((v) => v.id === "perruque"), "la perruque n'entre jamais dans la file : elle ne décale pas l'ordre des autres");

// 2. Déclenchement : à chaque mort du 106 seulement, sans toucher à la file ; l'apparition du 107 reste lancée par la mort (une seule fois).
assert.ok(src.includes("var spe=specialeDuBoss(idMort);") && src.includes("var choix=spe?spe.id:suivante_("), "choix forcé pour le boss 106, file intacte");
assert.ok(/function specialeDuBoss\(idBoss\)\{return SPECIALES\.filter\(function\(x\)\{return x\.boss===idBoss;\}\)\[0\]\|\|null;\}/.test(src), "seul le boss déclaré a une spéciale");
assert.ok(src.includes("var DUREES_SON={") && /perruque:\d+/.test(src), "durée du son déclarée");
assert.ok(src.includes("else if(id==='perruque'){") || src.includes("}else if(id==='perruque'){"), "son synthétisé de la perruque");
assert.ok(src.includes("if(window.__SOREAL_IDLE_MORT_DERRIERE_ACTIF__)c.clearRect(0,0,LW,LH);else{c.fillStyle=FOND"), "fin d'aperçu : fond transparent quand la photo du 107 est derrière");

// 3. Dessin : se prépare et se joue sur toute la durée sans erreur, avec un nombre d'appels borné (pas de gouffre de performance), et ne contient aucun texte.
{
  const img = { naturalWidth: 512, naturalHeight: 512, width: 512, height: 512 };
  const k = M.preparer("perruque", img, 220, 220);
  assert.ok(Array.isArray(k.cols) && k.cols.length >= 100, "toute la largeur est découpée en colonnes (mèches)");
  assert.ok(k.cols.every((c) => c.x >= 0 && c.x < 220), "colonnes dans l'image");
  const retards = k.cols.map((c) => c.d);
  assert.ok(Math.min(...retards) >= 0.25 && Math.max(...retards) <= 2.6, "toutes les mèches se détachent entre 0,3 s et 2,5 s");
  let pire = 0;
  for (let t = 0; t <= perruque.duree + 0.1; t += 0.05) {
    compteurs.drawImage = 0; compteurs.appels = 0;
    M.dessiner("perruque", ctx, t, k, 220, 220);
    pire = Math.max(pire, compteurs.drawImage);
  }
  assert.ok(pire < 3200, "au plus ~3 000 petits dessins par image (mesuré : " + pire + ")");
}
console.log("idle-mort-boss-106-perruque-v1 : OK");
