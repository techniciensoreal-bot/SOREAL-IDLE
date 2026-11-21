#!/usr/bin/env node
/*
 * Banc d'écoute des sons générés (Norman, 2026-11-21 : « des sons de meilleure qualité »). Sert la page d'écoute et le dossier de variantes, et enregistre les choix (POST /choix -> choix.json dans le dossier).
 *   node cloudflare/tools/sons-ia/serveur.mjs <dossier-des-variantes> [port=8797]   (jamais 8765 ni 8766 : réservés au studio de voix)
 * Local uniquement (127.0.0.1) ; ne touche ni au jeu ni à la production.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ici = path.dirname(fileURLToPath(import.meta.url));
const dossier = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 8797);
if (port === 8765 || port === 8766) throw new Error("ports réservés au studio de voix");
const TYPES = { ".html": "text/html;charset=utf-8", ".json": "application/json", ".wav": "audio/wav", ".ogg": "audio/ogg", ".mp3": "audio/mpeg" };
http.createServer((q, r) => {
  const u = new URL(q.url, "http://x");
  if (q.method === "POST" && u.pathname === "/choix") {
    const m = [];
    q.on("data", (d) => m.push(d));
    q.on("end", () => {
      try { JSON.parse(Buffer.concat(m).toString()); fs.writeFileSync(path.join(dossier, "choix.json"), Buffer.concat(m)); r.writeHead(200); r.end("ok"); }
      catch (_e) { r.writeHead(400); r.end("json"); }
    });
    return;
  }
  const rel = decodeURIComponent(u.pathname === "/" ? "/ecoute.html" : u.pathname);
  const f = rel === "/ecoute.html" ? path.join(ici, "ecoute.html") : path.join(dossier, rel);
  const base = rel === "/ecoute.html" ? ici : dossier;
  if (!path.resolve(f).startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end("404"); }
  r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(f).pipe(r);
}).listen(port, "127.0.0.1", () => console.log("http://127.0.0.1:" + port + "/"));
