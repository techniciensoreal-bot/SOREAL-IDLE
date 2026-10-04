import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « le menu fixe de chaque page, avec les infos, prend beaucoup de place dans le haut ; on ne pourrait pas le réduire tout en gardant son aspect actuel ? »
 * Mesure sur maquette avec les vraies feuilles de style : bloc d'infos de 327 px à 124 px sur PC, de 380 px à 210 px sur téléphone, même habillage.
 */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const debut = css.indexOf("BANDEAU D'INFOS COMPACT");
assert.ok(debut > 0);
const bloc = css.slice(debut);

// Énergie et Magie sur une ligne : titre et vitesse à gauche, barre à droite, barre moins haute (34 -> 26 px, 24 px sur téléphone).
assert.ok(bloc.includes("grid-template-columns:minmax(190px,.85fr) minmax(0,2fr)") && bloc.includes("grid-row:1 / span 2;height:26px!important"));
assert.ok(bloc.includes("margin:0 0 6px!important;padding:6px 12px!important"), "marges et rembourrage réduits");
// Les huit tuiles sur une seule ligne (PC) puis quatre par ligne (téléphone), et plus petites.
assert.ok(bloc.includes("grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:6px;margin-bottom:8px"));
assert.ok(bloc.includes("grid-template-columns:repeat(4,minmax(0,1fr));gap:5px") && bloc.includes("height:24px!important"));
assert.ok(bloc.includes("padding:4px 8px!important;font-size:10.5px"), "tuiles compactes");
// Même habillage : on ne touche ni aux couleurs, ni aux coins, ni à la barre en trapèze, ni aux variables du thème.
assert.ok(!/background\s*:|clip-path|border-radius|--th-/.test(bloc.split("@media")[0].replace(/var\(--th-[a-z]+\)/g, "")), "aucune couleur ni forme redéfinie : l'aspect reste celui du thème");
// Les règles d'origine (habillage) sont toujours là.
assert.ok(css.includes("clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)") && css.includes("Tuiles de chiffres : plaquettes HUD"));
// Très petits écrans : deux colonnes.
assert.ok(bloc.includes("@media (max-width:340px)"));
let d = 0; for (const c of css) { if (c === "{") d++; if (c === "}") d--; }
assert.equal(d, 0, "accolades CSS équilibrées");
console.log("idle-bandeau-infos-compact-v1: OK");
