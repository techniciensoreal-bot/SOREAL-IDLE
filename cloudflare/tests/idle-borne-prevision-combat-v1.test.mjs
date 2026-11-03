import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-11-03) : « l'animation spéciale ne doit pas se lancer pour les combats courts. le jeu sait déjà si on va gagner ou perdre le combat ; donc il ne doit mettre les animations longues
 * (twin peaks, massacre, ...) que quand le temps le permet ». La borne calcule l'issue et la durée PRÉVUES du combat (prevoirCombatBossV1, mêmes formules que le moteur) dès la première image de FIGHT !,
 * et ne lance l'animation du combat (et sa scène de fin longue) que si la durée prévue atteint ANIM_DUREE_MIN_S. L'observation de la barre ne sert qu'en repli (prévision « inconnue »).
 */
const src = fs.readFileSync(new URL("../public/modules/borne-led-v1.js", import.meta.url), "utf8");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => null }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
const prev = (e) => JSON.parse(ev("JSON.stringify(prevoirCombatBossV1(" + JSON.stringify(e) + "))"));
const base = { puissance: 1000, defenseBoss: 0, attaqueBoss: 0, defense: 0, regenBoss: 0, bossPv: 10000, bossPvMax: 10000, pvJoueur: 100, pvJoueurMax: 100 };

// --- prévision pure ---
assert.deepEqual(prev(base), { issue: "victoire", secondes: 10 }, "boss 10 000 PV, 1 000 de dégâts par seconde : victoire en 10 s");
assert.equal(prev({ ...base, bossPv: 1000 }).secondes, 1, "victoire courte");
assert.equal(prev({ ...base, attaqueBoss: 20 }).issue, "defaite");
assert.equal(prev({ ...base, attaqueBoss: 20 }).secondes, 5, "défaite : le joueur meurt à 100 / 20 = 5 s");
assert.deepEqual(prev({ ...base, attaqueBoss: 5, pvJoueur: 100 }), { issue: "victoire", secondes: 10 }, "50 de dégâts reçus sur 10 s : il tient");
assert.deepEqual(prev({ ...base, attaqueBoss: 12, pvJoueur: 100 }), { issue: "defaite", secondes: 8.333 }, "défaite longue : 100 / 12");
// défense : dégâts reçus = attaque - défense, moins la régénération (défense / 20)
assert.deepEqual(prev({ ...base, attaqueBoss: 200, defense: 200 }), { issue: "victoire", secondes: 10 }, "défense >= attaque du boss : aucun dégât");
assert.equal(prev({ ...base, attaqueBoss: 220, defense: 200, pvJoueur: 5 }).issue, "defaite", "20 de dégâts - 10 de régénération = 10 par seconde : 5 PV tiennent 0,5 s");
assert.equal(prev({ ...base, attaqueBoss: 220, defense: 200, pvJoueur: 5 }).secondes, 0.5);
// défense du boss : les dégâts du joueur = puissance - défense du boss
assert.equal(prev({ ...base, defenseBoss: 900 }).secondes, 100, "100 de dégâts nets : 100 s");
// régénération du boss
assert.equal(prev({ ...base, bossPv: 5000, puissance: 1000, regenBoss: 500 }).secondes, 10, "5 000 PV, 500 de dégâts nets (1 000 - 500 de régénération)");
assert.equal(prev({ ...base, regenBoss: 1000 }).issue, "inconnue", "la régénération annule les dégâts et le boss ne frappe pas : le combat ne finit jamais");
assert.deepEqual(prev({ ...base, regenBoss: 1000, attaqueBoss: 10 }), { issue: "defaite", secondes: 10 }, "le boss ne perd rien mais frappe : défaite prévue");
assert.equal(prev({ ...base, puissance: 0 }).issue, "inconnue", "aucun dégât et aucun coup reçu : inconnue");
// fureur sous 30 % : l'attaque change en cours de combat
const fureur = { ...base, puissance: 100, bossPv: 1000, bossPvMax: 1000, attaqueBoss: 10, pvJoueur: 5000, bossCapacites: [{ type: "fureur", valeur: 100 }] };
assert.deepEqual(prev(fureur), { issue: "victoire", secondes: 10 });
assert.deepEqual(prev({ ...fureur, pvJoueur: 80 }), { issue: "defaite", secondes: 7.5 }, "70 s... 7 s à 10 PV/s puis 0,5 s à 20 PV/s");
// paralysie : dégâts du joueur réduits de durée / intervalle (moyenne du moteur)
assert.equal(prev({ ...base, bossCapacites: [{ type: "paralysie", intervalle: 10, duree: 5 }] }).secondes, 20);
// vie nulle, état incomplet ou absurde = inconnue (jamais d'animation décidée sur une supposition)
for (const mauvais of [null, undefined, {}, { ...base, bossPv: 0 }, { ...base, bossPvMax: 0 }, { ...base, pvJoueur: 0 }, { ...base, puissance: undefined }, { ...base, regenBoss: "x" }, { ...base, attaqueBoss: NaN }]) assert.deepEqual(prev(mauvais), { issue: "inconnue", secondes: null }, JSON.stringify(mauvais));

// --- même résultat que le VRAI moteur (durée réelle du combat, simulée par le serveur) ---
const VraiDate = Date; let t = 1_800_000_000_000;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(t); else super(...a); } static now() { return t; } };
try {
  const reel = (boss, L, M, frac) => {
    const g = creerJoueurExterneV1("prevision" + boss + "-" + L + "-" + M + "@example.com");
    g.op("obtenirEtatSorealIdle", "x"); g.op("definirPseudoSorealIdle", "x", "P");
    const ligne = () => JSON.parse(g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=2")[0].row_json);
    const ecrire = (l) => g.sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=2", JSON.stringify(l));
    let l = ligne();
    const stats = JSON.parse(l[37]);
    stats.entrainementBase = { version: 411, lastUpdateMs: t, skills: { attaque_passive: { level: L, progress: 0, allocation: 0, cap: 1e9 }, blocage: { level: M, progress: 0, allocation: 0, cap: 1e9 } } };
    l[37] = JSON.stringify(stats); l[14] = boss; l[2] = 400; ecrire(l);
    let e = g.op("obtenirEtatSorealIdle", "x").joueur;
    l = ligne(); l[12] = e.bossPvMax; l[13] = e.bossPvMax; l[26] = Math.max(1, Math.round(e.pvJoueurMax * frac)); ecrire(l);
    e = g.op("obtenirEtatSorealIdle", "x").joueur;
    const p = prev(e);
    assert.ok(g.op("definirCombatBossSorealIdle", "x", true, "manuel").ok);
    for (let i = 0; i < 100; i += 1) {
      t += 10_000; g.op("synchroniserSorealIdle", "x");
      const s = JSON.parse(ligne()[37]);
      if (!s.combatBossActif) return { p, duree: s.combatBossPlusLongSec, gagne: s.combatBossPlusLongGagne };
    }
    return { p, duree: null };
  };
  // [boss, niveaux d'attaque, niveaux de défense, fraction de vie] : victoire longue, victoire courte, défaite courte, défaite longue
  for (const [boss, L, M, f] of [[0, 150, 0, 1], [0, 400, 0, 1], [0, 20, 0, 1], [0, 60, 40, 1], [5, 400, 0, 1], [2, 300, 0, 1]]) {
    const r = reel(boss, L, M, f);
    assert.notEqual(r.duree, null, "le combat se termine");
    assert.equal(r.p.issue, r.gagne ? "victoire" : "defaite", "même issue que le moteur : " + JSON.stringify([boss, L, M, f]));
    assert.ok(Math.abs(r.p.secondes - r.duree) <= Math.max(0.01, r.duree * 0.02), "durée prévue " + r.p.secondes + " s ~ réelle " + r.duree + " s");
  }
} finally { globalThis.Date = VraiDate; }

// --- comportement de la borne ---
const formateur = (v) => String(v);
const etat = (extra = {}) => ({ combatBossActif: true, bossSelection: 3, bossVaincus: 2, bossActuel: "Boss", nom: "J", bossPv: 10000, bossPvMax: 10000, pvJoueur: 100, pvJoueurMax: 100, puissance: 1000, defenseBoss: 0, attaqueBoss: 0, defense: 0, regenBoss: 0, ...extra });
const lancer = (e, anim) => {
  fen.__SOREAL_IDLE_REG__ = { idleEtat: e, formaterPvFixeIdleV1_: formateur };
  fen.__SOREAL_IDLE_BORNE_ANIM_FORCEE__ = anim || "redroom";
  ev("cur=null;pend=false;combatAnim='';animChoisie='';animDecision=0;animBossJoue=-1;L.ok=false;");
  ev("lire(1000);combatFight(1000,false)");   /* le combat commence : FIGHT ! */
  /* Norman (2026-11-03) : au clic, la prévision décide tout de suite : la scène démarre (ou FIGHT ! si le combat est trop court) */
  assert.ok(["fight", anim || "redroom"].includes(ev("cur.id")));
  ev("lire(1010);majAnimation(1010)");        /* première image : 10 ms plus tard (plus d'attente d'une seconde) */
  return { scene: ev("cur.id"), decision: ev("animDecision"), anim: ev("combatAnim") };
};
// combat court (1 s prévue) : FIGHT ! simple, aucune animation, scènes de fin COURTES
let r = lancer(etat({ bossPv: 1000, bossPvMax: 1000 }));
assert.deepEqual(r, { scene: "fight", decision: -1, anim: "" }, "combat court : pas d'animation");
assert.equal(ev("mk('win',2000).dur"), 7.2, "victoire courte : scène de fin sans animation");
assert.equal(ev("mk('ko',2000).dur"), 6.4, "défaite courte : scène de fin sans animation");
assert.equal(ev("mk('win',2000).p.anim"), "");
// combat long : l'animation tirée démarre tout de suite, et les scènes de fin longues suivent
for (const a of ["redroom", "sweep", "mascot"]) {
  r = lancer(etat(), a);
  assert.deepEqual(r, { scene: a, decision: 1, anim: a }, "combat de 10 s : animation " + a);
  assert.equal(ev("mk('win',2000).dur"), 8.6, "victoire avec animation vue en entier");
  assert.equal(ev("mk('ko',2000).dur"), a === "redroom" ? 9.6 : 8.8, "défaite : le visage de la Red Room allonge la scène");
}
// défaite prévue : même règle
r = lancer(etat({ attaqueBoss: 12 }), "sweep");
assert.deepEqual(r, { scene: "sweep", decision: 1, anim: "sweep" }, "défaite longue (8,3 s) : animation");
r = lancer(etat({ attaqueBoss: 120 }), "sweep");
assert.deepEqual(r, { scene: "fight", decision: -1, anim: "" }, "défaite courte (0,8 s) : pas d'animation");
// seuil : 3 s pile = animation (Norman, 2026-11-03 : au moins 3 secondes à l'écran), juste en dessous = non
assert.equal(lancer(etat({ bossPv: 3000 })).decision, 1);
assert.equal(lancer(etat({ bossPv: 2900 })).decision, -1);
// la décision est prise une seule fois par combat
ev("lire(1020);majAnimation(1020)"); assert.equal(ev("animDecision"), -1);
// prévision inconnue : repli sur l'observation de la barre (1 s d'attente, durée estimée sur la baisse de la vie)
r = lancer(etat({ puissance: undefined }));
assert.deepEqual(r, { scene: "fight", decision: 0, anim: "" }, "prévision inconnue : on attend");
fen.__SOREAL_IDLE_REG__ = { idleEtat: etat({ puissance: undefined, bossPv: 9000 }), formaterPvFixeIdleV1_: formateur };
ev("lire(2100);majAnimation(2100)");
assert.equal(ev("animDecision"), 1, "repli : 10 % de vie perdus en 1,1 s = 11 s estimées : animation");

console.log("idle-borne-prevision-combat-v1: OK");
