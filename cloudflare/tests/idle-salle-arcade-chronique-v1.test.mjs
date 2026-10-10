import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : décor = salle d'arcade sombre éclairée par des néons (bornes, machines à sous) ; la chronique du boss est un cadre accroché au mur, cliquable pour l'agrandir ou la fermer. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");

// Décor : néons, bornes, machines à sous ; plus de luna park (roue, chapiteau, ballons).
const deco = ui.slice(ui.indexOf("const BORNE_LUNAPARK_IDLE_V2="), ui.indexOf("let borneAllumageDebutIdleV2=0;"));
for (const k of ["lp-neon", "lp-ecran", "lp-ampoule", "GAME", "JACKPOT", "SLOTS"]) assert.ok(deco.includes(k), k);
for (const k of ["lp-roue", "lp-ballon", "lp-fanion", "lp-wagon"]) assert.ok(!deco.includes(k), "plus de " + k);
const salle = css.slice(css.indexOf("Salle d'arcade derrière la borne"));
for (const k of ["lpNeon", "lpEcran"]) assert.ok(new RegExp("@keyframes " + k + "\{0%,100%\{").test(salle), k + " : départ = arrivée (boucle sans à-coup)");
assert.ok(salle.includes("prefers-reduced-motion:reduce"), "mouvement réduit coupé");

// Chronique : hors de la borne (qui porte un filtre) ; cadre fermé au mur, agrandi au clic, refermé par la croix, un clic dehors ou Échap ; l'état survit au redessin.
const page = ui.slice(ui.indexOf("function pageCombatIdleV28_(j){"), ui.indexOf("function skillBasicTrainingIdleV120_("));
assert.ok(page.includes("${chroniqueMur?chronique:''}") && page.includes("${chroniqueMur?'':chronique}"), "chronique au mur, bouton Admin à l'ancienne place");
assert.ok(ui.includes("class=\"soreal-idle-boss-lore-v142${window.__chroniqueOuverteIdleV1?' ouverte':''}\"") && ui.includes("soreal-idle-lore-fermer-v1"), "état ouvert conservé, croix de fermeture");
for (const k of ["e.key==='Escape'", "if(window.__chroniqueOuverteIdleV1)poser(false);", "poser(true);"]) assert.ok(ui.includes(k), k);
assert.ok(salle.includes(".soreal-idle-boss-lore-v142.ouverte{display:block!important;position:fixed!important") && salle.includes('content:"Lire la chronique"'), "cadre au mur, parchemin agrandi");
assert.ok(ui.includes('id="sorealIdleBossChroniqueV206"') && ui.includes("data-soreal-chronique-boss-id"), "le panneau reste dans la page (lecture à voix haute automatique)");
assert.ok(css.includes("@media (max-width:560px){") && css.includes("padding-top:158px!important") && css.includes("left:50%;top:12px;width:200px"), "téléphone : cadre accroché au centre du mur, au-dessus de la borne");
assert.ok(!/:not(.ouverte)::after{[^}]*position:absolute/.test(salle), "l'invite fait partie du cadre (plus coupée)");
console.log("idle-salle-arcade-chronique-v1: OK");
