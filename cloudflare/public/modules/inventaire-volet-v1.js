/*
 * Inventaire sur téléphone : le volet « Équipement » (Norman, 2026-10-11).
 *
 *  - L'équipement reste à sa place, dans la page, SANS titre, aux cases de la taille de celles du sac : rien ne bouge jamais (aucun changement de hauteur quand on replie ou déplie).
 *  - Dès qu'on DESCEND la page et que l'équipement sort de l'écran par le haut, une languette apparaît sous le bandeau du haut. Une pression TIRE un volet qui s'allonge par-dessus la page, avec les pièces équipées
 *    entièrement visibles (on peut les toucher, fusionner, booster) ; une autre pression le referme. Le volet est posé PAR-DESSUS : il ne pousse pas le sac.
 *  - Quand on remonte et que l'équipement redevient visible à sa place, la languette et le volet disparaissent (et le volet repart fermé).
 *  - Uniquement sur téléphone (largeur ≤ 700 px) : sur ordinateur, rien ne change.
 *
 * Le volet montre une copie des pièces, remise à jour toutes les 400 ms ; les gestes (toucher, glisser) sont portés par le document entier (délégation) et marchent donc aussi sur cette copie.
 *
 *   window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__ = { ouvert(), basculer(), appliquer() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__)return;

/* Le redessin de la page (morph) ne doit pas retirer « data-volet » (posé par ce module sur les colonnes de l'inventaire) : sans cela, chaque redessin faisait SAUTER la mise en page du téléphone jusqu'au passage suivant de la minuterie de 0,4 s (Norman, 2026-10-23). */
(window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]).push('data-volet');

var ouvert=false;
/* Instant où l'équipement est redevenu visible à sa place : le volet ne repart « fermé » qu'après 1,5 s de visibilité continue (un redessin de la page ne doit pas le refermer). */
var visibleDepuis=0;

function telephone(){return (window.innerWidth||document.documentElement.clientWidth||0)<=700;}
function colonnes(){return document.querySelector('.soreal-idle-v151-inventory-columns');}
function volet(c){return c&&c.querySelector('.soreal-idle-v138-equipment-sticky');}
function boite(){return document.getElementById('sorealIdleVoletTiroirV1');}

function basculer(){
  ouvert=!ouvert;
  appliquer();
}

function creerBoite(){
  var b=document.createElement('div');
  b.id='sorealIdleVoletTiroirV1';b.className='soreal-idle-volet-tiroir-v1';
  b.innerHTML='<div class="soreal-idle-volet-panneau-v1"><div class="soreal-idle-volet-contenu-v1"></div></div>'+
    '<button type="button" class="soreal-idle-volet-languette-v1" data-sans-traduction></button>';
  b.querySelector('button').addEventListener('click',basculer);
  document.body.appendChild(b);
  return b;
}

/* Hauteur du bandeau collé en haut (menu + barres) : le volet se pose juste dessous. */
function hauteurBandeau(){
  var h=0;
  ['.soreal-idle-nav-v28','.soreal-idle-hud-v2'].forEach(function(sel){
    var el=document.querySelector(sel);
    if(!el)return;
    var cs=window.getComputedStyle(el);
    if(cs.position!=='sticky'&&cs.position!=='fixed')return;
    var r=el.getBoundingClientRect();
    if(r.height>0)h=Math.max(h,r.bottom);
  });
  return Math.max(0,Math.round(h));
}

function retirer(b){if(b&&b.parentNode)b.parentNode.removeChild(b);}

/* Bouton de la barre de défilement (CSS : --inv-bouton) : sa hauteur suit l'avancement du défilement dans l'inventaire, de la rainure du haut à celle du bas. */
function majBouton(c,haut){
  try{
    if(!c||!c.style||typeof c.style.setProperty!=='function'||typeof c.getBoundingClientRect!=='function')return;
    var r=c.getBoundingClientRect();
    var hb=haut||191;
    var barre=Math.max(140,(window.innerHeight||0)-hb-22);
    var total=Math.max(1,r.height-barre-8);
    var prog=Math.max(0,Math.min(1,(hb+8-r.top)/total));
    /*
     * Repère INVERSÉ (Norman, 2026-10-15 : « je voulais juste inverser le déplacement du repère, qui montait quand on descendait ») : le défilement de la page reste celui du navigateur ; en glissant le doigt vers le bas,
     * la page remonte, et le repère DESCEND maintenant avec le doigt (en haut de la page il est tout en bas de la barre, en bas de la page tout en haut).
     */
    /*
     * Seule l'AMPLITUDE du repère change (Norman, 2026-10-15 : « il va jusqu'en haut de sa barre, mais pas tout en dessous ») : la barre dessinée par la feuille de style mesure 100vh - 191 px - 22 px (--inv-haut n'est jamais
     * posé), alors que le calcul se faisait sur la hauteur du bandeau mesuré, plus petite sur certains téléphones : le repère s'arrêtait avant le bas. Le suivi du défilement (prog) reste exactement le même.
     */
    var barreReelle=Math.max(140,(window.innerHeight||0)-191-22);
    var y=Math.round(32+Math.max(0,barreReelle-86)*(1-prog));
    if(c.__bouton!==y){c.__bouton=y;c.style.setProperty('--inv-bouton',y+'px');}
  }catch(e){}
}

/*
 * Mesuré sur le téléphone de Norman (journal de diagnostic du 2026-10-23) : cet écouteur de défilement forçait une mise en page à chaque événement (copie du HTML de la poupée, puis lecture de scrollHeight). Le défilement n'appelle plus que la partie légère
 * (position du repère et état du volet), au plus une fois par image ; la copie du contenu et la hauteur du panneau restent refaites par la minuterie de 0,4 s et par les actions.
 */
function appliquer(leger){
  var c=colonnes(),v=volet(c),b=boite();
  if(!c||!v||!telephone()){
    retirer(b);ouvert=false;visibleDepuis=0;
    if(c)c.removeAttribute('data-volet');
    return;
  }
  if(c.getAttribute('data-volet')!=='1')c.setAttribute('data-volet','1');
  var haut=hauteurBandeau();
  majBouton(c,haut);
  /* l'équipement est-il sorti de l'écran par le haut ? (on a descendu la page) */
  var sorti=v.getBoundingClientRect().bottom<=haut+6;
  if(!sorti){
    retirer(b);
    if(!visibleDepuis)visibleDepuis=Date.now();
    else if(Date.now()-visibleDepuis>1500)ouvert=false;
    return;
  }
  visibleDepuis=0;
  if(!b)b=creerBoite();
  b.style.top=haut+'px';
  var contenu=b.querySelector('.soreal-idle-volet-contenu-v1');
  var pd=leger===true&&contenu.__html?null:v.querySelector('.soreal-idle-v138-paperdoll');
  if(pd){
    var html=pd.outerHTML;
    if(contenu.__html!==html){contenu.__html=html;contenu.innerHTML=html;}
  }
  var panneau=b.querySelector('.soreal-idle-volet-panneau-v1');
  if(leger!==true||!panneau.style.maxHeight){
    var cible=ouvert?contenu.scrollHeight+'px':'0px';
    if(panneau.style.maxHeight!==cible)panneau.style.maxHeight=cible;
  }
  if(b.getAttribute('data-ouvert')!==(ouvert?'1':'0'))b.setAttribute('data-ouvert',ouvert?'1':'0');
  var l=b.querySelector('button');
  var t=ouvert?'▲ Replier l’équipement':'▼ Équipement';
  if(l.textContent!==t)l.textContent=t;
  l.setAttribute('aria-expanded',ouvert?'true':'false');
}

setInterval(function(){if(!document.hidden)appliquer();},400);
var defilementPrevu=0;
function surDefilement(){
  if(defilementPrevu)return;
  defilementPrevu=requestAnimationFrame(function(){defilementPrevu=0;appliquer(true);});
}
if(typeof window.addEventListener==='function'){
  window.addEventListener('resize',function(){appliquer();});
  window.addEventListener('scroll',surDefilement,{passive:true});
}

window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__={ouvert:function(){return ouvert;},basculer:basculer,appliquer:appliquer};
})();
