/*
 * SOREAL IDLE — page « Fragments MacGuffin » (2026-09-23).
 *
 * Module client isolé : lit uniquement j.systemes.macguffins (snapshot
 * serveur, idle-macguffins-v1.js::macguffinSnapshotV1) et envoie les
 * actions {action:'macguffin', op:...} via window.__actionMetaV47__.
 * Aucune formule de jeu n'est recalculée ici : les gains, compteurs et
 * aperçus viennent tous du serveur. Appelé par meta-progression-v130.js
 * (pageSystemeMetaIdleV130_, id 'macguffins').
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MACGUFFINS_V1__)return;

  function H(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html(v){return H().idleHtml_(v);}
  function entier(v){return H().idleEntier_(v);}
  function nombre(v){return H().idleNombre_(v);}
  function grand(v,d){return H().formatGrandNombreIdleV70_(v,d);}

  /* Pourcentages souvent minuscules (0,001 %) : décimales adaptées à la grandeur. */
  function pct(v){
    const n=nombre(v);
    if(n>=1000)return grand(n,2)+' %';
    const d=n>=100?1:n>=1?2:n>=0.01?3:5;
    return n.toFixed(d).replace(/\.?0+$/,'').replace('.',',')+' %';
  }

  function duree(secondes){
    const s=Math.max(0,Math.floor(nombre(secondes)));
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
    return h>0?h+' h '+String(m).padStart(2,'0')+' min':m+' min';
  }

  /* Noms d'affichage des zones (Aventure) portant un fragment. */
  const ZONES={sewers:'Égouts',forest:'Forêt',cave:'Grotte aux multiples choses',sky:'Le Ciel',hsb:'Base haute sécurité',clock:'Dimension de l’horloge','2d':'Univers 2D',ancient:'Champ de bataille antique',avsp:'Un endroit très étrange',mega:'Mégaterres',beardverse:'The Beardverse',badly:'Badly Drawn World',boring:'Boring-Ass Earth',chocolate:'Chocolate World',evilverse:'The Evilverse',pinkprincess:'Pretty Pink Princess Land',metaland:'Meta Land',interdimensional:'Interdimensional Party'};
  const TITANS={nerd:'Greasy Nerd',godmother:'The Godmother'};

  function action(op,extra){
    const fn=window.__actionMetaV47__;
    if(typeof fn==='function')fn(Object.assign({action:'macguffin',op:op},extra||{}));
  }
  window.__macguffinEquiperV1__=function(uid){action('equip',{uid:String(uid)});};
  window.__macguffinRetirerV1__=function(uid){action('unequip',{uid:String(uid)});};
  window.__macguffinFusionnerTypeV1__=function(type){action('mergeAll',{type:String(type)});};
  window.__macguffinJeterV1__=function(uid){
    if(window.confirm&&!window.confirm('Jeter définitivement ce fragment ?'))return;
    action('discard',{uid:String(uid)});
  };
  window.__macguffinSortV1__=function(sort){action(sort==='beta'?'bloodBeta':'bloodAlpha');};

  function bouton(libelle,onclick,actif){
    return '<button type="button" class="soreal-idle-expand-button-v25" '+(actif===false?'disabled':'onclick="'+onclick+'"')+'>'+libelle+'</button>';
  }

  function page(j){
    const snap=j&&j.systemes&&j.systemes.macguffins||null;
    const titre='🧩 Fragments MacGuffin';
    if(!snap||!snap.unlocked){
      return H().entetePageIdleV28_(titre,'Des artefacts qui renforcent ton personnage de façon permanente à chaque Rebirth.')+
        '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Bats la forme finale de Walderp pour débloquer les MacGuffins.</div>';
    }
    const types={};
    (snap.types||[]).forEach(function(t){types[t.id]=t;});
    const nomType=function(id){return types[id]?types[id].nom:id;};
    const effetType=function(id){return types[id]?types[id].effet:'';};
    const equipes=Array.isArray(snap.equipped)?snap.equipped:[];
    const inventaire=Array.isArray(snap.inventory)?snap.inventory:[];
    const typesEquipes={};
    equipes.forEach(function(f){typesEquipes[f.type]=true;});
    const slotsLibres=entier(snap.slots)-equipes.length;

    const resume='<div class="soreal-idle-summary-grid-v28">'+
      '<div class="soreal-idle-summary-v28">Emplacements<b>'+equipes.length+' / '+entier(snap.slots)+'</b></div>'+
      '<div class="soreal-idle-summary-v28">Niveau des drops<b>'+entier(snap.dropLevel)+'</b></div>'+
      '<div class="soreal-idle-summary-v28">Ratio de temps (run '+duree(snap.runSeconds)+')<b>x'+grand(snap.timeRatio,2)+'</b></div>'+
      '<div class="soreal-idle-summary-v28">MacGuffin Muffin<b>'+(snap.muffinActive?'actif (x2)':'—')+'</b></div>'+
    '</div>';

    const blocEquipes='<h3 style="margin:16px 0 8px">Équipés</h3>'+(equipes.length?'<div style="display:grid;gap:10px">'+equipes.map(function(f,i){
      const copies=inventaire.filter(function(x){return x.type===f.type;}).length;
      return '<div class="soreal-idle-section-v8" style="margin:0">'+
        '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+(i+1)+'. '+html(nomType(f.type))+'</b><span>Niveau '+grand(f.level)+'</span></div>'+
        '<div style="font-size:12px;color:#aeb5c8;margin-top:5px">'+html(effetType(f.type))+' · au prochain Rebirth : <b>+'+pct(f.nextGainPct)+'</b> · total permanent : <b>+'+pct(snap.permanent&&snap.permanent[f.type])+'</b></div>'+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
          bouton('Retirer','window.__macguffinRetirerV1__(\''+html(f.uid)+'\')')+
          (copies?bouton('Fusionner '+copies+' copie(s)','window.__macguffinFusionnerTypeV1__(\''+html(f.type)+'\')'):'')+
        '</div></div>';
    }).join('')+'</div>':'<div class="soreal-idle-note-v4">Aucun fragment équipé : seuls les fragments équipés augmentent leur bonus au Rebirth.</div>');

    const groupes={};
    inventaire.forEach(function(f){(groupes[f.type]=groupes[f.type]||[]).push(f);});
    const blocInventaire='<h3 style="margin:16px 0 8px">Inventaire</h3>'+(inventaire.length?'<div style="display:grid;gap:10px">'+Object.keys(groupes).map(function(type){
      const liste=groupes[type].slice().sort(function(a,b){return nombre(b.level)-nombre(a.level);});
      return '<div class="soreal-idle-section-v8" style="margin:0">'+
        '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+html(nomType(type))+'</b><span>'+liste.length+' fragment(s)</span></div>'+
        '<div style="font-size:12px;color:#aeb5c8;margin-top:5px">'+html(effetType(type))+'</div>'+
        (liste.length>1||typesEquipes[type]?'<div style="margin-top:7px">'+bouton(typesEquipes[type]?'Tout fusionner dans l’équipé':'Tout fusionner','window.__macguffinFusionnerTypeV1__(\''+html(type)+'\')')+'</div>':'')+
        '<div style="display:grid;gap:6px;margin-top:8px">'+liste.map(function(f){
          return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>Niveau '+grand(f.level)+'</span><span style="display:flex;gap:6px">'+
            bouton('Équiper','window.__macguffinEquiperV1__(\''+html(f.uid)+'\')',!typesEquipes[type]&&slotsLibres>0)+
            bouton('Jeter','window.__macguffinJeterV1__(\''+html(f.uid)+'\')')+
          '</span></div>';
        }).join('')+'</div></div>';
    }).join('')+'</div>':'<div class="soreal-idle-note-v4">Aucun fragment en réserve.</div>');

    const perm=snap.permanent||{};
    const blocBonus='<h3 style="margin:16px 0 8px">Bonus permanents</h3><div class="soreal-idle-section-v8" style="margin:0"><div style="display:grid;gap:4px;font-size:13px">'+
      (snap.types||[]).map(function(t){
        const source=t.zone?(ZONES[t.zone]||t.zone):(TITANS[t.titan]||t.titan||'');
        return '<div style="display:flex;justify-content:space-between;gap:8px"><span>'+html(t.nom)+' <span style="color:#aeb5c8">('+html(source)+')</span></span><b>+'+pct(perm[t.id])+'</b></div>';
      }).join('')+
    '</div><div style="font-size:12px;color:#aeb5c8;margin-top:8px">Chaque Rebirth ajoute au bonus permanent de chaque fragment équipé : gain de base selon son niveau x ratio de temps du run (x2 avec un MacGuffin Muffin).</div></div>';

    const zc=snap.zoneCounter||{};
    const it=snap.itopod||{};
    const blocCompteurs='<h3 style="margin:16px 0 8px">Compteurs de drop</h3><div class="soreal-idle-section-v8" style="margin:0">'+
      '<div class="soreal-idle-note-v4">🗺️ Zone : '+(zc.type?html(ZONES[zc.zone]||zc.zone)+' → '+html(nomType(zc.type))+' : <b>'+grand(zc.kills)+' / '+grand(zc.required)+'</b> kills':'aucune zone à fragment en cours ('+grand(zc.required)+' kills par fragment)')+'</div>'+
      '<div class="soreal-idle-note-v4" style="margin-top:5px">🏢 ITOPOD : '+(it.enabled?'<b>'+grand(it.kills)+' / '+grand(it.required)+'</b> kills (fragment aléatoire)':'🔒 perk « MacGuffin ITOPOD Drops! » requise')+'</div>'+
      '<div style="font-size:12px;color:#aeb5c8;margin-top:6px">Le compteur de zone repart de zéro quand tu quittes la zone ; celui de l’ITOPOD est conservé.</div>'+
    '</div>';

    const bs=snap.bloodSpells||{};
    const maintenant=Date.now();
    const sort=function(cle,nom,texte){
      const s=bs[cle]||{};
      if(!s.unlocked)return '<div class="soreal-idle-section-v8" style="margin:0;opacity:.6"><b>'+nom+'</b><div style="font-size:12px;color:#aeb5c8;margin-top:5px">🔒 Perk ITOPOD requise.</div></div>';
      const attente=Math.max(0,nombre(s.readyAt)-maintenant);
      const pret=attente<=0&&entier(s.levelsPreview)>0&&equipes.length>0;
      return '<div class="soreal-idle-section-v8" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+nom+'</b><span>+'+entier(s.levelsPreview)+' niveau(x)</span></div>'+
        '<div style="font-size:12px;color:#aeb5c8;margin-top:5px">'+texte+' Minimum '+grand(s.minimum)+' Blood ; consomme tout le Blood.'+(attente>0?' Recharge : '+duree(attente/1000)+'.':'')+'</div>'+
        '<div style="margin-top:9px">'+bouton('Lancer','window.__macguffinSortV1__(\''+cle+'\')',pret)+'</div></div>';
    };
    const blocSorts='<h3 style="margin:16px 0 8px">Sorts de Blood</h3><div style="display:grid;gap:10px">'+
      sort('alpha','Blood MacGuffin α',(bs.alpha&&bs.alpha.firstSlot?'Monte le premier fragment équipé.':'Monte un fragment équipé au hasard.'))+
      sort('beta','Blood MacGuffin β','Monte tous les fragments équipés.')+
    '</div>';

    const sb=snap.slotBreakdown||{};
    const blocSlots='<h3 style="margin:16px 0 8px">Emplacements ('+entier(snap.slots)+' / '+entier(snap.maxSlots)+')</h3><div class="soreal-idle-section-v8" style="margin:0;font-size:13px;display:grid;gap:3px">'+
      [['Déblocage',sb.base,1],['Boutique EXP',sb.expShop,2],['Perks ITOPOD',sb.perks,3],['Quirks',sb.quirks,2],['Edgy Set',sb.edgySet,1],['Troll Challenge Evil (2e)',sb.trollEvil,1],['No Equipment Challenge Evil (5e)',sb.noEquipmentEvil,1],['4G’s Sellout Shop',sb.sellout,11]].map(function(l){
        return '<div style="display:flex;justify-content:space-between"><span>'+l[0]+'</span><b>'+entier(l[1])+' / '+l[2]+'</b></div>';
      }).join('')+'</div>';

    return H().entetePageIdleV28_(titre,'Équipe des fragments puis fais un Rebirth : chaque fragment équipé augmente définitivement son bonus. Fusionne les copies d’un même type pour monter son niveau (sans plafond).')+
      resume+blocEquipes+blocInventaire+blocBonus+blocCompteurs+blocSorts+blocSlots;
  }

  window.__SOREAL_IDLE_MACGUFFINS_V1__={page:page};
})();
