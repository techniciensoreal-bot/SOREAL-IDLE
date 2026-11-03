import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-03) : « quand on clique sur Fight, l'animation doit être jouée tout de suite. Il ne faut pas qu'il y ait encore le nom du boss ou autre chose qui défile. Quand on clique sur Fight, on aura le FIGHT ! si le combat sera trop court
 * pour une scène, mais si pas, ça doit être la scène qui commence tout de suite. » + « avec le bonhomme qui saute, quand il entre dans le château, un peu avant l'image clignote une fois. Enlève ça. »
 * La durée prévue (prevoirCombatBossV1, ANIM_DUREE_MIN_S) décide AU CLIC ; le nom du boss ne passe plus avant la scène ; la victoire prolonge la course du bonhomme sans fondu par le noir.
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
for (const a of ["mascot", "sweep", "redroom"]) {
  assert.deepEqual(clic(etat(), a), { scene: a, decision: 1, long: true }, "combat long : la scène " + a + " démarre au clic, sans nom de boss avant");
}
assert.deepEqual(clic(etat({ attaqueBoss: 12 }), "sweep"), { scene: "sweep", decision: 1, long: true }, "défaite longue : la scène aussi");
assert.deepEqual(clic(etat({ bossPv: 1000, bossPvMax: 1000 })), { scene: "fight", decision: -1, long: false }, "combat trop court : FIGHT ! tout de suite, sans nom de boss");
assert.deepEqual(clic(etat({ attaqueBoss: 120 })), { scene: "fight", decision: -1, long: false }, "défaite trop courte : FIGHT !");
assert.equal(clic(etat({ bossPv: 3000 })).scene, "mascot", "3 s pile : scène");
assert.equal(clic(etat({ bossPv: 2900 })).scene, "fight", "juste en dessous : FIGHT !");
/* prévision impossible : seul cas où le nom du boss s'écrit d'abord (aucune scène connue) */
assert.deepEqual(clic(etat({ puissance: undefined })), { scene: "nom", decision: 0, long: false }, "prévision inconnue : le nom, puis FIGHT !");
/* plus aucune scène « nom » avant une scène prévue */
assert.ok(/var pr=prevoirCombatBossV1\(reg\(\)\.idleEtat\);\s*if\(pr\.issue!=='inconnue'\)\{[\s\S]*?return;\s*\}\s*if\(neuf&&S\.boss&&S\.nom\)\{demarrer\(mk\('nom',now\)\)/.test(code), "la prévision passe AVANT le nom du boss");

/* ---------------- victoire : aucun clignotement avant l'entrée dans le château ---------------- */
assert.ok(/g=\(s\.id==='fight'\|\|\(s\.id==='win'&&s\.p\.anim&&s\.p\.anim!=='redroom'\)\)\?1:/.test(code), "la scène de victoire qui prolonge la course du bonhomme n'a pas de fondu d'entrée (il passait par le noir)");
assert.ok(!/function sMascot[\s\S]*?\n}\n/.test(code) || !/eclair\(/.test(code.slice(code.indexOf("function sMascot"), code.indexOf("function sMascot") + 2600)), "aucun éclair dans la scène du bonhomme");
fen.__SOREAL_IDLE_REG__ = { idleEtat: etat(), formaterPvFixeIdleV1_: formateur };
ev("cur=mk('mascot',1000,{long:true});cur.p.tArr=5;cur.p.te=2;combatAnim='mascot';");
const t0 = ev("cur.t0");
const w = JSON.parse(ev("JSON.stringify(mk('win','" + (t0 + 4000) + "'*1).p)"));
assert.equal(w.tg0, 5, "le sol et les étoiles restent figés là où ils étaient");
assert.ok(Math.abs(w.te0 - ((t0 + 4000 - t0) / 1000 - 2)) < 1e-9, "le bonhomme et les feux d'artifice reprennent au même instant (te0 = " + w.te0 + ")");
// la scène de victoire, à t = 0, dessine EXACTEMENT ce que la course dessinait juste avant (même sol, mêmes étoiles, même bonhomme)
{
  ev("S.pv={pct:0,cur:0,max:1,regen:0}");
  const lp = { long: true, tArr: null, te: null };
  const code2 = (t, p) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,16),p=${JSON.stringify(p)};P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=15;pn.YM=16;pn.p=p;S.pv={pct:0,cur:0,max:1,regen:0};sMascot(${t});var s=[],i;for(i=0;i<pn.v.length;i++)if(pn.v[i]>=250)s.push(i+':'+pn.c[i]);P=null;return s.join(',')+'#'+JSON.stringify(p);})()`);
  const avant = code2(9.0, { ...lp, tArr: 8.4, te: 8.4 });          // 0,6 s après l'arrivée, vie à 0 : le bonhomme est en train de marcher vers la porte
  const pAv = JSON.parse(avant.split("#")[1]);
  const suite = code2(0, { anim: "mascot", fin: true, tg0: 8.4, te0: 0.6 });   // victoire arrivée à cet instant
  assert.ok(avant.split("#")[0].length > 20, "le château et le bonhomme sont dessinés");
  assert.equal(avant.split("#")[0], suite.split("#")[0], "même image juste avant et juste après le passage à la scène de victoire");
  assert.equal(pAv.tArr, 8.4);
}
console.log("idle-borne-fight-scene-immediate-v1: OK");

/* ---------------- Norman (2026-11-03) : « quand une animation se joue, par exemple Leatherface, et qu'on perd, elle ne doit pas se relancer quand on refait Fight : l'ennemi n'a presque plus de vie et ça nous révèle l'animation de victoire » ---------------- */
{
  const e1 = etat({ attaqueBoss: 12 });                       // défaite longue : la scène démarre
  assert.deepEqual(clic(e1, "sweep"), { scene: "sweep", decision: 1, long: true }, "1er Fight : l'animation de la défaite démarre");
  assert.equal(ev("animBossJoue"), ev("S.num"), "le boss est noté : animation déjà jouée");
  // on perd, on refait Fight sur le MÊME boss (il n'a presque plus de vie : la victoire serait prévue longue) : jamais rejouée
  fen.__SOREAL_IDLE_REG__ = { idleEtat: etat({ bossPv: 9000, bossPvMax: 10000 }), formaterPvFixeIdleV1_: formateur };
  ev("cur=null;pend=false;combatAnim='';animChoisie='';animDecision=0;L.ok=false;lire(2000);");
  ev("combatFight(2000,true)");
  assert.deepEqual({ scene: ev("cur.id"), decision: ev("animDecision"), long: ev("Boolean(cur.p&&cur.p.long)") }, { scene: "fight", decision: -1, long: false }, "2e Fight sur le même boss : FIGHT ! seulement, aucune animation");
  // un AUTRE boss libère l'animation
  fen.__SOREAL_IDLE_REG__ = { idleEtat: etat({ bossSelection: 4, attaqueBoss: 12 }), formaterPvFixeIdleV1_: formateur };
  fen.__SOREAL_IDLE_BORNE_ANIM_FORCEE__ = "mascot";
  ev("cur=null;pend=false;combatAnim='';animChoisie='';animDecision=0;L.ok=false;lire(3000);");
  ev("combatFight(3000,true)");
  assert.equal(ev("cur.id"), "mascot", "boss suivant : l'animation est de nouveau possible");
}
console.log("idle-borne-fight-scene-immediate-v1 (pas de rejeu après défaite): OK");
