import assert from "node:assert/strict";
import { serveurReel, monde, tick, attendre, scenario, COL_N } from "./monde-repro.mjs";

/*
 * ROLLBACK-006 : import de partie par fichier, envoi au serveur en échec, rechargement de la page (moteur-local-v1.js __chargerPartieIdleV1__).
 * La page écrit bien la partie importée dans IndexedDB avant de se recharger (protection ajoutée le 2026-10-21, test idle-sauvegarde-locale-import-v1 : verte).
 * Mais au rechargement, demarrer() compare cette copie à la ligne exportée par le serveur, dont la « Dernière synchro » est l'instant de l'export (voir ROLLBACK-A1) : la copie est écartée,
 * la partie importée disparaît, alors que l'écran avait annoncé « Partie chargée sur cet appareil (l'envoi au serveur se fera tout seul) ».
 */
await scenario("006 (import, envoi en échec, rechargement)", async () => {
  const srv = serveurReel();
  const exp1 = srv.exporter();
  const base = Number(JSON.parse(exp1.joueurs.ligne)[COL_N]) || 0;
  const store = new Map();
  const w1 = monde({ exp: exp1, store, serveur: srv });
  await w1.demarrer(); await tick();
  w1.push = async () => { throw new Error("hors ligne"); };
  const fichierCells = JSON.parse(exp1.joueurs.ligne); fichierCells[COL_N] = base + 100;
  const fichier = { format: "soreal-idle-partie-v1", cells: fichierCells, serveurAt: Date.now() - 1000, nom: "Norman" };
  w1.win.__lirePartieIdleV1__({ files: [{ size: 100, text: JSON.stringify(fichier) }] });
  await attendre(30);
  await w1.win.__chargerPartieIdleV1__(null);
  await attendre(60);
  assert.ok(w1.rechargements.length >= 1, "préalable : la page se recharge");
  const avant = w1.rechargements[0].find(([k]) => k === w1.cle);
  assert.equal(avant && avant[1].cells[COL_N], base + 100, "préalable : au rechargement, la partie importée est dans IndexedDB");
  // Rechargement : le serveur est de nouveau joignable.
  const w2 = monde({ exp: srv.exporter(), store, serveur: srv });
  await w2.demarrer(); await tick();
  assert.equal(w2.etat.n, base + 100, "la partie importée (n=" + (base + 100) + ") doit survivre au rechargement ; le moteur repart à n=" + w2.etat.n);
});
