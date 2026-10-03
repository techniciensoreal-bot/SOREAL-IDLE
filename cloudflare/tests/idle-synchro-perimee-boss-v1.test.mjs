import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « j'ai tué un boss et il a de nouveau été affiché. Retour arrière d'un boss. »
 * Une réponse de synchro calculée avant la victoire, arrivée après celle qui l'a confirmée, remettait l'ancien boss : elle doit être ignorée
 * (moins de boss vaincus que l'état local, même nombre de Renaissances ; une Renaissance, elle, remet bien le compteur à zéro).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const garde = "idleEntier_(joueurServeur.bossVaincus)<idleEntier_(idleEtat.bossVaincus)&&idleEntier_(joueurServeur.renaissance&&joueurServeur.renaissance.renaissances)===idleEntier_(idleEtat.renaissance&&idleEtat.renaissance.renaissances)";
assert.ok(ui.includes(garde), "garde contre une réponse périmée");
const iFonction = ui.indexOf("function appliquerSynchroCombatSansReflowIdleV116_(");
const iGarde = ui.indexOf(garde);
const iPrevision = ui.indexOf("idlePrevisionBossV1={actif:false,vaincus:0,debut:0};", iFonction);
assert.ok(iFonction < iPrevision && iPrevision < iGarde, "après l'abandon de la prévision (15 s) : le serveur doit rester l'autorité dans ce cas");
assert.ok(iGarde - iFonction < 3000, "dans la fonction d'application des synchros");
console.log("idle-synchro-perimee-boss-v1 OK");
