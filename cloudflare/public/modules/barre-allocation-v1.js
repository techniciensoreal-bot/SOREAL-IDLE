/*
 * SOREAL IDLE — barre d'outils d'allocation commune (Norman, 2026-10-09 : « dans chacun des menus où on peut placer une ressource, à chaque fois un bouton + − MAX ; en haut, toujours un cadre
 * Plafond d'énergie MAX 1/2 1/4 et un 2e cadre IDLE 1/2 1/4 TOUT RETIRER »).
 *
 * Un seul gabarit pour les menus qui n'en avaient pas ou qui le dessinaient à leur façon : le champ Input est partagé (même valeur dans tous les menus), « Plafond » prend une part du maximum de la
 * ressource, « IDLE » une part de ce qui est libre, « Tout retirer » rend ce que CE menu a reçu. Les données viennent du jeu (j.energie, j.energieMax, j.systemes.resources) : rien d'inventé.
 *
 *   window.__SOREAL_IDLE_ALLOC_V1__ = { compteur(res,systeme), total(j,res,systeme), cadres(res,systeme), entree(id), preset(res,source,fraction), vider(res,systeme), ajuster(systeme,res,mode), ajusterVoeu(slot,res,mode,courant,libre) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ALLOC_V1__)return;

  var TITRES={
    energy:{cap:'⚡ Plafond d’énergie',nom:'énergie',place:'⚡ Énergie placée'},
    magic:{cap:'🔮 Plafond de magie',nom:'magie',place:'🔮 Magie placée'},
    r3:{cap:'🧪 Plafond de 3e ressource',nom:'3e ressource',place:'🧪 3e ressource placée'}
  };
  /* Les champs Input des différents menus (chacun garde le sien) : ils reçoivent tous la même valeur. */
  var CHAMPS=['sorealIdleAugInputV1','sorealIdleTrainingInputV120','sorealIdleBloodInputV1','sorealIdleTmInputV1','sorealIdleGenInputV1'];

  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__||null;}
  function etat_(){var h=H_();return h&&h.getIdleEtat?h.getIdleEtat():null;}
  function entier_(v){var n=Math.floor(Number(v));return Number.isFinite(n)&&n>0?n:0;}
  function html_(t){var h=H_();return h&&h.idleHtml_?h.idleHtml_(t):String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* Maximum et part libre d'une ressource (mêmes sources que les menus existants). */
  function ressource_(j,res){
    if(res==='energy')return {cap:entier_(j&&j.energieMax),libre:entier_(j&&j.energie)};
    var r=j&&j.systemes&&j.systemes.resources&&j.systemes.resources[res];
    return {cap:entier_(r&&r.cap),libre:entier_(r&&r.current)};
  }

  function montant_(){
    var f=window.__lireMontantAugmentIdleV1__;
    var n=typeof f==='function'?Math.floor(Number(f())):125;
    return Number.isFinite(n)&&n>=1?n:125;
  }

  function ecrireMontant_(n){
    CHAMPS.forEach(function(id){var el=document.getElementById(id);if(el)el.value=String(n);});
    /* Wandoos : la saisie se fait au clavier de l'ordinateur rétro, elle reçoit la même valeur. */
    var w=window.__SOREAL_IDLE_WANDOOS_V1__;
    if(w&&typeof w.saisir==='function'&&document.querySelector('.wd-poste'))w.saisir(String(n));
    if(typeof window.__saisirMontantAugmentIdleV1__==='function')window.__saisirMontantAugmentIdleV1__(n);
  }

  /* « Plafond » : part du maximum ; « IDLE » : part de ce qui est libre. Ne fait qu'écrire l'Input, comme dans Basic Training. */
  function preset(res,source,fraction){
    var info=ressource_(etat_(),res);
    var base=source==='idle'?info.libre:info.cap;
    ecrireMontant_(Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0))));
  }

  function action_(payload){
    var f=window.__actionMetaIdleV130__;
    if(typeof f==='function')f(payload);
  }

  /* « Tout retirer » : rend à la réserve tout ce que ce menu a reçu pour cette ressource. */
  function vider(res,systeme){
    if(systeme==='wishes'){
      var j=etat_();
      var slots=j&&j.systemes&&j.systemes.wishSlots&&Array.isArray(j.systemes.wishSlots.slots)?j.systemes.wishSlots.slots:[];
      slots.forEach(function(sl){action_({action:'allocateWishSlot',slot:sl.index,resource:res,value:0});});
      return;
    }
    if(systeme==='wandoos'&&window.__SOREAL_IDLE_WANDOOS_V1__&&typeof window.__SOREAL_IDLE_WANDOOS_V1__.place==='function'){
      window.__SOREAL_IDLE_WANDOOS_V1__.place(res,'zero');
      return;
    }
    action_({action:'allocate',system:systeme,resource:res,value:0});
  }

  /*
   * Total placé dans CE menu pour une ressource (Norman, 2026-10-09) : lu dans l'état du jeu, jamais calculé à part. Basic Training garde son propre compteur, les souhaits sont répartis par emplacement,
   * les autres menus portent leur allocation dans systemes.systems[].state.allocation.
   */
  function total_(j,res,systeme){
    if(!j)return 0;
    if(systeme==='basicTraining')return res==='energy'?entier_(j.basicTraining&&j.basicTraining.energy&&j.basicTraining.energy.allocated):0;
    var sy=j.systemes||{};
    if(systeme==='wishes'){
      var slots=sy.wishSlots&&Array.isArray(sy.wishSlots.slots)?sy.wishSlots.slots:[];
      return slots.reduce(function(a,sl){return a+entier_(sl&&sl.allocation&&sl.allocation[res]);},0);
    }
    var liste=Array.isArray(sy.systems)?sy.systems:[];
    var s=liste.filter(function(x){return x&&x.id===systeme;})[0];
    return entier_(s&&s.state&&s.state.allocation&&s.state.allocation[res]);
  }

  /* Cadre « total placé » : même cadre que les autres de la barre d'outils (donc aux couleurs du thème de chaque page), la teinte du menu (--nav-color) en repli. */
  function compteur(res,systeme){
    var t=TITRES[res]||TITRES.energy;
    var j=etat_();
    var n=total_(j,res,systeme);
    var info=ressource_(j,res);
    var h=H_();
    var texte=h&&h.formatGrandNombreIdleV70_?h.formatGrandNombreIdleV70_(n):String(n);
    var pct=info.cap>0?Math.min(100,Math.round(n/info.cap*1000)/10):0;
    return '<div class="soreal-idle-bt-presets-v120 soreal-idle-bt-total-v1" data-alloc-total-v1="'+res+'" data-alloc-sys-v1="'+html_(systeme)+'" title="Total placé dans ce menu">'+
      '<span>'+t.place+'</span><b>'+texte+'</b><small>'+String(pct).replace('.',',')+' % du plafond</small></div>';
  }

  /* Les cadres déjà affichés suivent l'état du jeu sans redessiner la page (placer ou retirer de l'énergie ne refait pas toute la barre d'outils). */
  function majTotaux_(){
    if(typeof document.querySelectorAll!=='function')return;
    var cadres=document.querySelectorAll('[data-alloc-total-v1]');
    if(!cadres.length)return;
    var j=etat_(),h=H_();
    if(!j)return;
    Array.prototype.forEach.call(cadres,function(el){
      var res=el.getAttribute('data-alloc-total-v1'),sys=el.getAttribute('data-alloc-sys-v1');
      var n=total_(j,res,sys),info=ressource_(j,res);
      var texte=h&&h.formatGrandNombreIdleV70_?h.formatGrandNombreIdleV70_(n):String(n);
      var pct=info.cap>0?Math.min(100,Math.round(n/info.cap*1000)/10):0;
      var b=el.querySelector('b'),sm=el.querySelector('small');
      if(b&&b.textContent!==texte)b.textContent=texte;
      var t2=String(pct).replace('.',',')+' % du plafond';
      if(sm&&sm.textContent!==t2)sm.textContent=t2;
    });
  }
  var horlogeTotaux_=setInterval(majTotaux_,600);
  if(horlogeTotaux_&&typeof horlogeTotaux_.unref==='function')horlogeTotaux_.unref();

  /* Les deux cadres du haut d'un menu (une ressource) : Plafond MAX 1/2 1/4, puis IDLE 1/2 1/4 TOUT RETIRER, puis le total placé. */
  function cadres(res,systeme){
    var t=TITRES[res]||TITRES.energy;
    var A='window.__SOREAL_IDLE_ALLOC_V1__';
    var r="'"+res+"'",s="'"+html_(systeme)+"'";
    return '<div class="soreal-idle-bt-presets-v120" data-alloc-cadre-v1="cap-'+res+'"><span>'+t.cap+'</span>'+
        '<button type="button" onclick="'+A+'.preset('+r+',\'cap\',1)">Max</button>'+
        '<button type="button" onclick="'+A+'.preset('+r+',\'cap\',.5)">1/2</button>'+
        '<button type="button" onclick="'+A+'.preset('+r+',\'cap\',.25)">1/4</button></div>'+
      '<div class="soreal-idle-bt-presets-v120" data-alloc-cadre-v1="idle-'+res+'"><span>💤 Idle</span>'+
        '<button type="button" onclick="'+A+'.preset('+r+',\'idle\',.5)">1/2</button>'+
        '<button type="button" onclick="'+A+'.preset('+r+',\'idle\',.25)">1/4</button>'+
        '<button type="button" class="clear" onclick="'+A+'.vider('+r+','+s+')">Tout retirer</button></div>'+
      compteur(res,systeme);
  }

  /* Champ Input des menus génériques (Barbes, Hacks…) : même valeur partagée que partout. */
  function entree(id){
    return '<div class="soreal-idle-bt-input-box-v120"><label for="'+id+'">🎚️ Input</label>'+
      '<input id="'+id+'" type="text" value="'+montant_()+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" '+
      'oninput="window.__saisirMontantAugmentIdleV1__&&window.__saisirMontantAugmentIdleV1__(this.value)" '+
      'onblur="window.__resoudreFractionInputIdleV1__&&window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__&&window.__saisirMontantAugmentIdleV1__(this.value)"></div>';
  }

  /* + / − / MAX d'une ressource d'un système générique : valeurs ABSOLUES (le serveur borne au maximum et à ce qui est libre). */
  function ajuster(systeme,res,mode){
    var h=H_(),j=etat_();
    if(!h||!j)return;
    var liste=j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    var sys=liste.filter(function(x){return x&&x.id===systeme;})[0]||null;
    var courant=entier_(sys&&sys.state&&sys.state.allocation&&sys.state.allocation[res]);
    var libre=ressource_(j,res).libre;
    var champ=document.getElementById('sorealIdleGenInputV1');
    var pas=champ&&Number.isFinite(Math.floor(Number(champ.value)))&&Math.floor(Number(champ.value))>=1?Math.floor(Number(champ.value)):montant_();
    var valeur=mode==='max'?courant+libre:(mode==='moins'?Math.max(0,courant-pas):courant+pas);
    action_({action:'allocate',system:systeme,resource:res,value:valeur});
  }

  /* Idem pour un emplacement de Wishes (allocation propre à chaque souhait). */
  function ajusterVoeu(slot,res,mode,courant,libre){
    var pas=montant_();
    var c=entier_(courant),l=entier_(libre);
    var valeur=mode==='max'?l:(mode==='moins'?Math.max(0,c-pas):Math.min(l,c+pas));
    action_({action:'allocateWishSlot',slot:slot,resource:res,value:valeur});
  }

  window.__SOREAL_IDLE_ALLOC_V1__={compteur:compteur,total:total_,cadres:cadres,entree:entree,preset:preset,vider:vider,ajuster:ajuster,ajusterVoeu:ajusterVoeu,titres:TITRES};
})();
