/*
 * Inventaire sur téléphone : volet « Équipement » qu'on ouvre et qu'on ferme (Norman, 2026-10-11) : « enlève le titre ÉQUIPEMENT, ne garde que les pièces dans le cadre ; quand on fait glisser la fenêtre, le casque ne doit jamais passer
 * hors fenêtre ; un bouton dans le bas ferme / ouvre le volet des pièces équipées : on range tranquillement le sac volet fermé, et on l'ouvre pour fusionner ou booster ».
 *
 *  - le volet est collé juste SOUS le bandeau du haut (sa position est mesurée, elle suit la taille réelle du bandeau) : toutes les pièces restent entièrement visibles quand le sac défile ;
 *  - un bouton fixe en bas de l'écran l'ouvre ou le ferme ; le choix est retenu sur l'appareil ;
 *  - uniquement sur téléphone (largeur ≤ 700 px) : sur ordinateur, rien ne change.
 *
 *   window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__ = { ouvert(), basculer(), appliquer() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__)return;

var CLE='soreal_idle_volet_equipement_v1';
var etat='ouvert';
try{if(localStorage.getItem(CLE)==='ferme')etat='ferme';}catch(e){}

function telephone(){return (window.innerWidth||document.documentElement.clientWidth||0)<=700;}
function colonnes(){return document.querySelector('.soreal-idle-v151-inventory-columns');}
function bouton(){return document.getElementById('sorealIdleVoletEquipementV1');}

function libelle(){return etat==='ouvert'?'🛡️ Masquer l’équipement ▾':'🛡️ Afficher l’équipement ▴';}

function basculer(){
  etat=etat==='ouvert'?'ferme':'ouvert';
  try{localStorage.setItem(CLE,etat);}catch(e){}
  appliquer();
}

function creerBouton(){
  var b=document.createElement('button');
  b.type='button';b.id='sorealIdleVoletEquipementV1';b.className='soreal-idle-volet-equip-bouton-v1';
  b.setAttribute('data-sans-traduction','');
  b.addEventListener('click',basculer);
  document.body.appendChild(b);
  return b;
}

/* Hauteur du bandeau collé en haut (menu + barres) : le volet se colle juste dessous. */
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

function appliquer(){
  var c=colonnes(),b=bouton();
  if(!c||!telephone()){
    if(b)b.parentNode.removeChild(b);
    if(c){c.removeAttribute('data-volet');c.style.removeProperty('--inv-haut');}
    return;
  }
  if(!b)b=creerBouton();
  if(c.getAttribute('data-volet')!==etat)c.setAttribute('data-volet',etat);
  var h=hauteurBandeau()+'px';
  if(c.style.getPropertyValue('--inv-haut')!==h)c.style.setProperty('--inv-haut',h);
  var t=libelle();
  if(b.textContent!==t)b.textContent=t;
  b.setAttribute('aria-expanded',etat==='ouvert'?'true':'false');
}

setInterval(function(){if(!document.hidden)appliquer();},400);
if(typeof window.addEventListener==='function')window.addEventListener('resize',appliquer);

window.__SOREAL_IDLE_INVENTAIRE_VOLET_V1__={ouvert:function(){return etat==='ouvert';},basculer:basculer,appliquer:appliquer};
})();
