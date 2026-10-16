/*
 * SOREAL IDLE — page Cartes (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_CARDS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_CARDS_PAGE_V1__)return;

      function dureeLongueNguIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.dureeLongueNguIdleV1_.apply(null,arguments);}

      /*
       * Cards et Mayo (2026-09-23, wiki page Cards) : deck, mayo, générateurs,
       * tags et tiers. Tout vient du snapshot serveur (j.systemes.cards,
       * idle-cards-v1.js::idleCardsSnapshotV1) ; aucune formule recalculée ici.
       */
      function pageCardsIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('🃏 Cards','Une carte arrive toutes les heures tant que le deck n\'est pas plein. Lance une carte en payant son coût en mayo : son bonus devient permanent (conservé au Rebirth). Les cartes protégées ne peuvent être ni lancées ni jetées.');
        const c=(j&&j.systemes&&j.systemes.cards)||null;
        if(!c||!c.unlocked){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const act=function(extra){
          return 'window.__actionMetaV47__('+H.idleHtml_(JSON.stringify(Object.assign({action:'cards'},extra)))+')';
        };
        const pct=function(v,d){return H.formatGrandNombreIdleV70_(H.idleNombre_(v),d===undefined?2:d)+' %';};
        const fois=function(v){return 'x'+H.formatGrandNombreIdleV70_(H.idleNombre_(v),4);};
        const deck=Array.isArray(c.deck)?c.deck:[];
        const types=Array.isArray(c.types)?c.types:[];
        const mayos=Array.isArray(c.mayoTypes)?c.mayoTypes:[];
        const nomMayo={};
        mayos.forEach(function(m){nomMayo[m.id]=m.nom;});
        const actifs=mayos.filter(function(m){return m.active;}).length;
        const tagues=types.filter(function(t){return t.tagged;}).length;

        const resume=[
          ['Deck',H.idleEntier_(deck.length)+' / '+H.idleEntier_(c.deckSize)],
          ['Prochaine carte',c.deckFull?'Deck plein':dureeLongueNguIdleV1_(c.secondsToNextCard)],
          ['Vitesse des cartes',fois(c.cardSpeed)],
          ['Vitesse de la mayo',fois(c.mayoSpeed)],
          ['Générateurs',actifs+' / '+H.idleEntier_(c.generatorSlots)],
          ['Tags',tagues+' / '+H.idleEntier_(c.tagSlots)+' · effet '+pct(c.tagEffectPct)],
          ['Coût en mayo',H.idleEntier_(c.mayoCostRange&&c.mayoCostRange[0])+' à '+H.idleEntier_(c.mayoCostRange&&c.mayoCostRange[1])],
          ['Regular Black Pens',H.idleEntier_(c.blackPens)],
          ['Mayo Infuser',H.idleNombre_(c.infuserSeconds)>0?dureeLongueNguIdleV1_(c.infuserSeconds):'inactif']
        ];
        if(c.chonkers)resume.push(['Prochain Big Chonker',c.deckFull?'Deck plein':dureeLongueNguIdleV1_(c.secondsToNextChonker)]);
        const grille='<div class="soreal-idle-summary-grid-v28">'+resume.map(function(x){return '<div class="soreal-idle-summary-v28">'+x[0]+'<b>'+x[1]+'</b></div>';}).join('')+'</div>';

        const blocMayo=mayos.map(function(m){
          const p=Math.max(0,Math.min(100,H.idleNombre_(m.progress)*100));
          return '<div class="soreal-idle-section-v8" style="margin:0">'+
            '<div style="display:flex;justify-content:space-between;gap:8px"><b>🥫 '+H.idleHtml_(m.nom)+'</b><span>'+H.formatGrandNombreIdleV70_(H.idleEntier_(m.stored))+'</span></div>'+
            '<div class="soreal-idle-bt-track-v120"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(p/100)+');transform-origin:left center;background:#eab308;transition:none"></div></div>'+
            '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:6px">'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="'+act({mode:'toggleGenerator',mayo:m.id})+'">'+(m.active?'⏸️ Arrêter le générateur':'▶️ Lancer un générateur')+'</button>'+
              '<span style="font-size:14px;color:#aeb5c8">'+(m.active?'1 mayo ≈ '+dureeLongueNguIdleV1_(m.secondsPerMayo):'générateur à l\'arrêt')+'</span>'+
            '</div></div>';
        }).join('');

        const blocTypes=types.map(function(t){
          return '<div class="soreal-idle-section-v8" style="margin:0">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+H.idleHtml_(t.code)+' · '+H.idleHtml_(t.nom)+'</b><span>Tier '+H.idleEntier_(t.tier)+'</span></div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Bonus accumulé : <b>+'+pct(t.totalPct)+'</b> ('+fois(t.multiplier)+') · chance d\'apparition '+pct(H.idleNombre_(t.chance)*100)+'</div>'+
            '<div style="margin-top:6px"><button type="button" class="soreal-idle-expand-button-v25" onclick="'+act({mode:'toggleTag',type:t.id})+'">'+(t.tagged?'🏷️ Retirer le tag':'🏷️ Tagger')+'</button></div>'+
          '</div>';
        }).join('');

        /* Les cartes sont DESSINÉES (modules/cartes-v1.js : cadre SVG, mayo, palier, type, effet, rareté ; illustration lue dans R2 idle/cartes/, vide tant qu'elle n'existe pas). Sans le module, repli sur l'ancien affichage texte. */
        const CV=window.__SorealCartesV1__;
        const blocDeck=deck.length?(CV?CV.defs()+'<div class="cv1-grille">':'<div style="display:grid;gap:10px">')+deck.map(function(k,i){
          const boutons='<div class="cv1-boutons">'+
            '<button type="button" class="soreal-idle-expand-button-v25" '+(k.canCast?'onclick="'+act({mode:'cast',cardId:k.id})+'"':'disabled')+'>✨ Lancer</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25" '+(k.protected?'disabled':'onclick="'+act({mode:'yeet',cardId:k.id})+'"')+'>🗑️ Jeter</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="'+act({mode:'protect',cardId:k.id})+'">'+(k.protected?'🔓 Déprotéger':'🔒 Protéger')+'</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25" '+(i>0?'onclick="'+act({mode:'move',cardId:k.id,index:i-1})+'"':'disabled')+'>⬆️</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25" '+(i<deck.length-1?'onclick="'+act({mode:'move',cardId:k.id,index:i+1})+'"':'disabled')+'>⬇️</button>'+
          '</div>';
          if(CV){
            const cout=Object.keys(k.mayo||{}).map(function(id){return H.idleEntier_(k.mayo[id])+' '+H.idleHtml_(nomMayo[id]||id);}).join(', ');
            return '<div class="cv1-case" title="'+H.idleHtml_('Coût : '+cout)+'">'+CV.carteSvg(k)+boutons+'</div>';
          }
          const cout=Object.keys(k.mayo||{}).map(function(id){return H.idleEntier_(k.mayo[id])+' '+H.idleHtml_(nomMayo[id]||id);}).join(', ');
          return '<div class="soreal-idle-section-v8" style="margin:0'+(k.chonker?';border:2px solid #eab308':'')+(k.theEnd?';border:2px solid #ff3b3b':'')+'">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+(k.protected?'🔒 ':'')+(k.theEnd?'THE END':(k.chonker?'🍔 Big Chonker · ':'')+H.idleHtml_(k.code)+' · '+H.idleHtml_(k.nom))+'</b>'+(k.theEnd?'':'<span>Tier '+H.idleEntier_(k.tier)+'</span>')+'</div>'+
            (k.theEnd?'':'<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Bonus <b>+'+pct(k.bonusPct,3)+'</b> · rareté '+H.idleHtml_(k.rarityLabel)+' ('+H.idleNombre_(k.rarity).toFixed(3).replace('.',',')+')</div>')+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">coût '+H.idleEntier_(k.mayoTotal)+' mayo : '+cout+'</div>'+boutons+'</div>';
        }).join('')+'</div>':'<div class="soreal-idle-section-v8" style="text-align:center;padding:18px">Deck vide : la première carte arrive dans '+dureeLongueNguIdleV1_(c.secondsToNextCard)+'.</div>';

        return titre+grille+
          '<h3 style="margin:16px 0 8px">Deck</h3>'+blocDeck+
          '<h3 style="margin:16px 0 8px">Mayo</h3><div style="font-size:14px;color:#aeb5c8;margin-bottom:6px">La production totale est partagée entre les générateurs actifs.</div><div style="display:grid;gap:10px">'+blocMayo+'</div>'+
          '<h3 style="margin:16px 0 8px">Types, tiers et tags</h3><div style="font-size:14px;color:#aeb5c8;margin-bottom:6px">Un type taggé apparaît plus souvent. Le tier s\'applique aux prochaines cartes de ce type.</div><div style="display:grid;gap:10px">'+blocTypes+'</div>';
      }

  window.__SOREAL_IDLE_CARDS_PAGE_V1__={
    pageCardsIdleV1_:pageCardsIdleV1_
  };
})();
