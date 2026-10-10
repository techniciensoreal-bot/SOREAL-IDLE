import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit de la page Aventure (Norman, 2026-10-10 : « il redessine la page », mesuré sur la partie B copiée de la partie A) : le journal de combat remplaçait ses 80 lignes à chaque nouvelle ligne, la note de combat était
 * remplacée chaque seconde, le titre du sac (icône dessinée) et la corbeille étaient recréés à chaque mise à jour (clignotement de l'inventaire), les cases du sac réécrivaient leurs attributs à l'identique, le reflet
 * des tuiles du haut animait « left » (mise en page à chaque image). Plus de popup quand on fuit ; ordre des barres Énergie, Magie, 3e ressource, Vie même quand une barre revient.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
assert.ok(ui.includes("host.__htmlLignesV1") && ui.includes("host.insertAdjacentHTML('beforeend',nouvelles[i])"), "journal incrémental");
assert.ok(ui.includes("function poserNoteCombatAdventureIdleV1_(") && !/noteOuBoutonEl\.outerHTML=\s*'<div class="soreal-idle-adventure-fight-note-v1">⚔️ Combat/.test(ui), "note de combat écrite en place");
assert.ok(ui.includes("titreSac.dataset.sacV160!==cleTitre") && ui.includes("!trashActuelV165.isEqualNode(trashSuivantV165)"), "titre du sac et corbeille non recréés à l'identique");
assert.ok(ui.includes("if(node.dataset.slotIndex!==String(desc.index))node.dataset.slotIndex=String(desc.index);"), "attributs des cases du sac écrits seulement s'ils changent");
assert.ok(!/@keyframes sorealTuileReflet\{[^}]*left:/.test(themes) && themes.includes("@keyframes sorealTuileReflet{0%,70%{transform:translateX(-158%) skewX(-18deg)}"), "reflet des tuiles par transform");
assert.ok(!ui.includes("'🏃 Fuite · combat interrompu.'\n          );\n\n          ajouterLogCombatIdleV70_") , "plus de message flottant à la fuite");
assert.ok(ui.includes("ajouterLogCombatIdleV70_(\n            'system',\n            '🏃 Fuite : combat interrompu.'"), "l'entrée du journal de combat reste");
assert.ok(hud.includes("Énergie, Magie, 3e ressource, puis Vie") && hud.includes("cum+=pas>0?pas:p.offsetHeight+3"), "ordre des barres conservé quand une barre revient");
console.log("idle-audit-aventure-redessin-v1: OK");
