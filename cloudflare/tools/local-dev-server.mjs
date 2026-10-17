/*
 * Serveur LOCAL de développement (2026-09-25) : sert cloudflare/public tel quel et branche /api/v1/call sur le VRAI moteur (runSorealIdleOperation,
 * base SQLite en mémoire) — l'interface complète tourne donc en local, sans session ni déploiement, pour reproduire un bug ou vérifier un écran.
 *
 *   node cloudflare/tools/local-dev-server.mjs            (port 8799, variable PORT pour en changer ; LATENCE_MS=400 simule la latence réelle)
 *   puis ouvrir http://localhost:8799/, exécuter dans la console  sessionStorage.setItem('soreal_idle_session_v1','local'); location.reload()
 *
 * PARTIE_B=1 : les appels passent par le vrai coordinateur avec une session réelle et la partie B (celle des essais) préparée ; PARTIE_B_OPTIONS='{"magie":1e5,...}' = options de preparerPartieTestSorealIdle
 * (par défaut : boss 100, 1e18 d'Or, tous les systèmes débloqués). Sert à reproduire un bug de synchro (rituels, combats) avec un joueur « débloqué ».
 *
 * POST /debug/js (local uniquement) exécute du JS avec { sql, run, user, db } pour préparer un état (ex. modifier la ligne joueur).
 * Les médias R2 (images) n'existent pas en local : ils répondent 404.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const REPO = fileURLToPath(new URL("../../", import.meta.url));
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(REPO + "cloudflare/src/index-idle-coordinator-v1.js").href);
const { runSorealIdleOperation } = await import(pathToFileURL(REPO + "cloudflare/src/idle-sqlite-runtime.js").href);
const { allegerCataloguesV1 } = await import(pathToFileURL(REPO + "cloudflare/src/idle-catalogues-v1.js").href);

const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS_ = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS_]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };

let TOK = null;
if (process.env.PARTIE_B) {
  const tk = coord.createLaunchTicketV1({ source: "tv", user });
  TOK = coord.consumeLaunchTicketV1(tk.ticket).sessionToken;
  const op = (o, ...a) => coord.runStandaloneSessionOperationV1({ sessionToken: TOK, operation: o, args: [TOK, ...a] });
  op("obtenirEtatSorealIdle"); op("definirPartieDevSorealIdle", "b"); op("obtenirEtatSorealIdle");
  const options = Object.assign({ boss: 100, or: 1e18, systemes: true }, JSON.parse(process.env.PARTIE_B_OPTIONS || "{}"));
  console.log("partie B préparée :", JSON.stringify(op("preparerPartieTestSorealIdle", options).applique));
}
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png", ".m4a": "audio/mp4" };
const ROOT = REPO + "cloudflare/public";
const port = Number(process.env.PORT || 8799);

/* Images (boss, joueur, objets, zones…) : en local il n'y a pas de R2. Les routes /api/idle/media/* sont relayées vers la production (lecture seule, publiques) pour voir les vraies images ; MEDIA_PROD=0 pour couper. */
const MEDIA_PROD = process.env.MEDIA_PROD === "0" ? "" : (process.env.MEDIA_PROD || "https://soreal-idle.technicien-soreal.workers.dev");
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (MEDIA_PROD && req.method === "GET" && url.pathname.startsWith("/api/idle/media/")) {
    try {
      const r = await fetch(MEDIA_PROD + url.pathname + url.search);
      const corps = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/octet-stream", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" });
      res.end(corps);
    } catch (e) { res.writeHead(502); res.end("relais media indisponible"); }
    return;
  }
  if (url.pathname === "/api/v1/call" && req.method === "POST") {
    let corps = "";
    req.on("data", (c) => { corps += c; });
    req.on("end", () => {
      try {
        const { operation, args, catalogHashes } = JSON.parse(corps || "{}");
        const a2 = Array.isArray(args) ? args.slice() : []; if (TOK) a2[0] = TOK; const resultat = allegerCataloguesV1(TOK ? coord.runStandaloneSessionOperationV1({ sessionToken: TOK, operation, args: a2 }) : runSorealIdleOperation(sql, operation, args || [], user), catalogHashes);
        /* LATENCE_MS : simule le réseau + le serveur réel (en local tout répond en quelques ms, et les bugs de synchronisation n'apparaissent jamais). */
        const corpsReponse = JSON.stringify(resultat);
        setTimeout(() => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(corpsReponse);
        }, Math.max(0, Number(process.env.LATENCE_MS) || 0));
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    });
    return;
  }
  if (url.pathname === "/debug/js" && req.method === "POST") {
    let corps = "";
    req.on("data", (c) => { corps += c; });
    req.on("end", async () => {
      try {
        const fn = new Function("sql", "run", "user", "db", "return (async()=>{" + corps + "})()");
        const r = await fn(sql, runSorealIdleOperation, user, db);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, r }));
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String(e && e.stack || e) }));
      }
    });
    return;
  }
  let p = url.pathname === "/" ? "/index.html" : url.pathname;
  const fichier = path.join(ROOT, decodeURIComponent(p));
  if (!fichier.startsWith(path.resolve(ROOT)) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
    res.writeHead(404); res.end("not found"); return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(fichier)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(fichier).pipe(res);
}).listen(port, () => console.log("SOREAL IDLE local sur http://localhost:" + port));
