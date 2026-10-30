/*
 * SOREAL IDLE — écran de connexion de l'application Android hors ligne (Norman, 2026-10-30 : « j'ai installé l'APK hors ligne : il me demande un pseudo mais je n'ai pas la possibilité de me connecter via Google pour récupérer ma partie ; j'ai mis le pseudo Redrum
 * alors que c'est mon pseudo principal, il aurait dû me dire qu'il était déjà pris. Au démarrage, je veux l'image du jeu en plein écran avec un écran de connexion ; quand on clique dessus, on choisit son compte Google ; si ce compte possède une partie, elle est
 * restaurée directement ; sinon on lui demande un pseudo pour commencer le jeu »).
 *
 * Seulement dans l'application (le pont « AndroidSoreal » existe) et tant qu'aucun compte n'est relié sur ce téléphone.
 *  1. Un clic ouvre le NAVIGATEUR du téléphone sur le jeu (« ?relais=<code> » : Google refuse la connexion dans la WebView de l'application). Le joueur choisit son compte Google ; la page du site dépose le jeton de session sur le serveur sous ce code
 *     (/api/v1/relais), et l'application le retire (src/idle-relais-apk-v1.js) : aucun changement du code Java de l'application.
 *  2. L'application lit la partie du compte SANS la prendre à un autre appareil (/api/v1/local/export?lecture=1). Si le compte a une partie (progression ou pseudo), elle est gardée de côté puis chargée dans le moteur local dès qu'il tourne
 *     (moteur-local-v1.js, chargerFichier) ; si la partie de ce téléphone est PLUS avancée, elle est conservée (et la copie du serveur ignorée). Le pseudo du compte est repris.
 *  3. Sans partie : l'écran d'accueil habituel demande le pseudo ; chaque pseudo est d'abord vérifié et RÉSERVÉ sur le serveur (/api/v1/pseudo : unique, sans accents ni majuscules), puis accepté par l'application.
 * Les clés de l'appareil n'ont PAS le préfixe « soreal_idle_ » : elles ne sont jamais recopiées sur le serveur avec les préférences du compte (règle n°6 : propres à l'appareil).
 *   window.__SOREAL_IDLE_APK_CONNEXION_V1__ = { requis, actif, demarrer, verifierPseudo, sansVerif, progression }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_APK_CONNEXION_V1__)return;

var PROD='https://soreal-idle.technicien-soreal.workers.dev';
var CLE_COMPTE='idle_apk_compte_v1';
var CLE_JETON='idle_apk_jeton_v1';
var CLE_ATTENTE='idle_apk_restauration_v1';
var CLE_SAUVEGARDE='idle_apk_sauvegarde_locale_v1';
var COL_BOSS_VAINCUS=14,COL_RENAISSANCES=24;   /* mêmes colonnes que desktop/src/liaison.mjs */

function estApk(){try{return typeof window.AndroidSoreal!=='undefined'&&window.AndroidSoreal!==null;}catch(_e){return false;}}
function lire(cle){try{return window.localStorage.getItem(cle)||'';}catch(_e){return '';}}
function ecrire(cle,valeur){try{window.localStorage.setItem(cle,valeur);return true;}catch(_e){return false;}}
function retirer(cle){try{window.localStorage.removeItem(cle);}catch(_e){}}
function json(cle){try{var v=JSON.parse(lire(cle)||'null');return v&&typeof v==='object'?v:null;}catch(_e){return null;}}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function requis(){return estApk()&&!lire(CLE_COMPTE);}
function actif(){return estApk()&&Boolean(lire(CLE_COMPTE));}

/* Progression d'une ligne de joueur : [renaissances, boss vaincus] (la plus avancée gagne, comme pour la liaison de l'application Windows). */
function progression(cells){return [Number(cells&&cells[COL_RENAISSANCES])||0,Number(cells&&cells[COL_BOSS_VAINCUS])||0];}
function comparer(a,b){var x=progression(a),y=progression(b);for(var i=0;i<x.length;i++){if(x[i]>y[i])return 1;if(x[i]<y[i])return -1;}return 0;}
function codeAleatoire(){
  var o=new Uint8Array(16),s='',i;
  try{window.crypto.getRandomValues(o);}catch(_e){for(i=0;i<o.length;i++)o[i]=Math.floor(Math.random()*256);}
  for(i=0;i<o.length;i++)s+=('0'+o[i].toString(16)).slice(-2);
  return s;
}

/* ---------- l'écran : l'image du jeu en plein écran ---------- */
var racine=null;
function style(){
  if(document.getElementById('sorealIdleApkConnexionStyleV1'))return;
  var s=document.createElement('style');s.id='sorealIdleApkConnexionStyleV1';
  s.textContent=
    '#sorealIdleApkConnexionV1{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:#071226;color:#fff;font-family:"Russo One","Trebuchet MS",Arial,sans-serif;-webkit-tap-highlight-color:transparent}'+
    '#sorealIdleApkConnexionV1 .apk-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%}'+
    '#sorealIdleApkConnexionV1 .apk-voile{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,8,20,.35) 0,rgba(4,8,20,0) 30%,rgba(4,8,20,0) 55%,rgba(4,8,20,.85) 100%)}'+
    '#sorealIdleApkConnexionV1 .apk-logo{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translateX(-50%);width:min(78vw,520px);height:auto;filter:drop-shadow(0 4px 10px rgba(0,0,0,.7))}'+
    '#sorealIdleApkConnexionV1 .apk-bas{position:absolute;left:0;right:0;bottom:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px 20px calc(env(safe-area-inset-bottom,0px) + 28px);text-align:center}'+
    '#sorealIdleApkConnexionV1 .apk-bouton{min-width:min(78vw,340px);min-height:56px;padding:14px 22px;border:3px solid #000;border-radius:14px;cursor:pointer;font:400 22px/1.1 Bangers,"Russo One",Impact,sans-serif;letter-spacing:1.2px;color:#fff;background:linear-gradient(180deg,#4285f4,#1a56c4);box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 5px 0 #000,0 0 22px rgba(66,133,244,.55)}'+
    '#sorealIdleApkConnexionV1 .apk-bouton:active{transform:translateY(3px);box-shadow:inset 0 2px 0 rgba(255,255,255,.3),0 2px 0 #000}'+
    '#sorealIdleApkConnexionV1 .apk-bouton[disabled]{filter:grayscale(.5) brightness(.8);cursor:default}'+
    '#sorealIdleApkConnexionV1 .apk-etat{min-height:22px;max-width:min(92vw,420px);font:400 15px/1.35 "Russo One","Trebuchet MS",Arial,sans-serif;color:#e6efff;text-shadow:0 2px 4px #000}'+
    '#sorealIdleApkConnexionV1 .apk-etat.erreur{color:#ffb4b4}'+
    '#sorealIdleApkConnexionV1 .apk-lien{color:#9fc4ff;font-size:14px;text-decoration:underline;cursor:pointer;background:none;border:0;padding:6px;font-family:inherit}';
  document.head.appendChild(s);
}
function afficher(titreBouton){
  if(racine&&racine.parentNode)return racine;
  style();
  racine=document.createElement('div');
  racine.id='sorealIdleApkConnexionV1';
  racine.setAttribute('role','dialog');racine.setAttribute('aria-modal','true');racine.setAttribute('data-sans-traduction','');
  racine.innerHTML=
    '<picture>'+
      '<source media="(min-width:821px) and (orientation:landscape)" srcset="/chargement/banniere-1920x620.webp">'+
      '<img class="apk-fond" src="/chargement/affiche-600x900.webp" alt="">'+
    '</picture>'+
    '<div class="apk-voile"></div>'+
    '<img class="apk-logo" src="/chargement/logo-800x450.webp" alt="SOREAL NGU IDLE">'+
    '<div class="apk-bas">'+
      '<button type="button" class="apk-bouton" id="sorealIdleApkBoutonV1">'+esc(titreBouton||'Connexion')+'</button>'+
      '<div class="apk-etat" id="sorealIdleApkEtatV1" role="status"></div>'+
    '</div>';
  document.body.appendChild(racine);
  return racine;
}
function retirerEcran(){if(racine&&racine.parentNode)racine.parentNode.removeChild(racine);racine=null;}
function message(texte,erreur){
  var e=document.getElementById('sorealIdleApkEtatV1');
  if(e){e.textContent=texte||'';e.className='apk-etat'+(erreur?' erreur':'');}
}
function bouton(){return document.getElementById('sorealIdleApkBoutonV1');}

/* ---------- connexion : le navigateur ouvre le site, l'application attend le jeton ---------- */
var promesse=null,resoudre=null,enCours=false,minuterie=null,codeEnCours='';

function demarrer(){
  if(promesse)return promesse;
  promesse=new Promise(function(ok){resoudre=ok;});
  var r=afficher('Connexion');
  message('Touche l’écran pour te connecter avec ton compte Google.',false);
  var b=bouton();
  if(b)b.addEventListener('click',function(ev){ev.stopPropagation();connecter();});
  r.addEventListener('click',function(){connecter();});
  return promesse;
}

function connecter(){
  if(enCours)return;
  enCours=true;
  codeEnCours=codeAleatoire();
  var b=bouton();if(b)b.disabled=true;
  message('Le navigateur s’ouvre : choisis ton compte Google, puis reviens dans l’application.',false);
  var adresse=PROD+'/?relais='+codeEnCours;
  try{window.location.href=adresse;}catch(_e){/* l'application ouvre le navigateur à la place */}
  attendreJeton(codeEnCours,Date.now()+10*60*1000);
}

function recommencer(texte){
  enCours=false;
  clearTimeout(minuterie);
  var b=bouton();if(b){b.disabled=false;b.textContent='Réessayer';}
  message(texte,true);
}

function attendreJeton(code,limite){
  if(code!==codeEnCours)return;
  if(Date.now()>limite){recommencer('La connexion n’a pas été terminée à temps. Touche l’écran pour réessayer.');return;}
  fetch(PROD+'/api/v1/relais?code='+encodeURIComponent(code),{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
    if(code!==codeEnCours)return;
    if(d&&d.ok&&d.jeton){apresConnexion(String(d.jeton),Number(d.expire)||0);return;}
    if(d&&d.ok&&d.attente){minuterie=setTimeout(function(){attendreJeton(code,limite);},2000);return;}
    recommencer('La connexion a échoué. Touche l’écran pour réessayer.');
  }).catch(function(){
    if(code!==codeEnCours)return;
    message('Connexion internet requise pour se connecter la première fois… nouvelle tentative.',true);
    minuterie=setTimeout(function(){attendreJeton(code,limite);},3000);
  });
}
document.addEventListener('visibilitychange',function(){
  /* retour dans l'application après le navigateur : on regarde tout de suite si le compte est connecté */
  if(!document.hidden&&enCours&&codeEnCours){clearTimeout(minuterie);attendreJeton(codeEnCours,Date.now()+10*60*1000);}
});

function apresConnexion(jeton,expire){
  message('Recherche de ta partie…',false);
  fetch(PROD+'/api/v1/local/export?lecture=1&appareil=apk',{headers:{authorization:'Bearer '+jeton},cache:'no-store'}).then(function(r){return r.json();}).then(function(exp){
    if(!exp||!exp.ok){
      var err=exp&&exp.error?String(exp.error):'';
      recommencer(/ACCES|REFUS/i.test(err)?'Ce compte n’a pas accès au jeu pour le moment.':'Ta partie n’a pas pu être lue : touche l’écran pour réessayer.');
      return;
    }
    var cells=null;
    try{cells=JSON.parse(String(exp.joueurs&&exp.joueurs.ligne||'null'));}catch(_e){cells=null;}
    var profil=(Array.isArray(exp.profils)&&exp.profils[0])||null;
    var pseudo=profil&&profil.pseudo?String(profil.pseudo):'';
    var p=progression(cells),aPartie=Array.isArray(cells)&&cells.length===38&&(p[0]>0||p[1]>0||Boolean(pseudo));
    ecrire(CLE_JETON,JSON.stringify({jeton:jeton,expire:expire}));
    if(aPartie){
      /* gardée de côté : chargée dans le moteur local dès qu'il tourne (l'écran reste jusque-là) */
      ecrire(CLE_ATTENTE,JSON.stringify({cells:cells,serveurAt:Number(exp.serveurAt)||Date.now(),pseudo:pseudo,nom:String(cells[1]||'')}));
    }
    ecrire(CLE_COMPTE,JSON.stringify({at:Date.now(),pseudo:pseudo,partie:aPartie}));
    enCours=false;
    if(aPartie)message('Ta partie a été trouvée : restauration…',false);
    else retirerEcran();   /* aucune partie sur ce compte : l'écran d'accueil habituel demande le pseudo */
    if(resoudre){resoudre();resoudre=null;}
  }).catch(function(){recommencer('Impossible de joindre le serveur : vérifie ta connexion internet et touche l’écran pour réessayer.');});
}

/* ---------- restauration de la partie du compte dans le moteur local ---------- */
var restaurationLancee=false;
function attendreMoteur(essais,suite){
  var ML=window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
  var pret=false;
  try{pret=Boolean(ML&&typeof ML.chargerFichier==='function'&&ML.etatDiag&&ML.etatDiag().demarre);}catch(_e){pret=false;}
  if(pret){suite(ML);return;}
  if(essais<=0){suite(null);return;}
  setTimeout(function(){attendreMoteur(essais-1,suite);},700);
}
function restaurer(){
  var attente=json(CLE_ATTENTE);
  if(!attente||!Array.isArray(attente.cells)||restaurationLancee)return;
  restaurationLancee=true;
  afficher('Connexion');
  var b=bouton();if(b)b.style.display='none';
  message('Restauration de ta partie…',false);
  attendreMoteur(170,function(ML){
    if(!ML){restaurationLancee=false;message('Le jeu local ne démarre pas : ferme puis rouvre l’application.',true);return;}
    ML.exporterLigne().then(function(locale){
      /* la partie de ce téléphone est PLUS avancée que celle du compte : elle est conservée */
      var garderLocale=Array.isArray(locale)&&comparer(locale,attente.cells)>0;
      if(!garderLocale&&Array.isArray(locale)){var pl=progression(locale);if(pl[0]>0||pl[1]>0)ecrire(CLE_SAUVEGARDE,JSON.stringify({cells:locale,le:new Date().toISOString()}));}
      var suite=garderLocale?Promise.resolve({ok:true}):ML.chargerFichier({format:'soreal-idle-partie-v1',version:1,exporteLe:new Date().toISOString(),serveurAt:Number(attente.serveurAt)||Date.now(),nom:String(attente.nom||''),cells:attente.cells});
      return suite.then(function(r){
        if(!r||!r.ok){message('La partie n’a pas pu être chargée : ferme puis rouvre l’application pour réessayer.',true);restaurationLancee=false;return;}
        return appliquerPseudo(attente.pseudo).then(function(){
          retirer(CLE_ATTENTE);
          message('Partie restaurée !',false);
          setTimeout(function(){window.location.reload();},700);
        });
      });
    }).catch(function(e){restaurationLancee=false;message('Restauration impossible : '+(e&&e.message?e.message:'erreur')+'. Ferme puis rouvre l’application.',true);});
  });
}
/* Le pseudo du compte devient celui de l'application (déjà unique sur le serveur : aucune vérification de plus). */
var contourVerif=false;
function appliquerPseudo(pseudo){
  if(!pseudo)return Promise.resolve();
  var S=window.__SOREAL_IDLE_STANDALONE_V1__,session=S&&typeof S.session==='function'?S.session():'';
  if(!session||typeof window.__SOREAL_IDLE_CALL_V1__!=='function')return Promise.resolve();
  contourVerif=true;
  return Promise.resolve(window.__SOREAL_IDLE_CALL_V1__('definirPseudoSorealIdle',[session,pseudo])).catch(function(){}).then(function(){contourVerif=false;});
}

/* ---------- pseudo unique : vérifié et réservé sur le serveur AVANT d'être accepté par l'application ---------- */
function verifierPseudo(pseudo){
  var t=json(CLE_JETON);
  if(!t||!t.jeton)return Promise.resolve({ok:false,code:'PSEUDO_COMPTE',message:'Ton compte n’est pas connecté : ferme puis rouvre l’application pour te connecter.'});
  if(t.expire&&Number(t.expire)<Date.now())return Promise.resolve({ok:false,code:'PSEUDO_COMPTE',message:'Ta connexion au compte a expiré : ferme puis rouvre l’application.'});
  return fetch(PROD+'/api/v1/pseudo',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+t.jeton},body:JSON.stringify({pseudo:String(pseudo||'')})}).then(function(r){
    return r.json().catch(function(){return null;}).then(function(d){
      if(d&&d.ok)return {ok:true,pseudo:d.pseudo};
      if(r.status===401)return {ok:false,code:'PSEUDO_COMPTE',message:'Ta connexion au compte a expiré : ferme puis rouvre l’application.'};
      return {ok:false,code:d&&d.code,message:(d&&d.message)||'Ce pseudo ne peut pas être utilisé.'};
    });
  }).catch(function(){return {ok:false,code:'PSEUDO_RESEAU',message:'Internet est nécessaire pour vérifier que ce pseudo est libre : réessaie quand tu as du réseau.'};});
}

window.__SOREAL_IDLE_APK_CONNEXION_V1__={requis:requis,actif:actif,demarrer:demarrer,verifierPseudo:verifierPseudo,sansVerif:function(){return contourVerif;},progression:progression,comparer:comparer,restaurer:restaurer};

/* Une restauration restée en attente (application fermée avant la fin) reprend toute seule. */
if(estApk()){
  var lancer=function(){if(json(CLE_ATTENTE))restaurer();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',lancer);else lancer();
  /* juste après la connexion, la restauration démarre dès que le jeu s'ouvre */
  var guet=setInterval(function(){if(json(CLE_ATTENTE)){clearInterval(guet);restaurer();}},800);
  setTimeout(function(){clearInterval(guet);},15*60*1000);
}
})();
