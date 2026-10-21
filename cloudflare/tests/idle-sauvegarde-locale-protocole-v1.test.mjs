import assert from "node:assert/strict";

/*
 * Protocole de sauvegarde du jeu local (audit anti-rollback, Norman, 2026-10-21) : le VRAI module moteur-local-v1.js tourne dans un faux navigateur (Worker, IndexedDB, fetch simulés) et on vérifie des VALEURS de progression :
 *  - un envoi REFUSÉ par le serveur (ok:true, ecrit:false) n'est jamais pris pour une sauvegarde : la copie de l'appareil (IndexedDB) reste ;
 *  - les événements (flux, gains) ne quittent la file du Worker qu'APRÈS l'accusé du serveur : un échec réseau ne les perd pas ;
 *  - une progression faite PENDANT un envoi n'est jamais effacée par l'accusé de l'envoi précédent ;
 *  - la reprise au démarrage renvoie une copie plus récente que celle du serveur.
 */
import { monde, ligne, tick } from "./helpers/monde-local.mjs";

// 1. Un envoi refusé (ok:true, ecrit:false) n'est PAS une sauvegarde : la copie de l'appareil reste, l'envoi sera retenté.
{
  const w = monde();
  await w.action(); await tick();
  assert.equal(w.store.get("etat:2:n@x").cells[10], 1, "la copie de l'appareil existe après l'action");
  w.push = async () => ({ ok: true, ecrit: false });
  const durable = await w.ML.envoyerMaintenant();
  await tick();
  assert.equal(durable, false, "un envoi refusé n'est jamais annoncé comme sauvegardé");
  assert.equal(w.store.get("etat:2:n@x")?.cells[10], 1, "la copie de l'appareil est conservée quand le serveur refuse");
  assert.ok(w.ML.etatDiag().refus >= 1, "le refus est signalé");
  w.push = async () => ({ ok: true, ecrit: true });
  assert.equal(await w.ML.envoyerMaintenant(), true, "l'envoi retenté aboutit");
  assert.equal(w.pushes.at(-1).cells[10], 1, "le même état est renvoyé");
  await tick();
  assert.equal(w.store.has("etat:2:n@x"), false, "après une écriture confirmée, la copie de l'appareil peut disparaître");
}

// 2. Une progression faite PENDANT l'envoi n'est jamais effacée par l'accusé de l'envoi précédent.
{
  const w = monde();
  await w.action(); await tick();
  let lacher; const porte = new Promise((r) => { lacher = r; });
  w.push = async () => { await porte; return { ok: true, ecrit: true }; };
  const envoi = w.ML.envoyerMaintenant();
  await tick();
  await w.action();                 // deuxième progression pendant l'envoi du premier état
  lacher();
  await envoi; await tick();
  assert.equal(w.pushes[0].cells[10], 1, "le premier envoi portait l'état 1");
  assert.equal(w.store.get("etat:2:n@x")?.cells[10], 2, "l'état 2 est toujours sur l'appareil après l'accusé de l'état 1");
  w.push = async () => ({ ok: true, ecrit: true });
  await w.ML.envoyerMaintenant();
  assert.equal(w.pushes.at(-1).cells[10], 2, "l'état 2 est ensuite envoyé");
}

// 5. Reprise au démarrage : une copie de l'appareil plus récente que celle du serveur est renvoyée avec ses événements.
{
  const w = monde({ ligneServeur: ligne(3, 1000), idb: { cells: ligne(9, 5000), flux: [{ at: 7, type: "boss", donnees: "{}" }], gains: [], at: 1 } });
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  await w.ML.envoyerMaintenant();
  assert.equal(w.pushes[0].cells[10], 9, "la progression de l'appareil (9) l'emporte sur celle du serveur (3)");
  assert.equal(w.pushes[0].flux.length, 1, "ses événements non reçus partent aussi");
}

// 6. Copie de l'appareil plus ANCIENNE que le serveur : le serveur fait foi (autre appareil passé depuis).
{
  const w = monde({ ligneServeur: ligne(30, 9000), idb: { cells: ligne(9, 5000), flux: [], gains: [], at: 1 } });
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  assert.equal(w.etat.n, 30, "l'état du serveur, plus récent, est celui du moteur");
}

console.log("idle-sauvegarde-locale-protocole-v1: OK");
