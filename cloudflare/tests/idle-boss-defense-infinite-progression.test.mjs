import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit 2026-09-15 : idle-boss-defense-floor.test.mjs verrouille déjà le
 * plancher NGU pour pv/attaque/xp/defense dans equilibrerBossPrincipalSorealIdleV413_
 * (utilisé pour n < catalogue.length), mais la branche "progression infinie"
 * de definitionBossSorealIdle_ (n >= catalogue.length, au-delà du dernier
 * boss du catalogue) construisait son propre objet SANS jamais passer par ce
 * plancher — et ne posait AUCUNE clé "defense" du tout. Tout boss au-delà du
 * catalogue se retrouvait donc sans Defense réelle (repli sur la minuscule
 * constante ATTAQUE_BOSS_BASE côté nombreSorealIdle_), trivialement tuable en
 * un coup — même défaut de conception que celui déjà corrigé pour
 * pv/attaque/xp le 2026-09-09 (V56), jamais reporté sur defense à l'époque.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const infiniStart = source.indexOf("Après le catalogue initial, on garde la progression infinie");
const infiniEnd = source.indexOf("function nomBossSorealIdle_", infiniStart);
assert.ok(infiniStart >= 0 && infiniEnd > infiniStart, "La branche de progression infinie doit exister dans definitionBossSorealIdle_.");
const infini = source.slice(infiniStart, infiniEnd);

assert.ok(
  /defense:\s*\n\s*Math\.round\(\s*\n\s*Math\.max\(\s*\n\s*dernier\.defense\s*\*/.test(infini),
  "La branche de progression infinie doit calculer defense à partir de dernier.defense, comme pv/attaque."
);
assert.ok(
  infini.includes("nguBossStatsV1(n).defense"),
  "La Defense de la progression infinie doit rester plafonnée au minimum par la vraie référence NGU, comme pv/attaque/xp."
);

console.log("idle-boss-defense-infinite-progression: OK");
