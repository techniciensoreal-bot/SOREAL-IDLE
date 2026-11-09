/*
 * VERSION DE SAUVEGARDE et REGISTRE DE MIGRATIONS (audit de cohérence 2026-11-09, front 3 « pas de sauvegarde versionnée » ; design/ARCHITECTURE-CIBLE.md, principe 5 : « schéma de sauvegarde versionné avec migrations testées »).
 *
 * DESIGN
 *  - `etatVersion` : un entier écrit dans l'état persistant (le JSON « metaNgu » de la colonne « Stats JSON » de la ligne du joueur), à côté de `saveSchema`. Valeur courante : ETAT_VERSION_COURANTE.
 *    Il est recopié dans le fichier d'« Exporter ma partie » (champ `etatVersion` du fichier) et dans les réponses de la synchro locale (export et envoi). Un entier constant : il ne change jamais d'un appel à l'autre,
 *    donc les clés de mémo du moteur (idle-ngu-bonus.js) ne sont pas affectées.
 *  - Échelle : 0 = sauvegarde qui n'est pas au format natif V47 (ancienne mode « legacy ») ; 47 = natif V47 sans le modèle de ressources V51 ; 51, 52 = jalons du modèle de ressources
 *    (`resourceModelVersion`) ; 53 = première version portée par `etatVersion`. Une sauvegarde SANS `etatVersion` est traitée comme « avant le registre » : sa version est déduite de ce qu'elle contient déjà
 *    (natif ? `resourceModelVersion` : 0) et elle reçoit toutes les migrations qui lui manquent, dans l'ordre.
 *  - Une migration = { de, vers, nom, phase, appliquer(etat, contexte) } :
 *      · PURE : ni horloge ni hasard (l'instant `contexte.now` et le contexte de jeu `contexte.jeu` sont des ARGUMENTS) ;
 *      · IDEMPOTENTE : `appliquerMigrationV1` ne joue la migration que si l'état est EXACTEMENT à la version `de`, puis écrit `etatVersion = vers` ; la rejouer ne change plus rien ;
 *      · `phase` : "brut" (sur l'état tel qu'il a été lu, avant toute normalisation) ou "normalise" (au milieu de normalizeIdleNguState, après la normalisation des ressources et des systèmes dont la
 *        migration dépend). Les migrations d'une phase s'enchaînent tant qu'une entrée a `de` = version courante de l'état.
 *      · `appliquer` retourne l'état migré (elle peut modifier l'objet reçu).
 *  - Registre CONTINU : chaque `de` est unique, `vers` > `de`, la chaîne part de chaque `de` et arrive à ETAT_VERSION_COURANTE sans trou ; la dernière entrée vise ETAT_VERSION_COURANTE.
 *  - Une version PLUS RÉCENTE que celle du moteur n'est JAMAIS abaissée ni réécrite : aucune migration n'est jouée, l'état est laissé tel quel et `etatPlusRecent: true` est renvoyé (un ancien client ne détruit pas
 *    une sauvegarde plus récente ; l'import par fichier la refuse, la synchro locale ne laisse pas un appareil plus ancien l'écraser).
 *  - Ajouter une migration : choisir `de` = ETAT_VERSION_COURANTE actuelle, `vers` = +1, monter ETAT_VERSION_COURANTE, ajouter une forme ancienne dans tests/_migrations-formes.mjs. Ne jamais modifier une migration déjà livrée.
 *
 * Les migrations ci-dessous reprennent TELLES QUELLES (même logique, déplacée sans modification de comportement) ce qui vivait en ligne dans idle-ngu-etat.js : la migration « legacy → V47 », le jalon V51 (réserve d'énergie libre
 * persistée) et le jalon V52 (fin des réservations d'Yggdrasil). Les fichiers voisins s'importent mutuellement (imports circulaires sans danger : rien n'est appelé au chargement).
 */
import { CHALLENGE_TIER_KEYS_V1, IDLE_NGU_AUGMENTATIONS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_META_VERSION, IDLE_NGU_SAVE_SCHEMA, IDLE_NGU_SYSTEMS, RESOURCE_KEYS, clamp, clone, createChallengeTiersV1, int, num } from "./idle-ngu-catalogues.js";
import { chaineSkinsNormaliseeV1 } from "./idle-daycare-skins-v1.js";
import { chainePortraitsNormaliseeV1 } from "./idle-portraits-v1.js";
import { normalizeIdleCardBonusesV1 } from "./idle-cards-v1.js";
import { IDLE_SELLOUT_SHOP_CATALOG_V1, createSelloutEffectsV1 } from "./idle-sellout-shop-v1.js";
import { createTrollStateV1, normaliserR3NomV1 } from "./idle-ngu-systemes.js";
import { externalResourceAllocation, totalAllocated } from "./idle-ngu-ressources.js";
import { baseState, normalizeResource } from "./idle-ngu-etat.js";

export const ETAT_VERSION_COURANTE = 53;

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
    if (key === "newbieOffersUsed" || key === "portrait" || key === "daycareSkin" || key === "daycareSkinsAcquis" || key === "daycareSkinsVus" || key === "portraitsAcquis" || key === "portraitsVus") continue;
    state.records[key] = Math.max(0, num(state.records[key], 0));
  }
  state.records.newbieOffersUsed = legacyNewbieOffersUsed.filter(id => typeof id === "string" && id);
  state.records.portrait = typeof state.records.portrait === "string" && state.records.portrait ? state.records.portrait : "default";
  state.records.daycareSkin = typeof state.records.daycareSkin === "string" ? state.records.daycareSkin.slice(0, 40) : "";
  /* Skins de la Garderie acquis pour toujours / annonces validées : chaînes d'ids séparés par des virgules, jamais des compteurs. */
  state.records.daycareSkinsAcquis = chaineSkinsNormaliseeV1(state.records.daycareSkinsAcquis);
  state.records.daycareSkinsVus = chaineSkinsNormaliseeV1(state.records.daycareSkinsVus);
  state.records.portraitsAcquis = chainePortraitsNormaliseeV1(state.records.portraitsAcquis);
  state.records.portraitsVus = chainePortraitsNormaliseeV1(state.records.portraitsVus);

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

/* ---------- Version d'un état ---------- */

function estObjet(o) { return Boolean(o) && typeof o === "object" && !Array.isArray(o); }

/* Format natif V47 : même test qu'avant le registre (normalizeIdleNguState). */
export function estNatifV47V1(etat) {
  return Boolean(etat) && etat.version === IDLE_NGU_META_VERSION && etat.saveSchema === IDLE_NGU_SAVE_SCHEMA;
}

/* `etatVersion` déclaré par l'état (entier > 0), sinon 0. */
export function etatVersionDeclareeV1(etat) {
  const v = estObjet(etat) ? Number(etat.etatVersion) : NaN;
  return Number.isInteger(v) && v > 0 ? v : 0;
}

export function etatPlusRecentV1(etat) { return etatVersionDeclareeV1(etat) > ETAT_VERSION_COURANTE; }

/*
 * Version à laquelle se trouve réellement un état. Déclarée (`etatVersion`) si elle existe ; sinon déduite de ce que l'état contient déjà :
 * pas au format natif -> 0 ; natif -> son `resourceModelVersion` (>= 52 -> 52, 51 -> 51, moins ou absent -> 47). C'est exactement la condition des anciens blocs en ligne (« resourceModelVersion < 51 », « < 52 »).
 */
export function versionEffectiveV1(etat, natif) {
  if (!estObjet(etat)) return 0;
  const declaree = etatVersionDeclareeV1(etat);
  if (declaree > ETAT_VERSION_COURANTE) return declaree;
  const nat = natif === undefined ? estNatifV47V1(etat) : Boolean(natif);
  if (!nat) return 0;
  if (declaree >= 47) return declaree;
  const r = Math.max(0, int(etat.resourceModelVersion, 0));
  return r >= 52 ? 52 : r === 51 ? 51 : 47;
}

/* ---------- Migrations ---------- */

export const MIGRATIONS = Object.freeze([
  Object.freeze({
    de: 0, vers: 52, nom: "legacy-vers-v47", phase: "brut",
    /* Ancienne sauvegarde (pas de format natif V47) : reconstruite sur l'état de base du modèle courant (resourceModelVersion 52, d'où `vers`). */
    appliquer(etat, contexte) { return migrateLegacyMetaToV47(etat, contexte.now); }
  }),
  Object.freeze({
    de: 47, vers: 51, nom: "reserve-energie-libre-v51", phase: "normalise",
    /* V51 migration: older V47/V50 saves had no persisted free-resource pool. The legacy row is consulted once when available, then metaNgu owns it. */
    appliquer(etat, contexte) {
      if (!estObjet(etat.resources) || !etat.resources.energy || !etat.resources.magic) return etat;
      const context = contexte.jeu || {};
      const energyHeldByMeta = totalAllocated(etat, "energy");
      const energyHeldExternally = externalResourceAllocation(context, "energy");
      const legacyEnergy = Number(context.legacyEnergyIdle);
      etat.resources.energy.current = Number.isFinite(legacyEnergy)
        ? clamp(legacyEnergy, 0, Math.max(0, etat.resources.energy.cap - energyHeldByMeta - energyHeldExternally))
        : Math.max(0, etat.resources.energy.cap - energyHeldByMeta - energyHeldExternally);
      etat.resources.energy.fillProgress = 0;
      etat.resources.energy.generatedThisRun = 0;

      const legacyMagic = Number(context.legacyMagicIdle);
      etat.resources.magic.current = Number.isFinite(legacyMagic)
        ? clamp(legacyMagic, 0, Math.max(0, etat.resources.magic.cap - totalAllocated(etat, "magic")))
        : 0;
      etat.resources.magic.fillProgress = 0;
      etat.resources.magic.generatedThisRun = 0;
      return etat;
    }
  }),
  Object.freeze({
    de: 51, vers: 52, nom: "fin-reservations-yggdrasil-v52", phase: "normalise",
    /* V52 removes the old Yggdrasil reservation/refund model. Existing active fruit reservations are converted once into actually spent idle resource. */
    appliquer(etat) {
      if (etat.systems && etat.systems.yggdrasil && etat.systems.yggdrasil.data && etat.systems.yggdrasil.data.reserved) {
        for (const resource of ["energy", "magic"]) {
          const reserved = Math.max(0, num(etat.systems.yggdrasil.data.reserved[resource], 0));
          if (reserved > 0 && etat.resources[resource]) {
            etat.resources[resource].current = Math.max(0, num(etat.resources[resource].current, 0) - reserved);
          }
          etat.systems.yggdrasil.data.reserved[resource] = 0;
        }
      }
      return etat;
    }
  }),
  Object.freeze({
    de: 52, vers: 53, nom: "version-etat-v53", phase: "normalise",
    /* Introduit `etatVersion` : rien d'autre à transformer, l'étiquette est posée par appliquerMigrationV1. */
    appliquer(etat) { return etat; }
  })
]);

/* Joue UNE migration si (et seulement si) l'état est à sa version `de`, puis pose `etatVersion = vers`. Idempotent. */
export function appliquerMigrationV1(migration, etat, contexte = {}) {
  if (versionEffectiveV1(etat) !== migration.de) return etat;
  const res = migration.appliquer(etat, contexte);
  const sortie = res === undefined ? etat : res;
  sortie.etatVersion = migration.vers;
  return sortie;
}

/*
 * Enchaîne les migrations jusqu'à ETAT_VERSION_COURANTE (ou jusqu'à la fin de `contexte.phase` si elle est donnée).
 * contexte : { now, jeu (contexte de jeu de normalizeIdleNguState), phase ("brut" | "normalise" | absent = toutes) }.
 * Retourne { etat, jouees (noms), etatPlusRecent, versionAvant, versionApres }. Version plus récente : rien n'est joué, l'état est rendu intact.
 */
export function migrerEtatV1(etat, contexte = {}) {
  if (etatPlusRecentV1(etat)) {
    const v = etatVersionDeclareeV1(etat);
    return { etat, jouees: [], etatPlusRecent: true, versionAvant: v, versionApres: v };
  }
  let courant = etat;
  let version = versionEffectiveV1(courant);
  const versionAvant = version;
  const jouees = [];
  const phase = contexte.phase || null;
  for (;;) {
    const m = MIGRATIONS.find((x) => x.de === version && (!phase || x.phase === phase));
    if (!m) break;
    courant = appliquerMigrationV1(m, courant, contexte);
    version = m.vers;
    jouees.push(m.nom);
  }
  return { etat: courant, jouees, etatPlusRecent: false, versionAvant, versionApres: version };
}

/* `etatVersion` porté par la colonne « Stats JSON » (37) d'une ligne de joueur (tableau de cellules) ; 0 si absent ou illisible. */
export const COL_STATS_JSON_ETAT_V1 = 37;
export function etatVersionDeLigneV1(cells) {
  try {
    const brut = Array.isArray(cells) ? cells[COL_STATS_JSON_ETAT_V1] : null;
    if (typeof brut !== "string" || brut.length < 2) return 0;
    const o = JSON.parse(brut);
    return etatVersionDeclareeV1(o && o.metaNgu);
  } catch (_) { return 0; }
}
