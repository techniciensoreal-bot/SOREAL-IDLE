#!/usr/bin/env node
/*
 * Manifeste des medias (audit de coherence 2026-11-09, Front 7, test T10). LECTURE SEULE : ne modifie rien.
 *
 * Liste les adresses de medias citees par le code (public/**.js|css|html et src/*.js) vers les dossiers de public/ (shop, dos-cartes, perks, img, magic, garderie, cthulhu, intro, chargement,
 * icons, trou, machine-v2, machine-v3, wandoos, fonts) et verifie qu'elles existent. Deux sortes de citations :
 *  - LITTERALES : "/shop/x.png" (extension media a la fin) : le fichier doit exister (hors liste des exceptions connues ci-dessous) ;
 *  - DYNAMIQUES : "/shop/" + id + ".png", `/perks/${n}.webp`... (le texte s'arrete avant l'extension) : on retient le prefixe ; tout fichier sous ce prefixe est « couvert » et n'est jamais
 *    declare orphelin.
 * Orphelins = images et sons de public/ cites NULLE PART (ni litteralement, ni sous un prefixe dynamique). Les fichiers cites par un autre moyen (nom seul, table JSON, serveur) apparaissent donc
 * ici : c'est une liste de CANDIDATS a verifier avec Norman avant toute suppression (rien ne disparait sans son accord), et le test T10 interdit seulement qu'elle augmente.
 *
 * Usage : node cloudflare/tools/manifeste-medias-v1.mjs [--json]
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(RACINE, "public");
export const DOSSIERS_MEDIAS = ["shop", "dos-cartes", "perks", "img", "magic", "garderie", "cthulhu", "intro", "chargement", "icons", "trou", "machine-v2", "machine-v3", "wandoos", "fonts"];
const EXT_MEDIA = ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "mp3", "m4a", "ogg", "wav", "woff", "woff2", "ttf", "otf"];
const EXT_ORPHELINS = ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif", "mp3", "m4a", "ogg", "wav"];
/* Dossiers de public/ dont les fichiers sont servis par un nom construit cote serveur ou par table (jamais cites tels quels dans le code public) : exclus des orphelins. */
const DOSSIERS_EXCLUS_ORPHELINS = ["voice", "voice-en", "modules/mediapipe-1.2.0"];

function lister(dir, filtre, sortie = []) {
  for (const nom of readdirSync(dir)) {
    if (nom === "node_modules" || nom === ".git") continue;
    const chemin = join(dir, nom);
    const st = statSync(chemin);
    if (st.isDirectory()) lister(chemin, filtre, sortie);
    else if (filtre(chemin)) sortie.push(chemin);
  }
  return sortie;
}
const posix = (p) => p.split("\\").join("/");

export function analyserMedias() {
  const sources = [
    ...lister(PUBLIC, (f) => [".js", ".css", ".html", ".webmanifest", ".json"].includes(extname(f)) && !posix(f).includes("/mediapipe-1.2.0/")),
    ...lister(join(RACINE, "src"), (f) => extname(f) === ".js"),
  ];
  const dossiers = DOSSIERS_MEDIAS.join("|");
  const exts = EXT_MEDIA.join("|");
  /* Un dossier, un chemin sans espace ni guillemet, et soit une extension media (litterale), soit n'importe quoi qui s'arrete avant (dynamique). */
  const reLitterale = new RegExp("(?<![A-Za-z0-9_.-])/(" + dossiers + ")/([A-Za-z0-9_./%@-]+?\\.(?:" + exts + "))(?![A-Za-z0-9_])", "gi");
  const rePrefixe = new RegExp("(?<![A-Za-z0-9_.-])/((?:" + dossiers + ")/[A-Za-z0-9_./%@-]*)(?=[\"'`]\\s*\\+|\\$\\{)", "g");
  const toutLeTexte = [];
  const litterales = new Map(); /* url -> [fichiers source] */
  const prefixes = new Map();
  for (const f of sources) {
    const texte = readFileSync(f, "utf8");
    toutLeTexte.push(texte);
    const rel = posix(relative(join(RACINE, ".."), f));
    for (const m of texte.matchAll(reLitterale)) {
      const url = "/" + m[1] + "/" + m[2];
      /* Gabarits de commentaire (intro/NN.webp, x/XX.png) : pas une vraie adresse. */
      if (/^[NX]+$/.test(url.split("/").pop().split(".")[0])) continue;
      if (!litterales.has(url)) litterales.set(url, new Set());
      litterales.get(url).add(rel);
    }
    for (const m of texte.matchAll(rePrefixe)) {
      const p = "/" + m[1];
      if (!prefixes.has(p)) prefixes.set(p, new Set());
      prefixes.get(p).add(rel);
    }
  }
  const manquantes = [];
  for (const url of litterales.keys()) {
    let chemin = url;
    try { chemin = decodeURIComponent(url); } catch (_) { /* garde l'adresse brute */ }
    if (!existsSync(join(PUBLIC, chemin))) manquantes.push({ url, sources: [...litterales.get(url)] });
  }
  const fichiers = lister(PUBLIC, (f) => EXT_ORPHELINS.includes(extname(f).slice(1).toLowerCase()));
  const corpus = toutLeTexte.join("\n");
  const orphelins = [];
  const citesParNom = [];
  let octetsOrphelins = 0;
  const dynamiquesCouverts = [];
  for (const f of fichiers) {
    const url = "/" + posix(relative(PUBLIC, f));
    const dossier = url.slice(1);
    if (DOSSIERS_EXCLUS_ORPHELINS.some((d) => dossier.startsWith(d + "/"))) continue;
    if (litterales.has(url)) continue;
    const taille = statSync(f).size;
    const pref = [...prefixes.keys()].find((p) => url.startsWith(p));
    if (pref) { dynamiquesCouverts.push({ url, prefixe: pref }); continue; }
    /* Nom seul cite (table, boucle sur une liste de noms) : pas orphelin « sur de lui », a verifier a la main. */
    const stem = url.split("/").pop().replace(/\.[^.]+$/, "");
    if (stem.length >= 4 && corpus.includes(stem)) { citesParNom.push({ url, octets: taille }); continue; }
    orphelins.push({ url, octets: taille });
    octetsOrphelins += taille;
  }
  citesParNom.sort((a, b) => b.octets - a.octets);
  orphelins.sort((a, b) => b.octets - a.octets);
  return {
    nbSources: sources.length,
    nbLitterales: litterales.size,
    manquantes,
    prefixesDynamiques: [...prefixes.keys()].sort(),
    nbFichiersCouvertsParPrefixe: dynamiquesCouverts.length,
    orphelins,
    citesParNom,
    octetsOrphelins,
  };
}

if (process.argv[1] && posix(process.argv[1]).endsWith("manifeste-medias-v1.mjs")) {
  const r = analyserMedias();
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    console.log("Sources lues : " + r.nbSources + " ; adresses litterales : " + r.nbLitterales);
    console.log("Adresses litterales MANQUANTES : " + r.manquantes.length);
    for (const m of r.manquantes) console.log("  " + m.url + "  <- " + m.sources.join(", "));
    console.log("Prefixes dynamiques (" + r.prefixesDynamiques.length + ", couvrent " + r.nbFichiersCouvertsParPrefixe + " fichiers) :");
    for (const p of r.prefixesDynamiques) console.log("  " + p);
    console.log("Orphelins : " + r.orphelins.length + " fichiers, " + r.octetsOrphelins + " octets");
    for (const o of r.orphelins) console.log("  " + String(o.octets).padStart(9) + "  " + o.url);
    console.log("Cites par leur seul nom (nom de fichier trouve dans le code, pas d'adresse complete) : " + r.citesParNom.length + " fichiers, " + r.citesParNom.reduce((t, o) => t + o.octets, 0) + " octets");
  }
}
