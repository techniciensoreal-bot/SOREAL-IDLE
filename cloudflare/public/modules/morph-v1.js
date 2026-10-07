/*
 * SOREAL IDLE — rendu sur place (morph) : extrait de soreal-idle-ui.js le 2026-10-07 (docs/CHANTIER-NETTOYAGE.md, lot 2a), code déplacé SANS changement de comportement.
 * Aucune dépendance à l'état du jeu : seulement le DOM (document, Element). Le moteur compare un nouveau HTML à la page et ne touche que ce qui change.
 *
 *   window.__SOREAL_IDLE_MORPH_V1__ = { morpherHtml(element,html), installer(element) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MORPH_V1__)return;

  /*
   * Rendu SANS REMPLACER la page (Norman, 2026-10-07 : « ouvrir ou fermer le coffre redessine toute la page ; des sauts de page ; ça ne doit jamais se produire »).
   * Mesure : remplacer le contenu (innerHTML) détruit les images, le journal et tous les blocs au-dessus du clic ; ils reviennent plus petits puis regrandissent, la page
   * bouge de plusieurs centaines de pixels et clignote. Ici le nouveau HTML est comparé à la page : seuls les textes, attributs et blocs qui changent sont touchés,
   * tout le reste (images chargées, positions, défilements internes, animations) reste exactement en place. Même résultat final qu'un remplacement complet.
   */
  function morpherMemeNoeudIdleV1_(a,b){
    if(a.nodeType!==b.nodeType)return false;
    if(a.nodeType!==1)return true;
    return a.tagName===b.tagName&&(a.id||'')===(b.id||'');
  }
  function morpherSignatureIdleV1_(n){
    return n.tagName+"."+String(n.getAttribute("class")||"").split(" ")[0];
  }
  function morpherNoeudIdleV1_(a,b){
    if(a.nodeType!==1){
      if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;
      return;
    }
    /*
     * Changement de page (le conteneur de menu change de data-menu) : les blocs que d'autres modules avaient posés (data-morph-garder : scène d'Aventure, automatisation de l'inventaire) appartiennent à
     * l'ancienne page ; ils sont retirés avant la mise à jour, sinon ils restaient sous la page suivante (Norman, 2026-10-07 : « le siège d'Aventure sous Entraînement avancé »).
     */
    if(a.classList&&a.classList.contains('soreal-idle-page-root-v28')&&(a.getAttribute('data-menu')||'')!==(b.getAttribute('data-menu')||'')){
      Array.prototype.slice.call(a.querySelectorAll('[data-morph-garder]')).forEach(function(g){if(g.parentNode)g.parentNode.removeChild(g);});
    }
    Array.prototype.slice.call(a.attributes).forEach(function(at){
      if(!b.hasAttribute(at.name))a.removeAttribute(at.name);
    });
    Array.prototype.slice.call(b.attributes).forEach(function(at){
      if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value);
    });
    const tag=a.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'){
      if(a.textContent!==b.textContent)a.textContent=b.textContent;
      return;
    }
    morpherEnfantsIdleV1_(a,b);
    if(tag==='INPUT'){
      if(a.type==='checkbox'||a.type==='radio'){if(a.checked!==b.checked)a.checked=b.checked;}
      else if(document.activeElement!==a&&a.value!==b.value)a.value=b.value;
    }else if(tag==='TEXTAREA'){
      if(document.activeElement!==a&&a.value!==b.value)a.value=b.value;
    }else if(tag==='OPTION'){
      if(a.selected!==b.selected)a.selected=b.selected;
    }else if(tag==='SELECT'&&document.activeElement!==a){
      if(a.selectedIndex!==b.selectedIndex)a.selectedIndex=b.selectedIndex;
    }
  }
  function morpherEnfantsIdleV1_(ancien,nouveau){
    const cles=new Map();
    for(let c=ancien.firstChild;c;c=c.nextSibling){if(c.nodeType===1&&c.id)cles.set(c.id,c);}
    let o=ancien.firstChild;
    let n=nouveau.firstChild;
    while(n){
      const suivantN=n.nextSibling;
      /* Blocs posés par d autres modules (data-morph-garder) : on les laisse où ils sont. */
      while(o&&o.nodeType===1&&o.hasAttribute("data-morph-garder"))o=o.nextSibling;
      let cible=null;
      if(n.nodeType===1&&n.id){
        const k=cles.get(n.id);
        if(k&&k.parentNode===ancien&&k.tagName===n.tagName)cible=k;
      }else if(n.nodeType===1){
        /* Sans identifiant : le prochain frère de même balise ET de même première classe (jusqu a 12 plus loin), sinon le frère courant de même balise. Les blocs ajoutés par d autres modules ne décalent plus tout ce qui suit. */
        const signature=morpherSignatureIdleV1_(n);
        let c=o;
        for(let k=0;c&&k<12;k+=1,c=c.nextSibling){
          if(c.nodeType===1&&!c.id&&!c.hasAttribute("data-morph-garder")&&morpherSignatureIdleV1_(c)===signature){cible=c;break;}
        }
        if(!cible&&o&&morpherMemeNoeudIdleV1_(o,n))cible=o;
      }else if(o&&o.nodeType===n.nodeType){
        cible=o;
      }
      if(cible){
        if(cible===o)o=o.nextSibling;
        else ancien.insertBefore(cible,o);
        morpherNoeudIdleV1_(cible,n);
      }else{
        ancien.insertBefore(document.importNode(n,true),o);
      }
      n=suivantN;
    }
    while(o){
      const suivant=o.nextSibling;
      if(!(o.nodeType===1&&o.hasAttribute("data-morph-garder")))ancien.removeChild(o);
      o=suivant;
    }
    for(let g=ancien.firstElementChild;g;){
      const suiv=g.nextElementSibling;
      const avant=g.hasAttribute&&g.hasAttribute("data-morph-avant")?g.getAttribute("data-morph-avant"):"";
      if(avant){
        let repere=null;
        for(let c=ancien.firstElementChild;c;c=c.nextElementSibling){if(c!==g&&c.matches&&c.matches(avant)){repere=c;break;}}
        if(repere&&g.nextElementSibling!==repere)ancien.insertBefore(g,repere);
      }
      g=suiv;
    }
  }
  function morpherHtmlIdleV1_(element,html){
    const modele=document.createElement('template');
    modele.innerHTML=String(html==null?'':html);
    morpherEnfantsIdleV1_(element,modele.content);
  }
  /* L'affectation « element.innerHTML=… » de ces deux conteneurs (la page entière, le contenu d'un menu) devient une mise à jour sur place. */
  function installerMorphIdleV1_(element){
    try{
      if(typeof Element==='undefined'||!(element instanceof Element)||element.__morphIdleV1__)return;
      const original=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
      Object.defineProperty(element,'innerHTML',{
        configurable:true,
        get:function(){return original.get.call(this);},
        set:function(html){
          try{morpherHtmlIdleV1_(this,html);}
          catch(e){original.set.call(this,html);}
        }
      });
      element.__morphIdleV1__=true;
    }catch(_e){}
  }

window.__SOREAL_IDLE_MORPH_V1__={morpherHtml:morpherHtmlIdleV1_,installer:installerMorphIdleV1_};
})();
