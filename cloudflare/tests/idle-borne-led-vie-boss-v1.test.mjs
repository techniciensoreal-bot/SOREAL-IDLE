import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-01) : « ALLONGER cet écran arcade et y INTÉGRER la barre de vie du boss », puis « en ÉCRAN DE JEU quoi » : la vie du boss est DESSINÉE sur le panneau LED (cœur à gauche, jauge de segments,
 * « PV / PV max » centré en police LED, « +régénération/s » en vert à droite sous la jauge), mêmes données que l'ancienne barre (bossPv, bossPvMax, regenBoss ; formatage formaterPvFixeIdleV1_),
 * même couleur (palette du boss : paletteBarreBossIdleV1_) ; l'ancienne barre reste dans la page, masquée (mêmes ids). Les scènes occupent le haut, la vie du boss est toujours en bas.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/borne-led-v1.js");
const combat2 = lire("public/modules/ui-combat-2-v1.js");
const css = lire("public/soreal-idle-borne-led-v1.css");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => null }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);

/* formatage identique à l'ancienne barre : on prend le vrai formateur du client */
const aventure = lire("public/modules/ui-aventure-1-v1.js");
const debut = aventure.indexOf("function formaterPvFixeIdleV1_(valeur){");
const formateur = new Function("idleNombre_", aventure.slice(debut, aventure.indexOf("\n      }\n", debut) + 8).replace(/^\s*function formaterPvFixeIdleV1_/, "return function formaterPvFixeIdleV1_"))((v) => Number(v) || 0);
assert.equal(formateur(65e6), "65.00M");
assert.equal(formateur(1000), "1.00K");

// couleur : la palette du boss (même fonction que la barre d'origine : teinte = numéro x 137,508)
const combat1 = lire("public/modules/ui-combat-1-v1.js");
const pal = new Function(combat1.slice(combat1.indexOf("function paletteBarreBossIdleV1_(n){"), combat1.indexOf("function styleCouleurBarreBossIdleV1_(n){")) + "\nreturn paletteBarreBossIdleV1_;")();
const style = (n) => { const p = pal(n); return "--bc-a:" + p.a + ";--bc-b:" + p.b + ";--bc-c:" + p.c + ";"; };
const etat = (extra = {}) => ({ bossSelection: 3, bossId: 3, bossActuel: "X", bossPv: 65e6, bossPvMax: 65e6, regenBoss: 1000, pvJoueur: 10, pvJoueurMax: 10, ...extra });
const REG = (e, extra = {}) => { fen.__SOREAL_IDLE_REG__ = { idleEtat: e, formaterPvFixeIdleV1_: formateur, styleCouleurBarreBossIdleV1_: style, ...extra }; };

// lecture : mêmes champs, mêmes chaînes
REG(etat());
ev("lire(1000)");
let pv = JSON.parse(ev("JSON.stringify(S.pv)"));
assert.deepEqual(pv, { pct: 1, cur: "65.00M", max: "65.00M", regen: "+1.00K/s" }, "PV / PV max / régénération comme « ❤️ 65.00M / 65.00M » et « +1.00K/s »");
REG(etat({ bossPv: 16.25e6 })); ev("lire(1100)");
assert.equal(JSON.parse(ev("JSON.stringify(S.pv)")).pct, 0.25, "pourcentage = bossPv / bossPvMax (même calcul que la largeur de l'ancienne barre)");
assert.equal(JSON.parse(ev("JSON.stringify(S.pv)")).cur, "16.25M");
// régénération : seulement si le boss vit et régénère (même condition que bossEnRegenV174)
REG(etat({ regenBoss: 0 })); ev("lire(1200)"); assert.equal(JSON.parse(ev("JSON.stringify(S.pv)")).regen, "");
REG(etat({ bossPv: 0 })); ev("lire(1300)"); assert.equal(JSON.parse(ev("JSON.stringify(S.pv)")).regen, "", "boss à 0 PV : pas de régénération affichée");
// règle n°2 : boss inconnu = aucune vie affichée
REG(etat({ bossActuel: "" })); ev("lire(1400)"); assert.equal(ev("S.pv"), null, "boss inconnu : rien");
REG(etat({ bossPvMax: 0 })); ev("lire(1500)"); assert.equal(ev("S.pv"), null, "PV max inconnus : rien");
REG(etat(), { formaterPvFixeIdleV1_: undefined }); ev("lire(1600)"); assert.equal(ev("S.pv"), null, "sans formateur : jamais de nombre inventé");

// couleur de la jauge = celle de la barre de CE boss ; change avec le boss
REG(etat({ bossId: 3 })); ev("lire(2000)");
const hue = (n) => Number(/hsl\((\d+),/.exec(pal(n).b)[1]);
const attendu = (n) => JSON.parse(ev(`JSON.stringify(hsl2rgb(${hue(n)},0.85,0.56))`));
assert.deepEqual(JSON.parse(ev("JSON.stringify(RGB[BARRE])")), attendu(3));
REG(etat({ bossId: 40 })); ev("lire(2100)");
assert.deepEqual(JSON.parse(ev("JSON.stringify(RGB[BARRE])")), attendu(40), "la couleur suit le boss");
assert.notDeepEqual(attendu(3), attendu(40));
// sans palette connue : le violet-rose d'origine (#a23fd6)
REG(etat({ bossId: 77 }), { styleCouleurBarreBossIdleV1_: undefined }); ev("lire(2200)");
assert.deepEqual(JSON.parse(ev("JSON.stringify(RGB[BARRE])")), [162, 63, 214]);

// rendu : cœur (rose), jauge (couleur du boss), texte blanc, régénération verte, rainure ; jamais en dehors de la grille
const rendu = (pctPv, { fmax = 65e6, t = 1, scene = "base", params = "{}", W = 120, H = 14, regen = 1000, boss = "X" } = {}) => JSON.parse(ev(`(function(){
  var p=new Panel(document.createElement('canvas'),${W},${H});
  p.cell=3;p.canvas={width:1,height:1};p.bgc={};p.core=p.glow=new Proxy([],{get:function(){return new Proxy([],{get:function(){return {};}});}});
  S.boss=${boss ? "true" : "false"};S.num=3;S.nom=${JSON.stringify(boss)};S.vic=3;S.obj={};S.now=0;
  S.pv=${pctPv === null ? "null" : `{pct:${pctPv},cur:formaterTest(${pctPv * fmax}),max:formaterTest(${fmax}),regen:${regen ? `'+'+formaterTest(${regen})+'/s'` : "''"}}`};
  p.draw(SC['${scene}'].fn,${t},${scene === "fight" ? 1 : 0.5},${params});
  var parCouleur={},bas=0,haut=0,rows={};
  for(var i=0;i<p.v.length;i++)if(p.v[i]){var y=Math.floor(i/p.W);rows[y]=(rows[y]||0)+1;parCouleur[p.c[i]]=(parCouleur[p.c[i]]||0)+1;if(y>=p.H)bas++;else haut++;}
  return JSON.stringify({HT:p.HT,H:p.H,W:p.W,bas:bas,haut:haut,couleurs:parCouleur,rows:rows,v:Array.prototype.join.call(p.v,','),c:Array.prototype.join.call(p.c,',')});})()`));
fen.formaterTest = formateur;
ev("window.formaterTest=undefined");
vm.runInContext("var formaterTest=null;", c);
c.formaterTest = formateur;
const pc = rendu(0.5);
assert.equal(pc.HT, 33, "écran plus haut : 14 rangées de scènes + 19 de vie du boss");
assert.equal(pc.H, 14);
const ph = rendu(0.5, { W: 90, H: 12 });
assert.equal(ph.HT, 31, "téléphone : 12 + 19");
for (const r of [pc, ph]) {
  assert.ok(r.couleurs[7] > 100, "jauge dans la couleur du boss (7)");
  assert.ok(r.couleurs[6] > 15, "petit cœur rose (6)");
  assert.ok(r.couleurs[3] > 30, "texte blanc des PV (3)");
  assert.ok(!r.couleurs[4], "plus de régénération affichée sur la borne (Norman, 2026-11-02 : « sa regen de vie est inutile »)");
  assert.ok(r.bas > 150, "la vie du boss est dessinée sous les scènes");
}
// rangées : rainure en y = H, jauge H+2..H+10, régénération H+12..H+18, rien au-delà
const lignes = Object.keys(pc.rows).map(Number);
assert.ok(lignes.every((y) => y < 33) && Math.max(...lignes) <= 32 && Math.min(...lignes.filter((y) => y >= 14)) === 14, "rainure sur la rangée 14, rien hors de la grille");
assert.ok(pc.rows[14] > 30 && pc.rows[15] === undefined, "fine ligne de points puis une rangée vide");
assert.ok(pc.rows[16] > 50 && pc.rows[24] > 50 && pc.rows[25] === undefined, "jauge de 9 rangées (16 à 24)");
// vidage : de droite à gauche
const col7 = (r, y) => { const l = []; const cs = r.c.split(","), vs = r.v.split(","); for (let x = 0; x < r.W; x++) if (cs[y * r.W + x] === "7" && Number(vs[y * r.W + x]) > 100) l.push(x); return l; };
const y0 = 16;
const plein = col7(rendu(1), y0).length, moitie = col7(rendu(0.5), y0).length, quart = col7(rendu(0.25), y0).length, vide = col7(rendu(0), y0).length;
assert.ok(plein > moitie && moitie > quart && quart > vide && vide === 0, "la jauge se vide : " + [plein, moitie, quart, vide]);
const m = col7(rendu(0.5), y0);
assert.ok(Math.max(...m) < 60 + 5 && Math.min(...m) <= 2, "elle se vide par la droite (reste à gauche)");
// sans boss connu : seulement la rainure, aucune vie
const sans = rendu(null);
assert.equal(sans.couleurs[7] || 0, 0);
assert.equal(sans.couleurs[6] || 0, 0, "pas de cœur sans boss connu");
// la vie reste affichée pendant TOUTES les scènes (FIGHT !, coup, objet actif, NUKE, victoire, K.O.) : rangées de la barre inchangées d'une scène à l'autre
const reference = rendu(0.5).v.split(",").slice(15 * 120).join(",");
for (const [scene, params, t] of [["fight", "{}", 1.5], ["hit", "{mot:'POW !'}", 0.4], ["objet", "{o:'luck'}", 1.0], ["nuke", "{v:0,base:0}", 1.2], ["win", "{}", 4], ["ko", "{}", 1], ["bars", "{}", 1], ["mascot", "{}", 1], ["score", "{}", 1]]) {
  const r = rendu(0.5, { scene, params, t });
  assert.equal(r.v.split(",").slice(15 * 120).join(","), reference, "la vie du boss reste la même et visible pendant « " + scene + " »");
}
// le fondu des scènes (gain) ne touche pas la barre : même rangées avec un gain différent
const fondu = rendu(0.5, { scene: "base", t: 0.01 });
assert.equal(fondu.v.split(",").slice(15 * 120).join(","), reference, "le fondu d'une scène ne fait pas clignoter la vie du boss");
// grand nombre : 3 niveaux de repli (« a / b », « a/b », « a »), jamais hors de la jauge
const long = rendu(0.5, { fmax: 123.45e45, W: 90, H: 12 });
assert.ok(long.couleurs[3] > 10, "PV énormes sur téléphone : un texte plus court plutôt que rien");
// régénération absente = aucune pastille verte
assert.equal(rendu(0.5, { regen: 0 }).couleurs[4] || 0, 0, "pas de régénération : pas de vert");

// intégration dans la page : l'ancienne barre est masquée, jamais supprimée (mêmes ids, mêmes classes)
assert.ok(combat2.includes('<div class="bn-pv-source">') && combat2.includes('id="sorealIdleBossBarV7"') && combat2.includes('class="soreal-idle-bossbar-v7"') && combat2.includes('id="sorealIdleBossPvV7"') && combat2.includes('class="soreal-idle-duel-hp-v41"'), "ids et classes de l'ancienne barre conservés");
assert.ok(combat2.indexOf('class="bn-led"') < combat2.indexOf('class="bn-pv-source"') && combat2.indexOf('class="bn-pv-source"') < combat2.indexOf("capacitesBossMarkupIdleV70_(j)"), "ordre de la page : écran, portrait, barre masquée, capacités");
assert.ok(/\.bn-pv-source\{[^}]*position:absolute[^}]*clip:rect\(0 0 0 0\)/.test(css), "barre masquée (sr-only)");
assert.ok(/aspect-ratio:120\/40/.test(css) && /aspect-ratio:90\/36/.test(css));
assert.ok(!/!important/.test(css), "aucun !important");
// le code d'origine continue de mettre l'ancienne barre à jour (inchangé)
const boucle = lire("public/modules/ui-boucle-v1.js");
assert.ok(boucle.includes("getElementById(\n            'sorealIdleBossPvV7'") || boucle.includes("'sorealIdleBossPvV7'"), "mise à jour en direct de l'ancienne barre conservée");
// perf : un seul canvas, 30 images/s au plus sur téléphone
assert.equal((src.match(/createElement\('canvas'\)/g) || []).length >= 1, true);
assert.ok(/ts-lastTs>=32/.test(src));

/* ---------- grille dynamique : un point de taille FIXE, plus l'hôte est grand plus il y a de LED (Norman : « je ne veux pas ÉTIRER ») ---------- */
const g = (w, h, dpr = 1, mobile = false) => JSON.parse(ev(`(function(){var m=window.innerWidth;window.innerWidth=${mobile ? 500 : 1000};MOBILE_CACHE=null;var r=grille(${w},${h},${dpr});window.innerWidth=m;MOBILE_CACHE=null;return JSON.stringify(r);})()`));
const pcGrille = [400, 544, 780].map((w) => g(w, Math.round(w * 40 / 120)));
assert.deepEqual(pcGrille.map((x) => x.cell), [4, 4, 4], "PC : point de 4 px, quelle que soit la largeur");
assert.deepEqual(pcGrille.map((x) => x.W), [100, 136, 195], "colonnes = floor(largeur / point)");
assert.ok(pcGrille[0].W < pcGrille[1].W && pcGrille[1].W < pcGrille[2].W && pcGrille[0].H < pcGrille[2].H, "plus large = plus de LED (colonnes et rangées)");
assert.equal(g(544, 181).H, Math.floor(181 / 4) - 19, "zone des scènes = rangées totales - 19 rangées de vie du boss");
assert.equal(g(287, 115, 1, true).cell, 3, "téléphone : point de 3 px");
assert.equal(g(287, 115, 1, true).W, 95);
assert.equal(g(544, 181, 2).cell, 8, "dpr 2 : le point fait 4 px CSS = 8 pixels d'écran (entier, net)");
assert.equal(g(544, 181, 1.5).cell, 6, "dpr 1,5 : 6 pixels d'écran, jamais une fraction");
assert.equal(g(5000, 5000).W, 240, "plafond de colonnes");
assert.equal(g(5000, 5000).H + 19, 72, "plafond de rangées (total 72)");
assert.equal(g(10, 10).W, 60, "plancher de colonnes");
assert.ok(g(10, 10).H >= 8, "hauteur minimale des scènes");
// le texte reste centré et net à plusieurs largeurs (400, 544, 780 px)
const centre = (W, H) => JSON.parse(ev(`(function(){var p=new Panel(document.createElement('canvas'),${W},${H});P=p;p.c.fill(0);p.v.fill(0);p.yoff=0;p.cy0=0;p.cy1=${H}-1;p.YM=${H};p.p={};S.boss=false;S.nom='';S.num=0;sBase(1.0);var mn=999,mx=-1;for(var i=0;i<p.W*p.H;i++)if(p.v[i]&&Math.floor(i/p.W)>=2&&Math.floor(i/p.W)<p.H-2){var x=i%p.W;if(x<mn)mn=x;if(x>mx)mx=x;}P=null;return JSON.stringify([mn,mx,p.W]);})()`));
for (const w of [400, 544, 780]) {
  const gr = g(w, Math.round(w * 40 / 120)), [mn, mx, W] = centre(gr.W, gr.H);
  assert.equal(W, gr.W);
  assert.ok(Math.abs((mn + mx) / 2 - (W - 1) / 2) <= 1.5, "texte centré à " + w + " px : " + [mn, mx, W]);
}
// canvas affiché 1:1 : style.width = canvas.width / dpr, centré sur des pixels d'écran entiers
assert.ok(src.includes("st.width=(wd/dpr)+'px';st.height=(hd/dpr)+'px';st.imageRendering='pixelated'"), "taille CSS = taille du canvas / dpr (jamais étiré)");
assert.ok(src.includes("Math.floor((cssW*dpr-wd)/2))/dpr") && src.includes("Math.floor((cssH*dpr-hd)/2))/dpr"), "centré sur un nombre entier de pixels d'écran");
assert.ok(src.includes("Math.floor(cssW*dpr/this.W+1e-6)") && src.includes("Math.floor(cssW*(dpr||1)/cell)") && !/Math\.round\(cssW/.test(src), "floor, jamais un arrondi qui dépasse");
assert.ok(src.includes("window.addEventListener('resize'") && src.includes("new ResizeObserver"), "recalcul à chaque changement de taille ou de zoom");
assert.ok(/image-rendering:pixelated/.test(css), "image-rendering: pixelated");
// rendu net : les sprites de points sont dessinés à des coordonnées entières
assert.ok(src.includes("x=(i%W)*cell;y=((i/W)|0)*cell;") && src.includes("ctx.drawImage(this.core[this.c[i]][l],(i%W)*cell,((i/W)|0)*cell)"), "points dessinés sur des coordonnées entières");
// plusieurs largeurs : le panneau (canvas + style) pour 544 px à dpr 1 et 2 : taille CSS exacte
const mesure = (w, h, dpr) => JSON.parse(ev(`(function(){window.devicePixelRatio=${dpr};var cv=document.createElement('canvas');cv.style={};var gr=grille(${w},${h},${dpr});var p=new Panel(cv,gr.W,gr.H);p.fit(gr.cell,${w},${h});return JSON.stringify({cw:cv.width,ch:cv.height,sw:cv.style.width,sh:cv.style.height,l:cv.style.left,t:cv.style.top,W:gr.W,H:gr.H,cell:gr.cell});})()`));
for (const dpr of [1, 1.5, 2]) {
  const m = mesure(544, 181, dpr);
  assert.ok(Math.abs(parseFloat(m.sw) - m.cw / dpr) < 0.01 && Math.abs(parseFloat(m.sh) - m.ch / dpr) < 0.01, "dpr " + dpr + " : taille CSS = canvas / dpr");
  assert.ok(parseFloat(m.sw) <= 544 + 0.01 && parseFloat(m.sh) <= 181 + 0.01, "jamais plus grand que l'hôte");
  assert.equal(m.cw % m.cell, 0, "largeur en pixels = nombre entier de points");
  assert.ok(Math.abs(parseFloat(m.l) * dpr - Math.round(parseFloat(m.l) * dpr)) < 1e-6, "décalage sur un pixel d'écran entier");
}
vm.runInContext("window.devicePixelRatio=1;", c);

console.log("idle-borne-led-vie-boss-v1: OK");
