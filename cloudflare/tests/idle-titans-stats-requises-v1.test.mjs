import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : on ne peut pas affronter un titan tant que la Puissance (et l'Endurance) Manuel du wiki n'est pas atteinte : « Montez vos stats avant de penser pouvoir affronter ce Titan ». Contrôlé côté serveur (idle-titan-combat-fight-v1) ET dans l'interface. */
const titans = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8").replace(/\r\n/g, "\n");
const serveur = lireSrc("idle-adventure-v47.js");
assert.ok(serveur.includes('throw Error("PUISSANCE_INSUFFISANTE")') && /N\(stats\.power\)<N\(pre\.tier\.p\)\|\|N\(stats\.toughness\)<N\(pre\.tier\.t\)/.test(serveur), "le serveur refuse le combat de titan sous les stats Manuel");
assert.ok(titans.includes("PUISSANCE_INSUFFISANTE:'Montez vos stats avant de penser pouvoir affronter ce Titan.'"), "message traduit du refus serveur");
assert.ok(titans.includes("var lignes=manque_(t,") && titans.includes("if(lignes){avertirStats_(t,lignes);return;}"), "l'interface vérifie avant d'ouvrir le popup du sac");
assert.ok(titans.indexOf("if(lignes){avertirStats_(t,lignes);return;}") < titans.indexOf("demanderPlace_(t,function(){lancerCombatTitan_(id);});", titans.indexOf("window.__affronterTitanV1__=function(id){")), "stats vérifiées avant le popup du sac");
assert.ok(titans.includes("Montez vos stats avant de penser pouvoir affronter ce Titan.<br>"), "texte du popup de refus");
console.log("idle-titans-stats-requises-v1: OK");
