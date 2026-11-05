import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-05) : « de temps en temps, la borne a des YEUX sur son écran LED, pleins d'expressions (heureux, tristes, suspects, gauche, droite…) ; ça se déclenche quand on n'a pas cliqué depuis quelques secondes, sur la page Fight Boss. »
 * La scène est une fonction pure du temps ; elle s'arrête au clic et cède la place au combat.
 */
const src = fs.readFileSync(new URL("../public/modules/borne-led-v1.js", import.meta.url), "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => null }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(fs.readFileSync(new URL("../public/modules/borne-yeux-v1.js", import.meta.url), "utf8"), c);
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
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

const lit = (t, p, W = 120, H = 14, reduit = false) => Number(ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H},true);P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p=${JSON.stringify(p)};pn.reduced=${reduit};yeuxMod().scene(${t});var n=0,i;for(i=0;i<pn.v.length;i++)if(pn.v[i]>0)n++;return n;})()`));
const EXPR = ["neutre", "gauche", "droite", "alalter", "haut", "content", "triste", "soupcon", "surpris", "endormi", "colere", "clin"];
/* 1. chaque expression se dessine (des points allumés, jamais d'erreur), en grille PC et téléphone, à tout instant */
for (const [W, H] of [[120, 14], [90, 12]]) for (const e of EXPR) for (const t of [0.3, 1.5, 2.2, 3, 3.9, 5]) {
  const n = lit(t, { seq: ["neutre", e, "neutre"], dur: 5 }, W, H);
  assert.ok(n > 8 && n < W * H / 2, e + " " + W + "x" + H + " t=" + t + " : " + n + " points allumés");
}
/* 2. animation réduite : yeux ouverts et FIXES (même dessin à tout instant) */
assert.equal(lit(0.3, { seq: ["neutre", "colere", "neutre"], dur: 5 }, 120, 14, true), lit(3.3, { seq: ["neutre", "colere", "neutre"], dur: 5 }, 120, 14, true), "animation réduite : aucun mouvement");
/* 3. le tirage : au moins 3 expressions différentes, commence et finit par les yeux neutres, durée cohérente */
for (let i = 0; i < 40; i++) {
  const p = JSON.parse(ev("JSON.stringify(yeuxMod().params())"));
  assert.equal(p.seq[0], "neutre"); assert.equal(p.seq[p.seq.length - 1], "neutre");
  const vraies = p.seq.filter((x) => x !== "neutre");
  assert.ok(vraies.length >= 3 && new Set(vraies).size === vraies.length, "expressions toutes différentes : " + p.seq.join(","));
  assert.ok(p.dur > 5 && p.dur < 14, "durée " + p.dur);
  assert.ok(vraies.every((x) => EXPR.includes(x)));
}
/* 4. déclenchement : inactivité d'au moins 6 s, jamais en combat, pas deux fois de suite */
ev("L.ok=false;S.combat=false;yeuxMod().regler(1000,0);");
assert.equal(ev("yeuxMod().du(6999,S.combat)"), false, "6 s moins 1 ms après le dernier clic : non");
assert.equal(ev("yeuxMod().du(7000,S.combat)"), true, "6 s d'inactivité : oui");
ev("S.combat=true;"); assert.equal(ev("yeuxMod().du(60000,S.combat)"), false, "jamais pendant un combat");
ev("S.combat=false;");
assert.equal(ev("suivante(8000).id"), "yeux", "la rotation propose les yeux après l'inactivité");
const apres = Number(ev("yeuxMod().yeuxAt()"));
assert.ok(apres >= 8000 + 22000 && apres <= 8000 + 48000, "pause de 22 à 48 s avant la suivante : " + (apres - 8000));
assert.notEqual(ev("suivante(9000).id"), "yeux", "pas deux fois de suite");
assert.equal(ev("suivante(" + (apres + 1) + ").id"), "yeux", "de nouveau possible après la pause");
/* 5. un clic arrête les yeux ; un combat les interrompt tout de suite */
ev("S.combat=false;yeuxMod().regler(1000,0);cur=mk('yeux',8000,yeuxMod().params());");
ev("yeuxMod().regler(8500,0);lire(8600);");
assert.ok(code.includes("else if(cur.id==='yeux'&&yeuxMod()&&yeuxMod().clic()>cur.t0)demarrer(suivante(now));"), "le clic arrête les yeux (image)");
assert.ok(code.includes("S.combat&&(cur.id==='base'||cur.id==='score'||cur.id==='yeux'||"), "un combat qui commence pendant les yeux lance FIGHT ! tout de suite");
const mod = fs.readFileSync(new URL("../public/modules/borne-yeux-v1.js", import.meta.url), "utf8");
assert.ok(mod.includes("window.addEventListener('pointerdown',f,true)")&&mod.includes("window.addEventListener('keydown',f,true)")&&mod.includes("window.addEventListener('touchstart',f,true)"), "un clic, une touche ou un toucher comptent comme activité");
assert.ok(code.includes("yeux:{fn:function(t){var Y=yeuxMod();if(Y)Y.scene(t);},dur:function(p){return p.dur||6;},prio:0,cap:1.0}"), "les yeux sont de priorité 0 : tout événement du jeu passe devant");
console.log("idle-borne-yeux-v1: OK");
