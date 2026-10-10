/*
 * SOREAL IDLE — lecteur flottant des chroniques de boss (Norman, 2026-10-10 : « dans les chroniques, pour chaque boss, quand on clique sur la fiche, un bouton « lire les chroniques à partir d'ici », pour pouvoir
 * tout écouter en plusieurs fois ; un petit lecteur flottant pour faire pause, stop (ça ferme le lecteur), le bouton pause devient play quand c'est en pause ; il peut être déplacé où on veut sur l'écran »).
 *
 * La file contient les chroniques des boss DÉJÀ DÉCOUVERTS (la liste du Bestiaire envoyée par le serveur ne contient jamais les autres : règle n°2, aucun total révélateur), de celui de la fiche jusqu'au dernier,
 * dans l'ordre des numéros. Chaque chronique est lue par le moteur vocal (modules/tutorial-tts-v202.js : readText, pause, resume, stop) ; quand une lecture se termine normalement, la suivante démarre. Une lecture
 * interrompue de l'extérieur (autre narration, voix coupée) ou en échec ferme le lecteur au lieu d'enchaîner à tort.
 *
 *   window.__SOREAL_IDLE_LECTEUR_CHRONIQUES_V1__ = { demarrer(numeroDepart), pause(), reprendre(), stop(), file(numeroDepart), actif() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_LECTEUR_CHRONIQUES_V1__)return;

var CLE_POS='soreal_idle_lecteur_chroniques_pos_v1';
var ID='sorealIdleLecteurChroniquesV1';
var etat={actif:false,file:[],index:0,jeton:0,pause:false};

function tts(){return window.__SOREAL_IDLE_TUTORIAL_TTS_V209__||null;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* Chroniques des boss découverts, du numéro de départ au dernier, dans l'ordre. */
function construireFile(depart){
  var e=null;
  try{e=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){}
  var liste=e&&e.bestiaire&&Array.isArray(e.bestiaire.entrees)?e.bestiaire.entrees:[];
  var d=Math.max(0,Math.floor(Number(depart))||0);
  return liste.filter(function(x){
    return x&&x.source==='boss'&&x.decouvert&&Math.floor(Number(x.numero))>=d&&String(x.description||'').trim();
  }).map(function(x){return {numero:Math.floor(Number(x.numero)),nom:String(x.nom||'Boss'),description:String(x.description||'')};})
    .sort(function(a,b){return a.numero-b.numero;});
}

function styles(){
  if(document.getElementById(ID+'Style'))return;
  var s=document.createElement('style');s.id=ID+'Style';
  s.textContent='#'+ID+'{position:fixed;z-index:99991;width:250px;max-width:calc(100vw - 16px);box-sizing:border-box;padding:8px 10px 10px;border-radius:14px;color:#f2f6ff;font-family:"Russo One","Arial Black",Impact,sans-serif;background:linear-gradient(180deg,#2a2f66,#14173d);border:2px solid #ffd24a;box-shadow:0 0 0 2px #05071a,0 10px 28px rgba(0,0,0,.6),0 0 18px rgba(255,210,74,.3);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}'+
    '#'+ID+'.glisse{cursor:grabbing}'+
    '#'+ID+' .lc-poignee-v1{display:flex;align-items:center;justify-content:center;gap:4px;height:10px;margin:-2px 0 4px}'+
    '#'+ID+' .lc-poignee-v1 i{display:block;width:5px;height:5px;border-radius:50%;background:rgba(255,210,74,.7)}'+
    '#'+ID+' .lc-titre-v1{font:400 15px/1 "Bangers","Russo One",Impact,sans-serif;letter-spacing:.06em;color:#ffd24a;text-shadow:0 2px 0 #6a3d00}'+
    '#'+ID+' .lc-boss-v1{margin:5px 0 2px;font-size:12px;line-height:1.2;color:#dfe7ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
    '#'+ID+' .lc-compte-v1{font-size:11px;color:#9fb0e6}'+
    '#'+ID+' .lc-boutons-v1{display:flex;gap:8px;margin-top:8px}'+
    '#'+ID+' button{flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 8px;border:2px solid #05071a;border-radius:10px;font:400 13px/1 "Russo One","Arial Black",sans-serif;letter-spacing:.04em;color:#2a1700;background:linear-gradient(180deg,#ffe58a,#ffd24a 50%,#f2a900);box-shadow:0 3px 0 #7a4b00;cursor:pointer;touch-action:manipulation}'+
    '#'+ID+' button.lc-stop-v1{color:#fff;background:linear-gradient(180deg,#ff9a8f,#e5483f 55%,#b52a22);box-shadow:0 3px 0 #6a0f0a}'+
    '#'+ID+' button:active{transform:translateY(2px);box-shadow:none}'+
    '#'+ID+' button svg{width:13px;height:13px;flex:0 0 auto}'+
    '#'+ID+' button[data-etat="pause"] .lc-ico-play-v1,#'+ID+' button[data-etat="play"] .lc-ico-pause-v1{display:none}'+
    '.soreal-idle-chro-suite-v1{display:inline-flex;align-items:center;gap:7px;margin:8px 0 0 8px;padding:7px 12px;border:1px solid rgba(255,210,74,.55);border-radius:10px;background:rgba(255,210,74,.14);color:#ffe9a8;font:800 12px/1.1 system-ui,sans-serif;cursor:pointer;touch-action:manipulation}'+
    '.soreal-idle-chro-suite-v1 svg{width:12px;height:12px;flex:0 0 auto}';
  document.head.appendChild(s);
}

var ICO_PLAY='<svg class="lc-ico-play-v1" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 L13.5 8 L4 13.5 Z" fill="currentColor"/></svg>';
var ICO_PAUSE='<svg class="lc-ico-pause-v1" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/></svg>';
var ICO_STOP='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor"/></svg>';

function lecteur(){return document.getElementById(ID);}

function majAffichage(){
  var el=lecteur();
  if(!el)return;
  var e=etat.file[etat.index];
  var nom=el.querySelector('.lc-boss-v1'),compte=el.querySelector('.lc-compte-v1'),bp=el.querySelector('.lc-pause-v1');
  if(nom)nom.innerHTML='<span data-sans-traduction>#'+esc(e?e.numero:'')+' · '+esc(e?e.nom:'')+'</span>';
  if(compte)compte.innerHTML='Chronique <b>'+(etat.index+1)+'</b> sur <b>'+etat.file.length+'</b>';
  if(bp){
    var enPause=etat.pause;
    bp.setAttribute('data-etat',enPause?'play':'pause');
    bp.setAttribute('aria-label',enPause?'Reprendre la lecture':'Mettre en pause');
    var t=bp.querySelector('.lc-pause-txt-v1');
    if(t)t.textContent=enPause?'Play':'Pause';
  }
}

/* Position : mémorisée sur l'appareil, toujours ramenée dans l'écran. */
function placer(el,x,y){
  var w=el.offsetWidth||250,h=el.offsetHeight||110;
  var X=Math.max(4,Math.min((window.innerWidth||800)-w-4,x));
  var Y=Math.max(4,Math.min((window.innerHeight||600)-h-4,y));
  el.style.left=X+'px';el.style.top=Y+'px';el.style.right='auto';el.style.bottom='auto';
  return {x:X,y:Y};
}
function rendreDeplacable(el){
  var depart=null;
  el.addEventListener('pointerdown',function(ev){
    if(ev.target&&ev.target.closest&&ev.target.closest('button'))return;
    var r=el.getBoundingClientRect();
    depart={dx:ev.clientX-r.left,dy:ev.clientY-r.top,id:ev.pointerId};
    try{el.setPointerCapture(ev.pointerId);}catch(_e){}
    el.classList.add('glisse');
    ev.preventDefault();
  });
  el.addEventListener('pointermove',function(ev){
    if(!depart||ev.pointerId!==depart.id)return;
    placer(el,ev.clientX-depart.dx,ev.clientY-depart.dy);
  });
  function fin(ev){
    if(!depart||(ev&&ev.pointerId!==depart.id))return;
    depart=null;
    el.classList.remove('glisse');
    try{var r=el.getBoundingClientRect();localStorage.setItem(CLE_POS,JSON.stringify({x:Math.round(r.left),y:Math.round(r.top)}));}catch(_e){}
  }
  el.addEventListener('pointerup',fin);
  el.addEventListener('pointercancel',fin);
  /* Écouteur retiré à la fermeture du lecteur (audit du 2026-10-10, IDLE-AUDIT-FE-009) : un par lecture lancée s'accumulait sur window. */
  var surRedimension=function(){var r=el.getBoundingClientRect();placer(el,r.left,r.top);};
  window.addEventListener('resize',surRedimension);
  el.__retirerRedimension=function(){window.removeEventListener('resize',surRedimension);};
}

function afficher(){
  styles();
  fermerAffichage();
  var el=document.createElement('div');
  el.id=ID;el.setAttribute('role','region');el.setAttribute('aria-label','Lecteur des chroniques');
  el.innerHTML='<div class="lc-poignee-v1" aria-hidden="true"><i></i><i></i><i></i></div>'+
    '<div class="lc-titre-v1">Chroniques de boss</div>'+
    '<div class="lc-boss-v1"></div><div class="lc-compte-v1"></div>'+
    '<div class="lc-boutons-v1">'+
      '<button type="button" class="lc-pause-v1" data-etat="pause" aria-label="Mettre en pause">'+ICO_PAUSE+ICO_PLAY+'<span class="lc-pause-txt-v1">Pause</span></button>'+
      '<button type="button" class="lc-stop-v1" aria-label="Arrêter et fermer le lecteur">'+ICO_STOP+'<span>Stop</span></button>'+
    '</div>';
  document.body.appendChild(el);
  var pos=null;
  try{pos=JSON.parse(localStorage.getItem(CLE_POS)||'null');}catch(_e){}
  if(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.y))placer(el,pos.x,pos.y);
  else placer(el,(window.innerWidth||800)-262,(window.innerHeight||600)-170);
  rendreDeplacable(el);
  el.querySelector('.lc-pause-v1').addEventListener('click',function(){if(etat.pause)reprendre();else pause();});
  el.querySelector('.lc-stop-v1').addEventListener('click',stop);
  majAffichage();
}
function fermerAffichage(){
  var el=lecteur();
  if(el&&typeof el.__retirerRedimension==='function')el.__retirerRedimension();
  if(el&&el.parentNode)el.parentNode.removeChild(el);
}

function terminer(){
  etat.actif=false;etat.pause=false;etat.jeton+=1;
  fermerAffichage();
}

function lireCourante(){
  if(!etat.actif)return;
  var t=tts();
  var e=etat.file[etat.index];
  if(!t||!e){terminer();return;}
  majAffichage();
  var jeton=etat.jeton+=1;
  var texte=typeof t.composerChronique==='function'?t.composerChronique(e.nom,e.description):e.nom+'. '+e.description;
  var demarre=t.readText(texte,null,function(ok){
    if(jeton!==etat.jeton||!etat.actif)return;
    /* Lecture arrivée à son terme : on enchaîne ; interrompue de l'extérieur ou en échec : on ferme le lecteur. */
    if(ok!==true){terminer();return;}
    setTimeout(function(){
      if(jeton!==etat.jeton||!etat.actif)return;
      etat.index+=1;
      if(etat.index>=etat.file.length){terminer();return;}
      lireCourante();
    },350);
  });
  /* La voix refuse de démarrer sans appeler le rappel (voix indisponible) : on ferme le lecteur au lieu de le laisser ouvert (audit du 2026-10-10, GP-011). */
  if(!demarre&&jeton===etat.jeton){terminer();return;}
  if(etat.pause&&typeof t.pause==='function')t.pause();
}

function demarrer(numeroDepart){
  var t=tts();
  if(!t||typeof t.readText!=='function')return false;
  var file=construireFile(numeroDepart);
  if(!file.length)return false;
  if(etat.actif){etat.jeton+=1;try{t.stop();}catch(_e){}}
  etat.file=file;etat.index=0;etat.actif=true;etat.pause=false;
  afficher();
  lireCourante();
  return true;
}
function pause(){
  var t=tts();
  if(!etat.actif)return false;
  etat.pause=true;
  if(t&&typeof t.pause==='function')t.pause();
  majAffichage();
  return true;
}
function reprendre(){
  var t=tts();
  if(!etat.actif)return false;
  etat.pause=false;
  if(t&&typeof t.resume==='function')t.resume();
  majAffichage();
  return true;
}
function stop(){
  var t=tts();
  var etaitActif=etat.actif;
  terminer();
  if(etaitActif&&t&&typeof t.stop==='function'){try{t.stop();}catch(_e){}}
  return etaitActif;
}

/* Bouton « Lire les chroniques à partir d'ici » de la fiche d'un boss. */
document.addEventListener('click',function(ev){
  var b=ev.target&&ev.target.closest?ev.target.closest('[data-lire-chroniques-depuis]'):null;
  if(!b)return;
  ev.preventDefault();ev.stopPropagation();
  var n=Math.floor(Number(b.getAttribute('data-lire-chroniques-depuis')))||0;
  try{if(typeof window.__fermerBossCollectionIdleV1__==='function')window.__fermerBossCollectionIdleV1__();}catch(_e){}
  demarrer(n);
},true);

styles();
window.__SOREAL_IDLE_LECTEUR_CHRONIQUES_V1__={demarrer:demarrer,pause:pause,reprendre:reprendre,stop:stop,file:construireFile,actif:function(){return etat.actif;}};
})();
