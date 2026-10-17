/*
 * SOREAL IDLE — menu Défis (Challenges), fidèle à la page « Challenges » du wiki NGU Idle (relue le 2026-09-30).
 *
 * Ce module contient :
 *  - les textes explicatifs FRANÇAIS de chaque défi (description, restriction, condition de victoire, récompenses par
 *    complétion) pour les trois difficultés (Normal, Evil, Sadistic). Les valeurs (EXP, AP, boss cible, nombre de
 *    complétions) viennent toujours du serveur (challengeDefinitions) ; seuls les libellés sont écrits ici ;
 *  - la page « Défis » ;
 *  - les effets côté écran d'un défi actif : annonce de fin de défi, trolls du Troll Challenge (message, boîtes, chaton,
 *    navigation aléatoire), mode aveugle du Blind Challenge ;
 *  - la traduction des codes d'erreur des défis.
 *
 * ANTI-SPOIL (AGENTS.md, règle n°2) : un défi verrouillé n'apparaît jamais (le serveur ne l'envoie pas). Les récompenses
 * spéciales qui révèlent un système pas encore découvert (Golden Beard, Fruit of Numbers, rituel de sang, MacGuffins...)
 * ne sont écrites qu'une fois obtenues ; avant, la ligne dit « Récompense surprise ».
 *
 *   window.__SOREAL_IDLE_DEFIS_V1__ = { page(j), verifier(j), traduire(message), textes }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_DEFIS_V1__)return;

/* ---------- Textes ---------- */

var MESSAGES_ERREUR={
  DEFI_SANS_EQUIPEMENT:'🚫 No Equipment Challenge : impossible d’équiper quoi que ce soit pendant ce défi.',
  DEFI_SANS_AUGMENTATIONS:'🚫 No Augmentations Challenge : le menu Augmentations est interdit pendant ce défi.',
  REBIRTH_INTERDITE_DEFI:'🚫 No Rebirth Challenge : les Renaissances sont interdites pendant ce défi.',
  DEFI_VERROUILLE:'Ce défi n’est pas encore disponible.',
  DEFI_DEJA_ACTIF:'Un défi est déjà en cours : termine-le ou abandonne-le d’abord.',
  DEFI_NON_ACTIF:'Ce défi n’est pas en cours.',
  OBJECTIF_NON_ATTEINT:'L’objectif du défi n’est pas encore atteint.',
  DEFI_ECHOUE_TEMPS:'Trop tard : les 24 heures de jeu sont écoulées. Abandonne et recommence.',
  DEFI_INVALIDE:'Défi inconnu.',
  ACTION_DEFI_INVALIDE:'Action de défi inconnue.'
};

var DIFFICULTES={
  normal:{nom:'Normal',note:'Les défis Normal sont débloqués un par un dès que leur condition est remplie.'},
  difficile:{nom:'Evil',note:'Les défis Evil sont débloqués en entrant en difficulté Evil. Ils donnent en général 10 fois plus d’EXP que les défis Normal, mais 5 fois moins d’AP.'},
  extreme:{nom:'Sadistic',note:'Les défis Sadistic sont débloqués en entrant en difficulté Sadistic. Ils donnent 100 fois plus d’EXP et 5 fois moins d’AP que les défis Normal.'}
};

var INTRO='Un défi te fait faire une Renaissance : ton NOMBRE revient à 1 et les banques de certains systèmes sont vidées (le Laser Sword Challenge fait seulement une Renaissance normale, sans rien remettre à zéro). Tu peux abandonner à tout moment, sans aucune pénalité à part le temps perdu. Le défi se termine tout seul quand sa condition de victoire est atteinte. Chaque défi peut être réussi plusieurs fois ; une fois le maximum atteint, les réussites suivantes ne donnent plus de récompense.';

/* q : 'premiere' | 'chaque' | 'finale' | numéro de complétion. s : true = récompense qui révèle un système à découvrir. */
function R(q,t,s){return {q:q,t:t,s:Boolean(s)};}

var DEFIS={
  basic:{
    nom:'Basic Challenge',
    desc:{normal:'Un défi simple. Ton NOMBRE revient à 1 et tu remontes du boss 1 jusqu’au boss 58. Cette perte de NOMBRE est permanente, mais tu le regagneras bien plus vite qu’il ne t’a fallu pour en arriver là. Rien d’autre n’est réinitialisé : tu gardes tes améliorations d’EXP, tes stats d’Aventure, etc.'},
    restriction:'Aucune ! Tu peux renaître autant que tu veux et tout faire.',
    conseil:{normal:'Aucune stat particulière. Laisse-toi quand même un peu de temps avant de le lancer.',difficile:'À faire dès ton entrée en Evil : il n’impose aucune restriction, et repasser de 1 à 1 ne change rien. Des stats d’Aventure gratuites !'},
    recompenses:{
      normal:[R('premiere','+10 % à toutes les stats d’Aventure'),R('chaque','+5 % à toutes les stats d’Aventure'),R('chaque','+10 % de chance de recyclage des boosts'),R('finale','Débloque la compétence Paralyze du mode Aventure',true)],
      difficile:[R('chaque','+10 % à toutes les stats d’Aventure')],
      extreme:[R('chaque','1 mayo de chaque sorte',true),R('finale','5 mayos de chaque sorte',true)]
    }
  },
  noAugmentations:{
    nom:'No Augmentations Challenge',
    desc:{normal:'Pas d’augmentations pour toi ! Ton NOMBRE revient à 1 et tu remontes comme d’habitude. Mais le menu Augmentations est totalement interdit pendant toute la durée du défi.'},
    restriction:'Le menu Augmentations est verrouillé pendant le défi. Tout le reste est disponible.',
    conseil:{normal:'Compense l’absence d’augmentations avec tes autres sources de puissance.'},
    recompenses:{
      normal:[R('premiere','+10 % de vitesse de montée des augmentations'),R('chaque','+25 % à la puissance totale des augmentations'),R('finale','Le coût des augmentations ET de leurs améliorations est réduit de 50 %')],
      difficile:[R('chaque','+5 % de vitesse de montée des augmentations'),R('finale','+25 % de vitesse de montée des augmentations en plus')],
      extreme:[]
    }
  },
  twentyFourHours:{
    nom:'24 Hour Challenge',
    desc:{normal:'Ton NOMBRE revient à 1 et tu disposes de 24 heures de temps de jeu pour atteindre le boss cible. Chaque réussite relève le boss cible du défi suivant.'},
    restriction:'La progression hors ligne est désactivée pendant le défi. Mais le chrono ne tourne pas non plus pendant ce temps : prends-le comme un avantage !',
    conseil:{normal:'Plus tu es fort, mieux c’est.'},
    recompenses:{
      normal:[R('chaque','+10 % d’EXP à chaque boss 24 ou plus vaincu (arrondi à l’inférieur, s’applique aussi aux Titans)')],
      difficile:[R('chaque','+4 % d’EXP à chaque boss 24 ou plus vaincu (arrondi à l’inférieur, s’applique aussi aux Titans)')],
      extreme:[R('chaque','+2 % d’EXP à chaque boss 24 ou plus vaincu (arrondi à l’inférieur, s’applique aussi aux Titans)')]
    },
    multiplie:true
  },
  hundredLevels:{
    nom:'100 Levels Challenge',
    desc:{normal:'Ton NOMBRE revient à 1 et tu remontes ! Sauf que cette fois, tu ne peux gagner que 100 niveaux au maximum, par Renaissance, en tout depuis les Augmentations, la Blood Magic, la Time Machine, Wandoos et les Barbes réunis.'},
    restriction:'Tu peux tout utiliser, mais le total de niveaux gagnés par Renaissance dans toutes ces fonctions (sauf l’entraînement de base et les NGU) est plafonné à 100. Les niveaux d’Advanced Training gagnés pendant la Renaissance comptent aussi (pas ceux du perk d’Advanced Training instantané, ni ceux des banques ou des niveaux temporaires de barbes). La progression hors ligne est désactivée.',
    conseil:{normal:'Beaucoup de capacité et de puissance d’Énergie et de Magie.'},
    recompenses:{
      normal:[R('premiere','Débloque la transformation de boosts : transforme un boost en boost de Puissance, de Robustesse ou Spécial, au prix d’un palier de moins',true),R('chaque','+20 % de vitesse permanente de Wandoos'),R('finale','Supprime le coût de la transformation de boosts et débloque la transformation automatique',true)],
      difficile:[R('chaque','+10 % de vitesse de démarrage de Wandoos')],
      extreme:[]
    }
  },
  noEquipment:{
    nom:'No Equipment Challenge',
    desc:{normal:'L’équipement t’aide à tout faire mieux : alors on te l’enlève.'},
    restriction:'Aucun bonus d’équipement : tu peux mettre et enlever des pièces, mais rien ne compte tant que le défi est actif.',
    conseil:{normal:'Beaucoup de Puissance d’Énergie et de Puissance de Magie de base.'},
    recompenses:{
      normal:[R('premiere','Débloque l’AUTO BOOST',true),R('chaque','−10 % du temps d’AUTO BOOST et d’AUTO MERGE',true),R('chaque','+8 emplacements d’inventaire'),R('finale','+10 emplacements d’inventaire en plus')],
      difficile:[R('chaque','+3 emplacements d’inventaire'),R('finale','Un emplacement de MacGuffin bonus et des emplacements d’inventaire en plus',true)],
      extreme:[R('chaque','+2 % d’attaque en mode Idle'),R('finale','+10 % d’attaque en mode Idle en plus')]
    }
  },
  troll:{
    nom:'Troll Challenge',
    desc:{normal:'Tu vas m’affronter, moi, 4G, en grimpant les boss. De temps en temps, je te ferai une vacherie : peut-être effacer ta progression d’augmentations, peut-être désactiver Wandoos, peut-être te noyer sous les popups. Quoi que je fasse, ce sera mauvais.'},
    restriction:'Laisse tes dernières traces de bon sens à la porte. La progression hors ligne est désactivée. Toutes les quelques dizaines de secondes, un troll s’abat sur toi (un gros troll tous les cinq trolls, souvent bien plus sévère).',
    conseil:{normal:'De la patience pour les bêtises que je vais te faire subir.'},
    recompenses:{
      normal:[R(1,'Vitesse ×3 des NGU de Magie'),R(2,'Un nouvel emplacement d’accessoire !'),R(3,'Les fruits d’Yggdrasil peuvent monter jusqu’au palier 24',true),R(4,'Un nouvel emplacement de barbe !',true),R(5,'Un nouveau fruit : le Fruit of Numbers !',true),R(6,'Un nouveau rituel de Blood Magic !',true),R(7,'La Golden Beard !',true)],
      difficile:[R(1,'Un emplacement d’accessoire en plus !'),R(2,'Un emplacement de MacGuffin en plus !',true),R(3,'Un emplacement de garderie en plus !',true),R(4,'Débloque le souhait Dual Wielding',true),R(5,'+25 % de vitesse des Hacks',true),R(6,'Débloque le Dual Wielding amélioré',true),R(7,'Un emplacement de souhait en plus !',true)],
      extreme:[R(1,'Vitesse ×3 des NGU d’Énergie'),R(2,'Plus de MacGuffins idle ! (n’augmente pas les drops idle : augmente les bonus des Renaissances de plus de 30 minutes)',true),R(3,'Aucun nouveau bonus (seulement de l’EXP et des AP)'),R(4,'Aucun nouveau bonus (seulement de l’EXP et des AP)'),R(5,'+10 % de vitesse de génération des cartes',true),R(6,'+10 % de vitesse de génération de mayo',true),R(7,'Un emplacement d’accessoire en plus ! Oui, je suis un bâtard.')]
    }
  },
  noRebirth:{
    nom:'No Rebirth Challenge',
    desc:{normal:'Les Renaissances, c’est amusant, non ? Moi, je déteste ça. AUCUNE RENAISSANCE, JAMAIS ! Ton NOMBRE revient à 1 et tu dois atteindre le boss cible sans jamais renaître.'},
    restriction:'Interdit de renaître !',
    conseil:{normal:'Tout ce qui augmente directement ton Attaque et ta Défense.'},
    recompenses:{
      normal:[R('premiere','+1 niveau sur tout le butin de Titans',true),R('chaque','−15 minutes de délai pour les Titans, à partir de Jake from Accounting',true)],
      difficile:[R('chaque','−15 minutes de délai pour les Titans, à partir du Greasy Nerd',true)],
      extreme:[R('chaque','−15 minutes de délai pour les Titans, à partir de IT HUNGERS',true)]
    }
  },
  laserSword:{
    nom:'Laser Sword Challenge',
    desc:{normal:'Jensen, le gars des augmentations, veut une augmentation Laser Sword 2/2. Fabrique-lui en une et il rendra tes augmentations bien plus efficaces. RIEN N’EST RÉINITIALISÉ dans ce défi : c’est simplement une Renaissance normale (ton NOMBRE ne revient pas à 1).'},
    restriction:'Absolument aucune !',
    conseil:{normal:'Assez de puissance pour fabriquer la Laser Sword demandée. Ce n’est pas si compliqué.'},
    recompenses:{
      normal:[R('chaque','Le niveau des augmentations à partir de Milk est élevé à une puissance supérieure : +0,01 pour Milk, +0,02 pour Cannon, et ainsi de suite jusqu’à Laser Sword'),R('premiere','Même bonus, mais il augmente de 0,05'),R('finale','Même bonus, mais il augmente de 0,05')],
      difficile:[],
      extreme:[]
    }
  },
  blind:{
    nom:'Blind Challenge',
    desc:{normal:'Ton NOMBRE revient à 1 et tu remontes jusqu’au boss cible. Mais, oh non ! La plupart des nombres affichés dans le jeu sont devenus invisibles ! T’entraînes-tu correctement ? As-tu bien réglé tes augmentations ? Renais-tu vers un NOMBRE plus haut ou plus bas ? Espère t’en souvenir.'},
    restriction:'Rien n’est interdit, tu es simplement aveugle comme une taupe. Le défi devient « plus aveugle » à chaque niveau réussi : de plus en plus de nombres sont masqués.',
    conseil:{normal:'Une bonne mémoire et un peu de calcul mental. Astuce : le menu des détails de stats reste utile, et l’objet équipé qui monte jusqu’au boss 100 te dit à quel boss tu en es.'},
    recompenses:{
      normal:[R('chaque','Les objets montent 1 % plus vite à la garderie',true),R('premiere','Les objets montent 5 % plus vite à la garderie en bonus',true),R('finale','Un emplacement de garderie en plus !',true)],
      difficile:[R('chaque','La vitesse de la garderie augmente de 2 %',true)],
      extreme:[R('chaque','La vitesse de la garderie augmente de 1 %',true)]
    }
  },
  noNgu:{
    nom:'No NGU Challenge',
    desc:{normal:'Ces NGU sont sacrément puissants ! Voyons comment tu t’en sors sans eux.',difficile:'Tu ne tires aucun bonus des NGU !'},
    restriction:'Les NGU ne donnent absolument aucun bonus.',
    conseil:{normal:'Tout ce qui n’est pas NGU !',difficile:'Tout ce qui n’est pas NGU ! Il faudra peut-être attendre 30 minutes pour que le Fruit of Power Beta fasse effet.'},
    recompenses:{
      normal:[R('chaque','+5 % de vitesse des NGU',true)],
      difficile:[R('chaque','+20 % de vitesse des Hacks',true)],
      extreme:[]
    }
  },
  noTimeMachine:{
    nom:'No Time Machine Challenge',
    desc:{normal:'Te voilà pauvre. Bonne chance !'},
    restriction:'La Time Machine ne te donne aucun or (aucun GPS).',
    conseil:{normal:'De grosses stats d’Aventure, de gros bonus de butin d’or, tout ce qui te fait gagner de l’or sans la Time Machine.'},
    recompenses:{
      normal:[R('chaque','+100 % à ton GPS (or par seconde)'),R('premiere','+5 % au bonus global des Diggers',true),R(5,'+1 emplacement de Digger',true)],
      difficile:[R('chaque','+10 % de vitesse de montée de la Time Machine'),R('premiere','+100 % d’or gagné en butin')],
      extreme:[]
    }
  }
};

/* Trolls (page Challenges, section Trolls). big : gros troll. */
var TROLLS={
  augments:{big:false,titre:'Troll : augmentations',msg:'« Oups, je viens de perdre la moitié de tes niveaux d’augmentations et d’améliorations ! »'},
  blood:{big:false,titre:'Troll : sang',msg:'« Oups, j’ai perdu tout ton sang… ET remis ton multiplicateur de Renaissance de Blood Magic à 1 ! Bien fait pour toi, nul. »'},
  timeMachine:{big:false,titre:'Troll : Time Machine',msg:'« Zut, voilà ta Time Machine partie ! PS : j’ai aussi éteint tes Diggers. »'},
  gold:{big:false,titre:'Troll : or',msg:'« Je viens de voler tout ton or, merci, salut. »'},
  boxes:{big:false,titre:'Troll : boîtes',msg:'« TU ADORES FERMER CES BOÎTES, ALORS EN VOILÀ 50 DE PLUS ! »'},
  energy:{big:false,titre:'Troll : énergie',msg:'« Tu n’avais pas besoin de toute cette Énergie, non ? »'},
  magic:{big:false,titre:'Troll : magie',msg:'« Tu n’avais pas besoin de toute cette Magie, non ? »'},
  wandoos:{big:false,titre:'Troll : Wandoos',msg:'« Oh non, Wandoos vient de planter et a perdu tous ses niveaux ! Qui aurait pu le prévoir, quelle horreur, etc. »'},
  kitty:{big:false,titre:'Troll : chaton',msg:'« J’ai dessiné un chaton pour toi, j’espère qu’il te plaît c: »'},
  ngu:{big:true,titre:'GROS troll : NGU',msg:'« Je viens de casser tes NGU, espèce d’idiot ! Ils ne te donnent plus aucun bonus jusqu’à ta prochaine Renaissance ! PS : j’ai aussi éteint tes Diggers. »'},
  beards:{big:true,titre:'GROS troll : barbes',msg:'« Je viens de casser tes Barbes, espèce d’idiot ! Elles ne te donnent plus aucun bonus jusqu’à ta prochaine Renaissance ! PS : j’ai aussi éteint tes Diggers. »'},
  menu:{big:true,titre:'GROS troll : menus',msg:'« 75 % de chances que tu atterrisses dans un menu au hasard, jusqu’à ta prochaine Renaissance. De rien <3 »'},
  ruin:{big:true,titre:'GROS troll : tout',msg:'« Je viens à peu près de tout ruiner :) »'},
  wandoosOff:{big:true,titre:'GROS troll : Wandoos',msg:'« Bon, Wandoos vient d’avoir un écran bleu. Plus aucun bonus Wandoos jusqu’à ta prochaine Renaissance ! »'},
  bossDivider:{big:true,titre:'GROS troll : multiplicateur de boss',msg:'« Je viens de diviser ton multiplicateur de boss par X. De rien :3 »'}
};

/* ---------- Utilitaires ---------- */

function hote(){return window.__SOREAL_IDLE_META_HOST_V130__||{};}
function h(x){var f=hote().idleHtml_;return typeof f==='function'?f(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ent(x){var f=hote().idleEntier_;return typeof f==='function'?f(x):Math.floor(Number(x)||0);}
function gn(x){var f=hote().formatGrandNombreIdleV70_;return typeof f==='function'?f(x):String(x);}
function difficulteDe(defs){return defs&&defs[0]&&defs[0].tier?defs[0].tier:'normal';}

function traduire(message){
  var m=String(message==null?'':message);
  return MESSAGES_ERREUR[m]||m;
}

/* Complétion (1..max) qu'une ligne de récompense concerne, ou null si « chaque » ne s'applique qu'aux complétions 1..max. */
function ligneRecue(r,fait,max){
  if(r.q==='premiere')return fait>=1;
  if(r.q==='finale')return fait>=max;
  if(r.q==='chaque')return fait>=1;
  return fait>=r.q;
}
function etiquetteQuand(r,max){
  if(r.q==='premiere')return '1re complétion';
  if(r.q==='finale')return 'Dernière complétion';
  if(r.q==='chaque')return 'Chaque complétion';
  return 'Complétion '+r.q;
}
function ligneRecompense(r,def,fait){
  var recu=ligneRecue(r,fait,ent(def.max));
  var texte=(recu||!r.s)?r.t:'Récompense surprise';
  if(r.s&&!recu)texte='🎁 '+texte;
  var extra='';
  if(typeof r.q==='number'&&def.id==='troll'){
    var boss=69+(r.q-1)*15;
    var intervalles=[120,110,100,90,85,80,75];
    extra=' <small>(boss '+boss+', trolls toutes les '+intervalles[r.q-1]+' s)</small>';
  }
  return '<li class="dfi-rec'+(recu?' recu':'')+'"><span class="dfi-coche">'+(recu?'✅':'▫️')+'</span>'+
    '<span><b>'+h(etiquetteQuand(r,ent(def.max)))+'</b> '+h(texte)+extra+'</span></li>';
}

/* ---------- Page ---------- */


/* Cadre titré (Norman, 2026-10-01 : « des cadres avec de belles écritures qui séparent bien Description, restrictions, etc. »). */
function cadre(classe,icone,titre,contenu){
  return '<section class="dfi-cadre '+classe+'"><header><span class="dfi-ic">'+icone+'</span><span class="dfi-tt">'+titre+'</span></header><div class="dfi-corps">'+contenu+'</div></section>';
}

/*
 * Look « jeu vidéo » (Norman, 2026-10-11 : « ça fait traitement de texte, fichier Excel : je veux que ça fasse jeu vidéo ») : chaque défi est une tuile avec son blason dessiné (SVG original),
 * ses étoiles de complétion et un gros bouton Jouer ; un clic sur la tuile ouvre la fiche (Objectif, Description, Restrictions, Conseil, Récompenses).
 */
var COULEURS_DEFI={basic:'#f5b53a',noAugmentations:'#ff7a3c',twentyFourHours:'#4aa3ff',hundredLevels:'#7bd34a',noEquipment:'#c1c9d6',troll:'#9be23b',noRebirth:'#ff5a7a',laserSword:'#3de0ff',blind:'#a77bff',noNgu:'#5c7bff',noTimeMachine:'#3ee0b0'};
var DEFIS_INTERDIT={noAugmentations:1,noEquipment:1,noRebirth:1,blind:1,noNgu:1,noTimeMachine:1};
var GLYPHES_DEFI={
  basic:'<rect x="33" y="26" width="5" height="48" rx="2"/><path d="M38 28 H70 V52 H38 Z"/><path d="M38 28 H46 V35 H38 Z M54 28 H62 V35 H54 Z M46 35 H54 V43 H46 Z M62 35 H70 V43 H62 Z M38 43 H46 V52 H38 Z M54 43 H62 V52 H54 Z" fill="#24120a" stroke="none"/>',
  noAugmentations:'<path d="M50 24 L72 48 H59 V70 H41 V48 H28 Z"/>',
  twentyFourHours:'<circle cx="50" cy="50" r="23"/><path d="M50 50 V34 M50 50 L61 57" fill="none" stroke-width="5"/><circle cx="50" cy="50" r="3" fill="#24120a" stroke="none"/><path d="M50 30 V33 M50 67 V70 M30 50 H33 M67 50 H70" fill="none" stroke-width="3"/>',
  hundredLevels:'<path d="M26 72 V62 H38 V52 H50 V42 H62 V32 H74 V72 Z"/><path d="M38 62 V72 M50 52 V72 M62 42 V72" fill="none" stroke-width="2.4"/>',
  noEquipment:'<path d="M50 22 L57 30 V58 H43 V30 Z"/><rect x="34" y="58" width="32" height="7" rx="3"/><rect x="46" y="65" width="8" height="12" rx="2"/><circle cx="50" cy="80" r="4.5"/>',
  troll:'<path d="M30 46 L17 33 L33 36 Z M70 46 L83 33 L67 36 Z"/><circle cx="50" cy="52" r="22"/><circle cx="42" cy="47" r="3.6" fill="#24120a" stroke="none"/><circle cx="58" cy="47" r="3.6" fill="#24120a" stroke="none"/><path d="M38 58 Q50 72 62 58 Z" fill="#24120a"/><path d="M44 60 V64 M50 62 V67 M56 60 V64" fill="none" stroke="#fff6dc" stroke-width="2.4"/>',
  noRebirth:'<path d="M72 52 A22 22 0 1 1 57 31" fill="none" stroke-width="9"/><path d="M50 22 L68 28 L56 42 Z"/>',
  laserSword:'<path d="M50 14 L55 20 V58 H45 V20 Z" fill="#c6f7ff"/><path d="M50 18 V56" fill="none" stroke="#3de0ff" stroke-width="3"/><rect x="36" y="58" width="28" height="6" rx="3"/><rect x="46" y="64" width="8" height="12" rx="2"/><circle cx="50" cy="79" r="4.5"/>',
  blind:'<path d="M24 50 Q50 26 76 50 Q50 74 24 50 Z"/><circle cx="50" cy="50" r="9" fill="#24120a" stroke="none"/><circle cx="46" cy="46" r="2.6" fill="#fff6dc" stroke="none"/>',
  noNgu:'<path d="M50 50 C42 34 24 36 24 50 C24 64 42 66 50 50 C58 34 76 36 76 50 C76 64 58 66 50 50 Z" fill="none" stroke-width="8"/>',
  noTimeMachine:'<path d="M32 26 H68 L55 50 L68 74 H32 L45 50 Z"/><path d="M40 33 H60 L50 50 Z M42 69 H58 L50 56 Z" fill="#24120a" stroke="none"/>'
};
function emblemeSvg(id){
  var c=COULEURS_DEFI[id]||'#f5b53a';
  var barre=DEFIS_INTERDIT[id]?'<circle cx="50" cy="50" r="31" fill="none" stroke="#ff3d4d" stroke-width="6"/><path d="M28 28 L72 72" stroke="#ff3d4d" stroke-width="6" stroke-linecap="round"/>':'';
  return '<svg class="dfi-emb" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+
    '<defs><linearGradient id="dfi-g-'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".18" stop-color="'+c+'"/><stop offset="1" stop-color="'+c+'" stop-opacity=".55"/></linearGradient></defs>'+
    '<path d="M50 3 L91 25 V69 L50 97 L9 69 V25 Z" fill="#1a0f08" stroke="#000" stroke-width="3" stroke-linejoin="round"/>'+
    '<path d="M50 9 L85 28 V66 L50 91 L15 66 V28 Z" fill="url(#dfi-g-'+id+')" stroke="#24120a" stroke-width="3" stroke-linejoin="round"/>'+
    '<path d="M50 9 L85 28 V66 L50 91 L15 66 V28 Z" fill="#000" fill-opacity=".16"/>'+
    '<path d="M22 31 L50 15 L78 31" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<g transform="translate(50 50) scale(1.18) translate(-50 -50)" fill="#fff6dc" stroke="#24120a" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">'+(GLYPHES_DEFI[id]||GLYPHES_DEFI.basic)+'</g>'+barre+
  '</svg>';
}
function etoiles(fait,max){
  if(max<1||max>12)return '';
  var out='';
  for(var i=0;i<max;i++)out+='<svg class="dfi-etoile'+(i<fait?' on':'')+'" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5 L12.6 7.4 L19 8 L14.2 12.3 L15.6 18.6 L10 15.3 L4.4 18.6 L5.8 12.3 L1 8 L7.4 7.4 Z"/></svg>';
  return '<div class="dfi-etoiles">'+out+'</div>';
}

var dernierDefis={defs:[],tier:'normal',actif:false};
function infosDefi(def,tier){
  var t=DEFIS[def.id];
  if(!t)return null;
  var fait=ent(def.completion),max=ent(def.max);
  var termine=fait>=max;
  return {t:t,fait:fait,max:max,termine:termine,
    classeStatut:def.active?'cours':termine?'fini':'dispo',
    statut:def.active?'En cours':termine?'Terminé':'Disponible',
    peutDemarrer:Boolean(def.unlocked)&&Boolean(def.implemented)&&!dernierDefis.actif,
    exp:gn(def.reward&&def.reward.experience||0),ap:gn(def.reward&&def.reward.ap||0)};
}

/* Petites pièces d'interface « jeu » : pastilles de gain, étiquettes de section, grand chiffre d'objectif. */
function iconeGain(type){
  return type==='exp'
    ?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5 L12.6 7.4 L19 8 L14.2 12.3 L15.6 18.6 L10 15.3 L4.4 18.6 L5.8 12.3 L1 8 L7.4 7.4 Z" fill="#ffd23f" stroke="#3a2300" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    :'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5 L17.5 9 L10 18.5 L2.5 9 Z" fill="#4fc3ff" stroke="#08243a" stroke-width="1.6" stroke-linejoin="round"/><path d="M2.5 9 H17.5 M10 1.5 L7 9 L10 18.5 L13 9 Z" fill="none" stroke="#08243a" stroke-opacity=".5" stroke-width="1"/></svg>';
}
function pastilleGain(type,val){return '<span class="dfi-gain-p '+type+'">'+iconeGain(type)+'<b>'+val+'</b><i>'+(type==='exp'?'EXP':'AP')+'</i></span>';}
function etiquette(icone,titre){return '<div class="dfi-etiq"><span class="dfi-etiq-ic">'+icone+'</span><span>'+titre+'</span></div>';}
function objectifVisuel(def){
  if(def.id==='laserSword'){
    var n=2+ent(def.completion);
    return {grand:n+' / '+n,leg:'Fabriquer une Laser Sword',suite:'2 / 2 au début, puis +1 / +1 à chaque complétion'};
  }
  var suite=ent(def.targetStep)>0?'+'+ent(def.targetStep)+' à chaque complétion':'';
  return {grand:'Boss '+ent(def.targetBoss),leg:def.id==='twentyFourHours'?'Vaincre ce boss en moins de 24 h de jeu':'Vaincre le boss',suite:suite};
}
function blocObjectif(def){
  var o=objectifVisuel(def);
  return '<div class="dfi-but">'+etiquette('🎯','Objectif')+'<div class="dfi-but-leg">'+h(o.leg)+'</div><div class="dfi-but-grand">'+h(o.grand)+'</div>'+(o.suite?'<div class="dfi-but-suite">'+h(o.suite)+'</div>':'')+'</div>';
}
function typeRecompense(r,max){
  if(r.q==='premiere')return '1re';
  if(r.q==='finale')return 'Dernière';
  if(r.q==='chaque')return 'Chaque';
  return 'N° '+r.q;
}

function tuileDefi(def,tier){
  var i=infosDefi(def,tier);
  if(!i)return '';
  var max=i.max;
  var id=h(def.id);
  return '<article class="dfi-tuile '+i.classeStatut+'" style="--acc:'+(COULEURS_DEFI[def.id]||'#f5b53a')+'" data-dfi-id="'+id+'" onclick="window.__ouvrirDefiIdleV1__(\''+id+'\')">'+
    '<span class="dfi-ruban">'+i.statut+'</span>'+
    '<div class="dfi-embleme"><i class="dfi-rayons"></i>'+emblemeSvg(def.id)+'</div>'+
    '<h3 class="dfi-nom">'+h(i.t.nom)+'</h3>'+
    '<div class="dfi-niveau">'+etoiles(i.fait,max)+'<span class="dfi-compte">'+i.fait+' / '+max+'</span></div>'+
    '<div class="dfi-gains">'+pastilleGain('exp',i.exp)+pastilleGain('ap',i.ap)+'</div>'+
    (i.peutDemarrer?'<button type="button" class="dfi-jouer" onclick="event.stopPropagation();window.__demarrerDefiIdleV1__(\''+id+'\')">Jouer</button>':'<span class="dfi-voir">Voir la fiche</span>')+
  '</article>';
}

/* Fiche d'un défi : briefing de mission (blason, gros objectif, gains en pastilles, restriction en bandeau, histoire sur parchemin, conseil en bulle, récompenses en emplacements). */
function ficheDefi(def,tier){
  var i=infosDefi(def,tier);
  if(!i)return '';
  var max=i.max;
  var t=i.t,id=h(def.id);
  var mult=t.multiplie?' × n° de complétion':'';
  var desc=t.desc[tier]||t.desc.normal;
  var conseil=(t.conseil&&(t.conseil[tier]||t.conseil.normal))||'';
  var slots=(t.recompenses[tier]||[]).map(function(r){
    var recu=ligneRecue(r,i.fait,ent(def.max));
    var texte=(recu||!r.s)?r.t:'Récompense surprise';
    var extra='';
    if(typeof r.q==='number'&&def.id==='troll'){
      var boss=69+(r.q-1)*15;
      var intervalles=[120,110,100,90,85,80,75];
      extra=' <small>(boss '+boss+', trolls toutes les '+intervalles[r.q-1]+' s)</small>';
    }
    return '<li class="dfi-slot'+(recu?' recu':'')+(r.s&&!recu?' secret':'')+'"><span class="dfi-slot-q">'+h(typeRecompense(r,ent(def.max)))+'</span><span class="dfi-slot-ic">'+(recu?'✔':r.s?'🎁':'★')+'</span><span class="dfi-slot-t">'+h(texte)+extra+'</span></li>';
  }).join('');
  return '<div class="dfi-fiche" style="--acc:'+(COULEURS_DEFI[def.id]||'#f5b53a')+'" role="dialog" aria-modal="true">'+
    '<button type="button" class="dfi-fermer" data-dfi-fermer="1" aria-label="Fermer">✕</button>'+
    '<div class="dfi-hero"><i class="dfi-rayons"></i>'+emblemeSvg(def.id)+'<h3 class="dfi-nom">'+h(t.nom)+'</h3>'+etoiles(i.fait,max)+'<div class="dfi-compte">'+i.fait+' / '+max+'</div></div>'+
    blocObjectif(def)+
    '<div class="dfi-gains dfi-gains-gros">'+pastilleGain('exp',i.exp)+pastilleGain('ap',i.ap)+(mult?'<span class="dfi-mult">'+h(mult)+'</span>':'')+'</div>'+
    '<div class="dfi-interdit">'+etiquette('⛔','Restrictions')+'<p>'+h(t.restriction)+'</p></div>'+
    '<div class="dfi-parchemin">'+etiquette('📜','Description')+'<p>'+h(desc)+'</p></div>'+
    (conseil?'<div class="dfi-bulle">'+etiquette('💡','Conseil')+'<p>'+h(conseil)+'</p></div>':'')+
    '<div class="dfi-butin">'+etiquette('🎁','Récompenses')+'<ul class="dfi-slots">'+(slots||'<li class="dfi-slot"><span class="dfi-slot-t">Seulement de l’EXP et des AP.</span></li>')+'</ul><p class="dfi-note">Au-delà du maximum, plus d’EXP, d’AP ni de bonus.</p></div>'+
    (i.peutDemarrer?'<div class="dfi-actions"><button type="button" class="dfi-jouer dfi-jouer-gros" onclick="window.__demarrerDefiIdleV1__(\''+id+'\');window.__fermerDefiIdleV1__()">Jouer</button></div>':'')+
  '</div>';
}
function fermerFiche(){
  var o=document.getElementById('sorealDefiFicheV1');
  if(o&&o.parentNode)o.parentNode.removeChild(o);
}
function ouvrirFiche(id){
  if(typeof document==='undefined'||!document.body)return;
  var def=dernierDefis.defs.filter(function(d){return d&&d.id===id;})[0];
  if(!def)return;
  fermerFiche();
  var o=document.createElement('div');
  o.id='sorealDefiFicheV1';
  o.className='dfi-fiche-fond';
  o.innerHTML=ficheDefi(def,dernierDefis.tier);
  o.addEventListener('click',function(e){
    var cible=e.target;
    if(cible===o||(cible.closest&&cible.closest('[data-dfi-fermer]')))fermerFiche();
  });
  document.body.appendChild(o);
}
window.__ouvrirDefiIdleV1__=ouvrirFiche;
window.__fermerDefiIdleV1__=fermerFiche;
if(typeof document!=='undefined'&&document.addEventListener&&!window.__SOREAL_IDLE_DEFIS_ECHAP_V1__){
  window.__SOREAL_IDLE_DEFIS_ECHAP_V1__=true;
  document.addEventListener('keydown',function(e){if(e&&e.key==='Escape')fermerFiche();});
}

/*
 * Compteur d'un défi (Norman, 2026-10-04 : « quand on en lance un, il doit y avoir un compteur, qui peut compter plusieurs jours, semaines, mois »). Temps écoulé depuis le lancement, à l'heure du serveur : mois
 * (de 30 jours), semaines, jours puis heures:minutes:secondes ; une unité à zéro n'est pas écrite (« 2 sem. 3 j 04:05:06 »).
 */
function dureeLongue(ms){
  var s=Math.max(0,Math.floor((Number(ms)||0)/1000));
  var mois=Math.floor(s/2592000);s-=mois*2592000;
  var sem=Math.floor(s/604800);s-=sem*604800;
  var jours=Math.floor(s/86400);s-=jours*86400;
  var hh=Math.floor(s/3600);s-=hh*3600;
  var mm=Math.floor(s/60);s-=mm*60;
  var p=function(n){return (n<10?'0':'')+n;};
  var parts=[];
  if(mois)parts.push(mois+' mois');
  if(sem)parts.push(sem+' sem.');
  if(jours)parts.push(jours+' j');
  parts.push(p(hh)+':'+p(mm)+':'+p(s));
  return parts.join(' ');
}
function maintenantServeur(){
  return typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();
}
function compteurDefi(debut){
  var t=Number(debut);
  if(!(t>0))return '<p>Le compteur démarre au prochain lancement d’un défi.</p>';
  return '<p><b class="dfi-temps" data-dfi-temps="'+Math.floor(t)+'">'+h(dureeLongue(maintenantServeur()-t))+'</b></p><p class="dfi-note-temps">Lancé le '+h(new Date(t).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}))+'</p>';
}
if(typeof setInterval==='function'&&typeof document!=='undefined'&&!window.__SOREAL_IDLE_DEFIS_TEMPS_V1__){
  window.__SOREAL_IDLE_DEFIS_TEMPS_V1__=true;
  setInterval(function(){
    var els=document.querySelectorAll('[data-dfi-temps]');
    if(!els.length)return;
    var maintenant=maintenantServeur();
    Array.prototype.forEach.call(els,function(el){
      var texte=dureeLongue(maintenant-Number(el.getAttribute('data-dfi-temps')));
      if(el.textContent!==texte)el.textContent=texte;
    });
  },1000);
}

function page(j){
  var entete=hote().entetePageIdleV28_;
  var defs=j&&j.systemes&&Array.isArray(j.systemes.challengeDefinitions)?j.systemes.challengeDefinitions:[];
  var tier=difficulteDe(defs);
  var d=DIFFICULTES[tier]||DIFFICULTES.normal;
  var actifDef=defs.filter(function(x){return x&&x.active;})[0]||null;
  var etat=j&&j.systemes&&j.systemes.challenge||{};
  dernierDefis={defs:defs,tier:tier,actif:Boolean(actifDef)};
  var bandeau='';
  if(actifDef&&DEFIS[actifDef.id]){
    var t=DEFIS[actifDef.id];
    var oa=objectifVisuel(actifDef);
    bandeau='<article class="dfi-encours" style="--acc:'+(COULEURS_DEFI[actifDef.id]||'#ff4d5e')+'">'+
      '<div class="dfi-hero"><i class="dfi-rayons"></i>'+emblemeSvg(actifDef.id)+'<div class="dfi-encours-etiquette">Défi en cours</div><h3 class="dfi-nom">'+h(t.nom)+'</h3>'+etoiles(ent(actifDef.completion),ent(actifDef.max))+'<div class="dfi-compte">'+ent(actifDef.completion)+' / '+ent(actifDef.max)+'</div></div>'+
      '<div class="dfi-chrono">'+etiquette('⏱️','Temps écoulé')+compteurDefi(etat.startedAt)+'</div>'+
      '<div class="dfi-but">'+etiquette('🎯','Objectif')+'<div class="dfi-but-leg">'+h(oa.leg)+'</div><div class="dfi-but-grand">'+h(oa.grand)+'</div></div>'+
      '<div class="dfi-interdit">'+etiquette('⛔','Restrictions')+'<p>'+h(t.restriction)+'</p></div>'+
      (actifDef.id==='troll'&&etat.troll?'<div class="dfi-bulle">'+etiquette('😈','Trolls')+'<p>Trolls subis dans ce défi : <b>'+ent(etat.troll.count)+'</b></p></div>':'')+
      '<div class="dfi-actions"><button type="button" class="dfi-abandon" onclick="window.__abandonnerDefiIdleV1__()">✖ Abandonner le défi</button></div>'+
    '</article>';
  }
  var tuiles=defs.map(function(def){return tuileDefi(def,tier);}).join('');
  return entete('🏁 Défis'+(tier==='difficile'?' (Evil)':tier==='extreme'?' (Sadistic)':''),'Relève des défis à restrictions pour gagner des récompenses permanentes.')+
    '<details class="dfi-aide"><summary>❓ Comment fonctionnent les défis ?</summary><p>'+h(INTRO)+'</p><p>'+h(d.note)+'</p></details>'+
    bandeau+
    '<div class="dfi-grille" data-defi-sans-masque="1">'+(tuiles||'<div class="soreal-idle-section-v8" style="text-align:center;padding:20px">Aucun défi disponible pour l’instant.</div>')+'</div>';
}

/* ---------- Effets à l'écran ---------- */

var derniereFin=null;   /* seq de la dernière fin de défi vue (null = premier passage : on ne rejoue rien) */
var dernierTroll=null;  /* seq du dernier troll vu */
var menuTroll=false;
var menuOriginal=null;

function annonce(titre,lignes,accent){
  var f=window.__sorealFadeNoticeV1__;
  if(typeof f==='function')f(titre,lignes,{dureeMs:5200,accent:accent||'#f43f5e'});
}

function annoncerFin(fin,j){
  var t=DEFIS[fin.completed]||{nom:String(fin.completed||'Défi')};
  var lignes=[t.nom];
  if(fin.rewarded){
    lignes.push('+'+gn(fin.reward&&fin.reward.experience||0)+' EXP · +'+gn(fin.reward&&fin.reward.ap||0)+' AP');
    var defs=j&&j.systemes&&Array.isArray(j.systemes.challengeDefinitions)?j.systemes.challengeDefinitions:[];
    var def=defs.filter(function(x){return x&&x.id===fin.completed;})[0]||{max:0};
    var lignesR=((t.recompenses&&t.recompenses[fin.tier||'normal'])||[]).filter(function(r){
      if(r.q==='chaque')return true;
      if(r.q==='premiere')return fin.completion===1;
      if(r.q==='finale')return fin.completion===ent(def.max);
      return r.q===fin.completion;
    });
    lignesR.slice(0,4).forEach(function(r){lignes.push('🎁 '+r.t);});
  }else{
    lignes.push('Maximum déjà atteint : pas de récompense supplémentaire.');
  }
  annonce('🏁 Défi réussi !',lignes,'#22c55e');
  try{var audio=window.__SOREAL_IDLE_AUDIO_V199__;if(audio&&typeof audio.play==='function')audio.play('achievement');}catch(_){}
}

/* --- trolls visuels --- */

function retirer(id){var e=document.getElementById(id);if(e&&e.parentNode)e.parentNode.removeChild(e);}

function fermerTrollsVisuels(){retirer('sorealDefiBoitesV1');retirer('sorealDefiChatonV1');}

function styleTroll(){
  if(document.getElementById('sorealDefiStyleV1'))return;
  var st=document.createElement('style');
  st.id='sorealDefiStyleV1';
  st.textContent='@keyframes sorealChatonV1{from{transform:translateX(-110vw)}to{transform:translateX(110vw)}}'+
    '#sorealDefiChatonV1{position:fixed;left:0;top:18vh;width:100vw;height:64vh;z-index:99990;pointer-events:none;overflow:hidden}'+
    '#sorealDefiChatonV1 svg{position:absolute;top:0;height:100%;width:auto;animation:sorealChatonV1 14s linear forwards}'+
    '#sorealDefiBoitesV1{position:fixed;inset:0;z-index:99991;pointer-events:none}'+
    '.sorealDefiBoiteV1{position:absolute;pointer-events:auto;width:210px;background:#eef1f6;color:#111;border:2px solid #667;border-radius:6px;box-shadow:0 4px 14px #0007;font:12px system-ui;padding:8px}'+
    '.sorealDefiBoiteV1 b{display:block;margin-bottom:6px}'+
    '.sorealDefiBoiteV1 .bts{display:flex;gap:6px;justify-content:flex-end}'+
    '.sorealDefiBoiteV1 button{padding:3px 10px;border:1px solid #556;background:#dde;border-radius:4px;cursor:pointer}';
  document.head.appendChild(st);
}

function jouerBoites(){
  styleTroll();
  retirer('sorealDefiBoitesV1');
  var zone=document.createElement('div');
  zone.id='sorealDefiBoitesV1';
  var restantes=50;
  var piege=Math.floor(Math.random()*50);
  function boite(i){
    var b=document.createElement('div');
    b.className='sorealDefiBoiteV1';
    b.style.left=Math.round(Math.random()*Math.max(10,window.innerWidth-230))+'px';
    b.style.top=Math.round(Math.random()*Math.max(10,window.innerHeight-130))+'px';
    var inverse=i===piege;
    b.innerHTML='<b>😈 4G</b><div class="txt"></div><div class="bts">'+(inverse?'<button data-k="non">Non</button><button data-k="oui">Oui</button>':'<button data-k="oui">Oui</button><button data-k="non">Non</button>')+'</div>';
    b.querySelector('.txt').textContent=inverse?'Boîte piégée : les boutons sont inversés !':'Encore une boîte à fermer !';
    b.addEventListener('click',function(ev){
      if(!ev.target||ev.target.tagName!=='BUTTON')return;
      if(b.parentNode)b.parentNode.removeChild(b);
      restantes-=1;
      if(restantes<=0)retirer('sorealDefiBoitesV1');
    });
    return b;
  }
  for(var i=0;i<50;i++)zone.appendChild(boite(i));
  document.body.appendChild(zone);
}

function jouerChaton(){
  styleTroll();
  retirer('sorealDefiChatonV1');
  var zone=document.createElement('div');
  zone.id='sorealDefiChatonV1';
  /* Un chaton volontairement mal dessiné (« I drew a kitty for you »). */
  zone.innerHTML='<svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg"><g fill="#ffb84d" stroke="#222" stroke-width="5" stroke-linejoin="round"><path d="M40 90 L52 20 L95 62 Z"/><path d="M180 90 L168 20 L125 62 Z"/><ellipse cx="110" cy="130" rx="76" ry="66"/><path d="M60 190 Q40 235 100 230 Q170 236 165 190 Z"/></g><g fill="#222"><circle cx="80" cy="120" r="9"/><circle cx="142" cy="126" r="7"/><path d="M104 148 L118 146 L110 158 Z"/></g><g fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"><path d="M110 158 Q98 174 84 168"/><path d="M110 158 Q124 176 140 166"/><path d="M60 140 L20 132"/><path d="M60 152 L18 160"/><path d="M162 142 L204 128"/><path d="M162 154 L206 162"/></g></svg>';
  document.body.appendChild(zone);
  setTimeout(function(){retirer('sorealDefiChatonV1');},14500);
}

function activerMenuAleatoire(actif){
  if(actif===menuTroll)return;
  menuTroll=actif;
  if(actif){
    if(typeof window.__menuIdleV28__!=='function')return;
    menuOriginal=window.__menuIdleV28__;
    window.__menuIdleV28__=function(id){
      if(Math.random()<0.75){
        var ids=[].slice.call(document.querySelectorAll('[data-menu-id-v1]')).map(function(b){return b.getAttribute('data-menu-id-v1');});
        if(ids.length)id=ids[Math.floor(Math.random()*ids.length)];
      }
      return menuOriginal.call(this,id);
    };
  }else if(menuOriginal){
    window.__menuIdleV28__=menuOriginal;
    menuOriginal=null;
  }
}

function jouerTroll(troll,j){
  var t=TROLLS[troll.id];
  if(!t)return;
  var msg=t.msg;
  if(troll.id==='bossDivider'){
    var defs=j&&j.systemes&&Array.isArray(j.systemes.challengeDefinitions)?j.systemes.challengeDefinitions:[];
    var d=defs.filter(function(x){return x&&x.id==='troll';})[0];
    msg=msg.replace('X',String(2+(d?ent(d.completion):0)));
  }
  fermerTrollsVisuels();
  annonce('😈 '+t.titre,[msg],t.big?'#ef4444':'#f59e0b');
  if(troll.id==='boxes')jouerBoites();
  if(troll.id==='kitty')jouerChaton();
}

/* --- Blind Challenge : nombres masqués --- */

/*
 * Wiki NGU Idle, page Challenges > Blind Challenge : « Most of the numbers displayed in the game are invisible now » ; la page précise seulement que le
 * défi « gets blinder after each level with more stuff blanked out », SANS dire ce qui disparaît à chacun des 10 niveaux (ni le wiki, ni les guides
 * communautaires ne le détaillent). Règle n°1 (aucune valeur inventée) : aucune progression de repli n'est fabriquée ici ; le même masque s'applique aux
 * 10 niveaux -- tout nombre affiché devient « ??? » (la page des Défis reste lisible). À affiner quand la liste réelle sera confirmée.
 */
var aveugleActif=false;
var observateur=null;

function masquerTexte(txt){
  return txt.replace(/\d[\d.,\s]*\d|\d/g,function(m,offset){
    var suivant=txt.charAt(offset+m.length);
    var valeur=parseFloat(m.replace(/[\s,]/g,'').replace(/,/g,'.'));
    var suffixe=/[A-Za-z]/.test(suivant)&&!/^[a-z]{3,}/.test(txt.slice(offset+m.length,offset+m.length+3));
    if(suffixe||!isFinite(valeur)||valeur>=0)return '???';
    return m;
  });
}
function exclu(noeud){
  var e=noeud.parentElement;
  while(e){
    if(e.hasAttribute&&e.hasAttribute('data-defi-sans-masque'))return true;
    var tag=e.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='INPUT')return true;
    e=e.parentElement;
  }
  return false;
}
function masquerArbre(racine){
  if(!racine)return;
  var w=document.createTreeWalker(racine,NodeFilter.SHOW_TEXT,null);
  var n,lot=[];
  while((n=w.nextNode()))lot.push(n);
  lot.forEach(function(x){
    if(!/\d/.test(x.nodeValue)||exclu(x))return;
    var nouveau=masquerTexte(x.nodeValue);
    if(nouveau!==x.nodeValue)x.nodeValue=nouveau;
  });
}
function racineJeu(){return document.querySelector('.soreal-idle-native-v4')||document.body;}
function masquerNoeud(n){
  if(!n)return;
  if(n.nodeType===3){
    if(!/\d/.test(n.nodeValue)||exclu(n))return;
    var nouveau=masquerTexte(n.nodeValue);
    if(nouveau!==n.nodeValue)n.nodeValue=nouveau;
  }else if(n.nodeType===1){
    masquerArbre(n);
  }
}
/* Sans minuteur : le masque est posé dans la fonction de rappel de l'observateur, sur les seuls nœuds modifiés. */
function surMutations(liste){
  if(!aveugleActif)return;
  for(var i=0;i<liste.length;i++){
    var r=liste[i];
    if(r.type==='characterData')masquerNoeud(r.target);
    else for(var k=0;k<r.addedNodes.length;k++)masquerNoeud(r.addedNodes[k]);
  }
}
function regler(aveugle){
  if(aveugle===aveugleActif)return;
  aveugleActif=aveugle;
  if(aveugle){
    observateur=new MutationObserver(surMutations);
    observateur.observe(document.body,{childList:true,subtree:true,characterData:true});
    masquerArbre(racineJeu());
  }else if(observateur){
    observateur.disconnect();
    observateur=null;
  }
}

/*
 * Annonce de fin de défi, DÈS que le défi est validé (Norman, 2026-10-09 : « le popup n'apparaît qu'en allant dans le menu Défis ; il doit apparaître dès que le défi est validé »). Elle n'était
 * lancée qu'à un rendu complet de la page (changement de menu) ; une synchro qui apporte la fin du défi ne redessine pas la page. soreal-idle-ui.js la vérifie donc aussi chaque seconde.
 */
function verifierFin(j){
  if(!j||!j.systemes)return;
  var etat=j.systemes.challenge||{};
  var fin=etat.lastCompletion||null;
  var seqFin=fin?ent(fin.seq):0;
  if(derniereFin===null)derniereFin=seqFin;
  else if(seqFin>derniereFin){derniereFin=seqFin;annoncerFin(fin,j);}
}

/* Appelé à chaque rendu (voir soreal-idle-ui.js). */
function verifier(j){
  if(!j||!j.systemes)return;
  var etat=j.systemes.challenge||{};
  verifierFin(j);

  var actif=String(etat.active||'');
  var troll=etat.troll||null;
  var seqTroll=troll&&troll.last?ent(troll.last.seq):0;
  if(actif==='troll'&&troll){
    if(dernierTroll===null)dernierTroll=seqTroll;
    else if(seqTroll>dernierTroll){dernierTroll=seqTroll;jouerTroll(troll.last,j);}
    activerMenuAleatoire(Boolean(troll.flags&&troll.flags.menu));
  }else{
    dernierTroll=null;
    activerMenuAleatoire(false);
    fermerTrollsVisuels();
  }

  if(actif==='blind'){
    regler(true);
  }else{
    regler(false);
  }
}

window.__SOREAL_IDLE_DEFIS_V1__={dureeLongue:dureeLongue,page:page,verifier:verifier,verifierFin:verifierFin,traduire:traduire,textes:{DEFIS:DEFIS,TROLLS:TROLLS,DIFFICULTES:DIFFICULTES,MESSAGES_ERREUR:MESSAGES_ERREUR}};
})();
