import { sqlRows } from "./core/sqlite-core.js";
import { runSorealIdleOperation, idleOperationNames } from "./idle-sqlite-runtime.js";

/*
 * SOREAL — Idle Coordinator (Durable Object dédié, 2026-09-09).
 *
 * Étape 3 du découpage du Durable Object unique. Contrairement au chat
 * (étape 2), SOREAL IDLE s'est avéré être le domaine le plus isolé
 * possible : runSorealIdleOperation() ne dépend que d'un handle SQLite
 * brut (jamais de personnel, profils, responsables ou autre logique de
 * l'objet principal) — vérifié en lisant l'intégralité de son point
 * d'entrée avant de commencer, pas supposé. Le moteur de jeu lui-même
 * (idle-sqlite-runtime.js et ses modules) est réutilisé tel quel, sans
 * aucune réécriture, pour éviter exactement le type de régression subi
 * à l'étape 2 (forme de réponse mal recopiée de mémoire).
 *
 * Portée : idle_players, idle_catalog, et les lignes "idle:*" de
 * migration_sources (une table jamais définie dans le code source —
 * créée manuellement lors de la migration historique hors Google
 * Sheets — mais dont runSorealIdleOperation() exige au moins 15 lignes
 * au statut DONE avant d'accepter de fonctionner). Les trois sont migrés
 * ensemble ci-dessous ; sans migration_sources, le jeu entier refuserait
 * de démarrer dans le nouvel objet.
 */

const sv = v => String(v == null ? "" : v).trim();

export class SorealIdleCoordinatorV1 {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sql = state?.storage?.sql;
    if (!this.sql) throw new Error("SQLite Durable Object indisponible (idle)");
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS idle_players (" +
      "player_key TEXT PRIMARY KEY,player_id TEXT,display_name TEXT,email_primary TEXT,email_login TEXT," +
      "state_json TEXT NOT NULL DEFAULT '[]',source_row INTEGER,updated_at INTEGER NOT NULL)"
    );
    this.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_players_email_primary ON idle_players(lower(email_primary))");
    this.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_players_email_login ON idle_players(lower(email_login))");
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS idle_catalog (" +
      "sheet_name TEXT NOT NULL,row_index INTEGER NOT NULL,row_json TEXT NOT NULL,updated_at INTEGER NOT NULL," +
      "PRIMARY KEY(sheet_name, row_index))"
    );
    this.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_catalog_sheet ON idle_catalog(sheet_name, row_index)");
    /*
     * Schéma exact confirmé en direct via une route de diagnostic
     * ponctuelle sur l'objet principal (2026-09-09) avant d'écrire cette
     * table ici — jamais deviné.
     */
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS migration_sources (" +
      "source_key TEXT PRIMARY KEY,spreadsheet_id TEXT,sheet_name TEXT,range_a1 TEXT," +
      "cursor_row INTEGER,row_count INTEGER,checksum TEXT,status TEXT,imported_at INTEGER,error TEXT)"
    );
    this.sql.exec("CREATE TABLE IF NOT EXISTS idle_meta (meta_key TEXT PRIMARY KEY, meta_value TEXT)");
    this.resetAllPlayersOnceV1();
  }

  /*
   * Remise à zéro complète (Norman, 2026-09-09) : "il faut que tu obliges
   * chaque joueur à recommencer à 0."
   *
   * V3 (2026-09-10) — VRAIE CAUSE TROUVÉE : V1 et V2 vidaient idle_players,
   * une table QUI N'EST JAMAIS LUE PAR LE MOTEUR DE JEU. runSorealIdleOperation
   * (idle-sqlite-runtime.js) reconstruit un "classeur" en mémoire à partir
   * de idle_catalog (__idleBuildWorkbook) et lit/écrit la progression
   * réelle de chaque joueur dans la feuille "JOUEURS" de CE classeur
   * (idle_catalog WHERE sheet_name='JOUEURS'), jamais dans idle_players.
   * Confirmé en direct via wrangler tail (la purge V1 s'exécutait bien,
   * "SOREAL_IDLE_RESET_ALREADY_DONE" loggé) alors que le compte réel de
   * Norman gardait sa progression à chaque nouvelle vérification —
   * la mauvaise table était vidée depuis le début.
   *
   * La ligne 1 de idle_catalog/JOUEURS est l'en-tête de colonnes
   * (trouverLigneJoueurSorealIdle_ commence toujours à la ligne 2) — donc
   * seules les lignes >1 sont supprimées ; les autres feuilles du même
   * classeur (CONFIG, IDLE_BOSS, IDLE_ZONES, etc., un vrai catalogue de
   * jeu partagé) ne sont jamais touchées.
   *
   * Appelée à la fois depuis le constructeur (instance froide) et depuis
   * internal() à chaque requête (instance restée chaude depuis avant un
   * déploiement) — rejouée volontairement, gardée par idle_meta pour
   * rester une purge UNIQUE. Jamais laissée casser une requête réelle si
   * quelque chose d'inattendu se produit.
   */
  resetAllPlayersOnceV1() {
    try {
      this.sql.exec("CREATE TABLE IF NOT EXISTS idle_meta (meta_key TEXT PRIMARY KEY, meta_value TEXT)");
      const already = this.sqlAll("SELECT meta_value FROM idle_meta WHERE meta_key='reset_fresh_start_v3'");
      if (already.length) return;
      this.sql.exec("DELETE FROM idle_players");
      this.sql.exec("DELETE FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1");
      this.sql.exec(
        "INSERT INTO idle_meta(meta_key,meta_value) VALUES('reset_fresh_start_v3', ?) ON CONFLICT(meta_key) DO NOTHING",
        String(Date.now())
      );
    } catch (_error) {
      // Ne jamais faire échouer une requête de jeu réelle à cause de la remise à zéro.
    }
  }

  sqlAll(query, ...bindings) {
    return sqlRows(this.sql.exec(query, ...bindings));
  }

  /*
   * Migration ponctuelle de l'existant depuis l'ancien objet — voir
   * OP_PREFIX+"/idle-export" côté objet principal. Idempotent
   * (ON CONFLICT DO NOTHING sur chaque clé primaire réelle) : rejouable
   * sans risque en cas d'exécution partielle, n'écrase jamais une donnée
   * de jeu déjà écrite localement après la bascule.
   */
  importLegacyData(payload) {
    const players = Array.isArray(payload?.players) ? payload.players : [];
    const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
    const migrationSources = Array.isArray(payload?.migrationSources) ? payload.migrationSources : [];
    let inserted = { players: 0, catalog: 0, migrationSources: 0 };
    for (const row of players) {
      if (!row?.player_key) continue;
      this.sql.exec(
        "INSERT INTO idle_players(player_key,player_id,display_name,email_primary,email_login,state_json,source_row,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(player_key) DO NOTHING",
        row.player_key, row.player_id, row.display_name, row.email_primary, row.email_login, row.state_json, row.source_row, row.updated_at
      );
      inserted.players++;
    }
    for (const row of catalog) {
      if (!row?.sheet_name || row.row_index == null) continue;
      this.sql.exec(
        "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(sheet_name,row_index) DO NOTHING",
        row.sheet_name, row.row_index, row.row_json, row.updated_at
      );
      inserted.catalog++;
    }
    for (const row of migrationSources) {
      if (!row?.source_key) continue;
      this.sql.exec(
        "INSERT INTO migration_sources(source_key,spreadsheet_id,sheet_name,range_a1,cursor_row,row_count,checksum,status,imported_at,error) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source_key) DO NOTHING",
        row.source_key, row.spreadsheet_id, row.sheet_name, row.range_a1, row.cursor_row, row.row_count, row.checksum, row.status, row.imported_at, row.error
      );
      inserted.migrationSources++;
    }
    return { ok: true, inserted };
  }

  /*
   * Remplacement complet d'une ou plusieurs feuilles du catalogue partagé
   * (Norman, 2026-09-15 : "j'oublie ce Google Sheet, je reprends sur le
   * wiki les vraies informations" — IDLE_LOOTS/IDLE_SETS n'ont plus de
   * source Sheet vivante depuis la bascule Cloudflare, voir
   * lireTableSorealIdle_/SpreadsheetApp dans idle-sqlite-runtime.js ; ce
   * contenu doit maintenant venir d'un fichier JSON versionné dans le
   * dépôt, source de vérité wiki).
   *
   * Contrairement à importLegacyData() (ON CONFLICT DO NOTHING, ne
   * comble que les trous), ceci VIDE chaque feuille listée dans
   * `sheets` avant d'insérer les nouvelles lignes — un vrai remplacement,
   * pas un complément. Ne touche jamais une feuille absente de `sheets`
   * (JOUEURS, CONFIG, etc. restent intacts).
   */
  replaceCatalogSheets(payload) {
    const sheets = Array.isArray(payload?.sheets)
      ? [...new Set(payload.sheets.map(s => String(s || "").trim()).filter(Boolean))]
      : [];
    const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
    if (!sheets.length) return { ok: false, error: "SHEETS_REQUIRED" };

    let deleted = 0;
    for (const sheetName of sheets) {
      const before = this.sqlAll("SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name=?", sheetName)[0]?.n || 0;
      this.sql.exec("DELETE FROM idle_catalog WHERE sheet_name=?", sheetName);
      deleted += before;
    }

    let inserted = 0;
    for (const row of catalog) {
      const sheetName = String(row?.sheet_name || "").trim();
      if (!sheetName || row.row_index == null || !sheets.includes(sheetName)) continue;
      const rowJson = Array.isArray(row.row_json) ? JSON.stringify(row.row_json) : String(row.row_json || "[]");
      this.sql.exec(
        "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(sheet_name,row_index) DO UPDATE SET row_json=excluded.row_json,updated_at=excluded.updated_at",
        sheetName, row.row_index, rowJson, row.updated_at || Date.now()
      );
      inserted++;
    }
    return { ok: true, sheets, deleted, inserted };
  }

  async internal(request, url) {
    /*
     * Norman (2026-09-09) : "ça n'a pas reset ma partie." La purge posée
     * dans le constructeur ne s'exécute que si le Durable Object est
     * reconstruit (instance froide) - or une instance déjà "chaude" avant
     * ce déploiement continue de tourner avec l'ancien code en mémoire
     * jusqu'à sa prochaine éviction naturelle, potentiellement bien après
     * le push. this.resetAllPlayersOnceV1() reste gardé par idle_meta
     * (toujours idempotent), donc l'appeler aussi ici, sur CHAQUE requête,
     * ne coûte qu'un SELECT une fois la purge faite - mais garantit qu'elle
     * se déclenche dès la toute prochaine requête réelle, peu importe
     * l'état chaud/froid de l'instance qui la sert.
     */
    this.resetAllPlayersOnceV1();
    const path = url.pathname;
    if (path === "/__soreal-idle-v1/call") {
      const p = await request.json().catch(() => ({}));
      try {
        const result = runSorealIdleOperation(this.sql, sv(p?.operation), Array.isArray(p?.args) ? p.args : [], p?.user);
        return Response.json(result, { headers: { "cache-control": "no-store" } });
      } catch (error) {
        const message = sv(error?.message || error) || "SOREAL_IDLE_OPERATION_FAILED";
        return Response.json({ ok: false, error: message, message }, { status: 400, headers: { "cache-control": "no-store" } });
      }
    }
    if (path === "/__soreal-idle-v1/operations") {
      return Response.json({ ok: true, operations: idleOperationNames() }, { headers: { "cache-control": "no-store" } });
    }
    if (path === "/__soreal-idle-v1/import") {
      const p = await request.json().catch(() => ({}));
      return Response.json(this.importLegacyData(p), { headers: { "cache-control": "no-store" } });
    }
    if (path === "/__soreal-idle-v1/replace-sheets") {
      const p = await request.json().catch(() => ({}));
      return Response.json(this.replaceCatalogSheets(p), { headers: { "cache-control": "no-store" } });
    }
    if (path === "/__soreal-idle-v1/counts") {
      return Response.json({
        ok: true,
        players: this.sqlAll("SELECT COUNT(*) AS n FROM idle_players")[0]?.n || 0,
        catalog: this.sqlAll("SELECT COUNT(*) AS n FROM idle_catalog")[0]?.n || 0,
        migrationSources: this.sqlAll("SELECT COUNT(*) AS n FROM migration_sources")[0]?.n || 0
      }, { headers: { "cache-control": "no-store" } });
    }
    return Response.json({ ok: false, error: "IDLE_ROUTE_NOT_FOUND" }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__soreal-idle-v1/")) return this.internal(request, url);
    return Response.json({ ok: false, error: "IDLE_ROUTE_NOT_FOUND" }, { status: 404 });
  }
}
