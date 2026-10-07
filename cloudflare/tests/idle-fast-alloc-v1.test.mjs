import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Chantier « réactivité » (Norman, 2026-09-30) : « l'interface n'est pas réactive : quand on retire ou remet l'énergie dans Augmentations,
 * ça met du temps. Tout doit être aussi rapide que Basic Training. » Le clic recalcule localement durée / barre / compte à rebours
 * (durée = K / allocation, K fourni par le serveur) et envoie en différé, une seule fois par cible.
 */
const ctx = { bosses: 100 };
const NOW = 1000;

function etat() {
  const s = normalizeIdleNguState({}, ctx, 0);
  for (const id of ["augmentations", "timeMachine", "bloodMagic"]) s.systems[id].unlocked = true;
  s.resources.energy.cap = 1000000;
  s.resources.energy.current = 1000000;
  s.resources.magic.cap = 1000000;
  s.resources.magic.current = 1000000;
  s.currencies.gold = 1e30;
  return s;
}
const agir = (s, p) => applyIdleNguAction(s, p, ctx, NOW).state;
const proche = (a, b, msg) => assert.ok(Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-9), msg + " (" + a + " vs " + b + ")");

// --- 1. K : la durée serveur à l'allocation A vaut exactement K / A (le client peut donc la recalculer seul) ---
{
  let s = etat();
  s = agir(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 200 });
  const a200 = idleNguSnapshot(s, ctx, 0).augmentations.find((d) => d.id === "scissors");
  assert.ok(a200.secondsK > 0);
  proche(a200.secondsPerLevel * 200, a200.secondsK, "K = durée x allocation (Augment)");
  s = agir(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 500 });
  const a500 = idleNguSnapshot(s, ctx, 0).augmentations.find((d) => d.id === "scissors");
  proche(a500.secondsK, a200.secondsK, "K ne dépend pas de l'allocation");
  proche(a500.secondsPerLevel, a200.secondsK / 500, "durée à 500 = K / 500");
  // Sans allocation : pas de durée, mais K reste fourni (pour le premier + du joueur).
  const a0 = idleNguSnapshot(etat(), ctx, 0).augmentations.find((d) => d.id === "scissors");
  assert.equal(a0.secondsPerLevel, null);
  assert.ok(a0.secondsK > 0 && a0.upgradeSecondsK > 0);
  // Progression : en secondes, elle ne change pas quand l'allocation change ; la fraction = secondes / nouvelle durée.
  s = etat();
  s = agir(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 100 });
  s.systems.augmentations.data.pairs.scissors.progress = 150;
  const avant = idleNguSnapshot(s, ctx, 0).augmentations.find((d) => d.id === "scissors");
  assert.equal(avant.progressSeconds, 150);
  s = agir(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 400 });
  const apres = idleNguSnapshot(s, ctx, 0).augmentations.find((d) => d.id === "scissors");
  assert.equal(apres.progressSeconds, 150, "progression en secondes inchangée");
  proche(apres.progressPct, Math.min(1, 150 / (avant.secondsK / 400)), "fraction recalculée = secondes / nouvelle durée");
}
{
  let s = etat();
  s = agir(s, { action: "allocate", system: "timeMachine", resource: "energy", value: 300 });
  s = agir(s, { action: "allocate", system: "timeMachine", resource: "magic", value: 700 });
  const v = idleNguSnapshot(s, ctx, 0).timeMachineView;
  proche(v.speedEtaSeconds + v.speedProgressSeconds, v.speedK / 300, "Time Machine vitesse : durée = K / Energy");
  proche(v.goldEtaSeconds + v.goldProgressSeconds, v.goldK / 700, "Time Machine or : durée = K / Magic");
  s = agir(s, { action: "allocate", system: "timeMachine", resource: "energy", value: 900 });
  const v2 = idleNguSnapshot(s, ctx, 0).timeMachineView;
  proche(v2.speedK, v.speedK, "K de la vitesse indépendant de l'allocation");
  proche(v2.speedEtaSeconds + v2.speedProgressSeconds, v.speedK / 900, "durée à 900 = K / 900");
}
{
  let s = etat();
  s = agir(s, { action: "allocate", system: "bloodMagic", resource: "magic", value: 250 });
  const b = idleNguSnapshot(s, ctx, 0).bloodMagicView;
  proche(b.secondsPerCompletion * 250, b.secondsK, "Blood Magic : durée = K / Magic");
  s = agir(s, { action: "allocate", system: "bloodMagic", resource: "magic", value: 1000 });
  proche(idleNguSnapshot(s, ctx, 0).bloodMagicView.secondsPerCompletion, b.secondsK / 1000, "durée à 1000 = K / 1000");
}

// --- 2. Module client : envoi groupé, ordre, recalcul local, recollage sans redessin ---
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const appels = [];
let rendus = 0;
let menusRedessines = 0;
let etatCourant = null;
const minuteries = [];
const elements = {};
const hote = {
  getIdleEtat: () => etatCourant,
  setIdleEtat: (v) => { etatCourant = v; },
  idleHtml_: (v) => String(v == null ? "" : v),
  idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
  idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
  formatGrandNombreIdleV70_: (v) => String(v),
  entetePageIdleV28_: (t) => t,
  appelerProgressionIdleCloudflareV1_: (payload, ok, ko) => { appels.push({ payload: JSON.parse(JSON.stringify(payload)), ok, ko }); },
  protegerJoueurServeurInventaireIdleV208_: (j) => j,
  rendreIdleEtat_: () => { rendus += 1; },
  rafraichirMenuRacineIdleV28_: () => { menusRedessines += 1; },
  rafraichirEnergieEtBoutonsIdleV9_() {},
  jouerEffetAudioIdleV199_() {},
  messageFlottantIdleV32_() {},
  toastIdleV5_() {}
};
const window_ = { __SOREAL_IDLE_META_HOST_V130__: hote, __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (x) => String(x) }, __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v) } };
const document_ = { getElementById: (id) => elements[id] || null, querySelector: () => null };
const sandbox = {
  window: window_, document: document_, SOREAL_SESSION: "jeton", performance,
  localStorage: { getItem: () => null, setItem() {} },
  setTimeout: (fn, ms) => { minuteries.push({ fn, ms, actif: true }); return minuteries.length; },
  clearTimeout: (id) => { if (minuteries[id - 1]) minuteries[id - 1].actif = false; }
};
vm.runInNewContext(meta, sandbox);
const passer = () => { let n = 0; while (minuteries.some((m) => m.actif) && n++ < 50) { const m = minuteries.find((x) => x.actif); m.actif = false; m.fn(); } };

// 2a. Une rafale de clics sur la même cible = UN seul envoi, avec la dernière valeur.
{
  const envoyer = window_.__envoyerAllocRapideIdleV1__;
  for (let v = 1; v <= 10; v++) envoyer({ action: "allocate", system: "timeMachine", resource: "energy", value: v * 10 });
  assert.equal(appels.length, 0, "rien n'est envoyé pendant la rafale (envoi différé)");
  passer();
  assert.equal(appels.length, 1, "un seul envoi pour la rafale");
  assert.equal(appels[0].payload.value, 100, "avec la dernière valeur voulue");
  appels[0].ok({ ok: true, joueur: { systemes: { systems: [] } } });
}

// 2b. Ordre : « Tout retirer » annule les allocations d'Augments en attente et reste dans l'ordre des actions.
{
  appels.length = 0;
  const envoyer = window_.__envoyerAllocRapideIdleV1__;
  envoyer({ action: "allocateAugment", pair: "scissors", upgrade: false, value: 50 });
  envoyer({ action: "allocateAugment", pair: "milk", upgrade: false, value: 70 });
  envoyer({ action: "clearAugmentAllocations" });
  envoyer({ action: "allocateAugment", pair: "scissors", upgrade: false, value: 9 });
  passer();
  const ordre = [];
  while (appels.length) {
    const a = appels.shift();
    ordre.push(a.payload.action + (a.payload.pair ? ":" + a.payload.pair + "=" + a.payload.value : ""));
    a.ok({ ok: true, joueur: { systemes: { systems: [] } } });
    passer();
  }
  assert.deepEqual(ordre, ["clearAugmentAllocations", "allocateAugment:scissors=9"], "les allocations d'avant « Tout retirer » sont annulées, celle d'après passe, dans l'ordre");
}

// 2c. Un envoi à la fois ; un échec réseau remet l'action et réessaie.
{
  appels.length = 0;
  const envoyer = window_.__envoyerAllocRapideIdleV1__;
  envoyer({ action: "allocate", system: "bloodMagic", resource: "magic", value: 5 });
  envoyer({ action: "allocate", system: "timeMachine", resource: "magic", value: 6 });
  passer();
  assert.equal(appels.length, 1, "un seul envoi en cours à la fois");
  appels[0].ko(new Error("réseau"));
  const relance = minuteries.find((m) => m.actif);
  assert.ok(relance && relance.ms >= 1000, "échec : nouvelle tentative différée");
  assert.equal(window_.__allocRapideEtatIdleV1__().enAttente, 2, "l'action en échec est remise dans la file");
  passer();
  /* On vide la file jusqu'au bout (chaque envoi est confirmé avant le suivant). */
  for (let garde = 0; garde < 10 && appels.length; garde++) {
    const a = appels.shift();
    a.ok({ ok: true, joueur: { systemes: { systems: [] } } });
    passer();
  }
  assert.equal(window_.__allocRapideEtatIdleV1__().enAttente, 0);
  assert.equal(window_.__allocRapideEtatIdleV1__().enCours, false, "file vidée, canal libre");
  appels.length = 0;
}

// 2d. Recalcul local à partir d'un vrai instantané serveur : le clic « + » met tout de suite à jour durée, barre, compte à rebours.
{
  let s = etat();
  s = agir(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 100 });
  s.systems.augmentations.data.pairs.scissors.progress = 100;
  const snap = idleNguSnapshot(s, ctx, 0);
  const j = { energie: 5000, energieMax: 100000, systemes: snap, joueur: {} };
  etatCourant = j;
  j.__augmentationsVisualV215 = {
    at: performance.now(),
    defs: Object.fromEntries(snap.augmentations.map((d) => [d.id, { progress: d.progressPct, upgradeProgress: d.upgradeProgressPct, seconds: d.secondsPerLevel || 0, upgradeSeconds: d.upgradeSecondsPerLevel || 0, waiting: false, upgradeWaiting: false, goldCost: d.goldCost, upgradeGoldCost: d.upgradeGoldCost, gold: 1e30 }]))
  };
  elements.sorealIdleAugInputV1 = { value: "300" };
  const fractionAvant = j.__augmentationsVisualV215.defs.scissors.progress;
  window_.__ajusterAugmentIdleV1__("scissors", false, "plus");
  const d = j.__augmentationsVisualV215.defs.scissors;
  const k = snap.augmentations.find((x) => x.id === "scissors").secondsK;
  const alloc = snap.systems.find((x) => x.id === "augmentations").state.data.pairs.scissors.energy;
  assert.equal(alloc, 400, "allocation locale : 100 + 300");
  proche(d.seconds, k / 400, "durée locale = K / 400, sans attendre le serveur");
  /* Norman (2026-10-05) : la barre garde sa FRACTION (elle ne rattrape pas son retard à la nouvelle vitesse). */
  assert.ok(Math.abs(d.progress - fractionAvant) < 1e-3, "barre locale : même fraction qu'avant le changement (" + fractionAvant + " -> " + d.progress + ")");
  assert.equal(j.energie, 4700, "énergie libre mise à jour tout de suite");
  passer();
  assert.equal(appels.length, 1, "l'allocation part au serveur, une seule fois");
  assert.deepEqual(appels[0].payload, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 400 });

  // Retirer : on revient vers 0 -> plus de durée (barre à l'arrêt), aussitôt.
  elements.sorealIdleAugInputV1 = { value: "1000" };
  window_.__ajusterAugmentIdleV1__("scissors", false, "moins");
  assert.equal(j.__augmentationsVisualV215.defs.scissors.seconds, 0, "sans allocation : plus de durée, la barre s'arrête");
  assert.equal(j.systemes.augmentations.find((x) => x.id === "scissors").secondsPerLevel, null);

  // 2e. Réponse serveur qui confirme l'écran : AUCUN redessin de la page ; divergence : rendu complet.
  passer();
  const derniere = appels[appels.length - 1];
  rendus = 0;
  const confirme = JSON.parse(JSON.stringify(j));
  derniere.ok({ ok: true, joueur: confirme });
  assert.equal(rendus, 0, "réponse conforme : pas de rendu complet de la page");
  const diverge = JSON.parse(JSON.stringify(j));
  diverge.systemes.systems.find((x) => x.id === "augmentations").state.data.pairs.scissors.energy = 42;
  appels.length = 0;
  window_.__envoyerAllocRapideIdleV1__({ action: "allocateAugment", pair: "scissors", upgrade: false, value: 0 });
  passer();
  appels[0].ok({ ok: true, joueur: diverge });
  assert.equal(rendus, 1, "réponse différente de l'écran : rendu complet (le serveur a le dernier mot)");
}

// 2f. Une réponse arrivée alors qu'une valeur plus récente attend n'écrase rien.
{
  appels.length = 0;
  rendus = 0;
  const envoyer = window_.__envoyerAllocRapideIdleV1__;
  envoyer({ action: "allocate", system: "timeMachine", resource: "energy", value: 1 });
  passer();
  envoyer({ action: "allocate", system: "timeMachine", resource: "energy", value: 2 });
  appels[0].ok({ ok: true, joueur: { systemes: { systems: [] } } });
  assert.equal(rendus, 0, "réponse plus ancienne que la valeur voulue : ignorée");
  passer();
}

// --- 3. Câblage : plus d'attente serveur sur ces clics, envoi groupé, aides au recalcul ---
{
  assert.ok(!/action:'allocateAugment',pair:pairId,upgrade:Boolean\(upgrade\),value:value\}\);\s*\n\s*\}\s*\n\s*window\.__ajusterAugmentIdleV1__/.test(meta.replace(/__envoyerAllocRapideIdleV1__/g, "")) || meta.includes("envoyerAllocRapideV1_({action:'allocateAugment'"));
  for (const attendu of [
    "envoyerAllocRapideV1_({action:'allocateAugment'",
    "envoyerAllocRapideV1_({action:'allocate',system:'timeMachine'",
    "envoyerAllocRapideV1_({action:'allocateRitual',ritual:id,value:value})",
    "envoyerAllocRapideV1_({action:'selectRitual'",
    "envoyerAllocRapideV1_({action:'clearAugmentAllocations'})",
    "recalculerAugmentLocalIdleV1_(j,pairId,upgrade,value)",
    "recalculerTimeMachineLocalIdleV1_(j,ressource,value)",
    "recalculerBloodLocalIdleV1_(j,id,value)",
    "onclick=\"window.__viderAugmentsIdleV1__()\""
  ]) assert.ok(meta.includes(attendu), "câblage manquant : " + attendu);
  assert.ok(!meta.includes("action:'clearAugmentAllocations'})\"") || !meta.includes("window.__actionMetaV47__({action:\\'clearAugmentAllocations"), "plus d'aller-retour bloquant sur « Tout retirer »");
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.ok(ui.includes("patcherBarresTimeMachineIdleV1_:patcherBarresTimeMachineIdleV1_") && ui.includes("rafraichirMenuRacineIdleV28_:rafraichirMenuRacineIdleV28_"), "hôte : redessin local et barres Time Machine");
  assert.ok(ui.includes("avant le prochain rituel complété';") || ui.includes("avant le prochain rituel complété'"), "compte à rebours Blood Magic vivant");
}

console.log("idle-fast-alloc-v1: OK");
