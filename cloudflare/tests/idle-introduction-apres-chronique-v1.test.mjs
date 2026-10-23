import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22 puis 2026-10-23) : l'introduction (« Le commencement ») se lance dès le premier lancement / après une remise à zéro complète, sans attendre Basic Training, et PASSE AVANT la chronique du boss (« j'ai directement eu la chronique du boss »). Le nouveau tutoriel, lui, attend la fin de la chronique (idle-tutoriel-nouveau-apres-chronique-v1). */
const pop = readFileSync(new URL("../public/modules/ui-popups-v1.js", import.meta.url), "utf8");
const tts = readFileSync(new URL("../public/modules/tutorial-tts-v202.js", import.meta.url), "utf8");

// Plus d'attente de la chronique pour l'introduction ; la lecture de la chronique en cours est coupée à l'ouverture.
const garde = pop.slice(pop.indexOf("function introductionPeutDemarrerIdleV1_()"), pop.indexOf("function introductionPeutDemarrerIdleV1_()") + 700);
assert.ok(garde.includes("tts.lectureCible('sorealIdleBossChroniqueV206')") && garde.includes("tts.stop()") && garde.includes("return true;"), "l'introduction coupe la chronique en cours et démarre tout de suite");
assert.ok(!garde.includes("idleIntroLibreDepuisV1") && !garde.includes("return false"), "plus aucune attente de la chronique pour l'introduction");

// Le garde précède le lancement de l'introduction.
const i = pop.indexOf("function gererPopupsProgressionIdleV75_(j)");
const bloc = pop.slice(i, i + 2600);
assert.ok(bloc.indexOf("if(!introductionPeutDemarrerIdleV1_())return;") > 0 && bloc.indexOf("demarrerTutorielPagesIdleV1_(") > bloc.indexOf("introductionPeutDemarrerIdleV1_()"), "le garde précède le lancement de l'introduction");

// La voix reconnaît la fenêtre du diaporama et la lit avant la chronique du boss.
const actif = tts.slice(tts.indexOf("function activePanel_()"), tts.indexOf("function buttonHost_(panel)"));
assert.ok(actif.indexOf("#sorealIdleTutorielPagesModalV1 .id-scene") > 0 && actif.indexOf("#sorealIdleTutorielPagesModalV1 .id-scene") < actif.indexOf("panneauChroniqueBoss_()"), "la fenêtre « Le commencement » passe avant la chronique du boss");

// Redemandée régulièrement tant que le joueur est nouveau et n'a pas fini l'introduction (plus seulement aux changements de menu).
assert.ok(/setInterval\(function\(\)\{[\s\S]{0,420}nouveauJoueur[\s\S]{0,300}gererPopupsProgressionIdleV75_\(j\)[\s\S]{0,60}\},700\)/.test(pop), "vérification toutes les 0,7 s");
console.log("idle-introduction-apres-chronique-v1: OK");
