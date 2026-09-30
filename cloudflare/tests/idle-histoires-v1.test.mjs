import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  IDLE_HISTOIRES_SEED_V1,
  assurerHistoiresV1,
  lireHistoiresV1,
  enregistrerHistoireV1,
  supprimerHistoireV1,
  histoireDuBossV1,
  normaliserHistoireV1,
  urlImageEtapeV1
} from "../src/idle-histoires-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";
import { readFileSync } from "node:fs";

/*
 * Histoires plein écran éditables depuis le menu Admin (Norman, 2026-09-30) : stockage serveur, déclenchement par boss numéroté,
 * migration des deux premières histoires, anti-spoil (seule l'histoire du boss demandé quitte le serveur).
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

// 1. Les deux premières histoires sont insérées UNE fois, avec leur identifiant « vu » historique (déjà mémorisé chez les joueurs).
{
  const sql = baseVide();
  const h = lireHistoiresV1(sql);
  assert.equal(h.length, 2);
  const un = h.find((x) => x.id === "MagicienEtLaGrotte");
  const deux = h.find((x) => x.id === "MagicienEtLeGrotte2");
  assert.equal(un.etapes.length, 5);
  assert.equal(deux.etapes.length, 10);
  assert.equal(un.vuId, "histoire:magicienEtLaGrotte", "les joueurs qui ont déjà vu l'histoire 1 ne la revoient pas");
  assert.equal(deux.vuId, "histoire:magicienEtLaGrotte2");
  assert.equal(un.boss, 17, "histoire 1 : à la mort du boss 17 (comme avant)");
  assert.equal(deux.boss, null, "histoire 2 : plus de boss de zone, à assigner dans le menu Admin");
  assert.match(deux.etapes[3].texte, /Stupéfait, tu le vois verser la cannette/, "découpage corrigé de la 2e histoire conservé");
  assert.ok(un.etapes.every((e) => /^legacy:\d+$/.test(e.image)), "images historiques par position");
  // Supprimer une histoire d'origine ne la recrée pas au prochain appel.
  supprimerHistoireV1(sql, "MagicienEtLaGrotte");
  assert.equal(lireHistoiresV1(sql).length, 1);
  assurerHistoiresV1(sql);
  assert.equal(lireHistoiresV1(sql).length, 1, "graine insérée une seule fois");
}

// 2. Enregistrer / relire / valider.
{
  const sql = baseVide();
  const h = enregistrerHistoireV1(sql, { id: "essai-1", titre: "  Mon essai ", boss: 30, actif: true, etapes: [{ texte: "Bonjour\r\nmonde", image: "abc.webp" }, { texte: "", image: "legacy:2" }] });
  assert.equal(h.titre, "Mon essai");
  assert.equal(h.etapes[0].texte, "Bonjour\nmonde");
  assert.equal(lireHistoiresV1(sql).find((x) => x.id === "essai-1").boss, 30);
  assert.throws(() => normaliserHistoireV1({ id: "../x", titre: "a", etapes: [{ texte: "t" }] }), /HISTOIRE_ID_INVALIDE/);
  assert.throws(() => normaliserHistoireV1({ id: "ok", titre: "", etapes: [{ texte: "t" }] }), /HISTOIRE_TITRE_REQUIS/);
  assert.throws(() => normaliserHistoireV1({ id: "ok", titre: "a", etapes: [] }), /HISTOIRE_ETAPES_REQUISES/);
  assert.throws(() => normaliserHistoireV1({ id: "ok", titre: "a", boss: 0, etapes: [{ texte: "t" }] }), /HISTOIRE_BOSS_INVALIDE/);
  assert.throws(() => normaliserHistoireV1({ id: "ok", titre: "a", etapes: [{ texte: "t", image: "../../etc" }] }), /HISTOIRE_IMAGE_INVALIDE/);
  assert.deepEqual(normaliserHistoireV1({ id: "ok", titre: "a", etapes: [{ texte: "t" }], voix: ["0123456789abcd", "pas-une-empreinte"] }).voix, ["0123456789abcd"]);
  // Éditer une histoire d'origine sans renvoyer son vuId le conserve.
  const sql2 = baseVide();
  lireHistoiresV1(sql2);
  const edite = enregistrerHistoireV1(sql2, { id: "MagicienEtLaGrotte", titre: "Renommée", boss: 17, etapes: [{ texte: "x", image: "legacy:1" }] });
  assert.equal(edite.vuId, "histoire:magicienEtLaGrotte");
}

// 3. Un seul boss actif par histoire ; une histoire désactivée ne bloque pas.
{
  const sql = baseVide();
  enregistrerHistoireV1(sql, { id: "a", titre: "A", boss: 40, etapes: [{ texte: "t" }] });
  try {
    enregistrerHistoireV1(sql, { id: "b", titre: "B", boss: 40, etapes: [{ texte: "t" }] });
    assert.fail("le boss 40 a déjà une histoire active");
  } catch (e) {
    assert.equal(e.message, "HISTOIRE_BOSS_DEJA_UTILISE");
    assert.equal(e.autre, "A");
  }
  enregistrerHistoireV1(sql, { id: "b", titre: "B", boss: 40, actif: false, etapes: [{ texte: "t" }] });
  enregistrerHistoireV1(sql, { id: "a", titre: "A", boss: 41, etapes: [{ texte: "t" }] });
  enregistrerHistoireV1(sql, { id: "b", titre: "B", boss: 40, etapes: [{ texte: "t" }] });
}

// 4. Anti-spoil : le joueur ne reçoit QUE l'histoire du boss demandé, sans image « legacy » brute ni texte des autres.
{
  const sql = baseVide();
  enregistrerHistoireV1(sql, { id: "secrete", titre: "Secrète", boss: 90, etapes: [{ texte: "Texte secret", image: "z.png" }] });
  assert.equal(histoireDuBossV1(sql, 55), null, "aucune histoire pour ce boss");
  assert.equal(histoireDuBossV1(sql, 0), null);
  const h = histoireDuBossV1(sql, 90);
  assert.equal(h.id, "secrete");
  assert.deepEqual(h.etapes, [{ texte: "Texte secret", imageUrl: "/api/idle/media/story-image?id=secrete&f=z.png" }]);
  assert.ok(!JSON.stringify(histoireDuBossV1(sql, 17)).includes("Texte secret"), "l'histoire d'un autre boss ne contient rien de la secrète");
  const un = histoireDuBossV1(sql, 17);
  assert.equal(un.etapes[0].imageUrl, "/api/idle/media/story?id=MagicienEtLaGrotte&index=1");
  assert.equal(urlImageEtapeV1("x", ""), "");
}

// 5. Opérations exposées : le joueur peut demander l'histoire d'un boss, mais jamais lister/écrire ; contrat machine à jour.
{
  const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  for (const op of ["obtenirHistoireBossSorealIdle", "listerHistoiresAdminSorealIdle", "enregistrerHistoireAdminSorealIdle", "supprimerHistoireAdminSorealIdle"]) {
    assert.match(runtime, new RegExp("^  " + op + ",$", "m"), op + " enregistrée dans IDLE_OPERATIONS");
    assert.ok(JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")).operations.includes(op), op + " dans le contrat");
  }
  const bloc = runtime.slice(runtime.indexOf("function exigerAdminHistoiresSorealIdle_"), runtime.indexOf("const IDLE_OPERATIONS={"));
  assert.match(bloc, /ADMIN_SOREAL_IDLE_EMAIL\) throw new Error\('SOREAL_IDLE_ADMIN_REQUIS'\)/);
  for (const nom of ["listerHistoiresAdminSorealIdle", "enregistrerHistoireAdminSorealIdle", "supprimerHistoireAdminSorealIdle"]) {
    const f = bloc.slice(bloc.indexOf("function " + nom));
    assert.ok(f.slice(0, f.indexOf("\n}")).includes("exigerAdminHistoiresSorealIdle_(sessionToken)"), nom + " réservée à l'administrateur");
  }
  const joueur = bloc.slice(bloc.indexOf("function obtenirHistoireBossSorealIdle"), bloc.indexOf("function listerHistoiresAdminSorealIdle"));
  assert.ok(!joueur.includes("lireHistoiresV1"), "l'opération joueur ne renvoie jamais la liste complète");
  assert.equal(typeof runSorealIdleOperation, "function");
}

console.log("idle-histoires-v1: OK");
