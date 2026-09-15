import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-13) : suite de idle-boss-defense-stat.test.mjs — la
 * Defense sourcée du wiki doit aussi servir de PLANCHER (comme pv/attaque
 * déjà en place) dans equilibrerBossPrincipalSorealIdleV413_, et être
 * exposée au joueur via defenseBossSorealIdle_/defenseBoss, exactement au
 * même endroit que attaqueBossSorealIdle_/attaqueBoss déjà en place.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

assert.ok(
  source.includes("const defenseMinimum = reference.defense;"),
  "equilibrerBossPrincipalSorealIdleV413_ doit lire la Defense de référence, comme pv/attaque."
);
assert.ok(
  /defense:\s*\n\s*Math\.max\(\s*\n\s*1,\s*\n\s*Math\.round\(\s*\n\s*Math\.max\(\s*\n\s*nombreSorealIdle_\(\s*\n\s*source\.defense,/.test(source),
  "La Defense doit suivre EXACTEMENT le même patron de plancher (MAX, jamais un remplacement) que pv/attaque."
);
assert.ok(
  source.includes("function defenseBossSorealIdle_(") ,
  "defenseBossSorealIdle_ doit exister, pendant de attaqueBossSorealIdle_."
);
assert.ok(
  source.includes("const defenseBossSelection =") && source.includes("defenseBossSorealIdle_(\n      bossSelectionIndex\n    );"),
  "defenseBossSelection doit être calculée pour le boss actuellement sélectionné, comme attaqueBossSelection."
);
assert.ok(
  source.includes("defenseBoss:\n      defenseBossSelection,"),
  "defenseBoss doit être exposée au joueur juste à côté de attaqueBoss, dans le même objet d'état."
);

console.log("idle-boss-defense-floor: OK");
