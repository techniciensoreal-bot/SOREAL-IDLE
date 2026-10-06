/*
 * SOREAL IDLE — lumières de Basic Training qui faiblissent (Norman, 2026-10-06 : « aléatoirement, la lumière de Compétences d'attaque et de défense s'éteint, comme une lumière
 * qui va bientôt claquer, avec un petit bruit »).
 *
 * De temps en temps (toutes les 7 à 22 secondes, au hasard, chaque bandeau pour son compte), le bandeau « Compétences d'attaque » ou « Compétences de défense » vacille : il s'éteint, se
 * rallume à moitié, s'éteint de nouveau, puis tient un instant avant de revenir. Chaque extinction fait « tzzt » (un claquement de ballast avec un bourdonnement très court), chaque
 * rallumage un petit « clic ». Doux pour les yeux : au plus trois éclats par seconde, lueur seulement baissée (jamais un flash blanc) ; rien du tout si le système demande moins
 * d'animations. Le son suit le volume « Sons de l'interface » des Réglages.
 *
 *   window.__SOREAL_IDLE_BT_LUMIERES_V1__ = { vaciller(element), motif(alea), sonner(type), demarrer(), arreter() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BT_LUMIERES_V1__)return;

  var CLASSE='lumiere-eteinte';
  var SELECTEUR='.soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120,.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-panel-head-v120';
  var minuteurs=new Map();
  var actif=false;
  var relais=0;

  function mouvementReduit_(){
    try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}
  }
  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
    return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0.75;
  }

  /* Motif d'un vacillement : liste de [éteint ?, durée en ms]. Trois à quatre extinctions, jamais plus de trois éclats par seconde. */
  function motif(alea){
    var a=typeof alea==='function'?alea:Math.random;
    var m=[[true,90+a()*70],[false,170+a()*90],[true,70+a()*60],[false,280+a()*160]];
    if(a()<0.7)m.push([true,60+a()*60],[false,330+a()*200]);
    if(a()<0.45)m.push([true,300+a()*420],[false,0]);
    return m;
  }

  /* ---------- Son : claquement de ballast + bourdonnement très court, puis petit clic au rallumage ---------- */
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
    /* Un grésillement : des micro-claquements secs (petites bouffées de bruit aigu) répartis au hasard sur une courte durée. */
    function gresille(nb,etendue,gain){
      for(var k=0;k<nb;k++){
        var decal=a()*etendue;
        var n=Math.max(1,Math.floor(c.sampleRate*(0.002+a()*0.004)));
        var tampon=c.createBuffer(1,n,c.sampleRate);
        var d=tampon.getChannelData(0);
        for(var i=0;i<n;i++)d[i]=(a()*2-1)*Math.pow(1-i/n,1.5);
        var src=c.createBufferSource();src.buffer=tampon;
        var f=c.createBiquadFilter();f.type='highpass';f.frequency.setValueAtTime(2800+a()*2500,t+decal);
        var g=c.createGain();g.gain.value=gain*(0.5+a()*0.5);
        src.connect(f);f.connect(g);g.connect(sortie);src.start(t+decal);
      }
    }
    /* Le bourdonnement du ballast : une dent de scie à 120 Hz (le secteur redressé) dont on n'entend que les harmoniques médium, qui retombe en vibrant. */
    function bourdonne(f0,f1,duree,gain,decal,coupure){
      var o=c.createOscillator();o.type='sawtooth';
      o.frequency.setValueAtTime(f0,t+decal);o.frequency.exponentialRampToValueAtTime(f1,t+decal+duree);
      var filtre=c.createBiquadFilter();filtre.type='bandpass';filtre.Q.value=1.1;filtre.frequency.setValueAtTime(coupure,t+decal);
      var g=c.createGain();
      g.gain.setValueAtTime(0.0001,t+decal);
      g.gain.linearRampToValueAtTime(gain,t+decal+0.006);
      g.gain.setTargetAtTime(0.0001,t+decal+0.012,duree*0.42);
      o.connect(filtre);filtre.connect(g);g.connect(sortie);o.start(t+decal);o.stop(t+decal+duree*1.6);
    }
    /* Le « pop » de l'arc qui claque : un ton qui chute très vite. */
    function pop(f0,f1,duree,gain,decal){
      var o=c.createOscillator();o.type='sine';
      o.frequency.setValueAtTime(f0,t+decal);o.frequency.exponentialRampToValueAtTime(f1,t+decal+duree);
      var g=c.createGain();
      g.gain.setValueAtTime(gain,t+decal);
      g.gain.exponentialRampToValueAtTime(0.0001,t+decal+duree);
      o.connect(g);g.connect(sortie);o.start(t+decal);o.stop(t+decal+duree+0.02);
    }
    if(type==='eteint'){
      gresille(9,0.085,1.0);          /* le crépitement qui précède */
      pop(1500,260,0.035,0.55,0.0);   /* le « pop » */
      bourdonne(122,96,0.26,0.85,0.012,1500);   /* le ballast, qui retombe */
      bourdonne(244,190,0.16,0.30,0.02,2600);
    }else{
      gresille(4,0.04,0.7);           /* un dernier crépitement */
      bourdonne(70,250,0.08,0.55,0.0,1800);     /* l'arc qui s'amorce : le bourdonnement monte vite */
      pop(900,420,0.025,0.35,0.05);   /* petit clic de rallumage */
    }
  }
  function sonner(type){
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.5;maitre.connect(c.destination);
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
        sonner(eteint?'eteint':'allume');
        anterieur=eteint;
      }
      if(e[1]>0)setTimeout(pas,e[1]);else pas();
    })();
    return true;
  }

  function planifier_(el){
    if(!actif)return;
    var delai=7000+Math.random()*15000;
    minuteurs.set(el,setTimeout(function(){
      minuteurs.delete(el);
      if(!actif)return;
      if(el.isConnected&&!document.hidden)vaciller(el);
      /* Le bandeau a pu être redessiné : on repart des bandeaux présents. */
      balayer_();
    },delai));
  }
  function balayer_(){
    if(!actif)return;
    var presents=Array.prototype.slice.call(document.querySelectorAll(SELECTEUR));
    minuteurs.forEach(function(t,el){if(!el.isConnected){clearTimeout(t);minuteurs.delete(el);}});
    presents.forEach(function(el){if(!minuteurs.has(el))planifier_(el);});
    /* Aucun bandeau à l'écran (autre menu) : on repasse regarder un peu plus tard. */
    clearTimeout(relais);
    if(!presents.length)relais=setTimeout(balayer_,4000);
  }

  function demarrer(){
    if(actif||mouvementReduit_())return false;
    actif=true;balayer_();return true;
  }
  function arreter(){
    actif=false;
    clearTimeout(relais);
    minuteurs.forEach(function(t){clearTimeout(t);});minuteurs.clear();
    Array.prototype.forEach.call(document.querySelectorAll('.'+CLASSE),function(el){el.classList.remove(CLASSE);});
  }

  window.__SOREAL_IDLE_BT_LUMIERES_V1__={vaciller:vaciller,motif:motif,sonner:sonner,demarrer:demarrer,arreter:arreter,construire:construire_,classe:CLASSE,selecteur:SELECTEUR};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer);else demarrer();
})();
