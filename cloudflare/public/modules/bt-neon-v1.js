/*
 * SOREAL IDLE — le menu Entraînement de base s'éteint à chaque Renaissance et se rallume comme des tubes néon (Norman, 2026-10-21 : « sur Unity, tout le menu Basic Training était éteint après un rebirth, avec un effet d'allumage comme pour des tubes néon : ils clignotent avant de s'allumer ;
 * joue là-dessus pour que l'activation du Basic Training soit un allumage de tout le menu, avec des sons »).
 *
 *  - Après une Renaissance (records.totalRebirths a changé), le menu est ÉTEINT : sombre et terne, mais utilisable.
 *  - À la PREMIÈRE ouverture du menu après une Renaissance (et seulement là), tout le menu s'allume, bloc après bloc (titre, barre d'outils, puis chaque ligne d'Attaque et de Défense), chacun clignotant comme un tube néon avant de tenir.
 *  - Chaque barre qui a de l'énergie garde SON démarrage de base (bt-lumieres-v1.js : démarrage 1/2/3/5/6, le néon pour la première barre), joué à l'instant où sa ligne s'allume.
 *  - Hors de cette première ouverture, ni animation ni son : le menu est simplement allumé (Norman, 2026-10-21 : « uniquement quand on va dans Basic Training la première fois après un rebirth »).
 *  - Sons synthétisés (aucun fichier) : grésillements et claquements du starter, « pop » à chaque tube qui prend, ronronnement grave qui s'installe. Volume = barre « Sons de l'interface » des Réglages (rien à volume 0).
 *  - Aucun effet pour un joueur qui n'a pas encore connu de Renaissance depuis la mise en place : le menu reste allumé.
 *  - « Réduire les animations » : le menu s'allume d'un coup, sans clignotement ni son.
 *
 * L'état (éteint / allumé) est mémorisé par Renaissance dans le stockage (donc lié au compte, règle n°6) ; l'attribut data-bt-neon posé sur la page est gardé par le redessin (règle n°4).
 *   window.__SOREAL_IDLE_BT_NEON_V1__ = { demo(), etat(), jouerSons(contexte, sortie, t0) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BT_NEON_V1__)return;

  var CLE='soreal_idle_bt_neon_v1';
  var DUREE_MS=3900;

  /* Instants d'allumage (secondes) : même calendrier pour la feuille de style et pour les sons. */
  var TETE=0,BARRE=0.45,PANNEAU_A=0.9,PANNEAU_D=1.85,PAS=0.11,DUREE_TUBE=0.95;
  var MOMENTS_ALLUMAGE=[0.085,0.23,0.39,0.84];   /* instants (s) où le tube claque « allumé » pendant son clignotement, puis tient */

  function hote_(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function etatJeu_(){var h=hote_();return h&&h.getIdleEtat?h.getIdleEtat():null;}
  function renaissances_(){try{return Number(etatJeu_().systemes.records.totalRebirths)||0;}catch(_e){return 0;}}
  function lire_(){try{var o=JSON.parse(localStorage.getItem(CLE)||'null');return o&&typeof o==='object'?o:null;}catch(_e){return null;}}
  function ecrire_(o){try{localStorage.setItem(CLE,JSON.stringify(o));}catch(_e){}}
  function reduit_(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}

  /* État par Renaissance : jamais vu = allumé (pas de surprise en pleine partie) ; la Renaissance a changé = éteint. */
  function etat(){
    var r=renaissances_(),s=lire_();
    if(!s||typeof s.r!=='number'){s={r:r,on:true};ecrire_(s);return s;}
    if(s.r!==r){s={r:r,on:false};ecrire_(s);}
    return s;
  }

  var enCours=false,minuterie=0;
  function racine_(){return document.querySelector('.soreal-idle-page-root-v28[data-menu="entrainement"]');}
  function appliquer_(){
    var r=racine_();
    if(!r)return;
    var s=etat(),voulu=enCours?'allumage':(s.on?'':'eteint'),actuel=r.getAttribute('data-bt-neon')||'';
    if(voulu===actuel)return;
    if(voulu)r.setAttribute('data-bt-neon',voulu);else r.removeAttribute('data-bt-neon');
  }

  /* ----- sons ----- */
  var ctxAudio=null;
  function volume_(){var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;}
  function contexte_(){
    if(ctxAudio&&ctxAudio.state!=='closed')return ctxAudio;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{var L=window.__SOREAL_IDLE_LIMITEUR_V1__;ctxAudio=(L&&L.contexte&&L.contexte())||new C();}catch(_e){ctxAudio=null;}
    return ctxAudio;
  }
  function bruit_(c,out,t,duree,f,q,gain){
    var n=Math.max(1,Math.floor(c.sampleRate*duree)),tampon=c.createBuffer(1,n,c.sampleRate),d=tampon.getChannelData(0);
    for(var i=0;i<n;i+=1){var x=i/n;d[i]=(Math.random()*2-1)*Math.pow(1-x,2);}
    var src=c.createBufferSource();src.buffer=tampon;
    var fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.setValueAtTime(f,t);fl.Q.value=q;
    var g=c.createGain();g.gain.value=gain;
    src.connect(fl);fl.connect(g);g.connect(out);src.start(t);
  }
  function ton_(c,out,t,type,f0,f1,duree,gain,filtre){
    var o=c.createOscillator();o.type=type;
    o.frequency.setValueAtTime(f0,t);
    if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+duree);
    var g=c.createGain(); g.gain.value=0.0001;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,gain),t+Math.min(0.012,duree/3));
    g.gain.exponentialRampToValueAtTime(0.0001,t+duree);
    var cible=out;
    if(filtre){var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=filtre;o.connect(fl);fl.connect(g);}else o.connect(g);
    g.connect(cible);o.start(t);o.stop(t+duree+0.02);
  }
  /* Calendrier des tubes : titre, barre d'outils, tête et six lignes d'Attaque, tête et six lignes de Défense. */
  function calendrier(){
    var l=[TETE,BARRE,PANNEAU_A],i;
    for(i=1;i<=6;i+=1)l.push(1.0+PAS*(i-1));
    l.push(PANNEAU_D);
    for(i=1;i<=6;i+=1)l.push(1.95+PAS*(i-1));
    return l;
  }
  function jouerSons(c,out,t0){
    var cal=calendrier();
    cal.forEach(function(d,k){
      var t=t0+d;
      /* starter : claquements secs à chaque clignotement + petit grésillement électrique */
      MOMENTS_ALLUMAGE.forEach(function(m,i){
        var dernier=i===MOMENTS_ALLUMAGE.length-1;
        bruit_(c,out,t+m,0.014,2600+((k*377+i*911)%1800),3,dernier?0.2:0.13);
        if(!dernier)ton_(c,out,t+m,'sawtooth',120+((k*13)%40),95,0.07,0.035,700);
      });
      /* le tube prend : « pop » montant */
      ton_(c,out,t+0.84,'sine',240+((k*31)%60),960,0.1,0.11);
    });
    /* le menu entier ronronne : bourdonnement grave qui s'installe puis s'efface */
    var fin=t0+2.7;
    ton_(c,out,fin,'sawtooth',55,55,1.4,0.07,260);
    ton_(c,out,fin,'sine',110,112,1.4,0.05);
    ton_(c,out,fin+0.05,'triangle',220,222,1.1,0.025);
  }
  /* Démarrages propres à chaque barre (Norman, 2026-10-21) : [{d: instant en s, type}] pour les compétences qui ont de l'énergie, d'après le calendrier de leur ligne. */
  function barresAvecEnergie_(){
    var L=window.__SOREAL_IDLE_BT_LUMIERES_V1__,j=etatJeu_(),sk=j&&j.basicTraining&&Array.isArray(j.basicTraining.skills)?j.basicTraining.skills:[],out=[];
    if(!L||typeof L.variantePourBarre!=='function')return out;
    var vus={};
    sk.forEach(function(b,i){
      if(!b||!b.unlocked||!(Number(b.allocation)>0))return;
      var defense=i>=6,k=i%6,d=k===0?(defense?PANNEAU_D:PANNEAU_A):(defense?1.95:1.0)+PAS*(k-1);
      var type='allume';   /* Norman (2026-10-22) : le néon qui s'allume pour toute barre */
      /* Une seule fois par son : une barre d'attaque et sa jumelle de défense ont le même démarrage, et les deux premières barres le même néon ; entendu deux fois, le même bruit à une seconde d'écart sonnait faux (Norman, 2026-10-22). */
      if(vus[type])return;
      vus[type]=1;
      out.push({d:d,type:type});
    });
    return out;
  }
  function sonsBarres_(c,out,t0){
    var L=window.__SOREAL_IDLE_BT_LUMIERES_V1__;
    if(!L||typeof L.construire!=='function')return;
    barresAvecEnergie_().forEach(function(x){try{L.construire(c,out,t0+x.d,x.type);}catch(_e){}});
  }
  function sons_(){
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.5;(window.__SOREAL_IDLE_LIMITEUR_V1__&&window.__SOREAL_IDLE_LIMITEUR_V1__.brancher(c,maitre))||maitre.connect(c.destination);
      jouerSons(c,maitre,c.currentTime+0.03);
      sonsBarres_(c,maitre,c.currentTime+0.03);
      return true;
    }catch(_e){return false;}
  }

  /* ----- allumage ----- */
  function allumer_(force){
    if(enCours)return false;
    ecrire_({r:renaissances_(),on:true});
    if(reduit_()){appliquer_();return true;}
    enCours=true;
    appliquer_();
    sons_();
    clearTimeout(minuterie);
    minuterie=setTimeout(function(){enCours=false;appliquer_();},DUREE_MS);
    return true;
  }
  function verifier_(){
    var s=etat();
    if(!s.on&&!enCours&&racine_())allumer_();   /* menu ouvert pour la 1re fois depuis la Renaissance */
    appliquer_();
  }

  /* Démonstration (console ou bouton de l'administrateur) : éteint tout, puis rallume avec effet et sons. */
  function demo(){
    ecrire_({r:renaissances_(),on:false});
    enCours=false;clearTimeout(minuterie);
    appliquer_();
    setTimeout(function(){allumer_(true);},700);
  }

  /* ----- feuille de style : éteint, clignotement néon, calendrier par bloc ----- */
  function css_(){
    var R='.soreal-idle-page-root-v28[data-menu="entrainement"][data-bt-neon]';
    var s='';
    s+=R.replace('[data-bt-neon]','[data-bt-neon="eteint"]')+'>:is(.soreal-idle-page-head-v28,.soreal-idle-bt-toolbar-v120),'+R.replace('[data-bt-neon]','[data-bt-neon="eteint"]')+'>.soreal-idle-bt-panel-v120>:is(.soreal-idle-bt-panel-head-v120,.soreal-idle-bt-row-v120){filter:brightness(.26) saturate(.25)}';
    var A=R.replace('[data-bt-neon]','[data-bt-neon="allumage"]');
    s+=A+'>:is(.soreal-idle-page-head-v28,.soreal-idle-bt-toolbar-v120),'+A+'>.soreal-idle-bt-panel-v120>:is(.soreal-idle-bt-panel-head-v120,.soreal-idle-bt-row-v120){animation:btNeonV1 '+DUREE_TUBE+'s step-end both;animation-delay:var(--btd,0s)}';
    /* Les deux dernières lignes de chaque groupe (rang 4 et 5 : Charge, Bonus ultime, Attaque perçante, Attaque ultime) ont leur propre animation permanente (reflet, battement) posée en !important par la feuille des rangs : elle remplaçait l'allumage néon, donc ces lignes ne s'allumaient pas (Norman, 2026-10-24). On joue les DEUX : l'allumage puis, en parallèle, leur animation de rang. */
    var PRE='html body.soreal-idle-active-v47.soreal-idle-active-v47 ';
    s+=PRE+A+'>.soreal-idle-bt-panel-v120>.soreal-idle-bt-row-v120[data-rang-v1="4"]{animation:btNeonV1 '+DUREE_TUBE+'s step-end var(--btd,0s) both,rgSheenV1 3.2s linear infinite!important}';
    s+=PRE+A+'>.soreal-idle-bt-panel-v120>.soreal-idle-bt-row-v120[data-rang-v1="5"]{animation:btNeonV1 '+DUREE_TUBE+'s step-end var(--btd,0s) both,rgBatV1 1.6s ease-in-out infinite!important}';
    s+=A+'>.soreal-idle-page-head-v28{--btd:'+TETE+'s}'+A+'>.soreal-idle-bt-toolbar-v120{--btd:'+BARRE+'s}';
    s+=A+'>.soreal-idle-bt-panel-v120.attack>.soreal-idle-bt-panel-head-v120{--btd:'+PANNEAU_A+'s}'+A+'>.soreal-idle-bt-panel-v120.defense>.soreal-idle-bt-panel-head-v120{--btd:'+PANNEAU_D+'s}';
    for(var i=1;i<=12;i+=1){
      s+=A+'>.soreal-idle-bt-panel-v120.attack>.soreal-idle-bt-row-v120:nth-child('+(i+1)+'){--btd:'+(1.0+PAS*(i-1)).toFixed(3)+'s}';
      s+=A+'>.soreal-idle-bt-panel-v120.defense>.soreal-idle-bt-row-v120:nth-child('+(i+1)+'){--btd:'+(1.95+PAS*(i-1)).toFixed(3)+'s}';
    }
    var NEON='drop-shadow(0 0 9px rgba(130,225,255,.95))';
    s+='@keyframes btNeonV1{0%{filter:brightness(.26) saturate(.25)}9%{filter:brightness(1.7) saturate(1.2) '+NEON+'}13%{filter:brightness(.26) saturate(.25)}24%{filter:brightness(1.3) saturate(1.1) '+NEON+'}27%{filter:brightness(.3) saturate(.3)}38%{filter:brightness(.3) saturate(.3)}41%{filter:brightness(1.5) saturate(1.15) '+NEON+'}47%{filter:brightness(.45) saturate(.5)}58%{filter:brightness(1.2) saturate(1.1)}63%{filter:brightness(.35) saturate(.35)}74%{filter:brightness(1.4) saturate(1.15) '+NEON+'}79%{filter:brightness(.8) saturate(.8)}88%{filter:brightness(1.6) saturate(1.2) '+NEON+'}100%{filter:none}}';
    return s;
  }
  function installer_(){
    if(document.getElementById('sorealIdleBtNeonStyleV1'))return;
    var st=document.createElement('style');
    st.id='sorealIdleBtNeonStyleV1';
    st.textContent=css_();
    (document.head||document.documentElement).appendChild(st);
  }

  /* Le redessin de la page laisse l'attribut en place (règle n°4) et le réapplique tout de suite si besoin. */
  (window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]);
  if(window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__.indexOf('data-bt-neon')===-1)window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__.push('data-bt-neon');
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{verifier_();}catch(_e){}});
  if(typeof document!=='undefined'&&typeof setInterval==='function'){
    installer_();
    setInterval(function(){if(!document.hidden){try{verifier_();}catch(_e){}}},500);
  }

  window.__SOREAL_IDLE_BT_NEON_V1__={demo:demo,etat:etat,jouerSons:jouerSons,barresAvecEnergie:barresAvecEnergie_,calendrier:calendrier,css:css_};
})();
