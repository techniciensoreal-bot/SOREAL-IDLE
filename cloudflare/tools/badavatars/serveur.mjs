/*
 * Petit serveur LOCAL pour mesurer les images (étape 2) : sert <dossier> + mesurer.html et reçoit res.json / tete.json (POST /save/<nom>).
 * Usage : node cloudflare/tools/badavatars/serveur.mjs <dossier> [port=8791]   (jamais 8765 ni 8766 : réservés au studio de voix) ; l'arrêter ensuite.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 8791);
if (port === 8765 || port === 8766) throw new Error("ports réservés au studio de voix");
const ici = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { ".html": "text/html;charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png" };
http.createServer((q, r) => {
  if (q.method === "POST" && q.url.startsWith("/save/")) {
    const nom = path.basename(q.url.slice(6));
    if (!/^(res|tete)\.json$/.test(nom)) { r.writeHead(400); return r.end("nom refusé"); }
    const morceaux = [];
    q.on("data", (d) => morceaux.push(d));
    q.on("end", () => { fs.writeFileSync(path.join(racine, nom), Buffer.concat(morceaux)); r.writeHead(200); r.end("ok"); });
    return;
  }
  const chemin = decodeURIComponent(q.url.split("?")[0]);
  const f = chemin === "/mesurer.html" ? path.join(ici, "mesurer.html") : path.join(racine, chemin);
  if (!f.startsWith(chemin === "/mesurer.html" ? ici : racine) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end("404"); }
  r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(f).pipe(r);
}).listen(port, "127.0.0.1", () => console.log("http://127.0.0.1:" + port + "/mesurer.html"));
