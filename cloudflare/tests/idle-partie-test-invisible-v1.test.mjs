import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { battementV1, listerEnLigneV1 } from "../src/idle-chat-v1.js";
import { enregistrerJalonsV1, enregistrerConnexionFluxV1, lireFluxV1, instantaneJoueurV1 } from "../src/idle-flux-v1.js";
import { idleDevEstEmailPartieTestV1 } from "../src/idle-dev-save-slots-v1.js";

/*
 * Norman (2026-10-05) : « les joueurs ne doivent pas voir ce que tu fais » (parties d'essai en B). La partie B (adresse alias « nom+partieb@… ») n'apparaît jamais dans « En direct » ni parmi les joueurs en ligne ;
 * ce qui avait été enregistré avant est effacé. (Le classement l'exclut déjà : joueurExclusClassementSorealIdle_.)
 */
assert.equal(idleDevEstEmailPartieTestV1("technicien.soreal+partieb@gmail.com"), true);
assert.equal(idleDevEstEmailPartieTestV1("technicien.soreal@gmail.com"), false);
assert.equal(idleDevEstEmailPartieTestV1("autre@gmail.com"), false);

const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
const B = "technicien.soreal+partieb@gmail.com";
const A = "technicien.soreal@gmail.com";
const t0 = 5_000_000;

// Présence : A est vu en ligne, B jamais.
battementV1(sql, { email: A, nom: "Redrum", admin: true, actif: true, connecte: true, activite: { t: "libre" }, now: t0 });
const rB = battementV1(sql, { email: B, nom: "Redrum (B)", admin: true, actif: true, connecte: true, activite: { t: "libre" }, now: t0 + 1000 });
assert.equal(rB.connexion, false, "B : jamais « vient de se connecter »");
assert.deepEqual(listerEnLigneV1(sql, A, t0 + 2000).map((x) => x.nom), ["Redrum"], "B absent de la liste des joueurs en ligne");
// Même si une ancienne présence B traînait dans la table : elle n'est plus listée.
sql.exec("INSERT OR REPLACE INTO idle_presence(email,nom,admin,vu_le,actif,activite) VALUES(?,?,?,?,?,?)", B, "Redrum (B)", 1, t0 + 1500, 1, "{}");
assert.deepEqual(listerEnLigneV1(sql, A, t0 + 2000).map((x) => x.nom), ["Redrum"], "ancienne présence B : toujours masquée");

// Fil « En direct » : A annonce, B jamais ; les anciennes lignes de B sont effacées.
const inst = (boss) => instantaneJoueurV1({ bossVaincus: boss, stats: { metaNgu: { records: { highestBoss: boss }, challenge: {}, rebirth: {}, adventure: {}, systems: {} } } });
enregistrerJalonsV1(sql, { email: A, nom: "Redrum", instantane: inst(10), now: t0 });
enregistrerJalonsV1(sql, { email: A, nom: "Redrum", instantane: inst(11), now: t0 + 5000 });
sql.exec("INSERT INTO idle_flux(at,email,nom,type,donnees) VALUES(?,?,?,?,?)", t0 + 6000, B, "Redrum (B)", "boss", "{}");
assert.equal(enregistrerJalonsV1(sql, { email: B, nom: "Redrum (B)", instantane: inst(140), now: t0 + 7000 }), 0);
assert.equal(enregistrerConnexionFluxV1(sql, { email: B, nom: "Redrum (B)", now: t0 + 8000 }), 0);
assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_flux WHERE email LIKE '%+partieb@%'")[0].n, 0, "lignes de B effacées");
const lu = lireFluxV1(sql, { apresId: 0, email: A, now: t0 + 9000 });
assert.ok(lu.length >= 1 && lu.every((e) => e.nom !== "Redrum (B)"), "aucun événement de B dans le fil");
console.log("idle-partie-test-invisible-v1: OK");
