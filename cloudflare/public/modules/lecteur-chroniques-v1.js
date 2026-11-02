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
var CLE_MINI='soreal_idle_lecteur_chroniques_mini_v1';   /* réduit en petite enceinte : '1' (Norman, 2026-11-01), préférence liée au compte */
var ID='sorealIdleLecteurChroniquesV1';
var etat={actif:false,file:[],index:0,jeton:0,pause:false,intro:''};

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
  }).map(function(x){return {numero:Math.floor(Number(x.numero)),nom:String(x.nom||'Boss'),description:String(x.description||''),nomParle:String(x.nomParle||''),histoireParlee:String(x.histoireParlee||'')};})
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
    '#'+ID+' .lc-boutons-v1{gap:6px}#'+ID+' .lc-boutons-v1 button{padding:6px 4px}#'+ID+' .lc-boutons-v1 button span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}#'+ID+' .lc-boutons-v1 button:disabled{opacity:.4;pointer-events:none}'+
    '#'+ID+' button[data-etat="pause"] .lc-ico-play-v1,#'+ID+' button[data-etat="play"] .lc-ico-pause-v1{display:none}'+
    '#'+ID+' .lc-reduire-v1{position:absolute;top:5px;right:6px;flex:0 0 auto;width:24px;min-height:24px;height:24px;padding:0;border-radius:7px;font-size:15px}#'+ID+' .lc-reduire-v1 svg{width:12px;height:12px}'+
    '#'+ID+' .lc-enceinte-v1{display:none;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;cursor:grab;color:#2a1700;background:linear-gradient(180deg,#ffe58a,#ffd24a 50%,#f2a900);touch-action:none}#'+ID+' .lc-enceinte-v1 svg{width:26px;height:26px}'+
    '#'+ID+'[data-lecture="pause"] .lc-ondes-v1{opacity:.25}'+
    '#'+ID+'.mini{width:auto;padding:0;border-radius:50%;background:none;border:0;box-shadow:none}#'+ID+'.mini>:not(.lc-enceinte-v1){display:none}#'+ID+'.mini .lc-enceinte-v1{display:flex;border:2px solid #05071a;box-shadow:0 3px 0 #6a3d00,0 6px 14px rgba(0,0,0,.45)}'+
    /* Forme de CASSETTE de walkman (Norman, 2026-11-01) : coque en plastique, étiquette de papier (titre, boss, compte), fenêtre avec deux bobines qui tournent pendant la lecture (une rotation complète = boucle parfaite, à l'arrêt en pause, coupée en mouvement réduit), base trapézoïdale à deux trous ; touches de walkman dessous. */
    '#'+ID+':not(.mini){width:272px;padding:10px 10px 10px;border-radius:12px;background:linear-gradient(160deg,#3b3f4a,#1c1f27 60%,#12141a);border:2px solid #0a0b0f;box-shadow:inset 0 2px 0 rgba(255,255,255,.14),0 10px 26px rgba(0,0,0,.6)}'+
    '#'+ID+' .lc-cassette-v1{position:relative;display:block;padding:6px 6px 0;border-radius:8px;background:linear-gradient(180deg,#d9d2c0,#bdb59f);box-shadow:inset 0 0 0 2px #0a0b0f,inset 0 3px 0 rgba(255,255,255,.55)}'+
    '#'+ID+' .lc-vis-v1{position:absolute;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fafafa,#7d7968);box-shadow:0 0 0 1px #3a382c}#'+ID+' .lc-vis-v1.a{left:6px;top:5px}#'+ID+' .lc-vis-v1.b{right:6px;top:5px}#'+ID+' .lc-vis-v1.c{left:6px;bottom:30px}#'+ID+' .lc-vis-v1.d{right:6px;bottom:30px}'+
    '#'+ID+' .lc-etiquette-v1{margin:6px 12px 0;padding:6px 8px 5px;border-radius:4px;background:repeating-linear-gradient(180deg,#fffaf0 0 15px,#e5ddc9 15px 16px);color:#2a1d12;box-shadow:inset 0 0 0 1px #8a7d62;text-align:center}'+
    '#'+ID+' .lc-etiquette-v1 .lc-titre-v1{color:#b3261e;text-shadow:none;font-size:15px}#'+ID+' .lc-etiquette-v1 .lc-boss-v1{color:#2a1d12;margin:4px 0 1px}#'+ID+' .lc-etiquette-v1 .lc-compte-v1{color:#5b4a35}'+
    '#'+ID+' .lc-fenetre-v1{position:relative;display:flex;align-items:center;justify-content:space-between;height:44px;margin:6px 24px 0;padding:0 8px;border-radius:22px;background:#15161b;box-shadow:inset 0 0 0 2px #05060a,inset 0 2px 5px rgba(0,0,0,.8)}'+
    '#'+ID+' .lc-fenetre-v1::before{content:"";position:absolute;left:30px;right:30px;top:21px;height:2px;background:#6b4a2a}'+
    '#'+ID+' .lc-bobine-v1{position:relative;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#15161b 0 7px,#6b4a2a 7px calc(7px + var(--bobine,8px)),#15161b calc(7px + var(--bobine,8px)))}'+
    '#'+ID+' .lc-bobine-v1 svg{position:absolute;inset:3px;width:28px;height:28px;color:#e8e8ec;animation:lcTourne 2.4s linear infinite}'+
    /* en lecture, les DEUX bobines d'une vraie cassette tournent dans le sens inverse des aiguilles d'une montre (Norman, 2026-11-01 : la bobine de gauche tournait dans le mauvais sens) */ '#'+ID+' .lc-bobine-v1 svg{animation-direction:reverse}'+
    '#'+ID+'[data-lecture="pause"] .lc-bobine-v1 svg{animation-play-state:paused}'+
    '#'+ID+' .lc-base-v1{position:relative;height:26px;margin:6px 26px 0;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#24262d,#14161b);clip-path:polygon(7% 0,93% 0,100% 100%,0 100%)}#'+ID+' .lc-base-v1 i{position:absolute;top:9px;width:9px;height:9px;border-radius:50%;background:#bdb59f}#'+ID+' .lc-base-v1 i:nth-child(1){left:26%}#'+ID+' .lc-base-v1 i:nth-child(2){right:26%}'+
    '@keyframes lcTourne{from{transform:rotate(0)}to{transform:rotate(360deg)}}'+
    '@media (prefers-reduced-motion:reduce){#'+ID+' .lc-bobine-v1 svg{animation:none}}'+
    '#'+ID+':not(.mini) .lc-boutons-v1{margin-top:9px;gap:5px}#'+ID+':not(.mini) .lc-boutons-v1 button{border-radius:5px;border:2px solid #0a0b0f;background:linear-gradient(180deg,#9aa0ad,#5d6371);color:#101218;box-shadow:0 3px 0 #05060a,inset 0 1px 0 rgba(255,255,255,.35)}#'+ID+':not(.mini) .lc-boutons-v1 button.lc-stop-v1{background:linear-gradient(180deg,#ff9a8f,#d9382f);color:#fff}#'+ID+':not(.mini) .lc-boutons-v1 button.lc-pause-v1{background:linear-gradient(180deg,#8be0a4,#2f9e58)}'+
    '#'+ID+':not(.mini) .lc-reduire-v1{top:12px;right:12px;z-index:2;background:#d9d2c0;color:#2a1d12;border:2px solid #0a0b0f}'+
    '.soreal-idle-chro-suite-v1{display:inline-flex;align-items:center;gap:7px;margin:8px 0 0 8px;padding:7px 12px;border:1px solid rgba(255,210,74,.55);border-radius:10px;background:rgba(255,210,74,.14);color:#ffe9a8;font:800 12px/1.1 system-ui,sans-serif;cursor:pointer;touch-action:manipulation}'+
    '.soreal-idle-chro-suite-v1 svg{width:12px;height:12px;flex:0 0 auto}';
  document.head.appendChild(s);
}

var ICO_PLAY='<svg class="lc-ico-play-v1" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 L13.5 8 L4 13.5 Z" fill="currentColor"/></svg>';
var ICO_PAUSE='<svg class="lc-ico-pause-v1" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/></svg>';
var ICO_PREC='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="2.4" height="11" rx="1" fill="currentColor"/><path d="M13.5 2.5 L5.8 8 L13.5 13.5 Z" fill="currentColor"/></svg>';
var ICO_SUIV='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="11.1" y="2.5" width="2.4" height="11" rx="1" fill="currentColor"/><path d="M2.5 2.5 L10.2 8 L2.5 13.5 Z" fill="currentColor"/></svg>';
var ICO_ENCEINTE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4.2v13.4l-5-4.2H3z" fill="currentColor"/><g class="lc-ondes-v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18.2 6.5a8 8 0 0 1 0 11"/></g></svg>';
var ICO_REDUIRE='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="11" width="10" height="2.4" rx="1" fill="currentColor"/></svg>';
var ICO_BOBINE='<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" stroke-width="2"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M14 4v7"/><path d="M14 17v7"/><path d="M5.3 9l6 3.5"/><path d="M16.7 15.5l6 3.5"/><path d="M5.3 19l6-3.5"/><path d="M16.7 12.5l6-3.5"/></g></svg>';
var ICO_STOP='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor"/></svg>';

function lecteur(){return document.getElementById(ID);}

function majAffichage(){
  var el=lecteur();
  if(!el)return;
  var e=etat.file[etat.index];
  var nom=el.querySelector('.lc-boss-v1'),compte=el.querySelector('.lc-compte-v1'),bp=el.querySelector('.lc-pause-v1');
  if(nom)nom.innerHTML='<span data-sans-traduction>#'+esc(e?e.numero:'')+' · '+esc(e?e.nom:'')+'</span>';
  if(compte)compte.innerHTML='Chronique <b>'+(etat.index+1)+'</b> sur <b>'+etat.file.length+'</b>';
  el.setAttribute('data-lecture',etat.pause?'pause':'lecture');
  var avance=etat.file.length>1?etat.index/(etat.file.length-1):0;
  if(el.style&&typeof el.style.setProperty==='function'){
    el.style.setProperty('--bobine',(4+Math.round((1-avance)*8))+'px');   /* la bande passe d'une bobine à l'autre au fil des chroniques */
    var bd=el.querySelector('.lc-bobine-v1.d');
    if(bd&&bd.style)bd.style.setProperty('--bobine',(4+Math.round(avance*8))+'px');
  }
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
  el.innerHTML='<div class="lc-enceinte-v1" role="button" tabindex="0" aria-label="Agrandir le lecteur des chroniques" title="Agrandir le lecteur">'+ICO_ENCEINTE+'</div>'+
    '<button type="button" class="lc-reduire-v1" aria-label="Réduire en petite enceinte" title="Réduire">'+ICO_REDUIRE+'</button>'+
    '<div class="lc-cassette-v1" aria-hidden="false">'+
      '<i class="lc-vis-v1 a"></i><i class="lc-vis-v1 b"></i><i class="lc-vis-v1 c"></i><i class="lc-vis-v1 d"></i>'+
      '<div class="lc-etiquette-v1"><div class="lc-titre-v1">Chroniques de boss</div><div class="lc-boss-v1"></div><div class="lc-compte-v1"></div></div>'+
      '<div class="lc-fenetre-v1"><span class="lc-bobine-v1 g">'+ICO_BOBINE+'</span><span class="lc-bobine-v1 d">'+ICO_BOBINE+'</span></div>'+
      '<div class="lc-base-v1"><i></i><i></i></div>'+
    '</div>'+
    '<div class="lc-boutons-v1">'+
      '<button type="button" class="lc-prec-v1" aria-label="Chronique précédente" title="Précédent">'+ICO_PREC+'</button>'+
      '<button type="button" class="lc-pause-v1" data-etat="pause" aria-label="Mettre en pause">'+ICO_PAUSE+ICO_PLAY+'<span class="lc-pause-txt-v1">Pause</span></button>'+
      '<button type="button" class="lc-suiv-v1" aria-label="Chronique suivante" title="Suivant">'+ICO_SUIV+'</button>'+
      '<button type="button" class="lc-stop-v1" aria-label="Arrêter et fermer le lecteur" title="Stop">'+ICO_STOP+'<span>Stop</span></button>'+
    '</div>';
  document.body.appendChild(el);
  var pos=null;
  try{pos=JSON.parse(localStorage.getItem(CLE_POS)||'null');}catch(_e){}
  if(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.y))placer(el,pos.x,pos.y);
  else placer(el,(window.innerWidth||800)-(el.offsetWidth||272)-12,(window.innerHeight||600)-(el.offsetHeight||190)-12);
  rendreDeplacable(el);
  var mini=false;
  try{mini=localStorage.getItem(CLE_MINI)==='1';}catch(_e){}
  function regler(m){
    mini=m;el.classList.toggle('mini',m);
    try{if(m)localStorage.setItem(CLE_MINI,'1');else localStorage.removeItem(CLE_MINI);}catch(_e){}
    var r=el.getBoundingClientRect();placer(el,r.left,r.top);   /* la taille change : on le garde dans l'écran */
  }
  el.querySelector('.lc-reduire-v1').addEventListener('click',function(){regler(true);});
  /* l'enceinte se DÉPLACE au glisser (comme le lecteur) ; un simple toucher l'agrandit */
  /* Norman (2026-11-02) : « j'ai réduit le lecteur, je n'arrive plus à l'ouvrir » : rendreDeplacable() capture le pointeur sur le lecteur entier (setPointerCapture) dès qu'on touche autre chose qu'un bouton : le pointerup n'arrivait donc JAMAIS à l'enceinte (div) et un simple toucher n'agrandissait plus. Le toucher est maintenant écouté sur le lecteur lui-même, tant qu'il est réduit. */
  var enc=el.querySelector('.lc-enceinte-v1'),dep=null;
  el.addEventListener('pointerdown',function(ev){dep=el.classList.contains('mini')?{x:ev.clientX,y:ev.clientY,id:ev.pointerId}:null;},true);
  el.addEventListener('pointerup',function(ev){var d=dep;dep=null;if(d&&ev.pointerId===d.id&&el.classList.contains('mini')&&Math.abs(ev.clientX-d.x)<6&&Math.abs(ev.clientY-d.y)<6)regler(false);},true);
  enc.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();regler(false);}});
  if(mini)regler(true);
  el.querySelector('.lc-pause-v1').addEventListener('click',function(){if(etat.pause)reprendre();else pause();});
  el.querySelector('.lc-prec-v1').addEventListener('click',precedent);
  el.querySelector('.lc-suiv-v1').addEventListener('click',suivant);
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

/*
 * Un « ding » entre deux boss (Norman, 2026-10-26 : « quand on lit toutes les chroniques ou qu'on les reprend, entre chaque boss, le son idle/ambient/Ding.m4a ») : joué en entier à la fin d'une chronique, avant la suivante ; jamais après la
 * dernière. Volume = barre « Sons de l'interface ». Si le fichier manque ou que le navigateur refuse de le jouer, on enchaîne tout de suite (au plus 4 s d'attente).
 */
var CLE_DING='idle/ambient/Ding.m4a';
/*
 * Le fichier contient TROIS tournements de page distincts, séparés par des silences (mesuré : 0,27–0,75 s, 1,45–1,80 s, 2,42–3,06 s sur 3,46 s). Norman (2026-10-26) : « chacun joué à tour de rôle entre deux histoires : première page, deuxième, troisième, première… ».
 * On joue donc UN seul tournement par intervalle, dans l'ordre, et le rang continue d'une lecture à l'autre (mémorisé comme préférence liée au compte).
 */
var DING_SEGMENTS=[[0.22,0.82],[1.40,1.86],[2.37,3.14]];
var CLE_DING_RANG='soreal_idle_ding_rang_v1';
function dingRang_(){
  var n=0;
  try{n=Math.floor(Number(localStorage.getItem(CLE_DING_RANG)))||0;}catch(_e){}
  var rang=((n%DING_SEGMENTS.length)+DING_SEGMENTS.length)%DING_SEGMENTS.length;
  try{localStorage.setItem(CLE_DING_RANG,String((rang+1)%DING_SEGMENTS.length));}catch(_e){}
  return rang;
}
function ding(fini){
  var rendu=false;
  function suite(){if(rendu)return;rendu=true;fini();}
  try{
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
    if(!(v>0)){suite();return;}
    var seg=DING_SEGMENTS[dingRang_()];
    var a=new Audio('/api/idle/media/ambient?key='+encodeURIComponent(CLE_DING));
    a.preload='auto';
    a.volume=Math.min(1,v);
    a.addEventListener('error',suite);
    var lance=false;
    function jouer(){
      if(lance)return;lance=true;
      try{a.currentTime=seg[0];}catch(_e){}
      var p=a.play();
      if(p&&p.catch)p.catch(suite);
      /* le tournement fini, on coupe tout de suite (le fichier continue avec les deux autres) */
      setTimeout(function(){try{a.pause();}catch(_e){}suite();},Math.max(120,(seg[1]-seg[0])*1000));
    }
    a.addEventListener('loadedmetadata',jouer);
    if(a.readyState>=1)jouer();
    setTimeout(suite,4000);
  }catch(_e){suite();}
}

function lireCourante(){
  if(!etat.actif)return;
  var t=tts();
  var e=etat.file[etat.index];
  if(!t||!e){terminer();return;}
  majAffichage();
  var jeton=etat.jeton+=1;
  /* texte et nom PARLÉS fixés dans le menu Admin : la voix lit ceux-là (Norman, 2026-10-17) */
  var texte=typeof t.composerChronique==='function'?t.composerChronique(String(e.nomParle||'').trim()||e.nom,String(e.histoireParlee||'').trim()||e.description,true):e.description;
  if(etat.index===0&&etat.intro)texte=etat.intro+' \uE000'+1500+'\uE001 '+texte;
  var demarre=t.readText(texte,null,function(ok){
    if(jeton!==etat.jeton||!etat.actif)return;
    /* Lecture arrivée à son terme : on enchaîne ; interrompue de l'extérieur ou en échec : on ferme le lecteur. */
    if(ok!==true){terminer();return;}
    setTimeout(function(){
      if(jeton!==etat.jeton||!etat.actif)return;
      if(etat.index+1>=etat.file.length){etat.index+=1;terminer();return;}
      ding(function(){
        if(jeton!==etat.jeton||!etat.actif)return;
        etat.index+=1;
        lireCourante();
      });
    },350);
  });
  /* La voix refuse de démarrer sans appeler le rappel (voix indisponible) : on ferme le lecteur au lieu de le laisser ouvert (audit du 2026-10-10, GP-011). */
  if(!demarre&&jeton===etat.jeton){terminer();return;}
  if(etat.pause&&typeof t.pause==='function')t.pause();
}

function demarrer(numeroDepart,intro){
  var t=tts();
  if(!t||typeof t.readText!=='function')return false;
  var file=construireFile(numeroDepart);
  if(!file.length)return false;
  if(etat.actif){etat.jeton+=1;try{t.stop();}catch(_e){}}
  etat.file=file;etat.index=0;etat.actif=true;etat.pause=false;etat.intro=String(intro||'');   /* introduction lue avant la première chronique (bouton « Lire toute l'histoire ») */
  afficher();
  lireCourante();
  return true;
}
/* Précédent / suivant (Norman, 2026-11-01 : « un bouton précédent, play/pause, suivant, stop ») : on change de chronique en coupant la voix ; la lecture reprend aussitôt (même si le lecteur était en pause). Précédent sur la première chronique la relit depuis le début ; suivant sur la dernière ferme le lecteur. */
function aller(delta){
  if(!etat.actif)return false;
  var cible=etat.index+delta;
  var t=tts();
  etat.jeton+=1;   /* la fin de la lecture coupée ne doit rien enchaîner */
  if(t&&typeof t.stop==='function'){try{t.stop();}catch(_e){}}
  if(cible>=etat.file.length){terminer();return true;}
  etat.index=Math.max(0,cible);
  etat.pause=false;
  majAffichage();
  lireCourante();
  return true;
}
function precedent(){return aller(-1);}
function suivant(){return aller(1);}
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
window.__SOREAL_IDLE_LECTEUR_CHRONIQUES_V1__={demarrer:demarrer,pause:pause,reprendre:reprendre,stop:stop,precedent:precedent,suivant:suivant,file:construireFile,actif:function(){return etat.actif;}};
})();
