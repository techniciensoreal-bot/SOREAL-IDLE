import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-24) : « les barres d'Augmentations ne fonctionnent pas hors ligne ». Une longue absence tombait dans la boucle « un niveau par tour, 10 000 tours maximum » : 1 h valait 10 070 niveaux hors ligne contre 134 163 en ligne.
 * Un seul grand pas (hors ligne) doit donner le même résultat que la suite de petits pas (en ligne), Or compris.
 */
const ctx = { bosses: 300, unlockFlags: {} };
function neuf(or) {
  const s = normalizeIdleNguState({}, ctx, 1000);
  s.systems.augmentations.unlocked = true; s.resources.energy.cap = 1e12; s.resources.energy.current = 5e11; s.resources.energy.power = 1e6; s.currencies.gold = or;
  return s;
}
const etat = (s) => Object.entries(s.systems.augmentations.data.pairs).map(([k, p]) => [k, p.level, p.upgradeLevel]);
function scenario(nom, or, placer, secondes, pas) {
  let s = neuf(or);
  placer((a, t) => { s = applyIdleNguAction(s, a, ctx, t).state; });
  let en = JSON.parse(JSON.stringify(s)), t = 3000;
  for (let i = 0; i < secondes / pas; i += 1) { t += pas * 1000; en = advanceIdleNguState(en, pas, ctx, t); }
  const hors = advanceIdleNguState(JSON.parse(JSON.stringify(s)), secondes, ctx, 3000 + secondes * 1000);
  const A = etat(en), B = etat(hors);
  for (let i = 0; i < A.length; i += 1) {
    assert.ok(Math.abs(A[i][1] - B[i][1]) <= 1 && Math.abs(A[i][2] - B[i][2]) <= 1, nom + " : " + JSON.stringify(A[i]) + " (en ligne) ≠ " + JSON.stringify(B[i]) + " (hors ligne)");
  }
  assert.ok(Math.abs(en.currencies.gold - hors.currencies.gold) <= Math.max(1e3, or * 1e-6), nom + " : Or " + en.currencies.gold + " ≠ " + hors.currencies.gold);
  return { en: A, hors: B };
}
// 1) beaucoup d'Or : une heure d'absence = toutes les barres comptées (plus de plafond à 10 000 niveaux)
{
  const r = scenario("1 h", 1e30, (agir) => { agir({ action: "allocateAugment", pair: "scissors", value: 1e6 }, 2000); }, 3600, 4);
  assert.ok(r.hors[0][1] > 100000, "plus de 100 000 niveaux en une heure hors ligne : " + r.hors[0][1]);
}
// 2) Or limité : l'Or borne les niveaux de la même façon en ligne et hors ligne
scenario("Or limité", 5e12, (agir) => { agir({ action: "allocateAugment", pair: "scissors", value: 1e6 }, 2000); }, 3600, 4);
// 3) deux pistes en parallèle (l'ordre « la moins chère d'abord » est conservé)
scenario("deux pistes", 1e30, (agir) => { agir({ action: "allocateAugment", pair: "scissors", value: 5e5 }, 2000); agir({ action: "allocateAugment", pair: "milk", value: 5e5 }, 2001); }, 1800, 4);
// 4) l'Upgrade (coût en n², temps linéaire) : même résultat en ligne et hors ligne
scenario("upgrade", 1e30, (agir) => { agir({ action: "allocateAugment", pair: "scissors", upgrade: true, value: 1e6 }, 2000); agir({ action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 }, 2001); }, 1800, 4);
console.log("idle-augments-hors-ligne-v1 OK");
