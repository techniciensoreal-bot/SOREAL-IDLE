import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/*
 * CLIQUET (audit de cohérence 2026-11-09, § 2 B1) : le nombre d'appels directs à Math.random( et Date.now( dans cloudflare/src par fichier ne doit jamais AUGMENTER. Remplacer un appel par le hasard / l'horloge du contexte
 * (idle-alea-v1.js) fait baisser le plafond : mettre alors la valeur à jour ici (jamais en hausse). Les valeurs ci-dessous sont celles mesurées le 2026-11-09 ; un fichier absent de la table vaut 0.
 */
const PLAFOND_RANDOM = {
  "idle-adventure-butin.js": 18, "idle-adventure-combat.js": 14, "idle-adventure-objets.js": 1, "idle-ngu-snapshot.js": 3, "idle-ngu-systemes.js": 5, "idle-runtime-progression.js": 1, "idle-worker-entry-v1.js": 1
};
const PLAFOND_DATE_NOW = {
  "idle-adventure-butin.js": 1, "idle-adventure-combat.js": 4, "idle-adventure-v47.js": 2, "idle-basic-training.js": 10, "idle-cards-v1.js": 1, "idle-chat-v1.js": 3, "idle-daycare-v1.js": 2, "idle-flux-v1.js": 3, "idle-gains-v1.js": 1,
  "idle-google-auth-v1.js": 2, "idle-graine-contenu-v1.js": 1, "idle-histoires-v1.js": 2, "idle-instant-clic-v1.js": 1, "idle-itopod-roster-v1.js": 2, "idle-jour-bruxelles-v1.js": 1, "idle-local-sync-v1.js": 15, "idle-macguffins-v1.js": 2,
  "idle-media-v1.js": 7, "idle-ngu-actions.js": 2, "idle-ngu-bonus.js": 3, "idle-ngu-catalogues.js": 1, "idle-ngu-etat.js": 2, "idle-ngu-ressources.js": 1, "idle-ngu-snapshot.js": 2, "idle-ngu-systemes.js": 3, "idle-partie-fichier-v1.js": 2,
  "idle-profil-badavatar-v1.js": 1, "idle-profile-v1.js": 2, "idle-questing-v1.js": 2, "idle-relais-apk-v1.js": 2, "idle-runtime-actions.js": 7, "idle-runtime-admin.js": 3, "idle-runtime-aventure.js": 1, "idle-runtime-boss.js": 2,
  "idle-runtime-catalogue.js": 4, "idle-runtime-classeur.js": 4, "idle-runtime-collection.js": 1, "idle-runtime-combat.js": 2, "idle-runtime-config.js": 3, "idle-runtime-etat.js": 10, "idle-runtime-joueurs.js": 3,
  "idle-runtime-progression.js": 9, "idle-sqlite-runtime.js": 9, "idle-textes-v1.js": 4, "idle-tutoriel-v1.js": 2, "idle-worker-entry-v1.js": 4, "index-idle-coordinator-v1.js": 11
};
const dossier = "cloudflare/src";
const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".js"));
const compter = (txt, motif) => txt.split(motif).length - 1;
const echecs = [];
for (const f of fichiers) {
  const txt = fs.readFileSync(path.join(dossier, f), "utf8");
  for (const [motif, plafonds] of [["Math.random(", PLAFOND_RANDOM], ["Date.now(", PLAFOND_DATE_NOW]]) {
    const n = compter(txt, motif), max = plafonds[f] || 0;
    if (n > max) echecs.push(f + " : " + n + " appels à " + motif + ") pour un plafond de " + max + " -- utilise l'horloge/l'alea du contexte (idle-alea-v1.js)");
  }
}
assert.deepEqual(echecs, [], "\n" + echecs.join("\n"));

/* aleaV1 : le contexte peut fournir un hasard ; sinon c'est Math.random (comportement d'avant). */
const { aleaV1 } = await import("../src/idle-alea-v1.js");
assert.equal(aleaV1(undefined), Math.random);
assert.equal(aleaV1({}), Math.random);
const f = () => 0.5;
assert.equal(aleaV1({ alea: f }), f);
console.log("idle-alea-horloge-cliquet-v1: OK");
