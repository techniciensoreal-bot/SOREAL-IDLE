/*
 * SOREAL IDLE — page Boutique (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Extrait tel quel (même code) ; les aides du monolithe sont lues à l'exécution par window.__SOREAL_IDLE_UI_PARTAGE_V1__
 * (jamais au chargement : ce module se charge AVANT le monolithe). Expose window.__SOREAL_IDLE_PAGE_BOUTIQUE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PAGE_BOUTIQUE_V1__)return;

      function entetePageIdleV28_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.entetePageIdleV28_.apply(null,arguments);}
      function idleEntier_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleEntier_.apply(null,arguments);}
      function idleHtml_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleHtml_.apply(null,arguments);}

      function rendreBoutiqueIdleV12_(j){
        const a=
          j&&j.ameliorations
            ?j.ameliorations
            :{
                production:0,
                capacite:0,
                puissance:0
              };

        const couts=
          j&&j.coutsBoutique
            ?j.coutsBoutique
            :{};

        const bonus=
          j&&j.bonusBoutique
            ?j.bonusBoutique
            :{
                production:0,
                capacite:0,
                puissance:0
              };

        const pieces=
          idleEntier_(
            j&&j.pieces
          );

        const items=[
          {
            type:'production',
            icon:'⚡',
            titre:'Production d’énergie',
            niveau:a.production,
            effet:'+'+
              idleEntier_(bonus.production)+
              ' énergie/sec',
            cout:couts.production
          },
          {
            type:'capacite',
            icon:'🔋',
            titre:'Capacité d’énergie',
            niveau:a.capacite,
            effet:'+'+
              idleEntier_(bonus.capacite)+
              ' énergie max',
            cout:couts.capacite
          },
          {
            type:'puissance',
            icon:'🔥',
            titre:'Puissance permanente',
            niveau:a.puissance,
            effet:'+'+
              idleEntier_(bonus.puissance)+
              ' puissance',
            cout:couts.puissance
          }
        ];

        return items
          .map(function(item){
            const cout=
              idleEntier_(
                item.cout
              );

            return `
              <div class="soreal-idle-shop-card-v12">
                <div>
                  <div class="soreal-idle-shop-title-v12">
                    ${item.icon}
                    ${idleHtml_(item.titre)}
                    · niv. ${idleEntier_(item.niveau)}
                  </div>
                  <div class="soreal-idle-shop-meta-v12">
                    Bonus total : ${idleHtml_(item.effet)}
                  </div>
                </div>

                <button
                  type="button"
                  class="soreal-idle-shop-buy-v12"
                  onclick="window.__acheterAmeliorationIdleV12__('${item.type}')"
                  ${pieces<cout?'disabled':''}
                >
                  ${cout} 🪙
                </button>
              </div>
            `;
          })
          .join('');
      }

      function pageBoutiqueIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '🪙 Améliorations permanentes',
            'Dépense tes pièces dans des bonus permanents.'
          )}

          <div class="soreal-idle-window-title-v31 gold">
            🪙 Or possédé
            <span class="soreal-idle-gold-total-v31">
              ${idleEntier_(j.pieces)}
            </span>
          </div>

          <div class="soreal-idle-shop-grid-v12">
            ${rendreBoutiqueIdleV12_(j)}
          </div>
        `;
      }

  window.__SOREAL_IDLE_PAGE_BOUTIQUE_V1__={
    pageBoutiqueIdleV28_:pageBoutiqueIdleV28_
  };
})();
