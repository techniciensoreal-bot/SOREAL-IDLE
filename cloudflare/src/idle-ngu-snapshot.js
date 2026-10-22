/*
 * NGU : instantané, achats, Money Pit, Défis et récompenses (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { nguActiveTiersV1, IDLE_NGU_TIERS_V1, IDLE_NGU_CATALOG_V1, nguParamsV1, IDLE_NGU_MAX_LEVEL_V1, nguEffectPctV1 } from "./idle-ngu-catalog-v1.js";
import { span } from "./idle-spans-v1.js";
import { IDLE_SELLOUT_SHOP_CATALOG_V1, idleSelloutShopEffectActiveV1, idleSelloutShopNextCostV1, idleSelloutApplyEffectV1 } from "./idle-sellout-shop-v1.js";
import { idleAdventureSnapshotV47, idleAdventureEquipmentStatsV47, idleEquipementEffectifV1, IDLE_ADVENTURE_SPECIALS, idleAdventureAddItemV1, idleAdventureSpecialItemV1, idleAdventureBoostV1, applyIdleAdventureActionV47 } from "./idle-adventure-v47.js";
import { idleCardsSnapshotV1, idleCardsGrantChallengeMayoV1 } from "./idle-cards-v1.js";
import { idleYggIsMayoFruitV1, idleYggFruitUnlockedV1, idleYggExtraSnapshotV1 } from "./idle-yggdrasil-extra-v1.js";
import { macguffinSnapshotV1, macguffinPermanentPctV1 } from "./idle-macguffins-v1.js";
import { IDLE_PERKS_CATALOG_V1, perkBonusesV1, idlePerkByIdV1, idlePerkNextCostV1 } from "./idle-perks-v1.js";
import { idleDifficulteSuffisanteV1, IDLE_PERK_DIFFICULTE_V1, IDLE_QUIRK_DIFFICULTE_V1, idleWishAccessibleV1, idlePerkNiveauxV1, idleWishTracksActifsV1 } from "./idle-difficulty-gates-v1.js";
import { IDLE_QUIRKS_CATALOG_V1, idleQuirkByIdV1, idleQuirkNextCostV1 } from "./idle-quirks-v1.js";
import { idleDaycareSnapshotV1 } from "./idle-daycare-v1.js";
import { idleInventoryAutoSnapshotV1, idleInventoryIdsV1, idleInventoryProcessNewDropsV1 } from "./idle-inventory-auto-v1.js";
import { idleQuestingSnapshotV1 } from "./idle-questing-v1.js";
import { idleLoginCalendarSnapshotV1 } from "./idle-login-calendar-v1.js";
import { idlePortraitsSnapshotV1 } from "./idle-portraits-v1.js";
import { idleCookingSystemSnapshotV1 } from "./idle-cooking-v1.js";
import { idleWandoosXlUnlockedV1 } from "./idle-wandoos-os-v1.js";
import { achievementsSnapshotV1, apBonusMultiplierV1, apWithBonusV1, avecPorteeBonusV1, gearPctV1, gearSpecialsV1, hackFxV1, idleAdventureCombatStatsV1, idleNguAugmentationsVisiblesV1, idleNguBonuses, idleNguBonusesLectureV1, idleNguViderValeursV1, nguFxV1, nguSpeedMultiplierV1, nguTotalLevelsV1, syncIdleNguState, unlockInfo } from "./idle-ngu-bonus.js";
import { augmentationGoldCost, augmentationSecondsForNextLevel, externalResourceAllocation, fractionProgressionSecondesV1, idleNguEffectiveResourceStatV1, idleNguResourceBudget, totalAllocated } from "./idle-ngu-ressources.js";
import { IDLE_NGU_AUGMENTATIONS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_DIGGERS, IDLE_NGU_NEWBIE_OFFERS, IDLE_NGU_RESOURCE_PURCHASES, IDLE_NGU_SYSTEMS, IDLE_NGU_TRACKS, IDLE_NGU_YGG_FRUITS, MIN_REBIRTH_SECONDS, RESOURCE_KEYS, challengeCompletionsV1, challengeDefsForTierV1, challengePermanentBonuses, challengeTierV1, clamp, clone, int, nowMs, num } from "./idle-ngu-catalogues.js";
import { applyRebirthResetV56_, daycareFactorsV1, expShopSnapshotV1, inventoryAutoEnvV1, resourceInfoV1 } from "./idle-ngu-actions.js";
import { IDLE_AT_ORDRE_V1, beardActiveIdsV1, beardSlotsV1, beardTrackUnlocked, bloodMagicViewV1, finiOuNullV1, timeMachineViewV1, wandoosViewV1, wishSlotCountV1, wishSlotsSnapshotV1 } from "./idle-ngu-pistes.js";
import { IDLE_MONEY_PIT_HISTORIQUE_MAX_V1, castBloodSpell, createTrollStateV1, ritualUnlocked, yggMaxTier, yggTierUpgradeCost, apercuYggFruitV1 } from "./idle-ngu-systemes.js";
import { IDLE_WANDOOS_OS_V1, RICH_JERKS_COST_EXP_V1, RICH_JERKS_PCT_PER_LEVEL_V1, idleTheEndFinalHackSnapshotV1 } from "./idle-ngu-etat.js";

function nguSnapshotV1(state, context) {
  const s = state.systems.ngu;
  const active = nguActiveTiersV1(state.difficulty);
  const speeds = { energy: nguSpeedMultiplierV1(state, "energy"), magic: nguSpeedMultiplierV1(state, "magic") };
  const tiers = {};
  /* Anti-spoil (règle n°2, balayage en ligne 2026-10-06) : jamais un palier de difficulté inactif dans la réponse (Evil/Sadistic), ni la liste des NGU tant que le système n'est pas découvert. */
  for (const tier of IDLE_NGU_TIERS_V1) {
    if (!active.includes(tier)) continue;
    if (!s.unlocked) { tiers[tier] = []; continue; }
    tiers[tier] = IDLE_NGU_CATALOG_V1.map(def => {
      const n = s.data.ngus[tier][def.id];
      const params = nguParamsV1(tier, def.id);
      const power = Math.max(1, idleNguEffectiveResourceStatV1(state, def.resource, "power"));
      const alloc = Math.max(0, num(n.allocation, 0));
      const rate = alloc * power * speeds[def.resource];
      const perLevel = params.baseCost * (n.level + 1);
      return {
        id: def.id,
        name: def.name,
        effect: def.effect,
        resource: def.resource,
        level: n.level,
        allocation: alloc,
        target: Math.max(0, Math.floor(num(n.target, 0))),
        progress: n.level >= IDLE_NGU_MAX_LEVEL_V1 ? 0 : Math.max(0, Math.min(1, n.work / (n.level + 1))),
        effectPct: nguEffectPctV1(tier, def.id, n.level),
        secondsPerLevel: rate > 0 ? perLevel / rate : null,
        baseCost: params.baseCost
      };
    });
  }
  return {
    tier: s.data.tier,
    activeTiers: active,
    maxLevel: IDLE_NGU_MAX_LEVEL_V1,
    unlocked: Boolean(s.unlocked),
    magicUnlocked: Boolean(state.systems.bloodMagic?.unlocked),
    advance: { energy: Boolean(s.data.advance?.energy), magic: Boolean(s.data.advance?.magic) },
    speedMultiplier: speeds,
    tiers,
    effects: clone(nguFxV1(state))
  };
}

export function idleNguSnapshot(raw, context = {}, now = Date.now()) {
  const state = syncIdleNguState(raw, context, now);
  /* L'état est avancé : la suite ne fait que le LIRE pour construire la vue du client (portée de bonus : voir idleNguBonuses). */
  return avecPorteeBonusV1(state, () => span("snapshot:construire", () => construireSnapshotNguV1(state, context, now)));
}

function construireSnapshotNguV1(state, context, now) {
  return {
    version: state.version,
    saveSchema: state.saveSchema,
    resources: Object.fromEntries(Object.entries(clone(state.resources)).map(([id, r]) => [
      id,
      { ...r, capBase: r.cap, cap: idleNguEffectiveResourceStatV1(state, id, "cap") }
    ])),
    resourceInfo: Object.fromEntries(
      RESOURCE_KEYS.filter(resource => !(resource === "magic" && !state.systems.bloodMagic?.unlocked) && !(resource === "r3" && !state.systems.hacks?.unlocked))
        .map(resource => [resource, resourceInfoV1(state, resource, context)])
    ),
    resourceBudget: Object.fromEntries(
      RESOURCE_KEYS.map(resource=>[resource,idleNguResourceBudget(state,resource,context)])
    ),
    currencies: clone(state.currencies),
    records: clone(state.records),
    rebirth: clone(state.rebirth),
    difficulty: state.difficulty,
    difficultyPeaks: clone(state.difficultyPeaks),
    /* difficultyUnlockRequirements et earlyGameTimeline ne sont plus envoyés au client (audit du 2026-10-10, IDLE-AUDIT-GP-002) : le client ne les lit pas, et ils listaient les boss à battre pour débloquer chaque système. */
    challenge: clone(state.challenge),
    challengeDefinitions: challengeSnapshotDefinitions(state,context),
    challengeBonuses: challengePermanentBonuses(state),
    bank: clone(state.bank),
    /*
     * 4G's Sellout Shop : le client ne doit jamais recalculer une formule
     * de coût lui-même — chaque entrée porte déjà son coût réel pour le
     * PROCHAIN achat (ou null si au plafond), calculé ici une seule fois.
     */
    selloutShop: {
      purchases: clone(state.selloutShop.purchases),
      unlockedEver: Boolean(state.selloutShop.unlockedEver),
      /* Anti-spoil (règle n°2, balayage en ligne 2026-10-06) : pas de catalogue tant que la boutique n'est pas ouverte ; jamais un achat réservé à une difficulté supérieure en Normal (sauf déjà acheté). */
      catalog: IDLE_SELLOUT_SHOP_CATALOG_V1.filter((item) => state.selloutShop.unlockedEver && !(item.minDifficulty && (state.difficulty || "normal") === "normal" && int(state.selloutShop.purchases[item.id], 0) === 0)).map((item) => {
        const purchased = Math.max(0, int(state.selloutShop.purchases[item.id], 0));
        return {
          id: item.id,
          category: item.category,
          name: item.name,
          effect: item.effect,
          max: item.max,
          qty: item.qty || 0,
          purchased,
          /* ANTI-SPOIL : un achat réservé à une difficulté supérieure (emplacement d'accessoire maléfique) n'apparaît pas tant que le joueur est en Normal (sauf s'il l'a déjà acheté) ; son texte révélerait la difficulté. */
          effectActive: idleSelloutShopEffectActiveV1(item) && !(item.minDifficulty && (state.difficulty || "normal") === "normal" && purchased === 0),
          nextCost: idleSelloutShopNextCostV1(item, purchased)
        };
      })
    },
    bonuses: idleNguBonuses(state),
    adventure: (() => {
      /*
       * Norman (2026-09-11) : "le mode aventure est déjà débloqué [après un
       * Rebirth]... il ne doit se débloquer qu'au niveau habituel." Vérifié
       * contre le wiki NGU (page "Rebirths") : "Access to the Adventure...
       * tabs [is lost] until their related bosses are beaten... Bosses
       * fought (you go back to boss 1)." L'hypothèse inverse ci-dessous
       * (permanence via records.highestBoss) n'a jamais été vérifiée contre
       * le wiki et était fausse — seuls l'Inventaire et la Collection
       * restent permanents après un Rebirth, pas l'Aventure. `context.bosses`
       * (compteur du RUN EN COURS, remis à 0 à chaque Renaissance) est donc
       * la SEULE source à utiliser ici, exactement comme le jeu réel.
       */
      const snap = idleAdventureSnapshotV47(state.adventure, num(context.bosses, 0), state.difficulty, state.difficultyPeaks);
      const gearReel = snap.stats || idleAdventureEquipmentStatsV47(state.adventure);
      const defiSansEquipement = state.challenge?.active === "noEquipment";
      const gear = defiSansEquipement ? idleEquipementEffectifV1(state) : gearReel;
      snap.stats = idleAdventureCombatStatsV1(gear, context, idleNguBonuses(state));
      /*
       * Ce qui fait partie de « toi » (Norman, 2026-10-17 : « les statistiques du Money Pit et des autres systèmes sont "nous" : je les veux comptées comme valeur de base, 572 directement, pas 15 (+557) ») : les stats SANS l'équipement
       * ni le Cube. L'écran les affiche comme valeur de base ; seuls l'équipement (vert) et le Cube (mauve) restent entre parenthèses.
       */
      {
        const sansEquip = defiSansEquipement ? snap.stats : idleAdventureCombatStatsV1(idleEquipementEffectifV1({ challenge: { active: "noEquipment" } }), context, idleNguBonuses(state));
        /* Chance de drop (Norman, 2026-10-19) : la base est de 100 % ; le multiplicateur TOTAL réellement appliqué au butin (équipement, cartes, MacGuffins, Money Pit, Perks, NGU, Yggdrasil, Blood Spaghetti…) est exposé pour afficher « 100 % (+X %) ». */
        snap.dropChance = { base: 1, total: Math.max(0, num(idleNguBonuses(state).dropMultiplier, 1)) };
        snap.statsSansEquipement = { power: num(sansEquip.power, 0), toughness: num(sansEquip.toughness, 0), hp: num(sansEquip.hp, 0), regen: num(sansEquip.regen, 0) };
      }
      /* Défi sans équipement : ce que l'équipement porté DONNERAIT (barré à l'écran, jamais compté) ; absent hors du défi. */
      if (defiSansEquipement) {
        const reel = idleAdventureCombatStatsV1(gearReel, context, idleNguBonuses(state));
        /* Équipement (vert) et Cube (mauve) restent deux chiffres séparés à l'écran (Norman, 2026-10-17) : la part du Cube est retirée de celle de l'équipement. */
        const cubeP = Math.max(0, num(reel.cubePowerContribution, 0)), cubeT = Math.max(0, num(reel.cubeToughnessContribution, 0));
        const ecart = (k, cube) => Math.max(0, num(reel[k], 0) - num(snap.stats[k], 0) - cube);
        snap.statsEquipementBloque = { power: ecart("power", cubeP), toughness: ecart("toughness", cubeT), hp: ecart("hp", 0), regen: ecart("regen", 0) };
        snap.statsCubeBloque = { power: cubeP, toughness: cubeT };
      }
      /* Anti-spoil (règle n°2, balayage en ligne 2026-10-06 : la réponse d'un joueur neuf contenait les 33 zones et les 12 titans, noms, boss et puissances compris) :
         jamais une zone encore fermée (sauf celle en cours) ni un titan pas encore atteignable dans la réponse. */
      if (Array.isArray(snap.zones)) snap.zones = snap.zones.filter(z => z.unlocked || z.id === snap.selectedZone || z.id === snap.lastCombatZone);
      if (Array.isArray(snap.titans)) {
        /* Exception décidée par Norman (2026-10-10) à la règle n°2 : le bouton « Titans » est visible avant l'accès, en « ??? », avec le seul boss à vaincre pour l'obtenir (le premier titan). Un simple nombre : la liste, elle, reste filtrée. */
        const prochains = snap.titans.filter(t => !t.progressionUnlocked && num(t.state && t.state.kills, 0) <= 0).map(t => num(t.boss, 0)).filter(b => b > 0).sort((x, y) => x - y);
        snap.titans = snap.titans.filter(t => t.progressionUnlocked || num(t.state && t.state.kills, 0) > 0);
        snap.titansAccesBoss = snap.titans.length ? 0 : (prochains[0] || 0);
      }
      return snap;
    })(),
    /*
     * Advanced Training (Norman, 2026-10-03 : « il faut des barres comme dans le jeu d'origine, les calculs doivent être bons ») : de quoi animer chaque barre côté client avec LES MÊMES
     * formules que le moteur (advanceAdvancedTrainingV1). Une compétence avance de rateParEnergie × énergie allouée unités de travail par seconde ; le niveau n (n = niveau temporaire + 1)
     * demande n unités ; 50 niveaux par seconde au plus ; avec le souhait « I wish I was f**king done with Advanced Training forever! » (190), toutes avancent à 50 niveaux/s sans énergie.
     */
    advancedTrainingView: (() => {
      const sysAt = state.systems.advancedTraining;
      if (!sysAt?.unlocked) return null;
      const sqrtPower = Math.sqrt(Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power")));
      const gear = gearPctV1(gearSpecialsV1(state), "advancedTrainingPct");
      const pistes = {};
      for (const id of IDLE_AT_ORDRE_V1) {
        const base = (id === "wandoosEnergy" || id === "wandoosMagic") ? 20000 : 10000;
        pistes[id] = { baseSeconds: base, rateParEnergie: (sqrtPower * gear) / (base * 1000) };
      }
      return { gratuit: wishLevelV1(state, 190) >= 1, racinePuissance: sqrtPower, vitesseEquipement: gear, pistes };
    })(),
    /*
     * Audit 2026-09-13 (Norman) : "Le menu augmentation ne possède pas de
     * barres qui montent comme dans basic training." Basic Training expose
     * déjà skill.progress (0-1) pour animer une barre de remplissage —
     * Augmentations exposait seulement level/upgradeLevel (un nombre entier
     * qui saute), jamais la progression continue vers le niveau suivant.
     * progressPct/upgradeProgressPct réutilisent la même formule de temps
     * déjà utilisée pour VRAIMENT faire progresser le niveau
     * (augmentationSecondsForNextLevel), jamais un second calcul inventé
     * côté client.
     */
    augmentations: idleNguAugmentationsVisiblesV1(context).map((def) => {
      /* La paire encore verrouillée montrée en dernier n'est qu'un repère opaque (le client affiche « ??? ») : aucune de ses données n'est calculée ni envoyée. */
      if (def.verrouille) return def;
      const pair = state.systems.augmentations.data.pairs?.[def.id] || {};
      const neededMain = augmentationSecondsForNextLevel(state, def, false);
      const neededUpgrade = def.upgrade ? augmentationSecondsForNextLevel(state, def, true) : Infinity;
      /*
       * 2026-09-24 (Norman : « les barres se remplissent à fond mais ne repartent pas de 0 ») : wiki, page Augmentations, « Each augment
       * level costs gold ». advanceAugmentationTrackV214_ garde la barre PLEINE tant que l'Or du prochain niveau manque : le client doit
       * le dire (coût, attente) au lieu de laisser croire à un bug. Coûts = augmentationGoldCost, la même fonction que l'achat réel.
       */
      const goldCost = augmentationGoldCost(state, def, num(pair.level, 0), false);
      const upgradeGoldCost = def.upgrade ? augmentationGoldCost(state, def, num(pair.upgradeLevel, 0), true) : null;
      const gold = num(state.currencies?.gold, 0);
      const defiBloque = challengeHundredLevelsRemaining(state) <= 0;
      const fractionMain = fractionProgressionSecondesV1(pair, "progress", neededMain);
      const fractionUpgrade = fractionProgressionSecondesV1(pair, "upgradeProgress", neededUpgrade);
      const attenteOr = (needed, fraction, cost) => Number.isFinite(needed) && needed > 0 && fraction >= 1 - 1e-9 && (gold + 1e-9 < cost || defiBloque);
      return Object.assign({}, def, {
        goldCost,
        upgradeGoldCost,
        waitingGold: attenteOr(neededMain, fractionMain, goldCost),
        upgradeWaitingGold: upgradeGoldCost != null && attenteOr(neededUpgrade, fractionUpgrade, upgradeGoldCost),
        target: Math.max(0, Math.floor(num(pair.target, 0))),
        upgradeTarget: Math.max(0, Math.floor(num(pair.upgradeTarget, 0))),
        progressPct: fractionMain,
        upgradeProgressPct: fractionUpgrade,
        progressFraction: fractionMain,
        upgradeProgressFraction: fractionUpgrade,
        secondsPerLevel: Number.isFinite(neededMain) ? neededMain : null,
        upgradeSecondsPerLevel: Number.isFinite(neededUpgrade) ? neededUpgrade : null,
        /* Chantier « réactivité » : durée du niveau à 1 Energy (K) et progression en secondes -> le client recalcule seul au clic. */
        secondsK: finiOuNullV1(augmentationSecondsForNextLevel(state, def, false, 1)),
        upgradeSecondsK: def.upgrade ? finiOuNullV1(augmentationSecondsForNextLevel(state, def, true, 1)) : null,
        progressSeconds: Number.isFinite(neededMain) ? fractionMain * neededMain : Math.max(0, num(pair.progress, 0)),
        upgradeProgressSeconds: Number.isFinite(neededUpgrade) ? fractionUpgrade * neededUpgrade : Math.max(0, num(pair.upgradeProgress, 0)),
        levelsPerSecond: Number.isFinite(neededMain) && neededMain > 0 ? Math.min(50,1/neededMain) : 0,
        upgradeLevelsPerSecond: Number.isFinite(neededUpgrade) && neededUpgrade > 0 ? Math.min(50,1/neededUpgrade) : 0
      });
    }),
    augmentationsAdvance: Boolean(state.systems.augmentations?.data?.advanceEnergy),
    /* Préférences d'interface liées au compte (idle-ui-prefs-v1.js) : le client les remet dans son stockage local. */
    uiPrefs: Object.assign({}, state.uiPrefs || {}),
    ngus: nguSnapshotV1(state, context),
    /* Slots de souhaits (page Wishes, 4 au maximum) : un souhait et une allocation par slot. */
    wishSlots: wishSlotsSnapshotV1(state),
    cards: idleCardsSnapshotV1(state),
    /* Anti-spoil (AGENTS.md règle n°2, 2026-09-29) : jamais un rituel encore verrouillé dans la liste -- sa simple présence (nom, coût, taille de la liste) révélerait ce qui reste à débloquer. */
    /* Rien tant que Blood Magic n'est pas découvert (audit du 2026-10-10, IDLE-AUDIT-GP-002) : un rituel sans drapeau de déblocage était listé même système verrouillé. */
    bloodRituals: state.systems.bloodMagic?.unlocked ? clone(IDLE_NGU_BLOOD_RITUALS.filter(def => ritualUnlocked(def, context, state))) : [],
    bloodMagicView: bloodMagicViewV1(state),
    yggFruits: clone(IDLE_NGU_YGG_FRUITS.filter(def => (state.systems.yggdrasil?.unlocked || num(state.systems.yggdrasil?.data?.fruits?.[def.id]?.tier, 0) > 0) && (!idleYggIsMayoFruitV1(def.id) || idleYggFruitUnlockedV1(state, def.id) || num(state.systems.yggdrasil?.data?.fruits?.[def.id]?.tier, 0) > 0))),
    /* Yggdrasil : Poop, Auto-Activate, durée d'un tier, coût du prochain tier (idle-yggdrasil-extra-v1.js). */
    yggExtra: idleYggExtraSnapshotV1(state, IDLE_NGU_YGG_FRUITS, { maxTier: yggMaxTier(state), tierCost: yggTierUpgradeCost, apercu: (def, f, poopFactor) => apercuYggFruitV1(state, def, f, poopFactor) }),
    /* Anti-spoil : la liste des mineurs n'existe pas tant que le système n'est pas découvert. */
    diggerDefinitions: state.systems.diggers?.unlocked ? clone(IDLE_NGU_DIGGERS) : [],
    /* MacGuffin Fragments : catalogue, slots, compteurs et bonus permanents (idle-macguffins-v1.js). */
    macguffins: macguffinSnapshotV1(state, nowMs(now)),
    /*
     * Audit 2026-09-14 (mission fidélité wiki) : buyPerkV1/buyQuirkV1
     * (plus haut dans ce fichier) exigent un perkId/quirkId précis depuis
     * longtemps (migration Perks d'une session antérieure, puis Quirks ce
     * soir), mais AUCUN des deux catalogues (IDLE_PERKS_CATALOG_V1,
     * IDLE_QUIRKS_CATALOG_V1) n'était exposé au client — qui n'avait donc
     * structurellement aucun moyen de savoir quels perks/quirks existent,
     * ni de construire un bouton d'achat avec le bon id. Résultat en jeu :
     * le seul bouton existant ("Acheter une Maîtrise"/"Acheter une
     * Procédure", Soreal_Idle_UI.html) envoyait l'action sans aucun id,
     * échouant systématiquement (PERK_INTROUVABLE/QUIRK_INTROUVABLE).
     * Mêmes gabarit et clé que diggerDefinitions ci-dessus.
     */
    /* Wiki : les Perks et Quirks « Evil only » / « Sadistic only » n'existent qu'à partir de cette difficulté (déjà possédés : gardés, inactifs). */
    perkDefinitions: clone(IDLE_PERKS_CATALOG_V1.filter(p => (state.systems.perks?.unlocked || num(state.systems.perks?.data?.levels?.[p.id], 0) > 0) && idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, p.id, state.difficulty) || num(state.systems.perks?.data?.levels?.[p.id], 0) > 0)),
    quirkDefinitions: clone(IDLE_QUIRKS_CATALOG_V1.filter(q => (state.systems.quirks?.unlocked || num(state.systems.quirks?.data?.levels?.[q.id], 0) > 0) && idleDifficulteSuffisanteV1(IDLE_QUIRK_DIFFICULTE_V1, q.id, state.difficulty) || num(state.systems.quirks?.data?.levels?.[q.id], 0) > 0)),
    /* Item Daycare : slots, objets placés (progression, ETA) et objets de l'inventaire plaçables. */
    daycare: idleDaycareSnapshotV1(state.systems.daycare.data, state.adventure, daycareFactorsV1(state)),
    /* Automatisation de l'inventaire : déblocages, réglages, minuteurs, slots d'automerge, loadouts, filtre. */
    inventoryAuto: idleInventoryAutoSnapshotV1(state.adventure, inventoryAutoEnvV1(state)),
    /* Questing (crochet 4/4) : état de quête prêt à afficher (idle-questing-v1.js). */
    questing: state.systems.questing?.unlocked ? idleQuestingSnapshotV1(state, questingEnvV1(state, context)) : { unlocked: false },
    /*
     * Audit 2026-09-16 : le client n'avait aucun moyen de connaître le coût
     * EXP/plafond des achats Spend EXP (energy/magic/r3) — jamais exposé
     * avant, uniquement utilisé côté serveur par buyResource(). Même
     * gabarit que perkDefinitions/quirkDefinitions ci-dessus : un catalogue
     * statique cloné, jamais une formule recalculée côté client.
     */
    resourcePurchases: clone(IDLE_NGU_RESOURCE_PURCHASES),
    expShop: expShopSnapshotV1(state),
    /* Resource 3 Name Randomizer : disponible dès l'achat ; le nom n'est envoyé que si le réglage est coché. */
    r3NomDisponible: Boolean(state.selloutShop?.purchases?.resource3NameRandomizer),
    r3Nom: state.r3Nom?.actif && state.selloutShop?.purchases?.resource3NameRandomizer ? String(state.r3Nom.nom || "") : "",
    /* Achievements (2026-09-24) : catalogue, succès débloqués, BP et facteur AP (idle-achievements-v1.js). */
    achievements: achievementsSnapshotV1(state),
    /* Écran Broken Time Machine (facteurs du GPS, barres, niveaux cibles). */
    timeMachineView: state.systems.timeMachine?.unlocked ? timeMachineViewV1(state) : null,
    wandoosView: state.systems.wandoos?.unlocked ? wandoosViewV1(state, now) : null,
    /* Calendrier de connexion (Money Pit) : seulement une fois le Money Pit découvert (idle-login-calendar-v1.js). */
    loginCalendar: state.systems.moneyPit?.unlocked ? idleLoginCalendarSnapshotV1(state.records.loginCalendar, nowMs(now)) : null,
    /* Player Portraits : portraits débloqués, choix courant, Special Prize (idle-portraits-v1.js). */
    portraits: idlePortraitsSnapshotV1(state.records.portrait, portraitEnvV1(state), num(state.records.specialPrizeClaimed, 0) > 0, num(state.records.specialPrizeChoice, 0)),
    richJerks: {
      attackLevel: Math.max(0, int(state.bonuses.richJerksAttackLevel, 0)),
      defenseLevel: Math.max(0, int(state.bonuses.richJerksDefenseLevel, 0)),
      cost: RICH_JERKS_COST_EXP_V1,
      pctPerLevel: RICH_JERKS_PCT_PER_LEVEL_V1
    },
    /*
     * Audit 2026-09-17 (Newbie Offers / achats en lot / verrou boss 17,
     * capture Norman du vrai shop) : le client ne doit jamais recalculer
     * lui-même si Power/Cap sont débloqués (resourcePurchaseUnlocked lit
     * context.bosses, la même convention que IDLE_NGU_SYSTEMS) ni quelles
     * Newbie Offers restent disponibles — les deux sont donc précalculés
     * ici, même principe que resourcePurchases/selloutShop ci-dessus.
     */
    resourcePurchaseUnlock: Object.fromEntries(RESOURCE_KEYS.map(resource => [
      resource,
      Object.fromEntries(Object.keys(IDLE_NGU_RESOURCE_PURCHASES[resource]).map(stat => {
        const purchase = IDLE_NGU_RESOURCE_PURCHASES[resource][stat];
        return [stat, {
          unlocked: resourcePurchaseUnlocked(purchase, context),
          neededBosses: num(purchase.unlockBoss, 0)
        }];
      }))
    ])),
    newbieOffers: {
      catalog: clone(IDLE_NGU_NEWBIE_OFFERS),
      used: clone(state.records.newbieOffersUsed || [])
    },
    /* Anti-spoil (règle n°2, balayage en ligne 2026-10-06) : un système encore verrouillé n'expose ni son nom, ni son icône, ni ce qui le débloque (objet, boss, Rebirths), ni ses pistes. */
    systems: IDLE_NGU_SYSTEMS.map(def => { const ferme = !state.systems[def.id]?.unlocked; return {
      id: def.id,
      name: ferme ? "" : def.name,
      icon: ferme ? "" : def.icon,
      kind: def.kind,
      resources: def.resources.slice(),
      unlock: ferme ? { unlocked: false } : unlockInfo(def, state, context),
      ...(def.id === "hacks" ? { finalHack: idleTheEndFinalHackSnapshotV1(state) } : {}),
      tracks: ferme ? [] : (IDLE_NGU_TRACKS[def.id] || []).filter(track => def.id !== "wishes" || idleWishAccessibleV1(state, track.id) || num(state.systems.wishes?.data?.tracks?.[track.id]?.level, 0) > 0).map(track => ({
        ...track,
        unlocked: def.id !== "beards" || beardTrackUnlocked(state, track),
        state: clone(state.systems[def.id].data.tracks?.[track.id] || { level: 0, tempLevel: 0, permanentLevel: 0, progress: 0 }),
        active: def.id === "beards"
          ? beardActiveIdsV1(state).includes(track.id)
          : def.id === "wishes"
            ? (state.systems.wishes.data.slots || []).slice(0, wishSlotCountV1(state)).some(x => x.wish === track.id)
            : state.systems[def.id].data.activeTrack === track.id
      })),
      /* Cooking : vue publique, sans les cibles secrètes du repas. */
      state: ferme ? idleNguViderValeursV1(state.systems[def.id]) : (def.id === "cooking" ? idleCookingSystemSnapshotV1(state, nowMs(now)) : clone(state.systems[def.id]))
    }; })
  };
}

/*
 * Vrai NGU ("REACH BOSS 17 FOR MORE PURCHASES HERE!", capture Norman) :
 * Power/Cap restent verrouillés (pas de bouton, message de palier à la
 * place) tant que le boss du RUN EN COURS n'a pas atteint le seuil. Réutilise
 * exactement la même convention que IDLE_NGU_SYSTEMS/unlockSatisfied
 * (context.bosses, remis à 0 à chaque Renaissance comme les autres
 * déblocages de systèmes) plutôt que le tracker permanent
 * state.records.highestBoss (qui sert un autre besoin : le bonus FTBE,
 * jamais remis à 0). purchase.unlockBoss est absent (undefined) sur
 * speed/bars, donc toujours considéré débloqué pour ces deux stats.
 */
function resourcePurchaseUnlocked(purchase, context) {
  const needed = num(purchase?.unlockBoss, 0);
  return needed <= 0 || num(context?.bosses, 0) >= needed;
}

export function buyResource(state, resource, stat, quantity, context = {}) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  if (!["speed", "power", "cap", "bars"].includes(stat)) throw new Error("STAT_RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic.unlocked) throw new Error("MAGIC_VERROUILLEE");
  if (resource === "r3" && !state.systems.hacks.unlocked) throw new Error("R3_VERROUILLEE");
  const purchase=IDLE_NGU_RESOURCE_PURCHASES[resource]?.[stat];
  if (!purchase) throw new Error("ACHAT_RESSOURCE_INDISPONIBLE");
  if (!resourcePurchaseUnlocked(purchase, context)) throw new Error("ACHAT_VERROUILLE_BOSS");
  /*
   * Achat en lot (capture Norman : "+1 for 80 EXP" / "+10 for 800 EXP" /
   * "+100 for 8000 EXP", plus le montant personnalisé de droite) : une seule
   * vérification EXP_INSUFFISANTE pour tout le lot, jamais un achat partiel
   * si le joueur n'a pas assez pour la quantité demandée en entier.
   */
  const qty = Math.floor(num(quantity, 1));
  if (!Number.isFinite(qty) || qty < 1) throw new Error("QUANTITE_INVALIDE");
  const r = state.resources[resource];
  if (num(r[stat],0) >= purchase.hardCap - 1e-12) throw new Error("STAT_RESSOURCE_MAX");
  const totalCost = purchase.cost * qty;
  const totalGain = purchase.gain * qty;
  if (state.currencies.experience < totalCost) throw new Error("EXP_INSUFFISANTE");
  state.currencies.experience -= totalCost;
  r.spentExp += totalCost;
  r[stat] = Math.min(purchase.hardCap, num(r[stat],0) + totalGain);
  return { resource, stat, quantity: qty, cost: totalCost, gain: totalGain, value: r[stat] };
}

/*
 * NGU Spend EXP "Newbie Offers" (IDLE_NGU_NEWBIE_OFFERS ci-dessus) : achat
 * distinct de buyResource — un id stable, achetable une seule fois PAR
 * COMPTE (jamais remis en jeu par une Renaissance, cf commentaire sur
 * records.newbieOffersUsed dans baseState()).
 */
export function buyNewbieOffer(state, resource, stat, offerId) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  if (!["speed", "power", "cap", "bars"].includes(stat)) throw new Error("STAT_RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic.unlocked) throw new Error("MAGIC_VERROUILLEE");
  if (resource === "r3" && !state.systems.hacks.unlocked) throw new Error("R3_VERROUILLEE");
  const id = String(offerId || "");
  const offer = (IDLE_NGU_NEWBIE_OFFERS[resource]?.[stat] || []).find(o => o.id === id);
  if (!id || !offer) throw new Error("OFFRE_INTROUVABLE");
  if (state.records.newbieOffersUsed.includes(id)) throw new Error("OFFRE_DEJA_UTILISEE");
  const hardCap = num(IDLE_NGU_RESOURCE_PURCHASES[resource]?.[stat]?.hardCap, Infinity);
  const r = state.resources[resource];
  if (num(r[stat],0) >= hardCap - 1e-12) throw new Error("STAT_RESSOURCE_MAX");
  if (state.currencies.experience < offer.cost) throw new Error("EXP_INSUFFISANTE");
  state.currencies.experience -= offer.cost;
  r.spentExp += offer.cost;
  r[stat] = Math.min(hardCap, num(r[stat],0) + offer.gain);
  state.records.newbieOffersUsed = state.records.newbieOffersUsed.concat([id]);
  return { resource, stat, offerId: id, cost: offer.cost, gain: offer.gain, value: r[stat] };
}

export function selectTrack(state, id, trackId) {
  const s = state.systems[id];
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const trackDef = (IDLE_NGU_TRACKS[id] || []).find(x => x.id === trackId);
  if (!trackDef) throw new Error("PISTE_INVALIDE");
  if (
    id === "advancedTraining" &&
    (trackId === "wandoosEnergy" || trackId === "wandoosMagic") &&
    !state.systems.wandoos?.unlocked
  ) throw new Error("SYSTEME_VERROUILLE");
  if (id === "beards" && !beardTrackUnlocked(state, trackDef)) {
    throw new Error("PISTE_VERROUILLEE");
  }
  if (id === "beards") {
    const list = Array.isArray(s.data.activeTracks) ? s.data.activeTracks.slice() : (s.data.activeTrack ? [s.data.activeTrack] : []);
    const idx = list.indexOf(trackId);
    if (idx >= 0) list.splice(idx, 1);
    else {
      list.push(trackId);
      while (list.length > beardSlotsV1(state)) list.shift();
    }
    s.data.activeTracks = list;
    s.data.activeTrack = list[list.length - 1] || "";
    s.active = list.length > 0;
    return;
  }
  s.data.activeTrack = trackId;
}

/*
 * Wiki NGU (page "Wandoos", section "Using Wandoos") : "Wandoos Energy
 * and Magic levels are lost when: ...Switching between the different
 * Wandoos OSes (98, MEH and XL)." Changer d'OS repart donc à zéro sur les
 * Dump levels courants, mais jamais sur osLevels (niveau d'OS permanent,
 * partagé entre les 3 OS -- "regardless of which OS is currently being
 * used").
 */
export function selectWandoosOs(state, osId) {
  const s = state.systems.wandoos;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!IDLE_WANDOOS_OS_V1[osId]) throw new Error("OS_INVALIDE");
  /* Wiki Wandoos : Wandoos MEH se débloque en complétant le set Jake. */
  if (osId === "meh" && !state.adventure?.setRewards?.wandoosMeh) throw new Error("OS_VERROUILLE");
  /* Fiche "A busted copy of Wandoos XL" : l'OS XL se débloque en consommant une copie (idle-wandoos-os-v1.js). */
  if (osId === "xl" && !idleWandoosXlUnlockedV1(state)) throw new Error("OS_VERROUILLE");
  if (s.data.os === osId) return;
  s.data.os = osId;
  s.data.dumpEnergyLevel = 0;
  s.data.dumpMagicLevel = 0;
  s.data.dumpEnergyProgress = 0;
  s.data.dumpMagicProgress = 0;
  s.level = 0;
  s.tempLevel = 0;
}

export function setAugmentAllocationV214_(state,pairId,upgrade,value,context={}){
  const s=state.systems.augmentations;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=IDLE_NGU_AUGMENTATIONS.find(x=>x.id===pairId);
  if(!def)throw new Error("AUGMENT_INVALIDE");
  if(num(context.bosses,0)<def.unlockBoss||upgrade&&num(context.bosses,0)<def.upgrade.unlockBoss)throw new Error("AUGMENT_VERROUILLE");
  const pair=s.data.pairs[pairId];
  const key=upgrade?"upgradeEnergy":"energy";
  const previous=Math.max(0,num(pair[key],0));
  const cap=Math.max(0,idleNguEffectiveResourceStatV1(state,"energy","cap"));
  let allocatedTracks=0;
  for(const p of Object.values(s.data.pairs||{}))allocatedTracks+=Math.max(0,num(p.energy,0))+Math.max(0,num(p.upgradeEnergy,0));
  const otherSystems=totalAllocated(state,"energy","augmentations")+externalResourceAllocation(context,"energy");
  const maxByCapacity=Math.max(0,cap-otherSystems-(allocatedTracks-previous));
  const maxByOwned=Math.max(0,previous+num(state.resources.energy.current,0));
  const target=clamp(value,0,Math.min(maxByCapacity,maxByOwned));
  state.resources.energy.current=clamp(num(state.resources.energy.current,0)-(target-previous),0,cap);
  pair[key]=target;
  s.allocation.energy=Object.values(s.data.pairs||{}).reduce((sum,p)=>sum+Math.max(0,num(p.energy,0))+Math.max(0,num(p.upgradeEnergy,0)),0);
}

export function selectAugment(state, pairId, upgrade) {
  const s = state.systems.augmentations;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const def = IDLE_NGU_AUGMENTATIONS.find(x => x.id === pairId);
  if (!def) throw new Error("AUGMENT_INVALIDE");
  s.data.activePair = pairId;
  s.data.trainUpgrade = Boolean(upgrade);
}

export function selectRitual(state, ritualId, context) {
  const s = state.systems.bloodMagic;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const ritual = IDLE_NGU_BLOOD_RITUALS.find(x => x.id === ritualId);
  if (!ritual || !ritualUnlocked(ritual, context, state)) throw new Error("RITUEL_VERROUILLE");
  s.data.activeRitual = ritualId;
}

function moneyPitTierV48_(gold) {
  const thresholds=[1e5,1e7,1e9,1e11,1e13,1e15,1e18,1e21,1e24,1e27,1e30];
  let tier=0;
  for(let i=0;i<thresholds.length;i+=1){
    if(gold>=thresholds[i])tier=i+1;
    else break;
  }
  return tier;
}

/*
 * Money Pit, « One-Time Bonuses » (2026-09-24, audit des pages-guides : la FAQ les cite, rien
 * ne les versait). Seuils sur l'or TOTAL jeté (« sum over many tosses »), une fois chacun :
 *  - 1E8  : +100 Max Health et +1 Health Regen d'Aventure (page Money Pit + FAQ « 100M+ gold :
 *           +100 Max HP, +1 HP Regen ») ;
 *  - 1E10 : +1 Energy Bar et +1 Magic Bar (pages Money Pit, Energy et Magic ; la FAQ, plus
 *           ancienne, disait 1B) ;
 *  - 1E11 : Looty McLootFace (page Money Pit, FAQ « ~100b? lootymclootyface ») ; niveau non
 *           publié -> niveau de drop du catalogue (0). Non marqué versé tant que le sac est plein ;
 *  - 1E12 : +100 EXP (page Money Pit).
 * Non versé : le « +10 Power, +10 Toughness » du palier 1E8 (page Money Pit) que la FAQ donne
 * à « +1 Adventure attack and defense » : sources contradictoires, laissé en suspens.
 */
const MONEY_PIT_ONE_TIME_BONUSES_V1 = Object.freeze([
  Object.freeze({ bit: 1, gold: 1e8, adventureHp: 100, adventureRegen: 1 }),
  Object.freeze({ bit: 2, gold: 1e10, energyBars: 1, magicBars: 1 }),
  Object.freeze({ bit: 4, gold: 1e11, item: "lootyMcLootFace" }),
  Object.freeze({ bit: 8, gold: 1e12, experience: 100 })
]);

function applyMoneyPitOneTimeBonusesV1(state) {
  const total = Math.max(0, num(state.systems.moneyPit?.data?.totalGoldTossed, 0));
  let mask = Math.max(0, int(state.records.moneyPitOneTimeMask, 0));
  const out = [];
  const adv = state.adventure && typeof state.adventure === "object" ? state.adventure : null;
  const permanent = adv ? (adv.permanent = adv.permanent && typeof adv.permanent === "object" ? adv.permanent : {}) : null;
  for (const b of MONEY_PIT_ONE_TIME_BONUSES_V1) {
    if (total < b.gold || (mask & b.bit)) continue;
    if (b.item) {
      if (!adv) continue;
      const def = IDLE_ADVENTURE_SPECIALS[b.item];
      const livre = idleAdventureAddItemV1(adv, idleAdventureSpecialItemV1(b.item, int(def?.dropLevel, 0)));
      if (!livre) continue;
    } else if (!permanent) {
      continue;
    }
    if (b.adventureHp) permanent.adventureHp = Math.max(0, num(permanent.adventureHp, 0)) + b.adventureHp;
    if (b.adventureRegen) permanent.adventureRegen = Math.max(0, num(permanent.adventureRegen, 0)) + b.adventureRegen;
    if (b.energyBars) permanent.energyBarsFlat = Math.max(0, num(permanent.energyBarsFlat, 0)) + b.energyBars;
    if (b.magicBars) permanent.magicBarsFlat = Math.max(0, num(permanent.magicBarsFlat, 0)) + b.magicBars;
    if (b.experience) state.currencies.experience = Math.max(0, num(state.currencies.experience, 0)) + b.experience;
    mask |= b.bit;
    out.push(b.gold);
  }
  state.records.moneyPitOneTimeMask = mask;
  return out;
}

/*
 * Bonus TOTAUX apportés par le Money Pit depuis le début de la partie (2026-09-26, Norman : « il ne faudrait que les bonus totaux que le Money Pit
 * nous a apportés depuis le début »). L'historique ne garde que 20 jets : les totaux sont cumulés à part (data.rewardsTotal) ; pour une sauvegarde
 * d'avant, ils partent de l'historique disponible.
 */
const MONEY_PIT_TOTAL_KEYS_V1 = Object.freeze(["adventureStats", "adventureHp", "adventureRegen", "cubePower", "cubeToughness", "cubeBoth", "experience", "seeds", "wandoosLevels", "ap", "boosts", "energyBars", "magicBars"]);

function moneyPitTotalsVideV1() {
  const t = {};
  for (const k of MONEY_PIT_TOTAL_KEYS_V1) t[k] = 0;
  return t;
}

function moneyPitAjouterTotauxV1(totals, reward, boost) {
  for (const k of MONEY_PIT_TOTAL_KEYS_V1) {
    if (k !== "boosts" && reward && Number.isFinite(Number(reward[k]))) totals[k] += Number(reward[k]);
  }
  if (boost) totals.boosts += 1;
}

function moneyPitTotauxDepuisHistoriqueV1(history) {
  const t = moneyPitTotalsVideV1();
  for (const e of Array.isArray(history) ? history : []) moneyPitAjouterTotauxV1(t, e && e.reward, e && e.boost);
  return t;
}

export function moneyPitTotauxNormalisesV1(raw, history) {
  if (!raw || typeof raw !== "object") return moneyPitTotauxDepuisHistoriqueV1(history);
  const t = moneyPitTotalsVideV1();
  for (const k of MONEY_PIT_TOTAL_KEYS_V1) t[k] = Math.max(0, num(raw[k], 0));
  return t;
}

/*
 * Bonus TOTAUX de la roue journalière depuis le début (Norman, 2026-10-17 : « comme pour le Money Pit, un total de ce que la roue nous a donné : toute l'AP cumulée, etc. »). L'historique ne garde que 20 tours :
 * les totaux sont cumulés à part (data.rewardsTotal : { ap, seeds, items: { id: nombre } }) ; pour une sauvegarde d'avant, ils partent de l'historique disponible.
 */
function roueTotauxVidesV1() {
  return { ap: 0, seeds: 0, items: {} };
}
function roueAjouterTotauxV1(t, reward) {
  if (!reward || typeof reward !== "object") return t;
  if (Number.isFinite(Number(reward.ap))) t.ap += Math.max(0, Number(reward.ap));
  if (Number.isFinite(Number(reward.seeds))) t.seeds += Math.max(0, Number(reward.seeds));
  if (reward.items && typeof reward.items === "object") {
    for (const [id, n] of Object.entries(reward.items)) {
      if (/^[A-Za-z0-9_]{1,40}$/.test(id) && Number.isFinite(Number(n)) && Number(n) > 0) t.items[id] = num(t.items[id], 0) + Number(n);
    }
  }
  return t;
}
export function roueTotauxNormalisesV1(raw, history) {
  if (!raw || typeof raw !== "object") {
    const t = roueTotauxVidesV1();
    for (const e of Array.isArray(history) ? history : []) roueAjouterTotauxV1(t, e && e.reward);
    return t;
  }
  const t = roueTotauxVidesV1();
  t.ap = Math.max(0, num(raw.ap, 0));
  t.seeds = Math.max(0, num(raw.seeds, 0));
  for (const [id, n] of Object.entries(raw.items && typeof raw.items === "object" ? raw.items : {})) {
    if (/^[A-Za-z0-9_]{1,40}$/.test(id) && num(n, 0) > 0) t.items[id] = num(n, 0);
  }
  return t;
}

export function tossMoneyPit(state, now) {
  const s = state.systems.moneyPit;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (now < num(s.data.nextAt, 0)) throw new Error("PUITS_EN_RECHARGE");

  // NGU rule: the pit takes ALL current gold. 100k is only the minimum
  // required to receive a reward; the player cannot choose a smaller toss.
  const cost = Math.floor(Math.max(0, num(state.currencies.gold, 0)));
  /*
   * Moins que le minimum (Norman, 2026-10-08, capture du vrai jeu : « You feel a lot poorer... but nothing happened :c. Maybe you need to throw more gold? ») : le trou PREND quand même
   * tout l'or, sans récompense, ET le jet consomme le délai du trou comme un vrai jet (précisé par Norman après vérification dans NGU Idle). Même règle d'attente que plus bas (k + 1 heures après le k-ième jet) ;
   * le jet ne compte ni dans l'historique ni dans le total d'or jeté (aucune récompense, aucun palier de bonus unique).
   */
  if (cost < 1) throw new Error("OR_INSUFFISANT");
  if (cost < 100000) {
    const jets = Math.max(0, int(s.data.tossesThisRun, 0));
    state.currencies.gold = 0;
    s.data.tossesThisRun = jets + 1;
    s.data.lastTossAt = now;
    s.data.nextAt = now + (2 + jets) * 3600000;
    return { rien: true, orPerdu: cost };
  }
  const tier = moneyPitTierV48_(cost);
  const tosses = Math.max(0, int(s.data.tossesThisRun, 0));

  state.currencies.gold = 0;
  s.data.tossesThisRun = tosses + 1;
  s.data.lastTossAt = now;
  s.data.totalGoldTossed = Math.max(0, num(s.data.totalGoldTossed, 0)) + cost;
  /*
   * Wiki Money Pit : « The initial cooldown for feeding the Money Pit is one hour. The cooldown period increases by another hour every time you feed it,
   * so after the first feeding, you have to wait 2 hours until you can feed it again, then 3 after the next, then 4, etc. » : après le k-ième jet du
   * run, l'attente est de k + 1 heures (la première heure est celle d'avant le premier jet, voir la remise à zéro au Rebirth : dernier jet + 1 h).
   * Corrigé le 2026-09-26 : le code attendait k heures (1 h après le premier jet), soit une heure de trop généreuse à chaque palier.
   */
  const cooldownHours = 2 + tosses;
  s.data.nextAt = now + cooldownHours * 3600000;
  s.level = Math.max(0, int(s.level, 0)) + 1;

  /*
   * Norman (2026-09-14) : "Regarde bien le wiki pour voir les % de
   * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Table
   * complète relue directement sur le wiki NGU (page Money Pit, via
   * navigateur — les résultats de recherche étaient trop incomplets) :
   * "It's a random chance between all available rewards" — un seul
   * type de récompense tiré au hasard PARMI ceux listés pour le palier
   * atteint (jamais tous en même temps).
   *
   * Chaque palier réel liste plusieurs colonnes de récompense possibles
   * (Adv Stat, Boost, Adv Max HP, Adv HP Regen, Equip +1lvl, EXP,
   * Wandoos, Seeds). Seules Boost (BOOSTS=[1,2,5,10,20,50,100],
   * exactement les forces du wiki) et EXP/Seeds (déjà de vraies
   * monnaies SOREAL) sont buildables sans construire de toute pièce
   * les stats Adventure séparées, l'amélioration groupée de
   * l'équipement, le boost du Cube ou Wandoos — ces colonnes-là sont
   * honnêtement omises (documenté ici, pas fabriqué) plutôt que
   * remplacées par une valeur inventée.
   */
  /*
   * V212 — les quatre premiers paliers peuvent désormais utiliser les
   * colonnes NGU réellement déjà représentables dans SOREAL IDLE :
   * Adventure Stat, Boost, Adventure Max HP, Adventure HP Regen et EXP.
   * Valeurs du tableau Money Pit NGU :
   * T1 +1 / Boost 1 / +10 HP / +0.1 regen ;
   * T2 +2 / Boost 2 / +20 HP / +0.2 regen / +1 EXP ;
   * T3 +5 / Boost 5 / +50 HP / +0.5 regen / +2 EXP ;
   * T4 +10 / Boost 10 / +75 HP / +1 regen / +3 EXP.
   * Les colonnes Equip/Wandoos/Cube des paliers suivants restent hors de
   * cette passe plutôt que d'être remplacées par une récompense inventée.
   */
  const IDLE_MONEY_PIT_REWARDS_V1 = [
    [],
    [{ adventureStats: 1 }, { boost: 1 }, { adventureHp: 10 }, { adventureRegen: 0.1 }],
    [{ adventureStats: 2 }, { boost: 2 }, { adventureHp: 20 }, { adventureRegen: 0.2 }, { experience: 1 }],
    [{ adventureStats: 5 }, { boost: 5 }, { adventureHp: 50 }, { adventureRegen: 0.5 }, { experience: 2 }],
    [{ adventureStats: 10 }, { boost: 10 }, { adventureHp: 75 }, { adventureRegen: 1 }, { experience: 3 }],
    /*
     * 2026-09-23 (audit, page Money Pit) : paliers 5 à 11 complétés avec TOUTES leurs colonnes
     * (Adv Stat, Cube P/T ou les deux, HP, regen, EXP, Wandoos, Seeds). Le tirage reste un seul
     * type de récompense au hasard. « Equip +1 LVL » (équipement/Daycare) n'est pas modélisé.
     */
    [{ adventureStats: 20 }, { cubePower: 5 }, { cubeToughness: 5 }, { cubeBoth: 3 }, { adventureHp: 150 }, { adventureRegen: 1.5 }, { experience: 10 }, { seeds: 10 }],
    [{ adventureStats: 50 }, { cubePower: 10 }, { cubeToughness: 10 }, { cubeBoth: 5 }, { adventureHp: 200 }, { adventureRegen: 2 }, { experience: 25 }, { wandoos: 1, wandoosMax: 20 }, { seeds: 25 }],
    [{ adventureStats: 100 }, { cubePower: 20 }, { cubeToughness: 20 }, { cubeBoth: 10 }, { adventureHp: 300 }, { adventureRegen: 3 }, { experience: 25 }, { wandoos: 1, wandoosMax: 50 }, { seeds: 100 }],
    [{ adventureStats: 150 }, { cubePower: 50 }, { cubeToughness: 50 }, { cubeBoth: 25 }, { adventureHp: 450 }, { adventureRegen: 5 }, { experience: 200 }, { wandoos: 2, wandoosMax: 100 }, { seeds: 200 }],
    [{ adventureStats: 200 }, { cubePower: 100 }, { cubeToughness: 100 }, { cubeBoth: 50 }, { adventureHp: 700 }, { adventureRegen: 6 }, { experience: 300 }, { wandoos: 2, wandoosMax: 100 }, { seeds: 300 }],
    [{ adventureStats: 250 }, { cubePower: 150 }, { cubeToughness: 150 }, { cubeBoth: 75 }, { adventureHp: 750 }, { adventureRegen: 7.5 }, { experience: 400 }, { wandoos: 2, wandoosMax: 100 }, { seeds: 500 }],
    [{ adventureStats: 300 }, { cubePower: 200 }, { cubeToughness: 200 }, { cubeBoth: 100 }, { adventureHp: 900 }, { adventureRegen: 9 }, { experience: 500 }, { wandoos: 3, wandoosMax: 100 }, { seeds: 700 }]
  ];
  const candidats = IDLE_MONEY_PIT_REWARDS_V1[Math.min(tier, IDLE_MONEY_PIT_REWARDS_V1.length - 1)];
  const choix = candidats.length ? candidats[Math.floor(Math.random() * candidats.length)] : {};

  const reward = {};
  let boostGrant = null;
  state.adventure.permanent =
    state.adventure.permanent && typeof state.adventure.permanent === "object"
      ? state.adventure.permanent
      : {};

  for (const [k, v] of Object.entries(choix)) {
    if (k === "boost") {
      const type = ["power", "toughness", "special"][Math.floor(Math.random() * 3)];
      boostGrant = idleAdventureBoostV1(type, v);
    } else if (k === "adventureStats") {
      state.adventure.permanent.adventurePower =
        Math.max(0, num(state.adventure.permanent.adventurePower, 0)) + v;
      state.adventure.permanent.adventureToughness =
        Math.max(0, num(state.adventure.permanent.adventureToughness, 0)) + v;
      reward.adventureStats = (reward.adventureStats || 0) + v;
    } else if (k === "cubePower" || k === "cubeToughness" || k === "cubeBoth") {
      const cube = state.adventure.cube && typeof state.adventure.cube === "object" ? state.adventure.cube : (state.adventure.cube = { power: 0, toughness: 0 });
      if (k !== "cubeToughness") cube.power = Math.max(0, num(cube.power, 0)) + v;
      if (k !== "cubePower") cube.toughness = Math.max(0, num(cube.toughness, 0)) + v;
      reward[k] = (reward[k] || 0) + v;
    } else if (k === "wandoos") {
      const os = state.systems.wandoos?.data?.osLevels;
      if (os) {
        const max = Math.min(100, num(choix.wandoosMax, 100));
        const gained = Math.max(0, Math.min(v, max - num(os.moneyPit, 0)));
        os.moneyPit = Math.max(0, num(os.moneyPit, 0)) + gained;
        reward.wandoosLevels = (reward.wandoosLevels || 0) + gained;
      }
    } else if (k === "wandoosMax") {
      /* plafond du palier, traité avec "wandoos" */
    } else if (k === "experience") {
      /* Wiki : « EXP rewards are affected by EXP bonus » */
      reward.experience = (reward.experience || 0) + v * Math.max(0, num(idleNguBonusesLectureV1(state).xpMultiplier, 1));
    } else if (k === "adventureHp") {
      state.adventure.permanent.adventureHp =
        Math.max(0, num(state.adventure.permanent.adventureHp, 0)) + v;
      reward.adventureHp = (reward.adventureHp || 0) + v;
    } else if (k === "adventureRegen") {
      state.adventure.permanent.adventureRegen =
        Math.max(0, num(state.adventure.permanent.adventureRegen, 0)) + v;
      reward.adventureRegen = (reward.adventureRegen || 0) + v;
    } else {
      reward[k] = (reward[k] || 0) + v;
    }
  }

  // Wiki (page Money Pit) : AP fixe en plus du tirage, floor(log10(gold)).
  // Bonus AP commun appliqué comme aux autres sources (page Arbitrary Points), arrondi inférieur.
  reward.ap = apWithBonusV1(state, Math.floor(Math.log10(cost)));

  const oneTime = applyMoneyPitOneTimeBonusesV1(state);
  /* Totaux depuis le début : le jet, puis les bonus uniques versés par ce jet. */
  {
    const totaux = moneyPitTotauxNormalisesV1(s.data.rewardsTotal, s.data.history);
    moneyPitAjouterTotauxV1(totaux, reward, boostGrant);
    for (const seuil of oneTime) {
      const b = MONEY_PIT_ONE_TIME_BONUSES_V1.find(x => x.gold === seuil);
      if (!b) continue;
      totaux.adventureHp += num(b.adventureHp, 0);
      totaux.adventureRegen += num(b.adventureRegen, 0);
      totaux.energyBars += num(b.energyBars, 0);
      totaux.magicBars += num(b.magicBars, 0);
      totaux.experience += num(b.experience, 0);
    }
    s.data.rewardsTotal = totaux;
  }

  for (const [k, v] of Object.entries(reward)) {
    if (Object.prototype.hasOwnProperty.call(state.currencies, k)) {
      state.currencies[k] += v;
    }
  }
  if (boostGrant) idleAdventureAddItemV1(state.adventure, boostGrant);

  const resultat={
    cost,
    tier,
    reward,
    boost:boostGrant ? { type: boostGrant.boostType, strength: boostGrant.strength } : null,
    cooldownHours,
    nextAt:s.data.nextAt
  };
  // Seuils d'or total des One-Time Bonuses versés par ce jet (hors `reward`, qui ne décrit que le tirage).
  if (oneTime.length) resultat.oneTime = oneTime;

  const historique=Array.isArray(s.data.history)?s.data.history:[];
  historique.unshift({
    at:now,
    cost,
    tier,
    reward:Object.assign({},reward),
    boost:resultat.boost
  });
  s.data.history=historique.slice(0,IDLE_MONEY_PIT_HISTORIQUE_MAX_V1);

  return resultat;
}

function dailySpinTierV48_(spins) {
  const thresholds=[0,7,14,30,60,120,180,365];
  let tier=0;
  for(let i=0;i<thresholds.length;i+=1){
    if(spins>=thresholds[i])tier=i;
    else break;
  }
  return tier;
}

function spinDaily(state, now) {
  const s = state.systems.dailySpin;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const previousReadyAt = Math.max(0, num(s.data.readyAt, 0));
  if (now < previousReadyAt) throw new Error("ROUE_PAS_PRETE");

  const totalBefore = Math.max(0, int(s.data.totalSpins, s.level));
  const tier = dailySpinTierV48_(totalBefore);
  /*
   * Norman (2026-09-14) : "Regarde bien le wiki pour voir les % de
   * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Table
   * complète relue directement sur le wiki NGU (page Daily Spin, via
   * navigateur) : chaque palier liste des lots à pourcentages RÉELS
   * (pondérés, jamais uniformes). Les lots AP/Seeds (déjà de vraies
   * monnaies SOREAL) sont repris avec leurs vrais pourcentages ; les
   * lots non buildables (Potions Energy/Magic, Lucky Charm, Bar Bar,
   * Poop, Consumables Jackpot — aucun n'existe encore côté SOREAL) sont
   * honnêtement omis plutôt que remplacés par une valeur inventée — le
   * jeu n'était de toute façon jamais censé donner de l'Or via la roue
   * (l'ancienne implémentation SOREAL le faisait à tort, jamais présent
   * sur le wiki).
   * Tier 7 (365 spins) : le wiki documente un vrai bug du jeu original
   * ("2000 Seeds (10%)[2]" avec la note "BUG: you get 5000 seeds
   * instead") — repris tel quel (5000), car c'est le comportement RÉEL
   * vécu par les joueurs, pas la valeur nominale jamais atteignable.
   */
  /*
   * 2026-09-23 : table complète de la page Daily Spin (chaque palier totalise 100 %). Les potions, Lucky Charm et
   * Bar Bar sont désormais réels (boutique Sellout) et s'activent immédiatement. MacGuffin Muffin : réel depuis le
   * 2026-09-23 (IDLE_SELLOUT_EFFECTS_V1.macguffinMuffin, consommé au Rebirth par idle-macguffins-v1.js). Beast
   * Butter (Questing) et Poop (IDLE_SELLOUT_EFFECTS_V1.poop -> stock state.selloutEffects.poop, utilisé sur un fruit
   * d'Yggdrasil, idle-yggdrasil-extra-v1.js) sont réels depuis le 2026-09-23.
   */
  const P = (item, poids, n = 1) => ({ items: { [item]: n }, poids });
  const JACKPOTS = {
    3: { energyPotionAlpha: 1, energyPotionBeta: 1, magicPotionAlpha: 1, magicPotionBeta: 1, luckyCharm: 1, energyBarBar: 1, magicBarBar: 1, poop: 2 },
    4: { energyPotionAlpha: 1, energyPotionBeta: 1, energyPotionDelta: 1, magicPotionAlpha: 1, magicPotionBeta: 1, magicPotionDelta: 1, luckyCharm: 1, energyBarBar: 1, magicBarBar: 1, poop: 5, superLuckyCharm: 1, littleBluePill1000: 1 },
    5: { energyPotionAlpha: 2, energyPotionBeta: 2, energyPotionDelta: 1, magicPotionAlpha: 2, magicPotionBeta: 2, magicPotionDelta: 1, luckyCharm: 2, energyBarBar: 2, magicBarBar: 2, poop: 10, superLuckyCharm: 1, littleBluePill1000: 2, beastButter: 1, macguffinMuffin: 1 },
    6: { energyPotionAlpha: 2, energyPotionBeta: 2, energyPotionDelta: 2, magicPotionAlpha: 2, magicPotionBeta: 2, magicPotionDelta: 2, luckyCharm: 3, energyBarBar: 3, magicBarBar: 3, poop: 25, superLuckyCharm: 2, littleBluePill1000: 3, beastButter: 2, macguffinMuffin: 2 },
    7: { energyPotionAlpha: 3, energyPotionBeta: 3, energyPotionDelta: 3, magicPotionAlpha: 3, magicPotionBeta: 3, magicPotionDelta: 3, luckyCharm: 3, energyBarBar: 3, magicBarBar: 3, poop: 25, superLuckyCharm: 3, littleBluePill1000: 5, beastButter: 3, macguffinMuffin: 3 }
  };
  const J = (t, poids) => ({ items: JACKPOTS[t], poids });
  const IDLE_DAILY_SPIN_REWARDS_V1 = [
    [{ ap: 50, poids: 70 }, { ap: 100, poids: 30 }],
    [{ ap: 100, poids: 53 }, { ap: 200, poids: 35 }, { ap: 1000, poids: 10 }, P("energyPotionAlpha", 1), P("magicPotionAlpha", 1)],
    [{ ap: 200, poids: 53 }, { ap: 400, poids: 30 }, { ap: 2000, poids: 10 }, P("energyPotionAlpha", 1), P("magicPotionAlpha", 1), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 1), P("energyBarBar", 1), P("magicBarBar", 1)],
    [{ ap: 300, poids: 37 }, { ap: 600, poids: 25 }, { ap: 3000, poids: 10 }, P("energyPotionAlpha", 2), P("magicPotionAlpha", 2), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 2), P("energyBarBar", 2), P("magicBarBar", 2), { seeds: 20, poids: 10 }, P("poop", 5, 2), J(3, 0.5), { ap: 50000, poids: 0.5 }],
    [{ ap: 500, poids: 50 }, { ap: 1000, poids: 25 }, { ap: 5000, poids: 10 }, P("energyPotionAlpha", 1), P("magicPotionAlpha", 1), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 1), P("energyBarBar", 1), P("magicBarBar", 1), { seeds: 100, poids: 5 }, P("poop", 1, 5), J(4, 0.5), { ap: 75000, poids: 0.5 }, P("energyPotionDelta", 0.5), P("magicPotionDelta", 0.5)],
    [{ ap: 800, poids: 36 }, { ap: 1600, poids: 25 }, { ap: 8000, poids: 10 }, P("energyPotionAlpha", 2), P("magicPotionAlpha", 2), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 2), P("energyBarBar", 2), P("magicBarBar", 2), { seeds: 400, poids: 10 }, P("poop", 5, 10), J(5, 0.5), { ap: 100000, poids: 0.5 }, P("energyPotionDelta", 0.5), P("magicPotionDelta", 0.5)],
    [{ ap: 1200, poids: 35 }, { ap: 2400, poids: 25 }, { ap: 12000, poids: 10 }, P("energyPotionAlpha", 2, 2), P("magicPotionAlpha", 2, 2), P("energyPotionBeta", 1, 2), P("magicPotionBeta", 1, 2), P("luckyCharm", 2, 2), P("energyBarBar", 2, 2), P("magicBarBar", 2, 2), { seeds: 2000, poids: 10 }, P("poop", 5, 25), P("energyPotionDelta", 1), P("magicPotionDelta", 1), J(6, 0.5), { ap: 150000, poids: 0.5 }],
    [{ ap: 1500, poids: 35 }, { ap: 3000, poids: 25 }, { ap: 15000, poids: 10 }, P("energyPotionAlpha", 2, 2), P("magicPotionAlpha", 2, 2), P("energyPotionBeta", 1, 2), P("magicPotionBeta", 1, 2), P("luckyCharm", 2, 2), P("energyBarBar", 2, 2), P("magicBarBar", 2, 2), { seeds: 5000, poids: 10 }, P("poop", 5, 25), P("energyPotionDelta", 1), P("magicPotionDelta", 1), J(7, 0.5), { ap: 175000, poids: 0.5 }]
  ];
  const table = IDLE_DAILY_SPIN_REWARDS_V1[Math.min(tier, IDLE_DAILY_SPIN_REWARDS_V1.length - 1)];
  const poidsTotal = table.reduce((sum, entree) => sum + entree.poids, 0);
  let curseur = Math.random() * poidsTotal;
  let choix = table[table.length - 1];
  for (const entree of table) {
    if (curseur < entree.poids) { choix = entree; break; }
    curseur -= entree.poids;
  }
  let reward;
  if (choix.items) {
    reward = { items: Object.assign({}, choix.items) };
    for (const [id, n] of Object.entries(choix.items)) idleSelloutApplyEffectV1(state, id, n);
  } else {
    reward = choix.ap ? { ap: choix.ap } : { seeds: choix.seeds };
    /* AP : bonus AP commun (page Arbitrary Points : toutes les sources sauf ITOPOD), arrondi inférieur. */
    if (reward.ap) reward.ap = apWithBonusV1(state, reward.ap);
    for (const [k, v] of Object.entries(reward)) state.currencies[k] += v;
  }

  s.level = totalBefore + 1;
  s.data.totalSpins = s.level;
  /* Totaux depuis le début : l'historique d'AVANT ce tour, puis ce tour. */
  s.data.rewardsTotal = roueAjouterTotauxV1(roueTotauxNormalisesV1(s.data.rewardsTotal, s.data.history), reward);
  /*
   * Cadence de 24 h, temps en retard « banké » vers le prochain tour. Plafond de banque : « maximum time banked by the
   * daily spin system from 36 hours to 7 days » (4G's Sellout Shop, 7-Day Time Bank for Daily Spin!) : le plafond
   * total (24 h de cadence + retard banké) passe de 36 h à 7 jours, soit 12 h puis 144 h de retard banké
   * (lecture retenue : le retard banké de 12 h du code d'origine est bien 36 h - 24 h).
   */
  const bankCapMs = (state.selloutShop?.purchases?.dailySpinTimeBank > 0 ? 7 * 24 : 36) * 3600000 - 24 * 3600000;
  const bankedMs = Math.min(bankCapMs, Math.max(0, now - previousReadyAt));
  s.data.readyAt = now + 24 * 3600000 - bankedMs;

  const resultat={
    reward,
    tier,
    totalSpins:s.data.totalSpins,
    bankedMs,
    readyAt:s.data.readyAt
  };
  const historique=Array.isArray(s.data.history)?s.data.history:[];
  historique.unshift({
    at:now,
    tier,
    reward:Object.assign({},reward),
    totalSpins:s.data.totalSpins
  });
  s.data.history=historique.slice(0,IDLE_MONEY_PIT_HISTORIQUE_MAX_V1);

  return resultat;
}

function challengeNguLevels(state) {
  return nguTotalLevelsV1(state);
}

function laserSwordPair(state) {
  const pair=state.systems.augmentations?.data?.pairs?.laserSword;
  return {
    level:Math.max(0,int(pair?.level,0)),
    upgradeLevel:Math.max(0,int(pair?.upgradeLevel,0))
  };
}

/*
 * "100 Levels Challenge" (audit 2026-09-16, augments-and-challenges.md) :
 * "total levels gained from Augments+Blood Magic+Time Machine+Wandoos+
 * Beards COMBINED capped at 100/rebirth". Le pool est un simple compteur
 * remis à zéro à chaque Rebirth (applyRebirthResetV56_) ; chaque site de
 * gain (advanceAugmentations, advanceBloodMagic, advanceTimeMachine,
 * advanceTrackSystem pour Wandoos, advanceBeardTrack) vérifie le budget
 * restant AVANT de dépenser une ressource pour ce niveau — jamais après
 * coup, pour ne jamais faire perdre de l'Or déjà dépensé sans le niveau
 * correspondant (même invariant que les gardes "Or insuffisant" déjà
 * présentes dans ces mêmes fonctions).
 */
export function challengeHundredLevelsRemaining(state) {
  if (state.challenge?.active !== "hundredLevels") return Infinity;
  return Math.max(0, 100 - Math.max(0, int(state.challenge.hundredLevelsGained, 0)));
}

export function challengeHundredLevelsConsume(state, amount) {
  if (state.challenge?.active !== "hundredLevels" || !(amount > 0)) return;
  state.challenge.hundredLevelsGained = Math.max(0, int(state.challenge.hundredLevelsGained, 0)) + amount;
}

function challengeDefinition(id, tier = "normal") {
  return challengeDefsForTierV1(tier).find(def=>def.id===String(id||"")) || null;
}

function challengeUnlocked(def,state,context={}) {
  if(!def||!state.systems.challenges?.unlocked)return false;
  /* Wiki : les défis Evil/Sadistic sont débloqués en entrant dans la difficulté. */
  if(def.tier&&def.tier!=="normal")return true;
  const highestBoss=Math.max(0,int(state.records.highestBoss,context.bosses||0));
  if(def.id==="basic")return highestBoss>=58;
  if(def.id==="noAugmentations")return highestBoss>=75;
  if(def.id==="twentyFourHours")return num(state.challenge.bestMs?.basic,Infinity)<=24*3600000;
  if(def.id==="hundredLevels")return challengeNguLevels(state)>=10;
  /* Wiki Challenges : « Discover (NOT complete) every piece of the GRB set » -- les 7 pièces vues au moins une fois. */
  if(def.id==="noEquipment"){
    const grbVues=["head","chest","legs","boots","weapon","necklace","meat"].every(slot=>Boolean(state.adventure?.itemList?.["grb:"+slot]?.seen));
    return Boolean(grbVues||state.adventure?.completedSets?.grb||state.adventure?.setRewards?.noEquipmentChallenge);
  }
  if(def.id==="troll")return int(state.adventure?.titans?.t2?.kills,0)>0;
  if(def.id==="noRebirth")return int(state.adventure?.titans?.t3?.kills,0)>0;
  if(def.id==="laserSword")return laserSwordPair(state).level>=1&&laserSwordPair(state).upgradeLevel>=1;
  if(def.id==="blind")return int(state.adventure?.titans?.t4?.kills,0)>0;
  if(def.id==="noNgu")return challengeNguLevels(state)>=10000;
  if(def.id==="noTimeMachine")return Boolean(state.systems.diggers?.unlocked);
  return false;
}

function challengeTargetBoss(def,completion) {
  if(!def||!def.targetBoss)return 0;
  return Math.max(0,int(def.targetBoss,0)+Math.max(0,int(completion,0))*Math.max(0,int(def.targetStep,0)));
}

function challengeSnapshotDefinitions(state,context={}) {
  const tier=challengeTierV1(state);
  const completions=challengeCompletionsV1(state,tier);
  /* Anti-spoil (AGENTS.md, règle n°2) : un défi encore verrouillé n'est jamais envoyé au client. */
  return challengeDefsForTierV1(tier).map(def=>{
    const completion=Math.max(0,int(completions?.[def.id],0));
    return Object.assign({},clone(def),{
      tier,
      completion,
      unlocked:challengeUnlocked(def,state,context),
      targetBoss:challengeTargetBoss(def,completion),
      active:state.challenge.active===def.id
    });
  }).filter(def=>def.unlocked||def.active||def.completion>0);
}

/*
 * Fin d'un défi (page Challenges : « Win Condition(s): Defeat Boss #58 »). Dans le jeu, le défi se termine tout seul dès que
 * la condition est remplie : plus besoin d'un bouton « Valider ». Le résultat est mémorisé dans state.challenge.lastCompletion
 * pour que le client l'annonce.
 */
export function autoCompleteChallengeV1(state, context, now) {
  const active = String(state.challenge?.active || "");
  if (!active || !state.systems.challenges?.unlocked) return;
  const tier = challengeTierV1(state);
  const def = challengeDefinition(active, tier);
  if (!def) return;
  const done = Math.max(0, int(challengeCompletionsV1(state, tier)?.[active], 0));
  if (active === "laserSword") {
    const need = 2 + done;
    const pair = laserSwordPair(state);
    if (pair.level < need || pair.upgradeLevel < need) return;
  } else {
    const target = challengeTargetBoss(def, done);
    if (!(target > 0) || num(context?.bosses, 0) < target) return;
  }
  try {
    const res = challengeAction(state, { mode: "complete", challenge: active }, context || {}, now);
    state.challenge.lastCompletion = Object.assign({}, res, { seq: Math.max(0, int(state.challenge.lastCompletion?.seq, 0)) + 1, at: now });
  } catch (_) { /* condition de temps ratée (24 Hour) : le défi reste actif jusqu'à abandon */ }
}

export function challengeAction(state, payload, context, now) {
  const mode=String(payload.mode||"start");
  if(!state.systems.challenges.unlocked)throw new Error("SYSTEME_VERROUILLE");

  if(mode==="stop"){
    const stopped=String(state.challenge.active||"");
    state.challenge.active="";
    state.challenge.activeTier="normal";
    state.challenge.startedAt=0;
    state.challenge.troll=createTrollStateV1();
    return {stopped:Boolean(stopped),challenge:stopped};
  }

  const id=String(payload.challenge||state.challenge.active||"basic");
  const tier=challengeTierV1(state);
  const def=challengeDefinition(id,tier);
  if(!def)throw new Error("DEFI_INVALIDE");
  const completions=challengeCompletionsV1(state,tier);

  if(mode==="complete"){
    /* Le défi se termine seul (autoCompleteChallengeV1) : un « valider » tardif renvoie simplement le résultat déjà obtenu. */
    if(state.challenge.active!==id&&state.challenge.lastCompletion?.completed===id&&num(now,0)-num(state.challenge.lastCompletion.at,0)<120000){
      const {seq,at,...deja}=state.challenge.lastCompletion;
      return deja;
    }
    if(state.challenge.active!==id)throw new Error("DEFI_NON_ACTIF");
    const before=Math.max(0,int(completions[id],0));
    const target=challengeTargetBoss(def,before);
    if(target>0&&num(context.bosses,0)<target)throw new Error("OBJECTIF_NON_ATTEINT");
    if(id==="twentyFourHours"&&now-num(state.challenge.startedAt,now)>24*3600000)throw new Error("DEFI_ECHOUE_TEMPS");
    if(id==="laserSword"){
      // Wiki : "Make a (2/2 + 1/1 per completion) Laser Sword" — palier 2/2 à la 1re, +1/+1 par completion suivante.
      const requiredLevel=2+before;
      const pair=laserSwordPair(state);
      if(pair.level<requiredLevel||pair.upgradeLevel<requiredLevel)throw new Error("OBJECTIF_NON_ATTEINT");
    }

    const elapsed=Math.max(0,now-num(state.challenge.startedAt,now));
    const rewarded=before<Math.max(0,int(def.max,0));
    const rewardScale=def.reward?.scaleByNumber?before+1:1;
    const rewardExperience=Math.max(0,num(def.reward?.experience,0))*rewardScale;
    const rewardAp=Math.max(0,num(def.reward?.ap,0))*rewardScale;
    if(rewarded){
      completions[id]=before+1;
      state.currencies.experience+=rewardExperience;
      /* Page Arbitrary Points : AP des défis majoré par le bonus AP commun, arrondi inférieur. */
      state.currencies.ap+=apWithBonusV1(state,rewardAp);
      /* Basic Challenge Sadistic : mayo de chaque type (page Challenges, idle-cards-v1.js). */
      if(tier==="extreme"&&id==="basic")idleCardsGrantChallengeMayoV1(state,completions[id]);
    }
    if(tier==="normal"){
      const oldBest=num(state.challenge.bestMs?.[id],Infinity);
      state.challenge.bestMs[id]=Math.min(oldBest,elapsed);
    }
    state.challenge.active="";
    state.challenge.activeTier="normal";
    state.challenge.startedAt=0;
    state.challenge.troll=createTrollStateV1();
    return {
      completed:id,
      tier,
      completion:Math.max(0,int(completions[id],0)),
      targetBoss:target,
      rewarded,
      reward:rewarded?{experience:rewardExperience,ap:rewardAp}:{experience:0,ap:0},
      elapsedMs:elapsed
    };
  }

  if(mode!=="start")throw new Error("ACTION_DEFI_INVALIDE");
  if(state.challenge.active)throw new Error("DEFI_DEJA_ACTIF");
  if(!challengeUnlocked(def,state,context))throw new Error("DEFI_VERROUILLE");
  if(!def.implemented)throw new Error("DEFI_EN_PREPARATION");
  state.challenge.activeTier=tier;

  // Wiki : "Starting ANY challenge resets NUMBER to 1 and empties banks —
  // EXCEPT the Laser Sword Challenge, which performs only a normal rebirth."
  const isLaserSword=id==="laserSword";
  applyRebirthResetV56_(state,context,now,{
    forceNumber:isLaserSword?undefined:1,
    clearBanks:!isLaserSword,
    challengeId:id
  });
  state.challenge.troll=createTrollStateV1();

  return {
    started:id,
    challengeReset:!isLaserSword,
    targetBoss:challengeTargetBoss(def,completions[id]),
    tier,
    number:state.rebirth.number,
    banksCleared:!isLaserSword
  };
}

/*
 * Audit NGU 2026-09-23 : les récompenses de titan (EXP, or, AP, progression
 * de PP) sont cumulées par le moteur Aventure dans adventure.permanent ; ce
 * pont les reverse dans les vraies monnaies. Le PP progress suit la même règle
 * que l'ITOPOD : 1 000 000 de progression = 1 PP.
 */
/*
 * Consommables de complétion de set (Forest, HSB, Gaudy, Incriminating
 * Evidence ; voir accorderConsommablesSetsV1 dans idle-adventure-v47.js) :
 * activés immédiatement comme ceux de la roue quotidienne, puis retirés de la
 * file d'attente -- jamais appliqués deux fois.
 */
export function appliquerConsommablesSetsAventureV1(state) {
  const file = state.adventure?.pendingSetConsumablesV1;
  if (!file || typeof file !== "object") return;
  for (const [id, n] of Object.entries(file)) idleSelloutApplyEffectV1(state, id, Math.max(0, int(n, 0)));
  state.adventure.pendingSetConsumablesV1 = {};
}

export function crediterRecompensesAventure(state, avant) {
  appliquerConsommablesSetsAventureV1(state);
  const p = state.adventure?.permanent || {};
  const gain = (cle) => Math.max(0, num(p[cle], 0) - num(avant[cle], 0));
  /*
   * 2026-09-24 (audit, page Yggdrasil, Nerdy Formulas) : « EXPBonus is bonus applied to all experience
   * gain (This can be found in Stat Breakdowns) : NGU EXP x (1 + RedHeart) x Fibonacci 987 x Digger EXP x
   * Hacks EXP x Wish 61 x Cooking EXP ». L'EXP de l'aventure (drops de boss de zone, titans, bonus de
   * complétion d'objets) était créditée brute ; seuls les boss de Fight Boss, l'ITOPOD, le Money Pit et
   * le Fruit of Knowledge recevaient ce bonus.
   */
  state.currencies.experience += gain("experience") * Math.max(0, num(idleNguBonusesLectureV1(state).xpMultiplier, 1));
  state.currencies.gold += gain("gold");
  const perksGain = perkBonusesV1(idlePerkNiveauxV1(state));
  /*
   * "the final AP value is rounded down" (page Arbitrary Points). LIMITE : l'arrondi
   * porte sur le lot crédité par cet appel (boss d'Aventure, titans, sets), pas sur
   * chaque événement -- le moteur d'Aventure ne transmet qu'un delta cumulé.
   */
  state.currencies.ap += apWithBonusV1(state, gain("ap"));
  state.currencies.qp += gain("qp") * perksGain.qpEarningsMultiplier;
  /* Poop d'Icarus Proudbottom (The Sky, rollKill) : ajoutée au stock de Poop d'Yggdrasil. */
  const poop = Math.floor(gain("poop"));
  if (poop > 0) idleSelloutApplyEffectV1(state, "poop", poop);
  /* Page Yggdrasil : « PPBonus is bonus applied to all Perk Points gain » : le PP des titans reçoit le même facteur que l'ITOPOD. */
  const pp = gain("ppProgress") * Math.max(0, num(idleNguBonusesLectureV1(state).ppMultiplier, 1));
  if (pp > 0) {
    const tower = state.systems.tower;
    if (!tower.data || typeof tower.data !== "object") tower.data = {};
    tower.data.ppProgress = Math.max(0, num(tower.data.ppProgress, 0)) + pp;
    const entiers = Math.floor(tower.data.ppProgress / 1e6);
    if (entiers > 0) {
      tower.data.ppProgress -= entiers * 1e6;
      state.currencies.pp += entiers;
    }
  }
}

/* Niveaux des souhaits (id -> niveau), lus par les récompenses de titans. */
/* Niveau d'un souhait (0 si absent). */
export function wishLevelV1(state, id) {
  return Math.max(0, int(idleWishTracksActifsV1(state)[String(id)]?.level, 0));
}

/* Souhait 20 (« I didn't have to wait 3 minutes per rebirth ») : -10 s par niveau sur les 180 s minimum. */
export function minRebirthSecondsV1(state) {
  return Math.max(0, MIN_REBIRTH_SECONDS - 10 * Math.min(6, wishLevelV1(state, 20)));
}

/* Conditions de déblocage des portraits de joueur (sets complétés, souhaits, fragments SEXY/SMART). */
/*
 * Portrait automatique par set équipé (Norman, 2026-09-27) : calculé et mémorisé côté moteur d'aventure
 * (armureCompleteSetIdV1/rafraichirAutoPortraitSetV1 dans idle-adventure-v47.js, mis à jour uniquement à
 * l'équipement d'une pièce). state.adventure.autoPortraitSet ne s'efface jamais quand une pièce est
 * retirée -- retirer une pièce ne fait donc plus perdre le portrait, seul l'équipement d'un set COMPLET
 * différent le remplace.
 */
export function portraitEnvV1(state) {
  return {
    equippedSet: state.adventure?.autoPortraitSet || "",
    equippedSetTier: state.adventure?.autoPortraitTier || 0,
    completedSets: state.adventure?.completedSets || {},
    wishLevel: id => wishLevelV1(state, id),
    macguffinPct: id => macguffinPermanentPctV1(state, id),
    /*
     * Special Prize réclamé AVANT l'existence du choix (pas de choix enregistré) : le joueur n'a pas pu prendre le chaton, il le reçoit
     * (Norman, 2026-09-25 : « débloque le chaton sur mon compte, je ne l'ai pas choisi car il n'était pas là »).
     */
    specialPrizeChoice: num(state.records.specialPrizeChoice, 0) || (num(state.records.specialPrizeClaimed, 0) > 0 ? 2 : 0)
  };
}

export function wishLevelsMapV1(state) {
  const out = {};
  const tracks = idleWishTracksActifsV1(state);
  for (const id of Object.keys(tracks)) out[id] = Math.max(0, int(tracks[id]?.level, 0));
  return out;
}

export function photoRecompensesAventure(state) {
  const p = state.adventure?.permanent || {};
  return {
    qp: num(p.qp, 0),
    experience: num(p.experience, 0),
    gold: num(p.gold, 0),
    ap: num(p.ap, 0),
    ppProgress: num(p.ppProgress, 0),
    poop: num(p.poop, 0)
  };
}

/*
 * Questing : valeurs déjà calculées par ce moteur et consommées par idle-questing-v1.js --
 * respawn réel (même formule que l'ITOPOD : 4 s réduits, plancher 0,34 s), vitesse d'Idle Attack
 * (0,8 s avec Mysterious Red Liquid maxé, 1 s sinon), spéciaux "Quest Drops" de l'équipement,
 * multiplicateurs QP/AP des Perks et du QP Hack.
 */
export function questingEnvV1(state, context) {
  const bonuses = idleNguBonusesLectureV1(state);
  const gear = idleEquipementEffectifV1(state);
  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  return {
    respawnSeconds: Math.max(0.34, 4 * (1 - clamp(num(bonuses.respawnReduction, 0), 0, 1))),
    idleAttackSeconds: state.adventure?.unlockFlags?.redLiquidMaxed ? 0.8 : 1,
    gearQuestDropsPct: Math.max(0, num(gear.specialsByType?.questDropsPct, 0)),
    /* Heroic Sigil (set) : "Quest items drop 10% more often!" (SETS_OBJETS_V1.heroicSigil). */
    questDropsSetPct: Math.max(0, num(state.adventure?.setRewards?.questDropsSetPct, 0)),
    qpEarningsMultiplier: perks.qpEarningsMultiplier,
    apEarningsMultiplier: apBonusMultiplierV1(state),
    qpHackMultiplier: Math.max(0, num(hackFxV1(state).qpGain, 1)),
    /* Cartes QP « QP Gain » (idle-cards-v1.js, idleCardsApplyToBonusesV1). */
    qpCardMultiplier: Math.max(0, num(bonuses.cardsQpGainMultiplier, 1))
  };
}

/*
 * Marque filtered:true sur chaque entrée de result.drops dont l'id est listé dans filteredIds
 * (idleInventoryProcessNewDropsV1) -- le drop reste dans le journal du client (Norman veut le
 * voir, marqué "(filtré)"), il n'est simplement jamais resté dans l'inventaire réel.
 */
export function marquerDropsFiltresV1(result, filteredIds) {
  if (!result || !Array.isArray(result.drops) || !Array.isArray(filteredIds) || !filteredIds.length) return;
  const ids = new Set(filteredIds.map(String));
  for (const d of result.drops) if (d && ids.has(String(d.id))) d.filtered = true;
}

export function titanFight(state, context, now) {
  const s = state.systems.titans;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");

  // Single source of truth: the first Titan is fought by the Adventure V47
  // engine. This keeps cooldown, guaranteed consumables and gear drops in
  // the same persisted state as the Adventure screen.
  const titanChallengeBonuses=challengePermanentBonuses(state);
  const avantRecompenses = photoRecompensesAventure(state);
  const idsAvantTitan = idleInventoryIdsV1(state.adventure);
  const applied = applyIdleAdventureActionV47(
    state.adventure,
    {
      action: "titan",
      titanId: "t1",
      /* 2026-09-23 : vraies stats d'aventure (avec multiplicateurs), plus un champ jamais renseigné (0). */
      stats: (() => {
        const combat = idleAdventureCombatStatsV1(idleEquipementEffectifV1(state), context, idleNguBonuses(state));
        return { power: combat.power, toughness: combat.toughness };
      })()
    },
    Object.assign({},context,{
      wishLevels:wishLevelsMapV1(state),
      titanExpBonusKills:perkBonusesV1(idlePerkNiveauxV1(state)).titanExpBonusKills,
      titanExpChallengePct:challengePermanentBonuses(state).bossExpPct,
      goldMultiplier:Math.max(0,num(idleNguBonusesLectureV1(state).adventureGoldMultiplier,1)),
      dropMultiplier:Math.max(0,num(idleNguBonusesLectureV1(state).dropMultiplier,1)),
      dropMultiplierIncludesGear:true,
      titanCooldownReductionMs:titanChallengeBonuses.titanRespawnReductionMs,
      titanCooldownReductionEvilMs:titanChallengeBonuses.titanRespawnReductionEvilMs,
      titanCooldownReductionSadisticMs:titanChallengeBonuses.titanRespawnReductionSadisticMs,
      titanLootLevelBonus:titanChallengeBonuses.titanLootLevelBonus
    }),
    now
  );
  state.adventure = applied.state;
  /* Butin du titan : filtre de butin / cube / transformation automatique (idle-inventory-auto-v1.js). */
  if (!applied.duplicate) {
    const filtrage = idleInventoryProcessNewDropsV1(state.adventure, idsAvantTitan, inventoryAutoEnvV1(state));
    marquerDropsFiltresV1(applied.result, filtrage.filteredIds);
  }
  crediterRecompensesAventure(state, avantRecompenses);

  const titanState = state.adventure?.titans?.t1 || { kills: 0, nextAt: 0 };
  s.data.kills = Math.max(0, int(titanState.kills, 0));
  s.data.firstTitanDefeated = s.data.kills > 0;
  s.data.nextAt = Math.max(0, num(titanState.nextAt, 0));
  s.level = s.data.kills;

  return Object.assign(
    { tier: 1, nextAt: s.data.nextAt },
    applied.result || {}
  );
}

export function collectSystem(state, id, context, now) {
  if (id === "dailySpin") return spinDaily(state, now);
  if (id === "bloodMagic") return castBloodSpell(state, String(context.spell || "numberBoost"));
  /*
   * 2026-09-24 : l'ancienne branche « yggdrasil » (lecture d'un data.growth que
   * plus rien n'écrit) est retirée. Les fruits se mangent / se récoltent un par
   * un avec l'action useYggFruit.
   */
  throw new Error("ACTION_NON_DISPONIBLE");
}

/*
 * Real per-perk purchase (IDLE_PERKS_CATALOG_V1) — one specific perk id,
 * its own flat per-level cost, up to its own cap. Replaces the previous
 * generic "buyTree" fake single-counter/exponential-cost model for
 * "perks" specifically; the same migration (buyQuirkV1, below) has since
 * been done for "quirks" — buyTree had no remaining callers and was
 * removed (audit 2026-09-14).
 */
export function buyPerkV1(state, perkId) {
  const s = state.systems.perks;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const perk = idlePerkByIdV1(int(perkId, -1));
  if (!perk) throw new Error("PERK_INTROUVABLE");
  if (!idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, perk.id, state.difficulty)) throw new Error("DIFFICULTE_REQUISE");
  const levels = s.data && typeof s.data === "object" ? s.data.levels : null;
  const currentLevel = Math.max(0, int(levels?.[perk.id], 0));
  const cost = idlePerkNextCostV1(perk, currentLevel);
  if (!Number.isFinite(cost)) throw new Error("PERK_AU_MAXIMUM");
  if (state.currencies.pp < cost) throw new Error("MONNAIE_INSUFFISANTE");
  state.currencies.pp -= cost;
  if (!s.data || typeof s.data !== "object") s.data = { levels: {} };
  if (!s.data.levels || typeof s.data.levels !== "object") s.data.levels = {};
  s.data.levels[perk.id] = currentLevel + 1;
  s.level = Object.values(s.data.levels).reduce((sum, v) => sum + Math.max(0, int(v, 0)), 0);
  return { cost, perkId: perk.id, level: currentLevel + 1, cap: perk.cap };
}

/*
 * Real per-quirk purchase (IDLE_QUIRKS_CATALOG_V1) — one specific quirk id,
 * its own flat per-level cost, up to its own cap. Replaces the previous
 * buyTree(state, "quirks", "qp", 50) fake single-counter/exponential-cost
 * call (audit 2026-09-14, wiki NGU page Quirk Points) — same migration
 * buyPerkV1 already did for Perks.
 */
export function buyQuirkV1(state, quirkId) {
  const s = state.systems.quirks;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const quirk = idleQuirkByIdV1(int(quirkId, -1));
  if (!quirk) throw new Error("QUIRK_INTROUVABLE");
  if (!idleDifficulteSuffisanteV1(IDLE_QUIRK_DIFFICULTE_V1, quirk.id, state.difficulty)) throw new Error("DIFFICULTE_REQUISE");
  const levels = s.data && typeof s.data === "object" ? s.data.levels : null;
  const currentLevel = Math.max(0, int(levels?.[quirk.id], 0));
  const cost = idleQuirkNextCostV1(quirk, currentLevel);
  if (!Number.isFinite(cost)) throw new Error("QUIRK_AU_MAXIMUM");
  if (state.currencies.qp < cost) throw new Error("MONNAIE_INSUFFISANTE");
  state.currencies.qp -= cost;
  if (!s.data || typeof s.data !== "object") s.data = { levels: {} };
  if (!s.data.levels || typeof s.data.levels !== "object") s.data.levels = {};
  s.data.levels[quirk.id] = currentLevel + 1;
  s.level = Object.values(s.data.levels).reduce((sum, v) => sum + Math.max(0, int(v, 0)), 0);
  return { cost, quirkId: quirk.id, level: currentLevel + 1, cap: quirk.cap };
}
