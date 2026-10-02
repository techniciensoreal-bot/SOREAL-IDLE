import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  normaliserTexteV1,
  lireTextesV1,
  enregistrerTexteV1,
  supprimerTexteV1,
  texteBossSurchargeV1,
  invaliderCacheTextesBossV1,
  surchargesPourJoueurV1
} from "../src/idle-textes-v1.js";

/*
 * Textes éditables par l'administrateur (Norman, 2026-10-02) : chroniques de boss et popups modifiables, voix différentes par balise,
 * stockés côté serveur, globaux (parties A et B).
 */
function baseVide() {
  const db = new DatabaseSync(":memory:");
  return {
    exec(query, ...bindings) {
      const statement = db.prepare(query);
      if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
      statement.run(...bindings);
      return [];
    }
  };
}

// 1. Validation : clé, champs, empreintes de voix.
assert.throws(() => normaliserTexteV1({ cle: "", champs: { texte: "x" } }), /TEXTE_CLE_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "boss 5", champs: { texte: "x" } }), /TEXTE_CLE_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "boss:5", champs: {} }), /TEXTE_CHAMPS_REQUIS/);
assert.throws(() => normaliserTexteV1({ cle: "boss:5", champs: { autre: "x" } }), /TEXTE_BOSS_CHAMP_TEXTE_REQUIS/);
assert.throws(() => normaliserTexteV1({ cle: "boss:1000", champs: { texte: "x" } }), /TEXTE_BOSS_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "boss:0", champs: { texte: "x" } }), /TEXTE_BOSS_INVALIDE/);
assert.throws(() => normaliserTexteV1({ cle: "tuto:1", champs: { "1mauvais": "x" } }), /TEXTE_CHAMP_INVALIDE/);
{
  const t = normaliserTexteV1({ cle: "tuto:debut:2", champs: { titre: "  Salut ", paragraphes: ["a\r\nb", " c "] }, voix: ["0123456789abcd", "pas-un-hash", "0123456789abcd"] });
  assert.deepEqual(t, { cle: "tuto:debut:2", champs: { titre: "Salut", paragraphes: ["a\nb", "c"] }, voix: ["0123456789abcd"] });
}

// 2. Enregistrer / relire / supprimer.
{
  const sql = baseVide();
  assert.deepEqual(lireTextesV1(sql), []);
  enregistrerTexteV1(sql, { cle: "boss:5", champs: { texte: "(marius) Salut ! (femme) Bonjour." }, voix: ["0123456789abcd"] }, 1000);
  enregistrerTexteV1(sql, { cle: "nouveaute:rebirth", champs: { titre: "Rebirth", bullets: ["un", "deux"] } }, 2000);
  const tous = lireTextesV1(sql);
  assert.deepEqual(tous.map((t) => t.cle), ["boss:5", "nouveaute:rebirth"]);
  assert.equal(tous[0].champs.texte, "(marius) Salut ! (femme) Bonjour.");

  // 3. Chronique d'un boss : texte de remplacement, jamais pour un autre boss ; le cache suit les écritures.
  invaliderCacheTextesBossV1();
  assert.equal(texteBossSurchargeV1(sql, 5), "(marius) Salut ! (femme) Bonjour.");
  assert.equal(texteBossSurchargeV1(sql, 6), null);
  assert.equal(texteBossSurchargeV1(null, 5), null);
  enregistrerTexteV1(sql, { cle: "boss:6", champs: { texte: "Autre" } });
  invaliderCacheTextesBossV1();
  assert.equal(texteBossSurchargeV1(sql, 6), "Autre");
  supprimerTexteV1(sql, "boss:6");
  invaliderCacheTextesBossV1();
  assert.equal(texteBossSurchargeV1(sql, 6), null, "supprimée : le texte d'origine revient");

  // 4. Ce que reçoit un joueur : popups modifiés + empreintes ; jamais le texte d'un boss (anti-spoil).
  const p = surchargesPourJoueurV1(sql);
  assert.deepEqual(Object.keys(p.popups), ["nouveaute:rebirth"]);
  assert.deepEqual(p.popups["nouveaute:rebirth"].champs, { titre: "Rebirth", bullets: ["un", "deux"] });
  assert.deepEqual(p.voix, ["0123456789abcd"]);
  assert.ok(!JSON.stringify(p).includes("Salut"), "le texte de la chronique du boss ne quitte pas le serveur par cette voie");
}

// 5. Opérations : joueur (lecture des surcharges) / administrateur (lister, enregistrer, supprimer), contrat à jour, partie B comprise.
{
  const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")).operations;
  for (const op of ["obtenirTextesSurchargesSorealIdle", "listerTextesAdminSorealIdle", "enregistrerTexteAdminSorealIdle", "supprimerTexteAdminSorealIdle"]) {
    assert.match(runtime, new RegExp("^  " + op + ",$", "m"), op + " enregistrée dans IDLE_OPERATIONS");
    assert.ok(contrat.includes(op), op + " dans le contrat");
  }
  for (const nom of ["listerTextesAdminSorealIdle", "enregistrerTexteAdminSorealIdle", "supprimerTexteAdminSorealIdle"]) {
    const f = runtime.slice(runtime.indexOf("function " + nom));
    assert.ok(f.slice(0, f.indexOf("\n}")).includes("exigerAdminHistoiresSorealIdle_(sessionToken)"), nom + " réservée à l'administrateur (adresse réelle du compte : valable en partie A et B)");
  }
  const joueur = runtime.slice(runtime.indexOf("function obtenirTextesSurchargesSorealIdle"), runtime.indexOf("function listerTextesAdminSorealIdle"));
  assert.ok(!joueur.includes("lireTextesV1("), "l'opération joueur ne renvoie jamais la liste complète");
  // La chronique modifiée remplace le catalogue partout où le texte est servi (Fight Boss, Collection, liste des boss).
  assert.equal((runtime.match(/histoireBossAvecSurchargeSorealIdle_\(/g) || []).length >= 5, true);
}

console.log("idle-textes-v1: OK");
