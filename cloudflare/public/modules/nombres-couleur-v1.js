/*
 * SOREAL IDLE — lettres des grands nombres en couleur (Norman, 2026-10-08 : « les lettres des chiffres, par exemple 155Dd, doivent être dans une couleur différente des chiffres, partout dans le jeu »).
 *
 * Le jeu écrit les grands nombres en texte (155Dd, 1.50K, 2.3T…). Ce module repère, dans le texte AFFICHÉ, ces nombres suivis de leur lettre d'unité (ou d'un exposant « E+139 ») et enveloppe la
 * lettre dans <span class="nb-suf">, que la feuille de style colore. Rien n'est changé dans les données ni dans les formats du jeu : seul l'affichage reçoit la couleur.
 *
 * Précautions :
 *  - seuls les textes COURTS et surtout numériques sont touchés (une phrase comme « Nécessite 5K niveaux… » n'est jamais découpée : elle reste traduisible d'un bloc) ;
 *  - jamais dans les champs de saisie, les zones éditables, les scripts, ni l'administration ;
 *  - quand le jeu réécrit le texte d'un nœud déjà traité, les morceaux ajoutés sont retirés puis refaits (aucun doublon) ;
 *  - les écritures sont regroupées à la prochaine image (requestAnimationFrame), sans jamais bloquer l'affichage.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_NOMBRES_COULEUR_V1__)return;

  var UNITES=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid','Sxd','Spd','Ocd','Nod','Vg','Uvg','Dvg','Tvg','Qavg','Qivg','Sxvg','Spvg','Ocvg','Novg','Tg'];
  UNITES.sort(function(a,b){return b.length-a.length;});
  /* chiffres, puis soit une unité, soit un exposant (E+139) ; jamais collé à une lettre ou un chiffre qui suit */
  var MOTIF='(\\d(?:[\\d.,]*\\d)?)((?:'+UNITES.join('|')+')|[eE][+\\-]?\\d+)(?![A-Za-z0-9])';
  var TEST=new RegExp(MOTIF);
  var LONGUEUR_MAX=48;
  var LETTRES_MAX=8;

  function exclu_(noeud){
    var el=noeud&&noeud.parentElement;
    if(!el)return true;
    var tag=el.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='INPUT'||tag==='SELECT'||tag==='OPTION'||tag==='NOSCRIPT')return true;
    if(el.isContentEditable)return true;
    return Boolean(el.closest('.nb-suf,[data-sans-couleur-nombre],.soreal-idle-page-root-v28[data-menu="admin"]'));
  }

  /* Un texte court dont les lettres sont presque toutes des unités (« 1.50K / 2M », « 10K Or ») : jamais une phrase. */
  function admissible_(texte){
    if(texte.length>LONGUEUR_MAX||!TEST.test(texte))return false;
    var lettres=texte.replace(new RegExp(MOTIF,'g'),' ').replace(/[^A-Za-zÀ-ÿ]/g,'');
    return lettres.length<=LETTRES_MAX;
  }

  var generes=new WeakMap();
  function retirerGeneres_(noeud){
    var info=generes.get(noeud);
    if(!info)return;
    info.ajoutes.forEach(function(n){if(n.parentNode)n.parentNode.removeChild(n);});
    generes.delete(noeud);
  }

  /* Clé de couleur d'une unité (une couleur par unité dans soreal-idle-itopod.css, [data-suf="Qa"]…) ; tout exposant (e+139) partage la clé « e ». */
  function cleSuffixe_(texte){return /^[eE]/.test(texte)?'e':texte;}

  function traiter_(noeud){
    if(!noeud||noeud.nodeType!==3||!noeud.parentNode)return;
    /* déjà traité et inchangé depuis : rien à refaire (jamais de perte de texte) */
    var deja=generes.get(noeud);
    if(deja&&noeud.nodeValue===deja.premier)return;
    /* le jeu vient de réécrire ce nœud : on retire d'abord ce qu'on avait ajouté après lui */
    retirerGeneres_(noeud);
    var texte=noeud.nodeValue;
    if(exclu_(noeud)||!admissible_(texte))return;
    var re=new RegExp(MOTIF,'g'),m,dernier=0,morceaux=[];
    while((m=re.exec(texte))){
      var finChiffres=m.index+m[1].length;
      morceaux.push({texte:texte.slice(dernier,finChiffres),suffixe:false});
      morceaux.push({texte:m[2],suffixe:true,cle:cleSuffixe_(m[2])});
      dernier=finChiffres+m[2].length;
    }
    if(!morceaux.length)return;
    if(dernier<texte.length)morceaux.push({texte:texte.slice(dernier),suffixe:false});
    /* le nœud d'origine garde le premier morceau (les références du jeu restent valides) */
    var parent=noeud.parentNode,apres=noeud.nextSibling,ajoutes=[];
    noeud.nodeValue=morceaux[0].texte;
    for(var i=1;i<morceaux.length;i++){
      var n;
      if(morceaux[i].suffixe){
        n=document.createElement('span');n.className='nb-suf';n.setAttribute('data-suf',morceaux[i].cle);n.textContent=morceaux[i].texte;
      }else{
        n=document.createTextNode(morceaux[i].texte);
      }
      parent.insertBefore(n,apres);
      ajoutes.push(n);
    }
    generes.set(noeud,{ajoutes:ajoutes,premier:morceaux[0].texte});
  }

  /*
   * Aucun clignotement (Norman, 2026-10-08 : « les lettres de couleur clignotent en blanc super vite ») : quand le jeu réécrit un nombre, le texte revient un instant sans couleur. Le traitement se fait donc
   * DANS le rappel de l'observateur (micro-tâche, toujours avant l'image suivante) et non à la prochaine image : le navigateur ne peint jamais le texte nu.
   */
  var observateur=null;
  function parcourir_(racine){
    if(!racine)return;
    if(racine.nodeType===3){traiter_(racine);return;}
    if(racine.nodeType!==1)return;
    var marcheur=document.createTreeWalker(racine,NodeFilter.SHOW_TEXT,null);
    var n,liste=[];
    while((n=marcheur.nextNode()))if(TEST.test(n.nodeValue))liste.push(n);
    liste.forEach(traiter_);
  }

  function demarrer_(){
    var app=document.getElementById('app')||document.body;
    parcourir_(app);
    observateur=new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        if(m.type==='characterData'){traiter_(m.target);continue;}
        for(var j=0;j<m.addedNodes.length;j++){
          var a=m.addedNodes[j];
          if(a.nodeType===1&&a.classList&&a.classList.contains('nb-suf'))continue;
          parcourir_(a);
        }
      }
      /* nos propres écritures ne doivent pas se rejouer */
      observateur.takeRecords();
    });
    observateur.observe(app,{childList:true,subtree:true,characterData:true});
  }

  window.__SOREAL_IDLE_NOMBRES_COULEUR_V1__={traiter:traiter_,admissible:admissible_,motif:MOTIF,cle:cleSuffixe_,unites:UNITES.slice()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_);else demarrer_();
})();
