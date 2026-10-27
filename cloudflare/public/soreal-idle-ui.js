/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-1 */
/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-2 */

    ;(function(){
      'use strict';

      /* Partage avec les pages extraites (modules/*-page-v1.js, découpage du monolithe 2026-10-16) : lu à l'exécution seulement. */
      /*REG_BEGIN*/
      /* Registre commun du découpage du monolithe (2026-10-16) : les modules lisent ici, à l'exécution, les fonctions et variables restées dans ce fichier. */
      const UI_PARTAGE_V1=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
      window.__SOREAL_IDLE_UI_PARTAGE_V1__=UI_PARTAGE_V1;
      Object.assign(UI_PARTAGE_V1,{

      });
      Object.defineProperty(UI_PARTAGE_V1,'ADVENTURE_CORE_SLOTS_V138',{get:function(){return ADVENTURE_CORE_SLOTS_V138;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'ADVENTURE_SECOND_WEAPON_SLOTS_V1',{get:function(){return ADVENTURE_SECOND_WEAPON_SLOTS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CHAMPS_VOIX_SIMPLE_IDLE_V1',{get:function(){return CHAMPS_VOIX_SIMPLE_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CLE_RANGEES_MENU_IDLE_V1',{get:function(){return CLE_RANGEES_MENU_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1',{get:function(){return CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CLE_VOIX_SANDWICH_IDLE_V1',{get:function(){return CLE_VOIX_SANDWICH_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'EFFETS_VISUELS_IDLE_V1',{get:function(){return EFFETS_VISUELS_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_ADVENTURE_ADVANCED_SKILLS_V4',{get:function(){return IDLE_ADVENTURE_ADVANCED_SKILLS_V4;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_ADVENTURE_MANUAL_ATTACKS_V3',{get:function(){return IDLE_ADVENTURE_MANUAL_ATTACKS_V3;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_ADVENTURE_MANUAL_DEFENSE_V3',{get:function(){return IDLE_ADVENTURE_MANUAL_DEFENSE_V3;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_BT_SYNCHRO_CLE_V1',{get:function(){return IDLE_BT_SYNCHRO_CLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_DISPO_MONEY_PIT_V1',{get:function(){return IDLE_DISPO_MONEY_PIT_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_MENUS_V1',{get:function(){return IDLE_MENUS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_MENUS_VIVANTS_V1',{get:function(){return IDLE_MENUS_VIVANTS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_MENU_PAR_SYSTEME_V1',{get:function(){return IDLE_MENU_PAR_SYSTEME_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_NAV_COULEURS_V1',{get:function(){return IDLE_NAV_COULEURS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_PAGINATION_TAILLE_V1',{get:function(){return IDLE_PAGINATION_TAILLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_SAC_CASES_PAR_PAGE_V1',{get:function(){return IDLE_SAC_CASES_PAR_PAGE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_SELLOUT_SHOP_CATEGORIES_V1',{get:function(){return IDLE_SELLOUT_SHOP_CATEGORIES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_SPECIAL_BONUS_TYPES_V1_',{get:function(){return IDLE_SPECIAL_BONUS_TYPES_V1_;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_SURVOL_DELAI_OUVERTURE_MS_V1',{get:function(){return IDLE_SURVOL_DELAI_OUVERTURE_MS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_SYSTEME_PAR_MENU_V1',{get:function(){return IDLE_SYSTEME_PAR_MENU_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_UNLOCK_PAR_OBJET_V1',{get:function(){return IDLE_UNLOCK_PAR_OBJET_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TEXTE_CHRONIQUES_INTRO_IDLE_V1',{get:function(){return TEXTE_CHRONIQUES_INTRO_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1',{get:function(){return TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_AVENTURE_PAGES_V1',{get:function(){return TUTORIEL_AVENTURE_PAGES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_DEBUT_JEU_PAGES_V1',{get:function(){return TUTORIEL_DEBUT_JEU_PAGES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_PREMIER_BOSS_PAGES_V1',{get:function(){return TUTORIEL_PREMIER_BOSS_PAGES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_TABLEAUX_TEXTES_V1',{get:function(){return TUTORIEL_TABLEAUX_TEXTES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1',{get:function(){return VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAchatEnCoursV5',{get:function(){return idleAchatEnCoursV5;},set:function(v){idleAchatEnCoursV5=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAchatsEnAttenteV7',{get:function(){return idleAchatsEnAttenteV7;},set:function(v){idleAchatsEnAttenteV7=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAchatsEnvoyesV23',{get:function(){return idleAchatsEnvoyesV23;},set:function(v){idleAchatsEnvoyesV23=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureDragIdV138',{get:function(){return idleAdventureDragIdV138;},set:function(v){idleAdventureDragIdV138=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightIdentityV2',{get:function(){return idleAdventureFightIdentityV2;},set:function(v){idleAdventureFightIdentityV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightLastRegenAtV2',{get:function(){return idleAdventureFightLastRegenAtV2;},set:function(v){idleAdventureFightLastRegenAtV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightNextEnemyHitV2',{get:function(){return idleAdventureFightNextEnemyHitV2;},set:function(v){idleAdventureFightNextEnemyHitV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightNextPlayerHitV2',{get:function(){return idleAdventureFightNextPlayerHitV2;},set:function(v){idleAdventureFightNextPlayerHitV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureIdleModeV3',{get:function(){return idleAdventureIdleModeV3;},set:function(v){idleAdventureIdleModeV3=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureIgnorerClicJusquaV165',{get:function(){return idleAdventureIgnorerClicJusquaV165;},set:function(v){idleAdventureIgnorerClicJusquaV165=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureKoAlertV1',{get:function(){return idleAdventureKoAlertV1;},set:function(v){idleAdventureKoAlertV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureManualStateV3',{get:function(){return idleAdventureManualStateV3;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureResolutionPendingV2',{get:function(){return idleAdventureResolutionPendingV2;},set:function(v){idleAdventureResolutionPendingV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRespawnAtV1',{get:function(){return idleAdventureRespawnAtV1;},set:function(v){idleAdventureRespawnAtV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRespawnStartPendingV165',{get:function(){return idleAdventureRespawnStartPendingV165;},set:function(v){idleAdventureRespawnStartPendingV165=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRespawnTimerV165',{get:function(){return idleAdventureRespawnTimerV165;},set:function(v){idleAdventureRespawnTimerV165=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRestPvMemoV1',{get:function(){return idleAdventureRestPvMemoV1;},set:function(v){idleAdventureRestPvMemoV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRevisionServeurV208',{get:function(){return idleAdventureRevisionServeurV208;},set:function(v){idleAdventureRevisionServeurV208=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAllocOrdreV1',{get:function(){return idleAllocOrdreV1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleApOngletV1',{get:function(){return idleApOngletV1;},set:function(v){idleApOngletV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutoAventureV30',{get:function(){return idleAutoAventureV30;},set:function(v){idleAutoAventureV30=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutoNukeDernierV1',{get:function(){return idleAutoNukeDernierV1;},set:function(v){idleAutoNukeDernierV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutoNukeRunV1',{get:function(){return idleAutoNukeRunV1;},set:function(v){idleAutoNukeRunV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutoZoneV30',{get:function(){return idleAutoZoneV30;},set:function(v){idleAutoZoneV30=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutorise',{get:function(){return idleAutorise;},set:function(v){idleAutorise=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAventureEnCoursV17',{get:function(){return idleAventureEnCoursV17;},set:function(v){idleAventureEnCoursV17=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBasicTrainingDirtyV120',{get:function(){return idleBasicTrainingDirtyV120;},set:function(v){idleBasicTrainingDirtyV120=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBasicTrainingSaveBusyV120',{get:function(){return idleBasicTrainingSaveBusyV120;},set:function(v){idleBasicTrainingSaveBusyV120=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBasicTrainingSaveTimerV120',{get:function(){return idleBasicTrainingSaveTimerV120;},set:function(v){idleBasicTrainingSaveTimerV120=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBouclierJusquaV70',{get:function(){return idleBouclierJusquaV70;},set:function(v){idleBouclierJusquaV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBouclierReductionV70',{get:function(){return idleBouclierReductionV70;},set:function(v){idleBouclierReductionV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleChroniquesOngletV1',{get:function(){return idleChroniquesOngletV1;},set:function(v){idleChroniquesOngletV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleClicsEnAttenteV1',{get:function(){return idleClicsEnAttenteV1;},set:function(v){idleClicsEnAttenteV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleClicsEnvoiEnCoursV1',{get:function(){return idleClicsEnvoiEnCoursV1;},set:function(v){idleClicsEnvoiEnCoursV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleClicsEnvoiMinuterieV1',{get:function(){return idleClicsEnvoiMinuterieV1;},set:function(v){idleClicsEnvoiMinuterieV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatArmeLocalV206',{get:function(){return idleCombatArmeLocalV206;},set:function(v){idleCombatArmeLocalV206=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatEnPauseApresDefaiteV1',{get:function(){return idleCombatEnPauseApresDefaiteV1;},set:function(v){idleCombatEnPauseApresDefaiteV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatIdentiteV116',{get:function(){return idleCombatIdentiteV116;},set:function(v){idleCombatIdentiteV116=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogBloquesV70',{get:function(){return idleCombatLogBloquesV70;},set:function(v){idleCombatLogBloquesV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogBossV70',{get:function(){return idleCombatLogBossV70;},set:function(v){idleCombatLogBossV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDegatsBossV70',{get:function(){return idleCombatLogDegatsBossV70;},set:function(v){idleCombatLogDegatsBossV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDegatsBrutsV100',{get:function(){return idleCombatLogDegatsBrutsV100;},set:function(v){idleCombatLogDegatsBrutsV100=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDegatsJoueurV70',{get:function(){return idleCombatLogDegatsJoueurV70;},set:function(v){idleCombatLogDegatsJoueurV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDernierResumeV70',{get:function(){return idleCombatLogDernierResumeV70;},set:function(v){idleCombatLogDernierResumeV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogV70',{get:function(){return idleCombatLogV70;},set:function(v){idleCombatLogV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLotEnVolV1',{get:function(){return idleCombatLotEnVolV1;},set:function(v){idleCombatLotEnVolV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatStopFantomeEnvoyeV206',{get:function(){return idleCombatStopFantomeEnvoyeV206;},set:function(v){idleCombatStopFantomeEnvoyeV206=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleComparaisonIdsV1',{get:function(){return idleComparaisonIdsV1;},set:function(v){idleComparaisonIdsV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleDernierClicAncreV1',{get:function(){return idleDernierClicAncreV1;},set:function(v){idleDernierClicAncreV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleDernierTickLocalV40',{get:function(){return idleDernierTickLocalV40;},set:function(v){idleDernierTickLocalV40=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleDispoMoneyPitDerniereV1',{get:function(){return idleDispoMoneyPitDerniereV1;},set:function(v){idleDispoMoneyPitDerniereV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleEffetsSignatureV112',{get:function(){return idleEffetsSignatureV112;},set:function(v){idleEffetsSignatureV112=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleEffetsVisuelsJoueurV112',{get:function(){return idleEffetsVisuelsJoueurV112;},configurable:true});
      /*
       * Décimales de PV qui reculent (Norman, 2026-10-19 : « dans les virgules des PV, ça augmente rapidement mais on peut voir un rollback des décimales »). Chaque réponse du moteur
       * remplace l'état ; ses PV sont ceux de l'instant où le calcul a COMMENCÉ, donc un peu en retard sur les PV que la page a déjà prévus par la régénération (PV max / 20 par
       * seconde de défense) : au remplacement, les décimales reculaient. Hors combat, un recul ne dépassant pas 1,5 s de régénération (jamais plus) est ignoré : la valeur déjà
       * affichée est gardée ; un vrai retrait de PV (combat, dégâts) n'est jamais masqué.
       */
      Object.defineProperty(UI_PARTAGE_V1,'idleEtat',{get:function(){return idleEtat;},set:function(v){
        try{
          const ancien=idleEtat;
          if(ancien&&v&&typeof v==='object'&&ancien!==v&&!ancien.combatBossActif&&!v.combatBossActif){
            const pvAvant=Number(ancien.pvJoueur),pvApres=Number(v.pvJoueur),defense=Number(v.defense!=null?v.defense:ancien.defense)||0,pvMax=Number(v.pvJoueurMax);
            const regen15=Math.max(0.5,defense/20*1.5);
            if(Number.isFinite(pvAvant)&&Number.isFinite(pvApres)&&pvApres<pvAvant&&pvAvant-pvApres<=regen15&&(!Number.isFinite(pvMax)||pvAvant<=pvMax))v.pvJoueur=pvAvant;
          }
        }catch(_e){}
        /* Règle générale (modules/etat-monotone-v1.js) : un nombre qui monte (énergie, magie, EXP, monnaies, ressources, PV) ne recule jamais du simple retard de la réponse du moteur. Âge réel de la réponse = maintenant moins l'instant où le moteur a commencé son calcul. */
        try{
          const M=window.__SOREAL_IDLE_MONOTONE_V1__;
          if(M&&idleEtat&&v&&typeof v==='object'&&idleEtat!==v){
            const caler=window.__SOREAL_IDLE_CALER_RECU_V1__;
            const maintenantPerf=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
            const age=typeof caler==='function'?Math.max(0,(maintenantPerf-Number(caler(v,maintenantPerf,Date.now())))/1000):0.2;
            M.garder(idleEtat,v,Number.isFinite(age)?Math.min(age,10):0.2);
          }
        }catch(_e){}
        idleEtat=v;
        /* Les multiplicateurs de combat de la réponse sont ceux de l'instant où le moteur a commencé son calcul : on les avance à MAINTENANT avant tout affichage (Attaque, Défense et Vie max du bandeau ne reculent plus une image). */
        try{if(v&&typeof UI_PARTAGE_V1.appliquerTrajectoireStatsIdleV1_==='function')UI_PARTAGE_V1.appliquerTrajectoireStatsIdleV1_();}catch(_e){}
      },configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFastNetworkBusyV60',{get:function(){return idleFastNetworkBusyV60;},set:function(v){idleFastNetworkBusyV60=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFastPendingV60',{get:function(){return idleFastPendingV60;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFicheObjetOuverteIdV1',{get:function(){return idleFicheObjetOuverteIdV1;},set:function(v){idleFicheObjetOuverteIdV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFureurActiveV70',{get:function(){return idleFureurActiveV70;},set:function(v){idleFureurActiveV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFxSoinJusqua',{get:function(){return idleFxSoinJusqua;},set:function(v){idleFxSoinJusqua=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryBusyV160',{get:function(){return idleInventoryBusyV160;},set:function(v){idleInventoryBusyV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryConfirmedAdventureV160',{get:function(){return idleInventoryConfirmedAdventureV160;},set:function(v){idleInventoryConfirmedAdventureV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryDeferredPatchV160',{get:function(){return idleInventoryDeferredPatchV160;},set:function(v){idleInventoryDeferredPatchV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryMutationQueueV160',{get:function(){return idleInventoryMutationQueueV160;},set:function(v){idleInventoryMutationQueueV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryPerfV160',{get:function(){return idleInventoryPerfV160;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventorySequenceV160',{get:function(){return idleInventorySequenceV160;},set:function(v){idleInventorySequenceV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleItemPopupPositionV1_',{get:function(){return idleItemPopupPositionV1_;},set:function(v){idleItemPopupPositionV1_=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuActifV28',{get:function(){return idleMenuActifV28;},set:function(v){idleMenuActifV28=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuClicAvaleJusquaV1',{get:function(){return idleMenuClicAvaleJusquaV1;},set:function(v){idleMenuClicAvaleJusquaV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuEditionV1',{get:function(){return idleMenuEditionV1;},set:function(v){idleMenuEditionV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuRenduV179',{get:function(){return idleMenuRenduV179;},set:function(v){idleMenuRenduV179=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleNavDefilementMsV1',{get:function(){return idleNavDefilementMsV1;},set:function(v){idleNavDefilementMsV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleNavDoigtV1',{get:function(){return idleNavDoigtV1;},set:function(v){idleNavDoigtV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleNukeEnCoursV1',{get:function(){return idleNukeEnCoursV1;},set:function(v){idleNukeEnCoursV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleOrLocalAtV1',{get:function(){return idleOrLocalAtV1;},set:function(v){idleOrLocalAtV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleOrLocalPatchV1',{get:function(){return idleOrLocalPatchV1;},set:function(v){idleOrLocalPatchV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePageCoffreV1',{get:function(){return idlePageCoffreV1;},set:function(v){idlePageCoffreV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePageSacV1',{get:function(){return idlePageSacV1;},set:function(v){idlePageSacV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleParalysieJusquaV70',{get:function(){return idleParalysieJusquaV70;},set:function(v){idleParalysieJusquaV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePartieDevV1',{get:function(){return idlePartieDevV1;},set:function(v){idlePartieDevV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePointeurEnfonceV1',{get:function(){return idlePointeurEnfonceV1;},set:function(v){idlePointeurEnfonceV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePopupActifV75',{get:function(){return idlePopupActifV75;},set:function(v){idlePopupActifV75=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePopupBloqueCombatV102',{get:function(){return idlePopupBloqueCombatV102;},set:function(v){idlePopupBloqueCombatV102=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePopupQueueV75',{get:function(){return idlePopupQueueV75;},set:function(v){idlePopupQueueV75=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePrevisionBossV1',{get:function(){return idlePrevisionBossV1;},set:function(v){idlePrevisionBossV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleProchainCoupBossV116',{get:function(){return idleProchainCoupBossV116;},set:function(v){idleProchainCoupBossV116=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleProchainCoupJoueurV116',{get:function(){return idleProchainCoupJoueurV116;},set:function(v){idleProchainCoupJoueurV116=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRechercheCoffreV1',{get:function(){return idleRechercheCoffreV1;},set:function(v){idleRechercheCoffreV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRecycleBatchV32',{get:function(){return idleRecycleBatchV32;},set:function(v){idleRecycleBatchV32=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRecycleQueueV38',{get:function(){return idleRecycleQueueV38;},set:function(v){idleRecycleQueueV38=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRenaissanceEnCoursV14',{get:function(){return idleRenaissanceEnCoursV14;},set:function(v){idleRenaissanceEnCoursV14=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleReserveAventureV23',{get:function(){return idleReserveAventureV23;},set:function(v){idleReserveAventureV23=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleResteTickEnergieMsV114',{get:function(){return idleResteTickEnergieMsV114;},set:function(v){idleResteTickEnergieMsV114=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleShopReconcileDemandeeV111',{get:function(){return idleShopReconcileDemandeeV111;},set:function(v){idleShopReconcileDemandeeV111=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSortPurchaseBusyV101',{get:function(){return idleSortPurchaseBusyV101;},set:function(v){idleSortPurchaseBusyV101=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSortPurchaseQueueV101',{get:function(){return idleSortPurchaseQueueV101;},set:function(v){idleSortPurchaseQueueV101=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolBloqueV1',{get:function(){return idleSurvolBloqueV1;},set:function(v){idleSurvolBloqueV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolEnAttenteIdV1',{get:function(){return idleSurvolEnAttenteIdV1;},set:function(v){idleSurvolEnAttenteIdV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolIdV1',{get:function(){return idleSurvolIdV1;},set:function(v){idleSurvolIdV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolTimerFermerV1',{get:function(){return idleSurvolTimerFermerV1;},set:function(v){idleSurvolTimerFermerV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolTimerOuvrirV1',{get:function(){return idleSurvolTimerOuvrirV1;},set:function(v){idleSurvolTimerOuvrirV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolVirtuelCleV1',{get:function(){return idleSurvolVirtuelCleV1;},set:function(v){idleSurvolVirtuelCleV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolVirtuelFermerV1',{get:function(){return idleSurvolVirtuelFermerV1;},set:function(v){idleSurvolVirtuelFermerV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSurvolVirtuelTimerV1',{get:function(){return idleSurvolVirtuelTimerV1;},set:function(v){idleSurvolVirtuelTimerV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSyncEnCoursV60',{get:function(){return idleSyncEnCoursV60;},set:function(v){idleSyncEnCoursV60=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleTitanEtatV1',{get:function(){return idleTitanEtatV1;},set:function(v){idleTitanEtatV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleTutorielPagesEnCoursV1',{get:function(){return idleTutorielPagesEnCoursV1;},set:function(v){idleTutorielPagesEnCoursV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVictoireBossLocaleV49',{get:function(){return idleVictoireBossLocaleV49;},set:function(v){idleVictoireBossLocaleV49=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVueAventureV1',{get:function(){return idleVueAventureV1;},set:function(v){idleVueAventureV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVusEnAttenteV1',{get:function(){return idleVusEnAttenteV1;},set:function(v){idleVusEnAttenteV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVusMemoireV1',{get:function(){return idleVusMemoireV1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVusMigreV1',{get:function(){return idleVusMigreV1;},set:function(v){idleVusMigreV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'notesMajPageIdleV1_',{get:function(){return notesMajPageIdleV1_;},set:function(v){notesMajPageIdleV1_=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'ouvrirPageSorealOriginalV4',{get:function(){return ouvrirPageSorealOriginalV4;},configurable:true});
      /*REG_END*/

      /* Rendu principal, synchronisation et chargement : code dans modules/ui-noyau-v1.js (découpage du monolithe, 2026-10-16). */
      const IDLE_CLIENT_PROTOCOL_VERSION=1;
      let idleAutorise=false;
      /* Outils d'administration : code dans modules/ui-admin-v1.js (découpage du monolithe, 2026-10-16). */
      UI_PARTAGE_V1.__amorcer_10();
      /*
       * 2026-09-27 (Norman revient sur le retrait du 2026-09-26) : « J'aimerai avoir une partie B
       * dans paramètres. Mais cette partie B ne serait pas reprise dans le classement. ça me
       * permettra de tester des choses. » Repris à l'identique de la version retirée
       * (idle-dev-save-slots-v1.js) : deux parties, « A » (réelle, jamais réinitialisée par ce
       * mécanisme) et « B » (réinitialisable à volonté, exclue du classement). Le serveur dit si le
       * sélecteur existe (compte administrateur + fonction active) et quelle partie la session
       * joue ; changer de partie recharge la page (le jeton de session reste dans sessionStorage).
       */
      let idlePartieDevV1=null;
      /* Aventure (zones, combat d'aventure, équipement) (partie 2) : code dans modules/ui-aventure-2-v1.js (découpage du monolithe, 2026-10-16). */
      UI_PARTAGE_V1.__amorcer_15();
      UI_PARTAGE_V1.__amorcer_17();
      /* Réglages et notes de version : code dans modules/ui-reglages-v1.js (découpage du monolithe, 2026-10-16). */
      /* Boucle de jeu locale (tick, expérience, effets visuels) : code dans modules/ui-boucle-v1.js (découpage du monolithe, 2026-10-16). */

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-6 */
      let idlePopupActifV75=false;
      let idlePopupQueueV75=[];
      let idlePopupBloqueCombatV102=false;
      let idleTutorielPagesEnCoursV1=null;

      /* Fight Boss et Titans (partie 1) : code dans modules/ui-combat-1-v1.js (découpage du monolithe, 2026-10-16). */
      let idleProchainCoupJoueurV116=0;
      let idleProchainCoupBossV116=0;
      let idleCombatIdentiteV116='';




      let idleEtat=null;
      /* Synchronisation avec le serveur : code dans modules/ui-synchro-v1.js (découpage du monolithe, 2026-10-16). */
      UI_PARTAGE_V1.__amorcer_38();
      UI_PARTAGE_V1.__amorcer_39();
      UI_PARTAGE_V1.__amorcer_40();
      UI_PARTAGE_V1.__amorcer_41();
      UI_PARTAGE_V1.__amorcer_42();
      UI_PARTAGE_V1.__amorcer_43();
      /* Énergie, Magie et sorts : code dans modules/ui-magie-energie-v1.js (découpage du monolithe, 2026-10-16). */
      UI_PARTAGE_V1.__amorcer_45();
      /* Menus, bandeau et barres du haut : code dans modules/ui-menus-v1.js (découpage du monolithe, 2026-10-16). */
      UI_PARTAGE_V1.__amorcer_48();
      UI_PARTAGE_V1.__amorcer_49();
      UI_PARTAGE_V1.__amorcer_50();
      UI_PARTAGE_V1.__amorcer_52();
      UI_PARTAGE_V1.__amorcer_53();
      UI_PARTAGE_V1.__amorcer_54();

      let idleBasicTrainingSaveTimerV120=null;
      /*
       * Ordre d'envoi des répartitions d'énergie (Norman, 2026-10-04) : Basic Training et les autres systèmes (Augmentations, Time Machine…) partent au serveur par deux canaux différés. Une répartition de l'un qui
       * dépend de ce que l'autre vient de libérer (ou d'occuper) doit arriver APRÈS lui, sinon le serveur la juge sur une énergie qui n'est pas encore à jour et la réduit. Chaque canal note l'instant de sa première
       * modification en attente ; il n'envoie pas tant que l'autre canal en a une plus ancienne (et récente : une attente de plus de 4 s est ignorée, jamais de blocage).
       */
      const idleAllocOrdreV1={n:0,bt:0,btAt:0,meta:0,metaAt:0};
      UI_PARTAGE_V1.__amorcer_57();
      let idleBasicTrainingSaveBusyV120=false;
      let idleBasicTrainingDirtyV120=false;

      /* Entraînement de base (calculs locaux, envois, animations) : code dans modules/ui-entrainement-v1.js (découpage du monolithe, 2026-10-16). */




      UI_PARTAGE_V1.__amorcer_67();















      const IDLE_BT_SYNCHRO_CLE_V1='soreal_idle_bt_synchro_v1';


      UI_PARTAGE_V1.__amorcer_85();








      UI_PARTAGE_V1.__amorcer_92();

      UI_PARTAGE_V1.__amorcer_93();

      UI_PARTAGE_V1.__amorcer_94();

      UI_PARTAGE_V1.__amorcer_95();




      /* Aventure (zones, combat d'aventure, équipement) (partie 1) : code dans modules/ui-aventure-1-v1.js (découpage du monolithe, 2026-10-16). */



      UI_PARTAGE_V1.__amorcer_102();













      let idleDernierTickLocalV40=Date.now();
      let idleResteTickEnergieMsV114=0;
















      UI_PARTAGE_V1.__amorcer_133();
      UI_PARTAGE_V1.__amorcer_134();
      /* Fonctions diverses du jeu (utilitaires, popups, survol, pseudo) : code dans modules/ui-divers-v1.js (découpage du monolithe, 2026-10-16). */
      function baliseursPausesIdleV1_(){return UI_PARTAGE_V1.baliseursPausesIdleV1_.apply(null,arguments);}
      UI_PARTAGE_V1.__amorcer_138();
      UI_PARTAGE_V1.__amorcer_139();

      UI_PARTAGE_V1.__amorcer_140();









      /*
       * Boss suivant instantané (Norman, 2026-10-02 : « quand on bat un boss, le suivant met énormément de temps à apparaître : ça doit être instantané »).
       * À la victoire prédite le client affiche tout de suite le boss suivant (état fourni d'avance par le serveur : bossSuivant) ; tant que le serveur
       * n'a pas confirmé la victoire (bossVaincus du serveur >= prédit), ses réponses -- qui décrivent encore l'ancien boss -- ne remplacent PAS l'affichage.
       * Au-delà de 15 s sans confirmation, la prévision est abandonnée et l'état du serveur fait foi (surveillerConfirmationVictoireBossIdleV1_).
       */
      let idlePrevisionBossV1={actif:false,vaincus:0,debut:0};





      /* Machine temporelle (comptes à rebours, barres) : code dans modules/ui-machine-temporelle-v1.js (découpage du monolithe, 2026-10-16). */




   /* secondes : en dessous, la barre de la Machine temporelle reste pleine */






      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-79 */




      let idleAchatEnCoursV5=false;
      let idleAchatsEnAttenteV7={
        force:0,
        endurance:0,
        organisation:0
      };

      let idleAchatsEnvoyesV23={
        force:0,
        endurance:0,
        organisation:0
      };

      let idleReserveAventureV23=0;




      /* Boutiques et achats : code dans modules/ui-boutique-v1.js (découpage du monolithe, 2026-10-16). */









      /*
       * 2026-09-25 (Norman : « sur PC, quand je maintiens A pour absorber les boosts, la page me replace toujours plus bas que l'inventaire »).
       * Le rendu complet remplace toute la page ; l'inventaire fait maintenant partie de la page Aventure (longue, avec images et journal qui
       * changent de hauteur après le rendu) : restaurer un scrollY absolu le laissait plus bas que le sac. On mémorise donc la position
       * du sac À L'ÉCRAN (distance entre le haut de la fenêtre et le haut du sac) et on la rétablit après le rendu, puis encore quand la
       * mise en page bouge (images, 2e passe) — sans jamais contrarier un défilement fait par le joueur entre-temps.
       */
      /*
       * Aucun saut de page au clic (Norman, 2026-10-07 : « ouvrir ou fermer le coffre redessine toute la page, j'ai des sauts de page ; ça ne doit jamais se produire »).
       * Cause mesurée : l'ancre du sac (ci-dessus) ramenait le sac à sa place d'avant ; or le coffre est au-dessus du sac, donc ouvrir ou fermer le coffre décalait le sac
       * et l'ancre faisait défiler la page de plusieurs centaines de pixels (1724 -> 937). On ancre maintenant sur CE QUE LE JOUEUR A TOUCHÉ : l'élément cliqué (retrouvé
       * après le rendu par son chemin dans la page) reste exactement au même endroit de l'écran, quoi qu'il arrive au-dessus ou en dessous. Sans clic récent, ou si le
       * joueur a défilé depuis, on retombe sur l'ancre du sac puis sur le défilement habituel.
       */
      let idleDernierClicAncreV1=null;
      UI_PARTAGE_V1.__amorcer_178();
      UI_PARTAGE_V1.__amorcer_186();
      /* Inventaire, Coffre et sacs : code dans modules/ui-inventaire-v1.js (découpage du monolithe, 2026-10-16). */

      /* Actions rapides, lots et recyclage : code dans modules/ui-actions-rapides-v1.js (découpage du monolithe, 2026-10-16). */


      UI_PARTAGE_V1.__amorcer_193();



      UI_PARTAGE_V1.__amorcer_197();


























      UI_PARTAGE_V1.__amorcer_223();

      UI_PARTAGE_V1.__amorcer_225();








      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-88 */
      let idleFastNetworkBusyV60=false;
      let idleSyncEnCoursV60=false;
      let idleShopReconcileDemandeeV111=false;



      const idleFastPendingV60={
        equip:[],
        fusion:[],
        shop:{
          production:0,
          capacite:0,
          puissance:0
        },
        forge:{
          tete:0,
          torse:0,
          bottes:0,
          arme:0,
          bijou1:0,
          bijou2:0
        },
        bag:0,
        combat:null,
        autoBoss:null,
        autoAdventure:null,
        boss:null,
        zone:null
      };




      /*
       * Fight grisé tant que le serveur n'a pas validé (Norman, 2026-10-03 : « tant que le combat n'a pas été validé côté serveur, le bouton Fight reste grisé et on ne peut pas cliquer »).
       * Le serveur n'a pas fini de valider quand : une victoire prédite n'est pas confirmée, ou un ordre de combat (démarrage, fuite, défaite) est en attente d'envoi ou en vol.
       */
      let idleCombatLotEnVolV1=false;






























      /* Chroniques (collection, classement, succès, profil) : code dans modules/ui-chroniques-v1.js (découpage du monolithe, 2026-10-16). */








      UI_PARTAGE_V1.__amorcer_263();



      let idleRecycleBatchV32=false;
      let idleRecycleQueueV38=[];




















































      UI_PARTAGE_V1.__amorcer_273();













      UI_PARTAGE_V1.__amorcer_280();






      let idleAventureEnCoursV17=false;



      let idleAutoAventureV30=false;
      let idleAutoZoneV30=0;


















      UI_PARTAGE_V1.__amorcer_296();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-100 */








      let idleRenaissanceEnCoursV14=false;


      /* Renaissance et remise à zéro : code dans modules/ui-renaissance-v1.js (découpage du monolithe, 2026-10-16). */









      UI_PARTAGE_V1.__amorcer_306();

      UI_PARTAGE_V1.__amorcer_307();


      UI_PARTAGE_V1.__amorcer_308();



      let idleMenuActifV28='combat';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-106 */
      let idleMenuRenduV179=null;

      /* Observer « 69 lol » bon marché : on ne regarde que les nœuds texte contenant « 69 »
         (les ticks à 15 Hz réécrivent du texte en continu), jamais de balayage complet du body
         hors installation initiale, et un nœud n'est traité qu'une fois par rafale de mutations. */




      UI_PARTAGE_V1.__amorcer_317();



      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-111 */
      const IDLE_SYSTEME_PAR_MENU_V1={
        augmentations:'augmentations',
        avance:'advancedTraining',
        machine:'timeMachine',
        sang:'bloodMagic',
        wandoos:'wandoos',
        ngu:'ngu',
        yggdrasil:'yggdrasil',
        moneyPit:'moneyPit',
        diggers:'diggers',
        beards:'beards',
        tower:'tower',
        challenges:'challenges',
        titans:'titans',
        macguffins:'macguffins',
        daycare:'daycare',
        questing:'questing',
        quirks:'quirks',
        hacks:'hacks',
        wishes:'wishes',
        cards:'cards',
        cooking:'cooking',
        succes:'achievements'
      };
      const IDLE_MENU_PAR_SYSTEME_V1=Object.fromEntries(
        Object.entries(IDLE_SYSTEME_PAR_MENU_V1).map(function(paire){
          return [paire[1],paire[0]];
        })
      );
      UI_PARTAGE_V1.__amorcer_322();
      UI_PARTAGE_V1.__amorcer_323();
      UI_PARTAGE_V1.__amorcer_324();

      /* Navigation et ordre des menus : code dans modules/ui-navigation-v1.js (découpage du monolithe, 2026-10-16). */












      /*
       * « Déjà vu » (popups de menus, tutoriels, textes d'accueil) — Norman, 2026-09-24 : « quand on rebirth, on a encore les popups quand
       * on va dans les menus ; ils ne doivent arriver qu'une fois, pareil pour les textes d'accueil ». L'état vit désormais AUSSI côté
       * serveur (profil.stats.vus, opération marquerVusSorealIdle) : une Renaissance, un autre appareil ou un stockage local vidé ne
       * les rejouent plus. Le stockage local reste un cache immédiat ; ce qu'il contient déjà est envoyé au serveur une fois.
       */
      const idleVusMemoireV1={};
      let idleVusEnAttenteV1=[];
      /* Popups de progression et résumé hors ligne : code dans modules/ui-popups-v1.js (découpage du monolithe, 2026-10-16). */
      let idleVusMigreV1='';




      /*
       * Catégorie « Clics/Tap » du classement (Norman, 2026-09-27 : « le nombre de cliques de souris Droite/gauche effectué dans
       * l'appli. Et les taps pareils, dans la même catégorie... même si quelqu'un triche, ca n'est pas grave »). Compteur brut,
       * jamais anti-triche par conception. On accumule en mémoire et on envoie le total par lots (même patron que idleVusEnvoyerV1_
       * ci-dessus), jamais un appel serveur par clic.
       */
      let idleClicsEnAttenteV1=0;
      let idleClicsEnvoiEnCoursV1=false;


      let idleClicsEnvoiMinuterieV1=null;
      UI_PARTAGE_V1.__amorcer_350();

      UI_PARTAGE_V1.__amorcer_351();
      UI_PARTAGE_V1.__amorcer_352();



      UI_PARTAGE_V1.__amorcer_356();
      UI_PARTAGE_V1.__amorcer_357();

      /* Tutoriel : code dans modules/ui-tutoriel-v1.js (découpage du monolithe, 2026-10-16). */
      function pauseVoixIdleV1_(){return UI_PARTAGE_V1.pauseVoixIdleV1_.apply(null,arguments);}












      UI_PARTAGE_V1.__amorcer_367();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-120 */
      const TUTORIEL_DEBUT_JEU_PAGES_V1=[
        {
          titre:'LE COMMENCEMENT',
          sousTitre:'(ACCROCHE-TOI BIEN)',
          long:true,
          diaporama:true,
          bouton:'JOUER',
          paragraphes:[
            '*BLOUM*',
            'Quand tu reprends connaissance, la première chose que tu remarques, c’est ce goût de cuivre dans ta bouche.',
            'La seconde, c’est l’odeur d’égout à plein nez tout autour de toi.',
            'Tu te relèves en soignant ta lèvre fendue et en te frottant la tête, qui a l’air d’avoir reçu tout l’amour d’un bloc de béton. Tu essaies de te rappeler comment tu es arrivé ici... enfin, peu importe où est « ici ». Tu réalises, avec un calme étonnant, que tu as complètement oublié qui tu es. Vu l’état dans lequel tu te trouves, tu te dis qu’ils devaient être de sacrés connards. Balancé dans une fosse d’égout dégueulasse...',
            'Au moins, à court terme, tu as un objectif : trouver un moyen de sortir d’ici. Ça a l’air d’être la bonne chose à faire. Tu essaies de te lever mais tes genoux tremblent, se dérobent, et tu retombes. C’est seulement maintenant que tu sens la faiblesse dans ton corps. Pas le genre de faiblesse normale, comme quand tu te lèves trop vite et que la tête tourne, ou quand ton bras se fait arracher dans un accident industriel. Non, tu as l’impression que *quelque chose* a aspiré la majorité de ta force.',
            'Bon, il n’y a rien d’autre à faire qu’essayer de récupérer un peu de cette force et sortir d’ici. Peut-être qu’appuyer sur un gros bouton blanc marqué « JOUER » te permettra de faire quelque chose d’amusant.'
          ]
        },
        {
          titre:'Norman & Sébastien',
          paragraphes:[
            'Salut, qui que tu sois ! Content que tu aies décidé de jeter un œil à SOREAL IDLE. Nous sommes Norman & Sébastien, les narrateurs de cette histoire. Bref, on commence !'
          ]
        },
        {
          titre:'Objectif',
          cadrage:'stats',
          clignote:'stats-attaque-defense',
          paragraphes:[
            'Donc, ton objectif principal dans SOREAL IDLE ? Devenir super méga puissant, et vaincre tous les Boss bizarres qui se dressent sur ton chemin ! En haut, en dessous de la grosse barre verte, tu vois tes deux stats principales, Attaque et Défense. Elles démarrent à 100, mais elles vont grimper à toute vitesse dans une seconde.'
          ]
        },
        {
          titre:'Énergie',
          cadrage:'energie1',
          clignote:'energie-barre',
          paragraphes:[
            'En parlant de la grosse barre verte, elle représente ton énergie. Tu génères de l’Énergie à chaque fois que la barre verte se remplit, jusqu’à atteindre le plafond, qui est de 500 pour l’instant. Et l’Énergie sera la clé pour faire grimper tes chiffres d’Attaque et de Défense.'
          ]
        },
        {
          titre:'Basic Training',
          cadrage:'barres',
          clignote:'attaque-plus',
          attendre:'attaque-plus',
          paragraphes:[
            'C’est là que les choses se passent. Si tu sélectionnes Basic Training dans le menu en haut, tu pourras augmenter ton attaque et ta défense (quelle surprise). Pour t’entraîner, tu assignes ton Énergie à une tâche ! Vas-y, clique sur le bouton « + » à côté de « Attaque passive » et regarde ce qui se passe.'
          ]
        },
        {
          titre:'Bien joué',
          cadrage:'barres',
          clignote:'attaque-moins',
          paragraphes:[
            'Si tu as bien fait, la barre devrait être en train de se remplir, et ton Attaque devrait grimper maintenant. Tape-toi dans le dos pour te féliciter. Pas trop bas quand même, ce serait bizarre. Si tu cliques sur le bouton -, tu peux retirer cette énergie et la mettre ailleurs.'
          ]
        },
        {
          titre:'Énergie Idle',
          cadrage:'energie',
          paragraphes:[
            'La grosse barre verte, représente ton energie d\'entrainement disponible. C’est la quantité d’Énergie que tu n’as assignée nulle part et qui traîne à rien faire comme une bonne grosse feignasse. Ton « Plafond d’Énergie » c’est la somme de toute ton Énergie, qu’elle soit idle ou assignée.'
          ]
        },
        {
          titre:'Saisie personnalisée',
          cadrage:'saisie',
          paragraphes:[
            'Quand tu cliques sur le bouton + pour assigner de l’Énergie à une tâche, le jeu va essayer d’assigner une quantité d’Énergie égale au chiffre saisi en haut. En cliquant sur ces boutons bizarres en haut, tu changes la quantité stockée dans la saisie, et tu peux aussi entrer un chiffre personnalisé toi-même dans la barre.'
          ]
        },
        {
          titre:'Défense',
          cadrage:'blocage',
          clignote:'blocage-plus',
          paragraphes:[
            'Avoir la force d’un transpalette électrique mais en carton, c’est cool, mais tu voudras sûrement un peu de Défense aussi. Donc, il va falloir entraîner la compétence « Blocage » dans le menu Basic Training aussi. Si toute ton Énergie est allouée à l’Attaque passive, il va falloir en retirer un peu.'
          ]
        },
        {
          titre:'Fight Boss',
          cadrage:'fight',
          paragraphes:[
            'Quand tes stats seront assez hautes, va jeter un œil au menu Fight Boss, et tu pourras mettre ta puissance à l’épreuve. En commençant par un adversaire particulièrement vicieux... Un Petit Bout de Peluche.'
          ]
        },
        {
          titre:'Norman & Sébastien',
          seulementPrecedent:true,
          paragraphes:[
            'Bon, on va aller se faire un sandwich, alors continue à t’entraîner et bats le premier boss. On sera de retour après !',
            '— Norman & Sébastien'
          ]
        }
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-121 */
      const TUTORIEL_AVENTURE_PAGES_V1=[
        {
          titre:'Norman & Sébastien',
          paragraphes:[
            'Salut salut, c’est encore Norman & Sébastien. Alors comme ça t’as vaincu Une Petite Souris ? On suppose que ça veut dire qu’il est temps d’ajouter un peu de nouveau gameplay qui déchire à ton aventure. D’abord, tu as débloqué l’AVENTURE. Pense à ça comme un « RPG pourri dans le jeu » : tu vas combattre des trucs et looter d’autres trucs. Les compétences d’entraînement que tu débloques deviennent des attaques utilisables en Aventure pour vaincre les ennemis !'
          ]
        },
        {
          titre:'Équipement',
          paragraphes:[
            'Des ennemis vont apparaître aléatoirement toutes les quelques secondes quand tu sors de la Zone Sûre. Combattre des ennemis en Aventure fait tomber de l’équipement, que tu peux équiper dans ton INVENTAIRE, juste en dessous dans cette même page Aventure ! L’équipement peut booster tes stats en Aventure ainsi que tes stats principales d’Attaque/Défense, et plus tard, offrir des bonus spéciaux du tonnerre !'
          ]
        },
        {
          titre:'Zones',
          paragraphes:[
            'Pour commencer, tu n’as débloqué que la zone d’entraînement. Vaincre des boss avec un numéro plus élevé débloquera petit à petit de nouvelles zones d’Aventure à explorer, avec du meilleur équipement à te coller sur le dos !',
            'AUSSI : les boss en Aventure ont une chance de faire tomber de l’EXP ! L’EXP, c’est bien.'
          ]
        },
        {
          titre:'Rebirth',
          paragraphes:[
            'Tu as aussi débloqué le menu Rebirth (une renaissance en français), ce qui mérite quelques explications.'
          ]
        },
        {
          titre:'Le NOMBRE',
          paragraphes:[
            'À un moment donné, tu vas arriver à un point où progresser prendra une éternité. Si tu fais un Rebirth (une renaissance en français), tu vas réinitialiser la plupart de ta progression dans chaque menu, et les boss vont être réinitialisés. En contrepartie, ton NOMBRE va grandir. Le NOMBRE, c’est... eh bien, c’est un nombre. Ton Attaque et ta Défense sont multipliées par ce NOMBRE, et ton NOMBRE peut devenir ridiculement énorme.'
          ]
        },
        {
          titre:'Le NOMBRE',
          paragraphes:[
            'Genre, bêtement énorme.'
          ]
        },
        {
          titre:'Le NOMBRE',
          paragraphes:[
            'Genre beaucoup plus gros que la plus grosse de tes copines.'
          ]
        },
        {
          titre:'Quand faire un Rebirth ?',
          paragraphes:[
            'Donc, dès que la progression te semble lente, c’est probablement le moment de faire un Rebirth (une renaissance en français), et de réinitialiser un peu de progression pour faire grimper ton nombre ! Tu peux essayer de faire un Rebirth maintenant si tu veux, mais si tu attends plus longtemps, ton NOMBRE grandira encore plus ! Le temps écoulé depuis ton dernier Rebirth est un facteur important pour la taille de ton NOMBRE, jusqu’à 60 minutes. Tu peux vérifier depuis combien de temps ton Rebirth est en cours dans la barre au-dessus.'
          ]
        },
        {
          titre:'Après le Rebirth',
          paragraphes:[
            'Quand tu fais un Rebirth (une renaissance en français), les boss réapparaissent aussi. Avec un NOMBRE assez élevé, tu peux vaincre des boss avec un numéro plus élevé, ce qui te donnera de l’EXP à chaque fois que tu les vaincs !'
          ]
        },
        {
          titre:'Norman & Sébastien',
          seulementPrecedent:true,
          paragraphes:[
            'Arrive au boss 17 et tu débloqueras encore autre chose ! À plus !',
            '— Norman & Sébastien'
          ]
        }
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-122 */
      const TUTORIEL_PREMIER_BOSS_PAGES_V1=[
        {
          cadrage:'bas',
          titre:'Norman & Sébastien',
          paragraphes:[
            'Oh hé, cool, tu as écrasé Un Petit Bout de Peluche. Plus important : ce sandwich est fantastique ! Jambon fromage et sauce mayonnaise volé à un ouvrier dans le frigo. Miam.'
          ]
        },
        {
          cadrage:'bas',
          titre:'Récompenses',
          paragraphes:[
            'Donc tuer des boss apporte quelques récompenses importantes : d’abord, tu gagnes de l’EXP. L’EXP sert à acheter des pouvoirs permanents dans le menu EXP Shop, qui vient aussi de se débloquer. Tu devrais voir un joli bouton bleu dans la barre en haut.'
          ]
        },
        {
          cadrage:'expEnergie',
          titre:'Conseil de pro',
          paragraphes:[
            'Il y a plein de trucs à acheter avec l’EXP, mais ne panique pas ! Notre conseil de pro : achète les offres spéciales qui augmentent la vitesse de remplissage de la barre d’Énergie. On les a faites spécifiquement pour des débutants comme toi... ne le prends pas mal.'
          ]
        },
        {
          cadrage:'bas',
          titre:'Norman & Sébastien',
          seulementPrecedent:true,
          paragraphes:[
            'Bats les prochains boss et on reviendra t’embêter. Norman & Sébastien, terminé !'
          ]
        }
      ];












      /*
       * Les trois tutoriels de Norman & Sébastien : chaque page peut être modifiée par l'administrateur. Les tableaux ci-dessus sont des constantes
       * dont l'IDENTITÉ compte (comparaisons plus bas) : on remplace donc leurs ÉLÉMENTS en place, par des copies portant le texte à afficher, le texte
       * à lire (_brut) et la clé de la page (_cle). Les pages d'origine sont gardées pour l'éditeur et pour « Rétablir ».
       */
      const TUTORIEL_TABLEAUX_TEXTES_V1={debut:TUTORIEL_DEBUT_JEU_PAGES_V1,aventure:TUTORIEL_AVENTURE_PAGES_V1,boss:TUTORIEL_PREMIER_BOSS_PAGES_V1};
      UI_PARTAGE_V1.__amorcer_392();
      UI_PARTAGE_V1.__amorcer_393();


      UI_PARTAGE_V1.__amorcer_395();

      UI_PARTAGE_V1.__amorcer_396();



      UI_PARTAGE_V1.__amorcer_399();

      UI_PARTAGE_V1.__amorcer_402();


      /*
       * Après le popup du sandwich (Norman, 2026-09-26) : « une voix se lance en arrière-plan : "Oui, je sais… Tu te dis, mais qu'est-ce que c'est que cette merde avec des chiffres
       * partout et des dessins d'enfants… d'ailleurs j'ai comme preuve cette dame qui a un mot à nous dire. À vous madame" — puis une voix de femme, qu'on grille que c'est un robot :
       * "J'ADORE SOREAL IDLE, CROYEZ TOUT CE QU'IL VOUS DIT" ». Les deux morceaux sont des fichiers pré-générés (la dame = voix « Siwis », reconnue par le texte exact de son bloc : estVoixFemme).
       * Lue seulement si la voix IA automatique est activée (le choix du joueur est respecté).
       */
      const VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1=
        'Oui, je sais… Tu te dis : mais qu’est-ce que c’est que cette merde, avec des chiffres partout et des dessins d’enfants ? Je me suis dit pareil la première fois. '+
        'Mais persiste, et tu vas voir qu’il est vraiment bien. D’ailleurs, j’ai comme preuve cette dame qui a un mot à nous dire. À vous, madame :'+
        pauseVoixIdleV1_(900)+
        'J’ADORE SOREAL IDLE. CROYEZ TOUT CE QU’IL VOUS DIT.';

      /*
       * Voix SANS texte à l'écran, éditables elles aussi (Norman, 2026-10-08 : « je veux absolument toutes les voix éditables, même celle qui se déclenche sans texte ») : la voix de fond du sandwich et l'introduction
       * « Chroniques de boss. » de la lecture des chroniques. Même éditeur que tous les textes (modules/textes-admin-v1.js), sous « Voix sans texte à l'écran » ; sans modification, le texte d'origine est lu tel quel.
       * Le texte d'origine est donné avec ses balises (pause, voix de la dame) : exactement les mêmes blocs que le texte codé ci-dessus, donc les voix déjà générées restent valables.
       */
      const CLE_VOIX_SANDWICH_IDLE_V1='systeme:sandwich';
      const CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1='systeme:chroniques-intro';
      const TEXTE_CHRONIQUES_INTRO_IDLE_V1='Chroniques de boss.';
      const TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1=baliseursPausesIdleV1_(VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1).replace('(pause 900ms) ','(pause 900ms) (femme) ');
      const CHAMPS_VOIX_SIMPLE_IDLE_V1=[{id:'texte',label:'Texte lu',type:'texte'}];
      UI_PARTAGE_V1.__amorcer_413();
      UI_PARTAGE_V1.__amorcer_414();
      /* Fight Boss et Titans (partie 2) : code dans modules/ui-combat-2-v1.js (découpage du monolithe, 2026-10-16). */



      UI_PARTAGE_V1.__amorcer_418();
      UI_PARTAGE_V1.__amorcer_419();




      UI_PARTAGE_V1.__amorcer_422();




      UI_PARTAGE_V1.__amorcer_425();


      UI_PARTAGE_V1.__amorcer_433();
      /*
       * Chroniques (Norman, 2026-10-08) : Collection, Classement et Succès réunis dans UN menu, pour avoir le moins de menus possible. Chaque onglet n'apparaît qu'une fois débloqué
       * (règle n°2 : jamais d'onglet verrouillé, ni de compteur révélateur) ; un seul onglet débloqué = pas de barre d'onglets. La page garde l'habillage de l'onglet affiché
       * (data-menu = l'onglet), donc chaque contenu conserve ses couleurs.
       */
      let idleChroniquesOngletV1='';
      UI_PARTAGE_V1.__amorcer_438();
      UI_PARTAGE_V1.__amorcer_445();
      /* Une couleur DIFFÉRENTE par menu (Norman, 2026-10-04 : « chacun sa couleur pour qu'on les repère mieux »). Le Shop est mauve, comme une boutique magique. */
      const IDLE_NAV_COULEURS_V1={
        entrainement:'#3b82f6',
        augmentations:'#f59e0b',
        combat:'#ef4444',
        aventure:'#16a34a',
        moneyPit:'#ca8a04',
        renaissance:'#8b5cf6',
        avance:'#38bdf8',
        machine:'#0f766e',
        sang:'#be123c',
        wandoos:'#84cc16',
        ngu:'#6366f1',
        yggdrasil:'#059669',
        diggers:'#92400e',
        beards:'#d4a373',
        tower:'#a8a29e',
        perks:'#facc15',
        challenges:'#fb7185',
        titans:'#7f1d1d',
        macguffins:'#ec4899',
        daycare:'#5eead4',
        questing:'#22d3ee',
        quirks:'#c026d3',
        hacks:'#4ade80',
        wishes:'#a78bfa',
        cards:'#f9a8d4',
        cooking:'#c2410c',
        chroniques:'#d9b45a',
        sellout:'#c084fc',
        spendExp:'#a855f7',
        shop:'#a855f7',
        chat:'#e879f9',
        setsZones:'#2dd4bf',
        parametres:'#9ca3af',
        admin:'#dc2626'
      };

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-132 */
      /*
       * Ordre par défaut = ordre dans lequel on obtient les menus (Norman, 2026-10-04 : « réarrange les menus chez tout le monde pour qu'ils suivent l'ordre où on les obtient ; les gens pourront les réarranger par la suite »).
       * Repères réels : les menus de départ, Adventure, Rebirth et Collection (boss 4), Money Pit (100 000 Gold), Augmentations (boss 17), Advanced Training (entraînement de base terminé),
       * Time Machine (30), Blood Magic (37), ITOPOD puis Perks (clé du Ciel, boss 48), Daycare (achat d'un emplacement), Challenges et Titans (58), puis les systèmes donnés par les objets des titans :
       * NGU et Wandoos (1er titan), Yggdrasil (66), Gold Diggers (82), Beards (100), MacGuffins (116), Hacks (125), Questing puis Quirks (132), Wishes (166), Cards, Cooking.
       * Shop (Boutique), Achievements, Classement, Chat, Settings (et Admin, visible du seul administrateur) viennent TOUJOURS en dernier, dans cet ordre, donc après le dernier menu débloqué : un menu qui se débloque s'intercale avant eux (Norman, même jour).
       * L'ordre choisi par un joueur reste prioritaire ; l'ancien rangement a été remis à zéro une fois (menuOrdreVersion 3, remise à zéro de Norman du 2026-10-04 : Boutique rejoint le groupe final).
       */
      const IDLE_MENUS_V1=[
        {id:'entrainement',icon:'🥊',nom:'Basic Training'},
        {id:'combat',icon:'⚔️',nom:'Fight Boss'},
        {id:'aventure',icon:'🗺️',nom:'Adventure'},
        {id:'renaissance',icon:'♻️',nom:'Rebirth'},
        {id:'moneyPit',icon:'🕳️',nom:'Money Pit'},
        {id:'augmentations',icon:'🦾',nom:'Augmentations'},
        {id:'avance',icon:'🏋️',nom:'Advanced Training'},
        {id:'machine',icon:'⏱️',nom:'Time Machine'},
        {id:'sang',icon:'🩸',nom:'Blood Magic'},
        {id:'tower',icon:'🏢',nom:'ITOPOD'},
        {id:'daycare',icon:'🛠️',nom:'Item Daycare'},
        {id:'challenges',icon:'🏁',nom:'Challenges'},
        {id:'titans',icon:'👹',nom:'Titans'},
        {id:'ngu',icon:'♾️',nom:'NGU'},
        {id:'wandoos',icon:'💻',nom:'Wandoos'},
        {id:'yggdrasil',icon:'🌱',nom:'Yggdrasil'},
        {id:'diggers',icon:'⛏️',nom:'Gold Diggers'},
        {id:'beards',icon:'🧔',nom:'Beards'},
        {id:'macguffins',icon:'🧩',nom:'MacGuffins'},
        {id:'hacks',icon:'🧪',nom:'Hacks'},
        {id:'questing',icon:'📋',nom:'Questing'},
        {id:'quirks',icon:'📚',nom:'Quirks'},
        {id:'wishes',icon:'🌠',nom:'Wishes'},
        {id:'cards',icon:'🃏',nom:'Cards'},
        {id:'cooking',icon:'🍲',nom:'Cooking'},
        {id:'shop',icon:'🔮',nom:'Boutique'},
        {id:'chroniques',icon:'📜',nom:'Chroniques'},
        {id:'chat',icon:'💬',nom:'Chat'},
        {id:'parametres',icon:'⚙️',nom:'Settings'},
        {id:'admin',icon:'🛠️',nom:'Admin'}
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-133 */
      let idleAdventureKoAlertV1=false;


      const IDLE_DISPO_MONEY_PIT_V1={pit:{couleur:'#2ecc71',classe:'soreal-idle-nav-money-green-v1'},roue:{couleur:'#f1c40f',classe:'soreal-idle-nav-money-yellow-v1'},calendrier:{couleur:'#ff9f1a',classe:'soreal-idle-nav-money-orange-v1'}};

      /* Pose / retire la lueur sur le bouton du menu sans attendre un redessin (une échéance peut tomber à tout moment). */
      let idleDispoMoneyPitDerniereV1='?';


      /*
       * Ordre des boutons du menu (2026-09-25, Norman : « quand on maintient son doigt sur un bouton du menu, on passe en mode "Rangement des
       * boutons" ; on glisse un bouton et on l'intercale entre deux autres ; un bouton pour valider, visible seulement dans ce mode »).
       * L'ordre choisi vit côté serveur (profil.stats.menuOrdre, opération definirOrdreMenusSorealIdle) avec un cache local ; un menu qui
       * n'est pas dans l'ordre enregistré (nouveau, ou débloqué plus tard) se place après le menu qui le précède dans l'ordre par défaut.
       */
      let idleMenuEditionV1=false;
      let idleMenuClicAvaleJusquaV1=0;








      /*
       * Nombre de lignes du menu du haut sur téléphone (Norman, 2026-10-08 : « quand les gens éditent l'ordre des icônes, ils peuvent choisir 1, 2 ou 3 lignes »). Gardé sur l'appareil (le téléphone et l'ordinateur n'ont pas
       * les mêmes besoins) ; 2 par défaut.
       */
      const CLE_RANGEES_MENU_IDLE_V1='soreal_idle_menu_rangees_v1';
      UI_PARTAGE_V1.__amorcer_474();




      UI_PARTAGE_V1.__amorcer_481();

      UI_PARTAGE_V1.__amorcer_483();











      UI_PARTAGE_V1.__amorcer_498();
      UI_PARTAGE_V1.__amorcer_499();



      let idleCombatLogV70=[];
      let idleCombatLogBossV70='';
      let idleCombatLogDernierResumeV70=0;
      let idleCombatLogDegatsJoueurV70=0;
      let idleCombatLogDegatsBossV70=0;
      let idleCombatLogDegatsBrutsV100=0;
      let idleCombatLogBloquesV70=0;

      let idleParalysieJusquaV70=0;
      let idleBouclierJusquaV70=0;
      let idleBouclierReductionV70=0;
      let idleFureurActiveV70=false;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-143 */
      const idleEffetsVisuelsJoueurV112={
        gel:0,
        feu:0,
        poison:0,
        stun:0
      };
      let idleEffetsSignatureV112='';






































      /* Notes de déblocage « (…) » en tête d'une histoire de boss + récit. Même découpage pour l'affichage et pour la voix pré-générée
         (cloudflare/tools/voice-generate.mjs recopie ce motif : un test compare les deux). */

      UI_PARTAGE_V1.__amorcer_544();














      let idleSortPurchaseQueueV101=[];
      let idleSortPurchaseBusyV101=false;
















      UI_PARTAGE_V1.__amorcer_562();

      UI_PARTAGE_V1.__amorcer_563();













      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-157 */












      UI_PARTAGE_V1.__amorcer_579();


      UI_PARTAGE_V1.__amorcer_580();

      UI_PARTAGE_V1.__amorcer_581();


      let idleOrLocalAtV1=0,idleOrLocalPatchV1=0;
      const IDLE_MENUS_VIVANTS_V1={ngu:1,wandoos:1,yggdrasil:1,diggers:1,beards:1,wishes:1,hacks:1,daycare:1};
      /* Doigt ou souris enfoncé : un redessin entre l'appui et le relâchement ferait perdre le clic. */
      let idlePointeurEnfonceV1=0;
      UI_PARTAGE_V1.__amorcer_587();
      let idleVictoireBossLocaleV49=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-158 */
      let idleCombatArmeLocalV206=false;
      let idleCombatStopFantomeEnvoyeV206=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-159 */
      let idleCombatEnPauseApresDefaiteV1=false;







      UI_PARTAGE_V1.__amorcer_597();

      UI_PARTAGE_V1.__amorcer_598();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-164 */
      let idleNukeEnCoursV1=false;






      UI_PARTAGE_V1.__amorcer_602();

      /*
       * Auto Nuker (Sellout Shop, 65 000 AP -- wiki : "automatically nuke bosses 10 seconds
       * into each rebirth, and then every minute afterwards"). Lance le même NUKE que le
       * bouton, à partir de l'horodatage de début de run exposé par le serveur.
       */
      let idleAutoNukeRunV1=0;
      let idleAutoNukeDernierV1=0;
      UI_PARTAGE_V1.__amorcer_606();







/* Les bulles de phrases du joueur sur « Fight Boss » (« Même pas peur », « Ça va finir au recyclage »… : restes de la toute première version) ont été retirées (Norman, 2026-10-08). */












      UI_PARTAGE_V1.__amorcer_622();



      UI_PARTAGE_V1.__amorcer_627();


      UI_PARTAGE_V1.__amorcer_630();

      UI_PARTAGE_V1.__amorcer_633();
      UI_PARTAGE_V1.__amorcer_634();
      UI_PARTAGE_V1.__amorcer_635();



      UI_PARTAGE_V1.__amorcer_637();






      let idleInventoryMutationQueueV160=[];
      let idleInventoryBusyV160=false;
      let idleInventorySequenceV160=0;
      let idleInventoryConfirmedAdventureV160=null;
      let idleInventoryDeferredPatchV160=false;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-179 */
      let idleAdventureRevisionServeurV208=0;









      const idleInventoryPerfV160={
        patches:0,
        nodesCreated:0,
        nodesReused:0,
        globalRenders:0,
        globalRendersAvoided:0,
        lastOptimisticMs:0,
        lastNetworkMs:0,
        lastReconcileMs:0
      };
      UI_PARTAGE_V1.__amorcer_658();




















      /* Après un redessin du sac : la fiche ouverte est rafraîchie, ou refermée si l'objet n'existe plus. */
      let idleFicheObjetOuverteIdV1='';




















      UI_PARTAGE_V1.__amorcer_705();
      UI_PARTAGE_V1.__amorcer_706();

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-189 */

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-190 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-191 */

      let idleAdventureFightNextPlayerHitV2=0;
      let idleAdventureFightNextEnemyHitV2=0;
      let idleAdventureFightLastRegenAtV2=0;
      let idleAdventureFightIdentityV2='';
      /* Comportements des titans (modules/titans-comportements-v1.js) : état du combat en cours, remis à zéro à chaque nouveau combat. */
      let idleTitanEtatV1=null;
      /* Effets visuels du combat (modules/combat-effets-v1.js) : jamais bloquants. */
      let idleFxSoinJusqua=0;
      let idleAdventureResolutionPendingV2='';
      let idleAdventureRespawnAtV1=0;
      let idleAdventureRespawnTimerV165=0;
      let idleAdventureRespawnStartPendingV165=false;







      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-194 */
      const IDLE_ADVENTURE_MANUAL_ATTACKS_V3=Object.freeze([
        {id:'regular',label:'Attaque',icon:'⚔️',btIndex:1,cooldown:1000,multiplier:1.5},
        {id:'strong',label:'Forte',icon:'💥',btIndex:2,cooldown:4000,multiplier:2},
        {id:'parry',label:'Parade',icon:'🛡️',btIndex:3,cooldown:15000,multiplier:1},
        {id:'piercing',label:'Perçante',icon:'🗡️',btIndex:4,cooldown:8000,multiplier:2,pierce:.33},
        {id:'ultimate',label:'Ultime',icon:'☄️',btIndex:5,cooldown:15000,multiplier:2}
      ]);
      const IDLE_ADVENTURE_MANUAL_DEFENSE_V3=Object.freeze([
        {id:'block',label:'Blocage',icon:'🛡️',btIndex:0,cooldown:10000},
        {id:'defensiveBuff',label:'Défense',icon:'🔷',btIndex:1,cooldown:45000},
        {id:'heal',label:'Soin',icon:'❤️',btIndex:2,cooldown:15000},
        {id:'offensiveBuff',label:'Puissance',icon:'🔶',btIndex:3,cooldown:45000},
        {id:'charge',label:'Charge',icon:'⚡',btIndex:4,cooldown:30000},
        {id:'ultimateBuff',label:'Bonus ultime',icon:'✨',btIndex:5,cooldown:45000}
      ]);
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-195 */
      const IDLE_ADVENTURE_ADVANCED_SKILLS_V4=Object.freeze([
        {id:'paralyze',label:'Paralyze',icon:'⏸️',cooldown:15000},
        {id:'hyperRegen',label:'Hyper Regen',icon:'💚',cooldown:35000},
        {id:'beastMode',label:'Beast Mode',icon:'🐲',cooldown:15000},
        {id:'megaBuff',label:'Mega Buff',icon:'🌟',cooldown:50000},
        {id:'ohShit',label:'Oh Shit',icon:'🚨',cooldown:35000},
        {id:'move69',label:'Move 69',icon:'69',cooldown:3600000}
      ]);

      let idleAdventureIdleModeV3=true;
      UI_PARTAGE_V1.__amorcer_739();
      const idleAdventureManualStateV3={
        cooldownUntil:Object.create(null),
        blockUntil:0,
        blockReduction:.5,
        defensiveBuffUntil:0,
        offensiveBuffUntil:0,
        ultimateBuffUntil:0,
        megaBuffUntil:0,
        enemyParalyzedUntil:0,
        hyperRegenUntil:0,
        charge:false,
        parryArmed:false,
        parryChargeMult:1
      };




















      UI_PARTAGE_V1.__amorcer_762();





      UI_PARTAGE_V1.__amorcer_768();
      UI_PARTAGE_V1.__amorcer_769();
      UI_PARTAGE_V1.__amorcer_770();
      UI_PARTAGE_V1.__amorcer_771();
      UI_PARTAGE_V1.__amorcer_772();
      UI_PARTAGE_V1.__amorcer_773();
 /* outil d'audit du redessin (modules/diag-fluidite-v1.js, __auditerRedessinIdleV1__) */
      UI_PARTAGE_V1.__amorcer_774();
      UI_PARTAGE_V1.__amorcer_776();
      UI_PARTAGE_V1.__amorcer_777();











      /*
       * 2026-09-23 (audit) : la régénération d'aventure paraissait instantanée.
       * Cause : adventureRestPv (PV de repos entre deux combats / en Safe Zone)
       * vivait dans idleEtat, qui est REMPLACÉ à chaque synchro serveur
       * (toutes les 15 s) par un objet où ce champ n'existe pas ; le tick
       * suivant lisait « null » et remettait les PV au maximum. Le PV de
       * repos est désormais mémorisé hors de idleEtat et réinjecté.
       */
      let idleAdventureRestPvMemoV1=null;








      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-208 */




      UI_PARTAGE_V1.__amorcer_805();


      /* Objet réel du sac -> clé d'objet de déblocage -> drapeau du système (mêmes correspondances que le serveur : idle-adventure-v47.js, UNLOCK_PAR_OBJET_V1 et unlockMap). */
      const IDLE_UNLOCK_PAR_OBJET_V1={aNumber:{cle:'aNumber',flag:'ngu',systeme:'NGU'},giantSeed:{cle:'giantSeed',flag:'yggdrasil',systeme:'Yggdrasil'},'scrap:paper':{cle:'scrapPaper',flag:'diggers',systeme:'Gold Diggers'},uugHair:{cle:'uugHair',flag:'beards',systeme:'Beards'},pissedOffKey:{cle:'pissedOffKey',flag:'tower',systeme:'ITOPOD'},wandoos98:{cle:'wandoos98',flag:'wandoos',systeme:'Wandoos'}};
      UI_PARTAGE_V1.__amorcer_811();

      UI_PARTAGE_V1.__amorcer_813();

      UI_PARTAGE_V1.__amorcer_815();

      UI_PARTAGE_V1.__amorcer_818();


      UI_PARTAGE_V1.__amorcer_821();






      UI_PARTAGE_V1.__amorcer_829();
      UI_PARTAGE_V1.__amorcer_830();

      UI_PARTAGE_V1.__amorcer_831();
      UI_PARTAGE_V1.__amorcer_832();
      UI_PARTAGE_V1.__amorcer_833();
      UI_PARTAGE_V1.__amorcer_834();
      UI_PARTAGE_V1.__amorcer_835();
      UI_PARTAGE_V1.__amorcer_836();



let idleVueAventureV1='zones';
      UI_PARTAGE_V1.__amorcer_840();







      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-234 */
      const ADVENTURE_CORE_SLOTS_V138=['head','chest','legs','boots','weapon','weapon2'];
      /* Seconde arme (Dual Wielding) : les 9 secondes armes des sets tardifs ne vont que dans ce slot (idle-adventure-v47.js, IDLE_SECOND_WEAPON_SLOTS_V1). */
      const ADVENTURE_SECOND_WEAPON_SLOTS_V1=['baguette','vinylShard','apple','hammer','shotgun','tulip','cutlass','rocket','deathstick'];















      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-241 */
      /*
       * Pages du sac (Norman, 2026-10-08) : 60 cases au plus par page (5 par ligne sur téléphone), au-delà une page de plus, comme dans NGU Idle.
       * Les numéros d'emplacement restent ABSOLUS (data-slot-index) : glisser-déposer, tri et rangement automatique ne changent pas.
       */
      const IDLE_SAC_CASES_PAR_PAGE_V1=60;
      let idlePageSacV1=1;
      UI_PARTAGE_V1.__amorcer_867();


      UI_PARTAGE_V1.__amorcer_872();

      let idleAdventureDragIdV138='';
      let idleAdventureIgnorerClicJusquaV165=0;
































      UI_PARTAGE_V1.__amorcer_919();

      /*
       * PC — popup d'objet au SURVOL (Norman, 2026-09-24 ; délai d'1s ajouté le 2026-09-26 ; délai
       * retiré le 2026-09-29 : « Il y a maintenant 2 fenêtre popup au survol d'un objet avec la
       * souris. Le popup instantané et celui qui met 1 secondes à s'ouvrir. Supprimer completement
       * celui qui met 1sec a s'ouvrir. » Réponse choisie par Norman : plus JAMAIS deux popups --
       * l'ancienne infobulle instantanée séparée (installerInfobulleObjetAdventureIdleV1_, stats
       * seules, sans bouton) est retirée, et c'est désormais le popup COMPLET
       * (soreal-idle-v138-details, boutons Équiper/Utiliser/Transformer...) qui s'ouvre au survol,
       * SANS délai. Souris seulement (le tactile garde le maintien long/double-tap). Le popup
       * s'ouvre à côté de l'objet ; un court délai de grâce à la FERMETURE laisse passer la souris
       * de l'objet au popup.
       */
      let idleSurvolIdV1='';
      let idleSurvolTimerFermerV1=0;
      let idleSurvolBloqueV1=false;
      /*
       * Délai d'ouverture (Norman, 2026-10-03 : « les fenêtres popup s'ouvrent trop vite au passage de la souris ; augmente à une demi-seconde ») : la souris doit rester 0,5 s sur l'objet.
       * Si elle le quitte avant, rien ne s'ouvre. (Entre-temps, le délai d'une seconde de 2026-09-26 avait été retiré parce qu'il laissait coexister DEUX popups ; ici il n'y en a toujours qu'un :
       * l'ancien se ferme dès qu'on change d'objet, et le nouveau n'apparaît qu'après le délai.)
       */
      /* 2026-10-04 (Norman) : « le popup de l'inventaire apparaît à 1,5 s sur PC » : 1500 ms (inventaire, Coffre et Collection partagent ce délai ; le tactile garde le maintien long). */
      const IDLE_SURVOL_DELAI_OUVERTURE_MS_V1=1500;
      let idleSurvolTimerOuvrirV1=0;
      let idleSurvolEnAttenteIdV1='';





      /*
       * Plus de popup au survol dans l'inventaire (Norman, 2026-10-15 : « au survol de la souris, le popup apparaît toujours dans l'inventaire ; j'ai demandé de le remplacer par un simple clic sur l'objet »).
       * La fiche d'un objet du sac ou de l'équipement s'ouvre par un clic (voir le tap-fiche des gestes d'inventaire, installerGestesInventaireAdventureIdleV196_) ; le survol n'ouvre plus rien.
       * (Le Coffre et la Collection gardent leur fiche au survol : leurs cases ne sont pas des objets du sac.)
       */

      UI_PARTAGE_V1.__amorcer_931();

      UI_PARTAGE_V1.__amorcer_932();
      UI_PARTAGE_V1.__amorcer_933();












      UI_PARTAGE_V1.__amorcer_944();


      let idleCubeDetailsTimerV1=0;
      UI_PARTAGE_V1.__amorcer_954();

      UI_PARTAGE_V1.__amorcer_961();
      UI_PARTAGE_V1.__amorcer_962();
      UI_PARTAGE_V1.__amorcer_963();







      UI_PARTAGE_V1.__amorcer_975();
      let idleSurvolVirtuelTimerV1=0;
      let idleSurvolVirtuelFermerV1=0;
      let idleSurvolVirtuelCleV1='';
      UI_PARTAGE_V1.__amorcer_979();

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-272 */
      let idleItemPopupPositionV1_=null;
      /* Les deux objets de la comparaison ouverte : un redessin du sac rafraîchit la fenêtre sans la refermer ni la réduire à un seul objet (Norman, 2026-10-15 : « Comparer se ferme tout seul »). */
      let idleComparaisonIdsV1=[];

      UI_PARTAGE_V1.__amorcer_992();
      UI_PARTAGE_V1.__amorcer_993();
      UI_PARTAGE_V1.__amorcer_994();

      UI_PARTAGE_V1.__amorcer_996();

      /*
       * Norman (2026-09-29) : « Il y a maintenant 2 fenêtre popup au survol d'un objet avec la
       * souris [...] Supprimer completement celui qui met 1sec a s'ouvrir. » L'infobulle de survol
       * légère (2026-09-29, lecture seule, séparée du popup interactif) est retirée : le popup
       * interactif complet (afficherDetailsObjetAdventureIdleV138_) s'ouvre désormais directement
       * au survol, sans délai -- voir le bloc "PC — popup d'objet au SURVOL" plus haut. Plus jamais
       * deux popups distincts au survol d'un objet.
       */

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-273 */

      UI_PARTAGE_V1.__amorcer_998();


      UI_PARTAGE_V1.__amorcer_999();
      UI_PARTAGE_V1.__amorcer_1000();

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-274 */
      const IDLE_PAGINATION_TAILLE_V1=60;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-275 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-276 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-277 */
      const IDLE_SPECIAL_BONUS_TYPES_V1_=[
        ["energySpeedPct","Energy Speed"],["energyPowerPct","Energy Power"],
        ["energyCapPct","Energy Cap"],["energyBarsPct","Energy Bars"],
        ["magicSpeedPct","Magic Speed"],["magicPowerPct","Magic Power"],
        ["magicCapPct","Magic Cap"],["magicBarsPct","Magic Bars"],
        ["dropChancePct","Drop Chance"],["goldDropsPct","Gold Drops"],
        ["beardSpeedPct","Beard Speed"],["nguSpeedPct","NGU Speed"],
        ["seedGainPct","Seed Gain"],
        ["r3PowerPct","Resource 3 Power"],["r3CapPct","Resource 3 Cap"],["r3BarsPct","Resource 3 Bars"],
        ["wishSpeedPct","Wish Speed"],["hackSpeedPct","Hack Speed"],["wandoosSpeedPct","Wandoos Speed"],
        ["respawnReductionPct","Respawn"],["yggdrasilYieldPct","Yggdrasil Yield"],["augmentSpeedPct","Augment Speed"],
        ["cookingPct","Cooking"],["questDropsPct","Quest Drops"],["moveCooldownPct","Move Cooldowns"],
        ["advancedTrainingPct","Advanced Training"],["daycareSpeedPct","Daycare Speed"],
        ["expPct","EXP"],["apPct","Arbitrary Points (AP)"]
      ];



      /* 2026-09-27 (Norman : « uniquement quand on est dans la zone tutoriel... une phrase qui explique aux gens
         comment ça fonctionne ») : mécanique vérifiée dans inventory-auto-v1.js (double-tap = équiper/fusionner ;
         touche A + clic, ou double-tap sur un objet déjà équipé = booster) — jamais une touche « 1 », qui n'existe pas. */


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-281 */
      let idlePageCoffreV1=1;
      UI_PARTAGE_V1.__amorcer_1010();

      /*
       * Recherche dans le Coffre (Norman, 2026-10-03 : « dans le coffre, on doit pouvoir taper une recherche, par exemple Magic power ; le filtre ne doit afficher que les items avec du Magic Power dans
       * leurs stats ; ça doit marcher aussi pour les noms d'items »). Sans accent ni majuscule. La phrase tapée doit se retrouver ENTIÈRE dans le nom de l'objet (ou de son set / sa zone) ou dans
       * UN SEUL intitulé de statistique : « magic power » ne ramène donc pas un objet qui a seulement « Magic Cap » et de la « Puissance ». Seules les cases déjà découvertes existent ici (anti-spoil).
       */
      let idleRechercheCoffreV1='';
      UI_PARTAGE_V1.__amorcer_1016();
      UI_PARTAGE_V1.__amorcer_1017();



      UI_PARTAGE_V1.__amorcer_1023();



      UI_PARTAGE_V1.__amorcer_1029();

      UI_PARTAGE_V1.__amorcer_1031();

      UI_PARTAGE_V1.__amorcer_1033();

      UI_PARTAGE_V1.__amorcer_1035();




      UI_PARTAGE_V1.__amorcer_1039();




      UI_PARTAGE_V1.__amorcer_1046();



      UI_PARTAGE_V1.__amorcer_1052();

      UI_PARTAGE_V1.__amorcer_1054();






      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-306 */
      const IDLE_SELLOUT_SHOP_CATEGORIES_V1={
        boosts1:'⚡ Boosts',
        boosts2:'🍀 Boosts (lots)',
        special1:'🛠️ Spécial 1',
        special2:'🛠️ Spécial 2',
        special3:'🛠️ Spécial 3',
        special4:'🛠️ Spécial 4',
        items:'💝 Objets',
        expPp:'⭐ EXP / PP'
      };



      /*
       * Boutique AP — même style « boutique » que la Boutique EXP (auvent, caisse, rayons en onglets, étagères), couleur du menu (mauve).
       * Norman (2026-09-24) : « Utilise le même style pour le AP shop que pour le XP Shop mais d'une couleur différente ».
       */
      let idleApOngletV1='';
      UI_PARTAGE_V1.__amorcer_1064();
      UI_PARTAGE_V1.__amorcer_1065();





















      UI_PARTAGE_V1.__amorcer_1082();

      UI_PARTAGE_V1.__amorcer_1083();

      UI_PARTAGE_V1.__amorcer_1084();






      UI_PARTAGE_V1.__amorcer_1092();
      /* Notes en PAGES (Norman, 2026-10-11) : une version par page, la plus récente d'abord, avec « Précédente » / « Suivante ». */
      let notesMajPageIdleV1_=0;
      UI_PARTAGE_V1.__amorcer_1094();
      UI_PARTAGE_V1.__amorcer_1095();

      UI_PARTAGE_V1.__amorcer_1096();
      UI_PARTAGE_V1.__amorcer_1097();
      UI_PARTAGE_V1.__amorcer_1099();
      UI_PARTAGE_V1.__amorcer_1102();
      UI_PARTAGE_V1.__amorcer_1103();
      UI_PARTAGE_V1.__amorcer_1104();
      UI_PARTAGE_V1.__amorcer_1105();
      /* Effets visuels (Norman, 2026-10-08) : orage (éclairs) et cheminée (lueur) peuvent être coupés pour les téléphones moins puissants ; actifs par défaut, mémorisés sur l'appareil. */
      const EFFETS_VISUELS_IDLE_V1=[
        {id:'orage',cle:'soreal_idle_effet_orage_v1',libelle:'⛈️ Orage : ciel sombre et éclairs (piste d’orage)'},
        {id:'feu',cle:'soreal_idle_effet_feu_v1',defaut:false,libelle:'🔥 Cheminée : lueur sur les bords de l’écran (piste de feu) — peut ralentir un téléphone'},
        {id:'nav',cle:'soreal_idle_effet_nav_v1',libelle:'🧭 Animations du menu du haut (cercles, battements, étoiles) — décoche pour alléger un téléphone lent'},
        {id:'decor',cle:'soreal_idle_effet_decor_v1',libelle:'🕯️ Décors animés des cadres (torches, bulles des barres, particules) — décoche pour alléger un téléphone lent'}
      ];
      UI_PARTAGE_V1.__amorcer_1112();


      UI_PARTAGE_V1.__amorcer_1119();


      UI_PARTAGE_V1.__amorcer_1122();

      UI_PARTAGE_V1.__amorcer_1124();

      UI_PARTAGE_V1.__amorcer_1126();

      UI_PARTAGE_V1.__amorcer_1128();

      UI_PARTAGE_V1.__amorcer_1130();


      UI_PARTAGE_V1.__amorcer_1133();



      UI_PARTAGE_V1.__amorcer_1136();



      UI_PARTAGE_V1.__amorcer_1143();


      UI_PARTAGE_V1.__amorcer_1145();

      UI_PARTAGE_V1.__amorcer_1146();



      /* Aucune image ne vient plus de Google (Norman, 2026-10-14) : tout est lu dans le stockage R2 du jeu. */









      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-322 */















      UI_PARTAGE_V1.__amorcer_1166();




      /* Essai du popup « Pendant ton absence » avec un état fourni (tests, serveur de développement). */

      /* Défilement du menu du haut en cours (doigt posé, ou élan dans la seconde qui suit le dernier mouvement). */
      let idleNavDefilementMsV1=0;
      let idleNavDoigtV1=false;
      UI_PARTAGE_V1.__amorcer_1174();











      UI_PARTAGE_V1.__amorcer_1181();



      UI_PARTAGE_V1.__amorcer_1183();


      UI_PARTAGE_V1.__amorcer_1184();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-346 */
      const ouvrirPageSorealOriginalV4=
        typeof window.ouvrirPage==='function'
          ?window.ouvrirPage
          :null;

      UI_PARTAGE_V1.__amorcer_1186();



      UI_PARTAGE_V1.__amorcer_1187();

      UI_PARTAGE_V1.__amorcer_1188();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-348 */
    })();
