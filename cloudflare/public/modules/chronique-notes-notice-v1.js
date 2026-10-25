/*
 * SOREAL IDLE — informations des chroniques de boss en notifications (Norman, 2026-10-25) : « dans beaucoup de chroniques de boss il y a des informations entre parenthèses (une nouvelle zone d'Aventure débloquée, un nouveau titan
 * disponible…) : chaque fois, une notification comme pour les trophées, avec son propre son ».
 *
 * Ces informations sont les paragraphes entre parenthèses au début de l'histoire d'un boss (affichés dans la carte de la chronique). À la PREMIÈRE rencontre d'un boss (celle où la voix lit l'histoire : boss pas encore rencontré,
 * même condition que la lecture automatique de tutorial-tts-v202.js), chaque information devient une annonce en fondu (fade-notice-v1.js) accompagnée du son « chroniqueNote » (audio-effects-v199.js). Une information n'est
 * annoncée qu'une fois par boss (mémoire dans localStorage, donc liée au compte : prefs-compte-v1.js). Anti-spoil : seul le boss courant, déjà atteint, est lu dans l'état du jeu.
 *
 *   window.__SOREAL_IDLE_CHRONIQUE_NOTES_V1__ = { verifier(), extraire(panneau) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CHRONIQUE_NOTES_V1__)return;

var CLE='soreal_idle_chronique_notes_vues_v1';
var MAX=4;
var DUREE_MS=5200;

function lues(){
  try{var a=JSON.parse(localStorage.getItem(CLE)||'[]');return Array.isArray(a)?a:[];}catch(_e){return [];}
}
function noterLu(id){
  try{var a=lues();if(a.indexOf(id)<0){a.push(id);localStorage.setItem(CLE,JSON.stringify(a.slice(-400)));}}catch(_e){}
}
function dejaRencontre(id){
  var n=parseInt(id,10);
  if(!(n>0))return true;
  try{
    var f=window.__SOREAL_IDLE_ACTIVITE_V1__;
    var c=typeof f==='function'?f():null;
    return n<=Math.max(0,Math.floor(Number(c&&c.bossMax)||0));
  }catch(_e){return true;}
}

/* Les informations de l'histoire : les paragraphes entre parenthèses du début (hors balises de voix « (marius) »), sans leurs parenthèses — même découpage que la carte de la chronique (separerNotesHistoireBossIdleV1_, ui-combat-1-v1.js). */
function extraire(histoire){
  var notes=[],texte=String(histoire||'').trim();
  var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  for(;;){
    var m=texte.match(/^\(([^\n]+)\)[ \t]*(?:\n|$)\s*/);
    if(!m)break;
    try{if(tts&&typeof tts.resoudreVoixBalise==='function'&&tts.resoudreVoixBalise(m[1]))break;}catch(_e){}
    notes.push(String(m[1]).replace(/\s+/g,' ').trim());
    texte=texte.slice(m[0].length).trim();
  }
  return notes.filter(Boolean);
}

/* Titre de l'annonce d'après ce que dit l'information (Norman, 2026-10-25 : « ça ne doit pas mettre Chronique de boss : si ça dit qu'une nouvelle zone d'Aventure est disponible, ça doit mettre Aventure ; pareil pour Titans »). */
function titreDe(texte){
  var t=String(texte||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  if(/titan/.test(t))return {titre:'👹 Titans',accent:'#f87171'};
  if(/aventure|adventure|\bzone/.test(t))return {titre:'🗺️ Aventure',accent:'#7dd3a8'};
  if(/rebirth|renaissance/.test(t))return {titre:'🔄 Renaissance',accent:'#c4b5fd'};
  if(/itopod|tour/.test(t))return {titre:'🗼 ITOPOD',accent:'#fbbf24'};
  return {titre:'✨ Nouveauté',accent:'#7dd3fc'};
}

function annoncer(notes){
  var notice=window.__sorealFadeNoticeV1__;
  if(typeof notice!=='function')return;
  notes.slice(0,MAX).forEach(function(texte,i){
    var t=titreDe(texte);
    notice(t.titre,[texte],{dureeMs:DUREE_MS,accent:t.accent});
    /* un son par annonce, au moment où elle s'affiche (chaque annonce reste ~ durée × 1,3 + 0,7 s) */
    setTimeout(function(){
      try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.chroniqueNote==='function')a.chroniqueNote();}catch(_e){}
    },i*Math.round(DUREE_MS*1.3+700));
  });
}

function verifier(){
  var e=null;
  try{e=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){}
  var id=e?String(e.bossId||'').trim():'';
  if(!id||lues().indexOf(id)>=0)return;
  if(dejaRencontre(id)){noterLu(id);return;}   /* boss déjà rencontré (avant cette mise à jour, après un Rebirth…) : jamais d'annonce */
  var notes=extraire(e.bossHistoire);
  noterLu(id);
  if(notes.length)annoncer(notes);
}

window.__SOREAL_IDLE_CHRONIQUE_NOTES_V1__={verifier:verifier,extraire:extraire};
if(typeof setInterval==='function')setInterval(verifier,1200);
})();
