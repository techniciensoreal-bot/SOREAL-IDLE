/*
 * SOREAL IDLE — récompense de connexion automatique (Norman, 2026-10-06) : « je voudrais que la récompense de connexion soit donnée au joueur dès qu'il se connecte, avec une annonce qui lui montre
 * qu'il a eu la récompense d'aujourd'hui avec le nombre de jours consécutifs et le nombre d'AP récupéré ».
 *
 * Dès que l'état du joueur est chargé et que la récompense du jour est réclamable (le serveur décide : jour de Paris, série, plateau du mois), elle est réclamée toute seule par la même opération que le
 * bouton du calendrier, puis une annonce s'affiche. Rien n'est envoyé si le calendrier n'est pas encore visible pour le joueur (il apparaît avec le Trou sans fond : anti-spoil).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__)return;

var tentee=false;
var enAttente=false;
var depart=Date.now();

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nombre(v){var n=Math.floor(Number(v)||0);try{return n.toLocaleString('fr-FR');}catch(_e){return String(n);}}

function styles(){
  if(document.getElementById('cx-recompense-style-v1'))return;
  var s=document.createElement('style');s.id='cx-recompense-style-v1';
  s.textContent='.cx-recompense-v1{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,18,.72);backdrop-filter:blur(3px)}'+
    '.cx-carte-v1{width:min(420px,100%);padding:22px 20px 18px;border-radius:14px;text-align:center;color:#eef3ff;background:linear-gradient(180deg,#25214d,#12122b);border:2px solid #f2a900;box-shadow:0 0 0 3px #000,0 0 40px rgba(242,169,0,.45)}'+
    '.cx-icone-v1{font-size:46px;line-height:1;animation:cxSaut-v1 1.2s ease-in-out infinite}'+
    '.cx-titre-v1{margin:8px 0 4px;font-size:22px;font-weight:900;letter-spacing:1px;color:#ffd34e;text-transform:uppercase}'+
    '.cx-texte-v1{margin:6px 0;font-size:16px;color:#d6def5}'+
    '.cx-serie-v1{display:inline-block;margin:10px 0 4px;padding:6px 14px;border-radius:999px;font-size:17px;font-weight:800;background:#ff7a1a;color:#1a0d00}'+
    '.cx-ap-v1{margin:8px 0 12px;font-size:34px;font-weight:950;color:#7ee7ff;text-shadow:0 0 14px rgba(126,231,255,.6)}'+
    '.cx-bouton-v1{min-width:160px;padding:11px 18px;border:2px solid #000;border-radius:8px;font-size:16px;font-weight:900;color:#1a0d00;background:linear-gradient(180deg,#ffd34e,#f2a900);cursor:pointer}'+
    '@keyframes cxSaut-v1{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}';
  document.head.appendChild(s);
}

/* Annonce : jour de série et AP reçus. `res` = résultat de l'opération { ap, case, serie, jours }. */
function annoncer(res){
  if(!res||!res.ap)return;
  styles();
  var serie=Math.max(1,Math.floor(Number(res.serie||res.case)||1));
  var ancien=document.getElementById('cx-recompense-v1');
  if(ancien&&ancien.parentNode)ancien.parentNode.removeChild(ancien);
  var box=document.createElement('div');box.id='cx-recompense-v1';box.className='cx-recompense-v1';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  box.innerHTML='<div class="cx-carte-v1"><div class="cx-icone-v1">🎁</div>'+
    '<div class="cx-titre-v1">Récompense de connexion</div>'+
    '<div class="cx-texte-v1">Tu t’es connecté aujourd’hui : voici ta récompense.</div>'+
    '<div class="cx-serie-v1">📅 Série de connexion : '+esc(serie)+' jour(s) consécutif(s)</div>'+
    '<div class="cx-ap-v1">+'+esc(nombre(res.ap))+' AP</div>'+
    '<div class="cx-texte-v1">Reviens demain pour continuer ta série !</div>'+
    '<button type="button" class="cx-bouton-v1">Super !</button></div>';
  box.addEventListener('click',function(e){if(e.target===box||(e.target.classList&&e.target.classList.contains('cx-bouton-v1')))fermer();});
  document.body.appendChild(box);
}
function fermer(){var b=document.getElementById('cx-recompense-v1');if(b&&b.parentNode)b.parentNode.removeChild(b);}

function ouvertureEnCours(){
  /* Pas par-dessus un tutoriel, une histoire plein écran ou une autre fenêtre déjà ouverte. */
  return Boolean(document.querySelector('.soreal-idle-tuto-flottant-v1,.soreal-idle-modal-v63,[role="dialog"]:not(#cx-recompense-v1),.soreal-idle-histoire-plein-ecran-v1'));
}

function essayer(){
  if(tentee||document.hidden)return;
  var etat=null;
  try{etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){}
  var cal=etat&&etat.systemes&&etat.systemes.loginCalendar;
  if(!cal)return;
  if(!cal.reclamable){tentee=true;return;}
  if(Date.now()-depart<2500||ouvertureEnCours()||typeof window.__actionMetaIdleV130__!=='function')return;
  tentee=true;enAttente=true;
  window.__connexionRecompenseAutoV1__=true;
  setTimeout(function(){window.__connexionRecompenseAutoV1__=false;enAttente=false;},20000);
  try{window.__actionMetaIdleV130__({action:'loginCalendar'});}catch(_e){window.__connexionRecompenseAutoV1__=false;}
}
if(typeof setInterval==='function')setInterval(essayer,1500);

window.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__={annoncer:annoncer,fermer:fermer,essayer:essayer};
})();
