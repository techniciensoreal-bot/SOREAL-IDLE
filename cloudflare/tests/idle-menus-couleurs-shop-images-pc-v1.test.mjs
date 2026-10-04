import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : menu de gauche sans défilement sur PC ; images moins démesurées sur PC ; bouton Shop mauve et « boutique magique » ; une couleur différente pour chaque menu.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// 1. Une couleur différente par menu.
const bloc = ui.slice(ui.indexOf("const IDLE_NAV_COULEURS_V1={"));
const table = bloc.slice(0, bloc.indexOf("};"));
const couleurs = Object.fromEntries([...table.matchAll(/(\w+):'(#[0-9a-f]{6})'/g)].map((m) => [m[1], m[2]]));
const menus = [...ui.matchAll(/\{id:'([a-zA-Z]+)',icon:'[^']*',nom:'[^']*'\}/g)].map((m) => m[1]).filter((id) => id !== "admin");
assert.ok(menus.length >= 31);
const vus = new Map();
for (const id of menus) {
  const c = couleurs[id];
  assert.ok(c, "couleur du menu " + id);
  assert.ok(!vus.has(c), `couleur ${c} partagée par ${id} et ${vus.get(c)}`);
  vus.set(c, id);
}
// 2. Le Shop est mauve (teinte 260-290°) et prend l'icône d'une boutique magique.
const hexVersTeinte = (h) => { const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let t = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; t *= 60; return t < 0 ? t + 360 : t; };
for (const id of ["shop", "spendExp", "sellout"]) { const t = hexVersTeinte(couleurs[id]); assert.ok(t > 255 && t < 295, id + " mauve : " + Math.round(t) + "°"); }
assert.ok(ui.includes("{id:'shop',icon:'🔮',nom:'Shop'}") && ui.includes("shop:{forme:'etoile',verbe:'Boutique magique'}"));
assert.ok(css.includes('.soreal-idle-nav-button-v28[data-menu-id-v1="shop"]:not(.active)') && css.includes("sorealBoutiqueMagieV1"), "dégradé étoilé et étincelles");
// 3. Menu de gauche sans défilement sur PC : deux colonnes compactes.
assert.ok(css.includes("grid-template-rows:repeat(var(--nav-lignes,17),auto);grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-columns:minmax(0,1fr);"));
assert.ok(css.includes("grid-template-columns:236px minmax(0,1fr)") && css.includes("grid-template-columns:448px minmax(0,1fr)"), "PC : une colonne (236 px) ; TV : deux colonnes (448 px)");
// 4. Images plafonnées sur PC.
assert.ok(css.includes("repeat(auto-fill,minmax(130px,150px))!important"), "vignettes de Collection et de Bestiaire");
assert.ok(css.includes(".soreal-idle-duel-fighter-v42 .soreal-idle-duel-portrait-v41{width:min(320px,100%)!important"), "portraits de combat");
assert.ok(css.includes(".soreal-idle-boss-fiche-image-v1{") && css.includes("height:min(340px,44vh)"), "fiche de boss : cadre de taille vignette, image entière (2026-10-04)");
console.log("idle-menus-couleurs-shop-images-pc-v1: OK (" + menus.length + " menus, " + vus.size + " couleurs)");
