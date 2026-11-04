/*
 * SOREAL IDLE — l'application Android hors ligne REVENDIQUE la partie du compte auprès du VRAI serveur (Norman, 2026-10-30 : « quand je lance l'APK hors ligne, je peux jouer sans qu'il me déconnecte de ma session PC »).
 * Règle n°7 d'AGENTS.md : un seul appareil joue à la fois. Dans l'application, le « serveur » de la page est un service worker local (sw-android.js) : sans ce module, rien n'était jamais dit au vrai serveur.
 * Seulement dans l'application, une fois le compte relié (apk-connexion-v1.js), et jamais pendant une restauration en attente :
 *  1. au démarrage, EN LIGNE : export du vrai serveur (/api/v1/local/export?appareil=…, SANS « lecture=1 » : il revendique la partie, le PC reçoit « Partie reprise sur un autre appareil » à son prochain envoi, et le serveur
 *     garde sa copie de sécurité) ;
 *  2. décision (trancher / decider) : la partie la plus RÉCENTE gagne, SANS question (Norman, 2026-11-03 : « il faudrait un moyen de ne pas avoir à choisir et de toujours avoir la plus récente »). Les dates comparées sont celles de la dernière PROGRESSION :
 *     serveur = exp.progressionAt (instant du dernier envoi accepté d'un appareil, src/idle-local-sync-v1.js) ; téléphone = idle_apk_activite_v1 (dernière activité du moteur local, écrite par noterActivite). Jamais « Dernière synchro » (colonne 16) :
 *     le serveur la remet à « maintenant » à chaque export et le moteur local à chaque démarrage, d'où deux dates identiques (cause du bug). Dates absentes ou à moins de 2 s : départage par la progression (renaissances, boss vaincus, temps de jeu) ; égalité : rien à choisir.
 *     L'AUTRE partie n'est jamais perdue : celle du téléphone part au serveur en sauvegarde « appareil-ecrase » (30 jours) et reste sur le téléphone ; celle du serveur est copiée par le serveur (« avant-choix-appareil », 30 jours) avant d'être remplacée.
 *     Un petit message de 3,5 s dit laquelle a été retenue ; Réglages > Ma partie garde deux boutons pour forcer l'autre (forcer). Plus d'écran de choix.
 *     Celle du serveur gagne : elle est chargée dans le moteur local (rechargement), après l'envoi de celle du téléphone au serveur comme SAUVEGARDE SEULE et sa copie sur le téléphone (idle_apk_sauvegarde_locale_v1).
 *     Celle du téléphone gagne : elle REMPLACE celle du serveur (choixAppareil). Une partie vide cède à l'autre.
 *  3. ensuite : envoi de la ligne du joueur toutes les 60 s si elle a changé, au passage en arrière-plan, et au retour d'internet. Un envoi refusé pour « conflit » (le PC a repris la partie) arrête tout et affiche « Partie reprise sur un autre appareil » :
 *     recharger refait la revendication et la décision ci-dessus.
 * Sans internet (ou jeton expiré) l'application joue en local, comme avant ; la synchro reprend au retour du réseau. Clés sans le préfixe « soreal_idle_ » : propres à l'appareil, jamais recopiées avec les préférences du compte (règle n°6).
 *   window.__SOREAL_IDLE_APK_SYNCHRO_V1__ = { decider, trancher, comparer, progression, synchroniser, forcer, noterActivite, tick, etat }
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
var CLE_ADOPTE='idle_apk_adopte_v1';        /* signature de la partie du serveur DÉJÀ chargée sur le téléphone : une même partie n'est jamais rechargée deux fois (boucle de rechargement, Norman 2026-11-04) */
var CLE_ACTIVITE='idle_apk_activite_v1';    /* dernière activité du moteur local, en millisecondes (heure du moteur = heure du serveur) */
var CLE_MESSAGE='idle_apk_message_v1';      /* message à montrer au prochain chargement (la page se recharge après avoir pris la partie du serveur) */
var COL_SYNCHRO=15,COL_BOSS_VAINCUS=14,COL_RENAISSANCES=24,COL_STATS=37;
var TOLERANCE_DATE_MS=2000;
var INTERVALLE_MS=60000;

function estApk(){try{return typeof window.AndroidSoreal!=='undefined'&&window.AndroidSoreal!==null;}catch(_e){return false;}}
function lire(cle){try{return window.localStorage.getItem(cle)||'';}catch(_e){return '';}}
function ecrire(cle,valeur){try{window.localStorage.setItem(cle,valeur);return true;}catch(_e){return false;}}
function json(cle){try{var v=JSON.parse(lire(cle)||'null');return v&&typeof v==='object'?v:null;}catch(_e){return null;}}

function progression(cells){return [Number(cells&&cells[COL_RENAISSANCES])||0,Number(cells&&cells[COL_BOSS_VAINCUS])||0];}
function enMs(v){var n=Number(v);return(isFinite(n)&&String(v).trim()!=='')?n:Date.parse(String(v));}
/* Temps de jeu cumulé (records.playSeconds, dans la colonne « Stats JSON » ou l'état avancé) : dernier départage. 0 si introuvable. */
function chercherTemps(o,p){if(!o||typeof o!=='object'||p>5)return 0;if(typeof o.playSeconds==='number')return o.playSeconds;for(var k in o){if(Object.prototype.hasOwnProperty.call(o,k)){var v=chercherTemps(o[k],p+1);if(v>0)return v;}}return 0;}
function tempsDeJeu(cells){try{var v=cells&&cells[COL_STATS];return chercherTemps(typeof v==='string'?JSON.parse(v):v,0)||0;}catch(_e){return 0;}}
function comparer(a,b){var x=progression(a),y=progression(b);for(var i=0;i<x.length;i++){if(x[i]>y[i])return 1;if(x[i]<y[i])return -1;}return 0;}
function comparerComplet(a,b){var c=comparer(a,b);if(c!==0)return c;var x=tempsDeJeu(a),y=tempsDeJeu(b);return x>y?1:(x<y?-1:0);}

/*
 * Qui gagne, sans question : { qui:'local'|'serveur', raison, different, forcer }. Fonction pure.
 * infos = { locAt, srvAt } : instants (ms) de la dernière progression de chaque côté, NaN/0 si inconnus.
 * 1. une partie vide cède à l'autre ; 2. dates connues et distinctes (plus de 2 s) : la plus récente ; 3. sinon la progression (renaissances, boss vaincus, temps de jeu) ; 4. sinon identiques : celle du téléphone (rien à choisir).
 * different = les deux n'ont pas la même progression (renaissances ou boss) : c'est alors seulement que le joueur est prévenu.
 * forcer = la partie du téléphone doit REMPLACER celle du serveur même si la date reçue par le serveur est plus ancienne (copie de sécurité côté serveur).
 */
function trancher(locale,serveur,infos,base){
  infos=infos||{};
  var pl=progression(locale),ps=progression(serveur);
  var vide=function(p){return p[0]===0&&p[1]===0;};
  var different=comparer(locale,serveur)!==0;
  if(vide(ps)&&!vide(pl))return {qui:'local',raison:'serveur-vide',different:true,forcer:true};
  if(vide(pl)&&!vide(ps))return {qui:'serveur',raison:'locale-vide',different:true,forcer:false};
  var locAt=Number(infos.locAt),srvAt=Number(infos.srvAt);
  if(locAt>0&&srvAt>0&&Math.abs(locAt-srvAt)>TOLERANCE_DATE_MS){
    return locAt>srvAt?{qui:'local',raison:'date',different:different,forcer:true}:{qui:'serveur',raison:'date',different:different,forcer:false};
  }
  /* Sans dates fiables : le serveur n'a pas bougé depuis la dernière synchro connue, la partie du téléphone est la suite. */
  if(!(locAt>0&&srvAt>0)&&base&&String(base.srv)===String(serveur[COL_SYNCHRO]))return {qui:'local',raison:'serveur-inchange',different:different,forcer:false};
  var c=comparerComplet(locale,serveur);
  if(c>0)return {qui:'local',raison:'progression',different:different,forcer:true};
  if(c<0)return {qui:'serveur',raison:'progression',different:different,forcer:false};
  return {qui:'local',raison:'identique',different:false,forcer:false};
}
/* Signature d'une partie du serveur (dernière progression acceptée, renaissances, boss vaincus, temps de jeu) : égale d'un lancement à l'autre tant que personne n'a joué ailleurs. */
function signatureServeur(exp,serveur){return String(Number(exp&&exp.progressionAt)||0)+'|'+progression(serveur).join(',')+'|'+Math.round(tempsDeJeu(serveur));}
function decider(locale,serveur,base,infos){return trancher(locale,serveur,infos,base).qui;}

/* Dernière activité du moteur local : jamais « Dernière synchro » lue à l'ouverture (le moteur la remet à « maintenant » à chaque démarrage). */
function activiteLocale(){var a=json(CLE_ACTIVITE);return a&&Number(a.t)>0?Number(a.t):0;}
function ecrireActivite(t){if(Number(t)>0)ecrire(CLE_ACTIVITE,JSON.stringify({t:Math.round(Number(t))}));}

function aleatoire(){
  var o=new Uint8Array(8),s='',i;
  try{window.crypto.getRandomValues(o);}catch(_e){for(i=0;i<o.length;i++)o[i]=Math.floor(Math.random()*256);}
  for(i=0;i<o.length;i++)s+=('0'+o[i].toString(16)).slice(-2);
  return s;
}
/* Identifiant de CET appareil auprès du serveur : stable d'un lancement à l'autre (une revendication se reconnaît). */
function appareil(){var a=lire(CLE_APPAREIL);if(!a){a='apk'+aleatoire();ecrire(CLE_APPAREIL,a);}return a;}
function jetonValide(){var t=json(CLE_JETON);if(!t||!t.jeton)return '';if(t.expire&&Number(t.expire)<Date.now())return '';return String(t.jeton);}

var etat={pret:false,conflit:false,enVol:false,premierEnvoiFait:false,depuis:0,arrete:false,moteur:null,adoption:false,activiteLue:false,horsLigne:false};

/* Petit message discret (3,5 s), traduit par le traducteur de la page : aucune fenêtre, aucun choix. */
function message(texte){
  try{
    var d=document.createElement('div');
    d.id='sorealIdleApkMessageV1';
    d.setAttribute('role','status');
    d.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147482000;max-width:90vw;background:rgba(18,24,43,.94);border:1px solid #3b4670;border-radius:10px;padding:9px 16px;color:#e8ecfa;font-size:14px;text-align:center;pointer-events:none;font-family:inherit';
    d.textContent=texte;
    document.body.appendChild(d);
    setTimeout(function(){try{if(d.parentNode)d.parentNode.removeChild(d);}catch(_e){}},3500);
  }catch(_e){}
}
function texteRetenue(qui){return qui==='serveur'?'Partie la plus récente chargée (serveur)':'Partie la plus récente chargée (locale)';}

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
function pousser(cells,choix){
  if(etat.conflit||etat.enVol||etat.arrete)return Promise.resolve(false);
  etat.enVol=true;
  var corps={cells:cells,flux:[],gains:[],appareil:appareil(),depuis:etat.depuis,rev:1};
  /* Premier envoi réussi : le serveur en garde d'abord une copie (« avant-import »), même s'il vient de le faire pour l'export. */
  if(choix)corps.choixAppareil=true;   /* la partie du téléphone REMPLACE celle du serveur (copie « avant-choix-appareil », 30 jours) */
  else if(!etat.premierEnvoiFait)corps.importPartie=true;
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
    return pousser(cells).then(function(ok){noterActivite();return ok;});
  }).catch(function(){return false;});
}

/* La partie du compte est plus récente : elle est chargée dans le moteur local ; celle du téléphone est mise de côté d'abord. */
/* Copie de la partie du téléphone au serveur comme SAUVEGARDE SEULE (30 jours, jamais appliquée) : vrai si le serveur l'a gardée. */
function sauvegarderLocaleSurServeur(locale){
  return appeler('/api/v1/local/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cells:locale,flux:[],gains:[],appareil:appareil(),sauvegardeSeule:true})}).then(function(r){
    return Boolean(r.d&&r.d.ok&&r.d.sauvegardeSeule);
  }).catch(function(){return false;});
}
function adopterServeur(exp,serveur,locale){
  if(!Array.isArray(serveur)||serveur.length!==38)return Promise.resolve('serveur-invalide');
  etat.adoption=true;
  var pl=progression(locale);
  var avoirUneCopie=pl[0]>0||pl[1]>0;
  /* Toujours gardée de côté sur le téléphone ; envoyée aussi au serveur (secours de 30 jours) quand c'est possible, AVANT d'être remplacée. */
  if(avoirUneCopie)ecrire(CLE_SAUVEGARDE,JSON.stringify({cells:locale,le:new Date().toISOString()}));
  return (avoirUneCopie?sauvegarderLocaleSurServeur(locale):Promise.resolve(true)).then(function(){return charger(exp,serveur,'serveur');});
}

function charger(exp,serveur,qui){
  return etat.moteur.chargerFichier({format:'soreal-idle-partie-v1',version:1,exporteLe:new Date().toISOString(),serveurAt:Number(exp.serveurAt)||Date.now(),nom:String(serveur[1]||''),cells:serveur}).then(function(r){
    if(!r||!r.ok)return 'chargement-refuse';
    return etat.moteur.exporterLigne().then(function(apres){
      ecrire(CLE_BASE,JSON.stringify({srv:String(serveur[COL_SYNCHRO]),loc:String(apres&&apres[COL_SYNCHRO])}));
      ecrire(CLE_ADOPTE,signatureServeur(exp,serveur));
      /* Le téléphone a maintenant la partie du serveur : sa dernière activité est celle du serveur (sinon l'heure du chargement passerait pour une progression). */
      ecrireActivite(Number(exp.progressionAt)>0?Number(exp.progressionAt):Date.now());
      if(qui)ecrire(CLE_MESSAGE,qui);
      setTimeout(function(){window.location.reload();},500);
      return 'serveur-charge';
    });
  }).catch(function(){return 'chargement-refuse';});
}

/* Export du vrai serveur (revendication) puis lecture des deux lignes : { exp, serveur, locale } ou un mot d'erreur. */
function lireLesDeux(){
  return appeler('/api/v1/local/export?appareil='+encodeURIComponent(appareil())).then(function(r){
    var exp=r.d;
    if(!exp||!exp.ok){etat.arrete=true;return 'refuse';}   /* session refusée, interrupteur général coupé : rien n'est envoyé */
    var serveur=null;
    try{serveur=JSON.parse(String(exp.joueurs&&exp.joueurs.ligne||'null'));}catch(_e){serveur=null;}
    if(!Array.isArray(serveur)||serveur.length!==38)return 'serveur-invalide';
    etat.depuis=Number(exp.serveurAt)||Date.now();
    return etat.moteur.exporterLigne().then(function(locale){
      if(!Array.isArray(locale)||locale.length!==38)return 'moteur';
      return {exp:exp,serveur:serveur,locale:locale};
    });
  },function(){return 'hors-ligne';});
}
/* La partie du téléphone devient celle du serveur (elle part, et REMPLACE celle du serveur si forcer). */
function garderLocale(locale,forcer){
  return pousser(locale,forcer).then(function(ok){
    if(ok){etat.pret=true;etat.horsLigne=false;noterActivite();}
    return ok;
  });
}

/* Revendication + décision AUTOMATIQUE. Résout par un mot : 'hors-ligne', 'refuse', 'local', 'local-refuse', 'serveur-charge', ... */
function synchroniser(){
  if(!etat.moteur)return Promise.resolve('moteur');
  if(!jetonValide())return Promise.resolve('sans-jeton');
  var locAt=activiteLocale();   /* lue AVANT tout : noterActivite n'écrit pas tant que cette lecture n'a pas eu lieu */
  etat.activiteLue=true;
  return lireLesDeux().then(function(r){
    if(typeof r==='string'){if(r==='hors-ligne')etat.horsLigne=true;return r;}
    etat.horsLigne=false;
    var t=trancher(r.locale,r.serveur,{locAt:locAt,srvAt:Number(r.exp.progressionAt)||0},json(CLE_BASE));
    /* Norman (2026-11-04) : « le jeu se recharge en boucle au démarrage en disant qu'il a chargé la partie du serveur ». Une partie du serveur déjà chargée (même signature) n'est JAMAIS rechargée : le téléphone a déjà cette partie (et peut-être plus), la décision par la progression pouvait sinon donner « serveur » à chaque lancement. */
    if(t.qui==='serveur'&&lire(CLE_ADOPTE)===signatureServeur(r.exp,r.serveur))t={qui:'local',raison:'deja-adoptee',different:false,forcer:false};
    if(t.qui==='serveur')return adopterServeur(r.exp,r.serveur,r.locale).then(function(res){if(res!=='serveur-charge')etat.adoption=false;return res;});
    return garderLocale(r.locale,t.forcer).then(function(ok){
      etat.pret=true;   /* même refusée, l'envoi est retenté par tick */
      if(ok&&t.different)message(texteRetenue('local'));
      return ok?'local':'local-refuse';
    });
  });
}

/* Secours (Réglages > Ma partie) : forcer l'AUTRE sauvegarde en cas d'erreur de la décision automatique. qui = 'serveur' | 'local'. */
function forcer(qui){
  if(!etat.moteur)return Promise.resolve('moteur');
  if(!jetonValide())return Promise.resolve('sans-jeton');
  if(etat.adoption||etat.enVol)return Promise.resolve('occupe');
  etat.activiteLue=true;
  return lireLesDeux().then(function(r){
    if(typeof r==='string')return r;
    if(qui==='serveur')return adopterServeur(r.exp,r.serveur,r.locale).then(function(res){if(res!=='serveur-charge')etat.adoption=false;return res;});
    return garderLocale(r.locale,true).then(function(ok){return ok?'local':'local-echec';});
  });
}

/* Écrit l'instant de la dernière activité du moteur (lu au prochain lancement). Seulement après la lecture de la valeur précédente, une fois la décision prise ou en jeu hors ligne ; jamais pendant le chargement d'une partie du serveur. */
function noterActivite(){
  if(!etat.moteur||!etat.activiteLue||etat.adoption||etat.conflit||etat.arrete||!(etat.pret||etat.horsLigne))return Promise.resolve(false);
  return etat.moteur.exporterLigne().then(function(cells){
    if(!Array.isArray(cells)||cells.length!==38)return false;
    var t=enMs(cells[COL_SYNCHRO]);
    if(!(t>0))return false;
    t=Math.min(t,Date.now()+900000);   /* une horloge détraquée ne peut pas se faire passer pour l'avenir */
    if(t<=activiteLocale())return false;
    ecrireActivite(t);
    return true;
  }).catch(function(){return false;});
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
var prochainEssai=0;   /* sans réseau, un essai toutes les 4 s réveillait le moteur et ouvrait une connexion pour rien : 30 s entre deux essais (le retour d'internet et le retour au premier plan réessaient tout de suite) */
function lancer(urgent){
  if(enCours||etat.pret||etat.arrete||etat.adoption)return;
  if(urgent===true)prochainEssai=0;
  if(Date.now()<prochainEssai)return;
  if(!estApk()||!lire(CLE_COMPTE)||json(CLE_ATTENTE))return;   /* compte pas encore relié, ou restauration en attente (elle recharge la page) */
  enCours=true;
  attendreMoteur(170,function(ML){
    if(!ML){enCours=false;return;}
    etat.moteur=ML;
    synchroniser().then(function(res){
      enCours=false;
      if(res==='local'||res==='local-refuse')etat.pret=true;
      if(res==='hors-ligne')prochainEssai=Date.now()+30000;
    },function(){enCours=false;});
  });
}

window.__SOREAL_IDLE_APK_SYNCHRO_V1__={decider:decider,trancher:trancher,comparer:comparer,progression:progression,synchroniser:synchroniser,forcer:forcer,noterActivite:noterActivite,tick:tick,lancer:lancer,etat:function(){return etat;}};

if(estApk()){
  /* Essais réguliers : compte relié après le chargement de la page, réseau absent au démarrage, restauration terminée. */
  setInterval(function(){lancer();},4000);
  setInterval(function(){tick(false);noterActivite();},INTERVALLE_MS);
  window.addEventListener('online',function(){lancer(true);tick(false);});
  document.addEventListener('visibilitychange',function(){if(document.hidden){noterActivite();tick(true);}else lancer(true);});
  window.addEventListener('pagehide',function(){noterActivite();tick(true);});
  /* La partie du serveur vient d'être prise (la page s'est rechargée) : message discret, une seule fois. */
  var retenue=lire(CLE_MESSAGE);
  if(retenue){try{window.localStorage.removeItem(CLE_MESSAGE);}catch(_e){}setTimeout(function(){message(texteRetenue(retenue==='serveur'?'serveur':'local'));},1500);}
  lancer();
}
})();
