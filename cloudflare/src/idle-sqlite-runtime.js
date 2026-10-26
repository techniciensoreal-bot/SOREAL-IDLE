import { sqlRows, safeJson, jsonText } from "./core/sqlite-core.js";
import { span, spansActiver, spansPrelever } from "./idle-spans-v1.js";
import {
  idleDevSlotForUserV1,
  idleDevUserForSlotV1,
  idleDevAliasEmailV1,
  idleDevSlotsAvailableV1,
  idleDevNormalizeSlotV1
} from "./idle-dev-save-slots-v1.js";
import {
  BASIC_TRAINING_V411,
  createBasicTrainingStateV411,
  normalizeBasicTrainingStateV411,
  advanceBasicTrainingStateV411,
  rebirthBasicTrainingStateV411,
  nextBasicTrainingCapV411,
  totalBasicTrainingAllocationV411,
  isBasicTrainingSkillUnlockedV411,
  deriveBasicTrainingStatsV411,
  applyBasicTrainingAllocationsV411,
  basicTrainingSnapshotV411
} from "./idle-basic-training.js";
import {
  IDLE_NGU_META_VERSION,
  normalizeIdleNguState,
  syncIdleNguState,
  idleNguBonuses,
  idleNguMemoNouvelleRequeteV1,
  IDLE_NGU_EXP_SHOP_V1,
  idleNguEffectiveResourceStat,
  idleNguSnapshot,
  idleNguResourceBudget,
  idleNguResourceGenerationPerSecond,
  applyIdleNguAction,
  rebirthIdleNguState,
  REBIRTH_UNLOCK_BOSS_V1
} from "./idle-ngu-progression.js";
import { histoireBossFrAligneeV1 } from "./idle-traductions-v1.js";
import { nguBossStatsV1, nguBossFtbeBonusXpV1 } from "./idle-ngu-boss-reference-v1.js";
import { IDLE_SELLOUT_SHOP_CATALOG_V1 } from "./idle-sellout-shop-v1.js";
import { lireHistoiresV1, enregistrerHistoireV1, supprimerHistoireV1, histoireDuBossV1 } from "./idle-histoires-v1.js";
import { lireGuidesV1, enregistrerGuideV1, supprimerGuideV1, guidesPourJoueurV1, ancienTutorielActifV1, reglerAncienTutorielV1, ancienMenusActifV1, reglerAncienMenusV1 } from "./idle-tutoriel-v1.js";
import { lireTextesV1, enregistrerTexteV1, supprimerTexteV1, texteBossSurchargeV1, nomBossSurchargeV1, texteBossParleV1, nomBossParleV1, invaliderCacheTextesBossV1, surchargesPourJoueurV1 } from "./idle-textes-v1.js";
import { instantaneJoueurV1, enregistrerJalonsV1, enregistrerConnexionFluxV1, lireFluxV1, dernierIdFluxV1 } from "./idle-flux-v1.js";
import { enregistrerGainExpV1, lireGainsExpV1, creditDejaFaitV1 } from "./idle-gains-v1.js";
import { battementV1, normaliserActiviteV1, lireChatV1, envoyerChatV1, supprimerMessageChatV1, dernierIdChatV1 } from "./idle-chat-v1.js";
import {
  definirPseudoProfilIdleV1, libelleJoueurIdleV1, listerJoueursExternesIdleV1, lireProfilIdleV1, nomJeuJoueurIdleV1, noterPassageProfilIdleV1, profilsParEmailIdleV1
} from "./idle-profile-v1.js";
import NGU_BOSS_NAMES_FR_V1_SOURCE from "../../design/ngu-boss-names-fr.json" with { type: "json" };
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_MOB_CATALOG_V1,
  IDLE_ADVENTURE_MOB_BESTIARY_V1,
  normalizeIdleAdventureStateV47,
  idleAdventureMobBestiaryEntryV1,
  annulerVictoireTitanV1
} from "./idle-adventure-v47.js";
import { __idleBuildWorkbook, __idleCanonicalSheetNameV1, __idleCommit, __idleRepairCatalogSheetNamesV1, __idleRestoreCatalogFromLegacyV2, __idleVerrouPerimeV1_ } from "./idle-runtime-classeur.js";
import { assurerDonneesJeuSorealIdle_, emailsAutorisesSorealIdle_, exigerAccesSorealIdle_, obtenirAccesSorealIdle, obtenirFeuilleJoueursSorealIdle_, trouverLigneJoueurSorealIdle_ } from "./idle-runtime-acces.js";
import { ADMIN_SOREAL_IDLE_EMAIL, cleJoueurSorealIdle_, demarrerPartieSorealIdle, definirAccesOuvertSorealIdle, definirAccesPublicSorealIdle, definirOrdreMenusSorealIdle, definirPartieDevSorealIdle, definirPseudoSorealIdle, estAdminSorealIdle, identiteJoueurSorealIdle_, listerJoueursExternesSorealIdle, obtenirClassementSorealIdle, obtenirMesRangsSorealIdle, obtenirIdentiteSorealIdle, obtenirPartieDevSorealIdle, reinitialiserCompteCompletSorealIdle, selectionnerBossSorealIdle } from "./idle-runtime-joueurs.js";
import { CONFIG_SOREAL_IDLE, dateSorealIdle_, nombreSorealIdle_ } from "./idle-runtime-config.js";
import { statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { annulerVictoireTitanAdminSorealIdle, copierPartieASurBSorealIdle, crediterExpAdminSorealIdle, retirerRecordCombatLongAdminSorealIdle, enregistrerHistoireAdminSorealIdle, enregistrerTexteAdminSorealIdle, enregistrerTutorielAdminSorealIdle, lireBugsSorealIdle, lireGainsExpAdminSorealIdle, listerHistoiresAdminSorealIdle, listerTextesAdminSorealIdle, listerTutorielAdminSorealIdle, obtenirHistoireBossSorealIdle, obtenirIntroSorealIdle, obtenirTextesSurchargesSorealIdle, obtenirTutorielSorealIdle, preparerPartieTestSorealIdle, reglerAncienTutorielAdminSorealIdle, signalerBugSorealIdle, supprimerBugSorealIdle, supprimerHistoireAdminSorealIdle, supprimerTexteAdminSorealIdle, supprimerTutorielAdminSorealIdle } from "./idle-runtime-admin.js";
import { acheterAmeliorationSorealIdle, acheterAmeliorationsSorealIdle, acheterEntrainementSorealIdle, acheterEntrainementsSorealIdle, acheterSortSorealIdle, acheterSortsSorealIdle, agirProgressionSorealIdle, agrandirInventairePlusieursSorealIdle, agrandirInventaireSorealIdle, ameliorerEquipementForgeSorealIdle, ameliorerEquipementsForgeSorealIdle, combattreAventureSorealIdle, definirAllocationsEntrainementSorealIdle, definirCombatAutoAventureSorealIdle, equiperObjetsSorealIdle, fusionnerObjetSorealIdle, fusionnerObjetsSorealIdle, lancerSortSorealIdle, obtenirEtatBoutiqueSorealIdle, obtenirEtatSorealIdle, recyclerObjetSorealIdle, recyclerObjetsSorealIdle, renaitreSorealIdle, sauvegarderDispositionInventaireSorealIdle, synchroniserSorealIdle, testerAccesSorealIdle } from "./idle-runtime-actions.js";
import { definirAutoBossSuivantSorealIdle, definirClassementVisibleSorealIdle, definirCombatBossSorealIdle, enregistrerClicsSorealIdle, marquerVusSorealIdle, nukerBossSorealIdle } from "./idle-runtime-combat.js";
import { attaqueBossSorealIdle_, defenseBossSorealIdle_, definitionBossSorealIdle_, degatsRecusSecondeSorealIdle_, enregistrerBossJamaisVaincuSorealIdle_, equilibrerBossPrincipalSorealIdleV413_, highestBossJamaisAtteintSorealIdle_, pvMaxBossSorealIdle_, statsCombatPrincipalSorealIdleV413_, xpBonusPremiereFoisSorealIdle_, xpBossSorealIdle_ } from "./idle-runtime-boss.js";
import { calculerTicksEnergieSorealIdle_, contexteMetaNguSorealIdle_, creerSimulateurEnergieHorsLigneSorealIdle_, metaTickEnergieSorealIdle_, regenPvAvecMultiplicateursSorealIdle_, regenPvIntegreeBasicTrainingSorealIdleV176_ } from "./idle-runtime-progression.js";

/* SOREAL IDLE — runtime Cloudflare SQLite steady-state. */

/*
 * Audit 2026-09-17 (risque cross-repo SOREAL-IDLE / SOREAL-APP, aucun
 * contrat de version partagé entre les deux dépôts — voir AGENTS.md
 * section "Relation avec SOREAL-APP / SOREAL-TV") : ce nombre entier
 * décrit la compatibilité du CONTRAT client/serveur (noms d'opérations,
 * forme des réponses, arguments attendus), PAS le build en cours
 * d'exécution — ça, c'est déjà couvert par `bridgeAssetVersion`/
 * `IDLE_TEST_VERSION` côté SOREAL-APP (badge visuel ajouté le même jour,
 * un identifiant différent pour un besoin différent : "quel code exact
 * tourne" vs. "le client comprend-il encore l'API").
 *
 * `IDLE_CLIENT_PROTOCOL_VERSION` (Soreal_Idle_UI.html, SOREAL-APP) doit
 * toujours être égal à cette constante. Exposée au client dans la
 * réponse de `obtenirAccesSorealIdle` (premier appel fait à l'ouverture
 * du module IDLE) sous `protocolVersion`. Le client compare et, en cas
 * de désaccord, affiche un message calme invitant à recharger la page
 * (pas de crash, pas de comportement silencieusement cassé) plutôt que
 * de continuer avec des hypothèses de forme de réponse potentiellement
 * fausses.
 *
 * À incrémenter UNIQUEMENT pour un changement cassant du contrat, par
 * exemple :
 *   - un champ de réponse exposé au client est renommé ou retiré ;
 *   - la forme d'une réponse change (ex. un champ change de type, une
 *     structure imbriquée est aplatie/réorganisée) ;
 *   - les arguments attendus par une opération existante changent
 *     (ordre, nombre, type) ;
 *   - un nom d'opération appelé par le client est renommé/supprimé.
 *
 * NE PAS incrémenter pour :
 *   - l'ajout d'un nouveau champ optionnel à une réponse existante
 *     (additif, non cassant — c'est le cas de `protocolVersion`
 *     lui-même dans ce commit : la valeur reste à 1) ;
 *   - l'ajout d'une nouvelle opération dans IDLE_OPERATIONS ;
 *   - un refactor interne qui ne change aucune forme observable côté
 *     client (renommage de fonction privée, réorganisation de fichier,
 *     optimisation de calcul...).
 *
 * Bumper la valeur ici ET dans SOREAL-APP (`IDLE_CLIENT_PROTOCOL_VERSION`
 * dans Soreal_Idle_UI.html) dans le même effort de travail que le
 * changement cassant lui-même — jamais après coup.
 */
export const IDLE_PROTOCOL_VERSION=1;

export const NGU_BOSS_NAMES_FR_V1 = new Map(
  NGU_BOSS_NAMES_FR_V1_SOURCE.map((entry) => [
    Number(entry.id),
    String(entry.nomFr || entry.nomEn || "Boss"),
  ])
);

/* État partagé du module (variables « let » d'origine), converti en objet pour que les fichiers du découpage puissent le lire ET l'écrire. */
export const __idleCtx = {
  __idleRuntimeUser: null,
  __idleWorkbook: null,
  __idleSql: null,
  __idleAccesOuvert: false,
  __idleAccesPublic: false,
  __idleOperationNomV1: "",
  __idleReferenceGainV1: "",
  __idleScriptLockHeldV1: false,
  __idleScriptLockDepuisV1: 0,
  cacheMonstresAventureSorealIdleGameV409_: null,
  __SOREAL_IDLE_TABLE_MEMO_V19__: {},
  __SOREAL_IDLE_PARAMS_MEMO_V19__: null,
  __SOREAL_IDLE_PARAMS_MEMO_TS_V19__: 0,
  __SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__: {},
  __SOREAL_IDLE_MEMO_MS_V19__: 5 * 60 * 1000,
  __SOREAL_IDLE_CACHE_SEC_V19__: 300,
  __bossCatalogueMemoV1: { source: null, valeur: null },
  __idleLegacyRepairDoneV1: false
};
function __idleLireAccesOuvert(sql){
  try{
    const ligne=sqlRows(sql.exec("SELECT meta_value FROM idle_meta WHERE meta_key='acces_ouvert'"))[0];
    return String(ligne&&ligne.meta_value)==="1";
  }catch(_){
    return false;
  }
}
export function accesOuvertSorealIdle_(){return __idleCtx.__idleAccesOuvert===true;}
function __idleLireAccesPublic(sql){
  try{
    const ligne=sqlRows(sql.exec("SELECT meta_value FROM idle_meta WHERE meta_key='acces_public'"))[0];
    return String(ligne&&ligne.meta_value)==="1";
  }catch(_){
    return false;
  }
}
export function accesPublicSorealIdle_(){return __idleCtx.__idleAccesPublic===true;}
const __idleCacheStore=new Map();

export function __idleKey(v){
  return String(v==null?"":v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9@._+-]+/g," ")
    .replace(/\s+/g," ").trim();
}
export function __idleNonEmpty(v){return !(v===""||v==null);}















export const SpreadsheetApp={
  openById(){
    if(!__idleCtx.__idleWorkbook)throw new Error("SOREAL_IDLE_WORKBOOK_NOT_READY");
    return __idleCtx.__idleWorkbook;
  },
  flush(){}
};
export const LockService={
  getScriptLock(){
    return {
      tryLock(){
        __idleVerrouPerimeV1_();
        if(__idleCtx.__idleScriptLockHeldV1)return false;
        __idleCtx.__idleScriptLockHeldV1=true;
        __idleCtx.__idleScriptLockDepuisV1=Date.now();
        return true;
      },
      waitLock(){
        __idleVerrouPerimeV1_();
        if(__idleCtx.__idleScriptLockHeldV1)throw new Error("SOREAL_IDLE_LOCK_TIMEOUT");
        __idleCtx.__idleScriptLockHeldV1=true;
        __idleCtx.__idleScriptLockDepuisV1=Date.now();
        return true;
      },
      releaseLock(){
        __idleCtx.__idleScriptLockHeldV1=false;
      }
    };
  }
};
export const CacheService={
  getScriptCache(){
    return {
      get(k){
        const key=String(k),x=__idleCacheStore.get(key);
        if(!x)return null;
        if(x.exp&&x.exp<Date.now()){__idleCacheStore.delete(key);return null;}
        return x.value;
      },
      put(k,v,sec){
        __idleCacheStore.set(String(k),{
          value:String(v),
          exp:Date.now()+Math.max(1,Number(sec)||60)*1000
        });
      },
      remove(k){__idleCacheStore.delete(String(k));},
      removeAll(keys){for(const k of keys||[])__idleCacheStore.delete(String(k));}
    };
  }
};


/**
 * ============================================================
 * SOREAL IDLE — MOTEUR SERVEUR V40.9
 * Fichier : Soreal_Idle_Game.gs
 * ============================================================
 *
 * - accès privé Norman + Sébastien HODDAP uniquement
 * - identité basée sur la session SOREAL existante
 * - lecture/écriture dans le Google Sheet "Soreal IDLE"
 * - énergie calculée côté serveur
 * - progression hors ligne
 * - synchronisation sûre avec LockService
 *
 * Spreadsheet :
 * 19NkoPRWj6UHruOKKuyqwnH9l8tQCuJO_ZcvbXscar0E
 * ============================================================
 */



/**
 * ============================================================
 * OUTILS
 * ============================================================
 */










































/**
 * ============================================================
 * ACCÈS PRIVÉ
 * ============================================================
 */











/**
 * ============================================================
 * IDENTITÉ JOUEUR
 * ============================================================
 */





/**
 * ============================================================
 * ÉNERGIE
 * ============================================================
 */





























/* ============================================================
   BASIC TRAINING / MODÈLE DE JEU V41
   ============================================================ */























































































/*
 * Audit 2026-09-17 (grand nettoyage) : simulerCoupsAventureSorealIdleV43_
 * (timeline de coups V43 pour l'ancien combat Adventure du moteur
 * legacy) n'avait plus aucun appelant — combattreAventureSorealIdle,
 * son seul consommateur, est désactivée depuis le passage au moteur
 * NGU V47 (SOREAL_IDLE_V47_LEGACY_DISABLED). Supprimée.
 */



















































/**
 * ============================================================
 * ÉTAT JOUEUR
 * ============================================================
 */




/**
 * ============================================================
 * ÉCONOMIE / PROGRESSION V6
 * ============================================================
 */







/**
 * ============================================================
 * ENTRAÎNEMENTS
 * ============================================================
 */






/**
 * ============================================================
 * API DU JEU
 * ============================================================
 */













































/*
 * Audit 2026-09-17 (grand nettoyage) : obtenirImageReposSorealIdle,
 * obtenirImageJoueurSorealIdle et obtenirImageBossSorealIdle (RPC) ont
 * été retirées -- le client (SOREAL-APP) ne les appelle plus depuis le
 * 2026-09-13/14 (bascule vers des routes R2 dédiées, /api/idle/media/*,
 * gérées entièrement côté APP). Leurs seuls appelants,
 * imageReposParNumeroSorealIdle_/imageJoueurParNumeroSorealIdle_/
 * imageBossParNomSorealIdle_ (backées par DriveApp, toujours vide dans
 * cet environnement Cloudflare Workers -- jamais fonctionnelles),
 * supprimées avec elles. Zéro autre référence dans le dépôt, vérifié.
 */



















/**
 * ============================================================
 * ACTIONS RAPIDES / BATCH V60
 * ============================================================
 *
 * Ces endpoints sont pensés pour une UI de jeu idle :
 * - plusieurs clics peuvent être accumulés côté navigateur ;
 * - un seul verrou + une seule lecture/écriture pour tout le lot ;
 * - réponse minimale : le client garde son état optimiste et resynchronise
 *   seulement lorsque toutes les actions en attente sont envoyées.
 */




















/**
 * ============================================================
 * TEST
 * ============================================================
 */















/**
 * ============================================================
 * BOUTIQUE PERMANENTE
 * ============================================================
 */




/**
 * ============================================================
 * MAGIE / MANA
 * ============================================================
 */







/**
 * ============================================================
 * RENAISSANCE
 * ============================================================
 */















/**
 * ============================================================
 * MODE AVENTURE SOREAL
 * ============================================================
 */




/*
 * Audit 2026-09-17 : selectionnerZoneAventureSorealIdle (stub mort
 * renvoyant SOREAL_IDLE_V47_LEGACY_DISABLED, jamais un mécanisme réel)
 * retiré entièrement plutôt que laissé en stub. Vérifié avant suppression
 * qu'aucun consommateur réel ne subsistait : le seul appelant client
 * (runner.selectionnerZoneAventureSorealIdle, google.script.run) avait
 * déjà été retiré de Soreal_Idle_UI.html le 2026-09-16 (cf.
 * idle-collection-menu-and-dead-zone-case.test.mjs côté SOREAL-APP) — la
 * vraie sélection de zone Aventure passe depuis par
 * __selectionnerZoneAdventureIdleV47__ (idle-adventure-v47.js). Seule
 * référence restante trouvée : cloudflare/public/cloudflare-bridge.js
 * (SOREAL-APP) expose encore un passe-plat générique portant ce nom, mais
 * ce fichier mirrore SYMÉTRIQUEMENT chaque nom d'opération connu (y
 * compris d'autres mécaniques déjà mortes comme equiperObjetsSorealIdle)
 * sans jamais l'appeler lui-même — un appel réel via ce passe-plat
 * échouerait désormais avec SOREAL_IDLE_OPERATION_INCONNUE au lieu de
 * SOREAL_IDLE_V47_LEGACY_DISABLED, un changement de message sans risque
 * puisqu'aucun code n'invoque ce passe-plat.
 */




/**
 * ============================================================
 * SOREAL IDLE — DATA ACCESS V19
 * Fichier Apps Script : Soreal_Idle_Data.gs
 * Source GitHub : Soreal_Idle_Data.js
 * ============================================================
 *
 * V19 :
 * - lecture en bloc + cache Google Sheets conservée ;
 * - cache mémoire court ajouté pour éviter plusieurs JSON.parse /
 *   CacheService.get de la même table dans une seule exécution ;
 * - CONFIG préparé une seule fois puis réutilisé ;
 * - paramètres constants sortis des boucles de zones ;
 * - cache d'index des images d'aventure correctement invalidé ;
 * - recherche de boss par nom mémorisée brièvement ;
 * - API publique/interne existante conservée.
 * ============================================================
 */


/* ============================================================
   MÉMOIRES COURTES
   ============================================================ */











/* ============================================================
   TABLES GOOGLE SHEETS
   ============================================================ */



/* ============================================================
   CONFIG
   ============================================================ */







/* ============================================================
   BOSS
   ============================================================ */






/* ============================================================
   AVENTURE / ZONES
   ============================================================ */





/* ============================================================
   SORTS
   ============================================================ */



/* ============================================================
   RARETÉS / LOOTS / SETS / COLLECTIONS
   ============================================================ */









/* ============================================================
   REPOS / APPARENCES
   ============================================================ */





/*
 * Audit 2026-09-17 (grand nettoyage) : imageDriveParIdSorealIdle_,
 * imageFichierDriveSorealIdle_, imageReposParNumeroSorealIdle_ et
 * imageJoueurParNumeroSorealIdle_ (bloc "IMAGES DRIVE") n'avaient plus
 * qu'un seul appelant chacun, en cascade jusqu'aux RPC obtenirImage*
 * déjà retirées plus haut -- toutes backées par DriveApp, jamais
 * fonctionnel dans cet environnement Cloudflare Workers. Supprimées.
 */


/* ============================================================
   BOUTIQUE / DÉBLOCAGES
   ============================================================ */





























/*
 * Chat et présence de SOREAL IDLE (voir idle-chat-v1.js), temps de jeu ACTIF (Norman, 2026-09-30).
 *
 * battementSorealIdle : appelé par le jeu toutes les ~20 s. Il (1) marque le joueur « en ligne sur SOREAL IDLE » avec ce qu'il fait,
 * (2) crédite le temps de jeu ACTIF -- uniquement les secondes écoulées depuis le battement précédent, et seulement si le joueur a
 * réellement interagi avec la page visible (jamais le rattrapage hors-ligne, qui faisait monter le classement sans jouer).
 */
/* Temps actif accumulé par joueur et pas encore versé dans sa ligne (voir battementSorealIdle) ; versé dès 120 s. */
const __tempsActifEnAttenteV1 = new Map();
const TEMPS_ACTIF_VERSEMENT_SEC_V1 = 120;
export function idleReinitialiserTempsActifV1() { __tempsActifEnAttenteV1.clear(); }

function battementSorealIdle(sessionToken, info) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: true, enLigne: [], dernierChatId: 0 };
  /*
   * Partie B = partie d'ESSAI (Norman, 2026-10-05 : « les joueurs ne doivent pas voir ce que tu fais »). Seule la lecture de la ligne de jeu passe par l'adresse « partie B » (trouverLigneJoueurSorealIdle_) : pour la présence et
   * « En direct », la session garde l'adresse RÉELLE du compte, donc la partie B se faisait passer pour la vraie partie (même clé : ses jalons alternaient avec ceux de la partie A et s'annonçaient à chaque battement). En partie B :
   * aucune présence, aucun jalon, aucune connexion annoncée, aucun temps de jeu crédité ; la partie B ne voit que le fil des autres.
   */
  if (idleDevSlotForUserV1(acces.user) !== 'a') {
    return {
      ok: true,
      enLigne: [],
      dernierChatId: dernierIdChatV1(__idleCtx.__idleSql),
      flux: [],
      dernierFluxId: dernierIdFluxV1(__idleCtx.__idleSql),
      maintenant: Date.now(),
      moi: identiteJoueurSorealIdle_(acces).nomAffiche,
      estAdmin: String(acces.emailAutorise || '').toLowerCase() === ADMIN_SOREAL_IDLE_EMAIL
    };
  }
  const identite = identiteJoueurSorealIdle_(acces);
  const i = info && typeof info === 'object' ? info : {};
  const resultat = battementV1(__idleCtx.__idleSql, {
    email: cleJoueurSorealIdle_(acces),
    nom: identite.nomAffiche,
    admin: String(acces.emailAutorise || '').toLowerCase() === ADMIN_SOREAL_IDLE_EMAIL,
    actif: i.actif === true,
    connecte: i.connecte === true,
    activite: i.activite
  });

  /* Fil d'actualité : jalons du joueur (boss, trophées, titans, défis, Rebirths) comparés au battement précédent. */
  let flux = [];
  try {
    const lockFlux = LockService.getScriptLock();
    if (lockFlux.tryLock(1800)) {
      try {
        const feuilleF = obtenirFeuilleJoueursSorealIdle_();
        const ligneF = trouverLigneJoueurSorealIdle_(feuilleF, acces);
        const cF = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
        const statsF = statsJoueurSorealIdle_(feuilleF.getRange(ligneF, cF.STATS_JSON).getValue());
        /* « X vient de se connecter » : avant les jalons, pour que le fil garde l'ordre réel. */
        if (resultat.connexion) {
          enregistrerConnexionFluxV1(__idleCtx.__idleSql, { email: cleJoueurSorealIdle_(acces), nom: identite.nomAffiche, visible: statsF.classementVisible !== false });
        }
        enregistrerJalonsV1(__idleCtx.__idleSql, {
          email: cleJoueurSorealIdle_(acces),
          nom: identite.nomAffiche,
          visible: statsF.classementVisible !== false,
          instantane: instantaneJoueurV1({ bossVaincus: nombreSorealIdle_(feuilleF.getRange(ligneF, cF.BOSS_VAINCUS).getValue(), 0), stats: statsF }),
          activite: normaliserActiviteV1(i.activite),
          /* Nom (anglais, celui du catalogue) d'un article acheté : sert de repli si le lecteur n'a pas le nom français dans son propre catalogue. */
          noms: {
            achat: function (boutique, id) {
              if (boutique === 'exp') return (IDLE_NGU_EXP_SHOP_V1[id] && IDLE_NGU_EXP_SHOP_V1[id].name) || '';
              const it = IDLE_SELLOUT_SHOP_CATALOG_V1.find(function (x) { return x.id === id; });
              return (it && it.name) || '';
            }
          }
        });
      } finally {
        lockFlux.releaseLock();
      }
    }
    /* Premier battement de la page (amorceFlux) : rien n'est renvoyé, on ne reçoit que ce qui arrive APRÈS (aucun message de rattrapage). */
    flux = i.amorceFlux === true
      ? []
      : lireFluxV1(__idleCtx.__idleSql, { apresId: Math.max(0, Math.floor(Number(i.apresFlux) || 0)), email: cleJoueurSorealIdle_(acces), seulementFrais: true });
  } catch (_e) { flux = []; }

  if (resultat.gain > 0) {
    /*
     * Audit du 2026-10-10 (IDLE-AUDIT-PERF-005) : chaque battement (~20 s) réécrivait la ligne ENTIÈRE du joueur (inventaire compris, 177 Ko à 450 objets, deux fois : idle_catalog et idle_players) pour ajouter quelques secondes de
     * temps actif. Les secondes sont maintenant accumulées en mémoire et versées dans la ligne au plus toutes les 2 minutes (la mémoire d'un redémarrage à froid ne perd au pire que ces 2 minutes de « temps de jeu » du classement).
     */
    const cleTemps = cleJoueurSorealIdle_(acces);
    const enAttente = (__tempsActifEnAttenteV1.get(cleTemps) || 0) + resultat.gain;
    __tempsActifEnAttenteV1.set(cleTemps, enAttente);
    if (enAttente >= TEMPS_ACTIF_VERSEMENT_SEC_V1) {
      const lock = LockService.getScriptLock();
      if (lock.tryLock(1800)) {
        try {
          const feuille = obtenirFeuilleJoueursSorealIdle_();
          const ligne = trouverLigneJoueurSorealIdle_(feuille, acces);
          assurerDonneesJeuSorealIdle_(feuille, ligne);
          const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
          const cellule = feuille.getRange(ligne, c.STATS_JSON);
          const stats = statsJoueurSorealIdle_(cellule.getValue());
          stats.tempsActifSec = stats.tempsActifSec + enAttente;
          cellule.setValue(JSON.stringify(stats));
          SpreadsheetApp.flush();
          __tempsActifEnAttenteV1.delete(cleTemps);
        } finally {
          lock.releaseLock();
        }
      }
    }
  }

  return {
    ok: true,
    enLigne: resultat.enLigne,
    dernierChatId: dernierIdChatV1(__idleCtx.__idleSql),
    flux,
    dernierFluxId: dernierIdFluxV1(__idleCtx.__idleSql),
    maintenant: Date.now(),
    moi: identite.nomAffiche,
    estAdmin: String(acces.emailAutorise || '').toLowerCase() === ADMIN_SOREAL_IDLE_EMAIL
  };
}

function lireChatSorealIdle(sessionToken, options) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: true, items: [] };
  const o = options && typeof options === 'object' ? options : {};
  /* maintenant : l'heure du serveur, pour que le client juge la fraîcheur d'un message sans dépendre de sa propre horloge. */
  return { ok: true, items: lireChatV1(__idleCtx.__idleSql, { apresId: o.apresId, limite: o.limite, email: cleJoueurSorealIdle_(acces) }), maintenant: Date.now() };
}

function envoyerChatSorealIdle(sessionToken, message) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: false, message: 'Chat indisponible.' };
  /* Partie d'essai : jamais de message publié sous le nom du compte réel. */
  if (idleDevSlotForUserV1(acces.user) !== 'a') return { ok: false, message: 'Le chat n\u2019est pas disponible dans la partie d\u2019essai.' };
  const identite = identiteJoueurSorealIdle_(acces);
  /* Le texte arrive soit seul, soit dans un objet { message } (le pont client ajoute la session au premier argument de type texte). */
  const texte = message && typeof message === 'object' ? message.message : message;
  return envoyerChatV1(__idleCtx.__idleSql, {
    email: cleJoueurSorealIdle_(acces),
    nom: identite.nomAffiche,
    admin: String(acces.emailAutorise || '').toLowerCase() === ADMIN_SOREAL_IDLE_EMAIL,
    texte
  });
}

/* Modération : l'administrateur peut retirer un message. */
function supprimerMessageChatSorealIdle(sessionToken, id) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (String(acces.emailAutorise || '').toLowerCase() !== ADMIN_SOREAL_IDLE_EMAIL) throw new Error('SOREAL_IDLE_ADMIN_REQUIS');
  if (!__idleCtx.__idleSql) return { ok: true };
  supprimerMessageChatV1(__idleCtx.__idleSql, id && typeof id === 'object' ? id.id : id);
  return { ok: true };
}

function lireFluxSorealIdle(sessionToken, options) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: true, items: [] };
  const o = options && typeof options === 'object' ? options : {};
  return { ok: true, items: lireFluxV1(__idleCtx.__idleSql, { apresId: o.apresId, limite: o.limite, email: cleJoueurSorealIdle_(acces) }), dernierFluxId: dernierIdFluxV1(__idleCtx.__idleSql) };
}

const IDLE_OPERATIONS={
  annulerVictoireTitanAdminSorealIdle,
  crediterExpAdminSorealIdle,
  retirerRecordCombatLongAdminSorealIdle,
  lireGainsExpAdminSorealIdle,
  battementSorealIdle,
  lireFluxSorealIdle,
  lireChatSorealIdle,
  envoyerChatSorealIdle,
  supprimerMessageChatSorealIdle,
  obtenirHistoireBossSorealIdle,
  obtenirIntroSorealIdle,
  listerHistoiresAdminSorealIdle,
  enregistrerHistoireAdminSorealIdle,
  supprimerHistoireAdminSorealIdle,
  obtenirTutorielSorealIdle,
  listerTutorielAdminSorealIdle,
  enregistrerTutorielAdminSorealIdle,
  supprimerTutorielAdminSorealIdle,
  reglerAncienTutorielAdminSorealIdle,
  obtenirTextesSurchargesSorealIdle,
  listerTextesAdminSorealIdle,
  enregistrerTexteAdminSorealIdle,
  supprimerTexteAdminSorealIdle,
  agirProgressionSorealIdle,
  definirAllocationsEntrainementSorealIdle,
  acheterAmeliorationSorealIdle,
  acheterAmeliorationsSorealIdle,
  acheterEntrainementSorealIdle,
  acheterEntrainementsSorealIdle,
  acheterSortSorealIdle,
  acheterSortsSorealIdle,
  agrandirInventairePlusieursSorealIdle,
  agrandirInventaireSorealIdle,
  ameliorerEquipementForgeSorealIdle,
  ameliorerEquipementsForgeSorealIdle,
  combattreAventureSorealIdle,
  definirAutoBossSuivantSorealIdle,
  definirCombatAutoAventureSorealIdle,
  definirCombatBossSorealIdle,
  estAdminSorealIdle,
  equiperObjetsSorealIdle,
  fusionnerObjetSorealIdle,
  fusionnerObjetsSorealIdle,
  lancerSortSorealIdle,
  marquerVusSorealIdle,
  definirOrdreMenusSorealIdle,
  definirAccesOuvertSorealIdle,
  definirAccesPublicSorealIdle,
  definirPseudoSorealIdle,
  listerJoueursExternesSorealIdle,
  obtenirIdentiteSorealIdle,
  obtenirClassementSorealIdle,
  obtenirMesRangsSorealIdle,
  nukerBossSorealIdle,
  obtenirAccesSorealIdle,
  obtenirEtatBoutiqueSorealIdle,
  obtenirEtatSorealIdle,
  recyclerObjetSorealIdle,
  recyclerObjetsSorealIdle,
  reinitialiserCompteCompletSorealIdle,
  demarrerPartieSorealIdle,
  renaitreSorealIdle,
  signalerBugSorealIdle,
  lireBugsSorealIdle,
  supprimerBugSorealIdle,
  sauvegarderDispositionInventaireSorealIdle,
  selectionnerBossSorealIdle,
  synchroniserSorealIdle,
  testerAccesSorealIdle,
  obtenirPartieDevSorealIdle,
  definirPartieDevSorealIdle,
  preparerPartieTestSorealIdle,
  copierPartieASurBSorealIdle,
  enregistrerClicsSorealIdle,
  definirClassementVisibleSorealIdle
};

/*
 * Vide les mémos de catalogue de l'isolat (tables 5 min, paramètres, images de boss, CacheService) : appelé par le coordinateur après un remplacement de feuilles (audit du 2026-10-10, IDLE-AUDIT-PERF-010). Avant, un isolat chaud
 * pouvait servir l'ancien contenu d'IDLE_BOSS, CONFIG… jusqu'à 5 minutes après un import.
 */
export function idleInvaliderMemosCatalogueV1(){
  for(const k of Object.keys(__idleCtx.__SOREAL_IDLE_TABLE_MEMO_V19__))delete __idleCtx.__SOREAL_IDLE_TABLE_MEMO_V19__[k];
  for(const k of Object.keys(__idleCtx.__SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__))delete __idleCtx.__SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__[k];
  __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_V19__=null;
  __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_TS_V19__=0;
  __idleCacheStore.clear();
}

export function idleOperationNames(){
  return Object.keys(IDLE_OPERATIONS);
}

export const idleRuntimeTestHooks=Object.freeze({
  statsCombatPrincipalSorealIdleV413_,
  CONFIG_SOREAL_IDLE,
  IDLE_PROTOCOL_VERSION,
  IDLE_NGU_META_VERSION,
  normalizeIdleNguState,
  syncIdleNguState,
  idleNguBonuses,
  idleNguSnapshot,
  applyIdleNguAction,
  rebirthIdleNguState,
  BASIC_TRAINING_V411,
  createBasicTrainingStateV411,
  normalizeBasicTrainingStateV411,
  advanceBasicTrainingStateV411,
  rebirthBasicTrainingStateV411,
  nextBasicTrainingCapV411,
  deriveBasicTrainingStatsV411,
  applyBasicTrainingAllocationsV411,
  basicTrainingSnapshotV411,
  metaTickEnergieSorealIdle_,
  calculerTicksEnergieSorealIdle_,
  creerSimulateurEnergieHorsLigneSorealIdle_,
  emailsAutorisesSorealIdle_,
  __idleCanonicalSheetNameV1,
  nombreSorealIdle_,
  dateSorealIdle_,
  __idleRestoreCatalogFromLegacyV2,
  equilibrerBossPrincipalSorealIdleV413_,
  definitionBossSorealIdle_,
  contexteMetaNguSorealIdle_,
  degatsRecusSecondeSorealIdle_,
  xpBossSorealIdle_,
  highestBossJamaisAtteintSorealIdle_,
  xpBonusPremiereFoisSorealIdle_,
  enregistrerBossJamaisVaincuSorealIdle_,
  attaqueBossSorealIdle_,
  defenseBossSorealIdle_,
  pvMaxBossSorealIdle_,
  regenPvIntegreeBasicTrainingSorealIdleV176_,
  regenPvAvecMultiplicateursSorealIdle_
});


export function runSorealIdleOperation(sql,operation,args,user){
  const op=String(operation||"");
  const fn=Object.hasOwn(IDLE_OPERATIONS,op)?IDLE_OPERATIONS[op]:undefined;
  if(typeof fn!=="function")throw new Error("SOREAL_IDLE_OPERATION_INCONNUE");

  /*
   * L'autorisation d'afficher le lanceur ne dépend jamais de l'état des
   * données du jeu. Elle dépend uniquement de la session SOREAL et de
   * l'allowlist. Cela évite qu'une migration/catalogue incomplet masque
   * le bouton IDLE dans APP et TV.
   */
  if(op==="obtenirAccesSorealIdle"||op==="testerAccesSorealIdle"){
    __idleCtx.__idleRuntimeUser=user||null;
    __idleCtx.__idleWorkbook=null;
    __idleCtx.__idleSql=sql;
    __idleCtx.__idleAccesOuvert=__idleLireAccesOuvert(sql);
    __idleCtx.__idleAccesPublic=__idleLireAccesPublic(sql);
    try{
      return fn.apply(null,Array.isArray(args)?args:[]);
    }finally{
      __idleCtx.__idleRuntimeUser=null;
      __idleCtx.__idleWorkbook=null;
      __idleCtx.__idleSql=null;
    }
  }

  __idleCtx.__idleSql=sql;
  __idleCtx.__idleOperationNomV1=op;
  /* Toute opération autre que synchroniser / lire l'état peut modifier la partie : la trajectoire des multiplicateurs de combat mise de côté n'est alors plus réutilisée (voir idle-runtime-etat.js). */
  /* Un combat d'Aventure automatique n'invalide pas la trajectoire (il revient toutes les quelques secondes) : si son butin change les multiplicateurs actuels, la garde de la réutilisation le voit tout de suite. */
  const combatAventureAuto=op==="agirProgressionSorealIdle"&&Array.isArray(args)&&args[1]&&args[1].action==="adventure"&&args[1].adventure&&args[1].adventure.action==="resolveZoneFight";
  if(op!=="synchroniserSorealIdle"&&op!=="obtenirEtatSorealIdle"&&!combatAventureAuto)__idleCtx.__opsMutantesV1=(__idleCtx.__opsMutantesV1||0)+1;
  __idleCtx.__idleReferenceGainV1="";
  __idleCtx.__idleAccesOuvert=__idleLireAccesOuvert(sql);
  __idleCtx.__idleAccesPublic=__idleLireAccesPublic(sql);

  const sourceState=sqlRows(sql.exec(
    "SELECT COUNT(*) AS total,SUM(CASE WHEN status='DONE' THEN 1 ELSE 0 END) AS done "+
    "FROM migration_sources WHERE source_key LIKE 'idle:%'"
  ))[0]||{};
  if(Number(sourceState.total||0)<15||Number(sourceState.done||0)!==Number(sourceState.total||0)){
    throw new Error("SOREAL_IDLE_MIGRATION_INCOMPLETE");
  }

  /*
   * Les premières migrations IDLE ont stocké les noms techniques en
   * minuscules (joueurs, config, boss...) alors que le moteur attend les
   * noms réels des feuilles (JOUEURS, CONFIG, IDLE_BOSS...). On répare
   * ces clés de façon idempotente avant de reconstruire le workbook.
   *
   * Perf (2026-09-18, Norman : "le menu Paramètres est lent") — mesuré en
   * direct : chaque /api/idle/call prenait 830ms à 2,2s. Cause confirmée :
   * ces deux passes de réparation tournaient AVANT CHAQUE opération, sans
   * exception, alors qu'elles ne font jamais rien d'utile une fois la
   * migration terminée — chacune exécute jusqu'à 15 requêtes SQL (une par
   * feuille canonique) rien que pour constater qu'il n'y a rien à réparer.
   * Le check ci-dessus (sourceState.total/done) confirme déjà que la
   * migration des 15 sources est complète — une fois vrai, ça ne redevient
   * jamais faux (aucun mécanisme ne réintroduit du legacy après coup). Un
   * simple drapeau mémoire, remis à zéro à chaque redémarrage à froid de
   * l'isolate (donc toujours ré-exécuté au moins une fois, jamais un skip
   * permanent risqué), suffit à économiser ces ~30 requêtes par appel.
   */
  if(!__idleCtx.__idleLegacyRepairDoneV1){
    __idleRepairCatalogSheetNamesV1(sql);
    __idleRestoreCatalogFromLegacyV2(sql);
    __idleCtx.__idleLegacyRepairDoneV1=true;
  }

  /* Mémos de bonus / d'équipement : valables pour UNE opération (idle-ngu-progression.js, idleNguBonuses). */
  idleNguMemoNouvelleRequeteV1();

  const workbook=span("op:classeur",function(){return __idleBuildWorkbook(sql);});
  if(!workbook.getSheetByName("JOUEURS"))throw new Error("SOREAL_IDLE_JOUEURS_ABSENT");

  __idleCtx.__idleRuntimeUser=user||null;
  __idleCtx.__idleWorkbook=workbook;
  /* Horloge FIGÉE pendant l'opération (comme sur Cloudflare, où Date.now() ne bouge pas entre deux entrées-sorties) : toutes les étapes d'une opération voient le même instant, donc les passes de temps suivant la première n'ont plus rien à avancer. */
  const dateNowOriginal=Object.getOwnPropertyDescriptor(Date,"now");
  const instantOperation=Date.now();
  try{ Object.defineProperty(Date,"now",{configurable:true,writable:true,value:function(){return instantOperation;}}); }catch(_e){}
  try{
    const result=span("op:"+op,function(){return fn.apply(null,Array.isArray(args)?args:[]);});
    /* La section critique doit rester synchrone (voir idle-run-operation-sync-critical-section.test.mjs). */
    if(result&&typeof result.then==="function")throw new Error("SOREAL_IDLE_OPERATION_ASYNC_INTERDITE");
    /*
     * Le commit (idle_catalog puis idle_players, journal d'EXP) est atomique quand le coordinateur fournit transactionSync (Durable Object SQLite) : une erreur au milieu (ligne trop grosse par exemple) annule TOUT le commit
     * au lieu de laisser les deux tables diverger (audit du 2026-10-10, IDLE-AUDIT-PERF-006 / SEC-015). Sans transactionSync (tests, autres hôtes), comportement inchangé.
     */
    span("op:commit",function(){
    if(sql&&typeof sql.transactionSync==="function")sql.transactionSync(function(){__idleCommit(sql,workbook);});
    else __idleCommit(sql,workbook);
    });
    return result;
  }finally{
    try{ if(dateNowOriginal)Object.defineProperty(Date,"now",dateNowOriginal); else delete Date.now; }catch(_e){}
    __idleCtx.__idleRuntimeUser=null;
    __idleCtx.__idleWorkbook=null;
    __idleCtx.__idleSql=null;
  }
}

export { spansActiver, spansPrelever };
