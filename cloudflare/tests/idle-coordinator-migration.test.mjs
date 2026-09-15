import assert from "node:assert/strict";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

/*
 * Norman (2026-09-09) : étape 3 du découpage du Durable Object partagé —
 * SOREAL IDLE (le mini-jeu) vit désormais dans son propre objet séparé.
 * Contrairement au chat, le moteur de jeu (idle-sqlite-runtime.js) est
 * réutilisé TEL QUEL (jamais réécrit) — pas de risque de "forme de
 * réponse mal recopiée" comme à l'étape 2. Ce test vérifie le vrai point
 * sensible propre à cette migration : la table migration_sources (jamais
 * définie dans le code source, structure confirmée en direct via une
 * route de diagnostic ponctuelle) doit être copiée avec au moins 15
 * lignes "idle:*" au statut DONE, sinon le moteur refuse de fonctionner
 * dans le nouvel objet — un blocage total et silencieux si oublié.
 *
 * Isolation du dépôt (2026-09-15) — le bloc vérifiant que
 * index-global-read-coordinator-v55.js route bien /idle-call vers le
 * nouvel objet (jamais l'ancien) reste dans SOREAL-TV : ce fichier de
 * routage n'a pas migré ici avec le moteur de jeu. Voir SOREAL-TV/
 * cloudflare/tests/idle-coordinator-migration.test.mjs pour ce bloc.
 */

function makeFakeSqlStorage(sharedTables) {
  const tables = sharedTables || { idle_players: new Map(), idle_catalog: new Map(), migration_sources: new Map(), idle_meta: new Map() };
  return {
    tables,
    exec(query, ...bindings) {
      const q = query.replace(/\s+/g, " ").trim();
      if (q.startsWith("CREATE TABLE") || q.startsWith("CREATE INDEX")) return [];
      if (q.startsWith("DELETE FROM idle_players")) {
        tables.idle_players.clear();
        return [];
      }
      if (q.startsWith("DELETE FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1")) {
        for (const key of [...tables.idle_catalog.keys()]) {
          if (key.startsWith("JOUEURS|") && Number(key.split("|")[1]) > 1) tables.idle_catalog.delete(key);
        }
        return [];
      }
      if (q.startsWith("SELECT meta_value FROM idle_meta")) {
        const v = tables.idle_meta.get("reset_fresh_start_v3");
        return v == null ? [] : [{ meta_value: v }];
      }
      if (q.startsWith("INSERT INTO idle_meta")) {
        const [value] = bindings;
        if (!tables.idle_meta.has("reset_fresh_start_v3")) tables.idle_meta.set("reset_fresh_start_v3", value);
        return [];
      }
      if (q.startsWith("INSERT INTO idle_players")) {
        const [player_key, ...rest] = bindings;
        if (!tables.idle_players.has(player_key)) tables.idle_players.set(player_key, rest);
        return [];
      }
      if (q.startsWith("INSERT INTO idle_catalog")) {
        const [sheet_name, row_index] = bindings;
        const key = sheet_name + "|" + row_index;
        if (!tables.idle_catalog.has(key)) tables.idle_catalog.set(key, bindings);
        return [];
      }
      if (q.startsWith("INSERT INTO migration_sources")) {
        const [source_key] = bindings;
        if (!tables.migration_sources.has(source_key)) tables.migration_sources.set(source_key, bindings);
        return [];
      }
      if (q.startsWith("SELECT COUNT(*) AS n FROM idle_players")) return [{ n: tables.idle_players.size }];
      if (q.startsWith("SELECT COUNT(*) AS n FROM idle_catalog")) return [{ n: tables.idle_catalog.size }];
      if (q.startsWith("SELECT COUNT(*) AS n FROM migration_sources")) return [{ n: tables.migration_sources.size }];
      if (q.includes("FROM migration_sources WHERE source_key LIKE 'idle:%'")) {
        const rows = [...tables.migration_sources.keys()].filter(k => k.startsWith("idle:"));
        return [{ total: rows.length, done: rows.length }];
      }
      throw new Error("Requête SQL inattendue dans le test: " + q);
    }
  };
}

function makeIdleMigrationSourcesFixture() {
  // Les 15 clés réelles confirmées en direct sur l'objet principal (2026-09-09).
  const keys = [
    "idle:joueurs","idle:classement","idle:config","idle:idle_apparences","idle:idle_boss",
    "idle:idle_boutique","idle:idle_collections","idle:idle_deblocages","idle:idle_loots",
    "idle:idle_monstres","idle:idle_raretes","idle:idle_repos","idle:idle_sets","idle:idle_sorts",
    "idle:idle_zones"
  ];
  return keys.map(source_key => ({
    source_key, spreadsheet_id: "x", sheet_name: "X", range_a1: "X!A1", cursor_row: 1000,
    row_count: 1, checksum: "abc", status: "DONE", imported_at: Date.now(), error: ""
  }));
}

// --- sans migration, le moteur doit refuser toute opération réelle ---
{
  const state = { storage: { sql: makeFakeSqlStorage() } };
  const coordinator = new SorealIdleCoordinatorV1(state, {});
  const req = new Request("https://x.invalid/__soreal-idle-v1/call", {
    method: "POST",
    body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [], user: { email: "sylvain@example.com" } })
  });
  const res = await coordinator.internal(req, new URL(req.url));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /SOREAL_IDLE_MIGRATION_INCOMPLETE/, "Sans les 15 lignes migration_sources, le moteur doit refuser proprement, pas planter.");
}

// --- import idempotent : rejouer ne duplique jamais rien ---
{
  const state = { storage: { sql: makeFakeSqlStorage() } };
  const coordinator = new SorealIdleCoordinatorV1(state, {});
  const payload = {
    players: [{ player_key: "sylvain@example.com", player_id: "1", display_name: "Sylvain", email_primary: "sylvain@example.com", email_login: "sylvain@example.com", state_json: "[]", source_row: 2, updated_at: Date.now() }],
    catalog: [{ sheet_name: "JOUEURS", row_index: 1, row_json: "[]", updated_at: Date.now() }],
    migrationSources: makeIdleMigrationSourcesFixture()
  };
  const first = coordinator.importLegacyData(payload);
  assert.equal(first.inserted.players, 1);
  assert.equal(first.inserted.catalog, 1);
  assert.equal(first.inserted.migrationSources, 15);

  const second = coordinator.importLegacyData(payload);
  assert.equal(second.ok, true);
  // Les compteurs internes de tables ne doivent jamais dépasser les tailles réelles (pas de doublon).
  assert.equal(state.storage.sql.tables.idle_players.size, 1);
  assert.equal(state.storage.sql.tables.idle_catalog.size, 1);
  assert.equal(state.storage.sql.tables.migration_sources.size, 15);
}

// --- après migration, la porte d'entrée du moteur doit s'ouvrir (plus d'erreur de migration) ---
{
  const state = { storage: { sql: makeFakeSqlStorage() } };
  const coordinator = new SorealIdleCoordinatorV1(state, {});
  coordinator.importLegacyData({ players: [], catalog: [], migrationSources: makeIdleMigrationSourcesFixture() });
  const req = new Request("https://x.invalid/__soreal-idle-v1/call", {
    method: "POST",
    body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [], user: { email: "sylvain@example.com" } })
  });
  const res = await coordinator.internal(req, new URL(req.url));
  const body = await res.json();
  assert.equal(
    /SOREAL_IDLE_MIGRATION_INCOMPLETE/.test(body?.error || ""), false,
    "Une fois les 15 lignes migration_sources présentes, cette erreur précise ne doit plus jamais apparaître (le moteur peut ensuite échouer pour d'autres raisons de données de jeu manquantes, ce n'est pas ce que ce test vérifie)."
  );
}

// --- les opérations qui ne dépendent pas de la migration doivent toujours fonctionner ---
{
  const state = { storage: { sql: makeFakeSqlStorage() } };
  const coordinator = new SorealIdleCoordinatorV1(state, {});
  const req = new Request("https://x.invalid/__soreal-idle-v1/call", {
    method: "POST",
    body: JSON.stringify({ operation: "testerAccesSorealIdle", args: [], user: { email: "sylvain@example.com" } })
  });
  const res = await coordinator.internal(req, new URL(req.url));
  assert.equal(res.status, 200, "testerAccesSorealIdle ne doit jamais dépendre de la migration (vérifié dans le code source : contourne exprès la porte d'entrée).");
}

// --- la liste des opérations doit être exposée telle quelle ---
{
  const state = { storage: { sql: makeFakeSqlStorage() } };
  const coordinator = new SorealIdleCoordinatorV1(state, {});
  const req = new Request("https://x.invalid/__soreal-idle-v1/operations");
  const res = await coordinator.internal(req, new URL(req.url));
  const body = await res.json();
  assert.ok(Array.isArray(body.operations) && body.operations.includes("obtenirEtatSorealIdle"));
}

// --- remise à zéro (Norman, 2026-09-09) : "obliger chaque joueur à
// recommencer à 0... comme si c'était la première fois" — suppression
// réelle choisie explicitement par Norman.
//
// V3 — VRAIE CAUSE TROUVÉE (2026-09-10) : V1/V2 vidaient idle_players,
// une table que le moteur de jeu (runSorealIdleOperation) ne lit JAMAIS.
// La progression réelle vit dans idle_catalog, feuille "JOUEURS"
// (__idleBuildWorkbook reconstruit un classeur à partir de cette table).
// Confirmé en direct via wrangler tail : la purge V1 s'exécutait
// vraiment ("SOREAL_IDLE_RESET_ALREADY_DONE" loggé) mais le compte réel
// de Norman gardait toute sa progression - la mauvaise table était
// vidée. Doit maintenant vider idle_catalog/JOUEURS (sauf la ligne 1,
// l'en-tête de colonnes) UNE seule fois dans toute la vie du Durable
// Object, jamais les autres feuilles du même classeur (CONFIG,
// IDLE_BOSS, IDLE_ZONES... un vrai catalogue de jeu partagé), et ne
// jamais reviser une deuxième fois même si l'objet se réveille à nouveau.
{
  const tables = { idle_players: new Map(), idle_catalog: new Map(), migration_sources: new Map(), idle_meta: new Map() };

  // Premier réveil : un joueur existe déjà (ancienne progression, ligne 2
  // de la feuille JOUEURS) — doit disparaître. La ligne 1 (en-tête) et
  // les autres feuilles du catalogue partagé doivent survivre.
  tables.idle_catalog.set("JOUEURS|1", ["JOUEURS", 1, JSON.stringify(["id", "nom", "email"]), Date.now()]);
  tables.idle_catalog.set("JOUEURS|2", ["JOUEURS", 2, JSON.stringify(["1", "Norman", "norman@example.com"]), Date.now()]);
  tables.idle_catalog.set("IDLE_BOSS|1", ["IDLE_BOSS", 1, JSON.stringify(["nom", "pv"]), Date.now()]);
  tables.idle_players.set("norman@example.com", ["1", "Norman", "norman@example.com", "norman@example.com", "[]", 2, Date.now()]);

  const state1 = { storage: { sql: makeFakeSqlStorage(tables) } };
  new SorealIdleCoordinatorV1(state1, {});
  assert.equal(tables.idle_players.size, 0, "idle_players (héritée) doit aussi être vidée par prudence.");
  assert.ok(!tables.idle_catalog.has("JOUEURS|2"), "La vraie progression du joueur (feuille JOUEURS, ligne >1) doit disparaître.");
  assert.ok(tables.idle_catalog.has("JOUEURS|1"), "L'en-tête de colonnes de la feuille JOUEURS (ligne 1) ne doit jamais être supprimé.");
  assert.ok(tables.idle_catalog.has("IDLE_BOSS|1"), "Les autres feuilles du catalogue partagé (boss, zones...) ne doivent jamais être touchées.");
  assert.ok(tables.idle_meta.has("reset_fresh_start_v3"), "Un marqueur doit empêcher toute nouvelle purge future.");

  // Un joueur relance le jeu après la remise à zéro (nouvelle ligne créée normalement).
  tables.idle_catalog.set("JOUEURS|2", ["JOUEURS", 2, JSON.stringify(["1", "Norman", "norman@example.com"]), Date.now()]);

  // Deuxième réveil du même Durable Object (même stockage partagé) : ne doit JAMAIS repurger.
  const state2 = { storage: { sql: makeFakeSqlStorage(tables) } };
  new SorealIdleCoordinatorV1(state2, {});
  assert.ok(tables.idle_catalog.has("JOUEURS|2"), "Une deuxième instanciation ne doit jamais reproduire la purge (garde idle_meta respectée).");
}

// --- remise à zéro sur une instance restée "chaude" depuis avant le
// déploiement (Norman : "ça n'a pas reset ma partie") : le constructeur
// d'un Durable Object déjà en mémoire ne se rejoue jamais tout seul —
// internal() doit donc lui aussi déclencher la purge, dès la toute
// première requête réelle qu'il traite après le déploiement.
{
  const tables = { idle_players: new Map(), idle_catalog: new Map(), migration_sources: new Map(), idle_meta: new Map() };
  tables.idle_catalog.set("JOUEURS|1", ["JOUEURS", 1, JSON.stringify(["id", "nom", "email"]), Date.now()]);
  tables.idle_catalog.set("JOUEURS|2", ["JOUEURS", 2, JSON.stringify(["1", "Norman", "norman@example.com"]), Date.now()]);

  const state = { storage: { sql: makeFakeSqlStorage(tables) } };
  const coordinator = new SorealIdleCoordinatorV1(state, {});
  // Le constructeur a déjà purgé (instance froide simulée) — on simule
  // maintenant une instance restée chaude en effaçant le marqueur, comme
  // si ce process n'avait jamais exécuté le nouveau constructeur.
  tables.idle_meta.delete("reset_fresh_start_v3");
  tables.idle_catalog.set("JOUEURS|2", ["JOUEURS", 2, JSON.stringify(["1", "Norman", "norman@example.com"]), Date.now()]);

  const req = new Request("https://x.invalid/__soreal-idle-v1/operations");
  await coordinator.internal(req, new URL(req.url));
  assert.ok(!tables.idle_catalog.has("JOUEURS|2"), "internal() doit lui-même déclencher la purge si le marqueur est absent, sans attendre une reconstruction de l'objet.");
}

console.log("idle-coordinator-migration: OK");
