import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { idleNguEffectiveResourceStatV1 } from "../src/idle-ngu-ressources.js";
import { idleStatsBreakdownV1 } from "../src/idle-stats-breakdown-v1.js";
import { apBonusMultiplierV1 } from "../src/idle-ngu-bonus.js";

/*
 * Panneaux « Stats Breakdown » (Norman, 2026-11-22 : « il manque plein de chiffres »). Pour CHAQUE panneau :
 *  - seuls les facteurs actifs (≠ ×1) sont nommés (règle n°2) ; un système verrouillé n'a pas de panneau ;
 *  - le total affiché est la valeur RÉELLE du moteur et le produit des lignes y mène (aucune ligne « Autres bonus » / « Limite du jeu » dans les cas ordinaires) ;
 *  - aucun total caché (jamais « x / y »), aucun nom de set.
 */
const frais = () => normalizeIdleNguState({}, {}, Date.now());
function toutDebloque(st) {
  for (const k of Object.keys(st.systems)) if (st.systems[k] && typeof st.systems[k] === "object") st.systems[k].unlocked = true;
  st.records.highestBoss = 120;
}
const proche = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const sections = (p) => (p.sections || [p]).filter((s) => s.total);
const noms = (s) => s.lignes.map((x) => x.l);
const valeur = (s, nom) => (s.lignes.find((x) => x.l === nom) || {}).v;
const sansEcart = (s) => !s.lignes.some((x) => x.l === "Autres bonus" || x.l === "Limite du jeu");
const produit = (s) => s.lignes.reduce((a, x) => a * (x.op === "/" ? 1 / x.v : x.v), 1);

// 0. Partie neuve : seulement Énergie et gains ; AUCUN facteur nommé ; aucun panneau d'un système verrouillé
{
  const r = idleStatsBreakdownV1(frais());
  assert.deepEqual(Object.keys(r.panneaux).sort(), ["energie", "gains"]);
  for (const p of Object.values(r.panneaux)) for (const s of sections(p)) assert.equal(s.lignes.length, 0, s.t + " : aucun facteur actif sur une partie neuve");
  const txt = JSON.stringify(r);
  for (const mot of ["Magie", "Wandoos", "NGU", "Barbe", "Augmentation", "Aventure", "Ressource 3", "set"]) assert.equal(txt.includes(mot), false, "un système verrouillé n'est jamais nommé : " + mot);
  assert.equal(/\d\s*\/\s*\d/.test(txt.replace(/"v":[^,}]*/g, "")), false, "aucun total caché (x / y)");
  assert.equal(r.diviseur, 1);
}

// 1. Énergie / Magie / Ressource 3 : Power, Bars, Cap ; potions α/β et Bar Bar nommés seulement s'ils sont actifs ; total = valeur du moteur
{
  const st = frais();
  toutDebloque(st);
  st.resources.energy.power = 1000; st.resources.energy.bars = 777; st.resources.energy.cap = 1e6;
  st.resources.magic.power = 50; st.resources.r3.power = 20;
  const avant = idleStatsBreakdownV1(st).panneaux.energie;
  assert.deepEqual(avant.sections.map((s) => s.t), ["Puissance d’Énergie", "Barres d’Énergie", "Plafond d’Énergie"]);
  assert.equal(noms(avant.sections[0]).includes("Potion α"), false, "potion inactive : jamais nommée");
  st.selloutEffects = st.selloutEffects || {};
  st.selloutEffects.remaining = Object.assign({}, st.selloutEffects.remaining, { energyPower: 3600, energyBars: 3600 });
  st.selloutEffects.beta = Object.assign({}, st.selloutEffects.beta, { energyPower: true });
  const p = idleStatsBreakdownV1(st).panneaux;
  const pw = p.energie.sections[0], bars = p.energie.sections[1], cap = p.energie.sections[2];
  assert.equal(valeur(pw, "Potion α"), 2);
  assert.equal(valeur(pw, "Potion β"), 2);
  assert.equal(valeur(bars, "Bar Bar"), 2);
  assert.equal(noms(cap).includes("Bar Bar"), false, "le Cap n'a ni potion ni Bar Bar");
  assert.equal(noms(cap).some((n) => n.startsWith("Potion")), false);
  assert.ok(proche(pw.total.v, idleNguEffectiveResourceStatV1(st, "energy", "power")), "total Power = moteur");
  assert.ok(proche(bars.total.v, idleNguEffectiveResourceStatV1(st, "energy", "bars")), "total Bars = moteur");
  assert.ok(proche(cap.total.v, idleNguEffectiveResourceStatV1(st, "energy", "cap")), "total Cap = moteur");
  for (const res of ["energie", "magie", "ressource3"]) for (const s of p[res].sections) { assert.ok(sansEcart(s), res + " / " + s.t + " : le produit des facteurs mène au total"); }
  assert.ok(proche(pw.base.v * produit(pw), pw.total.v));
  // MacGuffin : un facteur de plus, nommé seulement une fois actif
  st.systems.macguffins.data.permanent = Object.assign({}, st.systems.macguffins.data.permanent, { energyPower: 50, energyCap: 20 });
  const q = idleStatsBreakdownV1(st).panneaux.energie;
  assert.ok(Math.abs(valeur(q.sections[0], "MacGuffin") - 1.5) < 1e-9);
  assert.ok(Math.abs(valeur(q.sections[2], "MacGuffin") - 1.2) < 1e-9);
  assert.ok(proche(q.sections[0].total.v, idleNguEffectiveResourceStatV1(st, "energy", "power")));
  assert.ok(sansEcart(q.sections[0]) && sansEcart(q.sections[2]));
}

// 1b. Plafond dur de la Puissance (1E18 avant potions) : montré comme « Limite du jeu », jamais caché
{
  const st = frais();
  st.resources.energy.power = 9e18;
  const s = idleStatsBreakdownV1(st).panneaux.energie.sections[0];
  assert.ok(proche(s.total.v, idleNguEffectiveResourceStatV1(st, "energy", "power")));
  assert.ok(noms(s).includes("Limite du jeu"), "le plafond est visible");
}

// 2. Anti-spoil des ressources : la Magie et la Ressource 3 n'existent que découvertes
{
  const st = frais();
  const p0 = idleStatsBreakdownV1(st).panneaux;
  assert.equal(p0.magie, undefined);
  assert.equal(p0.ressource3, undefined);
  st.records.highestBoss = 40;
  const p1 = idleStatsBreakdownV1(st).panneaux;
  assert.ok(p1.magie && p1.ressource3 === undefined);
  st.systems.hacks.unlocked = true;
  assert.ok(idleStatsBreakdownV1(st).panneaux.ressource3);
}

// 3. Vitesses : Augmentations, NGU, Barbes, Wandoos
{
  const st = frais();
  toutDebloque(st);
  st.resources.energy.power = 400;
  st.challenge.completions.noAugmentations = 2;
  st.challenge.completionsTier = { difficile: { noAugmentations: 5 }, extreme: {} };
  const p = idleStatsBreakdownV1(st).panneaux;
  const aug = p.augments.sections[0];
  assert.equal(valeur(aug, "Défi No Augs"), 1.1);
  assert.ok(Math.abs(valeur(aug, "Défis No Augs (Evil)") - 1.25) < 1e-9);
  assert.equal(valeur(aug, "Dernière complétion No Augs (Evil)"), 1.25);
  assert.equal(valeur(aug, "Puissance d’Énergie"), 400);
  assert.equal(noms(aug).includes("Hack"), false, "un Hack inactif n'est pas nommé");
  assert.ok(Math.abs(aug.total.v - 400 * 1.1 * 1.25 * 1.25) < 1e-9);
  // NGU : le facteur affiché est celui que le moteur multiplie (nguSpeedMultiplierV1 x puissance)
  const ngu = p.ngu.sections[0];
  assert.ok(sansEcart(ngu));
  assert.equal(valeur(ngu, "Puissance d’Énergie"), 400);
  assert.equal(p.ngu.sections.length, 2, "Énergie et Magie séparées");
  // Barbes : racine de la puissance, barres, diviseur = nombre de barbes actives
  const barbes = p.barbes.sections[0];
  assert.ok(Math.abs(valeur(barbes, "Puissance (racine carrée)") - 20) < 1e-9);
  // Wandoos : énergie et magie séparées, boot compté
  assert.equal(p.wandoos.sections.length, 2);
  for (const s of p.wandoos.sections) assert.ok(proche(s.total.v, produit(s)));
}

// 3b. Anti-spoil : un système verrouillé n'a pas de panneau de vitesse
{
  const st = frais();
  st.records.highestBoss = 40;
  const p = idleStatsBreakdownV1(st).panneaux;
  for (const k of ["augments", "ngu", "barbes", "wandoos"]) assert.equal(p[k], undefined, k + " verrouillé : pas de panneau");
}

// 4. EXP / AP / PP : seuls les facteurs actifs ; totaux = moteur
{
  const st = frais();
  toutDebloque(st);
  st.adventure.setRewards.heartExpPct = 0.10;
  st.adventure.setRewards.heartApPct = 0.20;
  st.adventure.completedSets = Object.assign({}, st.adventure.completedSets, { heartGreen: true, pissedOffKey: true, pinkprincess: true, halloweenie: true });
  st.adventure.setRewards.itopodPpPct = 0.20 + 0.10 + 0.10 + 0.45;
  st.bonuses.cookingExp = 0.25;
  const g = idleStatsBreakdownV1(st).panneaux.gains;
  const [exp, ap, pp, prog] = g.sections;
  const b = idleNguBonuses(st);
  assert.equal(valeur(exp, "Cœur rouge complété"), 1.1);
  assert.ok(Math.abs(valeur(exp, "Cuisine") - 1.25) < 1e-9);
  assert.equal(noms(exp).includes("Équipement"), false);
  assert.ok(proche(exp.total.v, b.xpMultiplier) && sansEcart(exp));
  assert.equal(valeur(ap, "Cœur jaune complété"), 1.2);
  assert.ok(proche(ap.total.v, apBonusMultiplierV1(st)));
  assert.ok(proche(ap.base.v * produit(ap), ap.total.v), "AP : le produit des lignes = le total");
  assert.ok(proche(pp.total.v, b.ppMultiplier) && sansEcart(pp));
  assert.equal(pp.lignes.filter((x) => x.l === "Bonus de set").length, 4, "quatre sets de PP, facteurs séparés (1,2 x 1,1 x 1,1 x 1,45)");
  assert.ok(Math.abs(pp.total.v - 1.2 * 1.1 * 1.1 * 1.45) < 1e-9);
  assert.ok(prog.total.v > prog.base.v, "progression de PP par kill = (base + étage) x bonus");
  assert.equal(JSON.stringify(g).includes("Halloween"), false, "aucun nom de set");
}

// 5. Aventure : Or, réapparition (total en % ET en secondes), butin ; constantes du jeu vérifiées dans le calcul réel
{
  const st = frais();
  toutDebloque(st);
  st.adventure.completedSets = Object.assign({}, st.adventure.completedSets, { "2d": true, normalBonusAccs: true, clock: true });
  st.adventure.setRewards.drop = 0.0743 + 0.25;
  st.adventure.setRewards.respawn = 0.05;
  const p = idleStatsBreakdownV1(st).panneaux.aventure;
  const [or, resp, drop] = p.sections;
  const b = idleNguBonuses(st);
  // butin : x107,43 % (2D) et x125 % (Normal Bonus Accs), deux facteurs SÉPARÉS dans le calcul réel
  assert.deepEqual(drop.lignes.filter((x) => x.l === "Bonus de set").map((x) => x.v).sort(), [1.0743, 1.25]);
  assert.ok(proche(drop.total.v, b.dropMultiplier) && sansEcart(drop));
  assert.ok(Math.abs(b.dropMultiplier - 1.0743 * 1.25) < 1e-9, "x107,43 % et x125 % appliqués dans dropMultiplier");
  // réapparition : Clock x95 %, 4 s de base, total en secondes = ce que le moteur utilise
  assert.equal(valeur(resp, "Bonus de set"), 0.95);
  assert.ok(Math.abs(resp.total.v - 0.95) < 1e-9);
  assert.ok(Math.abs(resp.total.secondes - 4 * (1 - b.respawnReduction)) < 1e-9);
  assert.equal(resp.total.f, "ps");
  assert.ok(proche(or.total.v, b.adventureGoldMultiplier) && sansEcart(or));
  // Or : « No TM Challenge » x200 % seulement quand il est actif
  assert.equal(noms(or).includes("Défi No Time Machine (Evil)"), false);
  st.challenge.completionsTier = { difficile: { noTimeMachine: 1 }, extreme: {} };
  const or2 = idleStatsBreakdownV1(st).panneaux.aventure.sections[0];
  assert.equal(valeur(or2, "Défi No Time Machine (Evil)"), 2);
  assert.ok(proche(or2.total.v, idleNguBonuses(st).adventureGoldMultiplier));
}

// 5b. Anti-spoil : pas de panneau d'Aventure avant le boss 4
{
  const st = frais();
  assert.equal(idleStatsBreakdownV1(st).panneaux.aventure, undefined);
  st.records.highestBoss = 4;
  assert.ok(idleStatsBreakdownV1(st).panneaux.aventure);
}

// 6. Page « Divers » : seulement ce qui existe ; jamais un total caché
{
  const st = frais();
  assert.equal(idleStatsBreakdownV1(st).panneaux.divers, undefined);
  st.records.totalRebirths = 7; st.records.totalExpEarned = 123456;
  st.adventure.titans = { t1: { kills: 2 }, t2: { kills: 1 } };
  const d = idleStatsBreakdownV1(st).panneaux.divers.divers;
  assert.deepEqual(d.map((x) => [x.l, x.v]), [["Renaissances totales", 7], ["EXP totale gagnée", 123456], ["Titans vaincus", 3]]);
}

// 7. Difficulty DIVIDER (Evil / Sadistic) : annoncé par le serveur
{
  const st = frais();
  assert.equal(idleStatsBreakdownV1(st).diviseur, 1);
  st.difficulty = "difficile";
  assert.equal(idleStatsBreakdownV1(st).diviseur, 1e30);
}

// 8. Réponse du serveur : combatPrincipal.detailStats.panneauxStats, un seul crochet, une erreur ne casse jamais la réponse
{
  const etat = readFileSync("cloudflare/src/idle-runtime-etat.js", "utf8");
  assert.ok(etat.includes("detailStats.panneauxStats = idleStatsBreakdownV1(statsEtat.metaNgu)"));
  const src = readFileSync("cloudflare/src/idle-stats-breakdown-v1.js", "utf8");
  assert.ok(/catch \(_e\) \{\s*return null;/.test(src), "jamais bloquant");
  assert.equal(/Date\.now|new Date|Math\.random/.test(src), false, "aucun champ horodaté ni aléatoire");
}

// 9. Client : onglets seulement pour les panneaux envoyés, Attack / Defense au même total que le moteur, ligne Difficulty DIVIDER
{
  const src = readFileSync("cloudflare/public/modules/stats-detail-v1.js", "utf8");
  const panneaux = idleStatsBreakdownV1((() => { const s = frais(); s.records.highestBoss = 40; s.records.totalRebirths = 3; return s; })());
  const base = 22508000;
  const etat = {
    combatPrincipal: {
      attaqueEntrainement: base, defenseEntrainement: base,
      multiplicateurAttaqueTotal: 0.5, multiplicateurDefenseTotal: 0.5,
      multiplicateurAttaquePost: 0.25, multiplicateurDefensePost: 0.25,
      multiplicateurPermanent: 1, bonusBoutique: 0,
      detailStats: {
        attaque: { facteurs: [{ id: "number", label: "NUMBER", valeur: 2 }], autres: 0.25, produit: 0.5 },
        defense: { facteurs: [], autres: 1, produit: 0.5 },
        equipement: null,
        panneauxStats: Object.assign({}, panneaux, { diviseur: 4 })
      }
    }
  };
  const fenetre = { __SOREAL_IDLE_LIRE_ETAT_V1__: () => etat };
  vm.runInNewContext(src, { window: fenetre, document: { getElementById: () => null, addEventListener() {}, head: { appendChild() {} }, createElement: () => ({}) } });
  const api = fenetre.__SOREAL_IDLE_STATS_DETAIL_V1__;
  const att = api.contenu("attaque");
  // total = max(100, 100 x post + round((base - 100) x produit)) comme le moteur (idle-runtime-boss.js)
  const attendu = Math.max(100, 100 * 0.25 + Math.round((base - 100) * 1 * 0.5));
  assert.ok(att.includes("11,3M") || att.includes("11.3M"), "total Attack " + attendu);
  assert.ok(att.includes("Difficulty DIVIDER") && att.includes("÷ 4"), "ligne Difficulty DIVIDER");
  assert.equal(att.includes("Autres bonus"), false, "le diviseur est sorti de « autres » (0,25 x 4 = x1) : pas de ligne « Autres bonus » ×1e-30");
  // onglets : Attack, Defense, Énergie, Magie, gains, Divers (Magie découverte, rien d'autre)
  assert.ok(att.includes('data-stats-onglet="energie"') && att.includes('data-stats-onglet="magie"') && att.includes('data-stats-onglet="gains"') && att.includes('data-stats-onglet="divers"'));
  for (const k of ["ngu", "barbes", "wandoos", "augments", "ressource3"]) assert.equal(att.includes('data-stats-onglet="' + k + '"'), false, k + " : onglet absent");
  const en = api.contenu("energie");
  assert.ok(en.includes("Statistiques d’Énergie") && en.includes("Puissance d’Énergie"));
  assert.equal(en.includes("Potion"), false, "facteur inactif : jamais nommé");
  assert.ok(api.contenu("divers").includes("Renaissances totales"));
}

console.log("idle-stats-breakdown-v1: OK");
