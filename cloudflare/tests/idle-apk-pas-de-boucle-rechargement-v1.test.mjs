import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-04) : « sur l'APK, le jeu se recharge en boucle au démarrage en disant qu'il a chargé la partie du serveur ». Une partie du serveur déjà chargée (même signature) n'est jamais rechargée : le chargement note sa signature, la décision suivante la compare avant d'adopter. */
const src = readFileSync("cloudflare/public/modules/apk-synchro-v1.js", "utf8");
assert.ok(src.includes("var CLE_ADOPTE='idle_apk_adopte_v1'"), "clé de la signature de la partie adoptée");
assert.ok(src.includes("function signatureServeur(exp,serveur)"), "signature de la partie du serveur");
assert.ok(/ecrire\(CLE_ADOPTE,signatureServeur\(exp,serveur\)\);/.test(src), "le chargement note la signature de ce qu'il a adopté");
assert.ok(/if\(t\.qui==='serveur'&&lire\(CLE_ADOPTE\)===signatureServeur\(r\.exp,r\.serveur\)\)t=\{qui:'local',raison:'deja-adoptee'/.test(src), "même signature : jamais rechargée, la partie du téléphone continue");
assert.ok(src.indexOf("deja-adoptee") < src.indexOf("if(t.qui==='serveur')return adopterServeur"), "la garde passe AVANT l'adoption");
console.log("idle-apk-pas-de-boucle-rechargement-v1: OK");
