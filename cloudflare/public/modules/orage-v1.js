/*
 * SOREAL IDLE — orage visuel (Norman, 2026-10-06 : « quand c'est le son d'ambiance avec l'orage, j'aimerais bien que tu simules de l'orage »).
 *
 * Quand la piste d'ambiance qui joue est celle du tonnerre (Thunder.opus), l'écran s'assombrit légèrement, des éclairs
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
  var racine=null,flash=null,eclairSvg=null,blanc=null;
  /* Lumière blanche plein écran, comme les orages du mode Halloween de l'APP : cinq façons de claquer (simple, sourd, rafale, double coup, lent). */
  var BLANCS=[
    {k:[{opacity:0},{opacity:.8,offset:.05},{opacity:.12,offset:.2},{opacity:0}],d:520},
    {k:[{opacity:0},{opacity:.3,offset:.2},{opacity:.1,offset:.5},{opacity:.24,offset:.65},{opacity:0}],d:1500},
    {k:[{opacity:0},{opacity:.6,offset:.08},{opacity:.08,offset:.18},{opacity:.5,offset:.3},{opacity:.05,offset:.42},{opacity:.75,offset:.55},{opacity:0}],d:1200},
    {k:[{opacity:0},{opacity:.8,offset:.04},{opacity:.25,offset:.1},{opacity:.85,offset:.16},{opacity:.3,offset:.3},{opacity:0,offset:.55},{opacity:.42,offset:.62},{opacity:0}],d:1000},
    {k:[{opacity:0},{opacity:.45,offset:.12},{opacity:.75,offset:.25},{opacity:.08,offset:.5},{opacity:0}],d:1300}
  ];
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
      '#soreal-orage-v1 .og-flash{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at var(--og-x,50%) 0%,rgba(235,244,255,.95),rgba(170,200,255,.55) 38%,rgba(120,150,230,.12) 75%);mix-blend-mode:screen;}',
      '#soreal-orage-v1 .og-blanc{position:absolute;inset:0;opacity:0;background:rgb(228,236,255);}',
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
    racine.innerHTML='<div class="og-ciel"></div><div class="og-flash"></div><div class="og-blanc"></div>'+
      '<svg class="og-eclair" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>';
    document.body.appendChild(racine);
    flash=racine.querySelector('.og-flash');blanc=racine.querySelector('.og-blanc');eclairSvg=racine.querySelector('.og-eclair');
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
    if(blanc&&blanc.animate){var b=BLANCS[Math.floor(Math.random()*BLANCS.length)];try{blanc.animate(b.k,{duration:b.d,easing:'linear'});}catch(_e){}}
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
    /* Après le fondu de sortie, le décor est retiré de la page : plus aucun coût tant qu'il n'y a pas d'orage. */
    setTimeout(function(){if(!actif&&racine&&racine.parentNode){racine.parentNode.removeChild(racine);racine=null;flash=null;eclairSvg=null;blanc=null;}},2700);
  }

  /*
   * ORAGE D'UN SORT DE BLOOD MAGIC (Norman, 2026-10-15) : « quand on utilise un sort, l'écran s'assombrit, il y a un éclair avec le son au même moment (on utilise déjà des éclairs : les réutiliser) ; plus le sort est avancé dans
   * la liste, plus l'orage gronde ; des choses apparaissent en plus, un pentacle qui tourne pour les derniers ». Les éclairs réutilisent trace_() et les claquements blancs BLANCS de l'orage d'ambiance ; chaque éclair joue son coup
   * de tonnerre (audio-effects-v199.js, coupTonnerre) au MÊME instant. Niveau 1 (premier sort de la liste) à 5 (dernier) :
   *   1 numberBoost : ciel noir léger, un éclair                         2 ironPill : plus sombre, un éclair, lueur rouge
   *   3 bloodSpaghetti : deux éclairs, gouttes de sang qui tombent        4 counterfeitGold : trois éclairs, gouttes, pentacle qui tourne
   *   5 leeches : quatre éclairs, pluie de sang, grand double pentacle à runes, vignette rouge qui palpite
   * Doux pour les yeux : jamais deux éclairs à moins de 0,9 s d'écart ; rien du tout (sauf le son) si l'effet « orage » est coupé dans les Réglages ou si le système demande moins d'animations. Rien n'intercepte les clics.
   */
  var NIVEAUX_SORTS={numberBoost:1,ironPill:2,bloodSpaghetti:3,counterfeitGold:4,leeches:5};
  var ORAGE_SORT=[
    null,
    {sombre:.35,rouge:0,gouttes:0,pentacle:0,eclairs:[260],duree:2000},
    {sombre:.46,rouge:.35,gouttes:0,pentacle:0,eclairs:[260],duree:2600},
    {sombre:.56,rouge:.55,gouttes:12,pentacle:0,eclairs:[260,1350],duree:3400},
    {sombre:.66,rouge:.7,gouttes:16,pentacle:1,eclairs:[260,1250,2350],duree:4500},
    {sombre:.78,rouge:.95,gouttes:26,pentacle:2,eclairs:[260,1150,2100,3150],duree:5800}
  ];
  var racineSort=null,finSort=0,minuterieSort=0;
  function pentacleSvg_(niveau){
    var pts=[];for(var k=0;k<5;k++){var a=(-90+k*72)*Math.PI/180;pts.push([100+78*Math.cos(a),100+78*Math.sin(a)]);}
    var ordre=[0,2,4,1,3,0],etoile=ordre.map(function(i,n){return (n?'L':'M')+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1);}).join(' ')+'Z';
    var runes='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ',texte='';
    if(niveau>=2){for(var i=0;i<16;i++){var b=i*22.5;texte+='<text x="100" y="12" transform="rotate('+b+' 100 100)" text-anchor="middle" font-size="9" fill="#ff5a4a">'+runes.charAt(i)+'</text>';}}
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#ff2a2a" stroke-width="1.8" stroke-linejoin="round">'+
      '<circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="'+(niveau>=2?'80':'84')+'"/>'+
      '<path d="'+etoile+'" stroke-width="2.4"/>'+(niveau>=2?'<circle cx="100" cy="100" r="31" stroke-width="1.4"/>':'')+'</g>'+texte+'</svg>';
  }
  function styleSort_(){
    if(document.getElementById('orage-sort-style-v1'))return;
    var s=document.createElement('style');s.id='orage-sort-style-v1';
    s.textContent=[
      '#soreal-orage-sort-v1{position:fixed;inset:0;z-index:100001;pointer-events:none;overflow:hidden}',
      '#soreal-orage-sort-v1 .os-sombre{position:absolute;inset:0;background:#02030a;opacity:0;transition:opacity .28s ease-out}',
      '#soreal-orage-sort-v1 .os-rouge{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at 50% 55%,transparent 28%,rgba(130,0,12,.6) 100%);transition:opacity .7s ease}',
      '#soreal-orage-sort-v1 .os-rouge.pulse{animation:osPalpite 1.5s ease-in-out infinite}',
      '@keyframes osPalpite{0%,100%{filter:brightness(.7)}50%{filter:brightness(1.25)}}',
      '#soreal-orage-sort-v1 .os-blanc{position:absolute;inset:0;opacity:0;background:rgb(228,236,255)}',
      '#soreal-orage-sort-v1 .os-eclair{position:absolute;inset:0;width:100%;height:100%;opacity:0}',
      '#soreal-orage-sort-v1 .os-eclair polyline{fill:none;stroke:#f4f8ff;vector-effect:non-scaling-stroke;stroke-width:3px;stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(0 0 6px #9bc0ff) drop-shadow(0 0 14px #5a8dff)}',
      '#soreal-orage-sort-v1.rouge .os-eclair polyline{stroke:#ffe9e4;filter:drop-shadow(0 0 6px #ff6a5a) drop-shadow(0 0 14px #ff2a2a)}',
      '#soreal-orage-sort-v1 .os-eclair polyline.og-branche{stroke-width:1.6px;opacity:.8}',
      '#soreal-orage-sort-v1 .os-gouttes i{position:absolute;top:-30px;width:6px;height:16px;border-radius:50% 50% 60% 60%/30% 30% 70% 70%;background:linear-gradient(#b0001a,#5a000d);opacity:0;animation:osChute var(--d,1.6s) linear var(--delai,0s) both}',
      '@keyframes osChute{0%{transform:translateY(0);opacity:0}10%{opacity:.9}100%{transform:translateY(112vh);opacity:.9}}',
      '#soreal-orage-sort-v1 .os-pentacle{position:absolute;left:50%;top:48%;width:min(80vmin,540px);height:min(80vmin,540px);margin:calc(min(80vmin,540px) / -2) 0 0 calc(min(80vmin,540px) / -2);opacity:0;transition:opacity .9s ease;filter:drop-shadow(0 0 8px #ff2a2a) drop-shadow(0 0 22px #b00018)}',
      '#soreal-orage-sort-v1 .os-pentacle.visible{opacity:.85}',
      '#soreal-orage-sort-v1 .os-pentacle svg{width:100%;height:100%;animation:osTourne 16s linear infinite}',
      '#soreal-orage-sort-v1 .os-pentacle.double::after{content:"";position:absolute;inset:18%;background:var(--os-etoile) center/contain no-repeat;animation:osTourneInverse 11s linear infinite}',
      '@keyframes osTourne{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
      '@keyframes osTourneInverse{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  /*
   * LES TONNERRES DE SOREAL APP (mode Halloween, features/skin-halloween/ui.html, repris tels quels : même synthèse, même réverbération) : cinq tonnerres, du coup sec au grondement qui roule.
   * Bruit filtré qui s'enfle par à-coups (« bosses »), sub-grave sinusoïdal, et une réverbération convolutive (impulsion de bruit qui s'éteint en 2,2 s) qui donne l'écho des nuages.
   * Au lieu d'arriver plusieurs secondes après l'éclair comme dans l'APP, le tonnerre part ici AU MÊME INSTANT que l'éclair (c'est le sort qui le veut).
   */
  var reverbeOrage=null;
  function souffleOrage_(a,t,sortie,o){
    var n=Math.floor(a.sampleRate*o.duree),buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
    var s=a.createBufferSource();s.buffer=buf;
    var f=a.createBiquadFilter();f.type=o.type||'lowpass';f.Q.value=o.q||1;
    f.frequency.setValueAtTime(o.f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.duree);
    var g=a.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.vol,t+(o.attaque||.1));
    (o.bosses||[]).forEach(function(b){g.gain.exponentialRampToValueAtTime(Math.max(.0001,b[1]),t+b[0]);});
    g.gain.exponentialRampToValueAtTime(.0001,t+o.duree);
    s.connect(f);f.connect(g);g.connect(sortie);s.start(t);s.stop(t+o.duree);
  }
  function graveOrage_(a,t,sortie,f0,f1,duree,vol,attaque){
    var o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(18,f1),t+duree);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(attaque||.15));g.gain.exponentialRampToValueAtTime(.0001,t+duree);
    o.connect(g);g.connect(sortie);o.start(t);o.stop(t+duree+.05);
  }
  function sortieReverbeOrage_(a){
    if(!reverbeOrage||reverbeOrage.ctx!==a){
      var duree=2.2,n=Math.floor(a.sampleRate*duree),buf=a.createBuffer(2,n,a.sampleRate);
      for(var c=0;c<2;c++){var d=buf.getChannelData(c);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}
      var conv=a.createConvolver();conv.buffer=buf;var g=a.createGain();g.gain.value=.55;conv.connect(g);g.connect(a.destination);
      reverbeOrage={ctx:a,noeud:conv};
    }
    return reverbeOrage.noeud;
  }
  var TONNERRES=[
    function(a,t,s){souffleOrage_(a,t,s,{duree:.5,f0:4200,f1:700,vol:.95,attaque:.01});souffleOrage_(a,t+.05,s,{duree:1.9,f0:520,f1:90,vol:.75,attaque:.05,bosses:[[.5,.5]]});graveOrage_(a,t,s,72,40,1.4,.5,.04);},                       /* 0 coup proche */
    function(a,t,s){souffleOrage_(a,t,s,{duree:5.6,f0:240,f1:46,vol:.7,attaque:.9,bosses:[[1.6,.35],[2.9,.6],[4.2,.3]]});graveOrage_(a,t,s,46,26,5,.4,1);},                                                                              /* 1 grondement lointain */
    function(a,t,s){souffleOrage_(a,t,s,{duree:.4,f0:2200,f1:500,vol:.5,attaque:.02});souffleOrage_(a,t,s,{duree:4.4,f0:360,f1:70,vol:.7,attaque:.12,bosses:[[.5,.3],[.8,.75],[1.2,.3],[1.6,.7],[2.1,.28],[2.6,.55],[3.3,.2]]});graveOrage_(a,t,s,55,30,3.8,.4,.2);}, /* 2 roulement */
    function(a,t,s){souffleOrage_(a,t,s,{duree:1,type:'bandpass',q:.8,f0:6500,f1:1400,vol:.7,attaque:.01,bosses:[[.15,.9],[.4,.4]]});souffleOrage_(a,t+.2,s,{duree:2.6,f0:420,f1:80,vol:.7,attaque:.1,bosses:[[.9,.45]]});graveOrage_(a,t+.15,s,64,34,2,.4,.1);}, /* 3 déchirure */
    function(a,t,s){graveOrage_(a,t,s,95,24,2.8,.85,.03);souffleOrage_(a,t,s,{duree:1.2,f0:180,f1:60,vol:.5,attaque:.03});souffleOrage_(a,t+.5,s,{duree:2.2,f0:150,f1:45,vol:.3,attaque:.4});}                                                 /* 4 boum sourd */
  ];
  /* Quels tonnerres pour quel éclair : le sort 1 n'a qu'un coup sec ; le dernier empile tout, du plus sec au plus profond. */
  var TONNERRES_PAR_NIVEAU=[null,[0],[3],[0,2],[3,2,4],[0,3,2,4]];
  function volumeEffets_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getInterface==='function'?Number(r.getInterface()):(r&&typeof r.getAmbiance==='function'?Number(r.getAmbiance()):0.5);
    return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0.5;
  }
  function coupTonnerre_(niveau,indice){
    var liste=TONNERRES_PAR_NIVEAU[Math.max(1,Math.min(5,niveau|0))]||[0];
    var v=volumeEffets_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var sortie=c.createGain();sortie.gain.value=Math.min(1,v*1.1)*((niveau|0)>=4?0.8:1);
      sortie.connect(c.destination);sortie.connect(sortieReverbeOrage_(c));
      var i=Math.min(liste.length-1,Math.max(0,indice|0));
      TONNERRES[liste[i]](c,c.currentTime+.02,sortie);
      /* le dernier sort de la liste ajoute à chaque éclair un grondement lointain qui s'étire dessous */
      if((niveau|0)>=5&&(indice|0)===0)TONNERRES[1](c,c.currentTime+.1,sortie);
      return true;
    }catch(_e){return false;}
  }
  function retirerSort_(){
    clearTimeout(minuterieSort);minuterieSort=0;
    if(racineSort&&racineSort.parentNode)racineSort.parentNode.removeChild(racineSort);
    racineSort=null;finSort=0;
  }
  function sort(idOuNiveau){
    var niveau=typeof idOuNiveau==='number'?idOuNiveau:(NIVEAUX_SORTS[String(idOuNiveau||'')]||0);
    niveau=Math.max(0,Math.min(5,Math.floor(niveau)));
    if(!niveau)return false;
    var cfg=ORAGE_SORT[niveau];
    /* Effet coupé ou mouvement réduit : seulement le tonnerre, une fois, au moment du sort. */
    var visuel=!mouvementReduit_()&&(function(){try{return localStorage.getItem('soreal_idle_effet_orage_v1')!=='0';}catch(_e){return true;}})();
    if(!visuel){coupTonnerre_(niveau,0);return true;}
    retirerSort_();
    styleSort_();
    var r=document.createElement('div');r.id='soreal-orage-sort-v1';r.setAttribute('aria-hidden','true');
    if(cfg.rouge>0)r.className='rouge';
    var gouttes='';for(var g=0;g<cfg.gouttes;g++)gouttes+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;--d:'+(1.1+Math.random()*1.1).toFixed(2)+'s;--delai:'+(Math.random()*(cfg.duree/1000-1.4)).toFixed(2)+'s"></i>';
    r.innerHTML='<div class="os-sombre"></div><div class="os-rouge"></div><div class="os-gouttes">'+gouttes+'</div>'+
      (cfg.pentacle?'<div class="os-pentacle'+(cfg.pentacle>=2?' double':'')+'">'+pentacleSvg_(cfg.pentacle)+'</div>':'')+
      '<div class="os-blanc"></div><svg class="os-eclair" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>';
    if(cfg.pentacle>=2){var pp=pentacleSvg_(1);r.querySelector('.os-pentacle').style.setProperty('--os-etoile','url("data:image/svg+xml,'+encodeURIComponent(pp)+'")');}
    document.body.appendChild(r);racineSort=r;
    var sombre=r.querySelector('.os-sombre'),rouge=r.querySelector('.os-rouge'),blancEl=r.querySelector('.os-blanc'),svg=r.querySelector('.os-eclair'),pent=r.querySelector('.os-pentacle');
    /* assombrissement dès le lancement */
    requestAnimationFrame(function(){
      sombre.style.opacity=String(cfg.sombre);
      if(cfg.rouge>0){rouge.style.opacity=String(cfg.rouge);if(niveau>=5)rouge.classList.add('pulse');}
      if(pent)pent.classList.add('visible');
    });
    /* les éclairs : tracé et claquement blanc de l'orage d'ambiance, tonnerre au même instant */
    cfg.eclairs.forEach(function(debut,i){
      setTimeout(function(){
        if(racineSort!==r)return;
        var e=trace_();
        svg.innerHTML=e.svg;
        svg.style.opacity='.95';
        setTimeout(function(){svg.style.opacity='0';},120+Math.random()*80);
        if(blancEl&&blancEl.animate){var b=BLANCS[(niveau<=2||i===0)?0:Math.floor(Math.random()*BLANCS.length)];try{blancEl.animate(b.k,{duration:b.d,easing:'linear'});}catch(_e){}}
        coupTonnerre_(niveau,i);
      },debut);
    });
    /* fin : fondu de sortie puis le décor est retiré */
    minuterieSort=setTimeout(function(){
      if(racineSort!==r)return;
      sombre.style.transition='opacity .9s ease-in';rouge.style.transition='opacity .9s ease-in';
      sombre.style.opacity='0';rouge.style.opacity='0';if(pent)pent.classList.remove('visible');
      minuterieSort=setTimeout(function(){if(racineSort===r)retirerSort_();},1100);
    },cfg.duree);
    return true;
  }

  /* L'orage ne se montre que si on ENTEND le tonnerre : piste d'orage en cours ET volume d'ambiance au-dessus de zéro (case cochée). */
  var courante=null;
  /* Réglages > Effets visuels : l'effet peut être coupé pour les téléphones moins puissants (mémorisé sur l'appareil, actif par défaut). */
  function effetAutorise_(){try{return localStorage.getItem('soreal_idle_effet_orage_v1')!=='0';}catch(_e){return true;}}
  function evaluer_(){
    if(courante&&estOrage(courante.cle)&&volumeAmbiance_()>0&&effetAutorise_()){if(!actif)demarrer(courante);}
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

  window.__SOREAL_IDLE_ORAGE_V1__={sort:sort,niveauxSorts:NIVEAUX_SORTS,tonnerres:TONNERRES,tonnerresParNiveau:TONNERRES_PAR_NIVEAU,demarrer:function(){return demarrer(null);},arreter:arreter,eclair:eclair,actif:function(){return actif;},estOrage:estOrage,evaluer:evaluer_,construireGrondement:construireGrondement_};
})();
