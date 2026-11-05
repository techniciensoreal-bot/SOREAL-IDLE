#!/usr/bin/env node
/*
 * Fige une PARTIE DE RÉFÉRENCE anonymisée (plan design/ARCHITECTURE-CIBLE.md, § 4).
 *   node cloudflare/tools/figer-partie-reference.mjs <ligne-exportee.json> <nom>
 * <ligne-exportee.json> = la ligne du joueur (38 colonnes) telle que l'exporte le moteur local (window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__.exporterLigne()). Les colonnes d'identité (ID, nom, e-mails) sont remplacées ;
 * tout le reste (progression, inventaire, systèmes) est gardé tel quel. Écrit cloudflare/tests/references/<nom>.json.
 */
import fs from "node:fs";
import path from "node:path";
const [entree, nom] = process.argv.slice(2);
if (!entree || !nom || !/^[a-z0-9-]{1,40}$/.test(nom)) { console.error("usage : node figer-partie-reference.mjs <ligne.json> <nom (a-z, 0-9, -)>"); process.exit(2); }
const ligne = JSON.parse(fs.readFileSync(entree, "utf8"));
if (!Array.isArray(ligne) || ligne.length < 38) { console.error("ligne invalide (38 colonnes attendues)"); process.exit(3); }
const anon = ligne.slice();
anon[0] = "J001"; anon[1] = "Joueur"; anon[18] = "joueur.reference@example.test"; anon[19] = "joueur.reference@example.test";
const texte = JSON.stringify(anon);
if (/[\w.+-]+@(?!example\.test)[\w-]+\.[\w.]+/.test(texte)) { console.error("ARRÊT : une adresse e-mail reste dans la partie."); process.exit(4); }
const sortie = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "tests", "references", nom + ".json");
fs.writeFileSync(sortie, texte);
console.log("partie de référence écrite :", sortie, "(" + Math.round(texte.length / 1024) + " Ko)");
