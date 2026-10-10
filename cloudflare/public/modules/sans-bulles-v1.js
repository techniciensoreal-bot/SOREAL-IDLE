/*
 * Plus aucune bulle d'aide du navigateur (Norman, 2026-10-10 : « quand on laisse la souris sur un bouton du menu, il affiche une mini fenêtre Windows (Adventure - Explorer…) : supprime-les toutes, dans tout le jeu »).
 * La bulle vient de l'attribut `title`. Plutôt que de le retirer à chaque dessin des pages (des centaines d'endroits, et des pages qui se redessinent sans cesse), on le retire au moment où la souris (ou le
 * focus) arrive sur l'élément, avant que le navigateur n'affiche quoi que ce soit : aucun observateur, aucun coût au dessin. Le texte devient l'étiquette d'accessibilité (aria-label) des éléments qui n'ont pas de texte.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SANS_BULLES_V1__)return;
  function retirer(e){
    var el=e&&e.target;
    if(!el||!el.closest)return;
    var t=el.closest('[title]');
    while(t){
      try{
        var v=t.getAttribute('title');
        if(v&&!t.hasAttribute('aria-label')&&!String(t.textContent||'').trim())t.setAttribute('aria-label',v);
        t.removeAttribute('title');
      }catch(_e){}
      t=t.parentElement?t.parentElement.closest('[title]'):null;
    }
  }
  ['mouseover','pointerover','pointerdown','focusin','touchstart'].forEach(function(nom){
    document.addEventListener(nom,retirer,{capture:true,passive:true});
  });
  window.__SOREAL_IDLE_SANS_BULLES_V1__={retirer:retirer};
})();
