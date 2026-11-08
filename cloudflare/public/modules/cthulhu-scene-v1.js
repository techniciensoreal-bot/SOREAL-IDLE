/*
 * CTHULHU (« Lhu »), SCÈNES DE VOL (Norman, 2026-11-07 : « Cthulhu apparaît en bas à droite, depuis la droite de l'écran, en volant latéralement. Il s'arrête, nous regarde avec des ??? dans une bulle de pensées,
 * puis il vole en zoom sur l'écran… il se retourne et après 1 seconde, en volant en vue arrière, il va se replacer à un endroit qui ne gêne pas le joueur… l'idéal serait qu'il se pose sur le bouton Nuke »).
 * Un seul Cthulhu flottant (position fixe, par-dessus la page, jamais sous le morph : data-morph-garder) animé par l'API d'animation du navigateur (Web Animations) entre des positions NOMMÉES.
 * Les scènes sont choisies par l'étape du guide (champ `scene`, menu Admin > Tutoriel) : le texte et la voix restent ceux du guide, ce module ne fait que bouger la mascotte.
 *   arrivee : entre par la droite en volant (de face), s'arrête en bas à droite avec « ??? », puis vole en zoom au centre de l'écran.
 *   retourne: se retourne sur place, en une image (au début de la phrase qui précède son départ).
 *   pose    : se retourne (si ce n'est déjà fait) (au centre), attend 1 s, vole de dos jusqu'à sa place (le bouton Nuke, sinon le bouton Fight, sinon le bas à droite), puis se retourne face au joueur.
 *   place   : va directement à sa place (sans le tour de vol).
 * Règle n°3 : les mouvements sont des trajets simples (jamais de boucle) ; prefers-reduced-motion : il apparaît directement à sa place.
 * window.__SOREAL_IDLE_CTHULHU_SCENE_V1__ = { jouer(scene, options) -> Promise, enlever(), existe() }
 */
(function(){
  'use strict';
  var ID='soreal-idle-cth-scene-v1',ID_STYLE='soreal-idle-cth-scene-style-v1';
  var BASE=150;   /* taille du dessin de cthulhu-v1.js (px) : toute taille passe par scale */
  var etat={racine:null,interne:null,cible:null,k:1,x:0,y:0,suivi:false,jeton:0};

  function C(){return window.__SOREAL_IDLE_CTHULHU_V1__||null;}
  function reduit(){try{return window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(_e){return false;}}
  function attendre(ms){return new Promise(function(ok){setTimeout(ok,ms);});}
  function V(){return {W:window.innerWidth||1000,H:window.innerHeight||700};}
  /* Tailles : petit (sur sa place) et grand (zoomé, comme la mascotte du tutoriel : 66 % de la hauteur, 96 % de la largeur au plus). */
  function kPetit(){var v=V();return (v.W<700?110:140)/BASE;}
  function kGrand(){var v=V();return Math.min(0.54*v.H,0.92*v.W)/BASE;}   /* un peu moins grand : sa bulle tient AU-DESSUS de sa tête */

  function style(){
    if(document.getElementById(ID_STYLE))return;
    var s=document.createElement('style');s.id=ID_STYLE;
    s.textContent='#'+ID+'{position:fixed;left:0;top:0;width:'+BASE+'px;height:'+BASE+'px;z-index:2147483000;pointer-events:none;transform-origin:0 0;will-change:transform}'+
      '#'+ID+' .cth-sc-in{display:block;width:100%;height:100%;transform-origin:50% 50%}'+
      '#'+ID+' .cth-v1{width:100%;height:100%}'+
      /* « ??? » au-dessus de sa tête alors qu'il VOLE (il ne se pose que sur le bouton Nuke) */
      '#'+ID+' .cth-sc-q{position:absolute;inset:0;width:100%;height:100%;overflow:visible;display:none}#'+ID+'[data-q] .cth-sc-q{display:block}';
    (document.head||document.documentElement).appendChild(s);
  }
  function creer(expr){
    var cth=C();if(!cth)return null;
    style();
    var r=document.getElementById(ID);
    if(r&&r.parentNode)r.parentNode.removeChild(r);
    r=document.createElement('div');r.id=ID;r.setAttribute('aria-hidden','true');r.setAttribute('data-morph-garder','1');r.setAttribute('data-soreal-tts-ignore','1');
    r.innerHTML='<span class="cth-sc-in">'+cth.html(expr||'vole','')+'<svg class="cth-sc-q" viewBox="0 0 1254 1254" aria-hidden="true" focusable="false"><g class="cth-pt"><text x="930" y="230" font-family="Bangers,Impact,sans-serif" font-size="240" fill="#ffe27a" stroke="#6b4b0a" stroke-width="22" paint-order="stroke" text-anchor="middle">'+'?'.repeat(3)+'</text></g></svg></span>';
    document.body.appendChild(r);
    etat.racine=r;etat.interne=r.firstChild;
    return r;
  }
  function visage(expr){
    var cth=C(),rac=etat.racine&&etat.racine.querySelector('.cth-v1');
    if(cth&&rac)cth.definir(rac,expr);
  }
  function poser(x,y,k){
    etat.x=x;etat.y=y;etat.k=k;
    if(etat.racine)etat.racine.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px) scale('+k+')';
  }
  /* Trajet : de la position actuelle à (x,y,k) ; le style final est écrit à la fin (pas de fill:forwards qui resterait collé). */
  function aller(x,y,k,ms,fonction,roulis){
    var r=etat.racine;
    if(!r)return Promise.resolve();
    var de='translate('+Math.round(etat.x)+'px,'+Math.round(etat.y)+'px) scale('+etat.k+')';
    var vers='translate('+Math.round(x)+'px,'+Math.round(y)+'px) scale('+k+')';
    var jeton=etat.jeton;
    if(reduit()||typeof r.animate!=='function'){poser(x,y,k);return Promise.resolve();}
    var kf=[{transform:de}];
    if(roulis)kf.push({transform:'translate('+Math.round((etat.x+x)/2)+'px,'+Math.round(Math.min(etat.y,y)-V().H*0.04)+'px) scale('+((etat.k+k)/2)+')',offset:.5});
    kf.push({transform:vers});
    var a=r.animate(kf,{duration:ms,easing:fonction||'cubic-bezier(.45,0,.35,1)',fill:'both'});
    return a.finished.then(function(){
      if(jeton!==etat.jeton||!etat.racine)return;
      poser(x,y,k);
      try{a.cancel();}catch(_e){}
    }).catch(function(){});
  }
  /* Demi-tour en UNE image (Norman, 2026-11-07) : la vue change d'un coup, sans transition. */
  function tourner(expr){visage(expr);return Promise.resolve();}

  /* La page se met en place (téléphone comme PC) : la barre de vie du boss (environ 70 px au-dessus de son portrait), le boss, le joueur et le bouton visé restent à l'écran ; si tout ne tient pas, le bouton passe avant. */
  function cadrer(el){
    if(!el)return;
    var v=V(),haut=8;
    /* le bandeau fixe en haut de l'écran (statistiques, vie) : tout ce qui doit rester visible commence dessous */
    try{var h=document.elementFromPoint(v.W/2,4);while(h&&h!==document.body){var cs=getComputedStyle(h);if(cs.position==='fixed'||cs.position==='sticky'){var rh=h.getBoundingClientRect();if(rh.bottom<v.H*0.4)haut=Math.max(haut,rh.bottom+8);break;}h=h.parentElement;}}catch(_e){}
    var por=document.getElementById('sorealIdleBossImageHostV36'),r=el.getBoundingClientRect(),d=0;
    if(por){d=(por.getBoundingClientRect().top-70)-haut;   /* la barre de vie du boss est environ 70 px au-dessus du portrait */}
    var bas=r.bottom-d,place=BASE*kPetit();
    if(bas>v.H-8)d+=bas-(v.H-8);
    if(r.top-d-place<haut&&por===null)d=0;
    if(Math.abs(d)>1)window.scrollBy(0,Math.round(d));
  }
  /* Sa place : posé sur le bouton Nuke (ou à défaut le bouton Fight) ; il peut dépasser un peu sur le boss, jamais beaucoup. */
  function cibleAtterrissage(selecteur){
    var liste=[selecteur,'#sorealIdleBossNukeV1','#sorealIdleBossStartV100'];
    for(var i=0;i<liste.length;i++){
      if(!liste[i])continue;
      var el=null;try{el=document.querySelector(liste[i]);}catch(_e){}
      if(el){var r=el.getBoundingClientRect();if(r.width>0&&r.height>0)return el;}
    }
    return null;
  }
  /* Il ne se pose que sur le bouton Nuke (Norman, 2026-11-07) ; partout ailleurs il reste en vol, ailes qui battent. */
  function posable(selecteur){var el=cibleAtterrissage(selecteur);return Boolean(el&&el.id==='sorealIdleBossNukeV1');}
  function placePetit(el){
    var v=V(),k=kPetit(),S=BASE*k;
    if(!el)return {x:v.W-S-10,y:v.H-S-10,k:k};
    var r=el.getBoundingClientRect();
    /* pieds sur le haut du bouton (le bas du dessin est un peu au-dessus du bas de la boîte) */
    var nuke=el.id==='sorealIdleBossNukeV1';
    if(!nuke){k=kPetit()*0.8;S=BASE*k;}   /* en vol près d'un bouton à cliquer : plus petit, il cache moins la page */
    var x=r.left+r.width/2-S/2,y=r.top-S+Math.round(S*(nuke?0.12:-0.02));
    if(!nuke&&y<4)y=r.bottom+6;   /* en vol : au-dessus de sa cible, sinon dessous (jamais par-dessus) */
    x=Math.max(4,Math.min(v.W-S-4,x));y=Math.max(4,Math.min(v.H-S-4,y));
    return {x:x,y:y,k:k};
  }
  function placeGrand(){var v=V(),k=kGrand(),S=BASE*k;return {x:(v.W-S)/2,y:Math.min(0.3*v.H,v.H-S-4),k:k};}
  /* Il suit sa cible quand la page défile ou change de taille (jamais de minuterie : événements seulement). */
  function suivre(selecteur){
    etat.cible=selecteur||'';
    if(etat.suivi)return;
    etat.suivi=true;
    var f=function(){
      if(!etat.racine||etat.mode!=='pose'){return;}
      var p=placePetit(cibleAtterrissage(etat.cible));
      poser(p.x,p.y,p.k);
    };
    window.addEventListener('scroll',f,{passive:true,capture:true});
    window.addEventListener('resize',f);
    etat.arretSuivi=function(){window.removeEventListener('scroll',f,true);window.removeEventListener('resize',f);etat.suivi=false;};
  }

  function enlever(){
    etat.jeton++;etat.mode='';
    if(etat.arretSuivi){etat.arretSuivi();etat.arretSuivi=null;}
    var r=document.getElementById(ID);if(r&&r.parentNode)r.parentNode.removeChild(r);
    etat.racine=null;etat.interne=null;
  }

  /* Fin du guide : il s'envole par la droite (de dos, ailes qui battent) puis disparaît. */
  function partir(){
    var jeton=++etat.jeton;
    if(etat.arretSuivi){etat.arretSuivi();etat.arretSuivi=null;}
    etat.mode='';
    if(!etat.racine)return Promise.resolve();
    var v=V();
    visage('dos');
    return aller(v.W+40,etat.y-v.H*0.1,etat.k,900,'cubic-bezier(.5,0,.9,.6)',false).then(function(){
      if(jeton!==etat.jeton)return;
      enlever();
    });
  }
  function arrivee(){
    var v=V(),kp=kPetit(),S=BASE*kp,jeton=etat.jeton;
    var fin=placePetit(null);
    /* La page de Fight Boss est mise en place AVANT l'arrivée de Lhu (Norman, 2026-11-07) : rien ne bouge quand il se pose sur Nuke. */
    cadrer(cibleAtterrissage('#sorealIdleBossNukeV1'));
    creer('vole');
    poser(v.W+30,fin.y-v.H*0.05,kp);   /* hors de l'écran, à droite */
    return aller(fin.x,fin.y,kp,1300,'cubic-bezier(.2,.6,.3,1)',false).then(function(){
      if(jeton!==etat.jeton)return;
      cadrer(cibleAtterrissage('#sorealIdleBossNukeV1'));   /* la page s'est stabilisée : dernière retouche, hors de vue de la scène */
      if(etat.racine)etat.racine.setAttribute('data-q','1');   /* il vole sur place, « ??? » au-dessus de la tête */
      return attendre(1200);
    }).then(function(){
      if(jeton!==etat.jeton)return;
      if(etat.racine)etat.racine.removeAttribute('data-q');
      var g=placeGrand();
      return aller(g.x,g.y,g.k,1100,'cubic-bezier(.5,0,.3,1)',false);
    }).then(function(){
      if(jeton!==etat.jeton)return;
      etat.mode='grand';   /* zoomé, il vole encore */
    });
  }
  function pose(selecteur){
    var jeton=etat.jeton;
    var g=placeGrand();
    if(!etat.racine||etat.mode!=='grand'){creer('vole');poser(g.x,g.y,g.k);}
    /* S'il s'est déjà retourné au début de la phrase (scène « retourne »), il ne se retourne pas deux fois. */
    var deja=etat.dos===true;etat.dos=false;
    return (deja?Promise.resolve():tourner('dos')).then(function(){
      if(jeton!==etat.jeton)return;
      return attendre(300);
    }).then(function(){
      if(jeton!==etat.jeton)return;
      var el=cibleAtterrissage(selecteur);
      cadrer(el);
      var p=placePetit(cibleAtterrissage(selecteur));
      return aller(p.x,p.y,p.k,1100,'cubic-bezier(.45,0,.3,1)',true);
    }).then(function(){
      if(jeton!==etat.jeton)return;
      etat.mode='pose';
      suivre(selecteur);
      return tourner(posable(selecteur)?'normal':'vole');   /* de face : posé sur Nuke, sinon toujours en vol */
    });
  }
  function place(selecteur){
    var jeton=etat.jeton;
    var el=cibleAtterrissage(selecteur);
    if(el&&posable(selecteur))cadrer(el);   /* sur Nuke : la page se met en place comme pour la pose */
    else if(el){var r0=el.getBoundingClientRect(),v=V();if(r0.top<60||r0.bottom>v.H-60){try{el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});}catch(_e){}}}
    var p=placePetit(cibleAtterrissage(selecteur));
    if(!etat.racine){creer('vole');var q=placePetit(null);poser(q.x,q.y,q.k);}
    /* Il VOLE pendant le trajet (ailes qui battent, Norman 2026-11-07 : « il retourne sur la borne sans voler ») ; il ne se pose (visage normal) qu'une fois arrivé sur Nuke. */
    visage('vole');
    return aller(p.x,p.y,p.k,900,'cubic-bezier(.45,0,.3,1)',true).then(function(){
      if(jeton!==etat.jeton)return;
      etat.mode='pose';suivre(selecteur);
      visage(posable(selecteur)?'normal':'vole');
    });
  }

  /* jouer(scene, {sur: sélecteur CSS de la place finale}) : promesse résolue à la fin du mouvement (le tutoriel affiche alors le texte et lance la voix). */
  function jouer(scene,opt){
    var o=opt||{},sur=o.sur?String(o.sur):'';
    if(!C())return Promise.resolve();
    if(scene==='arrivee'){etat.jeton++;etat.mode='';if(etat.arretSuivi){etat.arretSuivi();etat.arretSuivi=null;}return arrivee();}
    if(scene==='retourne'){
      /* Demi-tour au DÉBUT de la phrase (Norman, 2026-11-07), en une image, sur place. */
      if(!etat.racine){var gg=placeGrand();creer('vole');poser(gg.x,gg.y,gg.k);}
      tourner('dos');etat.dos=true;etat.mode='grand';
      return Promise.resolve();
    }
    if(scene==='pose')return pose(sur);
    if(scene==='place'){etat.jeton++;return place(sur);}
    return Promise.resolve();
  }
  window.__SOREAL_IDLE_CTHULHU_SCENE_V1__={jouer:jouer,enlever:enlever,partir:partir,rect:function(){var r=document.getElementById(ID);return r?r.getBoundingClientRect():null;},existe:function(){return Boolean(document.getElementById(ID));},SCENES:['arrivee','retourne','pose','place']};
})();
