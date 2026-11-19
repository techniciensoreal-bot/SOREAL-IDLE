import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_NETTOYAGE_PALIERS_V1, IDLE_NETTOYAGE_BUDGET_JOUR_FACTEUR_V1, IDLE_NETTOYAGE_MAX_PAR_JOUR_V1, IDLE_NETTOYAGE_AP_RARE_V1, IDLE_NETTOYAGE_ESPACEMENT_MS_V1, idleNettoyagePalierV1 } from "../src/idle-ngu-actions.js";

/*
 * Norman (2026-11-19) : « un système de palier comme pour la roue ou le money pit : plus on frotte et plus on monte de paliers, de manière exponentielle ; les récompenses en AP plus nombreuses, sans que ça devienne abusé ».
 * Palier = nombre de nettoyages terminés (records.nettoyagesAP) ; seuils presque doublés à chaque palier ; gain ordinaire de 1 au maximum du palier ; au plus 20 nettoyages par jour et un budget d'AP par jour (4 x le maximum du palier).
 */
const P = IDLE_NETTOYAGE_PALIERS_V1;
assert.deepEqual(P.map((p) => p.seuil), [0, 7, 20, 45, 100, 200, 400, 800], "seuils exponentiels, comme la roue (0, 7, 14, 30, 60, 120, 180, 365)");
assert.deepEqual(P.map((p) => p.apMax), [100, 150, 250, 400, 650, 1000, 1600, 2500], "le palier 0 garde les 100 AP d'avant ; les maximums montent d'environ 60 % par palier");
for (let i = 1; i < P.length; i += 1) { assert.ok(P[i].seuil > P[i - 1].seuil && P[i].apMax > P[i - 1].apMax, "seuils et gains strictement croissants"); }
assert.ok(P[P.length - 1].apMax <= IDLE_NETTOYAGE_AP_RARE_V1 / 2, "le gain ordinaire maximal reste très en dessous du gain exceptionnel (5 000 AP)");
assert.equal(IDLE_NETTOYAGE_MAX_PAR_JOUR_V1, 20, "au plus 20 nettoyages par jour (avant 150) : un joueur en fait environ 2 (un accident du Coffre, un de la Valise)");
assert.equal(IDLE_NETTOYAGE_BUDGET_JOUR_FACTEUR_V1, 4);
assert.deepEqual([0, 6, 7, 19, 20, 44, 45, 99, 100, 199, 200, 399, 400, 799, 800, 5000].map(idleNettoyagePalierV1), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], "palier selon le nombre de nettoyages");
assert.equal(idleNettoyagePalierV1(undefined), 0); assert.equal(idleNettoyagePalierV1(-5), 0);

const ctx = { bosses: 100, basicTrainingComplete: true };
const frais = (nettoyages) => { const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0); s.records.nettoyagesAP = nettoyages; return s; };
const tire = (valeurs) => { let i = 0; return Object.assign({}, ctx, { alea: () => valeurs[Math.min(i++, valeurs.length - 1)] }); };
const JOUR = 86400000;

/* 1. le gain ordinaire monte avec le palier : tirage maximal (0,999999) = le maximum du palier */
for (let palier = 0; palier < P.length; palier += 1) {
  const s = frais(P[palier].seuil);
  const r = applyIdleNguAction(s, { action: "cleanMess", lieu: "coffre" }, tire([0.5, 0.999999]), 1000);
  assert.equal(r.result.ap, P[palier].apMax, "palier " + palier + " : tirage maximal = " + P[palier].apMax);
  assert.equal(r.result.palier, palier, "le palier est renvoyé");
  assert.equal(r.state.records.nettoyagesAP, P[palier].seuil + 1, "le compteur de nettoyages monte de 1");
  const bas = applyIdleNguAction(frais(P[palier].seuil), { action: "cleanMess", lieu: "coffre" }, tire([0.5, 0]), 1000);
  assert.equal(bas.result.ap, 1, "le minimum reste 1 AP");
}
/* un palier est franchi par le nettoyage qui atteint le seuil (après 7 nettoyages, le 8e est au palier 1) */
{
  let s = frais(6); let t = 1000;
  let r = applyIdleNguAction(s, { action: "cleanMess", lieu: "coffre" }, tire([0.5, 0.999999]), t); assert.equal(r.result.palier, 0); s = r.state;
  t += IDLE_NETTOYAGE_ESPACEMENT_MS_V1 + 1;
  r = applyIdleNguAction(s, { action: "cleanMess", lieu: "coffre" }, tire([0.5, 0.999999]), t); assert.equal(r.result.palier, 1); assert.equal(r.result.ap, 150);
}

/* 2. le gain exceptionnel (0,05 %) reste 5 000 AP à tous les paliers et n'entre pas dans le budget du jour */
{
  const s = frais(800);
  const r = applyIdleNguAction(s, { action: "cleanMess", lieu: "valise" }, tire([0.0004999]), 1000);
  assert.equal(r.result.ap, 5000); assert.equal(r.result.rare, true);
  assert.equal(r.state.records.nettoyageJourAP, 0, "le gain exceptionnel n'est pas compté dans le budget du jour");
}

/* 3. budget d'AP par jour = 4 x le maximum du palier : le dernier gain est tronqué, puis refusé ; le lendemain tout reprend */
{
  const palier = 1, apMax = P[palier].apMax, budget = apMax * IDLE_NETTOYAGE_BUDGET_JOUR_FACTEUR_V1;   /* 600 */
  let s = frais(P[palier].seuil); let t = 10 * JOUR; let total = 0; let n = 0;
  for (; n < 10; n += 1) {
    t += IDLE_NETTOYAGE_ESPACEMENT_MS_V1 + 1;
    try { const r = applyIdleNguAction(s, { action: "cleanMess", lieu: n % 2 ? "valise" : "coffre" }, tire([0.5, 0.999999]), t); total += r.result.ap; s = r.state; }
    catch (e) { assert.match(String(e.message), /NETTOYAGE_LIMITE_JOUR/, "au budget : refusé"); break; }
  }
  assert.equal(total, budget, "le total du jour ne dépasse jamais le budget (" + budget + " AP)");
  assert.equal(n, 4, "4 nettoyages de " + apMax + " AP remplissent exactement le budget ; le 5e est refusé");
  assert.equal(s.records.nettoyageJourAP, budget);
  t += JOUR;   /* le lendemain */
  const r = applyIdleNguAction(s, { action: "cleanMess", lieu: "coffre" }, tire([0.5, 0.999999]), t);
  assert.ok(r.result.ap > 0, "le lendemain, un nouveau budget");
  assert.equal(r.state.records.nettoyageJourAP, r.result.ap, "le budget du jour est remis à zéro");
}
/* le budget tronque le dernier gain plutôt que de le perdre : il reste 50 AP au budget, un tirage maximal en rapporte 50 */
{
  let s = frais(0); s.records.nettoyageJour = Math.floor(5000 / 1) ; /* jour courant ci-dessous */
  const t = 5000 * JOUR + 5; const jour = Math.floor(t / JOUR);
  s.records.nettoyageJour = jour; s.records.nettoyageJourN = 1; s.records.nettoyageJourAP = 350;   /* palier 0 : budget 400 */
  const r = applyIdleNguAction(s, { action: "cleanMess", lieu: "coffre" }, tire([0.5, 0.999999]), t);
  assert.equal(r.result.ap, 50, "gain tronqué au reste du budget"); assert.equal(r.state.records.nettoyageJourAP, 400);
}

/* 4. au plus 20 nettoyages par jour */
{
  let s = frais(0); let t = 20 * JOUR; let faits = 0;
  for (let i = 0; i < 30; i += 1) {
    t += IDLE_NETTOYAGE_ESPACEMENT_MS_V1 + 1;
    try { s = applyIdleNguAction(s, { action: "cleanMess", lieu: i % 2 ? "valise" : "coffre" }, tire([0.5, 0]), t).state; faits += 1; }
    catch (e) { assert.match(String(e.message), /NETTOYAGE_LIMITE_JOUR/); break; }
  }
  assert.equal(faits, 20, "20 nettoyages au plus par jour");
}
console.log("idle-nettoyage-paliers-v1 : OK");
