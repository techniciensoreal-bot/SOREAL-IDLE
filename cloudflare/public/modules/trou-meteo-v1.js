/*
 * SOREAL IDLE — la MÉTÉO du Trou sans fond (Norman, 2026-11-20 : « le Money Pit affiche le même temps que là où le joueur joue : s'il pleut chez lui, il pleut sur le Money Pit »).
 *
 * D'où vient le temps : le client envoie la latitude/longitude APPROXIMATIVES de la grande ville du fuseau horaire de l'appareil (celles de modules/trou-nuit-v1.js : aucune position GPS, aucune
 * permission) à GET /api/idle/media/meteo ; le serveur répond une CATÉGORIE (clair, nuageux, couvert, brouillard, bruine, pluie, forte-pluie, neige, forte-neige, orage) lue chez Open-Meteo
 * (src/idle-meteo-v1.js, cache de 15 min). Rien n'est stocké. Pas de réponse (hors ligne, serveur injoignable) : aucun effet, jamais d'erreur.
 *
 * Légèreté (même règle que le portage des animations sur le compositeur) : AUCUN filtre, aucun flou, aucun mélange de couleurs. Chaque couche est UN élément dont seul `transform` (ou `opacity`)
 * s'anime, avec une image-tuile SVG fabriquée ici (gouttes, flocons, nuages), identique d'un bord à l'autre : la boucle glisse d'EXACTEMENT une tuile, donc aucun à-coup (règle n°3 d'AGENTS.md).
 * 3 couches de pluie au plus, 3 de neige, aucune couche pour un ciel clair. En pause quand l'image n'est pas à l'écran ; coupé par prefers-reduced-motion (seules les teintes restent) et par la
 * case « Météo du Trou sans fond » de Réglages > Effets visuels (soreal_idle_effet_meteo_v1, règle n°6).
 *
 * Redessin (règle n°4) : la couche est un bloc AJOUTÉ à la scène (data-morph-garder / data-morph-vivant), reposé juste après chaque redessin par la liste window.__SOREAL_IDLE_APRES_REDESSIN_V1__.
 *
 *   window.__SOREAL_IDLE_TROU_METEO_V1__ = { categorie(), forcer(cat|null), appliquer(), couches(cat), CATEGORIES }
 *   Essai : window.__SOREAL_IDLE_TROU_METEO_V1__.forcer('orage') (null = revenir au vrai temps)
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_TROU_METEO_V1__)return;
  var CATEGORIES=['clair','nuageux','couvert','brouillard','bruine','pluie','forte-pluie','neige','forte-neige','orage'];
  var cat='clair',forcee=null,charge=false,enCours=false,derniereLecture=0,observateur=null;
  var RAFRAICHIR_MS=15*60*1000;

  function autorise_(){try{return localStorage.getItem('soreal_idle_effet_meteo_v1')!=='0';}catch(_e){return true;}}

  /* ---------- images-tuiles (SVG en data:, fabriquées une fois par style) ---------- */
  function alea_(graine){var a=graine>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
  function uri_(svg){return "url('data:image/svg+xml,"+encodeURIComponent(svg).replace(/'/g,'%27')+"')";}
  var memo={};
  /* gouttes : traits presque verticaux, jamais à cheval sur un bord de la tuile (la boucle est donc sans couture) */
  function tuilePluie_(graine,nb,longueur,epaisseur,opacite,teinte){
    var k='p'+[graine,nb,longueur,epaisseur,opacite,teinte].join();if(memo[k])return memo[k];
    var r=alea_(graine),s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke="'+teinte+'" stroke-linecap="round" fill="none">';
    for(var i=0;i<nb;i++){
      var l=longueur*(0.6+0.8*r()),x=10+r()*80,y=5+r()*(90-l),dx=l*0.12;
      s+='<line x1="'+x.toFixed(1)+'" y1="'+y.toFixed(1)+'" x2="'+(x-dx).toFixed(1)+'" y2="'+(y+l).toFixed(1)+'" stroke-width="'+(epaisseur*(0.7+0.6*r())).toFixed(2)+'" opacity="'+(opacite*(0.5+0.5*r())).toFixed(2)+'"/>';
    }
    return memo[k]=uri_(s+'</g></svg>');
  }
  /* flocons : petits disques doux, tous entièrement dans la tuile */
  function tuileNeige_(graine,nb,rMin,rMax){
    var k='n'+[graine,nb,rMin,rMax].join();if(memo[k])return memo[k];
    var r=alea_(graine),s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="f"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
    for(var i=0;i<nb;i++){var rr=rMin+r()*(rMax-rMin);s+='<circle cx="'+(rr+r()*(100-2*rr)).toFixed(1)+'" cy="'+(rr+r()*(100-2*rr)).toFixed(1)+'" r="'+rr.toFixed(2)+'" fill="url(#f)" opacity="'+(0.6+0.4*r()).toFixed(2)+'"/>';}
    return memo[k]=uri_(s+'</svg>');
  }
  /* nuages / brouillard : ellipses douces ; chacune est dessinée aussi décalée de 100 pour que la tuile se raccorde à droite et à gauche */
  function tuileBrume_(graine,nb,teinte,opacite,hauteur){
    var k='b'+[graine,nb,teinte,opacite,hauteur].join();if(memo[k])return memo[k];
    var r=alea_(graine),s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" preserveAspectRatio="none"><defs><radialGradient id="g"><stop offset="0" stop-color="'+teinte+'" stop-opacity="'+opacite+'"/><stop offset="1" stop-color="'+teinte+'" stop-opacity="0"/></radialGradient></defs>';
    for(var i=0;i<nb;i++){
      var cx=r()*100,cy=hauteur[0]+r()*(hauteur[1]-hauteur[0]),rx=14+r()*18,ry=3.5+r()*5;
      [-100,0,100].forEach(function(d){s+='<ellipse cx="'+(cx+d).toFixed(1)+'" cy="'+cy.toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+'" fill="url(#g)"/>';});
    }
    return memo[k]=uri_(s+'</svg>');
  }
  var ECLAIR_SVG='<svg viewBox="0 0 60 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polyline points="38,0 22,62 36,66 14,128 30,132 8,200" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><polyline points="38,0 22,62 36,66 14,128 30,132 8,200" fill="none" stroke="#bcd7ff" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity=".35"/></svg>';

  /* ---------- couches ---------- */
  function voile_(haut,bas,teinte){return '<div class="mp-m-voile" style="background:linear-gradient(180deg,rgba('+teinte+','+haut+') 0%,rgba('+teinte+','+bas+') 100%)"></div>';}
  function chute_(n,duree,image){return '<div class="mp-m-chute" style="--n:'+n+';--dur:'+duree+'s;background-image:'+image+'"></div>';}
  function neige_(n,duree,balancement,image,decal){return '<div class="mp-m-balance" style="--bal:'+balancement+'s;--dl:'+decal+'s"><div class="mp-m-chute" style="--n:'+n+';--dur:'+duree+'s;background-image:'+image+'"></div></div>';}
  function derive_(duree,image,decal){return '<div class="mp-m-derive" style="--dur:'+duree+'s;--dl:'+decal+'s;background-image:'+image+'"></div>';}
  /* ronds dans l'eau : positions en % de la scène, sur l'ouverture du trou (x 29-56 %, y 43-66 %) ; [x, y, largeur, décalage] */
  function ondes_(nb){
    var p=[[33,52,9,0],[44,58,11,1.1],[50,49,8,.5],[38,62,10,1.7],[47,64,9,.2],[31,57,7,.9]].slice(0,nb);
    return p.map(function(o){return '<i class="mp-m-onde" style="left:'+o[0]+'%;top:'+o[1]+'%;width:'+o[2]+'%;--dl:'+o[3]+'s"></i>';}).join('');
  }
  function eclairs_(){
    return '<div class="mp-m-flash"></div>'+
      '<div class="mp-m-foudre" style="left:63%;width:9%;--p:7s;--dl:0s">'+ECLAIR_SVG+'</div>'+
      '<div class="mp-m-foudre" style="left:20%;width:7%;--p:11s;--dl:-4.2s">'+ECLAIR_SVG+'</div>';
  }
  var SOL_NEIGE='<div class="mp-m-sol"></div>';
  function couches(c){
    var pluieLegere=tuilePluie_(11,14,10,.7,.55,'#dbe8ff'),pluieMoy=tuilePluie_(23,18,13,.9,.7,'#dbe8ff'),pluieDense=tuilePluie_(37,24,16,1.15,.85,'#e4efff');
    switch(c){
      case 'nuageux':return voile_(.08,.02,'120,130,150')+derive_(150,tuileBrume_(5,3,'#ffffff',.55,[8,22]),0);
      case 'couvert':return voile_(.3,.1,'70,78,95')+derive_(120,tuileBrume_(7,4,'#cfd6e2',.7,[6,24]),0)+derive_(190,tuileBrume_(9,3,'#aeb7c6',.6,[10,30]),-60);
      case 'brouillard':return voile_(.2,.28,'200,208,218')+derive_(130,tuileBrume_(13,5,'#f2f5f8',.8,[14,44]),0)+derive_(210,tuileBrume_(17,4,'#e4e9ef',.75,[20,48]),-80);
      case 'bruine':return voile_(.16,.06,'80,90,110')+chute_(3,1.15,pluieLegere)+chute_(2,.9,pluieLegere);
      case 'pluie':return voile_(.26,.1,'60,70,92')+chute_(3,.85,pluieLegere)+chute_(2,.66,pluieMoy)+ondes_(4);
      case 'forte-pluie':return voile_(.38,.16,'45,54,76')+chute_(3,.7,pluieMoy)+chute_(2,.52,pluieDense)+chute_(1,.4,pluieDense)+ondes_(6);
      case 'orage':return voile_(.5,.24,'30,36,58')+chute_(3,.62,pluieMoy)+chute_(2,.46,pluieDense)+chute_(1,.36,pluieDense)+ondes_(6)+eclairs_();
      case 'neige':return voile_(.2,.08,'150,170,200')+neige_(3,15,5.2,tuileNeige_(41,22,1.6,3.0),0)+neige_(2,10,4.1,tuileNeige_(43,14,2.0,3.6),-2)+SOL_NEIGE;
      case 'forte-neige':return voile_(.24,.12,'170,186,210')+derive_(170,tuileBrume_(19,3,'#f2f6fb',.55,[10,40]),0)+neige_(3,10,4.6,tuileNeige_(47,28,1.6,3.0),0)+neige_(2,7,3.6,tuileNeige_(53,20,2.0,3.6),-1.5)+neige_(1,5,3,tuileNeige_(59,12,2.6,4.4),-3)+SOL_NEIGE;
      default:return '';
    }
  }

  /* Les règles CSS de la météo vivent dans trou-meteo-v1.css. */

  /* ---------- lecture du temps ---------- */
  function charger_(){
    if(enCours)return;
    var N=window.__SOREAL_IDLE_TROU_NUIT_V1__,pos=N&&N.position?N.position():null;
    if(!pos||typeof fetch!=='function')return;
    enCours=true;
    var ctl=typeof AbortController==='function'?new AbortController():null,minuteur=setTimeout(function(){try{if(ctl)ctl.abort();}catch(_e){}},8000);
    fetch('/api/idle/media/meteo?lat='+encodeURIComponent(pos[0])+'&lon='+encodeURIComponent(pos[1]),ctl?{signal:ctl.signal}:undefined)
      .then(function(r){return r.ok?r.json():null;})
      .then(function(j){if(j&&j.ok&&CATEGORIES.indexOf(j.categorie)>=0){cat=j.categorie;charge=true;}})
      .catch(function(){})
      .then(function(){clearTimeout(minuteur);enCours=false;derniereLecture=Date.now();appliquer();});
  }

  /* ---------- pose dans la scène ---------- */
  function surveiller_(scene,couche){
    if(typeof IntersectionObserver!=='function')return;
    if(!observateur)observateur=new IntersectionObserver(function(es){es.forEach(function(e){var c=e.target.querySelector(':scope > .mp-meteo');if(c)c.classList.toggle('mp-m-pause',!e.isIntersecting);});});
    if(!scene.__meteoObs){scene.__meteoObs=true;observateur.observe(scene);}
  }
  function appliquer(){
    var scene=document.querySelector('.soreal-idle-money-scene-v206');
    if(!scene)return;
    if(!enCours&&Date.now()-derniereLecture>RAFRAICHIR_MS)charger_();
    var c=autorise_()?(forcee||(charge?cat:'clair')):'clair';
    var couche=scene.querySelector(':scope > .mp-meteo');
    if(c==='clair'){if(couche&&couche.parentNode)couche.parentNode.removeChild(couche);return;}
    if(!couche){
      couche=document.createElement('div');couche.className='mp-meteo';couche.setAttribute('aria-hidden','true');
      couche.setAttribute('data-morph-garder','');couche.setAttribute('data-morph-vivant','');
      var calques=scene.querySelector(':scope > .mp3-calques');
      scene.insertBefore(couche,calques||null);
    }
    if(couche.getAttribute('data-cat')!==c){couche.setAttribute('data-cat',c);couche.innerHTML=couches(c);}
    surveiller_(scene,couche);
  }
  function forcer(c){forcee=(c&&CATEGORIES.indexOf(c)>=0)?c:null;appliquer();return forcee;}

  try{(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{appliquer();}catch(_e){}});}catch(_e){}
  window.__SOREAL_IDLE_TROU_METEO_V1__={categorie:function(){return forcee||(charge?cat:'clair');},forcer:forcer,appliquer:appliquer,couches:couches,CATEGORIES:CATEGORIES};
})();
