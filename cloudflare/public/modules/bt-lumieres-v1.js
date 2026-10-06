/*
 * SOREAL IDLE — lumières de Basic Training qui faiblissent (Norman, 2026-10-06 : « aléatoirement, la lumière de Compétences d'attaque et de défense s'éteint, comme une lumière qui va
 * bientôt claquer, avec un petit bruit » ; puis « le son pète les oreilles : un bruit électrique mais rapide, très court, qui se répète 2 fois, et qui arrive rarement »).
 *
 * Rarement : en moyenne une fois par minute et demie (de 50 à 140 secondes, au hasard), pour UN bandeau à la fois (attaque ou défense, tiré au sort). Le bandeau s'éteint deux fois de suite,
 * et chaque extinction fait un grésillement électrique très court (environ 80 ms) et DOUX : quelques micro-crépitements dans le médium, un petit « pop » et une pointe de bourdonnement
 * de ballast. Rien au rallumage. Doux pour les yeux : deux éclats seulement, lueur baissée (jamais un flash blanc) ; rien du tout si le système demande moins d'animations. Le son suit le
 * volume « Sons de l'interface » des Réglages et reste discret (pointe à environ -21 dB pleine échelle au volume par défaut).
 *
 *   window.__SOREAL_IDLE_BT_LUMIERES_V1__ = { vaciller(element), motif(alea), sonner(type), demarrer(), arreter() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BT_LUMIERES_V1__)return;

  var CLASSE='lumiere-eteinte';
  var SELECTEUR='.soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120,.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-panel-head-v120';
  var GAIN_MAITRE=0.8;
  var minuteur=0;
  var actif=false;

  function mouvementReduit_(){
    try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}
  }
  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
    return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0.75;
  }

  /* Motif d'un vacillement : exactement deux extinctions rapides, liste de [éteint ?, durée en ms]. */
  function motif(alea){
    var a=typeof alea==='function'?alea:Math.random;
    return [[true,95+a()*45],[false,150+a()*80],[true,80+a()*40],[false,0]];
  }

  /* ---------- Son : un grésillement électrique très court et doux ---------- */
  var ac=null;
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  function construire_(c,sortie,t,type,alea){
    var a=typeof alea==='function'?alea:Math.random;
    if(type!=='eteint')return;
    /* Quelques micro-crépitements dans le médium (pas dans les aigus : c'est ce qui agresse l'oreille), serrés sur environ 35 ms. */
    for(var k=0;k<5;k++){
      var decal=a()*0.035;
      var n=Math.max(1,Math.floor(c.sampleRate*(0.002+a()*0.003)));
      var tampon=c.createBuffer(1,n,c.sampleRate);
      var d=tampon.getChannelData(0);
      for(var i=0;i<n;i++)d[i]=(a()*2-1)*Math.pow(1-i/n,1.6);
      var src=c.createBufferSource();src.buffer=tampon;
      var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=0.9;f.frequency.setValueAtTime(1500+a()*1700,t+decal);
      var g=c.createGain();g.gain.value=0.16*(0.5+a()*0.5);
      src.connect(f);f.connect(g);g.connect(sortie);src.start(t+decal);
    }
    /* Un petit « pop » doux. */
    var o=c.createOscillator();o.type='sine';
    o.frequency.setValueAtTime(700,t);o.frequency.exponentialRampToValueAtTime(240,t+0.03);
    var go=c.createGain();go.gain.setValueAtTime(0.09,t);go.gain.exponentialRampToValueAtTime(0.0001,t+0.03);
    o.connect(go);go.connect(sortie);o.start(t);o.stop(t+0.05);
    /* Une pointe de bourdonnement de ballast (120 Hz redressé : on n'entend que ses harmoniques médium), qui retombe en moins de 80 ms. */
    var b=c.createOscillator();b.type='sawtooth';
    b.frequency.setValueAtTime(122,t+0.004);b.frequency.exponentialRampToValueAtTime(104,t+0.074);
    var fb=c.createBiquadFilter();fb.type='bandpass';fb.Q.value=1.1;fb.frequency.setValueAtTime(1300,t+0.004);
    var gb=c.createGain();
    gb.gain.setValueAtTime(0.0001,t+0.004);gb.gain.linearRampToValueAtTime(0.14,t+0.010);gb.gain.setTargetAtTime(0.0001,t+0.016,0.022);
    b.connect(fb);fb.connect(gb);gb.connect(sortie);b.start(t+0.004);b.stop(t+0.15);
  }
  function sonner(type){
    if(type!=='eteint')return false;
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*GAIN_MAITRE;maitre.connect(c.destination);
      construire_(c,maitre,c.currentTime+0.005,type);
      return true;
    }catch(_e){return false;}
  }

  /* ---------- Vacillement d'un bandeau ---------- */
  function vaciller(el,alea){
    if(!el||mouvementReduit_())return false;
    var etapes=motif(alea);
    var i=0,anterieur=false;
    (function pas(){
      if(!el.isConnected){return;}
      if(i>=etapes.length){el.classList.remove(CLASSE);return;}
      var e=etapes[i++];
      var eteint=e[0];
      if(eteint!==anterieur){
        el.classList.toggle(CLASSE,eteint);
        if(eteint)sonner('eteint');
        anterieur=eteint;
      }
      if(e[1]>0)setTimeout(pas,e[1]);else pas();
    })();
    return true;
  }

  /* Un seul minuteur pour toute la page : tous les 50 à 140 s, un bandeau tiré au sort (s'il y en a à l'écran) vacille. */
  function planifier_(){
    if(!actif)return;
    clearTimeout(minuteur);
    minuteur=setTimeout(function(){
      if(!actif)return;
      if(!document.hidden){
        var presents=Array.prototype.slice.call(document.querySelectorAll(SELECTEUR));
        if(presents.length)vaciller(presents[Math.floor(Math.random()*presents.length)]);
      }
      planifier_();
    },50000+Math.random()*90000);
  }

  function demarrer(){
    if(actif||mouvementReduit_())return false;
    actif=true;planifier_();return true;
  }
  function arreter(){
    actif=false;
    clearTimeout(minuteur);minuteur=0;
    Array.prototype.forEach.call(document.querySelectorAll('.'+CLASSE),function(el){el.classList.remove(CLASSE);});
  }

  window.__SOREAL_IDLE_BT_LUMIERES_V1__={vaciller:vaciller,motif:motif,sonner:sonner,demarrer:demarrer,arreter:arreter,construire:construire_,classe:CLASSE,selecteur:SELECTEUR};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer);else demarrer();
})();
