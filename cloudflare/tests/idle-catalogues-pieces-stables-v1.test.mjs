import assert from "node:assert/strict";
import { IDLE_PIECES_ETAT_CHEMINS_V1, allegerCataloguesV1, empreinteTexteV1 } from "../src/idle-catalogues-v1.js";

/* Audit des synchros (Norman, 2026-10-14) : une réponse pesait ~49 Ko ; les pièces stables supplémentaires sont allégées, sans jamais alléger une pièce qui contient une horloge (elle ne serait jamais « stable »). */
for (const chemin of ["systemes.macguffins.types", "systemes.daycare", "systemes.diggerDefinitions", "systemes.wishSlots", "systemes.resourcePurchases", "basicTraining"]) {
  assert.ok(IDLE_PIECES_ETAT_CHEMINS_V1.includes(chemin), "pièce stable manquante : " + chemin);
}
for (const volatile of ["profil", "systemes.macguffins", "combatPrincipal"]) {
  assert.ok(!IDLE_PIECES_ETAT_CHEMINS_V1.includes(volatile), "pièce à horloge ajoutée par erreur : " + volatile);
}

const joueur = (secondes) => ({
  systemes: { macguffins: { runSeconds: secondes, types: [{ id: "a", nom: "Un" }, { id: "b", nom: "Deux" }] }, daycare: { slots: [1, 2, 3] } },
  basicTraining: { skills: [{ id: "x", niveau: 3 }] },
  profil: { ageSecondes: secondes }
});
/* Première synchro : le client reçoit tout et retient les empreintes. */
const premiere = allegerCataloguesV1({ ok: true, joueur: joueur(10) }, {});
const empreintes = premiere.cataloguesHashes;
assert.ok(empreintes["systemes.macguffins.types"] && empreintes["systemes.daycare"] && empreintes["basicTraining"], "empreintes envoyées");
/* Deuxième synchro, 1 s plus tard : seules les pièces à horloge sont renvoyées. */
const seconde = allegerCataloguesV1({ ok: true, joueur: joueur(11) }, empreintes);
assert.ok(seconde.cataloguesOmis.includes("systemes.macguffins.types") && seconde.cataloguesOmis.includes("systemes.daycare") && seconde.cataloguesOmis.includes("basicTraining"), "pièces stables omises");
assert.equal(seconde.joueur.systemes.macguffins.types, undefined, "types retiré de la réponse");
assert.equal(seconde.joueur.systemes.macguffins.runSeconds, 11, "l'horloge reste dans la réponse");
assert.equal(seconde.joueur.profil.ageSecondes, 11, "le profil reste dans la réponse");
/* Une pièce qui change est renvoyée. */
const change = allegerCataloguesV1({ ok: true, joueur: Object.assign(joueur(12), { basicTraining: { skills: [{ id: "x", niveau: 4 }] } }) }, empreintes);
assert.ok(!change.cataloguesOmis.includes("basicTraining") && change.joueur.basicTraining.skills[0].niveau === 4, "pièce modifiée renvoyée");
assert.equal(typeof empreinteTexteV1("x"), "string");
console.log("Pièces stables des synchros: OK");

/* Doublons de synchro : une synchro ordinaire (non forcée) ne part pas dans les 1,5 s qui suivent une synchro réussie. */
{
  const { readFileSync } = await import("node:fs");
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.ok(/const IDLE_SYNCHRO_ESPACEMENT_MIN_MS_V1=1500;/.test(ui) && /if\(!force&&Date\.now\(\)-idleDerniereSynchroReussieV1<IDLE_SYNCHRO_ESPACEMENT_MIN_MS_V1\)return;/.test(ui), "espacement minimal des synchros ordinaires");
  assert.ok(ui.indexOf("IDLE_SYNCHRO_AFFAMEE_MS_V1)force=true;") < ui.indexOf("IDLE_SYNCHRO_ESPACEMENT_MIN_MS_V1)return;"), "une synchro affamée (forcée) n'est jamais retenue");
}
