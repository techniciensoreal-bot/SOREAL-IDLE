import assert from "node:assert/strict";
import { nguBossStatsV1, NGU_BOSS_REFERENCE_COUNT_V1 } from "../src/idle-ngu-boss-reference-v1.js";

/*
 * Norman (2026-09-13), en jouant SOREAL IDLE et NGU Idle en parallèle :
 * "les barres ne descendent pas par coup [dans le vrai NGU]. Elles
 * descendent progressivement plus ou moins vite suivant la différence de
 * force de l'ennemi."
 *
 * Vérifié directement sur ngu-idle.fandom.com/wiki/Attack : "Your attack
 * minus the defense of the boss is the amount you deduct from the HP of
 * the boss per second." La Defense d'un boss était déjà extraite du wiki
 * dans cloudflare/reference/ngu-boss-reference-v1.json (2026-09-09) mais
 * jamais reportée dans le runtime (NGU_BOSS_REFERENCE_V1/nguBossStatsV1)
 * — elle n'existait donc nulle part pour que le dégât du joueur puisse la
 * soustraire.
 */

// --- Boss 1 (index 0) : Attack 50 000 / Defense 40 000 / HP 500 000, exactement le wiki ---
{
  const s = nguBossStatsV1(0);
  assert.equal(s.pv, 500000);
  assert.equal(s.attaque, 50000);
  assert.equal(s.defense, 40000, "La Defense du boss 1 doit être exactement 40 000, comme publié sur le wiki (Attack/Defense/HP = 50 000/40 000/500 000).");
}

/*
 * Correctif 2026-09-16 (Norman, screenshot en direct du VRAI jeu NGU
 * Idle, pas seulement le wiki) : Boss 4 "A Small Mouse" = Attack
 * 1 100 000 / Defense 600 000 / HP 11 000 000 — confirmé par capture
 * d'écran réelle du jeu original, plus fiable que le tableau
 * récapitulatif du wiki (qui affichait 1 300 000/700 000/13 000 000,
 * en désaccord avec la fiche individuelle ET le jeu réel).
 */
{
  const s = nguBossStatsV1(3);
  assert.equal(s.attaque, 1100000, "Attack du boss 4 confirmé par screenshot réel du jeu : 1 100 000.");
  assert.equal(s.defense, 600000, "Defense du boss 4 confirmé par screenshot réel du jeu : 600 000.");
  assert.equal(s.pv, 11000000, "HP du boss 4 confirmé par screenshot réel du jeu : 11 000 000.");
}

// --- Extrapolation au-delà de la table sourcée (160 boss) : même multiplicateur ×10/boss que pv/attaque ---
{
  const last = nguBossStatsV1(NGU_BOSS_REFERENCE_COUNT_V1 - 1);
  const beyond = nguBossStatsV1(NGU_BOSS_REFERENCE_COUNT_V1);
  assert.ok(Math.abs(beyond.defense / last.defense - 10) < 1e-9, "Au-delà du boss 160, la Defense doit continuer sur le même multiplicateur ×10/boss que pv/attaque, jamais rester figée.");
}

console.log("idle-boss-defense-stat: OK");
