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
  assert.ok(decor.includes("function filGouttes(sc)") && decor.includes("FIL_DUREE/P") && decor.includes("classList.toggle('off',(g%8)>=nb)"), "le sang qui jaillit varie avec ce qui est produit pendant l'animation (1 à 8 gouttes)");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("var flux=nb>=6;") && decor.includes(".bm-coup.bm-flux :is(.bm-crachat,.bm-crachat b,.bm-eclat){animation-iteration-count:infinite"), "haut niveau : le sang coule sans interruption pendant l'animation");
}
{
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes('function planche(ombres)') && decor.includes('.bm-scene[data-source="fil"] .bm-planche{display:block;z-index:6}') && !decor.includes('bm-table-av') && decor.includes("fil:124") && decor.includes("var(--chute,44px)"), "4e rituel : table au premier plan ; le sang tombe jusqu'au liquide du calice (chute calculée) et éclabousse");
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
  assert.ok(decor.includes("function filNAffiche(id,n,sc)") && decor.includes("filAtterri[sc.getAttribute('data-bm-id')]=performance.now()+800;") && decor.includes("var nv=sc.getAttribute('data-source')==='fil'?filNAffiche(id,n,sc):n;") && decor.includes("compte=filNAffiche(opts.id,compte,null);"), "le niveau du calice n'avance qu'à l'arrivée d'une goutte (scène et page)");
}
{
  // Récipients transparents : on voit le fond (bibliothèque, planche) déformé à travers le verre.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(decor.includes("function fondVerre(type,id,rang)") && decor.includes('<filter id="bm-f-verre"') && decor.includes("(ctx?fondVerre(type,ctx.id,ctx.rang):'')") && decor.includes('data-bm-rang="'), "fond vu à travers le verre, déformé");
  assert.ok(!decor.includes('fill="#12050a" opacity=".85"') && !decor.includes('fill="#12050a" opacity=".94"'), "intérieurs des récipients transparents (plus de fond sombre opaque)");
}
{
  // Les anciens accessoires (bougies, grimoires, crânes, fioles, chaînes, runes au bas des scènes) sont supprimés : la bibliothèque du fond les remplace.
  const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
  assert.ok(!decor.includes("function props(") && !decor.includes("bm-props") && !decor.includes("bm-p-livre") && !decor.includes("bm-chaine") && !decor.includes("bm-sym-grimoire"), "anciens accessoires supprimés (plus de code caché)");
}
