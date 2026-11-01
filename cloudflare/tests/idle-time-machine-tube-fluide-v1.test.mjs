import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Machine temporelle plus lente que les autres menus (Norman, 2026-11-01 : « latence quand je place les points ») :
 * le niveau du tube passait par la variable CSS --fill, ecrite a chaque image sur la tour entiere. Une variable heritee
 * recalcule le style de tout le sous-arbre (bulles animees, dessin de la machine) : 45-50 images/s au lieu de 60.
 * La hauteur du liquide s'ecrit donc DIRECTEMENT sur .tmm-liq.
 */
const ui = lireUiComplet();
const pages = lirePagesMeta();
const css = readFileSync(new URL("../public/soreal-idle-machine.css", import.meta.url), "utf8");

const m = ui.match(/function poserTubeTmIdleV1_\(barreEl,largeur\)\{[\s\S]*?\n      \}/);
assert.ok(m, "poserTubeTmIdleV1_ doit exister");
assert.ok(!/setProperty\(\s*'--fill'/.test(m[0]), "le niveau du tube ne doit plus passer par une variable CSS heritee");
assert.ok(/\.tmm-liq/.test(m[0]) && /style\.height/.test(m[0]), "la hauteur doit s'ecrire directement sur .tmm-liq");

assert.ok(!/--fill/.test(css), "la feuille de la machine ne doit plus lire --fill");
assert.ok(/\.tmm-liq\{[^}]*height:0%/.test(css), "hauteur de depart du liquide dans la feuille");

assert.ok(/class="tmm-liq" style="height:'\+largeur\.toFixed\(2\)\+'%"/.test(pages), "la page dessine le liquide a sa hauteur (redessin sans saut)");
assert.ok(!/style="--fill:/.test(pages), "la tour ne porte plus --fill");

console.log("idle-time-machine-tube-fluide-v1 OK");

/* Plus de recul de barre a la reponse du moteur : l'ecart fond en douceur au lieu de sauter. */
assert.ok(/function decalageBarreTmIdleV1_\(/.test(ui), "decalage visuel qui fond");
assert.ok(/__tmCorr=\{d:ecart/.test(ui), "le patch du moteur transforme l'ecart en decalage");
assert.ok(/Math\.abs\(ecart\)>ECART_MAX_DECALAGE_TM_V1/.test(ui), "un grand ecart (niveau gagne, refus) n'est jamais lisse");
console.log("recul de barre OK");
