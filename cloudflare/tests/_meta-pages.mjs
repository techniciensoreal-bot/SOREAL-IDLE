import { readFileSync } from "node:fs";

/*
 * Pages extraites de meta-progression-v130.js (découpage du monolithe, 2026-10-16). Les tests qui vérifient le CODE d'une de ces pages lisent
 * le module méta ET ces fichiers : on ne casse plus un test à chaque nouveau découpage.
 */
export const PAGES_META = [
  "money-pit-page-v1.js", "wishes-page-v1.js", "daycare-page-v1.js", "cards-page-v1.js",
  "yggdrasil-diggers-page-v1.js", "boutique-exp-page-v1.js", "itopod-perks-page-v1.js", "defis-page-v1.js", "augmentations-page-v1.js"
];
export function lirePagesMeta() {
  return PAGES_META.map((f) => "\n" + readFileSync(new URL("../public/modules/" + f, import.meta.url), "utf8")).join("");
}
