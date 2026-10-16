/*
 * Feuille des joueurs, accès et création de joueur (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleDevSlotForUserV1, idleDevUserForSlotV1, idleDevAliasEmailV1 } from "./idle-dev-save-slots-v1.js";
import { sqlRows } from "./core/sqlite-core.js";
import { IDLE_PROTOCOL_VERSION, SpreadsheetApp, __idleCtx, accesOuvertSorealIdle_, accesPublicSorealIdle_ } from "./idle-sqlite-runtime.js";
import { CONFIG_SOREAL_IDLE, nombreSorealIdle_, normaliserEmailSorealIdle_ } from "./idle-runtime-config.js";
import { verifierSessionSoreal } from "./idle-runtime-classeur.js";
import { noterPassageIdleV1_ } from "./idle-runtime-joueurs.js";
import { obtenirParametresEntrainementSorealIdle_ } from "./idle-runtime-etat.js";
import { parametreSorealIdle_ } from "./idle-runtime-catalogue.js";
import { nomBossSorealIdle_, pvMaxBossSorealIdle_ } from "./idle-runtime-boss.js";
import { statsInitiauxSorealIdleV41_ } from "./idle-runtime-aventure.js";

export function obtenirSpreadsheetSorealIdle_() {
  return SpreadsheetApp.openById(
    CONFIG_SOREAL_IDLE.ID_SPREADSHEET
  );
}

export function obtenirFeuilleJoueursSorealIdle_() {
  const feuille =
    obtenirSpreadsheetSorealIdle_()
      .getSheetByName(
        CONFIG_SOREAL_IDLE.FEUILLE_JOUEURS
      );

  if (!feuille) {
    throw new Error(
      'SOREAL_IDLE_FEUILLE_JOUEURS_INTROUVABLE'
    );
  }

  return feuille;
}

function assurerColonnesIdentiteSorealIdle_(
  feuille
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  if (
    feuille.getMaxColumns() <
    c.STATS_JSON
  ) {
    feuille.insertColumnsAfter(
      feuille.getMaxColumns(),
      c.STATS_JSON -
      feuille.getMaxColumns()
    );
  }

  const entetes = {};

  entetes[c.EMAIL_PRINCIPAL] =
    'Email principal';

  entetes[c.EMAIL_CONNEXION] =
    'Email connexion';

  entetes[c.PIECES] =
    'Pièces';

  entetes[c.INVENTAIRE_JSON] =
    'Inventaire JSON';

  entetes[c.EQUIPEMENT_JSON] =
    'Équipement JSON';

  entetes[c.AMELIORATIONS_JSON] =
    'Améliorations JSON';

  entetes[c.RENAISSANCES] =
    'Renaissances';

  entetes[c.ESSENCE_RENAISSANCE] =
    'Essence renaissance';

  entetes[c.PV_JOUEUR] =
    'PV joueur';

  entetes[c.PV_JOUEUR_MAX] =
    'PV joueur max';

  entetes[c.KO_JUSQUA] =
    'KO jusqu\'à';

  entetes[c.AVENTURE_ZONE] =
    'Zone aventure';

  entetes[c.AVENTURE_PROGRESSION_JSON] =
    'Progression aventure JSON';

  entetes[c.AVENTURE_POINTS] =
    'Points aventure';

  entetes[c.AVENTURE_DERNIERE_ACTION] =
    'Dernière action aventure';

  entetes[c.MATERIAUX] =
    'Matériaux';

  entetes[c.COLLECTION_JSON] =
    'Collection JSON';

  entetes[c.DATE_DEBUT] =
    'Date début';

  entetes[c.INVENTAIRE_CAPACITE] =
    'Capacité inventaire';

  entetes[c.STATS_JSON] =
    'Stats JSON';

  Object.keys(entetes)
    .forEach(function(colonneTexte) {
      const colonne =
        Number(colonneTexte);

      const actuel =
        String(
          feuille
            .getRange(
              1,
              colonne
            )
            .getValue() || ''
        ).trim();

      if (!actuel) {
        feuille
          .getRange(
            1,
            colonne
          )
          .setValue(
            entetes[colonne]
          );
      }
    });
}

export function assurerDonneesJeuSorealIdle_(
  feuille,
  ligne
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const bossVaincus =
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

  const celluleProduction =
    feuille
      .getRange(
        ligne,
        c.PROD_SECONDE
      );

  if (
    nombreSorealIdle_(
      celluleProduction.getValue(),
      0
    ) <= 0
  ) {
    celluleProduction.setValue(
      CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
    );
  }


  const cellulePieces =
    feuille
      .getRange(
        ligne,
        c.PIECES
      );

  if (
    cellulePieces.getValue() === '' ||
    cellulePieces.getValue() === null
  ) {
    /*
     * Une cellule vide correspond à un nouveau portefeuille.
     * Les pièces ne sont gagnées qu'au moment d'une vraie victoire.
     */
    cellulePieces.setValue(0);
  }

  const celluleInventaire =
    feuille
      .getRange(
        ligne,
        c.INVENTAIRE_JSON
      );

  if (
    !String(
      celluleInventaire
        .getValue() || ''
    ).trim()
  ) {
    celluleInventaire
      .setValue('[]');
  }

  const celluleEquipement =
    feuille
      .getRange(
        ligne,
        c.EQUIPEMENT_JSON
      );

  if (
    !String(
      celluleEquipement
        .getValue() || ''
    ).trim()
  ) {
    celluleEquipement
      .setValue('{}');
  }

  const celluleAmeliorations =
    feuille
      .getRange(
        ligne,
        c.AMELIORATIONS_JSON
      );

  if (
    !String(
      celluleAmeliorations
        .getValue() || ''
    ).trim()
  ) {
    celluleAmeliorations
      .setValue('{}');
  }

  const celluleRenaissances =
    feuille
      .getRange(
        ligne,
        c.RENAISSANCES
      );

  if (
    celluleRenaissances.getValue() === '' ||
    celluleRenaissances.getValue() === null
  ) {
    celluleRenaissances.setValue(0);
  }

  const celluleEssence =
    feuille
      .getRange(
        ligne,
        c.ESSENCE_RENAISSANCE
      );

  if (
    celluleEssence.getValue() === '' ||
    celluleEssence.getValue() === null
  ) {
    celluleEssence.setValue(0);
  }

  const cellulePvMax =
    feuille.getRange(
      ligne,
      c.PV_JOUEUR_MAX
    );

  if (
    cellulePvMax.getValue() === '' ||
    cellulePvMax.getValue() === null
  ) {
    cellulePvMax.setValue(
      CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
      CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE
    );
  }

  const cellulePv =
    feuille.getRange(
      ligne,
      c.PV_JOUEUR
    );

  if (
    cellulePv.getValue() === '' ||
    cellulePv.getValue() === null
  ) {
    cellulePv.setValue(
      cellulePvMax.getValue()
    );
  }

  const celluleKo =
    feuille.getRange(
      ligne,
      c.KO_JUSQUA
    );

  if (
    celluleKo.getValue() === null
  ) {
    celluleKo.clearContent();
  }

  const celluleZoneAventure =
    feuille.getRange(
      ligne,
      c.AVENTURE_ZONE
    );

  if (
    celluleZoneAventure.getValue() === '' ||
    celluleZoneAventure.getValue() === null
  ) {
    celluleZoneAventure.setValue(1);
  }

  const celluleProgressionAventure =
    feuille.getRange(
      ligne,
      c.AVENTURE_PROGRESSION_JSON
    );

  if (
    !String(
      celluleProgressionAventure.getValue() || ''
    ).trim()
  ) {
    celluleProgressionAventure.setValue('{}');
  }

  const cellulePointsAventure =
    feuille.getRange(
      ligne,
      c.AVENTURE_POINTS
    );

  if (
    cellulePointsAventure.getValue() === '' ||
    cellulePointsAventure.getValue() === null
  ) {
    cellulePointsAventure.setValue(0);
  }

  const celluleMateriaux =
    feuille.getRange(
      ligne,
      c.MATERIAUX
    );

  if (
    celluleMateriaux.getValue() === '' ||
    celluleMateriaux.getValue() === null
  ) {
    celluleMateriaux.setValue(0);
  }

  const celluleCollection =
    feuille.getRange(
      ligne,
      c.COLLECTION_JSON
    );

  if (
    !String(
      celluleCollection.getValue() || ''
    ).trim()
  ) {
    celluleCollection.setValue('{}');
  }

  const celluleDateDebut =
    feuille.getRange(ligne,c.DATE_DEBUT);

  if (!celluleDateDebut.getValue()) {
    celluleDateDebut.setValue(new Date());
  }

  const celluleCapacite =
    feuille.getRange(ligne,c.INVENTAIRE_CAPACITE);

  if (
    nombreSorealIdle_(
      celluleCapacite.getValue(),
      0
    ) < 1
  ) {
    celluleCapacite.setValue(
      CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
    );
  }

  const celluleStats =
    feuille.getRange(ligne,c.STATS_JSON);

  if (!String(celluleStats.getValue()||'').trim()) {
    celluleStats.setValue('{}');
  }
}

export function emailsAutorisesSorealIdle_() {
  return CONFIG_SOREAL_IDLE
    .EMAILS_DEVELOPPEMENT
    .map(normaliserEmailSorealIdle_)
    .filter(Boolean);
}

export function extraireEmailsUtilisateurSorealIdle_(
  user
) {
  const emails = [];

  if (!user || typeof user !== 'object') {
    return emails;
  }

  if (user.email) {
    emails.push(user.email);
  }

  if (user.emailConnexion) {
    emails.push(user.emailConnexion);
  }

  if (Array.isArray(user.emails)) {
    user.emails.forEach(function(email) {
      emails.push(email);
    });
  }

  const deja = {};

  return emails
    .map(normaliserEmailSorealIdle_)
    .filter(function(email) {
      if (!email || deja[email]) {
        return false;
      }

      deja[email] = true;
      return true;
    });
}

export function verifierAccesSorealIdle_(
  sessionToken
) {
  const token =
    String(sessionToken || '').trim();

  if (!token) {
    return {
      ok: false,
      autorise: false,
      raison: 'SESSION_MANQUANTE',
      user: null,
      emailAutorise: ''
    };
  }

  let verification;

  try {
    verification =
      verifierSessionSoreal(token);
  } catch (e) {
    return {
      ok: false,
      autorise: false,
      raison: 'SESSION_INVALIDE',
      user: null,
      emailAutorise: ''
    };
  }

  if (
    !verification ||
    !verification.ok ||
    !verification.user
  ) {
    return {
      ok: false,
      autorise: false,
      raison: 'SESSION_INVALIDE',
      user: null,
      emailAutorise: ''
    };
  }

  const user = verification.user;

  const emailsUtilisateur =
    extraireEmailsUtilisateurSorealIdle_(
      user
    );

  const autorises =
    emailsAutorisesSorealIdle_();

  /*
   * Compte permanent (administrateur) ; sinon, interrupteur ouvert ET trophée « Assiduité de bronze » (Norman, 2026-09-25) : le drapeau
   * user.idleTrophee est posé par le Worker TV à partir des trophées débloqués (jamais fourni par le navigateur), y compris pour les
   * personnes qui ne travaillent plus ici. Le compte est alors autorisé sous sa propre adresse.
   */
  const emailAutorise =
    emailsUtilisateur.find(
      function(email) {
        return autorises.indexOf(email) !== -1;
      }
    ) || (
      accesOuvertSorealIdle_() &&
      user && user.idleTrophee === true
        ? String(emailsUtilisateur[0] || '')
        : ''
    ) || (
      /*
       * Joueur connecté par Google (drapeau posé uniquement par le Worker IDLE après vérification du jeton Google) : autorisé sous sa propre adresse quand
       * l'administrateur a ouvert l'accès public.
       */
      accesPublicSorealIdle_() &&
      user && user.externe === true
        ? String(emailsUtilisateur[0] || '')
        : ''
    );

  return {
    ok: true,
    autorise: Boolean(emailAutorise),
    raison:
      emailAutorise
        ? ''
        : 'ACCES_REFUSE',
    user: user,
    emailAutorise: emailAutorise
  };
}

export function exigerAccesSorealIdle_(
  sessionToken
) {
  const acces =
    verifierAccesSorealIdle_(
      sessionToken
    );

  if (!acces.ok) {
    throw new Error(
      'SESSION_EXPIREE'
    );
  }

  if (!acces.autorise) {
    throw new Error(
      'SOREAL_IDLE_ACCES_REFUSE'
    );
  }

  return acces;
}

export function obtenirAccesSorealIdle(
  sessionToken
) {
  const acces =
    verifierAccesSorealIdle_(
      sessionToken
    );

  if (
    !acces.ok ||
    !acces.autorise
  ) {
    return {
      ok: true,
      autorise: false,
      protocolVersion: IDLE_PROTOCOL_VERSION
    };
  }

  noterPassageIdleV1_(acces);

  return {
    ok: true,
    autorise: true,
    protocolVersion: IDLE_PROTOCOL_VERSION,
    externe: Boolean(acces.user && acces.user.externe === true),
    utilisateur: {
      prenom:
        String(
          acces.user.prenom ||
          'Norman'
        ).trim(),

      email:
        normaliserEmailSorealIdle_(
          acces.user.email ||
          acces.emailAutorise
        ),

      emailConnexion:
        normaliserEmailSorealIdle_(
          acces.user.emailConnexion ||
          acces.emailAutorise
        )
    },

    version:
      CONFIG_SOREAL_IDLE.VERSION
  };
}

export function trouverLigneJoueurSorealIdle_(
  feuille,
  acces
) {
  if (idleDevSlotForUserV1(acces && acces.user) === 'b') {
    acces = Object.assign({}, acces, {
      user: idleDevUserForSlotV1(acces.user, 'b'),
      emailAutorise: idleDevAliasEmailV1(acces.emailAutorise, 'b')
    });
  }

  assurerColonnesIdentiteSorealIdle_(
    feuille
  );

  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const derniereLigne =
    Math.max(
      2,
      feuille.getLastRow()
    );

  const emailsUtilisateur =
    extraireEmailsUtilisateurSorealIdle_(
      acces.user
    );

  const emailPrincipal =
    normaliserEmailSorealIdle_(
      acces.user.email ||
      acces.emailAutorise
    );

  const emailConnexion =
    normaliserEmailSorealIdle_(
      acces.user.emailConnexion ||
      acces.emailAutorise
    );

  const prenom =
    String(
      acces.user.prenom ||
      'Norman'
    ).trim();

  /*
   * Recherche par SQLite avant de décoder les lignes des autres joueurs (audit du 2026-10-10, IDLE-AUDIT-PERF-001) : SQLite lit les deux colonnes e-mail de la ligne sans la décoder et donne la première ligne qui correspond,
   * exactement celle que la boucle ci-dessous trouverait (même ordre, même normalisation : minuscules sans espaces). Elle est VÉRIFIÉE sur la feuille en mémoire avant d'être utilisée ; sans indice sûr (aucune ligne trouvée,
   * lignes déjà modifiées par cette opération, pas de base), la boucle complète reste le repli : jamais de ligne attribuée au mauvais joueur.
   */
  if (__idleCtx.__idleSql && feuille.dirtyRows.size === 0 && emailsUtilisateur.length) {
    try {
      const candidats = emailsUtilisateur.map(function(e) { return normaliserEmailSorealIdle_(e); }).filter(Boolean);
      if (candidats.length) {
        const marques = candidats.map(function() { return '?'; }).join(',');
        const trouve = sqlRows(__idleCtx.__idleSql.exec(
          "SELECT row_index FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>=2 AND (" +
          "lower(trim(json_extract(row_json,'$[" + (c.EMAIL_PRINCIPAL - 1) + "]'))) IN (" + marques + ") OR " +
          "lower(trim(json_extract(row_json,'$[" + (c.EMAIL_CONNEXION - 1) + "]'))) IN (" + marques + ")) " +
          "ORDER BY row_index LIMIT 1",
          ...candidats, ...candidats
        ))[0];
        const indice = trouve ? Math.floor(Number(trouve.row_index)) : 0;
        if (indice >= 2) {
          const p = normaliserEmailSorealIdle_(feuille.getCell(indice, c.EMAIL_PRINCIPAL));
          const k = normaliserEmailSorealIdle_(feuille.getCell(indice, c.EMAIL_CONNEXION));
          if ((p && emailsUtilisateur.indexOf(p) !== -1) || (k && emailsUtilisateur.indexOf(k) !== -1)) {
            assurerDonneesJeuSorealIdle_(feuille, indice);
            return indice;
          }
        }
      }
    } catch (_e) {
      /* indice indisponible : repli sur la boucle complète */
    }
  }

  const valeurs =
    feuille
      .getRange(
        2,
        1,
        derniereLigne - 1,
        c.AMELIORATIONS_JSON
      )
      .getValues();

  let ligneParNom = 0;

  for (
    let i = 0;
    i < valeurs.length;
    i++
  ) {
    const ligne = i + 2;

    const emailFeuillePrincipal =
      normaliserEmailSorealIdle_(
        valeurs[i][
          c.EMAIL_PRINCIPAL - 1
        ]
      );

    const emailFeuilleConnexion =
      normaliserEmailSorealIdle_(
        valeurs[i][
          c.EMAIL_CONNEXION - 1
        ]
      );

    if (
      emailFeuillePrincipal &&
      emailsUtilisateur.indexOf(
        emailFeuillePrincipal
      ) !== -1
    ) {
      assurerDonneesJeuSorealIdle_(
        feuille,
        ligne
      );

      return ligne;
    }

    if (
      emailFeuilleConnexion &&
      emailsUtilisateur.indexOf(
        emailFeuilleConnexion
      ) !== -1
    ) {
      assurerDonneesJeuSorealIdle_(
        feuille,
        ligne
      );

      return ligne;
    }

    const nom =
      String(
        valeurs[i][c.NOM - 1] || ''
      ).trim();

    /* Un joueur externe (Google) n'adopte jamais une ligne d'après son nom : uniquement d'après son adresse e-mail. */
    if (
      !ligneParNom &&
      !(acces.user && acces.user.externe === true) &&
      nom &&
      prenom &&
      nom.toLowerCase() ===
      prenom.toLowerCase()
    ) {
      ligneParNom = ligne;
    }
  }

  /*
   * Migration du prototype existant :
   * la ligne Norman existait avant l'ajout
   * des colonnes e-mail.
   */
  if (ligneParNom) {
    feuille
      .getRange(
        ligneParNom,
        c.EMAIL_PRINCIPAL
      )
      .setValue(emailPrincipal);

    feuille
      .getRange(
        ligneParNom,
        c.EMAIL_CONNEXION
      )
      .setValue(emailConnexion);

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligneParNom
    );

    return ligneParNom;
  }

  return creerJoueurSorealIdle_(
    feuille,
    acces
  );
}

function creerJoueurSorealIdle_(
  feuille,
  acces
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const prochaineLigne =
    Math.max(
      2,
      feuille.getLastRow() + 1
    );

  const id =
    'J' +
    String(
      prochaineLigne - 1
    ).padStart(3, '0');

  const prenom =
    String(
      acces.user.prenom ||
      'Joueur'
    ).trim();

  const emailPrincipal =
    normaliserEmailSorealIdle_(
      acces.user.email ||
      acces.emailAutorise
    );

  const emailConnexion =
    normaliserEmailSorealIdle_(
      acces.user.emailConnexion ||
      acces.emailAutorise
    );

  const coefficients =
    obtenirParametresEntrainementSorealIdle_();

  const puissance =
    Math.max(
      0,
      nombreSorealIdle_(
        parametreSorealIdle_('PUISSANCE_BASE_FIXE',4),
        4
      )
    ) +
    CONFIG_SOREAL_IDLE.FORCE_BASE *
      coefficients.force;

  const ligne = [
    id,
    prenom,
    CONFIG_SOREAL_IDLE.NIVEAU_BASE,
    0,
    /*
     * Norman (2026-09-15) : "quand on commence une nouvelle partie, le
     * compte d'énergie est à 250 et on doit générer les 250 restants
     * pour atteindre 500." Uniquement ici (création d'un TOUT NOUVEAU
     * joueur) — jamais sur ENERGIE_BASE lui-même, réutilisé tel quel par
     * renaitreSorealIdle() (Rebirth), dont le comportement (pleine à
     * 500) n'a jamais été mis en cause par Norman.
     */
    CONFIG_SOREAL_IDLE.ENERGIE_BASE / 2,
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
    CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
      CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE,
    CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
      CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE,
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
      prochaineLigne,
      1,
      1,
      ligne.length
    )
    .setValues([ligne]);

  return prochaineLigne;
}
