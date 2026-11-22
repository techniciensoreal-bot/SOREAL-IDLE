/*
 * Infobulles de chiffres du vrai jeu (Norman, 2026-11-22) : chances de butin des titans et des zones, échelle du boss atteint sur l'équipement.
 * Les valeurs viennent du serveur (state.systemes.adventure.infobulles : titans et zones DÉJÀ ouverts seulement, règle n°2 ; src/idle-infobulles-aventure-v1.js) ; ce module ne calcule rien, il met en forme.
 * Format du jeu (Character::lootChanceDisplay) : « ##0.## » + « % », la valeur est remplacée par le plafond, en vert, quand le produit l'atteint (« plafond: true » dans la ligne).
 * Les libellés sont ceux du jeu (anglais) en anglais, leur traduction en français sinon (texte choisi ici selon la langue : une infobulle `title` n'est pas retraduite).
 */
(function(){
'use strict';
var LIBELLES={
  fr:{
    main:'Chance de butin de l’ensemble principal',v2:'Butins V2',v3:'Butins V3',v4:'Butins V4',
    normal:'Chance de butin normal',rare:'Chance de butin rare',
    boost:'Chance de butin des boosts',mob:'Chance de butin des ennemis normaux',boss:'Chance de butin du boss',
    titre:'Chances de butin'
  },
  en:{
    main:'Main Set Drop Chance',v2:'V2 Drops',v3:'V3 Drops',v4:'V4 Drops',
    normal:'Normal Loot Drop Chance',rare:'Rare Loot Drop Chance',
    boost:'Boost Drop Chance',mob:'Normal Mob Drop Chance',boss:'Boss Drop Chance',
    titre:'Drop chances'
  }
};
function langue(){try{return window.__SOREAL_IDLE_LANGUE_V1__&&window.__SOREAL_IDLE_LANGUE_V1__()==='en'?'en':'fr';}catch(_e){return 'fr';}}
function libelle(cle){var t=LIBELLES[langue()];return t[cle]||cle;}
function echapper(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function virgule(s){return langue()==='en'?s:s.replace('.',',');}

/* « ##0.## » du jeu : au plus deux décimales, zéros de fin retirés (0,0001 s'écrit « 0 »). */
function formaterPct(pct){
  var v=Number(pct);if(!isFinite(v)||v<0)v=0;
  var r=Math.round(v*100+1e-9)/100;
  var s=r.toFixed(2).replace(/\.?0+$/,'');
  return virgule(s===''?'0':s);
}
function texteLigne(l){return formaterPct(l.pct)+(langue()==='en'?'%':' %');}
/* « ##.# » du jeu pour « Stats (X%) ». */
function formaterEchelle(pct){
  var v=Number(pct);if(!isFinite(v))v=0;
  var r=Math.round(v*10+1e-9)/10;
  return virgule(r.toFixed(1).replace(/\.0$/,''));
}

function etatAventure(){
  try{
    var e=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
    return e&&e.systemes&&e.systemes.adventure||null;
  }catch(_e){return null;}
}
function lignes(genre,id,a){
  a=a||etatAventure();
  var b=a&&a.infobulles&&a.infobulles[genre];
  var l=b&&b[String(id)];
  return Array.isArray(l)&&l.length?l:null;
}

/* Texte pour l'infobulle `title` d'une zone (ligne de chiffres à la suite de « Puissance · Endurance ») : vide si le jeu n'affiche rien pour cette zone ou si elle n'est pas ouverte. */
function zoneTexte(zoneId,a){
  var l=lignes('zones',zoneId,a);
  if(!l)return '';
  return '\n'+l.map(function(x){return libelle(x.k)+' : '+texteLigne(x);}).join('\n');
}

/* Bloc de la carte d'un titan : une ligne par chance de butin, plafond en vert. */
function titanHtml(id,a){
  var l=lignes('titans',id,a);
  if(!l)return '';
  return '<div class="ttn-sous-titre">'+echapper(libelle('titre'))+'</div><div class="ttn-butin" id="ttnButin_'+echapper(id)+'">'+
    l.map(function(x){
      return '<div class="ttn-butin-ligne"><span>'+echapper(libelle(x.k))+'</span><b'+(x.plafond?' class="ttn-butin-plafond"':'')+'>'+echapper(texteLigne(x))+'</b></div>';
    }).join('')+'</div>';
}
/* Empreinte des chiffres d'un titan : change quand une valeur affichée change (la carte se redessine alors). */
function titanSignature(id,a){
  var l=lignes('titans',id,a);
  return l?l.map(function(x){return x.k+':'+texteLigne(x)+(x.plafond?'!':'');}).join(','):'';
}

window.__SOREAL_IDLE_INFOBULLES_AVENTURE_V1__={
  formaterPct:formaterPct,formaterEchelle:formaterEchelle,texteLigne:texteLigne,libelle:libelle,
  zoneTexte:zoneTexte,titanHtml:titanHtml,titanSignature:titanSignature
};
})();
