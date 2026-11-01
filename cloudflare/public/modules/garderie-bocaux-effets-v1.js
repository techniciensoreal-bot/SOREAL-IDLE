/*
 * SOREAL IDLE — Garderie : couleurs de liquide PAR RANG et effets des rangs 1 et 6 de Noël (Norman, 2026-11-01). Feuille de style seulement, aucune minuterie JS, aucun nœud ajouté (règle n°4).
 *  - Matrix : n°1 pilule au liquide ROUGE, n°2 pilule au liquide BLEU (surcharge de --gd-liq selon data-rang) ; les rangs 3 à 6 gardent le vert Matrix.
 *  - Noël : le liquide VERT n'existe que pour le sapin (n°3) ; le bonhomme de neige (n°5) a un liquide BLANC ; tous les autres sont rouges (couleur de base du skin, sans vert).
 *  - Boule de Noël (n°1) : le liquide enchaîne en continu rouge > or > bleu glacé > rose > rouge, 10 s de fondu entre deux couleurs (cycle de 40 s) : un dégradé de 1600 % de haut, dont la
 *    première et la dernière couleur sont identiques, glisse d'exactement UNE tuile (background-position-y de 0 à 106,6667 % = -1600 %) : mêmes valeurs à 0 % et 100 %, un seul sens (règle n°3).
 *    Le décalage de départ (--gd-noel-d) est fixé une fois pour toutes : un redessin de la page ne rejoue pas le début (le nœud est conservé par le morph). prefers-reduced-motion : rouge fixe.
 *  - Globe à neige (n°6) : 4 flocons faits de pseudo-éléments (aucun nœud ajouté), chacun avec sa durée ; ils tombent DERRIÈRE le liquide, donc ils disparaissent dans le liquide ; chaque flocon est
 *    invisible à 0 % et à 100 % du cycle (transform + opacity seulement) ; prefers-reduced-motion : quelques flocons fixes.
 * Expose RANGS.effets() -> texte CSS ; RANGS.cycleNoel (durées et teintes, lues par le test).
 */
(function(){
  'use strict';
  const R=window.__SOREAL_IDLE_GARDERIE_RANGS_V1__;
  if(!R)return;
  const TEINTES=['#e0303a','#ffbf40','#7fd0ff','#ff7fb8'];   /* rouge, or, bleu glacé, rose : aucun vert */
  const FONDU_S=10;
  const CYCLE_S=TEINTES.length*FONDU_S;
  const TUILE=1600;                                            /* hauteur de la tuile du dégradé, en % de la hauteur du liquide */
  const FIN=(TUILE/(TUILE-100)*100).toFixed(4);                /* 106,6667 % : décalage d'exactement une tuile */
  R.cycleNoel={teintes:TEINTES,fonduS:FONDU_S,cycleS:CYCLE_S,tuile:TUILE,fin:FIN};
  /* instant de départ fixé une fois (au chargement du script) : pas de redémarrage à chaque redessin */
  const DEPART=-((Date.now()/1000)%CYCLE_S);

  const liq=function(c1,c2,c3){return 'linear-gradient(180deg,'+c1+' 0%,'+c2+' 45%,'+c3+' 100%)';};
  function effets(){
    const N='.gd-etagere[data-skin="noel"] ',M='.gd-etagere[data-skin="matrix"] ',L=[];
    L.push(M+'.gd-pot[data-rang="1"]{--gd-liq:'+liq('#ff9a9a','#e01c2c','#7a0612')+'}');
    L.push(M+'.gd-pot[data-rang="2"]{--gd-liq:'+liq('#9ad0ff','#2a6df0','#0a2a7a')+'}');
    L.push(N+'.gd-pot[data-rang="3"]{--gd-liq:'+liq('#8ee08e','#1f9a4a','#0b5a2a')+'}');
    L.push(N+'.gd-pot[data-rang="5"]{--gd-liq:'+liq('#ffffff','#f1f6fc','#d6e2f2')+'}');
    /* boule de Noël : teintes qui glissent */
    const grad='linear-gradient(180deg,'+TEINTES.concat([TEINTES[0]]).map(function(c,i){return c+' '+(i*100/TEINTES.length)+'%';}).join(',')+')';
    L.push(N+'{--gd-noel-d:'+DEPART.toFixed(2)+'s}');
    L.push(N+'.gd-pot[data-rang="1"] .gd-liq{background:radial-gradient(130% 40% at 50% 100%,rgba(255,255,255,.28),rgba(255,255,255,0) 70%),linear-gradient(180deg,rgba(255,255,255,.28) 0,rgba(255,255,255,0) 14%),linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(60,0,10,.3)),'+grad+';background-size:100% 100%,100% 100%,100% 100%,100% '+TUILE+'%;background-repeat:no-repeat,no-repeat,no-repeat,repeat-y;background-position:0 0,0 0,0 0,0 0;animation:gd-onde 3.2s linear infinite,gd-noel-teintes '+CYCLE_S+'s linear infinite;animation-delay:0s,var(--gd-noel-d,0s)}');
    L.push('@keyframes gd-noel-teintes{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 0,0 0,0 0,0 '+FIN+'%}}');
    /* globe à neige : flocons derrière le liquide */
    const P=N+'.gd-pot[data-rang="6"]';
    const flocon=function(sel,gauche,haut,taille,anim,duree,delai,z){
      return sel+'{content:"";position:absolute;left:'+gauche+'cqw;top:'+haut+'cqh;width:'+taille+'cqw;height:'+taille+'cqw;border-radius:50%;background:#fff;opacity:0;pointer-events:none;'+(z!=null?'z-index:'+z+';':'')+'animation:'+anim+' '+duree+'s linear infinite;animation-delay:'+delai+'s}';
    };
    L.push(flocon(P+'::before',34,14,3.4,'gd-fl-a',6.3,-1.2,0));
    L.push(flocon(P+'::after',58,10,2.6,'gd-fl-b',7.9,-3.4,0));
    L.push(flocon(P+' .gd-bocal::after',46,18,3.8,'gd-fl-c',9.1,-5.1,-1));
    L.push(flocon(P+' .gd-verre::before',26,12,2.4,'gd-fl-b',5.7,-0.4));
    L.push('@keyframes gd-fl-a{0%{opacity:0;transform:translate(0,0) scale(.9)}15%{opacity:.95}80%{opacity:.8}100%{opacity:0;transform:translate(260%,1800%) scale(.5)}}');
    L.push('@keyframes gd-fl-b{0%{opacity:0;transform:translate(0,0) scale(.9)}15%{opacity:.95}80%{opacity:.8}100%{opacity:0;transform:translate(-300%,2200%) scale(.5)}}');
    L.push('@keyframes gd-fl-c{0%{opacity:0;transform:translate(0,0) scale(.9)}15%{opacity:.95}80%{opacity:.8}100%{opacity:0;transform:translate(150%,1500%) scale(.5)}}');
    L.push('@media (prefers-reduced-motion:reduce){'+N+'.gd-pot[data-rang="1"] .gd-liq{animation:none}'+
      [P+'::before',P+'::after',P+' .gd-bocal::after',P+' .gd-verre::before'].map(function(s,i){return s+'{animation:none;opacity:.85;transform:translate('+(i%2?-80:90)+'%,'+(500+i*300)+'%)}';}).join('')+'}');
    return L.join('\n');
  }
  R.effets=effets;
})();
