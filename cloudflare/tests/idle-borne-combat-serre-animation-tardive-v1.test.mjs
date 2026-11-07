import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-05) : « il y a beaucoup de combats très serrés où l'animation aurait justement été parfaite, et il me met un FIGHT tout le long » : un combat qui dure ENCORE après ANIM_TARDIVE_S secondes bascule sur l'animation
 * tirée au début (clown, tronçonneuse…), même si le clic avait décidé « FIGHT ! » (même boss relancé après une défaite, issue inconnue, durée prévue trop courte). Au clic, rien ne change.
 */
const src = fs.readFileSync(new URL("../public/modules/borne-led-v1.js", import.meta.url), "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => null }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
ev("ANIMS_ACTIVES_V1.mascot=1;ANIMS_ACTIVES_V1.yeuxcb=0;ANIMS_ACTIVES_V1.sweep=1;ANIMS_ACTIVES_V1.redroom=1;ANIMS_ACTIVES_V1.egout=1;ANIMS_ACTIVES_V1.rire=1;ANIMS_TIRAGE_V1=['mascot','sweep','redroom','egout'];");   /* les trois animations sont DÉSACTIVÉES du jeu (2026-11-07, voir ANIMS_ACTIVES_V1) : ce test garde leur code vivant en les réactivant ici */
const formateur = (v) => String(v);
const etat = (extra = {}) => ({ combatBossActif: true, bossSelection: 3, bossVaincus: 2, bossActuel: "Boss", nom: "J", bossPv: 10000, bossPvMax: 10000, pvJoueur: 100, pvJoueurMax: 100, puissance: 1000, defenseBoss: 0, attaqueBoss: 0, defense: 0, regenBoss: 0, ...extra });
/* clic sur Fight sur un NOUVEAU boss (neuf = true, le nom du boss est connu) */
const clic = (e, anim) => {
  fen.__SOREAL_IDLE_REG__ = { idleEtat: e, formaterPvFixeIdleV1_: formateur };
  fen.__SOREAL_IDLE_BORNE_ANIM_FORCEE__ = anim || "mascot";
  ev("cur=null;pend=false;combatAnim='';animChoisie='';animDecision=0;animBossJoue=-1;L.ok=false;");
  ev("lire(1000)");
  assert.ok(ev("S.boss&&!!S.nom"), "le nom du boss est connu : l'ancien code passait par la scène « nom »");
  ev("combatFight(1000,true)");
  return { scene: ev("cur.id"), decision: ev("animDecision"), long: ev("Boolean(cur.p&&cur.p.long)") };
};

const lancer = (e, anim) => { const r = clic(e, anim); fen.__SOREAL_IDLE_REG__ = { idleEtat: e, formaterPvFixeIdleV1_: formateur }; return r; };
const apres = (ms) => { ev("S.combat=true;S.pv=S.pv||{pct:0.9,cur:9,max:10,regen:0};"); ev("majAnimation(" + (1000 + ms) + ")"); return { scene: ev("cur.id"), decision: ev("animDecision"), long: ev("Boolean(cur.p&&cur.p.long)") }; };

/* 1. combat trop court d'après la prévision : FIGHT ! au clic ; s'il dure quand même 5 s, l'animation démarre */
{
  const r = lancer(etat({ bossPv: 1000, bossPvMax: 1000 }), "sweep");
  assert.deepEqual(r, { scene: "fight", decision: -1, long: false }, "au clic : FIGHT ! (rien ne change)");
  assert.deepEqual(apres(4000), { scene: "fight", decision: -1, long: false }, "après 4 s : toujours FIGHT !");
  assert.deepEqual(apres(5000), { scene: "sweep", decision: 2, long: true }, "après 5 s, le combat est serré : l'animation tirée au début démarre");
  assert.equal(ev("combatAnim"), "sweep", "la fin (victoire / défaite) jouera cette animation");
}
/* 2. prévision impossible : le nom s'écrit d'abord, puis FIGHT ! ; observation sans baisse de vie => FIGHT ! ; 5 s plus tard l'animation */
{
  lancer(etat({ puissance: undefined }), "redroom");
  ev("cur=mk('fight',1000);fightT0=1000;combatT0=1000;animDecision=-1;combatAnim='';");
  assert.deepEqual(apres(6000), { scene: "redroom", decision: 2, long: true }, "décision d'observation négative : l'animation démarre quand même si le combat dure");
}
/* 3. même boss relancé après une défaite : FIGHT ! au clic (règle du 03/11), animation après 5 s si le combat est serré */
{
  clic(etat({ attaqueBoss: 12 }), "mascot");
  fen.__SOREAL_IDLE_REG__ = { idleEtat: etat({ bossPv: 9000, bossPvMax: 10000 }), formaterPvFixeIdleV1_: formateur };
  ev("cur=null;pend=false;combatAnim='';animChoisie='';animDecision=0;L.ok=false;lire(2000);");
  ev("combatFight(2000,true)");
  assert.equal(ev("cur.id"), "fight", "2e Fight, même boss : FIGHT ! au clic");
  ev("combatT0=2000;fightT0=2000;");
  ev("S.combat=true;S.pv=S.pv||{pct:0.9,cur:9,max:10,regen:0};");
  ev("majAnimation(5000)");
  assert.equal(ev("cur.id"), "fight", "3 s après : toujours FIGHT !");
  ev("majAnimation(7500)");
  assert.equal(ev("cur.id"), ev("animChoisie"), "5,5 s après : l'animation, même sur le boss relancé");
}
/* 4. jamais deux fois : une animation déjà décidée n'est pas relancée ; et jamais sans combat */
{
  lancer(etat(), "mascot");
  assert.equal(ev("animDecision"), 1);
  ev("majAnimation(900000)");
  assert.equal(ev("animDecision"), 1, "décision déjà prise : inchangée");
  lancer(etat({ bossPv: 1000, bossPvMax: 1000 }), "sweep");
  ev("S.combat=false;");
  ev("majAnimation(900000)");
  assert.equal(ev("cur.id"), "fight", "hors combat : aucune animation tardive");
}
/* 5. SERRÉ MAIS COURT (Norman : « serré qui dure longtemps, puis serré mais court ») : l'animation démarre AU CLIC même pour un combat de moins de 3 s s'il est serré */
{
  const prev = (e) => JSON.parse(ev("JSON.stringify(prevoirCombatBossV1(" + JSON.stringify(e) + "))"));
  const marge = (e) => ev("prevoirCombatBossV1(" + JSON.stringify(e) + ").marge");
  assert.deepEqual(prev(etat({ bossPv: 1000, attaqueBoss: 80 })), { issue: "victoire", secondes: 1 }, "la prévision garde la même forme (la marge est invisible)");
  assert.ok(Math.abs(marge(etat({ bossPv: 1000, attaqueBoss: 80 })) - 0.2) < 1e-9, "victoire de justesse : il reste 20 % de vie au joueur");
  assert.deepEqual(clic(etat({ bossPv: 1000, attaqueBoss: 80 }), "mascot"), { scene: "mascot", decision: 1, long: true }, "victoire de justesse en 1 s : l'animation démarre au clic");
  assert.deepEqual(clic(etat({ bossPv: 2000, attaqueBoss: 55 }), "sweep"), { scene: "sweep", decision: 1, long: true }, "défaite de justesse en 1,8 s : l'animation démarre au clic");
  assert.deepEqual(clic(etat({ bossPv: 1000, attaqueBoss: 10 }), "mascot"), { scene: "fight", decision: -1, long: false }, "court et sans danger (90 % de vie restante) : FIGHT ! comme avant");
  assert.deepEqual(clic(etat({ bossPv: 1000, attaqueBoss: 75 }), "mascot"), { scene: "mascot", decision: 1, long: true }, "seuil : 25 % restants = serré");
  assert.deepEqual(clic(etat({ bossPv: 1000, attaqueBoss: 74 }), "mascot"), { scene: "fight", decision: -1, long: false }, "26 % restants : pas serré");
}
/* 6. même boss relancé après une animation : sans danger = FIGHT ! (règle du 03/11) ; serré = l'animation, même courte */
{
  clic(etat({ attaqueBoss: 12 }), "sweep");
  const relance = (e) => { fen.__SOREAL_IDLE_REG__ = { idleEtat: e, formaterPvFixeIdleV1_: formateur }; ev("cur=null;pend=false;combatAnim='';animChoisie='';animDecision=0;L.ok=false;lire(2000);"); ev("combatFight(2000,true)"); return { scene: ev("cur.id"), decision: ev("animDecision") }; };
  assert.deepEqual(relance(etat({ bossPv: 1000, attaqueBoss: 10 })), { scene: "fight", decision: -1 }, "boss relancé, combat sans danger : FIGHT ! (inchangé)");
  assert.equal(relance(etat({ bossPv: 1000, attaqueBoss: 80 })).decision, 1, "boss relancé, combat serré et court : l'animation démarre");
}
console.log("idle-borne-combat-serre-animation-tardive-v1: OK");
