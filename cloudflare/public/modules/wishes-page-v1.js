/*
 * SOREAL IDLE — page Wishes (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_WISHES_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_WISHES_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function libelleRessourceMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.libelleRessourceMetaIdleV130_.apply(null,arguments);}
      function dureeLongueNguIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.dureeLongueNguIdleV1_.apply(null,arguments);}
      function capRessourceMetaIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.capRessourceMetaIdleV1_.apply(null,arguments);}

      /*
       * Wishes (2026-09-23) : jusqu'à 4 slots, chacun avec son souhait et sa propre allocation
       * Energy/Magic/R3. Toutes les valeurs (slots débloqués, durées, plafonds) viennent du
       * snapshot serveur j.systemes.wishSlots ; les boutons 0/25/50/100 % visent la part libre
       * du cap (le serveur plafonne de toute façon à ce que le joueur possède).
       */
      function pageWishesIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('🌠 Wishes','Chaque slot travaille sur son propre souhait avec sa propre allocation d\'Énergie, de Magie et de Ressource 3. Répartir ses ressources sur plusieurs souhaits est très efficace : doubler une ressource n\'accélère un souhait que d\'environ 12,5 %.');
        const sys=systemeMetaParIdIdleV130_(j,'wishes');
        const snap=(j&&j.systemes)||{};
        const ws=snap.wishSlots||null;
        if(!sys||!sys.state||!sys.state.unlocked||!ws){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const pistes=Array.isArray(sys.tracks)?sys.tracks:[];
        /* Wiki : chaque souhait exige une difficulté (Evil ou Sadistic) ; à une difficulté plus basse la liste est vide. */
        if(!pistes.length)return titre+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Aucun souhait n’est disponible à cette difficulté pour l’instant.</div>';
        const systemes=Array.isArray(snap.systems)?snap.systems:[];
        const slots=Array.isArray(ws.slots)?ws.slots:[];
        const ressources=['energy','magic','r3'];
        function capDe(r){return capRessourceMetaIdleV1_(snap,r);}
        function alloueAilleurs(r,indexSlot){
          let total=0;
          systemes.forEach(function(x){
            if(!x||x.id==='wishes')return;
            total+=Math.max(0,H.idleNombre_(x.state&&x.state.allocation&&x.state.allocation[r]||0));
          });
          slots.forEach(function(sl){
            if(sl.index!==indexSlot)total+=Math.max(0,H.idleNombre_(sl.allocation&&sl.allocation[r]));
          });
          return total;
        }
        const occupes={};
        slots.forEach(function(sl){if(sl.unlocked&&sl.wish)occupes[sl.wish]=sl.index;});
        const src=ws.sources||{};
        const resume=
          '<div class="soreal-idle-summary-grid-v28">'+
            '<div class="soreal-idle-summary-v28">🎰 Slots débloqués<b>'+H.idleEntier_(ws.slotCount)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">⏳ Temps minimum par niveau<b>'+dureeLongueNguIdleV1_(ws.minSecondsPerLevel)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">💨 Vitesse des souhaits<b>x'+H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(ws.speedMultiplier)),2)+'</b></div>'+
          '</div>'+
          /* ANTI-SPOIL : seules les sources de slot déjà obtenues sont citées (jamais celles qui restent à débloquer). */
          '<div class="soreal-idle-note-v4" style="margin:8px 0 12px">Sources des slots obtenues : base'+(src.trollEvil?' · Troll Challenge Evil':'')+(src.pinkHeart?' · My Pink Heart':'')+(src.quirk?' · Quirk « A Wish Slot! »':'')+'</div>';
        function carte(sl){
          const numero=sl.index+1;
          if(!sl.unlocked)return '';/* ANTI-SPOIL : un slot encore verrouillé n'apparaît pas (ni cadenas, ni sources). */
          const options=['<option value=""'+(sl.wish?'':' selected')+'>— Aucun souhait —</option>'].concat(pistes.filter(function(p){
            const st=p.state||{};
            const fini=H.idleNombre_(st.level)>=H.idleNombre_(p.levels);
            const ailleurs=occupes[p.id]!==undefined&&occupes[p.id]!==sl.index;
            return p.id===sl.wish||(!fini&&!ailleurs);
          }).map(function(p){
            const st=p.state||{};
            return '<option value="'+H.idleHtml_(p.id)+'"'+(p.id===sl.wish?' selected':'')+'>#'+H.idleHtml_(p.id)+' · '+H.idleHtml_(p.name)+' ('+H.idleEntier_(st.level)+'/'+H.idleEntier_(p.levels)+')</option>';
          })).join('');
          const choix='<select style="width:100%;margin-top:6px" onchange="window.__actionMetaIdleV130__({action:\'setWishSlot\',slot:'+sl.index+',wish:this.value})">'+options+'</select>';
          const pct=Math.max(0,Math.min(100,H.idleNombre_(sl.progress)*100));
          const etat=!sl.wish
            ?'Aucun souhait dans ce slot.'
            :sl.done
              ?'✔ Souhait terminé : choisis-en un autre.'
              :(sl.secondsRemaining!==null&&sl.secondsRemaining!==undefined
                ?'Niveau suivant dans ≈ '+dureeLongueNguIdleV1_(sl.secondsRemaining)+' (niveau complet : '+dureeLongueNguIdleV1_(sl.secondsPerLevel)+')'
                :'Alloue de l\'Énergie, de la Magie ET de la Ressource 3 pour progresser.');
          const allocations=ressources.map(function(r){
            const verrou=(r==='magic'&&!ws.magicUnlocked)||(r==='r3'&&!ws.r3Unlocked);
            if(verrou)return '';/* ANTI-SPOIL : une ressource non débloquée n'apparaît pas. */
            const dispo=Math.max(0,capDe(r)-alloueAilleurs(r,sl.index));
            const courantSlot=Math.floor(H.idleNombre_(sl.allocation&&sl.allocation[r]));
            const argsVoeu=sl.index+',\''+r+'\',';
            const finVoeu=','+courantSlot+','+Math.floor(dispo)+')';
            /* + − MAX comme dans les autres menus (Input partagé) ; MAX place tout ce qui est libre pour ce souhait. */
            const boutons=
              '<button type="button" class="soreal-idle-expand-button-v25" title="Retirer la valeur de Input" onclick="window.__SOREAL_IDLE_ALLOC_V1__.ajusterVoeu('+argsVoeu+'\'moins\''+finVoeu+'">−</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" title="Placer la valeur de Input" onclick="window.__SOREAL_IDLE_ALLOC_V1__.ajusterVoeu('+argsVoeu+'\'plus\''+finVoeu+'">+</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" title="Placer toute la ressource libre" onclick="window.__SOREAL_IDLE_ALLOC_V1__.ajusterVoeu('+argsVoeu+'\'max\''+finVoeu+'">Max</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" title="Retirer toute l’énergie de cette barre" onclick="window.__SOREAL_IDLE_ALLOC_V1__.ajusterVoeu('+argsVoeu+'\'zero\''+finVoeu+'">0</button>';
            return '<div style="margin-top:6px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span>'+libelleRessourceMetaIdleV130_(r)+'</span><b>'+H.formatGrandNombreIdleV70_(H.idleNombre_(sl.allocation&&sl.allocation[r]))+'</b></div>'+
              '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">'+boutons+'</div></div>';
          }).join('');
          return '<div class="soreal-idle-section-v8" style="margin:0">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>🌠 Slot '+numero+(sl.wish?' · '+H.idleHtml_(sl.name):'')+'</b>'+(sl.wish?'<span>Niv. '+H.idleEntier_(sl.level)+' / '+H.idleEntier_(sl.maxLevel)+'</span>':'')+'</div>'+
            (sl.wish?'<div style="font-size:14px;color:#aeb5c8;margin-top:4px">'+H.idleHtml_(sl.effect)+'</div>':'')+
            choix+
            '<div class="soreal-idle-bt-track-v120" style="margin-top:8px"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;background:#c084fc;transition:none"></div></div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">'+etat+'</div>'+
            allocations+
          '</div>';
        }
        const liste=pistes.map(function(p){
          const st=p.state||{};
          return '<div style="font-size:14px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.08)"><b>#'+H.idleHtml_(p.id)+' · '+H.idleHtml_(p.name)+'</b> · Niv. '+H.idleEntier_(st.level)+' / '+H.idleEntier_(p.levels)+(p.active?' · ▶️ en cours':'')+'<br><span style="color:#aeb5c8">'+H.idleHtml_(p.effect||'')+'</span></div>';
        }).join('');
        const cadresVoeux=window.__SOREAL_IDLE_ALLOC_V1__
          ?'<div class="soreal-idle-bt-toolbar-v120">'+window.__SOREAL_IDLE_ALLOC_V1__.entree('sorealIdleGenInputV1')+
            ressources.filter(function(r){return !((r==='magic'&&!ws.magicUnlocked)||(r==='r3'&&!ws.r3Unlocked));}).map(function(r){return window.__SOREAL_IDLE_ALLOC_V1__.cadres(r,'wishes');}).join('')+'</div>'
          :'';
        return titre+resume+cadresVoeux+
          '<div style="display:grid;gap:10px">'+slots.map(carte).join('')+'</div>'+
          '<details class="soreal-idle-section-v8" style="margin-top:12px"><summary><b>Tous les souhaits ('+pistes.length+')</b></summary>'+liste+'</details>';
      }

  window.__SOREAL_IDLE_WISHES_PAGE_V1__={
    pageWishesIdleV1_:pageWishesIdleV1_
  };
})();
