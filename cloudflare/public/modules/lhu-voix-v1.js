/*
 * SOREAL IDLE — le « bip » de Cthulhu quand il parle (Norman, 2026-11-09 : « supprime toutes les voix de Cthulhu dans le tuto ; je ne veux que du texte, et un son quand il parle, comme dans les vieux jeux vidéo »).
 * Plus aucune voix : le texte s'écrit lettre après lettre (tutoriel-v1.js) et chaque lettre (une sur deux) fait un petit bip synthétisé, de hauteur légèrement différente à chaque fois, comme dans les vieux jeux. Aucun fichier son.
 * Plusieurs timbres au choix (choisir) ; le choix est mémorisé dans le stockage du compte (clé soreal_idle_lhu_bip_v1, règle n°6). Volume = barre « Sons de l'interface » des Réglages (rien à volume 0). « Réduire les animations » ne coupe pas
 * le son (il est déclenché par le texte, pas par une animation).
 *   window.__SOREAL_IDLE_LHU_BIP_V1__ = { styles, courant(), choisir(id), bip(c, i), parlable(c), pas }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_LHU_BIP_V1__)return;

  var CLE='soreal_idle_lhu_bip_v1';
  var DEFAUT='bulle';   /* choisi par Norman (2026-11-09) : le n° 5, « Bulle » */
  var PENTA=[0,2,4,7,9,12];   /* gamme pentatonique : jamais de fausse note, même à la suite */

  /* Chaque style : onde, fréquence de base (Hz), amplitude du hasard (en demi-tons choisis dans la gamme), durée (s), volume, glissement (début -> fin, multiplicateurs) ; options : filtre, vibrato, bruit. */
  var STYLES=[
    {id:'carre',nom:'8 bits',desc:'Onde carrée, bref et net : le bip des vieux RPG.',type:'square',base:330,gamme:PENTA,duree:0.055,vol:0.05,glisse:[1,1]},
    {id:'impulsion',nom:'Console portable',desc:'Impulsion étroite (25 %), plus nasillard et plus pointu : le son des jeux de poche.',onde:0.25,base:392,gamme:PENTA,duree:0.05,vol:0.055,glisse:[1,1]},
    {id:'doux',nom:'Village',desc:'Onde triangle douce, un « bloup » rond et gentil.',type:'triangle',base:300,gamme:PENTA,duree:0.075,vol:0.12,attaque:0.008,glisse:[1,1.04]},
    {id:'grogne',nom:'Grognement',desc:'Grave et rauque, qui retombe : un monstre qui marmonne.',type:'sawtooth',base:92,gamme:[0,1,3,5],duree:0.1,vol:0.07,glisse:[1.3,0.78],filtre:760,bruit:0.012},
    {id:'bulle',nom:'Bulle',desc:'Un glissando qui monte, comme une bulle qui éclate sous l’eau.',type:'sine',base:360,gamme:PENTA,duree:0.075,vol:0.14,attaque:0.004,glisse:[0.6,1.5]},
    {id:'machine',nom:'Machine à écrire',desc:'Un clic sec et un petit coup sourd : un vieil ordinateur qui écrit.',type:'sine',base:150,gamme:[0,2],duree:0.04,vol:0.1,glisse:[1.4,0.8],clic:true},
    {id:'tentacule',nom:'Tentacule',desc:'Grave, avec un trémolo qui ondule : ça gargouille.',type:'sine',base:132,gamme:[0,3,5,7],duree:0.12,vol:0.14,glisse:[1,0.9],vibrato:[26,34]},
    {id:'robot',nom:'Robot',desc:'Une note carrée presque fixe avec un petit vibrato : la voix d’un vieux PNJ.',type:'square',base:440,gamme:[0,0,2,0,4],duree:0.065,vol:0.045,glisse:[1,1],vibrato:[38,9]}
  ];

  function style_(id){for(var i=0;i<STYLES.length;i+=1)if(STYLES[i].id===id)return STYLES[i];return null;}
  function courant(){
    try{var v=localStorage.getItem(CLE);var s=v&&style_(v);if(s)return s.id;}catch(_e){}
    return DEFAUT;
  }
  function choisir(id){
    if(!style_(id))return false;
    try{localStorage.setItem(CLE,id);}catch(_e){}
    return true;
  }

  function volume_(){var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;}
  var ctx=null,maitre=null,bruit=null;
  function contexte_(){
    if(ctx&&ctx.state!=='closed')return ctx;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{var L=window.__SOREAL_IDLE_LIMITEUR_V1__;ctx=(L&&L.contexte&&L.contexte())||new C();}catch(_e){ctx=null;}
    maitre=null;bruit=null;
    return ctx;
  }
  function sortie_(c){
    if(maitre)return maitre;
    maitre=c.createGain();
    maitre.gain.value=1;
    var L=window.__SOREAL_IDLE_LIMITEUR_V1__;
    if(!(L&&typeof L.brancher==='function'&&L.brancher(c,maitre)))maitre.connect(c.destination);
    return maitre;
  }
  function bruitTampon_(c){
    if(bruit)return bruit;
    var n=Math.floor(c.sampleRate*0.05),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<n;i+=1)d[i]=Math.random()*2-1;
    bruit=b;return b;
  }
  var ondes={};
  function onde_(c,duty){
    var k=String(duty);
    if(ondes[k])return ondes[k];
    var N=40,re=new Float32Array(N+1),im=new Float32Array(N+1);
    for(var n=1;n<=N;n+=1)im[n]=2/(n*Math.PI)*Math.sin(n*Math.PI*duty);   /* série de Fourier d'une impulsion de rapport cyclique « duty » */
    ondes[k]=c.createPeriodicWave(re,im);
    return ondes[k];
  }

  /* Un bip. `i` : numéro de la lettre (la hauteur varie avec elle, de façon déterministe : le même texte sonne toujours pareil). */
  function bip(id,i,volumeRelatif){
    var s=style_(id||courant());
    if(!s)return false;
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var t=c.currentTime+0.005;
      var h=Math.abs(Math.sin((Number(i)||0)*12.9898+78.233)*43758.5453);h=h-Math.floor(h);
      var demi=s.gamme[Math.floor(h*s.gamme.length)%s.gamme.length]+(h>0.93?12:0);
      var f=s.base*Math.pow(2,demi/12);
      var vol=s.vol*Math.min(1,v)*(volumeRelatif||1);
      var o=c.createOscillator(),g=c.createGain();
      g.gain.value=0.0001;   /* un gain vaut 1 tant que sa première consigne n'est pas atteinte : départ posé à la création (idle-audio-gain-initial-v1) */
      if(s.onde)o.setPeriodicWave(onde_(c,s.onde));else o.type=s.type;
      o.frequency.setValueAtTime(f*s.glisse[0],t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20,f*s.glisse[1]),t+s.duree);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(vol,t+(s.attaque||0.003));
      g.gain.exponentialRampToValueAtTime(0.0001,t+s.duree);
      var fin=g;
      if(s.filtre){var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=s.filtre;o.connect(fl);fl.connect(g);}else o.connect(g);
      if(s.vibrato){
        var lfo=c.createOscillator(),lg=c.createGain();
        lfo.frequency.value=s.vibrato[0];lg.gain.value=s.vibrato[1];
        lfo.connect(lg);lg.connect(o.frequency);
        lfo.start(t);lfo.stop(t+s.duree+0.02);
      }
      fin.connect(sortie_(c));
      o.start(t);o.stop(t+s.duree+0.02);
      if(s.bruit||s.clic){
        var src=c.createBufferSource(),bg=c.createGain(),bf=c.createBiquadFilter();
        bg.gain.value=0.0001;
        src.buffer=bruitTampon_(c);
        bf.type=s.clic?'highpass':'lowpass';bf.frequency.value=s.clic?3200:900;
        bg.gain.setValueAtTime((s.clic?0.09:s.bruit)*Math.min(1,v)*(volumeRelatif||1),t);
        bg.gain.exponentialRampToValueAtTime(0.0001,t+(s.clic?0.012:s.duree));
        src.connect(bf);bf.connect(bg);bg.connect(sortie_(c));
        src.start(t);src.stop(t+(s.clic?0.015:s.duree)+0.01);
      }
      return true;
    }catch(_e){return false;}
  }

  /* Lettre à lettre : un bip toutes les `pas` lettres visibles (jamais sur un espace ni une ponctuation). */
  function parlable_(ch){return /[A-Za-zÀ-ÿ0-9]/.test(ch);}

  window.__SOREAL_IDLE_LHU_BIP_V1__={styles:STYLES,courant:courant,choisir:choisir,bip:bip,parlable:parlable_,pas:2};
})();
