// Norman (2026-10-29) : « les sons de mort sont parfois en double » : une mort qui a son propre son ne rejoue pas le son de défaite générique.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/mort-joueur-v1.js"), b = lire("cloudflare/public/modules/ui-boucle-v1.js");
assert.ok(m.includes("window.__SOREAL_IDLE_MORT_SON_PROPRE_V1__=false;") && m.includes("window.__SOREAL_IDLE_MORT_SON_PROPRE_V1__=true;try{NOUVELLES.son(variante)"));
const i = b.indexOf("mortJoueur.jouer(document.getElementById('sorealIdlePlayerImageHostV43'))"), j = b.indexOf("if(!window.__SOREAL_IDLE_MORT_SON_PROPRE_V1__)jouerEffetAudioIdleV199_('defeat')");
assert.ok(i > 0 && j > i, "le son générique vient après le choix de la mort, et seulement sans son propre");
assert.equal(b.split("jouerEffetAudioIdleV199_('defeat')").length, 2, "un seul appel au son de défaite");
console.log("idle-mort-son-unique-v1 : OK");
