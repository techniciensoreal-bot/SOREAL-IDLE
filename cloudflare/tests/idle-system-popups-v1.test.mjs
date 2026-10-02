import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_NGU_SYSTEMS } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-30) : « pour achievements, time machine, blood magic etc., c'est toujours le même panneau : génère des panneaux
 * explicatifs explicites pour chaque système qui se débloque dans le jeu. » Un texte par système, d'après sa page du wiki NGU Idle
 * (AGENTS.md règle n°1) ; anti-spoil (règle n°2) : chaque texte n'explique que son propre système.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const debutTable = ui.indexOf("const TEXTES_SYSTEMES_IDLE_V1={");
const finFonction = ui.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-117 */", debutTable);
assert.ok(debutTable > 0 && finFonction > debutTable, "table et fonction des panneaux introuvables");
const { T, info } = new Function(ui.slice(debutTable, finFonction) + "\nreturn {T:TEXTES_SYSTEMES_IDLE_V1, info:infoSystemeGeneriqueBruteIdleV1_};")();

// Systèmes qui ouvrent un menu (IDLE_SYSTEME_PAR_MENU_V1) : chacun doit avoir SON texte (Money Pit a déjà son propre panneau, infoMoneyPitIdleV1_).
const bloc = ui.slice(ui.indexOf("const IDLE_SYSTEME_PAR_MENU_V1={"), ui.indexOf("const IDLE_MENU_PAR_SYSTEME_V1="));
const systemesAvecMenu = [...bloc.matchAll(/:'([A-Za-z]+)'/g)].map((m) => m[1]).filter((id) => id !== "moneyPit");
assert.ok(systemesAvecMenu.length >= 20, "liste des systèmes à menu lue : " + systemesAvecMenu.length);
assert.deepEqual(
  systemesAvecMenu.filter((id) => !T[id]),
  [],
  "chaque système qui se débloque a son panneau explicite (plus aucun panneau générique)"
);
assert.deepEqual(Object.keys(T).filter((id) => !systemesAvecMenu.includes(id)), [], "aucun texte pour un système sans menu");

const noms = IDLE_NGU_SYSTEMS.map((s) => s.name);
const generiques = ["Une nouvelle couche de progression", "moteur partagé", "Ce système améliore ta progression", "Vérifie ce qui est conservé"];

for (const id of systemesAvecMenu) {
  const systeme = IDLE_NGU_SYSTEMS.find((s) => s.id === id);
  assert.ok(systeme, id + " existe dans le catalogue");
  const t = T[id];
  assert.ok(typeof t.intro === "string" && t.intro.length >= 30 && t.intro.length <= 260, id + " : intro d'une phrase");
  assert.ok(Array.isArray(t.bullets) && t.bullets.length >= 3 && t.bullets.length <= 4, id + " : 3 à 4 points");
  const texte = [t.intro].concat(t.bullets).join(" ");
  for (const b of t.bullets) assert.ok(b.length >= 20 && b.length <= 300, id + " : point court (lisible à voix haute) : " + b);
  for (const g of generiques) assert.ok(!texte.includes(g), id + " : plus de phrase générique (" + g + ")");
  // Anti-spoil : le texte d'un système ne nomme jamais un AUTRE système (que le joueur n'a peut-être pas encore débloqué).
  for (const nom of noms) {
    if (nom === systeme.name) continue;
    assert.ok(!new RegExp("\\b" + nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(texte), id + " ne doit pas nommer « " + nom + " » (spoil)");
  }
  assert.ok(!/\b\d+\s*\/\s*\d+\b/.test(texte), id + " : aucun total révélateur (x / y)");
  assert.ok(!/…|\.\.\./.test(texte), id + " : pas de points de suspension (mal lus par la voix)");

  // Le panneau construit : titre, intro, points, bouton vers le bon menu.
  const panneau = info({ id, name: systeme.name, icon: systeme.icon, kind: systeme.kind }, "menu-" + id);
  assert.equal(panneau.titre, systeme.name + " débloqué");
  assert.equal(panneau.intro, t.intro);
  assert.deepEqual(panneau.bullets, t.bullets);
  assert.equal(panneau.menuCible, "menu-" + id);
  assert.equal(panneau.libelleCible, "Aller à " + systeme.name);
}

// Faits du wiki qui doivent apparaître (vérifiés sur les pages consultées le 2026-09-30).
assert.match(T.augmentations.intro, /Attack et de Defense/);
assert.ok(T.bloodMagic.bullets.join(" ").includes("Lancer un sort utilise tout ton Blood"), "Blood Magic : un sort dépense tout le Blood");
assert.ok(T.achievements.bullets.join(" ").includes("un pour cent de plus pour chaque tranche de cent points bonus"), "Achievements : AP +1 % par 100 points bonus");
assert.ok(T.wandoos.bullets.join(" ").includes("les niveaux d’Energy et de Magic sont perdus"), "Wandoos : niveaux perdus à la Renaissance");
assert.ok(T.timeMachine.bullets.join(" ").includes("remis à zéro à chaque Renaissance"), "Time Machine : niveaux remis à zéro à la Renaissance");
// Le bouton de Time Machine ne parle pas de la Magic (elle se débloque plus tard) ; Blood Magic peut la nommer (elle se débloque avec).
assert.ok(!/Magic/.test([T.timeMachine.intro].concat(T.timeMachine.bullets).join(" ")), "Time Machine : aucune mention de la Magic (encore verrouillée)");

// Système inconnu du tableau : repli générique inchangé (jamais une erreur).
assert.equal(info({ id: "inconnu", name: "Truc", kind: "run" }, "m").titre, "Truc débloqué");

// Les voix des panneaux couvrent ces textes (le générateur appelle la même fonction pour chaque système du catalogue).
assert.match(ui, /window\.__sorealVoiceTextesSystemesIdleV1__=function\(systemes\)/);
assert.ok(ui.slice(ui.indexOf("window.__sorealVoiceTextesSystemesIdleV1__=function(systemes)")).includes("infoSystemeGeneriqueIdleV1_"), "les voix des panneaux utilisent les textes explicites");

console.log("idle-system-popups-v1: OK");
