import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const ui = lireUiComplet();
const morph = lire("public/modules/morph-v1.js");
const agents = fs.readFileSync(new URL("../../AGENTS.md", import.meta.url), "utf8");
/*
 * Règle n°4 d'AGENTS.md (Norman, 2026-10-15) : aucun redessin visible. Le morph ne retire pas ce que les modules ajoutent après le rendu, et tout ce qu'ils animent est remis en état dans la même tâche.
 */
assert.ok(agents.includes("## Règle n°4 (redessin périodique) : aucun redessin visible") && agents.includes("__auditerRedessinIdleV1__"), "la règle est écrite dans AGENTS.md");
/* Le morph : attributs gardés, éléments vivants, blocs gardés */
assert.ok(morph.includes("window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__") && morph.includes("attributsGardes.indexOf(at.name)===-1") && morph.includes("a.closest('[data-morph-vivant]')") && morph.includes("data-morph-garder"), "le morph respecte les ajouts des modules");
/* Le redessin de la page rejoue les fonctions d'animation dans la même tâche */
assert.ok(ui.includes("window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).forEach(function(f){try{f();}catch(_e){}})"), "appel des remises en état après le redessin");
const rafraichir = ui.slice(ui.indexOf("function rafraichirMenuRacineIdleV28_(){"), ui.indexOf("function surveillerEvenementsAventureIdleV1_"));
assert.ok(rafraichir.indexOf("root.innerHTML=contenuMenuIdleV28_(idleEtat);") < rafraichir.indexOf("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "les remises en état viennent juste après le redessin");
assert.ok(!/setTimeout\([^)]*APRES_REDESSIN/.test(rafraichir), "aucune attente entre le redessin et la remise en état");
/* Chaque module qui ajoute des choses à la page s'est inscrit */
const barres = lire("public/modules/barres-actives-v1.js");
assert.ok(barres.includes("data-morph-garder aria-hidden") && /push\('data-actif','data-barre-active-v1','data-style'\)/.test(barres), "barres actives : couche gardée, attributs inscrits");
const perso = lire("public/modules/perso-boutons-v1.js");
assert.ok(perso.includes("noeud.setAttribute('data-morph-garder','')") && perso.includes("push('data-perso-pct-cle')"), "boutons de pourcentage personnalisés gardés");
const ngu = lire("public/modules/ngu-labo-v1.js");
assert.ok(ngu.includes("window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(apresRedessin_)") && ngu.includes("e.__nlTexte=null;") && ngu.includes("dernierComplet=0;\n    tick_();"), "NGU : tuyaux remis à l'état animé dans la même tâche");
const sang = lire("public/modules/sang-rituel-decor-v1.js");
assert.ok(sang.includes('class="bm-tube-fond" data-morph-vivant') && sang.includes('class="bm-sangsue-gl" data-morph-vivant') && sang.includes("push('data-rythme')"), "scène du sang : toile et tracé laissés en place");
/* L'outil de contrôle existe */
const diag = lire("public/modules/diag-fluidite-v1.js");
assert.ok(diag.includes("window.__auditerRedessinIdleV1__=function(menu)") && ui.includes("window.__rafraichirPageIdleV1__=window.__titansRafraichirPageIdleV1__"), "audit du redessin disponible dans la console");
/*
 * Liste des menus redessinés en direct : l'ajout (ou le retrait) d'un menu impose de relire la règle n°4 et de lancer l'audit sur ce menu (voir AGENTS.md), puis de mettre à jour CETTE liste.
 */
const m = /const IDLE_MENUS_VIVANTS_V1=\{([^}]*)\}/.exec(ui);
assert.ok(m, "liste des menus redessinés en direct");
const vivants = m[1].split(",").map((x) => x.split(":")[0].trim()).sort();
assert.deepEqual(vivants, ["beards", "diggers", "hacks", "ngu", "wandoos", "wishes", "yggdrasil"], "menus redessinés en direct : relire la règle n°4 d'AGENTS.md et auditer le nouveau menu (window.__auditerRedessinIdleV1__('menu')) avant de modifier cette liste");
console.log("idle-redessin-invisible-v1: OK");
/* Filet de sécurité « Boss vaincu » : le bandeau figé relance l'état du serveur et redessine, indépendamment des drapeaux de prédiction */
{
  const fn = ui.slice(ui.indexOf("function surveillerVictoireFigeeIdleV1_(bandeau){"), ui.indexOf("function transitionMortBossIdleV61_(){"));
  assert.ok(fn.includes("[3000,6000,10000,15000,20000]") && fn.includes("!bandeau.isConnected") && fn.includes("obtenirEtatSorealIdle(SOREAL_SESSION)") && fn.includes("rendreIdleEtat_({ok:true,joueur:etat.joueur})"), "bandeau Boss vaincu figé : redemande l'état et redessine");
  assert.ok(ui.includes("surveillerVictoireFigeeIdleV1_(overlay);"), "lancé dès que le bandeau est posé");
}
/* Comparaison d'objets : UNE seule fenêtre, premier objet en haut, deuxième dessous (Norman, 2026-10-15) ; elle ne se ferme jamais toute seule (rafraîchie après un redessin du sac ou de la page) */
{
  const compo = ui.slice(ui.indexOf("function composerCorpsComparaisonIdleV1_(corps,firstId,secondId){"), ui.indexOf("function fermerComparaisonObjetAdventureIdleV183_(){"));
  assert.ok(compo.includes('<div class="idle-compare-bloc-v1">\'+firstHtml+\'</div><div class="idle-compare-vs-v1"') && compo.includes("secondHtml+'</div>'"), "les deux fiches dans le même popup");
  const cmp = ui.slice(ui.indexOf("function ouvrirComparaisonObjetAdventureIdleV183_(secondId){"), ui.indexOf("window.__comparerObjetAdventureIdleV183__="));
  assert.ok(!cmp.includes("cloneNode") && !cmp.includes("document.body.appendChild(clone)") && cmp.includes("composerCorpsComparaisonIdleV1_(corps,firstId,second)"), "plus de deuxième popup");
  assert.ok(ui.includes("if(fenetre&&fenetre.classList.contains('idle-compare-v183')&&idleComparaisonIdsV1.length===2){"), "un redessin du sac ne la ferme ni ne la réduit à un objet");
  assert.ok(ui.includes("function restaurerFichesApresRedessinIdleV1_(){") && ui.includes("push(restaurerFichesApresRedessinIdleV1_)"), "un redessin complet de la page la remet en place");
  const css = lire("public/soreal-idle-ui.css");
  assert.ok(css.includes(".idle-compare-vs-v1{") && css.includes("overflow-y:auto") && css.includes(".idle-compare-v183 .soreal-idle-item-popup-drag-v1{position:sticky"), "fenêtre unique qui défile, poignée collée en haut");
}
/* Cadres des rituels du Blood Magic : montée progressive du rang 0 au rang 5, statique et légère */
{
  const sang = lire("public/modules/sang-rituel-decor-v1.js");
  const f = sang.slice(sang.indexOf("function reglesCadresRituels(){"), sang.indexOf("function css(){"));
  assert.ok(f.includes("var fonds=[['#2e0811'") && f.includes("coins=[0,0,0,12,18,26]") && f.includes("content:none!important"), "six rangs de plus en plus sombres, coins croissants, coins du thème générique retirés");
  assert.ok(!/animation:(?!none)|filter:|@keyframes/.test(f), "aucune animation ni filtre : page légère");
  assert.ok(sang.includes("reglesCadresRituels().join('')"), "règles posées");
}
/* Bouton Aventure : un appui = onglet Aventure, page entièrement remontée ; un double appui = Titans (si débloqués) */
{
  const w = ui.slice(ui.indexOf("let idleAventureDernierAppuiV1=0;"), ui.indexOf("function menuIdleCoeurV28_(menu){"));
  assert.ok(w.includes("maintenant-idleAventureDernierAppuiV1<420") && w.includes("titansDebloquesIdleV1_()") && w.includes("window.__vueAventureIdleV1__('titans')") && w.includes("remonterToutEnHautIdleV1_();"), "double appui = Titans, tout appui remonte la page");
  assert.ok(w.indexOf("menuIdleCoeurV28_(menu);\n        if(idleMenuActifV28!=='aventure')return;") > 0, "le premier appui agit tout de suite (aucune attente)");
  assert.ok(ui.includes("window.__menuIdleV28__=\n        menuIdleV28_;") || /window\.__menuIdleV28__=\s*menuIdleV28_;/.test(ui), "les boutons passent par l'enveloppe");
}
/* Un appui sur Aventure depuis un autre menu ramène aux zones, même si l'onglet Titans était mémorisé */
assert.ok(ui.includes("if(idleVueAventureV1==='titans'&&idleMenuActifV28!=='aventure'){\n          idleVueAventureV1='zones';"), "l'onglet Titans mémorisé ne ressort pas à un simple appui");
/* Blood Magic : animations pilotées par événement et par phase calculée (plus jamais « le papier bouge mais ne coupe pas ») */
{
  const sang = lire("public/modules/sang-rituel-decor-v1.js"), morph2 = lire("public/modules/morph-v1.js");
  assert.ok(ui.includes("window.dispatchEvent(new CustomEvent('soreal-rituel-termine',{detail:{id:String(bloodVisual.ritual),faits:faits}}))"), "un événement à chaque rituel rejoué");
  assert.ok(sang.includes("window.addEventListener('soreal-rituel-termine'") && sang.includes("function finDeNiveau(sc,id,src){") && sang.includes("if(n>avant&&!(finRecue[id]&&performance.now()-finRecue[id]<1500))finDeNiveau(sc,id,src);"), "fin de niveau : événement d'abord, variation du chiffre en secours sans doublon");
  assert.ok(sang.includes("function phaseRituelEtat(id){") && sang.includes("var phase=phaseRituelEtat(sc.getAttribute('data-bm-id'));\n  if(phase!=null)return phase;"), "phase calculée, lecture de la barre en secours");
  assert.ok(sang.includes("function animationCss(el){") && sang.includes("var an=animationCss(cible);") && sang.includes("af=animationCss(f)"), "animations CSS choisies par leur nom");
  assert.ok(!/bar\.getAnimations\(\)\[0\]/.test(sang.slice(sang.indexOf("function aligner(sc){"), sang.indexOf("function rythme(sc,id,n,avant){"))), "l'alignement du jet n'utilise plus l'animation de la barre");
  assert.ok(sang.includes('data-morph-classes-gardees=\"^bm-\"') && morph2.includes("data-morph-classes-gardees") && morph2.includes("motifClasses.test(k)"), "les classes bm-* de la scène survivent à un redessin");
  assert.ok(sang.includes("push(function(){if(document.querySelector('.bm-scene'))majVases();})"), "remise en état de la scène dans la même tâche après un redessin");
  assert.ok(agents.includes("soreal-rituel-termine") && agents.includes("phaseRituelEtat"), "principe écrit dans AGENTS.md");
}
/* Hauteur retenue au changement d'onglet : les lignes de la grille du jeu ne s'étirent pas (bannière, menu, barre de vie) */
{
  const css = fs.readFileSync(new URL("../public/soreal-idle-themes.css", import.meta.url), "utf8");
  assert.ok(css.includes("body.soreal-idle-active-v47 .soreal-idle-native-v4{align-content:start}"), "grille du jeu : align-content:start");
}
/* Menu de gauche (PC) : hauteur maximale d'après la place visible, atteint son bas sans défiler la page */
{
  const css = fs.readFileSync(new URL("../public/soreal-idle-themes.css", import.meta.url), "utf8");
  assert.ok(css.includes("max-height:min(calc(100vh - 14px),var(--nav-dispo,100vh))!important"), "menu : hauteur max suit --nav-dispo");
  assert.ok(ui.includes("nav.style.setProperty('--nav-dispo'") && ui.includes("window.addEventListener('scroll',planifier,{passive:true})"), "menu : --nav-dispo recalculée au défilement");
}
/* Sur PC, un clic sur un menu de gauche replace la page en haut : bannière hors écran, barre de stats tout en haut */
{
  assert.ok(ui.includes("function placerMenuEnHautPcIdleV1_(){") && ui.includes("banniere.getBoundingClientRect().bottom+(window.scrollY||0)"), "placement en haut (PC)");
  assert.ok(ui.includes("if(menu!=='aventure'){menuIdleCoeurV28_(menu);placerMenuEnHautPcIdleV1_();return;}") && ui.includes("if(!placerMenuEnHautPcIdleV1_())remonterToutEnHautIdleV1_();"), "tous les menus, Aventure comprise (téléphone : comportement d'avant)");
}
/* Panneaux d'informations : fermés à l'arrivée et refermés au changement de menu */
{
  const meta = lire("public/modules/meta-progression-v130.js") + lirePagesMeta(), ygg = lire("public/modules/yggdrasil-elfes-v1.js");
  assert.ok(ui.includes("function fermerPanneauxInfoIdleV1_(){") && ui.includes("jouerSonMenuIdleV1_();\n        fermerPanneauxInfoIdleV1_();") && ui.includes("      fermerPanneauxInfoIdleV1_();\n") && ui.includes("function menuIdleCoeurV28_(menu){"), "fermés à chaque changement de menu et au chargement");
  assert.ok(meta.includes("localStorage.getItem('soreal_idle_aide_v1_'+cle)==='1'") && ygg.includes("fermerAide:function(){etat.aide=false;}"), "fermés par défaut");
}
