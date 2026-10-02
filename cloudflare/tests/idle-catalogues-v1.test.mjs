import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_CATALOGUES_CHEMINS_V1, allegerCataloguesV1, empreinteTexteV1 } from "../src/idle-catalogues-v1.js";

/*
 * Réponses plus légères (Norman, 2026-10-02) : le serveur n'envoie plus les catalogues que le client possède déjà ; le pont du client les remet en place.
 */
const fabriquer = () => ({
  ok: true,
  joueur: {
    nom: "Norman",
    bossVaincus: 3,
    bossCatalogue: [{ numero: 1 }],
    systemes: {
      adventure: { itemCatalog: { a: { n: 1 } }, setCatalog: { s: [1, 2] }, fight: { active: false } },
      perkDefinitions: [{ id: 1 }],
      quirkDefinitions: [{ id: 2 }],
      selloutShop: { items: [1] },
      portraits: [{ id: "p" }]
    }
  }
});

// 1. Sans empreintes du client : réponse complète + empreintes de chaque pièce.
{
  const r = allegerCataloguesV1(fabriquer(), undefined);
  assert.deepEqual(Object.keys(r.cataloguesHashes).sort(), [...IDLE_CATALOGUES_CHEMINS_V1].sort());
  assert.equal(r.cataloguesOmis, undefined);
  assert.deepEqual(r.joueur.systemes.adventure.itemCatalog, { a: { n: 1 } });
}

// 2. Avec les bonnes empreintes : les pièces connues disparaissent, le reste (état du joueur) est intact, l'original n'est pas touché.
{
  const complete = allegerCataloguesV1(fabriquer(), undefined);
  const original = fabriquer();
  const r = allegerCataloguesV1(original, complete.cataloguesHashes);
  assert.deepEqual([...r.cataloguesOmis].sort(), [...IDLE_CATALOGUES_CHEMINS_V1].sort());
  assert.equal(r.joueur.systemes.adventure.itemCatalog, undefined);
  assert.equal(r.joueur.systemes.perkDefinitions, undefined);
  assert.deepEqual(r.joueur.systemes.adventure.fight, { active: false }, "le reste de l'Aventure reste");
  assert.equal(r.joueur.nom, "Norman");
  assert.deepEqual(original.joueur.systemes.adventure.itemCatalog, { a: { n: 1 } }, "l'objet d'origine (peut-être partagé) n'est jamais modifié");
  assert.equal(original.cataloguesHashes, undefined);
}

// 3. Une pièce qui change est renvoyée ; les autres restent omises.
{
  const complete = allegerCataloguesV1(fabriquer(), undefined);
  const modifiee = fabriquer();
  modifiee.joueur.systemes.selloutShop = { items: [1, 2] };
  const r = allegerCataloguesV1(modifiee, complete.cataloguesHashes);
  assert.deepEqual(r.joueur.systemes.selloutShop, { items: [1, 2] });
  assert.ok(!r.cataloguesOmis.includes("systemes.selloutShop") && r.cataloguesOmis.includes("systemes.adventure.itemCatalog"));
  assert.notEqual(r.cataloguesHashes["systemes.selloutShop"], complete.cataloguesHashes["systemes.selloutShop"]);
}

// 4. Réponse sans joueur (opérations d'administration…) ou empreintes absurdes : inchangée / sans danger.
{
  const sans = { ok: true, histoires: [1] };
  assert.equal(allegerCataloguesV1(sans, { x: "y" }), sans);
  const r = allegerCataloguesV1(fabriquer(), { "systemes.portraits": "faux", "n'importe quoi": 3 });
  assert.deepEqual(r.joueur.systemes.portraits, [{ id: "p" }]);
}
assert.equal(empreinteTexteV1("a"), empreinteTexteV1("a"));
assert.notEqual(empreinteTexteV1("a"), empreinteTexteV1("b"));

// 5. Pont du client : garde les pièces, annonce leurs empreintes, remet les pièces omises.
{
  const src = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
  const debut = src.indexOf("const cataloguesV1=");
  const fin = src.indexOf("async function callIdleV1");
  assert.ok(debut > 0 && fin > debut);
  const pont = new Function(src.slice(debut, fin) + "\nreturn {hashes:hashesCataloguesV1,restaurer:restaurerCataloguesV1};")();
  assert.deepEqual(pont.hashes(), {}, "premier appel : rien à annoncer");

  const r1 = allegerCataloguesV1(fabriquer(), pont.hashes());
  const copie1 = JSON.parse(JSON.stringify(r1)); // ce que reçoit le navigateur
  assert.equal(pont.restaurer(copie1), true);
  assert.deepEqual(Object.keys(pont.hashes()).sort(), [...IDLE_CATALOGUES_CHEMINS_V1].sort());

  /* Catalogue réaliste (des milliers d'entrées) : seul le cas d'usage réel rend l'allègement rentable. */
  const gros = () => { const x = fabriquer(); for (let i = 0; i < 2000; i++) x.joueur.systemes.adventure.itemCatalog["objet" + i] = { nom: "Objet numéro " + i, puissance: i * 3 }; return x; };
  const r1g = allegerCataloguesV1(gros(), {});
  assert.equal(pont.restaurer(JSON.parse(JSON.stringify(r1g))), true);
  const copie1g = JSON.stringify(r1g).length;
  const r2 = allegerCataloguesV1(gros(), pont.hashes());
  assert.ok(r2.cataloguesOmis.length === IDLE_CATALOGUES_CHEMINS_V1.length, "tout est omis au 2e appel");
  const copie2 = JSON.parse(JSON.stringify(r2));
  assert.equal(copie2.joueur.systemes.adventure.itemCatalog, undefined, "absent sur le fil");
  const octets2 = JSON.stringify(copie2).length;
  assert.equal(pont.restaurer(copie2), true);
  assert.equal(Object.keys(copie2.joueur.systemes.adventure.itemCatalog).length, 2001, "remis en place pour le jeu");
  assert.deepEqual(copie2.joueur.systemes.perkDefinitions, [{ id: 1 }]);
  assert.deepEqual(copie2.joueur.systemes.adventure.fight, { active: false });
  assert.ok(octets2 < copie1g / 5, "la réponse allégée est au moins 5 fois plus courte : " + octets2 + " < " + copie1g);

  // Pièce omise mais inconnue du pont (cache perdu) : signalé, et plus jamais annoncé tant qu'il ne l'a pas reçue.
  const inconnu = JSON.parse(JSON.stringify(allegerCataloguesV1(fabriquer(), allegerCataloguesV1(fabriquer(), undefined).cataloguesHashes)));
  const vide = new Function(src.slice(debut, fin) + "\nreturn {hashes:hashesCataloguesV1,restaurer:restaurerCataloguesV1};")();
  assert.equal(vide.restaurer(inconnu), false);
  assert.deepEqual(vide.hashes(), {});

  // Câblage : le pont envoie les empreintes ; ne rejoue jamais une action en cas de pièce perdue.
  assert.ok(src.includes("catalogHashes:sansAllegement?undefined:hashesCataloguesV1()"));
  assert.ok(src.includes('callIdleV1("obtenirEtatSorealIdle",[],true)'), "pièce perdue : reprise via un état complet, jamais en rejouant l'action");
}

// 6. Câblage serveur : Worker -> coordinateur -> réponse allégée ; serveur de développement identique.
{
  assert.ok(readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8").includes("catalogHashes:"));
  const coord = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
  assert.ok(coord.includes("allegerCataloguesV1(runSorealIdleOperation(") && coord.includes("payload?.catalogHashes"));
  assert.ok(readFileSync("cloudflare/tools/local-dev-server.mjs", "utf8").includes("allegerCataloguesV1("));
}
// 7. Catalogue des boss (320 Ko mesurés par réponse en production) : omis quand le client le connaît, renvoyé dès qu'il change.
{
  assert.ok(IDLE_CATALOGUES_CHEMINS_V1.includes("bossCatalogue"));
  const avecBoss = (n) => { const x = fabriquer(); x.joueur.bossCatalogue = Array.from({ length: n }, (_, i) => ({ numero: i + 1, histoire: "Texte " + i })); return x; };
  const complete = allegerCataloguesV1(avecBoss(3), undefined);
  const r = allegerCataloguesV1(avecBoss(3), complete.cataloguesHashes);
  assert.equal(r.joueur.bossCatalogue, undefined, "omis quand identique");
  assert.ok(r.cataloguesOmis.includes("bossCatalogue"));
  const r2 = allegerCataloguesV1(avecBoss(4), complete.cataloguesHashes);
  assert.equal(r2.joueur.bossCatalogue.length, 4, "un boss de plus découvert : la pièce est renvoyée");
}
console.log("idle-catalogues-v1: OK");
