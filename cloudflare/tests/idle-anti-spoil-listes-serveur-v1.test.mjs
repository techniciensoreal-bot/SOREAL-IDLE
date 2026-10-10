import assert from "node:assert/strict";
import { idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * AGENTS.md, règle n°2 : « Les listes envoyées par le serveur ne contiennent que ce qui est découvert (la taille d'une liste ne doit pas révéler un total). »
 * Balayage en ligne du 2026-10-06 avec un joueur neuf : la réponse contenait les catalogues complets de systèmes encore verrouillés (mineurs, fruits,
 * MacGuffins, cartes, atouts, manies) et les paliers de difficulté Evil/Sadistic de la liste des NGU.
 */
const t0 = 1_000_000;
const neuf = normalizeIdleNguState({}, {}, t0);
const s = idleNguSnapshot(neuf, {}, t0);

assert.deepEqual(s.diggerDefinitions, [], "mineurs : aucune liste");
assert.deepEqual(s.yggFruits, [], "fruits : aucune liste");
assert.deepEqual(s.perkDefinitions, [], "atouts : aucune liste");
assert.deepEqual(s.quirkDefinitions, [], "manies : aucune liste");
assert.deepEqual(s.macguffins.types, [], "MacGuffins : aucun type");
assert.deepEqual(s.macguffins.randomPool, [], "MacGuffins : aucune réserve de tirage");
assert.deepEqual(s.macguffins.permanent, {}, "MacGuffins : aucun compteur par type");
assert.deepEqual(s.cards.types, [], "cartes : aucun type");
assert.deepEqual(Object.keys(s.ngus.tiers), ["normal"], "NGU : seul le palier de la difficulté en cours est envoyé");
assert.deepEqual(s.ngus.tiers.normal, [], "NGU : aucune liste tant que le système n'est pas découvert");

/* Un système verrouillé n'expose ni nom, ni icône, ni condition de déblocage, ni pistes. */
for (const sys of s.systems.filter((x) => !x.state.unlocked)) {
  assert.equal(sys.name, "", sys.id + " : pas de nom");
  assert.equal(sys.icon, "", sys.id + " : pas d'icône");
  assert.deepEqual(sys.unlock, { unlocked: false }, sys.id + " : pas de condition de déblocage");
  assert.deepEqual(sys.tracks, [], sys.id + " : pas de pistes");
}
/* Zones et titans : seulement ce qui est atteignable. */
assert.ok(s.adventure.zones.every((z) => z.unlocked || z.id === s.adventure.selectedZone || z.id === s.adventure.lastCombatZone), "aucune zone fermée");
assert.ok(s.adventure.titans.every((t) => t.progressionUnlocked || (t.state && t.state.kills > 0)), "aucun titan hors d'atteinte");

/* Succès et portraits : seulement l'obtenu, jamais une condition ni un total. */
/* EXCEPTION voulue par Norman (2026-10-10) : la page des succès montre tous les trophées ; le serveur masque lui-même ce qui n'est pas encore visible (ni nom ni seuil) et donne le boss à tuer. */
assert.ok(s.achievements.list.every((a) => a.unlocked || a.voirApresBoss > 0 ? (a.unlocked || (a.name === undefined && a.threshold === undefined)) : true), "succès : objectif masqué par le serveur tant que le boss requis n'est pas vaincu");
assert.ok(s.portraits.list.every((p) => p.unlocked || p.condition === undefined), "portraits : aucune condition envoyée");
assert.equal(s.portraits.total, s.portraits.unlockedCount, "portraits : pas de total");

/* Une fois découverts, les systèmes retrouvent leurs listes. */
for (const id of ["diggers", "yggdrasil", "perks", "quirks", "macguffins", "cards", "ngu"]) neuf.systems[id].unlocked = true;
const d = idleNguSnapshot(neuf, {}, t0);
assert.ok(d.diggerDefinitions.length > 0, "mineurs découverts");
assert.ok(d.yggFruits.length > 0, "fruits découverts");
assert.ok(d.perkDefinitions.length > 0, "atouts découverts");
assert.ok(d.quirkDefinitions.length > 0, "manies découvertes");
assert.ok(d.macguffins.types.length > 0, "MacGuffins découverts");
assert.ok(d.cards.types.length > 0, "cartes découvertes");
assert.ok(d.ngus.tiers.normal.length > 0, "NGU découverts");
assert.equal(d.ngus.tiers.evil, undefined, "difficulté normale : jamais de palier Evil");
assert.equal(d.ngus.tiers.sadistic, undefined, "difficulté normale : jamais de palier Sadistic");

console.log("idle-anti-spoil-listes-serveur-v1: OK");
