/*
 * SOREAL IDLE — le Cube de l'infini change de palier (Norman, 2026-10-10 : « quand le cube passe de tiers, il faut un popup qui dise un truc du genre : votre cube de l'infini vient de se transformer »).
 * Un petit popup annonce la transformation : image du cube au nouveau palier, numéro du palier et SEULS les bonus déjà actifs qu'on connaît (chance de drop, or) : rien du palier suivant (règle n°2).
 * Le palier vu est gardé sur l'appareil (par partie) : un palier gagné pendant l'absence du joueur est annoncé à son retour, une seule fois. Au tout premier passage, on retient le palier sans rien dire.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CUBE_PALIER_V1__)return;

var CLE='soreal_idle_cube_palier_v1:';
var depart=Date.now();

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nb(v){var n=Math.round(Number(v)*10)/10;try{return n.toLocaleString('fr-FR');}catch(_e){return String(n);}}

function styles(){
  if(document.getElementById('cube-palier-style-v1'))return;
  var s=document.createElement('style');s.id='cube-palier-style-v1';
  s.textContent='.cp-fond-v1{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,18,.74);backdrop-filter:blur(3px)}'+
    '.cp-carte-v1{width:min(400px,100%);padding:22px 20px 18px;border-radius:18px;text-align:center;color:#eef3ff;font-family:"Russo One","Arial Black",Impact,sans-serif;background:linear-gradient(180deg,#232a66,#10143a);border:3px solid #ffd24a;box-shadow:0 0 0 3px #05071a,0 0 34px rgba(255,210,74,.45),0 18px 40px rgba(0,0,0,.6)}'+
    '.cp-cube-v1{position:relative;width:128px;height:128px;margin:0 auto 6px;display:grid;place-items:center}'+
    '.cp-cube-v1::before{content:"";position:absolute;inset:-14px;border-radius:50%;background:radial-gradient(circle,rgba(255,226,120,.55),transparent 68%);animation:cpLueur-v1 1.8s ease-in-out infinite}'+
    '.cp-cube-v1 img{position:relative;width:128px;height:128px;object-fit:contain;filter:drop-shadow(0 4px 0 rgba(0,0,0,.5));animation:cpMue-v1 1.1s cubic-bezier(.2,1.4,.4,1) both}'+
    '.cp-carte-v1,.cp-carte-v1 *{font-family:"Russo One","Arial Black",Impact,sans-serif!important}'+
    '.cp-carte-v1 .cp-titre-v1{font-family:"Bangers","Russo One",Impact,sans-serif!important}'+
    '.cp-titre-v1{margin:6px 0 4px;font:400 28px/1.05 "Bangers","Russo One",Impact,sans-serif;letter-spacing:.05em;color:#ffd24a;text-shadow:0 3px 0 #6a3d00}'+
    '.cp-palier-v1{display:inline-block;margin:8px 0 4px;padding:6px 16px;border-radius:999px;font-size:17px;color:#2a1700;background:linear-gradient(180deg,#ffe58a,#ffd24a 45%,#ff9f1c);box-shadow:0 4px 0 #8a4b00}'+
    '.cp-texte-v1{margin:8px 0;font-size:15px;line-height:1.4;color:#d6def5}'+
    '.cp-bonus-v1{margin:6px 0;font-size:18px;color:#7af0a8;text-shadow:0 1px 0 #000}'+
    '.cp-bouton-v1{min-width:160px;margin-top:8px;padding:12px 18px;border:0;border-radius:14px;font:400 17px "Russo One",sans-serif;color:#2a1700;background:linear-gradient(180deg,#ffe58a,#ffd24a 45%,#ff9f1c);box-shadow:0 5px 0 #8a4b00;cursor:pointer}'+
    '.cp-bouton-v1:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4b00}'+
    '@keyframes cpLueur-v1{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}'+
    '@keyframes cpMue-v1{0%{transform:scale(.4) rotate(-25deg);opacity:0}60%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}'+
    '@media (prefers-reduced-motion:reduce){.cp-cube-v1::before,.cp-cube-v1 img{animation:none}}';
  document.head.appendChild(s);
}

function annoncer(palier,tier){
  styles();
  fermer();
  var bonus='';
  if(Number(tier&&tier.dropChancePct)>0)bonus+='<div class="cp-bonus-v1">+'+esc(nb(tier.dropChancePct))+' % de chance de drop</div>';
  if(Number(tier&&tier.goldDropsPct)>0)bonus+='<div class="cp-bonus-v1">+'+esc(nb(tier.goldDropsPct))+' % d’or gagné</div>';
  var box=document.createElement('div');box.id='cube-palier-v1';box.className='cp-fond-v1';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  box.innerHTML='<div class="cp-carte-v1"><div class="cp-cube-v1"><img alt="" src="/api/idle/media/item?wikiItemId=100&amp;tier='+esc(palier)+'&amp;name='+encodeURIComponent('THE CUBE')+'"></div>'+
    '<div class="cp-titre-v1">Ton Cube de l’infini vient de se transformer !</div>'+
    '<div class="cp-palier-v1">Palier '+esc(palier)+'</div>'+
    '<div class="cp-texte-v1">Il a changé d’apparence et ses bonus ont grandi.</div>'+bonus+
    '<button type="button" class="cp-bouton-v1">Super !</button></div>';
  box.addEventListener('click',function(e){if(e.target===box||(e.target.classList&&e.target.classList.contains('cp-bouton-v1')))fermer();});
  document.body.appendChild(box);
  try{if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.play==='function')window.__SOREAL_IDLE_AUDIO_V199__.play('achievement');}catch(_e){}
}
function fermer(){var b=document.getElementById('cube-palier-v1');if(b&&b.parentNode)b.parentNode.removeChild(b);}

function autreFenetre(){
  /* Pas par-dessus un tutoriel, une histoire plein écran ou une autre fenêtre déjà ouverte. */
  return Boolean(document.querySelector('.soreal-idle-tuto-flottant-v1,.soreal-idle-modal-v63,[role="dialog"]:not(#cube-palier-v1),.soreal-idle-histoire-plein-ecran-v1'));
}

function verifier(){
  if(document.hidden||Date.now()-depart<2500)return;
  var etat=null;
  try{etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){}
  var a=etat&&etat.systemes&&etat.systemes.adventure;
  var t=a&&a.cubeTier;
  if(!t||t.tier==null)return;
  var palier=Math.max(0,Math.floor(Number(t.tier)||0));
  var cle=CLE+String((etat&&etat.nom)||'');
  var vu=null;
  try{vu=localStorage.getItem(cle);}catch(_e){}
  if(vu===null){try{localStorage.setItem(cle,String(palier));}catch(_e){}return;}
  var ancien=Math.floor(Number(vu)||0);
  if(palier>ancien){
    if(autreFenetre())return;
    try{localStorage.setItem(cle,String(palier));}catch(_e){}
    annoncer(palier,t);
  }else if(palier<ancien){
    try{localStorage.setItem(cle,String(palier));}catch(_e){}
  }
}
if(typeof setInterval==='function')setInterval(verifier,1500);

window.__SOREAL_IDLE_CUBE_PALIER_V1__={annoncer:annoncer,fermer:fermer,verifier:verifier};
})();
