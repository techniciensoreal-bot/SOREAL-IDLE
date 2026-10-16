import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : décor = salle d'arcade sombre éclairée par des néons (bornes, machines à sous) ; la chronique du boss est un cadre accroché au mur, cliquable pour l'agrandir ou la fermer. */
const ui = lireUiComplet();
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");

// Décor : néons, bornes, machines à sous ; plus de luna park (roue, chapiteau, ballons).
const deco = ui.slice(ui.indexOf("const BORNE_LUNAPARK_IDLE_V2="), ui.indexOf("let borneAllumageDebutIdleV2=0;"));
for (const k of ["lp-neon", "lp-ecran", "lp-ampoule", "GAME", "JACKPOT", "SLOTS"]) assert.ok(deco.includes(k), k);
for (const k of ["lp-roue", "lp-ballon", "lp-fanion", "lp-wagon"]) assert.ok(!deco.includes(k), "plus de " + k);
const salle = css.slice(css.indexOf("Salle d'arcade derrière la borne"));
for (const k of ["lpNeon", "lpEcran"]) assert.ok(new RegExp("@keyframes " + k + "\{0%,100%\{").test(salle), k + " : départ = arrivée (boucle sans à-coup)");
assert.ok(salle.includes("prefers-reduced-motion:reduce"), "mouvement réduit coupé");

// Chronique : hors de la borne (qui porte un filtre) ; cadre fermé au mur, agrandi au clic, refermé par la croix, un clic dehors ou Échap ; l'état survit au redessin.
const page = ui.slice(ui.lastIndexOf("function pageCombatIdleV28_(j){"), ui.indexOf("window.__SOREAL_IDLE_PAGE_COMBAT_V1__={"));
assert.ok(page.includes("${chroniqueMur?chronique:''}") && page.includes("${chroniqueMur?'':chronique}"), "chronique au mur, bouton Admin à l'ancienne place");
assert.ok(ui.includes("class=\"soreal-idle-boss-lore-v142${window.__chroniqueOuverteIdleV1?' ouverte':''}\"") && ui.includes("soreal-idle-lore-fermer-v1"), "état ouvert conservé, croix de fermeture");
for (const k of ["e.key==='Escape'", "if(window.__chroniqueOuverteIdleV1)poser(false);", "poser(true);"]) assert.ok(ui.includes(k), k);
assert.ok(salle.includes(".soreal-idle-boss-lore-v142.ouverte{display:block!important;position:fixed!important"), "cadre au mur, parchemin agrandi");
assert.ok(ui.includes('id="sorealIdleBossChroniqueV206"') && ui.includes("data-soreal-chronique-boss-id"), "le panneau reste dans la page (lecture à voix haute automatique)");
assert.ok(css.includes("@media all{") && css.includes("padding-bottom:150px!important") && css.includes("margin:-160px auto 0!important") && css.includes(".bn-lunapark{display:none}"), "téléphone : pas de salle, la borne descend jusqu'au sol et la chronique est centrée dans l'espace sous le monnayeur");
assert.ok(css.includes("clip-path:inset(0 0 16% 0)") && css.includes("--b:16cqw"), "téléphone : borne sans couture, boutons proportionnels à la borne");
assert.ok(!css.includes("calc(210px - 146px)") && !css.includes("min-width:561px"), "PC comme téléphone : plus de porte-affiche posé sur la borne (Norman, 2026-10-10)");
assert.ok(ui.includes("soreal_idle_chronique_main_v1") && ui.includes("chro-main-v1") && css.includes("@keyframes chroMain"), "main d'invitation : une fois, jamais plus après le premier clic");
assert.ok(!/:not(.ouverte)::after{[^}]*position:absolute/.test(salle), "l'invite fait partie du cadre (plus coupée)");
/* Norman (2026-10-11) : les deux rails (bleu et rouge) ne dépassent plus au-dessus de la borne : ils commencent sous le haut du fronton. */
assert.ok(css.includes("#ff2a3d 98.08%) 0 3.4cqw/100% calc(100% - 3.4cqw) no-repeat"), "rails bleu et rouge sous le haut du fronton");
console.log("idle-salle-arcade-chronique-v1: OK");
