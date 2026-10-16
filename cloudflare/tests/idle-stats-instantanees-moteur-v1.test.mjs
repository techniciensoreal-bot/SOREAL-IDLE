import assert from "node:assert/strict";

/*
 * Norman (2026-10-16) : « l'état du personnage est déterminé par les événements du gameplay, jamais par l'onglet affiché. » Côté MOTEUR : à chaque opération (n'importe laquelle, donc quel que soit le menu consulté),
 * les niveaux d'Augmentations gagnés depuis la dernière fois sont validés AVANT le calcul des statistiques de combat (attaque, défense, vie max). Cette règle est vérifiée ici sur le vrai moteur ;
 * côté client, voir idle-augments-instantanes-v1.
 */
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

function partie() {
  const g = creerJoueurExterneV1("stats@example.com");
  const run = (op, ...a) => g.op(op, "x", ...a);
  run("obtenirEtatSorealIdle");
  run("definirPseudoSorealIdle", "Stats");
  const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
  // beaucoup d'énergie et d'Or dans l'état avancé du joueur : Augmentations peut acheter des niveaux
  const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
  const stats = JSON.parse(arr[i]);
  stats.metaNgu.resources.energy.cap = 1e9; stats.metaNgu.resources.energy.capNaturel = 1e9; stats.metaNgu.resources.energy.current = 1e9;
  stats.metaNgu.currencies = Object.assign({}, stats.metaNgu.currencies, { gold: 1e15 });
  stats.entrainementBase.skills.attaque_passive.level = 300; // de la vraie attaque d'entraînement : sans elle, le 100 naturel n'est jamais multiplié
  arr[i] = JSON.stringify(stats);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const augments = (r) => r.joueur.systemes.systems.find((x) => x.id === "augmentations").state.data.pairs;
const niveau = (r) => Object.values(augments(r)).reduce((s, p) => s + (p.level || 0), 0);
const pv = (r) => r.joueur.pvJoueurMax;

const run = partie();
run("agirProgressionSorealIdle", { action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: 50000 }] });
const avant = run("obtenirEtatSorealIdle");
assert.ok(avant.ok);
const n0 = niveau(avant), pv0 = pv(avant);

// Le temps passe (Augmentations travaille) ; le joueur ne consulte QUE d'autres opérations (battement, état, clics) : jamais l'action « Augmentations ».
horloge += 600_000;
const apresBattement = run("battementSorealIdle", { actif: true, connecte: true });
horloge += 1;
const etat = run("obtenirEtatSorealIdle");
assert.ok(niveau(etat) > n0, "les niveaux d'Augmentations ont été validés par une opération ordinaire (" + n0 + " -> " + niveau(etat) + ")");
assert.ok(pv(etat) > pv0, "la vie max a suivi dans la même opération (" + pv0 + " -> " + pv(etat) + ")");

// Cohérence : une autre opération immédiate donne exactement les mêmes statistiques (aucune valeur périmée, aucun double comptage).
const encore = run("obtenirEtatSorealIdle");
assert.equal(pv(encore), pv(etat), "même vie max à l'opération suivante");
assert.equal(niveau(encore), niveau(etat), "mêmes niveaux");
assert.equal(encore.joueur.combatPrincipal.multiplicateurAttaqueTotal, etat.joueur.combatPrincipal.multiplicateurAttaqueTotal, "même multiplicateur d'attaque");
assert.equal(pv(encore), Math.max(1000, Math.round(encore.joueur.force * 10)), "vie max = attaque × 10 (formule inchangée)");

globalThis.Date = VraiDate;
console.log("idle-stats-instantanees-moteur-v1: OK");
