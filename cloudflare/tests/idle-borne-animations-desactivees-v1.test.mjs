import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « retire les animations de la borne : le clown, la tronçonneuse et Twin Peaks. Ne supprime pas, désactive totalement du jeu ; je les réintégrerai plus tard » puis « retire aussi le bonhomme qui court »
 * et « quand on lance un combat, les yeux doivent apparaître et regarder la barre de vie… ».
 * État voulu : seule la scène des YEUX DU COMBAT (yeuxcb) est tirée pour un combat ; l'égout (clown), le héros à la tronçonneuse (sweep), la Red Room (Twin Peaks), la mascotte (le bonhomme qui court) et la scène des hommes
 * qui rient (abandon d'un défi) ne sont plus jamais choisies ; leur CODE reste intact (les tests idle-borne-egout, -redroom-*, etc. les réactivent par ANIMS_ACTIVES_V1 pour garder le code vivant). Réintégrer : mettre le drapeau à 1.
 */
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(led.includes("var ANIMS_ACTIVES_V1={mascot:0,sweep:0,redroom:0,egout:0,rire:0,yeuxcb:1}"), "seuls les yeux du combat sont actifs");
assert.ok(led.includes("ANIMS_TIRAGE_V1=['mascot','sweep','redroom','egout','yeuxcb'].filter(function(k){return ANIMS_ACTIVES_V1[k];});"), "le tirage ne garde que les animations actives");
assert.ok(led.includes("addEventListener('soreal-defi-abandonne',function(){if(!ANIMS_ACTIVES_V1.rire)return;"), "plus de scène « rire » à l'abandon d'un défi");
/* le code des scènes est toujours là */
for (const marque of ["function sMascot(", "function sSweep(", "function sRedroom(", "function sEgout(", "function sRire(", "function perduEgout(", "function perduRedroom("]) assert.ok(led.includes(marque), "code conservé : " + marque);
console.log("idle-borne-animations-desactivees-v1: OK");
