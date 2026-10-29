/*
 * Paquet de code du jeu (celui des mises à jour ET celui que l'installateur embarque) : cloudflare/src, cloudflare/public, cloudflare/contracts et design/, dans un zip déterministe (noms triés, dates fixes).
 * Même fonction pour la construction de l'installateur et pour la publication : si le code n'a pas changé depuis l'installateur, l'empreinte est identique et la mise à jour ne retélécharge pas le code.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ecrireZip } from "./zip.mjs";

const DOSSIERS = [["cloudflare", "src"], ["cloudflare", "public"], ["cloudflare", "contracts"], ["design"]];
/* Le cœur de l'application Windows voyage lui aussi dans la mise à jour (main.js le charge, voir desktop/main.js) : jamais le lanceur main.js, ni maj.mjs et zip.mjs (la vérification des signatures reste celle de l'installateur). */
export const FICHIERS_COEUR = ["desktop/coeur.js", "desktop/preload.js", "desktop/icone.ico", "desktop/src/env-local.mjs", "desktop/src/coffre-medias.mjs", "desktop/src/liaison.mjs", "desktop/src/steam.mjs"];
const exclu = (relatif) => /(^|\/)\.well-known\//.test(relatif) || /\.apk$/i.test(relatif);

export function fichiersDuCode(depot) {
  const sortie = [];
  const parcourir = (dossier, prefixe) => {
    let entrees = [];
    try { entrees = fs.readdirSync(dossier, { withFileTypes: true }); } catch (_e) { return; }
    for (const e of entrees) {
      const relatif = prefixe + e.name;
      if (e.isDirectory()) parcourir(path.join(dossier, e.name), relatif + "/");
      else if (e.isFile() && !exclu(relatif)) sortie.push({ nom: relatif, chemin: path.join(dossier, e.name) });
    }
  };
  for (const d of DOSSIERS) parcourir(path.join(depot, ...d), d.join("/") + "/");
  for (const f of FICHIERS_COEUR) { const chemin = path.join(depot, ...f.split("/")); if (fs.existsSync(chemin)) sortie.push({ nom: f, chemin }); }
  return sortie.sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
}

export function construirePaquetCode(depot) {
  const fichiers = fichiersDuCode(depot);
  const zip = ecrireZip(fichiers.map((f) => ({ nom: f.nom, donnees: fs.readFileSync(f.chemin) })));
  return { zip, sha256: crypto.createHash("sha256").update(zip).digest("hex"), nb: fichiers.length };
}
