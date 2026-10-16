/*
 * SOREAL IDLE — Amorçage : instructions exécutées au chargement du jeu (écouteurs, minuteries, ponts window) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_amorcage_v1)return;
  REG.__chargé_ui_amorcage_v1=true;

  function estAdminSorealIdle_(){return REG.estAdminSorealIdle_.apply(null,arguments);}
  function changerPartieDevIdleV1_(){return REG.changerPartieDevIdleV1_.apply(null,arguments);}
  function copierPartieADevIdleV1_(){return REG.copierPartieADevIdleV1_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function energieDisponibleIdleV9_(){return REG.energieDisponibleIdleV9_.apply(null,arguments);}
  function magieEncoreAGenererIdleV1_(){return REG.magieEncoreAGenererIdleV1_.apply(null,arguments);}
  function infoBandeauIdleV2_(){return REG.infoBandeauIdleV2_.apply(null,arguments);}
  function energieGenereeTotaleIdleV1_(){return REG.energieGenereeTotaleIdleV1_.apply(null,arguments);}
  function donneesMagieGenereeIdleV1_(){return REG.donneesMagieGenereeIdleV1_.apply(null,arguments);}
  function formaterPvFixeIdleV1_(){return REG.formaterPvFixeIdleV1_.apply(null,arguments);}
  function regenPvFightBossNguParSecondeV164_(){return REG.regenPvFightBossNguParSecondeV164_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function regenReposAdventureIdleV3_(){return REG.regenReposAdventureIdleV3_.apply(null,arguments);}
  function energieLibreCoherenteIdleV1_(){return REG.energieLibreCoherenteIdleV1_.apply(null,arguments);}
  function ajusterBasicTrainingIdleV120_(){return REG.ajusterBasicTrainingIdleV120_.apply(null,arguments);}
  function presetBasicTrainingIdleV120_(){return REG.presetBasicTrainingIdleV120_.apply(null,arguments);}
  function viderBasicTrainingIdleV120_(){return REG.viderBasicTrainingIdleV120_.apply(null,arguments);}
  function idleResoudreFractionInputV1_(){return REG.idleResoudreFractionInputV1_.apply(null,arguments);}
  function champQuantiteIdleV1_(){return REG.champQuantiteIdleV1_.apply(null,arguments);}
  function toutSelectionnerIdleV1_(){return REG.toutSelectionnerIdleV1_.apply(null,arguments);}
  function ajusterVieDuelIdleV1_(){return REG.ajusterVieDuelIdleV1_.apply(null,arguments);}
  function arreterPinClicIdleV1_(){return REG.arreterPinClicIdleV1_.apply(null,arguments);}
  function demarrerPinClicIdleV1_(){return REG.demarrerPinClicIdleV1_.apply(null,arguments);}
  function surveillerEvenementsAventureIdleV1_(){return REG.surveillerEvenementsAventureIdleV1_.apply(null,arguments);}
  function installerInfobulleEnergieIdleV1_(){return REG.installerInfobulleEnergieIdleV1_.apply(null,arguments);}
  function installerRaccourcisReprendreIdleV1_(){return REG.installerRaccourcisReprendreIdleV1_.apply(null,arguments);}
  function forgerEquipementIdleV25_(){return REG.forgerEquipementIdleV25_.apply(null,arguments);}
  function acheterAmeliorationIdleV12_(){return REG.acheterAmeliorationIdleV12_.apply(null,arguments);}
  function recyclerObjetsOptimisteIdleV32_(){return REG.recyclerObjetsOptimisteIdleV32_.apply(null,arguments);}
  function chargerCombatAutoIdleV30_(){return REG.chargerCombatAutoIdleV30_.apply(null,arguments);}
  function fermerPopupRenaissanceIdleV63_(){return REG.fermerPopupRenaissanceIdleV63_.apply(null,arguments);}
  function executerRenaissanceIdleV63_(){return REG.executerRenaissanceIdleV63_.apply(null,arguments);}
  function renaitreIdleV14_(){return REG.renaitreIdleV14_.apply(null,arguments);}
  function idleClicsEnvoyerV1_(){return REG.idleClicsEnvoyerV1_.apply(null,arguments);}
  function idleClicMarquerV1_(){return REG.idleClicMarquerV1_.apply(null,arguments);}
  function idleVuMarquerV1_(){return REG.idleVuMarquerV1_.apply(null,arguments);}
  function idleVuConnuV1_(){return REG.idleVuConnuV1_.apply(null,arguments);}
  function allerDepuisPopupNouveauteIdleV106_(){return REG.allerDepuisPopupNouveauteIdleV106_.apply(null,arguments);}
  function appliquerTextesTutorielsIdleV1_(){return REG.appliquerTextesTutorielsIdleV1_.apply(null,arguments);}
  function texteVoixTutorielIdleV1_(){return REG.texteVoixTutorielIdleV1_.apply(null,arguments);}
  function definitionsNouveautesIdleV75_(){return REG.definitionsNouveautesIdleV75_.apply(null,arguments);}
  function texteVoixNouveauteIdleV1_(){return REG.texteVoixNouveauteIdleV1_.apply(null,arguments);}
  function infoMoneyPitIdleV1_(){return REG.infoMoneyPitIdleV1_.apply(null,arguments);}
  function infoSystemeGeneriqueIdleV1_(){return REG.infoSystemeGeneriqueIdleV1_.apply(null,arguments);}
  function rendreTutorielPagesIdleV1_(){return REG.rendreTutorielPagesIdleV1_.apply(null,arguments);}
  function declarerVoixSansTexteIdleV1_(){return REG.declarerVoixSansTexteIdleV1_.apply(null,arguments);}
  function tutorielPagesNaviguerV1_(){return REG.tutorielPagesNaviguerV1_.apply(null,arguments);}
  function tutorielPagesFermerV1_(){return REG.tutorielPagesFermerV1_.apply(null,arguments);}
  function annoncerNouveauxMenusIdleV1_(){return REG.annoncerNouveauxMenusIdleV1_.apply(null,arguments);}
  function fermerPopupNouveauteIdleV75_(){return REG.fermerPopupNouveauteIdleV75_.apply(null,arguments);}
  function menuStyleIdleV1_(){return REG.menuStyleIdleV1_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function actualiserNavAlimenteIdleV1_(){return REG.actualiserNavAlimenteIdleV1_.apply(null,arguments);}
  function validerRangementMenuIdleV1_(){return REG.validerRangementMenuIdleV1_.apply(null,arguments);}
  function installerRangementMenuIdleV1_(){return REG.installerRangementMenuIdleV1_.apply(null,arguments);}
  function dessinerJournalAventureIdleV1_(){return REG.dessinerJournalAventureIdleV1_.apply(null,arguments);}
  function ajouterLogAventureIdleV1_(){return REG.ajouterLogAventureIdleV1_.apply(null,arguments);}
  function acheterSortIdleV90_(){return REG.acheterSortIdleV90_.apply(null,arguments);}
  function lancerSortIdleV90_(){return REG.lancerSortIdleV90_.apply(null,arguments);}
  function fermerCarteBossIdleV91_(){return REG.fermerCarteBossIdleV91_.apply(null,arguments);}
  function combattreDepuisCarteBossIdleV91_(){return REG.combattreDepuisCarteBossIdleV91_.apply(null,arguments);}
  function definirCombatBossIdleV39_(){return REG.definirCombatBossIdleV39_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function nukerBossIdleV1_(){return REG.nukerBossIdleV1_.apply(null,arguments);}
  function autoNukeDueIdleV1_(){return REG.autoNukeDueIdleV1_.apply(null,arguments);}
  function changerOngletCollectionIdleV1_(){return REG.changerOngletCollectionIdleV1_.apply(null,arguments);}
  function changerPageCollectionEquipementV1_(){return REG.changerPageCollectionEquipementV1_.apply(null,arguments);}
  function afficherDetailsCollectionIdleV1_(){return REG.afficherDetailsCollectionIdleV1_.apply(null,arguments);}
  function ouvrirBossCollectionIdleV1_(){return REG.ouvrirBossCollectionIdleV1_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function fermerBossCollectionIdleV1_(){return REG.fermerBossCollectionIdleV1_.apply(null,arguments);}
  function lireHistoireCompleteBossIdleV206_(){return REG.lireHistoireCompleteBossIdleV206_.apply(null,arguments);}
  function zoneAdventurePrecedenteV1_(){return REG.zoneAdventurePrecedenteV1_.apply(null,arguments);}
  function zoneAdventureSuivanteV1_(){return REG.zoneAdventureSuivanteV1_.apply(null,arguments);}
  function basculerIdleModeAdventureIdleV3_(){return REG.basculerIdleModeAdventureIdleV3_.apply(null,arguments);}
  function utiliserCompetenceAdventureIdleV3_(){return REG.utiliserCompetenceAdventureIdleV3_.apply(null,arguments);}
  function rendreCommandesAdventureIdleV3_(){return REG.rendreCommandesAdventureIdleV3_.apply(null,arguments);}
  function titanJoueurParalyseIdleV1_(){return REG.titanJoueurParalyseIdleV1_.apply(null,arguments);}
  function arreterCombatTitanIdleV1_(){return REG.arreterCombatTitanIdleV1_.apply(null,arguments);}
  function competenceAdventureDisponibleIdleV4_(){return REG.competenceAdventureDisponibleIdleV4_.apply(null,arguments);}
  function trouverWalderpIdleV147_(){return REG.trouverWalderpIdleV147_.apply(null,arguments);}
  function utiliserObjetDeblocageIdleV1_(){return REG.utiliserObjetDeblocageIdleV1_.apply(null,arguments);}
  function consommerDeblocageAdventureIdleV47_(){return REG.consommerDeblocageAdventureIdleV47_.apply(null,arguments);}
  function consommerObjetSkillAdventureIdleV4_(){return REG.consommerObjetSkillAdventureIdleV4_.apply(null,arguments);}
  function transformerObjetAdventureIdleV4_(){return REG.transformerObjetAdventureIdleV4_.apply(null,arguments);}
  function desequiperObjetAdventureIdleV47_(){return REG.desequiperObjetAdventureIdleV47_.apply(null,arguments);}
  function toggleMenuZoneAdventureIdleV1_(){return REG.toggleMenuZoneAdventureIdleV1_.apply(null,arguments);}
  function selectionnerZoneAdventureIdleV47_(){return REG.selectionnerZoneAdventureIdleV47_.apply(null,arguments);}
  function equiperParIdAdventureIdleV138_(){return REG.equiperParIdAdventureIdleV138_.apply(null,arguments);}
  function actionMetaV47_(){return REG.actionMetaV47_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function setDiggerIdleV47_(){return REG.setDiggerIdleV47_.apply(null,arguments);}
  function toggleDiggerIdleV47_(){return REG.toggleDiggerIdleV47_.apply(null,arguments);}
  function changerPageSacV1_(){return REG.changerPageSacV1_.apply(null,arguments);}
  function deposerSurEmplacementVideSacAdventureIdleV1_(){return REG.deposerSurEmplacementVideSacAdventureIdleV1_.apply(null,arguments);}
  function installerGestesInventaireAdventureIdleV196_(){return REG.installerGestesInventaireAdventureIdleV196_.apply(null,arguments);}
  function annulerOuvertureSurvolIdleV1_(){return REG.annulerOuvertureSurvolIdleV1_.apply(null,arguments);}
  function fermerSurvolIdleV1_(){return REG.fermerSurvolIdleV1_.apply(null,arguments);}
  function survolPossibleIdleV1_(){return REG.survolPossibleIdleV1_.apply(null,arguments);}
  function elementObjetGesteAdventureIdleV196_(){return REG.elementObjetGesteAdventureIdleV196_.apply(null,arguments);}
  function deposerSurCubeAdventureIdleV138_(){return REG.deposerSurCubeAdventureIdleV138_.apply(null,arguments);}
  function clicCubeAdventureIdleV138_(){return REG.clicCubeAdventureIdleV138_.apply(null,arguments);}
  function deposerSurTrashAdventureIdleV138_(){return REG.deposerSurTrashAdventureIdleV138_.apply(null,arguments);}
  function supprimerObjetAdventureIdleV165_(){return REG.supprimerObjetAdventureIdleV165_.apply(null,arguments);}
  function basculerVerrouObjetAdventureIdleV165_(){return REG.basculerVerrouObjetAdventureIdleV165_.apply(null,arguments);}
  function afficherPopupObjetUnifieIdleV1_(){return REG.afficherPopupObjetUnifieIdleV1_.apply(null,arguments);}
  function cibleDansPopupDetailsObjetAdventureIdleV207_(){return REG.cibleDansPopupDetailsObjetAdventureIdleV207_.apply(null,arguments);}
  function popupDetailsObjetAdventureIdleOuvertV207_(){return REG.popupDetailsObjetAdventureIdleOuvertV207_.apply(null,arguments);}
  function survolOccupeIdleV1_(){return REG.survolOccupeIdleV1_.apply(null,arguments);}
  function fermerDetailsObjetAdventureIdleV1_(){return REG.fermerDetailsObjetAdventureIdleV1_.apply(null,arguments);}
  function restaurerFichesApresRedessinIdleV1_(){return REG.restaurerFichesApresRedessinIdleV1_.apply(null,arguments);}
  function comparerObjetAdventureIdleV183_(){return REG.comparerObjetAdventureIdleV183_.apply(null,arguments);}
  function fermerComparaisonObjetAdventureIdleV183_(){return REG.fermerComparaisonObjetAdventureIdleV183_.apply(null,arguments);}
  function clicTrashAdventureIdleV138_(){return REG.clicTrashAdventureIdleV138_.apply(null,arguments);}
  function survolCibleAdventureIdleV138_(){return REG.survolCibleAdventureIdleV138_.apply(null,arguments);}
  function quitterCibleAdventureIdleV138_(){return REG.quitterCibleAdventureIdleV138_.apply(null,arguments);}
  function changerPageCoffreV1_(){return REG.changerPageCoffreV1_.apply(null,arguments);}
  function grilleCoffreAdventureIdleV1_(){return REG.grilleCoffreAdventureIdleV1_.apply(null,arguments);}
  function toggleCoffreOuvertAdventureIdleV1_(){return REG.toggleCoffreOuvertAdventureIdleV1_.apply(null,arguments);}
  function deposerSurCoffreAdventureIdleV1_(){return REG.deposerSurCoffreAdventureIdleV1_.apply(null,arguments);}
  function clicCoffreAdventureIdleV1_(){return REG.clicCoffreAdventureIdleV1_.apply(null,arguments);}
  function retirerDuCoffreAdventureIdleV1_(){return REG.retirerDuCoffreAdventureIdleV1_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function formatterHeuresIdleV47_(){return REG.formatterHeuresIdleV47_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function appliquerSynchroCombatSansReflowIdleV116_(){return REG.appliquerSynchroCombatSansReflowIdleV116_.apply(null,arguments);}
  function protegerJoueurServeurInventaireIdleV208_(){return REG.protegerJoueurServeurInventaireIdleV208_.apply(null,arguments);}
  function estMutationInventaireAdventureIdleV160_(){return REG.estMutationInventaireAdventureIdleV160_.apply(null,arguments);}
  function patchInventaireAdventureIdleV160_(){return REG.patchInventaireAdventureIdleV160_.apply(null,arguments);}
  function appelerProgressionIdleCloudflareV1_(){return REG.appelerProgressionIdleCloudflareV1_.apply(null,arguments);}
  function patchZoneAdventureSansReflowIdleV1_(){return REG.patchZoneAdventureSansReflowIdleV1_.apply(null,arguments);}
  function idleRareteClasseObjetAdventureIdleV1_(){return REG.idleRareteClasseObjetAdventureIdleV1_.apply(null,arguments);}
  function rafraichirEnergieEtBoutonsIdleV9_(){return REG.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
  function patcherBarresTimeMachineIdleV1_(){return REG.patcherBarresTimeMachineIdleV1_.apply(null,arguments);}
  function changerOngletShopIdleV1_(){return REG.changerOngletShopIdleV1_.apply(null,arguments);}
  function changerOngletClassementIdleV1_(){return REG.changerOngletClassementIdleV1_.apply(null,arguments);}
  function chargerClassementIdleV1_(){return REG.chargerClassementIdleV1_.apply(null,arguments);}
  function ouvrirPopupResetTotalIdleV67_(){return REG.ouvrirPopupResetTotalIdleV67_.apply(null,arguments);}
  function fermerPopupResetTotalIdleV67_(){return REG.fermerPopupResetTotalIdleV67_.apply(null,arguments);}
  function executerResetTotalIdleV67_(){return REG.executerResetTotalIdleV67_.apply(null,arguments);}
  function basculerNotesMajIdleV1_(){return REG.basculerNotesMajIdleV1_.apply(null,arguments);}
  function notesMajIdleV1_(){return REG.notesMajIdleV1_.apply(null,arguments);}
  function langueIdleV1_(){return REG.langueIdleV1_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function toggleInfoOuvertIdleV1_(){return REG.toggleInfoOuvertIdleV1_.apply(null,arguments);}
  function enregistrerPseudoIdleV1_(){return REG.enregistrerPseudoIdleV1_.apply(null,arguments);}
  function deconnexionGoogleIdleV1_(){return REG.deconnexionGoogleIdleV1_.apply(null,arguments);}
  function basculerAccesPublicIdleV1_(){return REG.basculerAccesPublicIdleV1_.apply(null,arguments);}
  function chargerJoueursGoogleIdleV1_(){return REG.chargerJoueursGoogleIdleV1_.apply(null,arguments);}
  function basculerClassementVisibleIdleV1_(){return REG.basculerClassementVisibleIdleV1_.apply(null,arguments);}
  function basculerAccesOuvertIdleV1_(){return REG.basculerAccesOuvertIdleV1_.apply(null,arguments);}
  function jouerSonMenuIdleV1_(){return REG.jouerSonMenuIdleV1_.apply(null,arguments);}
  function fermerPanneauxInfoIdleV1_(){return REG.fermerPanneauxInfoIdleV1_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function chroniquesOngletsIdleV1_(){return REG.chroniquesOngletsIdleV1_.apply(null,arguments);}
  function menuIdleV28_(){return REG.menuIdleV28_.apply(null,arguments);}
  function fermerResumeHorsLigneIdleV64_(){return REG.fermerResumeHorsLigneIdleV64_.apply(null,arguments);}
  function ouvrirSorealIdleAvecEtatV108_(){return REG.ouvrirSorealIdleAvecEtatV108_.apply(null,arguments);}
  function afficherBoutonIdle_(){return REG.afficherBoutonIdle_.apply(null,arguments);}
  function chargerSorealIdleNatifV4_(){return REG.chargerSorealIdleNatifV4_.apply(null,arguments);}
  function annulerOuvertureIdleV104_(){return REG.annulerOuvertureIdleV104_.apply(null,arguments);}
  function equiperObjetIdleV10_(){return REG.equiperObjetIdleV10_.apply(null,arguments);}

      /* @amorce S:window.__SOREAL_IDLE_UI_PARTAGE_V1__=UI_PARTAGE_V1; Object.assign(UI_PARTA */
function __amorcer_2(){
window.__SOREAL_IDLE_UI_PARTAGE_V1__=REG.UI_PARTAGE_V1;
}

      /* @amorce S:Object.assign(UI_PARTAGE_V1,{ }); /*REG_END*​/ /* Historique */
function __amorcer_3(){
Object.assign(REG.UI_PARTAGE_V1,{

      });
}

      /* Les modules d'édition (modules/textes-admin-v1.js) n'affichent leurs boutons que pour l'administrateur ; le serveur, lui, revérifie chaque opération. */
      /* @amorce S:window.__SOREAL_IDLE_EST_ADMIN_V1__=estAdminSorealIdle_; function rafraich */
function __amorcer_10(){
window.__SOREAL_IDLE_EST_ADMIN_V1__=estAdminSorealIdle_;
}

      /* @amorce S:window.__changerPartieDevIdleV1__=changerPartieDevIdleV1_; /* Partie B uni */
function __amorcer_15(){
window.__changerPartieDevIdleV1__=changerPartieDevIdleV1_;
}

      /* @amorce S:window.__copierPartieADevIdleV1__=copierPartieADevIdleV1_; function rendre */
function __amorcer_17(){
window.__copierPartieADevIdleV1__=copierPartieADevIdleV1_;
}

      /* @amorce S:window.__heureServeurIdleV1__=heureServeurIdleV1_; /* Lecture seule de l'é */
function __amorcer_38(){
window.__heureServeurIdleV1__=heureServeurIdleV1_;
}

      /* Lecture seule de l'état courant pour les modules (panneau Détail Attack/Defense, modules/stats-detail-v1.js). */
      /* @amorce S:window.__SOREAL_IDLE_LIRE_ETAT_V1__=function(){return idleEtat;}; window._ */
function __amorcer_39(){
window.__SOREAL_IDLE_LIRE_ETAT_V1__=function(){return REG.idleEtat;};
}

      /* @amorce S:window.__SOREAL_IDLE_FORMAT_NOMBRE_V2__=function(n){return formatGrandNombreIdle */
function __amorcer_40(){
window.__SOREAL_IDLE_FORMAT_NOMBRE_V2__=function(n){return formatGrandNombreIdleV70_(n);};
}

      /* Augmentations : la couleur de la somme suit l'Or en direct, même sans énergie placée (un gain d'Or suffit à passer du rouge au vert). */
      /* @amorce S:setInterval(function(){ if(!idleEtat||document.hidden)return; co */
function __amorcer_41(){
setInterval(function(){
        if(!REG.idleEtat||document.hidden)return;
        const or=idleNombre_(REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies&&REG.idleEtat.systemes.currencies.gold);
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
}

      /*
       * Barres épuisées (Norman, 2026-10-10 : « quand les barres disparaissent, il reste un petit cadre prévu pour qu'elles réapparaissent : je n'en veux pas ; l'interface doit être collée à la barre de vie s'il n'y a
       * qu'une seule barre affichée »). Le « cliquet » du 2026-10-08, qui retenait la plus grande hauteur vue du bandeau (--hud-min-v2) pour que la page ne remonte pas, est SUPPRIMÉ : le bandeau prend exactement la
       * hauteur des barres affichées (les barres épuisées se replient en douceur, voir soreal-idle-themes.css) et tout ce qui est dessous remonte d'autant.
       */
      /* @amorce S:(function(){ const racine=document.documentElement; racine.style */
function __amorcer_42(){
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
}

      /* Fin de défi : annoncée dès que la synchro l'apporte, sans attendre un rendu complet de la page (modules/challenges-v1.js). */
      /* @amorce S:setInterval(function(){ if(!idleEtat||document.hidden)return; co#2 */
function __amorcer_43(){
setInterval(function(){
        if(!REG.idleEtat||document.hidden)return;
        const defis=window.__SOREAL_IDLE_DEFIS_V1__;
        if(defis&&typeof defis.verifierFin==='function'){try{defis.verifierFin(REG.idleEtat);}catch(_e){}}
      },1000);
}

      /* @amorce S:window.__SOREAL_IDLE_DISPONIBLE_V2__=function(){ const b=idleEtat&&idleE */
function __amorcer_45(){
window.__SOREAL_IDLE_DISPONIBLE_V2__=function(){
        const b=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceBudget&&REG.idleEtat.systemes.resourceBudget.magic;
        const r=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.resources&&REG.idleEtat.systemes.resources.magic;
        return {energie:energieDisponibleIdleV9_(),magie:b?idleNombre_(b.available):idleNombre_(r&&r.current),magieEnCours:magieEncoreAGenererIdleV1_()};
      };
}

      /* @amorce S:window.__SOREAL_IDLE_BARRE_INFOS_V2__=function(){ const e=idleEtat?infoB */
function __amorcer_48(){
window.__SOREAL_IDLE_BARRE_INFOS_V2__=function(){
        const e=REG.idleEtat?infoBandeauIdleV2_(REG.idleEtat.productionSeconde,idleNombre_(REG.idleEtat.energieMax)-energieGenereeTotaleIdleV1_()):{vitesse:'',temps:''};
        const m=typeof donneesMagieGenereeIdleV1_==='function'?donneesMagieGenereeIdleV1_():null;
        return {energie:e,magie:m?infoBandeauIdleV2_(m.parSeconde,m.cap-m.generee):{vitesse:'',temps:''}};
      };
}

      /* Bandeau : la Vie s'écrit EXACTEMENT comme la barre de Fight Boss (mêmes formats, même fonction de mise à jour). */
      /* @amorce S:window.__SOREAL_IDLE_TEXTE_PV_V2__=function(pv,max){return formaterPvFixeIdleV1_ */
function __amorcer_49(){
window.__SOREAL_IDLE_TEXTE_PV_V2__=function(pv,max){return formaterPvFixeIdleV1_(pv)+' / '+formaterPvFixeIdleV1_(max);};
}

      /* @amorce S:window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__=function(r){return r>0?'+'+formaterPvFi */
function __amorcer_50(){
window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__=function(r){return r>0?'+'+formaterPvFixeIdleV1_(r)+'/s':'';};
}

      /* @amorce S:window.__SOREAL_IDLE_REGEN_PV_V2__=function(menu){ if(!idleEtat)return 0 */
function __amorcer_52(){
window.__SOREAL_IDLE_REGEN_PV_V2__=function(menu){
        if(!REG.idleEtat)return 0;
        if(menu==='combat')return regenPvFightBossNguParSecondeV164_(REG.idleEtat.defense);
        const a=aventureMetaIdleV47_(REG.idleEtat);
        return a?regenReposAdventureIdleV3_(a,String(a.selectedZone||'safe')):regenPvFightBossNguParSecondeV164_(REG.idleEtat.defense);
      };
}

      /* @amorce S:window.__SOREAL_IDLE_GENEREE_PCT_V2__=function(){ const e=idleEtat&&idle */
function __amorcer_53(){
window.__SOREAL_IDLE_GENEREE_PCT_V2__=function(){
        const e=REG.idleEtat&&REG.idleEtat.energieMax>0?Math.min(100,energieGenereeTotaleIdleV1_()/REG.idleEtat.energieMax*100):0;
        const m=typeof donneesMagieGenereeIdleV1_==='function'?donneesMagieGenereeIdleV1_():null;
        return {energie:e,magie:m&&m.cap>0?Math.min(100,m.generee/m.cap*100):0};
      };
}

      /* @amorce S:window.__SOREAL_IDLE_TEXTE_BARRE_V2__=function(valeur,max){return formatGrandNom */
function __amorcer_54(){
window.__SOREAL_IDLE_TEXTE_BARRE_V2__=function(valeur,max){return formatGrandNombreIdleV70_(valeur)+' / '+formatGrandNombreIdleV70_(max);};
}

      /* @amorce S:if(typeof window!=='undefined')window.__allocOrdreIdleV1__=idleAllocOrdreV1;  */
function __amorcer_57(){
if(typeof window!=='undefined')window.__allocOrdreIdleV1__=REG.idleAllocOrdreV1;
}

      /* @amorce S:if(typeof window!=='undefined'){ window.__energieLibreCoherenteIdleV1__= */
function __amorcer_67(){
if(typeof window!=='undefined'){
        window.__energieLibreCoherenteIdleV1__=energieLibreCoherenteIdleV1_;
        /* Une répartition de Basic Training est-elle encore en route vers le serveur (minuteur, envoi en cours, modification à renvoyer) ? */
        window.__btAllocEnAttenteIdleV1__=function(){return Boolean(REG.idleBasicTrainingSaveTimerV120||REG.idleBasicTrainingSaveBusyV120||REG.idleBasicTrainingDirtyV120);};
      }
}

      /* @amorce S:window.__basculerSynchroBasicTrainingIdleV1__=function(coche){ try{windo */
function __amorcer_85(){
window.__basculerSynchroBasicTrainingIdleV1__=function(coche){
        try{window.localStorage.setItem(REG.IDLE_BT_SYNCHRO_CLE_V1,coche?'1':'0');}catch(e){}
      };
}

      /* @amorce S:window.__ajusterBasicTrainingIdleV120__= ajusterBasicTrainingIdleV120_;  */
function __amorcer_92(){
window.__ajusterBasicTrainingIdleV120__=
        ajusterBasicTrainingIdleV120_;
}

      /* @amorce S:window.__presetBasicTrainingIdleV120__= presetBasicTrainingIdleV120_;  */
function __amorcer_93(){
window.__presetBasicTrainingIdleV120__=
        presetBasicTrainingIdleV120_;
}

      /* @amorce S:window.__viderBasicTrainingIdleV120__= viderBasicTrainingIdleV120_;  */
function __amorcer_94(){
window.__viderBasicTrainingIdleV120__=
        viderBasicTrainingIdleV120_;
}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-22 */
      /* @amorce S:window.__energieDisponibleIdleV9__= energieDisponibleIdleV9_; /* */
function __amorcer_95(){
window.__energieDisponibleIdleV9__=
        energieDisponibleIdleV9_;
}

      /* @amorce S:window.__resoudreFractionInputIdleV1__=idleResoudreFractionInputV1_; /* H */
function __amorcer_102(){
window.__resoudreFractionInputIdleV1__=idleResoudreFractionInputV1_;
}

      /*
       * Les chiffres de vie du duel ne dépassent jamais de leur pastille (Norman, 2026-09-26 : « l'écriture de la vie dans les nouvelles barres dépasse ; ne les change pas mais fais en sorte que
       * ça ne dépasse jamais »). Même pastille, même taille de départ ; la police ne fait que rétrécir, par demi-pixel, tant que le texte est plus large que la pastille (cas des très grands
       * nombres ou du texte de régénération). Recalculé quand le texte ou la largeur de la carte change.
       */
      /* Les boutons de la borne (Fight / Fuite / Nuke) s'enfoncent le temps d'un appui, même très bref. */
      /* @amorce S:if(!window.__presseBorneIdleV1Installe){ window.__presseBorneIdleV1Insta */
function __amorcer_133(){
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
}

      /* Les trois boutons ronds de la borne déclenchent la commande de même couleur (un bouton grisé ne fait rien, comme la commande). */
      /* @amorce S:window.__clicDomeBorneIdleV1__=function(nom){ try{ const comma */
function __amorcer_134(){
window.__clicDomeBorneIdleV1__=function(nom){
        try{
          const commande=document.querySelector('.soreal-idle-boss-control-v39.'+nom);
          if(commande&&!commande.disabled)commande.click();
        }catch(_e){}
      };
}

      /* @amorce S:document.addEventListener('focusin',function(e){ const el=e.target;  */
function __amorcer_138(){
document.addEventListener('focusin',function(e){
        const el=e.target;
        if(!champQuantiteIdleV1_(el))return;
        /* La sélection posée au focus est souvent défaite par le relâchement de la souris : on la repose juste après. */
        setTimeout(function(){try{el.select();}catch(err){}},0);
      },true);
}

      /* @amorce S:document.addEventListener('click',toutSelectionnerIdleV1_,true); window.a */
function __amorcer_139(){
document.addEventListener('click',toutSelectionnerIdleV1_,true);
}

      /* @amorce S:window.addEventListener('resize',function(){ document.querySelectorAll(' */
function __amorcer_140(){
window.addEventListener('resize',function(){
        document.querySelectorAll('.soreal-idle-duel-hp-v41 > .soreal-idle-note-v4').forEach(function(el){ajusterVieDuelIdleV1_(el,true);});
      });
}

      /* @amorce S:try{ document.addEventListener('pointerdown',function(ev){ try */
function __amorcer_178(){
try{
        document.addEventListener('pointerdown',function(ev){
          try{
            const cible=ev.target&&ev.target.closest?ev.target.closest('button,[onclick],a,summary,select,label,.soreal-idle-v138-bag-card,.soreal-idle-v138-slot'):null;
            REG.idleDernierClicAncreV1=cible?{el:cible,t:Date.now(),y:window.scrollY||0}:null;
          }catch(_e){}
        },true);
      }catch(_e){}
}

      /* @amorce S:try{ ['wheel','touchstart','touchmove','keydown'].forEach(function(nom){ */
function __amorcer_186(){
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
}

      /* Menu de gauche (PC) : sa hauteur maximale suit la place réellement visible sous lui (fenêtre - sa position), sinon, page non défilée (bannière au-dessus), son bas dépassait de l'écran et il fallait faire descendre la page centrale (Norman, 2026-10-15). */
      /* @amorce S:(function(){ let attente=false; function ajuster(){ at */
function __amorcer_193(){
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
}

      /* @amorce S:if(!window.__SOREAL_IDLE_EVENEMENTS_AVENTURE_V1__){ window.__SOREAL_IDLE */
function __amorcer_197(){
if(!window.__SOREAL_IDLE_EVENEMENTS_AVENTURE_V1__){
        window.__SOREAL_IDLE_EVENEMENTS_AVENTURE_V1__=setInterval(function(){
          try{surveillerEvenementsAventureIdleV1_();}catch(_e){}
        },1000);
      }
}

      /* @amorce S:installerInfobulleEnergieIdleV1_(); /* * Raccourcis NGU : « Tap R  */
function __amorcer_223(){
installerInfobulleEnergieIdleV1_();
}

      /* @amorce S:installerRaccourcisReprendreIdleV1_(); function rafraichirEnergieEtBouton */
function __amorcer_225(){
installerRaccourcisReprendreIdleV1_();
}

      /* @amorce S:window.__forgerEquipementIdleV25__=forgerEquipementIdleV25_; function re */
function __amorcer_263(){
window.__forgerEquipementIdleV25__=forgerEquipementIdleV25_;
}

      /* @amorce S:window.__acheterAmeliorationIdleV12__= acheterAmeliorationIdleV12_;  */
function __amorcer_273(){
window.__acheterAmeliorationIdleV12__=
        acheterAmeliorationIdleV12_;
}

      /* @amorce S:window.__recyclerObjetsOptimisteIdleV32__= recyclerObjetsOptimisteIdleV3 */
function __amorcer_280(){
window.__recyclerObjetsOptimisteIdleV32__=
        recyclerObjetsOptimisteIdleV32_;
}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-99 */
      /* @amorce S:chargerCombatAutoIdleV30_(); /* Historique V8: docs/UI-MONOLITH-HISTORY. */
function __amorcer_296(){
chargerCombatAutoIdleV30_();
}

      /* @amorce S:window.__fermerPopupRenaissanceIdleV63__= fermerPopupRenaissanceIdleV63_ */
function __amorcer_306(){
window.__fermerPopupRenaissanceIdleV63__=
        fermerPopupRenaissanceIdleV63_;
}

      /* @amorce S:window.__executerRenaissanceIdleV63__= executerRenaissanceIdleV63_;  */
function __amorcer_307(){
window.__executerRenaissanceIdleV63__=
        executerRenaissanceIdleV63_;
}

      /* @amorce S:window.__renaitreIdleV14__= renaitreIdleV14_; const CLE_MENU_IDL */
function __amorcer_308(){
window.__renaitreIdleV14__=
        renaitreIdleV14_;
}

      /* Chaque Input est propre à son menu : la valeur change avec le menu (modules/meta-progression-v130.js, __SOREAL_IDLE_INPUT_MENU_V1__). */
      /* @amorce S:window.__menuActifIdleV28__=function(){return idleMenuActifV28;}; function */
function __amorcer_317(){
window.__menuActifIdleV28__=function(){return REG.idleMenuActifV28;};
}

      /* Atouts : plus de menu à part, la boutique est dans la page ITOPOD. */
      /* @amorce S:IDLE_MENU_PAR_SYSTEME_V1.perks='tower'; /* Titans : plus de menu à part (N */
function __amorcer_322(){
REG.IDLE_MENU_PAR_SYSTEME_V1.perks='tower';
}

      /* Titans : plus de menu à part (Norman, 2026-10-08), ils sont dans la page Adventure. */
      /* @amorce S:IDLE_MENU_PAR_SYSTEME_V1.titans='aventure'; IDLE_MENU_PAR_SYSTEME_V1.achie */
function __amorcer_323(){
REG.IDLE_MENU_PAR_SYSTEME_V1.titans='aventure';
}

      /* @amorce S:IDLE_MENU_PAR_SYSTEME_V1.achievements='chroniques'; function menuDisponib */
function __amorcer_324(){
REG.IDLE_MENU_PAR_SYSTEME_V1.achievements='chroniques';
}

      /* @amorce S:document.addEventListener('visibilitychange',function(){ if(document.hid */
function __amorcer_350(){
document.addEventListener('visibilitychange',function(){
        if(document.hidden&&REG.idleClicsEnAttenteV1>0){
          clearTimeout(REG.idleClicsEnvoiMinuterieV1);
          REG.idleClicsEnvoiMinuterieV1=null;
          idleClicsEnvoyerV1_();
        }
      });
}

      /* @amorce S:document.addEventListener('mousedown',function(ev){ if(PAGE_ACTIVE!=='id */
function __amorcer_351(){
document.addEventListener('mousedown',function(ev){
        if(PAGE_ACTIVE!=='idle')return;
        if(ev.button===0||ev.button===2)idleClicMarquerV1_();
      },true);
}

      /* @amorce S:document.addEventListener('touchstart',function(){ if(PAGE_ACTIVE!=='idl */
function __amorcer_352(){
document.addEventListener('touchstart',function(){
        if(PAGE_ACTIVE!=='idle')return;
        idleClicMarquerV1_();
      },{capture:true,passive:true});
}

      /*
       * Pont pour les modules externes (2026-09-27, popup d'histoire plein écran) : la mémoire
       * « vu une seule fois » (localStorage + profil.stats.vus serveur, marquerVusSorealIdle)
       * vit dans cette clôture. Plutôt que de dupliquer la file d'attente/l'envoi côté module,
       * modules/story-popup-v1.js appelle ce pont pour réutiliser exactement le même mécanisme
       * que les popups de menus/tutoriels (idleVuConnuV1_/idleVuMarquerV1_ ci-dessus).
       */
      /* @amorce S:window.__soreal_idle_marquer_vu_v1__=idleVuMarquerV1_; /* * Norman  */
function __amorcer_356(){
window.__soreal_idle_marquer_vu_v1__=idleVuMarquerV1_;
}

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
      /* @amorce S:window.__soreal_idle_vu_connu_v1__=function(id){return idleVuConnuV1_(idleEtat,i */
function __amorcer_357(){
window.__soreal_idle_vu_connu_v1__=function(id){return idleVuConnuV1_(REG.idleEtat,id);};
}

      /* @amorce S:window.__allerDepuisPopupNouveauteIdleV106__= allerDepuisPopupNouveauteI */
function __amorcer_367(){
window.__allerDepuisPopupNouveauteIdleV106__=
        allerDepuisPopupNouveauteIdleV106_;
}

      /* @amorce S:appliquerTextesTutorielsIdleV1_(); if(window.__SOREAL_IDLE_TEXTES_V1__)win */
function __amorcer_392(){
appliquerTextesTutorielsIdleV1_();
}

      /* @amorce S:if(window.__SOREAL_IDLE_TEXTES_V1__)window.__SOREAL_IDLE_TEXTES_V1__.surChangeme */
function __amorcer_393(){
if(window.__SOREAL_IDLE_TEXTES_V1__)window.__SOREAL_IDLE_TEXTES_V1__.surChangement(appliquerTextesTutorielsIdleV1_);
}

      /* Tous les textes d'explication connus d'avance (les systèmes dont la description vient des données du jeu restent en repli). */
      /* @amorce S:window.__sorealVoiceTextesIdleV1__=function(){ const textes=[];  */
function __amorcer_395(){
window.__sorealVoiceTextesIdleV1__=function(){
        const textes=[];
        [REG.TUTORIEL_DEBUT_JEU_PAGES_V1,REG.TUTORIEL_PREMIER_BOSS_PAGES_V1,REG.TUTORIEL_AVENTURE_PAGES_V1].forEach(function(pages){
          pages.forEach(function(page,index){textes.push(texteVoixTutorielIdleV1_(page,pages[index-1]));});
        });
        const definitions=definitionsNouveautesIdleV75_();
        Object.keys(definitions).forEach(function(cle){textes.push(texteVoixNouveauteIdleV1_(definitions[cle]));});
        textes.push(texteVoixNouveauteIdleV1_(infoMoneyPitIdleV1_()));
        textes.push(REG.VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1);
        /*
         * Histoires plein écran (2026-09-30) : elles sont désormais créées dans le menu Admin (base serveur), plus dans le code ; leurs
         * voix sont générées depuis ce menu (bouton « Générer les voix », voix réaliste sur le PC de l'administrateur) et stockées sur
         * R2 -- elles ne font donc plus partie de cette couverture statique.
         */
        return textes;
      };
}

      /* Textes des popups de système générique, pour chaque système du catalogue serveur (liste {id,name,icon,kind} fournie par l'outil de génération). */
      /* @amorce S:window.__sorealVoiceTextesSystemesIdleV1__=function(systemes){ return (A */
function __amorcer_396(){
window.__sorealVoiceTextesSystemesIdleV1__=function(systemes){
        return (Array.isArray(systemes)?systemes:[]).filter(function(s){
          return s&&s.id&&s.id!=='moneyPit'&&s.id!=='dailySpin'&&REG.IDLE_MENU_PAR_SYSTEME_V1[s.id];
        }).map(function(s){
          return texteVoixNouveauteIdleV1_(infoSystemeGeneriqueIdleV1_(s,REG.IDLE_MENU_PAR_SYSTEME_V1[s.id]));
        });
      };
}

      /* Essai en local uniquement (serveur de développement) : rejoue le tutoriel du début à la page voulue, sans rien marquer comme vu. */
      /* @amorce S:if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){ window.__SOREA */
function __amorcer_399(){
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){
        window.__SOREAL_IDLE_TUTO_REJOUER_V1__=function(index){
          REG.idleTutorielPagesEnCoursV1={pages:REG.TUTORIEL_DEBUT_JEU_PAGES_V1,index:Math.max(0,Math.floor(Number(index)||0)),cle:'rejeu-local'};
          rendreTutorielPagesIdleV1_();
        };
      }
}

      /* Liste des menus (identifiant, nom) pour l'éditeur du tutoriel. */
      /* @amorce S:window.__SOREAL_IDLE_MENUS_LISTE_V1__=function(){ return IDLE_MENUS_V1.m */
function __amorcer_402(){
window.__SOREAL_IDLE_MENUS_LISTE_V1__=function(){
        return REG.IDLE_MENUS_V1.map(function(m){return {id:m.id,icon:m.icon,nom:m.nom};});
      };
}

      /* @amorce S:declarerVoixSansTexteIdleV1_(); if(window.__SOREAL_IDLE_TEXTES_V1__&&typeo */
function __amorcer_413(){
declarerVoixSansTexteIdleV1_();
}

      /* @amorce S:if(window.__SOREAL_IDLE_TEXTES_V1__&&typeof window.__SOREAL_IDLE_TEXTES_V1__.sur */
function __amorcer_414(){
if(window.__SOREAL_IDLE_TEXTES_V1__&&typeof window.__SOREAL_IDLE_TEXTES_V1__.surChangement==='function')window.__SOREAL_IDLE_TEXTES_V1__.surChangement(declarerVoixSansTexteIdleV1_);
}

      /* @amorce S:window.__tutorielPagesNaviguerV1__=tutorielPagesNaviguerV1_; window.__tuto */
function __amorcer_418(){
window.__tutorielPagesNaviguerV1__=tutorielPagesNaviguerV1_;
}

      /* @amorce S:window.__tutorielPagesFermerV1__=tutorielPagesFermerV1_; function affich */
function __amorcer_419(){
window.__tutorielPagesFermerV1__=tutorielPagesFermerV1_;
}

      /* @amorce S:window.__annoncerNouveauxMenusIdleV1__=annoncerNouveauxMenusIdleV1_; /* H */
function __amorcer_422(){
window.__annoncerNouveauxMenusIdleV1__=annoncerNouveauxMenusIdleV1_;
}

      /* @amorce S:window.__fermerPopupNouveauteIdleV75__= fermerPopupNouveauteIdleV75_;  */
function __amorcer_425(){
window.__fermerPopupNouveauteIdleV75__=
        fermerPopupNouveauteIdleV75_;
}

      /* Trophées nouveaux à signaler d'un point rouge dans la page des succès (modules/profile-v1.js). Appelée au rendu de la page : capture ce qui n'a pas encore été vu avant de le marquer comme vu. */
      /* Plus de point rouge pour les nouveaux trophées (Norman, 2026-10-08) : la liste reste vide, la page des succès n'affiche aucun repère. */
      /* @amorce S:if(typeof window!=='undefined')window.__SOREAL_IDLE_SUCCES_NOUVEAUX_V1__=functio */
function __amorcer_433(){
if(typeof window!=='undefined')window.__SOREAL_IDLE_SUCCES_NOUVEAUX_V1__=function(){return [];};
}

      /* @amorce S:if(typeof window!=='undefined')window.__chroniquesOngletIdleV1__=function(id){  */
function __amorcer_438(){
if(typeof window!=='undefined')window.__chroniquesOngletIdleV1__=function(id){
        if(!REG.idleEtat)return;
        REG.idleChroniquesOngletV1=String(id||'');
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root)root.setAttribute('data-menu',menuStyleIdleV1_(REG.idleEtat));
        rafraichirMenuRacineIdleV28_();
      };
}

      /* @amorce S:if(typeof setInterval==='function')setInterval(actualiserNavAlimenteIdleV1_,500) */
function __amorcer_445(){
if(typeof setInterval==='function')setInterval(actualiserNavAlimenteIdleV1_,500);
}

      /* @amorce S:window.__reglerRangeesMenuIdleV1__=function(n){ n=n===1||n===3?n:2;  */
function __amorcer_474(){
window.__reglerRangeesMenuIdleV1__=function(n){
        n=n===1||n===3?n:2;
        try{localStorage.setItem(REG.CLE_RANGEES_MENU_IDLE_V1,String(n));}catch(e){}
        const nav=document.querySelector('.soreal-idle-nav-v28');
        if(nav)nav.style.setProperty('--nav-rangees',String(n));
        Array.prototype.forEach.call(document.querySelectorAll('[data-nav-rangees]'),function(b){
          b.classList.toggle('actif',Number(b.getAttribute('data-nav-rangees'))===n);
        });
      };
}

      /* @amorce S:window.__validerRangementMenuIdleV1__=validerRangementMenuIdleV1_; functi */
function __amorcer_481(){
window.__validerRangementMenuIdleV1__=validerRangementMenuIdleV1_;
}

      /* @amorce S:installerRangementMenuIdleV1_(); function naviguerSwipeIdleV1_(direction) */
function __amorcer_483(){
installerRangementMenuIdleV1_();
}

      /* Le journal de combat est aussi montré dans l'écran de combat de titan (modules/titans-combat-ecran-v1.js, Norman 2026-10-15) : il s'y dessine par la même fonction. */
      /* @amorce S:window.__dessinerJournalAventureIdleV1__=dessinerJournalAventureIdleV1_; w */
function __amorcer_498(){
window.__dessinerJournalAventureIdleV1__=dessinerJournalAventureIdleV1_;
}

      /* @amorce S:window.__ajouterLogAventureIdleV1__=ajouterLogAventureIdleV1_; function ge */
function __amorcer_499(){
window.__ajouterLogAventureIdleV1__=ajouterLogAventureIdleV1_;
}

      /* @amorce S:(function(){ function panneau(){return document.getElementById('sorealId */
function __amorcer_544(){
(function(){
        function panneau(){return document.getElementById('sorealIdleBossChroniqueV206');}
        function poser(ouvert){
          window.__chroniqueOuverteIdleV1=Boolean(ouvert);
          const p=panneau();
          if(p)p.classList.toggle('ouverte',Boolean(ouvert));
        }
        window.__ouvrirChroniqueIdleV1__=poser;
        document.addEventListener('click',function(e){
          const cible=e.target;
          const p=cible&&cible.closest?cible.closest('.soreal-idle-boss-lore-v142'):null;
          if(p){
            if(!p.classList.contains('ouverte')){
              if(cible.closest('button,a,[data-soreal-tts-target],[data-texte-admin]'))return;
              try{localStorage.setItem('soreal_idle_chronique_main_v1','1');}catch(_e){}
              const m=p.querySelector('.chro-main-v1');if(m)m.remove();
              poser(true);
            }else if(cible.closest('.soreal-idle-lore-fermer-v1'))poser(false);
            return;
          }
          if(window.__chroniqueOuverteIdleV1)poser(false);
        });
        document.addEventListener('keydown',function(e){
          if(e.key==='Escape'&&window.__chroniqueOuverteIdleV1)poser(false);
          else if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.classList&&e.target.classList.contains('soreal-idle-boss-lore-v142')&&!window.__chroniqueOuverteIdleV1){e.preventDefault();poser(true);}
        });
      })();
}

      /* @amorce S:window.__acheterSortIdleV90__= acheterSortIdleV90_; window.__lanc */
function __amorcer_562(){
window.__acheterSortIdleV90__=
        acheterSortIdleV90_;
}

      /* @amorce S:window.__lancerSortIdleV90__= lancerSortIdleV90_; function bouto */
function __amorcer_563(){
window.__lancerSortIdleV90__=
        lancerSortIdleV90_;
}

      /* Nom du joueur dans le jeu (pseudo), lu par la scène Adventure (modules/adventure-scene-v79.js). */
      /* @amorce S:window.__nomJoueurIdleV1__=function(){ return String(idleEtat&&idleEtat. */
function __amorcer_579(){
window.__nomJoueurIdleV1__=function(){
        return String(REG.idleEtat&&REG.idleEtat.nom||'Joueur');
      };
}

      /* @amorce S:window.__fermerCarteBossIdleV91__= fermerCarteBossIdleV91_; windo */
function __amorcer_580(){
window.__fermerCarteBossIdleV91__=
        fermerCarteBossIdleV91_;
}

      /* @amorce S:window.__combattreDepuisCarteBossIdleV91__= combattreDepuisCarteBossIdle */
function __amorcer_581(){
window.__combattreDepuisCarteBossIdleV91__=
        combattreDepuisCarteBossIdleV91_;
}

      /* @amorce S:try{ document.addEventListener('pointerdown',function(){idlePointeurEnfo */
function __amorcer_587(){
try{
        document.addEventListener('pointerdown',function(){REG.idlePointeurEnfonceV1=Date.now();},true);
        ['pointerup','pointercancel','click'].forEach(function(nom){document.addEventListener(nom,function(){REG.idlePointeurEnfonceV1=0;},true);});
      }catch(_e){}
}

      /* @amorce S:window.__definirCombatBossIdleV39__= definirCombatBossIdleV39_; / */
function __amorcer_597(){
window.__definirCombatBossIdleV39__=
        definirCombatBossIdleV39_;
}

      /* Fuite voulue par le joueur (bouton) : le son de fuite ne joue que s'il y a un combat à fuir. */
      /* @amorce S:window.__fuirBossIdleV1__=function(){ const enCombat=Boolean(idleEtat&&i */
function __amorcer_598(){
window.__fuirBossIdleV1__=function(){
        const enCombat=Boolean(REG.idleEtat&&REG.idleEtat.combatBossActif);
        definirCombatBossIdleV39_(false);
        if(enCombat){
          jouerEffetAudioIdleV199_('flee');
          /* Les rires de la salle se jouent EN PLUS du son de fuite (Norman, 2026-10-04). */
          jouerEffetAudioIdleV199_('laugh');
        }
      };
}

      /* @amorce S:window.__nukerBossIdleV1__= nukerBossIdleV1_; /* * Auto Nu */
function __amorcer_602(){
window.__nukerBossIdleV1__=
        nukerBossIdleV1_;
}

      /* @amorce S:setInterval(function(){ try{ const j=idleEtat; const */
function __amorcer_606(){
setInterval(function(){
        try{
          const j=REG.idleEtat;
          const achats=j&&j.systemes&&j.systemes.selloutShop&&j.systemes.selloutShop.purchases;
          if(!achats||!(Number(achats.autoNuker)>0))return;
          const debut=Number(j.renaissance&&j.renaissance.runDebuteA)||0;
          if(debut!==REG.idleAutoNukeRunV1){
            REG.idleAutoNukeRunV1=debut;
            REG.idleAutoNukeDernierV1=0;
          }
          const maintenant=Date.now();
          if(!autoNukeDueIdleV1_(debut,REG.idleAutoNukeDernierV1,maintenant))return;
          if(REG.idleNukeEnCoursV1||j.combatBossActif||j.bossBloqueRenaissance)return;
          REG.idleAutoNukeDernierV1=maintenant;
          nukerBossIdleV1_();
        }catch(e){window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler&&window.__SOREAL_IDLE_DIAG_V1__.signaler('auto_nuke',e);}
      },1000);
}

      /* @amorce S:window.__changerOngletCollectionIdleV1__=changerOngletCollectionIdleV1_;  */
function __amorcer_622(){
window.__changerOngletCollectionIdleV1__=changerOngletCollectionIdleV1_;
}

      /* @amorce S:window.__changerPageCollectionEquipementV1__=changerPageCollectionEquipementV1_; */
function __amorcer_627(){
window.__changerPageCollectionEquipementV1__=changerPageCollectionEquipementV1_;
}

      /* @amorce S:window.__afficherDetailsCollectionIdleV1__=afficherDetailsCollectionIdleV1_;  */
function __amorcer_630(){
window.__afficherDetailsCollectionIdleV1__=afficherDetailsCollectionIdleV1_;
}

      /* @amorce S:window.__ouvrirBossCollectionIdleV1__=ouvrirBossCollectionIdleV1_; /*  */
function __amorcer_633(){
window.__ouvrirBossCollectionIdleV1__=ouvrirBossCollectionIdleV1_;
}

      /*
       * Édition depuis la fiche : le clic sur « Modifier le texte » est géré par modules/textes-admin-v1.js (éditeur plein écran, au-dessus de la fiche). Quand l'éditeur se referme, la fiche est rouverte avec le texte à jour
       * (la synchro demandée à l'enregistrement a eu le temps d'arriver).
       */
      /* @amorce S:if(typeof document.addEventListener==='function')document.addEventListener('clic */
function __amorcer_634(){
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
}

      /* @amorce S:window.__fermerBossCollectionIdleV1__=fermerBossCollectionIdleV1_; functi */
function __amorcer_635(){
window.__fermerBossCollectionIdleV1__=fermerBossCollectionIdleV1_;
}

      /* @amorce S:window.__lireHistoireCompleteBossIdleV206__= lireHistoireCompleteBossIdl */
function __amorcer_637(){
window.__lireHistoireCompleteBossIdleV206__=
        lireHistoireCompleteBossIdleV206_;
}

      /* @amorce S:window.__SOREAL_IDLE_INVENTORY_PERF_V160__=idleInventoryPerfV160; functio */
function __amorcer_658(){
window.__SOREAL_IDLE_INVENTORY_PERF_V160__=REG.idleInventoryPerfV160;
}

      /* @amorce S:window.__zoneAdventurePrecedenteV1__=zoneAdventurePrecedenteV1_; window.__ */
function __amorcer_705(){
window.__zoneAdventurePrecedenteV1__=zoneAdventurePrecedenteV1_;
}

      /* @amorce S:window.__zoneAdventureSuivanteV1__=zoneAdventureSuivanteV1_; /* Historiqu */
function __amorcer_706(){
window.__zoneAdventureSuivanteV1__=zoneAdventureSuivanteV1_;
}

      /* @amorce S:try{ idleAdventureIdleModeV3= localStorage.getItem('sorealIdle */
function __amorcer_739(){
try{
        REG.idleAdventureIdleModeV3=
          localStorage.getItem('sorealIdleAdventureIdleModeV3')!=='0';
      }catch(e){}
}

      /* @amorce S:window.__basculerIdleModeAdventureIdleV3__=basculerIdleModeAdventureIdleV3_;  */
function __amorcer_762(){
window.__basculerIdleModeAdventureIdleV3__=basculerIdleModeAdventureIdleV3_;
}

      /* @amorce S:window.__utiliserCompetenceAdventureIdleV3__=utiliserCompetenceAdventureIdleV3_; */
function __amorcer_768(){
window.__utiliserCompetenceAdventureIdleV3__=utiliserCompetenceAdventureIdleV3_;
}

      /* Écran de combat de titan (modules/titans-combat-ecran-v1.js) : mêmes raccourcis d'attaque que l'Aventure, état du titan et paralysie en lecture seule, arrêt du combat. */
      /* @amorce S:window.__rendreCommandesAdventureIdleV3__=function(){return rendreCommandesAdven */
function __amorcer_769(){
window.__rendreCommandesAdventureIdleV3__=function(){return rendreCommandesAdventureIdleV3_();};
}

      /* @amorce S:window.__titanEtatCombatIdleV1__=function(){return idleTitanEtatV1;}; /* P */
function __amorcer_770(){
window.__titanEtatCombatIdleV1__=function(){return REG.idleTitanEtatV1;};
}

      /* Page Titans (modules/titans-v1.js) : état à jour du joueur et rafraîchissement de la page, pour que la carte d'un titan vaincu passe toute seule en compte à rebours. */
      /* @amorce S:window.__titansEtatJoueurIdleV1__=function(){return idleEtat;}; window.__t */
function __amorcer_771(){
window.__titansEtatJoueurIdleV1__=function(){return REG.idleEtat;};
}

      /* @amorce S:window.__titansRafraichirPageIdleV1__=function(){try{rafraichirMenuRacineIdleV28 */
function __amorcer_772(){
window.__titansRafraichirPageIdleV1__=function(){try{rafraichirMenuRacineIdleV28_();}catch(e){}};
}

      /* @amorce S:window.__rafraichirPageIdleV1__=window.__titansRafraichirPageIdleV1__; /* outil  */
function __amorcer_773(){
window.__rafraichirPageIdleV1__=window.__titansRafraichirPageIdleV1__;
}

      /* @amorce S:window.__titanJoueurParalyseIdleV1__=function(maintenant){return titanJoueurPara */
function __amorcer_774(){
window.__titanJoueurParalyseIdleV1__=function(maintenant){return titanJoueurParalyseIdleV1_(maintenant);};
}

      /* @amorce S:window.__arreterCombatTitanV1__=arreterCombatTitanIdleV1_; /* Journal des  */
function __amorcer_776(){
window.__arreterCombatTitanV1__=arreterCombatTitanIdleV1_;
}

      /* Journal des attaques (modules/journal-attaques-v1.js) : quels raccourcis expliquer = ceux qui sont débloqués (anti-spoil). */
      /* @amorce S:window.__competencesJournalIdleV1__=function(){ /* Norman (2026-10-13) : */
function __amorcer_777(){
window.__competencesJournalIdleV1__=function(){
        /* Norman (2026-10-13) : le journal ne mentionne pas les attaques non débloquées : seuls les raccourcis réellement utilisables (même condition que le bouton actif) sont expliqués. */
        const a=aventureMetaIdleV47_(REG.idleEtat);
        function debloquees(liste,groupe){
          return liste.filter(function(d){return competenceAdventureDisponibleIdleV4_(d,groupe,a);}).map(function(d){return d.id;});
        }
        return debloquees(REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3,'attack')
          .concat(debloquees(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3,'defense'))
          .concat(debloquees(REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4,'advanced'));
      };
}

      /* @amorce S:window.__trouverWalderpIdleV147__=trouverWalderpIdleV147_; /* Historique  */
function __amorcer_805(){
window.__trouverWalderpIdleV147__=trouverWalderpIdleV147_;
}

      /* @amorce S:window.__utiliserObjetDeblocageIdleV1__=utiliserObjetDeblocageIdleV1_; fu */
function __amorcer_811(){
window.__utiliserObjetDeblocageIdleV1__=utiliserObjetDeblocageIdleV1_;
}

      /* @amorce S:window.__consommerDeblocageAdventureIdleV47__=consommerDeblocageAdventureIdleV47 */
function __amorcer_813(){
window.__consommerDeblocageAdventureIdleV47__=consommerDeblocageAdventureIdleV47_;
}

      /* @amorce S:window.__consommerObjetSkillAdventureIdleV4__=consommerObjetSkillAdventureIdleV4 */
function __amorcer_815(){
window.__consommerObjetSkillAdventureIdleV4__=consommerObjetSkillAdventureIdleV4_;
}

      /* @amorce S:window.__transformerObjetAdventureIdleV4__=transformerObjetAdventureIdleV4_;  */
function __amorcer_818(){
window.__transformerObjetAdventureIdleV4__=transformerObjetAdventureIdleV4_;
}

      /* @amorce S:window.__desequiperObjetAdventureIdleV47__=desequiperObjetAdventureIdleV47_;  */
function __amorcer_821(){
window.__desequiperObjetAdventureIdleV47__=desequiperObjetAdventureIdleV47_;
}

      /* @amorce S:if(!window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__){ window.__SOREAL_IDL */
function __amorcer_829(){
if(!window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__){
        window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__=true;
        document.addEventListener('click',function(event){
          const bloc=document.getElementById('idleZoneSelectCustom');
          if(bloc&&event&&!bloc.contains(event.target)){
            bloc.classList.remove('open');
          }
        });
      }
}

      /* @amorce S:window.__toggleMenuZoneAdventureIdleV1__=toggleMenuZoneAdventureIdleV1_;  */
function __amorcer_830(){
window.__toggleMenuZoneAdventureIdleV1__=toggleMenuZoneAdventureIdleV1_;
}

      /* @amorce S:window.__selectionnerZoneAdventureIdleV47__=selectionnerZoneAdventureIdleV47_;  */
function __amorcer_831(){
window.__selectionnerZoneAdventureIdleV47__=selectionnerZoneAdventureIdleV47_;
}

      /* @amorce S:window.__equiperParIdAdventureIdleV138__=equiperParIdAdventureIdleV138_; w */
function __amorcer_832(){
window.__equiperParIdAdventureIdleV138__=equiperParIdAdventureIdleV138_;
}

      /* @amorce S:window.__actionMetaV47__=actionMetaV47_; window.__toastIdleV5__=toastIdleV */
function __amorcer_833(){
window.__actionMetaV47__=actionMetaV47_;
}

      /* @amorce S:window.__toastIdleV5__=toastIdleV5_; window.__setDiggerIdleV47__=setDigger */
function __amorcer_834(){
window.__toastIdleV5__=toastIdleV5_;
}

      /* @amorce S:window.__setDiggerIdleV47__=setDiggerIdleV47_; window.__toggleDiggerIdleV4 */
function __amorcer_835(){
window.__setDiggerIdleV47__=setDiggerIdleV47_;
}

      /* @amorce S:window.__toggleDiggerIdleV47__=toggleDiggerIdleV47_; function pageEntrain */
function __amorcer_836(){
window.__toggleDiggerIdleV47__=toggleDiggerIdleV47_;
}

/* @amorce S:window.__vueAventureIdleV1__=function(v){ /* Norman (2026-10-13) : le bouton A */
function __amorcer_840(){
window.__vueAventureIdleV1__=function(v){
  /* Norman (2026-10-13) : le bouton Aventure (retour aux zones) arrête le combat de titan en cours et laisse en Zone sûre. */
  if(v!=='titans')arreterCombatTitanIdleV1_();
  REG.idleVueAventureV1=v==='titans'?'titans':'zones';
  /* Norman (2026-10-10) : les combats d'Aventure (scène + journal) et l'automatisation de l'inventaire ne s'affichent pas sur la page Titans (voir soreal-idle-itopod.css). */
  document.documentElement.setAttribute('data-vue-aventure',REG.idleVueAventureV1);
  try{rafraichirMenuRacineIdleV28_();}catch(e){}
};
}

      /* @amorce S:window.__changerPageSacV1__=changerPageSacV1_; function pagerSacIdleV1_(pa */
function __amorcer_867(){
window.__changerPageSacV1__=changerPageSacV1_;
}

      /* @amorce S:window.__deposerSurEmplacementVideSacAdventureIdleV1__=deposerSurEmplacementVide */
function __amorcer_872(){
window.__deposerSurEmplacementVideSacAdventureIdleV1__=deposerSurEmplacementVideSacAdventureIdleV1_;
}

      /* @amorce S:installerGestesInventaireAdventureIdleV196_(); /* * PC — popup d'o */
function __amorcer_919(){
installerGestesInventaireAdventureIdleV196_();
}

      /* La souris quitte la fenêtre du navigateur */
      /* @amorce S:document.documentElement.addEventListener('mouseleave',function(){ annul */
function __amorcer_931(){
document.documentElement.addEventListener('mouseleave',function(){
        annulerOuvertureSurvolIdleV1_();
        if(!REG.idleSurvolIdV1)return;
        clearTimeout(REG.idleSurvolTimerFermerV1);
        REG.idleSurvolTimerFermerV1=setTimeout(function(){
          REG.idleSurvolTimerFermerV1=0;
          fermerSurvolIdleV1_();
        },200);
      });
}

      /* Presser un objet à la souris = glisser-déposer : le popup ne doit pas gêner, ni revenir avant le relâchement. */
      /* @amorce S:document.addEventListener('pointerdown',function(event){ if(!survolPossi */
function __amorcer_932(){
document.addEventListener('pointerdown',function(event){
        if(!survolPossibleIdleV1_(event))return;
        if(!elementObjetGesteAdventureIdleV196_(event.target))return;
        REG.idleSurvolBloqueV1=true;
        annulerOuvertureSurvolIdleV1_();
        fermerSurvolIdleV1_();
      },true);
}

      /* @amorce S:document.addEventListener('pointerup',function(){ setTimeout(function(){ */
function __amorcer_933(){
document.addEventListener('pointerup',function(){
        setTimeout(function(){REG.idleSurvolBloqueV1=false;},60);
      },true);
}

      /* @amorce S:window.__deposerSurCubeAdventureIdleV138__=deposerSurCubeAdventureIdleV138_;  */
function __amorcer_944(){
window.__deposerSurCubeAdventureIdleV138__=deposerSurCubeAdventureIdleV138_;
}

      /* @amorce S:window.__clicCubeAdventureIdleV138__=clicCubeAdventureIdleV138_; /* Histo */
function __amorcer_954(){
window.__clicCubeAdventureIdleV138__=clicCubeAdventureIdleV138_;
}

      /* @amorce S:window.__deposerSurTrashAdventureIdleV138__=deposerSurTrashAdventureIdleV138_;  */
function __amorcer_961(){
window.__deposerSurTrashAdventureIdleV138__=deposerSurTrashAdventureIdleV138_;
}

      /* @amorce S:window.__supprimerObjetAdventureIdleV165__=supprimerObjetAdventureIdleV165_;  */
function __amorcer_962(){
window.__supprimerObjetAdventureIdleV165__=supprimerObjetAdventureIdleV165_;
}

      /* @amorce S:window.__basculerVerrouObjetAdventureIdleV165__=basculerVerrouObjetAdventureIdle */
function __amorcer_963(){
window.__basculerVerrouObjetAdventureIdleV165__=basculerVerrouObjetAdventureIdleV165_;
}

      /* @amorce S:window.__consulterObjetIdleV1__=function(cle,element){ clearTimeout(idle */
function __amorcer_975(){
window.__consulterObjetIdleV1__=function(cle,element){
        clearTimeout(REG.idleSurvolVirtuelTimerV1);
        REG.idleSurvolVirtuelTimerV1=0;
        REG.idleSurvolVirtuelCleV1=cle;
        afficherPopupObjetUnifieIdleV1_(cle,element);
      };
}

      /* @amorce S:document.addEventListener('mouseover',function(event){ if(!survolPossibl */
function __amorcer_979(){
document.addEventListener('mouseover',function(event){
        if(!survolPossibleIdleV1_(event))return;
        const cible=event.target;
        if(cibleDansPopupDetailsObjetAdventureIdleV207_(cible)){
          clearTimeout(REG.idleSurvolVirtuelFermerV1);
          REG.idleSurvolVirtuelFermerV1=0;
          return;
        }
        const element=cible&&cible.closest?cible.closest('[data-popup-objet-v1]'):null;
        if(element){
          clearTimeout(REG.idleSurvolVirtuelFermerV1);
          REG.idleSurvolVirtuelFermerV1=0;
          const cle=element.getAttribute('data-popup-objet-v1');
          if(cle===REG.idleSurvolVirtuelCleV1&&popupDetailsObjetAdventureIdleOuvertV207_())return;
          clearTimeout(REG.idleSurvolVirtuelTimerV1);
          REG.idleSurvolVirtuelTimerV1=setTimeout(function(){
            REG.idleSurvolVirtuelTimerV1=0;
            if(!element.isConnected||survolOccupeIdleV1_())return;
            REG.idleSurvolVirtuelCleV1=cle;
            afficherPopupObjetUnifieIdleV1_(cle,element);
          },REG.IDLE_SURVOL_DELAI_OUVERTURE_MS_V1);
          return;
        }
        clearTimeout(REG.idleSurvolVirtuelTimerV1);
        REG.idleSurvolVirtuelTimerV1=0;
        if(REG.idleSurvolVirtuelCleV1&&!REG.idleSurvolVirtuelFermerV1){
          REG.idleSurvolVirtuelFermerV1=setTimeout(function(){
            REG.idleSurvolVirtuelFermerV1=0;
            REG.idleSurvolVirtuelCleV1='';
            if(popupDetailsObjetAdventureIdleOuvertV207_())fermerDetailsObjetAdventureIdleV1_();
          },250);
        }
      });
}

      /* @amorce S:(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1 */
function __amorcer_992(){
(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(restaurerFichesApresRedessinIdleV1_);
}

      /* @amorce S:window.__comparerObjetAdventureIdleV183__=comparerObjetAdventureIdleV183_;  */
function __amorcer_993(){
window.__comparerObjetAdventureIdleV183__=comparerObjetAdventureIdleV183_;
}

      /* @amorce S:window.__fermerComparaisonObjetAdventureIdleV183__=fermerComparaisonObjetAdventu */
function __amorcer_994(){
window.__fermerComparaisonObjetAdventureIdleV183__=fermerComparaisonObjetAdventureIdleV183_;
}

      /* @amorce S:window.__fermerDetailsObjetAdventureIdleV1__=fermerDetailsObjetAdventureIdleV1_; */
function __amorcer_996(){
window.__fermerDetailsObjetAdventureIdleV1__=fermerDetailsObjetAdventureIdleV1_;
}

      /* @amorce S:window.__clicTrashAdventureIdleV138__=clicTrashAdventureIdleV138_; windo */
function __amorcer_998(){
window.__clicTrashAdventureIdleV138__=clicTrashAdventureIdleV138_;
}

      /* @amorce S:window.__survolCibleAdventureIdleV138__=survolCibleAdventureIdleV138_; win */
function __amorcer_999(){
window.__survolCibleAdventureIdleV138__=survolCibleAdventureIdleV138_;
}

      /* @amorce S:window.__quitterCibleAdventureIdleV138__=quitterCibleAdventureIdleV138_;  */
function __amorcer_1000(){
window.__quitterCibleAdventureIdleV138__=quitterCibleAdventureIdleV138_;
}

      /* @amorce S:window.__changerPageCoffreV1__=changerPageCoffreV1_; /* * Recherch */
function __amorcer_1010(){
window.__changerPageCoffreV1__=changerPageCoffreV1_;
}

      /* Tape dans la recherche : seule la grille est redessinée (le champ garde le focus) et on revient à la page 1. */
      /* @amorce S:window.__filtrerObjetCoffreIdleV1__=function(definitionId,bouton){ const */
function __amorcer_1016(){
window.__filtrerObjetCoffreIdleV1__=function(definitionId,bouton){
        const filtre=!(bouton&&bouton.classList.contains('actif'));
        if(bouton){
          bouton.classList.toggle('actif',filtre);
          bouton.textContent=filtre?'🚫':'🧹';
          bouton.title=filtre?'Filtré : cet objet n’est plus ramassé dans cette zone. Clique pour le ramasser de nouveau.':'Clique pour ne plus ramasser cet objet dans cette zone.';
        }
        if(typeof window.__inventaireAutoFiltreObjetV1__==='function')window.__inventaireAutoFiltreObjetV1__(definitionId,filtre);
      };
}

      /* @amorce S:window.__rechercheCoffreV1__=function(texte){ idleRechercheCoffreV1=Stri */
function __amorcer_1017(){
window.__rechercheCoffreV1__=function(texte){
        REG.idleRechercheCoffreV1=String(texte==null?'':texte);
        REG.idlePageCoffreV1=1;
        const conteneur=document.getElementById('sorealIdleCoffreGrilleV1');
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        if(conteneur&&a)conteneur.innerHTML=grilleCoffreAdventureIdleV1_(Array.isArray(a.coffreSlots)?a.coffreSlots:[]);
      };
}

      /* Le Coffre contient-il un objet dont le nom correspond ? (ses excuses après un pet peuvent le citer : modules/coffre-digestion-v1.js) */
      /* @amorce S:window.__coffreContientObjetIdleV1__=function(motif){ try{ con */
function __amorcer_1023(){
window.__coffreContientObjetIdleV1__=function(motif){
        try{
          const a=aventureMetaIdleV47_(REG.idleEtat);
          return !!(a&&Array.isArray(a.coffreSlots)&&a.coffreSlots.some(function(s){return s&&s.occupe&&motif.test(String(s.name||(s.item&&s.item.name)||''));}));
        }catch(_e){return false;}
      };
}

      /* @amorce S:window.__toggleCoffreOuvertAdventureIdleV1__=toggleCoffreOuvertAdventureIdleV1_; */
function __amorcer_1029(){
window.__toggleCoffreOuvertAdventureIdleV1__=toggleCoffreOuvertAdventureIdleV1_;
}

      /* @amorce S:window.__deposerSurCoffreAdventureIdleV1__=deposerSurCoffreAdventureIdleV1_;  */
function __amorcer_1031(){
window.__deposerSurCoffreAdventureIdleV1__=deposerSurCoffreAdventureIdleV1_;
}

      /* @amorce S:window.__clicCoffreAdventureIdleV1__=clicCoffreAdventureIdleV1_; function */
function __amorcer_1033(){
window.__clicCoffreAdventureIdleV1__=clicCoffreAdventureIdleV1_;
}

      /* @amorce S:window.__retirerDuCoffreAdventureIdleV1__=retirerDuCoffreAdventureIdleV1_;  */
function __amorcer_1035(){
window.__retirerDuCoffreAdventureIdleV1__=retirerDuCoffreAdventureIdleV1_;
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
      /* @amorce S:window.__SOREAL_IDLE_META_HOST_V130__={ getIdleEtat:function(){return id */
function __amorcer_1039(){
window.__SOREAL_IDLE_META_HOST_V130__={
        getIdleEtat:function(){return REG.idleEtat;},
        setIdleEtat:function(v){REG.idleEtat=v;},
        setIdleAdventureRespawnStartPending:function(v){REG.idleAdventureRespawnStartPendingV165=v;},
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
}

      /* @amorce S:window.__changerOngletShopIdleV1__=changerOngletShopIdleV1_; function pag */
function __amorcer_1046(){
window.__changerOngletShopIdleV1__=changerOngletShopIdleV1_;
}

      /* @amorce S:window.__changerOngletClassementIdleV1__=changerOngletClassementIdleV1_;  */
function __amorcer_1052(){
window.__changerOngletClassementIdleV1__=changerOngletClassementIdleV1_;
}

      /* @amorce S:window.__actualiserClassementIdleV1__=function(){chargerClassementIdleV1_(true); */
function __amorcer_1054(){
window.__actualiserClassementIdleV1__=function(){chargerClassementIdleV1_(true);};
}

      /* @amorce S:try{idleApOngletV1=localStorage.getItem('soreal_idle_ap_onglet_v1')||'';}catch(e */
function __amorcer_1064(){
try{REG.idleApOngletV1=localStorage.getItem('soreal_idle_ap_onglet_v1')||'';}catch(e){}
}

      /* @amorce S:window.__ongletApShopIdleV1__=function(id){ if(!Object.prototype.hasOwnP */
function __amorcer_1065(){
window.__ongletApShopIdleV1__=function(id){
        if(!Object.prototype.hasOwnProperty.call(REG.IDLE_SELLOUT_SHOP_CATEGORIES_V1,id))return;
        REG.idleApOngletV1=id;
        try{localStorage.setItem('soreal_idle_ap_onglet_v1',id);}catch(e){}
        if(REG.idleEtat)rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
      };
}

      /* @amorce S:window.__ouvrirPopupResetTotalIdleV67__= ouvrirPopupResetTotalIdleV67_;  */
function __amorcer_1082(){
window.__ouvrirPopupResetTotalIdleV67__=
        ouvrirPopupResetTotalIdleV67_;
}

      /* @amorce S:window.__fermerPopupResetTotalIdleV67__= fermerPopupResetTotalIdleV67_;  */
function __amorcer_1083(){
window.__fermerPopupResetTotalIdleV67__=
        fermerPopupResetTotalIdleV67_;
}

      /* @amorce S:window.__executerResetTotalIdleV67__= executerResetTotalIdleV67_;  */
function __amorcer_1084(){
window.__executerResetTotalIdleV67__=
        executerResetTotalIdleV67_;
}

      /* @amorce S:window.__basculerNotesMajIdleV1__=basculerNotesMajIdleV1_; /* Notes en PAG */
function __amorcer_1092(){
window.__basculerNotesMajIdleV1__=basculerNotesMajIdleV1_;
}

      /* @amorce S:window.__pageNotesMajIdleV1__=function(delta){ const total=notesMajIdleV */
function __amorcer_1094(){
window.__pageNotesMajIdleV1__=function(delta){
        const total=notesMajIdleV1_().versions.length;
        REG.notesMajPageIdleV1_=Math.max(0,Math.min(total-1,REG.notesMajPageIdleV1_+(Number(delta)||0)));
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      };
}

      /*
       * Clic sur « Beta x.y » en haut de l'app (Norman, 2026-10-08) : ouvre les Réglages, déplie les notes de mise à jour et les amène à l'écran.
       */
      /* @amorce S:window.__ouvrirNotesMajIdleV1__=function(){ try{localStorage.setItem('so */
function __amorcer_1095(){
window.__ouvrirNotesMajIdleV1__=function(){
        try{localStorage.setItem('soreal_idle_notes_maj_ouvert_v1','1');}catch(e){}
        if(REG.idleMenuActifV28==='parametres'){
          const root=document.querySelector('.soreal-idle-page-root-v28');
          if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
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
}

      /*
       * Norman (2026-09-27) : « Tu dois ajouter dans paramètres, des barres de son pour régler le volume des
       * voix et le volume d'ambiance. » Pas de re-rendu de la page à chaque glissement du curseur (perdrait le
       * focus/le geste en cours) : on ajuste juste le module concerné + le pourcentage affiché.
       */
      /* @amorce S:window.__reglerVolumeIdleV1__=function(type,valeur){ const r=window.__SO */
function __amorcer_1096(){
window.__reglerVolumeIdleV1__=function(type,valeur){
        const r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
        if(!r||!r.setReglage)return;
        const v=Math.max(0,Math.min(100,idleEntier_(valeur)))/100;
        r.setReglage(type,v);
        const label=document.getElementById('sorealIdleVolumeValeurV1_'+type);
        if(label)label.textContent=Math.round(v*100)+'%';
      };
}

      /* Case à cocher d'une des trois options (voix, ambiance, sons de l'interface) : décochée = coupée complètement (Norman, 2026-10-02). */
      /* @amorce S:window.__basculerSonIdleV1__=function(type,coche){ const r=window.__SORE */
function __amorcer_1097(){
window.__basculerSonIdleV1__=function(type,coche){
        const r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
        if(!r||!r.setActif)return;
        r.setActif(type,!!coche);
        const curseur=document.getElementById('sorealIdleVolumeCurseurV1_'+type);
        if(curseur)curseur.disabled=!coche;
        const ligne=document.getElementById('sorealIdleVolumeLigneV1_'+type);
        if(ligne)ligne.style.opacity=coche?'1':'.5';
      };
}

      /* @amorce S:window.__changerLangueIdleV1__=function(langue){ const choix=langue==='e */
function __amorcer_1099(){
window.__changerLangueIdleV1__=function(langue){
        const choix=langue==='en'?'en':'fr';
        if(choix===langueIdleV1_())return;
        try{localStorage.setItem('soreal_idle_langue_v1',choix);}catch(_e){}
        /* Interface en anglais : le module traduction-anglais-v1.js traduit (ou restitue) le texte affiché tout de suite. */
        if(typeof window.__SOREAL_IDLE_LANGUE_CHANGEE_V1__==='function')window.__SOREAL_IDLE_LANGUE_CHANGEE_V1__(choix);
        /* Resynchronisation complète : le serveur renvoie aussitôt les textes dans la nouvelle langue, puis la page se redessine. */
        synchroniserJeuIdleV7_(true);
        setTimeout(function(){
          if(REG.idleEtat&&document.querySelector('.soreal-idle-page-root-v28'))rafraichirMenuRacineIdleV28_();
        },800);
        setTimeout(function(){
          if(REG.idleEtat&&document.querySelector('.soreal-idle-page-root-v28'))rafraichirMenuRacineIdleV28_();
        },2500);
      };
}

      /*
       * Sons de défaite (Norman, 2026-10-15). Aucun réglage pour les joueurs : le jeu tire au hasard parmi les sons RETENUS par Norman (modules/audio-effects-v199.js, SONS_DEFAITE). Cette section n'existe qu'en mode
       * développement : elle fait seulement ÉCOUTER (▶) les sons de défaite du jeu.
       */
      /* @amorce S:window.__ecouterSonDefaiteIdleV1__=function(nom){ const A=window.__SOREA */
function __amorcer_1102(){
window.__ecouterSonDefaiteIdleV1__=function(nom){
        const A=window.__SOREAL_IDLE_AUDIO_V199__;
        if(!A||!A.previewDefeat)return;
        try{if(A.unlock)A.unlock();}catch(_e){}
        A.previewDefeat(nom);
      };
}

      /* Bruits de diarrhée à choisir (Norman, 2026-10-15) : section de développement, ▶ pour écouter. */
      /* @amorce S:window.__ecouterDiarrheeIdleV1__=function(id){ const A=window.__SOREAL_I */
function __amorcer_1103(){
window.__ecouterDiarrheeIdleV1__=function(id){
        const A=window.__SOREAL_IDLE_AUDIO_V199__;
        if(A&&typeof A.previewDiarrhee==='function')A.previewDiarrhee(String(id||''));
      };
}

      /* Musique de combat de Titan (Norman, 2026-10-15) : aperçu dans la section de développement des Réglages. */
      /* @amorce S:window.__apercuMusiqueTitanIdleV1__=function(marche){ const M=window.__S */
function __amorcer_1104(){
window.__apercuMusiqueTitanIdleV1__=function(marche){
        const M=window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__;
        if(!M)return;
        if(marche)M.lancerApercu();else M.arreterApercu();
      };
}

      /* Orage des sorts de Blood Magic (Norman, 2026-10-15) : aperçu de chacun, dans la section de développement des Réglages. */
      /* @amorce S:window.__apercuOrageSortIdleV1__=function(id){ const O=window.__SOREAL_I */
function __amorcer_1105(){
window.__apercuOrageSortIdleV1__=function(id){
        const O=window.__SOREAL_IDLE_ORAGE_V1__;
        if(O&&typeof O.sort==='function')O.sort(String(id||''));
      };
}

      /* @amorce S:window.__basculerEffetIdleV1__=function(id,coche){ const e=EFFETS_VISUEL */
function __amorcer_1112(){
window.__basculerEffetIdleV1__=function(id,coche){
        const e=REG.EFFETS_VISUELS_IDLE_V1.find(function(x){return x.id===id;});
        if(!e)return;
        try{localStorage.setItem(e.cle,coche?'1':'0');}catch(_e){}
        try{window.dispatchEvent(new Event('soreal-effets-v1'));}catch(_e){}
      };
}

      /* @amorce S:window.__toggleInfoOuvertIdleV1__=toggleInfoOuvertIdleV1_; /* * Pr */
function __amorcer_1119(){
window.__toggleInfoOuvertIdleV1__=toggleInfoOuvertIdleV1_;
}

      /* @amorce S:window.__enregistrerPseudoIdleV1__=enregistrerPseudoIdleV1_; function dec */
function __amorcer_1122(){
window.__enregistrerPseudoIdleV1__=enregistrerPseudoIdleV1_;
}

      /* @amorce S:window.__deconnexionGoogleIdleV1__=deconnexionGoogleIdleV1_; /* Accès pub */
function __amorcer_1124(){
window.__deconnexionGoogleIdleV1__=deconnexionGoogleIdleV1_;
}

      /* @amorce S:window.__basculerAccesPublicIdleV1__=basculerAccesPublicIdleV1_; function */
function __amorcer_1126(){
window.__basculerAccesPublicIdleV1__=basculerAccesPublicIdleV1_;
}

      /* @amorce S:window.__chargerJoueursGoogleIdleV1__=chargerJoueursGoogleIdleV1_; /*  */
function __amorcer_1128(){
window.__chargerJoueursGoogleIdleV1__=chargerJoueursGoogleIdleV1_;
}

      /* @amorce S:window.__basculerClassementVisibleIdleV1__=basculerClassementVisibleIdleV1_;  */
function __amorcer_1130(){
window.__basculerClassementVisibleIdleV1__=basculerClassementVisibleIdleV1_;
}

      /* @amorce S:window.__basculerAccesOuvertIdleV1__=basculerAccesOuvertIdleV1_; function */
function __amorcer_1133(){
window.__basculerAccesOuvertIdleV1__=basculerAccesOuvertIdleV1_;
}

      /* @amorce S:window.__jouerSonMenuIdleV1__=jouerSonMenuIdleV1_; /* * Bouton Av */
function __amorcer_1136(){
window.__jouerSonMenuIdleV1__=jouerSonMenuIdleV1_;
}

      /* @amorce S:fermerPanneauxInfoIdleV1_(); function menuIdleCoeurV28_(menu){ /*  */
function __amorcer_1143(){
fermerPanneauxInfoIdleV1_();
}

      /*
       * Ce que fait le joueur, pour le chat SOREAL IDLE (modules/chat-v1.js) : zone d'Aventure farmée en combat automatique, boss combattu,
       * et ce que CE joueur a déjà découvert (zones connues, boss le plus haut) -- le chat n'affiche le nom d'une zone ou le numéro d'un
       * boss d'un AUTRE joueur que si le lecteur les connaît (anti-spoil, AGENTS.md règle n°2).
       */
      /* @amorce S:window.__SOREAL_IDLE_ACTIVITE_V1__=function(){ const j=idleEtat;  */
function __amorcer_1145(){
window.__SOREAL_IDLE_ACTIVITE_V1__=function(){
        const j=REG.idleEtat;
        if(!j)return null;
        const a=aventureMetaIdleV47_(j);
        const zones=(a&&Array.isArray(a.zones)?a.zones:[])
          .filter(function(z){return z&&idleEntier_(z.id)>0;})
          .map(function(z){return {id:idleEntier_(z.id),nom:String(z.name||'')};});
        let farm=null;
        if(REG.idleAutoAventureV30){
          const z=zones.find(function(x){return x.id===idleEntier_(REG.idleAutoZoneV30);});
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
        return {farm:farm,boss:j.combatBossActif?idleEntier_(j.bossSelection):0,menu:String(REG.idleMenuActifV28||''),zones:zones,bossMax:idleEntier_(records&&records.highestBoss),connus:connus,achatsNoms:achatsNoms};
      };
}

      /* @amorce S:window.__menuIdleV28__= menuIdleV28_; let idleDerniereImageBossV */
function __amorcer_1146(){
window.__menuIdleV28__=
        menuIdleV28_;
}

      /* @amorce S:window.__fermerResumeHorsLigneIdleV64__=fermerResumeHorsLigneIdleV64_; fu */
function __amorcer_1166(){
window.__fermerResumeHorsLigneIdleV64__=fermerResumeHorsLigneIdleV64_;
}

      /* @amorce S:if(typeof document.addEventListener==='function'){ document.addEventList */
function __amorcer_1174(){
if(typeof document.addEventListener==='function'){
        document.addEventListener('scroll',function(e){
          const t=e.target;
          if(t&&t.classList&&t.classList.contains('soreal-idle-nav-v28'))REG.idleNavDefilementMsV1=Date.now();
        },true);
        document.addEventListener('touchstart',function(e){
          if(e.target&&e.target.closest&&e.target.closest('.soreal-idle-nav-v28')){REG.idleNavDoigtV1=true;REG.idleNavDefilementMsV1=Date.now();}
        },{passive:true,capture:true});
        ['touchend','touchcancel'].forEach(function(type){
          document.addEventListener(type,function(){if(REG.idleNavDoigtV1){REG.idleNavDoigtV1=false;REG.idleNavDefilementMsV1=Date.now();}},{passive:true,capture:true});
        });
      }
}

      /* @amorce S:window.__ouvrirSorealIdleAvecEtatV108__= ouvrirSorealIdleAvecEtatV108_;  */
function __amorcer_1181(){
window.__ouvrirSorealIdleAvecEtatV108__=
        ouvrirSorealIdleAvecEtatV108_;
}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-344 */
      /* @amorce S:window.__ouvrirSorealIdleModuleV26__= function(){ idleAutorise */
function __amorcer_1183(){
window.__ouvrirSorealIdleModuleV26__=
        function(){
          REG.idleAutorise=true;

          afficherBoutonIdle_(
            true
          );

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-345 */
          chargerSorealIdleNatifV4_();
        };
}

      /* @amorce S:window.__ouvrirSorealIdleModuleV1__= window.__ouvrirSorealIdleModuleV26_ */
function __amorcer_1184(){
window.__ouvrirSorealIdleModuleV1__=
        window.__ouvrirSorealIdleModuleV26__;
}

      /* @amorce S:if(ouvrirPageSorealOriginalV4){ window.ouvrirPage=function(p,b,restaurat */
function __amorcer_1186(){
if(REG.ouvrirPageSorealOriginalV4){
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

          return REG.ouvrirPageSorealOriginalV4.apply(
            this,
            arguments
          );
        };
      }
}

      /* @amorce S:window.__equiperObjetIdleV10__= equiperObjetIdleV10_; window.__ac */
function __amorcer_1187(){
window.__equiperObjetIdleV10__=
        equiperObjetIdleV10_;
}

      /* @amorce S:window.__acheterAmeliorationIdleV12__= acheterAmeliorationIdleV12_; #2 */
function __amorcer_1188(){
window.__acheterAmeliorationIdleV12__=
        acheterAmeliorationIdleV12_;
}

  Object.assign(REG,{
    __amorcer_2:__amorcer_2,
    __amorcer_3:__amorcer_3,
    __amorcer_10:__amorcer_10,
    __amorcer_15:__amorcer_15,
    __amorcer_17:__amorcer_17,
    __amorcer_38:__amorcer_38,
    __amorcer_39:__amorcer_39,
    __amorcer_40:__amorcer_40,
    __amorcer_41:__amorcer_41,
    __amorcer_42:__amorcer_42,
    __amorcer_43:__amorcer_43,
    __amorcer_45:__amorcer_45,
    __amorcer_48:__amorcer_48,
    __amorcer_49:__amorcer_49,
    __amorcer_50:__amorcer_50,
    __amorcer_52:__amorcer_52,
    __amorcer_53:__amorcer_53,
    __amorcer_54:__amorcer_54,
    __amorcer_57:__amorcer_57,
    __amorcer_67:__amorcer_67,
    __amorcer_85:__amorcer_85,
    __amorcer_92:__amorcer_92,
    __amorcer_93:__amorcer_93,
    __amorcer_94:__amorcer_94,
    __amorcer_95:__amorcer_95,
    __amorcer_102:__amorcer_102,
    __amorcer_133:__amorcer_133,
    __amorcer_134:__amorcer_134,
    __amorcer_138:__amorcer_138,
    __amorcer_139:__amorcer_139,
    __amorcer_140:__amorcer_140,
    __amorcer_178:__amorcer_178,
    __amorcer_186:__amorcer_186,
    __amorcer_193:__amorcer_193,
    __amorcer_197:__amorcer_197,
    __amorcer_223:__amorcer_223,
    __amorcer_225:__amorcer_225,
    __amorcer_263:__amorcer_263,
    __amorcer_273:__amorcer_273,
    __amorcer_280:__amorcer_280,
    __amorcer_296:__amorcer_296,
    __amorcer_306:__amorcer_306,
    __amorcer_307:__amorcer_307,
    __amorcer_308:__amorcer_308,
    __amorcer_317:__amorcer_317,
    __amorcer_322:__amorcer_322,
    __amorcer_323:__amorcer_323,
    __amorcer_324:__amorcer_324,
    __amorcer_350:__amorcer_350,
    __amorcer_351:__amorcer_351,
    __amorcer_352:__amorcer_352,
    __amorcer_356:__amorcer_356,
    __amorcer_357:__amorcer_357,
    __amorcer_367:__amorcer_367,
    __amorcer_392:__amorcer_392,
    __amorcer_393:__amorcer_393,
    __amorcer_395:__amorcer_395,
    __amorcer_396:__amorcer_396,
    __amorcer_399:__amorcer_399,
    __amorcer_402:__amorcer_402,
    __amorcer_413:__amorcer_413,
    __amorcer_414:__amorcer_414,
    __amorcer_418:__amorcer_418,
    __amorcer_419:__amorcer_419,
    __amorcer_422:__amorcer_422,
    __amorcer_425:__amorcer_425,
    __amorcer_433:__amorcer_433,
    __amorcer_438:__amorcer_438,
    __amorcer_445:__amorcer_445,
    __amorcer_474:__amorcer_474,
    __amorcer_481:__amorcer_481,
    __amorcer_483:__amorcer_483,
    __amorcer_498:__amorcer_498,
    __amorcer_499:__amorcer_499,
    __amorcer_544:__amorcer_544,
    __amorcer_562:__amorcer_562,
    __amorcer_563:__amorcer_563,
    __amorcer_579:__amorcer_579,
    __amorcer_580:__amorcer_580,
    __amorcer_581:__amorcer_581,
    __amorcer_587:__amorcer_587,
    __amorcer_597:__amorcer_597,
    __amorcer_598:__amorcer_598,
    __amorcer_602:__amorcer_602,
    __amorcer_606:__amorcer_606,
    __amorcer_622:__amorcer_622,
    __amorcer_627:__amorcer_627,
    __amorcer_630:__amorcer_630,
    __amorcer_633:__amorcer_633,
    __amorcer_634:__amorcer_634,
    __amorcer_635:__amorcer_635,
    __amorcer_637:__amorcer_637,
    __amorcer_658:__amorcer_658,
    __amorcer_705:__amorcer_705,
    __amorcer_706:__amorcer_706,
    __amorcer_739:__amorcer_739,
    __amorcer_762:__amorcer_762,
    __amorcer_768:__amorcer_768,
    __amorcer_769:__amorcer_769,
    __amorcer_770:__amorcer_770,
    __amorcer_771:__amorcer_771,
    __amorcer_772:__amorcer_772,
    __amorcer_773:__amorcer_773,
    __amorcer_774:__amorcer_774,
    __amorcer_776:__amorcer_776,
    __amorcer_777:__amorcer_777,
    __amorcer_805:__amorcer_805,
    __amorcer_811:__amorcer_811,
    __amorcer_813:__amorcer_813,
    __amorcer_815:__amorcer_815,
    __amorcer_818:__amorcer_818,
    __amorcer_821:__amorcer_821,
    __amorcer_829:__amorcer_829,
    __amorcer_830:__amorcer_830,
    __amorcer_831:__amorcer_831,
    __amorcer_832:__amorcer_832,
    __amorcer_833:__amorcer_833,
    __amorcer_834:__amorcer_834,
    __amorcer_835:__amorcer_835,
    __amorcer_836:__amorcer_836,
    __amorcer_840:__amorcer_840,
    __amorcer_867:__amorcer_867,
    __amorcer_872:__amorcer_872,
    __amorcer_919:__amorcer_919,
    __amorcer_931:__amorcer_931,
    __amorcer_932:__amorcer_932,
    __amorcer_933:__amorcer_933,
    __amorcer_944:__amorcer_944,
    __amorcer_954:__amorcer_954,
    __amorcer_961:__amorcer_961,
    __amorcer_962:__amorcer_962,
    __amorcer_963:__amorcer_963,
    __amorcer_975:__amorcer_975,
    __amorcer_979:__amorcer_979,
    __amorcer_992:__amorcer_992,
    __amorcer_993:__amorcer_993,
    __amorcer_994:__amorcer_994,
    __amorcer_996:__amorcer_996,
    __amorcer_998:__amorcer_998,
    __amorcer_999:__amorcer_999,
    __amorcer_1000:__amorcer_1000,
    __amorcer_1010:__amorcer_1010,
    __amorcer_1016:__amorcer_1016,
    __amorcer_1017:__amorcer_1017,
    __amorcer_1023:__amorcer_1023,
    __amorcer_1029:__amorcer_1029,
    __amorcer_1031:__amorcer_1031,
    __amorcer_1033:__amorcer_1033,
    __amorcer_1035:__amorcer_1035,
    __amorcer_1039:__amorcer_1039,
    __amorcer_1046:__amorcer_1046,
    __amorcer_1052:__amorcer_1052,
    __amorcer_1054:__amorcer_1054,
    __amorcer_1064:__amorcer_1064,
    __amorcer_1065:__amorcer_1065,
    __amorcer_1082:__amorcer_1082,
    __amorcer_1083:__amorcer_1083,
    __amorcer_1084:__amorcer_1084,
    __amorcer_1092:__amorcer_1092,
    __amorcer_1094:__amorcer_1094,
    __amorcer_1095:__amorcer_1095,
    __amorcer_1096:__amorcer_1096,
    __amorcer_1097:__amorcer_1097,
    __amorcer_1099:__amorcer_1099,
    __amorcer_1102:__amorcer_1102,
    __amorcer_1103:__amorcer_1103,
    __amorcer_1104:__amorcer_1104,
    __amorcer_1105:__amorcer_1105,
    __amorcer_1112:__amorcer_1112,
    __amorcer_1119:__amorcer_1119,
    __amorcer_1122:__amorcer_1122,
    __amorcer_1124:__amorcer_1124,
    __amorcer_1126:__amorcer_1126,
    __amorcer_1128:__amorcer_1128,
    __amorcer_1130:__amorcer_1130,
    __amorcer_1133:__amorcer_1133,
    __amorcer_1136:__amorcer_1136,
    __amorcer_1143:__amorcer_1143,
    __amorcer_1145:__amorcer_1145,
    __amorcer_1146:__amorcer_1146,
    __amorcer_1166:__amorcer_1166,
    __amorcer_1174:__amorcer_1174,
    __amorcer_1181:__amorcer_1181,
    __amorcer_1183:__amorcer_1183,
    __amorcer_1184:__amorcer_1184,
    __amorcer_1186:__amorcer_1186,
    __amorcer_1187:__amorcer_1187,
    __amorcer_1188:__amorcer_1188
  });
})();
