import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-11-03) : les dents dorées du bord du circuit imprimé (Augmentations) sont PLATES (rectangles nets, angles vifs, aucun arrondi) et franchement dorées :
   l'ancien dégradé doux (clair au milieu, sombre aux bords) les faisait paraître arrondies comme des cylindres. Désormais : dégradé à arrêts durs (liseré clair 1 px, aplat or, liseré foncé 1 px). */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const i = css.indexOf("Dents dorées de barrette de RAM");
assert.ok(i > 0, "bloc des dents trouvé");
const bloc = css.slice(i, css.indexOf("Trou sans fond et roue journalière", i));
assert.ok(!/#f7e08e|35%,#d9a93c|70%,#a77a22/.test(bloc), "plus de dégradé doux (effet cylindre)");
for (const sens of ["90deg", "180deg"]) {
  assert.ok(bloc.includes(`linear-gradient(${sens},#ffe27a 0 1px,#f0bb2a 1px 10px,#b98418 10px 11px)`), `dent plate à arrêts durs (${sens})`);
}
assert.ok(!/border-radius\s*:\s*(?!0)/.test(bloc.replace(/border-radius:\s*0/g, "")), "aucun arrondi sur les dents");
assert.ok(!/(radial-gradient|box-shadow|filter\s*:\s*(?!none))/.test(bloc), "ni halo, ni flou, ni cercle");
assert.ok(!/animation\s*:\s*(?!none)/.test(bloc), "aucune animation");
console.log("ok idle-augment-picots-plats-v1");
