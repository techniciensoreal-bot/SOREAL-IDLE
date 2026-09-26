/*
 * SOREAL IDLE — le chiffre « Énergie affectée » gonfle une fois quand on y ajoute de l'énergie (Norman, 2026-09-26) :
 * « il y a tellement de choses à l'écran qu'on ne remarque pas forcément ; un effet de gonflement, juste une fois, pour dire que l'énergie a bien été attribuée ».
 * Le chiffre gonfle quand il AUGMENTE juste après un clic sur +, Cap ou un préréglage (jamais à l'ouverture du menu ni pour un simple redessin).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ALLOC_POP_V1__)return;

var CLASSE='soreal-idle-alloc-pop-v1';
var FENETRE_MS=2500;
var precedent={};
var actionJusqua=0;
var planifie=false;

function style(){
  if(document.getElementById('soreal-idle-alloc-pop-style-v1'))return;
  var st=document.createElement('style');
  st.id='soreal-idle-alloc-pop-style-v1';
  st.textContent=
    '@keyframes sorealIdleAllocPopV1{0%{transform:scale(1)}35%{transform:scale(1.9);color:#8dffb8;text-shadow:0 0 12px rgba(120,255,170,.95)}100%{transform:scale(1)}}'+
    '.'+CLASSE+'{display:inline-block;animation:sorealIdleAllocPopV1 .55s ease-out 1;will-change:transform}'+
    '@media (prefers-reduced-motion:reduce){.'+CLASSE+'{animation:none}}';
  document.head.appendChild(st);
}

function valeur(el){return parseInt(String(el.textContent||'').replace(/[^0-9]/g,''),10)||0;}

function gonfler(el){
  style();
  el.classList.remove(CLASSE);
  void el.offsetWidth;
  el.classList.add(CLASSE);
  el.addEventListener('animationend',function fin(){el.classList.remove(CLASSE);el.removeEventListener('animationend',fin);});
}

function balayer(){
  planifie=false;
  var liste=document.querySelectorAll('.soreal-idle-bt-allocation-v120');
  var maintenant=Date.now();
  for(var i=0;i<liste.length;i++){
    var el=liste[i];
    var id=el.id||('rang'+i);
    var v=valeur(el);
    var avant=precedent[id];
    if(avant!==undefined&&v>avant&&maintenant<actionJusqua)gonfler(el);
    precedent[id]=v;
  }
}

function planifier(){
  if(planifie)return;
  planifie=true;
  (window.requestAnimationFrame||setTimeout)(balayer);
}

document.addEventListener('click',function(ev){
  var b=ev.target&&ev.target.closest?ev.target.closest('.soreal-idle-bt-actions-v120 button,.soreal-idle-bt-presets-v120 button'):null;
  if(b)actionJusqua=Date.now()+FENETRE_MS;
},true);

if(typeof MutationObserver==='function'){
  new MutationObserver(planifier).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
}
window.__SOREAL_IDLE_ALLOC_POP_V1__={balayer:balayer};
})();
