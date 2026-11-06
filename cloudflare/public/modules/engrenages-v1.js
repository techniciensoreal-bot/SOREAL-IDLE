/*
 * SOREAL IDLE — engrenages qui ENGRÈNENT vraiment (Norman, 2026-11-06 : « chaque dent doit passer dans les dents d'un autre rouage, et ils ne doivent pas se superposer »).
 *
 *   window.__SOREAL_IDLE_ENGRENAGES_V1__ = { chaine(opts), polygone(g, angle), svg(chaine, style), animer(racine, rythme) }
 *
 * Géométrie (denture droite, sans développante : dents trapézoïdales) :
 *  - même MODULE m pour tous les rouages d'une chaîne : rayon primitif r = n·m/2 (n = nombre de dents), pas sur le cercle primitif = π·m ;
 *  - ENTRAXE de deux rouages voisins = somme de leurs rayons primitifs (cercles primitifs tangents) ;
 *  - tête à r + m, pied à r − 1,25·m ; épaisseur de dent à la hauteur du cercle primitif 0,40 du pas, creux 0,60 : un jeu de 0,20 du pas, jamais de contact ;
 *  - PHASE : le rouage de droite est posé de façon que, au point de contact, une dent du rouage de gauche tombe au milieu d'un creux du sien (formule ci-dessous) ;
 *  - CINÉMATIQUE : les deux tournent en sens inverses, la vitesse angulaire est inversement proportionnelle au nombre de dents (même vitesse sur les cercles primitifs). La phase reste donc juste
 *    à chaque instant. Animation par l'API Web Animations : la VITESSE change (playbackRate, commun à tous), jamais la phase.
 * Une chaîne est horizontale (les centres sont alignés sur y) : suffisant pour la fenêtre de la machine et pour les paires de petits rouages.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ENGRENAGES_V1__)return;
  var TAU=Math.PI*2;

  function mod(a,b){return ((a%b)+b)%b;}
  function ecartDent(phi,pas){var e=mod(phi,pas);return e>=pas/2?e-pas:e;}   /* écart (rad) de la dent la plus proche de la direction 0, dans [-pas/2, pas/2) */

  /* chaine({ m, n:[dents...], y, x0 }) -> { rouages:[{x,y,r,n,ro,ri,phi,sens}], largeur, hauteur }
     x0 : abscisse du centre du premier rouage ; y : ordonnée des centres ; phi0 : phase du premier rouage (une dent pointe vers la droite à 0). */
  function chaine(o){
    var m=o.m,n=o.n,y=o.y||0,x=o.x0||0,phi0=o.phi0||0,rouages=[],prev=null,i;
    for(i=0;i<n.length;i++){
      var r=n[i]*m/2,pas=TAU/n[i],phi;
      if(prev){
        x+=prev.r+r;                                              /* entraxe = somme des rayons primitifs */
        var eL=ecartDent(prev.phi,prev.pas);                      /* dent du rouage de gauche proche de la direction du contact (angle 0) */
        var eR=(Math.PI*m/2-prev.r*eL)/r;                         /* écart de la dent du rouage de droite proche de l'angle π pour que sa dent soit en face d'un creux */
        phi=mod(Math.PI+eR,pas);
      }else phi=mod(phi0,pas);
      var g={x:x,y:y,r:r,n:n[i],pas:pas,ro:r+m,ri:r-1.25*m,phi:phi,sens:(i%2===0?1:-1),m:m};
      rouages.push(g);prev=g;
    }
    var maxRo=0;rouages.forEach(function(g){if(g.ro>maxRo)maxRo=g.ro;});
    var last=rouages[rouages.length-1],first=rouages[0];
    return {rouages:rouages,largeur:(last.x+last.ro)-(first.x-first.ro),hauteur:2*maxRo,xMin:first.x-first.ro,yMin:y-maxRo};
  }

  /* contour d'un rouage tourné de `angle` radians (sens horaire, comme SVG) : tableau de points [x,y] ; tête et pied arrondis par 3 points */
  function polygone(g,angle){
    var pts=[],k,a=angle||0,pas=g.pas,hr=.30*pas,ht=.12*pas;
    function p(rad,ang){return [g.x+rad*Math.cos(ang),g.y+rad*Math.sin(ang)];}
    for(k=0;k<g.n;k++){
      var c=g.phi+a+k*pas;
      pts.push(p(g.ri,c-hr));pts.push(p(g.ro,c-ht));pts.push(p(g.ro,c));pts.push(p(g.ro,c+ht));pts.push(p(g.ri,c+hr));
      pts.push(p(g.ri,c+(pas/2)));   /* milieu du creux, sur le cercle de pied */
    }
    return pts;
  }

  function f(x){return Number(x).toFixed(2);}
  /* chemin SVG du contour (angle 0 : la rotation est faite par l'animation) */
  function chemin(g,rel){
    var d='',k,pas=g.pas,hr=.30*pas,ht=.12*pas,ox=rel?0:g.x,oy=rel?0:g.y;
    function P(rad,ang){return f(ox+rad*Math.cos(ang))+' '+f(oy+rad*Math.sin(ang));}
    for(k=0;k<g.n;k++){
      var c=g.phi+k*pas,cn=g.phi+(k+1)*pas;
      d+=(k===0?'M':'L')+P(g.ri,c-hr)+'L'+P(g.ro,c-ht)+'A'+f(g.ro)+' '+f(g.ro)+' 0 0 1 '+P(g.ro,c+ht)+'L'+P(g.ri,c+hr)+'A'+f(g.ri)+' '+f(g.ri)+' 0 0 1 '+P(g.ri,cn-hr);
    }
    return d+'Z';
  }

  /*
   * SVG d'une chaîne : st = { corps:[couleur par rouage ou une seule], trait:'#000', epaisseur, classe:'eng-g' }.
   * Chaque rouage : <g translate(centre)> <g class=classe data-dents data-sens data-off> contour dessiné AUTOUR de l'origine </g> </g> : la rotation (animation) se fait autour de l'origine du groupe, sans transform-origin ni boîte de référence.
   * Avec classe 'tmm-rot', ce sont les rouages que la machine (machine-dessin-v1.js) anime et dont elle règle la cadence : data-dents sert de rapport de vitesse (cadence proportionnelle à 1/dents).
   */
  function svg(ch,st){
    st=st||{};
    /* épaisseur du trait proportionnelle au module (0,3 m) : le jeu entre deux dents (0,2 du pas, soit ~0,63 m sur le cercle primitif) reste plus large que le trait, les contours ne se touchent jamais */
    var trait=st.trait||'#000',ep=st.epaisseur||((ch.rouages[0]&&ch.rouages[0].m)||4)*0.3,cls=st.classe||'eng-g',out='';
    ch.rouages.forEach(function(g,i){
      var col=Array.isArray(st.corps)?st.corps[i%st.corps.length]:(st.corps||'#9aa3ad');
      out+='<g transform="translate('+f(g.x)+' '+f(g.y)+')"><g class="'+cls+'" data-dents="'+g.n+'" data-sens="'+g.sens+'" data-off="0">'+
        '<path d="'+chemin(g,true)+'" fill="'+col+'" stroke="'+trait+'" stroke-width="'+f(ep)+'" stroke-linejoin="round"/>'+
        '<circle r="'+f(g.r*.26)+'" fill="'+trait+'"/><circle r="'+f(g.r*.1)+'" fill="'+col+'"/></g></g>';
    });
    return out;
  }

  /* animation : un tour du rouage de n dents dure n·MS_PAR_DENT millisecondes à rythme 1 ; `rythme` multiplie la vitesse de TOUS les rouages à la fois (phase conservée) */
  var MS_PAR_DENT=500;
  function animer(racine,rythme){
    var anims=[];
    var els=racine.querySelectorAll('.eng-g');
    for(var i=0;i<els.length;i++){
      var e=els[i],n=Number(e.getAttribute('data-dents')),s=Number(e.getAttribute('data-sens'));
      if(e.__engAnim){anims.push(e.__engAnim);continue;}
      var a=e.animate([{transform:'rotate(0deg)'},{transform:'rotate('+(360*s)+'deg)'}],{duration:n*MS_PAR_DENT,iterations:Infinity,easing:'linear'});
      e.__engAnim=a;anims.push(a);
    }
    function regler(r){for(var k=0;k<anims.length;k++){try{anims[k].updatePlaybackRate(r);}catch(_e){anims[k].playbackRate=r;}}}
    regler(rythme||1);
    return {regler:regler,pause:function(){anims.forEach(function(a){a.pause();});},reprendre:function(){anims.forEach(function(a){a.play();});}};
  }

  window.__SOREAL_IDLE_ENGRENAGES_V1__={chaine:chaine,polygone:polygone,chemin:chemin,svg:svg,animer:animer,MS_PAR_DENT:MS_PAR_DENT};
})();
