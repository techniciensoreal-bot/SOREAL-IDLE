/*
 * SOREAL IDLE — sons de la page des fruits (Norman, 2026-10-06 : « toute une panoplie de sons, pour les interrupteurs, les boutons… des sons agréables »).
 * Tout est synthétisé (aucun fichier) : doux, boisé et cristallin, dans une même gamme pentatonique (do-ré-mi-sol-la) pour que tout sonne juste ensemble.
 * Volume = barre « Sons de l'interface » des Réglages (0 quand la case est décochée : aucun son et aucun contexte audio créé).
 *
 *   window.__SOREAL_IDLE_YGG_SONS_V1__ = { jouer(nom), noms, construire(nom, contexte, sortie, t, alea) }
 *
 * Sons : interrupteur (marche / arrêt), onglet, aide, activer, ameliorer, manger, recolter, poop, tout, pret, porte (pierre) et porteBois (ouverture de la porte d'un fruit qui s'active, deux versions), porteFerme et porteFermeBois (fermeture).
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
    /*
     * LA PORTE S'OUVRE, deux versions au choix (Norman, 2026-10-16 : « pas fan du bruit de la porte, on dirait de nouveau un pet »). Le piège évité : une dent de scie grave qui vibre = un pet. Ici AUCUN
     * grondement tonal qui vibre : que du bruit filtré (frottement) et des chocs.
     *  - porte (PIERRE, lourde) : dalle de pierre qui racle en grondant sourdement avec des grains qui crissent (aucun coup au début), puis un final doux et mélodieux : brise, petite harpe pentatonique, accord tenu, oiseaux ;
     *  - porteBois (BOIS) : loquet, gonds qui couinent par à-coups (saccades de bois qui frotte, hauteur qui change à chaque saccade), puis deux coups sourds de bois qui arrive en butée.
     * vit = facteur de durée (0,5 à 2,5) : instants et durées multipliés, hauteurs inchangées.
     */
    porte:function(c,out,t,a,vit){
      var k=Number(vit)>0?Math.max(.4,Math.min(3,Number(vit))):1,al=typeof a==='function'?a:Math.random;
      /* Pas de « boom » ni de verrou au début (Norman, 2026-10-16) : le son démarre directement par le frottement. */
      /* La dalle racle : grondement sourd (bruit filtré, rien de tonal) et crissement de grains. */
      souffle(c,out,t+0.02*k,1.0*k,'lowpass',210,110,1.2,0.8,a);
      souffle(c,out,t+0.02*k,1.0*k,'bandpass',320,170,3.5,0.5,a);
      for(var i=0;i<14;i++)souffle(c,out,t+(0.06+i*0.062)*k,0.03*k,'bandpass',900+al()*1500,700+al()*900,2.5,0.22+al()*0.1,a);
      /* Plus de mélodie finale (Norman, 2026-10-21 : « le son de la porte est bien, mais enlève la petite mélodie après ») : le son s'arrête avec le frottement de la dalle. */
    },
    /*
     * LA PORTE SE REFERME (Norman, 2026-10-17 : le son d'ouverture joué à l'envers « donne mal »). Un son fait pour fermer, écrit à l'endroit : la dalle de pierre glisse et racle sourdement (même matière
     * que l'ouverture), puis se pose avec un tassement doux, et deux notes de cristal descendent en s'éteignant, comme un soupir. Aucun coup sec, aucune dent de scie.
     */
    porteFerme:function(c,out,t,a,vit){
      var k=Number(vit)>0?Math.max(.4,Math.min(3,Number(vit))):1,al=typeof a==='function'?a:Math.random;
      souffle(c,out,t,0.9*k,'lowpass',130,230,1.2,0.75,a);
      souffle(c,out,t,0.9*k,'bandpass',200,330,3.5,0.45,a);
      for(var i=0;i<11;i++)souffle(c,out,t+(0.03+i*0.07)*k,0.03*k,'bandpass',900+al()*1500,700+al()*900,2.5,0.2+al()*0.08,a);
      /* Elle se pose : un tassement sourd et doux, avec un peu de poussière. */
      glisse(c,out,t+0.88*k,96,44,0.5*k,0.55,'sine');
      souffle(c,out,t+0.88*k,0.22*k,'lowpass',320,110,1,0.4,a);
      souffle(c,out,t+0.92*k,0.5*k,'highpass',3200,4800,0.7,0.06,a);
      /* Le soupir : deux notes de cristal qui descendent. */
      note(c,out,t+1.05*k,G.mi6,0.7*k,0.08,'triangle',2.01);
      note(c,out,t+1.22*k,G.do6,0.9*k,0.07,'triangle',2.01);
      note(c,out,t+1.42*k,G.sol5,1.1*k,0.06,'triangle',2.01);
    },
    porteFermeBois:function(c,out,t,a,vit){
      var k=Number(vit)>0?Math.max(.4,Math.min(3,Number(vit))):1,al=typeof a==='function'?a:Math.random;
      /* Les gonds couinent par saccades, de moins en moins fort, puis le vantail se pose : un « toc » sourd et un petit loquet. */
      for(var i=0;i<9;i++){
        var tt=t+(0.02+i*0.085)*k,f=210-(i%4)*30+al()*20,d=(0.05+al()*0.03)*k;
        var o=c.createOscillator();o.type='square';
        o.frequency.setValueAtTime(f,tt);o.frequency.exponentialRampToValueAtTime(f*0.85,tt+d);
        var fl=c.createBiquadFilter();fl.type='bandpass';fl.Q.value=6;fl.frequency.setValueAtTime(900+al()*400,tt);
        var g=c.createGain();
        g.gain.setValueAtTime(0.0001,tt);g.gain.exponentialRampToValueAtTime(0.15*(1-i*0.07),tt+d*0.25);g.gain.exponentialRampToValueAtTime(0.0001,tt+d);
        o.connect(fl);fl.connect(g);g.connect(out);o.start(tt);o.stop(tt+d+0.02);
        souffle(c,out,tt,d*1.1,'bandpass',800+al()*500,700,3,0.1,a);
      }
      glisse(c,out,t+0.82*k,140,60,0.2*k,0.7,'sine');
      souffle(c,out,t+0.82*k,0.08*k,'lowpass',500,180,1,0.5,a);
      souffle(c,out,t+0.97*k,0.03*k,'bandpass',1500,1100,3,0.4,a);
    },
    porteBois:function(c,out,t,a,vit){
      var k=Number(vit)>0?Math.max(.4,Math.min(3,Number(vit))):1,al=typeof a==='function'?a:Math.random;
      /* Loquet de bois : un « clac ». */
      souffle(c,out,t,0.035*k,'bandpass',1500,1100,3,0.55,a);
      glisse(c,out,t,260,120,0.06*k,0.6,'square');
      /* Gonds : une dizaine de couinements brefs, chacun d'une hauteur différente (bois qui frotte par saccades). */
      for(var i=0;i<12;i++){
        var tt=t+(0.14+i*0.085)*k,f=150+(i%4)*48+al()*34,d=(0.05+al()*0.03)*k;
        var o=c.createOscillator();o.type='square';
        o.frequency.setValueAtTime(f,tt);o.frequency.exponentialRampToValueAtTime(f*1.18,tt+d);
        var fl=c.createBiquadFilter();fl.type='bandpass';fl.Q.value=6;fl.frequency.setValueAtTime(1000+al()*500,tt);
        var g=c.createGain();
        g.gain.setValueAtTime(0.0001,tt);g.gain.exponentialRampToValueAtTime(0.16,tt+d*0.25);g.gain.exponentialRampToValueAtTime(0.0001,tt+d);
        o.connect(fl);fl.connect(g);g.connect(out);o.start(tt);o.stop(tt+d+0.02);
        souffle(c,out,tt,d*1.1,'bandpass',900+al()*600,800,3,0.12,a);
      }
      /* Le vantail de bois arrive en butée : deux coups sourds, le second plus léger. */
      glisse(c,out,t+1.15*k,150,55,0.22*k,0.9,'sine');
      souffle(c,out,t+1.15*k,0.1*k,'lowpass',600,200,1,0.7,a);
      glisse(c,out,t+1.31*k,130,60,0.16*k,0.5,'sine');
      souffle(c,out,t+1.31*k,0.07*k,'lowpass',500,200,1,0.4,a);
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
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.5;(window.__SOREAL_IDLE_LIMITEUR_V1__&&window.__SOREAL_IDLE_LIMITEUR_V1__.brancher(c,maitre))||maitre.connect(c.destination);
      SONS[nom](c,maitre,c.currentTime+0.005,undefined,option);
      return true;
    }catch(_e){return false;}
  }

  /*
   * Le coq (Norman, 2026-10-21 : « quand la porte s'ouvre dans Yggdrasil, un bruit de coq le matin ; juste après le son de la porte, une seule fois par renaissance, à la première animation d'ouverture ») : un vrai enregistrement, idle/ambient/coq.m4a dans le R2, servi par la route
   * des sons d'ambiance. Aucune condition d'heure (Norman, 2026-10-22 : « à la première ouverture de la porte après un rebirth »). Volume = barre « Sons de l'interface » ; jamais d'erreur si le fichier manque ou si le navigateur refuse la lecture.
   */
  var CLE_COQ_R2='idle/ambient/coq.m4a';
  function coq(delaiMs){
    var v=volume_();
    if(!(v>0))return false;
    try{
      var a=new Audio('/api/idle/media/ambient?key='+encodeURIComponent(CLE_COQ_R2));
      a.volume=Math.min(1,v);
      setTimeout(function(){try{var p=a.play();if(p&&p.catch)p.catch(function(){});}catch(_e){}},Math.max(0,Number(delaiMs)||0));
      return true;
    }catch(_e){return false;}
  }

  window.__SOREAL_IDLE_YGG_SONS_V1__={
    jouer:jouer,
    coq:coq,
    noms:Object.keys(SONS),
    construire:function(nom,c,out,t,alea,option){if(SONS[nom])SONS[nom](c,out,t,alea,option);}
  };
})();
