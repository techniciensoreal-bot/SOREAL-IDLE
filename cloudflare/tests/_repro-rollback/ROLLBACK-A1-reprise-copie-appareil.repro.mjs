import assert from "node:assert/strict";
import { serveurReel, monde, tick, attendre, scenario, COL_N, COL_SYNCHRO, enMs } from "./monde-repro.mjs";

/*
 * ROLLBACK-A1 (P0) : la copie de l'appareil (IndexedDB) n'est JAMAIS reprise quand le serveur répond.
 * Cause : moteur-local-v1.js demarrer() ne reprend la copie que si `enMs(rec.cells[15]) > enMs(srv[15])`. Or le VRAI export serveur
 * (exporterPourMoteurLocalV1 -> runSorealIdleOperation("obtenirEtatSorealIdle")) RÉÉCRIT la ligne du joueur avec « Dernière synchro » = l'instant de l'export.
 * La copie de l'appareil, écrite avant la fermeture de la page, est donc toujours plus ancienne que la ligne exportée : elle est « mise de côté » (écartée) au lieu d'être reprise.
 * Les tests existants (idle-sauvegarde-locale-*) ne voient pas ce défaut : leur faux serveur donne une « Dernière synchro » fixe (1000, 5000...) au lieu de celle que fabrique le vrai export.
 */

// Contrôle (doit réussir aujourd'hui) : si la ligne du serveur est plus ANCIENNE que la copie, la copie est bien reprise (c'est le cas que les tests existants vérifient).
await scenario("A1-controle (serveur plus ancien que la copie : reprise)", async () => {
  const srv = serveurReel();
  const exp = srv.exporter();
  const base = Number(JSON.parse(exp.joueurs.ligne)[COL_N]) || 0;
  const vieille = JSON.parse(exp.joueurs.ligne); vieille[COL_SYNCHRO] = new Date(Date.now() - 3600 * 1000).toISOString();
  exp.joueurs.ligne = JSON.stringify(vieille);
  const copie = JSON.parse(exp.joueurs.ligne); copie[COL_N] = base + 5; copie[COL_SYNCHRO] = new Date().toISOString();
  const store = new Map([["etat:" + exp.joueurs.index + ":" + exp.user.email, { cells: copie, flux: [], gains: [], at: Date.now() }]]);
  const w = monde({ exp, store, serveur: srv });
  await w.demarrer(); await tick();
  assert.equal(w.etat.n, base + 5, "la progression locale est reprise");
});

// Défaut : le joueur joue, le réseau est coupé (ou la page est fermée avant l'envoi), il rouvre le jeu avec le réseau : la progression locale DOIT revenir.
await scenario("A1 (copie de l'appareil, serveur joignable à la réouverture)", async () => {
  const srv = serveurReel();
  const exp1 = srv.exporter();
  const base = Number(JSON.parse(exp1.joueurs.ligne)[COL_N]) || 0;
  const store = new Map();
  const w1 = monde({ exp: exp1, store, serveur: srv });
  w1.push = async () => { throw new Error("réseau coupé"); };      // l'envoi échoue : rien n'arrive au serveur
  await w1.demarrer();
  for (let i = 0; i < 5; i += 1) await w1.action();
  await tick();
  const copie = store.get(w1.cle);
  assert.equal(copie && copie.cells[COL_N], base + 5, "préalable : la copie de l'appareil contient bien les 5 actions");
  // la page est fermée ; le joueur revient quelques secondes plus tard : le serveur est joignable
  await attendre(30);
  const exp2 = srv.exporter();
  const t_copie = enMs(copie.cells[COL_SYNCHRO]), t_export = enMs(JSON.parse(exp2.joueurs.ligne)[COL_SYNCHRO]);
  const w2 = monde({ exp: exp2, store, serveur: srv });
  await w2.demarrer(); await tick();
  assert.equal(w2.etat.n, base + 5, "la progression locale (n=" + (base + 5) + ") doit être reprise ; le moteur repart à n=" + w2.etat.n +
    " (« Dernière synchro » : copie " + t_copie + " < export du serveur " + t_export + " : copie écartée). Copie écartée conservée : " + Boolean(store.get(w2.cle + ":ecartee")));
});

// Même défaut vu par l'envoi de fermeture : un envoi coupé par le navigateur, copie écrite, réouverture -> les 3 événements d'EXP non reçus sont aussi perdus.
await scenario("A1-evenements (flux et gains non reçus avant fermeture)", async () => {
  const srv = serveurReel();
  const exp1 = srv.exporter();
  const store = new Map();
  const w1 = monde({ exp: exp1, store, serveur: srv });
  w1.push = async () => { throw new Error("coupé"); };
  await w1.demarrer();
  w1.etat.flux.push({ at: 111, type: "boss", donnees: "{}" }); w1.etat.gains.push({ at: 112, operation: "x", avant: 1, apres: 2 });
  await w1.action(); await tick();
  await attendre(30);
  const w2 = monde({ exp: srv.exporter(), store, serveur: srv });
  await w2.demarrer(); await tick();
  assert.equal(w2.etat.flux.length + w2.etat.gains.length, 2, "les événements non reçus doivent être repris avec la copie (reprise = " + (w2.etat.flux.length + w2.etat.gains.length) + ")");
});
