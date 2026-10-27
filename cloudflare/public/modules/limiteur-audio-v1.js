/*
 * SOREAL IDLE — limiteur de sortie audio (Norman, 2026-10-27 : « les sons du jeu saturent par moment ; le même son peut saturer ou ne pas saturer »).
 *
 * Cause : les sons du jeu (synthétisés, plusieurs à la fois) et les ambiances (amplifiées jusqu'à ×5 pour avoir la même sonie) arrivaient SANS protection à la sortie de la carte son : dès que la somme dépassait 1,0, le signal était
 * écrêté (saturation). Le même son saturait ou non selon ce qui jouait en même temps (les bruits aléatoires ont des crêtes qui varient) et selon l'amplification calculée pour le fichier.
 * Remède : tout ce qui sort passe par UN limiteur par contexte audio : un compresseur rapide (seuil -3 dB, rapport 20:1, attaque 2 ms, relâchement 100 ms) suivi d'un écrêtage doux (identité jusqu'à 0,8, plafond 0,98) qui ne laisse jamais rien dépasser 1,0.
 * Sous le seuil, le signal est strictement inchangé : le volume habituel n'est pas modifié, seuls les dépassements sont calmés.
 * Utilisation : window.__SOREAL_IDLE_LIMITEUR_V1__.brancher(contexte, noeud) remplace noeud.connect(contexte.destination) (un seul limiteur par contexte, créé au premier appel).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_LIMITEUR_V1__)return;

  var GENOU=0.8,PLAFOND=0.98;
  var cache=typeof WeakMap==='function'?new WeakMap():null;

  /* courbe d'écrêtage doux : strictement l'identité jusqu'à 0,8, puis arrondie vers 0,98 ; jamais au-dessus (le compresseur qui précède ne laisse presque rien arriver jusque-là) */
  function courbe_(){
    var n=4096,c=new Float32Array(n),i,x,a;
    for(i=0;i<n;i++){
      x=i*2/(n-1)-1;
      a=Math.abs(x);
      c[i]=a<=GENOU?x:(x<0?-1:1)*(GENOU+(PLAFOND-GENOU)*Math.tanh((a-GENOU)/(PLAFOND-GENOU)));
    }
    return c;
  }

  function creer_(ctx){
    var entree=ctx.createGain();
    var comp=ctx.createDynamicsCompressor();
    try{
      comp.threshold.value=-3;
      comp.knee.value=3;
      comp.ratio.value=20;
      comp.attack.value=0.002;
      comp.release.value=0.1;
    }catch(_e){}
    /* le compresseur Web Audio ajoute tout seul un gain de rattrapage (+1,2 dB mesuré avec ces réglages) : on le retire pour que le volume habituel ne change pas */
    var rattrapage=ctx.createGain();
    rattrapage.gain.value=0.871;
    var ecretage=ctx.createWaveShaper();
    try{ecretage.curve=courbe_();ecretage.oversample='2x';}catch(_e){}
    entree.connect(comp);
    comp.connect(rattrapage);
    rattrapage.connect(ecretage);
    ecretage.connect(ctx.destination);
    return entree;
  }

  function entree(ctx){
    var e=cache?cache.get(ctx):ctx.__limiteurSorealV1;
    if(e)return e;
    e=creer_(ctx);
    if(cache)cache.set(ctx,e);else ctx.__limiteurSorealV1=e;
    return e;
  }

  function brancher(ctx,noeud){
    if(!ctx||!noeud)return false;
    try{
      noeud.connect(entree(ctx));
      return true;
    }catch(_e){
      try{noeud.connect(ctx.destination);}catch(_f){}
      return false;
    }
  }

  window.__SOREAL_IDLE_LIMITEUR_V1__={brancher:brancher,entree:entree,plafond:PLAFOND};
})();
