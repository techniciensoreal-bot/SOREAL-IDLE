import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-11) : cliquer un bouton du menu ne doit JAMAIS faire bouger la barre des menus (PC). La zone de grille où elle est collée descend jusqu'au bas du document (la marge du bas passe sur la dernière ligne), et une page courte garde une hauteur minimale. */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(css.includes(".soreal-idle-native-v4{padding-bottom:0!important}"), "plus de marge basse sur le conteneur (elle raccourcissait la zone de la barre)");
assert.ok(css.includes(".soreal-idle-native-v4>.soreal-idle-page-root-v28{margin-bottom:110px;min-height:calc(100vh - 200px)}"), "marge du bas et hauteur minimale sur la page");
assert.ok(css.includes("position:sticky;top:12px"), "barre collée");
console.log("idle-menu-pc-barre-immobile-v1: OK");
