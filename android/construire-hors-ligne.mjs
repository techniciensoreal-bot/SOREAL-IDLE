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
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, "..");
const proj = path.join(ici, "hors-ligne");
const assets = path.join(proj, "app", "src", "main", "assets");
const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find((x) => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : d; };
const sansMedias = args.includes("--sans-medias");
const code = opt("code", "5"), nom = opt("nom", "2.0.1-hors-ligne");
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

// 2. le code : le Worker du jeu (service worker construit, publié sous le nom que la page enregistre déjà), le site (sans maquettes ni outils) et la page de démarrage (code-apk.mjs : les mêmes fichiers que le paquet de mise à jour)
const { fichiersCodeApk } = await import("./code-apk.mjs");
const codeApk = await fichiersCodeApk(path.join(proj, "app", "build", "code-apk"));
for (const f of codeApk) { const dst = path.join(assets, ...f.nom.split("/")); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(f.chemin, dst); }
console.log("code :", codeApk.length, "fichiers");
// empreinte du code embarqué : la mise à jour ne retélécharge pas un paquet identique (même zip déterministe que desktop/publier-maj.mjs --apk)
const { ecrireZip } = await import("../desktop/src/zip.mjs");
const { createHash } = await import("node:crypto");
fs.writeFileSync(path.join(assets, "code-sha.txt"), createHash("sha256").update(ecrireZip(codeApk.map((f) => ({ nom: f.nom, donnees: fs.readFileSync(f.chemin) })))).digest("hex"));
// clé publique des mises à jour (la même que l'application Windows) : l'APK ne croit un manifeste que signé par elle
fs.copyFileSync(path.join(depot, "desktop", "maj-cle-publique.pem"), path.join(assets, "maj-cle-publique.pem"));

// 4. catalogue de départ
fs.mkdirSync(path.join(assets, "graine"), { recursive: true });
fs.copyFileSync(path.join(depot, "desktop", "graine", "catalogue.json"), path.join(assets, "graine", "catalogue.json"));

// 5. médias : mêmes clés que le bucket ; index { clé: taille } lu par le Worker (R2)
const index = {}, etags = {};
if (!sansMedias) {
  const MED = path.join(depot, "desktop", "medias");
  let indexRecolte = {}; try { indexRecolte = JSON.parse(fs.readFileSync(path.join(MED, "_index.json"), "utf8")); } catch (_e) { /* pas d'empreintes : tout sera revérifié */ }
  const marcher = (dossier, prefixe) => {
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
      const cleM = prefixe + e.name, f = path.join(dossier, e.name);
      if (e.isDirectory()) { marcher(f, cleM + "/"); continue; }
      if (cleM === "_index.json" || cleM === "_recolte.json") continue;
      const dst = path.join(assets, "medias", ...cleM.split("/"));
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(f, dst);
      if (!cleM.startsWith("_externes/")) index[cleM] = fs.statSync(f).size;
      if (indexRecolte[cleM]) etags[cleM] = String(indexRecolte[cleM][1] || "");
    }
  };
  marcher(MED, "");
  console.log("médias :", Object.keys(index).length, "fichiers");
} else fs.mkdirSync(path.join(assets, "medias"), { recursive: true });
fs.writeFileSync(path.join(assets, "medias", "_index.json"), JSON.stringify(index));
// empreintes (etag R2) des médias embarqués : la mise à jour ne télécharge que ceux dont l'empreinte publiée diffère
fs.writeFileSync(path.join(assets, "medias", "_etags.json"), JSON.stringify(etags));

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
