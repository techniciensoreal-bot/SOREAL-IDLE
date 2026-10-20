/*
 * NGU : Barbes, Hacks, Souhaits, Entraînement avancé et Machine temporelle (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleHeartsPinkCompleteV1 } from "./idle-hearts-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { idleQuirkNiveauxV1, idleWishAccessibleV1, idlePerkNiveauxV1 } from "./idle-difficulty-gates-v1.js";
import { idleAdventureCubeTierV1 } from "./idle-adventure-v47.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { wishBonusesV1 } from "./idle-wishes-v1.js";
import { idleCardsMultiplierV1 } from "./idle-cards-v1.js";
import { nguLevelsFromWorkV1 } from "./idle-ngu-catalog-v1.js";
import { idleWandoosXlUnlockedV1 } from "./idle-wandoos-os-v1.js";
import { IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_META_VERSION, IDLE_NGU_TRACKS, IDLE_WISH_MAX_SLOTS_V1, RESOURCE_KEYS, WISH_MIN_LEVEL_SECONDS, challengePermanentBonuses, clamp, clone, int, num } from "./idle-ngu-catalogues.js";
import { expShopPurchasedV1 } from "./idle-ngu-actions.js";
import { advanceTheEndFinalHackV1, idleNguDifficultySpeedDividerV1, normalizeIdleNguState, syncWishAllocationTotalsV1, wandoosCalculVitessesV1, wandoosCombatMultiplierV1 } from "./idle-ngu-etat.js";
import { externalResourceAllocation, fractionProgressionSecondesV1, idleNguEffectiveResourceStatV1, rebaserProgressionSecondesV1, setAllocation, totalAllocated } from "./idle-ngu-ressources.js";
import { bloodMigrerAllocationV1, bloodRitualMagicV1, diggerBonuses, diggerDrainTotal } from "./idle-ngu-systemes.js";
import { beardBonusMultiplier, gearPctV1, gearSpecialsV1, hackFxV1, idleNguBonusesLectureV1, nguFxV1 } from "./idle-ngu-bonus.js";
import { challengeHundredLevelsConsume, challengeHundredLevelsRemaining, wishLevelV1 } from "./idle-ngu-snapshot.js";

/*
 * Page Beards of Power : 7 slots -- 1 au déblocage, 1 Troll Normal (complétion 4), 1 boutique EXP (50 000 EXP),
 * 4 boutique Sellout. Plusieurs Beards actives ralentissent celles qui utilisent la même ressource :
 * diviseur = nombre de Beards actives sur cette ressource (x0,9 avec le set Beardverse, minimum 1).
 */
export function beardSlotsV1(state) {
  const troll = int(state.challenge?.completions?.troll, 0) >= 4 ? 1 : 0;
  const exp = expShopPurchasedV1(state, "beardSlot");
  const sellout = Math.max(0, Math.min(4, int(state.selloutShop?.purchases?.extraBeardSlot, 0)));
  return Math.min(7, 1 + troll + exp + sellout);
}

export function beardActiveIdsV1(state) {
  const s = state.systems.beards;
  if (!s || !s.active) return [];
  const data = s.data || {};
  const list = Array.isArray(data.activeTracks) ? data.activeTracks : (data.activeTrack ? [data.activeTrack] : []);
  const defs = IDLE_NGU_TRACKS.beards || [];
  return list.filter(id => {
    const def = defs.find(x => x.id === id);
    return def && beardTrackUnlocked(state, def) && data.tracks?.[id];
  }).slice(0, beardSlotsV1(state));
}

/*
 * Slots de souhaits (page "Wishes", 4 au total) : 1 de base ; 1 à la 7e
 * complétion du Troll Challenge en Evil (page Challenges, Troll Challenge :
 * "Completion 7 Reward(s) ... Unlock a Wish Slot!" ; page Wishes, tableau
 * Challenges : "Evil Troll Challenge 7 | Unlock a Wish Slot") ; 1 en
 * "maxant" My Pink Heart (fiche "Pink Heart (set)" : "Gain an additional
 * Wish slot!", bonus de complétion obtenu au niveau 100 -- completedSets,
 * idle-adventure-v47.js) ; 1 par la quirk 56 "A Wish Slot!".
 */
function wishSlotBreakdownV1(state) {
  return {
    base: 1,
    trollEvil: int(state.challenge?.completionsTier?.difficile?.troll, 0) >= 7 ? 1 : 0,
    pinkHeart: idleHeartsPinkCompleteV1(state) ? 1 : 0,
    quirk: Math.min(1, Math.max(0, int(quirkBonusesV1(idleQuirkNiveauxV1(state)).wishSlotBonus, 0)))
  };
}

export function wishSlotCountV1(state) {
  const b = wishSlotBreakdownV1(state);
  return Math.min(IDLE_WISH_MAX_SLOTS_V1, b.base + b.trollEvil + b.pinkHeart + b.quirk);
}

/* Un slot non débloqué ne garde jamais de ressources : elles retournent au stock libre. */
function releaseLockedWishSlotsV1(state, s) {
  const count = wishSlotCountV1(state);
  (s.data.slots || []).forEach((slot, i) => {
    if (i < count) return;
    for (const k of RESOURCE_KEYS) {
      const amount = Math.max(0, num(slot.allocation?.[k], 0));
      if (amount <= 0) continue;
      slot.allocation[k] = 0;
      if (state.resources[k]) state.resources[k].current = num(state.resources[k].current, 0) + amount;
    }
  });
  syncWishAllocationTotalsV1(s);
}

export function clearWishSlotAllocationsV1(s, resource) {
  for (const slot of s?.data?.slots || []) {
    if (slot?.allocation) slot.allocation[resource] = 0;
  }
}

function wishSlotIndexV1(state, slot) {
  const idx = Number(slot);
  if (!Number.isInteger(idx) || idx < 0 || idx >= IDLE_WISH_MAX_SLOTS_V1) throw new Error("SLOT_SOUHAIT_INVALIDE");
  if (idx >= wishSlotCountV1(state)) throw new Error("SLOT_SOUHAIT_VERROUILLE");
  return idx;
}

/* Place un souhait dans un slot ("" = vider le slot). L'allocation du slot est conservée. */
export function setWishSlotV1(state, slot, wishId) {
  const s = state.systems.wishes;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const idx = wishSlotIndexV1(state, slot);
  const id = String(wishId ?? "");
  if (id) {
    const def = (IDLE_NGU_TRACKS.wishes || []).find(x => x.id === id);
    if (!def) throw new Error("SOUHAIT_INVALIDE");
    if (!idleWishAccessibleV1(state, id)) throw new Error("DIFFICULTE_REQUISE");
    if (Math.max(0, int(s.data.tracks?.[id]?.level, 0)) >= Math.max(0, int(def.levels, 0))) throw new Error("SOUHAIT_TERMINE");
    if (s.data.slots.some((x, i) => i !== idx && x.wish === id)) throw new Error("SOUHAIT_DEJA_DANS_UN_SLOT");
  }
  s.data.slots[idx].wish = id;
  if (idx === 0) s.data.activeTrack = id;
  return { slot: idx, wish: id };
}

/*
 * Allocation d'une ressource sur un slot : même plafond que les NGU
 * (setNguAllocationV1) -- jamais au-delà du cap effectif moins ce qui est
 * alloué ailleurs (autres systèmes, autres slots, réservations externes),
 * ni au-delà de ce que le joueur possède réellement (current + déjà alloué).
 */
export function setWishSlotAllocationV1(state, slot, resource, value, context = {}) {
  const s = state.systems.wishes;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic?.unlocked) throw new Error("MAGIC_VERROUILLEE");
  if (resource === "r3" && !state.systems.hacks?.unlocked) throw new Error("R3_VERROUILLEE");
  const idx = wishSlotIndexV1(state, slot);
  const r = state.resources[resource];
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const entry = s.data.slots[idx];
  const previous = Math.max(0, num(entry.allocation[resource], 0));
  const ownAllocated = s.data.slots.reduce((sum, x) => sum + Math.max(0, num(x.allocation?.[resource], 0)), 0);
  const otherSystems = totalAllocated(state, resource, "wishes") + externalResourceAllocation(context, resource);
  const maxByCapacity = Math.max(0, cap - otherSystems - (ownAllocated - previous));
  const maxByOwned = Math.max(0, previous + num(r.current, 0));
  const target = clamp(num(value, 0), 0, Math.min(maxByCapacity, maxByOwned));
  r.current = clamp(num(r.current, 0) - (target - previous), 0, cap);
  entry.allocation[resource] = target;
  syncWishAllocationTotalsV1(s);
  return { slot: idx, resource, allocation: target };
}

/* Vue client des slots : souhait, progression, allocation et durée du niveau en cours. */
export function wishSlotsSnapshotV1(state) {
  const s = state.systems.wishes;
  const defs = IDLE_NGU_TRACKS.wishes || [];
  const count = wishSlotCountV1(state);
  const params = wishSpeedParamsV1(state, s);
  return {
    unlocked: Boolean(s.unlocked),
    maxSlots: IDLE_WISH_MAX_SLOTS_V1,
    slotCount: count,
    sources: wishSlotBreakdownV1(state),
    minSecondsPerLevel: params.wishMinSeconds,
    speedMultiplier: params.speedMultiplier,
    r3Unlocked: Boolean(state.systems.hacks?.unlocked),
    magicUnlocked: Boolean(state.systems.bloodMagic?.unlocked),
    slots: (s.data.slots || []).map((slot, index) => {
      const def = slot.wish ? defs.find(x => x.id === slot.wish) : null;
      const t = def ? s.data.tracks[def.id] : null;
      const level = Math.max(0, int(t?.level, 0));
      const maxLevel = def ? Math.max(0, int(def.levels, 0)) : 0;
      const done = Boolean(def) && level >= maxLevel;
      const progress = done ? 0 : clamp(num(t?.progress, 0), 0, 1);
      const secs = def && !done ? wishSecondsForLevelV1(state, def, level, slot.allocation, params) : Infinity;
      return {
        index,
        unlocked: index < count,
        wish: slot.wish,
        name: def ? def.name : "",
        effect: def ? def.effect : "",
        level,
        maxLevel,
        done,
        progress,
        allocation: clone(slot.allocation),
        secondsPerLevel: Number.isFinite(secs) ? secs : null,
        secondsRemaining: Number.isFinite(secs) ? secs * (1 - progress) : null
      };
    })
  };
}

export function beardTrackUnlocked(state, trackDef) {
  if (!trackDef) return false;
  const required = Math.max(0, int(trackDef.unlockTroll, 0));
  return int(state.challenge?.completions?.troll, 0) >= required;
}

function advanceBeardTrack(state, system, trackDef, track, seconds, sameResourceCount = 1) {
  if (!system.active || !beardTrackUnlocked(state, trackDef) || seconds <= 0) return;

  const resource = trackDef.resource || "energy";
  const diggers = diggerBonuses(state);
  const diggerSpeed = resource === "magic"
    ? Math.max(1, num(diggers.magicBeard, 1))
    : Math.max(1, num(diggers.energyBeard, 1));
  /*
   * Correctif 2026-09-18 ("finir le câblage laissé ouvert" après 5a281bd) :
   * beardSpeedMultiplierFromItems (Beard Comb/Red Lipstick/A Shrunken
   * Voodoo Doll, wiki "Specials" -- idleNguBonuses(), calculé depuis PISTE
   * 2 mais jamais relu, voir son propre commentaire "câblage dans
   * beardBonusMultiplier laissé pour un futur passage"). beardBonusMultiplier()
   * (plus bas dans ce fichier) n'est PAS le bon point d'entrée : ce
   * multiplicateur y représente l'EFFET produit par le niveau de Beard déjà
   * acquis sur d'autres stats (Attack/Drop/Gold/...), jamais la VITESSE à
   * laquelle la Beard active elle-même progresse -- exactement ce que
   * "Beard Speed" boost sur le wiki. Le vrai point de consommation de la
   * vitesse de Beard est baseRate ci-dessous (advanceBeardTrack) : câblé ici.
   */
  const beardSpeedFromItems = Math.max(0, num(idleNguBonusesLectureV1(state).beardSpeedMultiplierFromItems, 1));
  /* Armpit (set) (wiki "Armpit (set)" : "+10% Beard Speed!") -- setRewards.beardSpeedPct. */
  const beardSpeedFromSets = 1 + Math.max(0, num(state.adventure?.setRewards?.beardSpeedPct, 0));

  // V49 starts with NGU's first Beard slot only, therefore the
  // Beards_SameResource divisor is 1 until a later unlock adds more slots.
  /*
   * 2026-09-23 (audit, page Beards of Power) : la formule du wiki est « progress per tick » (50
   * ticks/s) ; baseRate est une vitesse par seconde, donc x50 (la barre de Beard était 50 fois
   * trop lente, alors que le plafond de 50 niveaux/s ci-dessous suppose bien des ticks).
   */
  const baseRate = 50 *
    Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "bars")) *
    Math.sqrt(Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "power"))) *
    diggerSpeed *
    beardSpeedFromItems *
    beardSpeedFromSets *
    quirkBonusesV1(idleQuirkNiveauxV1(state)).beardSpeedMultiplier /
    (Math.max(1, num(trackDef.speedDivider, 1e8)) * Math.max(1, sameResourceCount));

  if (baseRate <= 0) return;

  let level = Math.max(0, int(track.tempLevel, 0));
  let progress = clamp(track.progress, 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));

  // Finish the current level first. NGU caps Beard growth at 50 levels/s.
  const currentDuration = Math.max(1 / 50, (level + 1) / baseRate);
  const currentRemaining = (1 - progress) * currentDuration;
  if (remaining + 1e-12 < currentRemaining) {
    track.progress = progress + remaining / currentDuration;
    return;
  }

  remaining = Math.max(0, remaining - currentRemaining);
  level += 1;
  progress = 0;

  // Levels with (level + 1) <= baseRate / 50 are hard-capped at 50/s.
  const lastCappedLevel = Math.max(level - 1, Math.floor(baseRate / 50) - 1);
  if (lastCappedLevel >= level && remaining > 0) {
    const cappedCount = Math.min(
      lastCappedLevel - level + 1,
      Math.floor((remaining + 1e-12) * 50)
    );
    level += cappedCount;
    remaining = Math.max(0, remaining - cappedCount / 50);
  }

  // Past the hard cap, durations form an arithmetic series:
  // (level+1)/baseRate, (level+2)/baseRate, ...
  if (remaining > 0) {
    const firstCost = level + 1;
    const budget = remaining * baseRate;
    const discriminant = Math.max(
      0,
      (2 * firstCost - 1) ** 2 + 8 * budget
    );
    let full = Math.max(
      0,
      Math.floor((-(2 * firstCost - 1) + Math.sqrt(discriminant)) / 2)
    );
    const spent = full * (2 * firstCost + full - 1) / 2;
    if (full > 0) {
      level += full;
      remaining = Math.max(0, remaining - spent / baseRate);
    }

    const nextDuration = Math.max(1 / 50, (level + 1) / baseRate);
    progress = clamp(remaining / nextDuration, 0, 0.999999999);
  }

  const startingLevel = Math.max(0, int(track.tempLevel, 0));
  if (level > startingLevel) {
    const remaining = challengeHundredLevelsRemaining(state);
    if (level - startingLevel > remaining) {
      level = startingLevel + remaining;
      progress = 0;
    }
    challengeHundredLevelsConsume(state, level - startingLevel);
  }

  track.tempLevel = level;
  track.progress = progress;
}

/*
 * Wiki NGU (page "Hacks", section "Important Math") : "A Hack's time[1] to
 * level up" = BaseSpeedDivider × 1.0078^level × (level+1) / (R3 alloué ×
 * R3 power), en ticks à 50/s. Contrairement aux Beards, pas de palier
 * "fill" à 50 niveaux/s : la courbe ralentit en continu (facteur
 * géométrique 1.0078^level), donc chaque niveau suivant coûte strictement
 * plus de temps que le précédent — une boucle par niveau reste bornée
 * (plafonnée ici par sécurité, jamais atteinte en pratique vu la vitesse
 * de croissance des BaseSpeedDivider, de 1e8 à 1e13).
 *
 * Correctif 2026-09-18 : hackSpeedMultiplier (idleNguBonuses(), souhaits
 * "Hack Speed" du catalogue + tiers 8-10 de l'Infinity Cube) était calculé
 * mais jamais relu ici (voir le commentaire à sa déclaration) -- acheter le
 * souhait "I wish the Greasy Nerd took a shower" ou monter le cube au tier
 * 8+ n'accélérait donc jamais réellement les Hacks. Appliqué au débit
 * (throughput), comme wishSpeedMultiplier l'est déjà sur le temps requis
 * pour les Wishes ci-dessous (même sens : plus le multiplicateur est haut,
 * plus vite le niveau avance).
 */
/* Page Hacks : niveau maximal de chaque Hack (au-delà, la barre repart sans augmenter le bonus). */
export const HACK_HARD_CAP_V1 = Object.freeze({ attackDefense: 7720, adventureStats: 7632, timeMachineSpeed: 7544, dropChance: 7544, augmentSpeed: 7456, energyNguSpeed: 7340, magicNguSpeed: 7340, bloodGain: 7252, qpGain: 7164, daycare: 7048, exp: 6960, number: 6873, pp: 6757, hackHack: 6757, wish: 6262 });

function advanceHackTrack(state, system, trackDef, track, seconds) {
  if (!system.unlocked || seconds <= 0) return;
  const hackSpeedMultiplier = Math.max(1e-12, num(idleNguBonusesLectureV1(state).hackSpeedMultiplier, 1));
  /*
   * Page Hacks, « Important Math » : temps = BaseSpeedDivider x 1.0078^level x (level+1) / (R3_allocated x R3_power x
   * HackSpeedBonus). Les Bars de Resource 3 n'y figurent pas (page Resource 3 : « Bars : Increases the rate at which
   * you generate Resource 3 until you hit your cap », « The output of each task is (points invested * Power) ») :
   * seconde passe 2026-09-24, elles multipliaient à tort la vitesse des Hacks.
   */
  const throughput = Math.max(0, num(system.allocation.r3, 0)) * Math.max(1, idleNguEffectiveResourceStatV1(state, "r3", "power")) * hackSpeedMultiplier;
  if (throughput <= 0) return;

  let level = Math.max(0, int(track.level, 0));
  let progress = clamp(num(track.progress, 0), 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));
  const divider = Math.max(1, num(trackDef.speedDivider, 1e8));

  const hardCap = HACK_HARD_CAP_V1[trackDef.id] || Infinity;
  let iterations = 0;
  while (remaining > 1e-9 && iterations < 100000 && level < hardCap) {
    iterations++;
    const ticksNeeded = divider * Math.pow(1.0078, level) * (level + 1);
    const secondsNeeded = ticksNeeded / 50 / throughput;
    if (!Number.isFinite(secondsNeeded) || secondsNeeded <= 0) break;
    const remainingForLevel = (1 - progress) * secondsNeeded;
    if (remaining + 1e-12 < remainingForLevel) {
      progress += remaining / secondsNeeded;
      remaining = 0;
    } else {
      remaining -= remainingForLevel;
      level += 1;
      progress = 0;
    }
  }

  track.level = Math.min(level, hardCap);
  track.progress = level >= hardCap ? 0 : progress;
}

/*
 * Wiki NGU (page "Wishes", section "Important Math") : "(EngPower x
 * EngAllocated x MagPower x MagAllocated x Res3Power x Res3Allocated)^0.17
 * / (SpeedDivider x (level+1))" — lu comme une VITESSE (le wiki précise
 * "doubling any single resource only increases wish speed by about
 * ~12.5%", cohérent avec 2^0.17 ≈ 1.125), donc le temps par niveau est
 * l'inverse : SpeedDivider x (level+1) / numérateur^0.17, plafonné en bas
 * à WISH_MIN_LEVEL_SECONDS (4h, cap dur du wiki — plus de ressources ne
 * réduit jamais sous ce plancher). "EngAllocated"/"MagAllocated"/
 * "Res3Allocated" correspondent à system.allocation[energy|magic|r3], déjà
 * modélisées ainsi pour toutes les autres pistes de ce fichier — la
 * ressource doit être allouée sur LES TROIS pour progresser ("you must
 * allocate some of all 3 resources to it"). Les souhaits "+X% Wish Speed"
 * (voir idle-wishes-v1.js, wishSpeedPct) accélèrent ce taux multiplicativement,
 * comme leur texte l'indique — appliqués APRÈS le plancher de 4h pour
 * rester fidèles au wiki ("hard cap... putting more resources into it will
 * not speed up the process", qui ne mentionne aucune exception pour les
 * boosts de vitesse eux-mêmes).
 *
 * Correctif 2026-09-18 : les tiers 8-10 de l'Infinity Cube ("Wish Speed",
 * IDLE_ADVENTURE_CUBE_TIERS_V1.wishSpeedPct, idle-adventure-v47.js)
 * n'étaient mergés nulle part -- calculé ici en plus du wishSpeedMultiplier
 * des Wishes, toujours SANS passer par idleNguBonuses() (design déjà en
 * place : cette boucle par niveau ne doit pas dépendre de tout
 * idleNguBonuses(), voir commentaire de sa propre déclaration) -- même
 * formule que idleNguBonuses().wishSpeedMultiplier, dupliquée volontairement
 * à petite échelle plutôt que centralisée, pour les mêmes raisons de coût.
 */
/*
 * Paramètres communs à tous les slots (2026-09-23, slots de souhaits) :
 * multiplicateur de vitesse partagé et temps minimum par niveau. Calculés
 * une fois par tick puis appliqués à chaque slot avec SA propre allocation.
 */
function wishSpeedParamsV1(state, system) {
  const cubeWishSpeedPct = Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).wishSpeedPct, 0));
  const wishSpeedSetPct = Math.max(0, num(state.adventure?.setRewards?.wishSpeedPct, 0));
  const perkWish = perkBonusesV1(idlePerkNiveauxV1(state));
  const wishMinSeconds = Math.max(3600, WISH_MIN_LEVEL_SECONDS - perkWish.wishMinTimeReductionSeconds - quirkBonusesV1(idleQuirkNiveauxV1(state)).wishMinTimeReductionSeconds);
  const speedMultiplier = Math.max(1e-12, wishBonusesV1(system.data.tracks).wishSpeedMultiplier * perkWish.wishSpeedMultiplier * (state.selloutShop?.purchases?.fasterWishes ? 1.25 : 1) * (1 + cubeWishSpeedPct / 100) * (1 + wishSpeedSetPct) * gearPctV1(gearSpecialsV1(state), "wishSpeedPct") * hackFxV1(state).wish
    * idleCardsMultiplierV1(state, "wishes") /* Cards WISHES */);
  return { wishMinSeconds, speedMultiplier };
}

/*
 * Durée (s) d'un niveau `level` -> `level + 1` avec l'allocation d'UN slot.
 * Infinity si l'une des trois ressources n'est pas allouée ou si le calcul
 * déborde. Le bug de virgule flottante décrit par le wiki (progression
 * bloquée à 50 % au-delà de ~7 j 17 h) n'est volontairement PAS reproduit.
 */
function wishSecondsForLevelV1(state, trackDef, level, allocation, params) {
  const engAlloc = Math.max(0, num(allocation?.energy, 0));
  const magAlloc = Math.max(0, num(allocation?.magic, 0));
  const r3Alloc = Math.max(0, num(allocation?.r3, 0));
  if (engAlloc <= 0 || magAlloc <= 0 || r3Alloc <= 0) return Infinity;
  /*
   * Page Wishes : « (Eng_Power x Eng_allocated x Mag_Power x Mag_allocated x Res3_Power x Res3_allocated)^0.17 ».
   * Seconde passe 2026-09-24 : la Puissance est celle du jeu (achats EXP + perks + quirks + souhaits + équipement +
   * potions...), pas la seule Puissance achetée : les Hacks, les Augments et les NGU lisaient déjà la Puissance effective.
   */
  const engPower = Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power"));
  const magPower = Math.max(1, idleNguEffectiveResourceStatV1(state, "magic", "power"));
  const r3Power = Math.max(1, idleNguEffectiveResourceStatV1(state, "r3", "power"));
  const numerator = engPower * engAlloc * magPower * magAlloc * r3Power * r3Alloc;
  const divider = Math.max(1, num(trackDef.speedDivider, 1e15));
  const rawSeconds = (divider * (level + 1)) / Math.pow(numerator, 0.17) / params.speedMultiplier;
  return Number.isFinite(rawSeconds) ? Math.max(params.wishMinSeconds, rawSeconds) : Infinity;
}

function advanceWishTrack(state, system, trackDef, track, seconds, allocation = system.allocation, params = wishSpeedParamsV1(state, system)) {
  if (!system.unlocked || seconds <= 0) return;
  if (Math.max(0, int(track.level, 0)) >= Math.max(0, int(trackDef.levels, 0))) return;
  if (!Number.isFinite(wishSecondsForLevelV1(state, trackDef, Math.max(0, int(track.level, 0)), allocation, params))) return;

  let level = Math.max(0, int(track.level, 0));
  let progress = clamp(num(track.progress, 0), 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));
  const maxLevel = Math.max(0, int(trackDef.levels, 0));

  let iterations = 0;
  while (remaining > 1e-9 && level < maxLevel && iterations < 100000) {
    iterations++;
    const secondsNeeded = wishSecondsForLevelV1(state, trackDef, level, allocation, params);
    if (!Number.isFinite(secondsNeeded) || secondsNeeded <= 0) break;
    const remainingForLevel = (1 - progress) * secondsNeeded;
    if (remaining + 1e-12 < remainingForLevel) {
      progress += remaining / secondsNeeded;
      remaining = 0;
    } else {
      remaining -= remainingForLevel;
      level += 1;
      progress = 0;
    }
  }

  track.level = level;
  track.progress = level >= maxLevel ? 0 : progress;
}

/*
 * Advanced Training (Norman, 2026-10-02 : « l'interface n'est pas bonne du tout, ce sont des barres qui avancent » -- dans le jeu d'origine chaque
 * compétence a son niveau, son énergie allouée, son Target et ses boutons + / −). Chaque compétence progresse donc avec SA propre énergie
 * (data.tracks[id].energy) ; allocation.energy en est la somme. Ancien contrat (une seule piste active, allocation unique) conservé tant qu'aucune
 * énergie n'est posée par compétence : l'allocation unique va alors à la piste active.
 * Formules inchangées (wiki Advanced Training : 10 000 s / 20 000 s pour le niveau 1, racine carrée de la puissance, 50 niveaux/s).
 */
function atTrackEnergyV1(s, trackId) {
  return Math.max(0, num(s.data?.tracks?.[trackId]?.energy, 0));
}

function atEnergyTotalV1(s) {
  return Object.values(s.data?.tracks || {}).reduce((sum, x) => sum + Math.max(0, num(x?.energy, 0)), 0);
}

function advanceAdvancedTrainingV1(state, s, tracks, seconds) {
  const wandoosOk = Boolean(state.systems.wandoos?.unlocked);
  const wandoosTrack = id => id === "wandoosEnergy" || id === "wandoosMagic";
  if (wishLevelV1(state, 190) >= 1) {
    for (const other of tracks) {
      if (wandoosTrack(other.id) && !wandoosOk) continue;
      const ot = s.data.tracks[other.id];
      if (!ot) continue;
      ot.progress = Math.max(0, num(ot.progress, 0)) + 50 * seconds;
      let gainedFree = Math.floor(ot.progress);
      const roomFree = challengeHundredLevelsRemaining(state);
      if (gainedFree > roomFree) { gainedFree = roomFree; ot.progress = 0; }
      else ot.progress -= gainedFree;
      if (gainedFree > 0) {
        ot.tempLevel = Math.max(0, Math.floor(num(ot.tempLevel, 0))) + gainedFree;
        challengeHundredLevelsConsume(state, gainedFree);
      }
    }
  } else {
    const perTrack = atEnergyTotalV1(s) > 0;
    const legacyActive = s.data.activeTrack || tracks[0].id;
    const sqrtPower = Math.sqrt(Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power")));
    const gearAtSpeed = gearPctV1(gearSpecialsV1(state), "advancedTrainingPct");
    for (const trackDef of tracks) {
      const t = s.data.tracks[trackDef.id];
      if (!t) continue;
      const own = atTrackEnergyV1(s, trackDef.id);
      const alloc = own > 0 ? own : (!perTrack && trackDef.id === legacyActive ? Math.max(0, num(s.allocation.energy, 0)) : 0);
      if (alloc <= 0) continue;
      const baseSeconds = wandoosTrack(trackDef.id) ? 20000 : 10000;
      const rate = (alloc * sqrtPower * gearAtSpeed) / (baseSeconds * 1000); // unités de travail par seconde
      const level = Math.max(0, Math.floor(num(t.tempLevel, 0)));
      const work = Math.max(0, num(t.progress, 0)) * (level + 1) + rate * seconds;
      const step = nguLevelsFromWorkV1(level, work);
      let gained = Math.min(step.gained, Math.floor(50 * seconds) + 1);
      const roomAt = challengeHundredLevelsRemaining(state);
      const cappedByPool = gained > roomAt;
      if (cappedByPool) gained = roomAt;
      challengeHundredLevelsConsume(state, gained);
      t.tempLevel = level + gained;
      t.progress = cappedByPool || gained < step.gained ? 0 : clamp(step.work / (t.tempLevel + 1), 0, 0.999999999);
    }
  }
  s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
  atApplyTargetsV1(state);
}

/* Champ « Target » (niveau à atteindre, 0 = aucun ; même règle que la Time Machine) : à l'atteinte, l'énergie de la compétence est retirée. */
export const IDLE_AT_ORDRE_V1 = Object.freeze(["toughness", "power", "block", "wandoosEnergy", "wandoosMagic"]);

function atTargetAtteintV1(t) {
  const target = Math.max(0, Math.floor(num(t?.target, 0)));
  return target > 0 && Math.floor(num(t.tempLevel, 0)) >= target;
}

/*
 * « Advance Energy » (Norman, 2026-10-02 : « permet de faire avancer automatiquement l'énergie vers la ligne suivante ») : quand une compétence atteint
 * son Target, son énergie passe à la compétence suivante de la liste (dans l'ordre de l'écran) qui est débloquée et n'a pas atteint son propre Target ;
 * sans suivante, elle est simplement rendue. Désactivé : l'énergie est rendue, comme avant.
 */
export function atApplyTargetsV1(state) {
  const s = state.systems.advancedTraining;
  if (!s?.data?.tracks) return;
  const pistes = s.data.tracks;
  const wandoosOk = Boolean(state.systems.wandoos?.unlocked);
  IDLE_AT_ORDRE_V1.forEach((id, index) => {
    const t = pistes[id];
    if (!t || !atTargetAtteintV1(t) || atTrackEnergyV1(s, id) <= 0) return;
    const suivante = s.data.advanceEnergy
      ? IDLE_AT_ORDRE_V1.slice(index + 1).find(n => pistes[n] && (wandoosOk || !(n === "wandoosEnergy" || n === "wandoosMagic")) && !atTargetAtteintV1(pistes[n]))
      : "";
    if (suivante) {
      pistes[suivante].energy = atTrackEnergyV1(s, suivante) + atTrackEnergyV1(s, id);
      t.energy = 0;
    } else {
      atSetTrackEnergyV1(state, id, 0, {});
    }
  });
}

/* Pose l'énergie d'UNE compétence (mêmes plafonds qu'une allocation ordinaire) ; allocation.energy reste la somme des compétences. */
export function atSetTrackEnergyV1(state, trackId, value, context = {}) {
  const s = state.systems.advancedTraining;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const t = s.data?.tracks?.[trackId];
  if (!t) throw new Error("PISTE_INCONNUE");
  if ((trackId === "wandoosEnergy" || trackId === "wandoosMagic") && !state.systems.wandoos?.unlocked) throw new Error("PISTE_VERROUILLEE");
  /* Ancien contrat : une allocation unique non répartie est d'abord rattachée à la piste active, jamais comptée deux fois. */
  if (atEnergyTotalV1(s) <= 0 && Math.max(0, num(s.allocation.energy, 0)) > 0) {
    const actif = s.data.tracks[s.data.activeTrack || ""];
    if (actif) actif.energy = Math.max(0, num(s.allocation.energy, 0));
  }
  const others = atEnergyTotalV1(s) - Math.max(0, num(t.energy, 0));
  setAllocation(state, "advancedTraining", "energy", others + Math.max(0, num(value, 0)), context);
  t.energy = Math.max(0, num(s.allocation.energy, 0) - others);
  s.allocation.energy = atEnergyTotalV1(s);
}

export function advanceTrackSystem(state, def, seconds) {
  const s = state.systems[def.id];
  if (!s.unlocked || seconds <= 0) return;
  const tracks = IDLE_NGU_TRACKS[def.id] || [];
  if (!tracks.length) return;
  if (def.id === "beards") {
    const ids = beardActiveIdsV1(state);
    const countBy = { energy: 0, magic: 0 };
    for (const id of ids) countBy[(tracks.find(x => x.id === id)?.resource) || "energy"] += 1;
    const penaltyFactor = state.adventure?.completedSets?.beardverse ? 0.9 : 1;
    for (const id of ids) {
      const bd = tracks.find(x => x.id === id);
      const same = Math.max(1, countBy[bd.resource || "energy"] * penaltyFactor);
      advanceBeardTrack(state, s, bd, s.data.tracks[id], seconds, same);
    }
    s.data.beardSlots = beardSlotsV1(state);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
    s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.permanentLevel, 0);
    return;
  }

  if (def.id === "wishes") {
    /*
     * Chaque slot débloqué fait progresser SON souhait avec SA propre
     * allocation, même formule et mêmes multiplicateurs partagés (page
     * Wishes : "spreading out your resources on multiple wishes is very
     * effective", conséquence directe de l'exposant 0,17).
     */
    releaseLockedWishSlotsV1(state, s);
    const count = wishSlotCountV1(state);
    const params = wishSpeedParamsV1(state, s);
    for (let i = 0; i < count; i++) {
      const slot = s.data.slots?.[i];
      if (!slot || !slot.wish) continue;
      const wishDef = tracks.find(x => x.id === slot.wish);
      const wishState = s.data.tracks[slot.wish];
      if (wishDef && wishState && idleWishAccessibleV1(state, slot.wish)) advanceWishTrack(state, s, wishDef, wishState, seconds, slot.allocation, params);
    }
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    return;
  }

  const active = s.data.activeTrack || tracks[0].id;
  const trackDef = tracks.find(x => x.id === active) || tracks[0];
  const t = s.data.tracks[active];
  if (!t) return;

  if (def.id === "hacks") {
    advanceTheEndFinalHackV1(state, seconds);
    advanceHackTrack(state, s, trackDef, t, seconds);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    return;
  }

  if (def.id === "advancedTraining") {
    /* Chaque compétence a SA propre allocation (comme dans le jeu d'origine) : voir advanceAdvancedTrainingV1. */
    advanceAdvancedTrainingV1(state, s, tracks, seconds);
    return;
  } else {
  let throughput = 0;
  for (const resource of def.resources) {
    const alloc = Math.max(0, num(s.allocation[resource], 0));
    /*
     * Wiki NGU (page "Energy", section Uses > Advanced Training : "Energy
     * power affects it only by a Sqrt(Energy Power)" ; page "Advanced
     * Training" : "your Energy Power is only as effective as it's square
     * root... Energy cap is not affected and works at full effectiveness")
     * — l'Advanced Training est la SEULE piste où la Puissance compte en
     * racine carrée ; Wandoos/NGU/Wishes gardent leur Puissance à taux
     * plein (non touché ici).
     */
    const effPower = idleNguEffectiveResourceStatV1(state, resource, "power");
    const effBars = idleNguEffectiveResourceStatV1(state, resource, "bars");
    const power = def.id === "advancedTraining"
      ? Math.sqrt(Math.max(1, effPower))
      : Math.max(1, effPower);
    throughput += alloc * power * Math.max(1, effBars);
  }
  if (throughput <= 0) return;

  const divisor =
    def.id === "advancedTraining" ? 25000 :
    def.id === "ngu" ? 300000 :
    100000;

  /*
   * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
   * Evil/Sadistic). Wiki NGU : "Meta (set)" +20% NGU Speed, "Back To
   * School (set)" +15% NGU Speed -- setRewards.nguSpeedPct
   * (idle-adventure-v47.js) est le pont déjà utilisé pour les autres
   * bonus de set. Ce champ ne couvre QUE ce pont-là.
   *
   * Correctif 2026-09-18 (suite) : le multiplicateur "NGU Speed" plus large
   * (challenges/beard/digger/attack-NGU/objets, déjà calculé dans
   * idleNguBonuses().nguSpeedMultiplier) restait un gap préexistant jamais
   * branché dans cette boucle d'avancement -- câblé maintenant, en plus de
   * nguSpeedSetMultiplier ci-dessus (deux sources distinctes du même wiki,
   * multipliées ensemble comme le reste des chaînes de multiplicateurs de
   * ce fichier). Uniquement sur def.id === "ngu" : ce champ ne concerne que
   * cette piste précise (Attack/Defense/Adventure/Drop/Respawn/Experience/
   * PP/Quest/Daycare via NGU), jamais Beards/Hacks/Wishes/Wandoos/Advanced
   * Training qui ont chacun leur propre vitesse déjà câblée ailleurs.
   */
  const nguSpeedSetMultiplier = def.id === "ngu" ? 1 + Math.max(0, num(state.adventure?.setRewards?.nguSpeedPct, 0)) : 1;
  const nguSpeedBonusMultiplier = def.id === "ngu" ? Math.max(0, num(idleNguBonusesLectureV1(state).nguSpeedMultiplier, 1)) : 1;
  t.progress += (throughput / divisor) * seconds * nguSpeedSetMultiplier * nguSpeedBonusMultiplier;
  let gain = Math.floor(t.progress);
  if (gain > 0) {
    t.progress -= gain;
    if (def.kind === "run" || def.kind === "hybrid") t.tempLevel += gain;
    else t.level += gain;
  }
  }

  s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
  s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
  s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.permanentLevel, 0);
}

/*
 * Fidélité wiki (2026-09-16, audit) : ngu-time-machine.md — "Cost for
 * level N-1->N is N times the level 0->1 cost (linear scaling)". La
 * base (0->1, à 1 Energy/Magic Power + 1000 de cap alloué) vaut
 * 1 000 000 s : alloc×power=1000 à ce point de référence, donc
 * base = 1e9/(alloc×power) redonne bien 1 000 000 s. L'ancienne formule
 * (1000/(alloc×power), sans dépendance au niveau) rendait chaque niveau
 * quasi instantané (~1s), une régression bien plus grave que le simple
 * "pas de scaling par niveau" repéré par l'audit.
 */
function tmLevelSeconds(state, resource, targetLevel, allocOverride = null) {
  return tmSecondsFactorV1(state, resource, allocOverride) * Math.max(1, targetLevel);
}

/*
 * Durée du niveau 1 (le niveau n dure n fois plus) : tous les bonus sont calculés ICI, une fois ; les boucles de montée de niveaux (advanceTimeMachine) la réutilisent au lieu de tout
 * recalculer à chaque niveau (plus de 70 s de calcul pour 60 s de jeu avec de grosses sommes d'Énergie : le serveur dépassait son temps de calcul).
 */
function tmSecondsFactorV1(state, resource, allocOverride = null) {
  const alloc = allocOverride != null ? Math.max(0, num(allocOverride, 0)) : Math.max(0, num(state.systems.timeMachine.allocation[resource], 0));
  if (alloc <= 0) return Infinity;
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "power"));
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "timeMachine");
  return 1e9 * difficultyDivider / Math.max(1e-12, alloc * power * hackFxV1(state).timeMachineSpeed * challengePermanentBonuses(state).timeMachineSpeedMultiplier
    * idleCardsMultiplierV1(state, "timeMachine") /* Cards TM */);
}

/*
 * Fidélité wiki : "Level 0->1 for EITHER track: 5,000,000 Gold... Requires
 * Energy and Magic allocation, plus Gold, to level up." Aucun coût en Or
 * n'était jamais prélevé auparavant — la barre se remplissait, puis le
 * niveau montait gratuitement.
 */
function tmLevelGoldCost(targetLevel) {
  return 5000000 * Math.max(1, targetLevel);
}

function tmTargetReached(target, level) {
  return num(target, 0) > 0 && num(level, 0) >= num(target, 0);
}

/* Niveau cible atteint : l'énergie (vitesse) ou la magie (Gold) allouée à la Time Machine est rendue automatiquement. */
export function tmApplyTargets(state) {
  const s = state.systems.timeMachine;
  const d = s.data;
  if (tmTargetReached(d.speedTarget, d.speedLevel) && num(s.allocation.energy, 0) > 0) {
    setAllocation(state, "timeMachine", "energy", 0);
    d.speedProgress = 0;
  }
  if (tmTargetReached(d.goldTarget, d.goldLevel) && num(s.allocation.magic, 0) > 0) {
    setAllocation(state, "timeMachine", "magic", 0);
    d.goldProgress = 0;
  }
}

/*
 * Vue de l'écran Broken Time Machine (mêmes rubriques que le jeu : Gold per Bar Fill, Bar Fills per second, Blood Magic GPS Bonus, NGU GPS
 * Multiplier, Challenge Multiplier, Highest Boss Multiplier, Gold Multiplier, Machine Speed GPS Multiplier, Beard GPS Multiplier, Gross / Net GPS).
 * Ce sont EXACTEMENT les facteurs de idleNguTimeMachineGrossGoldPerSecond, jamais une seconde formule ; les pourcentages du jeu valent
 * multiplicateur x 100. Les barres sont la progression vers le niveau suivant (temps déjà écoulé / durée du niveau).
 */
/*
 * Vue de la page Wandoos (Norman, 2026-10-07 : écran de boot, choix de l'OS, énergie et magie à placer). Seuls les OS DÉJÀ débloqués sont listés (anti-spoil : la taille de la liste ne révèle pas les suivants).
 * Boot : vrai démarrage du wiki (« 1-hour boot-up », réductions du set XL et des défis, minimum 27 min) ; jamais une valeur inventée.
 */
export function wandoosViewV1(state, now) {
  const c = wandoosCalculVitessesV1(state, 0, now);
  if (!c) return null;
  const meh = Boolean(state.adventure?.setRewards?.wandoosMeh);
  const xl = idleWandoosXlUnlockedV1(state);
  const energy = state.resources?.energy || {};
  const magic = state.resources?.magic || {};
  return {
    os: c.osId,
    osNom: c.os.name,
    osDisponibles: ["98"].concat(meh ? ["meh"] : [], xl ? ["xl"] : []),
    exigence: c.requirement,
    niveauOsTotal: c.totalOsLevel,
    multiplicateurOs: c.osLevelMultiplier,
    vitesseEnergie: c.energySpeed,
    vitesseMagie: c.magicSpeed,
    /* Cap de Wandoos : allocation à partir de laquelle le Dump atteint 50 niveaux/s (voir wandoosCalculVitessesV1) ; null si indéfini. */
    capEnergie: c.energyCap,
    capMagie: c.magicCap,
    bootSecondes: c.boot.bootSeconds,
    bootEcoule: Math.min(c.boot.bootSeconds, c.boot.elapsed),
    bootFraction: clamp(c.boot.elapsed / c.boot.bootSeconds, 0, 1),
    /* Identifiant du Rebirth en cours (début du run) : l'écran d'allumage de l'OS ne s'affiche qu'une fois par Rebirth. */
    runId: Math.max(0, num(state.runStartedAt, 0)),
    bonusCombat: wandoosCombatMultiplierV1(state),
    energieLibre: Math.max(0, num(energy.current, 0)),
    magieLibre: Math.max(0, num(magic.current, 0))
  };
}

export function timeMachineViewV1(state) {
  const s = state.systems.timeMachine;
  const d = s.data;
  const speedLevel = Math.max(0, num(d.speedLevel, 0));
  const goldLevel = Math.max(0, num(d.goldLevel, 0));
  const fill = (progress, step) => (Number.isFinite(step) && step > 0 ? Math.max(0, Math.min(1, num(progress, 0) / step)) : 0);
  const speedStep = tmLevelSeconds(state, "energy", speedLevel + 1);
  const goldStep = state.systems.bloodMagic?.unlocked ? tmLevelSeconds(state, "magic", goldLevel + 1) : Infinity;
  const highestBoss = Math.max(1, Math.min(274, num(d.highestBossEver, 0) - 27));
  return {
    goldPerBarFill: Math.max(0, num(d.bestGoldThisRun, 0)),
    /* Le mob du meilleur butin d'Or (image de l'écran de la machine) : { zone, boss, seed, name } ou { titan, name }, ou null. */
    bestGoldMob: d.bestGoldMob || null,
    barFillsPerSecond: speedLevel < 50 ? Math.min(50, 1 + speedLevel) : 50,
    bloodMagicMultiplier: Math.max(1, num(state.systems.bloodMagic.data.spells.counterfeitGold, 1)),
    nguMultiplier: nguFxV1(state).timeMachine,
    challengeMultiplier: challengePermanentBonuses(state).timeMachineGoldMultiplier,
    highestBossMultiplier: highestBoss,
    goldMultiplier: 1 + goldLevel,
    machineSpeedMultiplier: speedLevel < 50 ? 1 : 1 + (speedLevel - 49),
    beardMultiplier: beardBonusMultiplier(state, "gold"),
    grossGps: idleNguTimeMachineGrossGoldPerSecond(state),
    netGps: idleNguTimeMachineGoldPerSecond(state),
    /* Or par seconde retiré par les Mineurs d'or actifs (brut − net). Absent tant que ce système n'est pas débloqué (anti-spoil : le champ lui-même ne doit pas le révéler). */
    ...(state.systems.diggers?.unlocked ? { diggerDrain: diggerDrainTotal(state) } : {}),
    speedFill: fractionProgressionSecondesV1(d, "speedProgress", speedStep),
    goldFill: fractionProgressionSecondesV1(d, "goldProgress", goldStep),
    speedFraction: fractionProgressionSecondesV1(d, "speedProgress", speedStep),
    goldFraction: fractionProgressionSecondesV1(d, "goldProgress", goldStep),
    speedEtaSeconds: Number.isFinite(speedStep)
      ? Math.max(0, (1 - fractionProgressionSecondesV1(d, "speedProgress", speedStep)) * speedStep)
      : null,
    goldEtaSeconds: Number.isFinite(goldStep)
      ? Math.max(0, (1 - fractionProgressionSecondesV1(d, "goldProgress", goldStep)) * goldStep)
      : null,
    speedTarget: Math.max(0, Math.floor(num(d.speedTarget, 0))),
    goldTarget: Math.max(0, Math.floor(num(d.goldTarget, 0))),
    /* Chantier « réactivité » : durée du niveau à 1 Energy / 1 Magic (K) et progression en secondes -> recalcul local au clic. */
    speedK: finiOuNullV1(tmLevelSeconds(state, "energy", speedLevel + 1, 1)),
    goldK: state.systems.bloodMagic?.unlocked ? finiOuNullV1(tmLevelSeconds(state, "magic", goldLevel + 1, 1)) : null,
    speedProgressSeconds: Number.isFinite(speedStep) ? fractionProgressionSecondesV1(d, "speedProgress", speedStep) * speedStep : Math.max(0, num(d.speedProgress, 0)),
    goldProgressSeconds: Number.isFinite(goldStep) ? fractionProgressionSecondesV1(d, "goldProgress", goldStep) * goldStep : Math.max(0, num(d.goldProgress, 0))
  };
}

export function finiOuNullV1(v) {
  return Number.isFinite(v) ? v : null;
}

/*
 * Norman (2026-09-29) : « pour chaque barre, il faut un temps pour compléter un niveau qui
 * s'affiche. » Blood Magic n'exposait aucune donnée de progression au client (seul
 * bloodRituals: clone(IDLE_NGU_BLOOD_RITUALS) -- le catalogue statique, jamais l'avancement réel).
 * Même formule EXACTE qu'advanceBloodMagic (secondsPerCompletion), en lecture seule, pour le
 * rituel ACTIF uniquement -- seul lui progresse réellement (data.activeRitual, un seul rituel à la
 * fois côté serveur).
 */
export function bloodMagicViewV1(state) {
  const s = state.systems.bloodMagic;
  if (!s || !s.unlocked) return null;
  bloodMigrerAllocationV1(s);
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, "magic", "power"));
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "bloodMagic");
  const dutchSetMultiplier = 1 + Math.max(0, num(state.adventure?.setRewards?.bloodMagicSpeedPct, 0));
  const vueRituel = ritual => {
    const rs = (s.data.rituals || {})[ritual.id] || { progress: 0 };
    const magic = Math.max(0, num(rs.magic, 0));
    const secondsPerCompletion = magic > 0
      ? ritual.baseSeconds * 1000 * difficultyDivider / Math.max(1e-12, magic * power) / dutchSetMultiplier
      : null;
    return {
      id: ritual.id,
      magic,
      secondsPerCompletion,
      etaSeconds: secondsPerCompletion != null
        ? Math.max(0, (1 - fractionProgressionSecondesV1(rs, "progress", secondsPerCompletion)) * secondsPerCompletion)
        : null,
      progressFraction: fractionProgressionSecondesV1(rs, "progress", secondsPerCompletion),
      /* Chantier « réactivité » : durée d'une complétion à 1 Magic (K) et progression en secondes -> recalcul local au clic. */
      secondsK: ritual.baseSeconds * 1000 * difficultyDivider / Math.max(1e-12, power) / dutchSetMultiplier,
      progressSeconds: secondsPerCompletion != null ? fractionProgressionSecondesV1(rs, "progress", secondsPerCompletion) * secondsPerCompletion : Math.max(0, num(rs.progress, 0))
    };
  };
  const selectionne = IDLE_NGU_BLOOD_RITUALS.find(r => r.id === s.data.activeRitual) || IDLE_NGU_BLOOD_RITUALS[0];
  const vues = IDLE_NGU_BLOOD_RITUALS.filter(r => r.id === selectionne.id || bloodRitualMagicV1(s, r.id) > 0).map(vueRituel);
  const vueSel = vues.find(v => v.id === selectionne.id);
  return Object.assign({ activeRitual: selectionne.id, rituals: vues }, {
    secondsPerCompletion: vueSel.secondsPerCompletion,
    etaSeconds: vueSel.etaSeconds,
    progressFraction: vueSel.progressFraction,
    secondsK: vueSel.secondsK,
    progressSeconds: vueSel.progressSeconds
  });
}

export function advanceTimeMachine(state, seconds) {
  const s = state.systems.timeMachine;
  if (!s.unlocked || seconds <= 0) return;
  const d = s.data;

  /*
   * Le coût grandissant avec le niveau (temps ET Or), on ne peut plus
   * calculer le nombre de niveaux gagnés en une division : chaque palier
   * doit être franchi un par un, et un palier reste bloqué si l'Or
   * disponible est insuffisant au moment où la barre se remplit (la barre
   * plafonne alors pleine, en attente d'Or — jamais une perte de
   * progression). Le nombre d'itérations reste naturellement borné (le
   * coût croît linéairement, donc le temps cumulé croît en N²) ; une
   * limite défensive évite malgré tout toute boucle non bornée.
   */
  let guard = 0;
  const facteurEnergie = tmSecondsFactorV1(state, "energy");
  const facteurMagie = tmSecondsFactorV1(state, "magic");
  const limiteDefi = state.challenge?.active === "hundredLevels";
  let energyStep = facteurEnergie * Math.max(1, d.speedLevel + 1);
  if (Number.isFinite(energyStep)) {
    rebaserProgressionSecondesV1(d, "speedProgress", energyStep);
    d.speedProgress += seconds;
    while (d.speedProgress >= energyStep && guard < 100000 && !tmTargetReached(d.speedTarget, d.speedLevel)) {
      guard++;
      const cost = tmLevelGoldCost(d.speedLevel + 1);
      if (state.currencies.gold + 1e-9 < cost || (limiteDefi && challengeHundredLevelsRemaining(state) <= 0)) { d.speedProgress = energyStep; break; }
      state.currencies.gold -= cost;
      d.speedProgress -= energyStep;
      d.speedLevel += 1;
      challengeHundredLevelsConsume(state, 1);
      energyStep = facteurEnergie * Math.max(1, d.speedLevel + 1);
      if (!Number.isFinite(energyStep)) break;
      rebaserProgressionSecondesV1(d, "speedProgress", energyStep);
    }
  }

  if (state.systems.bloodMagic.unlocked) {
    guard = 0;
    let magicStep = facteurMagie * Math.max(1, d.goldLevel + 1);
    if (Number.isFinite(magicStep)) {
      rebaserProgressionSecondesV1(d, "goldProgress", magicStep);
      d.goldProgress += seconds;
      while (d.goldProgress >= magicStep && guard < 100000 && !tmTargetReached(d.goldTarget, d.goldLevel)) {
        guard++;
        const cost = tmLevelGoldCost(d.goldLevel + 1);
        if (state.currencies.gold + 1e-9 < cost || (limiteDefi && challengeHundredLevelsRemaining(state) <= 0)) { d.goldProgress = magicStep; break; }
        state.currencies.gold -= cost;
        d.goldProgress -= magicStep;
        d.goldLevel += 1;
        challengeHundredLevelsConsume(state, 1);
        magicStep = facteurMagie * Math.max(1, d.goldLevel + 1);
        if (!Number.isFinite(magicStep)) break;
        rebaserProgressionSecondesV1(d, "goldProgress", magicStep);
      }
    }
  }

  tmApplyTargets(state);

  const gps = idleNguTimeMachineGoldPerSecond(state);
  const gain = gps * seconds;
  state.currencies.gold += gain;
  d.producedThisRun += gain;
  s.level = Math.floor(d.speedLevel + d.goldLevel);
  s.tempLevel = s.level;
}

export function idleNguTimeMachineGrossGoldPerSecond(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw);
  const d = state.systems.timeMachine.data;
  if (!state.systems.timeMachine.unlocked) return 0;
  if(state.challenge?.active==="noTimeMachine")return 0;

  const goldPerBar = Math.max(0, num(d.bestGoldThisRun, 0));
  if (goldPerBar <= 0) return 0;

  // Wiki NGU (page "Broken Time Machine", section "Gold multipliers") :
  // "Highest Boss - 27 = Gold Multiplier (max of 274x)" — un multiplicateur
  // linéaire (boss-27), plafonné à 274x (atteint au boss 301), pas la
  // formule 1+boss/10 utilisée précédemment (qui sous-évaluait ce bonus
  // d'un facteur ~7 dès les premiers boss et ne plafonnait jamais).
  const highestBossMultiplier = Math.max(1, Math.min(274, num(d.highestBossEver, 0) - 27));
  const speedLevel = Math.max(0, num(d.speedLevel, 0));
  const barsPerSecond = speedLevel < 50 ? Math.min(50, 1 + speedLevel) : 50 * (1 + (speedLevel - 49));
  const goldMultiplier = 1 + Math.max(0, num(d.goldLevel, 0));
  const counterfeit = Math.max(1, num(state.systems.bloodMagic.data.spells.counterfeitGold, 1));

  const beardGold = beardBonusMultiplier(state, "gold");
  const challengeGold=challengePermanentBonuses(state).timeMachineGoldMultiplier;
  return goldPerBar * highestBossMultiplier * barsPerSecond * goldMultiplier * counterfeit * beardGold * challengeGold * nguFxV1(state).timeMachine;
}

export function idleNguTimeMachineGoldPerSecond(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw);
  return Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state)-diggerDrainTotal(state));
}
