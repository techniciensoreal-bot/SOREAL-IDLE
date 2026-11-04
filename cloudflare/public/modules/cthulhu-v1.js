/*
 * CTHULHU, la mascotte (Norman, 2026-11-04 : « une petite mascotte cthulhu, un petit bonhomme mignon, avec des petites animations, qui viendrait par moment dans le jeu nous expliquer des choses »).
 * Marionnette 2D : 25 pièces transparentes dessinées à part (public/cthulhu/*.webp, voir tools/build-cthulhu.py), assemblées ici et animées en CSS pur.
 * Module sans état : il ne fait que DESSINER. Les textes, les menus et les voix viennent du tutoriel éditable (tutoriel-v1.js, menu Admin).
 *
 * window.__SOREAL_IDLE_CTHULHU_V1__ = { html(expression, classe), definir(racine, expression), EXPRESSIONS }
 *   expressions (arrive : il vient de loin et grandit jusqu a l ecran ; grand : il reste grand ; repart : il se retourne et s eloigne de dos jusqu a sa position normale) : normal | content | pense | coucou | surpris | vole | dos (de dos : ailes qui battent, queue qui balance) | vole (il vole sur place : ailes qui battent, corps qui monte et descend, pieds qui pendent)
 * Une expression = un attribut data-expr sur la racine (aucun nœud recréé : changer d'humeur ne redessine rien, règle n°4).
 * Animations (règle n°3 : boucles parfaites, mêmes valeurs à 0 % et à 100 %) : respiration, tête qui se balance, clignement, tentacules, ailes, queue,
 * bras qui salue (coucou), « ? » qui flotte (pense), étoiles (content). prefers-reduced-motion coupe tout.
 * Les positions des pièces (en % du dessin complet) viennent de cthulhu-pieces-v1.js (généré).
 */
(function(){
  'use strict';
  var EXPRESSIONS=['normal','content','pense','coucou','surpris','vole','dos','arrive','grand','repart'];
  var ID_STYLE='soreal-idle-cthulhu-style-v1';
  var DIR='/cthulhu/',VER='1';
  var OUVERTS='cth-e-normal cth-e-pense cth-e-surpris cth-e-coucou cth-e-vole';
  var FACE='cth-e cth-e-normal cth-e-content cth-e-pense cth-e-coucou cth-e-surpris';
  var CSS=[
    '.cth-v1{display:inline-block;width:150px;height:150px;position:relative;line-height:0;user-select:none;-webkit-user-select:none;contain:layout style}',
    '.cth-v1 .cth-c{position:absolute;inset:0}',
    '.cth-v1 img{position:absolute;display:block;pointer-events:none;-webkit-user-drag:none}',
    '.cth-v1 .cth-corps{transform-origin:50% 96%;animation:cthRespire 3.2s ease-in-out infinite}',
    '.cth-v1 .cth-tete-g{transform-origin:50% 50%;animation:cthBalance 4.8s ease-in-out infinite}',
    '.cth-v1 .cth-aile-g{transform-origin:100% 73%;animation:cthAileG 1.8s ease-in-out infinite}',
    '.cth-v1 .cth-aile-d{transform-origin:0% 73%;animation:cthAileD 1.8s ease-in-out infinite}',
    '.cth-v1 .cth-queue{transform-origin:5% 90%;animation:cthQueue 2.6s ease-in-out infinite}',
    '.cth-v1 .cth-brasg{transform-origin:15% 6%;animation:cthBras 3.6s ease-in-out infinite}',
    '.cth-v1 .cth-brasd{transform-origin:85% 6%;animation:cthBras 3.6s ease-in-out infinite reverse}',
    '.cth-v1 .cth-salut{transform-origin:88% 88%;animation:cthSalut .9s ease-in-out infinite}',
    '.cth-v1 .cth-salut-2{animation-delay:-.45s}',
    '.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-corps{animation:cthVol .8s ease-in-out infinite}',
    '.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-aile-g{animation:cthBatG .8s ease-in-out infinite}',
    '.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-aile-d{animation:cthBatD .8s ease-in-out infinite}',
    '.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-pied-g{transform-origin:50% 0;animation:cthPend .8s ease-in-out infinite}',
    '.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-pied-d{transform-origin:50% 0;animation:cthPend .8s ease-in-out infinite reverse}',
    '.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-queue{animation-duration:1.2s}',
    '.cth-v1 .cth-t{transform-origin:50% 0;animation:cthOnde 2.4s ease-in-out infinite}',
    '.cth-v1 .cth-t.t2{animation-delay:-.5s}.cth-v1 .cth-t.t3{animation-delay:-1s}.cth-v1 .cth-t.t4{animation-delay:-1.5s}.cth-v1 .cth-t.t5{animation-delay:-2s}',
    '/* haut des tentacules rapproché au niveau de la bouche, pointes en place (Norman, 2026-11-04) : rotation autour du haut + décalage de la même amplitude (propriétés rotate/translate, elles se composent avec la vague) */',
    '.cth-v1 .cth-oeil{animation:cthOuvert 5s linear infinite}',
    '.cth-v1 .cth-clin{opacity:0;animation:cthFerme 5s linear infinite}',
    '.cth-v1 .cth-pt{transform-box:fill-box;transform-origin:50% 100%;animation:cthFlotte 2s ease-in-out infinite}',
    '.cth-v1 .cth-et{transform-box:fill-box;transform-origin:50% 50%;animation:cthScintille 1.4s ease-in-out infinite}',
    '.cth-v1 .cth-et.b{animation-delay:-.7s}',
    '.cth-v1 .cth-e{display:none}',
    '.cth-v1[data-expr="normal"] .cth-e-normal,.cth-v1[data-expr="coucou"] .cth-e-coucou,.cth-v1[data-expr="content"] .cth-e-content,.cth-v1[data-expr="pense"] .cth-e-pense,.cth-v1[data-expr="surpris"] .cth-e-surpris,.cth-v1:is([data-expr="vole"],[data-expr="arrive"]) .cth-e-vole,.cth-v1:is([data-expr="dos"],[data-expr="repart"]) .cth-e-dos,.cth-v1[data-expr="grand"] .cth-e-normal{display:block}',
    '.cth-v1[data-expr="arrive"]{transform-origin:50% 100%;animation:cthArrive 2.6s cubic-bezier(.35,0,.7,.55) both}',
    '.cth-v1[data-expr="grand"]{transform-origin:50% 100%;transform:scale(var(--cth-g,2.4))}',
    '.cth-v1[data-expr="repart"]{transform-origin:50% 100%;animation:cthRepart 2.8s cubic-bezier(.4,0,.8,.6) both}',
    '/* vue de dos (Norman, 2026-11-04) : ailes qui battent comme un compas autour de leur racine (fixe sur le dos), queue qui pivote autour de sa base ; le corps ne bouge pas */',
    '.cth-v1 .cth-daile-g{transform-origin:95% 78%;animation:cthBatG .8s ease-in-out infinite}',
    '.cth-v1 .cth-daile-d{transform-origin:5% 78%;animation:cthBatD .8s ease-in-out infinite}',
    '.cth-v1 .cth-dqueue{transform-origin:27% 97%;animation:cthQueueDos 1.4s ease-in-out infinite}',
    '.cth-v1[data-expr="pense"] .cth-regard{margin-left:1.2%;margin-top:-1.6%}',
    '.cth-v1[data-expr="surpris"] .cth-regard{transform:scale(1.12);transform-origin:50% 50%}',
    '.cth-v1 svg.cth-acc{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '.cth-v1.cth-entre{animation:cthEntre .7s cubic-bezier(.3,1.6,.5,1) both}',
    '@keyframes cthRespire{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,.988)}}',
    '@keyframes cthBalance{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}',
    '@keyframes cthOuvert{0%,90%,100%{opacity:1}91%,95%{opacity:0}}',
    '@keyframes cthFerme{0%,90%,100%{opacity:0}91%,95%{opacity:1}}',
    '@keyframes cthOnde{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}',
    '@keyframes cthAileG{0%,100%{transform:rotate(0)}50%{transform:rotate(7deg)}}',
    '@keyframes cthAileD{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}',
    '@keyframes cthQueue{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}}',
    '@keyframes cthBras{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}',
    '@keyframes cthQueueDos{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}',
    '@keyframes cthArrive{0%{transform:translate(0,-60%) scale(.06);opacity:0}15%{opacity:1}100%{transform:translate(0,0) scale(var(--cth-g,2.4));opacity:1}}',
    '@keyframes cthRepart{0%{transform:scale(var(--cth-g,2.4))}100%{transform:translate(var(--cth-dx,0px),var(--cth-dy,0px)) scale(var(--cth-s,1))}}',
    '@keyframes cthVol{0%,100%{transform:translateY(2.5%)}50%{transform:translateY(-3.5%)}}',
    '@keyframes cthBatG{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(26deg)}}',
    '@keyframes cthBatD{0%,100%{transform:rotate(16deg)}50%{transform:rotate(-26deg)}}',
    '@keyframes cthPend{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}',
    '@keyframes cthSalut{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}',
    '@keyframes cthFlotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}',
    '@keyframes cthScintille{0%,100%{transform:scale(.55);opacity:.35}50%{transform:scale(1);opacity:1}}',
    '@keyframes cthEntre{0%{transform:translateY(40px) scale(.6);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.cth-v1 *,.cth-v1.cth-entre,.cth-v1[data-expr="arrive"],.cth-v1[data-expr="repart"]{animation:none!important}.cth-v1[data-expr="arrive"]{transform:scale(var(--cth-g,2.4));transform-origin:50% 100%}.cth-v1[data-expr="repart"]{transform:translate(var(--cth-dx,0px),var(--cth-dy,0px)) scale(var(--cth-s,1))}.cth-v1 .cth-clin{opacity:0!important}}'
  ].join('\n');

  function injecterStyle(){
    if(typeof document==='undefined'||document.getElementById(ID_STYLE))return;
    var s=document.createElement('style');s.id=ID_STYLE;s.textContent=CSS;(document.head||document.documentElement).appendChild(s);
  }
  function pieces(){return window.__SOREAL_IDLE_CTHULHU_PIECES_V1__||null;}

  /* Une pièce : <img> positionnée en % du dessin complet. miroir = la même pièce de l'autre côté du visage (axe 49,58 %). */
  function img(P,nom,classe,miroir,pivot){
    var b=P[nom];if(!b)return '';
    var l=miroir?2*49.581-b[0]-b[2]:b[0];
    return '<img class="'+(classe||'')+'" alt="" draggable="false" decoding="async" src="'+DIR+nom+'.webp?v='+VER+'" style="left:'+l+'%;top:'+b[1]+'%;width:'+b[2]+'%;height:'+b[3]+'%'+(miroir?';scale:-1 1':'')+(pivot?';transform-origin:'+pivot:'')+'">';
  }
  /* Étoile à quatre branches (content), dans le repère 1254 x 1254 du dessin */
  function etoile(cx,cy,r,cls){
    return '<path class="cth-et '+cls+'" d="M'+cx+' '+(cy-r)+' Q'+(cx+r*.2)+' '+(cy-r*.2)+' '+(cx+r)+' '+cy+' Q'+(cx+r*.2)+' '+(cy+r*.2)+' '+cx+' '+(cy+r)+' Q'+(cx-r*.2)+' '+(cy+r*.2)+' '+(cx-r)+' '+cy+' Q'+(cx-r*.2)+' '+(cy-r*.2)+' '+cx+' '+(cy-r)+' Z" fill="#ffe27a" stroke="#b9892a" stroke-width="9"/>';
  }
  function accessoires(){
    return '<svg class="cth-acc" viewBox="0 0 1254 1254" aria-hidden="true" focusable="false">'+
      '<g class="cth-e cth-e-pense"><g class="cth-pt"><text x="1090" y="250" font-family="Bangers,Impact,sans-serif" font-size="330" fill="#ffe27a" stroke="#6b4b0a" stroke-width="22" paint-order="stroke" text-anchor="middle">?</text></g></g>'+
      '<g class="cth-e cth-e-content">'+etoile(1080,210,95,'a')+etoile(150,190,70,'b')+'</g>'+
      '<g class="cth-e cth-e-surpris"><text x="1090" y="270" font-family="Bangers,Impact,sans-serif" font-size="330" fill="#ff7a6e" stroke="#6b1b14" stroke-width="22" paint-order="stroke" text-anchor="middle">!</text></g>'+
    '</svg>';
  }

  /* Coucou : le même bras qui salue des DEUX côtés (Norman, 2026-11-04 : « deux bras fins qui font signe »). Le miroir est posé sur une boîte extérieure (propriété scale), le bras garde sa propre animation et son pivot. */
  function brasMiroir(P){
    var b=P.bras_droit_coucou;if(!b)return '';
    return '<span style="position:absolute;left:'+(2*49.58-b[0]-b[2])+'%;top:'+b[1]+'%;width:'+b[2]+'%;height:'+b[3]+'%;scale:-1 1"><img class="cth-salut cth-salut-2" alt="" draggable="false" decoding="async" src="'+DIR+'bras_droit_coucou.webp?v='+VER+'" style="left:0;top:0;width:100%;height:100%"></span>';
  }
  function dessin(){
    var P=pieces();if(!P)return '';
    var tent=img(P,'tentacule_01','cth-t t1')+img(P,'tentacule_05','cth-t t5')+img(P,'tentacule_02','cth-t t2')+img(P,'tentacule_04','cth-t t4')+img(P,'tentacule_03','cth-t t3');
    return '<div class="cth-c cth-corps cth-e cth-e-vole">'+img(P,'aile_droite','cth-aile-g')+img(P,'aile_gauche','cth-aile-d')+img(P,'corps_entier_vol_face_sans_ailes_sans_tentacules','')+'<div class="cth-c cth-tete-g">'+tent+'</div></div>'+
      '<div class="cth-c cth-dos cth-e cth-e-dos">'+img(P,'corps_entier_dos_sans_ailes_sans_queue','')+img(P,'queue_dos','cth-dqueue')+img(P,'aile_gauche_dos','cth-daile-g')+img(P,'aile_droite_dos','cth-daile-d')+'</div>'+
      '<div class="cth-c cth-corps '+FACE+'">'+
      img(P,'aile_droite','cth-aile-g')+img(P,'aile_gauche','cth-aile-d')+
      img(P,'queue','cth-queue')+
      img(P,'pied_gauche','cth-pied-g')+img(P,'pied_droit','cth-pied-d')+
      img(P,'corps','')+
      '<span class="cth-e cth-e-normal cth-e-content cth-e-pense cth-e-surpris cth-e-vole">'+img(P,'bras_droit','cth-brasg')+'</span>'+
      '<span class="cth-e cth-e-coucou">'+img(P,'bras_droit_coucou','cth-salut')+'</span>'+
      '<span class="cth-e cth-e-normal cth-e-content cth-e-pense cth-e-surpris cth-e-vole">'+img(P,'bras_gauche','cth-brasd')+'</span>'+
      '<span class="cth-e cth-e-coucou">'+brasMiroir(P)+'</span>'+
      '<div class="cth-c cth-tete-g">'+
        img(P,'tete','')+
        img(P,'tentacule_01','cth-t t1')+img(P,'tentacule_05','cth-t t5')+img(P,'tentacule_02','cth-t t2')+img(P,'tentacule_04','cth-t t4')+img(P,'tentacule_03','cth-t t3')+
        '<span class="cth-e cth-e-content">'+img(P,'joue_droite','')+img(P,'joue_gauche','')+img(P,'oeil_heureux','')+img(P,'oeil_heureux','',true)+'</span>'+
        '<span class="cth-e '+OUVERTS+'">'+
          '<span class="cth-c cth-regard" style="display:block">'+img(P,'oeil_droit_ouvert','cth-oeil')+img(P,'oeil_gauche_ouvert','cth-oeil')+img(P,'oeil_ferme','cth-clin')+img(P,'oeil_ferme','cth-clin',true)+'</span>'+
        '</span>'+
        '<span class="cth-e cth-e-pense">'+img(P,'sourcil_leve','')+'</span>'+
      '</div>'+
      accessoires()+
    '</div>';
  }

  /* html(expression, classe) : le bloc de la mascotte. */
  function html(expression,classe){
    injecterStyle();
    var e=EXPRESSIONS.indexOf(expression)>=0?expression:'normal';
    return '<span class="cth-v1'+(classe?' '+String(classe).replace(/[^A-Za-z0-9_ -]/g,''):'')+'" data-expr="'+e+'" data-morph-vivant>'+dessin()+'</span>';
  }
  function definir(racine,expression){
    if(!racine||EXPRESSIONS.indexOf(expression)<0)return;
    if(racine.getAttribute('data-expr')!==expression)racine.setAttribute('data-expr',expression);
  }
  injecterStyle();
  window.__SOREAL_IDLE_CTHULHU_V1__={html:html,definir:definir,EXPRESSIONS:EXPRESSIONS};
})();
