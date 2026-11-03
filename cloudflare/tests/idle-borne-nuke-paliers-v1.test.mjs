import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Borne d'arcade, écran LED, scène NUKE : l'animation dépend du NOMBRE DE BOSS franchis par ce Nuke (Norman, 2026-11-03).
 *  - paliers (1-2, 3-9, 10-49, 50-199, 200+), scènes réservées aux paliers hauts, jalons (dizaines complètes), scène FINALE (dernier boss atteint) ;
 *  - le nombre vient du moteur (événement soreal-nuke-resultat) : amorce neutre, puis la bonne scène ; jamais de total ni de nom de boss ;
 *  - durée bornée, coût borné, prefers-reduced-motion = image fixe, outils de réglage de la console.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/borne-led-v1.js");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => "fr" }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
const JS = (x) => JSON.parse(JSON.stringify(x));

/* ---------------- paliers : seuils documentés et monotones ---------------- */
assert.deepEqual(JS(ev("NK_SEUILS")), [1, 3, 10, 50, 200], "seuils documentés");
const palier = (n) => ev(`nukePalier(${n})`);
for (const [n, p] of [[1, 0], [2, 0], [3, 1], [9, 1], [10, 2], [49, 2], [50, 3], [199, 3], [200, 4], [301, 4]]) assert.equal(palier(n), p, "n=" + n);
let prec = 0;
for (let n = 1; n <= 400; n++) { const p = palier(n); assert.ok(p >= prec, "palier monotone"); prec = p; }
const tn = JS(ev("NK_TN"));
for (let i = 1; i < tn.length; i++) assert.ok(tn[i] > tn[i - 1], "durée de scène croissante avec le palier");
for (const k of ["NK_SEC", "NK_TREMBLE"]) { const a = JS(ev(k)); for (let i = 1; i < a.length; i++) assert.ok(a[i] >= a[i - 1], k + " croissant"); assert.equal(a[0], 0, "palier 0 : aucun effet ajouté"); }

/* ---------------- jalons : floor(n / 10), durée bornée ---------------- */
for (let n = 0; n <= 400; n++) assert.equal(ev(`nukeDizaines(${n})`), Math.floor(n / 10), "dizaines = floor(n/10)");
assert.equal(ev("nukeDizaines(9)"), 0, "moins de 10 boss : aucun jalon");
assert.equal(ev("nukeJalonDuree(0)"), 0);
let dprec = 0;
for (let d = 1; d <= 30; d++) { const j = ev(`nukeJalonDuree(${d})`); assert.ok(j >= dprec && j <= 2.2 + 1e-9, "durée du jalon croissante, plafonnée à 2,2 s"); dprec = j; }
assert.equal(ev("nukeJalonDuree(30)"), 2.2);

/* ---------------- durée totale bornée (sauf la finale) ---------------- */
let max = 0;
for (let n = 1; n <= 400; n++) { const p = palier(n), d = ev(`nukeDizaines(${n})`), t = ev(`nukeDuree(${p},${d},false)`); max = Math.max(max, t); assert.ok(t >= tn[p] + 1.2, "scène + « +N BOSS »"); }
assert.ok(max <= 7.5 + 1e-9, "durée maximale hors finale : " + max);
assert.ok(ev("nukeDuree(0,0,false)") <= 4.0 + 1e-9 && ev("nukeDuree(0,0,false)") >= 3.9, "palier 0 : ~4 s, comme avant");
const fin = ev("nukeDuree(4,0,true)");
assert.ok(fin >= 8 && fin <= 10, "finale : 8 à 10 s (" + fin + ")");
assert.ok(fin > max, "la finale est la plus longue");
assert.ok(ev("nukeDuree(2,3,false)") > ev("nukeDuree(2,0,false)"), "plus de dizaines = plus de salves = plus long");

/* ---------------- scènes réservées : jamais à un palier plus bas ---------------- */
const reservees = JS(ev("NK_RESERVEES"));
assert.equal(ev("NUKES.length"), 23, "12 de base + le chien + le bombardier + 7 réservées + la finale (indices : 12 chien, 13 bombardier, 14 à 20 réservées, 21 finale) + 1 scène comique (22 : le ballon, ajoutée après la finale)");
assert.equal(ev("NK_FINALE"), 21);
assert.ok(!(21 in reservees), "la finale n'est dans aucun tirage");
const tire = (tier, fois = 600) => { const s = new Set(); for (let i = 0; i < fois; i++) s.add(ev(`nukeVariante(${tier})`)); return [...s].sort((a, b) => a - b); };
for (const tier of [0, 1]) assert.ok(tire(tier).every((v) => (v <= 13 && v !== 10) || v === 22), "palier " + tier + " : les scènes de base (sans SUPER NUKE) et la scène comique");
const t2 = tire(2), t3 = tire(3), t4 = tire(4);
assert.ok(t2.some((v) => v <= 13) && t2.filter((v) => v > 13).length >= 2 && t2.every((v) => v <= 13 || reservees[v] === 2), "palier 2 : base + au moins 2 scènes réservées : " + t2);
assert.ok(tire(2, 3000).every((v) => ![5, 12, 22].includes(v)), "palier 2 : ni chat, ni chien, ni ballon (réservés aux petits Nuke)");
assert.ok([3, 4].every((tier) => tire(tier, 600).every((v) => ![5, 12, 22].includes(v))), "paliers 3 et 4 : jamais le chat, le chien ni le ballon");
assert.ok([0, 1].every((tier) => { const x = tire(tier, 3000); return [5, 12, 22].every((v) => x.includes(v)); }), "paliers 0 et 1 : le chat, le chien et le ballon sortent");
assert.deepEqual(t3, [16, 17, 18], "palier 3 : uniquement ses scènes");
assert.deepEqual(t4, [19, 20], "palier 4 : uniquement ses scènes");
for (const [v, mn] of Object.entries(reservees)) for (const tier of [0, 1, 2, 3, 4]) if (tier < mn) assert.ok(!tire(tier, 300).includes(Number(v)), `scène ${v} jamais au palier ${tier}`);

/* ---------------- le nombre arrive APRÈS le clic : amorce neutre puis la bonne scène ---------------- */
const jouer = (p, t) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,14);P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p=${JSON.stringify(p)};S.vic=5;var o=[];SC.nuke.fn(${t});var n=0;for(var i=0;i<pn.v.length;i++)if(pn.v[i])n++;P=null;return JSON.stringify({p:pn.p,n:n});})()`);
const pas = (p, t) => JSON.parse(jouer(p, t));
ev("nukeRes=null");
let r = pas({ base: 0 }, 0.1);
assert.ok(r.n > 5 && !r.p.res, "pas de réponse : amorce neutre (cadre rouge), pas encore de scène");
const pp = (res, instants) => { fen.__PP__ = { base: 0 }; ev(`nukeRes=${res}`); for (const t of instants) ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,14);P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p=window.__PP__;S.vic=5;SC.nuke.fn(${t});P=null;})()`); return fen.__PP__; };
let q = pp("null", [0.1, 0.5, 1.0, 1.4]);
assert.ok(!q.res, "sans réponse avant 1,5 s : toujours l'amorce");
q = pp("null", [0.1, 1.6]);
assert.ok(q.res && q.n === 5 && q.tier === 1 && q.d === 0, "aucune réponse en 1,5 s : repli sur la différence de l'état (5 ici)");
q = pp("{n:1,dernier:false,at:0}", [0.05]);
assert.ok(!q.res, "réponse reçue mais l'amorce dure au moins 0,2 s");
q = pp("{n:1,dernier:false,at:0}", [0.05, 0.25]);
assert.ok(q.res && q.ts === 0.25 && q.tier === 0, "la scène démarre à la réponse (ts)");
q = pp("{n:5,dernier:false,at:0}", [0.3]);
assert.ok(q.tier === 1 && q.d === 0 && q.n === 5, "5 boss : palier 1, aucun jalon");
q = pp("{n:50,dernier:false,at:0}", [0.3]);
assert.ok(q.tier === 3 && q.d === 5 && !q.fin && q.v >= 16 && q.v <= 18, "50 boss : palier 3, 5 dizaines, scène réservée du palier 3");
q = pp("{n:250,dernier:false,at:0}", [0.3]);
assert.ok(q.tier === 4 && q.d === 25 && !q.fin && (q.v === 19 || q.v === 20), "250 boss : palier 4, 25 dizaines, pas de finale sans dernierBoss");
q = pp("{n:301,dernier:true,at:0}", [0.3]);
assert.ok(q.fin && q.v === 21 && q.d === 0 && Math.abs(q.tn - 8.4) < 1e-9, "dernier boss atteint : la finale, sans jalons");
q = pp("{n:301,dernier:false,at:0}", [0.3]);
assert.ok(!q.fin && q.v !== 21, "301 boss mais le moteur ne dit pas dernierBoss : pas de finale (jamais déduit d'un total côté client)");
q = pp("{n:0,dernier:false,at:0}", [0.3]);
assert.ok(q.annule, "NUKE refusé (0 boss) : la scène est annulée");

/* ---------------- outils de réglage de la console ---------------- */
for (const nom of ["__SOREAL_IDLE_BORNE_NUKE_PALIER_FORCE__", "__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__", "__SOREAL_IDLE_BORNE_NUKE_N_FORCE__", "__SOREAL_IDLE_BORNE_NUKE_FINALE_FORCEE__"]) assert.ok(src.includes(nom), "outil " + nom);
assert.ok(/jouerNuke:function/.test(code), "jouerNuke() lance un Nuke d'essai");
fen.__SOREAL_IDLE_BORNE_NUKE_PALIER_FORCE__ = 3;
q = pp("null", [0.3]);
assert.ok(q.tier === 3 && q.n === 50, "palier forcé 3 : n = seuil du palier (sans tuer de boss, sans réponse du moteur)");
fen.__SOREAL_IDLE_BORNE_NUKE_PALIER_FORCE__ = undefined;
fen.__SOREAL_IDLE_BORNE_NUKE_N_FORCE__ = 120;
q = pp("null", [0.3]);
assert.ok(q.n === 120 && q.d === 12 && q.tier === 3, "n forcé : palier et dizaines calculés");
fen.__SOREAL_IDLE_BORNE_NUKE_N_FORCE__ = undefined;
fen.__SOREAL_IDLE_BORNE_NUKE_FINALE_FORCEE__ = true;
q = pp("null", [0.3]);
assert.ok(q.fin && q.v === 21, "finale forcée");
fen.__SOREAL_IDLE_BORNE_NUKE_FINALE_FORCEE__ = undefined;
assert.ok(!/localStorage\.setItem|setItem\(/.test(code.slice(code.indexOf("var NK_SEUILS"), code.indexOf("function lancerNuke"))), "les outils de réglage ne sont jamais enregistrés");

/* ---------------- ça s'amplifie réellement (points allumés cumulés, même grille) ---------------- */
const activite = (v, n, fin = false) => ev(`(function(){var tot=0,pn,i,t;window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v};for(t=0.1;t<3.4;t+=0.1){pn=new Panel(document.createElement('canvas'),120,14);P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p={essai:1,n:${n},fin:${fin}};SC.nuke.fn(t);for(i=0;i<pn.v.length;i++)if(pn.v[i])tot+=pn.v[i];P=null;}window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;return tot;})()`);
const moy = (vs, n) => vs.reduce((s, v) => s + activite(v, n), 0) / vs.length;
const a0 = moy([0, 2, 4, 8, 9, 12], 1), a2 = moy([14, 15], 25), a4 = moy([19, 20], 250);
assert.ok(a2 > a0 * 1.15 && a4 > a2, `plus de boss = plus de points allumés (palier 0 : ${Math.round(a0)}, 2 : ${Math.round(a2)}, 4 : ${Math.round(a4)})`);

/* ---------------- coût borné : une image du palier max sur la plus grande grille ---------------- */
const grandes = (v, n, fin) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),240,53),t,a,tot=0,mx=0,N=0,d;window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v};for(t=0.05;t<${fin ? 9.5 : 6};t+=0.05){P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=52;pn.p={essai:1,n:${n},fin:${fin}};a=performance_now();SC.nuke.fn(t);d=performance_now()-a;tot+=d;N++;if(d>mx)mx=d;P=null;}window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;return [tot/N,mx];})()`);
c.performance_now = () => Number(process.hrtime.bigint()) / 1e6;
for (const [v, n, f] of [[0, 1, false], [14, 25, false], [16, 120, false], [19, 250, false], [20, 250, false], [21, 301, true]]) {
  const [moyMs, maxMs] = JS(grandes(v, n, f));
  if (process.env.NUKE_PERF) console.log(`scène ${v} : ${moyMs.toFixed(2)} ms moy, ${maxMs.toFixed(1)} max`);
  assert.ok(moyMs < 6&& maxMs < 60, `scène ${v} : coût par image borné (${moyMs.toFixed(2)} ms en moyenne, ${maxMs.toFixed(1)} max, grille 240 x 53)`);
}

/* ---------------- prefers-reduced-motion : image fixe adaptée au palier ---------------- */
const fixe = (n, fin, t) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,14),a=0,i;pn.reduced=true;P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p={essai:1,n:${n},fin:${fin},v:0};SC.nuke.fn(${t});for(i=0;i<pn.v.length;i++)if(pn.v[i])a++;var s=Array.prototype.join.call(pn.v,',');P=null;return JSON.stringify([a,s]);})()`);
const f1 = JSON.parse(fixe(1, false, 0.3)), f1b = JSON.parse(fixe(1, false, 3.1)), f2 = JSON.parse(fixe(25, false, 1)), f4 = JSON.parse(fixe(250, false, 1)), ff = JSON.parse(fixe(301, true, 1));
assert.equal(f1[1], f1b[1], "image fixe : ne dépend pas du temps");
assert.ok(f1[0] > 20 && f2[0] > f1[0] && f4[0] > f2[0] && ff[0] > 20 && ff[1] !== f4[1], "image fixe adaptée au palier (cadres) et à la finale");
assert.ok(/if\(P\.reduced\)\{nukeFixe\(\);return;\}/.test(code), "reduced : aucune animation");

/* ---------------- anti-spoil : aucun total, aucun nom de boss ---------------- */
const zone = code.slice(code.indexOf("function megaNuke"), code.indexOf("function lancerNuke"));
assert.ok(!/bossActuel|S\.nom|nomBoss|S\.num/.test(zone), "aucun nom de boss dans les scènes");
assert.ok(!/\/\s*301|301\s*\)|catalogue|total/i.test(zone), "aucun total dans le code des scènes");
const T2 = JS(ev("TXT"));
for (const k of ["mega", "ultra", "armag", "tous", "tousA", "tousB"]) assert.ok(T2.fr[k] && T2.en[k], "FR et EN : " + k);
assert.ok(!/FIN DU JEU|END OF THE GAME|\d+\s*\/\s*\d+/.test(JSON.stringify(T2)), "aucun texte de total ni de fin révélé");

/* ---------------- câblage : moteur -> page -> panneau ---------------- */
const combat2 = lire("public/modules/ui-combat-2-v1.js");
assert.ok(combat2.includes("new CustomEvent('soreal-nuke-resultat'") && combat2.includes("res.nuke.defeated.length") && combat2.includes("res.nuke.dernierBoss"), "la page envoie le nombre RÉEL de boss tués par ce Nuke et le drapeau dernierBoss");
assert.ok(/soreal-nuke-resultat/.test(code), "le panneau écoute l'événement");
const moteur = lire("src/idle-runtime-combat.js");
assert.ok(/dernierBoss:\s*\(function/.test(moteur) && moteur.includes("bossCatalogueSorealIdle_().length"), "le moteur calcule dernierBoss (CE Nuke a franchi le dernier boss du catalogue) et ne renvoie jamais le total");
const blocNuke = moteur.slice(moteur.indexOf("nuke: {"), moteur.indexOf("joueur: joueur", moteur.indexOf("nuke: {"))).replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/\b(total|taille|size|nombreBoss)\s*:/i.test(blocNuke), "aucun champ de total dans la réponse du Nuke (seulement count, defeated, dernierBoss)");
console.log("idle-borne-nuke-paliers-v1: OK");
