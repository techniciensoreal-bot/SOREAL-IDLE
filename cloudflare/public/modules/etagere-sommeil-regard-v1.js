/*
 * SOREAL IDLE — le chat-étagère de la Garderie : ses YEUX SUIVENT la souris, et il S'ENDORT de temps en temps (Norman, 2026-11-02 : « les armoires chats doivent dormir aussi, mais pas de ronflement » ;
 * « quand on approche la souris autour d'eux, les yeux doivent suivre la souris »).
 *
 * Regard : quand le pointeur (souris, jamais le doigt) passe dans la zone autour du chat (le cadre élargi d'une marge), le regard se tourne vers lui ; hors de la zone, le regard reprend ses mouvements habituels
 * (modules/etagere-expression-v1.js). La direction (-1 à 1 sur chaque axe) est posée en variables CSS sur <html> (--et-mx, --et-my) : chaque iris la multiplie par SON amplitude (--ax, --ay : jamais hors du blanc).
 * Sommeil : après un long moment de présence à l'écran (3 à 8 minutes, le délai n'avance que le temps où le chat est VU), les paupières se ferment, de petits « Z » montent près de sa tête, SANS aucun bruit
 * (pas de ronflement) ; il se réveille tout seul après 40 à 90 s de présence, ou quand on clique sur lui. Les yeux ne suivent pas la souris pendant qu'il dort.
 * Règle n°4 : tout l'état est porté par des classes de <html> (et-suit, et-dort) et des variables CSS de <html>, jamais retirées par un redessin ; les « Z » forment un calque `data-morph-garder` remis juste après
 * chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__). Règle n°3 : les « Z » apparaissent en fondu, montent toujours dans le même sens et disparaissent en fondu (opacité 0 à 0 % et à 100 %).
 * Mouvement réduit : le regard ne suit pas, les « Z » ne bougent pas (paupières seulement). Aucune phrase, rien dans les notes de mise à jour.
 *
 *   window.__SOREAL_IDLE_ETAGERE_SOMMEIL_V1__ = { direction(ptr, centre), dort(), reveiller(), endormir(), etat() }
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_SOMMEIL_V1__)return;
  var R=document.documentElement;
  var STYLE_ID='et-sommeil-style-v1';
  var PAS=1000,ATTENTE_MIN=180000,ATTENTE_MAX=480000,SOMMEIL_MIN=40000,SOMMEIL_MAX=90000;
  var MARGE_MIN=160;      /* px : zone de suivi autour du cadre du chat */
  var RAYON_PLEIN=120;    /* px : à cette distance de l'œil, le regard est au bout de son amplitude */

  function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches);}catch(_e){return false;}}
  function clamp(v,a,b){return v<a?a:(v>b?b:v);}
  /* Direction du regard : du centre de l'œil vers le pointeur, plus ou moins franche selon la distance (loin de l'œil : plein ; sur l'œil : centré). */
  function direction(ptr,centre){
    var dx=ptr.x-centre.x,dy=ptr.y-centre.y,d=Math.sqrt(dx*dx+dy*dy);
    if(!(d>0))return {x:0,y:0};
    var k=Math.min(1,d/RAYON_PLEIN);
    return {x:clamp(dx/d*k,-1,1),y:clamp(dy/d*k,-1,1)};
  }

  function css(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=[
      /* le regard suit le pointeur : l'animation habituelle de l'iris est remplacée par la direction du pointeur (transition courte) */
      'html.et-suit .et-oeil .et-iris.et-ir{animation:none;transform:translate(calc(var(--ax,0%)*var(--et-mx,0)),calc(var(--ay,0%)*var(--et-my,0)));transition:transform .14s ease-out}',
      /* il dort : paupières fermées (pose « fermé » = translate 0), regard centré, plus d'animation de clignement */
      'html.et-dort .et-oeil .et-paup.et-sp{animation:none;transform:translate(0,0);transition:transform .9s ease-in-out}',
      'html.et-dort .et-oeil .et-iris.et-ir{animation:none;transform:none}',
      '.et-zzz{position:absolute;z-index:8;width:0;height:0;pointer-events:none}',
      '.et-zzz b{position:absolute;left:0;top:0;font:900 clamp(14px,3.4cqw,26px)/1 system-ui,sans-serif;color:#eaf2ff;text-shadow:0 1px 0 #000,0 0 6px rgba(130,170,255,.8);opacity:0;animation:etZ 3.6s linear infinite}',
      '.et-zzz b:nth-child(2){animation-delay:-1.2s;font-size:1.25em}.et-zzz b:nth-child(3){animation-delay:-2.4s;font-size:1.5em}',
      '@keyframes etZ{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:1}75%{opacity:1}100%{opacity:0;transform:translate(1.6em,-3.2em) scale(1.1)}}',
      '@media (prefers-reduced-motion:reduce){.et-zzz b{animation:none;opacity:1}.et-zzz b:nth-child(2){transform:translate(.8em,-1.4em)}.et-zzz b:nth-child(3){transform:translate(1.6em,-2.8em)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* le chat visible (le vrai, pas la copie figée posée pendant une transition d'apparence) */
  function figure(){
    var l=document.querySelectorAll('.gd-fig'),i,f;
    for(i=0;i<l.length;i++){
      f=l[i];
      if(f.closest&&f.closest('[data-morph-garder]'))continue;
      return f;
    }
    return null;
  }
  function visible(f){
    if(!f||document.hidden)return false;
    var r=f.getBoundingClientRect();
    return r.width>0&&r.height>0&&r.bottom>0&&r.top<(window.innerHeight||0);
  }

  /* ---------- regard ---------- */
  var suit=false,attente=null;
  function relacher(){
    if(suit){suit=false;R.classList.remove('et-suit');}
  }
  function suivre(ev){
    if(ev&&ev.pointerType==='touch')return;
    if(R.classList.contains('et-dort')||reduit()){relacher();return;}
    var f=figure();
    if(!visible(f)){relacher();return;}
    var r=f.getBoundingClientRect(),marge=Math.max(MARGE_MIN,r.width*0.6);
    var x=ev.clientX,y=ev.clientY;
    if(!(x>r.left-marge&&x<r.right+marge&&y>r.top-marge&&y<r.bottom+marge)){relacher();return;}
    var o=f.querySelector('.et-oeil'),c=o?o.getBoundingClientRect():r;
    var d=direction({x:x,y:y},{x:c.left+c.width/2,y:c.top+c.height/2});
    R.style.setProperty('--et-mx',d.x.toFixed(3));
    R.style.setProperty('--et-my',d.y.toFixed(3));
    if(!suit){suit=true;R.classList.add('et-suit');}
  }
  function surMouvement(ev){
    attente=ev;
    if(surMouvement.prevu)return;
    surMouvement.prevu=window.requestAnimationFrame(function(){surMouvement.prevu=0;var e=attente;attente=null;if(e){try{suivre(e);}catch(_e){}}});
  }

  /* ---------- sommeil ---------- */
  var present=0,seuil=0,duree=0,dort=false;
  function tirer(min,max){return min+Math.floor(Math.random()*(max-min));}
  function posZ(f,calque){
    var o=f.querySelector('.et-oeil'),r=f.getBoundingClientRect();
    if(!o||!r.width)return;
    var c=o.getBoundingClientRect();
    calque.style.left=((c.right-r.left)/r.width*100).toFixed(2)+'%';
    calque.style.top=((c.top-r.top)/r.height*100).toFixed(2)+'%';
  }
  /* calque des « Z » : présent seulement pendant le sommeil, remis après chaque redessin */
  function assurerZ(){
    var f=figure();
    var ancien=document.querySelectorAll('.et-zzz'),i;
    if(!dort||!f){for(i=0;i<ancien.length;i++)if(ancien[i].parentNode)ancien[i].parentNode.removeChild(ancien[i]);return;}
    var z=f.querySelector('.et-zzz');
    if(!z){
      z=document.createElement('div');
      z.className='et-zzz';
      z.setAttribute('data-morph-garder','');
      z.setAttribute('aria-hidden','true');
      z.innerHTML='<b>z</b><b>Z</b><b>z</b>';
      f.appendChild(z);
    }
    posZ(f,z);
  }
  function endormir(){
    if(dort)return;
    dort=true;duree=tirer(SOMMEIL_MIN,SOMMEIL_MAX);present=0;
    relacher();
    R.classList.add('et-dort');
    assurerZ();
  }
  function reveiller(){
    if(!dort)return;
    dort=false;present=0;seuil=tirer(ATTENTE_MIN,ATTENTE_MAX);
    R.classList.remove('et-dort');
    assurerZ();
  }
  function pas(){
    var f=figure();
    if(!visible(f))return;   /* le délai n'avance que le temps où le chat est vu */
    present+=PAS;
    if(dort){if(present>=duree)reveiller();else assurerZ();return;}
    if(!seuil)seuil=tirer(ATTENTE_MIN,ATTENTE_MAX);
    if(present>=seuil)endormir();
  }
  function surClic(ev){
    if(!dort)return;
    var f=figure();
    if(f&&ev.target&&f.contains&&f.contains(ev.target))reveiller();
  }

  css();
  if(document.addEventListener){
    document.addEventListener('pointermove',surMouvement,{passive:true});
    document.addEventListener('pointerdown',surClic,{capture:true,passive:true});
    document.addEventListener('mouseleave',relacher);
  }
  if(typeof window.setInterval==='function')window.setInterval(function(){try{pas();}catch(_e){}},PAS);
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{assurerZ();}catch(_e){}});

  window.__SOREAL_IDLE_ETAGERE_SOMMEIL_V1__={direction:direction,dort:function(){return dort;},reveiller:reveiller,endormir:endormir,etat:function(){return {dort:dort,suit:suit,present:present,seuil:seuil};}};
})();
