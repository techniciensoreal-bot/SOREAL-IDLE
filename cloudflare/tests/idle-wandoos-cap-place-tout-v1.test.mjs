import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Bouton CAP de Wandoos (Norman, 2026-11-03 : « il ne place pas toute mon énergie »). Mesure au vrai moteur avec le vrai module de la page : CAP place la quantité qui atteint le cap
 * (50 niveaux/s) ; si l'énergie libre est SOUS ce qu'il faut, TOUTE l'énergie libre est placée (aucun reliquat, quel que soit l'ordre de grandeur) ; si elle est AU-DESSUS, seul le cap
 * est placé (conception : le reste ne génèrerait aucun niveau de plus, comme le Cap de Basic Training) et le reste demeure libre, sans perte d'arrondi.
 */
const src = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const now = 100_000_000;
function essai(libre, difficulte, magie = false, libreVue = undefined, mode = "cap", saisie = undefined, vivante = undefined, deja = 0, secondes = 7200) {
  let state = normalizeIdleNguState({}, context, now);
  state.adventure.unlockFlags.wandoos = true;
  state = normalizeIdleNguState(state, context, now);
  state.runStartedAt = now - secondes * 1000;
  state.difficulty = difficulte;
  state.systems.bloodMagic.unlocked = true;
  state.resources.energy.cap = 9e18;
  state.resources.energy.current = libre;
  state.systems.wandoos.allocation.energy = deja;
  const stockage = { soreal_idle_wandoos_allumage_v1: String(state.runStartedAt) };
  if (saisie !== undefined) stockage.soreal_idle_wandoos_saisie_v1 = String(saisie);
  const actions = [];
  const vue = () => idleNguSnapshot(state, context, now).wandoosView;
  const joueur = () => ({
    systems: [
      { id: "wandoos", unlock: { unlocked: true }, state: { active: true, allocation: { ...state.systems.wandoos.allocation }, data: { os: "98" } } },
      { id: "bloodMagic", unlock: { unlocked: true } }
    ],
    systemes: { wandoosView: vue() }
  });
  const j = joueur();
  j.energie = vivante !== undefined ? vivante : libre;                        /* énergie libre VIVANTE (avancée à chaque tick par la page) */
  j.systemes.resources = { magic: { current: 0 } };
  const f = {
    localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } },
    __actionMetaIdleV130__: (p) => { actions.push(JSON.parse(JSON.stringify(p))); },
    __SOREAL_IDLE_META_HOST_V130__: { idleHtml_: String, formatGrandNombreIdleV70_: String, entetePageIdleV28_: String, getIdleEtat: () => j },
    __SOREAL_IDLE_META_V130__: { systemeMetaParIdIdleV130_: (jj, id) => jj.systems.find((x) => x.id === id) || null },
    setInterval: () => 1, clearInterval() {}, Date: { now: () => 1_000_000 }
  };
  f.window = f;
  f.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({}), querySelector: () => null, addEventListener() {} };
  vm.runInNewContext(src, f, { filename: "wandoos-retro-v1.js" });
  if (libreVue !== undefined) j.systemes.wandoosView.energieLibre = libreVue;   /* énergie libre lue dans une synchro PÉRIMÉE (jusqu'à ~4 s) : la page croit en avoir moins (ou plus) que le moteur */
  const cap = j.systemes.wandoosView.capEnergie;
  f.__SOREAL_IDLE_WANDOOS_V1__.place("energy", mode);
  if (mode === "plus" || actions.length) assert.ok(actions.length <= 1);
  assert.equal(actions.length, 1, "un seul envoi (même si l'énergie libre lue par la page est périmée, jusqu'à 0)");
  state = applyIdleNguAction(state, actions[0], context, now).state;
  return { cap, envoye: actions[0].value, alloue: state.systems.wandoos.allocation.energy, libreApres: state.resources.energy.current, vitesse: vue().vitesseEnergie };
}

// Normal : cap = 1e9. Libre sous le cap, à plusieurs ordres de grandeur : tout est placé.
for (const libre of [1, 1e3, 12345678, 999999999]) {
  const r = essai(libre, "normal");
  assert.equal(r.alloue, libre, "énergie libre sous le cap : TOUTE l'énergie est placée (" + libre + ")");
  assert.equal(r.libreApres, 0, "aucun reliquat");
}
// Libre au-dessus du cap : exactement le cap, 50 niveaux/s, et le reste reste libre au chiffre près.
for (const libre of [2e9, 1e12, 1e15, 8e18]) {
  const r = essai(libre, "normal");
  assert.equal(r.alloue, r.cap, "au-dessus du cap : le cap exact est placé");
  assert.equal(r.vitesse, 50, "50 niveaux par seconde");
  assert.equal(r.libreApres, libre - r.cap, "le reste demeure libre, sans perte");
}
// Extrême : cap = 1e33, très au-dessus de toute l'énergie possible : TOUT est placé, même près du maximum du moteur.
for (const libre of [1e6, 1e15, 8e18]) {
  const r = essai(libre, "extreme");
  assert.equal(r.cap, 1e33);
  assert.equal(r.alloue, libre, "énergie libre sous un cap énorme : tout est placé");
  assert.equal(r.libreApres, 0, "aucun reliquat");
}
// Norman (2026-11-03) : « tant que le cap n'est pas atteint, le bouton cap doit mettre tout ce qui est en stock ; si on possède plus que ce qu'il faut, elle ne prendra que ce dont elle a besoin ».
// La page lit l'énergie libre dans la dernière synchro (jusqu'à ~4 s) : périmée, elle bornait la demande (reliquat, voire AUCUN envoi). CAP demande le cap lui-même ; le moteur borne au libre réel.
for (const [libre, vue, attendu] of [[5e8, 0, 5e8], [5e8, 1e8, 5e8], [999999999, 10, 999999999], [3e9, 1e8, 1e9], [3e9, 0, 1e9]]) {
  const r = essai(libre, "normal", false, vue);
  assert.equal(r.alloue, attendu, "synchro périmée (libre lu " + vue + ", réel " + libre + ") : " + (libre < 1e9 ? "tout le stock" : "seulement le cap"));
  assert.equal(r.libreApres, libre - attendu, "aucun reliquat sous le cap, reste exact au-dessus");
}
// Touche « + » (même schéma) : la page borne SON AFFICHAGE avec l'énergie vivante, mais envoie la quantité souhaitée ; le moteur borne à ce qui est réellement libre.
// (libre réel, vue périmée, vivante, saisie, attendu)
for (const [libre, vue, vivante, saisie, attendu] of [[5e8, 0, 5e8, "3e8", 3e8], [5e8, 1e12, 5e8, "3e8", 3e8], [1e6, 1e12, 1e6, "5e6", 1e6], [1e6, 0, 9.9e5, "5e6", 1e6], [1e6, 0, 0, "5e6", 1e6], [2e6, 0, 1.5e6, "1e6", 1e6]]) {
  const r = essai(libre, "normal", false, vue, "plus", saisie, vivante);
  assert.equal(r.alloue, attendu, "+ : libre réel " + libre + ", vue périmée " + vue + ", vivante " + vivante + ", saisie " + saisie);
}
// Norman (2026-11-03) : « si j'ai mis 15 M et que le cap est à 14 M, CAP ne garde que ce qui est nécessaire et me rend la différence ».
for (const [deja, libre] of [[1.5e9, 0], [1.5e9, 7e8], [4e9, 123]]) {
  const r = essai(libre, "normal", false, undefined, "cap", undefined, undefined, deja);
  assert.equal(r.alloue, r.cap, "placé " + deja + " > cap : retombe exactement au cap");
  assert.equal(r.libreApres, libre + (deja - r.cap), "l'excès redevient libre (rendu au joueur)");
}
// Placé sous le cap : on complète avec le libre ; libre insuffisant : tout le libre.
{
  let r = essai(5e8, "normal", false, undefined, "cap", undefined, undefined, 4e8);
  assert.equal(r.alloue, 9e8); assert.equal(r.libreApres, 0, "libre insuffisant : tout le libre");
  r = essai(5e8, "normal", false, undefined, "cap", undefined, undefined, 8e8);
  assert.equal(r.alloue, 1e9, "libre suffisant : atteint le cap"); assert.equal(r.libreApres, 3e8);
}
// Pendant le chargement : le cap est celui du moment (plus grand) ; placé = ancien cap final > cap(boot) ne se produit pas, mais placé au-dessus du cap COURANT retombe à lui.
{
  const r = essai(1e15, "normal", false, undefined, "cap", undefined, undefined, 0, 1800);
  assert.ok(r.cap > 1e9 && r.alloue === r.cap && Math.abs(r.vitesse - 50) < 1e-6, "boot à 50 % : cap courant (x2), 50 niveaux/s");
  const r2 = essai(10, "normal", false, undefined, "cap", undefined, undefined, 5e9, 1800);
  assert.equal(r2.alloue, r2.cap, "boot : placé au-dessus du cap courant retombe à ce cap");
  assert.equal(r2.libreApres, 10 + 5e9 - r2.cap);
}
const code = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
assert.ok(code.includes("var envoyee=mode==='cap'?capServeur:mode==='plus'?actuelle+montant:cible;") && code.includes("value:envoyee}"), "CAP envoie le plafond, + la quantité souhaitée : borné par le moteur");
// Affichage : le cap du bouton change a chaque synchro pendant le chargement, reecrit en place (aucun redessin du poste, regle n4), compare a la derniere valeur ecrite.
assert.ok(code.includes("data-wd-cap=") && code.includes("majCapEnPlace_(neuves)") && code.includes("capEcrit_[r]!==t"), "cap reecrit en place");
assert.ok(code.includes("(<small data-wd-cap=\"[a-z]+\">)[^<]*"), "le cap ne compte pas dans la signature du poste");

console.log("idle-wandoos-cap-place-tout-v1: OK");
