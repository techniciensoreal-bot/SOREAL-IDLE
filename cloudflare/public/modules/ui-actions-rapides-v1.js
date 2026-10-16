/*
 * SOREAL IDLE — Actions rapides, lots et recyclage (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_actions_rapides_v1)return;
  REG.__chargé_ui_actions_rapides_v1=true;

  function idleFastCountObjectV60_(){return REG.idleFastCountObjectV60_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function normaliserCommandeCombatIdleV170_(){return REG.normaliserCommandeCombatIdleV170_.apply(null,arguments);}
  function rafraichirCommandesFightBossIdleV167_(){return REG.rafraichirCommandesFightBossIdleV167_.apply(null,arguments);}
  function idleServeurOccupeV60_(){return REG.idleServeurOccupeV60_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function demanderReconciliationBoutiqueIdleV111_(){return REG.demanderReconciliationBoutiqueIdleV111_.apply(null,arguments);}
  function idleShopPendingV111_(){return REG.idleShopPendingV111_.apply(null,arguments);}
  function appliquerEtatBoutiqueCibleIdleV111_(){return REG.appliquerEtatBoutiqueCibleIdleV111_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function objetsEncoreEnAttenteRecycleV38_(){return REG.objetsEncoreEnAttenteRecycleV38_.apply(null,arguments);}
  function programmerEnvoiRecycleV38_(){return REG.programmerEnvoiRecycleV38_.apply(null,arguments);}
  function annulerTimerCombatAutoIdleV30_(){return REG.annulerTimerCombatAutoIdleV30_.apply(null,arguments);}

      function conserverPositionIdleV24_(
        callback
      ){
        const x=
          window.scrollX||0;

        const y=
          window.scrollY||0;

        callback();

        requestAnimationFrame(function(){
          window.scrollTo(
            x,
            y
          );
        });
      }

      let idleFastSendTimerV60=null;

      let idleFastRetryTimerV60=null;

      let idleFastRenderRafV60=null;

      function idleFastPendingV60_(){
        return Boolean(
          REG.idleFastPendingV60.equip.length ||
          REG.idleFastPendingV60.fusion.length ||
          idleFastCountObjectV60_(
            REG.idleFastPendingV60.shop
          ) ||
          idleFastCountObjectV60_(
            REG.idleFastPendingV60.forge
          ) ||
          REG.idleFastPendingV60.bag>0 ||
          REG.idleFastPendingV60.combat!==null ||
          REG.idleFastPendingV60.autoBoss!==null ||
          REG.idleFastPendingV60.autoAdventure!==null ||
          REG.idleFastPendingV60.boss!==null ||
          REG.idleFastPendingV60.zone!==null
        );
      }

      function planifierRenduOptimisteIdleV60_(){
        if(
          idleFastRenderRafV60 ||
          !REG.idleEtat
        ){
          return;
        }

        idleFastRenderRafV60=
          requestAnimationFrame(
            function(){
              idleFastRenderRafV60=null;

              conserverPositionIdleV24_(
                function(){
                  rendreIdleEtat_({
                    ok:true,
                    joueur:REG.idleEtat
                  });
                }
              );
            }
          );
      }

      function planifierEnvoiRapideIdleV60_(
        delai
      ){
        if(idleFastSendTimerV60){
          return;
        }

        idleFastSendTimerV60=
          setTimeout(
            function(){
              idleFastSendTimerV60=null;
              envoyerProchaineActionRapideIdleV60_();
            },
            Math.max(
              35,
              idleEntier_(
                delai===undefined
                  ?70
                  :delai
              )
            )
          );
      }

      function remettreLotRapideIdleV60_(
        lot
      ){
        if(!lot)return;

        switch(lot.type){
          case 'equip':
            REG.idleFastPendingV60.equip=
              lot.payload.concat(
                REG.idleFastPendingV60.equip
              );
            break;

          case 'fusion':
            REG.idleFastPendingV60.fusion=
              lot.payload.concat(
                REG.idleFastPendingV60.fusion
              );
            break;

          case 'shop':
            Object.keys(lot.payload)
              .forEach(function(type){
                REG.idleFastPendingV60.shop[type]+=
                  idleEntier_(
                    lot.payload[type]
                  );
              });
            break;

          case 'forge':
            Object.keys(lot.payload)
              .forEach(function(slot){
                REG.idleFastPendingV60.forge[slot]+=
                  idleEntier_(
                    lot.payload[slot]
                  );
              });
            break;

          case 'bag':
            REG.idleFastPendingV60.bag+=
              idleEntier_(
                lot.payload
              );
            break;

          case 'combat':
            REG.idleFastPendingV60.combat=
              normaliserCommandeCombatIdleV170_(
                lot.payload
              );
            break;

          case 'autoBoss':
            REG.idleFastPendingV60.autoBoss=
              Boolean(
                lot.payload
              );
            break;

          case 'autoAdventure':
            REG.idleFastPendingV60.autoAdventure=
              {
                actif:
                  Boolean(
                    lot.payload&&
                    lot.payload.actif
                  ),
                zoneId:
                  idleEntier_(
                    lot.payload&&
                    lot.payload.zoneId
                  )
              };
            break;

          case 'boss':
            REG.idleFastPendingV60.boss=
              idleEntier_(
                lot.payload
              );
            break;

          case 'zone':
            REG.idleFastPendingV60.zone=
              idleEntier_(
                lot.payload
              );
            break;
        }
      }

      function extraireLotRapideIdleV60_(){
        if(
          REG.idleFastPendingV60.equip.length
        ){
          const lot=
            REG.idleFastPendingV60.equip.splice(
              0,
              REG.idleFastPendingV60.equip.length
            );

          return {
            type:'equip',
            payload:lot
          };
        }

        if(
          REG.idleFastPendingV60.fusion.length
        ){
          const lot=
            REG.idleFastPendingV60.fusion.splice(
              0,
              REG.idleFastPendingV60.fusion.length
            );

          return {
            type:'fusion',
            payload:lot
          };
        }

        if(
          idleFastCountObjectV60_(
            REG.idleFastPendingV60.shop
          )
        ){
          const lot=
            Object.assign(
              {},
              REG.idleFastPendingV60.shop
            );

          REG.idleFastPendingV60.shop={
            production:0,
            capacite:0,
            puissance:0
          };

          return {
            type:'shop',
            payload:lot
          };
        }

        if(
          idleFastCountObjectV60_(
            REG.idleFastPendingV60.forge
          )
        ){
          const lot=
            Object.assign(
              {},
              REG.idleFastPendingV60.forge
            );

          REG.idleFastPendingV60.forge={
            tete:0,
            torse:0,
            bottes:0,
            arme:0,
            bijou1:0,
            bijou2:0
          };

          return {
            type:'forge',
            payload:lot
          };
        }

        if(
          REG.idleFastPendingV60.bag>0
        ){
          const q=
            REG.idleFastPendingV60.bag;

          REG.idleFastPendingV60.bag=0;

          return {
            type:'bag',
            payload:q
          };
        }

        if(
          REG.idleFastPendingV60.combat!==null
        ){
          const valeur=
            REG.idleFastPendingV60.combat;

          REG.idleFastPendingV60.combat=null;

          return {
            type:'combat',
            payload:valeur
          };
        }

        if(
          REG.idleFastPendingV60.autoBoss!==null
        ){
          const valeur=
            REG.idleFastPendingV60.autoBoss;

          REG.idleFastPendingV60.autoBoss=null;

          return {
            type:'autoBoss',
            payload:valeur
          };
        }

        if(
          REG.idleFastPendingV60.autoAdventure!==null
        ){
          const valeur=
            REG.idleFastPendingV60.autoAdventure;

          REG.idleFastPendingV60.autoAdventure=null;

          return {
            type:'autoAdventure',
            payload:valeur
          };
        }

        if(
          REG.idleFastPendingV60.boss!==null
        ){
          const valeur=
            REG.idleFastPendingV60.boss;

          REG.idleFastPendingV60.boss=null;

          return {
            type:'boss',
            payload:valeur
          };
        }

        if(
          REG.idleFastPendingV60.zone!==null
        ){
          const valeur=
            REG.idleFastPendingV60.zone;

          REG.idleFastPendingV60.zone=null;

          return {
            type:'zone',
            payload:valeur
          };
        }

        return null;
      }

      function terminerLotRapideIdleV60_(
        lot,
        res
      ){
        REG.idleFastNetworkBusyV60=false;
        if(REG.idleCombatLotEnVolV1){
          REG.idleCombatLotEnVolV1=false;
          setTimeout(function(){try{rafraichirCommandesFightBossIdleV167_();}catch(_e){}},0);
        }

        if(
          !res ||
          !res.ok
        ){
          if(
            idleServeurOccupeV60_(
              res
            )
          ){
            remettreLotRapideIdleV60_(
              lot
            );

            if(idleFastRetryTimerV60){
              clearTimeout(
                idleFastRetryTimerV60
              );
            }

            idleFastRetryTimerV60=
              setTimeout(
                function(){
                  idleFastRetryTimerV60=null;
                  envoyerProchaineActionRapideIdleV60_();
                },
                220
              );

            return;
          }

          messageFlottantIdleV32_(
            '❌ '+
            (
              res&&res.message
                ?res.message
                :'Une action n’a pas pu être enregistrée.'
            )
          );

          if(lot&&lot.type==='shop'){
            demanderReconciliationBoutiqueIdleV111_();
          }
        }else if(
          lot&&
          lot.type==='shop'
        ){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-91 */
          if(idleShopPendingV111_()===0){
            appliquerEtatBoutiqueCibleIdleV111_(
              res
            );
          }
        }

        if(
          idleFastPendingV60_()
        ){
          planifierEnvoiRapideIdleV60_(35);
        }else if(
          lot&&
          lot.type==='shop'
        ){
          if(REG.idleShopReconcileDemandeeV111){
            demanderReconciliationBoutiqueIdleV111_();
          }
          /* Pas de synchronisation complète : elle pouvait annuler l'achat. */
        }else{
          setTimeout(
            function(){
              synchroniserJeuIdleV7_(true);
            },
            80
          );
        }
      }

      function echecLotRapideIdleV60_(
        lot,
        erreur
      ){
        REG.idleFastNetworkBusyV60=false;
        if(REG.idleCombatLotEnVolV1){
          REG.idleCombatLotEnVolV1=false;
          setTimeout(function(){try{rafraichirCommandesFightBossIdleV167_();}catch(_e){}},0);
        }

        if(
          idleServeurOccupeV60_(
            erreur
          )
        ){
          remettreLotRapideIdleV60_(
            lot
          );

          planifierEnvoiRapideIdleV60_(
            240
          );

          return;
        }

        messageFlottantIdleV32_(
          '❌ '+
          (
            erreur&&erreur.message
              ?erreur.message
              :'Erreur serveur.'
          )
        );

        if(lot&&lot.type==='shop'){
          demanderReconciliationBoutiqueIdleV111_();
        }

        if(
          idleFastPendingV60_()
        ){
          planifierEnvoiRapideIdleV60_(80);
        }else if(
          lot&&
          lot.type==='shop'
        ){
          /* Réconciliation ciblée uniquement. */
        }else{
          setTimeout(
            function(){
              synchroniserJeuIdleV7_(true);
            },
            100
          );
        }
      }

      function envoyerProchaineActionRapideIdleV60_(){
        if(
          REG.idleFastNetworkBusyV60 ||
          !SOREAL_SESSION ||
          !idleFastPendingV60_()
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-92 */
        if(
          REG.idleAchatEnCoursV5 ||
          REG.idleRecycleBatchV32 ||
          REG.idleAventureEnCoursV17 ||
          REG.idleSortPurchaseBusyV101
        ){
          planifierEnvoiRapideIdleV60_(
            120
          );
          return;
        }

        const lot=
          extraireLotRapideIdleV60_();

        if(!lot){
          return;
        }

        REG.idleFastNetworkBusyV60=true;
        REG.idleCombatLotEnVolV1=lot.type==='combat';

        const runner=
          google.script.run
            .withSuccessHandler(
              function(res){
                terminerLotRapideIdleV60_(
                  lot,
                  res
                );
              }
            )
            .withFailureHandler(
              function(e){
                echecLotRapideIdleV60_(
                  lot,
                  e
                );
              }
            );

        switch(lot.type){
          case 'equip':
            runner.equiperObjetsSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'fusion':
            runner.fusionnerObjetsSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'shop':
            runner.acheterAmeliorationsSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'forge':
            runner.ameliorerEquipementsForgeSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'bag':
            runner.agrandirInventairePlusieursSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'combat':{
            const commandeCombat=
              normaliserCommandeCombatIdleV170_(
                lot.payload
              );
            runner.definirCombatBossSorealIdle(
              SOREAL_SESSION,
              commandeCombat.actif,
              commandeCombat.raison,
              commandeCombat.snapshot
            );
            break;
          }

          case 'autoBoss':
            runner.definirAutoBossSuivantSorealIdle(
              SOREAL_SESSION,
              Boolean(
                lot.payload
              )
            );
            break;

          case 'autoAdventure':
            runner.definirCombatAutoAventureSorealIdle(
              SOREAL_SESSION,
              Boolean(
                lot.payload&&
                lot.payload.actif
              ),
              idleEntier_(
                lot.payload&&
                lot.payload.zoneId
              )
            );
            break;

          case 'boss':
            runner.selectionnerBossSorealIdle(
              SOREAL_SESSION,
              idleEntier_(
                lot.payload
              )
            );
            break;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-93 */
          default:
            REG.idleFastNetworkBusyV60=false;
            planifierEnvoiRapideIdleV60_(35);
        }
      }

      function ajouterActionRapideIdleV60_(
        type,
        payload
      ){
        switch(type){
          case 'equip':
            REG.idleFastPendingV60.equip.push(
              String(payload)
            );
            break;

          case 'fusion':
            REG.idleFastPendingV60.fusion.push(
              String(payload)
            );
            break;

          case 'shop':
            REG.idleFastPendingV60.shop[
              payload
            ]+=1;
            break;

          case 'forge':
            REG.idleFastPendingV60.forge[
              payload
            ]+=1;
            break;

          case 'bag':
            REG.idleFastPendingV60.bag+=1;
            break;

          case 'combat':
            REG.idleFastPendingV60.combat=
              normaliserCommandeCombatIdleV170_(
                payload
              );
            break;

          case 'autoBoss':
            REG.idleFastPendingV60.autoBoss=
              Boolean(
                payload
              );
            break;

          case 'autoAdventure':
            REG.idleFastPendingV60.autoAdventure=
              {
                actif:
                  Boolean(
                    payload&&
                    payload.actif
                  ),
                zoneId:
                  idleEntier_(
                    payload&&
                    payload.zoneId
                  )
              };
            break;

          case 'boss':
            REG.idleFastPendingV60.boss=
              idleEntier_(
                payload
              );
            break;

          case 'zone':
            REG.idleFastPendingV60.zone=
              idleEntier_(
                payload
              );
            break;
        }

        planifierEnvoiRapideIdleV60_(70);
      }

      function recyclerObjetsOptimisteIdleV32_(
        ids
      ){
        if(
          !REG.idleEtat ||
          !SOREAL_SESSION
        ){
          return;
        }

        const demandes=
          (
            Array.isArray(ids)
              ?ids
              :[]
          )
          .map(String)
          .filter(Boolean);

        if(!demandes.length){
          return;
        }

        const deja=
          objetsEncoreEnAttenteRecycleV38_();

        const nouveaux=
          demandes.filter(
            function(id){
              return (
                deja.indexOf(id)===-1
              );
            }
          );

        if(!nouveaux.length){
          return;
        }

        REG.idleRecycleQueueV38=
          REG.idleRecycleQueueV38.concat(
            nouveaux
          );

        if(
          Array.isArray(
            REG.idleEtat.inventaire
          )
        ){
          REG.idleEtat.inventaire=
            REG.idleEtat.inventaire.filter(
              function(objet){
                return (
                  nouveaux.indexOf(
                    String(
                      objet&&objet.id||''
                    )
                  )===-1
                );
              }
            );

          REG.idleEtat.inventaireUtilise=
            REG.idleEtat.inventaire.length;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-97 */
        rendreIdleEtat_({
          ok:true,
          joueur:REG.idleEtat
        });

        programmerEnvoiRecycleV38_();
      }

      function viderActionsLocalesAvantResetIdleV67_(){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-308 */
        try{
          REG.idleFastPendingV60.equip.length=0;
          REG.idleFastPendingV60.fusion.length=0;

          REG.idleFastPendingV60.shop={
            production:0,
            capacite:0,
            puissance:0
          };

          REG.idleFastPendingV60.forge={
            tete:0,
            torse:0,
            bottes:0,
            arme:0,
            bijou1:0,
            bijou2:0
          };

          REG.idleFastPendingV60.bag=0;
          REG.idleFastPendingV60.combat=null;
          REG.idleFastPendingV60.autoBoss=null;

          if(
            Object.prototype.hasOwnProperty.call(
              REG.idleFastPendingV60,
              'autoAdventure'
            )
          ){
            REG.idleFastPendingV60.autoAdventure=null;
          }

          REG.idleFastPendingV60.boss=null;
          REG.idleFastPendingV60.zone=null;
        }catch(e){}

        try{
          REG.idleAchatsEnAttenteV7.force=0;
          REG.idleAchatsEnAttenteV7.endurance=0;
          REG.idleAchatsEnAttenteV7.organisation=0;
        }catch(e){}

        try{
          REG.idleRecycleQueueV38.length=0;
        }catch(e){}

        try{
          annulerTimerCombatAutoIdleV30_();
        }catch(e){}

        REG.idleAutoAventureV30=false;
      }

  Object.assign(REG,{
    conserverPositionIdleV24_:conserverPositionIdleV24_,
    idleFastPendingV60_:idleFastPendingV60_,
    planifierRenduOptimisteIdleV60_:planifierRenduOptimisteIdleV60_,
    planifierEnvoiRapideIdleV60_:planifierEnvoiRapideIdleV60_,
    ajouterActionRapideIdleV60_:ajouterActionRapideIdleV60_,
    recyclerObjetsOptimisteIdleV32_:recyclerObjetsOptimisteIdleV32_,
    viderActionsLocalesAvantResetIdleV67_:viderActionsLocalesAvantResetIdleV67_
  });
})();
