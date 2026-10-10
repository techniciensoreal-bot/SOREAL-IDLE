import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit du 2026-10-10, anti-spoil côté SERVEUR (règle n°2 d'AGENTS.md) : tests sur la réponse RÉELLE d'un joueur neuf (chemin public), pas sur le code du client. GP-001 : le catalogue d'objets et de sets n'est plus
 * envoyé en entier (406 objets et 47 sets) ; il ne contient que ce que le joueur connaît.
 */
const g = creerJoueurExterneV1("neuf@example.com");
const reponse = g.op("obtenirEtatSorealIdle", "x");
assert.equal(reponse.ok, true);
const adv = reponse.joueur.systemes.adventure;

// GP-001
assert.ok(Object.keys(adv.itemCatalog || {}).length <= 3, "catalogue d'objets : seulement ce qui est connu (obtenu : " + Object.keys(adv.itemCatalog || {}).length + ")");
assert.equal(Object.keys(adv.setCatalog || {}).length, 0, "aucun set pour un joueur sans pièce");
const texte = JSON.stringify(reponse);
for (const nom of ["Set Barbiverse", "Set Mafieux", "Set Espace"]) assert.ok(!texte.includes(nom), "« " + nom + " » ne doit pas être dans la réponse d'un joueur neuf");
assert.ok(texte.length < 150000, "réponse d'un joueur neuf allégée (obtenu : " + texte.length + " octets, avant : 232 000)");
// GP-002 : Augments, rituels, calendrier des déblocages, exigences de difficulté.
const sys = reponse.joueur.systemes;
assert.ok(Array.isArray(sys.augmentations) && sys.augmentations.length <= 1, "Augments : aucune paire détaillée pour un joueur du boss 0 (obtenu : " + (sys.augmentations || []).length + ")");
for (const a of sys.augmentations) assert.equal(a.verrouille, true, "le seul repère est un marqueur opaque");
assert.ok(!("earlyGameTimeline" in sys), "la frise des déblocages n'est plus envoyée");
assert.ok(!("difficultyUnlockRequirements" in sys), "les exigences de difficulté ne sont plus envoyées");
assert.deepEqual(sys.bloodRituals, [], "aucun rituel tant que Blood Magic n'est pas découvert");
for (const mot of ["Safety Scissors", "Woodchipper", "Laser Sword", "Time Machine boss", "earlyGameTimeline"]) assert.ok(!texte.includes(mot), "« " + mot + " » ne doit pas être dans la réponse d'un joueur neuf");
// GP-002, joueur avancé : les paires débloquées sont complètes, le suivant n'est qu'un repère opaque, aucun autre nom.
function joueurAuBoss(email, boss) {
  const h = creerJoueurExterneV1(email);
  h.op("obtenirEtatSorealIdle", "x");
  const ligne = h.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = boss;
  const st = JSON.parse(arr[37] || "{}");
  const meta = (st.metaNgu = st.metaNgu || {});
  meta.records = Object.assign({}, meta.records, { highestBoss: boss });
  arr[37] = JSON.stringify(st);
  h.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  return h.op("obtenirEtatSorealIdle", "x").joueur.systemes.augmentations;
}
const au30 = joueurAuBoss("b30@example.com", 30);
const completes = au30.filter((a) => !a.verrouille);
assert.ok(completes.length >= 2 && completes.every((a) => a.name && a.unlockBoss <= 30), "paires débloquées : complètes");
assert.equal(au30.filter((a) => a.verrouille).length, 1, "un seul repère opaque");
assert.equal(au30[au30.length - 1].verrouille, true, "le repère est en dernier");
assert.deepEqual(Object.keys(au30[au30.length - 1]).sort(), ["id", "unlockBoss", "verrouille"], "le repère ne porte ni nom ni donnée");
const au200 = joueurAuBoss("b200@example.com", 200);
assert.equal(au200.length, 7, "tout débloqué : les 7 paires, sans repère");
assert.ok(au200.every((a) => !a.verrouille && a.name));
console.log("idle-audit-anti-spoil-reponse-v1: OK");
