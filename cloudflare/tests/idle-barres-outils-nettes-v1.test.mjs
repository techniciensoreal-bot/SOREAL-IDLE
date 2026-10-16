import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";
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
/* Après une Renaissance : même position qu'un clic sur le menu Combat de boss (sous la bannière) */
{
  const ui = lireUiComplet();
  assert.ok(ui.includes("window.scrollTo(0,ban?Math.max(0,Math.round(ban.getBoundingClientRect().bottom+(window.scrollY||0))):0);"), "après une Renaissance, la page se place sous la bannière comme un clic sur un menu");
}
/* Étages de l'ITOPOD : on recommence au premier ennemi de l'étage choisi ; téléphone : même placement ; Yggdrasil sans bords ; NGU plus sobre */
{
  const ngu = lireSrc("idle-ngu-progression.js"), ui2 = lireUiComplet(), ygg = lire("modules/yggdrasil-elfes-v1.js");
  assert.ok(ngu.includes("  d.floor = start;\n  d.killsOnFloor = 0;\n  return { start, end };") && ngu.includes("if (d.startFloor != null) d.floor = d.startFloor;"), "étages changés : retour au premier ennemi de l'étage de départ (manuel et Auto)");
  assert.ok(!ui2.includes("window.matchMedia('(min-width:701px)').matches)return false;}catch(_e){return false;}\n        const placer"), "placement sous la bannière aussi sur téléphone");
  assert.ok(ygg.includes(".ygg-cadre{padding:0!important;border:0!important") && ygg.includes(".ygg-page{max-width:none!important;margin:0!important}") && ygg.includes("[data-menu=\"yggdrasil\"]:not(#_):not(#_){border:0!important"), "Yggdrasil : plus de bords, pleine largeur");
  assert.ok(ygg.includes(".ygg-nom{font-size:clamp(13px,2.6cqw,16px)!important") && ygg.includes("@container (max-width:560px){.ygg-grille{grid-template-columns:repeat(2,minmax(0,1fr))!important"), "textes plus grands, deux colonnes sur téléphone");
  assert.ok(css.includes(".perso-duo-v1>button:last-child"), "boutons uniformes");
}
/* Boutons uniformes (56 px, Bangers 19 px) et barres de la Machine temporelle plus grosses */
assert.ok(css.includes("min-height:56px!important") && css.includes("font-family:\"Bangers\",\"Comic Sans MS\",cursive!important;font-size:19px!important"), "boutons du haut, de chaque barre et de la Machine temporelle : même taille");
assert.ok(css.includes(".soreal-idle-tm-barre-v1:not(#_)") && css.includes("height:48px!important") && css.includes("@keyframes tmRouages{from{background-position:0 0}to{background-position:28px 0}}") && css.includes("background-size:28px 100%"), "barres de la Machine temporelle : gros tuyau, graduations, rouages qui défilent d'une période exacte");
