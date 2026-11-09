/*
 * T5 : chaque opération du contrat (cloudflare/contracts/idle-protocol.json) est classée EXACTEMENT une fois :
 *  - LOCALES (moteur-local-v1.js) : exécutée par le moteur local de la page ;
 *  - MODIFIENT_LE_JOUEUR (moteur-local-v1.js) : reste au serveur mais modifie la ligne du joueur ;
 *  - SERVEUR (liste ci-dessous) : données partagées (chat, classements, profils, bugs, textes), administration, accès.
 * Une nouvelle opération doit être rangée dans l'une des trois (règle n°7 d'AGENTS.md : ne jamais classer une action de jeu comme « serveur »).
 */
import assert from "node:assert/strict";
import fs from "node:fs";

const contrat = JSON.parse(fs.readFileSync(new URL("../contracts/idle-protocol.json", import.meta.url), "utf8")).operations;
const mod = fs.readFileSync(new URL("../public/modules/moteur-local-v1.js", import.meta.url), "utf8");

function lireTable(nom) {
  const debut = mod.indexOf(`const ${nom}={`);
  assert.ok(debut >= 0, `${nom} introuvable dans moteur-local-v1.js`);
  const fin = mod.indexOf("};", debut);
  return [...mod.slice(debut, fin).matchAll(/(\w+):1/g)].map((m) => m[1]);
}
const LOCALES = lireTable("LOCALES");
const MODIFIENT = lireTable("MODIFIENT_LE_JOUEUR");

const SERVEUR = [
  "battementSorealIdle", "definirAccesOuvertSorealIdle", "definirAccesPublicSorealIdle", "enregistrerHistoireAdminSorealIdle", "enregistrerTexteAdminSorealIdle",
  "enregistrerTutorielAdminSorealIdle", "envoyerChatSorealIdle", "estAdminSorealIdle", "lireBugsSorealIdle", "lireChatSorealIdle", "lireFluxSorealIdle",
  "lireGainsExpAdminSorealIdle", "listerHistoiresAdminSorealIdle", "listerJoueursExternesSorealIdle", "listerTextesAdminSorealIdle", "listerTutorielAdminSorealIdle",
  "obtenirAccesSorealIdle", "obtenirClassementSorealIdle", "obtenirHistoireBossSorealIdle", "obtenirIdentiteSorealIdle", "obtenirIntroSorealIdle", "obtenirMesRangsSorealIdle",
  "obtenirPartieDevSorealIdle", "obtenirTextesSurchargesSorealIdle", "obtenirTutorielSorealIdle", "reglerAncienTutorielAdminSorealIdle", "signalerBugSorealIdle",
  "supprimerBugSorealIdle", "supprimerHistoireAdminSorealIdle", "supprimerMessageChatSorealIdle", "supprimerTexteAdminSorealIdle", "definirValidationVoixAdminSorealIdle",
  "definirChroniqueDefinitiveAdminSorealIdle", "marquerChroniqueEntiereAdminSorealIdle", "supprimerTutorielAdminSorealIdle", "testerAccesSorealIdle"
];

const tout = [...LOCALES, ...MODIFIENT, ...SERVEUR];
const doublons = tout.filter((o, i) => tout.indexOf(o) !== i);
assert.deepEqual(doublons, [], `Opération classée dans plusieurs catégories : ${doublons.join(", ")}`);
const nonClassees = contrat.filter((o) => !tout.includes(o));
assert.deepEqual(nonClassees, [], `Opération du contrat non classée (LOCALES / MODIFIENT_LE_JOUEUR / SERVEUR) : ${nonClassees.join(", ")}`);
const inconnues = tout.filter((o) => !contrat.includes(o));
assert.deepEqual(inconnues, [], `Opération classée mais absente du contrat : ${inconnues.join(", ")}`);
assert.equal(tout.length, contrat.length);

/* Les actions locales qui écrivent la ligne du joueur sont revendiquées par un appareil resté en mode serveur. */
const sync = fs.readFileSync(new URL("../src/idle-local-sync-v1.js", import.meta.url), "utf8");
for (const o of ["marquerVusSorealIdle", "definirOrdreMenusSorealIdle", "enregistrerClicsSorealIdle"]) assert.ok(sync.includes(`"${o}"`), `${o} absente de OPERATIONS_DE_JEU_V1`);
console.log("idle-operations-classees-v1 OK", contrat.length, "opérations");
