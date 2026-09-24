import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  rebirthIdleNguState,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Questing (2026-09-23) : câblage de bout en bout (idle-questing-v1.js + crochets de
 * idle-ngu-progression.js + Sellout + page client modules/questing-v1.js).
 */
const ctx = { bosses: 200, rebirths: 1 };
const T0 = 1_000_000_000;
const act = (s, payload, t = T0) => applyIdleNguAction(s, payload, ctx, t);
const avecAleatoire = (valeur, fn) => {
  const orig = Math.random;
  Math.random = () => valeur;
  try { return fn(); } finally { Math.random = orig; }
};

function base(sets = { sewers: true }) {
  let s = normalizeIdleNguState({}, ctx, T0);
  s.adventure.unlockItems = Object.assign({}, s.adventure.unlockItems, { heroicSigil: true });
  s.adventure.completedSets = Object.assign({}, sets);
  return normalizeIdleNguState(s, ctx, T0);
}

// --- Déblocage : Heroic Sigil -> Questing -> Quirks ---
{
  const verrouille = normalizeIdleNguState({}, ctx, T0);
  assert.equal(verrouille.systems.questing.unlocked, false);
  assert.throws(() => act(verrouille, { action: "questStart" }), /SYSTEME_VERROUILLE/);
  assert.equal(idleNguSnapshot(verrouille, ctx, T0).questing.unlocked, false);
  const s = base();
  assert.equal(s.systems.questing.unlocked, true);
  assert.equal(s.systems.quirks.unlocked, true, "Quirks se débloquent avec Questing");
}

// --- Génération : zones selon les sets complétés, 50-59 objets, Fibonacci 610 ---
{
  assert.throws(() => act(base({}), { action: "questStart" }), /QUETE_AUCUNE_ZONE/, "aucun set complété : aucune zone");
  const bas = avecAleatoire(0, () => act(base(), { action: "questStart" }));
  assert.equal(bas.result.zone, "sewers");
  assert.equal(bas.result.required, 50);
  const haut = avecAleatoire(0.999999, () => act(base({ sewers: true, forest: true, edgy: true }), { action: "questStart" }));
  assert.equal(haut.result.zone, "evilverse", "set Edgy complété -> The Evilverse");
  assert.equal(haut.result.required, 59);
  const fibo = base();
  fibo.systems.perks.unlocked = true;
  fibo.systems.perks.data = { levels: { 94: 610 } };
  assert.equal(avecAleatoire(0.999999, () => act(fibo, { action: "questStart" })).result.required, 50, "Fibonacci 610 : toujours 50");
  assert.throws(() => act(base(), { action: "questStart", major: true }), /QUETE_MAJEURE_INDISPONIBLE/);
  assert.throws(() => act(bas.state, { action: "questStart" }), /QUETE_DEJA_ACTIVE/);
}

// --- Banque de Major Quests : 7 h 50, plafond 10 (50 avec Extended Quest Bank) ---
{
  let s = base();
  s = advanceIdleNguState(s, 28199, ctx, T0 + 28199_000);
  assert.equal(s.systems.questing.data.majorsBanked, 0);
  s = advanceIdleNguState(s, 1, ctx, T0 + 28200_000);
  assert.equal(s.systems.questing.data.majorsBanked, 1, "une Major toutes les 7 h 50");
  s = advanceIdleNguState(s, 28200 * 30, ctx, T0 + 28200_000 * 31);
  assert.equal(s.systems.questing.data.majorsBanked, 10, "plafond 10");
  s.selloutShop.purchases.extendedQuestBank = 1;
  s = advanceIdleNguState(s, 28200 * 5, ctx, T0 + 28200_000 * 36);
  assert.equal(s.systems.questing.data.majorsBanked, 15, "Extended Quest Bank : plafond 50");
  const m = avecAleatoire(0, () => act(s, { action: "questStart", major: true }, T0 + 28200_000 * 36));
  assert.equal(m.result.major, true);
  assert.equal(m.state.systems.questing.data.majorsBanked, 14);
}

// --- Drops actifs : kill dans la zone de quête uniquement, jamais en idle ---
let enQuete;
{
  let s = avecAleatoire(0, () => act(base({ sewers: true, forest: true }), { action: "questStart" })).state;
  assert.equal(s.systems.questing.data.quest.zone, "sewers");
  s.adventure.selectedZone = "sewers";
  const kill = avecAleatoire(0, () => act(s, { action: "adventure", adventure: { action: "zoneKill" } }));
  assert.deepEqual(kill.result.questDrop, { zone: "sewers", name: "Bits of String", level: 0 });
  assert.deepEqual(kill.state.systems.questing.data.items, { sewers: { 0: 1 } });
  const rate = avecAleatoire(0.05, () => act(kill.state, { action: "adventure", adventure: { action: "zoneKill" } }));
  assert.equal(rate.result.questDrop, undefined, "5 % : un tirage à 0,05 ne donne rien");
  const ailleurs = kill.state;
  ailleurs.adventure.selectedZone = "forest";
  assert.equal(avecAleatoire(0, () => act(ailleurs, { action: "adventure", adventure: { action: "zoneKill" } })).result.questDrop, undefined, "hors zone de quête : rien");
  let idle = act(kill.state, { action: "questIdle", active: true }).state;
  idle.adventure.selectedZone = "sewers";
  assert.equal(avecAleatoire(0, () => act(idle, { action: "adventure", adventure: { action: "zoneKill" } })).result.questDrop, undefined, "idle actif : plus de drops");
  enQuete = kill.state;
}

// --- Remise, fusion, complétion active (x2) et QP -> Quirks ---
{
  let s = enQuete;
  s.systems.questing.data.items = { sewers: { 0: 55 } };
  let r = act(s, { action: "questMerge", zone: "sewers", levelA: 0, levelB: 0 });
  assert.deepEqual(r.result, { zone: "sewers", level: 1, maxed: false }, "fusion : 0 + 0 + 1");
  s = r.state;
  assert.throws(() => act(s, { action: "questComplete" }), /QUETE_INCOMPLETE/);
  r = act(s, { action: "questHandIn" });
  assert.equal(r.result.progress, 50);
  assert.equal(r.result.handedIn, 50);
  assert.deepEqual(r.state.systems.questing.data.items, { sewers: { 0: 3, 1: 1 } }, "le surplus reste en stock");
  const qpAvant = r.state.currencies.qp;
  const apAvant = r.state.currencies.ap;
  r = act(r.state, { action: "questComplete" });
  assert.equal(r.result.qp, 20, "Minor active : 10 x 2");
  assert.equal(r.state.currencies.qp - qpAvant, 20);
  /* 2026-09-24 : AP x bonus des succès (boss 10..200 + "Rebirth once!" = 665 BP -> floor(20 x 1,0665) = 21). */
  assert.equal(r.state.currencies.ap - apAvant, 21);
  assert.equal(r.state.systems.questing.data.quest, null);
  r.state.currencies.qp = 100;
  const achat = act(r.state, { action: "buyQuirk", quirkId: 0 });
  assert.equal(achat.state.currencies.qp, 0, "les QP de quête achètent des Quirks");
}

// --- Bonus Quest Handin Progress : 1 + niveau / 10 ---
{
  let s = avecAleatoire(0, () => act(base(), { action: "questStart" })).state;
  s.systems.perks.unlocked = true;
  s.systems.perks.data = { levels: { 145: 1 } };
  s.systems.questing.data.items = { sewers: { 20: 1, 0: 1 } };
  const r = act(s, { action: "questHandIn" });
  assert.equal(r.result.progress, 1 + 3, "niv. 0 -> 1, niv. 20 -> 1 + 2");
}

// --- Idle : 800 s par objet (diviseur 8, respawn 4 s, speed 1 s), récompense non doublée ---
{
  let s = avecAleatoire(0, () => act(base(), { action: "questStart" })).state;
  s = act(s, { action: "questIdle", active: true }).state;
  const snap = idleNguSnapshot(s, ctx, T0).questing;
  assert.equal(snap.idleDivider, 8);
  assert.equal(snap.idleSecondsPerItem, 800);
  assert.equal(snap.quest.idleEtaSeconds, 50 * 800);
  s = advanceIdleNguState(s, 799, ctx, T0 + 799_000);
  assert.equal(s.systems.questing.data.quest.progress, 0);
  s = advanceIdleNguState(s, 50 * 800, ctx, T0 + 50_799_000);
  const q = s.systems.questing.data.quest;
  assert.equal(q.progress, 50, "terminée par l'idle, sans Truly Idle elle attend");
  assert.equal(q.usedIdle, true);
  const r = act(s, { action: "questComplete" }, T0 + 50_799_000);
  assert.equal(r.result.qp, 10, "Minor idle : 10 QP");
  assert.equal(r.result.active, false);
}

// --- Truly Idle Questing : remise + nouvelle quête automatiques, Major d'abord ---
{
  let s = base();
  s.systems.perks.unlocked = true;
  s.systems.perks.data = { levels: { 104: 1 } };
  s.systems.questing.data = { idle: true, majorsBanked: 2 };
  const mineures = JSON.parse(JSON.stringify(s));
  s = avecAleatoire(0, () => advanceIdleNguState(s, 3 * 50 * 800 + 1, ctx, T0 + (3 * 50 * 800 + 1) * 1000));
  const d = s.systems.questing.data;
  /* 120 001 s : la banque gagne aussi 4 Majors (7 h 50) pendant ce temps. */
  assert.equal(d.stats.majorCompleted, 3, "Majors d'abord tant que la banque en contient");
  assert.equal(d.stats.minorCompleted, 0);
  assert.equal(d.stats.qpEarned, 3 * 50, "idle : 50 QP par Major");
  assert.equal(d.majorsBanked, 2 + 4 - 4, "2 + 4 gagnées - 3 terminées - 1 relancée");
  assert.ok(d.quest && d.quest.major, "une nouvelle Major est lancée");

  mineures.systems.questing.data.preferMajor = false;
  const m = avecAleatoire(0, () => advanceIdleNguState(mineures, 3 * 50 * 800 + 1, ctx, T0 + (3 * 50 * 800 + 1) * 1000)).systems.questing.data;
  assert.equal(m.stats.minorCompleted, 3);
  assert.equal(m.stats.qpEarned, 3 * 10);
  assert.equal(m.majorsBanked, 6, "les Majors restent en banque");
}

// --- Beast Butter (Sellout + set Fad) et persistance au Rebirth ---
{
  let s = avecAleatoire(0, () => act(base({ sewers: true, fad: true }), { action: "questStart" })).state;
  s = advanceIdleNguState(s, 1, ctx, T0 + 1000);
  assert.equal(s.selloutEffects.beastButters, 3, "Fad (set) : 3 Beast Butters, une seule fois");
  s = advanceIdleNguState(s, 1, ctx, T0 + 2000);
  assert.equal(s.selloutEffects.beastButters, 3);
  s.currencies.ap = 10000;
  s.selloutShop.unlockedEver = true;
  s = act(s, { action: "sellShopBuy", itemId: "beastButter1" }, T0 + 2000).state;
  assert.equal(s.selloutEffects.beastButters, 4);
  s.systems.questing.data.items = { sewers: { 0: 60 } };
  s = act(s, { action: "questHandIn" }, T0 + 2000).state;
  s.systems.questing.data.majorsBanked = 3;
  s.systems.questing.data.majorProgressSeconds = 1234;

  const rb = rebirthIdleNguState(s, ctx, T0 + 400_000);
  const d = rb.systems.questing.data;
  assert.equal(d.quest.progress, 50, "la quête active survit au Rebirth");
  assert.equal(d.majorsBanked, 3, "les Majors en banque survivent");
  assert.deepEqual(d.items, { sewers: { 0: 10 } }, "le stock d'objets de quête survit");
  const r = act(rb, { action: "questComplete" }, T0 + 400_000);
  assert.equal(r.result.qp, 40, "Minor active x2, Beast Butter x2");
  assert.equal(r.state.selloutEffects.beastButters, 3, "un Butter consommé");
}

// --- Faster Questing : achetable, et accélère la banque ---
{
  let s = base();
  s.currencies.ap = 250000;
  s.selloutShop.unlockedEver = true;
  s = act(s, { action: "sellShopBuy", itemId: "fasterQuesting" }).state;
  assert.equal(idleNguSnapshot(s, ctx, T0).questing.majorIntervalSeconds, 23500, "28 200 / 1,2");
}

// --- Client : module chargé, branché dans pageSystemeMetaIdleV130_, rendu de la page ---
{
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  assert.ok(index.indexOf("/modules/questing-v1.js") > index.indexOf("/modules/meta-progression-v130.js"), "questing-v1.js chargé après le module méta");
  assert.ok(index.indexOf("/modules/questing-v1.js") < index.indexOf("/soreal-idle-ui.js"));
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.match(meta, /if\(id==='questing'&&window\.__SOREAL_IDLE_QUESTING_V1__\)return window\.__SOREAL_IDLE_QUESTING_V1__\.page\(j\);/);

  const envoyes = [];
  const window = {
    __SOREAL_IDLE_META_HOST_V130__: {
      idleHtml_: (v) => String(v == null ? "" : v),
      idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
      entetePageIdleV28_: (t, st) => "<h1>" + t + "</h1><p>" + st + "</p>"
    },
    __SOREAL_IDLE_META_V130__: {
      actionMetaIdleV130_: (p) => envoyes.push(p),
      systemeMetaParIdIdleV130_: (j, id) => (j.systemes.systems || []).find(x => x.id === id) || null
    }
  };
  vm.runInNewContext(readFileSync("cloudflare/public/modules/questing-v1.js", "utf8"), { window });
  let s = avecAleatoire(0, () => act(base(), { action: "questStart" })).state;
  s.systems.questing.data.items = { sewers: { 0: 2 } };
  const j = { systemes: idleNguSnapshot(s, ctx, T0) };
  const html = window.__SOREAL_IDLE_QUESTING_V1__.page(j);
  assert.match(html, /Quête en cours/);
  assert.match(html, /Bits of String/);
  assert.match(html, /Égouts/);
  assert.match(html, /50/);
  const verrou = window.__SOREAL_IDLE_QUESTING_V1__.page({ systemes: idleNguSnapshot(normalizeIdleNguState({}, ctx, T0), ctx, T0) });
  assert.match(verrou, /verrouillé/);
  const api = window.__questingIdleV1__;
  api.demarrer(true); api.remettre(); api.terminer(); api.abandonner(); api.idle(true); api.prefs({ useButter: false }); api.fusionner("sewers", 0, 0); api.allerZone("sewers");
  assert.deepEqual(envoyes.map(p => p.action), ["questStart", "questHandIn", "questComplete", "questSkip", "questIdle", "questPrefs", "questMerge", "adventure"]);
  for (const p of envoyes.filter(p => p.action.startsWith("quest"))) {
    let message = "";
    try { act(s, p); } catch (e) { message = String(e.message); }
    assert.doesNotMatch(message, /INCONNUE/, "l'action client " + p.action + " est routée vers le moteur de quêtes");
  }
}

console.log("idle-questing-wiring: OK");
