/*
 * SOREAL IDLE — vieux disques durs qui travaillent (Norman, 2026-10-07 : « plusieurs sons de vieux disques durs qui travaillent, diffusés au hasard dans Wandoos »).
 *
 * Six bruits synthétisés (aucun fichier) : grattements de tête, lecture crépitante, rotation avec déplacements de tête, démarrage du plateau, gros « tchak » suivi d'une rafale, défragmentation
 * qui s'accélère. Tant que l'ordinateur rétro est allumé et affiché (écran de bureau, pas pendant l'allumage), un bruit est tiré au hasard toutes les 6 à 22 secondes, jamais deux fois le même
 * de suite. Ils suivent le volume « Sons de l'interface » des Réglages (rien s'il est à zéro) et ne jouent pas quand la page est cachée.
 *
 *   window.__SOREAL_IDLE_WANDOOS_DISQUE_V1__ = { NOMS, jouer(i), construire(c,sortie,t,i,alea), demarrer(), arreter(), prochain() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_WANDOOS_DISQUE_V1__)return;

  var NOMS=['Grattements de tête','Lecture crépitante','Rotation et déplacements','Démarrage du plateau','Gros tchak et rafale','Défragmentation'];
  var GAIN_MAITRE=0.55;
  var ac=null,minuteur=0,veille=0,dernier=-1,actif=false;

  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
    return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0.75;
  }
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }

  /* Outils de synthèse : un « clic » de tête (bruit très bref filtré + petit choc grave), une nappe de rotation, une rafale de crépitements. */
  function outils_(c,sortie,t,a){
    var bruitBuf=null;
    function bruit_(duree){
      var n=Math.max(1,Math.floor(c.sampleRate*duree));
      var b=c.createBuffer(1,n,c.sampleRate);var d=b.getChannelData(0);
      for(var i=0;i<n;i++)d[i]=a()*2-1;
      return b;
    }
    return {
      clic:function(decal,gain,freq,q,duree){
        var src=c.createBufferSource();src.buffer=bruit_(Math.max(0.01,duree));
        var f=c.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(freq,t+decal);f.Q.value=q;
        var g=c.createGain();
        g.gain.setValueAtTime(0.0001,t+decal);g.gain.linearRampToValueAtTime(gain,t+decal+0.0008);g.gain.exponentialRampToValueAtTime(0.0001,t+decal+duree);
        src.connect(f);f.connect(g);g.connect(sortie);src.start(t+decal);
      },
      choc:function(decal,gain,f0,f1,duree){
        var o=c.createOscillator();o.type='sine';
        o.frequency.setValueAtTime(f0,t+decal);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+decal+duree);
        var g=c.createGain();
        g.gain.setValueAtTime(gain,t+decal);g.gain.exponentialRampToValueAtTime(0.0001,t+decal+duree);
        o.connect(g);g.connect(sortie);o.start(t+decal);o.stop(t+decal+duree+0.02);
      },
      /* nappe de rotation : bruit passe-bande grave + ronronnement 50-60 Hz */
      rotation:function(decal,duree,gain,f0,f1){
        var src=c.createBufferSource();src.buffer=bruit_(duree);
        var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=0.8;
        f.frequency.setValueAtTime(f0,t+decal);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+decal+duree);
        var g=c.createGain();
        g.gain.setValueAtTime(0.0001,t+decal);g.gain.linearRampToValueAtTime(gain,t+decal+Math.min(0.15,duree*0.25));
        g.gain.linearRampToValueAtTime(gain*0.85,t+decal+duree*0.8);g.gain.linearRampToValueAtTime(0.0001,t+decal+duree);
        src.connect(f);f.connect(g);g.connect(sortie);src.start(t+decal);
        var o=c.createOscillator();o.type='sawtooth';
        o.frequency.setValueAtTime(52,t+decal);o.frequency.linearRampToValueAtTime(56,t+decal+duree);
        var lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(260,t+decal);
        var go=c.createGain();
        go.gain.setValueAtTime(0.0001,t+decal);go.gain.linearRampToValueAtTime(gain*0.45,t+decal+0.12);go.gain.linearRampToValueAtTime(0.0001,t+decal+duree);
        o.connect(lp);lp.connect(go);go.connect(sortie);o.start(t+decal);o.stop(t+decal+duree+0.02);
      },
      /* sifflement de plateau qui monte en vitesse */
      sifflement:function(decal,duree,gain,f0,f1){
        var o=c.createOscillator();o.type='sine';
        o.frequency.setValueAtTime(f0,t+decal);o.frequency.exponentialRampToValueAtTime(f1,t+decal+duree);
        var g=c.createGain();
        g.gain.setValueAtTime(0.0001,t+decal);g.gain.linearRampToValueAtTime(gain,t+decal+duree*0.6);g.gain.linearRampToValueAtTime(0.0001,t+decal+duree);
        o.connect(g);g.connect(sortie);o.start(t+decal);o.stop(t+decal+duree+0.02);
      }
    };
  }

  function construire(c,sortie,t,i,alea){
    var a=typeof alea==='function'?alea:Math.random;
    var o=outils_(c,sortie,t,a);
    var k,d;
    if(i===0){
      /* Grattements de tête : petites rafales de « tic » irréguliers, la tête cherche son secteur */
      d=0;
      for(k=0;k<14;k++){
        o.clic(d,0.16+a()*0.1,1800+a()*1400,3,0.012+a()*0.01);
        if(a()<0.4)o.choc(d,0.05,140,60,0.03);
        d+=0.045+a()*0.12;
      }
      o.rotation(0,d+0.2,0.035,180,140);
    }else if(i===1){
      /* Lecture crépitante : flux fin et dense de claquements, avec un souffle de fond */
      d=0;
      for(k=0;k<70;k++){
        o.clic(d,0.05+a()*0.06,2500+a()*2500,2.5,0.006+a()*0.006);
        d+=0.012+a()*0.034;
      }
      o.rotation(0,d+0.15,0.05,220,170);
    }else if(i===2){
      /* Rotation et déplacements de tête : ronronnement continu, trois déplacements (grésillement puis tchak) */
      o.rotation(0,2.2,0.07,200,150);
      [0.4,1.0,1.6].forEach(function(deb){
        for(k=0;k<6;k++)o.clic(deb+k*0.018,0.10+a()*0.05,2200+k*180,3,0.014);
        o.choc(deb+0.12,0.12,170,70,0.05);
        o.clic(deb+0.12,0.22,900,2,0.02);
      });
    }else if(i===3){
      /* Démarrage du plateau : le moteur monte en régime avec son sifflement, quelques tic de tête, puis le ronron s'installe */
      o.rotation(0,2.6,0.06,90,240);
      o.sifflement(0.1,1.8,0.025,300,1200);
      o.sifflement(0.2,1.9,0.012,600,2400);
      for(k=0;k<5;k++)o.clic(1.7+k*0.09+a()*0.04,0.14,2000+a()*1000,3,0.012);
      o.choc(2.15,0.12,160,60,0.05);
    }else if(i===4){
      /* Gros « tchak » de tête (l'aiguille retombe), puis une rafale qui s'espace */
      o.choc(0,0.28,220,55,0.09);
      o.clic(0,0.4,700,1.4,0.035);
      d=0.12;
      for(k=0;k<16;k++){
        o.clic(d,0.2-k*0.008,1500+a()*1800,3,0.012);
        d+=0.04+k*0.012+a()*0.03;
      }
      o.rotation(0,d+0.2,0.04,170,140);
    }else{
      /* Défragmentation : tic-tac régulier qui s'accélère puis se calme, avec de petits coups graves */
      d=0;
      var pas=0.22;
      for(k=0;k<26;k++){
        o.clic(d,0.14+a()*0.05,1900+a()*900,3,0.012);
        if(k%3===0)o.choc(d,0.07,150,65,0.04);
        d+=pas*(k<13?(1-k*0.05):(0.4+(k-13)*0.07));
      }
      o.rotation(0,d+0.2,0.05,190,150);
    }
  }

  var voixCourante=null;
  function couperVoix_(c){
    if(!voixCourante)return;
    var v=voixCourante;voixCourante=null;
    try{
      var g=v.gain,now=c.currentTime;
      if(typeof g.cancelScheduledValues==='function')g.cancelScheduledValues(now);
      g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0.0001,now+0.01);
      setTimeout(function(){try{v.disconnect();}catch(_e){}},80);
    }catch(_e){}
  }
  function jouer(i){
    i=Math.floor(Number(i));
    if(!(i>=0&&i<NOMS.length))return false;
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      couperVoix_(c);
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*GAIN_MAITRE;maitre.connect(c.destination);
      voixCourante=maitre;
      construire(c,maitre,c.currentTime+0.01,i);
      return true;
    }catch(_e){return false;}
  }

  /* Tirage : un bruit au hasard, jamais le même deux fois de suite. */
  function choisir(alea){
    var a=typeof alea==='function'?alea:Math.random;
    var i=Math.floor(a()*NOMS.length);
    if(i===dernier)i=(i+1+Math.floor(a()*(NOMS.length-1)))%NOMS.length;
    dernier=i;
    return i;
  }
  /* L'ordinateur rétro est allumé ET affiché (écran de bureau). */
  function ordinateurAffiche_(){
    try{return Boolean(document.querySelector('.wd-poste[data-phase="bureau"]'));}catch(_e){return false;}
  }
  function planifier_(){
    if(!actif)return;
    clearTimeout(minuteur);
    minuteur=setTimeout(function(){
      if(!actif)return;
      if(!document.hidden&&ordinateurAffiche_())jouer(choisir());
      planifier_();
    },6000+Math.random()*16000);
  }
  function demarrer(){
    if(actif)return false;
    actif=true;
    planifier_();
    return true;
  }
  function arreter(){
    actif=false;clearTimeout(minuteur);minuteur=0;
  }

  window.__SOREAL_IDLE_WANDOOS_DISQUE_V1__={NOMS:NOMS,jouer:jouer,construire:construire,choisir:choisir,demarrer:demarrer,arreter:arreter,ordinateurAffiche:ordinateurAffiche_};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer);else demarrer();
})();
