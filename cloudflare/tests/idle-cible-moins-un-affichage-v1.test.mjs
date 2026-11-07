import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « le -1 repasse à 0 et me rend mon énergie ; il doit conserver en mémoire le -1 ; les cibles doivent rester en mémoire liées au compte ». Cause trouvée côté écran : l'Entraînement avancé lisait la cible avec
 * idleEntier_ (plafonné à 0) : le -1 gardé par le moteur s'affichait 0 (et le champ était réécrit à 0 à chaque rafraîchissement). Le moteur garde bien les cibles : dans l'état du joueur, donc avec le compte, à travers les synchros et
 * les renaissances (vérifié sur les parties de référence) ; ce test garde l'affichage.
 */
const aug = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
assert.ok(!/H\.idleEntier_\(st\.target\)/.test(aug), "l'Entraînement avancé ne lit plus sa cible avec idleEntier_ (plafonné à 0)");
assert.equal((aug.match(/Math\.max\(-1,Math\.floor\(H\.idleNombre_\(st\.target\)\)\)/g) || []).length, 2, "champ Cible et projection locale gardent le -1");
assert.ok(/aug-cible-v2[^\n]*value="'\+cible\+'"/.test(aug) && /const cible=Math\.max\(-1,H\.idleEntier_\(/.test(aug), "Augmentations : -1 gardé");
const ngu = fs.readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
assert.ok(/var cible=Math\.max\(-1,Math\.floor\(nombre_\(n\.target\)\)\)/.test(ngu), "NGU : -1 gardé");
console.log("idle-cible-moins-un-affichage-v1: OK");
