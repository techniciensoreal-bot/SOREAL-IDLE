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
        achatsApParCategorieIdleV1_:achatsApParCategorieIdleV1_,
        actionMetaIdleV130_:actionMetaIdleV130_,
        afficherBoutonIdle_:afficherBoutonIdle_,
        ajusterVieDuelIdleV1_:ajusterVieDuelIdleV1_,
        ancreClicIdleV1_:ancreClicIdleV1_,
        annulerOuvertureIdleV104_:annulerOuvertureIdleV104_,
        articleApVisibleIdleV1_:articleApVisibleIdleV1_,
        attrHistoireVoixIdleV1_:attrHistoireVoixIdleV1_,
        aventureDebloqueeIdleV47_:aventureDebloqueeIdleV47_,
        aventureMetaIdleV47_:aventureMetaIdleV47_,
        basicTrainingIdleV120_:basicTrainingIdleV120_,
        boutonIdle_:boutonIdle_,
        champSaisieActifIdleV1_:champSaisieActifIdleV1_,
        chroniquesOngletActifIdleV1_:chroniquesOngletActifIdleV1_,
        chroniquesOngletsIdleV1_:chroniquesOngletsIdleV1_,
        composerCorpsComparaisonIdleV1_:composerCorpsComparaisonIdleV1_,
        conserverPositionIdleV24_:conserverPositionIdleV24_,
        dureeRunSecondesIdleV1_:dureeRunSecondesIdleV1_,
        energieDisponibleIdleV9_:energieDisponibleIdleV9_,
        energieGenereeTotaleIdleV1_:energieGenereeTotaleIdleV1_,
        energieLibreCoherenteIdleV1_:energieLibreCoherenteIdleV1_,
        entetePageIdleV28_:entetePageIdleV28_,
        equipementBloqueParDefiIdleV1_:equipementBloqueParDefiIdleV1_,
        fermerPanneauxInfoIdleV1_:fermerPanneauxInfoIdleV1_,
        formatDureeRunIdleV1_:formatDureeRunIdleV1_,
        formatEntierLisibleIdleV1_:formatEntierLisibleIdleV1_,
        formatGrandNombreIdleV70_:formatGrandNombreIdleV70_,
        formaterDureeJeuIdleV1_:formaterDureeJeuIdleV1_,
        formaterPvFixeIdleV1_:formaterPvFixeIdleV1_,
        fxIdleV1_:fxIdleV1_,
        generationJoueurIdleV75_:generationJoueurIdleV75_,
        gestesAchetesIdleV1_:gestesAchetesIdleV1_,
        idleDisponibiliteMoneyPitV1_:idleDisponibiliteMoneyPitV1_,
        idleEntier_:idleEntier_,
        idleFastCountObjectV60_:idleFastCountObjectV60_,
        idleFastPendingV60_:idleFastPendingV60_,
        idleHtml_:idleHtml_,
        idleInfoOuvertV1_:idleInfoOuvertV1_,
        idleLabelSpecialBonusV1_:idleLabelSpecialBonusV1_,
        idleNombre_:idleNombre_,
        idleVuConnuV1_:idleVuConnuV1_,
        idleVuMarquerV1_:idleVuMarquerV1_,
        infoMoneyPitIdleV1_:infoMoneyPitIdleV1_,
        infoSurchargeeIdleV1_:infoSurchargeeIdleV1_,
        infoSystemeGeneriqueIdleV1_:infoSystemeGeneriqueIdleV1_,
        installerMorphIdleV1_:installerMorphIdleV1_,
        langueIdleV1_:langueIdleV1_,
        magieEncoreAGenererIdleV1_:magieEncoreAGenererIdleV1_,
        memoriserRestPvIdleV1_:memoriserRestPvIdleV1_,
        menuStyleIdleV1_:menuStyleIdleV1_,
        menusOrdonnesIdleV1_:menusOrdonnesIdleV1_,
        messageFlottantIdleV32_:messageFlottantIdleV32_,
        metaOccupeIdleV130_:metaOccupeIdleV130_,
        normaliserRechercheIdleV1_:normaliserRechercheIdleV1_,
        notesMajIdleV1_:notesMajIdleV1_,
        pageSpendExpIdleV1_:pageSpendExpIdleV1_,
        pageSystemeMetaIdleV130_:pageSystemeMetaIdleV130_,
        pauseVoixIdleV1_:pauseVoixIdleV1_,
        planifierEnvoiRapideIdleV60_:planifierEnvoiRapideIdleV60_,
        poserFenetreComparaisonIdleV1_:poserFenetreComparaisonIdleV1_,
        pousserEtatVersRuntimePartageIdleV1_:pousserEtatVersRuntimePartageIdleV1_,
        rendrePaginationIdleV1_:rendrePaginationIdleV1_,
        rendrePendingIdleV7_:rendrePendingIdleV7_,
        restPvInitialIdleV1_:restPvInitialIdleV1_,
        restaurerAncreClicIdleV1_:restaurerAncreClicIdleV1_,
        resumeStatsIdleV28_:resumeStatsIdleV28_,
        sansBaliseVoixIdleV1_:sansBaliseVoixIdleV1_,
        specialAcceptePlusDeBoostIdleV1_:specialAcceptePlusDeBoostIdleV1_,
        systemeMetaParIdIdleV130_:systemeMetaParIdIdleV130_,
        texteNiveauParSecondeIdleV1_:texteNiveauParSecondeIdleV1_,
        texteVoixSansTexteIdleV1_:texteVoixSansTexteIdleV1_,
        titanJoueurParalyseIdleV1_:titanJoueurParalyseIdleV1_,
        titanMultDegatsJoueurIdleV1_:titanMultDegatsJoueurIdleV1_,
        toastIdleV5_:toastIdleV5_,
        urlJoueurR2IdleV1_:urlJoueurR2IdleV1_,
        urlMobR2IdleV1_:urlMobR2IdleV1_,
        utiliserObjetDeblocageIdleV1_:utiliserObjetDeblocageIdleV1_
      });
      Object.defineProperty(UI_PARTAGE_V1,'ADVENTURE_CORE_SLOTS_V138',{get:function(){return ADVENTURE_CORE_SLOTS_V138;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'ADVENTURE_SECOND_WEAPON_SLOTS_V1',{get:function(){return ADVENTURE_SECOND_WEAPON_SLOTS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CLE_RANGEES_MENU_IDLE_V1',{get:function(){return CLE_RANGEES_MENU_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CLE_SUCCES_VUS_V1',{get:function(){return CLE_SUCCES_VUS_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1',{get:function(){return CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1;},configurable:true});
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
      Object.defineProperty(UI_PARTAGE_V1,'IDLE_SYSTEME_PAR_MENU_V1',{get:function(){return IDLE_SYSTEME_PAR_MENU_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TEXTE_CHRONIQUES_INTRO_IDLE_V1',{get:function(){return TEXTE_CHRONIQUES_INTRO_IDLE_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_AVENTURE_PAGES_V1',{get:function(){return TUTORIEL_AVENTURE_PAGES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_DEBUT_JEU_PAGES_V1',{get:function(){return TUTORIEL_DEBUT_JEU_PAGES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_PREMIER_BOSS_PAGES_V1',{get:function(){return TUTORIEL_PREMIER_BOSS_PAGES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'TUTORIEL_TABLEAUX_TEXTES_V1',{get:function(){return TUTORIEL_TABLEAUX_TEXTES_V1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAchatEnCoursV5',{get:function(){return idleAchatEnCoursV5;},set:function(v){idleAchatEnCoursV5=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAchatsEnAttenteV7',{get:function(){return idleAchatsEnAttenteV7;},set:function(v){idleAchatsEnAttenteV7=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAchatsEnvoyesV23',{get:function(){return idleAchatsEnvoyesV23;},set:function(v){idleAchatsEnvoyesV23=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureComparerEnAttenteV183',{get:function(){return idleAdventureComparerEnAttenteV183;},set:function(v){idleAdventureComparerEnAttenteV183=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureDragIdV138',{get:function(){return idleAdventureDragIdV138;},set:function(v){idleAdventureDragIdV138=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightIdentityV2',{get:function(){return idleAdventureFightIdentityV2;},set:function(v){idleAdventureFightIdentityV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightLastRegenAtV2',{get:function(){return idleAdventureFightLastRegenAtV2;},set:function(v){idleAdventureFightLastRegenAtV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightNextEnemyHitV2',{get:function(){return idleAdventureFightNextEnemyHitV2;},set:function(v){idleAdventureFightNextEnemyHitV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureFightNextPlayerHitV2',{get:function(){return idleAdventureFightNextPlayerHitV2;},set:function(v){idleAdventureFightNextPlayerHitV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureGesteV196',{get:function(){return idleAdventureGesteV196;},set:function(v){idleAdventureGesteV196=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureIdleModeV3',{get:function(){return idleAdventureIdleModeV3;},set:function(v){idleAdventureIdleModeV3=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureIgnorerClicJusquaV165',{get:function(){return idleAdventureIgnorerClicJusquaV165;},set:function(v){idleAdventureIgnorerClicJusquaV165=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureKoAlertV1',{get:function(){return idleAdventureKoAlertV1;},set:function(v){idleAdventureKoAlertV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureManualStateV3',{get:function(){return idleAdventureManualStateV3;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureResolutionPendingV2',{get:function(){return idleAdventureResolutionPendingV2;},set:function(v){idleAdventureResolutionPendingV2=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRespawnAtV1',{get:function(){return idleAdventureRespawnAtV1;},set:function(v){idleAdventureRespawnAtV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRespawnStartPendingV165',{get:function(){return idleAdventureRespawnStartPendingV165;},set:function(v){idleAdventureRespawnStartPendingV165=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRespawnTimerV165',{get:function(){return idleAdventureRespawnTimerV165;},set:function(v){idleAdventureRespawnTimerV165=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAdventureRevisionServeurV208',{get:function(){return idleAdventureRevisionServeurV208;},set:function(v){idleAdventureRevisionServeurV208=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAllocOrdreV1',{get:function(){return idleAllocOrdreV1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleApOngletV1',{get:function(){return idleApOngletV1;},set:function(v){idleApOngletV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutoAventureV30',{get:function(){return idleAutoAventureV30;},set:function(v){idleAutoAventureV30=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutoZoneV30',{get:function(){return idleAutoZoneV30;},set:function(v){idleAutoZoneV30=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAutorise',{get:function(){return idleAutorise;},set:function(v){idleAutorise=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleAventureEnCoursV17',{get:function(){return idleAventureEnCoursV17;},set:function(v){idleAventureEnCoursV17=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBasicTrainingDirtyV120',{get:function(){return idleBasicTrainingDirtyV120;},set:function(v){idleBasicTrainingDirtyV120=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBasicTrainingSaveBusyV120',{get:function(){return idleBasicTrainingSaveBusyV120;},set:function(v){idleBasicTrainingSaveBusyV120=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBasicTrainingSaveTimerV120',{get:function(){return idleBasicTrainingSaveTimerV120;},set:function(v){idleBasicTrainingSaveTimerV120=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBouclierJusquaV70',{get:function(){return idleBouclierJusquaV70;},set:function(v){idleBouclierJusquaV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleBouclierReductionV70',{get:function(){return idleBouclierReductionV70;},set:function(v){idleBouclierReductionV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleChroniquesOngletV1',{get:function(){return idleChroniquesOngletV1;},set:function(v){idleChroniquesOngletV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatArmeLocalV206',{get:function(){return idleCombatArmeLocalV206;},set:function(v){idleCombatArmeLocalV206=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatEnPauseApresDefaiteV1',{get:function(){return idleCombatEnPauseApresDefaiteV1;},set:function(v){idleCombatEnPauseApresDefaiteV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogBloquesV70',{get:function(){return idleCombatLogBloquesV70;},set:function(v){idleCombatLogBloquesV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogBossV70',{get:function(){return idleCombatLogBossV70;},set:function(v){idleCombatLogBossV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDegatsBossV70',{get:function(){return idleCombatLogDegatsBossV70;},set:function(v){idleCombatLogDegatsBossV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDegatsBrutsV100',{get:function(){return idleCombatLogDegatsBrutsV100;},set:function(v){idleCombatLogDegatsBrutsV100=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDegatsJoueurV70',{get:function(){return idleCombatLogDegatsJoueurV70;},set:function(v){idleCombatLogDegatsJoueurV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogDernierResumeV70',{get:function(){return idleCombatLogDernierResumeV70;},set:function(v){idleCombatLogDernierResumeV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLogV70',{get:function(){return idleCombatLogV70;},set:function(v){idleCombatLogV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleCombatLotEnVolV1',{get:function(){return idleCombatLotEnVolV1;},set:function(v){idleCombatLotEnVolV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleComparaisonIdsV1',{get:function(){return idleComparaisonIdsV1;},set:function(v){idleComparaisonIdsV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleDernierTickLocalV40',{get:function(){return idleDernierTickLocalV40;},set:function(v){idleDernierTickLocalV40=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleDispoMoneyPitDerniereV1',{get:function(){return idleDispoMoneyPitDerniereV1;},set:function(v){idleDispoMoneyPitDerniereV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleEffetsSignatureV112',{get:function(){return idleEffetsSignatureV112;},set:function(v){idleEffetsSignatureV112=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleEffetsVisuelsJoueurV112',{get:function(){return idleEffetsVisuelsJoueurV112;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleEtat',{get:function(){return idleEtat;},set:function(v){idleEtat=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFastNetworkBusyV60',{get:function(){return idleFastNetworkBusyV60;},set:function(v){idleFastNetworkBusyV60=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFastPendingV60',{get:function(){return idleFastPendingV60;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFicheObjetOuverteIdV1',{get:function(){return idleFicheObjetOuverteIdV1;},set:function(v){idleFicheObjetOuverteIdV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFureurActiveV70',{get:function(){return idleFureurActiveV70;},set:function(v){idleFureurActiveV70=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleFxSoinJusqua',{get:function(){return idleFxSoinJusqua;},set:function(v){idleFxSoinJusqua=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryBusyV160',{get:function(){return idleInventoryBusyV160;},set:function(v){idleInventoryBusyV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryConfirmedAdventureV160',{get:function(){return idleInventoryConfirmedAdventureV160;},set:function(v){idleInventoryConfirmedAdventureV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryMutationQueueV160',{get:function(){return idleInventoryMutationQueueV160;},set:function(v){idleInventoryMutationQueueV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventoryPerfV160',{get:function(){return idleInventoryPerfV160;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleInventorySequenceV160',{get:function(){return idleInventorySequenceV160;},set:function(v){idleInventorySequenceV160=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleItemPopupPositionV1_',{get:function(){return idleItemPopupPositionV1_;},set:function(v){idleItemPopupPositionV1_=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuActifV28',{get:function(){return idleMenuActifV28;},set:function(v){idleMenuActifV28=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuClicAvaleJusquaV1',{get:function(){return idleMenuClicAvaleJusquaV1;},set:function(v){idleMenuClicAvaleJusquaV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuEditionV1',{get:function(){return idleMenuEditionV1;},set:function(v){idleMenuEditionV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleMenuOrdreTravailV1',{get:function(){return idleMenuOrdreTravailV1;},set:function(v){idleMenuOrdreTravailV1=v;},configurable:true});
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
      Object.defineProperty(UI_PARTAGE_V1,'idlePopupActifV75',{get:function(){return idlePopupActifV75;},set:function(v){idlePopupActifV75=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePopupBloqueCombatV102',{get:function(){return idlePopupBloqueCombatV102;},set:function(v){idlePopupBloqueCombatV102=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePopupQueueV75',{get:function(){return idlePopupQueueV75;},set:function(v){idlePopupQueueV75=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idlePrevisionBossV1',{get:function(){return idlePrevisionBossV1;},set:function(v){idlePrevisionBossV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRechercheCoffreV1',{get:function(){return idleRechercheCoffreV1;},set:function(v){idleRechercheCoffreV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRecycleBatchV32',{get:function(){return idleRecycleBatchV32;},set:function(v){idleRecycleBatchV32=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRecycleQueueV38',{get:function(){return idleRecycleQueueV38;},set:function(v){idleRecycleQueueV38=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleRenaissanceEnCoursV14',{get:function(){return idleRenaissanceEnCoursV14;},set:function(v){idleRenaissanceEnCoursV14=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleReserveAventureV23',{get:function(){return idleReserveAventureV23;},set:function(v){idleReserveAventureV23=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleResteTickEnergieMsV114',{get:function(){return idleResteTickEnergieMsV114;},set:function(v){idleResteTickEnergieMsV114=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleShopReconcileDemandeeV111',{get:function(){return idleShopReconcileDemandeeV111;},set:function(v){idleShopReconcileDemandeeV111=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSortPurchaseBusyV101',{get:function(){return idleSortPurchaseBusyV101;},set:function(v){idleSortPurchaseBusyV101=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSortPurchaseQueueV101',{get:function(){return idleSortPurchaseQueueV101;},set:function(v){idleSortPurchaseQueueV101=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleSyncEnCoursV60',{get:function(){return idleSyncEnCoursV60;},set:function(v){idleSyncEnCoursV60=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleTitanEtatV1',{get:function(){return idleTitanEtatV1;},set:function(v){idleTitanEtatV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleTutorielPagesEnCoursV1',{get:function(){return idleTutorielPagesEnCoursV1;},set:function(v){idleTutorielPagesEnCoursV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVictoireBossLocaleV49',{get:function(){return idleVictoireBossLocaleV49;},set:function(v){idleVictoireBossLocaleV49=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVueAventureV1',{get:function(){return idleVueAventureV1;},set:function(v){idleVueAventureV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVusEnAttenteV1',{get:function(){return idleVusEnAttenteV1;},set:function(v){idleVusEnAttenteV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVusMemoireV1',{get:function(){return idleVusMemoireV1;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'idleVusMigreV1',{get:function(){return idleVusMigreV1;},set:function(v){idleVusMigreV1=v;},configurable:true});
      Object.defineProperty(UI_PARTAGE_V1,'notesMajPageIdleV1_',{get:function(){return notesMajPageIdleV1_;},set:function(v){notesMajPageIdleV1_=v;},configurable:true});
      /*REG_END*/

      /* Rendu principal, synchronisation et chargement : code dans modules/ui-noyau-v1.js (découpage du monolithe, 2026-10-16). */
      function rendreIdleEtat_(){return UI_PARTAGE_V1.rendreIdleEtat_.apply(null,arguments);}
      function synchroniserJeuIdleV7_(){return UI_PARTAGE_V1.synchroniserJeuIdleV7_.apply(null,arguments);}
      function ouvrirSorealIdleAvecEtatV108_(){return UI_PARTAGE_V1.ouvrirSorealIdleAvecEtatV108_.apply(null,arguments);}
      function chargerSorealIdleNatifV4_(){return UI_PARTAGE_V1.chargerSorealIdleNatifV4_.apply(null,arguments);}
      const IDLE_CLIENT_PROTOCOL_VERSION=1;
      let idleAutorise=false;
      /* Outils d'administration : code dans modules/ui-admin-v1.js (découpage du monolithe, 2026-10-16). */
      function estAdminSorealIdle_(){return UI_PARTAGE_V1.estAdminSorealIdle_.apply(null,arguments);}
      /* Les modules d'édition (modules/textes-admin-v1.js) n'affichent leurs boutons que pour l'administrateur ; le serveur, lui, revérifie chaque opération. */
      window.__SOREAL_IDLE_EST_ADMIN_V1__=estAdminSorealIdle_;
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
      function changerPartieDevIdleV1_(partie){
        const cible=String(partie)==='b'?'b':'a';
        if(!idlePartieDevV1||!idlePartieDevV1.actif||idlePartieDevV1.partie===cible)return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              location.reload();
            }else{
              toastIdleV5_('Impossible de changer de partie.');
            }
          })
          .withFailureHandler(function(){
            toastIdleV5_('Impossible de changer de partie.');
          })
          .definirPartieDevSorealIdle(SOREAL_SESSION,cible);
      }
      window.__changerPartieDevIdleV1__=changerPartieDevIdleV1_;
      /* Partie B uniquement : recopie la partie A (lue, jamais modifiée) pour tester dans les mêmes conditions. */
      function copierPartieADevIdleV1_(){
        if(!idlePartieDevV1||!idlePartieDevV1.actif||idlePartieDevV1.partie!=='b')return;
        if(!window.confirm('Copier ta partie A sur la partie B ? La partie B actuelle sera remplacée. La partie A n’est pas modifiée.'))return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){location.reload();}
            else{toastIdleV5_('Copie impossible.');}
          })
          .withFailureHandler(function(){toastIdleV5_('Copie impossible.');})
          .copierPartieASurBSorealIdle(SOREAL_SESSION);
      }
      window.__copierPartieADevIdleV1__=copierPartieADevIdleV1_;
      /* Réglages et notes de version : code dans modules/ui-reglages-v1.js (découpage du monolithe, 2026-10-16). */
      function jouerEffetAudioIdleV199_(){return UI_PARTAGE_V1.jouerEffetAudioIdleV199_.apply(null,arguments);}
      function basculerNotesMajIdleV1_(){return UI_PARTAGE_V1.basculerNotesMajIdleV1_.apply(null,arguments);}
      /* Boucle de jeu locale (tick, expérience, effets visuels) : code dans modules/ui-boucle-v1.js (découpage du monolithe, 2026-10-16). */

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-6 */
      let idlePopupActifV75=false;
      let idlePopupQueueV75=[];
      let idlePopupBloqueCombatV102=false;
      let idleTutorielPagesEnCoursV1=null;

      /* Fight Boss et Titans : code dans modules/ui-combat-v1.js (découpage du monolithe, 2026-10-16). */
      function idImageBossCanoniqueIdleV181_(){return UI_PARTAGE_V1.idImageBossCanoniqueIdleV181_.apply(null,arguments);}
      function labelCapaciteBossIdleV70_(){return UI_PARTAGE_V1.labelCapaciteBossIdleV70_.apply(null,arguments);}
      function markupImageCombatIdleV61_(){return UI_PARTAGE_V1.markupImageCombatIdleV61_.apply(null,arguments);}
      function urlBossR2IdleV1_(){return UI_PARTAGE_V1.urlBossR2IdleV1_.apply(null,arguments);}
      function regenPvFightBossNguParSecondeV164_(){return UI_PARTAGE_V1.regenPvFightBossNguParSecondeV164_.apply(null,arguments);}
      function chargerCombatAutoIdleV30_(){return UI_PARTAGE_V1.chargerCombatAutoIdleV30_.apply(null,arguments);}
      function fermerCarteBossIdleV91_(){return UI_PARTAGE_V1.fermerCarteBossIdleV91_.apply(null,arguments);}
      function combattreDepuisCarteBossIdleV91_(){return UI_PARTAGE_V1.combattreDepuisCarteBossIdleV91_.apply(null,arguments);}
      function definirCombatBossIdleV39_(){return UI_PARTAGE_V1.definirCombatBossIdleV39_.apply(null,arguments);}
      function nukerBossIdleV1_(){return UI_PARTAGE_V1.nukerBossIdleV1_.apply(null,arguments);}
      function autoNukeDueIdleV1_(){return UI_PARTAGE_V1.autoNukeDueIdleV1_.apply(null,arguments);}
      function ouvrirBossCollectionIdleV1_(){return UI_PARTAGE_V1.ouvrirBossCollectionIdleV1_.apply(null,arguments);}
      function fermerBossCollectionIdleV1_(){return UI_PARTAGE_V1.fermerBossCollectionIdleV1_.apply(null,arguments);}
      function lireHistoireCompleteBossIdleV206_(){return UI_PARTAGE_V1.lireHistoireCompleteBossIdleV206_.apply(null,arguments);}
      function arreterCombatTitanIdleV1_(){return UI_PARTAGE_V1.arreterCombatTitanIdleV1_.apply(null,arguments);}
      function appliquerSynchroCombatSansReflowIdleV116_(){return UI_PARTAGE_V1.appliquerSynchroCombatSansReflowIdleV116_.apply(null,arguments);}




      let idleEtat=null;
      /* Synchronisation avec le serveur : code dans modules/ui-synchro-v1.js (découpage du monolithe, 2026-10-16). */
      function fightEnAttenteServeurIdleV1_(){return UI_PARTAGE_V1.fightEnAttenteServeurIdleV1_.apply(null,arguments);}
      function heureServeurIdleV1_(){return UI_PARTAGE_V1.heureServeurIdleV1_.apply(null,arguments);}
      function idleVusServeurV1_(){return UI_PARTAGE_V1.idleVusServeurV1_.apply(null,arguments);}
      function appelerProgressionIdleCloudflareV1_(){return UI_PARTAGE_V1.appelerProgressionIdleCloudflareV1_.apply(null,arguments);}
      window.__heureServeurIdleV1__=heureServeurIdleV1_;
      /* Lecture seule de l'état courant pour les modules (panneau Détail Attack/Defense, modules/stats-detail-v1.js). */
      window.__SOREAL_IDLE_LIRE_ETAT_V1__=function(){return idleEtat;};
      window.__SOREAL_IDLE_FORMAT_NOMBRE_V2__=function(n){return formatGrandNombreIdleV70_(n);};
      /* Augmentations : la couleur de la somme suit l'Or en direct, même sans énergie placée (un gain d'Or suffit à passer du rouge au vert). */
      setInterval(function(){
        if(!idleEtat||document.hidden)return;
        const or=idleNombre_(idleEtat.systemes&&idleEtat.systemes.currencies&&idleEtat.systemes.currencies.gold);
        document.querySelectorAll('[data-idle-aug-cout-v1][data-cout]').forEach(function(el){
          const assez=or>=Number(el.dataset.cout);
          if(el.classList.contains('ok')!==assez||el.classList.contains('non')===assez){el.classList.toggle('ok',assez);el.classList.toggle('non',!assez);}
        });
        /* Principe unique (Norman, 2026-10-08) : toute somme en Or est VERTE quand on l'a, ROUGE sinon ; une ligne « il manque … Or » est rouge. */
        document.querySelectorAll('[data-cout-or]').forEach(function(el){
          const assez=or>=Number(el.dataset.coutOr);
          if(el.classList.contains('or-ok')!==assez||el.classList.contains('or-non')===assez){el.classList.toggle('or-ok',assez);el.classList.toggle('or-non',!assez);}
        });
        document.querySelectorAll('[data-idle-aug-eta-v1],[id^="sorealIdleBloodEtaLineV1_"],.soreal-idle-tm-eta-v1').forEach(function(el){
          const manque=/il manque .* Or/i.test(el.textContent||'');
          if(el.classList.contains('or-non')!==manque)el.classList.toggle('or-non',manque);
        });
      },800);
      /*
       * Barres épuisées (Norman, 2026-10-10 : « quand les barres disparaissent, il reste un petit cadre prévu pour qu'elles réapparaissent : je n'en veux pas ; l'interface doit être collée à la barre de vie s'il n'y a
       * qu'une seule barre affichée »). Le « cliquet » du 2026-10-08, qui retenait la plus grande hauteur vue du bandeau (--hud-min-v2) pour que la page ne remonte pas, est SUPPRIMÉ : le bandeau prend exactement la
       * hauteur des barres affichées (les barres épuisées se replient en douceur, voir soreal-idle-themes.css) et tout ce qui est dessous remonte d'autant.
       */
      (function(){
        const racine=document.documentElement;
        racine.style.removeProperty('--hud-min-v2');
        const st=document.createElement('style');
        st.textContent='.soreal-idle-hud-v2{box-sizing:border-box}';
        document.head.appendChild(st);
        /*
         * Barre de vie du boss IDENTIQUE à celle du joueur du bandeau (Norman, 2026-10-09) : hauteur, rayon, ombres, police, reflet et cœur sont COPIÉS depuis la barre du joueur (styles calculés, donc
         * exacts sur téléphone comme sur PC) dans des variables CSS que la barre du boss lit. Seule la largeur diffère.
         */
        let copieStylePvFaiteV1=false;
        function copierStylePvV1_(){
          const w=document.querySelector('.soreal-idle-hud-pv-v2 .soreal-idle-energybar-wrap-v11');
          const o=w&&w.querySelector('.soreal-idle-energybar-overlay-v1');
          const f=w&&w.querySelector('.soreal-idle-hud-pvbar-v2');
          if(!w||!o||!f)return;
          const cw=getComputedStyle(w),co=getComputedStyle(o),af=getComputedStyle(w,'::after'),av=getComputedStyle(w,'::before');
          const lat=w.parentElement&&w.parentElement.querySelector('.soreal-idle-hud-lat-v2.d');
          const cl=lat?getComputedStyle(lat):null;
          /* Le bandeau et la borne sont zoomés (zoom CSS de la page sur PC) : les dimensions mesurées à l'écran sont ramenées en pixels de mise en page avant d'être copiées. */
          const rectW=w.getBoundingClientRect();
          const zoomW=w.offsetWidth>0?rectW.width/w.offsetWidth:1;
          const hauteur=rectW.height/(zoomW>0?zoomW:1);
          if(!(hauteur>0))return;
          const v={
            '--pv-h':hauteur+'px','--pv-r':cw.borderRadius,'--pv-ombre':cw.boxShadow,
            '--pv-ff':co.fontFamily,'--pv-fs':co.fontSize,'--pv-fw':co.fontWeight,'--pv-ls':co.letterSpacing,'--pv-ts':co.textShadow,
            '--pv-reflet-g':af.left,'--pv-reflet-d':af.right,'--pv-reflet-h':af.top,'--pv-reflet-ht':af.height,'--pv-reflet-r':af.borderRadius,
            '--pv-ic-g':av.left,'--pv-ic-fs':av.fontSize,
            '--pv-lat-fs':cl?cl.fontSize:'11px','--pv-lat-ts':cl?cl.textShadow:'none','--pv-lat-droite':lat?Math.round((rectW.right-lat.getBoundingClientRect().right)/(zoomW>0?zoomW:1))+'px':'9px'
          };
          Object.keys(v).forEach(function(k){if(racine.style.getPropertyValue(k)!==v[k])racine.style.setProperty(k,v[k]);});
          copieStylePvFaiteV1=true;
        }
        /*
         * Audit du 2026-10-10 (IDLE-AUDIT-FE-001) : ce sondage faisait 4 getComputedStyle + des mesures de mise en page toutes les 700 ms sur TOUTES les pages. Les variables --pv-* ne servent qu'à la barre du boss (menu Combat) et restent
         * sur :root : une fois copiées, on ne relit plus les styles qu'en menu Combat ; jamais quand l'onglet est caché.
         */
        setInterval(function(){
          if(document.hidden)return;
          if(copieStylePvFaiteV1&&!document.getElementById('sorealIdleBossBarV7'))return;
          copierStylePvV1_();
        },700);
        window.__SOREAL_IDLE_COPIER_STYLE_PV_V1__=copierStylePvV1_;
      })();
      /* Fin de défi : annoncée dès que la synchro l'apporte, sans attendre un rendu complet de la page (modules/challenges-v1.js). */
      setInterval(function(){
        if(!idleEtat||document.hidden)return;
        const defis=window.__SOREAL_IDLE_DEFIS_V1__;
        if(defis&&typeof defis.verifierFin==='function'){try{defis.verifierFin(idleEtat);}catch(_e){}}
      },1000);
      /* Bandeau : part de chaque barre déjà générée (disponible + dépensée), en pourcentage du plafond. */
      /*
       * La barre de Magie ne s'efface PAS tant qu'il reste de la Magie à générer (Norman, 2026-10-12 : « j'ai acheté 30K de plafond et la barre a mis 10 secondes à s'afficher » ; « j'ai mis MAX pour la Time Machine, il restait 2 minutes de
       * Magie à générer et pourtant la barre a disparu puis est réapparue »). Elle n'est « vide » que si plus rien n'est disponible ET qu'il n'y a plus rien à produire (plafond atteint ou production nulle).
       */
      function magieEncoreAGenererIdleV1_(){
        const m=typeof donneesMagieGenereeIdleV1_==='function'?donneesMagieGenereeIdleV1_():null;
        return !!(m&&m.parSeconde>0&&m.cap-m.generee>=1);
      }
      window.__SOREAL_IDLE_DISPONIBLE_V2__=function(){
        const b=idleEtat&&idleEtat.systemes&&idleEtat.systemes.resourceBudget&&idleEtat.systemes.resourceBudget.magic;
        const r=idleEtat&&idleEtat.systemes&&idleEtat.systemes.resources&&idleEtat.systemes.resources.magic;
        return {energie:energieDisponibleIdleV9_(),magie:b?idleNombre_(b.available):idleNombre_(r&&r.current),magieEnCours:magieEncoreAGenererIdleV1_()};
      };
      /* Menus, bandeau et barres du haut : code dans modules/ui-menus-v1.js (découpage du monolithe, 2026-10-16). */
      function infoBandeauIdleV2_(){return UI_PARTAGE_V1.infoBandeauIdleV2_.apply(null,arguments);}
      function tutorielPagesNaviguerV1_(){return UI_PARTAGE_V1.tutorielPagesNaviguerV1_.apply(null,arguments);}
      function annoncerNouveauxMenusIdleV1_(){return UI_PARTAGE_V1.annoncerNouveauxMenusIdleV1_.apply(null,arguments);}
      function rafraichirMenuRacineIdleV28_(){return UI_PARTAGE_V1.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
      function actualiserNavAlimenteIdleV1_(){return UI_PARTAGE_V1.actualiserNavAlimenteIdleV1_.apply(null,arguments);}
      function ordonnerMenusIdleV1_(){return UI_PARTAGE_V1.ordonnerMenusIdleV1_.apply(null,arguments);}
      function idleMenuOrdreEnregistreV1_(){return UI_PARTAGE_V1.idleMenuOrdreEnregistreV1_.apply(null,arguments);}
      function validerRangementMenuIdleV1_(){return UI_PARTAGE_V1.validerRangementMenuIdleV1_.apply(null,arguments);}
      function installerRangementMenuIdleV1_(){return UI_PARTAGE_V1.installerRangementMenuIdleV1_.apply(null,arguments);}
      function jouerSonMenuIdleV1_(){return UI_PARTAGE_V1.jouerSonMenuIdleV1_.apply(null,arguments);}
      window.__SOREAL_IDLE_BARRE_INFOS_V2__=function(){
        const e=idleEtat?infoBandeauIdleV2_(idleEtat.productionSeconde,idleNombre_(idleEtat.energieMax)-energieGenereeTotaleIdleV1_()):{vitesse:'',temps:''};
        const m=typeof donneesMagieGenereeIdleV1_==='function'?donneesMagieGenereeIdleV1_():null;
        return {energie:e,magie:m?infoBandeauIdleV2_(m.parSeconde,m.cap-m.generee):{vitesse:'',temps:''}};
      };
      /* Bandeau : la Vie s'écrit EXACTEMENT comme la barre de Fight Boss (mêmes formats, même fonction de mise à jour). */
      window.__SOREAL_IDLE_TEXTE_PV_V2__=function(pv,max){return formaterPvFixeIdleV1_(pv)+' / '+formaterPvFixeIdleV1_(max);};
      window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__=function(r){return r>0?'+'+formaterPvFixeIdleV1_(r)+'/s':'';};
      window.__SOREAL_IDLE_REGEN_PV_V2__=function(menu){
        if(!idleEtat)return 0;
        if(menu==='combat')return regenPvFightBossNguParSecondeV164_(idleEtat.defense);
        const a=aventureMetaIdleV47_(idleEtat);
        return a?regenReposAdventureIdleV3_(a,String(a.selectedZone||'safe')):regenPvFightBossNguParSecondeV164_(idleEtat.defense);
      };
      window.__SOREAL_IDLE_GENEREE_PCT_V2__=function(){
        const e=idleEtat&&idleEtat.energieMax>0?Math.min(100,energieGenereeTotaleIdleV1_()/idleEtat.energieMax*100):0;
        const m=typeof donneesMagieGenereeIdleV1_==='function'?donneesMagieGenereeIdleV1_():null;
        return {energie:e,magie:m&&m.cap>0?Math.min(100,m.generee/m.cap*100):0};
      };
      window.__SOREAL_IDLE_TEXTE_BARRE_V2__=function(valeur,max){return formatGrandNombreIdleV70_(valeur)+' / '+formatGrandNombreIdleV70_(max);};

      let idleBasicTrainingSaveTimerV120=null;
      /*
       * Ordre d'envoi des répartitions d'énergie (Norman, 2026-10-04) : Basic Training et les autres systèmes (Augmentations, Time Machine…) partent au serveur par deux canaux différés. Une répartition de l'un qui
       * dépend de ce que l'autre vient de libérer (ou d'occuper) doit arriver APRÈS lui, sinon le serveur la juge sur une énergie qui n'est pas encore à jour et la réduit. Chaque canal note l'instant de sa première
       * modification en attente ; il n'envoie pas tant que l'autre canal en a une plus ancienne (et récente : une attente de plus de 4 s est ignorée, jamais de blocage).
       */
      const idleAllocOrdreV1={n:0,bt:0,btAt:0,meta:0,metaAt:0};
      if(typeof window!=='undefined')window.__allocOrdreIdleV1__=idleAllocOrdreV1;
      let idleBasicTrainingSaveBusyV120=false;
      let idleBasicTrainingDirtyV120=false;

      function basicTrainingIdleV120_(){
        return idleEtat&&
          idleEtat.basicTraining&&
          typeof idleEtat.basicTraining==='object'
            ?idleEtat.basicTraining
            :null;
      }

      /* Entraînement de base (calculs locaux, envois, animations) : code dans modules/ui-entrainement-v1.js (découpage du monolithe, 2026-10-16). */
      function synchroBasicTrainingAcheteIdleV1_(){return UI_PARTAGE_V1.synchroBasicTrainingAcheteIdleV1_.apply(null,arguments);}
      function synchroBasicTrainingActifIdleV1_(){return UI_PARTAGE_V1.synchroBasicTrainingActifIdleV1_.apply(null,arguments);}
      function texteEtaBasicTrainingIdleV1_(){return UI_PARTAGE_V1.texteEtaBasicTrainingIdleV1_.apply(null,arguments);}
      function sommeAllocBasicTrainingJoueurIdleV1_(){return UI_PARTAGE_V1.sommeAllocBasicTrainingJoueurIdleV1_.apply(null,arguments);}
      function totalAllocationBasicTrainingIdleV120_(){return UI_PARTAGE_V1.totalAllocationBasicTrainingIdleV120_.apply(null,arguments);}
      function ajusterBasicTrainingIdleV120_(){return UI_PARTAGE_V1.ajusterBasicTrainingIdleV120_.apply(null,arguments);}
      function presetBasicTrainingIdleV120_(){return UI_PARTAGE_V1.presetBasicTrainingIdleV120_.apply(null,arguments);}
      function viderBasicTrainingIdleV120_(){return UI_PARTAGE_V1.viderBasicTrainingIdleV120_.apply(null,arguments);}


      /* Énergie, Magie et sorts : code dans modules/ui-magie-energie-v1.js (découpage du monolithe, 2026-10-16). */
      function rendreBarreEnergiePersistanteIdleV1_(){return UI_PARTAGE_V1.rendreBarreEnergiePersistanteIdleV1_.apply(null,arguments);}
      function donneesMagieGenereeIdleV1_(){return UI_PARTAGE_V1.donneesMagieGenereeIdleV1_.apply(null,arguments);}
      function allocationMetaEnergieIdleV1_(){return UI_PARTAGE_V1.allocationMetaEnergieIdleV1_.apply(null,arguments);}
      function idleParseFractionEnergieV1_(){return UI_PARTAGE_V1.idleParseFractionEnergieV1_.apply(null,arguments);}
      function installerInfobulleEnergieIdleV1_(){return UI_PARTAGE_V1.installerInfobulleEnergieIdleV1_.apply(null,arguments);}
      function rafraichirEnergieEtBoutonsIdleV9_(){return UI_PARTAGE_V1.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
      function acheterSortIdleV90_(){return UI_PARTAGE_V1.acheterSortIdleV90_.apply(null,arguments);}
      function lancerSortIdleV90_(){return UI_PARTAGE_V1.lancerSortIdleV90_.apply(null,arguments);}

      function sommeAllocMetaJoueurIdleV1_(joueur){
        const liste=joueur&&joueur.systemes&&Array.isArray(joueur.systemes.systems)?joueur.systemes.systems:[];
        return liste.reduce(function(t,sys){return t+Math.max(0,idleNombre_(sys&&sys.state&&sys.state.allocation&&sys.state.allocation.energy));},0);
      }
      function energieLibreCoherenteIdleV1_(joueur){
        if(!joueur)return 0;
        const libreServeur=idleNombre_(joueur.energie);
        const ecartBT=sommeAllocBasicTrainingJoueurIdleV1_(joueur)-totalAllocationBasicTrainingIdleV120_();
        const ecartMeta=sommeAllocMetaJoueurIdleV1_(joueur)-allocationMetaEnergieIdleV1_();
        return Math.max(0,Math.floor(libreServeur+ecartBT+ecartMeta+1e-9));
      }
      if(typeof window!=='undefined'){
        window.__energieLibreCoherenteIdleV1__=energieLibreCoherenteIdleV1_;
        /* Une répartition de Basic Training est-elle encore en route vers le serveur (minuteur, envoi en cours, modification à renvoyer) ? */
        window.__btAllocEnAttenteIdleV1__=function(){return Boolean(idleBasicTrainingSaveTimerV120||idleBasicTrainingSaveBusyV120||idleBasicTrainingDirtyV120);};
      }















      const IDLE_BT_SYNCHRO_CLE_V1='soreal_idle_bt_synchro_v1';


      window.__basculerSynchroBasicTrainingIdleV1__=function(coche){
        try{window.localStorage.setItem(IDLE_BT_SYNCHRO_CLE_V1,coche?'1':'0');}catch(e){}
      };








      window.__ajusterBasicTrainingIdleV120__=
        ajusterBasicTrainingIdleV120_;

      window.__presetBasicTrainingIdleV120__=
        presetBasicTrainingIdleV120_;

      window.__viderBasicTrainingIdleV120__=
        viderBasicTrainingIdleV120_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-22 */
      window.__energieDisponibleIdleV9__=
        energieDisponibleIdleV9_;



      function idleHtml_(v){
        return escapeHtml(String(v==null?'':v));
      }

      function idleNombre_(v){
        const n=Number(v);
        return Number.isFinite(n)?n:0;
      }

      function idleEntier_(v){
        return Math.max(0,Math.floor(idleNombre_(v)));
      }


      /*
       * Branché sur onblur/onchange d'un input "Input" (Basic Training/Augmentations/Time
       * Machine) : si la valeur tapée est une fraction "n/d", la réécrit en toutes lettres
       * (le joueur voit tout de suite le vrai montant, jamais "1/8" qui resterait affiché).
       * Sans effet si ce n'est pas une fraction (nombre déjà entier, champ vide...).
       */
      function idleResoudreFractionInputV1_(input){
        if(!input)return;
        const resolu=idleParseFractionEnergieV1_(input.value,idleEtat&&idleEtat.energie);
        if(resolu!=null)input.value=String(resolu);
      }
      window.__resoudreFractionInputIdleV1__=idleResoudreFractionInputV1_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-23 */
      function pousserEtatVersRuntimePartageIdleV1_(){
        if(
          window.__SOREAL_IDLE_RUNTIME_V1__&&
          typeof window.__SOREAL_IDLE_RUNTIME_V1__.pushState==='function'
        ){
          window.__SOREAL_IDLE_RUNTIME_V1__.pushState(idleEtat);
        }
      }

      /* Entier avec points entre les milliers (1.000.000) : les chiffres écrits en entier restent lisibles (Norman, 2026-10-10). */
      function formatEntierLisibleIdleV1_(v){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        const n=Math.floor(idleNombre_(v)+1e-9);
        return api&&typeof api.entierLisible==='function'?api.entierLisible(n):String(n);
      }


      function emojiObjetIdleV50_(objet){
        const presentation=window.__SOREAL_IDLE_ITEM_PRESENTATION_V1__;
        if(presentation&&typeof presentation.emojiObjet==='function'){
          return presentation.emojiObjet(objet);
        }
        return '📦 📦';
      }

      function boutonIdle_(){
        return document.getElementById('navButtonSorealIdle');
      }

      function afficherBoutonIdle_(visible){
        const bouton=boutonIdle_();
        if(!bouton)return;
        bouton.style.display=visible?'':'none';
      }







      let idleDernierTickLocalV40=Date.now();
      let idleResteTickEnergieMsV114=0;
















      /*
       * Les chiffres de vie du duel ne dépassent jamais de leur pastille (Norman, 2026-09-26 : « l'écriture de la vie dans les nouvelles barres dépasse ; ne les change pas mais fais en sorte que
       * ça ne dépasse jamais »). Même pastille, même taille de départ ; la police ne fait que rétrécir, par demi-pixel, tant que le texte est plus large que la pastille (cas des très grands
       * nombres ou du texte de régénération). Recalculé quand le texte ou la largeur de la carte change.
       */
      /* Les boutons de la borne (Fight / Fuite / Nuke) s'enfoncent le temps d'un appui, même très bref. */
      if(!window.__presseBorneIdleV1Installe){
        window.__presseBorneIdleV1Installe=true;
        document.addEventListener('pointerdown',function(ev){
          try{
            const bouton=ev.target&&ev.target.closest?ev.target.closest('.soreal-idle-boss-control-v39'):null;
            if(!bouton||bouton.disabled)return;
            const carte=bouton.closest('.soreal-idle-boss-current-v35');
            if(!carte)return;
            const nom=bouton.classList.contains('start')?'start':bouton.classList.contains('stop')?'stop':'nuke';
            carte.setAttribute('data-presse-v1',nom);
            setTimeout(function(){if(carte.getAttribute('data-presse-v1')===nom)carte.removeAttribute('data-presse-v1');},320);
          }catch(e){}
        },true);
      }
      /* Les trois boutons ronds de la borne déclenchent la commande de même couleur (un bouton grisé ne fait rien, comme la commande). */
      window.__clicDomeBorneIdleV1__=function(nom){
        try{
          const commande=document.querySelector('.soreal-idle-boss-control-v39.'+nom);
          if(commande&&!commande.disabled)commande.click();
        }catch(_e){}
      };
      function ajusterVieDuelIdleV1_(element,change){
        try{
          const parent=element.parentElement;
          if(!parent||!parent.classList||!parent.classList.contains('soreal-idle-duel-hp-v41'))return;
          const largeur=String(parent.clientWidth);
          /* Les PV bougent plusieurs fois par seconde : on ne remesure (retrait de la taille, lecture de largeur, rétrécissement) que si la largeur de la carte ou le NOMBRE de caractères change, pas à chaque chiffre. */
          const cleFit=largeur+'|'+element.textContent.length;
          if(element.getAttribute('data-fit-cle')===cleFit)return;
          element.setAttribute('data-fit-cle',cleFit);
          element.setAttribute('data-fit-largeur',largeur);
          element.style.removeProperty('font-size');
          element.style.removeProperty('white-space');
          element.style.removeProperty('overflow-wrap');
          let taille=parseFloat(window.getComputedStyle(element).fontSize)||12;
          let essais=0;
          while(element.scrollWidth>element.clientWidth+0.5&&taille>7&&essais<30){
            taille-=0.5;
            essais+=1;
            element.style.setProperty('font-size',taille+'px','important');
          }
          /* Cas extrême (texte très long dans une carte très étroite) : le texte passe sur deux lignes plutôt que de sortir de la pastille. */
          if(element.scrollWidth>element.clientWidth+0.5){
            element.style.setProperty('white-space','normal','important');
            element.style.setProperty('overflow-wrap','anywhere','important');
          }
        }catch(e){}
      }
      /*
       * Champs de quantité (Input, Target/Cible…) : un clic ou le focus sélectionne tout le contenu, pour que taper remplace le nombre au lieu
       * de devoir l'effacer (Norman, 2026-10-02). Seuls les champs numériques / de montant des menus de jeu : pas les champs de texte libres (pseudo, admin).
       */
      function champQuantiteIdleV1_(el){
        return !!(el&&el.tagName==='INPUT'&&(el.type==='number'||el.type==='text')&&!el.placeholder&&el.maxLength<0&&el.closest&&el.closest('.soreal-idle-page-root-v28'));
      }
      function toutSelectionnerIdleV1_(e){
        const el=e.target;
        if(!champQuantiteIdleV1_(el))return;
        try{el.select();}catch(err){}
      }
      document.addEventListener('focusin',function(e){
        const el=e.target;
        if(!champQuantiteIdleV1_(el))return;
        /* La sélection posée au focus est souvent défaite par le relâchement de la souris : on la repose juste après. */
        setTimeout(function(){try{el.select();}catch(err){}},0);
      },true);
      document.addEventListener('click',toutSelectionnerIdleV1_,true);

      window.addEventListener('resize',function(){
        document.querySelectorAll('.soreal-idle-duel-hp-v41 > .soreal-idle-note-v4').forEach(function(el){ajusterVieDuelIdleV1_(el,true);});
      });


      /*
       * 2026-09-23 : les nombres de PV / regen changeaient de largeur à chaque
       * rafraîchissement (formatGrandNombreIdleV70_ retire les zéros finaux :
       * "1.60" devenait "1.6") et le suffixe de regen disparaissait dès que les
       * PV étaient pleins, d'où un affichage qui clignote et dont les chiffres
       * bougent. Décimales fixes ici, suffixe toujours présent tant que la
       * regen est > 0, et chiffres tabulaires (soreal-idle-ui.css).
       */
      /*
       * Chiffres de vie du duel : TOUJOURS deux décimales, quelle que soit la valeur (Norman, 2026-10-02 : « de 35,04 à 35 les chiffres bougent ; 35,5 au lieu de 35,50
       * aussi »). « 35,00 » reste « 35,00 », « 1,50K » reste « 1,50K » : le nombre de caractères ne dépend que de l'ordre de grandeur, jamais du dernier chiffre.
       */
      function formaterPvFixeIdleV1_(valeur){
        const n=Math.max(0,idleNombre_(valeur));
        if(n<1000)return n.toFixed(2).replace('.',',');
        const suffixes=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid','Sxd','Spd','Ocd','Nod','Vg','Uvg','Dvg','Tvg','Qavg','Qivg','Sxvg','Spvg','Ocvg','Novg','Tg'];
        const rang=Math.floor(Math.log10(n)/3+1e-9);
        if(rang>=suffixes.length)return n.toExponential(2);
        return (n/Math.pow(1000,rang)).toFixed(2)+suffixes[rang];
      }

      function formaterDecimalesFixesIdleV1_(valeur,decimales){
        const n=idleNombre_(valeur);
        if(Math.abs(n)>=1000)return formatGrandNombreIdleV70_(n,decimales);
        return n.toFixed(Math.max(0,decimales)).replace('.',',');
      }





      /* Aventure (zones, combat d'aventure, équipement) : code dans modules/ui-aventure-v1.js (découpage du monolithe, 2026-10-16). */
      function iconeObjetAdventureIdleV138_(){return UI_PARTAGE_V1.iconeObjetAdventureIdleV138_.apply(null,arguments);}
      function libelleRecompenseSetAdventureIdleV163_(){return UI_PARTAGE_V1.libelleRecompenseSetAdventureIdleV163_.apply(null,arguments);}
      function regenReposAdventureIdleV3_(){return UI_PARTAGE_V1.regenReposAdventureIdleV3_.apply(null,arguments);}
      function surveillerEvenementsAventureIdleV1_(){return UI_PARTAGE_V1.surveillerEvenementsAventureIdleV1_.apply(null,arguments);}
      function dessinerJournalAventureIdleV1_(){return UI_PARTAGE_V1.dessinerJournalAventureIdleV1_.apply(null,arguments);}
      function ajouterLogAventureIdleV1_(){return UI_PARTAGE_V1.ajouterLogAventureIdleV1_.apply(null,arguments);}
      function zoneAdventurePrecedenteV1_(){return UI_PARTAGE_V1.zoneAdventurePrecedenteV1_.apply(null,arguments);}
      function zoneAdventureSuivanteV1_(){return UI_PARTAGE_V1.zoneAdventureSuivanteV1_.apply(null,arguments);}
      function basculerIdleModeAdventureIdleV3_(){return UI_PARTAGE_V1.basculerIdleModeAdventureIdleV3_.apply(null,arguments);}
      function utiliserCompetenceAdventureIdleV3_(){return UI_PARTAGE_V1.utiliserCompetenceAdventureIdleV3_.apply(null,arguments);}
      function rendreCommandesAdventureIdleV3_(){return UI_PARTAGE_V1.rendreCommandesAdventureIdleV3_.apply(null,arguments);}
      function competenceAdventureDisponibleIdleV4_(){return UI_PARTAGE_V1.competenceAdventureDisponibleIdleV4_.apply(null,arguments);}
      function actionAdventureIdleV47_(){return UI_PARTAGE_V1.actionAdventureIdleV47_.apply(null,arguments);}
      function consommerDeblocageAdventureIdleV47_(){return UI_PARTAGE_V1.consommerDeblocageAdventureIdleV47_.apply(null,arguments);}
      function consommerObjetSkillAdventureIdleV4_(){return UI_PARTAGE_V1.consommerObjetSkillAdventureIdleV4_.apply(null,arguments);}
      function transformerObjetAdventureIdleV4_(){return UI_PARTAGE_V1.transformerObjetAdventureIdleV4_.apply(null,arguments);}
      function desequiperObjetAdventureIdleV47_(){return UI_PARTAGE_V1.desequiperObjetAdventureIdleV47_.apply(null,arguments);}
      function toggleMenuZoneAdventureIdleV1_(){return UI_PARTAGE_V1.toggleMenuZoneAdventureIdleV1_.apply(null,arguments);}
      function selectionnerZoneAdventureIdleV47_(){return UI_PARTAGE_V1.selectionnerZoneAdventureIdleV47_.apply(null,arguments);}
      function equiperParIdAdventureIdleV138_(){return UI_PARTAGE_V1.equiperParIdAdventureIdleV138_.apply(null,arguments);}
      function deposerSurEmplacementVideSacAdventureIdleV1_(){return UI_PARTAGE_V1.deposerSurEmplacementVideSacAdventureIdleV1_.apply(null,arguments);}
      function installerGestesInventaireAdventureIdleV196_(){return UI_PARTAGE_V1.installerGestesInventaireAdventureIdleV196_.apply(null,arguments);}
      function popupDetailsObjetAdventureIdleOuvertV207_(){return UI_PARTAGE_V1.popupDetailsObjetAdventureIdleOuvertV207_.apply(null,arguments);}
      function fermerDetailsObjetAdventureIdleV1_(){return UI_PARTAGE_V1.fermerDetailsObjetAdventureIdleV1_.apply(null,arguments);}
      function ouvrirDetailsObjetParGesteAdventureIdleV196_(){return UI_PARTAGE_V1.ouvrirDetailsObjetParGesteAdventureIdleV196_.apply(null,arguments);}
      function elementObjetGesteAdventureIdleV196_(){return UI_PARTAGE_V1.elementObjetGesteAdventureIdleV196_.apply(null,arguments);}
      function deposerSurCubeAdventureIdleV138_(){return UI_PARTAGE_V1.deposerSurCubeAdventureIdleV138_.apply(null,arguments);}
      function clicCubeAdventureIdleV138_(){return UI_PARTAGE_V1.clicCubeAdventureIdleV138_.apply(null,arguments);}
      function deposerSurTrashAdventureIdleV138_(){return UI_PARTAGE_V1.deposerSurTrashAdventureIdleV138_.apply(null,arguments);}
      function supprimerObjetAdventureIdleV165_(){return UI_PARTAGE_V1.supprimerObjetAdventureIdleV165_.apply(null,arguments);}
      function basculerVerrouObjetAdventureIdleV165_(){return UI_PARTAGE_V1.basculerVerrouObjetAdventureIdleV165_.apply(null,arguments);}
      function cibleDansPopupDetailsObjetAdventureIdleV207_(){return UI_PARTAGE_V1.cibleDansPopupDetailsObjetAdventureIdleV207_.apply(null,arguments);}
      function afficherDetailsObjetAdventureIdleV138_(){return UI_PARTAGE_V1.afficherDetailsObjetAdventureIdleV138_.apply(null,arguments);}
      function activerGlisserPopupObjetAdventureIdleV1_(){return UI_PARTAGE_V1.activerGlisserPopupObjetAdventureIdleV1_.apply(null,arguments);}
      function comparerObjetAdventureIdleV183_(){return UI_PARTAGE_V1.comparerObjetAdventureIdleV183_.apply(null,arguments);}
      function fermerComparaisonObjetAdventureIdleV183_(){return UI_PARTAGE_V1.fermerComparaisonObjetAdventureIdleV183_.apply(null,arguments);}
      function clicTrashAdventureIdleV138_(){return UI_PARTAGE_V1.clicTrashAdventureIdleV138_.apply(null,arguments);}
      function survolCibleAdventureIdleV138_(){return UI_PARTAGE_V1.survolCibleAdventureIdleV138_.apply(null,arguments);}
      function quitterCibleAdventureIdleV138_(){return UI_PARTAGE_V1.quitterCibleAdventureIdleV138_.apply(null,arguments);}
      function grilleCoffreAdventureIdleV1_(){return UI_PARTAGE_V1.grilleCoffreAdventureIdleV1_.apply(null,arguments);}
      function toggleCoffreOuvertAdventureIdleV1_(){return UI_PARTAGE_V1.toggleCoffreOuvertAdventureIdleV1_.apply(null,arguments);}
      function deposerSurCoffreAdventureIdleV1_(){return UI_PARTAGE_V1.deposerSurCoffreAdventureIdleV1_.apply(null,arguments);}
      function clicCoffreAdventureIdleV1_(){return UI_PARTAGE_V1.clicCoffreAdventureIdleV1_.apply(null,arguments);}
      function retirerDuCoffreAdventureIdleV1_(){return UI_PARTAGE_V1.retirerDuCoffreAdventureIdleV1_.apply(null,arguments);}
      function estMutationInventaireAdventureIdleV160_(){return UI_PARTAGE_V1.estMutationInventaireAdventureIdleV160_.apply(null,arguments);}
      function patchInventaireAdventureIdleV160_(){return UI_PARTAGE_V1.patchInventaireAdventureIdleV160_.apply(null,arguments);}
      function patchZoneAdventureSansReflowIdleV1_(){return UI_PARTAGE_V1.patchZoneAdventureSansReflowIdleV1_.apply(null,arguments);}
      function idleRareteClasseObjetAdventureIdleV1_(){return UI_PARTAGE_V1.idleRareteClasseObjetAdventureIdleV1_.apply(null,arguments);}

      /*
       * Boss suivant instantané (Norman, 2026-10-02 : « quand on bat un boss, le suivant met énormément de temps à apparaître : ça doit être instantané »).
       * À la victoire prédite le client affiche tout de suite le boss suivant (état fourni d'avance par le serveur : bossSuivant) ; tant que le serveur
       * n'a pas confirmé la victoire (bossVaincus du serveur >= prédit), ses réponses -- qui décrivent encore l'ancien boss -- ne remplacent PAS l'affichage.
       * Au-delà de 15 s sans confirmation, la prévision est abandonnée et l'état du serveur fait foi (surveillerConfirmationVictoireBossIdleV1_).
       */
      let idlePrevisionBossV1={actif:false,vaincus:0,debut:0};





      /* Machine temporelle (comptes à rebours, barres) : code dans modules/ui-machine-temporelle-v1.js (découpage du monolithe, 2026-10-16). */
      function patcherBarresTimeMachineIdleV1_(){return UI_PARTAGE_V1.patcherBarresTimeMachineIdleV1_.apply(null,arguments);}




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
      function coutAchatsIdleV23_(){return UI_PARTAGE_V1.coutAchatsIdleV23_.apply(null,arguments);}
      function changerOngletShopIdleV1_(){return UI_PARTAGE_V1.changerOngletShopIdleV1_.apply(null,arguments);}



      function coutPendingIdleV7_(
        j,
        type
      ){
        return coutAchatsIdleV23_(
          j,
          type,
          idleAchatsEnAttenteV7
        );
      }


      function coutEnvoyesIdleV23_(
        j,
        type
      ){
        return coutAchatsIdleV23_(
          j,
          type,
          idleAchatsEnvoyesV23
        );
      }


      function libererFocusIdleV24_(){
        const actif=
          document.activeElement;

        if(
          actif &&
          typeof actif.blur==='function'
        ){
          actif.blur();
        }
      }


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
      try{
        document.addEventListener('pointerdown',function(ev){
          try{
            const cible=ev.target&&ev.target.closest?ev.target.closest('button,[onclick],a,summary,select,label,.soreal-idle-v138-bag-card,.soreal-idle-v138-slot'):null;
            idleDernierClicAncreV1=cible?{el:cible,t:Date.now(),y:window.scrollY||0}:null;
          }catch(_e){}
        },true);
      }catch(_e){}
      /* Éléments « jumeaux » d'un bouton : même balise, même action (onclick) et mêmes classes ; le rang parmi eux sert à le retrouver après le rendu, même si le nombre d'éléments avant lui a changé. */
      function jumeauxClicIdleV1_(racine,tag,onclick,classes){
        return Array.prototype.filter.call(racine.getElementsByTagName(tag),function(n){
          /* Les classes (ON/OFF, actif...) changent avec l action : on ne s appuie que sur la balise et l action. */
          return (n.getAttribute('onclick')||'')===onclick;
        });
      }
      function ancreClicIdleV1_(){
        try{
          const c=idleDernierClicAncreV1;
          if(!c||Date.now()-c.t>5000||!c.el.isConnected)return null;
          if(Math.abs((window.scrollY||0)-c.y)>40)return null;
          const racine=document.querySelector('.soreal-idle-page-root-v28');
          if(!racine||!racine.contains(c.el))return null;
          const r=c.el.getBoundingClientRect();
          if(r.bottom<=0||r.top>=(window.innerHeight||0))return null;
          const chemin=[];
          let n=c.el;
          while(n&&n!==racine){
            const parent=n.parentElement;
            if(!parent)return null;
            chemin.unshift(Array.prototype.indexOf.call(parent.children,n));
            n=parent;
          }
          if(n!==racine)return null;
          return signatureClicIdleV1_(c.el,racine,chemin,hautSansTransformIdleV1_(c.el));
        }catch(_e){return null;}
      }
      function signatureClicIdleV1_(el,racine,chemin,haut){
        const onclick=el.getAttribute('onclick')||'';
        const classes=String(el.className||'');
        const rang=jumeauxClicIdleV1_(racine,el.tagName,onclick,classes).indexOf(el);
        return {chemin:chemin,tag:el.tagName,id:el.id||'',onclick:onclick,classes:classes,rang:rang,texte:String(el.textContent||'').trim().slice(0,24),haut:haut};
      }
      /*
       * Épingle de clic : pendant 5 s après un clic (assez pour une réponse lente du serveur) dans la page, ce qui a été touché reste exactement au même endroit de l'écran, quoi que le rendu, les images qui se chargent ou un
       * bloc qui apparaît au-dessus fassent à la hauteur de la page. S'arrête dès que le joueur défile lui-même (molette, doigt, clavier). Ignorée pour les éléments fixes (fenêtres,
       * menus flottants) et pour la barre de menus, hors de la page.
       */
      let idlePinClicV1=null;
      function arreterPinClicIdleV1_(){
        if(idlePinClicV1){cancelAnimationFrame(idlePinClicV1.raf);idlePinClicV1=null;}
      }
      /*
       * Position du bouton SANS sa transformation (Norman, 2026-10-08 : « quand je presse le clavier de Wandoos la page fait un mini mouvement ; quand on trie, aussi, très léger »). Un bouton pressé s'enfonce de
       * quelques pixels (translate au :active, touches de Wandoos) : mesurée à l'instant du clic, sa position était décalée, et quand le doigt se levait la page « se corrigeait » de ces quelques pixels.
       */
      function hautSansTransformIdleV1_(e){
        const r=e.getBoundingClientRect();
        let ty=0;
        try{
          const t=window.getComputedStyle(e).transform;
          if(t&&t!=='none'){
            const m=t.match(/matrix(3d)?(([^)]+))/);
            if(m){
              const v=m[2].split(',').map(Number);
              ty=m[1]?(v[13]||0):(v[5]||0);
            }
          }
        }catch(_e){}
        return r.top-ty;
      }
      function demarrerPinClicIdleV1_(el){
        try{
          arreterPinClicIdleV1_();
          const racine=document.querySelector('.soreal-idle-page-root-v28');
          if(!racine||!racine.contains(el))return;
          for(let n=el;n&&n!==racine;n=n.parentElement){
            if(window.getComputedStyle(n).position==='fixed')return;
          }
          const r=el.getBoundingClientRect();
          if(r.bottom<=0||r.top>=(window.innerHeight||0))return;
          const chemin=[];
          let n=el;
          while(n&&n!==racine){
            const parent=n.parentElement;
            if(!parent)return;
            chemin.unshift(Array.prototype.indexOf.call(parent.children,n));
            n=parent;
          }
          const hautStable=hautSansTransformIdleV1_(el);
          const pin={ancre:signatureClicIdleV1_(el,racine,chemin,hautStable),haut:hautStable,debut:performance.now(),raf:0};
          idlePinClicV1=pin;
          (function boucle(){
            if(idlePinClicV1!==pin)return;
            if(performance.now()-pin.debut>5000){idlePinClicV1=null;return;}
            /* L element est gardé en mémoire : on ne le cherche de nouveau (balayage de la page) que s il a quitté la page. Pin arrêtée quand tout est stable depuis 1,5 s (au moins 3 s après le clic). */
            let e=pin.cache;
            if(!e||!e.isConnected){e=retrouverElementClicIdleV1_(pin.ancre);pin.cache=e;}
            if(e){
              const r=e.getBoundingClientRect();
              if(r.width||r.height){
                const dy=hautSansTransformIdleV1_(e)-pin.haut;
                if(Math.abs(dy)>1){window.scrollBy(0,dy);pin.stables=0;}else pin.stables=(pin.stables||0)+1;
              }
            }
            if((pin.stables||0)>=90&&performance.now()-pin.debut>3000){idlePinClicV1=null;return;}
            pin.raf=requestAnimationFrame(boucle);
          })();
        }catch(_e){}
      }
      try{
        ['wheel','touchstart','touchmove','keydown'].forEach(function(nom){
          window.addEventListener(nom,arreterPinClicIdleV1_,{passive:true,capture:true});
        });
        /* Un appui sur la barre de défilement (à droite) est un défilement du joueur : l épingle s arrête. */
        document.addEventListener('pointerdown',function(ev){
          try{if(ev.clientX>=document.documentElement.clientWidth)arreterPinClicIdleV1_();}catch(_e){}
        },true);
        document.addEventListener('click',function(ev){
          try{
            const cible=ev.target&&ev.target.closest?ev.target.closest('button,[onclick],a,summary,select,label,.soreal-idle-v138-bag-card,.soreal-idle-v138-slot'):null;
            if(cible)demarrerPinClicIdleV1_(cible);
          }catch(_e){}
        },true);
      }catch(_e){}
      function retrouverElementClicIdleV1_(ancre){
        if(ancre.id){const parId=document.getElementById(ancre.id);if(parId)return parId;}
        const racine=document.querySelector('.soreal-idle-page-root-v28');
        if(!racine)return null;
        if(ancre.onclick){
          const jumeaux=jumeauxClicIdleV1_(racine,ancre.tag,ancre.onclick,ancre.classes);
          if(jumeaux.length)return jumeaux[Math.min(Math.max(0,ancre.rang),jumeaux.length-1)];
        }
        let n=racine;
        for(let i=0;n&&i<ancre.chemin.length;i+=1)n=n.children[ancre.chemin[i]];
        return n&&n.tagName===ancre.tag&&String(n.textContent||'').trim().slice(0,24)===ancre.texte?n:null;
      }
      function restaurerAncreClicIdleV1_(ancre,xAvant){
        if(!ancre)return false;
        let dernierY=null;
        let trouve=false;
        function caler(){
          const el=retrouverElementClicIdleV1_(ancre);
          /* Introuvable ou devenu invisible (menu déroulant refermé, panneau replié) : on ne s appuie pas dessus. */
          if(!el||!(el.offsetWidth||el.offsetHeight||el.getClientRects().length))return;
          trouve=true;
          /* Le joueur a défilé lui-même depuis notre dernier calage : on n'y touche plus. */
          if(dernierY!==null&&Math.abs((window.scrollY||0)-dernierY)>2)return;
          const ecart=hautSansTransformIdleV1_(el)-ancre.haut;
          if(Math.abs(ecart)>1)window.scrollTo(xAvant,(window.scrollY||0)+ecart);
          dernierY=window.scrollY||0;
        }
        caler();
        setTimeout(caler,120);
        setTimeout(caler,450);
        return trouve;
      }
      /* Inventaire, Coffre et sacs : code dans modules/ui-inventaire-v1.js (découpage du monolithe, 2026-10-16). */
      function forgerEquipementIdleV25_(){return UI_PARTAGE_V1.forgerEquipementIdleV25_.apply(null,arguments);}
      function refuserEquipementDefiIdleV1_(){return UI_PARTAGE_V1.refuserEquipementDefiIdleV1_.apply(null,arguments);}
      function changerPageCollectionEquipementV1_(){return UI_PARTAGE_V1.changerPageCollectionEquipementV1_.apply(null,arguments);}
      function changerPageSacV1_(){return UI_PARTAGE_V1.changerPageSacV1_.apply(null,arguments);}
      function changerPageCoffreV1_(){return UI_PARTAGE_V1.changerPageCoffreV1_.apply(null,arguments);}
      function protegerJoueurServeurInventaireIdleV208_(){return UI_PARTAGE_V1.protegerJoueurServeurInventaireIdleV208_.apply(null,arguments);}

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

      /*
       * Norman (2026-09-27) : « Quand on ouvre et ferme le coffre, il y a un effet de clignotement. Il y en a plusieurs
       * dans le jeu... Part à la traque de ces sauts d'images et neutralise-les. La page ne doit jamais faire de saut ou
       * se déplacer sauf pendant les tutoriaux ou si c'est explicitement demandé. »
       *
       * Cause : chaque bascule d'onglet/panneau à l'intérieur d'une page (Coffre ouvert/fermé, pagination Coffre/Collection,
       * onglets Shop/Classement, notes de mise à jour, encart Infos, sauvegarde du pseudo, interrupteurs admin) remplace
       * .soreal-idle-page-root-v28 en entier (root.innerHTML=contenuMenuIdleV28_(...)) sans AUCUNE protection de défilement
       * -- contrairement au rendu complet (rendreIdleEtat_) qui, lui, gèle la hauteur du document pendant le remplacement
       * et restaure le défilement après coup (ancreSacIdleV1_/restaurerAncreSacIdleV1_, déjà en place depuis 2026-09-26).
       * Une page qui se raccourcit (ex. fermer le Coffre) fait alors automatiquement redescendre le défilement du
       * navigateur avant que rien ne le rétablisse -- exactement le saut/clignotement décrit. Cette fonction applique la
       * même protection à ces remplacements locaux, au lieu de dupliquer la logique à chaque site d'appel.
       */
      /* Rendu sur place : le moteur vit dans modules/morph-v1.js (extrait le 2026-10-07). Sans lui, innerHTML garde son comportement normal. */
      function installerMorphIdleV1_(element){
        const M=window.__SOREAL_IDLE_MORPH_V1__;
        if(M&&typeof M.installer==='function')M.installer(element);
      }

      /* Menu de gauche (PC) : sa hauteur maximale suit la place réellement visible sous lui (fenêtre - sa position), sinon, page non défilée (bannière au-dessus), son bas dépassait de l'écran et il fallait faire descendre la page centrale (Norman, 2026-10-15). */
      (function(){
        let attente=false;
        function ajuster(){
          attente=false;
          const nav=document.querySelector('.soreal-idle-native-v4>.soreal-idle-nav-v28');
          if(!nav)return;
          const haut=nav.getBoundingClientRect().top;
          const dispo=Math.max(160,Math.floor(window.innerHeight-Math.max(haut,12)-12));
          if(nav.style.getPropertyValue('--nav-dispo')!==dispo+'px')nav.style.setProperty('--nav-dispo',dispo+'px');
        }
        function planifier(){if(attente)return;attente=true;requestAnimationFrame(ajuster);}
        window.addEventListener('scroll',planifier,{passive:true});
        window.addEventListener('resize',planifier);
        (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(ajuster);
        window.__ajusterMenuHauteurIdleV1__=ajuster;
        setInterval(ajuster,1500);
      })();



      if(!window.__SOREAL_IDLE_EVENEMENTS_AVENTURE_V1__){
        window.__SOREAL_IDLE_EVENEMENTS_AVENTURE_V1__=setInterval(function(){
          try{surveillerEvenementsAventureIdleV1_();}catch(_e){}
        },1000);
      }

      function toastIdleV5_(message){
        /* Codes d erreur des défis -> phrase française (modules/challenges-v1.js). */
        if(window.__SOREAL_IDLE_DEFIS_V1__&&typeof message==="string")message=window.__SOREAL_IDLE_DEFIS_V1__.traduire(message);
        if(window.__SOREAL_IDLE_TITANS_V1__&&typeof message==="string")message=window.__SOREAL_IDLE_TITANS_V1__.traduire(message);
        const el=document.getElementById("sorealIdleToastV5");
        /* Sans cet élément (absent de la page), ces messages restent silencieux, comme avant : les afficher faisait revenir des textes comme « Aucun combat n est en cours » en permanence (Norman, 2026-10-07). */
        if(!el)return;
        el.textContent=
          String(message||'');

        el.classList.add(
          'visible'
        );

        setTimeout(function(){
          if(el){
            el.classList.remove(
              'visible'
            );
          }
        },1800);
      }

      function energieReserveeIdleV23_(){
        if(!idleEtat){
          return 0;
        }

        return (
          coutEnvoyesIdleV23_(
            idleEtat,
            'force'
          ) +
          coutEnvoyesIdleV23_(
            idleEtat,
            'endurance'
          ) +
          coutEnvoyesIdleV23_(
            idleEtat,
            'organisation'
          ) +
          coutPendingIdleV7_(
            idleEtat,
            'force'
          ) +
          coutPendingIdleV7_(
            idleEtat,
            'endurance'
          ) +
          coutPendingIdleV7_(
            idleEtat,
            'organisation'
          ) +
          Math.max(
            0,
            idleNombre_(
              idleReserveAventureV23
            )
          )
        );
      }


      function energieDisponibleIdleV9_(){
        if(!idleEtat){
          return 0;
        }

        return Math.max(
          0,
          idleNombre_(
            idleEtat.energie
          ) -
          energieReserveeIdleV23_()
        );
      }


      /*
       * 2026-09-24 (Norman : « au-dessus de la barre d'énergie, un compteur avec les mêmes chiffres que la barre verte, mais avec le total
       * RÉELLEMENT GÉNÉRÉ et non le total actuel : ça permet de savoir combien il nous reste à partager ; avoir les deux informations est
       * utile ») : barre verte = énergie disponible ; compteur = disponible + déjà placée (Basic Training et tous les autres systèmes).
       */
      function energieGenereeTotaleIdleV1_(){
        if(!idleEtat)return 0;
        return energieDisponibleIdleV9_()+
          totalAllocationBasicTrainingIdleV120_()+
          allocationMetaEnergieIdleV1_();
      }






      /* Norman (2026-10-01) : « Niveau par seconde » à la place de « Tick » et « Production », identique pour l'Énergie et la Magie. */
      function texteNiveauParSecondeIdleV1_(parSeconde){
        return 'Niveau par seconde : +'+idleNombre_(parSeconde).toLocaleString('fr-FR',{maximumFractionDigits:2})+'/s';
      }














      installerInfobulleEnergieIdleV1_();

      /*
       * Raccourcis NGU : « Tap R to reclaim Energy from all features except training » (Energy) ; « Pressing T will reclaim all allocated Magic
       * from all features » (Magic). Le serveur (action reclaimResource) laisse Basic Training réservé.
       */
      function installerRaccourcisReprendreIdleV1_(){
        if(window.__sorealIdleRaccourcisReprendreV1)return;
        window.__sorealIdleRaccourcisReprendreV1=true;
        document.addEventListener('keydown',function(ev){
          if(ev.ctrlKey||ev.metaKey||ev.altKey||ev.repeat)return;
          const cible=ev.target;
          if(cible&&(cible.tagName==='INPUT'||cible.tagName==='TEXTAREA'||cible.tagName==='SELECT'||cible.isContentEditable))return;
          if(PAGE_ACTIVE!=='idle'||!idleEtat||!SOREAL_SESSION)return;
          const touche=String(ev.key||'').toLowerCase();
          if(touche!=='r'&&touche!=='t')return;
          const ressource=touche==='r'?'energy':'magic';
          if(ressource==='magic'&&!(idleEtat.systemes&&idleEtat.systemes.resourceInfo&&idleEtat.systemes.resourceInfo.magic))return;
          ev.preventDefault();
          if(typeof window.__actionMetaV47__==='function'){
            window.__actionMetaV47__({action:'reclaimResource',resource:ressource});
            toastIdleV5_(ressource==='energy'
              ?'⚡ Énergie récupérée (sauf entraînement).'
              :'🔮 Magie récupérée.');
          }
        });
      }
      installerRaccourcisReprendreIdleV1_();




      function rendrePendingIdleV7_(){
        ['force','endurance','organisation']
          .forEach(function(type){
            const el=
              document.getElementById(
                'sorealIdlePendingV7_'+type
              );

            if(!el)return;

            const q=
              idleEntier_(
                idleAchatsEnAttenteV7[type]
              )+
              idleEntier_(
                idleAchatsEnvoyesV23[type]
              );

            el.textContent=
              q>0
                ?' +'+q+' réservé'
                :'';
          });

        rafraichirEnergieEtBoutonsIdleV9_();
      }




      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-88 */
      let idleFastNetworkBusyV60=false;
      let idleFastSendTimerV60=null;
      /* Actions rapides, lots et recyclage : code dans modules/ui-actions-rapides-v1.js (découpage du monolithe, 2026-10-16). */
      function envoyerProchaineActionRapideIdleV60_(){return UI_PARTAGE_V1.envoyerProchaineActionRapideIdleV60_.apply(null,arguments);}
      function planifierRenduOptimisteIdleV60_(){return UI_PARTAGE_V1.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
      function ajouterActionRapideIdleV60_(){return UI_PARTAGE_V1.ajouterActionRapideIdleV60_.apply(null,arguments);}
      function recyclerObjetsOptimisteIdleV32_(){return UI_PARTAGE_V1.recyclerObjetsOptimisteIdleV32_.apply(null,arguments);}
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


      function idleFastCountObjectV60_(
        objet
      ){
        return Object.keys(
          objet||{}
        ).reduce(
          function(total,cle){
            return total+
              Math.max(
                0,
                idleEntier_(
                  objet[cle]
                )
              );
          },
          0
        );
      }


      /*
       * Fight grisé tant que le serveur n'a pas validé (Norman, 2026-10-03 : « tant que le combat n'a pas été validé côté serveur, le bouton Fight reste grisé et on ne peut pas cliquer »).
       * Le serveur n'a pas fini de valider quand : une victoire prédite n'est pas confirmée, ou un ordre de combat (démarrage, fuite, défaite) est en attente d'envoi ou en vol.
       */
      let idleCombatLotEnVolV1=false;
      function idleFastPendingV60_(){
        return Boolean(
          idleFastPendingV60.equip.length ||
          idleFastPendingV60.fusion.length ||
          idleFastCountObjectV60_(
            idleFastPendingV60.shop
          ) ||
          idleFastCountObjectV60_(
            idleFastPendingV60.forge
          ) ||
          idleFastPendingV60.bag>0 ||
          idleFastPendingV60.combat!==null ||
          idleFastPendingV60.autoBoss!==null ||
          idleFastPendingV60.autoAdventure!==null ||
          idleFastPendingV60.boss!==null ||
          idleFastPendingV60.zone!==null
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
























      /* page Personnage et profil : rendu dans modules/page-personnage-v1.js (découpage du monolithe, 2026-10-16). */
      function pagePersonnageIdleV28_(){return window.__SOREAL_IDLE_PAGE_PERSONNAGE_V1__.pagePersonnageIdleV28_.apply(null,arguments);}
      function htmlProfilPseudoIdleV1_(){return window.__SOREAL_IDLE_PAGE_PERSONNAGE_V1__.htmlProfilPseudoIdleV1_.apply(null,arguments);}








      window.__forgerEquipementIdleV25__=forgerEquipementIdleV25_;


      function rendreSlotEquipeIdleV10_(
        titre,
        objet
      ){
        return `
          <div class="soreal-idle-equip-slot-v10 ${objet?idleHtml_(objet.rarete||'commun'):'commun'}">
            ${
              objet
                ?'<div class="soreal-idle-equipped-icon-v50">'+
                  emojiObjetIdleV50_(objet)+
                  '</div>'
                :''
            }
            <div class="soreal-idle-equip-slot-title-v10">
              ${idleHtml_(titre)}
            </div>
            <div class="soreal-idle-equip-slot-name-v10">
              ${
                objet
                  ?idleHtml_(objet.nom)+
                    (
                      idleEntier_(objet.fusion)>0
                        ?' <span class="soreal-idle-equipped-level-v31">+'+
                          idleEntier_(objet.fusion)+
                          '</span>'
                        :''
                    )
                  :'Aucun objet'
              }
            </div>
            <div class="soreal-idle-equip-slot-bonus-v10">
              ${
                objet
                  ?'+'+
                    idleEntier_(objet.bonusPuissance)+
                    ' puissance · Forge +'+
                    idleEntier_(objet.forge)+
                    (
                      objet.setNom
                        ?' · 🧩 '+idleHtml_(objet.setNom)
                        :''
                    )
                  :'—'
              }
            </div>
            ${
              objet
                ?'<button type="button" class="soreal-idle-forge-button-v25" onclick="window.__forgerEquipementIdleV25__(\''+
                  idleHtml_(objet.slot)+
                  '\')">🔥 Améliorer · '+
                  idleEntier_(
                    idleEtat&&idleEtat.forge&&idleEtat.forge[objet.slot]&&idleEtat.forge[objet.slot].cout
                  )+
                  ' matériaux</button>'
                :''
            }
          </div>
        `;
      }

      let idleRecycleBatchV32=false;
      let idleRecycleQueueV38=[];













      function messageFlottantIdleV32_(
        texte
      ){
        const ancien=
          document.getElementById(
            'sorealIdleToastV32'
          );

        if(ancien){
          ancien.remove();
        }

        const el=
          document.createElement(
            'div'
          );

        el.id=
          'sorealIdleToastV32';
        el.className=
          'soreal-idle-toast-inline-v32';
        el.textContent=
          String(texte||'');

        document.body.appendChild(el);

        setTimeout(function(){
          if(el&&el.parentNode){
            el.remove();
          }
        },2500);
      }



































      function equiperObjetIdleV10_(
        objetId
      ){
        libererFocusIdleV24_();
        if(equipementBloqueParDefiIdleV1_()){
          refuserEquipementDefiIdleV1_();
          return;
        }

        if(
          !idleEtat ||
          !objetId ||
          !SOREAL_SESSION
        ){
          return;
        }

        jouerEffetAudioIdleV199_('equip');

        const inventaire=
          Array.isArray(
            idleEtat.inventaire
          )
            ?idleEtat.inventaire
            :[];

        const objet=
          inventaire.find(
            function(item){
              return String(
                item&&item.id||''
              )===
              String(
                objetId
              );
            }
          );

        if(!objet){
          return;
        }

        if(!idleEtat.equipement){
          idleEtat.equipement={};
        }

        const slot=
          String(
            objet.slot||''
          );

        const ancien=
          idleEtat.equipement[
            slot
          ]||null;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-95 */
        idleEtat.equipement[
          slot
        ]=
          objet;

        if(!ancien){
          idleEtat.inventaireUtilise=
            Math.max(
              0,
              idleEntier_(
                idleEtat.inventaireUtilise
              )-1
            );

          idleEtat.inventaireLibre=
            Math.max(
              0,
              idleEntier_(
                idleEtat.inventaireCapacite
              )-
              idleEntier_(
                idleEtat.inventaireUtilise
              )
            );
        }

        if(!idleEtat.forge){
          idleEtat.forge={};
        }

        const forgeMeta=
          idleEtat.forgeMeta||{
            base:5,
            croissance:1.65
          };

        const forgeNiveau=
          idleEntier_(
            objet.forge
          );

        idleEtat.forge[slot]={
          niveau:
            forgeNiveau,
          cout:
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  forgeMeta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      forgeMeta.croissance
                    )
                  ),
                  forgeNiveau
                )
              )
            )
        };

        const delta=
          idleNombre_(
            objet.bonusPuissance
          )-
          idleNombre_(
            ancien&&ancien.bonusPuissance
          );

        idleEtat.bonusEquipement=
          Math.max(
            0,
            idleNombre_(
              idleEtat.bonusEquipement
            )+
            delta
          );

        idleEtat.puissance=
          Math.max(
            1,
            idleNombre_(
              idleEtat.puissance
            )+
            delta
          );

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'equip',
          String(objetId)
        );

        messageFlottantIdleV32_(
          '🛡️ Équipé'
        );
      }


      function acheterAmeliorationIdleV12_(
        type
      ){
        libererFocusIdleV24_();

        if(
          !idleEtat ||
          !SOREAL_SESSION ||
          [
            'production',
            'capacite',
            'puissance'
          ].indexOf(type)===-1
        ){
          return;
        }

        const cout=
          idleEntier_(
            idleEtat &&
            idleEtat.coutsBoutique &&
            idleEtat.coutsBoutique[type]
          );

        if(cout<=0){
          messageFlottantIdleV32_(
            '❌ Coût introuvable.'
          );
          return;
        }

        if(
          idleEntier_(
            idleEtat.pieces
          )<cout
        ){
          messageFlottantIdleV32_(
            '❌ Pas assez d’or.'
          );
          return;
        }

        if(!idleEtat.ameliorations){
          idleEtat.ameliorations={
            production:0,
            capacite:0,
            puissance:0
          };
        }

        idleEtat.pieces=
          Math.max(
            0,
            idleEntier_(
              idleEtat.pieces
            )-
            cout
          );

        idleEtat.ameliorations[type]=
          idleEntier_(
            idleEtat.ameliorations[type]
          )+1;

        const niveau=
          idleEntier_(
            idleEtat.ameliorations[type]
          );

        const meta=
          idleEtat &&
          idleEtat.boutiqueMeta &&
          idleEtat.boutiqueMeta[type]
            ?idleEtat.boutiqueMeta[type]
            :null;

        if(
          meta &&
          idleEtat.coutsBoutique
        ){
          idleEtat.coutsBoutique[type]=
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  meta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      meta.croissance
                    )
                  ),
                  niveau
                )
              )
            );

          if(!idleEtat.bonusBoutique){
            idleEtat.bonusBoutique={};
          }

          const ancienBonusV111=
            idleNombre_(
              idleEtat.bonusBoutique[type]
            );

          const nouveauBonusV111=
            niveau*
            idleNombre_(
              meta.bonusParNiveau
            );

          idleEtat.bonusBoutique[type]=
            nouveauBonusV111;

          const deltaBonusV111=
            nouveauBonusV111-
            ancienBonusV111;

          if(type==='production'){
            idleEtat.productionSeconde=
              Math.max(
                .01,
                idleNombre_(
                  idleEtat.productionSeconde
                )+
                deltaBonusV111
              );
          }else if(type==='capacite'){
            idleEtat.energieMax=
              Math.max(
                1,
                idleNombre_(
                  idleEtat.energieMax
                )+
                deltaBonusV111
              );
          }else if(type==='puissance'){
            idleEtat.puissance=
              Math.max(
                1,
                idleNombre_(
                  idleEtat.puissance
                )+
                deltaBonusV111
              );
          }
        }

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'shop',
          type
        );
      }


      window.__acheterAmeliorationIdleV12__=
        acheterAmeliorationIdleV12_;

      /* page Boutique : rendu dans modules/page-boutique-v1.js (découpage du monolithe, 2026-10-16). */
      function pageBoutiqueIdleV28_(){return window.__SOREAL_IDLE_PAGE_BOUTIQUE_V1__.pageBoutiqueIdleV28_.apply(null,arguments);}












      window.__recyclerObjetsOptimisteIdleV32__=
        recyclerObjetsOptimisteIdleV32_;






      let idleAventureEnCoursV17=false;



      let idleAutoAventureV30=false;
      let idleAutoZoneV30=0;


















      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-99 */
      chargerCombatAutoIdleV30_();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-100 */








      let idleRenaissanceEnCoursV14=false;


      /* Renaissance et remise à zéro : code dans modules/ui-renaissance-v1.js (découpage du monolithe, 2026-10-16). */
      function fermerPopupRenaissanceIdleV63_(){return UI_PARTAGE_V1.fermerPopupRenaissanceIdleV63_.apply(null,arguments);}
      function executerRenaissanceIdleV63_(){return UI_PARTAGE_V1.executerRenaissanceIdleV63_.apply(null,arguments);}
      function ouvrirPopupResetTotalIdleV67_(){return UI_PARTAGE_V1.ouvrirPopupResetTotalIdleV67_.apply(null,arguments);}
      function fermerPopupResetTotalIdleV67_(){return UI_PARTAGE_V1.fermerPopupResetTotalIdleV67_.apply(null,arguments);}
      function executerResetTotalIdleV67_(){return UI_PARTAGE_V1.executerResetTotalIdleV67_.apply(null,arguments);}







      function renaitreIdleV14_(){
        libererFocusIdleV24_();

        if(idleRenaissanceEnCoursV14){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-105 */
        if(
          !idleEtat ||
          !idleEtat.renaissance ||
          !idleEtat.renaissance.debloquee
        ){
          toastIdleV5_(
            'Rebirth pas encore disponible : il faut au moins 3 minutes de run avant de pouvoir renaître.'
          );

          return;
        }

        const gain=Math.max(1,idleNombre_(idleEtat&&idleEtat.renaissance&&idleEtat.renaissance.nextNumber||1));

        fermerPopupRenaissanceIdleV63_();

        const modal=
          document.createElement(
            'div'
          );

        modal.id=
          'sorealIdleRenaissanceModalV63';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="Confirmer la Renaissance">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">♻️</div>'+
              '<div class="soreal-idle-modal-title-v63">Nouvelle Renaissance</div>'+
              '<div class="soreal-idle-modal-gain-v63">+'+
                idleEntier_(gain)+
                ' nombre</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-modal-info-v63">'+
                '<strong>Le cycle recommence.</strong><br>'+
                'Boss du run, niveaux de Basic Training et progressions temporaires du run seront remis à zéro.<br><br>'+
                '<strong>Conservé :</strong> inventaire, équipement, sets, collection, progression Aventure, capacité du sac et toutes les progressions permanentes (NGU, Perks, Quirks, Hacks, Wishes, Cards, MacGuffins…).'+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupRenaissanceIdleV63__()">Annuler</button>'+
              '<button type="button" class="soreal-idle-modal-button-v63 confirm" onclick="window.__executerRenaissanceIdleV63__()">♻️ Renaître</button>'+
            '</div>'+
          '</div>';

        modal.addEventListener(
          'click',
          function(event){
            if(event.target===modal){
              fermerPopupRenaissanceIdleV63_();
            }
          }
        );

        document.body.appendChild(
          modal
        );
      }


      window.__fermerPopupRenaissanceIdleV63__=
        fermerPopupRenaissanceIdleV63_;

      window.__executerRenaissanceIdleV63__=
        executerRenaissanceIdleV63_;


      window.__renaitreIdleV14__=
        renaitreIdleV14_;



      let idleMenuActifV28='combat';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-106 */
      let idleMenuRenduV179=null;

      /* Observer « 69 lol » bon marché : on ne regarde que les nœuds texte contenant « 69 »
         (les ticks à 15 Hz réécrivent du texte en continu), jamais de balayage complet du body
         hors installation initiale, et un nœud n'est traité qu'une fois par rafale de mutations. */




      /* Chaque Input est propre à son menu : la valeur change avec le menu (modules/meta-progression-v130.js, __SOREAL_IDLE_INPUT_MENU_V1__). */
      window.__menuActifIdleV28__=function(){return idleMenuActifV28;};



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
      /* Atouts : plus de menu à part, la boutique est dans la page ITOPOD. */
      IDLE_MENU_PAR_SYSTEME_V1.perks='tower';
      /* Titans : plus de menu à part (Norman, 2026-10-08), ils sont dans la page Adventure. */
      IDLE_MENU_PAR_SYSTEME_V1.titans='aventure';
      IDLE_MENU_PAR_SYSTEME_V1.achievements='chroniques';

      /* Navigation et ordre des menus : code dans modules/ui-navigation-v1.js (découpage du monolithe, 2026-10-16). */
      function texteVoixNouveauteIdleV1_(){return UI_PARTAGE_V1.texteVoixNouveauteIdleV1_.apply(null,arguments);}
      function definitionsNouveautesIdleV75_(){return UI_PARTAGE_V1.definitionsNouveautesIdleV75_.apply(null,arguments);}
      function menuDisponibleIdleV28_(){return UI_PARTAGE_V1.menuDisponibleIdleV28_.apply(null,arguments);}
      function menuIdleV28_(){return UI_PARTAGE_V1.menuIdleV28_.apply(null,arguments);}

      /* Chroniques (collection, classement, succès, profil) : code dans modules/ui-chroniques-v1.js (découpage du monolithe, 2026-10-16). */
      function catalogueSetsCollectionIdleV164_(){return UI_PARTAGE_V1.catalogueSetsCollectionIdleV164_.apply(null,arguments);}
      function memoriserSuccesVusIdleV1_(){return UI_PARTAGE_V1.memoriserSuccesVusIdleV1_.apply(null,arguments);}
      function menuSuccesVisibleIdleV1_(){return UI_PARTAGE_V1.menuSuccesVisibleIdleV1_.apply(null,arguments);}
      function changerOngletCollectionIdleV1_(){return UI_PARTAGE_V1.changerOngletCollectionIdleV1_.apply(null,arguments);}
      function afficherDetailsCollectionIdleV1_(){return UI_PARTAGE_V1.afficherDetailsCollectionIdleV1_.apply(null,arguments);}
      function changerOngletClassementIdleV1_(){return UI_PARTAGE_V1.changerOngletClassementIdleV1_.apply(null,arguments);}
      function chargerClassementIdleV1_(){return UI_PARTAGE_V1.chargerClassementIdleV1_.apply(null,arguments);}
      function basculerClassementVisibleIdleV1_(){return UI_PARTAGE_V1.basculerClassementVisibleIdleV1_.apply(null,arguments);}

      function generationJoueurIdleV75_(
        j
      ){
        return [
          String(j&&j.id||'joueur'),
          String(
            j&&j.profil&&j.profil.dateDebut||'date'
          )
        ].join('|');
      }


      /*
       * Textes éditables (Norman, 2026-10-02 : popups et fenêtres explicatives modifiables par l'administrateur, avec voix différentes) : chaque popup
       * « nouveauté » passe par ici ; sans modification il est rendu tel quel, avec en plus sa clé (_cle) pour le bouton « Modifier » de l'administrateur.
       */
      const NOUVEAUTE_CHAMPS_TEXTES_V1=[
        {id:'titre',label:'Titre',type:'ligne'},
        {id:'intro',label:'Introduction',type:'texte'},
        {id:'texte',label:'Texte',type:'texte'},
        {id:'bullets',label:'Points (un par paragraphe)',type:'liste'}
      ];
      function infoSurchargeeIdleV1_(cle,libelle,infoBrute){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        if(!T||!infoBrute)return infoBrute;
        T.declarer(cle,{
          groupe:'Popups de nouveautés',
          libelle:libelle||String(infoBrute.titre||cle),
          champs:NOUVEAUTE_CHAMPS_TEXTES_V1,
          original:function(){
            return {titre:String(infoBrute.titre||''),intro:String(infoBrute.intro||''),texte:String(infoBrute.texte||''),bullets:Array.isArray(infoBrute.bullets)?infoBrute.bullets.slice():[]};
          },
          texteLu:function(v){return texteVoixNouveauteIdleV1_(v);}
        });
        return T.appliquerInfo(cle,infoBrute);
      }



      /*
       * Panneaux explicatifs des systèmes (Norman, 2026-09-30 : « pour achievements, time machine, blood magic etc., c'est toujours le
       * même panneau : génère des panneaux explicatifs explicites pour chaque système qui se débloque »). Un texte par système, écrit
       * d'après SA page du wiki NGU Idle (Achievements, Advanced Training, Augmentations, Broken Time Machine, Blood Magic, Wandoos, NGU,
       * Yggdrasil, Gold Diggers, Beards, ITOPOD, Perks, Challenges, Titans, MacGuffin Fragments, Item Daycare, Questing, Quirks, Hacks,
       * Wishes, Cards, Cooking, pages consultées le 2026-09-30) : rien d'autre que ce que ces pages publient, aucune valeur inventée.
       * Anti-spoil (AGENTS.md règle n°2) : chaque texte n'explique QUE le système qui vient de se débloquer -- jamais un autre système,
       * un boss ou un objet encore inconnu, jamais un total. Ces textes sont aussi lus à voix haute (voix pré-générées) : phrases courtes.
       */
      const TEXTES_SYSTEMES_IDLE_V1={
        achievements:{
          intro:'Les Achievements, ce sont des médailles pour ceux qui font des trucs : chaque objectif accompli te rapporte des points bonus.',
          bullets:[
            'Chaque succès accompli te donne des points bonus, un peu comme un autocollant sur ton cahier, mais en utile.',
            'Ces points bonus augmentent ton gain d’AP : un pour cent de plus pour chaque tranche de cent points bonus. Autrement dit, plus tu collectionnes, mieux tu es payé.',
            'Les succès sont rangés par catégorie dans ce menu, pour retrouver facilement celui qui te manque.'
          ]
        },
        augmentations:{
          intro:'Les Augmentations donnent un multiplicateur d’Attack et de Defense : en clair, tu tapes plus fort et tu encaisses mieux, sans faire un seul calcul.',
          bullets:[
            'Place de l’Energy sur un Augment, c’est son carburant : plus il en reçoit, plus sa barre se remplit vite.',
            'Quand la barre est pleine, l’Augment gagne un niveau, à condition d’avoir assez d’Or pour payer la facture.',
            'Chaque Augment a une Upgrade qui multiplie son bonus : c’est le gros bouton « encore plus fort ».',
            'Les multiplicateurs de tous tes Augments s’additionnent, et tout repart à zéro à chaque Renaissance. Oui, c’est un peu vexant.'
          ]
        },
        advancedTraining:{
          intro:'L’Advanced Training est la salle de sport de ton héros : tu y dépenses de l’Energy pour entraîner tes capacités d’Aventure.',
          bullets:[
            'Place de l’Energy dans une capacité : chaque capacité s’entraîne avec sa propre énergie et gagne des niveaux.',
            'Résultat : plus de puissance et plus d’endurance en Aventure, donc des biceps virtuels.',
            'Attention, ça devient de plus en plus long : chaque niveau demande un peu plus de temps que le précédent, et les bonus grossissent de moins en moins vite.'
          ]
        },
        timeMachine:{
          intro:'La Time Machine fabrique de l’Or toute seule : elle rejoue le meilleur drop d’Or que tu as obtenu en Aventure, encore et encore.',
          bullets:[
            'Place de l’Energy sur la vitesse de la machine : sa barre se remplit plus vite, et chaque remplissage te rapporte de l’Or. C’est la photocopieuse à billets.',
            'Chaque niveau coûte de l’Or et de l’Energy, et un peu plus cher que le précédent. Rien n’est gratuit, même dans le futur.',
            'Ton meilleur boss vaincu multiplie aussi l’Or produit : battre des boss, ça paie.',
            'Les niveaux de la machine sont remis à zéro à chaque Renaissance, comme un voyageur qui perd ses bagages.'
          ]
        },
        bloodMagic:{
          intro:'Blood Magic transforme de la Magic et de l’Or en Blood, que tu dépenses ensuite dans des sorts. Oui, c’est de la cuisine, mais en plus rouge.',
          bullets:[
            'Choisis un rituel et place-y de la Magic : plus il en reçoit, plus vite il se termine. Chaque rituel terminé dépense de l’Or et produit du Blood.',
            'Le sort le plus courant ajoute un au multiplicateur de ton nombre pour chaque Blood dépensé : c’est ce qui te donne un plus gros nombre à la Renaissance.',
            'Lancer un sort utilise tout ton Blood d’un coup : pas de demi-mesure, on lance, on regarde, on applaudit.',
            'Le Blood est remis à zéro à chaque Renaissance, alors dépense-le avant.'
          ]
        },
        wandoos:{
          intro:'Wandoos est un système d’exploitation médiocre, mais il multiplie ton attaque et ta défense quand tu y déverses de l’Energy et de la Magic. Il plante peut-être, mais il paie.',
          bullets:[
            'Déverse de l’Energy et de la Magic dedans pour faire monter ses niveaux : c’est le tuyau d’arrosage du vieil ordinateur.',
            'Au début il ne sert pas à grand-chose, car ses bonus sont faibles. Il devient important plus tard dans le jeu : patience, il chauffe.',
            'À chaque Renaissance, il lui faut environ une heure pour atteindre sa pleine vitesse, sans que tu aies besoin d’être connecté. Il démarre tout seul, comme un vieux PC.',
            'Wandoos reste débloqué après une Renaissance, mais les niveaux d’Energy et de Magic sont perdus.'
          ]
        },
        ngu:{
          intro:'Les NGU, c’est un peu l’entraîneur de l’Entraînement : tu leur confies ton Energy et ta Magic, et ils font le sport à ta place pour te donner des bonus.',
          bullets:[
            'Choisis dans quel NGU envoyer chacune de tes ressources, comme on choisit à quel coach donner sa carte de fidélité.',
            'Chaque NGU gagne des niveaux, et chaque niveau coûte plus cher que le précédent : normal, plus on devient costaud, plus il faut de séances.',
            'Les NGU restent débloqués et gardent leurs niveaux après une Renaissance : tes coachs ne démissionnent jamais.'
          ]
        },
        yggdrasil:{
          intro:'Yggdrasil est l’arbre du monde : tu y fais pousser des fruits qui donnent des récompenses quand tu les manges. Un potager, mais cosmique.',
          bullets:[
            'Dépense des graines pour faire monter un fruit de palier : chaque palier de plus lui permet de pousser une heure de plus sans que tu aies à le manger.',
            'Active un fruit en payant son coût en Energy ou en Magic : ce coût est retiré temporairement de ton plafond, puis récupéré grâce à ta production. C’est un prêt, pas un cadeau.',
            'Un fruit qui a poussé au moins une heure peut être mangé pour sa récompense spéciale, ou récolté pour doubler les graines gagnées. Croquer ou replanter : à toi de voir.',
            'À la Renaissance, tes graines, tes fruits débloqués et tes paliers sont conservés. Les fruits en train de pousser sont perdus : mange-les avant, sinon ils finissent en compote.'
          ]
        },
        diggers:{
          intro:'Les Gold Diggers sont des mineurs à louer : tu leur sacrifies une partie de ton Or par seconde, et en échange ils te donnent des bonus dans plusieurs domaines du jeu.',
          bullets:[
            'Paie de l’Or pour débloquer un Digger et pour le faire monter de niveau : un mineur ne creuse pas gratuitement.',
            'Active un Digger pour recevoir son bonus. En échange, il retire en permanence une petite part de ton Or par seconde : c’est son salaire.',
            'Tu ne peux activer qu’autant de Diggers que tu as d’emplacements : pas de place, pas de pioche.',
            'Monter les Diggers de niveau augmente aussi le bonus de tous les Diggers, même ceux que tu n’actives pas : les mineurs au repos profitent quand même des progrès du syndicat.'
          ]
        },
        beards:{
          intro:'Les Beards sont des barbes qui te donnent des bonus temporaires. Oui, des barbes : on ne juge pas.',
          bullets:[
            'Chaque barbe donne un type de bonus différent : il y en a pour tous les goûts, même sans rasoir.',
            'Tu ne peux avoir actives qu’autant de barbes que tu as d’emplacements.',
            'À la Renaissance, si une barbe est active, une partie de son bonus temporaire devient permanente. Plus la Renaissance arrive tard, plus cette part est grande : laisse pousser.'
          ]
        },
        tower:{
          intro:'L’ITOPOD est une tour infinie : tu grimpes étage après étage en tapant tout ce qui bouge, pour gagner des points de perk et de l’expérience.',
          bullets:[
            'Choisis ton étage de départ et ton étage de fin : c’est ton ascenseur, tu règles le premier et le dernier bouton.',
            'Chaque dizaine d’ennemis vaincus te fait monter d’un étage.',
            'Si tu meurs, ou si tu bats dix ennemis à ton étage de fin, tu retournes à ton étage de départ. Retour au rez-de-chaussée, sans escalator.',
            'Plus tu montes, plus les ennemis sont forts, mais plus tu gagnes de progression vers les points de perk.'
          ]
        },
        perks:{
          intro:'Les Perks sont des améliorations que tu achètes avec les points de perk gagnés dans la tour : des petits bonus de carrière pour ton héros.',
          bullets:[
            'Dépense tes points de perk dans la page ITOPOD, avec le bouton « Atouts ».',
            'Chaque perk a un coût et un niveau maximum : on ne peut pas tout acheter à l’infini, même avec de la volonté.',
            'Certains perks s’achètent une seule fois, d’autres niveau par niveau.',
            'Certains perks donnent un bonus permanent : ceux-là, tu les gardes pour de bon.'
          ]
        },
        challenges:{
          intro:'Les Challenges sont des défis à relever : tu te mets volontairement des bâtons dans les roues, et le jeu te récompense pour ça.',
          bullets:[
            'Lancer un défi te fait faire une Renaissance : ton nombre revient à un. Prépare-toi mentalement.',
            'Tu peux quitter un défi quand tu veux, sans aucune pénalité à part le temps perdu : zéro honte, promis.',
            'Chaque défi peut être réussi plusieurs fois.',
            'Les récompenses sont les plus grosses à la première et à la dernière réussite.'
          ]
        },
        titans:{
          intro:'Les Titans sont des boss géants de l’Aventure, chacun dans sa propre zone : les gros durs du quartier, qui ne se laissent pas faire.',
          bullets:[
            'Tu peux combattre un Titan à tout moment, tant qu’il n’est pas en temps de repos : même les géants ont besoin d’une sieste.',
            'Un Titan vaincu te donne de l’expérience et des objets, comme de l’équipement ou des boosts. Ensuite, il a un temps de repos avant de revenir.',
            'Si tu perds, tu retournes à la zone de départ. Le temps de repos ne se remet pas à zéro : tu peux réessayer autant que tu veux.',
            'À chaque Renaissance, les Titans vivants disparaissent et un nouveau temps de repos commence. Chaque Titan devient plus fort à chaque attaque, il s’échauffe : garde de la marge de puissance.'
          ]
        },
        macguffins:{
          intro:'Les MacGuffins sont des objets uniques qui te donnent des bonus permanents à chaque Renaissance : des porte-bonheur qui se méritent.',
          bullets:[
            'Trouve des fragments en combattant dans les zones de l’Aventure : chaque zone compte tes victoires, et le fragment tombe quand le compteur est atteint.',
            'Équipe tes MacGuffins dans ton inventaire : tu ne peux en porter que selon ton nombre d’emplacements.',
            'Ils montent de niveau sans limite : le ciel est la seule frontière.',
            'Le bonus permanent grandit quand tu fais une Renaissance avec un fragment équipé : n’oublie pas de l’emporter avec toi.'
          ]
        },
        daycare:{
          intro:'La Garderie fait monter tes objets de niveau pendant que tu fais autre chose, sans que tu aies à les fusionner : une nounou pour objets.',
          bullets:[
            'Elle est utile pour les objets difficiles ou très longs à monter de niveau : ceux qui font les capricieux.',
            'Le petit chat de la garderie s’occupe de tes objets : le temps pour gagner un niveau dépend de chaque objet.',
            'Tu ne peux mettre qu’un seul exemplaire de chaque objet.',
            'Fusionner un objet dans un emplacement de la garderie ne fait rien : la nounou n’accepte pas les doublons.'
          ]
        },
        questing:{
          intro:'Les quêtes te donnent des points de quête en échange d’objets que tu ramasses en Aventure : tu fais la livraison, on te paie en points.',
          bullets:[
            'Lance une quête, puis ramasse l’objet de quête : il tombe dans une zone d’Aventure précise.',
            'Tu peux aussi activer le mode inactif pour avancer lentement sans ramasser l’objet toi-même : la quête se fait en pantoufles.',
            'Terminer une quête te donne des points de quête.',
            'Une quête en cours continue après une Renaissance, et tu peux l’abandonner quand tu veux : aucune rancune.'
          ]
        },
        quirks:{
          intro:'Les Quirks sont des petites manies que tu achètes avec des points de quête, et qui te donnent des bonus.',
          bullets:[
            'Les points de quête se gagnent en faisant des quêtes.',
            'Dépense-les dans ce menu pour acheter des bonus : c’est le rayon bonbons du jeu.',
            'Certains Quirks améliorent ta puissance, ta capacité ou tes barres d’Energy et de Magic, et d’autres augmentent tes gains d’Or.',
            'Certains Quirks ont plusieurs niveaux, et le prix est indiqué pour chaque niveau : lis l’étiquette avant de payer.'
          ]
        },
        hacks:{
          intro:'Les Hacks sont des programmes que tu fais monter de niveau pour booster définitivement d’autres statistiques du jeu : le pirate informatique, version gentille.',
          bullets:[
            'Répartis ta ressource entre les Hacks disponibles pour les faire monter de niveau.',
            'Chaque Hack donne un petit bonus par niveau, et des paliers de niveaux offrent en plus un bonus supplémentaire : une récompense pour les persévérants.',
            'Un Hack touche par exemple l’attaque et la défense, les statistiques d’Aventure ou les chances de butin.'
          ]
        },
        wishes:{
          intro:'Les Wishes sont des souhaits : tu mets tes ressources dans la lampe, et un génie très lent finit par les exaucer.',
          bullets:[
            'Pour exaucer un souhait, alloue-lui un peu de chacune de tes ressources : un souhait prend au minimum quatre heures. Le génie ne fait pas de livraison express.',
            'Mettre beaucoup de ressources dans un seul souhait rapporte de moins en moins. Il vaut mieux allouer peu de chaque, et répartir sur plusieurs souhaits si tu as plusieurs emplacements.',
            'Tu commences avec un seul emplacement de souhait.',
            'Les souhaits te donnent des bonus, et pas des moutons à cinq pattes.'
          ]
        },
        cards:{
          intro:'Les Cards sont des cartes à jouer qui te donnent des bonus permanents : tu les piges, tu les lances, et tu gardes l’effet pour toujours.',
          bullets:[
            'Tu reçois une carte toutes les heures, sauf si ton paquet est plein : un paquet plein, c’est un cadeau perdu.',
            'Pour lancer une carte, il faut de la mayonnaise : le coût est écrit sur la carte. Oui, de la vraie mayonnaise virtuelle.',
            'Une carte lancée disparaît, mais son bonus reste permanent.',
            'Tu peux aussi détruire une carte, ou la protéger pour ne pas la lancer ni la détruire par erreur.'
          ]
        },
        cooking:{
          intro:'La cuisine te permet d’augmenter définitivement ton gain d’expérience : chaque bon petit plat te rend plus malin. Bon appétit.',
          bullets:[
            'Tu peux manger un plat environ une fois toutes les vingt-quatre heures. Si tu ne le manges pas, le temps s’accumule pour les repas suivants : le frigo n’oublie rien.',
            'Ajuste la quantité de chaque ingrédient pour rendre le plat le plus efficace possible : dosage de chef.',
            'Équipe ton matériel de cuisine avant de manger pour augmenter les bonus.',
            'Quand tu manges le plat, son gain s’ajoute à ton gain d’expérience total, et un nouveau plat est généré.'
          ]
        }
      };

      /*
       * Texte d'explication d'un système « générique » (Perks, Quirks, Achievements…). Fonction pure : le popup l'affiche ET la génération des voix pré-enregistrées (voice-generate.mjs) la
       * lit pour chaque système du catalogue. Sans cela, ces popups n'avaient pas de fichier audio : repli sur la voix locale (lourde, jeu qui rame, souvent en erreur sur téléphone).
       */
      function infoSystemeGeneriqueIdleV1_(s,menuCible){
        return infoSurchargeeIdleV1_('nouveaute:systeme:'+s.id,String(s.name||s.id)+' (système)',infoSystemeGeneriqueBruteIdleV1_(s,menuCible));
      }
      function infoSystemeGeneriqueBruteIdleV1_(s,menuCible){
        /* Texte explicite du système (TEXTES_SYSTEMES_IDLE_V1) ; le texte générique ci-dessous n'est qu'un repli pour un système sans texte. */
        const t=TEXTES_SYSTEMES_IDLE_V1[s.id];
        if(t){
          return {
            icon:s.icon||'✨',
            titre:(s.name||'Nouveau système')+' débloqué',
            intro:t.intro,
            menuCible:menuCible,
            libelleCible:'Aller à '+(s.name||'ce système'),
            bullets:t.bullets.slice()
          };
        }
        return {
          icon:s.icon||'✨',
          titre:(s.name||'Nouveau système')+' débloqué',
          intro:'Une nouvelle couche de progression est disponible.',
          menuCible:menuCible,
          libelleCible:'Ouvrir le système',
          bullets:[
            s.desc||'Ce système améliore ta progression.',
            'Son état est sauvegardé dans le moteur partagé SOREAL IDLE.',
            s.kind==='permanent'
              ?'Cette progression est permanente entre les Renaissances.'
              :'Vérifie ce qui est conservé ou banké lors d’une Renaissance.'
          ]
        };
      }




      /*
       * « Déjà vu » (popups de menus, tutoriels, textes d'accueil) — Norman, 2026-09-24 : « quand on rebirth, on a encore les popups quand
       * on va dans les menus ; ils ne doivent arriver qu'une fois, pareil pour les textes d'accueil ». L'état vit désormais AUSSI côté
       * serveur (profil.stats.vus, opération marquerVusSorealIdle) : une Renaissance, un autre appareil ou un stockage local vidé ne
       * les rejouent plus. Le stockage local reste un cache immédiat ; ce qu'il contient déjà est envoyé au serveur une fois.
       */
      const idleVusMemoireV1={};
      let idleVusEnAttenteV1=[];
      let idleVusEnvoiEnCoursV1=false;
      let idleVusMigreV1='';


      function idleVuConnuV1_(j,id){
        return idleVusMemoireV1[id]===true||idleVusServeurV1_(j).indexOf(id)!==-1;
      }

      function idleVusEnvoyerV1_(){
        if(idleVusEnvoiEnCoursV1||!idleVusEnAttenteV1.length||!SOREAL_SESSION)return;
        const lot=idleVusEnAttenteV1.slice(0,50);
        idleVusEnvoiEnCoursV1=true;
        try{
          google.script.run
            .withSuccessHandler(function(res){
              idleVusEnvoiEnCoursV1=false;
              if(!res||!res.ok)return;
              idleVusEnAttenteV1=idleVusEnAttenteV1.filter(function(id){return lot.indexOf(id)===-1;});
              if(idleEtat&&idleEtat.profil&&idleEtat.profil.stats&&Array.isArray(res.vus)){
                idleEtat.profil.stats.vus=res.vus;
              }
              if(idleVusEnAttenteV1.length)idleVusEnvoyerV1_();
            })
            .withFailureHandler(function(){
              idleVusEnvoiEnCoursV1=false;
            })
            .marquerVusSorealIdle(SOREAL_SESSION,lot);
        }catch(e){
          idleVusEnvoiEnCoursV1=false;
        }
      }

      /*
       * Catégorie « Clics/Tap » du classement (Norman, 2026-09-27 : « le nombre de cliques de souris Droite/gauche effectué dans
       * l'appli. Et les taps pareils, dans la même catégorie... même si quelqu'un triche, ca n'est pas grave »). Compteur brut,
       * jamais anti-triche par conception. On accumule en mémoire et on envoie le total par lots (même patron que idleVusEnvoyerV1_
       * ci-dessus), jamais un appel serveur par clic.
       */
      let idleClicsEnAttenteV1=0;
      let idleClicsEnvoiEnCoursV1=false;

      function idleClicsEnvoyerV1_(){
        if(idleClicsEnvoiEnCoursV1||idleClicsEnAttenteV1<=0||!SOREAL_SESSION)return;
        const lot=idleClicsEnAttenteV1;
        idleClicsEnAttenteV1=0;
        idleClicsEnvoiEnCoursV1=true;
        try{
          google.script.run
            .withSuccessHandler(function(){
              idleClicsEnvoiEnCoursV1=false;
              if(idleClicsEnAttenteV1>0)idleClicsEnvoyerV1_();
            })
            .withFailureHandler(function(){
              idleClicsEnvoiEnCoursV1=false;
              idleClicsEnAttenteV1+=lot;
            })
            .enregistrerClicsSorealIdle(SOREAL_SESSION,lot);
        }catch(e){
          idleClicsEnvoiEnCoursV1=false;
          idleClicsEnAttenteV1+=lot;
        }
      }

      let idleClicsEnvoiMinuterieV1=null;
      function idleClicMarquerV1_(){
        idleClicsEnAttenteV1+=1;
        if(!idleClicsEnvoiMinuterieV1){
          /* Audit de l'entraînement de base (2026-10-05) : en jouant sans arrêt, ce lot partait toutes les 4 s ; toutes les 15 s suffisent (compteur de classement), et il part aussi dès que l'onglet est quitté. */
          idleClicsEnvoiMinuterieV1=setTimeout(function(){
            idleClicsEnvoiMinuterieV1=null;
            idleClicsEnvoyerV1_();
          },15000);
        }
      }
      document.addEventListener('visibilitychange',function(){
        if(document.hidden&&idleClicsEnAttenteV1>0){
          clearTimeout(idleClicsEnvoiMinuterieV1);
          idleClicsEnvoiMinuterieV1=null;
          idleClicsEnvoyerV1_();
        }
      });

      document.addEventListener('mousedown',function(ev){
        if(PAGE_ACTIVE!=='idle')return;
        if(ev.button===0||ev.button===2)idleClicMarquerV1_();
      },true);
      document.addEventListener('touchstart',function(){
        if(PAGE_ACTIVE!=='idle')return;
        idleClicMarquerV1_();
      },{capture:true,passive:true});


      /*
       * Audit de Collection (Norman, 2026-10-05) : ouvrir un menu marque plusieurs choses « vues » à la suite (le menu, son tutoriel, un texte…) et chacune partait seule : deux appels serveur à la même milliseconde.
       * Les identifiants marqués dans la même rafale partent maintenant ensemble, 400 ms après le premier (la mémoire locale, elle, est à jour tout de suite).
       */
      let idleVusMinuterieV1=0;
      function idleVuMarquerV1_(id){
        idleVusMemoireV1[id]=true;
        if(idleVusEnAttenteV1.indexOf(id)===-1)idleVusEnAttenteV1.push(id);
        if(idleVusMinuterieV1)return;
        idleVusMinuterieV1=setTimeout(function(){
          idleVusMinuterieV1=0;
          idleVusEnvoyerV1_();
        },400);
      }

      /*
       * Pont pour les modules externes (2026-09-27, popup d'histoire plein écran) : la mémoire
       * « vu une seule fois » (localStorage + profil.stats.vus serveur, marquerVusSorealIdle)
       * vit dans cette clôture. Plutôt que de dupliquer la file d'attente/l'envoi côté module,
       * modules/story-popup-v1.js appelle ce pont pour réutiliser exactement le même mécanisme
       * que les popups de menus/tutoriels (idleVuConnuV1_/idleVuMarquerV1_ ci-dessus).
       */
      window.__soreal_idle_marquer_vu_v1__=idleVuMarquerV1_;
      /*
       * Norman (2026-09-30) : « Quand je joue sur le PC et qu'ensuite je joue sur le téléphone, il
       * me relit certains textes de boss. Pas les premiers, mais les derniers que j'ai tué. » Cause
       * : la mémoire « chronique de boss déjà lue automatiquement » (tutorial-tts-v202.js,
       * CHRONICLE_LU_KEY) vivait uniquement en localStorage, jamais envoyée au serveur (choix
       * délibéré du 2026-09-27 pour qu'un Rebirth ne la rejoue pas -- mais l'effet de bord jamais
       * anticipé : aucun autre appareil ne peut la connaître). Seuls les boss récents/frontière
       * (encore affichés à l'écran Fight Boss) le laissaient remarquer, d'où « pas les premiers,
       * les derniers ». Pont de LECTURE symétrique à celui d'écriture ci-dessus : permet à
       * tutorial-tts-v202.js de vérifier l'état serveur (jamais remis à zéro par un Rebirth, comme
       * documenté plus haut) sans dupliquer idleVuConnuV1_/idleVusMemoireV1 dans ce module.
       */
      window.__soreal_idle_vu_connu_v1__=function(id){return idleVuConnuV1_(idleEtat,id);};

      /* Tutoriel : code dans modules/ui-tutoriel-v1.js (découpage du monolithe, 2026-10-16). */
      function appliquerTextesTutorielsIdleV1_(){return UI_PARTAGE_V1.appliquerTextesTutorielsIdleV1_.apply(null,arguments);}
      function texteVoixTutorielIdleV1_(){return UI_PARTAGE_V1.texteVoixTutorielIdleV1_.apply(null,arguments);}
      function rendreTutorielPagesIdleV1_(){return UI_PARTAGE_V1.rendreTutorielPagesIdleV1_.apply(null,arguments);}
      function idleTutorielPagesMarquerVuV1_(){return UI_PARTAGE_V1.idleTutorielPagesMarquerVuV1_.apply(null,arguments);}
      function retirerChromeTutorielV1_(){return UI_PARTAGE_V1.retirerChromeTutorielV1_.apply(null,arguments);}



      /* Popups de progression et résumé hors ligne : code dans modules/ui-popups-v1.js (découpage du monolithe, 2026-10-16). */
      function allerDepuisPopupNouveauteIdleV106_(){return UI_PARTAGE_V1.allerDepuisPopupNouveauteIdleV106_.apply(null,arguments);}
      function afficherProchainePopupIdleV75_(){return UI_PARTAGE_V1.afficherProchainePopupIdleV75_.apply(null,arguments);}
      function fermerPopupNouveauteIdleV75_(){return UI_PARTAGE_V1.fermerPopupNouveauteIdleV75_.apply(null,arguments);}
      function afficherPopupObjetUnifieIdleV1_(){return UI_PARTAGE_V1.afficherPopupObjetUnifieIdleV1_.apply(null,arguments);}
      function fermerResumeHorsLigneIdleV64_(){return UI_PARTAGE_V1.fermerResumeHorsLigneIdleV64_.apply(null,arguments);}









      window.__allerDepuisPopupNouveauteIdleV106__=
        allerDepuisPopupNouveauteIdleV106_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-120 */
      const TUTORIEL_DEBUT_JEU_PAGES_V1=[
        {
          titre:'LE COMMENCEMENT',
          sousTitre:'(ACCROCHE-TOI BIEN)',
          long:true,
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
       * Voix pré-générées (2026-09-24) : le texte LU par un panneau est construit ICI à partir des données (jamais relevé dans le DOM),
       * posé sur le panneau (data-soreal-tts-say) et réutilisé tel quel par cloudflare/tools/voice-generate.mjs via
       * window.__sorealVoiceTextesIdleV1__ : mêmes blocs de texte = mêmes fichiers audio. Les icônes, « Page n / N » et l'en-tête
       * « SOREAL IDLE » ne sont plus lus.
       */
      function pauseVoixIdleV1_(ms){
        return ' \uE000'+ms+'\uE001 ';
      }



      function infoMoneyPitIdleV1_(){
        return infoSurchargeeIdleV1_('nouveaute:moneyPit','Money Pit & Roue journalière',infoMoneyPitBruteIdleV1_());
      }
      function infoMoneyPitBruteIdleV1_(){
        return {
          icon:'🕳️',
          titre:'Money Pit & Roue journalière',
          intro:'Tu as débloqué un trou dans lequel jeter tout ton Or. Oui, tout. Excellente gestion financière.',
          menuCible:'moneyPit',
          libelleCible:'Ouvrir le Money Pit',
          bullets:[
            'Money Pit : avec au moins 100 000 Or, tu peux jeter TOUT l’Or que tu possèdes dans le trou. Plus la somme est énorme, plus les cadeaux possibles sont beaux.',
            'Le trou te recrache un lot au hasard selon la somme jetée, puis il doit se recharger avant le prochain lancer. Plus tu en fais dans la même partie, plus la recharge est longue : il se fatigue.',
            'Roue journalière : elle est dans ce même menu. Quand elle est prête, fais-la tourner pour gagner un lot au hasard, notamment de l’AP ou des graines.',
            'La roue revient sur un cycle de 24 heures. Plus tu accumules de tours au fil du temps, plus ses récompenses s’améliorent : la patience paie.',
            'Repère visuel : le bouton Money Pit devient vert quand le trou est prêt, ou jaune quand la roue journalière est disponible.'
          ]
        };
      }

      /*
       * Les trois tutoriels de Norman & Sébastien : chaque page peut être modifiée par l'administrateur. Les tableaux ci-dessus sont des constantes
       * dont l'IDENTITÉ compte (comparaisons plus bas) : on remplace donc leurs ÉLÉMENTS en place, par des copies portant le texte à afficher, le texte
       * à lire (_brut) et la clé de la page (_cle). Les pages d'origine sont gardées pour l'éditeur et pour « Rétablir ».
       */
      const TUTORIEL_TABLEAUX_TEXTES_V1={debut:TUTORIEL_DEBUT_JEU_PAGES_V1,aventure:TUTORIEL_AVENTURE_PAGES_V1,boss:TUTORIEL_PREMIER_BOSS_PAGES_V1};
      appliquerTextesTutorielsIdleV1_();
      if(window.__SOREAL_IDLE_TEXTES_V1__)window.__SOREAL_IDLE_TEXTES_V1__.surChangement(appliquerTextesTutorielsIdleV1_);


      /* Tous les textes d'explication connus d'avance (les systèmes dont la description vient des données du jeu restent en repli). */
      window.__sorealVoiceTextesIdleV1__=function(){
        const textes=[];
        [TUTORIEL_DEBUT_JEU_PAGES_V1,TUTORIEL_PREMIER_BOSS_PAGES_V1,TUTORIEL_AVENTURE_PAGES_V1].forEach(function(pages){
          pages.forEach(function(page,index){textes.push(texteVoixTutorielIdleV1_(page,pages[index-1]));});
        });
        const definitions=definitionsNouveautesIdleV75_();
        Object.keys(definitions).forEach(function(cle){textes.push(texteVoixNouveauteIdleV1_(definitions[cle]));});
        textes.push(texteVoixNouveauteIdleV1_(infoMoneyPitIdleV1_()));
        textes.push(VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1);
        /*
         * Histoires plein écran (2026-09-30) : elles sont désormais créées dans le menu Admin (base serveur), plus dans le code ; leurs
         * voix sont générées depuis ce menu (bouton « Générer les voix », voix réaliste sur le PC de l'administrateur) et stockées sur
         * R2 -- elles ne font donc plus partie de cette couverture statique.
         */
        return textes;
      };

      /* Textes des popups de système générique, pour chaque système du catalogue serveur (liste {id,name,icon,kind} fournie par l'outil de génération). */
      window.__sorealVoiceTextesSystemesIdleV1__=function(systemes){
        return (Array.isArray(systemes)?systemes:[]).filter(function(s){
          return s&&s.id&&s.id!=='moneyPit'&&s.id!=='dailySpin'&&IDLE_MENU_PAR_SYSTEME_V1[s.id];
        }).map(function(s){
          return texteVoixNouveauteIdleV1_(infoSystemeGeneriqueIdleV1_(s,IDLE_MENU_PAR_SYSTEME_V1[s.id]));
        });
      };



      /* Essai en local uniquement (serveur de développement) : rejoue le tutoriel du début à la page voulue, sans rien marquer comme vu. */
      if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){
        window.__SOREAL_IDLE_TUTO_REJOUER_V1__=function(index){
          idleTutorielPagesEnCoursV1={pages:TUTORIEL_DEBUT_JEU_PAGES_V1,index:Math.max(0,Math.floor(Number(index)||0)),cle:'rejeu-local'};
          rendreTutorielPagesIdleV1_();
        };
      }

      /* Liste des menus (identifiant, nom) pour l'éditeur du tutoriel. */
      window.__SOREAL_IDLE_MENUS_LISTE_V1__=function(){
        return IDLE_MENUS_V1.map(function(m){return {id:m.id,icon:m.icon,nom:m.nom};});
      };


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
      function baliseursPausesIdleV1_(texte){
        return String(texte||'').replace(/\s*\uE000(\d+)\uE001\s*/g,function(tout,ms){return ' (pause '+ms+'ms) ';}).replace(/\s+/g,' ').trim();
      }
      const TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1=baliseursPausesIdleV1_(VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1).replace('(pause 900ms) ','(pause 900ms) (femme) ');
      const CHAMPS_VOIX_SIMPLE_IDLE_V1=[{id:'texte',label:'Texte lu',type:'texte'}];
      function declarerVoixSansTexteIdleV1_(){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        if(!T||typeof T.declarer!=='function')return;
        T.declarer(CLE_VOIX_SANDWICH_IDLE_V1,{
          groupe:'Voix sans texte à l’écran',
          libelle:'Voix de fond après le sandwich (fin du tutoriel)',
          champs:CHAMPS_VOIX_SIMPLE_IDLE_V1,
          original:function(){return {texte:TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1};},
          texteLu:function(v){return String(v&&v.texte||'');}
        });
        T.declarer(CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,{
          groupe:'Voix sans texte à l’écran',
          libelle:'Introduction de la lecture des chroniques de boss',
          champs:CHAMPS_VOIX_SIMPLE_IDLE_V1,
          original:function(){return {texte:TEXTE_CHRONIQUES_INTRO_IDLE_V1};},
          texteLu:function(v){return String(v&&v.texte||'');}
        });
      }
      declarerVoixSansTexteIdleV1_();
      if(window.__SOREAL_IDLE_TEXTES_V1__&&typeof window.__SOREAL_IDLE_TEXTES_V1__.surChangement==='function')window.__SOREAL_IDLE_TEXTES_V1__.surChangement(declarerVoixSansTexteIdleV1_);
      /* Texte à lire : la version modifiée par l'administrateur si elle existe (balises de voix, d'expression et de pause comprises), sinon l'origine. */
      function texteVoixSansTexteIdleV1_(cle,origine){
        try{
          const T=window.__SOREAL_IDLE_TEXTES_V1__;
          const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
          const sur=T&&typeof T.surcharge==='function'?T.surcharge(cle):null;
          if(sur&&typeof sur.texte==='string'&&sur.texte.trim()&&tts&&typeof tts.retirerParentheses==='function')return tts.retirerParentheses(sur.texte).replace(/\s+/g,' ').trim();
        }catch(_e){}
        return origine;
      }

      function lancerVoixArrierePlanSandwichIdleV1_(){
        const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
        if(!tts||typeof tts.readText!=='function'||typeof tts.enabled!=='function'||!tts.enabled())return;
        setTimeout(function(){
          try{tts.readText(texteVoixSansTexteIdleV1_(CLE_VOIX_SANDWICH_IDLE_V1,VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1));}catch(e){}
        },1500);
      }

      function tutorielPagesFermerV1_(){
        const etat=idleTutorielPagesEnCoursV1;
        if(etat)idleTutorielPagesMarquerVuV1_(etat.cle);
        /*
         * Norman (2026-09-27) : « Si on ne termine pas l'introduction complète, elle sera rejouée au prochain
         * lancement du jeu depuis le début ». « Bienvenue » (le flag qui empêche gererPopupsProgressionIdleV75_
         * de relancer l'intro) n'est donc marqué ICI, qu'une fois le tutoriel de début réellement fermé -- jamais
         * dès son ouverture -- pour que quitter en plein milieu la rejoue depuis le début.
         */
        if(etat&&etat.pages===TUTORIEL_DEBUT_JEU_PAGES_V1&&idleEtat){
          const cleBienvenue='soreal_idle_bienvenue_v75_'+generationJoueurIdleV75_(idleEtat);
          try{localStorage.setItem(cleBienvenue,JSON.stringify(true));}catch(e){}
          idleVuMarquerV1_('bienvenue');
        }
        /* Le sandwich est la dernière page du tutoriel de début : la voix de fond ne part que si le joueur l'a atteinte. */
        if(etat&&etat.pages===TUTORIEL_DEBUT_JEU_PAGES_V1&&etat.index>=etat.pages.length-1)lancerVoixArrierePlanSandwichIdleV1_();

        retirerChromeTutorielV1_();
        idleTutorielPagesEnCoursV1=null;

        if(!idlePopupQueueV75.length){
          idlePopupBloqueCombatV102=false;
        }

        setTimeout(afficherProchainePopupIdleV75_,120);
      }

      window.__tutorielPagesNaviguerV1__=tutorielPagesNaviguerV1_;
      window.__tutorielPagesFermerV1__=tutorielPagesFermerV1_;




      window.__annoncerNouveauxMenusIdleV1__=annoncerNouveauxMenusIdleV1_;




      window.__fermerPopupNouveauteIdleV75__=
        fermerPopupNouveauteIdleV75_;


      const CLE_SUCCES_VUS_V1='soreal_idle_succes_vus_v1';
      function succesVusIdleV1_(){
        try{
          const brut=localStorage.getItem(CLE_SUCCES_VUS_V1);
          if(brut===null)return null;
          const liste=JSON.parse(brut);
          return Array.isArray(liste)?liste:null;
        }catch(_e){return null;}
      }
      /* Succès débloqués mais jamais regardés : la liste des succès vus est mémorisée sur l'appareil ; première visite = tout ce qui est déjà débloqué est considéré comme vu. Ouvrir le menu Succès les marque tous comme vus. */
      let idleSuccesNouveauxV1=[];
      function succesNonVusIdleV1_(j,menuActif){
        const ach=j&&j.systemes&&j.systemes.achievements&&Array.isArray(j.systemes.achievements.list)?j.systemes.achievements.list:[];
        const debloques=ach.filter(function(a){return a&&a.unlocked;}).map(function(a){return a.id;});
        const vus=succesVusIdleV1_();
        if(vus===null){memoriserSuccesVusIdleV1_(debloques);return false;}
        const nonVus=debloques.filter(function(id){return vus.indexOf(id)===-1;});
        if(menuActif==='succes'){
          /* Point rouge dans le menu (Norman, 2026-10-04) : les trophées non vus à l'ouverture sont gardés tant qu'on reste dans le menu (sur leur catégorie et sur le trophée), puis considérés comme vus. */
          nonVus.forEach(function(id){if(idleSuccesNouveauxV1.indexOf(id)===-1)idleSuccesNouveauxV1.push(id);});
          if(nonVus.length)memoriserSuccesVusIdleV1_(vus.concat(nonVus));
          return false;
        }
        idleSuccesNouveauxV1=[];
        return nonVus.length>0;
      }
      /* Trophées nouveaux à signaler d'un point rouge dans la page des succès (modules/profile-v1.js). Appelée au rendu de la page : capture ce qui n'a pas encore été vu avant de le marquer comme vu. */
      /* Plus de point rouge pour les nouveaux trophées (Norman, 2026-10-08) : la liste reste vide, la page des succès n'affiche aucun repère. */
      if(typeof window!=='undefined')window.__SOREAL_IDLE_SUCCES_NOUVEAUX_V1__=function(){return [];};
      /*
       * Chroniques (Norman, 2026-10-08) : Collection, Classement et Succès réunis dans UN menu, pour avoir le moins de menus possible. Chaque onglet n'apparaît qu'une fois débloqué
       * (règle n°2 : jamais d'onglet verrouillé, ni de compteur révélateur) ; un seul onglet débloqué = pas de barre d'onglets. La page garde l'habillage de l'onglet affiché
       * (data-menu = l'onglet), donc chaque contenu conserve ses couleurs.
       */
      let idleChroniquesOngletV1='';
      function chroniquesOngletsIdleV1_(j){
        const liste=[];
        if(!j)return liste;
        if(j.bestiaire&&j.bestiaire.debloquee)liste.push({nom:'Collection',icon:'🏆',id:'bestiaire'});
        if(j.classement&&j.classement.debloque)liste.push({nom:'Classement',icon:'📊',id:'classement'});
        if(menuSuccesVisibleIdleV1_(j))liste.push({nom:'Succès',icon:'🎖️',id:'succes'});
        return liste;
      }
      function chroniquesOngletActifIdleV1_(j){
        const onglets=chroniquesOngletsIdleV1_(j||idleEtat);
        if(!onglets.length)return '';
        return onglets.some(function(o){return o.id===idleChroniquesOngletV1;})?idleChroniquesOngletV1:onglets[0].id;
      }
      /* Menu « de style » : pour Chroniques, l'onglet affiché ; sinon le menu actif. */
      function menuStyleIdleV1_(j){
        return idleMenuActifV28==='chroniques'?(chroniquesOngletActifIdleV1_(j)||'bestiaire'):idleMenuActifV28;
      }
      if(typeof window!=='undefined')window.__chroniquesOngletIdleV1__=function(id){
        if(!idleEtat)return;
        idleChroniquesOngletV1=String(id||'');
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root)root.setAttribute('data-menu',menuStyleIdleV1_(idleEtat));
        rafraichirMenuRacineIdleV28_();
      };
      if(typeof setInterval==='function')setInterval(actualiserNavAlimenteIdleV1_,500);
      /* Une couleur DIFFÉRENTE par menu (Norman, 2026-10-04 : « chacun sa couleur pour qu'on les repère mieux »). Le Shop est mauve, comme une boutique magique. */
      const IDLE_NAV_COULEURS_V1={
        entrainement:'#3b82f6',
        augmentations:'#f59e0b',
        combat:'#ef4444',
        aventure:'#16a34a',
        moneyPit:'#ca8a04',
        renaissance:'#fb923c',
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
        {id:'shop',icon:'🔮',nom:'Shop'},
        {id:'chroniques',icon:'📜',nom:'Chroniques'},
        {id:'chat',icon:'💬',nom:'Chat'},
        {id:'parametres',icon:'⚙️',nom:'Settings'},
        {id:'admin',icon:'🛠️',nom:'Admin'}
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-133 */
      let idleAdventureKoAlertV1=false;


      /*
       * Disponibilité dans le menu Money Pit (Norman, 2026-10-03 : « quand le Money Pit, la roue ou le bonus AP est disponible, le bouton doit glow de manière visible »). Renvoie
       * 'pit' (vert), 'roue' (jaune), 'calendrier' (orange) ou null ; priorité dans cet ordre. Heure du serveur pour les échéances.
       */
      function idleDisponibiliteMoneyPitV1_(j){
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        if(!(pit&&pit.unlock&&pit.unlock.unlocked))return null;
        const gold=idleNombre_(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold);
        const pitData=pit.state&&pit.state.data||null;
        if(pitData&&gold>=100000&&heureServeurIdleV1_()>=Number(pitData.nextAt||0))return 'pit';
        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const roueData=roue&&roue.state&&roue.state.data||null;
        if(roue&&roue.unlock&&roue.unlock.unlocked&&roueData&&heureServeurIdleV1_()>=Number(roueData.readyAt||0))return 'roue';
        const cal=j&&j.systemes&&j.systemes.loginCalendar;
        if(cal&&cal.reclamable)return 'calendrier';
        return null;
      }
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
      let idleMenuOrdreTravailV1=null;
      let idleMenuClicAvaleJusquaV1=0;




      function menusOrdonnesIdleV1_(j){
        return ordonnerMenusIdleV1_(
          IDLE_MENUS_V1,
          idleMenuEditionV1&&idleMenuOrdreTravailV1?idleMenuOrdreTravailV1:idleMenuOrdreEnregistreV1_(j)
        );
      }




      /*
       * Nombre de lignes du menu du haut sur téléphone (Norman, 2026-10-08 : « quand les gens éditent l'ordre des icônes, ils peuvent choisir 1, 2 ou 3 lignes »). Gardé sur l'appareil (le téléphone et l'ordinateur n'ont pas
       * les mêmes besoins) ; 2 par défaut.
       */
      const CLE_RANGEES_MENU_IDLE_V1='soreal_idle_menu_rangees_v1';
      window.__reglerRangeesMenuIdleV1__=function(n){
        n=n===1||n===3?n:2;
        try{localStorage.setItem(CLE_RANGEES_MENU_IDLE_V1,String(n));}catch(e){}
        const nav=document.querySelector('.soreal-idle-nav-v28');
        if(nav)nav.style.setProperty('--nav-rangees',String(n));
        Array.prototype.forEach.call(document.querySelectorAll('[data-nav-rangees]'),function(b){
          b.classList.toggle('actif',Number(b.getAttribute('data-nav-rangees'))===n);
        });
      };




      window.__validerRangementMenuIdleV1__=validerRangementMenuIdleV1_;

      installerRangementMenuIdleV1_();




      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-138 */
      function entetePageIdleV28_(
        titre,
        sousTitre
      ){
        return `
          <div class="soreal-idle-page-head-v28">
            <div class="soreal-idle-page-title-v28">
              ${titre}
            </div>
            ${sousTitre ? `
            <div class="soreal-idle-page-sub-v28">
              ${sousTitre}
            </div>
            ` : ''}
          </div>
        `;
      }


      function formatGrandNombreIdleV70_(valeur,decimales){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        return api&&typeof api.grandNombre==='function'
          ?api.grandNombre(valeur,decimales)
          :String(Math.round(idleNombre_(valeur)));
      }





      /* Le journal de combat est aussi montré dans l'écran de combat de titan (modules/titans-combat-ecran-v1.js, Norman 2026-10-15) : il s'y dessine par la même fonction. */
      window.__dessinerJournalAventureIdleV1__=dessinerJournalAventureIdleV1_;
      window.__ajouterLogAventureIdleV1__=ajouterLogAventureIdleV1_;



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
      /* Balises de voix (Norman, 2026-10-02) : « (marius) » dans une chronique change la voix de la lecture ; l'écran ne les montre jamais. */
      function sansBaliseVoixIdleV1_(texte){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        return T&&typeof T.sansBalises==='function'?T.sansBalises(texte):String(texte==null?'':texte);
      }
      /* Attribut portant le texte brut (avec ses balises) quand il en contient : la lecture le préfère au texte affiché. */
      function attrHistoireVoixIdleV1_(texte){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        return T&&typeof T.aDesBalises==='function'&&T.aDesBalises(texte)
          ?' data-soreal-tts-histoire="'+idleHtml_(String(texte||''))+'"'
          :'';
      }
      /* page Fight Boss : rendu dans modules/page-combat-v1.js (découpage du monolithe, 2026-10-16). */
      function pageCombatIdleV28_(){return window.__SOREAL_IDLE_PAGE_COMBAT_V1__.pageCombatIdleV28_.apply(null,arguments);}















      let idleSortPurchaseQueueV101=[];
      let idleSortPurchaseBusyV101=false;
















      window.__acheterSortIdleV90__=
        acheterSortIdleV90_;

      window.__lancerSortIdleV90__=
        lancerSortIdleV90_;









      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-154 */
      function formatDureeRunIdleV1_(secondesTotal){
        const api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
        return api&&typeof api.duree==='function'?api.duree(secondesTotal):'00:00:00';
      }
      function dureeRunSecondesIdleV1_(j){
        const api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
        return api&&typeof api.runSecondes==='function'?api.runSecondes(j):0;
      }
      function resumeStatsIdleV28_(j){
        const combat=j&&j.combatPrincipal?j.combatPrincipal:{};
        const systemes=j&&j.systemes?j.systemes:{};
        const monnaies=systemes.currencies||{};
        const records=systemes.records||{};
        const number=
          j&&j.renaissance&&j.renaissance.number!==undefined
            ?j.renaissance.number
            :j&&j.renaissance&&j.renaissance.multiplicateur!==undefined
              ?j.renaissance.multiplicateur
              :1;
        const apVisible=Boolean(
          idleNombre_(monnaies.ap)>0||
          (systemes.selloutShop&&systemes.selloutShop.unlockedEver)
        );
        const rebirths=Math.max(0,idleEntier_(records.totalRebirths||0));

        return `
          <div class="soreal-idle-summary-grid-v28">
            <div class="soreal-idle-summary-v28" data-tuile="attack">
              ⚔️ Attaque
              <b id="sorealIdleSummaryAttackV50">${formatGrandNombreIdleV70_(combat.attaque||j.puissance||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28" data-tuile="defense">
              🛡️ Défense
              <b id="sorealIdleSummaryDefenseV50">${formatGrandNombreIdleV70_(combat.defense||j.defense||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28" data-tuile="gold">
              🪙 Or
              <b id="sorealIdleSummaryGoldV50">${formatGrandNombreIdleV70_(monnaies.gold||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28" data-tuile="exp">
              ⭐ EXP
              <b id="sorealIdleSummaryExpV50">${formatGrandNombreIdleV70_(monnaies.experience||j.xp||0)}</b>
            </div>
            ${apVisible
              ?`<div class="soreal-idle-summary-v28" data-tuile="ap">
                  💠 AP
                  <b id="sorealIdleSummaryApV210">${formatGrandNombreIdleV70_(monnaies.ap||0)}</b>
                </div>`
              :''}
          </div>
        `;
      }




      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-157 */








      /* pages Collection (sets, créatures) : rendu dans modules/page-collection-v1.js (découpage du monolithe, 2026-10-16). */
      function rendreCollectionIdleV22_(){return window.__SOREAL_IDLE_PAGE_COLLECTION_V1__.rendreCollectionIdleV22_.apply(null,arguments);}
      function rendreCollectionCreaturesIdleV1_(){return window.__SOREAL_IDLE_PAGE_COLLECTION_V1__.rendreCollectionCreaturesIdleV1_.apply(null,arguments);}
      function pageCollectionIdleV22_(){return window.__SOREAL_IDLE_PAGE_COLLECTION_V1__.pageCollectionIdleV22_.apply(null,arguments);}
      function construireCarteBossIdleV91_(){return window.__SOREAL_IDLE_PAGE_COLLECTION_V1__.construireCarteBossIdleV91_.apply(null,arguments);}




      /* Nom du joueur dans le jeu (pseudo), lu par la scène Adventure (modules/adventure-scene-v79.js). */
      window.__nomJoueurIdleV1__=function(){
        return String(idleEtat&&idleEtat.nom||'Joueur');
      };


      window.__fermerCarteBossIdleV91__=
        fermerCarteBossIdleV91_;

      window.__combattreDepuisCarteBossIdleV91__=
        combattreDepuisCarteBossIdleV91_;


      let idleOrLocalAtV1=0,idleOrLocalPatchV1=0;
      const IDLE_MENUS_VIVANTS_V1={ngu:1,wandoos:1,yggdrasil:1,diggers:1,beards:1,wishes:1,hacks:1,daycare:1};
      /* Doigt ou souris enfoncé : un redessin entre l'appui et le relâchement ferait perdre le clic. */
      let idlePointeurEnfonceV1=0;
      try{
        document.addEventListener('pointerdown',function(){idlePointeurEnfonceV1=Date.now();},true);
        ['pointerup','pointercancel','click'].forEach(function(nom){document.addEventListener(nom,function(){idlePointeurEnfonceV1=0;},true);});
      }catch(_e){}
      function champSaisieActifIdleV1_(){
        if(idlePointeurEnfonceV1&&Date.now()-idlePointeurEnfonceV1<3000)return true;
        const a=document.activeElement;
        if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return true;
        /* Un champ modifié mais pas encore validé (ITOPOD : étages tapés ou réglés avec − et +) ne doit jamais être remis à zéro par un redessin. */
        const racine=document.querySelector('.soreal-idle-page-root-v28');
        if(!racine)return false;
        const champs=racine.querySelectorAll('input,textarea,select');
        for(let i=0;i<champs.length;i+=1){
          const c=champs[i];
          if(c.type==='checkbox'||c.type==='radio'){if(c.checked!==c.defaultChecked)return true;}
          else if(c.type!=='button'&&c.type!=='submit'&&c.value!==c.defaultValue)return true;
        }
        return false;
      }
      let idleVictoireBossLocaleV49=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-158 */
      let idleCombatArmeLocalV206=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-159 */
      let idleCombatEnPauseApresDefaiteV1=false;







      window.__definirCombatBossIdleV39__=
        definirCombatBossIdleV39_;

      /* Fuite voulue par le joueur (bouton) : le son de fuite ne joue que s'il y a un combat à fuir. */
      window.__fuirBossIdleV1__=function(){
        const enCombat=Boolean(idleEtat&&idleEtat.combatBossActif);
        definirCombatBossIdleV39_(false);
        if(enCombat){
          jouerEffetAudioIdleV199_('flee');
          /* Les rires de la salle se jouent EN PLUS du son de fuite (Norman, 2026-10-04). */
          jouerEffetAudioIdleV199_('laugh');
        }
      };


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-164 */
      let idleNukeEnCoursV1=false;






      window.__nukerBossIdleV1__=
        nukerBossIdleV1_;

      /*
       * Auto Nuker (Sellout Shop, 65 000 AP -- wiki : "automatically nuke bosses 10 seconds
       * into each rebirth, and then every minute afterwards"). Lance le même NUKE que le
       * bouton, à partir de l'horodatage de début de run exposé par le serveur.
       */
      let idleAutoNukeRunV1=0;
      let idleAutoNukeDernierV1=0;
      setInterval(function(){
        try{
          const j=idleEtat;
          const achats=j&&j.systemes&&j.systemes.selloutShop&&j.systemes.selloutShop.purchases;
          if(!achats||!(Number(achats.autoNuker)>0))return;
          const debut=Number(j.renaissance&&j.renaissance.runDebuteA)||0;
          if(debut!==idleAutoNukeRunV1){
            idleAutoNukeRunV1=debut;
            idleAutoNukeDernierV1=0;
          }
          const maintenant=Date.now();
          if(!autoNukeDueIdleV1_(debut,idleAutoNukeDernierV1,maintenant))return;
          if(idleNukeEnCoursV1||j.combatBossActif||j.bossBloqueRenaissance)return;
          idleAutoNukeDernierV1=maintenant;
          nukerBossIdleV1_();
        }catch(e){window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler&&window.__SOREAL_IDLE_DIAG_V1__.signaler('auto_nuke',e);}
      },1000);







/* Les bulles de phrases du joueur sur « Fight Boss » (« Même pas peur », « Ça va finir au recyclage »… : restes de la toute première version) ont été retirées (Norman, 2026-10-08). */






      /* page Basic Training : rendu dans modules/page-entrainement-v1.js (découpage du monolithe, 2026-10-16). */
      function pageEntrainementIdleV28_(){return window.__SOREAL_IDLE_PAGE_ENTRAINEMENT_V1__.pageEntrainementIdleV28_.apply(null,arguments);}






      window.__changerOngletCollectionIdleV1__=changerOngletCollectionIdleV1_;



      window.__changerPageCollectionEquipementV1__=changerPageCollectionEquipementV1_;


      window.__afficherDetailsCollectionIdleV1__=afficherDetailsCollectionIdleV1_;

      window.__ouvrirBossCollectionIdleV1__=ouvrirBossCollectionIdleV1_;
      /*
       * Édition depuis la fiche : le clic sur « Modifier le texte » est géré par modules/textes-admin-v1.js (éditeur plein écran, au-dessus de la fiche). Quand l'éditeur se referme, la fiche est rouverte avec le texte à jour
       * (la synchro demandée à l'enregistrement a eu le temps d'arriver).
       */
      if(typeof document.addEventListener==='function')document.addEventListener('click',function(ev){
        const bouton=ev.target&&ev.target.closest?ev.target.closest('#sorealIdleBossCollectionModalV1 [data-stx-boss]'):null;
        if(!bouton)return;
        const numero=idleEntier_(bouton.getAttribute('data-stx-boss'));
        fermerBossCollectionIdleV1_();
        let vu=false;
        const guet=setInterval(function(){
          const ouvert=Boolean(document.getElementById('sorealIdleTexteEditeurV1'));
          if(ouvert){vu=true;return;}
          if(vu||guet.__essais>40){
            clearInterval(guet);
            setTimeout(function(){if(vu)ouvrirBossCollectionIdleV1_(numero);},1500);
          }
          guet.__essais=(guet.__essais||0)+1;
        },300);
      },true);
      window.__fermerBossCollectionIdleV1__=fermerBossCollectionIdleV1_;



      window.__lireHistoireCompleteBossIdleV206__=
        lireHistoireCompleteBossIdleV206_;




      function aventureMetaIdleV47_(j){
        return j&&j.systemes&&j.systemes.adventure&&typeof j.systemes.adventure==='object'
          ?j.systemes.adventure
          :null;
      }

      function aventureDebloqueeIdleV47_(j){
        const a=aventureMetaIdleV47_(j);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        return zones.some(function(z){return z&&z.id==='tutorial'&&z.unlocked;});
      }

      let idleInventoryMutationQueueV160=[];
      let idleInventoryBusyV160=false;
      let idleInventorySequenceV160=0;
      let idleInventoryConfirmedAdventureV160=null;

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
      window.__SOREAL_IDLE_INVENTORY_PERF_V160__=idleInventoryPerfV160;




















      /* Après un redessin du sac : la fiche ouverte est rafraîchie, ou refermée si l'objet n'existe plus. */
      let idleFicheObjetOuverteIdV1='';















      /* No Equipment Challenge (page Challenges) : rien ne peut être équipé tant que le défi est actif (le serveur refuse aussi). */
      function equipementBloqueParDefiIdleV1_(){
        const c=idleEtat&&idleEtat.systemes&&idleEtat.systemes.challenge;
        return Boolean(c&&c.active==='noEquipment');
      }





      window.__zoneAdventurePrecedenteV1__=zoneAdventurePrecedenteV1_;
      window.__zoneAdventureSuivanteV1__=zoneAdventureSuivanteV1_;

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
      function fxIdleV1_(cible,type,texte){
        const fx=window.SorealCombatFxV1;
        if(!fx)return;
        try{fx.jouer(cible,type,texte);}catch(e){}
      }
      function titanMultDegatsJoueurIdleV1_(fight,maintenant){
        const api=window.SorealTitanComportementsV1;
        return api&&idleTitanEtatV1&&fight&&fight.titanId?api.multDegatsJoueur(fight.titanId,idleTitanEtatV1,maintenant):1;
      }
      function titanJoueurParalyseIdleV1_(maintenant){
        const api=window.SorealTitanComportementsV1;
        return Boolean(api&&idleTitanEtatV1&&api.joueurParalyse(idleTitanEtatV1,maintenant));
      }
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
      try{
        idleAdventureIdleModeV3=
          localStorage.getItem('sorealIdleAdventureIdleModeV3')!=='0';
      }catch(e){}
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




















      window.__basculerIdleModeAdventureIdleV3__=basculerIdleModeAdventureIdleV3_;





      window.__utiliserCompetenceAdventureIdleV3__=utiliserCompetenceAdventureIdleV3_;
      /* Écran de combat de titan (modules/titans-combat-ecran-v1.js) : mêmes raccourcis d'attaque que l'Aventure, état du titan et paralysie en lecture seule, arrêt du combat. */
      window.__rendreCommandesAdventureIdleV3__=function(){return rendreCommandesAdventureIdleV3_();};
      window.__titanEtatCombatIdleV1__=function(){return idleTitanEtatV1;};
      /* Page Titans (modules/titans-v1.js) : état à jour du joueur et rafraîchissement de la page, pour que la carte d'un titan vaincu passe toute seule en compte à rebours. */
      window.__titansEtatJoueurIdleV1__=function(){return idleEtat;};
      window.__titansRafraichirPageIdleV1__=function(){try{rafraichirMenuRacineIdleV28_();}catch(e){}};
      window.__rafraichirPageIdleV1__=window.__titansRafraichirPageIdleV1__; /* outil d'audit du redessin (modules/diag-fluidite-v1.js, __auditerRedessinIdleV1__) */
      window.__titanJoueurParalyseIdleV1__=function(maintenant){return titanJoueurParalyseIdleV1_(maintenant);};
      window.__arreterCombatTitanV1__=arreterCombatTitanIdleV1_;
      /* Journal des attaques (modules/journal-attaques-v1.js) : quels raccourcis expliquer = ceux qui sont débloqués (anti-spoil). */
      window.__competencesJournalIdleV1__=function(){
        /* Norman (2026-10-13) : le journal ne mentionne pas les attaques non débloquées : seuls les raccourcis réellement utilisables (même condition que le bouton actif) sont expliqués. */
        const a=aventureMetaIdleV47_(idleEtat);
        function debloquees(liste,groupe){
          return liste.filter(function(d){return competenceAdventureDisponibleIdleV4_(d,groupe,a);}).map(function(d){return d.id;});
        }
        return debloquees(IDLE_ADVENTURE_MANUAL_ATTACKS_V3,'attack')
          .concat(debloquees(IDLE_ADVENTURE_MANUAL_DEFENSE_V3,'defense'))
          .concat(debloquees(IDLE_ADVENTURE_ADVANCED_SKILLS_V4,'advanced'));
      };











      /*
       * 2026-09-23 (audit) : la régénération d'aventure paraissait instantanée.
       * Cause : adventureRestPv (PV de repos entre deux combats / en Safe Zone)
       * vivait dans idleEtat, qui est REMPLACÉ à chaque synchro serveur
       * (toutes les 15 s) par un objet où ce champ n'existe pas ; le tick
       * suivant lisait « null » et remettait les PV au maximum. Le PV de
       * repos est désormais mémorisé hors de idleEtat et réinjecté.
       */
      let idleAdventureRestPvMemoV1=null;
      function restPvInitialIdleV1_(pvMax){
        const memo=idleAdventureRestPvMemoV1;
        if(memo==null||!Number.isFinite(memo))return pvMax;
        return Math.min(pvMax,Math.max(0,memo));
      }
      function memoriserRestPvIdleV1_(valeur){
        const n=idleNombre_(valeur);
        idleAdventureRestPvMemoV1=Number.isFinite(n)?Math.max(0,n):null;
      }








      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-208 */




      function trouverWalderpIdleV147_(){
        actionAdventureIdleV47_({action:'titanFound',titan:'t5'});
      }
      window.__trouverWalderpIdleV147__=trouverWalderpIdleV147_;


      function utiliserObjetDeblocageIdleV1_(id){
        actionAdventureIdleV47_({action:'useUnlockItem',itemId:String(id||'')});
      }
      window.__utiliserObjetDeblocageIdleV1__=utiliserObjetDeblocageIdleV1_;

      window.__consommerDeblocageAdventureIdleV47__=consommerDeblocageAdventureIdleV47_;

      window.__consommerObjetSkillAdventureIdleV4__=consommerObjetSkillAdventureIdleV4_;

      window.__transformerObjetAdventureIdleV4__=transformerObjetAdventureIdleV4_;


      window.__desequiperObjetAdventureIdleV47__=desequiperObjetAdventureIdleV47_;



      function actionMetaV47_(payload){
        actionMetaIdleV130_(payload||{});
      }

      function setDiggerIdleV47_(id,niveau){
        actionMetaV47_({action:'setDiggerLevel',digger:String(id||''),level:Math.max(0,idleEntier_(niveau))});
      }

      function toggleDiggerIdleV47_(id,actif){
        actionMetaV47_({action:'toggleDigger',digger:String(id||''),active:Boolean(actif)});
      }

      /* Durées de Yggdrasil en heures et minutes, « 09h58 » (Norman, 2026-10-15 : « le format d'heure est en 0.85 h, je veux 09h58 »). */
      function formatterHeuresIdleV47_(heures){
        const n=Number(heures);
        const minutesTotales=Math.floor((Number.isFinite(n)&&n>0?n:0)*60+1e-6);
        const h=Math.floor(minutesTotales/60),m=minutesTotales%60;
        return (h<10?'0':'')+h+'h'+(m<10?'0':'')+m;
      }
      if(!window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__){
        window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__=true;
        document.addEventListener('click',function(event){
          const bloc=document.getElementById('idleZoneSelectCustom');
          if(bloc&&event&&!bloc.contains(event.target)){
            bloc.classList.remove('open');
          }
        });
      }
      window.__toggleMenuZoneAdventureIdleV1__=toggleMenuZoneAdventureIdleV1_;

      window.__selectionnerZoneAdventureIdleV47__=selectionnerZoneAdventureIdleV47_;
      window.__equiperParIdAdventureIdleV138__=equiperParIdAdventureIdleV138_;
      window.__actionMetaV47__=actionMetaV47_;
      window.__toastIdleV5__=toastIdleV5_;
      window.__setDiggerIdleV47__=setDiggerIdleV47_;
      window.__toggleDiggerIdleV47__=toggleDiggerIdleV47_;



let idleVueAventureV1='zones';
window.__vueAventureIdleV1__=function(v){
  /* Norman (2026-10-13) : le bouton Aventure (retour aux zones) arrête le combat de titan en cours et laisse en Zone sûre. */
  if(v!=='titans')arreterCombatTitanIdleV1_();
  idleVueAventureV1=v==='titans'?'titans':'zones';
  /* Norman (2026-10-10) : les combats d'Aventure (scène + journal) et l'automatisation de l'inventaire ne s'affichent pas sur la page Titans (voir soreal-idle-itopod.css). */
  document.documentElement.setAttribute('data-vue-aventure',idleVueAventureV1);
  try{rafraichirMenuRacineIdleV28_();}catch(e){}
};







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
      window.__changerPageSacV1__=changerPageSacV1_;


      window.__deposerSurEmplacementVideSacAdventureIdleV1__=deposerSurEmplacementVideSacAdventureIdleV1_;

      let idleAdventureDragIdV138='';
      let idleAdventureIgnorerClicJusquaV165=0;


      let idleAdventureGesteV196=null;


















      /*
       * Gestes du sac ACHETÉS (Norman, 2026-10-04) : le double tap (équiper / fusionner d'un objet du sac, absorber les boosts d'une pièce équipée) et le triple tap n'existent plus de base. Deux achats de la boutique EXP,
       * rayon Aventure : « Double tap » (20 EXP : un objet, équipé ou non, absorbe tous les boosts du sac) et « Triple tap » (30 EXP : il fusionne automatiquement avec les pièces identiques disponibles). Les drapeaux
       * viennent du serveur (inventoryAuto.unlocked). Tactile et stylet seulement : la souris garde « A + clic » et le clic droit.
       */
      function gestesAchetesIdleV1_(){
        const u=idleEtat&&idleEtat.systemes&&idleEtat.systemes.inventoryAuto&&idleEtat.systemes.inventoryAuto.unlocked;
        return {double:Boolean(u&&u.doubleTap),triple:Boolean(u&&u.tripleTap)};
      }












      installerGestesInventaireAdventureIdleV196_();

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
      function annulerOuvertureSurvolIdleV1_(){
        clearTimeout(idleSurvolTimerOuvrirV1);
        idleSurvolTimerOuvrirV1=0;
        idleSurvolEnAttenteIdV1='';
      }

      function survolPossibleIdleV1_(event){
        if(!event||event.pointerType==='touch'||event.pointerType==='pen')return false;
        if(window.matchMedia&&!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return false;
        return true;
      }

      function survolOccupeIdleV1_(){
        return Boolean(
          idleSurvolBloqueV1||
          idleAdventureDragIdV138||
          idleAdventureGesteV196||
          idleAdventureComparerEnAttenteV183||
          document.getElementById('soreal-idle-v138-details-compare-v183')
        );
      }

      function fermerSurvolIdleV1_(){
        clearTimeout(idleSurvolTimerFermerV1);
        idleSurvolTimerFermerV1=0;
        if(!idleSurvolIdV1)return;
        idleSurvolIdV1='';
        if(popupDetailsObjetAdventureIdleOuvertV207_())fermerDetailsObjetAdventureIdleV1_();
      }

      function ouvrirSurvolIdleV1_(element,id){
        if(survolOccupeIdleV1_()||!element||!element.isConnected)return;
        if(!ouvrirDetailsObjetParGesteAdventureIdleV196_(id))return;
        idleSurvolIdV1=id;
        idleAdventureIgnorerClicJusquaV165=0; /* le survol ne doit pas avaler le premier clic */
        const root=document.getElementById('soreal-idle-v138-details');
        if(!root)return;
        /* À côté de l'objet (à droite, sinon à gauche), sans le recouvrir : la souris peut passer de l'objet au popup. */
        const r=element.getBoundingClientRect();
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const marge=8;
        let left=r.right+4;
        if(left+largeur>window.innerWidth-marge)left=r.left-largeur-4;
        left=Math.min(Math.max(marge,left),Math.max(marge,window.innerWidth-largeur-marge));
        const top=Math.min(Math.max(marge,r.top-6),Math.max(marge,window.innerHeight-hauteur-marge));
        idleItemPopupPositionV1_={left:Math.round(left),top:Math.round(top)};
        root.style.left=idleItemPopupPositionV1_.left+'px';
        root.style.top=idleItemPopupPositionV1_.top+'px';
      }

      /*
       * Plus de popup au survol dans l'inventaire (Norman, 2026-10-15 : « au survol de la souris, le popup apparaît toujours dans l'inventaire ; j'ai demandé de le remplacer par un simple clic sur l'objet »).
       * La fiche d'un objet du sac ou de l'équipement s'ouvre par un clic (voir le tap-fiche des gestes d'inventaire, installerGestesInventaireAdventureIdleV196_) ; le survol n'ouvre plus rien.
       * (Le Coffre et la Collection gardent leur fiche au survol : leurs cases ne sont pas des objets du sac.)
       */

      /* La souris quitte la fenêtre du navigateur */
      document.documentElement.addEventListener('mouseleave',function(){
        annulerOuvertureSurvolIdleV1_();
        if(!idleSurvolIdV1)return;
        clearTimeout(idleSurvolTimerFermerV1);
        idleSurvolTimerFermerV1=setTimeout(function(){
          idleSurvolTimerFermerV1=0;
          fermerSurvolIdleV1_();
        },200);
      });

      /* Presser un objet à la souris = glisser-déposer : le popup ne doit pas gêner, ni revenir avant le relâchement. */
      document.addEventListener('pointerdown',function(event){
        if(!survolPossibleIdleV1_(event))return;
        if(!elementObjetGesteAdventureIdleV196_(event.target))return;
        idleSurvolBloqueV1=true;
        annulerOuvertureSurvolIdleV1_();
        fermerSurvolIdleV1_();
      },true);
      document.addEventListener('pointerup',function(){
        setTimeout(function(){idleSurvolBloqueV1=false;},60);
      },true);












      window.__deposerSurCubeAdventureIdleV138__=deposerSurCubeAdventureIdleV138_;


      let idleCubeDetailsTimerV1=0;
      window.__clicCubeAdventureIdleV138__=clicCubeAdventureIdleV138_;

      window.__deposerSurTrashAdventureIdleV138__=deposerSurTrashAdventureIdleV138_;
      window.__supprimerObjetAdventureIdleV165__=supprimerObjetAdventureIdleV165_;
      window.__basculerVerrouObjetAdventureIdleV165__=basculerVerrouObjetAdventureIdleV165_;



      /* Special Boost (2026-09-25) : un objet accepte encore un boost tant qu'UN de ses Specials n'est pas plein (les points remplissent les Specials dans l'ordre de la fiche). */
      function specialAcceptePlusDeBoostIdleV1_(item){
        const tous=item&&Array.isArray(item.specialsAll)?item.specialsAll:null;
        if(!tous||!tous.length)return null;
        return tous.some(function(sv){return idleNombre_(sv.value)+1e-9<idleNombre_(sv.max);});
      }




      window.__consulterObjetIdleV1__=function(cle,element){
        clearTimeout(idleSurvolVirtuelTimerV1);
        idleSurvolVirtuelTimerV1=0;
        idleSurvolVirtuelCleV1=cle;
        afficherPopupObjetUnifieIdleV1_(cle,element);
      };
      let idleSurvolVirtuelTimerV1=0;
      let idleSurvolVirtuelFermerV1=0;
      let idleSurvolVirtuelCleV1='';
      document.addEventListener('mouseover',function(event){
        if(!survolPossibleIdleV1_(event))return;
        const cible=event.target;
        if(cibleDansPopupDetailsObjetAdventureIdleV207_(cible)){
          clearTimeout(idleSurvolVirtuelFermerV1);
          idleSurvolVirtuelFermerV1=0;
          return;
        }
        const element=cible&&cible.closest?cible.closest('[data-popup-objet-v1]'):null;
        if(element){
          clearTimeout(idleSurvolVirtuelFermerV1);
          idleSurvolVirtuelFermerV1=0;
          const cle=element.getAttribute('data-popup-objet-v1');
          if(cle===idleSurvolVirtuelCleV1&&popupDetailsObjetAdventureIdleOuvertV207_())return;
          clearTimeout(idleSurvolVirtuelTimerV1);
          idleSurvolVirtuelTimerV1=setTimeout(function(){
            idleSurvolVirtuelTimerV1=0;
            if(!element.isConnected||survolOccupeIdleV1_())return;
            idleSurvolVirtuelCleV1=cle;
            afficherPopupObjetUnifieIdleV1_(cle,element);
          },IDLE_SURVOL_DELAI_OUVERTURE_MS_V1);
          return;
        }
        clearTimeout(idleSurvolVirtuelTimerV1);
        idleSurvolVirtuelTimerV1=0;
        if(idleSurvolVirtuelCleV1&&!idleSurvolVirtuelFermerV1){
          idleSurvolVirtuelFermerV1=setTimeout(function(){
            idleSurvolVirtuelFermerV1=0;
            idleSurvolVirtuelCleV1='';
            if(popupDetailsObjetAdventureIdleOuvertV207_())fermerDetailsObjetAdventureIdleV1_();
          },250);
        }
      });

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-272 */
      let idleItemPopupPositionV1_=null;
      /* Les deux objets de la comparaison ouverte : un redessin du sac rafraîchit la fenêtre sans la refermer ni la réduire à un seul objet (Norman, 2026-10-15 : « Comparer se ferme tout seul »). */
      let idleComparaisonIdsV1=[];
      function composerCorpsComparaisonIdleV1_(corps,firstId,secondId){
        const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const existe=function(id){return items.some(function(x){return String(x&&x.id)===id;});};
        if(!corps||!existe(firstId)||!existe(secondId))return false;
        afficherDetailsObjetAdventureIdleV138_(firstId);
        const firstHtml=corps.innerHTML;
        afficherDetailsObjetAdventureIdleV138_(secondId);
        const secondHtml=corps.innerHTML;
        corps.innerHTML='<div class="idle-compare-bloc-v1">'+firstHtml+'</div><div class="idle-compare-vs-v1" aria-hidden="true"><span>VS</span></div><div class="idle-compare-bloc-v1">'+secondHtml+'</div>';
        return true;
      }
      let idleAdventureComparerEnAttenteV183=false;

      /* Taille et place de la fenêtre unique de comparaison (partagées par l'ouverture et la remise en place après un redessin de la page). */
      function poserFenetreComparaisonIdleV1_(root,gauche,haut){
        const marge=8;
        const largeur=Math.min(window.innerWidth<=600?window.innerWidth-marge*2:320,window.innerWidth-marge*2);
        root.style.display='block';
        root.classList.add('idle-compare-v183');
        root.style.width=largeur+'px';
        root.style.maxHeight=(window.innerHeight-marge*2)+'px';
        root.style.left=Math.max(marge,Math.min(gauche||marge,window.innerWidth-largeur-marge))+'px';
        root.style.top=Math.max(marge,Math.min(haut||marge,window.innerHeight-root.offsetHeight-marge))+'px';
        idleItemPopupPositionV1_={left:parseInt(root.style.left,10)||marge,top:parseInt(root.style.top,10)||marge};
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }
      /*
       * Redessin COMPLET de la page (le popup d'objet est dans la page : le redessin le remet fermé et vide) : la comparaison ou la fiche ouverte est remise en place, au même endroit, dans la même tâche
       * (règle n°4 d'AGENTS.md). Ce n'est fait que si l'utilisateur ne l'a pas refermée (la fermeture efface les identifiants mémorisés).
       */
      function restaurerFichesApresRedessinIdleV1_(){
        if(idleMenuActifV28!=='aventure')return;
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps||(root.style.display!=='none'&&root.querySelector('.soreal-idle-item-popup-body-v1 *')))return;
        const pos=idleItemPopupPositionV1_||{left:0,top:0};
        if(idleComparaisonIdsV1.length===2){
          if(composerCorpsComparaisonIdleV1_(corps,idleComparaisonIdsV1[0],idleComparaisonIdsV1[1]))poserFenetreComparaisonIdleV1_(root,pos.left,pos.top);
          return;
        }
        const id=String(idleFicheObjetOuverteIdV1||'');
        if(!id)return;
        afficherDetailsObjetAdventureIdleV138_(id);
        if(pos&&pos.left!=null){root.style.left=pos.left+'px';root.style.top=pos.top+'px';}
      }
      (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(restaurerFichesApresRedessinIdleV1_);
      window.__comparerObjetAdventureIdleV183__=comparerObjetAdventureIdleV183_;
      window.__fermerComparaisonObjetAdventureIdleV183__=fermerComparaisonObjetAdventureIdleV183_;

      window.__fermerDetailsObjetAdventureIdleV1__=fermerDetailsObjetAdventureIdleV1_;

      /*
       * Norman (2026-09-29) : « Il y a maintenant 2 fenêtre popup au survol d'un objet avec la
       * souris [...] Supprimer completement celui qui met 1sec a s'ouvrir. » L'infobulle de survol
       * légère (2026-09-29, lecture seule, séparée du popup interactif) est retirée : le popup
       * interactif complet (afficherDetailsObjetAdventureIdleV138_) s'ouvre désormais directement
       * au survol, sans délai -- voir le bloc "PC — popup d'objet au SURVOL" plus haut. Plus jamais
       * deux popups distincts au survol d'un objet.
       */

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-273 */

      window.__clicTrashAdventureIdleV138__=clicTrashAdventureIdleV138_;


      window.__survolCibleAdventureIdleV138__=survolCibleAdventureIdleV138_;
      window.__quitterCibleAdventureIdleV138__=quitterCibleAdventureIdleV138_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-274 */
      const IDLE_PAGINATION_TAILLE_V1=60;

      function rendrePaginationIdleV1_(pageActuelle,totalPages,callbackJs){
        if(totalPages<=1)return '';
        const boutons=[];
        for(let p=1;p<=totalPages;p++){
          boutons.push(
            '<button class="soreal-idle-pagination-btn-v1'+(p===pageActuelle?' active':'')+'" '+
            'onclick="'+callbackJs+'('+p+')">'+p+'</button>'
          );
        }
        return '<div class="soreal-idle-pagination-v1">'+boutons.join('')+'</div>';
      }

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

      function idleLabelSpecialBonusV1_(type){
        const entree=
          IDLE_SPECIAL_BONUS_TYPES_V1_.find(function(e){return e[0]===type;});

        return entree?entree[1]:String(type||'Spécial');
      }


      /* 2026-09-27 (Norman : « uniquement quand on est dans la zone tutoriel... une phrase qui explique aux gens
         comment ça fonctionne ») : mécanique vérifiée dans inventory-auto-v1.js (double-tap = équiper/fusionner ;
         touche A + clic, ou double-tap sur un objet déjà équipé = booster) — jamais une touche « 1 », qui n'existe pas. */


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-281 */
      let idlePageCoffreV1=1;
      window.__changerPageCoffreV1__=changerPageCoffreV1_;

      /*
       * Recherche dans le Coffre (Norman, 2026-10-03 : « dans le coffre, on doit pouvoir taper une recherche, par exemple Magic power ; le filtre ne doit afficher que les items avec du Magic Power dans
       * leurs stats ; ça doit marcher aussi pour les noms d'items »). Sans accent ni majuscule. La phrase tapée doit se retrouver ENTIÈRE dans le nom de l'objet (ou de son set / sa zone) ou dans
       * UN SEUL intitulé de statistique : « magic power » ne ramène donc pas un objet qui a seulement « Magic Cap » et de la « Puissance ». Seules les cases déjà découvertes existent ici (anti-spoil).
       */
      let idleRechercheCoffreV1='';
      function normaliserRechercheIdleV1_(t){
        return String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
      }
      /* Tape dans la recherche : seule la grille est redessinée (le champ garde le focus) et on revient à la page 1. */
      window.__filtrerObjetCoffreIdleV1__=function(definitionId,bouton){
        const filtre=!(bouton&&bouton.classList.contains('actif'));
        if(bouton){
          bouton.classList.toggle('actif',filtre);
          bouton.textContent=filtre?'🚫':'🧹';
          bouton.title=filtre?'Filtré : cet objet n’est plus ramassé dans cette zone. Clique pour le ramasser de nouveau.':'Clique pour ne plus ramasser cet objet dans cette zone.';
        }
        if(typeof window.__inventaireAutoFiltreObjetV1__==='function')window.__inventaireAutoFiltreObjetV1__(definitionId,filtre);
      };
      window.__rechercheCoffreV1__=function(texte){
        idleRechercheCoffreV1=String(texte==null?'':texte);
        idlePageCoffreV1=1;
        const conteneur=document.getElementById('sorealIdleCoffreGrilleV1');
        const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
        if(conteneur&&a)conteneur.innerHTML=grilleCoffreAdventureIdleV1_(Array.isArray(a.coffreSlots)?a.coffreSlots:[]);
      };



      /* Le Coffre contient-il un objet dont le nom correspond ? (ses excuses après un pet peuvent le citer : modules/coffre-digestion-v1.js) */
      window.__coffreContientObjetIdleV1__=function(motif){
        try{
          const a=aventureMetaIdleV47_(idleEtat);
          return !!(a&&Array.isArray(a.coffreSlots)&&a.coffreSlots.some(function(s){return s&&s.occupe&&motif.test(String(s.name||(s.item&&s.item.name)||''));}));
        }catch(_e){return false;}
      };



      window.__toggleCoffreOuvertAdventureIdleV1__=toggleCoffreOuvertAdventureIdleV1_;

      window.__deposerSurCoffreAdventureIdleV1__=deposerSurCoffreAdventureIdleV1_;

      window.__clicCoffreAdventureIdleV1__=clicCoffreAdventureIdleV1_;

      window.__retirerDuCoffreAdventureIdleV1__=retirerDuCoffreAdventureIdleV1_;



      /*
       * 2026-09-23 : le drapeau "occupé" vit UNIQUEMENT dans le module
       * meta-progression-v130.js (celui qui envoie réellement les requêtes).
       * Depuis le split UI V9, ce monolithe en gardait une copie jamais
       * assignée, donc toujours false : la résolution d'un combat de zone
       * n'était jamais acquittée (idleAdventureResolutionPendingV2 restait
       * armé) et le combat suivant ne démarrait plus, jusqu'au rechargement.
       */
      function metaOccupeIdleV130_(){
        const api=window.__SOREAL_IDLE_META_V130__;
        return Boolean(api&&typeof api.estOccupeIdleV130_==="function"&&api.estOccupeIdleV130_());
      }

      /*
       * Historique V9 (UI split) : le dispatcheur "Système Méta" (Yggdrasil,
       * Gold Diggers, Perks, Quirks, ITOPOD, Challenges, Augmentations,
       * Time Machine, Blood Magic, Money Pit/Daily Spin, Boutique EXP) a été
       * extrait vers cloudflare/public/modules/meta-progression-v130.js sans
       * changement fonctionnel. Ce module tourne dans une portée JS séparée
       * (balise <script> distincte) et ne peut donc pas lire/écrire
       * directement les variables et fonctions internes du monolithe : ce
       * pont les expose explicitement. Lu à l'exécution des fonctions du
       * module, jamais à son chargement : l'ordre des <script> n'a pas
       * d'importance.
       */
      window.__SOREAL_IDLE_META_HOST_V130__={
        getIdleEtat:function(){return idleEtat;},
        setIdleEtat:function(v){idleEtat=v;},
        setIdleAdventureRespawnStartPending:function(v){idleAdventureRespawnStartPendingV165=v;},
        idleHtml_:idleHtml_,
        idleNombre_:idleNombre_,
        idleEntier_:idleEntier_,
        formatGrandNombreIdleV70_:formatGrandNombreIdleV70_,
        formatterHeuresIdleV47_:formatterHeuresIdleV47_,
        entetePageIdleV28_:entetePageIdleV28_,
        toastIdleV5_:toastIdleV5_,
        messageFlottantIdleV32_:messageFlottantIdleV32_,
        rendreIdleEtat_:rendreIdleEtat_,
        pousserEtatVersRuntimePartageIdleV1_:pousserEtatVersRuntimePartageIdleV1_,
        appliquerSynchroCombatSansReflowIdleV116_:appliquerSynchroCombatSansReflowIdleV116_,
        ajouterLogAventureIdleV1_:ajouterLogAventureIdleV1_,
        aventureMetaIdleV47_:aventureMetaIdleV47_,
        protegerJoueurServeurInventaireIdleV208_:protegerJoueurServeurInventaireIdleV208_,
        estMutationInventaireAdventureIdleV160_:estMutationInventaireAdventureIdleV160_,
        patchInventaireAdventureIdleV160_:patchInventaireAdventureIdleV160_,
        appelerProgressionIdleCloudflareV1_:appelerProgressionIdleCloudflareV1_,
        patchZoneAdventureSansReflowIdleV1_:patchZoneAdventureSansReflowIdleV1_,
        idleRareteClasseObjetAdventureIdleV1_:idleRareteClasseObjetAdventureIdleV1_,
        jouerEffetAudioIdleV199_:jouerEffetAudioIdleV199_,
        /*
         * Norman (2026-09-29) : « j'ai l'impression que la réactivité n'est pas aussi bonne que dans
         * basic training. » Exposé pour qu'Augmentation/Blood Magic puissent rafraîchir la barre
         * d'Énergie/Magie principale sans passer par un rendreIdleEtat_ complet (qui régénère TOUT
         * le menu affiché à chaque clic +/-/Cap -- beaucoup plus lourd qu'un patch DOM ciblé, comme
         * ajusterBasicTrainingIdleV120_ le fait déjà).
         */
        rafraichirEnergieEtBoutonsIdleV9_:rafraichirEnergieEtBoutonsIdleV9_,
        /* Chantier « réactivité » (2026-09-30) : recalcul local des barres Time Machine et redessin local d'un menu, sans aller-retour serveur. */
        patcherBarresTimeMachineIdleV1_:patcherBarresTimeMachineIdleV1_,
        rafraichirMenuRacineIdleV28_:rafraichirMenuRacineIdleV28_
      };

      function pageSystemeMetaIdleV130_(j,id,titre){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.pageSystemeMetaIdleV130_==='function'){
          return api.pageSystemeMetaIdleV130_(j,id,titre);
        }
        return '';
      }

      function actionMetaIdleV130_(payload){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.actionMetaIdleV130_==='function'){
          return api.actionMetaIdleV130_(payload);
        }
      }

      function systemeMetaParIdIdleV130_(j,id){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.systemeMetaParIdIdleV130_==='function'){
          return api.systemeMetaParIdIdleV130_(j,id);
        }
        return null;
      }

      window.__changerOngletShopIdleV1__=changerOngletShopIdleV1_;



      window.__changerOngletClassementIdleV1__=changerOngletClassementIdleV1_;

      window.__actualiserClassementIdleV1__=function(){chargerClassementIdleV1_(true);};

      function formaterDureeJeuIdleV1_(secondes){
        let s=Math.max(0,Math.floor(idleNombre_(secondes)));
        const j=Math.floor(s/86400);s-=j*86400;
        const h=Math.floor(s/3600);s-=h*3600;
        const m=Math.floor(s/60);
        if(j>0)return j+' j '+h+' h '+m+' min';
        if(h>0)return h+' h '+m+' min';
        return m+' min';
      }



      function pageSpendExpIdleV1_(j){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.pageSpendExpIdleV1_==='function'){
          return api.pageSpendExpIdleV1_(j);
        }
        return '';
      }


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
      try{idleApOngletV1=localStorage.getItem('soreal_idle_ap_onglet_v1')||'';}catch(e){}
      window.__ongletApShopIdleV1__=function(id){
        if(!Object.prototype.hasOwnProperty.call(IDLE_SELLOUT_SHOP_CATEGORIES_V1,id))return;
        idleApOngletV1=id;
        try{localStorage.setItem('soreal_idle_ap_onglet_v1',id);}catch(e){}
        if(idleEtat)rendreIdleEtat_({ok:true,joueur:idleEtat});
      };


      /*
       * ANTI-SPOIL (règle n°2, Norman 2026-10-08 : « on peut acheter des choses pour des menus qu'on n'a pas encore débloqués : graines, Yggdrasil… ») : un article de la boutique AP
       * lié à un système encore verrouillé n'apparaît pas du tout (ni nom, ni prix, ni rayon qui ne contiendrait que lui).
       */
      const IDLE_AP_SYSTEME_DE_L_ARTICLE_V1={
        magicPotionAlpha:'bloodMagic',magicPotionBeta:'bloodMagic',magicPotionDelta:'bloodMagic',magicBarBar:'bloodMagic',
        resource3PotionAlpha:'hacks',resource3PotionBeta:'hacks',resource3PotionDelta:'hacks',
        macguffinMuffin:'macguffins',
        icarusFertilizer1:'yggdrasil',icarusFertilizer10:'yggdrasil',icarusFertilizer100:'yggdrasil',yggdrasilHarvestLight:'yggdrasil',heartBrown:'yggdrasil',
        littleBluePill1000:'tower',littleBluePill10000:'tower',littleBluePill100000:'tower',lazyItopodFloorShifter:'tower',heartGreen:'tower',pp25:'tower',pp100:'tower',pp500:'tower',
        beastButter1:'questing',beastButter10:'questing',beastButter100:'questing',questReminder:'questing',fasterQuesting:'questing',extendedQuestBank:'questing',goToQuestZoneButton:'questing',heartOrange:'questing',
        mayoInfuser:'cards',regularBlackPens:'cards',mayoGenerator:'cards',extraDeckSize:'cards',extraTagSlot:'cards',heartRainbow:'cards',
        luckyCharm:'adventure',superLuckyCharm:'adventure',improvedLootFilter:'adventure',extraInventorySpace:'adventure',autoMergeBoostTimers:'adventure',filterBoostsIntoCube:'adventure',loadoutSlot:'adventure',
        extraAccessorySlot1:'adventure',extraAccessorySlot2:'adventure',extraAccessorySlot3:'adventure',extraAccessorySlot4:'adventure',extraAccessorySlot5:'adventure',extraAccessorySlotEvil:'adventure',
        autoNuker:'adventure',inventoryMergeSlots:'adventure',adventureLight:'adventure',adventureAdvancer:'adventure',
        customEnergyMagicButtons:'bloodMagic',moreCustomEnergyMagicButtons:'bloodMagic',customIdleEnergyMagicButtons:'bloodMagic',
        dailySpinTimeBank:'dailySpin',extraBeardSlot:'beards',daycareSpeedBoost:'daycare',daycareKittyArt:'daycare',diggerSlots:'diggers',macguffinSlot:'macguffins',heartPurple:'macguffins',
        nguCapModifier:'ngu',customResource3Button:'hacks',anotherCustomResource3Button:'hacks',customIdleResource3Button:'hacks',resource3NameRandomizer:'hacks',heartGrey:'hacks',
        fasterWishes:'wishes',heartPink:'wishes'
      };
      function articleApVisibleIdleV1_(j,item){
        if(!item||item.effectActive!==true)return false;
        const systeme=IDLE_AP_SYSTEME_DE_L_ARTICLE_V1[item.id];
        if(!systeme)return true;
        if(systeme==='adventure'){
          const rec=j&&j.systemes&&j.systemes.records;
          return Boolean(rec&&idleNombre_(rec.highestBoss)>=4);
        }
        const sys=systemeMetaParIdIdleV130_(j,systeme);
        return Boolean(sys&&sys.state&&sys.state.unlocked);
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


















      window.__ouvrirPopupResetTotalIdleV67__=
        ouvrirPopupResetTotalIdleV67_;

      window.__fermerPopupResetTotalIdleV67__=
        fermerPopupResetTotalIdleV67_;

      window.__executerResetTotalIdleV67__=
        executerResetTotalIdleV67_;






      /*
       * Notes de mise à jour (Norman, 2026-09-25) : données dans modules/release-notes-v1.js (une entrée en tête à chaque mise à jour).
       * Dépliées seulement à la demande ; l'état est mémorisé sur cet appareil.
       */
      function notesMajIdleV1_(){
        const n=window.__SOREAL_IDLE_RELEASE_NOTES_V1__;
        return n&&Array.isArray(n.versions)?n:{courante:'?',versions:[]};
      }
      window.__basculerNotesMajIdleV1__=basculerNotesMajIdleV1_;
      /* Notes en PAGES (Norman, 2026-10-11) : une version par page, la plus récente d'abord, avec « Précédente » / « Suivante ». */
      let notesMajPageIdleV1_=0;
      window.__pageNotesMajIdleV1__=function(delta){
        const total=notesMajIdleV1_().versions.length;
        notesMajPageIdleV1_=Math.max(0,Math.min(total-1,notesMajPageIdleV1_+(Number(delta)||0)));
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)rafraichirMenuRacineIdleV28_();
      };
      /*
       * Clic sur « Beta x.y » en haut de l'app (Norman, 2026-10-08) : ouvre les Réglages, déplie les notes de mise à jour et les amène à l'écran.
       */
      window.__ouvrirNotesMajIdleV1__=function(){
        try{localStorage.setItem('soreal_idle_notes_maj_ouvert_v1','1');}catch(e){}
        if(idleMenuActifV28==='parametres'){
          const root=document.querySelector('.soreal-idle-page-root-v28');
          if(root&&idleEtat)rafraichirMenuRacineIdleV28_();
        }else if(typeof window.__menuIdleV28__==='function'){
          window.__menuIdleV28__('parametres');
        }
        let essais=0;
        (function montrer(){
          const cible=document.querySelector('.soreal-idle-notes-maj-v1')||document.querySelector('.soreal-idle-notes-maj-bouton-v1');
          if(cible){
            /* Plusieurs passes : le rendu de la page et la remise en place du défilement peuvent annuler la première. */
            [0,350,900].forEach(function(d){setTimeout(function(){const c=document.querySelector('.soreal-idle-notes-maj-v1')||document.querySelector('.soreal-idle-notes-maj-bouton-v1');if(c)c.scrollIntoView({block:'start',behavior:'auto'});},d);});
            return;
          }
          if(++essais<20)setTimeout(montrer,150);
        })();
      };

      /*
       * Norman (2026-09-27) : « Tu dois ajouter dans paramètres, des barres de son pour régler le volume des
       * voix et le volume d'ambiance. » Pas de re-rendu de la page à chaque glissement du curseur (perdrait le
       * focus/le geste en cours) : on ajuste juste le module concerné + le pourcentage affiché.
       */
      window.__reglerVolumeIdleV1__=function(type,valeur){
        const r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
        if(!r||!r.setReglage)return;
        const v=Math.max(0,Math.min(100,idleEntier_(valeur)))/100;
        r.setReglage(type,v);
        const label=document.getElementById('sorealIdleVolumeValeurV1_'+type);
        if(label)label.textContent=Math.round(v*100)+'%';
      };
      /* Case à cocher d'une des trois options (voix, ambiance, sons de l'interface) : décochée = coupée complètement (Norman, 2026-10-02). */
      window.__basculerSonIdleV1__=function(type,coche){
        const r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
        if(!r||!r.setActif)return;
        r.setActif(type,!!coche);
        const curseur=document.getElementById('sorealIdleVolumeCurseurV1_'+type);
        if(curseur)curseur.disabled=!coche;
        const ligne=document.getElementById('sorealIdleVolumeLigneV1_'+type);
        if(ligne)ligne.style.opacity=coche?'1':'.5';
      };
      /*
       * Langue des items et des textes (Norman, 2026-10-03) : Français (traduit) ou English (les originaux de ce qui a été traduit). Mémorisée sur cet appareil ; le serveur traduit ses réponses
       * d'après le champ « langue » que le pont envoie (standalone-bridge.js).
       */
      function langueIdleV1_(){
        try{return localStorage.getItem('soreal_idle_langue_v1')==='en'?'en':'fr';}catch(_e){return 'fr';}
      }
      window.__changerLangueIdleV1__=function(langue){
        const choix=langue==='en'?'en':'fr';
        if(choix===langueIdleV1_())return;
        try{localStorage.setItem('soreal_idle_langue_v1',choix);}catch(_e){}
        /* Interface en anglais : le module traduction-anglais-v1.js traduit (ou restitue) le texte affiché tout de suite. */
        if(typeof window.__SOREAL_IDLE_LANGUE_CHANGEE_V1__==='function')window.__SOREAL_IDLE_LANGUE_CHANGEE_V1__(choix);
        /* Resynchronisation complète : le serveur renvoie aussitôt les textes dans la nouvelle langue, puis la page se redessine. */
        synchroniserJeuIdleV7_(true);
        setTimeout(function(){
          if(idleEtat&&document.querySelector('.soreal-idle-page-root-v28'))rafraichirMenuRacineIdleV28_();
        },800);
        setTimeout(function(){
          if(idleEtat&&document.querySelector('.soreal-idle-page-root-v28'))rafraichirMenuRacineIdleV28_();
        },2500);
      };
      /*
       * Sons de défaite (Norman, 2026-10-15). Aucun réglage pour les joueurs : le jeu tire au hasard parmi les sons RETENUS par Norman (modules/audio-effects-v199.js, SONS_DEFAITE). Cette section n'existe qu'en mode
       * développement : elle fait seulement ÉCOUTER (▶) les sons de défaite du jeu.
       */
      window.__ecouterSonDefaiteIdleV1__=function(nom){
        const A=window.__SOREAL_IDLE_AUDIO_V199__;
        if(!A||!A.previewDefeat)return;
        try{if(A.unlock)A.unlock();}catch(_e){}
        A.previewDefeat(nom);
      };
      /* Bruits de diarrhée à choisir (Norman, 2026-10-15) : section de développement, ▶ pour écouter. */
      window.__ecouterDiarrheeIdleV1__=function(id){
        const A=window.__SOREAL_IDLE_AUDIO_V199__;
        if(A&&typeof A.previewDiarrhee==='function')A.previewDiarrhee(String(id||''));
      };
      /* Musique de combat de Titan (Norman, 2026-10-15) : aperçu dans la section de développement des Réglages. */
      window.__apercuMusiqueTitanIdleV1__=function(marche){
        const M=window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__;
        if(!M)return;
        if(marche)M.lancerApercu();else M.arreterApercu();
      };
      /* Orage des sorts de Blood Magic (Norman, 2026-10-15) : aperçu de chacun, dans la section de développement des Réglages. */
      window.__apercuOrageSortIdleV1__=function(id){
        const O=window.__SOREAL_IDLE_ORAGE_V1__;
        if(O&&typeof O.sort==='function')O.sort(String(id||''));
      };
      /* Effets visuels (Norman, 2026-10-08) : orage (éclairs) et cheminée (lueur) peuvent être coupés pour les téléphones moins puissants ; actifs par défaut, mémorisés sur l'appareil. */
      const EFFETS_VISUELS_IDLE_V1=[
        {id:'orage',cle:'soreal_idle_effet_orage_v1',libelle:'⛈️ Orage : ciel sombre et éclairs (piste d’orage)'},
        {id:'feu',cle:'soreal_idle_effet_feu_v1',defaut:false,libelle:'🔥 Cheminée : lueur sur les bords de l’écran (piste de feu) — peut ralentir un téléphone'}
      ];
      window.__basculerEffetIdleV1__=function(id,coche){
        const e=EFFETS_VISUELS_IDLE_V1.find(function(x){return x.id===id;});
        if(!e)return;
        try{localStorage.setItem(e.cle,coche?'1':'0');}catch(_e){}
        try{window.dispatchEvent(new Event('soreal-effets-v1'));}catch(_e){}
      };

      function idleInfoOuvertV1_(){
        try{
          return localStorage.getItem('soreal_idle_info_ouvert_v1')==='1';
        }catch(e){
          return false;
        }
      }

      function toggleInfoOuvertIdleV1_(){
        try{
          localStorage.setItem('soreal_idle_info_ouvert_v1',idleInfoOuvertV1_()?'0':'1');
        }catch(e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)rafraichirMenuRacineIdleV28_();
      }
      window.__toggleInfoOuvertIdleV1__=toggleInfoOuvertIdleV1_;


      function enregistrerPseudoIdleV1_(){
        const champ=document.getElementById('sorealIdlePseudoChampV1');
        if(!champ||!SOREAL_SESSION)return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              if(idleEtat)idleEtat.identite=Object.assign({},idleEtat.identite||{},res);
              toastIdleV5_('✅ Pseudo enregistré : '+(res.nomAffiche||res.pseudo||''));
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&idleEtat&&idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }else{
              toastIdleV5_((res&&res.message)||'Ce pseudo ne peut pas être utilisé.');
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible d’enregistrer le pseudo.');
          })
          .definirPseudoSorealIdle(SOREAL_SESSION,champ.value);
      }
      window.__enregistrerPseudoIdleV1__=enregistrerPseudoIdleV1_;

      function deconnexionGoogleIdleV1_(){
        const pont=window.__SOREAL_IDLE_STANDALONE_V1__;
        if(pont&&typeof pont.logout==='function')pont.logout();
      }
      window.__deconnexionGoogleIdleV1__=deconnexionGoogleIdleV1_;

      /* Accès public (administrateur) : les personnes connectées par Google peuvent jouer ; la liste montre leur adresse et leur nom Google. */
      function basculerAccesPublicIdleV1_(){
        if(!idleEtat||!idleEtat.reglages||!SOREAL_SESSION)return;
        const voulu=!idleEtat.reglages.accesPublic;
        if(voulu&&!window.confirm('Ouvrir SOREAL IDLE à toute personne qui se connecte avec un compte Google, sans passer par APP / TV ?'))return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              idleEtat.reglages.accesPublic=Boolean(res.accesPublic);
              toastIdleV5_(res.accesPublic?'🌍 Accès public ouvert (connexion Google).':'🔒 Accès public fermé.');
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }else{
              toastIdleV5_((res&&res.message)||'Impossible de changer l’accès public.');
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible de changer l’accès public.');
          })
          .definirAccesPublicSorealIdle(SOREAL_SESSION,voulu);
      }
      window.__basculerAccesPublicIdleV1__=basculerAccesPublicIdleV1_;

      function chargerJoueursGoogleIdleV1_(){
        const zone=document.getElementById('sorealIdleJoueursGoogleV1');
        if(!zone||!SOREAL_SESSION)return;
        zone.textContent='Chargement…';
        google.script.run
          .withSuccessHandler(function(res){
            const liste=res&&res.ok&&Array.isArray(res.joueurs)?res.joueurs:[];
            zone.innerHTML=liste.length
              ?liste.map(function(x){
                return '<div style="padding:6px 0;border-top:1px solid rgba(129,176,255,.15);font-size:14px;color:#dce5f3">'+
                  '<b>'+idleHtml_(x.pseudo||'(pas encore de pseudo)')+'</b> · '+idleHtml_(x.nomGoogle||'')+
                  '<div style="color:#7f8aa4;font-size:13px">'+idleHtml_(x.email)+'</div></div>';
              }).join('')
              :'<div style="font-size:14px;color:#7f8aa4">Aucun joueur connecté par Google pour l’instant.</div>';
          })
          .withFailureHandler(function(e){
            zone.textContent=(e&&e.message)||'Impossible de charger la liste.';
          })
          .listerJoueursExternesSorealIdle(SOREAL_SESSION);
      }
      window.__chargerJoueursGoogleIdleV1__=chargerJoueursGoogleIdleV1_;

      window.__basculerClassementVisibleIdleV1__=basculerClassementVisibleIdleV1_;


      /* Interrupteur d'accès à SOREAL IDLE (administrateur seulement) : ouvre / ferme l'accès de tous les comptes connectés. */
      function basculerAccesOuvertIdleV1_(){
        if(!idleEtat||!idleEtat.reglages||!SOREAL_SESSION)return;
        const voulu=!idleEtat.reglages.accesOuvert;
        if(voulu&&!window.confirm('Ouvrir SOREAL IDLE à toutes les personnes qui ont le trophée Assiduité de bronze (même celles qui ne travaillent plus ici) ?'))return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              idleEtat.reglages.accesOuvert=Boolean(res.accesOuvert);
              toastIdleV5_(res.accesOuvert?'🔓 Accès ouvert aux détenteurs du trophée Assiduité de bronze.':'🔒 Accès fermé : SOREAL IDLE est caché à tout le monde.');
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }else{
              toastIdleV5_((res&&res.message)||'Impossible de changer l’accès.');
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible de changer l’accès.');
          })
          .definirAccesOuvertSorealIdle(SOREAL_SESSION,voulu);
      }
      window.__basculerAccesOuvertIdleV1__=basculerAccesOuvertIdleV1_;



      window.__jouerSonMenuIdleV1__=jouerSonMenuIdleV1_;



      /*
       * Panneaux d'informations repliables des menus (« 💡 À quoi ça sert ? », « Que faire ici ? », résumé des NGU, encart Infos des Réglages) : toujours FERMÉS à l'arrivée dans un menu et refermés quand on change de menu
       * (Norman, 2026-10-15). Un panneau ouvert le reste seulement tant qu'on reste dans le menu (la synchro redessine la page) ; on ne retient plus rien d'une visite à l'autre.
       */
      function fermerPanneauxInfoIdleV1_(){
        try{
          const cles=[];
          for(let i=0;i<localStorage.length;i+=1){const k=localStorage.key(i);if(k&&k.indexOf('soreal_idle_aide_v1_')===0)cles.push(k);}
          cles.forEach(function(k){localStorage.removeItem(k);});
          localStorage.setItem('soreal_idle_info_ouvert_v1','0');
        }catch(_e){}
        try{const L=window.__SOREAL_IDLE_NGU_LABO_V1__;if(L&&typeof L.resume==='function')L.resume(false);}catch(_e){}
        try{const Y=window.__SOREAL_IDLE_YGG_V1__;if(Y&&typeof Y.fermerAide==='function')Y.fermerAide();}catch(_e){}
      }
      fermerPanneauxInfoIdleV1_();


      /*
       * Ce que fait le joueur, pour le chat SOREAL IDLE (modules/chat-v1.js) : zone d'Aventure farmée en combat automatique, boss combattu,
       * et ce que CE joueur a déjà découvert (zones connues, boss le plus haut) -- le chat n'affiche le nom d'une zone ou le numéro d'un
       * boss d'un AUTRE joueur que si le lecteur les connaît (anti-spoil, AGENTS.md règle n°2).
       */
      window.__SOREAL_IDLE_ACTIVITE_V1__=function(){
        const j=idleEtat;
        if(!j)return null;
        const a=aventureMetaIdleV47_(j);
        const zones=(a&&Array.isArray(a.zones)?a.zones:[])
          .filter(function(z){return z&&idleEntier_(z.id)>0;})
          .map(function(z){return {id:idleEntier_(z.id),nom:String(z.name||'')};});
        let farm=null;
        if(idleAutoAventureV30){
          const z=zones.find(function(x){return x.id===idleEntier_(idleAutoZoneV30);});
          if(z)farm={zoneId:z.id,zoneNom:z.nom};
        }
        const records=j.systemes&&j.systemes.records;
        /* Fil d'actualité (modules/flux-v1.js) : ce que CE joueur connaît déjà, pour ne jamais révéler à travers l'activité d'un autre. */
        const connus={boss:{},titan:{},succes:{},menus:{},sets:{},pieces:{}};
        /* Cube de l'infini et pièces déjà obtenues (collection) : seuls ceux-là peuvent être nommés dans le fil « En direct ». */
        connus.menus.cube=Boolean(a&&a.cube&&a.cube.unlocked);
        if(a&&a.itemList&&a.itemCatalog){
          Object.keys(a.itemList).forEach(function(id){
            const def=a.itemCatalog[id];
            if(def&&def.name&&(def.kind==='equipment'||def.kind==='special'))connus.pieces[id]=String(def.name);
          });
        }
        /* Noms des articles de boutique dans la langue du lecteur (catalogue EXP : table française du module ; Boutique AP : son catalogue) ; l'événement porte sinon le nom d'origine. */
        const achatsNoms={exp:Object.assign({},window.__SOREAL_IDLE_EXP_NOMS_V1__||{}),sellout:{}};
        ((j.systemes&&j.systemes.selloutShop&&j.systemes.selloutShop.catalog)||[]).forEach(function(it){if(it&&it.id&&it.name)achatsNoms.sellout[it.id]=String(it.name);});
        /* Sets d'équipement que CE joueur a complétés : seuls leurs noms peuvent être cités dans le fil « En direct ». */
        if(a&&a.completedSets&&a.setCatalog){
          Object.keys(a.completedSets).forEach(function(id){
            if(a.completedSets[id]&&a.setCatalog[id]&&a.setCatalog[id].name)connus.sets[id]=String(a.setCatalog[id].name);
          });
        }
        ((j.bestiaire&&Array.isArray(j.bestiaire.entrees))?j.bestiaire.entrees:[]).forEach(function(e){
          if(e&&e.source==='boss'&&e.decouvert&&e.nom)connus.boss[idleEntier_(e.numero)]=String(e.nom);
        });
        ((a&&Array.isArray(a.titans))?a.titans:[]).forEach(function(t){
          if(t&&t.progressionUnlocked!==false&&t.id)connus.titan[String(t.id)]=String(t.name||'');
        });
        const succesListe=j.systemes&&j.systemes.achievements&&Array.isArray(j.systemes.achievements.list)?j.systemes.achievements.list:[];
        succesListe.forEach(function(x){if(x&&x.unlocked&&x.id)connus.succes[String(x.id)]=String(x.name||'');});
        ['renaissance','challenges','titans','succes','spendExp','sellout','shop','moneyPit','sang','aventure','wandoos','yggdrasil','entrainement','combat','augmentations','avance','machine','tower','daycare','ngu','diggers','beards','macguffins','hacks','questing','quirks','wishes','cards','cooking','chroniques','parametres'].forEach(function(m){
          try{connus.menus[m]=Boolean(menuDisponibleIdleV28_(m,j));}catch(e){connus.menus[m]=false;}
        });
        /* Les titans et les succès n'ont plus de bouton de menu propre : « connus » veut dire débloqués. */
        connus.menus.titans=Boolean(a&&Array.isArray(a.titans)&&a.titans.some(function(t){return t&&t.id&&t.progressionUnlocked!==false;}));
        connus.menus.succes=chroniquesOngletsIdleV1_(j).some(function(o){return o.id==='succes';});
        try{connus.sorts=typeof window.__SOREAL_IDLE_SORTS_CONNUS_V1__==='function'?window.__SOREAL_IDLE_SORTS_CONNUS_V1__(j):{};}catch(e){connus.sorts={};}
        return {farm:farm,boss:j.combatBossActif?idleEntier_(j.bossSelection):0,menu:String(idleMenuActifV28||''),zones:zones,bossMax:idleEntier_(records&&records.highestBoss),connus:connus,achatsNoms:achatsNoms};
      };

      window.__menuIdleV28__=
        menuIdleV28_;



      /* Aucune image ne vient plus de Google (Norman, 2026-10-14) : tout est lu dans le stockage R2 du jeu. */









      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-322 */





      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-323 */
      function urlJoueurR2IdleV1_(zone,portrait,repli){
        /* Player Portraits (2026-09-24) : portrait choisi (fichier du wiki), repli serveur sur le défaut. Portrait automatique d'un set équipé : repli = portrait choisi. */
        return '/api/idle/media/player?zone='+encodeURIComponent(String(zone||''))+
          (portrait?'&portrait='+encodeURIComponent(String(portrait)):'')+
          (repli?'&fallback='+encodeURIComponent(String(repli)):'');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-324 */
      function urlMobR2IdleV1_(zone,boss,index,nom){
        const z=String(zone||'').trim();
        if(!z)return '';
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-325 */
        return '/api/idle/media/mob?zone='+encodeURIComponent(z)+
          '&boss='+(boss?'1':'0')+
          '&seed='+encodeURIComponent(String(index||'0'))+
          (nom?'&name='+encodeURIComponent(String(nom)):'');
      }









      window.__fermerResumeHorsLigneIdleV64__=fermerResumeHorsLigneIdleV64_;




      /* Essai du popup « Pendant ton absence » avec un état fourni (tests, serveur de développement). */

      /* Défilement du menu du haut en cours (doigt posé, ou élan dans la seconde qui suit le dernier mouvement). */
      let idleNavDefilementMsV1=0;
      let idleNavDoigtV1=false;
      if(typeof document.addEventListener==='function'){
        document.addEventListener('scroll',function(e){
          const t=e.target;
          if(t&&t.classList&&t.classList.contains('soreal-idle-nav-v28'))idleNavDefilementMsV1=Date.now();
        },true);
        document.addEventListener('touchstart',function(e){
          if(e.target&&e.target.closest&&e.target.closest('.soreal-idle-nav-v28')){idleNavDoigtV1=true;idleNavDefilementMsV1=Date.now();}
        },{passive:true,capture:true});
        ['touchend','touchcancel'].forEach(function(type){
          document.addEventListener(type,function(){if(idleNavDoigtV1){idleNavDoigtV1=false;idleNavDefilementMsV1=Date.now();}},{passive:true,capture:true});
        });
      }





      function annulerOuvertureIdleV104_(){
        window.__idleOuvertureEnCoursV104__=0;
      }






      window.__ouvrirSorealIdleAvecEtatV108__=
        ouvrirSorealIdleAvecEtatV108_;



      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-344 */
      window.__ouvrirSorealIdleModuleV26__=
        function(){
          idleAutorise=true;

          afficherBoutonIdle_(
            true
          );

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-345 */
          chargerSorealIdleNatifV4_();
        };


      window.__ouvrirSorealIdleModuleV1__=
        window.__ouvrirSorealIdleModuleV26__;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-346 */
      const ouvrirPageSorealOriginalV4=
        typeof window.ouvrirPage==='function'
          ?window.ouvrirPage
          :null;

      if(ouvrirPageSorealOriginalV4){
        window.ouvrirPage=function(p,b,restauration){
          if(p==='idle'){
            if(b){
              b.classList.remove(
                'active',
                'selected',
                'open'
              );
            }

            try{
              localStorage.setItem(
                typeof CLE_PAGE_SOREAL!=='undefined'
                  ?CLE_PAGE_SOREAL
                  :'soreal_page',
                'today'
              );
            }catch(e){}

            chargerSorealIdleNatifV4_();

            if(!restauration){
              try{
                if(
                  typeof pousserEtatNavigationSorealV14_1===
                  'function'
                ){
                  pousserEtatNavigationSorealV14_1();
                }
              }catch(e){}
            }

            return;
          }

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-347 */
          annulerOuvertureIdleV104_();

          window.__idleNumeroChargementV34__=
            (
              window.__idleNumeroChargementV34__ ||
              0
            ) + 1;

          document.body.classList.remove(
            'soreal-idle-active-v47'
          );

          return ouvrirPageSorealOriginalV4.apply(
            this,
            arguments
          );
        };
      }



      window.__equiperObjetIdleV10__=
        equiperObjetIdleV10_;

      window.__acheterAmeliorationIdleV12__=
        acheterAmeliorationIdleV12_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-348 */
    })();
