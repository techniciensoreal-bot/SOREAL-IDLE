import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1 } from "../src/idle-local-sync-v1.js";
import { monde, tick } from "./helpers/monde-local.mjs";

/*
 * Audit anti-rollback (Norman, 2026-10-21) : le serveur ne prend que 200 événements de flux et 100 gains d'EXP par envoi. Il le dit (fluxTraites, gainsTraites) et la page n'acquitte que ceux-là :
 * après une longue panne réseau, les événements au-delà de la limite partent à l'envoi suivant au lieu d'être perdus.
 */

// 1. Serveur : au-delà de la limite, il annonce combien il a traités.
{
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
  const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  feuille("JOUEURS", [HEADERS_]);
  feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
  coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });
  const a = JSON.parse(exporterPourMoteurLocalV1(coord, T).joueurs.ligne); a[15] = new Date(Date.now() - 1000).toISOString();
  const flux = Array.from({ length: 250 }, (_, i) => ({ at: 1000 + i, type: "boss", donnees: "{\"i\":" + i + "}" }));
  const gains = Array.from({ length: 130 }, (_, i) => ({ at: 5000 + i, operation: "t", avant: i, apres: i + 1 }));
  let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: a, flux, gains });
  assert.equal(r.fluxTraites, 200); assert.equal(r.gainsTraites, 100);
  r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: a, flux: flux.slice(200), gains: gains.slice(100) });
  assert.equal(r.fluxTraites, 50); assert.equal(r.gainsTraites, 30);
  assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_flux")[0].n, 250, "tous les événements finissent enregistrés");
  assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_gains_exp")[0].n, 130);
}

// 2. Page : elle n'acquitte que les événements traités ; le reste repart à l'envoi suivant.
{
  const w = monde();
  w.etat.flux = Array.from({ length: 5 }, (_, i) => ({ at: i + 1, type: "boss", donnees: "{}" }));
  w.etat.gains = Array.from({ length: 4 }, (_, i) => ({ at: i + 1, operation: "x", avant: i, apres: i + 1 }));
  await w.action(); await tick();
  w.push = async () => ({ ok: true, ecrit: true, fluxTraites: 3, gainsTraites: 1 });
  await w.ML.envoyerMaintenant();
  assert.deepEqual(w.etat.flux.map((e) => e.at), [4, 5], "les 2 événements non traités restent en file");
  assert.deepEqual(w.etat.gains.map((e) => e.at), [2, 3, 4]);
  w.push = async () => ({ ok: true, ecrit: true, fluxTraites: 2, gainsTraites: 3 });
  await w.ML.envoyerMaintenant();
  assert.equal(w.pushes.at(-1).flux.length, 2, "ils repartent à l'envoi suivant");
  assert.equal(w.etat.flux.length, 0); assert.equal(w.etat.gains.length, 0);
  // Ancien serveur (sans fluxTraites) : tout ce qui a été envoyé est acquitté, comme avant.
  w.etat.flux = [{ at: 9, type: "boss", donnees: "{}" }];
  w.push = async () => ({ ok: true, ecrit: true });
  await w.ML.envoyerMaintenant();
  assert.equal(w.etat.flux.length, 0);
}
console.log("idle-sauvegarde-locale-limites-v1: OK");
