import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const MODULE_PATH = "cloudflare/public/modules/meta-progression-v130.js";
const MONOLITH_PATH = "cloudflare/public/soreal-idle-ui.js";

// --- module loads standalone and exposes exactly the API the monolith wrappers rely on ---
const hostCalls = [];
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    setIdleEtat() {},
    setIdleAdventureRespawnStartPending() {},
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    formatterHeuresIdleV47_: () => "0,00 h",
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
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
    appelerProgressionIdleCloudflareV1_: (payload) => { hostCalls.push(payload); },
    patchZoneAdventureSansReflowIdleV1_: () => {},
    idleRareteClasseObjetAdventureIdleV1_: () => ""
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
/*
 * Contrairement à un vrai navigateur, vm.runInNewContext ne fait pas de
 * `window === globalThis` : SOREAL_SESSION doit donc être fourni comme
 * variable globale du bac à sable, pas seulement sous window.
 */
let SOREAL_SESSION = null;
vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), {
  window,
  document: window.document,
  get SOREAL_SESSION() { return SOREAL_SESSION; },
  set SOREAL_SESSION(v) { SOREAL_SESSION = v; }
});

const api = window.__SOREAL_IDLE_META_V130__;
assert.ok(api, "le module doit exposer window.__SOREAL_IDLE_META_V130__");
assert.deepEqual(
  Object.keys(api).sort(),
  ["actionMetaIdleV130_", "boutiqueCssIdleV1_", "estOccupeIdleV130_", "pageSpendExpIdleV1_", "pageSystemeMetaIdleV130_", "systemeMetaParIdIdleV130_"].sort(),
  "le module ne doit exposer que les 6 fonctions réellement appelées par le monolithe (dont le style de boutique partagé avec la Boutique AP)"
);
for (const key of Object.keys(api)) {
  assert.equal(typeof api[key], "function", key + " doit être une fonction");
}

// --- systemeMetaParIdIdleV130_ : logique pure, aucun accès au pont hôte ---
const joueur = { systemes: { systems: [{ id: "moneyPit", name: "Money Pit" }] } };
assert.equal(api.systemeMetaParIdIdleV130_(joueur, "moneyPit").name, "Money Pit");
assert.equal(api.systemeMetaParIdIdleV130_(joueur, "inconnu"), null);

// --- pageSystemeMetaIdleV130_('moneyPit', ...) exerce un vrai chemin de rendu ---
const html = api.pageSystemeMetaIdleV130_(joueur, "moneyPit", "");
assert.match(html, /Money Pit/);
assert.match(html, /Roue journalière/);

// --- actionMetaIdleV130_ relaie bien vers le pont (RPC serveur) ---
hostCalls.length = 0;
window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat = () => null; // pas de session -> pas d'appel
api.actionMetaIdleV130_({ action: "toggle" });
assert.equal(hostCalls.length, 0, "sans SOREAL_SESSION, aucun appel serveur ne doit partir");

// --- contrat monolithe : le bloc a bien été remplacé par le pont + 4 wrappers fins ---
const monolithe = readFileSync(MONOLITH_PATH, "utf8");
assert.match(
  monolithe,
  /window\.__SOREAL_IDLE_META_HOST_V130__=\{/,
  "le monolithe doit exposer le pont de dépendances vers le module Système Méta"
);
for (const fn of ["pageSystemeMetaIdleV130_", "actionMetaIdleV130_", "systemeMetaParIdIdleV130_", "pageSpendExpIdleV1_"]) {
  const re = new RegExp(
    "function " + fn + "\\([^)]*\\)\\{[\\s\\S]{0,220}?window\\.__SOREAL_IDLE_META_V130__"
  );
  assert.match(monolithe, re, fn + " doit rester un wrapper fin qui délègue au module extrait");
}
assert.doesNotMatch(
  monolithe,
  /IDLE_SPEND_EXP_STATS_V1/,
  "la définition de la Boutique EXP ne doit plus être dupliquée dans le monolithe"
);

// --- le script du nouveau module doit être chargé avant le monolithe ---
const indexHtml = readFileSync("cloudflare/public/index.html", "utf8");
assert.match(indexHtml, /<script src="\/modules\/meta-progression-v130\.js\?v=\d+"><\/script>/);
const posModule = indexHtml.indexOf("/modules/meta-progression-v130.js");
const posMonolithe = indexHtml.indexOf("/soreal-idle-ui.js");
assert.ok(posModule > -1 && posMonolithe > -1 && posModule < posMonolithe);

console.log("idle meta-progression module (UI split V9): OK");
