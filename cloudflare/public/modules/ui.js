/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/ui.html
 * during standalone frontend cutover.
 *
 * 2026-09-24 (Norman : « Le money pit a encore 2 fonctions qui s'écrasent. On a le money pit avec l'image (celui que je veux garder)
 * et l'autre money pit, uniquement textuel (que je veux virer) ») : la page Money Pit + Daily Spin en texte seul (V49) est supprimée
 * d'ici. Elle réécrivait la page à image de meta-progression-v130.js (pageMoneyPitDailySpinIdleV206_, l'unique page Money Pit).
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_EARLY_UI_V49__)return;
  window.__SOREAL_IDLE_EARLY_UI_V49__=true;

  var CACHE_MS=1500;
  var cacheEtat=null;
  var cacheAt=0;
  var lectureEnCours=false;
  var callbacks=[];
  var timerEnhance=0;
  var dernierRoot=null;

  function nombre_(value){
    var n=Number(value);
    return Number.isFinite(n)?n:0;
  }

  function entier_(value){
    return Math.max(0,Math.floor(nombre_(value)));
  }

  function html_(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function formatNombre_(value){
    var n=Math.max(0,nombre_(value));
    if(n<1000)return Math.floor(n).toLocaleString('fr-BE');
    var units=[['Qa',1e15],['T',1e12],['B',1e9],['M',1e6],['k',1e3]];
    for(var i=0;i<units.length;i++){
      if(n>=units[i][1]){
        var v=n/units[i][1];
        return (v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2))
          .replace('.',',')+' '+units[i][0];
      }
    }
    return Math.floor(n).toLocaleString('fr-BE');
  }

  function formatDuree_(ms){
    var total=Math.max(0,Math.ceil(nombre_(ms)/1000));
    if(total<=0)return 'Prêt maintenant';
    var h=Math.floor(total/3600);
    var m=Math.floor((total%3600)/60);
    var s=total%60;
    if(h>0)return h+' h '+String(m).padStart(2,'0')+' min';
    if(m>0)return m+' min '+String(s).padStart(2,'0')+' s';
    return s+' s';
  }

  function meta_(joueur){
    return joueur&&joueur.systemes&&typeof joueur.systemes==='object'
      ?joueur.systemes
      :{};
  }

  function systeme_(joueur,id){
    var liste=Array.isArray(meta_(joueur).systems)?meta_(joueur).systems:[];
    return liste.find(function(s){return s&&s.id===id;})||null;
  }

  function systemeDebloque_(joueur,id){
    var s=systeme_(joueur,id);
    return Boolean(s&&s.state&&s.state.unlocked);
  }

  function allocationMax_(joueur,systemId,resource){
    var m=meta_(joueur);
    var systems=Array.isArray(m.systems)?m.systems:[];
    var cap=Math.max(0,nombre_(m.resources&&m.resources[resource]&&m.resources[resource].cap));
    var usedOther=systems.reduce(function(total,s){
      if(!s||s.id===systemId)return total;
      return total+Math.max(0,nombre_(s.state&&s.state.allocation&&s.state.allocation[resource]));
    },0);
    return Math.max(0,cap-usedOther);
  }

  function session_(){
    try{
      if(typeof SOREAL_SESSION!=='undefined')return String(SOREAL_SESSION||'').trim();
    }catch(e){}
    return String(window.SOREAL_SESSION||'').trim();
  }

  function terminerLecture_(joueur){
    lectureEnCours=false;
    if(joueur){
      cacheEtat=joueur;
      cacheAt=Date.now();
    }
    var liste=callbacks.splice(0,callbacks.length);
    liste.forEach(function(cb){
      try{cb(joueur||null);}catch(e){}
    });
  }

  function obtenirEtat_(callback,force){
    if(!force&&cacheEtat&&Date.now()-cacheAt<CACHE_MS){
      callback(cacheEtat);
      return;
    }

    callbacks.push(callback);
    if(lectureEnCours)return;
    lectureEnCours=true;

    var token=session_();
    if(!token||!window.google||!google.script||!google.script.run){
      terminerLecture_(null);
      return;
    }

    google.script.run
      .withSuccessHandler(function(res){
        terminerLecture_(res&&res.ok&&res.joueur?res.joueur:null);
      })
      .withFailureHandler(function(){
        terminerLecture_(null);
      })
      .obtenirEtatSorealIdle(token);
  }

  function pageActive_(){
    var active=document.querySelector('.soreal-idle-nav-button-v28.active');
    var onclick=active&&active.getAttribute('onclick')||'';
    var match=onclick.match(/__menuIdleV28__\(['"]([^'"]+)['"]\)/);
    return match?match[1]:'';
  }

  function root_(){
    return document.querySelector('.soreal-idle-page-root-v28');
  }

  function hookAction_(payload){
    cacheAt=0;
    var fn=typeof window.__actionMetaV47__==='function'
      ?window.__actionMetaV47__
      :window.__actionMetaIdleV130__;
    if(typeof fn==='function')fn(payload);
  }

  function rendreAllocation_(joueur,systemId){
    var s=systeme_(joueur,systemId);
    var current=Math.max(0,nombre_(s&&s.state&&s.state.allocation&&s.state.allocation.energy));
    var max=allocationMax_(joueur,systemId,'energy');
    var ratios=[0,.25,.5,1];
    var labels=['0 %','25 %','50 %','100 %'];

    return '<section class="soreal-idle-v49-card soreal-idle-v49-allocation">'+
      '<div class="soreal-idle-v49-card-head"><div><span class="soreal-idle-v49-kicker">ENERGY</span><h3>Énergie allouée</h3></div><strong>'+formatNombre_(current)+' / '+formatNombre_(max)+'</strong></div>'+
      '<p>L’Energy reste dans Advanced Training jusqu’à ce que tu modifies cette allocation ou que le run la réinitialise.</p>'+
      '<div class="soreal-idle-v49-actions">'+ratios.map(function(ratio,index){
        var value=Math.floor(max*ratio);
        return '<button type="button" data-v49-action="allocate" data-v49-value="'+value+'">'+labels[index]+'</button>';
      }).join('')+'</div>'+
    '</section>';
  }

  function trackTexte_(id){
    if(id==='power')return 'Augmente directement la puissance offensive en Adventure.';
    if(id==='toughness')return 'Renforce la résistance et permet d’encaisser les zones plus difficiles.';
    if(id==='block')return 'Réduit les dégâts reçus en Adventure grâce au blocage.';
    if(id==='wandoosEnergy')return 'Déverse l’Energy d’Advanced Training vers Wandoos.';
    if(id==='wandoosMagic')return 'Prépare le dump Wandoos lié à la Magic.';
    return '';
  }

  function rendreTrack_(p){
    var st=p&&p.state||{};
    var niveau=nombre_(st.level)+nombre_(st.tempLevel)+nombre_(st.permanentLevel);
    var progress=Math.max(0,Math.min(100,nombre_(st.progress)*100));
    return '<button type="button" class="soreal-idle-v49-track'+(p.active?' active':'')+'" data-v49-action="track" data-v49-track="'+html_(p.id)+'">'+
      '<span class="soreal-idle-v49-track-check">'+(p.active?'▶':'')+'</span>'+
      '<span class="soreal-idle-v49-track-copy"><strong>'+html_(p.name||p.id)+'</strong><small>'+html_(trackTexte_(p.id)||p.effect||'')+'</small><span class="soreal-idle-v49-progress"><i style="width:'+progress.toFixed(2)+'%"></i></span></span>'+
      '<span class="soreal-idle-v49-track-level">Niv. '+formatNombre_(niveau)+'</span>'+
    '</button>';
  }

  function rendreAdvanced_(root,joueur){
    var advanced=systeme_(joueur,'advancedTraining');
    if(!advanced||!advanced.state||!advanced.state.unlocked)return;

    var tracks=Array.isArray(advanced.tracks)?advanced.tracks:[];
    var wandoosOk=systemeDebloque_(joueur,'wandoos');
    var visibles=tracks.filter(function(p){
      return wandoosOk||!(p.id==='wandoosEnergy'||p.id==='wandoosMagic');
    });

    root.setAttribute('data-soreal-feature','idle');
    root.dataset.sorealIdleEarlyV49='advanced';
    root.innerHTML=
      '<div class="soreal-idle-v49-page">'+
        '<header class="soreal-idle-v49-hero"><div class="soreal-idle-v49-hero-icon">🏋️</div><div><span class="soreal-idle-v49-kicker">ADVANCED TRAINING</span><h2>Entraînement avancé</h2><p>Choisis une seule piste active et place-y l’Energy disponible. Les trois premières pistes servent directement à franchir les murs d’Adventure.</p></div></header>'+
        rendreAllocation_(joueur,'advancedTraining')+
        '<section class="soreal-idle-v49-card"><div class="soreal-idle-v49-card-head"><div><span class="soreal-idle-v49-kicker">PISTE ACTIVE</span><h3>Objectif d’entraînement</h3></div></div><div class="soreal-idle-v49-tracks">'+visibles.map(rendreTrack_).join('')+'</div></section>'+
        (!wandoosOk
          ?'<section class="soreal-idle-v49-card soreal-idle-v49-locked"><strong>🔒 Wandoos dumps</strong><p>Les pistes Wandoos restent cachées jusqu’au vrai déblocage de Wandoos. Aucun raccourci n’est créé ici.</p></section>'
          :'<section class="soreal-idle-v49-card soreal-idle-v49-unlocked"><strong>💻 Wandoos débloqué</strong><p>Les deux pistes de dump sont maintenant disponibles avec les pistes Adventure.</p></section>')+
      '</div>';

    root.addEventListener('click',function(event){
      var button=event.target.closest('[data-v49-action]');
      if(!button||!root.contains(button))return;
      var action=button.dataset.v49Action;
      if(action==='allocate'){
        root.classList.add('soreal-idle-v49-busy');
        hookAction_({action:'allocate',system:'advancedTraining',resource:'energy',value:entier_(button.dataset.v49Value)});
      }else if(action==='track'){
        root.classList.add('soreal-idle-v49-busy');
        hookAction_({action:'selectTrack',system:'advancedTraining',track:String(button.dataset.v49Track||'')});
      }
    });
  }

  function enhancer_(force){
    var page=pageActive_();
    /* Money Pit : page retirée le 2026-09-24 (voir le commentaire en tête de fichier) ; seule la page Advanced Training reste ici. */
    if(page!=='avance')return;
    var root=root_();
    if(!root)return;
    if(root.dataset.sorealIdleEarlyV49)return;

    var nouveauRoot=root!==dernierRoot;
    dernierRoot=root;

    obtenirEtat_(function(joueur){
      if(!joueur||!root.isConnected||root!==root_()||page!==pageActive_())return;
      if(page==='avance')rendreAdvanced_(root,joueur);
    },Boolean(force||nouveauRoot));
  }

  function programmer_(force){
    if(timerEnhance)clearTimeout(timerEnhance);
    timerEnhance=setTimeout(function(){
      timerEnhance=0;
      enhancer_(force);
    },45);
  }

  function installerStyle_(){
    if(document.getElementById('soreal-idle-early-ui-v49-style'))return;
    var style=document.createElement('style');
    style.id='soreal-idle-early-ui-v49-style';
    style.textContent='\
      .soreal-idle-v49-page{display:grid;gap:12px;padding-bottom:12px}\
      .soreal-idle-v49-hero{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:linear-gradient(135deg,rgba(82,62,166,.28),rgba(20,24,40,.9));box-shadow:0 14px 30px rgba(0,0,0,.18)}\
      .soreal-idle-v49-hero-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:17px;background:rgba(255,255,255,.09);font-size:31px}\
      .soreal-idle-v49-kicker{display:block;font-size:10px;font-weight:950;letter-spacing:.13em;color:#b8a6ff;margin-bottom:4px}\
      .soreal-idle-v49-hero h2,.soreal-idle-v49-card h3{margin:0;color:#fff}.soreal-idle-v49-hero h2{font-size:25px}.soreal-idle-v49-hero p,.soreal-idle-v49-card p{margin:6px 0 0;color:#aeb5c8;line-height:1.45}\
      .soreal-idle-v49-card{padding:15px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:rgba(15,19,31,.93);box-shadow:0 10px 24px rgba(0,0,0,.14)}\
      .soreal-idle-v49-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.soreal-idle-v49-card-head>strong{color:#fff;text-align:right}\
      .soreal-idle-v49-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.soreal-idle-v49-actions button,.soreal-idle-v49-primary,.soreal-idle-v49-track{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;font-weight:850;cursor:pointer}\
      .soreal-idle-v49-actions button{padding:10px 6px}.soreal-idle-v49-actions button:active,.soreal-idle-v49-primary:active{transform:translateY(1px)}\
      .soreal-idle-v49-tracks{display:grid;gap:8px;margin-top:11px}.soreal-idle-v49-track{display:grid;grid-template-columns:24px 1fr auto;gap:9px;align-items:center;width:100%;padding:12px;text-align:left}.soreal-idle-v49-track.active{border-color:rgba(183,155,255,.75);background:rgba(116,78,205,.19);box-shadow:0 0 0 2px rgba(145,111,229,.12) inset}\
      .soreal-idle-v49-track-copy{display:grid;gap:3px}.soreal-idle-v49-track-copy strong{font-size:14px}.soreal-idle-v49-track-copy small{color:#aeb5c8;font-weight:650;line-height:1.3}.soreal-idle-v49-track-level{font-size:12px;color:#d8d2ef;white-space:nowrap}\
      .soreal-idle-v49-progress{display:block;height:4px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:3px}.soreal-idle-v49-progress i{display:block;height:100%;background:linear-gradient(90deg,#7d5ce6,#b99cff)}\
      .soreal-idle-v49-locked{border-style:dashed;color:#c7c9d4}.soreal-idle-v49-unlocked{border-color:rgba(98,205,153,.3)}\
      .soreal-idle-v49-warning{margin-top:11px;padding:11px;border-radius:12px;background:rgba(171,71,53,.16);border:1px solid rgba(232,111,89,.26);color:#efc3ba;line-height:1.4}.soreal-idle-v49-warning.neutral{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);color:#cbd0df}\
      .soreal-idle-v49-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.soreal-idle-v49-stats span{padding:9px;border-radius:11px;background:rgba(255,255,255,.045);color:#aeb5c8;font-size:11px}.soreal-idle-v49-stats b{display:block;color:#fff;font-size:13px;margin-top:2px}\
      .soreal-idle-v49-ready{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);color:#aeb5c8}.soreal-idle-v49-ready b{color:#fff}\
      .soreal-idle-v49-primary{width:100%;padding:12px;margin-top:11px;background:rgba(119,83,215,.27);border-color:rgba(173,146,244,.44)}.soreal-idle-v49-primary.danger{background:rgba(177,66,42,.25);border-color:rgba(235,111,83,.4)}.soreal-idle-v49-primary:disabled,.soreal-idle-v49-actions button:disabled{opacity:.45;cursor:not-allowed}\
      .soreal-idle-v49-busy{pointer-events:none;opacity:.78}\
      @media(max-width:560px){.soreal-idle-v49-hero{grid-template-columns:1fr}.soreal-idle-v49-hero-icon{width:50px;height:50px}.soreal-idle-v49-actions{grid-template-columns:repeat(2,1fr)}.soreal-idle-v49-track{grid-template-columns:20px 1fr}.soreal-idle-v49-track-level{grid-column:2}.soreal-idle-v49-stats{grid-template-columns:1fr}.soreal-idle-v49-card-head{display:grid}.soreal-idle-v49-card-head>strong{text-align:left}}\
    ';
    document.head.appendChild(style);
  }

  window.__SOREAL_IDLE_EARLY_UI_V49_TEST__={
    systeme:systeme_,
    systemeDebloque:systemeDebloque_,
    allocationMax:allocationMax_,
    formatDuree:formatDuree_
  };

  installerStyle_();

  var observer=new MutationObserver(function(mutations){
    var important=mutations.some(function(m){
      return m.type==='childList'&&m.addedNodes&&m.addedNodes.length;
    });
    if(important)programmer_(false);
  });

  function observer_(){
    if(!document.body){setTimeout(observer_,0);return;}
    observer.observe(document.body,{childList:true,subtree:true});
    programmer_(true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',observer_,{once:true});
  }else{
    observer_();
  }
})();
