import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { assurerHistoiresV1, lireHistoiresV1, IDLE_HISTOIRES_SEED_V1 } from "../src/idle-histoires-v1.js";

/* Norman (2026-10-23) : « supprime l'histoire numéro 2, je ne la veux plus ; mais ne touche pas au texte du boss du gamin sur un nuage ». */
function base() {
  const db = new DatabaseSync(":memory:");
  return { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
}
assert.ok(!IDLE_HISTOIRES_SEED_V1.some((h) => h.id === "MagicienEtLeGrotte2"), "plus dans le seed : jamais recréée");
// Base neuve : une seule histoire.
{ const sql = base(); assert.deepEqual(lireHistoiresV1(sql).map((h) => h.id), ["Intro", "MagicienEtLaGrotte"]); }
// Base de production (histoire 2 présente, drapeau seed_v1 posé) : supprimée une fois, puis plus jamais.
{
  const sql = base(); assurerHistoiresV1(sql);
  sql.exec("DELETE FROM idle_histoires_meta WHERE k='seed_v5'");
  sql.exec("INSERT INTO idle_histoires(id,json,maj) VALUES('MagicienEtLeGrotte2',?,1)", JSON.stringify({ id: "MagicienEtLeGrotte2", titre: "Le Magicien et la Grotte 2", boss: 37, actif: true, voix: [], etapes: [{ texte: "x", image: "legacy:1" }] }));
  assert.ok(lireHistoiresV1(sql).every((h) => h.id !== "MagicienEtLeGrotte2"), "supprimée");
  // une histoire recréée volontairement ensuite avec le même identifiant est respectée (la suppression n'a lieu qu'une fois)
  sql.exec("INSERT INTO idle_histoires(id,json,maj) VALUES('MagicienEtLeGrotte2',?,2)", JSON.stringify({ id: "MagicienEtLeGrotte2", titre: "Nouvelle", boss: null, actif: true, voix: [], etapes: [{ texte: "y", image: "" }] }));
  assert.ok(lireHistoiresV1(sql).some((h) => h.id === "MagicienEtLeGrotte2"));
}
// La chronique du boss 38 n'est pas touchée.
const stories = JSON.parse(readFileSync("design/ngu-boss-stories-fr.json", "utf8"));
assert.match(stories.find((x) => x.id === 38).story, /Les taupes, amochées et couvertes de bleus/);
console.log("idle-histoire-2-supprimee-v1 OK");
