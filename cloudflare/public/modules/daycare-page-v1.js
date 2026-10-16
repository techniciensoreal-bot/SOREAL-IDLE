/*
 * SOREAL IDLE — page Garderie (Daycare) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_DAYCARE_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DAYCARE_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function actionMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_.apply(null,arguments);}
      function dureeLongueNguIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.dureeLongueNguIdleV1_.apply(null,arguments);}

      /*
       * Item Daycare (garderie du Daycare Kitty) : placer / reprendre des objets de l'inventaire,
       * progression, ETA et détail des bonus. Toutes les valeurs viennent du snapshot serveur
       * (j.systemes.daycare, calculé par idle-daycare-v1.js), jamais recalculées ici.
       */
      function pageDaycareIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('🛠️ Item Daycare','Le Daycare Kitty fait gagner des niveaux à tes objets avec le temps, même hors ligne. Un seul exemplaire de chaque objet ; niveau maximum 100. Un objet en garderie ne peut pas être fusionné ni équipé.');
        const s=systemeMetaParIdIdleV130_(j,'daycare');
        const d=(j&&j.systemes&&j.systemes.daycare)||null;
        if(!s||!s.state||!s.state.unlocked||!d){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const pct=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v)*100,2)+' %';};
        const objets=Array.isArray(d.items)?d.items:[];
        const libres=Math.max(0,H.idleEntier_(d.slots)-objets.length);
        const resume=
          '<div class="soreal-idle-summary-grid-v28">'+
            '<div class="soreal-idle-summary-v28">🎰 Slots<b>'+objets.length+' / '+H.idleEntier_(d.slots)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">⏳ Temps par niveau<b>×'+pct(d.timeFactor)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">💨 Vitesse<b>×'+pct(d.speedMultiplier)+'</b></div>'+
          '</div>';
        const tp=d.timeParts||{},sp=d.speedParts||{},ss=d.slotSources||{};
        const detail=
          '<details class="soreal-idle-section-v8" style="margin:0 0 10px"><summary><b>Détail des bonus</b></summary>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:6px">Réductions de temps (rétroactives) : Blind Normal ×'+pct(tp.blindNormal==null?1:tp.blindNormal)+' · Daycare Kitty\'s Blessing ×'+pct(tp.perks==null?1:tp.perks)+' · Daycare Speed Boost ×'+pct(tp.selloutSpeedBoost==null?1:tp.selloutSpeedBoost)+'</div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Vitesse (non rétroactive) : équipement ×'+pct(sp.gear||1)+' · Fibonacci ×'+pct(sp.fibonacci||1)+' · souhait ×'+pct(sp.wish||1)+' · Blind Evil ×'+pct(sp.blindEvil||1)+' · Blind Sadistic ×'+pct(sp.blindSadistic||1)+' · Digger ×'+pct(sp.digger||1)+' · Hack ×'+pct(sp.hack||1)+'</div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Slots : boutique EXP '+H.idleEntier_(ss.expShop||0)+'/3 · Blind Normal '+H.idleEntier_(ss.blindNormal||0)+'/1 · Troll Evil '+H.idleEntier_(ss.trollEvil||0)+'/1 · perk '+H.idleEntier_(ss.perk||0)+'/1 (6 au total)</div>'+
          '</details>';
        const enGarde=objets.length
          ?objets.map(function(x){
              const it=x.item||{};
              const avance=Math.max(0,Math.min(100,H.idleNombre_(x.progress)*100));
              const eta=x.maxed
                ?'✔ Niveau 100 atteint'
                :'prochain niveau dans '+dureeLongueNguIdleV1_(x.secondsToNextLevel)+' · niveau 100 dans '+dureeLongueNguIdleV1_(x.secondsToMax);
              return '<div class="soreal-idle-section-v8" style="margin:0">'+
                '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+H.idleHtml_(it.name||it.definitionId||'Objet')+'</b><span>Niv. '+H.idleEntier_(it.level)+' (+'+H.idleEntier_(x.levelsGained)+')</span></div>'+
                '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">Base : 1 niveau / '+H.formatGrandNombreIdleV70_(x.baseHours,2)+' h · effectif : 1 niveau / '+dureeLongueNguIdleV1_(H.idleNombre_(x.effectiveHoursPerLevel)*3600)+' · '+eta+'</div>'+
                '<div class="soreal-idle-bt-track-v120"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(avance/100)+');transform-origin:left center;background:#84cc16;transition:none"></div></div>'+
                '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__daycareIdleV1__(\'daycareRemove\',\''+H.idleHtml_(it.id)+'\')">📤 Reprendre</button></div>'+
              '</div>';
            }).join('')
          :'<div class="soreal-idle-note-v4">Aucun objet en garderie.</div>';
        const sac=Array.isArray(d.inventory)?d.inventory:[];
        const placables=sac.filter(function(o){return o.baseHours!=null;});
        const inconnus=sac.filter(function(o){return o.baseHours==null;});
        const listeSac=placables.length
          ?placables.map(function(o){
              const bloque=libres<=0||o.alreadyInDaycare||H.idleEntier_(o.level)>=100;
              const raison=o.alreadyInDaycare?'déjà en garderie':H.idleEntier_(o.level)>=100?'niveau max':libres<=0?'aucun slot libre':'';
              return '<div class="soreal-idle-section-v8" style="margin:0;display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap">'+
                '<span><b>'+H.idleHtml_(o.name)+'</b> · Niv. '+H.idleEntier_(o.level)+' · 1 niveau / '+H.formatGrandNombreIdleV70_(o.baseHours,2)+' h</span>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(bloque?'disabled title="'+H.idleHtml_(raison)+'"':'onclick="window.__daycareIdleV1__(\'daycarePlace\',\''+H.idleHtml_(o.id)+'\')"')+'>📥 Placer</button>'+
              '</div>';
            }).join('')
          :'<div class="soreal-idle-note-v4">Aucun objet plaçable dans ton sac (les objets équipés doivent d\'abord être déséquipés).</div>';
        const noteInconnus=inconnus.length
          ?'<div class="soreal-idle-note-v4" style="margin-top:8px">'+inconnus.length+' objet(s) sans taux de garderie connu : '+inconnus.map(function(o){return H.idleHtml_(o.name);}).join(', ')+'.</div>'
          :'';
        return titre+resume+detail+
          '<h3 style="margin:16px 0 8px">En garderie</h3><div style="display:grid;gap:10px">'+enGarde+'</div>'+
          '<h3 style="margin:16px 0 8px">Sac</h3><div style="display:grid;gap:8px">'+listeSac+'</div>'+noteInconnus;
      }

      function daycareIdleV1_(action,itemId){
        actionMetaIdleV130_({action:String(action),itemId:String(itemId)});
      }
      window.__daycareIdleV1__=daycareIdleV1_;

  window.__SOREAL_IDLE_DAYCARE_PAGE_V1__={
    pageDaycareIdleV1_:pageDaycareIdleV1_
  };
})();
