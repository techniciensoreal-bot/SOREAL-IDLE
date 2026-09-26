/*
 * SOREAL IDLE — annonce en fondu (2026-09-26, Norman : « quelque chose qui apparaît et disparaît sur lequel on ne peut pas cliquer »).
 * Texte centré en haut de l'écran : fondu d'entrée, quelques secondes, fondu de sortie ; jamais cliquable (pointer-events:none). Plusieurs annonces
 * de suite s'affichent l'une après l'autre. Utilisé pour : set complété (bonus obtenu), Tutorial Cube devenu Infinity Cube.
 *
 *   window.__sorealFadeNoticeV1__(titre, lignes[], { dureeMs })
 */
(function(){
'use strict';
if(window.__sorealFadeNoticeV1__)return;

var file=[];
var enCours=false;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

function style(){
  if(document.getElementById('soreal-idle-fade-notice-style-v1'))return;
  var st=document.createElement('style');
  st.id='soreal-idle-fade-notice-style-v1';
  st.textContent=
    '#soreal-idle-fade-notice-v1{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:100001;pointer-events:none;user-select:none;-webkit-user-select:none;'+
    'width:min(520px,calc(100vw - 28px));text-align:center;padding:14px 20px;border-radius:16px;color:#fff;'+
    'background:linear-gradient(135deg,rgba(18,28,52,.94),rgba(40,58,98,.94));border:1px solid rgba(255,214,102,.75);'+
    'box-shadow:0 12px 40px rgba(0,0,0,.55),0 0 26px rgba(255,214,102,.28);opacity:0;transition:opacity .6s ease}'+
    '#soreal-idle-fade-notice-v1.on{opacity:1}'+
    '#soreal-idle-fade-notice-v1 .titre{font-size:19px;font-weight:900;color:#ffe08a;letter-spacing:.02em;text-shadow:0 2px 8px rgba(0,0,0,.6)}'+
    '#soreal-idle-fade-notice-v1 .ligne{margin-top:6px;font-size:14px;line-height:1.35;color:#eef3ff}'+
    '@media (prefers-reduced-motion:reduce){#soreal-idle-fade-notice-v1{transition:none}}';
  document.head.appendChild(st);
}

function suivante(){
  if(enCours||!file.length)return;
  enCours=true;
  var n=file.shift();
  style();
  var old=document.getElementById('soreal-idle-fade-notice-v1');
  if(old)old.remove();
  var el=document.createElement('div');
  el.id='soreal-idle-fade-notice-v1';
  el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="titre">'+esc(n.titre)+'</div>'+n.lignes.map(function(l){return '<div class="ligne">'+esc(l)+'</div>';}).join('');
  document.body.appendChild(el);
  requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('on');});});
  setTimeout(function(){el.classList.remove('on');},n.dureeMs);
  setTimeout(function(){if(el.parentNode)el.remove();enCours=false;suivante();},n.dureeMs+700);
}

window.__sorealFadeNoticeV1__=function(titre,lignes,options){
  var duree=options&&Number(options.dureeMs)>0?Number(options.dureeMs):4500;
  file.push({titre:String(titre||''),lignes:(Array.isArray(lignes)?lignes:[]).map(String).filter(Boolean),dureeMs:duree});
  suivante();
};
})();
