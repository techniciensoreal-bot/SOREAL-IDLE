import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-18) : « corrige la cadence de synchro locale ». Profilage (CPU ralenti) : sur un appareil lent, le traitement de chaque réponse du moteur (copie + redessin) durait 250-340 ms
 * et la cadence ne tenait compte que du calcul du moteur : le fil principal n'avait aucun répit entre deux synchros.
 * Garde : le coût de rendu (réception -> message de canal suivant, donc après toutes les microtâches de la réponse) est mesuré pour chaque synchro, lissé, et entre dans la cadence (3 fois son coût) ;
 * le minimum de 150 ms et le plafond du délai d'origine restent (appareil rapide : rien ne change).
 */
const src = readFileSync(new URL("../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
assert.ok(src.includes("let emaRenduMs=0;") && src.includes("new MessageChannel()"), "mesure du coût de rendu par canal de message");
assert.ok(src.includes('if(m.ok&&a.op==="synchroniserSorealIdle")mesurerRendu(performance.now());'), "mesurée après chaque réponse de synchro, une fois la réponse remise");
assert.ok(src.includes("Math.min(ms,Math.max(150,Math.round(ms/10),Math.round(emaSyncMs*4),Math.round(emaRenduMs*3)))"), "cadence = max(150, ms/10, 4 x calcul, 3 x rendu), jamais au-delà du délai d'origine");
assert.ok(src.includes("syncMs:Math.round(emaSyncMs),renduMs:Math.round(emaRenduMs)"), "visible dans le diagnostic");
console.log("idle-moteur-local-cadence-rendu-v1: OK");
