import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-10-10) : « dans Chroniques > Classement, un onglet avec le combat le plus long, en Fight Boss ».
 * La durée (secondes de combat simulées) d'un combat de boss mené à son terme (victoire ou défaite) entre au record du joueur ; une fuite ou un NUKE n'est pas enregistré.
 */
const lireStats = (g) => {
  const ligne = JSON.parse(g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=2")[0].row_json);
  const sj = ligne.find((x) => typeof x === "string" && x.includes("combatBossActif"));
  return JSON.parse(sj);
};
const VraiDate = Date;
let t = 1_800_000_000_000;
globalThis.Date = class extends VraiDate {
  constructor(...a) { if (a.length === 0) super(t); else super(...a); }
  static now() { return t; }
};
try {
  const g = creerJoueurExterneV1("combatlong@example.com");
  g.op("obtenirEtatSorealIdle", "x");
  g.op("definirPseudoSorealIdle", "x", "Long");
  assert.equal(lireStats(g).combatBossPlusLongSec, 0, "aucun record au départ");

  // Un combat lancé puis fui n'est pas un combat mené à son terme.
  g.op("definirCombatBossSorealIdle", "x", true, "manuel");
  g.op("definirCombatBossSorealIdle", "x", false, "fuite"); /* aucun temps écoulé : le combat n'a pas eu lieu */
  assert.equal(lireStats(g).combatBossPlusLongSec, 0, "une fuite n'enregistre rien");

  // Un combat qui se termine (défaite d'un niveau 1 face au boss 1) entre au record.
  g.op("definirCombatBossSorealIdle", "x", true, "manuel");
  t += 5000;
  g.op("synchroniserSorealIdle", "x");
  const apres = lireStats(g);
  assert.equal(apres.combatBossActif, false);
  assert.ok(apres.combatBossPlusLongSec > 0, "la durée du combat est enregistrée (obtenu : " + apres.combatBossPlusLongSec + ")");
  assert.equal(apres.combatBossDureeSec, 0, "le compteur repart de zéro");
  const record = apres.combatBossPlusLongSec;
  // Un combat plus court ne baisse jamais le record.
  g.op("definirCombatBossSorealIdle", "x", true, "manuel");
  t += 5000;
  g.op("synchroniserSorealIdle", "x");
  assert.ok(lireStats(g).combatBossPlusLongSec >= record, "le record ne baisse jamais");

  const c = g.op("obtenirClassementSorealIdle", "x");
  assert.ok(c.stats.includes("combatLong"), "la statistique est dans le classement");
  const moi = c.entrees.find((e) => e.moi);
  assert.equal(typeof moi.valeurs.combatLong, "number");
  assert.equal(moi.rangs.combatLong, 1);
} finally {
  globalThis.Date = VraiDate;
}

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("{id:'combatLong',nom:'⚔️ Combat le plus long'}"), "onglet du classement");
assert.ok(ui.includes("if(stat==='combatLong')"), "durée lisible");
console.log("idle-classement-combat-long-v1: OK");
