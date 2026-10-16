import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-10-16) : « l'état du personnage est déterminé par les événements du gameplay, jamais par l'onglet affiché. » Côté MOTEUR :
 *  1. à chaque opération (donc quel que soit le menu consulté), les niveaux de tous les systèmes gagnés depuis la dernière fois sont validés AVANT le calcul des statistiques de combat ;
 *  2. avec chaque état, le serveur annonce la TRAJECTOIRE des multiplicateurs d'attaque et de défense (combatPrincipal.trajectoire), calculée par le même moteur pour TOUS les systèmes
 *     (aucun code propre à chacun) : à l'instant annoncé, le vrai moteur donne exactement la valeur annoncée ; rien ne change : liste vide.
 * Côté client, voir idle-augments-instantanes-v1.
 */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

function partie(agir, preparer) {
  const g = creerJoueurExterneV1("stats" + Math.random().toString(36).slice(2) + "@example.com");
  const run = (op, ...a) => g.op(op, "x", ...a);
  run("obtenirEtatSorealIdle");
  run("definirPseudoSorealIdle", "Stats");
  const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
  // beaucoup d'énergie, de magie et d'Or dans l'état avancé du joueur ; une vraie attaque d'entraînement (le 100 naturel n'est jamais multiplié)
  const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
  const stats = JSON.parse(arr[i]);
  for (const r of ["energy", "magic"]) { const x = stats.metaNgu.resources[r]; x.cap = 1e9; x.capNaturel = 1e9; x.current = 1e9; }
  stats.metaNgu.currencies = Object.assign({}, stats.metaNgu.currencies, { gold: 1e15 });
  stats.entrainementBase.skills.attaque_passive.level = 300;
  if (preparer) preparer(stats);
  arr[i] = JSON.stringify(stats);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  if (agir) run("agirProgressionSorealIdle", agir);
  horloge += 100;
  return run;
}
const cp = (r) => r.joueur.combatPrincipal;
const augments = (r) => r.joueur.systemes.systems.find((x) => x.id === "augmentations").state.data.pairs;
const niveau = (r) => Object.values(augments(r)).reduce((s, p) => s + (p.level || 0), 0);
const proche = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/* Même vérification pour chaque système qui améliore l'attaque : la trajectoire annoncée est celle que le vrai moteur produit. */
function verifierTrajectoire(nom, agir, preparer) {
  const run = partie(agir, preparer);
  const etat = run("obtenirEtatSorealIdle");
  const tr = cp(etat).trajectoire;
  assert.ok(Array.isArray(tr), nom + " : trajectoire présente (liste)");
  assert.ok(tr.length > 0 && tr.length <= 4, nom + " : le moteur annonce un changement à venir (" + JSON.stringify(tr) + ")");
  assert.ok(tr.every((p, k) => p.t > 0 && (k === 0 || p.t > tr[k - 1].t)), nom + " : instants croissants");
  const t0 = horloge;
  for (const p of tr) {
    // un autre joueur identique, avancé jusqu'à cet instant : mêmes valeurs que celles annoncées
    horloge = t0 + p.t;
    const reel = run("obtenirEtatSorealIdle");
    assert.ok(proche(cp(reel).multiplicateurAttaqueTotal, p.a), nom + " : attaque annoncée " + p.a + " = réelle " + cp(reel).multiplicateurAttaqueTotal + " à " + p.t + " ms");
    assert.ok(proche(cp(reel).multiplicateurDefenseTotal, p.d), nom + " : défense annoncée = réelle à " + p.t + " ms");
    horloge = t0;
    run("obtenirEtatSorealIdle");
  }
  return tr;
}
verifierTrajectoire("Augmentations", { action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: 50000 }] });

// NGU (autre système, autre menu) : Power α presque au niveau suivant, de l'énergie placée dessus.
verifierTrajectoire("NGU Power α", { action: "allocateNgu", ngu: "powerAlpha", value: 5000000 }, (stats) => {
  stats.metaNgu.systems.ngu.unlocked = true;
  stats.metaNgu.systems.ngu.data.ngus.normal.powerAlpha = { level: 10, work: 10.99998, allocation: 0, target: 0 };
});

// Rien ne progresse : aucune trajectoire (un seul calcul, au bout de l'horizon).
assert.deepEqual(cp(partie(null)("obtenirEtatSorealIdle")).trajectoire, [], "aucun changement annoncé quand rien ne progresse");

// Test A / E : le temps passe, le joueur ne consulte QUE d'autres opérations (battement, état) : jamais « Augmentations ».
{
  const run = partie({ action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: 50000 }] });
  const avant = run("obtenirEtatSorealIdle");
  const n0 = niveau(avant), pv0 = avant.joueur.pvJoueurMax;
  horloge += 600_000;
  run("battementSorealIdle", { actif: true, connecte: true });
  horloge += 1;
  const etat = run("obtenirEtatSorealIdle");
  assert.ok(niveau(etat) > n0, "les niveaux d'Augmentations ont été validés par une opération ordinaire (" + n0 + " -> " + niveau(etat) + ")");
  assert.ok(etat.joueur.pvJoueurMax > pv0, "la vie max a suivi dans la même opération (" + pv0 + " -> " + etat.joueur.pvJoueurMax + ")");
  // Cohérence : une autre opération immédiate donne exactement les mêmes statistiques (aucune valeur périmée, aucun double comptage).
  const encore = run("obtenirEtatSorealIdle");
  assert.equal(encore.joueur.pvJoueurMax, etat.joueur.pvJoueurMax, "même vie max à l'opération suivante");
  assert.equal(niveau(encore), niveau(etat), "mêmes niveaux");
  assert.equal(cp(encore).multiplicateurAttaqueTotal, cp(etat).multiplicateurAttaqueTotal, "même multiplicateur d'attaque");
  assert.equal(encore.joueur.pvJoueurMax, Math.max(1000, Math.round(encore.joueur.force * 10)), "vie max = attaque × 10 (formule inchangée)");
}

globalThis.Date = VraiDate;
console.log("idle-stats-instantanees-moteur-v1: OK");
