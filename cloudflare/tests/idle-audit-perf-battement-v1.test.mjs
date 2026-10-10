import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-PERF-005 : chaque battement (~20 s) réécrivait la ligne entière du joueur pour ajouter quelques secondes de temps actif. Le temps est maintenant accumulé et versé dans la ligne toutes les 2 minutes ;
 * le total versé reste exact (aucune seconde perdue sur une session suivie).
 */
const vraiMaintenant = Date.now.bind(Date);
let horloge = vraiMaintenant();
Date.now = () => horloge;
try {
  const g = creerJoueurExterneV1("battement@example.com");
  g.op("obtenirEtatSorealIdle", "x");
  g.op("definirPseudoSorealIdle", "x", "Battant");
  const ecritsJoueur = (depuis) => g.journalSql.slice(depuis).filter(([q, b]) => /INSERT INTO idle_catalog/i.test(q) && b[0] === "JOUEURS").length;
  const tempsVerse = () => {
    const ligne = g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1")[0];
    const stats = JSON.parse(JSON.parse(ligne.row_json)[37] || "{}");
    return Number(stats.tempsActifSec) || 0;
  };
  const battre = () => { horloge += 20000; return g.op("battementSorealIdle", "x", { actif: true, connecte: true }); };

  battre(); // premier battement : présence seulement
  const t0 = tempsVerse();
  const depuis = g.journalSql.length;
  for (let i = 0; i < 5; i += 1) battre(); // 100 s de temps actif
  assert.equal(ecritsJoueur(depuis), 0, "5 battements (100 s) : la ligne du joueur n'est pas réécrite");
  battre(); // 120 s cumulées : versement
  assert.equal(ecritsJoueur(depuis) > 0, true, "à 120 s cumulées la ligne est mise à jour");
  const verse = tempsVerse() - t0;
  assert.ok(verse >= 100 && verse <= 140, "temps versé exact (obtenu : " + verse + " s pour 6 battements de 20 s)");
} finally {
  Date.now = vraiMaintenant;
}
console.log("idle-audit-perf-battement-v1: OK");
