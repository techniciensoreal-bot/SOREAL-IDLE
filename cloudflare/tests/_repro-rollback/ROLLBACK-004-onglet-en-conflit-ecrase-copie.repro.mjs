import assert from "node:assert/strict";
import { serveurReel, monde, tick, attendre, scenario, COL_N } from "./monde-repro.mjs";

/*
 * ROLLBACK-004 (latent, devient actif dès que ROLLBACK-A1 est corrigé) : deux onglets du MÊME navigateur partagent la clé IndexedDB `etat:<index>:<email>`.
 * Un onglet qui a reçu « conflit » (un autre onglet a repris la partie) s'arrête d'envoyer, mais `sauverCopie()` (appelée à la fermeture / mise en arrière-plan) ne regarde jamais `conflit` :
 * il ÉCRASE la copie, plus récente, de l'onglet actif avec son propre état périmé.
 */
await scenario("004 (onglet en conflit : sa fermeture écrase la copie de l'onglet actif)", async () => {
  const srv = serveurReel();
  const store = new Map();
  const base = Number(srv.ligne()[COL_N]) || 0;
  const w1 = monde({ exp: (a) => srv.exporter(a), store, serveur: srv });
  await w1.demarrer(); await w1.action(); await w1.ML.envoyerMaintenant(); await tick();      // onglet 1 : n = base+1, envoyé
  // l'onglet 2 s'ouvre plus tard : son export REVENDIQUE la partie
  const w2 = monde({ exp: (a) => srv.exporter(a), store, serveur: srv });
  w2.push = async () => { throw new Error("réseau coupé"); };                                  // l'onglet 2 joue sans réseau : sa copie est son seul filet
  await w2.demarrer();
  for (let i = 0; i < 4; i += 1) await w2.action();
  await tick();
  const copieOnglet2 = store.get(w2.cle) && store.get(w2.cle).cells[COL_N];
  assert.equal(copieOnglet2, base + 1 + 4, "préalable : la copie de l'onglet 2 contient sa progression");
  await w1.ML.envoyerMaintenant();                                                             // l'onglet 1 découvre le conflit
  assert.equal(w1.ML.etatDiag().conflit, true, "préalable : l'onglet 1 est en conflit");
  w1.evenement("pagehide");                                                                    // il est fermé
  await tick();
  assert.equal(store.get(w2.cle) && store.get(w2.cle).cells[COL_N], copieOnglet2, "la copie de l'onglet actif (n=" + copieOnglet2 + ") ne doit pas être remplacée par celle de l'onglet en conflit ; elle vaut maintenant n=" + (store.get(w2.cle) && store.get(w2.cle).cells[COL_N]));
});
