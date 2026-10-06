/*
 * SOREAL IDLE — interface en anglais (Norman, 2026-10-05 : « pour le mode anglais, je veux que tu remettes l'intégralité des mots en anglais ; on doit pouvoir passer du français à l'anglais via le menu, et inversement »).
 *
 * Le code du jeu écrit ses textes en français (et certains libellés en anglais, traduits en français par traduction-interface-v1.js quand la langue est « Français »). En « English », ce module
 * remplace dans le texte AFFICHÉ chaque morceau de français connu par son anglais, d'après le dictionnaire /modules/traduction-anglais-dict-v1.json (tous les textes du code, extraits morceau
 * par morceau : un texte assemblé par le code à partir de plusieurs morceaux et de nombres est donc traduit morceau par morceau, les nombres restent à leur place). Le serveur, lui, renvoie déjà
 * les noms (objets, boss, atouts…) en anglais d'origine quand la langue est « en » (idle-traductions-v1.js).
 *
 * Réversible : le texte d'origine de chaque nœud traduit est gardé ; repasser en « Français » le restitue immédiatement. Jamais dans les champs de saisie, ni dans les messages et pseudos du chat,
 * ni dans l'administration. Mots entiers uniquement ; les morceaux les plus longs d'abord.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__)return;

  var CLE_LANGUE='soreal_idle_langue_v1';
  var URL_DICO='/modules/traduction-anglais-dict-v1.json?v=120';
  var ATTRIBUTS=['title','placeholder','aria-label','alt'];

  function langue_(){
    try{return localStorage.getItem(CLE_LANGUE)==='en'?'en':'fr';}catch(_e){return 'fr';}
  }

  var exact=null;      /* Map texte normalisé -> anglais (nœud entier) */
  var regle=null;      /* RegExp de tous les morceaux, du plus long au plus court */
  var table=null;      /* Map morceau normalisé -> anglais */
  var amorces=null;    /* Set des premiers mots, pour écarter vite les textes sans français connu */
  var charge=false,enCharge=false;
  var cache=new Map();
  var originauxTexte=new WeakMap();
  var originauxAttr=new WeakMap();

  function norme_(s){
    return String(s).replace(/[  ]/g,' ').replace(/[’‘]/g,"'");
  }
  function echapper_(s){return s.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');}
  function premierMot_(s){
    var m=/[\p{L}\p{N}]+/u.exec(s);
    return m?m[0].toLowerCase():'';
  }

  function compiler_(dico){
    exact=new Map();
    table=new Map();
    amorces=new Set();
    var cles=Object.keys(dico);
    cles.sort(function(a,b){return b.length-a.length;});
    var motifs=[];
    for(var i=0;i<cles.length;i++){
      var fr=norme_(cles[i]),en=dico[cles[i]];
      if(!fr||typeof en!=='string'||en===cles[i])continue;
      if(!table.has(fr))table.set(fr,en);
      exact.set(fr,en);
      amorces.add(premierMot_(fr));
      var debut=/^[\p{L}\p{N}]/u.test(fr)?'(?<![\\p{L}\\p{N}])':'';
      var fin=/[\p{L}\p{N}]$/u.test(fr)?'(?![\\p{L}\\p{N}])':'';
      motifs.push(debut+echapper_(fr)+fin);
    }
    regle=motifs.length?new RegExp(motifs.join('|'),'gu'):null;
    cache.clear();
  }

  function traduireTexte_(texte){
    if(!regle||!texte)return texte;
    var n=norme_(texte);
    var cle=n.trim();
    if(cle.length<2||!/\p{L}/u.test(cle))return texte;
    if(cache.has(texte))return cache.get(texte);
    var res=texte;
    var tout=exact.get(cle);
    if(tout!==undefined){
      var m=/^(\s*)([\s\S]*?)(\s*)$/.exec(texte);
      res=m[1]+tout+m[3];
    }else{
      /* Texte sans aucun premier mot connu : inutile de lancer la grande expression. */
      var utile=false,re=/[\p{L}\p{N}]+/gu,mot;
      while((mot=re.exec(n))){if(amorces.has(mot[0].toLowerCase())){utile=true;break;}}
      if(utile){
        regle.lastIndex=0;
        res=n.replace(regle,function(trouve){var t=table.get(trouve);return t===undefined?trouve:t;});
        if(res===n)res=texte;
      }
    }
    if(cache.size>4000)cache.clear();
    cache.set(texte,res);
    return res;
  }

  function exclu_(noeud){
    var el=noeud&&noeud.nodeType===1?noeud:(noeud&&noeud.parentElement);
    if(!el)return true;
    var tag=el.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='INPUT'||tag==='NOSCRIPT')return true;
    if(el.isContentEditable)return true;
    return Boolean(el.closest('.sic-txt,.sic-nom,[data-sans-traduction],.soreal-idle-page-root-v28[data-menu="admin"]'));
  }

  function traduireNoeudTexte_(n){
    var val=n.nodeValue;
    var orig=originauxTexte.get(n);
    /* Le code a réécrit le nœud (texte français neuf) : on repart de ce texte ; sinon on ne retraduit pas notre propre anglais. */
    if(orig&&orig.anglais===val)return;
    var tr=traduireTexte_(val);
    if(tr!==val){
      originauxTexte.set(n,{francais:val,anglais:tr});
      n.nodeValue=tr;
    }else if(orig)originauxTexte.delete(n);
  }

  function traduireAttributs_(el){
    for(var i=0;i<ATTRIBUTS.length;i++){
      var a=ATTRIBUTS[i];
      if(!el.hasAttribute||!el.hasAttribute(a))continue;
      var v=el.getAttribute(a);
      var mem=originauxAttr.get(el);
      if(mem&&mem[a]&&mem[a].anglais===v)continue;
      var t=traduireTexte_(v);
      if(t!==v){
        if(!mem){mem={};originauxAttr.set(el,mem);}
        mem[a]={francais:v,anglais:t};
        el.setAttribute(a,t);
      }
    }
  }

  function traduireArbre_(racine){
    if(!racine||langue_()!=='en'||!regle)return;
    if(racine.nodeType===3){if(!exclu_(racine))traduireNoeudTexte_(racine);return;}
    if(racine.nodeType!==1||exclu_(racine))return;
    var marcheur=document.createTreeWalker(racine,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){return exclu_(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}
    });
    var n;
    while((n=marcheur.nextNode()))traduireNoeudTexte_(n);
    var avecAttr=racine.querySelectorAll('[title],[placeholder],[aria-label],[alt]');
    for(var j=0;j<avecAttr.length;j++)if(!exclu_(avecAttr[j]))traduireAttributs_(avecAttr[j]);
    traduireAttributs_(racine);
  }

  /* Retour au français : chaque nœud traduit retrouve son texte d'origine. */
  function restaurer_(){
    var racine=document.body;
    if(!racine)return;
    var marcheur=document.createTreeWalker(racine,NodeFilter.SHOW_TEXT,null);
    var n;
    while((n=marcheur.nextNode())){
      var o=originauxTexte.get(n);
      if(o&&n.nodeValue===o.anglais)n.nodeValue=o.francais;
      if(o)originauxTexte.delete(n);
    }
    var els=racine.querySelectorAll('[title],[placeholder],[aria-label],[alt]');
    for(var i=0;i<els.length;i++){
      var mem=originauxAttr.get(els[i]);
      if(!mem)continue;
      for(var a in mem)if(els[i].getAttribute(a)===mem[a].anglais)els[i].setAttribute(a,mem[a].francais);
      originauxAttr.delete(els[i]);
    }
    if(titreFrancais!==null){document.title=titreFrancais;titreFrancais=null;}
    cache.clear();
  }

  var titreFrancais=null;
  function titre_(){
    if(langue_()!=='en'||!regle)return;
    var t=document.title;
    var tr=traduireTexte_(t);
    if(tr!==t){if(titreFrancais===null)titreFrancais=t;document.title=tr;}
  }

  /* Traduit tout de suite, dans le rappel de l'observateur (avant l'affichage suivant) : un texte réécrit par le jeu ne passe jamais à l'écran en français. */
  var observateur=null;
  function observer_(){
    if(observateur)return;
    var racine=document.body;
    if(!racine)return;
    observateur=new MutationObserver(function(mutations){
      if(langue_()!=='en')return;
      var vus=new Set();
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        if(m.type==='characterData'||m.type==='attributes'){vus.add(m.target);continue;}
        for(var j=0;j<m.addedNodes.length;j++){
          var n=m.addedNodes[j];
          if(n.nodeType===1||n.nodeType===3)vus.add(n);
        }
      }
      vus.forEach(function(n){if(n.isConnected!==false)traduireArbre_(n);});
    });
    observateur.observe(racine,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRIBUTS});
  }

  /* Messages natifs du navigateur (alert, confirm, prompt) : traduits eux aussi. */
  function brancherDialogues_(){
    ['alert','confirm','prompt'].forEach(function(nom){
      var orig=window[nom];
      if(typeof orig!=='function'||orig.__angl)return;
      var enveloppe=function(msg){
        var a=arguments;
        if(langue_()==='en'&&regle&&typeof msg==='string'){
          a=Array.prototype.slice.call(arguments);
          a[0]=traduireTexte_(msg);
        }
        return orig.apply(window,a);
      };
      enveloppe.__angl=true;
      window[nom]=enveloppe;
    });
  }

  function charger_(){
    if(charge||enCharge)return;
    enCharge=true;
    fetch(URL_DICO,{cache:'force-cache'}).then(function(r){return r.json();}).then(function(d){
      compiler_(d);
      charge=true;enCharge=false;
      observer_();
      traduireArbre_(document.body);
      titre_();
    }).catch(function(){enCharge=false;});
  }

  /* Appelé par le menu Réglages quand la langue change. */
  window.__SOREAL_IDLE_LANGUE_CHANGEE_V1__=function(choix){
    if(choix==='en'){
      if(charge){observer_();traduireArbre_(document.body);titre_();}else charger_();
    }else restaurer_();
  };

  window.__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__={
    traduire:traduireTexte_,
    charger:function(d){compiler_(d);charge=true;},
    actif:function(){return langue_()==='en'&&charge;}
  };

  brancherDialogues_();
  function demarrer_(){if(langue_()==='en')charger_();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_);else demarrer_();
})();
