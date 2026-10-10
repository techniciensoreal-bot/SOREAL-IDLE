import { sqlRows } from "./core/sqlite-core.js";
import { runSorealIdleOperation, idleOperationNames } from "./idle-sqlite-runtime.js";
import { profilsParEmailIdleV1, libelleJoueurIdleV1 } from "./idle-profile-v1.js";
import { allegerCataloguesV1 } from "./idle-catalogues-v1.js";
import { traduireReponseV1 } from "./idle-traductions-v1.js";

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
/* Session d'un joueur connecté par Google (hors APP / TV) : il revient sans se reconnecter à chaque fois. */
const IDLE_GOOGLE_SESSION_TTL_MS_V1 = 14 * 24 * 60 * 60 * 1000;

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
  /* idleTrophee : posé par le Worker TV (trophée « Assiduité de bronze » débloqué) ; seul un booléen vrai est conservé. */
  return { email, emailConnexion, emails, prenom, name, role, idleTrophee: user.idleTrophee === true };
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
    // __idleCommit supprime/relit idle_players par source_row à chaque écriture de la feuille JOUEURS.
    this.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_players_source_row ON idle_players(source_row)");
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS idle_catalog (" +
      "sheet_name TEXT NOT NULL,row_index INTEGER NOT NULL,row_json TEXT NOT NULL,updated_at INTEGER NOT NULL," +
      "PRIMARY KEY(sheet_name, row_index))"
    );
    // Index redondant : identique à la clé primaire (sheet_name,row_index) de idle_catalog.
    this.sql.exec("DROP INDEX IF EXISTS idx_idle_catalog_sheet");
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

  /*
   * Connexion par Google (2026-09-26, Norman : SOREAL IDLE jouable sans APP / TV). Appelée UNIQUEMENT par le Worker, après vérification du jeton d'identité Google
   * (idle-google-auth-v1.js) : l'adresse reçue est donc déjà celle d'un compte Google vérifié. L'utilisateur de la session porte le drapeau `externe`, que seul ce
   * chemin peut poser (normalizeIdleLaunchUserV1 le retire des tickets APP / TV). Le droit de jouer est décidé à chaque appel par le moteur (accès public ouvert
   * par l'administrateur, ou adresse de l'administrateur).
   */
  createGoogleSessionV1(payload) {
    const email = sv(payload?.email).toLowerCase();
    if (!email || !email.includes("@")) return { ok: false, error: "IDLE_GOOGLE_USER_REQUIRED" };
    const user = {
      email,
      emailConnexion: email,
      emails: [email],
      prenom: "Joueur",
      name: sv(payload?.nom).slice(0, 80),
      role: "externe",
      externe: true,
      idleTrophee: false
    };
    const now = Date.now();
    this.pruneStandaloneAuthV1(now);
    const sessionToken = idleOpaqueTokenV1("ils");
    const expiresAt = now + IDLE_GOOGLE_SESSION_TTL_MS_V1;
    this.sql.exec(
      "INSERT INTO idle_sessions(session_token,user_json,created_at,expires_at,revoked_at) VALUES(?,?,?,?,NULL)",
      sessionToken,
      JSON.stringify(user),
      now,
      expiresAt
    );
    /*
     * Au plus 10 sessions actives par adresse (audit du 2026-10-10, IDLE-AUDIT-SEC-009) : chaque connexion Google ouvrait une session de 14 jours sans plafond, y compris pour une adresse non autorisée ; la table pouvait grossir
     * à volonté et un jeton volé restait valable aussi longtemps que d'autres. Les plus anciennes sont révoquées.
     */
    const actives = this.sqlAll(
      "SELECT session_token FROM idle_sessions WHERE revoked_at IS NULL AND json_extract(user_json,'$.email')=? ORDER BY created_at DESC, rowid DESC",
      email
    );
    for (const ancienne of actives.slice(10)) {
      this.sql.exec("UPDATE idle_sessions SET revoked_at=? WHERE session_token=?", now, ancienne.session_token);
    }
    return { ok: true, sessionToken, expiresAt };
  }

  revokeSessionV1(sessionTokenValue) {
    const sessionToken = sv(sessionTokenValue);
    if (!sessionToken) return { ok: false, error: "IDLE_SESSION_REQUIRED" };
    this.sql.exec("UPDATE idle_sessions SET revoked_at=? WHERE session_token=?", Date.now(), sessionToken);
    return { ok: true };
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
    const operation = sv(payload?.operation);
    const args = Array.isArray(payload?.args) ? payload.args : [];

    /* Réponse allégée des catalogues que le client a déjà (idle-catalogues-v1.js) : même contrat, moins d'octets. */
    /* Langue des items et des textes (idle-traductions-v1.js) : traduction de la réponse AVANT l'allègement, donc l'empreinte des catalogues dépend de la langue. */
    return allegerCataloguesV1(traduireReponseV1(runSorealIdleOperation(
      this.sql,
      operation,
      args,
      session.user
    ), payload?.langue), payload?.catalogHashes);
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
      /* Vidage volontaire (remplacement par rien, confirmé) : la restauration depuis legacy_rows ne doit pas ressusciter cette feuille (IDLE-AUDIT-SEC-014). */
      if (confirmPurge && !validRows.some(row => String(row.sheet_name).trim() === sheetName)) {
        this.sql.exec(
          "INSERT INTO idle_meta(meta_key,meta_value) VALUES(?,?) ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value",
          "catalogue_purge:" + sheetName,
          String(Date.now())
        );
      }
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
    /* Noms vus des autres joueurs externes (Google) : leur pseudo, sinon le prénom de leur compte Google (ITOPOD : les joueurs sont des ennemis, Norman 2026-10-04). Jamais d'adresse e-mail. */
    if (path === "/__soreal-idle-v1/noms-joueurs") {
      const noms = [];
      try {
        for (const profil of profilsParEmailIdleV1(this.sql).values()) {
          if (!profil.externe) continue;
          const nom = String(libelleJoueurIdleV1(profil, "") || "").trim().slice(0, 40);
          if (nom && !nom.includes("@") && nom.toLowerCase() !== "joueur" && !noms.includes(nom)) noms.push(nom);
        }
      } catch (_e) { /* pas de liste */ }
      return Response.json({ ok: true, noms }, { headers: { "cache-control": "no-store" } });
    }
    if (path === "/__soreal-idle-v1/launch-ticket-consume") {
      const p = await request.json().catch(() => ({}));
      const result = this.consumeLaunchTicketV1(p?.ticket);
      return Response.json(result, {
        status: result.ok ? 200 : 401,
        headers: { "cache-control": "no-store" }
      });
    }
    if (path === "/__soreal-idle-v1/google-session-create") {
      const p = await request.json().catch(() => ({}));
      const result = this.createGoogleSessionV1(p);
      return Response.json(result, { status: result.ok ? 200 : 400, headers: { "cache-control": "no-store" } });
    }
    if (path === "/__soreal-idle-v1/session-revoke") {
      const p = await request.json().catch(() => ({}));
      return Response.json(this.revokeSessionV1(p?.sessionToken), { headers: { "cache-control": "no-store" } });
    }
    if (path === "/__soreal-idle-v1/session-validate") {
      const p = await request.json().catch(() => ({}));
      const session = this.standaloneSessionV1(p?.sessionToken);
      return Response.json(
        session.ok
          ? { ok: true, expiresAt: session.expiresAt }
          : { ok: false, error: session.error },
        {
          status: session.ok ? 200 : 401,
          headers: { "cache-control": "no-store" }
        }
      );
    }
    if (path === "/__soreal-idle-v1/session-call") {
      const p = await request.json().catch(() => ({}));
      try {
        /* Instant où le moteur commence à calculer : l'état renvoyé (barres, niveaux, Or) est celui de CET instant, pas celui de la réception (une synchro de 1 à 2 s en production). Le client en déduit l'âge exact de l'état (voir standalone-bridge.js, calerRecuPerfV1_). Ajouté à la réponse seulement, jamais à l'état du moteur (le mémo des bonus ne doit voir aucun champ horodaté). */
        const debutCalculMsV1 = Date.now();
        const result = this.runStandaloneSessionOperationV1(p);
        if (result && result.joueur && typeof result.joueur === "object" && !Object.isFrozen(result.joueur)) result.joueur.__serveurAtV1 = debutCalculMsV1;
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
