import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { normaliserTexteV1, enregistrerTexteV1, supprimerTexteV1, texteBossSurchargeV1, nomBossSurchargeV1, invaliderCacheTextesBossV1 } from "../src/idle-textes-v1.js";

/*
 * Norman (2026-10-03) : « permets-moi aussi d'éditer le nom du boss » (et « il répète 2 fois des passages, il prononce des choses qui n'existent pas » quand il dit ce nom : correctifs du studio
 * de voix dans tools/voice-studio, voir test_decoupe.py). Le nom modifié est affiché PARTOUT (Fight Boss, Collection…) et lu par la voix en tête de la chronique.
 */
function baseVide() {
  const db = new DatabaseSync(":memory:");
  return { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
}

// 1. Validation : un nom seul suffit ; une ligne, 80 caractères au plus ; vide = retiré.
assert.deepEqual(normaliserTexteV1({ cle: "boss:46", champs: { nom: "  Le   Type\nà  Deux Têtes " } }).champs, { nom: "Le Type à Deux Têtes" });
assert.equal(normaliserTexteV1({ cle: "boss:46", champs: { nom: "x".repeat(200) } }).champs.nom.length, 80);
assert.deepEqual(normaliserTexteV1({ cle: "boss:46", champs: { nom: "", texte: "Récit" } }).champs, { texte: "Récit" }, "nom vide : seul le texte reste");
assert.throws(() => normaliserTexteV1({ cle: "boss:46", champs: { nom: "   " } }), /TEXTE_BOSS_CHAMP_TEXTE_REQUIS/, "ni nom ni texte : refusé");
assert.equal(normaliserTexteV1({ cle: "boss:46", champs: { nom: "Nom", texte: "Récit" } }).champs.texte, "Récit");

// 2. Stockage et lecture : le nom est servi, la chronique reste celle d'origine (null) quand seul le nom est modifié.
{
  const sql = baseVide();
  invaliderCacheTextesBossV1();
  assert.equal(nomBossSurchargeV1(sql, 46), null, "aucune surcharge : nom d'origine");
  enregistrerTexteV1(sql, { cle: "boss:46", champs: { nom: "Le Videur Cosmique" } });
  invaliderCacheTextesBossV1();
  assert.equal(nomBossSurchargeV1(sql, 46), "Le Videur Cosmique");
  assert.equal(texteBossSurchargeV1(sql, 46), null, "seul le nom est modifié : la chronique d'origine est conservée");
  enregistrerTexteV1(sql, { cle: "boss:47", champs: { texte: "Récit seul" } });
  invaliderCacheTextesBossV1();
  assert.equal(nomBossSurchargeV1(sql, 47), null, "chronique seule : nom d'origine");
  assert.equal(texteBossSurchargeV1(sql, 47), "Récit seul");
  supprimerTexteV1(sql, "boss:46");
  invaliderCacheTextesBossV1();
  assert.equal(nomBossSurchargeV1(sql, 46), null, "rétablir l'original");
}

// 3. Intégration : le nom modifié sort du moteur (boss courant) ; sans surcharge, c'est le nom NGU français.
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(runtime.includes("nomBossSurchargeV1(__idleSql, i + 1) ||\n        NGU_BOSS_NAMES_FR_V1.get(i + 1)") || runtime.includes("nomBossSurchargeV1(__idleSql, i + 1) ||\r\n        NGU_BOSS_NAMES_FR_V1.get(i + 1)"), "le nom modifié passe avant celui de NGU");
assert.ok(runtime.includes("nomOriginal: nom") && runtime.includes("nom: nomActuel"), "la liste Admin donne le nom actuel ET l'original");

// 4. Éditeur : champ « Nom du boss » (une ligne), lu avec la chronique, rétabli avec elle.
const client = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
assert.ok(client.includes("{id:'nom',label:'Nom du boss (affiché et prononcé)',type:'ligne'}"));
assert.ok(client.includes("t.composerChronique(nomLu,v.texte)"), "la voix lit le nom modifié");
assert.ok(client.includes("{nom:b.nomOriginal||b.nom,texte:b.original}"), "le champ est prérempli avec le nom d'origine");
assert.ok(client.includes("b.nom=(surcharge&&surcharge.champs&&surcharge.champs.nom)||b.nomOriginal||b.nom;"), "la liste reflète le nom enregistré");

// 5. Studio de voix : correctifs de la lecture du nom (coupe de la double prononciation, baratin inventé), vérifiés par test_decoupe.py.
const studio = readFileSync("cloudflare/tools/voice-studio/serveur.py", "utf8");
assert.ok(studio.includes("silence\n    dont la parole qui le précède se rapproche le plus de la MOITIÉ") || studio.includes("dont la parole qui le précède se rapproche le plus de la MOITIÉ"), "double prononciation : coupe au silence du milieu de la parole");
assert.ok(studio.includes("def retirer_queue_inventee(") && studio.includes("DUREE_MARGE_COURT_S = 0.5") && studio.includes("SEUIL_SEGMENT_COURT = 60"), "texte court : baratin retiré, marge réduite");
assert.ok(studio.includes("wav, queue_coupee = retirer_queue_inventee(wav, m.sr, segment)"), "appliqué à chaque génération");
console.log("idle-boss-nom-editable-v1 OK");
