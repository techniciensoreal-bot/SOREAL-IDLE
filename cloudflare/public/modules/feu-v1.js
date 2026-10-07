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
  var racine=null,lueur=null,eclat=null;
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
      '#soreal-feu-v1{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity 2.2s ease;overflow:hidden;}',
      '#soreal-feu-v1.actif{opacity:1;}',
      /* pièce plus sombre sur les bords : la lumière vient du foyer, en bas */
      '#soreal-feu-v1 .fe-ombre{position:absolute;inset:0;background:radial-gradient(ellipse 120% 90% at var(--fe-x,50%) 108%,rgba(0,0,0,0) 22%,rgba(10,4,0,.26) 100%);}',
      /* la lueur chaude, qui éclaire les menus (fondue dans les couleurs de la page) */
      '#soreal-feu-v1 .fe-lueur{position:absolute;inset:0;opacity:calc(var(--fe-i,.8) * .5);transition:opacity 140ms ease-out;will-change:opacity;'+
        'background:radial-gradient(ellipse 95% 80% at var(--fe-x,50%) 105%,rgba(255,165,80,.20) 0%,rgba(255,130,50,.12) 32%,rgba(200,80,20,.05) 62%,rgba(120,30,0,0) 90%);}',
      '#soreal-feu-v1 .fe-chaleur{position:absolute;inset:0;opacity:calc(var(--fe-i,.8) * .5);transition:opacity 140ms ease-out;'+
        'background:radial-gradient(ellipse 80% 55% at var(--fe-x,50%) 110%,rgba(255,140,40,.07),rgba(255,90,10,.03) 50%,rgba(255,60,0,0) 80%);}',
      '#soreal-feu-v1 .fe-eclat{position:absolute;inset:0;opacity:0;will-change:opacity;background:radial-gradient(ellipse 60% 50% at var(--fe-x,50%) 110%,rgba(255,200,130,.10),rgba(255,140,40,0) 70%);}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function monter_(){
    if(racine&&racine.parentNode)return racine;
    style_();
    racine=document.createElement('div');racine.id='soreal-feu-v1';racine.setAttribute('aria-hidden','true');
    racine.innerHTML='<div class="fe-ombre"></div><div class="fe-lueur"></div><div class="fe-chaleur"></div><div class="fe-eclat"></div>';
    document.body.appendChild(racine);
    lueur=racine.querySelector('.fe-lueur');eclat=racine.querySelector('.fe-eclat');
    return racine;
  }

  /* ---------- Vacillement : la flamme change de force et de place au hasard ---------- */
  function vaciller_(){
    clearTimeout(minuteurVacille);
    if(!actif)return;
    if(racine){
      var base=0.55+Math.random()*0.45;
      /* de temps en temps un creux net (la flamme retombe) puis elle repart */
      if(Math.random()<0.12)base=0.32+Math.random()*0.15;
      racine.style.setProperty('--fe-i',base.toFixed(2));
    }
    minuteurVacille=setTimeout(vaciller_,70+Math.random()*190);
  }

  /* ---------- Crépitement : un petit éclat plus vif ---------- */
  function crepiter(){
    if(!actif||mouvementReduit_()||!racine)return false;
    var t=Date.now();
    if(t-dernierEclat<120)return false;
    dernierEclat=t;
    if(eclat&&eclat.animate){
      try{eclat.animate([{opacity:0},{opacity:0.9,offset:.12},{opacity:0.25,offset:.4},{opacity:0}],{duration:260+Math.random()*180,easing:'ease-out'});}catch(_e){}
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
        if(!analyseur)return;
        analyseur.getByteFrequencyData(buf);
        var somme=0,n=0;for(var i=debut;i<buf.length;i++){somme+=buf[i];n+=1;}
        var niveau=n?somme/n/255:0;
        if(moyenne===0)moyenne=niveau;
        if(niveau>0.06&&niveau>moyenne*1.7)crepiter();
        moyenne=moyenne*0.94+niveau*0.06;
      },50);
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
        setTimeout(function(){crepiter();hasard_();},350+Math.random()*1400);
      })();
    }
    return true;
  }
  function arreter(){
    actif=false;
    clearTimeout(minuteurVacille);minuteurVacille=0;
    arreterAnalyse_();
    if(racine)racine.classList.remove('actif');
    /* Après le fondu de sortie, le décor est retiré de la page : plus aucun coût sans feu. */
    setTimeout(function(){if(!actif&&racine&&racine.parentNode){racine.parentNode.removeChild(racine);racine=null;lueur=null;eclat=null;}},2500);
  }

  /* Le feu ne se montre que si on l'ENTEND : piste de feu en cours ET volume d'ambiance au-dessus de zéro. */
  var courante=null;
  function evaluer_(){
    if(courante&&estFeu(courante.cle)&&volumeAmbiance_()>0){if(!actif)demarrer(courante);}
    else if(actif)arreter();
  }
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
