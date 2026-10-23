/*
 * SOREAL IDLE — intitulés des fiches d'objets sur UNE seule ligne (Norman, 2026-10-23 : « essaie autant que possible d'écrire les intitulés sur une ligne »).
 * Les lignes de statistiques d'une fiche (et de la comparaison) ne passent plus à la ligne : si l'intitulé et la valeur ne tiennent pas dans la largeur de la fiche, la police de l'intitulé
 * rapetisse par demi-pixel (jusqu'à 9,5 px) ; au-delà, et seulement alors, l'intitulé reprend le retour à la ligne. Les fiches sont redessinées par le jeu (innerHTML) : un observateur
 * ajuste chaque nouveau contenu, une seule fois par image.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_LIGNE_UNIQUE_V1__)return;
  var MIN=9.5,planifie=false;
  function ajusterLigne(l){
    var s=l.querySelector('span');
    if(!s||l.__luOk===l.textContent)return;
    s.style.fontSize='';s.style.whiteSpace='';
    var taille=parseFloat(getComputedStyle(s).fontSize)||14;
    var garde=taille;
    while(l.scrollWidth>l.clientWidth+1&&taille>MIN){taille-=.5;s.style.fontSize=taille+'px';}
    if(l.scrollWidth>l.clientWidth+1){s.style.fontSize=garde+'px';s.style.whiteSpace='normal';}   /* vraiment trop long : retour à la ligne permis */
    l.__luOk=l.textContent;
  }
  function ajuster(){
    planifie=false;
    var lignes=document.querySelectorAll('.soreal-idle-item-popup-v1 .soreal-idle-v138-details-stat');
    for(var i=0;i<lignes.length;i+=1)ajusterLigne(lignes[i]);
  }
  function planifier(){
    if(planifie)return;
    planifie=true;
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(ajuster);else setTimeout(ajuster,16);
  }
  if(typeof MutationObserver==='function'){
    var obs=new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i+=1){
        var t=muts[i].target;
        if(t&&t.closest&&t.closest('.soreal-idle-item-popup-v1')){planifier();return;}
        var a=muts[i].addedNodes;
        for(var j=0;j<a.length;j+=1){if(a[j].nodeType===1&&(a[j].matches&&a[j].matches('.soreal-idle-item-popup-v1')||a[j].querySelector&&a[j].querySelector('.soreal-idle-item-popup-v1'))){planifier();return;}}
      }
    });
    var demarrer=function(){if(document.body)obs.observe(document.body,{childList:true,subtree:true});};
    if(document.body)demarrer();else document.addEventListener('DOMContentLoaded',demarrer);
  }
  window.__SOREAL_IDLE_LIGNE_UNIQUE_V1__={ajuster:ajuster};
})();
