/*
 * Code de l'APK hors ligne (Norman, 2026-10-29) : le Worker du jeu (service worker construit) + le site (cloudflare/public) + la page de démarrage. Utilisé par DEUX scripts :
 *  - android/construire-hors-ligne.mjs : les écrit dans les assets de l'APK ;
 *  - desktop/publier-maj.mjs --apk : les emballe dans le paquet de mise à jour (zip « public/… »), pour que l'APK se mette à jour sans être reconstruit.
 * Même contenu dans les deux cas : si le code n'a pas changé depuis la construction de l'APK, l'empreinte du paquet est identique et rien n'est retéléchargé.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, "..");
const PUBLIC = path.join(depot, "cloudflare", "public");

/* Le site sans maquettes ni outils ; le service worker construit remplace celui du site. */
const garde = (e) => !(e.name === "sw-idle-v1.js" || e.name === "_headers" || /^_(ecoute|maquette)/.test(e.name) || /^maquette-/.test(e.name));

export async function construireWorker(sortie) {
  const require = createRequire(path.join(depot, "cloudflare", "local", "package.json"));
  const esbuild = require("esbuild");
  await esbuild.build({
    entryPoints: [path.join(depot, "cloudflare", "local", "sw-android.js")],
    outfile: sortie,
    bundle: true, format: "iife", platform: "browser", target: "es2022", minify: true, legalComments: "none",
    external: ["fs", "path", "crypto", "node:*"], logLevel: "warning"
  });
}

function lister(dossier, prefixe, sortie) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (!garde(e)) continue;
    const f = path.join(dossier, e.name);
    if (e.isDirectory()) lister(f, prefixe + e.name + "/", sortie);
    else if (e.isFile()) sortie.push({ nom: prefixe + e.name, chemin: f });
  }
  return sortie;
}

/* [{ nom: "public/index.html", chemin }] triés, service worker construit compris (dans `tmp`). */
export async function fichiersCodeApk(tmp) {
  fs.mkdirSync(tmp, { recursive: true });
  const sw = path.join(tmp, "sw-idle-v1.js");
  await construireWorker(sw);
  const fichiers = lister(PUBLIC, "public/", []);
  fichiers.push({ nom: "public/sw-idle-v1.js", chemin: sw });
  fichiers.push({ nom: "public/demarrage.html", chemin: path.join(ici, "hors-ligne", "demarrage.html") });
  return fichiers.sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
}

export async function construirePaquetApk(tmp) {
  const { ecrireZip } = await import("../desktop/src/zip.mjs");
  const fichiers = await fichiersCodeApk(tmp);
  const zip = ecrireZip(fichiers.map((f) => ({ nom: f.nom, donnees: fs.readFileSync(f.chemin) })));
  return { zip, sha256: crypto.createHash("sha256").update(zip).digest("hex"), nb: fichiers.length };
}
