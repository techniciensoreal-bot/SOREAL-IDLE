// Norman (2026-11-02) : « check comment fonctionne chaque étape du Troll Challenge dans NGU Idle et confirme que tout est programmé pour se dérouler comme ça ».
// Source : wiki NGU Idle, page Challenges, « Troll Challenge » et section « Trolls » (relues le 2026-11-02).
//  - « trolls every 120 / 110 / 100 / 90 / 85 / 80 / 75 seconds » selon la complétion (1 à 7) ; « Every fifth troll is a big troll ».
//  - Petits trolls : moitié des niveaux d'augmentations ; tout le sang + multiplicateur de Blood Magic à 1 ; Time Machine à zéro + Diggers éteints ; tout l'or ; 50 boîtes ; toute l'énergie ; toute la magie ;
//    tous les niveaux de « Dump » de Wandoos (page Wandoos : « The Wandoos Troll will reset Dump levels (Small Troll) ») ; le chaton.
//  - Gros trolls : NGU coupés jusqu'au Rebirth + Diggers éteints ; Barbes coupées jusqu'au Rebirth + Diggers éteints ; 75 % de menu au hasard jusqu'au Rebirth ; « tous les petits trolls sauf chaton et boîtes » ;
//    Wandoos coupé jusqu'au Rebirth ; multiplicateur de boss divisé par 2 + complétions du Troll Challenge.
//  - « offline progress is disabled for this challenge ».
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { IDLE_TROLL_INTERVALS_S_V1, trollBossDividerV1, trollFlagsV1, trollNguOffV1 } from "../src/idle-ngu-systemes.js";

const T0 = 1_000_000_000_000;
const CONTEXTE = { bosses: 68 };   /* 68 boss vaincus : juste avant la cible (boss 69), le défi ne se termine donc pas pendant l'essai */
// ordre des réserves de trolls du moteur (petits : 9, gros : 6) : le tirage est forcé par Math.random pour viser un troll précis
const PETITS = ["augments", "blood", "timeMachine", "gold", "boxes", "energy", "magic", "wandoos", "kitty"];
const GROS = ["ngu", "beards", "menu", "ruin", "wandoosOff", "bossDivider"];
const tirage = (liste, id) => () => (liste.indexOf(id) + 0.5) / liste.length;

function depart(termines = 0) {
  const s = normalizeIdleNguState({}, CONTEXTE, T0);
  /* conditions de déblocage : défis ouverts, Grand Corrupted Tree (titan t2) vaincu (wiki : « Unlock Condition(s): Defeat Grand Corrupted Tree! »), objets vus */
  s.systems.challenges.unlocked = true;
  s.records.highestBoss = 68;
  for (const t of ["t2", "t3", "t4"]) s.adventure.titans[t] = Object.assign({}, s.adventure.titans[t], { kills: 1 });
  s.adventure.itemList = s.adventure.itemList || {};
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) s.adventure.itemList["grb:" + slot] = { seen: true };
  s.challenge.bestMs = { basic: 1000 };
  s.challenge.active = "troll";
  s.challenge.startedAt = T0;
  s.challenge.completions = Object.assign({}, s.challenge.completions, { troll: termines });
  s.runStartedAt = T0;
  return s;
}
function avancer(etat, secondes, aleatoire = () => 0.5) {
  const vrai = Math.random;
  Math.random = aleatoire;
  try {
    let s = etat, t = Number(s.updatedAt) || T0;
    for (let i = 0; i < secondes; i += 1) { t += 1000; s = advanceIdleNguState(s, 1, CONTEXTE, t); }
    return s;
  } finally { Math.random = vrai; }
}
/* un état prêt à subir le troll suivant dans 1 seconde (n trolls déjà subis) */
function pret(n, termines = 0) {
  const s = depart(termines);
  s.challenge.troll.count = n;
  s.challenge.troll.timer = IDLE_TROLL_INTERVALS_S_V1[termines] - 1;
  return s;
}
function remplir(s) {
  const a = s.systems.augmentations.data.pairs;
  a.scissors.level = 10; a.scissors.upgradeLevel = 7;
  a.milk.level = 5; a.milk.upgradeLevel = 3;
  s.currencies.blood = 500; s.systems.bloodMagic.data.spells.numberBoost = 7;
  const tm = s.systems.timeMachine.data; tm.speedLevel = 30; tm.goldLevel = 40; tm.speedProgress = 0.5; tm.goldProgress = 0.5;
  for (const d of Object.values(s.systems.diggers.data.diggers)) d.active = true;
  s.currencies.gold = 1e9;
  s.resources.energy.cap = 1e9; s.resources.magic.cap = 1e9;   /* plafonds relevés : sinon les réserves de 1e9 seraient ramenées à 500 et 100 */
  s.resources.energy.current = 1e9; s.resources.magic.current = 1e9;
  const w = s.systems.wandoos.data; w.dumpEnergyLevel = 12; w.dumpMagicLevel = 9; w.osLevels.consumed98 = 7;
  return s;
}

// 1. le rythme : trolls toutes les 120, 110, 100, 90, 85, 80, 75 s selon la complétion en cours (wiki : « beat boss 69, trolls every 120 seconds » ... « boss 159, every 75 seconds »)
assert.deepEqual([...IDLE_TROLL_INTERVALS_S_V1], [120, 110, 100, 90, 85, 80, 75], "intervalles du wiki");
for (let done = 0; done < 7; done += 1) {
  const iv = IDLE_TROLL_INTERVALS_S_V1[done];
  let s = avancer(depart(done), iv - 1);
  assert.equal(s.challenge.troll.count, 0, `complétion ${done + 1} : aucun troll avant ${iv} s`);
  s = avancer(s, 1);
  assert.equal(s.challenge.troll.count, 1, `complétion ${done + 1} : le premier troll tombe à ${iv} s`);
}

// 2. « Every fifth troll is a big troll »
for (const n of [0, 1, 2, 3]) {
  const s = avancer(pret(n), 1, tirage(PETITS, "kitty"));
  assert.equal(s.challenge.troll.last.big, false, `troll n° ${n + 1} : petit`);
}
{
  const s = avancer(pret(4), 1, tirage(GROS, "ngu"));
  assert.equal(s.challenge.troll.count, 5);
  assert.equal(s.challenge.troll.last.big, true, "le 5e troll est un gros troll");
  assert.equal(s.challenge.troll.last.id, "ngu");
  const s10 = avancer(pret(9), 1, tirage(GROS, "ngu"));
  assert.equal(s10.challenge.troll.last.big, true, "le 10e aussi");
}

// 3. chaque petit troll
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "augments"));
  assert.equal(s.systems.augmentations.data.pairs.scissors.level, 5, "augmentations : niveaux divisés par deux (10 -> 5)");
  assert.equal(s.systems.augmentations.data.pairs.scissors.upgradeLevel, 3, "améliorations : divisées par deux (7 -> 3)");
  assert.equal(s.systems.augmentations.data.pairs.milk.level, 2, "5 -> 2");
}
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "blood"));
  assert.equal(s.currencies.blood, 0, "sang : tout perdu");
  assert.equal(s.systems.bloodMagic.data.spells.numberBoost, 1, "multiplicateur de Renaissance de Blood Magic remis à 1");
}
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "timeMachine"));
  const tm = s.systems.timeMachine.data;
  assert.equal(tm.speedLevel + tm.goldLevel, 0, "Time Machine : tous les niveaux perdus");
  assert.ok(Object.values(s.systems.diggers.data.diggers).every((d) => !d.active), "Diggers éteints");
}
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "gold"));
  assert.ok(s.currencies.gold < 1e6, "or : tout volé");
}
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "energy"));
  assert.ok(s.resources.energy.current < 1e6, "énergie : toute perdue");
  assert.ok(s.resources.magic.current > 1e8, "la magie reste");
}
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "magic"));
  assert.ok(s.resources.magic.current < 1e6, "magie : toute perdue");
  assert.ok(s.resources.energy.current > 1e8, "l'énergie reste");
}
{
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, "wandoos"));
  const w = s.systems.wandoos.data;
  assert.equal(w.dumpEnergyLevel + w.dumpMagicLevel, 0, "Wandoos : niveaux de Dump remis à zéro (page Wandoos : « reset Dump levels »)");
  assert.equal(w.osLevels.consumed98, 7, "les niveaux d'OS ne sont pas touchés (page Wandoos)");
}
for (const id of ["boxes", "kitty"]) {
  const s = avancer(remplir(pret(0)), 1, tirage(PETITS, id));
  assert.equal(s.challenge.troll.last.id, id, `${id} : annoncé au client (effet visuel)`);
  assert.equal(s.systems.augmentations.data.pairs.scissors.level, 10, `${id} : aucun effet sur l'état du jeu`);
  assert.ok(s.currencies.gold > 1e8);
}

// 4. chaque gros troll
{
  const s = avancer(remplir(pret(4)), 1, tirage(GROS, "ngu"));
  assert.equal(trollNguOffV1(s), true, "NGU coupés");
  assert.ok(Object.values(s.systems.diggers.data.diggers).every((d) => !d.active), "Diggers éteints avec les NGU");
}
{
  const s = avancer(remplir(pret(4)), 1, tirage(GROS, "beards"));
  assert.equal(trollFlagsV1(s).beards, true, "Barbes coupées");
  assert.ok(Object.values(s.systems.diggers.data.diggers).every((d) => !d.active), "Diggers éteints avec les Barbes");
}
{
  const s = avancer(remplir(pret(4)), 1, tirage(GROS, "menu"));
  assert.equal(trollFlagsV1(s).menu, true, "menu au hasard (joué par le client à 75 %)");
}
{
  const s = avancer(remplir(pret(4)), 1, tirage(GROS, "ruin"));
  assert.equal(s.systems.augmentations.data.pairs.scissors.level, 5);
  assert.equal(s.currencies.blood, 0);
  assert.equal(s.systems.timeMachine.data.speedLevel, 0);
  assert.ok(s.currencies.gold < 1e6 && s.resources.energy.current < 1e6 && s.resources.magic.current < 1e6);
  assert.equal(s.systems.wandoos.data.dumpEnergyLevel, 0, "« tous les petits trolls »");
  assert.equal(trollNguOffV1(s), false, "mais pas les gros");
}
{
  const s = avancer(remplir(pret(4)), 1, tirage(GROS, "wandoosOff"));
  assert.equal(trollFlagsV1(s).wandoos, true, "Wandoos coupé jusqu'au Rebirth");
  assert.equal(s.systems.wandoos.data.dumpEnergyLevel, 12, "sans toucher à ses niveaux");
}
for (const termines of [0, 1, 4, 6]) {
  const s = avancer(remplir(pret(4, termines)), 1, tirage(GROS, "bossDivider"), termines);
  assert.equal(trollBossDividerV1(s), 2 + termines, `multiplicateur de boss divisé par 2 + complétions (${termines}) = ${2 + termines}`);
}
assert.equal(trollBossDividerV1(depart(3)), 1, "sans le troll, aucun diviseur");

// 5. « offline progress is disabled for this challenge » : une longue absence ne fait pas tomber de trolls
{
  const s = depart(0);
  const apres = advanceIdleNguState(s, 3600, CONTEXTE, T0 + 3600_000);
  assert.ok(apres.challenge.troll.timer <= 60 && apres.challenge.troll.count === 0, "une heure hors ligne ne compte que 60 s de chrono, aucun troll");
}
// hors défi Troll : aucun troll
{
  const s = depart(0);
  s.challenge.active = "";
  const apres = avancer(s, 200);
  assert.equal(apres.challenge.troll.count, 0, "aucun troll hors du Troll Challenge");
}

// 6. les gros trolls tombent au Rebirth (« until rebirth ») : drapeaux remis à zéro par le Rebirth, le chrono des trolls continue
const actions = readFileSync("cloudflare/src/idle-ngu-actions.js", "utf8").split(String.fromCharCode(13)).join("");
assert.ok(actions.includes("if(state.challenge.troll)state.challenge.troll.flags=createTrollStateV1().flags;"), "Rebirth : les drapeaux des gros trolls tombent");

// 7. les trolls visuels (boîtes, chaton, menu au hasard) sont joués par le client d'après le troll annoncé
const client = readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8").split(String.fromCharCode(13)).join("");
assert.ok(client.includes("var N=50;") && client.includes("Math.random()<0.3") && client.includes("(inverse?annuler+fermer:fermer+annuler)"), "50 fenêtres « Fermer » / « Annuler », certaines aux boutons inversés au hasard, sans indice");
assert.ok(client.includes("if(bt.getAttribute('data-k')==='annuler'){ouvrirTout();return;}"), "« Annuler » rouvre TOUTES les fenêtres ; « Fermer » ferme la fenêtre");
assert.ok(client.includes("aller.call(window,'combat')") && client.includes("allerAuMenuFightBoss();"), "les fenêtres s'ouvrent sur le menu Fight Boss");
assert.ok(client.includes("if(i===0)retirer('sorealDefiBloqueMenuV1');") && client.includes("id='sorealDefiBloqueMenuV1'"), "la dernière fenêtre à fermer (le bas de la pile) est celle qui bloque les boutons du menu");
assert.ok(client.includes("dx:Math.max(0,(L-x0-bw)/(N-1))") && client.includes("var bw=Math.min(380,Math.round(L*0.92))"), "fenêtres de taille normale, posées en cascade depuis le menu jusqu'au coin opposé de l'écran");
assert.ok(client.includes("function fermerTrollsVisuels(){retirer('sorealDefiBoitesV1');retirer('sorealDefiChatonV1');}") && client.includes("  fermerTrollsVisuels();\n  annonce("), "les boîtes et le chaton disparaissent quand le troll suivant tombe");
assert.ok(client.includes("if(Math.random()<0.75)"), "menu au hasard : 75 % de chances");
assert.ok(client.includes("animation:sorealChatonV1 14s linear forwards"), "le chaton traverse l'écran");

console.log("idle-troll-challenge-deroulement-v1 : OK");
