/* Notes de mise à jour : le fichier principal (release-notes-v1.js) + les versions anciennes découpées (release-notes-anciennes-N-v1.js, le 2026-11-10).
 * Un test qui lit le TEXTE des notes ou leur contenu passe par ici, pour ne jamais oublier les anciennes versions. */
import { readFileSync } from "node:fs";
import vm from "node:vm";
const DOSSIER = "cloudflare/public/modules/";
export const FICHIERS_ANCIENS = ["release-notes-anciennes-1-v1.js", "release-notes-anciennes-2-v1.js"];
export const FICHIER_PRINCIPAL = "release-notes-v1.js";
/** Texte de tous les fichiers de notes, concaténé. */
export function lireNotes() {
  return [...FICHIERS_ANCIENS, FICHIER_PRINCIPAL].map((f) => readFileSync(DOSSIER + f, "utf8")).join("\n");
}
/** Exécute les fichiers dans l'ordre de la page et renvoie l'objet de notes complet. */
export function chargerNotes(extra = {}) {
  const window = { ...extra };
  for (const f of [...FICHIERS_ANCIENS, FICHIER_PRINCIPAL]) vm.runInNewContext(readFileSync(DOSSIER + f, "utf8"), { window });
  return window.__SOREAL_IDLE_RELEASE_NOTES_V1__;
}
