import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
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
  assert.equal(moi.valeurs.combatLongGagne, false, "l'issue du combat le plus long est donnée (ici une défaite du niveau 1)");
  assert.equal(lireStats(g).combatBossPlusLongGagne, false);
} finally {
  globalThis.Date = VraiDate;
}

/* Règle du 2026-10-11 : un seul Fight, boss à PV pleins, aucune fuite/reprise ; l'issue (gagné/perdu) s'affiche. */
{
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  assert.ok(rt.includes("stats.combatBossDepartFrais === true && duree >") && rt.includes("stats.combatBossPlusLongGagne = gagne === true;") && rt.includes("cloreCombatBossClassementV1_(statsCombat,true);") && rt.includes("if(!Boolean(actif)&&stats.combatBossActif)stats.combatBossDepartFrais=false;"), "record réservé aux combats d'un seul Fight sur un boss à PV pleins, avec issue");
  assert.ok(rt.includes("combatBossPlusLongSec:(s.combatBossPlusLongGagne===true||s.combatBossPlusLongGagne===false)"), "les anciens records sans issue repartent de zéro");
}
const ui = lireUiComplet();
assert.ok(ui.includes("{id:'combatLong',nom:'⚔️ Combat le plus long'}"), "onglet du classement");
assert.ok(ui.includes("if(stat==='combatLong')"), "durée lisible");
assert.ok(ui.includes("'🏆 Gagné':'💀 Perdu'"), "issue affichée");
console.log("idle-classement-combat-long-v1: OK");
