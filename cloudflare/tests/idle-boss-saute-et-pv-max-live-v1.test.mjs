import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « J'ai tué le boss 45 et je suis passé au 47 (au refresh : bien le 46) » et « quand je prends des niveaux dans Augmentations, ma barre de vie ne se met pas à jour
 * tant que je n'ai pas fait Fight ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// Boss sauté : le « boss suivant » prédit n'est appliqué que si l'état est encore celui de la victoire et que ce boss est le suivant immédiat.
assert.ok(ui.includes("const vaincusALaVictoireV1=idleEntier_(idleEtat.bossVaincus);"));
assert.ok(ui.includes("idleEntier_(n.bossVaincus)!==idleEntier_(vaincusAvant)+1"), "boss suivant = vaincus + 1 exactement");
assert.ok(ui.includes("idleEntier_(idleEtat.bossVaincus)>idleEntier_(vaincusAvant)"), "serveur déjà à jour : rien à prédire");

// PV max en direct : calculé avec la même formule que le combat, au moment de la réponse.
assert.ok(runtime.includes("const pvJoueurMaxEtatV1 ="));
assert.ok(runtime.includes("pvJoueurMax: pvJoueurMaxEtatV1,"));
assert.ok(runtime.includes("Math.max(1000, Math.round(Number(combatPrincipalEtat.pvMax)))"));
console.log("idle-boss-saute-et-pv-max-live-v1 OK");
