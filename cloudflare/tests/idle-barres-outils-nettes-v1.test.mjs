import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const perso = lire("modules/perso-boutons-v1.js"), ngu = lire("modules/ngu-labo-v1.js"), css = lire("soreal-idle-barre-outils.css"), idx = lire("index.html"), sang = lire("modules/sang-rituel-decor-v1.js");
/* Norman (2026-10-15) : NGU ne se redessine plus, barres d'outils en petits cadres propres, « Max » ne dépasse plus (téléphone et PC), pied de la sangsue sur la table */
assert.ok(perso.includes("r.setAttribute('data-morph-garder','');") && perso.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__") && perso.includes("function(){decorer(false);}"), "rangée « Mes nombres » gardée au redessin (règle n°4)");
assert.ok(perso.includes('<span class="perso-duo-v1">') && perso.includes(".perso-duo-v1{display:grid;grid-template-columns:minmax(0,1fr) 32px;min-width:0}"), "valeur + crayon dans un seul petit cadre");
assert.ok(ngu.includes("data-nl-plafond=\"1\"") && ngu.includes("[data-nl-plafond]>span") && !ngu.includes("nl-ligne:nth-child(2)>span"), "le titre du plafond est retrouvé par une marque, plus par son rang (la rangée « Mes nombres » s'intercale)");
assert.ok(ngu.includes("grid-template-columns:repeat(auto-fit,minmax(72px,1fr))") && ngu.includes(".nl-large{grid-column:span 2}") && ngu.includes("nl-ligne-input"), "barre NGU : un cadre par ligne, boutons de même largeur");
assert.ok(css.includes("@media (max-width:700px)") && css.includes("grid-template-columns:minmax(0,1fr)!important") && css.includes("minmax(64px,1fr)") && css.includes("width:auto!important;min-width:56px!important"), "autres menus : un cadre par ligne sur téléphone, cases de 64 px minimum, boutons +/−/Max qui s'adaptent");
assert.ok(idx.includes("/soreal-idle-barre-outils.css?v=") && idx.indexOf("soreal-idle-barre-outils.css") < idx.indexOf("soreal-idle-itopod.css"), "feuille chargée avant ITOPOD (qui reste la dernière)");
assert.ok(sang.includes("--sg-socle-h") && sang.includes("m.H*0.894"), "le pied du support de la sangsue descend jusqu'à la table, à toute largeur");
console.log("idle-barres-outils-nettes-v1: OK");
