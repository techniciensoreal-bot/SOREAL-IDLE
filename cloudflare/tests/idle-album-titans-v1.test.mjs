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
assert.ok(a.includes("function nbPages(){return 1+pagesBoss()+pagesTitans();}") && a.includes("T&&T.nbPagesAlbum?T.nbPagesAlbum():0"), "pages de titans APRÈS les pages des boss, zéro page sans titan");
assert.ok(a.includes("function cartesDePage(r){return r>=1&&r<=pagesBoss()") && a.includes("function estTitans(r)") && a.includes("function nbCartesPage(r)"), "les pages de boss et de titans sont distinctes (les titans n'entrent jamais dans les annonces de nouvelles cartes)");
assert.ok(a.includes("if(estTitans(L))return titansMod().pageHtml(L-pagesBoss()-1);"), "page de titans : 9 emplacements (carte de face ou dos) fabriques par le module des titans");
assert.ok(a.includes("nbCartesPage(p)") && a.includes("nbCartesPage(L)"), "dos visible à gauche et feuilles légères comptent aussi les cartes de titans");
assert.ok(!a.includes("titans=titansMod()?titansMod().titansVaincus()"), "plus de liste de titans vaincus dans l'album : les emplacements viennent des titans connus (rang) et de carteTitanObtenue");

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

// ---- l'effet : pilote par le pointeur et l'inclinaison, jamais en boucle ----
assert.ok(t.includes("'--mx'") && t.includes("'--my'") && t.includes("alb-titan-actif") && t.includes("requestAnimationFrame(poser)"), "reflet suivi par --mx / --my, un seul calcul par image");
assert.ok(!/infinite/.test(c) && !/@keyframes/.test(c) && !/animation\s*:/.test(c), "aucune animation en boucle dans la feuille des cartes de titan (le balayage lumineux a ete retire)");
assert.ok(!c.includes("alb-t-balai") && !t.includes("alb-t-balai"), "plus d'element de balayage");
assert.ok(!/radial-gradient\([^)]*var\(--m[xy]\)/.test(c) && !/at var\(--m[xy]\)/.test(c) && !c.includes("conic-gradient"), "aucun foyer central : ni radial-gradient ni conic-gradient centres sur --mx / --my");
assert.ok(!c.includes("repeating-linear-gradient"), "aucune rayure fine repetee");
assert.ok(c.includes("hsl(215 ") && c.includes("hsl(355 ") && c.includes("hsl(140 ") && c.includes("hsl(var(--ta) "), "quatre couleurs : bleu, rouge, vert et la couleur de base du titan");
assert.ok(!/#ffd45e|#b07dff|#ff5e9c|#6dff8f|#5ec8ff/i.test(c), "plus d'arc-en-ciel sature");
assert.ok(/linear-gradient\(45deg,hsl\(215 [^)]*var\(--wb/.test(c) && /linear-gradient\(225deg,hsl\(355 [^)]*var\(--wr/.test(c) && /linear-gradient\(315deg,hsl\(140 [^)]*var\(--wv/.test(c) && /linear-gradient\(135deg,hsl\(var\(--ta\)[^)]*var\(--wd/.test(c), "chaque coin a sa couleur (bas-gauche bleu, haut-droit rouge, bas-droit vert, haut-gauche base)");
assert.ok(t.includes("function poserCoins(") && t.includes("'--wb'") && t.includes("'--wr'") && t.includes("'--wv'") && t.includes("'--wd'"), "poids des coins pilotes par l'inclinaison");
assert.ok(t.includes("function inclinaison(") && /Math\.atan2\(ty,tx\)/.test(t) && t.includes("--ha") && t.includes("--hi"), "teinte selon la DIRECTION d'inclinaison (deux axes) et intensite selon l'angle");
assert.ok(!/filter\s*:|backdrop-filter|blur\(/.test(c), "aucun filtre couteux (telephone) : transform et opacity seulement");
assert.ok(!c.includes("!important"), "pas de !important (plafond de l'audit)");

// ---- la carte sort de sa pochette comme une carte de boss ----
const poch = T.pochetteHtml(titan("t5", 4, { forms: [{}, {}, {}, {}, {}] }));
assert.ok(poch.includes('role="button"') && poch.includes("data-album-titan=\"t5\"") && poch.includes("__SOREAL_IDLE_ALBUM_V1__.ouvrirTitan("), "un clic (ou Entree / Espace) sur la pochette d'un titan appelle ouvrirTitan");
assert.ok(a.includes("function ouvrir(n,el){return sortirCarte(n,el,window.__ouvrirBossCollectionIdleV1__,'#sorealIdleBossCollectionModalV1');}") && a.includes("function ouvrirTitan(id,el)") && a.includes("return sortirCarte(String(id),el,T.ouvrirFiche,'#sorealIdleTitanCollectionModalV1');"), "meme animation de sortie (sortirCarte) pour les boss et les titans");
assert.ok(a.includes("function selPochette(n)") && a.includes("data-album-titan=") && a.includes("mouvementCarte(r0,r1,el.closest&&el.closest('.alb-page-g')?'g':'d')"), "memes ancrages gauche / droite selon la page, meme retour dans la pochette");
assert.ok(a.includes("ouvrirTitan:ouvrirTitan"), "ouvrirTitan exposee");
for (const k of ["ficheContenu", "ouvrirFiche", "fermerFiche"]) assert.ok(t.includes(k + ":" + k), k + " exposee");
assert.ok(t.includes("sorealIdleTitanCollectionModalV1") && t.includes("mtg-modal-v1") && t.includes("carte-mtg-v1") && t.includes("C.dos({dosImage:"), "fiche : meme fenetre, meme mecanisme de rotation / dos que les boss (dos sans aucune information de jeu)");
assert.ok(t.includes("data-titan-aller") && t.includes("Titan précédent") && t.includes("Titan suivant"), "fleches precedent / suivant entre titans");
assert.ok(t.includes("r.i>0?r.liste[r.i-1]:null") && t.includes("r.i<r.liste.length-1?r.liste[r.i+1]:null"), "navigation dans la famille des titans VAINCUS seulement (jamais de titan non decouvert, pas de total)");
assert.ok(t.includes("e.key==='Escape'") && t.includes("ev.target===m"), "Echap et clic hors de la carte ferment la fiche");
// la fiche avec le vrai module
fen.__SOREAL_IDLE_REG__.idleEtat = { systemes: { adventure: { titans: [titan("t2", 1), titan("t5", 4, { forms: [{}, {}, {}, {}, {}] }), titan("t6", 0)] } } };
const fc = T.ficheContenu("t5");
assert.ok(fc.includes("Nom complet t5") && fc.includes("<b>4</b>") && fc.includes('data-titan-aller="t2"') && !fc.includes('data-titan-aller="t6"'), "fiche de titan : carte du titan, fleche vers le precedent vaincu seulement (t6 non vaincu = absent)");
assert.equal(T.ficheContenu("t6"), "", "un titan non vaincu n'a pas de fiche");
assert.ok(!/ \/ |\?\?\?/.test(fc), "aucun total dans la fiche");
// curseur masque pendant que la carte est tenue
const cb = lire("cloudflare/public/modules/carte-boss-magic-v1.js");
const cbc = lire("cloudflare/public/soreal-idle-carte-boss.css");
assert.ok(cb.includes("classList.add('mtg-tenue')") && cb.includes("function lacher()") && cb.includes("classList.remove('mtg-tenue')") && cb.includes("window.addEventListener('blur',lacher)") && cb.includes("addEventListener('visibilitychange',lacher)") && /function finGlisse\(e\)\{\n  lacher\(\);/.test(cb), "curseur masque pendant le glisse, retabli au relachement / blur / visibilitychange / pointercancel");
assert.ok(/html\.mtg-tenue [^{]*\{cursor:none\}/.test(cbc), "cursor:none pendant que la carte est tenue");


// ---- les titans commencent TOUJOURS sur une nouvelle page, avec leurs dos visibles avant de tourner la page (Norman, 2026-11-01) ----
assert.ok(a.includes("function estTitans(r){return Boolean(titansMod())&&r>pagesBoss()&&r<nbPages();}"), "pages de titans = toujours APRES la derniere page de boss (jamais sur la meme page)");
assert.ok(a.includes("function cartesDePage(r){return r>=1&&r<=pagesBoss()?"), "une page de boss ne contient jamais de titan");
assert.ok(a.includes("function derriereDroite(L)") && a.includes("!estTitans(L+1)") && a.includes("var dd=gauche?derriereGauche(L):derriereDroite(L);"), "avant de tourner la page : la page de droite montre les dos de la page de titans qui est derriere");
assert.ok(a.includes("d.titan=estTitans(p);") && a.includes("function miroir(i)"), "dos de titans aussi derriere une page de gauche (place symetrique)");
assert.ok(a.includes("var d=[],i;\n  if(!double()||L<1||!estTitans(L+1))return null;"), "derriere de droite : PC seulement, jamais derriere une page de titans / la derniere page");
assert.ok(t.includes("function carteTitanObtenue(rang,t)") && t.includes("carteTitanObtenue:carteTitanObtenue") && t.includes("window.__SOREAL_IDLE_ALBUM_TITANS_V1__.carteTitanObtenue"), "point d'extension carteTitanObtenue(rang, titan), remplacable");
assert.ok(t.includes("/dos-cartes/normal/titan-"), "dos de titan : dos-cartes/normal/titan-1..9.webp");
{
  const fen2 = { document: doc, requestAnimationFrame: (f) => 0, setTimeout, clearTimeout, __SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__: { dos: (o) => "<img src=\"" + o.dosImage + "\">" }, __SOREAL_IDLE_REG__: { idleEtat: { systemes: { adventure: { titans: [titan("t1", 2), titan("t2", 1), titan("t3", 0)] } } }, aventureMetaIdleV47_: (j) => j.systemes.adventure } };
  fen2.window = fen2;
  vm.runInNewContext(t, fen2);
  const T2 = fen2.__SOREAL_IDLE_ALBUM_TITANS_V1__;
  assert.equal(T2.nbPagesAlbum(), 1, "un titan connu : une page de titans");
  const pg = T2.pageHtml(0);
  assert.equal((pg.match(/alb-pochette /g) || []).length, 9, "TOUJOURS 9 emplacements");
  assert.equal((pg.match(/alb-pochette-titan/g) || []).length, 2, "2 cartes de face (titans obtenus)");
  assert.equal((pg.match(/alb-pochette-dos-titan/g) || []).length, 7, "7 dos pour les emplacements sans carte (dont le titan connu non vaincu)");
  for (let k = 3; k <= 9; k++) assert.ok(pg.includes("/dos-cartes/normal/titan-" + k + ".webp"), "emplacement " + k + " : dos de titan n°" + k);
  assert.ok(!/Nom complet t3|Nom t3/.test(pg) && !/ \/ |\?\?\?/.test(pg.replace(/<[^>]+>/g, " ")), "aucun nom sur un dos, aucun total, aucun « x / 9 »");
  // extension : une condition venue d'ailleurs
  T2.carteTitanObtenue = (rang, tt) => rang === 2;
  assert.equal(T2.pageHtml(0).match(/alb-pochette-titan/g).length, 1, "carteTitanObtenue remplacee : seule la carte de rang 2 est de face");
  assert.equal(T2.nbPagesAlbum(), 1);
  // plus de 9 : les pages de 9 s'enchainent
  T2.carteTitanObtenue = (rang) => true;
  fen2.__SOREAL_IDLE_REG__.idleEtat.systemes.adventure.titans = Array.from({ length: 12 }, (_, i) => titan("t" + (i + 1), 1));
  assert.equal(T2.nbPagesAlbum(), 2, "12 titans obtenus : 2 pages de 9 emplacements");
  assert.equal((T2.pageHtml(1).match(/alb-pochette /g) || []).length, 9, "la page suivante a aussi 9 emplacements");
  // anti-spoil : sans titan connu, aucune page
  fen2.__SOREAL_IDLE_REG__.idleEtat.systemes.adventure.titans = [];
  assert.equal(T2.nbPagesAlbum(), 0, "aucun titan connu : aucune page de dos (l'album est inchange)");
  fen2.__SOREAL_IDLE_REG__.idleEtat = null;
  assert.equal(T2.nbPagesAlbum(), 0, "etat absent : zero page, jamais d'erreur");
}

// ---- gyroscope (telephone) : l'inclinaison physique incline la carte et pilote l'hologramme ----
assert.ok(t.includes("window.addEventListener('deviceorientation',gyEvenement)") && t.includes("window.removeEventListener('deviceorientation',gyEvenement)"), "ecouteur deviceorientation ajoute puis RETIRE");
assert.ok(t.includes("function gyFermer()") && /function fermerFiche\(\)\{[^}]*gyFermer\(\)/.test(t) && t.includes("gyOuvrir();\n  return m;"), "ecouteur ajoute a l'ouverture de la fiche, retire a sa fermeture");
assert.ok(t.includes("requestPermission") && t.includes("gy.demande=true") && t.includes(".catch(function(){})"), "iOS : requestPermission() au premier toucher, refus sans message");
assert.ok(t.includes("GY_LIM=12") && t.includes("gyHauteur(") && t.includes("Math.tanh("), "butee douce +/-12 degres, hauteur (gravite) continue (voir idle-album-titans-gyro-naturel-v1)");
assert.ok(t.includes("prefers-reduced-motion: reduce") && t.includes("gyReduit()"), "« reduire les animations » desactive le gyroscope");
assert.ok(t.includes("if(fi&&fi.glisse){gy.raf=requestAnimationFrame(gyPas);return;}"), "le doigt pose est prioritaire sur le gyroscope");
assert.ok(t.includes("document.addEventListener('visibilitychange',gyVisible)") && t.includes("!document.hidden&&gy.on"), "arret si l'onglet est masque");
assert.ok(t.includes("ev.beta==null||ev.gamma==null"), "sans capteur (PC : valeurs nulles) : rien");
assert.ok(!/localStorage/.test(t), "aucune preference stockee (regle n°6)");
// avec un faux evenement : --rx / --ry changent
{
  const props = {}, ecoutes = [], file = [];
  const k = { style: { setProperty: (n, v) => { props[n] = v; }, removeProperty() {} } };
  const face = { classList: { add() {}, remove() {} } };
  const carte = { querySelector: (q) => (q === ".alb-titan-carte" ? k : q === ".alb-t-face" ? face : null), closest: () => null };
  const w = { addEventListener: (n, f) => ecoutes.push(["add", n, f]), removeEventListener: (n, f) => ecoutes.push(["rm", n, f]), matchMedia: () => ({ matches: true }), DeviceOrientationEvent: function () {}, ontouchstart: null };
  const d = { addEventListener() {}, documentElement: { addEventListener() {} }, hidden: false, getElementById: () => ({}), querySelector: () => carte, createElement: () => ({}), querySelectorAll: () => [] };
  const f2 = { window: w, document: d, requestAnimationFrame: (f) => { file.push(f); return file.length; }, cancelAnimationFrame() {}, setTimeout, clearTimeout, __SOREAL_IDLE_REG__: {} };
  w.matchMedia = (q) => ({ matches: /pointer: coarse/.test(q) });
  vm.runInNewContext(t, f2);
  const G = f2.window.__SOREAL_IDLE_ALBUM_TITANS_V1__;
  const vider = () => { let n = 0; while (file.length && n++ < 200) file.shift()(); };
  G.gyroOuvrir();
  assert.equal(ecoutes.filter((e) => e[0] === "add" && e[1] === "deviceorientation").length, 1, "gyroscope : un ecouteur ajoute a l'ouverture (Android : sans permission)");
  G.gyroEvenement({ beta: 45, gamma: 0, timeStamp: 1 }); vider();
  G.gyroEvenement({ beta: 45, gamma: 20, timeStamp: 17 }); vider();
  assert.ok(Number(props["--ry"]) !== 0, "incliner a droite change --ry");
  G.gyroEvenement({ beta: 75, gamma: 90, timeStamp: 40 }); vider();
  assert.ok(Math.abs(Number(props["--ry"])) <= 12.01 && Math.abs(Number(props["--rx"])) <= 12.01, "valeurs bornees meme pour une inclinaison extreme");
  assert.ok(["--mx", "--my", "--ha", "--hi", "--wd", "--wr", "--wb", "--wv"].every((n) => n in props), "pilote aussi tout l'hologramme");
  G.gyroEvenement({ beta: null, gamma: null });   // capteur absent : rien, jamais d'erreur
  G.gyroFermer();
  assert.equal(ecoutes.filter((e) => e[0] === "rm" && e[1] === "deviceorientation").length, 1, "gyroscope : ecouteur retire a la fermeture");
}

// ---- textes affichés : traduits ----
for (const k of ["Titan", "Forme", "victoire", "victoires"]) assert.ok(typeof dict[k] === "string" && dict[k], "entrée anglaise : " + k);
// ---- dos propre aux cartes de Titan (Norman, 2026-11-01) : image compressée du dépôt, le dos des boss reste inchangé ----
assert.ok(t.includes("C.dos({dosImage:urlDos(r.rang+1)})"), "la fiche de titan utilise son propre dos (9 variantes, place du titan modulo 9)");
const cbmDos = lire("cloudflare/public/modules/carte-boss-magic-v1.js");
assert.ok(cbmDos.includes("((o&&o.dosImage)||urlDosNormal(o&&o.numero))"), "dos(o) : image du dos de boss par défaut");
for (let i = 1; i <= 9; i++) { const dosImg = "cloudflare/public/dos-cartes/normal/titan-" + i + ".webp"; assert.ok(fs.existsSync(dosImg) && fs.statSync(dosImg).size > 20000 && fs.statSync(dosImg).size < 150000, "dos de titan " + i + " présent et compressé"); }
console.log("idle-album-titans-v1 : ok");
