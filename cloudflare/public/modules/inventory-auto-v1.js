/*
 * SOREAL IDLE — automatisation de l'inventaire (client, 2026-09-23).
 *
 * Module client isolé : lit uniquement j.systemes.inventoryAuto (snapshot serveur,
 * idle-inventory-auto-v1.js::idleInventoryAutoSnapshotV1) et j.systemes.adventure, et envoie les
 * actions {action:'inventoryAuto', mode:...} via window.__actionMetaV47__. Aucune règle de jeu n'est
 * recalculée ici (minuteurs, recyclage, filtres, priorités : tout vient du serveur).
 *
 * S'insère dans la page Inventory déjà rendue par soreal-idle-ui.js (abonnement au runtime) :
 *  - contour bleu des slots d'automerge (violet s'il est aussi protégé, page Inventory) ;
 *  - panneau « Automatisation de l'inventaire » sous l'équipement et le sac ;
 *  - raccourcis de la page Inventory : A + clic (booster), D + clic (fusionner), Q/W/E + clic
 *    (transformer un boost en Power/Toughness/Special), et un sélecteur « Action au clic » pour les
 *    écrans tactiles.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_INVENTORY_AUTO_V1__)return;

  var TOUCHES={a:'boost',d:'merge',q:'power',w:'toughness',e:'special'};
  var toucheTenue='';
  var modeClic='';
  var dernierEtat=null;
  var avalerClicJusqua=0;

  function html(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function entier(v){var n=Math.floor(Number(v));return Number.isFinite(n)?n:0;}
  function duree(sec){
    var s=Math.max(0,entier(sec));var h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
    return h>0?h+' h '+String(m).padStart(2,'0')+' min':(m>0?m+' min':s+' s');
  }
  function snap(j){return j&&j.systemes&&j.systemes.inventoryAuto||null;}
  function aventure(j){return j&&j.systemes&&j.systemes.adventure||null;}

  function action(mode,extra){
    var fn=window.__actionMetaV47__;
    if(typeof fn==='function')fn(Object.assign({action:'inventoryAuto',mode:mode},extra||{}));
  }

  /* ---------- actions exposées au panneau ---------- */
  window.__inventaireAutoReglageV1__=function(cle,valeur){var p={};p[cle]=valeur;action('settings',p);};
  window.__inventaireAutoModeClicV1__=function(v){modeClic=TOUCHES[v]?v:'';rendre();};
  window.__inventaireAutoBoosterCubeV1__=function(){action('boostAll',{targetId:'cube'});};
  window.__inventaireAutoFiltreTypeV1__=function(slot,v){action('lootFilterType',{slot:String(slot),filtered:Boolean(v)});};
  window.__inventaireAutoFiltreObjetV1__=function(def,v){action('lootFilterItem',{definitionId:String(def),filtered:Boolean(v)});};
  window.__inventaireAutoLoadoutV1__=function(op,index){
    if(op==='save'&&window.confirm&&!window.confirm('Enregistrer l’équipement actuel dans la configuration '+(entier(index)+1)+' ?'))return;
    action(op==='save'?'loadoutSave':'loadoutApply',{index:entier(index)});
  };

  /* ---------- panneau ---------- */
  var NOMS_TYPES={head:'Casque',chest:'Torse',legs:'Jambes',boots:'Bottes',weapon:'Arme',accessory:'Accessoire'};

  function caseACocher(libelle,coche,onchange,actif){
    return '<label style="display:flex;align-items:center;gap:7px;cursor:'+(actif===false?'default':'pointer')+';opacity:'+(actif===false?'.55':'1')+'">'+
      '<input type="checkbox" '+(coche?'checked ':'')+(actif===false?'disabled ':'')+'onchange="'+onchange+'"> '+libelle+'</label>';
  }
  function verrou(texte){return '<div class="soreal-idle-note-v4" style="margin:4px 0 0">🔒 '+html(texte)+'</div>';}

  function panneau(j){
    var s=snap(j);var a=aventure(j);
    if(!s||!a)return '';
    var u=s.unlocked||{},r=s.settings||{};
    var lignes=[];
    lignes.push('<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">'+
      '<div>'+caseACocher('🔁 Auto Merge'+(r.autoMerge&&s.mergeRemainingSeconds!=null?' · prochain dans '+duree(s.mergeRemainingSeconds):''),r.autoMerge,'window.__inventaireAutoReglageV1__(\'autoMerge\',this.checked)',u.autoMerge)+
        (u.autoMerge?'':verrou('Achat « Auto Merge » dans la boutique EXP.'))+'</div>'+
      '<div>'+caseACocher('✨ Auto Boost'+(r.autoBoost&&s.boostRemainingSeconds!=null?' · prochain dans '+duree(s.boostRemainingSeconds):''),r.autoBoost,'window.__inventaireAutoReglageV1__(\'autoBoost\',this.checked)',u.autoBoost)+
        (u.autoBoost?'':verrou('1re complétion du No Equipment Challenge.'))+'</div>'+
    '</div>');
    lignes.push('<div class="soreal-idle-note-v4" style="margin-top:8px">Minuteur : <b>'+duree(s.intervalSeconds)+'</b> · Recyclage des boosts : <b>'+Math.round(Number(s.boostRecycleChance||0)*100)+' %</b> · Les objets équipés passent d’abord, puis les accessoires, puis les slots d’automerge ; l’Auto Boost ne verse les boosts restants dans le Cube que lorsque tout est au maximum. Les objets protégés (Shift) ne sont jamais consommés.</div>');
    lignes.push('<div style="margin-top:10px"><b>🟦 Slots d’automerge : '+entier(s.mergeSlots)+' / '+entier(s.mergeSlotsMax)+'</b>'+
      (entier(s.mergeSlots)>0?'<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:5px">'+
        caseACocher('Fusion automatique',r.mergeSlotsMerge,'window.__inventaireAutoReglageV1__(\'mergeSlotsMerge\',this.checked)')+
        caseACocher('Boost automatique',r.mergeSlotsBoost,'window.__inventaireAutoReglageV1__(\'mergeSlotsBoost\',this.checked)')+
      '</div><div class="soreal-idle-note-v4" style="margin:4px 0 0">Les premières cases du sac (contour bleu) : aucun butin n’y tombe, dépose-y les objets à faire monter.</div>':
      verrou('Boutique EXP, perks ITOPOD, quirk ou 4G’s Sellout Shop.'))+'</div>');
    var optionsTransfo=[['','Désactivée'],['power','Power'],['toughness','Toughness'],['special','Special']].map(function(o){
      return '<option value="'+o[0]+'"'+(r.autoTransform===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('');
    lignes.push('<div style="margin-top:10px"><b>🔀 Transformation des boosts</b>'+
      (u.boostTransform?'<div class="soreal-idle-note-v4" style="margin:4px 0 0">Q/W/E + clic sur un boost : Power / Toughness / Special'+(u.boostTransformFree?' (sans perte de palier).':', au prix d’un palier (le niveau repart à 0).')+'</div>':verrou('1re complétion du 100 Levels Challenge.'))+
      (u.autoTransform?'<label style="display:flex;gap:8px;align-items:center;margin-top:5px">Boosts reçus : <select onchange="window.__inventaireAutoReglageV1__(\'autoTransform\',this.value)">'+optionsTransfo+'</select></label>':'')+
    '</div>');
    var optionsClic=[['','Normale'],['a','A · Booster tout'],['d','D · Fusionner tout']].concat(u.boostTransform?[['q','Q · Transformer en Power'],['w','W · Transformer en Toughness'],['e','E · Transformer en Special']]:[]).map(function(o){
      return '<option value="'+o[0]+'"'+(modeClic===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('');
    lignes.push('<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label style="display:flex;gap:8px;align-items:center"><b>👆 Action au clic</b> <select onchange="window.__inventaireAutoModeClicV1__(this.value)">'+optionsClic+'</select></label>'+
      (a.cube&&a.cube.unlocked?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__inventaireAutoBoosterCubeV1__()">🧊 Tous les boosts dans le Cube</button>':'')+
      '<span class="soreal-idle-note-v4" style="margin:0">Au clavier : maintiens A, D, Q, W ou E puis clique sur un objet.</span></div>');
    var types=s.lootFilterTypes||[];
    lignes.push('<div style="margin-top:10px"><b>🧹 Filtre de butin</b>'+
      (u.lootFilterBasic?'<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:5px">'+types.map(function(t){
        return caseACocher(NOMS_TYPES[t]||t,s.lootFilter&&s.lootFilter.types&&s.lootFilter.types[t],'window.__inventaireAutoFiltreTypeV1__(\''+html(t)+'\',this.checked)');
      }).join('')+'</div>':verrou('Achat « Basic Loot Filter » dans la boutique EXP.'))+
      (u.lootFilterImproved?'<details style="margin-top:6px"><summary>Filtre amélioré ('+(s.lootFilter&&s.lootFilter.items?s.lootFilter.items.length:0)+' objet(s) filtré(s))</summary><div style="display:grid;gap:3px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:6px;max-height:260px;overflow:auto">'+
        (s.filterable||[]).map(function(f){return caseACocher(html(f.name),f.filtered,'window.__inventaireAutoFiltreObjetV1__(\''+html(f.definitionId)+'\',this.checked)');}).join('')+
      '</div></details>':verrou('Filtre objet par objet : « Improved Loot Filter » (4G’s Sellout Shop).'))+
      (u.filterBoostsIntoCube?'<div class="soreal-idle-note-v4" style="margin:4px 0 0">Les boosts filtrés partent dans le Cube de l’infini (sans recyclage).</div>':'')+
    '</div>');
    var los=Array.isArray(s.loadouts)?s.loadouts:[];
    lignes.push('<div style="margin-top:10px"><b>🎽 Configurations d’équipement ('+entier(s.loadoutSlots)+' / '+entier(s.loadoutsMax)+')</b>'+
      (los.length?'<div style="display:grid;gap:6px;margin-top:5px">'+los.map(function(lo,i){
        var contenu=lo&&lo.items&&lo.items.length?lo.items.map(function(x){return html(x.name||'objet absent');}).join(', '):'vide';
        return '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span><b>'+(i+1)+'.</b> <span style="font-size:12px;color:#aeb5c8">'+contenu+'</span></span><span style="display:flex;gap:6px">'+
          '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__inventaireAutoLoadoutV1__(\'save\','+i+')">Enregistrer</button>'+
          (lo?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__inventaireAutoLoadoutV1__(\'apply\','+i+')">Équiper</button>':'')+
        '</span></div>';
      }).join('')+'</div>':verrou('Boutique EXP (« 2 Loadout Slots! », « Another Loadout Slot! ») ou 4G’s Sellout Shop.'))+
    '</div>');
    return '<div class="soreal-idle-window-title-v31">⚙️ Automatisation de l’inventaire</div>'+lignes.join('');
  }

  function style(){
    if(document.getElementById('soreal-idle-inventory-auto-style-v1'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-inventory-auto-style-v1';
    st.textContent='.idle-merge-slot-v1{outline:3px solid #3b82f6;outline-offset:-3px}'+
      '.idle-merge-slot-v1.idle-item-locked-v165{outline-color:#8b5cf6}'+
      '#soreal-idle-inventory-auto-v1 select{padding:4px 6px;border-radius:8px}';
    document.head.appendChild(st);
  }

  function rendre(){
    var sac=document.getElementById('soreal-idle-v138-bag-section');
    if(!sac||!dernierEtat)return;
    var s=snap(dernierEtat);
    if(!s)return;
    style();
    var k=entier(s.mergeSlots);
    var cases=sac.querySelectorAll('.soreal-idle-v138-bag > .soreal-idle-v138-bag-card');
    for(var i=0;i<cases.length;i++){
      var idx=entier(cases[i].getAttribute('data-slot-index'));
      cases[i].classList.toggle('idle-merge-slot-v1',idx<k);
    }
    var colonnes=sac.closest('.soreal-idle-v151-inventory-columns')||sac;
    var bloc=document.getElementById('soreal-idle-inventory-auto-v1');
    if(!bloc){
      bloc=document.createElement('div');
      bloc.id='soreal-idle-inventory-auto-v1';
      bloc.className='soreal-idle-section-v8';
      colonnes.parentNode.insertBefore(bloc,colonnes.nextSibling);
    }
    if(bloc.contains(document.activeElement)&&document.activeElement.tagName==='SELECT')return;
    var contenu=panneau(dernierEtat);
    if(bloc.getAttribute('data-sig')!==contenu){
      bloc.innerHTML=contenu;
      bloc.setAttribute('data-sig',contenu);
    }
  }

  function rafraichir(){
    var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
    if(!rt||typeof rt.getState!=='function')return;
    rt.getState().then(function(j){if(j){dernierEtat=j;rendre();}}).catch(function(){});
  }

  /* ---------- raccourcis A / D / Q / W / E + clic ---------- */
  function cibleClic(ev){
    if(!document.getElementById('soreal-idle-v138-bag-section'))return null;
    var el=ev.target&&ev.target.closest?ev.target.closest('[data-item-id],[data-occupant-id],[data-idle-cube-drop-v180]'):null;
    if(!el||!el.closest('.soreal-idle-v151-inventory-columns'))return null;
    if(el.hasAttribute('data-idle-cube-drop-v180'))return {cube:true};
    return {id:el.getAttribute('data-item-id')||el.getAttribute('data-occupant-id')};
  }

  function executer(cle,cible){
    var op=TOUCHES[cle];
    if(!op||!cible)return false;
    if(cible.cube){
      if(op!=='boost')return false;
      action('boostAll',{targetId:'cube'});
      return true;
    }
    var a=aventure(dernierEtat);
    var objet=a&&Array.isArray(a.inventory)?a.inventory.find(function(o){return String(o.id)===String(cible.id);}):null;
    if(!objet)return false;
    if(op==='merge'){action('mergeAll',{itemId:objet.id});return true;}
    if(op==='boost'){if(objet.kind==='boost')return false;action('boostAll',{targetId:objet.id});return true;}
    if(objet.kind!=='boost')return false;
    action('transformBoost',{itemId:objet.id,type:op});
    return true;
  }

  function surPointeur(ev){
    var cle=toucheTenue||modeClic;
    if(!cle)return;
    var cible=cibleClic(ev);
    if(!cible)return;
    if(executer(cle,cible)){
      ev.preventDefault();ev.stopImmediatePropagation();
      avalerClicJusqua=Date.now()+600;
    }
  }
  function surClic(ev){
    if(Date.now()<avalerClicJusqua&&cibleClic(ev)){ev.preventDefault();ev.stopImmediatePropagation();}
  }
  function champSaisie(el){return el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable);}

  document.addEventListener('keydown',function(ev){
    var k=String(ev.key||'').toLowerCase();
    if(TOUCHES[k]&&!champSaisie(ev.target)&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey)toucheTenue=k;
  },true);
  document.addEventListener('keyup',function(ev){if(String(ev.key||'').toLowerCase()===toucheTenue)toucheTenue='';},true);
  window.addEventListener('blur',function(){toucheTenue='';});
  document.addEventListener('pointerdown',surPointeur,true);
  document.addEventListener('click',surClic,true);

  function brancher(){
    var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
    if(!rt||typeof rt.onRender!=='function'){setTimeout(brancher,200);return;}
    rt.onRender(rafraichir);
  }
  brancher();

  window.__SOREAL_IDLE_INVENTORY_AUTO_V1__={panneau:panneau,rendre:rendre};
})();
