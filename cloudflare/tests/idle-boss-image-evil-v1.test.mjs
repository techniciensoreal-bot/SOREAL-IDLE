import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-17) : "quand on commence le jeu en difficulté evil, ce sont
 * ces images qui devront être utilisées" (images 3D des boss, dossier R2
 * idle/bosses-evil/ servi par SOREAL-APP via /api/idle/media/boss).
 * La difficulté Evil s'appelle "difficile" dans l'état du jeu
 * (systemes.difficulty). Le client n'ajoute le paramètre que dans ce cas : le
 * serveur retombe lui-même sur l'image normale si l'image evil manque.
 */
const src = readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
const debut = src.indexOf("function urlBossR2IdleV1_(bossId){");
assert.ok(debut > 0, "urlBossR2IdleV1_ doit exister.");
const fin = src.indexOf("/* Historique V8", debut);
const corps = src.slice(debut, fin);
const fabrique = new Function("REG", corps + "\nreturn urlBossR2IdleV1_;");

const url = (etat, id) => fabrique({ idleEtat: etat })(id);

assert.equal(url({ systemes: { difficulty: "normal" } }, 7), "/api/idle/media/boss?id=7", "En normal, l'adresse est inchangée.");
assert.equal(url({ systemes: { difficulty: "difficile" } }, 7), "/api/idle/media/boss?id=7&difficulty=difficile", "En Evil, la difficulté est envoyée au serveur.");
assert.equal(url({ systemes: { difficulty: "extreme" } }, 7), "/api/idle/media/boss?id=7&difficulty=extreme", "En Sadistic, la difficulté est envoyée au serveur (photos réalistes).");
assert.equal(url(null, 7), "/api/idle/media/boss?id=7", "Sans état chargé, l'adresse est celle du normal.");
assert.equal(url({}, 7), "/api/idle/media/boss?id=7", "Sans systèmes, l'adresse est celle du normal.");
assert.equal(url({ systemes: { difficulty: "difficile" } }, 0), "", "Un boss sans numéro n'a pas d'adresse, même en Evil.");

console.log("idle-boss-image-evil-v1: OK");
