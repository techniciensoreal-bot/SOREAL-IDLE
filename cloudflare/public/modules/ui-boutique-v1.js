/*
 * SOREAL IDLE — Boutiques et achats (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_boutique_v1)return;
  REG.__chargé_ui_boutique_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function coutBaseEntrainementIdleV73_(){return REG.coutBaseEntrainementIdleV73_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function rendrePendingIdleV7_(){return REG.rendrePendingIdleV7_.apply(null,arguments);}
  function appliquerEtatEntrainementCibleIdleV115_(){return REG.appliquerEtatEntrainementCibleIdleV115_.apply(null,arguments);}
  function rafraichirEnergieEtBoutonsIdleV9_(){return REG.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function idleFastPendingV60_(){return REG.idleFastPendingV60_.apply(null,arguments);}
  function planifierEnvoiRapideIdleV60_(){return REG.planifierEnvoiRapideIdleV60_.apply(null,arguments);}
  function idleFastCountObjectV60_(){return REG.idleFastCountObjectV60_.apply(null,arguments);}
  function planifierRenduOptimisteIdleV60_(){return REG.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function articleApVisibleIdleV1_(){return REG.articleApVisibleIdleV1_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}

      function coutNiveauxIdleV7_(
        niveau,
        quantite
      ){
        let total=0;
        let niv=
          Math.max(
            1,
            Math.floor(
              idleNombre_(niveau)
            )
          );

        for(
          let i=0;
          i<quantite;
          i+=1
        ){
          total+=
            coutBaseEntrainementIdleV73_(
              REG.idleEtat
            )*
            niv;
          niv+=1;
        }

        return total;
      }

      function coutAchatsIdleV23_(
        j,
        type,
        source
      ){
        const q=
          idleEntier_(
            source&&source[type]
          );

        const niveauInitial=
          type==='force'
            ?idleEntier_(j.force)
            :type==='endurance'
              ?idleEntier_(j.endurance)
              :idleEntier_(j.organisation);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-82 */
        const envoyesAvant=
          idleEntier_(
            REG.idleAchatsEnvoyesV23[type]
          );

        const depart=
          source===REG.idleAchatsEnAttenteV7
            ?niveauInitial+envoyesAvant
            :niveauInitial;

        return coutNiveauxIdleV7_(
          depart,
          q
        );
      }

      function coutPendingIdleV7_(
        j,
        type
      ){
        return coutAchatsIdleV23_(
          j,
          type,
          REG.idleAchatsEnAttenteV7
        );
      }

      function coutEnvoyesIdleV23_(
        j,
        type
      ){
        return coutAchatsIdleV23_(
          j,
          type,
          REG.idleAchatsEnvoyesV23
        );
      }

      function energieReserveeIdleV23_(){
        if(!REG.idleEtat){
          return 0;
        }

        return (
          coutEnvoyesIdleV23_(
            REG.idleEtat,
            'force'
          ) +
          coutEnvoyesIdleV23_(
            REG.idleEtat,
            'endurance'
          ) +
          coutEnvoyesIdleV23_(
            REG.idleEtat,
            'organisation'
          ) +
          coutPendingIdleV7_(
            REG.idleEtat,
            'force'
          ) +
          coutPendingIdleV7_(
            REG.idleEtat,
            'endurance'
          ) +
          coutPendingIdleV7_(
            REG.idleEtat,
            'organisation'
          ) +
          Math.max(
            0,
            idleNombre_(
              REG.idleReserveAventureV23
            )
          )
        );
      }

      function viderFileAchatsIdleV7_(){
        if(
          REG.idleAchatEnCoursV5
        ){
          return;
        }

        if(
          REG.idleFastNetworkBusyV60
        ){
          setTimeout(
            viderFileAchatsIdleV7_,
            100
          );
          return;
        }

        const achats={
          force:
            idleEntier_(
              REG.idleAchatsEnAttenteV7.force
            ),
          endurance:
            idleEntier_(
              REG.idleAchatsEnAttenteV7.endurance
            ),
          organisation:
            idleEntier_(
              REG.idleAchatsEnAttenteV7.organisation
            )
        };

        const total=
          achats.force+
          achats.endurance+
          achats.organisation;

        if(total<=0){
          return;
        }

        REG.idleAchatEnCoursV5=true;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-85 */
        REG.idleAchatsEnvoyesV23={
          force:
            idleEntier_(achats.force),
          endurance:
            idleEntier_(achats.endurance),
          organisation:
            idleEntier_(achats.organisation)
        };

        REG.idleAchatsEnAttenteV7={
          force:0,
          endurance:0,
          organisation:0
        };

        rendrePendingIdleV7_();

        google.script.run
          .withSuccessHandler(function(res){
            REG.idleAchatEnCoursV5=false;

            REG.idleAchatsEnvoyesV23={
              force:0,
              endurance:0,
              organisation:0
            };

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-86 */
            if(
              res &&
              res.joueur
            ){
              appliquerEtatEntrainementCibleIdleV115_(
                res
              );
            }else{
              rafraichirEnergieEtBoutonsIdleV9_();
            }

            if(
              !res ||
              !res.ok
            ){
              toastIdleV5_(
                res &&
                res.message
                  ?res.message
                  :'Achat impossible.'
              );
            }

            if(
              REG.idleAchatsEnAttenteV7.force+
              REG.idleAchatsEnAttenteV7.endurance+
              REG.idleAchatsEnAttenteV7.organisation >
              0
            ){
              viderFileAchatsIdleV7_();
            }

            if(
              idleFastPendingV60_()
            ){
              planifierEnvoiRapideIdleV60_(35);
            }
          })
          .withFailureHandler(function(e){
            REG.idleAchatEnCoursV5=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-87 */
            REG.idleAchatsEnAttenteV7.force+=
              REG.idleAchatsEnvoyesV23.force;

            REG.idleAchatsEnAttenteV7.endurance+=
              REG.idleAchatsEnvoyesV23.endurance;

            REG.idleAchatsEnAttenteV7.organisation+=
              REG.idleAchatsEnvoyesV23.organisation;

            REG.idleAchatsEnvoyesV23={
              force:0,
              endurance:0,
              organisation:0
            };

            rendrePendingIdleV7_();

            toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur serveur.'
            );
          })
          .acheterEntrainementsSorealIdle(
            SOREAL_SESSION,
            achats
          );
      }

      let idleShopReconcileEnCoursV111=false;

      function idleShopPendingV111_(){
        return idleFastCountObjectV60_(
          REG.idleFastPendingV60.shop
        );
      }

      function appliquerEtatBoutiqueCibleIdleV111_(
        source
      ){
        if(!REG.idleEtat||!source)return;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-90 */
        const autoritaire=
          source.joueur &&
          typeof source.joueur==='object'
            ?source.joueur
            :source;

        [
          'energie',
          'energieMax',
          'productionSeconde',
          'puissance'
        ].forEach(function(cle){
          if(
            autoritaire &&
            autoritaire[cle]!==undefined
          ){
            REG.idleEtat[cle]=
              idleNombre_(
                autoritaire[cle]
              );
          }
        });

        if(source.pieces!==undefined){
          REG.idleEtat.pieces=
            Math.max(
              0,
              idleEntier_(source.pieces)
            );
        }

        if(source.ameliorations){
          REG.idleEtat.ameliorations=
            Object.assign(
              {},
              REG.idleEtat.ameliorations||{},
              source.ameliorations
            );
        }

        if(source.coutsBoutique){
          REG.idleEtat.coutsBoutique=
            Object.assign(
              {},
              REG.idleEtat.coutsBoutique||{},
              source.coutsBoutique
            );
        }

        if(!REG.idleEtat.bonusBoutique){
          REG.idleEtat.bonusBoutique={};
        }

        const meta=
          REG.idleEtat.boutiqueMeta||{};

        ['production','capacite','puissance']
          .forEach(function(type){
            if(
              meta[type] &&
              REG.idleEtat.ameliorations
            ){
              REG.idleEtat.bonusBoutique[type]=
                idleEntier_(
                  REG.idleEtat.ameliorations[type]
                )*
                idleNombre_(
                  meta[type].bonusParNiveau
                );
            }
          });

        planifierRenduOptimisteIdleV60_();
      }

      function demanderReconciliationBoutiqueIdleV111_(){
        REG.idleShopReconcileDemandeeV111=true;

        if(
          idleShopReconcileEnCoursV111 ||
          idleShopPendingV111_()>0 ||
          REG.idleFastNetworkBusyV60 ||
          !SOREAL_SESSION
        ){
          return;
        }

        REG.idleShopReconcileDemandeeV111=false;
        idleShopReconcileEnCoursV111=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleShopReconcileEnCoursV111=false;

            if(
              res&&res.ok&&
              idleShopPendingV111_()===0
            ){
              appliquerEtatBoutiqueCibleIdleV111_(
                res
              );
            }

            if(REG.idleShopReconcileDemandeeV111){
              setTimeout(
                demanderReconciliationBoutiqueIdleV111_,
                60
              );
            }
          })
          .withFailureHandler(function(){
            idleShopReconcileEnCoursV111=false;
          })
          .obtenirEtatBoutiqueSorealIdle(
            SOREAL_SESSION
          );
      }

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

      /*
       * Menu « Shop » (2026-09-25, Norman) : EXP Shop et Boutique AP, même visuel qu'avant, séparés par un onglet ; EXP Shop par défaut, un
       * clic pour passer de l'un à l'autre. L'onglet Boutique AP n'existe qu'une fois cette boutique débloquée (rien à deviner).
       */
      let idleShopOngletV1='exp';

      /* Le bouton « Shop » du menu prend la couleur de la boutique affichée (EXP cyan, AP mauve). */
      function couleurBoutonShopIdleV1_(){
        return idleShopOngletV1==='ap'?REG.IDLE_NAV_COULEURS_V1.sellout:REG.IDLE_NAV_COULEURS_V1.spendExp;
      }

      function changerOngletShopIdleV1_(onglet){
        idleShopOngletV1=String(onglet)==='ap'?'ap':'exp';
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
        const bouton=document.querySelector('.soreal-idle-nav-v28 [data-menu-id-v1="shop"]');
        if(bouton)bouton.style.setProperty('--nav-color',couleurBoutonShopIdleV1_());
      }

      /* Le cadre de titre d'abord, les onglets juste dessous (Norman, 2026-10-30) : les barres du haut ne doivent jamais recouvrir un bouton (modules/entete-menu-v1.js). */
      function barreSousEnteteIdleV1_(barre,contenu){
        if(!barre)return contenu;
        try{
          const t=document.createElement('template');t.innerHTML=contenu;
          const tete=t.content.querySelector('.soreal-idle-page-head-v28');
          if(tete){tete.insertAdjacentHTML('afterend',barre);return t.innerHTML;}
        }catch(_e){}
        return barre+contenu;
      }

      function pageShopIdleV1_(j){
        const expOk=menuDisponibleIdleV28_('spendExp',j);
        const apOk=menuDisponibleIdleV28_('sellout',j);
        let onglet=idleShopOngletV1==='ap'?'ap':'exp';
        if(onglet==='ap'&&!apOk)onglet='exp';
        if(onglet==='exp'&&!expOk&&apOk)onglet='ap';
        const boutons=[];
        /*
         * Couleurs d'origine conservées (Norman : « le shop AP devait garder ses couleurs mauves, et son bouton aussi ») : la page du menu ne
         * connaît plus que « shop » (cyan) ; chaque boutique repose donc sa propre couleur (--nav-color) et son onglet porte la sienne.
         */
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        const contenuBoutique=onglet==='ap'
          ?'<div class="soreal-idle-shop-ap-v1" style="--nav-color:'+REG.IDLE_NAV_COULEURS_V1.sellout+'">'+pageSelloutShopIdleV1_(j)+'</div>'
          :'<div class="soreal-idle-shop-exp-v1" style="--nav-color:'+REG.IDLE_NAV_COULEURS_V1.spendExp+'">'+pageSpendExpIdleV1_(j)+'</div>';
        const pointExp=B&&expOk&&typeof window.__SOREAL_IDLE_EXP_ACHATS_V1__==='function'&&B.boutiqueNonVue('exp',window.__SOREAL_IDLE_EXP_ACHATS_V1__(j))?B.point('Nouveaux achats'):'';
        const pointAp=B&&apOk&&B.boutiqueNonVue('ap',achatsApParCategorieIdleV1_(j))?B.point('Nouveaux achats'):'';
        if(expOk)boutons.push('<button type="button" class="soreal-idle-collection-tab-v1 soreal-idle-shop-onglet-v1'+(onglet==='exp'?' active':'')+'" style="--onglet-couleur:'+REG.IDLE_NAV_COULEURS_V1.spendExp+'" onclick="window.__changerOngletShopIdleV1__(\'exp\')">✨ EXP Shop'+pointExp+'</button>');
        if(apOk)boutons.push('<button type="button" class="soreal-idle-collection-tab-v1 soreal-idle-shop-onglet-v1'+(onglet==='ap'?' active':'')+'" style="--onglet-couleur:'+REG.IDLE_NAV_COULEURS_V1.sellout+'" onclick="window.__changerOngletShopIdleV1__(\'ap\')">🛍️ Boutique AP'+pointAp+'</button>');
        return barreSousEnteteIdleV1_(boutons.length>1?'<div class="soreal-idle-collection-tabs-v1">'+boutons.join('')+'</div>':'',contenuBoutique);
      }

      function pageSpendExpIdleV1_(j){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.pageSpendExpIdleV1_==='function'){
          return api.pageSpendExpIdleV1_(j);
        }
        return '';
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-307 */
      const IDLE_SELLOUT_TRADUCTIONS_V210={
        energyPotionAlpha:{name:'Potion d’énergie α',effect:'Double la puissance d’Énergie pendant 60 minutes, même à travers plusieurs Rebirths. Se cumule avec la Potion d’énergie β.'},
        energyPotionBeta:{name:'Potion d’énergie β',effect:'Double la puissance d’Énergie jusqu’au prochain Rebirth. Se cumule avec la Potion d’énergie α.'},
        energyPotionDelta:{name:'Potion d’énergie δ',effect:'Double la puissance d’Énergie pendant 24 heures, même à travers plusieurs Rebirths. Ajoute du temps au compteur de la Potion d’énergie α.'},
        magicPotionAlpha:{name:'Potion de magie α',effect:'Double la puissance de Magie pendant 60 minutes, même à travers plusieurs Rebirths. Se cumule avec la Potion de magie β.'},
        magicPotionBeta:{name:'Potion de magie β',effect:'Double la puissance de Magie jusqu’au prochain Rebirth. Se cumule avec la Potion de magie α.'},
        magicPotionDelta:{name:'Potion de magie δ',effect:'Double la puissance de Magie pendant 24 heures, même à travers plusieurs Rebirths. Ajoute du temps au compteur de la Potion de magie α.'},
        resource3PotionAlpha:{name:'Potion de Ressource 3 α',effect:'Triple la puissance de Ressource 3 pendant 60 minutes, même à travers plusieurs Rebirths. Se cumule avec la Potion de Ressource 3 β.'},
        resource3PotionBeta:{name:'Potion de Ressource 3 β',effect:'Double la puissance de Ressource 3 jusqu’au prochain Rebirth. Se cumule avec la Potion de Ressource 3 α.'},
        resource3PotionDelta:{name:'Potion de Ressource 3 δ',effect:'Triple la puissance de Ressource 3 pendant 24 heures, même à travers plusieurs Rebirths. Ajoute du temps au compteur de la Potion de Ressource 3 α.'},
        energyBarBar:{name:'Barre de barres d’énergie',effect:'Double tes barres d’Énergie pendant 60 minutes, même à travers plusieurs Rebirths.'},
        magicBarBar:{name:'Barre de barres de magie',effect:'Double tes barres de Magie pendant 60 minutes, même à travers plusieurs Rebirths.'},
        macguffinMuffin:{name:'Muffin MacGuffin',effect:'Double pendant 24 heures le bonus obtenu des MacGuffins lors d’un Rebirth. Le bonus s’applique à au moins un Rebirth, même si les 24 heures sont dépassées.'},

        icarusFertilizer1:{name:'Engrais maison d’Icarus Proudbottom (x1)',effect:'Accorde +50 % lors de la récolte ou de la consommation d’un fruit d’Yggdrasil. Chaque tas vaut pour un fruit.'},
        icarusFertilizer10:{name:'Engrais maison d’Icarus Proudbottom (x10)',effect:'Même effet que l’engrais à l’unité, par lot de 10.'},
        icarusFertilizer100:{name:'Engrais maison d’Icarus Proudbottom (x100)',effect:'Même effet que l’engrais à l’unité, par lot de 100.'},
        littleBluePill1000:{name:'Petite pilule bleue (x1 000)',effect:'Double le gain de PP dans l’ITOPOD. Chaque pilule dure pendant un kill.'},
        littleBluePill10000:{name:'Petite pilule bleue (x10 000)',effect:'Même effet que la petite pilule bleue, par lot de 10 000.'},
        littleBluePill100000:{name:'Petite pilule bleue (x100 000)',effect:'Même effet que la petite pilule bleue, par lot de 100 000.'},
        beastButter1:{name:'Beurre de la Bête (x1)',effect:'Double la récompense de QP de ta prochaine quête.'},
        beastButter10:{name:'Beurre de la Bête (x10)',effect:'Double la récompense de QP des prochaines quêtes concernées, par lot de 10.'},
        beastButter100:{name:'Beurre de la Bête (x100)',effect:'Double la récompense de QP des prochaines quêtes concernées, par lot de 100.'},
        luckyCharm:{name:'Porte-bonheur',effect:'Double les chances de drop en Adventure pendant 30 minutes, même à travers plusieurs Rebirths. Se cumule avec les autres effets de loot.'},
        superLuckyCharm:{name:'Super porte-bonheur',effect:'Double les chances de drop en Adventure pendant 12 heures, même à travers plusieurs Rebirths. Se cumule avec les autres effets de loot.'},
        mayoInfuser:{name:'Infuseur de mayo',effect:'Double la vitesse de génération de Mayo pendant 24 heures. Affecte aussi les récompenses de fruits.'},
        regularBlackPens:{name:'Stylos noirs ordinaires (x25)',effect:'Ajoute 2 tiers à la prochaine carte générée. Cet effet ne peut pas être désactivé.'},

        improvedLootFilter:{name:'Filtre de butin amélioré',effect:'Permet d’utiliser la liste d’objets comme filtre de butin personnalisé et de filtrer chaque objet individuellement.'},
        extraInventorySpace:{name:'Espace d’inventaire supplémentaire',effect:'Ajoute 1 emplacement d’inventaire à chaque achat. Peut être acheté plusieurs fois, jusqu’à 166 emplacements supplémentaires.'},
        autoMergeBoostTimers:{name:'Réduction Auto Merge / Auto Boost',effect:'Réduit de 50 % le temps de l’Auto Boost et de l’Auto Merge.'},
        instaTrainingCap:{name:'Plafond d’entraînement instantané',effect:'Assigne presque immédiatement 6 Énergies, une à chacun des entraînements, après chaque Rebirth.'},
        customEnergyMagicButtons:{name:'Boutons % personnalisés Énergie/Magie',effect:'Débloque un jeu de boutons % personnalisés pour les entrées Énergie et Magie, calculés sur le plafond total.'},
        moreCustomEnergyMagicButtons:{name:'Plus de boutons % Énergie/Magie',effect:'Débloque un second jeu de boutons % personnalisés pour les entrées Énergie et Magie.'},
        yggdrasilHarvestLight:{name:'Alerte de récolte Yggdrasil',effect:'Fait s’illuminer le menu Yggdrasil lorsqu’un fruit est totalement mûr et prêt à être mangé ou récolté.'},
        dailySpinTimeBank:{name:'Banque de 7 jours pour la roue journalière',effect:'Étend la durée maximale mise en réserve par la roue journalière de 36 heures à 7 jours.'},
        loadoutSlot:{name:'Emplacement de configuration',effect:'Ajoute un emplacement de configuration.'},
        extraBeardSlot:{name:'Emplacement de barbe supplémentaire',effect:'Ajoute une barbe pour Beards of Power. Le premier emplacement coûte moins cher.'},
        filterBoostsIntoCube:{name:'Envoyer les boosts filtrés dans le Cube de l’infini',effect:'Les boosts filtrés sont fusionnés dans le Cube de l’infini. Les boosts appliqués ainsi ne sont pas recyclés.'},
        lazyItopodFloorShifter:{name:'Réglage automatique de l’étage ITOPOD',effect:'Vérifie ton étage optimal après chaque kill et ajuste automatiquement l’étage de l’ITOPOD.'},

        extraAccessorySlot1:{name:'Emplacement d’accessoire supplémentaire',effect:'Ajoute 1 emplacement d’accessoire.'},
        daycareSpeedBoost:{name:'Accélération de la garderie',effect:'Les objets placés en garderie gagnent leurs niveaux 10 % plus vite.'},
        extraAccessorySlot2:{name:'Encore un emplacement d’accessoire',effect:'Ajoute encore 1 emplacement d’accessoire. Oui, encore.'},
        diggerSlots:{name:'Emplacements Gold Digger',effect:'Ajoute 1 emplacement de Digger. Le premier coûte moins cher.'},
        macguffinSlot:{name:'Emplacement MacGuffin',effect:'Ajoute 1 emplacement MacGuffin. Les deux premiers coûtent moins cher.'},
        questReminder:{name:'Rappel de quête',effect:'Fait s’illuminer le menu Questing lorsqu’une quête est prête à être rendue.'},
        fasterQuesting:{name:'Quêtes plus rapides',effect:'Permet de gagner les Major Quests 20 % plus vite.'},
        extendedQuestBank:{name:'Banque de quêtes étendue',effect:'Augmente le plafond de Major Quests de 10 à 50.'},
        extraAccessorySlot3:{name:'Un autre emplacement d’accessoire (bis)',effect:'Ajoute encore 1 emplacement d’accessoire.'},
        customIdleEnergyMagicButtons:{name:'Boutons % Idle Énergie/Magie',effect:'Débloque des boutons % personnalisés pour les entrées Idle Énergie et Magie, calculés sur les ressources Idle totales.'},
        autoNuker:{name:'Nuke automatique',effect:'Lance automatiquement un Nuke sur les boss 10 secondes après chaque Rebirth, puis toutes les minutes.'},
        extraAccessorySlot4:{name:'Encore encore un emplacement d’accessoire',effect:'Ajoute 1 emplacement d’accessoire. Fais-nous confiance : ils serviront tous.'},

        nguCapModifier:{name:'Modificateur de plafond NGU',effect:'Débloque un réglage permettant de choisir le pourcentage du plafond injecté avec le bouton de plafond NGU.'},
        daycareKittyArt:{name:'Apparences du chat de la garderie',effect:'Débloque plusieurs apparences du chat de la garderie. Clique sur le chat pour parcourir les apparences débloquées.'},
        customResource3Button:{name:'Bouton % personnalisé Ressource 3',effect:'Débloque un bouton personnalisé de pourcentage du plafond pour Ressource 3.'},
        anotherCustomResource3Button:{name:'Autre bouton % Ressource 3',effect:'Débloque un second bouton personnalisé de pourcentage du plafond pour Ressource 3.'},
        customIdleResource3Button:{name:'Bouton % Idle Ressource 3',effect:'Débloque un bouton % Idle personnalisé pour Ressource 3.'},
        resource3NameRandomizer:{name:'Nom aléatoire de Ressource 3',effect:'Débloque un réglage qui change aléatoirement le nom de Ressource 3 à chaque Rebirth, parmi plus de 200 noms.'},
        fasterWishes:{name:'Wishes plus rapides',effect:'Accélère les Wishes de 25 %.'},
        inventoryMergeSlots:{name:'Emplacements de fusion d’inventaire',effect:'Débloque un emplacement supplémentaire de fusion d’inventaire.'},
        adventureLight:{name:'Alerte Adventure',effect:'Fait s’illuminer le bouton Adventure lorsque tu es dans une Safe Zone.'},
        adventureAdvancer:{name:'Avancement Adventure',effect:'Au bout de 20 secondes d’un Rebirth, te déplace vers la zone normale la plus avancée que tu peux atteindre.'},
        goToQuestZoneButton:{name:'Bouton « Aller à la zone de quête »',effect:'Débloque un bouton qui t’envoie directement dans la zone Adventure de ta quête.'},

        extraDeckSize:{name:'Taille de deck supplémentaire',effect:'Augmente la taille du deck pour pouvoir conserver davantage de cartes.'},
        mayoGenerator:{name:'Générateur de mayo',effect:'Permet de faire fonctionner un générateur de Mayo supplémentaire et augmente la vitesse de génération de Mayo de 2 % par emplacement.'},
        extraTagSlot:{name:'Emplacement de tag supplémentaire',effect:'Débloque un emplacement de tag supplémentaire pour les cartes afin de favoriser celles que tu veux obtenir.'},
        extraAccessorySlotEvil:{name:'Emplacement d’accessoire supplémentaire',effect:'Ajoute 1 emplacement d’accessoire.'},
        extraAccessorySlot5:{name:'Emplacement d’accessoire supplémentaire',effect:'Ajoute 1 emplacement d’accessoire.'},

        heartRed:{name:'Mon cœur rouge <3',effect:'Au niveau 100, son bonus complet de +10 % EXP s’applique sans devoir l’équiper.'},
        heartYellow:{name:'Mon cœur jaune <3',effect:'Au niveau 100, son bonus complet de +20 % AP s’applique sans devoir l’équiper.'},
        heartBrown:{name:'Mon cœur brun <3',effect:'Au niveau 100, chaque 10e caca appliqué à un fruit ne consomme pas de caca.'},
        heartGreen:{name:'Mon cœur vert <3',effect:'Au niveau 100, tu gagnes les Perk Points 20 % plus vite dans l’ITOPOD.'},
        heartBlue:{name:'Mon cœur bleu <3',effect:'Au niveau 100, les effets de tous les consommables sont améliorés de 10 %.'},
        heartPurple:{name:'Mon cœur violet <3',effect:'Au niveau 100, les MacGuffins tombent 20 % plus souvent.'},
        heartOrange:{name:'Mon cœur orange <3',effect:'Au niveau 100, les quêtes rapportent 20 % de QP supplémentaires.'},
        heartGrey:{name:'Mon cœur gris <3',effect:'Au niveau 100, les Hacks sont 25 % plus rapides.'},
        heartPink:{name:'Mon cœur rose <3',effect:'Au niveau 100, tu gagnes un emplacement de Wish.'},
        heartRainbow:{name:'Mon cœur arc-en-ciel',effect:'Au niveau 100, la vitesse de génération des Cartes et de Mayo augmente de 10 %.'},

        exp200:{name:'200 EXP',effect:'Ajoute 200 EXP à dépenser dans la Boutique EXP.'},
        exp500:{name:'500 EXP',effect:'Ajoute 500 EXP à dépenser dans la Boutique EXP.'},
        exp2000:{name:'2 000 EXP',effect:'Ajoute 2 000 EXP à dépenser dans la Boutique EXP.'},
        pp25:{name:'25 PP',effect:'Ajoute 25 PP à dépenser dans le menu Perks de l’ITOPOD.'},
        pp100:{name:'100 PP',effect:'Ajoute 100 PP à dépenser dans le menu Perks de l’ITOPOD.'},
        pp500:{name:'500 PP',effect:'Ajoute 500 PP à dépenser dans le menu Perks de l’ITOPOD.'}
      };

      function traductionSelloutIdleV210_(item){
        const t=IDLE_SELLOUT_TRADUCTIONS_V210[String(item&&item.id||'')]||null;
        return {
          name:t&&t.name?t.name:String(item&&item.name||'Objet'),
          effect:t&&t.effect?t.effect:String(item&&item.effect||'')
        };
      }

      /*
       * Images de la Boutique AP (Norman, 2026-10-04 : « les mêmes images que sur la page 4G's Sellout Shop »). Les 71 PNG (46x46) de la page wiki https://ngu-idle.fandom.com/wiki/4G%27s_Sellout_Shop sont dans
       * public/shop/ ; l'association article -> image est celle de la page (certains articles partagent la même : engrais, pilules, boutons %, emplacements d'accessoire).
       */
      const IDLE_SHOP_IMAGES_V1={"energyPotionAlpha":"energy-potion-alpha","energyPotionBeta":"energy-potion-beta","energyPotionDelta":"energy-potion-delta","magicPotionAlpha":"magic-potion-alpha","magicPotionBeta":"magic-potion-beta","magicPotionDelta":"magic-potion-delta","resource3PotionAlpha":"resource-3-potion-alpha","resource3PotionBeta":"resource-3-potion-beta","resource3PotionDelta":"resource-3-potion-delta","energyBarBar":"energy-bar-bar","magicBarBar":"magic-bar-bar","macguffinMuffin":"macguffin-muffin","icarusFertilizer1":"fertilizer","icarusFertilizer10":"fertilizer","icarusFertilizer100":"fertilizer","littleBluePill1000":"little-blue-pill","littleBluePill10000":"little-blue-pill","littleBluePill100000":"little-blue-pill","beastButter1":"beast-butter","beastButter10":"beast-butter","beastButter100":"beast-butter","luckyCharm":"lucky-charm","superLuckyCharm":"super-lucky-charm","mayoInfuser":"mayo-infuser","regularBlackPens":"regular-black-pens","improvedLootFilter":"improved-loot-filter","extraInventorySpace":"extra-inventory-space","autoMergeBoostTimers":"merge-and-boost-timers","instaTrainingCap":"insta-training-cap","customEnergyMagicButtons":"percent-button","moreCustomEnergyMagicButtons":"percent-button-2","yggdrasilHarvestLight":"yggdrasil-harvest-light","dailySpinTimeBank":"daily-spin-bank","loadoutSlot":"loadout-slot","extraBeardSlot":"extra-beard-slot","filterBoostsIntoCube":"infinity-cube-filter","lazyItopodFloorShifter":"lazy-itopod-floor-shifter","extraAccessorySlot1":"extra-accessory-slot","daycareSpeedBoost":"daycare-speed-bonus","extraAccessorySlot2":"extra-accessory-slot-2","diggerSlots":"digger-slot","macguffinSlot":"macguffin-slot","questReminder":"quest-reminder","fasterQuesting":"faster-questing","extendedQuestBank":"extended-quest-bank","extraAccessorySlot3":"extra-accessory-slot","customIdleEnergyMagicButtons":"percent-button","autoNuker":"auto-nuker","extraAccessorySlot4":"extra-accessory-slot-2","nguCapModifier":"ngu-cap-modifier","daycareKittyArt":"daycare-kitty-art","customResource3Button":"percent-button","anotherCustomResource3Button":"percent-button-2","customIdleResource3Button":"percent-button-3","resource3NameRandomizer":"resource-3-name-randomizer","fasterWishes":"faster-wishes","inventoryMergeSlots":"inventory-merge-slots","adventureLight":"adventure-light","adventureAdvancer":"adventure-advancer","goToQuestZoneButton":"go-to-quest-zone","extraAccessorySlotEvil":"extra-accessory-slot-2","extraDeckSize":"extra-deck-size","mayoGenerator":"mayo-generator","extraTagSlot":"extra-tag-slot","extraAccessorySlot5":"extra-accessory-slot-2","heartRed":"119-my-red-heart","heartYellow":"129-my-yellow-heart","heartBrown":"162-my-brown-heart","heartGreen":"171-my-green-heart","heartBlue":"196-my-blue-heart","heartPurple":"212-my-purple-heart","heartOrange":"293-my-orange-heart","heartGrey":"297-my-grey-heart","heartPink":"344-my-pink-heart","heartRainbow":"390-my-rainbow-heart","exp200":"200-exp","exp500":"500-exp","exp2000":"2000-exp","pp25":"25-pp","pp100":"100-pp","pp500":"500-pp"};

      function imageArticleShopIdleV1_(id){
        const nom=IDLE_SHOP_IMAGES_V1[String(id||'')];
        return nom?'<img class="soreal-idle-shop-img-v1" src="/shop/'+nom+'.png" alt="" width="46" height="46" loading="eager" decoding="sync" onerror="this.remove()">':'';
      }

      /* Les rendus de la boutique repartent de zéro à chaque tick : on charge une fois pour toutes les images, qui sortent ensuite du cache du navigateur sans attente ni clignotement. */
      let idleShopImagesPrechargeesV1=false;

      function prechargerImagesShopIdleV1_(){
        if(idleShopImagesPrechargeesV1||typeof Image!=='function')return;
        idleShopImagesPrechargeesV1=true;
        Array.from(new Set(Object.keys(IDLE_SHOP_IMAGES_V1).map(function(k){return IDLE_SHOP_IMAGES_V1[k];}))).forEach(function(nom){
          try{const im=new Image();im.decoding='async';im.src='/shop/'+nom+'.png';}catch(e){}
        });
      }

      /* Achats visibles de la boutique AP, par rayon (catégorie) : point rouge « nouveau » (modules/boutique-nouveautes-v1.js). */
      function achatsApParCategorieIdleV1_(j){
        const shop=(j&&j.systemes&&j.systemes.selloutShop)||{};
        const sortie={};
        (Array.isArray(shop.catalog)?shop.catalog:[]).filter(function(item){return articleApVisibleIdleV1_(j,item);}).forEach(function(item){
          const cle=item.category||'autre';
          if(!sortie[cle])sortie[cle]=[];
          sortie[cle].push(item.id);
        });
        return sortie;
      }

      function pageSelloutShopIdleV1_(j){
        prechargerImagesShopIdleV1_();
        const systemes=(j&&j.systemes)||{};
        const shop=systemes.selloutShop||{catalog:[],purchases:{}};
        /* ANTI-SPOIL (règle n°2) : un achat dont l'effet n'est pas encore actif n'apparaît pas (ni cadenas, ni prix). */
        const catalogue=(Array.isArray(shop.catalog)?shop.catalog:[]).filter(function(item){return articleApVisibleIdleV1_(j,item);});
        const ap=idleEntier_(systemes.currencies&&systemes.currencies.ap||0);

        const parCategorie={};
        catalogue.forEach(function(item){
          const cle=item.category||'autre';
          if(!parCategorie[cle])parCategorie[cle]=[];
          parCategorie[cle].push(item);
        });

        const visibles=Object.keys(REG.IDLE_SELLOUT_SHOP_CATEGORIES_V1).filter(function(cle){
          return (parCategorie[cle]||[]).length>0;
        });
        const onglet=visibles.indexOf(REG.idleApOngletV1)!==-1?REG.idleApOngletV1:(visibles[0]||'');
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        const parRayonAp=B?achatsApParCategorieIdleV1_(j):{};
        if(B&&onglet)B.marquerRayon('ap',parRayonAp,onglet);

        const carte=function(item){
          const auMax=item.nextCost==null;
          const effetActif=item.effectActive===true;
          const abordable=effetActif&&!auMax&&ap>=item.nextCost;
          const texte=traductionSelloutIdleV210_(item);
          /* Norman (2026-10-15) : « (x22) » laissait croire qu'un achat donne 22 emplacements. Les emplacements d'inventaire (dont le maximum, 166, est déjà écrit dans leur description) montrent « 22/166 achetés » ; les autres achats « acheté 22 fois » (jamais leur maximum : règle n°2). */
          const compteur=item.purchased>0
            ?(item.id==='extraInventorySpace'?' · '+idleEntier_(item.purchased)+'/166 achetés':' · acheté '+idleEntier_(item.purchased)+' fois')
            :'';
          return '<div class="soreal-idle-exp-stat-v210">'+
            '<div class="soreal-idle-exp-stat-head-v210"><span>'+imageArticleShopIdleV1_(item.id)+idleHtml_(texte.name)+compteur+(B&&B.estNouveau('ap',item.id)?B.point('Nouvel achat'):'')+'</span></div>'+
            '<div class="soreal-idle-exp-help-v210">'+idleHtml_(texte.effect)+'</div>'+
            (auMax?'':'<div class="soreal-idle-exp-prix-v1"><span class="soreal-idle-exp-prix-ligne-v1"><i>Prix</i><b>'+formatGrandNombreIdleV70_(item.nextCost)+' AP</b></span></div>')+
            (auMax
                ?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>'
                :'<div class="soreal-idle-exp-actions-v210">'+
                  '<button type="button" class="soreal-idle-exp-buy-v210" '+(abordable?'':'disabled ')+
                  'onclick="window.__actionMetaIdleV130__({action:\'sellShopBuy\',itemId:\''+idleHtml_(item.id)+'\'})">'+
                  'Acheter</button>'+
                '</div>')+
          '</div>';
        };

        /* Rayon complet (Norman, 2026-10-05) : petit V vert quand tout ce que le rayon contient est acheté au maximum ; un nouvel article visible le fait disparaître. */
        const rayonCompletAp=function(cle){
          const liste=parCategorie[cle]||[];
          return liste.length>0&&liste.every(function(item){return item.nextCost==null;});
        };
        const onglets=visibles.map(function(cle){
          const actif=cle===onglet;
          return '<button type="button" class="soreal-idle-exp-tab-v212'+(actif?' actif':'')+'" aria-pressed="'+actif+'" onclick="window.__ongletApShopIdleV1__(\''+cle+'\')">'+idleHtml_(REG.IDLE_SELLOUT_SHOP_CATEGORIES_V1[cle])+(B&&B.rayonNonVu('ap',parRayonAp,cle)?B.point('Nouveaux achats dans ce rayon'):'')+(rayonCompletAp(cle)?'<span class="soreal-idle-rayon-complet-v1" title="Tout est acheté dans ce rayon">✔</span>':'')+'</button>';
        }).join('');

        const api=window.__SOREAL_IDLE_META_V130__;
        const css=api&&typeof api.boutiqueCssIdleV1_==='function'?api.boutiqueCssIdleV1_():'';

        return entetePageIdleV28_(
          "🛍️ La Boutique de Norman & Sébastien",
          "Dépense tes AP ici. Aucun achat ne coûte d’argent réel."
        )+
        '<style>'+css+'</style>'+
        '<div class="soreal-idle-exp-shop-v213" data-rayon="'+onglet+'">'+
          '<div class="soreal-idle-exp-awning-v213" aria-hidden="true"></div>'+
          '<div class="soreal-idle-exp-balance-v210"><span>💠 Ta caisse · AP disponible</span><b>'+formatGrandNombreIdleV70_(ap)+'</b></div>'+
          '<div class="soreal-idle-exp-aisles-v213"><span>🧭 Rayons</span><span class="soreal-idle-exp-open-v213">● OUVERT</span></div>'+
          '<div class="soreal-idle-exp-tabs-v212" role="tablist">'+onglets+'</div>'+
          '<div class="soreal-idle-exp-shelves-v213">'+(onglet?(parCategorie[onglet]||[]).map(carte).join(''):'')+'</div>'+
        '</div>';
      }

  Object.assign(REG,{
    energieReserveeIdleV23_:energieReserveeIdleV23_,
    idleShopPendingV111_:idleShopPendingV111_,
    appliquerEtatBoutiqueCibleIdleV111_:appliquerEtatBoutiqueCibleIdleV111_,
    demanderReconciliationBoutiqueIdleV111_:demanderReconciliationBoutiqueIdleV111_,
    couleurBoutonShopIdleV1_:couleurBoutonShopIdleV1_,
    changerOngletShopIdleV1_:changerOngletShopIdleV1_,
    pageShopIdleV1_:pageShopIdleV1_,
    pageSpendExpIdleV1_:pageSpendExpIdleV1_,
    pageBoutiqueIdleV28_:pageBoutiqueIdleV28_,
    achatsApParCategorieIdleV1_:achatsApParCategorieIdleV1_,
    pageSelloutShopIdleV1_:pageSelloutShopIdleV1_
  });
})();
