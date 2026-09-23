import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * 2026-09-23 : "le mode aventure peine parfois à lancer les combats, il reste
 * figé". Deux causes confirmées en lisant le code de bout en bout :
 *
 * 1. Depuis le split UI V9 (commit 85094df), idleMetaBusyV130 existait en
 *    DEUX variables indépendantes : celle du module (la vraie, assignée à
 *    chaque requête) et une copie du monolithe jamais assignée, donc
 *    toujours false. Le monolithe ne voyait jamais qu'une requête méta
 *    était partie : envoyerResolutionAdventurePendingV2_ n'acquittait jamais
 *    la résolution du combat (idleAdventureResolutionPendingV2 restait
 *    armé), et le minuteur de respawn se ré-armait toutes les 16 ms sans
 *    jamais lancer startZoneFight.
 * 2. Un startZoneFight qui échoue (verrou serveur SOREAL_IDLE_OCCUPE,
 *    timeout, refus, appel abandonné car le module était occupé) laissait
 *    idleAdventureRespawnStartPendingV165 à true pour toujours : plus aucun
 *    respawn n'était reprogrammé.
 */

const MODULE_PATH = "cloudflare/public/modules/meta-progression-v130.js";
const MONOLITH_PATH = "cloudflare/public/soreal-idle-ui.js";
const monolith = readFileSync(MONOLITH_PATH, "utf8");

// --- Cause 1 : une seule source de vérité pour le drapeau "occupé" ---
assert.ok(
  !/\blet\s+idleMetaBusyV130\b/.test(monolith),
  "Le monolithe ne doit plus déclarer sa propre copie (morte) de idleMetaBusyV130."
);
assert.ok(
  !/\bidleMetaBusyV130\b/.test(monolith),
  "Le monolithe ne doit plus référencer idleMetaBusyV130 : il doit interroger le module via metaOccupeIdleV130_()."
);
assert.match(
  monolith,
  /function metaOccupeIdleV130_\(\)\{[\s\S]*?estOccupeIdleV130_/,
  "metaOccupeIdleV130_ doit lire le drapeau du module."
);

// --- Bac à sable du module ---
function creerModule() {
  const appels = [];
  const demarragesLiberes = [];
  const host = {
    getIdleEtat() { return null; },
    setIdleEtat() {},
    setIdleAdventureRespawnStartPending(v) { demarragesLiberes.push(v); },
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    formatterHeuresIdleV47_: () => "0,00 h",
    entetePageIdleV28_: () => "",
    toastIdleV5_: () => {},
    messageFlottantIdleV32_: () => {},
    rendreIdleEtat_: () => {},
    pousserEtatVersRuntimePartageIdleV1_: () => {},
    appliquerSynchroCombatSansReflowIdleV116_: () => false,
    ajouterLogAventureIdleV1_: () => {},
    aventureMetaIdleV47_: () => null,
    protegerJoueurServeurInventaireIdleV208_: (j) => j,
    estMutationInventaireAdventureIdleV160_: () => false,
    patchInventaireAdventureIdleV160_: () => {},
    appelerProgressionIdleCloudflareV1_: (payload, succes, echec) => { appels.push({ payload, succes, echec }); },
    patchZoneAdventureSansReflowIdleV1_: () => {},
    idleRareteClasseObjetAdventureIdleV1_: () => ""
  };
  const window = {
    __SOREAL_IDLE_META_HOST_V130__: host,
    __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
    __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
    document: { getElementById() { return null; } }
  };
  const etat = { session: "session-test" };
  vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), {
    window,
    document: window.document,
    get SOREAL_SESSION() { return etat.session; },
    set SOREAL_SESSION(v) { etat.session = v; }
  });
  return { api: window.__SOREAL_IDLE_META_V130__, appels, demarragesLiberes, etat };
}

const DEMARRER = { action: "adventure", adventure: { action: "startZoneFight" } };
const RESOUDRE = { action: "adventure", adventure: { action: "resolveZoneFight" } };

// Le drapeau du module reflète réellement une requête en vol
{
  const { api, appels } = creerModule();
  assert.equal(api.estOccupeIdleV130_(), false);
  api.actionMetaIdleV130_(RESOUDRE);
  assert.equal(api.estOccupeIdleV130_(), true, "occupé tant que la requête est en vol");
  appels[0].succes({ ok: false, message: "x" });
  assert.equal(api.estOccupeIdleV130_(), false, "libéré à la réponse");
}

// --- Cause 2 : chaque échec de startZoneFight libère le drapeau de démarrage ---
{ // réponse refusée par le serveur
  const { api, appels, demarragesLiberes } = creerModule();
  api.actionMetaIdleV130_(DEMARRER);
  assert.deepEqual(demarragesLiberes, []);
  appels[0].succes({ ok: false, code: "SOREAL_IDLE_OCCUPE", message: "occupé" });
  assert.deepEqual(demarragesLiberes, [false], "refus serveur => le démarrage doit pouvoir être retenté");
}
{ // erreur réseau / timeout
  const { api, appels, demarragesLiberes } = creerModule();
  api.actionMetaIdleV130_(DEMARRER);
  appels[0].echec(new Error("timeout"));
  assert.deepEqual(demarragesLiberes, [false], "erreur réseau => le démarrage doit pouvoir être retenté");
}
{ // appel abandonné car le module est déjà occupé
  const { api, demarragesLiberes } = creerModule();
  api.actionMetaIdleV130_(RESOUDRE);
  api.actionMetaIdleV130_(DEMARRER);
  assert.deepEqual(demarragesLiberes, [false], "appel abandonné (module occupé) => libérer aussi le drapeau");
}
{ // pas de session
  const { api, demarragesLiberes, etat } = creerModule();
  etat.session = "";
  api.actionMetaIdleV130_(DEMARRER);
  assert.deepEqual(demarragesLiberes, [false]);
}
{ // une autre action qui échoue ne touche pas au drapeau de démarrage
  const { api, appels, demarragesLiberes } = creerModule();
  api.actionMetaIdleV130_(RESOUDRE);
  appels[0].echec(new Error("x"));
  assert.deepEqual(demarragesLiberes, []);
}

console.log("idle-adventure-combat-start-never-freezes: OK");
