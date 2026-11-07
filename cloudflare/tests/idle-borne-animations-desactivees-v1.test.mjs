import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « retire les animations de la borne : le clown, la tronçonneuse et Twin Peaks. Ne supprime pas, désactive totalement du jeu ; je les réintégrerai plus tard. »
 * État voulu : seule la mascotte (le bonhomme qui court) est tirée pour un combat ; l'égout (clown), le héros à la tronçonneuse (sweep) et la Red Room (Twin Peaks) ne sont plus jamais choisis, ni la scène des
 * hommes qui rient (abandon d'un défi) ; leur CODE reste intact (tests idle-borne-egout, -redroom-*, etc. : ils les réactivent par ANIMS_ACTIVES_V1 pour garder le code vivant). Réintégrer : mettre le drapeau à 1.
 */
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(/var ANIMS_ACTIVES_V1=\{mascot:1,sweep:0,redroom:0,egout:0,rire:0\}/.test(led), "seule la mascotte est active");
assert.ok(/ANIMS_TIRAGE_V1=\['mascot','sweep','redroom','egout'\]\.filter\(function\(k\)\{return ANIMS_ACTIVES_V1\[k\];\}\)/.test(led), "le tirage ne garde que les animations actives");
assert.ok(/addEventListener\('soreal-defi-abandonne',function\(\)\{if\(!ANIMS_ACTIVES_V1\.rire\)return;/.test(led), "plus de scène « rire » à l'abandon d'un défi");
/* le code des scènes est toujours là */
for (const marque of ["function sSweep(", "function sRedroom(", "function sEgout(", "function sRire(", "function perduEgout(", "function perduRedroom("]) assert.ok(led.includes(marque), "code conservé : " + marque);
console.log("idle-borne-animations-desactivees-v1: OK");
