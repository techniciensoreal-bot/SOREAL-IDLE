import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-09) : une fois les titans débloqués, le menu « Adventure » devient « Adventure & Titans », et le bouton « Titans » de la page brille quand un titan est prêt. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const titans = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

assert.ok(ui.includes("return 'Adventure & Titans'") && ui.includes("a.titans.some(function(t){return t&&t.id&&t.progressionUnlocked!==false;})"), "renommage seulement si un titan est débloqué (anti-spoil)");
assert.ok(ui.includes("function nomMenuIdleV1_(m,j){\n        if(m.id!=='aventure')return m.nom;") || ui.includes("if(m.id!=='aventure')return m.nom;"), "les autres menus gardent leur nom");
assert.ok(ui.includes("idleHtml_(nomMenuIdleV1_(m,j))"), "le bouton du menu utilise le nom calculé");
assert.ok(titans.includes("function disponible(j)") && titans.includes("!cache(t)&&!(prochainRetour(t)>maintenant)") && titans.includes("disponible:disponible"), "titan prêt : débloqué, pas caché, délai écoulé");
assert.ok(ui.includes("soreal-idle-titan-brille-v1") && css.includes("@keyframes soreal-idle-titan-brille-v1") && css.includes("0%,100%{box-shadow:0 0 0 0 rgba(255,196,64,0)") && css.includes("prefers-reduced-motion:reduce){.soreal-idle-titan-brille-v1"), "halo qui boucle sans à-coup (règle n°3)");
console.log("idle-aventure-titans-menu-v1: OK");
