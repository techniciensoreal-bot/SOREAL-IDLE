import { readFileSync } from "node:fs";

/*
 * soreal-idle-ui.js se découpe en modules de pages (modules/page-*-v1.js, découpage du monolithe, 2026-10-16). Les tests qui vérifient le CODE du frontend
 * lisent le monolithe ET ces modules : un nouveau découpage ne casse plus la lecture. Les modules viennent APRÈS le monolithe (lastIndexOf trouve le vrai code,
 * indexOf trouve d'abord la petite cale laissée dans le monolithe).
 */
export const UI_MODULES = [
  "page-boutique-v1.js",
  "page-collection-v1.js",
  "page-combat-v1.js",
  "page-entrainement-v1.js",
  "page-personnage-v1.js"
];
export function lireUiComplet() {
  const base = readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
  return base + UI_MODULES.map((f) => "\n" + readFileSync(new URL("../public/modules/" + f, import.meta.url), "utf8")).join("");
}
