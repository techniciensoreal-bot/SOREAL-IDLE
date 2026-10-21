import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-21) : le pied de la sangsue décollé de la table (le redessin de la page réécrit le style de la scène : --sg-* perdues, clé de mesure inchangée) ; le personnage apparaît au lieu de glisser (image pas chargée / en échec). */
const s = readFileSync(new URL("../public/modules/sang-rituel-decor-v1.js", import.meta.url), "utf8");
assert.match(s, /__traceCle===cle&&[^;]*getPropertyValue\('--sg-socle-h'\)[^;]*getPropertyValue\('--sg-ox'\)\)return;/, "la mesure est reposée si les variables ont disparu");
assert.match(s, /APRES_REDESSIN_V1__\|\|\[\]\)\.push\(function\(\)\{var l=document\.querySelectorAll\('\.bm-scene\[data-source="sucon"\]'\)[^]*?sangTrace\(/, "les variables sont remises juste après un redessin");
assert.match(s, /horsVoulu=true;\}\s*\n\s*if\(sc\.classList\.contains\('bm-hors'\)!==horsVoulu\)/, "le personnage n'entre qu'une fois son image chargée");
assert.match(s, /__bmEssais[^]*?bm-perso|bm-perso[^]*?__bmEssais/, "image du personnage en échec redemandée");
console.log("idle-sang-pied-perso-v1: OK");
