import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « Sur PC dans SOREAL IDLE, quand je maintiens A pour absorber les boosts, la page me replace toujours plus bas que
 * l'inventaire une fois l'action réalisée. » Le rendu complet rétablit désormais la position du SAC À L'ÉCRAN (ancre), pas un scrollY absolu.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const ancre = ui.match(/function ancreSacIdleV1_\(\)\{[\s\S]*?\n      \}\n/)[0];
const restaure = ui.match(/function restaurerAncreSacIdleV1_\([\s\S]*?\n      \}\n/)[0];

// Ancre : seulement si le sac est à l'écran.
function faireDoc(haut, bas) {
  return { getElementById: () => ({ getBoundingClientRect: () => ({ top: haut, bottom: bas }) }) };
}
const api = (doc, win) => new Function("document", "window", "setTimeout", ancre + restaure + "return {ancreSacIdleV1_,restaurerAncreSacIdleV1_};")(doc, win, () => 0);
{
  const win = { innerHeight: 800 };
  assert.deepEqual({ ...api(faireDoc(200, 1400), win).ancreSacIdleV1_() }, { haut: 200 }, "sac à l'écran : ancre mémorisée");
  assert.equal(api(faireDoc(-2000, -100), win).ancreSacIdleV1_(), null, "sac hors écran (au-dessus) : pas d'ancre");
  assert.equal(api(faireDoc(1200, 2000), win).ancreSacIdleV1_(), null, "sac hors écran (en dessous) : pas d'ancre");
}

// Restauration : après le rendu le sac est 350 px plus bas -> la page est remontée de 350 px ; joueur qui défile : on ne touche plus.
{
  let hautSac = 550; // avant : 200, après le rendu : 550
  let scrollY = 1000;
  const doc = { getElementById: () => ({ getBoundingClientRect: () => ({ top: hautSac - (scrollY - 1000), bottom: 9999 }) }) };
  const win = { get scrollY() { return scrollY; }, scrollTo: (x, y) => { scrollY = y; }, innerHeight: 800 };
  const { restaurerAncreSacIdleV1_ } = api(doc, win);
  restaurerAncreSacIdleV1_({ haut: 200 }, 0, 1000);
  assert.equal(scrollY, 1350, "la page a suivi le sac (il était 350 px plus bas)");
}

// Câblage dans le rendu complet
assert.match(ui, /const idleAncreSacAvantRenduV1=ancreSacIdleV1_\(\);/);
assert.match(ui, /restaurerAncreSacIdleV1_\(\s*idleAncreSacAvantRenduV1,\s*idleScrollXAvantRenduV1,\s*idleScrollYAvantRenduV1\s*\);/);

console.log("idle-inventory-scroll-anchor-v1: OK");
