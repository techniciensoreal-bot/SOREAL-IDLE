import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { idleAdventureSnapshotV47, applyIdleAdventureActionV47, versZoneSureV1 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-05) : « je gagne un combat et il me dit Zone sûre : choisis une autre zone pour combattre, alors qu'on voit que je suis dans le ciel ». Plusieurs chemins peuvent ramener le joueur en Zone sûre (titan, K.O., zone
 * refermée par un Rebirth ou un défi, K.O. pendant l'absence). Aucun ne le disait : le serveur donne maintenant la RAISON (adventure.retourSafe) et le client l'écrit dans le journal d'Aventure.
 */
// 1. Zone refermée (le ciel demande le boss 48 dans le run) : repli sur la meilleure zone ouverte, avec la raison, sans heure (recalculé à chaque réponse).
{
  const base = idleAdventureSnapshotV47({}, 140);
  assert.equal(base.retourSafe.raison, "", "rien à signaler au départ");
  const ouvert = applyIdleAdventureActionV47({}, { action: "selectZone", zone: "sky" }, { bosses: 140 }).state;
  const snap = idleAdventureSnapshotV47(ouvert, 10);
  assert.notEqual(snap.selectedZone, "sky");
  assert.equal(snap.retourSafe.raison, "zone_fermee");
  assert.ok(/boss 48/.test(snap.retourSafe.detail) && /boss 10/.test(snap.retourSafe.detail), "la raison dit le boss demandé et le boss du run");
  assert.equal(snap.retourSafe.at, 0);
}
// 2. K.O. dans une zone : « defaite », avec une heure.
{
  let s = applyIdleAdventureActionV47({}, { action: "selectZone", zone: "tutorial" }, { bosses: 140 }).state;
  s = applyIdleAdventureActionV47(s, { action: "startZoneFight" }, { bosses: 140, stats: { power: 1000, toughness: 1000, hp: 1000, regen: 1 } }).state;
  const r = applyIdleAdventureActionV47(s, { action: "loseZoneFight" }, { bosses: 140, stats: { power: 1, toughness: 1, hp: 1, regen: 0 } });
  assert.equal(r.state.selectedZone, "safe");
  assert.equal(r.state.retourSafe.raison, "defaite");
  assert.ok(r.state.retourSafe.at > 0);
}
// 3. Assistant
{ const s = {}; versZoneSureV1(s, "x", "y", 123); assert.deepEqual(s, { selectedZone: "safe", retourSafe: { raison: "x", detail: "y", at: 123 } }); }
// 4. Chemins du serveur câblés : titan, K.O. hors ligne, défi, Renaissance.
const adv = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.ok(adv.includes('versZoneSureV1(s,"titan"') && adv.includes('versZoneSureV1(s,"ko_hors_ligne"') && adv.includes('versZoneSureV1(s,"defaite"'));
assert.ok(!/s\.selectedZone="safe"(?!;s\.retourSafe)/.test(adv.replace('export function versZoneSureV1(s,raison,detail,t=Date.now()){s.selectedZone="safe"', "")), "plus aucun retour en Zone sûre sans raison côté serveur");
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(rt.includes("raison:'defi'") && rt.includes("raison:'renaissance'"));
// 5. Client : une seule ligne dans le journal par retour, rien au premier état, répli de zone refermée annoncé une fois.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("      let idleRetourSafeCleV1=null;");
const b = ui.indexOf("      function appliquerSynchroCombatSansReflowIdleV116_(");
const lignes = [];
let zone = "sky";
const signaler = new Function("aventureMetaIdleV47_", "idleNombre_", "ajouterLogAventureIdleV1_", "console", ui.slice(a, b) + "\nreturn signalerRetourSafeIdleV1_;")((j) => j.a, (v) => Number(v) || 0, (t, x) => lignes.push(x), { warn() {} });
const etat = (r, z) => ({ a: { selectedZone: z, retourSafe: r } });
signaler(etat({ raison: "", detail: "", at: 0 }, "sky"));
assert.equal(lignes.length, 0, "premier état : rien");
signaler(etat({ raison: "defaite", detail: "Tu as été mis K.O. dans cette zone", at: 5 }, "safe"));
signaler(etat({ raison: "defaite", detail: "Tu as été mis K.O. dans cette zone", at: 5 }, "safe"));
assert.equal(lignes.length, 1, "annoncé une seule fois");
assert.ok(lignes[0].includes("Retour en Zone sûre") && lignes[0].includes("K.O."));
signaler(etat({ raison: "zone_fermee", detail: "Le Ciel : il faut avoir vaincu le boss 48", at: 0 }, "forest"));
signaler(etat({ raison: "zone_fermee", detail: "Le Ciel : il faut avoir vaincu le boss 48", at: 0 }, "forest"));
assert.equal(lignes.length, 2, "repli de zone refermée annoncé une fois malgré l'heure à 0");
assert.ok(lignes[1].startsWith("↩️ Zone changée"));
console.log("idle-aventure-retour-zone-sure-v1: OK");
