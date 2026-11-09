import assert from "node:assert/strict";
import fs from "node:fs";
import { scenario, REFS } from "./_synchro-appels-scenario.mjs";

/*
 * SYNCHROS PAR OPÉRATION (audit de cohérence 2026-11-09, § 2 A1). Mesuré sur les parties de référence (horloge gelée, hasard à graine) : obtenirEtat, agirProgression (allocate), synchroniser, battement.
 * `synchros` = nombre d'appels de syncIdleNguState (span « sync:normaliser »), y compris les projections de la trajectoire des multiplicateurs de combat (instants futurs, légitimes). Le fichier de référence
 * references/synchro-appels-avant.json a été enregistré AVANT toute modification : l'état final (ligne du joueur, hors colonne 15 écrite par new Date()) et la réponse de chaque opération doivent rester IDENTIQUES,
 * et le nombre de synchros ne doit jamais AUGMENTER (il peut baisser : mettre alors le fichier à jour avec SOREAL_ECRIRE_REFERENCE=1, après avoir prouvé l'appel supprimé redondant).
 *
 * Appels aujourd'hui conservés (aucun ne peut être prouvé redondant par lecture du code) :
 *  - idle-runtime-progression.js:520 (énergie/NGU de la ligne) : entrée = ligne brute ; l'instant peut être celui du clic du joueur (instantSyncNguV1_), pas Date.now().
 *  - idle-runtime-etat.js:160 (état du joueur) : relit la ligne APRÈS le combat/l'entraînement de l'étape précédente, via un aller-retour JSON ; son contexte (contexteMetaNguSorealIdle_) est reconstruit depuis la ligne mutée
 *    (niveaux d'entraînement, boss) : l'entrée et le contexte diffèrent de la sortie de :520 (mesuré, empreintes différentes).
 *  - idle-ngu-actions.js:89 (geste du joueur) : l'état a été modifié par le geste précédent (allocation...), et l'instant de clic est propre au geste.
 *  - idle-ngu-snapshot.js:103 (vue du client) : seul candidat (entrée identique à la sortie de :160, même contexte, même instant en mesure) MAIS metaNguEtat est encore modifié entre les deux (suppression de
 *    lastAutoFarmSummaryV1, p2 d'idle-runtime-etat.js ; six constructeurs de l'état) et la synchro rend une copie privée normalisée que le snapshot peut lire sans l'aliaser : non prouvé, conservé.
 *  - idle-runtime-etat.js:2070 : instants FUTURS de la trajectoire (+1 s ... +15 s), jamais redondants.
 */
const AVANT = JSON.parse(fs.readFileSync("cloudflare/tests/references/synchro-appels-avant.json", "utf8"));
const ecrire = process.env.SOREAL_ECRIRE_REFERENCE === "1";
const nouveau = {};
for (const nom of REFS) {
  const a = scenario(nom), b = scenario(nom);
  const net = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { synchros: v.synchros, reponse: v.reponse, ligne: v.ligne }]));
  assert.deepEqual(net(a), net(b), nom + " : le scénario est DÉTERMINISTE");
  nouveau[nom] = net(a);
  if (ecrire) continue;
  for (const op of Object.keys(AVANT[nom])) {
    assert.equal(a[op].ligne, AVANT[nom][op].ligne, nom + " / " + op + " : l'état final de la ligne du joueur doit rester IDENTIQUE");
    assert.equal(a[op].reponse, AVANT[nom][op].reponse, nom + " / " + op + " : la réponse doit rester IDENTIQUE");
    assert.ok(a[op].synchros <= AVANT[nom][op].synchros, nom + " / " + op + " : " + a[op].synchros + " synchros pour " + AVANT[nom][op].synchros + " avant (ne doit pas augmenter)");
  }
  assert.equal(a.battement.synchros, 0, nom + " : le battement ne synchronise pas la partie");
}
if (ecrire) { fs.writeFileSync("cloudflare/tests/references/synchro-appels-avant.json", JSON.stringify(nouveau, null, 1) + "\n"); console.log("référence écrite"); }
else console.log("idle-synchro-appels-v1: OK (" + REFS.length + " parties de référence)");
