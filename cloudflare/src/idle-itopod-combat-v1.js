/*
 * ITOPOD : les ennemis de la tour attaquent le joueur (Norman, 2026-11-16 : « tu t'alignes au jeu original »).
 *
 * VALEURS ET RÈGLES LUES DANS LE JEU (NGU Idle build 1260, 2026-11-16, analyse de l'assembly avec l'accord de Norman : seuls des FAITS chiffrés sont gardés, jamais de code recopié) :
 *  - AdventureController::createEnemyTable (zone 1000) : 16 « Dude » de base identiques (Attack Rate 1,2 s ; attaque 10 ; défense 10 ; régénération 1 ; PV 600 ; type d'ennemi 11), qui ne diffèrent QUE par leur IA :
 *    IA 0 normal x4, IA 1 poison x3, IA 2 chargeur x3, IA 3 paralysie x2, IA 5 rapide x2, IA 6 grandisseur x2 (aucun explosif, IA 4). Le jeu tire l'un des 16 au hasard à chaque apparition (spawnEnemy, zone 1000 : Random.Range(0, 16)).
 *  - AdventureController::powerUp : attaque, défense, PV et régénération sont multipliés par 1,05^étage (étage plafonné à 1600, maxItopodLevel), puis chacune de ces quatre valeurs par un aléa de 0,98 à 1,02.
 *  - EnemyAI::Update : premier coup à 1,5 x Attack Rate (1,8 s), puis un coup tous les Attack Rate (1,2 s) ; en mode rapide un coup tous les 0,3 x Attack Rate.
 *  - EnemyAI::attack : coup = max(10 % de l'attaque ; attaque - Robustesse du joueur / 2) x aléa(0,8 ; 1,2) x multiplicateur ; PlayerController::takeDamage en retire la PARTIE ENTIÈRE aux PV du joueur.
 *  - Cycles d'IA (EnemyAI::poisonAttack / chargeAttack / paralyzeAI / rapidAI / growerAI) : voir itopodEnemyActionV1 ; le poison retire en plus floor(attaque x 0,2 x aléa) DIRECTEMENT aux PV, la paralysie arrête les coups du joueur 2 s.
 *  - PlayerController::idleAttack : coup du joueur = max(0 ; Puissance - défense de l'ennemi / 2) x aléa(0,8 ; 1,2) x Idle Attack Power ; un coup toutes les Attack Speed (1 s, 0,8 s avec le Red Liquid).
 *  - AdventureController::manageFight : les PV du joueur se régénèrent en continu de (Regen x dt), x1,2 en auto-attaque ; plafonnés aux PV max ; les PV de l'ennemi se régénèrent aussi (sa régénération x dt, plafonnée à ses PV max).
 *  - AdventureController::playerDeath (zone 1000) : PV du joueur à 0, étage = étage de DÉPART choisi (itopodStart), combat arrêté, nouvelle apparition après le délai de réapparition. Le compteur de 10 kills de l'étage n'est PAS remis à zéro.
 * Les aléas (±2 % des stats, 0,8 à 1,2 des coups) sont remplacés par leur MOYENNE (1) : la simulation est déterministe ; seul le TIRAGE du type de l'ennemi reste aléatoire (comme dans le jeu).
 * Non modélisé : mode Bête (x3 sur les coups reçus), bouclier / parade (jamais utilisés en idle), saignement, ordre exact des événements dans une même image (un coup du joueur et un coup de l'ennemi à la même seconde : le joueur frappe d'abord).
 */

export const ITOPOD_MAX_FLOOR_V1 = 1600;
/* createEnemyTable, zone 1000 : IA des 16 Dude, dans l'ordre de la table. */
export const ITOPOD_DUDE_AI_V1 = Object.freeze([0, 2, 1, 5, 6, 3, 2, 0, 0, 1, 5, 6, 1, 0, 2, 3]);
export const ITOPOD_ENEMY_BASE_V1 = Object.freeze({ attackRate: 1.2, attack: 10, defense: 10, regen: 1, hp: 600 });
export const ITOPOD_FIRST_STRIKE_FACTOR_V1 = 1.5;
export const ITOPOD_RAPID_FACTOR_V1 = 0.3;
export const ITOPOD_PARALYSIS_SECONDS_V1 = 2;
export const ITOPOD_POISON_FRACTION_V1 = 0.2;
export const ITOPOD_CHARGE_MULT_V1 = 4;
export const ITOPOD_GROW_STEP_V1 = 0.2;
/* Régénération x1,2 en auto-attaque (manageFight). */
export const ITOPOD_AUTOATTACK_REGEN_V1 = 1.2;

/* Facteur 1,05^étage de powerUp (étage borné à 0..1600). */
export function itopodScaleV1(floor) {
  const f = Math.max(0, Math.min(ITOPOD_MAX_FLOOR_V1, Math.floor(Number(floor) || 0)));
  return Math.pow(1.05, f);
}

/* Statistiques MOYENNES de l'ennemi de l'étage (powerUp sans les aléas). */
export function itopodEnemyStatsV1(floor) {
  const s = itopodScaleV1(floor);
  return { attack: ITOPOD_ENEMY_BASE_V1.attack * s, defense: ITOPOD_ENEMY_BASE_V1.defense * s, regen: ITOPOD_ENEMY_BASE_V1.regen * s, hp: ITOPOD_ENEMY_BASE_V1.hp * s, attackRate: ITOPOD_ENEMY_BASE_V1.attackRate };
}

/* Tire l'IA d'un ennemi (uniforme parmi les 16 Dude) ; `hasard` dans [0,1[ (fourni par l'appelant via idle-alea-v1.js ; milieu si absent). */
export function itopodDrawAiV1(hasard) {
  const h = Number.isFinite(Number(hasard)) ? Number(hasard) : 0.5;
  return ITOPOD_DUDE_AI_V1[Math.min(ITOPOD_DUDE_AI_V1.length - 1, Math.max(0, Math.floor(h * ITOPOD_DUDE_AI_V1.length)))];
}

export function itopodEnemyMemoireV1() {
  return { poison: 0, charge: 0, paralyze: 0, rapid: 0, rapidMode: false, grow: 0 };
}

/*
 * Un « tour » de l'ennemi (EnemyAI::doAction). Renvoie { mult, tick, paralyze } : mult = multiplicateur du coup (0 = l'ennemi n'attaque pas ce tour), tick = le poison retire floor(attaque x 0,2) aux PV,
 * paralyze = le joueur ne frappe plus pendant 2 s. `st` (itopodEnemyMemoireV1) avance comme les compteurs du jeu (poisonEffect, chargeCooldown, paralyzeEffect, rapidEffect, growCount).
 */
export function itopodEnemyActionV1(ai, st) {
  const r = { mult: 1, tick: false, paralyze: false };
  switch (ai) {
    case 1: /* poison : cycle de 7 tours (le tour de poison avance le compteur de 2) ; tours 2, 3 et 4 : coup + poison */
      if (st.poison > 0 && st.poison <= 5) { r.tick = true; st.poison += 1; }
      else if (st.poison > 5) st.poison = -3;
      st.poison += 1;
      break;
    case 2: /* chargeur : cycle de 5 tours : 2 coups, 2 tours sans coup, coup x4 */
      st.charge += 1;
      if (st.charge < 3) r.mult = 1;
      else if (st.charge < 5) r.mult = 0;
      else { r.mult = ITOPOD_CHARGE_MULT_V1; st.charge = 0; }
      break;
    case 3: /* paralysie : cycle de 12 tours : rien, coup, coup + paralysie 2 s, 9 coups */
      if (st.paralyze < 0) r.mult = 1;
      else if (st.paralyze === 1) r.mult = 1;
      else if (st.paralyze === 2) { r.mult = 1; r.paralyze = true; st.paralyze = -10; }
      else r.mult = 0;
      st.paralyze += 1;
      break;
    case 5: /* rapide : cycle de 14 tours ; coups à 0,3 x Attack Rate du tour 9 au tour 14 */
      st.rapid += 1;
      if (st.rapid < 5) r.mult = 1;
      else if (st.rapid < 8) r.mult = 0;
      else if (st.rapid === 8) { st.rapidMode = true; r.mult = 1; }
      else if (st.rapid < 14) r.mult = 1;
      else { st.rapidMode = false; st.rapid = 0; r.mult = 1; }
      break;
    case 6: /* grandisseur : coup x (1 + floor(n / 2) / 5), n = coups depuis le début du combat */
      st.grow += 1;
      r.mult = 1 + Math.floor(st.grow / 2) * ITOPOD_GROW_STEP_V1;
      break;
    default: /* IA 0 : coup ordinaire */
      break;
  }
  return r;
}

/*
 * Un combat contre UN ennemi, de son apparition à sa mort ou à celle du joueur, à partir des PV du joueur `hp` à l'apparition.
 * p : { floor, ai, power, toughness, idleMult, interval (secondes entre deux coups du joueur), hp, hpMax, regen (par seconde, déjà x1,2), tMax (durée maximale simulée) }.
 * Renvoie { outcome: "kill" | "death" | "timeout", t (durée du combat), hp (PV à la fin), hits }.
 */
export function itopodFightV1(p) {
  const e = itopodEnemyStatsV1(p.floor);
  const tMax = Math.max(0, Number(p.tMax) || 0);
  const interval = Math.max(0.05, Number(p.interval) || 1);
  const hpMax = Math.max(0, Number(p.hpMax) || 0);
  const regen = Math.max(0, Number(p.regen) || 0);
  const degatsJoueur = Math.max(0, Number(p.power) - e.defense / 2) * Math.max(0.1, Number(p.idleMult) || 1);
  const coupBase = Math.max(0.1 * e.attack, e.attack - Math.max(0, Number(p.toughness) || 0) / 2);
  const tick = Math.floor(e.attack * ITOPOD_POISON_FRACTION_V1);
  const st = itopodEnemyMemoireV1();
  let hp = Math.min(hpMax, Number(p.hp) || 0);
  let eHp = e.hp;
  let t = 0;
  let tJoueur = interval;
  let tEnnemi = ITOPOD_FIRST_STRIKE_FACTOR_V1 * e.attackRate;
  let hits = 0;
  for (let garde = 0; garde < 200000; garde++) {
    const prochain = Math.min(tJoueur, tEnnemi);
    if (!(prochain <= tMax)) {
      const dt = tMax - t;
      hp = Math.min(hpMax, hp + regen * dt);
      return { outcome: "timeout", t: tMax, hp, hits };
    }
    const dt = prochain - t;
    hp = Math.min(hpMax, hp + regen * dt);
    eHp = Math.min(e.hp, eHp + e.regen * dt);
    t = prochain;
    if (tJoueur <= tEnnemi) {
      eHp -= degatsJoueur;
      hits += 1;
      tJoueur += interval;
      if (eHp <= 0) return { outcome: "kill", t, hp, hits };
    } else {
      const a = itopodEnemyActionV1(p.ai, st);
      if (a.mult > 0) hp -= Math.floor(coupBase * a.mult);
      if (a.tick) hp -= tick;
      if (a.paralyze) tJoueur += ITOPOD_PARALYSIS_SECONDS_V1;
      tEnnemi += st.rapidMode ? ITOPOD_RAPID_FACTOR_V1 * e.attackRate : e.attackRate;
      if (hp <= 0) return { outcome: "death", t, hp: 0, hits };
    }
  }
  return { outcome: "timeout", t, hp, hits };
}

/*
 * Un cycle complet : délai de réapparition (les PV se régénèrent), puis le combat.
 * Renvoie { complete, outcome, t, hp } ; si le temps disponible `tMax` ne suffit pas, complete = false (le cycle est rejoué depuis son début à la synchro suivante : même IA, mêmes PV de départ, donc même issue).
 */
export function itopodCycleV1(p) {
  const respawn = Math.max(0, Number(p.respawn) || 0);
  const hpMax = Math.max(0, Number(p.hpMax) || 0);
  const regen = Math.max(0, Number(p.regen) || 0);
  const tMax = Math.max(0, Number(p.tMax) || 0);
  if (!(tMax >= respawn)) return { complete: false, outcome: "timeout", t: tMax, hp: Math.max(0, Number(p.hp) || 0) };
  const hpApparition = Math.min(hpMax, Math.max(0, Number(p.hp) || 0) + regen * respawn);
  /* playerDeath puis manageFight : un joueur à 0 PV à l'apparition meurt aussitôt. */
  if (!(hpApparition > 0)) return { complete: true, outcome: "death", t: respawn, hp: 0 };
  const f = itopodFightV1(Object.assign({}, p, { hp: hpApparition, tMax: tMax - respawn }));
  if (f.outcome === "timeout") return { complete: false, outcome: "timeout", t: tMax, hp: Math.max(0, Number(p.hp) || 0), hits: f.hits };
  return { complete: true, outcome: f.outcome, t: respawn + f.t, hp: f.hp, hits: f.hits };
}
