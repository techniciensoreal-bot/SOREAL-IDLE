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
function mesuresBarre(c,haut){
  var r=c.getBoundingClientRect();
  var hb=haut||191;
  var barre=Math.max(140,(window.innerHeight||0)-hb-22);
  return {r:r,hb:hb,barre:barre,total:Math.max(1,r.height-barre-8)};
}
function majBouton(c,haut){
  try{
    if(!c||!c.style||typeof c.style.setProperty!=='function'||typeof c.getBoundingClientRect!=='function')return;
    var r=c.getBoundingClientRect();
    var hb=haut||191;
    var barre=Math.max(140,(window.innerHeight||0)-hb-22);
    var total=Math.max(1,r.height-barre-8);
    var prog=Math.max(0,Math.min(1,(hb+8-r.top)/total));
    var y=Math.round(32+Math.max(0,barre-86)*prog);
    if(c.__bouton!==y){c.__bouton=y;c.style.setProperty('--inv-bouton',y+'px');}
  }catch(e){}
}

function appliquer(){
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
  var pd=v.querySelector('.soreal-idle-v138-paperdoll');
  if(pd){
    var html=pd.outerHTML;
    if(contenu.__html!==html){contenu.__html=html;contenu.innerHTML=html;}
  }
  var panneau=b.querySelector('.soreal-idle-volet-panneau-v1');
  var cible=ouvert?contenu.scrollHeight+'px':'0px';
  if(panneau.style.maxHeight!==cible)panneau.style.maxHeight=cible;
  if(b.getAttribute('data-ouvert')!==(ouvert?'1':'0'))b.setAttribute('data-ouvert',ouvert?'1':'0');
  var l=b.querySelector('button');
  var t=ouvert?'▲ Replier l’équipement':'▼ Équipement';
  if(l.textContent!==t)l.textContent=t;
  l.setAttribute('aria-expanded',ouvert?'true':'false');
}

/*
 * Glisser sur la barre (Norman, 2026-10-15 : « le repère bouge dans le mauvais sens : quand on remonte, il descend et inversement »). La barre n'était qu'une zone de défilement ordinaire : en glissant le doigt vers le bas, la
 * PAGE descend avec le doigt, donc le repère MONTAIT. Comme sur une vraie barre de défilement, le repère suit maintenant le doigt : glisser vers le bas fait descendre le repère (la page défile vers le bas), glisser vers le haut le
 * fait monter. Le déplacement de la page est proportionnel à celui du repère (course du repère = hauteur de la barre moins 86 px, voir majBouton).
 */
var railGeste=null;
function surLaBarre(ev,c){
  var t=ev.touches&&ev.touches[0];
  if(!t||!c)return null;
  var m=mesuresBarre(c,hauteurBandeau());
  var haut=Math.max(m.r.top,m.hb+8);
  if(t.clientX<m.r.right-34||t.clientX>m.r.right+6)return null;
  if(t.clientY<haut||t.clientY>haut+m.barre)return null;
  return m;
}
if(typeof document.addEventListener==='function'){
document.addEventListener('touchstart',function(ev){
  railGeste=null;
  if(!telephone()||!ev.touches||ev.touches.length!==1)return;
  var c=colonnes();
  if(!c||c.getAttribute('data-volet')!=='1')return;
  var m=surLaBarre(ev,c);
  if(!m)return;
  railGeste={y0:ev.touches[0].clientY,s0:window.pageYOffset||document.documentElement.scrollTop||0,ratio:m.total/Math.max(1,m.barre-86)};
},{passive:true,capture:true});
document.addEventListener('touchmove',function(ev){
  if(!railGeste||!ev.touches||!ev.touches.length)return;
  ev.preventDefault();
  var dy=ev.touches[0].clientY-railGeste.y0;
  window.scrollTo(0,Math.max(0,railGeste.s0+dy*railGeste.ratio));
},{passive:false,capture:true});
['touchend','touchcancel'].forEach(function(n){document.addEventListener(n,function(){railGeste=null;},{passive:true,capture:true});});
}

setInterval(function(){if(!document.hidden)appliquer();},400);
if(typeof window.addEventListener==='function'){
  window.addEventListener('resize',appliquer);
  window.addEventListener('scroll',appliquer,{passive:true});
}

window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__={ouvert:function(){return ouvert;},basculer:basculer,appliquer:appliquer};
})();
