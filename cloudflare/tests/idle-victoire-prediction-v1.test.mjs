import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * « Le boss recule » (Norman, 2026-10-02 ; reproduit en production puis en local) : le client annonçait une victoire que le serveur résolvait en défaite.
 * Le serveur résout Fight Boss en temps continu (les deux se frappent en même temps, le premier à 0 PV perd) ; le client, lui, faisait frapper le joueur d'abord
 * à chaque tick, puis enregistrait la victoire ET la défaite dans le même tick (l'ordre « défaite » remplaçait l'ordre « démarrer » encore en file : le serveur
 * ne faisait jamais le combat). Résultat : boss suivant affiché, puis retour du boss précédent à pleine vie après la garde de 15 s.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Qui tombe en premier : les coups du joueur ne comptent que jusqu'à sa mort s'il meurt avant le boss.
assert.ok(ui.includes("function degatsNetsBossParSecondeIdleV1_(effetsMagie,maintenantTick){"));
assert.ok(ui.includes("const tempsAvantMortJoueur=recusParSec>0?idleNombre_(idleEtat.pvJoueur)/recusParSec:Infinity;"));
assert.ok(ui.includes("const dtJoueurFrappe=tempsAvantMortJoueur<tempsAvantMortBoss?Math.min(dt,tempsAvantMortJoueur):dt;"));
assert.ok(ui.includes("dps*dtJoueurFrappe"), "les dégâts au boss utilisent le temps réellement vécu par le joueur");

// 2. Un boss tué dans ce tick ne riposte pas (jamais victoire + défaite dans le même tick).
assert.ok(ui.includes("if(!idleCombatEnPauseApresDefaiteV1&&!idleVictoireBossLocaleV49){"));

// 3. Le calcul est celui de la riposte (mêmes facteurs : fureur, défense, bouclier, étourdissement, régénération).
{
  const debut = ui.indexOf("function degatsNetsBossParSecondeIdleV1_(");
  const fin = ui.indexOf("function regenPvFightBossNguParSecondeV164_(", debut);
  const f = new Function("idleNombre_", "idleEtat", "idleFureurActiveV70", "multiplicateurFureurLocaleIdleV70_", "regenPvFightBossNguParSecondeV164_",
    ui.slice(debut, fin) + "\nreturn degatsNetsBossParSecondeIdleV1_;");
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const etat = { attaqueBoss: 6500000, defense: 100 };
  const regen = () => 5;
  const calc = (e, fureur = false, mult = () => 2) => f(n, e, fureur, mult, regen);
  assert.equal(calc(etat)({}, 0), 6500000 - 100 - 5, "attaque - défense - régénération");
  assert.equal(calc(etat)({ bossStunJusqua: 10 }, 0), 0, "boss étourdi : aucun dégât");
  assert.equal(calc(etat)({ bouclierJusqua: 10, bouclierPct: 50 }, 0), (6500000 - 100) * 0.5 - 5, "bouclier magique");
  assert.equal(calc(etat, true, () => 2)({}, 0), 13000000 - 100 - 5, "fureur");
  assert.equal(calc({ attaqueBoss: 50, defense: 100 })({}, 0), 0, "défense > attaque : rien");
}
// 4. Fight cliqué pendant la victoire prédite (serveur pas encore confirmé) : retenu, puis lancé à la confirmation, jamais perdu en silence (Norman, 2026-10-02).
assert.ok(ui.includes("function retenirFightApresConfirmationIdleV1_(){"));
assert.ok(ui.includes("if(idleVictoireBossLocaleV49&&!trop)return;") && ui.includes("definirCombatBossIdleV39_(true);"), "le combat démarre quand le drapeau de victoire tombe");
assert.ok(/actif&&\s*idleVictoireBossLocaleV49&&\s*!idleEtat\.combatBossActif&&\s*idleNombre_\(idleEtat\.pvJoueur\)>0\s*\)\{\s*retenirFightApresConfirmationIdleV1_\(\);\s*return;/.test(ui), "le clic est retenu au lieu d'être ignoré");
console.log("idle-victoire-prediction-v1: OK");
