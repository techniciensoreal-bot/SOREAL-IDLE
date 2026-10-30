// Cadres de titre du lot d (ngu, sang, cards, chroniques, shop, chat, parametres, admin) : chaque menu a son bloc, vise son data-menu, sans !important, sans animation, et le fichier ne contient aucune règle hors de ces menus.
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync(new URL("../public/soreal-idle-entetes-d.css", import.meta.url), "utf8");
const MENUS = ["ngu", "sang", "cards", "chroniques", "shop", "chat", "parametres", "admin"];
assert.ok(!/!important/.test(css), "aucun !important");
assert.ok(!/pointer-events\s*:\s*none/.test(css), "pas de pointer-events:none");
assert.ok(!/@keyframes|animation\s*:/.test(css), "cadres statiques (aucune boucle à rater)");
const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");
// découpe en règles de premier niveau (les @media contiennent des règles)
const regles = [];
let prof = 0, debut = 0;
for (let i = 0; i < sansCommentaires.length; i++) {
  const c = sansCommentaires[i];
  if (c === "{") { if (prof === 0) debut = i; prof++; }
  else if (c === "}") { prof--; if (prof === 0) regles.push(sansCommentaires.slice(0, i + 1)); if (prof === 0) { /* reset */ } }
}
const selecteurs = [];
const re = /(^|\})\s*([^{}@][^{}]*)\{/g;
let m;
while ((m = re.exec(sansCommentaires))) if (!m[2].trim().startsWith("@")) selecteurs.push(m[2].trim());
assert.ok(selecteurs.length > 40, "règles présentes");
for (const s of selecteurs) assert.ok(MENUS.some((x) => s.includes(`[data-menu="${x}"]`)), "règle hors des menus du lot d : " + s.slice(0, 100));
for (const menu of MENUS) {
  const tete = menu === "sang" ? ".bm-entete[data-entete-menu]" : ".soreal-idle-page-head-v28[data-entete-menu]";
  const sel = `[data-menu="${menu}"] ${tete}`;
  assert.ok(selecteurs.some((s) => s.includes(sel + "::before")), "fond (::before) manquant pour " + menu);
  assert.ok(selecteurs.some((s) => s.includes(sel + "::after")), "liseré (::after) manquant pour " + menu);
  assert.ok(selecteurs.some((s) => s.endsWith(sel)), "cadre manquant pour " + menu);
}
// le fond de chaque menu est un vrai dessin : au moins un SVG encodé et un dégradé
const fonds = sansCommentaires.match(/::before\{content:""[^}]*\}/g) || [];
assert.ok(fonds.length >= MENUS.length, "un fond par menu");
for (const f of fonds) assert.ok(/data:image\/svg\+xml/.test(f) && /gradient/.test(f), "fond sans dessin SVG");
// NGU : soleil et lune, étoiles, collines
assert.ok(/data:image\/svg\+xml/.test(css), "dessins SVG");
// la hauteur du cadre n'est jamais modifiée ici
assert.ok(!/[^-]height\s*:/.test(sansCommentaires.replace(/background-size[^;}]*/g, "")), "la hauteur du cadre est imposée ailleurs");
console.log("ok idle-entetes-lot-d-v1");
