import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : « Je ne peux toujours pas remplir les objets avec les boosts spéciaux » (bottes équipées qui peuvent en
 * recevoir). Cause : `decisionActionSlotAdventureIdleV138_` traitait tout dépôt d'un boost spécial sur une pièce d'équipement en
 * « équiper » (échange de place), règle écrite quand les pièces de set n'avaient aucun Special. Depuis l'audit du 2026-09-23, la plupart
 * en ont un (baseSpecial > 0) : elles doivent recevoir le boost. (Une lecture erronée du même message avait, le matin du 2026-09-24,
 * interdit ces boosts sur tous les objets côté serveur et client : annulé.)
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function decisionActionSlotAdventureIdleV138_(");
const fin = ui.indexOf("function appliquerActionSlotAdventureIdleV138_(");
assert.ok(debut > 0 && fin > debut);
const decision = ui.slice(debut, fin);

// Le refus « équiper » ne vise plus que les pièces SANS Special.
assert.match(decision, /source\.boostType==='special'&&occupant\.kind==='equipment'&&!\(idleNombre_\(occupant\.baseSpecial\)>0\)\)\{\s*return 'equiper';/);
// Puis « booster » reste la décision pour tout boost déposé sur équipement, accessoire ou cube.
assert.match(decision, /occupant\.kind==='equipment'\|\|occupant\.kind==='special'\|\|occupant\.kind==='cube'\)\)\{\s*return 'booster';/);
// Plus aucune restriction « cube seulement » côté client.
assert.ok(!ui.includes("Un boost spécial ne peut remplir que le Cube"));
assert.ok(!ui.includes("if(type==='special'&&target.kind!=='cube')return false;"));

// Serveur : une pièce de set qui a un Special reçoit le boost (voir idle-adventure-set-item-specials.test.mjs).
const moteur = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.match(moteur, /const specialPiece=cible\?\.kind==="set"&&Boolean\(idleAdventureSetSpecialsV1\(cible\.set,cible\.slot\)\);/);
assert.ok(!moteur.includes("idleAdventureSpecialBoostTargetV1"));

console.log("idle-special-boost-equipment-client-v1: OK");
