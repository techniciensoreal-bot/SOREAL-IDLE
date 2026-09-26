/*
 * SOREAL IDLE — cadrage du tutoriel du début (Norman, 2026-09-26) : à chaque page du tutoriel « Norman & Sébastien », le jeu se place tout seul sur le bon
 * menu, fait défiler la page vers ce dont on parle, et pose la fenêtre du tutoriel à l'endroit qui ne le cache pas (mêmes règles sur PC et téléphone,
 * calculées sur les vraies positions à l'écran) :
 *   stats   : Basic Training, les cases Nombre / Attack / Defense… tout en haut, la fenêtre juste en dessous ;
 *   energie : la grande barre verte en haut, la fenêtre juste en dessous ;
 *   barres  : Attaque passive et Blocage visibles dans le bas de l'écran, la fenêtre en haut sans cacher le cadre d'Attaque passive ;
 *   saisie  : le cadre bleu Basic Training tout en haut, la fenêtre sous le bouton « Tout retirer » ;
 *   blocage : Blocage bien visible, la fenêtre juste au-dessus ;
 *   fight   : l'écran Fight Boss, la fenêtre juste en dessous du bouton Fight.
 * PC (écran large) : « stats » montre la barre verte tout en haut puis les cases en dessous ; « energie1 » (première page Énergie) ne bouge rien ; fenêtre
 * centrée comme sur téléphone. Fight Boss (PC et téléphone) : fenêtre juste en dessous du bouton Fight.
 * Les pages sans cadrage ne bougent rien. Une fenêtre déplacée à la main n'est plus replacée avant la page suivante.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_TUTO_CADRAGE_V1__)return;

var COURANT=null;/* {nom, racine, ctx} */
var MINUTEUR=0;
var ATTENTE=0;

function $(sel,parent){return (parent||document).querySelector(sel);}

/* Bas de la barre de menus (elle reste collée en haut) + petite marge : tout ce qui doit rester visible commence dessous. */
function hautSur(){
  var nav=$('.soreal-idle-nav-v28');
  if(!nav)return 8;
  var top=parseFloat(getComputedStyle(nav).top);
  return (isFinite(top)?top:0)+nav.offsetHeight+6;
}

/* Écran large : PC / tablette. */
function estLarge(){return (window.innerWidth||document.documentElement.clientWidth||0)>=700;}

function hauteurFenetre(){return window.innerHeight||document.documentElement.clientHeight||700;}

/* Fait défiler la page pour amener le haut de l'élément à `y` (pixels depuis le haut de l'écran). */
function amenerEn(elt,y){
  if(!elt)return;
  window.scrollBy(0,elt.getBoundingClientRect().top-y);
}

/* Si la fenêtre est plus haute que la place disponible, son texte défile (au lieu de recouvrir ce dont elle parle). */
function limiterHauteur(racine,disponible){
  var corps=racine.querySelector('.soreal-idle-tuto-flottant-corps-v1');
  if(!corps)return;
  corps.style.maxHeight='';
  var exces=racine.offsetHeight-disponible;
  if(exces>0){corps.style.boxSizing='border-box';corps.style.maxHeight=Math.max(60,corps.offsetHeight-exces)+'px';}
}

function poser(racine,top){
  var haut=hauteurFenetre(),h=racine.offsetHeight||160,w=racine.offsetWidth||300;
  var t=Math.max(8,Math.min(haut-h-8,Math.round(top)));
  racine.style.top=t+'px';
  /* Centrée, sur PC comme sur téléphone (mêmes endroits). */
  var large=window.innerWidth||document.documentElement.clientWidth||400;
  racine.style.left=Math.max(8,Math.round((large-w)/2))+'px';
}

/* Ce qu'il faut pour chaque cadrage : le menu, les éléments à attendre, puis la mise en place. */
var CADRAGES={
  stats:{
    menu:'entrainement',
    pret:function(){return $('.soreal-idle-summary-grid-v28')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      var g=$('.soreal-idle-summary-grid-v28');
      /* PC : la barre verte tout en haut, les cases en dessous ; téléphone : les cases tout en haut. */
      var panneau=$('.soreal-idle-energy-panel-v34');
      amenerEn(estLarge()&&panneau?panneau:g,hautSur());
      poser(r,g.getBoundingClientRect().bottom+8);
    }
  },
  /* Première page Énergie : sur PC on ne bouge rien (la fenêtre est déjà sous les cases, la barre verte est en haut) ; sur téléphone : sous la barre verte. */
  energie1:{
    menu:null,
    pret:function(){return $('.soreal-idle-energy-panel-v34')&&$('.soreal-idle-energybar-wrap-v11')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      if(estLarge())return;
      amenerEn($('.soreal-idle-energy-panel-v34'),hautSur());
      poser(r,$('.soreal-idle-energybar-wrap-v11').getBoundingClientRect().bottom+8);
    },
    immobile:function(){return estLarge();}
  },
  energie:{
    menu:null,
    pret:function(){return $('.soreal-idle-energy-panel-v34')&&$('.soreal-idle-energybar-wrap-v11')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      amenerEn($('.soreal-idle-energy-panel-v34'),hautSur());
      poser(r,$('.soreal-idle-energybar-wrap-v11').getBoundingClientRect().bottom+8);
    }
  },
  barres:{
    menu:'entrainement',
    pret:function(){return $('.soreal-idle-bt-panel-v120.attack .soreal-idle-bt-row-v120')&&$('.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-row-v120')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      var passive=$('.soreal-idle-bt-panel-v120.attack .soreal-idle-bt-row-v120');
      var blocage=$('.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-row-v120');
      var haut=hautSur(),V=hauteurFenetre(),P=r.offsetHeight||160;
      var rp=passive.getBoundingClientRect(),rb=blocage.getBoundingClientRect();
      var distance=rb.bottom-rp.top;
      if(V-8-distance>=haut+P+8)window.scrollBy(0,rb.bottom-(V-8));/* les deux barres dans le bas de l'écran */
      else window.scrollBy(0,rp.top-(haut+P+8));/* écran trop petit : au moins Attaque passive, juste sous la fenêtre */
      poser(r,haut);
    }
  },
  saisie:{
    menu:'entrainement',
    pret:function(){return $('.soreal-idle-page-head-v28')&&$('.soreal-idle-bt-toolbar-v120 button.clear')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      amenerEn($('.soreal-idle-page-head-v28'),hautSur());
      poser(r,$('.soreal-idle-bt-toolbar-v120 button.clear').getBoundingClientRect().bottom+8);
    }
  },
  blocage:{
    menu:'entrainement',
    pret:function(){return $('.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-row-v120')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      var ligne=$('.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-row-v120');
      var haut=hautSur(),V=hauteurFenetre(),P=r.offsetHeight||160;
      window.scrollBy(0,ligne.getBoundingClientRect().bottom-(V-8));/* Blocage en bas de l'écran… */
      var top=ligne.getBoundingClientRect().top;
      if(top-P-8<haut)window.scrollBy(0,top-(haut+P+8));/* …sauf si la fenêtre n'a pas la place au-dessus */
      poser(r,ligne.getBoundingClientRect().top-P-8);
    }
  },
  fight:{
    menu:'combat',
    pret:function(){return $('.soreal-idle-page-head-v28')&&$('#sorealIdleBossStartV100')&&$('.soreal-idle-nav-v28');},
    placer:function(r){
      var cadre=$('.soreal-idle-page-head-v28'),bouton=$('#sorealIdleBossStartV100');
      var haut=hautSur(),V=hauteurFenetre();
      r.querySelectorAll&&limiterHauteur(r,9999);
      var P=r.offsetHeight||160;
      /* Le cadre Fight Boss en haut de l'écran ; si la fenêtre (sous le bouton Fight) déborde en bas, on remonte la page, sans faire sortir le bouton par le haut. */
      amenerEn(cadre,haut);
      var rb=bouton.getBoundingClientRect();
      var debord=rb.bottom+8+P-(V-8);
      if(debord>0)window.scrollBy(0,Math.min(debord,Math.max(0,rb.top-haut)));
      rb=bouton.getBoundingClientRect();
      /* Page trop courte pour remonter davantage : le texte de la fenêtre défile dans la place restante. */
      limiterHauteur(r,V-8-(rb.bottom+8));
      poser(r,rb.bottom+8);
    }
  }
};

function arreter(){
  if(ATTENTE){clearTimeout(ATTENTE);ATTENTE=0;}
}

/* Attend que la page voulue soit affichée (le changement de menu redessine l'écran), puis place tout. */
function appliquer(nom,racine,ctx){
  arreter();
  COURANT=null;
  var cadrage=nom&&CADRAGES[nom];
  if(!cadrage||!racine)return;
  COURANT={nom:nom,racine:racine,ctx:ctx||{}};
  racine.removeAttribute('data-cadre-deplace');
  limiterHauteur(racine,99999);/* enlève une limite de hauteur posée par un cadrage précédent */
  var essais=0;
  function tenter(){
    ATTENTE=0;
    if(!COURANT||COURANT.nom!==nom||!document.body.contains(racine))return;
    var menuOk=!cadrage.menu||!ctx||typeof ctx.menuActif!=='function'||ctx.menuActif()===cadrage.menu;
    if(!menuOk&&essais===0&&ctx&&typeof ctx.allerMenu==='function')ctx.allerMenu(cadrage.menu);
    essais++;
    if(menuOk&&cadrage.immobile&&cadrage.immobile()){
      return;/* rien ne bouge sur cette page */
    }
    if(menuOk&&cadrage.pret()){
      /* La première passe fait défiler et place ; les suivantes corrigent si la page a bougé. */
      cadrage.placer(racine);
      /* Passes de contrôle : la hauteur de la fenêtre et la page finissent de se poser juste après (polices, redessin) ; chaque passe est sans effet si tout est déjà en place. */
      [16,250,700].forEach(function(delai){
        setTimeout(function(){
          if(COURANT&&COURANT.nom===nom&&document.body.contains(racine)&&racine.getAttribute('data-cadre-deplace')!=='1'&&cadrage.pret())cadrage.placer(racine);
        },delai);
      });
      return;
    }
    if(essais<40)ATTENTE=setTimeout(tenter,60);
  }
  tenter();
}

/* Un changement de taille (rotation du téléphone, fenêtre) : on replace, sauf si la fenêtre a été déplacée à la main. */
window.addEventListener('resize',function(){
  if(MINUTEUR)clearTimeout(MINUTEUR);
  MINUTEUR=setTimeout(function(){
    MINUTEUR=0;
    if(!COURANT||!document.body.contains(COURANT.racine)||COURANT.racine.getAttribute('data-cadre-deplace')==='1')return;
    var c=CADRAGES[COURANT.nom];
    if(c&&(!c.pret||c.pret()))c.placer(COURANT.racine);
  },150);
});
document.addEventListener('pointerdown',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('.soreal-idle-tuto-flottant-drag-v1'):null;
  if(t&&COURANT&&COURANT.racine)COURANT.racine.setAttribute('data-cadre-deplace','1');
},true);
document.addEventListener('touchstart',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('.soreal-idle-tuto-flottant-drag-v1'):null;
  if(t&&COURANT&&COURANT.racine)COURANT.racine.setAttribute('data-cadre-deplace','1');
},true);

window.__SOREAL_IDLE_TUTO_CADRAGE_V1__={appliquer:appliquer,arreter:arreter,cadrages:Object.keys(CADRAGES)};
})();
