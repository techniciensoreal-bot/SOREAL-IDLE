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

  /*
   * « prochain dans X » (Norman, 2026-10-03 : tous les compteurs précis) : écrit une fois au dessin, il restait figé. Le texte porte maintenant son repère (instant où le serveur a produit la valeur,
   * réception moins un demi aller-retour) et un minuteur le met à jour ; le cycle recommence tout seul à chaque intervalle.
   */
  var minuteurAutoV1=null;
  function minuteurAuto(){
    if(minuteurAutoV1||typeof setInterval!=='function')return;
    minuteurAutoV1=setInterval(function(){
      var els=document.querySelectorAll('[data-idle-auto-v1]');
      if(!els.length)return;
      var now=performance.now();
      els.forEach(function(el){
        var cycle=Math.max(1,Number(el.getAttribute('data-cycle'))||1);
        var reste=Number(el.getAttribute('data-rest'))-(now-Number(el.getAttribute('data-at')))/1000;
        if(reste<=0)reste=cycle-((-reste)%cycle);
        var t=duree(Math.ceil(reste));
        if(el.textContent!==t)el.textContent=t;
      });
    },500);
  }
  function prochainAuto(j,s,secondes){
    var rtt=typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0;
    var recu=j&&Number(j.__recuPerfV1);
    var ancre=(recu>0?recu:performance.now())-rtt/2;
    minuteurAuto();
    return ' · prochain dans <span data-idle-auto-v1="1" data-rest="'+Number(secondes)+'" data-at="'+ancre+'" data-cycle="'+Math.max(1,Number(s.intervalSeconds)||1)+'">'+duree(secondes)+'</span>';
  }
  function aventure(j){return j&&j.systemes&&j.systemes.adventure||null;}

  /*
   * Absorption réactive (Norman, 2026-10-01) : « ça met un long temps avant que les boosts ne soient aspirés et disparaissent de l'inventaire ».
   * Le serveur décide de ce qui est absorbé (tirages, recyclage) et confirme après un aller-retour ; en attendant, les boosts du sac s'effacent
   * tout de suite à l'écran (aspirés vers la cible). Si le serveur en laisse certains, ils réapparaissent à la confirmation (ou au bout de 3 s).
   */
  /*
   * Prévision de l'absorption (Norman, 2026-10-02 : « mes items ne sont pas aspirés alors qu'il y a de la place sur mon marteau »). Même règles que le
   * serveur (idle-inventory-auto-v1.js::usableBoostIdsV1 / roomV1) : un boost verrouillé ou rangé dans une case d'automerge n'est jamais utilisé, et
   * un boost n'entre que si la stat visée a de la marge (plafond = base × (1 + niveau/100)). Sert (1) à n'effacer à l'écran QUE les boosts qui seront
   * vraiment absorbés, (2) à dire pourquoi rien n'a été absorbé quand le serveur répond « 0 ».
   */
  function prevoirBoosts_(cibleId){
    var a=aventure(dernierEtat),s=snap(dernierEtat);
    var inv=a&&Array.isArray(a.inventory)?a.inventory:[];
    var cible=inv.find(function(o){return String(o.id)===String(cibleId);});
    var r={ok:[],incertains:0,verrouilles:0,automerge:0,pleins:{},total:0,cible:cible||null};
    if(!cible||cible.kind==='boost')return r;
    var k=Math.max(0,entier(s&&s.mergeSlots));
    var rangesAutomerge={};
    (Array.isArray(a.inventorySlots)?a.inventorySlots.slice(0,k):[]).forEach(function(id){if(id)rangesAutomerge[String(id)]=true;});
    var q=1+Math.max(0,Math.min(100,Number(cible.level)||0))/100;
    inv.forEach(function(o){
      if(!o||o.kind!=='boost')return;
      r.total+=1;
      if(o.locked){r.verrouilles+=1;return;}
      if(rangesAutomerge[String(o.id)]){r.automerge+=1;return;}
      var type=String(o.boostType||'');
      if(type==='power'||type==='toughness'){
        var base=Number(type==='power'?cible.basePower:cible.baseToughness)||0;
        if(!(base>0)){r.incertains+=1;return;}
        var marge=base*q-(Number(cible[type])||0);
        if(marge>1e-9)r.ok.push(String(o.id));else r.pleins[type]=(r.pleins[type]||0)+1;
        return;
      }
      var tous=Array.isArray(cible.specialsAll)?cible.specialsAll:null;
      if(!tous||!tous.length){
        /* Special chiffré d'un objet de la fiche (baseSpecial) : même plafond que Power/Toughness (base × (1 + niveau/100)). Sinon on ne sait pas : jamais effacé à tort. */
        var baseS=Number(cible.baseSpecial)||0;
        if(baseS>0){
          if(baseS*q-(Number(cible.special)||0)>1e-9)r.ok.push(String(o.id));else r.pleins.special=(r.pleins.special||0)+1;
        }else r.incertains+=1;
        return;
      }
      if(tous.some(function(sv){return Number(sv.value)+1e-9<Number(sv.max);}))r.ok.push(String(o.id));else r.pleins.special=(r.pleins.special||0)+1;
    });
    return r;
  }

  /* Phrase affichée quand le serveur n'a rien absorbé : la vraie raison, d'après l'état affiché. */
  function expliquerAucunBoost_(cibleId){
    var p=prevoirBoosts_(cibleId);
    if(!p.cible)return 'Aucun boost absorbé.';
    var nom=p.cible.name||'Cet objet';
    if(!p.total)return 'Aucun boost dans le sac.';
    var raisons=[];
    var noms={power:'Power',toughness:'Toughness',special:'Special'};
    Object.keys(p.pleins).forEach(function(t){raisons.push(p.pleins[t]+' boost '+noms[t]+' : '+noms[t]+' déjà au maximum');});
    if(p.verrouilles)raisons.push(p.verrouilles+' protégé'+(p.verrouilles>1?'s':''));
    if(p.automerge)raisons.push(p.automerge+' dans les cases d’automerge');
    if(p.ok.length)raisons.push('l’état affiché était peut-être en retard, réessaie');
    return '🪄 '+nom+' : aucun boost absorbé'+(raisons.length?' ('+raisons.join(' · ')+')':'')+'.';
  }

  function aspirerBoostsAvecEffet_(cibleId){
    try{
      var p=prevoirBoosts_(cibleId);
      var vus=[];
      p.ok.forEach(function(id){
        var n=document.querySelector('#soreal-idle-v138-bag-section [data-item-id="'+String(id).replace(/"/g,'')+'"]');
        if(n){n.classList.add('soreal-idle-absorbe-v1');vus.push(n);}
      });
      if(vus.length){
        setTimeout(function(){vus.forEach(function(n){if(n&&n.classList)n.classList.remove('soreal-idle-absorbe-v1');});},3000);
      }
    }catch(e){}
  }

  function action(mode,extra){
    if(mode==='boostAll'&&extra&&extra.targetId&&extra.targetId!=='cube')aspirerBoostsAvecEffet_(extra.targetId);
    var fn=window.__actionMetaV47__;
    if(typeof fn==='function')fn(Object.assign({action:'inventoryAuto',mode:mode},extra||{}));
  }

  /*
   * 2026-09-24 (Norman : « Dans les filtres, casque est toujours coché. Je n'arrive pas à le décocher. ») : actionMetaIdleV130_ ABANDONNE
   * en silence toute action envoyée pendant qu'une autre action méta est en cours ; la case décochée à l'écran était alors remise à son
   * ancienne valeur au rendu suivant, sans jamais avoir été enregistrée. Les réglages de ce panneau sont donc envoyés de façon FIABLE :
   * la valeur voulue est mémorisée, renvoyée (jusqu’à 8 envois, toutes les ~1,5 s) tant que l'état du serveur ne la reflète pas, et le
   * panneau affiche la valeur voulue en attendant.
   */
  var enAttente={};
  function valeurServeur_(e){
    var s=snap(dernierEtat);
    if(!s)return undefined;
    /* Zone changée entre-temps : la valeur voulue ne concerne plus le filtre affiché, on abandonne l'envoi. */
    if((e.mode==='lootFilterType'||e.mode==='lootFilterItem')&&e.extra.zone&&s.lootFilterZone&&e.extra.zone!==s.lootFilterZone)return valeurVoulue_(e);
    if(e.mode==='lootFilterType')return Boolean(s.lootFilter&&s.lootFilter.types&&s.lootFilter.types[e.extra.slot]);
    if(e.mode==='lootFilterItem')return Boolean(s.lootFilter&&Array.isArray(s.lootFilter.items)&&s.lootFilter.items.indexOf(e.extra.definitionId)!==-1);
    if(e.mode==='settings'){var cle=Object.keys(e.extra)[0];return s.settings?s.settings[cle]:undefined;}
    return undefined;
  }
  function valeurVoulue_(e){
    if(e.mode==='lootFilterType'||e.mode==='lootFilterItem')return Boolean(e.extra.filtered);
    var cle=Object.keys(e.extra)[0];return e.extra[cle];
  }
  function tenter_(cle){
    var e=enAttente[cle];
    if(!e)return;
    if(valeurServeur_(e)===valeurVoulue_(e)){delete enAttente[cle];rendre();return;}
    if(e.essais>=8){delete enAttente[cle];rendre();return;}
    e.essais+=1;
    action(e.mode,e.extra);
    setTimeout(function(){rafraichir();setTimeout(function(){tenter_(cle);},300);},1200);
  }
  function envoyerFiable_(cle,mode,extra){
    enAttente[cle]={mode:mode,extra:extra,essais:0};
    tenter_(cle);
  }
  function voulu_(cle,valeurServeur){
    var e=enAttente[cle];
    return e?valeurVoulue_(e):valeurServeur;
  }

  /* ---------- actions exposées au panneau ---------- */
  window.__inventaireAutoReglageV1__=function(cle,valeur){var p={};p[cle]=valeur;envoyerFiable_('r:'+cle,'settings',p);};
  window.__inventaireAutoModeClicV1__=function(v){modeClic=TOUCHES[v]?v:'';rendre();};
  window.__inventaireAutoBoosterCubeV1__=function(){action('boostAll',{targetId:'cube'});};
  function zoneFiltre_(){var s=snap(dernierEtat);return s&&s.lootFilterZone?String(s.lootFilterZone):'';}
  window.__inventaireAutoFiltreTypeV1__=function(slot,v){var z=zoneFiltre_();var extra={slot:String(slot),filtered:Boolean(v)};if(z)extra.zone=z;envoyerFiable_('t:'+z+':'+slot,'lootFilterType',extra);};
  window.__inventaireAutoFiltreObjetV1__=function(def,v){var z=zoneFiltre_();var extra={definitionId:String(def),filtered:Boolean(v)};if(z)extra.zone=z;envoyerFiable_('i:'+z+':'+def,'lootFilterItem',extra);};
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
  /*
   * Norman (2026-09-27) : « les améliorations qu'on peut acheter via un menu soit achetable également
   * directement à l'endroit où on doit l'utiliser. Exemple le filtre. » Achat en place, réservé aux
   * améliorations vendues à un SEUL endroit sans ambiguïté (Boutique EXP ou Boutique AP) : les mêmes appels
   * globaux que les vraies pages Boutique (__acheterExpShopIdleV1__, __actionMetaIdleV130__) sont réutilisés
   * tels quels, jamais une nouvelle route d'achat. Les améliorations à sources multiples (Perks/Quirks/Boutique
   * EXP/Boutique AP selon le cas) ou obtenues par une complétion de Challenge (jamais un achat) restent
   * seulement indiquées en texte : acheter au hasard la mauvaise source, ou "acheter" un Challenge, serait faux.
   */
  function acheterEnPlace(achat){
    if(!achat)return '';
    if(achat.type==='exp'){
      return '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__acheterExpShopIdleV1__(\''+html(achat.item)+'\',1)">🪙 Acheter ('+entier(achat.cout)+' EXP)</button>';
    }
    if(achat.type==='ap'){
      return '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'sellShopBuy\',itemId:\''+html(achat.item)+'\'})">💎 Acheter ('+formatGrandNombre(achat.cout)+' AP)</button>';
    }
    return '';
  }
  function formatGrandNombre(n){
    n=Number(n)||0;
    return n>=1000?Math.round(n/1000)+'k':String(entier(n));
  }
  /*
   * ANTI-SPOIL (AGENTS.md règle n°2, 2026-10-01) : une amélioration pas encore obtenue n'apparaît pas du tout (ni cadenas, ni
   * condition d'obtention, ni prix, ni bouton d'achat en place). `acheterEnPlace` ci-dessus reste disponible pour un rendu futur
   * conditionné à la découverte de l'achat, mais n'est plus appelée pour une amélioration verrouillée.
   */
  function verrou(){return '';}

  /*
   * 2026-09-24 (Norman : « les options de l'inventaire, dans le bas, doivent pouvoir se fermer/ouvrir comme le Coffre et Info ») : titre
   * cliquable avec chevron ; fermé tant que rien n'est stocké (même mécanique et même style que le Coffre).
   */
  var CLE_OUVERT='soreal_idle_inv_auto_ouvert_v1';
  function ouvert(){
    try{return localStorage.getItem(CLE_OUVERT)==='1';}catch(e){return false;}
  }
  window.__inventaireAutoBasculerV1__=function(){
    try{localStorage.setItem(CLE_OUVERT,ouvert()?'0':'1');}catch(e){}
    rendre();
  };

  /*
   * Sections (2026-09-27, Norman : « Tout est trop compacté. Crée des petites catégories. Tout doit
   * être clair. ») : chaque réglage vit désormais dans une carte à part, titrée, plutôt qu'empilé
   * dans une seule liste verticale plate. Aucune règle de jeu ne change ici, uniquement le rendu.
   */
  function section(titre,contenu){
    if(!contenu)return '';/* section vide (tout est encore verrouillé) : elle n'apparaît pas */
    return '<section class="soreal-idle-inv-auto-section-v1"><div class="soreal-idle-inv-auto-section-titre-v1">'+titre+'</div>'+contenu+'</section>';
  }

  function panneau(j){
    var s=snap(j);var a=aventure(j);
    if(!s||!a)return '';
    var u=s.unlocked||{},r=s.settings||{};
    var lignes=[];

    var autoItems=
      (u.autoMerge?'<div>'+caseACocher('🔁 Auto Merge'+(r.autoMerge&&s.mergeRemainingSeconds!=null?prochainAuto(j,s,s.mergeRemainingSeconds):''),r.autoMerge,'window.__inventaireAutoReglageV1__(\'autoMerge\',this.checked)',true)+'</div>':'')+
      (u.autoBoost?'<div>'+caseACocher('✨ Auto Boost'+(r.autoBoost&&s.boostRemainingSeconds!=null?prochainAuto(j,s,s.boostRemainingSeconds):''),r.autoBoost,'window.__inventaireAutoReglageV1__(\'autoBoost\',this.checked)',true)+'</div>':'');
    lignes.push(section('🤖 Automatisation',
      (autoItems?'<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">'+autoItems+'</div>'+
      '<div class="soreal-idle-note-v4" style="margin-top:10px">Minuteur : <b>'+duree(s.intervalSeconds)+'</b> · Recyclage des boosts : <b>'+Math.round(Number(s.boostRecycleChance||0)*100)+' %</b><br>Les objets équipés passent d’abord, puis les accessoires, puis les slots d’automerge ; l’Auto Boost ne verse les boosts restants dans le Cube que lorsque tout est au maximum. Les objets protégés (Shift) ne sont jamais consommés.</div>':'')+
      '<div style="margin-top:10px">'+caseACocher(u.autoBoost?'♻️ A + clic / Auto Boost réutilisent aussitôt les boosts recyclés':'♻️ A + clic réutilise aussitôt les boosts recyclés',r.consumeRecycled!==false,'window.__inventaireAutoReglageV1__(\'consumeRecycled\',this.checked)')+
        '<div class="soreal-idle-note-v4" style="margin:4px 0 0">Décoché : un boost recyclé reste dans le sac jusqu’à la passe suivante.</div></div>'
    ));

    /* Anti-spoil : on n'affiche que le nombre déjà obtenu, sans maximum ; rien tant qu'aucun slot n'est obtenu. */
    lignes.push(section('🟦 Slots d’automerge · '+entier(s.mergeSlots),
      entier(s.mergeSlots)>0?('<div style="display:flex;gap:14px;flex-wrap:wrap">'+
        caseACocher('Fusion automatique',r.mergeSlotsMerge,'window.__inventaireAutoReglageV1__(\'mergeSlotsMerge\',this.checked)')+
        caseACocher('Boost automatique',r.mergeSlotsBoost,'window.__inventaireAutoReglageV1__(\'mergeSlotsBoost\',this.checked)')+
      '</div><div class="soreal-idle-note-v4" style="margin-top:6px">Les premières cases du sac (contour bleu) : aucun butin n’y tombe, dépose-y les objets à faire monter.</div>'):
      ''
    ));

    var optionsTransfo=[['','Désactivée'],['power','Puissance'],['toughness','Endurance'],['special','Spécial']].map(function(o){
      return '<option value="'+o[0]+'"'+(r.autoTransform===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('');
    lignes.push(section('🔀 Transformation des boosts',
      (u.boostTransform?'<div class="soreal-idle-note-v4">Q/W/E + clic sur un boost : Puissance / Endurance / Spécial'+(u.boostTransformFree?' (sans perte de palier).':', au prix d’un palier (le niveau repart à 0).')+'</div>':'')+
      (u.autoTransform?'<label style="display:flex;gap:8px;align-items:center;margin-top:8px">Boosts reçus : <select onchange="window.__inventaireAutoReglageV1__(\'autoTransform\',this.value)">'+optionsTransfo+'</select></label>':'')
    ));

    var optionsClic=[['','Normale'],['a','A · Booster tout'],['d','D · Fusionner tout']].concat(u.boostTransform?[['q','Q · Transformer en Puissance'],['w','W · Transformer en Endurance'],['e','E · Transformer en Spécial']]:[]).map(function(o){
      return '<option value="'+o[0]+'"'+(modeClic===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('');
    lignes.push(section('👆 Action au clic',
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
        '<label style="display:flex;gap:8px;align-items:center"><select onchange="window.__inventaireAutoModeClicV1__(this.value)">'+optionsClic+'</select></label>'+
        (a.cube&&a.cube.unlocked?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__inventaireAutoBoosterCubeV1__()">🧊 Tous les boosts dans le Cube</button>':'')+
      '</div><div class="soreal-idle-note-v4" style="margin-top:8px">Au clavier : maintiens A, D, Q, W ou E puis clique sur un objet.</div>'
    ));

    var types=s.lootFilterTypes||[];
    var zonesAv=aventure(dernierEtat)&&Array.isArray(aventure(dernierEtat).zones)?aventure(dernierEtat).zones:[];
    var zoneNom=(zonesAv.find(function(z){return z&&z.id===s.lootFilterZone;})||{}).name||s.lootFilterZone||'';
    var contenuFiltre=(u.lootFilterBasic?'<div style="display:flex;gap:12px;flex-wrap:wrap">'+types.map(function(t){
        return caseACocher(NOMS_TYPES[t]||t,voulu_('t:'+zoneFiltre_()+':'+t,s.lootFilter&&s.lootFilter.types&&s.lootFilter.types[t]),'window.__inventaireAutoFiltreTypeV1__(\''+html(t)+'\',this.checked)');
      }).join('')+'</div>':'')+
      (u.lootFilterImproved?'<div class="soreal-idle-note-v4" style="margin-top:8px">Filtre amélioré : dans le Coffre, chaque objet découvert a son bouton pour ne plus le ramasser dans cette zone.</div>':'')+
      (u.filterBoostsIntoCube?'<div class="soreal-idle-note-v4" style="margin-top:8px">Les boosts filtrés partent dans le Cube de l’infini (sans recyclage).</div>':'');
    lignes.push(section('🧹 Filtre de butin'+(zoneNom?' <span style="font-size:14px;font-weight:600;color:#aeb5c8">· zone : '+html(zoneNom)+' (chaque zone a son filtre)</span>':''),
      contenuFiltre
    ));

    var los=Array.isArray(s.loadouts)?s.loadouts:[];
    lignes.push(section('🎽 Configurations d’équipement · '+entier(s.loadoutSlots),
      los.length?('<div style="display:grid;gap:8px">'+los.map(function(lo,i){
        var contenu=lo&&lo.items&&lo.items.length?lo.items.map(function(x){return html(x.name||'objet absent');}).join(', '):'vide';
        return '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span><b>'+(i+1)+'.</b> <span style="font-size:14px;color:#aeb5c8">'+contenu+'</span></span><span style="display:flex;gap:6px">'+
          '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__inventaireAutoLoadoutV1__(\'save\','+i+')">Enregistrer</button>'+
          (lo?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__inventaireAutoLoadoutV1__(\'apply\','+i+')">Équiper</button>':'')+
        '</span></div>';
      }).join('')+'</div>'):
      ''
    ));

    var estOuvert=ouvert();
    return '<div class="soreal-idle-window-title-v31 soreal-idle-inv-auto-titre-v1" onclick="window.__inventaireAutoBasculerV1__()" role="button" tabindex="0" aria-expanded="'+(estOuvert?'true':'false')+'">'+
      '<span>⚙️ Automatisation de l’inventaire</span><span class="soreal-idle-coffre-chevron-v1">'+(estOuvert?'▲':'▼')+'</span></div>'+
      (estOuvert?'<div class="soreal-idle-inv-auto-sections-v1">'+lignes.join('')+'</div>':'');
  }

  function style(){
    if(document.getElementById('soreal-idle-inventory-auto-style-v1'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-inventory-auto-style-v1';
    st.textContent='.idle-merge-slot-v1{outline:3px solid #3b82f6;outline-offset:-3px}'+
      '.idle-merge-slot-v1.idle-item-locked-v165{outline-color:#8b5cf6}'+
      '#soreal-idle-inventory-auto-v1 select{padding:4px 6px;border-radius:8px}'+
      /*
       * Petites catégories (2026-09-27, Norman : « Tout est trop compacté. Crée des petites
       * catégories. Tout doit être clair. ») : chaque réglage dans sa propre carte, un peu de
       * respiration entre elles, un titre qui se détache clairement du contenu.
       */
      '.soreal-idle-inv-auto-sections-v1{display:grid;gap:10px;margin-top:10px}'+
      '.soreal-idle-inv-auto-section-v1{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(166,188,229,.14)}'+
      '.soreal-idle-inv-auto-section-titre-v1{font:800 13px/1.25 "Segoe UI Variable Text","Segoe UI",system-ui;color:#dce5f3;margin-bottom:9px;display:flex;align-items:center;flex-wrap:wrap;gap:6px}'+
      '.soreal-idle-inv-auto-section-v1 .soreal-idle-note-v4{color:#aeb5c8;line-height:1.5}';
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
    /* 2026-09-24 (Norman) : le Coffre passe avant toutes les options (filtre de butin, etc.) ; sans Coffre, sous le sac. */
    var titreCoffre=document.querySelector('.soreal-idle-coffre-titre-v1');
    var coffre=titreCoffre&&titreCoffre.closest?titreCoffre.closest('.soreal-idle-section-v8'):null;
    var repere=coffre&&coffre.parentNode===colonnes.parentNode?coffre:colonnes;
    if(!bloc){
      bloc=document.createElement('div');
      bloc.id='soreal-idle-inventory-auto-v1';
      bloc.className='soreal-idle-section-v8';
      bloc.setAttribute('data-morph-garder','1');
    }
    if(bloc.parentNode!==repere.parentNode||bloc.previousSibling!==repere){
      repere.parentNode.insertBefore(bloc,repere.nextSibling);
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

  window.__SOREAL_IDLE_INVENTORY_AUTO_V1__={panneau:panneau,rendre:rendre,prevoirBoosts:prevoirBoosts_,expliquerAucunBoost:expliquerAucunBoost_};
})();
