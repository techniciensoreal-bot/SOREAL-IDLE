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
      else if(d>0&&dernierDepense&&maintenant-dernierDepense.t<8000&&d>=0.25*dernierDepense.montant){
        noter_('or_remonte','or',{hausse:Math.round(d),depense:Math.round(dernierDepense.montant),apres_ms:maintenant-dernierDepense.t});
        dernierDepense=null;
      }
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
    return tete+'\n'+lignes.join('\n');
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

  window.__SOREAL_IDLE_DIAG_V1__={
    journal:function(){return journal.slice();},
    resume:resume_,
    texte:texte_,
    ouvrir:ouvrir_,
    vider:function(){journal=[];dernierParCle={};sauver_();},
    /* Pour les tests : entre dans l'échantillonnage sans minuteur. */
    echantillon:echantillon_
  };
  window.__diagFluiditeOuvrirV1__=ouvrir_;
})();
