import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-11) : sur PC, la molette sur les menus ne fait défiler que les menus ; sur la zone de jeu, que le jeu ; aucune barre de défilement visible. */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const m = css.match(/\.soreal-idle-native-v4>\.soreal-idle-nav-v28\{\s*grid-column:1;[\s\S]*?\n  \}/);
assert.ok(m, "bloc du menu PC");
assert.ok(/position:sticky/.test(m[0]) && /overflow-y:auto!important/.test(m[0]) && /max-height:calc\(100vh/.test(m[0]), "menu collé, plafonné à la fenêtre, défilement propre");
assert.ok(/overscroll-behavior:contain/.test(m[0]) && /scrollbar-width:none/.test(m[0]), "l'élan ne passe pas à la page, aucune barre visible");
assert.ok(css.includes(".soreal-idle-nav-v28::-webkit-scrollbar{display:none"), "barre masquée (WebKit)");
console.log("idle-menu-pc-defilement-propre-v1: OK");
