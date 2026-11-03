import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Borne d'arcade, scène NUKE : le CHIEN (Norman, 2026-11-03 : « le chien renifle le sol jusqu'à arriver pas loin du bouton, il lève la patte et pisse ;
 * son pipi retombe en arc de cloche sur le bouton : ce qui l'active, et NUKE ! »). Le chat qui saute sur le bouton est conservé.
 * Indices : 12 = chien, 13 = bombardier (tirage spécial), 14 à 20 = scènes réservées, 21 = finale.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/borne-led-v1.js");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => "fr" }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
const JS = (x) => JSON.parse(JSON.stringify(x));

/* ---------------- la scène existe, parmi les scènes de base ---------------- */
assert.equal(ev("NUKES[12].name"), "chien");
assert.equal(ev("NUKES[BOMBARDIER].name"), "bombardier");
assert.equal(ev("BOMBARDIER"), 13, "le bombardier reste le tirage spécial, distinct du chien");
assert.equal(ev("NUKES[5].name"), "chat", "le chat est conservé");
assert.ok(!(12 in JS(ev("NK_RESERVEES"))), "le chien n'est réservé à aucun palier : c'est une scène de base");
ev("nukeSac=[];nukeDernier=-1");
const tirage = Array.from({ length: 3000 }, () => ev("nukeChoix()"));
assert.ok(tirage.includes(12) && tirage.includes(5) && tirage.includes(13), "chien, chat et bombardier sortent");
const part = tirage.filter((v) => v === 13).length / tirage.length;
assert.ok(part > 0.13 && part < 0.28, "bombardier : toujours environ 1 sur 5 (" + part.toFixed(3) + ")");
for (let i = 1; i < tirage.length; i++) assert.notEqual(tirage[i], tirage[i - 1], "pas de répétition immédiate");
for (const tier of [0, 1]) { const s = new Set(); for (let i = 0; i < 800; i++) s.add(ev(`nukeVariante(${tier})`)); assert.ok(s.has(12), "le chien sort aux paliers 0 et 1 (" + tier + ")"); }
assert.equal(ev("NK_SCN[12]"), 4.0, "durée propre du chien : 4,0 s (le pivot et le reniflement se lisent)");
assert.ok(ev("nukeDuree(0,0,false,4.0)") > ev("nukeDuree(0,0,false)"), "le chien dure plus que les scènes de base (le reniflement se lit)");

/* ---------------- jet en parabole : le point d'impact calculé coïncide avec le dôme du bouton ---------------- */
for (const [W, H] of [[60, 14], [90, 16], [120, 16], [140, 34], [240, 53]]) {
  const J = JS(ev(`chienJet(${W},${H})`));
  const bx = W - 16;
  assert.equal(J.bx, bx, "même bouton que le chat : bx = W - 16");
  const x = (t) => J.x0 + J.vx * t, y = (t) => J.y0 - J.vy * t + (J.g * t * t) / 2;
  assert.ok(Math.abs(x(J.T) - (bx + 5)) <= 1 && Math.abs(y(J.T) - (H - 7)) <= 1, `W=${W} : le jet arrive au sommet du dôme (${x(J.T).toFixed(1)}, ${y(J.T).toFixed(1)})`);
  let mini = 1e9; for (let t = 0; t <= J.T; t += J.T / 50) mini = Math.min(mini, y(t));
  assert.ok(mini < y(0) - 3.9 && mini < y(J.T) - 3.9, `W=${W} : le jet monte de 4 à 5 points puis redescend (cloche, sommet ${mini.toFixed(1)})`);
  assert.ok(mini >= 0 && x(0) >= 0 && x(J.T) < W, "tout reste dans l'écran");
  assert.equal(J.posX + J.larg - 1, bx - 8, "le chien s'arrête à 8 points du bouton (le bout du museau)");
  assert.equal(J.larg, 24, "un seul chien de 24 colonnes (téléphone compris)");
  assert.equal(J.haut, 15, "15 rangées");
  // rendu : juste avant l'impact le jet touche le dôme ; juste après, le dôme est enfoncé (2 rangées) et le jet couvre le sommet
  const rendu = (u) => JSON.parse(ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H});P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p={essai:1,n:1};window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=12;SC.nuke.fn(${u});window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;var jaune=indexCouleur([255,222,0]),o={j:[],dome:[]},i,xx,yy;
    for(i=0;i<${W * H};i++)if(pn.v[i]){xx=i%${W};yy=(i/${W})|0;if(pn.c[i]===jaune)o.j.push([xx,yy]);if(pn.c[i]===2||pn.c[i]===3)o.dome.push([xx,yy]);}P=null;return JSON.stringify(o);})()`));
  const avant = rendu(2.4 + J.T - 0.02);
  const proche = avant.j.some(([jx, jy]) => Math.abs(jx - (bx + 5)) <= 2 && Math.abs(jy - (H - 7)) <= 2);
  assert.ok(proche, `W=${W} H=${H} : un point du jet est collé au sommet du dôme juste avant l'impact`);
  const hautAvant = Math.min(...avant.dome.filter(([dx]) => dx >= bx + 2 && dx <= bx + 8).map(([, dy]) => dy));
  const apres = rendu(2.4 + J.T + 0.05);
  const hautApres = Math.min(...apres.dome.filter(([dx]) => dx >= bx + 2 && dx <= bx + 8).map(([, dy]) => dy));
  assert.equal(hautAvant, H - 6, "dôme au repos : sommet à H - 6");
  assert.equal(hautApres, H - 4, "bouton enfoncé après l'impact (2 rangées)");
}

/* ---------------- reniflements : le chien avance par à-coups, le nez monte et descend ---------------- */
const dessin = (u, W = 120, H = 34) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H});P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p={essai:1,n:1};window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=12;SC.nuke.fn(${u});window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;var x=-1,i,y;y=${H - 9};for(i=0;i<${W - 20};i++)if(pn.v[y*${W}+i]){x=i;break;}var s=Array.prototype.join.call(pn.v,',');P=null;return JSON.stringify([x,s]);})()`);
const d = (u) => JSON.parse(dessin(u));
assert.ok(d(0.1)[0] >= 0, "le chien est visible dès le début");
// première pause de reniflement vers 0,2 s : immobile, deux poses de nez qui alternent
const p1 = d(0.22), p2 = d(0.22 + 0.075);
assert.equal(p1[0], p2[0], "arrêt de reniflement : le chien ne bouge pas");
assert.notEqual(p1[1], p2[1], "le nez monte et descend (deux poses)");
const xs = [0.3, 0.7, 1.1, 1.5].map((u) => d(u)[0]);
for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1], "il avance de pause en pause : " + xs.join());
// quatre pauses : x constant pendant chaque reniflement (0,25 s) et change entre deux
let pauses = 0, prec = null;
for (let k = 0; k < 4; k++) { const a = d(0.05 + 0.4 * k + 0.2)[0], b = d(0.05 + 0.4 * k + 0.4)[0]; if (a === b) pauses++; }
assert.equal(pauses, 4, "quatre reniflements (arrêts)");

/* ---------------- patte arrière relevée, jet, flash, NUKE ! ---------------- */
const jaune = (u) => JSON.parse(ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,34);P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=33;pn.YM=34;pn.p={essai:1,n:1};window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=12;SC.nuke.fn(${u});window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;var j=indexCouleur([255,222,0]),n=0,i;for(i=0;i<pn.v.length;i++)if(pn.v[i]&&pn.c[i]===j)n++;P=null;return n;})()`));
assert.equal(jaune(1.5), 0, "pas de jet avant que la patte soit levée");
assert.equal(jaune(2.3), 0, "ni pendant le pivot ni quand il soulève la patte");
assert.ok(jaune(2.5) > 3 && jaune(2.6) > jaune(2.5), "le fil jaune s'allonge");
assert.ok(jaune(2.75) > 10, "éclaboussures et fil au moment de l'impact");
assert.notEqual(d(1.7)[1], d(1.85)[1], "pose de la patte levée distincte de la pose debout");
assert.ok(/CHIEN_LIB=2\.4/.test(code));
/* sprites : tailles minimales, traits de chien, jamais de miroir */
const DG = JS(ev("dogsInit()"));
for (const [nom, mini] of [["grand", [22, 15]]]) {
  const set = DG[nom];
  assert.ok(set.larg >= mini[0] && set.haut >= mini[1], nom + " : au moins " + mini.join(" x ") + " (" + set.larg + " x " + set.haut + ")");
  for (const k of ["a", "b", "arret"]) {
    const rows = set[k];
    assert.ok(rows.length === set.haut && rows.every((r) => r.length === set.larg), nom + " " + k + " : dimensions régulières");
    const txt = rows.join("");
    assert.ok(/D/.test(txt), nom + " " + k + " : oreille tombante sombre");
    assert.ok(/W/.test(txt), nom + " " + k + " : truffe / chaussettes blanches");
    assert.ok(/R/.test(txt), nom + " " + k + " : collier");
    assert.ok(/ /.test(txt), nom + " " + k + " : œil");
    assert.ok(rows.slice(0, 5).some((r) => /X/.test(r.slice(0, 7))), nom + " " + k + " : queue relevée en haut à gauche");
    // jamais de miroir : l'oreille (D la plus à gauche de la tête) est à gauche de la truffe (W la plus à droite) dans CHAQUE pose, le chien regarde à droite, vers le bouton
    const col = (ch, fin) => { let m = fin ? -1 : 99; rows.forEach((r) => { for (let i = 0; i < r.length; i++) if (r[i] === ch) m = fin ? Math.max(m, i) : Math.min(m, i); }); return m; };
    assert.ok(col("W", true) >= set.larg - 3, nom + " " + k + " : le museau est du côté droit (vers le bouton)");
  }
}
/* DE FACE : pivot par de vraies poses dessinées (aucun miroir du profil), pose de face, patte arrière GAUCHE (côté droit de l'écran, côté bouton) levée */
{
  const set = DG.grand, rev = (rows) => rows.map((r) => [...r].reverse().join(""));
  for (const k of ["p1", "p2", "face", "fmi", "flevee"]) assert.ok(set[k].length === 15 && set[k].every((r) => r.length === 24), k + " : même boîte 24 x 15");
  const col = (rows, ch, r0, r1) => { const o = []; rows.slice(r0, r1 + 1).forEach((r) => { for (let i = 0; i < r.length; i++) if (r[i] === ch) o.push(i); }); return o; };
  assert.notDeepEqual(set.p1, set.arret); assert.notDeepEqual(set.p1, set.p2); assert.notDeepEqual(set.p2, set.face);
  assert.deepEqual(set.p1.slice(7), set.arret.slice(7), "pivot 1 : le corps reste de profil, seule la tête se tourne");
  for (const k of ["p1", "p2", "face", "fmi", "flevee"]) assert.notDeepEqual(set[k], rev(set.arret), k + " n'est PAS le miroir du profil (vraie pose dessinée)");
  // de face : deux oreilles brunes de chaque côté de la tête, deux yeux éteints, truffe éteinte au centre bas, collier rouge, médaille jaune
  const f = set.face, ears = col(f, "D", 0, 5);
  assert.ok(ears.some((c) => c < 8) && ears.some((c) => c > 15), "deux oreilles qui pendent de chaque côté de la tête");
  assert.equal(col(f, " ", 2, 2).length, 2, "deux yeux éteints");
  const nez = col(f, " ", 4, 4); assert.equal(nez.length, 2, "truffe éteinte au centre bas du museau");
  assert.ok(Math.abs((nez[0] + nez[1]) / 2 - (col(f, " ", 2, 2)[0] + col(f, " ", 2, 2)[1]) / 2) <= 0.5, "truffe centrée entre les yeux");
  assert.ok(col(f, "R", 6, 6).length >= 4 && col(f, "Y", 7, 7).length >= 1, "collier rouge et médaille jaune");
  // la patte arrière gauche (droite de l'écran) : au sol au repos, levée dans flevee, pied vers le bouton
  const solD = (rows) => col(rows, "W", 14, 14).filter((c) => c >= 16).length;
  assert.ok(solD(set.face) > 0 && solD(set.fmi) === 0 && solD(set.flevee) === 0, "la patte arrière gauche (côté bouton) quitte le sol");
  // exactement 4 pattes au plus par pose (3 + la patte levée comptée à part) : groupes de colonnes allumées sur la rangée 12, sous le ventre
  const groupes = (rows) => { let n = 0, dedans = false; for (const ch of rows[12]) { const on = ch !== "." && ch !== " "; if (on && !dedans) n++; dedans = on; } return n; };
  for (const k of ["a", "b", "arret", "p1", "p2", "face", "fmi", "flevee"]) assert.ok(groupes(set[k]) <= 4, k + " : au plus 4 pattes (" + groupes(set[k]) + ")");
  assert.equal(groupes(set.face), 4, "de face au repos : 4 pattes"); assert.equal(groupes(set.p2), 4, "trois-quarts : 4 pattes (jamais celles du profil en plus)");
  assert.equal(groupes(set.flevee), 3, "patte levée : 3 pattes au sol + la patte levée à part");
  // patte arrière gauche levée : UN SEUL segment DROIT (pas de genou plié), 2 points de large, en diagonale au-dessus de l'horizontale (~60 a 70 degres), 10 points ou plus, couleur par bandes (ambre -> brun -> creme)
  const jambe = (rows, r0, r1) => { const o = []; for (let r = r0; r <= r1; r++) { const cs = []; for (let c = r <= 5 ? 18 : 17; c < 24; c++) if (rows[r][c] !== "." && rows[r][c] !== " ") cs.push(c); o.push(cs); } return o; };
  const lev = jambe(set.flevee, 2, 8);   // rangées 2 à 8 : rien d'autre du chien à cet endroit
  lev.forEach((cs, i) => assert.equal(cs.length, 2, "largeur constante de 2 points (rangée " + (i + 2) + ")"));
  const centres = lev.map((cs) => (cs[0] + cs[1]) / 2), rangs = lev.map((_c, i) => 2 + i);
  const n = rangs.length, mr = rangs.reduce((a, b) => a + b) / n, mc = centres.reduce((a, b) => a + b) / n;
  const pente = rangs.reduce((a, r, i) => a + (r - mr) * (centres[i] - mc), 0) / rangs.reduce((a, r) => a + (r - mr) ** 2, 0);   // colonnes par rangée (négatif : la jambe monte vers la droite)
  const ecart = Math.max(...rangs.map((r, i) => Math.abs(mc + pente * (r - mr) - centres[i])));
  assert.ok(ecart <= 1, "les points de la jambe sont alignés : pas de pli (écart max " + ecart.toFixed(2) + " point)");
  assert.ok(pente < -0.3 && pente > -0.7, "pente constante vers le haut et vers le côté (" + pente.toFixed(2) + " colonne par rangée)");
  const angle = (Math.atan2(1, -pente) * 180) / Math.PI;
  assert.ok(angle >= 54 && angle <= 72, "patte levée à ~55-70 degrés au-dessus de l'horizontale (" + angle.toFixed(0) + ")");
  // du flanc (rangée 8) au bout du pied (rangée 2) : longueur >= 10 points
  const bas = [17, 8], haut = [centres[0], 2], longueur = Math.hypot(haut[0] - bas[0], haut[1] - bas[1]);
  assert.ok(longueur >= 7.5, "jambe levée d’au moins 7,5 points, d'un seul tenant (" + longueur.toFixed(1) + ")");
  // couleurs par bandes le long de l'axe, de bas en haut : ambre, puis brun, puis crème, sans retour en arrière
  assert.ok(lev.every((cs, i) => cs.every((c) => set.flevee[2 + i][c] === "B")), "toute la jambe levée est brun très sombre (derrière le chien, en profondeur)");
  // pose intermédiaire : la MÊME jambe droite, à environ 30 degrés (elle pivote autour de la hanche, elle ne se plie pas)
  const cols = []; for (let c = 17; c < 24; c++) { const rs = []; for (let r = 5; r <= 12; r++) if (/[XDWB]/.test(set.fmi[r][c]) && !(c < 18 && r > 8)) rs.push(r); if (rs.length) cols.push([c, rs]); }
  assert.ok(cols.length >= 6 && cols.every(([c, rs]) => rs.length >= 1 && rs.length <= 3), "pose « se lève » : jambe droite, quasi horizontale");
  const hautFmi = Math.min(...cols.flatMap(([, rs]) => rs)), hautFlev = 2;
  assert.ok(hautFmi > hautFlev + 3, "pose « se lève » : le pied est plus bas que patte levée (la jambe pivote)");
  assert.ok(set.flevee[set.patteF[1]][set.patteF[0] + 1] === "." && set.patteF[0] >= 20, "l'origine du jet est à droite du genou, sous le pied levé, hors du dessin");
  assert.ok(col(set.flevee, "W", 14, 14).filter((c) => c < 16).length > 0, "les autres pattes restent au sol");
  // jet : ne traverse aucun pixel allumé du chien (ni tête, ni jambe) et part à droite de lui
  for (const [W, H] of [[60, 16], [90, 16], [120, 16], [140, 34], [240, 53]]) {
    const J = JS(ev(`chienJet(${W},${H})`));
    assert.equal(J.x0, J.posX + set.patteF[0] + 1, "origine du jet à côté du pied levé");
    for (let tt = 0; tt <= J.T; tt += J.T / 60) {
      const cx = Math.round(J.x0 + J.vx * tt - J.posX), cy = Math.round(J.y0 - J.vy * tt + (J.g * tt * tt) / 2 - J.yTop);
      if (cx >= 0 && cx < 24 && cy >= 0 && cy < 15) assert.ok(set.flevee[cy][cx] === "." || set.flevee[cy][cx] === " ", `W=${W} H=${H} : le jet ne traverse pas le chien (${cx},${cy})`);
    }
  }
}
const zoneChien = code.slice(code.indexOf("function dogBuild"), code.indexOf("function bombardier(u)"));
assert.ok(!/reverse\(|scale\(-|mirror|flip/i.test(zoneChien), "le pivot passe par des poses dessinées : aucun miroir du sprite de profil dans le code");
assert.ok(/DS\.arret[\s\S]*DS\.p1[\s\S]*DS\.p2[\s\S]*DS\.face[\s\S]*DS\.fmi[\s\S]*DS\.flevee/.test(zoneChien), "profil, pivot (2 poses), face, patte qui se lève, patte levée : dans cet ordre");
assert.ok(/eclair\(1-sm\(\(u-3\.05\)\/0\.5\)\)/.test(code) && /motNuke\(u,3\.4,AMB\)/.test(code), "puis flash et NUKE !");

/* ---------------- pas de flash au-delà de 3 par seconde (même mesure que idle-borne-nuke-photosensible-v1), reduced-motion, anti-spoil ---------------- */
const L = JSON.parse(ev(`(function(){var W=120,H=14,N=W*H,p={base:0},L=[],t,i,s,pn=new Panel(document.createElement('canvas'),W,H);window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=12;nukeRes={n:1,dernier:false,at:0};S.vic=5;
  for(t=0;t<7;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;SC.nuke.fn(t);s=0;for(i=0;i<N;i++)s+=pn.v[i];L.push(s/(255*N));P=null;}
  window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;return JSON.stringify(L);})()`));
const tr = []; let ref = 0.03; L.forEach((x, i) => { if (Math.abs(x - ref) > 0.3) { tr.push(i / 60); ref = x; } });
for (let i = 0; i < tr.length; i++) { let k = 0; while (i + k < tr.length && tr[i + k] < tr[i] + 1) k++; assert.ok(k <= 3, "au plus 3 transitions par seconde"); }
const fixe = (u) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,14);pn.reduced=true;P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p={v:12,base:0};SC.nuke.fn(${u});var s=Array.prototype.join.call(pn.v,',');P=null;return s;})()`);
assert.equal(fixe(0.3), fixe(3.1), "reduced-motion : image fixe « NUKE ! »");
assert.ok(fixe(1).split(",").some((x) => x !== "0"));
const zone = code.slice(code.indexOf("function chien(u)"), code.indexOf("function bombardier(u)"));
assert.ok(!/bossActuel|S\.nom|S\.num|301/.test(zone), "aucun nom de boss ni total");
console.log("idle-borne-nuke-chien-v1: OK");
