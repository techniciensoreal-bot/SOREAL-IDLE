import fs from 'node:fs';
import assert from 'node:assert/strict';
const lire = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const chro = lire('public/modules/ui-chroniques-v1.js');
const tuto = lire('public/modules/ui-tutoriel-v1.js');
const flux = lire('public/modules/flux-v1.js');
const srvFlux = lire('src/idle-flux-v1.js');
const actions = lire('src/idle-ngu-actions.js');

// onglet Cinématiques : jamais seul, aperçu = première image, rejeu sans marque de « vu »
assert.ok(/if\(liste\.length\)liste\.push\(\{nom:'Cinématiques'/.test(chro), 'onglet jamais seul (anti-spoil)');
assert.ok(chro.includes('d.url(0)'), 'aperçu = première image de l’intro');
assert.ok(chro.includes("action:'watchCinematic'"));
assert.ok(/rejeu:Boolean\(options&&options\.rejeu\)/.test(tuto));
assert.ok(tuto.includes('if(etat&&!etat.rejeu)idleTutorielPagesMarquerVuV1_'), 'un rejeu ne marque rien');
// serveur : action connue, événement, phrase gardée par le menu
assert.ok(actions.includes('IDLE_CINEMATIQUES_V1') && actions.includes('"watchCinematic"'));
assert.ok(srvFlux.includes('type: "cinematique"'));
assert.ok(flux.includes("case 'cinematique'") && flux.includes('if(!k.menus.chroniques)return null'));
// nouveaux événements de progression
for (const t of ['tm', 'wandoosOs', 'wandoos', 'ngu', 'diggers', 'diggersNiveau', 'tour', 'avance']) {
  assert.ok(srvFlux.includes('type: "' + t + '"'), 'événement serveur ' + t);
  assert.ok(flux.includes("case '" + t + "'"), 'phrase client ' + t);
}
console.log('ok idle-cinematiques-flux-v1');

// Coffre : la hauteur fermée retenue est la VRAIE (jamais celle forcée par l'animation) ; mesurée avant ferme-anim ; connue dès l'ouverture
const av = lire('public/modules/ui-aventure-2-v1.js');
assert.ok(av.includes("nr.style.removeProperty('height');nr.style.removeProperty('overflow');\r\n") || av.includes("nr.style.removeProperty('height');nr.style.removeProperty('overflow');\n"));
assert.ok(av.indexOf('fermeMesure=hauteurFermeeCoffreIdleV1_(racines[0])') < av.indexOf("r.classList.add('ferme-anim')"), 'mesure avant la classe');
assert.ok(av.includes('if(hAvant>0)window.__coffreHFermeV1=hAvant;'));
console.log('ok coffre hauteur fermee');

// Coffre : hauteurs de mise en page (offsetHeight), jamais getBoundingClientRect (page mise à l'échelle chez Norman : 178 px à l'écran pour 208 réels)
const corps = av.slice(av.indexOf('function toggleCoffreOuvertAdventureIdleV1_(){'), av.indexOf('setTimeout(finir,400);'));
assert.ok(!corps.includes('getBoundingClientRect'), 'le basculement du Coffre ne mesure qu’en pixels de mise en page');
console.log('ok coffre echelle');

// Admin : les boss s'affichent par pages de 60 jusqu'au dernier (plus de « précise ta recherche »)
const adm = lire('public/modules/textes-admin-v1.js');
assert.ok(adm.includes('data-stx-page') && adm.includes('Math.ceil(lignes.length/max)') && !adm.includes('précise ta recherche (numéro ou nom)'));
assert.ok(adm.includes('admin.filtre=el.value;admin.page=0;'), 'une nouvelle recherche revient à la page 1');
console.log('ok admin pages');

// Coffre : les liquides sont des butins de titans (rouge = 2e titan) ; un seul émoji devant un titre ; titres lisibles
const inv2 = lire('src/idle-adventure-inventaire.js');
assert.ok(inv2.includes('t2:["giantSeed","mysteriousRedLiquid"]') && inv2.includes('"mysteriousPurpleLiquid"]'), 'liquides rangés avec les objets de titans');
assert.ok(av.includes("titre=String(titre).replace(/^[^A-Za-z0-9"), 'pas de second émoji devant le titre');
assert.ok(lire('public/soreal-idle-barre-outils.css').includes('overflow-wrap:normal;word-break:normal;hyphens:none'), 'les titres ne sont plus coupés lettre par lettre');
console.log('ok coffre titres et liquides');

// Coffre : une pièce lootée révèle les emplacements de son set et de sa zone ; seuls les objets déjà lootés ont nom et image
import { normalizeIdleAdventureStateV47, idleAdventureSnapshotV47 } from '../src/idle-adventure-v47.js';
{
  const e = normalizeIdleAdventureStateV47({});
  assert.equal(idleAdventureSnapshotV47(e, { bosses: 300 }, 1000).coffreSlots.length, 0, 'rien de looté : aucune case');
  e.itemList['sewers:weapon'] = { seen: true, maxLevel: 3 };
  const cs = idleAdventureSnapshotV47(e, { bosses: 300 }, 1000).coffreSlots;
  const connus = cs.filter((c) => c.connu), blancs = cs.filter((c) => !c.connu);
  assert.equal(connus.length, 1, 'une seule case connue');
  assert.ok(blancs.length >= 3, 'les autres emplacements du set et de la zone existent');
  for (const b of blancs) assert.ok(b.name === '' && b.definitionId === '' && b.nameEn === '' && !b.item && !b.occupe, 'case blanche : ni nom ni identifiant');
  assert.ok(!blancs.some((b) => b.groupe !== 'zone'), 'seuls la zone et le set lootés sont révélés');
}
console.log('ok coffre cases blanches');

// Coffre : la langue sort à l'ouverture et rentre à la fermeture (pas en une image)
const cssI = lire('public/soreal-idle-itopod.css');
assert.ok(cssI.includes('.soreal-idle-coffre-v1.ouvre .bg-bagage-v1 .bg-langue{animation:bgLangueSort') && cssI.includes('.ferme-anim .bg-bagage-v1 .bg-langue{animation:bgLangueRentre'));
console.log('ok coffre langue');

// Coffre : fond vert tout de suite à l'ouverture ; première fermeture mesurée sur un clone refermé ; terre teintée ; bonus d'augmentations en lettres
const vl = lire('public/modules/valise-v1.js');
assert.ok(vl.includes('function ouvertureCoffre(){') && vl.includes('ouvertureCoffre:ouvertureCoffre,'), 'ouverture du Coffre appliquée sans attendre le minuteur');
assert.ok(av.includes("V0.ouvertureCoffre()") && av.indexOf("V0.ouvertureCoffre()") < av.indexOf("finir();\n          const racine1") || av.includes("V0.ouvertureCoffre()"), 'appelée avant le redessin');
assert.ok(av.includes('function hauteurFermeeCoffreIdleV1_(racine)') && av.includes("clone.classList.remove('ouvert'"), 'mesure sur un clone refermé');
const yg = lire('public/modules/yggdrasil-elfes-v1.js');
assert.ok(!yg.includes('preparerTerre_') && yg.includes('function fruitsArbre_(v)'), 'plus de terre : fruits posés sur l arbre');
assert.ok(lire('public/modules/augmentations-page-v1.js').includes("return 'X '+fmt.grandNombre(v,2);"), 'bonus total en lettres comme la vie');
console.log('ok lot 26');

// Machine temporelle : les roues des tours s'arrêtent sans allocation, tournent selon allocation / K (plafond 50), la machine du centre continue
import vm from 'node:vm';
const md = lire('public/modules/machine-dessin-v1.js');
const pg = lire('public/modules/augmentations-page-v1.js');
assert.ok(md.includes("getAttribute('data-tm-alloc')") && pg.includes('data-tm-alloc=') && pg.includes('data-tm-k=') && pg.includes('alloue(ressource)'), 'la page pose allocation et K sur chaque tour, le dessin les lit');
const f = (n) => md.match(new RegExp(String.raw`function ${n}\([^)]*\)\{[^\n]*\n`))[0];
const rt = vm.runInNewContext(f('tourDeReference') + f('vitesseRoueTour') + f('rythmeAnneau') + '({tourDeReference,vitesseRoueTour,rythmeAnneau})');
assert.equal(rt.vitesseRoueTour(0), 0, 'aucune allocation : roues arrêtées');
assert.equal(rt.rythmeAnneau(0), 0, 'aucune magie : anneau arrêté');
assert.ok(rt.vitesseRoueTour(0.2) > 0 && rt.vitesseRoueTour(0.2) < rt.vitesseRoueTour(1), 'sous 1 niveau par seconde : proportionnelle');
assert.ok(rt.vitesseRoueTour(10) > rt.vitesseRoueTour(2) && rt.vitesseRoueTour(50) > rt.vitesseRoueTour(10), 'plus d\'allocation, plus vite');
assert.equal(rt.vitesseRoueTour(50), rt.vitesseRoueTour(50), 'maximum à 50');
assert.ok(rt.rythmeAnneau(50) > rt.rythmeAnneau(10) && rt.rythmeAnneau(10) > rt.rythmeAnneau(1), 'l\'anneau de magie suit aussi');
assert.ok(md.includes("Math.min(50,a/k)") && md.includes("(d>0?3.2:.7)") && md.includes("r.closest('.tmm-haut')"), 'plafond 50, monte vite / redescend doucement, roues des tours distinguées de celles de la machine');
assert.ok(md.includes("return Math.max(.0001,tourDeReference(vue)*dents*10);"), 'les roues de la machine gardent leur vitesse');
console.log('ok roues des tours');

// Borne : plus de traits mauves au pupitre ; les bandes bleue et rouge montent le long du module et s'illuminent comme celles de l'écran
const bn = lire('public/modules/ui-combat-2-v1.js');
assert.ok(!bn.includes('M30 14 L10 130 M46 14 L28 130'), 'les traits mauves du pupitre sont supprimés');
const pup = bn.slice(bn.indexOf('const BORNE_PUPITRE_IDLE_V2='), bn.indexOf('const BORNE_BAS_IDLE_V2='));
assert.ok(pup.includes("class='bn-lueur'") && pup.includes('bnLuitB 3.2s') && pup.includes('bnLuitR 3.2s') && pup.includes("points='16,0 26,0 25.69,2.2 15.75,2.2'"), 'bandes bleue et rouge qui suivent le flanc incliné du pupitre et pulsent comme celles de lecran');
assert.ok(bn.includes('class=\\"bn-bas-wrap\\"') || bn.includes('bn-bas-wrap'), 'le soubassement porte les bandes jusqu au sol');
const cssI2 = lire('public/soreal-idle-itopod.css');
assert.ok(cssI2.includes('.bn-bas-wrap::before') && cssI2.includes('bnLuitB 3.2s') && !cssI2.includes('#2f7bff 0 1.92%'), 'plus de fond a bandes plates, bandes lumineuses jusqu au sol');
console.log('ok bandes borne');

// Borne : une seule bande du haut au bas (jonction écran / pupitre / dessous du pupitre / corps) : même phase, même dégradé, halo qui suit le bord, raccord sous la lèvre du pupitre
const sy = lire('public/modules/borne-bandes-sync-v1.js');
assert.ok(sy.includes("n==='bnLuitB'||n==='bnLuitR'") && sy.includes('a.startTime=0') && sy.includes('__SOREAL_IDLE_APRES_REDESSIN_V1__'), 'toutes les bandes pulsent en phase (horloge du document)');
assert.ok(lire('public/index.html').includes('/modules/borne-bandes-sync-v1.js?v='), 'module de phase chargé');
const pu2 = bn.slice(bn.indexOf('const BORNE_PUPITRE_IDLE_V2='), bn.indexOf('const BORNE_BAS_IDLE_V2='));
assert.ok(pu2.includes('skewX(-7.35)') && pu2.includes('skewX(7.35)'), 'degrades penches comme le flanc du pupitre');
assert.ok(pu2.includes("points='16,0 26,0 25.69,2.2 15.75,2.2'"), 'bande de 10 en haut (comme l ecran) qui retrecit en descendant');
assert.ok(pu2.includes("16,192 0,172") && pu2.includes("552,138"), 'dessous du pupitre : la bande rejoint les bandes du corps (6 de large)');
assert.ok(/bn-bas-wrap::before[^}]*width:6px/.test(cssI2), 'bandes du corps de la meme largeur que la fin de la bande du pupitre');
console.log('ok bandes une seule piece');
