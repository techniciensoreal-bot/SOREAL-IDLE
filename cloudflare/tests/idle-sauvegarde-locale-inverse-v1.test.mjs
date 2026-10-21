import assert from "node:assert/strict";
import { monde, ligne, tick, attendre } from "./helpers/monde-local.mjs";

/* Réponses inversées (audit anti-rollback, Norman, 2026-10-21) : le refus tardif d'un ANCIEN envoi n'est pas un refus de la partie actuelle. */
// 2. Réponses inversées : le refus d'un envoi plus ancien, arrivé après l'accusé d'un plus récent, est ignoré.
{
  const w = monde();
  await w.action(); await tick();
  let lacher; const porte = new Promise((r) => { lacher = r; });
  w.push = async (corps, i) => { if (i === 0) { await porte; return { ok: true, ecrit: false }; } return { ok: true, ecrit: true }; };
  const premier = w.ML.envoyerMaintenant();         // révision 1, réponse retenue
  await tick();
  await w.action();                                  // révision 2
  w.evenement("pagehide");                           // envoi de fermeture : part pendant le premier, accusé en premier
  await tick();
  lacher();                                          // le refus de la révision 1 arrive en dernier
  const durable = await premier;
  assert.equal(durable, true, "le refus d'une révision plus ancienne que l'accusée n'inquiète pas la partie actuelle");
  assert.equal(w.ML.etatDiag().refus, 0, "il n'est pas compté comme un refus");
}

console.log("idle-sauvegarde-locale-inverse-v1: OK");
