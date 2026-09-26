import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-26 (Norman) : annonces en fondu non cliquables (set complété, Tutorial Cube -> Infinity Cube), bonus du set en évidence dans la Collection,
 * flèches de zone aussi fiables que le menu déroulant, Comparer à la souris, liaison de service vers TV pour la liste des ouvriers.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const notice = readFileSync("cloudflare/public/modules/fade-notice-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

// Annonce : fondu, jamais cliquable, file d'attente
assert.match(notice, /pointer-events:none/);
assert.match(notice, /transition:opacity/);
assert.match(notice, /window\.__sorealFadeNoticeV1__=function\(titre,lignes,options\)/);
assert.ok(index.includes("/modules/fade-notice-v1.js?v=1"));
assert.ok(index.indexOf("fade-notice-v1.js") < index.indexOf("/soreal-idle-ui.js"), "chargée avant l'interface");

// Détection : set complété et Tutorial Cube (premier état = référence, rien d'annoncé au chargement)
assert.match(ui, /function surveillerEvenementsAventureIdleV1_\(\)\{/);
assert.match(ui, /idleEvenementsVusV1===null\)\{\s*idleEvenementsVusV1=\{sets:new Set\(complets\),cube:cube\};\s*return;/);
assert.match(ui, /notice\('🧩 Set complété : '/);
assert.match(ui, /notice\('🧊 Infinity Cube débloqué !'/);

// Collection : bonus du set en évidence, doré puis vert une fois obtenu
assert.match(ui, /soreal-idle-collection-bonus-v1'\+\(obtenu\?' obtenu':''\)/);
assert.match(css, /\.soreal-idle-collection-bonus-v1\.obtenu\{/);
assert.match(css, /\.soreal-idle-collection-bonus-v1\{[^}]*font|\.soreal-idle-collection-bonus-v1 \.texte\{margin-top:2px;font-size:15px/);

// Zones : envoi fiable et combat local interrompu pour les flèches comme pour le menu (une seule fonction)
assert.match(ui, /function envoyerChoixZoneFiableIdleV1_\(\)\{/);
assert.match(ui, /estOccupeIdleV130_\(\)&&idleZoneEssaisV1<80/);
assert.match(ui, /a\.fight&&a\.fight\.active&&String\(a\.fight\.zone\|\|''\)!==cible/);
assert.match(ui, /window\.__zoneAdventurePrecedenteV1__=zoneAdventurePrecedenteV1_/);
assert.equal((ui.match(/actionAdventureIdleV47_\(\{action:'selectZone'/g) || []).length, 1, "un seul point d'envoi du choix de zone");

// Comparer à la souris : le click qui suit le tap ne referme pas la comparaison
assert.match(ui, /if\(Date\.now\(\)<idleAdventureIgnorerClicJusquaV165\)\{\s*if\(elementObjetGesteAdventureIdleV196_\(event\.target\)\)\{/);

// Liste des ouvriers : liaison de service vers TV (un Worker ne peut pas appeler un autre Worker par workers.dev : erreur 1042 en production)
const wrangler = readFileSync("wrangler.jsonc", "utf8");
assert.match(wrangler, /"binding": "SOREAL_TV_API",\s*"service": "soreal-tv"/);
assert.match(readFileSync("cloudflare/src/idle-itopod-roster-v1.js", "utf8"), /env\.SOREAL_TV_API\.fetch\(new Request\(url, init\)\)/);
console.log("idle-fade-notice-zone-compare-v1: OK");
