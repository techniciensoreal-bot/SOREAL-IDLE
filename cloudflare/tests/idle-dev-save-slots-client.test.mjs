import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-24 (Norman) : sélecteur des deux parties A / B, uniquement pendant le développement.
 * Contrôles du client (soreal-idle-ui.js) ; le comportement serveur est couvert par idle-dev-save-slots.test.mjs.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Le serveur décide : le sélecteur n'apparaît que si `actif` est vrai (compte administrateur + fonction active).
assert.match(ui, /\.obtenirPartieDevSorealIdle\(SOREAL_SESSION\)/);
assert.match(ui, /actif:Boolean\(res&&res\.ok&&res\.actif\)/);
assert.match(ui, /if\(!p\|\|!p\.actif\)return '';/, "rien n'est affiché sans droit");
assert.match(ui, /\.definirPartieDevSorealIdle\(SOREAL_SESSION,cible\)/);
assert.match(ui, /if\(res&&res\.ok\)\{\s*location\.reload\(\);/, "la page se recharge après le changement (jeton conservé dans sessionStorage)");

// Affiché en tête de Paramètres, avant Info ; les deux parties nommées ; la partie active est grisée.
const page = ui.slice(ui.indexOf("function pageParametresIdleV28_(j)"), ui.indexOf("function contenuMenuIdleV28_(j)"));
assert.ok(page.indexOf("rendrePartiesDevIdleV1_()") > 0 && page.indexOf("rendrePartiesDevIdleV1_()") < page.indexOf("soreal-idle-info-titre-v1"));
assert.match(ui, /bouton\('a','Partie A','Ta vraie partie'\)/);
assert.match(ui, /bouton\('b','Partie B','Comparaison NGU IDLE'\)/);
assert.match(ui, /active\?'disabled aria-pressed="true" '/);

// Rafraîchi après chaque rendu (une seule requête : l'état passe de null à un objet).
assert.match(ui, /rafraichirPartieDevIdleV1_\(\);/);
assert.match(ui, /if\(idlePartieDevV1!==null\|\|!SOREAL_SESSION\)return;/);

assert.match(css, /\.soreal-idle-parties-dev-bouton-v1\.actif\{/);

console.log("idle-dev-save-slots-client: OK");
