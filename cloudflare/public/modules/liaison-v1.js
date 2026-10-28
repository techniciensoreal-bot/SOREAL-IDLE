/*
 * SOREAL IDLE — « Relier mon compte Google » (Norman, 2026-10-28), application Windows seulement (le pont window.sorealDesktop, desktop/preload.js, n'existe pas dans un navigateur : la section n'apparaît alors pas).
 * Réglages > Ma partie. Le joueur clique ; son navigateur s'ouvre pour la connexion Google ; l'application compare la partie de cet ordinateur et celle du serveur, garde la plus avancée (l'autre est mise de côté dans un fichier, jamais détruite), puis le jeu
 * redémarre relié au compte : la partie part au serveur toute seule, comme dans la version web. Voir desktop/src/liaison.mjs.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_LIAISON_V1__)return;

function pont(){var d=window.sorealDesktop;return d&&typeof d.liaisonDemarrer==='function'&&typeof d.liaisonEtat==='function'&&typeof d.liaisonSur==='function'?d:null;}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

var etat={charge:false,enCharge:false,info:null,occupe:false,message:'',erreur:false};

var ERREURS={
  DEJA_EN_COURS:'Une liaison est déjà en cours.',
  DEVELOPPEMENT:'Disponible seulement dans l’application installée.',
  CHIFFREMENT_INDISPONIBLE:'Windows ne permet pas de ranger la connexion de façon sécurisée sur cet ordinateur : la liaison est impossible.',
  PARTIE_LOCALE_ABSENTE:'Aucune partie n’a été trouvée sur cet ordinateur : joue un instant, puis réessaie.',
  LIAISON_DELAI:'La connexion n’a pas été terminée à temps. Réessaie quand tu veux.',
  SERVEUR_INDISPONIBLE:'Le serveur ne répond pas : vérifie ta connexion internet et réessaie. Rien n’a été modifié.',
  SESSION_REFUSEE:'La connexion a été refusée : réessaie.',
  ACCES_REFUSE:'Ce compte n’a pas accès au jeu pour le moment.',
  EXPORT_REFUSE:'Le serveur n’a pas donné ta partie : réessaie dans un moment. Rien n’a été modifié.',
  ENVOI_REFUSE:'Le serveur a refusé d’enregistrer ta partie : rien n’a été remplacé, réessaie plus tard.'
};
var ETAPES={navigateur:'Termine la connexion dans ton navigateur…',verification:'Vérification du compte…',comparaison:'Comparaison de ta partie et de celle du serveur…',envoi:'Envoi de ta partie au serveur…'};

function message(texte,erreur){
  etat.message=texte||'';etat.erreur=Boolean(erreur);
  var el=document.getElementById('sorealIdleLiaisonEtatV1');
  if(el){el.textContent=etat.message;el.style.color=etat.erreur?'#ff9d9d':'#86efac';}
}
function charger(){
  var d=pont();
  if(!d||etat.enCharge)return;
  etat.enCharge=true;
  Promise.resolve(d.liaisonEtat()).then(function(r){etat.info=r||null;}).catch(function(){etat.info=null;}).then(function(){
    etat.enCharge=false;etat.charge=true;
    var s=document.getElementById('sorealIdleLiaisonV1');
    if(s)s.outerHTML=sectionHtml();
  });
}

function sectionHtml(){
  if(!pont())return '';
  if(!etat.charge&&!etat.enCharge)setTimeout(charger,0);
  var i=etat.info||{},lie=Boolean(i.lie),expiree=Boolean(i.expiree);
  var intro=lie&&!expiree
    ?'Ta partie est reliée au compte <b>'+esc(i.email||'')+'</b> : elle part au serveur toute seule dès qu’internet est là, comme dans la version web. Sans internet, tu continues à jouer.'
    :(expiree?'La connexion de ton compte a expiré : relie-le de nouveau pour que ta partie reparte au serveur. Tu peux continuer à jouer en attendant.'
      :'Ta partie est sur cet ordinateur. Pour l’envoyer au serveur et la retrouver sur tous tes appareils, relie-la à ton compte Google : la connexion se fait dans ton navigateur. Si ce compte a déjà une partie sur le serveur, la plus avancée des deux est gardée ; l’autre est mise de côté dans un fichier, jamais détruite.');
  var bouton=lie&&!expiree?'':'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__relierCompteIdleV1__(this)"'+(etat.occupe?' disabled':'')+'>'+(expiree?'🔗 Relier de nouveau mon compte':'🔗 Relier mon compte Google')+'</button>';
  return '<div class="soreal-idle-section-v8" id="sorealIdleLiaisonV1">'+
    '<div class="soreal-idle-window-title-v31">☁️ Compte</div>'+
    '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">'+intro+'</div>'+bouton+
    '<div id="sorealIdleLiaisonEtatV1" style="font-size:14px;color:'+(etat.erreur?'#ff9d9d':'#86efac')+';margin-top:8px">'+esc(etat.message)+'</div>'+
  '</div>';
}

function relier(bouton){
  var d=pont();
  if(!d||etat.occupe)return;
  etat.occupe=true;if(bouton)bouton.disabled=true;
  message('Ton navigateur va s’ouvrir…',false);
  Promise.resolve(d.liaisonDemarrer()).then(function(r){
    if(r&&r.ok){
      message(r.decision==='locale'?'Compte relié : ta partie de cet ordinateur était la plus avancée, elle est maintenant sur le serveur. Le jeu redémarre…':'Compte relié : la partie du serveur était la plus avancée, tu la retrouves. La partie de cet ordinateur est mise de côté dans un fichier. Le jeu redémarre…',false);
    }else message(ERREURS[r&&r.code]||'La liaison a échoué : réessaie.',true);
  }).catch(function(){message('La liaison a échoué : réessaie.',true);}).then(function(){
    etat.occupe=false;if(bouton)bouton.disabled=false;
  });
}

var D=pont();
if(D)D.liaisonSur(function(e){
  if(!e)return;
  if(e.type==='progression'&&e.progression&&ETAPES[e.progression.etape])message(ETAPES[e.progression.etape],false);
  if(e.type==='expiree'){etat.info=Object.assign({},etat.info||{},{expiree:true});var s=document.getElementById('sorealIdleLiaisonV1');if(s)s.outerHTML=sectionHtml();}
});

window.__relierCompteIdleV1__=relier;
window.__SOREAL_IDLE_LIAISON_V1__={sectionHtml:sectionHtml};
})();
