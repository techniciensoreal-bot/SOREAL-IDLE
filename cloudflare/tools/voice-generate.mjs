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
 *   --motifs "<regex>" : régénère les blocs dont le texte correspond (ex. après un changement de prononciation : "Norman|Fight|\\.\\.\\.|…").
 *   --studio [url,url…] : synthétise avec le STUDIO DE VOIX LOCAL (cloudflare/tools/voice-studio, Chatterbox sur la carte graphique) au
 *                         lieu de Piper : voix d'homme (narrateur) ET voix de femme (blocs reconnus par estVoixFemme). Plusieurs URL = plusieurs
 *                         instances du studio en parallèle (une par port). Reprenable : un bloc dont le fichier existe déjà n'est pas refait.
 *   --tag <étiquette>   : avec --studio, étiquette de voix (part de l'empreinte de chaque bloc : changer d'étiquette change TOUS les noms de
 *                         fichiers, donc aucun ancien fichier en cache ne peut être servi). Exemple : cb1.
 *   --out <dossier>     : dossier de sortie (défaut : cloudflare/public/voice). Avec --studio, utiliser un dossier HORS du dépôt pendant
 *                         la génération, puis copier le résultat dans public/voice d'un seul coup.
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
import { IDLE_NGU_SYSTEMS } from "../src/idle-ngu-progression.js";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..", "..");
const PUBLIC = path.join(RACINE, "cloudflare", "public");
const SORTIE = String(arg("out", "")) && arg("out", "") !== true ? path.resolve(String(arg("out", ""))) : path.join(PUBLIC, "voice");

function arg(nom, defaut) {
  const i = process.argv.indexOf("--" + nom);
  if (i < 0) return defaut;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

const URL_SITE = String(arg("url", "https://soreal-idle.technicien-soreal.workers.dev/"));
const LIMITE = Number(arg("limit", 0)) || 0;
const TRAVAILLEURS = Math.max(1, Number(arg("workers", 3)) || 3);
/* 96 kbit/s (2026-09-26) : à 32 kbit/s, la voix de Tom (44,1 kHz) avait un effet « quelque chose dans la gorge » dû à l'encodage. */
const DEBIT = String(arg("bitrate", "96k"));
/* Voix de femme (bloc reconnu par estVoixFemme du module de narration) : modèle Piper « fr_FR-siwis-medium » (fichier .onnx et .onnx.json côte à côte) fourni par SOREAL_VOICE_FEMME_MODEL. */
const MODELE_FEMME = process.env.SOREAL_VOICE_FEMME_MODEL || "";
const REGLAGES_FEMME = { noise_scale: 0.8, noise_w: 1.0, length_scale: 1.08 };
const A_SEC = Boolean(arg("dry", false));
const ELAGUER = Boolean(arg("prune", false));
const ASTERISQUES = Boolean(arg("asterisques", false));
const MOTIFS = arg("motifs", "") === true ? "" : String(arg("motifs", ""));
const SEULEMENT_LE_PREMIER = Boolean(arg("only-first", false));
const FFMPEG = process.env.SOREAL_FFMPEG || "ffmpeg";
const STUDIO = arg("studio", false);
const URLS_STUDIO = STUDIO === false ? [] : (STUDIO === true ? ["http://127.0.0.1:8765"] : String(STUDIO).split(",").map((u) => u.trim()).filter(Boolean));
const ETIQUETTE = arg("tag", "") === true ? "" : String(arg("tag", ""));

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
  fs.writeFileSync(path.join(SORTIE, "manifest.json"), JSON.stringify({ v: 1, voice: ETIQUETTE || "cb1", format: "m4a-aac-mono", files: fichiers }) + "\n");
  return fichiers.length;
}

/* Contenu d'un fichier local servi à la page ; avec --tag, le module de narration reçoit l'étiquette de voix demandée (elle entre dans l'empreinte des blocs). */
function contenuLocal(fichier) {
  let texte = fs.readFileSync(path.join(PUBLIC, fichier), "utf8");
  if (ETIQUETTE && fichier === "modules/tutorial-tts-v202.js") {
    const avant = texte;
    texte = texte.replace(/var VOICE_TAG='[^']*';/, "var VOICE_TAG='" + ETIQUETTE.replace(/[^A-Za-z0-9_-]/g, "") + "';");
    if (texte === avant) throw new Error("VOICE_TAG introuvable dans le module de narration");
  }
  return texte;
}

/*
 * Synthèse par le studio de voix local (Chatterbox) : un travailleur par URL, chacun traite un bloc à la fois. Voix d'homme ou de femme
 * selon le bloc. Une durée invraisemblable (synthèse tronquée, ou qui boucle) relance le bloc (3 essais) ; s'il reste douteux il est gardé
 * et signalé dans _alertes.json (dossier de sortie).
 */
async function genererAvecStudio(blocs) {
  const alertes = [];
  const echecs = [];
  let suivant = 0;
  let faits = 0;
  const debut = Date.now();
  async function travailleur(url, numero) {
    for (;;) {
      const i = suivant++;
      if (i >= blocs.length) return;
      const b = blocs[i];
      let meilleur = null;
      let plausible = false;
      let derniereErreur = "";
      for (let essai = 1; essai <= 4 && !plausible; essai += 1) {
        try {
          const r = await fetch(url + "/synthese", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texte: b.texte, voix: b.femme ? "femme" : "homme" }) });
          if (!r.ok) throw new Error("studio " + r.status + " " + (await r.text()).slice(0, 200));
          const duree = Number(r.headers.get("x-duree-secondes")) || 0;
          const buf = Buffer.from(await r.arrayBuffer());
          const n = b.texte.length;
          plausible = duree >= n / 32 && duree <= n / 6 + 3;
          meilleur = { buf, duree };
        } catch (e) {
          derniereErreur = String(e && e.message || e).slice(0, 300);
          /* Studio tombé (ex. erreur CUDA, relancé par lancer-robuste) : on attend son retour (5 min max) avant de retenter. */
          for (let t = 0; t < 100; t += 1) {
            const ping = await fetch(url + "/ping").then((r) => r.json()).catch(() => null);
            if (ping && ping.ok) break;
            await new Promise((res) => setTimeout(res, 3000));
          }
        }
      }
      if (!meilleur) {
        /* Bloc impossible à synthétiser : signalé, la génération continue (le jeu retombera sur la voix de secours pour ce bloc). */
        echecs.push({ hash: b.hash, caracteres: b.texte.length, extrait: b.texte.slice(0, 120), erreur: derniereErreur });
        fs.writeFileSync(path.join(SORTIE, "_echecs.json"), JSON.stringify(echecs, null, 1));
        continue;
      }
      if (!plausible) alertes.push({ hash: b.hash, duree: meilleur.duree, caracteres: b.texte.length, extrait: b.texte.slice(0, 80) });
      const tmp = path.join(SORTIE, b.hash + ".tmp.m4a");
      fs.writeFileSync(tmp, meilleur.buf);
      fs.renameSync(tmp, path.join(SORTIE, b.hash + ".m4a"));
      faits += 1;
      if (faits % 10 === 0 || faits === blocs.length) {
        const sec = (Date.now() - debut) / 1000;
        console.log("[" + numero + "] " + faits + "/" + blocs.length + " blocs · " + Math.round(sec / 60) + " min · reste ≈ " + Math.round((sec / faits) * (blocs.length - faits) / 60) + " min · " + alertes.length + " alerte(s)");
        ecrireManifeste();
        fs.writeFileSync(path.join(SORTIE, "_alertes.json"), JSON.stringify(alertes, null, 1));
      }
    }
  }
  await Promise.all(URLS_STUDIO.map((u, k) => travailleur(u, k + 1)));
  fs.writeFileSync(path.join(SORTIE, "_alertes.json"), JSON.stringify(alertes, null, 1));
  return alertes;
}

async function ouvrirPage(navigateur, femme = false) {
  const page = await navigateur.newPage();
  if (femme) {
    if (!MODELE_FEMME || !fs.existsSync(MODELE_FEMME)) throw new Error("voix de femme : définir SOREAL_VOICE_FEMME_MODEL (fr_FR-siwis-medium.onnx)");
    const config = JSON.parse(fs.readFileSync(MODELE_FEMME + ".json", "utf8"));
    config.inference = Object.assign({}, config.inference || {}, REGLAGES_FEMME);
    const modele = fs.readFileSync(MODELE_FEMME);
    await page.route("**/api/idle/media/piper-model.onnx.json*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(config) }));
    await page.route("**/api/idle/media/piper-model.onnx", (route) => route.fulfill({ status: 200, contentType: "application/octet-stream", body: modele }));
  }
  /* Le module de narration, l'interface et les modules d'histoires LOCAUX (découpage, empreinte, textes à jour : sinon le site déployé fournirait d'anciens textes d'histoire) remplacent ceux du site ; tout le reste vient du site. */
  for (const [motif, fichier] of [["**/modules/tutorial-tts-v202.js*", "modules/tutorial-tts-v202.js"], ["**/soreal-idle-ui.js*", "soreal-idle-ui.js"], ["**/modules/local-neural-piper-v1.js*", "modules/local-neural-piper-v1.js"], ["**/modules/story-popup-v1.js*", "modules/story-popup-v1.js"], ["**/modules/story-popup-2-v1.js*", "modules/story-popup-2-v1.js"]]) {
    await page.route(motif, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: contenuLocal(fichier) }));
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
  const systemes = IDLE_NGU_SYSTEMS.map((d) => ({ id: d.id, name: d.name, icon: d.icon, kind: d.kind }));
  const blocs = await page0.evaluate(({ liste, systemes }) => {
    const tts = window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
    const M = (ms) => " " + String.fromCharCode(0xe000) + ms + String.fromCharCode(0xe001) + " ";
    const textes = ["Chroniques de boss." + M(1500), ...window.__sorealVoiceTextesIdleV1__(), ...window.__sorealVoiceTextesSystemesIdleV1__(systemes)];
    for (const b of liste) textes.push(tts.composerChronique(b.nom, b.histoire));
    const vus = new Map();
    for (const t of textes) {
      for (const etape of tts.planNarration(t)) {
        if (etape.chunk == null) continue;
        const h = tts.hashBloc(etape.chunk);
        if (!vus.has(h)) vus.set(h, etape.chunk);
      }
    }
    return [...vus.entries()].map(([hash, texte]) => ({ hash, texte, femme: Boolean(tts.estVoixFemme && tts.estVoixFemme(texte)) }));
  }, { liste: boss, systemes });

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
  if (MOTIFS) {
    const re = new RegExp(MOTIFS, "i");
    const cibles = blocs.filter((b) => re.test(b.texte));
    console.log(`${cibles.length} bloc(s) correspondent à /${MOTIFS}/, à régénérer`);
    for (const b of cibles) {
      const p = path.join(SORTIE, b.hash + ".m4a");
      if (!A_SEC && fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
  const manquants = blocs.filter((b) => !fs.existsSync(path.join(SORTIE, b.hash + ".m4a")));
  const restantsFemme = manquants.filter((b) => b.femme);
  const restants = manquants.filter((b) => !b.femme);
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

  if (URLS_STUDIO.length) {
    for (const u of URLS_STUDIO) {
      const ping = await fetch(u + "/ping").then((r) => r.json()).catch(() => null);
      if (!ping || !ping.ok || !ping.voix || !ping.voix.homme || !ping.voix.femme) throw new Error("studio de voix injoignable ou sans voix d'homme ET de femme : " + u);
    }
    const restantsStudio = manquants.slice();
    console.log("Studio de voix : " + restantsStudio.length + " bloc(s) à générer (" + restantsStudio.filter((b) => b.femme).length + " en voix de femme) sur " + URLS_STUDIO.length + " instance(s)");
    const alertes = await genererAvecStudio(restantsStudio);
    await navigateur.close();
    const nStudio = ecrireManifeste();
    console.log("manifest.json : " + nStudio + " fichiers dans " + SORTIE + " · " + alertes.length + " alerte(s) (voir _alertes.json)");
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

  /* Blocs de la voix de femme : une page à part avec le modèle de la dame. */
  if (restantsFemme.length) {
    const pageFemme = await ouvrirPage(navigateur, true);
    for (const { hash, texte } of restantsFemme) {
      const base64 = await pageFemme.evaluate(async (t) => {
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
      console.log("voix de femme :", hash, JSON.stringify(texte.slice(0, 60)));
    }
  }
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
