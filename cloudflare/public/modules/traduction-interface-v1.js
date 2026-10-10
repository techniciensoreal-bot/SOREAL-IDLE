/*
 * SOREAL IDLE — interface en français (Norman, 2026-10-03 : « traduits entièrement en français ce qu'il reste », avec choix Français / English dans les Réglages).
 *
 * Les libellés de l'interface (noms de menus, statistiques, compétences, termes du jeu mêlés aux phrases) sont écrits en anglais dans le code : au lieu de réécrire des centaines de
 * lignes (et de casser ce que d'autres écrans comparent), ce module les remplace dans le texte AFFICHÉ, quand la langue choisie est le français. Mots entiers uniquement, expressions les
 * plus longues d'abord ; jamais dans les champs de saisie, ni dans le chat et le bandeau « En direct » (texte des joueurs), ni dans l'administration.
 * En « English », rien n'est remplacé : on voit les libellés d'origine.
 *
 * Audit du 2026-10-10 (Norman : « il y a encore écrit des "Number" dans certaines descriptions ») : NUMBER / Number sont traduits (NOMBRE / Nombre, comme le reste du jeu) ; les noms propres du jeu
 * d'origine (objets « A Number », « The Number 7 », sorts « Blood NUMBER Boost », « Iron Pill », barbes, fruits Mayo…) sont PROTÉGÉS : ils ne passent jamais par les règles ci-dessous. Les noms qui
 * étaient devenus mi-anglais mi-français (« Reverse Barbe », « Fruit of Puissance α », « No Machine temporelle Challenge »…) sont soit protégés, soit traduits en entier.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TRADUCTION_INTERFACE_V1__)return;
  window.__SOREAL_IDLE_TRADUCTION_INTERFACE_V1__=true;

  /* Noms propres du jeu d'origine : jamais remplacés (mis de côté sous un repère, puis rétablis). */
  var B_='(?<![\\p{L}\\p{N}])',E_='(?![\\p{L}\\p{N}])';
  var PROTEGES=[
    'A Number','The Number 7','Number Set','Numerical (?:Head|Chest|Legs|Boots)','Blood NUMBER Boost','Iron Pill','Blood Spaghetti','Counterfeit Gold',
    'Fu Manchu','Neckbeard','Reverse Beard','Beard Cage','LadyBeard','BEARd','Golden Beard',
    'Fruit of (?:Angry Mayo|Sad Mayo|Moldy Mayo|Ayyy LMayo|Cinco De Mayo|Pretty Mayo)'
  ].map(function(m){return new RegExp(B_+m+E_,'gu');});
  var ATTRIBUTS=['title','placeholder','aria-label'];
  var REPERE_DEBUT='\uE000',REPERE_FIN='\uE001';

  /* Expressions (anglais -> français), de la plus longue à la plus courte. */
  var TERMES=[
    /* Noms composés du jeu (tournures anglaises entières, avant les mots seuls) : piratages, mineurs, fruits, défis. */
    ['Attack/Defense Hack','Piratage Attaque/Défense'],['Adventure Hack','Piratage d’Aventure'],['Time Machine Hack','Piratage de la Machine temporelle'],['Drop Chance Hack','Piratage de Chance de drop'],
    ['Augment Speed Hack','Piratage de Vitesse des Augments'],['Energy NGU Speed Hack','Piratage de Vitesse des NGU d’Énergie'],['Magic NGU Speed Hack','Piratage de Vitesse des NGU de Magie'],
    ['Blood Hack','Piratage du Blood'],['QP Hack','Piratage de QP'],['Daycare Hack','Piratage de la Garderie'],['EXP Hack','Piratage d’EXP'],['Number Hack','Piratage du Nombre'],['PP Hack','Piratage de PP'],
    ['Hack Hack','Piratage du Piratage'],['Wish Hack','Piratage des Souhaits'],
    ['Time Machine Speed','Vitesse de la Machine temporelle'],['Energy NGU Speed','Vitesse des NGU d’Énergie'],['Magic NGU Speed','Vitesse des NGU de Magie'],['Adventure Stats','Stats d’Aventure'],
    ['Gold Production','Production d’Or'],['Blood Gain','Gain de Blood'],['QP Gain','Gain de QP'],['Attack/Defense','Attaque/Défense'],['Adventure Attack','Attaque d’Aventure'],['Adventure Defense','Défense d’Aventure'],
    ['Drop Chance Digger','Mineur de Chance de drop'],['Wandoos Digger','Mineur de Wandoos'],['Stat Digger','Mineur de Stats'],['Adventure Digger','Mineur d’Aventure'],['Energy NGU Digger','Mineur de NGU d’Énergie'],
    ['Magic NGU Digger','Mineur de NGU de Magie'],['Energy Beard Digger','Mineur de Barbe d’Énergie'],['Magic Beard Digger','Mineur de Barbe de Magie'],['PP Digger','Mineur de PP'],['Daycare Digger','Mineur de Garderie'],
    ['Blood Digger','Mineur de Blood'],['EXP Digger','Mineur d’EXP'],
    ['Fruit of Power α','Fruit de Puissance α'],['Fruit of Power β','Fruit de Puissance β'],['Fruit of Power δ','Fruit de Puissance δ'],['Fruit of MacGuffins α','Fruit de MacGuffins α'],['Fruit of MacGuffins β','Fruit de MacGuffins β'],
    ['Fruit of MacGuffin α','Fruit de MacGuffin α'],['Fruit of MacGuffin β','Fruit de MacGuffin β'],['Fruit of Gold','Fruit d’Or'],['Fruit of Adventure','Fruit d’Aventure'],['Fruit of Knowledge','Fruit de Connaissance'],
    ['Fruit of Luck','Fruit de Chance'],['Fruit of Arbitrariness','Fruit d’Arbitraire'],['Fruit of Numbers','Fruit des Nombres'],['Fruit of Rage','Fruit de Rage'],['Fruit of Quirks','Fruit des Manies'],
    ['Basic Challenge','Défi de base'],['No Augmentations Challenge','Défi sans Augmentations'],['No Augs Challenge','Défi sans Augmentations'],['24 Hour Challenge','Défi des 24 heures'],['100 Levels Challenge','Défi des 100 niveaux'],
    ['No Equipment Challenge','Défi sans équipement'],['Troll Challenge','Défi Troll'],['No Rebirth Challenge','Défi sans Renaissance'],['Laser Sword Challenge','Défi Sabre laser'],['Blind Challenge','Défi Aveugle'],
    ['No NGU Challenge','Défi sans NGU'],['No Time Machine Challenge','Défi sans Machine temporelle'],['Player Portraits','Portraits du joueur'],['Auto-Activate','Activation auto'],
    /* Genre de « Renaissance » (féminin) : les textes écrits « le Rebirth », « un Rebirth »… */
    ['du prochain Rebirth','de la prochaine Renaissance'],['du dernier Rebirth','de la dernière Renaissance'],['au prochain Rebirth','à la prochaine Renaissance'],['au dernier Rebirth','à la dernière Renaissance'],
    ['le prochain Rebirth','la prochaine Renaissance'],['le dernier Rebirth','la dernière Renaissance'],['prochain Rebirth','prochaine Renaissance'],['dernier Rebirth','dernière Renaissance'],
    ['au Rebirth','à la Renaissance'],['du Rebirth','de la Renaissance'],['un Rebirth','une Renaissance'],['le Rebirth','la Renaissance'],['ce Rebirth','cette Renaissance'],['ton Rebirth','ta Renaissance'],['Rebirths','Renaissances'],
    ['Rebirth réussi','Renaissance réussie'],['A Macguffin Slot!','Un emplacement de MacGuffin !'],['Fruit of Power Beta','Fruit de Puissance Bêta'],['Beards of Power','Barbes de Puissance'],['Player Stat Boosts','Boosts de stats du joueur'],
    ['Max Health','PV max'],['Max HP','PV max'],['Health Regen','Régén. des PV'],['HP Regen','Régén. des PV'],['Double tap','Double appui'],['double tap','double appui'],['Triple tap','Triple appui'],['triple tap','triple appui'],
    ['Clics/Tap','Clics/Appuis'],['le reset','la réinitialisation'],['TIER','PALIER'],['Inventory','Inventaire'],['Loot','Butin'],['slots','emplacements'],['slot','emplacement'],['Pomegranate','Grenade'],['Watermelon','Pastèque'],['Safe Zone','Zone sûre'],['Idle Mode','Mode Idle'],
    ['Boost power','Boost de puissance'],['Boost toughness','Boost d’endurance'],['Boost special','Boost spécial'],
    ['Advanced Training','Entraînement avancé'],['Basic Training','Entraînement de base'],['Fight Boss','Combat de boss'],['Money Pit','Trou sans fond'],
    ['Time Machine','Machine temporelle'],['Blood Magic','Magie du sang'],['Gold Diggers','Mineurs d’or'],['Gold Digger','Mineur d’or'],['Item Daycare','Garderie d’objets'],
    ['Sellout Shop','Boutique AP'],['Arbitrary Points','Points arbitraires'],['Settings','Réglages'],['Achievements','Succès'],['Questing','Quêtes'],['Challenges','Défis'],
    ['Energy Speed','Vitesse d’Énergie'],['Energy Power','Puissance d’Énergie'],['Energy Cap','Plafond d’Énergie'],['Energy Bars','Barres d’Énergie'],['Energy Bar','Barre d’Énergie'],
    ['Magic Speed','Vitesse de Magie'],['Magic Power','Puissance de Magie'],['Magic Cap','Plafond de Magie'],['Magic Bars','Barres de Magie'],['Magic Bar','Barre de Magie'],
    ['Resource 3 Power','Puissance de Ressource 3'],['Resource 3 Cap','Plafond de Ressource 3'],['Resource 3 Bars','Barres de Ressource 3'],['Resource 3','Ressource 3'],
    ['Drop Chance','Chance de drop'],['Gold Drops','Or des drops'],['Beard Speed','Vitesse des Barbes'],['NGU Speed','Vitesse des NGU'],['Seed Gain','Gain de graines'],
    ['Wish Speed','Vitesse des Souhaits'],['Hack Speed','Vitesse des Piratages'],['Wandoos Speed','Vitesse de Wandoos'],['Yggdrasil Yield','Rendement d’Yggdrasil'],
    ['Augment Speed','Vitesse des Augments'],['Quest Drops','Butin de quêtes'],['Move Cooldowns','Délais des compétences'],['Daycare Speed','Vitesse de la Garderie'],
    ['Hyper Regen','Hyper régénération'],['Beast Mode','Mode Bête'],['Mega Buff','Méga bonus'],['Oh Shit','Oh là là'],['Move 69','Technique 69'],['Paralyze','Paralysie'],
    ['Perks','Atouts'],['Perk','Atout'],['Quirks','Manies'],['Quirk','Manie'],['Wishes','Souhaits'],['Wish','Souhait'],['Hacks','Piratages'],['Hack','Piratage'],['Cards','Cartes'],
    ['Cooking','Cuisine'],['Beards','Barbes'],['Beard','Barbe'],['Shop','Boutique'],['Rebirth','Renaissance'],['Adventure','Aventure'],
    ['THE END','LA FIN'],['Sadistic','Sadique'],['Evil','Maléfique'],['Easy','Facile'],['Hard','Difficile'],
    ['Energy','Énergie'],['Magic','Magie'],['Toughness','Endurance'],['Power','Puissance'],['Cap','Plafond'],['Bars','Barres'],['Speed','Vitesse'],
    ['NUMBER','NOMBRE'],['Numbers','Nombres'],['Number','Nombre'],['Attack','Attaque'],['Defense','Défense'],['Upgrades','Améliorations'],['Upgrade','Amélioration'],['Gold','Or'],['Fight','Combattre'],
    ['Diggers','Mineurs'],['Digger','Mineur'],['Slots','Emplacements'],['Slot','Emplacement'],['Regen','Régén.'],['Tier','Palier'],['tier','palier'],['cap','plafond'],['Challenge','Défi'],
    ['perks','atouts'],['perk','atout'],['quirks','manies'],['quirk','manie'],['wishes','souhaits'],['wish','souhait'],['hacks','piratages'],['hack','piratage']
  ];

  var REGLES=TERMES.map(function(t){
    var motif=echapper_(t[0]);
    return [new RegExp('(?<![\\p{L}\\p{N}])'+motif+'(?![\\p{L}\\p{N}])','gu'),t[1]];
  });
  function echapper_(m){return m.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  var TEST=new RegExp(B_+'(?:'+TERMES.map(function(t){return echapper_(t[0]);}).join('|')+'|'+PROTEGES.map(function(r){return r.source.slice(B_.length,-E_.length);}).join('|')+')'+E_,'u');

  function langue_(){
    try{return localStorage.getItem('soreal_idle_langue_v1')==='en'?'en':'fr';}catch(_e){return 'fr';}
  }

  function exclu_(noeud){
    var el=noeud&&noeud.nodeType===1?noeud:(noeud&&noeud.parentElement);
    if(!el)return true;
    var tag=el.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='INPUT'||tag==='NOSCRIPT')return true;
    if(el.isContentEditable)return true;
    return Boolean(el.closest('[class*="sic-"],[class*="sif-"],[data-sans-traduction],.soreal-idle-page-root-v28[data-menu="admin"]'));
  }

  function traduireTexte_(texte){
    if(!TEST.test(texte))return texte;
    var s=texte.replace(/((?:Fruit of [^\n:;.,()]*?)|Pomegranate|Watermelon) Auto-Activate/g,'Activation auto : $1'),mis=[];
    /* Noms propres : mis de côté (repère unique par nom), rétablis après les règles. */
    for(var p=0;p<PROTEGES.length;p++){
      s=s.replace(PROTEGES[p],function(nom){mis.push(nom);return REPERE_DEBUT+String.fromCharCode(0xE100+mis.length-1)+REPERE_FIN;});
    }
    for(var i=0;i<REGLES.length;i++)s=s.replace(REGLES[i][0],REGLES[i][1]);
    if(mis.length)s=s.replace(new RegExp(REPERE_DEBUT+'([\uE100-\uE1FF])'+REPERE_FIN,'g'),function(_m,c){return mis[c.charCodeAt(0)-0xE100];});
    return s;
  }

  function traduireNoeud_(racine){
    if(!racine||langue_()!=='fr')return;
    if(exclu_(racine))return;
    var cible=racine.nodeType===3?null:racine;
    if(racine.nodeType===3){
      var v=racine.nodeValue,t=traduireTexte_(v);
      if(t!==v)racine.nodeValue=t;
      return;
    }
    var marcheur=document.createTreeWalker(cible,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){return exclu_(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}
    });
    var n;
    while((n=marcheur.nextNode())){
      var val=n.nodeValue,tr=traduireTexte_(val);
      if(tr!==val)n.nodeValue=tr;
    }
    /* Textes dans les attributs affichés (infobulle, texte de saisie, étiquette d'accessibilité), l'élément racine compris. */
    var avecAttr=cible.querySelectorAll?Array.prototype.slice.call(cible.querySelectorAll('[title],[placeholder],[aria-label]')):[];
    if(cible.getAttribute)avecAttr.unshift(cible);
    for(var j=0;j<avecAttr.length;j++)traduireAttributs_(avecAttr[j]);
  }

  function traduireAttributs_(el){
    if(!el||el.nodeType!==1||!el.getAttribute)return;
    if(exclu_(el)&&el.tagName!=='INPUT'&&el.tagName!=='TEXTAREA')return;
    if(el.closest&&el.closest('[class*="sic-"],[class*="sif-"],[data-sans-traduction]'))return;
    for(var k=0;k<ATTRIBUTS.length;k++){
      var a=el.getAttribute(ATTRIBUTS[k]);
      if(!a)continue;
      var b=traduireTexte_(a);
      if(b!==a)el.setAttribute(ATTRIBUTS[k],b);
    }
  }

  var attente=[];
  var planifie=false;
  function traiter_(){
    planifie=false;
    var liste=attente;attente=[];
    for(var i=0;i<liste.length;i++){
      if(liste[i].isConnected!==false)traduireNoeud_(liste[i]);
    }
  }
  function file_(noeud){
    attente.push(noeud);
    if(!planifie){planifie=true;requestAnimationFrame(traiter_);}
  }

  function demarrer_(){
    var app=document.getElementById('app')||document.body;
    traduireNoeud_(app);
    new MutationObserver(function(mutations){
      if(langue_()!=='fr')return;
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        if(m.type==='characterData'){file_(m.target);continue;}
        if(m.type==='attributes'){if(langue_()==='fr')traduireAttributs_(m.target);continue;}
        for(var j=0;j<m.addedNodes.length;j++){
          var n=m.addedNodes[j];
          if(n.nodeType===1||n.nodeType===3)file_(n);
        }
      }
    }).observe(app,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRIBUTS});
  }

  window.__traduireInterfaceIdleV1__=function(){traduireNoeud_(document.getElementById('app')||document.body);};
  window.__SOREAL_IDLE_TRADUCTION_TEXTE_V1__=traduireTexte_;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_);else demarrer_();
})();
