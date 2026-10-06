/*
 * SOREAL IDLE — orage visuel (Norman, 2026-10-06 : « quand c'est le son d'ambiance avec l'orage, j'aimerais bien que tu simules de l'orage »).
 *
 * Quand la piste d'ambiance qui joue est celle du tonnerre (Thunder.opus), l'écran s'assombrit légèrement, la pluie tombe en filets fins et des éclairs
 * zèbrent le ciel. Les éclairs suivent le son : un coup de tonnerre dans la piste (pic d'énergie dans les graves, mesuré avec le même contexte audio que
 * l'ambiance) déclenche un éclair ; sans analyse audio possible (iPhone, iPad), des éclairs espacés au hasard prennent le relais. Après l'éclair, un grondement
 * synthétisé, discret, roule au loin, au volume de l'ambiance.
 *
 * Doux pour les yeux : au plus trois éclats par éclair, jamais deux éclairs à moins de 5 s d'écart, lueur à 35 % au maximum ; rien du tout quand le système
 * demande moins d'animations (prefers-reduced-motion). Rien n'intercepte les clics (pointer-events: none).
 *
 *   window.__SOREAL_IDLE_ORAGE_V1__ = { demarrer(), arreter(), eclair(), actif(), estOrage(cle) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ORAGE_V1__)return;

  var MOTIF=/thunder|orage|storm|tonnerre/i;
  var ESPACE_MIN_MS=5000;
  var racine=null,flash=null,eclairSvg=null;
  var actif=false,dernierEclair=0,minuteurHasard=0,minuteurAnalyse=0,analyseur=null,sourceAnalyse=null,moyenne=0;

  function estOrage(cle){return MOTIF.test(String(cle||''));}
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
    if(document.getElementById('orage-style-v1'))return;
    var s=document.createElement('style');s.id='orage-style-v1';
    s.textContent=[
      '#soreal-orage-v1{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity 2.4s ease;overflow:hidden;}',
      '#soreal-orage-v1.actif{opacity:1;}',
      '#soreal-orage-v1 .og-ciel{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,12,30,.30),rgba(10,16,34,.12) 55%,rgba(6,12,30,.22));}',
      '#soreal-orage-v1 .og-pluie{position:absolute;inset:-20% -10%;background:repeating-linear-gradient(103deg,rgba(190,210,255,.0) 0 7px,rgba(190,210,255,.30) 7px 8px,rgba(190,210,255,0) 8px 17px);background-size:240px 240px;opacity:.5;animation:og-pluie .55s linear infinite;}',
      '#soreal-orage-v1 .og-pluie.og-p2{background:repeating-linear-gradient(103deg,rgba(190,210,255,0) 0 11px,rgba(190,210,255,.22) 11px 12px,rgba(190,210,255,0) 12px 29px);background-size:310px 310px;opacity:.38;animation-duration:.8s;}',
      '@keyframes og-pluie{from{background-position:0 0}to{background-position:-58px 240px}}',
      '#soreal-orage-v1 .og-flash{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at var(--og-x,50%) 0%,rgba(235,244,255,.95),rgba(170,200,255,.55) 38%,rgba(120,150,230,.12) 75%);mix-blend-mode:screen;}',
      '#soreal-orage-v1 .og-eclair{position:absolute;inset:0;width:100%;height:100%;opacity:0;}',
      '#soreal-orage-v1 .og-eclair polyline{fill:none;stroke:#f4f8ff;vector-effect:non-scaling-stroke;stroke-width:2.6px;stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(0 0 5px #9bc0ff) drop-shadow(0 0 14px #6a9bff);}',
      '#soreal-orage-v1 .og-eclair polyline.og-branche{stroke-width:1.4px;opacity:.8;}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function monter_(){
    if(racine&&racine.parentNode)return racine;
    style_();
    racine=document.createElement('div');racine.id='soreal-orage-v1';racine.setAttribute('aria-hidden','true');
    racine.innerHTML='<div class="og-ciel"></div><div class="og-pluie"></div><div class="og-pluie og-p2"></div><div class="og-flash"></div>'+
      '<svg class="og-eclair" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>';
    document.body.appendChild(racine);
    flash=racine.querySelector('.og-flash');eclairSvg=racine.querySelector('.og-eclair');
    return racine;
  }

  /* ---------- Éclair ---------- */
  function trace_(){
    var x=14+Math.random()*72,y=0,pts=[x+','+y];
    while(y<58+Math.random()*30){y+=5+Math.random()*9;x+=(Math.random()-.5)*14;pts.push(x.toFixed(1)+','+y.toFixed(1));}
    var branche='';
    if(pts.length>3){
      var i=1+Math.floor(Math.random()*(pts.length-2)),b=pts[i].split(','),bx=Number(b[0]),by=Number(b[1]),bp=[bx+','+by];
      var dir=Math.random()<.5?-1:1;
      for(var k=0;k<3;k++){bx+=dir*(3+Math.random()*7);by+=4+Math.random()*7;bp.push(bx.toFixed(1)+','+by.toFixed(1));}
      branche='<polyline class="og-branche" points="'+bp.join(' ')+'"/>';
    }
    return {x:pts[0].split(',')[0],svg:'<polyline points="'+pts.join(' ')+'"/>'+branche};
  }
  function eclair(){
    if(!actif||mouvementReduit_())return false;
    var t=Date.now();
    if(t-dernierEclair<ESPACE_MIN_MS)return false;
    dernierEclair=t;
    monter_();
    var e=trace_();
    flash.style.setProperty('--og-x',e.x+'%');
    eclairSvg.innerHTML=e.svg;
    var eclats=1+Math.floor(Math.random()*3);
    var cumul=0;
    for(var i=0;i<eclats;i++){
      (function(i,debut){
        setTimeout(function(){
          var pic=i===0?0.35:0.22;
          flash.style.transition='opacity 40ms ease-out';flash.style.opacity=String(pic);
          eclairSvg.style.opacity=i===eclats-1&&i>0?'0.5':'0.95';
          setTimeout(function(){flash.style.transition='opacity 220ms ease-in';flash.style.opacity='0';eclairSvg.style.opacity='0';},60+Math.random()*40);
        },debut);
      })(i,cumul);
      cumul+=150+Math.random()*130;
    }
    grondement_(0.4+Math.random()*1.9);
    return true;
  }

  /* ---------- Grondement synthétisé, discret ---------- */
  var ac=null;
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  function construireGrondement_(c,sortie,t,duree,alea){
    var a=typeof alea==='function'?alea:Math.random;
    var n=Math.max(1,Math.floor(c.sampleRate*duree));
    var tampon=c.createBuffer(1,n,c.sampleRate);
    var d=tampon.getChannelData(0);
    var dernier=0;
    for(var i=0;i<n;i++){var b=a()*2-1;dernier=(dernier+0.02*b)/1.02;d[i]=dernier*3.2;}
    var src=c.createBufferSource();src.buffer=tampon;
    var f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(220,t);f.frequency.exponentialRampToValueAtTime(70,t+duree);f.Q.value=0.7;
    var g=c.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(1,t+0.25);
    g.gain.setValueAtTime(0.8,t+0.45);
    g.gain.exponentialRampToValueAtTime(0.9,t+duree*0.35);
    g.gain.exponentialRampToValueAtTime(0.0001,t+duree);
    src.connect(f);f.connect(g);g.connect(sortie);src.start(t);
  }
  function grondement_(delaiSec){
    var v=volumeAmbiance_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.5;maitre.connect(c.destination);
      construireGrondement_(c,maitre,c.currentTime+delaiSec,2.4+Math.random()*1.8);
      return true;
    }catch(_e){return false;}
  }

  /* ---------- Déclenchement : suivre le tonnerre de la piste, sinon le hasard ---------- */
  function hasard_(){
    clearTimeout(minuteurHasard);
    if(!actif)return;
    minuteurHasard=setTimeout(function(){eclair();hasard_();},8000+Math.random()*14000);
  }
  function arreterAnalyse_(){
    clearInterval(minuteurAnalyse);minuteurAnalyse=0;
    if(sourceAnalyse&&analyseur){try{sourceAnalyse.disconnect(analyseur);}catch(_e){}}
    analyseur=null;sourceAnalyse=null;moyenne=0;
  }
  function analyser_(gainNode,contexte){
    arreterAnalyse_();
    if(!gainNode||!contexte||typeof contexte.createAnalyser!=='function')return false;
    try{
      analyseur=contexte.createAnalyser();analyseur.fftSize=512;analyseur.smoothingTimeConstant=0.3;
      gainNode.connect(analyseur);sourceAnalyse=gainNode;
      var buf=new Uint8Array(analyseur.frequencyBinCount);
      var bas=Math.max(2,Math.floor(buf.length*0.12));
      minuteurAnalyse=setInterval(function(){
        if(!analyseur)return;
        analyseur.getByteFrequencyData(buf);
        var somme=0;for(var i=0;i<bas;i++)somme+=buf[i];
        var niveau=somme/bas/255;
        if(moyenne===0)moyenne=niveau;
        if(niveau>0.2&&niveau>moyenne*1.9)eclair();
        moyenne=moyenne*0.96+niveau*0.04;
      },60);
      return true;
    }catch(_e){analyseur=null;sourceAnalyse=null;return false;}
  }

  function demarrer(detail){
    if(mouvementReduit_()){return false;}
    actif=true;
    monter_();
    setTimeout(function(){if(racine&&actif)racine.classList.add('actif');},30);
    var reactif=detail&&analyser_(detail.gainNode,detail.contexte);
    if(!reactif)hasard_();
    return true;
  }
  function arreter(){
    actif=false;
    clearTimeout(minuteurHasard);minuteurHasard=0;
    arreterAnalyse_();
    if(racine)racine.classList.remove('actif');
  }

  /* L'orage ne se montre que si on ENTEND le tonnerre : piste d'orage en cours ET volume d'ambiance au-dessus de zéro (case cochée). */
  var courante=null;
  function evaluer_(){
    if(courante&&estOrage(courante.cle)&&volumeAmbiance_()>0){if(!actif)demarrer(courante);}
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

  window.__SOREAL_IDLE_ORAGE_V1__={demarrer:function(){return demarrer(null);},arreter:arreter,eclair:eclair,actif:function(){return actif;},estOrage:estOrage,evaluer:evaluer_,construireGrondement:construireGrondement_};
})();
