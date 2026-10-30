/* Cadres de titre, lot A (Norman, 2026-10-30) : chaque menu du lot a son bloc, aucun « !important », aucune règle hors de ses menus, animations coupées par prefers-reduced-motion. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("cloudflare/public/soreal-idle-entetes-a.css", "utf8");
const LOT = ["entrainement", "augmentations", "avance", "machine", "hacks", "wishes", "questing"];

assert.ok(!/!important/.test(css), "aucun !important dans le fichier du lot A");
for (const m of LOT) {
  const pre = `.soreal-idle-page-root-v28[data-menu="${m}"] .soreal-idle-page-head-v28[data-entete-menu]`;
  for (const part of ["", "::before", "::after", " .soreal-idle-page-title-v28", " .soreal-idle-page-sub-v28"]) {
    assert.ok(css.includes(pre + part + "{"), `${m} : règle ${part || "cadre"} absente`);
  }
}
const menusVus = new Set([...css.matchAll(/data-menu="([^"]+)"/g)].map((x) => x[1]));
assert.deepEqual([...menusVus].sort(), [...LOT].sort(), "aucune règle hors des menus du lot");
/* chaque sélecteur de règle commence par le préfixe renforcé et vise un menu du lot (hors @media/@keyframes) */
for (const x of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(^|\})\s*([^{}@]+)\{/gm)) {
  const sel = x[2].trim();
  if (!sel || /^(from|to)$/.test(sel)) continue;
  assert.ok(sel.startsWith("html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu="), "sélecteur hors cadre : " + sel.slice(0, 80));
}
for (const m of LOT) if (css.includes(`animation:enteteA_${m} `)) {
  const bloc = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"));
  assert.ok(bloc.includes(`data-menu="${m}"] .soreal-idle-page-head-v28[data-entete-menu]::before{animation:none}`), `${m} : animation non coupée en mouvement réduit`);
  assert.ok(css.includes(`@keyframes enteteA_${m}{`) && css.includes(`@keyframes enteteA_${m}_m{`), `${m} : keyframes manquantes`);
}
console.log("ok idle-entetes-lot-a-v1");
