import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : audit de visibilité sur PC (taille de police) et dispositions : sur écran d'ordinateur, les petits textes passent à 13-14 px et la page Réglages se range en deux colonnes ; le téléphone ne change pas. */
const css = readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
const debut = css.indexOf("/* Audit de visibilité sur PC");
assert.ok(debut > 0, "bloc PC présent");
const bloc = css.slice(debut, css.indexOf("/* ===== Trou sans fond"));   /* bloc borné : les blocs ajoutés après (Trou sans fond, roue) ont leurs propres règles */
assert.ok(bloc.includes("@media (min-width:1100px){"), "réservé aux écrans d'ordinateur");
assert.ok(/\.soreal-idle-page-sub-v28\{font-size:14px/.test(bloc), "sous-titres de page à 14 px");
assert.ok(/\.nl-pct,\.nl-eta,\.rb2-lib,\.rb2-note,\.bm-etagere-lib/.test(bloc) && /\{font-size:13px\}/.test(bloc), "libellés à 13 px");
assert.ok(bloc.includes('[data-menu="parametres"]{display:block;column-count:2;column-gap:16px}'), "Réglages en deux colonnes équilibrées");
assert.ok(bloc.includes('[data-menu="parametres"]>:is(.soreal-idle-page-head-v28,.rg-onglets-v1,.rg-aide-v1){column-span:all}'), "le titre, les onglets et l'aide gardent toute la largeur");
assert.ok(!/!important/.test(bloc), "aucune surcharge forcée de plus (la dette CSS ne monte pas)");
const ancien = css.slice(0, debut);
assert.ok(ancien.includes(".cal-jour-v1{font-size:13px!important}"), "calendrier à 13 px sur PC");
console.log("idle-pc-lisibilite-v1: OK");
