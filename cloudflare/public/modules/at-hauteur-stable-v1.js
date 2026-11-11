/* Entraînement avancé : la hauteur d'une ligne ne change JAMAIS quand on clique (Norman, 2026-11-11 : « quand on clique sur entraînement avancé, la barre des menus bouge encore ; je voudrais que ça n'arrive plus jamais pour aucun bouton »).
   Cause : le texte d'état d'une ligne (« Place de l'énergie pour progresser. », « Niveau suivant dans 11 h 6 min · 0,01 niv/s », « 50 niveaux par seconde (maximum) »…) change à chaque clic et passe de une à deux lignes ; la ligne grandit de 16 px, la page recale le bouton cliqué sous le doigt (ui-menus-v1.js, pin du clic) et tout ce qui est au-dessus, la barre des menus comprise, glisse de 16 px.
   Maintenant : la zone de texte réserve TOUJOURS la hauteur du pire texte possible, mesurée sur une copie invisible de la zone, à la largeur réelle de la colonne (remesurée seulement si la largeur change). Rien ne dépend du texte du moment, donc plus aucun saut. */
(function(){
  'use strict';
  var SEL='.soreal-idle-at-detail-v1',dernier={w:-1,b:''};
  var PIRES=['Niveau suivant dans 99 h 59 min · 49,9 niv/s','⚡ 50 niveaux par seconde (maximum)','Place de l’énergie pour progresser.','🎯 Target atteint'];
  function pireBonus(){
    var all=document.querySelectorAll(SEL+' [data-at-bonus]'),m='',i;
    for(i=0;i<all.length;i++){var t=all[i].textContent;if(t.length>m.length)m=t;}
    return m;
  }
  function mesurer(){
    var det=document.querySelector(SEL);
    if(!det||!det.parentNode)return;
    var w=det.getBoundingClientRect().width,b=pireBonus();
    if(!(w>0)||(Math.abs(w-dernier.w)<0.5&&b===dernier.b))return;
    dernier.w=w;dernier.b=b;
    var sonde=det.cloneNode(false),h=0,i;
    sonde.removeAttribute('id');
    sonde.style.cssText='position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;width:'+w+'px;min-height:0';
    sonde.setAttribute('aria-hidden','true');
    det.parentNode.appendChild(sonde);
    for(i=0;i<PIRES.length;i++){
      sonde.innerHTML='<span>'+b+'</span><span>'+PIRES[i]+'</span>';
      h=Math.max(h,sonde.getBoundingClientRect().height);
    }
    sonde.remove();
    document.documentElement.style.setProperty('--at-detail-h',Math.ceil(h)+'px');
  }
  window.addEventListener('resize',function(){dernier.w=-1;});
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{mesurer();}catch(_e){}});
})();
