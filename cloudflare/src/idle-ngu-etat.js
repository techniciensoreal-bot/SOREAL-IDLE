/*
 * NGU : création, normalisation et migration de l'état (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleWandoosBootMultiplierV1 } from "./idle-wandoos-os-v1.js";
import { nettoyerUiPrefsV1 } from "./idle-ui-prefs-v1.js";
import { perkBonusesV1, IDLE_PERKS_CATALOG_V1 } from "./idle-perks-v1.js";
import { idlePerkNiveauxV1, idleQuirkNiveauxV1, idleWishTracksActifsV1 } from "./idle-difficulty-gates-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { idleCardsMultiplierV1, createIdleCardsDataV1, createIdleCardBonusesV1, normalizeIdleCardsDataV1, normalizeIdleCardBonusesV1 } from "./idle-cards-v1.js";
import { macguffinEffectMultiplierV1, createMacguffinDataV1, normalizeMacguffinDataV1 } from "./idle-macguffins-v1.js";
import { createIdleCookingDataV1, normalizeIdleCookingDataV1 } from "./idle-cooking-v1.js";
import { createIdleAdventureStateV47, normalizeIdleAdventureStateV47, idleAdventureAddItemV1, idleAdventureBoostV1 } from "./idle-adventure-v47.js";
import { normalizeIdleAchievementsDataV1 } from "./idle-achievements-v1.js";
import { IDLE_SELLOUT_SHOP_CATALOG_V1, createSelloutEffectsV1 } from "./idle-sellout-shop-v1.js";
import { idleLoginCalendarNormaliserV1 } from "./idle-login-calendar-v1.js";
import { wishBonusesV1 } from "./idle-wishes-v1.js";
import { idleInventoryMergeSlotCountV1, normalizeIdleInventoryAutoV1 } from "./idle-inventory-auto-v1.js";
import { normalizeIdleDaycareDataV1, idleDaycareFactorsV1 } from "./idle-daycare-v1.js";
import { idleTheEndGrantV1, idleTheEndHasV1, idleTheEndDataV1, IDLE_THE_END_FINAL_HACK_SECONDS_V1 } from "./idle-the-end-v1.js";
import { atLevelV1, beardBonusMultiplier, createNguDataV1, gearPctV1, gearSpecialsV1, nguFxV1, normalizeNguDataV1, syncNguAllocationTotalsV1 } from "./idle-ngu-bonus.js";
import { CHALLENGE_TIER_KEYS_V1, IDLE_NGU_AUGMENTATIONS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_DIGGERS, IDLE_NGU_META_VERSION, IDLE_NGU_NORMAL_CHALLENGES, IDLE_NGU_SAVE_SCHEMA, IDLE_NGU_SYSTEMS, IDLE_NGU_TRACKS, IDLE_NGU_YGG_FRUITS, IDLE_WISH_MAX_SLOTS_V1, MIN_REBIRTH_SECONDS, RESOURCE_KEYS, challengePermanentBonuses, clamp, clone, createChallengeTiersV1, int, nowMs, num } from "./idle-ngu-catalogues.js";
import { appliquerConsommablesSetsAventureV1, challengeHundredLevelsConsume, challengeHundredLevelsRemaining, moneyPitTotauxNormalisesV1, roueTotauxNormalisesV1, wishLevelV1 } from "./idle-ngu-snapshot.js";
import { IDLE_MONEY_PIT_HISTORIQUE_MAX_V1, createTrollStateV1, diggerBonuses, normaliserR3NomV1, trollFlagsV1 } from "./idle-ngu-systemes.js";
import { daycareBaseInputsV1, expShopPurchasedV1 } from "./idle-ngu-actions.js";
import { externalResourceAllocation, reconcileResourceCurrents, refreshRebirthState, totalAllocated } from "./idle-ngu-ressources.js";
import { HACK_HARD_CAP_V1 } from "./idle-ngu-pistes.js";

export function defaultResource(resource = "energy") {
  const key=String(resource||"energy");
  /*
   * Norman (2026-09-18, capture d'écran "Magic Stats Breakdown" du vrai
   * NGU en direct, personnage tout neuf) : "Base Magic Cap: 0 ...
   * Total Magic Cap: 1" -- un plancher de 1, pas 100. r3 (Hacks/Wishes,
   * débloqué très tard, item "incriminatingEvidence") n'a aucune preuve
   * contraire fournie -- laissé à 100 pour ne rien casser sans preuve.
   */
  const cap = key === "energy" ? 500 : key === "magic" ? 1 : 100;
  return {
    speed: 1,
    power: 1,
    cap,
    bars: 1,
    /*
     * Norman (2026-09-15) : "dans NGU IDLE, quand on commence une
     * nouvelle partie, le compte d'énergie est à 250 et on doit générer
     * les 250 restants pour atteindre 500." Cette fonction n'alimente que
     * baseState() (la toute première création d'une partie) — jamais la
     * Renaissance, qui remet chaque ressource à 0 via sa propre logique
     * (applyRebirthResetV56_, inchangée). Un nouveau joueur démarrait
     * jusqu'ici à l'énergie PLEINE (cap), jamais à la moitié comme dans
     * le vrai NGU.
     */
    current: key === "energy" ? cap / 2 : 0,
    capNaturel: cap,
    fillProgress: 0,
    generatedThisRun: 0,
    spentExp: 0
  };
}

function baseSystemState(def) {
  return {
    id: def.id,
    unlocked: false,
    active: false,
    level: 0,
    tempLevel: 0,
    permanentLevel: 0,
    progress: 0,
    allocation: { energy: 0, magic: 0, r3: 0 },
    data: {}
  };
}

function createTrackState(def) {
  if (def.id === "ngu") return createNguDataV1();
  const tracks = IDLE_NGU_TRACKS[def.id] || [];
  if (!tracks.length) return {};
  const out = {};
  for (const track of tracks) {
    out[track.id] = { level: 0, tempLevel: 0, permanentLevel: 0, progress: 0 };
  }
  const created = {
    tracks: out,
    activeTrack: tracks[0].id
  };
  /* Wishes : un souhait et une allocation Energy/Magic/R3 par slot (le slot 1 reprend activeTrack). */
  if (def.id === "wishes") {
    created.slots = Array.from({ length: IDLE_WISH_MAX_SLOTS_V1 }, (_, i) => emptyWishSlotV1(i === 0 ? tracks[0].id : ""));
  }
  return created;
}

function emptyWishSlotV1(wish = "") {
  return { wish, allocation: { energy: 0, magic: 0, r3: 0 } };
}

/*
 * Slots de souhaits (2026-09-23). Invariants maintenus ici à chaque
 * normalisation :
 *  - data.slots : IDLE_WISH_MAX_SLOTS_V1 entrées { wish, allocation } ; un
 *    même souhait n'occupe jamais deux slots (le wiki parle de faire
 *    "more wishes simultaneously", donc des souhaits distincts) ;
 *  - data.activeTrack === slots[0].wish et system.allocation === somme des
 *    allocations des slots (totalAllocated, budgets et Rebirth continuent
 *    de lire system.allocation, comme pour les NGU).
 * Migration / compatibilité : l'ancien état (un seul souhait actif +
 * allocation partagée) devient le slot 1. Plus généralement, tout code
 * qui n'écrit que les anciens champs (activeTrack, allocation) est
 * répercuté sur le slot 1 : slot1 = total - autres slots. Si le total est
 * inférieur à la somme des autres slots, les autres slots sont vidés et
 * le slot 1 reçoit tout le total : la quantité allouée n'est jamais
 * modifiée par la normalisation (aucune ressource créée ni perdue).
 */
function normalizeWishSlotsV1(s, rawData) {
  const valid = new Set((IDLE_NGU_TRACKS.wishes || []).map(t => t.id));
  const src = rawData && typeof rawData === "object" ? rawData : {};
  const hadSlots = Array.isArray(src.slots);
  const slots = [];
  for (let i = 0; i < IDLE_WISH_MAX_SLOTS_V1; i++) {
    const raw = hadSlots ? src.slots[i] : null;
    const slot = emptyWishSlotV1();
    if (raw && typeof raw === "object") {
      const wish = String(raw.wish ?? "");
      slot.wish = valid.has(wish) ? wish : "";
      for (const k of RESOURCE_KEYS) slot.allocation[k] = Math.max(0, num(raw.allocation?.[k], 0));
    }
    slots.push(slot);
  }
  /* Slot 1 vidé volontairement : activeTrack "" n'est conservé que pour une sauvegarde déjà à slots. */
  slots[0].wish = hadSlots && src.activeTrack === "" ? "" : String(s.data.activeTrack || "");
  const seen = new Set(slots[0].wish ? [slots[0].wish] : []);
  for (let i = 1; i < slots.length; i++) {
    if (!slots[i].wish) continue;
    if (seen.has(slots[i].wish)) slots[i].wish = "";
    else seen.add(slots[i].wish);
  }
  for (const k of RESOURCE_KEYS) {
    const total = Math.max(0, num(s.allocation[k], 0));
    const others = slots.slice(1).reduce((sum, x) => sum + x.allocation[k], 0);
    if (total + 1e-9 < others) {
      for (let i = 1; i < slots.length; i++) slots[i].allocation[k] = 0;
      slots[0].allocation[k] = total;
    } else {
      slots[0].allocation[k] = Math.max(0, total - others);
    }
  }
  s.data.slots = slots;
  s.data.activeTrack = slots[0].wish;
  syncWishAllocationTotalsV1(s);
}

export function syncWishAllocationTotalsV1(s) {
  for (const k of RESOURCE_KEYS) {
    s.allocation[k] = (s.data.slots || []).reduce((sum, x) => sum + Math.max(0, num(x.allocation?.[k], 0)), 0);
  }
}

export function createAugmentationData() {
  const pairs = {};
  for (const def of IDLE_NGU_AUGMENTATIONS) {
    pairs[def.id] = {
      level: 0,
      progress: 0,
      upgradeLevel: 0,
      upgradeProgress: 0,
      energy: 0,
      upgradeEnergy: 0,
      /* Niveaux cibles (0 = aucun) : à l'atteinte, l'énergie de la piste est rendue ou, avec « Advance Energy », passée à la piste suivante. */
      target: 0,
      upgradeTarget: 0
    };
  }
  return { pairs, activePair: "scissors", trainUpgrade: false, advanceEnergy: false };
}

export function createTimeMachineData() {
  return {
    speedLevel: 0,
    speedProgress: 0,
    goldLevel: 0,
    goldProgress: 0,
    /*
     * Niveaux cibles (écran Broken Time Machine, champ « Target », 0 = désactivé) : une fois le niveau atteint, l'allocation de la piste
     * (Energy pour Machine Speed, Magic pour Gold Multiplier) est retirée automatiquement (Norman, 2026-09-25, d'après sa capture du jeu).
     */
    speedTarget: 0,
    goldTarget: 0,
    bestGoldThisRun: 0,
    highestBossEver: 0,
    producedThisRun: 0
  };
}

export function createBloodMagicData() {
  const rituals = {};
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
    rituals[ritual.id] = { level: 0, progress: 0, completions: 0, magic: 0 };
  }
  return {
    rituals,
    activeRitual: "tack",
    /*
     * Plus grand stock de Blood jamais atteint (2026-09-29, anti-spoil AGENTS.md règle n°2) : l'écran Blood Magic
     * n'affiche un sort qu'une fois son « Minimum Blood Required » (wiki, page Blood Magic) atteint. Comme chaque
     * sort dépense TOUT le Blood, il faut mémoriser ce pic pour qu'un sort découvert ne disparaisse pas après en
     * avoir lancé un autre. Survit au Rebirth (une découverte reste acquise).
     */
    bloodPeak: 0,
    spells: {
      numberBoost: 1,
      ironPill: 0,
      counterfeitGold: 1,
      counterfeitGoldBloodSpent: 0,
      bloodSpaghetti: 1,
      bloodSpaghettiBloodSpent: 0
    }
  };
}

export function createYggdrasilData() {
  return {
    fruits:Object.fromEntries(IDLE_NGU_YGG_FRUITS.map(f=>[
      f.id,
      {tier:0,active:false,growthHours:0,firstHarvestThisRun:true}
    ])),
    reserved:{energy:0,magic:0},
    runPowerAlphaValue:0,
    runPowerBetaActive:false,
    runNumbersActive:false,
    permanent:{
      adventurePower:0,
      adventureToughness:0,
      adventureHp:0,
      adventureRegen:0,
      luckDropPct:0,
      powerBetaValue:0,
      numbersValue:0,
      /* "Invisible Fruit of Power δ Level" (bonus permanent toujours actif). */
      powerDeltaValue:0
    }
  };
}

function createDiggersData() {
  return {
    slots:1,
    diggers:Object.fromEntries(IDLE_NGU_DIGGERS.map(d=>[
      d.id,
      {maxLevel:0,runLevel:0,active:false}
    ]))
  };
}

/*
 * Wandoos (2026-09-18, Norman : "il faut tout faire"). Sources : wiki NGU
 * en direct, page "Wandoos" (ngu-idle.fandom.com/wiki/Wandoos), complétée
 * par les pages "Advanced Training" et "Energy" pour la vitesse de dump.
 *
 * 3 OS réels, chacun avec sa PROPRE formule de bonus Attack/Defense
 * (section "Operating Systems") et son propre seuil Energy/Magic "pour
 * un speed-cap de 50 niveaux/seconde" par difficulté (Normal/Evil/
 * SADISTIC, valeurs littérales de la page, jamais une formule unique
 * extrapolée entre elles).
 *
 * Le "speed-cap de 50 niveaux/seconde" N'EST PAS une mécanique propre à
 * Wandoos : page "Energy", note de bas de page sur "Speed" : "Almost
 * everything in NGU operates on ticks... there are 50 ticks/updates per
 * second... the most a progress bar can gain is... 50 fills (or levels)
 * per second" — c'est le taux de tick du moteur NGU lui-même. Et la même
 * page confirme "Energy Power does not affect the speed on the Energy
 * dump, so high Energy Cap is essential" — seule la quantité ALLOUÉE
 * compte (contrairement à Augmentations/Blood Magic/Time Machine, où
 * Power intervient) : la vitesse est donc directement proportionnelle à
 * l'allocation jusqu'au seuil (aucune autre courbe n'est documentée) :
 * levels/sec = min(50, 50 * alloué / seuil).
 */
export const IDLE_WANDOOS_OS_V1 = Object.freeze({
  "98": {
    name: "Wandoos 98",
    requirement: { normal: 1e9, difficile: 1e21, extreme: 1e33 },
    statBonus: (e, m) => Math.pow((1 + e / 100) * (1 + m / 25), 0.8)
  },
  meh: {
    name: "Wandoos MEH",
    requirement: { normal: 1e12, difficile: 1e27, extreme: 1e39 },
    statBonus: (e, m) => (1 + e / 5) * (1 + m * 2)
  },
  xl: {
    name: "Wandoos XL",
    requirement: { normal: 1e15, difficile: 1e33, extreme: 1e45 },
    statBonus: (e, m) => Math.pow((1 + e * 6) * (1 + m * 40), 1.05)
  }
});

/*
 * Niveau d'OS total (0-400, wiki section "Leveling up the OS") : "+4%
 * level 0, +8% at level 1... maximum level 400, giving +1604% speed" —
 * vérifié : 1+(400+1)*0.04 = 17.04, soit +1604% (multiplicateur total
 * 17.04, "bonus" = 1604 points de %). Formule : 1+(niveau+1)*0.04.
 *
 * Les 4 sources qui alimentent ce niveau total (Wandoos 98/XL consommés,
 * Money Pit, ITOPOD) sont plafonnées à 100 chacune côté wiki. Sources
 * câblées : ITOPOD (perk 22 "Wandoos Lover"), Money Pit (tossMoneyPit) et,
 * depuis le 2026-09-23, la consommation des copies "A busted copy of
 * Wandoos 98/XL" (action méta consumeWandoosCopy, idle-wandoos-os-v1.js).
 */
export function createWandoosData() {
  return {
    os: "98",
    dumpEnergyLevel: 0,
    dumpMagicLevel: 0,
    dumpEnergyProgress: 0,
    dumpMagicProgress: 0,
    osLevels: { moneyPit: 0, consumed98: 0, consumedXl: 0 }
  };
}

function wandoosOsLevelSpeedMultiplierV1(totalOsLevel) {
  const level = Math.max(0, Math.min(400, num(totalOsLevel, 0)));
  /*
   * 2026-09-23 (audit, page Wandoos) : « +4 % au niveau 0, +8 % au niveau 1 ... est trompeur : cela
   * équivaut à 100 % au niveau 0, 200 % au niveau 1 (le temps de remplissage est divisé par deux),
   * jusqu'à 401 fois plus rapide au niveau 400 » -> multiplicateur = niveau + 1.
   */
  return level + 1;
}

/*
 * Boot-up (wiki, section "Boot-up") : "1-hour boot-up process... linear,
 * and ranges from 0-100% speed." Réduit par le set Wandoos XL (-10 %,
 * SETS_OBJETS_V1.wandoosXl, câblé 2026-09-23) et par les défis "100 Levels"
 * complétés EN EVIL (-10% chacun, jusqu'à 5, plancher 27 minutes avec les
 * deux réductions). SOREAL ne distingue pas la difficulté au moment où un
 * défi "100 Levels" a été complété (state.challenge.completions.hundredLevels
 * est un compteur global) : la réduction ci-dessous utilise ce compteur
 * tel quel, un léger sur-crédit possible si des complétions ont eu lieu
 * en Normal — documenté honnêtement, jamais un chiffre inventé. Le set XL
 * multiplie le tout par 0,9 (plancher réel de 27 min = 60 x 0,9 x 0,5).
 */
function wandoosBootFractionV1(state, now, seconds = 0) {
  const hundredLevelsCount = Math.max(0, Math.min(5, int(state.challenge?.completionsTier?.difficile?.hundredLevels, 0)));
  /* Wandoos XL (set) : x0,9 sur la durée du boot (idle-wandoos-os-v1.js), cumulé multiplicativement avec les défis. */
  const bootSeconds = Math.max(1, 3600 * (1 - 0.10 * hundredLevelsCount) * idleWandoosBootMultiplierV1(state));
  const end = Math.max(0, (nowMs(now) - Math.max(0, num(state.runStartedAt, 0))) / 1000);
  const span = Math.max(0, Math.min(end, num(seconds, 0)));
  if (span <= 1e-9) {
    const f = clamp(end / bootSeconds, 0, 1);
    return { fraction: f, afterBootShare: end >= bootSeconds ? 1 : 0, bootSeconds, elapsed: end };
  }
  /*
   * 2026-09-24 (audit, page Wandoos, Boot-up : « The speed increase is linear, and ranges from 0-100% speed »)
   * : une fenêtre de temps simulée d'un seul bloc (hors ligne, jusqu'à 30 jours) était multipliée par la
   * vitesse de la FIN de fenêtre. On utilise la vitesse moyenne de la rampe linéaire sur la fenêtre, et la
   * part de la fenêtre écoulée après le boot pour le +10 % du set Wandoos.
   */
  const start = end - span;
  const rampEnd = Math.min(end, bootSeconds);
  const rampStart = Math.min(start, bootSeconds);
  const rampIntegral = (rampEnd * rampEnd - rampStart * rampStart) / (2 * bootSeconds);
  const afterBoot = Math.max(0, end - Math.max(start, bootSeconds));
  return { fraction: clamp((rampIntegral + afterBoot) / span, 0, 1), afterBootShare: afterBoot / span, bootSeconds, elapsed: end };
}

/* Vitesses de Dump (niveaux/s) de l'OS actif, à l'instant `now` ; `seconds` = fenêtre simulée (0 = instantané, pour l'affichage). Mêmes formules que advanceWandoos. */
export function wandoosCalculVitessesV1(state, seconds, now) {
  const s = state.systems.wandoos;
  if (!s?.unlocked) return null;
  const osId = IDLE_WANDOOS_OS_V1[s.data.os] ? s.data.os : "98";
  const os = IDLE_WANDOOS_OS_V1[osId];
  const requirement = os.requirement[state.difficulty] || os.requirement.normal;

  const perkBonuses = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses = quirkBonusesV1(idleQuirkNiveauxV1(state));
  const totalOsLevel = Math.min(400,
    Math.max(0, perkBonuses.wandoosOsLevelBonus) +
    /* Souhait 4 « I wish money Pit didn't suck » : « Also maxes your money pit Wandoos level » (page Wishes / Money Pit : 100). */
    (wishLevelV1(state, 4) >= 1 ? 100 : Math.max(0, num(s.data.osLevels?.moneyPit, 0))) +
    Math.max(0, num(s.data.osLevels?.consumed98, 0)) +
    Math.max(0, num(s.data.osLevels?.consumedXl, 0))
  );
  const osLevelMultiplier = wandoosOsLevelSpeedMultiplierV1(totalOsLevel);
  const boot = wandoosBootFractionV1(state, now, seconds);
  const bootFraction = boot.fraction;
  const beardWandoos = beardBonusMultiplier(state, "wandoos");
  const diggerWandoos = diggerBonuses(state).wandoos;
  const challengeWandoos = challengePermanentBonuses(state).wandoosSpeedChallengeMultiplier;
  /*
   * "Wandoos Energy/Magic Dump+" (Advanced Training, wiki page "Advanced
   * Training") : "+1% per level" à la vitesse de dump — déjà des pistes
   * réelles chez SOREAL (IDLE_NGU_TRACKS.advancedTraining "wandoosEnergy"/
   * "wandoosMagic"), jamais lues par Wandoos jusqu'ici.
   */
  const atEnergyDumpMultiplier = 1 + atLevelV1(state, "wandoosEnergy") * 0.01;
  const atMagicDumpMultiplier = 1 + atLevelV1(state, "wandoosMagic") * 0.01;
  /*
   * "Energy/Magic Wandoos BEAST-a" (Quirks 15/16, wiki page "Wandoos") :
   * +2%/niveau chacun, Energy et Magic séparément.
   */
  const quirkEnergyMultiplier = 1 + Math.max(0, num(quirkBonuses.wandoosEnergySpeedPct, 0));
  const quirkMagicMultiplier = 1 + Math.max(0, num(quirkBonuses.wandoosMagicSpeedPct, 0));

  const energyAlloc = Math.max(0, num(s.allocation.energy, 0));
  const magicAlloc = Math.max(0, num(s.allocation.magic, 0));
  /* NGU "Wandoos" (Energy) : "Wandoos speed", audit NGU 2026-09-23. */
  const nguWandoosMultiplier = nguFxV1(state).wandoosSpeed * gearPctV1(gearSpecialsV1(state), "wandoosSpeedPct");
  /*
   * Wandoos (set) (wiki "Wandoos" > Boot-up : "After booting-up, it gains a 10% speed boost by
   * maxing the Wandoos set") : +10 % uniquement une fois le boot terminé (bootFraction = 1).
   */
  const wandoosSetMultiplier = 1 + Math.max(0, num(state.adventure?.setRewards?.wandoosBootedSpeedPct, 0)) * boot.afterBootShare;

  /* Plafond de 50 niveaux/s (1 niveau par tick) appliqué APRÈS tous les multiplicateurs. */
  const energySpeed = Math.min(50, (50 * energyAlloc / requirement)
    * idleCardsMultiplierV1(state, "wandoos") /* Cards WANDOOS */
    * osLevelMultiplier * bootFraction * beardWandoos * diggerWandoos * challengeWandoos
    * atEnergyDumpMultiplier * quirkEnergyMultiplier * nguWandoosMultiplier * wandoosSetMultiplier
    * macguffinEffectMultiplierV1(state, "energyWandoos"));
  const magicSpeed = Math.min(50, (50 * magicAlloc / requirement)
    * idleCardsMultiplierV1(state, "wandoos") /* Cards WANDOOS */
    * osLevelMultiplier * bootFraction * beardWandoos * diggerWandoos * challengeWandoos
    * atMagicDumpMultiplier * quirkMagicMultiplier * nguWandoosMultiplier * wandoosSetMultiplier
    * macguffinEffectMultiplierV1(state, "magicWandoos"));

  return { s, osId, os, requirement, totalOsLevel, osLevelMultiplier, boot, energySpeed, magicSpeed, energyAlloc, magicAlloc };
}

export function advanceWandoos(state, seconds, context, now) {
  const s = state.systems.wandoos;
  if (!s?.unlocked || seconds <= 0) return;
  const { energySpeed, magicSpeed } = wandoosCalculVitessesV1(state, seconds, now);
  s.data.dumpEnergyProgress = Math.max(0, num(s.data.dumpEnergyProgress, 0)) + energySpeed * seconds;
  s.data.dumpMagicProgress = Math.max(0, num(s.data.dumpMagicProgress, 0)) + magicSpeed * seconds;
  let energyGain = Math.floor(s.data.dumpEnergyProgress);
  let magicGain = Math.floor(s.data.dumpMagicProgress);
  /*
   * Défi "100 Levels" (wiki, page Challenges) : pool combiné de 100
   * niveaux partagé entre Augments/Blood Magic/Time Machine/Wandoos —
   * même plafond déjà appliqué aux 3 autres systèmes ci-dessus,
   * jusqu'ici jamais appliqué à Wandoos spécifiquement malgré son
   * inclusion documentée dans ce pool.
   */
  if (energyGain + magicGain > 0) {
    const remaining = challengeHundredLevelsRemaining(state);
    if (energyGain + magicGain > remaining) {
      const total = energyGain + magicGain;
      energyGain = Math.floor(energyGain * remaining / total);
      magicGain = Math.floor(magicGain * remaining / total);
    }
    if (energyGain > 0) {
      s.data.dumpEnergyProgress -= energyGain;
      s.data.dumpEnergyLevel = Math.max(0, num(s.data.dumpEnergyLevel, 0)) + energyGain;
    }
    if (magicGain > 0) {
      s.data.dumpMagicProgress -= magicGain;
      s.data.dumpMagicLevel = Math.max(0, num(s.data.dumpMagicLevel, 0)) + magicGain;
    }
    if (energyGain + magicGain > 0) challengeHundredLevelsConsume(state, energyGain + magicGain);
  }

  s.level = s.data.dumpEnergyLevel + s.data.dumpMagicLevel;
  s.tempLevel = s.level;
}

/*
 * Multiplicateur Attack/Defense de l'OS Wandoos actif, à partir des
 * niveaux de Dump Energy/Magic courants (wiki, section "Operating
 * Systems", formule par OS). Retourne 1 si Wandoos n'est pas débloqué ou
 * si aucun Dump n'a encore de niveau — jamais de bonus fantôme.
 */
export function wandoosCombatMultiplierV1(state) {
  const s = state.systems.wandoos;
  if (!s?.unlocked) return 1;
  /* Gros troll « Wandoos just blue-screened » : plus de bonus Wandoos jusqu'au Rebirth. */
  if (trollFlagsV1(state).wandoos) return 1;
  const osId = IDLE_WANDOOS_OS_V1[s.data?.os] ? s.data.os : "98";
  const os = IDLE_WANDOOS_OS_V1[osId];
  const e = Math.max(0, num(s.data?.dumpEnergyLevel, 0));
  const m = Math.max(0, num(s.data?.dumpMagicLevel, 0));
  return Math.max(1, os.statBonus(e, m));
}

function createRebirthState(now) {
  return {
    number: 1,
    nextNumber: 1,
    lastNumber: 1,
    lastBosses: 0,
    lastRunSeconds: 0,
    /* Sang dépensé dans le sort « Number » pendant la partie précédente (page Renaissance, Norman 2026-10-15) */
    lastBlood: 0,
    hasPreviousRun: false,
    minimumRebirthSeconds: MIN_REBIRTH_SECONDS,
    canRebirth: false,
    preview: {},
    updatedAt: now
  };
}

function baseState(now) {
  const systems = {};
  for (const def of IDLE_NGU_SYSTEMS) {
    const s = baseSystemState(def);
    s.data = createTrackState(def);
    if (def.id === "augmentations") s.data = createAugmentationData();
    if (def.id === "timeMachine") s.data = createTimeMachineData();
    if (def.id === "bloodMagic") s.data = createBloodMagicData();
    if (def.id === "yggdrasil") s.data = createYggdrasilData();
    if (def.id === "diggers") s.data = createDiggersData();
    if (def.id === "wandoos") s.data = createWandoosData();
    if (def.id === "macguffins") s.data = createMacguffinDataV1();
    if (def.id === "moneyPit") s.data = { tossesThisRun: 0, nextAt: 0, lastTossAt: 0, totalGoldTossed: 0, history: [] };
    if (def.id === "dailySpin") s.data = { readyAt: 0, totalSpins: 0, history: [] };
    if (def.id === "titans") s.data = { nextAt: 0, kills: 0, firstTitanDefeated: false };
    if (def.id === "cooking") s.data = createIdleCookingDataV1();
    if (def.id === "cards") s.data = createIdleCardsDataV1();
    systems[def.id] = s;
  }

  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    resourceModelVersion: 52,
    updatedAt: now,
    runStartedAt: now,
    difficulty: "normal",
    difficultyPeaks: { normal: 0, difficile: 0, extreme: 0 },
    adventure: createIdleAdventureStateV47(),
    resources: {
      energy: defaultResource("energy"),
      magic: defaultResource("magic"),
      r3: defaultResource("r3")
    },
    currencies: {
      experience: 0,
      pp: 0,
      qp: 0,
      gold: 0,
      blood: 0,
      seeds: 0,
      mayo: 0,
      ap: 0
    },
    records: {
      highestBoss: 0,
      highestZone: 1,
      setsCompleted: 0,
      totalRebirths: 0,
      highestGoldDrop: 0,
      /*
       * Classement des joueurs (2026-09-25) : meilleur NUMBER obtenu à un Rebirth, EXP totale GAGNÉE (jamais diminuée par les achats), temps de jeu
       * cumulé (secondes simulées, hors ligne compris) ; expLastSeen = dernière EXP observée, sert à repérer les gains entre deux normalisations.
       */
      bestNumber: 0,
      totalExpEarned: 0,
      expLastSeen: -1,
      playSeconds: 0,
      /* Secret de Rebirth "3 fois de suite < 30 min avec boss 37" (page Rebirths) : série en cours, bonus versé (0/1). */
      speedrunStreak: 0,
      speedrunBonusClaimed: 0,
      /* Secret « coin en bas à droite de l'Entraînement avancé » (0/1) : posé par l'action cornerClick. */
      cornerClicked: 0,
      /* Portrait de joueur choisi (idle-portraits-v1.js) et « Special Prize » de 50 000 AP (0/1). */
      portrait: "default",
      specialPrizeClaimed: 0,
      /* Choix du Special Prize : 0 aucun, 1 = 50 000 AP, 2 = joli chaton (il donne aussi les AP). Nombre : les records sont coercés en compteurs. */
      specialPrizeChoice: 0,
      // Money Pit, « One-Time Bonuses » déjà versés (masque de bits, 2026-09-24).
      moneyPitOneTimeMask: 0,
      // Newbie Offers achetées (IDLE_NGU_NEWBIE_OFFERS) : permanent, jamais
      // vidé par applyRebirthResetV56_, exactement comme les autres champs
      // de records ci-dessus (highestBoss, totalRebirths...).
      newbieOffersUsed: []
    },
    rebirth: createRebirthState(now),
    systems,
    challenge: {
      active: "",
      activeTier: "normal",
      completionsTier: createChallengeTiersV1(),
      completions: Object.fromEntries(IDLE_NGU_NORMAL_CHALLENGES.map(def=>[def.id,0])),
      startedAt: 0,
      bestMs: {},
      hundredLevelsGained: 0,
      troll: createTrollStateV1()
    },
    bank: {
      advancedTraining: 0,
      /* 2026-09-24 : niveaux d'Advanced Training retenus par piste, versés quand le Basic Training est complété. */
      timeMachineSpeed: 0,
      timeMachineGold: 0,
      beards: 0
    },
    /*
     * 4G's Sellout Shop (audit 2026-09-13) — achats permanents, jamais
     * réinitialisés par un Rebirth (comme l'AP elle-même, confirmée
     * persistante au Rebirth par le wiki NGU, page Rebirths).
     */
    selloutEffects: { remaining: {}, beta: {}, bluePills: 0 },
    selloutShop: {
      purchases: {}
    },
    /* Resource 3 Name Randomizer (Boutique AP) : réglage du joueur, nom courant et run pour lequel il a été tiré. */
    r3Nom: { actif: false, nom: "", run: 0 },
    bonuses: {
      /* Bonus accumulés des cartes lancées, en % par type (idle-cards-v1.js) ; conservés au Rebirth. */
      cards: createIdleCardBonusesV1(),
      ironPill: 0,
      cubePower: 0,
      cubeToughness: 0,
      cookingExp: 0,
      /*
       * "Rich Jerks" (2026-09-18, Norman : "il faut tout faire", fidélité
       * Evil/Sadistic). Wiki NGU local, page "Experience", section "Spend
       * Experience" > "Misc", tableau "Attack Boosts For Rich Jerks" :
       * Cost=30 EXP par niveau (plat, aucune formule de croissance du coût
       * publiée -- contrairement à d'autres achats de cette page qui
       * documentent un plafond, celui-ci n'en a aucun), Growth=+10% par
       * niveau, séparément pour Attack et Defense. Persistant au Rebirth
       * comme le reste de ce sac `bonuses` (EXP elle-même ne se remet
       * jamais à 0, cf. applyRebirthResetV56_ : seuls gold/blood le sont).
       */
      richJerksAttackLevel: 0,
      richJerksDefenseLevel: 0,
      /* Spend EXP > Adventure / Misc (2026-09-23) : compteurs d'achats. */
      expShop: {}
    }
  };
}

/*
 * Coût/effet "Rich Jerks" -- voir le commentaire ci-dessus sur
 * state.bonuses.richJerksAttackLevel/richJerksDefenseLevel pour la source
 * wiki. Exportées pour que le snapshot client puisse afficher le prochain
 * coût sans dupliquer la constante.
 */
export const RICH_JERKS_COST_EXP_V1 = 30;

export const RICH_JERKS_PCT_PER_LEVEL_V1 = 10;

/*
 * Ralentissements Evil/Sadistic (2026-09-18, Norman : "il faut tout
 * faire"). Wiki NGU local, pages "Evil difficulty" et "SADISTIC
 * difficulty", section "Differences" > "Features level slower"/
 * "Features" : Augmentations, Time Machine et Blood Magic ont chacun un
 * diviseur de vitesse UNIFORME (pas cumulatif -- la valeur Sadistic est
 * déjà le total face à Normal, pas un multiplicateur additionnel sur la
 * valeur Evil) :
 *   - Augmentations : Evil 2.5 trillion (2.5e12) / Sadistic 2.5 octillion
 *     (2.5e27, soit x1e15 la valeur Evil, colonne "Relative to Evil").
 *   - Time Machine : Evil 1 trillion (1e12) / Sadistic 1 septillion
 *     (1e24, soit x1e12 la valeur Evil).
 *   - Blood Magic : Evil 1 billion (1e9) / Sadistic 10 sextillion (1e22,
 *     soit x1e13 la valeur Evil).
 * Wandoos a également un diviseur documenté (gap OS x1e6 en Evil,
 * x1e12 supplémentaire en Sadistic) mais AUCUNE mécanique Wandoos
 * (OS/Energy-Magic Dump) n'existe encore dans ce moteur -- rien à
 * diviser tant que ce système n'est pas construit, volontairement non
 * traité ici plutôt que d'inventer un point d'ancrage.
 */
const IDLE_DIFFICULTY_SPEED_DIVIDERS_V1 = Object.freeze({
  augmentations: { difficile: 2.5e12, extreme: 2.5e27 },
  timeMachine: { difficile: 1e12, extreme: 1e24 },
  bloodMagic: { difficile: 1e9, extreme: 1e22 }
});

export function idleNguDifficultySpeedDividerV1(state, system) {
  const tiers = IDLE_DIFFICULTY_SPEED_DIVIDERS_V1[system];
  if (!tiers) return 1;
  return num(tiers[state?.difficulty], 1) || 1;
}

export function unlockSatisfied(def, ctx, state) {
  const u = def.unlock || {};
  if (num(ctx.bosses, 0) < num(u.bosses, 0)) return false;
  if (num(ctx.rebirths, 0) < num(u.rebirths, 0)) return false;
  if (num(ctx.sets, 0) < num(u.sets, 0)) return false;
  if (u.basicTrainingComplete && !ctx.basicTrainingComplete) return false;
  if (u.gold && num(state.currencies.gold, 0) < num(u.gold, 0) && num(ctx.gold, 0) < num(u.gold, 0)) return false;
  if (u.system && !state.systems[u.system]?.unlocked) return false;
  if (u.item) {
    const itemFlags = Object.assign(
      {},
      state.adventure?.unlockItems || {},
      ctx.unlockItems || {}
    );
    const consumedMap = {
      aNumber: "ngu",
      giantSeed: "yggdrasil",
      scrapPaper: "diggers",
      uugHair: "beards",
      pissedOffKey: "tower",
      wandoos98: "wandoos"
    };
    const consumedFlag = consumedMap[u.item] || "";
    // NGU consumables unlock their system only after being used. Merely
    // obtaining A Number / Giant Seed / Scrap Paper / etc. is not enough.
    if (consumedFlag) {
      const consumed = Boolean(
        state.adventure?.unlockFlags?.[consumedFlag] ||
        ctx.unlockFlags?.[consumedFlag]
      );
      if (!consumed) return false;
    } else if (!itemFlags[u.item]) {
      return false;
    }
  }
  if (u.flag && !(ctx.unlockFlags?.[u.flag] || state.adventure?.unlockFlags?.[u.flag])) return false;
  return true;
}

function normalizeResource(raw, resource = "energy") {
  const fallback=defaultResource(resource);
  const src = raw && typeof raw === "object" ? raw : {};
  const cap=clamp(num(src.cap, fallback.cap), resource === "energy" ? 500 : 100, 9e18);
  return {
    speed: clamp(num(src.speed, fallback.speed), 0.1, 50),
    power: clamp(num(src.power, fallback.power), 1, 1e18),
    cap,
    /* Part « naturelle » du cap (500 de base + 1 par 20 d'énergie obtenue à chaque Rebirth, jusqu'à 100 000) : les caps ACHETÉS en EXP s'ajoutent par-dessus sans la consommer (Norman, 2026-10-03). Sauvegarde ancienne : tout le cap existant est compté comme naturel. */
    capNaturel: clamp(num(src.capNaturel, cap), 0, cap),
    bars: clamp(num(src.bars, fallback.bars), 1, 1e18),
    /*
     * Plafond de l'énergie LIBRE = plafond EFFECTIF (bonus d'atouts, de manies, de souhaits et d'équipement compris), que cette fonction ne connaît pas : l'ancien plafonnement au seul `cap` enregistré ramenait l'énergie à ce plafond de base
     * à CHAQUE opération (Norman, 2026-10-05 : « la génération d'énergie bloque, tourne en rond » : énergie libre bloquée à 500 000 alors que le plafond effectif était 562 118). Le vrai plafond est appliqué par reconcileResourceCurrents
     * (plafond effectif moins ce qui est alloué), à chaque avancée du temps.
     */
    current: clamp(num(src.current, fallback.current), 0, 9e18),
    fillProgress: clamp(num(src.fillProgress, 0), 0, 0.999999999999),
    generatedThisRun: Math.max(0, num(src.generatedThisRun, 0)),
    spentExp: Math.max(0, num(src.spentExp, fallback.spentExp))
  };
}

function normalizeTracks(def, rawData) {
  const created = createTrackState(def);
  if (!created.tracks) return rawData && typeof rawData === "object" ? clone(rawData) : {};
  const source = rawData && typeof rawData === "object" ? rawData : {};
  const out = createTrackState(def);
  for (const track of IDLE_NGU_TRACKS[def.id] || []) {
    const src = source.tracks?.[track.id] || {};
    out.tracks[track.id] = {
      level: Math.max(0, num(src.level, 0)),
      tempLevel: Math.max(0, num(src.tempLevel, 0)),
      permanentLevel: Math.max(0, num(src.permanentLevel, 0)),
      progress: Math.max(0, num(src.progress, 0))
    };
    /* Advanced Training : énergie propre et Target de chaque compétence (voir advanceAdvancedTrainingV1). */
    if (def.id === "advancedTraining") {
      out.tracks[track.id].energy = Math.max(0, num(src.energy, 0));
      out.tracks[track.id].target = Math.max(0, Math.floor(num(src.target, 0)));
    }
  }
  if (def.id === "advancedTraining") out.advanceEnergy = Boolean(source.advanceEnergy);
  if ((IDLE_NGU_TRACKS[def.id] || []).some(t => t.id === source.activeTrack)) {
    out.activeTrack = source.activeTrack;
  }
  if (def.id === "beards") {
    /* 2026-09-23 : plusieurs Beards actives en même temps (une par slot). Ancien état : activeTrack seul. */
    const valid = new Set((IDLE_NGU_TRACKS.beards || []).map(t => t.id));
    const list = Array.isArray(source.activeTracks) ? source.activeTracks.filter(id => valid.has(id)) : (out.activeTrack ? [out.activeTrack] : []);
    out.activeTracks = Array.from(new Set(list));
  }
  return out;
}

function normalizeSystem(def, raw) {
  const s = baseSystemState(def);
  const src = raw && typeof raw === "object" ? raw : {};
  s.unlocked = Boolean(src.unlocked);
  s.active = Boolean(src.active);
  s.level = Math.max(0, num(src.level, 0));
  s.tempLevel = Math.max(0, num(src.tempLevel, 0));
  s.permanentLevel = Math.max(0, num(src.permanentLevel, 0));
  s.progress = Math.max(0, num(src.progress, 0));
  s.allocation = Object.assign({ energy: 0, magic: 0, r3: 0 }, src.allocation || {});
  for (const key of RESOURCE_KEYS) s.allocation[key] = Math.max(0, num(s.allocation[key], 0));

  if (def.id === "augmentations") {
    s.data = createAugmentationData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    for (const aug of IDLE_NGU_AUGMENTATIONS) {
      const a = data.pairs?.[aug.id] || {};
      s.data.pairs[aug.id] = {
        level: Math.max(0, int(a.level, 0)),
        progress: Math.max(0, num(a.progress, 0)),
        progressRef: Math.max(0, num(a.progressRef, 0)),
        upgradeLevel: Math.max(0, int(a.upgradeLevel, 0)),
        upgradeProgress: Math.max(0, num(a.upgradeProgress, 0)),
        upgradeProgressRef: Math.max(0, num(a.upgradeProgressRef, 0)),
        energy: Math.max(0, num(a.energy, 0)),
        upgradeEnergy: Math.max(0, num(a.upgradeEnergy, 0)),
        target: clamp(Math.floor(num(a.target, 0)), 0, 1e9),
        upgradeTarget: clamp(Math.floor(num(a.upgradeTarget, 0)), 0, 1e9)
      };
    }
    s.data.advanceEnergy = Boolean(data.advanceEnergy);
    if (IDLE_NGU_AUGMENTATIONS.some(a => a.id === data.activePair)) s.data.activePair = data.activePair;
    s.data.trainUpgrade = Boolean(data.trainUpgrade);
  } else if (def.id === "timeMachine") {
    s.data = Object.assign(createTimeMachineData(), src.data || {});
    for (const key of ["speedLevel", "speedProgress", "speedProgressRef", "goldLevel", "goldProgress", "goldProgressRef", "speedTarget", "goldTarget", "bestGoldThisRun", "highestBossEver", "producedThisRun"]) {
      s.data[key] = Math.max(0, num(s.data[key], 0));
    }
    s.data.speedTarget = Math.floor(s.data.speedTarget);
    s.data.goldTarget = Math.floor(s.data.goldTarget);
  } else if (def.id === "bloodMagic") {
    s.data = createBloodMagicData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
      const r = data.rituals?.[ritual.id] || {};
      s.data.rituals[ritual.id] = {
        level: Math.max(0, int(r.level, 0)),
        progress: Math.max(0, num(r.progress, 0)),
        progressRef: Math.max(0, num(r.progressRef, 0)),
        completions: Math.max(0, int(r.completions, 0)),
        magic: Math.max(0, num(r.magic, 0))
      };
    }
    if (IDLE_NGU_BLOOD_RITUALS.some(r => r.id === data.activeRitual)) s.data.activeRitual = data.activeRitual;
    s.data.spells = Object.assign(createBloodMagicData().spells, data.spells || {});
    s.data.bloodPeak = Math.max(0, num(data.bloodPeak, 0));
  } else if (def.id === "yggdrasil") {
    s.data = createYggdrasilData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    for (const fruit of IDLE_NGU_YGG_FRUITS) {
      const rawFruit = data.fruits?.[fruit.id] || {};
      s.data.fruits[fruit.id] = {
        tier:clamp(int(rawFruit.tier,0),0,24),
        active:Boolean(rawFruit.active),
        growthHours:Math.max(0,num(rawFruit.growthHours,0)),
        firstHarvestThisRun:rawFruit.firstHarvestThisRun !== false
      };
    }
    s.data.reserved = {
      energy:Math.max(0,num(data.reserved?.energy,0)),
      magic:Math.max(0,num(data.reserved?.magic,0))
    };
    s.data.runPowerAlphaValue=Math.max(0,num(data.runPowerAlphaValue,0));
    s.data.runPowerBetaActive=Boolean(data.runPowerBetaActive);
    s.data.runNumbersActive=Boolean(data.runNumbersActive);
    s.data.permanent=Object.assign(createYggdrasilData().permanent,data.permanent||{});
    for(const k of Object.keys(s.data.permanent))s.data.permanent[k]=Math.max(0,num(s.data.permanent[k],0));
  } else if (def.id === "diggers") {
    s.data = createDiggersData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data.slots=Math.max(1,int(data.slots,1));
    for(const defDigger of IDLE_NGU_DIGGERS){
      const rawDigger=data.diggers?.[defDigger.id]||{};
      s.data.diggers[defDigger.id]={
        maxLevel:clamp(int(rawDigger.maxLevel,0),0,defDigger.cap),
        runLevel:clamp(int(rawDigger.runLevel,0),0,defDigger.cap),
        active:Boolean(rawDigger.active)
      };
      s.data.diggers[defDigger.id].runLevel=Math.min(
        s.data.diggers[defDigger.id].runLevel,
        s.data.diggers[defDigger.id].maxLevel
      );
    }
  } else if (def.id === "moneyPit") {
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data = {
      tossesThisRun: Math.max(0, int(data.tossesThisRun, 0)),
      nextAt: Math.max(0, num(data.nextAt, 0)),
      lastTossAt: Math.max(0, num(data.lastTossAt, 0)),
      totalGoldTossed: Math.max(0, num(data.totalGoldTossed, 0)),
      history:Array.isArray(data.history)
        ?data.history.slice(0,IDLE_MONEY_PIT_HISTORIQUE_MAX_V1).map(entry=>({
            at:Math.max(0,num(entry?.at,0)),
            cost:Math.max(0,num(entry?.cost,0)),
            tier:Math.max(0,int(entry?.tier,0)),
            reward:entry?.reward&&typeof entry.reward==="object"
              ?clone(entry.reward)
              :{},
            boost:entry?.boost&&typeof entry.boost==="object"
              ?clone(entry.boost)
              :null
          }))
        :[]
    };
    s.data.rewardsTotal = moneyPitTotauxNormalisesV1(data.rewardsTotal, s.data.history);
  } else if (def.id === "dailySpin") {
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data = {
      readyAt: Math.max(0, num(data.readyAt, 0)),
      totalSpins: Math.max(0, int(data.totalSpins, s.level)),
      history:Array.isArray(data.history)
        ?data.history.slice(0,IDLE_MONEY_PIT_HISTORIQUE_MAX_V1).map(entry=>({
            at:Math.max(0,num(entry?.at,0)),
            tier:Math.max(0,int(entry?.tier,0)),
            reward:entry?.reward&&typeof entry.reward==="object"
              ?clone(entry.reward)
              :{},
            totalSpins:Math.max(0,int(entry?.totalSpins,0))
          }))
        :[]
    };
    s.data.rewardsTotal = roueTotauxNormalisesV1(data.rewardsTotal, s.data.history);
  } else if (def.id === "perks") {
    /*
     * Real per-perk levels (IDLE_PERKS_CATALOG_V1), keyed by numeric id —
     * replaces the previous single shared counter. s.level is kept as the
     * SUM of purchased levels across every perk, purely for back-compat
     * with anything still reading the generic system.level field (e.g.
     * unlock checks, legacy save display) — buyPerkV1 is the only writer
     * of s.data.levels itself.
     */
    const rawLevels = src.data && typeof src.data === "object" ? src.data.levels : null;
    const levels = {};
    for (const perk of IDLE_PERKS_CATALOG_V1) {
      const v = Math.max(0, Math.min(perk.cap, int(rawLevels?.[perk.id], 0)));
      if (v > 0) levels[perk.id] = v;
    }
    s.data = { levels };
    s.level = Object.values(levels).reduce((sum, v) => sum + v, 0);
  } else if (def.id === "wandoos") {
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data = createWandoosData();
    s.data.os = ["98", "meh", "xl"].includes(data.os) ? data.os : "98";
    s.data.dumpEnergyLevel = Math.max(0, num(data.dumpEnergyLevel, 0));
    s.data.dumpMagicLevel = Math.max(0, num(data.dumpMagicLevel, 0));
    s.data.dumpEnergyProgress = Math.max(0, num(data.dumpEnergyProgress, 0));
    s.data.dumpMagicProgress = Math.max(0, num(data.dumpMagicProgress, 0));
    s.data.osLevels = {
      moneyPit: Math.max(0, Math.min(100, num(data.osLevels?.moneyPit, 0))),
      consumed98: Math.max(0, Math.min(100, num(data.osLevels?.consumed98, 0))),
      consumedXl: Math.max(0, Math.min(100, num(data.osLevels?.consumedXl, 0)))
    };
    s.level = s.data.dumpEnergyLevel + s.data.dumpMagicLevel;
    s.tempLevel = s.level;
  } else if (def.id === "ngu") {
    s.data = normalizeNguDataV1(src.data);
    syncNguAllocationTotalsV1(s);
  } else if (def.id === "cooking") {
    s.data = normalizeIdleCookingDataV1(src.data);
  } else if (def.id === "macguffins") {
    s.data = normalizeMacguffinDataV1(src.data);
  } else if (def.id === "cards") {
    s.data = normalizeIdleCardsDataV1(src.data);
  } else if (def.id === "achievements") {
    s.data = normalizeIdleAchievementsDataV1(src.data);
  } else if ((IDLE_NGU_TRACKS[def.id] || []).length) {
    s.data = normalizeTracks(def, src.data);
    if (def.id === "wishes") normalizeWishSlotsV1(s, src.data);
  } else {
    s.data = src.data && typeof src.data === "object" ? clone(src.data) : {};
  }

  return s;
}

function migrateLegacyTrackV47_(target, raw) {
  if (!target || !raw || typeof raw !== "object") return;
  target.level = Math.max(0, num(raw.level, target.level || 0));
  target.tempLevel = Math.max(0, num(raw.tempLevel, target.tempLevel || 0));
  target.permanentLevel = Math.max(0, num(raw.permanentLevel, target.permanentLevel || 0));
  target.progress = Math.max(0, num(raw.progress, target.progress || 0));
}

function legacyRunLevelsV47_(rawSystem) {
  const s = rawSystem && typeof rawSystem === "object" ? rawSystem : {};
  const tracks = s.data && s.data.tracks && typeof s.data.tracks === "object"
    ? Object.values(s.data.tracks)
    : [];
  const fromTracks = tracks.reduce(
    (sum, track) => sum + Math.max(0, num(track?.tempLevel, 0)) + Math.max(0, num(track?.level, 0)),
    0
  );
  return Math.max(0, fromTracks, num(s.tempLevel, 0), num(s.level, 0));
}

function migrateLegacyMetaToV47(raw, now) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? clone(raw) : {};
  const state = baseState(now);
  if (!Object.keys(src).length) return state;

  state.updatedAt = Math.max(0, num(src.updatedAt, now));
  state.runStartedAt = Math.max(0, num(src.runStartedAt, now));
  state.difficulty = ["normal", "difficile", "extreme"].includes(src.difficulty) ? src.difficulty : "normal";
  state.difficultyPeaks = Object.assign(state.difficultyPeaks, src.difficultyPeaks || {});

  state.resources = {
    energy: normalizeResource(src.resources?.energy,"energy"),
    magic: normalizeResource(src.resources?.magic,"magic"),
    r3: normalizeResource(src.resources?.r3,"r3")
  };

  state.currencies = Object.assign(state.currencies, src.currencies || {});
  for (const key of Object.keys(state.currencies)) state.currencies[key] = Math.max(0, num(state.currencies[key], 0));

  state.records = Object.assign(state.records, src.records || {});
  // newbieOffersUsed est un tableau, pas un compteur — même exclusion que
  // dans normalizeIdleNguState plus bas (évite Number([...]) === 0).
  const legacyNewbieOffersUsed = Array.isArray(state.records.newbieOffersUsed) ? state.records.newbieOffersUsed : [];
  for (const key of Object.keys(state.records)) {
    if (key === "newbieOffersUsed" || key === "portrait") continue;
    state.records[key] = Math.max(0, num(state.records[key], 0));
  }
  state.records.newbieOffersUsed = legacyNewbieOffersUsed.filter(id => typeof id === "string" && id);
  state.records.portrait = typeof state.records.portrait === "string" && state.records.portrait ? state.records.portrait : "default";

  state.challenge = Object.assign(state.challenge, src.challenge || {});
  state.challenge.completions = Object.assign(
    baseState(now).challenge.completions,
    src.challenge?.completions || {}
  );
  state.challenge.bestMs = Object.assign({},src.challenge?.bestMs || {});
  state.challenge.completionsTier = createChallengeTiersV1(src.challenge?.completionsTier);
  state.challenge.activeTier = CHALLENGE_TIER_KEYS_V1.includes(src.challenge?.activeTier) ? src.challenge.activeTier : "normal";
  state.challenge.troll = createTrollStateV1(src.challenge?.troll);

  state.bank.advancedTraining = Math.max(0, num(src.bank?.advancedTraining, 0));
  state.bank.timeMachineSpeed = Math.max(0, num(src.bank?.timeMachineSpeed, src.bank?.timeMachine || 0));
  state.bank.timeMachineGold = Math.max(0, num(src.bank?.timeMachineGold, 0));
  state.bank.beards = Math.max(0, num(src.bank?.beards, 0));

  /*
   * 4G's Sellout Shop : purchases est un compteur par objet du catalogue,
   * jamais négatif, jamais au-delà du plafond réel de l'objet (défensif
   * contre un ancien état corrompu ou un catalogue réduit entre deux
   * versions).
   */
  {
    const rawPurchases = src.selloutShop?.purchases && typeof src.selloutShop.purchases === "object" ? src.selloutShop.purchases : {};
    const purchases = {};
    for (const item of IDLE_SELLOUT_SHOP_CATALOG_V1) {
      const n = Math.max(0, int(rawPurchases[item.id], 0));
      purchases[item.id] = item.max != null ? Math.min(item.max, n) : n;
    }
    /*
     * Norman (2026-09-16) : "J'aimerais que le sellout shop n'apparaisse
     * qu'à partir du moment où on récolte ses premiers points d'AP."
     * unlockedEver reste vrai pour toujours dès la première fois où l'AP
     * dépasse 0 — jamais juste "ap>0 en ce moment", sinon dépenser tout
     * son AP au shop referait disparaître le menu qu'on est en train
     * d'utiliser.
     */
    const unlockedEver = Boolean(src.selloutShop?.unlockedEver) || num(state.currencies.ap, 0) > 0;
    state.selloutShop = { purchases, unlockedEver };
    state.selloutEffects = createSelloutEffectsV1(src.selloutEffects);
    state.r3Nom = normaliserR3NomV1(src.r3Nom);
  }

  state.bonuses = Object.assign(state.bonuses, src.bonuses || {});
  state.bonuses.cards = normalizeIdleCardBonusesV1(src.bonuses?.cards);
  if (src.rebirth && typeof src.rebirth === "object") state.rebirth = clone(src.rebirth);
  if (src.adventure && typeof src.adventure === "object") state.adventure = clone(src.adventure);

  const oldSystems = src.systems && typeof src.systems === "object" ? src.systems : {};
  for (const def of IDLE_NGU_SYSTEMS) {
    const old = oldSystems[def.id];
    if (!old || typeof old !== "object") continue;
    const target = state.systems[def.id];
    target.unlocked = Boolean(old.unlocked);
    target.active = Boolean(old.active);
    target.level = Math.max(0, num(old.level, 0));
    target.tempLevel = Math.max(0, num(old.tempLevel, 0));
    target.permanentLevel = Math.max(0, num(old.permanentLevel, 0));
    target.progress = Math.max(0, num(old.progress, 0));

    for (const resource of RESOURCE_KEYS) {
      const legacyPercent = clamp(num(old.allocation?.[resource], 0), 0, 100);
      target.allocation[resource] = state.resources[resource].cap * legacyPercent / 100;
    }

    if (target.data?.tracks) {
      const oldTracks = old.data?.tracks && typeof old.data.tracks === "object" ? old.data.tracks : {};
      for (const [trackId, trackState] of Object.entries(target.data.tracks)) {
        migrateLegacyTrackV47_(trackState, oldTracks[trackId]);
      }
      if (def.id === "advancedTraining" && oldTracks.wandoos && target.data.tracks.wandoosEnergy) {
        migrateLegacyTrackV47_(target.data.tracks.wandoosEnergy, oldTracks.wandoos);
      }
      if (old.data?.activeTrack && target.data.tracks[old.data.activeTrack]) {
        target.data.activeTrack = old.data.activeTrack;
      }
    } else if (def.id === "augmentations") {
      if (old.data?.pairs && typeof old.data.pairs === "object") {
        for (const aug of IDLE_NGU_AUGMENTATIONS) {
          const p = old.data.pairs[aug.id];
          if (!p) continue;
          target.data.pairs[aug.id] = Object.assign(target.data.pairs[aug.id], p);
        }
        if (target.data.pairs[old.data.activePair]) target.data.activePair = old.data.activePair;
        target.data.trainUpgrade = Boolean(old.data.trainUpgrade);
      } else {
        target.data.pairs.scissors.level = Math.floor(legacyRunLevelsV47_(old));
      }
    } else if (def.id === "timeMachine") {
      if (old.data && (old.data.speedLevel != null || old.data.goldLevel != null)) {
        target.data = Object.assign(target.data, old.data);
      } else {
        target.data.speedLevel = Math.floor(legacyRunLevelsV47_(old));
        target.data.bestGoldThisRun = Math.max(0, num(src.records?.highestGoldDrop, 0));
        target.data.highestBossEver = Math.max(0, num(src.records?.highestBoss, 0));
      }
    } else if (def.id === "bloodMagic") {
      if (old.data?.rituals && typeof old.data.rituals === "object") {
        for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
          const r = old.data.rituals[ritual.id];
          if (r) target.data.rituals[ritual.id] = Object.assign(target.data.rituals[ritual.id], r);
        }
        if (target.data.rituals[old.data.activeRitual]) target.data.activeRitual = old.data.activeRitual;
        target.data.spells = Object.assign(target.data.spells, old.data.spells || {});
      } else {
        const levels = Math.floor(legacyRunLevelsV47_(old));
        target.data.rituals.tack.level = levels;
        target.data.rituals.tack.completions = levels;
      }
    } else if (def.id === "yggdrasil" && old.data?.fruits) {
      target.data = Object.assign(target.data, old.data);
    } else if (def.id === "diggers" && old.data?.diggers) {
      target.data = Object.assign(target.data, old.data);
    } else if (!target.data?.tracks && old.data && typeof old.data === "object") {
      target.data = Object.assign(target.data || {}, old.data);
    }
  }

  state.migration = {
    fromVersion: String(src.version || "legacy"),
    fromSchema: Math.max(0, int(src.saveSchema, 0)),
    migratedAt: now
  };
  return state;
}

/*
 * V47 save rule: migrate compatible NGU progress forward without reviving
 * obsolete player-level / Renaissance / Essence mechanics. Migration is
 * one-way and idempotent: once normalized, the save is native schema 47.
 */
export function normalizeIdleNguState(raw, context = {}, now = Date.now()) {
  const t = nowMs(now);
  const isV47 = raw && raw.version === IDLE_NGU_META_VERSION && raw.saveSchema === IDLE_NGU_SAVE_SCHEMA;
  const source = isV47 ? clone(raw) : migrateLegacyMetaToV47(raw, t);
  const state = Object.assign(baseState(t), source);

  state.version = IDLE_NGU_META_VERSION;
  state.saveSchema = IDLE_NGU_SAVE_SCHEMA;
  const previousResourceModelVersion=Math.max(0,int(source.resourceModelVersion,0));
  state.resourceModelVersion = 52;
  state.updatedAt = Math.max(0, num(source.updatedAt, t));
  state.runStartedAt = Math.max(0, num(source.runStartedAt, t));
  state.adventure = normalizeIdleAdventureStateV47(source.adventure);

  /*
   * Parité NGU : au premier déblocage d'Adventure, l'inventaire contient
   * le Tutorial Cube plus un Boost Power 1, Toughness 1 et Special 1.
   * Le drapeau est persistant : jamais de doublon aux synchros suivantes.
   */
  state.adventure.unlockFlags=state.adventure.unlockFlags||{};
  if(
    Math.max(0,int(context&&context.bosses,0))>=4 &&
    !state.adventure.unlockFlags.starterBoostsGrantedV1
  ){
    ["power","toughness","special"].forEach(function(type){
      idleAdventureAddItemV1(state.adventure,idleAdventureBoostV1(type,1));
    });
    state.adventure.unlockFlags.starterBoostsGrantedV1=true;
  }

  state.resources = {
    energy: normalizeResource(source.resources?.energy,"energy"),
    magic: normalizeResource(source.resources?.magic,"magic"),
    r3: normalizeResource(source.resources?.r3,"r3")
  };

  /* audit 2026-10-13 : un seul baseState(t) pour les sous-objets (avant : 6 reconstructions complètes par normalisation, 7 normalisations par synchro) ; chaque sous-objet n'est utilisé qu'une fois, et les complétions de défis sont prises AVANT l'assign du défi */
  const baseSous = baseState(t);
  const completionsDefisBase = baseSous.challenge.completions;
  state.currencies = Object.assign(baseSous.currencies, source.currencies || {});
  for (const k of Object.keys(state.currencies)) state.currencies[k] = Math.max(0, num(state.currencies[k], 0));

  /*
   * Norman (2026-09-16) : "le sellout shop ne doit apparaître qu'à
   * partir du moment où on récolte ses premiers points d'AP." Dérivé
   * ICI (chemin commun aux deux migrations, v47 déjà natif ou legacy)
   * plutôt que seulement dans migrateLegacyMetaToV47 — sinon un save
   * déjà en v47 (l'immense majorité) ne recalculait jamais ce drapeau.
   * unlockedEver reste vrai pour toujours une fois franchi, jamais
   * réévalué sur le solde courant (dépenser tout son AP au shop ne doit
   * jamais faire disparaître le menu qu'on est en train d'utiliser).
   */
  state.selloutShop = Object.assign(baseSous.selloutShop, state.selloutShop || {});
  state.selloutShop.unlockedEver = Boolean(state.selloutShop.unlockedEver) || num(state.currencies.ap, 0) > 0;
  state.selloutEffects = createSelloutEffectsV1(source.selloutEffects);
  state.r3Nom = normaliserR3NomV1(source.r3Nom);
  appliquerConsommablesSetsAventureV1(state);

  state.records = Object.assign(baseSous.records, source.records || {});
  /*
   * newbieOffersUsed est un tableau d'ids (IDLE_NGU_NEWBIE_OFFERS), pas un
   * compteur numérique — exclu de la coercion Math.max(0,num(...)) juste en
   * dessous (qui le réduirait sinon à 0 via Number([...]) === NaN/0) et
   * assaini séparément pour tolérer une sauvegarde corrompue.
   */
  const newbieOffersUsedSrc = Array.isArray(state.records.newbieOffersUsed) ? state.records.newbieOffersUsed : [];
  for (const k of Object.keys(state.records)) {
    if (k === "newbieOffersUsed" || k === "portrait" || k === "loginCalendar") continue;
    state.records[k] = Math.max(0, num(state.records[k], 0));
  }
  state.records.newbieOffersUsed = Array.from(new Set(newbieOffersUsedSrc.filter(id => typeof id === "string" && id)));
  /* Calendrier de connexion (idle-login-calendar-v1.js) : objet { mois, serie, dernierJour, totalReclames, totalAp }, jamais coercé en nombre. */
  state.records.loginCalendar = idleLoginCalendarNormaliserV1(state.records.loginCalendar);
  /* Portrait de joueur choisi (idle-portraits-v1.js) : identifiant texte, pas un compteur. */
  state.records.portrait = typeof state.records.portrait === "string" && state.records.portrait ? state.records.portrait : "default";

  state.challenge = Object.assign(baseSous.challenge, source.challenge || {});
  state.challenge.completions = Object.assign(completionsDefisBase, source.challenge?.completions || {});
  state.challenge.completionsTier = createChallengeTiersV1(source.challenge?.completionsTier);
  state.challenge.activeTier = CHALLENGE_TIER_KEYS_V1.includes(source.challenge?.activeTier) ? source.challenge.activeTier : "normal";
  state.challenge.troll = createTrollStateV1(source.challenge?.troll);
  state.bank = Object.assign(baseSous.bank, source.bank || {});
  state.bonuses = Object.assign(baseSous.bonuses, source.bonuses || {});
  state.bonuses.cards = normalizeIdleCardBonusesV1(source.bonuses?.cards);

  const systems = {};
  for (const def of IDLE_NGU_SYSTEMS) systems[def.id] = normalizeSystem(def, source.systems?.[def.id]);
  state.systems = systems;

  /*
   * 2026-09-23 (audit) : slots d'inventaire / d'accessoires venant des Perks, des
   * souhaits "more Inventory space" (1 par niveau) et des No Equipment Challenges
   * -- calculés mais jamais lus, les capacités étant des constantes.
   */
  {
    const perks = perkBonusesV1(idlePerkNiveauxV1(state));
    const wishes = wishBonusesV1(idleWishTracksActifsV1(state));
    /*
     * 2026-09-24 (seconde passe) : perk 25 « The Loot Goblin's Blessing » (lootGoblinChance) était agrégé
     * mais jamais lu. Page Inventory, Higher Level Drops : « a 1% chance that any item dropped at lvl 1 or
     * higher gains +1 level. This can be bought 10 times and stacks with the Gaudy Set Bonus » -- ajouté
     * au même tirage que le set Gaudy et Fibonacci 144 (dropLevelAdventureV2, idle-adventure-v47.js).
     */
    state.adventure.bonusDropLevelChance = Math.min(1, perks.lootLevelChance + perks.lootGoblinChance);
    state.adventure.idleAttackBonus = Math.max(0, num(challengePermanentBonuses(state).idleAttackBonus, 0));
    /* Dual Wielding : ratio de la seconde arme = 0,05 x (niveau du souhait 28 + niveau du souhait 45), maximum 1 (wiki Wishes ; source tierce player.ts). */
    state.adventure.dualWieldRatio = Math.min(1, 0.05 * (Math.max(0, wishLevelV1(state, 28)) + Math.max(0, wishLevelV1(state, 45))));
    state.adventure.bonusSlots = {
      inventory: Math.max(0, int(perks.inventorySlots, 0)) + Math.max(0, int(quirkBonusesV1(idleQuirkNiveauxV1(state)).inventorySlotBonus, 0)) + Math.max(0, int(challengePermanentBonuses(state).inventorySlots, 0)) + Math.max(0, int(wishes.inventorySlots, 0)) + Math.max(0, int(state.selloutShop?.purchases?.extraInventorySpace, 0)) + expShopPurchasedV1(state, "inventorySpace"),
      accessory: Math.max(0, int(perks.accessorySlotBonus, 0)) + Math.max(0, int(quirkBonusesV1(idleQuirkNiveauxV1(state)).accessorySlotBonus, 0)) + Math.max(0, int(challengePermanentBonuses(state).accessorySlots, 0)) + ["extraAccessorySlot1", "extraAccessorySlot2", "extraAccessorySlot3", "extraAccessorySlot4", "extraAccessorySlot5", "extraAccessorySlotEvil"].reduce((sum, id) => sum + Math.min(1, int(state.selloutShop?.purchases?.[id], 0)), 0) + expShopPurchasedV1(state, "accessorySlot1") + expShopPurchasedV1(state, "accessorySlot2") + (wishLevelV1(state, 109) >= 1 ? 1 : 0)
    };
  }

  /* Automatisation de l'inventaire : nombre de slots d'automerge (lu par le moteur d'Aventure) et réglages. */
  state.adventure.mergeSlots = idleInventoryMergeSlotCountV1(state);
  state.adventure.inventoryAuto = normalizeIdleInventoryAutoV1(state.adventure.inventoryAuto);

  /* Item Daycare : données des slots, et déblocage dès qu'un slot existe (« shows up once a daycare slot has been purchased »). */
  state.systems.daycare.data = normalizeIdleDaycareDataV1(state.systems.daycare.data);
  if (idleDaycareFactorsV1(daycareBaseInputsV1(state)).slots > 0) state.adventure.unlockFlags.daycareSlotPurchased = true;

  /*
   * Migration NGU (2026-09-23) : les anciennes sauvegardes portaient 9 pistes
   * inventées et une allocation globale. Les niveaux de ces pistes n'ont pas
   * d'équivalent dans les 16 vrais NGU : ils repartent de zéro (comme au
   * début d'une vraie partie) et l'énergie/magie qui leur était allouée est
   * rendue au joueur.
   */
  {
    const oldNgu = source.systems?.ngu;
    if (oldNgu && typeof oldNgu === "object" && !(oldNgu.data && oldNgu.data.ngus)) {
      for (const resource of ["energy", "magic"]) {
        const held = Math.max(0, num(oldNgu.allocation?.[resource], 0));
        if (held > 0 && state.resources[resource]) {
          state.resources[resource].current = Math.max(0, num(state.resources[resource].current, 0)) + held;
        }
      }
    }
  }

  // V51 migration: older V47/V50 saves had no persisted free-resource pool.
  // The legacy row is consulted once when available, then metaNgu owns it.
  if(previousResourceModelVersion < 51){
    const energyHeldByMeta=totalAllocated(state,"energy");
    const energyHeldExternally=externalResourceAllocation(context,"energy");
    const legacyEnergy=Number(context.legacyEnergyIdle);
    state.resources.energy.current=Number.isFinite(legacyEnergy)
      ? clamp(legacyEnergy,0,Math.max(0,state.resources.energy.cap-energyHeldByMeta-energyHeldExternally))
      : Math.max(0,state.resources.energy.cap-energyHeldByMeta-energyHeldExternally);
    state.resources.energy.fillProgress=0;
    state.resources.energy.generatedThisRun=0;

    const legacyMagic=Number(context.legacyMagicIdle);
    state.resources.magic.current=Number.isFinite(legacyMagic)
      ? clamp(legacyMagic,0,Math.max(0,state.resources.magic.cap-totalAllocated(state,"magic")))
      : 0;
    state.resources.magic.fillProgress=0;
    state.resources.magic.generatedThisRun=0;
  }

  // V52 removes the old Yggdrasil reservation/refund model. Existing active
  // fruit reservations are converted once into actually spent idle resource.
  if(previousResourceModelVersion < 52 && state.systems.yggdrasil?.data?.reserved){
    for(const resource of ["energy","magic"]){
      const reserved=Math.max(0,num(state.systems.yggdrasil.data.reserved[resource],0));
      if(reserved>0 && state.resources[resource]){
        state.resources[resource].current=Math.max(0,num(state.resources[resource].current,0)-reserved);
      }
      state.systems.yggdrasil.data.reserved[resource]=0;
    }
  }

  const bosses = Math.max(0, int(context.bosses, 0));
  const zone = Math.max(1, int(context.zone, 1));
  const sets = Math.max(0, int(context.sets, 0));
  const rebirths = Math.max(0, int(context.rebirths, state.records.totalRebirths));

  state.records.highestBoss = Math.max(state.records.highestBoss, bosses);
  state.records.highestZone = Math.max(state.records.highestZone, zone);
  state.records.setsCompleted = Math.max(state.records.setsCompleted, sets);
  state.records.totalRebirths = Math.max(state.records.totalRebirths, rebirths);
  state.records.highestGoldDrop = Math.max(state.records.highestGoldDrop, num(context.bestGold, 0));

  const tm = state.systems.timeMachine;
  tm.data.bestGoldThisRun = Math.max(tm.data.bestGoldThisRun, num(context.bestGold, 0));
  tm.data.highestBossEver = Math.max(tm.data.highestBossEver, state.records.highestBoss);

  for (const def of IDLE_NGU_SYSTEMS) {
    if (unlockSatisfied(def, context, state)) state.systems[def.id].unlocked = true;
  }

  state.systems.achievements.unlocked = true;
  reconcileResourceCurrents(state,context);
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Cause racine d'un bug bloquant trouvé en auditant ce fichier :
   * state.difficulty était lu correctement plus haut (migrateLegacyMetaToV47
   * puis Object.assign(baseState(t), source)) puis ÉCRASÉ ici en dur à
   * "normal" à CHAQUE sync — rendant impossible toute persistance d'un
   * choix Evil/Sadistic (state.difficulty ne valait jamais autre chose que
   * "normal" au runtime, quoi que le joueur ait choisi). difficultyPeaks.
   * normal était de même mis à jour en dur, peu importe la difficulté
   * réellement active -- corrigé pour suivre state.difficulty (déjà lu,
   * jamais réécrit ici).
   */
  state.difficultyPeaks = Object.assign({ normal: 0, difficile: 0, extreme: 0 }, source.difficultyPeaks || {});
  state.difficultyPeaks[state.difficulty] = Math.max(num(state.difficultyPeaks[state.difficulty], 0), bosses);

  state.rebirth = normalizeRebirthState(source.rebirth, state.runStartedAt, t);
  applyYggQuickActivationV1(state, t);
  state.rebirth = refreshRebirthState(state, context, t);
  idleTheEndSyncV1(state, t);
  trackLeaderboardStatsV1(state);
  /* Préférences d'interface liées au compte (idle-ui-prefs-v1.js) : jamais lues par le jeu, gardées telles quelles (rebirth compris). */
  state.uiPrefs = nettoyerUiPrefsV1(source.uiPrefs);
  /* Idempotence générique des actions (clientMutationId) : 64 dernières entrées {id,result}. */
  state.recentClientMutations = (Array.isArray(source.recentClientMutations) ? source.recentClientMutations : [])
    .filter((x) => x && typeof x.id === "string" && x.id)
    .map((x) => ({ id: x.id.slice(0, 160), result: x.result === undefined ? null : x.result }))
    .slice(-64);
  return state;
}

/*
 * THE END (idle-the-end-v1.js) : pièces qui ne dépendent que de l'état — Perk 231 (482), Move 69 x69 (481), Quirk 176 (486), boss 300 vaincu en
 * Sadistic (487), Wish 203 (490), Traitor (495). Les autres viennent de leur propre action (transformation, drop, carte, sort, Hack, ITOPOD).
 */
function idleTheEndSyncV1(state, now) {
  const adv = state.adventure;
  if (!adv || typeof adv !== "object") return;
  if (int(state.systems.perks?.data?.levels?.[231], 0) > 0) idleTheEndGrantV1(adv, 482, now);
  if (int(state.systems.quirks?.data?.levels?.[176], 0) > 0) idleTheEndGrantV1(adv, 486, now);
  if (int(state.systems.wishes?.data?.tracks?.["203"]?.level, 0) >= 1) idleTheEndGrantV1(adv, 490, now);
  if (adv.skillState?.endPiece481) idleTheEndGrantV1(adv, 481, now);
  if (adv.unlockFlags?.traitorDefeated) idleTheEndGrantV1(adv, 495, now);
  if (num(state.difficultyPeaks?.extreme, 0) >= 300) idleTheEndGrantV1(adv, 487, now);
}

/*
 * Dernier Hack (page THE END, pièce 488) : « Once you level all other hacks to their maximums, this hack appears and begins leveling. It levels by
 * itself, requiring no Resource 3, and takes 200,000 seconds (55.55 hours) to complete. » Progression : 1 seconde par seconde, hors ligne comprise.
 */
function idleTheEndFinalHackVisibleV1(state) {
  const s = state.systems.hacks;
  if (!s?.unlocked) return false;
  const tracks = s.data?.tracks || {};
  return Object.keys(HACK_HARD_CAP_V1).every(id => int(tracks[id]?.level, 0) >= HACK_HARD_CAP_V1[id]);
}

export function advanceTheEndFinalHackV1(state, seconds) {
  if (!(seconds > 0) || idleTheEndHasV1(state.adventure, 488) || !idleTheEndFinalHackVisibleV1(state)) return;
  const d = idleTheEndDataV1(state.adventure);
  d.finalHackSeconds = Math.min(IDLE_THE_END_FINAL_HACK_SECONDS_V1, d.finalHackSeconds + seconds);
  if (d.finalHackSeconds >= IDLE_THE_END_FINAL_HACK_SECONDS_V1 - 1e-9) idleTheEndGrantV1(state.adventure, 488, Date.now());
}

export function idleTheEndFinalHackSnapshotV1(state) {
  if (!idleTheEndFinalHackVisibleV1(state) && !idleTheEndHasV1(state.adventure, 488)) return undefined;
  const seconds = idleTheEndHasV1(state.adventure, 488) ? IDLE_THE_END_FINAL_HACK_SECONDS_V1 : Math.max(0, num(state.adventure?.theEnd?.finalHackSeconds, 0));
  return { name: "*-)$#E$GCUk&", seconds, total: IDLE_THE_END_FINAL_HACK_SECONDS_V1, done: seconds >= IDLE_THE_END_FINAL_HACK_SECONDS_V1 };
}

/*
 * Statistiques du classement qui ne se déduisent pas de l'état courant (voir records.bestNumber / totalExpEarned / playSeconds) :
 *  - EXP totale gagnée : chaque hausse de l'EXP depuis la dernière observation est un gain ; une baisse est un achat (ignoré). Les achats passent
 *    par une action, qui normalise d'abord l'état : les gains précédents sont donc déjà comptés au moment de la dépense.
 *  - Meilleur NUMBER : le NUMBER en cours vient d'un Rebirth ; comptes existants (au moins un Rebirth) initialisés à leur NUMBER actuel.
 */
function trackLeaderboardStatsV1(state) {
  const r = state.records;
  const exp = Math.max(0, num(state.currencies?.experience, 0));
  const vue = num(r.expLastSeen, -1);
  if (vue < 0) r.totalExpEarned = Math.max(num(r.totalExpEarned, 0), exp);
  else if (exp > vue) r.totalExpEarned = num(r.totalExpEarned, 0) + (exp - vue);
  r.expLastSeen = exp;
  if (num(r.totalRebirths, 0) > 0) r.bestNumber = Math.max(num(r.bestNumber, 0), num(state.rebirth?.number, 0));
}

/*
 * 2026-09-24 (audit, page Yggdrasil, Perk Points) : « Quicker Power Fruit Beta Activation » /
 * « Quicker Fruit of Numbers Bonus Activation » (perks 16 et 17, 50 PP) : « The Fruit of Power Beta's
 * bonus will automatically turn on after 30 minutes » (« Fruit of Power β and Fruit of Numbers' bonuses
 * are only activated after eating that fruit at least once during the current rebirth, or by buying the
 * respective quicker activation perk »). Leur bonus était vide : le multiplicateur n'était jamais
 * actif sans avoir mangé le fruit. Les 30 minutes se comptent depuis le début du Rebirth.
 */
export function applyYggQuickActivationV1(state, now) {
  const ygg = state.systems.yggdrasil?.data;
  if (!ygg) return;
  const levels = idlePerkNiveauxV1(state);
  const runSeconds = Math.max(0, (nowMs(now) - Math.max(0, num(state.runStartedAt, 0))) / 1000);
  if (runSeconds < 1800) return;
  if (num(levels[16], 0) >= 1) ygg.runPowerBetaActive = true;
  if (num(levels[17], 0) >= 1) ygg.runNumbersActive = true;
}

export function normalizeRebirthState(raw, runStartedAt, now) {
  const out = Object.assign(createRebirthState(now), raw && typeof raw === "object" ? raw : {});
  for (const k of ["number", "nextNumber", "lastNumber"]) out[k] = Math.max(1e-300, num(out[k], 1));
  out.lastBosses = Math.max(0, int(out.lastBosses, 0));
  out.lastRunSeconds = Math.max(0, num(out.lastRunSeconds, 0));
  out.lastBlood = Math.max(0, num(out.lastBlood, 0));
  out.hasPreviousRun = Boolean(out.hasPreviousRun);
  out.minimumRebirthSeconds = MIN_REBIRTH_SECONDS;
  out.updatedAt = now;
  if (!Number.isFinite(Number(runStartedAt))) out.canRebirth = false;
  return out;
}
