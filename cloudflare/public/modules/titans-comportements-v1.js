/*
 * Comportements des titans en combat (Norman, 2026-10-04 : « Pourquoi les comportements des titans ne sont pas encore simulés ? … go en commençant du premier au dernier »).
 *
 * FAITS LUS DANS LE JEU (NGU Idle build 1260, 2026-11-15 et 2026-11-16, avec l'accord de Norman ; recoupés par 400 attaques de titans relevées par OCR) : chaque titan a sa routine d'IA (EnemyAI::<titan>AI), qui s'exécute à chaque « attackRate » :
 * le compteur de croissance `growCount` monte de 1 AVANT le coup (ou de `growRate` pour le Traître), puis le titan tire un entier au hasard dans une table propre à lui. Les coups sont aléa(0,8 à 1,2) x max(10 % de la Puissance, Puissance - Robustesse/2) x multiplicateur,
 * où le multiplicateur vaut (type de coup) x (1 + growCount/100) : la croissance est ADDITIVE (+1 % de la puissance de base par attaque, comme `growCount / 100` dans tous les titans) et s'applique APRÈS la réduction par la Robustesse.
 * Tous les nombres ci-dessous sont des littéraux de l'IL du jeu : aucune constante inventée (voir design/audit-code-jeu/ia-ennemis-titans.md, sections 1 et 3).
 *
 * Gordon Ramsay Bolton (theButcherAI) : tirage 1..7 : 1-2 base, 3-4 puissante x2, 5 paralysie (4 s, seulement si au moins 10 attaques depuis la dernière, sinon coup de base ; le tour de paralysie n'attaque PAS), 6-7 saignement (coup de base ET `bleedDamage += 2` : la régénération du joueur baisse de 2 PV/s PAR cumul, valeur absolue, jusqu'à la fin du combat) ;
 * Grand Corrupted Tree (corruptedTreeAI) : tirage 1..7 : 1-2 et 7 base, 3-4 puissante x1,5, 5 nuage des bras (tes dégâts MANUELS divisés par 1,5 pendant 15 s, seulement s'il n'est pas déjà actif, sinon coup de base ; le tour du nuage n'attaque pas),
 *  6 nuage d'énergie (`debuffDefense(1,5 ; 15)` : ta Robustesse x 2/3 ET tes dégâts subis x 1,5 pendant 15 s, idem) ;
 * Jake (jakeAI) : tirage 1..5 : 1-2 base, 3-4 puissante x1,5, 5 sauterelles (si au moins 10 attaques depuis les dernières, sinon base ; le tour de lancement n'attaque pas, puis 10 coups x0,5 à `attackRate x 0,15`) ;
 * UUG (uugAI) : tirage 1..4 : 1-2 base, 3-4 puissante x1,5 ; sans Anneau d'Apathie il devient invincible dès sa 1re attaque et n est multiplié par 2 après chaque attaque (+400) ; avec l'anneau de niveau L < 100, n = ceil((n + 100 - L) x (2 - L/100)) ; à 100 il n'y a que le +1 par attaque.
 * Les titans 5 à 14, Tippi et le Traître sont décrits dans leur définition plus bas (EnemyAI::waldoAI, beastAI, nerdAI, godmotherAI, exileAI, itHungersAI, rockLobsterAI, amalgamateAI, ratAI, traitorAI).
 *
 * Règle n°1 (AGENTS.md) : rien d'inventé. Module pur (aucun accès au DOM ni à l'état du jeu) : le combat (ui-combat-2-v1.js, ui-aventure-1-v1.js) lui donne l'état du combat du titan et reçoit ce que l'attaque fait.
 *
 * Gordon Ramsay Bolton (https://ngu-idle.fandom.com/wiki/Gordon_Ramsay_Bolton, « Titan Skills ») :
 *  - Paralyze : désactive les moves et l'Idle Mode, met en pause les cooldowns ; dure 4 s. Si moins de 10 attaques depuis la dernière Paralyze, une attaque de base est faite à la place.
 *  - Bleed : « réduit ta régénération de PV pour le reste du combat », cumul infini, peut la rendre négative : lu dans le jeu (EnemyAI::theButcherAI : `bleedDamage += 2` à chaque saignement, en PV/s absolus ; la régénération du combat est (régénération - bleedDamage) x durée, puis multipliée comme d'habitude).
 *  Le compteur « 10 attaques » (paralyzeEffect) est incrémenté AVANT le test : la première paralysie est possible dès la 10e attaque.
 *
 * Grand Corrupted Tree (https://ngu-idle.fandom.com/wiki/Grand_Corrupted_Tree, « Titan Skills »), valeurs du jeu :
 *  - bras lourds : `debuffAttack(1,5 ; 15)` ; le facteur n'est lu que par les capacités MANUELLES (attack, strong, pierce, ultimate), jamais par le coup de l'Idle Mode (PlayerController::idleAttack) ;
 *  - énergie : `debuffDefense(1,5 ; 15)` : le facteur sert deux fois, à la Robustesse effective (EnemyAI::baseDamage) et au dégât reçu (PlayerController::takeDamage).
 *
 * Jake From Accounting (https://ngu-idle.fandom.com/wiki/Jake_From_Accounting, « Titan skills ») :
 *  - Shirt-flapping (remplace une attaque sur 20, à partir de la 1re : `growCount % 20 == 1`) : désactive une de tes capacités jusqu'à la fin du combat, dans l'ordre Ultimate Attack -> Heal -> Piercing Attack -> Ultimate Buff -> Strong Attack -> Offensive Buff ;
 *    les suivantes n'ont plus d'effet. L'attaque est « remplacée » : elle ne fait pas de dégâts. Le compteur des 10 attaques part de 0 au début du combat. La rafale de sauterelles compte pour UNE attaque.
 *
 * UUG, The Unmentionable (https://ngu-idle.fandom.com/wiki/UUG,_The_Unmentionable, « Titan Skills », et https://ngu-idle.fandom.com/wiki/Secrets_and_Spoilers, « Ring of Apathy ») :
 *  - Power attack : x1,5 une fois sur deux (tirage 1..4, lu dans le jeu). Le niveau de l'anneau équipé est donné par le combat (etat.anneau : null = pas d'anneau équipé ; l'anneau est lu par InventoryController::apathyCheck).
 */
(function(racine){
  'use strict';

  var NIVEAUX=['easy','normal','hard','brutal'];
  function hasard(e){return e&&typeof e.hasard==='function'?e.hasard():Math.random();}
  function entier(t,n){return Math.max(0,Math.min(n-1,Math.floor((Number(t)||0)*n)));}
  /* Réponse d'une attaque : `type`, `multDegats` (dégâts x ce nombre AVANT l'arrondi, croissance comprise), `sansAttaque` (le titan n'attaque pas ce tour). */
  function R(type,mult,extra){var r={type:type,multDegats:mult,paralyse:false,croissanceTitan:1};if(extra)for(var k in extra)r[k]=extra[k];return r;}
  function SA(type,extra){var r=R(type,0,extra);r.sansAttaque=true;return r;}
  /* Suite programmée (rafale, explosions, deuxième coup) : le combat rappelle attaqueTitan après `intervalleMs`. */
  function finTour(e,r){if(e.file&&e.file.length){r.suite=true;r.intervalleMs=e.file[0].apres;}return r;}
  function cadence(e){return Math.max(100,Number(e.cadenceMs)||2000);}
  /* Coup simple : u entier tiré (0 = premier), les u >= seuil sont des attaques puissantes x1,5. */
  function simple(m,u,seuil){return u>=seuil?R('puissante',1.5*m):R('base',m);}
  function paralyser(e,r,maintenant,ms){
    e.paralyseJusqua=maintenant+ms;e.paralysieDebut=maintenant;e.paralysieAttaquesRestantes=0;
    r.paralyse=true;r.paralyseMs=ms;return r;
  }
  /* EnemyAI::debuffAttack / PlayerController::debuffAttack : le facteur d'attaque du joueur est DIVISÉ par `facteur` ; à l'échéance il est multiplié par le DERNIER facteur posé (une seule fois). */
  function debuffAttaque(e,facteur,ms,maintenant){e.offenseAtk=facteur;e.offenseFacteur=(e.offenseFacteur||1)/facteur;e.offenseFin=maintenant+ms;}
  function echeances(e,maintenant){
    if(e.offenseFin>0&&maintenant>=e.offenseFin){
      e.offenseFacteur=(e.offenseFacteur||1)*(e.offenseAtk||1);
      if(Math.abs(e.offenseFacteur-1)<1e-12)e.offenseFacteur=1;   /* un seul facteur posé puis rendu : retour exact à 1 */
      e.offenseFin=0;e.affaibliJusqua=0;
    }
    if(e.defenseFin>0&&maintenant>=e.defenseFin){e.defenseFacteur=1;e.defenseFin=0;e.draineJusqua=0;}
  }

  var TITANS={
    t1:{
      note:'Simulées dans le combat : Paralysie (4 s, ce tour-là il n’attaque pas), Saignement et Attaque puissante. Chaque cumul de Saignement retire 2 PV par seconde de ta régénération.',
      /* Tirage sur 7 : [0,1) Paralyze, [1,3) Bleed, [3,5) Power Attack, le reste attaque de base. */
      tirer:function(e,tirage){
        var t=tirage*7;
        if(t<1&&e.depuisParalysie+1>=10)return 'paralysie';   /* lu dans le jeu : compteur incrémenté AVANT le test, possible dès la 10e attaque */
        if(t>=1&&t<3)return 'saignement';
        if(t>=3&&t<5)return 'puissante';
        return 'base';
      },
      multPuissante:2,
      saignementPVParSeconde:2,   /* lu dans le jeu : EnemyAI::theButcherAI, bleedDamage += 2 par cumul */
      paralysieMs:4000,
      paralysieAttaques:2,
      minAttaquesEntreParalysies:10
    }
  };

  TITANS.t2={
    note:'Simulées dans le combat : les deux nuages de spores (tes dégâts manuels à 2/3 pendant 15 s ; ta Robustesse à 2/3 et tes dégâts subis x1,5 pendant 15 s), l’Attaque puissante (x1,5) et la croissance de 1 % de force par attaque (commune à tous les titans).',
    /* Tirage sur 7 : [0,1) spores des bras, [1,2) spores d'énergie, [2,4) puissante, le reste base. */
    tirer:function(e,tirage,maintenant){
      var t=tirage*7;
      if(t<1&&!(e.affaibliJusqua>maintenant))return 'sporesBras';
      if(t>=1&&t<2&&!(e.draineJusqua>maintenant))return 'sporesEnergie';
      if(t>=2&&t<4)return 'puissante';
      return 'base';
    },
    multPuissante:1.5,
    sporesBrasMs:15000,
    facteurBras:1.5,      /* debuffAttack(1,5 ; 15) : lu dans le jeu */
    sporesEnergieMs:15000,
    facteurEnergie:1.5    /* debuffDefense(1,5 ; 15) : lu dans le jeu */
  };

  TITANS.t3={
    note:'Simulées dans le combat : Sauterelles (le tour du lancement n’attaque pas), Attaque puissante et Battement de chemise (désactive tes capacités une à une, dans un ordre fixe).',
    /* Tirage sur 5 : [0,1) sauterelles (si 10 attaques depuis les dernières), [1,3) puissante, le reste base. */
    tirer:function(e,tirage){
      var t=tirage*5;
      if(t<1&&e.depuisSauterelles+1>=10)return 'sauterelles';   /* idem : dès la 10e attaque */
      if(t>=1&&t<3)return 'puissante';
      return 'base';
    },
    multPuissante:1.5,
    rafaleCoups:10,rafaleFacteurCadence:0.15,multRafale:0.5,   /* lu dans le jeu (jakeAI) : attackRate x 0,15 entre deux sauterelles */
    chemiseCadence:20,
    ordre:['ultimate','heal','piercing','ultimateBuff','strong','offensiveBuff']
  };

  TITANS.t4={
    note:'Simulées dans le combat : Invincibilité, Croissance de puissance et Attaque puissante (sa chance : 1 sur 2).',
    /* Tirage : [0 ; 0,5) puissante (1 et 2 sur 1..4 : puissante dans le jeu), le reste base. */
    tirer:function(e,tirage){return tirage<0.5?'puissante':'base';},
    multPuissante:1.5,
    invincible:true,
    croissance:function(e){
      /* lu dans le jeu : n monte de 1 à chaque attaque ; le coup utilise 1 + n/100 AVANT les effets de l'anneau, qui agissent sur les attaques suivantes. */
      e.gc=(e.gc||0)+1;
      var mult=1+e.gc/100,niveau=e.anneau;
      if(niveau==null){e.gc=e.gc+400;if(e.gc<=536870911)e.gc=e.gc*2;}
      else if(niveau<100&&e.gc<536870911){var n=Math.max(0,Math.min(99,niveau));e.gc=Math.ceil((e.gc+100-n)*(2-n/100));}
      return mult;
    }
  };

  /* ---- Titans 5 à 14, Tippi, Traître : routines lues dans l'IL (EnemyAI::<nom>AI). `tour` renvoie la réponse du combat et fait avancer l'état. ---- */

  /* Walderp (waldoAI) : cycle de 6 actions. Action 2 : « Walderp dit » (50 %) + consigne tirée dans 2..6 (le 2 devient 3) ; ce tour-là, aucun dégât. Action 3 : si la boucle n'est pas résolue, explosion (attack(1000), sans croissance).
   * Le joueur est « correct » s'il fait la consigne quand Walderp dit, ou s'il ne la fait PAS quand Walderp ne dit pas (didCorrectWaldoMove) ; sinon explosion immédiate. Identifiants de coup (lastAttackID) : Idle 1, riposte de Parade 2, Attaque 3, Forte 4, Perçante 5, Ultime 6. */
  TITANS.t5={
    note:'Simulées dans le combat : « Walderp dit » (obéis à la consigne seulement quand il le dit, sinon explosion), Attaque puissante et croissance de 1 % par attaque.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      if(e.gc%6===2){
        e.boucle=true;
        e.dit=hasard(e)<0.5;
        var c=2+entier(hasard(e),5);if(c===2)c=3;
        e.consigne=c;
        return SA('walderpDit',{dit:e.dit,consigne:c});
      }
      if(e.gc%6===3&&e.boucle){
        e.boucle=false;e.dit=false;
        return R('explosion',1000,{explosion:true,sansCroissance:true});
      }
      return simple(m,entier(tirage,4),2);
    }
  };

  /* The Beast (beastAI) : toutes les 10 actions (growCount % 10 == 3) tirage d'AURA Random.Range(0, k+1), k = 3, 4, 5, 6 selon V1 à V4 (0 = aucune). Aura 1 : régénération de l'ennemi x5 ; 2 : Power Smash (tous ses coups x2) ;
   * 3 : tes dégâts / 3 ; 4 : ton Idle avance à moitié vitesse et tes cooldowns aussi ; 5 : réflexion (tu te blesses de dégâts/50) ; 6 : TA régénération est inversée. L'action de tirage n'attaque pas. */
  TITANS.t6={
    note:'Simulées dans le combat : les auras (régénération x5, Power Smash x2, armure de métal, accélération du temps, réflexion, régénération inversée), Attaque puissante et croissance de 1 % par attaque.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      if(e.gc%10===3){
        var k=[3,4,5,6][Math.max(0,Math.min(3,(e.niveau||1)-1))];
        e.aura=entier(hasard(e),k+1);
        return SA('aura',{aura:e.aura});
      }
      var u=entier(tirage,4);
      if(e.aura===2)return R('puissante',2*m,{powerSmash:true});
      return simple(m,u,2);
    }
  };

  /* Greasy Nerd (nerdAI) : à CHAQUE action, d'abord selon growCount % 8 : 3 = coup x1 ; 4 = coup x5 ; 7 = coup x1 ET piratage (growCount += 8, nerdHacks++) ; PUIS un coup tiré sur 1..4 (1-2 base, 3-4 puissante x1,5). Deux coups par action aux tours 3, 4 et 7. */
  TITANS.nerd={
    note:'Simulées dans le combat : Gant de puissance (x5), Piratage (+8 % de puissance, annulé par ton Attaque Ultime) et Attaque puissante ; deux coups par action certains tours.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      var mod=e.gc%8,second=simple(m,entier(tirage,4),2),premier=null;
      if(mod===3)premier=R('gant',1*m);
      else if(mod===4)premier=R('gantPuissant',5*m);
      else if(mod===7){premier=R('piratage',1*m,{piratage:true});e.gc+=8;e.nerdHacks+=1;}
      if(!premier)return second;
      e.file.push({type:second.type,mult:second.multDegats,apres:0});
      return finTour(e,premier);
    }
  };

  /* The Godmother (godmotherAI) : cycle growCount % 9 : 1 = fin du genou brisé ; 3 = coup x1 ; 4 = mode explosion (aucune attaque ce tour : 4 explosions attack(25 x croissance) à attackRate/5, growCount fixe) ; 8 = coup x1 + genou brisé (tes cooldowns /3 jusqu'au prochain 1) ; sinon tirage 1..4. */
  TITANS.godmother={
    note:'Simulées dans le combat : Explosions (4 coups x25 à intervalle rapide), Rotule brisée (tes capacités se rechargent 3 fois plus lentement), Attaque puissante et croissance de 1 % par attaque.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100,mod=e.gc%9;
      if(mod===1&&e.genou)e.genou=false;
      if(mod===3)return R('gant',1*m);
      if(mod===4){
        for(var i=0;i<4;i+=1)e.file.push({type:'explosionRapide',mult:25*m,apres:Math.round(cadence(e)/5)});
        return finTour(e,SA('explosionsDebut'));
      }
      if(mod===8){e.genou=true;return R('genou',1*m,{genou:true});}
      return simple(m,entier(tirage,4),2);
    }
  };

  /* The Exile (exileAI) : cycle L = 10, 9, 8, 7 (V1 à V4). growCount % L == 3 : aura Random.Range(1, k), k = 2, 3, 4, 5 (aucune attaque sauf l'aura 4) : 1 = bras chargé (aura 1000) ; 2 = saignement (aura 6 : ta régénération inversée) ;
   * 3 = paralysie 2 s ; 4 = coup x2 + il se soigne de 10 % de ses PV max. growCount % L == 4 avec le bras chargé : tir x6. Sinon tirage 1..4 : 1-3 base ; 4 puissante x1,5. */
  TITANS.t7={
    note:'Simulées dans le combat : Tir du bras-canon (x6), saignement (ta régénération inversée), paralysie de 2 s et attaque qui le soigne de 10 %, selon la difficulté ; Attaque puissante.',
    tour:function(e,tirage,maintenant){
      var niv=Math.max(1,Math.min(4,e.niveau||1)),L=[10,9,8,7][niv-1],k=[2,3,4,5][niv-1];
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      if(e.gc%L===4&&e.aura===1000){e.aura=0;return R('tirBras',6*m);}
      if(e.gc%L===3){
        e.aura=0;
        var v=1+entier(hasard(e),k-1);
        if(v===1){e.aura=1000;return SA('brasCharge');}
        if(v===2){e.aura=6;return SA('exileSaignement');}
        if(v===3)return paralyser(e,SA('exileParalysie'),maintenant,2000);
        return R('succion',2*m,{soinEnnemi:0.1});
      }
      return simple(m,entier(tirage,4),3);
    }
  };

  /* IT HUNGERS (itHungersAI) : sans Glop (objet 372 : +5 tours) il est invincible, growCount += 400 par attaque et coup x1 ; avec Glop il est vulnérable (une charge par attaque) et tire 1..5 : 1-3 base, 4-5 puissante x1,5. */
  TITANS.hungers={
    note:'Simulées dans le combat : sans GLOP il est invincible et sa puissance grimpe de 400 % par attaque ; avec GLOP il est vulnérable (une charge par attaque) ; Attaque puissante.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      if(!(e.glopCount>0)&&e.glopStock>0){e.glopStock-=1;e.glopsUtilises=(e.glopsUtilises||0)+1;e.glopCount+=5;}   /* checkAndUseGlop : la GLOP quitte le sac ; la page annonce `glopsUtilises` au serveur à la fin du combat */
      if(!(e.glopCount>0)){e.invincible=true;e.gc+=400;return R('devore',1*m,{invincibleDebut:e.attaques===1});}
      e.glopCount-=1;e.invincible=false;
      return simple(m,entier(tirage,5),3);
    }
  };

  /* Rock Lobster (rockLobsterAI) : tirage 0..4 : 0-2 base ; 3-4 puissante x1,5 (les noms SHELLSHOCK, HARD KNOCK... sont purement cosmétiques). */
  TITANS.lobster={
    note:'Simulées dans le combat : Attaque puissante (x1,5) et croissance de 1 % par attaque.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      return simple(m,entier(tirage,5),3);
    }
  };

  /* AMALGAMATE (amalgamateAI), niveau v = 1 à 4. v = 4 : mécanique de l'Anneau d'Apathie (comme UUG). growCount % 20 == 3 ET v >= 2 : deux debuffAttack(1,3 ; 12) (tes dégâts manuels / 1,69 pendant 12 s) ;
   * % 20 == 10 (tous niveaux) : paralysie 4 s ; % 20 == 15 ET v >= 3 : désactive une de tes capacités (même ordre que Jake). Ces tours n'attaquent pas. Sinon tirage 0..4 : 0-2 base ; 3-4 puissante x1,5. */
  TITANS.amalgamate={
    note:'Simulées dans le combat : affaiblissement de tes dégâts manuels, paralysie de 4 s, désactivation de capacités, invincibilité sans Anneau d’Apathie (dernier niveau), Attaque puissante.',
    ordre:['ultimate','heal','piercing','ultimateBuff','strong','offensiveBuff'],
    tour:function(e,tirage,maintenant,def){
      var v=Math.max(1,Math.min(4,e.niveau||1));
      e.gc+=1;e.attaques+=1;var m=1+e.gc/100;
      if(e.anneau==null&&v>=4){
        e.invincible=true;e.gc+=400;if(e.gc<=536870911)e.gc=e.gc*2;
        return R('devore',1*m,{invincibleDebut:e.attaques===1});
      }
      if(e.anneau!=null&&e.anneau<100&&v>=4&&e.gc<536870911){
        e.gc=e.gc+100-e.anneau;
        e.gc=Math.ceil(e.gc*(2-e.anneau/100));
      }
      var mod=e.gc%20,u=entier(tirage,5);
      if(mod===3&&v>=2){debuffAttaque(e,1.3,12000,maintenant);debuffAttaque(e,1.3,12000,maintenant);return SA('affaiblit',{affaiblit:true});}
      if(mod===10)return paralyser(e,SA('amalgamParalysie'),maintenant,4000);
      if(mod===15&&v>=3){
        e.chemises+=1;
        return SA('chemise',{desactive:def.ordre[e.chemises-1]||null,nouvelle:e.chemises<=def.ordre.length});
      }
      return simple(m,u,3);
    }
  };

  /* Tippi (ratAI) : tirage 0..5 : 0-3 base ; 4 puissante x1,5 ; 5 rats (si au moins 10 actions depuis les derniers, sinon base) : ce tour n'attaque pas ; à l'action suivante (aucune attaque non plus) la nuée part : 10 coups x0,45 à attackRate x 0,15. */
  TITANS.tippi={
    note:'Simulées dans le combat : la nuée de rats (le tour du lancement n’attaque pas, puis 10 coups rapides), Attaque puissante et croissance de 1 % par attaque.',
    tour:function(e,tirage,maintenant){
      e.gc+=1;e.attaques+=1;e.depuisSauterelles+=1;var m=1+e.gc/100;
      if(e.skip<0){
        e.skip+=1;
        if(e.skip===0){
          for(var i=0;i<10;i+=1)e.file.push({type:'rat',mult:0.45*m,apres:Math.round(cadence(e)*0.15),rafale:true});
          e.depuisSauterelles=0;
          return finTour(e,SA('ratsDebut'));
        }
        return SA('ratsDebut');
      }
      var u=entier(tirage,6);
      if(u===5){
        if(e.depuisSauterelles>=10){e.skip=-1;return SA('rats');}
        return R('base',m);
      }
      return u===4?R('puissante',1.5*m):R('base',m);
    }
  };

  /* The Traitor (traitorAI) : growCount += growRate (départ 1) ; tirage 0..8 : 0-3 base ; 4 puissante x1,5 ; 5 SUPER x2 ; 6 tes PV tombent à 20 % de ton max (si tu es au-dessus, sinon coup de base) ;
   * 7 bouclier : invincibleCount += 2 (absorbe 2 de TES coups ; déjà > 5 : coup de base) ; 8 growRate += 1 (la croissance accélère pour de bon). */
  TITANS.traitor={
    note:'Simulées dans le combat : Attaque puissante, Super attaque (x2), réduction de tes PV à 20 %, bouclier qui annule deux de tes coups et accélération permanente de sa croissance.',
    tour:function(e,tirage,maintenant){
      e.gc+=Math.max(1,e.croissanceRythme||1);e.attaques+=1;var m=1+e.gc/100;
      var u=entier(tirage,9);
      if(u===4)return R('puissante',1.5*m);
      if(u===5)return R('super',2*m);
      if(u===6){
        var pv=e.pv;
        if(pv&&pv.cur>0.2*pv.max)return SA('reductionPV',{pvJoueurFraction:0.2});
        return R('base',m);
      }
      if(u===7){
        if(e.bouclierCoups>5)return R('base',m);
        e.bouclierCoups+=2;
        return SA('bouclier',{bouclier:e.bouclierCoups});
      }
      if(u===8){e.croissanceRythme=(e.croissanceRythme||1)+1;return SA('accelere');}
      return R('base',m);
    }
  };

  function neuf(id,niveau){
    return {anneau:null,depuisSauterelles:0,chemises:0,saignements:0,affaibliJusqua:0,draineJusqua:0,attaques:0,depuisParalysie:0,paralyseJusqua:0,paralysieDebut:0,paralysieAttaquesRestantes:0,
      gc:0,file:[],niveau:Math.max(1,Math.min(4,Number(niveau)||1)),cadenceMs:2000,aura:0,boucle:false,dit:false,consigne:0,nerdHacks:0,genou:false,glopCount:0,glopStock:0,glopsUtilises:0,invincible:false,
      bouclierCoups:0,croissanceRythme:1,skip:0,pv:null,offenseFacteur:1,offenseAtk:1,offenseFin:0,defenseFacteur:1,defenseFin:0};
  }

  /* Niveau (1 à 4) d'une difficulté : easy, normal, hard, brutal. */
  function niveauDeDifficulte(palier){var i=NIVEAUX.indexOf(String(palier||''));return i>=0?i+1:1;}

  /* Décrit ce que fait l'attaque du titan. Renvoie {type, multDegats, paralyse, sansAttaque, suite, intervalleMs...}. L'état est modifié sur place. */
  function attaqueTitan(id,etat,maintenantMs,tirage){
    var def=TITANS[String(id||'')];
    if(!def){etat.attaques=(etat.attaques||0)+1;return {type:'base',multDegats:1+etat.attaques/100,paralyse:false,croissanceTitan:1};}   /* titan inconnu : la croissance de 1 % par attaque s'applique aussi */
    if(!etat.file)etat.file=[];
    echeances(etat,maintenantMs);
    if(etat.file.length){
      var c=etat.file.shift();
      return finTour(etat,R(c.type,c.mult,{rafale:!!c.rafale,explosionRapide:c.type==='explosionRapide'}));
    }
    if(def.tour)return def.tour(etat,tirage,maintenantMs,def);
    if(def.chemiseCadence&&etat.attaques%def.chemiseCadence===0){
      etat.attaques+=1;
      etat.depuisSauterelles+=1;
      etat.chemises+=1;
      return SA('chemise',{desactive:def.ordre[etat.chemises-1]||null,nouvelle:etat.chemises<=def.ordre.length});
    }
    var enParalysie=etat.paralyseJusqua>maintenantMs;
    var type=def.tirer(etat,tirage,maintenantMs);
    if(enParalysie&&type==='paralysie')type='base';
    etat.attaques+=1;
    if(type!=='paralysie')etat.depuisParalysie+=1;
    if(enParalysie&&etat.paralysieAttaquesRestantes>0){
      etat.paralysieAttaquesRestantes-=1;
      if(etat.paralysieAttaquesRestantes<=0)etat.paralyseJusqua=maintenantMs;
    }
    var rep=R(type,type==='puissante'?def.multPuissante:1,{});
    if(!def.croissance)rep.multDegats*=1+etat.attaques/100;
    if(def.croissance){
      rep.croissance=def.croissance(etat);
      rep.multDegats*=rep.croissance;
      rep.invincibleDebut=!!def.invincible&&etat.attaques===1&&etat.anneau==null;
    }
    if(type==='paralysie'){
      etat.depuisParalysie=0;
      etat.paralysieDebut=maintenantMs;
      etat.paralyseJusqua=maintenantMs+def.paralysieMs;
      etat.paralysieAttaquesRestantes=def.paralysieAttaques;
      rep.paralyse=true;rep.paralyseMs=def.paralysieMs;
      rep.sansAttaque=true;rep.multDegats=0;   /* lu dans le jeu : le tour de la paralysie n'attaque pas */
    }
    if(def.rafaleCoups){
      if(type==='sauterelles'){
        etat.depuisSauterelles=0;
        var pas=Math.round(cadence(etat)*def.rafaleFacteurCadence);
        for(var i=0;i<def.rafaleCoups;i+=1)etat.file.push({type:'sauterelle',mult:def.multRafale*(1+etat.attaques/100),apres:pas,rafale:true});
        rep.sansAttaque=true;rep.multDegats=0;   /* le tour de lancement n'attaque pas (jakeAI : skipturn) ; les 10 coups suivent à attackRate x 0,15 */
        finTour(etat,rep);
      }else etat.depuisSauterelles+=1;
    }
    if(type==='saignement'){
      etat.saignements+=1;
      rep.saigne=true;
    }
    if(type==='sporesBras'){
      debuffAttaque(etat,def.facteurBras,def.sporesBrasMs,maintenantMs);
      etat.affaibliJusqua=maintenantMs+def.sporesBrasMs;
      rep.spores=true;rep.sansAttaque=true;rep.multDegats=0;
    }
    if(type==='sporesEnergie'){
      etat.defenseFacteur=1/def.facteurEnergie;
      etat.defenseFin=maintenantMs+def.sporesEnergieMs;
      etat.draineJusqua=etat.defenseFin;
      rep.draine=true;rep.sansAttaque=true;rep.multDegats=0;
    }
    return rep;
  }

  /* Régénération par seconde retirée au joueur par le saignement (PV/s absolus). */
  function regenRetireeSaignement(id,etat){
    var def=TITANS[String(id||'')];
    return def&&def.saignementPVParSeconde&&etat?def.saignementPVParSeconde*etat.saignements:0;
  }

  /* Facteur de défense du joueur posé par le titan (debuffDefense) : 1 ou 2/3. À mettre dans la Robustesse effective ET dans le dernier paramètre de degatsEnnemiAdventureIdleV2_ (qui divise le dégât par lui). */
  function facteurDefenseJoueur(id,etat,maintenantMs){
    if(!etat)return 1;
    echeances(etat,maintenantMs);
    return etat.defenseFin>0?(etat.defenseFacteur||1):1;
  }

  /* Multiplicateur appliqué aux dégâts du joueur : 0 (titan invincible, bouclier du Traître), /3 (armure de métal de The Beast), facteur d'attaque posé par le titan (bras lourds, Amalgamate : capacités MANUELLES seulement, `idle` vrai pour le coup de l'Idle Mode qui l'ignore). */
  function multDegatsJoueur(id,etat,maintenantMs,idle){
    var def=TITANS[String(id||'')];
    if(!etat)return 1;
    if(def&&def.invincible&&etat.anneau==null&&etat.attaques>=1)return 0;
    if(etat.invincible||etat.bouclierCoups>0)return 0;
    var m=1;
    if(String(id)==='t6'&&etat.aura===3)m/=3;
    if(!idle){echeances(etat,maintenantMs);if(etat.offenseFacteur&&etat.offenseFacteur!==1)m*=etat.offenseFacteur;}
    return m;
  }

  /* Après un coup du joueur (attaqueId : 1 Idle, 2 riposte de Parade, 3 Attaque, 4 Forte, 5 Perçante, 6 Ultime) : renvoie {explosion, reflete, nerdAnnule, bouclierConsomme}. */
  function apresCoupJoueur(id,etat,attaqueId,degats){
    var out={explosion:false,reflete:0,nerdAnnule:false,bouclierConsomme:false,mult:0};
    if(!etat)return out;
    var sid=String(id||'');
    if(etat.bouclierCoups>0){etat.bouclierCoups-=1;out.bouclierConsomme=true;}
    if(sid==='t5'&&etat.boucle){
      var ok=etat.consigne===0?true:(etat.dit?attaqueId===etat.consigne:attaqueId!==etat.consigne);
      if(!ok){out.explosion=true;out.mult=1000;out.dit=!!etat.dit;}
      else{etat.consigne=0;etat.boucle=false;}
    }
    if(sid==='t6'&&etat.aura===5)out.reflete=Math.max(0,Number(degats)||0)/50;
    if(sid==='nerd'&&attaqueId===6&&etat.nerdHacks>0){etat.gc-=8;etat.nerdHacks-=1;out.nerdAnnule=true;}
    return out;
  }

  /* Effets sur le joueur qui durent : régénération inversée (aura 6), régénération de l'ennemi x5 (aura 1), cooldowns plus lents (aura 4 : x2 ; genou brisé : x3), Idle Mode à moitié vitesse (aura 4). */
  function regenJoueurInversee(etat){return !!etat&&etat.aura===6;}
  function facteurRegenEnnemi(etat){return etat&&etat.aura===1?5:1;}
  function dilatationCooldowns(etat){return !etat?1:(etat.aura===4?2:(etat.genou?3:1));}
  function facteurIntervalleIdle(etat){return etat&&etat.aura===4?2:1;}

  /* Capacité du joueur désactivée par Jake ou AMALGAMATE (jusqu'à la fin du combat). */
  function competenceDesactivee(id,etat,competence){
    var def=TITANS[String(id||'')];
    return !!(def&&def.ordre&&etat&&def.ordre.slice(0,etat.chemises).indexOf(String(competence||''))>=0);
  }

  function joueurParalyse(etat,maintenantMs){return !!etat&&etat.paralyseJusqua>maintenantMs;}

  /* Fin de paralysie : durée réellement subie, pour repousser d'autant les cooldowns (« met en pause les cooldowns ») et le minuteur de l'Idle. Renvoie 0 tant qu'elle dure. */
  function finParalysie(etat,maintenantMs){
    if(!etat||!etat.paralysieDebut||etat.paralyseJusqua>maintenantMs)return 0;
    var duree=Math.max(0,etat.paralyseJusqua-etat.paralysieDebut);
    etat.paralysieDebut=0;
    return duree;
  }

  racine.SorealTitanComportementsV1={
    possede:function(id){return !!TITANS[String(id||'')];},
    note:function(id){var d=TITANS[String(id||'')];return d?d.note:'';},
    neuf:neuf,niveauDeDifficulte:niveauDeDifficulte,attaqueTitan:attaqueTitan,multDegatsJoueur:multDegatsJoueur,facteurDefenseJoueur:facteurDefenseJoueur,apresCoupJoueur:apresCoupJoueur,
    regenRetireeSaignement:regenRetireeSaignement,regenJoueurInversee:regenJoueurInversee,facteurRegenEnnemi:facteurRegenEnnemi,dilatationCooldowns:dilatationCooldowns,facteurIntervalleIdle:facteurIntervalleIdle,
    competenceDesactivee:competenceDesactivee,joueurParalyse:joueurParalyse,finParalysie:finParalysie
  };
})(typeof window!=='undefined'?window:globalThis);
