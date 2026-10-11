import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/*
 * Norman (2026-10-11) : la page Magie du sang fait « rituel satanique » ; chaque barre est un tuyau de vers qui remplit un récipient ; le tuyau grossit et les récipients grandissent avec le rang ;
 * le premier rituel est un doigt piqué par une punaise (100 piqûres = une boîte, une piqûre = un niveau). Anti-spoil (règle n°2) : aucun total écrit (jamais « x / 200 »), l'étagère ne montre que
 * les récipients déjà remplis. Boucles sans à-coup (règle n°3).
 */
const src = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
const page = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.indexOf("/modules/sang-rituel-decor-v1.js?v=") > 0 && html.indexOf("/modules/sang-rituel-decor-v1.js") < html.indexOf("/modules/blood-magic-v1.js"), "décor chargé avant la page");

const fenetre = { __nomJoueurIdleV1__: () => "Norman" };
vm.runInNewContext(src, { window: fenetre, setInterval: () => 0, document: {}, console });
const d = fenetre.__SOREAL_IDLE_SANG_DECOR_V1__;
assert.equal(d.NIVEAUX_PAR_RECIPIENT, 200, "200 niveaux par récipient par défaut");

// rituel ordinaire (calice, 200 niveaux) : 450 = 2 calices pleins + un troisième au quart
const h = d.scene({ id: "barbedWire", sang: 50, compte: 450, barre: "<i data-idle-blood-bar-v1=\"barbedWire\"></i>", saigne: true, rang: 1 });
assert.ok(h.includes('data-bm-pleins="2"') && h.includes('data-bm-cap="200"') && h.includes("translateY(61.50px)"), "niveau du calice = reste / capacité");
assert.ok(h.includes('class="bm-tuyau saigne-v1"') && h.includes('data-idle-blood-bar-v1="barbedWire"'), "la barre du moteur reste le remplissage du tuyau");
assert.ok(h.includes("Sang collecté") && !h.includes("bm-mini"), "l'étagère s'appelle « Sang collecté » (plus de dessin de récipient plein)");
assert.ok(h.includes('<b class="bm-etagere-n">22500</b>'), "sang collecté = 450 rituels × 50 Blood");
assert.ok(!/\/\s*(100|200)|sur (100|200)/.test(h.replace(/viewBox="[^"]*"/g, "")), "aucun « x / capacité » dans le rendu");
const v = d.scene({ id: "barbedWire", sang: 50, compte: 0, barre: "", rang: 1 });
assert.ok(v.includes('data-bm-pleins="0"') && !v.includes(" hidden") && v.includes("Sang collecté") && v.includes('<b class="bm-etagere-n">0</b>') && v.includes("translateY(78.00px)"), "calice vide : « Sang collecté 0 » toujours visible (aussi sur téléphone)");
const presque = d.scene({ id: "barbedWire", sang: 50, compte: 199, barre: "", rang: 1 });
assert.ok(presque.includes('data-bm-pleins="0"') && presque.includes("translateY(12.33px)"), "199 niveaux : presque plein, pas encore sorti");
const plein = d.scene({ id: "barbedWire", sang: 50, compte: 200 * 14, barre: "", rang: 1 });
assert.ok(!plein.includes("bm-mini"));
assert.ok(plein.includes('<b class="bm-etagere-n">140000</b>'), "2800 rituels × 50 Blood");

// les récipients grandissent avec le rang, la scène aussi (le tuyau reste au-dessus)
const taille = (rang) => { const m = d.scene({ id: "barbedWire", sang: 50, compte: 0, barre: "", rang }).match(/--vw:(\d+)px;--vh:(\d+)px;--vb:\d+px;--sh:(\d+)px/); return m.slice(1).map(Number); };
const tailles = [1, 2, 3, 4, 5].map(taille);
for (let i = 1; i < tailles.length; i++) assert.ok(tailles[i][0] > tailles[i - 1][0] && tailles[i][1] > tailles[i - 1][1] && tailles[i][2] >= tailles[i - 1][2], "récipient plus grand au rang " + (i + 1));

// premier rituel : boîte de Petri au nom du joueur, 100 piqûres pour la remplir, doigt + punaise + goutte
const t = d.scene({ id: "tack", sang: 1, compte: 2500, barre: "", rang: 0 });
assert.ok(t.includes('data-contenant="boite"') && t.includes('data-bm-cap="1000"') && t.includes('data-source="punaise"'), "premier rituel : boîte, 1000 niveaux, punaise");
assert.ok(t.includes('data-bm-pleins="2"') && t.includes("translateY(47.50px)"), "2500 piqûres = 2 récipients pleins + la moitié");
assert.ok(t.includes('class="bm-nom"') && t.includes(">Norman</text>"), "étiquette au nom du joueur");
assert.ok(t.includes("bm-punaise") && (t.match(/class="bm-goutte-doigt"/g) || []).length === 1 && !t.includes("bm-plaie") && t.includes("bm-doigt"), "doigt, punaise et UNE seule goutte par piqûre (née du point piqué)");
assert.ok(t.includes("Sang collecté") && t.includes('<b class="bm-etagere-n">2500</b>') && !t.includes("bm-mini"), "premier rituel : sang collecté = 2500 piqûres × 1 Blood");

// un seul récipient sous le doigt ; le suivant n'est dessiné qu'à l'approche du plein (SEUIL_ARRIVEE = 0,9)
assert.ok(!t.includes("bm-suivant"), "à moitié plein : un seul récipient");
const pres = d.scene({ id: "tack", sang: 1, compte: 2950, barre: "", rang: 0 });
assert.ok(pres.includes('class="bm-vase bm-suivant bm-apparait"'), "près du plein : le suivant arrive d'en dehors du cadre");
assert.ok(!d.scene({ id: "tack", sang: 1, compte: 2960, barre: "", rang: 0 }).includes("bm-apparait") && d.scene({ id: "tack", sang: 1, compte: 2960, barre: "", rang: 0 }).includes("bm-suivant"), "un redessin ne le fait pas surgir : il est déjà là");
assert.ok(!d.scene({ id: "tack", sang: 1, compte: 2100, barre: "", rang: 0 }).includes("bm-suivant"), "juste après un plein : un seul récipient");

// deuxième rituel (cinquante coupures de papier) : un bras tranché par une feuille, un verre à moutarde, 5000 coupures pour le remplir
const c2 = d.scene({ id: "papercuts", sang: 50, compte: 12500, barre: "", rang: 1 });
assert.ok(c2.includes('data-contenant="verre"') && c2.includes('data-bm-cap="5000"') && c2.includes('data-source="papier"'), "second rituel : verre, 5000 niveaux, papier");
assert.ok(c2.includes('data-bm-pleins="2"') && c2.includes("translateY(isNaN") === false, "12500 coupures = 2 verres pleins + la moitié");
assert.ok(c2.includes("bm-bras-img") && c2.includes("BloodMagiCoupure.webp") && c2.includes("bm-papier") && c2.includes("bm-coupure") && (c2.match(/class="bm-goutte-doigt bm-gros/g) || []).length === 3, "avant-bras (sans main), manche relevée, feuille, trait de coupure et plusieurs grosses gouttes (une coupure = 50 Blood)");
assert.ok(!c2.includes("bm-sym-poing") && !c2.includes("bm-poing"), "on ne voit jamais la main");
assert.ok(c2.includes("Sang collecté") && !c2.includes("bm-mini"), "étagère : le nom et le nombre, sans dessin");
// troisième rituel (énorme suçon) : un cou, une bouche collée au cou, un tuyau visible, une chope en verre, 5000 niveaux
const c3 = d.scene({ id: "hickey", sang: 2000, compte: 12500, barre: "", rang: 2 });
assert.ok(c3.includes('data-contenant="chope"') && c3.includes('data-bm-cap="5000"') && c3.includes('data-source="sucon"'), "troisième rituel : chope, 5000 niveaux, suçon");
assert.ok(c3.includes("bm-cou") && c3.includes("bm-bouche") && c3.includes("bm-trace-sucon") && c3.includes('class="bm-tuyau'), "cou, bouche, ecchymose et tuyau visible");
assert.ok(!c3.includes("bm-props"), "pas d'accessoires : la scène est déjà pleine");
assert.ok(c3.includes('<b class="bm-etagere-n">25000000</b>') && c3.includes("--cx:109.5px"), "sang collecté, ouverture de la chope décalée par l'anse");

assert.ok(c3.includes("bm-filet") && !c3.includes("bm-goutte") && c3.includes("bm-coude"), "suçon : un filet de sang continu seul (Norman, 2026-10-11 : plus de gouttes), tuyau coudé");
assert.ok(!c2.includes("bm-filet"), "coupures : pas de filet continu");
// Le filet du suçon ne coule pas en continu : un jet par niveau terminé (Norman, 2026-10-11)
assert.ok(src.includes("@keyframes bmJet") && src.includes(".bm-scene.bm-jet .bm-filet{animation:bmJet") && !src.includes("@keyframes bmFilet"), "jet unique par niveau, sans filet permanent");

// la page branche le décor et garde ses points d'accroche
assert.ok(page.includes("decor.scene({id:idHtml,compte:Number(r.completions||0),sang:Number(def.blood||0),barre:barre,saigne:progressionActive,rang:rangRituel})"), "page : scène par rituel (avec le Blood par rituel)");
assert.ok(page.includes("sorealIdleBloodCountV1_") && page.includes("data-idle-blood-bar-v1") && page.includes("sorealIdleBloodEtaLineV1_"), "points d'accroche du moteur conservés");
assert.ok(!page.includes("soreal-idle-section-v8\" data-rang-v1"), "plus d'ancien cadre de rituel");
// cadres verticaux de taille fixe, côte à côte sur PC, jamais superposés ; la scène a la même largeur que sur téléphone
assert.ok(page.includes('<div class="bm-grille">'), "page : grille de cadres");
assert.ok(src.includes("P+'.bm-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,324px),324px));grid-auto-rows:1fr;"), "cadres de largeur fixe qui passent à la ligne, toutes les lignes à la même hauteur");
assert.ok(src.includes("var HAUTEUR_SCENE=312;") && !/sh:(244|290|300)[,}]/.test(src), "toutes les scènes ont la même hauteur : les cadres côte à côte restent alignés");
assert.ok(src.includes(".bm-grille>.bm-rituel .soreal-idle-bt-actions-v120{margin-top:auto!important;padding-top:9px}"), "les boutons restent en bas du cadre");
// trace de l'impact : visible tant que le rituel progresse, fondu lent à l'arrêt
assert.ok(src.includes(".bm-trace{position:absolute;z-index:5;pointer-events:none;opacity:0;transition:opacity 1.8s ease-out}") && src.includes(".bm-scene.bm-marque .bm-trace{opacity:1;transition:opacity .25s ease-out}"), "trace : fondu lent à la disparition");
assert.ok(d.scene({ id: "tack", sang: 1, compte: 10, barre: "", rang: 0 }).includes("bm-trace-trou") && d.scene({ id: "papercuts", sang: 50, compte: 10, barre: "", rang: 1 }).includes("bm-trace-coupures"), "un trou de punaise, des coupures de papier");
// rythme de la punaise : plafond de vitesse visuelle, un coup par niveau quand c'est lent
assert.ok(src.includes("var PERIODE_MIN=0.4,PERIODE_BOUCLE=4;"), "plafond de vitesse et seuil de boucle");
assert.ok(src.includes("data-rythme") && src.includes("bm-coup"), "boucle ou un coup par niveau");
// boucles parfaites : anneaux = 1 période (12 px), vaguelettes = 1 période (40 px), tuile du ver = 120 px (masque et relief)
for (const [garde, msg] of [
  ["background-size:12px 100%", "anneaux : tuile de 12 px"],
  ["@keyframes bmAnneaux{from{transform:translateX(0)}to{transform:translateX(12px)}}", "anneaux glissent d'une période"],
  ["@keyframes bmOnde{from{transform:translateX(0)}to{transform:translateX(40px)}}", "vaguelettes : une période"],
  ["0 0/120px 44px repeat-x", "tuile du ver explicite"],
  ["@keyframes bmFlamme{0%,100%{", "flamme : début = fin"],
  ["@keyframes bmTourne{to{transform:rotate(360deg)}}", "pentacle : tour complet"],
  ["@keyframes bmGouttedoigt{0%,40%{opacity:0;", "goutte du doigt : invisible au début et à la fin"],
  ["@media (prefers-reduced-motion:reduce)", "mouvement réduit coupé"]
]) assert.ok(src.includes(garde), msg);
// le pentacle du sol ne tourne que quand le rituel est en marche
assert.ok(src.includes("animation:bmTourne 40s linear infinite;animation-play-state:paused}") && src.includes(".bm-scene:has(.bm-tuyau.saigne-v1) .bm-pentacle-sol{animation-play-state:running}"), "pentacle du sol : en pause tant que le rituel est arrêté");
// Sans énergie, le doigt et le bras sortent de la case vers la gauche, et reviennent quand on en place (Norman, 2026-10-11).
assert.ok(src.includes(".bm-hors :is(.bm-doigt,.bm-punaise,.bm-goutte-doigt)") && src.includes("translate:-340px 0") && src.includes("translate:-540px 0") && src.includes("var etatHors={}"), "doigt et bras glissent hors de la case sans énergie");
// L'animation ne démarre qu'une fois le doigt / le bras en place (Norman, 2026-10-11).
assert.ok(src.includes("installeA[id]=performance.now()+1250") && src.includes("sec<=PERIODE_BOUCLE&&progresse&&pret") && src.includes("n>avant&&pret"), "animation retardée jusqu'à la mise en place");
// Sans Magie, la sangsue garde le sang déjà absorbé, figé (Norman, 2026-10-11) ; son œil fermé ne laisse pas de blanc au-dessus.
assert.ok(src.includes("var memoireSang={}") && src.includes(".bm-paquets-corps:has(.bm-paquet.on){display:block}") && src.includes("animation-play-state:paused!important") && src.includes("M-2 -32 L26 -32"), "sang figé et paupière complète");
// La punaise et la feuille s'approchent pendant tout le niveau (Norman, 2026-10-11).
assert.ok(src.includes("var APPROCHE={punaise:{base:14,loin:-26},papier:{base:-36,loin:-70}}") && src.includes("function approche("), "approche progressive pendant le niveau");
// Sans assez d'Or, la punaise et la feuille s'immobilisent au contact (Norman, 2026-10-11).
assert.ok(src.includes("var attenteOr=src!=='sucon'") && src.includes("progresse&&pret&&!attenteOr") && src.includes("approche(sc,src,"), "pas de mouvement quand l'Or manque");
console.log("idle-sang-rituel-satanique-v1: OK");
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('class="bm-planche"') && decor.includes('class="bm-porte"') && decor.includes(':is(.bm-planche,.bm-porte){display:block}') && !decor.includes('bm-porte-ar'), "planche penchée qui porte le verre et le porte-sangsue (elle ne flotte plus)");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("src==='punaise'||src==='papier'||src==='sucon'") && decor.includes('.bm-scene[data-source="sucon"].bm-hors :is(.bm-perso,.bm-cou,.bm-perso-bas),') && decor.includes('.bm-hors .bm-fil{translate:-300px 0}'), "sans énergie, le personnage du suçon glisse hors de la case vers la gauche");
  assert.ok(decor.includes("var pret=sc.classList.contains('bm-installe');") && decor.includes("progresse&&pret);"), "la succion ne reprend qu'une fois le personnage en place");
}
{
  // Quatrième rituel : 30 images de Norman lues dans R2 (idle/bloodmagic/rincevent/WEBP/N.webp), image choisie d'après l'avancement du niveau.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("barbedWire:'fil'") && decor.includes('<canvas class="bm-fil"') && decor.includes("name=rincevent/WEBP/'+i+'.webp"), "quatrième rituel : canevas alimenté par les 30 images de R2");
  assert.ok(decor.includes("FIL_FPS=9") && decor.includes("pb<sc.__filPb-0.3") && decor.includes("Math.floor(ecoule*FIL_FPS)"), "immobile pendant le niveau ; l'animation se joue une fois à la fin du niveau (barre du moteur qui repart de zéro), à cadence fixe");
  assert.ok(decor.includes("function filRepos(sc)") && decor.includes('.bm-hors .bm-fil{translate:-300px 0}'), "sans Or le bol reste vide ; sans énergie le personnage sort à gauche");
  const media = readFileSync("cloudflare/src/idle-media-v1.js", "utf8");
  assert.ok(media.includes('nom.includes("..")||nom.startsWith("/")||nom.includes("//")') && media.includes('A-Za-z0-9_.\\/-'), "sous-dossiers autorisés pour les images Magie du sang (sans remonter l'arborescence)");
}
{
  // Le compte à rebours affiche la vraie durée sous la seconde (0,2 s), jamais arrondie à « 1 s ».
  const bm = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8");
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.ok(bm.includes("function etaRituelTexteIdleV1_(r)") && bm.split("etaRituelTexteIdleV1_(rv)").length === 3, "deux affichages de la durée du rituel passent par la vraie valeur");
  assert.ok(ui.includes("seconds<1?String(Math.round(seconds*100)/100).replace('.',',')+' s'"), "compte à rebours en direct : vraie durée sous la seconde");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('function planche(ombres)') && decor.includes('.bm-scene[data-source="fil"] .bm-planche{display:block;z-index:6}') && !decor.includes('bm-table-av') && decor.includes("fil:124"), "4e rituel : table au premier plan ; le sang tombe jusqu'au liquide du calice (chute calculée) et éclabousse");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.split("+planche('<ellipse").length === 5 && decor.includes('.bm-scene:is([data-source="punaise"],[data-source="papier"]) .bm-planche{display:block;z-index:3;left:-190px;top:215px;'), "rituels 1 et 2 : la même planche, beaucoup plus proche, le récipient posé dessus");
}
{
  // Bibliothèque du fond : se remplit avec le rang ; perspective selon la distance de la table.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("function bibliotheque(rang)") && decor.includes("bibliotheque(opts.rang)+") && decor.includes("var seuil=Math.min(.95,.2+.11*r);"), "bibliothèque derrière chaque scène, de plus en plus remplie avec le rang");
  for (const objet of ["biblioCorbeau", "biblioPendentif", "biblioCrane", "biblioBougie", "biblioFiole", "biblioGrimoire", "biblioCristal", "biblioHerbes"]) assert.ok(decor.includes("function " + objet), "objet de sorcellerie : " + objet);
  assert.ok(decor.includes('.bm-scene:is([data-source="punaise"],[data-source="papier"]) .bm-biblio{transform:scale(.74)') && decor.includes('.bm-scene:is([data-source="sucon"],[data-source="fil"]) .bm-biblio{transform:scale(1.04)'), "perspective du fond selon la distance de la table (proche = fond lointain, flou ; lointaine = fond plus grand et net)");
}
{
  // Quatrième rituel : il saigne dès que le fil touche sa bouche ; le calice ne se remplit jamais sans goutte de sang.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("var FIL_IMAGE_CONTACT=5;") && decor.includes("filSaigne(l[i],k)") && decor.includes(".bm-saigne-b-on .bm-saigne-b{animation:bmSaigneB"), "il saigne dès que le fil touche sa bouche (image 6)");
  assert.ok(decor.includes("function filNAffiche(id,n,sc)") && decor.includes("filAtterri[sc.getAttribute('data-bm-id')]=performance.now()+duree*240;") && decor.includes("var nv=sc.getAttribute('data-source')==='fil'?filNAffiche(id,n,sc):n;") && decor.includes("compte=filNAffiche(opts.id,compte,null);"), "le niveau du calice n'avance qu'à l'arrivée d'une goutte (scène et page)");
}
{
  // Les anciens accessoires (bougies, grimoires, crânes, fioles, chaînes, runes au bas des scènes) sont supprimés : la bibliothèque du fond les remplace.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(!decor.includes("function props(") && !decor.includes("bm-props") && !decor.includes("bm-p-livre") && !decor.includes("bm-chaine") && !decor.includes("bm-sym-grimoire"), "anciens accessoires supprimés (plus de code caché)");
}
{
  // Tuyau de la sangsue en une seule pièce, translucide, qui grossit vers l'arrière ; le sang le suit jusqu'au point noir.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("function sangTrace(sc,m,g)") && decor.includes('<svg class="bm-tube"') && decor.includes('fill-opacity=".92" fill-rule="evenodd"') && decor.includes('.bm-bouche{position:absolute;left:16px;top:71px;width:72px;height:78px;z-index:7;') && !decor.includes('<svg class="bm-coude"'), "tuyau d'une seule pièce de la couleur de la tête, tête au-dessus");
  assert.ok(decor.includes("sc.__gT=attente?1.17:1+0.17*Math.pow(") && decor.includes("function sangBoucle()"), "l'arrière-train grossit avec le sang et rétrécit à la sortie");
  assert.ok(decor.includes("cont.style.getPropertyValue('--bm-chemin')&&cont.style.left"), "le chemin du sang résiste à l'effacement du style par un redessin");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("'<path d=\"'+CORPS_CALICE+' '+BOL_CALICE+'\" fill-rule=\"evenodd\""), "cavité du calice percée dans le métal (transparence réelle sans fond)");
}
{
  // Récipients simplement transparents (Norman, 2026-10-11) : aucun fond sombre, aucune déformation ; la cavité du calice est percée dans le métal.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(!decor.includes("fondVerre") && !decor.includes("bm-f-verre") && !decor.includes("bm-fond-entree") && !decor.includes("--bm-int") && !decor.includes('fill="#12050a" opacity') , "plus aucune déformation ni fond sombre dans les récipients");
  assert.ok(!decor.includes("INT_CHOPE+'\" fill=\"#12050a\"") && decor.includes("function contenant(type,fraction){") && decor.includes("CORPS_CALICE+' '+BOL_CALICE"), "récipients transparents ; cavité du calice percée");
}
{
  // Deuxième rituel : le récipient en attente passe devant la manche de Rincevent.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('.bm-scene[data-source="papier"] .bm-vase.bm-suivant{z-index:5}') && decor.includes('.bm-bras-img{position:absolute;left:-29px;top:96px;transform:translateY(-50%);height:215px;width:auto;max-width:none;z-index:4;'), "récipient en attente devant le bras (z 5 > 4)");
}
{
  // Ventre vert à peine translucide ; boules de sang centrées sur l'axe du tuyau.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('id="bm-g-ventre"') && decor.includes('class="tv" fill="url(#bm-g-ventre)" fill-opacity=".62"') && decor.includes('class="tf" fill="#141a0a"'), "ventre vert translucide posé AU-DESSUS des boules de sang (elles sont vues à travers)");
  assert.ok(decor.includes("top:0;height:calc(var(--th,28px) - 14px);width:var(--bm-cell,11px)"), "boules de sang centrées sur l'axe du ventre");
}
{
  // Texture sur le ventre ; les boules s'arrêtent pile au point noir de l'anus (rien ne dépasse dessous).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('id="bm-tex"') && decor.includes('class="tx" fill="url(#bm-tex)"') && decor.includes('class="tr"'), "texture (granulation + anneaux) sur le ventre vert");
  assert.ok(decor.includes("Lc=(L+3)*K/(K+1)") && decor.includes("'--bm-fk'") && decor.includes("calc(var(--bm-fk,1)*'+pos("), "course des boules limitée : leur avant s'arrête au centre de l'anus");
}
{
  // Banque du sang : une case vide au format des images de son animation (1231 x 923), sans tuyau ni récipient.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("bloodBank:'banque'") && decor.includes('.bm-scene[data-source="banque"]{height:auto!important;aspect-ratio:1231/923;overflow:hidden}'), "case vide au format 1231 x 923");
  const h = d.scene({ id: "bloodBank", sang: 1200000, compte: 3, barre: '<i data-idle-blood-bar-v1="bloodBank"></i>', saigne: true, rang: 4 });
  assert.ok(h.includes('data-source="banque"') && !h.includes("bm-vase") && !h.includes("bm-calice") && h.includes('data-idle-blood-bar-v1="bloodBank"') && h.includes("Sang collecté"), "scène vide : ni récipient ni décor, mais la barre du moteur (horloge) et l'étagère « Sang collecté » restent");
}
{
  // Filet de sang COURBE (plus de gouttes) : de la bouche de Rincevent jusqu'à la surface du liquide, dessiné d'un trait.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('<svg class="bm-jet-fil"') && decor.includes("function filJet(sc,nb)") && decor.includes("' C'+(sx+dx*0.42).toFixed(1)"), "un filet courbé (courbe de Bézier) de la bouche à la surface du liquide");
  assert.ok(decor.includes("ey=124+ch") && decor.includes("filJet(sc,nb);") && decor.includes("@keyframes bmJetFil{") && decor.includes("@keyframes bmJetFin{") && !decor.includes("bm-crachat") && !decor.includes("bmCrX"), "arrivée au niveau du sang (chute), dessiné d'un trait puis la queue rejoint le verre, plus de gouttes");
  assert.ok(decor.includes("var flux=nb>=6,es=sc.querySelectorAll('.bm-eclat');") && decor.includes("w=1.3+0.42*nb"), "plus il y a de sang produit, plus le filet est épais, et il coule en continu à haut niveau");
}
{
  // Le filet touche la bouche (départ plus haut) et dure moins longtemps (0,67 à 1,16 s).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("var sx=91,sy=116.5,") && decor.includes("duree=0.3+0.035*nb") && decor.includes("24%{stroke-dashoffset:0}48%{stroke-dashoffset:0}"), "filet : départ sur la bouche, durée courte");
}
{
  // Plus de tache de sang sur les lèvres (elle était mal faite) : il reste le filet le long du fil et les gouttes sur le menton.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(!decor.includes("bm-levre-sang") && decor.includes('class="bm-filet-fil"') && decor.includes('class="bm-saigne-b"'), "tache des lèvres supprimée, filet et gouttes conservés");
}
{
  // L'anus a le diamètre du tuyau (et non plus 1,28 fois plus large).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("rx=ho[n-1]+0.4,ry=5.4;") && !decor.includes("ho[n-1]*1.28"), "anus au diamètre du tuyau");
}
{
  // Banque du sang : les 21 images de R2 (rincevent/banquedusang/N.webp) sont jouées en boucle dans la case quand le rituel tourne, image 1 fixe sinon.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('<canvas class="bm-banque-cv" width="640" height="480"') && decor.includes("name=rincevent/banquedusang/'+(i+BANQUE_PREMIER-1)+'.webp") && decor.includes("var BANQUE_N=20,BANQUE_PREMIER=2,BANQUE_DUREE=4"), "21 images de R2 dans un canevas de la case");
  assert.ok(decor.includes("function banqueCadre(sc,maintenant)") && decor.includes("resizeWidth:640,resizeHeight:480") && decor.includes("function banqueDemarrer()"), "boucle sans couture à cadence fixe, images réduites en mémoire");
}
{
  // Banque du sang : l'animation dure 4 s et ne se déclenche que quand le niveau se valide (la barre repart de zéro).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("BANQUE_DUREE=4") && decor.includes("pb<sc.__bPb-0.3") && decor.includes("return banqueIndex(ecoule);") && decor.includes("if(!sc.__bt0)return 0;"), "4 secondes, déclenchée à la validation du niveau, image 1 fixe sinon");
}
{
  // Banque du sang : arrêt de 3 s sur l'image 11 (indice 10) où Rincevent est complètement dans le frigo.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("BANQUE_PAUSE=3") && decor.includes("BANQUE_IMAGE_FRIGO=9") && decor.includes("if(e<h+BANQUE_PAUSE)return BANQUE_IMAGE_FRIGO;"), "arrêt de 3 s dans le frigo (fichier 11, indice 9)");
}
{
  // Filet plus fin et départ moins arrondi : tangente de départ presque horizontale, bouts droits.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("w=1.3+0.42*nb") && decor.includes("' C'+(sx+dx*0.42).toFixed(1)") && decor.includes(".bm-jet-fil path{fill:none;stroke-linecap:butt;"), "filet fin, départ droit (pas de bout rond)");
}
{
  // Crachat deux fois plus court (0,33 à 0,58 s).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("duree=0.3+0.035*nb") && decor.includes("bmJetFlux .25s") && decor.includes("bmJetFin .25s"), "durée du crachat divisée par deux");
}
{
  // Banque du sang : filtre de caméra de surveillance (noir et blanc, balayage, vignettage, grain, REC, horloge).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('class="bm-cctv"') && decor.includes("filter:grayscale(1) contrast(1.22)") && decor.includes("@keyframes bmCctvGrain") && decor.includes("@keyframes bmCctvBande") && decor.includes("bm-cctv-heure"), "filtre caméra de surveillance sur la banque du sang");
  assert.ok(decor.includes("animation:bmCctvGrain .5s steps(5) infinite") && decor.includes("@keyframes bmCctvGrain{0%{background-position:0 0}100%{background-position:120px 120px}}") && decor.includes("0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(600%);opacity:0}"), "boucles parfaites (règle 3) : le grain glisse d'une tuile entière, la bande apparaît et disparaît en fondu");
}
{
  // Capacité par paliers : x10 à chaque décade de récipients terminés, sans saut (le seuil tombe pile quand un récipient vient de se terminer).
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("function paliers(id,compte)") && decor.includes("var pal=paliers(opts.id,compte),cap=pal.cap") && decor.includes("var pal=paliers(id,nv),cap=pal.cap,pleins=pal.pleins,fraction=pal.fraction;"), "scène et mise à jour utilisent la capacité par paliers");
  const cas = (compte) => d.scene({ id: "barbedWire", sang: 60000, compte, barre: "", rang: 3 });
  const lit = (h) => ({ pleins: Number(/data-bm-pleins="(\d+)"/.exec(h)[1]), cap: Number(/data-bm-cap="(\d+)"/.exec(h)[1]) });
  assert.deepEqual(lit(cas(1999)), { pleins: 9, cap: 200 }, "juste avant le premier palier : 9 récipients pleins, capacité d'origine");
  assert.deepEqual(lit(cas(2000)), { pleins: 10, cap: 2000 }, "au palier : le 10e vient de se terminer (même nombre de pleins qu'avec l'ancienne règle), capacité x10");
  assert.deepEqual(lit(cas(3999)), { pleins: 10, cap: 2000 }, "un récipient 10 fois plus lent à remplir");
  assert.deepEqual(lit(cas(4000)), { pleins: 11, cap: 2000 }, "puis le suivant");
  assert.deepEqual(lit(cas(19999)), { pleins: 18, cap: 2000 }, "dernier récipient du palier : 18 pleins");
  assert.deepEqual(lit(cas(20000)), { pleins: 19, cap: 20000 }, "palier suivant : x10 encore, 19 pleins (10 + 9)");
  assert.ok(cas(3000).includes("translateY(") && lit(cas(3000)).cap === 2000, "la fraction se calcule avec la capacité du palier");
}
{
  // Le filet de crachat ne dure que pendant les images où les lèvres sont en avant.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("FIL_IMAGE_SANG=19,FIL_IMAGE_SANG_FIN=20") && decor.includes("if(k<FIL_IMAGE_SANG||k>FIL_IMAGE_SANG_FIN){"), "filet limité aux images lèvres en avant");
}
