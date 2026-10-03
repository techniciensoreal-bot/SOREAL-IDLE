import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : « sur PC, l'interface est compactée sur une barre centrale ; on ne pourrait pas la rendre mieux uniquement quand on est sur PC ? » */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const debut = css.indexOf("@media (min-width:1100px) and (hover:hover) and (pointer:fine){");
assert.ok(debut > 0, "mise en page réservée aux grands écrans avec souris (jamais téléphone ni tablette tactile)");
const bloc = css.slice(debut);
assert.ok(bloc.includes("width:min(1700px,calc(100vw - 32px))"), "le jeu occupe la largeur de l'écran");
assert.ok(bloc.includes("grid-template-columns:288px minmax(0,1fr)"), "menu à gauche, page à droite");
assert.ok(bloc.includes("flex-direction:column!important") && bloc.includes("position:sticky"), "menus en colonne, toujours visibles");
assert.ok(bloc.includes(".soreal-idle-hero-banner-v95{grid-column:1/-1}"), "bandeau sur toute la largeur");
// Équilibre des accolades (aucune règle cassée par l'ajout).
let profondeur = 0;
for (const c of css) { if (c === "{") profondeur++; if (c === "}") profondeur--; assert.ok(profondeur >= 0); }
assert.equal(profondeur, 0);
// Le rangement des boutons (glisser-déposer) sait ranger une colonne.
assert.ok(ui.includes("const verticalNav=getComputedStyle(nav).flexDirection==='column';"));
// Ordre des enfants de <main> attendu par la grille : bandeau, menu, puis le reste.
const i = ui.indexOf("`<main class=\"soreal-idle-native-v4\">\n            <div class=\"soreal-idle-hero-v4 soreal-idle-hero-banner-v95\">");
assert.ok(i > 0);
const corps = ui.slice(i, i + 2600);
assert.ok(corps.indexOf("navigationIdleV28_(j)") > 0 && corps.indexOf("navigationIdleV28_(j)") < corps.indexOf("soreal-idle-page-root-v28"));
console.log("idle-interface-pc-v1: OK");

// Harmonie des échelles (Norman, 2026-10-03) : contenu réduit sur PC, cartes du menu à pleine taille.
assert.ok(bloc.includes("*:not(.soreal-idle-nav-v28):not(.soreal-idle-hero-banner-v95){zoom:.86}"), "contenu réduit d'environ 14 % sur PC seulement");
assert.ok(bloc.includes("soreal-idle-nav-cadre-v2{width:46px!important;height:46px!important}"), "badges du menu à pleine taille");

// Bandeau « EN DIRECT » (Norman, 2026-10-03) : sur PC, la colonne de menus ne doit plus le recouvrir (il est au-dessus et la colonne s'arrête avant lui).
{
  const flux = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
  assert.ok(flux.includes("bottom:0;z-index:55;height:34px;"), "bandeau au-dessus de la colonne de menus (z-index 50)");
  assert.ok(bloc.includes("max-height:calc(100vh - 64px)"), "la colonne de menus s'arrête au-dessus du bandeau");
}
console.log("idle-interface-pc-v1 (bandeau En direct): OK");
