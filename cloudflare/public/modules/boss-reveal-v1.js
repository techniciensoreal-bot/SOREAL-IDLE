/*
 * SOREAL IDLE — révélation des images de boss à la première rencontre (Norman, 2026-10-17).
 *
 * En difficulté Evil ("difficile") : la PREMIÈRE fois qu'on rencontre un boss, on voit son image normale (l'ancienne), qui fond vers l'image 3D du mode Evil.
 * En difficulté Sadistic ("extreme") : image normale, fondu vers l'image Evil, puis fondu final vers la photo du mode Sadistic.
 * Uniquement à la première rencontre de CE boss dans CETTE difficulté, pour CE joueur ; ensuite, toujours l'image du mode en cours (le serveur choisit le dossier selon
 * `difficulty`, voir ui-combat-2-v1.js / urlBossR2IdleV1_). Le combat redessine souvent l'image du boss : la révélation est donc pilotée par une horloge en mémoire
 * et reprend au bon instant après chaque redessin, sans repartir de zéro.
 *
 *   window.__SOREAL_IDLE_BOSS_REVEAL_V1__ = { analyserUrl, calendrier, dejaVu, marquerVu, scanner }
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_BOSS_REVEAL_V1__)return;

  var HOTE_ID='sorealIdleBossImageHostV36';
  var CLE_STOCK='soreal_idle_boss_reveal_v1';
  /* Durées en ms : tenue de l'image précédente, puis fondu vers la suivante. */
  var TENUE_NORMALE=1400, FONDU=1600, TENUE_EVIL=1200;

  /* Les étapes de chaque difficulté : l'image finale est toujours celle du mode en cours. */
  function calendrier(difficulte){
    if(difficulte==='difficile'){
      return{duree:TENUE_NORMALE+FONDU,couches:['normal'],debutFinale:TENUE_NORMALE,debutEvil:null};
    }
    if(difficulte==='extreme'){
      return{duree:TENUE_NORMALE+FONDU+TENUE_EVIL+FONDU,couches:['normal','evil'],debutFinale:TENUE_NORMALE+FONDU+TENUE_EVIL,debutEvil:TENUE_NORMALE};
    }
    return null;
  }

  function analyserUrl(src){
    var m=/\/api\/idle\/media\/boss\?id=(\d+)&difficulty=(difficile|extreme)(?:&|$)/.exec(String(src||''));
    return m?{id:m[1],difficulte:m[2]}:null;
  }

  function urlCouche(id,type){
    return '/api/idle/media/boss?id='+id+(type==='evil'?'&difficulty=difficile':'');
  }

  /* Mémoire durable : { "<joueur>|<difficulté>": [id, …] }, par appareil. */
  function joueur_(){
    try{
      var REG=window.__SOREAL_IDLE_REG__;
      return String(REG&&REG.idleEtat&&REG.idleEtat.nom||'');
    }catch(_e){return '';}
  }
  function lireStock_(){
    try{
      var brut=window.localStorage.getItem(CLE_STOCK);
      var v=brut?JSON.parse(brut):{};
      return v&&typeof v==='object'?v:{};
    }catch(_e){return {};}
  }
  function dejaVu(difficulte,id,stock){
    var liste=(stock||lireStock_())[joueur_()+'|'+difficulte];
    return Array.isArray(liste)&&liste.indexOf(String(id))>=0;
  }
  function marquerVu(difficulte,id){
    try{
      var stock=lireStock_(),cle=joueur_()+'|'+difficulte;
      var liste=Array.isArray(stock[cle])?stock[cle]:[];
      if(liste.indexOf(String(id))<0){
        liste.push(String(id));
        stock[cle]=liste;
        window.localStorage.setItem(CLE_STOCK,JSON.stringify(stock));
      }
    }catch(_e){}
  }

  var ACTIFS={};     /* "<difficulté>|<id>" -> { debut, plan } : horloge en mémoire d'une révélation en cours */
  var SUPERPOSES=[]; /* { ov, img, anims } : calques posés au-dessus d'une image, nettoyés quand l'image disparaît */

  function nettoyer_(){
    SUPERPOSES=SUPERPOSES.filter(function(s){
      if(s.img.isConnected)return true;
      try{if(s.ov.parentNode)s.ov.parentNode.removeChild(s.ov);}catch(_e){}
      return false;
    });
  }

  function mouvementReduit_(){
    try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}
  }

  function injecterStyle_(){
    if(document.getElementById('soreal-idle-boss-reveal-style-v1'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-boss-reveal-style-v1';
    st.textContent='.soreal-idle-boss-reveal-v1{position:absolute;pointer-events:none;overflow:hidden}'+
      '.soreal-idle-boss-reveal-v1 img{position:absolute;left:0;top:0;width:100%;height:100%;display:block}';
    document.head.appendChild(st);
  }

  function fondu_(el,debut,duree,total,ecoule){
    /* opacité 0 jusqu'à `debut`, puis 1 à la fin du fondu ; reprise à l'instant `ecoule` */
    var a=Math.max(0,Math.min(1,debut/total)),b=Math.max(a,Math.min(1,(debut+duree)/total));
    var anim=el.animate([
      {opacity:0,offset:0},
      {opacity:0,offset:a,easing:'ease-in-out'},
      {opacity:1,offset:b},
      {opacity:1,offset:1}
    ],{duration:total,fill:'both'});
    anim.currentTime=Math.max(0,Math.min(total,ecoule));
    return anim;
  }

  function appliquer_(img,info,st){
    var plan=st.plan,ecoule=performance.now()-st.debut;
    var parent=img.offsetParent||img.parentNode;
    if(!parent||!img.parentNode||typeof img.animate!=='function')return false;
    injecterStyle_();

    var cs=window.getComputedStyle(img);
    var ov=document.createElement('div');
    ov.className='soreal-idle-boss-reveal-v1';
    ov.style.left=img.offsetLeft+'px';
    ov.style.top=img.offsetTop+'px';
    ov.style.width=img.offsetWidth+'px';
    ov.style.height=img.offsetHeight+'px';
    ov.style.borderRadius=cs.borderRadius;
    var anims=[];
    plan.couches.forEach(function(type){
      var c=document.createElement('img');
      c.alt='';
      c.setAttribute('aria-hidden','true');
      c.decoding='sync';
      c.src=urlCouche(info.id,type);
      c.style.objectFit=cs.objectFit;
      c.style.objectPosition=cs.objectPosition;
      if(type==='evil'){
        c.style.opacity='0';
        anims.push(fondu_(c,plan.debutEvil,FONDU,plan.duree,ecoule));
      }
      ov.appendChild(c);
    });
    /* L'image réelle (celle du mode en cours) passe au-dessus et apparaît en dernier. */
    if(cs.position==='static')img.style.position='relative';
    img.parentNode.insertBefore(ov,img);
    anims.push(fondu_(img,plan.debutFinale,FONDU,plan.duree,ecoule));

    var entree={ov:ov,img:img,anims:anims};
    SUPERPOSES.push(entree);
    anims[anims.length-1].onfinish=function(){
      try{if(ov.parentNode)ov.parentNode.removeChild(ov);}catch(_e){}
      anims.forEach(function(a){try{a.cancel();}catch(_e){}});
      SUPERPOSES=SUPERPOSES.filter(function(s){return s!==entree;});
    };
    return true;
  }

  function scanner(){
    nettoyer_();
    var hote=document.getElementById(HOTE_ID);
    if(!hote)return;
    /* La vraie image du boss, jamais l'un des calques posés par la révélation elle-même. */
    var img=null,imgs=hote.querySelectorAll('img');
    for(var i=0;i<imgs.length;i+=1){
      if(!imgs[i].closest('.soreal-idle-boss-reveal-v1')){img=imgs[i];break;}
    }
    if(!img)return;
    var info=analyserUrl(img.getAttribute('src'));
    if(!info)return;
    var cle=info.difficulte+'|'+info.id;
    var st=ACTIFS[cle];
    if(!st){
      if(dejaVu(info.difficulte,info.id))return;
      var plan=calendrier(info.difficulte);
      if(!plan)return;
      marquerVu(info.difficulte,info.id); /* dès le début : un rechargement de page en cours de route ne rejoue pas la scène */
      if(mouvementReduit_())return;
      st=ACTIFS[cle]={debut:performance.now(),plan:plan};
    }
    if(performance.now()-st.debut>=st.plan.duree){delete ACTIFS[cle];return;}
    if(img.__sorealRevealV1===st)return;
    img.__sorealRevealV1=st;
    if(!appliquer_(img,info,st))delete ACTIFS[cle];
  }

  window.__SOREAL_IDLE_BOSS_REVEAL_V1__={analyserUrl:analyserUrl,calendrier:calendrier,dejaVu:dejaVu,marquerVu:marquerVu,scanner:scanner,urlCouche:urlCouche};

  if(typeof document==='undefined')return;
  var planifie=false;
  function planifier_(){
    if(planifie)return;
    planifie=true;
    /* requestAnimationFrame est suspendu quand l'onglet est masqué : un délai court prend le relais, le premier des deux l'emporte. */
    var fait=false;
    function lancer_(){
      if(fait)return;
      fait=true;
      planifie=false;
      try{scanner();}catch(_e){}
    }
    window.requestAnimationFrame(lancer_);
    window.setTimeout(lancer_,80);
  }
  function demarrer_(){
    if(!document.body||typeof MutationObserver!=='function')return;
    /* L'observateur s'exécute avant l'affichage suivant : l'animation est reposée sur la nouvelle image sans éclair de l'image finale. */
    var enCours=false;
    new MutationObserver(function(){
      if(enCours)return;
      enCours=true;
      try{scanner();}catch(_e){}
      enCours=false;
    }).observe(document.body,{childList:true,subtree:true});
    planifier_();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_,{once:true});
  else demarrer_();
})();
