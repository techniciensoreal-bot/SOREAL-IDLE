import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit 2026-09-16 (Norman, avec un vrai journal de combat en preuve :
 * "[23:10:15] La Palette Infernale attaque pour 62.4K dégâts · 62.4K
 * bloqués · Norman subit 0 dégât", répété 4x) : "le premier combat n'est
 * pas comme dans NGU Idle... ici le combat dure une éternité. je pense
 * que c'est encore dû à la version que j'ai essayé de reconstituer de
 * mémoire et qu'il faut neutraliser."
 *
 * Confirmé en direct sur le wiki (ngu-idle.fandom.com/wiki/Boss_Fights) :
 * Boss 1 "A Small Piece of Fluff" a Attaque 50 000 / PV 500 000, et "HP
 * while fighting is 10*attack" — un joueur non préparé (0 attaque) a
 * donc 0 PV de combat réels et meurt quasi instantanément. Le code avait
 * un plancher inventé (BOSS_TUTORIEL_DEGATS_SEC, défaut 1 dégât/s
 * FIXE, quel que soit l'attaque réelle du boss) qui rendait Boss 1
 * quasiment imbattable À PERDRE — un combat "éternel", l'exact inverse
 * du vrai NGU. Supprimé côté serveur (degatsRecusSecondeSorealIdle_,
 * combatRegles) ET côté client (SOREAL-APP/Soreal_Idle_UI.html, branche
 * `tutoriel`) : Boss 1 utilise désormais exactement la même formule
 * réelle que tous les autres boss, max(0, attaque-defense). Le wiki
 * Defense confirme explicitement que Defense >= Boss Attack donne 0 dégât.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

assert.ok(
  !source.includes("BOSS_TUTORIEL_DEGATS_SEC"),
  "Le plancher de dégâts inventé pour Boss 1 (BOSS_TUTORIEL_DEGATS_SEC) ne doit plus exister nulle part."
);
assert.ok(
  !source.includes("bossTutorielDegatsSec"),
  "combatRegles ne doit plus exposer bossTutorielDegatsSec au client."
);
assert.ok(
  !source.includes("combat tutoriel volontairement serré"),
  "Le commentaire décrivant l'ancien plancher inventé ne doit plus décrire le comportement réel."
);

const start = source.indexOf("function degatsRecusSecondeSorealIdle_(");
assert.ok(start >= 0, "degatsRecusSecondeSorealIdle_ doit exister.");
const end = source.indexOf("\nfunction ", start + 10);
const body = source.slice(start, end);

assert.ok(
  !/if\s*\(\s*index\s*===\s*0\s*\)/.test(body),
  "degatsRecusSecondeSorealIdle_ ne doit plus spécial-caser le Boss 1 : même formule réelle pour tous les boss."
);
assert.ok(
  !body.includes("plancherPct") &&
  !body.includes("BOSS_DEGATS_MIN_PCT") &&
  body.includes("attaque -") &&
  body.includes("Math.max("),
  "La formule NGU doit rester max(0, attaque du boss - défense du joueur), sans plancher artificiel, y compris pour Boss 1."
);

console.log("idle-boss1-no-artificial-damage-floor: OK");
