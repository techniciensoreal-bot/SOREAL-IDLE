import assert from "node:assert/strict";
import { monde, tick } from "./helpers/monde-local.mjs";

/*
 * Audit anti-rollback, R1 (Norman, 2026-10-21) : deux envois qui se chevauchent (envoi de fermeture pendant un envoi normal) dont les réponses arrivent dans l'ordre inverse.
 * Un accusé comptait « les N premiers événements » : le plus ancien retirait des événements arrivés après son envoi, jamais envoyés. Chaque événement porte maintenant un numéro et
 * l'accusé dit « jusqu'au numéro N » : un accusé tardif ou dans le désordre ne retire jamais un événement plus récent.
 */
const ev = (n) => ({ at: n, type: "boss", donnees: "{}" });
const gain = (n) => ({ at: n, operation: "x", avant: n, apres: n + 1 });

// 1. Réponses inversées : les événements 4 et 5, survenus après les deux envois, ne sont pas perdus.
{
  const w = monde();
  w.etat.flux = [ev(1), ev(2)]; w.etat.gains = [gain(1), gain(2)];
  await w.action(); await tick();
  const portes = []; w.push = () => new Promise((r) => portes.push(() => r({ ok: true, ecrit: true })));
  const e1 = w.ML.envoyerMaintenant();
  await tick();
  w.etat.flux.push(ev(3)); w.etat.gains.push(gain(3)); await w.action(); await tick();
  w.evenement("pagehide");
  await tick();
  assert.deepEqual(w.pushes.map((p) => p.flux.length), [2, 3], "envoi 1 : 2 événements ; envoi de fermeture : 3");
  w.etat.flux.push(ev(4), ev(5)); w.etat.gains.push(gain(4), gain(5));
  portes[1](); await tick();
  portes[0](); await e1; await tick();
  assert.deepEqual(w.etat.flux.map((e) => e.at), [4, 5], "les événements pas encore envoyés restent en file");
  assert.deepEqual(w.etat.gains.map((e) => e.at), [4, 5], "idem pour les gains d'EXP");
}

// 2. Réponses dans l'ordre : tout ce qui a été envoyé est acquitté, rien de plus.
{
  const w = monde();
  w.etat.flux = [ev(1), ev(2)];
  await w.action(); await tick();
  const portes = []; w.push = () => new Promise((r) => portes.push(() => r({ ok: true, ecrit: true })));
  const e1 = w.ML.envoyerMaintenant();
  await tick();
  w.etat.flux.push(ev(3));
  portes[0](); await e1; await tick();
  assert.deepEqual(w.etat.flux.map((e) => e.at), [3], "l'événement survenu pendant l'envoi reste");
}
console.log("idle-sauvegarde-locale-acquits-ordre-v1: OK");
