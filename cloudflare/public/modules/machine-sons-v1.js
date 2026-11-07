/*
 * SOREAL IDLE — les SONS propres à la Machine temporelle (Norman, 2026-11-07 : « j'aimerais des sons propres à la machine temporelle »). Synthétisés (aucun fichier), joués par le moteur audio commun
 * (window.__SOREAL_IDLE_AUDIO_V199__.synth : même volume général, mêmes réglages de son que tous les effets) :
 *   - « cling » : une pièce d'or qui tombe dans le tas, au rythme où elles tombent (1, 2, 4 ou 8 par seconde, jamais plus de 3 sons par seconde) ; COUPÉ (SON_PIECES = false) ;
 *   - « refus » : un bouton + − Max 0 sans effet (rien à placer ou à retirer) : deux chocs sourds ;
 *   - « niveau » : COUPÉ (SON_NIVEAU = false) ; un niveau gagné sur la barre d'Énergie ou de Magie : un balayage qui monte (le temps qui saute) puis une cloche claire.
 * (Les boutons + − Max 0 gardent leurs tics d'horloge : tmPlus / tmMinus / tmCap, audio-effects-v199.js.)
 * Rien ne joue hors de la page Machine (ni onglet caché) ; aucun son tant que la page n'est pas affichée : un petit balayage toutes les 125 ms, sans effet sur le dessin ni sur le jeu.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MACHINE_SONS_V1__)return;

function moteur(){var a=window.__SOREAL_IDLE_AUDIO_V199__;return a&&typeof a.synth==='function'?a:null;}
/* un oscillateur à enveloppe courte : fréquence f -> f2, durée d, volume v, départ t (secondes), forme type */
function ton(c,sortie,type,f,f2,d,v,t){
  var o=c.createOscillator(),g=c.createGain(),t0=c.currentTime+(t||0);
  o.type=type;o.frequency.setValueAtTime(f,t0);if(f2&&f2!==f)o.frequency.exponentialRampToValueAtTime(f2,t0+d);
  g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+Math.min(0.012,d/4));g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  o.connect(g);g.connect(sortie);o.start(t0);o.stop(t0+d+0.02);
}
/* pièce qui tombe sur le tas : tintement aigu et bref, deux harmoniques légèrement désaccordées (métal), hauteur un peu différente à chaque pièce */
function cling(){
  var a=moteur();if(!a)return;
  var base=2900+Math.random()*500;
  a.synth(260,function(c,sortie){
    ton(c,sortie,'sine',base,base*.985,.16,.020,0);
    ton(c,sortie,'sine',base*1.51,base*1.5,.11,.010,0.004);
    ton(c,sortie,'triangle',base*2.76,base*2.7,.07,.006,0.002);
  });
}
/* niveau gagné : le temps qui saute (balayage qui monte, filtré) puis une cloche claire (quinte) */
function niveau(){
  var a=moteur();if(!a)return;
  a.synth(900,function(c,sortie){
    var o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),t0=c.currentTime;
    o.type='sawtooth';o.frequency.setValueAtTime(180,t0);o.frequency.exponentialRampToValueAtTime(1500,t0+.32);
    f.type='lowpass';f.frequency.setValueAtTime(500,t0);f.frequency.exponentialRampToValueAtTime(5200,t0+.32);f.Q.value=2;
    g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(.035,t0+.20);g.gain.exponentialRampToValueAtTime(0.0001,t0+.36);
    o.connect(f);f.connect(g);g.connect(sortie);o.start(t0);o.stop(t0+.4);
    ton(c,sortie,'sine',1318.5,1318.5,.55,.040,.30);
    ton(c,sortie,'sine',1975.5,1975.5,.45,.022,.32);
    ton(c,sortie,'sine',2637,2637,.30,.010,.30);
  });
}

/* bouton sans effet (rien à placer, rien à retirer) : deux chocs sourds, pour que le clic ne reste jamais muet */
function refus(){
  var a=moteur();if(!a)return;
  a.synth(300,function(c,sortie){
    ton(c,sortie,'sine',150,95,.09,.070,0);
    ton(c,sortie,'sine',130,85,.10,.060,.085);
    ton(c,sortie,'square',420,300,.025,.012,0);
  });
}

/* surveillance : cadence des pièces (posée par machine-dessin-v1.js sur .tmm-machine) et niveaux affichés */
/* tintement des pièces COUPÉ (Norman, 2026-11-07 : « le bruit de pièce qui tombe, bof ») : le code reste, mettre à true pour le remettre */
var SON_PIECES=false;
/* son de niveau gagné COUPÉ (Norman, 2026-11-07 : « quand une barre prend un niveau ça fait ding, je n'ai jamais demandé ça ») : le code reste, mettre à true pour le remettre */
var SON_NIVEAU=false;
var dernierCling=0,niveaux={};
function balayer(){
  if(document.hidden)return;
  var m=document.querySelector('.tmm-machine');
  if(!m){niveaux={};return;}
  var maintenant=(window.performance&&performance.now)?performance.now():Date.now();
  var cad=Number(m.__cadencePieces)||0;
  if(cad>0){
    var visible=true,c=m.querySelector('.tmm-centre');
    if(c&&c.__tmmHors)visible=false;   /* hors écran : les pièces sont en pause, donc aucun son */
    if(SON_PIECES&&visible&&maintenant-dernierCling>=1000/Math.min(cad,3)){dernierCling=maintenant;cling();}
  }
  var joue=false;
  m.querySelectorAll('[data-tm-niveau]').forEach(function(e){
    var cle=e.getAttribute('data-tm-niveau'),t=String(e.textContent||'').trim(),avant=niveaux[cle];
    niveaux[cle]=t;
    if(avant!==undefined&&t!==avant&&t!=='0'&&t!=='')joue=true;   /* un niveau gagné (jamais le retour à 0 d'une renaissance) */
  });
  if(SON_NIVEAU&&joue)niveau();
}
setInterval(balayer,125);
window.__SOREAL_IDLE_MACHINE_SONS_V1__={cling:cling,niveau:niveau,refus:refus,balayer:balayer};
})();
