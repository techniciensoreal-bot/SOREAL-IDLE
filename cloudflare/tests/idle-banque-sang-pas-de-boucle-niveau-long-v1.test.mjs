import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-01) : « Dans Blood Magic, braquage, j'ai placé ma magie et l'animation s'est déclenchée alors qu'il me fallait environ 2 minutes pour accomplir le rituel. »
 * L'animation de la banque du sang (modules/sang-rituel-decor-v1.js, banqueCadre) ne part qu'à un VRAI recommencement de niveau ; elle ne joue en boucle continue que si les niveaux sont plus courts
 * que l'animation (BANQUE_TOTAL). Deux chemins la lançaient aussi pour un niveau long : (1) la phase du rituel inconnue un instant (vue retirée par une synchro), (2) deux « recommencements » détectés
 * à moins de 10 s d'intervalle (secousse de la synchro) -> « durée mesurée » courte. Ce test rejoue la vraie fonction sur une fausse scène.
 */
const src = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
const coupe = (a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); assert.ok(i >= 0 && j > i, "bloc introuvable : " + a); return src.slice(i, j); };
const code = [
  coupe("var vueRituelMemo={};", "function phaseBarre(sc){"),
  coupe("function phaseBarre(sc){", "/*\n * LA SANGSUE EST UNE IMAGE"),
  coupe("var BANQUE_N=18,", "function banqueNeige(sc)").replace(/^[^\n]*\n/, (l) => l),
].join("\n");
// banqueIndex vient après la ligne des constantes ; coupe() la contient déjà.
const fabrique = new Function("window", "document", "performance", code + "\nreturn {banqueCadre:banqueCadre,banqueDureeNiveau:banqueDureeNiveau,TOTAL:BANQUE_TOTAL};");

function monde({ visuel }) {
  const etat = { __bloodMagicVisualV1: visuel ? { bloodBank: visuel } : null };
  const win = { __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => etat }, matchMedia: () => ({ matches: false }) };
  const perf = { t: 0, now() { return this.t; } };
  const doc = { getElementById: () => ({ textContent: "⏱ 2 min avant le prochain rituel complété" }) };
  return { etat, win, perf, doc, ...fabrique(win, doc, perf) };
}
function scene(m) {
  return {
    querySelector: (s) => (/saigne-v1/.test(s) ? {} : null),   // le tuyau saigne : le rituel progresse
    getAttribute: (a) => (a === "data-bm-id" ? "bloodBank" : null),
  };
}
const index = (m, sc) => m.banqueCadre(sc, m.perf.now());

// 1. Cas normal : niveau de 120 s, phase connue : image fixe (0) pendant tout le niveau.
{
  const m = monde({ visuel: { secondsPerCompletion: 120, etaSeconds: 120, at: 1 } });
  const sc = scene(m);
  for (let t = 0; t <= 40000; t += 250) { m.perf.t = t + 1; assert.equal(index(m, sc), 0, "niveau de 120 s : image fixe à " + t + " ms"); }
}

// 2. Phase inconnue un instant (vue retirée par une synchro, mémoire de phaseRituelEtat périmée) sur un niveau de 120 s : AVANT le correctif la scène jouait en boucle continue.
{
  const m = monde({ visuel: { secondsPerCompletion: 120, etaSeconds: 120, at: 1 } });
  const sc = scene(m);
  m.perf.t = 101; index(m, sc);                       // la vue est connue : durée mémorisée
  m.etat.__bloodMagicVisualV1 = null;                 // la synchro retire la vue
  let vu = new Set();
  for (let t = 4000; t <= 30000; t += 250) { m.perf.t = t + 1; vu.add(index(m, sc)); }
  assert.deepEqual([...vu], [0], "niveau long, vue absente : aucune image de l'animation");
}

// 3. Deux « recommencements » rapprochés (secousse de synchro) : la durée mesurée de 2 s ne doit pas lancer la boucle continue sur un niveau de 120 s.
{
  const m = monde({ visuel: { secondsPerCompletion: 120, etaSeconds: 30, at: 1 } });   // phase 0,75 à t = 0
  const sc = scene(m);
  let vu = new Set();
  m.perf.t = 1; vu.add(index(m, sc));
  m.etat.__bloodMagicVisualV1.bloodBank = { secondsPerCompletion: 120, etaSeconds: 100, at: 1001 };   // la synchro ramène la phase à 0,17 : « recommencement » n°1
  m.perf.t = 1001; vu.add(index(m, sc));
  m.etat.__bloodMagicVisualV1.bloodBank = { secondsPerCompletion: 120, etaSeconds: 20, at: 2001 };    // phase 0,83
  m.perf.t = 2001; vu.add(index(m, sc));
  m.etat.__bloodMagicVisualV1.bloodBank = { secondsPerCompletion: 120, etaSeconds: 100, at: 3001 };   // retombe à 0,17 : « recommencement » n°2, 2 s après le premier
  for (let t = 3000; t <= 20000; t += 250) { m.perf.t = t + 1; vu.add(index(m, sc)); }
  assert.ok([...vu].every((k) => k === 0 || (m.perf.t - 3000 > 0 && k <= 17)), "indices valides");
  // Après le 2e recommencement, la scène joue UNE fois son cycle depuis __bt0 (déjà le comportement voulu pour un vrai recommencement) mais jamais en boucle continue :
  const apres = new Set();
  for (let t = 14000; t <= 60000; t += 250) { m.perf.t = t + 1; apres.add(index(m, sc)); }
  assert.deepEqual([...apres], [0], "après un cycle, retour à l'image fixe (pas de boucle continue pour un niveau long)");
}

// 4. Niveaux courts (2 s) : la boucle continue reste (comportement existant : « l'animation de la banque du sang ne se joue pas », 2026-10-13).
{
  const m = monde({ visuel: { secondsPerCompletion: 2, etaSeconds: 2, at: 1 } });
  const sc = scene(m);
  const vu = new Set();
  for (let t = 0; t <= 20000; t += 100) { m.perf.t = t + 1; vu.add(index(m, sc)); }
  assert.ok(vu.size > 3, "niveau très court : l'animation tourne en boucle");
}
console.log("idle-banque-sang-pas-de-boucle-niveau-long-v1: OK");
