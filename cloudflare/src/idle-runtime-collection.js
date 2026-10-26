/*
 * Objets, équipement, collection et bestiaire (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { normalizeIdleAdventureStateV47, idleAdventureMobBestiaryEntryV1, IDLE_ADVENTURE_ZONES, IDLE_ADVENTURE_MOB_CATALOG_V1, IDLE_ADVENTURE_MOB_BESTIARY_V1 } from "./idle-adventure-v47.js";
import { CONFIG_SOREAL_IDLE, nombreSorealIdle_ } from "./idle-runtime-config.js";
import { bossCatalogueSorealIdle_, collectionsSorealIdle_, histoireBossAvecSurchargeSorealIdle_, histoireBossParleeSorealIdle_, nomBossParleSorealIdle_, lootsSorealIdle_ } from "./idle-runtime-catalogue.js";
import { definitionBossSorealIdle_ } from "./idle-runtime-boss.js";

export function parserJsonSorealIdle_(
  valeur,
  defaut
) {
  try {
    const texte =
      String(valeur || '').trim();

    if (!texte) {
      return defaut;
    }

    const parsed =
      JSON.parse(texte);

    return parsed === null
      ? defaut
      : parsed;
  } catch (e) {
    return defaut;
  }
}

export function slotsEquipementSorealIdle_() {
  return [
    'tete',
    'torse',
    'bottes',
    'arme',
    'bijou1',
    'bijou2'
  ];
}

export function bonusEquipementSorealIdle_(
  inventaire,
  equipement
) {
  const items =
    Array.isArray(inventaire)
      ? inventaire
      : [];

  const equip =
    equipement &&
    typeof equipement === 'object'
      ? equipement
      : {};

  let bonus = 0;

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const id =
        String(
          equip[slot] || ''
        );

      if (!id) {
        return;
      }

      const objet =
        items.find(function(item) {
          return String(item.id) === id;
        });

      if (objet) {
        bonus +=
          Math.max(
            0,
            nombreSorealIdle_(
              objet.bonusPuissance,
              0
            )
          );
      }
    });

  return bonus;
}

export function detailsEquipementSorealIdle_(
  inventaire,
  equipement
) {
  const items =
    Array.isArray(inventaire)
      ? inventaire
      : [];

  const equip =
    equipement &&
    typeof equipement === 'object'
      ? equipement
      : {};

  const resultat = {};

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const valeur =
        equip[slot];

      const id =
        valeur &&
        typeof valeur === 'object'
          ? String(valeur.id || '')
          : String(valeur || '');

      resultat[slot] =
        items.find(function(item) {
          return String(item.id) === id;
        }) || null;
    });

  return resultat;
}

/*
 * Audit 2026-09-17 (grand nettoyage) : rareteAleatoireSorealIdle_,
 * lootEligibleSorealIdle_ et choisirLootPondereSorealIdle_ n'avaient
 * plus qu'un seul appelant chacun — le corps mort de
 * genererObjetLootSorealIdle_ ci-dessous, jamais atteint depuis le
 * gel du 2026-09-16 (return null; avant tout le reste). Supprimées
 * (zéro autre référence dans le dépôt, vérifié), avec le corps mort
 * qui les appelait.
 */
export function genererObjetLootSorealIdle_(
  contexte
) {
  /*
   * Audit 2026-09-16 : plus de fidélité NGU pour le combat de boss
   * numéroté (Fight Boss/Basic Training) -- l'équipement/loot n'existe
   * que dans Adventure Mode dans le vrai jeu. Coupé à la source (chaque
   * appelant traite déjà un retour null comme "rien obtenu", même
   * comportement que quand aucun objet n'est éligible) plutôt que dans
   * chacun des call sites, pour un seul point de vérité.
   */
  void contexte;
  return null;
}

/*
 * Compatibilité avec le combat principal historique.
 */
function genererObjetBossSorealIdle_(
  bossVaincusAvant,
  bossNom
) {
  return genererObjetLootSorealIdle_({
    zoneId: 0,
    zoneNom: '',
    bossNom:
      String(
        bossNom || ''
      ),
    progression:
      Math.max(
        0,
        nombreSorealIdle_(
          bossVaincusAvant,
          0
        )
      )
  });
}

function nomBaseObjetCollectionSorealIdle_(
  objet
) {
  let nom =
    String(
      objet && objet.nom || 'Objet'
    ).trim();

  const prefixes = [
    'Légendaire ',
    'Legendaire ',
    'Épique ',
    'Epique ',
    'Rare ',
    'Peu commun ',
    'Commun '
  ];

  prefixes.forEach(function(prefixe) {
    if (
      nom.indexOf(prefixe) === 0
    ) {
      nom =
        nom.substring(
          prefixe.length
        ).trim();
    }
  });

  return nom || 'Objet';
}

function cleCollectionObjetSorealIdle_(
  objet
) {
  const definitionId =
    String(
      objet && objet.definitionId || ''
    ).trim();

  if (definitionId) {
    return 'DEF|' + definitionId;
  }

  return [
    'LEGACY',
    String(
      objet && objet.zoneId || 0
    ),
    String(
      objet && objet.slot || 'objet'
    ),
    nomBaseObjetCollectionSorealIdle_(
      objet
    )
  ].join('|');
}

function collectionObjetSerializableSorealIdle_(
  objet
) {
  return {
    cle:
      cleCollectionObjetSorealIdle_(
        objet
      ),

    definitionId:
      String(
        objet && objet.definitionId || ''
      ),

    nom:
      nomBaseObjetCollectionSorealIdle_(
        objet
      ),

    nomComplet:
      String(
        objet && objet.nom || 'Objet'
      ),

    slot:
      String(
        objet && objet.slot || ''
      ),

    rarete:
      String(
        objet && objet.rarete || 'commun'
      ),

    rareteNom:
      String(
        objet && objet.rareteNom || 'Commun'
      ),

    bonusPuissance:
      Math.max(
        0,
        nombreSorealIdle_(
          objet && objet.bonusPuissance,
          0
        )
      ),

    fusionMax:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            objet && objet.fusion,
            0
          )
        )
      ),

    source:
      String(
        objet && objet.source || ''
      ),

    setId:
      String(
        objet && objet.setId || ''
      ),

    setNom:
      String(
        objet && objet.setNom || ''
      ),

    image:
      String(
        objet && objet.image || ''
      ),

    zoneId:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            objet && objet.zoneId,
            0
          )
        )
      ),

    obtenuLe:
      String(
        objet && objet.obtenuLe || ''
      )
  };
}

function fusionnerObjetDansCollectionSorealIdle_(
  collection,
  objet
) {
  if (
    !objet ||
    !objet.id
  ) {
    return false;
  }

  const entree =
    collectionObjetSerializableSorealIdle_(
      objet
    );

  const cle =
    entree.cle;

  const ancienne =
    collection[cle];

  if (!ancienne) {
    collection[cle] =
      entree;

    return true;
  }

  let modifie = false;

  if (
    entree.bonusPuissance >
    nombreSorealIdle_(
      ancienne.bonusPuissance,
      0
    )
  ) {
    ancienne.bonusPuissance =
      entree.bonusPuissance;

    modifie = true;
  }

  if (
    entree.fusionMax >
    nombreSorealIdle_(
      ancienne.fusionMax,
      0
    )
  ) {
    ancienne.fusionMax =
      entree.fusionMax;

    modifie = true;
  }

  if (
    entree.source &&
    !ancienne.source
  ) {
    ancienne.source =
      entree.source;

    modifie = true;
  }

  return modifie;
}

export function synchroniserCollectionSorealIdle_(
  feuille,
  ligne,
  inventaire
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const cellule =
    feuille.getRange(
      ligne,
      c.COLLECTION_JSON
    );

  let collection =
    parserJsonSorealIdle_(
      cellule.getValue(),
      {}
    );

  if (
    !collection ||
    typeof collection !== 'object' ||
    Array.isArray(collection)
  ) {
    collection = {};
  }

  let modifie = false;

  (
    Array.isArray(inventaire)
      ? inventaire
      : []
  ).forEach(function(objet) {
    if (
      fusionnerObjetDansCollectionSorealIdle_(
        collection,
        objet
      )
    ) {
      modifie = true;
    }
  });

  if (modifie) {
    cellule.setValue(
      JSON.stringify(
        collection
      )
    );
  }

  return collection;
}

export function listeCollectionSorealIdle_(
  collection
) {
  const uniques = {};

  Object.keys(
    collection || {}
  ).forEach(function(cle) {
    const entree =
      collection[cle];

    if (
      !entree ||
      typeof entree !== 'object'
    ) {
      return;
    }

    const uniqueKey =
      String(
        entree.definitionId || ''
      ).trim() ||
      [
        String(entree.zoneId || 0),
        String(entree.slot || ''),
        String(entree.nom || '')
      ].join('|');

    const ancienne =
      uniques[uniqueKey];

    if (
      !ancienne ||
      nombreSorealIdle_(
        entree.bonusPuissance,
        0
      ) >
      nombreSorealIdle_(
        ancienne.bonusPuissance,
        0
      )
    ) {
      uniques[uniqueKey] =
        entree;
    }
  });

  const resultat =
    Object.keys(uniques)
      .map(function(cle) {
        return uniques[cle];
      });

  resultat.sort(
    function(a,b) {
      const zoneA =
        nombreSorealIdle_(
          a.zoneId,
          0
        );

      const zoneB =
        nombreSorealIdle_(
          b.zoneId,
          0
        );

      if (zoneA !== zoneB) {
        return zoneA - zoneB;
      }

      return String(
        a.nom || ''
      ).localeCompare(
        String(
          b.nom || ''
        )
      );
    }
  );

  return resultat;
}

function trouverDecouverteLootSorealIdle_(
  collectionListe,
  loot
) {
  const definitionId =
    String(
      loot && loot.id || ''
    );

  for (
    let i = 0;
    i < collectionListe.length;
    i += 1
  ) {
    const entree =
      collectionListe[i];

    if (
      definitionId &&
      String(
        entree.definitionId || ''
      ) === definitionId
    ) {
      return entree;
    }

    if (
      !entree.definitionId &&
      nombreSorealIdle_(
        entree.zoneId,
        0
      ) ===
      nombreSorealIdle_(
        loot.zoneId,
        0
      ) &&
      String(
        entree.slot || ''
      ) ===
      String(
        loot.slot || ''
      ) &&
      String(
        entree.nom || ''
      ) ===
      String(
        loot.nom || ''
      )
    ) {
      return entree;
    }
  }

  return null;
}

export function progressionCollectionsSorealIdle_(
  collection
) {
  const decouvertes =
    listeCollectionSorealIdle_(
      collection
    );

  const loots =
    lootsSorealIdle_()
      .filter(function(loot) {
        return loot.zoneId > 0;
      });

  const configs =
    collectionsSorealIdle_();

  let bonusTotal = 0;

  const zones =
    configs.map(function(config) {
      const objets =
        loots
          .filter(function(loot) {
            return (
              loot.zoneId ===
              config.zoneId
            );
          })
          .map(function(loot) {
            const trouve =
              trouverDecouverteLootSorealIdle_(
                decouvertes,
                loot
              );

            return {
              definitionId:
                loot.id,

              nom:
                loot.nom,

              slot:
                loot.slot,

              image:
                loot.image || '',

              decouvert:
                Boolean(
                  trouve
                ),

              objet:
                trouve || null
            };
          });

      const obtenus =
        objets.filter(
          function(objet) {
            return objet.decouvert;
          }
        ).length;

      const total =
        objets.length;

      const complete =
        total > 0 &&
        obtenus >= total;

      if (complete) {
        bonusTotal +=
          config.bonusPuissancePct;
      }

      return {
        id:
          config.id,

        zoneId:
          config.zoneId,

        nom:
          config.nom,

        obtenus:
          obtenus,

        total:
          total,

        complete:
          complete,

        bonusPuissancePct:
          config.bonusPuissancePct,

        description:
          config.description,

        objets:
          objets
      };
    });

  return {
    bonusPourcent:
      bonusTotal,

    zones:
      zones
  };
}

export function statsJoueurSorealIdle_(valeur) {
  const s=parserJsonSorealIdle_(valeur,{});

  const sortsAchetes =
    Array.isArray(s.sortsAchetes)
      ? s.sortsAchetes
          .map(function(id){
            return String(id || '').trim();
          })
          .filter(Boolean)
      : [];

  const cooldowns =
    s.cooldownsSorts &&
    typeof s.cooldownsSorts === 'object'
      ? s.cooldownsSorts
      : {};

  return {
    lootsObtenus:Math.max(0,Math.floor(nombreSorealIdle_(s.lootsObtenus,0))),
    objetsRecycles:Math.max(0,Math.floor(nombreSorealIdle_(s.objetsRecycles,0))),
    fusions:Math.max(0,Math.floor(nombreSorealIdle_(s.fusions,0))),
    /* Norman (2026-09-27) : catégorie « Clics/Tap » du classement -- compteur brut, jamais anti-triche (« même si quelqu'un triche, ca n'est pas grave »). */
    clicsTotal:Math.max(0,Math.floor(nombreSorealIdle_(s.clicsTotal,0))),
    /* Horodatage (ms) du dernier enregistrerClicsSorealIdle : sert à plafonner le delta de clics par seconde écoulée. */
    clicsDernierMs:Math.max(0,Math.floor(nombreSorealIdle_(s.clicsDernierMs,0))),
    /*
     * Temps de jeu ACTIF en secondes (Norman, 2026-09-30 : « dans Classement, les gens ne font que monter alors qu'ils ne jouent pas »).
     * Incrémenté par battementSorealIdle uniquement quand le joueur interagit réellement avec la page visible. Remplace, pour le
     * classement, records.playSeconds (temps écoulé du moteur, rattrapage hors-ligne compris).
     */
    tempsActifSec:Math.max(0,nombreSorealIdle_(s.tempsActifSec,0)),
    /*
     * Classement « Combat le plus long » (Norman, 2026-10-10) : durée du combat de boss en cours (secondes de combat simulées, remise à 0 à chaque lancement) et record du joueur,
     * enregistré quand le combat se termine par une victoire ou une défaite (une fuite ou un NUKE n'est pas un combat mené à son terme).
     */
    combatBossDureeSec:Math.max(0,nombreSorealIdle_(s.combatBossDureeSec,0)),
    /* Un record n'a de valeur que s'il porte son issue (victoire ou défaite) : les records antérieurs (sans issue) ne pouvaient pas être vérifiés (fuite puis reprise possibles) et repartent de zéro. */
    combatBossPlusLongGagne:s.combatBossPlusLongGagne===true?true:(s.combatBossPlusLongGagne===false?false:null),
    combatBossPlusLongSec:(s.combatBossPlusLongGagne===true||s.combatBossPlusLongGagne===false)?Math.max(0,nombreSorealIdle_(s.combatBossPlusLongSec,0)):0,
    /* Le combat en cours est parti d'un boss à PV pleins (un seul « Fight », sans reprise d'un boss déjà entamé). */
    combatBossDepartFrais:s.combatBossDepartFrais===true,
    /* Partie pas encore commencée (Norman, 2026-10-26) : posé à la création d'un joueur (première ouverture ou remise à zéro), retiré par demarrerPartieSorealIdle quand le joueur appuie sur le bouton blanc de l'intro. */
    partieAttente:s.partieAttente===true,
    forge:Math.max(0,Math.floor(nombreSorealIdle_(s.forge,0))),
    materiauxDepenses:Math.max(0,Math.floor(nombreSorealIdle_(s.materiauxDepenses,0))),
    extensionsSac:Math.max(0,Math.floor(nombreSorealIdle_(s.extensionsSac,0))),
    combatsAventure:Math.max(0,Math.floor(nombreSorealIdle_(s.combatsAventure,0))),
    victoiresAventure:Math.max(0,Math.floor(nombreSorealIdle_(s.victoiresAventure,0))),
    autoAventure:Boolean(s.autoAventure),
    autoAventureZone:Math.max(0,Math.floor(nombreSorealIdle_(s.autoAventureZone,0))),
    bossSelection:Math.max(0,Math.floor(nombreSorealIdle_(s.bossSelection,0))),
    combatBossActif:Boolean(s.combatBossActif),
    autoBossSuivant:s.autoBossSuivant!==false,
    /*
     * Compteurs du fil « En direct » (fuites, défaites contre un boss, cinématiques vues) : sans ces champs, la lecture des statistiques les jetait à chaque opération (liste blanche), donc une fuite ou une
     * défaite n'était jamais annoncée aux autres joueurs (Norman, 2026-10-09 : « quand on fuit, ça n'apparaît pas dans En direct »).
     */
    fluxBossFuites:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxBossFuites,0))),
    fluxBossDefaites:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxBossDefaites,0))),
    fluxBossDernier:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxBossDernier,0))),
    fluxHistoires:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxHistoires,0))),
    fluxNukes:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxNukes,0))),
    fluxNukeDernier:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxNukeDernier,0))),
    /*
     * Norman (2026-09-27) : « Je ne veux pas apparaitre dans le classement pour les autres. Uniquement moi. Et
     * avoir une case dans parametres pour pouvoir apparaitre ou disparaitre. » Visible par défaut.
     */
    classementVisible:s.classementVisible!==false,
    /*
     * 2026-09-24 (Norman : « quand on rebirth, on a encore les popups quand on va dans les menus ; ils ne doivent arriver qu'une fois,
     * pareil pour les textes d'accueil ») : identifiants des popups, tutoriels et textes d'accueil DÉJÀ montrés. Côté serveur (et non
     * seulement dans le navigateur) : ni une Renaissance, ni un autre appareil, ni un stockage local vidé ne les rejouent.
     */
    vus:Array.isArray(s.vus)
      ? Array.from(new Set(s.vus.map(function(id){return String(id||'').trim();}).filter(function(id){return id&&id.length<=80&&/^[A-Za-z0-9_:.-]+$/.test(id);}))).slice(0,500)
      : [],
    /* Ordre des boutons du menu choisi par le joueur (« Rangement des boutons ») : identifiants de menus, dans l'ordre voulu. */
    /* Remises à zéro uniques (Norman, 2026-10-04, version 2 puis 3 : Boutique rejoint le groupe final Boutique, Succès, Classement, Chat, Réglages, Admin) : les menus suivent désormais l'ordre dans lequel on les obtient, chez tout le monde. Un rangement enregistré avant la version 3 est oublié ; ensuite le rangement
       du joueur est conservé. menuOrdreVersion vaut 3 dès la première lecture, pour tous. */
    menuOrdreVersion:3,
    menuOrdre:Array.isArray(s.menuOrdre)&&Math.floor(nombreSorealIdle_(s.menuOrdreVersion,0))>=3
      ? Array.from(new Set(s.menuOrdre.map(function(id){return String(id||'').trim();}).filter(function(id){return id&&id.length<=40&&/^[A-Za-z0-9_-]+$/.test(id);}))).slice(0,80)
      : [],
    reposNumero:Math.max(1,Math.floor(nombreSorealIdle_(s.reposNumero,1))),

    energieTickResteMs:
      Math.max(
        0,
        nombreSorealIdle_(
          s.energieTickResteMs,
          0
        )
      ),

    bossRespawnJusqua:
      Math.max(
        0,
        nombreSorealIdle_(
          s.bossRespawnJusqua,
          0
        )
      ),

    aventureCooldownReductionPct:
      Math.max(
        0,
        Math.min(
          90,
          nombreSorealIdle_(
            s.aventureCooldownReductionPct,
            0
          )
        )
      ),

    mana:
      nombreSorealIdle_(s.mana,-1),
    manaMajMs:
      Math.max(0,nombreSorealIdle_(s.manaMajMs,0)),
    sortsAchetes:
      sortsAchetes,
    cooldownsSorts:
      cooldowns,

    buffBouclierJusqua:
      Math.max(0,nombreSorealIdle_(s.buffBouclierJusqua,0)),
    buffBouclierPct:
      Math.max(0,nombreSorealIdle_(s.buffBouclierPct,0)),
    immuniteParalysieJusqua:
      Math.max(0,nombreSorealIdle_(s.immuniteParalysieJusqua,0)),
    bossStunJusqua:
      Math.max(0,nombreSorealIdle_(s.bossStunJusqua,0)),
    bossVulnerableJusqua:
      Math.max(0,nombreSorealIdle_(s.bossVulnerableJusqua,0)),
    bossVulnerablePct:
      Math.max(0,nombreSorealIdle_(s.bossVulnerablePct,0)),
    sceauBriseBossNumero:
      Math.max(0,Math.floor(nombreSorealIdle_(s.sceauBriseBossNumero,0))),

    bestiaireRencontres:
      s.bestiaireRencontres &&
      typeof s.bestiaireRencontres === 'object' &&
      !Array.isArray(s.bestiaireRencontres)
        ? s.bestiaireRencontres
        : {},

    bestiaireBossRunVersionV207:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            s.bestiaireBossRunVersionV207,
            0
          )
        )
      ),

    bestiaireBossRunMaxNumeroV207:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            s.bestiaireBossRunMaxNumeroV207,
            0
          )
        )
      ),

    modeleJeuVersion:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            s.modeleJeuVersion,
            0
          )
        )
      ),

    entrainementBase:
      s.entrainementBase &&
      typeof s.entrainementBase === 'object' &&
      !Array.isArray(s.entrainementBase)
        ? s.entrainementBase
        : null,

    /*
     * Correctif 2026-09-18 (EXP Shop, repro en production) : ce parseur
     * reconstruit un objet whitelisté à chaque lecture de STATS_JSON.
     * legacyXpMigratedV54 était écrit après la migration XP mais n'était
     * jamais recopié ici ; il redevenait donc undefined au prochain appel.
     * appliquerProgressionEnergieSorealIdle_ réimportait alors la vieille
     * colonne XP via Math.max(metaNgu EXP, row XP), remboursant de fait
     * l'achat précédent. Ce marqueur fait partie de l'état persistant.
     */
    legacyXpMigratedV54:
      Boolean(s.legacyXpMigratedV54),

    metaNgu:
      s.metaNgu &&
      typeof s.metaNgu === 'object' &&
      !Array.isArray(s.metaNgu)
        ? s.metaNgu
        : null,

    aventureDerniereRequestId:
      String(
        s.aventureDerniereRequestId || ''
      ),

    aventureDernierResultat:
      s.aventureDernierResultat &&
      typeof s.aventureDernierResultat === 'object'
        ? s.aventureDernierResultat
        : null
  };
}

function cleBestiaireBossPrincipalSorealIdle_(
  numero
) {
  return (
    'boss:' +
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          numero,
          1
        )
      )
    )
  );
}

export function cleBestiaireMonstreSorealIdle_(
  monstre
) {
  return (
    'aventure:' +
    String(
      monstre &&
      monstre.id || ''
    ).trim()
  );
}

export function marquerRencontreBestiaireSorealIdle_(
  stats,
  cle
) {
  const key =
    String(
      cle || ''
    ).trim();

  if (
    !stats ||
    !key
  ) {
    return false;
  }

  if (
    !stats.bestiaireRencontres ||
    typeof stats.bestiaireRencontres !==
      'object' ||
    Array.isArray(
      stats.bestiaireRencontres
    )
  ) {
    stats.bestiaireRencontres = {};
  }

  const precedent =
    stats.bestiaireRencontres[
      key
    ];

  const existait =
    Boolean(
      precedent &&
      typeof precedent === 'object' &&
      nombreSorealIdle_(
        precedent.rencontres,
        0
      ) > 0
    );

  const maintenant =
    Date.now();

  stats.bestiaireRencontres[
    key
  ] = {
    rencontres:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            precedent &&
            precedent.rencontres,
            0
          )
        )
      ) + 1,

    premiereRencontre:
      existait
        ? Math.max(
            0,
            nombreSorealIdle_(
              precedent.premiereRencontre,
              maintenant
            )
          )
        : maintenant,

    derniereRencontre:
      maintenant
  };

  return !existait;
}

export function marquerRencontreBossPrincipalUneFoisParRunV207_(
  stats,
  numero,
  bossVaincusCourant
) {
  if (!stats) return false;

  /*
   * Avant V207, chaque clic Fight incrémentait "rencontres". Un boss
   * difficile pouvait donc afficher 7 rencontres simplement parce que le
   * joueur avait perdu/repris 7 fois, alors que les premiers boss du run
   * n'étaient comptés qu'une fois. Une rencontre de Boss principal est
   * désormais comptée UNE fois par run et par boss, pas une fois par
   * tentative de combat.
   *
   * Migration douce : au premier appel sur une ancienne sauvegarde, les
   * boss déjà vaincus dans le run courant sont considérés comme déjà
   * rencontrés ; on ne les recompte pas artificiellement.
   */
  if (stats.bestiaireBossRunVersionV207 !== 207) {
    stats.bestiaireBossRunVersionV207 = 207;
    stats.bestiaireBossRunMaxNumeroV207 =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            bossVaincusCourant,
            0
          )
        )
      );
  }

  const n =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          numero,
          1
        )
      )
    );

  if (
    n <=
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          stats.bestiaireBossRunMaxNumeroV207,
          0
        )
      )
    )
  ) {
    return false;
  }

  const nouveau =
    marquerRencontreBestiaireSorealIdle_(
      stats,
      cleBestiaireBossPrincipalSorealIdle_(n)
    );

  stats.bestiaireBossRunMaxNumeroV207 = n;

  return nouveau;
}

export function construireBestiaireSorealIdle_(
  row,
  highestBossEver
) {
  const c =
    CONFIG_SOREAL_IDLE
      .COLONNES_JOUEURS;

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

  const requis = 0;

  const stats =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const rencontres =
    stats.bestiaireRencontres ||
    {};

  /*
   * Norman (2026-09-11) : le mode Aventure (dont le Bestiaire fait partie —
   * "The adventure mode screen also enables access to the Bestiary", wiki NGU)
   * doit se reverrouiller après un Rebirth jusqu'à re-vaincre le boss requis
   * CE run, comme le jeu réel (voir le commentaire équivalent dans
   * construireAventureSorealIdle_). Seule la DÉCOUVERTE d'un boss (a-t-on
   * déjà croisé/vaincu ce boss un jour, pour la Collection) reste permanente
   * — c'est la seule chose pour laquelle le high-water-mark historique
   * (highestBossEver) doit encore compter ici.
   */
  const bossVaincusActuel =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[
            c.BOSS_VAINCUS - 1
          ],
          0
        )
      )
    );

  const bossVaincus =
    Math.max(
      bossVaincusActuel,
      Math.floor(
        nombreSorealIdle_(
          highestBossEver,
          0
        )
      )
    );

  const entrees = [];

  const catalogueBossBestiaireV207 =
    bossCatalogueSorealIdle_();

  /*
   * Réparation d'affichage des anciens compteurs pré-V207.
   * Les boss sont obligatoirement rencontrés dans l'ordre : si le boss N
   * possède X rencontres uniques de run, aucun boss antérieur ne peut en
   * avoir moins. Les anciennes tentatives répétées ont malheureusement
   * détruit cette information exacte ; on applique donc le minimum
   * historiquement cohérent (suffix max), sans inventer de rencontres
   * supplémentaires pour les boss plus récents.
   */
  const rencontresBossAffichageV207 =
    catalogueBossBestiaireV207.map(function(_boss,index){
      const trace =
        rencontres[
          cleBestiaireBossPrincipalSorealIdle_(index + 1)
        ];
      return Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            trace && trace.rencontres,
            0
          )
        )
      );
    });

  for (
    let i = rencontresBossAffichageV207.length - 2;
    i >= 0;
    i -= 1
  ) {
    rencontresBossAffichageV207[i] =
      Math.max(
        rencontresBossAffichageV207[i],
        rencontresBossAffichageV207[i + 1]
      );
  }

  catalogueBossBestiaireV207
    .forEach(function(boss,index) {
      const cle =
        cleBestiaireBossPrincipalSorealIdle_(
          index + 1
        );

      /*
       * Compatibilité avec les sauvegardes précédant le Bestiaire :
       * un boss déjà vaincu a forcément déjà été rencontré.
       */
      const legacy =
        index < bossVaincus;

      /* 2026-09-23 : la Collection affichait les colonnes brutes du catalogue historique (PV/Attaque inventés) ;
         elle lit maintenant la définition réellement utilisée au combat (référence wiki : Attaque, Défense, PV, EXP). */
      const definitionCollection = definitionBossSorealIdle_(index, 'normal');

      const trace =
        rencontres[cle] &&
        typeof rencontres[cle] ===
          'object'
          ? rencontres[cle]
          : null;

      const decouvert =
        Boolean(
          legacy ||
          (
            trace &&
            nombreSorealIdle_(
              trace.rencontres,
              0
            ) > 0
          )
        );

      entrees.push({
        cle:
          cle,
        source:
          'boss',
        type:
          'boss_principal',
        categorie:
          'Boss',
        rare:
          false,
        decouvert:
          decouvert,
        rencontres:
          decouvert
            ? Math.max(
                legacy ? 1 : 0,
                rencontresBossAffichageV207[index]
              )
            : 0,
        numero:
          index + 1,
        zoneId:
          0,
        nom:
          decouvert
            ? String(
                definitionCollection.nom || boss.nom || 'Boss'
              )
            : '???????',
        emoji:
          decouvert
            ? '👹'
            : '❔',
        pv:
          decouvert
            ? Math.max(1, nombreSorealIdle_(definitionCollection.pv, 1))
            : 0,
        attaque:
          decouvert
            ? Math.max(0, nombreSorealIdle_(definitionCollection.attaque, 0))
            : 0,
        defense:
          decouvert
            ? Math.max(0, nombreSorealIdle_(definitionCollection.defense, 0))
            : 0,
        xp:
          decouvert
            ? Math.max(0, nombreSorealIdle_(definitionCollection.xp, 0))
            : 0,
        description:
          decouvert
            ? histoireBossAvecSurchargeSorealIdle_(
                index + 1,
                boss.histoire
              )
            : '',
        /* Ce que la voix DIT (menu Admin) : jamais plus que ce que le joueur a déjà découvert. */
        histoireParlee: decouvert ? histoireBossParleeSorealIdle_(index + 1) : '',
        nomParle: decouvert ? nomBossParleSorealIdle_(index + 1) : '',
        driveFileId:
          decouvert
            ? String(
                boss.driveFileId || ''
              )
            : '',
        image:
          decouvert
            ? String(
                boss.image || ''
              )
            : ''
      });
    });

  /*
   * Audit 2026-09-13 (Norman) : "Les mobs du mode aventure se trouvent
   * tous dans mon R2 : soreal/idle/aventure/. Reconstruit tout en interne
   * pour que ça match. Mais les zones dans le jeu devront garder leurs
   * noms." Cause racine confirmée : monstresAventureSorealIdleGameV409_()
   * (catalogue légataire table IDLE_ZONES, zoneId NUMÉRIQUES) est un
   * système historique totalement disjoint des vraies zones V47
   * (IDLE_ADVENTURE_ZONES, id en chaîne tutorial/sewers/forest/...) —
   * marquerRencontreBestiaireSorealIdle_ n'est d'ailleurs jamais appelée
   * par le vrai chemin de combat actuel (rollKill/startZoneFight, V47),
   * seulement par un "combat auto" légataire injoignable depuis l'UI
   * actuelle. Le Bestiaire Aventure ne pouvait donc RIEN découvrir, pas
   * seulement afficher une mauvaise image.
   *
   * Reconstruit pour lire directement le VRAI état V47 du joueur
   * (s.zone.kills/bossKills, la seule source de vérité du combat
   * Aventure réel) et les VRAIS noms de zone déjà affichés au joueur
   * (IDLE_ADVENTURE_ZONES.name, ex. "Biobox maudites") — jamais un nom
   * générique ni une traduction wiki. Deux entrées par zone (mob normal +
   * gardien de zone), sur le modèle déjà utilisé pour Boss/Collection
   * (case verrouillée "???????" tant que non rencontré). L'image se
   * résout désormais côté client via /api/idle/media/mob (R2, déjà
   * fonctionnel pour les 11 zones actuellement implémentées), jamais un
   * champ image stocké ici.
   */
  const adventureStateBestiaireV1 =
    normalizeIdleAdventureStateV47(
      stats && stats.metaNgu && stats.metaNgu.adventure
    );
  /*
   * Norman (2026-09-15) : "tous les ennemis rencontrés en aventure
   * n'apparaissent pas dans collection... j'ai rencontré au moins 1 boss
   * et 2 mobs" alors que Collection n'en montrait que 2. Cause : cette
   * grille utilisait zone.kills/bossKills (incrémenté SEULEMENT en cas de
   * victoire, voir rollKill dans idle-adventure-v47.js) pour décider
   * "découvert", malgré le libellé "👁️ rencontre(s)" affiché à l'écran.
   * Un combat perdu ou fui n'était donc jamais compté. Utilise désormais
   * zone.encounters/bossEncounters (incrémenté dans startZoneFight, dès
   * la vraie rencontre, indépendamment de l'issue du combat) — kills/
   * bossKills gardent leur rôle inchangé ailleurs (tirage du boss).
   */
  const zoneEncountersBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.encounters) ||
    {};
  const zoneBossEncountersBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.bossEncounters) ||
    {};
  /*
   * Norman (2026-09-16) : "j'ai plusieurs images qui sont utilisée pour
   * le même mob [...] Chacune des image doit être reliée à un ennemi. Le
   * compte est bon normalement pour les premières zones." Root cause :
   * une seule entrée Collection par zone/boss-ou-normal, quel que soit
   * le nombre réel d'images R2 (3 à 8). Utilise désormais le suivi PAR
   * INDEX (mobEncountersByIndex/bossEncountersByIndex, startZoneFight)
   * pour émettre UNE entrée Collection par image du catalogue partagé
   * avec worker.js (SOREAL-APP) — jamais un second calcul du nom des
   * images, la seule source de vérité reste IDLE_ADVENTURE_MOB_CATALOG_V1.
   */
  const zoneMobIndexBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.mobEncountersByIndex) ||
    {};
  const zoneBossIndexBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.bossEncountersByIndex) ||
    {};
  /*
   * Norman (2026-09-17) : "je veux que ce soit ALL the boss names, ALL
   * the mob names [...] les MEMES noms [que le vrai NGU] [...] tout ce
   * qui est Soreal disparait." Jusqu'ici, Collection affichait un nom
   * dérivé du fichier image R2 (ex. "pallet_goblin" -> "Pallet Goblin"),
   * un habillage SOREAL sans rapport avec le vrai nom NGU. Utilise
   * maintenant le vrai nom wiki depuis IDLE_ADVENTURE_MOB_BESTIARY_V1
   * quand une entrée existe pour CE zone/rôle/index précis (même lookup
   * que le combat réel, cf. idleAdventureMobBestiaryEntryV1 dans
   * idle-adventure-v47.js) -- jamais un second nom inventé. Ne retombe
   * sur l'ancien nom dérivé de l'image QUE pour les mobs sans entrée
   * bestiaire réelle (zones/rôles pas encore sourcés), jamais un
   * remplacement partiel silencieux.
   */
  function nomReelOuAffichageMobSorealIdleV1_(zoneId, estBoss, index) {
    const entreeBestiaire = idleAdventureMobBestiaryEntryV1(
      { id: zoneId },
      estBoss,
      index
    );
    if (entreeBestiaire && entreeBestiaire.name) {
      return String(entreeBestiaire.name);
    }
    return 'Créature NGU non documentée';
  }

  IDLE_ADVENTURE_ZONES
    .filter(function(zone) {
      return zone.id !== 'safe';
    })
    .forEach(function(zone) {
      const catalogueZone =
        IDLE_ADVENTURE_MOB_CATALOG_V1[zone.id] ||
        { normal: [], boss: [] };

      [false, true].forEach(function(estBoss) {
        const poolImages = estBoss ? catalogueZone.boss : catalogueZone.normal;
        /* 2026-09-23 : une entrée par ennemi du bestiaire wiki (stats réelles), l'image se résout par indice. */
        const bestiaireZoneCollection = IDLE_ADVENTURE_MOB_BESTIARY_V1[zone.id];
        const poolBestiaire = bestiaireZoneCollection
          ? (estBoss ? bestiaireZoneCollection.boss : bestiaireZoneCollection.normal) || []
          : [];
        const pool = poolBestiaire.length ? poolBestiaire : poolImages;

        /*
         * Repli (zones sans catalogue d'images pour l'instant, ex.
         * beardverse/badly/boring/chocolate — aucun dossier R2 dédié
         * encore) : garder l'ancien comportement (une seule entrée
         * générique par zone/rôle), jamais perdre une découverte déjà
         * comptée par le joueur faute d'art disponible.
         */
        if (!pool.length) {
          const rencontresCompteur =
            Math.max(
              0,
              Math.floor(
                nombreSorealIdle_(
                  estBoss
                    ? zoneBossEncountersBestiaireV1[zone.id]
                    : zoneEncountersBestiaireV1[zone.id],
                  0
                )
              )
            );
          const decouvert = rencontresCompteur > 0;

          entrees.push({
            cle: 'aventure:' + zone.id + (estBoss ? ':boss' : ':mob'),
            source: 'aventure',
            type: estBoss ? 'boss_zone' : 'normal',
            categorie: estBoss ? 'Gardien de zone' : 'Créature',
            rare: false,
            decouvert: decouvert,
            rencontres: rencontresCompteur,
            numero: 0,
            zone: zone.id,
            boss: estBoss ? 1 : 0,
            index: 0,
            zoneId: 0,
            nom: decouvert ? zone.name : '???????',
            emoji: decouvert ? (estBoss ? '👑' : '👾') : '❔',
            pv: 0,
            attaque: 0,
            description: '',
            driveFileId: '',
            image: ''
          });
          return;
        }

        const indexStore = estBoss ? zoneBossIndexBestiaireV1 : zoneMobIndexBestiaireV1;
        const indexCounters = indexStore[zone.id] || {};

        pool.forEach(function(_baseNom, index) {
          const rencontresCompteur =
            Math.max(
              0,
              Math.floor(
                nombreSorealIdle_(indexCounters[index], 0)
              )
            );
          const decouvert = rencontresCompteur > 0;
          const fichePropre = idleAdventureMobBestiaryEntryV1({ id: zone.id }, estBoss, index) || {};

          entrees.push({
            cle: 'aventure:' + zone.id + (estBoss ? ':boss:' : ':mob:') + index,
            source: 'aventure',
            type: estBoss ? 'boss_zone' : 'normal',
            categorie: estBoss ? 'Gardien de zone' : 'Créature',
            rare: false,
            decouvert: decouvert,
            rencontres: rencontresCompteur,
            numero: 0,
            zone: zone.id,
            boss: estBoss ? 1 : 0,
            index: index,
            zoneId: 0,
            nom: decouvert ? nomReelOuAffichageMobSorealIdleV1_(zone.id, estBoss, index) : '???????',
            emoji: decouvert ? (estBoss ? '👑' : '👾') : '❔',
            pv: decouvert ? nombreSorealIdle_(fichePropre.maxHp, 0) : 0,
            attaque: decouvert ? nombreSorealIdle_(fichePropre.power, 0) : 0,
            defense: decouvert ? nombreSorealIdle_(fichePropre.toughness, 0) : 0,
            regen: decouvert ? nombreSorealIdle_(fichePropre.hpRegen, 0) : 0,
            cadence: decouvert ? nombreSorealIdle_(fichePropre.attackRate, 0) : 0,
            typeMob: decouvert ? String(fichePropre.type || '') : '',
            description: '',
            driveFileId: '',
            image: ''
          });
        });
      });
    });

  return {
    debloquee:
      bossVaincusActuel >= 4,
    niveauRequis:
      requis,
    decouvertes:
      entrees.filter(
        function(entree) {
          return entree.decouvert;
        }
      ).length,
    /*
     * ANTI-SPOIL (Norman, 2026-09-24 : « il ne doivent pas voir qu'il y a 301 boss… il ne faut pas montrer toutes les cases
     * disponibles ») : seules les entrées DÉJÀ DÉCOUVERTES quittent le serveur ; le nombre total de boss et de créatures ne se déduit
     * plus de la taille de la liste.
     */
    entrees:
      entrees.filter(
        function(entree) {
          return entree.decouvert;
        }
      )
  };
}

export function genererObjetLegendaireRareAventureSorealIdle_(
  monstre,
  zone,
  niveauJoueur
) {
  // Audit 2026-09-16 : même décision que genererObjetLootSorealIdle_
  // ci-dessus -- plus de loot pour le combat de boss numéroté historique.
  void monstre;
  void zone;
  void niveauJoueur;
  return null;
}
