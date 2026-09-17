import assert from "node:assert/strict";
import { idleRuntimeTestHooks, runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

const { IDLE_PROTOCOL_VERSION } = idleRuntimeTestHooks;

/*
 * Audit 2026-09-17 (risque cross-repo SOREAL-IDLE / SOREAL-APP, aucun
 * contrat de version partagé — voir AGENTS.md section "Relation avec
 * SOREAL-APP / SOREAL-TV") : le client (Soreal_Idle_UI.html, SOREAL-APP)
 * n'a aucun moyen de détecter un changement cassant du contrat
 * client/serveur avant qu'il casse silencieusement en production. Filet
 * de sécurité RUNTIME (pas un gate CI cross-repo, jugé disproportionné
 * pour deux dépôts déployés indépendamment) : `obtenirAccesSorealIdle`,
 * le premier appel fait à l'ouverture du module IDLE, expose désormais
 * `protocolVersion`. Le client compare cette valeur à sa propre
 * constante `IDLE_CLIENT_PROTOCOL_VERSION` et affiche un message calme
 * de rechargement en cas de désaccord plutôt que de continuer avec des
 * hypothèses de forme de réponse potentiellement fausses.
 */

assert.equal(
  typeof IDLE_PROTOCOL_VERSION,
  "number",
  "IDLE_PROTOCOL_VERSION doit être un entier exposé par le runtime."
);
assert.ok(
  Number.isInteger(IDLE_PROTOCOL_VERSION) && IDLE_PROTOCOL_VERSION >= 1,
  "IDLE_PROTOCOL_VERSION doit être un entier >= 1."
);

// --- Accès autorisé (utilisateur reconnu par l'allowlist) : protocolVersion présent ---
{
  const user = {
    prenom: "Norman",
    email: "technicien.soreal@gmail.com",
    emailConnexion: "reeeedruuuum@gmail.com",
    emails: ["technicien.soreal@gmail.com", "reeeedruuuum@gmail.com"]
  };

  // obtenirAccesSorealIdle ne touche jamais sql (voir le court-circuit
  // dédié dans runSorealIdleOperation) : un sql factice suffit.
  const res = runSorealIdleOperation(
    null,
    "obtenirAccesSorealIdle",
    ["session-test"],
    user
  );

  assert.equal(res?.ok, true);
  assert.equal(res?.autorise, true);
  assert.equal(
    res?.protocolVersion,
    IDLE_PROTOCOL_VERSION,
    "La réponse autorisée de obtenirAccesSorealIdle doit exposer protocolVersion=IDLE_PROTOCOL_VERSION."
  );
}

// --- Accès refusé (aucune session/utilisateur) : protocolVersion présent quand même ---
{
  const res = runSorealIdleOperation(
    null,
    "obtenirAccesSorealIdle",
    ["session-test"],
    null
  );

  assert.equal(res?.ok, true);
  assert.equal(res?.autorise, false);
  assert.equal(
    res?.protocolVersion,
    IDLE_PROTOCOL_VERSION,
    "Même une réponse non autorisée doit exposer protocolVersion : le client doit pouvoir détecter un " +
      "désaccord de contrat avant même de savoir s'il est autorisé à jouer."
  );
}

console.log("idle-protocol-version: OK");
