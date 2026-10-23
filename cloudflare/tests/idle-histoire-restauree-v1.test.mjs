import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { assurerHistoiresV1, lireHistoiresV1, histoireDuBossV1 } from "../src/idle-histoires-v1.js";

/* Restauration (Norman, 2026-10-23) : l'histoire « Les taupes, amochées et couvertes de bleus… » (Le Magicien et la Grotte 2) ne se jouait plus avant « Un Gamin sur un Nuage ». */
function base() {
  const db = new DatabaseSync(":memory:");
  return { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
}
const brut = (sql, id) => JSON.parse(sql.exec("SELECT json FROM idle_histoires WHERE id=?", id)[0].json);
const ancienne = (sql) => { sql.exec("DELETE FROM idle_histoires_meta WHERE k='seed_v2'"); };   // base d'avant la restauration

// 1. Base existante, histoire sans boss : rattachée à la mort du boss 37 ; textes et voix intacts.
{
  const sql = base(); assurerHistoiresV1(sql);
  const h = brut(sql, "MagicienEtLeGrotte2"); h.boss = null; h.voix = ["0123456789abcd"]; sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(h)); ancienne(sql);
  assurerHistoiresV1(sql);
  const r = histoireDuBossV1(sql, 37);
  assert.ok(r && r.id === "MagicienEtLeGrotte2" && /amochées et couvertes de bleus/.test(r.etapes[0].texte), "elle se joue à la mort du boss 37");
  assert.deepEqual(brut(sql, "MagicienEtLeGrotte2").voix, ["0123456789abcd"], "voix conservées");
  // une seule fois : une réassignation volontaire ensuite est respectée
  const h2 = brut(sql, "MagicienEtLeGrotte2"); h2.boss = null; sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(h2)); assurerHistoiresV1(sql);
  assert.equal(brut(sql, "MagicienEtLeGrotte2").boss, null, "jamais refaite deux fois");
}
// 2. Histoire supprimée : recréée (un seul texte).
{
  const sql = base(); assurerHistoiresV1(sql);
  sql.exec("DELETE FROM idle_histoires WHERE id='MagicienEtLeGrotte2'"); ancienne(sql);
  assurerHistoiresV1(sql);
  const h = lireHistoiresV1(sql).find((x) => x.id === "MagicienEtLeGrotte2");
  assert.ok(h && h.etapes.length === 1 && h.boss === 37 && h.etapes[0].image === "legacy:1");
}
// 3. Déjà rattachée à un autre boss : jamais déplacée.
{
  const sql = base(); assurerHistoiresV1(sql);
  const h = brut(sql, "MagicienEtLeGrotte2"); h.boss = 40; sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(h)); ancienne(sql);
  assurerHistoiresV1(sql);
  assert.equal(brut(sql, "MagicienEtLeGrotte2").boss, 40);
}
// 4. Un seul texte : une base qui porte encore les dix étapes (ancienne traduction ou retraduction) passe à une seule étape, voix vidées ; un texte modifié n'est jamais touché.
for (const debut of ["Les taupes, amochées et couvertes de bleus… un gaz bleu épais qui stagne.", "Les taupes, amochées et couvertes de bleus… un épais gaz bleu qui stagne."]) {
  const sql = base(); assurerHistoiresV1(sql);
  const h = brut(sql, "MagicienEtLeGrotte2");
  h.etapes = Array.from({ length: 10 }, (_, i) => ({ texte: i === 0 ? debut : "étape " + i, image: "legacy:" + (i + 1), parleur: "narrateur" }));
  h.voix = ["0123456789abcd"]; sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(h)); sql.exec("DELETE FROM idle_histoires_meta WHERE k='seed_v4'");
  assurerHistoiresV1(sql);
  const r = brut(sql, "MagicienEtLeGrotte2");
  assert.equal(r.etapes.length, 1);
  assert.ok(/Stupéfait, tu le vois verser la cannette/.test(r.etapes[0].texte) && r.etapes[0].texte.endsWith("Il est temps de lui donner une leçon."), "tout le texte de Norman, en un seul bloc");
  assert.deepEqual(r.voix, [], "voix à refaire");
}
{
  const sql = base(); assurerHistoiresV1(sql);
  const m = brut(sql, "MagicienEtLeGrotte2"); m.etapes = Array.from({ length: 10 }, (_, i) => ({ texte: "Modifié " + i, image: "legacy:" + (i + 1), parleur: "narrateur" })); sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(m)); sql.exec("DELETE FROM idle_histoires_meta WHERE k='seed_v4'");
  assurerHistoiresV1(sql);
  assert.equal(brut(sql, "MagicienEtLeGrotte2").etapes.length, 10, "texte modifié : jamais touché");
}
console.log("idle-histoire-restauree-v1 OK");
