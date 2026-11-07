import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/* Norman (2026-11-03) : nouvelle scène de combat de la borne : le garçon au ciré jaune, le bateau en papier, le clown dans l'égout.
 * Victoire : il rattrape le bateau avant la bouche. Défaite : le bateau part avec le clown, l'enfant rampe, se relève avec un bras en moins, le clown l'emporte. */
const src = fs.readFileSync(new URL("../public/modules/borne-led-v1.js", import.meta.url), "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => "fr" }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
const JS = (x) => JSON.parse(JSON.stringify(x));

/* ---------------- indices : rien ne bouge, les deux scènes sont ajoutées à la fin ---------------- */
assert.equal(ev("NUKES.length"), 23);
assert.equal(ev("NUKES[10].name"), "superNuke");
assert.equal(ev("NUKES[12].name"), "chien");

/* branchement dans le jeu */
assert.ok(src.includes("egout:{fn:sEgout,dur:9,prio:0,cap:0.5}") && src.includes("redroom:1,egout:1}"), "scène de combat enregistrée");
assert.ok(src.includes("ANIMS_TIRAGE_V1=['mascot','sweep','redroom','egout','yeuxcb'].filter("), "tirée parmi quatre animations");
assert.ok(src.includes("p.anim==='egout'?KO_EG_DUR") && src.includes("else if(eg)perduEgout(t);") && src.includes("else if(an==='egout')sEgout(t);"), "victoire et défaite branchées");
/* rendu : aucune erreur, quelque chose est dessiné, sur PC et téléphone ; défaite : bouche d'égout, sang, K.O. */
const rendre = (id, p, pct, t, W, H, reduit) => JSON.parse(ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H});P=pn;pn.reduced=${Boolean(reduit)};pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p=${JSON.stringify(p)};S.pv={pct:${pct},cur:'0',max:'0',regen:''};SC['${id}'].fn(${t});
  var sang=indexCouleur([205,10,22]),jaune=indexCouleur([255,214,40]),o={n:0,sang:0,jaune:0},i;for(i=0;i<${W * H};i++)if(pn.v[i]){o.n++;if(pn.c[i]===sang)o.sang++;if(pn.c[i]===jaune)o.jaune++;}P=null;return JSON.stringify(o);})()`));
for (const [W, H] of [[140, 34], [120, 16], [60, 16], [140, 24]]) {
  for (let t = 0; t <= 4; t += 0.1) assert.doesNotThrow(() => rendre("egout", {}, 0.5, t, W, H), "course " + W + "x" + H);
  for (let t = 0; t <= 8.6; t += 0.1) assert.doesNotThrow(() => rendre("win", { anim: "egout", fin: true }, 0, t, W, H), "victoire " + W + "x" + H);
  for (let t = 0; t <= 10.7; t += 0.1) assert.doesNotThrow(() => rendre("ko", { anim: "egout", pc0: 0.4 }, 0.4, t, W, H), "défaite " + W + "x" + H);
  assert.ok(rendre("egout", {}, 1, 1, W, H).jaune > 10, W + "x" + H + " : le garçon en ciré jaune est là");
  assert.ok(rendre("ko", { anim: "egout", pc0: 0.4 }, 0.4, 5.3, W, H).sang > 3, W + "x" + H + " : le clown croque son bras : le sang gicle");
  assert.equal(rendre("ko", { anim: "egout", pc0: 0.4 }, 0.4, 1.0, W, H).sang, 0, W + "x" + H + " : pas de sang avant");
  assert.ok(rendre("ko", { anim: "egout", pc0: 0.4 }, 0.4, 9.0, W, H).jaune === 0, W + "x" + H + " : l'enfant a été emporté dans l'égout");
  assert.ok(rendre("ko", { anim: "egout", pc0: 0.4 }, 0.4, 9.0, W, H).n > 30, W + "x" + H + " : K.O. écrit sur la scène");
  assert.doesNotThrow(() => rendre("ko", { anim: "egout", pc0: 0.4 }, 0.4, 5, W, H, true), "mouvement réduit");
}
/* le garçon gagne du terrain sur le bateau quand la vie du boss baisse : à vie basse il est plus près de la bouche */
const xmin = (pct) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),140,34);P=pn;var G=egGeo();var r=egBoyX(G,${pct});P=null;return r;})()`);
assert.ok(xmin(0.1) < xmin(0.5) && xmin(0.5) < xmin(1), "plus la vie du boss est basse, plus le garçon est près du bateau et de la bouche d'égout");
/* aucun sprite n'a de rangée de largeur différente (sinon des trous) */
for (const nom of ["EG_RUN_A", "EG_RUN_B", "EG_CROUCH", "EG_CRAWL_A", "EG_CRAWL_B", "EG_FRONT", "EG_CLOWN", "EG_CLOWN_GRIN", "EG_BOAT_SPR", "EG_HAND", "EG_LYING", "EG_LYING_SAIN", "EG_CLOWN_BITE"]) {
  const rows = JS(ev(nom)); assert.ok(rows.every((r) => r.length === rows[0].length), nom + " : toutes les rangées ont la même largeur");
}
/* la gueule du clown a plusieurs rangées de dents, et la barrière jaune existe (Norman, 2026-11-03) */
assert.ok(JS(ev("EG_CLOWN_BITE")).join("").split("T").length - 1 > JS(ev("EG_CLOWN")).join("").split("T").length - 1 + 20, "gueule ouverte : bien plus de dents");
assert.ok(src.includes("function egBarriere(G,sec,mode)") && src.includes("egBarriere(G,sec,'pieds');") && src.includes("egBarriere(G,sec,'planche');") && src.includes("rows=EG_CROUCH;yy=egBoyY(G,rows);"), "barrière jaune : le garçon se baisse dessous, la prend dans la tête quand on perd");
for (const [W, H] of [[140, 34], [120, 16]]) {
  const bar = (t) => rendre("ko", { anim: "egout", pc0: 0.8 }, 0.8, t, W, H);
  assert.ok(bar(1.0).n > 20 && bar(1.7).n > 20 && bar(3.0).n > 20 && bar(6.2).n > 20, W + "x" + H + " : course, choc, glissade, entraînement : toujours dessinés");
}
/* pas de nom propre ni de texte ajouté */
const zone = src.slice(src.indexOf("var EG_A="), src.indexOf("function sKO(t)"));
assert.ok(!/\bbob\b|twin|peaks|lynch/i.test(zone), "aucun nom propre");
assert.ok(!/T\('/.test(zone), "aucun texte nouveau (donc aucune traduction)");
console.log("idle-borne-egout-v1: OK");
