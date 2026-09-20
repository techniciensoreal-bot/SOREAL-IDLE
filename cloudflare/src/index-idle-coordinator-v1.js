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

const IDLE_LAUNCH_TICKET_TTL_MS_V1 = 90 * 1000;
const IDLE_SESSION_TTL_MS_V1 = 8 * 60 * 60 * 1000;

function normalizeIdleLaunchUserV1(user) {
  if (!user || typeof user !== "object") return null;
  const emails = [...new Set(
    [user.email, user.emailConnexion]
      .concat(Array.isArray(user.emails) ? user.emails : [])
      .map(value => String(value || "").trim().toLowerCase())
      .filter(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  )].slice(0, 10);
  const email = String(user.email || emails[0] || "").trim().toLowerCase();
  const emailConnexion = String(user.emailConnexion || email || emails[0] || "").trim().toLowerCase();
  const prenom = sv(user.prenom || user.firstName || "");
  const name = sv(user.name || user.displayName || prenom);
  const role = sv(user.role || user.type || "");
  if (!email && !emailConnexion && !emails.length && !prenom && !name) return null;
  return { email, emailConnexion, emails, prenom, name, role };
}

function idleOpaqueTokenV1(prefix) {
  return String(prefix || "idle") + "_" +
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "");
}


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

    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS idle_launch_tickets (" +
      "ticket TEXT PRIMARY KEY,user_json TEXT NOT NULL,source TEXT NOT NULL DEFAULT ''," +
      "created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,consumed_at INTEGER)"
    );
    this.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_launch_tickets_expires ON idle_launch_tickets(expires_at)");
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS idle_sessions (" +
      "session_token TEXT PRIMARY KEY,user_json TEXT NOT NULL,created_at INTEGER NOT NULL," +
      "expires_at INTEGER NOT NULL,revoked_at INTEGER)"
    );
    this.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_sessions_expires ON idle_sessions(expires_at)");

    /*
     * La remise à zéro ponctuelle demandée par Norman le 2026-09-09
     * ("il faut que tu obliges chaque joueur à recommencer à 0") a été
     * exécutée une seule fois — le marqueur idle_meta.reset_fresh_start_v3
     * est déjà posé en production, avec de vraies progressions de joueurs
     * vivantes depuis. Un audit externe (2026-09-17) a signalé à juste
     * titre qu'un code de purge encore présent, même gardé par ce
     * marqueur, reste un risque structurel si jamais ce marqueur
     * disparaissait (anomalie de stockage). Migration définitivement
     * consommée : le code de purge est retiré du chemin normal plutôt
     * que laissé "au cas où" — voir l'historique git pour resetAllPlayersOnceV1
     * si une future migration similaire est nécessaire.
     */
  }

  sqlAll(query, ...bindings) {
    return sqlRows(this.sql.exec(query, ...bindings));
  }

  pruneStandaloneAuthV1(now = Date.now()) {
    const cutoff = Number(now) || Date.now();
    this.sql.exec("DELETE FROM idle_launch_tickets WHERE expires_at<?", cutoff);
    this.sql.exec("DELETE FROM idle_sessions WHERE expires_at<? OR revoked_at IS NOT NULL", cutoff);
  }

  createLaunchTicketV1(payload) {
    const user = normalizeIdleLaunchUserV1(payload?.user);
    if (!user) return { ok: false, error: "IDLE_LAUNCH_USER_REQUIRED" };

    /*
     * Le ticket ne doit jamais élargir l'accès au jeu : on réutilise la
     * même allowlist et le même contrat que le chemin historique.
     * Le jeton fourni ici est uniquement un marqueur non vide ; l'identité
     * autoritaire vient de user, déjà vérifié par APP/TV avant l'appel.
     */
    const access = runSorealIdleOperation(
      this.sql,
      "obtenirAccesSorealIdle",
      ["launch-ticket"],
      user
    );
    if (!access?.ok || !access?.autorise) {
      return { ok: false, error: "SOREAL_IDLE_ACCES_REFUSE" };
    }

    const now = Date.now();
    this.pruneStandaloneAuthV1(now);
    const ticket = idleOpaqueTokenV1("ilt");
    const expiresAt = now + IDLE_LAUNCH_TICKET_TTL_MS_V1;
    this.sql.exec(
      "INSERT INTO idle_launch_tickets(ticket,user_json,source,created_at,expires_at,consumed_at) VALUES(?,?,?,?,?,NULL)",
      ticket,
      JSON.stringify(user),
      sv(payload?.source).toLowerCase(),
      now,
      expiresAt
    );
    return {
      ok: true,
      ticket,
      expiresAt,
      protocolVersion: access.protocolVersion
    };
  }

  consumeLaunchTicketV1(ticketValue) {
    const ticket = sv(ticketValue);
    if (!ticket) return { ok: false, error: "LAUNCH_TICKET_REQUIRED" };

    const now = Date.now();
    const row = this.sqlAll(
      "SELECT ticket,user_json,source,created_at,expires_at,consumed_at FROM idle_launch_tickets WHERE ticket=?",
      ticket
    )[0];
    if (!row) return { ok: false, error: "LAUNCH_TICKET_INVALID" };
    if (row.consumed_at != null) return { ok: false, error: "LAUNCH_TICKET_USED" };
    if (Number(row.expires_at || 0) < now) {
      this.sql.exec("DELETE FROM idle_launch_tickets WHERE ticket=?", ticket);
      return { ok: false, error: "LAUNCH_TICKET_EXPIRED" };
    }

    this.sql.exec(
      "UPDATE idle_launch_tickets SET consumed_at=? WHERE ticket=? AND consumed_at IS NULL",
      now,
      ticket
    );

    const sessionToken = idleOpaqueTokenV1("ils");
    const expiresAt = now + IDLE_SESSION_TTL_MS_V1;
    this.sql.exec(
      "INSERT INTO idle_sessions(session_token,user_json,created_at,expires_at,revoked_at) VALUES(?,?,?,?,NULL)",
      sessionToken,
      String(row.user_json || "{}"),
      now,
      expiresAt
    );
    this.pruneStandaloneAuthV1(now);

    return {
      ok: true,
      sessionToken,
      expiresAt
    };
  }

  standaloneSessionV1(sessionTokenValue) {
    const sessionToken = sv(sessionTokenValue);
    if (!sessionToken) return { ok: false, error: "IDLE_SESSION_REQUIRED" };
    const now = Date.now();
    const row = this.sqlAll(
      "SELECT session_token,user_json,created_at,expires_at,revoked_at FROM idle_sessions WHERE session_token=?",
      sessionToken
    )[0];
    if (!row || row.revoked_at != null) return { ok: false, error: "IDLE_SESSION_INVALID" };
    if (Number(row.expires_at || 0) < now) {
      this.sql.exec("DELETE FROM idle_sessions WHERE session_token=?", sessionToken);
      return { ok: false, error: "IDLE_SESSION_EXPIRED" };
    }
    let user = null;
    try { user = JSON.parse(String(row.user_json || "{}")); } catch (_) {}
    if (!user || typeof user !== "object") return { ok: false, error: "IDLE_SESSION_INVALID" };
    return { ok: true, user, expiresAt: Number(row.expires_at || 0) };
  }

  runStandaloneSessionOperationV1(payload) {
    const session = this.standaloneSessionV1(payload?.sessionToken);
    if (!session.ok) {
      const error = new Error(session.error);
      error.code = session.error;
      throw error;
    }
    return runSorealIdleOperation(
      this.sql,
      sv(payload?.operation),
      Array.isArray(payload?.args) ? payload.args : [],
      session.user
    );
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
   *
   * Garde-fou (audit externe 2026-09-17, confirmé en lisant le code) :
   * avant cette correction, un payload avec `sheets` valide mais
   * `catalog` vide ou mal formé (aucune ligne ne matchait une feuille
   * demandée) supprimait quand même tout le contenu existant de cette
   * feuille puis renvoyait `ok:true, inserted:0` — un vidage silencieux
   * déguisé en succès. Le nombre de lignes valides par feuille demandée
   * est maintenant compté AVANT toute suppression ; si une feuille
   * demandée n'a AUCUNE ligne valide dans `catalog`, tout l'appel est
   * refusé (rien n'est supprimé nulle part) sauf si l'appelant passe
   * explicitement `confirmPurge:true` (vidage volontaire assumé, jamais
   * le défaut).
   */
  replaceCatalogSheets(payload) {
    const sheets = Array.isArray(payload?.sheets)
      ? [...new Set(payload.sheets.map(s => String(s || "").trim()).filter(Boolean))]
      : [];
    const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
    if (!sheets.length) return { ok: false, error: "SHEETS_REQUIRED" };

    const validRows = catalog.filter(row => {
      const sheetName = String(row?.sheet_name || "").trim();
      return sheetName && row.row_index != null && sheets.includes(sheetName);
    });
    const confirmPurge = payload?.confirmPurge === true;
    if (!confirmPurge) {
      const emptySheets = sheets.filter(sheetName => !validRows.some(row => String(row.sheet_name).trim() === sheetName));
      if (emptySheets.length) {
        return { ok: false, error: "EMPTY_REPLACEMENT_REFUSED", emptySheets };
      }
    }

    let deleted = 0;
    for (const sheetName of sheets) {
      const before = this.sqlAll("SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name=?", sheetName)[0]?.n || 0;
      this.sql.exec("DELETE FROM idle_catalog WHERE sheet_name=?", sheetName);
      deleted += before;
    }

    let inserted = 0;
    for (const row of validRows) {
      const sheetName = String(row.sheet_name).trim();
      const rowJson = Array.isArray(row.row_json) ? JSON.stringify(row.row_json) : String(row.row_json || "[]");
      this.sql.exec(
        "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(sheet_name,row_index) DO UPDATE SET row_json=excluded.row_json,updated_at=excluded.updated_at",
        sheetName, row.row_index, rowJson, row.updated_at || Date.now()
      );
      inserted++;
    }
    return { ok: true, sheets, deleted, inserted };
  }

  /*
   * Lecture seule (aucune écriture) — nécessaire pour connaître l'ordre
   * exact des colonnes déjà en place dans une feuille (ex: IDLE_ZONES,
   * dont la ligne 1 existante ne doit jamais être écrasée par
   * importLegacyData) avant d'y ajouter de nouvelles lignes sans rien
   * décaler ni corrompre.
   */
  readCatalogSheet(sheetName) {
    const name = String(sheetName || "").trim();
    if (!name) return { ok: false, error: "SHEET_NAME_REQUIRED" };
    const rows = this.sqlAll(
      "SELECT row_index,row_json FROM idle_catalog WHERE sheet_name=? ORDER BY row_index",
      name
    );
    return {
      ok: true,
      sheet: name,
      rows: rows.map(r => ({ row_index: r.row_index, row: JSON.parse(r.row_json || "[]") }))
    };
  }

  async internal(request, url) {
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
    if (path === "/__soreal-idle-v1/launch-ticket-create") {
      const p = await request.json().catch(() => ({}));
      try {
        const result = this.createLaunchTicketV1(p);
        const status = result.ok ? 200 : result.error === "IDLE_LAUNCH_USER_REQUIRED" ? 400 : 403;
        return Response.json(result, { status, headers: { "cache-control": "no-store" } });
      } catch (error) {
        const message = sv(error?.message || error) || "IDLE_LAUNCH_TICKET_FAILED";
        return Response.json({ ok: false, error: message }, { status: 400, headers: { "cache-control": "no-store" } });
      }
    }
    if (path === "/__soreal-idle-v1/launch-ticket-consume") {
      const p = await request.json().catch(() => ({}));
      const result = this.consumeLaunchTicketV1(p?.ticket);
      return Response.json(result, {
        status: result.ok ? 200 : 401,
        headers: { "cache-control": "no-store" }
      });
    }
    if (path === "/__soreal-idle-v1/session-call") {
      const p = await request.json().catch(() => ({}));
      try {
        const result = this.runStandaloneSessionOperationV1(p);
        return Response.json(result, { headers: { "cache-control": "no-store" } });
      } catch (error) {
        const message = sv(error?.code || error?.message || error) || "SOREAL_IDLE_OPERATION_FAILED";
        const status = message.startsWith("IDLE_SESSION_") ? 401 : 400;
        return Response.json({ ok: false, error: message, message }, { status, headers: { "cache-control": "no-store" } });
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
    if (path === "/__soreal-idle-v1/read-sheet") {
      const p = await request.json().catch(() => ({}));
      return Response.json(this.readCatalogSheet(p?.sheet), { headers: { "cache-control": "no-store" } });
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
