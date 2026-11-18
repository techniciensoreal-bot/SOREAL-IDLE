/*
 * Aide des tests de la page Money Pit (rendue par composants Preact, modules/money-pit-vdom-v1.js) : une fenêtre de test avec un faux DOM (_faux-dom-vdom.mjs), le VRAI Preact, le VRAI pont, le VRAI
 * module historique (money-pit-page-v1.js) et le VRAI module Preact, un hôte « méta » minimal et une roue / une légende factices (leurs vrais modules sont testés ailleurs).
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerDocument, chargerPreact, chargerPont } from "./_faux-dom-vdom.mjs";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nbFmt = (v, d) => { const n = Number(v) || 0; const k = 10 ** (d || 0); return String(Math.round(n * k) / k).replace(".", ","); };

export function creerMoneyPit({ sansPreact = false, roue = true } = {}) {
  const document = creerDocument();
  const stockage = {};
  const actions = [];
  const synchros = [];
  const timers = [];
  const window = {
    document, console, setTimeout, clearTimeout, Date,
    setInterval: (f) => { timers.push(f); return timers.length; },
    localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); }, removeItem: (k) => { delete stockage[k]; } },
    __actionMetaIdleV130__: (a) => actions.push(a),
    __SOREAL_IDLE_HEURE_V1__: () => 1_000_000
  };
  window.window = window; window.self = window;
  const contexte = window;
  if (!sansPreact) { chargerPreact(contexte); chargerPont(contexte); }
  /* Données de la partie factice : fabriquées par le test (j.__meta : id -> système). */
  const hote = {
    getIdleEtat: () => hote.etat,
    etat: null,
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : 0; },
    idleHtml_: esc,
    formatGrandNombreIdleV70_: nbFmt,
    entetePageIdleV28_: (t, s) => '<div class="soreal-idle-page-head-v28"><div class="soreal-idle-page-title-v28">' + t + '</div>' + (s ? '<div class="soreal-idle-page-sub-v28">' + s + '</div>' : '') + '</div>',
    rafraichirMenuRacineIdleV28_: () => synchros.push("rafraichir")
  };
  window.__SOREAL_IDLE_META_HOST_V130__ = hote;
  window.__SOREAL_IDLE_META_V130__ = { systemeMetaParIdIdleV130_: (j, id) => (j && j.__meta && j.__meta[id]) || null, collecterSystemeMetaIdleV130_: () => null };
  window.__SOREAL_IDLE_META_PARTAGE_V130__ = { systemeMetaParIdIdleV130_: (j, id) => (j && j.__meta && j.__meta[id]) || null };
  const rouePrix = [];
  if (roue) {
    window.__SOREAL_IDLE_ROUE_V1__ = {
      enCours: () => false, stAvant: () => null, memoPrix: (p, t) => rouePrix.push([p && p.prize, t]),
      rendreCarte: (st) => '<div class="rb-roue" data-roue-v1="1"><div class="rb-roue-int"><div class="rb-titre">Roue journalière</div><svg class="rb-svg"><g class="rb-rot" style="transform:rotate(' + ((st && st.angle) || 0) + 'deg)"></g></svg></div></div>',
      rendreControles: (st, j, bouton) => bouton + '<div class="rb-legende"><div class="rb-leg"><span>Lot A</span></div></div>'
    };
    window.__SOREAL_IDLE_TROU_V1__ = {
      rendreLegende: (j) => '<div class="rb-jackpot-detail" data-trou-v1="1" data-mp-palier="' + ((j && j.__palier) || 0) + '"><b>Récompenses possibles avec ton Or actuel</b></div><div class="rb-legende"><div class="rb-leg"><span>Lot X</span></div></div>'
    };
  }
  /* Faux morph : analyse le HTML (template) et remplace les enfants de l'élément ; une chaîne identique ne touche à rien (le vrai morph compare nœud par nœud). */
  window.__SOREAL_IDLE_MORPH_V1__ = { morpherHtml: (el, html) => { if (el.__dernierMorph === html) return; el.__dernierMorph = html; const t = document.createElement("template"); t.innerHTML = html; [...el.childNodes].forEach((c) => el.removeChild(c)); [...t.content.childNodes].forEach((c) => el.appendChild(c)); } };
  vm.runInNewContext(readFileSync("cloudflare/public/modules/money-pit-page-v1.js", "utf8"), contexte);
  vm.runInNewContext(readFileSync("cloudflare/public/modules/money-pit-vdom-v1.js", "utf8"), contexte);
  return { window, document, actions, synchros, timers, stockage, hote, rouePrix, MP: window.__SOREAL_IDLE_MONEY_PIT_V1__, W: window.__SOREAL_IDLE_MONEY_PIT_VDOM_V1__, pont: window.__SOREAL_IDLE_VDOM_V1__ };
}

/* Partie factice avec de l'historique, des totaux, un calendrier et un compte à rebours (sans rien de verrouillé). */
export function partieMoneyPit({ nbPit = 25, nbRoue = 3, serie = 3, pret = true, pitRecharge = false } = {}) {
  const histPit = [];
  for (let i = 0; i < nbPit; i++) histPit.push({ at: 1_700_000_000_000 + i * 60_000, tier: 1 + (i % 3), cost: 1000 * (i + 1), reward: i % 2 ? { adventureStats: 5 + i } : { ap: 100 + i, seeds: 2 }, boost: i === 4 ? { type: "power", strength: 12 } : null });
  const histRoue = [];
  for (let i = 0; i < nbRoue; i++) histRoue.push({ at: 1_700_100_000_000 + i * 60_000, tier: 2, reward: { ap: 50 + i } });
  const reclamees = []; for (let i = 1; i <= serie; i++) reclamees.push(i);
  return {
    nom: "Testeur",
    __palier: 2,
    __meta: {
      moneyPit: { state: { level: nbPit, data: { history: histPit, nextAt: pitRecharge ? 1_000_000 + 125_000 : 0, rewardsTotal: { adventureStats: 120, ap: 900, seeds: 8, boosts: 1, cubePower: 3, pilule: 1.5 } } } },
      dailySpin: { state: { level: nbRoue, data: { history: histRoue, totalSpins: nbRoue, readyAt: pret ? 0 : 1_000_000 + 3_700_000, rewardsTotal: { ap: 150, seeds: 2, items: { luckyCharm: 2, poop: 1 } } } } }
    },
    systemes: {
      currencies: { gold: 5000 },
      loginCalendar: { bareme: Array.from({ length: 30 }, (_, i) => 1000 * (i + 1)), serie, moisNumero: 11, annee: 2026, reclamees, ratees: [], jourDuMois: serie + 1, reclamable: true, prochainAp: 4000, offert: false, joursRates: 1, multiplicateur: 0.9, totalMois: 465000, totalAp: 900000 }
    }
  };
}
