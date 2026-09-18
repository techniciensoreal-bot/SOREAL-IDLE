import assert from "node:assert/strict";
import { nguBossStatsV1, NGU_BOSS_REFERENCE_COUNT_V1 } from "../src/idle-ngu-boss-reference-v1.js";

/*
 * Round 2 (2026-09-18, sweep Fight Boss) : boss161-190 (index 160-189) sont
 * désormais une table SOURCÉE (28 fiches wiki individuelles réelles, miroir
 * local C:\Users\n0rma\Documents\NGU-Wiki\pages), pas seulement une
 * extrapolation ×10/boss -- même valeur numérique qu'avant (la formule
 * d'extrapolation était déjà correcte), mais désormais vérifiée fiche par
 * fiche plutôt que supposée. Voir le commentaire de tête de
 * idle-ngu-boss-reference-v1.js pour le détail complet de la vérification.
 *
 * boss190 "TRUE FINAL BOSS" (ngu-idle.fandom.com/wiki/TRUE_FINAL_BOSS) est
 * le DERNIER combat de la séquence à porter des stats bf_* individuelles
 * dans le miroir local -- ce test fige donc la limite de la table sourcée
 * à 190 (NGU_BOSS_REFERENCE_COUNT_V1), pour qu'une future extension au-delà
 * de 190 ne puisse pas se faire silencieusement sans qu'un test remarque
 * que la frontière a bougé.
 */

// --- La table sourcée couvre maintenant exactement 190 boss (1-190, index 0-189) ---
{
  assert.equal(NGU_BOSS_REFERENCE_COUNT_V1, 190, "La table sourcée doit couvrir exactement 190 boss après le Round 2 (boss161-190 ajoutés depuis leurs fiches wiki individuelles).");
}

// --- boss161 "God of Thunder" (index 160) : bf_power=1.984E+158, bf_toughness=1.068E+158, continuation ×10 exacte depuis boss160 ---
{
  const boss160 = nguBossStatsV1(159);
  const boss161 = nguBossStatsV1(160);
  assert.ok(Math.abs(boss161.pv / boss160.pv - 10) < 1e-9, "boss161 doit valoir exactement ×10 boss160 en PV (fiche wiki individuelle 'God of Thunder', bf_hp=1.984E+159).");
  assert.ok(Math.abs(boss161.attaque / boss160.attaque - 10) < 1e-9, "boss161 doit valoir exactement ×10 boss160 en Attaque (bf_power=1.984E+158, cohérent à 4 chiffres significatifs avec la valeur exacte calculée).");
  assert.ok(Math.abs(boss161.defense / boss160.defense - 10) < 1e-9, "boss161 doit valoir exactement ×10 boss160 en Defense (bf_toughness=1.068E+158).");
}

// --- boss190 "TRUE FINAL BOSS" (index 189) : dernier boss avec fiche wiki individuelle exploitable ---
{
  const s = nguBossStatsV1(189);
  assert.ok(Math.abs(s.pv - 1.983642578125e+188) / 1.983642578125e+188 < 1e-12, "boss190 'TRUE FINAL BOSS' doit avoir le PV exact continuant la progression ×10/boss depuis boss160.");
  assert.equal(s.xp, 17, "boss190 : xp = floor((190-34)/10)+2 = 17 (formule confirmée, bf_exp non publié sur cette fiche individuelle).");
}

// --- boss191+ (index >= 190) : redescend sur l'extrapolation pure, jamais sourcée (aucune fiche au-delà de 190) ---
{
  const boss190 = nguBossStatsV1(189);
  const boss191 = nguBossStatsV1(190);
  assert.ok(Math.abs(boss191.pv / boss190.pv - 10) < 1e-9, "boss191 doit continuer sur le même multiplicateur ×10/boss (extrapolation honnête, jamais individuellement sourcée au-delà de 190).");
}

console.log("idle-boss-sourced-extension-161-190: OK");
