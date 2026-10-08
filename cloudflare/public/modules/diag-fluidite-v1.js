/*
 * SOREAL IDLE — journal de fluidité (Norman, 2026-10-05 : « plus jamais de barre qui fait marche arrière ni de temps d'arrêt pour valider un niveau pendant que le calcul de l'Or se fait » ; étape 1 : MESURER).
 *
 * Observe ce que le joueur VOIT dans le menu Augmentations (niveau affiché, remplissage de chaque barre, Or) cinq fois par seconde et note, sur l'appareil seulement (rien n'est envoyé nulle part) :
 *   - niveau_recule   : un niveau affiché baisse ;
 *   - barre_recule    : une barre perd plus de 12 % et son niveau ne monte pas dans la seconde et demie qui suit (un niveau qui monte tout de suite après est normal) ;
 *   - validation_tardive : la barre repart de zéro, mais le numéro de niveau ne change que 0,4 s ou plus après : l'écran « hésite » le temps que le jeu valide le niveau ;
 *   - pause_validation: une barre reste pleine plus de 2,5 s alors que rien ne manque (pas de message « il manque de l'Or ») : le jeu attend le serveur ;
 *   - or_remonte      : l'Or remonte (au moins le quart de la dépense) moins de 8 s après une dépense locale : la réponse du serveur « rend » l'Or.
 * Le journal (80 lignes au plus) se lit dans Réglages > « 🩺 Journal de fluidité » (administrateur) ou avec window.__SOREAL_IDLE_DIAG_V1__.journal().
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DIAG_V1__)return;

  var CLE='soreal_idle_diag_v1';
  var MAX=80;
  var PERIODE_MS=200;
  var journal=[];
  try{var brut=localStorage.getItem(CLE);if(brut){var l=JSON.parse(brut);if(Array.isArray(l))journal=l.slice(-MAX);}}catch(_e){}

  function sauver_(){try{localStorage.setItem(CLE,JSON.stringify(journal.slice(-MAX)));}catch(_e){}}

  var dernierParCle={};
  function noter_(type,cle,details){
    var maintenant=Date.now();
    var k=type+'|'+cle;
    if(dernierParCle[k]&&maintenant-dernierParCle[k]<5000)return;
    dernierParCle[k]=maintenant;
    var ligne={t:maintenant,type:type,cle:cle};
    for(var a in details)if(Object.prototype.hasOwnProperty.call(details,a))ligne[a]=details[a];
    journal.push(ligne);
    if(journal.length>MAX)journal=journal.slice(-MAX);
    sauver_();
  }

  /* Remplissage visible d'une barre : transform scaleX de l'élément (la barre est animée par le navigateur). */
  function fraction_(el){
    try{
      var tr=window.getComputedStyle(el).transform;
      if(!tr||tr==='none')return 1;
      var m=/^matrix\(([^,]+),/.exec(tr);
      var v=m?parseFloat(m[1]):NaN;
      return isFinite(v)?v:NaN;
    }catch(_e){return NaN;}
  }

  var prec={};
  var orPrec=null;
  var dernierDepense=null;
  var gainMoyen=0;/* revenu d'Or habituel entre deux échantillons : une hausse ne compte que si elle le dépasse nettement */
  var pleineDepuis={};

  function echantillon_(){
    if(document.hidden)return;
    var racine=document.querySelector('.soreal-idle-page-root-v28[data-menu="augmentations"]');
    if(!racine){prec={};pleineDepuis={};return;}
    var maintenant=Date.now();
    var etat=null;
    try{etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){}
    var or=etat&&etat.systemes&&etat.systemes.currencies?Number(etat.systemes.currencies.gold):NaN;

    /* Or : une dépense locale, puis une remontée proche de son montant. */
    if(isFinite(or)&&orPrec!==null){
      var d=or-orPrec;
      if(d<0){dernierDepense={montant:-d,t:maintenant};}
      else if(d>0&&dernierDepense&&maintenant-dernierDepense.t<8000&&d>=0.25*dernierDepense.montant&&d>5*gainMoyen){
        noter_('or_remonte','or',{hausse:Math.round(d),depense:Math.round(dernierDepense.montant),apres_ms:maintenant-dernierDepense.t});
        dernierDepense=null;
      }else if(d>0){gainMoyen=gainMoyen*0.9+d*0.1;}
    }
    if(isFinite(or))orPrec=or;

    var barres=racine.querySelectorAll('[data-idle-aug-bar-v215]');
    for(var i=0;i<barres.length;i++){
      var el=barres[i];
      var id=el.getAttribute('data-idle-aug-bar-v215');
      var nivEl=racine.querySelector('[data-idle-aug-niv-v1="'+id+'"]');
      var niv=nivEl?parseInt(nivEl.textContent,10):NaN;
      var f=fraction_(el);
      if(!isFinite(niv)||!isFinite(f))continue;
      var p=prec[id];
      if(p){
        if(niv<p.niv){noter_('niveau_recule',id,{de:p.niv,a:niv,or:isFinite(or)?Math.round(or):null});p.suspect=null;}
        else if(niv>p.niv){
          /* Le niveau monte : si la barre avait déjà redémarré, on mesure l'écart entre les deux. */
          if(p.suspect){
            var ecart=maintenant-p.suspect.t;
            if(ecart>=400)noter_('validation_tardive',id,{ms:ecart,niv:niv,or:isFinite(or)?Math.round(or):null});
            p.suspect=null;
          }
        }else if(!p.suspect&&p.f-f>0.12){
          p.suspect={t:maintenant,de:Math.round(p.f*100),a:Math.round(f*100)};
        }else if(p.suspect&&maintenant-p.suspect.t>1500){
          noter_('barre_recule',id,{de:p.suspect.de,a:p.suspect.a,niv:niv,attente_ms:maintenant-p.suspect.t});
          p.suspect=null;
        }
      }
      /* Barre pleine qui n'avance pas, alors que rien ne manque. */
      if(f>=0.995){
        if(!pleineDepuis[id])pleineDepuis[id]={t:maintenant,niv:niv};
        var sejour=maintenant-pleineDepuis[id].t;
        if(sejour>2500&&pleineDepuis[id].niv===niv){
          var etaEl=racine.querySelector('[data-idle-aug-eta-v1="'+id+'"]');
          var eta=etaEl?etaEl.textContent:'';
          if(!/il manque|missing|Or pour|Gold for|défi en cours|Challenge in progress|Place|énergie|energy/i.test(eta))noter_('pause_validation',id,{ms:sejour,niv:niv,eta:String(eta).slice(0,60)});
        }
      }else delete pleineDepuis[id];
      prec[id]={niv:niv,f:f,suspect:p&&p.suspect&&niv===p.niv?p.suspect:null};
    }
  }

  function resume_(){
    var r={};
    for(var i=0;i<journal.length;i++)r[journal[i].type]=(r[journal[i].type]||0)+1;
    return r;
  }
  function texte_(){
    var r=resume_();
    var tete='Journal de fluidité — '+journal.length+' ligne(s) : '+(Object.keys(r).map(function(k){return k+' ×'+r[k];}).join(', ')||'rien noté');
    var lignes=journal.slice(-60).map(function(e){
      var h=new Date(e.t).toLocaleTimeString('fr-BE');
      var det=[];
      for(var a in e)if(a!=='t'&&a!=='type'&&a!=='cle')det.push(a+'='+e[a]);
      return h+'  '+e.type+'  '+e.cle+'  '+det.join(' ');
    });
    return textePerf_()+tete+'\n'+lignes.join('\n');
  }

  function fermer_(){var o=document.getElementById('soreal-idle-diag-v1');if(o)o.remove();}
  function ouvrir_(){
    fermer_();
    var o=document.createElement('div');
    o.id='soreal-idle-diag-v1';
    o.setAttribute('data-sans-traduction','1');
    o.style.cssText='position:fixed;inset:0;z-index:100003;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
    o.innerHTML='<div role="dialog" aria-modal="true" style="width:min(720px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#dce5f3;font:14px system-ui,sans-serif">'+
      '<h3 style="margin:0 0 6px;font-size:18px">🩺 Journal de fluidité</h3>'+
      '<div style="color:#8fa3c9;margin-bottom:8px">Reculs de barres, pauses de validation et Or « rendu » observés dans le menu Augmentations, sur cet appareil. Rien n’est envoyé : copie le texte pour me le transmettre.</div>'+
      '<textarea id="soreal-idle-diag-texte-v1" readonly style="width:100%;min-height:240px;box-sizing:border-box;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#0f1729;color:#eef4fc;padding:10px;font:12px ui-monospace,monospace"></textarea>'+
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">'+
        '<button type="button" id="soreal-idle-diag-vider-v1" style="padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;cursor:pointer">Vider</button>'+
        '<button type="button" id="soreal-idle-diag-copier-v1" style="padding:9px 16px;border-radius:10px;border:1px solid #5b93e6;background:#2f6fd0;color:#eef4fc;cursor:pointer">Copier</button>'+
        '<button type="button" id="soreal-idle-diag-fermer-v1" style="padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;cursor:pointer">Fermer</button>'+
      '</div></div>';
    document.body.appendChild(o);
    var ta=document.getElementById('soreal-idle-diag-texte-v1');
    ta.value=texte_();
    document.getElementById('soreal-idle-diag-fermer-v1').addEventListener('click',fermer_);
    document.getElementById('soreal-idle-diag-vider-v1').addEventListener('click',function(){journal=[];dernierParCle={};sauver_();ta.value=texte_();});
    document.getElementById('soreal-idle-diag-copier-v1').addEventListener('click',function(){
      ta.select();
      try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value);else document.execCommand('copy');}catch(_e){}
    });
    o.addEventListener('mousedown',function(e){if(e.target===o)fermer_();});
  }

  setInterval(function(){try{echantillon_();}catch(_e){}},PERIODE_MS);

  /*
   * Sonde de fluidité du téléphone (Norman, 2026-10-08 : « lancé depuis SOREAL APP, le jeu rame ; depuis Chrome ou son APK, non »). Administrateur seulement, rien n'est envoyé. Toutes les 10 s elle relève :
   *   - mode : « iframe » (jeu intégré dans une autre page, ex. SOREAL APP) ou « direct » ;
   *   - fps / pire_ms / lentes : cadence des images (requestAnimationFrame), pire image, nombre d'images de plus de 50 ms ;
   *   - taches / taches_ms / tache_max_ms : tâches « longues » (plus de 50 ms) qui ont bloqué le fil d'exécution (PerformanceObserver longtask).
   * Lecture : des tâches longues = le fil est occupé par du code (le jeu ou la page qui l'héberge) ; peu de tâches longues mais peu d'images = le dessin est lent (composition de la fenêtre intégrée).
   * Les 4 derniers relevés de chaque mode sont gardés (soreal_idle_perf_v1) et listés en tête du journal : on compare « iframe » et « direct » sans rien écrire.
   */
  var CLE_PERF='soreal_idle_perf_v1';
  var modeJeu='direct';
  try{modeJeu=window.parent!==window?'iframe':'direct';}catch(_e){modeJeu='iframe';}
  var perf={};
  try{var bp=localStorage.getItem(CLE_PERF);if(bp){var op=JSON.parse(bp);if(op&&typeof op==='object')perf=op;}}catch(_e){}
  var sonde={actif:false,images:0,somme:0,pire:0,lentes:0,dernier:0,taches:0,tachesMs:0,tacheMax:0};
  function estAdmin_(){try{return typeof window.__SOREAL_IDLE_EST_ADMIN_V1__==='function'&&window.__SOREAL_IDLE_EST_ADMIN_V1__()===true;}catch(_e){return false;}}
  function raz_(){sonde.dernier=0;sonde.images=0;sonde.somme=0;sonde.pire=0;sonde.lentes=0;sonde.taches=0;sonde.tachesMs=0;sonde.tacheMax=0;}
  function image_(t){
    if(sonde.dernier){
      var d=t-sonde.dernier;
      /* Un onglet resté caché puis revenu donne une image « géante » qui n'est pas une lenteur : ignorée au-delà de 1 s. */
      if(d<1000){sonde.images+=1;sonde.somme+=d;if(d>sonde.pire)sonde.pire=d;if(d>50)sonde.lentes+=1;}
    }
    sonde.dernier=t;
    if(sonde.actif)requestAnimationFrame(image_);
  }
  function demarrerSonde_(){
    if(sonde.actif)return;
    sonde.actif=true;
    try{
      if(typeof PerformanceObserver==='function'){
        var po=new PerformanceObserver(function(liste){
          liste.getEntries().forEach(function(e){sonde.taches+=1;sonde.tachesMs+=e.duration;if(e.duration>sonde.tacheMax)sonde.tacheMax=e.duration;});
        });
        po.observe({type:'longtask',buffered:false});
      }
    }catch(_e){}
    requestAnimationFrame(image_);
  }
  function relever_(){
    if(!estAdmin_())return;
    if(!sonde.actif){demarrerSonde_();return;}
    if(document.hidden){raz_();return;}
    if(sonde.images<20)return;
    var releve={t:Date.now(),fps:Math.round(1000/(sonde.somme/sonde.images)),pire_ms:Math.round(sonde.pire),lentes:sonde.lentes,taches:sonde.taches,taches_ms:Math.round(sonde.tachesMs),tache_max_ms:Math.round(sonde.tacheMax)};
    raz_();
    sonde.dernier=0;
    var liste=Array.isArray(perf[modeJeu])?perf[modeJeu]:[];
    liste.push(releve);
    perf[modeJeu]=liste.slice(-4);
    try{localStorage.setItem(CLE_PERF,JSON.stringify(perf));}catch(_e){}
  }
  setInterval(function(){try{relever_();}catch(_e){}},10000);
  function textePerf_(){
    var lignes=[];
    ['iframe','direct'].forEach(function(m){
      (Array.isArray(perf[m])?perf[m]:[]).forEach(function(r){
        lignes.push(new Date(r.t).toLocaleTimeString('fr-BE')+'  mode='+m+'  '+r.fps+' images/s · pire image '+r.pire_ms+' ms · '+r.lentes+' lentes · '+r.taches+' tâche(s) longue(s) ('+r.taches_ms+' ms au total, max '+r.tache_max_ms+' ms)');
      });
    });
    return lignes.length?'Fluidité mesurée (4 derniers relevés de 10 s par mode) :\n'+lignes.join('\n')+'\n\n':'';
  }

  window.__SOREAL_IDLE_DIAG_V1__={
    journal:function(){return journal.slice();},
    resume:resume_,
    texte:texte_,
    ouvrir:ouvrir_,
    vider:function(){journal=[];dernierParCle={};sauver_();},
    /* Une erreur avalée par un try/catch de la logique de jeu : notée sans bruit pour le joueur (une ligne par clé toutes les 5 s). */
    signaler:function(cle,e){try{noter_('erreur_avalee',String(cle||'?'),{msg:String(e&&e.message||e).slice(0,120)});}catch(_e){}},
    /* Pour les tests : entre dans l'échantillonnage sans minuteur. */
    echantillon:echantillon_,
    perf:function(){return JSON.parse(JSON.stringify(perf));},
    mode:modeJeu,
    /* Pour les tests : un relevé sans attendre 10 s ni images réelles. */
    releverPour:function(mode,releve){perf[mode]=(Array.isArray(perf[mode])?perf[mode]:[]).concat([releve]).slice(-4);}
  };
  window.__diagFluiditeOuvrirV1__=ouvrir_;
})();
