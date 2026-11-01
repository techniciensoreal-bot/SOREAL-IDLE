/*
 * SOREAL IDLE — Garderie : SIX récipients par apparence du chat (Norman, 2026-11-01 : « 6 bocaux différents par chat, tous en rapport avec le skin, de plus en plus beaux car ils coûtent de plus en plus cher »).
 * Rang d'un bocal = son EMPLACEMENT sur l'étagère (0 à 5 -> rang 1 à 6) : les 6 places sont celles de la garderie (6 emplacements au maximum, achats d'EXP puis défis / perk : les plus chers arrivent en
 * dernier) ; la place garde toujours sa forme, quel que soit l'objet qu'elle contient. Le rang 1 est la forme d'avant (garderie-bocaux-formes-v1.js, ou le bocal classique pour « défaut »).
 * Ce module ne contient que le REGISTRE et des aides de dessin ; les dessins vivent dans garderie-bocaux-formes-a/b/c-v1.js, UN objet par récipient (facile à refaire seul).
 * Un récipient = { nom, d (silhouette, viewBox 0 0 100 157, masque du liquide), deco (cadre SVG), trait (couleur du trait du verre), hautObj, basObj, ico, fond? }.
 * Anti-spoil (règle n°2) : rien ici ne sait ce que le joueur possède ; seule la page pose data-rang sur les places existantes.
 * Expose window.__SOREAL_IDLE_GARDERIE_RANGS_V1__ { skins, aide, def }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_GARDERIE_RANGS_V1__)return;
  const n=function(v){return Math.round(v*10)/10;};
  const aide={
    /* gemme taillée */
    gem:function(x,y,r,c1,c2){return '<path d="M'+x+' '+n(y-r)+'L'+n(x+r*.8)+' '+y+'L'+x+' '+n(y+r*1.15)+'L'+n(x-r*.8)+' '+y+'Z" fill="'+c1+'" stroke="'+c2+'" stroke-width="1"/><path d="M'+n(x-r*.4)+' '+n(y-r*.2)+'L'+x+' '+n(y-r*.7)+'" stroke="#fff" stroke-width="1" stroke-linecap="round" fill="none" opacity=".85"/>';},
    /* étincelle à quatre branches (statique) */
    etincelle:function(x,y,r,c){return '<path d="M'+x+' '+n(y-r)+'Q'+x+' '+y+' '+n(x+r)+' '+y+'Q'+x+' '+y+' '+x+' '+n(y+r)+'Q'+x+' '+y+' '+n(x-r)+' '+y+'Q'+x+' '+y+' '+x+' '+n(y-r)+'Z" fill="'+(c||'#fff')+'"/>';},
    /* ellipse en tracé */
    ell:function(cx,cy,rx,ry){return 'M'+n(cx-rx)+' '+cy+'a'+rx+' '+ry+' 0 1 0 '+(rx*2)+' 0a'+rx+' '+ry+' 0 1 0 '+(-rx*2)+' 0Z';},
    /* contour à pétales / dents arrondies autour d'une ellipse */
    petales:function(cx,cy,rx,ry,k,amp){let d='';for(let i=0;i<k;i+=1){const a0=i/k*Math.PI*2-Math.PI/2,a1=(i+1)/k*Math.PI*2-Math.PI/2,am=(a0+a1)/2;const x0=cx+rx*Math.cos(a0),y0=cy+ry*Math.sin(a0),x1=cx+rx*Math.cos(a1),y1=cy+ry*Math.sin(a1),xc=cx+(rx+amp)*Math.cos(am)*1.0,yc=cy+(ry+amp*1.4)*Math.sin(am);d+=(i?'':'M'+n(x0)+' '+n(y0))+'Q'+n(xc)+' '+n(yc)+' '+n(x1)+' '+n(y1);}return d+'Z';},
    /* étoile à k branches */
    etoile:function(cx,cy,R,r,k,ry){let d='';for(let i=0;i<k*2;i+=1){const a=i*Math.PI/k-Math.PI/2,q=i%2?r:R;d+=(i?'L':'M')+n(cx+q*Math.cos(a))+' '+n(cy+q*Math.sin(a)*(ry||1));}return d+'Z';},
    /* second contour, plus petit, du même dessin (centré sur la boîte) */
    interieur:function(d,k,c,w){return '<path d="'+d+'" transform="translate(50 78) scale('+k+') translate(-50 -78)" fill="none" stroke="'+c+'" stroke-width="'+(w||1.2)+'" vector-effect="non-scaling-stroke" opacity=".8"/>';},
    /* reflet blanc statique */
    reflet:function(d){return '<path d="'+d+'" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>';}
  };
  const def=function(nom,d,deco,trait,hautObj,basObj,ico,fond){const o={nom:nom,d:d,deco:deco,trait:trait,hautObj:hautObj,basObj:basObj,ico:ico};if(fond)o.fond=fond;return o;};
  /* skins[id] = [rang 2, rang 3, rang 4, rang 5, rang 6] */
  window.__SOREAL_IDLE_GARDERIE_RANGS_V1__={skins:{},aide:aide,def:def};
})();
