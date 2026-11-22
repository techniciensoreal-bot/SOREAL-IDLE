import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { towerSetFloorsV1, towerEntrerV1 } from "../src/idle-ngu-systemes.js";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/* Branchements de la chaîne de la Bête dans le moteur : ITOPOD (début de visite et kills), Rebirth, butin des titans, anti-spoil de l'interface. */
const lire = p => readFileSync(p, "utf8");
const sys = lire("cloudflare/src/idle-ngu-systemes.js");
assert.ok(/beteItopodV1\(state\.adventure, d, lf, n, killsAvantBete\)/.test(sys), "chaque lot de kills de l'ITOPOD passe par checkITOPODSecret");
assert.ok(/clue3Complete\) beteItopodV1/.test(sys), "le test ne coûte rien tant que l'indice 3 n'est pas fait");
assert.ok((sys.match(/beteDebutVisiteV1\(state\.adventure, d\)/g) || []).length === 1, "début de visite = changeZone (entrée dans la zone, Shifter) ; Appliquer / Auto ne déplacent plus le joueur (alignement 2026-11-22)");
assert.ok(/beteSpecialRebirthV1\(state,runSeconds\);\s*\n\s*const rb=refreshRebirthState/.test(lire("cloudflare/src/idle-ngu-actions.js")), "checkSpecial avant toute remise à zéro");
assert.ok(/beteSecretsTitanV1\(s,id,out\)/.test(lire("cloudflare/src/idle-adventure-combat.js")));

/* Règle des étages : une visite recommence éligible seulement si l'indice 3 est fait. */
{
  const T0 = 1.76e12;
  const s = normalizeIdleNguState({}, { bosses: 100 }, T0);
  s.systems.tower.unlocked = true;
  s.systems.tower.data.highestFloor = 150;
  towerSetFloorsV1(s, { start: 0, end: 120 });
  assert.equal(s.systems.tower.data.startFloor, 0);
  towerEntrerV1(s);
  assert.equal(s.systems.tower.data.beteElig, undefined, "indice 3 pas fait : rien n'est écrit dans l'état");
  s.adventure.unlockFlags.clue3Complete = true;
  towerSetFloorsV1(s, { start: 0, end: 120 });
  assert.equal(s.systems.tower.data.beteElig, true, "règle SOREAL 2026-11-22 : régler les étages (Appliquer) repositionne comme une nouvelle entrée = début de visite");
  towerEntrerV1(s);
  assert.equal(s.systems.tower.data.beteElig, true);
  towerSetFloorsV1(s, { start: 5, end: 120 });
  towerEntrerV1(s);
  assert.equal(s.systems.tower.data.beteElig, true, "éligible mais départ 5 : le départ 0 est exigé au moment du kill");
}
/* Anti-spoil : le module de popup n'annonce que les messages du jeu, jamais de total ni de condition. */
{
  const popup = lire("cloudflare/public/modules/popup-effet-objet-v1.js");
  const i = popup.indexOf("r.secretBete");
  assert.ok(i > 0);
  const bloc = popup.slice(i, i + 700);
  assert.ok(!/\/\s*4|sur 4|clue|indice [0-9]/i.test(bloc.replace(/Quelque chose a été laissé derrière/, "")), "aucun compteur d'indices");
}
console.log("idle-bete-branchements-v1: OK");
