import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { runSorealIdleOperation, idleReinitialiserTempsActifV1 } from "../src/idle-sqlite-runtime.js";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-PERF-001 : chaque opération relisait et décodait la ligne de TOUS les joueurs (0,17 ms par joueur et par opération : un battement coûtait 55 ms à 500 joueurs). Les lignes de joueurs sont maintenant lues
 * à la demande, et le joueur est retrouvé par SQLite. Ce test garantit deux choses : (1) ÉQUIVALENCE EXACTE : la même suite d'opérations, avec plusieurs joueurs, donne exactement les mêmes lignes en base que le mode « tout décoder
 * tout de suite » (SOREAL_IDLE_LIGNES_EAGER=1) ; (2) un joueur qui n'a pas encore de ligne en reçoit toujours une, sans toucher à celles des autres.
 */
const VraiDate = Date;
const vraiRandom = Math.random;
function jouer(eager) {
  idleReinitialiserTempsActifV1();
  let horloge = 1_800_000_000_000;
  /* Horloge entièrement figée, « new Date() » compris, pour que les deux parcours soient comparables à l'octet. */
  globalThis.Date = class extends VraiDate {
    constructor(...a) { if (a.length === 0) super(horloge); else super(...a); }
    static now() { return horloge; }
  };
  let graine = 12345;
  Math.random = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  if (eager) process.env.SOREAL_IDLE_LIGNES_EAGER = "1"; else delete process.env.SOREAL_IDLE_LIGNES_EAGER;
  const g = creerJoueurExterneV1("a@example.com");
  const utilisateurs = ["a@example.com", "b@example.com", "c@example.com"].map((email) => ({ email, emailConnexion: email, emails: [email], prenom: "Joueur", role: "externe", externe: true }));
  const op = (u, nom, ...args) => runSorealIdleOperation(g.sql, nom, ["x", ...args], utilisateurs[u]);
  const journal = [];
  for (const u of [0, 1, 2]) { journal.push(JSON.stringify(op(u, "obtenirEtatSorealIdle")).length); op(u, "definirPseudoSorealIdle", "Joueur" + u + "x"); }
  for (let tour = 0; tour < 6; tour += 1) {
    horloge += 20000;
    for (const u of [0, 1, 2]) {
      op(u, "battementSorealIdle", { actif: true, connecte: true });
      journal.push(JSON.stringify(op(u, "enregistrerClicsSorealIdle", 7 + tour)));
      journal.push(JSON.stringify(op(u, "agirProgressionSorealIdle", { action: "adventure", adventure: { action: "selectZone", zone: "safe" } })).length);
    }
    journal.push(JSON.stringify(op(1, "obtenirEtatSorealIdle")).length);
  }
  journal.push(JSON.stringify(op(0, "obtenirClassementSorealIdle")));
  const lignes = g.sql.exec("SELECT sheet_name,row_index,row_json FROM idle_catalog ORDER BY sheet_name,row_index").map((r) => r.sheet_name + "#" + r.row_index + "#" + r.row_json);
  const joueurs = g.sql.exec("SELECT player_key,source_row,state_json FROM idle_players ORDER BY player_key").map((r) => r.player_key + "#" + r.source_row + "#" + r.state_json);
  return { journal, lignes, joueurs };
}
let eager, paresseux;
try {
  eager = jouer(true);
  paresseux = jouer(false);
} finally {
  globalThis.Date = VraiDate;
  Math.random = vraiRandom;
  delete process.env.SOREAL_IDLE_LIGNES_EAGER;
}
assert.ok(eager.lignes.filter((l) => l.startsWith("JOUEURS#")).length >= 4, "l'en-tête et trois joueurs sont en base");
assert.deepEqual(paresseux.journal, eager.journal, "mêmes réponses à chaque opération");
assert.deepEqual(paresseux.lignes, eager.lignes, "mêmes lignes en base (idle_catalog)");
assert.deepEqual(paresseux.joueurs, eager.joueurs, "mêmes copies (idle_players)");
console.log("idle-audit-perf-lignes-paresseuses-v1: OK");
