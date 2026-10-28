#!/usr/bin/env node
/*
 * Aperçu LOCAL des nouvelles morts du joueur (Norman, 2026-10-28 : « je veux les voir en local pour valider avant intégration »).
 *   node cloudflare/tools/apercu-morts/serveur.mjs          puis ouvrir  http://127.0.0.1:8795/
 * Sert uniquement des fichiers du dépôt, en lecture, sur 127.0.0.1 (jamais 8765 / 8766, réservés au studio de voix). Les portraits viennent de desktop/medias/idle/player et les boss de desktop/medias/idle/bosses (copie locale des médias).
 * Ne touche ni au jeu ni à la production : l'animation vit dans cloudflare/public/modules/morts-joueur-nouvelles-v1.js, pas encore chargée par le jeu.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DEPOT = path.resolve(ICI, "..", "..", "..");
const PORT = Number(process.env.PORT || 8795);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".json": "application/json" };
const DOSSIER_PORTRAITS = path.join(DEPOT, "desktop", "medias", "idle", "player");
const DOSSIER_BOSS = path.join(DEPOT, "desktop", "medias", "idle", "bosses");

http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/") { res.writeHead(302, { location: "/cloudflare/tools/apercu-morts/index.html" }); return res.end(); }
  if (url.pathname === "/__portraits") {
    let liste = [];
    try { liste = fs.readdirSync(DOSSIER_PORTRAITS).filter((f) => /\.(png|webp|jpg)$/i.test(f)).sort(); } catch (_e) { /* pas de médias locaux */ }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(liste.map((f) => "/desktop/medias/idle/player/" + f)));
  }
  if (url.pathname === "/__boss") {
    let liste = [];
    try { liste = fs.readdirSync(DOSSIER_BOSS).filter((f) => /.(png|webp|jpg)$/i.test(f)).sort(); } catch (_e) { /* pas de médias locaux */ }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(liste.map((f) => "/desktop/medias/idle/bosses/" + f)));
  }
  const chemin = path.normalize(path.join(DEPOT, decodeURIComponent(url.pathname)));
  const permis = chemin.startsWith(path.join(DEPOT, "cloudflare") + path.sep) || chemin.startsWith(DOSSIER_PORTRAITS + path.sep) || chemin.startsWith(DOSSIER_BOSS + path.sep);
  if (!permis || !fs.existsSync(chemin) || !fs.statSync(chemin).isFile()) { res.writeHead(404); return res.end("introuvable"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(chemin).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(chemin).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("Aperçu des morts : http://127.0.0.1:" + PORT + "/"));
