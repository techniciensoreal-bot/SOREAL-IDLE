/*
 * Énergie hors ligne et progression complète d'un joueur (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { normalizeBasicTrainingStateV411, BASIC_TRAINING_V411, isBasicTrainingSkillUnlockedV411, totalBasicTrainingAllocationV411 } from "./idle-basic-training.js";
import { syncIdleNguState, idleNguEffectiveResourceStat, idleNguResourceGenerationPerSecond, normalizeIdleNguState, idleNguBonuses } from "./idle-ngu-progression.js";
import { CONFIG_SOREAL_IDLE, bornerSorealIdle_, bossParMondeSorealIdle_, dateSorealIdle_, degatsRecusAventureSecondeSorealIdle_, dureeMaxCombatAventureSorealIdle_, nombreSorealIdle_, puissanceEffectiveAventureSorealIdle_ } from "./idle-runtime-config.js";
import { cleBestiaireMonstreSorealIdle_, genererObjetLegendaireRareAventureSorealIdle_, genererObjetLootSorealIdle_, marquerRencontreBestiaireSorealIdle_, parserJsonSorealIdle_, statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { construireAventureSorealIdle_, etatZoneAventureSorealIdle_, monstreZoneAventureParTypeSorealIdleGameV409_, progressionAventureSorealIdle_, synchroniserEntrainementBaseSorealIdleV41_ } from "./idle-runtime-aventure.js";
import { appliquerNiveauxSorealIdle_, attaqueBossSorealIdle_, cooldownAventureSorealIdle_, defenseBossSorealIdle_, degatsRecusSecondeSorealIdle_, enregistrerBossJamaisVaincuSorealIdle_, highestBossJamaisAtteintSorealIdle_, mettreAJourManaStatsSorealIdle_, multiplicateurDpsJoueurBossSorealIdle_, multiplicateurSceauBossSorealIdle_, nomBossSorealIdle_, nombreObjetsSacSorealIdle_, pvMaxBossSorealIdle_, recompenseXpBossNiveauSorealIdle_, regenBossSecondeSorealIdle_, xpBonusPremiereFoisSorealIdle_ } from "./idle-runtime-boss.js";
import { calculerPiecesSorealIdle_ } from "./idle-runtime-etat.js";
import { parametreSorealIdle_ } from "./idle-runtime-catalogue.js";
import { cloreCombatBossClassementV1_ } from "./idle-runtime-joueurs.js";
import { facteurExpBossPerkSorealIdle_ } from "./idle-runtime-combat.js";

/**
 * V40.7 — production d'énergie réellement discrète.
 *
 * La production affichée reste une vitesse moyenne par seconde, mais
 * l'énergie n'est créditée qu'au passage d'un vrai tick entier.
 * Le gain est toujours entier et la durée du tick est calculée pour
 * conserver exactement la production moyenne annoncée.
 */
export function metaTickEnergieSorealIdle_(productionSeconde) {
  const prod =
    Math.max(
      0.01,
      nombreSorealIdle_(
        productionSeconde,
        CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
      )
    );

  const minimumMs =
    Math.max(
      1,
      nombreSorealIdle_(
        CONFIG_SOREAL_IDLE.ENERGIE_TICK_MIN_MS,
        20
      )
    );

  /*
   * Choisir le plus petit gain ENTIER permettant de ne jamais descendre
   * sous le plancher visuel. Ensuite la durée exacte est dérivée du gain.
   * Exemples :
   * 0,25/s => +1 toutes les 4000 ms
   * 2/s    => +1 toutes les 500 ms
   * 20/s   => +2 toutes les 100 ms
   */
  const gain =
    Math.max(
      1,
      Math.ceil(
        prod * minimumMs / 1000 - 1e-12
      )
    );

  const dureeMs =
    Math.max(
      minimumMs,
      1000 * gain / prod
    );

  return {
    productionSeconde: prod,
    gain: gain,
    dureeMs: dureeMs
  };
}

export function calculerTicksEnergieSorealIdle_(
  productionSeconde,
  ecouleMs,
  resteMs
) {
  const meta =
    metaTickEnergieSorealIdle_(
      productionSeconde
    );

  const totalMs =
    Math.max(
      0,
      nombreSorealIdle_(resteMs, 0)
    ) +
    Math.max(
      0,
      nombreSorealIdle_(ecouleMs, 0)
    );

  const ticks =
    Math.max(
      0,
      Math.floor(
        (totalMs + 1e-7) /
        meta.dureeMs
      )
    );

  const reste =
    Math.max(
      0,
      Math.min(
        meta.dureeMs - 1e-7,
        totalMs - ticks * meta.dureeMs
      )
    );

  return {
    gain: meta.gain,
    dureeMs: meta.dureeMs,
    ticks: ticks,
    energieProduite:
      ticks * meta.gain,
    resteMs: reste
  };
}

export function creerSimulateurEnergieHorsLigneSorealIdle_(
  productionSeconde,
  energieInitiale,
  energieMax,
  resteTickMs
) {
  const maximum =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          energieMax,
          1
        )
      )
    );

  let energie =
    Math.floor(
      bornerSorealIdle_(
        energieInitiale,
        0,
        maximum
      )
    );

  let reste =
    Math.max(
      0,
      nombreSorealIdle_(
        resteTickMs,
        0
      )
    );

  let energieProduite = 0;
  let energiePerdueAuPlafond = 0;
  let energieDepensee = 0;

  return {
    avancer: function(ecouleMs) {
      const ticks =
        calculerTicksEnergieSorealIdle_(
          productionSeconde,
          Math.max(
            0,
            nombreSorealIdle_(
              ecouleMs,
              0
            )
          ),
          reste
        );

      reste =
        ticks.resteMs;

      energieProduite +=
        ticks.energieProduite;

      const avantPlafond =
        energie +
        ticks.energieProduite;

      const apresPlafond =
        Math.min(
          maximum,
          avantPlafond
        );

      energiePerdueAuPlafond +=
        Math.max(
          0,
          avantPlafond -
          apresPlafond
        );

      energie =
        Math.floor(
          apresPlafond +
          1e-9
        );

      return energie;
    },

    depenser: function(cout) {
      const montant =
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              cout,
              0
            )
          )
        );

      if (montant <= 0) {
        return true;
      }

      if (energie < montant) {
        return false;
      }

      energie -= montant;
      energieDepensee += montant;
      return true;
    },

    etat: function() {
      return {
        energie: energie,
        resteMs: reste,
        energieProduite:
          energieProduite,
        energiePerdueAuPlafond:
          energiePerdueAuPlafond,
        energieStockee:
          Math.max(
            0,
            energieProduite -
            energiePerdueAuPlafond
          ),
        energieDepensee:
          energieDepensee
      };
    }
  };
}

/**
 * Progression serveur de l'énergie.
 *
 * Le simulateur ci-dessus est utilisé par l'Aventure AUTO hors ligne afin
 * d'alterner réellement production et dépenses. Sans cela, une absence
 * longue remplissait d'abord la jauge jusqu'au plafond puis jetait toute
 * la production restante avant de simuler les combats.
 */
/*
 * V176 — intégration temporelle de HP Regen pendant Basic Training.
 *
 * NGU : HP Regen = Defense / 20. Defense n'est PAS constante pendant le
 * Basic Training : chaque skill suit Level^1.3 × BaseValue. Utiliser la
 * Defense de FIN de fenêtre pour toutes les secondes écoulées surcrédite
 * donc la récupération à chaque sync (jusqu'au plein instantané).
 *
 * On intègre exactement x^1.3 sur la trajectoire linéaire observée entre
 * le snapshot Basic Training avant/après. Si la fenêtre HP est plus longue
 * que la fenêtre BT (allocation enregistrée entre-temps), la portion plus
 * ancienne utilise la Defense du début — jamais celle de fin.
 */
/*
 * HP Regen du joueur en Fight Boss (Norman, 2026-10-02 : « dans NGU la regen finit par remplir la barre de vie ; dans SOREAL elle est toujours minuscule,
 * comme si la regen était beaucoup plus faible que la vie qui augmente »). Wiki NGU, page Boss Fights : « HP while fighting is 10*attack, and HP regain is
 * defense/20 » -- Attack et Defense comprenant TOUS les multiplicateurs (NUMBER, bonus). Les PV max (10 x Attack) les incluaient, mais l'intégrale ci-dessous
 * ne porte que sur la Defense d'ENTRAÎNEMENT brute : la régénération était donc divisée par le multiplicateur total (jusqu'à 1e30 après de gros Rebirths).
 * On reconstitue ici la Defense moyenne brute de la fenêtre, puis on lui applique le même multiplicateur que la Defense réelle :
 *   defense = 100 + (defenseEntrainement - 100) x multiplicateur  ->  moyenne réelle = 100 + (moyenne brute - 100) x multiplicateur.
 */
export function regenPvAvecMultiplicateursSorealIdle_(regenBruteIntegree,secondesHp,defenseTotale,defenseEntrainement){
  const hp=Math.max(0,nombreSorealIdle_(secondesHp,0));
  const regenBrute=Math.max(0,nombreSorealIdle_(regenBruteIntegree,0));
  if(hp<=0)return 0;
  const brute=Math.max(0,nombreSorealIdle_(defenseEntrainement,0))-100;
  const reelle=Math.max(0,nombreSorealIdle_(defenseTotale,0))-100;
  if(!(brute>0)||!(reelle>0))return regenBrute;
  const multiplicateur=reelle/brute;
  const moyenneBrute=regenBrute*20/hp;
  return Math.max(0,(100+Math.max(0,moyenneBrute-100)*multiplicateur)/20*hp);
}

export function regenPvIntegreeBasicTrainingSorealIdleV176_(
  avantBrut,
  apresBrut,
  secondesBt,
  secondesHp
){
  const hpSec=Math.max(0,nombreSorealIdle_(secondesHp,0));
  if(hpSec<=0)return 0;

  const btSec=Math.max(0,nombreSorealIdle_(secondesBt,0));
  const avant=normalizeBasicTrainingStateV411(avantBrut,Date.now());
  const apres=normalizeBasicTrainingStateV411(apresBrut,Date.now());

  function niveau_(skill){
    return Math.max(
      0,
      nombreSorealIdle_(skill&&skill.level,0)+
      Math.max(
        0,
        Math.min(
          .999999999,
          nombreSorealIdle_(skill&&skill.progress,0)
        )
      )
    );
  }

  function moyennePuissance13_(a,b){
    const x0=Math.max(0,nombreSorealIdle_(a,0));
    const x1=Math.max(x0,nombreSorealIdle_(b,x0));
    if(Math.abs(x1-x0)<1e-12)return Math.pow(x1,1.3);
    return (
      Math.pow(x1,2.3)-
      Math.pow(x0,2.3)
    )/(2.3*(x1-x0));
  }

  let defenseMoyenne=
    Math.max(
      0,
      nombreSorealIdle_(
        BASIC_TRAINING_V411.naturalDefense,
        100
      )
    );

  for(const def of BASIC_TRAINING_V411.skills){
    if(def.group!=="defense")continue;

    const s0=avant.skills&&avant.skills[def.id];
    const s1=apres.skills&&apres.skills[def.id];
    const l0=niveau_(s0);
    const l1=niveau_(s1);
    let debutFenetre=l0;
    let moyenneNiveau13=Math.pow(l0,1.3);

    if(btSec>1e-9){
      if(hpSec>=btSec){
        const moyenneBt=moyennePuissance13_(l0,l1);
        const extra=hpSec-btSec;
        moyenneNiveau13=
          (
            moyenneBt*btSec+
            Math.pow(l0,1.3)*extra
          )/hpSec;
      }else{
        const fraction=hpSec/btSec;
        debutFenetre=
          l1-(l1-l0)*fraction;
        moyenneNiveau13=
          moyennePuissance13_(
            debutFenetre,
            l1
          );
      }
    }

    defenseMoyenne+=
      moyenneNiveau13*
      Math.max(
        0,
        nombreSorealIdle_(def.baseValue,0)
      );
  }

  return Math.max(0,defenseMoyenne/20*hpSec);
}

/*
 * Gains hors ligne (Norman, 2026-10-12 : « quand on se connecte, on doit voir l'EXP, l'AP, le PP, etc. farmés hors ligne ; il me dit juste combien de Titans j'ai tués ») : écart POSITIF entre les monnaies (et la Magie, la
 * ressource 3) d'avant la synchronisation et celles d'après, tous gains confondus (Titans tués par l'Auto-Kill, combats auto d'Aventure, ITOPOD, Yggdrasil, Blood Magic...). Une monnaie qui n'a pas augmenté (ou
 * qu'on n'a pas encore) n'apparaît pas : le client n'affiche que les lignes > 0, donc rien de verrouillé n'est révélé.
 */
const DEVISES_HORS_LIGNE_V1 = ["experience", "ap", "pp", "qp", "gold", "blood", "seeds", "mayo"];

function instantaneDevisesHorsLigneV1_(metaNgu) {
  const dev = metaNgu && metaNgu.currencies && typeof metaNgu.currencies === "object" ? metaNgu.currencies : {};
  const res = metaNgu && metaNgu.resources && typeof metaNgu.resources === "object" ? metaNgu.resources : {};
  const out = {};
  DEVISES_HORS_LIGNE_V1.forEach(function(k) { out[k] = Math.max(0, nombreSorealIdle_(dev[k], 0)); });
  out.magic = Math.max(0, nombreSorealIdle_(res.magic && res.magic.current, 0));
  out.r3 = Math.max(0, nombreSorealIdle_(res.r3 && res.r3.current, 0));
  return out;
}

function gainsHorsLigneV1_(avant, apres) {
  const out = {};
  Object.keys(apres || {}).forEach(function(k) {
    const g = nombreSorealIdle_(apres[k], 0) - nombreSorealIdle_(avant && avant[k], 0);
    if (g > 0 && isFinite(g)) out[k] = g;
  });
  return out;
}

/* Kills de chaque titan (id -> nombre) dans l'état NGU : sert au résumé « Pendant ton absence » (titans tués par l'Auto-Kill entre deux synchronisations). */
function killsTitansMetaSorealIdleV1_(metaNgu) {
  const titans = metaNgu && metaNgu.adventure && metaNgu.adventure.titans && typeof metaNgu.adventure.titans === 'object'
    ? metaNgu.adventure.titans
    : {};
  const out = {};
  Object.keys(titans).forEach(function(id) {
    const k = Math.max(0, Math.floor(nombreSorealIdle_(titans[id] && titans[id].kills, 0)));
    if (k > 0) out[id] = k;
  });
  return out;
}

export function appliquerProgressionEnergieSorealIdle_(
  feuille,
  ligne
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row =
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .getValues()[0];

  // SOREAL_IDLE_V55_NGU_ENERGY_SOURCE_OF_TRUTH
  // Energy is advanced once by the shared NGU engine. The historical row
  // columns remain compatibility mirrors only and must never recalculate it.
  const statsRessourceV55 =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  /*
   * Norman (2026-09-27) : « Je n'ai pas le popup en relançant le jeu comme indiqué dans la 5.0 ».
   * Cause : depuis la V55 (l'énergie n'avance plus qu'une fois, via le moteur NGU ci-dessous),
   * `energieTheoriqueProduite` était resté figé à 0 (mort depuis la migration -- voir le commentaire
   * SOREAL_IDLE_V55_NO_LEGACY_ENERGY_TICKS plus bas) ET `gainNetEnergie` se soustrayait de LUI-MÊME
   * (nouvelleEnergie et energie venaient tous deux de l'état déjà synchronisé par syncIdleNguState,
   * jamais de l'état d'AVANT) : toujours 0, quelle que soit la production réelle pendant l'absence.
   * Avec le combat Fight Boss coupé au relancement (stopBossOnOpen, voir plus bas dans ce fichier) et
   * donc xp/bossBattus/dégâts eux aussi à 0 hors Aventure AUTO, plus rien ne pouvait jamais rendre le
   * popup non-vide pour une simple absence sans Aventure AUTO active. L'énergie d'avant synchro
   * (avant que syncIdleNguState ne la fasse avancer) est donc capturée ICI, pour calculer un vrai delta.
   */
  const energieAvantSyncNguV1 =
    Math.max(
      0,
      nombreSorealIdle_(
        statsRessourceV55.metaNgu &&
        statsRessourceV55.metaNgu.resources &&
        statsRessourceV55.metaNgu.resources.energy
          ? statsRessourceV55.metaNgu.resources.energy.current
          : row[c.ENERGIE - 1],
        0
      )
    );

  const collectionRessourceV55 =
    parserJsonSorealIdle_(
      row[c.COLLECTION_JSON - 1],
      {}
    );

  const killsTitansAvantSyncV1 = killsTitansMetaSorealIdleV1_(statsRessourceV55.metaNgu);
  const devisesAvantHorsLigneV1 = instantaneDevisesHorsLigneV1_(statsRessourceV55.metaNgu);

  const metaNguRessourceV55 =
    syncIdleNguState(
      statsRessourceV55.metaNgu,
      contexteMetaNguSorealIdle_(
        row,
        statsRessourceV55,
        collectionRessourceV55
      ),
      Date.now()
    );

  /* Titans tués par l'Auto-Kill depuis la dernière synchronisation : [{ id, n }] (le client n'affiche que ceux qu'il connaît). */
  const titansTuesHorsLigneV1 = (function() {
    const apres = killsTitansMetaSorealIdleV1_(metaNguRessourceV55);
    return Object.keys(apres)
      .map(function(id) { return { id: id, n: apres[id] - Math.max(0, killsTitansAvantSyncV1[id] || 0) }; })
      .filter(function(t) { return t.n > 0; })
      .slice(0, 40);
  })();

  statsRessourceV55.metaNgu =
    metaNguRessourceV55;

  row[c.STATS_JSON - 1] =
    JSON.stringify(statsRessourceV55);

  const energieMetaV55 =
    metaNguRessourceV55 &&
    metaNguRessourceV55.resources &&
    metaNguRessourceV55.resources.energy
      ? metaNguRessourceV55.resources.energy
      : {
          current: row[c.ENERGIE - 1],
          cap: row[c.ENERGIE_MAX - 1]
        };

  const energieBrute =
    Math.max(
      0,
      nombreSorealIdle_(
        energieMetaV55.current,
        0
      )
    );

  const energie =
    Math.max(
      0,
      Math.floor(
        energieBrute + 1e-9
      )
    );

  const energieMax =
    Math.max(
      1,
      nombreSorealIdle_(
        idleNguEffectiveResourceStat(metaNguRessourceV55, 'energy', 'cap'),
        1
      )
    );

  const prodSeconde =
    Math.max(
      0,
      idleNguResourceGenerationPerSecond(
        metaNguRessourceV55,
        "energy"
      )
    );

  const maintenantEntrainementV41 =
    Date.now();

  const entrainementAvantV176=
    normalizeBasicTrainingStateV411(
      statsRessourceV55.entrainementBase,
      maintenantEntrainementV41
    );

  const entrainementV41 =
    synchroniserEntrainementBaseSorealIdleV41_(
      feuille,
      ligne,
      row,
      maintenantEntrainementV41
    );

  const energieIdleMaxV41 =
    Math.max(
      0,
      energieMax -
      entrainementV41.allocation
    );

  const puissance =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.PUISSANCE - 1],
        1
      )
    );

  const endurance =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        1
      )
    );

  // V54: the historical global level is compatibility storage only.
  // Basic Training levels and NUMBER are the actual NGU progression axes.
  let niveau = 1;

  let xp =
    Math.max(
      0,
      nombreSorealIdle_(
        row[c.XP - 1],
        0
      )
    );

  let bossVaincus =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.BOSS_VAINCUS - 1],
          0
        )
      )
    );

  // Kept only so older serialized rows remain readable; combat uses the
  // native metaNgu totalRebirths resolved below.
  const renaissances =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.RENAISSANCES - 1],
          0
        )
      )
    );
  void renaissances;

  const statsCombat =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  // One-time deterministic migration: old row XP becomes Spend EXP only if
  // it is higher than the already migrated meta currency. Afterwards the row
  // is merely a compatibility mirror of metaNgu.currencies.experience.
  statsCombat.metaNgu=normalizeIdleNguState(
    statsCombat.metaNgu,
    contexteMetaNguSorealIdle_(
      row,
      statsCombat,
      parserJsonSorealIdle_(row[c.COLLECTION_JSON - 1],{})
    ),
    Date.now()
  );
  if(!statsCombat.legacyXpMigratedV54){
    statsCombat.metaNgu.currencies.experience=Math.max(
      Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0)),
      xp
    );
    statsCombat.legacyXpMigratedV54=true;
  }
  xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));

  const renaissanceNativeCountV54=Math.max(
    0,
    Math.floor(nombreSorealIdle_(statsCombat.metaNgu.records&&statsCombat.metaNgu.records.totalRebirths,0))
  );

  /*
   * V38.1 :
   * Ne jamais utiliser `maintenant` avant sa déclaration plus bas.
   * Ce timestamp sert uniquement à la régénération du mana à ce stade.
   */
  const maintenantMana =
    Date.now();

  mettreAJourManaStatsSorealIdle_(
    statsCombat,
    niveau,
    maintenantMana
  );

  let bossCombatIndex =
    bossVaincus;

  statsCombat.bossSelection =
    bossCombatIndex + 1;

  statsCombat.bossRespawnJusqua = 0;

  let bossBloqueRenaissance =
    bossCombatIndex === bossVaincus &&
    bossCombatIndex === bossParMondeSorealIdle_() - 1 &&
    renaissanceNativeCountV54 < 1;

  let combatBossActif =
    Boolean(
      statsCombat.combatBossActif
    );

  let pieces =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.PIECES - 1],
          calculerPiecesSorealIdle_(
            bossVaincus
          )
        )
      )
    );

  let inventaire =
    parserJsonSorealIdle_(
      row[c.INVENTAIRE_JSON - 1],
      []
    );

  if (!Array.isArray(inventaire)) {
    inventaire = [];
  }

  let equipement =
    parserJsonSorealIdle_(
      row[c.EQUIPEMENT_JSON - 1],
      {}
    );

  if (
    !equipement ||
    typeof equipement !== 'object'
  ) {
    equipement = {};
  }

  const defense =
    Math.max(
      0,
      nombreSorealIdle_(
        entrainementV41.defense,
        endurance
      )
    );

  /*
   * Fight Boss suit le modèle A/D : les PV max valent 10× l'attaque.
   * L'équipement Aventure sera branché comme multiplicateur séparé.
   */
  const pvJoueurMax =
    Math.max(
      1000,
      Math.round(
        entrainementV41.pvMax
      )
    );

  let pvJoueur =
    bornerSorealIdle_(
      nombreSorealIdle_(
        row[c.PV_JOUEUR - 1],
        pvJoueurMax
      ),
      0,
      pvJoueurMax
    );

  /*
   * V170 — 0 PV doit rester 0 tant que l'état K.O. n'a pas été traité.
   * La récupération Fight Boss part de cette valeur et ajoute Defense/20
   * par seconde ; l'ancien reset anticipé provoquait un plein instantané.
   */

  const bossPvMaxDefinition =
    pvMaxBossSorealIdle_(
      bossCombatIndex,
      metaNguRessourceV55.difficulty
    );

  const bossPvMaxEnregistre =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.BOSS_PV_MAX - 1],
        bossPvMaxDefinition
      )
    );

  let bossPvMax =
    bossPvMaxDefinition;

  let bossPv =
    nombreSorealIdle_(
      row[c.BOSS_PV - 1],
      bossPvMax
    );

  /*
   * Quand IDLE_BOSS est rééquilibré, une ancienne valeur mise en cache
   * dans JOUEURS ne doit pas conserver l'ancien boss plus faible.
   * Le boss repart à 100 % avec sa nouvelle fiche.
   */
  if (
    Math.abs(
      bossPvMaxEnregistre -
      bossPvMaxDefinition
    ) > 0.0001
  ) {
    bossPv =
      bossPvMaxDefinition;
  }

  if (
    bossPv < 0 ||
    bossPv > bossPvMax
  ) {
    bossPv = bossPvMax;
  }

  const derniereSynchroBrute =
    row[c.DERNIERE_SYNCHRO - 1];

  let derniereSynchro =
    dateSorealIdle_(
      derniereSynchroBrute,
      Date.now()
    );

  if (
    !Number.isFinite(derniereSynchro) ||
    derniereSynchro <= 0
  ) {
    derniereSynchro = Date.now();
  }

  const maintenant =
    Date.now();

  const ecouleReel =
    Math.max(
      0,
      (maintenant - derniereSynchro) /
      1000
    );

  const ecoulePrisEnCompte =
    Math.min(
      ecouleReel,
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'Progression hors ligne max (heures)',
            12
          ),
          12
        )
      ) *
      60 *
      60
    );

  /*
   * Norman (2026-09-16) : "la regen de vie m'a l'air plus lente que dans
   * NGU idle" — confirmé : la regen du Combat de boss numéroté utilisait
   * "Salle de repos" (regenPctSec, un pourcentage du pool max choisi par
   * numéro de salle), un mécanisme SOREAL jamais réellement rattaché à
   * une fonctionnalité que Norman reconnaît ("il n'y a en effet aucune
   * salle de repos" dans Combat de boss) — Defense n'intervenait nulle
   * part dans la regen, alors que investir en Defense devrait TOUJOURS
   * payer double (moins de dégâts subis ET regen plus rapide).
   *
   * Formule NGU réelle vérifiée (sayolove.github.io/ngu-guide, page
   * Fight Boss) : "HP Regen - Increasing Defense increases HP Regen by
   * Defense/20" — un montant ABSOLU de PV/seconde (jamais un pourcentage
   * du pool max). "Salle de repos" reste une sélection cosmétique
   * (nom/image, comme "apparence") ailleurs dans le moteur — seule sa
   * contribution à la regen disparaît ici, remplacée par la vraie règle.
   * pvJoueurMax, pvJoueur et ecoulePrisEnCompte sont tous initialisés
   * avant ce bloc. La récupération progressive après K.O. plus bas dans
   * la boucle de simulation réutilise cette même valeur — jamais un
   * second calcul, une seule source de vérité.
   */
  const regenPvSecJoueur =
    Math.max(
      0,
      defense / 20
    );

  if (!combatBossActif) {
    const regenPv =
      regenPvAvecMultiplicateursSorealIdle_(
        regenPvIntegreeBasicTrainingSorealIdleV176_(
          entrainementAvantV176,
          entrainementV41.stats&&
            entrainementV41.stats.entrainementBase,
          entrainementV41.secondes,
          ecoulePrisEnCompte
        ),
        ecoulePrisEnCompte,
        entrainementV41.defense,
        /* URGENT 2026-10-03 : la défense d'entraînement brute vit dans entrainementV41.COMBAT (le champ de premier niveau n'existe pas) : sans elle, le multiplicateur de la régénération était perdu et le serveur régénérait ~10^35 fois trop peu (la barre montait côté client puis retombait à la synchro). */
        entrainementV41.combat&&entrainementV41.combat.defenseEntrainement
      );

    pvJoueur =
      Math.min(
        pvJoueurMax,
        pvJoueur + regenPv
      );

    /*
     * Après une défaite ou une fuite, le boss conserve les PV qu'il lui
     * restait puis remonte progressivement selon SON HP Regen Fight Boss.
     * Un boss réellement vaincu (0 PV) ne ressuscite jamais ici.
     */
    if(
      bossPv>0 &&
      bossPv<bossPvMax
    ){
      bossPv=
        Math.min(
          bossPvMax,
          bossPv+
          regenBossSecondeSorealIdle_(
            bossCombatIndex,
            bossPvMax
          )*
          ecoulePrisEnCompte
        );
    }
  }


  /*
   * Migration V40.7 : une ancienne énergie fractionnaire (ex. 249,6)
   * n'est pas perdue. Sa fraction devient du temps déjà parcouru vers
   * le prochain vrai tick. Dès cette sauvegarde, ENERGIE reste entière.
   */
  // SOREAL_IDLE_V55_NO_LEGACY_ENERGY_TICKS
  // syncIdleNguState already accounted for online/offline Energy generation.
  // Running the former tick simulator here would credit the same elapsed
  // period a second time.
  const fractionEnergieHistorique = 0;
  const resteEnergieAvantProgressionMs = 0;
  statsCombat.energieTickResteMs = 0;
  /* Production brute réelle (avant toute dépense Aventure AUTO plus bas) : energie - energieAvantSyncNguV1, jamais 0 en dur. */
  const energieTheoriqueProduite =
    Math.max(
      0,
      energie -
      energieAvantSyncNguV1
    );
  let nouvelleEnergie = energie;
  const energieApresProduction = nouvelleEnergie;
  let energieStockeeParProduction = 0;
  let energiePerdueAuPlafond = 0;
  void fractionEnergieHistorique;
  void resteEnergieAvantProgressionMs;
  void energieApresProduction;

  /*
   * Ancienne colonne KO_JUSQUA : conservée dans le schéma pour ne pas
   * casser les sauvegardes existantes, mais Fight Boss n'utilise plus
   * aucun compte à rebours de K.O.
   */

  /*
   * V184 — invariant Fight Boss :
   * un boss ne peut JAMAIS être déclaré vaincu hors combat.
   *
   * Un 0 PV peut survivre brièvement à une transition asynchrone
   * (NUKE / changement de boss / réponse réseau ancienne). L'ancien
   * code forçait alors 1 ms de simulation même avec combatBossActif=false,
   * ce qui validait le NOUVEAU boss comme vaincu sans clic Fight.
   *
   * Hors combat, le boss courant doit donc être vivant. Si un 0 résiduel
   * est trouvé, il appartient nécessairement à l'ancienne instance et on
   * restaure le boss courant à son maximum au lieu de créditer une victoire.
   */
  if(
    !combatBossActif &&
    bossPv<=1e-9
  ){
    bossPv=bossPvMax;
  }

  let tempsRestant =
    combatBossActif
      ?Math.max(0,ecoulePrisEnCompte)
      :0;

  let tempsSimulation =
    derniereSynchro;

  let bossBattusMaintenant = 0;
  let xpGagnee = 0;
  let degatsInfliges = 0;
  let degatsRecus = 0;
  let koSubis = 0;
  let dropsRecents = [];
  let iterations = 0;

  /*
   * FTBE (2026-09-17) : suivi local du high-water-mark, avancé après
   * chaque kill qui bat le record du compte — un seul appel peut vaincre
   * plusieurs boss d'affilée, voir le commentaire de
   * highestBossJamaisAtteintSorealIdle_.
   */
  let highestBossJamaisAtteint =
    highestBossJamaisAtteintSorealIdle_(
      statsCombat.metaNgu
    );

  while (
    tempsRestant > 0.0001 &&
    iterations < 2000 &&
    !bossBloqueRenaissance &&
    combatBossActif
  ) {
    iterations += 1;

    /*
     * Aucun état K.O. intermédiaire. Si une ancienne sauvegarde arrive
     * déjà à 0 PV alors qu'un combat est encore marqué actif, la défaite
     * arrête simplement le combat et la récupération hors combat repart
     * de 0 à la prochaine progression.
     */
    if (pvJoueur <= 0) {
      pvJoueur=0;
      koSubis += 1;
      /* « En direct » : compteur de défaites contre un boss (modules/flux-v1.js) ; le combat passe d'actif à inactif une seule fois. */
      statsCombat.fluxBossDefaites=Math.max(0,Math.floor(nombreSorealIdle_(statsCombat.fluxBossDefaites,0)))+1;
      statsCombat.fluxBossDernier=bossCombatIndex+1;
      cloreCombatBossClassementV1_(statsCombat,false);
      statsCombat.combatBossActif=false;
      combatBossActif=false;
      break;
    }

    const attaqueBoss =
      attaqueBossSorealIdle_(
        bossCombatIndex,
        metaNguRessourceV55.difficulty
      );

    let degatsRecusSec =
      degatsRecusSecondeSorealIdle_(
        bossCombatIndex,
        defense,
        bossPv,
        bossPvMax,
        metaNguRessourceV55.difficulty
      );

    if (
      statsCombat.bossStunJusqua >
      tempsSimulation
    ) {
      degatsRecusSec = 0;
    }

    if (
      statsCombat.buffBouclierJusqua >
      tempsSimulation
    ) {
      degatsRecusSec *=
        Math.max(
          0.05,
          1 -
          Math.min(
            90,
            statsCombat.buffBouclierPct
          ) / 100
        );
    }

    /*
     * Norman (2026-09-16, deuxième signalement le même jour, en lançant NGU
     * et SOREAL IDLE en parallèle) : "vie qui ne descend pas à la même
     * vitesse dans les 2 jeux, régen de vie plus faible dans SOREAL IDLE."
     * Cause confirmée : regenPvSecJoueur (Defense/20) avait bien été
     * corrigé plus haut dans cette même fonction, mais UNIQUEMENT pour le
     * repos hors combat (if (!combatBossActif)) et l'attente de K.O. — la
     * vraie règle NGU (wiki NGU-idle.fandom.com, page Boss Fights : "HP
     * while fighting is 10*attack, and HP regain is defense/20") décrit
     * ces deux stats comme s'appliquant PENDANT le combat lui-même, pas
     * seulement au repos. Cette boucle de simulation (le combat actif)
     * n'avait donc jamais reçu la regen, ce qui rendait la vie du joueur
     * plus rapide à descendre ici que dans le vrai jeu. Nette directement
     * ici, sur la même resolution regenPvSecJoueur déjà utilisée plus
     * haut/plus bas — jamais un second calcul de regen.
     */
    /*
     * Régénération plus forte que les coups du boss (Norman, 2026-10-05 : « ma vie diminue de plus en plus lentement, s'arrête, puis remonte malgré le combat si la régén est plus forte que les coups de l'ennemi ; ça n'arrive jamais :
     * la barre reste statique et ne remonte qu'à la fin du combat ») : le net est signé. Positif = dégâts nets ; négatif = soin net par seconde, appliqué pendant le combat (jamais au-delà des PV max).
     */
    const soinJoueurSec =
      Math.max(
        0,
        regenPvSecJoueur -
        degatsRecusSec
      );
    degatsRecusSec =
      Math.max(
        0,
        degatsRecusSec -
        regenPvSecJoueur
      );

    const multiplicateurDpsBoss =
      multiplicateurDpsJoueurBossSorealIdle_(
        bossCombatIndex,
        statsCombat.immuniteParalysieJusqua >
          tempsSimulation
      );

    const multiplicateurSceau =
      multiplicateurSceauBossSorealIdle_(
        bossCombatIndex,
        statsCombat
      );

    const multiplicateurVulnerabilite =
      statsCombat.bossVulnerableJusqua >
      tempsSimulation
        ? 1 +
          Math.min(
            300,
            Math.max(
              0,
              statsCombat.bossVulnerablePct
            )
          ) / 100
        : 1;

    const regenBossSec =
      regenBossSecondeSorealIdle_(
        bossCombatIndex,
        bossPvMax
      );

    /*
     * V198 — Fight Boss : UNE seule formule client/serveur.
     *
     * NGU : les dégâts infligés au boss partent de
     *   max(Attack joueur - Defense boss, 0)
     * puis seulement les effets temporaires du combat s'appliquent.
     *
     * Le client suivait déjà cette règle, mais le serveur utilisait encore
     * `puissance` brute. Une synchronisation pouvait donc enlever beaucoup
     * plus de PV que l'écran, voire valider la mort d'un boss que le joueur
     * n'était pas encore capable de blesser.
     */
    const defenseBossCombat =
      defenseBossSorealIdle_(
        bossCombatIndex,
        metaNguRessourceV55.difficulty
      );

    const dpsJoueurBase =
      Math.max(
        0,
        puissance -
        defenseBossCombat
      );

    const dpsBossNet =
      Math.max(
        0,
        dpsJoueurBase *
        multiplicateurDpsBoss *
        multiplicateurSceau *
        multiplicateurVulnerabilite -
        regenBossSec
      );

    const tempsPourBoss =
      dpsBossNet > 0.000001
        ? bossPv /
          dpsBossNet
        : Number.POSITIVE_INFINITY;

    const tempsPourDefaite =
      degatsRecusSec > 0.000001
        ? pvJoueur /
          degatsRecusSec
        : Number.POSITIVE_INFINITY;

    const segment =
      Math.min(
        tempsRestant,
        tempsPourBoss,
        tempsPourDefaite
      );

    const dommageBoss =
      Math.min(
        bossPv,
        segment *
        dpsBossNet
      );

    const dommageJoueur =
      Math.min(
        pvJoueur,
        segment * degatsRecusSec
      );

    bossPv =
      Math.max(
        0,
        bossPv-dommageBoss
      );
    pvJoueur =
      Math.max(
        0,
        pvJoueur-dommageJoueur
      );
    if(soinJoueurSec>0&&pvJoueur>0){
      pvJoueur=Math.min(Math.max(pvJoueur,pvJoueurMax),pvJoueur+segment*soinJoueurSec);
    }

    /*
     * La mort n'est déclenchée que sur une valeur de PV exactement 0.
     * Le petit epsilon historique (<=0.0001) pouvait valider la mort
     * alors qu'un résidu positif subsistait encore dans l'état/barre.
     */
    if(bossPv<=1e-9)bossPv=0;
    if(pvJoueur<=1e-9)pvJoueur=0;

    degatsInfliges += dommageBoss;
    degatsRecus += dommageJoueur;

    tempsRestant -= segment;
    statsCombat.combatBossDureeSec=Math.max(0,nombreSorealIdle_(statsCombat.combatBossDureeSec,0))+segment;
    tempsSimulation +=
      segment * 1000;

    const bossMort =
      bossPv===0;

    const joueurBattu =
      pvJoueur===0;

    if (bossMort) {
      statsCombat.bossStunJusqua = 0;
      statsCombat.bossVulnerableJusqua = 0;
      statsCombat.bossVulnerablePct = 0;
      statsCombat.sceauBriseBossNumero = 0;

      /*
       * XP pilotée par l'écart entre le niveau du joueur et le niveau
       * prévu du boss. Un boss de ton niveau donne 100 %, puis la valeur
       * décroît progressivement jusqu'à 0.
       */
      const xpReelle =
        Math.max(
          0,
          Math.round(
            recompenseXpBossNiveauSorealIdle_(
              bossCombatIndex,
              niveau
            ) *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsCombat.metaNgu
                ).xpMultiplier,
                1
              )
            ) *
            facteurExpBossPerkSorealIdle_(
              idleNguBonuses(statsCombat.metaNgu),
              bossCombatIndex
            )
          )
        );

      /*
       * Les pièces des anciens boss restent réduites afin d'éviter
       * qu'un boss trivial devienne la meilleure source d'argent.
       */
      const ancienBoss =
        bossCombatIndex < bossVaincus;


      if (xpReelle > 0) {
        statsCombat.metaNgu.currencies.experience=
          Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0))+
          xpReelle;
        xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));
        xpGagnee += xpReelle;
      }

      /*
       * FTBE — bonus une seule fois par boss, jamais reversé aux kills
       * suivants (même run ou après Renaissance). Voir le commentaire de
       * highestBossJamaisAtteintSorealIdle_ : bossCombatIndex >= le
       * record avant CE kill signifie que ce boss n'a jamais été vaincu
       * sur ce compte.
       */
      const estPremiereFoisJamais =
        bossCombatIndex >= highestBossJamaisAtteint;

      const bonusPremiereFois =
        estPremiereFoisJamais
          ? Math.max(
              0,
              Math.round(
                xpBonusPremiereFoisSorealIdle_(
                  bossCombatIndex
                ) *
                Math.max(
                  1,
                  nombreSorealIdle_(
                    idleNguBonuses(
                      statsCombat.metaNgu
                    ).xpMultiplier,
                    1
                  )
                ) *
                facteurExpBossPerkSorealIdle_(
                  idleNguBonuses(statsCombat.metaNgu),
                  bossCombatIndex
                )
              )
            )
          : 0;

      if (bonusPremiereFois > 0) {
        statsCombat.metaNgu.currencies.experience=
          Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0))+
          bonusPremiereFois;
        xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));
        xpGagnee += bonusPremiereFois;
      }

      if (estPremiereFoisJamais) {
        enregistrerBossJamaisVaincuSorealIdle_(
          statsCombat.metaNgu,
          bossCombatIndex
        );
        highestBossJamaisAtteint =
          highestBossJamaisAtteintSorealIdle_(
            statsCombat.metaNgu
          );
      }

      /*
       * 2026-09-24 (Norman : « vérifie que l'XP et l'or affichés en bas de Fight Boss sont corrects » ; règle n°1) : un boss principal
       * ne rapporte que de l'EXP (wiki, page Boss Fights, colonne « Exp Reward » : aucune autre récompense) et l'équipement n'existe
       * qu'en Aventure (wiki, page Inventory). Les « pièces » et les objets tirés ici venaient de l'ancienne version de SOREAL IDLE
       * (colonnes inventées de la feuille IDLE_BOSS) : supprimés.
       */

      if (!ancienBoss) {
        bossVaincus += 1;
        bossBattusMaintenant += 1;
      }

      /*
       * V41.2 — le boss vaincu reste mort jusqu'à la Renaissance.
       * On avance immédiatement la sélection au boss suivant, sans aucun
       * cooldown de "reformation". Le prochain combat reste arrêté : le
       * joueur voit le nouveau boss et choisit quand lancer le combat.
       */
      cloreCombatBossClassementV1_(statsCombat,true);
      statsCombat.combatBossActif =
        false;

      combatBossActif =
        false;

      statsCombat.bossRespawnJusqua = 0;

      bossCombatIndex =
        bossVaincus;

      statsCombat.bossSelection =
        bossCombatIndex + 1;

      bossBloqueRenaissance = false;

      bossPvMax =
        pvMaxBossSorealIdle_(
          bossCombatIndex
        );

      bossPv =
        bossPvMax;
    }

    if (joueurBattu) {
      /*
       * Défaite Fight Boss façon NGU :
       * - le coup fatal met immédiatement le joueur à 0 ;
       * - le combat s'arrête immédiatement ;
       * - le boss GARDE exactement les PV qu'il lui reste ;
       * - aucune période K.O. n'est créée.
       *
       * À partir du prochain tick hors combat, chacun récupère
       * progressivement selon sa propre regen.
       */
      pvJoueur=0;
      koSubis += 1;
      statsCombat.fluxBossDefaites=Math.max(0,Math.floor(nombreSorealIdle_(statsCombat.fluxBossDefaites,0)))+1;
      statsCombat.fluxBossDernier=bossCombatIndex+1;
      cloreCombatBossClassementV1_(statsCombat,false);
      statsCombat.combatBossActif=false;
      combatBossActif=false;
    }

    if (
      segment <= 0.000001 &&
      !bossMort &&
      !joueurBattu
    ) {
      break;
    }
  }

  const progressionNiveau =
    appliquerNiveauxSorealIdle_(
      niveau,
      xp
    );

  niveau =
    progressionNiveau.niveau;

  xp =
    progressionNiveau.xp;

  const bossActuel =
    nomBossSorealIdle_(
      bossCombatIndex
    );


  /*
   * AUTO-AVENTURE HORS LIGNE
   * On ne l'applique qu'après une vraie coupure (> 20 s)
   * pour éviter de doubler les combats du client en ligne.
   */
  let pointsAventureAuto =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[
            c.AVENTURE_POINTS - 1
          ],
          0
        )
      )
    );

  /*
   * Norman (2026-09-27) : « Quand on relance le jeu on doit avoir un résumé de ce qu'on a eu. EXP, AP, Loot,
   * ATTACK, DEFENSE... » -- l'AP gagné hors ligne était déjà calculé (pointsAventureAuto ci-dessus, incrémenté à
   * chaque victoire auto puis persisté) mais jamais renvoyé au client : seul le delta compte pour le résumé.
   */
  const pointsAventureAutoAvant = pointsAventureAuto;

  let progressionAventureAuto =
    progressionAventureSorealIdle_(
      row[
        c.AVENTURE_PROGRESSION_JSON - 1
      ]
    );

  /*
   * AUTO et progression générale doivent modifier le MÊME objet stats.
   * L'ancienne copie temporaire pouvait être réécrasée en fin de synchro,
   * notamment pour les rencontres du Bestiaire découvertes hors ligne.
   */
  const statsAuto =
    statsCombat;

  let combatsAutoHorsLigne = 0;
  let victoiresAutoHorsLigne = 0;
  let lootsAutoHorsLigne = [];
  let energieDepenseeAventureAuto = 0;
  let creneauxAutoHorsLigne = 0;
  let limiteAutoHorsLigneAtteinte = false;
  /*
   * Norman (2026-09-29) : « le combat doit être calculé comme s'il avait
   * eu lieu... il devra pouvoir lire dans le journal de combat la manière
   * dont il est mort. » Seule la DERNIÈRE défaite est utile à raconter
   * (celle qui a arrêté le farm) : le monstre et la zone qui ont eu raison
   * du joueur, affichés par verifierDefaiteAutoAventureIdleV1_ (client).
   */
  let derniereDefaiteAuto = null;

  if (
    ecouleReel >= 20 &&
    statsAuto.autoAventure &&
    statsAuto.autoAventureZone > 0
  ) {
    const aventureAuto =
      construireAventureSorealIdle_(
        row,
        statsAuto.metaNgu &&
          statsAuto.metaNgu.records &&
          statsAuto.metaNgu.records.highestBoss || 0
      );

    const zoneAuto =
      (
        aventureAuto &&
        Array.isArray(
          aventureAuto.zones
        )
          ? aventureAuto.zones
          : []
      ).find(function(z) {
        return (
          Math.floor(
            nombreSorealIdle_(
              z.id,
              0
            )
          ) ===
          statsAuto.autoAventureZone
        );
      });

    if (
      zoneAuto &&
      zoneAuto.debloquee
    ) {
      /*
       * V40.2 : l'AUTO hors ligne utilise le MÊME cooldown de gameplay
       * que les rencontres visibles. Il n'ajoute plus son ancien plancher
       * indépendant de 2/8 secondes : les améliorations des mondes futurs
       * pourront donc réellement accélérer toute la boucle Aventure.
       */
      const intervalle =
        Math.max(
          .15,
          cooldownAventureSorealIdle_(
            zoneAuto,
            statsAuto
          )
        );

      /*
       * Norman (2026-09-29) : « Je veux qu'on puisse farmer le mode
       * aventure tout en étant hors ligne avec quelques contraintes. 8h
       * maximum de farming hors ligne. » Plafond local à ce bloc
       * uniquement (n'affecte jamais l'énergie ni les autres systèmes,
       * qui restent sur ecoulePrisEnCompte/sa propre limite générale).
       */
      const ecoulePrisEnCompteAventureAuto =
        Math.min(
          ecoulePrisEnCompte,
          8 * 60 * 60
        );

      const creneauxDisponibles =
        Math.max(
          0,
          Math.floor(
            ecoulePrisEnCompteAventureAuto /
            intervalle
          )
        );

      const limiteSimulation =
        Math.max(
          250,
          Math.min(
            50000,
            Math.floor(
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'AVENTURE_AUTO_HORS_LIGNE_MAX_TENTATIVES',
                  12000
                ),
                12000
              )
            )
          )
        );

      const essaisTemps =
        Math.min(
          limiteSimulation,
          creneauxDisponibles
        );

      creneauxAutoHorsLigne =
        creneauxDisponibles;

      limiteAutoHorsLigneAtteinte =
        creneauxDisponibles >
        essaisTemps;

      /*
       * Important : on repart de l'énergie réellement présente au début
       * de l'absence et on fait avancer les ticks jusqu'à chaque créneau.
       * La production peut donc remplir à nouveau la jauge après un combat,
       * au lieu d'être perdue parce que la jauge avait atteint son plafond
       * avant la simulation.
       */
      // SOREAL_IDLE_V55_NO_LEGACY_OFFLINE_ENERGY
      // Adventure AUTO keeps its historical chronology, but Energy itself
      // was already generated by metaNgu. This adapter is deliberately inert.
      const simulateurEnergieAuto = {
        avancer: function() {
          return nouvelleEnergie;
        },
        etat: function() {
          return {
            energie: nouvelleEnergie,
            resteMs: 0,
            energieProduite: 0,
            energiePerdueAuPlafond: 0,
            energieStockee: 0,
            energieDepensee: 0
          };
        }
      };

      const totalAutoMs =
        ecoulePrisEnCompteAventureAuto *
        1000;

      const intervalleAutoMs =
        intervalle *
        1000;

      let tempsAutoSimuleMs = 0;

      const capaciteSac =
        Math.max(
          CONFIG_SOREAL_IDLE
            .INVENTAIRE_CAPACITE_BASE,
          Math.floor(
            nombreSorealIdle_(
              row[
                c.INVENTAIRE_CAPACITE - 1
              ],
              CONFIG_SOREAL_IDLE
                .INVENTAIRE_CAPACITE_BASE
            )
          )
        );

      /*
       * Norman (2026-09-29) : « Jamais plus de 70% des cases de
       * l'inventaire. Il faut toujours une place disponible pour les
       * loots titans etc. » Plafond dédié au farm hors ligne uniquement
       * -- un loot obtenu manuellement (en ligne) continue de remplir le
       * sac jusqu'à 100%, seul ce farm automatique et invisible s'arrête
       * plus tôt pour laisser de la place.
       */
      const capaciteSacFarmHorsLigneV1 =
        Math.floor(
          capaciteSac * 0.7
        );

      for (
        let tentative = 0;
        tentative < essaisTemps;
        tentative += 1
      ) {
        const cibleTempsMs =
          Math.min(
            totalAutoMs,
            (tentative + 1) *
            intervalleAutoMs
          );

        simulateurEnergieAuto.avancer(
          Math.max(
            0,
            cibleTempsMs -
            tempsAutoSimuleMs
          )
        );

        tempsAutoSimuleMs =
          cibleTempsMs;

        /* V44 : l'AUTO Aventure hors ligne n'est jamais limité par l'énergie. */

        combatsAutoHorsLigne += 1;

        const etatZone =
          etatZoneAventureSorealIdle_(
            progressionAventureAuto,
            zoneAuto.id
          );

        const tousLes =
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'AVENTURE_ENNEMIS_PAR_ZONE',
                  5
                ),
                5
              )
            )
          );

        const bossProgramme =
          etatZone.progressionBoss >=
          tousLes - 1;

        const chanceRareAuto =
          Math.max(
            0,
            Math.min(
              1,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'AVENTURE_RARE_CHANCE',
                  0.003
                ),
                0.003
              )
            )
          );

        const monstreRareAuto =
          monstreZoneAventureParTypeSorealIdleGameV409_(
            zoneAuto.id,
            'rare'
          );

        const rareAuto =
          Boolean(
            monstreRareAuto &&
            Math.random() <
            Math.min(
              chanceRareAuto,
              Math.max(
                0,
                nombreSorealIdle_(
                  monstreRareAuto.chanceRencontre,
                  chanceRareAuto
                )
              )
            )
          );

        const typeRencontreAuto =
          rareAuto
            ? 'rare'
            : bossProgramme
              ? 'boss_zone'
              : 'normal';

        const combatBoss =
          typeRencontreAuto === 'boss_zone';

        const monstreAuto =
          rareAuto
            ? monstreRareAuto
            : (
                monstreZoneAventureParTypeSorealIdleGameV409_(
                  zoneAuto.id,
                  typeRencontreAuto
                ) ||
                {
                  id:
                    'Z'+
                    zoneAuto.id+
                    (combatBoss?'_BOSS':'_NORMAL'),
                  zoneId:zoneAuto.id,
                  type:typeRencontreAuto,
                  nom:
                    combatBoss
                      ?zoneAuto.boss
                      :zoneAuto.ennemi,
                  emoji:
                    combatBoss
                      ?'👑'
                      :(zoneAuto.emoji||'👾'),
                  pv:
                    combatBoss
                      ?zoneAuto.pvBoss
                      :zoneAuto.pvEnnemi,
                  attaque:
                    combatBoss
                      ?zoneAuto.attaqueBoss
                      :zoneAuto.attaqueEnnemi,
                  chanceLegendaire:0,
                  objetLegendaire:'',
                  slotLegendaire:'',
                  baseLegendaire:0
                }
              );

        marquerRencontreBestiaireSorealIdle_(
          statsAuto,
          cleBestiaireMonstreSorealIdle_(
            monstreAuto
          )
        );

        const statsEnnemi = {
          pv:
            Math.max(
              1,
              nombreSorealIdle_(
                monstreAuto&&monstreAuto.pv,
                1
              )
            ),
          attaque:
            Math.max(
              0,
              nombreSorealIdle_(
                monstreAuto&&monstreAuto.attaque,
                0
              )
            )
        };

        const degatsRecusSec =
          degatsRecusAventureSecondeSorealIdle_(
            statsEnnemi.attaque,
            defense
          );

        const puissanceAventureAuto =
          puissanceEffectiveAventureSorealIdle_(
            puissance *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsAuto.metaNgu
                ).adventureMultiplier,
                1
              )
            ),
            statsEnnemi.pv,
            zoneAuto.id,
            combatBoss,
            inventaire,
            equipement
          );

        const tempsVictoire =
          statsEnnemi.pv /
          Math.max(
            1,
            puissanceAventureAuto.effective
          );

        const tempsKoAuto =
          pvJoueurMax /
          degatsRecusSec;

        const tempsLimiteAuto =
          dureeMaxCombatAventureSorealIdle_(
            combatBoss
          );

        if (
          tempsVictoire >
          Math.min(
            tempsKoAuto,
            tempsLimiteAuto
          )
        ) {
          derniereDefaiteAuto = {
            monstre:
              String(
                (monstreAuto && monstreAuto.nom) || ''
              ),
            zone:
              String(
                (zoneAuto && zoneAuto.nom) || ''
              ),
            boss: combatBoss,
            /* K.O. réel (le joueur a été vaincu) plutôt qu'un simple abandon faute de temps. */
            ko: tempsKoAuto <= tempsLimiteAuto
          };

          if (combatBoss) {
            etatZone.progressionBoss = 0;
            etatZone.bossEchecs += 1;

            progressionAventureAuto[
              String(
                zoneAuto.id
              )
            ] = etatZone;
          }

          break;
        }

        etatZone.victoires += 1;

        if (combatBoss) {
          etatZone.progressionBoss = 0;
        } else if (!rareAuto) {
          etatZone.progressionBoss =
            Math.min(
              tousLes - 1,
              etatZone.progressionBoss + 1
            );
        }
        victoiresAutoHorsLigne += 1;

        pointsAventureAuto +=
          Math.max(
            1,
            nombreSorealIdle_(
              zoneAuto.points,
              2
            ) *
            (
              rareAuto
                ?2
                :combatBoss
                  ?3
                  :1
            )
          );

        pieces +=
          Math.max(
            1,
            nombreSorealIdle_(
              zoneAuto.pieces,
              4
            ) *
            (
              rareAuto
                ?3
                :combatBoss
                  ?4
                  :1
            )
          );

        if (combatBoss) {
          etatZone.bossVaincu = true;
        }

        let lootAuto = null;

        if (rareAuto) {
          lootAuto =
            genererObjetLegendaireRareAventureSorealIdle_(
              monstreAuto,
              zoneAuto,
              niveau
            );
        }

        if (!lootAuto) {
          lootAuto =
            genererObjetLootSorealIdle_({
              zoneId:
                zoneAuto.id,
              zoneNom:
                zoneAuto.nom,
              bossNom:
                monstreAuto.nom,
              ignorerFiltreBoss:
                true,
              garantirLoot:
                combatBoss,
              chanceMultiplicateur:
                (
                  combatBoss
                    ? 1
                    : rareAuto
                      ? 0.70
                      : Math.max(
                          0,
                          nombreSorealIdle_(
                            parametreSorealIdle_(
                              'AVENTURE_LOOT_NORMAL_MULTIPLICATEUR',
                              0.30
                            ),
                            0.30
                          )
                        )
                ) *
                Math.max(
                  1,
                  nombreSorealIdle_(
                    idleNguBonuses(
                      statsAuto.metaNgu
                    ).dropMultiplier,
                    1
                  )
                ),
              progression:
                Math.max(
                  0,
                  zoneAuto.id * 2
                )
            });
        }

        if (
          lootAuto &&
          nombreObjetsSacSorealIdle_(
            inventaire,
            equipement
          ) <
          capaciteSacFarmHorsLigneV1
        ) {
          inventaire.push(
            lootAuto
          );

          lootsAutoHorsLigne.push(
            lootAuto
          );
        }

        progressionAventureAuto[
          String(
            zoneAuto.id
          )
        ] = etatZone;
      }

      /*
       * Même si l'AUTO s'arrête (défaite ou limite CPU), le temps restant
       * continue de produire de l'énergie. On termine donc la chronologie
       * jusqu'à la fin de la période hors ligne.
       */
      simulateurEnergieAuto.avancer(
        Math.max(
          0,
          totalAutoMs -
          tempsAutoSimuleMs
        )
      );

      const etatEnergieAuto =
        simulateurEnergieAuto.etat();

      nouvelleEnergie =
        etatEnergieAuto.energie;

      statsCombat.energieTickResteMs =
        etatEnergieAuto.resteMs;

      energieStockeeParProduction =
        etatEnergieAuto.energieStockee;

      energiePerdueAuPlafond =
        etatEnergieAuto
          .energiePerdueAuPlafond;

      energieDepenseeAventureAuto =
        etatEnergieAuto
          .energieDepensee;
    }
  }

  if (
    combatsAutoHorsLigne > 0
  ) {
    statsAuto.combatsAventure +=
      combatsAutoHorsLigne;

    statsAuto.victoiresAventure +=
      victoiresAutoHorsLigne;

    statsAuto.lootsObtenus +=
      lootsAutoHorsLigne.length;

    statsCombat.combatsAventure =
      statsAuto.combatsAventure;

    statsCombat.victoiresAventure =
      statsAuto.victoiresAventure;

    statsCombat.lootsObtenus =
      statsAuto.lootsObtenus;

    feuille
      .getRange(
        ligne,
        c.AVENTURE_PROGRESSION_JSON
      )
      .setValue(
        JSON.stringify(
          progressionAventureAuto
        )
      );

    feuille
      .getRange(
        ligne,
        c.AVENTURE_POINTS
      )
      .setValue(
        pointsAventureAuto
      );

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          statsAuto
        )
      );
  }

  mettreAJourManaStatsSorealIdle_(
    statsCombat,
    niveau,
    maintenant
  );

  const energieDepenseeAventureHorsLigne =
    Math.max(
      0,
      energieDepenseeAventureAuto
    );

  /* Net réel : depuis l'énergie d'AVANT synchro (energieAvantSyncNguV1), jamais depuis "energie" (déjà l'état d'APRÈS -- toujours 0 sinon). */
  const gainNetEnergie =
    nouvelleEnergie -
    energieAvantSyncNguV1;

  niveau=1;
  xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));
  feuille.getRange(ligne,c.NIVEAU).setValue(1);
  feuille.getRange(ligne,c.XP).setValue(xp);
  feuille.getRange(ligne,c.ENERGIE).setValue(nouvelleEnergie);
  feuille.getRange(ligne,c.ENERGIE_MAX).setValue(energieMax);
  feuille.getRange(ligne,c.PROD_SECONDE).setValue(prodSeconde);
  feuille.getRange(ligne,c.BOSS_ACTUEL).setValue(bossActuel);
  feuille.getRange(ligne,c.BOSS_PV).setValue(Math.max(0,Math.round(bossPv)));
  feuille.getRange(ligne,c.BOSS_PV_MAX).setValue(bossPvMax);
  feuille.getRange(ligne,c.BOSS_VAINCUS).setValue(bossVaincus);
  feuille.getRange(ligne,c.PIECES).setValue(pieces);
  feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(statsCombat));
  feuille.getRange(ligne,c.INVENTAIRE_JSON).setValue(JSON.stringify(inventaire));
  feuille.getRange(ligne,c.EQUIPEMENT_JSON).setValue(JSON.stringify(equipement));
  feuille.getRange(ligne,c.PV_JOUEUR).setValue(Math.max(0,Math.round(pvJoueur)));
  feuille.getRange(ligne,c.PV_JOUEUR_MAX).setValue(pvJoueurMax);

  /*
   * Plus aucun K.O. Fight Boss persistant.
   * Nettoie également les anciennes sauvegardes qui avaient encore
   * une date KO_JUSQUA.
   */
  feuille.getRange(ligne,c.KO_JUSQUA).clearContent();

  feuille
    .getRange(
      ligne,
      c.DERNIERE_SYNCHRO
    )
    .setValue(
      new Date(maintenant)
    );

  return {
    energie:
      nouvelleEnergie,

    gain:
      Math.max(
        0,
        gainNetEnergie
      ),

    gainNet:
      gainNetEnergie,

    energieProduite:
      energieTheoriqueProduite,

    energieStockee:
      energieStockeeParProduction,

    energiePerdueAuPlafond:
      energiePerdueAuPlafond,

    energieDepenseeAventure:
      energieDepenseeAventureHorsLigne,

    secondesEcoulees:
      Math.floor(ecouleReel),

    secondesComptabilisees:
      Math.floor(ecoulePrisEnCompte),

    degats:
      Math.round(
        degatsInfliges
      ),

    degatsRecus:
      Math.round(
        degatsRecus
      ),

    koSubis:
      koSubis,

    bossBattus:
      bossBattusMaintenant,

    bossBloqueRenaissance:
      bossBloqueRenaissance,

    xpGagnee:
      xpGagnee,

    niveauxGagnes:
      progressionNiveau
        .niveauxGagnes,

    apGagne:
      Math.max(
        0,
        pointsAventureAuto -
          pointsAventureAutoAvant
      ),

    dropsRecents:
      dropsRecents.concat(
        lootsAutoHorsLigne
      ),

    titansTues:
      titansTuesHorsLigneV1,

    /* écart des monnaies et ressources (Magie, ressource 3) entre avant et après l'absence */
    gainsMeta:
      gainsHorsLigneV1_(devisesAvantHorsLigneV1, instantaneDevisesHorsLigneV1_(statsCombat.metaNgu)),

    autoAventureHorsLigne: {
      combats:
        combatsAutoHorsLigne,
      victoires:
        victoiresAutoHorsLigne,
      loots:
        lootsAutoHorsLigne.length,
      creneaux:
        creneauxAutoHorsLigne,
      limiteAtteinte:
        limiteAutoHorsLigneAtteinte,
      derniereDefaite:
        derniereDefaiteAuto
    }
  };
}

/**
 * ============================================================
 * MÉTAPROGRESSION V42
 * ============================================================
 */
export function contexteMetaNguSorealIdle_(
  row,
  stats,
  collection
) {
  const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
  const progressionCollections =
    collection && typeof collection === 'object'
      ? collection
      : {};
  /*
   * 2026-09-23 (audit NGU) : entrainementBase.skills est un OBJET indexé par
   * id (createBasicTrainingStateV411), pas un tableau -- le test
   * Array.isArray d'origine était toujours faux, donc attackTrainingLevels
   * valait toujours 0 (facteur NUMBER "training level" bloqué à 1,
   * wiki : Floor(1 + Attack_Basic_Training_Levels / 10 000)) et
   * basicTrainingComplete toujours false (Advanced Training, débloqué par
   * le wiki "once both Ultimate Attack and Ultimate Buff are unlocked",
   * ne pouvait donc jamais s'ouvrir).
   */
  const etatEntrainementBase =
    stats && stats.entrainementBase
      ? normalizeBasicTrainingStateV411(stats.entrainementBase, Date.now())
      : null;
  const skills =
    etatEntrainementBase
      ? BASIC_TRAINING_V411.skills.map(function(def) {
          const skill = etatEntrainementBase.skills[def.id] || {};
          return {
            id: def.id,
            level: skill.level,
            unlocked: isBasicTrainingSkillUnlockedV411(etatEntrainementBase, def)
          };
        })
      : [];
  const attackTrainingLevels =
    skills.reduce(function(total, skill) {
      /*
       * 2026-09-23 (audit) : wiki "Rebirths" -- facteur d'entraînement = +1 par
       * 10 000 niveaux d'entraînement d'ATTAQUE. Le filtre ne retenait que les
       * ids "attaque_*" et ignorait trois entraînements du groupe attaque
       * (contre_palette, percee_quai, ultime_soreal).
       */
      const id = String(skill && skill.id || '');
      const def = BASIC_TRAINING_V411.skills.find(function(d) { return d.id === id; });
      return total + (
        def && def.group === 'attack'
          ? Math.max(0, nombreSorealIdle_(skill.level, 0))
          : 0
      );
    }, 0);
  const meta =
    stats && stats.metaNgu && typeof stats.metaNgu === 'object'
      ? stats.metaNgu
      : {};
  const metaRecords =
    meta.records && typeof meta.records === 'object'
      ? meta.records
      : {};
  const metaCurrencies =
    meta.currencies && typeof meta.currencies === 'object'
      ? meta.currencies
      : {};
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * beastBrutalDefeated/exileBrutalDefeated vivent dans l'état Aventure
   * (idle-adventure-v47.js::titan(), s.unlockFlags), imbriqué sous
   * metaNgu.adventure -- jamais au même niveau que metaRecords/
   * metaCurrencies ci-dessus. Exposés ici pour
   * idleNguDifficultyUnlockRequirementsV1 (idle-ngu-progression.js),
   * qui ne lit que `context`, jamais l'état Aventure directement.
   */
  const metaAdventureUnlockFlags =
    meta.adventure && meta.adventure.unlockFlags && typeof meta.adventure.unlockFlags === 'object'
      ? meta.adventure.unlockFlags
      : {};

  return {
    bosses: Math.max(0,nombreSorealIdle_(row[c.BOSS_VAINCUS - 1],0)),
    rebirths: Math.max(
      0,
      nombreSorealIdle_(
        metaRecords.totalRebirths,
        nombreSorealIdle_(row[c.RENAISSANCES - 1],0)
      )
    ),
    zone: Math.max(1,nombreSorealIdle_(row[c.AVENTURE_ZONE - 1],1)),
    sets: Array.isArray(progressionCollections.zones)
      ? progressionCollections.zones.filter(function(z){return Boolean(z&&z.complete);}).length
      : 0,
    /*
     * Norman (2026-09-14) : "Mes PV en mode aventure doivent démarrer à
     * 50... là je suis à 703M, ça n'est pas normal." Cause confirmée :
     * adventurePower/adventureToughness (consommés par
     * idleAdventureCombatStatsV1, idle-ngu-progression.js, pour Power/
     * Toughness/HP/Regen de combat ET pour l'ITOPOD) étaient alimentés
     * par le Basic Training Attack/Defense — le NUMBER principal, en
     * dizaines de millions dès le milieu de partie. Vérifié sur le wiki
     * NGU (page Adventure Mode) : c'est l'INVERSE — "for every point of
     * Power/Toughness from your gear, you also get +1% Attack/Defense"
     * (l'équipement d'Aventure influence le NUMBER, jamais le contraire).
     * Power/Toughness/HP d'Aventure viennent UNIQUEMENT de l'équipement
     * d'Aventure (déjà sommé séparément par idleAdventureEquipmentStatsV47
     * puis ajouté par idleAdventureCombatStatsV1) — aucune valeur externe
     * n'existe ici pour ce contexte, les repli déjà en place partout où
     * ces champs sont lus (Math.max(1,num(context.adventurePower,1)))
     * suffisent pour un joueur sans encore aucun équipement d'Aventure.
     */
    bestGold: Math.max(
      1,
      nombreSorealIdle_(
        metaRecords.highestGoldDrop,
        nombreSorealIdle_(row[c.PIECES - 1],1)
      )
    ),
    gold: Math.max(0,nombreSorealIdle_(metaCurrencies.gold,0)),
    materials: Math.max(0,nombreSorealIdle_(row[c.MATERIAUX - 1],0)),
    legacyEnergyIdle: Math.max(0,nombreSorealIdle_(row[c.ENERGIE - 1],0)),
    legacyEnergyCap: Math.max(0,nombreSorealIdle_(row[c.ENERGIE_MAX - 1],0)),
    legacyEnergyProductionPerSecond: Math.max(0,nombreSorealIdle_(row[c.PROD_SECONDE - 1],0)),
    attackTrainingLevels: attackTrainingLevels,
    basicTrainingEnergyAllocation: totalBasicTrainingAllocationV411(
      stats && stats.entrainementBase
    ),
    basicTrainingComplete: Boolean(
      skills.length &&
      skills.every(function(skill){return Boolean(skill&&skill.unlocked);})
    ),
    /*
     * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
     * meta.difficulty existe désormais côté idle-ngu-progression.js
     * (Phase 1, correctif de persistance) mais n'était encore lu nulle
     * part ici -- le moteur de combat réel (nguBossStatsV1, ci-dessous)
     * ignorait donc totalement la difficulté active. Exposé ici pour que
     * les points d'appel du diviseur ×1e-30 (wiki NGU : "Fight boss
     * attack/defense divided by 1 nonillion (1e30)", identique en Evil et
     * SADISTIC) puissent le lire.
     */
    difficulty: ['normal','difficile','extreme'].indexOf(meta.difficulty) !== -1 ? meta.difficulty : 'normal',
    /*
     * difficultyPeaks (2026-09-18, Norman : "il faut tout faire") : pic de
     * boss réellement atteint par difficulté (idle-ngu-progression.js,
     * normalizeIdleNguState) -- utilisé par unlockedZone
     * (idle-adventure-v47.js) pour "Normal zones remain unlocked at all
     * times" (wiki "Evil difficulty") même quand la difficulté ACTUELLE
     * n'est plus Normal.
     */
    difficultyPeaks: meta.difficultyPeaks && typeof meta.difficultyPeaks === 'object' ? meta.difficultyPeaks : {},
    beastV4Beaten: Boolean(metaAdventureUnlockFlags.beastBrutalDefeated),
    exileV4Beaten: Boolean(metaAdventureUnlockFlags.exileBrutalDefeated)
  };
}
