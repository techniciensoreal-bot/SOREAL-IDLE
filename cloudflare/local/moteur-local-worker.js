/*
 * Moteur du jeu dans la page (Norman, 2026-10-19 : « je veux que le jeu soit totalement local »). Web Worker : le MÊME moteur que le serveur
 * (SorealIdleCoordinatorV1 + runSorealIdleOperation) sur une base SQLite en mémoire (sql.js). Construit en un seul fichier par
 * cloudflare/tools/build-moteur-local.mjs → public/moteur-local-worker-v1.js.
 * Messages reçus : { id, type: "init", export } puis { id, type: "appel", operation, args, catalogHashes, langue } et { id, type: "etat" }.
 * Réponses : { id, ok, resultat | erreur }.
 */
import initSqlJs from "sql.js/dist/sql-wasm-browser.js";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { assurerTableProfilsIdleV1 } from "../src/idle-profile-v1.js";

let db = null;
let coord = null;
let sql = null;
let jeton = "";
let versionLocale = 0;
let sortant = { flux: [], gains: [] };

function creerSql(base) {
  return {
    exec(q, ...b) {
      const st = base.prepare(q);
      try {
        if (b.length) st.bind(b);
        const out = [];
        while (st.step()) out.push(st.getAsObject());
        return out;
      } finally { st.free(); }
    }
  };
}

/* Événements que le serveur doit connaître pour « En direct » : insertions dans le flux et les gains d'EXP. */
function surveiller(base) {
  const brut = creerSql(base);
  return {
    exec(q, ...b) {
      const r = brut.exec(q, ...b);
      if (/^\s*INSERT INTO idle_flux\(/i.test(q)) sortant.flux.push({ at: b[0], type: b[3], donnees: b[4] });
      else if (/^\s*INSERT INTO idle_gains_exp\(/i.test(q)) sortant.gains.push({ at: b[0], operation: b[3], avant: b[4], apres: b[5] });
      return r;
    }
  };
}

async function demarrer(exp) {
  const SQL = await initSqlJs({ locateFile: () => self.__SOREAL_SQL_WASM_URL__ });
  db = new SQL.Database();
  sql = surveiller(db);
  db.run("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const maintenant = Date.now();
  for (const f of exp.feuilles) sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", f[0], f[1], f[2], maintenant);
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, exp.joueurs.entete, maintenant);
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 2, exp.joueurs.ligne, maintenant);
  assurerTableProfilsIdleV1(sql);
  for (const p of exp.profils || []) {
    sql.exec("INSERT OR REPLACE INTO idle_profiles(email,pseudo,pseudo_key,externe,google_name,prenom,first_seen,updated_at) VALUES(?,?,?,?,?,?,?,?)",
      p.email, p.pseudo || "", p.pseudo_key || "", p.externe || 0, p.google_name || "", p.prenom || "", p.first_seen || 0, p.updated_at || 0);
  }
  const tk = coord.createLaunchTicketV1({ source: "tv", user: exp.user });
  if (!tk || !tk.ok) throw new Error("LOCAL_TICKET_REFUSE");
  jeton = coord.consumeLaunchTicketV1(tk.ticket).sessionToken;
  /* Le ticket normalise l'identité (il perd par exemple la partie choisie, A ou B) : on remet celle de la session du serveur, telle quelle. */
  sql.exec("UPDATE idle_sessions SET user_json=? WHERE session_token=?", JSON.stringify(exp.user), jeton);
  sortant = { flux: [], gains: [] };
  return { jeton };
}

/* Ligne du joueur telle que le moteur l'a laissée (pour l'envoi au serveur). */
function ligneJoueur() {
  const r = sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=2")[0];
  return r ? JSON.parse(r.row_json) : null;
}

self.onmessage = async (ev) => {
  const m = ev.data || {};
  try {
    if (m.type === "init") {
      self.__SOREAL_SQL_WASM_URL__ = m.wasmUrl;
      const r = await demarrer(m.export);
      self.postMessage({ id: m.id, ok: true, resultat: r });
    } else if (m.type === "appel") {
      const debut = Date.now();
      const res = coord.runStandaloneSessionOperationV1({ sessionToken: jeton, operation: m.operation, args: Array.isArray(m.args) ? m.args : [], catalogHashes: m.catalogHashes, langue: m.langue });
      if (res && res.joueur && typeof res.joueur === "object" && !Object.isFrozen(res.joueur)) res.joueur.__serveurAtV1 = Math.max(debut, versionLocale + 1);
      versionLocale = Math.max(debut, versionLocale + 1);
      self.postMessage({ id: m.id, ok: true, resultat: res });
    } else if (m.type === "sortant") {
      const out = { cells: ligneJoueur(), flux: sortant.flux, gains: sortant.gains };
      if (m.vider) sortant = { flux: [], gains: [] };
      self.postMessage({ id: m.id, ok: true, resultat: out });
    }
  } catch (e) {
    self.postMessage({ id: m.id, ok: false, erreur: String((e && (e.code || e.message)) || e) });
  }
};
