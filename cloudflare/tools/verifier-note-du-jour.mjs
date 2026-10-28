#!/usr/bin/env node
/*
 * Règle primordiale de Norman (2026-10-28) : « avant chaque push, compare la date du dernier patch note avec la date de Bruxelles, et crée automatiquement un patch note incrémenté ; je ne dois plus jamais avoir à te le rappeler ».
 *   node cloudflare/tools/verifier-note-du-jour.mjs
 * Compare la date de la note la plus récente (cloudflare/public/modules/release-notes-v1.js) à la date du jour À BRUXELLES (Europe/Brussels, heure d'été ou d'hiver comprise : jamais la date UTC ni celle de la machine) :
 *   - même jour  : l'entrée du jour existe, il faut seulement la COMPLÉTER avec ce qui a été fait depuis ;
 *   - note plus ancienne : il faut CRÉER l'entrée du jour (numéro +0,1, date de Bruxelles, `courante` mise à jour, traductions) AVANT de pousser. Sortie en erreur (code 1).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const source = fs.readFileSync(path.join(racine, "cloudflare", "public", "modules", "release-notes-v1.js"), "utf8");
const premier = /versions:\[\s*\{\s*version:'([0-9.]+)',\s*nom:'([^']*)',\s*date:'(\d{4}-\d{2}-\d{2})'/.exec(source);
const courante = /courante:'([0-9.]+)'/.exec(source);
if (!premier || !courante) { console.error("Notes illisibles : entrée de tête ou « courante » introuvable."); process.exit(2); }
const bruxelles = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const [maj, min] = premier[1].split(".").map(Number);
const suivante = min >= 9 ? (maj + 1) + ".0" : maj + "." + (min + 1);
console.log("Dernière note : " + premier[1] + " « " + premier[2] + " » du " + premier[3] + " ; courante : " + courante[1] + " ; aujourd'hui à Bruxelles : " + bruxelles);
if (courante[1] !== premier[1]) { console.error("ERREUR : `courante` (" + courante[1] + ") n'est pas la version de tête (" + premier[1] + ")."); process.exit(2); }
if (premier[3] === bruxelles) { console.log("=> Même jour : compléter l'entrée " + premier[1] + " avec ce qui a été fait depuis."); process.exit(0); }
if (premier[3] > bruxelles) { console.log("=> La note est datée d'un jour À VENIR (" + premier[3] + ") : vérifier la date."); process.exit(1); }
console.error("=> La dernière note date d'un jour précédent : CRÉER l'entrée " + suivante + " du " + bruxelles + " (menus groupés, sans spoil, traduite) AVANT de pousser.");
process.exit(1);
