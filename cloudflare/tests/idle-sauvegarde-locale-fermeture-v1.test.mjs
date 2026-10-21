import assert from "node:assert/strict";
import { monde, tick } from "./helpers/monde-local.mjs";

/*
 * Fermeture et arrière-plan (audit anti-rollback, Norman, 2026-10-21) : quand la page passe en arrière-plan (Safari / iPhone) ou se ferme, la dernière progression est écrite sur l'appareil SANS attendre la minuterie de sauvegarde ;
 * l'envoi réseau d'une grosse partie peut être coupé par le navigateur, la copie de l'appareil est alors le seul filet.
 */
{
  const w = monde({ sansMinuterie: true });   // la minuterie de sauvegarde ne part jamais : seul l'événement de fermeture peut sauver
  await w.action(); await w.action(); await tick();
  assert.equal(w.store.size, 0, "rien n'est encore écrit (minuterie bloquée)");
  w.push = async () => { throw new Error("réseau coupé en arrière-plan"); };
  w.document.visibilityState = "hidden";
  w.evenement("visibilitychange");
  await tick();
  assert.equal(w.store.get("etat:2:n@x")?.cells[10], 2, "passage en arrière-plan : la progression (2 actions) est écrite sur l'appareil");
}
{
  const w = monde({ sansMinuterie: true });
  await w.action(); await tick();
  w.push = async () => { throw new Error("coupé par le navigateur"); };
  w.evenement("pagehide");
  await tick();
  assert.equal(w.store.get("etat:2:n@x")?.cells[10], 1, "fermeture de page : la copie de l'appareil est écrite même si l'envoi réseau est coupé");
}
console.log("idle-sauvegarde-locale-fermeture-v1: OK");
