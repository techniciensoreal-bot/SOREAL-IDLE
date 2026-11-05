#!/usr/bin/env node
/*
 * Fusion des voix d'une chronique « DÉFINITIVE » en UN seul fichier (Norman, 2026-11-05 : « les fichiers audio ne sont remis qu'en un seul, en conservant exactement les mêmes temps d'arrêt que quand on le lit de manière
 * séparée. On ne doit voir aucune différence. »). Le plan exact de la lecture séparée (blocs et silences) est enregistré par la case « Définitive » du menu Admin (idle-textes-v1.js, chroniques définitives) :
 *
 *   node cloudflare/tools/fusionner-chroniques-definitives.mjs --plans <plans.json> [--sortie <dossier>] [--publier]
 *   node cloudflare/tools/fusionner-chroniques-definitives.mjs --plans <plans.json> --supprimer-separees --garder <hashes.json> [--sauvegarde <dossier>] [--oui]
 *
 * plans.json : { "boss:38": { "plans": { "avec": { "entier": "…", "etapes": [{ "h": "…" }, { "p": 1100 }, …] }, "sans": {…} } }, … }
 *
 * Fusion : chaque bloc est décodé (même fréquence que le fichier), chaque silence { p } devient EXACTEMENT p millisecondes de zéros (arrondies à l'échantillon), le tout est recollé dans l'ordre puis réencodé en AAC
 * mono (même débit que les blocs, 32 kbit/s). Aucune normalisation, aucun fondu, aucune coupe : le son des blocs n'est pas touché. Contrôle : la durée du fichier doit égaler la somme des blocs et des silences (tolérance
 * 60 ms pour le début/fin d'encodage AAC) ; sinon rien n'est publié.
 * --publier : envoie <entier>.m4a sur R2 (idle/voix/, via wrangler, déjà connecté sur ce poste). Les blocs séparés ne sont JAMAIS touchés par la fusion.
 * --supprimer-separees : supprime de R2 les blocs séparés des chroniques du fichier de plans, sauf ceux de --garder (liste JSON d'empreintes encore utilisées ailleurs). Chaque bloc est d'abord copié dans --sauvegarde ;
 *   la suppression exige --oui (sinon simulation) et que le fichier ENTIER de chaque variante soit déjà sur R2. À lancer seulement après l'écoute et l'accord de Norman.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const BUCKET = "soreal";
const PREFIXE = "idle/voix/";
const SERVEUR = process.env.SOREAL_IDLE_URL || "https://soreal-idle.technicien-soreal.workers.dev";
const FFMPEG = process.env.SOREAL_FFMPEG || path.join(os.homedir(), "soreal-voice-studio", "venv", "Lib", "site-packages", "imageio_ffmpeg", "binaries", "ffmpeg-win-x86_64-v7.1.exe");
const SOURCES_LOCALES = [path.join(os.homedir(), "soreal-voice-studio", "voice-cb1"), path.join(os.homedir(), "soreal-voice-studio", "voix-en-jeu", "final")];
const HASH = /^[0-9a-f]{14}$/;
const DEBIT = "32k";

function arg(nom, defaut) {
  const i = process.argv.indexOf("--" + nom);
  if (i < 0) return defaut;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}
const PLANS = arg("plans", "");
const SORTIE = path.resolve(String(arg("sortie", path.join(os.homedir(), "soreal-voice-studio", "voix-entieres"))));
const PUBLIER = Boolean(arg("publier", false));
const SUPPRIMER = Boolean(arg("supprimer-separees", false));
const OUI = Boolean(arg("oui", false));

async function octetsBloc(h) {
  for (const d of SOURCES_LOCALES) {
    const f = path.join(d, h + ".m4a");
    if (fs.existsSync(f)) return fs.readFileSync(f);
  }
  const r = await fetch(SERVEUR + "/api/idle/media/voice?h=" + h, { cache: "no-store" });
  if (!r.ok) throw new Error("bloc " + h + " introuvable (" + r.status + ")");
  return Buffer.from(await r.arrayBuffer());
}

/* m4a -> { pcm (s16le mono), taux } */
function decoder(octets) {
  const tmp = path.join(os.tmpdir(), "fusion-" + process.pid + "-" + Math.random().toString(16).slice(2) + ".m4a");
  fs.writeFileSync(tmp, octets);
  try {
    const info = spawnSync(FFMPEG, ["-hide_banner", "-i", tmp], { encoding: "utf8" });
    const m = /(\d{4,6}) Hz/.exec(String(info.stderr || ""));
    const taux = m ? Number(m[1]) : 0;
    if (!taux) throw new Error("fréquence illisible");
    const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-i", tmp, "-f", "s16le", "-ac", "1", "-ar", String(taux), "-"], { maxBuffer: 1 << 29 });
    if (r.status !== 0) throw new Error("décodage : " + String(r.stderr).slice(-200));
    return { pcm: r.stdout, taux };
  } finally {
    try { fs.unlinkSync(tmp); } catch (_e) { /* */ }
  }
}

function dureeM4a(fichier) {
  const info = spawnSync(FFMPEG, ["-hide_banner", "-i", fichier], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(info.stderr || ""));
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

async function fusionner(cle, variante, plan) {
  let taux = 0;
  const morceaux = [];
  let attendu = 0;
  for (const e of plan.etapes) {
    if (e.h) {
      const d = decoder(await octetsBloc(e.h));
      if (taux && d.taux !== taux) throw new Error("fréquences différentes entre blocs (" + taux + " / " + d.taux + ")");
      taux = d.taux;
      morceaux.push(d.pcm);
      attendu += d.pcm.length / 2 / taux;
    } else {
      morceaux.push({ silenceMs: e.p });
    }
  }
  if (!taux) throw new Error("aucun bloc");
  const tampons = morceaux.map((m) => {
    if (Buffer.isBuffer(m)) return m;
    const n = Math.round((m.silenceMs / 1000) * taux);
    attendu += n / taux;
    return Buffer.alloc(n * 2);
  });
  const pcm = Buffer.concat(tampons);
  fs.mkdirSync(SORTIE, { recursive: true });
  const sortie = path.join(SORTIE, plan.entier + ".m4a");
  const r = spawnSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-f", "s16le", "-ar", String(taux), "-ac", "1", "-i", "-", "-c:a", "aac", "-b:a", DEBIT, "-movflags", "+faststart", sortie], { input: pcm, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error("encodage : " + String(r.stderr).slice(-200));
  const duree = dureeM4a(sortie);
  const ecart = Math.abs(duree - attendu);
  console.log(`${cle} ${variante} : ${plan.etapes.filter((e) => e.h).length} blocs + ${plan.etapes.filter((e) => e.p != null).length} silences -> ${plan.entier}.m4a ${duree.toFixed(3)} s (attendu ${attendu.toFixed(3)} s, écart ${(ecart * 1000).toFixed(0)} ms)`);
  if (ecart > 0.06) throw new Error("écart de durée trop grand : " + (ecart * 1000).toFixed(0) + " ms");
  return sortie;
}

function wrangler(args) {
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "wrangler", ...args], { encoding: "utf8", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error("wrangler " + args.slice(0, 3).join(" ") + " : " + String(r.stdout + r.stderr).slice(-300));
  return r;
}

async function existeSurR2(h) {
  const r = await fetch(SERVEUR + "/api/idle/media/voice?h=" + h, { method: "HEAD", cache: "no-store" });
  return r.status === 200;
}

async function principal() {
  if (!PLANS || PLANS === true) { console.error("usage : voir l'en-tête du fichier"); process.exit(2); }
  const tous = JSON.parse(fs.readFileSync(path.resolve(String(PLANS)), "utf8"));
  const cles = Object.keys(tous);
  if (SUPPRIMER) {
    const garder = new Set(arg("garder", "") && arg("garder", "") !== true ? JSON.parse(fs.readFileSync(path.resolve(String(arg("garder"))), "utf8")).map(String) : []);
    const dossier = path.resolve(String(arg("sauvegarde", path.join(os.homedir(), "soreal-voice-studio", "sauvegarde-blocs-avant-fusion"))));
    const entiers = new Set();
    const blocs = new Set();
    for (const cle of cles) for (const p of Object.values(tous[cle].plans || {})) { entiers.add(p.entier); for (const e of p.etapes) if (e.h) blocs.add(e.h); }
    for (const h of entiers) if (!(await existeSurR2(h))) { console.error("ARRÊT : le fichier entier " + h + " n'est pas sur R2."); process.exit(3); }
    for (const h of entiers) blocs.delete(h);
    const aSupprimer = [...blocs].filter((h) => !garder.has(h));
    console.log(`${blocs.size} blocs séparés dans ces chroniques, ${blocs.size - aSupprimer.length} gardés (utilisés ailleurs), ${aSupprimer.length} à supprimer.`);
    if (!OUI) { console.log("Simulation : ajoute --oui pour sauvegarder puis supprimer."); return; }
    fs.mkdirSync(dossier, { recursive: true });
    for (const h of aSupprimer) {
      fs.writeFileSync(path.join(dossier, h + ".m4a"), await octetsBloc(h));
    }
    for (const h of aSupprimer) wrangler(["r2", "object", "delete", BUCKET + "/" + PREFIXE + h + ".m4a", "--remote"]);
    console.log("Supprimés de R2 (copie dans " + dossier + ") : " + aSupprimer.length);
    return;
  }
  for (const cle of cles) {
    for (const [variante, plan] of Object.entries(tous[cle].plans || {})) {
      if (!HASH.test(plan.entier)) throw new Error("empreinte invalide " + plan.entier);
      const f = await fusionner(cle, variante, plan);
      if (PUBLIER) {
        wrangler(["r2", "object", "put", BUCKET + "/" + PREFIXE + plan.entier + ".m4a", "--file", f, "--content-type", "audio/mp4", "--remote"]);
        console.log("  publié sur R2 : " + plan.entier);
      }
    }
  }
}
principal().catch((e) => { console.error("ÉCHEC : " + (e && e.message || e)); process.exit(1); });
