/*
 * NGU : Renaissance, ressources, budget et Augmentations (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { macguffinEffectMultiplierV1 } from "./idle-macguffins-v1.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { idlePerkNiveauxV1, idleQuirkNiveauxV1 } from "./idle-difficulty-gates-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { idleSelloutPotionFactorV1 } from "./idle-sellout-shop-v1.js";
import { idleCardsMultiplierV1 } from "./idle-cards-v1.js";
import { IDLE_NGU_AUGMENTATIONS, IDLE_NGU_META_VERSION, IDLE_NGU_SYSTEMS, MIN_REBIRTH_SECONDS, REBIRTH_UNLOCK_BOSS_V1, RESOURCE_KEYS, challengePermanentBonuses, clamp, int, num, safePow, safeProduct } from "./idle-ngu-catalogues.js";
import { defaultResource, idleNguDifficultySpeedDividerV1, normalizeIdleNguState, normalizeRebirthState } from "./idle-ngu-etat.js";
import { setRitualAllocationV1, trollBossDividerV1 } from "./idle-ngu-systemes.js";
import { avecPorteeBonusV1, beardBonusMultiplier, clearNguAllocationsV1, gearPctV1, gearSpecialsV1, hackFxV1, idleNguBonuses, idleNguBonusesLectureV1, nguFxV1, syncNguAllocationTotalsV1 } from "./idle-ngu-bonus.js";
import { challengeHundredLevelsConsume, challengeHundredLevelsRemaining, minRebirthSecondsV1, setAugmentAllocationV214_, wishLevelV1 } from "./idle-ngu-snapshot.js";
import { clearWishSlotAllocationsV1 } from "./idle-ngu-pistes.js";

export function idleNguRebirthTimeFactor(seconds) {
  const minutes = Math.max(0, num(seconds, 0)) / 60;
  if (minutes < 2) return Math.max(1e-300, minutes / 1989672960);
  if (minutes < 3) return minutes / 31088640;
  if (minutes < 4) return minutes / 971520;
  if (minutes < 5) return minutes / 122880;
  if (minutes < 7) return minutes / 30720;
  if (minutes < 10) return minutes / 7680;
  if (minutes < 12) return minutes / 1920;
  if (minutes < 15) return minutes / 480;
  if (minutes < 30) return minutes / 240;
  if (minutes < 60) return minutes / 120;
  return 1 + minutes / (60 * 24 * 2);
}

export function calculateIdleNguNextNumber(input = {}) {
  const bosses = Math.max(0, int(input.bosses, 0));
  const lastBosses = Math.max(0, int(input.lastBosses, 0));
  const runSeconds = Math.max(0, num(input.runSeconds, 0));
  const lastRunSeconds = Math.max(0, num(input.lastRunSeconds, 0));
  const hasPreviousRun = Boolean(input.hasPreviousRun);
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Wiki NGU local, page "SADISTIC difficulty", section "Fight boss and
   * number" : "Boss Power Bonus of rebirth NUMBER is based on 1.2^[boss
   * beaten]... this multiplier can be increased to up to x1.25 per boss
   * killed through the unlocking of the relevant Perks, Quirks and
   * Wishes." Perks 157/158 ("Improved Sadistic Boss Multiplier I/II",
   * +0.0005/niveau chacun, cap 10) et Quirks 74/75 (+0.001/niveau chacun,
   * cap 10) totalisent jusqu'à +0.01+0.02=0.03... la borne wiki "up to
   * x1.25" inclut aussi les Wishes (non construites) : seule la portion
   * Perks+Quirks est câblée ici, jamais extrapolée jusqu'à 1.25.
   */
  const base = input.difficulty === "extreme" ? 1.2 + Math.max(0, num(input.sadisticBossMultiplierBonus, 0)) : input.difficulty === "difficile" ? 1.5 : 2;

  /* Gros troll « I just divided your boss multiplier by X » (voir trollBossDividerV1). */
  const currentBossFactor = safePow(base, bosses) / Math.max(1, num(input.bossFactorDivider, 1));
  const priorBossFactor = hasPreviousRun ? safePow(base, lastBosses) : 1;
  const currentTimeFactor = idleNguRebirthTimeFactor(runSeconds);
  const priorTimeFactor = hasPreviousRun ? idleNguRebirthTimeFactor(lastRunSeconds) : 1;
  const trainingFactor = Math.max(1, Math.floor(1 + Math.max(0, num(input.attackTrainingLevels, 0)) / 10000));
  const bloodMagicBonus = Math.max(1, num(input.bloodMagicBonus, 1));
  const nguNumberBonus = Math.max(1, num(input.nguNumberBonus, 1));
  const beardNumberBonus = Math.max(1, num(input.beardNumberBonus, 1));
  const yggNumberBonus = Math.max(1, num(input.yggNumberBonus, 1));
  const macguffinNumberBonus = Math.max(1, num(input.macguffinNumberBonus, 1));
  const hacksNumberBonus = Math.max(1, num(input.hacksNumberBonus, 1));

  return {
    nextNumber: safeProduct([
      currentBossFactor,
      priorBossFactor,
      currentTimeFactor,
      priorTimeFactor,
      trainingFactor,
      bloodMagicBonus,
      nguNumberBonus,
      beardNumberBonus,
      yggNumberBonus,
      macguffinNumberBonus,
      hacksNumberBonus
    ]),
    canRebirth: runSeconds >= MIN_REBIRTH_SECONDS && bosses >= REBIRTH_UNLOCK_BOSS_V1,
    minimumRebirthSeconds: MIN_REBIRTH_SECONDS,
    factors: {
      currentBossFactor,
      priorBossFactor,
      currentTimeFactor,
      priorTimeFactor,
      trainingFactor,
      bloodMagicBonus,
      nguNumberBonus,
      beardNumberBonus,
      yggNumberBonus,
      macguffinNumberBonus,
      hacksNumberBonus
    }
  };
}

export function totalTrackLevel(system, trackId) {
  const t = system?.data?.tracks?.[trackId];
  if (!t) return 0;
  return Math.max(0, num(t.level, 0) + num(t.tempLevel, 0) + num(t.permanentLevel, 0));
}

function bloodNumberMultiplier(state) {
  return Math.max(1, num(state.systems.bloodMagic?.data?.spells?.numberBoost, 1));
}

/*
 * Page « Yggdrasil » : « Your Fruit of Numbers Bonus is based off your
 * Invisible Fruit of Numbers Level^1.3 * 0.05% », actif seulement si le fruit
 * a été mangé pendant ce Rebirth ; page « NUMBER » : facteur « Yggdrasil
 * NUMBER Bonus ... if activated this rebirth » du PROCHAIN NUMBER.
 */
function yggFruitNumbersMultiplierV1(state) {
  const ygg = state.systems.yggdrasil?.data;
  if (!ygg || !ygg.runNumbersActive) return 1;
  return 1 + Math.pow(Math.max(0, num(ygg.permanent?.numbersValue, 0)), 1.3) * 5e-4;
}

export function refreshRebirthState(state, context, now) {
  const runSeconds = Math.max(0, (now - state.runStartedAt) / 1000);
  const rb = normalizeRebirthState(state.rebirth, state.runStartedAt, now);
  const preview = calculateIdleNguNextNumber({
    /*
     * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
     * calculateIdleNguNextNumber sait déjà distinguer "difficile" (Evil,
     * 1.5^boss) et "extreme" (Sadistic, 1.2^boss) de "normal" (2^boss) --
     * mais ce point d'appel forçait "normal" en dur, rendant la formule
     * Evil/Sadistic inatteignable même une fois state.difficulty
     * correctement choisi et persisté (cf. correctif normalizeIdleNguState
     * ci-dessus). Lit maintenant la vraie difficulté active.
     */
    difficulty: state.difficulty,
    bossFactorDivider: trollBossDividerV1(state),
    bosses: context.bosses,
    lastBosses: rb.lastBosses,
    runSeconds,
    lastRunSeconds: rb.lastRunSeconds,
    hasPreviousRun: rb.hasPreviousRun,
    attackTrainingLevels: context.attackTrainingLevels,
    bloodMagicBonus: bloodNumberMultiplier(state),
    nguNumberBonus: nguFxV1(state).number,
    beardNumberBonus: beardBonusMultiplier(state, "number"),
    /* 2026-09-24 (page NUMBER) : Fruit of Numbers et Number Hack sont des facteurs du prochain NUMBER. */
    yggNumberBonus: yggFruitNumbersMultiplierV1(state),
    /* NUMBER MacGuffin Fragment : bonus permanent (idle-macguffins-v1.js). */
    macguffinNumberBonus: macguffinEffectMultiplierV1(state, "number"),
    /* Page Hacks : « Hacks do not affect Normal mode » (hackFxV1 renvoie 1 en Normal). */
    hacksNumberBonus: hackFxV1(state).number,
    sadisticBossMultiplierBonus:
      perkBonusesV1(idlePerkNiveauxV1(state)).sadisticBossMultiplierBonus +
      quirkBonusesV1(idleQuirkNiveauxV1(state)).sadisticBossMultiplierBonus +
      0.001 * (wishLevelV1(state, 107) + wishLevelV1(state, 108))
  });
  rb.nextNumber = preview.nextNumber;
  const minRebirth = minRebirthSecondsV1(state);
  rb.canRebirth = runSeconds >= minRebirth && Math.max(0, int(context.bosses, 0)) >= REBIRTH_UNLOCK_BOSS_V1;
  rb.minimumRebirthSeconds = minRebirth;
  rb.preview = preview.factors;
  rb.updatedAt = now;
  return rb;
}

/*
 * Correctif PISTE 6 de l'audit wiki 2026-09-18 : idleNguBonuses() (plus bas
 * dans ce fichier) calcule déjà energyPowerFlat/energyBarsFlat/
 * energyCapMultiplier/magicPowerFlat/magicBarsFlat/magicCapFlat/
 * magicCapMultiplier/r3PowerMultiplier/r3CapMultiplier/r3BarsMultiplier
 * (alimentés par Perks/Quirks/Wishes -- ex. idle-perks-v1.js:94, "The
 * Newbie Magic Perk" : "Gain 1 Magic Power, 1 Magic Bar, and 10k Magic
 * Cap!") mais AUCUN autre point de ce fichier ne relisait ces champs avant
 * ce correctif (grep sur chaque nom de champ, seule idleNguBonuses() les
 * produisait) : un joueur montant ces Perks/Quirks/Wishes ne voyait aucun
 * effet sur sa vitesse Energy/Magic/Resource 3. idleNguEffectiveResourceStatV1
 * centralise la lecture "effective" (achat brut + bonus) utilisée par tous
 * les calculs de vitesse/débit ci-dessous -- jamais en mutant
 * state.resources.<r>.power/bars/cap eux-mêmes (ce total acheté reste
 * affiché tel quel côté UI, seul l'effectif utilisé par le calcul change).
 * idleNguBonuses() ne dépend d'aucune de ces fonctions de ressource (vérifié
 * par grep dans son corps, lignes 2966-3205) : pas de récursion.
 *
 * Correctif 2026-09-18 (suite, "finir le câblage laissé ouvert") :
 * energyPowerMultiplier/energyBarsMultiplier/magicPowerMultiplier/
 * magicBarsMultiplier (Perks/Quirks/Wishes + objets Specials depuis
 * 5a281bd/12e2fe2) restaient calculés par idleNguBonuses() mais jamais lus
 * ici -- seul le terme *Flat l'était pour power/bars (le terme *Multiplier
 * de "cap" ci-dessous, lui, était déjà correctement appliqué depuis le
 * début : (raw+flat)*mult). Mis en cohérence avec ce même schéma pour
 * power/bars, au lieu de le laisser à raw+flat sans multiplicateur --
 * c'est aussi exactement la façon dont attackMultiplier/dropMultiplier
 * composent déjà flat et multiplicatif ailleurs dans ce fichier (une base
 * additive suivie d'un ou plusieurs facteurs multiplicatifs).
 */
export function idleNguEffectiveResourceStat(raw, resource, stat) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw || {});
  return idleNguEffectiveResourceStatV1(state, resource, stat);
}

/*
 * 2026-09-24 (audit de composition, pages Energy / Magic / Resource 3 / Experience > Spend EXP) :
 * « Energy Power is limited to a maximum of 1E18 (4.84E18 when using potions) », « Capped at 1 Qi
 * (1E18) before potion effects », Bars « 1E18 (2.2E18 when using an Energy Bar Bar) », Cap « 9E18 ».
 * 4,84 = (2 x 1,1)^2 : le plafond s'applique au TOTAL (achats + bonus de perks, quirks, souhaits,
 * équipement) AVANT les potions / Bar Bar, qui le multiplient ensuite. Le code ne plafonnait que
 * les achats bruts (IDLE_NGU_RESOURCE_PURCHASES.hardCap) : les multiplicateurs les dépassaient sans limite.
 */
const RESOURCE_STAT_HARD_CAPS_V1 = Object.freeze({ power: 1e18, bars: 1e18, cap: 9e18 });

export function idleNguEffectiveResourceStatV1(state, resource, stat) {
  const value = idleNguEffectiveResourceStatUncappedV1(state, resource, stat);
  const hard = RESOURCE_STAT_HARD_CAPS_V1[stat];
  if (!hard || (resource !== "energy" && resource !== "magic" && resource !== "r3")) return value;
  const potionKey = stat === "power" ? `${resource}Power` : (stat === "bars" && resource !== "r3" ? `${resource}Bars` : "");
  const potion = potionKey ? Math.max(1, num(idleSelloutPotionFactorV1(state, potionKey), 1)) : 1;
  return value / potion > hard ? hard * potion : value;
}

function idleNguEffectiveResourceStatUncappedV1(state, resource, stat) {
  const raw = Math.max(0, num(state.resources?.[resource]?.[stat], 0));
  if (resource !== "energy" && resource !== "magic" && resource !== "r3") return raw;
  const bonuses = idleNguBonusesLectureV1(state);
  if (resource === "r3") {
    /* Bonus "base" (Incriminating Evidence (set) : +2 Power, +80K Cap, +2 Bars) ajoutés au brut avant les multiplicateurs. */
    if (stat === "power") return (raw + Math.max(0, num(bonuses.r3PowerFlat, 0))) * Math.max(0, num(bonuses.r3PowerMultiplier, 1));
    if (stat === "bars") return (raw + Math.max(0, num(bonuses.r3BarsFlat, 0))) * Math.max(0, num(bonuses.r3BarsMultiplier, 1));
    if (stat === "cap") return (raw + Math.max(0, num(bonuses.r3CapFlat, 0))) * Math.max(0, num(bonuses.r3CapMultiplier, 1));
    return raw;
  }
  if (stat === "power") {
    const flat = Math.max(0, num(bonuses[`${resource}PowerFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}PowerMultiplier`], 1));
    return (raw + flat) * mult;
  }
  if (stat === "bars") {
    const flat = Math.max(0, num(bonuses[`${resource}BarsFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}BarsMultiplier`], 1));
    return (raw + flat) * mult;
  }
  if (stat === "cap") {
    const flat = Math.max(0, num(bonuses[`${resource}CapFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}CapMultiplier`], 1));
    return (raw + flat) * mult;
  }
  if (stat === "speed") {
    /*
     * Training Set : +2 Energy Speed (bonus de complétion NGU).
     * Le bonus était bien stocké dans adventure.permanent.energySpeedFlat
     * mais aucun consommateur ne le lisait : la génération utilisait
     * directement state.resources.energy.speed. Même chemin pour les
     * multiplicateurs Energy/Magic Speed provenant des objets.
     */
    const flat = Math.max(0, num(bonuses[`${resource}SpeedFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}SpeedMultiplier`], 1));
    return (raw + flat) * mult;
  }
  return raw;
}

export function totalAllocated(state, resource, exceptId = "") {
  let total = 0;
  for (const def of IDLE_NGU_SYSTEMS) {
    if (def.id === exceptId) continue;
    total += Math.max(0, num(state.systems[def.id]?.allocation?.[resource], 0));
  }
  return total;
}

/*
 * Norman (2026-10-11) : retirer (ou remplacer) une pièce qui donne du cap d'Energy / de Magic est refusé si l'énergie (la magie) déjà placée dépasserait le nouveau cap :
 * « Libère X d'énergie avant de retirer cette pièce ». Un joueur qui était déjà au-dessus de son cap avant l'action n'est pas bloqué (rien à protéger de plus).
 */
const SUFFIXES_CAP_V1 = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

function formatCapMessageV1(n) {
  let v = Math.max(0, num(n, 0)), i = 0;
  while (v >= 1000 && i < SUFFIXES_CAP_V1.length - 1) { v /= 1000; i += 1; }
  return (i === 0 ? String(Math.ceil(v)) : v.toFixed(2)) + (i ? " " + SUFFIXES_CAP_V1[i] : "");
}

export function verifierCapApresEquipementV1(state, adventureApres, context) {
  const apres = Object.assign({}, state, { adventure: adventureApres });
  for (const [resource, mot] of [["energy", "d'énergie"], ["magic", "de magie"]]) {
    if (!state.resources?.[resource]) continue;
    if (resource === "magic" && !state.systems.bloodMagic?.unlocked) continue;
    const place = totalAllocated(state, resource) + externalResourceAllocation(context, resource);
    if (place <= 0) continue;
    const capAvant = idleNguEffectiveResourceStatV1(state, resource, "cap");
    const capApres = idleNguEffectiveResourceStatV1(apres, resource, "cap");
    if (capApres < capAvant && place > capApres && place <= capAvant) {
      throw new Error("Libère " + formatCapMessageV1(place - capApres) + " " + mot + " avant de retirer cette pièce.");
    }
  }
}

export function externalResourceAllocation(context, resource) {
  const generic=Math.max(0,num(context?.externalResourceAllocations?.[resource],0));
  const basicTraining=resource === "energy"
    ? Math.max(0,num(context?.basicTrainingEnergyAllocation,0))
    : 0;
  return generic+basicTraining;
}

/*
 * Audit PERF-002 (2026-10-10) : chaque lecture d'une stat effective repassait par la clé du mémo des bonus (JSON de tout l'état, 140 Ko à 450 objets), 150 fois par synchro. Les lectures ci-dessous sont en LECTURE SEULE :
 * elles s'exécutent dans une portée de bonus (le calcul des bonus n'est fait qu'une fois pour la portée ; SOREAL_IDLE_VERIF_BONUS=1 vérifie que l'état n'a pas changé).
 */
function resourceCapacityForCurrent(state,resource,context={}){
  return avecPorteeBonusV1(state,()=>{
    const cap=idleNguEffectiveResourceStatV1(state,resource,"cap");
    return Math.max(0,cap-totalAllocated(state,resource)-externalResourceAllocation(context,resource));
  });
}

export function reconcileResourceCurrents(state,context={}){
  /* Les trois capacités sont lues d'abord (une seule portée de bonus), puis les ressources sont recadrées. */
  const capacites=avecPorteeBonusV1(state,()=>RESOURCE_KEYS.map(resource=>state.resources[resource]?resourceCapacityForCurrent(state,resource,context):0));
  for(let i=0;i<RESOURCE_KEYS.length;i+=1){
    const resource=RESOURCE_KEYS[i];
    const r=state.resources[resource];
    if(!r)continue;
    r.current=clamp(num(r.current,0),0,capacites[i]);
    r.fillProgress=clamp(num(r.fillProgress,0),0,0.999999999999);
    r.generatedThisRun=Math.max(0,num(r.generatedThisRun,0));
  }
}

export function idleNguResourceGenerationPerSecond(raw,resource){
  if(!RESOURCE_KEYS.includes(resource))throw new Error("RESSOURCE_INVALIDE");
  const state=raw&&raw.version===IDLE_NGU_META_VERSION?raw:normalizeIdleNguState(raw||{});
  /* Resource 3 (wiki Resource 3 / Hacks / Wishes) : générée par speed et bars comme Energy et Magic, une fois les Hacks débloqués. */
  if(resource==="r3"&&!state.systems.hacks?.unlocked)return 0;
  if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)return 0;
  const r=state.resources[resource]||defaultResource(resource);
  return avecPorteeBonusV1(state,()=>{
  const speed=clamp(idleNguEffectiveResourceStatV1(state,resource,"speed"),0.1,50);
  /* Continu (Norman, 2026-10-03 : « chaque achat réduit un petit peu le temps nécessaire pour générer la ressource ») : la vitesse est le nombre de remplissages par seconde (50 = 1 par tick), plus de paliers par tick entier. */
  const fillsPerSecond=speed;
  const bars=idleNguEffectiveResourceStatV1(state,resource,"bars");
  return fillsPerSecond*Math.max(1,bars);
  });
}

/*
 * Énergie « obtenue » (2026-09-25, Norman : « quand je rebirth dans NGU, mon maximum d'énergie est de 916 contre 512 dans SOREAL IDLE, en faisant
 * exactement la même chose dans les deux jeux »). Wiki (page Energy) : le cap augmente de 1 « every 20 Energy you get, at every rebirth ». 512 = 500 +
 * ⌊250/20⌋ : SOREAL ne comptait que les 250 points qui remplissaient la réserve jusqu'au cap, puis plus rien, alors que la barre d'énergie de NGU
 * continue de se remplir au cap et que chaque remplissage compte comme énergie obtenue (916 = 500 + ⌊8 3xx/20⌋). generatedThisRun compte donc TOUT
 * ce que la barre produit (bars par remplissage), même la part perdue faute de place ; la réserve, elle, reste plafonnée au cap.
 */
export function advanceGeneratedResources(state,seconds,context={}){
  if(seconds<=0)return;
  for(const resource of ["energy","magic","r3"]){
    if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)continue;
    if(resource==="r3"&&!state.systems.hacks?.unlocked)continue;
    const r=state.resources[resource];
    /* Trois lectures seules, une seule portée de bonus ; l'état n'est modifié qu'après. */
    const [capacity,perSecond,bars]=avecPorteeBonusV1(state,()=>[
      resourceCapacityForCurrent(state,resource,context),
      idleNguResourceGenerationPerSecond(state,resource),
      Math.max(1,idleNguEffectiveResourceStatV1(state,resource,"bars"))
    ]);
    const pleine=capacity<=r.current+1e-12;
    const fillsPerSecond=perSecond/bars;
    const fillTotal=Math.max(0,num(r.fillProgress,0))+fillsPerSecond*seconds;
    const fullFills=Math.floor(fillTotal+1e-12);
    r.fillProgress=clamp(fillTotal-fullFills,0,0.999999999999);
    if(fullFills<=0)continue;
    const possibleGain=fullFills*bars;
    const gain=pleine?0:Math.min(possibleGain,Math.max(0,capacity-r.current));
    r.current+=gain;
    r.generatedThisRun+=possibleGain;
    if(!pleine&&gain+1e-12<possibleGain)r.fillProgress=0;
  }
}

export function idleNguResourceBudget(raw, resource, context = {}) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  const state = raw && raw.version === IDLE_NGU_META_VERSION
    ? raw
    : normalizeIdleNguState(raw, context, raw?.updatedAt || Date.now());
  /* 2026-09-23 (audit) : le cap est le cap EFFECTIF (perks, quirks, wishes, équipement), comme pour la génération. */
  const cap=Math.max(0,idleNguEffectiveResourceStatV1(state,resource,"cap"));
  const allocated=Math.max(0,totalAllocated(state,resource));
  const reservedExternal=externalResourceAllocation(context,resource);
  const current=clamp(num(state.resources?.[resource]?.current,0),0,Math.max(0,cap-allocated-reservedExternal));
  return {
    cap,
    current,
    allocated,
    reservedExternal,
    available:current,
    freeCapacity:Math.max(0,cap-current-allocated-reservedExternal),
    totalHeld:Math.min(cap,current+allocated+reservedExternal)
  };
}

export function setAllocation(state, id, resource, value, context = {}) {
  const def = IDLE_NGU_SYSTEMS.find(x => x.id === id);
  const s = state.systems[id];
  if (!def || !s || !s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if(state.challenge?.active==="noAugmentations"&&id==="augmentations")throw new Error("DEFI_SANS_AUGMENTATIONS");
  if (!def.resources.includes(resource)) throw new Error("RESSOURCE_INCOMPATIBLE");
  if (resource === "magic" && !state.systems.bloodMagic.unlocked) throw new Error("MAGIC_VERROUILLEE");
  /* Blood Magic : l'allocation de Magic est répartie par rituel ; l'ancienne action vise le rituel sélectionné. */
  if (id === "bloodMagic" && resource === "magic") {
    setRitualAllocationV1(state, s.data.activeRitual, value, context);
    return;
  }
  const r=state.resources[resource];
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const previous=Math.max(0,num(s.allocation[resource],0));
  const usedElsewhere = totalAllocated(state, resource, id) + externalResourceAllocation(context,resource);
  const maxByCapacity=Math.max(0,cap-usedElsewhere);
  const maxByOwned=Math.max(0,previous+num(r.current,0));
  const target=clamp(value,0,Math.min(maxByCapacity,maxByOwned));
  const delta=target-previous;
  s.allocation[resource]=target;
  r.current=clamp(num(r.current,0)-delta,0,Math.max(0,cap-usedElsewhere-target));
}

export function reclaimAllocatedResource(state,resource,context={}){
  if(resource!=="energy"&&resource!=="magic")throw new Error("RESSOURCE_INVALIDE");
  if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)throw new Error("MAGIC_VERROUILLEE");
  let released=0;
  for(const def of IDLE_NGU_SYSTEMS){
    const s=state.systems[def.id];
    if(!s?.allocation)continue;
    const amount=Math.max(0,num(s.allocation[resource],0));
    if(amount<=0)continue;
    released+=amount;
    s.allocation[resource]=0;
    if(def.id==="advancedTraining"&&resource==="energy")for(const t of Object.values(s.data?.tracks||{}))t.energy=0;
    if(def.id==="ngu"){clearNguAllocationsV1(s,resource);syncNguAllocationTotalsV1(s);}
    if(def.id==="wishes")clearWishSlotAllocationsV1(s,resource);
    if(def.id==="bloodMagic"&&resource==="magic")for(const r of Object.values(s.data?.rituals||{}))r.magic=0;
  }
  const r=state.resources[resource];
  r.current=clamp(
    num(r.current,0)+released,
    0,
    Math.max(0,idleNguEffectiveResourceStatV1(state,resource,"cap")-externalResourceAllocation(context,resource))
  );
  return {resource,released,current:r.current};
}

export function augmentationGoldCost(state,def,level,upgrade=false) {
  const n=Math.max(1,int(level,0)+1);
  const base=upgrade?def.upgrade.baseGold*n*n:def.baseGold*n;
  return base*challengePermanentBonuses(state).augmentationCostMultiplier;
}

/*
 * allocOverride (2026-09-30, chantier « réactivité ») : durée qu'aurait le niveau à cette allocation d'Energy, sans rien modifier. Toute
 * durée de niveau vaut K / allocation (K ne dépend que du niveau, de la puissance et des multiplicateurs, jamais de l'allocation) : le
 * client reçoit K (secondsK) et recalcule tout seul durée, barre et compte à rebours au moment du clic, sans attendre le serveur.
 */
export function augmentationSecondsForNextLevel(state, def, upgrade = false, allocOverride = null) {
  const modele = augmentationSecondsModelV1(state, def, upgrade, allocOverride);
  if (!modele) return Infinity;
  const pair=state.systems.augmentations.data.pairs?.[def.id]||{};
  return modele(Math.max(1, int(upgrade ? pair.upgradeLevel : pair.level, 0) + 1));
}

/*
 * Durée d'un niveau en fonction du niveau VISÉ, ou null sans ressource allouée. Tous les bonus (puissance, Hacks, Perks, MacGuffins, équipement) ne dépendent pas du niveau : ils sont calculés UNE fois
 * ici. Avant, la boucle de montée de niveaux les recalculait à chaque niveau (jusqu'à 10 000 fois par barre et par appel : plus de 10 s de calcul avec de grosses sommes d'Énergie, le serveur répondait en erreur).
 */
function augmentationSecondsModelV1(state, def, upgrade = false, allocOverride = null) {
  const pair=state.systems.augmentations.data.pairs?.[def.id]||{};
  const perTrack=Math.max(0,num(upgrade?pair.upgradeEnergy:pair.energy,0));
  const legacy=Math.max(0,num(state.systems.augmentations.allocation.energy,0));
  /*
   * Repli « ancienne sauvegarde » (allocation globale d'avant V214) : réservé aux sauvegardes qui n'ont AUCUNE énergie par piste. Avant, il s'appliquait aussi dès que la piste « active » (Ciseaux de sécurité par défaut) n'avait
   * pas d'énergie propre : elle progressait alors avec le TOTAL placé sur les autres pistes (Norman, 2026-10-11 : « la barre Ciseaux de sécurité bouge alors qu'elle n'a pas d'énergie »).
   */
  let energiePistes=0;
  for(const q of Object.values(state.systems.augmentations.data.pairs||{}))energiePistes+=Math.max(0,num(q.energy,0))+Math.max(0,num(q.upgradeEnergy,0));
  let allocation=perTrack>0?perTrack:(
    energiePistes<=0&&
    def.id===state.systems.augmentations.data.activePair &&
    Boolean(upgrade)===Boolean(state.systems.augmentations.data.trainUpgrade)
      ?legacy
      :0
  );
  if(allocOverride!=null)allocation=Math.max(0,num(allocOverride,0));
  if (allocation <= 0) return null;
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power"));
  const base = upgrade ? def.upgrade.baseSeconds : def.baseSeconds;
  const challengeSpeed=challengePermanentBonuses(state).augmentationSpeedMultiplier*idleCardsMultiplierV1(state,"augments"); /* + Cards AUGS */
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "augmentations");
  const gearAugmentSpeed = gearPctV1(gearSpecialsV1(state), "augmentSpeedPct");
  /*
   * 2026-09-24 (audit de composition, page « Augmentations ») : « All
   * Augmentation Upgrades ... cost Base Cost * n² in gold where n is the level
   * you want to upgrade the augment to, and cost Base Cost * n in energy in the
   * same manner as Augmentations » -- le coût en énergie (donc le temps à
   * allocation/puissance égales, « Base Time » = 1er niveau) est multiplié par
   * le niveau visé n, pour l'Augment comme pour son Upgrade. Il était constant.
   */
  const denominateur = Math.max(1e-12, allocation * power * challengeSpeed * gearAugmentSpeed * hackFxV1(state).augmentSpeed * perkBonusesV1(idlePerkNiveauxV1(state)).augmentSpeedMultiplier * macguffinEffectMultiplierV1(state, "augmentSpeed"));
  return (targetLevel) => targetLevel * base * 1000 * difficultyDivider / denominateur;
}

/*
 * Barres alimentées par une ressource (Norman, 2026-10-05) : « quand on ajoute de l'énergie dans une barre, elle ne rattrape pas son retard : elle adopte la nouvelle vitesse, elle finit donc le niveau plus vite, mais pas
 * instantanément (sinon on mettrait une grosse somme, on remplirait le niveau en un coup et on retirerait la somme) ». La progression de ces barres est comptée en SECONDES de la durée du niveau ; quand cette durée change
 * (allocation, puissance, bonus), les secondes déjà accumulées sont remises à l'échelle de la nouvelle durée : c'est la FRACTION de barre qui reste la même. "<clé>Ref" garde la durée à laquelle la progression a été mesurée.
 */
export function rebaserProgressionSecondesV1(porteur, cle, duree) {
  if (!(Number.isFinite(duree) && duree > 0)) return;
  const cleRef = cle + "Ref";
  const ref = num(porteur[cleRef], 0);
  if (ref > 0 && Math.abs(ref - duree) > 1e-9 * Math.max(1, ref)) porteur[cle] = Math.max(0, num(porteur[cle], 0)) * duree / ref;
  porteur[cleRef] = duree;
}

/* Fraction de barre (0 à 1), même quand la durée courante n'existe pas (aucune ressource allouée : la barre garde sa place). */
export function fractionProgressionSecondesV1(porteur, cle, duree) {
  const ref = num(porteur[cle + "Ref"], 0);
  const p = Math.max(0, num(porteur[cle], 0));
  if (ref > 0) return Math.max(0, Math.min(1, p / ref));
  return Number.isFinite(duree) && duree > 0 ? Math.max(0, Math.min(1, p / duree)) : 0;
}

function advanceAugmentationTrackV214_(state,seconds,context,def,pair,upgrade){
  if(num(context.bosses,0)<def.unlockBoss)return;
  if(upgrade&&(!def.upgrade||num(context.bosses,0)<def.upgrade.unlockBoss))return;
  let remaining=seconds,guard=0;
  const progressKey=upgrade?"upgradeProgress":"progress";
  const modele=augmentationSecondsModelV1(state,def,upgrade);
  if(!modele)return;
  const multCout=challengePermanentBonuses(state).augmentationCostMultiplier;
  const limiteDefi=state.challenge?.active==="hundredLevels";
  while(remaining>0&&guard++<10000){
    const level=upgrade?pair.upgradeLevel:pair.level;
    const needed=modele(Math.max(1,int(level,0)+1));
    if(!Number.isFinite(needed))break;
    rebaserProgressionSecondesV1(pair,progressKey,needed);
    const missing=Math.max(0,needed-num(pair[progressKey],0));
    if(remaining+1e-9<missing){pair[progressKey]+=remaining;break;}
    const n=Math.max(1,int(level,0)+1);
    const cost=(upgrade?def.upgrade.baseGold*n*n:def.baseGold*n)*multCout;
    if(state.currencies.gold+1e-9<cost||(limiteDefi&&challengeHundredLevelsRemaining(state)<=0)){
      pair[progressKey]=needed;break;
    }
    remaining-=missing;
    pair[progressKey]=0;
    state.currencies.gold-=cost;
    if(upgrade)pair.upgradeLevel+=1;else pair.level+=1;
    challengeHundredLevelsConsume(state,1);
  }
}

export function advanceAugmentations(state, seconds, context) {
  const s=state.systems.augmentations;
  if(!s.unlocked||seconds<=0)return;
  /*
   * V214 — chaque Augment et son Upgrade disposent de leur propre allocation
   * et progressent en parallèle. L'ancien activePair/trainUpgrade reste
   * uniquement comme migration pour les sauvegardes qui possèdent encore
   * l'allocation globale historique.
   */
  /*
   * Ordre des achats (Norman, 2026-10-10 : « deux niveaux en attente par manque d'Or ; c'est toujours Ciseaux dangereux, qui coûte 250B, qui prend le niveau alors que Boire aussi le lait en demande moins »). Quand l'Or manque pour
   * tout le monde, il arrive d'un coup (rattrapage d'une synchro) : l'ancien ordre fixe (liste des Augments) servait la piste placée en premier, même la plus chère. On sert maintenant la piste dont le PROCHAIN niveau coûte le moins
   * d'Or (égalité : ordre de la liste), pour que chaque pièce d'Or achète le plus de niveaux possible.
   */
  const multCoutAug=challengePermanentBonuses(state).augmentationCostMultiplier;
  const pistesAug=[];
  for(const def of IDLE_NGU_AUGMENTATIONS){
    const pair=s.data.pairs[def.id];
    for(const upgrade of [false,true]){
      const n=Math.max(1,int(upgrade?pair.upgradeLevel:pair.level,0)+1);
      const cout=(upgrade&&def.upgrade?def.upgrade.baseGold*n*n:def.baseGold*n)*multCoutAug;
      pistesAug.push({def,pair,upgrade,cout:Number.isFinite(cout)?cout:Infinity,rang:pistesAug.length});
    }
  }
  pistesAug.sort((x,y)=>x.cout-y.cout||x.rang-y.rang);
  for(const t of pistesAug)advanceAugmentationTrackV214_(state,seconds,context,t.def,t.pair,t.upgrade);
  s.level=Object.values(s.data.pairs).reduce((sum,p)=>sum+p.level+p.upgradeLevel,0);
  s.tempLevel=s.level;
  augApplyTargetsV1(state,context);
}

/*
 * Cibles et « Advance Energy » des Augments (Norman, 2026-10-10 : « dans Augmentations on doit pouvoir faire Advance Energy »), même règle que l'Entraînement avancé : quand une piste atteint son niveau cible, son
 * énergie passe à la piste suivante (dans l'ordre de l'écran : Augment puis son Upgrade, paire après paire) qui est débloquée et n'a pas atteint sa propre cible ; sans suivante, ou sans Advance, elle est rendue.
 */
function augPistesV1(state, context) {
  const bosses = num(context?.bosses, 0);
  const out = [];
  for (const def of IDLE_NGU_AUGMENTATIONS) {
    if (bosses >= def.unlockBoss) out.push({ id: def.id, upgrade: false });
    if (def.upgrade && bosses >= def.upgrade.unlockBoss && bosses >= def.unlockBoss) out.push({ id: def.id, upgrade: true });
  }
  return out;
}

function augCibleAtteinteV1(pair, upgrade) {
  const cible = Math.max(0, Math.floor(num(upgrade ? pair?.upgradeTarget : pair?.target, 0)));
  return cible > 0 && Math.floor(num(upgrade ? pair.upgradeLevel : pair.level, 0)) >= cible;
}

export function augApplyTargetsV1(state, context = {}) {
  const s = state.systems.augmentations;
  if (!s?.unlocked || !s.data?.pairs) return;
  const pistes = augPistesV1(state, context);
  const pairs = s.data.pairs;
  const energie = (p, up) => Math.max(0, num(up ? p.upgradeEnergy : p.energy, 0));
  pistes.forEach((piste, index) => {
    const p = pairs[piste.id];
    if (!p || !augCibleAtteinteV1(p, piste.upgrade) || energie(p, piste.upgrade) <= 0) return;
    const suivante = s.data.advanceEnergy
      ? pistes.slice(index + 1).find(n => pairs[n.id] && !augCibleAtteinteV1(pairs[n.id], n.upgrade))
      : null;
    if (suivante) {
      const q = pairs[suivante.id];
      const cle = suivante.upgrade ? "upgradeEnergy" : "energy";
      q[cle] = energie(q, suivante.upgrade) + energie(p, piste.upgrade);
      p[piste.upgrade ? "upgradeEnergy" : "energy"] = 0;
    } else {
      setAugmentAllocationV214_(state, piste.id, piste.upgrade, 0, context);
    }
  });
  s.allocation.energy = Object.values(pairs).reduce((sum, p) => sum + Math.max(0, num(p.energy, 0)) + Math.max(0, num(p.upgradeEnergy, 0)), 0);
}

export function setAugmentTargetV1(state, pairId, upgrade, value, context = {}) {
  const s = state.systems.augmentations;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const def = IDLE_NGU_AUGMENTATIONS.find(x => x.id === pairId);
  if (!def) throw new Error("AUGMENT_INVALIDE");
  if (num(context.bosses, 0) < def.unlockBoss || (upgrade && (!def.upgrade || num(context.bosses, 0) < def.upgrade.unlockBoss))) throw new Error("AUGMENT_VERROUILLE");
  const cible = clamp(Math.floor(num(value, 0)), 0, 1e9);
  s.data.pairs[pairId][upgrade ? "upgradeTarget" : "target"] = cible;
  augApplyTargetsV1(state, context);
  return { pair: pairId, upgrade: Boolean(upgrade), target: cible };
}

export function setAugmentAdvanceV1(state, enabled, context = {}) {
  const s = state.systems.augmentations;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  s.data.advanceEnergy = Boolean(enabled);
  augApplyTargetsV1(state, context);
  return { advanceEnergy: s.data.advanceEnergy };
}

export function idleNguAugmentationMultiplier(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw);
  if(state.challenge?.active==="noAugmentations")return 1;
  let additive = 0;
  const laserStep = challengePermanentBonuses(state).laserSwordExponentStep;
  const pairs = state.systems.augmentations.data.pairs;
  for (const def of IDLE_NGU_AUGMENTATIONS) {
    const p = pairs[def.id];
    if (!p || p.level <= 0) continue;
    const augmentRank = IDLE_NGU_AUGMENTATIONS.indexOf(def);
    const augment = def.baseMultiplier * safePow(p.level, def.exponent + laserStep * augmentRank);
    const upgrade = 1 + safePow(p.upgradeLevel, 2);
    additive += augment * upgrade;
  }
  const challengePower=challengePermanentBonuses(state).augmentationPowerMultiplier;
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Wiki NGU local, page "SADISTIC difficulty", section "Features" :
   * "For Augmentations, the total Attack/Defense multiplier has an
   * additional strength divider of 1 trillion (1e12), floored at 1. This
   * multiplier includes the contribution from NGU Augments." -- SADISTIC
   * uniquement (jamais mentionné sur la page "Evil difficulty"), et
   * séparé du diviseur de VITESSE de progression déjà appliqué plus haut
   * (augmentationSecondsForNextLevel) : celui-ci divise le résultat
   * (force du bonus), pas la vitesse pour l'obtenir.
   */
  const sadisticStrengthDivider = state.difficulty === "extreme" ? 1e12 : 1;
  return Math.max(1,1+(additive*nguFxV1(state).augments*challengePower)/sadisticStrengthDivider);
}
