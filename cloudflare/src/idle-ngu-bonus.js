/*
 * NGU : niveaux, Barbes, bonus agrégés et statistiques d'Aventure (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleAchievementsBpV1, idleAchievementsApMultiplierV1, IDLE_ACHIEVEMENTS_V1, idleAchievementBossRequisV1 } from "./idle-achievements-v1.js";
import { IDLE_NGU_TIERS_V1, IDLE_NGU_CATALOG_V1, IDLE_NGU_MAX_LEVEL_V1, nguEffectsV1, nguActiveTiersV1, nguParamsV1, nguLevelsFromWorkV1 } from "./idle-ngu-catalog-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { idleQuirkNiveauxV1, idlePerkNiveauxV1, idleWishTracksActifsV1 } from "./idle-difficulty-gates-v1.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { idleAdventureEquipmentStatsV47, idleAdventureMemoNouvelleRequeteV1, idleAdventureSetRewardProductV1, idleAdventureCubeTierV1 } from "./idle-adventure-v47.js";
import { idleHeartsApMultiplierV1, idleHeartsExpMultiplierV1, idleHeartsHackSpeedMultiplierV1 } from "./idle-hearts-v1.js";
import { idleCardsMultiplierV1, idleCardsApplyToBonusesV1 } from "./idle-cards-v1.js";
import { macguffinEffectMultiplierV1, macguffinApplyToBonusesV1 } from "./idle-macguffins-v1.js";
import { wishBonusesV1 } from "./idle-wishes-v1.js";
import { idleYggPowerDeltaMultiplierV1 } from "./idle-yggdrasil-extra-v1.js";
import { idleSelloutPotionFactorV1 } from "./idle-sellout-shop-v1.js";
import { levelsPerFillBasicTrainingV411 } from "./idle-basic-training.js";
import { externalResourceAllocation, idleNguAugmentationMultiplier, idleNguEffectiveResourceStatV1, totalAllocated, totalTrackLevel } from "./idle-ngu-ressources.js";
import { IDLE_NGU_AUGMENTATIONS, IDLE_NGU_META_VERSION, IDLE_NGU_TRACKS, challengePermanentBonuses, clamp, clone, int, nowMs, num } from "./idle-ngu-catalogues.js";
import { RICH_JERKS_PCT_PER_LEVEL_V1, createYggdrasilData, normalizeIdleNguState, wandoosCombatMultiplierV1 } from "./idle-ngu-etat.js";
import { advanceIdleNguState, availableDiggerSlots, diggerBonuses, diggerDrainTotal, diggerGlobalBonus, trollFlagsV1, trollNguOffV1 } from "./idle-ngu-systemes.js";
import { wishLevelV1 } from "./idle-ngu-snapshot.js";
import { beardActiveIdsV1, beardTrackUnlocked, idleNguTimeMachineGoldPerSecond, idleNguTimeMachineGrossGoldPerSecond } from "./idle-ngu-pistes.js";
import { __nguCtx } from "./idle-ngu-progression.js";
import { daycareFactorsV1, expShopPurchasedV1, idleNguRichJerksAttackPctV1 } from "./idle-ngu-actions.js";

/*
 * Mesures des succès (idle-achievements-v1.js). Energy/Magic Power, Cap et Bar :
 * valeurs totales effectives (achat + bonus), celles que le jeu affiche ("Obtain
 * A Total Energy Cap of ..."). Boss : plus haut boss vaincu toutes difficultés
 * ("Defeat Boss 10!"). The Beast V1-V4 = paliers Easy/Normal/Hard/Brutal (même
 * lecture que "The Beast v4 beaten" -> beastBrutalDefeated).
 */
export function achievementMetricsV1(state) {
  return avecPorteeBonusV1(state, () => achievementMetricsLectureV1(state));
}

function achievementMetricsLectureV1(state) {
  const eff = (r, s) => idleNguEffectiveResourceStatV1(state, r, s);
  const flags = state.adventure?.unlockFlags || {};
  const peaks = state.difficultyPeaks || {};
  return {
    energyPower: eff("energy", "power"),
    magicPower: eff("magic", "power"),
    energyCap: eff("energy", "cap"),
    magicCap: eff("magic", "cap"),
    energyBars: eff("energy", "bars"),
    magicBars: eff("magic", "bars"),
    highestBoss: Math.max(0, num(state.records?.highestBoss, 0)),
    totalRebirths: Math.max(0, num(state.records?.totalRebirths, 0)),
    nguUnlocked: Boolean(state.systems.ngu?.unlocked),
    yggdrasilUnlocked: Boolean(state.systems.yggdrasil?.unlocked),
    beardsUnlocked: Boolean(state.systems.beards?.unlocked),
    walderpFinal: Boolean(flags.walderpFinalDefeated),
    beastV1: Boolean(flags.beastDefeated_easy),
    beastV2: Boolean(flags.beastDefeated_normal),
    beastV3: Boolean(flags.beastDefeated_hard),
    beastV4: Boolean(flags.beastDefeated_brutal || flags.beastBrutalDefeated),
    evilEntered: state.difficulty === "difficile" || state.difficulty === "extreme" || num(peaks.difficile, 0) > 0 || num(peaks.extreme, 0) > 0,
    speedrun: num(state.records?.speedrunBonusClaimed, 0) > 0,
    cornerClicked: num(state.records?.cornerClicked, 0) > 0,
    /* « Wear a set of Helmet, Chest, Legs, Boots, and Weapon, all at level 69 » (wiki, Secret Achievements) : les cinq emplacements équipés, chacun au niveau 69 (le set d'origine n'est pas exigé : le texte ne le dit pas). */
    level69Set: (() => {
      const equipement = state.adventure?.equipment || {};
      const sac = Array.isArray(state.adventure?.inventory) ? state.adventure.inventory : [];
      return ["head", "chest", "legs", "boots", "weapon"].every((emplacement) => {
        const id = equipement[emplacement];
        if (!id) return false;
        const objet = sac.find((x) => x && x.id === id);
        return Boolean(objet) && num(objet.level, 0) === 69;
      });
    })()
  };
}

export function achievementsSnapshotV1(state) {
  const unlocked = state.systems.achievements?.data?.unlocked || {};
  return {
    bp: idleAchievementsBpV1(state),
    apMultiplier: idleAchievementsApMultiplierV1(state),
    /*
     * Page des succès (Norman, 2026-10-10 : « ils doivent tous être visibles sous forme de case, les débloqués en couleur, les autres grisés ; l'objectif en ????? tant qu'on n'a pas débloqué ce à quoi il se
     * rapporte, avec toujours le boss à tuer pour voir les infos »). Décision de Norman : exception à la règle n°2 pour CETTE page. Le serveur masque lui-même ce qui n'est pas encore visible :
     * le nom et le seuil ne partent que si le succès est obtenu ou si le boss requis (idleAchievementBossRequisV1) est vaincu ; sinon `voirApresBoss` donne le boss à tuer.
     */
    list: (() => {
      const meilleurBoss = Math.max(0, Math.floor(num(state.records?.highestBoss, 0)));
      return IDLE_ACHIEVEMENTS_V1.map(a => {
        const fait = unlocked[a.id] !== undefined;
        const requis = idleAchievementBossRequisV1(a);
        /*
         * Norman (2026-10-10) : (1) « Boss vaincus » : jamais le numéro d'un boss avant de l'avoir vaincu, que des ??? (pas de nom, pas de seuil, pas de boss à tuer : `bossMasque`) ;
         * (2) les trophées « Débloquer le menu NGU / Yggdrasil / Barbes » et le secret du caca (Norman, 2026-10-16 : un trophée caché ne dit pas ce qu il faut faire) ne se dévoilent qu'une fois obtenus (leur simple texte annonçait un menu que le joueur n'a pas encore).
         */
        const estBoss = a.group === "boss";
        const menuSecret = a.id === "secretNguMenu" || a.id === "secretYggdrasilMenu" || a.id === "secretBeardsMenu" || a.id === "secretAtCorner";
        const visible = fait || (!estBoss && !menuSecret && meilleurBoss >= requis);
        const o = { id: a.id, group: a.group, bp: a.bp, secret: a.secret, unlocked: fait, voirApresBoss: visible ? 0 : (estBoss ? 1 : requis) };
        if (!visible && estBoss) o.bossMasque = true;
        if (visible) { o.name = a.name; o.threshold = a.threshold; o.tracked = a.tracked; }
        return o;
      });
    })()
  };
}

export function syncIdleNguState(raw, context = {}, now = Date.now()) {
  const state = normalizeIdleNguState(raw, context, now);
  const elapsed = Math.max(0, (nowMs(now) - state.updatedAt) / 1000);
  return advanceIdleNguState(state, elapsed, context, now);
}

/*
 * NGU (2026-09-23, audit) : 16 NGU x 3 paliers, chacun avec son niveau, son
 * travail accumulé (unités de niveau : N -> N+1 coûte N+1) et sa propre
 * allocation. Un seul palier reçoit de l'énergie/magie à la fois.
 */
export function createNguDataV1() {
  const ngus = {};
  for (const tier of IDLE_NGU_TIERS_V1) {
    ngus[tier] = {};
    for (const def of IDLE_NGU_CATALOG_V1) ngus[tier][def.id] = { level: 0, work: 0, allocation: 0, target: 0 };
  }
  return { tier: "normal", ngus, advance: { energy: false, magic: false } };
}

export function normalizeNguDataV1(raw) {
  const out = createNguDataV1();
  const src = raw && typeof raw === "object" ? raw : {};
  if (IDLE_NGU_TIERS_V1.includes(src.tier)) out.tier = src.tier;
  for (const tier of IDLE_NGU_TIERS_V1) {
    for (const def of IDLE_NGU_CATALOG_V1) {
      const n = src.ngus?.[tier]?.[def.id] || {};
      out.ngus[tier][def.id] = {
        level: clamp(Math.floor(num(n.level, 0)), 0, IDLE_NGU_MAX_LEVEL_V1),
        work: Math.max(0, num(n.work, 0)),
        allocation: Math.max(0, num(n.allocation, 0)),
        target: clamp(Math.floor(num(n.target, 0)), 0, IDLE_NGU_MAX_LEVEL_V1)
      };
    }
  }
  out.advance = { energy: Boolean(src.advance?.energy), magic: Boolean(src.advance?.magic) };
  return out;
}

function nguAllocationSumV1(data, resource) {
  let total = 0;
  for (const tier of IDLE_NGU_TIERS_V1) {
    for (const def of IDLE_NGU_CATALOG_V1) {
      if (def.resource === resource) total += Math.max(0, num(data?.ngus?.[tier]?.[def.id]?.allocation, 0));
    }
  }
  return total;
}

export function syncNguAllocationTotalsV1(system) {
  system.allocation.energy = nguAllocationSumV1(system.data, "energy");
  system.allocation.magic = nguAllocationSumV1(system.data, "magic");
  system.level = Object.values(system.data.ngus).reduce(
    (sum, tierNgus) => sum + Object.values(tierNgus).reduce((t, n) => t + n.level, 0),
    0
  );
  system.permanentLevel = system.level;
}

export function clearNguAllocationsV1(system, resource) {
  for (const tier of IDLE_NGU_TIERS_V1) {
    for (const def of IDLE_NGU_CATALOG_V1) {
      if (def.resource === resource && system.data?.ngus?.[tier]?.[def.id]) system.data.ngus[tier][def.id].allocation = 0;
    }
  }
}

function nguLevelsMapV1(state) {
  const out = {};
  const data = state.systems.ngu?.data;
  for (const tier of IDLE_NGU_TIERS_V1) {
    out[tier] = {};
    for (const def of IDLE_NGU_CATALOG_V1) out[tier][def.id] = Math.max(0, num(data?.ngus?.[tier]?.[def.id]?.level, 0));
  }
  return out;
}

/*
 * Effets des Hacks (wiki Hacks) : (100 % + Effect par niveau x Niveau) x Milestone bonus^(nombre
 * de milestones), milestones = floor(niveau / niveaux par milestone) ; « Hacks do not affect Normal
 * mode ». Jusqu'ici seule leur VITESSE était lue : aucun effet n'était appliqué.
 */
export function hackFxV1(state) {
  const out = {};
  for (const def of IDLE_NGU_TRACKS.hacks || []) out[def.id] = 1;
  if (state.difficulty === "normal") return out;
  const tracks = state.systems.hacks?.data?.tracks || {};
  const reduction = quirkBonusesV1(idleQuirkNiveauxV1(state)).hackMilestoneReduction || {};
  const perkReduction = Object.assign({}, perkBonusesV1(idlePerkNiveauxV1(state)).hackMilestoneReduction || {});
  perkReduction.qpGain = (perkReduction.qpGain || 0) + wishLevelV1(state, 76);
  perkReduction.number = (perkReduction.number || 0) + wishLevelV1(state, 77);
  perkReduction.hackHack = (perkReduction.hackHack || 0) + wishLevelV1(state, 78);
  for (const def of IDLE_NGU_TRACKS.hacks || []) {
    const level = Math.max(0, int(tracks[def.id]?.level, 0));
    if (level <= 0) continue;
    const perMilestone = Math.max(1, num(def.levelsPerMilestone, 1) - Math.max(0, num(reduction[def.id], 0)) - Math.max(0, num(perkReduction[def.id], 0)));
    const milestones = Math.floor(level / perMilestone);
    out[def.id] = (1 + (num(def.effectPerLevelPct, 0) * level) / 100) * Math.pow(num(def.milestoneBonusPct, 100) / 100, milestones);
  }
  return out;
}

/* Effets de tous les NGU (ratios) -- neutres sous le No NGU Challenge. */
export function nguFxV1(state) {
  if (state.challenge?.active === "noNgu" || trollNguOffV1(state)) return nguEffectsV1({}, state.difficulty);
  return nguEffectsV1(nguLevelsMapV1(state), state.difficulty);
}

export function nguTotalLevelsV1(state) {
  const map = nguLevelsMapV1(state);
  let total = 0;
  for (const tier of IDLE_NGU_TIERS_V1) for (const id of Object.keys(map[tier])) total += map[tier][id];
  return total;
}

/*
 * Vitesse (multiplicateur) des NGU alimentés par `resource` : défis, Beard
 * Cage, Digger Energy/Magic NGU, set Meta/Back To School, objets, perks
 * "Faster NGU Energy/Magic", et le NGU "Magic NGU" (accélère les NGU Magic) /
 * "Energy NGU" (accélère les NGU Energy).
 */
/* Specials cumulés (en %) de l'équipement porté ; vides sous le No Equipment Challenge. */
export function gearSpecialsV1(state) {
  if (state.challenge?.active === "noEquipment") return {};
  return idleAdventureEquipmentStatsV47(state.adventure).specials || {};
}

export const gearPctV1 = (specials, key) => 1 + Math.max(0, num(specials?.[key], 0)) / 100;

/*
 * My Yellow Heart (idle-hearts-v1.js) : facteur AP de toutes les sources sauf les kills de l'ITOPOD
 * (page Arbitrary Points : "from all sources, except for ITOPOD kills and Special Prize").
 */
function heartApMultiplierV1(state) {
  return idleHeartsApMultiplierV1(state, gearSpecialsV1(state));
}

/*
 * Bonus AP commun (2026-09-24). Page Arbitrary Points : "Arbitrary points gained
 * from all sources, except for ITOPOD kills and Special Prize, can be increased
 * by: Completing achievements ; My Yellow Heart item/set bonus ; Fibonacci Perk
 * level 89 (2%)" -- "Maximal bonus is 193.698% (158.25% * 120% * 102%) and the
 * final AP value is rounded down". Page Yggdrasil (Fruit of Arbitrariness) :
 * "(1 + BP/10000) x (1 + YellowHeartAPBonus) x Perk_Fibo89". Avant ce correctif,
 * les succès n'étaient appliqués nulle part et chaque source appliquait un
 * sous-ensemble différent (défis/Money Pit/Daily Spin/fruit sans Fibonacci,
 * Money Pit sans aucun bonus, ITOPOD avec Fibonacci alors qu'il est exclu).
 */
export function apBonusMultiplierV1(state) {
  return idleAchievementsApMultiplierV1(state) *
    heartApMultiplierV1(state) *
    perkBonusesV1(idlePerkNiveauxV1(state)).apEarningsMultiplier;
}

/* AP versée = arrondi inférieur de base x bonus ; la marge 1e-9 absorbe l'erreur binaire (50 000 x 1,023 = 51 150, pas 51 149). */
export function apWithBonusV1(state, base) {
  return Math.max(0, Math.floor(Math.max(0, num(base, 0)) * apBonusMultiplierV1(state) + 1e-9));
}

export function nguSpeedMultiplierV1(state, resource) {
  const gear = state.challenge?.active === "noEquipment" ? null : idleAdventureEquipmentStatsV47(state.adventure);
  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirks = quirkBonusesV1(idleQuirkNiveauxV1(state));
  const fx = nguFxV1(state);
  const diggers = diggerBonuses(state);
  return Math.max(0,
    challengePermanentBonuses(state).nguSpeedMultiplier *
    (resource === "magic" ? challengePermanentBonuses(state).nguSpeedMagicChallengeMultiplier : challengePermanentBonuses(state).nguSpeedEnergyChallengeMultiplier) *
    (1 + 0.02 * (resource === "magic" ? wishLevelV1(state, 113) + wishLevelV1(state, 114) : wishLevelV1(state, 111) + wishLevelV1(state, 112))) *
    beardBonusMultiplier(state, "ngu") *
    idleCardsMultiplierV1(state, resource === "magic" ? "magicNgu" : "energyNgu") * /* Cards E-NGU / M-NGU */
    (1 + Math.max(0, num(state.adventure?.setRewards?.nguSpeedPct, 0))) *
    (1 + num(gear?.specials?.nguSpeedPct, 0) / 100) *
    /* Energy/Magic NGU MacGuffin Fragment (idle-macguffins-v1.js). */
    macguffinEffectMultiplierV1(state, resource === "magic" ? "magicNgu" : "energyNgu") *
    (resource === "magic"
      ? diggers.magicNgu * perks.nguSpeedMagicMultiplier * quirks.nguSpeedMagicMultiplier * fx.magicNguSpeed * hackFxV1(state).magicNguSpeed
      : diggers.energyNgu * perks.nguSpeedEnergyMultiplier * quirks.nguSpeedEnergyMultiplier * fx.energyNguSpeed * hackFxV1(state).energyNguSpeed)
  );
}

/* Ajoute des niveaux à un NGU et propage les quirks "Beast NGU" (14 : Evil -> Normal, 89 : Sadistic -> Evil). */
function grantNguLevelsV1(state, tier, id, gained) {
  const data = state.systems.ngu.data;
  const n = data.ngus[tier][id];
  n.level = Math.min(IDLE_NGU_MAX_LEVEL_V1, n.level + Math.max(0, gained));
  const quirkLevels = idleQuirkNiveauxV1(state);
  if (tier === "sadistic" && num(quirkLevels[89], 0) > 0) grantNguLevelsV1(state, "evil", id, gained);
  else if (tier === "evil" && num(quirkLevels[14], 0) > 0) grantNguLevelsV1(state, "normal", id, gained);
}

/*
 * Champ « Target » de chaque NGU et case « Advance Energy » (Norman, 2026-10-08, capture de l'écran NGU de NGU Idle : « on peut faire Advance Energy, on peut mettre une Target »). Même règle que l'Entraînement
 * avancé, déjà validée par Norman : le Target est le niveau à atteindre (0 = aucun) ; quand un NGU l'atteint, son énergie (ou sa magie) est rendue ; avec « Advance Energy » elle passe plutôt au NGU suivant de
 * la liste (dans l'ordre de l'écran, même ressource) qui n'a pas atteint son propre Target. Le wiki ne décrit pas ces deux champs : aucune valeur n'est inventée, seulement une règle de report.
 */
function nguCibleAtteinteV1(n) {
  const cible = Math.max(0, Math.floor(num(n?.target, 0)));
  return cible > 0 && Math.floor(num(n.level, 0)) >= cible;
}

export function applyNguTargetsV1(state) {
  const s = state.systems.ngu;
  if (!s?.unlocked || !s.data?.ngus) return;
  const ngus = s.data.ngus[s.data.tier];
  if (!ngus) return;
  const magieOk = Boolean(state.systems.bloodMagic?.unlocked);
  for (const resource of ["energy", "magic"]) {
    if (resource === "magic" && !magieOk) continue;
    const defs = IDLE_NGU_CATALOG_V1.filter(d => d.resource === resource);
    defs.forEach((def, index) => {
      const n = ngus[def.id];
      const alloue = Math.max(0, num(n.allocation, 0));
      if (!nguCibleAtteinteV1(n) || alloue <= 0) return;
      const suivant = s.data.advance?.[resource]
        ? defs.slice(index + 1).find(d => !nguCibleAtteinteV1(ngus[d.id]) && ngus[d.id].level < IDLE_NGU_MAX_LEVEL_V1)
        : null;
      if (suivant) {
        ngus[suivant.id].allocation = Math.max(0, num(ngus[suivant.id].allocation, 0)) + alloue;
        n.allocation = 0;
      } else {
        setNguAllocationV1(state, def.id, 0, {});
      }
    });
  }
  syncNguAllocationTotalsV1(s);
}

export function setNguTargetV1(state, nguId, value) {
  const s = state.systems.ngu;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const def = IDLE_NGU_CATALOG_V1.find(x => x.id === nguId);
  if (!def) throw new Error("NGU_INVALIDE");
  if (def.resource === "magic" && !state.systems.bloodMagic?.unlocked) throw new Error("MAGIC_VERROUILLEE");
  const cible = clamp(Math.floor(num(value, 0)), 0, IDLE_NGU_MAX_LEVEL_V1);
  s.data.ngus[s.data.tier][nguId].target = cible;
  applyNguTargetsV1(state);
  return { ngu: nguId, target: cible };
}

export function setNguAdvanceV1(state, resource, enabled) {
  const s = state.systems.ngu;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (resource !== "energy" && resource !== "magic") throw new Error("RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic?.unlocked) throw new Error("MAGIC_VERROUILLEE");
  s.data.advance = { ...(s.data.advance || { energy: false, magic: false }), [resource]: Boolean(enabled) };
  applyNguTargetsV1(state);
  return { resource, advance: Boolean(enabled) };
}

export function advanceNgusV1(state, seconds) {
  const s = state.systems.ngu;
  if (!s?.unlocked || seconds <= 0) return;
  const tier = s.data.tier;
  if (!nguActiveTiersV1(state.difficulty).includes(tier)) return;
  const speeds = {
    energy: nguSpeedMultiplierV1(state, "energy"),
    magic: nguSpeedMultiplierV1(state, "magic")
  };
  for (const def of IDLE_NGU_CATALOG_V1) {
    const n = s.data.ngus[tier][def.id];
    const alloc = Math.max(0, num(n.allocation, 0));
    if (alloc <= 0 || n.level >= IDLE_NGU_MAX_LEVEL_V1) continue;
    if (def.resource === "magic" && !state.systems.bloodMagic?.unlocked) continue;
    const power = Math.max(1, idleNguEffectiveResourceStatV1(state, def.resource, "power"));
    const base = nguParamsV1(tier, def.id).baseCost;
    const work = n.work + (alloc * power * speeds[def.resource] * seconds) / base;
    let { gained, work: rest } = nguLevelsFromWorkV1(n.level, work);
    /*
     * Page NGU : « at max speed, meaning they gain 50 levels/s » ; page Energy : « the most a progress bar can gain is
     * exactly 1 filling per tick, since there are 50 ticks per second, or 50 fills (or levels) per second ». Seconde
     * passe 2026-09-24 : le plafond existait pour les barbes et Wandoos, pas pour les NGU. Le travail en trop est perdu.
     */
    const maxGain = Math.max(1, Math.ceil(50 * seconds));
    if (gained > maxGain) { gained = maxGain; rest = 0; }
    n.work = rest;
    if (gained > 0) grantNguLevelsV1(state, tier, def.id, gained);
  }
  syncNguAllocationTotalsV1(s);
  applyNguTargetsV1(state);
}

export function setNguAllocationV1(state, nguId, value, context = {}, tierArg) {
  const s = state.systems.ngu;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const def = IDLE_NGU_CATALOG_V1.find(x => x.id === nguId);
  if (!def) throw new Error("NGU_INVALIDE");
  const tier = tierArg || s.data.tier;
  if (!nguActiveTiersV1(state.difficulty).includes(tier)) throw new Error("PALIER_NGU_VERROUILLE");
  if (tier !== s.data.tier) throw new Error("PALIER_NGU_INACTIF");
  const resource = def.resource;
  if (resource === "magic" && !state.systems.bloodMagic?.unlocked) throw new Error("MAGIC_VERROUILLEE");
  const r = state.resources[resource];
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const n = s.data.ngus[tier][nguId];
  const previous = Math.max(0, num(n.allocation, 0));
  const ownAllocated = nguAllocationSumV1(s.data, resource);
  const otherSystems = totalAllocated(state, resource, "ngu") + externalResourceAllocation(context, resource);
  const maxByCapacity = Math.max(0, cap - otherSystems - (ownAllocated - previous));
  const maxByOwned = Math.max(0, previous + num(r.current, 0));
  const target = clamp(value, 0, Math.min(maxByCapacity, maxByOwned));
  r.current = clamp(num(r.current, 0) - (target - previous), 0, cap);
  n.allocation = target;
  syncNguAllocationTotalsV1(s);
  return { ngu: nguId, tier, allocation: target };
}

/* Change de palier : l'énergie/magie allouée aux NGU du palier quitté est rendue. */
export function setNguTierV1(state, tier) {
  const s = state.systems.ngu;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!IDLE_NGU_TIERS_V1.includes(tier)) throw new Error("PALIER_NGU_INVALIDE");
  if (!nguActiveTiersV1(state.difficulty).includes(tier)) throw new Error("PALIER_NGU_VERROUILLE");
  if (s.data.tier === tier) return { tier };
  for (const resource of ["energy", "magic"]) {
    let released = 0;
    for (const def of IDLE_NGU_CATALOG_V1) {
      if (def.resource !== resource) continue;
      const n = s.data.ngus[s.data.tier][def.id];
      released += Math.max(0, num(n.allocation, 0));
      n.allocation = 0;
    }
    if (released > 0) state.resources[resource].current = num(state.resources[resource].current, 0) + released;
  }
  s.data.tier = tier;
  syncNguAllocationTotalsV1(s);
  return { tier };
}

/*
 * Niveaux d'Advanced Training effectifs : nuls tant que le menu AT est verrouillé (2026-09-24,
 * page Banks : "banked Advanced Training levels do not have any effect until the AT menu is
 * unlocked by completing Basic Training" ; page Rebirths : accès perdu au Rebirth).
 */
export function atLevelV1(state, trackId) {
  return state.systems.advancedTraining?.unlocked ? totalTrackLevel(state.systems.advancedTraining, trackId) : 0;
}

function beardSoftLevel(level, exponent, scalar) {
  const l = Math.max(0, num(level, 0));
  return l <= 1000 ? l : Math.pow(l, exponent) * scalar;
}

export function beardBonusMultiplier(state, role) {
  const s = state.systems.beards;
  if (!s?.unlocked) return 1;
  /* Gros troll « I just broke your Beards » : aucun bonus de barbe jusqu'au Rebirth. */
  if (trollFlagsV1(state).beards) return 1;
  const def = (IDLE_NGU_TRACKS.beards || []).find(x => x.beardRole === role);
  if (!def || !beardTrackUnlocked(state, def)) return 1;
  const t = s.data?.tracks?.[def.id] || {};
  const tempActive = beardActiveIdsV1(state).includes(def.id);
  const temp = tempActive ? Math.max(0, num(t.tempLevel, 0)) : 0;
  const perm = Math.max(0, num(t.permanentLevel, 0));
  let tb = 0, pb = 0;
  if (role === "attackDefense") {
    tb = temp * 0.05; pb = perm * 0.01;
  } else if (role === "drop") {
    tb = beardSoftLevel(temp, .3, 125.9) * .0005;
    pb = beardSoftLevel(perm, .33, 102.4) * .0005;
  } else if (role === "number") {
    tb = beardSoftLevel(temp, .5, 31.7) * .01;
    pb = beardSoftLevel(perm, .5, 31.7) * .001;
  } else if (role === "ngu") {
    tb = beardSoftLevel(temp, .3, 125.9) * .0001;
    pb = beardSoftLevel(perm, .3, 125.9) * .0002;
  } else if (role === "wandoos") {
    tb = beardSoftLevel(temp, .5, 31.7) * .001;
    pb = beardSoftLevel(perm, .5, 31.7) * .002;
  } else if (role === "adventure") {
    tb = beardSoftLevel(temp, .3, 125.9) * .001;
    pb = beardSoftLevel(perm, .5, 31.7) * .0005;
  } else if (role === "gold") {
    tb = beardSoftLevel(temp, .5, 31.7) * .002;
    pb = beardSoftLevel(perm, .5, 31.7) * .005;
  }
  return Math.max(1, (1 + tb) * (1 + pb));
}

/*
 * Page Beards of Power : facteur de temps = +1/3 par heure entière jusqu'à 8 (24 h) ; chaque niveau du
 * perk « Five O'Clock Shadow » atteint le maximum 1 h plus tôt (minimum 12 h) -> pente 8 / (24 - niveau).
 */
function beardRebirthTimeFactor(seconds, shadowLevel = 0) {
  const wholeHours = Math.floor(Math.max(0, num(seconds, 0)) / 3600);
  const hoursToMax = 24 - clamp(int(shadowLevel, 0), 0, 12);
  return clamp(wholeHours * (8 / hoursToMax), 0, 8);
}

export function convertActiveBeardOnRebirth(state, runSeconds) {
  const s = state.systems.beards;
  if (!s?.unlocked || !s.data?.tracks) return { track: "", gained: 0, timeFactor: 0 };
  const ids = beardActiveIdsV1(state);
  const id = ids[0] || "";
  const timeFactor = beardRebirthTimeFactor(runSeconds, perkBonusesV1(idlePerkNiveauxV1(state)).beardTrimSpeedLevel);
  let gained = 0;
  for (const activeId of ids) {
    const t = s.data.tracks[activeId];
    const temp = Math.max(0, num(t.tempLevel, 0));
    const part = Math.min(temp, Math.floor(Math.sqrt(temp) * timeFactor));
    t.permanentLevel = Math.max(0, num(t.permanentLevel, 0)) + part;
    gained += part;
  }
  for (const track of Object.values(s.data.tracks)) {
    track.tempLevel = 0;
    track.progress = 0;
  }
  s.tempLevel = 0;
  s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + Math.max(0, num(x.permanentLevel, 0)), 0);
  return { track: id, gained, timeFactor };
}

/*
 * MacGuffin Fragments (2026-09-23) : les facteurs permanents (Stat,
 * Adventure, Drop Chance, Energy/Magic/R3 Power/Cap/Bars) sont appliqués
 * sur l'objet calculé ci-dessous (produits commutatifs), voir
 * macguffinApplyToBonusesV1 dans idle-macguffins-v1.js.
 */
/*
 * Perf (Norman, 2026-10-02 : « le serveur met 1 à 4 s à répondre à une synchro »). Profil CPU : une synchro appelait ce calcul ~207 fois, presque toujours
 * pour lire UN seul chiffre (plafond, puissance, vitesse d'une ressource, voir idleNguEffectiveResourceStatUncappedV1), et chaque appel recalculait TOUS les
 * bonus -- dont les statistiques d'équipement, qui re-normalisent le sac d'Aventure entier (coût proportionnel au nombre d'objets : ~3 s avec 450 objets).
 *
 * Mémo EXACT : les bonus sont une fonction pure du contenu de l'état ; la clé est donc le contenu complet de l'état (JSON). Un état identique (même contenu)
 * renvoie le résultat déjà calculé ; le moindre octet de différence (un niveau gagné, un objet ramassé, une allocation) change la clé et force le recalcul.
 * Garde-fous : le mémo est vidé au début de chaque opération du moteur (idleNguMemoNouvelleRequeteV1) et un résultat n'est jamais réutilisé plus de BONUS_MEMO_MS_V1 (filet hors moteur), et chaque lecture renvoie
 * une COPIE (les appelants modifient parfois l'objet reçu). SOREAL_IDLE_VERIF_BONUS=1 recalcule à chaque réutilisation et échoue si les deux diffèrent
 * (utilisé pour vérifier toute la suite de tests, voir idle-bonus-memo-v1.test.mjs).
 */
const BONUS_MEMO_MS_V1 = 5000;

const __bonusMemoV1 = { cle: "", valeur: null, at: 0 };

/* Durée de vie du mémo = UNE opération du moteur : remis à zéro au début de chaque opération (voir runSorealIdleOperation). Le délai ci-dessus n'est qu'un filet pour les appels hors moteur. */
export function idleNguMemoNouvelleRequeteV1() {
  __bonusMemoV1.valeur = null;
  idleAdventureMemoNouvelleRequeteV1();
}

/*
 * Anti-spoil (règle n°2, audit du 2026-10-10, IDLE-AUDIT-GP-002) : la liste des Augments envoyée au client ne contient que les paires débloquées (boss du run en cours, comme le déblocage réel et comme le client) et, pour le repère
 * « ??? » du suivant, un marqueur opaque sans nom ni seuil. Avant, un joueur neuf recevait les 7 paires avec leur « boss N » de déblocage. IDLE_NGU_AUGMENTATIONS est trié par seuil croissant.
 */
/*
 * Anti-spoil (règle n°2, audit du 2026-10-10, IDLE-AUDIT-GP-003) : un système encore verrouillé est envoyé SANS ses valeurs internes (plafonds, durées, niveaux maximums). La structure est conservée (le client lit « state.data… »
 * sans garde à plusieurs endroits) mais tous les nombres valent 0, les textes sont vides et les booléens faux : plus aucune donnée de jeu ne fuit.
 */
export function idleNguViderValeursV1(valeur) {
  if (Array.isArray(valeur)) return [];
  if (valeur && typeof valeur === "object") {
    const sortie = {};
    for (const [cle, v] of Object.entries(valeur)) sortie[cle] = idleNguViderValeursV1(v);
    return sortie;
  }
  if (typeof valeur === "number") return 0;
  if (typeof valeur === "string") return "";
  if (typeof valeur === "boolean") return false;
  return null;
}

export function idleNguAugmentationsVisiblesV1(context) {
  const bossRun = num(context && context.bosses, 0);
  const premier = IDLE_NGU_AUGMENTATIONS.findIndex(def => bossRun < num(def.unlockBoss, 0));
  if (premier < 0) return IDLE_NGU_AUGMENTATIONS;
  return IDLE_NGU_AUGMENTATIONS.slice(0, premier).concat([{ id: "verrouille", verrouille: true, unlockBoss: 999999 }]);
}

/*
 * Projection sans mémo (trajectoire des multiplicateurs de combat) : l'état projeté change à chaque pas, le mémo (clé = tout l'état sérialisé, plus une copie profonde) ne peut donc jamais
 * resservir et coûtait plus cher que le calcul qu'il évite. Le résultat est identique, seul le cache est ignoré (et jamais alimenté : il reste celui de la vraie requête).
 */
export function avecProjectionSansMemoV1(fn) {
  const avant = __nguCtx.__sansMemoV1;
  __nguCtx.__sansMemoV1 = true;
  try { return fn(); } finally { __nguCtx.__sansMemoV1 = avant; }
}

export function avecPorteeBonusV1(state, fn) {
  if (__nguCtx.__porteeBonusV1) return fn();
  const verif = typeof process !== "undefined" && process.env && process.env.SOREAL_IDLE_VERIF_BONUS === "1";
  const cleDebut = verif ? JSON.stringify(state) : null;
  __nguCtx.__porteeBonusV1 = { state, valeur: null };
  try {
    return fn();
  } finally {
    __nguCtx.__porteeBonusV1 = null;
    if (verif && JSON.stringify(state) !== cleDebut) throw new Error("SOREAL_IDLE_BONUS_PORTEE_ETAT_MODIFIE");
  }
}

export function idleNguBonuses(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION
    ? raw
    : normalizeIdleNguState(raw, {}, raw?.updatedAt || Date.now());
  if (__nguCtx.__porteeBonusV1 && __nguCtx.__porteeBonusV1.state === state) {
    if (__nguCtx.__porteeBonusV1.valeur === null) __nguCtx.__porteeBonusV1.valeur = idleNguBonusesMemoV1(state);
    return structuredClone(__nguCtx.__porteeBonusV1.valeur);
  }
  return idleNguBonusesMemoV1(state);
}

/*
 * Lecture d'UN champ des bonus (audit 2026-10-13) : même valeur que la lecture d’un champ de idleNguBonuses(state), sans copie profonde quand la portée de bonus est active
 * (avant : ~68 structuredClone de l'objet de bonus par synchro, un par champ lu). L'objet de la portée n'est jamais modifié (la vérification
 * SOREAL_IDLE_VERIF_BONUS=1 compare l'état avant/après), et l'appelant ne lit qu'un champ aussitôt : aucune mutation possible. Hors portée : chemin habituel.
 */
export function idleNguBonusesLectureV1(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : null;
  if (state && __nguCtx.__porteeBonusV1 && __nguCtx.__porteeBonusV1.state === state) {
    if (__nguCtx.__porteeBonusV1.valeur === null) __nguCtx.__porteeBonusV1.valeur = idleNguBonusesMemoV1(state);
    return __nguCtx.__porteeBonusV1.valeur;
  }
  return idleNguBonuses(raw);
}

function idleNguBonusesMemoV1(state) {
  if (__nguCtx.__sansMemoV1) return macguffinApplyToBonusesV1(idleNguBonusesSansMacguffinV1(state), state);
  let cle = null;
  try { cle = JSON.stringify(state); } catch (_e) { cle = null; }
  const maintenant = Date.now();
  if (cle !== null && __bonusMemoV1.valeur !== null && __bonusMemoV1.cle === cle && maintenant - __bonusMemoV1.at <= BONUS_MEMO_MS_V1) {
    const copie = structuredClone(__bonusMemoV1.valeur);
    if (typeof process !== "undefined" && process.env && process.env.SOREAL_IDLE_VERIF_BONUS === "1") {
      const frais = macguffinApplyToBonusesV1(idleNguBonusesSansMacguffinV1(state), state);
      if (JSON.stringify(frais) !== JSON.stringify(copie)) throw new Error("SOREAL_IDLE_BONUS_MEMO_DIVERGENT");
    }
    return copie;
  }
  const valeur = macguffinApplyToBonusesV1(idleNguBonusesSansMacguffinV1(state), state);
  if (cle !== null) {
    try {
      __bonusMemoV1.valeur = structuredClone(valeur);
      __bonusMemoV1.cle = cle;
      __bonusMemoV1.at = maintenant;
    } catch (_e) {
      __bonusMemoV1.valeur = null;
    }
  }
  return valeur;
}

function idleNguBonusesSansMacguffinV1(state) {
  const aug = idleNguAugmentationMultiplier(state);
  const atPower = atLevelV1(state, "power");
  const atToughness = atLevelV1(state, "toughness");
  const atBlock = atLevelV1(state, "block");
  const ironPillPoints = Math.max(0, num(state.systems.bloodMagic?.data?.spells?.ironPill, 0));
  const nguFx = nguFxV1(state);
  const hackFx = hackFxV1(state);
  const equipmentDisabled = state.challenge.active === "noEquipment";
  const adventureGear = equipmentDisabled
    ? {power:0,toughness:0,hp:0,regen:0,specials:{}}
    : idleAdventureEquipmentStatsV47(state.adventure);
  const adventurePermanent = state.adventure?.permanent || {};
  const diggers = diggerBonuses(state);
  const ygg = state.systems.yggdrasil?.data || createYggdrasilData();
  const yggPermanent = ygg.permanent || createYggdrasilData().permanent;
  const powerAlphaMultiplier = 1 + Math.pow(Math.max(0,num(ygg.runPowerAlphaValue,0)),1.5);
  const powerBetaMultiplier = ygg.runPowerBetaActive
    ? 1 + Math.pow(Math.max(0,num(yggPermanent.powerBetaValue,0)),2)*5e-4
    : 1;

  const beardAttack = beardBonusMultiplier(state, "attackDefense");
  const beardNumber = beardBonusMultiplier(state, "number");
  const beardAdventure = beardBonusMultiplier(state, "adventure");
  /* Evil Bonus Accs (Set) (2026-09-24, wiki : "+20% Adventure stats!") : setRewards.adventureStatsPct, un facteur de plus comme perks / quirks / souhaits. */
  const evilAccsAdventureStats = 1 + Math.max(0, num(state.adventure?.setRewards?.adventureStatsPct, 0));
  const beardDrop = beardBonusMultiplier(state, "drop");
  const beardNgu = beardBonusMultiplier(state, "ngu");
  const beardWandoos = beardBonusMultiplier(state, "wandoos");
  const beardGold = beardBonusMultiplier(state, "gold");
  const challengeBonuses=challengePermanentBonuses(state);
  const perkBonuses=perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses=quirkBonusesV1(idleQuirkNiveauxV1(state));
  const wishBonuses=wishBonusesV1(idleWishTracksActifsV1(state));
  /*
   * 2026-09-24 (audit de composition, page « NUMBER ») : « The NUMBER for the
   * next rebirth will be the product of the following factors » -- les bonus
   * NGU Number, Beard NUMBER (Reverse Hitler), Yggdrasil (Fruit of Numbers),
   * MacGuffin et Number Hack sont des FACTEURS DU PROCHAIN NUMBER, calculés
   * dans refreshRebirthState. Ils étaient en plus multipliés ici au NUMBER
   * courant (Beard et NGU comptés deux fois, Fruit et Hack appliqués au
   * mauvais endroit). L'Attaque/Défense ne lit que le NUMBER courant.
   */
  const number = Math.max(1e-300, state.rebirth.number);
  /*
   * Wiki NGU (page "Advanced Training", section Formulas) : "The Bonus%
   * for Adventure Power/Toughness is: Level^0.4 * 10" (vérifié cellule par
   * cellule contre la table du wiki, ex. niveau 10 -> 25.12%, niveau 100 ->
   * 63.10%, niveau 1000 -> 158.49%). L'ancienne formule (1 + sqrt(L)*0.005,
   * soit +50% à L=10000) sous-évaluait massivement le bonus réel (+398% à
   * L=10000) et n'avait aucune source wiki.
   */
  const atPowerBonus = 1 + Math.pow(Math.max(0, atPower), 0.4) * 0.1;
  const atToughnessBonus = 1 + Math.pow(Math.max(0, atToughness), 0.4) * 0.1;
  const attackMultiplier =
    number *
    beardAttack *
    aug *
    powerAlphaMultiplier *
    powerBetaMultiplier *
    /* Fruit of Power δ : Attack/Defense permanent, toujours actif (idle-yggdrasil-extra-v1.js). */
    idleYggPowerDeltaMultiplierV1(ygg) *
    diggers.stats *
    perkBonuses.statMultiplier *
    quirkBonuses.statMultiplier *
    wishBonuses.statMultiplier *
    nguFx.attackDefense *
    hackFx.attackDefense *
    /*
     * Wandoos (2026-09-18) : wiki page "Wandoos" — l'OS actif multiplie
     * Attack ET Defense ensemble à partir des niveaux de Dump Energy/
     * Magic (formule propre à chaque OS, cf. IDLE_WANDOOS_OS_V1),
     * jamais lu par le combat jusqu'ici (système entièrement mort).
     */
    wandoosCombatMultiplierV1(state);
  /*
   * "Attack Boost for Rich Jerks" (2026-09-18, Norman : "il faut tout
   * faire") -- wiki NGU local, page "Experience", section "Spend
   * Experience" > "Misc", tableau "Attack Boosts For Rich Jerks" : +10%
   * Attack OU Defense par niveau, achetés et trackés SÉPARÉMENT (contraire
   * à "Stat Boost for Rich Perks" ci-dessus, qui boost les deux ensemble)
   * -- voir richJerksAction et state.bonuses.richJerksAttackLevel/
   * richJerksDefenseLevel. Appliqué ici SEULEMENT sur le multiplicateur
   * final exporté de chaque stat, jamais dans attackMultiplier lui-même
   * (qui alimente aussi defenseMultiplier ci-dessous) -- sinon un achat
   * "Attack" boosterait aussi Defense à tort.
   */
  const richJerksAttackMultiplier = 1 + idleNguRichJerksAttackPctV1(state) / 100;
  const richJerksDefenseMultiplier = 1 + Math.max(0, num(state.bonuses?.richJerksDefenseLevel, 0)) * RICH_JERKS_PCT_PER_LEVEL_V1 / 100;

  /*
   * "Equipment Modifier" du panneau Attack/Defense Breakdown (Norman,
   * 2026-09-18, deux captures d'écran du vrai NGU le même jour : la 1re,
   * personnage tout neuf sans gear, montrait "Equipment Modifier: x100%"
   * -- neutre faute d'équipement ; la 2e, panneau "EQUIPMENT BONUSES"
   * avec du gear équipé, montrait Power +1 -> "Player Stat Boosts:
   * Attack: 1%" et Toughness +1 -> "Defense: 1%", un ratio exact de 1
   * point = 1%). Wiki NGU (page Adventure Mode, déjà cité idle-sqlite-
   * runtime.js:9095-9097 lors d'un correctif antérieur qui avait retiré
   * le sens INVERSE, invalide) : "for every point of Power/Toughness
   * from your gear, you also get +1% Attack/Defense" -- jamais câblé
   * jusqu'ici, seulement documenté en commentaire. Même principe que
   * Rich Jerks ci-dessus : appliqué SEULEMENT sur le multiplicateur
   * final exporté (jamais dans attackMultiplier partagé), sinon Power
   * boosterait Defense à tort via la base commune de defenseMultiplier.
   * adventureGear.power/toughness sont déjà à 0 sous le No Equipment
   * Challenge (equipmentDisabled plus haut), donc neutre dans ce cas
   * sans garde supplémentaire.
   */
  const equipmentAttackMultiplier = 1 + Math.max(0, num(adventureGear.power, 0)) * 0.01;
  const equipmentDefenseMultiplier = 1 + Math.max(0, num(adventureGear.toughness, 0)) * 0.01;

  /*
   * Panneau « Détail de l'Attack / Defense » (Norman, 2026-09-26) : les facteurs multipliés ci-dessus, tels qu'appliqués, pour les afficher un par un
   * (les mêmes variables : aucun second calcul). Ce qui s'applique après (MacGuffins, Cards) est déduit côté serveur (« autres »).
   */
  const facteursCommunsStats = [
    { id: "number", label: "NUMBER", valeur: number },
    { id: "beard", label: "Beard", valeur: beardAttack },
    { id: "augmentations", label: "Augmentations", valeur: aug },
    { id: "powerAlpha", label: "Fruit of Power α", valeur: powerAlphaMultiplier },
    { id: "powerBeta", label: "Fruit of Power β", valeur: powerBetaMultiplier },
    { id: "powerDelta", label: "Fruit of Power δ", valeur: idleYggPowerDeltaMultiplierV1(ygg) },
    { id: "diggers", label: "Diggers", valeur: diggers.stats },
    { id: "perks", label: "Perks", valeur: perkBonuses.statMultiplier },
    { id: "quirks", label: "Quirks", valeur: quirkBonuses.statMultiplier },
    { id: "wishes", label: "Wishes", valeur: wishBonuses.statMultiplier },
    { id: "ngu", label: "NGU", valeur: nguFx.attackDefense },
    { id: "hacks", label: "Hacks", valeur: hackFx.attackDefense },
    { id: "wandoos", label: "Wandoos", valeur: wandoosCombatMultiplierV1(state) }
  ];
  const facteursStats = {
    attaque: [
      ...facteursCommunsStats,
      { id: "richJerks", label: "Attack Boost for Rich Jerks", valeur: richJerksAttackMultiplier },
      { id: "equipement", label: "Équipement porté", valeur: equipmentAttackMultiplier }
    ],
    defense: [
      ...facteursCommunsStats,
      { id: "richJerks", label: "Defense Boost for Rich Jerks", valeur: richJerksDefenseMultiplier },
      { id: "equipement", label: "Équipement porté", valeur: equipmentDefenseMultiplier }
    ],
    /* Points portés (boosts appliqués et Infinity Cube compris) : 1 point de Power = +1 % d'Attack, 1 point de Toughness = +1 % de Defense. */
    equipement: {
      power: num(adventureGear.power, 0),
      toughness: num(adventureGear.toughness, 0),
      cubePower: num(adventureGear.cubePowerContribution, 0),
      cubeToughness: num(adventureGear.cubeToughnessContribution, 0),
      desactive: equipmentDisabled
    }
  };

  /* Cards : bonus accumulés appliqués en un seul point sur le résultat (idleCardsApplyToBonusesV1). */
  return idleCardsApplyToBonusesV1(state, {
    facteursStats,
    attackMultiplier: attackMultiplier * richJerksAttackMultiplier * equipmentAttackMultiplier,
    /* Part « équipement d'Aventure » du produit ci-dessus (Adventure n'existe qu'à partir du boss 4 de chaque run : voir statsCombatPrincipalSorealIdleV413_). */
    equipmentAttackMultiplier,
    equipmentDefenseMultiplier,
    defenseMultiplier:
      attackMultiplier *
      richJerksDefenseMultiplier *
      equipmentDefenseMultiplier,
    adventureMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      evilAccsAdventureStats *
      beardAdventure *
      diggers.adventure *
      nguFx.adventure *
      hackFx.adventureStats,
    /*
     * 2026-09-23 (audit) : wiki Advanced Training -- « Bonus% for Adventure
     * Power/Toughness = Level^0.4 x 10 » : il s'applique à la Power et à la
     * Toughness D'AVENTURE (pas à l'Attack/Defense de Fight Boss). Le terme
     * (1 + sqrt(L) x 0,008) qui le remplaçait ici n'avait aucune source.
     */
    adventurePowerMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      evilAccsAdventureStats *
      beardAdventure *
      diggers.adventure *
      nguFx.adventure *
      hackFx.adventureStats *
      atPowerBonus,
    adventureToughnessMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      evilAccsAdventureStats *
      beardAdventure *
      diggers.adventure *
      nguFx.adventure *
      hackFx.adventureStats *
      atToughnessBonus,
    /* Block Damage Reduction (wiki Advanced Training) : (Level + 50) / (Level + 100) -- 50 % au niveau 0. */
    blockReduction: (Math.max(0, atBlock) + 50) / (Math.max(0, atBlock) + 100),
    /* Gains absolus hors équipement : Fruit of Adventure, perk Newbie (+100), Iron Pill (Blood^0.25 : Power/Toughness, HP x3, regen x0,03). */
    adventureBaseFlat: {
      power: num(yggPermanent.adventurePower, 0) + perkBonuses.adventurePowerFlat + ironPillPoints,
      toughness: num(yggPermanent.adventureToughness, 0) + perkBonuses.adventureToughnessFlat + ironPillPoints,
      hp: num(yggPermanent.adventureHp, 0) + ironPillPoints * 3,
      regen: num(yggPermanent.adventureRegen, 0) + ironPillPoints * 0.03
    },
    dropMultiplier:
      idleSelloutPotionFactorV1(state, "luck") *
      beardDrop *
      diggers.drop *
      perkBonuses.dropChanceMultiplier *
      nguFx.dropChance *
      hackFx.dropChance *
      (1 + num(adventureGear.specials?.dropChancePct, 0) / 100) *
      (1 + num(yggPermanent.luckDropPct,0)/100) *
      /*
       * Blood Spaghetti (wiki NGU, page Blood Magic) — bonus de Drop
       * Chance calculé dans castBloodSpell() mais jamais lu par ce
       * multiplicateur jusqu'ici (bug "effet calculé mais jamais
       * appliqué"), câblé ici pour la première fois.
       */
      Math.max(1, num(state.systems.bloodMagic?.data?.spells?.bloodSpaghetti, 1)),
    /* My Red Heart (page Yggdrasil, EXPBonus : "(1 + RedHeartEXPBonus)") : équipé ou set complété, idle-hearts-v1.js. */
    xpMultiplier: diggers.experience * nguFx.exp * hackFx.exp * perkBonuses.expEarningsMultiplier * (1 + num(state.bonuses.cookingExp, 0)) * (1 + 0.005 * wishLevelV1(state, 61)) * idleHeartsExpMultiplierV1(state, adventureGear.specials),
    respawnReduction: respawnReductionV1(state, nguFx, adventureGear, perkBonuses),
    adventurePowerFlat: num(adventureGear.power, 0)+num(yggPermanent.adventurePower,0)+perkBonuses.adventurePowerFlat,
    adventureToughnessFlat: num(adventureGear.toughness, 0)+num(yggPermanent.adventureToughness,0)+perkBonuses.adventureToughnessFlat,
    adventureHpFlat: num(adventureGear.hp, 0)+num(yggPermanent.adventureHp,0),
    adventureRegenFlat: num(adventureGear.regen, 0)+num(yggPermanent.adventureRegen,0),
    /*
     * PISTE 2 (2026-09-18, audit "Est-ce que tu as bien intégré chacune des
     * statistiques special etc ?") -- adventureGear.specials.<type>Pct
     * (idle-adventure-v47.js::idleAdventureSpecialsByTypeV1, alimenté par
     * SPECIALS.<item>.sType/sExtra, chaque magnitude sourcée wiki) rejoint
     * désormais chacun des multiplicateurs ci-dessous, au même niveau que
     * les contributions Perks/Quirks/Wishes déjà présentes -- même
     * convention non terminale que le reste de ce bloc (energyPowerMultiplier
     * and co. restent, comme avant ce correctif, calculés ici mais pas
     * encore lus par idleNguEffectiveResourceStatV1 pour le terme
     * multiplicatif -- seul le terme FLAT l'est ; gap préexistant documenté
     * plus haut "les multiplicateurs Perks/Quirks jamais appliqués", commun
     * à Perks/Quirks/Wishes/objets, pas propre à ce correctif ni aggravé
     * par lui).
     */
    adventureGoldMultiplier: perkBonuses.adventureGoldMultiplier * quirkBonuses.adventureGoldMultiplier * nguFx.gold * (1 + num(adventureGear.specials?.goldDropsPct, 0) / 100) * challengeBonuses.goldDropChallengeMultiplier,
    energySpeedFlat: num(adventurePermanent.energySpeedFlat, 0),
    energyPowerFlat: num(adventurePermanent.energyPowerFlat, 0)+perkBonuses.energyPowerFlat,
    energyBarsFlat: num(adventurePermanent.energyBarsFlat, 0)+perkBonuses.energyBarsFlat,
    energyPowerMultiplier: idleSelloutPotionFactorV1(state, "energyPower") * perkBonuses.energyPowerMultiplier * quirkBonuses.energyPowerMultiplier * wishBonuses.energyPowerMultiplier * (1 + num(adventureGear.specials?.energyPowerPct, 0) / 100),
    energyBarsMultiplier: idleSelloutPotionFactorV1(state, "energyBars") * perkBonuses.energyBarsMultiplier * quirkBonuses.energyBarsMultiplier * wishBonuses.energyBarsMultiplier * (1 + num(adventureGear.specials?.energyBarsPct, 0) / 100),
    energyCapMultiplier: perkBonuses.energyCapMultiplier * quirkBonuses.energyCapMultiplier * wishBonuses.energyCapMultiplier * (1 + num(adventureGear.specials?.energyCapPct, 0) / 100),
    /*
     * energySpeedMultiplier/magicSpeedMultiplier : pas d'équivalent Perks/
     * Quirks/Wishes existant à étendre (aucun des trois catalogues n'a de
     * clé "energySpeedMultiplier"/"magicSpeedMultiplier" -- à distinguer de
     * energyPowerMultiplier/energyBarsMultiplier/energyCapMultiplier
     * ci-dessus, et de "Wandoos Energy/Magic Speed" (quirkEnergyMultiplier/
     * quirkMagicMultiplier, advanceWandoosTrack ci-dessous -- un mécanisme
     * Wandoos différent, déjà câblé, jamais celui-ci). Nouvelle clé, même
     * schéma que r3Power/Cap/BarsMultiplier ci-dessous : "smallest sensible
     * consumer" pour un TYPE de bonus sans câblage préexistant.
     */
    energySpeedMultiplier: 1 + num(adventureGear.specials?.energySpeedPct, 0) / 100,
    magicSpeedMultiplier: 1 + num(adventureGear.specials?.magicSpeedPct, 0) / 100,
    magicPowerFlat: num(adventurePermanent.magicPowerFlat, 0)+perkBonuses.magicPowerFlat,
    magicBarsFlat: num(adventurePermanent.magicBarsFlat, 0)+perkBonuses.magicBarsFlat,
    magicCapFlat: num(adventurePermanent.magicCapFlat, 0)+perkBonuses.magicCapFlat,
    magicPowerMultiplier: idleSelloutPotionFactorV1(state, "magicPower") * perkBonuses.magicPowerMultiplier * quirkBonuses.magicPowerMultiplier * wishBonuses.magicPowerMultiplier * (1 + num(adventureGear.specials?.magicPowerPct, 0) / 100),
    magicBarsMultiplier: idleSelloutPotionFactorV1(state, "magicBars") * perkBonuses.magicBarsMultiplier * quirkBonuses.magicBarsMultiplier * wishBonuses.magicBarsMultiplier * (1 + num(adventureGear.specials?.magicBarsPct, 0) / 100),
    magicCapMultiplier: perkBonuses.magicCapMultiplier * quirkBonuses.magicCapMultiplier * wishBonuses.magicCapMultiplier * (1 + num(adventureGear.specials?.magicCapPct, 0) / 100),
    /*
     * r3Power/Cap/BarsMultiplier : nouvelles clés, sans équivalent Perks/
     * Quirks existant (aucune des deux catalogues Normal ne touche
     * Resource 3 — voir idle-perks-v1.js/idle-quirks-v1.js). Resource 3
     * est pourtant déjà une ressource de première classe ici (state.
     * resources.r3, allouée par les Hacks) ; ces clés suivent exactement
     * le même schéma que les six ci-dessus, alimentées pour l'instant
     * uniquement par les souhaits "Resource 3 Power/Cap/Bars".
     */
    /* Incriminating Evidence (set) : +2 base R3 Power / +80K base R3 Cap / +2 base R3 Bars (adventure.permanent). */
    r3PowerFlat: num(adventurePermanent.r3PowerFlat, 0),
    r3CapFlat: num(adventurePermanent.r3CapFlat, 0),
    r3BarsFlat: num(adventurePermanent.r3BarsFlat, 0),
    r3PowerMultiplier: idleSelloutPotionFactorV1(state, "r3Power") * wishBonuses.r3PowerMultiplier * quirkBonuses.r3PowerMultiplier * perkBonuses.r3PowerMultiplier * gearPctV1(adventureGear.specials, "r3PowerPct"),
    r3CapMultiplier: wishBonuses.r3CapMultiplier * quirkBonuses.r3CapMultiplier * perkBonuses.r3CapMultiplier * gearPctV1(adventureGear.specials, "r3CapPct"),
    r3BarsMultiplier: wishBonuses.r3BarsMultiplier * quirkBonuses.r3BarsMultiplier * perkBonuses.r3BarsMultiplier * gearPctV1(adventureGear.specials, "r3BarsPct"),
    boostPowerMultiplier: perkBonuses.boostPowerMultiplier * quirkBonuses.boostPowerMultiplier,
    inventorySlotsFromPerks: perkBonuses.inventorySlots,
    accessorySlotsFromPerks: perkBonuses.accessorySlotBonus,
    diggerSlotBonusFromPerks: perkBonuses.diggerSlotBonus,
    advancedTrainingStartBonusFromPerks: perkBonuses.advancedTrainingStartBonus,
    atBankMultiplierFromPerks: perkBonuses.atBankMultiplier,
    tmBankMultiplierFromPerks: perkBonuses.tmBankMultiplier,
    beardBankMultiplierFromPerks: perkBonuses.beardBankMultiplier,
    atBankMultiplierFromQuirks: quirkBonuses.atBankMultiplier,
    tmBankMultiplierFromQuirks: quirkBonuses.tmBankMultiplier,
    beardBankMultiplierFromQuirks: quirkBonuses.beardBankMultiplier,
    titanExpBonusKillsFromPerks: perkBonuses.titanExpBonusKills,
    bossExpMultiplierFromPerks: perkBonuses.bossExpMultiplier + challengeBonuses.bossExpPct,
    seedYieldMultiplierFromPerks: perkBonuses.seedYieldMultiplier,
    seedYieldMultiplierFromQuirks: quirkBonuses.seedYieldMultiplier,
    // PISTE 2 (2026-09-18) : "Seed Gain" (Candy Corn Necklace, wiki) -- même convention FromPerks/FromQuirks ci-dessus, aucun équivalent existant à étendre.
    seedYieldMultiplierFromItems: 1 + num(adventureGear.specials?.seedGainPct, 0) / 100,
    lootGoblinChanceFromPerks: perkBonuses.lootGoblinChance,
    cubeBoostRateFromPerks: perkBonuses.cubeBoostRate,
    daycareGrowthMultiplierFromPerks: perkBonuses.daycareGrowthMultiplier,
    firstHarvestMultiplierFromPerks: perkBonuses.firstHarvestMultiplier,
    wandoosOsLevelBonusFromPerks: perkBonuses.wandoosOsLevelBonus,
    doubleBasicTrainingFromPerks: perkBonuses.doubleBasicTraining,
    basicTrainingLevelsPerFill: levelsPerFillBasicTrainingV411({
      doubleBasicTraining: perkBonuses.doubleBasicTraining,
      quirkExtraLevels: quirkBonuses.basicTrainingExtraLevels,
      wishExtraLevels: wishBonuses.basicTrainingExtraLevels
    }),
    /* Wiki Experience > Misc « Training Auto Advance » (300 EXP) : effet dans advanceBasicTrainingStateV411. */
    basicTrainingAutoAdvance: expShopPurchasedV1(state, "trainingAutoAdvance") >= 1,
    basicTrainingSync: expShopPurchasedV1(state, "syncBasicTraining") >= 1,
    disableEquipment: equipmentDisabled,
    numberMultiplier: number,
    augmentationMultiplier: aug,
    timeMachineGoldPerSecond: idleNguTimeMachineGoldPerSecond(state),
    timeMachineGrossGoldPerSecond: idleNguTimeMachineGrossGoldPerSecond(state),
    diggerDrainGoldPerSecond: diggerDrainTotal(state),
    diggerGlobalBonus: diggerGlobalBonus(state),
    diggerSlots: availableDiggerSlots(state),
    /*
     * PISTE 2 (2026-09-18) : "NGU Speed" (Candy Corn Necklace / A Shrunken
     * Voodoo Doll, wiki) rejoint ce multiplicateur. Correctif 2026-09-18
     * (suite) : ce multiplicateur était resté affichage-seul -- advanceTrackSystem
     * (def.id === "ngu") n'appliquait que setRewards.nguSpeedPct (le pont
     * "set complet" existant), jamais ce multiplicateur-ci (beard/digger/
     * attack-NGU/objets). Câblé maintenant dans advanceTrackSystem, en plus
     * de nguSpeedSetMultiplier (les deux sont des sources distinctes,
     * multipliées ensemble comme le reste des chaînes de multiplicateurs de
     * ce fichier).
     */
    nguSpeedMultiplier: challengeBonuses.nguSpeedMultiplier * beardNgu * diggers.energyNgu * (1 + num(adventureGear.specials?.nguSpeedPct, 0) / 100),
    nguEffects: nguFx,
    nguSpeedEnergyMultiplierFromPerks: perkBonuses.nguSpeedEnergyMultiplier,
    nguSpeedMagicMultiplierFromPerks: perkBonuses.nguSpeedMagicMultiplier,
    /*
     * PISTE 2 (2026-09-18) : "Beard Speed" (Beard Comb/Red Lipstick/A
     * Shrunken Voodoo Doll, wiki). Correctif 2026-09-18 (suite) : câblé
     * maintenant dans advanceBeardTrack (baseRate) -- PAS dans
     * beardBonusMultiplier(), qui représente l'effet produit par le niveau
     * de Beard déjà acquis sur d'autres stats, jamais la vitesse à laquelle
     * la Beard active elle-même progresse. Voir le commentaire d'
     * advanceBeardTrack pour le détail.
     */
    beardSpeedMultiplierFromItems: 1 + num(adventureGear.specials?.beardSpeedPct, 0) / 100,
    wandoosSpeedMultiplier: beardWandoos * diggers.wandoos,
    beardGoldMultiplier: beardGold,
    beardNumberMultiplier: beardNumber,
    /* PPBonus (page Yggdrasil, Fruit of Rage) : sets « PP earnings » en facteurs séparés x NGU PP x Diggers x Perks x Hacks (cartes PP ajoutées par idleCardsApplyToBonusesV1). */
    ppMultiplier: idleAdventureSetRewardProductV1(state.adventure, "itopodPpPct") * nguFx.pp * hackFx.pp * perkBonuses.ppEarningsMultiplier * diggers.pp,
    /* Aucun vrai NGU n'accélère Questing ni le Daycare (pistes inventées retirées). */
    questSpeedMultiplier: 1,
    /* Item Daycare (idle-daycare-v1.js) : vitesse (équipement, Fibonacci, souhait, Blind Evil/Sadistic, Digger, Hack) et facteur de temps. */
    ...(() => { const fx = daycareFactorsV1(state); return { daycareSpeedMultiplier: fx.speedMultiplier, daycareTimeMultiplier: fx.timeFactor, daycareSlots: fx.slots }; })(),
    /*
     * hackSpeedMultiplier/wishSpeedMultiplier étaient déclarées ici à 1 en
     * dur depuis le début, sans aucune source réelle. Câblées avec les
     * souhaits "Hack Speed"/"Wish Speed" du catalogue réel (idle-wishes-
     * v1.js). Correctif 2026-09-18 (suite) : rejoint désormais aussi les
     * tiers 8-10 de l'Infinity Cube (hackSpeedPct/wishSpeedPct,
     * IDLE_ADVENTURE_CUBE_TIERS_V1, 11/11 tiers vérifiés wiki), même
     * principe que dropChancePct/goldDropsPct déjà câblés depuis le cube --
     * ET câblage réel dans advanceHackTrack (qui ne lisait aucun
     * multiplicateur de vitesse jusqu'ici) / advanceWishTrack (qui calcule
     * déjà sa propre vitesse directement via wishBonusesV1(), pour ne pas
     * dépendre de tout idleNguBonuses() dans sa propre boucle -- la même
     * contribution du cube y est donc dupliquée par petit calcul local
     * plutôt que lue depuis ce champ, cf. son propre commentaire).
     */
    hackSpeedMultiplier: wishBonuses.hackSpeedMultiplier * (1 + Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).hackSpeedPct, 0)) / 100) * gearPctV1(adventureGear.specials, "hackSpeedPct") * hackFx.hackHack * challengeBonuses.hackSpeedChallengeMultiplier * idleHeartsHackSpeedMultiplierV1(state) /* Grey Heart (set) : "25% Faster Hacks!" */,
    wishSpeedMultiplier: wishBonuses.wishSpeedMultiplier * (1 + Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).wishSpeedPct, 0)) / 100) * (1 + Math.max(0, num(state.adventure?.setRewards?.wishSpeedPct, 0))) * gearPctV1(adventureGear.specials, "wishSpeedPct") * hackFx.wish,
    challengeBonuses:clone(challengeBonuses),
    perkBonuses:clone(perkBonuses),
    quirkBonuses:clone(quirkBonuses),
    wishBonuses:clone(wishBonuses),
    inventorySlotsFromChallenges:challengeBonuses.inventorySlots,
    autoBoostUnlockedByChallenges:challengeBonuses.autoBoost,
    autoMergeTimeMultiplierFromChallenges:challengeBonuses.autoMergeTimeMultiplier,
    titanRespawnReductionMsFromChallenges:challengeBonuses.titanRespawnReductionMs,
    titanLootLevelBonusFromChallenges:challengeBonuses.titanLootLevelBonus,
    boostRecycleChanceFromChallenges:challengeBonuses.boostRecycleChance
  });
}

/*
 * Wiki Respawn : temps de base 4 s ; facteurs multiplicatifs (NGU Respawn, set Clock -5 %, perk
 * SPAWN FASTER DAMMIT, souhait « enemies spawned faster » -1 %/niveau) ; les objets « Build Respawn »
 * s'additionnent puis sont plafonnés (48 % Normal, 58 % Evil, 78 % Sadistic). Plancher : 0,34 s.
 */
function respawnReductionV1(state, nguFx, adventureGear, perkBonuses) {
  const cap = state.difficulty === "extreme" ? 78 : state.difficulty === "difficile" ? 58 : 48;
  const itemsPct = Math.min(cap, Math.max(0, num(adventureGear.specials?.respawnReductionPct, 0) - Math.max(0, num(state.adventure?.setRewards?.respawn, 0)) * 100));
  const clockSet = 1 - Math.max(0, Math.min(1, num(state.adventure?.setRewards?.respawn, 0)));
  const wishLevel = Math.max(0, Math.min(10, int(idleWishTracksActifsV1(state)["46"]?.level, 0)));
  const remaining = (1 - nguFx.respawnReduction) * clockSet * perkBonuses.respawnRemaining * (1 - wishLevel * 0.01) * (1 - itemsPct / 100);
  return clamp(1 - remaining, 0, 1 - 0.34 / 4);
}

export function unlockInfo(def, state, context) {
  return {
    unlocked: Boolean(state.systems[def.id].unlocked),
    bosses: num(def.unlock?.bosses, 0),
    rebirths: num(def.unlock?.rebirths, 0),
    sets: num(def.unlock?.sets, 0),
    item: def.unlock?.item || "",
    flag: def.unlock?.flag || "",
    basicTrainingComplete: Boolean(def.unlock?.basicTrainingComplete)
  };
}

/*
 * Correctif 2026-09-14 (Norman, deuxième signalement le même jour : "je
 * viens de lancer 1 nouvelle partie sur NGU tout en lancant une sur
 * SOREAL IDLE. Je suis déjà à 1,5M alors que dans NGU je ne suis qu'à
 * 350K. Il y a un souci au niveau des points de vie de départ, de la
 * manière dont la vie remonte... rien ne correspond.") — le correctif
 * précédent (même jour, voir historique git) citait une page wiki
 * "Fight Boss" avec "Max HP = Attack x 10"/"HP Regen = Defense / 20" :
 * cette page N'EXISTE PAS sur le wiki NGU (vérifié en direct au
 * navigateur, 404) — une valeur inventée, exactement ce que Norman
 * interdit explicitement. Cause réelle du décalage de vitesse signalé :
 * ce ratio inventé rendait le joueur bien plus résistant que le vrai
 * jeu, donc capable d'idle-farmer des zones largement au-dessus de son
 * niveau réel.
 *
 * Vraie source, vérifiée en direct au navigateur (2026-09-14) :
 * https://ngu-idle.fandom.com/wiki/Build_Max_HP et
 * https://ngu-idle.fandom.com/wiki/Build_HP_Regen — ces deux pages
 * listent les stats Power/Toughness/HP Max/HP regen de ~20 objets
 * d'Aventure réels (UUG's Big Book of Insults, THE DEATHSTICK, Choffice
 * Hat of Greed, etc.). Le ratio est EXACTEMENT le même sur chacun des 20
 * objets, sans une seule exception :
 *   HP Max = Power × 3
 *   HP Regen = Toughness × 0.03 (3%)
 * (ex. UUG's Big Book : Power 104 000 000 000 → HP Max 312 000 000 000
 * = ×3 exact ; Toughness 1 600 000 000 → HP regen 48 000 000 = ×0.03
 * exact — répété à l'identique sur Choffice Hat, Wooden Office Apron,
 * The Titan Effigy, Tie of Apathy, etc.)
 */
export function idleAdventureCombatStatsV1(gear, context, bonuses) {
  const g = gear && typeof gear === "object" ? gear : {};
  /*
   * Norman (répété plusieurs fois, dont 2026-09-16) : "La regen n'est
   * toujours pas à 1/s dès le début du mode aventure." Cause réelle :
   * le plancher de secours (aucune valeur adventurePower/Toughness
   * externe n'existe tant qu'aucun équipement d'Aventure n'est trouvé,
   * voir contexteMetaNguSorealIdle_) s'appliquait sur le TOUGHNESS
   * d'entrée (floor à 1) puis était multiplié par 0.03 — donnant un
   * plancher réel de 0.03/s, pas 1/s. HP suit le même schéma (floor
   * POWER à 1, ×3 → plancher réel 3, cohérent avec le ratio HP=Power×3
   * vérifié sur le wiki) — seul le REGEN doit avoir son propre plancher
   * de sortie à 1, appliqué APRÈS la multiplication, jamais avant.
   *
   * Norman (2026-09-18, capture d'écran "Adventure Stats Breakdown" du
   * vrai NGU en direct) : personnage tout neuf, sans aucun équipement
   * d'Aventure ("Equipment Modifier: +0") -- "Base Adventure Power: 10"
   * / "Base Adventure Toughness: 10" / "Total: 10". Le plancher de
   * secours ci-dessus utilisait 1, pas 10 -- sous-évaluant Power/
   * Toughness/HP/Regen de base d'un facteur 10 pour tout joueur sans
   * encore d'équipement d'Aventure.
   *
   * Norman (2026-09-18, en direct, répété depuis le 2026-09-14) : "Les
   * points de vie du mode aventure au début ne sont pas les mêmes dans
   * NGU et Soreal. C'est 50hp sans équipement." L'audit du même jour
   * (piste 3) avait retiré le "+10" plat au motif qu'AUCUNE page wiki ne
   * documente de PV joueur en combat d'Aventure -- ce qui reste exact,
   * MAIS c'est précisément pour cette raison que ce plancher n'est PAS
   * une donnée à sourcer sur le wiki : la barre de vie d'Aventure est un
   * système SOREAL, jamais une mécanique NGU réelle (Norman, 2026-09-09,
   * déjà documenté plus haut). Pour un système que SOREAL invente
   * lui-même, l'autorité n'est pas une page wiki (qui ne peut
   * structurellement pas exister) mais Norman lui-même, qui vient de
   * fixer explicitement cette magnitude -- pas une valeur "inventée" par
   * un correctif, mais une exigence de conception donnée directement.
   * Le "50" observé le 2026-09-14 venait déjà d'un écran SOREAL, pas du
   * wiki -- ce correctif ne prétend toujours pas que 50 est une valeur
   * NGU, seulement que c'est la valeur SOREAL demandée. Le ratio HP
   * Max=Power×3 RESTE sourcé et inchangé -- pour la contribution de
   * l'équipement (g.hp, wiki Build_Max_HP) ET pour tout scénario où
   * context.adventurePower est réellement fourni (aucun chemin réel ne le
   * fait aujourd'hui, mais idle-adventure-combat-stats-shared.test.mjs
   * l'exerce explicitement avec adventurePower=100 -> hp=300 attendu,
   * comportement à préserver). Seul le PLANCHER PAR DÉFAUT (aucun
   * adventurePower fourni du tout, le cas réel de tout joueur sans encore
   * de contexte externe) devient 50 plutôt que Power_base(10)×3=30.
   */
  const BASE_ADVENTURE_HP_V1 = 50;
  const hasExternalAdventurePower = Number.isFinite(Number(context.adventurePower));
  const baseAdventurePower = Math.max(10, num(context.adventurePower, 10));
  const baseAdventureToughness = Math.max(10, num(context.adventureToughness, context.adventurePower || 10));
  const baseAdventureRegen = Math.max(1, baseAdventureToughness * 0.03);
  const permanent = g.permanent && typeof g.permanent === "object" ? g.permanent : {};
  /*
   * 2026-09-23 (audit) : jusqu'ici AUCUN multiplicateur d'Adventure Stats
   * n'atteignait le combat (Challenges, Perks, Quirks, Wishes, NGU Adventure
   * alpha/beta, Diggers, Beard BEARd, Advanced Training, Newbie Adventure Perk,
   * Fruit of Adventure, Iron Pill : calculés par idleNguBonuses mais jamais
   * lus). Stats = (base + équipement + permanent + gains absolus) x
   * multiplicateur ; les PV suivent la Power (x3 wiki) et la regen la
   * Toughness (x0,03), donc leurs multiplicateurs.
   */
  const bo = bonuses && typeof bonuses === "object" ? bonuses : null;
  const flat = (bo && bo.adventureBaseFlat) || { power: 0, toughness: 0, hp: 0, regen: 0 };
  const multPower = Math.max(0, num(bo && bo.adventurePowerMultiplier, 1));
  const multToughness = Math.max(0, num(bo && bo.adventureToughnessMultiplier, 1));
  return Object.assign({}, g, {
    power:
      (baseAdventurePower +
        Math.max(0, num(g.power, 0)) +
        Math.max(0, num(permanent.adventurePower, 0)) +
        Math.max(0, num(flat.power, 0))) * multPower,
    toughness:
      (baseAdventureToughness +
        Math.max(0, num(g.toughness, 0)) +
        Math.max(0, num(permanent.adventureToughness, 0)) +
        Math.max(0, num(flat.toughness, 0))) * multToughness,
    hp:
      ((hasExternalAdventurePower ? baseAdventurePower * 3 : BASE_ADVENTURE_HP_V1) +
        Math.max(0, num(g.hp, 0)) +
        Math.max(0, num(permanent.adventureHp, 0)) +
        Math.max(0, num(flat.hp, 0))) * multPower,
    regenBase: baseAdventureRegen,
    regen:
      (baseAdventureRegen +
        Math.max(0, num(g.regen, 0)) +
        Math.max(0, num(permanent.adventureRegen, 0)) +
        Math.max(0, num(flat.regen, 0))) * multToughness,
    blockReduction: bo && Number.isFinite(Number(bo.blockReduction)) ? Number(bo.blockReduction) : 0.5
  });
}
