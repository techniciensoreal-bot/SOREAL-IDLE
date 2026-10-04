import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « Le temps de jeu n'a pas l'air bon, mon pote a plus de 4 h 29 de jeu : il y a un souci avec le calcul des heures connectées. » Causes : le battement ne comptait que les joueurs ayant cliqué
 * dans les 2 dernières minutes (un jeu idle se regarde sans toucher l'écran) ; le profil affichait l'ANCIENNETÉ du compte sous le nom « Temps de jeu ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const chat = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const srv = readFileSync("cloudflare/src/idle-chat-v1.js", "utf8");

assert.ok(ui.includes("⏱️ Temps de jeu :\n              <strong>${formaterDureeJeuIdleV1_(stats.tempsActifSec)}</strong>"), "le profil montre le vrai temps connecté");
assert.ok(ui.includes("🗓️ Ancienneté :\n              <strong>${dureeProfilIdleV25_(profil)}</strong>"), "l'ancienneté a sa propre ligne");
assert.ok(chat.includes("connecte:document.visibilityState==='visible'"), "le battement dit si la page est visible");
assert.ok(rt.includes("connecte: i.connecte === true"), "transmis au serveur");
assert.ok(srv.includes("(connecte === true || actif === true)"), "compté dès que la page est visible");
assert.ok(srv.includes("IDLE_PRESENCE_ECART_MAX_S_V1 = 90") && srv.includes("IDLE_PRESENCE_GAIN_MAX_S_V1 = 90"));
console.log("idle-temps-de-jeu-profil-v1: OK");
