/*
 * SOREAL IDLE — musique de combat de Titan (Norman, 2026-10-15) : « une musique de fond angoissante et action pendant le combat des titans ».
 *
 * Musique GÉNÉRÉE par le navigateur (Web Audio : aucun fichier, aucun poids ajouté), en boucle sans à-coup sur 8 mesures à 148 battements par minute, en ré phrygien (la seconde mineure est la note qui angoisse) :
 *  - batterie : grosse caisse qui martèle, caisse claire sur 2 et 4, charleston, toms de taïko et roulement de caisse claire avant de reboucler ;
 *  - basse en croches, sombre, qui monte et descend avec les accords (ré, ré, si bémol, ré, ré, mi bémol, sol, la) ;
 *  - cordes en ostinato (notes courtes à la seconde mineure) sur la seconde moitié de la phrase, pour la tension ;
 *  - nappe dissonante (quinte + seconde mineure) qui s'ouvre doucement, coups de cuivres graves et « BWAAM » sub-grave sur les temps forts ;
 *  - montée de bruit (riser) dans la dernière mesure.
 * Elle se lance quand l'écran de combat de Titan est actif (modules/titans-combat-ecran-v1.js), avec un fondu à l'entrée et à la sortie ; le niveau suit la barre « Musique » des Réglages ; les sons d'ambiance d'Aventure sont
 * mis en pause pendant ce temps (ambient-audio-v1.js, suspendre) et reprennent après.
 *
 *   window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__ = { demarrer, arreter, actif, pas }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__)return;

var BPM=148;
var SEIZIEME=60/BPM/4;              /* durée d'une double-croche, en secondes */
var MESURES=8,PAS_PAR_MESURE=16,PAS_TOTAL=MESURES*PAS_PAR_MESURE;
var AVANCE=0.35;                    /* on programme le son 350 ms à l'avance */
var FONDU_ENTREE=2.2,FONDU_SORTIE=1.6;
var NIVEAU=0.55;                    /* niveau de la musique avant le curseur « Musique » */

/* Accords de la phrase (une note grave par mesure) : ré, ré, si bémol, ré, ré, mi bémol, sol, la */
var BASSES=[73.42,73.42,58.27,73.42,73.42,77.78,98.00,55.00];
var QUINTES=[110.00,110.00,87.31,110.00,110.00,116.54,146.83,82.41];

var ctx=null,sortie=null,bruitBuf=null,minuteur=0,prochain=0,pasCourant=0,enMarche=false,fonduFin=0,arretDemande=false;

function volumeReglage(){
  var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
  var v=r&&typeof r.getMusique==='function'?Number(r.getMusique()):(r&&typeof r.getAmbiance==='function'?Number(r.getAmbiance()):0.35);
  return Math.max(0,Math.min(1,Number.isFinite(v)?v:0.35));
}

function creerContexte(){
  if(ctx)return ctx;
  var C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  try{ctx=new C();}catch(_e){ctx=null;return null;}
  /* compresseur doux : la batterie et les cuivres ne saturent jamais */
  var comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-14;comp.knee.value=20;comp.ratio.value=5;comp.attack.value=0.004;comp.release.value=0.2;
  sortie=ctx.createGain();sortie.gain.value=0;
  sortie.connect(comp);comp.connect(ctx.destination);
  var n=Math.floor(ctx.sampleRate*1.5);bruitBuf=ctx.createBuffer(1,n,ctx.sampleRate);
  var d=bruitBuf.getChannelData(0);for(var i=0;i<n;i+=1)d[i]=Math.random()*2-1;
  return ctx;
}

/* ---------- briques ---------- */
function ton(t,o){
  var osc=ctx.createOscillator(),g=ctx.createGain(),noeud=osc;
  osc.type=o.type||'sine';
  osc.frequency.setValueAtTime(Math.max(20,o.f0),t);
  if(o.f1)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.d);
  if(o.detune)osc.detune.value=o.detune;
  if(o.filtre){
    var f=ctx.createBiquadFilter();f.type=o.filtre[0];f.Q.value=o.filtre[2]||1;
    f.frequency.setValueAtTime(o.filtre[1],t);
    if(o.filtre[3])f.frequency.exponentialRampToValueAtTime(o.filtre[3],t+o.d);
    osc.connect(f);noeud=f;
  }
  var a=o.a||0.005;
  g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,o.v),t+a);
  g.gain.exponentialRampToValueAtTime(0.0001,t+o.d);
  noeud.connect(g);g.connect(sortie);
  osc.start(t);osc.stop(t+o.d+0.05);
}
function souffle(t,o){
  var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=bruitBuf;
  f.type=o.type||'bandpass';f.Q.value=o.q||1;
  f.frequency.setValueAtTime(o.f0,t);
  if(o.f1)f.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.d);
  var a=o.a||0.003;
  g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,o.v),t+a);
  g.gain.exponentialRampToValueAtTime(o.fin||0.0001,t+o.d);
  s.connect(f);f.connect(g);g.connect(sortie);
  s.start(t,Math.random()*0.5);s.stop(t+o.d+0.05);
}

function grosseCaisse(t,v){
  ton(t,{type:'sine',f0:165,f1:44,d:0.22,v:0.95*v,a:0.002});
  souffle(t,{type:'lowpass',f0:2200,f1:200,d:0.05,v:0.3*v,a:0.001});
}
function caisseClaire(t,v){
  souffle(t,{type:'bandpass',f0:2000,f1:1400,d:0.17,v:0.42*v,q:0.9,a:0.001});
  ton(t,{type:'triangle',f0:210,f1:150,d:0.1,v:0.3*v,a:0.001});
}
function charley(t,v,ouvert){
  souffle(t,{type:'highpass',f0:7000,d:ouvert?0.14:0.04,v:0.16*v,q:0.7,a:0.001});
}
function tom(t,v,f){
  ton(t,{type:'sine',f0:f*1.7,f1:f,d:0.32,v:0.7*v,a:0.002});
  souffle(t,{type:'lowpass',f0:900,f1:150,d:0.06,v:0.18*v,a:0.001});
}
function basse(t,f,v,long){
  ton(t,{type:'sawtooth',f0:f,d:long?SEIZIEME*3.6:SEIZIEME*1.7,v:0.32*v,a:0.006,filtre:['lowpass',260,3,long?650:480]});
  ton(t,{type:'square',f0:f/2,d:long?SEIZIEME*3.6:SEIZIEME*1.7,v:0.22*v,a:0.006,filtre:['lowpass',180,1]});
}
function corde(t,f,v){
  ton(t,{type:'sawtooth',f0:f,d:SEIZIEME*0.9,v:0.075*v,a:0.004,detune:-7,filtre:['bandpass',2100,2.2]});
  ton(t,{type:'sawtooth',f0:f,d:SEIZIEME*0.9,v:0.06*v,a:0.004,detune:8,filtre:['bandpass',2300,2.2]});
}
function nappe(t,mesure){
  var d=PAS_PAR_MESURE*SEIZIEME;
  var base=BASSES[mesure]*2;
  var notes=[base,base*1.05946,QUINTES[mesure]*2,base*1.41421];     /* fondamentale, seconde mineure, quinte, triton : la dissonance qui angoisse */
  for(var i=0;i<notes.length;i+=1){
    ton(t,{type:'sawtooth',f0:notes[i],d:d,v:0.05,a:d*0.45,detune:(i%2?7:-7),filtre:['lowpass',380,1.2,900]});
  }
}
function cuivres(t,mesure,v){
  var f=BASSES[mesure];
  var d=SEIZIEME*5;
  var notes=[f*2,QUINTES[mesure]*2,f*4];
  for(var i=0;i<notes.length;i+=1)ton(t,{type:'sawtooth',f0:notes[i],d:d,v:0.16*v,a:0.012,detune:i*4-4,filtre:['lowpass',500,2,1400]});
  ton(t,{type:'sine',f0:f/2,f1:f/2*0.85,d:SEIZIEME*7,v:0.7*v,a:0.01});    /* BWAAM sub-grave */
}
function riser(t){
  var d=PAS_PAR_MESURE*SEIZIEME;
  souffle(t,{type:'bandpass',f0:500,f1:6500,d:d,v:0.22,q:3,a:d*0.9,fin:0.0001});
}

/* ---------- partition : un pas = une double-croche ---------- */
function jouerPas(pas,t){
  var mesure=Math.floor(pas/PAS_PAR_MESURE),p=pas%PAS_PAR_MESURE;
  var derniere=mesure===MESURES-1,seconde=mesure>=4;
  var temps=(p%4===0);
  /* grosse caisse : quatre temps, plus une syncope sur les mesures impaires */
  if(p===0||p===4||p===8||p===12||((mesure%2===1)&&p===10)||(derniere&&p>=8&&p%2===0&&p!==8))grosseCaisse(t,p===0?1:0.9);
  /* caisse claire : 2 et 4 ; roulement qui s'emballe sur la fin de la dernière mesure */
  if(!derniere&&(p===4||p===12))caisseClaire(t,1);
  if(derniere){
    if(p===4)caisseClaire(t,1);
    if(p>=8)caisseClaire(t,0.35+(p-8)*0.1);
  }
  /* charleston : croches, doubles-croches sur la seconde moitié de la phrase */
  if(p%2===0)charley(t,p%4===0?1:0.7,p===14&&mesure%2===1);
  else if(seconde&&p%2===1)charley(t,0.45,false);
  /* toms de taïko : temps fort d'une mesure sur deux, et fin de phrase */
  if(p===0&&mesure%2===0)tom(t,0.9,78);
  if(mesure===3&&p>=12)tom(t,0.8,p%2?96:78);
  if(derniere&&p===2)tom(t,0.7,110);
  /* basse en croches, accentuée sur les contretemps */
  if(p%2===0)basse(t,BASSES[mesure]*((p===6||p===14)?2:1),temps?1:0.85,false);
  if(p===0)basse(t,BASSES[mesure]/2,1,true);
  /* cordes en ostinato : seconde moitié de la phrase, deux notes à la seconde mineure */
  if(seconde&&p%2===1)corde(t,(p%4===1?BASSES[mesure]*8:BASSES[mesure]*8*1.05946),1);
  if(mesure<4&&(p===6||p===14))corde(t,BASSES[mesure]*8*1.05946,0.8);
  /* nappe dissonante au début de chaque mesure, cuivres sur les mesures 1 et 5 */
  if(p===0)nappe(t,mesure);
  if(p===0&&(mesure===0||mesure===4))cuivres(t,mesure,1);
  if(p===8&&(mesure===2||mesure===6))cuivres(t,mesure,0.7);
  /* montée de bruit dans la dernière mesure */
  if(derniere&&p===0)riser(t);
}

/* ---------- horloge de programmation ---------- */
function boucle(){
  if(!ctx||!enMarche)return;
  var maintenant=ctx.currentTime;
  /* le curseur « Musique » est relu à chaque passage */
  if(!arretDemande){
    var cible=NIVEAU*volumeReglage();
    sortie.gain.setTargetAtTime(cible,maintenant,0.15);
  }
  while(prochain<maintenant+AVANCE){
    jouerPas(pasCourant,prochain);
    prochain+=SEIZIEME;
    pasCourant=(pasCourant+1)%PAS_TOTAL;
  }
  if(arretDemande&&maintenant>=fonduFin)finir();
}
function finir(){
  enMarche=false;arretDemande=false;
  if(minuteur){clearInterval(minuteur);minuteur=0;}
  try{if(ctx&&ctx.state==='running')ctx.suspend();}catch(_e){}
  suspendreAmbiance(false);
}

function suspendreAmbiance(oui){
  try{var A=window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__;if(A&&typeof A.suspendre==='function')A.suspendre(Boolean(oui));}catch(_e){}
}

function demarrer(){
  if(volumeReglage()<=0)return false;
  if(enMarche&&!arretDemande)return true;
  if(!creerContexte())return false;
  var reprendre=function(){
    var t=ctx.currentTime;
    if(!enMarche){pasCourant=0;prochain=t+0.1;}
    arretDemande=false;enMarche=true;
    sortie.gain.cancelScheduledValues(t);
    sortie.gain.setValueAtTime(Math.max(0.0001,sortie.gain.value),t);
    sortie.gain.linearRampToValueAtTime(NIVEAU*volumeReglage(),t+FONDU_ENTREE);
    suspendreAmbiance(true);
    if(!minuteur)minuteur=setInterval(boucle,40);
  };
  try{
    if(ctx.state==='suspended'){var p=ctx.resume();if(p&&typeof p.then==='function')p.then(reprendre,function(){});else reprendre();}
    else reprendre();
  }catch(_e){return false;}
  return true;
}
function arreter(){
  if(!enMarche||arretDemande)return;
  arretDemande=true;
  var t=ctx.currentTime;
  sortie.gain.cancelScheduledValues(t);
  sortie.gain.setValueAtTime(Math.max(0.0001,sortie.gain.value),t);
  sortie.gain.linearRampToValueAtTime(0.0001,t+FONDU_SORTIE);
  fonduFin=t+FONDU_SORTIE;
}

/* Aperçu depuis les Réglages (section de développement) : la musique joue sans combat, jusqu'à l'arrêt demandé. */
var apercu=false;
/* Combat de Titan en cours (écran de combat visible) et fenêtre visible : la musique joue. */
function surveiller(){
  if(apercu&&!document.hidden){demarrer();return;}
  var E=window.__SOREAL_IDLE_TITAN_ECRAN_V1__;
  var combat=Boolean(E&&typeof E.actif==='function'&&E.actif())&&!document.hidden;
  if(combat)demarrer();else arreter();
}
function lancerApercu(){apercu=true;return demarrer();}
function arreterApercu(){apercu=false;arreter();}

/* Rendu hors ligne de N secondes (essais et mesures : crête, saturation) : renvoie une AudioBuffer mono, sans toucher à la lecture en cours. */
function rendre(secondes,frequence){
  var O=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!O)return Promise.reject(new Error('OfflineAudioContext indisponible'));
  var sr=frequence||22050,total=Math.ceil(sr*secondes);
  var off=new O(1,total,sr);
  var gardes={ctx:ctx,sortie:sortie,bruit:bruitBuf,prochain:prochain,pas:pasCourant};
  ctx=off;
  var comp=off.createDynamicsCompressor();
  comp.threshold.value=-14;comp.knee.value=20;comp.ratio.value=5;comp.attack.value=0.004;comp.release.value=0.2;
  sortie=off.createGain();sortie.gain.value=NIVEAU;
  sortie.connect(comp);comp.connect(off.destination);
  var n=Math.floor(sr*1.5);bruitBuf=off.createBuffer(1,n,sr);
  var d=bruitBuf.getChannelData(0);for(var i=0;i<n;i+=1)d[i]=Math.random()*2-1;
  var pas=0,t=0;
  while(t<secondes){jouerPas(pas%PAS_TOTAL,t);t+=SEIZIEME;pas+=1;}
  ctx=gardes.ctx;sortie=gardes.sortie;bruitBuf=gardes.bruit;prochain=gardes.prochain;pasCourant=gardes.pas;
  return off.startRendering();
}
if(typeof setInterval==='function')setInterval(surveiller,500);

window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__={
  demarrer:demarrer,arreter:arreter,lancerApercu:lancerApercu,arreterApercu:arreterApercu,rendre:rendre,
  actif:function(){return enMarche&&!arretDemande;},
  /* essais : la partition d'un pas (numéro 0 à 127) sans horloge */
  pas:jouerPas,pasTotal:PAS_TOTAL,bpm:BPM
};
})();
