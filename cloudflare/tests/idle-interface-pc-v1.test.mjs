import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : « sur PC, l'interface est compactée sur une barre centrale ; on ne pourrait pas la rendre mieux uniquement quand on est sur PC ? » */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const debut = css.indexOf("@media (min-width:1100px) and (hover:hover) and (pointer:fine){");
assert.ok(debut > 0, "mise en page réservée aux grands écrans avec souris (jamais téléphone ni tablette tactile)");
const bloc = css.slice(debut);
assert.ok(bloc.includes("width:min(1700px,calc(100vw - 32px))"), "le jeu occupe la largeur de l'écran");
assert.ok(bloc.includes("grid-template-columns:264px minmax(0,1fr)"), "menu à gauche, page à droite");
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
