import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Quand un objet absorbe tous les boosts possible, il faut un son
 * spécial pour cette action. »
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const mod = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// 1. Le son existe, exposé dans l'API publique, avec sa propre config (groupe/priorité/durée).
assert.match(audio, /boostAllAbsorption:\{group:"inventory-boost",priority:65,maxAgeMs:1500\}/, "config du son (même groupe que les boosts individuels, priorité plus haute)");
assert.match(audio, /function boostAllAbsorption_\(\)\{/, "la fonction de son doit exister");
assert.match(audio, /boostAllAbsorption:boostAllAbsorption_/, "exposée dans la table interne nom -> fonction");
assert.match(audio, /boostAllAbsorption:function\(\)\{return demander_\("boostAllAbsorption"\);\}/, "exposée dans l'API publique du module");

// 2. Déclenché uniquement pour l'action inventoryAuto/boostAll, et seulement si au moins un boost a réellement été absorbé
//    (stats.applied ou stats.cube > 0, jamais sur un clic à vide).
const bloc = mod.slice(mod.indexOf("Son spécial d'absorption totale"), mod.indexOf("docs/UI-MONOLITH-HISTORY.md#bloc-296"));
assert.match(bloc, /payload\.action==='inventoryAuto'&&/, "ne se déclenche que pour l'action inventoryAuto");
assert.match(bloc, /payload\.mode==='boostAll'&&/, "ne se déclenche que pour le mode boostAll (pas les autres modes inventoryAuto)");
assert.match(bloc, /idleNombre_\(res\.resultat\.applied\)>0\|\|window\.__SOREAL_IDLE_META_HOST_V130__\.idleNombre_\(res\.resultat\.cube\)>0/, "exige au moins un boost réellement absorbé (applied ou cube), jamais sur un clic à vide");
assert.match(bloc, /window\.__SOREAL_IDLE_AUDIO_V199__\.boostAllAbsorption\(\);/, "joue bien le nouveau son dédié");

console.log("idle-boost-all-sound-v1: OK");
