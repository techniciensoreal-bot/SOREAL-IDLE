/*
 * APK SOREAL IDLE HORS LIGNE (Norman, 2026-10-28). Assemble et signe l'application Android qui contient TOUT le jeu : le dossier public du site, les médias (images, voix, musiques), le catalogue
 * de départ et le Worker du jeu (service worker). Même identifiant (be.soreal.idle) et même clé de signature que l'ancienne application « Trusted Web Activity » : elle s'installe par-dessus.
 *   node android/construire-hors-ligne.mjs [--sans-medias] [--code=N] [--nom=2.0.0-hors-ligne]
 * Prérequis sur le PC (jamais dans le dépôt) : %USERPROFILE%\.bubblewrap (JDK 17, SDK Android, mot de passe de la clé) ; clé : android/soreal-idle-release.keystore.
 * Résultat : android/soreal-idle-hors-ligne.apk (signé, aligné).
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, "..");
const proj = path.join(ici, "hors-ligne");
const assets = path.join(proj, "app", "src", "main", "assets");
const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find((x) => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : d; };
const sansMedias = args.includes("--sans-medias");
const code = opt("code", "4"), nom = opt("nom", "2.0.0-hors-ligne");
const outils = path.join(os.homedir(), ".bubblewrap");
const jdk = path.join(outils, "jdk", fs.readdirSync(path.join(outils, "jdk")).find((d) => d.startsWith("jdk")));
const sdk = path.join(outils, "android_sdk");
const mdp = fs.readFileSync(path.join(outils, "soreal-idle-keystore-password.txt"), "utf8").trim();
const cle = path.join(ici, "soreal-idle-release.keystore");
if (!fs.existsSync(cle)) throw new Error("clé de signature absente : " + cle);

function copier(src, dst, filtre) {
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (filtre && !filtre(e, src)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) n += copier(s, d, filtre);
    else { fs.copyFileSync(s, d); n += 1; }
  }
  return n;
}
function lancer(cmd, a, o = {}) {
  const r = spawnSync(cmd, a, { stdio: "inherit", env: Object.assign({}, process.env, { JAVA_HOME: jdk, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk }), shell: false, ...o });
  if (r.status !== 0) throw new Error(cmd + " a échoué (" + r.status + ")");
}

// 1. dossier d'assets neuf
fs.rmSync(assets, { recursive: true, force: true });
fs.mkdirSync(assets, { recursive: true });

// 2. le Worker du jeu (service worker) : publié sous le nom du service worker que la page enregistre déjà
const require = createRequire(path.join(depot, "cloudflare", "local", "package.json"));
const esbuild = require("esbuild");
await esbuild.build({
  entryPoints: [path.join(depot, "cloudflare", "local", "sw-android.js")],
  outfile: path.join(assets, "public", "sw-idle-v1.js"),
  bundle: true, format: "iife", platform: "browser", target: "es2022", minify: true, legalComments: "none",
  external: ["fs", "path", "crypto", "node:*"], logLevel: "warning"
});
console.log("Worker du jeu construit");

// 3. le site (sans maquettes ni outils) ; le service worker construit ci-dessus remplace celui du site
const PUBLIC = path.join(depot, "cloudflare", "public");
const n1 = copier(PUBLIC, path.join(assets, "public"), (e) => !(e.name === "sw-idle-v1.js" || e.name === "_headers" || /^_(ecoute|maquette)/.test(e.name) || /^maquette-/.test(e.name)));
fs.copyFileSync(path.join(proj, "demarrage.html"), path.join(assets, "public", "demarrage.html"));
console.log("site :", n1, "fichiers");

// 4. catalogue de départ
fs.mkdirSync(path.join(assets, "graine"), { recursive: true });
fs.copyFileSync(path.join(depot, "desktop", "graine", "catalogue.json"), path.join(assets, "graine", "catalogue.json"));

// 5. médias : mêmes clés que le bucket ; index { clé: taille } lu par le Worker (R2)
const index = {};
if (!sansMedias) {
  const MED = path.join(depot, "desktop", "medias");
  const marcher = (dossier, prefixe) => {
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
      const cleM = prefixe + e.name, f = path.join(dossier, e.name);
      if (e.isDirectory()) { marcher(f, cleM + "/"); continue; }
      if (cleM === "_index.json" || cleM === "_recolte.json") continue;
      const dst = path.join(assets, "medias", ...cleM.split("/"));
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(f, dst);
      if (!cleM.startsWith("_externes/")) index[cleM] = fs.statSync(f).size;
    }
  };
  marcher(MED, "");
  console.log("médias :", Object.keys(index).length, "fichiers");
} else fs.mkdirSync(path.join(assets, "medias"), { recursive: true });
fs.writeFileSync(path.join(assets, "medias", "_index.json"), JSON.stringify(index));

// 6. Gradle
const gradlew = path.join(proj, process.platform === "win32" ? "gradlew.bat" : "gradlew");
lancer(gradlew, ["--no-daemon", "assembleRelease", "-PversionCode=" + code, "-PversionName=" + nom, "-q"], { cwd: proj, shell: process.platform === "win32" });
const brut = path.join(proj, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
if (!fs.existsSync(brut)) throw new Error("APK non produit : " + brut);

// 7. alignement + signature (même clé que la TWA)
const bt = path.join(sdk, "build-tools", "35.0.0");
const aligne = path.join(proj, "app", "build", "aligne.apk");
fs.rmSync(aligne, { force: true });
lancer(path.join(bt, "zipalign.exe"), ["-p", "-f", "4", brut, aligne]);
const final = path.join(ici, "soreal-idle-hors-ligne.apk");
fs.rmSync(final, { force: true });
lancer(path.join(jdk, "bin", "java.exe"), ["-jar", path.join(bt, "lib", "apksigner.jar"), "sign", "--ks", cle, "--ks-key-alias", "soreal-idle", "--ks-pass", "pass:" + mdp, "--key-pass", "pass:" + mdp, "--out", final, aligne]);
lancer(path.join(jdk, "bin", "java.exe"), ["-jar", path.join(bt, "lib", "apksigner.jar"), "verify", "--print-certs", final]);
console.log("APK prêt :", final, (fs.statSync(final).size / 1048576).toFixed(0), "Mo");
