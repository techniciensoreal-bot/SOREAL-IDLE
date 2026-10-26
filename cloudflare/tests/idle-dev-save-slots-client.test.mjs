import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/*
 * 2026-09-27 (Norman, restauré) : sélecteur des deux parties A / B, uniquement pendant le développement.
 * Contrôles du client (soreal-idle-ui.js) ; le comportement serveur est couvert par idle-dev-save-slots.test.mjs.
 */
const ui = lireUiComplet();
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Le serveur décide : le sélecteur n'apparaît que si `actif` est vrai (compte administrateur + fonction active).
assert.match(ui, /\.obtenirPartieDevSorealIdle\(SOREAL_SESSION\)/);
assert.match(ui, /actif:Boolean\(res&&res\.ok&&res\.actif\)/);
assert.match(ui, /if\(!p\|\|!p\.parties\)return '';/, "rien n'est affiché sans les parties");
assert.match(ui, /\.definirPartieDevSorealIdle\(SOREAL_SESSION,cible\)/);
assert.match(ui, /if\(res&&res\.ok\)\{\s*location\.reload\(\);/, "la page se recharge après le changement (jeton conservé dans sessionStorage)");

// Affiché en tête de Paramètres, avant Info ; les deux parties nommées ; la partie active est grisée.
const page = ui.slice(ui.indexOf("function pageParametresIdleV28_(j)"), ui.indexOf("function contenuMenuIdleV28_(j)"));
assert.ok(page.includes("rendrePartiesDevIdleV1_()"), "les parties A, B et C sont dans Ma partie (2026-10-26, pour tout le monde)");
assert.match(ui, /bouton\('a','Partie A','Ma partie principale'\)/);
assert.match(ui, /bouton\('b','Partie B','Pour essayer'\)/);
assert.match(ui, /bouton\('c','Partie C','Pour essayer'\)/);
assert.match(ui, /active\?'aria-pressed="true" aria-current="true" /, "la partie active est marquée, sans clic possible");

// Rafraîchi après chaque rendu (une seule requête : l'état passe de null à un objet).
assert.match(ui, /rafraichirPartieDevIdleV1_\(\);/);
assert.match(ui, /if\(idlePartieDevV1!==null\|\|!SOREAL_SESSION\)return;/);

assert.match(css, /\.soreal-idle-parties-dev-bouton-v1\.actif\{/);

console.log("idle-dev-save-slots-client: OK");
