import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/*
 * Étape de build du frontend autonome (CI). Elle ne MODIFIE plus aucun fichier public : les scripts sont servis avec « Cache-Control: immutable » sous une adresse versionnée (?v=N, voir
 * cloudflare/tools/maj-pins.mjs), donc leur contenu ne doit jamais changer entre le dernier commit testé et le déploiement. Avant le découpage (2026-10-16), elle injectait le SHA dans une constante
 * de soreal-idle-ui.js ; cette constante vit désormais dans modules/ui-noyau-v1.js et ne sert que de libellé de repli (le badge affiche le numéro des notes de version). Le SHA réellement
 * déployé est vérifié par le workflow (message de déploiement « git:<sha> »), pas par le contenu du script.
 * Elle vérifie seulement que le frontend est complet.
 */
const racine = resolve(process.cwd(), "cloudflare/public");
const sha = String(process.env.GITHUB_SHA || "").trim();
const version = sha ? sha.slice(0, 12) : "local";
for (const f of ["index.html", "soreal-idle-ui.js", "standalone-bridge.js", "modules/ui-noyau-v1.js"]) readFileSync(resolve(racine, f), "utf8");
if (!/const IDLE_TEST_VERSION='[^']*';/.test(readFileSync(resolve(racine, "modules/ui-noyau-v1.js"), "utf8"))) {
  throw new Error("IDLE_TEST_VERSION introuvable dans le frontend autonome.");
}
console.log("SOREAL IDLE standalone UI: version " + version + " (aucun fichier modifié).");
