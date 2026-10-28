/*
 * Banc d'essai du Worker embarqué SANS Electron : même environnement que l'application (env-local.mjs), derrière un petit serveur HTTP local, pour le vérifier dans un navigateur ou par un test.
 *   node desktop/src/serveur-essai.mjs            (port 8841, variable PORT pour en changer ; DONNEES=<dossier> pour la base)
 * Ouvrir ensuite l'adresse affichée (elle porte le ticket de lancement du joueur local).
 */
import http from "node:http";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { creerEnvLocal } from "./env-local.mjs";

const DEPOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const donnees = process.env.DONNEES || fs.mkdtempSync(path.join(os.tmpdir(), "soreal-idle-essai-"));
const env = await creerEnvLocal({
  racineDepot: DEPOT,
  dossierPublic: path.join(DEPOT, "cloudflare", "public"),
  dossierMedias: process.env.MEDIAS || path.join(DEPOT, "desktop", "medias"),
  fichierBase: path.join(donnees, "soreal-idle.sqlite"),
  utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" }
});
const port = Number(process.env.PORT || 8841);
http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const corps = chunks.length ? Buffer.concat(chunks) : undefined;
  const entetes = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v != null) entetes.set(k, Array.isArray(v) ? v.join(", ") : v);
  try {
    const rep = await env.fetch(new Request("http://localhost:" + port + req.url, { method: req.method, headers: entetes, body: req.method === "GET" || req.method === "HEAD" ? undefined : corps }));
    const sortie = {};
    rep.headers.forEach((v, k) => { sortie[k] = v; });
    res.writeHead(rep.status, sortie);
    res.end(Buffer.from(await rep.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(String(e && e.stack || e));
  }
}).listen(port, "127.0.0.1", () => {
  console.log("Worker embarqué : http://127.0.0.1:" + port + "/");
  console.log("données : " + donnees);
});
