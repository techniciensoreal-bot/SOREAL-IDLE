import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-09) : « l'animation de renaissance avec l'horloge en zoom doit aussi être utilisée quand on lance un défi ». Lancer un défi fait renaître : même voyage dans le temps (horloge qui fonce vers l'écran, éclair, ouverture sur la borne).
 * Pas de fenêtre de Renaissance à cloner : l'horloge de la carte est reconstruite au milieu de l'écran (voyageTempsDefiIdleV1_). Le voyage est résolu par la réponse du moteur : réussi -> fin(), refus / erreur / action non envoyée -> annuler().
 */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const ren = lire("public/modules/ui-renaissance-v1.js");
assert.ok(ren.includes("function voyageTempsRenaissanceIdleV1_(sourceDonnee)") && ren.includes("sourceDonnee||document.querySelector('#sorealIdleRenaissanceModalV63 .rn-icone')"), "le voyage accepte une horloge fournie ; sans elle, celle de la fenêtre (Renaissance inchangée)");
assert.ok(/const voyage=voyageTempsRenaissanceIdleV1_\(\);\s*fermerPopupRenaissanceIdleV63_\(\);/.test(ren), "la Renaissance appelle toujours le voyage comme avant");
const d = ren.slice(ren.indexOf("function voyageTempsDefiIdleV1_"), ren.indexOf("function executerRenaissanceIdleV63_"));
assert.ok(d.includes("api.carte(") && d.includes("querySelector('.rn-icone')") && d.includes("voyageTempsRenaissanceIdleV1_(horloge)") && d.includes("hote.remove()"), "horloge reconstruite, copiée par le calque, puis retirée");
assert.ok(d.includes("visibility:hidden") && d.includes("pointer-events:none"), "la source ne se voit ni ne se touche");
assert.ok(ren.includes("voyageTempsDefiIdleV1_:voyageTempsDefiIdleV1_"), "exposé dans REG");

const defis = lire("public/modules/defis-page-v1.js");
const f = defis.slice(defis.indexOf("function demarrerDefiIdleV1_"), defis.indexOf("window.__demarrerDefiIdleV1__="));
assert.ok(f.includes("if(window.__SOREAL_IDLE_VOYAGE_DEFI_V1__)return;"), "un seul lancement à la fois");
assert.ok(f.indexOf("voyageTempsDefiIdleV1_()") < f.indexOf("jouerEffetAudioIdleV199_('timeMachine')") && f.indexOf("jouerEffetAudioIdleV199_('timeMachine')") < f.indexOf("actionMetaIdleV130_("), "voyage créé, bruit de machine, puis l'ordre");

const meta = lire("public/modules/meta-progression-v130.js");
assert.ok(meta.includes("function voyageDefiResoudreV1_(payload,reussi)") && meta.includes("if(reussi)v.fin();else v.annuler();"), "résolution du voyage");
assert.ok(meta.includes("voyageDefiResoudreV1_(payload,Boolean(res&&res.ok&&res.joueur&&res.resultat&&res.resultat.started));"), "réponse du moteur : réussi seulement si le défi a démarré");
assert.equal((meta.match(/voyageDefiResoudreV1_\(payload,false\)/g) || []).length, 2, "action non envoyée et erreur : le voyage s'efface");
assert.ok(/if\(!\(payload&&payload\.action==='challenge'&&payload\.mode==='start'\)\)return;/.test(meta), "seul le lancement d'un défi est concerné (arrêt, validation : aucun voyage)");
console.log("idle-defi-voyage-temps-v1: OK");
