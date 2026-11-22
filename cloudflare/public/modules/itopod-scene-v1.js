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
  pvMax:0,pv:0,degats:0,ennemiCoup:0,ennemiPoison:0,ennemiPv:0,regenPv:0,ppBase:0,ppMult:1,ppProg:0,tEnnemi:0,dernierPas:0,nom:'',etageCourant:0,surCourant:0,
  ia:null,sansEnnemi:false,reperage:null,finParalysie:0,lectureFigee:false,lectureJusqua:0,
  idle:true,haut:0,hautConnu:false,floorServeur:0,iaNom:'',precFloor:null,precSur:0,shifterOn:false,puissanceJoueur:0,defenseJoueur:0,regenBase:0};

/*
 * Barre de vie du joueur et journal de combat (Norman, 2026-11-21 : « dans l'ITOPOD le joueur a une barre de vie et il y a un journal de combat », photo du vrai jeu). Purement visuels, comme le combat de l'écran : le serveur calcule les kills.
 * Valeurs lues dans le jeu (NGU Idle build 1260) : le premier coup de l'ennemi tombe 1,8 s après son apparition (1,5 x Attack Rate de 1,2 s), puis un coup toutes les 1,2 s (EnemyAI::Update) ; le coup retire la valeur envoyée par le serveur (ennemiCoup,
 * aléa remplacé par 1) ; les PV se régénèrent de regenPv par seconde (AdventureController::manageFight). Si les PV tombent à 0, le joueur « meurt » : combat arrêté, nouvelle apparition après le délai (AdventureController::playerDeath).
 * Journal : les phrases viennent du jeu (PlayerController::damageText, modules/itopod-journal-v1.js), « You have defeated X! » (AdventureController::enemyDeath) et « You gained N progress to your next Perk Point! » puis « You gained N Perk Point(s)! »
 * (ItopodPerkController::addProgress). L'ennemi ÉCRIT chacun de ses coups (« X has attacked for N damage! » et variantes par IA : EnemyAI::regularAttack / poisonAttack / chargeAttack / paralyzeAI / rapidAI / growerAI ; correction du 2026-11-22 : une première version
 * affirmait à tort que le jeu n'écrivait rien). Les phrases viennent de modules/journal-jeu-v1.js (anglais ou français selon la langue du jeu). Les dégâts du joueur varient de 0,8 à 1,2 fois le coup moyen (PlayerController::idleAttack).
 * Mort du joueur (AdventureController::playerDeath, zone ITOPOD) : « X has defeated you! », PV à 0, étage de DÉPART (0 en automatique, comme le serveur), l'ennemi disparaît (« No Enemy », « 0 HP ») jusqu'à la réapparition ; les PV remontent pendant ce temps ; à l'apparition,
 * un joueur resté à 0 PV meurt aussitôt (manageFight). Le compteur de 10 kills n'est pas remis à zéro.
 */
/* IA des 16 « Dude » de la zone ITOPOD (AdventureController::createEnemyTable, zone 1000) : 0 normal, 1 poison, 2 chargeur, 3 paralysie, 5 rapide, 6 grandisseur ; l'un des 16 est tiré à chaque apparition. */
var IA_DUDE=[0,2,1,5,6,3,2,0,0,1,5,6,1,0,2,3];
/* Noms de l'IA affichés sur la ligne « Type: » (AdventureController::displayEnemyStats : AI.ToString() ; ordre de l'énumération AI lu dans EnemyAI::doAction : 0 normal, 1 poison, 2 charger, 3 paralyze, 4 exploder, 5 rapid, 6 grower). */
var IA_NOMS={0:['normal','normal'],1:['poison','poison'],2:['charger','chargeur'],3:['paralyze','paralysie'],4:['exploder','explosion'],5:['rapid','rapide'],6:['grower','croissance']};
function neufIA(){var ai=IA_DUDE[Math.floor(Math.random()*IA_DUDE.length)];combat.iaNom=ai;return {ai:ai,poison:0,charge:0,paralyse:0,rapide:0,rapideMode:false,grow:0};}
/* Un tour de l'ennemi (mêmes cycles que le moteur et que mobs-types-v1.js) : saute = pas de coup ce tour ; mult = multiplicateur du coup ; kind = phrase du coup ; tick = dégâts de poison ; paralyse = le joueur ne frappe plus 2 s. */
function tourIA(ia){
  var r={saute:false,mult:1,kind:'normal',tick:false,prepare:false,paralyse:false,tremble:false,rapideDebut:false};
  switch(ia.ai){
    case 1:
      if(ia.poison<0){}
      else if(ia.poison===0)r.kind='poison';
      else if(ia.poison<=5){r.tick=true;ia.poison+=1;}
      else{r.kind='poisonFin';ia.poison=-3;}
      ia.poison+=1;break;
    case 2:
      ia.charge+=1;
      if(ia.charge<3){}
      else if(ia.charge===3){r.saute=true;r.prepare=true;}
      else if(ia.charge<5)r.saute=true;
      else{r.mult=4;r.kind='massive';ia.charge=0;}
      break;
    case 3:
      if(ia.paralyse<0){}
      else if(ia.paralyse===0)r.saute=true;
      else if(ia.paralyse===1)r.kind='ralentit';
      else if(ia.paralyse===2){r.kind='paralyse';r.paralyse=true;ia.paralyse=-10;}
      ia.paralyse+=1;break;
    case 5:
      ia.rapide+=1;
      if(ia.rapide<5){}
      else if(ia.rapide===5){r.saute=true;r.tremble=true;}
      else if(ia.rapide<8)r.saute=true;
      else if(ia.rapide===8){ia.rapideMode=true;r.rapideDebut=true;r.kind='rapide';}
      else if(ia.rapide<14)r.kind='rapide';
      else{ia.rapideMode=false;ia.rapide=0;r.kind='rapideFin';}
      break;
    case 6:
      ia.grow+=1;r.mult=1+Math.floor(ia.grow/2)*0.2;
      if(ia.grow%2===0)r.kind='croit';
      break;
    default:break;
  }
  return r;
}
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
/* PV de l'ennemi sous sa barre (« 4.424E+035 HP » dans le jeu ; « 0 HP » quand il n'y a plus d'ennemi, AdventureController::playerDeath). */
function texteVieEnnemi(){
  if(combat.sansEnnemi||combat.mort||!(combat.ennemiPv>0))return '0 HP';
  return fmtNombre(Math.max(0,Math.floor(combat.ennemiPv*echelleEtage()*Math.max(0,1-combat.coups/Math.max(1,combat.hits)))))+' HP';
}
/* Échelle des stats de l'ennemi de l'étage affiché (1,05^étage : Power, Toughness, HP Regen ; PV x 600) par rapport à l'étage dont le serveur a envoyé les valeurs. */
function echelleEtage(){
  if(!combat.floorServeur&&!combat.etageCourant)return 1;
  return Math.pow(1.05,combat.etageCourant-combat.floorServeur);
}
/* Format du jeu pour le Regen (AdventureController::displayEnemyStats : ToString("##0.##") si <= 1000, sinon suffixFormat). */
function fmtRegen(v){
  if(v>1000)return fmtNombre(v);
  return String(Math.round(v*100)/100);
}
function ligneStat(libelle,valeur){return '<div><b>'+esc(libelle)+'</b> '+esc(valeur)+'</div>';}
/* Panneau de stats de l'ennemi (AdventureController::displayEnemyStats, IL build 1260) : Power, Toughness, Max HP, HP Regen, Type. Power = attaque 10 x 1,05^étage, Toughness = défense 10 x 1,05^étage, Max HP = PV de l'ennemi (600 x 1,05^étage), HP Regen = 1 x 1,05^étage (valeurs de l'ennemi de la tour). « No Enemy » : le jeu n'écrit rien d'autre. */
function statsEnnemiHtml(){
  if(combat.sansEnnemi||!(combat.ennemiPv>0))return '';
  var JJ=window.__SOREAL_IDLE_JOURNAL_JEU_V1__,l=JJ?JJ.l:function(fr,en){return en;};
  var e=Math.pow(1.05,combat.etageCourant),n=IA_NOMS[combat.iaNom];
  return ligneStat(l('Puissance :','Power:'),fmtNombre(10*e))+ligneStat(l('Robustesse :','Toughness:'),fmtNombre(10*e))+
    ligneStat(l('PV max :','Max HP:'),fmtNombre(combat.ennemiPv*echelleEtage()))+ligneStat(l('Régén. PV :','HP Regen:'),fmtRegen(e))+
    (n?ligneStat(l('Type :','Type:'),l(n[1],n[0])):'');
}
/* Panneau de stats du joueur (AdventureController::updateAdventureStats : Power = totalAdvAttack, Toughness = totalAdvDefense, Max HP = totalAdvHP, HP Regen = totalAdvHPRegen suivi de « /s »). Power et Toughness n'apparaissent que si le serveur les envoie (puissanceJoueur, defenseJoueur). */
function statsJoueurHtml(){
  var JJ=window.__SOREAL_IDLE_JOURNAL_JEU_V1__,l=JJ?JJ.l:function(fr,en){return en;};
  return (combat.puissanceJoueur>0?ligneStat(l('Puissance :','Power:'),fmtNombre(combat.puissanceJoueur)):'')+
    (combat.defenseJoueur>0?ligneStat(l('Robustesse :','Toughness:'),fmtNombre(combat.defenseJoueur)):'')+
    ligneStat(l('PV max :','Max HP:'),fmtNombre(combat.pvMax))+
    ligneStat(l('Régén. PV :','HP Regen:'),fmtNombre(combat.regenBase>0?combat.regenBase:combat.regenPv/(combat.idle?1.2:1))+'/s');
}
function majTexteEnnemi(el){
  var t=el&&el.querySelector('.itp-vie-ennemi-texte');
  if(!t)return;
  var v=texteVieEnnemi();
  if(t.__itpTexte!==v){t.__itpTexte=v;t.textContent=v;}
}
/* Mêmes classes que le journal de l'Aventure (soreal-idle-adventure-log-v1 / -line-v1 + player, enemy, system) : même fond, mêmes couleurs. */
function ligneJournalHtml(l){return '<div class="soreal-idle-adventure-log-line-v1 '+esc(l.k)+'">'+esc(l.t)+'</div>';}
function ecrireJournal(el,texte,type){
  journal.push({t:texte,k:type||'system'});
  if(journal.length>JOURNAL_MAX)journal.splice(0,journal.length-JOURNAL_MAX);
  var boite=el&&el.querySelector('.itp-journal');
  if(!boite)return;
  boite.insertAdjacentHTML('beforeend',ligneJournalHtml(journal[journal.length-1]));
  while(boite.children.length>JOURNAL_MAX)boite.removeChild(boite.firstChild);
  if(!combat.lectureFigee)boite.scrollTop=boite.scrollHeight;
}
/*
 * Défilement du journal COMME CELUI DE L'AVENTURE (Norman, 2026-11-22 : « il doit fonctionner pareil que l'Aventure : pas possible de remonter les lignes avec la souris ou le doigt, des flèches haut et bas ») : le journal reste tout en bas ;
 * molette et doigt ne le font pas défiler (overflow caché) ; deux flèches (modules/journal-fleches-v1.js, posées à côté du journal) remontent ou redescendent ; une lecture remontée revient tout en bas après 15 secondes sans appui.
 */
var LECTURE_RETOUR_MS=15000;
function installerFleches(el){
  var boite=el&&el.querySelector('.itp-journal'),F=window.__SOREAL_IDLE_JOURNAL_FLECHES_V1__;
  if(!boite||!F||boite.__itpFleches)return;
  boite.__itpFleches=true;
  boite.scrollTop=boite.scrollHeight;
  F.installer(boite,function(sens){
    if(sens<0)combat.lectureFigee=true;
    combat.lectureJusqua=Date.now()+LECTURE_RETOUR_MS;
    /* redescendre jusqu'en bas (ou presque) rend le suivi automatique */
    if(sens>0&&boite.scrollHeight-boite.scrollTop-boite.clientHeight<=boite.clientHeight*0.8+4)combat.lectureFigee=false;
  });
}
function retourJournal(el){
  if(!combat.lectureFigee||Date.now()<combat.lectureJusqua)return;
  combat.lectureFigee=false;
  var boite=el&&el.querySelector('.itp-journal');
  if(boite)boite.scrollTop=boite.scrollHeight;
}
function majBarreJoueur(el){
  var rempli=el&&el.querySelector('.itp-vie-joueur .itp-vie-rempli'),texte=el&&el.querySelector('.itp-vie-joueur .itp-vie-texte');
  if(!rempli)return;
  var l=pctPv().toFixed(1)+'%';
  if(rempli.__itpLargeur!==l){rempli.__itpLargeur=l;rempli.style.width=l;}
  var t=texteVie();
  if(texte&&texte.__itpTexte!==t){texte.__itpTexte=t;texte.textContent=t;}
}
/* Régénération et tours de l'ennemi (chacun écrit dans le journal) depuis le dernier pas ; renvoie true si le joueur est mort. */
function avancerVieJoueur(maintenant,el){
  if(!(combat.pvMax>0))return false;
  var dt=combat.dernierPas?Math.min(1,Math.max(0,(maintenant-combat.dernierPas)/1000)):0;
  combat.dernierPas=maintenant;
  /* Régénération x1,2 seulement en auto-attaque (mode Idle) : le serveur envoie regenPv avec ce x1,2 ; mode Idle coupé = régénération de base (regenBase, ou regenPv / 1,2). */
  var regen=combat.idle?combat.regenPv:(combat.regenBase>0?combat.regenBase:combat.regenPv/1.2);
  combat.pv=Math.min(combat.pvMax,combat.pv+regen*dt);
  var JJ=window.__SOREAL_IDLE_JOURNAL_JEU_V1__;
  if(combat.finParalysie&&maintenant>=combat.finParalysie){combat.finParalysie=0;if(JJ)ecrireJournal(el,JJ.titan('liberte')[0],'system');}
  if(combat.tEnnemi&&!combat.mort&&!combat.sansEnnemi){
    if(!combat.ia)combat.ia=neufIA();
    var garde=0;
    while(combat.tEnnemi&&maintenant>=combat.tEnnemi&&garde++<20){
      var t=tourIA(combat.ia);
      combat.tEnnemi+=(combat.ia.rapideMode?0.3:1)*CADENCE_ENNEMI_S*1000;
      if(JJ){
        if(t.prepare)ecrireJournal(el,JJ.titan('chargeDebut',combat.nom)[0],'enemy');
        if(t.tremble)ecrireJournal(el,JJ.titan('tremble',combat.nom)[0],'enemy');
        if(t.rapideDebut)ecrireJournal(el,JJ.titan('rapideDebut',combat.nom)[0],'enemy');
      }
      if(t.saute)continue;
      /* Une seule troncature, après le multiplicateur (EnemyAI::regularAttack : floor(max(...) x aléa x mult)) ; le serveur peut envoyer ennemiCoup non tronqué ou tronqué, les deux marchent. */
      var coup=Math.floor(combat.ennemiCoup*t.mult);
      combat.pv-=coup;
      if(JJ)ecrireJournal(el,JJ.attaque(t.kind,combat.nom,fmtNombre(coup)),'enemy');
      if(t.tick&&combat.ennemiPoison>0){
        combat.pv-=combat.ennemiPoison;
        if(JJ)ecrireJournal(el,JJ.titan('poisonDegats','',{n:fmtNombre(combat.ennemiPoison)})[0],'enemy');
      }
      if(t.paralyse){combat.prochain=Math.max(combat.prochain,maintenant+2000);combat.finParalysie=maintenant+2000;}
      if(combat.pv<=0){combat.pv=0;return true;}
    }
  }
  return false;
}
/* Mort du joueur (AdventureController::playerDeath) : phrase du jeu, PV à 0, étage de départ, plus d'ennemi jusqu'à la réapparition. */
function mortJoueur(el,maintenant){
  var JJ=window.__SOREAL_IDLE_JOURNAL_JEU_V1__;
  if(JJ)ecrireJournal(el,JJ.defaite(combat.nom),'enemy');
  combat.pv=0;combat.coups=0;combat.mort=false;combat.tEnnemi=0;combat.ia=null;combat.finParalysie=0;
  combat.sansEnnemi=true;
  /* playerDeath (zone ITOPOD) : toujours l'étage de DÉPART (plus de mode automatique : départ 0 par défaut) ; sans départ envoyé (ancien serveur) debut vaut 0. */
  combat.reperage={etage:combat.debut,sur:combat.surCourant,dec:combat.decalage};
  /* AdventureController::respawnTime : aucun plancher (seul le multiplicateur de bonus est borné à 0,2) */
  combat.prochain=maintenant+combat.respawn*1000;
  remplir(el);
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

/* Étage après `total` victoires sur l'étage affiché (mêmes règles que la boucle de contenu() et que le moteur) : tous les 10 kills, étage +1 ; à la fin choisie, retour au départ. */
function etageSuivant(etage,total){
  if(total<10)return etage;
  if(combat.auto)return Math.min(combat.optimal,etage+1);
  return etage>=combat.fin?combat.debut:etage+1;
}
function contenu(etage,kills,killsSurEtage){
  /* Combats gagnés sur l'étage : ceux du serveur plus ceux de l'écran depuis la dernière synchro ; à 10 on passe à l'étage suivant. */
  var total=killsSurEtage+combat.decalage;
  /* Après la mort du joueur : retour à l'étage de départ, le compteur de 10 kills continue (playerDeath ne le remet pas à zéro). */
  if(combat.reperage){etage=combat.reperage.etage;total=combat.reperage.sur+(combat.decalage-combat.reperage.dec);}
  /* Étage suivant comme le serveur : à l'étage de fin on repart de l'étage de départ (jamais plus haut que la fin choisie) ; en automatique, jusqu'à l'étage optimal. */
  for(var m=Math.floor(total/10);m>0;m--){
    if(combat.auto)etage=Math.min(combat.optimal,etage+1);
    else etage=etage>=combat.fin?combat.debut:etage+1;
  }
  killsSurEtage=total%10;combat.surCourant=killsSurEtage;
  var n=roster&&Array.isArray(roster.workers)?roster.workers.length:0;
  var ennemi=n?roster.workers[indexEnnemi(n,kills,etage)]:null;
  var fond=decorPour(etage);
  var nom=ennemi?ennemi.nom:'Pissed Off Dude';
  combat.nom=nom;
  var JJn=window.__SOREAL_IDLE_JOURNAL_JEU_V1__;
  if(!combat.sansEnnemi&&!combat.mort&&!combat.ia)combat.ia=neufIA();   /* l'IA est tirée à l'apparition : la ligne « Type: » la montre */
  var nomAffiche=combat.sansEnnemi?(JJn?JJn.l('Aucun ennemi','No Enemy'):'No Enemy'):nom;combat.etageCourant=etage;
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
    '<div class="itp-cadre"><div class="itp-vitre">'+decor+'<div class="itp-ombre"></div><div class="itp-ennemi'+(combat.mort||combat.sansEnnemi?' itp-mort':'')+'">'+avatar+'</div><div class="itp-poing" aria-hidden="true"><span>👊</span></div>'+
    '<span class="itp-braise itp-b1"></span><span class="itp-braise itp-b2"></span><span class="itp-braise itp-b3"></span></div></div>'+
    '<div class="itp-vie itp-vie-ennemi" title="Points de vie de l’ennemi"><div class="itp-vie-rempli" style="width:'+(combat.sansEnnemi?0:vie).toFixed(1)+'%"></div>'+(combat.pvMax>0?'<span class="itp-vie-texte itp-vie-ennemi-texte">'+esc(texteVieEnnemi())+'</span>':'')+'</div>'+
    '<div class="itp-nom"><span class="itp-nom-texte">'+esc(nomAffiche)+'</span></div>'+
    '<div class="itp-stats itp-stats-ennemi">'+statsEnnemiHtml()+'</div>'+
    '<div class="itp-prochain" data-itp-prochain aria-live="off">'+texteProchain()+'</div>'+
    (combat.pvMax>0
      ?'<div class="itp-stats itp-stats-joueur">'+statsJoueurHtml()+'</div>'+'<div class="itp-vie itp-vie-joueur" title="Tes points de vie"><div class="itp-vie-rempli" style="width:'+pctPv().toFixed(1)+'%"></div><span class="itp-vie-texte">'+esc(texteVie())+'</span></div>'+
       '<div class="itp-journal soreal-idle-adventure-log-v1" data-itp-journal role="log" aria-live="off" title="Journal de combat">'+journal.map(ligneJournalHtml).join('')+'</div>'
      :'');
}

/* Compte à rebours du prochain combat (Norman, 2026-10-11) : une fois l'ennemi battu, le suivant arrive après le délai de réapparition de la tour ; pendant le combat on le dit aussi. */
function texteProchain(){
  if(!combat.actif||!(combat.hits>0))return '';
  if(combat.mort||combat.sansEnnemi){
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
  installerFleches(el);
  var boite=el.querySelector('.itp-journal');
  if(boite&&!combat.lectureFigee)boite.scrollTop=boite.scrollHeight;
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
  installerFleches(el);
  retourJournal(el);
  var joueurMort=avancerVieJoueur(maintenant,el);
  majBarreJoueur(el);
  majTexteEnnemi(el);
  if(joueurMort){mortJoueur(el,maintenant);return;}
  if(maintenant<combat.prochain)return;
  if(combat.sansEnnemi){
    /* Réapparition après la mort : un joueur resté à 0 PV meurt aussitôt (manageFight : PV <= 0). */
    combat.sansEnnemi=false;combat.ia=null;
    remplir(el);
    if(combat.pvMax>0&&!(combat.pv>0)){mortJoueur(el,maintenant);return;}
    combat.prochain=maintenant+combat.intervalle*1000;
    return;
  }
  if(combat.mort){
    combat.decalage++;combat.coups=0;combat.mort=false;combat.tEnnemi=0;combat.ia=null;
    combat.prochain=maintenant+combat.intervalle*1000;
    remplir(el);
    return;
  }
  /* Mode Idle coupé (le bouton du jeu) : le joueur ne frappe pas, l'ennemi continue de le frapper (PlayerController::idleAttack n'est appelé que si le mode Idle est actif). */
  if(!combat.idle){combat.prochain=maintenant+Math.max(0.2,combat.intervalle)*1000;if(!combat.tEnnemi)combat.tEnnemi=maintenant+PREMIER_COUP_ENNEMI_S*1000;return;}
  combat.coups++;
  if(combat.coups===1)combat.tEnnemi=maintenant+Math.max(0,PREMIER_COUP_ENNEMI_S-combat.intervalle)*1000;
  effetCoup(el);
  var barre=el.querySelector('.itp-vie:not(.itp-vie-joueur) .itp-vie-rempli');
  var reste=Math.max(0,100-combat.coups*100/combat.hits);
  if(barre)barre.style.width=reste.toFixed(1)+'%';
  majTexteEnnemi(el);
  var J=window.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__,JJ=window.__SOREAL_IDLE_JOURNAL_JEU_V1__;
  if(J&&combat.degats>0)ecrireJournal(el,J.phrase(combat.degats*(0.8+Math.random()*0.4),combat.nom,nomR3(),fmtNombre),'player');
  if(combat.coups>=combat.hits){
    combat.mort=true;combat.tEnnemi=0;combat.ia=null;
    var ennemi=el.querySelector('.itp-ennemi');
    if(ennemi)ennemi.classList.add('itp-mort');
    combat.prochain=maintenant+combat.respawn*1000;   /* aucun plancher : AdventureController::respawnTime */
    var etageApres=etageSuivant(combat.etageCourant,combat.surCourant+1);
    if(combat.pvMax>0){
      ecrireJournal(el,JJ?JJ.victoire(combat.nom):'You have defeated '+combat.nom+'!','system');
      var gain=Math.max(0,(combat.ppBase+combat.etageCourant)*combat.ppMult);
      ecrireJournal(el,JJ?JJ.progres(fmtNombre(gain)):'You gained '+fmtNombre(gain)+' progress to your next Perk Point!','system');
      combat.ppProg+=gain;
      if(combat.ppProg>=SEUIL_PP){
        var n=Math.floor(combat.ppProg/SEUIL_PP);
        combat.ppProg=combat.ppProg%SEUIL_PP;
        ecrireJournal(el,JJ?JJ.pointAtout(n===1?'1':fmtNombre(n),n!==1):(n===1?'You gained 1 Perk Point!':'You gained '+fmtNombre(n)+' Perk Points!'),'system');
      }
    }
    /* Premier passage à un étage jamais atteint (IL AdventureController::enemyDeath, 0x901 : itopodLevel > highestItopodLevel → ItopodPerkController::awardHighestLevelPP, puis highestItopodLevel = itopodLevel ; les lignes ne viennent QU'APRÈS les lignes de progression). */
    if(combat.hautConnu&&etageApres>combat.haut){
      if(combat.pvMax>0&&etageApres%10===0&&JJ&&JJ.premiereAtteinte)JJ.premiereAtteinte(etageApres).forEach(function(ligne){ecrireJournal(el,ligne,'system');});
      combat.haut=etageApres;
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
/* Signature de ce qui décide du combat à l'écran : un changement venu du serveur (« Appliquer », « Auto », nouvel étage du moteur) doit se voir TOUT DE SUITE (Norman, 2026-11-22 : après « Appliquer », les ennemis de l'ancien étage restaient jusqu'à un changement de menu). */
function signature(d){
  return [d&&d.floor,d&&d.startFloor,d&&d.endFloor,d&&d.hitsParKill,d&&d.optimalFloor,d&&d.ennemiPv,d&&d.pvMax,d&&d.idleMode].join('|');
}
/* Met l'arène affichée à jour avec les valeurs du serveur sans redessiner la page : appelé à chaque synchro de la page ITOPOD ; ne fait quelque chose que si la signature a changé. Renvoie true si l'arène a été refaite. */
function maj(d){
  if(typeof document==='undefined')return false;
  var els=document.querySelectorAll('.'+CLASSE);
  if(!els.length||signature(d)===combat.sigServeur)return false;
  var r=lireDonnees(d);
  var el=els[0];
  combat.decalage=0;combat.coups=0;combat.mort=false;combat.prochain=0;combat.tEnnemi=0;
  el.setAttribute('data-etage',String(r.etage));el.setAttribute('data-kills',String(r.kills));el.setAttribute('data-sur',String(r.sur));
  remplir(el);
  return true;
}
function html(d){
  charger();
  var r=lireDonnees(d);
  return '<section class="itp-arene '+CLASSE+'" data-etage="'+r.etage+'" data-kills="'+r.kills+'" data-sur="'+r.sur+'">'+contenu(r.etage,r.kills+combat.decalage,r.sur)+'</section>';
}
/* Lit les valeurs du serveur (étage, kills, coups par ennemi, PV, dégâts...) dans l'état du combat de l'écran. */
function lireDonnees(d){
  var etage=Math.max(0,Math.floor(Number(d&&d.floor)||0));
  var kills=Math.max(0,Math.floor(Number(d&&d.kills)||0));
  var sur=Math.max(0,Math.min(9,Math.floor(Number(d&&d.killsOnFloor!=null?d.killsOnFloor:kills%10)||0)));
  combat.hits=Math.max(0,Math.floor(Number(d&&d.hitsParKill)||0));
  combat.intervalle=Number(d&&d.intervalS)>0?Number(d.intervalS):1;
  combat.respawn=Number(d&&d.respawnS)>0?Number(d.respawnS):4;
  combat.actif=Boolean(d&&d.actif);
  /* Plus de mode automatique côté moteur (départ 0 / fin 20 par défaut) ; un ancien serveur qui envoie encore null garde l'ancien comportement. */
  combat.auto=!d||d.startFloor==null||d.endFloor==null;
  combat.debut=Math.max(0,Math.floor(Number(d&&d.startFloor)||0));
  combat.fin=Math.max(combat.debut,Math.floor(Number(d&&d.endFloor)||0));
  combat.optimal=Math.max(0,Math.floor(Number(d&&d.optimalFloor)||0));
  if(combat.killsServeur!==kills){combat.killsServeur=kills;combat.decalage=0;combat.coups=0;combat.mort=false;combat.prochain=0;combat.tEnnemi=0;}
  /* Un rendu de la page redonne la main au serveur : plus d'étage forcé par une mort visuelle. */
  combat.reperage=null;combat.sansEnnemi=false;combat.ia=null;combat.finParalysie=0;combat.lectureFigee=false;
  /* Barre de vie du joueur et journal : valeurs du serveur à chaque rendu de la page (pv absent = pas de barre). */
  var nb=function(v){var x=Number(v);return Number.isFinite(x)&&x>0?x:0;};
  combat.pvMax=nb(d&&d.pvMax);
  combat.pv=combat.pvMax>0?Math.min(combat.pvMax,Math.max(0,Number(d&&d.pv)||0)):0;
  combat.degats=nb(d&&d.degatsCoup);
  combat.ennemiCoup=nb(d&&d.ennemiCoup);
  combat.ennemiPoison=nb(d&&d.ennemiPoison);
  combat.ennemiPv=nb(d&&d.ennemiPv);
  combat.regenPv=nb(d&&d.regenPv);
  combat.ppBase=nb(d&&d.ppBase);
  combat.ppMult=nb(d&&d.ppMult)||1;
  combat.ppProg=Math.max(0,Number(d&&d.ppProgress)||0);
  combat.floorServeur=etage;
  combat.idle=!d||d.idleMode!==false;                 /* champ absent = Idle actif */
  combat.regenBase=nb(d&&d.regenBase);
  combat.puissanceJoueur=nb(d&&d.puissanceJoueur);
  combat.defenseJoueur=nb(d&&d.defenseJoueur);
  combat.hautConnu=!!(d&&d.highestFloor!=null);
  combat.haut=combat.hautConnu?Math.max(0,Math.floor(Number(d.highestFloor)||0)):0;
  /* Lazy Shifter (AdventureController::activateLazyItopod) : un étage serveur qui change sans qu'une dizaine de victoires l'explique (le compteur de l'étage n'est pas reparti de zéro) est écrit ; d.shifterDe (étage d'avant) l'affirme explicitement s'il est envoyé. */
  combat.shifterOn=!!(d&&d.shifterOn);
  if(combat.shifterOn&&combat.precFloor!=null&&etage!==combat.precFloor&&(d.shifterDe!=null||sur>=combat.precSur)){
    var JJs=window.__SOREAL_IDLE_JOURNAL_JEU_V1__,de=d.shifterDe!=null?Math.floor(Number(d.shifterDe)||0):combat.precFloor;
    if(JJs&&JJs.changementEtage&&de!==etage)ecrireJournal(null,JJs.changementEtage(de,etage),'system');
  }
  combat.precFloor=etage;combat.precSur=sur;
  combat.dernierPas=0;
  combat.sigServeur=signature(d);
  return {etage:etage,kills:kills,sur:sur};
}

window.__SOREAL_IDLE_ITOPOD_SCENE_V1__={pas:pas,texteProchain:texteProchain,combat:combat,estFlottant:estFlottant,html:html,maj:maj,numeroDecor:numeroDecor,indexEnnemi:indexEnnemi};
})();
