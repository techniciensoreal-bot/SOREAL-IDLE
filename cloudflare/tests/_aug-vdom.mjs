/*
 * Aide des tests de la page Augmentations (rendue par composants Preact, modules/augmentations-vdom-v1.js) : une fenêtre de test avec un faux DOM (_faux-dom-vdom.mjs), le VRAI Preact, le VRAI pont, le VRAI module
 * historique (augmentations-page-v1.js, d'où viennent les calculs partagés) et le VRAI module Preact, un hôte « méta » minimal.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerDocument, chargerPreact, chargerPont } from "./_faux-dom-vdom.mjs";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nbFmt = (v, d) => { const n = Number(v) || 0; const k = 10 ** (d || 0); return String(Math.round(n * k) / k).replace(".", ","); };

export function creerAugmentations({ sansPreact = false } = {}) {
  const document = creerDocument();
  const stockage = {};
  const appels = [];
  const window = {
    document, console, setTimeout, clearTimeout, Date, performance: { now: () => 5000 },
    setInterval: () => 1,
    localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); }, removeItem: (k) => { delete stockage[k]; } },
    __SOREAL_IDLE_HEURE_V1__: () => 1_000_000,
    __menuActifIdleV28__: () => "augmentations"
  };
  window.window = window; window.self = window;
  const contexte = window;
  if (!sansPreact) { chargerPreact(contexte); chargerPont(contexte); }
  const hote = {
    etat: null, getIdleEtat: () => hote.etat,
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : 0; },
    idleHtml_: esc, formatGrandNombreIdleV70_: nbFmt,
    entetePageIdleV28_: (t, s) => '<div class="soreal-idle-page-head-v28"><div class="soreal-idle-page-title-v28">' + t + '</div>' + (s ? '<div class="soreal-idle-page-sub-v28">' + s + '</div>' : '') + '</div>',
    appelerProgressionIdleCloudflareV1_: () => {}
  };
  window.__SOREAL_IDLE_META_HOST_V130__ = hote;
  const systemeMeta = (j, id) => (j && j.__meta && j.__meta[id]) || null;
  window.__SOREAL_IDLE_META_V130__ = { systemeMetaParIdIdleV130_: systemeMeta };
  window.__SOREAL_IDLE_META_PARTAGE_V130__ = { systemeMetaParIdIdleV130_: systemeMeta, actionMetaNoyauIdleV130_: () => {}, allocationMaxMetaIdleV48_: () => 0 };
  window.__SOREAL_IDLE_NUMBER_FORMAT_V1__ = { entierLisible: (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "), grandNombre: (v) => nbFmt(v, 2) + "K" };
  window.__SOREAL_IDLE_ALLOC_V1__ = { compteur: (res, sys) => '<div class="soreal-idle-bt-total-v1" data-alloc-cadre-v1="total-' + res + '">Total placé : 0 (' + sys + ')</div>' };
  window.__SOREAL_IDLE_MORPH_V1__ = { morpherHtml: (el, html) => { if (el.__dernierMorph === html) return; el.__dernierMorph = html; const t = document.createElement("template"); t.innerHTML = html; [...el.childNodes].forEach((c) => el.removeChild(c)); [...t.content.childNodes].forEach((c) => el.appendChild(c)); } };
  vm.runInNewContext(readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8"), contexte);
  /* Les ponts des clics sont REMPLACÉS par des enregistreurs APRÈS le chargement du module historique (qui définit les vrais) : le test vérifie quel pont est appelé, avec quels arguments. */
  window.__cibleAugmentIdleV1__ = (id, up, v) => appels.push(["cible", id, up, v]);
  window.__ajusterAugmentIdleV1__ = (id, up, mode) => appels.push(["ajuster", id, up, mode]);
  window.__avanceAugmentsIdleV1__ = (c) => appels.push(["avance", c]);
  window.__resoudreFractionInputIdleV1__ = (el) => appels.push(["fraction", el.value]);
  window.__lireMontantAugmentIdleV1__ = () => 125;
  window.__saisirMontantAugmentIdleV1__ = (v) => appels.push(["saisir", v]);
  vm.runInNewContext(readFileSync("cloudflare/public/modules/augmentations-vdom-v1.js", "utf8"), contexte);
  return { window, document, hote, appels, stockage, AP: window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__, W: window.__SOREAL_IDLE_AUGMENTATIONS_VDOM_V1__, pont: window.__SOREAL_IDLE_VDOM_V1__ };
}

const DEFS = [
  ["scissors", "Safety Scissors", 0, "dangerScissors", 2], ["milk", "Milk Infusion", 4, "drinkMilk", 6], ["cannon", "Cannon Implant", 10, "missileLauncher", 14],
  ["minigun", "Shoulder Mounted Minigun", 20, "actualAmmo", 26], ["buster", "Energy Buster", 30, "chargeShot", 36]
];
/* Partie factice : `boss` = boss vaincus du run ; chaque paire a un peu d'énergie, un niveau et un coût. */
export function partieAugmentations({ boss = 12, libre = 5000, avance = false, niveau = 3 } = {}) {
  const defs = DEFS.map(([id, name, unlockBoss, upId, upBoss], i) => ({
    id, name, unlockBoss, target: 0, upgradeTarget: i === 1 ? -1 : 25, progressPct: 0.25 * (i + 1) / 5, upgradeProgressPct: 0.1,
    secondsPerLevel: 2 + i, upgradeSecondsPerLevel: 6 + i, goldCost: 100 * (i + 1), upgradeGoldCost: 5000 * (i + 1), waitingGold: false, upgradeWaitingGold: i === 2,
    upgrade: { id: upId, name: upId, unlockBoss: upBoss }
  }));
  const pairs = {};
  defs.forEach((d, i) => { pairs[d.id] = { energy: 1000 * (i + 1), level: niveau + i, upgradeEnergy: 200 * i, upgradeLevel: i }; });
  return {
    nom: "Testeur", bossVaincus: boss, energie: libre,
    __meta: { augmentations: { state: { unlocked: true, data: { pairs } } } },
    systemes: { augmentations: defs, currencies: { gold: 1000 }, records: { highestBoss: boss + 20 }, bonuses: { augmentationMultiplier: 12.5 }, augmentationsAdvance: avance, challenge: {} }
  };
}
