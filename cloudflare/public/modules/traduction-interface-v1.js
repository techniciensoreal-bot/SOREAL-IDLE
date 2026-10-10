/*
 * SOREAL IDLE — interface en français (Norman, 2026-10-03 : « traduits entièrement en français ce qu'il reste », avec choix Français / English dans les Réglages).
 *
 * Les libellés de l'interface (noms de menus, statistiques, compétences, termes du jeu mêlés aux phrases) sont écrits en anglais dans le code : au lieu de réécrire des centaines de
 * lignes (et de casser ce que d'autres écrans comparent), ce module les remplace dans le texte AFFICHÉ, quand la langue choisie est le français. Mots entiers uniquement, expressions les
 * plus longues d'abord ; jamais dans les champs de saisie, ni dans le chat et le bandeau « En direct » (texte des joueurs), ni dans l'administration.
 * En « English », rien n'est remplacé : on voit les libellés d'origine.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TRADUCTION_INTERFACE_V1__)return;
  window.__SOREAL_IDLE_TRADUCTION_INTERFACE_V1__=true;

  /* Expressions (anglais -> français), de la plus longue à la plus courte. */
  var TERMES=[
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
    ['Energy','Énergie'],['Magic','Magie'],['Toughness','Endurance'],['Power','Puissance'],['Cap','Plafond'],['Bars','Barres'],['Speed','Vitesse']
  ];

  var REGLES=TERMES.map(function(t){
    var motif=t[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return [new RegExp('(?<![\\p{L}\\p{N}])'+motif+'(?![\\p{L}\\p{N}])','gu'),t[1]];
  });
  var TEST=new RegExp(TERMES.map(function(t){return t[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|'));

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
    var s=texte;
    for(var i=0;i<REGLES.length;i++)s=s.replace(REGLES[i][0],REGLES[i][1]);
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
    /* Textes dans les attributs d'aide (infobulles) : title seulement. */
    var avecTitre=cible.querySelectorAll?cible.querySelectorAll('[title]'):[];
    for(var j=0;j<avecTitre.length;j++){
      var el=avecTitre[j];
      if(exclu_(el))continue;
      var a=el.getAttribute('title'),b=traduireTexte_(a);
      if(b!==a)el.setAttribute('title',b);
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
        for(var j=0;j<m.addedNodes.length;j++){
          var n=m.addedNodes[j];
          if(n.nodeType===1||n.nodeType===3)file_(n);
        }
      }
    }).observe(app,{childList:true,subtree:true,characterData:true});
  }

  window.__traduireInterfaceIdleV1__=function(){traduireNoeud_(document.getElementById('app')||document.body);};
  window.__SOREAL_IDLE_TRADUCTION_TEXTE_V1__=traduireTexte_;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_);else demarrer_();
})();
