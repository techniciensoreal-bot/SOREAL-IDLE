/*
 * SOREAL IDLE — le Coffre rote et pète de temps en temps, au hasard (Norman, 2026-10-10 : « que le coffre rote et pète aléatoirement avec un son que tu vas créer »).
 * Le Coffre rote ou pète AU HASARD, mais seulement pendant qu'on le VOIT (Norman, 2026-10-11 : « quand il est à l'écran, aléatoirement ; sinon ça n'a pas de sens ») : le minuteur ne compte QUE le temps où au moins la moitié
 * du Coffre est dans la fenêtre et l'onglet visible ; il tire un délai entre 20 et 55 secondes de présence à l'écran, puis le son (6 rots, 6 pets, modules/audio-coffre-v1.js) est joué par le moteur audio (donc coupé avec les
 * effets sonores) et le Coffre se trémousse. Hors de vue, le minuteur est en pause (il ne se « charge » plus en arrière-plan) : on ne l'entend jamais en arrivant sur la page parce qu'un délai était écoulé ailleurs.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_COFFRE_DIGESTION_V1__)return;
  var MIN=20000,MAX=55000,PAS=500;
  /* Les excuses d'un pet, tirées au sort, et le délai avant qu'elles apparaissent (le temps du bruit). */
  var EXCUSES=['Désolé','Oups','Vous avez entendu ?','Il y a de l’orage on dirait'];
  var DELAI_EXCUSE=1100;

  function coffreVisible_(){
    var el=document.querySelector('.soreal-idle-coffre-v1 .bg-bagage-v1,.bg-bagage-v1');
    if(!el||typeof el.getBoundingClientRect!=='function')return null;
    var r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight,w=window.innerWidth||document.documentElement.clientWidth;
    if(!(r.width>0&&r.height>0))return null;
    /* au moins la moitié de sa surface dans la fenêtre */
    var vis=Math.max(0,Math.min(r.bottom,h)-Math.max(r.top,0))*Math.max(0,Math.min(r.right,w)-Math.max(r.left,0));
    return vis>=r.width*r.height*0.5?el:null;
  }
  function tremousser_(el,type){
    var c=type==='pet'?'bg-pete-v1':'bg-rote-v1';
    el.classList.remove('bg-rote-v1','bg-pete-v1');
    void el.getBoundingClientRect();
    el.classList.add(c);
    setTimeout(function(){el.classList.remove(c);},900);
    if(type==='pet')excuses_(el);
    else nuageVert_(el);
  }
  /* Un rot = un nuage vert qui sort de sa gueule (Norman, 2026-10-11) : quatre bouffées qui grossissent, montent et s'effacent. */
  function nuageVert_(el){
    var n=document.createElement('span');
    n.className='bg-rot-nuage-v1';n.setAttribute('aria-hidden','true');
    n.innerHTML='<i></i><i></i><i></i><i></i>';
    el.appendChild(n);retirer_(n,2600);
  }
  /* Quand il pète : un petit nuage de fumée et une bulle « Désolé » (toujours en français, même en anglais : demande de Norman, 2026-10-10). Très rarement (1 fois sur 8), il enchaîne avec « J'étais à 2 doigts de chier sur tes
     affaires », une goutte de sueur lui perle alors au front : elle apparaît en fondu en glissant un peu, puis s'efface. */
  function bulle_(el,texte,rare,delai){
    var b=document.createElement('span');
    b.className='bg-desole-v1'+(rare?' bg-desole-rare-v1':'');b.setAttribute('data-sans-traduction','');b.setAttribute('aria-hidden','true');
    b.textContent=texte;
    if(delai)b.style.animationDelay=delai+'ms';
    el.appendChild(b);
    return b;
  }
  function retirer_(n,ms){setTimeout(function(){if(n&&n.parentNode)n.parentNode.removeChild(n);},ms);}
  /*
   * Nuage de pet (Norman, 2026-10-15) : un vrai nuage sort de l'arrière du Coffre (huit bouffées de tailles et de trajets différents) et monte ; une fois sur trois il monte très haut et passe sur les objets
   * de l'inventaire. Les valeurs au hasard sont écrites dans le HTML de chaque bouffée (--dx, --haut, --t, --gr, délai) : opacité et transform seulement, un seul passage.
   */
  function nuagePet_(el){
    var f=document.createElement('span');
    f.className='bg-fumee-v1';f.setAttribute('aria-hidden','true');
    var haut=Math.random()<.34;
    var html='';
    for(var k=0;k<8;k+=1){
      var dx=Math.round(-30+Math.random()*80);
      var h=Math.round(haut?150+Math.random()*130:46+Math.random()*50);
      var t=Math.round(30+Math.random()*26);
      var gr=(2.2+Math.random()*1.2).toFixed(2);
      var d=Math.round(k*70+Math.random()*60);
      html+='<i style="left:'+(k*5)+'px;--dx:'+dx+'px;--haut:'+h+'px;--t:'+t+'px;--gr:'+gr+';animation-delay:'+d+'ms"></i>';
    }
    f.innerHTML=html;
    /* Posé sur la page (pas dans le Coffre, dont le cadre coupe tout ce qui dépasse) : le nuage peut monter par-dessus l'inventaire. Coordonnées du document, donc il suit le défilement. */
    var r=el.getBoundingClientRect?el.getBoundingClientRect():null;
    if(r&&document.body&&r.width>0){
      f.style.cssText='left:'+Math.round(r.right+(window.pageXOffset||0)-r.width*.2)+'px;top:'+Math.round(r.top+(window.pageYOffset||0)+r.height*.62)+'px';
      document.body.appendChild(f);
    }else el.appendChild(f);
    retirer_(f,3900);
    return f;
  }
  /*
   * L'accident (Norman, 2026-10-15), VRAIMENT occasionnel : 4 % des pets. Une flaque brune s'étale à ses pieds, il dit « Oh bordel, pas encore… » puis « J'crois que j'me suis chié dessus. », et le sac est couvert de
   * caca (modules/coffre-accident-v1.js : à frotter pour nettoyer). Toujours en français, comme les autres répliques du Coffre.
   */
  var P_ACCIDENT=.04;
  /* Première réplique tirée au sort ; la seconde (« J'crois que j'me suis chié dessus. ») suit toujours. */
  var OUVERTURES_ACCIDENT=['Oh bordel, pas encore…','Ah ben voilà.. Forcément que ça allait arriver un jour.','Oh merde. Ne me regardez pas'];
  function entierementVisible_(){
    var el=document.querySelector('.soreal-idle-coffre-v1 .bg-bagage-v1,.bg-bagage-v1');
    if(!el||typeof el.getBoundingClientRect!=='function'||document.hidden)return null;
    var r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight,w=window.innerWidth||document.documentElement.clientWidth;
    return r.width>0&&r.height>0&&r.top>=0&&r.left>=0&&r.bottom<=h&&r.right<=w?el:null;
  }
  function quandEntierementVisible_(f){
    var el=entierementVisible_();
    if(el){f(el);return;}
    var minuteur=setInterval(function(){var e=entierementVisible_();if(e){clearInterval(minuteur);f(e);}},300);
  }
  function accident_(el){
    var C=window.__SOREAL_IDLE_CACA_V1__;
    if(!C)return false;
    C.flaque(el);
    setTimeout(function(){try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.play==='function')a.play('coffreAccident');}catch(_e){}},550);
    C.souiller();
    /* Les répliques ne se disent QUE devant le joueur (Norman, 2026-10-15) : si le Coffre n'est pas entièrement à l'écran, elles attendent qu'il y soit. */
    var ouverture=OUVERTURES_ACCIDENT[Math.floor(Math.random()*OUVERTURES_ACCIDENT.length)];
    quandEntierementVisible_(function(coffre){
      var b1=bulle_(coffre,ouverture,false,200);b1.className+=' bg-desole-long-v1';
      retirer_(b1,200+2300);
      var b2=bulle_(coffre,'J’crois que j’me suis chié dessus.',false,200+2600);b2.className+=' bg-desole-long-v1';
      retirer_(b2,200+2600+2300);
    });
    return true;
  }
  function excuses_(el){
    nuagePet_(el);
    if(Math.random()<P_ACCIDENT&&accident_(el))return;
    var rare=Math.random()<.125;
    /* La bulle ne sort qu'APRÈS le pet (Norman, 2026-10-11) : la fumée part tout de suite, l'excuse suit une fois le bruit terminé ; la phrase est tirée au sort. */
    var choix=EXCUSES.slice();
    /* S'il digère un Casque au bleu (Blue Cheese Helmet), il peut s'en plaindre. */
    try{if(typeof window.__coffreContientObjetIdleV1__==='function'&&window.__coffreContientObjetIdleV1__(/casque au bleu|blue cheese helmet/i))choix.push('Je digère mal ton Casque au bleu');}catch(_e){}
    var excuse=choix[Math.floor(Math.random()*choix.length)];
    retirer_(bulle_(el,excuse,false,DELAI_EXCUSE),DELAI_EXCUSE+2300);
    if(rare){
      var seconde=bulle_(el,'J’étais à 2 doigts de chier sur tes affaires',true,DELAI_EXCUSE+1900);
      var g=document.createElement('span');
      g.className='bg-sueur-v1';g.setAttribute('aria-hidden','true');g.style.animationDelay=(DELAI_EXCUSE+2000)+'ms';
      g.innerHTML='<svg viewBox="0 0 12 18"><path d="M6 1 C6 1 1.2 8 1.2 11.6 A4.8 4.8 0 0 0 10.8 11.6 C10.8 8 6 1 6 1 Z" fill="#8fd6ff" stroke="#2a6f9e" stroke-width="1.2" stroke-linejoin="round"/><path d="M3.6 11.2 A2.6 2.6 0 0 0 5.6 14" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>';
      el.appendChild(g);
      retirer_(seconde,DELAI_EXCUSE+5600);retirer_(g,DELAI_EXCUSE+5000);
    }
  }
  function jouer_(type){
    var el=coffreVisible_();
    if(!el||document.hidden||window.__coffreDortIdleV1__)return false;   /* il dort : ni rot ni pet (modules/coffre-sommeil-v1.js) */
    try{
      var a=window.__SOREAL_IDLE_AUDIO_V199__;
      if(a&&typeof a.play==='function')a.play(type==='pet'?'coffrePet':'coffreRot');
    }catch(_e){}
    tremousser_(el,type);
    return true;
  }
  /* Temps passé Coffre à l'écran depuis le dernier bruit, et délai tiré au sort : le minuteur n'avance que si le Coffre est vu. */
  var vu=0,cible=MIN+Math.random()*(MAX-MIN);
  function pas_(){
    if(document.hidden||!coffreVisible_()||window.__coffreDortIdleV1__)return;
    vu+=PAS;
    if(vu<cible)return;
    if(jouer_(Math.random()<.5?'rot':'pet')){vu=0;cible=MIN+Math.random()*(MAX-MIN);}
  }
  setInterval(pas_,PAS);
  window.__coffreNuagePetIdleV1__=nuagePet_;
  window.__coffreAccidentIdleV1__=accident_;
  window.__SOREAL_IDLE_COFFRE_DIGESTION_V1__={jouer:jouer_,pas:pas_,visible:coffreVisible_};
})();
