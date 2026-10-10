import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Demandes de Norman du 2026-10-07 : cadre du prix qui change de couleur, calendrier sans animation répétée, curseurs sans changement de page, écran Wandoos de taille fixe pleine largeur sur téléphone. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const wd = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");

// Prix du trou / de la roue : six teintes qui se suivent, rang = compteur avancé à chaque nouvelle récompense.
for (let i = 0; i < 6; i++) assert.ok(css.includes('.soreal-idle-prize-v206[data-couleur="' + i + '"]{background:linear-gradient('), "teinte " + i);
assert.ok(meta.includes("data-couleur=\"'+couleurPrix+'\"") && meta.includes("soreal_idle_prix_couleur_v1") && meta.includes("couleurPrix=((n%6)+6)%6"), "le rang de couleur avance quand la dernière récompense change");

// Calendrier : l'animation d'allumage ne se joue que pour une case qui vient de s'allumer.
assert.ok(meta.includes(".cal-case-v1.allume.nouveau{animation:calAllumeV1") && !/\.cal-case-v1\.allume\{[^}]*animation:/.test(meta), "plus d'animation sur toutes les cases allumées");
assert.ok(meta.includes("(serieAvant!==null&&i>=serieAvant)?' nouveau':''"), "seule une case dont le rang dépasse la série déjà vue est « nouvelle »");

// Curseurs (volumes des Réglages) : un geste sur un champ n'est jamais un changement de page.
assert.ok(ui.includes("e.target.closest('input,select,textarea,[role=\"slider\"],[data-no-swipe]')") && ui.includes("surChampGlisseV1||"), "le swipe ignore les champs et curseurs");

// Wandoos : écran de taille fixe (l'image du moniteur est carrée), pleine largeur sur téléphone, temps restant seul sous les barres.
assert.ok(wd.includes("height:55.25cqw;") && !wd.includes("min-height:34cqw"), "écran de hauteur fixe");
assert.ok(wd.includes("max-width:none!important;width:100vw;margin-left:calc(50% - 50vw)"), "le moniteur touche les bords du téléphone");
assert.ok(wd.includes("VERSION OS") && !wd.includes("NIVEAU DE L’OS") && wd.includes("'RESTE : '") && !wd.includes("prochain niveau dans"), "Version OS ; seul le temps restant sous les barres");
console.log("idle-puits-roue-reglages-wandoos-v1: OK");
// ITOPOD en mode Auto : « Départ » montre l'étage actuel, pas 0 (la montée ne repart jamais de 0 : seul l'affichage le laissait croire).
assert.ok(meta.includes("const debut=H.idleEntier_(d.startFloor==null?etage:d.startFloor);"), "Départ = étage actuel en mode Auto");
