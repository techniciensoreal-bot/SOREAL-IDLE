/*
 * SOREAL IDLE — l'application Android hors ligne REVENDIQUE la partie du compte auprès du VRAI serveur (Norman, 2026-10-30 : « quand je lance l'APK hors ligne, je peux jouer sans qu'il me déconnecte de ma session PC »).
 * Règle n°7 d'AGENTS.md : un seul appareil joue à la fois. Dans l'application, le « serveur » de la page est un service worker local (sw-android.js) : sans ce module, rien n'était jamais dit au vrai serveur.
 * Seulement dans l'application, une fois le compte relié (apk-connexion-v1.js), et jamais pendant une restauration en attente :
 *  1. au démarrage, EN LIGNE : export du vrai serveur (/api/v1/local/export?appareil=…, SANS « lecture=1 » : il revendique la partie, le PC reçoit « Partie reprise sur un autre appareil » à son prochain envoi, et le serveur
 *     garde sa copie de sécurité) ;
 *  2. décision (decider) : la partie la plus récente gagne, jamais un état plus ancien sur un plus récent. « base » = ce qu'on savait du serveur à la dernière synchro réussie (sa « Dernière synchro », colonne 16) et de la partie locale.
 *     Le serveur n'a pas bougé depuis la base : la partie du téléphone est la suite, elle part. Le serveur a bougé et le téléphone non : celle du serveur est chargée dans le moteur local (rechargement). Les deux ont bougé : la plus avancée
 *     (renaissances, puis boss vaincus) gagne ; à égalité le serveur (sans base : le téléphone). La perdante n'est pas détruite : celle du téléphone est mise de côté (idle_apk_sauvegarde_locale_v1), celle du serveur est copiée par lui (« avant-import ») ;
 *  3. ensuite : envoi de la ligne du joueur toutes les 60 s si elle a changé, au passage en arrière-plan, et au retour d'internet. Un envoi refusé pour « conflit » (le PC a repris la partie) arrête tout et affiche « Partie reprise sur un autre appareil » :
 *     recharger refait la revendication et la décision ci-dessus.
 * Sans internet (ou jeton expiré) l'application joue en local, comme avant ; la synchro reprend au retour du réseau. Clés sans le préfixe « soreal_idle_ » : propres à l'appareil, jamais recopiées avec les préférences du compte (règle n°6).
 *   window.__SOREAL_IDLE_APK_SYNCHRO_V1__ = { decider, comparer, progression, synchroniser, tick, etat }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_APK_SYNCHRO_V1__)return;

var PROD='https://soreal-idle.technicien-soreal.workers.dev';
var CLE_APPAREIL='idle_apk_appareil_v1';
var CLE_JETON='idle_apk_jeton_v1';
var CLE_COMPTE='idle_apk_compte_v1';
var CLE_ATTENTE='idle_apk_restauration_v1';
var CLE_SAUVEGARDE='idle_apk_sauvegarde_locale_v1';
var CLE_BASE='idle_apk_base_serveur_v1';
var COL_SYNCHRO=15,COL_BOSS_VAINCUS=14,COL_RENAISSANCES=24;
var INTERVALLE_MS=60000;

function estApk(){try{return typeof window.AndroidSoreal!=='undefined'&&window.AndroidSoreal!==null;}catch(_e){return false;}}
function lire(cle){try{return window.localStorage.getItem(cle)||'';}catch(_e){return '';}}
function ecrire(cle,valeur){try{window.localStorage.setItem(cle,valeur);return true;}catch(_e){return false;}}
function json(cle){try{var v=JSON.parse(lire(cle)||'null');return v&&typeof v==='object'?v:null;}catch(_e){return null;}}

function progression(cells){return [Number(cells&&cells[COL_RENAISSANCES])||0,Number(cells&&cells[COL_BOSS_VAINCUS])||0];}
function comparer(a,b){var x=progression(a),y=progression(b);for(var i=0;i<x.length;i++){if(x[i]>y[i])return 1;if(x[i]<y[i])return -1;}return 0;}

/* Qui gagne : 'local' (la partie du téléphone part) ou 'serveur' (celle du compte est chargée). Fonction pure. */
function decider(locale,serveur,base){
  var serveurBouge=!base||String(base.srv)!==String(serveur[COL_SYNCHRO]);
  var localBouge=!base||String(base.loc)!==String(locale[COL_SYNCHRO]);
  if(!serveurBouge)return 'local';
  if(!localBouge)return 'serveur';
  var c=comparer(locale,serveur);
  if(c>0)return 'local';
  if(c<0)return 'serveur';
  return base?'serveur':'local';
}

function aleatoire(){
  var o=new Uint8Array(8),s='',i;
  try{window.crypto.getRandomValues(o);}catch(_e){for(i=0;i<o.length;i++)o[i]=Math.floor(Math.random()*256);}
  for(i=0;i<o.length;i++)s+=('0'+o[i].toString(16)).slice(-2);
  return s;
}
/* Identifiant de CET appareil auprès du serveur : stable d'un lancement à l'autre (une revendication se reconnaît). */
function appareil(){var a=lire(CLE_APPAREIL);if(!a){a='apk'+aleatoire();ecrire(CLE_APPAREIL,a);}return a;}
function jetonValide(){var t=json(CLE_JETON);if(!t||!t.jeton)return '';if(t.expire&&Number(t.expire)<Date.now())return '';return String(t.jeton);}

var etat={pret:false,conflit:false,enVol:false,premierEnvoiFait:false,depuis:0,arrete:false,moteur:null,adoption:false};

function appeler(chemin,options){
  var jeton=jetonValide();
  if(!jeton)return Promise.reject(new Error('SANS_JETON'));
  options=options||{};
  options.headers=Object.assign({accept:'application/json',authorization:'Bearer '+jeton},options.headers||{});
  options.cache='no-store';
  return fetch(PROD+chemin,options).then(function(r){return r.json().catch(function(){return null;}).then(function(d){return {status:r.status,d:d};});});
}

/* ---------- écrans ---------- */
function voile(id,titre,texte,bouton){
  if(document.getElementById(id))return;
  var d=document.createElement('div');
  d.id=id;d.setAttribute('data-sans-traduction','');
  d.style.cssText='position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(5,8,18,.88);padding:20px;font-family:inherit';
  d.innerHTML='<div style="max-width:420px;background:#12182b;border:1px solid #3b4670;border-radius:14px;padding:22px;color:#e8ecfa;text-align:center"><div style="font-size:20px;font-weight:700;margin-bottom:10px">'+titre+'</div><div style="font-size:15px;color:#aab3d1;margin-bottom:'+(bouton?'16':'0')+'px">'+texte+'</div>'+(bouton?'<button type="button" style="font-size:16px;padding:10px 18px;border-radius:10px;border:0;background:#4f7cff;color:#fff;cursor:pointer" onclick="location.reload()">'+bouton+'</button>':'')+'</div>';
  document.body.appendChild(d);
}
function afficherConflit(){
  voile('sorealIdleApkConflitV1','Partie reprise sur un autre appareil','Cette partie vient d’être ouverte ailleurs. Recharge l’application pour la reprendre là où elle en est.','Recharger');
}

/* ---------- envoi de la ligne du joueur au vrai serveur ---------- */
function pousser(cells){
  if(etat.conflit||etat.enVol||etat.arrete)return Promise.resolve(false);
  etat.enVol=true;
  var corps={cells:cells,flux:[],gains:[],appareil:appareil(),depuis:etat.depuis,rev:1};
  /* Premier envoi réussi : le serveur en garde d'abord une copie (« avant-import »), même s'il vient de le faire pour l'export. */
  if(!etat.premierEnvoiFait)corps.importPartie=true;
  return appeler('/api/v1/local/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(corps)}).then(function(r){
    var d=r.d;
    if(d&&d.conflit){etat.conflit=true;afficherConflit();return false;}
    /* Reçu mais refusé (le serveur en détient une plus récente) : pas une sauvegarde ; l'envoi sera retenté. */
    if(d&&d.ok&&d.ecrit!==false){
      etat.premierEnvoiFait=true;
      ecrire(CLE_BASE,JSON.stringify({srv:String(cells[COL_SYNCHRO]),loc:String(cells[COL_SYNCHRO])}));
      return true;
    }
    return false;
  }).catch(function(){return false;}).then(function(v){etat.enVol=false;return v;});
}

/* Envoi périodique : seulement si la ligne a changé depuis la dernière synchro réussie. */
function tick(forcer){
  if(!etat.pret||etat.conflit||etat.arrete||etat.adoption||!etat.moteur)return Promise.resolve(false);
  return etat.moteur.exporterLigne().then(function(cells){
    if(!Array.isArray(cells)||cells.length!==38)return false;
    var base=json(CLE_BASE);
    if(!forcer&&base&&String(base.loc)===String(cells[COL_SYNCHRO]))return false;
    return pousser(cells);
  }).catch(function(){return false;});
}

/* La partie du compte est plus récente : elle est chargée dans le moteur local ; celle du téléphone est mise de côté d'abord. */
function adopterServeur(exp,serveur,locale){
  if(!Array.isArray(serveur)||serveur.length!==38)return Promise.resolve('serveur-invalide');
  etat.adoption=true;
  var pl=progression(locale);
  if(pl[0]>0||pl[1]>0)ecrire(CLE_SAUVEGARDE,JSON.stringify({cells:locale,le:new Date().toISOString()}));
  voile('sorealIdleApkAdoptionV1','Partie du compte','Une partie plus récente existe sur ton compte : chargement…','');
  return etat.moteur.chargerFichier({format:'soreal-idle-partie-v1',version:1,exporteLe:new Date().toISOString(),serveurAt:Number(exp.serveurAt)||Date.now(),nom:String(serveur[1]||''),cells:serveur}).then(function(r){
    if(!r||!r.ok){etat.adoption=false;var v=document.getElementById('sorealIdleApkAdoptionV1');if(v&&v.parentNode)v.parentNode.removeChild(v);return 'chargement-refuse';}
    return etat.moteur.exporterLigne().then(function(apres){
      ecrire(CLE_BASE,JSON.stringify({srv:String(serveur[COL_SYNCHRO]),loc:String(apres&&apres[COL_SYNCHRO])}));
      setTimeout(function(){window.location.reload();},500);
      return 'serveur-charge';
    });
  }).catch(function(){etat.adoption=false;return 'chargement-refuse';});
}

/* Revendication + décision. Résout par un mot : 'hors-ligne', 'refuse', 'local', 'serveur-charge', ... */
function synchroniser(){
  if(!etat.moteur)return Promise.resolve('moteur');
  if(!jetonValide())return Promise.resolve('sans-jeton');
  return appeler('/api/v1/local/export?appareil='+encodeURIComponent(appareil())).then(function(r){
    var exp=r.d;
    if(!exp||!exp.ok){etat.arrete=true;return 'refuse';}   /* session refusée, interrupteur général coupé : rien n'est envoyé */
    var serveur=null;
    try{serveur=JSON.parse(String(exp.joueurs&&exp.joueurs.ligne||'null'));}catch(_e){serveur=null;}
    if(!Array.isArray(serveur)||serveur.length!==38)return 'serveur-invalide';
    etat.depuis=Number(exp.serveurAt)||Date.now();
    return etat.moteur.exporterLigne().then(function(locale){
      if(!Array.isArray(locale)||locale.length!==38)return 'moteur';
      if(decider(locale,serveur,json(CLE_BASE))==='serveur')return adopterServeur(exp,serveur,locale);
      return pousser(locale).then(function(ok){etat.pret=true;return ok?'local':'local-refuse';});
    });
  },function(){return 'hors-ligne';});
}

/* ---------- démarrage ---------- */
function attendreMoteur(essais,suite){
  var ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
  var pret=false;
  try{pret=Boolean(ML&&typeof ML.exporterLigne==='function'&&typeof ML.chargerFichier==='function'&&ML.etatDiag&&ML.etatDiag().demarre);}catch(_e){pret=false;}
  if(pret){suite(ML);return;}
  if(essais<=0){suite(null);return;}
  setTimeout(function(){attendreMoteur(essais-1,suite);},700);
}
var enCours=false;
function lancer(){
  if(enCours||etat.pret||etat.arrete||etat.adoption)return;
  if(!estApk()||!lire(CLE_COMPTE)||json(CLE_ATTENTE))return;   /* compte pas encore relié, ou restauration en attente (elle recharge la page) */
  enCours=true;
  attendreMoteur(170,function(ML){
    if(!ML){enCours=false;return;}
    etat.moteur=ML;
    synchroniser().then(function(res){
      enCours=false;
      if(res==='local'||res==='local-refuse')etat.pret=true;
    },function(){enCours=false;});
  });
}

window.__SOREAL_IDLE_APK_SYNCHRO_V1__={decider:decider,comparer:comparer,progression:progression,synchroniser:synchroniser,tick:tick,lancer:lancer,etat:function(){return etat;}};

if(estApk()){
  /* Essais réguliers : compte relié après le chargement de la page, réseau absent au démarrage, restauration terminée. */
  setInterval(function(){lancer();},4000);
  setInterval(function(){tick(false);},INTERVALLE_MS);
  window.addEventListener('online',function(){lancer();tick(false);});
  document.addEventListener('visibilitychange',function(){if(document.hidden)tick(true);else lancer();});
  window.addEventListener('pagehide',function(){tick(true);});
  lancer();
}
})();
