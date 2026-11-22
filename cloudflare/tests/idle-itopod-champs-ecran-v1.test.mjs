import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Champs que la scène et la page ITOPOD lisent (audit 2026-11-22) : le moteur doit les envoyer. */
const sys = readFileSync(new URL("../src/idle-ngu-systemes.js", import.meta.url), "utf8");
for (const champ of ["d.puissanceJoueur =", "d.defenseJoueur =", "d.regenBase =", "d.lifetimePp =", "d.shifterDe =", "d.ennemiPv =", "d.ennemiPoison =", "d.pvMax ="]) assert.ok(sys.includes(champ), "champ envoyé : " + champ);
assert.ok(/ppMultiplier = Math\.max\(1, num\(bonuses\.ppMultiplier, 1\)\)/.test(sys), "totalPPBonus : minimum 1 (ItopodPerkController::totalPPBonus)");
assert.ok(!/d\.ennemiCoup = Math\.floor/.test(sys), "coup de l'ennemi envoyé non tronqué : une seule troncature, côté scène");
const scene = readFileSync(new URL("../public/modules/itopod-scene-v1.js", import.meta.url), "utf8");
assert.ok(scene.includes("puissanceJoueur") && scene.includes("shifterDe"), "la scène lit ces champs");
const page = readFileSync(new URL("../public/modules/itopod-perks-page-v1.js", import.meta.url), "utf8");
assert.ok(page.includes("lifetimePp"), "la page affiche « PP gagnés au total »");
console.log("idle-itopod-champs-ecran-v1: OK");
