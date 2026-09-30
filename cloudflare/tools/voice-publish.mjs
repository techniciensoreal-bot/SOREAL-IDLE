#!/usr/bin/env node
/*
 * Publie les voix pré-générées du jeu sur R2 (Norman, 2026-09-30 : « j'aurais aimé qu'elles soient sur le R2, ça me paraît plus logique »).
 *
 *   node cloudflare/tools/voice-publish.mjs --dir <dossier des .m4a générés> [--workers 6] [--dry]
 *
 * Pour chaque fichier <empreinte>.m4a du dossier : envoi vers le bucket « soreal », clé idle/voix/<empreinte>.m4a (la même que les voix des
 * histoires du menu Admin ; le jeu les lit par /api/idle/media/voice?h=<empreinte>). Puis :
 *   - écrit cloudflare/public/voice/manifest.json (la liste des empreintes disponibles : petit fichier du dépôt, il évite au jeu de demander
 *     à R2 des voix qui n'existent pas) ;
 *   - supprime du dépôt tous les anciens fichiers .m4a de cloudflare/public/voice (ils ne servent plus : les voix sont sur R2).
 * Reprenable : un fichier déjà envoyé (voir _publies.json dans le dossier source) n'est pas renvoyé. Utilise « wrangler » (déjà connecté au
 * compte Cloudflare sur ce poste : npx wrangler whoami).
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..", "..");
const PUBLIC_VOICE = path.join(RACINE, "cloudflare", "public", "voice");
const BUCKET = "soreal";
const PREFIXE = "idle/voix/";

function arg(nom, defaut) {
  const i = process.argv.indexOf("--" + nom);
  if (i < 0) return defaut;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

const DOSSIER = arg("dir", "") && arg("dir", "") !== true ? path.resolve(String(arg("dir", ""))) : "";
const TRAVAILLEURS = Math.max(1, Math.min(12, Number(arg("workers", 6)) || 6));
const A_SEC = Boolean(arg("dry", false));
/* --partiel : la génération n'est pas terminée ; le manifeste le dit et le test de couverture tolère les voix manquantes (repli sur la voix locale). */
const PARTIEL = Boolean(arg("partiel", false));

function envoyer(hash, fichier) {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const p = spawn(cmd, ["--yes", "wrangler", "r2", "object", "put", BUCKET + "/" + PREFIXE + hash + ".m4a", "--file", fichier, "--content-type", "audio/mp4", "--remote"], { shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"] });
    let sortie = "";
    p.stdout.on("data", (d) => { sortie += d; });
    p.stderr.on("data", (d) => { sortie += d; });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("wrangler " + code + " : " + sortie.slice(-300)))));
  });
}

async function main() {
  if (!DOSSIER || !fs.existsSync(DOSSIER)) throw new Error("--dir <dossier des .m4a> requis");
  /* Un fichier écrit il y a moins de 30 s est peut-être encore en cours d'écriture : on l'ignore. */
  const fichiers = fs.readdirSync(DOSSIER).filter((f) => /^[0-9a-f]{14}\.m4a$/.test(f) && Date.now() - fs.statSync(path.join(DOSSIER, f)).mtimeMs > 30000).sort();
  if (!fichiers.length) throw new Error("aucun fichier <empreinte>.m4a dans " + DOSSIER);
  const etatChemin = path.join(DOSSIER, "_publies.json");
  const publies = fs.existsSync(etatChemin) ? JSON.parse(fs.readFileSync(etatChemin, "utf8")) : {};
  const aEnvoyer = fichiers.filter((f) => publies[f] !== fs.statSync(path.join(DOSSIER, f)).size);
  const octets = aEnvoyer.reduce((t, f) => t + fs.statSync(path.join(DOSSIER, f)).size, 0);
  console.log(fichiers.length + " voix dans " + DOSSIER + " : " + aEnvoyer.length + " à envoyer (" + (octets / 1048576).toFixed(1) + " Mo) vers r2://" + BUCKET + "/" + PREFIXE);
  if (A_SEC) return;

  let suivant = 0;
  let faits = 0;
  const echecs = [];
  const debut = Date.now();
  async function travailleur() {
    for (;;) {
      const i = suivant++;
      if (i >= aEnvoyer.length) return;
      const f = aEnvoyer[i];
      let ok = false;
      for (let essai = 1; essai <= 3 && !ok; essai += 1) {
        try {
          await envoyer(f.slice(0, -4), path.join(DOSSIER, f));
          ok = true;
        } catch (e) {
          if (essai === 3) echecs.push({ fichier: f, erreur: String(e.message || e).slice(0, 300) });
        }
      }
      if (ok) publies[f] = fs.statSync(path.join(DOSSIER, f)).size;
      faits += 1;
      if (faits % 25 === 0 || faits === aEnvoyer.length) {
        fs.writeFileSync(etatChemin, JSON.stringify(publies));
        const s = (Date.now() - debut) / 1000;
        console.log(faits + "/" + aEnvoyer.length + " envoyés · " + Math.round(s) + " s · reste ≈ " + Math.round((s / faits) * (aEnvoyer.length - faits) / 60) + " min · " + echecs.length + " échec(s)");
      }
    }
  }
  await Promise.all(Array.from({ length: TRAVAILLEURS }, travailleur));
  fs.writeFileSync(etatChemin, JSON.stringify(publies));
  if (echecs.length) {
    console.error(echecs.length + " envoi(s) en échec (relancer la commande pour les reprendre) :", JSON.stringify(echecs.slice(0, 5)));
    process.exit(1);
  }

  /* Manifeste du dépôt + retrait des anciens fichiers .m4a. */
  const manifesteSource = fs.existsSync(path.join(DOSSIER, "manifest.json")) ? JSON.parse(fs.readFileSync(path.join(DOSSIER, "manifest.json"), "utf8")) : {};
  fs.mkdirSync(PUBLIC_VOICE, { recursive: true });
  const anciens = fs.readdirSync(PUBLIC_VOICE).filter((f) => f.endsWith(".m4a") || f.includes(".tmp"));
  anciens.forEach((f) => fs.unlinkSync(path.join(PUBLIC_VOICE, f)));
  fs.writeFileSync(path.join(PUBLIC_VOICE, "manifest.json"), JSON.stringify({ v: 1, voice: manifesteSource.voice || "cb1", partiel: PARTIEL, format: "m4a-aac-mono", stockage: "r2:idle/voix/", files: fichiers.map((f) => f.slice(0, -4)) }) + "\n");
  console.log("manifest.json : " + fichiers.length + " voix ; " + anciens.length + " ancien(s) fichier(s) .m4a retiré(s) du dépôt (cloudflare/public/voice).");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
