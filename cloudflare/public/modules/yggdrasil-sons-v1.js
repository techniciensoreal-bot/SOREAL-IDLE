/*
 * SOREAL IDLE — sons de la page des fruits (Norman, 2026-10-06 : « toute une panoplie de sons, pour les interrupteurs, les boutons… des sons agréables »).
 * Tout est synthétisé (aucun fichier) : doux, boisé et cristallin, dans une même gamme pentatonique (do-ré-mi-sol-la) pour que tout sonne juste ensemble.
 * Volume = barre « Sons de l'interface » des Réglages (0 quand la case est décochée : aucun son et aucun contexte audio créé).
 *
 *   window.__SOREAL_IDLE_YGG_SONS_V1__ = { jouer(nom), noms, construire(nom, contexte, sortie, t, alea) }
 *
 * Sons : interrupteur (marche / arrêt), onglet, aide, activer, ameliorer, manger, recolter, poop, tout, pret.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_YGG_SONS_V1__)return;

  /* Gamme pentatonique (Hz) : do5 ré5 mi5 sol5 la5 do6 ré6 mi6. */
  var G={do5:523.25,re5:587.33,mi5:659.25,sol5:783.99,la5:880,do6:1046.5,re6:1174.66,mi6:1318.51,sol6:1567.98,la4:440,mi4:329.63,sol4:392};

  /* Une note douce : sinus (ou triangle) avec attaque courte, extinction exponentielle et un peu de partiel aigu pour le côté « cristal ». */
  function note(c,out,t,f,duree,gain,type,partiel){
    var o=c.createOscillator();o.type=type||'sine';
    o.frequency.setValueAtTime(f,t);
    var g=c.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,gain),t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t+duree);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+duree+0.02);
    if(partiel){
      var p=c.createOscillator();p.type='sine';p.frequency.setValueAtTime(f*partiel,t);
      var pg=c.createGain();pg.gain.setValueAtTime(0.0001,t);
      pg.gain.exponentialRampToValueAtTime(Math.max(0.0002,gain*0.35),t+0.006);
      pg.gain.exponentialRampToValueAtTime(0.0001,t+duree*0.55);
      p.connect(pg);pg.connect(out);p.start(t);p.stop(t+duree);
    }
  }
  /* Une glissade de hauteur (sinus). */
  function glisse(c,out,t,f0,f1,duree,gain,type){
    var o=c.createOscillator();o.type=type||'sine';
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+duree);
    var g=c.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,gain),t+Math.min(0.02,duree/3));
    g.gain.exponentialRampToValueAtTime(0.0001,t+duree);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+duree+0.02);
  }
  /* Un souffle filtré (froissement de feuilles, croc, page qui tourne). */
  function souffle(c,out,t,duree,type,f0,f1,q,gain,alea){
    var a=typeof alea==='function'?alea:Math.random;
    var n=Math.max(1,Math.floor(c.sampleRate*duree));
    var tampon=c.createBuffer(1,n,c.sampleRate);
    var d=tampon.getChannelData(0);
    for(var i=0;i<n;i++){var x=i/n;d[i]=(a()*2-1)*Math.sin(Math.PI*Math.min(1,x*1.6))*Math.pow(1-x,1.4);}
    var src=c.createBufferSource();src.buffer=tampon;
    var f=c.createBiquadFilter();f.type=type;f.Q.value=q;
    f.frequency.setValueAtTime(f0,t);
    if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(f1,t+duree);
    var g=c.createGain();g.gain.value=gain;
    src.connect(f);f.connect(g);g.connect(out);src.start(t);
  }

  var SONS={
    /* Interrupteur : deux « toc » de bois, plus haut quand on allume, plus bas quand on éteint. */
    interrupteur:function(c,out,t,a,on){
      var h=on===false?0.78:1;
      glisse(c,out,t,560*h,360*h,0.09,0.5,'sine');
      souffle(c,out,t,0.025,'bandpass',2600*h,2200*h,2,0.25,a);
      note(c,out,t+0.045,G.sol5*h,0.16,0.12,'triangle',2);
    },
    onglet:function(c,out,t){
      note(c,out,t,G.mi5,0.32,0.22,'sine',2.01);
      note(c,out,t+0.07,G.la5,0.4,0.2,'sine',2.01);
    },
    aide:function(c,out,t,a){
      souffle(c,out,t,0.2,'bandpass',700,3200,1.4,0.5,a);
      note(c,out,t+0.14,G.do6,0.28,0.1,'sine',2);
    },
    activer:function(c,out,t){
      glisse(c,out,t,300,920,0.32,0.28,'sine');
      note(c,out,t+0.28,G.sol5,0.5,0.22,'sine',2.01);
      note(c,out,t+0.34,G.re6,0.55,0.14,'sine',2.01);
    },
    ameliorer:function(c,out,t){
      [G.do5,G.mi5,G.sol5,G.do6,G.mi6].forEach(function(f,i){note(c,out,t+i*0.065,f,0.38,0.2,'triangle',2.01);});
      note(c,out,t+0.36,G.sol6,0.6,0.1,'sine',2);
    },
    manger:function(c,out,t,a){
      souffle(c,out,t,0.06,'bandpass',1900,1300,1.8,0.9,a);
      souffle(c,out,t+0.085,0.07,'bandpass',1500,1000,1.8,0.8,a);
      glisse(c,out,t,150,110,0.07,0.35,'sine');
      glisse(c,out,t+0.2,330,150,0.12,0.3,'sine');
      note(c,out,t+0.27,G.mi5,0.3,0.1,'sine',2);
    },
    recolter:function(c,out,t,a){
      souffle(c,out,t,0.24,'highpass',3800,5200,0.8,0.5,a);
      note(c,out,t+0.1,G.la4,0.3,0.2,'triangle',2.01);
      note(c,out,t+0.2,G.mi5,0.4,0.2,'triangle',2.01);
    },
    poop:function(c,out,t){
      glisse(c,out,t,420,150,0.11,0.45,'sine');
      glisse(c,out,t+0.09,640,1050,0.07,0.2,'sine');
      note(c,out,t+0.14,G.do5,0.2,0.08,'sine',2);
    },
    tout:function(c,out,t){
      [G.do5,G.re5,G.mi5,G.sol5,G.la5,G.do6,G.re6,G.mi6].forEach(function(f,i){note(c,out,t+i*0.055,f,0.45,0.17,'triangle',2.01);});
      note(c,out,t+0.5,G.sol6,0.7,0.1,'sine',2);
    },
    /* Un fruit est prêt : tintement de célesta. */
    pret:function(c,out,t){
      note(c,out,t,G.mi6,0.7,0.14,'sine',2.76);
      note(c,out,t+0.11,G.sol6,0.8,0.1,'sine',2.76);
    }
  };

  var ac=null;
  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
  }
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  function jouer(nom,option){
    if(!SONS[nom])return false;
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.5;maitre.connect(c.destination);
      SONS[nom](c,maitre,c.currentTime+0.005,undefined,option);
      return true;
    }catch(_e){return false;}
  }

  window.__SOREAL_IDLE_YGG_SONS_V1__={
    jouer:jouer,
    noms:Object.keys(SONS),
    construire:function(nom,c,out,t,alea,option){if(SONS[nom])SONS[nom](c,out,t,alea,option);}
  };
})();
