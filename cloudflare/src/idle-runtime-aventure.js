/*
 * Améliorations, zones et monstres d'Aventure, entraînement de base (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { BASIC_TRAINING_V411, createBasicTrainingStateV411, advanceBasicTrainingStateV411, totalBasicTrainingAllocationV411 } from "./idle-basic-training.js";
import { IDLE_NGU_META_VERSION, idleNguBonuses } from "./idle-ngu-progression.js";
import { parserJsonSorealIdle_, statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { CONFIG_SOREAL_IDLE, bossMondeCibleZoneSorealIdle_, nombreSorealIdle_, seuilPuissanceAventureSorealIdle_, seuilPuissanceBossPrincipalSorealIdle_ } from "./idle-runtime-config.js";
import { boutiqueConfigSorealIdle_, parametreSorealIdle_, zonesTableSorealIdle_ } from "./idle-runtime-catalogue.js";
import { SpreadsheetApp, __idleCtx } from "./idle-sqlite-runtime.js";
import { obtenirSpreadsheetSorealIdle_ } from "./idle-runtime-acces.js";
import { cooldownAventureSorealIdle_, mondeZoneAventureSorealIdle_, nomBossSorealIdle_, pvMaxBossSorealIdle_, statsCombatPrincipalSorealIdleV413_ } from "./idle-runtime-boss.js";
import { obtenirParametresEntrainementSorealIdle_ } from "./idle-runtime-etat.js";

export function ameliorationsSorealIdle_(
  valeur
) {
  const brut =
    parserJsonSorealIdle_(
      valeur,
      {}
    );

  const source =
    brut &&
    typeof brut === 'object'
      ? brut
      : {};

  return {
    production:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            source.production,
            0
          )
        )
      ),

    capacite:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            source.capacite,
            0
          )
        )
      ),

    puissance:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            source.puissance,
            0
          )
        )
      )
  };
}

export function coutAmeliorationSorealIdle_(
  type,
  niveau
) {
  const n =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          niveau,
          0
        )
      )
    );

  const config =
    boutiqueConfigSorealIdle_(
      type
    );

  if (!config) {
    throw new Error(
      'AMELIORATION_INVALIDE'
    );
  }

  return Math.max(
    1,
    Math.round(
      config.base *
      Math.pow(
        config.croissance,
        n
      )
    )
  );
}

export function bonusAmeliorationsSorealIdle_(
  ameliorations
) {
  const a =
    ameliorationsSorealIdle_(
      JSON.stringify(
        ameliorations || {}
      )
    );

  const production =
    boutiqueConfigSorealIdle_(
      'production'
    );

  const capacite =
    boutiqueConfigSorealIdle_(
      'capacite'
    );

  const puissance =
    boutiqueConfigSorealIdle_(
      'puissance'
    );

  return {
    production:
      a.production *
      nombreSorealIdle_(
        production &&
        production.bonusParNiveau,
        2
      ),

    capacite:
      a.capacite *
      nombreSorealIdle_(
        capacite &&
        capacite.bonusParNiveau,
        250
      ),

    puissance:
      a.puissance *
      nombreSorealIdle_(
        puissance &&
        puissance.bonusParNiveau,
        10
      )
  };
}

function zonesAventureSorealIdle_() {
  return zonesTableSorealIdle_();
}

function zoneAventureSorealIdle_(
  zoneId
) {
  const zones =
    zonesAventureSorealIdle_();

  const id =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  for (
    let i = 0;
    i < zones.length;
    i += 1
  ) {
    if (zones[i].id === id) {
      return zones[i];
    }
  }

  return zones[0];
}

export function progressionAventureSorealIdle_(
  brut
) {
  const obj =
    parserJsonSorealIdle_(
      brut,
      {}
    );

  return obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj)
      ? obj
      : {};
}

export function etatZoneAventureSorealIdle_(
  progression,
  zoneId
) {
  const cle =
    String(zoneId);

  const brut =
    progression[cle];

  if (
    !brut ||
    typeof brut !== 'object'
  ) {
    return {
      victoires: 0,
      bossVaincu: false,
      meilleurTemps: 0,
      progressionBoss: 0,
      bossEchecs: 0
    };
  }

  const tousLes =
    Math.max(
      2,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_ENNEMIS_PAR_ZONE',
            5
          ),
          5
        )
      )
    );

  const victoires =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          brut.victoires,
          0
        )
      )
    );

  /*
   * Migration automatique des anciennes sauvegardes :
   * une zone à 4 victoires reste prête pour son boss.
   */
  const progressionBoss =
    Math.max(
      0,
      Math.min(
        tousLes - 1,
        Math.floor(
          nombreSorealIdle_(
            brut.progressionBoss,
            victoires % tousLes
          )
        )
      )
    );

  return {
    victoires:
      victoires,

    bossVaincu:
      Boolean(
        brut.bossVaincu
      ),

    meilleurTemps:
      Math.max(
        0,
        nombreSorealIdle_(
          brut.meilleurTemps,
          0
        )
      ),

    progressionBoss:
      progressionBoss,

    bossEchecs:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            brut.bossEchecs,
            0
          )
        )
      )
  };
}

function coutEntreeAventureSorealIdle_(
  zoneId
) {
  /* IDLE_ADVENTURE_NO_ENERGY_V44 — l'Aventure ne consomme jamais d'énergie. */
  void zoneId;
  return 0;
}

function monstresAventureSorealIdleGameV409_() {
  if (
    Array.isArray(
      __idleCtx.cacheMonstresAventureSorealIdleGameV409_
    )
  ) {
    return __idleCtx.cacheMonstresAventureSorealIdleGameV409_;
  }

  const resultat = [];

  try {
    const feuille =
      obtenirSpreadsheetSorealIdle_()
        .getSheetByName(
          'IDLE_MONSTRES'
        );

    if (
      feuille &&
      feuille.getLastRow() >= 2 &&
      feuille.getLastColumn() >= 1
    ) {
      const valeurs =
        feuille
          .getRange(
            1,
            1,
            feuille.getLastRow(),
            feuille.getLastColumn()
          )
          .getValues();

      const entetes =
        valeurs[0]
          .map(function(v) {
            return String(v || '')
              .trim();
          });

      const index = {};

      entetes.forEach(function(nom, i) {
        if (nom) {
          index[nom] = i;
        }
      });

      function cellule_(ligne, nom) {
        const i = index[nom];

        return typeof i === 'number'
          ? ligne[i]
          : '';
      }

      for (
        let r = 1;
        r < valeurs.length;
        r += 1
      ) {
        const ligne = valeurs[r];

        const actif =
          String(
            cellule_(ligne, 'Actif')
          )
            .trim()
            .toLowerCase();

        if (actif === 'false') {
          continue;
        }

        const id =
          String(
            cellule_(ligne, 'ID') || ''
          )
            .trim();

        if (!id) {
          continue;
        }

        const typeBrut =
          String(
            cellule_(ligne, 'Type') ||
            'normal'
          )
            .trim()
            .toLowerCase();

        // Tier "rare" + objet legendaire retire : mecanique 100% SOREAL
        // sans equivalent NGU (aucune trace sur le wiki). Les lignes IDLE_MONSTRES
        // de type rare retombent desormais sur 'normal'.
        const type =
          [
            'normal',
            'boss_zone'
          ].indexOf(typeBrut) !== -1
            ? typeBrut
            : 'normal';

        resultat.push({
          id: id,

          zoneId:
            Math.max(
              1,
              Math.floor(
                nombreSorealIdle_(
                  cellule_(ligne, 'ZoneID'),
                  1
                )
              )
            ),

          type: type,

          nom:
            String(
              cellule_(ligne, 'Nom') ||
              'Créature'
            )
              .trim(),

          emoji:
            String(
              cellule_(ligne, 'Emoji') ||
              '👾'
            )
              .trim(),

          pv:
            Math.max(
              1,
              Math.round(
                nombreSorealIdle_(
                  cellule_(ligne, 'PV'),
                  100
                )
              )
            ),

          attaque:
            Math.max(
              0,
              nombreSorealIdle_(
                cellule_(ligne, 'Attaque'),
                1
              )
            ),

          chanceRencontre:
            Math.max(
              0,
              Math.min(
                1,
                nombreSorealIdle_(
                  cellule_(
                    ligne,
                    'ChanceRencontre'
                  ),
                  type === 'rare'
                    ? 0.003
                    : 1
                )
              )
            ),

          chanceLegendaire:
            Math.max(
              0,
              Math.min(
                1,
                nombreSorealIdle_(
                  cellule_(
                    ligne,
                    'ChanceLegendaire'
                  ),
                  type === 'rare'
                    ? 0.25
                    : 0
                )
              )
            ),

          objetLegendaire:
            String(
              cellule_(
                ligne,
                'ObjetLegendaire'
              ) || ''
            )
              .trim(),

          slotLegendaire:
            String(
              cellule_(
                ligne,
                'SlotLegendaire'
              ) || ''
            )
              .trim()
              .toLowerCase(),

          baseLegendaire:
            Math.max(
              0,
              nombreSorealIdle_(
                cellule_(
                  ligne,
                  'BaseLegendaire'
                ),
                0
              )
            ),

          description:
            String(
              cellule_(
                ligne,
                'Description'
              ) || ''
            )
              .trim(),

          image:
            String(
              cellule_(ligne, 'Image') || ''
            )
              .trim()
        });
      }
    }
  } catch (erreur) {
    console.warn(
      'IDLE_MONSTRES indisponible :',
      erreur && erreur.message
        ? erreur.message
        : erreur
    );
  }

  /*
   * Secours compatible avec les anciens projets :
   * si IDLE_MONSTRES n'est pas lisible, les ennemis
   * historiques sont reconstruits depuis les zones.
   */
  if (!resultat.length) {
    const zones =
      zonesAventureSorealIdle_();

    zones.forEach(function(zone) {
      resultat.push({
        id:
          'Z' + zone.id + '_NORMAL',
        zoneId: zone.id,
        type: 'normal',
        nom: zone.ennemi,
        emoji: zone.emoji || '👾',
        pv: zone.pvEnnemi,
        attaque: zone.attaqueEnnemi,
        chanceRencontre: 1,
        chanceLegendaire: 0,
        objetLegendaire: '',
        slotLegendaire: '',
        baseLegendaire: 0,
        description: '',
        image: ''
      });

      resultat.push({
        id:
          'Z' + zone.id + '_BOSS',
        zoneId: zone.id,
        type: 'boss_zone',
        nom: zone.boss,
        emoji: '👑',
        pv: zone.pvBoss,
        attaque: zone.attaqueBoss,
        chanceRencontre: 1,
        chanceLegendaire: 0,
        objetLegendaire: '',
        slotLegendaire: '',
        baseLegendaire: 0,
        description: '',
        image: ''
      });
    });
  }

  __idleCtx.cacheMonstresAventureSorealIdleGameV409_ =
    resultat;

  return resultat;
}

function monstresZoneAventureSorealIdleGameV409_(
  zoneId
) {
  const id =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  return monstresAventureSorealIdleGameV409_()
    .filter(function(monstre) {
      return monstre.zoneId === id;
    });
}

export function monstreZoneAventureParTypeSorealIdleGameV409_(
  zoneId,
  type
) {
  const cleType =
    String(type || '')
      .trim()
      .toLowerCase();

  const monstres =
    monstresZoneAventureSorealIdleGameV409_(
      zoneId
    );

  for (
    let i = 0;
    i < monstres.length;
    i += 1
  ) {
    if (
      monstres[i].type === cleType
    ) {
      return monstres[i];
    }
  }

  return null;
}

function statsEnnemiAventureSorealIdle_(
  zoneId,
  boss
) {
  const id =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  const monstre =
    monstreZoneAventureParTypeSorealIdleGameV409_(
      id,
      boss
        ? 'boss_zone'
        : 'normal'
    );

  const zone =
    zoneAventureSorealIdle_(
      id
    );

  const pvCatalogue =
    Math.max(
      1,
      Math.round(
        nombreSorealIdle_(
          monstre
            ? monstre.pv
            : (
                boss
                  ? zone && zone.pvBoss
                  : zone && zone.pvEnnemi
              ),
          boss ? 384 : 120
        )
      )
    );

  const attaqueCatalogue =
    Math.max(
      1,
      Math.round(
        nombreSorealIdle_(
          monstre
            ? monstre.attaque
            : (
                boss
                  ? zone && zone.attaqueBoss
                  : zone && zone.attaqueEnnemi
              ),
          boss ? 5 : 3
        )
      )
    );

  /*
   * V41.3 — l'Aventure commence réellement comme une zone dangereuse.
   *
   * Zone 1 normal :
   *   ~1,2 M PV / 160 k attaque.
   *
   * Zone 1 boss :
   *   ~15 M PV / 1,6 M attaque.
   *
   * Les valeurs de la feuille restent valables si elles sont plus hautes.
   * Les floors servent uniquement à empêcher un vieux catalogue sous-calibré
   * de rendre la nouvelle boucle NGU triviale.
   */
  const pvMinimum =
    boss
      ? 15000000 *
        Math.pow(
          7,
          id - 1
        )
      : 1200000 *
        Math.pow(
          6,
          id - 1
        );

  const attaqueMinimum =
    boss
      ? 1600000 *
        Math.pow(
          4,
          id - 1
        )
      : 160000 *
        Math.pow(
          3.5,
          id - 1
        );

  return {
    pv:
      Math.max(
        pvCatalogue,
        Math.round(
          pvMinimum
        )
      ),

    attaque:
      Math.max(
        attaqueCatalogue,
        Math.round(
          attaqueMinimum
        )
      )
  };
}

export function construireAventureSorealIdle_(
  row,
  highestBossEver
) {
  void highestBossEver;
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  /*
   * Norman (2026-09-11) : "le mode aventure est déjà débloqué [après un
   * Rebirth]... il ne doit se débloquer qu'au niveau habituel." Vérifié sur
   * le wiki NGU (page "Rebirths", section "What do I lose when I rebirth?") :
   * "Access to the Adventure, Augmentation, Time Machine, and Blood Magic
   * tabs [is lost] until their related bosses are beaten... Bosses fought
   * (you go back to boss 1)." Le high-water-mark historique
   * (metaNguEtat.records.highestBoss) ajouté le 2026-09-09 pour empêcher
   * l'Aventure de se reverrouiller reposait sur une hypothèse jamais vérifiée
   * contre le wiki — c'était faux, seul l'Inventaire (et sa Collection) reste
   * permanent après un Rebirth. Seul le compteur du RUN EN COURS
   * (row[BOSS_VAINCUS], remis à 0 à chaque Renaissance) doit donc conditionner
   * l'accès à l'Aventure, exactement comme le jeu réel.
   */
  const bossVaincusAventure =
    Math.max(
      0,
      Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1],0))
    );

  const bossUnlocksNgu = [4,7,17,37,48,58,66,74,82,90,100,108,116,124,132,137];

  const niveau =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          row[c.NIVEAU - 1],
          1
        )
      )
    );

  const progression =
    progressionAventureSorealIdle_(
      row[
        c.AVENTURE_PROGRESSION_JSON - 1
      ]
    );

  const inventaire =
    parserJsonSorealIdle_(
      row[
        c.INVENTAIRE_JSON - 1
      ],
      []
    );

  const equipement =
    parserJsonSorealIdle_(
      row[
        c.EQUIPEMENT_JSON - 1
      ],
      {}
    );

  const defense =
    Math.max(
      100,
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        100
      )
    );

  const pvJoueurMax =
    Math.max(
      1000,
      nombreSorealIdle_(
        row[c.PV_JOUEUR_MAX - 1],
        Math.max(
          1000,
          nombreSorealIdle_(
            row[c.PUISSANCE - 1],
            100
          )*
          10
        )
      )
    );

  const puissanceActuelle =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.PUISSANCE - 1],
        1
      )
    );

  const statsAventure =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const derniereActionBrute =
    row[
      c.AVENTURE_DERNIERE_ACTION - 1
    ];

  const derniereActionMs =
    derniereActionBrute instanceof Date
      ? derniereActionBrute.getTime()
      : new Date(
          derniereActionBrute || 0
        ).getTime();

  const zones =
    zonesAventureSorealIdle_()
      .map(function(zone) {
        const etat =
          etatZoneAventureSorealIdle_(
            progression,
            zone.id
          );

        const precedente =
          zone.id <= 1
            ? true
            : etatZoneAventureSorealIdle_(
                progression,
                zone.id - 1
              ).bossVaincu;

        const bossRequisZone =
          bossUnlocksNgu[Math.max(0,zone.id-1)] ||
          (137 + Math.max(0,zone.id-16)*8);

        const debloquee =
          bossVaincusAventure >= bossRequisZone;

        const statsEnnemi =
          statsEnnemiAventureSorealIdle_(
            zone.id,
            false
          );

        const statsBoss =
          statsEnnemiAventureSorealIdle_(
            zone.id,
            true
          );

        const seuilEnnemi =
          seuilPuissanceAventureSorealIdle_(
            statsEnnemi,
            pvJoueurMax,
            defense,
            false
          );

        const seuilBoss =
          seuilPuissanceAventureSorealIdle_(
            statsBoss,
            pvJoueurMax,
            defense,
            true
          );

        const bossMondeCible =
          bossMondeCibleZoneSorealIdle_(
            zone.id
          );

        const seuilBossMonde =
          seuilPuissanceBossPrincipalSorealIdle_(
            bossMondeCible,
            pvJoueurMax,
            defense
          );

        return {
          id: zone.id,
          monde:
            mondeZoneAventureSorealIdle_(
              zone
            ),
          nom: zone.nom,
          emoji: zone.emoji,
          description:
            zone.description,
          ennemi: zone.ennemi,
          boss: zone.boss,
          image: zone.image || '',
          niveauRequis: 0,
          bossRequis: bossRequisZone,
          puissanceRecommandee:
            zone.puissanceRecommandee,
          puissanceActuelle:
            puissanceActuelle,
          puissanceMinimumEnnemi:
            seuilEnnemi.puissance,
          puissanceMinimumBoss:
            seuilBoss.puissance,
          limiteEnnemiSecondes:
            seuilEnnemi.limite,
          limiteBossSecondes:
            seuilBoss.limite,
          bossMondeCible:
            bossMondeCible,
          bossMondeCibleNom:
            seuilBossMonde.nom,
          puissanceMinimumBossMonde:
            seuilBossMonde.puissance,
          coutEntree:
            coutEntreeAventureSorealIdle_(
              zone.id
            ),
          debloquee:
            debloquee,
          victoires:
            etat.victoires,
          bossVaincu:
            etat.bossVaincu,
          progressionBoss:
            etat.progressionBoss,
          combatsAvantBoss:
            Math.max(
              0,
              Math.max(
                2,
                Math.floor(
                  nombreSorealIdle_(
                    parametreSorealIdle_(
                      'AVENTURE_ENNEMIS_PAR_ZONE',
                      5
                    ),
                    5
                  )
                )
              ) -
              1 -
              etat.progressionBoss
            ),
          bossEchecs:
            etat.bossEchecs
        };
      });

  const niveauDeblocage = 0;

  return {
    debloquee:
      bossVaincusAventure >= 4,

    bossRequis: 4,

    niveauRequis:
      niveauDeblocage,

    points:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.AVENTURE_POINTS - 1],
            0
          )
        )
      ),

    zoneSelectionnee:
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            row[c.AVENTURE_ZONE - 1],
            1
          )
        )
      ),

    puissanceActuelle:
      puissanceActuelle,

    cooldownBaseSecondes:
      cooldownAventureSorealIdle_(
        (
          zonesAventureSorealIdle_()
            .find(function(zone){
              return zone.id ===
                Math.max(
                  1,
                  Math.floor(
                    nombreSorealIdle_(
                      row[c.AVENTURE_ZONE - 1],
                      1
                    )
                  )
                );
            }) ||
          zonesAventureSorealIdle_()[0] ||
          {id:1,monde:1}
        ),
        statsAventure
      ),

    cooldownJusqua:
      Number.isFinite(
        derniereActionMs
      ) &&
      derniereActionMs > 0
        ? derniereActionMs +
          cooldownAventureSorealIdle_(
            (
              zonesAventureSorealIdle_()
                .find(function(zone){
                  return zone.id ===
                    Math.max(
                      1,
                      Math.floor(
                        nombreSorealIdle_(
                          row[c.AVENTURE_ZONE - 1],
                          1
                        )
                      )
                    );
                }) ||
              zonesAventureSorealIdle_()[0] ||
              {id:1,monde:1}
            ),
            statsAventure
          ) *
          1000
        : 0,

    defenseActuelle:
      defense,

    pvJoueurMax:
      pvJoueurMax,

    zones:
      zones
  };
}

export function statsInitiauxSorealIdleV41_() {
  const stats =
    statsJoueurSorealIdle_(
      '{}'
    );

  stats.modeleJeuVersion =
    BASIC_TRAINING_V411.version;

  stats.entrainementBase =
    createBasicTrainingStateV411(
      Date.now()
    );

  stats.energieTickResteMs = 0;

  /* La partie ne commence qu'à l'appui sur le bouton blanc de l'intro (demarrerPartieSorealIdle) : énergie à 250, horloge remise à zéro. */
  stats.partieAttente = true;

  return stats;
}

/*
 * Le prototype précédent est volontairement abandonné.
 * V41 est une nouvelle partie : aucun code de migration des anciennes
 * valeurs n'est conservé. Cela évite d'empiler des règles historiques
 * dans le nouveau moteur.
 */
export function initialiserModeleJoueurSorealIdleV41SiNecessaire_(
  feuille,
  ligne
) {
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

  if (
    stats.modeleJeuVersion ===
    BASIC_TRAINING_V411.version &&
    stats.entrainementBase
  ) {
    return false;
  }

  const id =
    String(
      row[c.ID - 1] || ''
    );

  const nom =
    String(
      row[c.NOM - 1] || 'Joueur'
    );

  const emailPrincipal =
    String(
      row[c.EMAIL_PRINCIPAL - 1] || ''
    );

  const emailConnexion =
    String(
      row[c.EMAIL_CONNEXION - 1] || ''
    );

  const coefficients =
    obtenirParametresEntrainementSorealIdle_();

  const puissance =
    Math.max(
      1,
      Math.round(
        Math.max(
          0,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'PUISSANCE_BASE_FIXE',
              4
            ),
            4
          )
        ) +
        CONFIG_SOREAL_IDLE.FORCE_BASE *
        coefficients.force
      )
    );

  const pv =
    CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
    CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE;

  const nouvellesValeurs = [
    id,
    nom,
    CONFIG_SOREAL_IDLE.NIVEAU_BASE,
    0,
    CONFIG_SOREAL_IDLE.ENERGIE_BASE,
    CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE,
    CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE,
    CONFIG_SOREAL_IDLE.FORCE_BASE,
    CONFIG_SOREAL_IDLE.ENDURANCE_BASE,
    CONFIG_SOREAL_IDLE.ORGANISATION_BASE,
    puissance,
    nomBossSorealIdle_(0),
    pvMaxBossSorealIdle_(0),
    pvMaxBossSorealIdle_(0),
    0,
    new Date(),
    'Visible',
    '',
    emailPrincipal,
    emailConnexion,
    0,
    '[]',
    '{}',
    '{}',
    0,
    0,
    pv,
    pv,
    '',
    1,
    '{}',
    0,
    '',
    0,
    '{}',
    new Date(),
    CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
    JSON.stringify(
      statsInitiauxSorealIdleV41_()
    )
  ];

  feuille
    .getRange(
      ligne,
      1,
      1,
      nouvellesValeurs.length
    )
    .setValues([
      nouvellesValeurs
    ]);

  SpreadsheetApp.flush();

  return true;
}

/*
 * Niveaux gagnés à chaque remplissage de barre d'Entraînement de base :
 * 1 + Double Basic Training (perk) + Super Advanced Beast Training! (quirk)
 * + "I wish Basic Training was EVEN FASTER" (souhait), voir
 * levelsPerFillBasicTrainingV411.
 */
export function niveauxParBarreEntrainementSorealIdle_(stats) {
  const meta = stats && stats.metaNgu;
  if (!meta || meta.version !== IDLE_NGU_META_VERSION) return 1;
  return Math.max(
    1,
    Math.floor(nombreSorealIdle_(idleNguBonuses(meta).basicTrainingLevelsPerFill, 1))
  );
}

/* « Training Auto Advance » (boutique EXP, wiki Experience > Misc) acheté ? */
export function autoAvanceEntrainementSorealIdle_(stats) {
  const meta = stats && stats.metaNgu;
  if (!meta || meta.version !== IDLE_NGU_META_VERSION) return false;
  /* Lecture directe (même source que idleNguBonuses().basicTrainingAutoAdvance) : évite un 2e calcul complet des bonus. */
  return Math.floor(nombreSorealIdle_(meta.bonuses && meta.bonuses.expShop && meta.bonuses.expShop.trainingAutoAdvance, 0)) >= 1;
}

export function synchroniserEntrainementBaseSorealIdleV41_(
  feuille,
  ligne,
  row,
  maintenant
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const stats =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const progression =
    advanceBasicTrainingStateV411(
      stats.entrainementBase,
      maintenant,
      CONFIG_SOREAL_IDLE
        .PROGRESSION_HORS_LIGNE_MAX_SECONDES,
      niveauxParBarreEntrainementSorealIdle_(stats),
      { autoAdvance: autoAvanceEntrainementSorealIdle_(stats) }
    );

  stats.modeleJeuVersion =
    BASIC_TRAINING_V411.version;

  stats.entrainementBase =
    progression.state;

  const inventaire =
    parserJsonSorealIdle_(
      row[
        c.INVENTAIRE_JSON - 1
      ],
      []
    );

  const equipement =
    parserJsonSorealIdle_(
      row[
        c.EQUIPEMENT_JSON - 1
      ],
      {}
    );

  const collection =
    parserJsonSorealIdle_(
      row[
        c.COLLECTION_JSON - 1
      ],
      {}
    );

  const combat =
    statsCombatPrincipalSorealIdleV413_(
      stats,
      inventaire,
      equipement,
      row[
        c.AMELIORATIONS_JSON - 1
      ],
      row[
        c.ESSENCE_RENAISSANCE - 1
      ],
      collection,
      nombreSorealIdle_(row[c.BOSS_VAINCUS - 1], 0)
    );

  row[c.FORCE - 1] =
    combat.attaque;

  row[c.ENDURANCE - 1] =
    combat.defense;

  row[c.ORGANISATION - 1] = 1;

  row[c.PUISSANCE - 1] =
    combat.attaque;

  row[c.STATS_JSON - 1] =
    JSON.stringify(stats);

  feuille
    .getRange(
      ligne,
      c.FORCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.ENDURANCE
    )
    .setValue(
      combat.defense
    );

  feuille
    .getRange(
      ligne,
      c.ORGANISATION
    )
    .setValue(1);

  feuille
    .getRange(
      ligne,
      c.PUISSANCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.STATS_JSON
    )
    .setValue(
      row[c.STATS_JSON - 1]
    );

  return {
    stats:
      stats,

    allocation:
      totalBasicTrainingAllocationV411(
        progression.state
      ),

    attaque:
      combat.attaque,

    defense:
      combat.defense,

    pvMax:
      combat.pvMax,

    combat:
      combat,

    secondes:
      progression.elapsedSeconds
  };
}
