import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Cadres de titre, lot b (Norman, 2026-10-30) : chaque menu du lot a son bloc, au thème de sa page ; aucun mot-clé de priorité forcée ; aucune règle hors de ces menus. */
const css = readFileSync("cloudflare/public/soreal-idle-entetes-b.css", "utf8");
const MENUS = ["aventure", "renaissance", "titans", "tower", "challenges", "perks", "quirks"];
assert.ok(!/!\s*important/i.test(css), "aucun !important dans le fichier du lot b");
const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");
const selecteurs = [...sansCommentaires.replace(/@media[^{]*\{/g, "").matchAll(/(?:^|\})\s*([^{}@][^{}]*)\{/g)].map((m) => m[1].trim());
assert.ok(selecteurs.length >= MENUS.length * 5, "assez de règles");
for (const s of selecteurs) {
  for (const part of s.split(",")) {
    const m = part.match(/\[data-menu="([a-zA-Z]+)"\]/);
    assert.ok(m, "chaque sélecteur cible un data-menu : " + part.slice(0, 80));
    assert.ok(MENUS.includes(m[1]), "menu hors du lot b : " + m[1]);
    assert.match(part, /\.soreal-idle-page-head-v28\[data-entete-menu\]/, "cible le cadre de titre");
  }
}
for (const m of MENUS) {
  const bloc = selecteurs.filter((s) => s.includes('[data-menu="' + m + '"]'));
  assert.ok(bloc.some((s) => s.endsWith("::before")), m + " : fond du cadre");
  assert.ok(bloc.some((s) => s.endsWith("::after")), m + " : liseré du cadre");
  assert.ok(bloc.some((s) => s.endsWith(".soreal-idle-page-title-v28")), m + " : titre");
  assert.ok(bloc.some((s) => s.endsWith(".soreal-idle-page-sub-v28")), m + " : mini phrase");
}
assert.ok(!/pointer-events/.test(css), "pas de pointer-events");
assert.ok(!/@keyframes|animation/.test(css), "fichier statique : aucune animation à boucler");
console.log("idle-entetes-lot-b-v1 OK");
