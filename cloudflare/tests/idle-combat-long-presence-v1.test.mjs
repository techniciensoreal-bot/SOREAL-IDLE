import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-10-21) : « Sylvain est premier au combat le plus long (1 min 48) mais je pense que c'est impossible ». Quand la page est fermée ou en arrière-plan pendant un combat de boss, la prochaine synchro rejoue d'un coup tout le temps écoulé
 * (jusqu'à 12 h) : la « durée du combat » comptait alors l'absence du joueur. Un combat dont une synchro a dû rattraper plus de 30 s d'absence n'est plus éligible au record « combat le plus long ».
 */
const lireStats = (g) => {
  const ligne = JSON.parse(g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=2")[0].row_json);
  return JSON.parse(ligne.find((x) => typeof x === "string" && x.includes("combatBossActif")));
};
const VraiDate = Date;
let t = 1_800_000_000_000;
globalThis.Date = class extends VraiDate {
  constructor(...a) { if (a.length === 0) super(t); else super(...a); }
  static now() { return t; }
};
try {
  // Combat suivi en direct (synchro 5 s après le lancement) : entre au record.
  const present = creerJoueurExterneV1("present@example.com");
  present.op("obtenirEtatSorealIdle", "x");
  present.op("definirPseudoSorealIdle", "x", "Present");
  present.op("definirCombatBossSorealIdle", "x", true, "manuel");
  t += 5000;
  present.op("synchroniserSorealIdle", "x");
  assert.ok(lireStats(present).combatBossPlusLongSec > 0, "combat suivi en direct : enregistré");

  // Même combat, mais la synchro arrive 10 minutes plus tard (page fermée ou en arrière-plan) : pas de record.
  const absent = creerJoueurExterneV1("absent@example.com");
  absent.op("obtenirEtatSorealIdle", "x");
  absent.op("definirPseudoSorealIdle", "x", "Absent");
  absent.op("definirCombatBossSorealIdle", "x", true, "manuel");
  t += 600000;
  absent.op("synchroniserSorealIdle", "x");
  const s = lireStats(absent);
  assert.equal(s.combatBossActif, false, "le combat s'est bien terminé pendant l'absence");
  assert.equal(s.combatBossPlusLongSec, 0, "une absence de 10 minutes ne compte pas comme un combat « le plus long »");
} finally {
  globalThis.Date = VraiDate;
}
console.log("idle-combat-long-presence-v1: OK");
