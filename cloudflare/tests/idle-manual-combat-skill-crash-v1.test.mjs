import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Les raccourcis de combat avec le mode IDLE OFF ne fonctionnent pas. Le son se
 * déclenche mais je ne mets pas de coup si j'en lance 1. Je ne bloque pas si je bloque. »
 *
 * Cause : utiliserCompetenceAdventureIdleV3_ (déclenchée par chaque bouton de compétence -- Attaque,
 * Block, Parry... -- uniquement quand idleAdventureIdleModeV3 est faux, donc uniquement Idle Mode OFF)
 * jouait le son de la compétence DEUX fois, la seconde via `jouerEffetAudioIdleV199_(skill_+def.id)` --
 * `skill_` sans guillemets référence une variable INEXISTANTE. Cette ReferenceError, levée juste après le
 * premier son (correct), interrompait la fonction avant d'atteindre l'attaque/le blocage plus bas : le son
 * jouait, mais aucun dégât ni aucune réduction de Block n'était jamais appliqué.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const fonction = ui.slice(
  ui.indexOf("function utiliserCompetenceAdventureIdleV3_(id){"),
  ui.indexOf("function ", ui.indexOf("function utiliserCompetenceAdventureIdleV3_(id){") + 1)
);
assert.ok(fonction.includes("attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant);"), "ancre de découpe valide");

// La référence non-quotée (ReferenceError à l'exécution) ne doit plus jamais apparaître.
assert.ok(!ui.includes("jouerEffetAudioIdleV199_(skill_+"), "plus de référence à la variable inexistante skill_");
assert.ok(!/\(skill_\+def\.id\)/.test(ui), "plus de concaténation non quotée avec def.id");

// Le son de la compétence est joué une seule fois par déclenchement, jamais deux.
const occurrences = (fonction.match(/jouerEffetAudioIdleV199_\('skill_'\+def\.id\)/g) || []).length;
assert.equal(occurrences, 1, "le son de compétence ne doit être joué qu'une seule fois");

// L'appel au son doit rester AVANT l'attaque/le blocage réels : le fixe une régression future qui
// réintroduirait un throw entre les deux (le son jouerait sans jamais appliquer l'effet).
assert.ok(
  fonction.indexOf("jouerEffetAudioIdleV199_('skill_'+def.id);") <
    fonction.indexOf("attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant);"),
  "le son précède l'attaque manuelle dans le code"
);

console.log("idle-manual-combat-skill-crash-v1: OK");
