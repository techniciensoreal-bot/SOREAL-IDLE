/*
 * SOREAL IDLE — préférences liées au COMPTE (Norman, 2026-10-16 : « les cases, les inputs, les réglages... tout doit être lié au compte et pareil sur tous les appareils »).
 *
 * Tout ce que le jeu mémorise dans le stockage du navigateur (cases cochées, montants saisis, onglets ouverts, volumes, effets, réglages, choix Manger/Récolter...) passe par localStorage avec une clé
 * « soreal_idle_… » : ce module recopie ces clés côté serveur (action « setUiPrefs », voir src/idle-ui-prefs-v1.js) et les remet dans le navigateur de chaque appareil. AUCUN module du jeu n'a à changer :
 *  - ÉCRITURE : setItem / removeItem sur une clé suivie la mettent en attente ; un seul envoi groupé 1,5 s après le dernier changement (ou tout de suite quand la page se cache) ;
 *  - LECTURE : chaque réponse du serveur porte systemes.uiPrefs (pièce omise tant qu'elle ne change pas, voir idle-catalogues-v1.js) ; le pont (standalone-bridge.js) appelle appliquer() ;
 *    les valeurs du compte l'emportent, sauf pour une clé que cet appareil vient de changer et n'a pas encore fini d'envoyer ;
 *  - PREMIÈRE FOIS sur un appareil : ses choix existants sont envoyés pour les clés que le compte n'a pas encore (aucun réglage perdu) ; ensuite une clé absente du compte est supprimée ici aussi ;
 *  - une valeur du compte qui change au chargement de la page (réglage fait sur un autre appareil) recharge la page UNE fois, pour que volumes, langue, effets... soient lus par tous les modules.
 * Jamais synchronisés : jeton de session, journal de diagnostic et mesures de performance (ils changent toutes les 10 s), cache admin, position d'une fenêtre. Sans serveur joignable, le jeu garde ses choix locaux et réessaie.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_PREFS_V1__)return;

var DELAI_MS=1500, RELANCE_MS=8000, LOT_MAX=80, VALEUR_MAX=8000;
var EXCLUES=/^(soreal_idle_session_v1|soreal_idle_google_session_v1|soreal_idle_diag_v1|soreal_idle_perf_v1|soreal_idle_admin_prononciations_v1|soreal_idle_lecteur_chroniques_pos_v1|soreal_idle_prefs_)/;
var stock=null;try{stock=window.localStorage;}catch(_e){}
if(!stock||typeof Storage==='undefined'){window.__SOREAL_IDLE_PREFS_V1__={appliquer:function(){},suivie:function(){return false;}};return;}

var natifSet=Storage.prototype.setItem, natifRem=Storage.prototype.removeItem;
var attente={};      /* clé -> valeur (texte) ou null : changements locaux pas encore envoyés */
var enVol={};        /* clé -> valeur : envoyés, réponse pas encore reçue */
var connu={};        /* dernier état connu du compte */
var minuterie=0, envoiEnCours=false, echecs=0, premiereReception=true;

function suivie(cle){
  return typeof cle==='string'&&cle.length>0&&cle.length<=120&&/^(soreal_idle_|sorealIdle)/.test(cle)&&/^[A-Za-z0-9_.:\-]+$/.test(cle)&&!EXCLUES.test(cle);
}
function lire(cle){var v=null;try{v=stock.getItem(cle);}catch(_e){}return v;}
function ecrireLocal(cle,v){try{if(v===null)natifRem.call(stock,cle);else natifSet.call(stock,cle,v);}catch(_e){}}

function planifier(delai){
  if(minuterie)return;
  minuterie=setTimeout(function(){minuterie=0;envoyer();},typeof delai==='number'?delai:DELAI_MS);
}
function marquer(cle,valeur){
  if(valeur!==null&&valeur.length>VALEUR_MAX)return;                       /* trop gros pour le compte : reste local */
  var deja=Object.prototype.hasOwnProperty.call(connu,cle)?connu[cle]:null;
  if(deja===valeur&&!Object.prototype.hasOwnProperty.call(attente,cle))return; /* le compte a déjà cette valeur */
  attente[cle]=valeur;
  planifier();
}

Storage.prototype.setItem=function(cle,valeur){
  natifSet.call(this,cle,valeur);
  if(this===stock&&suivie(String(cle)))marquer(String(cle),String(valeur));
};
Storage.prototype.removeItem=function(cle){
  natifRem.call(this,cle);
  if(this===stock&&suivie(String(cle)))marquer(String(cle),null);
};

function envoyer(){
  if(envoiEnCours)return;
  var cles=Object.keys(attente);
  if(!cles.length)return;
  var appeler=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof appeler!=='function'){planifier(RELANCE_MS);return;}
  var lot={};
  cles.slice(0,LOT_MAX).forEach(function(c){lot[c]=attente[c];enVol[c]=attente[c];delete attente[c];});
  envoiEnCours=true;
  var fin=function(ok){
    envoiEnCours=false;
    Object.keys(lot).forEach(function(c){
      if(enVol[c]===lot[c])delete enVol[c];
      if(ok){if(lot[c]===null)delete connu[c];else connu[c]=lot[c];}
      else if(!Object.prototype.hasOwnProperty.call(attente,c))attente[c]=lot[c];   /* un changement plus récent garde la priorité */
    });
    if(ok)echecs=0;else echecs+=1;
    if(Object.keys(attente).length)planifier(ok?DELAI_MS:Math.min(60000,RELANCE_MS*Math.max(1,echecs)));
  };
  var p;
  try{p=appeler('agirProgressionSorealIdle',[{action:'setUiPrefs',prefs:lot}]);}catch(_e){fin(false);return;}
  Promise.resolve(p).then(function(r){fin(Boolean(r&&r.ok!==false));},function(){fin(false);});
}

function rechargerUneFois(){
  var CLE='soreal_idle_prefs_rechargee_v1';
  var dernier=0;try{dernier=Number(window.sessionStorage.getItem(CLE))||0;}catch(_e){}
  if(Date.now()-dernier<60000)return;
  try{window.sessionStorage.setItem(CLE,String(Date.now()));}catch(_e){return;}
  try{window.location.reload();}catch(_e){}
}

/* Réponse du serveur : remet les valeurs du compte dans le stockage de cet appareil. */
function appliquer(joueur){
  var p=joueur&&joueur.systemes&&joueur.systemes.uiPrefs;
  if(!p||typeof p!=='object'||Array.isArray(p))return;
  var changees=0;
  Object.keys(connu).forEach(function(c){delete connu[c];});
  Object.keys(p).forEach(function(c){if(typeof p[c]==='string')connu[c]=p[c];});
  var marqueInit='soreal_idle_prefs_init_v1:'+String((joueur&&joueur.nom)||'');
  var dejaInitialise=lire(marqueInit)!==null;
  Object.keys(p).forEach(function(c){
    if(!suivie(c)||typeof p[c]!=='string')return;
    if(Object.prototype.hasOwnProperty.call(attente,c)||Object.prototype.hasOwnProperty.call(enVol,c))return;  /* cet appareil vient de la changer */
    if(lire(c)!==p[c]){ecrireLocal(c,p[c]);changees+=1;}
  });
  /* Clés de cet appareil que le compte n'a pas : premier passage = on les envoie ; ensuite = elles ont été supprimées ailleurs. */
  var locales=[];
  try{for(var i=0;i<stock.length;i+=1){var c=stock.key(i);if(suivie(c))locales.push(c);}}catch(_e){}
  locales.forEach(function(c){
    if(Object.prototype.hasOwnProperty.call(p,c))return;
    var gros=lire(c);if(gros!==null&&gros.length>VALEUR_MAX)return;   /* trop gros pour le compte : reste local, jamais supprimé*/
    if(Object.prototype.hasOwnProperty.call(attente,c)||Object.prototype.hasOwnProperty.call(enVol,c))return;
    if(!dejaInitialise){var v=lire(c);if(v!==null&&v.length<=VALEUR_MAX)attente[c]=v;}
    else{ecrireLocal(c,null);changees+=1;}
  });
  if(!dejaInitialise){try{natifSet.call(stock,marqueInit,'1');}catch(_e){}}
  if(Object.keys(attente).length)planifier();
  var premiere=premiereReception;premiereReception=false;
  if(changees>0&&premiere)rechargerUneFois();
}

try{
  document.addEventListener('visibilitychange',function(){if(document.hidden&&Object.keys(attente).length){if(minuterie){clearTimeout(minuterie);minuterie=0;}envoyer();}});
  window.addEventListener('pagehide',function(){if(Object.keys(attente).length){if(minuterie){clearTimeout(minuterie);minuterie=0;}envoyer();}});
}catch(_e){}

window.__SOREAL_IDLE_PREFS_V1__={appliquer:appliquer,suivie:suivie,envoyer:envoyer,attente:function(){return Object.assign({},attente);}};
})();
