import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { idleReinitialiserTempsActifV1 } from "../src/idle-sqlite-runtime.js";
import {
  FORMAT_PARTIE_V1, NB_COLONNES_PARTIE_V1, COL_STATS_JSON_PARTIE_V1, COL_DERNIERE_SYNCHRO_PARTIE_V1,
  creerFichierPartieV1, validerFichierPartieV1, preparerLignePartieV1
} from "../src/idle-partie-fichier-v1.js";

/*
 * Sauvegarde / chargement d'une partie par fichier (Norman, 2026-10-20) : la partie reprend EXACTEMENT au moment de la sauvegarde, aucun temps hors ligne n'est compté entre la sauvegarde et le chargement ;
 * l'identité du compte qui charge est conservée.
 */

// 1. Validation du fichier
const ligneType = (stats) => {
  const c = new Array(NB_COLONNES_PARTIE_V1).fill(0);
  c[0] = "J001"; c[1] = "Alice"; c[15] = "2026-10-20T10:00:00.000Z"; c[16] = "Visible"; c[17] = ""; c[18] = "alice@example.com"; c[19] = "alice@example.com"; c[28] = ""; c[32] = ""; c[35] = "2026-01-01T00:00:00.000Z";
  c[COL_STATS_JSON_PARTIE_V1] = JSON.stringify(stats);
  return c;
};
const T0 = Date.parse("2026-10-20T10:00:00.000Z");
const bon = creerFichierPartieV1(ligneType({ metaNgu: { updatedAt: T0 } }), T0);
assert.equal(bon.format, FORMAT_PARTIE_V1);
assert.deepEqual(validerFichierPartieV1(bon), { ok: true });
assert.equal(validerFichierPartieV1(null).ok, false, "rien");
assert.equal(validerFichierPartieV1({ ...bon, format: "autre" }).erreur, "FORMAT_INCONNU");
assert.equal(validerFichierPartieV1({ ...bon, cells: bon.cells.slice(0, 10) }).erreur, "COLONNES_INVALIDES");
assert.equal(validerFichierPartieV1({ ...bon, serveurAt: 12 }).erreur, "INSTANT_INVALIDE");
assert.equal(validerFichierPartieV1({ ...bon, cells: bon.cells.map((c, i) => (i === COL_STATS_JSON_PARTIE_V1 ? "pas du json" : c)) }).erreur, "ETAT_INVALIDE");
assert.equal(validerFichierPartieV1({ ...bon, cells: bon.cells.map((c, i) => (i === 3 ? { piege: 1 } : c)) }).erreur, "COLONNES_INVALIDES", "une colonne ne peut pas contenir un objet");

// 2. Décalage des dates, identité et préférences du compte
const DELTA = 10 * 24 * 3600 * 1000 + 12345;
const T1 = T0 + DELTA;
const courante = ligneType({ metaNgu: { uiPrefs: { soreal_idle_x: "compte" } } });
courante[0] = "J777"; courante[1] = "Bob"; courante[16] = "Masque"; courante[17] = "Admin"; courante[18] = "bob@example.com"; courante[19] = "bob@example.com"; courante[35] = "2025-05-05T00:00:00.000Z";
const fichier = creerFichierPartieV1(ligneType({
  metaNgu: {
    updatedAt: T0 - 5, runStartedAt: T0 - 3600_000, rebirth: { updatedAt: T0 - 5 },
    adventure: { titans: [{ cooldownJusqua: T0 + 90_000, kills: 12 }], farmAt: T0 - 1000 },
    currencies: { gold: T0 + 777 },                 // un montant qui tombe par hasard dans la fenêtre : il ne doit pas bouger
    records: { bestGoldThisRun: T0 + 5000 },
    resources: { energy: { current: 1.79e12 } },
    uiPrefs: { soreal_idle_x: "fichier" },
    jourIso: "2026-10-20T09:59:00.000Z",
    petit: 42
  },
  entrainementBase: { lastUpdateMs: T0 - 2 }
}), T0, { nom: "Alice" });
fichier.cells[28] = "2026-10-20T10:03:00.000Z"; // KO jusqu'à (dans 3 minutes)
const prep = preparerLignePartieV1(courante, fichier, T1);
const stats = JSON.parse(prep.cells[COL_STATS_JSON_PARTIE_V1]);
assert.equal(stats.metaNgu.updatedAt, T0 - 5 + DELTA, "updatedAt décalé");
assert.equal(stats.metaNgu.runStartedAt, T0 - 3600_000 + DELTA, "début du run décalé");
assert.equal(stats.metaNgu.rebirth.updatedAt, T0 - 5 + DELTA);
assert.equal(stats.metaNgu.adventure.titans[0].cooldownJusqua, T0 + 90_000 + DELTA, "échéance dans un tableau : elle tombe toujours 90 s après le moment de la sauvegarde");
assert.equal(stats.metaNgu.adventure.titans[0].kills, 12, "un compteur ne bouge pas");
assert.equal(stats.metaNgu.adventure.farmAt, T0 - 1000 + DELTA);
assert.equal(stats.metaNgu.currencies.gold, T0 + 777, "un montant d'Or ne bouge pas, même s'il ressemble à un horodatage");
assert.equal(stats.metaNgu.records.bestGoldThisRun, T0 + 5000, "un record ne bouge pas");
assert.equal(stats.metaNgu.resources.energy.current, 1.79e12, "une ressource ne bouge pas");
assert.equal(stats.metaNgu.petit, 42);
assert.equal(stats.metaNgu.jourIso, new Date(T0 - 60_000 + DELTA).toISOString(), "date ISO écrite en texte décalée");
assert.equal(stats.entrainementBase.lastUpdateMs, T0 - 2 + DELTA);
assert.equal(stats.metaNgu.uiPrefs.soreal_idle_x, "compte", "les préférences d'interface restent celles du compte");
assert.equal(prep.cells[28], new Date(T0 + 180_000 + DELTA).toISOString(), "KO jusqu'à : toujours dans 3 minutes");
assert.equal(prep.cells[COL_DERNIERE_SYNCHRO_PARTIE_V1], new Date(T1).toISOString(), "dernière synchro = maintenant");
for (const [i, v] of [[0, "J777"], [1, "Bob"], [16, "Masque"], [17, "Admin"], [18, "bob@example.com"], [19, "bob@example.com"], [35, "2025-05-05T00:00:00.000Z"]]) assert.equal(prep.cells[i], v, "identité du compte conservée : colonne " + i);
assert.ok(prep.decalees >= 8, "des dates ont bien été décalées");

// 3. Dans le vrai moteur : aucun temps hors ligne entre la sauvegarde et le chargement
idleReinitialiserTempsActifV1();
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate {
  constructor(...a) { if (a.length === 0) super(horloge); else super(...a); }
  static now() { return horloge; }
};
try {
  const g = creerJoueurExterneV1("partie@example.com");
  const op = (nom, ...args) => g.op(nom, "x", ...args);
  op("obtenirEtatSorealIdle");
  for (let i = 0; i < 6; i += 1) { horloge += 5000; op("synchroniserSorealIdle"); }
  const avant = op("synchroniserSorealIdle").joueur;
  const energieSauvegarde = Number(avant.energie);
  assert.ok(energieSauvegarde > 0, "le joueur a de l'énergie");
  const ligneActuelle = () => JSON.parse(g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=2")[0].row_json);
  const cellules = ligneActuelle();
  const instantSauvegarde = horloge;
  const f = creerFichierPartieV1(cellules, instantSauvegarde);
  assert.deepEqual(validerFichierPartieV1(f), { ok: true });

  // Témoin : sans le décalage, 10 jours d'absence sont comptés.
  const JOURS10 = 10 * 24 * 3600 * 1000;
  horloge = instantSauvegarde + JOURS10;
  const temoin = Number(op("synchroniserSorealIdle").joueur.energie);
  assert.ok(temoin > energieSauvegarde + 1, "témoin : sans décalage, le temps hors ligne est compté (énergie " + energieSauvegarde + " -> " + temoin + ")");

  // Chargement : la même partie, 10 jours plus tard, avec les dates décalées.
  g.sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=2", JSON.stringify(cellules));
  const chargee = preparerLignePartieV1(ligneActuelle(), f, horloge);
  g.sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=2", JSON.stringify(chargee.cells));
  const apres = op("synchroniserSorealIdle").joueur;
  const energieApres = Number(apres.energie);
  assert.ok(Math.abs(energieApres - energieSauvegarde) < 3, "aucun temps hors ligne : énergie à la sauvegarde " + energieSauvegarde + ", après chargement 10 jours plus tard " + energieApres);
  // Et la partie continue normalement ensuite.
  horloge += 10000;
  const suite = Number(op("synchroniserSorealIdle").joueur.energie);
  assert.ok(suite >= energieApres, "la partie continue après le chargement");
} finally {
  globalThis.Date = VraiDate;
}

// 4. Branchements : serveur (copie de sécurité forcée), Worker (vérification par une synchro, retour arrière), page (boutons dans les Réglages)
const lire = (c) => readFileSync(new URL(c, import.meta.url), "utf8");
const serveur = lire("../src/idle-local-sync-v1.js");
assert.ok(serveur.includes('p.importPartie === true ? "avant-import"'), "le serveur garde une copie de la partie actuelle avant un chargement");
const worker = lire("../local/moteur-local-worker.js");
assert.ok(worker.includes('m.type === "importer"') && worker.includes("ecrire(avant)") && worker.includes("ETAT_REFUSE"), "le Worker vérifie la partie et remet l'ancienne si le moteur la refuse");
const page = lire("../public/modules/moteur-local-v1.js");
assert.ok(page.includes("__exporterPartieIdleV1__") && page.includes("__chargerPartieIdleV1__") && page.includes("importPartie=true"), "la page exporte, charge et prévient le serveur");
const reglages = lire("../public/modules/ui-reglages-v1.js");
assert.ok(reglages.includes("__exporterPartieIdleV1__") && reglages.includes("__choisirPartieIdleV1__") && reglages.includes("Charger une partie"), "boutons dans les Réglages");
console.log("idle-partie-fichier-v1: OK");
