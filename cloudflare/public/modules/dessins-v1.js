/*
 * SOREAL IDLE — les émojis sont remplacés par des DESSINS (Norman, 2026-10-10 : « il faut se détacher des émojis et faire des dessins comme pour le coffre »).
 * Un registre de dessins SVG originaux (contour sombre, bois, cuir, cuivre et acier comme le Bagage), posés en image de fond d'une pastille <i class="dsn-v1 dsn-e-XXXX">. Tout texte affiché qui contient un émoji
 * du registre le voit remplacé, page par page, sans toucher au texte d'origine du code : un émoji qui n'a pas encore son dessin reste un émoji. Même mécanique que la traduction anglaise : l'observateur
 * traite les nœuds ajoutés avant l'affichage suivant ; jamais dans les champs de saisie, ni dans les messages et pseudos du chat, ni dans l'administration.
 *
 *   window.__SOREAL_IDLE_DESSINS_V1__ = { registre, remplacer(racine), actif }
 * Le dictionnaire des dessins est généré depuis scratchpad/dessins_src.py (voir l'historique) : une seule table émoji -> SVG.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DESSINS_V1__)return;

  var REGISTRE={};
  if(!Object.keys(REGISTRE).length){window.__SOREAL_IDLE_DESSINS_V1__={registre:REGISTRE,remplacer:function(){},actif:false};return;}

  function code_(e){var h=[];for(var i=0;i<e.length;i+=1){var c=e.codePointAt(i);if(c>0xFFFF)i+=1;if(c!==0xFE0F)h.push(c.toString(16));}return h.join('-');}
  function echapper_(s){return s.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');}

  /* Feuille de style : une règle par dessin (image SVG en data-URI), plus la pastille. */
  var cles=Object.keys(REGISTRE).sort(function(a,b){return b.length-a.length;});
  var css='.dsn-v1{display:inline-block;width:1.25em;height:1.25em;vertical-align:-.26em;margin:0 .08em;background-size:contain;background-repeat:no-repeat;background-position:center;filter:drop-shadow(0 1px 0 rgba(0,0,0,.5));font-style:normal}';
  var motifs=[];
  cles.forEach(function(e){
    css+='.dsn-e-'+code_(e)+'{background-image:url("data:image/svg+xml,'+encodeURIComponent(REGISTRE[e])+'")}';
    motifs.push(echapper_(e)+'\\uFE0F?');
  });
  var style=document.createElement('style');
  style.id='soreal-idle-dessins-v1';
  style.textContent=css;
  document.head.appendChild(style);
  var RE=new RegExp(motifs.join('|'),'g');
  var TEST=new RegExp(motifs.join('|'));

  function exclu_(noeud){
    var el=noeud&&noeud.nodeType===1?noeud:(noeud&&noeud.parentElement);
    if(!el)return true;
    var tag=el.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='INPUT'||tag==='NOSCRIPT'||tag==='OPTION'||tag==='SELECT'||tag==='svg'||tag==='TITLE')return true;
    if(el.isContentEditable)return true;
    return Boolean(el.closest('.sic-txt,.sic-nom,.dsn-v1,[data-sans-dessin],.soreal-idle-page-root-v28[data-menu="admin"]'));
  }

  /* Un texte réécrit en boucle par le jeu (compteurs) ne doit pas être redessiné à chaque image : après 4 remplacements en 2 s, son élément garde ses émojis (data-sans-dessin). */
  var suivi=new WeakMap();
  function remplacerNoeud_(n){
    var val=n.nodeValue;
    if(!val||!TEST.test(val)||exclu_(n))return;
    var pe=n.parentElement;
    if(pe){
      var maintenant=Date.now(),rec=suivi.get(pe);
      if(!rec||maintenant-rec.t>2000){rec={n:0,t:maintenant};suivi.set(pe,rec);}
      rec.n+=1;
      if(rec.n>=4){pe.setAttribute('data-sans-dessin','');return;}
    }
    var frag=document.createDocumentFragment(),dernier=0,m;
    RE.lastIndex=0;
    while((m=RE.exec(val))!==null){
      if(m.index>dernier)frag.appendChild(document.createTextNode(val.slice(dernier,m.index)));
      var i=document.createElement('i');
      var emo=m[0].replace(/\uFE0F/g,'');
      i.className='dsn-v1 dsn-e-'+code_(emo);
      i.setAttribute('role','img');
      i.setAttribute('aria-label',emo);
      frag.appendChild(i);
      dernier=m.index+m[0].length;
    }
    if(dernier<val.length)frag.appendChild(document.createTextNode(val.slice(dernier)));
    var p=n.parentNode;
    if(p){
      var seul=p.nodeType===1&&p.childNodes.length===1;
      p.replaceChild(frag,n);
      /* Mémo pour le garde d'écriture (perf-texte-v1.js) : le texte demandé est déjà celui qui est affiché, sous forme de dessins. */
      if(seul){p.__dsnTexte=val;p.__dsnHtml=p.innerHTML;}
    }
  }

  function remplacer_(racine){
    if(!racine)return;
    if(racine.nodeType===3){remplacerNoeud_(racine);return;}
    if(racine.nodeType!==1||exclu_(racine))return;
    var walker=document.createTreeWalker(racine,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.nodeValue&&TEST.test(n.nodeValue)&&!exclu_(n)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
    var liste=[],n;
    while((n=walker.nextNode()))liste.push(n);
    for(var k=0;k<liste.length;k+=1)remplacerNoeud_(liste[k]);
  }

  /* Observateur : les nœuds ajoutés sont traités dans le rappel (avant l'affichage suivant) ; les textes réécrits (characterData) aussi. */
  var observateur=null;
  function observer_(){
    if(observateur||!document.body)return;
    observateur=new MutationObserver(function(mutations){
      var vus=new Set();
      for(var i=0;i<mutations.length;i+=1){
        var m=mutations[i];
        if(m.type==='characterData'){vus.add(m.target);continue;}
        for(var j=0;j<m.addedNodes.length;j+=1){var a=m.addedNodes[j];if(a.nodeType===1||a.nodeType===3)vus.add(a);}
      }
      vus.forEach(function(n){if(n.isConnected!==false)remplacer_(n);});
    });
    observateur.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  function demarrer_(){
    remplacer_(document.body);
    observer_();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_);else demarrer_();
  window.__SOREAL_IDLE_DESSINS_V1__={registre:REGISTRE,remplacer:remplacer_,actif:true};
})();
