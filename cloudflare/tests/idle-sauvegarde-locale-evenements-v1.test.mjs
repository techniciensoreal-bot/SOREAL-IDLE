import assert from "node:assert/strict";
import { monde, tick } from "./helpers/monde-local.mjs";

/* Événements (flux, gains d'EXP) : ils ne quittent la file du Worker qu'APRÈS l'accusé du serveur (audit anti-rollback, Norman, 2026-10-21). */
// 3. Échec réseau ou HTTP après l'extraction : les événements sont renvoyés, puis acquittés une seule fois.
for (const echec of ["reseau", "refus-http"]) {
  const w = monde();
  w.etat.flux = [{ at: 1, type: "boss", donnees: "{}" }]; w.etat.gains = [{ at: 2, operation: "x", avant: 1, apres: 2 }];
  await w.action(); await tick();
  w.push = async () => { if (echec === "reseau") throw new Error("hors ligne"); return { ok: false, error: "500" }; };
  assert.equal(await w.ML.envoyerMaintenant(), false, echec + " : pas de sauvegarde");
  w.push = async () => ({ ok: true, ecrit: true });
  assert.equal(await w.ML.envoyerMaintenant(), true);
  const dernier = w.pushes.at(-1);
  assert.equal(dernier.flux.length, 1, echec + " : l'événement de flux est renvoyé");
  assert.equal(dernier.gains.length, 1, echec + " : le gain d'EXP est renvoyé");
  await w.action();
  await w.ML.envoyerMaintenant();
  assert.equal(w.pushes.at(-1).flux.length, 0, echec + " : acquitté, il n'est plus renvoyé");
  assert.equal(w.pushes.at(-1).gains.length, 0);
}

// 4. Même quand le serveur refuse la LIGNE (ecrit:false), il a enregistré les événements : ils sont acquittés (pas de doublon).
{
  const w = monde();
  w.etat.flux = [{ at: 1, type: "boss", donnees: "{}" }];
  await w.action(); await tick();
  w.push = async () => ({ ok: true, ecrit: false });
  await w.ML.envoyerMaintenant();
  await w.ML.envoyerMaintenant();
  assert.equal(w.pushes[0].flux.length, 1);
  assert.equal(w.pushes[1].flux.length, 0, "événements déjà reçus : non renvoyés");
}

console.log("idle-sauvegarde-locale-evenements-v1: OK");
