import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleNguBonuses, normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { normalizeIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/*
 * Panneau « Détail de l'Attack / Defense » (Norman, 2026-09-26) : les facteurs affichés sont les variables réellement multipliées par le moteur ;
 * produit affiché = produit appliqué. L'équipement porté compte les boosts déjà appliqués (power/toughness ACTUELS de l'objet) : 1 point = +1 %.
 */
function etatAvecEquipement(power, toughness) {
  const st = normalizeIdleNguState({}, {}, Date.now());
  const adv = normalizeIdleAdventureStateV47(st.adventure || {});
  adv.inventory = [{ id: "casque", kind: "equipment", slot: "head", power, toughness, name: "Casque" }];
  adv.equipment = { ...adv.equipment, head: "casque" };
  st.adventure = adv;
  return st;
}

// 1. Sans équipement : tous les facteurs à 1, le produit vaut 1
{
  const b = idleNguBonuses(normalizeIdleNguState({}, {}, Date.now()));
  assert.ok(b.facteursStats && Array.isArray(b.facteursStats.attaque) && Array.isArray(b.facteursStats.defense));
  assert.ok(b.facteursStats.attaque.every((f) => f.valeur === 1));
  assert.equal(b.attackMultiplier, 1);
}

// 2. Avec un objet porté (Power 8,94 / Toughness 6,94) : +8,94 % d'Attack, +6,94 % de Defense, et le produit des facteurs listés = le produit appliqué
{
  const b = idleNguBonuses(etatAvecEquipement(8.94, 6.94));
  const eqA = b.facteursStats.attaque.find((f) => f.id === "equipement");
  const eqD = b.facteursStats.defense.find((f) => f.id === "equipement");
  assert.ok(Math.abs(eqA.valeur - 1.0894) < 1e-9, "Attack : " + eqA.valeur);
  assert.ok(Math.abs(eqD.valeur - 1.0694) < 1e-9, "Defense : " + eqD.valeur);
  assert.equal(b.facteursStats.equipement.power, 8.94);
  const produitA = b.facteursStats.attaque.reduce((a, f) => a * f.valeur, 1);
  const produitD = b.facteursStats.defense.reduce((a, f) => a * f.valeur, 1);
  assert.ok(Math.abs(produitA - b.attackMultiplier) / b.attackMultiplier < 1e-12, "produit Attack listé = appliqué");
  assert.ok(Math.abs(produitD - b.defenseMultiplier) / b.defenseMultiplier < 1e-12, "produit Defense listé = appliqué");
}

// 3. Les boosts appliqués à un objet augmentent son Power actuel, donc le bonus d'équipement
{
  const sans = idleNguBonuses(etatAvecEquipement(8.94, 6.94)).facteursStats.attaque.find((f) => f.id === "equipement").valeur;
  const avec = idleNguBonuses(etatAvecEquipement(8.94 + 5, 6.94)).facteursStats.attaque.find((f) => f.id === "equipement").valeur;
  assert.ok(Math.abs((avec - sans) - 0.05) < 1e-9, "5 points de boost = +5 % d'Attack");
}

// 4. Serveur : le détail est dans combatPrincipal.detailStats, l'équipement est retiré avant l'Aventure
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "latin1");
assert.ok(runtime.includes("function detailStatsCombatSorealIdle_("));
assert.ok(runtime.includes("!aventureDebloquee\n      ),"), "équipement retiré du détail comme du calcul, tant que l'Aventure n'est pas débloquée");
assert.match(runtime, /detailStats:\s*combatPrincipalEtat\s*\.detailStats/);

// 5. Client : lignes affichées = facteurs actifs seulement, neutres comptés sans être nommés
{
  const src = readFileSync("cloudflare/public/modules/stats-detail-v1.js", "utf8");
  const etat = {
    combatPrincipal: {
      attaqueEntrainement: 22508000,
      defenseEntrainement: 22493000,
      detailStats: {
        attaque: {
          facteurs: [
            { id: "number", label: "NUMBER", valeur: 1 },
            { id: "wandoos", label: "Wandoos", valeur: 1 },
            { id: "equipement", label: "Équipement porté", valeur: 1.0894 }
          ],
          autres: 1,
          produit: 1.0894
        },
        defense: { facteurs: [], autres: 1, produit: 1 },
        equipement: { power: 8.94, toughness: 6.94, cubePower: 0, cubeToughness: 0 }
      }
    }
  };
  const fenetre = { __SOREAL_IDLE_LIRE_ETAT_V1__: () => etat };
  vm.runInNewContext(src, { window: fenetre, document: { getElementById: () => null, addEventListener() {}, head: { appendChild() {} }, createElement: () => ({}) } });
  const html = fenetre.__SOREAL_IDLE_STATS_DETAIL_V1__.contenu("attaque");
  assert.ok(html.includes("Équipement porté") && html.includes("×1,0894") && html.includes("+8,94 %"));
  assert.ok(html.includes("Power porté : 8,94") && html.includes("boosts appliqués compris"));
  assert.equal(html.includes("Wandoos"), false, "un facteur neutre n'est jamais nommé");
  assert.equal(html.includes("NUMBER"), false);
  assert.ok(html.includes("2 autres facteurs à ×1"), "les neutres sont comptés");
  assert.ok(html.includes("24,5M") || html.includes("24.5M"), "total = 100 + (base − 100) × produit");
}
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("window.__SOREAL_IDLE_LIRE_ETAT_V1__=function(){return idleEtat;};"));
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/stats-detail-v1.js?v=1"));
console.log("idle-stats-detail-v1: OK");
