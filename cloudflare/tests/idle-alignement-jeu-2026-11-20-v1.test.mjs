import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
/* 2026-11-20, lu dans le jeu : (1) invCookCheck (2933) compte CHAQUE ligne Cooking % ; (2) tryConsumeCard (1747) refuse la carte THE END sans place libre ; (3) WishesController::minimumWishTime (4908) n'a aucun plancher de 3 600 s. */
const cuisine = lireSrc("idle-cooking-v1.js");
assert.ok(/nbSpecialsCooking/.test(cuisine) && /count: nb \* \(slot === "legs" \? 2 : 1\)/.test(cuisine), "cuisine : un objet compte une fois par ligne Cooking %");
const actions = lireSrc("idle-ngu-actions.js");
assert.ok(/carte\.theEnd && idleAdventureInventoryUsedV1/.test(actions) && /INVENTAIRE_PLEIN/.test(actions), "THE END exige une place libre");
const pistes = lireSrc("idle-ngu-pistes.js");
assert.ok(!/Math\.max\(3600, WISH_MIN_LEVEL_SECONDS/.test(pistes), "plus de plancher de 3 600 s sur le temps minimal des souhaits");
/* Wandoos hors ligne (2242) : vitesse de boot de la FIN pour toute la fenêtre. */
assert.ok(lireSrc("idle-ngu-etat.js").includes("if (span >= 300) return { fraction: clamp(end / bootSeconds"), "Wandoos hors ligne : boot de la fin de fenêtre");
/* Mur du boss 20 retiré. */
assert.ok(/let bossBloqueRenaissance = false;/.test(lireSrc("idle-runtime-progression.js")), "plus de mur au boss 20");
console.log("idle-alignement-jeu-2026-11-20-v1: OK");
