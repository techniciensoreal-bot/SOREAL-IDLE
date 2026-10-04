import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-04) : « pour les défis, quand on en lance un, il doit y avoir un compteur (qui peut compter plusieurs jours, semaines, mois) ». */
const src = readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8");
const a = src.indexOf("function dureeLongue(ms){");
const b = src.indexOf("function maintenantServeur(){");
assert.ok(a > 0 && b > a);
const dureeLongue = new Function(src.slice(a, b) + "\nreturn dureeLongue;")();
const s = 1000, mn = 60 * s, h = 60 * mn, j = 24 * h, sem = 7 * j, mois = 30 * j;
assert.equal(dureeLongue(0), "00:00:00");
assert.equal(dureeLongue(59 * s), "00:00:59");
assert.equal(dureeLongue(2 * h + 5 * mn + 9 * s), "02:05:09");
assert.equal(dureeLongue(1 * j + 3 * h), "1 j 03:00:00");
assert.equal(dureeLongue(2 * sem + 3 * j + 4 * h + 5 * mn + 6 * s), "2 sem. 3 j 04:05:06");
assert.equal(dureeLongue(2 * mois + 1 * sem + 4 * h), "2 mois 1 sem. 04:00:00", "une unité à zéro n'est pas écrite");
assert.equal(dureeLongue(400 * j), "13 mois 1 sem. 3 j 00:00:00".replace("13 mois 1 sem. 3 j", "13 mois 1 sem. 3 j"), "plus d'un an : les mois continuent de compter");
assert.equal(dureeLongue(-5), "00:00:00", "jamais négatif");
// Câblage : le compteur est dans le bandeau du défi en cours, lit startedAt du serveur, et avance chaque seconde.
assert.ok(src.includes("cadre('dfi-temps-ecoule','⏱️','Temps écoulé',compteurDefi(etat.startedAt))"));
assert.ok(src.includes("data-dfi-temps=") && src.includes("querySelectorAll('[data-dfi-temps]')") && src.includes("},1000);"), "il se met à jour chaque seconde");
assert.ok(src.includes("typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now()"), "à l'heure du serveur");
assert.ok(src.includes("Le compteur démarre au prochain lancement d’un défi."), "défi sans heure de lancement (ancienne sauvegarde) : pas de plantage ni de faux chiffre");
console.log("idle-defis-compteur-v1: OK");
