import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

/*
 * Police de la page Yggdrasil (Norman, 2026-11-03) : « change la police d'écriture de cette page, titres et boutons, pour que ça colle plus au thème ».
 * Cinzel (capitales romaines, SIL Open Font, police variable 400-900) pour les noms de fruits, boutons et onglets ; Cinzel Decorative 700 pour le titre.
 * Polices servies depuis le dépôt (jamais un CDN), font-display:swap, repli sur Georgia/serif. Les gros textes de lecture restent en Georgia.
 */
const css = readFileSync("cloudflare/public/fonts/fonts.css", "utf8");
const ygg = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const faces = css.split("@font-face").slice(1);
for (const [famille, fichier, poids] of [["Cinzel", "cinzel-400-900-latin.woff2", "400 900"], ["Cinzel Decorative", "cinzel-decorative-700-latin.woff2", "700"]]) {
  const f = faces.find((b) => b.includes("font-family:'" + famille + "'"));
  assert.ok(f, famille + " déclarée dans fonts.css");
  assert.ok(f.includes("font-display:swap"), famille + " : font-display swap");
  assert.ok(f.includes("url(/fonts/" + fichier + ")"), famille + " : fichier du dépôt, pas un CDN");
  assert.ok(f.includes("font-weight:" + poids), famille + " : poids " + poids);
  assert.ok(/unicode-range:[^;]*U\+0000-00FF/.test(f) && f.includes("U+0152-0153"), famille + " : latin avec accents français et œ");
  const taille = statSync("cloudflare/public/fonts/" + fichier).size;
  assert.ok(taille > 5000 && taille < 60000, fichier + " existe et pèse moins de 60 Ko (" + taille + ")");
}
assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun CDN externe dans fonts.css");
assert.ok(/--ygg-titres:'Cinzel',Georgia[^;]*serif;/.test(ygg.split(String.fromCharCode(92)).join("")), "variable --ygg-titres : Cinzel puis repli Georgia, serif");
for (const sel of [".ygg-nom{", ".ygg-btn{", ".ygg-mode button{", ".ygg-poop{", ".ygg-onglet{", ".ygg-aide-bouton{", ".ygg-auto button{"]) {
  const ligne = ygg.split("\n").find((l) => l.includes("'" + sel));
  assert.ok(ligne && ligne.includes("var(--ygg-titres)"), sel + " utilise --ygg-titres");
}
assert.ok(/\.ygg-titre b\{[^}]*Cinzel Decorative[^}]*var\(--ygg-titres\)/.test(ygg), "titre de la page : Cinzel Decorative avec repli");
assert.ok(/\.ygg-page\{[^}]*font-family:Georgia/.test(ygg), "le texte de lecture reste en Georgia");
assert.ok(ygg.includes("{--f-titre:var(--ygg-titres);--f-texte:var(--ygg-titres)}") && /.ygg-titre b{--f-titre:[^}]*Cinzel Decorative/.test(ygg), "les variables --f-titre / --f-texte du thème (lues par des règles !important) pointent vers Cinzel sur les éléments concernés");
assert.ok(ygg.includes(".ygg-page :is(.ygg-btn,.ygg-poop,.ygg-mode button,.ygg-auto button):disabled{color:#f4f7ea!important") && ygg.includes("font-weight:800!important"), "boutons grisés lisibles : couleur claire plus spécifique que la règle globale button:disabled, texte gras");
assert.ok(ygg.includes("text-transform:uppercase;letter-spacing:.05em}") && ygg.includes(".ygg-page .ygg-btn small{text-transform:none"), "boutons en capitales (Cinzel n'a pas de minuscules), petit texte inchangé");
console.log("idle-ygg-police-v1 ok");
