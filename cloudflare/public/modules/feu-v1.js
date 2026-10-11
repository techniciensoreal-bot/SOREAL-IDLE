/*
 * SOREAL IDLE — lueur d'un feu de bois (Norman, 2026-10-07 : « quand c'est le bruit de feu qui crépite, un effet de luminosité qui éclaire les menus où on se trouve, comme un feu de bois »).
 *
 * Quand la piste d'ambiance qui joue est celle du feu (Fireplace…), l'écran se teinte d'une lumière chaude qui monte du bas, comme si les menus étaient éclairés par une cheminée dans une
 * pièce sombre. La flamme vacille : l'intensité et le point lumineux changent en douceur, au hasard, plusieurs fois par seconde ; quand la piste crépite (pic d'énergie dans les aigus,
 * mesuré avec le même contexte audio que l'ambiance), un petit éclat plus vif jaillit. Sans analyse audio possible (iPhone, iPad), le vacillement seul prend le relais.
 *
 * Doux pour les yeux : lueur modérée, jamais de blanc ni de flash ; rien du tout quand le système demande moins d'animations ; rien n'intercepte les clics (pointer-events: none) ;
 * elle ne se montre que si on ENTEND le feu (piste en cours et volume d'ambiance au-dessus de zéro). Le décor est retiré de la page dès que la piste s'arrête.
 *
 *   window.__SOREAL_IDLE_FEU_V1__ = { demarrer(), arreter(), crepiter(), actif(), estFeu(cle), evaluer() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_FEU_V1__)return;

  var MOTIF=/fire|feu|chemin|crackl|crepit|crépit|bonfire|campfire|flame|flamme/i;
  var racine=null,lueur=null,eclat=null,foyers=[];
  var NB_FOYERS=5;
  var actif=false,minuteurVacille=0,minuteurAnalyse=0,analyseur=null,sourceAnalyse=null,moyenne=0,dernierEclat=0;

  function estFeu(cle){return MOTIF.test(String(cle||''));}
  function mouvementReduit_(){
    try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}
  }
  function volumeAmbiance_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getAmbiance==='function'?Number(r.getAmbiance()):0.35;
    return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0.35;
  }

  /* ---------- Décor ---------- */
  function style_(){
    if(document.getElementById('feu-style-v1'))return;
    var s=document.createElement('style');s.id='feu-style-v1';
    s.textContent=[
      /* Allégé (Norman, 2026-10-10 : « les menus qui glissent perdent des FPS, je crois que c'est la cheminée ») : calque isolé (contain), UN seul calque lumineux (les voiles « ombre » et « chaleur » étaient redondants), vacillement par une animation d'opacité du navigateur au lieu d'une variable CSS réécrite 5 à 14 fois par seconde, analyse audio moins fréquente. */
      '#soreal-feu-v1{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity 2.2s ease;overflow:hidden;contain:strict;}',
      '#soreal-feu-v1 .fe-ombre,#soreal-feu-v1 .fe-chaleur{display:none;}',
      '#soreal-feu-v1.actif{opacity:1;}',
      /* pièce à peine assombrie : la lumière du foyer vit sur les CONTOURS de l'écran (Norman, 2026-10-08 : « moins sur le centre de l'écran, plus sur les contours ») */
      '#soreal-feu-v1 .fe-ombre{position:absolute;inset:0;background:radial-gradient(ellipse 95% 90% at 50% 52%,rgba(0,0,0,0) 45%,rgba(10,4,0,.12) 100%);}',
      /* la lueur chaude : vraiment les BORDS (Norman, 2026-10-08 : « un peu moins en bas au centre, vraiment les bords ») : centre et milieu du bas dégagés, lumière qui s'épaissit sur les côtés, en haut et aux coins ; jamais de blanc */
      /* Lueur de fond FIXE et très douce (Norman, 2026-10-11 : « moins forte, plus ciblée, par endroits qui changent : là on dirait une lumière qui s'allume et s'éteint ») : elle ne vacille plus ; la vie vient des foyers ci-dessous. */
      '#soreal-feu-v1 .fe-lueur{position:absolute;inset:0;opacity:.34;'+
        'background:radial-gradient(ellipse 50% 68% at 50% 50%,rgba(255,140,50,0) 56%,rgba(255,130,45,.17) 80%,rgba(230,95,28,.36) 100%),'+
        'radial-gradient(ellipse 60% 38% at var(--fe-x,50%) 114%,rgba(255,150,60,.08),rgba(255,125,40,0) 72%);}',
      /* voile très léger, uniquement sur les bords */
      '#soreal-feu-v1 .fe-chaleur{position:absolute;inset:0;opacity:calc(var(--fe-i,.8) * .8);transition:opacity 140ms ease-out;'+
        'background:radial-gradient(ellipse 50% 68% at 50% 50%,rgba(255,110,30,0) 60%,rgba(255,105,28,.09) 100%);}',
      /* foyers : petites taches de lumière chaude sur les bords, chacune s'allume, vacille, s'éteint puis renaît ailleurs */
      '#soreal-feu-v1 .fe-foyer,#soreal-feu-v1 .fe-eclat{position:absolute;left:0;top:0;width:34vmax;height:34vmax;border-radius:50%;opacity:0;will-change:opacity,transform;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,150,55,.30) 0,rgba(255,125,40,.13) 38%,rgba(255,110,30,0) 68%);}',
      '#soreal-feu-v1 .fe-eclat{width:22vmax;height:22vmax;background:radial-gradient(circle,rgba(255,175,95,.34) 0,rgba(255,150,70,.12) 42%,rgba(255,130,50,0) 70%);}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function monter_(){
    if(racine&&racine.parentNode)return racine;
    style_();
    racine=document.createElement('div');racine.id='soreal-feu-v1';racine.setAttribute('aria-hidden','true');
    racine.innerHTML='<div class="fe-ombre"></div><div class="fe-lueur"></div><div class="fe-chaleur"></div>'+(new Array(NB_FOYERS+1).join('<div class="fe-foyer"></div>'))+'<div class="fe-eclat"></div>';
    document.body.appendChild(racine);
    lueur=racine.querySelector('.fe-lueur');eclat=racine.querySelector('.fe-eclat');
    foyers=typeof racine.querySelectorAll==='function'?Array.prototype.slice.call(racine.querySelectorAll('.fe-foyer')):[];
    return racine;
  }

  /* ---------- Vacillement : la flamme change de force et de place au hasard ---------- */
  /* Un emplacement au hasard, toujours sur les BORDS de l'écran (jamais au centre). */
  function emplacement_(){
    var c=Math.floor(Math.random()*4),x,y;
    if(c===0){x=-4+Math.random()*14;y=8+Math.random()*88;}
    else if(c===1){x=90+Math.random()*14;y=8+Math.random()*88;}
    else if(c===2){x=4+Math.random()*92;y=90+Math.random()*16;}
    else{x=4+Math.random()*92;y=-6+Math.random()*14;}
    return {x:x,y:y};
  }
  /* Un foyer : il s'allume doucement, vacille, s'éteint, puis recommence à un autre endroit (opacité et transform seulement). */
  function foyer_(el,delai){
    if(!actif||!el||typeof el.animate!=='function')return;
    var e=emplacement_(),dur=4200+Math.random()*4800,pic=0.5+Math.random()*0.45,dx=(Math.random()*2-1)*5,dy=-2-Math.random()*4;
    el.style.left=e.x.toFixed(1)+'%';el.style.top=e.y.toFixed(1)+'%';
    var an=null;
    try{if(typeof el.getAnimations==='function')el.getAnimations().forEach(function(x){x.onfinish=null;x.cancel();});}catch(_e){}
    try{
      an=el.animate([
        {opacity:0,transform:'translate(-50%,-50%) scale(.8)'},
        {opacity:pic,transform:'translate(calc(-50% + '+(dx*.4).toFixed(1)+'vmax),calc(-50% + '+(dy*.4).toFixed(1)+'vmax)) scale(1)',offset:.28},
        {opacity:pic*.5,offset:.46},
        {opacity:pic*.92,transform:'translate(calc(-50% + '+dx.toFixed(1)+'vmax),calc(-50% + '+dy.toFixed(1)+'vmax)) scale(1.06)',offset:.7},
        {opacity:0,transform:'translate(calc(-50% + '+dx.toFixed(1)+'vmax),calc(-50% + '+dy.toFixed(1)+'vmax)) scale(.9)'}
      ],{duration:dur,delay:delai||0,easing:'ease-in-out',fill:'both'});
    }catch(_e){an=null;}
    if(an)an.onfinish=function(){foyer_(el,Math.random()*1200);};
  }
  function vaciller_(){
    clearTimeout(minuteurVacille);
    if(!actif||!racine)return;
    if(foyers.length&&!foyers.__lances){
      foyers.__lances=true;
      for(var i=0;i<foyers.length;i++)foyer_(foyers[i],Math.random()*3500);
    }
  }

  /* ---------- Crépitement : un petit éclat plus vif ---------- */
  function crepiter(){
    if(!actif||mouvementReduit_()||!racine)return false;
    var t=Date.now();
    if(t-dernierEclat<120)return false;
    dernierEclat=t;
    if(eclat&&eclat.animate){
      try{
        var e=emplacement_();eclat.style.left=e.x.toFixed(1)+'%';eclat.style.top=e.y.toFixed(1)+'%';
        eclat.animate([{opacity:0},{opacity:0.8,offset:.12},{opacity:0.2,offset:.4},{opacity:0}],{duration:260+Math.random()*180,easing:'ease-out'});
      }catch(_e){}
    }
    return true;
  }

  /* ---------- Suivre les crépitements de la piste ---------- */
  function arreterAnalyse_(){
    clearInterval(minuteurAnalyse);minuteurAnalyse=0;
    if(sourceAnalyse&&analyseur){try{sourceAnalyse.disconnect(analyseur);}catch(_e){}}
    analyseur=null;sourceAnalyse=null;moyenne=0;
  }
  function analyser_(gainNode,contexte){
    arreterAnalyse_();
    if(!gainNode||!contexte||typeof contexte.createAnalyser!=='function')return false;
    try{
      analyseur=contexte.createAnalyser();analyseur.fftSize=512;analyseur.smoothingTimeConstant=0.2;
      gainNode.connect(analyseur);sourceAnalyse=gainNode;
      var buf=new Uint8Array(analyseur.frequencyBinCount);
      var debut=Math.floor(buf.length*0.35);
      minuteurAnalyse=setInterval(function(){
        if(!analyseur||document.hidden)return;
        analyseur.getByteFrequencyData(buf);
        var somme=0,n=0;for(var i=debut;i<buf.length;i++){somme+=buf[i];n+=1;}
        var niveau=n?somme/n/255:0;
        if(moyenne===0)moyenne=niveau;
        if(niveau>0.06&&niveau>moyenne*1.7)crepiter();
        moyenne=moyenne*0.94+niveau*0.06;
      },110);
      return true;
    }catch(_e){analyseur=null;sourceAnalyse=null;return false;}
  }

  function demarrer(detail){
    if(mouvementReduit_())return false;
    actif=true;
    monter_();
    setTimeout(function(){if(racine&&actif)racine.classList.add('actif');},30);
    vaciller_();
    var reactif=detail&&analyser_(detail.gainNode,detail.contexte);
    if(!reactif){
      /* sans analyse audio : quelques étincelles au hasard */
      (function hasard_(){
        if(!actif)return;
        setTimeout(function(){crepiter();hasard_();},900+Math.random()*2200);
      })();
    }
    return true;
  }
  function arreter(){
    actif=false;
    clearTimeout(minuteurVacille);minuteurVacille=0;
    foyers.__lances=false;
    arreterAnalyse_();
    if(racine)racine.classList.remove('actif');
    /* Après le fondu de sortie, le décor est retiré de la page : plus aucun coût sans feu. */
    setTimeout(function(){if(!actif&&racine&&racine.parentNode){racine.parentNode.removeChild(racine);racine=null;lueur=null;eclat=null;foyers=[];}},2500);
  }

  /* Le feu ne se montre que si on l'ENTEND : piste de feu en cours ET volume d'ambiance au-dessus de zéro. */
  var courante=null;
  /* Réglages > Effets visuels : l'effet peut être coupé pour les téléphones moins puissants (mémorisé sur l'appareil, actif par défaut). */
  /* Désactivée par défaut (Norman, 2026-10-08 : « ça fait ramer le téléphone ») : on ne l'active qu'en cochant l'effet dans les Réglages ('1'). */
  function effetAutorise_(){try{return localStorage.getItem('soreal_idle_effet_feu_v1')==='1';}catch(_e){return false;}}
  function evaluer_(){
    if(courante&&estFeu(courante.cle)&&volumeAmbiance_()>0&&effetAutorise_()){if(!actif)demarrer(courante);}
    else if(actif)arreter();
  }
  window.addEventListener('soreal-effets-v1',function(){evaluer_();});
  /* Filet de sécurité : si les sons d'ambiance sont coupés par un chemin qui ne prévient pas (autre onglet, application parente), l'effet s'éteint au plus tard 2 s après. */
  setInterval(function(){if(!document.hidden)evaluer_();},2000);
  window.addEventListener('soreal-ambiance-v1',function(e){
    courante=(e&&e.detail)||{};
    evaluer_();
  });
  try{
    var vol=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    if(vol&&typeof vol.onChange==='function')vol.onChange(evaluer_);
  }catch(_e){}

  window.__SOREAL_IDLE_FEU_V1__={demarrer:function(){return demarrer(null);},arreter:arreter,crepiter:crepiter,actif:function(){return actif;},estFeu:estFeu,evaluer:evaluer_};
})();
