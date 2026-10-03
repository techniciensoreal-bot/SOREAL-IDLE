import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_CATALOGUES_CHEMINS_V1, IDLE_PIECES_ETAT_CHEMINS_V1, IDLE_TABLEAUX_CHEMINS_V1, allegerCataloguesV1, empreinteTexteV1 } from "../src/idle-catalogues-v1.js";

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
  assert.ok(coord.includes("allegerCataloguesV1(traduireReponseV1(runSorealIdleOperation(") && coord.includes("payload?.catalogHashes"));
  assert.ok(readFileSync("cloudflare/tools/local-dev-server.mjs", "utf8").includes("allegerCataloguesV1("));
}
// 7. Catalogue des boss (320 Ko mesurés par réponse en production, 3 lignes sur 300 qui changent) : omis LIGNE PAR LIGNE.
{
  assert.ok(IDLE_TABLEAUX_CHEMINS_V1.includes("bossCatalogue") && !IDLE_CATALOGUES_CHEMINS_V1.includes("bossCatalogue"));
  const avecBoss = (n, puissance = 1) => { const x = fabriquer(); x.joueur.bossCatalogue = Array.from({ length: n }, (_, i) => ({ numero: i + 1, histoire: "Texte " + i + " ".repeat(50), puissanceMinimum: i === 3 ? puissance : 7 })); return x; };
  const complete = allegerCataloguesV1(avecBoss(30), undefined);
  assert.equal(complete.joueur.bossCatalogue.length, 30, "premier appel : tout");
  assert.equal(complete.tableauxGardes, undefined);
  const r = allegerCataloguesV1(avecBoss(30), complete.cataloguesHashes);
  assert.equal(r.tableauxGardes.bossCatalogue.length, 0, "rien n'a changé : aucune ligne envoyée");
  assert.ok(r.joueur.bossCatalogue.every((l) => l === null) && r.joueur.bossCatalogue.length === 30);
  const r2 = allegerCataloguesV1(avecBoss(30, 2), complete.cataloguesHashes);
  assert.deepEqual(r2.tableauxGardes.bossCatalogue, [3], "seule la ligne modifiée est envoyée");
  assert.equal(r2.joueur.bossCatalogue[3].puissanceMinimum, 2);
  const r3 = allegerCataloguesV1(avecBoss(31), complete.cataloguesHashes);
  assert.ok(r3.tableauxGardes.bossCatalogue.includes(30), "un boss de plus : la nouvelle ligne est envoyée");
  assert.equal(allegerCataloguesV1(avecBoss(5), undefined).cataloguesHashes["bossCatalogue[]"], undefined, "petit tableau : pas concerné");

  // Pont : remet les lignes en place, copies neuves.
  const src = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
  const debut = src.indexOf("const cataloguesV1=");
  const fin = src.indexOf("async function callIdleV1");
  const pont = new Function(src.slice(debut, fin) + "\nreturn {hashes:hashesCataloguesV1,restaurer:restaurerCataloguesV1};")();
  const filaire = (rep) => JSON.parse(JSON.stringify(rep));
  const p1 = filaire(allegerCataloguesV1(avecBoss(30), pont.hashes()));
  assert.equal(pont.restaurer(p1), true);
  assert.ok(typeof pont.hashes()["bossCatalogue[]"] === "string");
  const p2 = filaire(allegerCataloguesV1(avecBoss(30, 2), pont.hashes()));
  assert.equal(p2.joueur.bossCatalogue[0], null, "ligne inchangée : absente du fil");
  assert.equal(pont.restaurer(p2), true);
  assert.equal(p2.joueur.bossCatalogue.length, 30);
  assert.equal(p2.joueur.bossCatalogue[0].numero, 1, "ligne remise en place");
  assert.equal(p2.joueur.bossCatalogue[3].puissanceMinimum, 2, "ligne modifiée : valeur du serveur");
  p2.joueur.bossCatalogue[0].numero = 999; // le jeu modifie sur place
  const p3 = filaire(allegerCataloguesV1(avecBoss(30, 2), pont.hashes()));
  assert.equal(pont.restaurer(p3), true);
  assert.equal(p3.joueur.bossCatalogue[0].numero, 1, "copie neuve : la modification locale n'a pas contaminé la mémoire");
  // Mémoire perdue (ligne annoncée comme connue mais absente) : réponse complète demandée.
  const vide = new Function(src.slice(debut, fin) + "\nreturn {hashes:hashesCataloguesV1,restaurer:restaurerCataloguesV1};")();
  assert.equal(vide.restaurer(filaire(allegerCataloguesV1(avecBoss(30), pont.hashes()))), false);
  assert.equal(vide.hashes()["bossCatalogue[]"], undefined);
}

// 8. Pièces d'état stables (Norman, 2026-10-02 : « continue à alléger au maximum ») : omises quand identiques, copie NEUVE rendue au client (il modifie ces objets sur place).
{
  const gros = (n) => { const x = fabriquer(); const sy = x.joueur.systemes; sy.achievements = { list: Array.from({ length: 40 }, (_, i) => ({ id: i, name: "Succès " + i })) }; sy.expShop = [{ id: "a", n }]; sy.systems = []; sy.systems[7] = { unlocked: true, data: "x".repeat(1500) }; sy.systems[8] = { petit: 1 }; for (let i = 0; i < 7; i++) sy.systems[i] = { i }; return x; };
  const complete = allegerCataloguesV1(gros(1), undefined);
  assert.ok(complete.cataloguesVifs.includes("systemes.achievements") && complete.cataloguesVifs.includes("systemes.expShop"));
  assert.ok(complete.cataloguesVifs.includes("systemes.systems.7") && !complete.cataloguesVifs.includes("systemes.systems.8"), "seul un système assez gros est une pièce");
  assert.ok(!IDLE_CATALOGUES_CHEMINS_V1.includes("systemes.achievements") && IDLE_PIECES_ETAT_CHEMINS_V1.includes("systemes.achievements"));
  const r = allegerCataloguesV1(gros(1), complete.cataloguesHashes);
  assert.equal(r.joueur.systemes.achievements, undefined);
  assert.equal(r.joueur.systemes.systems[7], null, "élément omis d'un tableau : null, jamais un trou");
  assert.ok(Array.isArray(r.joueur.systemes.systems) && r.joueur.systemes.systems.length === 9, "le tableau garde sa forme");
  assert.deepEqual(r.joueur.systemes.systems[8], { petit: 1 }, "les petits systèmes voyagent toujours");
  const modifie = allegerCataloguesV1(gros(2), complete.cataloguesHashes);
  assert.deepEqual(modifie.joueur.systemes.expShop, [{ id: "a", n: 2 }], "une pièce modifiée est renvoyée");
  assert.equal(modifie.joueur.systemes.achievements, undefined, "les autres restent omises");

  // Pont : la remise en place rend une copie neuve ; modifier la copie du jeu n'abîme pas la mémoire du pont.
  const src = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
  const debut = src.indexOf("const cataloguesV1=");
  const fin = src.indexOf("async function callIdleV1");
  const pont = new Function(src.slice(debut, fin) + "\nreturn {hashes:hashesCataloguesV1,restaurer:restaurerCataloguesV1};")();
  const rep1 = JSON.parse(JSON.stringify(allegerCataloguesV1(gros(1), pont.hashes())));
  assert.equal(pont.restaurer(rep1), true);
  const rep2 = JSON.parse(JSON.stringify(allegerCataloguesV1(gros(1), pont.hashes())));
  assert.equal(rep2.joueur.systemes.achievements, undefined);
  assert.equal(pont.restaurer(rep2), true);
  assert.equal(rep2.joueur.systemes.achievements.list.length, 40);
  rep2.joueur.systemes.achievements.list.length = 0; // le jeu modifie sur place
  rep2.joueur.systemes.systems[7].unlocked = false;
  const rep3 = JSON.parse(JSON.stringify(allegerCataloguesV1(gros(1), pont.hashes())));
  assert.equal(pont.restaurer(rep3), true);
  assert.equal(rep3.joueur.systemes.achievements.list.length, 40, "copie neuve : la modification locale n'a pas contaminé la mémoire");
  assert.equal(rep3.joueur.systemes.systems[7].unlocked, true);
}
console.log("idle-catalogues-v1: OK");
