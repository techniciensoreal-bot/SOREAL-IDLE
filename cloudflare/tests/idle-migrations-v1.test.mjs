import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { figerLeHasard, reglerHorloge } from "./_partie-reference.mjs";
import { construireFormes, MAINTENANT_FORMES, lireReference } from "./_migrations-formes.mjs";
import { sorties, empreinte } from "./_migrations-sortie.mjs";

/*
 * VERSION DE SAUVEGARDE et REGISTRE DE MIGRATIONS (audit de cohérence 2026-11-09, front 3 ; design/ARCHITECTURE-CIBLE.md principe 5). Conception : en-tête de src/idle-migrations-v1.js.
 * Ce test garde : (a) chaque migration idempotente, (b) l'enchaînement donne EXACTEMENT l'état d'avant le registre (references/migrations-avant.json, généré avant le chantier ; le SEUL champ qui change est `etatVersion`),
 * (c) une version plus récente n'est jamais abaissée, (d) le registre est continu, (e) l'export fichier et la synchro locale portent la version, un fichier sans version reste importable, (f) un fichier plus récent est refusé.
 */
const racine = process.cwd();
const imp = (f) => import(pathToFileURL(racine + "/cloudflare/src/" + f).href);
const M = await imp("idle-migrations-v1.js");
const { normalizeIdleNguState } = await imp("idle-ngu-etat.js");
const cp = (o) => JSON.parse(JSON.stringify(o));
const normaliser = (raw, ctx) => { figerLeHasard(); reglerHorloge(MAINTENANT_FORMES); return cp(normalizeIdleNguState(cp(raw), ctx, MAINTENANT_FORMES)); };

// (d) Registre continu
{
  const des = M.MIGRATIONS.map((m) => m.de);
  assert.equal(new Set(des).size, des.length, "d. pas de doublon de `de`");
  const noms = M.MIGRATIONS.map((m) => m.nom);
  assert.equal(new Set(noms).size, noms.length, "d. pas de doublon de nom");
  for (const m of M.MIGRATIONS) { assert.ok(m.vers > m.de, "d. vers > de : " + m.nom); assert.equal(typeof m.appliquer, "function"); assert.ok(m.phase === "brut" || m.phase === "normalise", "d. phase connue : " + m.nom); }
  for (const de of des) {   // la chaîne part de chaque `de` et arrive à la version courante sans trou
    let v = de, pas = 0;
    while (v !== M.ETAT_VERSION_COURANTE) { const m = M.MIGRATIONS.find((x) => x.de === v); assert.ok(m, "d. trou dans le registre à partir de " + v + " (depuis " + de + ")"); v = m.vers; assert.ok(++pas < 20); }
  }
  assert.equal(Math.max(...M.MIGRATIONS.map((m) => m.vers)), M.ETAT_VERSION_COURANTE, "d. la dernière entrée vise ETAT_VERSION_COURANTE");
  assert.equal(M.MIGRATIONS.filter((m) => m.vers === M.ETAT_VERSION_COURANTE).length, 1);
  assert.ok(M.ETAT_VERSION_COURANTE > 52, "au-dessus de resourceModelVersion");
}

// (b) Enchaînement complet = état d'avant le registre, forme par forme ; le seul champ qui change est `etatVersion`
const avant = JSON.parse(fs.readFileSync(racine + "/cloudflare/tests/references/migrations-avant.json", "utf8"));
const apres = await sorties();
const jouees = {};
for (const f of construireFormes()) {
  const e = apres[f.nom];
  assert.ok(avant[f.nom], "b. forme absente du fichier d'avant : " + f.nom);
  assert.equal(e.etatVersion, M.ETAT_VERSION_COURANTE, "b. " + f.nom + " : l'état porte etatVersion");
  const diff = [];
  for (const k of new Set([...Object.keys(e), ...Object.keys(avant[f.nom].cles)])) if (empreinte(e[k]) !== avant[f.nom].cles[k]) diff.push(k);
  assert.deepEqual(diff, ["etatVersion"], "b. " + f.nom + " : seul `etatVersion` diffère de l'état d'avant (écart : " + diff.join(",") + ")");
  // Empreinte globale : sans le champ, l'état entier est identique octet pour octet à celui d'avant
  const sans = cp(e); delete sans.etatVersion;
  assert.equal(empreinte(sans), avant[f.nom].tout, "b. " + f.nom + " : empreinte de l'état entier sans etatVersion");
}
// Les formes anciennes jouent bien les migrations attendues (sinon la comparaison ci-dessus ne prouverait rien)
{
  const f = Object.fromEntries(construireFormes().map((x) => [x.nom, x]));
  const joue = (nom, phase) => {
    let r = M.migrerEtatV1(cp(f[nom].raw), { now: MAINTENANT_FORMES, jeu: f[nom].ctx, phase });
    return r;
  };
  assert.deepEqual(joue("legacy-sans-saveSchema", "brut").jouees, ["legacy-vers-v47"], "legacy sans saveSchema : migration legacy");
  assert.deepEqual(joue("legacy-schema-46", "brut").jouees, ["legacy-vers-v47"], "saveSchema 46 : migration legacy");
  assert.deepEqual(joue("reference-1", "brut").jouees, [], "natif : pas de migration legacy");
  assert.equal(M.versionEffectiveV1(f["resourceModel-50"].raw), 47);
  assert.equal(M.versionEffectiveV1(f["resourceModel-51"].raw), 51);
  assert.equal(M.versionEffectiveV1(f["resourceModel-absent"].raw), 47);
  assert.equal(M.versionEffectiveV1(f["reference-1"].raw), 52, "sans etatVersion et resourceModelVersion 52 : version 52");
  assert.equal(M.versionEffectiveV1(f["legacy-sans-saveSchema"].raw), 0);
  assert.equal(M.versionEffectiveV1(null), 0);
  // V51/V52 changent bien l'état de la forme « resourceModel-50 » (réserve d'énergie libre et réservations d'Yggdrasil)
  const brut = f["resourceModel-50"];
  const etat = normaliser(brut.raw, brut.ctx);
  const sansV51 = cp(brut.raw); sansV51.resourceModelVersion = 52;
  const etat52 = normaliser(sansV51, brut.ctx);
  assert.notEqual(empreinte(etat.resources), empreinte(etat52.resources), "V51/V52 modifient les ressources de la forme resourceModel-50");
  assert.equal(etat.systems.yggdrasil.data.reserved.energy, 0);
}

// (a) Chaque migration seule est idempotente (la rejouer = une fois, octet pour octet) et ne joue que depuis sa version `de`
{
  const formes = Object.fromEntries(construireFormes().map((x) => [x.nom, x]));
  const base = apres["resourceModel-50"];   // état normalisé complet
  const brut = formes["legacy-sans-saveSchema"];
  for (const m of M.MIGRATIONS) {
    const depart = m.de === 0 ? cp(brut.raw) : Object.assign(cp(base), { etatVersion: m.de });
    if (m.de >= 47) { depart.systems.yggdrasil.data.reserved = { energy: 400, magic: 12 }; }
    const ctx = { now: MAINTENANT_FORMES, jeu: Object.assign({ legacyEnergyIdle: 777 }, brut.ctx) };
    const une = M.appliquerMigrationV1(m, cp(depart), ctx);
    assert.equal(une.etatVersion, m.vers, "a. " + m.nom + " : pose etatVersion = vers");
    const deux = M.appliquerMigrationV1(m, cp(une), ctx);
    assert.equal(JSON.stringify(deux), JSON.stringify(une), "a. " + m.nom + " : idempotente (deux fois = une fois, octet pour octet)");
    // Hors de sa version, une migration ne touche à rien
    const autre = cp(depart); autre.etatVersion = M.ETAT_VERSION_COURANTE;
    if (m.de !== 0 && m.de !== M.ETAT_VERSION_COURANTE) assert.equal(JSON.stringify(M.appliquerMigrationV1(m, cp(autre), ctx)), JSON.stringify(autre), "a. " + m.nom + " : sans effet hors de sa version");
    // Pureté : même entrée, même sortie, horloge et hasard changés
    const h = Date.now; const r = Math.random;
    try { Date.now = () => 1; Math.random = () => 0.123; const x = JSON.stringify(M.appliquerMigrationV1(m, cp(depart), ctx)); Date.now = () => 9e12; Math.random = () => 0.987; assert.equal(JSON.stringify(M.appliquerMigrationV1(m, cp(depart), ctx)), x, "a. " + m.nom + " : pure (ni horloge ni hasard)"); } finally { Date.now = h; Math.random = r; }
  }
  // La chaîne complète est idempotente aussi : une 2e normalisation ne change rien
  for (const f of construireFormes()) {
    const une = normaliser(f.raw, f.ctx);
    const deux = normaliser(une, f.ctx);
    assert.equal(deux.etatVersion, une.etatVersion);
    assert.equal(JSON.stringify(deux.resources), JSON.stringify(une.resources), "a. " + f.nom + " : 2e normalisation, ressources identiques");
  }
}

// (c) Une version PLUS RÉCENTE n'est jamais abaissée ni modifiée
{
  const plus = cp(lireReference(1)); plus.etatVersion = M.ETAT_VERSION_COURANTE + 7; plus.resourceModelVersion = 60; plus.champFutur = { a: 1 };
  const r = M.migrerEtatV1(plus, { now: MAINTENANT_FORMES });
  assert.equal(r.etatPlusRecent, true); assert.deepEqual(r.jouees, []); assert.equal(r.etat, plus, "l'état est rendu tel quel (même objet)");
  assert.equal(plus.etatVersion, M.ETAT_VERSION_COURANTE + 7);
  assert.equal(M.etatPlusRecentV1(plus), true);
  assert.equal(M.etatPlusRecentV1({ etatVersion: M.ETAT_VERSION_COURANTE }), false);
  const n = normaliser(plus, { bosses: 30, zone: 5, sets: 2, rebirths: 3 });
  assert.equal(n.etatVersion, M.ETAT_VERSION_COURANTE + 7, "c. la normalisation du moteur n'abaisse pas etatVersion");
  assert.equal(n.resourceModelVersion, 60, "c. ni resourceModelVersion");
  assert.deepEqual(n.champFutur, { a: 1 }, "c. un champ inconnu d'un moteur plus récent est conservé");
  // Pas de migration legacy sur un état plus récent même s'il n'a pas la forme native
  const bizarre = { version: "AUTRE", etatVersion: 99, donnee: 1 };
  assert.equal(M.migrerEtatV1(bizarre, {}).etat, bizarre);
  assert.equal(normaliser(bizarre, {}).etatVersion, 99);
  // Une version déclarée absurde (texte, négatif, décimal) est ignorée comme « sans version »
  for (const v of ["abc", -3, 52.5, null, 0]) assert.equal(M.etatVersionDeclareeV1({ etatVersion: v }), 0);
}

// Le champ de version ne perturbe pas les clés de mémo : deux calculs de bonus sur le même état normalisé restent identiques et le mémo se réutilise (vérifié aussi par idle-bonus-* avec SOREAL_IDLE_VERIF_BONUS=1)
{
  const { idleNguBonuses } = await imp("idle-ngu-progression.js");
  const e = normaliser(lireReference(1), { bosses: 30, zone: 5, sets: 2, rebirths: 3 });
  const a = JSON.stringify(idleNguBonuses(cp(e), {})), b = JSON.stringify(idleNguBonuses(cp(Object.assign(cp(e), { etatVersion: M.ETAT_VERSION_COURANTE })), {}));
  assert.equal(a, b, "etatVersion constant : mêmes bonus");
}

// (e)(f) Export fichier : porte etatVersion ; un fichier SANS version reste importable ; un fichier plus récent est refusé
{
  const F = await imp("idle-partie-fichier-v1.js");
  const ligne = (stats) => { const c = new Array(F.NB_COLONNES_PARTIE_V1).fill(0); c[0] = "J001"; c[1] = "Alice"; c[15] = "2026-10-20T10:00:00.000Z"; c[F.COL_STATS_JSON_PARTIE_V1] = JSON.stringify(stats); return c; };
  const T0 = Date.parse("2026-10-20T10:00:00.000Z");
  // Fichier d'aujourd'hui (état avec version) : le fichier la porte
  const avecVersion = F.creerFichierPartieV1(ligne({ metaNgu: { etatVersion: M.ETAT_VERSION_COURANTE, updatedAt: T0 } }), T0);
  assert.equal(avecVersion.etatVersion, M.ETAT_VERSION_COURANTE, "e. le fichier porte etatVersion");
  assert.deepEqual(F.validerFichierPartieV1(avecVersion), { ok: true });
  // Fichier d'avant le registre (« Exporter ma partie » déjà téléchargé) : ni champ de fichier ni version dans l'état -> accepté, tel quel
  const ancien = F.creerFichierPartieV1(ligne({ metaNgu: { updatedAt: T0 } }), T0);
  assert.equal("etatVersion" in ancien, false);
  assert.deepEqual(F.validerFichierPartieV1(ancien), { ok: true }, "e. un fichier sans version reste accepté");
  // Même fichier tel que le téléchargeait la page (JSON puis relecture) : toujours accepté
  assert.deepEqual(F.validerFichierPartieV1(JSON.parse(JSON.stringify(ancien))), { ok: true });
  // Le vrai fichier d'une partie de référence (état sans version) s'importe
  const refLigne = JSON.parse(fs.readFileSync(racine + "/cloudflare/tests/references/partie-reference-1.json", "utf8"));
  assert.deepEqual(F.validerFichierPartieV1(F.creerFichierPartieV1(refLigne, T0)), { ok: true }, "e. partie de référence sans version : importable");
  // (f) plus récent : refusé avec un message clair, par le champ du fichier comme par l'état qu'il contient
  const futurFichier = Object.assign(cp(ancien), { etatVersion: M.ETAT_VERSION_COURANTE + 1 });
  const r1 = F.validerFichierPartieV1(futurFichier);
  assert.equal(r1.ok, false); assert.equal(r1.erreur, "ETAT_PLUS_RECENT"); assert.match(r1.message, /plus récente/);
  const futurEtat = F.creerFichierPartieV1(ligne({ metaNgu: { etatVersion: M.ETAT_VERSION_COURANTE + 3, updatedAt: T0 } }), T0);
  assert.equal(F.validerFichierPartieV1(futurEtat).erreur, "ETAT_PLUS_RECENT", "f. version plus récente dans l'état");
  // Les refus d'avant restent identiques
  assert.equal(F.validerFichierPartieV1({ ...ancien, format: "autre" }).erreur, "FORMAT_INCONNU");
  // Le Worker du jeu local transmet ce refus tel quel, et la page affiche le message (texte du code)
  const worker = fs.readFileSync(racine + "/cloudflare/local/moteur-local-worker.js", "utf8");
  assert.ok(worker.includes("erreur: v.erreur, message: v.message"), "le Worker transmet le message du refus");
  const page = fs.readFileSync(racine + "/cloudflare/public/modules/moteur-local-v1.js", "utf8");
  assert.ok(page.includes("etatVersion:etatVersion>0?etatVersion:undefined"), "la page écrit etatVersion dans le fichier exporté");
  assert.ok(page.includes('r.erreur==="ETAT_PLUS_RECENT"'), "la page affiche le refus d'une partie plus récente");
}

// (e) Synchro locale : l'export et l'envoi portent etatVersion ; un client plus ancien n'écrase pas une sauvegarde plus récente
{
  const { SorealIdleCoordinatorV1 } = await imp("index-idle-coordinator-v1.js");
  const { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1 } = await imp("idle-local-sync-v1.js");
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const src = fs.readFileSync(racine + "/cloudflare/tools/local-dev-server.mjs", "utf8");
  const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  feuille("JOUEURS", [HEADERS_]);
  feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
  coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });
  await new Promise((ok) => setTimeout(ok, 30));
  const exp = exporterPourMoteurLocalV1(coord, T, "A");
  assert.equal(exp.ok, true); assert.equal(exp.etatVersion, M.ETAT_VERSION_COURANTE, "e. l'export de la synchro porte etatVersion du moteur");
  const index = exp.joueurs.index;
  const serveur = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", index)[0].row_json);
  const ligneExport = JSON.parse(exp.joueurs.ligne);
  assert.equal(JSON.parse(ligneExport[37]).metaNgu.etatVersion, M.ETAT_VERSION_COURANTE, "e. la ligne exportée porte etatVersion dans metaNgu");
  const envoi = (version, marque, tAjout) => {
    const c = ligneExport.slice(); const st = JSON.parse(c[37]); st.clicsTotal = marque;
    if (version === undefined) delete st.metaNgu.etatVersion; else st.metaNgu.etatVersion = version;
    c[37] = JSON.stringify(st); c[15] = new Date(Date.now() + tAjout).toISOString();
    return recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: c, appareil: "A", depuis: exp.serveurAt });
  };
  const marqueServeur = () => JSON.parse(serveur()[37]).clicsTotal;
  let r = envoi(M.ETAT_VERSION_COURANTE, 111, 10);
  assert.equal(r.ecrit, true); assert.equal(r.etatVersion, M.ETAT_VERSION_COURANTE, "e. la réponse d'envoi porte etatVersion"); assert.equal(r.etatPlusAncien, false);
  assert.equal(marqueServeur(), 111);
  r = envoi(M.ETAT_VERSION_COURANTE - 1, 222, 20);
  assert.equal(r.ok, true); assert.equal(r.ecrit, false, "c. un état d'une version plus ancienne n'écrase pas la sauvegarde");
  assert.equal(r.etatPlusAncien, true); assert.equal(marqueServeur(), 111, "la sauvegarde du serveur est intacte");
  r = envoi(undefined, 333, 30);   // page d'avant le registre : pas de version, comportement d'avant
  assert.equal(r.ecrit, true, "un envoi sans version est accepté comme avant"); assert.equal(marqueServeur(), 333);
}
// Remise à plat du hasard et de l'horloge pour les tests lancés dans le même processus
console.log("idle-migrations-v1: OK");
