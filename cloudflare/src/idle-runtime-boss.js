/*
 * Magie, statistiques et définitions des boss (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleNguBonuses, REBIRTH_UNLOCK_BOSS_V1 } from "./idle-ngu-progression.js";
import { nguBossStatsV1, nguBossFtbeBonusXpV1 } from "./idle-ngu-boss-reference-v1.js";
import { nomBossSurchargeV1, texteBossParleV1, nomBossParleV1 } from "./idle-textes-v1.js";
import { deriveBasicTrainingStatsV411, normalizeBasicTrainingStateV411 } from "./idle-basic-training.js";
import { CONFIG_SOREAL_IDLE, niveauDeblocageFonctionSorealIdle_, nombreSorealIdle_ } from "./idle-runtime-config.js";
import { bossCatalogueSorealIdle_, histoireBossAvecSurchargeSorealIdle_, parametreSorealIdle_, setParIdSorealIdle_ } from "./idle-runtime-catalogue.js";
import { detailsEquipementSorealIdle_, parserJsonSorealIdle_, progressionCollectionsSorealIdle_, slotsEquipementSorealIdle_, statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { NGU_BOSS_NAMES_FR_V1, __idleCtx } from "./idle-sqlite-runtime.js";

export function niveauMagieSorealIdle_() {
  return niveauDeblocageFonctionSorealIdle_(
    'magie',
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'MAGIE_NIVEAU_DEBLOCAGE',
            4
          ),
          4
        )
      )
    )
  );
}

function manaMaxSorealIdle_(niveau) {
  const n = Math.max(1,Math.floor(nombreSorealIdle_(niveau,1)));
  const debut = niveauMagieSorealIdle_();

  if (n < debut) {
    return 0;
  }

  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        parametreSorealIdle_('MANA_BASE',45),
        45
      ) +
      Math.max(0,n-debut) *
      nombreSorealIdle_(
        parametreSorealIdle_('MANA_PAR_NIVEAU',3),
        3
      )
    )
  );
}

function manaRegenSecondeSorealIdle_(niveau) {
  const n = Math.max(1,Math.floor(nombreSorealIdle_(niveau,1)));
  const debut = niveauMagieSorealIdle_();

  if (n < debut) {
    return 0;
  }

  return Math.max(
    0.01,
    nombreSorealIdle_(
      parametreSorealIdle_('MANA_REGEN_BASE_SEC',0.12),
      0.12
    ) +
    Math.max(0,n-debut) *
    nombreSorealIdle_(
      parametreSorealIdle_('MANA_REGEN_PAR_NIVEAU',0.004),
      0.004
    )
  );
}

export function mettreAJourManaStatsSorealIdle_(
  stats,
  niveau,
  maintenantMs
) {
  const s = stats || {};
  const maintenant = Math.max(0,nombreSorealIdle_(maintenantMs,Date.now()));
  const max = manaMaxSorealIdle_(niveau);
  const regen = manaRegenSecondeSorealIdle_(niveau);

  if (max <= 0) {
    s.mana = 0;
    s.manaMajMs = maintenant;
    return {mana:0,max:0,regen:0};
  }

  if (
    nombreSorealIdle_(s.mana,-1) < 0 ||
    nombreSorealIdle_(s.manaMajMs,0) <= 0
  ) {
    s.mana = max;
    s.manaMajMs = maintenant;
    return {mana:max,max:max,regen:regen};
  }

  const ecoule = Math.max(
    0,
    (maintenant - nombreSorealIdle_(s.manaMajMs,maintenant))/1000
  );

  s.mana = Math.min(
    max,
    Math.max(0,nombreSorealIdle_(s.mana,0)) + ecoule * regen
  );
  s.manaMajMs = maintenant;

  return {
    mana:s.mana,
    max:max,
    regen:regen
  };
}

function capaciteBossTypeSorealIdle_(bossIndex,type) {
  const cible = String(type || '').trim().toLowerCase();
  return capacitesBossSorealIdle_(bossIndex)
    .find(function(cap){
      return String(cap && cap.type || '').trim().toLowerCase() === cible;
    }) || null;
}

export function multiplicateurSceauBossSorealIdle_(bossIndex,stats) {
  const sceau = capaciteBossTypeSorealIdle_(bossIndex,'sceau');

  if (!sceau) {
    return 1;
  }

  if (
    Math.floor(nombreSorealIdle_(stats && stats.sceauBriseBossNumero,0)) ===
    bossIndex + 1
  ) {
    return 1;
  }

  return Math.max(
    0.05,
    1 - Math.min(95,Math.max(0,nombreSorealIdle_(sceau.valeur,70)))/100
  );
}

function idsEquipementSorealIdle_(equipement) {
  return slotsEquipementSorealIdle_()
    .map(function(slot){
      const v=
        equipement &&
        equipement[slot];

      return v &&
        typeof v==='object'
          ?String(v.id||'')
          :String(v||'');
    })
    .filter(Boolean);
}

export function nombreObjetsSacSorealIdle_(inventaire,equipement) {
  const ids=idsEquipementSorealIdle_(equipement);
  return (Array.isArray(inventaire)?inventaire:[])
    .filter(function(o){
      return ids.indexOf(String(o&&o.id||''))===-1;
    }).length;
}

export function bonusSetsSorealIdle_(
  inventaire,
  equipement
) {
  const details =
    detailsEquipementSorealIdle_(
      inventaire,
      equipement
    );

  const groupes = {};

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const objet =
        details[slot];

      if (
        !objet ||
        !objet.setId
      ) {
        return;
      }

      const id =
        String(
          objet.setId
        );

      groupes[id] =
        (groupes[id] || 0) + 1;
    });

  let pourcent = 0;
  const actifs = [];

  Object.keys(groupes)
    .forEach(function(setId) {
      const set =
        setParIdSorealIdle_(
          setId
        );

      if (!set) {
        return;
      }

      const pieces =
        groupes[setId];

      // Palier unique a la piece complete (set.pieces6, toujours 6 dans le
      // moteur SOREAL) : le vrai NGU ne donne qu'un seul bonus de
      // complétion par set, jamais de paliers intermediaires 2pc/4pc.
      let bonus = 0;

      if (
        pieces >= set.pieces6
      ) {
        bonus =
          set.bonus6Pct;
      }

      if (bonus > 0) {
        pourcent += bonus;

        actifs.push({
          id:
            set.id,

          nom:
            set.nom,

          pieces:
            pieces,

          piecesMax:
            set.pieces6,

          bonusPourcent:
            bonus,

          apparence:
            set.apparence,

          complet:
            pieces >= set.pieces6,

          description:
            set.description
        });
      }
    });

  return {
    pourcent:
      pourcent,

    actifs:
      actifs
  };
}

export function coutForgeSorealIdle_(objet) {
  const niveau =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          objet && objet.forge,
          0
        )
      )
    );

  const base =
    Math.max(
      1,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'FORGE_COUT_BASE',
          5
        ),
        5
      )
    );

  const croissance =
    Math.max(
      1,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'FORGE_CROISSANCE',
          1.7
        ),
        1.7
      )
    );

  return Math.max(
    1,
    Math.round(
      base *
      Math.pow(
        croissance,
        niveau
      )
    )
  );
}

export function coutExtensionSacSorealIdle_(
  capacite
) {
  const baseCapacite =
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
    );

  const pas =
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
    );

  const extensions =
    Math.max(
      0,
      Math.floor(
        (
          nombreSorealIdle_(
            capacite,
            baseCapacite
          ) -
          baseCapacite
        ) /
        pas
      )
    );

  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'INVENTAIRE_EXTENSION_COUT_BASE',
          25
        ),
        25
      ) *
      Math.pow(
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
        extensions
      )
    )
  );
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (2e paramètre, optionnel, défaut "normal" via
 * definitionBossSorealIdle_/nguBossStatsV1) -- propage le diviseur ×1e-30
 * jusqu'à la vraie boucle de dégâts (degatsRecusSecondeSorealIdle_
 * ci-dessous, qui appelle cette fonction).
 */
export function attaqueBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincus,
          difficulty
        ).attaque,
        CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE
      )
    )
  );
}

/*
 * Audit 2026-09-13 (Norman) : pendant du attaqueBossSorealIdle_ ci-dessus,
 * pour la Defense — nécessaire pour que le dégât du joueur contre le boss
 * puisse enfin la soustraire (wiki NGU, page Attack). `difficulty` : même
 * propagation que ci-dessus (2026-09-18).
 */
export function defenseBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincus,
          difficulty
        ).defense,
        CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE
      )
    )
  );
}

/*
 * V53 : plus de niveau joueur global requis pour affronter un boss —
 * la progression est gérée par le moteur NGU meta. Code mort retiré
 * (audit 2026-09-17, grand nettoyage) : l'ancien calcul par
 * definitionBossSorealIdle_(index).niveauRequis n'était plus jamais
 * atteint après ce `return 1;`.
 */
export function niveauRequisBossSorealIdle_(
  bossIndex
) {
  void bossIndex;
  return 1;
}

export function recompenseXpBossNiveauSorealIdle_(
  bossIndex,
  niveauJoueur
) {
  // V53: boss rewards are EXP currency. There is no global player-level
  // scaling anymore; later multipliers come from the NGU meta engine.
  void niveauJoueur;
  return xpBossSorealIdle_(bossIndex);
}

export function delaiRespawnBossSorealIdle_(
  bossIndex
) {
  /*
   * V41.2 — un boss principal vaincu ne se reforme plus pendant le run.
   * Le compteur reste uniquement comme surface de compatibilité pour les
   * anciens clients : sa valeur est toujours 0.
   */
  void bossIndex;
  return 0;
}

export function mondeZoneAventureSorealIdle_(
  zone
) {
  if (
    zone &&
    nombreSorealIdle_(
      zone.monde,
      0
    ) > 0
  ) {
    return Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zone.monde,
          1
        )
      )
    );
  }

  const zonesParMonde =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_ZONES_PAR_MONDE',
            6
          ),
          6
        )
      )
    );

  return Math.floor(
    (
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            zone && zone.id,
            1
          )
        )
      ) -
      1
    ) /
    zonesParMonde
  ) + 1;
}

export function cooldownAventureSorealIdle_(
  zone,
  stats
) {
  const base =
    Math.max(
      0,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'AVENTURE_COOLDOWN_BASE_SECONDES',
          5
        ),
        5
      )
    );

  const monde =
    mondeZoneAventureSorealIdle_(
      zone
    );

  const mondeReductionMin =
    Math.max(
      2,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_COOLDOWN_REDUCTION_MONDE_MIN',
            2
          ),
          2
        )
      )
    );

  /*
   * Monde 1 : le temps d'attente fait partie du rythme de départ.
   * Aucun bonus futur ne peut encore le réduire.
   */
  if (monde < mondeReductionMin) {
    return base;
  }

  /*
   * À partir du Monde 2, les futurs systèmes pourront pousser la
   * réduction très loin. Le réseau n'est jamais inclus dans ce délai.
   */
  const bonusMeta=
    idleNguBonuses(
      stats&&stats.metaNgu
    );

  const reduction =
    Math.max(
      0,
      Math.min(
        99,
        nombreSorealIdle_(
          stats &&
          stats.aventureCooldownReductionPct,
          0
        ) +
        Math.max(
          0,
          nombreSorealIdle_(
            bonusMeta.respawnReduction,
            0
          ) *
          100
        )
      )
    );

  const minimum =
    Math.max(
      0.05,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'AVENTURE_COOLDOWN_MIN_SECONDES',
          0.15
        ),
        0.15
      )
    );

  return Math.max(
    minimum,
    base *
    (
      1 -
      reduction / 100
    )
  );
}

function capacitesBossSorealIdle_(
  bossIndex
) {
  const definition =
    definitionBossSorealIdle_(
      bossIndex
    );

  return Array.isArray(
    definition &&
    definition.capacites
  )
    ? definition.capacites
    : [];
}

function capaciteBossSorealIdle_(
  bossIndex,
  type
) {
  const cible =
    String(type || '')
      .trim()
      .toLowerCase();

  return capacitesBossSorealIdle_(
    bossIndex
  ).filter(function(capacite) {
    return String(
      capacite &&
      capacite.type || ''
    )
      .trim()
      .toLowerCase() === cible;
  });
}

export function multiplicateurDpsJoueurBossSorealIdle_(
  bossIndex,
  ignorerParalysie
) {
  let multiplicateur = 1;

  capacitesBossSorealIdle_(
    bossIndex
  ).forEach(function(capacite) {
    const type =
      String(
        capacite.type || ''
      ).toLowerCase();

    const intervalle =
      Math.max(
        0.01,
        nombreSorealIdle_(
          capacite.intervalle,
          0
        )
      );

    const duree =
      Math.max(
        0,
        nombreSorealIdle_(
          capacite.duree,
          0
        )
      );

    if (
      type === 'paralysie' &&
      intervalle > 0 &&
      !ignorerParalysie
    ) {
      multiplicateur *=
        Math.max(
          0.05,
          1 -
          Math.min(
            0.85,
            duree / intervalle
          )
        );
    }

    if (
      type === 'bouclier' &&
      intervalle > 0
    ) {
      const reduction =
        Math.max(
          0,
          Math.min(
            0.95,
            nombreSorealIdle_(
              capacite.valeur,
              0
            ) / 100
          )
        );

      const occupation =
        Math.max(
          0,
          Math.min(
            0.85,
            duree / intervalle
          )
        );

      multiplicateur *=
        Math.max(
          0.05,
          1 -
          reduction *
          occupation
        );
    }
  });

  return Math.max(
    0.02,
    multiplicateur
  );
}

export function regenBossSecondeSorealIdle_(
  bossIndex,
  pvMax
) {
  /*
   * Fight Boss NGU expose un HP Regen propre au boss (bf_hp_regen).
   * Ce n'est PAS Defense/20 : cette formule appartient au joueur.
   * nguBossStatsV1 fournit désormais cette valeur sourcée sous "regen".
   *
   * On met à l'échelle par le ratio PV réels / PV de référence afin que
   * les difficultés Evil/Sadistic, qui divisent les stats Fight Boss,
   * conservent la même proportion sans dupliquer une seconde table.
   */
  const reference=
    nguBossStatsV1(
      bossIndex
    );

  const pvReference=
    Math.max(
      1,
      nombreSorealIdle_(
        reference&&reference.pv,
        1
      )
    );

  const regenReference=
    Math.max(
      0,
      nombreSorealIdle_(
        reference&&reference.regen,
        0
      )
    );

  const ratioPv=
    Math.max(
      0,
      nombreSorealIdle_(
        pvMax,
        pvReference
      )
    )/
    pvReference;

  return regenReference*ratioPv;
}

function multiplicateurAttaqueBossSorealIdle_(
  bossIndex,
  pvBoss,
  pvBossMax
) {
  const seuilPct =
    Math.max(
      1,
      Math.min(
        90,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'BOSS_FUREUR_SEUIL_PCT',
            30
          ),
          30
        )
      )
    );

  const sousSeuil =
    nombreSorealIdle_(
      pvBoss,
      pvBossMax
    ) <=
    Math.max(
      1,
      nombreSorealIdle_(
        pvBossMax,
        1
      )
    ) *
    seuilPct /
    100;

  if(!sousSeuil){
    return 1;
  }

  let multiplicateur = 1;

  capaciteBossSorealIdle_(
    bossIndex,
    'fureur'
  ).forEach(function(capacite) {
    multiplicateur *=
      1 +
      Math.max(
        0,
        nombreSorealIdle_(
          capacite.valeur,
          0
        )
      ) /
      100;
  });

  return multiplicateur;
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (5e paramètre, optionnel) propagé jusqu'à
 * attaqueBossSorealIdle_ -- voir NGU_BOSS_EVIL_SADISTIC_DIVIDER_V1
 * (idle-ngu-boss-reference-v1.js).
 */
export function degatsRecusSecondeSorealIdle_(
  bossVaincus,
  defense,
  pvBoss,
  pvBossMax,
  difficulty
) {
  const index =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    );

  const attaque =
    attaqueBossSorealIdle_(
      index,
      difficulty
    ) *
    multiplicateurAttaqueBossSorealIdle_(
      index,
      pvBoss,
      pvBossMax
    );

  /*
   * NGU Fight Boss : dégâts entrants = Boss Attack - Defense.
   * Defense >= Boss Attack signifie 0 dégât ; aucun plancher de 1 PV
   * ni 12 % de l'attaque n'existe dans cette règle.
   */
  return Math.max(
    0,
    attaque -
    Math.max(
      0,
      nombreSorealIdle_(
        defense,
        0
      )
    )
  );
}

export function recalculerPuissanceCompleteSorealIdle_(
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
      row[
        c.STATS_JSON - 1
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

  const ancienPv =
    Math.max(
      0,
      nombreSorealIdle_(
        row[
          c.PV_JOUEUR - 1
        ],
        combat.pvMax
      )
    );

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
      c.PUISSANCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.PV_JOUEUR_MAX
    )
    .setValue(
      combat.pvMax
    );

  feuille
    .getRange(
      ligne,
      c.PV_JOUEUR
    )
    .setValue(
      Math.min(
        combat.pvMax,
        ancienPv
      )
    );

  return combat.attaque;
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (3e paramètre, optionnel, défaut "normal") -- prépare le
 * diviseur ×1e-30 (nguBossStatsV1, idle-ngu-boss-reference-v1.js) sans
 * casser aucun appelant existant : "normal" reproduit exactement le
 * comportement d'avant ce correctif. Le branchement de contexte.difficulty
 * (déjà exposé par contexteMetaNguSorealIdle_) sur chaque site d'appel
 * réel du combat se fait progressivement, site par site -- voir le suivi
 * dans les commits suivants plutôt qu'un unique gros changement risqué
 * sur ~20 sites d'appel du moteur de combat en production.
 */
export function equilibrerBossPrincipalSorealIdleV413_(
  definition,
  index,
  difficulty
) {
  const source =
    definition &&
    typeof definition === 'object'
      ? definition
      : {};

  const i =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          index,
          0
        )
      )
    );

  /*
   * V56 — mission NGU (2026-09-09) : le plancher géométrique inventé
   * (×3/boss PV, ×2/boss Attaque) sous-estimait massivement la vraie
   * progression NGU (×5/boss du boss 5 au boss 20, ×10/boss à partir du
   * boss 21 — sourcé, vérifié exact sur 160 boss, voir
   * cloudflare/reference/README.md et idle-ngu-boss-reference-v1.js).
   * Cette sous-estimation explique très probablement le bug signalé où
   * les 20 premiers boss pouvaient être tués en spammant le bouton fight.
   *
   * Le plancher reste un MAX (pas un remplacement) : un catalogue qui
   * définit volontairement un boss plus fort (identité/histoire SOREAL)
   * garde le dessus. Seule la valeur plancher change, du placeholder
   * inventé vers la vraie courbe NGU.
   */
  const reference =
    nguBossStatsV1(i, difficulty);

  const pvMinimum = reference.pv;
  const attaqueMinimum = reference.attaque;
  const defenseMinimum = reference.defense;
  const xpMinimum = reference.xp;

  return Object.assign(
    {},
    source,
    {
      /*
       * Le catalogue historique ne définit plus l'identité d'un boss : il
       * peut rester présent dans une base existante, mais les noms affichés
       * sont toujours ceux de NGU, localisés en français.
       */
      nom:
        nomBossSurchargeV1(__idleCtx.__idleSql, i + 1) ||
        NGU_BOSS_NAMES_FR_V1.get(i + 1) ||
        String(source.nom || "Boss"),

      pv:
        Math.max(
          1,
          Math.round(
            pvMinimum
          )
        ),

      attaque:
        Math.max(
          1,
          Math.round(
            attaqueMinimum
          )
        ),

      /*
       * Audit 2026-09-13 (Norman, en jouant SOREAL et NGU en parallèle) :
       * la Defense d'un boss n'existait nulle part côté runtime — le
       * dégât du joueur contre le boss ne pouvait donc jamais la
       * soustraire (contrairement au wiki, page Attack : "Your attack
       * minus the defense of the boss is the amount you deduct from the
       * HP of the boss per second"). Même plancher (MAX, jamais un
       * remplacement) que pv/attaque ci-dessus, depuis la même référence
       * sourcée du wiki.
       */
      defense:
        Math.max(
          1,
          Math.round(
            defenseMinimum
          )
        ),

      /*
       * 2026-09-17 — contrairement à pv/attaque/defense (un plancher
       * légitime : un boss du catalogue SOREAL peut volontairement être
       * plus fort que la courbe NGU, identité propre au jeu), le XP stocké
       * dans IDLE_BOSS n'a jamais été un choix de design : 100/120/180/
       * .../19000 sur les boss 1-20 étaient des valeurs inventées, jamais
       * sourcées (comme le reste de ce fichier avant la mission NGU
       * 2026-09-09). Un simple MAX(source.xp, xpMinimum) ne pouvait donc
       * JAMAIS corriger ce bug : la valeur inventée est toujours
       * strictement supérieure au vrai plancher NGU (100 > 0, 19000 > 1,
       * etc.), donc toujours gagnante. Norman a vérifié en direct sur le
       * wiki (20 fiches boss individuelles, ngu-idle.fandom.com) que le XP
       * réel des boss 1-20 est 0/0/0/1/0/0/1×14 — EXACTEMENT
       * nguBossStatsV1(i).xp pour ces index (déjà sourcé le 2026-09-09,
       * jamais branché comme valeur autoritaire jusqu'ici). Le XP devient
       * donc autoritaire depuis la référence sourcée pour toute la plage
       * couverte par NGU_BOSS_REFERENCE_V1, plutôt qu'un plancher que la
       * donnée inventée pouvait toujours dominer.
       */
      xp:
        Math.max(
          0,
          Math.round(
            xpMinimum
          )
        ),

      /*
       * V185 — l'équilibrage NGU ne doit modifier que les statistiques.
       * L'identité éditoriale du boss (Histoire/Conseil) vient du même
       * catalogue IDLE_BOSS que Collection. L'ancien effacement ici faisait
       * que Collection affichait le texte tandis que Fight Boss recevait
       * bossHistoire="" et bossConseil="".
       */
      histoire:
        histoireBossAvecSurchargeSorealIdle_(
          i + 1,
          source.histoire
        ),
      /* Texte et nom PARLÉS (Norman, 2026-10-11) : ce que la voix dit, quel que soit le texte affiché ; vides si l'administrateur n'a rien fixé. */
      histoireParlee: texteBossParleV1(__idleCtx.__idleSql, i + 1) || '',
      nomParle: nomBossParleV1(__idleCtx.__idleSql, i + 1) || '',
      conseil:
        String(
          source.conseil || ""
        )
    }
  );
}

function profilEquipementCombatPrincipalSorealIdleV413_(
  inventaire,
  equipement
) {
  const details =
    detailsEquipementSorealIdle_(
      inventaire,
      equipement
    );

  let piecesEquipees = 0;
  let scorePuissance = 0;
  let piecesArmure = 0;
  let scoreArmure = 0;

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const objet =
        details &&
        details[slot]
          ? details[slot]
          : null;

      if (!objet) {
        return;
      }

      piecesEquipees += 1;

      const bonus =
        Math.max(
          0,
          nombreSorealIdle_(
            objet.bonusPuissance,
            0
          )
        );

      scorePuissance += bonus;

      if (
        slot === 'tete' ||
        slot === 'torse' ||
        slot === 'bottes'
      ) {
        piecesArmure += 1;
        scoreArmure += bonus;
      }
    });

  /*
   * Chaque pièce est utile même si son bonus brut est faible.
   * Le score de l'objet affine ensuite le multiplicateur.
   *
   * Ex. trois petits loots de zone 1 tournent typiquement autour
   * de +45 à +60 % d'attaque totale, ce qui est suffisant pour
   * faire sentir immédiatement le farm sans rendre le stuff dominant.
   */
  const multiplicateurAttaque =
    Math.min(
      3.5,
      1 +
      piecesEquipees * 0.08 +
      scorePuissance * 0.03
    );

  const multiplicateurDefense =
    Math.min(
      3.5,
      1 +
      piecesArmure * 0.10 +
      scoreArmure * 0.04
    );

  return {
    piecesEquipees:
      piecesEquipees,

    scorePuissance:
      scorePuissance,

    piecesArmure:
      piecesArmure,

    scoreArmure:
      scoreArmure,

    multiplicateurAttaque:
      Math.max(
        1,
        multiplicateurAttaque
      ),

    multiplicateurDefense:
      Math.max(
        1,
        multiplicateurDefense
      )
  };
}

/*
 * Panneau Detail de l Attack / Defense (Norman, 2026-09-26) : les facteurs exposes par le moteur NGU (bonusMetaNgu.facteursStats), tels qu'appliques.
 * Ce qui s'applique en plus (MacGuffins, Cards...) est deduit : autres = produit reellement applique / produit des facteurs listes, si bien que le produit
 * affiche est toujours exactement celui du serveur. Avant le boss 4 du run, l'equipement d'Aventure est retire du produit (voir statsCombatPrincipal...).
 */
function detailStatsCombatSorealIdle_(facteurs, produitApplique, retirerEquipement) {
  const liste = (Array.isArray(facteurs) ? facteurs : [])
    .filter(function(x) { return x && !(retirerEquipement && x.id === 'equipement'); })
    .map(function(x) { return { id: String(x.id), label: String(x.label), valeur: nombreSorealIdle_(x.valeur, 1) }; });
  const produitListe = liste.reduce(function(a, x) { return a * x.valeur; }, 1);
  const autres = produitListe > 0 && Number.isFinite(produitListe) ? produitApplique / produitListe : 1;
  return {
    facteurs: liste,
    autres: Number.isFinite(autres) && autres > 0 ? autres : 1,
    produit: produitApplique,
    equipementRetire: Boolean(retirerEquipement)
  };
}

/*
 * Les deux multiplicateurs (attaque, défense) que le combat applique à l'entraînement : produit de TOUS les bonus (NUMBER, Augmentations, Wandoos, NGU, Hacks, Wishes, Perks, Quirks, Yggdrasil, Diggers, Barbes...),
 * moins le facteur d'équipement d'Aventure tant qu'Aventure n'est pas débloquée (voir statsCombatPrincipalSorealIdleV413_). Une seule définition : l'état renvoyé au client ET la trajectoire future
 * (trajectoireMultiplicateursCombatSorealIdle_) la partagent, donc tout système qui influe sur les stats est couvert sans code propre.
 */
export function multiplicateursCombatSorealIdle_(bonusMetaNgu, bossesRun) {
  const aventureDebloquee =
    !Number.isFinite(Number(bossesRun)) ||
    Number(bossesRun) >= REBIRTH_UNLOCK_BOSS_V1;
  const facteurEquipementAttaque =
    aventureDebloquee
      ? 1
      : Math.max(1e-300, nombreSorealIdle_(bonusMetaNgu.equipmentAttackMultiplier, 1));
  const facteurEquipementDefense =
    aventureDebloquee
      ? 1
      : Math.max(1e-300, nombreSorealIdle_(bonusMetaNgu.equipmentDefenseMultiplier, 1));
  return {
    attaque: Math.max(1e-300, nombreSorealIdle_(bonusMetaNgu.attackMultiplier, 1)) / facteurEquipementAttaque,
    defense: Math.max(1e-300, nombreSorealIdle_(bonusMetaNgu.defenseMultiplier, 1)) / facteurEquipementDefense
  };
}

export function statsCombatPrincipalSorealIdleV413_(
  stats,
  inventaire,
  equipement,
  ameliorations,
  essence,
  collection,
  bossesRun
) {
  const etatStats =
    stats &&
    typeof stats === 'object'
      ? stats
      : {};

  const entrainement =
    deriveBasicTrainingStatsV411(
      normalizeBasicTrainingStateV411(
        etatStats.entrainementBase,
        Date.now()
      )
    );

  const profilEquipement =
    profilEquipementCombatPrincipalSorealIdleV413_(
      inventaire,
      equipement
    );

  // Legacy Piece-shop power must not stack with NGU progression.
  void ameliorations;
  void essence;
  const bonusBoutique = 0;

  const bonusMetaNgu =
    idleNguBonuses(
      etatStats.metaNgu
    );

  const bonusSets =
    bonusSetsSorealIdle_(
      inventaire,
      equipement
    );

  const bonusCollections =
    progressionCollectionsSorealIdle_(
      collection &&
      typeof collection === 'object'
        ? collection
        : {}
    );

  /*
   * Audit 2026-09-16 : dans le vrai NGU Idle, l'équipement/loot n'existe
   * QUE dans Adventure Mode — le combat de boss numéroté (Fight Boss/
   * Basic Training) n'a AUCUN objet équipé dans le vrai jeu, juste
   * Attack/Defense entraînés (+ NGU/Perks/Quirks). Le système de loot de
   * ce moteur historique (forge, équipement, sets, collections) était
   * une invention SOREAL sans équivalent NGU. Décision de Norman
   * (2026-09-16) : retirer cet effet du combat pour une fidélité NGU
   * totale — bonusSets/bonusCollections restent calculés ci-dessus
   * (aucune donnée supprimée, gel propre) mais ne contribuent plus au
   * combat. void pour ne jamais dériver "variable inutilisée".
   */
  void bonusSets;
  void bonusCollections;
  const multiplicateurPermanent = 1;

  const attaqueEntrainement =
    Math.max(
      100,
      nombreSorealIdle_(
        entrainement.attack,
        100
      )
    );

  const defenseEntrainement =
    Math.max(
      100,
      nombreSorealIdle_(
        entrainement.defense,
        100
      )
    );

  /*
   * 2026-09-25 (Norman, jeux côte à côte : « après un Rebirth NGU me fait retomber à 100 Attack / 100 Defense, alors que SOREAL m'en
   * donne des milliers (209 K PV contre 1 010) ; les bonus accumulés ne se déverrouillent qu'en avançant dans les boss ») :
   *  1. Wiki NUMBER : « multiplies your Attack and Defense from Basic Training » ; Basic Training : « natural attack and defense of 100,
   *     with trainings giving a bonus equal to Level^1.3 x BaseValue ». Le 100 naturel n'est donc jamais multiplié : seuls les points
   *     apportés par l'entraînement le sont (sans entraînement : 100 / 100, quel que soit le NUMBER).
   *  2. L'équipement d'Aventure (« +1 % Attack/Defense par point de Power/Toughness ») n'existe qu'une fois Adventure débloquée, au boss 4
   *     de CHAQUE run (wiki Rebirths : « Access to the Adventure... tabs until their related bosses are beaten ») : avant, son facteur
   *     est retiré du produit. bossesRun absent (appel sans contexte) : rien n'est retiré.
   */
  const aventureDebloquee =
    !Number.isFinite(Number(bossesRun)) ||
    Number(bossesRun) >= REBIRTH_UNLOCK_BOSS_V1;

  const { attaque: multiplicateurAttaqueEffectif, defense: multiplicateurDefenseEffectif } =
    multiplicateursCombatSorealIdle_(bonusMetaNgu, bossesRun);

  const attaque =
    Math.max(
      100,
      100 + Math.round(
        (
          (attaqueEntrainement - 100) +
          Math.max(
            0,
            nombreSorealIdle_(
              bonusBoutique,
              0
            )
          )
        ) *
        // Audit 2026-09-16 : équipement retiré du combat Fight Boss (voir
        // multiplicateurPermanent ci-dessus) — plus de fidélité NGU.
        1 *
        multiplicateurPermanent *
        /*
         * 2026-09-23 (audit) : le multiplicateur pouvait être écrasé à 1 alors
         * que le NUMBER d'un Rebirth rapide est très inférieur à 1 (wiki
         * "Rebirths" : il peut monter OU baisser) ; NGU applique bien x0,33
         * après un Rebirth de 10 min. Plancher strictement positif seulement.
         */
        multiplicateurAttaqueEffectif
      )
    );

  const defense =
    Math.max(
      100,
      100 + Math.round(
        (defenseEntrainement - 100) *
        // Audit 2026-09-16 : équipement retiré du combat Fight Boss (voir
        // multiplicateurPermanent ci-dessus) — plus de fidélité NGU.
        1 *
        multiplicateurPermanent *
        multiplicateurDefenseEffectif
      )
    );

  return {
    attaque:
      attaque,

    defense:
      defense,

    pvMax:
      Math.max(
        1000,
        Math.round(
          attaque *
          10
        )
      ),

    attaqueEntrainement:
      attaqueEntrainement,

    defenseEntrainement:
      defenseEntrainement,

    bonusBoutique:
      Math.max(
        0,
        nombreSorealIdle_(
          bonusBoutique,
          0
        )
      ),

    multiplicateurPermanent:
      multiplicateurPermanent,

    /*
     * 2026-09-24 (audit de composition, Attack/Defense ~x1100 plus élevés
     * dans NGU à niveaux d'entraînement identiques) : le client recalcule
     * l'Attaque/Défense à chaque frame à partir des niveaux d'entraînement
     * (soreal-idle-ui.js, progresserBasicTrainingLocalIdleV120_) avec des
     * multiplicateurs codés à 1 et écrasait donc la valeur serveur (NUMBER,
     * équipement, augments, Wandoos, perks, NGU...) : l'écran montrait
     * l'entraînement brut. Le produit réellement appliqué ici est exposé
     * pour que le client affiche/simule la même valeur que le serveur.
     */
    multiplicateurAttaqueTotal:
      multiplicateurAttaqueEffectif,

    multiplicateurDefenseTotal:
      multiplicateurDefenseEffectif,

    /* Panneau de detail (clic sur Attack / Defense) : facteurs un par un, voir detailStatsCombatSorealIdle_. */
    detailStats: {
      attaque: detailStatsCombatSorealIdle_(
        bonusMetaNgu.facteursStats && bonusMetaNgu.facteursStats.attaque,
        multiplicateurAttaqueEffectif,
        !aventureDebloquee
      ),
      defense: detailStatsCombatSorealIdle_(
        bonusMetaNgu.facteursStats && bonusMetaNgu.facteursStats.defense,
        multiplicateurDefenseEffectif,
        !aventureDebloquee
      ),
      equipement: bonusMetaNgu.facteursStats ? bonusMetaNgu.facteursStats.equipement : null
    },

    equipement:
      profilEquipement
  };
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (2e paramètre, optionnel, défaut "normal" -- voir
 * equilibrerBossPrincipalSorealIdleV413_ ci-dessus) : propagé vers TOUS les
 * appels internes (le catalogue vide, le catalogue SOREAL et la
 * progression infinie), pour que le diviseur ×1e-30 (Evil/SADISTIC,
 * nguBossStatsV1) s'applique de façon identique quel que soit le chemin.
 */
export function definitionBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  const catalogue =
    bossCatalogueSorealIdle_();

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

  if (!catalogue.length) {
    return equilibrerBossPrincipalSorealIdleV413_(
      {
        id: n + 1,
        nom:
          CONFIG_SOREAL_IDLE.BOSS_BASE,
        pv:
          CONFIG_SOREAL_IDLE.BOSS_PV_BASE,
        attaque:
          CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE,
        xp: 25,
        pieces: 5,
        niveauRequis: n + 1
      },
      n,
      difficulty
    );
  }

  if (n < catalogue.length) {
    return equilibrerBossPrincipalSorealIdleV413_(
      catalogue[n],
      n,
      difficulty
    );
  }

  /*
   * Après le catalogue initial, on garde la progression infinie
   * sans recycler les mêmes statistiques.
   */
  const dernier =
    equilibrerBossPrincipalSorealIdleV413_(
      catalogue[
        catalogue.length - 1
      ],
      catalogue.length - 1,
      difficulty
    );

  const supplement =
    n - catalogue.length + 1;

  return {
    id:
      n + 1,

    nom:
      dernier.nom +
      ' +' +
      supplement,

    /*
     * V56 — mission NGU (2026-09-09) : ×2.75/×1.35/boss (PV/Attaque) et
     * ×1.18/boss (XP) étaient des constantes inventées, jamais sourcées.
     * La vraie règle NGU (×10/boss, PV=Attaque×10, XP en palier +1 tous
     * les 10 boss) est maintenant la référence — cf.
     * idle-ngu-boss-reference-v1.js. On garde un MAX contre la
     * progression du catalogue au cas où celui-ci définirait volontai-
     * rement un boss plus fort (identité SOREAL), jamais plus faible que
     * la vraie courbe.
     */
    pv:
      Math.round(
        Math.max(
          dernier.pv *
          Math.pow(
            Math.max(
              1.01,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'BOSS_INFINI_MULTIPLICATEUR_PV',
                  10
                ),
                10
              )
            ),
            supplement
          ),
          nguBossStatsV1(n, difficulty).pv
        )
      ),

    attaque:
      Math.round(
        Math.max(
          dernier.attaque *
          Math.pow(
            Math.max(
              1.01,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'BOSS_INFINI_MULTIPLICATEUR_ATTAQUE',
                  10
                ),
                10
              )
            ),
            supplement
          ),
          nguBossStatsV1(n, difficulty).attaque
        )
      ),

    /*
     * Audit 2026-09-15 : ce champ manquait entièrement dans la branche
     * "progression infinie" (au-delà du catalogue) — un boss ici n'avait
     * donc AUCUNE Defense (nombreSorealIdle_ retombait sur la constante
     * CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE, minuscule comparée à la vraie
     * progression), ce qui rendait tout boss au-delà du catalogue
     * trivialement tuable en un coup — même cause racine que le bug déjà
     * corrigé pour pv/attaque/xp le 2026-09-09 (V56), jamais reporté pour
     * defense. Même plancher (MAX contre nguBossStatsV1) que les champs
     * ci-dessus.
     */
    defense:
      Math.round(
        Math.max(
          dernier.defense *
          Math.pow(
            Math.max(
              1.01,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'BOSS_INFINI_MULTIPLICATEUR_DEFENSE',
                  10
                ),
                10
              )
            ),
            supplement
          ),
          nguBossStatsV1(n, difficulty).defense
        )
      ),

    xp:
      Math.round(
        Math.max(
          dernier.xp *
          Math.pow(
            1.18,
            supplement
          ),
          nguBossStatsV1(n, difficulty).xp
        )
      ),

    pieces:
      Math.round(
        dernier.pieces *
        Math.pow(
          1.15,
          supplement
        )
      ),

    chanceLoot:
      nombreSorealIdle_(
        dernier.chanceLoot,
        0.55
      ),

    niveauRequis:
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            dernier.niveauRequis,
            catalogue.length
          )
        ) +
        supplement
      ),

    histoire:
      histoireBossAvecSurchargeSorealIdle_(
        n + 1,
        dernier.histoire
      ),
    histoireParlee: texteBossParleV1(__idleCtx.__idleSql, n + 1) || '',
    nomParle: nomBossParleV1(__idleCtx.__idleSql, n + 1) || '',
    mortVivant:
      Boolean(dernier.mortVivant),
    conseil:
      String(dernier.conseil || ''),

    capacites:
      Array.isArray(
        dernier.capacites
      )
        ? dernier.capacites.map(
            function(capacite) {
              return Object.assign(
                {},
                capacite
              );
            }
          )
        : []
  };
}

export function nomBossSorealIdle_(
  bossVaincus
) {
  return String(
    definitionBossSorealIdle_(
      bossVaincus
    ).nom
  );
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (2e paramètre, optionnel) -- même propagation que
 * attaqueBossSorealIdle_/defenseBossSorealIdle_ ci-dessus.
 */
export function pvMaxBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincus,
          difficulty
        ).pv,
        CONFIG_SOREAL_IDLE.BOSS_PV_BASE
      )
    )
  );
}

export function xpBossSorealIdle_(
  bossVaincusAvant
) {
  /*
   * 2026-09-17 — ce plancher de 1 empêchait à jamais un boss au XP réel
   * de 0 (wiki : boss 1/2/3/5/6 du catalogue SOREAL) de donner 0 XP,
   * quelle que soit la correction apportée en amont
   * (equilibrerBossPrincipalSorealIdleV413_). C'était le deuxième étage
   * du même bug : même après avoir corrigé la donnée source, ce floor
   * la remontait quand même à 1 juste avant l'octroi au joueur.
   */
  return Math.max(
    0,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincusAvant
        ).xp,
        25
      )
    )
  );
}

/*
 * FTBE — "First Time Beaten Ever" (2026-09-17).
 *
 * NGU accorde un bonus XP UNIQUE la toute première fois qu'un boss est
 * vaincu par un compte, jamais reversé aux kills suivants (même run ou
 * après une Renaissance) — mécanique absente jusqu'ici de ce moteur.
 *
 * Plutôt que d'ajouter un nouveau champ persistant, on réutilise
 * metaNgu.records.highestBoss : un high-water-mark déjà permanent
 * (jamais remis à 0 par applyRebirthResetV56_/rebirthIdleNguState, cf.
 * idle-ngu-progression.js — seul totalRebirths y est incrémenté), déjà
 * mis à jour par Math.max(existant, bosses) dans normalizeIdleNguState,
 * et déjà utilisé pour la découverte permanente du Bestiaire (cf.
 * construireBestiaireSorealIdle_ / "index < bossVaincus" avec
 * highestBossEver). Comme la progression des boss principaux est
 * strictement séquentielle (bossVaincus avance par pas de 1, jamais de
 * saut), highestBoss = N signifie exactement "les boss d'index 0..N-1
 * ont déjà été vaincus au moins une fois, un jour, sur ce compte" — la
 * même donnée que le FTBE a besoin de suivre, sans nouveau champ.
 *
 * Cette valeur ne reflète que les kills des requêtes PRÉCÉDENTES (déjà
 * sauvegardées) : un combat/NUKE peut vaincre plusieurs boss d'affilée
 * dans la MÊME requête, donc l'appelant doit garder son propre compteur
 * local (initialisé une fois avant la boucle de résolution) et le faire
 * avancer via enregistrerBossJamaisVaincuSorealIdle_ après chaque kill,
 * plutôt que relire metaNgu.records.highestBoss à chaque itération.
 */
export function highestBossJamaisAtteintSorealIdle_(metaNgu) {
  return Math.max(
    0,
    Math.floor(
      nombreSorealIdle_(
        metaNgu &&
          metaNgu.records &&
          metaNgu.records.highestBoss,
        0
      )
    )
  );
}

/*
 * Bonus XP FTBE pour un index de boss 0-based. Ne couvre QUE les 20 boss
 * du catalogue SOREAL (nguBossFtbeBonusXpV1 renvoie 0 au-delà — voir le
 * commentaire de cette fonction dans idle-ngu-boss-reference-v1.js pour
 * la justification : aucune fiche wiki individuelle vérifiée au-delà du
 * boss 20 pour ce bonus précis).
 */
export function xpBonusPremiereFoisSorealIdle_(bossIndex) {
  return Math.max(
    0,
    Math.round(
      nguBossFtbeBonusXpV1(
        bossIndex
      )
    )
  );
}

/*
 * Fait avancer le high-water-mark permanent après un kill qui vient de
 * battre le record du compte (bossIndex >= highestBossJamaisAtteintSorealIdle_
 * AVANT ce kill). Mute metaNgu.records directement : l'appelant sérialise
 * ensuite le même objet metaNgu dans STATS_JSON, donc aucune écriture
 * séparée n'est nécessaire ici.
 */
export function enregistrerBossJamaisVaincuSorealIdle_(metaNgu, bossIndex) {
  if (!metaNgu.records || typeof metaNgu.records !== 'object') {
    metaNgu.records = {};
  }

  metaNgu.records.highestBoss = Math.max(
    highestBossJamaisAtteintSorealIdle_(metaNgu),
    Math.floor(bossIndex) + 1
  );
}

export function appliquerNiveauxSorealIdle_(
  niveau,
  xp
) {
  void niveau;
  return {
    niveau: 1,
    xp: Math.max(0,nombreSorealIdle_(xp,0)),
    niveauxGagnes: 0,
    xpRequise: 0
  };
}
