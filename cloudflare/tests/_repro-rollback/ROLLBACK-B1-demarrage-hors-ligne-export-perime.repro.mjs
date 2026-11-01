import assert from "node:assert/strict";
import { serveurReel, monde, tick, attendre, scenario, COL_N } from "./monde-repro.mjs";

/*
 * ROLLBACK-B1 (P0) : démarrage HORS LIGNE sur un export périmé (moteur-local-v1.js : CLE_EXPORT, garderExport, exportGarde, demarrer).
 * `garderExport` n'écrit « export-dernier » (la ligne du joueur telle que le serveur l'a donnée) QU'AU DÉMARRAGE EN LIGNE. Ensuite, chaque envoi réussi EFFACE la copie de la partie
 * (`kv("effacer", cleSauve)`) : l'appareil ne garde plus que la ligne du matin. Si, plus tard dans la journée, le chargement ne reçoit aucune réponse (réseau coupé, ou plus de 25 s :
 * EXPORT_LOCAL_LENT), le moteur démarre sur la ligne du matin ; le premier envoi suivant est accepté par le serveur (« Dernière synchro » plus récente) et ÉCRASE la progression de la journée.
 */
await scenario("B1 (démarrage hors ligne après une journée de jeu envoyée au serveur)", async () => {
  const srv = serveurReel();
  const base = Number(srv.ligne()[COL_N]) || 0;
  const store = new Map();                                            // IndexedDB de l'appareil, conservé entre les deux ouvertures
  // Matin : ouverture en ligne, 5 actions, chacune envoyée avec succès (la copie de l'appareil est alors effacée).
  const w1 = monde({ exp: (a) => srv.exporter(a), store, serveur: srv });
  await w1.demarrer(); await tick();
  for (let i = 0; i < 5; i += 1) { await w1.action(); await tick(); await w1.ML.envoyerMaintenant(); }   /* la copie est écrite 0,4 s après l action, l envoi part 10 s après : on garde cet ordre */
  await tick();
  assert.equal(srv.ligne()[COL_N], base + 5, "préalable : le serveur détient la progression (5)");
  assert.equal(store.has(w1.cle), false, "préalable : la copie de l'appareil a été effacée après l'accusé");
  // Soir : le chargement ne reçoit aucune réponse du serveur (réseau coupé / trop lent).
  await attendre(30);
  const w2 = monde({ exp: null, store, serveur: srv });
  await w2.demarrer(); await tick();
  const demarrage = w2.etat.n;
  // Le joueur joue une action ; le réseau revient ; l'envoi part.
  await w2.action();
  const rep = await w2.ML.envoyerMaintenant();
  const serveurApres = srv.ligne()[COL_N];
  assert.ok(demarrage >= base + 5 && serveurApres >= base + 5,
    "le moteur doit démarrer sur la dernière partie connue (n=" + (base + 5) + ") : il démarre à n=" + demarrage + " (ligne du matin) ; après l'envoi (accepté=" + rep + ") le serveur est à n=" + serveurApres + " au lieu de " + (base + 6) + " : la journée est écrasée");
});
