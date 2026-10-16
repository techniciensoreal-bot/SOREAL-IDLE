/*
 * Configuration, déblocages et seuils de puissance du jeu (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { deblocagesSorealIdle_, parametreSorealIdle_ } from "./idle-runtime-catalogue.js";
import { detailsEquipementSorealIdle_, slotsEquipementSorealIdle_ } from "./idle-runtime-collection.js";
import { definitionBossSorealIdle_, degatsRecusSecondeSorealIdle_, multiplicateurDpsJoueurBossSorealIdle_, multiplicateurSceauBossSorealIdle_, regenBossSecondeSorealIdle_ } from "./idle-runtime-boss.js";

export const CONFIG_SOREAL_IDLE = {
  VERSION: 'V45-NGU-PARITY',

  ID_SPREADSHEET:
    '19NkoPRWj6UHruOKKuyqwnH9l8tQCuJO_ZcvbXscar0E',

  FEUILLE_JOUEURS: 'JOUEURS',
  FEUILLE_CONFIG: 'CONFIG',
  FEUILLE_CLASSEMENT: 'CLASSEMENT',

  /*
   * SOREAL IDLE reste strictement privé.
   * Norman possède deux adresses historiques de connexion ; elles désignent
   * la même personne.
   */
  /*
   * 2026-09-25 (Norman) : « enlève l'accès spécial à Sébastien ; il doit avoir l'accès de la même manière que les autres, avec le bouton
   * activé ». Seuls les deux comptes de Norman gardent un accès permanent ; tous les autres comptes connectés (APP / TV) passent par
   * l'interrupteur « accès ouvert » des Paramètres (voir accesOuvertSorealIdle_).
   *
   * 2026-09-27 (Norman) : « Sébastien n'a plus l'accès au jeu... Lui a l'accès d'office » — revirement explicite sur la décision du
   * 2026-09-25 ci-dessus : Sébastien redevient un compte à accès permanent, qui ne dépend plus du trophée « Assiduité de bronze » ni de
   * l'interrupteur « accès ouvert ». Ses trois adresses connues (voir planning-trophy-alarm-entry-v1.js côté SOREAL-TV, où elles sont
   * déjà mises en alias entre elles pour la recherche du trophée) sont toutes listées ici pour couvrir chaque façon dont sa session peut
   * se présenter.
   */
  EMAILS_DEVELOPPEMENT: [
    'reeeedruuuum@gmail.com',
    'technicien.soreal@gmail.com',
    'hodappsebastien@gmail.com',
    'distribution.soreal@gmail.com',
    'distribution.soreal@rsumb.be'
  ],

  COLONNES_JOUEURS: {
    ID: 1,
    NOM: 2,
    NIVEAU: 3,
    XP: 4,
    ENERGIE: 5,
    ENERGIE_MAX: 6,
    PROD_SECONDE: 7,
    FORCE: 8,
    ENDURANCE: 9,
    ORGANISATION: 10,
    PUISSANCE: 11,
    BOSS_ACTUEL: 12,
    BOSS_PV: 13,
    BOSS_PV_MAX: 14,
    BOSS_VAINCUS: 15,
    DERNIERE_SYNCHRO: 16,
    PUBLIC: 17,
    RANG: 18,
    EMAIL_PRINCIPAL: 19,
    EMAIL_CONNEXION: 20,
    PIECES: 21,
    INVENTAIRE_JSON: 22,
    EQUIPEMENT_JSON: 23,
    AMELIORATIONS_JSON: 24,
    RENAISSANCES: 25,
    ESSENCE_RENAISSANCE: 26,
    PV_JOUEUR: 27,
    PV_JOUEUR_MAX: 28,
    KO_JUSQUA: 29,
    AVENTURE_ZONE: 30,
    AVENTURE_PROGRESSION_JSON: 31,
    AVENTURE_POINTS: 32,
    AVENTURE_DERNIERE_ACTION: 33,
    MATERIAUX: 34,
    COLLECTION_JSON: 35,
    DATE_DEBUT: 36,
    INVENTAIRE_CAPACITE: 37,
    STATS_JSON: 38
  },

  /*
   * ENERGIE_BASE est aussi réutilisé par renaitreSorealIdle() (Rebirth) —
   * Norman n'a signalé que la valeur de départ d'une NOUVELLE PARTIE
   * ("quand on commence une nouvelle partie, le compte d'énergie est à
   * 250"), jamais celle après une Renaissance (comportement actuel :
   * pleine à 500, jamais remis en cause) — ne jamais changer cette
   * constante partagée sans vérifier les DEUX appelants d'abord.
   */
  ENERGIE_BASE: 500,
  ENERGIE_MAX_BASE: 500,
  PROD_SECONDE_BASE: 1,
  /*
   * Norman (2026-09-14, capture d'écran du vrai NGU Idle à l'appui) :
   * "avec 1 milliard à générer, avec 1 tic par seconde, ça n'ira pas."
   * Vérifié sur le wiki NGU (formule confirmée par sa capture : Energy
   * Speed 3,4 → arrondi supérieur(50/3,4)=15 tics, exactement "remplit
   * tous les 15 tics" affiché en jeu) : le moteur réel tourne à 50
   * tics/seconde fixes, donc l'intervalle le plus rapide possible est
   * 1000/50 = 20ms (Energy Speed au maximum, 50). Le plancher ici
   * était 90ms — jusqu'à 4,5× plus lent que le vrai jeu ne le permet
   * en fin de partie, quelle que soit la production.
   */
  ENERGIE_TICK_MIN_MS: 20,
  NIVEAU_BASE: 1,
  FORCE_BASE: 1,
  ENDURANCE_BASE: 1,
  ORGANISATION_BASE: 1,
  /*
   * 2026-09-17 (Norman, "copie absolument tout dans le jeu [...] les
   * MEMES noms [que NGU] [...] tout ce qui est Soreal disparait") : ce
   * repli n'est utilisé QUE quand le catalogue IDLE_BOSS est vide
   * (definitionBossSorealIdle_) -- vrai premier boss NGU (bf_number=1,
   * sourcé du miroir wiki local, design/ngu-wiki-enemies-v1.json), plus
   * l'ancien nom SOREAL inventé "La Palette Infernale".
   */
  BOSS_BASE: 'A Small Piece of Fluff',
  BOSS_PV_BASE: 800,
  /*
   * 2026-09-24 (audit « code -> wiki », voir docs/AUDIT-CHIFFRES.md) : supprimées, jamais lues nulle part et sans source wiki (reste
   * de l'ancienne version de SOREAL IDLE) : MULTIPLICATEUR_PV_BOSS 1,5 ; NIVEAU_RENAISSANCE 8 ; DEFENSE_ARMURE_COEFFICIENT 0,35 ;
   * PV_ARMURE_COEFFICIENT 5 ; MULTIPLICATEUR_ATTAQUE_BOSS 1,32 ; tout le bloc AVENTURE (niveau de déblocage 2, 5 ennemis par zone,
   * coût d'entrée 30 x 1,35, PV ennemi x1,55, attaque ennemie x1,34, récompenses de base 2 et 4).
   */
  PV_JOUEUR_BASE: 100,
  PV_PAR_ENDURANCE: 20,
  DEFENSE_PAR_ENDURANCE: 0.5,
  DEGATS_BOSS_MIN_PCT: 0.12,
  ATTAQUE_BOSS_BASE: 2,
  /*
   * Fight Boss : aucune durée de K.O. NGU.
   * KO_JUSQUA reste une colonne historique uniquement, toujours vidée.
   */
  INVENTAIRE_CAPACITE_BASE: 18,
  INVENTAIRE_CAPACITE_MAX: 90,

  /*
   * Norman (2026-09-27, correctif docs/HORS-LIGNE.md point 3) : ce plafond était à 12 h, un chiffre inventé sans
   * source wiki (le wiki NGU ne publie aucune durée maximale de rattrapage hors ligne, ni pour Basic Training ni
   * pour aucun autre système), et incohérent avec tous les autres systèmes de SOREAL déjà plafonnés à 30 jours
   * (EARLY_GAME_MAX_OFFLINE_SECONDS, idle-ngu-progression.js). Aligné sur cette même valeur : Basic Training
   * n'est pas un cas particulier, il rattrape autant de temps que le reste du jeu.
   */
  PROGRESSION_HORS_LIGNE_MAX_SECONDES:
    30 * 24 * 60 * 60
};

export function normaliserEmailSorealIdle_(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function nombreSorealIdle_(valeur, defaut) {
  let source=valeur;

  /*
   * La migration Sheets peut conserver le rendu français ("2,34",
   * "14 000", espaces insécables). Le moteur SQLite doit interpréter
   * exactement les mêmes nombres que l'ancien Apps Script.
   */
  if(typeof source==="string"){
    source=source
      .trim()
      .replace(/[\u00A0\u202F\s]/g,"")
      .replace(",",".");
  }

  const n=Number(source);

  return Number.isFinite(n)
    ?n
    :Number(defaut||0);
}

export function dateSorealIdle_(valeur, defautMs) {
  if(valeur instanceof Date){
    const ms=valeur.getTime();
    return Number.isFinite(ms)?ms:Number(defautMs||Date.now());
  }

  if(typeof valeur==="number"&&Number.isFinite(valeur)){
    /*
     * Google Sheets sérialise parfois une date comme nombre de jours
     * depuis 1899-12-30.
     */
    if(valeur>20000&&valeur<100000){
      return Date.UTC(1899,11,30)+valeur*86400000;
    }
    return valeur;
  }

  const texte=String(valeur||"").trim();
  if(!texte)return Number(defautMs||Date.now());

  const fr=texte.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if(fr){
    const ms=Date.UTC(
      Number(fr[3]),
      Number(fr[2])-1,
      Number(fr[1]),
      Number(fr[4]||0),
      Number(fr[5]||0),
      Number(fr[6]||0)
    );
    if(Number.isFinite(ms))return ms;
  }

  const ms=new Date(texte).getTime();
  return Number.isFinite(ms)
    ?ms
    :Number(defautMs||Date.now());
}

export function bornerSorealIdle_(valeur, min, max) {
  return Math.max(
    Number(min || 0),
    Math.min(
      Number(max || 0),
      Number(valeur || 0)
    )
  );
}

export function inventaireCapaciteMaxSorealIdle_() {
  return Math.max(
    CONFIG_SOREAL_IDLE
      .INVENTAIRE_CAPACITE_BASE,
    Math.floor(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'INVENTAIRE_CAPACITE_MAX',
          CONFIG_SOREAL_IDLE
            .INVENTAIRE_CAPACITE_MAX
        ),
        CONFIG_SOREAL_IDLE
          .INVENTAIRE_CAPACITE_MAX
      )
    )
  );
}

export function bossParMondeSorealIdle_() {
  return Math.max(
    1,
    Math.floor(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'BOSS_PAR_MONDE',
          20
        ),
        20
      )
    )
  );
}

function entreeDeblocageSorealIdleV405_(
  id
) {
  const cle =
    String(
      id || ''
    )
      .trim()
      .toLowerCase();

  if (!cle) {
    return null;
  }

  const source =
    deblocagesSorealIdle_();

  /*
   * Compatibilité V40.5 :
   * - ancien Data : tableau d'entrées ;
   * - Data actuel : objet indexé par id.
   *
   * Le Game ne dépend donc plus jamais de
   * deblocagesSorealIdle_().find(...).
   */
  if (Array.isArray(source)) {
    for (
      let i = 0;
      i < source.length;
      i += 1
    ) {
      const entree =
        source[i];

      if (
        String(
          entree &&
          (
            entree.id ||
            entree.ID
          ) ||
          ''
        )
          .trim()
          .toLowerCase() === cle
      ) {
        return entree;
      }
    }

    return null;
  }

  if (
    source &&
    typeof source === 'object'
  ) {
    if (source[cle]) {
      return source[cle];
    }

    /*
     * Tolère aussi un objet dont les clés n'auraient pas
     * exactement la même casse.
     */
    const cles =
      Object.keys(source);

    for (
      let i = 0;
      i < cles.length;
      i += 1
    ) {
      const k =
        cles[i];

      if (
        String(k)
          .trim()
          .toLowerCase() === cle
      ) {
        return source[k];
      }
    }
  }

  return null;
}

export function niveauDeblocageFonctionSorealIdle_(
  id,
  defaut
) {
  if (
    String(
      id || ''
    ) === 'aventure'
  ) {
    return 1;
  }

  const entree =
    entreeDeblocageSorealIdleV405_(
      id
    );

  return Math.max(
    1,
    Math.floor(
      nombreSorealIdle_(
        entree &&
        (
          entree.niveau ??
          entree.Niveau
        ),
        defaut
      )
    )
  );
}

export function deblocagesEtatSorealIdleV405_() {
  const source =
    deblocagesSorealIdle_();

  if (
    source &&
    !Array.isArray(source) &&
    typeof source === 'object'
  ) {
    const resultat = {};

    Object.keys(source)
      .forEach(function(cle) {
        const entree =
          source[cle];

        /*
         * Ignore les propriétés techniques éventuelles
         * (par exemple une méthode find() de compatibilité).
         */
        if (
          !entree ||
          typeof entree !== 'object'
        ) {
          return;
        }

        resultat[
          String(cle)
        ] = {
          id:
            String(
              entree.id ||
              entree.ID ||
              cle
            ),

          niveau:
            Math.max(
              1,
              Math.floor(
                nombreSorealIdle_(
                  entree.niveau ??
                  entree.Niveau,
                  1
                )
              )
            ),

          nom:
            String(
              entree.nom ||
              entree.Nom ||
              cle
            )
        };
      });

    return resultat;
  }

  const resultat = {};

  if (Array.isArray(source)) {
    source.forEach(function(entree) {
      if (!entree) {
        return;
      }

      const id =
        String(
          entree.id ||
          entree.ID ||
          ''
        )
          .trim();

      if (!id) {
        return;
      }

      resultat[id] = {
        id: id,

        niveau:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                entree.niveau ??
                entree.Niveau,
                1
              )
            )
          ),

        nom:
          String(
            entree.nom ||
            entree.Nom ||
            id
          )
      };
    });
  }

  return resultat;
}

export function dureeMaxCombatAventureSorealIdle_(
  boss
) {
  return Math.max(
    3,
    nombreSorealIdle_(
      parametreSorealIdle_(
        boss
          ? 'AVENTURE_DUREE_MAX_BOSS_SECONDES'
          : 'AVENTURE_DUREE_MAX_ENNEMI_SECONDES',
        boss
          ? 30
          : 20
      ),
      boss
        ? 30
        : 20
    )
  );
}

export function degatsRecusAventureSecondeSorealIdle_(
  attaque,
  defense
) {
  return Math.max(
    1,
    nombreSorealIdle_(
      attaque,
      1
    ) -
    Math.max(
      0,
      nombreSorealIdle_(
        defense,
        0
      )
    )
  );
}

function profilStuffAventureSorealIdle_(
  inventaire,
  equipement,
  zoneId
) {
  const cible =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  const details =
    detailsEquipementSorealIdle_(
      inventaire,
      equipement
    );

  let equipees = 0;
  let zoneOuMieux = 0;
  let zoneSuperieure = 0;

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

      equipees += 1;

      const zoneObjet =
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              objet.zoneId,
              0
            )
          )
        );

      if (zoneObjet >= cible) {
        zoneOuMieux += 1;
      }

      if (zoneObjet >= cible + 1) {
        zoneSuperieure += 1;
      }
    });

  return {
    equipees:
      equipees,
    zoneOuMieux:
      zoneOuMieux,
    zoneSuperieure:
      zoneSuperieure
  };
}

function dureeCibleStuffAventureSorealIdle_(
  zoneId,
  boss,
  inventaire,
  equipement
) {
  const profil =
    profilStuffAventureSorealIdle_(
      inventaire,
      equipement,
      zoneId
    );

  /*
   * V41.3 — le début doit forcer un vrai cycle :
   * Training -> ennemi normal -> loot -> équipement -> boss de zone.
   *
   * Sans 3 pièces de la zone actuelle, le boss vise 36 s alors que
   * la limite de combat reste 30 s : il est donc volontairement
   * impossible à "bruteforce" juste avec une énorme attaque.
   */
  let secondes;

  if (profil.zoneSuperieure >= 4) {
    secondes =
      boss
        ? 6
        : 3;
  } else if (profil.zoneSuperieure >= 2) {
    secondes =
      boss
        ? 10
        : 6;
  } else if (profil.zoneOuMieux >= 5) {
    secondes =
      boss
        ? 18
        : 9;
  } else if (profil.zoneOuMieux >= 3) {
    secondes =
      boss
        ? 28
        : 14;
  } else {
    secondes =
      boss
        ? 36
        : 19.5;
  }

  return {
    secondes:
      secondes,

    profil:
      profil,

    farmRapide:
      profil.zoneSuperieure >= 4
  };
}

export function puissanceEffectiveAventureSorealIdle_(
  puissanceBrute,
  pvEnnemi,
  zoneId,
  boss,
  inventaire,
  equipement
) {
  const brut =
    Math.max(
      1,
      nombreSorealIdle_(
        puissanceBrute,
        1
      )
    );

  const cible =
    dureeCibleStuffAventureSorealIdle_(
      zoneId,
      boss,
      inventaire,
      equipement
    );

  const plafond =
    Math.max(
      1,
      nombreSorealIdle_(
        pvEnnemi,
        1
      ) /
      Math.max(
        0.25,
        cible.secondes
      )
    );

  return {
    brute:
      brut,
    effective:
      Math.max(
        1,
        Math.min(
          brut,
          plafond
        )
      ),
    plafond:
      plafond,
    dureeCible:
      cible.secondes,
    stuff:
      cible.profil,
    farmRapide:
      cible.farmRapide
  };
}

export function seuilPuissanceAventureSorealIdle_(
  stats,
  pvJoueurMax,
  defense,
  boss
) {
  const s =
    stats || {};

  const degatsRecus =
    degatsRecusAventureSecondeSorealIdle_(
      s.attaque,
      defense
    );

  const tempsKo =
    Math.max(
      0.01,
      nombreSorealIdle_(
        pvJoueurMax,
        1
      ) /
      degatsRecus
    );

  const limite =
    dureeMaxCombatAventureSorealIdle_(
      boss
    );

  const fenetre =
    Math.max(
      0.01,
      Math.min(
        tempsKo,
        limite
      )
    );

  return {
    puissance:
      Math.max(
        1,
        Math.ceil(
          nombreSorealIdle_(
            s.pv,
            1
          ) /
          fenetre
        )
      ),
    tempsKo:
      tempsKo,
    limite:
      limite,
    degatsRecusSeconde:
      degatsRecus
  };
}

export function bossMondeCibleZoneSorealIdle_(
  zoneId
) {
  const z =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  const bossParMonde =
    bossParMondeSorealIdle_();

  if (z >= 6) {
    return bossParMonde;
  }

  return Math.min(
    bossParMonde,
    z * 3
  );
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (4e paramètre, optionnel) propagé jusqu'aux dégâts/stats
 * boss ci-dessous.
 */
export function seuilPuissanceBossPrincipalSorealIdle_(
  bossNumero,
  pvJoueurMax,
  defense,
  difficulty
) {
  const numero =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          bossNumero,
          1
        )
      )
    );

  const index =
    numero - 1;

  const boss =
    definitionBossSorealIdle_(
      index,
      difficulty
    );

  const pvBoss =
    Math.max(
      1,
      nombreSorealIdle_(
        boss.pv,
        1
      )
    );

  const attaque =
    Math.max(
      1,
      nombreSorealIdle_(
        boss.attaque,
        1
      )
    );

  let degatsRecus;

  if (index === 0) {
    /*
     * Une seule formule de vérité pour le tutoriel.
     * L'estimation de puissance doit utiliser exactement les mêmes dégâts
     * que la simulation réelle du combat.
     */
    degatsRecus =
      degatsRecusSecondeSorealIdle_(
        index,
        defense,
        pvBoss,
        pvBoss,
        difficulty
      );
  } else {
    const degatsNormaux =
      degatsRecusSecondeSorealIdle_(
        index,
        defense,
        pvBoss,
        pvBoss,
        difficulty
      );

    const degatsFureur =
      degatsRecusSecondeSorealIdle_(
        index,
        defense,
        pvBoss * 0.25,
        pvBoss,
        difficulty
      );

    /*
     * Estimation conservatrice :
     * 70 % du combat hors Fureur, 30 % sous Fureur.
     */
    degatsRecus =
      degatsNormaux * 0.7 +
      degatsFureur * 0.3;
  }

  const tempsKo =
    Math.max(
      0.01,
      nombreSorealIdle_(
        pvJoueurMax,
        1
      ) /
      Math.max(
        0.01,
        degatsRecus
      )
    );

  const limite =
    Math.max(
      15,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'BOSS_COMBAT_CIBLE_MAX_SECONDES',
          180
        ),
        180
      )
    );

  const fenetre =
    Math.max(
      0.01,
      Math.min(
        tempsKo,
        limite
      )
    );

  const multiplicateurDps =
    Math.max(
      0.02,
      multiplicateurDpsJoueurBossSorealIdle_(
        index,
        false
      ) *
      multiplicateurSceauBossSorealIdle_(
        index,
        {sceauBriseBossNumero:0}
      )
    );

  const regen =
    regenBossSecondeSorealIdle_(
      index,
      pvBoss
    );

  return {
    bossNumero:
      numero,
    nom:
      String(
        boss.nom || 'Boss'
      ),
    puissance:
      Math.max(
        1,
        Math.ceil(
          (
            pvBoss /
            fenetre +
            regen
          ) /
          multiplicateurDps
        )
      ),
    tempsKo:
      tempsKo,
    limite:
      limite
  };
}
