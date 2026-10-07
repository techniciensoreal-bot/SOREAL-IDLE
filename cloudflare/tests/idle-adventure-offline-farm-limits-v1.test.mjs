import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeIdleAdventureStateV47,
  advanceAdventureZoneAutoFarmOfflineV1,
  idleAdventureInventoryCapacityV1
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-29) : « Je ne loot pas en étant hors ligne. » -- rapporté juste après la mise en
 * ligne de la Beta 6.3, qui avait câblé les 3 contraintes demandées (8h max, jamais plus de 70% de
 * l'inventaire, une vraie mort possible avec le monstre/la zone dans le journal) sur l'ancien
 * simulateur LEGACY (idle-sqlite-runtime.js, j.aventure) dont le déclencheur
 * (statsAuto.autoAventure/autoAventureZone) n'est en réalité JAMAIS mis à vrai nulle part -- confirmé
 * par grep exhaustif, switch mort depuis toujours. Ce fichier testait donc, avec un luxe de détails,
 * la forme d'un code qui ne s'exécute jamais.
 *
 * Remplacé par advanceAdventureZoneAutoFarmOfflineV1 (idle-adventure-v47.js), câblé dans
 * advanceLateSystems (idle-ngu-progression.js) sur le VRAI système que tout le reste de la session
 * cible déjà (state.adventure, IDLE_ADVENTURE_ZONES, rollKill) -- ce test exerce donc la fonction
 * RÉELLEMENT, avec de vrais états et de vrais retours, plutôt que de relire du texte source.
 */

function stateAvecZone(zoneId, overrides = {}) {
  const s = normalizeIdleAdventureStateV47({});
  s.lastCombatZone = zoneId;
  s.selectedZone = zoneId;
  // Un vrai retour de joueur : il a déjà réellement combattu dans cette zone avant de partir (voir
  // la garde aDejaCombattuEnAventure -- sans elle, lastCombatZone valant TOUJOURS "tutorial" par
  // défaut aurait fait farmer un joueur qui n'a JAMAIS ouvert l'onglet Aventure, dès que bosses>=4).
  if (zoneId !== "safe") s.zone.encounters[zoneId] = 1;
  return Object.assign(s, overrides);
}

// --- Aucune zone de combat connue / zone verrouillée : aucun farm, aucune mutation. ---
{
  const s = stateAvecZone("safe");
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, { bosses: 4, stats: { power: 1e6, toughness: 1e6, hp: 1e6, regen: 100 } }, 3600, 1000);
  assert.deepEqual(r, { kills: 0, gold: 0, experience: 0, drops: 0, derniereDefaite: null }, "Safe Zone : jamais de combat, jamais de farm");
}
{
  // lastCombatZone par défaut ("tutorial", boss:4) mais bosses=0 : zone pas encore débloquée -- pas de farm.
  const s = normalizeIdleAdventureStateV47({});
  assert.equal(s.lastCombatZone, "tutorial", "hypothèse de test : une nouvelle partie pointe par défaut vers tutorial");
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, { bosses: 0, stats: { power: 100, toughness: 100, hp: 100, regen: 10 } }, 3600, 1000);
  assert.deepEqual(r, { kills: 0, gold: 0, experience: 0, drops: 0, derniereDefaite: null }, "zone pas encore débloquée (bosses insuffisants) : jamais de farm auto");
}
{
  // lastCombatZone par défaut ("tutorial") ET zone débloquée (bosses=4), mais AUCUN combat réel avant :
  // un joueur qui n'a jamais touché l'Aventure ne doit jamais se retrouver à la farmer tout seul.
  const s = normalizeIdleAdventureStateV47({});
  assert.equal(Object.keys(s.zone.kills).length, 0);
  assert.equal(Object.keys(s.zone.encounters).length, 0);
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, { bosses: 4, stats: { power: 1e7, toughness: 1e7, hp: 1e7, regen: 1000 } }, 3600, 1000);
  assert.deepEqual(r, { kills: 0, gold: 0, experience: 0, drops: 0, derniereDefaite: null }, "zone débloquée mais jamais combattue en vrai : jamais de farm fantôme");
}

// --- Joueur très surpuissant sur une zone faible : farm réel, kills > 0, or/expérience crédités via le vrai rollKill. ---
{
  const s = stateAvecZone("tutorial");
  const ctx = { bosses: 4, stats: { power: 1e7, toughness: 1e7, hp: 1e7, regen: 1000 } };
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, ctx, 3600, 1000);
  assert.ok(r.kills > 0, "un joueur écrasant doit accumuler de vrais kills en 1h hors ligne");
  assert.equal(r.derniereDefaite, null, "un joueur écrasant ne doit jamais mourir face à la zone Tutoriel");
  assert.ok(s.zone.kills.tutorial >= r.kills, "les kills doivent être réellement comptés dans le vrai compteur de zone (rollKill)");
  assert.ok(s.permanent.gold > 0, "rollKill doit vraiment créditer de l'or (plage définie pour Tutoriel)");
}

// --- Plafond de 8h : au-delà, aucun kill supplémentaire n'est simulé, quelle que soit la durée hors ligne. ---
{
  const alea = Math.random;
  try {
    // Séquence figée : jamais de boss, toujours le même index de monstre -- chaque combat dure exactement le même temps.
    Math.random = () => 0.9;
    const ctx = { bosses: 4, stats: { power: 1e7, toughness: 1e7, hp: 1e7, regen: 1000 } };

    const s8h = stateAvecZone("tutorial");
    const r8h = advanceAdventureZoneAutoFarmOfflineV1(s8h, ctx, 8 * 60 * 60, 1000);

    const s100h = stateAvecZone("tutorial");
    const r100h = advanceAdventureZoneAutoFarmOfflineV1(s100h, ctx, 100 * 60 * 60, 1000);

    assert.ok(r8h.kills > 0, "8h doit déjà produire des kills avec cette séquence figée");
    assert.equal(r100h.kills, r8h.kills, "100h hors ligne ne doit JAMAIS produire plus de kills que le plafond de 8h (même séquence figée)");
  } finally {
    Math.random = alea;
  }
}

// --- Plafond de 70% de l'inventaire : le farm s'arrête sans looter au-delà, une place reste toujours libre. ---
{
  const s = stateAvecZone("tutorial");
  const capacite = idleAdventureInventoryCapacityV1(s);
  const seuil = Math.floor(capacite * 0.7);
  for (let i = 0; i < seuil; i++) s.inventory.push({ id: "bourrage" + i, definitionId: "x", level: 0 });
  const avant = s.inventory.length;

  const ctx = { bosses: 4, stats: { power: 1e7, toughness: 1e7, hp: 1e7, regen: 1000 } };
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, ctx, 3600, 1000);

  assert.equal(r.kills, 0, "déjà à 70% de l'inventaire : le farm hors ligne ne doit tenter aucun combat");
  assert.ok(s.inventory.length <= capacite, "jamais plus que la capacité réelle, une place doit rester disponible pour le butin de titan etc.");
  assert.equal(s.inventory.length, avant, "aucun objet ajouté quand le plafond dédié est déjà atteint au départ");
}

// --- Un joueur bien trop faible pour la zone meurt réellement : kills=0, mort capturée avec monstre + zone + KO. ---
{
  const s = stateAvecZone("mega"); // zone très forte (boss:100, oneHitP dans les millions)
  const ctx = { bosses: 200, stats: { power: 1, toughness: 1, hp: 1, regen: 0 } };
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, ctx, 3600, 1000);

  assert.equal(r.kills, 0, "un joueur bien trop faible ne doit remporter aucun combat");
  assert.ok(r.derniereDefaite, "la mort doit être capturée, pas juste un farm silencieusement arrêté");
  assert.ok(r.derniereDefaite.monstre.length > 0, "le nom du monstre qui a tué le joueur doit être connu");
  assert.equal(r.derniereDefaite.zone, "Mégaterres", "le nom affichable de la zone (IDLE_ADVENTURE_ZONES) doit être utilisé, pas son id technique");
  assert.equal(r.derniereDefaite.ko, true, "une vraie défaite (jamais un simple abandon faute de temps ici)");
  assert.equal(s.selectedZone, "safe", "comme une vraie défaite en ligne (loseZoneFight), la zone active retombe à Safe Zone");
}

// --- Un combat resté ouvert au moment de la mise hors ligne est abandonné, jamais deviné (seul le client connaît son issue). ---
{
  const s = stateAvecZone("tutorial");
  s.fight = { active: true, zone: "tutorial", monsterHp: 5, monsterHpMax: 40, boss: false, playerHp: 3, playerHpMax: 50 };
  const ctx = { bosses: 4, stats: { power: 1e7, toughness: 1e7, hp: 1e7, regen: 1000 } };
  advanceAdventureZoneAutoFarmOfflineV1(s, ctx, 3600, 1000);
  assert.equal(s.fight.active, false, "un combat laissé ouvert doit être clôturé sans qu'on ne lui invente une issue");
}

// --- Câblage : advanceLateSystems (idle-ngu-progression.js) déclenche le farm après un vrai écart, jamais à chaque poll en ligne. ---
{
  const progression = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
  assert.ok(progression.includes("advanceAdventureZoneAutoFarmOfflineV1"), "advanceLateSystems doit appeler le nouveau simulateur réel");
  assert.match(
    progression,
    /const SEUIL_FARM_OFFLINE_SEC = 5 \* 60;\s*\n\s*if \(seconds >= SEUIL_FARM_OFFLINE_SEC\) \{/,
    "un seuil doit empêcher le farm de tourner en double à chaque poll en ligne (~15s, syncSecondes)"
  );
  assert.ok(progression.includes("state.adventure.lastAutoFarmSummaryV1 = resumeFarm"), "le résumé de CE sync doit être déposé pour idle-sqlite-runtime.js");
}

// --- Câblage : idle-sqlite-runtime.js lit puis retire ce résumé avant la persistance, et alimente autoAventureHorsLigne. ---
{
  const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  const iCapture = runtime.indexOf("const autoFarmAventureEtat =");
  assert.ok(iCapture > 0, "le résumé doit être capturé dans construireEtatJoueurSorealIdle_");
  const iDelete = runtime.indexOf("delete metaNguEtat.adventure.lastAutoFarmSummaryV1", iCapture);
  const iPersist = runtime.indexOf("JSON.stringify(statsEtat)", iCapture);
  assert.ok(iDelete > iCapture && iDelete < iPersist, "le champ transitoire doit être retiré AVANT la persistance (JSON.stringify(statsEtat)), jamais sauvegardé");
  assert.match(runtime, /autoAventureHorsLigne:\s*\n\s*autoFarmAventureEtat/, "le champ client autoAventureHorsLigne doit venir du VRAI résumé, plus de l'ancien progression.autoAventureHorsLigne mort");
}

// --- Zone sûre avec une ancienne zone de combat gardée (Norman, 2026-10-08) : AUCUN farm simulé, sinon un butin surprise tombe en rejoignant une autre zone. ---
{
  const s = stateAvecZone("hsb");
  s.selectedZone = "safe";
  const avant = JSON.stringify(s.inventory);
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, { bosses: 120, stats: { power: 1e9, toughness: 1e9, hp: 1e9, regen: 1000 } }, 3600, 1000);
  assert.deepEqual(r, { kills: 0, gold: 0, experience: 0, drops: 0, derniereDefaite: null }, "en Zone sûre : pas de farm, même si la dernière zone de combat était la base haute sécurité");
  assert.equal(JSON.stringify(s.inventory), avant, "aucun objet ajouté");
  assert.equal(s.selectedZone, "safe", "la zone sélectionnée ne change pas");
}
// --- La zone farmée est celle qui est sélectionnée ---
{
  const s = stateAvecZone("forest");
  s.lastCombatZone = "tutorial";
  s.zone.encounters.tutorial = 1;
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, { bosses: 30, stats: { power: 1e9, toughness: 1e9, hp: 1e9, regen: 1000 } }, 3600, 1000);
  assert.ok(r.kills > 0, "farm dans la zone sélectionnée");
  assert.ok((s.zone.kills.forest || 0) > 0 && !(s.zone.kills.tutorial > 0), "les kills sont dans la zone sélectionnée, pas dans l'ancienne");
}
console.log("idle-adventure-offline-farm-limits-v1: OK");
