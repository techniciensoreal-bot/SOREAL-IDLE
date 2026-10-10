import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { enregistrerHistoireV1 } from "../src/idle-histoires-v1.js";
import { verifierJetonGoogleIdleV1, reinitialiserCacheClesGoogleIdleV1 } from "../src/idle-google-auth-v1.js";

/*
 * Audit de sécurité du 2026-10-10, petites bornes à très faible risque :
 *  - SEC-006 : l'histoire d'un boss n'est donnée qu'à un joueur qui l'a atteint (anti-spoil, règle n°2) ;
 *  - SEC-005 : le compteur de clics du classement ne se gonfle plus en multipliant les appels ;
 *  - SEC-008 : un jeton forgé à « kid » inconnu ne provoque plus une requête sortante vers Google à chaque appel.
 */

// --- SEC-006
{
  const g = creerJoueurExterneV1("histoire@example.com");
  g.op("obtenirEtatSorealIdle", "x");
  enregistrerHistoireV1(g.sql, { id: "h1", titre: "Premiere", boss: 1, actif: true, etapes: [{ texte: "texte du boss 1", image: "" }] });
  enregistrerHistoireV1(g.sql, { id: "h250", titre: "Secrete", boss: 250, actif: true, etapes: [{ texte: "SPOILER boss 250", image: "" }] });
  const lointaine = g.op("obtenirHistoireBossSorealIdle", "x", 250);
  assert.equal(lointaine.ok, true);
  assert.equal(lointaine.histoire, null, "l'histoire du boss 250 n'est pas donnée à un joueur du boss 0");
  assert.ok(!JSON.stringify(lointaine).includes("SPOILER"), "aucun texte du boss 250 dans la réponse");
  const premiere = g.op("obtenirHistoireBossSorealIdle", "x", 1);
  assert.ok(premiere.histoire && premiere.histoire.etapes.length === 1, "l'histoire du premier boss (celui qu'on va atteindre) reste donnée");
}

// --- SEC-005
{
  const g = creerJoueurExterneV1("clics@example.com");
  g.op("obtenirEtatSorealIdle", "x");
  let total = 0;
  for (let i = 0; i < 50; i += 1) total = g.op("enregistrerClicsSorealIdle", "x", 1e9).clicsTotal;
  assert.ok(total <= 200 + 49 * 20, "50 appels rapprochés ne donnent pas 10 000 clics (obtenu : " + total + ")");
  assert.ok(total >= 200, "le premier enregistrement garde son minimum");
}

// --- SEC-008
{
  reinitialiserCacheClesGoogleIdleV1();
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  let appels = 0;
  const fetchImpl = async () => {
    appels += 1;
    return { ok: true, json: async () => ({ keys: [{ kid: "connue", kty: "RSA", n: "AQAB", e: "AQAB" }] }) };
  };
  for (let i = 0; i < 20; i += 1) {
    const jeton = b64({ alg: "RS256", kid: "inconnue-" + i }) + "." + b64({ iss: "https://accounts.google.com", aud: "x", exp: 9999999999 }) + ".c2ln";
    const r = await verifierJetonGoogleIdleV1(jeton, { clientId: "x", fetchImpl });
    assert.equal(r.ok, false);
  }
  assert.ok(appels <= 2, "20 jetons à kid inconnu : au plus 2 requêtes sortantes (obtenu : " + appels + ")");
  reinitialiserCacheClesGoogleIdleV1();
}
// --- SEC-009 : au plus 10 sessions actives par adresse, les plus anciennes sont révoquées.
{
  const g = creerJoueurExterneV1("sessions@example.com");
  const jetons = [];
  for (let i = 0; i < 13; i += 1) jetons.push(g.coordinateur.createGoogleSessionV1({ email: "Sessions@Example.com", nom: "S" + i }).sessionToken);
  const valides = jetons.filter((t) => g.coordinateur.standaloneSessionV1(t).ok);
  assert.equal(valides.length, 10, "10 sessions actives au plus (obtenu : " + valides.length + ")");
  assert.deepEqual(jetons.slice(0, 3).map((t) => g.coordinateur.standaloneSessionV1(t).ok), [false, false, false], "les trois plus anciennes sont révoquées");
  assert.equal(g.coordinateur.standaloneSessionV1(jetons[12]).ok, true, "la plus récente est valide");
  const autre = g.coordinateur.createGoogleSessionV1({ email: "autre@example.com", nom: "A" });
  assert.equal(g.coordinateur.standaloneSessionV1(autre.sessionToken).ok, true, "une autre adresse n'est pas touchée");
}
console.log("idle-audit-securite-lot3-v1: OK");
