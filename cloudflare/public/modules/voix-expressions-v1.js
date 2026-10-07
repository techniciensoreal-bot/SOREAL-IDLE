/*
 * SOREAL IDLE — expressions et pauses des voix (Norman, 2026-10-08 : « des moyens de leur donner des expressions différentes, marquer un arrêt plus long, plein de choses du genre »).
 *
 * Dans un texte, comme les balises de voix « (marius) », deux familles de balises entre parenthèses ne sont JAMAIS lues :
 *  - une EXPRESSION « (joyeux) », « (dramatique) »… : change la façon de dire ce qui suit, jusqu'à la balise suivante (ou jusqu'au changement de voix, qui revient au ton neutre) ;
 *  - une PAUSE « (pause) », « (pause 2s) », « (courte pause) », « (longue pause) » : un silence au milieu du texte.
 * La pause est un silence ajouté à la lecture (aucun fichier à régénérer). L'expression, elle, se règle à la GÉNÉRATION : le studio de voix (Chatterbox) reçoit « exaggeration » (à quel point
 * la voix joue) et « cfg » (le rythme : plus bas = plus posé) ; le fichier généré porte l'expression, la lecture dans le jeu ne change pas.
 * Les valeurs ci-dessous sont des réglages de studio choisis par SOREAL (jamais des valeurs du jeu NGU Idle) ; « neutre » ne force rien : réglages propres à chaque voix.
 *
 *   window.__SOREAL_IDLE_EXPRESSIONS_V1__ = { liste, resoudre(texte), reglages(id), pauseMs(texte), baliseExpression(id), balisePause(ms), pauses, phraseEssai }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_EXPRESSIONS_V1__)return;

var LISTE=[
  {id:'neutre',nom:'Neutre',emoji:'🙂',aide:'Le ton naturel de la voix.',exaggeration:null,cfg:null},
  {id:'joyeux',nom:'Joyeux',emoji:'😄',aide:'Enjoué, souriant.',exaggeration:0.65,cfg:0.4},
  {id:'energique',nom:'Énergique',emoji:'⚡',aide:'Vif, plein d’entrain.',exaggeration:0.8,cfg:0.5},
  {id:'dramatique',nom:'Dramatique',emoji:'🎭',aide:'Posé, solennel, très joué.',exaggeration:0.85,cfg:0.25},
  {id:'calme',nom:'Calme',emoji:'😌',aide:'Doux, retenu, apaisant.',exaggeration:0.3,cfg:0.6},
  {id:'mysterieux',nom:'Mystérieux',emoji:'🕵️',aide:'Lent, feutré, intrigant.',exaggeration:0.45,cfg:0.25},
  {id:'colere',nom:'En colère',emoji:'😠',aide:'Dur, véhément.',exaggeration:0.9,cfg:0.45}
];

/* Pauses proposées par l'éditeur (la balise écrite dans le texte, sa durée en millisecondes). */
var PAUSES=[
  {id:'courte',nom:'Courte',tag:'(courte pause)',ms:500},
  {id:'normale',nom:'Normale',tag:'(pause)',ms:1000},
  {id:'longue',nom:'Longue',tag:'(longue pause)',ms:2500},
  {id:'tres-longue',nom:'Très longue',tag:'(pause 4s)',ms:4000}
];

var PAUSE_MAX_MS=5000;

function normaliser(t){
  return String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
}
/* Libellé « sans accent, espaces simples » d'une balise, pour reconnaître « Pause 2 s », « pause 2s », « PAUSE  2S » de la même façon. */
function nettoyer(t){
  return String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
}

var PAR_ID={};
LISTE.forEach(function(e){PAR_ID[normaliser(e.id)]=e.id;PAR_ID[normaliser(e.nom)]=e.id;});
/* Variantes d'écriture acceptées. */
PAR_ID.enervee='colere';PAR_ID.fache='colere';PAR_ID.enrage='colere';
PAR_ID.heureux='joyeux';PAR_ID.gai='joyeux';
PAR_ID.serieux='dramatique';PAR_ID.solennel='dramatique';
PAR_ID.doux='calme';PAR_ID.pose='calme';

function resoudre(texte){
  var id=PAR_ID[normaliser(texte)];
  return id||'';
}

/* Durée en ms d'une balise de pause, 0 si ce n'en est pas une. « pause », « courte pause », « longue pause », « pause 2 », « pause 2s », « pause 1,5 s », « pause 800ms ». */
function pauseMs(texte){
  var t=nettoyer(texte);
  var m=/^(courte |longue )?pause(?: (\d+(?:[.,]\d+)?) ?(ms|s)?)?$/.exec(t);
  if(!m)return 0;
  var ms;
  if(m[2]!==undefined){
    var n=parseFloat(m[2].replace(',','.'));
    if(!isFinite(n)||n<=0)return 0;
    ms=m[3]==='ms'?n:n*1000;
  }else if(m[1]==='courte '){ms=500;}
  else if(m[1]==='longue '){ms=2500;}
  else{ms=1000;}
  return Math.max(1,Math.min(PAUSE_MAX_MS,Math.round(ms)));
}

function reglages(id){
  var e=LISTE.filter(function(x){return x.id===id;})[0];
  return e&&e.exaggeration!=null?{exaggeration:e.exaggeration,cfg:e.cfg}:null;
}

window.__SOREAL_IDLE_EXPRESSIONS_V1__={
  liste:LISTE,
  pauses:PAUSES,
  resoudre:resoudre,
  pauseMs:pauseMs,
  reglages:reglages,
  baliseExpression:function(id){return '('+id+')';},
  balisePause:function(ms){
    ms=Math.max(100,Math.min(PAUSE_MAX_MS,Math.round(ms)));
    return ms%1000===0?'(pause '+(ms/1000)+'s)':'(pause '+ms+'ms)';
  },
  /* Phrase courte pour écouter une voix avant de la choisir. */
  phraseEssai:'Bonjour, voici ma voix. Qu’en pensez-vous ?'
};
})();
