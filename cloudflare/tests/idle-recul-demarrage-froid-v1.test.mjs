import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Reculs de barres au démarrage à froid (Norman, 2026-11-11 : audit des menus qui coûtent de l'Or). Trois causes corrigées :
 *  1. l'âge d'un état du moteur local se calcule avec l'écart d'horloge de l'APPEL (posé par le Worker), jamais avec un écart remesuré entre l'envoi et la réponse ;
 *  2. l'horloge du moteur ne recule pas de plus de 2 s d'un instant à l'autre (écart remesuré plus court) : sinon la synchro suivante accorde moins de temps que l'écran n'en a projeté ;
 *  4. la copie de l'appareil (IndexedDB) est comparée à la date de dernière PROGRESSION reçue (progressionAt), pas à la colonne 16 que l'export réécrit à « maintenant » : sinon elle perdait toujours et les dernières secondes de progression disparaissaient à chaque rechargement ;
 *  3. un Or absent de l'état n'est pas un Or de 0 (Machine temporelle : barre figée pleine puis chute).
 */
const worker = fs.readFileSync("cloudflare/local/moteur-local-worker.js", "utf8");
const pont = fs.readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
const tm = fs.readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8");

assert.ok(/res\.joueur\.__ecartAppelV1 = Number\(m\.ecart\)/.test(worker), "le Worker date l'état avec l'écart de l'appel");
assert.ok(/joueur\.__ecartAppelV1/.test(pont) && /Number\.isFinite\(ecartAppel\)\?ecartAppel:/.test(pont), "le pont retranche l'âge avec l'écart de l'appel s'il existe");
assert.ok(/if\(age<0&&age>-500\)age=0;/.test(pont), "une petite imprécision donne un âge nul, jamais un retour à la valeur de réception");

/* l'horloge du moteur : exécutée pour de vrai (mêmes lignes que le Worker) */
const m = worker.match(/let dernierInstantMs = 0;\nfunction instantMoteur\(\) \{[\s\S]*?\n\}\n/);
assert.ok(m, "horloge monotone du moteur présente");
let ecartMs = 0, reel = 1000000;
const DateReelle = { now: () => reel };
const instant = new Function("DateReelle", "getEcart", m[0].replace(/ecartMs/g, "getEcart()") + "\nreturn instantMoteur;")(DateReelle, () => ecartMs);
assert.equal(instant(), 1000000);
reel += 100; ecartMs = 0; assert.equal(instant(), 1000100, "le temps avance");
ecartMs = -400; assert.equal(instant(), 1000100, "un écart qui baisse de 400 ms ne fait pas reculer l'horloge");
reel += 600; assert.equal(instant(), reel + ecartMs, "elle repart dès que le temps réel a rattrapé (1000700 - 400 = 1000300 > 1000100 : le temps passe de nouveau)");
ecartMs = -60000; reel += 10; assert.equal(instant(), reel + ecartMs, "une vraie correction (plus de 2 s) passe telle quelle");

assert.ok(/orConnuTm=!!\(monnaiesTm&&monnaiesTm\.gold!==undefined&&monnaiesTm\.gold!==null\)/.test(tm) && /or:orConnuTm\?orTm0:null/.test(tm) && /if\(orConnuTm&&proj\.deja!==deja0\)/.test(tm), "Or inconnu : pas de contrôle d'Or (et jamais d'Or remis à 0)");
const ml = fs.readFileSync("cloudflare/public/modules/moteur-local-v1.js", "utf8");
assert.ok(ml.includes("const refServeurMs=Number(exp&&exp.progressionAt)>0?Number(exp.progressionAt):enMs(srv[15]);") && ml.includes("enMs(rec.cells[15])>refServeurMs"), "reprise de la copie locale : comparée à la dernière progression reçue");
console.log("idle-recul-demarrage-froid-v1: OK");
