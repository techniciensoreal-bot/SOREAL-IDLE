import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-21) : mort SPÉCIALE du boss 109 : « l'image tombe comme une pancarte vers le fond de l'écran et un petit pet de flamme vient du bas, quand l'image n'est plus à l'écran » ; puis « le bas reste fixe et c'est tout le reste qui tombe
 * en arrière » (bascule en perspective autour du bord bas). Jouée à chaque mort du 109, hors file.
 */
const src = readFileSync(new URL("../public/modules/morts-boss-nouvelles-v1.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const compteurs = { drawImage: 0, flamme: 0 };
const ctx = new Proxy({}, {
  get(_c, nom) {
    if (nom === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
    if (nom === "createLinearGradient" || nom === "createRadialGradient") return () => ({ addColorStop() {} });
    if (nom === "drawImage") return () => { compteurs.drawImage += 1; };
    if (nom === "quadraticCurveTo") return () => { compteurs.flamme += 1; };
    return () => {};
  },
  set() { return true; }
});
const window = {};
const document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }), getElementById: () => null, head: { appendChild() {} } };
vm.runInNewContext(src, { window, document, performance: { now: () => 0 }, requestAnimationFrame: () => 0, localStorage: { getItem: () => "", setItem() {} } });
const M = window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__;
const p = M.speciales.find((s) => s.id === "pancarte");

// 1. Déclaration : spéciale du boss 109, hors file ; les autres inchangées.
assert.ok(p && p.boss === 109 && p.duree >= 2.5 && p.duree <= 4.5, "la pancarte est la mort du boss 109");
assert.equal(M.variantes.length, 5, "les cinq morts de la file sont inchangées");
assert.ok(!M.variantes.some((v) => v.id === "pancarte"), "jamais dans la file");
for (const [id, boss] of [["perruque", 106], ["evier", 108], ["dechirure", 114]]) assert.equal(M.speciales.find((s) => s.id === id).boss, boss, id + " garde son boss");
assert.ok(/DUREES_SON=\{[^}]*pancarte:\d+/.test(src) && Number(/pancarte:(\d+)/.exec(src)[1]) / 1000 >= p.duree, "durée du son déclarée, au moins celle de l'animation");
assert.ok(src.includes("else if(id==='pancarte'){"), "son synthétisé de la pancarte");

// 2. La flamme vient APRÈS la sortie de l'image, et le son part avec elle.
const nombre = (nom) => Number(new RegExp(nom + "=([\\d.]+)").exec(src)[1]);
const tFlamme = nombre("PANC_T_FLAMME"), tChute = nombre("PANC_T_CHUTE"), tCrac = nombre("PANC_T_CRAC"), g = nombre("PANC_GP");
const tSortie = tChute + Math.sqrt(2 * (Math.PI / 2 - 0.1) / g);   /* l'angle atteint 90 degrés : l'image est à plat derrière, de profil */
assert.ok(tCrac < tChute && tChute < tSortie && tSortie < tFlamme, "chaîne qui lâche, chute, sortie de l'image, puis la flamme (" + [tCrac, tChute, tSortie.toFixed(2), tFlamme].join(" < ") + ")");
const sec = (x) => String(x).replace(/^0\./, ".").replace(".", "\\.");
assert.ok(new RegExp("souffle\\(a,t\\+" + sec(tFlamme) + ",[\\d.]+,.bandpass.").test(src) && new RegExp("ton\\(a,t\\+" + sec(tFlamme) + ",.sine.,150,55").test(src), "le pet de flamme sonne à l'instant où la flamme apparaît");
assert.ok(new RegExp("souffle\\(a,t\\+" + sec(tCrac) + ",[\\d.]+,.highpass.").test(src), "le craquement du pied tombe à l'instant où il cède");
assert.ok(new RegExp("ton\\(a,t\\+" + String(Number((tChute + Math.sqrt(2 * (Math.PI / 2 - 0.1) / g)).toFixed(2))).replace(/^0\\./, ".").replace(".", "\\.") + ",.sine.,100,38").test(src), "le coup sourd tombe quand l'image est à plat (" + (tChute + Math.sqrt(2 * (Math.PI / 2 - 0.1) / g)).toFixed(2) + " s)");

// 3. Dessin : tout l'écran sur toute la durée, sans erreur ; une seule image dessinée (jamais deux : pas de copie) ; la flamme n'existe qu'une fois l'image sortie.
{
  const img = { naturalWidth: 512, naturalHeight: 512, width: 512, height: 512 };
  for (const [LW, LH] of [[220, 220], [140, 200], [100, 100]]) {
    const k = M.preparer("pancarte", img, LW, LH);
    for (let t = 0; t <= p.duree + 0.1; t += 0.05) {
      compteurs.drawImage = 0; compteurs.flamme = 0;
      M.dessiner("pancarte", ctx, t, k, LW, LH);
      assert.ok(compteurs.drawImage >= 1 || t >= tSortie, "l'image est dessinée tant qu'elle est à l'écran (t=" + t.toFixed(2) + ")");
      assert.ok(compteurs.drawImage <= LH / 2 + 3, "une bande de deux pixels par rangée au plus (t=" + t.toFixed(2) + ", " + compteurs.drawImage + ")");
      if (t < tSortie) assert.equal(compteurs.flamme, 0, "pas de flamme tant que l'image est à l'écran (t=" + t.toFixed(2) + ")");
      if (t >= tSortie) assert.equal(compteurs.drawImage, 0, "l'image n'est plus dessinée une fois sortie (t=" + t.toFixed(2) + ")");
    }
    compteurs.flamme = 0; M.dessiner("pancarte", ctx, tFlamme + 0.45, k, LW, LH);
    assert.ok(compteurs.flamme >= 6, "la flamme est dessinée en son milieu de vie (" + compteurs.flamme + " courbes)");
  }
}
// 4. Le jeu la lance pour tout boss ayant une spéciale.
assert.ok(readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8").includes("nouvelle.speciales.some(function(x){return x.boss===idMortV1;})"));
console.log("idle-mort-boss-109-pancarte-v1 : OK");
