import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState,
  applyIdleNguAction,
  normalizeIdleNguState
} from "../src/idle-ngu-progression.js";
import { applyRebirthResetV56_ } from "../src/idle-ngu-actions.js";
import { towerHitsV1, towerOptimalCappedV1 } from "../src/idle-ngu-systemes.js";
import { macguffinOnItopodKillsV1 } from "../src/idle-macguffins-v1.js";
import { idleYggItopodPoopV1 } from "../src/idle-yggdrasil-extra-v1.js";
import { itopodFightV1 } from "../src/idle-itopod-combat-v1.js";

/*
 * Alignement du moteur de la Tour sur le jeu (audit du 2026-11-22, IL build 1260) : hors ligne (Character::adventureOfflineProgress), butin du 10e kill (AdventureController::enemyDeath),
 * dégâts entiers (EnemyAI::takeDamage), étage optimal (calculateBestItopodLevel), zone ITOPOD (ZoneSelector::changeZone), Rebirth, Idle Mode.
 */

function baseState(data, extra) {
  return Object.assign({
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: { tower: { unlocked: true, active: true, data: Object.assign({ floor: 0, killsOnFloor: 0, highestFloor: 200, kills: 0, ppProgress: 0 }, data) } },
    currencies: { pp: 0, experience: 0, ap: 0 }
  }, extra || {});
}
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
const T = () => Date.now();

// 1. Hors ligne : ni d.floor, ni d.killsOnFloor, ni tower.level ne bougent ; AP et EXP en divisions entières sans report.
{
  const s = advanceIdleNguState(baseState({ floor: 5, killsOnFloor: 3, highestFloor: 6, kills: 100 }), 3600, ctx, T());
  const d = s.systems.tower.data;
  assert.equal(d.floor, 5, "hors ligne : d.floor inchangé");
  assert.equal(d.killsOnFloor, 3, "hors ligne : compteur inchangé");
  assert.ok(d.kills > 100, "des kills ont lieu");
  assert.equal(d.highestFloor, 6, "aucun étage nouveau hors ligne");
  const kills = d.kills - 100;
  assert.equal(kills, Math.floor(3600 / 5), "kills = secondes / (1 + réapparition 4 s), reste perdu");
  /* étage joué = optimal plafonné à 6 : palier 1, 39 kills par AP */
  assert.equal(s.currencies.ap, Math.floor(kills / 39), "AP = kills / killsPerAP, division entière");
  assert.equal(d.apProgress, 0, "aucun reste d'AP reporté hors ligne");
  const exp = s.currencies.experience;
  assert.ok(exp > 0 && Math.abs(exp / s.currencies.ap - exp / Math.floor(kills / 39)) < 1e-9);
}

// 2. Poop hors ligne : seulement 1 par 9 000 kills, aucun tirage aléatoire (rng toujours 0 = tirage réussi à chaque kill en ligne).
{
  const s = baseState();
  s.systems.perks = { unlocked: true, data: { levels: { 30: 1 } } };
  s.selloutEffects = {};
  const gain = idleYggItopodPoopV1(s, 20000, () => 0, { horsLigne: true });
  assert.equal(gain, 2, "20 000 kills hors ligne = 2 poops (1 par 9 000)");
  assert.equal(s.selloutEffects.itopodPoopKills, 2000, "le reste de la progression est gardé");
  const enLigne = baseState();
  enLigne.systems.perks = { unlocked: true, data: { levels: { 30: 1 } } };
  enLigne.selloutEffects = {};
  assert.ok(idleYggItopodPoopV1(enLigne, 20, () => 0) >= 20, "en ligne : le tirage à 0,01 % par kill existe toujours");
}

// 3. MacGuffins ITOPOD hors ligne : floor(kills / 5 000), reste perdu ; en ligne : compteur qui court.
{
  const mk = (kills0) => {
    const s = baseState();
    s.systems.perks = { unlocked: true, data: { levels: { 68: 1 } } };
    s.systems.macguffins = { unlocked: true, data: { inventory: [], equipped: [], itopodKills: kills0, zoneCounter: { zone: "", kills: 0 }, sourceDropped: {}, serial: 1 } };
    return s;
  };
  const a = mk(4999);
  assert.equal(macguffinOnItopodKillsV1(a, 12000, () => 0, { horsLigne: true }).length, 2);
  assert.equal(a.systems.macguffins.data.itopodKills, 4999, "compteur en ligne non touché hors ligne, reste perdu");
  const b = mk(4999);
  assert.equal(macguffinOnItopodKillsV1(b, 12000, () => 0).length, 3, "en ligne : 4 999 + 12 000 = 3 drops");
  assert.equal(b.systems.macguffins.data.itopodKills, 1999);
}

// 5. 10e kill d'un étage : butin (AP palier) à l'étage SUIVANT, PP à l'étage du kill. Étage 49 (palier 1, 39 kills / AP) -> 50 (palier 2, 38).
{
  let s = baseState({ floor: 49, killsOnFloor: 0, highestFloor: 100, startFloor: 49, endFloor: 50 });
  s = advanceIdleNguState(s, 50, ctx, T());
  const d = s.systems.tower.data;
  assert.equal(d.kills, 10);
  assert.equal(d.floor, 50);
  const attendu = 9 / 39 + 1 / 38;
  assert.ok(Math.abs(d.apProgress + s.currencies.ap - attendu) < 1e-9, "AP : 9 kills au palier 1 + le 10e au palier 2 (" + (d.apProgress + s.currencies.ap) + " vs " + attendu + ")");
  assert.ok(Math.abs(d.ppProgress / (d.ppMult * (d.ppBase + 49) * 10) - 1) < 1e-9, "PP : l'étage du kill (49) pour les dix kills");
}

// 6. Dégâts du joueur entiers (Floor(dégâts / defenseFactor)).
{
  const s = advanceIdleNguState(baseState(), 5, { adventurePower: 1234.567, adventureToughness: 1e6, bosses: 30 }, T());
  assert.ok(Number.isInteger(s.systems.tower.data.degatsCoup), "dégâts d'un coup entiers : " + s.systems.tower.data.degatsCoup);
  /* même dégâts dans la formule par lots et dans la simulation de combat */
  const f = itopodFightV1({ floor: 30, ai: 0, power: 1234.567, toughness: 1e9, idleMult: 1.2, interval: 1, hp: 1e9, hpMax: 1e9, regen: 0, tMax: 1000 });
  assert.equal(f.hits, towerHitsV1(1234.567, 1.2, 30, 1), "coups de la simulation = coups du calcul par lots");
}

// 7. Étage optimal exposé = calculateBestItopodLevel : 0 sous 700 ; 1 sans plafond si le logarithme donne < 1 ; sinon plafonné au plus haut atteint.
{
  assert.equal(towerOptimalCappedV1(699, 1.2, 50), 0);
  assert.equal(towerOptimalCappedV1(700, 1.0, 0), 1, "logarithme < 1 : repli à 1 même avec plus haut = 0");
  assert.equal(towerOptimalCappedV1(1e6, 1.2, 0), 0, "plus haut = 0 : plafonné à 0");
  assert.equal(towerOptimalCappedV1(1e6, 1.2, 10), 10, "plafonné au plus haut atteint");
  assert.ok(towerOptimalCappedV1(1e6, 1.2, 1000) > 100, "sans plafond effectif : le calcul brut");
}

// 12. RÈGLE SOREAL (Norman, 2026-11-22 : « autorise l'ITOPOD et le mode Aventure à tourner en même temps ») : la Tour progresse en ligne EN PARALLÈLE de l'Aventure ; entrer = changeZone (niveau = départ, compteur 0) SANS quitter la zone d'Aventure ; choisir une zone ne quitte pas la tour ; Rebirth : niveau = départ, tower.active inchangé.
{
  let s = advanceIdleNguState(Object.assign(baseState(), {}), 20, ctx, T());
  assert.ok(s.systems.tower.data.kills > 0, "active : progresse");
  const inactif = baseState();
  inactif.systems.tower.active = false;
  const r = advanceIdleNguState(inactif, 20, ctx, T());
  assert.ok(r.systems.tower.data.kills > 0, "règle SOREAL : en ligne, la tour progresse sans être « entré » dès que la Puissance suffit (un coup tue l'étage 0)");
  assert.ok(advanceIdleNguState(inactif, 3600, ctx, T()).systems.tower.data.kills > 0, "hors ligne : inchangé (aucune zone exigée)");
  // entrer : niveau = départ, compteur = 0, sortie de la zone d'Aventure
  let e = normalizeIdleNguState({}, ctx, 1_000_000);
  e.systems.tower.unlocked = true;
  Object.assign(e.systems.tower.data, { floor: 12, killsOnFloor: 7, highestFloor: 40, startFloor: 5, endFloor: 9 });
  e.adventure.selectedZone = "tutorial";
  e = applyIdleNguAction(e, { action: "toggle", system: "tower", active: true }, ctx, 1_000_000).state;
  assert.equal(e.systems.tower.active, true);
  assert.equal(e.systems.tower.data.floor, 5, "changeZone : niveau = départ");
  assert.equal(e.systems.tower.data.killsOnFloor, 0, "changeZone : compteur = 0");
  assert.equal(e.adventure.selectedZone, "tutorial", "règle SOREAL : entrer dans l'ITOPOD ne quitte PAS la zone d'Aventure");
  // choisir une zone d'Aventure ne sort pas de l'ITOPOD
  e = applyIdleNguAction(e, { action: "adventure", adventure: { action: "selectZone", zone: "tutorial" } }, ctx, 1_000_000).state;
  assert.equal(e.adventure.selectedZone, "tutorial");
  assert.equal(e.systems.tower.active, true, "règle SOREAL : choisir une zone d'Aventure ne met pas tower.active à faux");
  // Rebirth : niveau = départ, compteur 0, PV remis à zéro ; plus haut étage, départ et fin gardés ; tower.active inchangé
  e.systems.tower.active = true;
  Object.assign(e.systems.tower.data, { floor: 8, killsOnFloor: 4, hp: 3, fightAi: 2, highestFloor: 40 });
  applyRebirthResetV56_(e, ctx, 2_000_000, {});
  const d = e.systems.tower.data;
  assert.equal(e.systems.tower.active, true, "Rebirth : tower.active inchangé (règle SOREAL)");
  assert.equal(d.floor, 5, "Rebirth : niveau = étage de départ");
  assert.equal(d.killsOnFloor, 0);
  assert.equal(d.hp, undefined);
  assert.equal(d.highestFloor, 40);
  assert.equal(d.startFloor, 5);
  assert.equal(d.endFloor, 9);
}

// 15. Idle Mode : supprimé (Norman, 2026-11-22 : « aucune utilité ») ; l'attaque automatique est toujours active, et une partie qui l'avait coupé avec l'ancien bouton est remise à vrai.
{
  let s = baseState();
  s.systems.tower.data.idleMode = false;
  s = advanceIdleNguState(s, 20, ctx, T());
  assert.equal(s.systems.tower.data.idleMode, true, "remis à vrai");
  assert.ok(s.systems.tower.data.kills > 0, "la tour progresse");
  assert.throws(() => applyIdleNguAction(s, { action: "towerIdleMode", enabled: false }, ctx, T()), "l'action n'existe plus");
}

console.log("idle-itopod-alignement-moteur-v1: OK");
