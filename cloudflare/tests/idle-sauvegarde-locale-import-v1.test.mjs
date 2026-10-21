import assert from "node:assert/strict";
import { monde, ligne, tick, attendre } from "./helpers/monde-local.mjs";

/* Import (audit anti-rollback, Norman, 2026-10-21) : la partie importée est écrite sur l'appareil AVANT le rechargement de la page, même si l'envoi au serveur échoue. */
// 3. Import : la partie importée est écrite sur l'appareil AVANT le rechargement, même si l'envoi échoue.
{
  const w = monde({ echelle: 20, lenteurSortant: 90 });
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  w.push = async () => { throw new Error("hors ligne"); };
  const fichier = { format: "soreal-idle-partie-v1", cells: ligne(100, 9000), serveurAt: 1, nom: "Norman" };
  fichier.cells[37] = "";
  w.win.__lirePartieIdleV1__({ files: [{ size: 100, text: JSON.stringify(fichier) }] });
  await attendre(30);
  await w.win.__chargerPartieIdleV1__(null);
  await attendre(400);
  assert.ok(w.rechargements.length >= 1, "la page est rechargée");
  const copie = w.rechargements[0].find(([k]) => k === "etat:2:n@x");
  assert.equal(copie && copie[1].cells[10], 100, "au moment du rechargement, la partie importée (100) est sur l'appareil");
}

console.log("idle-sauvegarde-locale-import-v1: OK");
