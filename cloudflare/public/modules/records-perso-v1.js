/*
 * SOREAL IDLE — records personnels et montées au classement (Norman, 2026-10-17 : « quand on bat un record personnel, par exemple le plus long combat, ou qu'on monte de place au classement pour certains trucs, un popup
 * qui nous l'indique avec un petit son, comme pour les trophées, mais différent »).
 *
 * Même annonce en fondu que les trophées (fade-notice-v1.js), avec un son à part (audio « recordPerso ») et une couleur à part. Toutes les ~2 min (page visible), et au premier rendu, on demande au serveur « mes rangs »
 * (obtenirMesRangsSorealIdle : calcul du classement SANS écriture) : mon rang global, mon rang par statistique, mes valeurs.
 *   - RECORD PERSONNEL : le combat de boss le plus long, le meilleur Nombre ; annoncé quand la valeur dépasse la meilleure déjà annoncée ;
 *   - MONTÉE AU CLASSEMENT : seulement pour un joueur dont le classement est débloqué ; annoncée quand le rang est STRICTEMENT meilleur que le meilleur rang déjà annoncé (jamais deux fois la même place, même si on
 *     la perd puis la retrouve).
 * La meilleure valeur et le meilleur rang connus sont gardés dans le stockage (clé « soreal_idle_… » : liée au compte, voir prefs-compte-v1.js) ; le tout premier passage ne fait que les noter (aucune rafale), ensuite
 * ce qui a été battu pendant une absence est annoncé à la reconnexion. Rien n'est annoncé qui ne soit déjà à toi (anti-spoil : seulement tes propres chiffres et ta place).
 *
 *   window.__SOREAL_IDLE_RECORDS_PERSO_V1__ = { verifier(joueur, cle), comparer(ancien, serveur, classementDebloque) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_RECORDS_PERSO_V1__)return;

var PERIODE_MS=120000;
var MAX_ANNONCES=3;
var enCours=false,dernier=0;

var ONGLETS={global:'général',boss:'Boss',rebirths:'Rebirths',number:'Nombre',exp:'EXP',playSeconds:'Temps de jeu actif',achievements:'Succès',clics:'Clics/Tap'};

function lire(cle){try{var b=localStorage.getItem(cle);return b?JSON.parse(b):null;}catch(_e){return null;}}
function ecrire(cle,o){try{localStorage.setItem(cle,JSON.stringify(o));}catch(_e){}}

function nombre(v){var n=Number(v);return Number.isFinite(n)?n:0;}
function rangTexte(n){return n===1?'1ʳᵉ':n+'ᵉ';}
function duree(sec){
  var s=Math.max(0,nombre(sec));
  if(s<60)return String(Math.round(s*10)/10).replace('.',',')+' s';
  var m=Math.floor(s/60),r=Math.round(s-m*60);
  return m+' min '+(r<10?'0':'')+r+' s';
}
function grand(v){
  try{var H=window.__SOREAL_IDLE_META_HOST_V130__;if(H&&typeof H.formatGrandNombreIdleV70_==='function')return H.formatGrandNombreIdleV70_(v);}catch(_e){}
  return String(v);
}

/*
 * Compare l'état mémorisé au dernier relevé du serveur. Renvoie { memoire, annonces } : memoire = nouvelle mémoire à ranger, annonces = lignes à montrer (record ou montée). ancien = null : premier passage.
 */
function comparer(ancien,serveur,classementDebloque){
  var moi=serveur&&serveur.moi;
  if(!moi)return {memoire:ancien,annonces:[]};
  var valeurs=moi.valeurs||{},rangs=moi.rangs||{};
  var rangsActuels={global:nombre(moi.rang)};
  Object.keys(ONGLETS).forEach(function(k){if(k!=='global')rangsActuels[k]=nombre(rangs[k]);});
  var memoire={v:{combatLong:nombre(valeurs.combatLong),number:nombre(valeurs.number)},r:{}};
  var annonces=[];
  var av=(ancien&&ancien.v)||null,ar=(ancien&&ancien.r)||null;
  /* records : toujours gardés au plus haut */
  if(av){
    memoire.v.combatLong=Math.max(av.combatLong||0,memoire.v.combatLong);
    memoire.v.number=Math.max(av.number||0,memoire.v.number);
    if(nombre(valeurs.combatLong)>(av.combatLong||0)+0.05)annonces.push({type:'record',icone:'⚔️',titre:'Record personnel !',ligne:'Combat de boss le plus long : '+duree(valeurs.combatLong)});
    if(nombre(valeurs.number)>(av.number||0)*1.0000001&&nombre(valeurs.number)>0)annonces.push({type:'record',icone:'🔢',titre:'Record personnel !',ligne:'Meilleur Nombre : '+grand(valeurs.number)});
  }
  /* classement : meilleur rang jamais annoncé (0 = inconnu) */
  Object.keys(rangsActuels).forEach(function(k){
    var actuel=rangsActuels[k];
    if(!(actuel>=1)){memoire.r[k]=(ar&&ar[k])||0;return;}
    var meilleur=ar&&ar[k]>=1?ar[k]:0;
    if(meilleur&&actuel<meilleur){
      if(classementDebloque)annonces.push({type:'rang',icone:'📈',titre:'Tu montes au classement !',ligne:(k==='global'?'Classement général : ':'Classement '+ONGLETS[k]+' : ')+rangTexte(actuel)+' place (avant : '+rangTexte(meilleur)+')'});
      memoire.r[k]=actuel;
    }else memoire.r[k]=meilleur||actuel;
  });
  return {memoire:memoire,annonces:annonces};
}

function annoncer(annonces){
  if(!annonces.length)return;
  var audio=window.__SOREAL_IDLE_AUDIO_V199__;
  try{if(audio&&typeof audio.play==='function')audio.play('recordPerso');}catch(_e){}
  var notice=window.__sorealFadeNoticeV1__;
  if(typeof notice!=='function')return;
  annonces.slice(0,MAX_ANNONCES).forEach(function(a){
    notice(a.icone+' '+a.titre,[a.ligne],{dureeMs:3800,accent:a.type==='record'?'#7dd3fc':'#c4b5fd'});
  });
  if(annonces.length>MAX_ANNONCES)notice('✨ Et '+(annonces.length-MAX_ANNONCES)+' autre'+(annonces.length-MAX_ANNONCES>1?'s':'')+' !',['Records et places gagnées.'],{dureeMs:3200,accent:'#c4b5fd'});
}

function verifier(j,cle){
  if(enCours||!j||!cle)return;
  if(document.hidden)return;
  var maintenant=Date.now();
  if(maintenant-dernier<PERIODE_MS)return;
  var session=window.SOREAL_SESSION||(typeof SOREAL_SESSION!=='undefined'?SOREAL_SESSION:'');
  if(!session||!window.google||!window.google.script||!window.google.script.run)return;
  dernier=maintenant;
  enCours=true;
  var debloque=Boolean(j.classement&&j.classement.debloque);
  try{
    window.google.script.run
      .withSuccessHandler(function(res){
        enCours=false;
        if(!res||!res.ok||!res.moi)return;
        var ancien=lire(cle);
        var r=comparer(ancien,res,debloque);
        ecrire(cle,r.memoire);
        annoncer(r.annonces);
      })
      .withFailureHandler(function(){enCours=false;})
      .obtenirMesRangsSorealIdle(session);
  }catch(_e){enCours=false;}
}

window.__SOREAL_IDLE_RECORDS_PERSO_V1__={verifier:verifier,comparer:comparer};
})();
