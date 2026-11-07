import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « l'animation dans Blood Magic ralentit parfois quand le rituel est au-dessus de 1 niveau par seconde ; on dirait qu'elle attend ; je veux qu'elle reste en continu ». Cause (mesurée dans le navigateur) : la vue du
 * rituel (__bloodMagicVisualV1) disparaît ~120 ms à chaque synchro ; le mode « boucle » de la scène repassait à « repos » (animation retirée puis relancée) à CHAQUE synchro. Correctif : tant que le rituel progresse encore, la boucle garde
 * la dernière durée connue (4 s au plus) ; retirer la Magie (le tuyau ne saigne plus) l'arrête toujours tout de suite.
 */
const s = fs.readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
assert.ok(/var secVue=\{\},secVueLe=\{\};/.test(s) && /if\(sec>0\)\{secVue\[id\]=sec;secVueLe\[id\]=performance\.now\(\);\}/.test(s), "dernière durée connue et son instant mémorisés");
assert.ok(/var secB=sec>0\?sec:\(\(progresse&&pret&&secVue\[id\]>0&&performance\.now\(\)-\(secVueLe\[id\]\|\|0\)<4000\)\?secVue\[id\]:0\);/.test(s), "durée de repli : seulement tant que le rituel progresse, 4 s au plus");
assert.ok(/if\(secB>0&&secB<=PERIODE_BOUCLE&&progresse&&pret&&!attenteOr\)\{\s*mode='boucle';\s*var t=Math\.max\(PERIODE_MIN,secB\),/.test(s), "le mode boucle se décide sur la durée de repli");
/* retirer la Magie arrête la boucle tout de suite : « progresse » est exigé */
assert.ok(/progresse&&pret&&!attenteOr\)\{\s*mode='boucle'/.test(s), "plus de Magie : plus de boucle");
console.log("idle-sang-animation-continue-v1: OK");
