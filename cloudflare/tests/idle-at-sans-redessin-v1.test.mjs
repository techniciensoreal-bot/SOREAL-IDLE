import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « Entraînements avancés : quand on place de l'énergie, la feuille se redessine parfois ». Cause : après chaque réponse du serveur, l'écran était comparé à la réponse ; la moindre différence (Target tapé non
 * connu de l'écran, énergie que le serveur passe à la ligne suivante avec Advance Energy, énergie retirée au Target atteint) déclenchait le rendu COMPLET de la page. Quand SEUL l'Entraînement avancé diffère, la page n'est plus
 * redessinée : l'état serveur est adopté et ses lignes sont mises à jour sur place. Et « supprime la phrase « Chaque compétence progresse avec sa propre énergie… » » (Norman, même jour).
 */
const src = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// 1. Comparaison par système
const debut = src.indexOf("function empreinteAllocationsMetaV1_(j){");
const fin = src.indexOf("function niveauxAugmentsMetaV1_(j){");
assert.ok(debut > 0 && fin > debut);
const { systemesDifferents, empreinte } = new Function(src.slice(debut, fin) + "\nreturn {systemesDifferents:systemesDifferentsMetaV1_,empreinte:empreinteAllocationsMetaV1_};")();
const sys = (id, allocation, data) => ({ id, state: { allocation, data } });
const base = () => ({ systemes: { systems: [
  sys("ngu", { energy: 100, magic: 0 }, {}),
  sys("advancedTraining", { energy: 500 }, { tracks: { power: { energy: 500, target: 0 }, toughness: { energy: 0, target: 0 } } }),
  sys("timeMachine", { energy: 0, magic: 0 }, {})
] } });
{
  const a = base(), b = base();
  assert.deepEqual(systemesDifferents(a, b), [], "identiques : aucune différence");
  assert.equal(empreinte(a), empreinte(b));
  // Target tapé que l'écran ne connaissait pas
  b.systemes.systems[1].state.data.tracks.power.target = 20;
  assert.deepEqual(systemesDifferents(a, b), ["advancedTraining"], "Target : seul l'Entraînement avancé diffère");
  // énergie passée à la ligne suivante par Advance Energy
  const c = base();
  c.systemes.systems[1].state.data.tracks.power.energy = 0;
  c.systemes.systems[1].state.data.tracks.toughness.energy = 500;
  assert.deepEqual(systemesDifferents(a, c), ["advancedTraining"], "énergie déplacée : seul l'Entraînement avancé diffère");
  // un autre système diffère aussi : rendu complet comme avant
  const d = base();
  d.systemes.systems[0].state.allocation.energy = 40;
  d.systemes.systems[1].state.data.tracks.power.target = 20;
  assert.deepEqual(systemesDifferents(a, d), ["ngu", "advancedTraining"], "plusieurs systèmes : le rendu complet reste");
  // listes non comparables
  const e = base(); e.systemes.systems.pop();
  assert.equal(systemesDifferents(a, e), null);
  assert.equal(systemesDifferents(a, { systemes: {} }), null);
}

// 2. Branchement : rendu complet seulement si autre chose que l'Entraînement avancé diffère
assert.ok(src.includes("const seulEntrainementAvance=Boolean(differents&&differents.length&&differents.every(function(id){return id==='advancedTraining';}));"), "détection : seul l'Entraînement avancé");
assert.ok(src.includes("if(!seulEntrainementAvance&&empreinteAllocationsMetaV1_(j)!==empreinteAllocationsMetaV1_(srv)){"), "pas de rendu complet dans ce cas");
assert.ok(src.includes("if(seulEntrainementAvance)patcherAdvancedTrainingIdleV1_(j);"), "mise à jour sur place des lignes");
const patch = src.slice(src.indexOf("function patcherAdvancedTrainingIdleV1_(j){"), src.indexOf("function pageAdvancedTrainingIdleV1_(j){"));
assert.ok(patch.includes("document.activeElement!==champ") && !/createElement|innerHTML|replaceWith|rendreIdleEtat_|rafraichirMenuRacine/.test(patch), "aucun nœud recréé, aucun rendu ; un champ en cours de saisie n'est pas touché");
assert.ok(patch.includes("d.atN=String(av.n)") && patch.includes("d.atCible=String(av.cible)"), "repère des barres remis à jour");
// 3. Le Target est connu de l'écran aussitôt
assert.ok(src.includes("if(pT)pT.target=n;") && src.includes("ligneT.dataset.atCible=String(n);"), "Target adopté tout de suite par l'écran");
// 4. Phrase supprimée, partout
assert.ok(!src.includes("Chaque compétence progresse avec sa propre énergie. Les niveaux montent"), "phrase retirée de la page");
assert.ok(!readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8").includes("Chaque compétence progresse avec sa propre énergie. Les niveaux montent"), "et du dictionnaire anglais");
console.log("idle-at-sans-redessin-v1: OK");
