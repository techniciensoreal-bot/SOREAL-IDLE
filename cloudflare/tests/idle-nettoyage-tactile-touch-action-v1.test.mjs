import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-01) : « sur téléphone, j'ai beau passer mon doigt plusieurs fois sur le Coffre ou la valise, rien ne s'efface ». Cause mesurée (Chrome, vrais événements tactiles par le protocole DevTools) :
 * `touch-action:none` n'était posé que sur le pseudo-élément ::after de la flaque ; Chrome Android l'ignore, prend le glissement pour un défilement et envoie `pointercancel` après 2 mouvements
 * (le nettoyage s'arrête au premier trait). Correctif : `touch-action:none` sur la flaque ELLE-MÊME (la zone ::after en hérite). Ce test garde la règle.
 */
for (const [nom, fichier, classe] of [["Coffre", "coffre-accident-v1.js", "bg-flaque-v1"], ["valise", "valise-accident-v1.js", "vl-flaque-v1"]]) {
  const src = readFileSync("cloudflare/public/modules/" + fichier, "utf8");
  const re = new RegExp("'\." + classe + "\{[^']*touch-action:none[^']*\}'");
  assert.ok(re.test(src), nom + " : la règle de base de ." + classe + " porte touch-action:none (pas seulement ::after)");
  assert.ok(new RegExp("\." + classe + "::after\{[^}]*touch-action:none").test(src), nom + " : la zone ::after garde aussi touch-action:none");
  /* le frottement reste sur pointermove (pas de touchmove passif ni de lecture lourde) : une seule lecture de rectangle, pas de balayage de pixels */
  assert.ok(!/getImageData|getComputedStyle/.test(src), nom + " : aucun balayage de pixels ni lecture de style dans le geste");
}
console.log("idle-nettoyage-tactile-touch-action-v1: OK");
