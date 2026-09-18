import assert from "node:assert/strict";
import { applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-14) : "les mobs n'ont pas les mêmes PV. Nous non plus
 * d'ailleurs." Root cause côté joueur : idle-ngu-progression.js calculait
 * les vraies stats de combat d'Aventure (power/toughness/hp/regen) à DEUX
 * endroits séparés — une fois pour l'aperçu affiché (idleNguSnapshot,
 * correct) et une fois pour le contexte RÉELLEMENT utilisé pour lancer un
 * combat (applyIdleNguAction, action "adventure" → ctx.adventureStats) —
 * et seul le premier appliquait la formule hp/regen. Le second ne
 * corrigeait que power/toughness, laissant hp/regen à leur seul bonus
 * d'équipement brut (0 par défaut) : un joueur voyait "Max HP: 1010" à
 * l'écran mais un vrai combat démarrait avec seulement ~10 PV.
 *
 * Norman a re-signalé le même jour (partie NGU vs SOREAL IDLE lancées en
 * parallèle, progression bien plus rapide côté SOREAL) que le ratio
 * Power×10/Toughness÷20 utilisé jusque-là était inventé (sourcé d'une
 * page wiki "Fight Boss" qui n'existe pas — vérifié 404 en direct).
 * Vrai ratio, vérifié en direct sur les pages wiki réelles
 * https://ngu-idle.fandom.com/wiki/Build_Max_HP et .../Build_HP_Regen
 * (identique sur les ~20 objets d'Aventure qui y sont listés) :
 * HP Max = Power × 3, HP Regen = Toughness × 0.03 (3%).
 *
 * Ce test verrouille qu'un VRAI combat (via applyIdleNguAction, le chemin
 * réseau réel — pas un appel direct à idle-adventure-v47.js) donne au
 * joueur exactement les PV affichés par idleNguSnapshot, plus jamais deux
 * nombres différents pour la même chose.
 */

const ctx = { adventurePower: 100, adventureToughness: 100, bosses: 4 };

// 1. L'aperçu affiché doit montrer Max HP = Power×3 + 0 (aucun set) = 300.
const snap = idleNguSnapshot(null, ctx, 1);
assert.equal(snap.adventure.stats.hp, 300, "Aperçu : Max HP de base doit être Power x 3 = 300 (ratio réel vérifié sur les pages wiki Build Max HP / Build HP Regen).");
assert.equal(snap.adventure.stats.regen, 3, "Aperçu : HP Regen doit être Toughness x 0.03 = 3 (idem).");

// 2. Sélectionner Tutoriel (débloqué dès boss 4) puis démarrer un vrai combat.
const afterSelect = applyIdleNguAction(
  null,
  { action: "adventure", adventure: { action: "selectZone", zone: "tutorial" } },
  ctx,
  1
).state;

/*
 * startZoneFight (idle-adventure-v47.js) tire un boss au hasard
 * (Math.random() < zone.bossChance, 1/4 pour le Tutoriel). Le test vise
 * ici un mob normal précis, donc on fige Math.random() pour éviter un
 * tirage boss et choisir de façon déterministe le 3e mob normal.
 */
const originalRandom = Math.random;
let fought;
try {
  Math.random = () => 0.99;
  fought = applyIdleNguAction(
    afterSelect,
    { action: "adventure", adventure: { action: "startZoneFight" } },
    ctx,
    2
  );
} finally {
  Math.random = originalRandom;
}

/*
 * 3. Le combat réel doit donner EXACTEMENT les mêmes PV que l'aperçu
 *    (300 = Power×3), jamais le ~10 qu'aurait donné l'ancien bug (bonus
 *    d'équipement brut seul, sans le Power×3).
 *
 * PISTE 3 de l'audit wiki 2026-09-18 (idle-adventure-v47.js,
 * playerHpMaxForAdventureV1) : le "+10" plat qui s'ajoutait ici n'avait
 * jamais de citation wiki (recherché en direct, aucune page NGU ne
 * documente de PV joueur en Aventure — le vrai jeu utilise un système à
 * seuil Power/Toughness, pas une barre de vie). Retiré ; playerHpMax ne
 * reproduit plus que le Max HP réellement sourcé (Build_Max_HP, Power×3).
 * 310 -> 300 ci-dessous.
 */
assert.equal(
  fought.result.playerHpMax,
  300,
  "Un vrai combat démarré via applyIdleNguAction doit donner playerHpMax=300 (Power×3, plus de +10 non sourcé), pas ~10 (le bug où hp/regen n'étaient jamais enrichis pour le chemin de combat réel)."
);
assert.equal(
  fought.result.playerHpMax,
  snap.adventure.stats.hp,
  "playerHpMax du combat réel doit toujours correspondre exactement au Max HP affiché par idleNguSnapshot — plus jamais deux calculs séparés du même nombre."
);

/*
 * 4. Le monstre du Tutoriel doit garder les Max HP exacts de son onglet
 *    Adventure NGU. Math.random()=0.99 choisit le 3e mob normal :
 *    "A Stick?", Max HP=55. oneHitP=129.5 est une recommandation de Power
 *    joueur pour one-shot la zone ; ce n'est jamais un multiplicateur de
 *    PV ennemi.
 */
assert.equal(
  fought.result.monsterHpMax,
  55,
  "A Stick? doit avoir exactement 55 HP comme dans son onglet Adventure NGU, sans mise à l'échelle par oneHitP."
);

console.log("idle-adventure-combat-stats-shared: OK");
