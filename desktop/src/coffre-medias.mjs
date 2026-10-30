/*
 * Coffre des médias de l'application Windows (Norman, 2026-10-29 : « quand on installe le jeu sur PC, on a accès à toutes les images et sons dans le dossier d'installation ; j'aimerais que ce soit crypté »).
 *
 * Chaque image et chaque son du dossier de l'application (et des mises à jour) est CHIFFRÉ (AES-256-GCM) : ouvert dans l'Explorateur, un lecteur d'images ou un lecteur audio, le fichier est illisible (pas de miniature,
 * « format non reconnu »). Le jeu les déchiffre en mémoire au moment de les servir (point de lecture unique : creerR2, env-local.mjs) ; rien n'est jamais réécrit en clair sur le disque.
 * Format : « SIDL1 » (5 octets) + vecteur d'initialisation aléatoire (12) + étiquette d'authenticité (16) + données chiffrées. Un fichier SANS cet en-tête est lu tel quel (dossier de développement, anciennes installations,
 * fichier déposé par l'administrateur) : rien ne casse pendant la transition. Le fichier garde son nom et sa taille à 33 octets près.
 *
 * Limite assumée : la clé voyage dans l'application (elle doit pouvoir déchiffrer) ; ce coffre arrête le fouinage dans les dossiers et la copie en un clic, pas une personne qui lit le code de l'application ou capture
 * ce que le jeu affiche. Les mêmes images sont d'ailleurs servies par la version web du jeu.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const ENTETE = Buffer.from("SIDL1", "latin1");
const TAILLE_IV = 12, TAILLE_ETIQUETTE = 16;
export const SURCOUT = ENTETE.length + TAILLE_IV + TAILLE_ETIQUETTE;

/* La clé n'est écrite nulle part en un morceau : assemblée et mélangée au moment de s'en servir. */
const MORCEAUX = ["sorealIdle", "·coffre·", "médias", "v1", "§" + (0x5d1e * 7), "Bruxelles"];
let cle = null;
function cleCoffre() {
  if (!cle) cle = crypto.createHash("sha256").update(MORCEAUX.slice().reverse().join("\u0001")).digest();
  return cle;
}

export function estChiffre(octets) {
  return octets.length >= SURCOUT && octets.subarray(0, ENTETE.length).equals(ENTETE);
}

export function chiffrer(octets) {
  const iv = crypto.randomBytes(TAILLE_IV);
  const c = crypto.createCipheriv("aes-256-gcm", cleCoffre(), iv);
  const corps = Buffer.concat([c.update(octets), c.final()]);
  return Buffer.concat([ENTETE, iv, c.getAuthTag(), corps]);
}

/* Rend les octets en clair ; un fichier non chiffré est rendu tel quel. Un fichier chiffré altéré lève une erreur (jamais de contenu faux). */
export function dechiffrer(octets) {
  if (!estChiffre(octets)) return octets;
  const iv = octets.subarray(ENTETE.length, ENTETE.length + TAILLE_IV);
  const etiquette = octets.subarray(ENTETE.length + TAILLE_IV, SURCOUT);
  const d = crypto.createDecipheriv("aes-256-gcm", cleCoffre(), iv);
  d.setAuthTag(etiquette);
  return Buffer.concat([d.update(octets.subarray(SURCOUT)), d.final()]);
}

/* Taille en clair d'un fichier sur le disque, sans le lire en entier : lit les 5 premiers octets. */
export function tailleEnClair(fichier, tailleDisque) {
  if (tailleDisque < SURCOUT) return tailleDisque;
  let fd = -1;
  try {
    fd = fs.openSync(fichier, "r");
    const tete = Buffer.alloc(ENTETE.length);
    fs.readSync(fd, tete, 0, tete.length, 0);
    return tete.equals(ENTETE) ? tailleDisque - SURCOUT : tailleDisque;
  } catch (_e) { return tailleDisque; } finally { if (fd >= 0) try { fs.closeSync(fd); } catch (_e) { /* fermé */ } }
}

export function lireEnClair(fichier) {
  return dechiffrer(fs.readFileSync(fichier));
}

/* Chiffre un fichier en place (écriture atomique) s'il ne l'est pas encore ; vrai s'il a été chiffré. */
export function chiffrerFichier(fichier) {
  const octets = fs.readFileSync(fichier);
  if (estChiffre(octets)) return false;
  const temporaire = fichier + ".chiffre";
  fs.writeFileSync(temporaire, chiffrer(octets));
  fs.renameSync(temporaire, fichier);
  return true;
}

/* Recopie un dossier de médias en le chiffrant (installateur) ; les dossiers « _externes » (bibliothèques et modèles servis tels quels) sont recopiés en clair. Rend { fichiers, octets }. */
export function copierChiffre(source, destination) {
  let fichiers = 0, octets = 0;
  const manifeste = {};   /* clé -> [taille en clair, date] : lu tel quel au lancement (aucun des milliers de fichiers n'a besoin d'être ouvert : env-local.mjs, creerR2) */
  const parcourir = (src, dst, externe) => {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, e.name), d = path.join(dst, e.name);
      if (e.isDirectory()) parcourir(s, d, externe || e.name === "_externes");
      else if (e.isFile()) {
        const contenu = fs.readFileSync(s);
        const enClair = externe || (/\.json$/i.test(e.name) && path.dirname(s) === source);
        const sortie = enClair ? contenu : chiffrer(contenu);
        fs.writeFileSync(d, sortie);
        fichiers += 1; octets += sortie.length;
        if (!externe) manifeste[path.relative(destination, d).split(path.sep).join("/")] = [contenu.length, Math.floor(fs.statSync(d).mtimeMs)];
      }
    }
  };
  parcourir(source, destination, false);
  fs.writeFileSync(path.join(destination, "_inventaire-medias-v1.json"), JSON.stringify({ v: 1, fichiers: manifeste }));
  return { fichiers, octets };
}

/* Chiffre, par petits lots (le jeu reste fluide), tous les médias encore en clair d'un dossier (mises à jour reçues par l'ancien installateur). Rend le nombre de fichiers chiffrés. */
export async function chiffrerDossier(dossier, { lot = 25, pauseMs = 5 } = {}) {
  let n = 0, dansLot = 0;
  const parcourir = async (d, externe) => {
    let entrees = [];
    try { entrees = fs.readdirSync(d, { withFileTypes: true }); } catch (_e) { return; }
    for (const e of entrees) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) await parcourir(f, externe || e.name === "_externes");
      else if (e.isFile() && !externe && !/\.(chiffre|nouveau)$/i.test(e.name) && !/^_/.test(e.name)) {
        try { if (chiffrerFichier(f)) n += 1; } catch (_e) { /* fichier occupé : au prochain démarrage */ }
        if (++dansLot >= lot) { dansLot = 0; await new Promise((r) => setTimeout(r, pauseMs)); }
      }
    }
  };
  await parcourir(dossier, false);
  return n;
}
