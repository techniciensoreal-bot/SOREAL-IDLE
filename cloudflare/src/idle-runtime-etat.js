/*
 * Construction de l'état renvoyé au client (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { syncIdleNguState, idleNguResourceGenerationPerSecond, idleNguEffectiveResourceStat, REBIRTH_UNLOCK_BOSS_V1, idleNguSnapshot, idleNguBonuses } from "./idle-ngu-progression.js";
import { basicTrainingSnapshotV411, normalizeBasicTrainingStateV411 } from "./idle-basic-training.js";
import { idleDevSlotsAvailableV1, idleDevSlotForUserV1 } from "./idle-dev-save-slots-v1.js";
import { nomBossSurchargeV1 } from "./idle-textes-v1.js";
import { CONFIG_SOREAL_IDLE, bossParMondeSorealIdle_, dateSorealIdle_, deblocagesEtatSorealIdleV405_, inventaireCapaciteMaxSorealIdle_, nombreSorealIdle_, seuilPuissanceBossPrincipalSorealIdle_ } from "./idle-runtime-config.js";
import { bonusEquipementSorealIdle_, construireBestiaireSorealIdle_, detailsEquipementSorealIdle_, listeCollectionSorealIdle_, parserJsonSorealIdle_, progressionCollectionsSorealIdle_, slotsEquipementSorealIdle_, statsJoueurSorealIdle_, synchroniserCollectionSorealIdle_ } from "./idle-runtime-collection.js";
import { attaqueBossSorealIdle_, bonusSetsSorealIdle_, coutExtensionSacSorealIdle_, coutForgeSorealIdle_, defenseBossSorealIdle_, definitionBossSorealIdle_, degatsRecusSecondeSorealIdle_, delaiRespawnBossSorealIdle_, mettreAJourManaStatsSorealIdle_, niveauMagieSorealIdle_, niveauRequisBossSorealIdle_, nomBossSorealIdle_, nombreObjetsSacSorealIdle_, pvMaxBossSorealIdle_, recompenseXpBossNiveauSorealIdle_, regenBossSecondeSorealIdle_, statsCombatPrincipalSorealIdleV413_, xpBossSorealIdle_ } from "./idle-runtime-boss.js";
import { contexteMetaNguSorealIdle_, metaTickEnergieSorealIdle_ } from "./idle-runtime-progression.js";
import { apparencesSorealIdle_, banniereSorealIdleDriveFileId_, bossCatalogueSorealIdle_, boutiqueConfigSorealIdle_, histoireBossAvecSurchargeSorealIdle_, parametreSorealIdle_, reposSorealIdle_, setsSorealIdle_, sortsSorealIdle_ } from "./idle-runtime-catalogue.js";
import { classementDebloqueSorealIdle_, estAdministrateurSorealIdle_, identiteJoueurSorealIdle_, nomJeuDepuisLigneSorealIdle_ } from "./idle-runtime-joueurs.js";
import { ameliorationsSorealIdle_, bonusAmeliorationsSorealIdle_, construireAventureSorealIdle_, coutAmeliorationSorealIdle_, niveauxParBarreEntrainementSorealIdle_ } from "./idle-runtime-aventure.js";
import { __idleCtx, accesOuvertSorealIdle_, accesPublicSorealIdle_ } from "./idle-sqlite-runtime.js";
import { facteurExpBossPerkSorealIdle_ } from "./idle-runtime-combat.js";

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 151 lignes. */
function construireEtatJoueurSorealIdle__p1(feuille, ligne){
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row =
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .getValues()[0];

  const inventaireEtat =
    parserJsonSorealIdle_(
      row[c.INVENTAIRE_JSON - 1],
      []
    );

  const collectionEtat =
    synchroniserCollectionSorealIdle_(
      feuille,
      ligne,
      inventaireEtat
    );

  const equipementBrutEtat =
    parserJsonSorealIdle_(
      row[c.EQUIPEMENT_JSON - 1],
      {}
    );

  const defenseEtat =
    Math.max(
      0,
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        100
      )
    );

  /*
   * Champs legacy conservés dans la réponse pour compatibilité avec de
   * vieux clients, mais le système K.O. Fight Boss n'existe plus.
   */
  const koSecondesRestantes=0;

  const dateDebutBrute =
    row[c.DATE_DEBUT - 1];

  const dateDebutMs =
    dateSorealIdle_(
      dateDebutBrute,
      Date.now()
    );

  const ageMs =
    Math.max(0,Date.now()-dateDebutMs);

  const equipementEtat =
    detailsEquipementSorealIdle_(
      inventaireEtat,
      equipementBrutEtat
    );

  const capaciteInventaire =
    Math.max(
      CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
      Math.floor(
        nombreSorealIdle_(
          row[c.INVENTAIRE_CAPACITE - 1],
          CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
        )
      )
    );

  const objetsDansSac =
    nombreObjetsSacSorealIdle_(
      inventaireEtat,
      equipementBrutEtat
    );

  const setsEtat =
    bonusSetsSorealIdle_(
      inventaireEtat,
      equipementBrutEtat
    );

  const statsEtat =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const statsBossEtat =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const niveauEtat =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          row[c.NIVEAU - 1],
          1
        )
      )
    );

  const bossVaincusEtat =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.BOSS_VAINCUS - 1],
          0
        )
      )
    );

  const bossSelectionIndex =
    bossVaincusEtat;

  const attaqueBossSelection =
    attaqueBossSorealIdle_(
      bossSelectionIndex
    );

  const defenseBossSelection =
    defenseBossSorealIdle_(
      bossSelectionIndex
    );

  const progressionCollectionsEtat =
    progressionCollectionsSorealIdle_(
      collectionEtat
    );

  const contexteMetaNguEtat =
    contexteMetaNguSorealIdle_(
      row,
      statsEtat,
      collectionEtat
    );

  const metaNguEtat =
    syncIdleNguState(
      statsEtat.metaNgu,
      contexteMetaNguEtat,
      Date.now()
    );
  /* @sortie */ return {c:c,row:row,inventaireEtat:inventaireEtat,collectionEtat:collectionEtat,equipementBrutEtat:equipementBrutEtat,defenseEtat:defenseEtat,koSecondesRestantes:koSecondesRestantes,dateDebutBrute:dateDebutBrute,dateDebutMs:dateDebutMs,ageMs:ageMs,equipementEtat:equipementEtat,capaciteInventaire:capaciteInventaire,objetsDansSac:objetsDansSac,setsEtat:setsEtat,statsEtat:statsEtat,statsBossEtat:statsBossEtat,niveauEtat:niveauEtat,bossVaincusEtat:bossVaincusEtat,bossSelectionIndex:bossSelectionIndex,attaqueBossSelection:attaqueBossSelection,defenseBossSelection:defenseBossSelection,progressionCollectionsEtat:progressionCollectionsEtat,contexteMetaNguEtat:contexteMetaNguEtat,metaNguEtat:metaNguEtat};
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 28 lignes. */
function construireEtatJoueurSorealIdle__p2(c, feuille, ligne, metaNguEtat, row, statsEtat){
  const autoFarmAventureEtat =
    (metaNguEtat.adventure && metaNguEtat.adventure.lastAutoFarmSummaryV1) || null;
  if (metaNguEtat.adventure) delete metaNguEtat.adventure.lastAutoFarmSummaryV1;

  statsEtat.metaNgu = metaNguEtat;

  const energieMetaEtat=metaNguEtat.resources&&metaNguEtat.resources.energy
    ?metaNguEtat.resources.energy
    :null;
  if(energieMetaEtat){
    row[c.ENERGIE - 1]=Math.max(0,nombreSorealIdle_(energieMetaEtat.current,0));
    row[c.ENERGIE_MAX - 1]=Math.max(0,nombreSorealIdle_(energieMetaEtat.cap,0));
    row[c.PROD_SECONDE - 1]=Math.max(0,idleNguResourceGenerationPerSecond(metaNguEtat,"energy"));
    feuille.getRange(ligne,c.ENERGIE).setValue(row[c.ENERGIE - 1]);
    feuille.getRange(ligne,c.ENERGIE_MAX).setValue(row[c.ENERGIE_MAX - 1]);
    feuille.getRange(ligne,c.PROD_SECONDE).setValue(row[c.PROD_SECONDE - 1]);
  }

  feuille
    .getRange(
      ligne,
      c.STATS_JSON
    )
    .setValue(
      JSON.stringify(statsEtat)
    );

  let apparenceNumeroEtat = 1;
  /* @sortie */ return {autoFarmAventureEtat:autoFarmAventureEtat,energieMetaEtat:energieMetaEtat,apparenceNumeroEtat:apparenceNumeroEtat};
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 18 lignes. */
function construireEtatJoueurSorealIdle__p3(feuille, ligne){
  const __r1=construireEtatJoueurSorealIdle__p1(feuille, ligne);const c=__r1.c;const row=__r1.row;const inventaireEtat=__r1.inventaireEtat;const collectionEtat=__r1.collectionEtat;const equipementBrutEtat=__r1.equipementBrutEtat;const defenseEtat=__r1.defenseEtat;const koSecondesRestantes=__r1.koSecondesRestantes;const dateDebutBrute=__r1.dateDebutBrute;const dateDebutMs=__r1.dateDebutMs;const ageMs=__r1.ageMs;const equipementEtat=__r1.equipementEtat;const capaciteInventaire=__r1.capaciteInventaire;const objetsDansSac=__r1.objetsDansSac;const setsEtat=__r1.setsEtat;const statsEtat=__r1.statsEtat;const statsBossEtat=__r1.statsBossEtat;const niveauEtat=__r1.niveauEtat;const bossVaincusEtat=__r1.bossVaincusEtat;const bossSelectionIndex=__r1.bossSelectionIndex;const attaqueBossSelection=__r1.attaqueBossSelection;const defenseBossSelection=__r1.defenseBossSelection;const progressionCollectionsEtat=__r1.progressionCollectionsEtat;const contexteMetaNguEtat=__r1.contexteMetaNguEtat;const metaNguEtat=__r1.metaNguEtat;/*<construireEtatJoueurSorealIdle__p1*/

  /*
   * Norman (2026-09-29) : « Je ne loot pas en étant hors ligne. » Cause : le farm auto d'Aventure
   * hors ligne (Beta 6.3) avait été câblé sur l'ancien système legacy (j.aventure, zones à ID
   * numérique, ce bloc-ci) dont le déclencheur (statsAuto.autoAventure/autoAventureZone, plus haut
   * dans cette fonction) n'est en réalité JAMAIS mis à vrai nulle part dans le code -- un
   * interrupteur mort depuis toujours, jamais le vrai système utilisé par un joueur (le vrai
   * sélecteur de zone, vérifié dans Soreal_Idle_UI.html, lit partout j.systemes.adventure.
   * selectedZone). Remplacé par advanceAdventureZoneAutoFarmOfflineV1 (idle-adventure-v47.js), câblé
   * dans advanceLateSystems (idle-ngu-progression.js) sur le VRAI système -- son résumé de ce SEUL
   * sync est déposé ici sur metaNguEtat.adventure.lastAutoFarmSummaryV1 puis retiré avant la
   * persistance (JSON.stringify(statsEtat) juste en dessous), pour ne jamais polluer la sauvegarde
   * -- même principe "delta de ce sync uniquement, jamais persisté" que l'ancien
   * progression.autoAventureHorsLigne ci-dessous (qui reste construit mais ne peut plus jamais avoir
   * de contenu, ce même interrupteur mort ne s'activant jamais).
   */
  /*>construireEtatJoueurSorealIdle__p2*/const __r2=construireEtatJoueurSorealIdle__p2(c, feuille, ligne, metaNguEtat, row, statsEtat);const autoFarmAventureEtat=__r2.autoFarmAventureEtat;const energieMetaEtat=__r2.energieMetaEtat;let apparenceNumeroEtat=__r2.apparenceNumeroEtat;
  /* @sortie */ return {__r1:__r1,c:c,row:row,inventaireEtat:inventaireEtat,collectionEtat:collectionEtat,equipementBrutEtat:equipementBrutEtat,defenseEtat:defenseEtat,koSecondesRestantes:koSecondesRestantes,dateDebutBrute:dateDebutBrute,dateDebutMs:dateDebutMs,ageMs:ageMs,equipementEtat:equipementEtat,capaciteInventaire:capaciteInventaire,objetsDansSac:objetsDansSac,setsEtat:setsEtat,statsEtat:statsEtat,statsBossEtat:statsBossEtat,niveauEtat:niveauEtat,bossVaincusEtat:bossVaincusEtat,bossSelectionIndex:bossSelectionIndex,attaqueBossSelection:attaqueBossSelection,defenseBossSelection:defenseBossSelection,progressionCollectionsEtat:progressionCollectionsEtat,contexteMetaNguEtat:contexteMetaNguEtat,metaNguEtat:metaNguEtat,__r2:__r2,autoFarmAventureEtat:autoFarmAventureEtat,energieMetaEtat:energieMetaEtat,apparenceNumeroEtat:apparenceNumeroEtat};
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 175 lignes. */
function construireEtatJoueurSorealIdle__o1(c, combatPrincipalEtat, metaNguEtat, metaTickEnergieEtat, productionSecondeEtat, row, statsEtat){
  /* @obj */ return {
id:
      String(
        row[c.ID - 1] || ''
      ),

    /* Nom montré dans le jeu : pseudo, sinon prénom (Norman, 2026-09-26 : « joueur 2 fois au lieu de mon pseudo »). */
    nom: nomJeuDepuisLigneSorealIdle_(row, c),

    // Compatibility field only. SOREAL IDLE has no global player level.
    niveau:1,

    // EXP is now the NGU Spend EXP currency from the shared meta engine.
    xp:
      Math.max(
        0,
        nombreSorealIdle_(
          metaNguEtat.currencies&&metaNguEtat.currencies.experience,
          0
        )
      ),

    energie:
      nombreSorealIdle_(
        row[c.ENERGIE - 1],
        0
      ),

    /*
     * Maximum d'énergie = le plafond EFFECTIF du moteur, jamais la colonne enregistrée (Norman, 2026-10-05 : « je viens de dépenser 2 points dans le Plafond d'Énergie : mon total est toujours à 500000, l'énergie se
     * génère de manière étrange, toutes les X secondes »). La colonne n'était réécrite qu'à la synchro suivante : un achat (atout, boutique, équipement) laissait l'ancien maximum affiché, et le jeu local arrêtait sa génération à cet
     * ancien plafond jusqu'à la réponse du serveur.
     */
    energieMax:
      (function(){
        let effectif=NaN;
        try{effectif=idleNguEffectiveResourceStat(metaNguEtat,'energy','cap');}catch(_e){}
        return Number.isFinite(effectif)&&effectif>0?effectif:nombreSorealIdle_(row[c.ENERGIE_MAX - 1],1000);
      })(),

    productionSeconde:
      productionSecondeEtat,

    energieTick: {
      gain:
        metaTickEnergieEtat.gain,

      dureeMs:
        metaTickEnergieEtat.dureeMs,

      resteMs:
        Math.max(
          0,
          nombreSorealIdle_(
            statsEtat.energieTickResteMs,
            0
          )
        )
    },

    /* Achat « Menus animés » (rayon Toc de la boutique EXP) : sans lui, aucun bouton du menu du haut ne s'anime pour montrer qu'il est actif. */
    menusAnimes:
      nombreSorealIdle_(
        statsEtat.metaNgu &&
        statsEtat.metaNgu.bonuses &&
        statsEtat.metaNgu.bonuses.expShop &&
        statsEtat.metaNgu.bonuses.expShop.menuAnimations,
        0
      ) >= 1,

    /* Achat « Synchro Basic Training » (rayon Toc de la boutique EXP) : le client affiche alors la case à cocher sous Input. */
    basicTrainingSynchro:
      nombreSorealIdle_(
        statsEtat.metaNgu &&
        statsEtat.metaNgu.bonuses &&
        statsEtat.metaNgu.bonuses.expShop &&
        statsEtat.metaNgu.bonuses.expShop.syncBasicTraining,
        0
      ) >= 1,

    basicTraining:
      basicTrainingSnapshotV411(
        normalizeBasicTrainingStateV411(
          statsEtat.entrainementBase,
          Date.now()
        ),
        nombreSorealIdle_(
          row[c.ENERGIE_MAX - 1],
          CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE
        ),
        nombreSorealIdle_(
          row[c.ENERGIE - 1],
          0
        ),
        niveauxParBarreEntrainementSorealIdle_(statsEtat)
      ),

    combatPrincipal: {
      attaqueEntrainement:
        combatPrincipalEtat
          .attaqueEntrainement,

      defenseEntrainement:
        combatPrincipalEtat
          .defenseEntrainement,

      bonusBoutique:
        combatPrincipalEtat
          .bonusBoutique,

      multiplicateurPermanent:
        combatPrincipalEtat
          .multiplicateurPermanent,

      /* 2026-09-24 : produit complet appliqué par le serveur (voir statsCombatPrincipalSorealIdleV413_). */
      multiplicateurAttaqueTotal:
        combatPrincipalEtat
          .multiplicateurAttaqueTotal,

      multiplicateurDefenseTotal:
        combatPrincipalEtat
          .multiplicateurDefenseTotal,
      detailStats:
        combatPrincipalEtat
          .detailStats,

      multiplicateurEquipementAttaque:
        combatPrincipalEtat
          .equipement
          .multiplicateurAttaque,

      multiplicateurEquipementDefense:
        combatPrincipalEtat
          .equipement
          .multiplicateurDefense,

      piecesEquipees:
        combatPrincipalEtat
          .equipement
          .piecesEquipees,

      scoreEquipement:
        combatPrincipalEtat
          .equipement
          .scorePuissance,

      piecesArmure:
        combatPrincipalEtat
          .equipement
          .piecesArmure,

      scoreArmure:
        combatPrincipalEtat
          .equipement
          .scoreArmure
    },

    force:
      nombreSorealIdle_(
        row[c.FORCE - 1],
        1
      ),

    endurance:
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        1
      ),

    organisation:
      nombreSorealIdle_(
        row[
          c.ORGANISATION - 1
        ],
        1
      )
  };
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 200 lignes. */
function construireEtatJoueurSorealIdle__o2(attaqueBossSelection, bossDefinitionEtat, bossSelectionIndex, c, defenseBossSelection, defenseEtat, metaNguEtat, progression, row, statsBossEtat){
  /* @obj */ return {
puissance:
      nombreSorealIdle_(
        row[
          c.PUISSANCE - 1
        ],
        0
      ),

    bossActuel:
      String(
        row[
          c.BOSS_ACTUEL - 1
        ] ||
        CONFIG_SOREAL_IDLE
          .BOSS_BASE
      ),

    bossImage:
      String(
        bossDefinitionEtat.image || ''
      ),

    bossDriveFileId:
      String(
        bossDefinitionEtat.driveFileId || ''
      ),

    /*
     * Correctif 2026-09-13 : bossId permet au client de résoudre l'image
     * réelle sur R2 (idle/bosses/boss_<id>_*.webp) via
     * /api/idle/media/boss?id=<bossId> — driveFileId seul ne suffisait
     * plus, la résolution Drive côté serveur étant un stub inopérant
     * dans cet environnement Cloudflare Workers (DriveApp/Utilities,
     * ~ligne 362, renvoient toujours un blob vide).
     *
     * Correctif 2026-09-18 (Norman : "c'est toujours les mauvaises images
     * dans fight boss") : bossDefinitionEtat.id vient de la colonne brute
     * IDLE_BOSS.ID (via bossCatalogueSorealIdle_, qui trie ENSUITE le
     * catalogue par ce même id — un ID incohérent/à trous dans la feuille
     * décale l'id réel par rapport à la position réelle du boss). L'écran
     * Collection, lui, n'utilise JAMAIS cet id : bossCatalogue expose
     * "numero: index+1" (position dans le catalogue trié, RENVOYÉ
     * IDENTIQUE pour Fight Boss et Collection). bossSelectionIndex est
     * exactement ce même index (= bossVaincus, cf. plus haut) : bossId
     * doit donc être bossSelectionIndex+1, jamais bossDefinitionEtat.id,
     * pour résoudre EXACTEMENT la même image que la carte Collection du
     * même boss.
     */
    bossId:
      Math.max(
        0,
        Math.floor(bossSelectionIndex) + 1
      ),

    bossPv:
      nombreSorealIdle_(
        row[c.BOSS_PV - 1],
        CONFIG_SOREAL_IDLE
          .BOSS_PV_BASE
      ),

    bossPvMax:
      nombreSorealIdle_(
        row[
          c.BOSS_PV_MAX - 1
        ],
        CONFIG_SOREAL_IDLE
          .BOSS_PV_BASE
      ),

    bossVaincus:
      nombreSorealIdle_(
        row[
          c.BOSS_VAINCUS - 1
        ],
        0
      ),

    bossSelection:
      bossSelectionIndex + 1,

    mondeActuel:
      Math.floor(
        bossSelectionIndex /
        bossParMondeSorealIdle_()
      ) + 1,

    ordreBossMonde:
      (
        bossSelectionIndex %
        bossParMondeSorealIdle_()
      ) + 1,

    bossBloqueRenaissance:
      Boolean(
        progression &&
        progression.bossBloqueRenaissance
      ),

    combatBossActif:
      Boolean(
        statsBossEtat.combatBossActif
      ),

    autoBossSuivant:
      Boolean(
        statsBossEtat.autoBossSuivant
      ),

    bossRespawnJusqua: 0,

    bossRespawnSecondesRestantes: 0,

    bossDisponible: true,

    rang:
      nombreSorealIdle_(
        row[c.RANG - 1],
        0
      ),

    xpRequise: 0,

    degatsSeconde:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PUISSANCE - 1],
          0
        )
      ),

    pvJoueur:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PV_JOUEUR - 1],
          row[c.PV_JOUEUR_MAX - 1]
        )
      ),

    pvJoueurMax:
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.PV_JOUEUR_MAX - 1],
          CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE
        )
      ),

    defense:
      defenseEtat,

    attaqueBoss:
      attaqueBossSelection,

    defenseBoss:
      defenseBossSelection,

    regenBoss:
      regenBossSecondeSorealIdle_(
        bossSelectionIndex,
        Math.max(
          1,
          nombreSorealIdle_(
            row[c.BOSS_PV_MAX - 1],
            pvMaxBossSorealIdle_(
              bossSelectionIndex,
              metaNguEtat.difficulty
            )
          )
        )
      ),

    degatsRecusSeconde:
      degatsRecusSecondeSorealIdle_(
        bossSelectionIndex,
        defenseEtat,
        row[c.BOSS_PV - 1],
        row[c.BOSS_PV_MAX - 1]
      ),

    bossCapacites:
      Array.isArray(
        bossDefinitionEtat.capacites
      )
        ? bossDefinitionEtat.capacites
        : [],

    bossHistoire:
      String(
        bossDefinitionEtat.histoire || ''
      ),
    bossHistoireParlee: String(bossDefinitionEtat.histoireParlee || ''),
    bossNomParle: String(bossDefinitionEtat.nomParle || ''),

    bossMortVivant:
      Boolean(
        bossDefinitionEtat.mortVivant
      )
  };
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 211 lignes. */
function construireEtatJoueurSorealIdle__o3(c, capaciteInventaire, collectionEtat, equipementEtat, inventaireEtat, koSecondesRestantes, metaNguEtat, objetsDansSac, progressionCollectionsEtat, row, statsEtat){
  /* @obj */ return {
bossConseil: '',

    ko:
      koSecondesRestantes > 0,

    koSecondesRestantes:
      koSecondesRestantes,

    dureeKoSecondes: 0,

    pieces:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PIECES - 1],
          0
        )
      ),

    inventaire:
      parserJsonSorealIdle_(
        row[
          c.INVENTAIRE_JSON - 1
        ],
        []
      ),

    equipement:
      equipementEtat,

    bonusEquipement:
      bonusEquipementSorealIdle_(
        parserJsonSorealIdle_(
          row[
            c.INVENTAIRE_JSON - 1
          ],
          []
        ),
        parserJsonSorealIdle_(
          row[
            c.EQUIPEMENT_JSON - 1
          ],
          {}
        )
      ),

    ameliorations:
      ameliorationsSorealIdle_(
        row[
          c.AMELIORATIONS_JSON - 1
        ]
      ),

    boutiqueLegacyDesactivee:true,

    coutsBoutique: {
      production:
        coutAmeliorationSorealIdle_(
          'production',
          ameliorationsSorealIdle_(
            row[
              c.AMELIORATIONS_JSON - 1
            ]
          ).production
        ),

      capacite:
        coutAmeliorationSorealIdle_(
          'capacite',
          ameliorationsSorealIdle_(
            row[
              c.AMELIORATIONS_JSON - 1
            ]
          ).capacite
        ),

      puissance:
        coutAmeliorationSorealIdle_(
          'puissance',
          ameliorationsSorealIdle_(
            row[
              c.AMELIORATIONS_JSON - 1
            ]
          ).puissance
        )
    },

    bonusBoutique:
      bonusAmeliorationsSorealIdle_(
        ameliorationsSorealIdle_(
          row[
            c.AMELIORATIONS_JSON - 1
          ]
        )
      ),

    boutiqueMeta:
      [
        'production',
        'capacite',
        'puissance'
      ].reduce(
        function(resultat,type) {
          const cfg =
            boutiqueConfigSorealIdle_(
              type
            ) || {};

          resultat[type] = {
            base:
              Math.max(
                1,
                nombreSorealIdle_(
                  cfg.base,
                  1
                )
              ),
            croissance:
              Math.max(
                1,
                nombreSorealIdle_(
                  cfg.croissance,
                  1
                )
              ),
            bonusParNiveau:
              nombreSorealIdle_(
                cfg.bonusParNiveau,
                0
              )
          };

          return resultat;
        },
        {}
      ),

    materiaux:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.MATERIAUX - 1],
            0
          )
        )
      ),

    collection:
      listeCollectionSorealIdle_(
        collectionEtat
      ),

    collections:
      progressionCollectionsEtat,

    inventaireCapacite:
      capaciteInventaire,

    inventaireUtilise:
      objetsDansSac,

    inventaireLibre:
      Math.max(
        0,
        capaciteInventaire-objetsDansSac
      ),

    /*
     * Norman (2026-09-10) : "L'inventaire ne doit pas se verrouiller quand
     * on rebirth. C'est un déblocage permanent." Même bug déjà corrigé une
     * fois pour l'Aventure/le Bestiaire (2026-09-09, cf.
     * construireAventureSorealIdle_/construireBestiaireSorealIdle_) :
     * row[BOSS_VAINCUS] est seulement le compteur du RUN EN COURS, remis à
     * 0 à chaque Renaissance — jamais utilisable seul comme condition de
     * déblocage permanent. Réutilise ici le même high-water-mark
     * persistant (metaNguEtat.records.highestBoss) plutôt que d'inventer
     * un second mécanisme parallèle. Les anciens critères (loot/inventaire
     * /collection non vides) restent en OR par compatibilité avec les
     * comptes déjà débloqués avant ce correctif.
     */
    inventaireDebloque:
      Boolean(
        Math.max(
          0,
          Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1],0)),
          Math.floor(
            nombreSorealIdle_(
              metaNguEtat.records &&
                metaNguEtat.records.highestBoss,
              0
            )
          )
        ) >= 4 ||
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              statsEtat.lootsObtenus,
              0
            )
          )
        ) > 0 ||
        inventaireEtat.length > 0 ||
        (
          Array.isArray(
            collectionEtat
          ) &&
          collectionEtat.length > 0
        )
      )
  };
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 195 lignes. */
function construireEtatJoueurSorealIdle__o4(ageMs, apparenceEtat, apparenceNumeroEtat, c, capaciteInventaire, dateDebutMs, equipementEtat, reposEtat, row, setsEtat, statsEtat){
  /* @obj */ return {
coutExtensionInventaire:
      coutExtensionSacSorealIdle_(
        capaciteInventaire
      ),

    peutEtendreInventaire:
      capaciteInventaire <
      inventaireCapaciteMaxSorealIdle_(),

    sets:
      setsEtat,

    autoAventure: {
      actif:
        statsEtat.autoAventure,
      zoneId:
        statsEtat.autoAventureZone
    },

    apparenceJoueur: {
      numero:
        apparenceNumeroEtat,
      fichier:
        'Player_' + apparenceNumeroEtat + '.png',
      driveFileId:
        String(
          apparenceEtat.driveFileId || ''
        )
    },

    repos: {
      numero:
        reposEtat.numero,
      nom:
        reposEtat.nom,
      regenPctSec:
        reposEtat.regenPctSec,
      fichier:
        'Bedroom_' + reposEtat.numero + '.png',
      driveFileId:
        String(
          reposEtat.driveFileId || ''
        )
    },

    /*
     * Classement des joueurs (2026-09-25, Norman : « les autres ne doivent pas encore voir le bouton ; je le débloquerai avec un trophée de
     * TV/APP, je te dirai lequel ») : verrou provisoire = administrateur seulement. Le déblocage par trophée viendra remplacer cette seule
     * fonction (classementDebloqueSorealIdle_).
     */
    classement: {
      debloque:
        classementDebloqueSorealIdle_(
          row[c.EMAIL_PRINCIPAL - 1],
          row[c.EMAIL_CONNEXION - 1]
        ),
      /*
       * Norman (2026-09-27) : « Je ne veux pas apparaitre dans le classement pour les autres. Uniquement moi.
       * Et avoir une case dans parametres pour pouvoir apparaitre ou disparaitre. » Préférence PERSONNELLE
       * (jamais réservée à l'administrateur, contrairement à `reglages`) : visible par défaut, désactivable par
       * chaque joueur pour lui-même. N'exclut jamais son propre affichage à ses propres yeux (voir
       * obtenirClassementSorealIdle) -- seulement de la vue des autres.
       */
      visible: statsEtat.classementVisible
    },

    /* Interrupteur d'accès à SOREAL IDLE : exposé uniquement au compte administrateur (bouton des Paramètres). */
    reglages:
      estAdministrateurSorealIdle_(
        row[c.EMAIL_PRINCIPAL - 1],
        row[c.EMAIL_CONNEXION - 1]
      )
        ? { accesOuvert: accesOuvertSorealIdle_(), accesPublic: accesPublicSorealIdle_() }
        : null,

    /*
     * Sélecteur « Partie B » (administrateur) : donné dans l'état pour que le client n'ait plus à le demander par un appel à part au démarrage (audit des appels, Norman 2026-10-04).
     * Même contenu que obtenirPartieDevSorealIdle ; l'état d'administrateur, lui, se lit déjà dans `reglages` (non nul pour l'administrateur seul).
     */
    partieDev: { actif: idleDevSlotsAvailableV1(__idleCtx.__idleRuntimeUser), partie: idleDevSlotForUserV1(__idleCtx.__idleRuntimeUser) },

    /* Pseudo et nom affiché du joueur (Paramètres) ; voir idle-profile-v1.js. */
    identite: identiteJoueurSorealIdle_(
      { user: __idleCtx.__idleRuntimeUser, emailAutorise: String(row[c.EMAIL_PRINCIPAL - 1] || '') }
    ),

    profil: {
      dateDebut:
        new Date(dateDebutMs).toISOString(),

      ageSecondes:
        Math.floor(ageMs/1000),

      ageHeures:
        ageMs/3600000,

      ageJours:
        ageMs/86400000,

      ageMois:
        ageMs/(86400000*30.4375),

      /*
       * Allègement (Norman, 2026-10-02) : `metaNgu` (le moteur NGU brut, ~36 Ko, déjà exposé sous `systemes`) n'était lu par aucun client (ni l'interface autonome,
       * ni les snapshots APP/TV : vérifié) et repartait à CHAQUE synchro. Tout le reste de `stats` (vus, menuOrdre, lootsObtenus…) est conservé.
       */
      stats:
        Object.keys(statsEtat || {}).reduce(function (sortie, cle) {
          if (cle !== 'metaNgu') sortie[cle] = statsEtat[cle];
          return sortie;
        }, {}),

      nouveauJoueur:
        Boolean(
          ageMs < 15 * 60 * 1000 &&
          Math.floor(
            nombreSorealIdle_(
              row[c.NIVEAU - 1],
              1
            )
          ) <= 1 &&
          Math.floor(
            nombreSorealIdle_(
              row[c.BOSS_VAINCUS - 1],
              0
            )
          ) === 0 &&
          Math.floor(
            nombreSorealIdle_(
              row[c.RENAISSANCES - 1],
              0
            )
          ) === 0 &&
          Math.floor(
            nombreSorealIdle_(
              statsEtat.lootsObtenus,
              0
            )
          ) === 0
        )
    },

    forge:
      slotsEquipementSorealIdle_()
        .reduce(
          function(resultat,slot) {
            const objet=
              equipementEtat[slot];

            resultat[slot]=
              objet
                ?{
                    niveau:
                      Math.floor(
                        nombreSorealIdle_(
                          objet.forge,
                          0
                        )
                      ),
                    cout:
                      coutForgeSorealIdle_(
                        objet
                      )
                  }
                :null;

            return resultat;
          },
          {}
        ),

    forgeMeta: {
      base:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'FORGE_COUT_BASE',
              5
            ),
            5
          )
        ),
      croissance:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'FORGE_CROISSANCE',
              1.7
            ),
            1.7
          )
        )
    }
  };
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 229 lignes. */
function construireEtatJoueurSorealIdle__o5(bossSelectionIndex, c, contexteMetaNguEtat, defenseEtat, metaNguEtat, niveauEtat, row){
  /* @obj */ return {
inventaireMeta: {
      base:
        Math.max(
          1,
          Math.floor(
            nombreSorealIdle_(
              parametreSorealIdle_(
                'INVENTAIRE_CAPACITE_BASE',
                CONFIG_SOREAL_IDLE
                  .INVENTAIRE_CAPACITE_BASE
              ),
              CONFIG_SOREAL_IDLE
                .INVENTAIRE_CAPACITE_BASE
            )
          )
        ),
      pas:
        Math.max(
          1,
          Math.floor(
            nombreSorealIdle_(
              parametreSorealIdle_(
                'INVENTAIRE_EXTENSION_PAS',
                3
              ),
              3
            )
          )
        ),
      coutBase:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'INVENTAIRE_EXTENSION_COUT_BASE',
              25
            ),
            25
          )
        ),
      croissance:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'INVENTAIRE_EXTENSION_CROISSANCE',
              1.85
            ),
            1.85
          )
        ),
      max:
        inventaireCapaciteMaxSorealIdle_()
    },

    aventure:
      construireAventureSorealIdle_(
        row,
        metaNguEtat.records &&
          metaNguEtat.records.highestBoss || 0
      ),

    bestiaire:
      construireBestiaireSorealIdle_(
        row,
        metaNguEtat.records &&
          metaNguEtat.records.highestBoss || 0
      ),

    renaissance: {
      debloquee:Boolean(metaNguEtat.rebirth&&metaNguEtat.rebirth.canRebirth),
      /*
       * Norman (2026-09-16) : le Rebirth doit rester verrouillé (avec une
       * explication claire, pas juste "3 minutes") tant que le tutoriel
       * Aventure (boss 4) n'est pas fait — voir REBIRTH_UNLOCK_BOSS_V1.
       */
      aventureRequise:
        (metaNguEtat.records&&metaNguEtat.records.highestBoss||0) <
        REBIRTH_UNLOCK_BOSS_V1,
      aventureRequiseBoss:REBIRTH_UNLOCK_BOSS_V1,
      number:Math.max(1,nombreSorealIdle_(metaNguEtat.rebirth&&metaNguEtat.rebirth.number,1)),
      nextNumber:Math.max(1,nombreSorealIdle_(metaNguEtat.rebirth&&metaNguEtat.rebirth.nextNumber,1)),
      renaissances:Math.max(0,nombreSorealIdle_(metaNguEtat.records&&metaNguEtat.records.totalRebirths,0)),
      /*
       * Norman (2026-09-16) : "il faut aussi un timer avec le temps du
       * run actuel. Un run peut durer plusieurs jours." Expose le vrai
       * horodatage de début de run (déjà suivi en interne pour le calcul
       * du NUMBER, idle-ngu-progression.js) — le client calcule la durée
       * écoulée lui-même (Date.now()-runDebuteA), jamais un second
       * horodatage recalculé côté serveur.
       */
      runDebuteA:Math.max(0,nombreSorealIdle_(metaNguEtat.runStartedAt,0)),
      essence:0,
      legacy:false
    },

    titre: '',

    prochainPalier: null,

    deblocages:
      deblocagesEtatSorealIdleV405_(),

    patchRuntime:
      'GAME-V47-NGU-EARLY',

    systemes:
      idleNguSnapshot(
        metaNguEtat,
        contexteMetaNguEtat,
        Date.now()
      ),

    bossCatalogue:
      bossCatalogueSorealIdle_()
        .map(function(boss,index) {
          const vaincus =
            Math.max(
              0,
              Math.floor(
                nombreSorealIdle_(
                  row[c.BOSS_VAINCUS - 1],
                  0
                )
              )
            );

          const selection =
            bossSelectionIndex;

          return {
            numero: index + 1,
            monde:
              Math.floor(
                index /
                bossParMondeSorealIdle_()
              ) + 1,
            ordreMonde:
              (
                index %
                bossParMondeSorealIdle_()
              ) + 1,
            /* Nom modifié par l'administrateur (idle-textes-v1.js), sinon celui du catalogue. */
            nom: nomBossSurchargeV1(__idleCtx.__idleSql, index + 1) || boss.nom,
            niveauRequis:
              niveauRequisBossSorealIdle_(
                index
              ),
            connu:
              Boolean(
                index < vaincus ||
                (
                  index === vaincus &&
                  niveauEtat >=
                  niveauRequisBossSorealIdle_(
                    index
                  )
                )
              ),
            driveFileId:
              String(
                boss.driveFileId || ''
              ),
            pv:
              definitionBossSorealIdle_(index).pv,
            attaque:
              definitionBossSorealIdle_(index).attaque,
            /*
             * 2026-09-17 — pv/attaque juste au-dessus passent déjà par
             * definitionBossSorealIdle_ (valeurs équilibrées/corrigées).
             * xp lisait encore la ligne BRUTE du catalogue (boss.xp,
             * jamais corrigée par le plancher NGU) : le Bestiaire/l'écran
             * boss du client affichait donc encore 100/120/180/.../19000
             * même une fois le vrai calcul de combat corrigé. Alignée sur
             * pv/attaque pour afficher la même valeur que celle réellement
             * accordée au kill.
             */
            xp: definitionBossSorealIdle_(index).xp,
            pieces: boss.pieces,
            histoire:
              histoireBossAvecSurchargeSorealIdle_(
                index + 1,
                boss.histoire
              ),
            mortVivant:
              Boolean(boss.mortVivant),
            conseil: '',
            capacites:
              Array.isArray(
                boss.capacites
              )
                ? boss.capacites
                : [],
            puissanceMinimum:
              seuilPuissanceBossPrincipalSorealIdle_(
                index + 1,
                row[c.PV_JOUEUR_MAX - 1],
                defenseEtat
              ).puissance,
            selectionnable:
              Boolean(
                index === vaincus &&
                niveauEtat >=
                niveauRequisBossSorealIdle_(
                  index
                )
              ),
            selectionne:
              index === selection,
            etat:
              index < vaincus
                ? 'vaincu'
                : index === vaincus
                  ? 'actuel'
                  : 'avenir'
          };
        })
        /*
         * ANTI-SPOIL (AGENTS.md règle n°2 ; relevé le 2026-10-02 : les 300 boss — noms, statistiques ET histoires complètes — partaient chez tous les joueurs,
         * ce qui révélait aussi le total). Seuls les boss déjà découverts sont envoyés : jusqu'au boss actuel, et jusqu'au record permanent de boss vaincu
         * (jamais remis à zéro par un Rebirth). Le client retrouve toujours un boss par son `numero` (jamais par sa position), donc rien d'autre ne change.
         */
        .filter(function(boss) {
          return boss.numero <= Math.max(
            Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1], 0)) + 1,
            bossSelectionIndex + 1,
            Math.floor(nombreSorealIdle_(metaNguEtat.records && metaNguEtat.records.highestBoss, 0))
          );
        })
  };
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 297 lignes. */
function construireEtatJoueurSorealIdle__o6(bossSelectionIndex, bossVaincusEtat, c, defenseEtat, metaNguEtat, niveauEtat, progression, row, statsEtat){
  /* @obj */ return {
banniereDriveFileId:
      typeof banniereSorealIdleDriveFileId_ === 'function'
        ? banniereSorealIdleDriveFileId_()
        : String(
            parametreSorealIdle_(
              'BANNIERE_SOREAL_IDLE_DRIVE_ID',
              ''
            ) || ''
          ),

    magie:
      (function(){
        const niveauActuel = Math.max(
          1,
          Math.floor(nombreSorealIdle_(row[c.NIVEAU - 1],1))
        );
        const statsMagie = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
        const manaEtat = mettreAJourManaStatsSorealIdle_(
          statsMagie,
          niveauActuel,
          Date.now()
        );
        const debloquee = niveauActuel >= niveauMagieSorealIdle_();
        const bossActuel = definitionBossSorealIdle_(bossSelectionIndex);
        const maintenant = Date.now();

        return {
          debloquee: debloquee,
          niveauRequis: niveauMagieSorealIdle_(),
          mana: manaEtat.mana,
          manaMax: manaEtat.max,
          regenSeconde: manaEtat.regen,
          sortsAchetes: statsMagie.sortsAchetes.slice(),
          effets: {
            bouclierJusqua: statsMagie.buffBouclierJusqua,
            bouclierPct: statsMagie.buffBouclierPct,
            immuniteParalysieJusqua: statsMagie.immuniteParalysieJusqua,
            bossStunJusqua: statsMagie.bossStunJusqua,
            bossVulnerableJusqua: statsMagie.bossVulnerableJusqua,
            bossVulnerablePct: statsMagie.bossVulnerablePct,
            sceauBriseBossNumero: statsMagie.sceauBriseBossNumero
          },
          sorts: sortsSorealIdle_().map(function(sort){
            const achete = statsMagie.sortsAchetes.indexOf(sort.id) !== -1;
            const cooldownJusqua = Math.max(
              0,
              nombreSorealIdle_(statsMagie.cooldownsSorts[sort.id],0)
            );
            return Object.assign({},sort,{
              achete: achete,
              disponibleNiveau: niveauActuel >= sort.niveauRequis,
              achetable:
                !achete &&
                niveauActuel >= sort.niveauRequis &&
                Math.floor(nombreSorealIdle_(row[c.PIECES - 1],0)) >= sort.coutPieces,
              cooldownJusqua: cooldownJusqua,
              cooldownRestant:
                Math.max(0,(cooldownJusqua - maintenant)/1000),
              peutLancer:
                achete &&
                manaEtat.mana >= sort.coutMana &&
                cooldownJusqua <= maintenant,
              bossMortVivant:
                Boolean(bossActuel.mortVivant)
            });
          })
        };
      })(),

    prochainBoss:
      prochainBossSorealIdle_(
        row[c.BOSS_VAINCUS - 1]
      ),

    /*
     * Boss suivant, déjà prêt à afficher (Norman, 2026-10-02 : « quand on bat un boss, le suivant met énormément de temps à apparaître : ça doit être
     * instantané »). Tout ce que le client affiche pour un boss, calculé avec les mêmes fonctions que le boss courant mais pour l'index suivant : à la
     * victoire prédite, le client l'applique tout de suite au lieu d'attendre que le serveur confirme. Le serveur reste l'autorité : la confirmation
     * (bossVaincus du serveur) remplace cet état par le vrai.
     */
    bossSuivant:
      (function() {
        const idx = bossSelectionIndex + 1;
        const def = definitionBossSorealIdle_(idx, metaNguEtat.difficulty);
        const pvMax = pvMaxBossSorealIdle_(idx, metaNguEtat.difficulty);
        const bonus = idleNguBonuses(statsEtat.metaNgu);
        const xpMult = Math.max(1, nombreSorealIdle_(bonus.xpMultiplier, 1));
        return {
          bossActuel: String(def.nom || ''),
          bossImage: String(def.image || ''),
          bossDriveFileId: String(def.driveFileId || ''),
          bossId: idx + 1,
          bossPv: pvMax,
          bossPvMax: pvMax,
          bossVaincus: bossVaincusEtat + 1,
          bossSelection: idx + 1,
          attaqueBoss: attaqueBossSorealIdle_(idx),
          defenseBoss: defenseBossSorealIdle_(idx),
          regenBoss: regenBossSecondeSorealIdle_(idx, Math.max(1, pvMax)),
          degatsRecusSeconde: degatsRecusSecondeSorealIdle_(idx, defenseEtat, pvMax, pvMax),
          bossCapacites: Array.isArray(def.capacites) ? def.capacites : [],
          bossHistoire: String(def.histoire || ''),
          bossHistoireParlee: String(def.histoireParlee || ''),
          bossNomParle: String(def.nomParle || ''),
          bossMortVivant: Boolean(def.mortVivant),
          recompenseBossActuel: {
            xp: Math.max(0, Math.round(recompenseXpBossNiveauSorealIdle_(idx, niveauEtat) * xpMult * facteurExpBossPerkSorealIdle_(bonus, idx))),
            xpBase: xpBossSorealIdle_(idx),
            xpMultiplicateur: xpMult,
            niveauRequis: 1
          }
        };
      })(),

    recompenseBossActuel: {
      xp:
        Math.max(
          0,
          Math.round(
            recompenseXpBossNiveauSorealIdle_(
              bossSelectionIndex,
              niveauEtat
            ) *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsEtat.metaNgu
                ).xpMultiplier,
                1
              )
            ) *
            facteurExpBossPerkSorealIdle_(
              idleNguBonuses(statsEtat.metaNgu),
              bossSelectionIndex
            )
          )
        ),

      xpBase:
        xpBossSorealIdle_(
          bossSelectionIndex
        ),

      xpMultiplicateur:
        Math.max(
          1,
          nombreSorealIdle_(
            idleNguBonuses(statsEtat.metaNgu).xpMultiplier,
            1
          )
        ),

      niveauRequis:1
    },

    progressionHorsLigne: {
      gainEnergie:
        progression
          ? nombreSorealIdle_(
              progression.gain,
              0
            )
          : 0,

      gainNetEnergie:
        progression
          ? nombreSorealIdle_(
              progression.gainNet,
              progression.gain
            )
          : 0,

      energieProduite:
        progression
          ? nombreSorealIdle_(
              progression.energieProduite,
              progression.gain
            )
          : 0,

      energieStockee:
        progression
          ? nombreSorealIdle_(
              progression.energieStockee,
              progression.gain
            )
          : 0,

      energiePerdueAuPlafond:
        progression
          ? nombreSorealIdle_(
              progression.energiePerdueAuPlafond,
              0
            )
          : 0,

      energieDepenseeAventure:
        progression
          ? nombreSorealIdle_(
              progression.energieDepenseeAventure,
              0
            )
          : 0,

      secondes:
        progression
          ? nombreSorealIdle_(
              progression
                .secondesComptabilisees,
              0
            )
          : 0,

      degats:
        progression
          ? nombreSorealIdle_(
              progression.degats,
              0
            )
          : 0,

      bossBattus:
        progression
          ? nombreSorealIdle_(
              progression.bossBattus,
              0
            )
          : 0,

      xpGagnee:
        progression
          ? nombreSorealIdle_(
              progression.xpGagnee,
              0
            )
          : 0,

      niveauxGagnes:
        progression
          ? nombreSorealIdle_(
              progression.niveauxGagnes,
              0
            )
          : 0,

      dropsRecents:
        progression &&
        Array.isArray(
          progression.dropsRecents
        )
          ? progression.dropsRecents
          : [],

      gainsMeta:
        progression &&
        progression.gainsMeta &&
        typeof progression.gainsMeta === "object"
          ? progression.gainsMeta
          : {},

      titansTues:
        progression &&
        Array.isArray(
          progression.titansTues
        )
          ? progression.titansTues
          : [],

      degatsRecus:
        progression
          ? nombreSorealIdle_(
              progression.degatsRecus,
              0
            )
          : 0,

      koSubis:
        progression
          ? nombreSorealIdle_(
              progression.koSubis,
              0
            )
          : 0,

      /*
       * Norman (2026-09-27) : « Quand on relance le jeu on doit avoir un résumé de ce qu'on a eu. EXP, AP,
       * Loot, ATTACK, DEFENSE... » -- l'AP gagné hors ligne (combats auto d'Aventure) manquait ici.
       */
      apGagne:
        progression
          ? nombreSorealIdle_(
              progression.apGagne,
              0
            )
          : 0
    }
  };
}

/* Étape extraite de construireEtatJoueurSorealIdle_ (découpage d'une très grande fonction, 2026-10-16) : 40 lignes. */
function construireEtatJoueurSorealIdle__o7(autoFarmAventureEtat){
  /* @obj */ return {
autoAventureHorsLigne:
      autoFarmAventureEtat
        ? (function(a){
            const victoires=Math.max(0,nombreSorealIdle_(a.kills,0));
            const d=a.derniereDefaite&&typeof a.derniereDefaite==="object"?a.derniereDefaite:null;
            const combats=victoires+(d?1:0);
            return {
              combats:combats,
              victoires:victoires,
              defaites:Math.max(0,combats-victoires),
              /*
               * Norman (2026-09-29) : « il devra pouvoir lire dans le journal de combat la manière dont il est
               * mort. » Le monstre/zone/type de LA dernière défaite (celle qui a arrêté le farm) : null si le
               * lot n'a comporté aucune défaite. Source : advanceAdventureZoneAutoFarmOfflineV1 (VRAI système
               * d'Aventure, idle-adventure-v47.js), voir le commentaire sur autoFarmAventureEtat plus haut.
               */
              derniereDefaite:d?{
                monstre:String(d.monstre||""),
                zone:String(d.zone||""),
                boss:Boolean(d.boss),
                ko:Boolean(d.ko)
              }:null
            };
          })(autoFarmAventureEtat)
        : null,

    syncSecondes:
      Math.max(
        5,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'Sauvegarde serveur (secondes)',
            15
          ),
          15
        )
      ),

    serveurTs:
      Date.now()
  };
}

export function construireEtatJoueurSorealIdle_(
  feuille,
  ligne,
  progression
) {
  /*>construireEtatJoueurSorealIdle__p1*//*>construireEtatJoueurSorealIdle__p3*/const __r3=construireEtatJoueurSorealIdle__p3(feuille, ligne);const __r1=__r3.__r1;const c=__r3.c;const row=__r3.row;const inventaireEtat=__r3.inventaireEtat;const collectionEtat=__r3.collectionEtat;const equipementBrutEtat=__r3.equipementBrutEtat;const defenseEtat=__r3.defenseEtat;const koSecondesRestantes=__r3.koSecondesRestantes;const dateDebutBrute=__r3.dateDebutBrute;const dateDebutMs=__r3.dateDebutMs;const ageMs=__r3.ageMs;const equipementEtat=__r3.equipementEtat;const capaciteInventaire=__r3.capaciteInventaire;const objetsDansSac=__r3.objetsDansSac;const setsEtat=__r3.setsEtat;const statsEtat=__r3.statsEtat;const statsBossEtat=__r3.statsBossEtat;const niveauEtat=__r3.niveauEtat;const bossVaincusEtat=__r3.bossVaincusEtat;const bossSelectionIndex=__r3.bossSelectionIndex;const attaqueBossSelection=__r3.attaqueBossSelection;const defenseBossSelection=__r3.defenseBossSelection;const progressionCollectionsEtat=__r3.progressionCollectionsEtat;const contexteMetaNguEtat=__r3.contexteMetaNguEtat;const metaNguEtat=__r3.metaNguEtat;const __r2=__r3.__r2;const autoFarmAventureEtat=__r3.autoFarmAventureEtat;const energieMetaEtat=__r3.energieMetaEtat;let apparenceNumeroEtat=__r3.apparenceNumeroEtat;/*<construireEtatJoueurSorealIdle__p3*//*<construireEtatJoueurSorealIdle__p2*/

  progressionCollectionsEtat.zones
    .forEach(function(zoneCollection) {
      if (!zoneCollection.complete) {
        return;
      }

      const set =
        setsSorealIdle_()
          .find(function(s) {
            return s.zoneId === zoneCollection.zoneId;
          });

      if (set) {
        apparenceNumeroEtat =
          Math.max(
            apparenceNumeroEtat,
            set.apparence
          );
      }
    });

  const reposListeEtat =
    reposSorealIdle_();

  const reposNumeroEtat =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          statsBossEtat.reposNumero,
          1
        )
      )
    );

  const reposEtat =
    reposListeEtat.find(
      function(r) {
        return r.numero === reposNumeroEtat;
      }
    ) ||
    reposListeEtat[0] ||
    {
      numero: 1,
      nom: 'Salle de repos 1',
      regenPctSec: 2.5,
      driveFileId: ''
    };

  const apparenceEtat =
    apparencesSorealIdle_()
      .find(function(a) {
        return a.numero === apparenceNumeroEtat;
      }) ||
    apparencesSorealIdle_()[0] ||
    {
      numero: 1,
      driveFileId: ''
    };

  const bossDefinitionEtat =
    definitionBossSorealIdle_(
      bossSelectionIndex
    );

  const productionSecondeEtat =
    Math.max(
      CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE,
      nombreSorealIdle_(
        row[c.PROD_SECONDE - 1],
        CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
      )
    );

  const metaTickEnergieEtat =
    metaTickEnergieSorealIdle_(
      productionSecondeEtat
    );

  const combatPrincipalEtat =
    statsCombatPrincipalSorealIdleV413_(
      statsEtat,
      inventaireEtat,
      equipementBrutEtat,
      row[
        c.AMELIORATIONS_JSON - 1
      ],
      row[
        c.ESSENCE_RENAISSANCE - 1
      ],
      collectionEtat,
      nombreSorealIdle_(row[c.BOSS_VAINCUS - 1], 0)
    );

  return {
    
    /*>construireEtatJoueurSorealIdle__o1*/...construireEtatJoueurSorealIdle__o1(c, combatPrincipalEtat, metaNguEtat, metaTickEnergieEtat, productionSecondeEtat, row, statsEtat),/*<construireEtatJoueurSorealIdle__o1*/
    /*>construireEtatJoueurSorealIdle__o2*/...construireEtatJoueurSorealIdle__o2(attaqueBossSelection, bossDefinitionEtat, bossSelectionIndex, c, defenseBossSelection, defenseEtat, metaNguEtat, progression, row, statsBossEtat),/*<construireEtatJoueurSorealIdle__o2*/
    /*>construireEtatJoueurSorealIdle__o3*/...construireEtatJoueurSorealIdle__o3(c, capaciteInventaire, collectionEtat, equipementEtat, inventaireEtat, koSecondesRestantes, metaNguEtat, objetsDansSac, progressionCollectionsEtat, row, statsEtat),/*<construireEtatJoueurSorealIdle__o3*/
    /*>construireEtatJoueurSorealIdle__o4*/...construireEtatJoueurSorealIdle__o4(ageMs, apparenceEtat, apparenceNumeroEtat, c, capaciteInventaire, dateDebutMs, equipementEtat, reposEtat, row, setsEtat, statsEtat),/*<construireEtatJoueurSorealIdle__o4*/
    /*>construireEtatJoueurSorealIdle__o5*/...construireEtatJoueurSorealIdle__o5(bossSelectionIndex, c, contexteMetaNguEtat, defenseEtat, metaNguEtat, niveauEtat, row),/*<construireEtatJoueurSorealIdle__o5*/
    /*>construireEtatJoueurSorealIdle__o6*/...construireEtatJoueurSorealIdle__o6(bossSelectionIndex, bossVaincusEtat, c, defenseEtat, metaNguEtat, niveauEtat, progression, row, statsEtat),/*<construireEtatJoueurSorealIdle__o6*/
    /*>construireEtatJoueurSorealIdle__o7*/...construireEtatJoueurSorealIdle__o7(autoFarmAventureEtat),/*<construireEtatJoueurSorealIdle__o7*/
  };
}

function recompensePiecesBossSorealIdle_(
  bossVaincusAvant
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincusAvant
        ).pieces,
        5
      )
    )
  );
}

export function calculerPiecesSorealIdle_(
  bossVaincus
) {
  const n =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    );

  let total = 0;

  for (
    let i = 0;
    i < n;
    i += 1
  ) {
    total +=
      recompensePiecesBossSorealIdle_(
        i
      );
  }

  return total;
}

function prochainBossSorealIdle_(
  bossVaincus
) {
  const prochainIndex =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    ) + 1;

  return {
    numero:
      prochainIndex + 1,

    nom:
      nomBossSorealIdle_(
        prochainIndex
      ),

    pv:
      pvMaxBossSorealIdle_(
        prochainIndex
      ),

    niveauRequis:
      niveauRequisBossSorealIdle_(
        prochainIndex
      )
  };
}

export function obtenirParametresEntrainementSorealIdle_() {
  return {
    force:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COEFFICIENT_FORCE',
            3
          ),
          3
        )
      ),

    endurance:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COEFFICIENT_ENDURANCE',
            2
          ),
          2
        )
      ),

    organisation:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COEFFICIENT_ORGANISATION',
            2
          ),
          2
        )
      )
  };
}

function coutEntrainementSorealIdle_(
  niveauActuel
) {
  const niveau =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          niveauActuel,
          1
        )
      )
    );

  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'COUT_ENTRAINEMENT_BASE',
          75
        ),
        75
      ) *
      niveau
    )
  );
}

export function ajouterCoutsEntrainementEtatSorealIdle_(
  etat
) {
  if (!etat) {
    return etat;
  }

  const coefficients =
    obtenirParametresEntrainementSorealIdle_();

  etat.entrainementMeta = {
    force:
      coefficients.force,
    endurance:
      coefficients.endurance,
    organisation:
      coefficients.organisation,
    pvParEndurance:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'PV_PAR_ENDURANCE',
            CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE
          ),
          CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE
        )
      ),
    defenseParEndurance:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'DEFENSE_PAR_ENDURANCE',
            CONFIG_SOREAL_IDLE.DEFENSE_PAR_ENDURANCE
          ),
          CONFIG_SOREAL_IDLE.DEFENSE_PAR_ENDURANCE
        )
      ),
    organisationEnergieMax:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'ORGANISATION_ENERGIE_MAX_PAR_NIVEAU',
            5
          ),
          5
        )
      ),
    organisationProdPct:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'ORGANISATION_PROD_PCT_PAR_NIVEAU',
            2
          ),
          2
        )
      ),
    coutBase:
      Math.max(
        1,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COUT_ENTRAINEMENT_BASE',
            75
          ),
          75
        )
      )
  };

  etat.combatRegles = {
    bossDegatsMinPct:
      nombreSorealIdle_(
        parametreSorealIdle_(
          'BOSS_DEGATS_MIN_PCT',
          CONFIG_SOREAL_IDLE
            .DEGATS_BOSS_MIN_PCT
        ),
        CONFIG_SOREAL_IDLE
          .DEGATS_BOSS_MIN_PCT
      ),
    bossRespawnSecondes:
      delaiRespawnBossSorealIdle_(
        Math.max(
          0,
          nombreSorealIdle_(
            etat.bossSelection,
            1
          ) - 1
        )
      )
  };

  etat.coutsEntrainement = {
    force:
      coutEntrainementSorealIdle_(
        etat.force
      ),

    endurance:
      coutEntrainementSorealIdle_(
        etat.endurance
      ),

    organisation:
      coutEntrainementSorealIdle_(
        etat.organisation
      )
  };

  return etat;
}
