/*
 * Achievements (2026-09-24) -- page "Achievements" du miroir local NGU-Wiki
 * (Règle n°1 d'AGENTS.md : chaque nombre ci-dessous est recopié de la page).
 *
 *  - "Achievements are milestone actions you can perform for Bonus Points
 *    (BP). These BPs enhance your AP gain of +1%/100BP."
 *  - page "Arbitrary Points" : le bonus des succès majore l'AP "from all
 *    sources, except for ITOPOD kills and Special Prize" ; page "Yggdrasil",
 *    formule du Fruit of Arbitrariness : "... x (1 + BP/10000) x (1 +
 *    YellowHeartAPBonus) x Perk_Fibo89" -> facteur multiplicatif 1 + BP/10000.
 *  - les succès sont permanents (aucune page ne mentionne de perte au Rebirth).
 *
 * Tables "Normal Achievements" : 6 groupes de 16 paliers (Energy/Magic Power,
 * Energy/Magic Cap, Energy/Magic Bar), "Boss Defeated" (boss 10 à 300, 30
 * paliers) et "Rebirthing" (9 paliers). "Secret Achievements" : 18 entrées.
 * 153 succès au total, comme l'annonce la page.
 *
 * ÉCART DU WIKI (non corrigé, signalé) : la page annonce "a maximum of 5825
 * BPs" mais la somme de ses propres lignes vaut 5815 BP. Les valeurs retenues
 * sont celles de chaque ligne (seules données vérifiables individuellement).
 *
 * Succès NON suivis (tracked:false), condition non mesurable dans SOREAL ou
 * ambiguë -- jamais débloqués, jamais comptés :
 *  - "Survive an attack from an exploder enemy" : le type exploder n'a pas de
 *    mécanique de dégâts (retirée, voir AGENTS.md) ;
 *  - "Wear a set of Helmet, Chest, Legs, Boots, and Weapon, all at level 69" :
 *    ambigu (même set exigé ou non) ;
 *  - "Defeat <titan> before they can attack even once" (x5) : les titans SOREAL
 *    sont un test de puissance instantané, sans échange de coups ;
 *  - "Clicked the bottom right corner of the Advanced Training menu" : action
 *    d'interface, aucune opération serveur.
 */

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/* Même barème de BP pour les 6 groupes "ressource" (16 paliers chacun). */
const BP_RESSOURCE = Object.freeze([5, 10, 15, 20, 25, 30, 35, 35, 40, 40, 40, 45, 45, 45, 50, 50]);

const GROUPES_RESSOURCE = Object.freeze([
  /* "Obtain 10 or more Energy Power!" ... "Obtain 300,000,000 or more Energy Power!" */
  { group: "energyPower", label: "Energy Power", metric: "energyPower",
    thresholds: [10, 30, 100, 300, 1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8, 3e8] },
  /* "Obtain 3 or more Magic Power !" ... "Obtain 100,000,000 or more Magic Power!" */
  { group: "magicPower", label: "Magic Power", metric: "magicPower",
    thresholds: [3, 10, 30, 100, 300, 1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8] },
  /* "Obtain A Total Energy Cap of 10,000 or more!" ... "1,000,000,000,000" */
  { group: "energyCap", label: "Energy Cap", metric: "energyCap",
    thresholds: [1e4, 1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8, 3e8, 1e9, 3e9, 1e10, 3e10, 1e11, 3e11, 1e12] },
  /* "Obtain A Total Magic Cap of 30,000 or more!" ... "1,000,000,000,000" */
  { group: "magicCap", label: "Magic Cap", metric: "magicCap",
    thresholds: [3e4, 1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8, 3e8, 1e9, 3e9, 1e10, 3e10, 1e11, 3e11, 1e12] },
  /* "Obtain Total Energy Bar of 3 or more!" ... "100,000,000" */
  { group: "energyBars", label: "Energy Bar", metric: "energyBars",
    thresholds: [3, 10, 30, 100, 300, 1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8] },
  /* "Obtain Total Magic Bar of 3 or more!" ... "100,000,000" */
  { group: "magicBars", label: "Magic Bar", metric: "magicBars",
    thresholds: [3, 10, 30, 100, 300, 1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8] }
]);

/* "Defeat Boss 10!" (5) ... "Defeat Boss 300!" (60). */
const BP_BOSS = Object.freeze([5, 10, 15, 20, 25, 25, 30, 30, 35, 35, 35, 40, 40, 40, 45, 45, 45, 45, 45, 50, 50, 50, 50, 55, 55, 55, 60, 60, 60, 60]);
/* "Rebirth once!" (5) ... "Rebirth 10000 times!" (60). */
const REBIRTHS = Object.freeze([[1, 5], [3, 10], [10, 15], [30, 20], [100, 25], [300, 30], [1000, 40], [3000, 50], [10000, 60]]);

/* Secret Achievements : [id, nom du wiki, BP, clé de mesure booléenne ou null si non suivi]. */
const SECRETS = Object.freeze([
  ["secretExploder", "Survive an attack from an exploder enemy !", 30, null],
  ["secretLevel69", "Wear a set of Helmet, Chest, Legs, Boots, and Weapon, all at level 69.", 30, null],
  ["secretNguMenu", "Unlock the NGU menu !", 100, "nguUnlocked"],
  ["secretYggdrasilMenu", "Unlock the Yggdrasil menu !", 100, "yggdrasilUnlocked"],
  ["secretBeardsMenu", "Unlock the Beards menu !", 100, "beardsUnlocked"],
  ["secretNoHitGrb", "Defeat Gordon Ramsay Bolton before they can attack even once!", 100, null],
  ["secretNoHitGct", "Defeat Grand Corrupted Tree before they can attack even once!", 100, null],
  ["secretNoHitJake", "Defeat Jake From Accounting before they can attack even once!", 100, null],
  ["secretNoHitUug", "Defeat UUG, The Unmentionable before they can attack even once!", 100, null],
  ["secretAtCorner", "Clicked the bottom right corner of the Advanced Training menu.", 60, null],
  ["secretWalderpFinal", "Defeat WALDERP 's final form!", 100, "walderpFinal"],
  ["secretNoHitWalderp", "Defeat WALDERP's final form before they can attack even once!", 100, null],
  ["secretSpeedrun", "Speedrun 3 times in a row with rebirths under 30 minutes each, with boss 37 defeated!", 20, "speedrun"],
  ["secretBeastV1", "Defeat THE BEAST V1!", 25, "beastV1"],
  ["secretBeastV2", "Defeat THE BEAST V2!", 25, "beastV2"],
  ["secretBeastV3", "Defeat THE BEAST V3!", 25, "beastV3"],
  ["secretBeastV4", "Defeat THE BEAST V4!", 25, "beastV4"],
  ["secretEvil", "Enter Evil difficulty for the first time.", 25, "evilEntered"]
]);

function construireCatalogue() {
  const out = [];
  for (const g of GROUPES_RESSOURCE) {
    g.thresholds.forEach((seuil, i) => out.push(Object.freeze({
      id: `${g.group}_${seuil}`, group: g.group, name: `${g.label} ${seuil}`,
      bp: BP_RESSOURCE[i], metric: g.metric, threshold: seuil, tracked: true, secret: false
    })));
  }
  BP_BOSS.forEach((bp, i) => {
    const boss = (i + 1) * 10;
    out.push(Object.freeze({ id: `boss_${boss}`, group: "boss", name: `Defeat Boss ${boss}`, bp, metric: "highestBoss", threshold: boss, tracked: true, secret: false }));
  });
  for (const [n, bp] of REBIRTHS) {
    out.push(Object.freeze({ id: `rebirth_${n}`, group: "rebirth", name: `Rebirth ${n} times`, bp, metric: "totalRebirths", threshold: n, tracked: true, secret: false }));
  }
  for (const [id, name, bp, flag] of SECRETS) {
    out.push(Object.freeze({ id, group: "secret", name, bp, metric: flag || "", threshold: 1, tracked: Boolean(flag), secret: true }));
  }
  return Object.freeze(out);
}

export const IDLE_ACHIEVEMENTS_V1 = construireCatalogue();
const PAR_ID = new Map(IDLE_ACHIEVEMENTS_V1.map((a) => [a.id, a]));

export function idleAchievementV1(id) {
  return PAR_ID.get(String(id || "")) || null;
}

/* Données persistées : { unlocked: { <id>: horodatage } } ; ids inconnus ou non suivis écartés. */
export function normalizeIdleAchievementsDataV1(raw) {
  const src = raw && typeof raw === "object" && raw.unlocked && typeof raw.unlocked === "object" ? raw.unlocked : {};
  const unlocked = {};
  for (const [id, at] of Object.entries(src)) {
    const a = PAR_ID.get(id);
    if (a && a.tracked) unlocked[id] = Math.max(0, N(at, 0));
  }
  return { unlocked };
}

function donnees(state) {
  const sys = state?.systems?.achievements;
  if (!sys) return null;
  if (!sys.data || typeof sys.data !== "object" || !sys.data.unlocked) sys.data = normalizeIdleAchievementsDataV1(sys.data);
  return sys.data;
}

/*
 * Débloque les succès dont la condition est remplie. `metrics` : valeurs
 * numériques (energyPower, ..., highestBoss, totalRebirths) et booléens
 * (nguUnlocked, ...). Retourne la liste des ids nouvellement débloqués.
 */
export function idleAchievementsEvaluateV1(state, metrics, now = 0) {
  const d = donnees(state);
  if (!d) return [];
  const m = metrics && typeof metrics === "object" ? metrics : {};
  const nouveaux = [];
  for (const a of IDLE_ACHIEVEMENTS_V1) {
    if (!a.tracked || d.unlocked[a.id] !== undefined) continue;
    const v = m[a.metric];
    const ok = typeof v === "boolean" ? v : N(v, 0) >= a.threshold;
    if (ok) {
      d.unlocked[a.id] = Math.max(0, N(now, 0));
      nouveaux.push(a.id);
    }
  }
  return nouveaux;
}

export function idleAchievementsBpV1(state) {
  const d = state?.systems?.achievements?.data;
  const u = d && d.unlocked && typeof d.unlocked === "object" ? d.unlocked : {};
  let bp = 0;
  for (const id of Object.keys(u)) {
    const a = PAR_ID.get(id);
    if (a && a.tracked) bp += a.bp;
  }
  return bp;
}

/* "+1%/100BP" -> 1 + BP/10000 (formule du Fruit of Arbitrariness, page Yggdrasil). */
export function idleAchievementsApMultiplierV1(state) {
  return 1 + idleAchievementsBpV1(state) / 10000;
}
