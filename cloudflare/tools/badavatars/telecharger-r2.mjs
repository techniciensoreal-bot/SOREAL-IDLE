/*
 * Télécharge shared/badavatars/ du bucket R2 « soreal » dans <dossier>/img/ et écrit <dossier>/imglist.json (étape 1 de generer-catalogue-badavatars.mjs).
 * Accès en LECTURE SEULE par le Worker de récolte (desktop/recolte, « wrangler dev --remote » : connexion wrangler de l'administrateur, aucun jeton manipulé ici).
 * Usage : node cloudflare/tools/badavatars/telecharger-r2.mjs <dossier> [port=8794]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const dossier = path.resolve(process.argv[2] || "badavatars-r2");
const port = Number(process.argv[3] || 8794);
const depot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const base = "http://127.0.0.1:" + port;
const win = process.platform === "win32";
const w = spawn(win ? "npx.cmd" : "npx", ["wrangler", "dev", "--remote", "--config", path.join(depot, "desktop", "recolte", "wrangler.jsonc"), "--ip", "127.0.0.1", "--port", String(port)], { cwd: depot, shell: win, stdio: "ignore" });
const arreter = () => { try { if (win) execSync("taskkill /PID " + w.pid + " /T /F", { stdio: "ignore" }); else w.kill("SIGTERM"); } catch (_e) { /* déjà arrêté */ } };
process.on("exit", arreter);
try {
  let pret = false;
  for (let i = 0; i < 60 && !pret; i += 1) { try { pret = (await (await fetch(base + "/ping")).text()) === "ok"; } catch (_e) { /* pas encore */ } if (!pret) await new Promise((r) => setTimeout(r, 2000)); }
  if (!pret) throw new Error("accès au bucket indisponible (connexion wrangler ?)");
  const cles = [];
  let curseur = null;
  do {
    const r = await (await fetch(base + "/liste?prefix=" + encodeURIComponent("shared/badavatars/") + (curseur ? "&curseur=" + encodeURIComponent(curseur) : ""))).json();
    for (const o of r.objets) if (/\.(webp|png)$/i.test(o.cle)) cles.push(o.cle);
    curseur = r.curseur;
  } while (curseur);
  const rel = [];
  for (const k of cles) {
    const r = await fetch(base + "/objet?cle=" + encodeURIComponent(k));
    if (!r.ok) continue;
    const dest = path.join(dossier, "img", k.slice("shared/badavatars/".length));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    rel.push(k.slice("shared/badavatars/".length));
  }
  fs.writeFileSync(path.join(dossier, "imglist.json"), JSON.stringify(rel));
  console.log(rel.length + " images dans " + dossier);
} finally { arreter(); }
