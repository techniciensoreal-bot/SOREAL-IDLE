import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { spansActiver, spansPrelever } from "../src/idle-spans-v1.js";
import { invaliderTrajectoireV1 } from "../src/idle-runtime-etat.js";

/*
 * Norman (2026-10-20 : « l'accélération du moteur sur ma sauvegarde ») : la trajectoire des multiplicateurs de combat (quatre projections complètes de l'état) coûtait la moitié d'une synchro sur un compte qui progresse.
 * Elle est réutilisée jusqu'à 8 s si rien d'autre n'a eu lieu (même joueur, aucune opération de modification entre-temps, multiplicateurs actuels à 0,2 % de ce que la liste annonçait). Garde : (1) une trajectoire
 * réutilisée annonce toujours les valeurs EXACTES du vrai moteur aux instants annoncés (même vérification que idle-stats-instantanees-moteur-v1), (2) une opération de modification, le temps (> 8 s) ou une
 * écriture extérieure de la ligne forcent un nouveau calcul, (3) un combat d'Aventure automatique n'invalide pas.
 */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

const g = creerJoueurExterneV1("traj" + Math.random().toString(36).slice(2) + "@example.com");
const run = (op, ...a) => g.op(op, "x", ...a);
run("obtenirEtatSorealIdle");
run("definirPseudoSorealIdle", "Traj");
const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const arr = JSON.parse(ligne.row_json);
arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
const stats = JSON.parse(arr[i]);
for (const r of ["energy", "magic"]) { const x = stats.metaNgu.resources[r]; x.cap = 1e9; x.capNaturel = 1e9; x.current = 1e9; }
stats.metaNgu.currencies = Object.assign({}, stats.metaNgu.currencies, { gold: 1e15 });
stats.entrainementBase.skills.attaque_passive.level = 300;
arr[i] = JSON.stringify(stats);
g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
run("synchroniserSorealIdle");
run("agirProgressionSorealIdle", { action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: 50000 }] });
horloge += 100;

const cp = (r) => r.joueur.combatPrincipal;
const proche = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const compteurs = () => { const d = spansPrelever(); const n = (k) => (d[k] ? d[k].n : 0); return { reutilisee: n("traj:reutilisee"), calculee: n("traj:calculee"), ecart: n("traj:ecart") }; };
spansActiver(true);

// 1. Premier état (mémoire vidée) : calculé.
invaliderTrajectoireV1();
const e1 = run("synchroniserSorealIdle");
assert.deepEqual(compteurs(), { reutilisee: 0, calculee: 1, ecart: 0 }, "première trajectoire : calculée");
assert.ok(cp(e1).trajectoire.length > 0, "la partie progresse : une trajectoire est annoncée");

// 2. Même joueur, rien d'autre, 300 ms plus tard : réutilisée, et chaque valeur annoncée est celle du vrai moteur à l'instant annoncé.
horloge += 300;
const e2 = run("synchroniserSorealIdle");
const c2 = compteurs();
assert.equal(c2.reutilisee, 1, "trajectoire réutilisée 300 ms plus tard (" + JSON.stringify(c2) + ")");
const tr = cp(e2).trajectoire;
assert.ok(tr.length > 0 && tr.every((p, k) => p.t > 0 && (k === 0 || p.t > tr[k - 1].t)), "instants positifs et croissants après décalage");
const premiers = cp(e1).trajectoire;
assert.ok(tr.every((p) => premiers.some((q) => q.a === p.a && q.d === p.d)), "mêmes valeurs que la liste d'origine, seuls les instants sont décalés");
const t0 = horloge;
for (const p of tr) {
  horloge = t0 + p.t;
  const reel = run("obtenirEtatSorealIdle");
  assert.ok(proche(cp(reel).multiplicateurAttaqueTotal, p.a), "attaque annoncée = réelle à " + p.t + " ms");
  assert.ok(proche(cp(reel).multiplicateurDefenseTotal, p.d), "défense annoncée = réelle à " + p.t + " ms");
  horloge = t0;
  run("obtenirEtatSorealIdle");
}
compteurs();

// 3. Un combat d'Aventure automatique n'invalide pas (lire l'état non plus) ; une vraie opération de modification, si.
horloge += 200;
run("synchroniserSorealIdle");
assert.equal(compteurs().reutilisee >= 1, true, "synchro après des lectures d'état : réutilisée");
run("definirPseudoSorealIdle", "Autre");
horloge += 200;
run("synchroniserSorealIdle");
const c4 = compteurs();
assert.equal(c4.reutilisee, 0, "après une opération de modification : jamais réutilisée (" + JSON.stringify(c4) + ")");
assert.equal(c4.calculee, 1, "recalculée");

// 4. Au-delà de 8 s : recalculée.
horloge += 9000;
run("synchroniserSorealIdle");
assert.equal(compteurs().calculee, 1, "plus de 8 s : recalculée");

// 5. Le code : clé de joueur, compteur d'opérations, invalidation par écriture extérieure.
import { readFileSync } from "node:fs";
const lire = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
assert.ok(lire("../src/idle-sqlite-runtime.js").includes("__opsMutantesV1") && lire("../src/idle-sqlite-runtime.js").includes("combatAventureAuto"));
assert.ok(lire("../local/moteur-local-worker.js").includes("invaliderTrajectoireV1();"), "chargement d'une partie : invalide");
assert.ok(lire("../src/idle-local-sync-v1.js").includes("invaliderTrajectoireV1();"), "écriture de la ligne par le serveur : invalide");

spansActiver(false);
globalThis.Date = VraiDate;
console.log("idle-trajectoire-reutilisee-v1: OK");
