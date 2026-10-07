import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « fais un audit réactivité de l'interface, justesse des chrono en temps réel » puis « corrige du plus grave au moins grave ».
 * Garde-fous des correctifs : heure du serveur, minuteurs Money Pit / Daily Spin / Auto Merge, resynchronisation au retour d'onglet, synchro affamée, reprise réseau.
 */
const lire = (p) => readFileSync(p, "utf8");
const ui = lire("cloudflare/public/soreal-idle-ui.js");
const meta = lire("cloudflare/public/modules/blood-magic-v1.js") + "\n" + lire("cloudflare/public/modules/meta-progression-v130.js");
const bridge = lire("cloudflare/public/standalone-bridge.js");
const worker = lire("cloudflare/src/idle-worker-entry-v1.js");
const auto = lire("cloudflare/public/modules/inventory-auto-v1.js");
const titans = lire("cloudflare/public/modules/titans-v1.js");
const temps = lire("cloudflare/public/modules/time-format-v1.js");

// 1. Heure du serveur : en-tête côté Worker, écart calculé par le pont, utilisé partout où une échéance serveur est comparée.
assert.ok(worker.includes('entetes.set("x-soreal-now", String(Date.now()))'));
assert.ok(bridge.includes('response.headers.get("x-soreal-now")') && bridge.includes("window.__SOREAL_IDLE_HEURE_V1__=function"));
assert.ok(ui.includes("function heureServeurIdleV1_()"));
for (const [nom, src] of [["ui nextAt", ui], ["titans", titans], ["time-format", temps], ["meta", meta]]) {
  assert.ok(src.includes("__SOREAL_IDLE_HEURE_V1__") || src.includes("heureServeurIdleV1_"), nom + " : heure du serveur");
}
assert.ok(!/restantMs=nextAt-Date\.now\(\)/.test(meta) && !/restantMs=readyAt-Date\.now\(\)/.test(meta), "Money Pit / Daily Spin ne comparent plus à l'horloge du téléphone");
assert.ok(!ui.includes("Date.now()>=Number(pitData.nextAt||0)") && !ui.includes("Date.now()>=Number(roueData.readyAt||0)"));

// 2. Money Pit / Daily Spin : le texte avance et le bouton se réactive à l'échéance.
assert.ok(meta.includes('data-idle-recharge-v1="pit" data-fin="') && meta.includes('data-idle-recharge-v1="spin" data-fin="'));
assert.ok(meta.includes("function demarrerMinuteurRechargeIdleV1_()") && meta.includes("rafraichirMenuRacineIdleV28_()"), "redessin à l'échéance");

// 3. Retour d'onglet : synchro immédiate.
assert.ok(ui.includes("document.addEventListener('visibilitychange',auRetourV1)") && ui.includes("synchroniserJeuIdleV7_(true);"));

// 4. Synchro affamée : forcée après 90 s sans réponse réussie.
assert.ok(ui.includes("const IDLE_SYNCHRO_AFFAMEE_MS_V1=90000;") && ui.includes("if(!force&&Date.now()-idleDerniereSynchroReussieV1>IDLE_SYNCHRO_AFFAMEE_MS_V1)force=true;"));
assert.ok(ui.includes("if(res&&res.ok)idleDerniereSynchroReussieV1=Date.now();"));

// 5. Pont : lectures avec délai court et une reprise, jamais pour une action de jeu.
assert.ok(bridge.includes("const OPERATIONS_LECTURE_V1={obtenirEtatSorealIdle:1,synchroniserSorealIdle:1,battementSorealIdle:1};"));
assert.ok(bridge.includes("jsonFetchV1(url,options,15000)"));
assert.ok(!/OPERATIONS_LECTURE_V1=\{[^}]*(Achat|acheter|renaitre|combattre)/i.test(bridge), "aucune action de jeu rejouée");

// 6. Pas de retour en arrière au redessin (Blood Magic, Augmentations, Time Machine) et repère de réception.
assert.ok(bridge.includes("data.joueur.__recuPerfV1=calerRecuPerfV1_(data.joueur,performance.now(),Date.now())") && bridge.includes("return perfMaintenant;"), "repère de réception : instant de calcul du serveur, repli sur la réception (2026-10-07)");
assert.ok(meta.includes("(ex&&ex.src===rv)?ex:") && meta.includes("garderVisuelAug"));
assert.ok(ui.includes("__ancreTmV1"));

// 7. Auto Merge / Auto Boost : « prochain dans » avance.
assert.ok(auto.includes('data-idle-auto-v1="1"') && auto.includes("function minuteurAuto()"));

console.log("idle-chronos-reactivite-v1 OK");
