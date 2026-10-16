/*
 * État, boutique et actions du joueur (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleNguResourceBudget, IDLE_NGU_META_VERSION, applyIdleNguAction, idleNguResourceGenerationPerSecond, rebirthIdleNguState } from "./idle-ngu-progression.js";
import { advanceBasicTrainingStateV411, applyBasicTrainingAllocationsV411, BASIC_TRAINING_V411, rebirthBasicTrainingStateV411 } from "./idle-basic-training.js";
import { assurerDonneesJeuSorealIdle_, exigerAccesSorealIdle_, obtenirFeuilleJoueursSorealIdle_, trouverLigneJoueurSorealIdle_, verifierAccesSorealIdle_ } from "./idle-runtime-acces.js";
import { LockService, SpreadsheetApp, __idleCtx } from "./idle-sqlite-runtime.js";
import { ameliorationsSorealIdle_, autoAvanceEntrainementSorealIdle_, bonusAmeliorationsSorealIdle_, coutAmeliorationSorealIdle_, initialiserModeleJoueurSorealIdleV41SiNecessaire_, niveauxParBarreEntrainementSorealIdle_ } from "./idle-runtime-aventure.js";
import { CONFIG_SOREAL_IDLE, nombreSorealIdle_ } from "./idle-runtime-config.js";
import { parserJsonSorealIdle_, statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { appliquerProgressionEnergieSorealIdle_, contexteMetaNguSorealIdle_ } from "./idle-runtime-progression.js";
import { ajouterCoutsEntrainementEtatSorealIdle_, construireEtatJoueurSorealIdle_ } from "./idle-runtime-etat.js";
import { definitionBossSorealIdle_, nomBossSorealIdle_, pvMaxBossSorealIdle_, recalculerPuissanceCompleteSorealIdle_ } from "./idle-runtime-boss.js";

/**
 * V40.8 — endpoint public autonome.
 *
 * Le Game expose désormais lui-même obtenirEtatSorealIdle().
 * Ainsi le lancement ne dépend plus de la version du Loader installée.
 * Un Loader V2.2 qui expose aussi ce nom reste compatible : les deux
 * implémentations routent vers la même fonction interne.
 */
export function obtenirEtatSorealIdle(
  sessionToken
) {
  return obtenirEtatSorealIdleGameV40_(
    sessionToken,
    {stopBossOnOpen:true}
  );
}

function obtenirEtatSorealIdleGameV40_(
  sessionToken,
  options
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  /*
   * Au premier chargement, Apps Script peut encore terminer une ancienne
   * opération IDLE. Ce n'est pas une erreur fatale.
   * On attend davantage et, si le verrou reste pris, le client retente.
   */
  /*
   * V40.6 — le verrou serveur ne doit plus devenir un faux temps
   * de chargement. On sonde brièvement puis le launcher retente
   * automatiquement avec le même écran de chargement.
   */
  if (!lock.tryLock(120)) {
    return {
      ok: false,
      autorise: true,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      retryAfterMs: 220,
      message:
        'Finalisation des données SOREAL IDLE…'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    initialiserModeleJoueurSorealIdleV41SiNecessaire_(
      feuille,
      ligne
    );

    /*
     * V206 — ouvrir/recharger SOREAL IDLE ne reprend jamais un Fight Boss
     * abandonné dans un ancien onglet/WebView. Le combat doit repartir
     * uniquement après un nouveau clic explicite sur Fight.
     *
     * Important : on coupe l'ancien flag AVANT de rejouer le temps écoulé,
     * sinon une session fermée avec combatBossActif=true pouvait tuer le
     * boss suivant pendant l'écran de chargement.
     */
    if(options&&options.stopBossOnOpen){
      const c=CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
      const statsOuverture=statsJoueurSorealIdle_(
        feuille.getRange(ligne,c.STATS_JSON).getValue()
      );
      if(statsOuverture.combatBossActif){
        statsOuverture.combatBossActif=false;
        statsOuverture.bossStunJusqua=0;
        statsOuverture.bossVulnerableJusqua=0;
        statsOuverture.bossVulnerablePct=0;
        statsOuverture.sceauBriseBossNumero=0;
        feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(statsOuverture));
        feuille.getRange(ligne,c.DERNIERE_SYNCHRO).setValue(new Date());
      }
    }

    const progression =
      appliquerProgressionEnergieSorealIdle_(
        feuille,
        ligne
      );

    return {
      ok: true,
      autorise: true,
      version:
        CONFIG_SOREAL_IDLE.VERSION,

      patchRuntime:
        'GAME-V47-NGU-EARLY',

      joueur:
        ajouterCoutsEntrainementEtatSorealIdle_(
          construireEtatJoueurSorealIdle_(
            feuille,
            ligne,
            progression
          )
        )
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Synchronisation volontaire.
 *
 * Pour V2, le client n'envoie PAS son énergie :
 * le serveur recalcule lui-même le temps écoulé.
 * Cela évite qu'une valeur modifiée dans le navigateur
 * soit enregistrée dans la feuille.
 */
export function synchroniserSorealIdle(
  sessionToken
) {
  return obtenirEtatSorealIdleGameV40_(
    sessionToken,
    {stopBossOnOpen:false}
  );
}

function reponseOccupeeSorealIdleV60_() {
  return {
    ok: false,
    code: 'SOREAL_IDLE_OCCUPE',
    retryable: true,
    message:
      'Le moteur traite encore une action.'
  };
}

/*
 * Audit 2026-09-16 : dans le vrai NGU Idle, l'équipement/loot n'existe
 * QUE dans Adventure Mode -- le combat de boss numéroté (Fight Boss/
 * Basic Training) n'a AUCUN objet équipé dans le vrai jeu. Désactivée
 * pour une fidélité NGU totale (décision de Norman, 2026-09-16), même
 * patron que les 7 autres mécaniques de loot déjà désactivées ici. Les
 * objets déjà équipés/l'inventaire existant restent en l'état (gel
 * propre, aucune donnée supprimée), simplement plus modifiables ni
 * lus par le calcul de combat (voir statsCombatPrincipalSorealIdleV413_).
 */
export function equiperObjetsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

/*
 * Audit 2026-09-16 : même décision que equiperObjetsSorealIdle ci-dessus
 * -- pas déquivalent NGU pour la fusion d’équipement Fight Boss.
 */
export function fusionnerObjetsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function obtenirEtatBoutiqueSorealIdle(
  sessionToken
) {
  const acces=
    exigerAccesSorealIdle_(
      sessionToken
    );

  const feuille=
    obtenirFeuilleJoueursSorealIdle_();

  const ligne=
    trouverLigneJoueurSorealIdle_(
      feuille,
      acces
    );

  const c=
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row=
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.AMELIORATIONS_JSON
      )
      .getValues()[0];

  const ameliorations=
    ameliorationsSorealIdle_(
      row[
        c.AMELIORATIONS_JSON-1
      ]
    );

  return {
    ok:true,
    pieces:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.PIECES-1],
            0
          )
        )
      ),
    ameliorations:
      Object.assign(
        {},
        ameliorations
      ),
    coutsBoutique:{
      production:
        coutAmeliorationSorealIdle_(
          'production',
          ameliorations.production
        ),
      capacite:
        coutAmeliorationSorealIdle_(
          'capacite',
          ameliorations.capacite
        ),
      puissance:
        coutAmeliorationSorealIdle_(
          'puissance',
          ameliorations.puissance
        )
    },

    /*
     * Valeurs dérivées autoritaires pour la réconciliation ciblée APP.
     * L'interface ne doit pas reconstruire Organisation/Renaissance/sets.
     */
    energie:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.ENERGIE-1],
          0
        )
      ),
    energieMax:
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.ENERGIE_MAX-1],
          CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE
        )
      ),
    productionSeconde:
      Math.max(
        0.01,
        nombreSorealIdle_(
          row[c.PROD_SECONDE-1],
          CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
        )
      ),
    puissance:
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.PUISSANCE-1],
          1
        )
      ),
    bonusBoutique:
      bonusAmeliorationsSorealIdle_(
        ameliorations
      )
  };
}

export function acheterAmeliorationsSorealIdle(
  sessionToken,
  demandes
) {
  void sessionToken;
  void demandes;
  return {
    ok:false,
    code:'SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED',
    message:'Cette ancienne boutique est désactivée. Utilise Spend EXP du moteur NGU.'
  };
}

export function ameliorerEquipementsForgeSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function agrandirInventairePlusieursSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

/**
 * Sauvegarde la disposition visuelle du sac.
 * Les cases vides sont conservées.
 */
export function sauvegarderDispositionInventaireSorealIdle(
  sessionToken,
  cases
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(8000)) {
    return reponseOccupeeSorealIdleV60_();
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const inventaire =
      parserJsonSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.INVENTAIRE_JSON
          )
          .getValue(),
        []
      );

    const equipement =
      parserJsonSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.EQUIPEMENT_JSON
          )
          .getValue(),
        {}
      );

    const capacite =
      Math.max(
        CONFIG_SOREAL_IDLE
          .INVENTAIRE_CAPACITE_BASE,
        Math.floor(
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.INVENTAIRE_CAPACITE
              )
              .getValue(),
            CONFIG_SOREAL_IDLE
              .INVENTAIRE_CAPACITE_BASE
          )
        )
      );

    const idsEquipes =
      Object.keys(
        equipement || {}
      )
        .map(function(slot) {
          return String(
            equipement[slot] || ''
          );
        })
        .filter(Boolean);

    const objetsSac =
      inventaire.filter(
        function(objet) {
          return (
            objet &&
            idsEquipes.indexOf(
              String(
                objet.id || ''
              )
            ) === -1
          );
        }
      );

    const parId = {};

    objetsSac.forEach(
      function(objet) {
        parId[
          String(
            objet.id || ''
          )
        ] = objet;
      }
    );

    const vus = {};
    const positionsUtilisees = {};

    (
      Array.isArray(cases)
        ? cases.slice(
            0,
            capacite
          )
        : []
    )
      .forEach(function(id,index) {
        const cle =
          String(id || '');

        if (
          !cle ||
          !parId[cle] ||
          vus[cle]
        ) {
          return;
        }

        const position =
          index + 1;

        parId[cle].positionSac =
          position;

        vus[cle] = true;
        positionsUtilisees[
          position
        ] = true;
      });

    let prochainePosition = 1;

    objetsSac.forEach(
      function(objet) {
        const id =
          String(
            objet.id || ''
          );

        if (vus[id]) {
          return;
        }

        while (
          prochainePosition <=
            capacite &&
          positionsUtilisees[
            prochainePosition
          ]
        ) {
          prochainePosition += 1;
        }

        if (
          prochainePosition <=
          capacite
        ) {
          objet.positionSac =
            prochainePosition;

          positionsUtilisees[
            prochainePosition
          ] = true;

          prochainePosition += 1;
        }
      }
    );

    feuille
      .getRange(
        ligne,
        c.INVENTAIRE_JSON
      )
      .setValue(
        JSON.stringify(
          inventaire
        )
      );

    SpreadsheetApp.flush();

    return {
      ok: true
    };
  } finally {
    lock.releaseLock();
  }
}

export function testerAccesSorealIdle(
  sessionToken
) {
  const acces =
    verifierAccesSorealIdle_(
      sessionToken
    );

  return {
    ok:
      Boolean(acces.ok),

    autorise:
      Boolean(
        acces.autorise
      ),

    raison:
      String(
        acces.raison || ''
      ),

    prenom:
      acces.user
        ? String(
            acces.user.prenom ||
            ''
          )
        : '',

    email:
      acces.user
        ? String(
            acces.user.email ||
            ''
          )
        : '',

    emailConnexion:
      acces.user
        ? String(
            acces.user
              .emailConnexion ||
            ''
          )
        : ''
  };
}

/*
 * Audit 2026-09-17 (grand nettoyage) : appliquerAchatsEntrainementsSorealIdle_
 * (ancien modèle "acheter un niveau à la fois" en Force/Endurance/
 * Organisation) n'avait plus aucun appelant dans tout le dépôt --
 * entièrement remplacé par le modèle d'allocation en pourcentage
 * (applyBasicTrainingAllocationsV411, appelé par
 * definirAllocationsEntrainementSorealIdle ci-dessous). Supprimée.
 */
export function definirAllocationsEntrainementSorealIdle(
  sessionToken,
  allocations
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(2500)) {
    return reponseOccupeeSorealIdleV60_();
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    initialiserModeleJoueurSorealIdleV41SiNecessaire_(
      feuille,
      ligne
    );

    appliquerProgressionEnergieSorealIdle_(
      feuille,
      ligne
    );

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

    const stats =
      statsJoueurSorealIdle_(
        row[c.STATS_JSON - 1]
      );

    const budgetMetaEnergie = idleNguResourceBudget(
      stats.metaNgu,
      "energy",
      {}
    );
    const reserveMetaEnergie = Math.max(
      0,
      nombreSorealIdle_(budgetMetaEnergie.allocated,0)
    );

    /* L'entraînement est amené à l'instant présent AVANT d'appliquer la répartition : sinon les déblocages se jugeaient sur le dernier chiffre de la synchro (de quelques secondes en retard). */
    const autoAvance = autoAvanceEntrainementSorealIdle_(stats);
    stats.entrainementBase =
      advanceBasicTrainingStateV411(
        stats.entrainementBase,
        Date.now(),
        CONFIG_SOREAL_IDLE.PROGRESSION_HORS_LIGNE_MAX_SECONDES,
        niveauxParBarreEntrainementSorealIdle_(stats),
        { autoAdvance: autoAvance }
      ).state;

    const resultat =
      applyBasicTrainingAllocationsV411(
        stats.entrainementBase,
        allocations,
        Math.max(0,nombreSorealIdle_(row[c.ENERGIE - 1],0)),
        Math.max(0,nombreSorealIdle_(row[c.ENERGIE_MAX - 1],0)-reserveMetaEnergie),
        { autoAdvance: autoAvance }
      );

    stats.modeleJeuVersion =
      BASIC_TRAINING_V411.version;

    stats.entrainementBase =
      resultat.state;

    if(
      stats.metaNgu&&
      stats.metaNgu.version===IDLE_NGU_META_VERSION&&
      stats.metaNgu.resources&&
      stats.metaNgu.resources.energy
    ){
      stats.metaNgu.resources.energy.current=Math.max(0,nombreSorealIdle_(resultat.idleEnergy,0));
      /*
       * 2026-09-23 (audit NGU) : ne PAS remettre fillProgress à 0. Chaque
       * changement d'allocation effaçait la fraction de barre d'énergie déjà
       * remplie (jusqu'à 1 unité de régénération perdue par clic) ; le vrai
       * jeu conserve la progression de la barre.
       */
    }

    feuille
      .getRange(
        ligne,
        c.ENERGIE
      )
      .setValue(
        resultat.idleEnergy
      );

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          stats
        )
      );

    SpreadsheetApp.flush();

    return {
      ok:true,
      energieIdle:
        resultat.idleEnergy,
      energieAllouee:
        resultat.allocated,
      joueur:
        ajouterCoutsEntrainementEtatSorealIdle_(
          construireEtatJoueurSorealIdle_(
            feuille,
            ligne,
            {
              gain:0,
              secondesComptabilisees:0,
              degats:0,
              bossBattus:0,
              xpGagnee:0,
              niveauxGagnes:0,
              dropsRecents:[]
            }
          )
        )
    };
  } finally {
    lock.releaseLock();
  }
}

export function acheterEntrainementsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function acheterEntrainementSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

/**
 * Action générique pour la métaprogression V42.
 */
/*
 * Actions d'Aventure RÉSERVÉES aux tests et à l'outillage interne : jamais acceptées depuis un client (audit du 2026-10-10, IDLE-AUDIT-SEC-001). « addItem » fabriquait n'importe quel objet de n'importe quel niveau pour
 * n'importe quel joueur ; le client de production ne l'appelle jamais (les tests passent par applyIdleNguAction, directement, sans cette porte).
 */
/*
 * « zoneKill » (IDLE-AUDIT-SEC-003) : tuait un mob sans combat ni durée : 300 appels = 300 butins. Le client de production ne l'envoie jamais (il passe par startZoneFight puis resolveZoneFight, seuls chemins gardés) ; réservé comme addItem.
 * Reste ouvert (décision de conception) : resolveZoneFight lui-même fait confiance au client sur l'issue du combat (le serveur ne simule pas les combats de zone) ; la limitation de débit par session borne seulement la cadence.
 */
const ACTIONS_AVENTURE_RESERVEES_V1 = new Set(["addItem", "zoneKill"]);

function assainirActionClientSorealIdleV1_(action) {
  const a = action && typeof action === 'object' ? action : {};
  const adv = a.adventure && typeof a.adventure === 'object' ? a.adventure : null;
  if (adv) {
    const nom = String(adv.action || adv.mode || '');
    if (ACTIONS_AVENTURE_RESERVEES_V1.has(nom)) throw new Error('SOREAL_IDLE_ACTION_RESERVEE');
    /*
     * Les statistiques de combat sont CELLES DU SERVEUR (ctx.adventureStats, calculées d'après l'équipement et les bonus) : un client n'impose jamais les siennes (audit du 2026-10-10, IDLE-AUDIT-SEC-002 : des stats
     * gonflées passaient devant le calcul serveur et franchissaient la barrière de puissance des titans). Le client de production n'envoie d'ailleurs aucun champ « stats ».
     */
    if (Object.prototype.hasOwnProperty.call(adv, 'stats')) {
      const copie = Object.assign({}, adv);
      delete copie.stats;
      return Object.assign({}, a, { adventure: copie });
    }
  }
  return a;
}

export function agirProgressionSorealIdle(
  sessionToken,
  action
) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return reponseOccupeeSorealIdleV60_();

  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille,acces);
    appliquerProgressionEnergieSorealIdle_(feuille,ligne);

    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const row = feuille.getRange(ligne,1,1,c.STATS_JSON).getValues()[0];
    const stats = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
    const collection = parserJsonSorealIdle_(row[c.COLLECTION_JSON - 1],{});
    const contexte = contexteMetaNguSorealIdle_(row,stats,collection);

    const applique = applyIdleNguAction(
      stats.metaNgu,
      assainirActionClientSorealIdleV1_(action),
      contexte,
      Date.now()
    );

    stats.metaNgu = applique.state;

    /*
     * EXP Shop : metaNgu.currencies.experience est la source de vérité.
     * La colonne historique XP n'est plus qu'un miroir de compatibilité ;
     * on la resynchronise dans LA MÊME opération que tout achat/récompense
     * meta afin qu'une valeur ancienne ne puisse jamais être réimportée
     * lors d'un appel ultérieur. Cela couvre buyResource, Newbie Offers
     * et tout autre achat du Spend EXP sans logique spéciale par bouton.
     */
    const experienceMetaAction=Math.max(
      0,
      nombreSorealIdle_(
        stats.metaNgu &&
          stats.metaNgu.currencies &&
          stats.metaNgu.currencies.experience,
        0
      )
    );
    row[c.XP - 1]=experienceMetaAction;
    feuille
      .getRange(
        ligne,
        c.XP
      )
      .setValue(
        experienceMetaAction
      );

    /* Rejeu d'un clientMutationId déjà appliqué : le résultat mémorisé est renvoyé, mais aucun effet de bord n'est rejoué. */
    const rejeuMutation=Boolean(applique.duplicate);
    /*
     * Wiki NGU, page Challenges : « Starting any challenge will perform a rebirth » (le Laser Sword Challenge aussi : « performs a rebirth but does
     * not reset your number »). Le lancement d'un défi doit donc avoir les MÊMES effets de run qu'un Rebirth (Norman, 2026-10-02 : « quand je lance un
     * défi, ça devrait me faire renaître normalement mais pas ici ») : boss du run, Basic Training, ET Adventure qui repart en Safe Zone sans combat
     * automatique (invariant V186), PV du joueur remis au maximum. Avant : seuls les défis qui remettent le NUMBER à 1 réinitialisaient ces colonnes,
     * et jamais l'Aventure ni les PV ; le Laser Sword ne réinitialisait rien côté run.
     */
    const defiLance=Boolean(!rejeuMutation&&applique.result&&(applique.result.challengeReset||(action&&action.action==='challenge'&&applique.result.started)));
    if(defiLance){
      const maintenantDefi=Date.now();
      if(stats.metaNgu&&stats.metaNgu.adventure&&typeof stats.metaNgu.adventure==='object'){
        stats.metaNgu.adventure.selectedZone='safe';
        stats.metaNgu.adventure.retourSafe={raison:'defi',detail:'Un défi vient de commencer : ton run repart du début',at:Date.now()};
        stats.metaNgu.adventure.fight={active:false,zone:'',monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};
      }
      stats.autoAventure=false;
      stats.autoAventureZone=0;
      stats.bestiaireBossRunVersionV207=207;
      stats.bestiaireBossRunMaxNumeroV207=0;
      stats.entrainementBase=rebirthBasicTrainingStateV411(
        stats.entrainementBase,
        maintenantDefi
      );
      stats.modeleJeuVersion=BASIC_TRAINING_V411.version;
      stats.combatBossActif=false;
      stats.bossSelection=1;
      stats.bossRespawnJusqua=0;
      row[c.NIVEAU-1]=1;
      row[c.BOSS_VAINCUS-1]=0;
      row[c.BOSS_ACTUEL-1]=nomBossSorealIdle_(0);
      /*
       * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
       * stats.metaNgu vient d'être remplacé par applique.state (ligne
       * ci-dessus) -- reflète déjà la NOUVELLE difficulté si ce reset
       * provient d'un changement de difficulté (difficultyAction,
       * idle-ngu-progression.js), pas l'ancienne.
       */
      row[c.BOSS_PV_MAX-1]=pvMaxBossSorealIdle_(0,stats.metaNgu&&stats.metaNgu.difficulty);
      row[c.BOSS_PV-1]=row[c.BOSS_PV_MAX-1];
      feuille.getRange(ligne,c.NIVEAU).setValue(1);
      feuille.getRange(ligne,c.BOSS_VAINCUS).setValue(0);
      feuille.getRange(ligne,c.BOSS_ACTUEL).setValue(row[c.BOSS_ACTUEL-1]);
      feuille.getRange(ligne,c.BOSS_PV_MAX).setValue(row[c.BOSS_PV_MAX-1]);
      feuille.getRange(ligne,c.BOSS_PV).setValue(row[c.BOSS_PV-1]);
      try{feuille.getRange(ligne,c.KO_JUSQUA).clearContent();}catch(e){}
    }

    const energieMetaAction=stats.metaNgu.resources&&stats.metaNgu.resources.energy
      ?stats.metaNgu.resources.energy
      :null;
    if(energieMetaAction){
      row[c.ENERGIE - 1]=Math.max(0,nombreSorealIdle_(energieMetaAction.current,0));
      row[c.ENERGIE_MAX - 1]=Math.max(0,nombreSorealIdle_(energieMetaAction.cap,0));
      row[c.PROD_SECONDE - 1]=Math.max(0,idleNguResourceGenerationPerSecond(stats.metaNgu,"energy"));
      feuille.getRange(ligne,c.ENERGIE).setValue(row[c.ENERGIE - 1]);
      feuille.getRange(ligne,c.ENERGIE_MAX).setValue(row[c.ENERGIE_MAX - 1]);
      feuille.getRange(ligne,c.PROD_SECONDE).setValue(row[c.PROD_SECONDE - 1]);
    }

    if (
      !rejeuMutation &&
      applique.result &&
      applique.result.materialsRequested
    ) {
      const courant = Math.max(0,nombreSorealIdle_(row[c.MATERIAUX - 1],0));
      feuille.getRange(ligne,c.MATERIAUX).setValue(
        Math.max(0,courant-applique.result.materialsRequested)
      );
    }

    feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(stats));
    recalculerPuissanceCompleteSorealIdle_(feuille,ligne);
    if(defiLance){
      /* Comme après un Rebirth : le joueur repart avec tous ses PV. */
      const pvMaxDefi=Math.max(1,nombreSorealIdle_(feuille.getRange(ligne,c.PV_JOUEUR_MAX).getValue(),1));
      feuille.getRange(ligne,c.PV_JOUEUR).setValue(pvMaxDefi);
    }
    feuille.getRange(ligne,c.DERNIERE_SYNCHRO).setValue(new Date());
    SpreadsheetApp.flush();

    return {
      ok:true,
      resultat:applique.result || {},
      joueur:ajouterCoutsEntrainementEtatSorealIdle_(
        construireEtatJoueurSorealIdle_(feuille,ligne,{
          gain:0,
          secondesComptabilisees:0,
          degats:0,
          bossBattus:0,
          xpGagnee:0,
          niveauxGagnes:0,
          dropsRecents:[]
        })
      )
    };
  } catch (erreur) {
    /*
     * Des setValue ont pu être faits avant l'exception : l'opération a échoué, donc AUCUNE écriture partielle
     * ne doit être committée (la réponse ok:false vue par le client ne change pas).
     */
    if (__idleCtx.__idleWorkbook) {
      for (const feuilleSale of __idleCtx.__idleWorkbook.sheets.values()) feuilleSale.dirtyRows.clear();
    }
    return {
      ok:false,
      code:'ERREUR_META_PROGRESSION',
      message:erreur&&erreur.message?String(erreur.message):'Action impossible.'
    };
  } finally {
    lock.releaseLock();
  }
}

export function acheterAmeliorationSorealIdle(
  sessionToken,
  type
) {
  void sessionToken;
  void type;
  return {
    ok:false,
    code:'SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED',
    message:'Cette ancienne boutique est désactivée. Utilise Spend EXP du moteur NGU.'
  };
}

export function acheterSortsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function acheterSortSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function lancerSortSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulte` (2e paramètre, optionnel) : wiki NGU, "at the bottom of the
 * rebirth screen, there is a choice of Normal, Evil difficulty or
 * Sadistic" -- le vrai jeu propose ce choix DANS le même clic Rebirth,
 * jamais une action séparée. Absent/omis = comportement strictement
 * inchangé (Rebirth normal, difficulté actuelle conservée).
 */
export function renaitreSorealIdle(
  sessionToken,
  difficulte
) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    return {
      ok:false,
      code:'SOREAL_IDLE_OCCUPE',
      retryable:true,
      message:'Le moteur termine encore une action.'
    };
  }

  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille,acces);
    initialiserModeleJoueurSorealIdleV41SiNecessaire_(feuille,ligne);
    appliquerProgressionEnergieSorealIdle_(feuille,ligne);

    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const row = feuille.getRange(ligne,1,1,c.STATS_JSON).getValues()[0];
    const stats = statsJoueurSorealIdle_(row[c.STATS_JSON-1]);
    const collection = parserJsonSorealIdle_(row[c.COLLECTION_JSON-1],{});
    const contexte = contexteMetaNguSorealIdle_(row,stats,collection);
    const maintenant = Date.now();

    try {
      stats.metaNgu = rebirthIdleNguState(
        stats.metaNgu,
        contexte,
        maintenant,
        { difficulty: difficulte }
      );
    } catch (erreurRebirth) {
      const codeErreurRebirth = String(erreurRebirth && erreurRebirth.message || erreurRebirth);
      if (codeErreurRebirth === 'REBIRTH_TROP_TOT') {
        return {
          ok:false,
          code:'REBIRTH_TROP_TOT',
          message:'Un Rebirth demande au moins 3 minutes de run.',
          joueur:ajouterCoutsEntrainementEtatSorealIdle_(
            construireEtatJoueurSorealIdle_(feuille,ligne,null)
          )
        };
      }
      /*
       * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
       * Même traitement que REBIRTH_TROP_TOT ci-dessus : un choix de
       * difficulté non débloquée ne doit jamais planter la requête, juste
       * renvoyer un état joueur inchangé avec un code exploitable côté
       * client (cf. idleNguDifficultyUnlockRequirementsV1 pour savoir quelle
       * condition manque encore).
       */
      if (codeErreurRebirth === 'DIFFICULTE_VERROUILLEE') {
        return {
          ok:false,
          code:'DIFFICULTE_VERROUILLEE',
          message:'Les conditions de déblocage de cette difficulté ne sont pas encore réunies.',
          joueur:ajouterCoutsEntrainementEtatSorealIdle_(
            construireEtatJoueurSorealIdle_(feuille,ligne,null)
          )
        };
      }
      throw erreurRebirth;
    }

    /*
     * V186 — après chaque Rebirth, Adventure repart obligatoirement dans
     * la Safe Zone et n'engage AUCUN combat tout seul. La progression,
     * l'inventaire et les déblocages persistent ; seule la position/instance
     * de combat du run courant est remise au repos.
     */
    if(
      stats.metaNgu &&
      stats.metaNgu.adventure &&
      typeof stats.metaNgu.adventure==='object'
    ){
      stats.metaNgu.adventure.selectedZone='safe';
      stats.metaNgu.adventure.retourSafe={raison:'renaissance',detail:'Renaissance : ton run repart du début',at:Date.now()};
      stats.metaNgu.adventure.fight={
        active:false,
        zone:'',
        monsterHp:0,
        monsterHpMax:0,
        boss:false,
        playerHp:0,
        playerHpMax:0
      };
    }
    stats.autoAventure=false;
    stats.autoAventureZone=0;

    stats.bestiaireBossRunVersionV207=207;
    stats.bestiaireBossRunMaxNumeroV207=0;

    stats.entrainementBase = rebirthBasicTrainingStateV411(
      stats.entrainementBase,
      maintenant
    );
    stats.modeleJeuVersion = BASIC_TRAINING_V411.version;

    const boss = definitionBossSorealIdle_(0, stats.metaNgu && stats.metaNgu.difficulty);
    const energieDepart = Math.max(0,CONFIG_SOREAL_IDLE.ENERGIE_BASE);

    /*
     * Les anciennes colonnes Niveau/Renaissances restent uniquement comme
     * shim de stockage SQLite pendant le nettoyage du schéma. Elles ne sont
     * plus une mécanique de progression et ne produisent aucun bonus.
     */
    feuille.getRange(ligne,c.NIVEAU).setValue(1);
    feuille.getRange(ligne,c.XP).setValue(0);
    /*
     * Insta Training Cap (Boutique AP ; Norman, 2026-10-12) : « This upgrade will assign 6 energy, 1 for each training, almost immediately into each rebirth. » (wiki NGU Idle, 4G's Sellout Shop). Dès le Rebirth, 1 d'énergie
     * est placée sur chaque entraînement déjà ouvert (au plus 6, un par compétence) ; le reste de l'énergie de départ reste libre.
     */
    let energieLibreDepart = energieDepart;
    if (stats.metaNgu && stats.metaNgu.selloutShop && stats.metaNgu.selloutShop.purchases && stats.metaNgu.selloutShop.purchases.instaTrainingCap) {
      const voulu = {};
      for (const def of BASIC_TRAINING_V411.skills) voulu[def.id] = 1;
      const insta = applyBasicTrainingAllocationsV411(stats.entrainementBase, voulu, energieDepart, energieDepart, {});
      stats.entrainementBase = insta.state;
      energieLibreDepart = Math.max(0, nombreSorealIdle_(insta.idleEnergy, 0));
    }
    feuille.getRange(ligne,c.ENERGIE).setValue(energieLibreDepart);
    feuille.getRange(ligne,c.BOSS_ACTUEL).setValue(boss.nom);
    feuille.getRange(ligne,c.BOSS_PV).setValue(boss.pv);
    feuille.getRange(ligne,c.BOSS_PV_MAX).setValue(boss.pv);
    feuille.getRange(ligne,c.BOSS_VAINCUS).setValue(0);
    feuille.getRange(ligne,c.RENAISSANCES).setValue(
      Math.max(0,nombreSorealIdle_(stats.metaNgu && stats.metaNgu.records && stats.metaNgu.records.totalRebirths,0))
    );
    feuille.getRange(ligne,c.ESSENCE_RENAISSANCE).setValue(0);
    feuille.getRange(ligne,c.KO_JUSQUA).clearContent();
    feuille.getRange(ligne,c.DERNIERE_SYNCHRO).setValue(new Date(maintenant));
    feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(stats));

    /*
     * Correctif 2026-09-14 (Norman : "quand on rebirth, la barre energie
     * tique toujours 1 fois par seconde. Dans NGU, quand on rebirth, elle
     * tique de plus en plus vite") — la vraie Energy Speed/Bars NGU
     * (state.metaNgu.resources.energy) survit bien à un Rebirth (seul le
     * point courant se remet à 0, jamais la vitesse achetée avec l'EXP —
     * confirmé wiki NGU, page Energy). Mais la colonne héritée PROD_SECONDE
     * (utilisée par le client pour animer la vitesse RÉELLE de la barre,
     * cf. metaTickEnergieSorealIdle_ ci-dessus) n'était jamais recalculée
     * ni réécrite ici après un Rebirth — contrairement à agirProgressionSorealIdle
     * (le chemin générique des autres actions NGU), qui le fait déjà à
     * chaque appel. Elle restait donc figée à sa valeur d'AVANT le
     * Rebirth, faisant croire que la vitesse retombait à 1 tick/seconde à
     * chaque Renaissance alors que la vraie vitesse achetée était intacte.
     * energieMax était logé au même défaut (ENERGIE_BASE fixe, jamais le
     * vrai cap NGU qui grandit naturellement à chaque Rebirth — voir
     * applyNaturalEnergyCapGrowthOnRebirth, idle-ngu-progression.js).
     */
    const energieMetaApresRenaissance=stats.metaNgu.resources&&stats.metaNgu.resources.energy
      ?stats.metaNgu.resources.energy
      :null;
    if(energieMetaApresRenaissance){
      const energieMaxApresRenaissance=Math.max(0,nombreSorealIdle_(energieMetaApresRenaissance.cap,0))||energieDepart;
      feuille.getRange(ligne,c.ENERGIE_MAX).setValue(energieMaxApresRenaissance);
      feuille.getRange(ligne,c.PROD_SECONDE).setValue(
        Math.max(0,idleNguResourceGenerationPerSecond(stats.metaNgu,"energy"))
      );
    }

    recalculerPuissanceCompleteSorealIdle_(feuille,ligne);
    const pvMax = Math.max(1,nombreSorealIdle_(feuille.getRange(ligne,c.PV_JOUEUR_MAX).getValue(),1));
    feuille.getRange(ligne,c.PV_JOUEUR).setValue(pvMax);
    SpreadsheetApp.flush();

    const joueur = ajouterCoutsEntrainementEtatSorealIdle_(
      construireEtatJoueurSorealIdle_(
        feuille,
        ligne,
        {
          gain:0,
          secondesComptabilisees:0,
          degats:0,
          degatsRecus:0,
          koSubis:0,
          bossBattus:0,
          xpGagnee:0,
          niveauxGagnes:0,
          dropsRecents:[]
        }
      )
    );

    return {
      ok:true,
      number:stats.metaNgu && stats.metaNgu.rebirth ? stats.metaNgu.rebirth.number : 1,
      nextNumber:stats.metaNgu && stats.metaNgu.rebirth ? stats.metaNgu.rebirth.nextNumber : 1,
      joueur:joueur
    };
  } catch (erreur) {
    /* audit 2026-10-13 : comme pour la méta-progression, une Renaissance en échec ne committe AUCUNE écriture partielle (la réponse ok:false ne doit pas laisser un état à moitié modifié) */
    if (__idleCtx.__idleWorkbook) {
      for (const feuilleSale of __idleCtx.__idleWorkbook.sheets.values()) feuilleSale.dirtyRows.clear();
    }
    return {
      ok:false,
      code:'ERREUR_REBIRTH_V47',
      message:erreur && erreur.message ? String(erreur.message) : 'Erreur pendant le Rebirth.'
    };
  } finally {
    lock.releaseLock();
  }
}

export function recyclerObjetSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function recyclerObjetsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function fusionnerObjetSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function ameliorerEquipementForgeSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function agrandirInventaireSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function definirCombatAutoAventureSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}

export function combattreAventureSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}
