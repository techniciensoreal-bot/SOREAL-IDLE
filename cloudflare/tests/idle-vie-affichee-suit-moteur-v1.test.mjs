import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-11-02, journal de diagnostic `vie_saut`) : « ma barre de vie vient de faire un saut en avant et reculer en 1 coup ». Règle n°5 : la vie affichée ne s'écarte jamais visiblement de celle du moteur.
 * Mesures faites avec le vrai moteur (ce test les rejoue) :
 *  1. Combat de boss avec un entraînement de défense qui progresse : le moteur utilisait la défense de FIN de fenêtre pour toute la fenêtre ; une synchro de 47 s rendait 26,9 % des PV max de plus que
 *     47 synchros d'une seconde (le client, lui, avance en continu). Le résultat du moteur ne dépend plus de l'espacement des synchros.
 *  2. Au repos, la régénération du client (défense / 20 par seconde) égale celle du moteur (entraînement figé : même valeur).
 *  3. L'état annonce l'attaque et la défense du boss avec la difficulté du joueur, comme le combat du moteur.
 *  4. Client : la régénération au repos compte le temps réellement écoulé (le tick local est plafonné à 1 s, minuteries ralenties en fenêtre cachée), jamais plus de 10 minutes.
 */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

function creer({ niveau, allocation, combat }) {
  const g = creerJoueurExterneV1("vie" + Math.random().toString(36).slice(2) + "@example.com");
  const run = (op, ...a) => g.op(op, "x", ...a);
  run("obtenirEtatSorealIdle"); run("definirPseudoSorealIdle", "Vie");
  const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 3; arr[4] = 50000; arr[5] = 100000;
  const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
  const stats = JSON.parse(arr[i]);
  for (const r of ["energy", "magic"]) { const x = stats.metaNgu.resources[r]; x.cap = 1e9; x.capNaturel = 1e9; x.current = 1e9; }
  stats.entrainementBase.skills.attaque_passive.level = 300;
  stats.entrainementBase.skills.blocage.level = niveau;
  arr[i] = JSON.stringify(stats);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  if (allocation) run("definirAllocationsEntrainementSorealIdle", { blocage: allocation });
  const l2 = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const a2 = JSON.parse(l2.row_json); a2[26] = Math.round(a2[27] * 0.25);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(a2), l2.id);
  if (combat) run("definirCombatBossSorealIdle", true);
  return run;
}

// 1. Combat quasi équilibré (la défense dépasse à peine l'attaque du boss : la vie bouge peu, donc tout écart se voit), défense qui monte.
{
  const A = creer({ niveau: 905, allocation: 20, combat: true });
  const B = creer({ niveau: 905, allocation: 20, combat: true });
  const a0 = A("synchroniserSorealIdle").joueur; B("synchroniserSorealIdle");
  assert.ok(a0.combatBossActif, "le combat est lancé");
  assert.ok(a0.defense > a0.attaqueBoss * 0.9 && a0.defense < a0.attaqueBoss * 1.2, "scénario : défense et attaque du boss voisines (" + a0.defense + " / " + a0.attaqueBoss + ")");
  const t0 = horloge;
  horloge = t0 + 47_000; const ja = A("synchroniserSorealIdle").joueur;
  let jb;
  for (let s = 1; s <= 47; s += 1) { horloge = t0 + s * 1000; jb = B("synchroniserSorealIdle").joueur; }
  assert.ok(ja.combatBossActif && jb.combatBossActif, "le combat continue des deux côtés");
  assert.ok(jb.defense > a0.defense, "la défense a bien monté pendant la fenêtre (entraînement)");
  const ecart = Math.abs(ja.pvJoueur - jb.pvJoueur) / jb.pvJoueurMax * 100;
  assert.ok(ecart < 3, "une synchro de 47 s = 47 synchros d'1 s (écart " + ecart.toFixed(2) + " % des PV max ; il valait 26,9 % avant)");
}

// 2. Repos : le client régénère défense / 20 par seconde, le moteur donne la même chose (entraînement figé).
{
  const run = creer({ niveau: 300, allocation: 0, combat: false });
  const j0 = run("synchroniserSorealIdle").joueur;
  horloge += 30_000;
  const j1 = run("synchroniserSorealIdle").joueur;
  const attendu = Math.min(j1.pvJoueurMax - j0.pvJoueur, (j0.defense / 20) * 30);
  assert.ok(Math.abs((j1.pvJoueur - j0.pvJoueur) - attendu) <= attendu * 1e-3 + 1, "régénération au repos du moteur = défense / 20 par seconde (client)");
}

// 3 et 4. Sources : difficulté dans l'état, temps réel de repos côté client.
const etat = readFileSync("cloudflare/src/idle-runtime-etat.js", "utf8");
assert.ok(/attaqueBossSorealIdle_\(\s*bossSelectionIndex,\s*metaNguEtat\.difficulty\s*\)/.test(etat), "l'attaque du boss de l'état porte la difficulté du joueur");
assert.ok(/defenseBossSorealIdle_\(\s*bossSelectionIndex,\s*metaNguEtat\.difficulty\s*\)/.test(etat), "la défense du boss de l'état porte la difficulté du joueur");
assert.ok(/attaqueBoss: attaqueBossSorealIdle_\(idx, metaNguEtat\.difficulty\)/.test(etat), "le boss suivant aussi");
const prog = readFileSync("cloudflare/src/idle-runtime-progression.js", "utf8");
assert.ok(/defenseMoyenneFenetreSorealIdle_\(/.test(prog) && /appliquerProgressionEnergieSorealIdle__p5\(bossCombatIndex, bossPv, bossPvMax, defenseSimulation,/.test(prog), "le combat de boss simule avec la défense moyenne de la fenêtre");
const boucle = readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
assert.ok(/mettreAJourJeuIdleLocalV7__p3\(dt,dtRepos\)/.test(boucle) && /const dtRepos=/.test(boucle), "le tick passe le temps réel écoulé à la régénération du repos");
assert.ok(/Math\.min\(\s*600000,/.test(boucle), "temps réel borné à 10 minutes");
assert.ok(/regenPvSecJoueurReposV1\*Math\.max\(dt,idleNombre_\(dtRepos\)\)/.test(boucle), "la régénération du repos utilise ce temps");

globalThis.Date = VraiDate;
console.log("idle-vie-affichee-suit-moteur-v1: OK");
