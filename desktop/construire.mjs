/*
 * Construit l'installateur Windows de SOREAL IDLE (Norman, 2026-10-28).
 *   node desktop/construire.mjs            -> desktop/dist/SOREAL IDLE Setup <version>.exe
 *   node desktop/construire.mjs --dossier  -> seulement le dossier exécutable (sans installateur, plus rapide à essayer)
 * Le jeu embarqué est une COPIE des sources du dépôt au moment de la construction (cloudflare/src, cloudflare/public) : rien n'est téléchargé au premier lancement.
 * Les médias (images, voix, musiques) viennent de desktop/medias (récoltés par desktop/recolter.mjs) et sont copiés à côté de l'application.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DEPOT = path.resolve(ICI, "..");
const STAGE = path.join(ICI, "_stage");
const dossierSeul = process.argv.includes("--dossier");

function copier(src, dest, filtre) {
  fs.cpSync(src, dest, { recursive: true, filter: filtre || (() => true) });
}

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(path.join(STAGE, "jeu", "cloudflare"), { recursive: true });
copier(path.join(ICI, "main.js"), path.join(STAGE, "main.js"));
copier(path.join(ICI, "coeur.js"), path.join(STAGE, "coeur.js"));
copier(path.join(ICI, "preload.js"), path.join(STAGE, "preload.js"));
copier(path.join(ICI, "src"), path.join(STAGE, "src"), (f) => !f.endsWith("serveur-essai.mjs"));
copier(path.join(DEPOT, "cloudflare", "src"), path.join(STAGE, "jeu", "cloudflare", "src"));
copier(path.join(DEPOT, "cloudflare", "public"), path.join(STAGE, "jeu", "cloudflare", "public"), (f) => !/[\/]\.well-known[\/]|\.apk$/.test(f));
/* Les sources importent aussi des fichiers JSON de design/ (noms et histoires des boss, traductions) et lisent cloudflare/contracts : même emplacement relatif que dans le dépôt. */
copier(path.join(DEPOT, "design"), path.join(STAGE, "jeu", "design"));
if (fs.existsSync(path.join(DEPOT, "cloudflare", "contracts"))) copier(path.join(DEPOT, "cloudflare", "contracts"), path.join(STAGE, "jeu", "cloudflare", "contracts"));
if (fs.existsSync(path.join(ICI, "graine"))) copier(path.join(ICI, "graine"), path.join(STAGE, "graine"));

/* Empreinte du paquet de code embarqué : identique à celle de publier-maj.mjs tant que le code n'a pas changé (la mise à jour ne retélécharge alors pas le code). Clé publique de vérification des mises à jour. */
const { construirePaquetCode } = await import(pathToFileURL(path.join(ICI, "src", "paquet.mjs")).href);
const paquet = construirePaquetCode(DEPOT);
fs.writeFileSync(path.join(STAGE, "jeu", "_code.json"), JSON.stringify({ sha256: paquet.sha256, fichiers: paquet.nb }));
if (fs.existsSync(path.join(ICI, "maj-cle-publique.pem"))) copier(path.join(ICI, "maj-cle-publique.pem"), path.join(STAGE, "maj-cle-publique.pem"));
else console.log("ATTENTION : pas de clé publique de mise à jour (node desktop/publier-maj.mjs --creer-cle) : cet installateur ne pourra recevoir aucune mise à jour.");

const racine = JSON.parse(fs.readFileSync(path.join(ICI, "package.json"), "utf8"));
fs.writeFileSync(path.join(STAGE, "package.json"), JSON.stringify({
  name: "soreal-idle", productName: "SOREAL IDLE", version: racine.version, description: racine.description, main: "main.js", author: "SOREAL"
}, null, 2));

/* Icône de l'application (exécutable, barre des tâches, raccourcis) : desktop/icone.ico (voir creer-icone.mjs). */
fs.copyFileSync(path.join(ICI, "icone.ico"), path.join(STAGE, "icone.ico"));

const medias = path.join(ICI, "medias");
const avecMedias = fs.existsSync(medias) && fs.readdirSync(medias).length > 0;
console.log(avecMedias ? "médias embarqués : " + medias : "ATTENTION : desktop/medias est vide ou absent : les images et voix du serveur ne seront PAS dans l'installateur (lancer desktop/recolter.mjs).");

const config = {
  appId: "be.soreal.idle.windows",
  productName: "SOREAL IDLE",
  directories: { app: STAGE, output: path.join(ICI, "dist") },
  asar: false,
  compression: "normal",
  extraResources: avecMedias ? [{ from: medias, to: "medias" }] : [],
  win: { target: dossierSeul ? ["dir"] : ["nsis"], icon: path.join(STAGE, "icone.ico") },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true, perMachine: false, createDesktopShortcut: true, createStartMenuShortcut: true, shortcutName: "SOREAL IDLE", installerIcon: path.join(STAGE, "icone.ico"), uninstallerIcon: path.join(STAGE, "icone.ico") },
  artifactName: "SOREAL-IDLE-Setup-${version}.${ext}"
};
const fichierConfig = path.join(ICI, "_electron-builder.json");
fs.writeFileSync(fichierConfig, JSON.stringify(config, null, 2));

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const r = spawnSync(npx, ["electron-builder", "--win", "--config", fichierConfig, "--publish", "never"], { cwd: ICI, stdio: "inherit", shell: process.platform === "win32" });
process.exit(r.status === null ? 1 : r.status);
