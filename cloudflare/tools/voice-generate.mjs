#!/usr/bin/env node
/*
 * Génère UNE fois les voix de SOREAL IDLE (voix Tom, Piper) en fichiers audio légers, servis ensuite tels quels par le site
 * (cloudflare/public/voice/<empreinte>.m4a + manifest.json). Voir docs/WORKLOG.md (2026-09-24, « voix pré-générées »).
 *
 * Principe : un navigateur sans écran charge le site, réutilise le vrai module de narration (mêmes blocs, même empreinte que le
 * jeu) et le vrai Piper (WASM) pour synthétiser chaque bloc, puis ffmpeg encode en AAC mono. Le script est REPRENABLE : un bloc
 * dont le fichier existe déjà n'est pas régénéré.
 *
 *   node cloudflare/tools/voice-generate.mjs [--limit N] [--workers N] [--bitrate 32k] [--url https://…] [--dry] [--prune] [--asterisques] [--only-first]
 *   --asterisques : régénère les blocs dont le texte contient « * » (bruitages comme *BLOUM* : Piper épelait « astérisque »).
 *   --only-first  : avec --asterisques, ne régénère que le tout premier de ces blocs (le son d'intro).
 *
 * Environnement :
 *   SOREAL_PLAYWRIGHT_DIR  dossier où « playwright-core » est installé (défaut : dossier courant)
 *   SOREAL_CHROMIUM        chemin d'un chrome/chromium existant (défaut : celui installé par Playwright)
 *   SOREAL_FFMPEG          ffmpeg AVEC encodeur AAC (défaut : « ffmpeg » du PATH ; pip install imageio-ffmpeg en fournit un)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..", "..");
const PUBLIC = path.join(RACINE, "cloudflare", "public");
const SORTIE = path.join(PUBLIC, "voice");

function arg(nom, defaut) {
  const i = process.argv.indexOf("--" + nom);
  if (i < 0) return defaut;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

const URL_SITE = String(arg("url", "https://soreal-idle.technicien-soreal.workers.dev/"));
const LIMITE = Number(arg("limit", 0)) || 0;
const TRAVAILLEURS = Math.max(1, Number(arg("workers", 3)) || 3);
const DEBIT = String(arg("bitrate", "32k"));
const A_SEC = Boolean(arg("dry", false));
const ELAGUER = Boolean(arg("prune", false));
const ASTERISQUES = Boolean(arg("asterisques", false));
const SEULEMENT_LE_PREMIER = Boolean(arg("only-first", false));
const FFMPEG = process.env.SOREAL_FFMPEG || "ffmpeg";

function lireJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(RACINE, rel), "utf8"));
}

/** Boss -> { id, nom, histoire } (nom affiché = nomFr, histoire = design/ngu-boss-stories-fr.json, notes de déblocage comprises). */
export function chargerBoss() {
  const noms = new Map(lireJson("design/ngu-boss-names-fr.json").map((b) => [Number(b.id), String(b.nomFr || "")]));
  return lireJson("design/ngu-boss-stories-fr.json")
    .map((b) => ({ id: Number(b.id), nom: noms.get(Number(b.id)) || "Boss", histoire: String(b.story || "").trim() }))
    .filter((b) => b.histoire)
    .sort((a, b) => a.id - b.id);
}

function chargerPlaywright() {
  const dossier = process.env.SOREAL_PLAYWRIGHT_DIR || process.cwd();
  const req = createRequire(path.join(path.resolve(dossier), "noop.js"));
  for (const nom of ["playwright-core", "playwright"]) {
    try {
      return req(nom);
    } catch {
      /* suivant */
    }
  }
  throw new Error("playwright-core introuvable : définir SOREAL_PLAYWRIGHT_DIR");
}

function encoder(wav, m4a) {
  const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-i", wav, "-vn", "-ac", "1", "-c:a", "aac", "-b:a", DEBIT, "-movflags", "+faststart", m4a], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg : " + (r.stderr || r.error || r.status));
}

function ecrireManifeste() {
  const fichiers = fs.readdirSync(SORTIE).filter((f) => f.endsWith(".m4a") && !f.includes(".tmp")).map((f) => f.slice(0, -4)).sort();
  fs.writeFileSync(path.join(SORTIE, "manifest.json"), JSON.stringify({ v: 1, voice: "tom1", format: "m4a-aac-mono", files: fichiers }) + "\n");
  return fichiers.length;
}

async function ouvrirPage(navigateur) {
  const page = await navigateur.newPage();
  /* Le module de narration et l'interface LOCAUX (découpage, empreinte, textes à jour) remplacent ceux du site ; tout le reste vient du site. */
  for (const [motif, fichier] of [["**/modules/tutorial-tts-v202.js*", "modules/tutorial-tts-v202.js"], ["**/soreal-idle-ui.js*", "soreal-idle-ui.js"], ["**/modules/local-neural-piper-v1.js*", "modules/local-neural-piper-v1.js"]]) {
    await page.route(motif, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: fs.readFileSync(path.join(PUBLIC, fichier), "utf8") }));
  }
  await page.goto(URL_SITE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => Boolean(window.__SOREAL_IDLE_LOCAL_NEURAL_V1__ && window.__SOREAL_IDLE_TUTORIAL_TTS_V209__?.hashBloc && window.__sorealVoiceTextesIdleV1__), null, { timeout: 90000 });
  return page;
}

async function main() {
  const boss = chargerBoss().slice(0, LIMITE || undefined);
  fs.mkdirSync(SORTIE, { recursive: true });
  const playwright = chargerPlaywright();
  const navigateur = await playwright.chromium.launch({ headless: true, executablePath: process.env.SOREAL_CHROMIUM || undefined });
  const page0 = await ouvrirPage(navigateur);

  /* 1) Textes à lire -> blocs (dédoublonnés par empreinte). */
  const blocs = await page0.evaluate((liste) => {
    const tts = window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
    const M = (ms) => " " + String.fromCharCode(0xe000) + ms + String.fromCharCode(0xe001) + " ";
    const textes = ["Chroniques de boss." + M(1500), ...window.__sorealVoiceTextesIdleV1__()];
    for (const b of liste) textes.push(tts.composerChronique(b.nom, b.histoire));
    const vus = new Map();
    for (const t of textes) {
      for (const etape of tts.planNarration(t)) {
        if (etape.chunk == null) continue;
        const h = tts.hashBloc(etape.chunk);
        if (!vus.has(h)) vus.set(h, etape.chunk);
      }
    }
    return [...vus.entries()].map(([hash, texte]) => ({ hash, texte }));
  }, boss);

  const totalCaracteres = blocs.reduce((n, b) => n + b.texte.length, 0);
  if (ASTERISQUES) {
    const cibles = blocs.filter((b) => b.texte.includes("*"));
    const retenus = SEULEMENT_LE_PREMIER ? cibles.slice(0, 1) : cibles;
    console.log(`${cibles.length} bloc(s) avec astérisque, ${retenus.length} à régénérer`);
    for (const b of retenus) {
      console.log("  ->", b.hash, JSON.stringify(b.texte.slice(0, 90)));
      const p = path.join(SORTIE, b.hash + ".m4a");
      if (!A_SEC && fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
  const restants = blocs.filter((b) => !fs.existsSync(path.join(SORTIE, b.hash + ".m4a")));
  console.log(`${boss.length} chroniques -> ${blocs.length} blocs (${totalCaracteres} caractères), ${restants.length} à générer`);
  if (ELAGUER && !A_SEC) {
    const utiles = new Set(blocs.map((b) => b.hash));
    const orphelins = fs.readdirSync(SORTIE).filter((f) => f.endsWith(".m4a") && !f.includes(".tmp") && !utiles.has(f.slice(0, -4)));
    orphelins.forEach((f) => fs.unlinkSync(path.join(SORTIE, f)));
    console.log(orphelins.length + " fichier(s) orphelin(s) supprimé(s)");
  }
  if (A_SEC) {
    await navigateur.close();
    return;
  }

  /* 2) Synthèse (plusieurs pages en parallèle, chacune avec son propre Piper). */
  let suivant = 0;
  let faits = 0;
  const debut = Date.now();
  async function travailleur(page, numero) {
    for (;;) {
      const i = suivant++;
      if (i >= restants.length) return;
      const { hash, texte } = restants[i];
      const base64 = await page.evaluate(async (t) => {
        const blob = await window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.synthesize(t);
        const buf = new Uint8Array(await blob.arrayBuffer());
        let s = "";
        for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
        return btoa(s);
      }, texte);
      const wav = path.join(SORTIE, hash + ".tmp.wav");
      const tmp = path.join(SORTIE, hash + ".tmp.m4a");
      fs.writeFileSync(wav, Buffer.from(base64, "base64"));
      encoder(wav, tmp);
      fs.renameSync(tmp, path.join(SORTIE, hash + ".m4a"));
      fs.unlinkSync(wav);
      faits += 1;
      if (faits % 10 === 0 || faits === restants.length) {
        const s = (Date.now() - debut) / 1000;
        console.log(`[${numero}] ${faits}/${restants.length} blocs · ${Math.round(s)} s · reste ≈ ${Math.round((s / faits) * (restants.length - faits) / 60)} min`);
        ecrireManifeste();
      }
    }
  }
  const pages = [page0];
  for (let k = 1; k < Math.min(TRAVAILLEURS, Math.max(1, restants.length)); k += 1) pages.push(await ouvrirPage(navigateur));
  await Promise.all(pages.map((p, k) => travailleur(p, k + 1)));
  await navigateur.close();

  const n = ecrireManifeste();
  const octets = fs.readdirSync(SORTIE).filter((f) => f.endsWith(".m4a") && !f.includes(".tmp")).reduce((t, f) => t + fs.statSync(path.join(SORTIE, f)).size, 0);
  console.log(`manifest.json : ${n} fichiers, ${(octets / 1048576).toFixed(1)} Mo`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
