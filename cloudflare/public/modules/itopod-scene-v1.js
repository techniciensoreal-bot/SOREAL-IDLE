/*
 * SOREAL IDLE — arène de l'ITOPOD (Norman, 2026-09-26 puis 2026-10-04) : la page copie la disposition du mode Aventure (sans inventaire) : l'image de l'ennemi, son nom en dessous, puis le choix des étages
 * (construit par pageItopodIdleV1_, meta-progression-v130.js). Les ennemis portent les prénoms et les avatars de l'équipe (ouvriers, responsables, anciens), lus par le serveur sur SOREAL TV
 * (src/idle-itopod-roster-v1.js : la liste grandit toute seule avec l'équipe ; Norman et Sébastien y sont toujours).
 *
 * Décor : R2 « idle/itopod/ », un fichier par étage de 1 à 10 : l'étage N de la tour affiche le décor ((N − 1) mod 10) + 1, donc le même décor à chaque fois pour un même étage, en boucle tous les 10 étages.
 * Style : feuille soreal-idle-jeu.css (classes itp-*).
 *
 * La scène est purement visuelle : le combat de la tour est calculé par le serveur (par lots, hors ligne compris). L'ennemi affiché est choisi de façon déterministe d'après le nombre total
 * d'ennemis vaincus, donc stable d'un rendu à l'autre.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ITOPOD_SCENE_V1__)return;

var CLASSE='soreal-idle-itopod-scene-v1';
var roster=null;      /* {workers:[{nom,avatar}], etages:{1..10:cle}} */
var chargement=false;
var dernierEssai=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function urlImage(cle){return '/api/idle/media/shared?key='+encodeURIComponent(cle);}

/* Décor de l'étage : de 1 à 10, en boucle (étage 0 ou 1 → 1, étage 10 → 10, étage 11 → 1…). */
function numeroDecor(etage){
  var e=Math.max(0,Math.floor(Number(etage)||0));
  return e<=0?1:((e-1)%10)+1;
}
function decorPour(etage){
  var liste=roster&&roster.etages;
  return liste&&liste[numeroDecor(etage)]?liste[numeroDecor(etage)]:'';
}

/* Ennemi n° kills (Norman, 2026-11-01 : « on affronte chacun des personnages à la suite, du premier au dernier, et ça recommence au premier ») : défilement séquentiel dans l'ordre de la liste du roster (déjà triée par le serveur), en boucle : roster[kills mod n].
   Stable d'un rendu et d'un appareil à l'autre ; l'étage n'intervient plus (le paramètre est gardé pour les appelants). */
function indexEnnemi(n,kills,etage){
  if(n<=1)return 0;
  return Math.max(0,Math.floor(Number(kills)||0))%n;
}

/*
 * Avatars transparents, coupés à la ceinture (Norman, 2026-10-04) : pas de cadre, grands, collés au bas de l'image (le bord bas cache la coupe) et animés d'un léger mouvement de respiration depuis le bas, de sorte que la coupe ne se voit jamais.
 * Les avatars du Level 1 sont des boules flottantes : ni collés au bas, ni agrandis, ils flottent dans l'air.
 */
function estFlottant(cle){return String(cle||'').split('/').indexOf('level-1')!==-1;}

/* Combat de l'écran : l'ennemi encaisse les coups un par un (le nombre de coups vient du serveur : towerHitsV1, la formule de la progression) ; purement visuel, le serveur calcule les kills. */
var combat={auto:true,debut:0,fin:0,optimal:0,hits:1,intervalle:1,respawn:4,actif:false,killsServeur:-1,decalage:0,coups:0,mort:false,prochain:0,
  pvMax:0,pv:0,degats:0,ennemiCoup:0,regenPv:0,ppBase:0,ppMult:1,ppProg:0,tEnnemi:0,dernierPas:0,nom:'',etageCourant:0};

/*
 * Barre de vie du joueur et journal de combat (Norman, 2026-11-21 : « dans l'ITOPOD le joueur a une barre de vie et il y a un journal de combat », photo du vrai jeu). Purement visuels, comme le combat de l'écran : le serveur calcule les kills.
 * Valeurs lues dans le jeu (NGU Idle build 1260) : le premier coup de l'ennemi tombe 1,8 s après son apparition (1,5 x Attack Rate de 1,2 s), puis un coup toutes les 1,2 s (EnemyAI::Update) ; le coup retire la valeur envoyée par le serveur (ennemiCoup,
 * aléa remplacé par 1) ; les PV se régénèrent de regenPv par seconde (AdventureController::manageFight). Si les PV tombent à 0, le joueur « meurt » : combat arrêté, nouvelle apparition après le délai (AdventureController::playerDeath).
 * Journal : les phrases viennent du jeu (PlayerController::damageText, modules/itopod-journal-v1.js), « You have defeated X! » (AdventureController::enemyDeath) et « You gained N progress to your next Perk Point! » puis « You gained N Perk Point(s)! »
 * (ItopodPerkController::addProgress). Le jeu n'écrit RIEN quand l'ennemi frappe le joueur. Aucune phrase n'est inventée ; elles restent en anglais comme dans le jeu. Les dégâts affichés varient de 0,8 à 1,2 fois le coup moyen (PlayerController::idleAttack).
 */
var journal=[];
var JOURNAL_MAX=40;
var PREMIER_COUP_ENNEMI_S=1.8,CADENCE_ENNEMI_S=1.2,SEUIL_PP=1e6;
function fmtNombre(v){
  var R=window.__SOREAL_IDLE_REG__;
  if(R&&typeof R.formatGrandNombreIdleV70_==='function'){try{return String(R.formatGrandNombreIdleV70_(v));}catch(_e){}}
  return Number(v).toLocaleString('en-US');
}
/* Nom de la 3e ressource du joueur (Resource3::res3Name : nom choisi ou tiré au hasard ; « Butts » tant qu'il n'a jamais été donné, valeur de départ du jeu) : le même que le reste de l'interface (systemes.r3Nom). */
function nomR3(){
  try{
    var H=window.__SOREAL_IDLE_META_HOST_V130__,j=H&&H.getIdleEtat&&H.getIdleEtat();
    var n=j&&j.systemes&&typeof j.systemes.r3Nom==='string'?j.systemes.r3Nom:'';
    if(n)return n;
  }catch(_e){}
  return 'Butts';
}
function pctPv(){return combat.pvMax>0?Math.max(0,Math.min(100,combat.pv*100/combat.pvMax)):0;}
function texteVie(){return fmtNombre(Math.max(0,Math.floor(combat.pv)))+' HP';}   /* comme le jeu : les PV actuels seulement */
function ligneJournalHtml(l){return '<div class="itp-j-ligne'+(l.v?' itp-j-vert':'')+'">'+esc(l.t)+'</div>';}
function ecrireJournal(el,texte,vert){
  journal.push({t:texte,v:Boolean(vert)});
  if(journal.length>JOURNAL_MAX)journal.splice(0,journal.length-JOURNAL_MAX);
  var boite=el&&el.querySelector('.itp-journal');
  if(!boite)return;
  boite.insertAdjacentHTML('beforeend',ligneJournalHtml(journal[journal.length-1]));
  while(boite.children.length>JOURNAL_MAX)boite.removeChild(boite.firstChild);
  boite.scrollTop=boite.scrollHeight;
}
function majBarreJoueur(el){
  var rempli=el&&el.querySelector('.itp-vie-joueur .itp-vie-rempli'),texte=el&&el.querySelector('.itp-vie-joueur .itp-vie-texte');
  if(!rempli)return;
  var l=pctPv().toFixed(1)+'%';
  if(rempli.__itpLargeur!==l){rempli.__itpLargeur=l;rempli.style.width=l;}
  var t=texteVie();
  if(texte&&texte.__itpTexte!==t){texte.__itpTexte=t;texte.textContent=t;}
}
/* Régénération et coups de l'ennemi depuis le dernier pas ; renvoie true si le joueur est mort. */
function avancerVieJoueur(maintenant){
  if(!(combat.pvMax>0))return false;
  var dt=combat.dernierPas?Math.min(1,Math.max(0,(maintenant-combat.dernierPas)/1000)):0;
  combat.dernierPas=maintenant;
  combat.pv=Math.min(combat.pvMax,combat.pv+combat.regenPv*dt);
  if(combat.tEnnemi&&!combat.mort){
    var garde=0;
    while(combat.tEnnemi&&maintenant>=combat.tEnnemi&&garde++<20){
      combat.pv-=combat.ennemiCoup;
      combat.tEnnemi+=CADENCE_ENNEMI_S*1000;
      if(combat.pv<=0){combat.pv=0;return true;}
    }
  }
  return false;
}

/*
 * Visage de l'ennemi (Norman, 2026-10-31) : un personnage généré par modules/itopod-badavatars-v1.js. Un ennemi qui porte un NOM d'équipe a un visage FIXE (graine = son nom : même nom, même visage, sur tous les appareils) ;
 * sans nom (repli « Pissed Off Dude ») la graine vient du nombre d'ennemis vaincus et de l'étage (un visage neuf à chaque ennemi). Les prénoms et leur origine ne changent pas.
 * Si les images ne chargent pas, l'ancien avatar (caché par défaut) prend la place : data-itp-repli sur .itp-ennemi (attribut gardé par le morph, règle n°4).
 */
var memoVisages={};
function avatarGenere(ennemi,kills,etage,ancien){
  var B=window.__SOREAL_IDLE_ITOPOD_BADAVATARS_V1__;
  if(!B||!B.tirer||!B.catalogue||!B.catalogue.bodies||!B.catalogue.bodies.Body_Homme.length)return '';
  /* Profil enregistré par le joueur (Réglages > Profil, profil-badavatar-v1.js) : même badavatar désigné, pièces déplacées / redimensionnées / masquées et visage personnalisé éventuel. Sans profil : inchangé. */
  var PB=window.__SOREAL_IDLE_PROFIL_BADAVATAR_V1__;
  var prof=PB&&ennemi&&ennemi.nom?PB.pour(ennemi.nom):null;
  var cle=(ennemi&&ennemi.nom?'n:'+ennemi.nom:'k:'+kills+':'+etage)+(prof?'|'+prof.sig:'');
  var html=memoVisages[cle];
  if(!html){
    var design=prof?prof.design:ennemi&&ennemi.nom?B.tirerPourNom(ennemi.nom):B.tirer('k:'+Math.max(0,kills)+':'+Math.max(0,etage));
    html=B.rendreHtml(design,{photo:prof?prof.photo:null,surErreurCorps:"var e=this.closest('.itp-ennemi');if(e)e.setAttribute('data-itp-repli','1')"});
    if(Object.keys(memoVisages).length>200)memoVisages={};
    memoVisages[cle]=html;
  }
  return '<div class="itp-avatar itp-badav" data-itp-badav="1">'+html+'</div>'+(ancien&&ancien.indexOf('itp-avatar-vide')===-1?ancien.replace('class="itp-avatar','loading="lazy" class="itp-avatar itp-avatar-repli'):'');
}
(window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]).push('data-itp-repli');

function contenu(etage,kills,killsSurEtage){
  /* Combats gagnés sur l'étage : ceux du serveur plus ceux de l'écran depuis la dernière synchro ; à 10 on passe à l'étage suivant. */
  var total=killsSurEtage+combat.decalage;
  /* Étage suivant comme le serveur : à l'étage de fin on repart de l'étage de départ (jamais plus haut que la fin choisie) ; en automatique, jusqu'à l'étage optimal. */
  for(var m=Math.floor(total/10);m>0;m--){
    if(combat.auto)etage=Math.min(combat.optimal,etage+1);
    else etage=etage>=combat.fin?combat.debut:etage+1;
  }
  killsSurEtage=total%10;
  var n=roster&&Array.isArray(roster.workers)?roster.workers.length:0;
  var ennemi=n?roster.workers[indexEnnemi(n,kills,etage)]:null;
  var fond=decorPour(etage);
  var nom=ennemi?ennemi.nom:'Pissed Off Dude';
  combat.nom=nom;combat.etageCourant=etage;
  var classeAvatar='itp-avatar'+(ennemi&&estFlottant(ennemi.avatar)?' itp-flotte':'');
  var ancien=ennemi&&ennemi.avatar
    ?'<img class="'+classeAvatar+'" src="'+esc(urlImage(ennemi.avatar))+'" alt="" onerror="this.hidden=true">'
    :'<div class="itp-avatar itp-avatar-vide">😠</div>';
  var avatar=avatarGenere(ennemi,kills,etage,ancien)||ancien;
  var decor=fond
    ?'<img class="itp-decor" src="'+esc(urlImage(fond))+'" alt="" onerror="this.hidden=true">'
    :'';
  var pips='';
  for(var i=0;i<10;i++)pips+='<i class="itp-pip'+(i<=killsSurEtage?' plein':'')+'"></i>';
  var vie=combat.hits>0?Math.max(0,Math.min(100,100-combat.coups*100/combat.hits)):100;
  return '<div class="itp-banniere"><span class="itp-etage"><small>ÉTAGE</small><b>'+etage+'</b></span><span class="itp-pips" title="Ennemi en cours sur cet étage (10 par étage)">'+pips+'</span></div>'+
    '<div class="itp-cadre"><div class="itp-vitre">'+decor+'<div class="itp-ombre"></div><div class="itp-ennemi'+(combat.mort?' itp-mort':'')+'">'+avatar+'</div><div class="itp-poing" aria-hidden="true"><span>👊</span></div>'+
    '<span class="itp-braise itp-b1"></span><span class="itp-braise itp-b2"></span><span class="itp-braise itp-b3"></span></div></div>'+
    '<div class="itp-vie" title="Points de vie de l’ennemi"><div class="itp-vie-rempli" style="width:'+vie.toFixed(1)+'%"></div></div>'+
    '<div class="itp-nom"><span class="itp-nom-texte">'+esc(nom)+'</span></div>'+
    '<div class="itp-prochain" data-itp-prochain aria-live="off">'+texteProchain()+'</div>'+
    (combat.pvMax>0
      ?'<div class="itp-vie itp-vie-joueur" title="Tes points de vie"><div class="itp-vie-rempli" style="width:'+pctPv().toFixed(1)+'%"></div><span class="itp-vie-texte">'+esc(texteVie())+'</span></div>'+
       '<div class="itp-journal" data-itp-journal role="log" aria-live="off" title="Journal de combat">'+journal.slice(-8).map(ligneJournalHtml).join('')+'</div>'
      :'');
}

/* Compte à rebours du prochain combat (Norman, 2026-10-11) : une fois l'ennemi battu, le suivant arrive après le délai de réapparition de la tour ; pendant le combat on le dit aussi. */
function texteProchain(){
  if(!combat.actif||!(combat.hits>0))return '';
  if(combat.mort){
    var reste=Math.max(0,combat.prochain-Date.now())/1000;
    return '⏳ Prochain combat dans <b>'+reste.toFixed(1).replace('.',',')+' s</b>';
  }
  return '⚔️ Combat en cours';
}
function majProchain(el){
  var p=el&&el.querySelector('.itp-prochain');
  if(!p)return;
  var t=texteProchain();
  if(p.__itpTexte!==t){p.__itpTexte=t;p.innerHTML=t;}
}

function remplir(el){
  var k=Number(el.getAttribute('data-kills'))||0;
  el.innerHTML=contenu(Number(el.getAttribute('data-etage'))||0,k+combat.decalage,Number(el.getAttribute('data-sur'))||0);
  var boite=el.querySelector('.itp-journal');
  if(boite)boite.scrollTop=boite.scrollHeight;
}

/* Un coup de poing sur l'ennemi : secousse, éclair blanc et poing qui s'écrase sur l'image. */
function effetCoup(el){
  var cible=el.querySelector('.itp-vitre');
  var poing=el.querySelector('.itp-poing');
  if(!cible||!poing)return;
  poing.style.left=(35+Math.random()*30)+'%';
  poing.style.top=(35+Math.random()*30)+'%';
  cible.classList.remove('itp-coup');poing.classList.remove('itp-poing-actif');
  void cible.offsetWidth;
  cible.classList.add('itp-coup');poing.classList.add('itp-poing-actif');
}

function pas(){
  if(document.hidden)return;   /* audit 2026-10-13 : pas de travail onglet caché */
  var els=document.querySelectorAll('.'+CLASSE);
  if(els.length)majProchain(els[0]);
  if(!els.length||!combat.actif||!(combat.hits>0))return;
  var el=els[0];
  var maintenant=Date.now();
  var joueurMort=avancerVieJoueur(maintenant);
  majBarreJoueur(el);
  if(joueurMort){
    /* PV à 0 : combat arrêté, l'ennemi est remplacé après le délai de réapparition (les PV remontent pendant ce temps). */
    combat.coups=0;combat.mort=false;combat.tEnnemi=0;
    combat.prochain=maintenant+Math.max(0.34,combat.respawn)*1000;
    remplir(el);
    return;
  }
  if(maintenant<combat.prochain)return;
  if(combat.mort){
    combat.decalage++;combat.coups=0;combat.mort=false;combat.tEnnemi=0;
    combat.prochain=maintenant+combat.intervalle*1000;
    remplir(el);
    return;
  }
  combat.coups++;
  if(combat.coups===1)combat.tEnnemi=maintenant+Math.max(0,PREMIER_COUP_ENNEMI_S-combat.intervalle)*1000;
  effetCoup(el);
  var barre=el.querySelector('.itp-vie:not(.itp-vie-joueur) .itp-vie-rempli');
  var reste=Math.max(0,100-combat.coups*100/combat.hits);
  if(barre)barre.style.width=reste.toFixed(1)+'%';
  var J=window.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__;
  if(J&&combat.degats>0)ecrireJournal(el,J.phrase(combat.degats*(0.8+Math.random()*0.4),combat.nom,nomR3(),fmtNombre),true);
  if(combat.coups>=combat.hits){
    combat.mort=true;combat.tEnnemi=0;
    var ennemi=el.querySelector('.itp-ennemi');
    if(ennemi)ennemi.classList.add('itp-mort');
    combat.prochain=maintenant+Math.max(0.34,combat.respawn)*1000;
    if(combat.pvMax>0){
      ecrireJournal(el,'You have defeated '+combat.nom+'!',false);
      var gain=Math.max(0,(combat.ppBase+combat.etageCourant)*combat.ppMult);
      ecrireJournal(el,'You gained '+fmtNombre(gain)+' progress to your next Perk Point!',false);
      combat.ppProg+=gain;
      if(combat.ppProg>=SEUIL_PP){
        var n=Math.floor(combat.ppProg/SEUIL_PP);
        combat.ppProg=combat.ppProg%SEUIL_PP;
        ecrireJournal(el,n===1?'You gained 1 Perk Point!':'You gained '+fmtNombre(n)+' Perk Points!',false);
      }
    }
  }else{
    combat.prochain=maintenant+Math.max(0.2,combat.intervalle)*1000;
  }
}
if(typeof setInterval==='function'&&typeof document!=='undefined')setInterval(pas,150);

/* La liste des profils de badavatar arrive après le premier rendu : les arènes affichées sont redessinées une fois (la clé du mémo contient la signature du profil). */
if(typeof document!=='undefined'&&typeof document.addEventListener==='function')document.addEventListener('soreal-profils-badavatar',function(){Array.prototype.forEach.call(document.querySelectorAll('.'+CLASSE),remplir);});

function charger(){
  if(roster||chargement||Date.now()-dernierEssai<30000)return;
  chargement=true;dernierEssai=Date.now();
  fetch('/api/idle/media/roster',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    chargement=false;
    if(j&&j.ok&&Array.isArray(j.workers)){
      roster=j;
      Array.prototype.forEach.call(document.querySelectorAll('.'+CLASSE),remplir);
    }
  }).catch(function(){chargement=false;});
}

/* HTML de l'arène pour l'état de la tour d (floor, kills, killsOnFloor). */
function html(d){
  charger();
  var etage=Math.max(0,Math.floor(Number(d&&d.floor)||0));
  var kills=Math.max(0,Math.floor(Number(d&&d.kills)||0));
  var sur=Math.max(0,Math.min(9,Math.floor(Number(d&&d.killsOnFloor!=null?d.killsOnFloor:kills%10)||0)));
  combat.hits=Math.max(0,Math.floor(Number(d&&d.hitsParKill)||0));
  combat.intervalle=Number(d&&d.intervalS)>0?Number(d.intervalS):1;
  combat.respawn=Number(d&&d.respawnS)>0?Number(d.respawnS):4;
  combat.actif=Boolean(d&&d.actif);
  combat.auto=!d||d.startFloor==null||d.endFloor==null;
  combat.debut=Math.max(0,Math.floor(Number(d&&d.startFloor)||0));
  combat.fin=Math.max(combat.debut,Math.floor(Number(d&&d.endFloor)||0));
  combat.optimal=Math.max(0,Math.floor(Number(d&&d.optimalFloor)||0));
  if(combat.killsServeur!==kills){combat.killsServeur=kills;combat.decalage=0;combat.coups=0;combat.mort=false;combat.prochain=0;combat.tEnnemi=0;}
  /* Barre de vie du joueur et journal : valeurs du serveur à chaque rendu de la page (pv absent = pas de barre). */
  var nb=function(v){var x=Number(v);return Number.isFinite(x)&&x>0?x:0;};
  combat.pvMax=nb(d&&d.pvMax);
  combat.pv=combat.pvMax>0?Math.min(combat.pvMax,Math.max(0,Number(d&&d.pv)||0)):0;
  combat.degats=nb(d&&d.degatsCoup);
  combat.ennemiCoup=nb(d&&d.ennemiCoup);
  combat.regenPv=nb(d&&d.regenPv);
  combat.ppBase=nb(d&&d.ppBase);
  combat.ppMult=nb(d&&d.ppMult)||1;
  combat.ppProg=Math.max(0,Number(d&&d.ppProgress)||0);
  combat.dernierPas=0;
  return '<section class="itp-arene '+CLASSE+'" data-etage="'+etage+'" data-kills="'+kills+'" data-sur="'+sur+'">'+contenu(etage,kills+combat.decalage,sur)+'</section>';
}

window.__SOREAL_IDLE_ITOPOD_SCENE_V1__={pas:pas,texteProchain:texteProchain,combat:combat,estFlottant:estFlottant,html:html,numeroDecor:numeroDecor,indexEnnemi:indexEnnemi};
})();
