/*
 * NGU : les 16 vrais NGU (9 Energy + 7 Magic) et leurs variantes Evil et
 * Sadistic -- audit NGU du 2026-09-23.
 *
 * Avant : SOREAL n'avait que 9 pistes inventées (NGU Power, Defense,
 * Adventure, Drop, Respawn, Experience, PP, Quest, Daycare) avancées une
 * seule à la fois avec un diviseur arbitraire. Le jeu réel (wiki, page "NGU",
 * tableaux "Normal / Evil / Sadistic energy|magic NGUs") a 16 NGU qui
 * progressent EN PARALLÈLE, chacun avec sa propre allocation, son coût de
 * base, son bonus par niveau, son plafond « soft cap » et sa formule
 * après plafond.
 *
 * Toutes les valeurs ci-dessous sont extraites des 6 tableaux du wiki par un
 * script (miroir local NGU-Wiki, page "NGU") : "Amount" (L * x%), "Soft Cap",
 * "Base cost" (secondes pour passer du niveau 0 au niveau 1 avec 1 de
 * puissance et 1 de cap), "Amount after soft cap". Règles du wiki :
 *  - niveau max 1 milliard ;
 *  - coût du niveau N -> N+1 = (N+1) x coût de base ;
 *  - Evil et Sadistic sont des multiplicateurs SUPPLÉMENTAIRES (le wiki
 *    donne p. ex. Power α+β combinés Evil = 1e16 %, total 5e30 %) ;
 *  - l'énergie/magie ne peut être allouée qu'à UN palier à la fois.
 */

export const IDLE_NGU_TIERS_V1 = Object.freeze(["normal", "evil", "sadistic"]);
export const IDLE_NGU_MAX_LEVEL_V1 = 1e9;

export const IDLE_NGU_CATALOG_V1 = Object.freeze([
  { id: "augments", resource: "energy", name: "Augments", effect: "Augments boost" },
  { id: "wandoos", resource: "energy", name: "Wandoos", effect: "Wandoos speed" },
  { id: "respawn", resource: "energy", name: "Respawn", effect: "Adventure mode enemy spawn time" },
  { id: "gold", resource: "energy", name: "Gold", effect: "Gold drop" },
  { id: "adventureAlpha", resource: "energy", name: "Adventure α", effect: "Power, toughness, max HP, HP regen" },
  { id: "powerAlpha", resource: "energy", name: "Power α", effect: "Attack & defense" },
  { id: "dropChance", resource: "energy", name: "Drop Chance", effect: "Drop chance" },
  { id: "magicNgu", resource: "energy", name: "Magic NGU", effect: "Magic NGU speed" },
  { id: "pp", resource: "energy", name: "PP", effect: "PP progress" },
  { id: "yggdrasil", resource: "magic", name: "Yggdrasil", effect: "Fruit yield" },
  { id: "exp", resource: "magic", name: "EXP", effect: "EXP gain" },
  { id: "powerBeta", resource: "magic", name: "Power β", effect: "Attack & defense" },
  { id: "number", resource: "magic", name: "Number", effect: "Multiplies Number" },
  { id: "timeMachine", resource: "magic", name: "Time Machine", effect: "Time Machine gold" },
  { id: "energyNgu", resource: "magic", name: "Energy NGU", effect: "Energy NGU speed" },
  { id: "adventureBeta", resource: "magic", name: "Adventure β", effect: "Power, toughness, max health, health regen" }
]);

const PARAMS = {
  normal: {
    augments: {pct:1, softCap:null, baseCost:2e11},
    wandoos: {pct:0.1, softCap:null, baseCost:2e11},
    respawn: {pct:0.05, softCap:400, baseCost:2e11, respawnBase:0.2, respawnDivisor:5},
    gold: {pct:1, softCap:null, baseCost:2e11},
    adventureAlpha: {pct:0.1, softCap:1000, baseCost:2e11, exponent:0.5, coefficient:3.17},
    powerAlpha: {pct:5, softCap:null, baseCost:2e11},
    dropChance: {pct:0.1, softCap:1000, baseCost:2e13, exponent:0.5, coefficient:3.17},
    magicNgu: {pct:0.1, softCap:1000, baseCost:4e14, exponent:0.3, coefficient:12.59},
    pp: {pct:0.05, softCap:1000, baseCost:1e16, exponent:0.3, coefficient:6.295},
    yggdrasil: {pct:0.1, softCap:400, baseCost:4e11, exponent:0.33, coefficient:5.54},
    exp: {pct:0.01, softCap:2000, baseCost:1.2e12, exponent:0.4, coefficient:0.9566},
    powerBeta: {pct:1, softCap:null, baseCost:4e12},
    number: {pct:1, softCap:1000, baseCost:1.2e13, exponent:0.5, coefficient:31.7},
    timeMachine: {pct:0.2, softCap:1000, baseCost:1e14, exponent:0.8, coefficient:0.7962},
    energyNgu: {pct:0.1, softCap:1000, baseCost:1e15, exponent:0.3, coefficient:12.59},
    adventureBeta: {pct:0.03, softCap:1000, baseCost:1e16, exponent:0.4, coefficient:1.894}
  },
  evil: {
    augments: {pct:0.5, softCap:null, baseCost:2e20},
    wandoos: {pct:0.1, softCap:1000, baseCost:2e20, exponent:0.25, coefficient:17.79},
    respawn: {pct:0.0005, softCap:10000, baseCost:2e20, respawnBase:0.05, respawnDivisor:20},
    gold: {pct:0.5, softCap:null, baseCost:2e21},
    adventureAlpha: {pct:0.05, softCap:1000, baseCost:2e22, exponent:0.25, coefficient:8.8945},
    powerAlpha: {pct:2, softCap:null, baseCost:2e23},
    dropChance: {pct:0.05, softCap:1000, baseCost:2e24, exponent:0.3, coefficient:6.295},
    magicNgu: {pct:0.05, softCap:1000, baseCost:2e25, exponent:0.3, coefficient:6.295},
    pp: {pct:0.02, softCap:1000, baseCost:2e26, exponent:0.2, coefficient:5.024},
    yggdrasil: {pct:0.05, softCap:400, baseCost:2e20, exponent:0.1, coefficient:10.9854},
    exp: {pct:0.005, softCap:2000, baseCost:2e21, exponent:0.2, coefficient:2.1867},
    powerBeta: {pct:0.5, softCap:null, baseCost:2e22},
    number: {pct:0.5, softCap:1000, baseCost:2e23, exponent:0.3, coefficient:62.95},
    timeMachine: {pct:0.1, softCap:1000, baseCost:2e24, exponent:0.8, coefficient:0.3981},
    energyNgu: {pct:0.05, softCap:1000, baseCost:2e25, exponent:0.2, coefficient:12.56},
    adventureBeta: {pct:0.015, softCap:1000, baseCost:2e26, exponent:0.25, coefficient:2.6675}
  },
  sadistic: {
    augments: {pct:0.4, softCap:null, baseCost:1e40},
    wandoos: {pct:0.06, softCap:1000, baseCost:1e40, exponent:0.15, coefficient:21.2886},
    respawn: {pct:0.0005, softCap:10000, baseCost:1e40, respawnBase:0.05, respawnDivisor:20},
    gold: {pct:0.5, softCap:1000, baseCost:1e40, exponent:0.5, coefficient:15.815},
    adventureAlpha: {pct:0.04, softCap:1000, baseCost:1e41, exponent:0.2, coefficient:10.0476},
    powerAlpha: {pct:1.6, softCap:null, baseCost:1e42},
    dropChance: {pct:0.04, softCap:1000, baseCost:1e43, exponent:0.2, coefficient:10.048},
    magicNgu: {pct:0.04, softCap:1000, baseCost:1e44, exponent:0.1, coefficient:20.0476},
    pp: {pct:0.016, softCap:1000, baseCost:1e45, exponent:0.1, coefficient:8.01936},
    yggdrasil: {pct:0.04, softCap:400, baseCost:1e40, exponent:0.08, coefficient:9.9076},
    exp: {pct:0.005, softCap:2000, baseCost:1e40, exponent:0.15, coefficient:3.1978},
    powerBeta: {pct:0.5, softCap:null, baseCost:1e41},
    number: {pct:0.5, softCap:1000, baseCost:1e42, exponent:0.2, coefficient:125.6},
    timeMachine: {pct:0.1, softCap:1000, baseCost:1e43, exponent:0.8, coefficient:0.3981},
    energyNgu: {pct:0.05, softCap:1000, baseCost:1e44, exponent:0.15, coefficient:17.741},
    adventureBeta: {pct:0.015, softCap:1000, baseCost:1e45, exponent:0.12, coefficient:6.54795}
  }
};

export function nguParamsV1(tier, id) {
  return PARAMS[tier] && PARAMS[tier][id] ? PARAMS[tier][id] : null;
}

/*
 * Valeur du bonus en POURCENT au niveau L. Sous le soft cap : L x pct.
 * Au-dessus : L^exposant x coefficient (formule du wiki). Respawn :
 * (base + L / (L x diviseur + 200000)) x 100, à partir du soft cap.
 */
export function nguEffectPctV1(tier, id, level) {
  const p = nguParamsV1(tier, id);
  const L = Math.max(0, Math.min(IDLE_NGU_MAX_LEVEL_V1, Number(level) || 0));
  if (!p || L <= 0) return 0;
  if (p.softCap === null || L <= p.softCap) return L * p.pct;
  if (p.respawnBase !== undefined) {
    return (p.respawnBase + L / (L * p.respawnDivisor + 200000)) * 100;
  }
  return Math.pow(L, p.exponent) * p.coefficient;
}

/* Secondes pour passer du niveau `level` à `level + 1`, avec 1 de puissance et 1 alloué. */
export function nguSecondsForNextLevelV1(tier, id, level) {
  const p = nguParamsV1(tier, id);
  if (!p) return Infinity;
  return p.baseCost * (Math.max(0, Number(level) || 0) + 1);
}

/*
 * Convertit un travail cumulé (en « unités de niveau » : passer de N à N+1
 * coûte N+1 unités) en niveaux entiers gagnés, sans boucler niveau par
 * niveau (les NGU montent de millions de niveaux d'un coup hors ligne).
 * Retourne { gained, work } : niveaux gagnés et travail restant.
 */
export function nguLevelsFromWorkV1(level, work) {
  const L = Math.max(0, Math.floor(Number(level) || 0));
  const W = Math.max(0, Number(work) || 0);
  const room = Math.max(0, IDLE_NGU_MAX_LEVEL_V1 - L);
  if (room <= 0) return { gained: 0, work: 0 };
  const a = 2 * L + 1;
  let k = Math.floor((2 * W) / (a + Math.sqrt(a * a + 8 * W)));
  const total = (n) => (n * (2 * L + n + 1)) / 2;
  while (k > 0 && total(k) > W) k -= 1;
  while (k < room && total(k + 1) <= W) k += 1;
  k = Math.min(k, room);
  return { gained: k, work: k >= room ? 0 : Math.max(0, W - total(k)) };
}

/* Paliers dont l'EFFET est actif selon la difficulté (Evil dès Evil, Sadistic dès Sadistic). */
export function nguActiveTiersV1(difficulty) {
  if (difficulty === "extreme") return ["normal", "evil", "sadistic"];
  if (difficulty === "difficile") return ["normal", "evil"];
  return ["normal"];
}

/*
 * Multiplicateurs (ratio, 1 = neutre) produits par tous les NGU. `levels` :
 * { normal: { augments: niveau, ... }, evil: {...}, sadistic: {...} }.
 * Chaque bonus s'applique en (1 + pct/100) ; plusieurs NGU d'un même effet et
 * plusieurs paliers se MULTIPLIENT (wiki : "Combined Power α and β",
 * "another multiplicative bonus"). Respawn est une réduction : les restes
 * (1 - r) se multiplient (wiki : 40 % + 10 % -> 46 %).
 */
export function nguEffectsV1(levels, difficulty) {
  const out = {
    augments: 1,
    wandoosSpeed: 1,
    respawnRemaining: 1,
    respawnReduction: 0,
    gold: 1,
    adventure: 1,
    attackDefense: 1,
    dropChance: 1,
    magicNguSpeed: 1,
    energyNguSpeed: 1,
    pp: 1,
    yggdrasil: 1,
    exp: 1,
    number: 1,
    timeMachine: 1
  };
  const target = {
    augments: "augments",
    wandoos: "wandoosSpeed",
    gold: "gold",
    adventureAlpha: "adventure",
    adventureBeta: "adventure",
    powerAlpha: "attackDefense",
    powerBeta: "attackDefense",
    dropChance: "dropChance",
    magicNgu: "magicNguSpeed",
    energyNgu: "energyNguSpeed",
    pp: "pp",
    yggdrasil: "yggdrasil",
    exp: "exp",
    number: "number",
    timeMachine: "timeMachine"
  };
  const src = levels && typeof levels === "object" ? levels : {};
  for (const tier of nguActiveTiersV1(difficulty)) {
    const tierLevels = src[tier] && typeof src[tier] === "object" ? src[tier] : {};
    for (const def of IDLE_NGU_CATALOG_V1) {
      const L = Math.max(0, Number(tierLevels[def.id]) || 0);
      if (L <= 0) continue;
      const pct = nguEffectPctV1(tier, def.id, L);
      if (def.id === "respawn") {
        out.respawnRemaining *= Math.max(0, 1 - pct / 100);
      } else {
        out[target[def.id]] *= 1 + pct / 100;
      }
    }
  }
  out.respawnReduction = 1 - out.respawnRemaining;
  return out;
}
