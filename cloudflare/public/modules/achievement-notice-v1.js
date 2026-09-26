/*
 * SOREAL IDLE — annonce en fondu quand on débloque un succès (Norman, 2026-09-26 : « un popup fade in fade out quand on débloque un trophée »).
 *
 * Même annonce que « Nouveau menu débloqué » (fade-notice-v1.js : apparaît, reste quelques secondes, disparaît, jamais cliquable), avec l'emoji et la couleur de la
 * catégorie du succès et un petit son de fanfare. Les succès déjà annoncés sont mémorisés sur l'appareil, par joueur : le tout premier passage note simplement ce qui est
 * déjà obtenu (aucune rafale pour un joueur existant) ; ensuite tout nouveau succès est annoncé, y compris ceux gagnés pendant l'absence.
 * ANTI-SPOIL : seul un succès DÉJÀ obtenu est nommé.
 *
 *   window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__.verifier(joueur, cleDeStockage)   (appelé à chaque rendu par le jeu)
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__)return;

var MAX_ANNONCES=4;
var enAttente=false;

function lire(cle){
  try{
    var brut=localStorage.getItem(cle);
    if(brut===null)return null;
    var liste=JSON.parse(brut);
    return Array.isArray(liste)?liste:null;
  }catch(_){return null;}
}
function ecrire(cle,liste){
  try{localStorage.setItem(cle,JSON.stringify(liste));}catch(_){}
}

/* Emoji + couleur d'une catégorie : la même table que la page Achievements (profile-v1.js). */
function style(groupe){
  var t=window.__SOREAL_IDLE_SUCCES_GROUPES_V1__||{};
  return t[groupe]||{emoji:'🏆',couleur:'#ffe08a'};
}

function annoncer(nouveaux){
  var audio=window.__SOREAL_IDLE_AUDIO_V199__;
  try{if(audio&&typeof audio.play==='function')audio.play('achievement');}catch(_){}
  var notice=window.__sorealFadeNoticeV1__;
  if(typeof notice!=='function')return;
  nouveaux.slice(0,MAX_ANNONCES).forEach(function(a){
    var s=style(a.group);
    var lignes=[s.emoji+' '+String(a.name||'')];
    var bp=Number(a.bp);
    if(Number.isFinite(bp)&&bp>0)lignes.push('+'+bp+' BP');
    notice('🏆 Succès débloqué !',lignes,{dureeMs:3800,accent:s.couleur});
  });
  if(nouveaux.length>MAX_ANNONCES)notice('🏆 Et '+(nouveaux.length-MAX_ANNONCES)+' autre'+(nouveaux.length-MAX_ANNONCES>1?'s':'')+' succès !',['Ils t’attendent dans Achievements.'],{dureeMs:3200});
}

function verifier(joueur,cle){
  if(enAttente||!joueur||!cle)return;
  var a=joueur.systemes&&joueur.systemes.achievements;
  if(!a||!Array.isArray(a.list))return;
  var obtenus=a.list.filter(function(x){return x&&x.unlocked;});
  var connus=lire(cle);
  if(connus===null){
    /* Premier passage sur cet appareil : on note l'existant, sans rien annoncer. */
    ecrire(cle,obtenus.map(function(x){return x.id;}));
    return;
  }
  var nouveaux=obtenus.filter(function(x){return connus.indexOf(x.id)<0;});
  if(!nouveaux.length)return;
  ecrire(cle,connus.concat(nouveaux.map(function(x){return x.id;})));
  annoncer(nouveaux);
}

window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__={verifier:verifier};
})();
