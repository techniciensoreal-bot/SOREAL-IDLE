/*
 * SOREAL IDLE — pages Collection (sets, créatures) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Extrait tel quel (même code) ; les aides du monolithe sont lues à l'exécution par window.__SOREAL_IDLE_UI_PARTAGE_V1__
 * (jamais au chargement : ce module se charge AVANT le monolithe). Expose window.__SOREAL_IDLE_PAGE_COLLECTION_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PAGE_COLLECTION_V1__)return;

      function aventureMetaIdleV47_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.aventureMetaIdleV47_.apply(null,arguments);}
      function catalogueSetsCollectionIdleV164_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.catalogueSetsCollectionIdleV164_.apply(null,arguments);}
      function idleEntier_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleEntier_.apply(null,arguments);}
      function iconeObjetAdventureIdleV138_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.iconeObjetAdventureIdleV138_.apply(null,arguments);}
      function idleHtml_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleHtml_.apply(null,arguments);}
      function libelleRecompenseSetAdventureIdleV163_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.libelleRecompenseSetAdventureIdleV163_.apply(null,arguments);}
      function urlBossR2IdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.urlBossR2IdleV1_.apply(null,arguments);}
      function urlMobR2IdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.urlMobR2IdleV1_.apply(null,arguments);}
      function idleNombre_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleNombre_.apply(null,arguments);}
      function formatGrandNombreIdleV70_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.formatGrandNombreIdleV70_.apply(null,arguments);}
      function attrHistoireVoixIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.attrHistoireVoixIdleV1_.apply(null,arguments);}
      function sansBaliseVoixIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.sansBaliseVoixIdleV1_.apply(null,arguments);}
      function entetePageIdleV28_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.entetePageIdleV28_.apply(null,arguments);}
      function labelCapaciteBossIdleV70_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.labelCapaciteBossIdleV70_.apply(null,arguments);}

      function construireCarteBossIdleV91_(
        b
      ){
        /* R2 d'abord (voir markupImageCombatIdleV61_) : l'ancienne image du Drive ne sert plus qu'à défaut. */
        const image=
          urlBossR2IdleV1_(
            b&&b.numero
          ) ||
          '';

        const caps=
          Array.isArray(
            b&&b.capacites
          )
            ?b.capacites
            :[];

        return `
          <div
            class="soreal-idle-modal-card-v63 soreal-idle-boss-card-modal-v91"
            role="dialog"
            aria-modal="true"
          >
            <div class="soreal-idle-modal-top-v63">
              <div class="soreal-idle-modal-icon-v63">👹</div>

              <div class="soreal-idle-modal-title-v63">
                #${idleEntier_(b.numero)}
                · ${idleHtml_(b.nom||'Boss')}
              </div>

              <div class="soreal-idle-modal-gain-v63">
                ${
                  b.mortVivant
                    ?'☠️ MORT-VIVANT'
                    :b.etat==='vaincu'
                      ?'✅ DÉJÀ VAINCU'
                      :'⚔️ BOSS ACTUEL'
                }
              </div>
            </div>

            <div class="soreal-idle-modal-body-v63">
              <div class="soreal-idle-boss-card-image-v91">
                ${
                  image
                    ?'<img src="'+
                      idleHtml_(image)+
                      '" alt="'+
                      idleHtml_(b.nom||'Boss')+
                      '">'
                    :'<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:80px">👹</div>'
                }
              </div>

              <div class="soreal-idle-boss-card-stats-v91">
                <div class="soreal-idle-boss-card-stat-v91">
                  ❤️
                  <strong>${formatGrandNombreIdleV70_(b.pv)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  ⚔️ ATTAQUE
                  <strong>${formatGrandNombreIdleV70_(b.attaque)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  XP BASE
                  <strong>${formatGrandNombreIdleV70_(b.xp)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  NIVEAU
                  <strong>${idleEntier_(b.niveauRequis)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  PUISSANCE EST.
                  <strong>~${formatGrandNombreIdleV70_(b.puissanceMinimum)}</strong>
                </div>
              </div>

              <div id="sorealIdleBossModalStoryV206_${idleEntier_(b.numero)}" class="soreal-idle-boss-story-v91"${b.histoire?' data-soreal-tts-chronique="'+idleHtml_(b.nom||'Boss')+'"'+attrHistoireVoixIdleV1_(b.histoire):''}>
                ${idleHtml_(
                  sansBaliseVoixIdleV1_(b.histoire)||
                  'Aucune archive n’existe encore pour ce boss.'
                )}
              </div>
              ${b.histoire
                ?'<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="sorealIdleBossModalStoryV206_'+idleEntier_(b.numero)+'">🔊 Lire la chronique</button>'
                :''}

              <div class="soreal-idle-boss-powers-v91">
                ${
                  caps.length
                    ?caps.map(
                        function(cap){
                          return (
                            '<span class="soreal-idle-boss-skill-chip-v70">'+
                            idleHtml_(
                              labelCapaciteBossIdleV70_(
                                cap
                              )
                            )+
                            '</span>'
                          );
                        }
                      ).join('')
                    :'<span class="soreal-idle-boss-skill-chip-v70">Aucun pouvoir spécial</span>'
                }
              </div>
            </div>

            <div class="soreal-idle-modal-actions-v63">
              <button
                type="button"
                class="soreal-idle-modal-button-v63 cancel"
                onclick="window.__fermerCarteBossIdleV91__()"
              >
                Fermer
              </button>

              <button
                type="button"
                class="soreal-idle-modal-button-v63 confirm"
                onclick="window.__combattreDepuisCarteBossIdleV91__(${idleEntier_(b.numero)})"
                ${b.selectionnable?'':'disabled'}
              >
                ${
                  b.etat==='vaincu'
                    ?'☠️ Mort jusqu’à la Renaissance'
                    :'⚔️ Combattre'
                }
              </button>
            </div>
          </div>
        `;
      }

      function rendreCollectionCreaturesIdleV1_(entrees,vide){
        /* ANTI-SPOIL (AGENTS.md règle n°2) : seules les entrées découvertes sont affichées, jamais de carte « ??? ». */
        entrees=entrees.filter(function(e){return e&&e.decouvert;});
        if(!entrees.length){
          return '<div class="soreal-idle-empty-v10">'+idleHtml_(vide)+'</div>';
        }

        return '<div class="soreal-idle-bestiary-grid-v110">'+
          entrees.map(function(e){
            if(!e||!e.decouvert)return '';

            /*
             * 2026-09-25 (Norman) : les cartes de boss n'affichent que l'image (plein cadre, sans bords) et le nom centré ; un clic ouvre
             * les statistiques et la chronique (ouvrirBossCollectionIdleV1_).
             */
            if(idleEntier_(e.numero)>0){
              const imageBoss=urlBossR2IdleV1_(idleEntier_(e.numero));
              return '<div class="soreal-idle-bestiary-card-v110 boss-card" role="button" tabindex="0" '+
                'onclick="window.__ouvrirBossCollectionIdleV1__('+idleEntier_(e.numero)+')" '+
                'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__ouvrirBossCollectionIdleV1__('+idleEntier_(e.numero)+')}">'+
                '<div class="soreal-idle-bestiary-image-v120"><img src="'+idleHtml_(imageBoss)+'" alt="'+idleHtml_(e.nom||'Boss')+'" loading="lazy" '+
                  'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
                  '<div class="soreal-idle-bestiary-emoji-v110" style="display:none">'+idleHtml_(e.emoji||'👹')+'</div></div>'+
                '<div class="soreal-idle-bestiary-name-v110 boss-name">'+idleHtml_(e.nom||'Boss')+'</div>'+
              '</div>';
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-172 */
            const image=
              idleEntier_(e.numero)>0
                ?urlBossR2IdleV1_(idleEntier_(e.numero))
                :(e.zone
                  ?urlMobR2IdleV1_(e.zone,e.boss,e.index,e.nom)
                  :String(e.image||''));

            return `
              <div class="soreal-idle-bestiary-card-v110${e.rare?' rare-found':''}">
                ${
                  image
                    ?'<div class="soreal-idle-bestiary-image-v120"><img src="'+idleHtml_(image)+'" alt="'+idleHtml_(e.nom||'Créature')+'" '+
                      'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
                      '<div class="soreal-idle-bestiary-emoji-v110" style="display:none">'+idleHtml_(e.emoji||'👾')+'</div></div>'
                    :'<div class="soreal-idle-bestiary-emoji-v110">'+idleHtml_(e.emoji||'👾')+'</div>'
                }
                <div class="soreal-idle-bestiary-name-v110">
                  ${idleHtml_(e.nom||'Créature')}
                </div>
                <div class="soreal-idle-bestiary-type-v110">
                  ${idleHtml_(e.categorie||'Créature')}
                </div>
                <div class="soreal-idle-bestiary-meta-v110">
                  ${idleNombre_(e.pv)>0?'❤️ '+formatGrandNombreIdleV70_(e.pv):''}
                  ${idleNombre_(e.attaque)>0?'· ⚔️ '+formatGrandNombreIdleV70_(e.attaque)+' attaque':''}
                  ${idleNombre_(e.defense)>0?'· 🛡️ '+formatGrandNombreIdleV70_(e.defense)+' défense':''}
                  ${idleNombre_(e.regen)>0?'· 💚 '+formatGrandNombreIdleV70_(e.regen)+' regen':''}
                  ${idleNombre_(e.cadence)>0?'· ⏱️ '+idleNombre_(e.cadence)+' s':''}
                  ${e.typeMob&&e.typeMob!=='normal'?'· '+idleHtml_(e.typeMob):''}
                  ${e.numero>0?'· ✨ '+idleEntier_(e.xp)+' EXP':''}
                  · 👁️ ${idleEntier_(e.rencontres)} rencontre${idleEntier_(e.rencontres)>1?'s':''}
                </div>
                ${e.description
                  ?'<div id="'+
                    (idleEntier_(e.numero)>0
                      ?'sorealIdleCollectionBossStoryV206_'+idleEntier_(e.numero)
                      :'sorealIdleCollectionCreatureDescV206_'+idleEntier_(e.index))+
                    '" class="soreal-idle-bestiary-desc-v110"'+
                    (idleEntier_(e.numero)>0?' data-soreal-tts-chronique="'+idleHtml_(e.nom||'Boss')+'"'+attrHistoireVoixIdleV1_(e.description):'')+
                    '>'+idleHtml_(sansBaliseVoixIdleV1_(e.description))+'</div>'
                  :''}
                ${idleEntier_(e.numero)>0&&e.description
                  ?'<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="sorealIdleCollectionBossStoryV206_'+idleEntier_(e.numero)+'">🔊 Lire cette chronique</button>'
                  :''}
              </div>
            `;
          }).join('')+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-233 */
      function pageCollectionIdleV22_(j){
        return entetePageIdleV28_(
          '📚 Sets',
          'Progression réelle des sets NGU : chaque pièce doit atteindre le niveau 100 pour activer sa récompense de complétion.'
        )+rendreCollectionIdleV22_(j);
      }

      function rendreCollectionIdleV22_(j){
        const a=aventureMetaIdleV47_(j);
        const setCatalog=catalogueSetsCollectionIdleV164_(a);
        const itemCatalog=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const itemList=a&&a.itemList&&typeof a.itemList==='object'?a.itemList:{};
        const completed=a&&a.completedSets&&typeof a.completedSets==='object'?a.completedSets:{};
        const sets=Object.values(setCatalog).filter(function(setDef){
          const setId=String(setDef&&setDef.id||'');
          const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
          return slots.some(function(slot){
            const info=itemList[setId+':'+String(slot)];
            return Boolean(info&&info.seen);
          });
        });

        if(!sets.length){
          return '<div class="soreal-idle-empty-v10">Aucun set découvert pour l’instant. Les cases apparaîtront dès que tu trouveras la première pièce d’un set.</div>';
        }

        return sets.map(function(setDef){
          const setId=String(setDef&&setDef.id||'');
          const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
          const total=slots.length;
          let vus=0;
          let niveau100=0;
          let verts=0;

          const cartes=slots.map(function(slot){
            const definitionId=setId+':'+String(slot);
            const def=itemCatalog[definitionId]||{};
            const info=itemList[definitionId]||null;
            const vu=Boolean(info&&info.seen);
            const lvl=vu?idleEntier_(info.maxLevel):0;
            const lvl100=Boolean(info&&info.maxed);
            const vert=Boolean(info&&info.fullyMaxed);
            if(vu)vus+=1;
            if(lvl100)niveau100+=1;
            if(vert)verts+=1;

            const pseudo={
              set:setId,
              slot:def.slot||slot,
              name:def.name||definitionId,
              definitionId:definitionId,
              wikiItemId:def.wikiItemId||0,
              kind:'equipment',
              basePower:def.basePower||0,
              baseToughness:def.baseToughness||0
            };

            if(!vu)return '';
            return '<div class="soreal-idle-collection-slot-v32'+(vu?' found':'')+(vert?' maxed':'')+'">'+
              '<div style="font-size:20px">'+(vu?iconeObjetAdventureIdleV138_(pseudo):'❓')+'</div>'+
              '<div>'+(vu?idleHtml_(def.name||definitionId):'Inconnu')+'</div>'+
              (vu
                ?'<small>Niv. '+lvl+'/100'+
                  (vert?' · ✅ 100 %':lvl100?' · boosts à compléter':'')+
                '</small>'
                :'')+
            '</div>';
          }).join('');

          const completeCollection=Boolean(total>0&&verts===total);
          /* Bonus du set en évidence (2026-09-26, Norman) : cadre doré à obtenir, vert une fois obtenu (niveau 100 sur toutes les pièces). */
          const obtenu=Boolean(completed[setId]);
          const recompenseHtml=setDef.reward
            ?'<div class="soreal-idle-collection-bonus-v1'+(obtenu?' obtenu':'')+'">'+
                '<div class="titre">'+(obtenu?'✅ Bonus du set obtenu':'🎁 Bonus du set')+'</div>'+
                '<div class="texte">'+idleHtml_(libelleRecompenseSetAdventureIdleV163_(setDef.reward))+'</div>'+
                (obtenu?'':'<div class="condition">S’obtient quand les '+total+' pièces sont au niveau 100.</div>')+
              '</div>'
            :'';
          return '<div class="soreal-idle-collection-zone-v32">'+
            '<div class="soreal-idle-collection-zone-head-v32">'+
              '<div>'+
                '<div class="soreal-idle-collection-zone-name-v32">📚 '+idleHtml_(setDef.name||setId)+'</div>'+
                recompenseHtml+
                '<div class="soreal-idle-collection-reward-v32">'+
                  'Découverts : '+vus+' · Niveau 100 : '+niveau100+
                  ' · 100 % boosts : '+verts+
                '</div>'+
              '</div>'+
              '<div class="soreal-idle-collection-count-v32'+(completeCollection?' done':'')+'">'+
                verts+(completeCollection?' ✅':'')+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-collection-slots-v32">'+cartes+'</div>'+
          '</div>';
        }).join('');
      }

  window.__SOREAL_IDLE_PAGE_COLLECTION_V1__={
    rendreCollectionIdleV22_:rendreCollectionIdleV22_,
    rendreCollectionCreaturesIdleV1_:rendreCollectionCreaturesIdleV1_,
    pageCollectionIdleV22_:pageCollectionIdleV22_,
    construireCarteBossIdleV91_:construireCarteBossIdleV91_
  };
  Object.assign(window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={}),window.__SOREAL_IDLE_PAGE_COLLECTION_V1__);
})();
