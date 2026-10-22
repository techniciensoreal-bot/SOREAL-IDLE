import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : l'introduction (« Le commencement ») se lance dès le premier lancement / après une remise à zéro complète, sans attendre Basic Training ; elle attend que la chronique du boss soit fermée et lue ou interrompue. */
const pop = readFileSync(new URL("../public/modules/ui-popups-v1.js", import.meta.url), "utf8");

// Attente de la chronique : panneau ouvert, lecture de la chronique en cours ou voix qui parle ; puis une courte stabilité.
assert.ok(pop.includes("function chroniqueBossOccupeeIdleV1_()") && pop.includes("sorealIdleBossChroniqueV206"), "détection de la chronique du boss");
assert.ok(pop.includes("window.__chroniqueOuverteIdleV1||p.classList.contains('ouverte')"), "texte de la chronique encore ouvert");
assert.ok(pop.includes("tts.lectureCible('sorealIdleBossChroniqueV206')") && pop.includes("tts.isSpeaking()"), "lecture en cours");
assert.ok(pop.includes("Date.now()-REG.idleIntroLibreDepuisV1>=1200"), "libre depuis un instant avant de démarrer");
const i = pop.indexOf("function gererPopupsProgressionIdleV75_(j)");
const bloc = pop.slice(i, i + 2600);
assert.ok(bloc.indexOf("if(!introductionPeutDemarrerIdleV1_())return;") > 0 && bloc.indexOf("demarrerTutorielPagesIdleV1_(") > bloc.indexOf("introductionPeutDemarrerIdleV1_()"), "le garde précède le lancement de l'introduction");

// Redemandée régulièrement tant que le joueur est nouveau et n'a pas fini l'introduction (plus seulement aux changements de menu).
assert.ok(/setInterval\(function\(\)\{[\s\S]{0,420}nouveauJoueur[\s\S]{0,300}gererPopupsProgressionIdleV75_\(j\)[\s\S]{0,60}\},700\)/.test(pop), "vérification toutes les 0,7 s");
console.log("idle-introduction-apres-chronique-v1: OK");
