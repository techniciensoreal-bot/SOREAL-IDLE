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
import { spansActiver, spansPrelever, SPANS_V1 } from "../src/idle-spans-v1.js";
import { validerFichierPartieV1, preparerLignePartieV1 } from "../src/idle-partie-fichier-v1.js";
import { assurerTextesV1, invaliderCacheTextesBossV1 } from "../src/idle-textes-v1.js";
import { invaliderTrajectoireV1 } from "../src/idle-runtime-etat.js";

/*
 * HEURE DU SERVEUR : le moteur lit l'heure par Date.now() et new Date(). Dans ce Worker elles valent l'horloge de l'appareil + l'écart mesuré avec le serveur (envoyé par la page à chaque
 * message) : une horloge d'appareil avancée ou reculée n'a aucun effet sur le temps hors ligne, les récompenses du jour, les échéances ni les chronos.
 */
let ecartMs = 0;
const DateReelle = Date;
class DateServeur extends DateReelle {
  constructor(...a) {
    if (a.length === 0) super(DateReelle.now() + ecartMs);
    else super(...a);
  }
  static now() { return DateReelle.now() + ecartMs; }
}
self.Date = DateServeur;
function regler(ecart) { if (Number.isFinite(ecart)) ecartMs = ecart; }

let db = null;
let coord = null;
let sql = null;
let jeton = "";
let versionLocale = 0;
let sortant = { flux: [], gains: [] };
/* Chaque événement de la file porte un numéro croissant (n) : l'accusé du serveur dit « jusqu'au numéro N » et ne retire jamais un événement arrivé après l'envoi, même si les réponses arrivent dans le désordre (audit anti-rollback R1, 2026-10-21). */
let seqFlux = 0;
let seqGains = 0;

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
      if (/^\s*INSERT INTO idle_flux\(/i.test(q)) sortant.flux.push({ at: b[0], type: b[3], donnees: b[4], n: ++seqFlux });
      else if (/^\s*INSERT INTO idle_gains_exp\(/i.test(q)) sortant.gains.push({ at: b[0], operation: b[3], avant: b[4], apres: b[5], n: ++seqGains });
      return r;
    }
  };
}

/* Textes modifiés par l'administrateur (chroniques de boss…) : la table du moteur local est REMPLACÉE par celle du serveur ; le cache des chroniques est vidé pour que le prochain état les montre. */
function remplacerTextes(textes) {
  assurerTextesV1(sql);
  sql.exec("DELETE FROM idle_textes");
  for (const t of Array.isArray(textes) ? textes : []) sql.exec("INSERT OR REPLACE INTO idle_textes(cle,json,maj) VALUES(?,?,?)", String(t[0]), String(t[1]), Number(t[2]) || 0);
  invaliderCacheTextesBossV1();
}

async function demarrer(exp) {
  const SQL = await initSqlJs({ locateFile: () => self.__SOREAL_SQL_WASM_URL__ });
  db = new SQL.Database();
  sql = surveiller(db);
  db.run("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  coord.__modeLocalV1 = true;   // pas de revendication « __serveur__ » dans la base locale
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const maintenant = Date.now();
  for (const f of exp.feuilles) sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", f[0], f[1], f[2], maintenant);
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, exp.joueurs.entete, maintenant);
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 2, exp.joueurs.ligne, maintenant);
  assurerTableProfilsIdleV1(sql);
  remplacerTextes(exp.textes);
  for (const p of exp.profils || []) {
    sql.exec("INSERT OR REPLACE INTO idle_profiles(email,pseudo,pseudo_key,externe,google_name,prenom,first_seen,updated_at) VALUES(?,?,?,?,?,?,?,?)",
      p.email, p.pseudo || "", p.pseudo_key || "", p.externe || 0, p.google_name || "", p.prenom || "", p.first_seen || 0, p.updated_at || 0);
  }
  const tk = coord.createLaunchTicketV1({ source: "tv", user: exp.user });
  if (!tk || !tk.ok) throw new Error("LOCAL_TICKET_REFUSE");
  jeton = coord.consumeLaunchTicketV1(tk.ticket).sessionToken;
  /* Le ticket normalise l'identité (il perd par exemple la partie choisie, A ou B) : on remet celle de la session du serveur, telle quelle. */
  sql.exec("UPDATE idle_sessions SET user_json=? WHERE session_token=?", JSON.stringify(exp.user), jeton);
  sortant = { flux: ((exp.reprise && exp.reprise.flux) || []).map((e) => Object.assign({}, e, { n: ++seqFlux })), gains: ((exp.reprise && exp.reprise.gains) || []).map((e) => Object.assign({}, e, { n: ++seqGains })) };   // événements d'une session précédente pas encore reçus par le serveur
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
      regler(m.ecart);
      const r = await demarrer(m.export);
      self.postMessage({ id: m.id, ok: true, resultat: r });
    } else if (m.type === "importer") {
      /* Chargement d'une partie : identité du compte conservée, dates décalées (aucun temps hors ligne), vérifié par une synchro ; la ligne d'avant est remise si le moteur refuse la partie. */
      const v = validerFichierPartieV1(m.fichier);
      if (!v.ok) { self.postMessage({ id: m.id, ok: true, resultat: { ok: false, erreur: v.erreur } }); return; }
      const avant = ligneJoueur();
      const maintenant = Date.now();
      const prep = preparerLignePartieV1(avant, m.fichier, maintenant);
      const ecrire = (cells) => sql.exec("UPDATE idle_catalog SET row_json=?,updated_at=? WHERE sheet_name='JOUEURS' AND row_index=2", JSON.stringify(cells), Date.now());
      ecrire(prep.cells);
      invaliderTrajectoireV1();
      try {
        const essai = coord.runStandaloneSessionOperationV1({ sessionToken: jeton, operation: "synchroniserSorealIdle", args: [jeton], langue: "fr" });
        if (!essai || essai.ok === false) throw new Error("ETAT_REFUSE");
      } catch (e) {
        ecrire(avant);
        invaliderTrajectoireV1();
        self.postMessage({ id: m.id, ok: true, resultat: { ok: false, erreur: "ETAT_REFUSE", detail: String((e && e.message) || e).slice(0, 120) } });
        return;
      }
      versionLocale = Math.max(Date.now(), versionLocale + 1);
      self.postMessage({ id: m.id, ok: true, resultat: { ok: true, decalees: prep.decalees, delta: prep.delta } });
    } else if (m.type === "textes") {
      remplacerTextes(m.textes);
      self.postMessage({ id: m.id, ok: true, resultat: true });
    } else if (m.type === "spans") {
      spansActiver(m.actif);
      self.postMessage({ id: m.id, ok: true, resultat: true });
    } else if (m.type === "appel") {
      regler(m.ecart);
      const debut = Date.now();
      /* Temps réels (horloge de l'appareil, commune à la page) pour le journal de fluidité : début du calcul, durée, fin. */
      const reelDebut = performance.timeOrigin + performance.now();
      const res = coord.runStandaloneSessionOperationV1({ sessionToken: jeton, operation: m.operation, args: Array.isArray(m.args) ? m.args : [], catalogHashes: m.catalogHashes, langue: m.langue });
      if (res && res.joueur && typeof res.joueur === "object" && !Object.isFrozen(res.joueur)) res.joueur.__serveurAtV1 = Math.max(debut, versionLocale + 1);
      versionLocale = Math.max(debut, versionLocale + 1);
      const reelFin = performance.timeOrigin + performance.now();
      self.postMessage({ id: m.id, ok: true, resultat: res, mesure: { debut: reelDebut, calcul: reelFin - reelDebut, fin: reelFin, spans: SPANS_V1.actif ? spansPrelever() : undefined } });
    } else if (m.type === "sortant") {
      /* Copie : les événements restent en file tant que le serveur ne les a pas acquittés (message « acquitter »). */
      const out = { cells: ligneJoueur(), flux: sortant.flux.slice(), gains: sortant.gains.slice(), instant: Date.now() };
      if (m.vider) sortant = { flux: [], gains: [] };
      self.postMessage({ id: m.id, ok: true, resultat: out });
    } else if (m.type === "acquitter") {
      /* Accusé par numéro : seuls les événements numérotés jusqu'à N (ceux de l'envoi acquitté) quittent la file. */
      const jf = Number(m.fluxJusqua), jg = Number(m.gainsJusqua);
      if (Number.isFinite(jf)) sortant.flux = sortant.flux.filter((e) => !(e.n <= jf));
      if (Number.isFinite(jg)) sortant.gains = sortant.gains.filter((e) => !(e.n <= jg));
      self.postMessage({ id: m.id, ok: true, resultat: true });
    }
  } catch (e) {
    self.postMessage({ id: m.id, ok: false, erreur: String((e && (e.code || e.message)) || e) });
  }
};
