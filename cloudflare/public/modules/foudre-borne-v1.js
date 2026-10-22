/*
 * SOREAL IDLE — la foudre frappe l'écran de la borne d'arcade (Norman, 2026-10-22 : « l'effet d'interférence pour Wandoos quand il y a de l'orage, il le faut aussi pour la borne d'arcade »).
 *
 * Quand un éclair de l'orage tombe (événement `soreal-eclair-v1`, modules/orage-v1.js) et que l'écran de la borne (le cadre du duel du menu Combat de boss) est affiché : une interférence (image qui se déchire, saute, change de teinte, barres blanches)
 * puis tout reprend normalement. Animations du navigateur (Web Animations) : elles ne dépendent d'aucune classe que le redessin de la page pourrait retirer ; le calque de barres est gardé par le redessin (règle n°4) et retiré à la fin.
 * Même film que l'écran de Wandoos (modules/wandoos-retro-v1.js). Aucun effet avec « réduire les animations ».
 *   window.__SOREAL_IDLE_FOUDRE_BORNE_V1__ = { frapper(element) -> bool, cible() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_FOUDRE_BORNE_V1__)return;

var KEYFRAMES=[
  {transform:'translate(0,0) skewX(0)',filter:'none',offset:0},
  {transform:'translate(-2.4%,0) skewX(-5deg)',filter:'brightness(3.2) contrast(1.8) saturate(.2)',offset:.06},
  {transform:'translate(3%,-1%) skewX(4deg)',filter:'brightness(1.8) contrast(2) hue-rotate(60deg)',offset:.14},
  {transform:'translate(-1.2%,1.5%) skewX(0)',filter:'brightness(2.4) contrast(1.4) saturate(.1)',offset:.22},
  {transform:'translate(1.6%,0) skewX(2deg)',filter:'brightness(.45) contrast(2.2) hue-rotate(-50deg)',offset:.32},
  {transform:'translate(-.8%,.6%) skewX(-1deg)',filter:'brightness(1.5) contrast(1.6)',offset:.46},
  {transform:'translate(.4%,0) skewX(0)',filter:'brightness(.8) contrast(1.2)',offset:.64},
  {transform:'translate(0,0) skewX(0)',filter:'none',offset:1}
];

function reduit_(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}

function style_(){
  if(document.getElementById('soreal-idle-foudre-borne-style'))return;
  var s=document.createElement('style');s.id='soreal-idle-foudre-borne-style';
  s.textContent='.fb-parasites{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden;mix-blend-mode:screen}'+
    '.fb-parasites i{position:absolute;display:block;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85) 20%,rgba(255,255,255,.55) 70%,transparent);box-shadow:0 0 .6em rgba(255,255,255,.7)}';
  (document.head||document.documentElement).appendChild(s);
}

/* L'écran de la borne : le cadre du duel, seulement s'il est réellement visible. */
function cible(){
  var e=document.querySelector('.soreal-idle-duel-v41');
  if(!e||!e.isConnected)return null;
  var r=e.getBoundingClientRect();
  if(!(r.width>40&&r.height>40)||r.bottom<0||r.top>(window.innerHeight||0))return null;
  return e;
}

function frapper(el){
  if(!el||!el.animate||reduit_())return false;
  try{el.animate(KEYFRAMES,{duration:620,easing:'steps(14,end)'});}catch(_e){return false;}
  style_();
  var nuage=document.createElement('div');
  nuage.className='fb-parasites';nuage.setAttribute('data-morph-garder','');nuage.setAttribute('aria-hidden','true');
  var barres='';
  for(var i=0;i<8;i++){barres+='<i style="top:'+Math.round(4+Math.random()*88)+'%;height:'+(1+Math.round(Math.random()*5))+'%;left:'+Math.round(Math.random()*30)+'%;width:'+(55+Math.round(Math.random()*45))+'%"></i>';}
  nuage.innerHTML=barres;
  el.appendChild(nuage);
  try{nuage.animate([{opacity:1},{opacity:.2},{opacity:.9},{opacity:.1},{opacity:.6},{opacity:0}],{duration:560,easing:'steps(6,end)',fill:'forwards'});}catch(_e){}
  setTimeout(function(){if(nuage.parentNode)nuage.parentNode.removeChild(nuage);},640);
  return true;
}

if(typeof window.addEventListener==='function')window.addEventListener('soreal-eclair-v1',function(){try{frapper(cible());}catch(_e){}});

window.__SOREAL_IDLE_FOUDRE_BORNE_V1__={frapper:frapper,cible:cible};
})();
