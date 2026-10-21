import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-21) : « quand je lance SOREAL IDLE depuis l'exe, ça charge « Connexion à SOREAL IDLE » mais rien ne s'affiche ; dans Chrome ça fonctionne directement ».
 * Dans une fenêtre intégrée (application de bureau), la base de l'appareil ou le Worker peut ne jamais répondre : le démarrage du moteur local attendait sans fin et le jeu ne s'ouvrait pas.
 * Garde : chaque attente du démarrage est bornée (base 4 s, export 25 s, Worker 20 s) ; passé le délai, le moteur local est abandonné et le jeu continue en mode serveur. Vérifié dans le navigateur :
 * base qui ne répond jamais -> jeu affiché en 5 s ; Worker qui ne répond jamais -> jeu affiché en mode serveur.
 */
const src = readFileSync(new URL("../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
assert.ok(src.includes("function avecDelai(promesse,ms,code)"), "assistant de délai");
assert.ok(src.includes('}),4000,"IDB_LENTE");') && src.includes('r.onblocked=function(){ko(new Error("IDB_BLOQUEE"));}'), "ouverture de la base bornée (4 s) et blocage signalé");
assert.ok((src.match(/"IDB_LENTE"/g) || []).length >= 2, "lecture et écriture de la base bornées");
assert.ok(src.includes('25000,"EXPORT_LOCAL_LENT"'), "export borné");
assert.ok(src.includes('20000,"MOTEUR_LOCAL_DEMARRAGE_LENT"') && src.includes("worker.terminate()"), "démarrage du Worker borné, Worker arrêté au dépassement");
assert.ok(src.includes("echec=true;raison=String(e&&e.message||e).slice(0,120);return null;"), "au dépassement, le jeu retombe sur le serveur");
console.log("idle-moteur-local-delais-v1: OK");
