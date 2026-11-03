/*
 * Défi des 100 niveaux : budget PARTAGÉ côté client (Norman, 2026-11-03 : « Wandoos affichait 101 puis revenait à 100 ; dans Augmentations j'ai pu monter au niveau 5 alors que les 100 niveaux étaient pris »).
 * Le moteur annonce le pool restant dans `systemes.defiNiveaux100` ({actif:false} hors défi, {actif:true,restants:n} pendant). Entre deux synchros, chaque projection locale (Wandoos, Augmentations, Machine temporelle,
 * Blood Magic) puise dans ce MÊME budget : la somme des niveaux affichés en plus par tous les systèmes ne dépasse jamais `restants`. À 0, la barre reste pleine et le niveau ne bouge plus.
 * Hors défi : `plafond` renvoie Infinity et `noter` ne fait rien (comportement strictement inchangé).
 * Un « compteur » (par piste ou par barre) retient les niveaux déjà puisés depuis SON repère ; il est rattaché à l'époque courante (une époque = une réponse du moteur) : à la synchro suivante, repère neuf et compteur à 0.
 */
(function(){
  'use strict';
  var epoqueCourante=null,compteurEpoques=0;
  function etat_(){
    try{var H=window.__SOREAL_IDLE_META_HOST_V130__;return H&&H.getIdleEtat?H.getIdleEtat():null;}catch(_e){return null;}
  }
  function piece_(){var j=etat_();return j&&j.systemes?j.systemes.defiNiveaux100:null;}
  function actif(){var p=piece_();return Boolean(p&&p.actif===true);}
  function epoque_(){
    var p=piece_();
    if(!p||p.actif!==true)return null;
    var r=Number(p.restants);if(!(r>=0))r=0;
    if(!epoqueCourante||epoqueCourante.piece!==p||epoqueCourante.restants0!==r){
      compteurEpoques+=1;
      epoqueCourante={id:compteurEpoques,piece:p,restants0:r,consomme:0};
    }
    return epoqueCourante;
  }
  /* Niveaux qu'il reste à afficher en plus, tous systèmes confondus (Infinity hors défi). */
  function reste(){
    var e=epoque_();
    return e?Math.max(0,e.restants0-e.consomme):Infinity;
  }
  function compteur_(h,cle){
    var e=epoque_();
    var m=h.__defi100||(h.__defi100={});
    var c=m[cle];
    if(!c||!e||c.ep!==e.id){c=m[cle]={ep:e?e.id:0,n:0};}
    return c;
  }
  /* Niveau cumulé maximal que la piste `cle` (rattachée à l'objet `h`) peut afficher depuis son repère. */
  function plafond(h,cle){
    if(!actif())return Infinity;
    return compteur_(h,cle).n+reste();
  }
  /* La piste affiche `cumul` niveaux depuis son repère : la différence avec ce qu'elle avait déjà puisé sort du budget partagé. */
  function noter(h,cle,cumul){
    if(!actif())return cumul;
    var c=compteur_(h,cle),e=epoque_();
    var inc=cumul-c.n;
    if(inc>0&&e){e.consomme+=inc;c.n=cumul;}
    return cumul;
  }
  /* Nouveau repère de la piste (ses niveaux locaux sont absorbés dans le niveau de base) : le compteur repart de 0, le budget déjà puisé reste puisé. */
  function nouveauRepere(h,cle){
    if(!actif())return;
    compteur_(h,cle).n=0;
  }
  /* Pour un site qui compte par incréments (Blood Magic) : combien de niveaux de plus peut-il accorder maintenant, et puise-les. */
  function accorder(n){
    if(!(n>0))return 0;
    var r=reste();
    if(r===Infinity)return n;
    var g=Math.min(n,r);
    var e=epoque_();
    if(e)e.consomme+=g;
    return g;
  }
  window.__SOREAL_IDLE_DEFI100_V1__={actif:actif,reste:reste,plafond:plafond,noter:noter,nouveauRepere:nouveauRepere,accorder:accorder};
})();
