import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const vrai = Date.now.bind(Date);
let decalage = 0;
Date.now = () => vrai() + decalage;
function partie() {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEAD), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { slot: "b", email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
  run("obtenirEtatSorealIdle");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
  const st = JSON.parse(arr[37] || "{}");
  st.metaNgu.currencies = st.metaNgu.currencies || {};
  st.metaNgu.currencies.gold = 1e15;
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  run.__db = db; run.__sql = sql; return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);


/*
 * Revue de TOUS les menus (Norman, 2026-11-05 : « passe en revue chaque menu et assure-toi qu'aucun menu n'a ce souci » : la barre avançait après le clic qui coupe l'énergie, parce que le moteur créditait l'ancien
 * réglage jusqu'à l'instant où il TRAITE l'ordre). Méthode générale, sans connaître l'indicateur propre à chaque menu : pour chaque geste « arrêter / démarrer / redistribuer une production », deux parties identiques
 * (horloge simulée) sont jouées : A = ordre traité 300 ms après le clic, avec l'instant du clic (clientAt) ; B = ordre traité à l'instant du clic. Une fois ramenées au même instant, les deux états doivent être
 * IDENTIQUES. Un témoin C = comme A mais SANS l'instant du clic prouve que le scénario est sensible (C doit différer de B), sinon le scénario ne teste rien.
 */
let T = 1.9e12;
Date.now = () => T;
const MAX = 1e6;
function creer() {
  const run = partie();
  run("preparerPartieTestSorealIdle", { boss: 140, or: 1e15, systemes: true, energieCap: 1e12, energiePuissance: 1e3, energie: 1e12, magieCap: 1e12, magiePuissance: 1e3, magie: 1e12 });
  const ligne = run.__sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json); const st = JSON.parse(arr[37]);
  for (const k of Object.keys(st.metaNgu.systems)) st.metaNgu.systems[k].unlocked = true;   /* banc d'essai : tous les systèmes ouverts */
  arr[37] = JSON.stringify(st);
  run.__db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const ignore = /((At|Ms|Time|Timestamp|Seen|Sync)$|^(adventure|inventory|inventorySlots|itemSeed|seed|efficiencyPct|mealExpGainPct)$)/;   /* identifiants d'objets tirés au hasard : sans rapport avec les barres */
function diff(a, b, chemin, out) {
  if (out.length > 12) return;
  if (typeof a === "number" && typeof b === "number") { if (Math.abs(a - b) > 1e-9 * Math.max(Math.abs(a), Math.abs(b)) + 1e-12) out.push(chemin + " : " + a + " vs " + b); return; }
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { if (ignore.test(k)) continue; diff(a[k], b[k], chemin + "." + k, out); }
    return;
  }
  if (a !== b) out.push(chemin + " : " + JSON.stringify(a) + " vs " + JSON.stringify(b));
}
function jouer(scenario, retard, avecInstant) {
  T = 1.9e12;
  const run = creer();
  const ctx = scenario.ctx ? scenario.ctx(run) : {};
  for (const p of scenario.demarrer(ctx)) { T += 500; agir(run, p); }
  T += 60000;
  run("synchroniserSorealIdle");
  const clic = T;
  T += retard;
  for (const p of scenario.arreter(ctx)) agir(run, avecInstant ? Object.assign({ clientAt: clic }, p) : p);
  T = clic + 300;
  const fin = run("synchroniserSorealIdle");
  T += 5000;
  const plus = run("synchroniserSorealIdle");
  return { fin: fin.joueur.systemes, plus: plus.joueur.systemes };
}
const al = (system, resource, value) => ({ action: "allocate", system, resource, value });
function ids(run, id, chemin) {
  const s = run("synchroniserSorealIdle").joueur.systemes.systems.find((x) => x.id === id).state.data;
  return Object.keys(chemin.split(".").reduce((o, k) => (k ? o[k] : o), s));
}
const SCENARIOS = [
  { nom: "Machine temporelle (énergie)", demarrer: () => [al("timeMachine", "energy", MAX)], arreter: () => [al("timeMachine", "energy", 0)] },
  { nom: "Machine temporelle (magie)", demarrer: () => [al("timeMachine", "magic", MAX)], arreter: () => [al("timeMachine", "magic", 0)] },
  { nom: "Augmentations (une paire)", demarrer: () => [{ action: "allocateAugment", pair: "scissors", upgrade: false, value: MAX }], arreter: () => [{ action: "allocateAugment", pair: "scissors", upgrade: false, value: 0 }] },
  { nom: "Augmentations (amélioration)", demarrer: () => [{ action: "allocateAugment", pair: "scissors", upgrade: true, value: MAX }], arreter: () => [{ action: "allocateAugment", pair: "scissors", upgrade: true, value: 0 }] },
  { nom: "Augmentations (lot)", demarrer: () => [{ action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: MAX }, { pair: "milk", upgrade: false, value: MAX }] }], arreter: () => [{ action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: 0 }, { pair: "milk", upgrade: false, value: 0 }] }] },
  { nom: "Augmentations (tout retirer)", demarrer: () => [{ action: "allocateAugment", pair: "scissors", upgrade: false, value: MAX }], arreter: () => [{ action: "clearAugmentAllocations" }] },
  { nom: "Entraînement avancé", demarrer: () => [{ action: "allocateAdvancedTraining", track: "power", value: MAX }], arreter: () => [{ action: "allocateAdvancedTraining", track: "power", value: 0 }] },
  { nom: "Entraînement avancé (lot)", demarrer: () => [{ action: "allocateAdvancedTrainings", items: [{ track: "power", value: MAX }, { track: "toughness", value: MAX }] }], arreter: () => [{ action: "allocateAdvancedTrainings", items: [{ track: "power", value: 0 }, { track: "toughness", value: 0 }] }] },
  { nom: "Magie du sang (rituel)", demarrer: () => [{ action: "allocateRitual", ritual: "tack", value: MAX }], arreter: () => [{ action: "allocateRitual", ritual: "tack", value: 0 }] },
  { nom: "Magie du sang (tout retirer)", demarrer: () => [{ action: "allocateRitual", ritual: "tack", value: MAX }], arreter: () => [{ action: "clearRitualAllocations" }] },
  { nom: "Magie du sang (changer de rituel)", demarrer: () => [{ action: "allocateRitual", ritual: "tack", value: MAX }], arreter: () => [{ action: "selectRitual", ritual: "papercuts" }] },
  { nom: "NGU", demarrer: () => [{ action: "allocateNgu", ngu: "augments", value: MAX }], arreter: () => [{ action: "allocateNgu", ngu: "augments", value: 0 }] },
  { nom: "Wandoos (énergie)", demarrer: () => [al("wandoos", "energy", MAX)], arreter: () => [al("wandoos", "energy", 0)] },
  { nom: "Wandoos (magie)", demarrer: () => [al("wandoos", "magic", MAX)], arreter: () => [al("wandoos", "magic", 0)] },
  { nom: "Wandoos (arrêt)", demarrer: () => [al("wandoos", "energy", MAX), { action: "toggle", system: "wandoos", active: true }], arreter: () => [{ action: "toggle", system: "wandoos", active: false }] },
  { nom: "Barbes (énergie)", demarrer: () => [{ action: "toggle", system: "beards", active: true }, al("beards", "energy", MAX)], arreter: () => [al("beards", "energy", 0)] },
  { nom: "Pirates (3e ressource)", ctx: (run) => ({ piste: ids(run, "hacks", "tracks")[0] }), demarrer: (c) => [{ action: "toggle", system: "hacks", active: true }, { action: "selectTrack", system: "hacks", track: c.piste }, al("hacks", "r3", MAX)], arreter: () => [al("hacks", "r3", 0)] },
  { nom: "Souhaits", demarrer: () => [{ action: "toggle", system: "wishes", active: true }, { action: "setWishSlot", slot: 0, wish: "0" }, { action: "allocateWishSlot", slot: 0, resource: "energy", value: MAX }, { action: "allocateWishSlot", slot: 0, resource: "magic", value: MAX }, { action: "allocateWishSlot", slot: 0, resource: "r3", value: MAX }], arreter: () => [{ action: "allocateWishSlot", slot: 0, resource: "energy", value: 0 }] },
  { nom: "Mineurs d'or (arrêt)", demarrer: () => [{ action: "toggle", system: "diggers", active: true }, { action: "setDiggerLevel", digger: "energyNgu", level: 5 }, { action: "toggleDigger", digger: "energyNgu", active: true }, { action: "allocateNgu", ngu: "augments", value: MAX }], arreter: () => [{ action: "toggleDigger", digger: "energyNgu", active: false }] },
  { nom: "Mineurs d'or (niveau)", demarrer: () => [{ action: "toggle", system: "diggers", active: true }, { action: "setDiggerLevel", digger: "energyNgu", level: 5 }, { action: "toggleDigger", digger: "energyNgu", active: true }, { action: "allocateNgu", ngu: "augments", value: MAX }], arreter: () => [{ action: "setDiggerLevel", digger: "energyNgu", level: 0 }] },
  { nom: "Tout reprendre (touche R, énergie)", demarrer: () => [al("timeMachine", "energy", MAX), { action: "allocateNgu", ngu: "augments", value: MAX }], arreter: () => [{ action: "reclaimResource", resource: "energy" }] },
  { nom: "Tout reprendre (touche R, magie)", demarrer: () => [al("timeMachine", "magic", MAX)], arreter: () => [{ action: "reclaimResource", resource: "magic" }] },
];
const insensibles = [], echecs = [];
for (const sc of SCENARIOS) {
  let A, B, C;
  try { B = jouer(sc, 0, false); A = jouer(sc, 300, true); C = jouer(sc, 300, false); }
  catch (e) { echecs.push(sc.nom + " : le scénario ne s'exécute pas (" + String(e && e.message).slice(0, 120) + ")"); continue; }
  const dAB = []; diff(A.fin, B.fin, "fin", dAB); diff(A.plus, B.plus, "plus", dAB);
  if (dAB.length) echecs.push(sc.nom + " : avec l'instant du clic, l'état diffère de l'ordre instantané : " + dAB.slice(0, 4).join(" | "));
  const dCB = []; diff(C.fin, B.fin, "fin", dCB);
  if (!dCB.length) insensibles.push(sc.nom);
}
// Entraînement de base : opération à part (definirAllocationsEntrainementSorealIdle, l'instant du clic en 3e argument).
function entrainementBase(retard, avecInstant, id) {
  T = 1.9e12;
  const run = creer();
  T += 500; run("definirAllocationsEntrainementSorealIdle", { [id]: MAX });
  T += 60000; run("synchroniserSorealIdle");
  const clic = T; T += retard;
  run("definirAllocationsEntrainementSorealIdle", { [id]: 0 }, avecInstant ? clic : undefined);
  T = clic + 300;
  const j = run("synchroniserSorealIdle").joueur;
  T += 5000;
  const plus = run("synchroniserSorealIdle").joueur;
  return { fin: { b: j.basicTraining, e: j.energie }, plus: { b: plus.basicTraining, e: plus.energie } };
}
for (const id of ["blocage", "attaque_passive"]) {
  const B = entrainementBase(0, false, id), A = entrainementBase(300, true, id), C = entrainementBase(300, false, id);
  const dAB = []; diff(A.fin, B.fin, "fin", dAB); diff(A.plus, B.plus, "plus", dAB);
  if (dAB.length) echecs.push("Entraînement de base (" + id + ") : avec l'instant du clic, l'état diffère de l'ordre instantané : " + dAB.slice(0, 3).join(" | "));
  const dCB = []; diff(C.fin, B.fin, "fin", dCB);
  if (!dCB.length) insensibles.push("Entraînement de base (" + id + ")");
}
assert.deepEqual(echecs, [], "menus qui avancent encore après l'ordre :\n  " + echecs.join("\n  "));
/*
 * Gestes dont le retard de traitement ne change rien d'observable dans ce montage (A = B est vérifié quand même) : changer de rituel ne modifie aucune allocation ; l'interrupteur de Wandoos n'arrête pas sa production (elle suit
 * les allocations) ; Barbes, Souhaits et Mineurs d'or n'avancent pas de façon mesurable en 60 s dans ce montage. Une nouvelle entrée doit être justifiée, jamais ajoutée pour faire passer le test.
 */
const SANS_EFFET_MESURABLE = ["Magie du sang (changer de rituel)", "Wandoos (arrêt)", "Barbes (énergie)", "Souhaits", "Mineurs d'or (arrêt)", "Mineurs d'or (niveau)"];
assert.deepEqual(insensibles.filter((n) => !SANS_EFFET_MESURABLE.includes(n)), [], "scénarios qui ne prouvent rien (sans l'instant du clic, aucune différence) :\n  " + insensibles.join("\n  "));
console.log("idle-rythme-instant-clic-tous-menus-v1: OK (" + (SCENARIOS.length - insensibles.length) + " gestes prouvés sensibles ; sans effet mesurable : " + insensibles.join(", ") + ")");
