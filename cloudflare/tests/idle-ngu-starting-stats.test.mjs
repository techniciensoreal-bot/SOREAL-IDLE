import assert from "node:assert/strict";
import { idleNguSnapshot, IDLE_NGU_META_VERSION, IDLE_NGU_SAVE_SCHEMA } from "../src/idle-ngu-progression.js";
import { IDLE_ADVENTURE_V47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-13), audit SOREAL IDLE vs NGU Idle, puis re-signalé le
 * 2026-09-14 (partie NGU vs SOREAL IDLE lancées en parallèle, progression
 * bien plus rapide côté SOREAL — "rien ne correspond"). Le ratio Attack
 * x10/Defense÷20 utilisé jusque-là citait une page wiki "Fight Boss" qui
 * n'existe pas (vérifié 404 en direct au navigateur) — une valeur
 * inventée, ce qui explique le décalage de vitesse : le joueur SOREAL
 * était bien plus résistant que le vrai jeu.
 *
 * Vrai ratio, vérifié en direct sur les pages wiki réelles (2026-09-14)
 * https://ngu-idle.fandom.com/wiki/Build_Max_HP et .../Build_HP_Regen —
 * identique sur les ~20 objets d'Aventure réels qui y sont listés :
 * HP Max = Power × 3, HP Regen = Toughness × 0.03 (3%).
 *
 * Cause racine (toujours valable) : snap.stats.hp/regen (calculé dans
 * idleNguSnapshot, idle-ngu-progression.js) ne lisaient jamais
 * context.adventurePower/adventureToughness — uniquement un bonus de set
 * complété (0 par défaut). Corrigé pour réutiliser
 * adventurePower/adventureToughness comme power/toughness le font déjà,
 * en restant additif avec le bonus de set (jamais un remplacement).
 *
 * playerHpMaxForAdventureV1 (idle-adventure-v47.js, non exportée, fonction
 * privée) fait ensuite 10+stats.hp — donc pour un joueur neuf :
 * 10 + (100*3) = 310.
 */

// --- Joueur neuf : Power/Toughness au plancher (100), aucun set complété ---
{
  const snap = idleNguSnapshot(null, { adventurePower: 100, adventureToughness: 100, bosses: 0 });
  const stats = snap.adventure.stats;

  assert.equal(stats.hp, 300, "Max HP de base (avant le +10 d'affichage) doit être Power x 3 = 300 (ratio réel vérifié sur les pages wiki Build Max HP / Build HP Regen).");
  assert.equal(stats.regen, 3, "HP Regen doit être Toughness x 0.03 = 3, jamais 0 ni 1.");
  assert.equal(10 + stats.hp, 310, "Avec le +10 de playerHpMaxForAdventureV1, Max HP affiché = 310.");
}

// --- Un bonus de set complété doit s'ADDITIONNER, jamais remplacer la formule Power/Toughness ---
{
  const snap = idleNguSnapshot(
    {
      version: IDLE_NGU_META_VERSION,
      saveSchema: IDLE_NGU_SAVE_SCHEMA,
      adventure: { version: IDLE_ADVENTURE_V47, setRewards: { adventureHp: 50, adventureRegen: 2 } }
    },
    { adventurePower: 100, adventureToughness: 100, bosses: 0 }
  );
  const stats = snap.adventure.stats;
  assert.equal(stats.hp, 350, "Le bonus de set (adventureHp) doit s'ajouter à Power x 3, pas le remplacer.");
  assert.equal(stats.regen, 5, "Le bonus de set (adventureRegen) doit s'ajouter à Toughness x 0.03, pas le remplacer.");
}

// --- Power/Toughness plus élevés (progression) : la formule doit rester Power x 3 / Toughness x 0.03 ---
{
  const snap = idleNguSnapshot(null, { adventurePower: 500, adventureToughness: 300, bosses: 5 });
  const stats = snap.adventure.stats;
  assert.equal(stats.hp, 1500, "Max HP doit suivre Power x 3 à tout niveau de progression, pas seulement au départ.");
  assert.equal(stats.regen, 9, "HP Regen doit suivre Toughness x 0.03 à tout niveau de progression.");
}

console.log("idle-ngu-starting-stats: OK");
