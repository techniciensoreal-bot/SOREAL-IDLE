/*
 * Panneaux « Stats Breakdown » (Norman, 2026-11-22 : « il manque plein de chiffres ») : le détail facteur par facteur que le vrai jeu affiche
 * (StatsDisplay::displayEnergy / displayMagic / displayRes3 / displayAugments / displayNGU / displayBeards / displayWandoos / displayEXPGain /
 * displayMiscAdventure / MiscStatsDisplay, build 1260).
 *
 * RÈGLES
 *  - Aucun second calcul : chaque facteur est lu à la MÊME source que le moteur (mêmes fonctions, mêmes variables). Le total affiché est toujours la valeur
 *    RÉELLE du moteur ; si le produit des facteurs nommés n'y arrive pas (facteur que ce module ne sait pas nommer), une ligne « Autres bonus » comble l'écart,
 *    et un plafond (Énergie / Magie / Ressource 3 : 1E18, 9E18) apparaît comme une ligne « Plafond ».
 *  - ANTI-SPOIL (règle n°2) : seuls les facteurs ACTIFS (différents de ×1) sont envoyés, avec leur nom ; un panneau d'un système non découvert n'est pas envoyé
 *    du tout (ni son titre). Aucun nom de set : « Bonus de set ». Aucun total caché (jamais « x / y »).
 *  - Pièce d'état comme les autres : aucun champ horodaté, valeurs seulement. Une erreur ici ne casse jamais la réponse d'état (voir idleStatsBreakdownV1).
 *
 * Forme : { diviseur, panneaux: { <id>: { t, sections: [ { t, base: {l, v, f}, lignes: [ {l, v, op?} ], total: {l, v, f}, note? } ] } } }
 *   f (format) : "n" nombre du jeu, "p" pourcentage (v = ratio : 2,5 → 250 %), "ps" pourcentage + secondes (respawn), "n1" nombre à une décimale.
 */
import { idleNguBonusesLectureV1, nguFxV1, hackFxV1, gearSpecialsV1, gearPctV1, beardBonusMultiplier, atLevelV1, apBonusMultiplierV1 } from "./idle-ngu-bonus.js";
import { idleNguEffectiveResourceStatV1 } from "./idle-ngu-ressources.js";
import { challengePermanentBonuses, ressourceDecouverteV1, num, int, nowMs } from "./idle-ngu-catalogues.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { wishBonusesV1 } from "./idle-wishes-v1.js";
import { idleQuirkNiveauxV1, idlePerkNiveauxV1, idleWishTracksActifsV1 } from "./idle-difficulty-gates-v1.js";
import { macguffinEffectMultipliersV1 } from "./idle-macguffins-v1.js";
import { idleCardsMultipliersV1, idleCardsMultiplierV1 } from "./idle-cards-v1.js";
import { idleSelloutPotionFactorV1, idleSelloutPotionMinuteeV1 } from "./idle-sellout-shop-v1.js";
import { wishLevelV1 } from "./idle-ngu-snapshot.js";
import { diggerBonuses } from "./idle-ngu-systemes.js";
import { idleHeartsExpMultiplierV1, idleHeartsApMultiplierV1 } from "./idle-hearts-v1.js";
import { idleAchievementsApMultiplierV1 } from "./idle-achievements-v1.js";
import { wandoosCalculVitessesV1 } from "./idle-ngu-etat.js";
import { beardActiveIdsV1 } from "./idle-ngu-pistes.js";
import { IDLE_NGU_TRACKS } from "./idle-ngu-catalogues.js";
import { SETS, SETS_OBJETS_V1 } from "./idle-adventure-sets.js";

const EPS = 1e-9;
const actif = (v) => Number.isFinite(v) && Math.abs(v - 1) > EPS;
const lignesActives = (paires) => paires.filter((p) => actif(p[1])).map((p) => ({ l: p[0], v: p[1] }));
const produit = (lignes) => lignes.reduce((a, x) => a * (x.op === "/" ? 1 / x.v : x.v), 1);
const proche = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/* Arrondi au pair le plus proche (Convert.ToInt64) : même règle que idleNguEffectiveResourceStatV1 pour le Cap. */
function arrondiPair(v) {
  const f = Math.floor(v), d = v - f;
  return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1);
}

/*
 * Assemble une section. `attendu` = valeur que donnerait le produit des lignes (arrondie comme le moteur) ; si le total RÉEL du moteur diffère, une ligne comble l'écart :
 * « Limite du jeu » quand le total est plus petit (limite du jeu), « Autres bonus » quand il est plus grand.
 */
function section(t, base, lignes, total, opts = {}) {
  const sortie = lignes.slice();
  if (opts.reconcilier !== false && base && Number.isFinite(base.v) && Number.isFinite(total.v) && base.v > 0 && total.v > 0) {
    let attendu = base.v * produit(sortie);
    if (opts.arrondi === "trunc" && attendu < 9e15) attendu = Math.max(1, Math.trunc(attendu));
    if (opts.arrondi === "pair" && attendu < 9e15) attendu = Math.max(1, arrondiPair(attendu));
    if (opts.arrondi === "floor" && attendu < 9e15) attendu = Math.floor(attendu + 1e-9);
    if (attendu > 0 && !proche(attendu, total.v)) {
      const ratio = total.v / attendu;
      sortie.push({ l: ratio < 1 ? "Limite du jeu" : "Autres bonus", v: ratio });
    }
  }
  const s = { t, lignes: sortie, total };
  if (base) s.base = base;
  if (opts.note) s.note = opts.note;
  return s;
}

/* Sets complétés portant une récompense multiplicative `cle` : valeurs séparées (facteurs distincts, comme le moteur). Sans nom de set (règle n°2). */
function facteursDeSets(adventure, cle) {
  const done = adventure && adventure.completedSets && typeof adventure.completedSets === "object" ? adventure.completedSets : {};
  const out = [];
  for (const table of [SETS, SETS_OBJETS_V1]) {
    for (const [id, def] of Object.entries(table)) {
      const v = Number(def && def.reward && def.reward[cle]) || 0;
      if (done[id] && v > 0) out.push(1 + v);
    }
  }
  return out;
}
const lignesDeSets = (adventure, cle, etiquette = "Bonus de set") => facteursDeSets(adventure, cle).map((v) => ({ l: etiquette, v })).filter((x) => actif(x.v));

function contexteDe(state) {
  const adv = state.adventure || {};
  const bonuses = idleNguBonusesLectureV1(state);
  return {
    state, adv, bonuses,
    gear: gearSpecialsV1(state),
    perks: perkBonusesV1(idlePerkNiveauxV1(state)),
    quirks: quirkBonusesV1(idleQuirkNiveauxV1(state)),
    wishes: wishBonusesV1(idleWishTracksActifsV1(state)),
    mac: macguffinEffectMultipliersV1(state),
    cartes: idleCardsMultipliersV1(state),
    fx: nguFxV1(state),
    hack: hackFxV1(state),
    diggers: diggerBonuses(state)
  };
}

/* ---------- Énergie / Magie / Ressource 3 ---------- */

const STATS = [["power", "Power", "Puissance", "n1"], ["bars", "Bars", "Barres", "n"], ["cap", "Cap", "Plafond", "n"]];
const NOM_RES = { energy: "d’Énergie", magic: "de Magie", r3: "de la Ressource 3" };
const TITRE_RES = { energy: "Statistiques d’Énergie", magic: "Statistiques de Magie", r3: "Statistiques de la Ressource 3" };

function sectionRessource(c, res, [stat, Maj, nom, fmt]) {
  const { state, gear, perks, quirks, wishes, mac, bonuses } = c;
  const brut = Math.max(0, num(state.resources?.[res]?.[stat], 0));
  const plat = Math.max(0, num(bonuses[`${res}${Maj}Flat`], 0));
  const base = brut + plat;
  const cle = `${res}${Maj}`;
  const gearPct = gearPctV1(gear, `${cle}Pct`);
  const lignes = [["Équipement", gearPct], ["MacGuffin", mac[cle]]];
  if (res === "r3") {
    if (stat !== "cap") lignes.push(["Atout (Perk)", perks[`${cle}Multiplier`]]);
    lignes.push(["Quirk", quirks[`${cle}Multiplier`]], ["Souhait", wishes[`${cle}Multiplier`]]);
    if (stat === "cap") lignes.splice(2, 0, ["Atout (Perk)", perks[`${cle}Multiplier`]]);
  } else {
    lignes.push(["Atout (Perk)", perks[`${cle}Multiplier`]], ["Quirk", quirks[`${cle}Multiplier`]], ["Souhait", wishes[`${cle}Multiplier`]]);
  }
  if (stat === "power") {
    const cleP = `${res}Power`;
    const total = Math.max(1, num(idleSelloutPotionFactorV1(state, cleP), 1));
    const alpha = Math.max(1, num(idleSelloutPotionMinuteeV1(state, cleP), 1));
    lignes.push(["Potion α", alpha], ["Potion β", total / alpha]);
  } else if (stat === "bars" && res !== "r3") {
    lignes.push(["Bar Bar", num(idleSelloutPotionFactorV1(state, `${res}Bars`), 1)]);
  }
  const arrondi = stat === "bars" ? "trunc" : stat === "cap" ? "pair" : null;
  const valeur = idleNguEffectiveResourceStatV1(state, res, stat);
  const s = section(
    `${nom} ${NOM_RES[res]}`,
    { l: "Base", v: base, f: fmt },
    lignesActives(lignes),
    { l: `Total (${nom})`, v: valeur, f: fmt },
    { arrondi }
  );
  if (plat > 0) s.baseDont = plat;
  return s;
}

function panneauRessource(c, res) {
  return { t: TITRE_RES[res], sections: STATS.map((st) => sectionRessource(c, res, st)) };
}

/* ---------- Vitesses ---------- */

function sectionAugments(c) {
  const { state, gear, hack, mac, perks } = c;
  const ch = state.challenge || {};
  const noAugs = Math.max(0, int(ch.completions?.noAugmentations, 0));
  const noAugsEvil = Math.max(0, int(ch.completionsTier?.difficile?.noAugmentations, 0));
  const puissance = Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power"));
  const lignes = lignesActives([
    ["Puissance d’Énergie", puissance],
    ["Équipement", gearPctV1(gear, "augmentSpeedPct")],
    ["MacGuffin", mac.augmentSpeed],
    ["Défi No Augs", noAugs > 0 ? 1.1 : 1],
    ["Défis No Augs (Evil)", 1 + noAugsEvil * 0.05],
    ["Dernière complétion No Augs (Evil)", noAugsEvil >= 5 ? 1.25 : 1],
    ["Hack", hack.augmentSpeed],
    ["Atout (Perk)", perks.augmentSpeedMultiplier],
    ["Cartes", idleCardsMultiplierV1(state, "augments")]
  ]);
  const total = produit(lignes);
  return { t: "Vitesse des Augmentations", sections: [{ t: "Vitesse des Augmentations", base: { l: "Base", v: 1, f: "p" }, lignes, total: { l: "Total", v: total, f: "p" } }] };
}

function sectionNgu(c, res) {
  const { state, gear, hack, mac, perks, quirks, fx, diggers, adv } = c;
  const ch = challengePermanentBonuses(state);
  const magie = res === "magic";
  const puissance = Math.max(1, idleNguEffectiveResourceStatV1(state, res, "power"));
  const souhaits = magie
    ? (1 + 0.02 * wishLevelV1(state, 113)) * (1 + 0.02 * wishLevelV1(state, 114))
    : (1 + 0.02 * wishLevelV1(state, 111)) * (1 + 0.02 * wishLevelV1(state, 112));
  const propre = magie ? fx.magicNguSpeed : fx.energyNguSpeed;   /* le moteur multiplie le NGU de SA ressource (Magic NGU accélère les NGU de Magie) */
  const toutes = [
    ...lignesActives([
      [`Puissance ${NOM_RES[res]}`, puissance],
      ["Équipement", gearPctV1(gear, "nguSpeedPct")],
      ["MacGuffin", mac[magie ? "magicNgu" : "energyNgu"]]
    ]),
    ...lignesDeSets(adv, "nguSpeedPct", "Bonus de set"),
    ...lignesActives([
      [magie ? "NGU Magic" : "NGU Energy", propre],
      ["Barbe", beardBonusMultiplier(state, "ngu")],
      ["Mineur (Digger)", magie ? diggers.magicNgu : diggers.energyNgu],
      ["Atout (Perk)", magie ? perks.nguSpeedMagicMultiplier : perks.nguSpeedEnergyMultiplier],
      ["Défi", ch.nguSpeedMultiplier],
      ["Défi Troll", magie ? ch.nguSpeedMagicChallengeMultiplier : ch.nguSpeedEnergyChallengeMultiplier],
      ["Hack", magie ? hack.magicNguSpeed : hack.energyNguSpeed],
      ["Quirk", magie ? quirks.nguSpeedMagicMultiplier : quirks.nguSpeedEnergyMultiplier],
      ["Souhait", souhaits],
      ["Cartes", idleCardsMultiplierV1(state, magie ? "magicNgu" : "energyNgu")]
    ])
  ];
  return { t: `Vitesse des NGU ${NOM_RES[res]}`, base: { l: "Base", v: 1, f: "p" }, lignes: toutes, total: { l: "Total", v: produit(toutes), f: "p" } };
}

function sectionBarbes(c, res) {
  const { state, gear, mac, quirks, diggers, adv } = c;
  const magie = res === "magic";
  const barres = Math.max(1, idleNguEffectiveResourceStatV1(state, res, "bars"));
  const puissance = Math.max(1, idleNguEffectiveResourceStatV1(state, res, "power"));
  const lignes = lignesActives([
    [`Barres ${NOM_RES[res]}`, barres],
    ["Puissance (racine carrée)", Math.sqrt(puissance)],
    ["Équipement", gearPctV1(gear, "beardSpeedPct")],
    ["MacGuffin", mac[magie ? "magicBeard" : "energyBeard"]],
    ["Mineur (Digger)", Math.max(1, num(magie ? diggers.magicBeard : diggers.energyBeard, 1))],
    ["Quirk", quirks.beardSpeedMultiplier],
    ["Bonus de set", 1 + Math.max(0, num(adv.setRewards?.beardSpeedPct, 0))]
  ]);
  const pistes = IDLE_NGU_TRACKS.beards || [];
  let compte = 0;
  for (const id of beardActiveIdsV1(state)) if (((pistes.find((x) => x.id === id) || {}).resource || "energy") === res) compte += 1;
  const diviseur = Math.max(1, compte * (adv.completedSets?.beardverse ? 0.9 : 1));
  const total = produit(lignes) / diviseur;
  if (actif(diviseur)) lignes.push({ l: "Nombre de barbes actives", v: diviseur, op: "/" });
  return { t: `Vitesse des Barbes ${NOM_RES[res]}`, base: { l: "Base", v: 1, f: "p" }, lignes, total: { l: "Total (avant le diviseur propre à chaque barbe)", v: total, f: "p" } };
}

function sectionWandoos(c, res) {
  const { state, gear, mac, quirks, diggers, fx } = c;
  const magie = res === "magic";
  const calc = wandoosCalculVitessesV1(state, 0, nowMs());
  if (!calc) return null;
  const ch = challengePermanentBonuses(state);
  const lignes = lignesActives([
    ["Équipement", gearPctV1(gear, "wandoosSpeedPct")],
    ["MacGuffin", mac[magie ? "magicWandoos" : "energyWandoos"]],
    ["Niveau du système", calc.osLevelMultiplier],
    ["Démarrage", calc.boot.fraction],
    ["Entraînement avancé", 1 + atLevelV1(state, magie ? "wandoosMagic" : "wandoosEnergy") * 0.01],
    ["NGU", fx.wandoosSpeed],
    ["Mineur (Digger)", diggers.wandoos],
    ["Quirk", 1 + Math.max(0, num(magie ? quirks.wandoosMagicSpeedPct : quirks.wandoosEnergySpeedPct, 0))],
    ["Défi 100 Levels", ch.wandoosSpeedChallengeMultiplier],
    ["Bonus de set (après le démarrage)", 1 + Math.max(0, num(c.adv.setRewards?.wandoosBootedSpeedPct, 0)) * calc.boot.afterBootShare],
    ["Barbe", beardBonusMultiplier(state, "wandoos")],
    ["Cartes", idleCardsMultiplierV1(state, "wandoos")]
  ]);
  return { t: `Vitesse de Wandoos ${NOM_RES[res]}`, base: { l: "Base", v: 1, f: "p" }, lignes, total: { l: "Total", v: produit(lignes), f: "p" } };
}

/* ---------- EXP / AP / PP ---------- */

function panneauGains(c) {
  const { state, adv, gear, perks, fx, hack, diggers, cartes, bonuses } = c;
  const sections = [];
  /* EXP */
  const setRouge = Math.max(0, num(adv.setRewards?.heartExpPct, 0));
  const expLignes = lignesActives([
    [setRouge > 0 ? "Cœur rouge complété" : "Équipement", idleHeartsExpMultiplierV1(state, gear)],
    ["NGU", fx.exp],
    ["Mineur (Digger)", diggers.experience],
    ["Atout (Perk)", perks.expEarningsMultiplier],
    ["Hack", hack.exp],
    ["Souhait", 1 + 0.005 * wishLevelV1(state, 61)],
    ["Cuisine", 1 + num(state.bonuses?.cookingExp, 0)]
  ]);
  sections.push(section("Gain d’EXP", { l: "Base", v: 1, f: "p" }, expLignes, { l: "Total", v: Math.max(0, num(bonuses.xpMultiplier, 1)), f: "p" }));
  /* AP */
  const setJaune = Math.max(0, num(adv.setRewards?.heartApPct, 0));
  const apLignes = lignesActives([
    [setJaune > 0 ? "Cœur jaune complété" : "Équipement", idleHeartsApMultiplierV1(state, gear)],
    ["Succès", idleAchievementsApMultiplierV1(state)],
    ["Atout (Perk)", perks.apEarningsMultiplier]
  ]);
  sections.push(section("Gain d’AP", { l: "Base", v: 1, f: "p" }, apLignes, { l: "Total", v: apBonusMultiplierV1(state), f: "p" }, { reconcilier: false }));
  /* PP */
  const ppLignes = [
    ...lignesDeSets(adv, "itopodPpPct", "Bonus de set"),
    ...lignesActives([
      ["NGU", fx.pp],
      ["Mineur (Digger)", diggers.pp],
      ["Atout (Perk)", perks.ppEarningsMultiplier],
      ["Hack", hack.pp],
      ["Cartes", cartes.pp]
    ])
  ];
  const ppTotal = Math.max(0, num(bonuses.ppMultiplier, 1));
  const sPP = section("Gain de PP", { l: "Base", v: 1, f: "p" }, ppLignes, { l: "Total", v: ppTotal, f: "p" });
  sections.push(sPP);
  /* Progression de PP par kill de l'ITOPOD (ItopodPerkController::progressGained : (base + étage) x bonus) : seulement si la Tour est découverte. */
  const tour = state.systems?.tower;
  if (tour?.unlocked) {
    const etage = Math.max(0, int(tour.data?.floor, 0));
    const quirks = c.quirks;
    const baseDif = state.difficulty === "extreme" ? 2000 + num(quirks.itopodPppFlat, 0) + 50 * wishLevelV1(state, 79) : state.difficulty === "difficile" ? 700 : 200;
    sections.push({
      t: "Progression de PP par kill (ITOPOD)",
      base: { l: `Base (étage ${etage})`, v: baseDif + etage, f: "n" },
      lignes: [{ l: "Bonus de PP (ci-dessus)", v: Math.max(1, ppTotal) }],
      total: { l: "Total", v: (baseDif + etage) * Math.max(1, ppTotal), f: "n1" }
    });
  }
  return { t: "Gains d’EXP, d’AP et de PP", sections };
}

/* ---------- Statistiques diverses de l'Aventure ---------- */

function panneauAventure(c) {
  const { state, adv, gear, perks, quirks, wishes, mac, cartes, fx, hack, diggers, bonuses } = c;
  const ch = challengePermanentBonuses(state);
  const sections = [];
  /* Or */
  const orLignes = lignesActives([
    ["Équipement", gearPctV1(gear, "goldDropsPct")],
    ["MacGuffin", mac.goldDrops],
    ["NGU", fx.gold],
    ["Atout (Perk)", perks.adventureGoldMultiplier],
    ["Quirk", quirks.adventureGoldMultiplier],
    ["Cartes", cartes.gold],
    ["Défi No Time Machine (Evil)", ch.goldDropChallengeMultiplier]
  ]);
  sections.push(section("Or des ennemis", { l: "Base", v: 1, f: "p" }, orLignes, { l: "Total", v: Math.max(0, num(bonuses.adventureGoldMultiplier, 1)), f: "p" }));
  /* Réapparition (réduction : les restes se multiplient ; total en % ET en secondes, 4 s de base) */
  const setHorloge = Math.max(0, Math.min(1, num(adv.setRewards?.respawn, 0)));
  const objets = Math.min(80, Math.max(0, num(gear.respawnReductionPct, 0) - setHorloge * 100));
  const niveauSouhait = Math.max(0, Math.min(10, int(idleWishTracksActifsV1(state)["46"]?.level, 0)));
  const reste = Math.max(0, Math.min(1, 1 - num(bonuses.respawnReduction, 0)));
  const respLignes = lignesActives([
    ["Équipement", 1 - objets / 100],
    ["NGU", 1 - fx.respawnReduction],
    ["Bonus de set", 1 - setHorloge],
    ["Atout (Perk)", perks.respawnRemaining],
    ["Souhait", 1 - niveauSouhait * 0.01]
  ]);
  const sResp = section("Vitesse d’apparition des ennemis", { l: "Base (4 secondes)", v: 1, f: "p" }, respLignes, { l: "Total", v: reste, f: "ps", secondes: 4 * reste }, { reconcilier: false });
  const attendu = respLignes.reduce((a, x) => a * x.v, 1);
  if (Math.abs(attendu - reste) > 1e-6) sResp.lignes.push({ l: reste < attendu ? "Limite du jeu" : "Autres bonus", v: reste / Math.max(1e-12, attendu) });
  sections.push(sResp);
  /* Drop */
  const sDrop = lignesDeSets(adv, "drop", "Bonus de set");
  const dropLignes = [
    ...lignesActives([
      ["Équipement", gearPctV1(gear, "dropChancePct")],
      ["MacGuffin", mac.dropChance]
    ]),
    ...sDrop,
    ...lignesActives([
      ["Magie du Sang", Math.max(1, num(state.systems?.bloodMagic?.data?.spells?.bloodSpaghetti, 1))],
      ["Fruit de Yggdrasil", 1 + num(state.systems?.yggdrasil?.data?.permanent?.luckDropPct, 0) / 100],
      ["NGU", fx.dropChance],
      ["Mineur (Digger)", diggers.drop],
      ["Barbe", beardBonusMultiplier(state, "drop")],
      ["Porte-bonheur", num(idleSelloutPotionFactorV1(state, "luck"), 1)],
      ["Atout (Perk)", perks.dropChanceMultiplier],
      ["Hack", hack.dropChance],
      ["Cartes", cartes.drop]
    ])
  ];
  sections.push(section("Chance de butin", { l: "Base", v: 1, f: "p" }, dropLignes, { l: "Total", v: Math.max(0, num(bonuses.dropMultiplier, 1)), f: "p" }));
  return { t: "Statistiques diverses de l’Aventure", sections };
}

/* ---------- Page « Divers » (MiscStatsDisplay::updateMiscStats) ---------- */

function panneauDivers(state) {
  const r = state.records || {};
  const lignes = [];
  const rebirths = Math.max(0, num(r.totalRebirths, 0));
  if (rebirths > 0) lignes.push({ l: "Renaissances totales", v: rebirths, f: "n" });
  const exp = Math.max(0, num(r.totalExpEarned, 0));
  if (exp > 0) lignes.push({ l: "EXP totale gagnée", v: exp, f: "n" });
  const titans = state.adventure && state.adventure.titans && typeof state.adventure.titans === "object" ? state.adventure.titans : {};
  const vaincus = Object.values(titans).reduce((a, t) => a + Math.max(0, int(t && t.kills, 0)), 0);
  if (vaincus > 0) lignes.push({ l: "Titans vaincus", v: vaincus, f: "n" });
  return lignes.length ? { t: "Statistiques diverses", divers: lignes } : null;
}

/* ---------- Assemblage ---------- */

export function idleStatsBreakdownV1(state) {
  try {
    const c = contexteDe(state);
    const panneaux = {};
    panneaux.energie = panneauRessource(c, "energy");
    if (ressourceDecouverteV1(state, "magic")) panneaux.magie = panneauRessource(c, "magic");
    if (ressourceDecouverteV1(state, "r3")) panneaux.ressource3 = panneauRessource(c, "r3");
    const magie = ressourceDecouverteV1(state, "magic");
    if (state.systems?.augmentations?.unlocked) panneaux.augments = sectionAugments(c);
    if (state.systems?.ngu?.unlocked) {
      const sections = [sectionNgu(c, "energy")];
      if (magie) sections.push(sectionNgu(c, "magic"));
      panneaux.ngu = { t: "Vitesse des NGU", sections: sections.map((s) => ({ t: s.t, base: s.base, lignes: s.lignes, total: s.total })) };
    }
    if (state.systems?.beards?.unlocked) {
      const sections = [sectionBarbes(c, "energy")];
      if (magie) sections.push(sectionBarbes(c, "magic"));
      panneaux.barbes = { t: "Vitesse des Barbes", sections };
    }
    if (state.systems?.wandoos?.unlocked) {
      const sections = [sectionWandoos(c, "energy")];
      if (magie) sections.push(sectionWandoos(c, "magic"));
      if (sections.every(Boolean)) panneaux.wandoos = { t: "Vitesse de Wandoos", sections };
    }
    panneaux.gains = panneauGains(c);
    if (num(state.records?.highestBoss, 0) >= 4) panneaux.aventure = panneauAventure(c);
    const divers = panneauDivers(state);
    if (divers) panneaux.divers = divers;
    return {
      /* Evil / Sadistic : le joueur est divisé par 1e30 (Character::difficultyModifier) : ligne « Difficulty DIVIDER » du détail Attack / Defense. */
      diviseur: Math.max(1, num(c.bonuses.difficultyDivider, 1)),
      panneaux
    };
  } catch (_e) {
    return null;
  }
}
