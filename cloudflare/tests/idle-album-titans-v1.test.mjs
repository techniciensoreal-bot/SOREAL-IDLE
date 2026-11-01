// Norman (2026-11-01) : « au bout de Chroniques, le classeur (l'Album des boss), des pages avec les cartes au format Magic des TITANS qu'on a déjà battus, spéciales, personnalisées par rapport à leurs images,
// avec un effet hologramme ». Règle n°2 : seulement les titans déjà vaincus, aucun total, aucune carte « ??? » ; sans titan vaincu, RIEN ne change. Règle n°3 : le balayage boucle sans à-coup.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const t = lire("cloudflare/public/modules/album-titans-v1.js");
const a = lire("cloudflare/public/modules/album-cartes-v1.js");
const c = lire("cloudflare/public/soreal-idle-album-titans.css");
const idx = lire("cloudflare/public/index.html");
const dict = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));

// ---- sources ----
assert.ok(t.includes("window.__SOREAL_IDLE_ALBUM_TITANS_V1__={") && t.startsWith("/*") && t.includes("(function(){"), "module IIFE exposant window.__SOREAL_IDLE_ALBUM_TITANS_V1__");
assert.ok(idx.indexOf("/modules/album-titans-v1.js") > 0 && idx.indexOf("/modules/album-titans-v1.js") < idx.indexOf("/modules/album-cartes-v1.js"), "chargé AVANT le module de l'album");
assert.ok(idx.includes("/soreal-idle-album-titans.css"), "feuille de style liée");
// l'album ne compte les pages de titans que s'il y en a
assert.ok(a.includes("function nbPages(){return 1+pagesBoss()+pagesTitans();}") && a.includes("T?T.nbPages(titans.length):0"), "pages de titans APRÈS les pages des boss, zéro page sans titan");
assert.ok(a.includes("function cartesDePage(r){return r>=1&&r<=pagesBoss()") && a.includes("function titansDePage(r)") && a.includes("function nbCartesPage(r)"), "les pages de boss et de titans sont distinctes (les titans n'entrent jamais dans les annonces de nouvelles cartes)");
assert.ok(a.includes("var tl=titansDePage(L);if(tl.length)return completer(tl.map(titansMod().pochetteHtml).join(''),tl.length,dd);"), "page de titans : 9 emplacements via completer()");
assert.ok(a.includes("nbCartesPage(p)") && a.includes("nbCartesPage(L)"), "dos visible à gauche et feuilles légères comptent aussi les cartes de titans");
assert.ok(a.includes("titans=titansMod()?titansMod().titansVaincus():[];"), "la liste vient des titans vaincus");

// ---- comportements purs : on exécute le vrai module sur un faux navigateur ----
const ecouteurs = [];
const doc = { addEventListener: (n, f) => ecouteurs.push(n), documentElement: { addEventListener() {} }, createElement: () => ({}), querySelectorAll: () => [] };
const titan = (id, kills, extra = {}) => ({ id, name: "Nom " + id, nomComplet: "Nom complet " + id, state: { kills, nextAt: 0 }, ...extra });
const aventure = { titans: [titan("t10", 2), titan("t2", 1), titan("t3", 0), titan("t5", 4, { forms: [{}, {}, {}, {}, {}] }), titan("t6", 1, { difficulties: { normal: {}, hard: {} } })] };
const fen = { document: doc, requestAnimationFrame: (f) => 0, setTimeout, clearTimeout, __SOREAL_IDLE_REG__: { idleEtat: { systemes: { adventure: aventure } }, aventureMetaIdleV47_: (j) => j.systemes.adventure } };
fen.window = fen;
vm.runInNewContext(t, fen);
const T = fen.__SOREAL_IDLE_ALBUM_TITANS_V1__;
assert.ok(T, "module chargé");
const vaincus = T.titansVaincus();
assert.deepEqual(Array.from(vaincus.map((x) => x.id)), ["t2", "t5", "t6", "t10"], "seulement les titans vaincus (kills > 0), dans l'ordre du jeu (t2 avant t10)");
assert.equal(T.nbPages(0), 0, "aucune page sans titan vaincu");
assert.equal(T.nbPages(1), 1); assert.equal(T.nbPages(9), 1); assert.equal(T.nbPages(10), 2); assert.equal(T.PAR_PAGE, 9);
assert.equal(T.page(Array.from({ length: 12 }, (_, i) => i), 1).length, 3, "dernière page : 3 cartes (les 6 autres emplacements sont complétés par l'album)");
fen.__SOREAL_IDLE_REG__.idleEtat.systemes.adventure = { titans: [titan("t2", 0), titan("t3", 0)] };
assert.deepEqual(Array.from(T.titansVaincus()), [], "aucun titan vaincu : liste vide, donc aucune page");
fen.__SOREAL_IDLE_REG__.idleEtat = null;
assert.deepEqual(Array.from(T.titansVaincus()), [], "état absent : liste vide, jamais d'erreur");

// la carte : image réelle du titan, nom, victoires ; pas de total, pas de « ??? »
const h = T.pochetteHtml(titan("t5", 4, { forms: [{}, {}, {}, {}, {}] }));
assert.ok(h.includes("/api/idle/media/titan?id=t5&amp;form=4"), "image de la forme en cours (comme la page Titans)");
assert.ok(T.pochetteHtml(titan("t6", 1, { difficulties: { normal: {}, hard: {} } })).includes("id=t6&amp;tier=normal"), "image du premier palier");
assert.ok(h.includes("Nom complet t5") && h.includes("<b>4</b>") && h.includes("victoires") && h.includes(">Titan<"), "nom, victoires, titre « Titan »");
assert.ok(T.pochetteHtml(titan("t2", 1)).includes("victoire</span>") && !/victoires<\/span>/.test(T.pochetteHtml(titan("t2", 1))), "singulier à une victoire");
assert.ok(!/\?\?\?|\/\s*\d|wiki|sur \d/i.test(h.replace("/api/idle/media/titan?id", "")) , "aucun dénominateur, aucune case ???, jamais « wiki »");
assert.ok(!/ \/ /.test(h), "pas de « x / y »");
assert.ok(h.includes('class="alb-plastique"') && h.includes("alb-carte alb-carte-mtg") && h.includes("alb-pochette alb-pochette-titan"), "même pochette plastique et même format que les cartes de boss");
assert.ok(h.includes("data-morph-vivant") && h.includes("data-morph-classes-gardees"), "règle n°4 : un redessin ne retire ni la teinte ni la classe d'effet");
// teinte : stable, 0-359, personnalisée par titan
const th = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"].map((i) => T.teinte(i));
assert.ok(th.every((x) => x >= 0 && x < 360 && x === Math.floor(x)), "teinte de repli valide");
assert.equal(new Set(th).size, th.length, "chaque titan a sa teinte");
assert.equal(T.teinte("t3"), T.teinte("t3"), "teinte stable");
assert.ok(t.includes("addEventListener('load',function(e)") && t.includes("getImageData") && t.includes("memoTeinte[id]=h"), "teinte tirée de l'image (canvas), mémorisée, repli si illisible");

// ---- l'effet : pointeur, hologramme, boucle parfaite ----
assert.ok(t.includes("'--mx'") && t.includes("'--my'") && t.includes("alb-titan-actif") && t.includes("requestAnimationFrame(poser)"), "reflet suivi par --mx / --my, un seul calcul par image");
assert.ok(c.includes("conic-gradient") && c.includes("mix-blend-mode:color-dodge") && c.includes("mix-blend-mode:overlay") && c.includes("var(--mx)") && c.includes("var(--my)"), "dégradé conique irisé + mélange");
assert.ok(c.includes(".alb-pochette-titan.alb-titan-actif .alb-t-reflet{opacity:.85}"), "reflet fort seulement sur la carte survolée / touchée");
assert.ok(!/filter\s*:|backdrop-filter|blur\(/.test(c), "aucun filtre coûteux (téléphone) : transform et opacity seulement");
const kf = /@keyframes albTitanBalai\{([\s\S]*?)\n\}/.exec(c)[1];
assert.match(kf, /0%\{[^}]*opacity:0/, "balayage : fondu d'entrée (opacité 0 au départ)");
assert.match(kf, /100%\{[^}]*opacity:0/, "balayage : fondu de sortie (opacité 0 à l'arrivée)");
const xs = [...kf.matchAll(/translateX\((-?[\d.]+)%\)/g)].map((m) => Number(m[1]));
assert.ok(xs.length >= 3 && xs.every((x, i) => i === 0 || x >= xs[i - 1]), "balayage : toujours dans le même sens");
assert.equal(xs[0], -140, "départ hors de la carte (invisible)"); assert.ok(xs[xs.length - 1] > 100, "arrivée hors de la carte");
assert.ok(c.includes("animation:albTitanBalai 6s linear infinite"), "une seule période exacte, linéaire, en boucle");
assert.match(c, /prefers-reduced-motion:reduce\)\{[\s\S]*\.alb-t-balai\{animation:none/, "« réduire les animations » coupe le balayage");
assert.ok(!c.includes("!important"), "pas de !important (plafond de l'audit)");

// ---- textes affichés : traduits ----
for (const k of ["Titan", "Forme", "victoire", "victoires"]) assert.ok(typeof dict[k] === "string" && dict[k], "entrée anglaise : " + k);
console.log("idle-album-titans-v1 : ok");
