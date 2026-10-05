import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Anti-spoil (AGENTS.md, règle n°2). Balayage en ligne d'un joueur neuf (partie B réinitialisée, 2026-10-06) : des textes affichés à tous nommaient des systèmes encore verrouillés.
 */
const lire = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const meta = lire("modules/meta-progression-v130.js");
const chal = lire("modules/challenges-v1.js");
const prof = lire("modules/profile-v1.js");
const notes = lire("modules/release-notes-v1.js");

// Explication de la Puissance (boutique EXP) : aucune activité nommée.
const iPuiss = meta.indexOf("id:'power',");
assert.ok(iPuiss > 0);
const iExpl = meta.indexOf("explication:", iPuiss);
const blocPuiss = meta.slice(iExpl, meta.indexOf(String.fromCharCode(10), iExpl));
assert.ok(!/Time Machine|Blood Magic|NGU|Wandoos|Augments/.test(blocPuiss), "la Puissance ne nomme aucun système");

// Défis : introduction et description du premier défi.
assert.ok(!/banques de Time Machine|de Barbes|Advanced Training/.test(chal.slice(chal.indexOf("var INTRO="), chal.indexOf("var INTRO=") + 400)));
assert.ok(!/tes améliorations d’EXP, tes NGU/.test(chal) && !/niveau de système d’exploitation Wandoos/.test(chal));

// Succès et portraits.
assert.ok(!/kills de l’ITOPOD|Special Prize/.test(prof) && !/Weiner|Sneak Preview|SEXY/.test(prof));

// Notes de mise à jour : aucun nom de système réservé (voir aussi idle-release-notes-v1).
assert.ok(!/Mineurs d’or|Piratages|Gold Diggers|Yggdrasil|Wandoos|Garderie|ITOPOD|A Number|Giant Seed/.test(notes));

// Listes : un fruit ou un mineur portant le nom d'un système verrouillé n'apparaît pas.
assert.ok(meta.includes("!/MacGuffin/i.test(String(def.name||def.id||''))||") && meta.includes("def.id!=='daycare'||"));
console.log("idle-anti-spoil-textes-v2: OK");
