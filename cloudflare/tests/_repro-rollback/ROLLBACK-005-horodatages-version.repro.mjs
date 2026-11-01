import assert from "node:assert/strict";
import { serveurReel, scenario, COL_N, COL_SYNCHRO } from "./monde-repro.mjs";

/*
 * ROLLBACK-005 : « Dernière synchro » (colonne 16) sert de version dans recevoirDuMoteurLocalV1 (src/idle-local-sync-v1.js). Deux défauts du VRAI code serveur :
 *  (a) égalité : un envoi dont la date est ÉGALE à celle de la ligne du serveur est écrit, quel que soit son contenu : si deux états portent la même milliseconde et arrivent à l'envers,
 *      le plus ancien (contenu) écrase le plus récent ;
 *  (b) tolérance de 15 min vers l'avenir : une date de +10 min est ACCEPTÉE telle quelle (seuil > 15 min) ; tous les envois honnêtes suivants paraissent « plus anciens » et sont refusés
 *      (ecrit:false) pendant 10 min : la progression ne se sauvegarde plus.
 */
function pret() {
  const srv = serveurReel();
  const e = srv.exporter("A");
  const l = JSON.parse(e.joueurs.ligne);
  const etat = (n, instant) => { const c = l.slice(); c[COL_N] = n; c[COL_SYNCHRO] = new Date(instant).toISOString(); return c; };
  return { srv, e, etat, corps: (cells) => ({ cells, flux: [], gains: [], appareil: "A", depuis: e.serveurAt }) };
}

await scenario("005a (deux états de même date, réponses inversées)", async () => {
  const { srv, etat, corps } = pret();
  const T = Date.now() + 5;
  const base = Number(srv.ligne()[COL_N]) || 0;
  srv.recevoir(corps(etat(base + 2, T)));      // l'état RÉCENT (contenu : 2 actions) arrive d'abord
  srv.recevoir(corps(etat(base + 1, T)));      // l'état ANCIEN (contenu : 1 action), même milliseconde, arrive après
  assert.equal(srv.ligne()[COL_N], base + 2, "l'état le plus avancé (n=" + (base + 2) + ") ne doit pas être écrasé par un état plus ancien de même date ; le serveur est à n=" + srv.ligne()[COL_N]);
});

await scenario("005b (date +10 min acceptée puis envois honnêtes refusés)", async () => {
  const { srv, etat, corps } = pret();
  const base = Number(srv.ligne()[COL_N]) || 0;
  const r1 = srv.recevoir(corps(etat(base + 1, Date.now() + 10 * 60 * 1000)));
  const r2 = srv.recevoir(corps(etat(base + 2, Date.now() + 10)));
  assert.equal(r1.ecrit, true, "préalable : l'envoi à +10 min est accepté (sous le seuil de 15 min)");
  assert.equal(r2.ecrit, true, "l'envoi honnête suivant (n=" + (base + 2) + ") doit être écrit ; ecrit=" + r2.ecrit + ", le serveur reste à n=" + srv.ligne()[COL_N]);
});
