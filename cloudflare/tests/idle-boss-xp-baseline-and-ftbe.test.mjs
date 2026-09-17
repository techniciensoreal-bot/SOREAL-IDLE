import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";
import {
  normalizeIdleNguState,
  rebirthIdleNguState
} from "../src/idle-ngu-progression.js";
import { nguBossStatsV1, nguBossFtbeBonusXpV1 } from "../src/idle-ngu-boss-reference-v1.js";

const {
  equilibrerBossPrincipalSorealIdleV413_,
  highestBossJamaisAtteintSorealIdle_,
  xpBonusPremiereFoisSorealIdle_,
  enregistrerBossJamaisVaincuSorealIdle_
} = idleRuntimeTestHooks;

/*
 * Norman (2026-09-17, vérification wiki en direct sur les 20 fiches
 * individuelles ngu-idle.fandom.com/wiki/<NomBoss> du catalogue SOREAL,
 * croisée avec son propre test en jeu réel pour les boss 1-2) :
 *
 *   Boss #  | XP normal (repeat-kill) | Bonus FTBE (première fois)
 *   1       | 0                       | 2
 *   2       | 0                       | 3
 *   3       | 0                       | 4
 *   4       | 1                       | 10
 *   5       | 0                       | 3
 *   6       | 0                       | 3
 *   7-20    | 1                       | 3
 *
 * IDLE_BOSS stockait à la place des valeurs inventées jamais sourcées
 * (100/120/180/240/320/420/550/.../19000). Ce fichier verrouille (a) que
 * ces valeurs inventées sont désormais totalement ignorées au profit de
 * la référence sourcée, (b)/(c) que le bonus FTBE n'est accordé qu'une
 * seule fois par boss, jamais aux kills suivants, et (d) que le
 * high-water-mark qui porte ce bonus survit à une Renaissance.
 */

const XP_BASELINE_BOSS_1_A_20 = [0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
const XP_FTBE_BOSS_1_A_20 = [2,3,4,10,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3];
const OLD_INVENTED_XP_BOSS_1_A_20 = [
  100,120,180,240,320,420,550,720,950,1250,
  1650,2200,2900,3800,5000,6500,8500,11000,14500,19000
];

// --- (a) NGU_BOSS_REFERENCE_V1 : le XP baseline sourcé wiki doit
// correspondre exactement à la colonne vérifiée par Norman.
{
  for (let i = 0; i < 20; i += 1) {
    assert.equal(
      nguBossStatsV1(i).xp,
      XP_BASELINE_BOSS_1_A_20[i],
      `nguBossStatsV1(${i}).xp doit valoir ${XP_BASELINE_BOSS_1_A_20[i]} (boss #${i + 1}, wiki vérifié).`
    );
  }
}

// --- (a) equilibrerBossPrincipalSorealIdleV413_ doit ignorer TOTALEMENT
// l'ancienne valeur inventée du catalogue (elle est toujours strictement
// supérieure au vrai plancher, donc un simple MAX ne pouvait jamais
// corriger le bug) et renvoyer la vraie valeur sourcée à la place.
{
  for (let i = 0; i < 20; i += 1) {
    const resultat = equilibrerBossPrincipalSorealIdleV413_(
      { xp: OLD_INVENTED_XP_BOSS_1_A_20[i] },
      i
    );
    assert.equal(
      resultat.xp,
      XP_BASELINE_BOSS_1_A_20[i],
      `Boss #${i + 1} : l'ancienne valeur inventée (${OLD_INVENTED_XP_BOSS_1_A_20[i]}) doit être ignorée, XP corrigé = ${XP_BASELINE_BOSS_1_A_20[i]}.`
    );
  }
}

// --- Table FTBE : ne couvre que les 20 boss du catalogue SOREAL, 0 au-delà
// (aucune fiche wiki individuelle vérifiée pour ce bonus au-delà du boss 20).
{
  for (let i = 0; i < 20; i += 1) {
    assert.equal(
      nguBossFtbeBonusXpV1(i),
      XP_FTBE_BOSS_1_A_20[i],
      `Bonus FTBE boss #${i + 1} doit valoir ${XP_FTBE_BOSS_1_A_20[i]}.`
    );
    assert.equal(
      xpBonusPremiereFoisSorealIdle_(i),
      XP_FTBE_BOSS_1_A_20[i]
    );
  }
  assert.equal(nguBossFtbeBonusXpV1(20), 0, "Aucun bonus FTBE inventé au-delà du boss 20 (catalogue SOREAL).");
  assert.equal(nguBossFtbeBonusXpV1(159), 0);
}

// --- (b)/(c) Le high-water-mark FTBE (metaNgu.records.highestBoss) :
// première victoire d'un boss => bonus accordé + record avancé ; toute
// victoire suivante du MÊME boss (ce run ou après Renaissance) => 0 bonus.
{
  const metaNgu = { records: {} };

  assert.equal(highestBossJamaisAtteintSorealIdle_(metaNgu), 0);

  // Boss #1 (index 0) vaincu pour la première fois de l'histoire du compte.
  let estPremiereFois = 0 >= highestBossJamaisAtteintSorealIdle_(metaNgu);
  assert.equal(estPremiereFois, true, "Le tout premier kill du boss #1 doit être détecté comme première fois jamais.");
  const bonus1 = estPremiereFois ? xpBonusPremiereFoisSorealIdle_(0) : 0;
  assert.equal(bonus1, 2, "Boss #1 : bonus FTBE = 2 (en plus du XP normal = 0).");
  if (estPremiereFois) enregistrerBossJamaisVaincuSorealIdle_(metaNgu, 0);
  assert.equal(highestBossJamaisAtteintSorealIdle_(metaNgu), 1);

  // Re-vaincre le boss #1 (farm/refight, même run ou run suivant après
  // Renaissance) ne doit JAMAIS reverser le bonus une deuxième fois.
  estPremiereFois = 0 >= highestBossJamaisAtteintSorealIdle_(metaNgu);
  assert.equal(estPremiereFois, false, "Un second kill du boss #1 ne doit plus être une première fois.");
  const bonusRepete = estPremiereFois ? xpBonusPremiereFoisSorealIdle_(0) : 0;
  assert.equal(bonusRepete, 0, "Aucun bonus FTBE sur un kill répété du même boss.");
  assert.equal(highestBossJamaisAtteintSorealIdle_(metaNgu), 1, "Le record ne doit pas bouger sur un kill déjà comptabilisé.");

  // Boss #2 (index 1), première fois : nouveau bonus distinct (3), le
  // record avance à son tour.
  estPremiereFois = 1 >= highestBossJamaisAtteintSorealIdle_(metaNgu);
  assert.equal(estPremiereFois, true);
  const bonus2 = estPremiereFois ? xpBonusPremiereFoisSorealIdle_(1) : 0;
  assert.equal(bonus2, 3, "Boss #2 : bonus FTBE = 3.");
  if (estPremiereFois) enregistrerBossJamaisVaincuSorealIdle_(metaNgu, 1);
  assert.equal(highestBossJamaisAtteintSorealIdle_(metaNgu), 2);
}

// --- (d) Le tracker FTBE doit survivre à une Renaissance (contrairement à
// BOSS_VAINCUS, remis à 0 à chaque Renaissance). On construit un état NGU
// réel, on y simule 5 boss déjà vaincus (highestBoss=5 via la vraie
// fonction d'enregistrement), puis on appelle la VRAIE fonction de
// Renaissance du moteur et on vérifie que le record survit intact pendant
// que totalRebirths avance.
{
  const debut = 1_000_000;
  const context = { bosses: 5, rebirths: 0, sets: 0, zone: 1, adventurePower: 0, bestGold: 0, materials: 0 };

  let state = normalizeIdleNguState({}, context, debut);
  assert.equal(highestBossJamaisAtteintSorealIdle_(state), 5, "normalizeIdleNguState doit déjà porter bosses=5 dans records.highestBoss.");

  // On avance encore : le joueur vainc un 6e boss (index 5) pour la
  // première fois avant de se Renaître.
  enregistrerBossJamaisVaincuSorealIdle_(state, 5);
  assert.equal(highestBossJamaisAtteintSorealIdle_(state), 6);

  const apresRenaissance = 200_000 + debut; // > MIN_REBIRTH_SECONDS (180s) plus tard
  const reborn = rebirthIdleNguState(state, { ...context, bosses: 6 }, apresRenaissance);

  assert.equal(
    highestBossJamaisAtteintSorealIdle_(reborn),
    6,
    "Le high-water-mark FTBE (records.highestBoss) doit survivre intact à la Renaissance."
  );
  assert.equal(
    reborn.records.totalRebirths,
    1,
    "totalRebirths doit bien avancer (preuve que la Renaissance a réellement été appliquée, pas un no-op)."
  );
}

// --- Câblage réel : les deux points d'octroi d'XP de boss (combat normal
// ET NUKE) doivent effectivement appeler ces fonctions dans le bon ordre,
// pas seulement les définir sans jamais les utiliser.
{
  const source = readFileSync(
    new URL("../src/idle-sqlite-runtime.js", import.meta.url),
    "utf8"
  );

  // Combat normal (appliquerProgressionEnergieSorealIdle_).
  const progStart = source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
  const progEnd = source.indexOf("function construireEtatJoueurSorealIdle_(", progStart);
  const prog = source.slice(progStart, progEnd);

  const initIdx = prog.indexOf("let highestBossJamaisAtteint =");
  const whileIdx = prog.indexOf("while (");
  const xpReelleIdx = prog.indexOf("const xpReelle =");
  const estPremiereFoisIdx = prog.indexOf("const estPremiereFoisJamais =");
  const enregistrerIdx = prog.indexOf("enregistrerBossJamaisVaincuSorealIdle_(\n          statsCombat.metaNgu,");
  const bossVaincusIncrIdx = prog.indexOf("bossVaincus += 1;");

  assert.ok(
    initIdx >= 0 && initIdx < whileIdx,
    "highestBossJamaisAtteint doit être initialisé AVANT la boucle de simulation (un seul appel peut vaincre plusieurs boss)."
  );
  assert.ok(
    estPremiereFoisIdx > xpReelleIdx,
    "La détection FTBE doit avoir lieu après le calcul du XP normal du kill."
  );
  assert.ok(
    enregistrerIdx > estPremiereFoisIdx && enregistrerIdx < bossVaincusIncrIdx,
    "Le high-water-mark FTBE doit être avancé après la détection, avant que bossVaincus (compteur du run) ne soit lui-même incrémenté."
  );

  // NUKE (nukerBossSorealIdle).
  const nukeStart = source.indexOf("function nukerBossSorealIdle(");
  const nukeEnd = source.indexOf("\nfunction definirAutoBossSuivantSorealIdle", nukeStart);
  const nuke = source.slice(nukeStart, nukeEnd);

  assert.ok(
    nuke.indexOf("let highestBossJamaisAtteintNuke =") < nuke.indexOf("while (iterations < 500)"),
    "NUKE doit aussi initialiser son propre high-water-mark local AVANT la boucle (plusieurs boss peuvent tomber dans le même appel)."
  );
  assert.ok(
    nuke.includes("const estPremiereFoisJamaisNuke =") &&
    nuke.includes("enregistrerBossJamaisVaincuSorealIdle_(\n          stats.metaNgu,"),
    "NUKE doit accorder le même bonus FTBE (et faire avancer le même record) qu'un combat normal."
  );

  // Le plancher xp:Math.max(1,...) qui empêchait à jamais un XP réel de 0
  // (boss 1/2/3/5/6) ne doit plus exister nulle part dans le pipeline XP.
  assert.ok(
    !source.includes("xp:\n          Math.max(\n            1,"),
    "Le plancher XP=1 hérité (bossCatalogueSorealIdle_) ne doit plus exister : un boss au XP réel de 0 doit pouvoir rester à 0."
  );

  const xpBossStart = source.indexOf("function xpBossSorealIdle_(");
  const xpBossEnd = source.indexOf("\n\n\n", xpBossStart);
  const xpBossBody = source.slice(xpBossStart, xpBossEnd);
  assert.ok(
    xpBossBody.includes("Math.max(\n    0,"),
    "xpBossSorealIdle_ ne doit plus forcer un minimum de 1 XP."
  );

  // L'écran boss du client (bossCatalogue) doit afficher le XP corrigé
  // (definitionBossSorealIdle_), jamais la ligne brute du catalogue.
  assert.ok(
    source.includes("xp: definitionBossSorealIdle_(index).xp,"),
    "Le bossCatalogue exposé au client doit afficher le XP corrigé, comme pv/attaque, jamais boss.xp brut."
  );
}

console.log("idle-boss-xp-baseline-and-ftbe: OK");
