import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-03) : « l'animation de victoire est encore coupée par le nom du boss. Mais juste 1 seconde ensuite on voit la fin de l'animation. »
 * Le drapeau de victoire n'est lu qu'environ 1 s après la fin du combat : quitter l'animation longue (mascotte, Leatherface, Red Room) dès la fin du combat laissait passer la scène de base,
 * puis le nom du boss suivant, puis la scène de fin. L'animation longue reste à l'écran jusqu'à l'arrivée de la scène de fin (GRACE_FIN_S).
 */
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(led.includes("else if(!S.combat&&enCombat(cur)){") && led.includes("if(cur.p&&cur.p.long&&ANIMS_LONGUES[cur.id]){if(!graceFin)graceFin=now+GRACE_FIN_S*1000;if(now>=graceFin){graceFin=0;demarrer(suivante(now));}}"), "fin du combat : l'animation longue est gardée jusqu'à la scène de fin (au plus GRACE_FIN_S)");
assert.ok(!/else if\(!S\.combat&&enCombat\(cur\)\)demarrer\(suivante\(now\)\);/.test(led), "plus de passage immédiat à la scène de base à la fin du combat");
assert.ok(led.includes("pend=false;graceFin=0;demarrer(s);"), "la scène de victoire ou de défaite remet l'attente à zéro");
assert.ok(/GRACE_FIN_S=2\.5/.test(led), "attente bornée à 2,5 s");
console.log("idle-borne-victoire-jusqu-au-bout-v1 : OK");
