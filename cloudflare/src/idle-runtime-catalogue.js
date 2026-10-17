/*
 * Tables du catalogue (boss, zones, sorts, objets, sets) et mémos (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { texteBossSurchargeV1, texteBossParleV1, nomBossParleV1 } from "./idle-textes-v1.js";
import { CacheService, __idleCtx } from "./idle-sqlite-runtime.js";
import { obtenirSpreadsheetSorealIdle_ } from "./idle-runtime-acces.js";
import { nombreSorealIdle_ } from "./idle-runtime-config.js";
import { DriveApp } from "./idle-runtime-classeur.js";

function memoTableSorealIdleV19_(nom) {
  const cle = String(nom || '');
  const item = __idleCtx.__SOREAL_IDLE_TABLE_MEMO_V19__[cle];

  if (
    !item ||
    !item.ts ||
    Date.now() - item.ts > __idleCtx.__SOREAL_IDLE_MEMO_MS_V19__
  ) {
    return null;
  }

  return Array.isArray(item.data)
    ? item.data
    : null;
}

function memoriserTableSorealIdleV19_(nom, data) {
  __idleCtx.__SOREAL_IDLE_TABLE_MEMO_V19__[
    String(nom || '')
  ] = {
    ts: Date.now(),
    data: Array.isArray(data) ? data : []
  };

  return __idleCtx.__SOREAL_IDLE_TABLE_MEMO_V19__[
    String(nom || '')
  ].data;
}

function lireTableSorealIdle_(nomFeuille) {
  const nom = String(nomFeuille || '').trim();

  if (!nom) {
    return [];
  }

  const memo = memoTableSorealIdleV19_(nom);

  if (memo) {
    return memo;
  }

  const cleCache =
    'SOREAL_IDLE_TABLE_V18_' + nom;

  const cache =
    CacheService.getScriptCache();

  const enCache =
    cache.get(cleCache);

  if (enCache) {
    try {
      const parsed = JSON.parse(enCache);

      if (Array.isArray(parsed)) {
        return memoriserTableSorealIdleV19_(
          nom,
          parsed
        );
      }
    } catch (e) {}
  }

  const ss =
    obtenirSpreadsheetSorealIdle_();

  const feuille =
    ss.getSheetByName(nom);

  if (!feuille) {
    return memoriserTableSorealIdleV19_(
      nom,
      []
    );
  }

  const lastRow =
    feuille.getLastRow();

  const lastColumn =
    feuille.getLastColumn();

  if (
    lastRow < 2 ||
    lastColumn < 1
  ) {
    return memoriserTableSorealIdleV19_(
      nom,
      []
    );
  }

  const valeurs =
    feuille
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getValues();

  const entetes =
    valeurs[0]
      .map(function(v) {
        return String(v || '').trim();
      });

  const lignes = [];

  for (
    let r = 1;
    r < valeurs.length;
    r += 1
  ) {
    const ligne = {};
    let vide = true;

    for (
      let c = 0;
      c < entetes.length;
      c += 1
    ) {
      const entete = entetes[c];

      if (!entete) {
        continue;
      }

      const valeur =
        valeurs[r][c];

      if (
        valeur !== '' &&
        valeur !== null
      ) {
        vide = false;
      }

      ligne[entete] = valeur;
    }

    if (!vide) {
      lignes.push(ligne);
    }
  }

  try {
    cache.put(
      cleCache,
      JSON.stringify(lignes),
      __idleCtx.__SOREAL_IDLE_CACHE_SEC_V19__
    );
  } catch (e) {
    /*
     * CacheService refuse notamment les valeurs trop volumineuses.
     * La donnée lue reste utilisable dans l'exécution en cours.
     */
  }

  return memoriserTableSorealIdleV19_(
    nom,
    lignes
  );
}

function parametresSorealIdle_() {
  if (
    __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_V19__ &&
    __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_TS_V19__ &&
    Date.now() -
      __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_TS_V19__ <=
      __idleCtx.__SOREAL_IDLE_MEMO_MS_V19__
  ) {
    return __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_V19__;
  }

  const lignes =
    lireTableSorealIdle_(
      'CONFIG'
    );

  const resultat = {};

  lignes.forEach(function(ligne) {
    const cle =
      String(
        ligne['Paramètre'] ||
        ligne.Parametre ||
        ligne.parametre ||
        ligne['PARAMÈTRE'] ||
        ligne.Nom ||
        ligne.nom ||
        ''
      )
        .trim()
        .toUpperCase();

    if (!cle) {
      return;
    }

    resultat[cle] =
      ligne.Valeur !== undefined
        ? ligne.Valeur
        : ligne.valeur;
  });

  __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_V19__ =
    resultat;

  __idleCtx.__SOREAL_IDLE_PARAMS_MEMO_TS_V19__ =
    Date.now();

  return resultat;
}

export function parametreSorealIdle_(cle, defaut) {
  const params =
    parametresSorealIdle_();

  const valeur =
    params[
      String(cle || '')
        .trim()
        .toUpperCase()
    ];

  if (
    valeur === undefined ||
    valeur === null ||
    valeur === ''
  ) {
    return defaut;
  }

  return valeur;
}

export function banniereSorealIdleDriveFileId_() {
  return String(
    parametreSorealIdle_(
      'BANNIERE_SOREAL_IDLE_DRIVE_ID',
      ''
    )
  ).trim();
}

/*
 * Chronique d'un boss modifiée par l'administrateur (table idle_textes, clé « boss:<numéro> », voir idle-textes-v1.js) : remplace le texte du
 * catalogue partout où il est servi (Fight Boss, Collection, liste des boss). Sans surcharge, le texte d'origine est renvoyé tel quel.
 */
export function histoireBossAvecSurchargeSorealIdle_(numero, defaut) {
  const t = texteBossSurchargeV1(__idleCtx.__idleSql, numero);
  return t != null ? t : String(defaut || '');
}

/*
 * Texte et nom PARLÉS d'un boss (Norman, 2026-10-17 : « ce que je crée dans ce menu doit être appliqué immédiatement partout où on peut lire ce texte ») : ce que l'administrateur a fait dire à la voix, quel que soit le texte
 * affiché. Joints à CHAQUE endroit où une chronique de boss peut être lue (collection, fiche, carte du boss, lecteur de chroniques) : sans eux, ces lecteurs retombaient sur la voix de secours.
 */
export function histoireBossParleeSorealIdle_(numero) {
  return texteBossParleV1(__idleCtx.__idleSql, numero) || '';
}
export function nomBossParleSorealIdle_(numero) {
  return nomBossParleV1(__idleCtx.__idleSql, numero) || '';
}

export function bossCatalogueSorealIdle_() {
  const source = lireTableSorealIdle_('IDLE_BOSS');
  if (__idleCtx.__bossCatalogueMemoV1.source === source && __idleCtx.__bossCatalogueMemoV1.valeur) {
    return __idleCtx.__bossCatalogueMemoV1.valeur;
  }
  const valeur = bossCatalogueConstruireSorealIdle_(source);
  __idleCtx.__bossCatalogueMemoV1 = { source: source, valeur: valeur };
  return valeur;
}

function bossCatalogueConstruireSorealIdle_(table) {
  return table
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      // Systeme de capacites (regen/bouclier/paralysie/fureur/fracas/sceau)
      // retire : mecanique 100% SOREAL sans equivalent NGU, remplacee par
      // la resolution Attaque-vs-Defense pure documentee sur le wiki.
      const capacites = [];

      return {
        id:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.ID,
                index + 1
              )
            )
          ),

        nom:
          String(
            ligne.Nom || 'Boss'
          ),

        pv:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PV,
                500
              )
            )
          ),

        attaque:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Attaque,
                2
              )
            )
          ),

        /*
         * 2026-09-17 — ce plancher de 1 forçait un minimum de 1 XP même
         * pour un boss dont le XP réel (repeat-kill) est 0 (wiki : boss
         * 1/2/3/5/6 du catalogue). equilibrerBossPrincipalSorealIdleV413_
         * rend maintenant le XP autoritaire depuis la référence sourcée
         * (ce champ brut ne sert donc plus qu'à un éventuel accès direct
         * hors combat), mais gardait quand même ce plancher inexact.
         */
        xp:
          Math.max(
            0,
            Math.round(
              nombreSorealIdle_(
                ligne.XP,
                25
              )
            )
          ),

        pieces:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Pieces,
                5
              )
            )
          ),

        chanceLoot:
          Math.max(
            0,
            Math.min(
              1,
              nombreSorealIdle_(
                ligne.ChanceLoot,
                0.45
              )
            )
          ),

        image:
          String(
            ligne.Image || ''
          ).trim(),

        driveFileId:
          String(
            ligne.DriveFileID || ''
          ).trim(),

        histoire:
          index===3
            ?"Alors que tu te tournes vers la sortie de cette 'pièce', tu remarques une petite souris marron. D'une voix stridente, elle couine : BIENVENUE dans SOREAL IDLE ! Moi c'est Tippy. Sa petite voix de merde, te donne envie de lui péter la gueule... le besoin de vaincre CHAQUE ennemi sur ton chemin, quoi qu'il arrive. Tu peux commencer avec cette souris et arracher sa tête de con."
            :String(
                ligne.Histoire || ''
              ).trim(),

        mortVivant:
          ligne.MortVivant === true ||
          String(
            ligne.MortVivant || ''
          )
            .trim()
            .toLowerCase() === 'true',

        conseil:
          String(
            ligne.Conseil || ''
          ).trim(),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                index + 1
              )
            )
          ),

        capacites:
          capacites,

        bossCible:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.BossCible,
                index + 1
              )
            )
          )
      };
    })
    .sort(function(a, b) {
      return a.id - b.id;
    });
}

function indexImagesAventureSorealIdle_() {
  const cache =
    CacheService.getScriptCache();

  const cle =
    'SOREAL_IDLE_AVENTURE_IMAGES_V18';

  const brut =
    cache.get(cle);

  if (brut) {
    try {
      const parsed =
        JSON.parse(brut);

      if (
        parsed &&
        typeof parsed === 'object'
      ) {
        return parsed;
      }
    } catch (e) {}
  }

  const resultat = {};

  const dossierId =
    String(
      parametreSorealIdle_(
        'DOSSIER_AVENTURE_DRIVE_ID',
        '1D75f90EEsGxNALcnBmKPvWobJC9QMIFc'
      ) || ''
    ).trim();

  if (dossierId) {
    try {
      const fichiers =
        DriveApp
          .getFolderById(
            dossierId
          )
          .getFiles();

      while (
        fichiers.hasNext()
      ) {
        const f =
          fichiers.next();

        resultat[
          String(
            f.getName() || ''
          )
            .trim()
            .toLowerCase()
        ] = f.getId();
      }
    } catch (e) {}
  }

  try {
    cache.put(
      cle,
      JSON.stringify(resultat),
      __idleCtx.__SOREAL_IDLE_CACHE_SEC_V19__
    );
  } catch (e) {}

  return resultat;
}

export function zonesTableSorealIdle_() {
  const indexImages =
    indexImagesAventureSorealIdle_();

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

  return lireTableSorealIdle_(
    'IDLE_ZONES'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      const imageName =
        String(
          ligne.ImageName ||
          ligne.Image ||
          ''
        ).trim();

      const idDirect =
        String(
          ligne.DriveFileID || ''
        ).trim();

      const idParNom =
        imageName
          ? String(
              indexImages[
                imageName.toLowerCase()
              ] || ''
            )
          : '';

      return {
        id:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.ID,
                index + 1
              )
            )
          ),

        monde:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Monde,
                Math.floor(
                  index /
                  zonesParMonde
                ) + 1
              )
            )
          ),

        nom:
          String(
            ligne.Nom || 'Zone'
          ),

        emoji:
          String(
            ligne.Emoji || '🗺️'
          ),

        description:
          String(
            ligne.Description || ''
          ),

        ennemi:
          String(
            ligne.Ennemi || 'Ennemi'
          ),

        boss:
          String(
            ligne.Boss || 'Boss'
          ),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                1
              )
            )
          ),

        puissanceRecommandee:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PuissanceRecommandee,
                1
              )
            )
          ),

        coutEntree:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.CoutEntree,
                30
              )
            )
          ),

        pvEnnemi:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PVEnnemi,
                120
              )
            )
          ),

        attaqueEnnemi:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.AttaqueEnnemi,
                3
              )
            )
          ),

        pvBoss:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PVBoss,
                384
              )
            )
          ),

        attaqueBoss:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.AttaqueBoss,
                5
              )
            )
          ),

        points:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Points,
                2
              )
            )
          ),

        pieces:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Pieces,
                4
              )
            )
          ),

        image:
          String(
            ligne.Image || ''
          ).trim(),

        imageName:
          imageName,

        driveFileId:
          idDirect || idParNom
      };
    })
    .sort(function(a, b) {
      return a.id - b.id;
    });
}

export function sortsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_SORTS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne) {
      return {
        id:
          String(
            ligne.ID || ''
          ).trim(),

        nom:
          String(
            ligne.Nom || 'Sort'
          ).trim(),

        emoji:
          String(
            ligne.Emoji || '✨'
          ).trim(),

        description:
          String(
            ligne.Description || ''
          ).trim(),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                1
              )
            )
          ),

        coutPieces:
          Math.max(
            0,
            Math.round(
              nombreSorealIdle_(
                ligne.CoutPieces,
                0
              )
            )
          ),

        coutMana:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.CoutMana,
              0
            )
          ),

        cooldownSec:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.CooldownSec,
              0
            )
          ),

        type:
          String(
            ligne.Type || ''
          )
            .trim()
            .toLowerCase(),

        valeur:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Valeur,
              0
            )
          ),

        valeurSecondaire:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.ValeurSecondaire,
              0
            )
          ),

        duree:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Duree,
              0
            )
          ),

        cibles:
          String(
            ligne.Cible || ''
          )
            .split(',')
            .map(function(v) {
              return String(v || '')
                .trim()
                .toLowerCase();
            })
            .filter(Boolean),

        effetMortVivant:
          String(
            ligne.EffetMortVivant || ''
          )
            .trim()
            .toLowerCase()
      };
    })
    .filter(function(sort) {
      return Boolean(sort.id);
    });
}

export function lootsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_LOOTS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'loot_' +
              (index + 1)
            )
          ),

        slot:
          String(
            ligne.Slot || ''
          ),

        nom:
          String(
            ligne.Nom || 'Objet'
          ),

        zoneId:
          Math.max(
            0,
            Math.floor(
              nombreSorealIdle_(
                ligne.ZoneID,
                0
              )
            )
          ),

        boss:
          String(
            ligne.Boss || ''
          ).trim(),

        poids:
          Math.max(
            0.01,
            nombreSorealIdle_(
              ligne.Poids,
              1
            )
          ),

        chanceDrop:
          Math.max(
            0,
            Math.min(
              1,
              nombreSorealIdle_(
                ligne.ChanceDrop,
                1
              )
            )
          ),

        basePuissance:
          Math.max(
            1,
            nombreSorealIdle_(
              ligne.BasePuissance,
              3
            )
          ),

        setId:
          String(
            ligne.SetID || ''
          ).trim(),

        image:
          String(
            ligne.Image || ''
          ).trim()
      };
    });
}

export function setsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_SETS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'set_' +
              (index + 1)
            )
          ).trim(),

        nom:
          String(
            ligne.Nom || 'Set'
          ),

        zoneId:
          Math.max(
            0,
            Math.floor(
              nombreSorealIdle_(
                ligne.ZoneID,
                0
              )
            )
          ),

        pieces2:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Pieces2,
                2
              )
            )
          ),

        bonus2Pct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Bonus2Pct,
              5
            )
          ),

        pieces4:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Pieces4,
                4
              )
            )
          ),

        bonus4Pct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Bonus4Pct,
              12
            )
          ),

        pieces6:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Pieces6,
                6
              )
            )
          ),

        bonus6Pct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Bonus6Pct,
              30
            )
          ),

        apparence:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Apparence,
                1
              )
            )
          ),

        description:
          String(
            ligne.Description || ''
          )
      };
    });
}

export function setParIdSorealIdle_(setId) {
  const id =
    String(setId || '');

  if (!id) {
    return null;
  }

  const sets =
    setsSorealIdle_();

  for (
    let i = 0;
    i < sets.length;
    i += 1
  ) {
    if (
      sets[i].id === id
    ) {
      return sets[i];
    }
  }

  return null;
}

export function collectionsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_COLLECTIONS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'collection_' +
              (index + 1)
            )
          ).trim(),

        zoneId:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.ZoneID,
                index + 1
              )
            )
          ),

        nom:
          String(
            ligne.Nom ||
            (
              'Collection zone ' +
              (index + 1)
            )
          ),

        bonusPuissancePct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.BonusPuissancePct,
              0
            )
          ),

        description:
          String(
            ligne.Description || ''
          )
      };
    })
    .sort(function(a, b) {
      return a.zoneId - b.zoneId;
    });
}

export function reposSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_REPOS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'BEDROOM_' +
              (index + 1)
            )
          ),

        nom:
          String(
            ligne.Nom ||
            'Salle de repos'
          ),

        numero:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Numero,
                index + 1
              )
            )
          ),

        regenPctSec:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.RegenPctSec,
              2.5
            )
          ),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                1
              )
            )
          ),

        image:
          String(
            ligne.Image ||
            (
              'Bedroom_' +
              (index + 1) +
              '.png'
            )
          ),

        driveFileId:
          String(
            ligne.DriveFileID || ''
          ).trim()
      };
    })
    .sort(function(a, b) {
      return a.numero - b.numero;
    });
}

export function apparencesSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_APPARENCES'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'PLAYER_' +
              (index + 1)
            )
          ),

        nom:
          String(
            ligne.Nom || 'Apparence'
          ),

        numero:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Numero,
                index + 1
              )
            )
          ),

        setIdRequis:
          String(
            ligne.SetIDRequis || ''
          ).trim(),

        image:
          String(
            ligne.Image ||
            (
              'Player_' +
              (index + 1) +
              '.png'
            )
          ),

        driveFileId:
          String(
            ligne.DriveFileID || ''
          ).trim()
      };
    })
    .sort(function(a, b) {
      return a.numero - b.numero;
    });
}

export function boutiqueConfigSorealIdle_(type) {
  const lignes =
    lireTableSorealIdle_(
      'IDLE_BOUTIQUE'
    );

  const cle =
    String(type || '');

  for (
    let i = 0;
    i < lignes.length;
    i += 1
  ) {
    if (
      String(
        lignes[i].Type || ''
      ) === cle
    ) {
      return {
        base:
          Math.max(
            1,
            nombreSorealIdle_(
              lignes[i].CoutBase,
              20
            )
          ),

        croissance:
          Math.max(
            1,
            nombreSorealIdle_(
              lignes[i].Croissance,
              1.6
            )
          ),

        bonusParNiveau:
          nombreSorealIdle_(
            lignes[i].BonusParNiveau,
            1
          )
      };
    }
  }

  return null;
}

export function deblocagesSorealIdle_() {
  const resultat = {};

  lireTableSorealIdle_(
    'IDLE_DEBLOCAGES'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .forEach(function(ligne) {
      const id =
        String(
          ligne.ID || ''
        ).trim();

      if (!id) {
        return;
      }

      resultat[id] = {
        niveau:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Niveau,
                1
              )
            )
          ),

        nom:
          String(
            ligne.Nom || id
          )
      };
    });

  resultat.aventure =
    Object.assign(
      {},
      resultat.aventure || {
        nom: 'Aventure'
      },
      {
        niveau: 1
      }
    );

  return resultat;
}
