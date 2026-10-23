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
// 2. Histoire supprimée : recréée (10 étapes, images historiques).
{
  const sql = base(); assurerHistoiresV1(sql);
  sql.exec("DELETE FROM idle_histoires WHERE id='MagicienEtLeGrotte2'"); ancienne(sql);
  assurerHistoiresV1(sql);
  const h = lireHistoiresV1(sql).find((x) => x.id === "MagicienEtLeGrotte2");
  assert.ok(h && h.etapes.length === 10 && h.boss === 37 && h.etapes.every((e) => /^legacy:\d+$/.test(e.image)));
}
// 3. Déjà rattachée à un autre boss : jamais déplacée.
{
  const sql = base(); assurerHistoiresV1(sql);
  const h = brut(sql, "MagicienEtLeGrotte2"); h.boss = 40; sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(h)); ancienne(sql);
  assurerHistoiresV1(sql);
  assert.equal(brut(sql, "MagicienEtLeGrotte2").boss, 40);
}
// 4. Retraduction : une base qui porte encore l'ancienne traduction la reçoit (voix vidées, images gardées) ; un texte modifié n'est jamais touché.
{
  const sql = base(); assurerHistoiresV1(sql);
  const h = brut(sql, "MagicienEtLeGrotte2");
  h.etapes = h.etapes.map((e, i) => Object.assign({}, e, { texte: i === 0 ? "Les taupes, amochées et couvertes de bleus, te laissent passer… un gaz bleu épais qui stagne." : "ancien " + i }));
  h.voix = ["0123456789abcd"]; sql.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(h)); sql.exec("DELETE FROM idle_histoires_meta WHERE k='seed_v3'");
  assurerHistoiresV1(sql);
  const r = brut(sql, "MagicienEtLeGrotte2");
  assert.match(r.etapes[7].texte, /tu parviens à t'élever dans les airs et tu décolles/, "la phrase qui manquait (le décollage) est là");
  assert.deepEqual(r.voix, [], "voix à refaire");
  assert.equal(r.etapes[9].image, "legacy:10", "images gardées");
  const sql2 = base(); assurerHistoiresV1(sql2);
  const m = brut(sql2, "MagicienEtLeGrotte2"); m.etapes[0].texte = "Texte modifié par l'administrateur."; sql2.exec("UPDATE idle_histoires SET json=? WHERE id='MagicienEtLeGrotte2'", JSON.stringify(m)); sql2.exec("DELETE FROM idle_histoires_meta WHERE k='seed_v3'");
  assurerHistoiresV1(sql2);
  assert.equal(brut(sql2, "MagicienEtLeGrotte2").etapes[0].texte, "Texte modifié par l'administrateur.");
}
console.log("idle-histoire-restauree-v1 OK");
