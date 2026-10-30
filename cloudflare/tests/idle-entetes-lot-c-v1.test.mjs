/* Cadres de titre du lot C : chaque menu du lot a son bloc (sélecteur data-menu + cadre de titre), aucun !important, aucune règle hors de ses menus, aucune animation. */
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync(new URL("../public/soreal-idle-entetes-c.css", import.meta.url), "utf8");
const MENUS = ["moneyPit", "wandoos", "yggdrasil", "diggers", "beards", "macguffins", "cooking"];
assert.ok(!/!important/.test(css), "aucun !important");
assert.ok(!/@keyframes|animation\s*:/.test(css), "cadres statiques");
for (const m of MENUS) {
  const sel = `[data-menu="${m}"] .soreal-idle-page-head-v28[data-entete-menu]`;
  assert.ok(css.includes(sel + "::before{"), "bloc ::before absent : " + m);
  assert.ok(css.includes(sel + "::after{"), "bloc ::after absent : " + m);
  assert.ok(css.includes(sel + " .soreal-idle-page-title-v28{"), "titre absent : " + m);
}
/* aucune règle hors des menus du lot : toute règle (hors commentaire) vise un data-menu du lot */
const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");
const regles = sansCommentaires.split("\n").map((l) => l.trim()).filter((l) => l && l.startsWith("html body") || l.startsWith("@media"));
assert.ok(regles.length >= MENUS.length * 7, "règles manquantes");
for (const r of regles) {
  const vises = [...r.matchAll(/\[data-menu="([A-Za-z]+)"\]/g)].map((x) => x[1]);
  assert.ok(vises.length > 0, "règle sans data-menu : " + r.slice(0, 80));
  for (const v of vises) assert.ok(MENUS.includes(v), "menu hors lot : " + v);
}
console.log("ok idle-entetes-lot-c-v1");
