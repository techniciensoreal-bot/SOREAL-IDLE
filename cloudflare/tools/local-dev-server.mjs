/*
 * Serveur LOCAL de développement (2026-09-25) : sert cloudflare/public tel quel et branche /api/v1/call sur le VRAI moteur (runSorealIdleOperation,
 * base SQLite en mémoire) — l'interface complète tourne donc en local, sans session ni déploiement, pour reproduire un bug ou vérifier un écran.
 *
 *   node cloudflare/tools/local-dev-server.mjs            (port 8799, variable PORT pour en changer)
 *   puis ouvrir http://localhost:8799/, exécuter dans la console  sessionStorage.setItem('soreal_idle_session_v1','local'); location.reload()
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

const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".m4a": "audio/mp4" };
const ROOT = REPO + "cloudflare/public";
const port = Number(process.env.PORT || 8799);

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/v1/call" && req.method === "POST") {
    let corps = "";
    req.on("data", (c) => { corps += c; });
    req.on("end", () => {
      try {
        const { operation, args } = JSON.parse(corps || "{}");
        const resultat = runSorealIdleOperation(sql, operation, args || [], user);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(resultat));
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
