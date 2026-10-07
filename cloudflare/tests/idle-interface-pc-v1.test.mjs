import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : « sur PC, l'interface est compactée sur une barre centrale ; on ne pourrait pas la rendre mieux uniquement quand on est sur PC ? » */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const debut = css.indexOf("@media (min-width:1100px) and (hover:hover) and (pointer:fine), (min-width:1500px) and (min-height:800px){");
assert.ok(debut > 0, "mise en page réservée aux grands écrans avec souris (jamais téléphone ni tablette tactile)");
const bloc = css.slice(debut);
assert.ok(bloc.includes("width:min(1700px,calc(100vw - 32px))"), "le jeu occupe la largeur de l'écran");
assert.ok(bloc.includes("grid-template-columns:300px minmax(0,1fr)"), "menu à gauche (une colonne), page à droite");
assert.ok(bloc.includes("display:flex!important;flex-direction:column;") && bloc.includes("overflow:visible!important;max-height:none!important;") && bloc.includes("position:static;"), "menus sur UNE colonne, tout superposé, sans hauteur maximale ni défilement propre (2026-10-04)");
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
assert.ok(bloc.includes("soreal-idle-nav-cadre-v2{width:46px!important;height:46px!important}"), "cartes de menu à la taille de la carte de base (pastille de 46 px)");

// Bandeau « EN DIRECT » (Norman, 2026-10-03) : sur PC, la colonne de menus ne doit plus le recouvrir (il est au-dessus et la colonne s'arrête avant lui).
{
  const flux = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
  assert.ok(flux.includes("bottom:0;z-index:55;height:34px;"), "bandeau au-dessus de la colonne de menus (z-index 50)");
  assert.ok(bloc.includes("position:static;") && bloc.includes("max-height:none!important;"), "la colonne de menus suit la page (plus de colonne collée ni de hauteur maximale) : elle ne peut plus passer sous le bandeau fixe");
}
console.log("idle-interface-pc-v1 (bandeau En direct): OK");

// Bannière SOREAL IDLE (Norman, 2026-10-03) : elle était coupée ; le cadre est plus haut, toute l'image apparaît, et le cadre garde la largeur de l'interface.
assert.ok(bloc.includes(".soreal-idle-hero-banner-v95 img{display:block;width:100%!important;height:auto!important;max-height:380px!important;object-fit:contain!important"), "image entière (contain), cadre à la largeur de l'interface");
assert.ok(!bloc.includes("object-fit:cover"), "plus de recadrage");
assert.ok(bloc.includes(".soreal-idle-hero-banner-v95{height:auto!important;max-height:380px}"), "le cadre suit la hauteur de l'image au lieu de la hauteur fixe de téléphone");

/*
 * Norman (2026-10-04) : « sur PC, Réglages et Admin sont à la droite de toutes les autres au lieu d'être en dessous » : avec 33 menus, 16 lignes fixes créaient une 3e colonne. Le nombre de lignes suit
 * désormais le nombre de menus affichés (la moitié, arrondie au-dessus), posé par le rendu.
 */
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.ok(ui.includes("style=\"--nav-lignes:${Math.max(1,Math.ceil(menusVisibles.length/2))};--nav-rangees:${rangeesMenuIdleV1_()}\""), "nombre de lignes = moitié des menus visibles");
  const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
  assert.ok(!css.includes("grid-template-rows:repeat(16,auto)"), "plus de 16 lignes fixes");
  assert.equal(css.split("grid-template-rows:repeat(var(--nav-lignes,17),auto)").length - 1, 0, "aucune règle à deux colonnes : une colonne partout, même en 1920x1080 (2026-10-05)");
  // 33 menus (admin compris) : 17 lignes, deux colonnes, jamais de troisième.
  for (const n of [28, 32, 33, 34]) assert.ok(Math.ceil(n / 2) * 2 >= n, "tient sur deux colonnes : " + n);
}
console.log("idle-interface-pc-v1 (lignes de menu): OK");

// Boutons de menu plus grands sur PC (Norman, 2026-10-04) : pastille 46 px, emoji 26 px, titre 16 px, verbe visible ; TV (deux colonnes) un peu plus serrée.
{
  const pc = bloc.slice(bloc.indexOf("Boutons plus larges et plus longs"), bloc.indexOf("Images moins démesurées sur PC"));
  assert.ok(pc.includes("min-height:60px") && pc.includes("soreal-idle-nav-emoji-v2{font-size:26px!important}") && pc.includes("soreal-idle-nav-texte-v2 b{font-size:16px!important"), "PC : boutons longs, icône et titre grands");
  assert.ok(pc.includes("soreal-idle-nav-texte-v2 small{display:block;font-size:12px!important"), "PC : le verbe du menu est lisible");
}
