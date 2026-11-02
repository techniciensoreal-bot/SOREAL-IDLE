/*
 * SOREAL IDLE — pupilles des chats de la Garderie : fente verticale qui se dilate en DISQUE presque plein (Norman, 2026-11-01 puis 2026-11-02 :
 * « le mouvement des pupilles doit être plus rare » ; « quand elles sont rondes, le cercle noir doit grandir PROGRESSIVEMENT, ne laisse qu'un FIN bord de couleur, puis se rétrécir pour redevenir une pupille en ligne »).
 * Les sprites de regard (/garderie/yeux/<id>-<n>.webp) NE portent PLUS de pupille dessinée (2026-11-02 : retirée des images, plus de plaque de la couleur de l'iris par-dessus) ; il n'y a que UNE SEULE pupille noire :
 * un cercle de base (84 % de la hauteur de l'iris) dont transform: scale(sx, 1) fait toute la forme : sx = .17 = fente fine (les bouts haut et bas touchent presque l'iris), sx = .5 = ellipse verticale douce (battement du repos),
 * sx = 1 = disque presque plein (il ne reste qu'un fin anneau de couleur, ~8 % de la hauteur de l'iris). La forme est continue (fente -> ellipse -> disque) : aucun fondu entre deux formes, aucun filtre, aucune ombre.
 * Sources (réflexe pupillaire) : une pupille verticale de chat varie d'environ 135 fois en surface entre sa fermeture et sa dilatation maximale (Banks et al., UC Berkeley, 2015, relayé par phys.org) ; elle ne se referme pas
 * complètement en pleine lumière ; elle se dilate à la pénombre, à la surprise, à l'excitation ou à la peur (vétérinaires : mydriase normale, qui disparaît avec l'émotion) ; chez les mammifères la CONTRACTION (muscle
 * sphincter, parasympathique) est plus rapide que la DILATATION (muscle dilatateur, sympathique, latence et constante de temps plus longues) : contraction ~0,6 s, dilatation ~1,2 s, mouvement lisse (ease-in-out).
 * Mouvement (Norman : « un chat ne change pas ses pupilles aussi souvent ») :
 *  - AU REPOS : fente fine ; un battement lent (fente -> ellipse -> fente, ~3 s) toutes les 14 à 25 s environ (cycle propre à chaque chat, 1re échéance aléatoire propre à chaque chat) ;
 *  - À L'ARRIVÉE dans le menu Garderie : disque presque plein ~3 s (dilatation 1,2 s, tenue, contraction 0,6 s), UNE fois par entrée. L'entrée est détectée par un petit guetteur (voir « entree ») : première fois que les
 *    pupilles apparaissent dans la page après une absence ; un redessin périodique (morph, 4 s) ne les fait jamais disparaître, il ne relance donc rien ;
 *  - VUE ZOOM d'un bocal (garderie-zoom-v1.js) : disque presque plein tant qu'elle est ouverte (état stable), fente à la fermeture.
 * L'état est porté par trois classes de <html> (hors de la page : jamais retirées par un redessin, règle n°4) : et-pup-bat, et-pup-arrivee, et-pup-zoom ; la forme suit par une TRANSITION CSS de transform (continue depuis
 * n'importe quel point, même si l'état change en pleine course) : retour exact à la fente (règle n°3, aucune boucle imparfaite possible). Mouvement réduit : rien ne bouge (fente fixe, disque fixe dans la vue zoom).
 * Yeux NON félins (gardent leur identité, pas de fente) : arcenciel (anneaux), fibonacci (spirale), matrix (glyphes), nega (croissant), tchernobyl (tache irrégulière).
 * window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__ = { skins, html(idSkin), css, arrondir(ms), zoom(booleen), entree }.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__)return;
  /* teinte du centre de l'iris (patch), pupille dessinée ronde ou fente, cycle de repos (14 à 25 s : un battement par cycle) */
  var SKINS={
    defaut:{tone:'#9cc0d8',rond:1,d:17.3},
    noeud:{tone:'#b583dc',rond:0,d:21.1},
    dore:{tone:'#eba315',rond:0,d:14.7},
    chauvesouris:{tone:'#c92a2a',rond:0,d:24.7},
    pirate:{tone:'#bf7a2b',rond:1,d:19.4},
    noel:{tone:'#38b958',rond:1,d:16.6}
  };
  var DUREE_ARRONDI_MS=3000;   /* dilatation 1,2 s + tenue ~1,8 s ; la contraction (0,6 s) suit */
  var DUREE_BATTEMENT_MS=2400; /* dilatation 1,2 s + tenue 1,2 s ; la contraction (0,6 s) suit */
  var phases={};               /* phase aléatoire par chat, tirée une fois par visite de la page (mémoire du module : un redessin réutilise la même) */
  var actuel={id:'',d:17};
  function phase(id,d){
    if(typeof phases[id]!=='number')phases[id]=Math.random()*d;
    return phases[id];
  }
  function html(id){
    var s=SKINS[id];
    if(!s)return '';
    css();
    actuel={id:id,d:s.d};
    entree();
    return '<em class="et-pf"></em>';
  }
  function racine(){return typeof document!=='undefined'?document.documentElement:null;}
  var minuterieArrondi=0,minuterieBat=0;
  /* pupilles rondes quelques secondes (arrivée dans le menu) : classe sur <html>, retirée seule */
  function arrondir(ms){
    var r=racine();
    if(!r)return;
    r.classList.add('et-pup-arrivee');
    if(typeof setTimeout!=='function')return;
    clearTimeout(minuterieArrondi);
    minuterieArrondi=setTimeout(function(){r.classList.remove('et-pup-arrivee');},ms>0?ms:DUREE_ARRONDI_MS);
  }
  /* vue zoom : rondes tant qu'elle est ouverte */
  function zoom(ouvert){
    var r=racine();
    if(!r)return;
    r.classList.toggle('et-pup-zoom',Boolean(ouvert));
  }
  /* battement de repos : ellipse douce quelques secondes, puis plus rien pendant ~un cycle (14 à 25 s) ; première échéance aléatoire propre au chat */
  function battre(premier){
    if(typeof setTimeout!=='function')return;
    clearTimeout(minuterieBat);
    var d=actuel.d,delai=premier?Math.max(3,d-phase(actuel.id,d)):d*(0.85+0.3*Math.random());
    minuterieBat=setTimeout(function(){
      var r=racine();
      if(!r)return;
      r.classList.add('et-pup-bat');
      minuterieBat=setTimeout(function(){r.classList.remove('et-pup-bat');battre(false);},DUREE_BATTEMENT_MS);
    },delai*1000);
  }
  function arreterBattements(){
    var r=racine();
    if(typeof clearTimeout==='function')clearTimeout(minuterieBat);
    if(r)r.classList.remove('et-pup-bat');
  }
  /* Détection de l'entrée dans le menu : un guetteur léger (250 ms) regarde si des pupilles sont dans la page. Absentes -> présentes = ENTRÉE (arrondi unique, battements de repos armés) ; il s'arrête quand tout est parti
   * (un menu quitté), et html() le relance au prochain rendu de la Garderie. Un redessin du menu garde les mêmes nœuds : aucune entrée n'est vue. */
  var guet=0,present=false;
  function entree(){
    if(guet||typeof document==='undefined'||typeof setInterval!=='function')return;
    var vides=0;
    guet=setInterval(function(){
      var la=Boolean(document.querySelector('.et-pf'));
      if(la&&!present){present=true;vides=0;arrondir(DUREE_ARRONDI_MS);battre(true);return;}
      if(la)return;
      vides+=1;
      if(present||vides>40){present=false;clearInterval(guet);guet=0;arreterBattements();}
    },250);
  }
  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('et-style-pupilles-v1'))return;
    var s=document.createElement('style');
    s.id='et-style-pupilles-v1';
    s.textContent=[
      /* Plus de plaque de la couleur de l'œil (Norman, 2026-11-02 : « il ne faut pas la pupille de fond, celle de la même couleur que l'œil ») : les images d'iris (/garderie/yeux/<id>-<n>.webp) n'ont plus de pupille dessinée (retirée, iris rempli par interpolation, reflets conservés) ; seule la pupille noire de ce module reste. */
      /* cercle de base (84 % de la hauteur de l'iris, centré) ; scale(sx,1) fait la forme : .17 fente fine, .5 ellipse douce, 1 disque. Contraction rapide (.6 s), dilatation plus lente (1,2 s). */
      '.et-pf{position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;height:84%;aspect-ratio:1;border-radius:50%;background:#050302;pointer-events:none;transform:scale(.17,1);transition:transform .6s cubic-bezier(.4,0,.2,1)}',
      '@media (prefers-reduced-motion:no-preference){.et-pup-bat .et-pf{transform:scale(.5,1);transition-duration:1.2s}.et-pup-arrivee .et-pf{transform:scale(1,1);transition-duration:1.2s}}',
      '.et-pup-zoom .et-pf{transform:scale(1,1);transition-duration:1.2s}',
      /* La pupille ne déborde jamais de son iris (Norman, 2026-11-02) : le disque d'iris coupe tout ce qui sort de son rond (la boîte du sprite est celle du disque d'iris), même au bout du glissement du regard. */
      '.et-iris.et-ir{clip-path:circle(50% at 50% 50%)}',
      /* Quand le regard SUIT la souris (modules/etagere-sommeil-regard-v1.js, classe et-suit sur <html>), la pupille glisse DANS l'iris vers le pointeur, plus loin que l'iris dans l'œil : effet de changement de point de vue (Norman, 2026-11-02 : « la pupille doit se déplacer, là on dirait qu'il regarde toujours tout droit »). Propriété translate (indépendante de transform : la forme fente / ellipse / disque garde ses transitions) ; amplitude limitée pour que la pupille reste dans l'iris : fente 45 %, ellipse 34 %, disque 9 % de sa propre largeur ; vertical 10 %. */
      'html.et-suit .et-pf{translate:calc(var(--et-mx,0)*var(--ptx,45%)) calc(var(--et-my,0)*var(--pty,10%));transition:transform .6s cubic-bezier(.4,0,.2,1),translate .14s ease-out}',
      'html.et-suit.et-pup-bat .et-pf{--ptx:34%}',
      'html.et-suit.et-pup-arrivee .et-pf,html.et-suit.et-pup-zoom .et-pf{--ptx:7%;--pty:4%}',
      '@media (prefers-reduced-motion:reduce){.et-pf{transition:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__={skins:SKINS,html:html,css:css,arrondir:arrondir,zoom:zoom,entree:entree};
})();
