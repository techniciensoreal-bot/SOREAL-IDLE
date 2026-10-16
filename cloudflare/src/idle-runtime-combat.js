/*
 * Combats de boss, NUKE, marquages et clics (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleNguBonuses } from "./idle-ngu-progression.js";
import { assurerDonneesJeuSorealIdle_, exigerAccesSorealIdle_, obtenirFeuilleJoueursSorealIdle_, trouverLigneJoueurSorealIdle_ } from "./idle-runtime-acces.js";
import { LockService, SpreadsheetApp } from "./idle-sqlite-runtime.js";
import { CONFIG_SOREAL_IDLE, bossParMondeSorealIdle_, nombreSorealIdle_ } from "./idle-runtime-config.js";
import { appliquerProgressionEnergieSorealIdle_ } from "./idle-runtime-progression.js";
import { marquerRencontreBossPrincipalUneFoisParRunV207_, parserJsonSorealIdle_, statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { attaqueBossSorealIdle_, defenseBossSorealIdle_, definitionBossSorealIdle_, enregistrerBossJamaisVaincuSorealIdle_, highestBossJamaisAtteintSorealIdle_, niveauRequisBossSorealIdle_, nomBossSorealIdle_, recompenseXpBossNiveauSorealIdle_, xpBonusPremiereFoisSorealIdle_ } from "./idle-runtime-boss.js";
import { ajouterCoutsEntrainementEtatSorealIdle_, construireEtatJoueurSorealIdle_ } from "./idle-runtime-etat.js";

export function definirCombatBossSorealIdle(
  sessionToken,
  actif,
  raison,
  snapshot
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
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

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    /*
     * Rejouer TOUJOURS le temps écoulé avant de changer l'état Fight Boss.
     * C'est indispensable au redémarrage : le temps passé à régénérer hors
     * combat ne doit jamais être rejoué ensuite comme du temps de combat.
     */
    appliquerProgressionEnergieSorealIdle_(
      feuille,
      ligne
    );

    const stats =
      statsJoueurSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.STATS_JSON
          )
          .getValue()
      );

    const raisonArret=
      String(raison||'')
        .trim()
        .toLowerCase();

    const arretApresDefaite=
      !Boolean(actif)&&
      raisonArret==='defaite';

    const snapshotCombat=
      snapshot&&typeof snapshot==='object'
        ?snapshot
        :null;

    const bossVaincusCourant=
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.BOSS_VAINCUS
              )
              .getValue(),
            0
          )
        )
      );

    const bossSelectionCourante=
      bossVaincusCourant+1;

    const snapshotMemeBoss=
      Boolean(
        snapshotCombat &&
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              snapshotCombat.bossSelection,
              0
            )
          )
        )===bossSelectionCourante
      );

    /*
     * V184 — un Start peut rester en vol pendant un NUKE/Rebirth.
     * Si sa snapshot vise le boss précédent, il est OBSOLÈTE : surtout
     * ne pas réactiver combatBossActif sur le nouveau boss.
     *
     * On répond ok:true pour rendre l'opération idempotente et silencieuse ;
     * le client se resynchronisera normalement sans boucle de retry.
     */
    if(
      Boolean(actif) &&
      snapshotCombat &&
      !snapshotMemeBoss
    ){
      return {
        ok:true,
        actif:false,
        ignore:true,
        obsolete:true,
        bossSelection:bossSelectionCourante
      };
    }

    /*
     * Le client simule Fight Boss en continu entre deux RPC. Au moment
     * exact d'une défaite, fuite ou reprise, ses PV visibles sont donc
     * l'état le plus récent. Les recopier ici évite qu'un snapshot serveur
     * légèrement plus ancien ne rende instantanément de la vie au joueur
     * ou au boss. Les valeurs restent strictement bornées aux maxima serveur.
     */
    if(snapshotCombat){
      const pvJoueurMaxCourant=
        Math.max(
          1,
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.PV_JOUEUR_MAX
              )
              .getValue(),
            1
          )
        );

      const pvJoueurSnapshot=
        Math.max(
          0,
          Math.min(
            pvJoueurMaxCourant,
            nombreSorealIdle_(
              snapshotCombat.pvJoueur,
              feuille
                .getRange(
                  ligne,
                  c.PV_JOUEUR
                )
                .getValue()
            )
          )
        );

      feuille
        .getRange(
          ligne,
          c.PV_JOUEUR
        )
        .setValue(
          arretApresDefaite
            ?0
            :pvJoueurSnapshot
        );

      if(snapshotMemeBoss){
        const bossPvMaxCourant=
          Math.max(
            1,
            nombreSorealIdle_(
              feuille
                .getRange(
                  ligne,
                  c.BOSS_PV_MAX
                )
                .getValue(),
              1
            )
          );

        const bossPvServeur=
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.BOSS_PV
              )
              .getValue(),
            bossPvMaxCourant
          );

        const bossPvSnapshot=
          Math.max(
            0,
            Math.min(
              bossPvMaxCourant,
              nombreSorealIdle_(
                snapshotCombat.bossPv,
                bossPvServeur
              )
            )
          );

        /*
         * Jamais de retour en arrière sur le boss (Norman, 2026-10-08) : un instantané du client ne peut QUE faire baisser les PV du boss (ses derniers coups, pas encore connus du serveur) ; il ne lui rend
         * jamais de vie, et un « 0 » du client (victoire prédite) ne tue pas le boss à la place du serveur : un boss à 0 PV hors combat était remis à son maximum (invariant V184), la victoire se perdait et la
         * barre remontait d'un coup. Dans ce cas on garde les PV du serveur : le boss reste là, presque mort, et le combat suivant l'achève.
         */
        const bossPvRetenu=
          bossPvSnapshot>0
            ?Math.min(bossPvSnapshot,bossPvServeur)
            :bossPvServeur;

        feuille
          .getRange(
            ligne,
            c.BOSS_PV
          )
          .setValue(
            bossPvRetenu
          );
      }
    }

    /*
     * Le prochain calcul serveur doit partir exactement de l'instant où
     * Fight/Fuite/défaite vient d'être enregistré, jamais d'un timestamp
     * antérieur à la transition d'état.
     */
    feuille
      .getRange(
        ligne,
        c.DERNIERE_SYNCHRO
      )
      .setValue(
        new Date()
      );

    /*
     * Fight Boss reste idempotent : un double clic sur Fight ne recrée
     * jamais le combat. Il n'existe en revanche plus aucun verrou K.O.
     */
    if(Boolean(actif)&&stats.combatBossActif){
      return {ok:true,actif:true,dejaActif:true};
    }

    if (Boolean(actif)) {
      const niveau =
        Math.max(
          1,
          Math.floor(
            nombreSorealIdle_(
              feuille
                .getRange(
                  ligne,
                  c.NIVEAU
                )
                .getValue(),
              1
            )
          )
        );

      const bossVaincus =
        bossVaincusCourant;

      const bossIndex =
        bossVaincus;

      stats.bossSelection =
        bossIndex + 1;

      stats.bossRespawnJusqua = 0;

      const niveauRequis =
        niveauRequisBossSorealIdle_(
          bossIndex
        );

      if (niveau < niveauRequis) {
        return {
          ok:false,
          code:'BOSS_NIVEAU_INSUFFISANT',
          niveauRequis:niveauRequis,
          message:
            'Niveau '+niveauRequis+
            ' requis pour ce combat.'
        };
      }

      marquerRencontreBossPrincipalUneFoisParRunV207_(
        stats,
        bossIndex + 1,
        bossVaincusCourant
      );
    }

    /* « En direct » : un combat actif qui s'arrête sur une défaite ou une fuite du joueur (jamais les arrêts techniques comme « garde_client »). */
    if(!Boolean(actif)&&stats.combatBossActif&&(raisonArret==='defaite'||raisonArret==='fuite')){
      const compteur=raisonArret==='defaite'?'fluxBossDefaites':'fluxBossFuites';
      stats[compteur]=Math.max(0,Math.floor(nombreSorealIdle_(stats[compteur],0)))+1;
      stats.fluxBossDernier=bossSelectionCourante;
    }

    /* Classement « Combat le plus long » : un nouveau combat repart de zéro (un combat interrompu par une fuite ou un NUKE n'est pas enregistré). */
    if(Boolean(actif)&&!stats.combatBossActif){
      stats.combatBossDureeSec=0;
      /* départ « frais » : le boss est à PV pleins au moment où on appuie sur Fight */
      const pvDepartBoss=nombreSorealIdle_(feuille.getRange(ligne,c.BOSS_PV).getValue(),0);
      const pvMaxDepartBoss=nombreSorealIdle_(feuille.getRange(ligne,c.BOSS_PV_MAX).getValue(),0);
      stats.combatBossDepartFrais=pvMaxDepartBoss>0&&pvDepartBoss>=pvMaxDepartBoss*0.999999;
    }
    /* une fuite ou un arrêt qui interrompt un combat actif annule son éligibilité au record */
    if(!Boolean(actif)&&stats.combatBossActif)stats.combatBossDepartFrais=false;
    stats.combatBossActif =
      Boolean(actif);

    if(Boolean(actif)){
      feuille
        .getRange(
          ligne,
          c.KO_JUSQUA
        )
        .clearContent();
    }

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

    if (!stats.combatBossActif) {
      /*
       * STOP = fuite du combat.
       * Les effets magiques temporaires ne survivent pas à une fuite.
       */
      stats.buffBouclierJusqua = 0;
      stats.buffBouclierPct = 0;
      stats.immuniteParalysieJusqua = 0;
      stats.bossStunJusqua = 0;
      stats.bossVulnerableJusqua = 0;
      stats.bossVulnerablePct = 0;
      stats.sceauBriseBossNumero = 0;

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

      /*
       * Aucun K.O. et aucun reset de boss :
       * - défaite : le joueur est persisté à 0 PV ;
       * - fuite : ses PV courants sont conservés ;
       * - dans les deux cas, le boss conserve ses PV courants ;
       * - les deux barres régénèrent ensuite hors combat.
       */
      if(arretApresDefaite){
        feuille
          .getRange(
            ligne,
            c.PV_JOUEUR
          )
          .setValue(0);
      }

      feuille
        .getRange(
          ligne,
          c.KO_JUSQUA
        )
        .clearContent();

      feuille
        .getRange(
          ligne,
          c.DERNIERE_SYNCHRO
        )
        .setValue(
          new Date()
        );

      stats.bossStunJusqua = 0;
      stats.bossVulnerableJusqua = 0;
      stats.bossVulnerablePct = 0;
      stats.sceauBriseBossNumero = 0;

      feuille
        .getRange(
          ligne,
          c.STATS_JSON
        )
        .setValue(
          JSON.stringify(stats)
        );
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      actif:
        stats.combatBossActif
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * NUKE — règle BossController.nukeBosses() de NGU :
 * Attack joueur / 5 > Defense boss ET Defense joueur / 5 > Attack boss.
 * On avance depuis le boss courant tant que LES DEUX conditions restent
 * vraies, en accordant les mêmes récompenses qu'une victoire normale.
 * Combat arrêté au premier boss non nukable ; mur de Renaissance inchangé.
 */
/*
 * Perk ITOPOD « +2% EXP from bosses 24 and on » (wiki Experience, 25 niveaux) :
 * bossExpMultiplierFromPerks était calculé mais jamais lu. Les boss
 * d'index 23 et plus (boss 24+) reçoivent ce facteur en plus du multiplicateur d'XP.
 */
export function facteurExpBossPerkSorealIdle_(bonus, indexBoss) {
  return indexBoss >= 23
    ? Math.max(1, nombreSorealIdle_(bonus && bonus.bossExpMultiplierFromPerks, 1))
    : 1;
}

export function nukerBossSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      message: 'Le jeu est occupé.'
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

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    /*
     * Comme renaitreSorealIdle : on rejoue d'abord toute la progression
     * d'entraînement/énergie/combat en attente, pour ne jamais calculer
     * NUKE sur une Défense ou un Boss vaincus périmés.
     */
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

    if (stats.combatBossActif) {
      /*
       * NUKE part toujours d'un état "prêt" (Task 2 : un combat manuel en
       * cours n'est jamais court-circuité automatiquement).
       */
      return {
        ok: false,
        code: 'SOREAL_IDLE_NUKE_COMBAT_EN_COURS',
        message: 'Termine ou arrête le combat en cours avant de lancer NUKE.'
      };
    }

    const renaissanceNativeCountNuke =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            stats.metaNgu &&
              stats.metaNgu.records &&
              stats.metaNgu.records.totalRebirths,
            0
          )
        )
      );

    const niveauNuke =
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            row[c.NIVEAU - 1],
            1
          )
        )
      );

    /*
     * V198 — appliquerProgressionEnergieSorealIdle_ vient de synchroniser
     * Basic Training + bonus NGU et a réécrit PUISSANCE/ENDURANCE avec les
     * stats Fight Boss effectives. Ce sont donc les mêmes Attack/Defense
     * que celles utilisées par le combat, jamais un calcul parallèle.
     */
    const attaqueNuke =
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PUISSANCE - 1],
          0
        )
      );

    const defenseNuke =
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.ENDURANCE - 1],
          0
        )
      );

    let bossVaincus =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.BOSS_VAINCUS - 1],
            0
          )
        )
      );

    let inventaire =
      parserJsonSorealIdle_(
        row[c.INVENTAIRE_JSON - 1],
        []
      );

    if (!Array.isArray(inventaire)) {
      inventaire = [];
    }

    const equipement =
      parserJsonSorealIdle_(
        row[c.EQUIPEMENT_JSON - 1],
        {}
      );

    let pieces =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.PIECES - 1],
            0
          )
        )
      );

    const capaciteSac =
      Math.max(
        CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
        Math.floor(
          nombreSorealIdle_(
            row[c.INVENTAIRE_CAPACITE - 1],
            CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
          )
        )
      );

    const bonusNguNuke =
      idleNguBonuses(
        stats.metaNgu
      );

    const xpMultiplierNuke =
      Math.max(
        1,
        nombreSorealIdle_(
          bonusNguNuke.xpMultiplier,
          1
        )
      );

    const defeated = [];
    const dropsRecents = [];
    let xpGagnee = 0;
    let iterations = 0;

    /*
     * FTBE (2026-09-17) : même mécanique que dans
     * appliquerProgressionEnergieSorealIdle_ — NUKE peut aussi vaincre
     * plusieurs boss d'affilée dans le même appel, donc le high-water-mark
     * local doit avancer à chaque kill, pas seulement être relu une fois.
     */
    let highestBossJamaisAtteintNuke =
      highestBossJamaisAtteintSorealIdle_(
        stats.metaNgu
      );

    while (iterations < 500) {
      iterations += 1;

      const bossBloqueRenaissanceNuke =
        bossVaincus === bossParMondeSorealIdle_() - 1 &&
        renaissanceNativeCountNuke < 1;

      if (bossBloqueRenaissanceNuke) {
        break;
      }

      if (
        niveauNuke <
        niveauRequisBossSorealIdle_(
          bossVaincus
        )
      ) {
        break;
      }

      const difficulteNuke =
        stats.metaNgu &&
        stats.metaNgu.difficulty;

      const attaqueBossNuke =
        attaqueBossSorealIdle_(
          bossVaincus,
          difficulteNuke
        );

      const defenseBossNuke =
        defenseBossSorealIdle_(
          bossVaincus,
          difficulteNuke
        );

      /*
       * Règle réelle de BossController.nukeBosses() :
       *   playerAttack / 5 > bossDefense
       *   ET
       *   playerDefense / 5 > bossAttack
       *
       * Les deux comparaisons sont strictes. L'ancienne implémentation ne
       * testait que Defense >= 5× Boss Attack et pouvait donc nuker un boss
       * que le joueur était incapable d'endommager.
       */
      if (
        !(attaqueNuke / 5 > defenseBossNuke) ||
        !(defenseNuke / 5 > attaqueBossNuke)
      ) {
        break;
      }

      const bossIndexNuke = bossVaincus;

      marquerRencontreBossPrincipalUneFoisParRunV207_(
        stats,
        bossIndexNuke + 1,
        bossVaincus
      );

      const xpReelleNuke =
        Math.max(
          0,
          Math.round(
              recompenseXpBossNiveauSorealIdle_(
              bossIndexNuke,
              niveauNuke
            ) *
            xpMultiplierNuke *
            facteurExpBossPerkSorealIdle_(bonusNguNuke, bossIndexNuke)
          )
        );

      if (xpReelleNuke > 0) {
        stats.metaNgu.currencies.experience =
          Math.max(
            0,
            nombreSorealIdle_(
              stats.metaNgu.currencies.experience,
              0
            )
          ) +
          xpReelleNuke;

        xpGagnee += xpReelleNuke;
      }

      const estPremiereFoisJamaisNuke =
        bossIndexNuke >= highestBossJamaisAtteintNuke;

      const bonusPremiereFoisNuke =
        estPremiereFoisJamaisNuke
          ? Math.max(
              0,
              Math.round(
                xpBonusPremiereFoisSorealIdle_(
                  bossIndexNuke
                ) *
                xpMultiplierNuke *
                facteurExpBossPerkSorealIdle_(bonusNguNuke, bossIndexNuke)
              )
            )
          : 0;

      if (bonusPremiereFoisNuke > 0) {
        stats.metaNgu.currencies.experience =
          Math.max(
            0,
            nombreSorealIdle_(
              stats.metaNgu.currencies.experience,
              0
            )
          ) +
          bonusPremiereFoisNuke;

        xpGagnee += bonusPremiereFoisNuke;
      }

      if (estPremiereFoisJamaisNuke) {
        enregistrerBossJamaisVaincuSorealIdle_(
          stats.metaNgu,
          bossIndexNuke
        );
        highestBossJamaisAtteintNuke =
          highestBossJamaisAtteintSorealIdle_(
            stats.metaNgu
          );
      }

      /*
       * 2026-09-24 (Norman : « vérifie que l'XP et l'or affichés en bas de Fight Boss sont corrects » ; règle n°1) : un boss principal
       * ne rapporte que de l'EXP (wiki, page Boss Fights, colonne « Exp Reward » : aucune autre récompense) et l'équipement n'existe
       * qu'en Aventure (wiki, page Inventory). Les « pièces » et les objets tirés ici venaient de l'ancienne version de SOREAL IDLE
       * (colonnes inventées de la feuille IDLE_BOSS) : supprimés.
       */

      defeated.push({
        numero: bossIndexNuke + 1,
        nom: nomBossSorealIdle_(bossIndexNuke)
      });

      bossVaincus += 1;
    }

    if (!defeated.length) {
      return {
        ok: false,
        code: 'SOREAL_IDLE_NUKE_AUCUN_BOSS',
        message: 'NUKE impossible : ton Attaque doit dépasser 5× la Défense du boss ET ta Défense doit dépasser 5× son Attaque.'
      };
    }

    const bossSuivantNuke =
      definitionBossSorealIdle_(
        bossVaincus
      );

    /*
     * Combat toujours ARRÊTÉ après NUKE (Task 2) : le joueur revoit l'écran
     * "prêt" et doit recliquer Start pour le boss suivant, sauf s'il relance
     * NUKE lui-même.
     */
    stats.combatBossActif = false;
    stats.bossSelection = bossVaincus + 1;
    stats.bossRespawnJusqua = 0;
    stats.buffBouclierJusqua = 0;
    stats.buffBouclierPct = 0;
    stats.immuniteParalysieJusqua = 0;
    stats.bossStunJusqua = 0;
    stats.bossVulnerableJusqua = 0;
    stats.bossVulnerablePct = 0;
    stats.sceauBriseBossNumero = 0;

    /* « En direct » : un Nuke qui a tué au moins un boss est annoncé avec le nombre de boss tués (compteurs lus par idle-flux-v1.js). */
    if (defeated.length > 0) {
      stats.fluxNukes = Math.max(0, Math.floor(nombreSorealIdle_(stats.fluxNukes, 0))) + 1;
      stats.fluxNukeDernier = defeated.length;
    }

    feuille.getRange(ligne, c.BOSS_VAINCUS).setValue(bossVaincus);
    feuille.getRange(ligne, c.BOSS_ACTUEL).setValue(bossSuivantNuke.nom);
    feuille.getRange(ligne, c.BOSS_PV_MAX).setValue(bossSuivantNuke.pv);
    feuille.getRange(ligne, c.BOSS_PV).setValue(bossSuivantNuke.pv);

    /*
     * Norman (2026-10-08) : « dans Fight Boss, je suis à moitié de vie, je fais le bouton Nuke et je récupère toute ma vie ».
     * NUKE tue le boss sans combat : il ne soigne pas le joueur. Les PV (déjà mis à jour de la régénération par
     * appliquerProgressionEnergieSorealIdle_ plus haut) et un éventuel KO en cours restent tels quels.
     */
    feuille.getRange(ligne, c.PV_JOUEUR).setValue(
      Math.max(
        0,
        Math.min(
          nombreSorealIdle_(row[c.PV_JOUEUR_MAX - 1], 1),
          nombreSorealIdle_(row[c.PV_JOUEUR - 1], nombreSorealIdle_(row[c.PV_JOUEUR_MAX - 1], 1))
        )
      )
    );

    feuille.getRange(ligne, c.PIECES).setValue(pieces);

    feuille.getRange(ligne, c.INVENTAIRE_JSON).setValue(
      JSON.stringify(inventaire)
    );

    feuille.getRange(ligne, c.STATS_JSON).setValue(
      JSON.stringify(stats)
    );

    SpreadsheetApp.flush();

    const joueur =
      ajouterCoutsEntrainementEtatSorealIdle_(
        construireEtatJoueurSorealIdle_(
          feuille,
          ligne,
          {
            gain: 0,
            secondesComptabilisees: 0,
            degats: 0,
            degatsRecus: 0,
            koSubis: 0,
            bossBattus: defeated.length,
            xpGagnee: xpGagnee,
            niveauxGagnes: 0,
            dropsRecents: dropsRecents
          }
        )
      );

    return {
      ok: true,
      nuke: {
        count: defeated.length,
        defeated: defeated
      },
      joueur: joueur
    };
  } finally {
    lock.releaseLock();
  }
}

export function definirAutoBossSuivantSorealIdle(
  sessionToken,
  actif
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
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

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const stats =
      statsJoueurSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.STATS_JSON
          )
          .getValue()
      );

    stats.autoBossSuivant =
      Boolean(actif);

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
      ok: true,
      actif:
        stats.autoBossSuivant
    };
  } finally {
    lock.releaseLock();
  }
}

/* Marque des popups / tutoriels comme vus (voir statsJoueurSorealIdle_.vus). Idempotent ; aucune autre donnée n'est touchée. */
export function marquerVusSorealIdle(
  sessionToken,
  ids
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
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

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const cellule =
      feuille.getRange(
        ligne,
        c.STATS_JSON
      );

    const stats =
      statsJoueurSorealIdle_(
        cellule.getValue()
      );

    const demandes =
      (Array.isArray(ids) ? ids : [])
        .slice(0,50)
        .map(function(id) {
          return String(id || '').trim();
        });

    /* « En direct » : une histoire (vuId « histoire:… ») jamais vue auparavant compte comme une cinématique regardée (Norman, 2026-10-04). */
    const dejaVus = new Set(stats.vus);
    const nouvellesHistoires = Array.from(new Set(demandes.filter(function(id) {
      return /^histoire:/.test(id) && !dejaVus.has(id);
    }))).length;
    stats.vus =
      statsJoueurSorealIdle_(
        JSON.stringify({vus:stats.vus.concat(demandes)})
      ).vus;
    if (nouvellesHistoires > 0) {
      stats.fluxHistoires = Math.max(0, Math.floor(nombreSorealIdle_(stats.fluxHistoires, 0))) + 1;
    }

    cellule.setValue(
      JSON.stringify(
        stats
      )
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      vus: stats.vus
    };
  } finally {
    lock.releaseLock();
  }
}

/*
 * Catégorie « Clics/Tap » du classement (Norman, 2026-09-27 : « le nombre de cliques de souris Droite/gauche effectué
 * dans l'appli. Et les taps pareils, dans la même catégorie... même si quelqu'un triche, ca n'est pas grave »). Compteur
 * brut cumulatif, jamais anti-triche par conception -- même patron léger que marquerVusSorealIdle (un verrou, une lecture/
 * écriture de STATS_JSON, aucun calcul de jeu). Le client accumule en mémoire et envoie le total par lots (voir
 * idleClicsEnvoyerV1_ dans soreal-idle-ui.js), jamais un appel par clic.
 */
export function enregistrerClicsSorealIdle(
  sessionToken,
  delta
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
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

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const cellule =
      feuille.getRange(
        ligne,
        c.STATS_JSON
      );

    const stats =
      statsJoueurSorealIdle_(
        cellule.getValue()
      );

    /*
     * Plafond par appel (audit 2026-10) : le delta vient du client et alimente le classement. Au plus 50 clics par
     * seconde écoulée depuis le dernier enregistrement (écoulé borné à 1 h), avec un minimum de 200 par appel (premier
     * appel, lots courts). Jamais Infinity/NaN : on retombe sur le total précédent.
     */
    const maintenantClics = Date.now();
    const ecouleSec = stats.clicsDernierMs > 0
      ? Math.min(3600, Math.max(0, (maintenantClics - stats.clicsDernierMs) / 1000))
      : 0;
    /*
     * Audit du 2026-10-10 (IDLE-AUDIT-SEC-005) : le minimum de 200 par appel permettait de gonfler le compteur en multipliant les appels (50 appels = 10 000 clics). Le minimum de 200 ne vaut plus que pour le PREMIER
     * enregistrement ; ensuite, au plus 50 clics par seconde écoulée, avec une petite marge de 20 par appel pour les lots rapprochés. Le compteur reste « brut » par choix (Norman, 2026-09-27), il est seulement borné.
     */
    const plafondClics = stats.clicsDernierMs > 0
      ? Math.max(20, Math.floor(ecouleSec * 50))
      : 200;
    const deltaClics = Math.min(
      plafondClics,
      Math.max(0, Math.floor(nombreSorealIdle_(delta, 0)))
    );
    const totalClics = stats.clicsTotal + deltaClics;
    if (Number.isFinite(totalClics) && totalClics <= Number.MAX_SAFE_INTEGER) {
      stats.clicsTotal = totalClics;
    }
    stats.clicsDernierMs = maintenantClics;

    cellule.setValue(
      JSON.stringify(
        stats
      )
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      clicsTotal: stats.clicsTotal
    };
  } finally {
    lock.releaseLock();
  }
}

/*
 * Visibilité personnelle au classement (Norman, 2026-09-27 : « Je ne veux pas apparaitre dans le classement pour
 * les autres. Uniquement moi. Et avoir une case dans parametres pour pouvoir apparaitre ou disparaitre. ») :
 * préférence PERSONNELLE, disponible à n'importe quel joueur pour lui-même (jamais réservée à l'administrateur,
 * contrairement à definirAccesOuvertSorealIdle/definirAccesPublicSorealIdle) -- même patron léger que
 * enregistrerClicsSorealIdle (un verrou, une lecture/écriture de STATS_JSON, aucun calcul de jeu). Le joueur qui se
 * cache continue de se voir lui-même dans son propre classement (voir obtenirClassementSorealIdle) -- seulement
 * caché des autres.
 */
export function definirClassementVisibleSorealIdle(
  sessionToken,
  visible
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
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

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const cellule =
      feuille.getRange(
        ligne,
        c.STATS_JSON
      );

    const stats =
      statsJoueurSorealIdle_(
        cellule.getValue()
      );

    stats.classementVisible =
      visible === true || visible === 'true' || visible === 1 || visible === '1';

    cellule.setValue(
      JSON.stringify(
        stats
      )
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      classementVisible: stats.classementVisible
    };
  } finally {
    lock.releaseLock();
  }
}
