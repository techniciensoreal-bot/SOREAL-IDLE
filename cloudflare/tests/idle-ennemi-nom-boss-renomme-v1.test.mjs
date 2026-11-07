import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { enregistrerTexteV1, invaliderCacheTextesBossV1 } from "../src/idle-textes-v1.js";
import { traduireReponseV1 } from "../src/idle-traductions-v1.js";

/* Norman (2026-11-07) : « dans le journal, certains boss ont leur ancien nom ; 743 poulets furax s'appelle encore 743 coucous furax ». Les ennemis de la zone « Un endroit très étrange » portent des noms de boss : un boss renommé garde son nouveau nom partout. */
function baseVide() {
  const db = new DatabaseSync(":memory:");
  return { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
}
const rep = { ennemi: { nom: "743 pissed off Cuckoos" }, autre: { nom: "An Ordinary Chicken" }, boss: "743 pissed off Cuckoos" };
const sql = baseVide();
invaliderCacheTextesBossV1();
assert.equal(traduireReponseV1(rep, "fr", sql).ennemi.nom, "743 coucous furax", "sans renommage : traduction habituelle");
enregistrerTexteV1(sql, { cle: "boss:90", champs: { nom: "743 poulets furax" } });
invaliderCacheTextesBossV1();
const fr = traduireReponseV1(rep, "fr", sql);
assert.equal(fr.ennemi.nom, "743 poulets furax", "ennemi d'Aventure : nom de remplacement du boss 90");
assert.equal(fr.boss, "743 poulets furax");
assert.equal(fr.autre.nom, "Un poulet ordinaire", "un boss non renommé ne change pas");
assert.equal(traduireReponseV1(rep, "fr").ennemi.nom, "743 coucous furax", "sans base : inchangé");
console.log("idle-ennemi-nom-boss-renomme-v1: OK");
