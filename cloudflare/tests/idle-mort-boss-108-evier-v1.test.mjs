import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-21) : mort SPÉCIALE du boss 108 : « je veux qu'il se vide comme de l'eau dans un évier avec le son qui colle bien ». Jouée à chaque mort du 108, hors file des cinq autres (comme la perruque du 106 et la déchirure du 114).
 */
const src = readFileSync(new URL("../public/modules/morts-boss-nouvelles-v1.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const compteurs = { putImageData: 0 };
const ctx = new Proxy({}, {
  get(_c, nom) {
    if (nom === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
    if (nom === "createImageData") return (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
    if (nom === "createLinearGradient") return () => ({ addColorStop() {} });
    if (nom === "putImageData") return () => { compteurs.putImageData += 1; };
    return () => {};
  },
  set() { return true; }
});
const window = {};
const document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }), getElementById: () => null, head: { appendChild() {} } };
vm.runInNewContext(src, { window, document, performance: { now: () => 0 }, requestAnimationFrame: () => 0, localStorage: { getItem: () => "", setItem() {} } });
const M = window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__;
assert.ok(M && Array.isArray(M.speciales) && Array.isArray(M.variantes), "module chargé");

// 1. Déclaration : spéciale du boss 108 ; la file des cinq autres, la perruque (106) et la déchirure (114) sont inchangées.
const e = M.speciales.find((s) => s.id === "evier");
assert.ok(e && e.boss === 108 && e.duree >= 3.5 && e.duree <= 5, "l'évier est la mort du boss 108");
assert.equal(M.variantes.length, 5, "les cinq morts de la file sont inchangées");
assert.ok(!M.variantes.some((v) => v.id === "evier"), "l'évier n'entre jamais dans la file");
assert.equal(M.speciales.find((s) => s.id === "perruque").boss, 106, "la perruque reste la mort du 106");
assert.equal(M.speciales.find((s) => s.id === "dechirure").boss, 114, "la déchirure reste la mort du 114");
assert.ok(/DUREES_SON=\{[^}]*evier:\d+/.test(src), "durée du son déclarée");
assert.ok(src.includes("else if(id==='evier'){"), "son synthétisé de l'évier");

// 2. Le son est CALÉ sur l'image : le dernier « glouk » tombe à l'instant où l'eau a fini de partir (EVIER_TFIN), et la durée du son couvre l'animation.
const tfin = Number(/EVIER_TFIN=([\d.]+)/.exec(src)[1]);
assert.ok(new RegExp("ton\\(a,t\\+" + String(tfin).replace(".", "\\.") + ",'sine',330,70").test(src), "le dernier glouk tombe quand l'eau a fini de partir (" + tfin + " s)");
assert.ok(Number(/evier:(\d+)/.exec(src)[1]) / 1000 >= e.duree, "le son dure au moins autant que l'animation");

// 3. Le jeu la lance pour tout boss ayant une spéciale (donc aussi le 108).
const jeu = readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
assert.ok(jeu.includes("nouvelle.speciales.some(function(x){return x.boss===idMortV1;})"), "déclenchement par la liste des spéciales (donc aussi le 108)");

// 4. Dessin : se prépare et se joue sur toute la durée sans erreur ; l'image est dessinée en une seule passe (putImageData), l'eau se retire, la bonde reste.
{
  const img = { naturalWidth: 512, naturalHeight: 512, width: 512, height: 512 };
  for (const [LW, LH] of [[220, 220], [140, 200], [100, 100]]) {
    const k = M.preparer("evier", img, LW, LH);
    assert.ok(k.src.constructor.name === "Uint32Array" && k.src.length === LW * LH, "image source lue une fois (" + LW + "x" + LH + ")");
    assert.ok(k.R >= Math.hypot(Math.max(k.bx, LW - k.bx), Math.max(k.by, LH - k.by)), "le rayon de l'eau couvre toute l'image (" + LW + "x" + LH + ")");
    for (let t = 0; t <= e.duree + 0.1; t += 0.05) {
      compteurs.putImageData = 0;
      M.dessiner("evier", ctx, t, k, LW, LH);
      assert.ok(compteurs.putImageData <= 1, "au plus une écriture d'image par image (t=" + t.toFixed(2) + ")");
    }
  }
}
console.log("idle-mort-boss-108-evier-v1 : OK");
